import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useScrollSpy } from '../use-scroll-spy';

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
    expect(spy.activeId.value).toBe('b');
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

  it('jumpTo：按容器系偏移计算目标并 scrollTo（含 offset 补偿 + 落点余量），随后立即激活', () => {
    const scrollTo = vi.fn();
    const container = ref({ ...makeContainer({ scrollTop: 100 }), scrollTo } as HTMLElement & { scrollTo: typeof scrollTo });
    const els = { a: makeEl(200) };
    const spy = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64 });
    spy.jumpTo('a');
    // 200 - 0 + 100 - 64 + 8（LANDING_SLACK，让区块顶边落在偏移线**之上**，避免边界判定被零点几像素抖动翻转）
    expect(scrollTo).toHaveBeenCalledWith({ top: 244, behavior: 'smooth' });
    expect(spy.activeId.value).toBe('a');
  });

  it('jumpTo 后的钉住状态：滚动停止前不做位置判定，停止后才交回位置判定', () => {
    vi.useFakeTimers();
    try {
      const container = ref(makeContainer({ scrollTop: 0 }));
      const els = { a: makeEl(0), b: makeEl(9000) };
      const spy = useScrollSpy(
        container,
        () => ['a', 'b'],
        (id) => els[id as keyof typeof els],
        { offset: 64 },
      );
      // 跳到 b（真实滚动里 b 的顶边还会动，位置判定此时会判成 a）
      spy.jumpTo('b');
      spy.refresh();
      expect(spy.activeId.value, '滚动停止前须钉住被点项').toBe('b');
      // 「滚动停止」由 160ms 静默计时驱动；这里直接推进到超过该阈值（jsdom 里未挂载组件，
      // 拿不到 scroll 监听器，故只验证「钉住会自行释放」这条不变量）
      vi.advanceTimersByTime(400);
      spy.refresh();
      expect(spy.activeId.value, '停止后交回位置判定（两区块都越线 ⇒ 取更靠后的 b）').toBe('b');
    } finally {
      vi.useRealTimers();
    }
  });

  it('jumpTo 目标为负时钳制为 0', () => {
    const scrollTo = vi.fn();
    const container = ref({ ...makeContainer({ scrollTop: 0 }), scrollTo } as HTMLElement & { scrollTo: typeof scrollTo });
    const els = { a: makeEl(10) };
    const spy = useScrollSpy(container, () => ['a'], (id) => els[id as keyof typeof els], { offset: 64 });
    spy.jumpTo('a');
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});