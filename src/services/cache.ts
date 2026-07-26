/**
 * 四级缓存引擎（移植自原缓存模块，保持 IndexedDB 存储格式兼容）
 *
 *   L1 内存 Map（80 条上限，淘汰最早 20%）
 *   L2 IndexedDB（nk-hsr-cache/kv，条目 { data, exp }）
 *   L3 in-flight 去重（同 cacheKey 并发请求复用同一 Promise）
 *   L4 网络（15s 超时）
 */
import { NkError } from '../lib/errors';

export const CACHE_TTL = {
  /** manifest 10 分钟 */
  manifest: 10 * 60 * 1000,
  /** 角色/物品/名称数据 7 天（L1 内存支撑短期复用，长期保留无意义） */
  data: 7 * 24 * 60 * 60 * 1000,
} as const;

const DB_NAME = 'nk-hsr-cache';
const STORE = 'kv';
const DB_VER = 1;
const FETCH_TIMEOUT = 15000;
const MEM_MAX = 80;

interface CacheEntry {
  data: unknown;
  exp?: number;
}

/* ─── IndexedDB 引擎（所有操作失败静默降级，绝不抛出） ─── */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

const idb = {
  async get(key: string): Promise<CacheEntry | null> {
    try {
      const db = await openDb();
      return await new Promise((resolve) => {
        const rq = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        rq.onsuccess = () => resolve((rq.result as CacheEntry | undefined) ?? null);
        rq.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async put(key: string, entry: CacheEntry): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(entry, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve(); // 写入失败静默降级
      });
    } catch {
      /* 静默 */
    }
  },
  async del(key: string): Promise<void> {
    try {
      const db = await openDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      /* 静默 */
    }
  },
};

/* ─── 网络请求（最底层） ─── */

export async function fetchJSON<T>(url: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new NkError(`HTTP ${r.status}: ${url}`, true);
    const data = (await r.json()) as T;
    return data;
  } catch (e) {
    if (e instanceof NkError) throw e;
    if (e instanceof Error && (e.name === 'AbortError' || (e as DOMException).code === 20 /* ABORT_ERR */)) {
      throw new NkError(`Request timed out: ${url}`, true);
    }
    throw new NkError(e instanceof Error ? e.message || 'Network error' : 'Network error', true);
  } finally {
    clearTimeout(timer);
  }
}

/* ─── L1 内存缓存（SPA 生命周期内只请求一次） ─── */

const mem = new Map<string, unknown>();

function memSet(key: string, data: unknown): void {
  if (mem.size >= MEM_MAX) {
    // 淘汰最早的 20% 条目（角色 JSON ~200KB，总内存约 16MB 上限）
    const evict = Math.ceil(MEM_MAX * 0.2);
    const it = mem.keys();
    for (let i = 0; i < evict; i++) {
      const k = it.next().value;
      if (k !== undefined) mem.delete(k);
    }
  }
  mem.set(key, data);
}

export function memHas(key: string): boolean {
  return mem.has(key);
}

/** 供预取路径直接写入（跳过网络） */
export function memStore(key: string, data: unknown, ttl: number): void {
  memSet(key, data);
  void idb.put(key, { data, exp: Date.now() + ttl });
}

/** 检查条目是否已缓存（内存或 IDB，不含网络） */
export async function cacheHas(key: string): Promise<boolean> {
  if (mem.has(key)) return true;
  const entry = await idb.get(key);
  if (!entry) return false;
  if (entry.exp && Date.now() > entry.exp) {
    void idb.del(key);
    return false;
  }
  memSet(key, entry.data);
  return true;
}

/* ─── 带缓存的 fetch：内存 → IndexedDB → in-flight 去重 → 网络 ─── */

const pending = new Map<string, Promise<unknown>>();

export async function cachedFetch<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
  // L1: 内存
  if (mem.has(cacheKey)) return mem.get(cacheKey) as T;
  // L2: IndexedDB
  const entry = await idb.get(cacheKey);
  if (entry) {
    if (entry.exp && Date.now() > entry.exp) {
      void idb.del(cacheKey);
    } else {
      memSet(cacheKey, entry.data);
      return entry.data as T;
    }
  }
  // L3: in-flight 去重
  const inflight = pending.get(cacheKey);
  if (inflight) return inflight as Promise<T>;
  // L4: 网络
  const p = fetchJSON<T>(url)
    .then((data) => {
      memSet(cacheKey, data);
      void idb.put(cacheKey, { data, exp: Date.now() + ttl }); // 异步写入，不阻塞返回
      return data;
    })
    .finally(() => pending.delete(cacheKey));
  pending.set(cacheKey, p);
  return p;
}

/* ─── 清理非当前版本的旧条目（避免 IDB 无限膨胀） ─── */

export async function purgeStaleVersions(currentVersion: string): Promise<void> {
  if (!currentVersion) return;
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const allKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      const r = store.getAllKeys();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
    let deleted = 0;
    for (const key of allKeys) {
      if (typeof key !== 'string' || key === 'manifest') continue;
      // 匹配 char_4.3.1_xxx / item_4.3.1 / name_4.3.1_xxx 等
      const m = key.match(/_(\d+\.\d+(?:\.\d+)?)/);
      if (m && m[1] !== currentVersion) {
        store.delete(key);
        deleted++;
      }
    }
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    if (deleted > 0) console.debug(`[nk-cache] 清理 ${deleted} 条旧版本条目`);
  } catch {
    /* 静默降级 */
  }
}
