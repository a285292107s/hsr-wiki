
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

/**
 * 角色突破档位的等级上限（`AvatarPromotionConfig` 的 `MaxLevel`，全角色同一套）。
 * 档位下标与此数组一一对应：0 = 上限 20、1 = 30 …、6 = 80（满级档，不再解锁新档位故不列入）。
 * 角色详情页的等级滑条靠它把「等级」映射到「可突破到的最高档位」——见 `charStageForLevel`。
 */
export const CHAR_STAGE_LEVEL_CAPS: readonly number[] = [20, 30, 40, 50, 60, 70];

/* 枚举展示名（命途 / 元素 / 技能类型 / 削韧架势）不在此登记：
   命途与元素取数据源（paths.json / elements.json 令牌），技能类型与架势取词典，
   统一经 lib/enum-labels.ts 的 pathLabel / elemLabel / skillTypeLabel / stanceTagLabel 读取。 */

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

/* 属性名 / 部位名不在此登记：展示名取官方词条（随语言包切语言），见 lib/enum-labels.ts。
   此处只留与语言无关的资源映射（图标 / 序号）。 */

export const SLOT_ICONS: Record<string, string> = {
  BODY: 'IconRelicBody', FOOT: 'IconRelicFoot', NECK: 'IconRelicNeck', OBJECT: 'IconRelicGoods',
};

export const SLOT_INDEX: Record<string, number> = {
  HEAD: 1, HAND: 2, BODY: 3, FOOT: 4, NECK: 5, OBJECT: 6,
};