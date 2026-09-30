// 仅精确指针设备生效（触屏滚动会模拟 mousemove，导致抖动）。
import { onScopeDispose, type Ref } from 'vue';

export interface ParallaxOptions {
  enabled?: () => boolean;
  strengthX?: number;
  strengthY?: number;
  scale?: number;
}

export function useParallax(
  container: Ref<HTMLElement | null>,
  target: Ref<HTMLElement | null>,
  opts: ParallaxOptions = {},
) {
  const { enabled = () => true, strengthX = 15, strengthY = 10, scale = 1.06 } = opts;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let raf: number | null = null;

  function loop(): void {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    if (target.value) {
      target.value.style.transform =
        `translate3d(${(cx * strengthX).toFixed(2)}px, ${(cy * strengthY).toFixed(2)}px, 0) scale(${scale})`;
    }
    if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
  function kick(): void {
    if (raf === null) raf = requestAnimationFrame(loop);
  }
  function onMove(e: MouseEvent): void {
    if (!finePointer || !enabled()) return;
    const el = container.value;
    if (!el) return;
    const r = el.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5;
    ty = (e.clientY - r.top) / r.height - 0.5;
    kick();
  }
  function onLeave(): void {
    tx = 0; ty = 0;
    kick();
  }
  function reset(): void {
    tx = 0; ty = 0;
    kick();
  }
  onScopeDispose(() => {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  });
  return { onMove, onLeave, reset };
}
