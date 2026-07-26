/**
 * cache.ts 四级缓存引擎测试
 *
 * 模块级状态（mem Map / pending / failCount / dbPromise）通过
 * vi.resetModules() + 动态 import 获取全新实例隔离；
 * happy-dom v20 不提供 IndexedDB → 用最小内存 mock（见下文）验证 L2 逻辑，
 * mock 数据 Map 位于测试模块作用域，跨模块实例持久。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 全新模块实例（隔离 mem/pending/failCount） */
async function fresh() {
  vi.resetModules();
  return await import('../cache');
}

function okFetch(data: unknown) {
  return vi.fn(async () => ({ ok: true, status: 200, json: async () => data }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* ─── fetchJSON（L4 网络层） ─── */

describe('fetchJSON', () => {
  it('成功解析 JSON 并重置失败计数', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', okFetch({ a: 1 }));
    await expect(c.fetchJSON('https://static.nanoka.cc/x.json')).resolves.toEqual({ a: 1 });
  });

  it('HTTP 非 2xx → operational 错误（含状态码）', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));
    await expect(c.fetchJSON('https://x/404.json')).rejects.toMatchObject({
      name: 'NkError',
      operational: true,
      message: expect.stringContaining('HTTP 404'),
    });
  });

  it('网络异常包装为 operational 错误', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(c.fetchJSON('https://x/err.json')).rejects.toMatchObject({
      name: 'NkError',
      operational: true,
      message: 'Failed to fetch',
    });
  });

  it('15s 超时 → AbortError 转运营错误', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () => {
          const e = new Error('The operation was aborted');
          e.name = 'AbortError';
          rej(e);
        });
      }),
    ));
    vi.useFakeTimers();
    const p = c.fetchJSON('https://x/slow.json');
    // 先挂断言再推进时钟，避免 reject 发生在 handler 挂载前触发 unhandled rejection
    const assertion = expect(p).rejects.toMatchObject({
      name: 'NkError',
      operational: true,
      message: expect.stringContaining('timed out'),
    });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
  });
});

/* ─── L1 内存 + memStore / memHas ─── */

