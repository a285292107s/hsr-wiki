/** 敌对物种相关数据类型（monster.json 列表端点 + converter 本地列表 + monsters/{id}.json 详情） */

/* ─── 列表端点（standalone 目录页数据源；注意：无 /zh/ 路径段） ─── */

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

/* ─── 本地目录列表（converter 输出，数组形态） ─── */

/** 敌对物种列表条目 */
export interface LocalMonsterEntry {
  id: number;
  name: string;
  icon: string;
  type?: string;
  /**
   * 韧性弱点属性（MonsterConfig.StanceWeakList，如 ["Physical","Ice"]；空数组 = 无弱点）。
   * 卡片上**唯一能区分同族各档**的字段：632 个模板里 400 张卡若只展示名称+分类就与另一张
   * 完全无法区分，而 149 个同族簇里只有 41 个簇弱点相同。
   */
  weak?: string[];
  /** 阵营名称（MonsterTemplateConfig.MonsterCampID → MonsterCamp.Name；无阵营为空串，实测 379/632 为空）。 */
  camp?: string;
}
export type LocalMonsterList = LocalMonsterEntry[];

/* ─── 敌对物种详情（converter 输出，每怪物一个 JSON：monsters/{id}.json） ─── */

/** 技能附带效果（`MonsterSkillConfig.ExtraEffectIDList` → `ExtraEffectConfig`，**完整外键**：
 *  实测技能侧引用的 118/118 个 ID 全在该表；文案如「额外回合」「行动提前」）。
 *  图标（`BuffIcon/Inlevel/*`）在 nanoka 与 jsDelivr 双侧 404 ⇒ 只出文本，不落图标字段。 */
export interface MonsterExtraEffect {
  id: number;
  name: string;
  /** 效果描述（原始富文本，前端 fmtDesc 渲染） */
  desc?: string;
  /** 描述里的 `#N[i]` 替换参数 */
  param_list?: number[];
}

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
  /** 附带效果（有值才落键；实测覆盖 215/632 个目录模板） */
  extra_effects?: MonsterExtraEffect[];
}

/** 掉落物品（MonsterDrop.DisplayItemList → ItemConfig 的 ItemID：名称/图标与 items.json 同源） */
export interface MonsterDropItem {
  id: number;
  name: string;
  icon: string;
}

/**
 * 掉落档（MonsterDrop 按均衡等级分档）。
 * `world_level` 为 `null` = 基准档（无均衡等级限制），排序时在最前；其余按等级升序。
 */
export interface MonsterDropTier {
  world_level: number | null;
  /** 该档的角色经验奖励（AvatarExpReward） */
  avatar_exp: number;
  items: MonsterDropItem[];
}

/** 出没样本：一关的 ID 与名称（StageConfig.StageName 的 TextMap 文案） */
export interface MonsterAppearanceSample {
  id: number;
  name: string;
}

/**
 * 出没统计（StageConfig 波次 + `MonsterConfig.SummonIDList` 召唤链）。
 * `total` = 该模板（含其被召唤出场）出现过的关卡数（同关多波只计一次）；
 * `samples` = 至多 3 个「关卡名与来源类型都不同」的样本，可能为空（关卡无名时不落样本）。
 */
export interface MonsterAppearances {
  total: number;
  samples: MonsterAppearanceSample[];
}

/**
 * 额外阶段（MonsterAtlasExtraPhase(s)，按 TemplateGroupID 归属某族）。
 * `phase_id` 是源表字段原值（1/2），**不是**游戏内阶段号——实测 PhaseID=1 的记录里立绘
 * 就有 `_Phase2` 的（4014010 / 3025010 / 4035010 / 4044010），故页面上按源字段名呈现。
 */
export interface MonsterPhase {
  phase_id: number;
  weak: string[];
  resist: Record<string, number>;
  /** 该阶段的名称（源表仅 3/9 有） */
  name?: string;
  /** 该阶段的图鉴介绍（源表仅 3/9 有） */
  intro?: string;
}

/**
 * 状态词条（`MonsterStatusConfig`，**安全子集**）。
 * 归属是**命名约定桥**而非外键：`ModifierName = <怪物配置名>[_<SkillTriggerKey>]_<效果后缀>`，
 * 取包含式最长 token，且该 token 命中的模板**去掉形态括号后缀后必须同名**才归属
 * （宁可少归、不可错归：实测 598 → 304 条，覆盖 234/632 个目录模板）。
 */
export interface MonsterStatusDetail {
  id: number;
  name: string;
  /** 源字段 `StatusType` 原值（Buff / Debuff / Other；前端映射为 增益/减益/其他） */
  type: string;
  /** 可被驱散（源字段 `CanDispel` 为真才落键） */
  dispel?: boolean;
  /** 描述——**只在既无 `#N[i]` 占位符、也无 `%宏`** 时落：状态描述的数值来自动态属性
   *  （`ReadParamList` 只有键名），`%CasterName` / `%DynamicTargetName` 这类运行时替换也不可知；
   *  照仓规「缺参整段省略，不落残缺占位与 `?`」（`src/lib/format.ts → refsResolved`） */
  desc?: string;
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
  /** 维度修饰比（MonsterConfig FaceId 版面；模板自身记录缺省位为 1） */
  stat_ratio?: { hp?: number; atk?: number; def?: number; speed?: number };
  /** 该实例的**韧性修正值**（`MonsterConfig.StanceModifyValue`，如 +30 / −120；缺位不落键）。
   *  口径：`韧性 = 韧性基准 + 修正值`（韧性不入等级曲线链）。判据见 ADR 0045。 */
  stance_modify?: number;
  /** 该实例的**速度修正值**（`MonsterConfig.SpeedModifyValue`，如 −44 / +56；缺位不落键）。
   *  口径：`速度(等级) = 基准 × 修饰比 × 曲线 + 修正值`（修正值加在曲线之后、不再被缩放）。 */
  speed_modify?: number;
  /** 等级曲线难度组（MonsterConfig.HardLevelGroup，缺省 1；曲线全量走 monster-level-curve.json） */
  level_group?: number;
  /** 技能列表（SkillList → MonsterSkillConfig） */
  skills: MonsterSkillDetail[];
  /** 「贪饕」侵蚀侵入名单（StageInvasionConfig；未进入名单的怪物无此字段） */
  invaded?: MonsterInvaded;
  /** 掉落（MonsterDrop；实测 398/632 个目录条目有物品，其余只登记了空档位） */
  drops?: MonsterDropTier[];
  /** 出没（StageConfig 波次 + 召唤链；实测 544/632 个模板可查到出场） */
  appearances?: MonsterAppearances;
  /** 额外阶段（MonsterAtlasExtraPhase(s)；实测仅 9 个族有数据、覆盖 39 个模板） */
  phases?: MonsterPhase[];
  /** 状态词条（MonsterStatusConfig 安全子集；实测覆盖 234/632 个目录模板） */
  statuses?: MonsterStatusDetail[];
}

/** 侵入名单：invasion_ids 为侵蚀等级序号，stages 为波及关卡 ID（用于详情页标记与回链） */
export interface MonsterInvaded {
  invasion_ids: number[];
  stages: number[];
}
