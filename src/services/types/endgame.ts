/** 终局玩法数据类型（maze.json / maze*.catalog.json / zh/maze/version.json：
 *  忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁四模式共用） */

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

/** 阶段小节问答（MonsterGuideSkill × MonsterGuideSkillText：SkillName 是问句、正文是答句，
 *  如「如何高效削减首领幻影的韧性」；实测各只有 1 条文本且无 #N[i] 占位符） */
export interface MazeBossPhaseSkill {
  name: string;
  desc?: string;
}

/** 首领阶段（MonsterGuidePhase，游戏内首领图鉴的阶段机制）：阶段名自带「阶段一：…」前缀，
 *  answer 是官方应对策略原文（含「应对策略：」前缀） */
export interface MazeBossPhase {
  /** MonsterGuidePhase.PhaseID */
  id: number;
  name: string;
  /** 机制说明（原始富文本） */
  desc?: string;
  /** 官方应对策略（原始富文本） */
  answer?: string;
  /** 该阶段的小节问答 */
  skills?: MazeBossPhaseSkill[];
}

/** 首领机制正文（converter 输出：敌方模板 ID → 首领特性 + 阶段机制；仅末日幻影产出）。
 *  归属由转换器算好：命中登记的敌方条目带 `boss_guide` 模板指针，前端按指针取本表，
 *  **不做模板推导**（配置表的敌方 ID 未必等于战斗敌方，见 ADR 0029 修订） */
export interface MazeBossGuide {
  traits?: MazeBossTrait[];
  phases?: MazeBossPhase[];
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
  /** 韧性值（`StanceBase` **+ 该实例的 `StanceModifyValue`**，如 300 − 120 = 180；模板缺失时不输出）。
   *  韧性不入等级曲线链，故只有「基准 + 修正」；修正值在转换期并入（ADR 0045） */
  stance?: number;
  /** 速度（MonsterTemplateConfig.SpeedBase.Value，如 144；模板缺失时不输出） */
  /** 速度（`MonsterTemplateConfig.SpeedBase.Value` **+ 该实例的 `SpeedModifyValue`**，如 144 − 44 = 100；
   *  模板缺失时不输出）。修正值在转换期并入（敌方卡无等级语境，口径见 ADR 0045） */
  speed?: number;
  /** 模板 ID（仅实例别名 MonsterID≠MonsterTemplateID 时输出，如 501211002 → 5012110；
   *  详情页跳转 /monster/:tpl 用；无别名时 id 即模板 ID） */
  tpl?: string;
  /** 战斗波次序号（StageConfig.MonsterList 波次展开，1 起；层级/peak/星启节点敌方均带此字段） */
  wave?: number;
  /** 该敌方实例的召唤物（`MonsterConfig.SummonIDList` 命中本场次时输出；见 MazeSummonInfo） */
  summons?: MazeSummonInfo[];
  /** 首领机制指针（模板 ID，键指向赛季级 `boss_guides`；仅末日幻影登记机制条目的敌方有）。
   *  由转换器按敌方模板算出——**召唤物不带**（同组的部件与形态会重复渲染同一批机制） */
  boss_guide?: string;
  /** 效果抵抗（`MonsterConfig.DebuffResist` × `MonsterStatusResistanceType`：状态类别 → 免疫图标）。
   *  **上游只有图标没有文字名**（TextMap 无「免疫冻结」类文案），故只呈现图标 + 百分比；
   *  只随「敌方详情卡」形态输出（末日幻影楼层 / 星启节点 / 异相仲裁单关），轻形态不带 */
  debuff_resist?: MazeDebuffResistInfo[];
}

/** 单条效果抵抗：key 为上游状态类别（如 `STAT_CTRL_Frozen`，仅供回溯，不上屏）；
 *  value 为抵抗率（0–1，实测 0.5 / 0.75 / 1）；icon 为 `statusimmune` 分类的 basename */
