import { cdnFallbackFromPrimary, cdnImgFallbackAttr, cdnUri, localFallback2FromPrimary, type CdnCategory } from '../services/cdn';
import { escHtml } from './html';

export interface CdnImgAttrs {
  'data-cdn-src': string;
  'data-cdn-fallback'?: string;
  'data-cdn-fallback2'?: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
}
export interface ImgAttrs {
  src: string;
  'data-cdn-fallback'?: string;
  'data-cdn-fallback2'?: string;
}

export interface ImgHtmlOptions {
  className?: string;
  alt?: string;
  title?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
}

export function cdnSrc(category: CdnCategory, file: string): string {
  return cdnUri(category, file);
}

export function imgAttrs(url: string): ImgAttrs {
  const fb = cdnFallbackFromPrimary(url);
  const fb2 = localFallback2FromPrimary(url);
  return { src: url, 'data-cdn-fallback': fb || undefined, 'data-cdn-fallback2': fb2 || undefined };
}

export function imgAttrsWith(
  url: string,
  extra: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return { ...imgAttrs(url), ...extra };
}

export function imgAttrsPair(
  url: string,
  fallback: string,
  extra: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    src: url,
    ...(fallback ? { 'data-cdn-fallback': fallback } : {}),
    ...extra,
  };
}

export function cdnImgAttrs(url: string, alt: string, opts?: {
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
}): CdnImgAttrs {
  const fb = cdnFallbackFromPrimary(url);
  const attrs: CdnImgAttrs = { 'data-cdn-src': url, alt };
  if (fb) attrs['data-cdn-fallback'] = fb;
  const fb2 = localFallback2FromPrimary(url);
  if (fb2) attrs['data-cdn-fallback2'] = fb2;
  if (opts?.loading) attrs.loading = opts.loading;
  if (opts?.fetchpriority) attrs.fetchpriority = opts.fetchpriority;
  return attrs;
}

export function imgHtml(url: string, opts: ImgHtmlOptions = {}): string {
  if (!url) return '';
  const cls = opts.className ? ` class="${escHtml(opts.className)}"` : '';
  const alt = opts.alt ?? '';
  const title = opts.title ? ` title="${escHtml(opts.title)}"` : '';
  const loading = opts.loading ? ` loading="${opts.loading}"` : '';
  const prio = opts.fetchpriority ? ` fetchpriority="${opts.fetchpriority}"` : '';
  return `<img${cls} data-cdn-src="${escHtml(url)}"${cdnImgFallbackAttr(url)} alt="${escHtml(alt)}"${title}${loading}${prio}>`;
}

export function bgStyle(url: string): { backgroundImage: string } | Record<string, never> {
  return url ? { backgroundImage: `url(${url})` } : {};
}

export function bgVar(url: string, varName: string): Record<string, string> {
  return { [varName]: `url(${url})` };
}

export function hideImgOnError(e: Event): void {
  (e.target as HTMLImageElement).style.display = 'none';
}

export function markImgError(e: Event): void {
  (e.target as HTMLImageElement).classList.add('nk-img-error');
}

export function swapImgOnError(url: string): (e: Event) => void {
  return (e) => { (e.target as HTMLImageElement).src = url; };
}
