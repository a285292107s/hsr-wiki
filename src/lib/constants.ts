
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

export const CHAR_STAGE_LEVEL_CAPS: readonly number[] = [20, 30, 40, 50, 60, 70];

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

export const SLOT_ICONS: Record<string, string> = {
  BODY: 'IconRelicBody', FOOT: 'IconRelicFoot', NECK: 'IconRelicNeck', OBJECT: 'IconRelicGoods',
};

export const SLOT_INDEX: Record<string, number> = {
  HEAD: 1, HAND: 2, BODY: 3, FOOT: 4, NECK: 5, OBJECT: 6,
};