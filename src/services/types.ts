/**
 * CDN 数据类型定义（依据 cdn-samples 真实数据结构）
 * ⚠️ 样本仅供参考调试，运行时必须始终从 https://static.nanoka.cc 实时拉取
 */

/* ─── manifest.json ─── */

export interface GameManifest {
  latest: string;
  available: string[];
  live: string;
  /** 各版本新增内容 ID（仅增量，无完整列表端点 → 目录页通过 CDN 增量推断） */
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

/** 行迹节点属性加成（总属性加成聚合数据源） */
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
  /** 附加能力名称（行迹树节点） */
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
    /** 所属阵营（如「星穹列车」「星核猎手」） */
    camp?: string | null;
    /** 四语配音演员 */
    va?: {
      chinese?: string | null;
      japanese?: string | null;
      korean?: string | null;
      english?: string | null;
    };
    /** 角色故事（键 "0"~"4"，对应游戏内档案第 1~5 篇） */
    stories?: Record<string, string | null>;
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
  /** 行迹树：pointKey → 等级 → 节点（tree['1'] 取首级节点） */
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

/* ─── 列表端点（standalone 目录页数据源；注意：无 /zh/ 路径段） ─── */

/** character.json 条目（键 = 角色 ID） */
export interface CharListEntry {
  /** 实装时间戳（未实装角色缺省） */
  release?: number;
  icon?: string;
  /** 稀有度（CombatPowerAvatarRarityType4/5） */
  rank?: string;
  /** 命途（Knight/Mage/...） */
  baseType?: string;
  /** 属性（Ice/Quantum/...） */
  damageType?: string;
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  enhance?: unknown[];
  desc?: string;
}
export type CharListDb = Record<string, CharListEntry>;

/** lightcone.json 条目（键 = 光锥 ID） */
export interface LightconeListEntry {
  /** 稀有度（CombatPowerLightconeRarity3/4/5） */
  rank?: string;
  /** 命途（Rogue/Mage/...） */
  baseType?: string;
  atk?: number;
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  desc?: string | null;
}
export type LightconeListDb = Record<string, LightconeListEntry>;

/** relicset.json 条目（键 = 遗器套装 ID） */
export interface RelicsetListEntry {
  /** 图标路径（SpriteOutput/ItemIcon/71000.png → itemfigures/71000.webp） */
  icon?: string;
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  set?: Record<string, unknown>;
}
export type RelicsetListDb = Record<string, RelicsetListEntry>;

/** monster.json 条目（键 = 敌对 ID） */
export interface MonsterListEntry {
  rank?: string;
  camp?: string | null;
  /** 图标路径（SpriteOutput/MonsterFigure/Monster_1002011.png → monstermiddleicon/Monster_1002011.webp） */
  icon?: string;
  child?: (number | string)[];
  weak?: string[];
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  desc?: string;
}
export type MonsterListDb = Record<string, MonsterListEntry>;

/** maze.json 条目（键 = 赛季 ID） */
export interface MazeListEntry {
  param?: number[];
  id?: string;
  begin?: string;
  end?: string;
  live_begin?: string;
  live_end?: string;
  en?: string;
  zh?: string;
  ja?: string;
  ko?: string;
}
export type MazeListDb = Record<string, MazeListEntry>;

/** zh/maze/version.json：版本 → 赛季 ID 列表（键按版本降序） */
export type MazeVersionMap = Record<string, (number | string)[]>;

/* ─── 本地数据源（TurnBasedGameData 转换） ─── */

/** 本地角色列表条目（converter 输出格式） */
export interface LocalCharEntry {
  id: number;
  name: string;
  full_name: string;
  rarity: number;
  path: string;
  element: string;
  sp_need: number;
  vo_tag: string;
  icon: string;
  icon_round: string;
  icon_mini: string;
  icon_cutin: string;
  rank_ids: number[];
  skill_ids: number[];
}
export type LocalCharList = LocalCharEntry[];

/* ─── 本地目录列表（converter 输出，数组形态） ─── */

/** 物品列表条目（converter 输出；稀有度为数字，目录页需映射回字符串键） */
export interface LocalItemEntry {
  id: number;
  name: string;
  desc: string;
  bg_desc: string;
  main_type: string;
  sub_type: string;
  /** 数字稀有度（SuperRare=5 … Normal=1） */
  rarity: number;
  purpose_type: number;
  icon: string;
  figure_icon: string;
}
export type LocalItemList = LocalItemEntry[];

/** 光锥列表条目 */
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
}
export type LocalLightConeList = LocalLightConeEntry[];

/** 遗器套装列表条目 */
export interface LocalRelicEntry {
  id: number;
  name: string;
  icon: string;
  icon_figure: string;
  descriptions: Record<string, string>;
  param_list?: Record<string, number[]>;
  /** 套装效果所需件数，如 [2,4]（隧洞遗器）或 [2]（位面饰品） */
  require_num: number[];
  pieces: LocalRelicPiece[];
  release_version: string;
}
export type LocalRelicList = LocalRelicEntry[];

/** 遗器部位条目（5 星） */
export interface LocalRelicPiece {
  id: number;
  /** HEAD/HAND/BODY/FOOT/NECK/OBJECT */
  type: string;
  type_name: string;
  rarity: number;
  max_level: number;
  /** 主词条组 ID（关联 relic_main_affixes.json 的 group_id） */
  main_affix_group: number;
  /** 副词条组 ID（关联 relic_sub_affixes.json 的 group_id） */
  sub_affix_group: number;
}

