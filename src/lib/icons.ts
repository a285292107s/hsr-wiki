/**
 * 图标 / 图片 URL 构造器（无状态纯函数）。
 * Step 1: USE_OFFICIAL_PATHS=false（默认）→ 统一经 services/cdn 解析双源（jsDelivr + nanoka fallback）。
 * Step 2: USE_OFFICIAL_PATHS=true → converter 输出官方 StarRailTextures 相对路径时，
 *   非 GridFight/Rank 等特殊分类直接拼 OFFICIAL_ICON_BASE，删除 nanoka 中转站（仅保留 stall→CSS 占位降级）。
 */
import { cdnUri, cdnRawUrl } from '../services/cdn';
import {
  USE_OFFICIAL_PATHS,
  OFFICIAL_ICON_BASE,
  SERVANT_ICON_KEY,
  SKILL_ICON_KEY,
  SKILL_ICON_KEY_BY_NAME,
  TRAILBLAZER_ICON_FALLBACK,
} from './constants';
import type { CharacterData, ItemDb, NameCache, Skill } from '../services/types';

/** 命途官方仓库拼写修正（Priest→Pirest / Elation→Joy，与 converter OFFICIAL_ICON_RULES 中一致） */
const PATH_SPELLING: Record<string, string> = { priest: 'Pirest', elation: 'Joy' };

/** USE_OFFICIAL_PATHS=true 时拼接官方基址 + 相对路径；相对路径为空串时返回 '' */
function official(pathRel: string): string {
  return pathRel ? `${OFFICIAL_ICON_BASE}/${pathRel}` : '';
}

/** 判断 iconPath 是否为"旧短路径"格式（icon/ 开头）；新格式直接以官方分类名开头（avatarshopicon/…） */
function isLegacyIconPath(p: string): boolean {
  return p.startsWith('icon/');
}

export function iconUrl(i: string | null | undefined): string {
  if (!i) return '';
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(i)) {
    return official(i);
  }
  // 从完整路径中提取文件名（兼容 converter 输出的相对路径和 CDN 原始格式）
  const name = i.includes('/') ? i.split('/').pop()! : i;
  return cdnUri('skillicons', name.replace('.png', '.webp'));
}

/** 忆灵 ID：优先从 memosprite.icon 解析（SpriteOutput/ServantIconTeam/11415B.png → 11415），回退 1+charId */
export function memospriteId(charId: string, data: CharacterData | null): string {
  const icon = data && data.memosprite && data.memosprite.icon;
  if (icon) {
    const m = icon.match(/(\d+)/);
    if (m) return m[1];
  }
  return charId ? '1' + charId : '';
}

export function skillIconUrl(sk: Skill, charId: string, data: CharacterData | null): string {
  // 源数据 SkillIcon 字段优先（converter 输出，事实源）：覆盖大世界攻击复用普攻图标、
  // Normal02/BP02/AssisSkill01-03 等 type 无法推断的变体命名；空串回退 type 推断
  if (sk.icon) return iconUrl(sk.icon);
  const key = SKILL_ICON_KEY[sk.type ?? ''] || (sk.type_name && SKILL_ICON_KEY_BY_NAME[sk.type_name]) || '';
  if (!key || !charId) return '';
  let id = (key === 'Servant' || key === 'ServantPassive') ? memospriteId(charId, data) : charId;
  if (!id) return '';
  // 忆灵技图标 CDN 后缀不统一，按忆灵 ID 查映射表
  const iconKey = key === 'Servant' ? (SERVANT_ICON_KEY[id] || key) : key;
  // 开拓者偶数变体无图标资产，回退配对奇数 ID
  id = TRAILBLAZER_ICON_FALLBACK[id] || id;
  if (USE_OFFICIAL_PATHS) {
    // 忆灵技能文件名按忆灵 ID（SkillIcon_11402_Servant*），仓库目录按角色 ID 组织
    // （skillicons/avatar/1402/；忆灵 ID = 角色 ID + 10000，18007 → 8007 开拓者特例）
    const isServant = key === 'Servant' || key === 'ServantPassive';
    const dir = isServant && Number(id) > 10000 ? String(Number(id) - 10000) : id;
    return official(`skillicons/avatar/${dir}/SkillIcon_${id}_${iconKey}.png`);
  }
  return cdnUri('skillicons', `SkillIcon_${id}_${iconKey}.webp`);
}

