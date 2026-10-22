import { describe, expect, it } from 'vitest';
import {
  BREAK_ELEMENT_MULTIPLIER,
  TOUGHNESS_DMG_REDUCTION,
} from '../formula/constants';
import {
  damageChainRows,
  breakBreakdown,
  elationBreakdown,
  trueDamage,
  type BreakElement,
  type BreakInput,
  type ChainRow,
  type ElationInput,
} from '../formula/chains';
import { damageBreakdown, type ZoneKey } from '../formula/damage';
import { defenseZone, enemyDefenseValue } from '../formula/defense';
import { BREAK_BASE, ELATION_BASE, levelBase } from '../formula/tables';

function close(got: number, want: number): void {
  expect(Number.isFinite(got)).toBe(true);
  expect(Math.abs(got - want)).toBeLessThan(1e-9 * Math.max(1, Math.abs(want)));
}

function rowKeys(rows: ChainRow[]): string[] {
  return rows.map((row) => row.key);
}

function rowFactor(rows: ChainRow[], key: string): number | null {
  const row = rows.find((item) => item.key === key);
  expect(row).toBeDefined();
  return row?.factor ?? null;
}

function chainProduct(base: number, rows: ChainRow[]): number {
  return rows.reduce((total, row) => (row.factor == null ? total : total * row.factor), base);
}

const breakInput: BreakInput = {
  level: 80,
  element: 'Physical',
  breakEffect: 2,
  toughness: 60,
  breakBonus: 0,
  vulnerability: 0,
  dmgReduction: 0,
  resistance: 0.2,
  resPenetration: 0,
  defReduction: 0,
  defPenetration: 0,
  swarm: false,
  attackerLevel: 80,
  defenderLevel: 80,
};

const elationInput: ElationInput = {
  level: 80,
  multiplier: 0.2,
  elation: 1.2,
  joke: 60,
  laugh: 0,
  critRate: 0.05,
  critDmg: 0.5,
  vulnerability: 0,
  dmgReduction: 0,
  resistance: 0.2,
  resPenetration: 0,
  defReduction: 0,
  defPenetration: 0,
  swarm: false,
  attackerLevel: 80,
  defenderLevel: 80,
};

describe('等级基数表', () => {
  it('§1.1 六个锁值与表长', () => {
    expect(BREAK_BASE).toHaveLength(80);
    expect(ELATION_BASE).toHaveLength(80);
    expect(BREAK_BASE[0]).toBe(54);
    expect(BREAK_BASE[69]).toBe(2659.6406);
    expect(BREAK_BASE[79]).toBe(3767.5535);
    expect(ELATION_BASE[0]).toBe(108);
    expect(ELATION_BASE[69]).toBe(5319.2812);
    expect(ELATION_BASE[79]).toBe(7535.107);
  });

  it('两表单调递增且无 NaN', () => {
    for (const table of [BREAK_BASE, ELATION_BASE]) {
      for (let index = 0; index < table.length; index += 1) {
        expect(Number.isFinite(table[index])).toBe(true);
        if (index > 0) expect(table[index]).toBeGreaterThan(table[index - 1]);
      }
    }
  });

  it('levelBase 钳到 1..80，非有限值回退末项', () => {
    expect(levelBase(BREAK_BASE, 1)).toBe(54);
    expect(levelBase(BREAK_BASE, 80)).toBe(3767.5535);
    expect(levelBase(BREAK_BASE, 0)).toBe(54);
    expect(levelBase(BREAK_BASE, 200)).toBe(3767.5535);
    expect(levelBase(BREAK_BASE, Number.NaN)).toBe(3767.5535);
    expect(levelBase(ELATION_BASE, Number.POSITIVE_INFINITY)).toBe(7535.107);
    expect(levelBase([], 80)).toBe(0);
  });
});

