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
  | null
  | (string & {});

export interface Skill {
  id: number;
  name: string;
  desc: string;
  simple_desc?: string;
  type: SkillType;
  type_name: string;
  icon?: string;
  tag?: string | null;
  sp_base?: number | null;
  sp_need?: number | null;
  bp_need?: number | null;
  bp_add?: number | null;
  show_stance_list?: number[] | null;
  stance_damage_type?: string | null;
  stance_damage_display?: number | null;
  skill_need?: string | null;
  max_level?: number | null;
  rated_rank_id?: number[] | null;
  rated_skill_tree_id?: number[] | null;
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

export interface StatusAdd {
  property_type: string;
  value: number;
  name: string;
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
  point_name?: string | null;
  point_desc?: string | null;
  point_trigger_key?: number;
  point_type?: number;
  pre_point?: number[];
  status_add_list?: StatusAdd[];
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
  relic_type_name?: string;
  property_type: string;
}

export interface CharRelics {
  avatar_id?: number;
  set4_id_list?: number[];
  set2_id_list?: number[];
  property_list?: RelicProp[];
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
  icon?: string;
  skills?: Record<string, Skill>;
  [k: string]: unknown;
}

export interface EnhancedBundle {
  skills?: Record<string, Skill>;
  ranks?: Record<string, Rank>;
  skill_trees?: Record<string, Record<string, SkillTree>>;
  descs?: string[] | null;
  sp_need?: number | null;
  skill_ids?: number[];
  rank_ids?: number[];
  [k: string]: unknown;
}

export interface CharacterData {
  name: string;
  name_en?: string;
  chara_info?: {
    camp?: string | null;
    va?: {
      chinese?: string | null;
      japanese?: string | null;
      korean?: string | null;
      english?: string | null;
    };
    stories?: Record<string, string | null>;
    voicelines?: unknown[];
  };
  rarity: string;
  avatar_vo_tag?: string;
  sp_need?: number | null;
  base_type: string;
  damage_type: string;
  ranks: Record<string, Rank>;
  skills: Record<string, Skill>;
  skill_trees: Record<string, Record<string, SkillTree>>;
  enhanced?: Record<string, EnhancedBundle>;
  memosprite?: Memosprite;
  unique?: Record<string, unknown>;
  stats: Record<string, CharStats>;
  relics?: CharRelics;
  lightcones?: number[];
  teams?: Team[];
  skin?: Record<string, unknown>;
}

export interface LocalCharEntry {
  id: number;
  name: string;
  full_name: string;
  rarity: number;
  path: string;
  element: string;
  sp_need: number | null;
  vo_tag: string;
  icon: string;
  icon_round: string;
  icon_mini: string;
  icon_cutin: string;
  rank_ids: number[];
  skill_ids: number[];
  release_version?: string;
}
export type LocalCharList = LocalCharEntry[];

export interface SkillAnimEntry {
  url: string;
  title?: string;
}

export type SkillAnimationsDb = Record<string, Record<string, SkillAnimEntry[]>>;
