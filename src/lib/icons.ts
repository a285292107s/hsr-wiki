/**
 * 图标 / 图片 URL 构造器（无状态纯函数，全部基于 CDN 基址拼接）。
 * 属性类 URL（maxLevelStat / maxLevelValue）留在 format.ts。
 */
import { CDN, SERVANT_ICON_KEY, SKILL_ICON_KEY, SKILL_ICON_KEY_BY_NAME, TRAILBLAZER_ICON_FALLBACK } from './constants';
import type { CharacterData, ItemDb, NameCache, Skill } from '../services/types';

export function iconUrl(i: string | null | undefined): string {
  if (!i) return '';
  // 从完整路径中提取文件名（兼容 converter 输出的相对路径和 CDN 原始格式）
  const name = i.includes('/') ? i.split('/').pop()! : i;
  return `${CDN}/assets/hsr/skillicons/${name.replace('.png', '.webp')}`;
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
  const key = SKILL_ICON_KEY[sk.type ?? ''] || (sk.type_name && SKILL_ICON_KEY_BY_NAME[sk.type_name]) || '';
  if (!key || !charId) return '';
  let id = (key === 'Servant' || key === 'ServantPassive') ? memospriteId(charId, data) : charId;
  if (!id) return '';
  // 忆灵技图标 CDN 后缀不统一，按忆灵 ID 查映射表
  const iconKey = key === 'Servant' ? (SERVANT_ICON_KEY[id] || key) : key;
  // 开拓者偶数变体无图标资产，回退配对奇数 ID
  id = TRAILBLAZER_ICON_FALLBACK[id] || id;
  return `${CDN}/assets/hsr/skillicons/SkillIcon_${id}_${iconKey}.webp`;
}

/** 星魂图标：rank/_dependencies/textures/{charId}/{charId}_Rank_{num}.webp */
export function eidolonIconUrl(charId: string, rankNum: number | string): string {
  return `${CDN}/assets/hsr/rank/_dependencies/textures/${charId}/${charId}_Rank_${rankNum}.webp`;
}

/** 角色立绘（全身像）：avatardrawcard/{charId}.webp */
export function avatarDrawCardUrl(charId: string | number): string {
  return `${CDN}/assets/hsr/avatardrawcard/${charId}.webp`;
}

/** 物品图标：itemfigures/{数字}.webp（从 item_figure_icon_path 解析） */
export function itemIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/(\d+)\.png$/);
  if (!m) return '';
  return `${CDN}/assets/hsr/itemfigures/${m[1]}.webp`;
}

/* ─── 目录页图标 URL（standalone CDN 数据源，复现卡片图片命名规律） ─── */

/** 角色头像：avatarshopicon/{charId}.webp */
export function avatarShopIconUrl(charId: string | number): string {
  return charId ? `${CDN}/assets/hsr/avatarshopicon/${charId}.webp` : '';
}

/** 属性图标：element/{damageType 小写}.webp */
export function elementIconUrl(damageType: string | null | undefined): string {
  return damageType ? `${CDN}/assets/hsr/element/${damageType.toLowerCase()}.webp` : '';
}

/** 命途图标：pathicon/{baseType 小写}.webp */
export function pathIconUrl(baseType: string | null | undefined): string {
  return baseType ? `${CDN}/assets/hsr/pathicon/${baseType.toLowerCase()}.webp` : '';
}

/** 光锥立绘：lightconemediumicon/{id}.webp */
export function lightconeIconUrl(id: string | number): string {
  return id ? `${CDN}/assets/hsr/lightconemediumicon/${id}.webp` : '';
}

/** 敌对图像：monstermiddleicon/{basename}.webp（从 SpriteOutput/MonsterFigure/Monster_xxx.png 取末段去扩展名） */
export function monsterIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const base = iconPath.split('/').pop()?.replace(/\.png$/i, '') || '';
  return base ? `${CDN}/assets/hsr/monstermiddleicon/${base}.webp` : '';
}

/** 货币战争 GridFight 图标：SpriteOutput/GridFight/Equipment/350101.png → CDN webp */
export function gridFightIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/SpriteOutput\/(.+)\.png$/i);
  if (!m) return '';
  return `${CDN}/assets/hsr/${m[1].toLowerCase()}.webp`;
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
  return `${CDN}/assets/hsr/gridfight/equipment/${m[1]}.webp`;
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
  return `${CDN}/assets/hsr/gridfight/icon/${m[1]}.webp`;
}

/**
 * 货币战争角色详情页装备图标（带 ID 回退）：icon 非空时同 gridFightEquipIconUrl
 * （文件名保留原始大小写），为空时回退 `${id}.webp`（无图标数据的装备走 ID 命名）。
 */
export function gridFightEquipIconWithFallback(icon: string | null | undefined, id: number): string {
  if (icon) {
    const name = icon.includes('/') ? icon.split('/').pop()! : icon;
    return `${CDN}/assets/hsr/gridfight/equipment/${name.replace('.png', '.webp')}`;
  }
  return `${CDN}/assets/hsr/gridfight/equipment/${id}.webp`;
}

/** 货币战争角色详情页羁绊图标：按羁绊 ID 直接构造（与列表页按 icon 路径解析不同） */
export function gridFightTraitIconById(id: number): string {
  return `${CDN}/assets/hsr/gridfight/icon/${id}.webp`;
}

/** 物品名称解析：nameCache → itemDb（item_name 字段）→ '#id' 回退 */
export function itemName(id: string | number, nameCache: NameCache, itemDb: ItemDb): string {
  const key = String(id);
  return nameCache[key] || (itemDb[key] || {}).item_name || '#' + id;
}
