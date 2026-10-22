import { describe, expect, it } from 'vitest';
import {
  ACTION_VALUE_BASE,
  CYCLE_ACTION_VALUE,
  DEF_LEVEL_BASE,
  DEF_LEVEL_STEP,
  DMG_REDUCTION_CAP,
  FIRST_CYCLE_ACTION_VALUE,
  RES_MAX,
  RES_MIN,
  SWARM_DEF_LEVEL_BASE,
  SWARM_DEF_LEVEL_STEP,
  TOUGHNESS_DMG_REDUCTION,
  TRACE_TIERS,
  VULNERABILITY_CAP,
  WEAKNESS_FLOOR,
} from '../formula/constants';
import {
  attackerLevelValue,
  defenseZone,
  effectiveResistance,
  enemyDefenseValue,
  resistanceZone,
} from '../formula/defense';
import {
  critShare,
  damageBreakdown,
  expectedCritZone,
  zoneLedger,
  type DamageInput,
  type ZoneKey,
} from '../formula/damage';
import {
  CYCLE_AV,
  FIRST_CYCLE_AV,
  actionValue,
  breakToughness,
  effectChance,
  healAmount,
  shieldAmount,
  speedNeeded,
  turnsInBudget,
  turnsPerCycle,
} from '../formula/combat';

const r = (n: number): number => Math.round(n * 1e6) / 1e6;

describe('机制常量', () => {
  it('防御等级值 / 行动值 / 乘区钳制按官方口径落常量', () => {
    expect(DEF_LEVEL_BASE).toBe(200);
    expect(DEF_LEVEL_STEP).toBe(10);
    expect(SWARM_DEF_LEVEL_BASE).toBe(300);
    expect(SWARM_DEF_LEVEL_STEP).toBe(15);
    expect(ACTION_VALUE_BASE).toBe(10000);
    expect(FIRST_CYCLE_ACTION_VALUE).toBe(150);
    expect(CYCLE_ACTION_VALUE).toBe(100);
    expect(VULNERABILITY_CAP).toBe(3.5);
    expect(DMG_REDUCTION_CAP).toBe(0.99);
    expect(WEAKNESS_FLOOR).toBe(0.2);
    expect(RES_MIN).toBe(-1);
    expect(RES_MAX).toBe(0.9);
    expect(TOUGHNESS_DMG_REDUCTION).toBe(0.1);
    expect(TRACE_TIERS).toEqual({ high: 7, mid: 4.5, low: 2.5 });
  });
});

describe('防御区', () => {
  it('攻击方等级值 = 200 + 10 × 等级', () => {
    expect(attackerLevelValue(1)).toBe(210);
    expect(attackerLevelValue(80)).toBe(1000);
    expect(attackerLevelValue(100)).toBe(1200);
  });

  it('敌人防御值：普通 200+10×等级，扑满 300+15×等级', () => {
    expect(enemyDefenseValue(80)).toBe(1000);
    expect(enemyDefenseValue(80, { swarm: true })).toBe(1500);
    expect(enemyDefenseValue(95)).toBe(1150);
  });

  it('减防与防御穿透加算后乘入防御，防御下限 0', () => {
    expect(enemyDefenseValue(80, { defReduction: 0.3 })).toBe(700);
    expect(enemyDefenseValue(80, { defReduction: 0.3, defPenetration: 0.1 })).toBe(600);
    expect(enemyDefenseValue(80, { defReduction: 0.6, defPenetration: 0.6 })).toBe(0);
    expect(enemyDefenseValue(80, { defModify: 50 })).toBe(1050);
  });

  it('同级 80 vs 80 防御区 0.5，扑满 0.4；防御归零时防御区上限为 1', () => {
    expect(r(defenseZone(80, enemyDefenseValue(80)))).toBe(0.5);
    expect(r(defenseZone(80, enemyDefenseValue(80, { swarm: true })))).toBe(0.4);
    expect(defenseZone(80, 0)).toBe(1);
    expect(defenseZone(80, -500)).toBe(1);
    expect(r(defenseZone(80, 700))).toBe(r(1000 / 1700));
  });
});

