/**
 * usePageData 页面级加载编排单测：
 * 成功/失败状态机、加载代竞态（过期结果静默丢弃）、延迟骨架屏、retry。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageData } from '../use-page-data';

beforeEach(() => {
  // 非组件上下文调用 onScopeDispose（useDelayedSkeleton 内部）会告警：静默
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe('usePageData', () => {
  it('成功加载：写入 data 并复位 loading/error', async () => {
    const pd = usePageData<{ id: number }>(async () => ({ id: 1 }));
    expect(pd.loading.value).toBe(true);
    await pd.run();
    expect(pd.loading.value).toBe(false);
    expect(pd.error.value).toBe('');
    expect(pd.data.value).toEqual({ id: 1 });
  });

  it('失败加载：写入 error，data 保持 null', async () => {
    const pd = usePageData<{ id: number }>(async () => {
      throw new Error('boom');
    });
    await pd.run();
    expect(pd.error.value).toBe('boom');
    expect(pd.loading.value).toBe(false);
    expect(pd.data.value).toBeNull();
  });

  it('过期加载的成功结果静默丢弃（不覆盖新一代数据）', async () => {
    const resolvers: ((v: { id: number }) => void)[] = [];
    const pd = usePageData<{ id: number }>(() => new Promise((res) => { resolvers.push(res); }));
    const p1 = pd.run();
    const p2 = pd.run();
    resolvers[0]({ id: 1 }); // 第一代完成（已被第二代取代）
    await p1;
    expect(pd.data.value).toBeNull();
    resolvers[1]({ id: 2 });
    await p2;
    expect(pd.data.value).toEqual({ id: 2 });
  });

  it('过期加载的失败静默丢弃（不污染 error 与 loading）', async () => {
    let rejectOld!: (e: Error) => void;
    let resolveNew!: (v: { id: number }) => void;
    let call = 0;
    const pd = usePageData<{ id: number }>(() => {
      call++;
      return call === 1
        ? new Promise((_, rej) => { rejectOld = rej; })
        : new Promise((res) => { resolveNew = res; });
    });
    const p1 = pd.run();
    const p2 = pd.run();
    rejectOld(new Error('old fail'));
    await p1;
    expect(pd.error.value).toBe('');
    expect(pd.loading.value).toBe(true); // 新一代仍在加载
    resolveNew({ id: 2 });
    await p2;
    expect(pd.error.value).toBe('');
    expect(pd.data.value).toEqual({ id: 2 });
    expect(pd.loading.value).toBe(false);
  });

  it('骨架屏：加载超过阈值才显示，完成后复位', async () => {
    vi.useFakeTimers();
    let resolve!: (v: number) => void;
    const pd = usePageData<number>(() => new Promise((res) => { resolve = res; }));
    const p = pd.run();
    expect(pd.showSkeleton.value).toBe(false);
    vi.advanceTimersByTime(150);
    expect(pd.showSkeleton.value).toBe(true);
    resolve(42);
    await p;
    expect(pd.loading.value).toBe(false);
    expect(pd.showSkeleton.value).toBe(false);
  });

  it('retry 重新触发加载', async () => {
    const loader = vi.fn().mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce({ id: 2 });
    const pd = usePageData<{ id: number }>(loader);
    await pd.run();
    expect(pd.data.value).toEqual({ id: 1 });
    pd.retry();
    await vi.waitFor(() => expect(pd.data.value).toEqual({ id: 2 }));
    expect(loader).toHaveBeenCalledTimes(2);
  });
});