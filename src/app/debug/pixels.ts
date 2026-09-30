export interface PixelAnalysis {
  visible: number;
  total: number;
  ratio: number;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

export function analyzePixels(buf: Uint8Array, w: number, h: number): PixelAnalysis {
  let visible = 0;
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y++) {
    const glY = h - 1 - y; // WebGL readPixels 从底部行开始
    for (let x = 0; x < w; x++) {
      const a = buf[(glY * w + x) * 4 + 3];
      if (a > 0) {
        visible++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return {
    visible,
    total: w * h,
    ratio: visible / (w * h),
    bbox: visible ? { x0, y0, x1, y1 } : null,
  };
}

export function sampleNearBlackPct(canvas: HTMLCanvasElement): number {
  const w = 320;
  const h = Math.max(1, Math.round((canvas.height / canvas.width) * w));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return 0;
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let nearBlack = 0;
  const total = w * h;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 15 && d[i + 1] < 15 && d[i + 2] < 15 && d[i + 3] > 200) nearBlack++;
  }
  return (nearBlack / total) * 100;
}
