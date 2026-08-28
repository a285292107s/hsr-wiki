/**
 * Spine 运行时双版本加载与 window.spine 访问器代理测试。
 *
 * 模拟 CDN script 加载：mock document.head.appendChild，在注入时模拟 IIFE 同步执行
 * （window.spine = fakeLib，走代理 setter 按 loadingVersion 捕获）后触发 onload/onerror。
 * 模块级状态（libs/代理/单例/注入链）由 vi.resetModules + 动态 import 隔离。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPINE_RUNTIME_CDNS } from '../constants';
import type { SpineLib, SpineRuntimeVersion } from '../types';

type RuntimeModule = typeof import('../runtime');

/** 构造一个带版本标签的 fake 运行时命名空间（SpinePlayer 静态 __tag 供断言捕获归属） */
function fakeLib(tag: string): SpineLib {
  const SpinePlayer = class {
    static __tag = tag;
    constructor(_container: HTMLElement, _config: unknown) {
      /* noop */
    }
    dispose(): void {
      /* noop */
    }
    setAnimation(_name: string): void {
      /* noop */
    }
    play(): void {
      /* noop */
    }
    pause(): void {
      /* noop */
    }
  };
  return {
    SpinePlayer: SpinePlayer as unknown as SpineLib['SpinePlayer'],
  } as unknown as SpineLib;
}

/** 已注入的 script 元素（断言注入次数用） */
let injected: HTMLScriptElement[] = [];

/** mock script 注入：按 URL 提供 fake lib；failAll=true 时全部 onerror */
function mockAppend(fakeByUrl: (url: string) => SpineLib | null, failAll = false): void {
  injected = [];
  vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => {
    const s = node as HTMLScriptElement;
    injected.push(s);
    const fake = fakeByUrl(s.src);
    if (fake) (window as unknown as { spine?: unknown }).spine = fake; // 模拟 IIFE 同步赋值（走代理 setter）
    if (failAll) s.onerror?.(new Event('error'));
    else s.onload?.(new Event('load'));
    return node;
  }) as typeof document.head.appendChild);
}

/** mock script 注入（挂起）：appendChild 不触发 onload/onerror，模拟连接黑洞 */
function mockAppendHang(): void {
  injected = [];
  vi.spyOn(document.head, 'appendChild').mockImplementation(((node: Node) => {
    injected.push(node as HTMLScriptElement);
    return node;
  }) as typeof document.head.appendChild);
}

/** 读取 window.spine（getter）的版本标签 */
function globalTag(): string | undefined {
  return (window as unknown as { spine?: { SpinePlayer?: { __tag?: string } } }).spine?.SpinePlayer?.__tag;
}

