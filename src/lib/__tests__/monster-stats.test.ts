import { describe, expect, it } from 'vitest';
import {
  monsterEliteRatiosProduct,
  monsterMaxLevel,
  monsterStanceBreakdown,
  monsterStanceValue,
  monsterStatAt,
  monsterStatBreakdown,
  type MonsterLevelCurve,
} from '../monster-stats';

const CURVE: MonsterLevelCurve = {
  '1': {
    '1': { hp: 0.8, atk: 0.64, def: 1, speed: 1 },
    '80': { hp: 148.01102, atk: 30.684488, def: 4.761905, speed: 1.2 },
    '100': { hp: 363.84018, atk: 40, def: 5.7142857, speed: 1.43 },
  },
};

const DETAIL = {
  stats: { hp: 69.75, atk: 18, def: 210, speed: 100 },
  statRatio: { hp: 1, atk: 1, def: 1, speed: 1 },
  levelGroup: 1,
  curve: CURVE,
};

const r1 = (n: number): number => Math.round(n * 10) / 10;

describe('monsterStatAt', () => {
  it('基准 × 曲线（难度组 1）', () => {
    expect(monsterStatAt('hp', 80, DETAIL)).toBe(r1(69.75 * 148.01102));
    expect(monsterStatAt('atk', 1, DETAIL)).toBe(11.5);
  });

  it('维度修饰比参与合成（0.266667 = 弱体档位）', () => {
    const weak = { ...DETAIL, statRatio: { hp: 0.266667 } };
    expect(monsterStatAt('hp', 80, weak)).toBe(r1(69.75 * 0.266667 * 148.01102));
    expect(monsterStatAt('atk', 80, weak)).toBe(r1(18 * 30.684488));
  });

  it('难度组缺位 / 曲线缺组 → 返回 null（调用方降级，不假数值）', () => {
    expect(monsterStatAt('hp', 80, { ...DETAIL, levelGroup: 4 })).toBeNull();
    expect(monsterStatAt('hp', 80, { ...DETAIL, curve: {} })).toBeNull();
    expect(monsterStatAt('hp', 80, { ...DETAIL, curve: null })).toBeNull();
  });

  it('基准缺位 / 非数值基准 → null', () => {
    expect(monsterStatAt('hp', 80, { ...DETAIL, stats: { hp: null, atk: 1, def: 1, speed: 1 } })).toBeNull();
  });

  it('超出该组曲线范围的等级 → null（滑条上限用 monsterMaxLevel 控制）', () => {
    expect(monsterStatAt('hp', 79, DETAIL)).toBeNull();
    expect(monsterStatAt('hp', 100, DETAIL)).not.toBeNull();
  });
});

describe('monsterMaxLevel', () => {
  it('取该组曲线最高等级；组缺位 → 0', () => {
    expect(monsterMaxLevel(CURVE, '1')).toBe(100);
    expect(monsterMaxLevel(CURVE, '9')).toBe(0);
    expect(monsterMaxLevel(null, '1')).toBe(0);
  });
});

describe('实例修正值（ADR 0045）', () => {
  it('速度：基准 × 曲线 **+ 修正值**（加在最后，不被曲线缩放）', () => {
    const speed = { ...DETAIL, modify: { speed: -44 } };
    expect(monsterStatAt('speed', 100, speed)).toBe(r1(100 * 1.43 - 44));
    expect(monsterStatAt('speed', 100, speed)).not.toBe(r1((100 - 44) * 1.43));
  });

  it('未声明修正的维度不受影响；修正为 0 与缺位等价', () => {
    expect(monsterStatAt('hp', 100, { ...DETAIL, modify: { speed: -44 } })).toBe(r1(69.75 * 363.84018));
    expect(monsterStatAt('speed', 100, { ...DETAIL, modify: { speed: 0 } })).toBe(r1(100 * 1.43));
    expect(monsterStatAt('speed', 100, DETAIL)).toBe(r1(100 * 1.43));
  });

  it('修正值非数值 → 按 0（不静默把字段变成 NaN）', () => {
    expect(monsterStatAt('speed', 100, { ...DETAIL, modify: { speed: Number.NaN } })).toBe(r1(100 * 1.43));
  });
});

