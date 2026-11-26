import { CDN } from '../../lib/constants';
import { isLocalIconUrl } from './resolve';

export const IMAGE_GATE_MAX_INFLIGHT = 6;
export const IMAGE_GATE_ROOT_MARGIN = '300px';
export const IMAGE_GATE_ATTR = 'data-cdn-src';

const BLANK_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function isThrottledRemote(url: string): boolean {
  return (
    url.startsWith(CDN) ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('raw.githubusercontent.com')
  );
}

function isGatedImageUrl(url: string): boolean {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false;
  return isLocalIconUrl(url) || isThrottledRemote(url);
}

const srcDesc = typeof HTMLImageElement !== 'undefined'
  ? Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
  : undefined;

let inflight = 0;
let gateActive = false;
let restoreSrc: (() => void) | null = null;

const queue: HTMLImageElement[] = [];
const inflightEls = new Set<HTMLImageElement>();
const waitingEls = new WeakSet<HTMLImageElement>();

let io: IntersectionObserver | null = null;
function getIO(): IntersectionObserver {
  if (!io) {
    io = new IntersectionObserver(
      () => schedulePump(),
      { rootMargin: IMAGE_GATE_ROOT_MARGIN },
    );
  }
  return io;
}

function isNearViewport(el: HTMLImageElement): boolean {
  if (!el.isConnected) return false;
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const vw = window.innerWidth || document.documentElement.clientWidth;
  const m = parseInt(IMAGE_GATE_ROOT_MARGIN, 10);
  return r.bottom >= -m && r.top <= vh + m && r.right >= -m && r.left <= vw + m;
}
let pumpScheduled = false;
function schedulePump(): void {
  if (pumpScheduled) return;
  pumpScheduled = true;
  requestAnimationFrame(() => {
    pumpScheduled = false;
    pump();
  });
}

function requestedUrl(el: HTMLImageElement): string {
  return el.getAttribute(IMAGE_GATE_ATTR) || '';
}

function loadEntry(el: HTMLImageElement, url: string): void {
  if (isThrottledRemote(url)) {
    inflight++;
    inflightEls.add(el);
  }
  srcDesc!.set!.call(el, url);
}

function pump(): void {
  for (let i = 0; i < queue.length; i++) {
    const el = queue[i];
    if (!el.isConnected) {
      queue.splice(i, 1);
      i--;
      continue;
    }
    const url = requestedUrl(el);
    if (!url) {
      queue.splice(i, 1);
      i--;
      io?.unobserve(el);
      continue;
    }
    if (!isNearViewport(el)) continue;
    if (isThrottledRemote(url) && inflight >= IMAGE_GATE_MAX_INFLIGHT) continue;
    queue.splice(i, 1);
    i--;
    io?.unobserve(el);
    loadEntry(el, url);
  }
}

function enqueue(el: HTMLImageElement, priority: boolean): void {
  if (priority) {
    const url = requestedUrl(el);
    if (url) loadEntry(el, url);
    return;
  }
  queue.push(el);
  getIO().observe(el);
  schedulePump();
}

function release(el: HTMLImageElement): void {
  if (el.getAttribute('src') === BLANK_SRC) return;
  if (inflightEls.delete(el) && inflight > 0) inflight--;
  waitingEls.delete(el);
  schedulePump();
}

function adopt(el: HTMLImageElement): void {
  if (waitingEls.has(el)) {
    schedulePump();
    return;
  }
  if (!el.isConnected) return;
  const real = el.getAttribute(IMAGE_GATE_ATTR);
  if (!real) return;
  if (!isGatedImageUrl(real)) {
    el.removeAttribute(IMAGE_GATE_ATTR);
    return;
  }
  waitingEls.add(el);
  srcDesc!.set!.call(el, BLANK_SRC);
  const priority = el.getAttribute('fetchpriority') === 'high';
  if (priority) el.removeAttribute('fetchpriority');
  enqueue(el, priority);
}

export function gateImagesIn(root: ParentNode): void {
  if (!gateActive) return;
  if (root instanceof HTMLImageElement) {
    adopt(root);
    return;
  }
  const imgs = (root as Document | Element).querySelectorAll?.('img');
  if (!imgs) return;
  for (const img of imgs) adopt(img as HTMLImageElement);
}

export function replaceImageSrc(img: HTMLImageElement, url: string): void {
  if (inflightEls.delete(img) && inflight > 0) inflight--;
  waitingEls.delete(img);
  img.src = url;
  schedulePump();
}

function installSrcInterceptor(): void {
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    enumerable: srcDesc!.enumerable,
    get() {
      return srcDesc!.get!.call(this);
    },
    set(value: string) {
      const el = this as HTMLImageElement;
      if (gateActive && typeof value === 'string' && isGatedImageUrl(value) && !waitingEls.has(el)) {
        waitingEls.add(el);
        el.setAttribute(IMAGE_GATE_ATTR, value);
        srcDesc!.set!.call(el, BLANK_SRC);
        const priority = el.getAttribute('fetchpriority') === 'high';
        if (priority) el.removeAttribute('fetchpriority');
        enqueue(el, priority);
        return;
      }
      srcDesc!.set!.call(el, value);
    },
  });
  restoreSrc = () => Object.defineProperty(HTMLImageElement.prototype, 'src', srcDesc!);
}

export function installImageGate(): () => void {
  if (gateActive || !srcDesc || typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }
  gateActive = true;
  installSrcInterceptor();

  const onSettled = (ev: Event): void => {
    const el = ev.target as HTMLImageElement;
    if (el instanceof HTMLImageElement) release(el);
  };
  document.addEventListener('load', onSettled, true);
  document.addEventListener('error', onSettled, true);

  const observer = new MutationObserver((records) => {
    for (const rec of records) {
      for (const node of rec.addedNodes) {
        if (node instanceof HTMLImageElement || node instanceof Element) {
          gateImagesIn(node as unknown as ParentNode);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  gateImagesIn(document);

  return () => {
    gateActive = false;
    document.removeEventListener('load', onSettled, true);
    document.removeEventListener('error', onSettled, true);
    observer.disconnect();
    io?.disconnect();
    io = null;
    queue.length = 0;
    inflightEls.clear();
    inflight = 0;
    restoreSrc?.();
    restoreSrc = null;
  };
}
