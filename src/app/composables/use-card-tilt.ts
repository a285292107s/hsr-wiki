import { onScopeDispose, type Ref } from 'vue';

export interface CardTilt {
  onMove(e: MouseEvent): void;
  onLeave(): void;
}

export function useCardTilt(
  grid: Ref<HTMLElement | null>,
  selector: () => string,
): CardTilt {
  let raf: number | null = null;
  let pending: { card: HTMLElement; x: number; y: number } | null = null;

  function onMove(e: MouseEvent): void {
    const card = (e.target as HTMLElement).closest(selector());
    if (!(card instanceof HTMLElement)) return;
    pending = { card, x: e.clientX, y: e.clientY };
    if (raf !== null) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      if (!pending) return;
      const { card: c, x, y } = pending;
      pending = null;
      const rect = c.getBoundingClientRect();
      c.style.setProperty('--rx', ((x - rect.left) / rect.width - 0.5).toFixed(3));
      c.style.setProperty('--ry', (0.5 - (y - rect.top) / rect.height).toFixed(3));
    });
  }

  function onLeave(): void {
    pending = null;
    grid.value?.querySelectorAll<HTMLElement>(selector()).forEach((c) => {
      c.style.setProperty('--rx', '0');
      c.style.setProperty('--ry', '0');
    });
  }

  onScopeDispose(() => {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    pending = null;
  });

  return { onMove, onLeave };
}
