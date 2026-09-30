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