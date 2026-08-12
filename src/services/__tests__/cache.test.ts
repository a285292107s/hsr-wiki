/**
 * cache.ts 请求缓存引擎测试（内存 L1 + in-flight 去重 + 网络）
 *
 * 模块级状态（mem Map / pending）通过 vi.resetModules() + 动态 import 获取全新实例隔离。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

/** 全新模块实例（隔离 mem/pending） */
async function fresh() {
  vi.resetModules();
  return await import('../cache');
}

function okFetch(data: unknown) {
  return vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(data) }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* ─── fetchJSON（网络层） ─── */

describe('fetchJSON', () => {
  it('成功解析 JSON 并重置失败计数', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', okFetch({ a: 1 }));
    await expect(c.fetchJSON('https://static.nanoka.cc/x.json')).resolves.toEqual({ a: 1 });
  });

  it('HTTP 非 2xx → operational 错误（含状态码）', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, text: async () => '{}' })));
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
    c.memStore('mem_key', { m: 1 });
    expect(c.memHas('mem_key')).toBe(true);
    await expect(c.cachedFetch('https://x/m.json', 'mem_key')).resolves.toEqual({ m: 1 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('内存淘汰：超过 80 条后最早 20% 被清除', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn());
    for (let i = 0; i < 80; i++) c.memStore(`evict_${i}`, i);
    expect(c.memHas('evict_0')).toBe(true);
    c.memStore('evict_80', 80); // 触发淘汰 evict_0..15
    expect(c.memHas('evict_0')).toBe(false);
    expect(c.memHas('evict_15')).toBe(false);
    expect(c.memHas('evict_16')).toBe(true);
    expect(c.memHas('evict_80')).toBe(true);
  });
});

/* ─── in-flight 去重 + 写回 ─── */

describe('in-flight 去重 / 写回', () => {
  it('并发同 key 请求共享同一 Promise', async () => {
    const c = await fresh();
    let resolveFn!: (v: unknown) => void;
    const fetchMock = vi.fn(() => new Promise((res) => { resolveFn = res; }));
    vi.stubGlobal('fetch', fetchMock);
    const p1 = c.cachedFetch('https://x/a.json', 'dup_key');
    const p2 = c.cachedFetch('https://x/a.json', 'dup_key');
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    resolveFn({ ok: true, status: 200, text: async () => JSON.stringify({ v: 1 }) });
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual({ v: 1 });
    expect(r2).toEqual({ v: 1 });
    // 完成后第三次调用命中 L1 内存
    await expect(c.cachedFetch('https://x/a.json', 'dup_key')).resolves.toEqual({ v: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('网络成功后写回内存（二次调用不再请求）', async () => {
    const c = await fresh();
    const fetchMock = okFetch({ net: 1 });
    vi.stubGlobal('fetch', fetchMock);
    await expect(c.cachedFetch('https://x/n.json', 'net_key')).resolves.toEqual({ net: 1 });
    expect(c.memHas('net_key')).toBe(true);
    await c.cachedFetch('https://x/n.json', 'net_key');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

/* ─── fetchResourceStatus / fetchText（诊断页资源检查） ─── */

describe('fetchResourceStatus', () => {
  const statusFetch = (status: number) =>
    vi.fn(async () => ({ ok: status >= 200 && status < 300, status, body: { cancel: vi.fn() } }));

  it('200 → ok + 状态码', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', statusFetch(200));
    await expect(c.fetchResourceStatus('https://x/a.skel')).resolves.toMatchObject({ ok: true, status: 200 });
  });

  it('404 → 不抛异常，返回 ok:false + 状态码', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', statusFetch(404));
    await expect(c.fetchResourceStatus('https://x/miss.atlas')).resolves.toMatchObject({ ok: false, status: 404 });
  });

  it('网络失败 → 归一为 status 0', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(c.fetchResourceStatus('https://x/down.png')).resolves.toMatchObject({ ok: false, status: 0 });
  });

  it('只取响应头：取消 body 流不下载内容', async () => {
    const c = await fresh();
    const cancel = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, body: { cancel } })));
    await c.fetchResourceStatus('https://x/big.png');
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});

describe('fetchText', () => {
  it('返回原始文本（atlas 解析用）', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => 'a.png\nsize: 8, 8\n' })));
    await expect(c.fetchText('https://x/hero.atlas')).resolves.toBe('a.png\nsize: 8, 8\n');
  });

  it('非 2xx → NkError（operational）', async () => {
    const c = await fresh();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, text: async () => '' })));
    await expect(c.fetchText('https://x/forbidden.atlas')).rejects.toMatchObject({
      name: 'NkError',
      operational: true,
    });
  });
});