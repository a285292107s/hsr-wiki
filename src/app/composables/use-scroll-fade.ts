import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export type ScrollFade = 'none' | 'start' | 'middle' | 'end';

export function useScrollFade(target: Ref<HTMLElement | null>): Ref<ScrollFade> {
  const state = ref<ScrollFade>('start');
  let raf = 0;
  let ro: ResizeObserver | null = null;

  function sync(): void {
    const el = target.value;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const x = el.scrollLeft;
    state.value = max <= 1 ? 'none' : x <= 1 ? 'start' : x >= max - 1 ? 'end' : 'middle';
  }

  function onScroll(): void {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      sync();
    });
  }

  onMounted(() => {
    const el = target.value;
    el?.addEventListener('scroll', onScroll, { passive: true });
    if (el) {
      ro = new ResizeObserver(sync);
      ro.observe(el);
      const first = el.firstElementChild;
      if (first) ro.observe(first);
    }
    sync();
  });

  onBeforeUnmount(() => {
    target.value?.removeEventListener('scroll', onScroll);
    ro?.disconnect();
    ro = null;
    if (raf) cancelAnimationFrame(raf);
  });

  return state;
}
