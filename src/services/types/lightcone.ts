/** 光锥相关数据类型（lightcone.json 列表端点 + converter 本地列表 + light_cones/{id}.json 详情） */

/* ─── 列表端点（standalone 目录页数据源；注意：无 /zh/ 路径段） ─── */

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

/* ─── 本地目录列表（converter 输出，数组形态） ─── */

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
  /** 版本上新判据（ADR 0019）：首次出现在数据快照中的版本号，如 "4.6"；
   *  converter 由「与上一版已提交输出的 id 差集」推导，无可追溯基线时为空串（旧数据文件可能缺该字段）。 */
  release_version?: string;
}
export type LocalLightConeList = LocalLightConeEntry[];

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
  /** 适配角色（AvatarEquipRecommend 反向索引，仅收录官方配装推荐过该光锥的角色；
   *  rank = 该光锥在其推荐列表中的顺位，1 起，与角色页 REC. 序号同源） */
  recommend_chars?: { id: number; rank: number }[];
  icon: string;
  icon_figure: string;
}
