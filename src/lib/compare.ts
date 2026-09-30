
import type { CharacterData, Rank, Skill, SkillTree } from '../services/types';

export type DiffKind =
  | 'desc' | 'simple_desc' | 'level' | 'tag' | 'sp_base'
  | 'stance_damage_display' | 'show_stance_list' | 'bp_need' | 'skill_need' | 'max_level'
  | 'param' | 'point_name' | 'point_desc' | 'status_add_list';

export interface SkillDiff {
  id: number;
  base: Skill;
  enh: Skill;
  kinds: DiffKind[];
}

export interface RankDiff {
  key: string;
  base: Rank;
  enh: Rank;
  kinds: DiffKind[];
}

export interface TreeDiff {
  anchor: string;
  level: string;
  base: SkillTree;
  enh: SkillTree;
  kinds: DiffKind[];
}

export interface CompareResult {
  skills: SkillDiff[];
  ranks: RankDiff[];
  trees: TreeDiff[];

  spChanged: boolean;
}

export function baseSkillId(enhId: number): number {
  return enhId - 1_000_000;
}

function eq(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

const SKILL_KINDS: Array<[keyof Skill, DiffKind]> = [
  ['desc', 'desc'],
  ['simple_desc', 'simple_desc'],
  ['tag', 'tag'],
  ['sp_base', 'sp_base'],
  ['stance_damage_display', 'stance_damage_display'],
  ['show_stance_list', 'show_stance_list'],
  ['bp_need', 'bp_need'],
  ['skill_need', 'skill_need'],
  ['max_level', 'max_level'],
];

function diffSkill(base: Skill, enh: Skill): DiffKind[] {
  const kinds: DiffKind[] = [];
  for (const [k, kind] of SKILL_KINDS) {
    if (!eq(base[k], enh[k])) kinds.push(kind);
  }
  if (!eqLevels(base.level, enh.level)) kinds.push('level');
  return kinds;
}

function eqLevels(
  a: Record<string, { param_list?: number[] }> | undefined,
  b: Record<string, { param_list?: number[] }> | undefined,
): boolean {
  const aKeys = a ? Object.keys(a) : [];
  const bKeys = b ? Object.keys(b) : [];
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!a || !b || !b[k] || !eq(a[k]!.param_list, b[k]!.param_list)) return false;
  }
  return true;
}

const RANK_KINDS: Array<[keyof Rank, DiffKind]> = [
  ['desc', 'desc'],
  ['param_list', 'param'],
];

function diffRank(base: Rank, enh: Rank): DiffKind[] {
  const kinds: DiffKind[] = [];
  for (const [k, kind] of RANK_KINDS) {
    if (!eq(base[k], enh[k])) kinds.push(kind);
  }
  return kinds;
}

const TREE_KINDS: Array<[keyof SkillTree, DiffKind]> = [
  ['point_name', 'point_name'],
  ['point_desc', 'point_desc'],
  ['param_list', 'param'],
  ['status_add_list', 'status_add_list'],
];

function diffTree(base: SkillTree, enh: SkillTree): DiffKind[] {
  const kinds: DiffKind[] = [];
  for (const [k, kind] of TREE_KINDS) {
    if (!eq(base[k], enh[k])) kinds.push(kind);
  }
  return kinds;
}

export function buildCompare(base: CharacterData | null | undefined, enhKey: string): CompareResult {
  const empty: CompareResult = { skills: [], ranks: [], trees: [], spChanged: false };
  if (!base || !base.enhanced) return empty;
  const enh = base.enhanced[enhKey];
  if (!enh) return empty;

  const skills: SkillDiff[] = [];
  for (const id of enh.skill_ids || []) {
    const bs = base.skills[String(baseSkillId(id))];
    const es = enh.skills ? enh.skills[String(id)] : undefined;
    if (!bs || !es) continue;
    const kinds = diffSkill(bs, es);
    if (kinds.length) skills.push({ id, base: bs, enh: es, kinds });
  }

  const ranks: RankDiff[] = [];
  for (const [key, er] of Object.entries(enh.ranks || {})) {
    const br = base.ranks[key];
    if (!br) continue;
    const kinds = diffRank(br, er);
    if (kinds.length) ranks.push({ key, base: br, enh: er, kinds });
  }

  const trees: TreeDiff[] = [];
  for (const [anchor, enhLevels] of Object.entries(enh.skill_trees || {})) {
    const baseLevels = base.skill_trees[anchor];
    for (const [lv, en] of Object.entries(enhLevels)) {
      const bn = baseLevels ? baseLevels[lv] : undefined;
      if (!bn) continue;
      const kinds = diffTree(bn, en);
      if (kinds.length) trees.push({ anchor, level: lv, base: bn, enh: en, kinds });
    }
  }

  return { skills, ranks, trees, spChanged: base.sp_need !== enh.sp_need };
}
