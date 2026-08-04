/**
 * 像素分析工具（审核台与验收台共用，全站唯一像素统计实现）
 *
 * 两种输入源：
 * - WebGL readPixels 缓冲（审核台 L2 采样：原点在左下，analyzePixels 内部翻转行序）
 * - HTMLCanvasElement（验收台黑块检测：2D 降采样读回，避免全分辨率 getImageData 开销）
 */
export interface PixelAnalysis {
  visible: number;
  total: number;
  ratio: number;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

/** RGBA 像素缓冲可见性统计（alpha>0 计数 + 包围盒；readPixels 原点在左下，返回坐标已翻转为左上原点） */
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

/**
 * 近黑不透明像素占比（%）：画布降采样到 ≤320px 宽后逐像素判定（RGB 均 <15 且 alpha >200）。
 * 验收台黑块检测用；合并画布 preserveDrawingBuffer=true 时读回可靠。
 */
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
