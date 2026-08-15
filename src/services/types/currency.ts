/** 货币战争（货币战争模式）相关数据类型：角色 / 赛季 / 装备 / 投资环境 / 策略 / 羁绊 */

/* ─── 角色图鉴 ─── */

/** 属性修正项（converter 落地 prop_name = TextMap 官方名；常规属性体系无此字段时前端映射表兜底） */
export interface CurrencyPropMod {
  name: string;
  property_type: string;
  value: number;
  /** 官方名（GridFightRolePropertyConfig.PropertyName，官方改称呼重跑转换即同步） */
  prop_name?: string;
  /** 图标源路径（GridFightRolePropertyConfig.IconPath；属性表未收录的类型无此字段） */
  icon?: string;
}

/** 羁绊层级效果（GridFightTraitLayer） */
export interface CurrencyRoleTraitLayer {
  /** 激活所需人数 */
  layer: number;
  /** 品质（Silver/Gold，首层为 null） */
  quality: string | null;
  /** 效果描述（含 #N[i] 占位符，用 params 渲染） */
  desc: string;
  /** 描述参数 */
  params: number[];
  /** 羁绊成员属性加成 */
  member_props: CurrencyPropMod[];
  /** 全员属性加成 */
  all_props: CurrencyPropMod[];
}

export interface CurrencyRoleTrait {
  id: number;
  name: string | null;
  activation_type: string | null;
  icon: string;
  desc: string;
  /** 简述 */
  simple_desc: string;
  /** 基础描述参数（渲染 desc 中的 #N[i] 占位符） */
  desc_params: number[];
  /** 特质效果 ID 列表（GridFightTraitBasicInfo.TraitEffectList） */
  effect_list: number[];
  /** 层级效果列表（按 layer 升序） */
  layers: CurrencyRoleTraitLayer[];
}

export interface CurrencyRoleSkill {
  id: number;
  name: string;
  desc: string;
  simple_desc: string;
  /** 技能图标（源路径 SpriteOutput/SkillIcons/Avatar/{id}/{file}.png，前端 gridFightSkillIconSrc 解析双源） */
  icon: string;
  type: string | null;
  tag: string | null;
  sp_base: number | null;
  /** 终结技能量需求（仅终结技有值） */
  sp_need: number | null;
  bp_need: number | null;
  bp_add: number | null;
  show_stance_list: number[] | null;
  extra: Record<string, { name: string; desc: string; param: number[] }> | null;
  level: Record<string, { level: number; param_list: number[] }> | null;
}

/** 推荐装备条目（从 GridFightItems 解析名称/图标） */
export interface CurrencyRoleRecommendItem {
  id: number;
  name: string;
  icon: string;
}
/** 推荐装备（按前后台分组） */
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
  /** 随从属性（源为字面值或 #N 文本参数引用，忠实透传） */
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
  /** AvatarConfig 角色 ID（用于构造头像/立绘 CDN URL；可能与 role id 不同） */
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
  /** 特殊形态 AvatarID（370xxxx 系列） */
  special_avatar_id: number | null;
  /** 所属赛季（SeasonIDList 优先，空则回退 [SeasonID]） */
  season_ids: number[];
  /** 女性形态 AvatarID（GridFightGenderOverride；仅开拓者有值，其余为 null） */
  female_avatar_id: number | null;
}

/** 后台角色星魂（GridFightBackRoleRank） */
export interface CurrencyRoleRank {
  rank_id: number;
  rank: number;
  name: string;
  desc: string;
  icon: string;
  owner_props: CurrencyPropMod[];
  all_props: CurrencyPropMod[];
  param_list: number[];
  /** 星魂修改的技能 ID 列表 */
  modify_skill_list: number[];
  /** 星魂修改的能量条数值 */
  modify_energy_bar: number | null;
  /** 星魂能力 ID 列表 */
  rank_ability: number[];
}

/** 专属装备等级条目（GridFightBackEquipment） */
export interface CurrencyRoleEquipment {
  equipment_id: number;
  level: number;
  desc: string;
  param_list: number[];
  /** 参数格式模板（GridFightBackEquipment.ParamFormat，如 "[i]%"：desc 裸 #N 按此渲染，全量验证 165/165 为 "[i]%"） */
  param_format?: string;
  owner_props: CurrencyPropMod[];
  all_props: CurrencyPropMod[];
}

/** 货币战争角色特质摘要（列表数据，由 converter 从 TextMap 解析） */
export interface CurrencyRoleTraitSummary {
  id: number;
  name: string;
  cat: 'faction' | 'combat' | 'special';
}

export interface CurrencyRoleEntry {
  id: number;
  /** AvatarConfig 角色 ID（用于构造头像 CDN URL；可能与 role id 不同） */
  avatar_id: number;
  name: string;
  rarity: number;
  front_back_type: string | null;
  heal_or_shield_display: string | null;
  charge_type: string[];
  is_expert: boolean;
  max_sp_icon: string;
  trait_list: number[];
  /** 特质摘要（id + name + cat），供列表页展示与筛选 */
  traits: CurrencyRoleTraitSummary[];
  /** 专属装备 ID（部分角色有） */
  equipment_id: number | null;
  /** 特殊形态 AvatarID（370xxxx 系列） */
  special_avatar_id: number | null;
  /** 所属赛季（SeasonIDList 优先，空则回退 [SeasonID]） */
  season_ids: number[];
  /** 女性形态 AvatarID（GridFightGenderOverride；仅开拓者有值，其余为 null） */
  female_avatar_id: number | null;
}

export interface CurrencyRoleList {
  roles: CurrencyRoleEntry[];
}

/** 属性图标映射（converter 落地 currency/prop_icons.json）：PropertyType → IconPath 源路径 */
export interface CurrencyPropIconMap {
  [propertyType: string]: string;
}

/* ─── 赛季扩充说明 ─── */

/** 货币战争 · 赛季扩充说明（由 season 转换器从 TextMap 落地） */
export interface CurrencySeason {
  /** TextMap 标题 Hash（同时作为唯一 id） */
  id: string;
  /** 赛季扩充说明标题，如「货币战争•零和博弈」赛季扩充说明 V4.4 */
  title: string;
  /** 赛季扩充说明正文（含新角色、晋升上限、羁绊加强等，字面 \n 分隔段落） */
  body: string;
  /** 扩充内容概览（要点式补充说明，▌标题 + ● 条目，字面 \n 分隔；可选） */
  overview?: string;
}

export interface CurrencySeasonList {
  seasons: CurrencySeason[];
}

/* ─── 装备图鉴 ─── */

export interface CurrencyEquipTag {
  id: number;
  desc: string;
}

export interface CurrencyEquipProp {
  name: string;
  property_type: string;
  value: number;
  /** 官方名（GridFightRolePropertyConfig.PropertyName，官方改称呼重跑转换即同步） */
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

/* ─── 投资环境（Portal Buff） ─── */

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

/* ─── 投资策略（Augment） ─── */

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

/* ─── 羁绊图鉴（Trait） ─── */

export interface CurrencyTraitLayer {
  layer: number;
  quality: string | null;
  desc: string;
  params: number[];
  member_props: CurrencyEquipProp[];
  all_props: CurrencyEquipProp[];
  /** Mazebuff 补充描述（攻击段数等战斗机制细节） */
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
}

export interface CurrencyTraitList {
  traits: CurrencyTraitEntry[];
}
