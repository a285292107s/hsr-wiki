/**
 * 诊断报告导出工具（审核台 / 验收台共用）
 */

/** 复制文本到剪贴板；失败返回 false 由调用方提示（不在此处 toast，保持无 UI 依赖） */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** 触发浏览器文件下载（Blob → 临时 objectURL → 点击后回收） */
export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** JSON 报告下载（pretty 缩进） */
export function downloadJson(data: unknown, filename: string): void {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename);
}

/** 画布 PNG 导出（dataURL → 临时锚点点击；preserveDrawingBuffer=true 时像素稳定） */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}