describe('普通击破', () => {
  it('10 行 key / 顺序 / 系数，末行累计 === total', () => {
    const result = breakBreakdown(breakInput);
    expect(rowKeys(result.rows)).toEqual([
      'breakBase',
      'elementBreak',
      'breakEffect',
      'toughnessLength',
      'breakBonus',
      'vuln',
      'defense',
      'resist',
      'reduce',
      'toughness',
    ]);
    expect(result.rows[0].factor).toBeNull();
    expect(result.base).toBe(3767.5535);
    close(rowFactor(result.rows, 'elementBreak') ?? 0, 2);
    close(rowFactor(result.rows, 'breakEffect') ?? 0, 3);
    close(rowFactor(result.rows, 'toughnessLength') ?? 0, 2);
    close(rowFactor(result.rows, 'breakBonus') ?? 0, 1);
    close(rowFactor(result.rows, 'vuln') ?? 0, 1);
    close(rowFactor(result.rows, 'defense') ?? 0, 0.5);
    close(rowFactor(result.rows, 'resist') ?? 0, 0.8);
    close(rowFactor(result.rows, 'reduce') ?? 0, 1);
    close(rowFactor(result.rows, 'toughness') ?? 0, 0.9);
    close(chainProduct(result.base, result.rows), result.total);
    close(result.total, 3767.5535 * 2 * 3 * 2 * 1 * 1 * 0.5 * 0.8 * 1 * 0.9);
  });

  it('属性击破倍率 7 档（物理/火 2、风 1.5、冰/雷 1、量子/虚数 0.5）', () => {
    const entries = Object.entries(BREAK_ELEMENT_MULTIPLIER) as [BreakElement, number][];
    expect(entries).toHaveLength(7);
    for (const [element, multiplier] of entries) {
      const result = breakBreakdown({ ...breakInput, element });
      close(rowFactor(result.rows, 'elementBreak') ?? 0, multiplier);
    }
  });

  it('吃击破增伤、不吃增伤/攻击力：改 dmgBonus 与 stat 不影响 total', () => {
    const boosted = breakBreakdown({ ...breakInput, breakBonus: 0.5 });
    close(boosted.total, breakBreakdown(breakInput).total * 1.5);
    const noisy = Object.assign({}, breakInput, { dmgBonus: 3, stat: 5000, bonus: 2 });
    close(breakBreakdown(noisy).total, breakBreakdown(breakInput).total);
  });

  it('韧性 0 → 长度系数 (0+2)/4 = 0.5，不除零；韧性减伤恒 0.9', () => {
    const zero = breakBreakdown({ ...breakInput, toughness: 0 });
    close(zero.lengthZone, 0.5);
    close(zero.toughnessZone, 1 - TOUGHNESS_DMG_REDUCTION);
    close(zero.total, 3767.5535 * 2 * 3 * 0.5 * 0.5 * 0.8 * 0.9);
    expect(Number.isFinite(zero.total)).toBe(true);
    expect(zero.rows.some((row) => row.key === 'crit')).toBe(false);
  });

  it('易伤 3.5 / 减伤 0.01 / 抗性 -100%~90% 钳制与防御区复用', () => {
    const capped = breakBreakdown({
      ...breakInput,
      vulnerability: 10,
      dmgReduction: 5,
      resistance: 2,
    });
    close(capped.vulnerabilityZone, 3.5);
    close(capped.reductionZone, 0.01);
    close(capped.resistanceZone, 0.1);
    close(
      breakBreakdown({ ...breakInput, resistance: -1 }).resistanceZone,
      2,
    );
    const pierced = breakBreakdown({ ...breakInput, defReduction: 0.3, defPenetration: 0.1 });
    close(
      pierced.defenseZone,
      defenseZone(80, enemyDefenseValue(80, { defReduction: 0.3, defPenetration: 0.1 })),
    );
    close(breakBreakdown({ ...breakInput, swarm: true }).defenseZone, defenseZone(80, 1500));
  });

  it('等级 0 / NaN / 200 钳到表内', () => {
    close(breakBreakdown({ ...breakInput, level: 0 }).base, 54);
    close(breakBreakdown({ ...breakInput, level: Number.NaN }).base, 3767.5535);
    close(breakBreakdown({ ...breakInput, level: 200 }).base, 3767.5535);
    close(breakBreakdown({ ...breakInput, level: 70 }).base, 2659.6406);
  });
});

