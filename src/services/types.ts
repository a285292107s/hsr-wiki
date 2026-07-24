/**
 * CDN 数据类型定义（依据 cdn-samples 真实数据结构）
 * ⚠️ 样本仅供参考调试，运行时必须始终从 https://static.nanoka.cc 实时拉取
 */

/* ─── manifest.json ─── */

export interface GameManifest {
  latest: string;
  available: string[];
  live: string;
  /** 各版本新增内容 ID（仅增量，无完整列表端点 → 目录页必须沿用 DOM 抓取） */
  new: Record<string, (number | string)[]>;
}

export interface Manifest {
  hsr: GameManifest;
  [game: string]: GameManifest;
}

/* ─── character/{charId}.json ─── */

export interface SkillExtra {
  name: string;
  desc: string;
  param: number[];
}

export interface SkillLevel {
  level: number;
  param_list: number[];
}

export type SkillType =
  | 'Normal' | 'BPSkill' | 'Ultra' | 'Passive'
  | 'Maze' | 'Assist' | 'Servant' | 'ServantPassive'
  | (string & {});

export interface Skill {
  id: number;
  name: string;
  desc: string;
  simple_desc?: string;
  type: SkillType;
  type_name: string;
  tag?: string | null;
  sp_base?: number | null;
  bp_need?: number | null;
  bp_add?: number | null;
  /** 韧性消耗 [单攻, 群攻, 扩散] */
  show_stance_list?: number[] | null;
  skill_combo_value_delta?: unknown;
  extra?: Record<string, SkillExtra>;
  level?: Record<string, SkillLevel>;
}

export interface Rank {
  id: number;
  name: string;
  desc: string;
  icon: string;
  param_list: number[];
  extra?: Record<string, SkillExtra>;
}

export interface SkillTree {
  anchor?: string;
  avatar_promotion_limit?: number | null;
  avatar_level_limit?: number | null;
  default_unlock?: boolean;
  icon?: string;
  level_up_skill_id?: number[];
  material_list?: unknown[];
  max_level?: number;
  param_list?: number[];
  point_id?: number;
  /** 附加能力名称（行迹树节点） */
  point_name?: string | null;
  point_desc?: string | null;
  point_trigger_key?: number;
  point_type?: number;
  pre_point?: number[];
  status_add_list?: unknown[];
  extra?: Record<string, unknown>;
}

export interface CharStats {
  attack_base: number;
  attack_add: number;
  defence_base: number;
  defence_add: number;
  hp_base: number;
  hp_add: number;
  speed_base: number;
  critical_chance: number;
  critical_damage: number;
  base_aggro?: number;
  cost?: unknown[];
}

export interface RelicProp {
  relic_type: string;
  property_type: string;
}

export interface CharRelics {
  avatar_id?: number;
  set4_id_list?: number[];
  set2_id_list?: number[];
  /** 主词条（按部位） */
  property_list?: RelicProp[];
  /** 推荐副词条 */
  sub_affix_property_list?: string[];
  property_list3?: string[];
  property_list4?: string[];
  property_list5?: string[];
  property_list6?: string[];
  score_rank_list?: unknown[];
}

export interface Team {
  avatar_id: number;
  team_id: number;
  position: number;
  member_list: number[];
  backup_list1?: number[];
  backup_list2?: number[];
  backup_list3?: number[];
  backup_group_list1?: number[];
  backup_group_list2?: number[];
  backup_group_list3?: number[];
}

export interface Memosprite {
  /** 忆灵图标路径（解析忆灵 ID：SpriteOutput/ServantIconTeam/11415B.png → 11415） */
  icon?: string;
  skills?: Record<string, Skill>;
  [k: string]: unknown;
}

/** 加强版本数据包：覆盖 base 的 skills/ranks/skill_trees */
export interface EnhancedBundle {
  skills?: Record<string, Skill>;
  ranks?: Record<string, Rank>;
  skill_trees?: Record<string, Record<string, SkillTree>>;
  [k: string]: unknown;
}

export interface CharacterData {
  name: string;
  desc?: string;
  chara_info?: {
    camp?: unknown;
    va?: Record<string, string | null>;
    stories?: Record<string, unknown>;
    voicelines?: unknown[];
  };
  /** 稀有度（CombatPowerAvatarRarityType4/5） */
  rarity: string;
  avatar_vo_tag?: string;
  /** 终结技能量需求 */
  sp_need?: number;
  /** 命途（Mage/Knight/...） */
  base_type: string;
  /** 属性（Quantum/Wind/...） */
  damage_type: string;
  /** 星魂 1-6 */
  ranks: Record<string, Rank>;
  skills: Record<string, Skill>;
  /** 行迹树：pointKey → 等级 → 节点（原脚本 tree['1'] 取首级节点） */
  skill_trees: Record<string, Record<string, SkillTree>>;
  /** 加强版本（键如 "1"；空 = 无加强） */
  enhanced?: Record<string, EnhancedBundle>;
  /** 忆灵（记忆命途召唤物） */
  memosprite?: Memosprite;
  unique?: Record<string, unknown>;
  /** 属性表：突破阶段 0-6 → 基础属性 */
  stats: Record<string, CharStats>;
  relics?: CharRelics;
  /** 推荐光锥 ID */
  lightcones?: number[];
  teams?: Team[];
  skin?: Record<string, unknown>;
}

/* ─── item.json ─── */

export interface ItemInfo {
  item_name: string;
  item_sub_type: string;
  purpose_type?: number;
  /** SuperRare / VeryRare / Rare / NotNormal / Normal */
  rarity: string;
  item_figure_icon_path?: string;
}

export type ItemDb = Record<string, ItemInfo>;

/** id → 名称（光锥/遗器套装/角色，来自各自 JSON 的 name 字段） */
export type NameCache = Record<string, string>;

/* ─── relicset/{id}.json ─── */

export interface RelicSetData {
  name?: string;
  /** 图标路径（取末段数字 → itemfigures/{id}.webp） */
  icon?: string;
  /** 套装效果：件数 → { desc, param_list } */
  require_num?: Record<string, { desc?: string; param_list?: number[] }>;
  [k: string]: unknown;
}

/* ─── spine manifest ─── */

/** charId → spine 资源名（多段以 | 分隔，如 "bg|tibao1|tibao2"，解析时跳过 bg） */
export type SpineManifest = Record<string, string>;
