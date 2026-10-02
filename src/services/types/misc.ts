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
  /** 主类型（converter 输出：Material / Virtual / Usable / Mission；目录页类型筛选分组依据） */
  main_type?: string;
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

/** 首领特性（末日幻影「坚防守备」等首领幻影机制条目，源 MonsterGuideConfig × MonsterGuideTag；
 *  游戏内教程「◆ 首领特性 ◆」：随难度提升首领添加的新特性） */
export interface MazeBossTrait {
  /** MonsterGuideTag ID */
  id: number;
  /** 机制名（如「坚防守备」） */
  name: string;
  /** 机制简述（原始富文本，前端 fmtDesc 渲染） */
  desc?: string;
  /** 占位符替换参数（MonsterGuideTag.ParameterList 原序，末位可能不被描述引用） */
  param_list?: number[];
}

/** 按场次分组的条目（末日幻影：stage1 = 上半场 / stage2 = 下半场 / tierce = 星启模式） */
export interface MazeHalfGroups<T> {
  stage1?: T;
  stage2?: T;
  tierce?: T;
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
  /** 速度（MonsterTemplateConfig.SpeedBase.Value，如 144；模板缺失时不输出） */
  speed?: number;
  /** 模板 ID（仅实例别名 MonsterID≠MonsterTemplateID 时输出，如 501211002 → 5012110；
   *  详情页跳转 /monster/:tpl 用；无别名时 id 即模板 ID） */
  tpl?: string;
  /** 战斗波次序号（StageConfig.MonsterList 波次展开，1 起；层级/peak/星启节点敌方均带此字段） */
  wave?: number;
  /** 该敌方实例的召唤物（`MonsterConfig.SummonIDList` 命中本场次时输出；见 MazeSummonInfo） */
  summons?: MazeSummonInfo[];
}

/** 召唤物（ADR 0036）：隶属于**某个敌方实例**的额外敌人——由该实例的
 *  `MonsterConfig.SummonIDList` 得到，挂在 `MazeMonsterInfo.summons` 上（同场多个敌方
 *  都具备召唤能力时会在各自卡片里各出现一次，如幼蛰虫分裂出自己）。
 *  轻形态：只消费图标 + 名称 + 污染徽标，弱点/抗性/韧性/速度/技能不出（与 MazeMonsterInfo 区分）。 */
export interface MazeSummonInfo {
  id: string;
  /** 模板 ID（仅实例别名 MonsterID≠MonsterTemplateID 时输出；详情页跳转 /monster/:tpl 用） */
  tpl?: string;
  /** 怪物名（TextMap 解析） */
  name: string;
  /** MonsterMiddleIcon basename（前端经 CDN 构造 webp URL） */
  icon: string;
  /** 该召唤物受「贪饕」污染时的污染等级（同场次 InvasionID，1–3）；未受污染不落该字段 */
  polluted?: number;
}

/** 污染等级（converter 由 StageInvasionConfig 写入关卡节点，ADR 0026）。
 *  level = InvasionID（1–3）；被污染怪物取自 MonsterInvasionList，未注册的实例 ID 被跳过，
 *  因此 monsters 可能缺省——**末日幻影楼层只登记首领**，被污染小怪不在该层敌方配置里。 */
export interface MazeStageInvasion {
  /** 污染等级（StageInvasionConfig.InvasionID，1–3） */
  level: number;
  /** 上游污染关卡 ID（StageInvasionConfig.StageID，用于回溯核对） */
  stage_id?: number;
  /** 被污染怪物（图鉴内已注册者） */
  monsters?: MazeMonsterInfo[];
}

/** 单个场次（上半/下半场）内容：推荐属性 + 敌方配置 */
export interface MazeStageDetail {
  /** 该场次推荐属性（星启附加关 = Tierce 的 LOJCIDLKPKG，即整场星启挑战的弱点，
   *  与赛季级 `tierce.damage_types` 同值——不从敌方韧性弱点推导） */
  damage?: string[];
  /** 该场次敌方（icon 为 MonsterMiddleIcon basename） */
  monsters?: MazeMonsterInfo[];
  /** 该场次的污染等级（仅污染关卡有；见 MazeStageInvasion） */
  invasion?: MazeStageInvasion;
}

/** 挑战目标（converter 输出：text 为 clean_text 清洗后文本，param 为 #N[i] 占位符参数，
 *  type 为 ChallengeTargetType——TOTAL_SCORE 分数档位 / ROUNDS_LEFT 剩余轮数 /
 *  DEAD_AVATAR 减员限制。星启目标是整场挑战的评价条件，与节点（敌方配置）正交） */
