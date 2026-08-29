/**
 * CDN URL 解析（纯函数）：按分类解析双源 URL + v-html 卡片回退属性。
 * 源优先级：本地图标（local-first）> nanoka 主源（持续更新）> jsDelivr 回退（旧档补全，
 * fork 停更后不再跟版本）；trace 例外保持 jsDelivr 主源（spec.jdPrimary，nanoka 源为占位图）。
 * 统一收口：所有图片 URL 构造（icons.ts 及视图内联）最终经此解析。
 */
import { CDN } from '../../lib/constants';
import { escHtml } from '../../lib/html';
import { CDN_CATEGORIES, LOCAL_ICONS_BASE, NANOKA_HUD, OFFICIAL_BASE, type CdnCategory, type CdnCategorySpec, type CdnSource } from './base';
import { JS_DELIVR_BASE, JS_DELIVR_RULES, JS_DELIVR_UI3D_BASE, jsdelivrToNanokaFile } from './jsdelivr';

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

/** 远端双源解析：nanoka 主源（持续更新）+ jsDelivr 回退（旧档补全；fork 已停止跟随上游，
 *  冻结后新增内容仅 nanoka 有，直拼 jsDelivr 必 404——禁止反转回旧优先级，除非 fork 恢复同步）。
 *  例外：spec.jdPrimary 分类（trace，nanoka 源为占位图）保持 jsDelivr 主源；
 *  spec.official 且 OFFICIAL_BASE 非空时官方源优先（预留插槽，当前 OFFICIAL_BASE 为空不生效）。 */
function remoteCdnUri(
  category: CdnCategory,
  file: string,
  spec: CdnCategorySpec = CDN_CATEGORIES[category],
): CdnUri {
  const nanoka = nanokaUrl(category, file, spec);
  // jsDelivr 回退：规则命中（核对脚本验证过的分类）才有等价 URL；规则不适用（返回 null）时无回退
  const jdRule = JS_DELIVR_RULES[category];
  const jdPath = jdRule ? jdRule(file) : null;
  const jdUrl = jdPath
    ? // rank（星魂图标）官方源与 spriteoutput/ 平级（assets/asbres/ui/ui3d/...），用独立基址拼接
      `${category === 'rank' ? JS_DELIVR_UI3D_BASE : JS_DELIVR_BASE}/${jdPath}`
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

/** 三级解析：本地图标（local-first）> jsDelivr 镜像 > 官方源 > nanoka。
 *  本地主源缺失（新版本新增图标未入库）时 fallback = 远端最优源
 *  （jsDelivr 规则命中 → jsDelivr，否则 nanoka），由 dom 委托在 img 失败时现场切换。 */
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

/** 首选源 URL（现有纯函数返回单个字符串的快捷方式） */
export function cdnUri(category: CdnCategory, file: string): string {
  return resolveCdnUri(category, file).primary;
}

/** 通用原始子路径 URL（分类子路径不固定的场景，如 gridFightIconUrl） */
export function cdnRawUrl(subpath: string): string {
  return `${CDN}${NANOKA_HUD}/${subpath}`;
}

/** 本地主源 URL 反查远端最优回退（dom 委托在本地 img 失败时现场调用）；非本地图标返回 '' */
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

/** 依据主 URL 反查回退源（v-html 卡片用）：本地图标反查远端最优源；nanoka 主源反查 jsDelivr 旧档
 *  （主源反转后的主路径）；jsDelivr 源反查 nanoka（jdPrimary 分类主源用）；否则 '' */
export function cdnFallbackFromPrimary(primary: string): string {
  if (!primary) return '';
  // 本地主源 → 远端最优源（jsDelivr 规则命中 → jsDelivr，否则 nanoka）
  const localFb = localFallbackFromPrimary(primary);
  if (localFb) return localFb;
  // 星魂图标官方源（ui/ui3d/rank，与 spriteoutput/ 平级）：按 rank 规则反查 nanoka 等价文件
  if (primary.startsWith(JS_DELIVR_UI3D_BASE) && primary.includes('ui/ui3d/rank/')) {
    const file = jsdelivrToNanokaFile('rank', primary);
    return file ? nanokaUrl('rank', file, CDN_CATEGORIES['rank']) : '';
  }
  // jsDelivr 源 → nanoka 等价 URL（按分类规则反查文件名并验证路径一致性）
  if (primary.startsWith(JS_DELIVR_BASE)) {
    for (const [cat, rule] of Object.entries(JS_DELIVR_RULES) as [CdnCategory, (f: string) => string][]) {
      const file = jsdelivrToNanokaFile(cat, primary);
      if (file && `${JS_DELIVR_BASE}/${rule(file)}` === primary) {
        return nanokaUrl(cat, file, CDN_CATEGORIES[cat]);
      }
    }
    return '';
  }
  // nanoka 主源 → jsDelivr 旧档等价 URL（按分类注册子路径定位文件后走正向规则；未注册规则的分类无回退）
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

/** 生成 v-html 卡片 <img> 的 data-cdn-fallback 属性（无回退源时返回空串）。
 *  主源失效切换由 dom.ts 委托执行（读到空 fallback 时跳过切换，保留 stall→CSS 占位降级）；
 *  禁止恢复「USE_OFFICIAL_PATHS=true 时返回空串」的短路——该模式下主源 404 无任何回退，
 *  是 jsDelivr fork 停更期间新内容破图的直接原因。 */
export function cdnImgFallbackAttr(src: string): string {
  const fb = cdnFallbackFromPrimary(src);
  return fb ? ` data-cdn-fallback="${escHtml(fb)}"` : '';
}