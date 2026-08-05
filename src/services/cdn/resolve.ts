/**
 * CDN URL 解析（纯函数）：按分类解析双源 URL + v-html 卡片回退属性。
 * 统一收口：所有图片 URL 构造（icons.ts 及视图内联）最终经此解析。
 */
import { CDN } from '../../lib/constants';
import { escHtml } from '../../lib/html';
import { CDN_CATEGORIES, NANOKA_HUD, OFFICIAL_BASE, type CdnCategory, type CdnCategorySpec, type CdnSource } from './base';

/** 双源解析结果 */
export interface CdnUri {
  /** 首选源 URL（官方源存在时为官方，否则 nanoka） */
  primary: string;
  /** 回退源 URL（primary 为官方时 = nanoka；primary 为 nanoka 时 = '' 无回退） */
  fallback: string;
  source: CdnSource;
}

/** nanoka URL（按分类子路径拼接；spec 缺省用注册表默认） */
export function nanokaUrl(category: CdnCategory, file: string, spec = CDN_CATEGORIES[category]): string {
  return `${CDN}${NANOKA_HUD}/${spec.nanoka}/${file}`;
}

/** 双源解析：分类声明 official 且 OFFICIAL_BASE 非空时官方优先，否则仅 nanoka */
export function resolveCdnUri(
  category: CdnCategory,
  file: string,
  spec: CdnCategorySpec = CDN_CATEGORIES[category],
): CdnUri {
  if (spec.official && OFFICIAL_BASE) {
    return {
      primary: `${OFFICIAL_BASE}/${spec.official}/${file}`,
      fallback: nanokaUrl(category, file, spec),
      source: 'official',
    };
  }
  return { primary: nanokaUrl(category, file, spec), fallback: '', source: 'nanoka' };
}

/** 首选源 URL（现有纯函数返回单个字符串的快捷方式） */
export function cdnUri(category: CdnCategory, file: string): string {
  return resolveCdnUri(category, file).primary;
}

/** 通用原始子路径 URL（分类子路径不固定的场景，如 gridFightIconUrl） */
export function cdnRawUrl(subpath: string): string {
  return `${CDN}${NANOKA_HUD}/${subpath}`;
}

/** 依据主 URL 反查回退源（v-html 卡片用）：主源为官方且分类注册了官方源时返回 nanoka 等价 URL；否则 '' */
export function cdnFallbackFromPrimary(primary: string): string {
  if (!primary || !OFFICIAL_BASE || primary.startsWith(CDN)) return '';
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

/** 生成 v-html 卡片 <img> 的 data-cdn-fallback 属性（无回退源时返回空串） */
export function cdnImgFallbackAttr(src: string): string {
  const fb = cdnFallbackFromPrimary(src);
  return fb ? ` data-cdn-fallback="${escHtml(fb)}"` : '';
}