import { CDN } from '../../lib/constants';
import { escHtml } from '../../lib/html';
import { CDN_CATEGORIES, LOCAL_ICONS_BASE, NANOKA_HUD, OFFICIAL_BASE, type CdnCategory, type CdnCategorySpec, type CdnSource } from './base';
import { JS_DELIVR_BASE, JS_DELIVR_RULES, JS_DELIVR_UI3D_BASE, jsdelivrToNanokaFile } from './jsdelivr';

export interface CdnUri {
  primary: string;
  fallback: string;
  source: CdnSource;
}

export function nanokaUrl(category: CdnCategory, file: string, spec = CDN_CATEGORIES[category]): string {
  return `${CDN}${NANOKA_HUD}/${spec.nanoka}/${file}`;
}

function remoteCdnUri(
  category: CdnCategory,
  file: string,
  spec: CdnCategorySpec = CDN_CATEGORIES[category],
): CdnUri {
  const nanoka = nanokaUrl(category, file, spec);
  const jdRule = JS_DELIVR_RULES[category];
  const jdPath = jdRule ? jdRule(file) : null;
  const jdUrl = jdPath
    ? `${category === 'rank' ? JS_DELIVR_UI3D_BASE : JS_DELIVR_BASE}/${jdPath}`
    : '';
  if (jdUrl && spec.jdPrimary) {
    return { primary: jdUrl, fallback: nanoka, source: 'official' };
  }
  if (!jdUrl && spec.official && OFFICIAL_BASE) {
    return {
      primary: `${OFFICIAL_BASE}/${spec.official}/${file}`,
      fallback: nanoka,
      source: 'official',
    };
  }
  return { primary: nanoka, fallback: jdUrl, source: 'nanoka' };
}

export function resolveCdnUri(
  category: CdnCategory,
  file: string,
  spec: CdnCategorySpec = CDN_CATEGORIES[category],
): CdnUri {
  if (spec.local && (!spec.localFiles || spec.localFiles.test(file))) {
    return {
      primary: `${LOCAL_ICONS_BASE}/${spec.local}/${file}`,
      fallback: remoteCdnUri(category, file, spec).primary,
      source: 'local',
    };
  }
  return remoteCdnUri(category, file, spec);
}

export function cdnUri(category: CdnCategory, file: string): string {
  return resolveCdnUri(category, file).primary;
}

export function cdnRawUrl(subpath: string): string {
  return `${CDN}${NANOKA_HUD}/${subpath}`;
}

export function localFallbackFromPrimary(primary: string): string {
  if (!primary.startsWith(`${LOCAL_ICONS_BASE}/`)) return '';
  const rest = primary.slice(LOCAL_ICONS_BASE.length + 1);
  const slash = rest.indexOf('/');
  if (slash <= 0) return '';
  const dir = rest.slice(0, slash);
  const file = rest.slice(slash + 1);
  for (const [cat, spec] of Object.entries(CDN_CATEGORIES) as [CdnCategory, CdnCategorySpec][]) {
    if (spec.local !== dir) continue;
    if (spec.localFiles && !spec.localFiles.test(file)) continue;
    return remoteCdnUri(cat, file, spec).primary;
  }
  return '';
}

export function cdnFallbackFromPrimary(primary: string): string {
  if (!primary) return '';
  const localFb = localFallbackFromPrimary(primary);
  if (localFb) return localFb;
  if (primary.startsWith(JS_DELIVR_UI3D_BASE) && primary.includes('ui/ui3d/rank/')) {
    const file = jsdelivrToNanokaFile('rank', primary);
    return file ? nanokaUrl('rank', file, CDN_CATEGORIES['rank']) : '';
  }
  if (primary.startsWith(JS_DELIVR_BASE)) {
    for (const [cat, rule] of Object.entries(JS_DELIVR_RULES) as [CdnCategory, (f: string) => string][]) {
      const file = jsdelivrToNanokaFile(cat, primary);
      if (file && `${JS_DELIVR_BASE}/${rule(file)}` === primary) {
        return nanokaUrl(cat, file, CDN_CATEGORIES[cat]);
      }
    }
    return '';
  }
  const nanokaPrefix = `${CDN}${NANOKA_HUD}/`;
  if (primary.startsWith(nanokaPrefix)) {
    const rest = primary.slice(nanokaPrefix.length);
    for (const [cat, spec] of Object.entries(CDN_CATEGORIES) as [CdnCategory, CdnCategorySpec][]) {
      const marker = `${spec.nanoka}/`;
      if (!rest.startsWith(marker)) continue;
      const rule = JS_DELIVR_RULES[cat];
      const path = rule ? rule(rest.slice(marker.length)) : null;
      return path ? `${cat === 'rank' ? JS_DELIVR_UI3D_BASE : JS_DELIVR_BASE}/${path}` : '';
    }
    return '';
  }
  if (!OFFICIAL_BASE || primary.startsWith(CDN)) return '';
  for (const [cat, spec] of Object.entries(CDN_CATEGORIES) as [CdnCategory, CdnCategorySpec][]) {
    if (!spec.official) continue;
    const marker = `${spec.official}/`;
    if (primary.includes(marker)) {
      const file = primary.slice(primary.indexOf(marker) + marker.length);
      return nanokaUrl(cat, file, spec);
    }
  }
  return '';
}

export function cdnImgFallbackAttr(src: string): string {
  const fb = cdnFallbackFromPrimary(src);
  return fb ? ` data-cdn-fallback="${escHtml(fb)}"` : '';
}
