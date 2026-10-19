export interface LocalLightConeEntry {
  id: number;
  name: string;
  rarity: number;
  path: string;
  skill_id: number;
  skill_name: string;
  skill_desc: string;
  icon: string;
  icon_figure: string;
  release_version?: string;
}
export type LocalLightConeList = LocalLightConeEntry[];

export interface LightConeSkillLevel {
  level: number;
  param_list: number[];
}

export interface LightConeSkill {
  id: number;
  name: string;
  desc: string;
  level: Record<string, LightConeSkillLevel>;
}

export interface LightConeStats {
  hp_base: number;
  hp_add: number;
  attack_base: number;
  attack_add: number;
  defence_base: number;
  defence_add: number;
  max_level: number;
  cost: { ItemID: number; ItemNum: number }[];
}

export interface LightConeDetail {
  id: number;
  name: string;
  rarity: number;
  path: string;
  desc: string;
  story?: string;
  max_promotion: number;
  max_rank: number;
  skill: LightConeSkill;
  stats: Record<string, LightConeStats>;
  recommend_chars?: { id: number; rank: number }[];
  icon: string;
  icon_figure: string;
}
