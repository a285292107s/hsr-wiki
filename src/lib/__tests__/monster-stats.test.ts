import { describe, expect, it } from 'vitest';
import { monsterMaxLevel, monsterStanceValue, monsterStatAt, type MonsterLevelCurve } from '../monster-stats';

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
    // 未声明的维度回退中性 1
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

/* ADR 0045：实例修正值（`MonsterConfig.{Stance,Speed}ModifyValue`）**加在曲线之后、不再被缩放**。
   算式由参考站逐项反推验证：同族同模板 `144×1.32=190` 带 −44 修正的那一档显示 146
   （若先加减再乘曲线会得到 132），韧性 `90 + 30 = 120`。 */
describe('实例修正值（ADR 0045）', () => {
  it('速度：基准 × 曲线 **+ 修正值**（加在最后，不被曲线缩放）', () => {
    const speed = { ...DETAIL, modify: { speed: -44 } };
    // 100 × 1.43 − 44 = 99（先加会得到 (100−44)×1.43 = 80.1，两者可区分）
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