/** 遗器主词条条目（relic_main_affixes.json） */
export interface RelicMainAffix {
  group_id: number;
  affix_id: number;
  /** 属性类型（HPDelta/AttackAddedRatio/...） */
  property: string;
  /** 初始值（Lv.0） */
  base_value: number;
  /** 每级成长 */
  level_add: number;
}
export type RelicMainAffixList = RelicMainAffix[];

/** 遗器副词条条目（relic_sub_affixes.json） */
export interface RelicSubAffix {
  group_id: number;
  affix_id: number;
  property: string;
  /** 初始值 */
  base_value: number;
  /** 每次强化步进值 */
  step_value: number;
  /** 步进次数上限 */
  step_num: number;
}
export type RelicSubAffixList = RelicSubAffix[];

/** 遗器部位来历条目（relic_stories.json，按部位类型索引） */
export interface RelicPieceStory {
  /** 部位名（作为故事标题） */
  name: string;
  /** 短描述（题记） */
  desc: string;
  /** 完整来历（保留 \\n 与 <i> 标签，前端转 <br> 渲染） */
  story: string;
}
/** set_id → { piece_type → RelicPieceStory } */
export type RelicStoriesMap = Record<string, Record<string, RelicPieceStory>>;

/** 敌对物种列表条目 */
export interface LocalMonsterEntry {
  id: number;
  name: string;
  icon: string;
  type?: string;
}
export type LocalMonsterList = LocalMonsterEntry[];

/* ─── 光锥详情（converter 输出，每光锥一个 JSON） ─── */

/** 光锥技能等级条目 */
export interface LightConeSkillLevel {
  level: number;
  param_list: number[];
}

/** 光锥技能 */
export interface LightConeSkill {
  id: number;
  name: string;
  desc: string;
  /** 叠影等级 1-5 → 参数列表 */
  level: Record<string, LightConeSkillLevel>;
}

/** 光锥晋阶属性条目 */
export interface LightConeStats {
  hp_base: number;
  hp_add: number;
  attack_base: number;
  attack_add: number;
  defence_base: number;
  defence_add: number;
  /** 该晋阶阶段的等级上限 */
  max_level: number;
  /** 晋阶消耗（ItemID + ItemNum） */
  cost: { ItemID: number; ItemNum: number }[];
}

/** 光锥详情数据（light_cones/{id}.json） */
export interface LightConeDetail {
  id: number;
  name: string;
  /** 数字稀有度 3/4/5 */
  rarity: number;
  /** 命途（Priest/Rogue/...） */
  path: string;
  /** 物品描述（道具简介） */
  desc: string;
  /** 卡面描述（含 <i> 对话标签与 \n 换行） */
  story?: string;
  max_promotion: number;
  max_rank: number;
  skill: LightConeSkill;
  /** 晋阶阶段 0-6 → 属性 */
  stats: Record<string, LightConeStats>;
  icon: string;
  icon_figure: string;
}

/* ─── 货币战争 · 角色图鉴（独立 CDN 数据源，converter 落地） ─── */

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
  member_props: Array<{ name: string; property_type: string; value: number }>;
  /** 全员属性加成 */
  all_props: Array<{ name: string; property_type: string; value: number }>;
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
  /** 层级效果列表（按 layer 升序） */
  layers: CurrencyRoleTraitLayer[];
}

export interface CurrencyRoleSkill {
  id: number;
  name: string;
  desc: string;
  simple_desc: string;
  type: string | null;
  tag: string | null;
  sp_base: number | null;
  bp_need: number | null;
  bp_add: number | null;
  show_stance_list: number[] | null;
  extra: Record<string, { name: string; desc: string; param: number[] }> | null;
  level: Record<string, { level: number; param_list: number[] }> | null;
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
}

/** 后台角色星魂（GridFightBackRoleRank） */
export interface CurrencyRoleRank {
  rank_id: number;
  rank: number;
  name: string;
  desc: string;
  icon: string;
  owner_props: Array<{ name: string; property_type: string; value: number }>;
  all_props: Array<{ name: string; property_type: string; value: number }>;
  param_list: number[];
}

/** 专属装备等级条目（GridFightBackEquipment） */
export interface CurrencyRoleEquipment {
  equipment_id: number;
  level: number;
  desc: string;
  param_list: number[];
  owner_props: Array<{ name: string; property_type: string; value: number }>;
  all_props: Array<{ name: string; property_type: string; value: number }>;
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
}

export interface CurrencyRoleList {
  roles: CurrencyRoleEntry[];
}

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

/* ─── 货币战争 · 装备图鉴 ─── */

export interface CurrencyEquipTag {
  id: number;
  desc: string;
}

export interface CurrencyEquipProp {
  name: string;
  property_type: string;
  value: number;
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

/* ─── 货币战争 · 投资环境（Portal Buff） ─── */

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

/* ─── 货币战争 · 投资策略（Augment） ─── */

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

/* ─── 货币战争 · 羁绊图鉴（Trait） ─── */

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

/* ─── skill_animations.json（米游社 Wiki 技能动画映射） ─── */

/** 单条技能动画条目 */
export interface SkillAnimEntry {
  url: string;
  /** 多段技能子标题（如终结技分段名） */
  title?: string;
}

/** 技能动画数据库：charId → skillType → 动画列表 */
export type SkillAnimationsDb = Record<string, Record<string, SkillAnimEntry[]>>;
