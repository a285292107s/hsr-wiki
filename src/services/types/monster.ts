import type { MazeBossPhase } from './endgame';

export interface MonsterListEntry {
  rank?: string;
  camp?: string | null;
  icon?: string;
  child?: (number | string)[];
  weak?: string[];
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  desc?: string;
}

export interface LocalMonsterEntry {
  id: number;
  name: string;
  icon: string;
  type?: string;
  weak?: string[];
  camp?: string;
  atlas_group?: number;
}
export type LocalMonsterList = LocalMonsterEntry[];

export interface MonsterExtraEffect {
  id: number;
  name: string;
  desc?: string;
  param_list?: number[];
}

export interface MonsterSkillDetail {
  id: number;
  name: string;
  tag?: string;
  type_desc?: string;
  damage_type?: string;
  attack_type?: string;
  desc?: string;
  param_list?: number[];
  phase_list?: number[];
  extra_effects?: MonsterExtraEffect[];
}

export interface MonsterDropItem {
  id: number;
  name: string;
  icon: string;
}

export interface MonsterDropTier {
  world_level: number | null;
  avatar_exp: number;
  items: MonsterDropItem[];
}

export interface MonsterAppearanceSample {
  id: number;
  name: string;
  activity?: string;
  level?: number;
  level_group?: number;
  elite_group?: number;
}

export interface MonsterAppearances {
  total: number;
  samples: MonsterAppearanceSample[];
}

export interface MonsterPhase {
  phase_id: number;
  weak: string[];
  resist: Record<string, number>;
  name?: string;
  intro?: string;
}

export interface MonsterStatusDetail {
  id: number;
  name: string;
  type: string;
  dispel?: boolean;
  desc?: string;
}

export interface MonsterArtShared {
  id: number;
  name: string;
  figure: boolean;
  forms: number;
}

export interface MonsterEventSource {
  name: string;
  tabs: string[];
  levels: number[];
  count: number;
}

export interface MonsterDetail {
  id: number;
  name: string;
  icon: string;
  figure: string;
  rank: string;
  camp: string;
  stance?: number;
  weak: string[];
  resist: Record<string, number>;
  intro: string;
  stats: { hp: number; atk: number; def: number; speed?: number };
  stat_ratio?: { hp?: number; atk?: number; def?: number; speed?: number };
  stance_modify?: number;
  speed_modify?: number;
  level_group?: number;
  elite_group?: number;
  skills: MonsterSkillDetail[];
  invaded?: MonsterInvaded;
  drops?: MonsterDropTier[];
  appearances?: MonsterAppearances;
  phases?: MonsterPhase[];
  guide_phases?: MazeBossPhase[];
  statuses?: MonsterStatusDetail[];
  event?: MonsterEventSource;
  art_shared?: MonsterArtShared;
}

export interface MonsterInvaded {
  invasion_ids: number[];
  stages: number[];
}
