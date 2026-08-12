/**
 * 滚动追踪（scroll spy）：容器内区块激活态 + 阅读进度 + 返回顶部。
 * 统一 CharacterView / EndgameView 重复的 rAF 节流滚动逻辑。
 * 激活判定：最后一个区块顶（容器系）越过 offset 即激活；无命中时按 fallbackFirst
 * 回退首区块（EndgameView 语义）或空串（CharacterView 语义：顶部 hero 区不高亮）。
 */
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export interface ScrollSpyOptions {
  /** 吸顶条高度（激活判定 / 跳转补偿），可静态或动态取值 */
  offset?: number | (() => number);
  /** 返回顶部按钮的滚动阈值（px），默认 480 */
  topThreshold?: number;
  /** 无区块命中时是否回退高亮首区块（默认 false：返回空串） */
  fallbackFirst?: boolean;
}

export interface ScrollSpy {
  /** 当前激活区块 id（无命中时为 fallback 值） */
  activeId: Ref<string>;
  /** 阅读进度 0-100 */
  progress: Ref<number>;
  /** 滚动超过阈值后显示返回顶部 */
  showTop: Ref<boolean>;
  /** 平滑滚动到区块（含吸顶条偏移补偿），仅滚动容器自身 */
  jumpTo(id: string): void;
  /** 平滑滚动回容器顶部 */
  scrollTop(): void;
  /** 手动刷新一次状态（数据就绪 / DOM 变化后调用） */
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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let raf = 0;
  let pending = false;

  function resolveOffset(): number {
    return typeof opts.offset === 'function' ? opts.offset() : (opts.offset ?? 0);
  }

  function computeActive(): string {
    const c = container.value;
    const ids = sectionIds();
    if (!c) return fallbackFirst ? ids[0] || '' : '';
    const cTop = c.getBoundingClientRect().top;
    const offset = resolveOffset();
    let current = '';
    for (const id of ids) {
      const el = getSectionEl(id);
      if (el && el.getBoundingClientRect().top - cTop <= offset) current = id;
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
    });
  }

  function jumpTo(id: string): void {
    const c = container.value;
    const el = getSectionEl(id);
    if (!c || !el) return;
    const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - resolveOffset();
    c.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
    activeId.value = id;
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
  });

  return { activeId, progress, showTop, jumpTo, scrollTop, refresh };
}