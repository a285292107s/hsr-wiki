/**
 * CDN URL 解析（纯函数）：按分类解析双源 URL + v-html 卡片回退属性。
 * 统一收口：所有图片 URL 构造（icons.ts 及视图内联）最终经此解析。
 */
import { CDN, USE_OFFICIAL_PATHS } from '../../lib/constants';
import { escHtml } from '../../lib/html';
import { CDN_CATEGORIES, NANOKA_HUD, OFFICIAL_BASE, type CdnCategory, type CdnCategorySpec, type CdnSource } from './base';
import { JS_DELIVR_BASE, JS_DELIVR_RULES, jsdelivrToNanokaFile } from './jsdelivr';

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

/** 双源解析：jsDelivr（StarRailTextures 镜像，注册了规则的分类）> 官方源 > nanoka */
export function resolveCdnUri(
  category: CdnCategory,
  file: string,
  spec: CdnCategorySpec = CDN_CATEGORIES[category],
): CdnUri {
  // jsDelivr 首选（核对脚本验证全命中的分类）：nanoka 保留回退；规则不适用（返回 null）时回退 nanoka
  const jdRule = JS_DELIVR_RULES[category];
  const jdPath = jdRule ? jdRule(file) : null;
  if (jdPath) {
    return {
      primary: `${JS_DELIVR_BASE}/${jdPath}`,
      fallback: nanokaUrl(category, file, spec),
      source: 'official',
    };
  }
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

/** 依据主 URL 反查回退源（v-html 卡片用）：jsDelivr 源反查 nanoka；主源为官方时返回 nanoka 等价 URL；否则 '' */
export function cdnFallbackFromPrimary(primary: string): string {
  if (!primary) return '';
  // jsDelivr 首选源 → nanoka 等价 URL（按分类规则反查文件名并验证路径一致性）
  if (primary.startsWith(JS_DELIVR_BASE)) {
    for (const [cat, rule] of Object.entries(JS_DELIVR_RULES) as [CdnCategory, (f: string) => string][]) {
      const file = jsdelivrToNanokaFile(cat, primary);
      if (file && `${JS_DELIVR_BASE}/${rule(file)}` === primary) {
        return nanokaUrl(cat, file, CDN_CATEGORIES[cat]);
      }
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

/** 生成 v-html 卡片 <img> 的 data-cdn-fallback 属性（无回退源时返回空串）
 *  Step 2: USE_OFFICIAL_PATHS=true → 非 Spine 图片不再使用 nanoka fallback，直接空串。
 *  T1 回退在 dom.ts 中读到空 fallback 时跳过 primary→nanoka 切换；仍保留 stall→CSS 占位降级。
 */
export function cdnImgFallbackAttr(src: string): string {
  if (USE_OFFICIAL_PATHS) return '';
  const fb = cdnFallbackFromPrimary(src);
  return fb ? ` data-cdn-fallback="${escHtml(fb)}"` : '';
}