describe('抗性区', () => {
  it('加算叠加并钳到 [-100%, 90%]', () => {
    expect(effectiveResistance({})).toBe(0);
    expect(effectiveResistance({ base: 0.2 })).toBe(0.2);
    expect(r(effectiveResistance({ base: 0.2, bonus: 0.1, reduction: 0.3, penetration: 0.1 }))).toBe(-0.1);
    expect(effectiveResistance({ base: 0.5, bonus: 0.6 })).toBe(RES_MAX);
    expect(effectiveResistance({ base: -0.5, reduction: 0.6 })).toBe(RES_MIN);
  });

  it('抗性区 = 1 - 抗性，取值 10% ~ 200%', () => {
    expect(resistanceZone(0)).toBe(1);
    expect(resistanceZone(0.2)).toBeCloseTo(0.8, 12);
    expect(resistanceZone(RES_MIN)).toBe(2);
    expect(resistanceZone(RES_MAX)).toBeCloseTo(0.1, 12);
    expect(resistanceZone(-2)).toBe(2);
    expect(resistanceZone(2)).toBeCloseTo(0.1, 12);
  });
});

describe('暴击区', () => {
  it('暴击期望 = 1 + 暴击率 × 暴击伤害', () => {
    expect(expectedCritZone(0.05, 0.5)).toBeCloseTo(1.025, 12);
    expect(expectedCritZone(1, 2)).toBe(3);
    expect(expectedCritZone(0, 1)).toBe(1);
    expect(expectedCritZone(0.5, 0.5)).toBeCloseTo(1.25, 12);
  });

  it('暴击收益占比 = 期望增益 / 期望暴击区', () => {
    expect(critShare(0, 1)).toBe(0);
    expect(r(critShare(0.05, 0.5))).toBe(r(0.025 / 1.025));
    expect(r(critShare(0.6, 1.2))).toBe(r(0.72 / 1.72));
  });
});

