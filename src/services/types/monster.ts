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
  /** 维度修饰比（MonsterConfig FaceId 版面；模板自身记录缺省位为 1） */
  stat_ratio?: { hp?: number; atk?: number; def?: number; speed?: number };
  /** 等级曲线难度组（MonsterConfig.HardLevelGroup，缺省 1；曲线全量走 monster-level-curve.json） */
  level_group?: number;
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
