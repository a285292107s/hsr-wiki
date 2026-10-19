// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CDN_PROBE_TIMEOUT_MS,
  CDN_RETRY_INTERVAL_MS,
  isCdnDown,
  resetCdnHealthForTest,
  startCdnHealthProbe,
  subscribeCdnHealth,
} from '../cdn/health';

const flush = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(0);
};

function hangingFetch(): ReturnType<typeof vi.fn> {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      }),
  );
}

beforeEach(() => {
  resetCdnHealthForTest();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  resetCdnHealthForTest();
});

describe('startCdnHealthProbe / isCdnDown', () => {
  it('未启动探测时恒为可用（false）', () => {
    expect(isCdnDown()).toBe(false);
  });

  it('探测成功（2xx）：保持可用且不通知订阅方', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200 })));
    const fn = vi.fn();
    const off = subscribeCdnHealth(fn);
    startCdnHealthProbe();
    await flush();
    expect(isCdnDown()).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    off();
  });

  it('探测失败（网络错误）：置 down 并通知；30s 重探成功后恢复并通知', async () => {
    let ok = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        if (!ok) throw new Error('network down');
        return { ok: true, status: 200 };
      }),
    );
    const fn = vi.fn();
    subscribeCdnHealth(fn);
    startCdnHealthProbe();
    await flush();
    expect(isCdnDown()).toBe(true);
    expect(fn).toHaveBeenCalledWith(true);
    ok = true;
    await vi.advanceTimersByTimeAsync(CDN_RETRY_INTERVAL_MS);
    await flush();
    expect(isCdnDown()).toBe(false);
    expect(fn).toHaveBeenLastCalledWith(false);
  });

  it('探测失败（非 2xx）：同样判定不可用', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 })));
    startCdnHealthProbe();
    await flush();
    expect(isCdnDown()).toBe(true);
  });

  it('探测超时（连接黑洞）：3s 后按不可用结算', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    startCdnHealthProbe();
    await flush();
    expect(isCdnDown()).toBe(false);
    await vi.advanceTimersByTimeAsync(CDN_PROBE_TIMEOUT_MS);
    await flush();
    expect(isCdnDown()).toBe(true);
  });

  it('startCdnHealthProbe 幂等：重复调用不重复探测', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    startCdnHealthProbe();
    startCdnHealthProbe();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
