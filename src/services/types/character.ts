/** 角色相关数据类型（character/{charId}.json + converter 本地列表 + 技能动画映射） */

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
  | null
  | (string & {});

export interface Skill {
  id: number;
  name: string;
  desc: string;
  simple_desc?: string;
  type: SkillType;
  type_name: string;
  /** 技能图标（源数据 SkillIcon 映射路径，事实源）：覆盖大世界攻击复用普攻图标、
   * Normal02/BP02/AssisSkill01-03 等 type 无法推断的变体命名；空串回退 type 推断 */
  icon?: string;
  /** 技能标签：官方 SkillTag 中文文本（如「单攻」「召唤」），空则无标签 */
  tag?: string | null;
  sp_base?: number | null;
  /** 技能级能量需求（忆灵终结技独有 + 双段能量角色） */
  sp_need?: number | null;
  bp_need?: number | null;
  bp_add?: number | null;
  /** 韧性消耗 [单攻, 群攻, 扩散] */
  show_stance_list?: number[] | null;
  /** 削韧属性（7 种元素枚举） */
  stance_damage_type?: string | null;
  /** 削韧显示值 */
  stance_damage_display?: number | null;
  /** 技能资源消耗描述（如「#5点【新蕊】」） */
  skill_need?: string | null;
  /** 技能最高等级（10/15） */
  max_level?: number | null;
  /** 技能→星魂关联（被哪些星魂强化） */
  rated_rank_id?: number[] | null;
  /** 技能→行迹点关联 */
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

/** 加强版本数据包：覆盖 base 的 skills/ranks/skill_trees（「砺烁新辉」角色强化，见 ADR 0010） */
export interface EnhancedBundle {
  skills?: Record<string, Skill>;
  ranks?: Record<string, Rank>;
  skill_trees?: Record<string, Record<string, SkillTree>>;
  /** 强化摘要（EnhancedDesc1..N，保留官方 <color> 标签，前端 gameTagsToHtml 渲染） */
  descs?: string[] | null;
  /** 强化后终结技能量需求（与基础不同时输出，前端覆盖 hero 展示） */
  sp_need?: number | null;
  /** 被强化技能 ID 列表（驱动强化角标） */
  skill_ids?: number[];
  /** 被强化星魂 ID 列表（驱动强化角标） */
  rank_ids?: number[];
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
  /** 终结技能量需求（部分角色如遐蝶无此字段，输出 null，前端以 ?? 0 兑底） */
  sp_need?: number | null;
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

/* ─── 本地角色列表（TurnBasedGameData 转换） ─── */

/** 本地角色列表条目（converter 输出格式） */
export interface LocalCharEntry {
  id: number;
  name: string;
  full_name: string;
  rarity: number;
  path: string;
  element: string;
  /** 终结技能量需求（部分角色如遐蝶无此字段，输出 null） */
  sp_need: number | null;
  vo_tag: string;
  icon: string;
  icon_round: string;
  icon_mini: string;
  icon_cutin: string;
  rank_ids: number[];
  skill_ids: number[];
}
export type LocalCharList = LocalCharEntry[];

/* ─── skill_animations.json（米游社 Wiki 技能动画映射） ─── */

/** 单条技能动画条目 */
export interface SkillAnimEntry {
  url: string;
  /** 多段技能子标题（如终结技分段名） */
  title?: string;
}

/** 技能动画数据库：charId → skillType → 动画列表 */
export type SkillAnimationsDb = Record<string, Record<string, SkillAnimEntry[]>>;
