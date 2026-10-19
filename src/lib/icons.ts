
import { cdnFallbackFromPrimary, cdnUri, nanokaUrl, resolveCdnUri } from '../services/cdn';
import {
  USE_OFFICIAL_PATHS,
  OFFICIAL_ICON_BASE,
  SERVANT_ICON_KEY,
  SKILL_ICON_KEY,
  SKILL_ICON_KEY_BY_NAME,
  TRAILBLAZER_ICON_FALLBACK,
} from './constants';
import type { CharacterData, ItemDb, NameCache, Skill } from '../services/types';

function official(pathRel: string): string {
  return pathRel ? `${OFFICIAL_ICON_BASE}/${pathRel}` : '';
}

function isLegacyIconPath(p: string): boolean {
  return p.startsWith('icon/');
}

export function iconUrl(i: string | null | undefined): string {
  if (!i) return '';
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(i)) {
    return official(i);
  }
  const name = i.includes('/') ? i.split('/').pop()! : i;
  return cdnUri('skillicons', name.replace('.png', '.webp'));
}

export function iconImgAttrs(url: string): { src: string; 'data-cdn-fallback'?: string } {
  const fb = cdnFallbackFromPrimary(url);
  return { src: url, 'data-cdn-fallback': fb || undefined };
}

export function memospriteId(charId: string, data: CharacterData | null): string {
  const icon = data && data.memosprite && data.memosprite.icon;
  if (icon) {
    const m = icon.match(/(\d+)/);
    if (m) return m[1];
  }
  return charId ? '1' + charId : '';
}

export function skillIconUrl(sk: Skill, charId: string, data: CharacterData | null): string {
  if (sk.icon) return iconUrl(sk.icon);
  const key = SKILL_ICON_KEY[sk.type ?? ''] || (sk.type_name && SKILL_ICON_KEY_BY_NAME[sk.type_name]) || '';
  if (!key || !charId) return '';
  let id = (key === 'Servant' || key === 'ServantPassive') ? memospriteId(charId, data) : charId;
  if (!id) return '';
  const iconKey = key === 'Servant' ? (SERVANT_ICON_KEY[id] || key) : key;
  id = TRAILBLAZER_ICON_FALLBACK[id] || id;
  if (USE_OFFICIAL_PATHS) {
    const isServant = key === 'Servant' || key === 'ServantPassive';
    const dir = isServant && Number(id) > 10000 ? String(Number(id) - 10000) : id;
    return official(`skillicons/avatar/${dir}/SkillIcon_${id}_${iconKey}.png`);
  }
  return cdnUri('skillicons', `SkillIcon_${id}_${iconKey}.webp`);
}

export function eidolonIconUrl(charId: string, rankNum: number | string): string {
  return charId ? cdnUri('rank', `${charId}/${charId}_Rank_${rankNum}.webp`) : '';
}

export function avatarDrawCardUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatardrawcard/${charId}.png`);
  }
  return cdnUri('avatardrawcard', `${charId}.webp`);
}

export function avatarDrawCardJdUrl(charId: string | number): string {
  return charId ? official(`avatardrawcard/${charId}.png`) : '';
}

export function avatarDrawCardWebpUrl(charId: string | number): string {
  return charId ? nanokaUrl('avatardrawcard', `${charId}.webp`) : '';
}

export function avatarCutinFigureUrl(charId: string | number): string {
  return charId ? cdnUri('avatarcutinfigures', `${charId}.webp`) : '';
}

export function lightConeMaxFigureUrl(coneId: string | number): string {
  return coneId ? cdnUri('lightconemaxfigures', `${coneId}.webp`) : '';
}

export function itemIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(iconPath)) {
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

export function avatarShopIconUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatarshopicon/avatar/${charId}.png`);
  }
  return charId ? cdnUri('avatarshopicon', `${charId}.webp`) : '';
}

export function avatarRoundIconUrl(charId: string | number): string {
  if (USE_OFFICIAL_PATHS && charId) {
    return official(`avatarroundicon/avatar/${charId}.png`);
  }
  return charId ? cdnUri('avatarroundicon', `${charId}.webp`) : '';
}

