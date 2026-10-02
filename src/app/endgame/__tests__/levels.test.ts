import { describe, it, expect } from 'vitest';
import {
  buildLevelTabs, defaultLevelKey, isLevelMode, levelTabFloor,
} from '../levels';
import type { MazeListEntry } from '../../../services/types';

const floors = [1, 2, 3, 4].map((floor) => ({ floor, level: 50 + floor * 10 }));

describe('buildLevelTabs 层级模式子 tab 清单', () => {
  it('1..N 层升序，星启模式排在末位', () => {
    const data = { id: '3020', zh: '仙客天狼', floor_details: floors, tierce: { id: 30205 } } as MazeListEntry;
    expect(buildLevelTabs(data).map((t) => [t.key, t.kind, t.label])).toEqual([
      ['floor-1', 'floor', '第 1 层'],
      ['floor-2', 'floor', '第 2 层'],
      ['floor-3', 'floor', '第 3 层'],
      ['floor-4', 'floor', '第 4 层'],
      ['tierce', 'tierce', '星启模式'],
    ]);
  });

  it('不含星启的赛季只有层级 tab；层序与源数据顺序无关', () => {
    const data = { id: '3001', zh: '冽风骑士', floor_details: [...floors].reverse() } as MazeListEntry;
    expect(buildLevelTabs(data).map((t) => t.key)).toEqual(['floor-1', 'floor-2', 'floor-3', 'floor-4']);
  });

  it('忘却之庭 / 虚构叙事与末日幻影同构：层 tab 清单只看 floor_details 与 tierce', () => {
    const maze = {
      id: '1036', zh: '物竞天择', countdown: 30,
      floor_details: [...floors, { floor: 5 }, { floor: 6 }, { floor: 7 }],
      tierce: { id: 103605 },
    } as MazeListEntry;
    expect(buildLevelTabs(maze).map((t) => t.key)).toEqual([
      'floor-1', 'floor-2', 'floor-3', 'floor-4', 'floor-5', 'floor-6', 'floor-7', 'tierce',
    ]);
  });

  it('无数据/无关卡时不产生 tab', () => {
    expect(buildLevelTabs(null)).toEqual([]);
    expect(buildLevelTabs({ id: '3001', zh: '冽风骑士' } as MazeListEntry)).toEqual([]);
  });
});

describe('defaultLevelKey 默认激活的子 tab', () => {
  it('含星启的赛季默认星启，不含星启的赛季退回第 1 层', () => {
    const withTierce = { id: '3020', zh: '仙客天狼', floor_details: floors, tierce: { id: 30205 } } as MazeListEntry;
    expect(defaultLevelKey(buildLevelTabs(withTierce))).toBe('tierce');
    const noTierce = { id: '3001', zh: '冽风骑士', floor_details: floors } as MazeListEntry;
    expect(defaultLevelKey(buildLevelTabs(noTierce))).toBe('floor-1');
  });

  it('无 tab 时空串（页面不渲染子 tab 行）', () => {
    expect(defaultLevelKey([])).toBe('');
  });
});

describe('levelTabFloor 子 tab → 层级详情', () => {
  const data = { id: '3020', zh: '仙客天狼', floor_details: floors } as MazeListEntry;

  it('层级 key 命中对应层；星启 key 与缺层返回 null', () => {
    expect(levelTabFloor(data, 'floor-3')?.floor).toBe(3);
    expect(levelTabFloor(data, 'tierce')).toBeNull();
    expect(levelTabFloor(data, 'floor-9')).toBeNull();
    expect(levelTabFloor(null, 'floor-1')).toBeNull();
  });
});

describe('isLevelMode 层级模式判据', () => {
  it('忘却之庭 / 虚构叙事 / 末日幻影走子 tab，异相仲裁仍走区块导航', () => {
    expect(['maze', 'story', 'boss'].map(isLevelMode)).toEqual([true, true, true]);
    expect(isLevelMode('peak')).toBe(false);
  });
});