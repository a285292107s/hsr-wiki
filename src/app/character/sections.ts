import type { CharacterData } from '../../services/types';

/** 区块 id（对应面板 data-panel 值） */
export type SectionId =
  | 'stats'
  | 'skills'
  | 'talents'
  | 'eidolons'
  | 'bonuses'
  | 'cones'
  | 'teams'
  | 'relics'
  | 'stories'
  | 'profile';

export const SECTION_ORDER: SectionId[] = [
  'stats',
  'skills',
  'talents',
  'eidolons',
  'bonuses',
  'cones',
  'teams',
  'relics',
  'stories',
  'profile',
];

export const SECTION_IDX: Record<SectionId, string> = Object.fromEntries(
  SECTION_ORDER.map((id, i) => [id, String(i).padStart(2, '0')]),
) as Record<SectionId, string>;

export function hasStats(d: CharacterData): boolean {
  return !!d.stats && Object.keys(d.stats).length > 0;
}

export function hasTalentNodes(d: CharacterData): boolean {
  if (!d.skill_trees) return false;
  return Object.values(d.skill_trees).some((tree) => {
    const n = tree['1'] || tree[Object.keys(tree)[0]];
    return !!(n && n.point_name && n.point_desc);
  });
}

export function hasBonusNodes(d: CharacterData): boolean {
  if (!d.skill_trees) return false;
  return Object.values(d.skill_trees).some((tree) =>
    Object.values(tree).some((n) => n.status_add_list && n.status_add_list.length),
  );
}

export function hasStories(d: CharacterData): boolean {
  const st = d.chara_info && d.chara_info.stories;
  return !!st && Object.values(st).some((v) => !!v);
}

export function hasProfile(d: CharacterData): boolean {
  const va = d.chara_info && d.chara_info.va;
  return !!(va && (va.chinese || va.japanese || va.korean || va.english));
}

export function hasRelics(d: CharacterData): boolean {
  const r = d.relics;
  if (!r) return false;
  return !!(
    (r.property_list && r.property_list.length)
    || (r.sub_affix_property_list && r.sub_affix_property_list.length)
    || (r.set4_id_list && r.set4_id_list.length)
    || (r.set2_id_list && r.set2_id_list.length)
  );
}

export function visibleSections(d: CharacterData | null): SectionId[] {
  if (!d) return [];
  const vis: SectionId[] = [];
  if (hasStats(d)) vis.push('stats');
  vis.push('skills', 'eidolons');
  if (hasTalentNodes(d)) vis.push('talents');
  if (hasBonusNodes(d)) vis.push('bonuses');
  if (d.lightcones && d.lightcones.length) vis.push('cones');
  if (d.teams && d.teams.length) vis.push('teams');
  if (hasRelics(d)) vis.push('relics');
  if (hasStories(d)) vis.push('stories');
  if (hasProfile(d)) vis.push('profile');
  return vis.sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
}