beforeEach(() => {
  vi.restoreAllMocks();
  // 清理上个模块实例安装的访问器（configurable: true 可删）
  delete (window as unknown as { spine?: unknown }).spine;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** 获取全新模块实例（隔离模块级状态） */
async function freshRuntime(): Promise<RuntimeModule> {
  vi.resetModules();
  return await import('../runtime');
}

describe('spine runtime 双版本加载与 window.spine 代理', () => {
  it('未加载时 getSpineCtor/getSpineLib 返回 null（缺省主版本 4.2）', async () => {
    const rt = await freshRuntime();
    expect(rt.getSpineCtor()).toBeNull();
    expect(rt.getSpineLib()).toBeNull();
    expect(rt.getSpineCtor('4.1')).toBeNull();
    expect(rt.getSpineLib('4.1')).toBeNull();
  });

  it('加载 4.2：本地主源首先注入，捕获进 Map，window.spine 读取为主版本', async () => {
    const rt = await freshRuntime();
    mockAppend((url) => (url.includes('4.2.43') ? fakeLib('42') : null));
    await expect(rt.loadSpineRuntime('4.2')).resolves.toBe(true);
    expect(injected.length).toBe(1); // 本地主源一次命中，CDN 兜底未注入
    expect(injected[0].src).toContain('/vendor/spine/spine-player-4.2.43');
    expect((rt.getSpineCtor('4.2') as unknown as { __tag?: string }).__tag).toBe('42');
    expect(rt.getSpineCtor('4.1')).toBeNull();
    expect(globalTag()).toBe('42');
  });

  it('4.2 已加载后再加载 4.1：捕获进 Map，window.spine 仍为主版本 4.2', async () => {
    const rt = await freshRuntime();
    mockAppend((url) => (url.includes('4.2.43') ? fakeLib('42') : fakeLib('41')));
    await rt.loadSpineRuntime('4.2');
    await rt.loadSpineRuntime('4.1');
    expect((rt.getSpineCtor('4.1') as unknown as { __tag?: string }).__tag).toBe('41');
    expect((rt.getSpineCtor('4.2') as unknown as { __tag?: string }).__tag).toBe('42');
    expect(globalTag()).toBe('42');
  });

  it('加载顺序无关：先 4.1 后 4.2 → 最终 window.spine 为 4.2', async () => {
    const rt = await freshRuntime();
    mockAppend((url) => (url.includes('4.1.23') ? fakeLib('41') : fakeLib('42')));
    await rt.loadSpineRuntime('4.1');
    expect(globalTag()).toBe('41'); // 主版本未加载时 getter 回退 4.1
    await rt.loadSpineRuntime('4.2');
    expect(globalTag()).toBe('42');
  });

  it('全部 CDN 失败：返回 false 且单例置空允许重试（重新加载可成功）', async () => {
    const rt = await freshRuntime();
    mockAppend(() => null, true);
    await expect(rt.loadSpineRuntime('4.2')).resolves.toBe(false);
    expect(rt.getSpineCtor('4.2')).toBeNull();
    // 重试成功（新 mock 正常返回）
    vi.restoreAllMocks();
    mockAppend((url) => (url.includes('4.2.43') ? fakeLib('42') : null));
    await expect(rt.loadSpineRuntime('4.2')).resolves.toBe(true);
    expect((rt.getSpineCtor('4.2') as unknown as { __tag?: string }).__tag).toBe('42');
  });

  it('并发加载两版本：注入串行化，各版本正确捕获（loadingVersion 不串位）', async () => {
    const rt = await freshRuntime();
    mockAppend((url) => (url.includes('4.2.43') ? fakeLib('42') : fakeLib('41')));
    const [ok41, ok42] = await Promise.all([
      rt.loadSpineRuntime('4.1' as SpineRuntimeVersion),
      rt.loadSpineRuntime('4.2' as SpineRuntimeVersion),
    ]);
    expect(ok41).toBe(true);
    expect(ok42).toBe(true);
    expect((rt.getSpineCtor('4.1') as unknown as { __tag?: string }).__tag).toBe('41');
    expect((rt.getSpineCtor('4.2') as unknown as { __tag?: string }).__tag).toBe('42');
    expect(injected.length).toBeGreaterThanOrEqual(2);
  });

  it('重复调用幂等：加载成功后再次调用直接 true，不重复注入 script', async () => {
    const rt = await freshRuntime();
    mockAppend((url) => (url.includes('4.2.43') ? fakeLib('42') : null));
    await rt.loadSpineRuntime('4.2');
    const before = injected.length;
    await expect(rt.loadSpineRuntime('4.2')).resolves.toBe(true);
    expect(injected.length).toBe(before);
  });

  it('script 注入超时（连接黑洞）：单源 8s 按失败结算，本地主源 + 全部 CDN 兜底超时返回 false', async () => {
    vi.useFakeTimers();
    const rt = await freshRuntime();
    mockAppendHang();
    const p = rt.loadSpineRuntime('4.2');
    // 逐源推进：先 flush 微任务（executor 注册超时 timer），再推进 8s 触发该源超时
    // 源数 = 本地主源 1 + SPINE_RUNTIME_CDNS 兜底 3
    for (let i = 0; i < SPINE_RUNTIME_CDNS.length + 1; i++) {
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(8000);
    }
    await expect(p).resolves.toBe(false);
    expect(rt.getSpineCtor('4.2')).toBeNull();
  });

  it('CDN 健康探测判定不可用时：本地主源仍注入（不受 down 短路影响），CDN 兜底跳过', async () => {
    vi.useFakeTimers();
    vi.resetModules();
    // 先置 CDN down（探测失败），再加载 runtime（共享同一 health 模块实例）
    const health = await import('../../services/cdn/health');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    health.startCdnHealthProbe();
    await vi.advanceTimersByTimeAsync(0);
    expect(health.isCdnDown()).toBe(true);
    mockAppendHang();
    const rt = await import('../runtime');
    const p = rt.loadSpineRuntime('4.2');
    // 本地主源挂起 → 8s 超时按失败结算；isCdnDown() → 跳过全部 CDN 兜底，直接结算 false
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(8000);
    await expect(p).resolves.toBe(false);
    expect(injected.length).toBe(1); // 仅本地主源，CDN 兜底零注入
  });
});