describe('伤害分解', () => {
  const input: DamageInput = {
    stat: 3000,
    multiplier: 2,
    dmgBonus: 0.5,
    vulnerability: 0.3,
    dmgReduction: 0.1,
    weakness: 0,
    critRate: 0.6,
    critDmg: 1.2,
    attackerLevel: 80,
    defenderLevel: 80,
    resistance: 0.2,
  };

  it('基础伤害 = 属性 × 倍率 + 固定值', () => {
    expect(damageBreakdown({ ...input, flat: 120 }).base).toBe(6120);
    expect(damageBreakdown(input).base).toBe(6000);
  });

  it('各乘区系数与期望/暴击伤害逐项吻合', () => {
    const d = damageBreakdown(input);
    expect(d.bonusZone).toBe(1.5);
    expect(d.vulnerabilityZone).toBe(1.3);
    expect(d.reductionZone).toBeCloseTo(0.9, 12);
    expect(d.weaknessZone).toBe(1);
    expect(d.modifierZone).toBeCloseTo(1.755, 12);
    expect(d.critZone).toBeCloseTo(2.2, 12);
    expect(d.critExpectedZone).toBeCloseTo(1.72, 12);
    expect(d.defenseValue).toBe(1000);
    expect(d.defenseZone).toBe(0.5);
    expect(d.resistanceValue).toBe(0.2);
    expect(d.resistanceZone).toBeCloseTo(0.8, 12);
    expect(d.specialZone).toBe(1);
    expect(d.critDamage).toBeCloseTo(6000 * 1.755 * 2.2 * 0.5 * 0.8 * 0.9, 6);
    expect(d.expectedDamage).toBeCloseTo(6000 * 1.755 * 1.72 * 0.5 * 0.8 * 0.9, 6);
  });

  it('韧性未破默认 ×0.9，传 0 表示已破韧', () => {
    expect(damageBreakdown(input).expectedDamage).toBeCloseTo(
      damageBreakdown({ ...input, toughnessReduction: 0 }).expectedDamage * 0.9,
      6,
    );
    expect(damageBreakdown({ ...input, toughnessReduction: 0 }).expectedDamage).toBeCloseTo(
      6000 * 1.755 * 1.72 * 0.5 * 0.8,
      6,
    );
    expect(damageBreakdown({ ...input, toughnessReduction: 5 }).expectedDamage).toBe(0);
  });

  it('易伤上限 3.5 / 减伤上限 0.99（减伤区下限 0.01）/ 虚弱区下限 0.2', () => {
    expect(damageBreakdown({ ...input, vulnerability: 10 }).vulnerabilityZone).toBe(VULNERABILITY_CAP);
    expect(damageBreakdown({ ...input, dmgReduction: 2 }).reductionZone).toBeCloseTo(0.01, 12);
    expect(damageBreakdown({ ...input, weakness: 0.95 }).weaknessZone).toBeCloseTo(WEAKNESS_FLOOR, 12);
    expect(damageBreakdown({ ...input, weakness: 1 }).weaknessZone).toBeCloseTo(WEAKNESS_FLOOR, 12);
  });

  it('减伤乘算：dmgReductions 逐项 Π(1-x) 后再钳到 0.99（下限 0.01），单值字段保持加算口径', () => {
    expect(damageBreakdown({ ...input, dmgReductions: [0.2, 0.2] }).reductionZone).toBeCloseTo(0.64, 12);
    expect(damageBreakdown({ ...input, dmgReductions: [0.5, 0.5] }).reductionZone).toBeCloseTo(0.25, 12);
    expect(damageBreakdown({ ...input, dmgReduction: 0.5 }).reductionZone).toBeCloseTo(0.5, 12);
    expect(damageBreakdown({ ...input, dmgReductions: [1, 1] }).reductionZone).toBeCloseTo(0.01, 12);
    expect(damageBreakdown({ ...input, dmgReductions: [] }).reductionZone).toBeCloseTo(
      damageBreakdown(input).reductionZone,
      12,
    );
  });

  it('扑满防御、减防穿透、抗性穿透与特殊乘区进入最终结果', () => {
    const swarm = damageBreakdown({ ...input, swarm: true });
    expect(swarm.defenseValue).toBe(1500);
    expect(r(swarm.defenseZone)).toBe(r(1000 / 2500));
    const pierced = damageBreakdown({ ...input, defReduction: 0.3, defPenetration: 0.1 });
    expect(pierced.defenseValue).toBe(600);
    expect(r(pierced.defenseZone)).toBe(r(1000 / 1600));
    const resisted = damageBreakdown({ ...input, resReduction: 0.1, resPenetration: 0.1 });
    expect(resisted.resistanceValue).toBeCloseTo(0, 12);
    expect(resisted.resistanceZone).toBe(1);
    expect(damageBreakdown({ ...input, specialBonus: 0.2, specialVulnerability: 0.1 }).specialZone).toBeCloseTo(1.32, 12);
  });

  it('zoneValues 六键齐全且为有限数，暴击取期望值', () => {
    const d = damageBreakdown(input);
    for (const key of ['base', 'modifier', 'crit', 'defense', 'resist', 'special'] as const) {
      expect(Number.isFinite(d.zoneValues[key])).toBe(true);
    }
    expect(d.zoneValues.crit).toBeCloseTo(d.critExpectedZone, 12);
    expect(Object.prototype.hasOwnProperty.call(d, 'contributions')).toBe(false);
  });

  it('乘区账本：delta = factor − 1 保符号，按 |delta| 降序', () => {
    const zones: Record<ZoneKey, number> = {
      base: 1,
      modifier: 1.8,
      crit: 0.5,
      defense: 1,
      resist: 1,
      special: 1,
    };
    const rows = zoneLedger(zones);
    expect(rows.map((row) => row.key)).toEqual([
      'modifier',
      'crit',
      'base',
      'defense',
      'resist',
      'special',
    ]);
    expect(rows[0].factor).toBeCloseTo(1.8, 12);
    expect(rows[0].delta).toBeCloseTo(0.8, 12);
    expect(rows[1].delta).toBeCloseTo(-0.5, 12);
    expect(rows.slice(2).every((row) => row.delta === 0)).toBe(true);
  });

  it('乘区账本接 damageBreakdown.zoneValues：防御 < 1 记负 delta，中性乘区 delta 为 0', () => {
    const d = damageBreakdown({
      stat: 1000,
      multiplier: 1,
      critRate: 0.05,
      critDmg: 0.5,
      attackerLevel: 80,
      defenderLevel: 80,
      toughnessReduction: 0,
    });
    const rows = zoneLedger(d.zoneValues);
    expect(rows).toHaveLength(6);
    expect(rows[0].key).toBe('base');
    const defense = rows.find((row) => row.key === 'defense');
    expect(defense?.factor).toBeCloseTo(0.5, 12);
    expect(defense?.delta).toBeCloseTo(-0.5, 12);
    expect(rows.find((row) => row.key === 'resist')?.delta).toBe(0);
    for (let index = 1; index < rows.length; index += 1) {
      expect(Math.abs(rows[index - 1].delta)).toBeGreaterThanOrEqual(Math.abs(rows[index].delta));
    }
  });

  it('乘区账本：非有限因子按中性 1 处理', () => {
    const rows = zoneLedger({
      base: 1,
      modifier: Number.NaN,
      crit: Number.POSITIVE_INFINITY,
      defense: 1,
      resist: 1,
      special: 1,
    });
    expect(rows.find((row) => row.key === 'modifier')?.factor).toBe(1);
    expect(rows.find((row) => row.key === 'crit')?.factor).toBe(1);
    expect(rows.every((row) => Number.isFinite(row.factor) && Number.isFinite(row.delta))).toBe(true);
  });

  it('极限输入不产 NaN / Infinity', () => {
    const d = damageBreakdown({
      stat: 0,
      multiplier: 0,
      critRate: Number.NaN,
      critDmg: Number.NaN,
      attackerLevel: 80,
      defenderLevel: 80,
      dmgReduction: Number.NaN,
      resistance: Number.NaN,
    });
    expect(Number.isFinite(d.expectedDamage)).toBe(true);
    expect(Number.isFinite(d.critDamage)).toBe(true);
    for (const key of ['base', 'modifier', 'crit', 'defense', 'resist', 'special'] as const) {
      expect(Number.isFinite(d.zoneValues[key])).toBe(true);
    }
  });
});

