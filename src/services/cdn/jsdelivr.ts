/**
 * jsDelivr 加速源（自建 fork StarRailTextures 仓库镜像，跟 main 分支最新）
 *
 * 作为图片资源的首选源（primary），nanoka 保留回退（fallback）：
 * - jsDelivr 200（核对脚本全命中分类）→ nanoka 永不触发
 * - jsDelivr 404（上游未收录，如仓库未更新的新内容 / 星魂 3/5 官方无文件）→ 自动回退 nanoka
 *   （nanoka 同样缺失时由 img error 事件兜底降级）
 *
 * 路径规则（数据源官方路径 → 仓库结构，经 tools/check-sr-textures.mjs 实测）：
 * - 官方 SpriteOutput/{SubDir}/... → spriteoutput/{subdir}/...（目录段小写，文件名保原大小写）
 * - 分类映射差异：skillicons 按角色 id 分目录（avatar/{id}/）；trace 在 ui/avatar/icon/；
 *   element 在 icondamagetype/（IconDamageType 前缀）；pathicon 在 professioniconmiddle/
 *   （Priest→Pirest、Elation→Joy 官方拼写差异）
 *
 * 升级流程：自建 fork 同步上游后无需改码；jsDelivr 有边缘缓存，新数据可能延迟生效，
 * 必要时 purge.jsdelivr.net 清缓存，并重跑 node tools/check-sr-textures.mjs 复核命中率。
 */
import type { CdnCategory } from './base';
import { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH, OFFICIAL_ICON_BASE } from '../../lib/constants';

/** 分支与仓库基址（已统一收口到 lib/constants.ts，此处 re-export 保持路径兼容） */
export { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH };
export const JS_DELIVR_BASE = OFFICIAL_ICON_BASE;

/** 官方拼写差异（AvatarBaseType 数据源验证：Priest 官方写作 Pirest，Elation 官方写作 Joy）；键为项目传入的小写 baseType */
const PROFESSION_MAP: Record<string, string> = { priest: 'Pirest', elation: 'Joy' };
const PROFESSION_MAP_REV: Record<string, string> = Object.fromEntries(
  Object.entries(PROFESSION_MAP).map(([k, v]) => [v, k]),
);

/**
 * 分类 → jsDelivr 仓库相对路径（file 为项目 nanoka 文件名，含 .webp 后缀）。
 * 仅注册经核对脚本验证全命中的分类；新增分类前先跑核对脚本。
 * 返回 null 表示该文件名不适用于 jsDelivr 规则（如无角色 id 的虚构名），调用方回退 nanoka。
 */
export const JS_DELIVR_RULES: Partial<Record<CdnCategory, (file: string) => string | null>> = {
  avatarshopicon: (f) => `avatarshopicon/avatar/${f.replace(/\.webp$/i, '')}.png`,
  avatarroundicon: (f) => `avatarroundicon/avatar/${f.replace(/\.webp$/i, '')}.png`,
  avatardrawcard: (f) => `avatardrawcard/${f.replace(/\.webp$/i, '')}.png`,
  itemfigures: (f) => `itemfigures/${f.replace(/\.webp$/i, '')}.png`,
  lightconemediumicon: (f) => `lightconemediumicon/${f.replace(/\.webp$/i, '')}.png`,
  achievement: (f) => `achievement/${f.replace(/\.webp$/i, '')}.png`,
  trace: (f) => `ui/avatar/icon/${f.replace(/\.webp$/i, '')}.png`,
  monstermiddleicon: (f) => `monstermiddleicon/${f.replace(/\.webp$/i, '')}.png`,
  monsterfigure: (f) => `monsterfigure/${f.replace(/\.webp$/i, '')}.png`,
  relicfigures: (f) => {
    const base = f.replace(/\.webp$/i, '');
    // 通用部位图标（IconRelicBody/Foot/Neck/Goods）仓库无对应文件（官方仅套装件 1~4），回退 nanoka
    return /^IconRelic(?:Body|Foot|Neck|Goods)$/.test(base) ? null : `relicfigures/${base}.png`;
  },
  element: (f) => {
    const k = f.replace(/\.webp$/i, '');
    return `icondamagetype/IconDamageType${k[0].toUpperCase()}${k.slice(1).toLowerCase()}.png`;
  },
  pathicon: (f) => {
    const k = f.replace(/\.webp$/i, '');
    const mapped = PROFESSION_MAP[k.toLowerCase()] || `${k[0].toUpperCase()}${k.slice(1)}`;
    return `professioniconmiddle/IconProfession${mapped}Middle.png`;
  },
  skillicons: (f) => {
    const base = f.replace(/\.webp$/i, '');
    const id = base.match(/\d+/)?.[0];
    if (!id) return null;
    // 忆灵技能文件名以忆灵 ID 为前缀（SkillIcon_11402_Servant*），仓库目录却按角色 ID 组织
    // （skillicons/avatar/1402/）；忆灵 ID = 角色 ID + 10000（18007 → 8007 开拓者特例）
    const dir = /_Servant/.test(base) && Number(id) > 10000 ? String(Number(id) - 10000) : id;
    return `skillicons/avatar/${dir}/${base}.png`;
  },
};

/** 通用转换规则：官方 SpriteOutput 完整路径 → 仓库相对路径（目录段小写、文件名保留）。
 * 与 converter config.py _rule_dir_lower / tools/check-sr-textures.mjs 规则对齐；
 * 供输入为完整 SpriteOutput 路径、未注册 JS_DELIVR_RULES 分类的场景复用（如终局赛季页签图）。
 */
export function spriteOutputToRel(path: string): string {
  const rel = path.replace(/^SpriteOutput\//i, '');
  const parts = rel.split('/');
  return [...parts.slice(0, -1).map((s) => s.toLowerCase()), parts[parts.length - 1]].join('/');
}

/** jsDelivr URL → nanoka 等价文件名（cdnFallbackFromPrimary 反查用；未命中返回空串） */
export function jsdelivrToNanokaFile(category: CdnCategory, url: string): string {
  const name = url.split('/').pop()?.replace(/\.png$/i, '') ?? '';
  if (!name) return '';
  switch (category) {
    case 'element':
      return `${name.replace(/^IconDamageType/, '').toLowerCase()}.webp`;
    case 'pathicon': {
      const k = name.replace(/^IconProfession/, '').replace(/Middle$/, '');
      const orig = PROFESSION_MAP_REV[k] || k;
      return `${orig.toLowerCase()}.webp`;
    }
    default:
      return `${name}.webp`;
  }
}