export function elementIconUrl(damageType: string | null | undefined): string {
  return damageType ? cdnUri('element', `${damageType.toLowerCase()}.webp`) : '';
}

export function pathIconUrl(baseType: string | null | undefined): string {
  return baseType ? cdnUri('pathicon', `${baseType.toLowerCase()}.webp`) : '';
}

export function lightconeIconUrl(id: string | number): string {
  if (USE_OFFICIAL_PATHS && id) {
    return official(`lightconemediumicon/${id}.png`);
  }
  return id ? cdnUri('lightconemediumicon', `${id}.webp`) : '';
}

function monsterOfficialUrl(iconPath: string, cat: 'monstermiddleicon' | 'monsterfigure'): string {
  if (USE_OFFICIAL_PATHS && !isLegacyIconPath(iconPath)) {
    let rel = iconPath.replace(/^SpriteOutput\//i, '');
    if (!rel.includes('/')) rel = `${cat}/${rel}`;
    rel = rel.replace(/^(Moster|Monster)Icon\//, 'monstermiddleicon/');
    return official(rel.replace(/\.png$/i, '') + '.png');
  }
  const base = iconPath.split('/').pop()?.replace(/\.png$/i, '') || '';
  return base ? cdnUri(cat, `${base}.webp`) : '';
}

export function monsterIconUrl(iconPath: string | null | undefined): string {
  return iconPath ? monsterOfficialUrl(iconPath, 'monstermiddleicon') : '';
}

export function monsterFigureUrl(iconPath: string | null | undefined): string {
  return iconPath ? monsterOfficialUrl(iconPath, 'monsterfigure') : '';
}

export function gridFightIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/SpriteOutput\/(.+)\.png$/i);
  if (!m) return '';
  return cdnUri('gridfight-asset', `${m[1].toLowerCase()}.webp`);
}

export function gridFightAffixIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const base = iconPath.split('/').pop()?.replace(/\.png$/i, '');
  return base ? cdnUri('gridfight-affix', `${base.toLowerCase()}.webp`) : '';
}

export function gridFightEquipIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/([^/]+)\.png$/i);
  if (!m) return '';
  return cdnUri('gridfight-equipment', `${m[1]}.webp`);
}

export function gridFightTraitIconUrl(iconPath: string | null | undefined): string {
  if (!iconPath) return '';
  const m = iconPath.match(/([^/]+)\.png$/i);
  if (!m) return '';
  return cdnUri('gridfight-icon', `${m[1]}.webp`);
}

export function gridFightEquipIconWithFallback(icon: string | null | undefined, id: number): string {
  if (icon) {
    const name = icon.includes('/') ? icon.split('/').pop()! : icon;
    return cdnUri('gridfight-equipment', name.replace('.png', '.webp'));
  }
  return cdnUri('gridfight-equipment', `${id}.webp`);
}

export function gridFightTraitIconById(id: number): string {
  return cdnUri('gridfight-icon', `${id}.webp`);
}

export function gridFightSkillIconSrc(icon: string | null | undefined): { src: string; fb: string } {
  if (!icon) return { src: '', fb: '' };
  const name = icon.split('/').pop()?.replace(/\.png$/i, '') || '';
  if (!name) return { src: '', fb: '' };
  const { primary, fallback } = resolveCdnUri('skillicons', `${name}.webp`);
  return { src: primary, fb: fallback };
}

export function gridFightPropIconUrl(icon: string | null | undefined): string {
  if (!icon) return '';
  const m = icon.match(/SpriteOutput\/(.+)\.png$/i);
  if (!m) return '';
  const parts = m[1].split('/');
  const name = parts.pop()!;
  return official(`${parts.join('/').toLowerCase()}/${name}.png`);
}

export function itemName(id: string | number, nameCache: NameCache, itemDb: ItemDb): string {
  const key = String(id);
  return nameCache[key] || (itemDb[key] || {}).item_name || '#' + id;
}

export function tutorialPicUrl(image: string | null | undefined): string {
  if (!image) return '';
  return cdnUri('tutorialpic', `${image.replace(/\.(webp|png)$/i, '')}.webp`);
}
