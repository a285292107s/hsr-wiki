/**
 * 请求缓存引擎（内存级）
 *
 *   L1 内存 Map（80 条上限，淘汰最早 20%）
 *   L2 in-flight 去重（同 cacheKey 并发请求复用同一 Promise）
 *   L3 网络（15s 超时）
 *
 * 数据均为同域静态 JSON（Vercel CDN 托管），跨刷新持久化由 HTTP 缓存承担，
 * 无需 IndexedDB 持久层（2026-08 精简，原 L2 IDB + TTL + 版本清理已移除）。
 */
import { NkError } from '../lib/errors';

const FETCH_TIMEOUT = 15000;
const MEM_MAX = 80;

/* ─── 网络请求（最底层） ─── */

async function requestText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new NkError(`HTTP ${r.status}: ${url}`, true);
    return await r.text();
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

export async function fetchJSON<T>(url: string): Promise<T> {
  const text = await requestText(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new NkError(`Invalid JSON: ${url}`, true);
  }
}

/** 纯文本获取（诊断页 atlas 解析等用途），复用 15s 超时与 NkError 包装 */
export function fetchText(url: string): Promise<string> {
  return requestText(url);
}

export interface ResourceStatus {
  ok: boolean;
  /** HTTP 状态码（网络失败/超时为 0） */
  status: number;
  /** 往返耗时 ms */
  ms: number;
}

/**
 * 资源可达性检查（Spine 审核台等诊断用途）：只取响应头不消费 body（立即取消传输，不产生下载流量）。
 * 不抛异常，超时/网络失败统一归一为 { ok:false, status:0 }，调用方按诊断语境解读。
 */
export async function fetchResourceStatus(url: string, timeoutMs = 15000): Promise<ResourceStatus> {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    try {
      // 只取响应头：取消 body 流，避免下载大文件（skel/png 可达数 MB）
      if (r.body && typeof r.body.cancel === 'function') r.body.cancel();
    } catch { /* 已消费或不可取消均静默 */ }
    return { ok: r.ok, status: r.status, ms: Math.round(performance.now() - t0) };
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0) };
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
export function memStore(key: string, data: unknown): void {
  memSet(key, data);
}

/* ─── 带缓存的 fetch：内存 → in-flight 去重 → 网络 ─── */

const pending = new Map<string, Promise<unknown>>();

async function cachedRequest<T>(
  url: string,
  cacheKey: string,
  load: (u: string) => Promise<T>,
): Promise<T> {
  // L1: 内存
  if (mem.has(cacheKey)) return mem.get(cacheKey) as T;
  // L2: in-flight 去重
  const inflight = pending.get(cacheKey);
  if (inflight) return inflight as Promise<T>;
  // L3: 网络
  const p = load(url)
    .then((data) => {
      memSet(cacheKey, data);
      return data;
    })
    .finally(() => pending.delete(cacheKey));
  pending.set(cacheKey, p);
  return p;
}

export function cachedFetch<T>(url: string, cacheKey: string): Promise<T> {
  return cachedRequest(url, cacheKey, (u) => fetchJSON<T>(u));
}