describe('速度与行动值', () => {
  it('行动值 = 10000 / 速度', () => {
    expect(actionValue(100)).toBe(100);
    expect(actionValue(160)).toBe(62.5);
    expect(r(actionValue(134))).toBe(r(10000 / 134));
    expect(actionValue(0)).toBe(10000);
  });

  it('每轮行动次数 = 轮行动值 / 行动值；首轮 150 之后 100', () => {
    expect(turnsPerCycle(100)).toBe(1);
    expect(turnsPerCycle(160)).toBeCloseTo(1.6, 12);
    expect(turnsPerCycle(100, FIRST_CYCLE_ACTION_VALUE)).toBe(1.5);
    expect(turnsPerCycle(160, FIRST_CYCLE_ACTION_VALUE)).toBeCloseTo(2.4, 12);
    expect(turnsPerCycle(250)).toBeCloseTo(2.5, 12);
  });

  it('速度阈值：首轮 1 / 2 / 3 / 4 动 → 66.6667 / 133.3333 / 200 / 266.6667', () => {
    expect(speedNeeded(1, FIRST_CYCLE_AV)).toBeCloseTo(66.6667, 3);
    expect(speedNeeded(2, FIRST_CYCLE_AV)).toBeCloseTo(133.3333, 3);
    expect(speedNeeded(3, FIRST_CYCLE_AV)).toBe(200);
    expect(speedNeeded(4, FIRST_CYCLE_AV)).toBeCloseTo(266.6667, 3);
  });

  it('两轮预算 250：2 / 4 / 6 动 → 80 / 160 / 240', () => {
    expect(speedNeeded(2, 250)).toBe(80);
    expect(speedNeeded(4, 250)).toBe(160);
    expect(speedNeeded(6, 250)).toBe(240);
  });

  it('turnsInBudget 返回整数行动次数（floor），除零与边界安全', () => {
    expect(turnsInBudget(100, CYCLE_AV)).toBe(1);
    expect(turnsInBudget(134, FIRST_CYCLE_AV)).toBe(2);
    expect(turnsInBudget(speedNeeded(2, FIRST_CYCLE_AV), FIRST_CYCLE_AV)).toBe(2);
    expect(turnsInBudget(speedNeeded(4, 250), 250)).toBe(4);
    expect(turnsInBudget(999, CYCLE_AV)).toBe(9);
    expect(turnsInBudget(1, FIRST_CYCLE_AV)).toBe(0);
    expect(turnsInBudget(0, 150)).toBe(0);
    expect(turnsInBudget(100, 0)).toBe(0);
    expect(speedNeeded(2, 0)).toBe(0);
    expect(Number.isInteger(turnsInBudget(133, FIRST_CYCLE_AV))).toBe(true);
  });

  it('速度阈值常量复用 constants，不重复定义数值', () => {
    expect(FIRST_CYCLE_AV).toBe(FIRST_CYCLE_ACTION_VALUE);
    expect(CYCLE_AV).toBe(CYCLE_ACTION_VALUE);
  });

  it('破韧 = 基础破韧 × (1 + 弱点击破效率)', () => {
    expect(breakToughness(60)).toBe(60);
    expect(breakToughness(60, 0.5)).toBe(90);
    expect(breakToughness(60, 1.5)).toBe(150);
    expect(breakToughness(0, 1)).toBe(0);
  });
});