/** 星魂本体展示图标：经 rank 分类双源解析（jsDelivr 官方源首选 + nanoka 回退，E1-6 全量）。
 * 官方仓库位于 ui/ui3d/rank/_dependencies/textures/{charId}/{charId}_Rank_{num}.png，
 * 收录 E1-6 全套（含 skillicons/avatar/ 目录缺失的 Rank3/5——AvatarRankConfig.IconPath
 * 对 E3/E5 指向所加成技能图标，buff 栏用图标；本体展示仍须用 Rank{num} 文件）。
 * buff 栏图标（技能卡片强化一栏）使用 ranks[].icon（源数据 IconPath），与此不同源。 */
export function eidolonIconUrl(charId: string, rankNum: number | string): string {
  return charId ? cdnUri('rank', `${charId}/${charId}_Rank_${rankNum}.webp`) : '';
}

/** 角色立绘（全身像）：avatardrawcard/{charId}.webp */
export function avatarDrawCardUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatardrawcard/${charId}.png`);
  }
  return cdnUri('avatardrawcard', `${charId}.webp`);
}

/** 物品图标：itemfigures/{数字}.webp（从 item_figure_icon_path 解析） */
export function itemIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(iconPath)) {
    // 未转换的 SpriteOutput 完整路径（converter 遗漏）：官方仓库目录段全小写、文件名保持
    let rel = iconPath.replace(/^SpriteOutput\//i, '');
    if (iconPath.startsWith('SpriteOutput/') && rel.includes('/')) {
      const parts = rel.split('/');
      rel = [...parts.slice(0, -1).map((s) => s.toLowerCase()), parts[parts.length - 1]].join('/');
    }
    return official(rel.replace(/\.png$/i, '') + '.png');
  }
  const m = iconPath.match(/(\d+)\.png$/);
  if (!m) return '';
  return cdnUri('itemfigures', `${m[1]}.webp`);
}

/* ─── 目录页图标 URL（standalone CDN 数据源，复现卡片图片命名规律） ─── */

/** 角色头像：avatarshopicon/{charId}.webp */
export function avatarShopIconUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatarshopicon/avatar/${charId}.png`);
  }
  return charId ? cdnUri('avatarshopicon', `${charId}.webp`) : '';
}

