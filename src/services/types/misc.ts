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

/** 赛季增益（converter 输出：名称 + 完整效果描述，desc 含 #N[i] 参数占位与富文本标签） */
export interface MazeBuffInfo {
  /** MazeBuff ID */
  id: number;
  /** 增益名称 */
  name: string;
  /** 效果描述（原始富文本，前端 fmtDesc 渲染） */
  desc?: string;
  /** 占位符替换参数 */
  param_list?: number[];
  /** BuffIcon 相对路径（去 SpriteOutput/ 与 .png，如 BuffIcon/Inlevel/xxx；前端 bufficon CDN 加载，未就绪时 SVG 占位） */
  icon?: string;
}

/** 逐层推荐属性（converter 输出：按上下半场拆分，DamageType1=上半场 / DamageType2=下半场） */
export interface FloorDamageInfo {
  floor: number;
  /** 上半场属性 */
  stage1?: string[];
  /** 下半场属性 */
  stage2?: string[];
}

/** 敌方配置（converter 输出：名称/头像 + 韧性弱点/伤害抗性/分类） */
export interface MazeMonsterInfo {
  id: string;
  /** 怪物名（TextMap 解析） */
  name: string;
  /** MonsterMiddleIcon basename（前端经 CDN 构造 webp URL） */
  icon: string;
  /** 韧性弱点属性（MonsterConfig.StanceWeakList，如 ["Physical","Ice"]） */
  weak?: string[];
  /** 伤害抗性映射（属性 → 抗性值，如 { Fire: 0.2 } = 抗火 20%） */
  resist?: Record<string, number>;
  /** 敌方分类（MonsterTemplateConfig.Rank：MinionLv2/Elite/LittleBoss/BigBoss） */
  rank?: string;
  /** 阵营名称（MonsterCampID → MonsterCamp.Name，如 "裂界造物"；无阵营为空串） */
  camp?: string;
  /** 图鉴介绍（MonsterConfig.MonsterIntroduction，含 \n 换行） */
  intro?: string;
  /** 技能列表（MonsterConfig.SkillList → MonsterSkillConfig，名称 + 标签） */
  skills?: { name: string; tag?: string }[];
  /** 韧性值（MonsterTemplateConfig.StanceBase.Value，如 360） */
  stance?: number;
  /** 战斗波次序号（StageConfig.MonsterList 波次展开，1 起；层级/peak 敌方带此字段，星启无） */
  wave?: number;
}

/** 单阶段（上半/下半场）内容：推荐属性 + 敌方配置 */
export interface MazeStageDetail {
  /** 该阶段推荐属性 */
  damage?: string[];
  /** 该阶段敌方（icon 为 MonsterMiddleIcon basename） */
  monsters?: MazeMonsterInfo[];
}

/** 逐层详情（converter 输出：详情页以关卡层级为章节的完整内容） */
export interface MazeFloorDetail {
  /** 层序号（永屹之城遗秘无 Floor 字段 → 按 ID 升序序号） */
  floor: number;
  /** 官方层名（如“回忆其一”“琥珀恩赐其一”） */
  name?: string;
  /** 该层回合上限 */
  countdown?: number;
  /** 关卡等级（StageConfig.Level，上下半场同级取首事件；如末日幻影 60-90 逐层递增） */
  level?: number;
  /** 上半场（永屹之城遗秘单阶段层下半场为空） */
  stage1?: MazeStageDetail;
  /** 下半场 */
  stage2?: MazeStageDetail;
  /** 层级可用增益（MazeBuff，如“记忆紊流”；未注册时缺省） */
  buff?: MazeBuffInfo | null;
  /** 末日幻影阶段制 Boss 清单（ChallengeBossMazeExtra 的 MonsterID1/2/3，全字段含第 3 阶段） */
  phases?: MazeMonsterInfo[];
  /** 该层挑战目标（text + param，fmtDesc 渲染） */
  targets?: { text: string; param?: number }[];
}

/** 异相仲裁段位徽章（ChallengeBadgeConfig：Bronze/Silver/Gold/Ultra 四段） */
export interface MazeBadgeInfo {
  /** 段位（Bronze/Silver/Gold/Ultra） */
  level: string;
  /** 徽章名（如“「尘世卷中」青铜勋章”） */
  name: string;
  desc?: string;
  /** 图标路径（icon/item_figure/...，前端 itemIconUrl 消费） */
  icon: string;
}

/** 异相仲裁单关（converter 输出：骑士试炼 / 王棋最终关） */
export interface PeakLevelInfo {
  id?: number;
  /** knight=骑士试炼 / king=王棋最终关（官方术语） */
  kind: 'knight' | 'king';
  /** 官方关卡名（骑士（一）… / 将杀王棋） */
  name?: string;
  /** 推荐属性 */
  damage?: string[];
  /** 关卡等级（StageConfig.Level） */
  level?: number;
  /** 敌方配置（StageConfig.MonsterList 波次扁平化） */
  monsters?: MazeMonsterInfo[];
  /** 挑战目标（BattleTargetConfig，text + param） */
  targets?: { text: string; param?: number }[];
  /** 机制标签（MazeBuff 名称，如韧甲/反相/吸能） */
  tags?: string[];
  /** 王棋增益（仅 king：出奇制胜/步骑协同/锤砧战术） */
  buffs?: MazeBuffInfo[];
  /** 王棋•绝境变体（仅 king） */
  hard?: {
    name?: string;
    level?: number;
    monsters?: MazeMonsterInfo[];
    targets?: { text: string; param?: number }[];
    tags?: string[];
  };
}

