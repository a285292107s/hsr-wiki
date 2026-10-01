import { describe, it, expect } from 'vitest';
import { bossLevelFloor, buildBossLevelTabs } from '../levels';
import type { MazeListEntry } from '../../../services/types';

const floors = [1, 2, 3, 4].map((floor) => ({ floor, level: 50 + floor * 10 }));

describe('buildBossLevelTabs 末日幻影子 tab 清单', () => {
  it('1..N 层升序，星启模式排在末位', () => {
    const data = { id: '3020', zh: '仙客天狼', floor_details: floors, tierce: { id: 30205 } } as MazeListEntry;
    expect(buildBossLevelTabs(data).map((t) => [t.key, t.kind, t.label])).toEqual([
      ['floor-1', 'floor', '第 1 层'],
      ['floor-2', 'floor', '第 2 层'],
      ['floor-3', 'floor', '第 3 层'],
      ['floor-4', 'floor', '第 4 层'],
      ['tierce', 'tierce', '星启模式'],
    ]);
  });

  it('不含星启的赛季只有层级 tab；层序与源数据顺序无关', () => {
    const data = { id: '3001', zh: '冽风骑士', floor_details: [...floors].reverse() } as MazeListEntry;
    expect(buildBossLevelTabs(data).map((t) => t.key)).toEqual(['floor-1', 'floor-2', 'floor-3', 'floor-4']);
  });

  it('无数据/无关卡时不产生 tab', () => {
    expect(buildBossLevelTabs(null)).toEqual([]);
    expect(buildBossLevelTabs({ id: '3001', zh: '冽风骑士' } as MazeListEntry)).toEqual([]);
  });
});

describe('bossLevelFloor 子 tab → 层级详情', () => {
  const data = { id: '3020', zh: '仙客天狼', floor_details: floors } as MazeListEntry;

  it('层级 key 命中对应层；星启 key 与缺层返回 null', () => {
    expect(bossLevelFloor(data, 'floor-3')?.floor).toBe(3);
    expect(bossLevelFloor(data, 'tierce')).toBeNull();
    expect(bossLevelFloor(data, 'floor-9')).toBeNull();
    expect(bossLevelFloor(null, 'floor-1')).toBeNull();
  });
});