describe('超击破', () => {
  const superInput: BreakInput = {
    ...breakInput,
    superBreak: true,
    superToughness: 20,
    superBreakBonus: 0,
  };

  it('基数 ÷10、韧性区恒 1、10 行 key 与 total', () => {
    const result = breakBreakdown(superInput);
    close(result.base, 376.75535);
    close(result.toughnessZone, 1);
    close(rowFactor(result.rows, 'toughness') ?? 0, 1);
    close(rowFactor(result.rows, 'elementBreak') ?? 0, 1);
    close(rowFactor(result.rows, 'superToughness') ?? 0, 20);
    close(rowFactor(result.rows, 'superBonus') ?? 0, 1);
    expect(rowKeys(result.rows)).toEqual([
      'breakBase',
      'elementBreak',
      'breakEffect',
      'superToughness',
      'superBonus',
      'vuln',
      'defense',
      'resist',
      'reduce',
      'toughness',
    ]);
    close(chainProduct(result.base, result.rows), result.total);
    close(result.total, (3767.5535 / 10) * 1 * 3 * 20 * 1 * 1 * 0.5 * 0.8 * 1 * 1);
  });

  it('削韧 0 → total 0 且无 NaN；超击破提高单独生效', () => {
    const zero = breakBreakdown({ ...superInput, superToughness: 0 });
    expect(zero.total).toBe(0);
    expect(Number.isFinite(zero.total)).toBe(true);
    const boosted = breakBreakdown({ ...superInput, superBreakBonus: 1 });
    close(boosted.total, breakBreakdown(superInput).total * 2);
  });

  it('与普通击破互斥：普通链路忽略 superToughness/superBreakBonus，超击破忽略 breakBonus/toughness 长度', () => {
    const normal = breakBreakdown({
      ...breakInput,
      superToughness: 99,
      superBreakBonus: 5,
      breakBonus: 0,
    });
    close(normal.total, breakBreakdown(breakInput).total);
    const superIgnoring = breakBreakdown({
      ...superInput,
      breakBonus: 5,
      toughness: 360,
    });
    close(superIgnoring.total, breakBreakdown(superInput).total);
  });
});

describe('欢愉伤害', () => {
  it('11 行 key / 顺序 / 系数，末行累计 === total（暴击口径）', () => {
    const result = elationBreakdown(elationInput);
    expect(rowKeys(result.rows)).toEqual([
      'elationBase',
      'elationMultiplier',
      'elationDegree',
      'joke',
      'crit',
      'laugh',
      'vuln',
      'resist',
      'toughness',
      'defense',
      'reduce',
    ]);
    expect(result.rows[0].factor).toBeNull();
    close(result.base, 7535.107);
    close(result.multiplierZone, 0.2);
    close(result.elationZone, 2.2);
    close(result.jokeZone, 1 + (2 * 60) / 242);
    close(result.critZone, 1.5);
    close(result.critExpectedZone, 1.025);
    close(chainProduct(result.base, result.rows), result.total);
    close(
      result.total,
      7535.107 * 0.2 * 2.2 * (1 + (2 * 60) / 242) * 1.5 * 1 * 1 * 0.8 * 0.9 * 0.5 * 1,
    );
    close(
      result.expectedTotal,
      7535.107 * 0.2 * 2.2 * (1 + (2 * 60) / 242) * 1.025 * 1 * 1 * 0.8 * 0.9 * 0.5 * 1,
    );
  });

  it('不吃攻击力与增伤：额外 dmgBonus / stat / 属性增伤字段不改变 total', () => {
    const baseline = elationBreakdown(elationInput);
    const noisy = Object.assign({}, elationInput, {
      dmgBonus: 3,
      stat: 5000,
      elementBonus: 1.5,
      attackTypeBonus: 0.8,
    });
    close(elationBreakdown(noisy).total, baseline.total);
    close(elationBreakdown(noisy).expectedTotal, baseline.expectedTotal);
    const vulnerable = elationBreakdown({ ...elationInput, vulnerability: 1 });
    close(vulnerable.total, baseline.total * 2);
  });

  it('笑点区：好活 0/负数 → 1，240 → ≈2.98，5 → ≈1.04', () => {
    close(elationBreakdown({ ...elationInput, joke: 0 }).jokeZone, 1);
    close(elationBreakdown({ ...elationInput, joke: -50 }).jokeZone, 1);
    close(elationBreakdown({ ...elationInput, joke: 240 }).jokeZone, 1 + 480 / 242);
    close(elationBreakdown({ ...elationInput, joke: 5 }).jokeZone, 1 + 10 / 242);
  });

  it('暴击区：期望 = 1 + 暴击率 × 暴伤，rows 用暴击实际值', () => {
    const noCrit = elationBreakdown({ ...elationInput, critRate: 0 });
    close(noCrit.critExpectedZone, 1);
    close(noCrit.expectedTotal, noCrit.total / 1.5);
    const fullCrit = elationBreakdown({ ...elationInput, critRate: 1, critDmg: 2 });
    close(fullCrit.critZone, 3);
    close(fullCrit.critExpectedZone, 3);
    close(fullCrit.expectedTotal, fullCrit.total);
  });

  it('等级 0 / NaN / 200 钳到表内；易伤/减伤钳制同直伤口径', () => {
    close(elationBreakdown({ ...elationInput, level: 0 }).base, 108);
    close(elationBreakdown({ ...elationInput, level: Number.NaN }).base, 7535.107);
    close(elationBreakdown({ ...elationInput, level: 200 }).base, 7535.107);
    const capped = elationBreakdown({ ...elationInput, vulnerability: 10, dmgReduction: 5 });
    close(capped.vulnerabilityZone, 3.5);
    close(capped.reductionZone, 0.01);
  });
});

