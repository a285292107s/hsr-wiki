/**
 * 目录卡片 3D 倾斜特效（mousemove 事件委托 + rAF 节流）。
 * 通过 --rx/--ry CSS 变量驱动，仅用于非虚拟网格（虚拟网格窗口随滚动重建，tilt 状态会丢失）。
 */
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
