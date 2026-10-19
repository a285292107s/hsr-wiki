import { describe, it, expect } from 'vitest';
import { monsterRankKey, propLabel, relicSlotLabel } from '../enum-labels';

describe('enum labels', () => {
  it('propLabel：未加载表时回退 fallback，再退回枚举键', () => {
    expect(propLabel('CriticalChanceBase')).toBe('CriticalChanceBase');
    expect(propLabel('CriticalChanceBase', '暴击率')).toBe('暴击率');
  });

  it('relicSlotLabel：取结构层官方部位名，缺字段时回退枚举键', () => {
    expect(relicSlotLabel({ type: 'HEAD', type_name: '头部' })).toBe('头部');
    expect(relicSlotLabel({ type: 'HEAD' })).toBe('HEAD');
    expect(relicSlotLabel({ type: 'HEAD', type_name: '' })).toBe('HEAD');
  });
});

describe('monsterRankKey', () => {
  it('数据枚举 → 词典键（与词典实际键一致）', () => {
    expect(monsterRankKey('BigBoss')).toBe('monster.rank.boss');
    expect(monsterRankKey('LittleBoss')).toBe('monster.rank.littleBoss');
    expect(monsterRankKey('Elite')).toBe('monster.rank.elite');
    expect(monsterRankKey('Minion')).toBe('monster.rank.minion');
    expect(monsterRankKey('MinionLv2')).toBe('monster.rank.minion');
    expect(monsterRankKey(null)).toBe('monster.rank.minion');
  });
});
