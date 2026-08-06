/** 通用数据类型：manifest / 物品 / 本地目录列表 / 终局 / 光锥详情 */

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
  /** 赛季弱点属性（全层合并去重；异相仲裁为单层属性） */
  damage_types?: string[];
  /** 赛季最大层数 */
  floors?: number;
  /** 阶段数 */
  stage_num?: number;
  /** 回合上限 */
  countdown?: number;
}
export type MazeListDb = Record<string, MazeListEntry>;

/** zh/maze/version.json：版本 → 赛季 ID 列表（键按版本降序） */
export type MazeVersionMap = Record<string, (number | string)[]>;

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

/* ─── 本地版本信息（converter 输出，public/data/cn/version.json） ─── */

/** 游戏版本信息：由子模块 git 提交标题（OSPRODWin4.4.0_...）解析；git 不可用时为空对象 */
export interface LocalVersionInfo {
  /** 完整版本号（4.4.0） */
  game_version?: string;
  /** 大版本标签（4.4） */
  version_label?: string;
  /** 客户端标识（OSPRODWin4.4.0） */
  client?: string;
  /** 构建号（D..._A..._L...） */
  build?: string;
  /** 源数据同步日期（子模块 git 提交日期） */
  synced_at?: string;
}
