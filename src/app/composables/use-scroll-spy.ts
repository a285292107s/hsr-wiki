import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export interface ScrollSpyOptions {
  offset?: number | (() => number);
  topThreshold?: number;
  fallbackFirst?: boolean;
}

export interface ScrollSpy {
  activeId: Ref<string>;
  progress: Ref<number>;
  showTop: Ref<boolean>;
  jumpTo(id: string): void;
  scrollTop(): void;
  refresh(): void;
}

export function useScrollSpy(
  container: Ref<HTMLElement | null>,
  sectionIds: () => string[],
  getSectionEl: (id: string) => HTMLElement | null,
  opts: ScrollSpyOptions = {},
): ScrollSpy {
  const activeId = ref('');
  const progress = ref(0);
  const showTop = ref(false);
  const { topThreshold = 480, fallbackFirst = false } = opts;
  /* 落点余量（px）：命中判定取「区块顶边 ≤ 偏移线」，而 `jumpTo` 原先把顶边送到**正好等于**偏移线，
     实测落点带 0.2~0.4px 抖动（58.625 / 59.156）⇒ 边界判定翻转，点哪一节亮上一节。
     落点比偏移线多让出这一档，命中判定不动。 */
  const LANDING_SLACK = 8;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let raf = 0;
  let pending = false;
  /* 跳转钉住：`jumpTo` 到「滚动停止」之间，高亮认定被点的那一节。
     必要性来自两处锚点规则无解的现实——① 落点带 0.2~0.4px 抖动会翻转「顶边 ≤ 偏移线」的边界判定；
     ② 页尾的短区块（实测「09 配音」200px）永远排在长区块之后、`.nk-page--detail` 又已到滚动上限，
     顶边只能停在偏移线下方很远。
     早期版本用「落点 ±24px 窗口」实现，**实测被平滑滚动打穿**：1205 六区块的点击里落点恒偏 40px
     （钉住 8101 / 实际 8063），窗口一开就过期。改用「滚动停止」作为释放信号——动画期间的中间位置
     本来就不该改写高亮，这正是要解决的问题本身。 */
  let pinnedId = '';

  function resolveOffset(): number {
    return typeof opts.offset === 'function' ? opts.offset() : (opts.offset ?? 0);
  }

  function computeActive(): string {
    const c = container.value;
    const ids = sectionIds();
    if (!c) return fallbackFirst ? ids[0] || '' : '';
    // 跳转进行中（尚未滚动停止）不做位置判定——被点的那一节就是当前节
    if (pinnedId) return pinnedId;
    const box = c.getBoundingClientRect();
    const cTop = box.top;
    const offset = resolveOffset();
    let current = '';
    let currentTop = -Infinity;
    for (const id of ids) {
      const el = getSectionEl(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top - cTop;
      // 主判据：区块顶边已越过偏移线（吸顶条下沿）
      if (top <= offset && top > currentTop) { currentTop = top; current = id; }
    }
    return current || (fallbackFirst ? ids[0] || '' : '');
  }

  function refresh(): void {
    const c = container.value;
    if (!c) return;
    const max = c.scrollHeight - c.clientHeight;
    progress.value = max > 0 ? Math.max(0, Math.min((c.scrollTop / max) * 100, 100)) : 0;
    showTop.value = c.scrollTop > topThreshold;
    activeId.value = computeActive();
  }

  function onScroll(): void {
    if (pending) return;
    pending = true;
    raf = requestAnimationFrame(() => {
      pending = false;
      refresh();
      scheduleSettle();
    });
  }

  /* 平滑滚动期间 `computeActive` 反映的是**当时**的位置，落点是否刚好把目标区块顶上偏移线，
     取决于动画结束前页面是否又发生 reflow（懒加载图片、字体、Spine 就绪都会改布局）。
     实测同一动作的可达 scrollTop 在多次运行间差 20~40px（1374 / 1452 / 1514）。
     做法：滚动停止后再复算一次并释放跳转钉住——此时布局已稳定，位置判定才有意义。 */
  let settleTimer = 0;
  function scheduleSettle(): void {
    if (settleTimer) window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => { settleTimer = 0; pinnedId = ''; refresh(); }, 160);
  }

  function jumpTo(id: string): void {
    const c = container.value;
    const el = getSectionEl(id);
    if (!c || !el) return;
    const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - resolveOffset() + LANDING_SLACK;
    pinnedId = id;
    c.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
    activeId.value = id;
    // reduced-motion 下没有滚动动画，不会有 scroll 事件，钉住必须自己释放
    if (reducedMotion) { pinnedId = ''; refresh(); }
  }

  function scrollTop(): void {
    container.value?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }

  onMounted(() => {
    container.value?.addEventListener('scroll', onScroll, { passive: true });
  });
  onBeforeUnmount(() => {
    container.value?.removeEventListener('scroll', onScroll);
    if (raf) cancelAnimationFrame(raf);
    if (settleTimer) window.clearTimeout(settleTimer);
  });

  return { activeId, progress, showTop, jumpTo, scrollTop, refresh };
}