export interface MazeTargetInfo {
  text: string;
  param?: number;
  type?: string;
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
  /** 层级增益（MazeBuff，如“记忆紊流”；未注册时缺省） */
  buff?: MazeBuffInfo | null;
  /** 该层挑战目标（text + param，fmtDesc 渲染） */
  targets?: MazeTargetInfo[];
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
  targets?: MazeTargetInfo[];
  /** 机制标签（MazeBuff 名称，如韧甲/反相/吸能） */
  tags?: string[];
  /** 王棋增益（仅 king：出奇制胜/步骑协同/锤砧战术） */
  buffs?: MazeBuffInfo[];
  /** 污染等级（异相仲裁无层/半场，污染直接落在单关上；见 MazeStageInvasion） */
  invasion?: MazeStageInvasion;
  /** 王棋•绝境变体（仅 king） */
  hard?: {
    name?: string;
    level?: number;
    monsters?: MazeMonsterInfo[];
    targets?: MazeTargetInfo[];
    tags?: string[];
  };
}

/** 星启节点（converter 输出：完整场次内容——节点 1/2 = 常规最高难度关上下半场，
 *  节点 3 = 星启附加关；字段口径与 MazeStageDetail 一致，另带 origin 场次键） */
export interface MazeTierceNode extends MazeStageDetail {
  /** 节点序号（1/2 = 末层上下半场；3 = 星启附加关） */
  idx: number;
  /** 场次键：按它取赛季级 `buff_groups`（赛季增益）与 `boss_traits`（首领特性）
   *  ——`tierce` = 星启附加关那一组，只有末日幻影产出这两项 */
  origin: 'stage1' | 'stage2' | 'tierce';
  /** 该场次关卡等级（StageConfig.Level） */
  level?: number;
  /** 该场次回合上限（ChallengeCountDown；星启附加关取 Tierce 回合限制） */
  countdown?: number;
  /** 该场次层级增益（即“末法余烬”）：节点 1/2 = 最高难度关记录 `MazeBuffID`，
   *  节点 3 = 附加关 StageConfig 自身绑定的 `_BindingMazeBuff`（星启表无 buff 字段） */
  buff?: MazeBuffInfo | null;
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
  /** 挑战目标（text + param，fmtDesc 渲染；星启目标是整场挑战的评价条件，非节点级） */
  targets?: MazeTargetInfo[];
  /** 星启敌方（节点 3 = 星启附加关，完整信息卡消费） */
  monsters?: MazeMonsterInfo[];
  /** 3 节点：节点 1/2 = 常规最高难度关上下半场（DLCKKJFMJOB → EventIDList1/2），
   *  节点 3 = 星启附加关（HFIAAGAKFMD → StageConfig 波次） */
  nodes?: MazeTierceNode[];
  /** 星启通关奖励（EGEEJLHBALB ItemID/ItemNum 列表，三模式均产出，每期固定） */
  rewards?: { id: number; num?: number }[];
}

