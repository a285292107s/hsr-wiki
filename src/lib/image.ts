import { cdnUri, type CdnCategory } from '../services/cdn';
import { escHtml } from './html';

export interface CdnImgAttrs {
  'data-cdn-src': string;
  alt: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
}

export interface ImgAttrs {
  src: string;
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
  return { src: url };
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
  const attrs: CdnImgAttrs = { 'data-cdn-src': url, alt };
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
  return `<img${cls} data-cdn-src="${escHtml(url)}" alt="${escHtml(alt)}"${title}${loading}${prio}>`;
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
