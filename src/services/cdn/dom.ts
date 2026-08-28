/**
 * 全局 CDN 图片回退（DOM 副作用，仅 bootstrap 注册一次）。
 *
 * 兜底链（事件委托捕获 <img> 加载失败，error 事件走捕获传播到 document）：
 * 1. 本地主源（/data/cn/assets/icons/...）：失败时现场反查远端最优源（localFallbackFromPrimary，
 *    不依赖 data-cdn-fallback 属性与 CDN 健康状态）；远端再失败走最终降级
 * 2. 双源回退：带 data-cdn-fallback 的 img 替换 src 并清除属性，保证仅回退一次
 *    （覆盖 v-html 卡片中无法使用 Vue 指令/组合式函数的图片，CatalogView 卡片）
 * 3. CDN down 短路：健康探测判定 CDN 不可用后，不再逐图尝试，直接标记降级
 * 4. 最终降级：回退源/首选源（nanoka）失败 → 标记 data-cdn-down（CSS 隐藏破图，
 *    由卡片渐变底承接占位）；CDN 恢复时重载全部已降级图片
 *
 * 挂起兜底（STALL_TIMEOUT_MS）：jsDelivr 大仓库偶发请求挂起时 img 不触发 error 事件，
 * 上述三级兜底全部失效——经 MutationObserver 对受管 img 启动超时定时器，
 * 超时仍未 complete 视为失败，走同一回退链。
 */
import { isCdnDown, subscribeCdnHealth } from './health';
import { LOCAL_ICONS_BASE } from './base';
import { localFallbackFromPrimary } from './resolve';

/** 挂起超时：jsDelivr 冷回源/网络偶发挂起的兜底阈值（远大于正常加载耗时） */
export const CDN_STALL_TIMEOUT_MS = 10_000;

/** 判定 src 是否为受管的 CDN 图片（排除 data URI / 站内资源，避免误标记） */
function isCdnImage(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/** 标记最终降级：CSS 隐藏破图图标（布局占位保留，卡片渐变底承接） */
function markDown(img: HTMLImageElement): void {
  if (img.dataset.cdnDown) return;
  img.dataset.cdnDown = '1';
  // 慢响应自愈：jsDelivr 冷回源可能慢于超时阈值但最终成功，load 时自动清除降级标记恢复显示
  // （真失败无 load 事件，保持隐藏）
  img.addEventListener('load', () => img.removeAttribute('data-cdn-down'), { once: true });
}

/** CDN 恢复：重载当前页面全部已降级图片（重设 src 重新请求；仍失败会再次标记，幂等） */
function reloadDownedImages(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-cdn-down]').forEach((img) => {
    const src = img.getAttribute('src');
    img.removeAttribute('data-cdn-down');
    if (src && !src.startsWith('data:')) img.src = src;
  });
}

/** 挂起定时器注册表（img → timer）；img 完成/失败/卸载时清除 */
const stallTimers = new WeakMap<HTMLImageElement, ReturnType<typeof setTimeout>>();

function clearStallTimer(img: HTMLImageElement): void {
  const t = stallTimers.get(img);
  if (t !== undefined) {
    clearTimeout(t);
    stallTimers.delete(img);
  }
}

/** 失败处理（error 事件与挂起超时共用同一回退链） */
function handleFailure(img: HTMLImageElement): void {
  const src = img.getAttribute('src') || '';
  // 本地主源：不依赖 CDN 健康状态，失败时现场反查远端最优源（仅一次，再失败走通用降级）
  if (src.startsWith(`${LOCAL_ICONS_BASE}/`)) {
    const remote = localFallbackFromPrimary(src);
    if (remote) {
      img.src = remote;
      return;
    }
    markDown(img);
    return;
  }
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
  // 首选源失败且无回退 → 最终降级
  markDown(img);
}

/** 对受管 img 启动挂起定时器（已 complete 或已有定时器则跳过） */
function watchStall(img: HTMLImageElement): void {
  if (img.complete || stallTimers.has(img)) return;
  // lazy 图片进入视口前浏览器不会发起加载（complete 恒 false）——此时把「未加载」当作
  // 「请求挂起」会误标 data-cdn-down 隐藏（屏外卡片全量中招）。仅在浏览器真正开始拉取
  // 资源（loadstart）后再启动定时器；未开始的 lazy 图挂起监听，开始加载时经 watchStall 重入。
  if (img.loading === 'lazy' && !img.currentSrc) {
    img.addEventListener('loadstart', () => watchStall(img), { once: true });
    return;
  }
  const t = setTimeout(() => {
    stallTimers.delete(img);
    // 定时器触发时仍未完成 → 挂起；若此间已因 error 回退替换则跳过
    if (!img.complete && !img.dataset.cdnDown) handleFailure(img);
  }, CDN_STALL_TIMEOUT_MS);
  stallTimers.set(img, t);
  // 正常完成/失败时清除定时器（error 也走 complete 置位路径，双保险）
  img.addEventListener('load', () => clearStallTimer(img), { once: true });
  img.addEventListener('error', () => clearStallTimer(img), { once: true });
}

export function installCdnImgFallback(): () => void {
  const onError = (ev: Event): void => {
    const img = ev.target as HTMLImageElement | null;
    if (!img || img.tagName?.toLowerCase() !== 'img') return;
    clearStallTimer(img);
    handleFailure(img);
  };
  document.addEventListener('error', onError, true);

  // 挂起检测：观察新增/属性变更的受管 img（jsDelivr 大仓库偶发请求挂起无 error 事件）
  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type === 'attributes' && rec.attributeName === 'src') {
        watchStall(rec.target as HTMLImageElement);
      } else if (rec.type === 'childList') {
        for (const node of rec.addedNodes) {
          if (node instanceof HTMLImageElement) watchStall(node);
          // 容器整体插入（v-html 卡片）时扫描内部 img
          if (node instanceof Element) {
            node.querySelectorAll('img').forEach((img) => watchStall(img));
          }
        }
        // 移除的 img 清除定时器，避免悬挂
        for (const node of rec.removedNodes) {
          if (node instanceof HTMLImageElement) clearStallTimer(node);
          if (node instanceof Element) {
            node.querySelectorAll('img').forEach((img) => clearStallTimer(img));
          }
        }
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  // 初始化扫描已存在的受管 img
  document.querySelectorAll('img').forEach((img) => watchStall(img));

  const offRestore = subscribeCdnHealth((down) => {
    if (!down) reloadDownedImages();
  });
  return () => {
    document.removeEventListener('error', onError, true);
    mo.disconnect();
    offRestore();
  };
}
