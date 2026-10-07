// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { halfLabel, pollutionLabel, pollutionPosition } from '../pollution';

describe('pollutionLabel / halfLabel', () => {
  it('统一用「污染等级 N」文案', () => {
    expect(pollutionLabel({ level: 2 })).toBe('污染等级 2');
    expect(pollutionLabel(undefined)).toBe('');
    expect(pollutionLabel(null)).toBe('');
  });

  it('半场文案只区分上下半场（层号在楼层头）', () => {
    expect(halfLabel('stage1')).toBe('上半场');
    expect(halfLabel('stage2')).toBe('下半场');
    expect(halfLabel('level')).toBe('');
    expect(halfLabel('tierce')).toBe('');
  });
});

describe('pollutionPosition', () => {
  it('层级 =「第 N 层 · 半场」', () => {
    expect(pollutionPosition({ half: 'stage1', floor: 3 })).toBe('第 3 层 · 上半场');
    expect(pollutionPosition({ half: 'stage2', floor: 11 })).toBe('第 11 层 · 下半场');
  });

  it('异相仲裁 = 关名（缺名回退「关卡」）', () => {
    expect(pollutionPosition({ half: 'level', title: '骑士（二）' })).toBe('骑士（二）');
    expect(pollutionPosition({ half: 'level' })).toBe('关卡');
  });

  it('星启附加关固定文案', () => {
    expect(pollutionPosition({ half: 'tierce' })).toBe('星启附加关');
  });
});
