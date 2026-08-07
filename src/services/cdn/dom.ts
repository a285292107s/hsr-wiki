/**
 * 全局 CDN 图片回退（DOM 副作用，仅 bootstrap 注册一次）。
 *
 * 三级兜底（事件委托捕获 <img> 加载失败，error 事件走捕获传播到 document）：
 * 1. 双源回退：带 data-cdn-fallback 的 img 替换 src 并清除属性，保证仅回退一次
 *    （覆盖 v-html 卡片中无法使用 Vue 指令/组合式函数的图片，CatalogView 卡片）
 * 2. CDN down 短路：健康探测判定 CDN 不可用后，不再逐图尝试，直接标记降级
 * 3. 最终降级：回退源/首选源（nanoka）失败 → 标记 data-cdn-down（CSS 隐藏破图，
 *    由卡片渐变底承接占位）；CDN 恢复时重载全部已降级图片
 */
import { isCdnDown, subscribeCdnHealth } from './health';

/** 判定 src 是否为受管的 CDN 图片（排除 data URI / 站内资源，避免误标记） */
function isCdnImage(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/** 标记最终降级：CSS 隐藏破图图标（布局占位保留，卡片渐变底承接） */
function markDown(img: HTMLImageElement): void {
  if (img.dataset.cdnDown) return;
  img.dataset.cdnDown = '1';
}

/** CDN 恢复：重载当前页面全部已降级图片（重设 src 重新请求；仍失败会再次标记，幂等） */
function reloadDownedImages(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-cdn-down]').forEach((img) => {
    const src = img.getAttribute('src');
    img.removeAttribute('data-cdn-down');
    if (src && !src.startsWith('data:')) img.src = src;
  });
}

export function installCdnImgFallback(): () => void {
  const onError = (ev: Event): void => {
    const img = ev.target as HTMLImageElement | null;
    if (!img || img.tagName?.toLowerCase() !== 'img') return;
    const src = img.getAttribute('src') || '';
    if (!isCdnImage(src)) return;
    // CDN 整体不可用：跳过回退尝试，直接降级（省去逐图失败等待）
    if (isCdnDown()) {
      markDown(img);
      return;
    }
    const fb = img.getAttribute('data-cdn-fallback');
    if (fb) {
      img.removeAttribute('data-cdn-fallback');
      img.src = fb;
      return;
    }
    // 首选源（nanoka）失败且无回退 → 最终降级
    markDown(img);
  };
  document.addEventListener('error', onError, true);
  const offRestore = subscribeCdnHealth((down) => {
    if (!down) reloadDownedImages();
  });
  return () => {
    document.removeEventListener('error', onError, true);
    offRestore();
  };
}
