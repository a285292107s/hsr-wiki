/** 全局常量：CDN 地址 / 命途 / 属性 / 技能类型 / 标签映射（沿用原项目数据） */

export const CDN = 'https://static.nanoka.cc';

/** 角色满级（80 级） */
export const MAX_CHAR_LEVEL = 80;

/** 命途（含大小写两种键，兼容不同数据源） */
export const PATH: Record<string, string> = {
  Knight: '存护', Rogue: '巡猎', Mage: '智识', Warlock: '虚无',
  Warrior: '毁灭', Shaman: '同谐', Priest: '丰饶', Memory: '记忆', Elation: '欢愉',
  knight: '存护', rogue: '巡猎', mage: '智识', warlock: '虚无',
  warrior: '毁灭', shaman: '同谐', priest: '丰饶', memory: '记忆', elation: '欢愉',
};

/** 战斗属性 */
export const ELEM: Record<string, string> = {
  Wind: '风', Fire: '火', Ice: '冰', Thunder: '雷',
  Quantum: '量子', Imaginary: '虚数', Physical: '物理',
};

/** 技能类型 */
export const TYPE: Record<string, string> = {
  Normal: '普攻', BPSkill: '战技', Ultra: '终结技', Passive: '天赋',
  Maze: '秘技', Servant: '忆灵技', ServantPassive: '忆灵天赋',
};

/** 技能标签 */
export const TAG: Record<string, string> = {
  SingleAttack: '单攻', AoEAttack: '群攻', Blast: '扩散', Bounce: '弹射',
  Support: '辅助', Enhance: '强化', Defence: '防御', Impair: '削弱',
  Restore: '恢复', MazeAttack: '秘技普攻',
};

/** 技能图标键映射（SkillIcon_{id}_{key}.webp） */
export const SKILL_ICON_KEY: Record<string, string> = {
  Normal: 'Normal', BPSkill: 'BP', Ultra: 'Ultra',
  Passive: 'Passive', Maze: 'Maze', Servant: 'Servant',
  ServantPassive: 'ServantPassive',
  // 原版遍漏修复：MazeNormal（秘技普攻）与普攻共用图标；
  // ElationDamage（欢愉技）CDN 键名为 Elation；Assist（助战技）无独立图标资产，回退终结技图标
  MazeNormal: 'Normal', ElationDamage: 'Elation', Assist: 'Ultra',
};

/** type_name → 图标键反查（部分角色天赋技能 type 为 null，仅有 type_name） */
export const SKILL_ICON_KEY_BY_NAME: Record<string, string> = {
  '普攻': 'Normal', '战技': 'BP', '终结技': 'Ultra',
  '天赋': 'Passive', '秘技': 'Maze', '忆灵技': 'Servant',
  '忆灵天赋': 'ServantPassive', '欢愉技': 'Elation', '助战技': 'Ultra',
};

/** 行迹属性加成图标映射（property_type → trace 图标键；图标路径 `${CDN}/assets/hsr/trace/Icon{key}.webp`） */
export const PROP_ICON: Record<string, string> = {
  AttackAddedRatio: 'Attack', HPAddedRatio: 'MaxHP', DefenceAddedRatio: 'Defence',
  SpeedDelta: 'Speed', CriticalChanceBase: 'CriticalChance', CriticalDamageBase: 'CriticalDamage',
  BreakDamageAddedRatioBase: 'BreakUp', StatusProbabilityBase: 'StatusProbability',
  StatusResistanceBase: 'StatusResistance', ElationDamageAddedRatioBase: 'Joy',
  PhysicalAddedRatio: 'PhysicalAddedRatio', FireAddedRatio: 'FireAddedRatio',
  IceAddedRatio: 'IceAddedRatio', ThunderAddedRatio: 'ThunderAddedRatio',
  WindAddedRatio: 'WindAddedRatio', QuantumAddedRatio: 'QuantumAddedRatio',
  ImaginaryAddedRatio: 'ImaginaryAddedRatio',
};

/** 韧性条标签（show_stance_list 下标对应） */
export const STANCE_LABEL = ['SingleAttack', 'AoEAttack', 'Blast'] as const;

/** 技能展示排序（null 为分隔位） */
export const SKILL_ORDER: (string | null)[] = ['Normal', 'BPSkill', 'Ultra', 'Passive', null, 'Maze', 'Assist'];

/** 角色详情页 Tab */
export const CHAR_TABS = ['overview', 'skills', 'eidolons', 'builds'] as const;
