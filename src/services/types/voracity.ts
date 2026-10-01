/** 贪饕污染专题数据（public/data/cn/voracity.json，converter `voracity` 模块单文件产出） */

/** 愿力分档进度（ActivityVoracityInvasionPro）：progress 为 0~1，源表无 ActivityProgress 时为 null */
export interface VoracityProgressStep {
  progress?: number | null;
  desc: string;
}

/** 玩家侧分档支援（ActivityVoracityInvasionBuf + MazeBuff 3034011–3034013） */
export interface VoracityBuffLevel {
  level: number;
  buff_id: number;
  name?: string;
  desc?: string;
  param_list?: number[];
  /** BuffIcon 相对路径（去 SpriteOutput/ 前缀与 .png 后缀） */
  icon?: string;
  progress_percent?: number | null;
}

export interface VoracityActivity {
  panel_id?: number;
  name: string;
  intro?: string;
  unlock_mission_id?: number;
  /** 每只被污染怪物汇聚的愿力档位（ConstValueCommon → Activity_TantaoInvasion_Score） */
  scores?: number[];
  progress_steps?: VoracityProgressStep[];
  buff_levels?: VoracityBuffLevel[];
}

/** 敌方侧侵蚀等级（StageInvasionBuff + MazeBuff 3034001–3034003） */
export interface VoracityInvasionLevel {
  invasion_id: number;
  maze_buff_id?: number;
  desc?: string;
  param_list?: number[];
  /** 战斗绑定键（InBattleBindingKey，如 ChallengePeakBattle_GluttonyAbility_LV1） */
  binding?: string;
  /** BuffIcon 相对路径（去 SpriteOutput/ 前缀与 .png 后缀） */
  icon?: string;
}

export interface VoracityStageMonster {
  /** 实例 ID（MonsterInvasionList 的实例 MonsterID） */
  monster_id?: number;
  /** 模板 ID 解析结果（MonsterConfig.MonsterID → MonsterTemplateID）；解析不到为 null 并省略 name/icon */
  detail_id?: number | null;
  name?: string;
  icon?: string;
}

/** 污染关卡所属的终局赛季与位置（ADR 0026：由 voracity 模块自读关卡表算出） */
export interface VoracityStageScope {
  /** 终局模式 key（maze / story / boss / peak，与 ENDGAME_MODES 一致） */
  mode: string;
  /** 赛季 ID（= /endgame/{mode}/{season_id} 的末段） */
  season_id: string;
  /** 赛季名（分组表 GroupName；未发布赛季无文案，其作用域不输出） */
  season_name: string;
  /** 位置：stage1/stage2 = 上下半场；level = 异相仲裁单关；tierce = 星启附加关 */
  half: string;
  /** 层序号（仅层级模式） */
  floor?: number;
  /** 官方关卡名（层名 / 异相仲裁关名） */
  title?: string;
}

export interface VoracityStage {
  stage_id: number;
  invasion_id: number;
  /** 该关卡所属的终局赛季（同一关卡可属多赛季，故为列表；可空） */
  scopes?: VoracityStageScope[];
  monsters?: VoracityStageMonster[];
}

export interface VoracityInvasion {
  levels?: VoracityInvasionLevel[];
  stages?: VoracityStage[];
}

/** 状态词条（StatusConfig 中 ModifierName 含 Gluttony / StageInvasion 的记录） */
export interface VoracityStatus {
  status_id: number;
  name: string;
  /** Debuff / Buff（StatusConfig.Type） */
  type?: string;
  desc?: string;
  /** 占位符替换参数；desc 携带 #N[...] 而此处缺失时前端整段省略该描述 */
  param_list?: number[];
  icon?: string;
  modifier?: string;
  can_dispel?: boolean;
}

export interface VoracityTutorial {
  id: number;
  /** 教程图相对路径（无扩展名，如 TutorialPic/TutorialPage_1050101） */
  image?: string;
  desc?: string;
}

/** 货币战争位面词条（GridFightAffixConfig 中命中侵蚀位面文案的记录） */
export interface VoracityAffix {
  id: number;
  name: string;
  desc?: string;
  /** 完整 SpriteOutput 路径（与源表 IconPath 同形，如 SpriteOutput/GridFight/BattleIcon/BuffIcon/…png），消费方 `gridFightIconUrl` */
  icon?: string;
  params?: number[];
}

export interface VoracityDb {
  activity?: VoracityActivity;
  invasion?: VoracityInvasion;
  statuses?: VoracityStatus[];
  tutorials?: VoracityTutorial[];
  affixes?: VoracityAffix[];
}
