import { describe, expect, it } from 'vitest';
import {
  areaPath,
  barLength,
  clamp,
  linePath,
  linearScale,
  niceTicks,
} from '../chart';

describe('linearScale', () => {
  it('线性映射端点与中点', () => {
    const scale = linearScale(0, 100, 0, 640);
    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(320);
    expect(scale(100)).toBe(640);
    expect(scale(150)).toBe(960);
  });

  it('逆向映射与退化定义域不产 NaN', () => {
    const inverted = linearScale(50, 300, 220, 0);
    expect(inverted(50)).toBe(220);
    expect(inverted(300)).toBe(0);
    const degenerate = linearScale(5, 5, 0, 100);
    expect(Number.isFinite(degenerate(5))).toBe(true);
    expect(degenerate(5)).toBe(0);
  });
});

describe('clamp / barLength', () => {
  it('钳到闭区间，lo/hi 顺序任意，非有限值落到下限', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(0.5, 1, 0)).toBe(0.5);
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp(Number.POSITIVE_INFINITY, 0, 1)).toBe(1);
  });

  it('条长 = value / max 且钳到 0..1', () => {
    expect(barLength(50, 100)).toBe(0.5);
    expect(barLength(150, 100)).toBe(1);
    expect(barLength(-5, 100)).toBe(0);
    expect(barLength(5, 0)).toBe(0);
    expect(barLength(Number.NaN, 100)).toBe(0);
  });
});

describe('niceTicks', () => {
  it('整数区间给出均匀刻度且覆盖端点', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(-1, 1, 5)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });

  it('刻度密度 count-1..count+1，末刻度覆盖 max、首刻度覆盖 min', () => {
    const cases: [number, number, number][] = [
      [0, 2400, 4],
      [0, 4500, 4],
      [0, 1058.4, 4],
      [0, 100, 5],
      [0, 3, 5],
      [0.476, 0.588, 5],
      [-3, 7, 4],
      [1, 3, 5],
      [0, 1, 5],
      [-100, 90, 5],
    ];
    for (const [min, max, count] of cases) {
      const ticks = niceTicks(min, max, count);
      expect(ticks.length).toBeGreaterThanOrEqual(count - 1);
      expect(ticks.length).toBeLessThanOrEqual(count + 1);
      expect(ticks[0]).toBeLessThanOrEqual(min);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
      for (let index = 1; index < ticks.length; index += 1) {
        expect(ticks[index]).toBeGreaterThan(ticks[index - 1]);
      }
    }
  });

  it('0..2400 / 0..4500 在 count 4 下不再只得 2 个刻度', () => {
    expect(niceTicks(0, 2400, 4)).toEqual([0, 1000, 2000, 3000]);
    expect(niceTicks(0, 4500, 4)).toEqual([0, 2000, 4000, 6000]);
  });

  it('小数区间不产浮点噪声', () => {
    const ticks = niceTicks(0.1, 0.2, 5);
    expect(ticks[0]).toBe(0.1);
    expect(ticks[ticks.length - 1]).toBe(0.2);
    expect(ticks.every((tick) => Number.isFinite(tick))).toBe(true);
  });

  it('退化与非有限输入安全', () => {
    expect(niceTicks(3, 3)).toEqual([3]);
    expect(niceTicks(Number.NaN, 1)).toEqual([]);
    expect(niceTicks(0, Number.POSITIVE_INFINITY)).toEqual([]);
  });
});

describe('linePath / areaPath', () => {
  it('空数组返回空串', () => {
    expect(linePath([])).toBe('');
    expect(areaPath([], 100)).toBe('');
  });

  it('折线路径按 M/L 连接', () => {
    expect(linePath([{ x: 0, y: 0 }, { x: 10, y: 10 }])).toBe('M0 0 L10 10');
  });

  it('跳过非有限点，输出永不含 NaN', () => {
    const path = linePath([
      { x: 0, y: 0 },
      { x: Number.NaN, y: 10 },
      { x: 5, y: Number.NaN },
      { x: 10, y: 10 },
    ]);
    expect(path).toBe('M0 0 L10 10');
    expect(path.includes('NaN')).toBe(false);
    expect(linePath([{ x: Number.POSITIVE_INFINITY, y: 1 }])).toBe('');
  });

  it('面积路径闭合到底边', () => {
    expect(areaPath([{ x: 0, y: 0 }, { x: 10, y: 10 }], 100)).toBe('M0 0 L10 10 L10 100 L0 100 Z');
  });
});
