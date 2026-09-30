/* 全局 CDN 图片回退（DOM 副作用，仅 bootstrap 注册一次；事件委托捕获 <img> error 到 document）。
   兜底链：① 本地主源失败→现场反查远端最优源（localFallbackFromPrimary，不依赖属性/健康态）；
   ② 双源回退：带 data-cdn-fallback 的 img 替换 src 并清除属性，保证仅回退一次（覆盖 v-html 卡片图）；
   ③ CDN down 短路：健康探测判定不可用后不再逐图尝试，直接标记降级；
   ④ 最终降级：回退/首选（nanoka）失败→data-cdn-down（CSS 隐藏破图，卡片渐变底承接）；
      未 opt-out（data-cdn-noph）且主源为远端 URL 时改换占位图形（data-cdn-placeholder，见 placeholder.ts），
      原 URL 存 dataset.cdnSrc 供恢复链还原。CDN 恢复时重载全部降级图。
   挂起兜底 STALL_TIMEOUT_MS：jsDelivr 大仓库偶发挂起不触发 error，经 MutationObserver 对受管 img 启超时定时器走同链。 */
import { isCdnDown, subscribeCdnHealth } from './health';
import { LOCAL_ICONS_BASE } from './base';
import { localFallbackFromPrimary } from './resolve';
import { MISSING_ICON_SRC } from './placeholder';

/** 挂起超时：jsDelivr 冷回源/网络偶发挂起的兜底阈值（远大于正常加载耗时） */
export const CDN_STALL_TIMEOUT_MS = 10_000;

/** 判定 src 是否为受管的 CDN 图片（排除 data URI / 站内资源，避免误标记） */
function isCdnImage(src: string): boolean {
  return /^https?:\/\//.test(src);
}

/* 图标占位（opt-in）：带 `data-cdn-noph` 的 img 不参与。组件自带语义占位（物品卡立方体、
   遗器部位图的真实通用图标、终局 buff 的星形）与「有意空图」位（Hero 立绘渐变底、gridFight
   属性图标）都打该属性——占位只服务「本该有图却没有」的图标，不得盖掉它们。
   `noPlaceholder` 用于 CDN 整体不可用（isCdnDown 短路）：那是环境故障而非缺图，
   满屏占位比留白更吵，且恢复链会整页重载（ADR 0013）。 */
function markDown(img: HTMLImageElement, noPlaceholder = false): void {
  if (img.dataset.cdnDown) return;
  img.dataset.cdnDown = '1';
  const src = img.getAttribute('src') || '';
  if (noPlaceholder || img.hasAttribute('data-cdn-placeholder') || img.hasAttribute('data-cdn-noph') || !isCdnImage(src)) {
    /* 非占位路线（opt-out / 本地源 / CDN down 短路）：真源最终 load 成功 → 清降级标记恢复显示 */
    img.addEventListener('load', () => clearDegrade(img), { once: true });
    return;
  }
  /* 占位路线：状态用**占位是否已实际加载**（`placeholderLoaded`）而不是 src 值——同源重试
     （src 等于记录的原失败源）成功后也必须能清，故不能拿 src 相等当「不清」的依据。
     监听常驻（非 `{ once: true }`）：真实浏览器里占位自身的 load 与组件接管那次是两个独立事件，
     一次性监听会被前者消费掉。 */
  let placeholderLoaded = false;
  img.dataset.cdnSrc = src;
  img.setAttribute('data-cdn-placeholder', '1');
  watchDegradedSrcSwap(img);
  img.addEventListener('load', () => {
    if (!placeholderLoaded) {
      placeholderLoaded = true;
      return;
    }
    if (!isPlaceholderSrc(img.currentSrc)) clearDegrade(img);
  });
  img.src = MISSING_ICON_SRC;
}

/* 已降级元素被组件换源后又失败：`markDown` 首行会早退，元素既不带占位（CSS 不隐藏）也不重新
   判定 ⇒ 可见破图。这里监听 src 变更：一旦它与记录的原失败源不同（= 组件换了新源），先清降级
   态把元素恢复成普通图片，让新源自己的 error 重新走完整回退链（含重新落占位）。 */
function watchDegradedSrcSwap(img: HTMLImageElement): void {
  new MutationObserver(() => {
    const cur = img.getAttribute('src') || '';
    if (img.hasAttribute('data-cdn-down') && cur !== img.dataset.cdnSrc && !isPlaceholderSrc(cur)) {
      clearDegrade(img);
    }
  }).observe(img, { attributes: true, attributeFilter: ['src'] });
}

/** 清降级态（可重复调用）：自愈 load / 恢复重载 / 组件接管 load / 换源观察者四路共用的唯一出口 */
function clearDegrade(img: HTMLImageElement): void {
  img.removeAttribute('data-cdn-down');
  img.removeAttribute('data-cdn-placeholder');
  delete img.dataset.cdnSrc;
}

/* 判「当前 src 是不是占位图形」。只认 data URI 前缀——浏览器/测试环境都可能把属性值
   （未编码的 `<>`）规范化后再回读，全串精确比较不可靠。 */
function isPlaceholderSrc(src: string): boolean {
  return src.startsWith('data:image/svg+xml,');
}

/** CDN 恢复：重载当前页面全部已降级图片（重设 src 重新请求；仍失败会再次标记，幂等） */
function reloadDownedImages(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-cdn-down]').forEach((img) => {
    const src = img.dataset.cdnSrc || img.getAttribute('src');
    clearDegrade(img);
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

  if (isCdnDown()) {
    markDown(img, true);
    return;
  }
  const fb = img.getAttribute('data-cdn-fallback');
  if (fb) {
    img.removeAttribute('data-cdn-fallback');
    img.src = fb;
    return;
  }

  markDown(img);
}

/** 对受管 img 启动挂起定时器（已 complete 或已有定时器则跳过） */
function watchStall(img: HTMLImageElement): void {
  if (img.complete || stallTimers.has(img)) return;
  /* lazy 图片进入视口前浏览器不会发起加载（complete 恒 false）——此时把「未加载」当作
     「请求挂起」会误标 data-cdn-down 隐藏（屏外卡片全量中招）。仅在浏览器真正开始拉取
     资源（loadstart）后再启动定时器；未开始的 lazy 图挂起监听，开始加载时经 watchStall 重入。 */
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