describe('命中与治疗 / 护盾', () => {
  it('效果命中概率 = 基础 × (1+效果命中) × (1-效果抵抗) × (1-特定抵抗)', () => {
    expect(effectChance({ base: 1 })).toBe(1);
    expect(r(effectChance({ base: 0.8, effectHit: 0.3, effectRes: 0.2, specificResist: 0.1 }))).toBe(0.7488);
    expect(r(effectChance({ base: 0.5, effectHit: 1 }))).toBe(1);
    expect(effectChance({ base: 0 })).toBe(0);
  });

  it('基础概率 >100% 不被中间截断，只在最终结果钳到 1', () => {
    expect(r(effectChance({ base: 1.2, effectRes: 0.5 }))).toBe(0.6);
    expect(r(effectChance({ base: 1.2, effectHit: 0.5, effectRes: 0.1 }))).toBe(1);
    expect(effectChance({ base: 1.2 })).toBe(1);
  });

  it('治疗量 = (倍率×属性+固定值) × (1+Σ加成) × (1-Σ降低)', () => {
    expect(r(healAmount({ stat: 1000, multiplier: 0.1, flat: 50, bonus: [0.2, 0.1], reduce: [0.15] }))).toBe(165.75);
    expect(
      r(healAmount({ stat: 5165, multiplier: 0.0975, flat: 218.4, bonus: [0.23, 0.1, 0.12], reduce: [0.15] })),
    ).toBeCloseTo(889.85, 2);
    expect(healAmount({ stat: 1000, multiplier: 0.1, reduce: [3] })).toBe(0);
  });

  it('护盾量 = (倍率×属性+固定值) × (1+Σ护盾提高+Σ获得护盾提高)', () => {
    expect(
      r(shieldAmount({ stat: 1751, multiplier: 0.513, flat: 631.75, shieldBonus: [0.2] })),
    ).toBeCloseTo(1836.02, 2);
    expect(
      shieldAmount({ stat: 800, multiplier: 0.6, flat: 100, shieldBonus: [0.2], shieldGain: [0.1] }),
    ).toBeCloseTo(754, 9);
  });
});
