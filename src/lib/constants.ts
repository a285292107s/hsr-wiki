/** 全局常量：CDN 地址 / 命途 / 属性 / 技能类型 / 韧性标签映射（沿用原项目数据） */

export const CDN = 'https://static.nanoka.cc';

// spine-player 运行时版本（单一来源：生产渲染 / 调试页 / 验收报告共用；
// 升级需回归验证：4.2.x 向后兼容 4.1 数据、向前不兼容）
export const SPINE_RUNTIME_VERSION = '4.2.43';

// spine-manifest 版本（缓存键后缀：spine_manifest_official_v{N} / spine_manifest_nanoka_v{N}）。
// 必须与 public/data/cn/spine-manifest-official.json 与 spine-manifest-nanoka.json 两文件的
// 顶层 version 字段一致，一致性由 src/services/__tests__/spine-manifest.test.ts 强制校验。
export const SPINE_MANIFEST_VERSION = 15;

// spine-player 运行时（多 CDN 兜底，jsdelivr 优先以兼顾国内可达性）
export const SPINE_RUNTIME_CDNS = [
  `https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://unpkg.com/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
];

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

/** 韧性条标签（show_stance_list 下标对应枚举 → 中文） */
export const STANCE_TAG: Record<string, string> = {
  SingleAttack: '单攻', AoEAttack: '群攻', Blast: '扩散',
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

/** 忆灵技图标 CDN 后缀按忆灵 ID 硬编码（资产命名不统一：无后缀/01/03）；未收录的默认 'Servant' */
export const SERVANT_ICON_KEY: Record<string, string> = {
  '11402': 'Servant01', '11407': 'Servant01', '11413': 'Servant03', '18007': 'Servant01',
};

/** 开拓者偶数变体（8002/04/06/08）CDN 无图标资产，回退配对奇数 ID */
export const TRAILBLAZER_ICON_FALLBACK: Record<string, string> = {
  '8002': '8001', '8004': '8003', '8006': '8005', '8008': '8007',
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

/** 韧性条下标枚举（show_stance_list 下标对应） */
export const STANCE_LABEL = ['SingleAttack', 'AoEAttack', 'Blast'] as const;

/** 技能展示排序（null 为分隔位）；ElationDamage（欢愉技）置于天赋后 */
export const SKILL_ORDER: (string | null)[] = ['Normal', 'BPSkill', 'Ultra', 'Passive', 'ElationDamage', null, 'Maze', 'Assist'];

/** 角色详情页 Tab */
export const CHAR_TABS = ['overview', 'skills', 'eidolons', 'builds'] as const;

/* ─── 遗器属性 / 部位映射（角色配装与遗器详情页共用） ─── */

/** 属性类型 → 中文名（遗器主副词条 / 行迹加成共用） */
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

/** 部位 → 遗器部位图标键（CDN: relicfigures/{key}.webp；HEAD/HAND 无独立图标） */
export const SLOT_ICONS: Record<string, string> = {
  BODY: 'IconRelicBody', FOOT: 'IconRelicFoot', NECK: 'IconRelicNeck', OBJECT: 'IconRelicGoods',
};

/** 部位 → 中文名 */
export const SLOT_NAMES: Record<string, string> = {
  HEAD: '头部', HAND: '手部', BODY: '躯干', FOOT: '脚部', NECK: '位面球', OBJECT: '连结绳',
};

/** 部位 → 图标索引（CDN: relicfigures/IconRelic_{setId}_{index}.webp） */
export const SLOT_INDEX: Record<string, number> = {
  HEAD: 1, HAND: 2, BODY: 3, FOOT: 4, NECK: 5, OBJECT: 6,
};