/** 星启模式关卡（converter 输出：常规最后一关之后的独立进阶关卡，含 3 节点目标） */
export interface MazeTierceInfo {
  /** 星启关卡 ID */
  id: number;
  /** 星启关卡弱点 */
  damage_types?: string[];
  /** 回合限制（仅忘却之庭） */
  countdown?: number;
  /** 目标分数（仅虚构叙事） */
  score?: number;
  /** 星启 Boss 战等级（StageConfig.Level，如末日幻影 90） */
  level?: number;
  /** 挑战目标（text + param，fmtDesc 渲染） */
  targets?: { text: string; param?: number }[];
  /** 星启敌方（节点 3 = 星启附加关，完整信息卡消费） */
  monsters?: MazeMonsterInfo[];
  /** 3 节点敌方：节点 1/2 = 常规最高难度关上下半场（DLCKKJFMJOB → EventIDList1/2），
   *  节点 3 = 星启附加关（HFIAAGAKFMD → StageConfig 波次） */
  nodes?: { idx: number; monsters: MazeMonsterInfo[] }[];
}

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
  /** 回合上限（虚构叙事取自 ChallengeStoryMazeExtra.TurnLimit） */
  countdown?: number;
  /** 虚构叙事通关分数线（ChallengeStoryMazeExtra.ClearScore，如 30000） */
  clear_score?: number;
  /** 赛季海报/标签图（BackGroundPath/TabPicPath 原样保留；CDN 未就绪，前端暂不渲染） */
  arts?: { background?: string; tab?: string };
  /** 赛季增益（名称 + 效果描述） */
  buffs?: MazeBuffInfo[];
  /** 赛季敌方（按层序收集去重；icon 为 MonsterMiddleIcon basename） */
  monsters?: MazeMonsterInfo[];
  /** 挑战目标描述（text 为 clean_text 清洗后文本，param 为 #N[i] 占位符参数） */
  targets?: { text: string; param?: number }[];
  /** 逐层推荐属性（按上下半场拆分） */
  floor_damage?: FloorDamageInfo[];
  /** 逐层详情（关卡层级章节：推荐属性 / 敌方配置 / 可用增益 / 挑战目标） */
  floor_details?: MazeFloorDetail[];
  /** 星启模式关卡（存在时赛季含独立进阶关） */
  tierce?: MazeTierceInfo;
  /** 异相仲裁关卡组成（3 骑士试炼 + 1 王棋最终关，仅 peak） */
  levels?: PeakLevelInfo[];
  /** 异相仲裁段位徽章（ChallengeBadgeConfig：青铜/白银/黄金/彩钻，仅 peak） */
  badges?: MazeBadgeInfo[];
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

/* ─── 敌对物种详情（converter 输出，每怪物一个 JSON：monsters/{id}.json） ─── */

/** 敌对物种技能详情（MonsterSkillConfig 全量字段） */
export interface MonsterSkillDetail {
  id: number;
  name: string;
  /** 标签（如“单攻”“扩散”“锁定”） */
  tag?: string;
  /** 类型描述（如“技能”“天赋”） */
  type_desc?: string;
  /** 伤害属性（Quantum/Fire/…，空串 = 无伤害） */
  damage_type?: string;
  /** 攻击类型（Normal/…） */
  attack_type?: string;
  /** 效果描述（原始富文本，前端 fmtDesc 渲染） */
  desc?: string;
  /** 占位符替换参数 */
  param_list?: number[];
}

/** 敌对物种详情（monsters/{id}.json） */
export interface MonsterDetail {
  id: number;
  name: string;
  /** MonsterMiddleIcon basename（monstermiddleicon CDN） */
  icon: string;
  /** MonsterFigure basename（monsterfigure CDN 全身立绘；无立绘为空串） */
  figure: string;
  /** 敌方分类（MonsterTemplateConfig.Rank：MinionLv2/Elite/LittleBoss/BigBoss） */
  rank: string;
  /** 阵营名称（MonsterCampID → MonsterCamp.Name；无阵营为空串） */
  camp: string;
  /** 韧性值（StanceBase） */
  stance: number;
  /** 韧性弱点属性（StanceWeakList，如 ["Physical","Ice"]） */
  weak: string[];
  /** 伤害抗性映射（属性 → 抗性值，如 { Fire: 0.2 } = 抗火 20%） */
  resist: Record<string, number>;
  /** 图鉴介绍（MonsterIntroduction，含 \n 换行） */
  intro: string;
  /** 基础属性（模板表，无属性为 0） */
  stats: { hp: number; atk: number; def: number; speed: number };
  /** 技能列表（SkillList → MonsterSkillConfig） */
  skills: MonsterSkillDetail[];
}

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
