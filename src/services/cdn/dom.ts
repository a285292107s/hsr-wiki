/**
 * 全局 CDN 图片回退（DOM 副作用，仅 bootstrap 注册一次）。
 * 事件委托捕获 <img> 加载失败（error 事件不冒泡但走捕获传播到 document），
 * 若带 data-cdn-fallback 则替换 src 并清除属性，保证仅回退一次（回退源再失败不循环）。
 * 覆盖 v-html 卡片中无法使用 Vue 指令/组合式函数的图片（CatalogView 卡片）。
 */
export function installCdnImgFallback(): () => void {
  const onError = (ev: Event): void => {
    const img = ev.target as HTMLImageElement | null;
    if (!img || img.tagName?.toLowerCase() !== 'img') return;
    const fb = img.getAttribute('data-cdn-fallback');
    if (!fb) return;
    img.removeAttribute('data-cdn-fallback');
    img.src = fb;
  };
  document.addEventListener('error', onError, true);
  return () => document.removeEventListener('error', onError, true);
}