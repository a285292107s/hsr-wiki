export interface CurrencyPropMod {
  name: string;
  property_type: string;
  value: number;
  prop_name?: string;
  icon?: string;
}

export interface CurrencyRoleTraitLayer {
  layer: number;
  quality: string | null;
  desc: string;
  params: number[];
  member_props: CurrencyPropMod[];
  all_props: CurrencyPropMod[];
}

export interface CurrencyRoleTrait {
  id: number;
  name: string | null;
  activation_type: string | null;
  icon: string;
  desc: string;
  simple_desc: string;
  desc_params: number[];
  effect_list: number[];
  layers: CurrencyRoleTraitLayer[];
}

export interface CurrencyRoleSkill {
  id: number;
  name: string;
  desc: string;
  simple_desc: string;
  icon: string;
  type: string | null;
  tag: string | null;
  sp_base: number | null;
  sp_need: number | null;
  bp_need: number | null;
  bp_add: number | null;
  show_stance_list: number[] | null;
  stance_damage_type: string | null;
  stance_damage_display: number | null;
  extra: Record<string, { name: string; desc: string; param: number[] }> | null;
  level: Record<string, { level: number; param_list: number[] }> | null;
}

export interface CurrencyRoleRecommendItem {
  id: number;
  name: string;
  icon: string;
}
export interface CurrencyRoleRecommend {
  front?: { first: CurrencyRoleRecommendItem[]; second: CurrencyRoleRecommendItem[] };
  back?: { first: CurrencyRoleRecommendItem[]; second: CurrencyRoleRecommendItem[] };
}

export interface CurrencyRoleStar {
  star: number;
  front_one_word_desc: string | null;
  back_one_word_desc: string | null;
  front_power_base: number | null;
  back_power_base: number | null;
  front_show_skill: CurrencyRoleSkill[];
  back_show_skill: CurrencyRoleSkill[];
  servant_show_skill: CurrencyRoleSkill[];
  general_property_modify_list: unknown[] | null;
  back_speed_rewrite: number | null;
  back_speed_added_ratio: number | null;
  back_energy_bar: number | null;
  back_max_sp: number | null;
  back_initial_sp: number | null;
  back_initial_energy_bar: number | null;
  luck_chance: number | null;
  luck_damage: number | null;
  extra_heal_base: number | null;
  extra_shield_base: number | null;
  stance_damage_display: unknown | null;
  show_stance_list: number[] | null;
  recommend: CurrencyRoleRecommend | null;
  servant: {
    hp_base: string;
    hp_inherit: string;
    hp_skill: number | null;
    speed_base: string;
    speed_inherit: string;
    speed_skill: number | null;
  } | null;
}

export interface CurrencyRoleDetail {
  id: number;
  avatar_id: number;
  name: string;
  rarity: number;
  front_back_type: string | null;
  heal_or_shield_display: string | null;
  charge_type: string[];
  max_sp_icon: string;
  is_expert: boolean;
  trait_list: number[];
  traits: CurrencyRoleTrait[];
  stars: Record<string, CurrencyRoleStar>;
  rank: CurrencyRoleRank[];
  equipment: CurrencyRoleEquipment[];
  special_avatar_id: number | null;
  season_ids: number[];
  female_avatar_id: number | null;
}

export interface CurrencyRoleRank {
  rank_id: number;
  rank: number;
  name: string;
  desc: string;
  icon: string;
  owner_props: CurrencyPropMod[];
  all_props: CurrencyPropMod[];
  param_list: number[];
  modify_skill_list: number[];
  modify_energy_bar: number | null;
  rank_ability: number[];
}

export interface CurrencyRoleEquipment {
  equipment_id: number;
  level: number;
  desc: string;
  param_list: number[];
  param_format?: string;
  owner_props: CurrencyPropMod[];
  all_props: CurrencyPropMod[];
}

export interface CurrencyRoleTraitSummary {
  id: number;
  name: string;
  cat: 'faction' | 'combat' | 'special';
}

export interface CurrencyRoleEntry {
  id: number;
  avatar_id: number;
  name: string;
  rarity: number;
  front_back_type: string | null;
  heal_or_shield_display: string | null;
  charge_type: string[];
  is_expert: boolean;
  max_sp_icon: string;
  trait_list: number[];
  traits: CurrencyRoleTraitSummary[];
  equipment_id: number | null;
  special_avatar_id: number | null;
  season_ids: number[];
  female_avatar_id: number | null;
  is_season_new?: boolean;
}

export interface CurrencyRoleList {
  roles: CurrencyRoleEntry[];
}

export interface CurrencyPropIconMap {
  [propertyType: string]: string;
}

export interface CurrencyEquipTag {
  id: number;
  desc: string;
}

export interface CurrencyEquipProp {
  name: string;
  property_type: string;
  value: number;
  prop_name?: string;
}

export interface CurrencyEquipEntry {
  id: number;
  name: string;
  icon: string;
  small_icon: string;
  priority: number;
  category: string;
  category_name: string;
  ability_name: string;
  desc: string;
  tags: CurrencyEquipTag[];
  props: CurrencyEquipProp[];
  recommend_roles: number[];
}

export interface CurrencyEquipList {
  items: CurrencyEquipEntry[];
}

export interface CurrencyPortalEntry {
  id: number;
  title: string;
  desc: string;
  icon: string;
  in_book: boolean;
  params: number[];
}

export interface CurrencyPortalList {
  portals: CurrencyPortalEntry[];
}

export interface CurrencyAugmentEntry {
  id: number;
  name: string;
  desc: string;
  icon: string;
  mini_icon: string;
  quality: string;
  category_id: number;
  params: number[];
  chapter_limit: number[];
}

export interface CurrencyAugmentList {
  augments: CurrencyAugmentEntry[];
}

export interface CurrencyTraitLayer {
  layer: number;
  quality: string | null;
  desc: string;
  params: number[];
  member_props: CurrencyEquipProp[];
  all_props: CurrencyEquipProp[];
  buff_desc?: string;
  buff_params?: number[];
}

export interface CurrencyTraitRemark {
  desc: string;
  simple_desc: string;
  params: number[];
}

export interface CurrencyTraitEntry {
  id: number;
  name: string;
  desc: string;
  simple_desc: string;
  icon: string;
  mini_icon: string;
  activation_type: string;
  cat: 'faction' | 'combat' | 'special';
  base_params: number[];
  season_id: number;
  sort_priority: number;
  layers: CurrencyTraitLayer[];
  remarks: CurrencyTraitRemark[];
  is_season_new?: boolean;
}

export interface CurrencyTraitList {
  traits: CurrencyTraitEntry[];
}
