import { isCdnDown, subscribeCdnHealth } from './health';
import { isLocalIconUrl, nextFallbackFrom } from './resolve';
import { MISSING_ICON_SRC } from './placeholder';
import { gateImagesIn, replaceImageSrc } from './img-gate';

export const CDN_STALL_TIMEOUT_MS = 10_000;

const DEGRADED_SRC_ATTR = 'data-cdn-degraded-src';

function isManagedImage(src: string): boolean {
  return /^https?:\/\//.test(src) || isLocalIconUrl(src);
}

function markDown(img: HTMLImageElement, noPlaceholder = false): void {
  if (img.dataset.cdnDown) return;
  img.dataset.cdnDown = '1';
  const src = img.getAttribute('src') || '';
  if (noPlaceholder || img.hasAttribute('data-cdn-placeholder') || img.hasAttribute('data-cdn-noph') || !isManagedImage(src)) {
    img.addEventListener('load', () => clearDegrade(img), { once: true });
    return;
  }
  let placeholderLoaded = false;
  img.setAttribute(DEGRADED_SRC_ATTR, src);
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

function watchDegradedSrcSwap(img: HTMLImageElement): void {
  new MutationObserver(() => {
    const cur = img.getAttribute('src') || '';
    if (img.hasAttribute('data-cdn-down') && cur !== img.getAttribute(DEGRADED_SRC_ATTR) && !isPlaceholderSrc(cur)) {
      clearDegrade(img);
    }
  }).observe(img, { attributes: true, attributeFilter: ['src'] });
}

function clearDegrade(img: HTMLImageElement): void {
  img.removeAttribute('data-cdn-down');
  img.removeAttribute('data-cdn-placeholder');
  img.removeAttribute(DEGRADED_SRC_ATTR);
}

function isPlaceholderSrc(src: string): boolean {
  return src.startsWith('data:image/svg+xml,');
}

function reloadDownedImages(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-cdn-down]').forEach((img) => {
    const src = img.getAttribute(DEGRADED_SRC_ATTR) || img.getAttribute('src');
    clearDegrade(img);
    if (src && !src.startsWith('data:')) replaceImageSrc(img, src);
  });
}

const stallTimers = new WeakMap<HTMLImageElement, ReturnType<typeof setTimeout>>();

function clearStallTimer(img: HTMLImageElement): void {
  const t = stallTimers.get(img);
  if (t !== undefined) {
    clearTimeout(t);
    stallTimers.delete(img);
  }
}

function handleFailure(img: HTMLImageElement): void {
  const src = img.getAttribute('src') || '';
  if (!isManagedImage(src)) return;
  if (!isLocalIconUrl(src) && isCdnDown()) {
    markDown(img, true);
    return;
  }
  const override = img.getAttribute('data-cdn-fallback');
  const next = override || nextFallbackFrom(src);
  if (next && next !== src) {
    img.removeAttribute('data-cdn-fallback');
    replaceImageSrc(img, next);
    return;
  }
  markDown(img);
}

function watchStall(img: HTMLImageElement): void {
  if (img.complete || stallTimers.has(img)) return;
  if (img.loading === 'lazy' && !img.currentSrc) {
    img.addEventListener('loadstart', () => watchStall(img), { once: true });
    return;
  }
  const t = setTimeout(() => {
    stallTimers.delete(img);
    if (!img.complete && !img.dataset.cdnDown) handleFailure(img);
  }, CDN_STALL_TIMEOUT_MS);
  stallTimers.set(img, t);
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

  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type === 'attributes' && rec.attributeName === 'src') {
        watchStall(rec.target as HTMLImageElement);
      } else if (rec.type === 'childList') {
        for (const node of rec.addedNodes) {
          if (node instanceof HTMLImageElement) watchStall(node);
          if (node instanceof Element) {
            node.querySelectorAll('img').forEach((img) => watchStall(img));
          }
          if (node instanceof HTMLImageElement || node instanceof Element) {
            gateImagesIn(node as unknown as ParentNode);
          }
        }
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
