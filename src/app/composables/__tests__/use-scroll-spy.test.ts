/**
 * useScrollSpy 滚动追踪单测：
 * 注入 mock 容器与区块元素（可控 getBoundingClientRect），验证
 * 激活态判定（offset 越过 / fallbackFirst）、进度、showTop 阈值、jumpTo 目标计算。
 * 生命周期挂载（scroll 监听）在非组件上下文不注册，仅测核心算法。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useScrollSpy } from '../use-scroll-spy';

/** 可控 top 的 mock 元素（getBoundingClientRect 返回容器坐标系 top） */
function makeEl(top: number): HTMLElement {
  return {
    getBoundingClientRect: () => ({
      top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
      toJSON: () => ({}),
    }),
  } as unknown as HTMLElement;
}

function makeContainer(over: Partial<{ scrollTop: number; scrollHeight: number; clientHeight: number }> = {}) {
  const c = {
    scrollTop: 0,
    scrollHeight: 1000,
    clientHeight: 500,
    getBoundingClientRect: () => ({
      top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
      toJSON: () => ({}),
    }),
    scrollTo: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    ...over,
  };
  return c as unknown as HTMLElement & { scrollTo: ReturnType<typeof vi.fn> };
}

beforeEach(() => {
  // 非组件上下文调用 onMounted 会告警：静默（生命周期挂载由真实浏览器 e2e 覆盖）
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
});

describe('useScrollSpy', () => {
  it('refresh：进度按 scrollTop/(scrollHeight-clientHeight) 计算并钳制 0-100', () => {
    const container = ref(makeContainer({ scrollTop: 250 }));
    const spy = useScrollSpy(container, () => ['a'], () => null);
    spy.refresh();
    expect(spy.progress.value).toBe(50);
    container.value = makeContainer({ scrollTop: -10 });
    spy.refresh();
    expect(spy.progress.value).toBe(0);
    container.value = makeContainer({ scrollTop: 9999 });
    spy.refresh();
    expect(spy.progress.value).toBe(100);
  });

  it('showTop：滚动超过默认阈值 480 才为 true', () => {
    const container = ref(makeContainer({ scrollTop: 480 }));
    const spy = useScrollSpy(container, () => ['a'], () => null);
    spy.refresh();
    expect(spy.showTop.value).toBe(false);
    container.value = makeContainer({ scrollTop: 481 });
    spy.refresh();
    expect(spy.showTop.value).toBe(true);
  });

  it('activeId：最后一个顶部越过 offset 的区块激活', () => {
    const els = { a: makeEl(100), b: makeEl(250), c: makeEl(900) };
    const container = ref(makeContainer());
    const spy = useScrollSpy(
      container,
      () => ['a', 'b', 'c'],
      (id) => els[id as keyof typeof els],
      { offset: 300 },
    );
    spy.refresh();
    expect(spy.activeId.value).toBe('b'); // a(100) 与 b(250) 均命中，取最后一个：b；c(900) 未命中
  });

  it('无命中时默认返回空串，fallbackFirst 时回退首区块', () => {
    const els = { a: makeEl(900) };
    const container = ref(makeContainer());
    const strict = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64 });
    strict.refresh();
    expect(strict.activeId.value).toBe('');
    const lenient = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64, fallbackFirst: true });
    lenient.refresh();
    expect(lenient.activeId.value).toBe('a');
  });

  it('jumpTo：按容器系偏移计算目标并 scrollTo（含 offset 补偿），随后立即激活', () => {
    const scrollTo = vi.fn();
    const container = ref({ ...makeContainer({ scrollTop: 100 }), scrollTo } as HTMLElement & { scrollTo: typeof scrollTo });
    const els = { a: makeEl(200) };
    const spy = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64 });
    spy.jumpTo('a');
    // top = el.top - container.top + container.scrollTop - offset = 200 - 0 + 100 - 64 = 236
    expect(scrollTo).toHaveBeenCalledWith({ top: 236, behavior: 'smooth' });
    expect(spy.activeId.value).toBe('a');
  });

  it('jumpTo 目标非负时钳制为 0', () => {
    const scrollTo = vi.fn();
    const container = ref({ ...makeContainer({ scrollTop: 0 }), scrollTo } as HTMLElement & { scrollTo: typeof scrollTo });
    const els = { a: makeEl(10) };
    const spy = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64 });
    spy.jumpTo('a');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});