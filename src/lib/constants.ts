
export const CDN = 'https://static.nanoka.cc';

export const SITE_NAME = '星铁档案馆';

export let USE_OFFICIAL_PATHS = false;

export function setUseOfficialPaths(v: boolean): void {
  USE_OFFICIAL_PATHS = v;
}

export const JS_DELIVR_BRANCH = 'main';

export const OFFICIAL_ICON_BASE = `https://cdn.jsdelivr.net/gh/a285292107s/StarRailTextures@${JS_DELIVR_BRANCH}/assets/asbres/spriteoutput`;

export const SPINE_MANIFEST_VERSION = 19;

export const MAX_CHAR_LEVEL = 80;

export const PATH: Record<string, string> = {
  Knight: '存护', Rogue: '巡猎', Mage: '智识', Warlock: '虚无',
  Warrior: '毁灭', Shaman: '同谐', Priest: '丰饶', Memory: '记忆', Elation: '欢愉',
  knight: '存护', rogue: '巡猎', mage: '智识', warlock: '虚无',
  warrior: '毁灭', shaman: '同谐', priest: '丰饶', memory: '记忆', elation: '欢愉',
};

export const ELEM: Record<string, string> = {
  Wind: '风', Fire: '火', Ice: '冰', Thunder: '雷',
  Quantum: '量子', Imaginary: '虚数', Physical: '物理',
};

export const MON_RANK: Record<string, string> = {
  Minion: '普通', MinionLv2: '普通',
  Elite: '精英', LittleBoss: '准首领', BigBoss: '首领',
};

export const TYPE: Record<string, string> = {
  Normal: '普攻', BPSkill: '战技', Ultra: '终结技', Passive: '天赋',
  Maze: '秘技', Servant: '忆灵技', ServantPassive: '忆灵天赋',
};

export const STANCE_TAG: Record<string, string> = {
  SingleAttack: '单攻', AoEAttack: '群攻', Blast: '扩散',
};

export const SKILL_ICON_KEY: Record<string, string> = {
  Normal: 'Normal', BPSkill: 'BP', Ultra: 'Ultra',
  Passive: 'Passive', Maze: 'Maze', Servant: 'Servant',
  ServantPassive: 'ServantPassive',

  MazeNormal: 'Normal', ElationDamage: 'Elation', Assist: 'Ultra',
};

export const SERVANT_ICON_KEY: Record<string, string> = {
  '11402': 'Servant01', '11407': 'Servant01', '11413': 'Servant03', '18007': 'Servant01',
};

export const TRAILBLAZER_ICON_FALLBACK: Record<string, string> = {
  '8002': '8001', '8004': '8003', '8006': '8005', '8008': '8007',
};

export const SKILL_ICON_KEY_BY_NAME: Record<string, string> = {
  '普攻': 'Normal', '战技': 'BP', '终结技': 'Ultra',
  '天赋': 'Passive', '秘技': 'Maze', '忆灵技': 'Servant',
  '忆灵天赋': 'ServantPassive', '欢愉技': 'Elation', '助战技': 'Ultra',
};

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

export const STANCE_LABEL = ['SingleAttack', 'AoEAttack', 'Blast'] as const;

export const SKILL_ORDER: (string | null)[] = ['Normal', 'BPSkill', 'Ultra', 'Passive', 'ElationDamage', null, 'Maze', 'Assist'];

export const CHAR_TABS = ['overview', 'skills', 'eidolons', 'builds'] as const;

export const PROP_NAMES: Record<string, string> = {
  CriticalDamageBase: '暴击伤害', CriticalChanceBase: '暴击率', SpeedDelta: '速度',
  HPAddedRatio: '生命值%', AttackAddedRatio: '攻击力%', SPRatioBase: '能量恢复效率',
  BreakDamageAddedRatio: '击破特攻', BreakDamageAddedRatioBase: '击破特攻',
  FireAddedRatio: '火属性伤害提高',
  PhysicalAddedRatio: '物理属性伤害提高', IceAddedRatio: '冰属性伤害提高',
  LightningAddedRatio: '雷属性伤害提高', ThunderAddedRatio: '雷属性伤害提高',
  WindAddedRatio: '风属性伤害提高',
  QuantumAddedRatio: '量子属性伤害提高', ImaginaryAddedRatio: '虚数属性伤害提高',
  HPDelta: '生命值', AttackDelta: '攻击力', DefenceDelta: '防御力',
  DefenceAddedRatio: '防御力%', HealRatioBase: '治疗量加成',
  EffectHitRateBase: '效果命中', EffectResistBase: '效果抵抗',
  StatusProbabilityBase: '效果命中', StatusResistanceBase: '效果抵抗',
  ElationDamageAddedRatioBase: '欢愉伤害提高',
};

export const SLOT_ICONS: Record<string, string> = {
  BODY: 'IconRelicBody', FOOT: 'IconRelicFoot', NECK: 'IconRelicNeck', OBJECT: 'IconRelicGoods',
};

export const SLOT_NAMES: Record<string, string> = {
  HEAD: '头部', HAND: '手部', BODY: '躯干', FOOT: '脚部', NECK: '位面球', OBJECT: '连结绳',
};

export const SLOT_INDEX: Record<string, number> = {
  HEAD: 1, HAND: 2, BODY: 3, FOOT: 4, NECK: 5, OBJECT: 6,
};