export interface MazeDebuffResistInfo {
  key: string;
  value: number;
  icon: string;
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
  /** 满分档（星启表的 `GNGENMHNLAH`）：3 星之外的**棱彩星**条件档，前端从星级目标里拆出来单列 */
  prism?: boolean;
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
  /** 该层通关奖励（Challenge*MazeConfig.RewardID → RewardData；未命中缺省） */
  reward?: MazeRewardItem[];
  /** 该层可达的星级奖励档（本赛季累计星数阶梯按层序切片；见 MazeStarReward / ADR 0051） */
  star_rewards?: MazeStarReward[];
}

/** 奖励物品（RewardData 六槽位解析：物品 id + 数量；Hcoin 已在转换期并入星琼 id=1，
 *  与 items.json 同键，前端经 itemIconUrl / items 单例映射名称与图标） */
export interface MazeRewardItem {
  id: number;
  num?: number;
}

/** 累计星数奖励阶梯（ADR 0051）：主模式每档 = 累计星数（每达成 1 个挑战目标计 1 星，
 *  档位按本期可达星数上限截断）；异相仲裁按 `label` 分口径（骑士星数 / 王棋星数）。 */
export interface MazeStarReward {
  star: number;
  items: MazeRewardItem[];
  /** 异相仲裁的星数口径；主模式缺省（本赛季只有一套星数） */
  label?: string;
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
  /** 场次键：按它取赛季级 `buff_groups`（赛季增益）——`tierce` = 星启附加关那一组，
   *  只有末日幻影产出该项。首领机制不走场次键（按敌方模板键，见 MazeMonsterInfo.boss_guide） */
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
  rewards?: MazeRewardItem[];
  /** 棱彩星奖励（满分档 `IMCMJHAMMKK` → RewardData：星琼 100 + 信用点 20000 + 璧羽 100）：
   *  官方规则说明「星启模式中第 N 关通关且获得 N 分，即可以获得棱彩星和额外的新奖励」 */
  prism_reward?: MazeRewardItem[];
}

/* ─── maze.json 条目（键 = 赛季 ID） ─── */

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
  /** 首领机制正文（仅末日幻影：敌方模板 ID → 首领特性 + 阶段机制，按敌方 `boss_guide` 指针取） */
  boss_guides?: Record<string, MazeBossGuide>;
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
  /** 赛季级累计星数奖励阶梯（*RewardLine / ChallengePeakReward；无奖励线缺省。ADR 0051） */
  star_rewards?: MazeStarReward[];
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
  /** 赛季级污染汇总（目录卡「贪饕污染」标记判据） */
  pollution?: PollutionSummary;
}

/** 目录卡轻量赛季表（键 = 赛季 ID） */
export type MazeCatalogDb = Record<string, MazeCatalogEntry>;

/** zh/maze/version.json：版本 → 赛季 ID 列表（键按版本降序） */
export type MazeVersionMap = Record<string, (number | string)[]>;

/** 增益体系的选择语义（`endgame_guide.json` 的 `system.choice`；展示文案在前端 `endgame/guide.ts`） */
export type EndgameSystemChoice = 'fixed' | 'per_team' | 'per_stage' | 'per_king';

/** 玩法详情页的一节规则正文（正文逐字来自 IntroData，换行为字面量 `\n`，由展示层转行） */
export interface EndgameGuideSection {
  title: string;
  text: string;
}

/** 赛季增益体系：体系名派生自 IntroData 分节标题（游戏内按玩法命名，不是站点工作名「赛季增益」） */
export interface EndgameGuideSystem {
  name: string;
  count: number;
  choice: EndgameSystemChoice;
}

/** 单个终局玩法的说明（`endgame_guide.json` → `modes[key]`） */
export interface EndgameGuideMode {
  key: string;
  label: string;
  en: string;
  intro_id: number;
  sections: EndgameGuideSection[];
  /** 体系名未在分节标题里命中时缺省（转换器宁可缺、不自造） */
  system?: EndgameGuideSystem;
}

/** zh/endgame_guide.json：四玩法规则正文与增益体系（键 = maze / story / boss / peak） */
export interface EndgameGuideDb {
  modes: Record<string, EndgameGuideMode>;
}
