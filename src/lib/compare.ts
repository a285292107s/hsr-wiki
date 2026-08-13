/**
 * 对比模式（Comparison Mode，术语见 CONTEXT.md）纯函数：
 * 输入 base 角色数据 + 强化键，输出「实际变化」的技能/星魂/行迹条目与字段级变更明细。
 *
 * 判定规则（与 docs/adr/0010 Update 章节一致）：
 * - 加强技能 ID = base ID + 1_000_000（如 1100501 ↔ 100501）；星魂/行迹同 key 直接对比
 * - 忽略结构性字段：id / icon（ID 前缀差异）、rated_rank_id / rated_skill_tree_id
 *   （关联 ID 变化，无展示价值）、skill_combo_value_delta（前端无消费）、
 *   level_up_skill_id / point_id / pre_point / material_list（行迹 ID 前缀结构差异）、extra
 * - 行迹对比到 anchor×level 节点粒度（不聚合折叠）
 */
import type { CharacterData, Rank, Skill, SkillTree } from '../services/types';

/** 变化字段类型（面板据此选择展示形式） */
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
  /** 终结技能量需求是否变化（hero 展示联动） */
  spChanged: boolean;
}

/** 加强技能 ID → base 技能 ID（官方 11 前缀规则，见 ADR 0010） */
export function baseSkillId(enhId: number): number {
  return enhId - 1_000_000;
}

/** 归一比较（undefined/null 视为相等；对象按 JSON 结构比较） */
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

/** 技能 diff：白名单字段逐一比较；level 逐级比较 param_list，任一级不同即 'level' */
function diffSkill(base: Skill, enh: Skill): DiffKind[] {
  const kinds: DiffKind[] = [];
  for (const [k, kind] of SKILL_KINDS) {
    if (!eq(base[k], enh[k])) kinds.push(kind);
  }
  if (!eqLevels(base.level, enh.level)) kinds.push('level');
  return kinds;
}

/** 等级表 diff：key 并集逐级比较 param_list */
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

/**
 * 构建对比结果：仅返回有实际变化的条目（无变化的技能/星魂/行迹不输出）。
 * 无增强包或键不存在 → 全空结果。
 */
export function buildCompare(base: CharacterData | null | undefined, enhKey: string): CompareResult {
  const empty: CompareResult = { skills: [], ranks: [], trees: [], spChanged: false };
  if (!base || !base.enhanced) return empty;
  const enh = base.enhanced[enhKey];
  if (!enh) return empty;

  const skills: SkillDiff[] = [];
  for (const id of enh.skill_ids || []) {
    const bs = base.skills[String(baseSkillId(id))];
    const es = enh.skills ? enh.skills[String(id)] : undefined;
    if (!bs || !es) continue; // 单侧缺失视为数据异常，跳过（当前 10 角色无此情况）
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
      if (!bn) continue; // 整体新增节点（当前无此情况）不输出，避免结构性噪音
      const kinds = diffTree(bn, en);
      if (kinds.length) trees.push({ anchor, level: lv, base: bn, enh: en, kinds });
    }
  }

  return { skills, ranks, trees, spChanged: base.sp_need !== enh.sp_need };
}