describe('真实伤害', () => {
  it('真实伤害 = 原伤害 × 比例，最终 = 原伤害 + 附加', () => {
    expect(trueDamage(1000, 0.2)).toEqual({ added: 200, total: 1200 });
    expect(trueDamage(1000, 0)).toEqual({ added: 0, total: 1000 });
    expect(trueDamage(0, 0.5)).toEqual({ added: 0, total: 0 });
  });

  it('比例为 0 / 负数 / NaN，原伤害为 NaN 时不产 NaN 与负数', () => {
    expect(trueDamage(1000, -1)).toEqual({ added: 0, total: 1000 });
    expect(trueDamage(1000, Number.NaN)).toEqual({ added: 0, total: 1000 });
    expect(trueDamage(Number.NaN, 0.5)).toEqual({ added: 0, total: 0 });
  });

  it('独立于任何乘区：只接收原伤害与比例', () => {
    expect(Object.keys(trueDamage(800, 0.25)).sort()).toEqual(['added', 'total']);
    expect(trueDamage(800, 0.25).total - trueDamage(800, 0.25).added).toBe(800);
  });
});

describe('直伤链路行（damageChainRows）', () => {
  const breakdown = damageBreakdown({
    stat: 1000,
    multiplier: 2,
    critRate: 0.5,
    critDmg: 1,
    attackerLevel: 80,
    defenderLevel: 80,
    dmgReduction: 0,
    resistance: 0.2,
    toughnessReduction: 0,
  });

  it('7 行 key 顺序固定，基数为 null，乘积 === 期望伤害 × 韧性系数', () => {
    const rows = damageChainRows(breakdown.zoneValues, 0.9);
    expect(rowKeys(rows)).toEqual([
      'base',
      'modifier',
      'crit',
      'defense',
      'resist',
      'special',
      'toughness',
    ]);
    expect(rows[0].factor).toBeNull();
    close(chainProduct(breakdown.base, rows), breakdown.expectedDamage * 0.9);
    close(chainProduct(breakdown.base, damageChainRows(breakdown.zoneValues, 1)), breakdown.expectedDamage);
  });

  it('韧性系数钳到 0..1，非有限按 1；非有限乘区按中性 1', () => {
    expect(rowFactor(damageChainRows(breakdown.zoneValues, 5), 'toughness')).toBe(1);
    expect(rowFactor(damageChainRows(breakdown.zoneValues, -1), 'toughness')).toBe(0);
    expect(rowFactor(damageChainRows(breakdown.zoneValues, Number.NaN), 'toughness')).toBe(1);
    const fallback = damageChainRows(
      { ...(breakdown.zoneValues as Record<ZoneKey, number>), modifier: Number.NaN },
      1,
    );
    expect(rowFactor(fallback, 'modifier')).toBe(1);
    expect(damageChainRows(breakdown.zoneValues, 0.9).every((row) => Number.isFinite(row.factor ?? 0))).toBe(true);
  });
});