describe('精英组倍率（ADR 0049）', () => {
  const CURVE95: MonsterLevelCurve = {
    '1': { '95': { hp: 294.42172, atk: 39.889835, def: 5.47619, speed: 1.32 } },
  };
  const GEPARD_SOLDIER = {
    stats: { hp: 102.3, atk: 18, def: 210, speed: 100 },
    statRatio: null,
    levelGroup: 1,
    curve: CURVE95,
    eliteRatios: { hp: 1.7, atk: 0.8 } as const,
  };

  it('精英组倍率参与合成（组 2 = HP×1.7 / ATK×0.8；防御/速度倍率为 1 不变）', () => {
    expect(monsterStatAt('hp', 95, GEPARD_SOLDIER)).toBe(r1(102.3 * 1.7 * 294.42172));
    expect(monsterStatAt('atk', 95, GEPARD_SOLDIER)).toBe(r1(18 * 0.8 * 39.889835));
    expect(monsterStatAt('def', 95, GEPARD_SOLDIER)).toBe(r1(210 * 5.47619));
    expect(monsterStatAt('speed', 95, GEPARD_SOLDIER)).toBe(r1(100 * 1.32));
  });

  it('缺组 / 缺行 → 中性 1（与不传 eliteRatios 等价，2722 条里 2695 条组 1 数值不变）', () => {
    const noElite = { ...GEPARD_SOLDIER, eliteRatios: undefined };
    expect(monsterStatAt('hp', 95, { ...GEPARD_SOLDIER, eliteRatios: null })).toBe(monsterStatAt('hp', 95, noElite));
    expect(monsterStatAt('hp', 95, noElite)).toBe(r1(102.3 * 294.42172));
  });

  it('修正值仍在曲线之后（精英组倍率不吞掉修正值位置）', () => {
    const withModify = { ...GEPARD_SOLDIER, modify: { speed: -44 } };
    expect(monsterStatAt('speed', 95, withModify)).toBe(r1(100 * 1.32 - 44));
  });

  it('Π 精英组叠乘：自身组 × 关卡组，缺位维度按中性 1，整行缺位不参与', () => {
    expect(monsterEliteRatiosProduct({ hp: 2 }, { hp: 3, atk: 0.5 })).toEqual({ hp: 6, atk: 0.5 });
    expect(monsterEliteRatiosProduct(null, { atk: 0.8 })).toEqual({ atk: 0.8 });
    expect(monsterEliteRatiosProduct()).toEqual({});
  });

  it('Π 关卡精英组：自身组 × 关卡组，与转换器侧字面量同值（ADR 0055）', () => {
    const stage = {
      stats: { hp: 102.3, atk: 18, def: 210, speed: 100 },
      statRatio: null,
      levelGroup: 3,
      curve: { '3': { '95': { hp: 294.42172, atk: 1, def: 1, speed: 1 } } },
      eliteRatios: monsterEliteRatiosProduct({ hp: 1.7 }, { hp: 6.5 }),
    };
    expect(monsterStatAt('hp', 95, stage)).toBe(332818.7);
  });

  it('韧性：基准 × 精英组韧性倍率 + 修正值（缺位按 1；当前被怪物引用的组韧性倍率全 1）', () => {
    expect(monsterStanceValue(60, null, 1)).toBe(60);
    expect(monsterStanceValue(60, null, 2)).toBe(120);
    expect(monsterStanceValue(60, 30, 1)).toBe(90);
    expect(monsterStanceValue(60, null, null)).toBe(60);
    expect(monsterStanceValue(60, null, Number.NaN)).toBe(60);
  });
});

describe('monsterStanceValue', () => {
  it('韧性不入曲线链：只有「基准 + 修正值」', () => {
    expect(monsterStanceValue(90, 30)).toBe(120);
    expect(monsterStanceValue(360, -120)).toBe(240);
    expect(monsterStanceValue(90)).toBe(90);
    expect(monsterStanceValue(90, null)).toBe(90);
  });

  it('基准缺位 → null（调用方降级，不假数值）', () => {
    expect(monsterStanceValue(null, 30)).toBeNull();
    expect(monsterStanceValue(undefined, 30)).toBeNull();
  });
});

describe('monsterStatBreakdown', () => {
  const CURVE95: MonsterLevelCurve = {
    '1': { '95': { hp: 294.42172, atk: 39.889835, def: 5.47619, speed: 1.32 } },
  };
  const ELITE2 = {
    stats: { hp: 102.3, atk: 18, def: 210, speed: 100 },
    statRatio: null,
    levelGroup: 1,
    curve: CURVE95,
    eliteRatios: { hp: 1.7, atk: 0.8 } as const,
  };

  it('逐因子与最终值同源：基准 / 修饰比 / 精英倍率 / 曲线 / 修正', () => {
    expect(monsterStatBreakdown('hp', 95, ELITE2)).toEqual({
      base: 102.3,
      statRatio: 1,
      eliteRatio: 1.7,
      curve: 294.42172,
      modify: null,
      value: r1(102.3 * 1.7 * 294.42172),
    });
    expect(monsterStatBreakdown('atk', 95, ELITE2).eliteRatio).toBe(0.8);
    expect(monsterStatBreakdown('def', 95, ELITE2)).toMatchObject({ eliteRatio: 1, curve: 5.47619 });
  });

  it('修正值单列输出（不被曲线/倍率缩放），最终值与 monsterStatAt 一致', () => {
    const modified = { ...DETAIL, modify: { speed: -44 } };
    expect(monsterStatBreakdown('speed', 100, modified)).toEqual({
      base: 100,
      statRatio: 1,
      eliteRatio: 1,
      curve: 1.43,
      modify: -44,
      value: r1(100 * 1.43 - 44),
    });
    expect(monsterStatBreakdown('speed', 100, modified).value).toBe(monsterStatAt('speed', 100, modified));
  });

  it('曲线缺行时 curve/value 为 null，其余因子仍可展示（降级不假数值）', () => {
    const row = monsterStatBreakdown('hp', 79, DETAIL);
    expect(row.curve).toBeNull();
    expect(row.value).toBeNull();
    expect(row.base).toBe(69.75);
  });

  it('基准缺位 / 非数值基准 → base 与 value 均 null', () => {
    expect(monsterStatBreakdown('hp', 80, { ...DETAIL, stats: { hp: null } })).toMatchObject({
      base: null,
      value: null,
    });
  });
});

describe('monsterStanceBreakdown', () => {
  it('逐因子输出：基准 / 精英组韧性倍率 / 修正，不随等级变化', () => {
    expect(monsterStanceBreakdown(480, null, 1)).toEqual({ base: 480, eliteRatio: 1, modify: null, value: 480 });
    expect(monsterStanceBreakdown(60, 30, 2)).toEqual({ base: 60, eliteRatio: 2, modify: 30, value: 150 });
    expect(monsterStanceBreakdown(90, null, Number.NaN).eliteRatio).toBe(1);
  });

  it('基准缺位 → value null', () => {
    expect(monsterStanceBreakdown(null, 30, 1)).toMatchObject({ base: null, value: null });
  });
});
