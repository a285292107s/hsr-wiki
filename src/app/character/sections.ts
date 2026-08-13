/**
 * 角色详情页区块配置（区块编号的单一事实源）。
 * - SECTION_ORDER：页面视觉顺序（即吸顶导航顺序）
 * - SECTION_IDX：固定编号（01-09，编号 = 身份不随数据漂移；数据缺失保留缺口）
 * - visibleSections：区块可见性纯函数（驱动导航同步隐藏 + CharacterView 面板挂载门控）
 * - has* 谓词：区块内容判定的单一事实源。导航（visibleSections）与 OverviewPanel /
 *   BuildsPanel 的 v-if 均消费同一实现——禁止在面板内复制同构判定，杜绝双份逻辑漂移。
 */
import type { CharacterData } from '../../services/types';

/** 区块 id（对应面板 data-panel 值） */
export type SectionId =
  | 'skills'
  | 'talents'
  | 'eidolons'
  | 'bonuses'
  | 'cones'
  | 'teams'
  | 'relics'
  | 'stories'
  | 'profile';

/** 页面视觉顺序（吸顶导航同序）；编号 = 下标 + 1 */
export const SECTION_ORDER: SectionId[] = [
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

/** 区块固定编号（两位，01-09）：标题与导航共用的唯一编号源 */
export const SECTION_IDX: Record<SectionId, string> = Object.fromEntries(
  SECTION_ORDER.map((id, i) => [id, String(i + 1).padStart(2, '0')]),
) as Record<SectionId, string>;

/** 行迹树是否存在附加能力节点（面板 TALENTS 区块共用） */
export function hasTalentNodes(d: CharacterData): boolean {
  if (!d.skill_trees) return false;
  return Object.values(d.skill_trees).some((tree) => {
    const n = tree['1'] || tree[Object.keys(tree)[0]];
    return !!(n && n.point_name && n.point_desc);
  });
}

/** 行迹树是否存在属性加成节点（面板 STAT BONUSES 区块共用） */
export function hasBonusNodes(d: CharacterData): boolean {
  if (!d.skill_trees) return false;
  return Object.values(d.skill_trees).some((tree) =>
    Object.values(tree).some((n) => n.status_add_list && n.status_add_list.length),
  );
}

/** 是否含角色故事（面板 STORIES 区块共用） */
export function hasStories(d: CharacterData): boolean {
  const st = d.chara_info && d.chara_info.stories;
  return !!st && Object.values(st).some((v) => !!v);
}

/** 是否含配音信息（面板 PROFILE 区块共用） */
export function hasProfile(d: CharacterData): boolean {
  const va = d.chara_info && d.chara_info.va;
  return !!(va && (va.chinese || va.japanese || va.korean || va.english));
}

/** 是否含遗器推荐（面板 RELICS 区块共用） */
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

/** 当前数据下可见区块（按页面视觉顺序）；skills / eidolons 恒显。数据未就绪（null）返回空集 */
export function visibleSections(d: CharacterData | null): SectionId[] {
  if (!d) return [];
  const vis: SectionId[] = ['skills', 'eidolons'];
  if (hasTalentNodes(d)) vis.push('talents');
  if (hasBonusNodes(d)) vis.push('bonuses');
  if (d.lightcones && d.lightcones.length) vis.push('cones');
  if (d.teams && d.teams.length) vis.push('teams');
  if (hasRelics(d)) vis.push('relics');
  if (hasStories(d)) vis.push('stories');
  if (hasProfile(d)) vis.push('profile');
  return vis.sort((a, b) => SECTION_ORDER.indexOf(a) - SECTION_ORDER.indexOf(b));
}
