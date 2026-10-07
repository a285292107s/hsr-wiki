// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildLevelTabs, defaultLevelKey, levelTabFloor, levelTabPeak,
} from '../levels';
import type { MazeListEntry } from '../../../services/types';

const floors = [1, 2, 3, 4].map((floor) => ({ floor, level: 50 + floor * 10 }));

describe('buildLevelTabs 关卡子 tab 清单', () => {
  it('星启模式排在最前，层级倒序（第 N..1 层）', () => {
    const data = { id: '3020', zh: '仙客天狼', floor_details: floors, tierce: { id: 30205 } } as MazeListEntry;
    expect(buildLevelTabs(data).map((t) => [t.key, t.kind, t.label])).toEqual([
      ['tierce', 'tierce', '星启模式'],
      ['floor-4', 'floor', '第 4 层'],
      ['floor-3', 'floor', '第 3 层'],
      ['floor-2', 'floor', '第 2 层'],
      ['floor-1', 'floor', '第 1 层'],
    ]);
  });

  it('不含星启的赛季只有层级 tab，同样倒序；层序与源数据顺序无关', () => {
    const data = { id: '3001', zh: '冽风骑士', floor_details: [...floors].reverse() } as MazeListEntry;
    expect(buildLevelTabs(data).map((t) => t.key)).toEqual(['floor-4', 'floor-3', 'floor-2', 'floor-1']);
  });

  it('忘却之庭 / 虚构叙事与末日幻影同构：层 tab 清单只看 floor_details 与 tierce', () => {
    const maze = {
      id: '1036', zh: '物竞天择', countdown: 30,
      floor_details: [...floors, { floor: 5 }, { floor: 6 }, { floor: 7 }],
      tierce: { id: 103605 },
    } as MazeListEntry;
    expect(buildLevelTabs(maze).map((t) => t.key)).toEqual([
      'tierce', 'floor-7', 'floor-6', 'floor-5', 'floor-4', 'floor-3', 'floor-2', 'floor-1',
    ]);
  });

  it('异相仲裁：3 骑士试炼 + 1 王棋最终关，tab 名即官方关卡名、倒序（王棋在最前）', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [
        { id: 901, kind: 'knight', name: '骑士（一）' },
        { id: 902, kind: 'knight', name: '骑士（二）' },
        { id: 903, kind: 'knight', name: '骑士（三）' },
        { id: 904, kind: 'king', name: '将杀王棋' },
      ],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.kind, t.label, t.peakId])).toEqual([
      ['peak-904', 'peak', '将杀王棋', 904],
      ['peak-903', 'peak', '骑士（三）', 903],
      ['peak-902', 'peak', '骑士（二）', 902],
      ['peak-901', 'peak', '骑士（一）', 901],
    ]);
  });

  it('无 id 的单关：key/label 的缺省回退按源序推导，不随倒序漂移', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [{ kind: 'knight', name: '骑士（一）' }, { kind: 'king' }],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.label])).toEqual([
      ['peak-2', '关卡 2'],
      ['peak-1', '骑士（一）'],
    ]);
  });

  it('无数据/无关卡时不产生 tab', () => {
    expect(buildLevelTabs(null)).toEqual([]);
    expect(buildLevelTabs({ id: '3001', zh: '冽风骑士' } as MazeListEntry)).toEqual([]);
  });
});

describe('defaultLevelKey 默认激活的子 tab', () => {
  it('含星启的赛季默认星启；不含星启的赛季（含全部异相仲裁期）退回清单首位（该模式最高关）', () => {
    const withTierce = { id: '3020', zh: '仙客天狼', floor_details: floors, tierce: { id: 30205 } } as MazeListEntry;
    expect(defaultLevelKey(buildLevelTabs(withTierce))).toBe('tierce');
    const noTierce = { id: '3001', zh: '冽风骑士', floor_details: floors } as MazeListEntry;
    expect(defaultLevelKey(buildLevelTabs(noTierce))).toBe('floor-4');
    const peak = {
      id: '9', zh: '军团再临',
      levels: [{ id: 901, kind: 'knight', name: '骑士（一）' }, { id: 904, kind: 'king', name: '将杀王棋' }],
    } as MazeListEntry;
    expect(defaultLevelKey(buildLevelTabs(peak))).toBe('peak-904');
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

describe('levelTabPeak 子 tab → 异相仲裁单关', () => {
  const data = {
    id: '9', zh: '军团再临',
    levels: [{ id: 901, kind: 'knight', name: '骑士（一）' }, { id: 904, kind: 'king', name: '将杀王棋' }],
  } as MazeListEntry;

  it('单关 key 命中对应关；层级 key 与缺关返回 null', () => {
    expect(levelTabPeak(data, 'peak-904')?.kind).toBe('king');
    expect(levelTabPeak(data, 'peak-901')?.name).toBe('骑士（一）');
    expect(levelTabPeak(data, 'floor-1')).toBeNull();
    expect(levelTabPeak(data, 'peak-999')).toBeNull();
    expect(levelTabPeak(null, 'peak-901')).toBeNull();
  });
});