describe('L1 内存缓存', () => {
  it('memStore 后 memHas 为 true，cachedFetch 命中内存不发请求', async () => {
    const c = await fresh();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    c.memStore('mem_key', { m: 1 }, 60_000);
    expect(c.memHas('mem_key')).toBe(true);
    await expect(c.cachedFetch('https://x/m.json', 'mem_key', 60_000)).resolves.toEqual({ m: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('内存淘汰：超过 80 条后最早 20% 被清除', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    for (let i = 0; i < 80; i++) c.memStore(`evict_${i}`, i, 60_000);
    expect(c.memHas('evict_0')).toBe(true);
    c.memStore('evict_80', 80, 60_000); // 触发淘汰 evict_0..15
    expect(c.memHas('evict_0')).toBe(false);
    expect(c.memHas('evict_15')).toBe(false);
    expect(c.memHas('evict_16')).toBe(true);
    expect(c.memHas('evict_80')).toBe(true);
  });
});

/* ─── 最小内存 IndexedDB mock（happy-dom v20 不提供 IDB） ─── */

type MockHandler = (() => void) | null;

class MockRequest {
  result: unknown;
  error: unknown = null;
  onsuccess: MockHandler = null;
  onerror: MockHandler = null;
  constructor(result?: unknown) {
    this.result = result;
    // onsuccess 在调用方同步赋值后才触发（微任务）
    queueMicrotask(() => this.onsuccess?.());
  }
}

class MockObjectStore {
  constructor(private map: Map<string, unknown>) {}
  get(key: IDBValidKey) { return new MockRequest(this.map.get(String(key))); }
  put(value: unknown, key: IDBValidKey) { this.map.set(String(key), value); return new MockRequest(key); }
  delete(key: IDBValidKey) { this.map.delete(String(key)); return new MockRequest(undefined); }
  getAllKeys() { return new MockRequest([...this.map.keys()]); }
}

class MockTransaction {
  onerror: MockHandler = null;
  private completeHandler: MockHandler = null;
  private fired = false;
  constructor(private store: MockObjectStore) {}
  objectStore(_name: string) { return this.store; }
  // 真实 IDB 在事务内所有操作完成后触发 oncomplete；此处简化为赋值后触发一次
  // （purgeStaleVersions 在 await 之后才赋值 oncomplete，故不能用构造函数触发）
  set oncomplete(fn: MockHandler) {
    this.completeHandler = fn;
    if (fn && !this.fired) {
      this.fired = true;
      queueMicrotask(() => fn());
    }
  }
  get oncomplete(): MockHandler { return this.completeHandler; }
}

class MockDb {
  constructor(private store: MockObjectStore) {}
  createObjectStore(_name: string) { return this.store; }
  transaction(_name: string, _mode?: string) { return new MockTransaction(this.store); }
}

/** dbs Map 位于测试模块作用域 → vi.resetModules() 后仍然持久，模拟 IDB 跨会话可见 */
const mockDbs = new Map<string, Map<string, unknown>>();

const mockIndexedDB = {
  open(name: string, _version?: number) {
    let storeMap = mockDbs.get(name);
    const isNew = !storeMap;
    if (!storeMap) {
      storeMap = new Map();
      mockDbs.set(name, storeMap);
    }
    const req = {
      result: new MockDb(new MockObjectStore(storeMap)),
      error: null as unknown,
      onupgradeneeded: null as MockHandler,
      onsuccess: null as MockHandler,
      onerror: null as MockHandler,
    };
    queueMicrotask(() => {
      if (isNew) req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  },
};

beforeEach(() => {
  vi.stubGlobal('indexedDB', mockIndexedDB);
});

/* ─── L2 IndexedDB ─── */

describe('L2 IndexedDB', () => {
  it('写入后新模块实例命中 IDB（不发请求）', async () => {
    const c1 = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    c1.memStore('idb_key', { from: 'idb' }, 60_000);
    await sleep(100); // 等待 fire-and-forget 的 IDB 写入完成
    vi.resetModules();
    const c2 = await import('../cache');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(c2.cachedFetch('https://x/b.json', 'idb_key', 60_000)).resolves.toEqual({ from: 'idb' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('过期条目被删除并回退网络', async () => {
    const c1 = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    c1.memStore('exp_key', { old: true }, -5_000); // exp = now - 5s
    await sleep(100);
    vi.resetModules();
    const c2 = await import('../cache');
    const fetchMock = okFetch({ fresh: true });
    vi.stubGlobal('fetch', fetchMock);
    await expect(c2.cachedFetch('https://x/c.json', 'exp_key', 60_000)).resolves.toEqual({ fresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('cacheHas：内存命中 / IDB 有效（并提升内存）/ IDB 过期', async () => {
    const c1 = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    c1.memStore('has_valid', 1, 60_000);
    c1.memStore('has_expired', 1, -5_000);
    await sleep(100);
    expect(await c1.cacheHas('has_valid')).toBe(true); // 内存命中
    vi.resetModules();
    const c2 = await import('../cache');
    expect(await c2.cacheHas('has_valid')).toBe(true); // IDB 命中
    expect(c2.memHas('has_valid')).toBe(true); // 提升到内存
    expect(await c2.cacheHas('has_expired')).toBe(false); // 过期
    expect(await c2.cacheHas('has_never')).toBe(false); // 不存在
  });
});

/* ─── L3 in-flight 去重 + L4 写回 ─── */

describe('L3 in-flight 去重 / L4 写回', () => {
  it('并发同 key 请求共享同一 Promise', async () => {
    const c = await fresh();
    let resolveFn!: (v: unknown) => void;
    const fetchMock = vi.fn(() => new Promise((res) => { resolveFn = res; }));
    vi.stubGlobal('fetch', fetchMock);
    const p1 = c.cachedFetch('https://x/a.json', 'dup_key', 60_000);
    const p2 = c.cachedFetch('https://x/a.json', 'dup_key', 60_000);
    // cachedFetch 先 await idb.get（异步），fetch 在微任务后才调用
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    resolveFn({ ok: true, status: 200, json: async () => ({ v: 1 }) });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ v: 1 });
    expect(r2).toEqual({ v: 1 });
    // 完成后第三次调用命中 L1 内存
    await expect(c.cachedFetch('https://x/a.json', 'dup_key', 60_000)).resolves.toEqual({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('网络成功后写回内存（二次调用不再请求）', async () => {
    const c = await fresh();
    const fetchMock = okFetch({ net: 1 });
    vi.stubGlobal('fetch', fetchMock);
    await expect(c.cachedFetch('https://x/n.json', 'net_key', 60_000)).resolves.toEqual({ net: 1 });
    expect(c.memHas('net_key')).toBe(true);
    await c.cachedFetch('https://x/n.json', 'net_key', 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

/* ─── purgeStaleVersions ─── */

describe('purgeStaleVersions', () => {
  it('清理非当前版本条目，保留当前版本 / manifest / 无版本号键', async () => {
    const c1 = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    c1.memStore('char_4.3.1_1005', { a: 1 }, 60_000);
    c1.memStore('char_4.4.0_1005', { a: 2 }, 60_000);
    c1.memStore('item_4.3.1', { b: 1 }, 60_000);
    c1.memStore('manifest', { m: 1 }, 60_000);
    c1.memStore('spine_manifest', { s: 1 }, 60_000); // 无版本号 → 保留
    await sleep(100);
    await c1.purgeStaleVersions('4.4.0');
    vi.resetModules();
    const c2 = await import('../cache');
    expect(await c2.cacheHas('char_4.3.1_1005')).toBe(false); // 旧版本 → 已删
    expect(await c2.cacheHas('char_4.4.0_1005')).toBe(true); // 当前版本 → 保留
    expect(await c2.cacheHas('item_4.3.1')).toBe(false);
    expect(await c2.cacheHas('manifest')).toBe(true);
    expect(await c2.cacheHas('spine_manifest')).toBe(true);
  });

  it('空版本号不执行清理', async () => {
    const c1 = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    c1.memStore('char_4.3.1_1005', { a: 1 }, 60_000);
    await sleep(100);
    await c1.purgeStaleVersions('');
    vi.resetModules();
    const c2 = await import('../cache');
    expect(await c2.cacheHas('char_4.3.1_1005')).toBe(true);
  });
});
