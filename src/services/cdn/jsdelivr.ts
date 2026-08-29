/**
 * jsDelivr 源（自建 fork StarRailTextures 仓库镜像）
 *
 * 当前角色：回退源（fallback），仅补 nanoka 缺失的旧档资产——
 * fork 已停止跟随上游更新，仅含冻结时点前的资产；冻结后的新内容在本仓库不存在，
 * 主源必须是 nanoka（持续更新），禁止把 jsDelivr 重新设为任何分类的首选源
 * （唯一例外：trace 分类 nanoka 源为占位图，经 base.ts spec.jdPrimary 保持 jsDelivr 主源）。
 * 路径规则仍然有效（反向映射 + trace 主源 + 未来恢复同步后复用）：
 * - 官方 SpriteOutput/{SubDir}/... → spriteoutput/{subdir}/...（目录段小写，文件名保原大小写）
 * - 分类映射差异：skillicons 按角色 id 分目录（avatar/{id}/）；trace 在 ui/avatar/icon/；
 *   element 在 icondamagetype/（IconDamageType 前缀）；pathicon 在 professioniconmiddle/
 *   （Priest→Pirest、Elation→Joy 官方拼写差异）
 *
 * 若 fork 恢复同步：同步上游后无需改码；jsDelivr 有边缘缓存，新数据可能延迟生效，
 * 必要时 purge.jsdelivr.net 清缓存，并实测算复核命中率。
 */
import type { CdnCategory } from './base';
import { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH, OFFICIAL_ICON_BASE } from '../../lib/constants';

/** 分支与仓库基址（已统一收口到 lib/constants.ts，此处 re-export 保持路径兼容） */
export { USE_OFFICIAL_PATHS, JS_DELIVR_BRANCH };
export const JS_DELIVR_BASE = OFFICIAL_ICON_BASE;

/** 星魂图标官方源基址：ui/ui3d/rank/ 位于 assets/asbres/ 下，与 spriteoutput/ 平级
 * （JS_DELIVR_BASE 含 /spriteoutput 后缀，故独立收口；供 resolve 层 rank 分类特判）。 */
export const JS_DELIVR_UI3D_BASE = JS_DELIVR_BASE.replace(/\/spriteoutput$/, '');

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
  // 星魂本体展示图标：官方仓库位于 ui/ui3d/rank/_dependencies/textures/{charId}/{charId}_Rank_{num}.png
  // （与 nanoka rank 分类同构，官方 E1-6 全量收录，含 skillicons 目录缺失的 Rank3/5）
  // 注意：该目录与 spriteoutput/ 平级（assets/asbres/ui/...），resolve 层用 JS_DELIVR_UI3D_BASE 拼接
  rank: (f) => `ui/ui3d/rank/_dependencies/textures/${f.replace(/\.webp$/i, '')}.png`,
};

/** 通用转换规则：官方 SpriteOutput 完整路径 → 仓库相对路径（目录段小写、文件名保留）。
 * 与 converter config.py _rule_dir_lower 规则对齐；
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
    case 'rank': {
      // 官方路径 {charId}/{charId}_Rank_{num}.png → nanoka 等价文件（保留 charId 子目录）
      const m = url.match(/(\d+)\/(\d+_Rank_\d+)\.png$/i);
      return m ? `${m[1]}/${m[2]}.webp` : `${name}.webp`;
    }
    default:
      return `${name}.webp`;
  }
}