/** maze.json 条目（键 = 赛季 ID） */
export interface MazeListEntry {
  param?: number[];
  id?: string;
  begin?: string;
  end?: string;
  live_begin?: string;
  live_end?: string;
  /** 常驻关卡（无赛季轮回的长期关卡：忘却之庭 永屹之城遗秘 100 / 天艟求仙迷航录 900；
   *  converter 依据源表 ScheduleDataID 为空判定） */
  permanent?: boolean;
  /** 测试期（beta/CBT 试炼翻版，排期整段早于公测 2023-04-26：忘却之庭 101-107/116；
   *  无 live_* 排期，与正式赛季区分） */
  test?: boolean;
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
  /** 赛季海报/标签图（BackGroundPath/TabPicPath 等源字段原样保留；tab = 赛季专属图标、
   *  default = 玩法级默认图标——二者已弃用于图标位：目录卡/详情 Hero 图标统一用玩法级
   *  默认图标（ENDGAME_MODES.icon，前端 modeDefaultArtUrl），规避每季页签图漂移；
   *  tab_select/theme_banner/theme_icon/theme_bg/poster_tab/handbook_banner 为补转字段，
   *  经 endgameArtUrl 白名单消费） */
  arts?: {
    background?: string;
    tab?: string;
    default?: string;
    /** 开关图 On 态（忘却之庭 AbyssSwitch，与 tab 同资源） */
    tab_select?: string;
    /** 赛季横幅（宣传 BANNER：ChallengeThemeBanner_20xx / ChallengeBossBanner_30xx） */
    theme_banner?: string;
    /** 主题小图（虚构叙事 ChallengeThemePic_20xx） */
    theme_toast?: string;
    /** 主题图标（虚构 ChallengeThemeIcon_20xx / 末日 ChallengeBossIcon_30xx） */
    theme_icon?: string;
    /** 海报背景（虚构叙事 ChallengeThemeBg_20xx） */
    theme_bg?: string;
    /** 海报页签按钮图（虚构/末日/仲裁 Btn* 扁长按钮 260×92，完整比例展示不裁切） */
    poster_tab?: string;
    /** 图鉴横幅（异相仲裁 ChallengePeakPanelBanner*） */
    handbook_banner?: string;
  };
  /** 赛季增益（名称 + 效果描述；末日幻影为 BuffList1+2 并集，分场次见 buff_groups） */
  buffs?: MazeBuffInfo[];
  /** 分场次赛季增益（仅末日幻影：源表 BuffList1/2/3 = 上半场/下半场/星启模式，各 3 条） */
  buff_groups?: MazeHalfGroups<MazeBuffInfo[]>;
  /** 分场次首领特性（仅末日幻影：首领幻影机制，源 MonsterGuideConfig × MonsterGuideTag） */
  boss_traits?: MazeHalfGroups<MazeBossTrait[]>;
  /** 战意赛季主题机制（虚构叙事 Fever 赛季 SubMazeBuffList：机制 + 战熄潮平/战意汹涌；
   *  普通赛季缺省） */
  sub_buffs?: MazeBuffInfo[];
  /** 赛季敌方（按层序收集去重；icon 为 MonsterMiddleIcon basename） */
  monsters?: MazeMonsterInfo[];
  /** 卡片代表阵容（最终层/王棋关敌方按 rank 去重取前 4——Boss + 精英护卫，非第 1 层小怪） */
  final_monsters?: MazeMonsterInfo[];
  /** 挑战目标描述（text 为 clean_text 清洗后文本，param 为 #N[i] 占位符参数） */
  targets?: MazeTargetInfo[];
  /** 逐层推荐属性（按上下半场拆分） */
  floor_damage?: FloorDamageInfo[];
  /** 逐层详情（关卡层级章节：推荐属性 / 敌方配置 / 末法余烬 / 挑战目标） */
  floor_details?: MazeFloorDetail[];
  /** 星启模式关卡（存在时赛季含独立进阶关） */
  tierce?: MazeTierceInfo;
  /** 异相仲裁关卡组成（3 骑士试炼 + 1 王棋最终关，仅 peak） */
  levels?: PeakLevelInfo[];
  /** 异相仲裁段位徽章（ChallengeBadgeConfig：青铜/白银/黄金/彩钻，仅 peak） */
  badges?: MazeBadgeInfo[];
  /** 赛季级污染汇总（污染关卡数 + 去重升序等级；无污染赛季缺省。ADR 0026） */
  pollution?: PollutionSummary;
}
export type MazeListDb = Record<string, MazeListEntry>;

/** 赛季级污染汇总：count = 污染关卡数（按 StageID 去重，星启节点 1/2 与常规末层同关卡不重复计） */
export interface PollutionSummary {
  count: number;
  levels: number[];
}

/**
 * 终局目录卡轻量条目（maze*.catalog.json：converter endgame_catalog 派生自全量）。
 * 仅含目录卡渲染与筛选所需字段，剥离 floor_details / floor_damage / sub_buffs /
 * targets / clear_score / badges / 完整 buff 描述 / 敌方重型字段 / 星启与仲裁重字段 / arts。
 */
export interface MazeCatalogEntry {
  id: string;
  /** 赛季名（zh，卡片标题） */
  zh: string;
  live_begin?: string;
  live_end?: string;
  /** 常驻关卡标记 */
  permanent?: boolean;
  /** 测试期标记 */
  test?: boolean;
  /** 目录卡增益（仅 id+name，卡片胶囊用；剥离 desc/icon 等详情字段） */
  buffs?: { id: number; name: string }[];
  /** 目录卡敌方（轻量：id/name/icon/weak/resist/rank/camp） */
  monsters?: MazeMonsterInfo[];
  final_monsters?: MazeMonsterInfo[];
  /** 星启：目录卡仅需存在性（★ 徽章）；剥离重型节点/技能/奖励 */
  tierce?: Pick<MazeTierceInfo, 'id' | 'damage_types' | 'countdown'>;
  /** 异相仲裁：目录卡仅需关卡组成 kind 计数（骑士×N · 王棋） */
  levels?: { kind: 'knight' | 'king' }[];
  /** 赛季级污染汇总（目录卡「含污染」标记判据） */
  pollution?: PollutionSummary;
}

/** 目录卡轻量赛季表（键 = 赛季 ID） */
export type MazeCatalogDb = Record<string, MazeCatalogEntry>;

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
  /** 版本上新判据（ADR 0019）：首次出现在数据快照中的版本号，如 "4.6"；
   *  converter 由「与上一版已提交输出的 id 差集」推导，无可追溯基线时为空串（旧数据文件可能缺该字段）。 */
  release_version?: string;
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
  /** 「贪饕」侵蚀侵入名单（StageInvasionConfig；未进入名单的怪物无此字段） */
  invaded?: MonsterInvaded;
}

/** 侵入名单：invasion_ids 为侵蚀等级序号，stages 为波及关卡 ID（用于详情页标记与回链） */
export interface MonsterInvaded {
  invasion_ids: number[];
  stages: number[];
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
