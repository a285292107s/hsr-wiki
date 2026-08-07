/**
 * createSpinePlayer 兜底结算测试（整体超时 + error 回调路径）。
 * - 资源加载挂起（success/error 均不触发，模拟 CDN 连接黑洞）：20s 整体超时按失败结算
 * - error 回调：立即按失败结算并释放已创建实例（不依赖超时）
 * 通过 vi.mock('../runtime') 注入不结算/可结算的 fake 构造器。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const { fakeCtor, failingCtor } = vi.hoisted(() => {
  class FakeCtor {
    static __tag = 'fake';
    constructor(_container: HTMLElement, _config: unknown) {
      /* 挂起：不触发 success/error */
    }
    dispose(): void {
      /* noop */
    }
  }
  class FailingCtor {
    constructor(_container: HTMLElement, config: { error?: (p: unknown, msg: string) => void }) {
      config.error?.(this, 'simulated failure');
    }
    dispose(): void {
      /* noop */
    }
  }
  return { fakeCtor: FakeCtor, failingCtor: FailingCtor };
});

vi.mock('../runtime', () => ({
  getSpineCtor: (version: string) => (version === 'fail' ? failingCtor : fakeCtor),
}));

import { createSpinePlayer } from '../player';

afterEach(() => {
  vi.useRealTimers();
});

describe('createSpinePlayer 兜底结算', () => {
  it('资源加载挂起（success/error 均不触发）：20s 整体超时按失败结算返回 null', async () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    const p = createSpinePlayer(el, 'player:1001', { skelUrl: 'https://x/s.skel', atlasUrl: 'https://x/s.atlas' }, '4.2');
    expect(fakeCtor).toBeDefined();
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(p).resolves.toBeNull();
  });

  it('error 回调：立即按失败结算返回 null（不等超时）', async () => {
    const el = document.createElement('div');
    const p = createSpinePlayer(el, 'player:1002', { skelUrl: 'https://x/s.skel', atlasUrl: 'https://x/s.atlas' }, 'fail' as never);
    await expect(p).resolves.toBeNull();
  });
});
