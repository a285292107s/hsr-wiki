import { describe, expect, it } from 'vitest';
import { monsterMaxLevel, monsterStatAt, type MonsterLevelCurve } from '../monster-stats';

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