/** 角色圆头像（游戏内角色列表头像）：avatarroundicon/{charId}.webp（127×127 透明圆像） */
export function avatarRoundIconUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatarroundicon/avatar/${charId}.png`);
  }
  return charId ? cdnUri('avatarroundicon', `${charId}.webp`) : '';
}

/** 属性图标：icondamagetype/IconDamageType{damageType 首字母大写 + 尾小写}.png */
export function elementIconUrl(damageType: string | null | undefined): string {
  if (USE_OFFICIAL_PATHS && damageType) {
    const cap = damageType[0].toUpperCase() + damageType.slice(1).toLowerCase();
    return official(`icondamagetype/IconDamageType${cap}.png`);
  }
  return damageType ? cdnUri('element', `${damageType.toLowerCase()}.webp`) : '';
}

/** 命途图标：pathicon/{baseType 小写}.webp */
export function pathIconUrl(baseType: string | null | undefined): string {
  if (USE_OFFICIAL_PATHS && baseType) {
    const k = baseType.toLowerCase();
    const mapped = PATH_SPELLING[k] || `${k[0].toUpperCase()}${k.slice(1)}`;
    return official(`professioniconmiddle/IconProfession${mapped}Middle.png`);
  }
  return baseType ? cdnUri('pathicon', `${baseType.toLowerCase()}.webp`) : '';
}

/** 光锥立绘：lightconemediumicon/{id}.png */
export function lightconeIconUrl(id: string | number): string {
  if (USE_OFFICIAL_PATHS && id) {
    return official(`lightconemediumicon/${id}.png`);
  }
  return id ? cdnUri('lightconemediumicon', `${id}.webp`) : '';
}

/**
 * 怪物图标官方路径统一构造。
 * 输入兼容三种形态：
 * - 官方相对路径（monstermiddleicon/Monster_xxx.png，converter --official-icon-paths 输出）→ 直接拼基址
 * - 完整 SpriteOutput 路径（converter 遗漏转换的旧数据，含官方错拼 MosterIcon）→ 剥前缀 + 归类目录
 * - basename（monster_common 详情页输出的 ManikinImagePath / ImagePath 末段）→ 补官方分类目录
 * USE_OFFICIAL_PATHS=false 时统一走 CDN basename 分支（降级/测试场景）。
 */
function monsterOfficialUrl(iconPath: string, cat: 'monstermiddleicon' | 'monsterfigure'): string {
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(iconPath)) {
    let rel = iconPath.replace(/^SpriteOutput\//i, '');
    if (!rel.includes('/')) rel = `${cat}/${rel}`;
    // 官方仓库怪物图标目录为 monstermiddleicon（源数据错拼 Moster/MonsterIcon）
    rel = rel.replace(/^(Moster|Monster)Icon\//, 'monstermiddleicon/');
    return official(rel.replace(/\.png$/i, '') + '.png');
  }
  const base = iconPath.split('/').pop()?.replace(/\.png$/i, '') || '';
  return base ? cdnUri(cat, `${base}.webp`) : '';
}

/** 敌对图像：monstermiddleicon/{basename}.webp */
export function monsterIconUrl(iconPath: string | null | undefined): string {
  return iconPath ? monsterOfficialUrl(iconPath, 'monstermiddleicon') : '';
}

/** 敌对全身立绘：monsterfigure/{basename}.webp（无立绘返回空串） */
export function monsterFigureUrl(iconPath: string | null | undefined): string {
  return iconPath ? monsterOfficialUrl(iconPath, 'monsterfigure') : '';
}

/** 货币战争 GridFight 图标：SpriteOutput/GridFight/Equipment/350101.png → CDN webp */
export function gridFightIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/SpriteOutput\/(.+)\.png$/i);
  if (!m) return '';
  return cdnRawUrl(`${m[1].toLowerCase()}.webp`);
}

/**
 * 货币战争装备专用图标：CDN 统一存于 gridfight/equipment/{文件名}.webp（保留原始大小写）。
 * 源路径可能为 Equipment/350101.png 或 GridItem/GridFight_WeaponBox3.png，
 * 两者均映射到 equipment 目录，且命名图标（非数字 ID）须保留大小写。
 */
export function gridFightEquipIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/([^/]+)\.png$/i);
  if (!m) return '';
  return cdnUri('gridfight-equipment', `${m[1]}.webp`);
}

/**
 * 货币战争羁绊图标：CDN 统一存于 gridfight/icon/{文件名}.webp。
 * 源路径为 TraitIcon/Icon/1001.png 或 TraitIcon/MiniIcon/1001S.png，
 * 均映射到 gridfight/icon/ 目录。
 */
export function gridFightTraitIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/([^/]+)\.png$/i);
  if (!m) return '';
  return cdnUri('gridfight-icon', `${m[1]}.webp`);
}

/**
 * 货币战争角色详情页装备图标（带 ID 回退）：icon 非空时同 gridFightEquipIconUrl
 * （文件名保留原始大小写），为空时回退 `${id}.webp`（无图标数据的装备走 ID 命名）。
 */
export function gridFightEquipIconWithFallback(icon: string | null | undefined, id: number): string {
  if (icon) {
    const name = icon.includes('/') ? icon.split('/').pop()! : icon;
    return cdnUri('gridfight-equipment', name.replace('.png', '.webp'));
  }
  return cdnUri('gridfight-equipment', `${id}.webp`);
}

/** 货币战争角色详情页羁绊图标：按羁绊 ID 直接构造（与列表页按 icon 路径解析不同） */
export function gridFightTraitIconById(id: number): string {
  return cdnUri('gridfight-icon', `${id}.webp`);
}

/** 物品名称解析：nameCache → itemDb（item_name 字段）→ '#id' 回退 */
export function itemName(id: string | number, nameCache: NameCache, itemDb: ItemDb): string {
  const key = String(id);
  return nameCache[key] || (itemDb[key] || {}).item_name || '#' + id;
}
