// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildLevelTabs, defaultLevelKey, levelTabFloor, levelTabPeakNodes,
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

  it('异相仲裁：只剩两个节点合并档（王棋档打头 + 骑士试炼档），王棋/绝境不再各占一档', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [
        { id: 901, kind: 'knight', name: '骑士（一）' },
        { id: 902, kind: 'knight', name: '骑士（二）' },
        { id: 903, kind: 'knight', name: '骑士（三）' },
        { id: 904, kind: 'king', name: '将杀王棋', hard: { name: '将杀王棋•绝境' } },
      ],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.kind, t.label, t.peakId])).toEqual([
      ['peak-904', 'peakNodes', '将杀王棋', 904],
      ['peak-knights', 'peakNodes', '骑士试炼', undefined],
    ]);
  });

  it('王棋没有绝境变体时仍是一档（节点一即全部）；王棋缺名时回退「关卡 N」', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [
        { id: 901, kind: 'knight', name: '骑士（一）' },
        { id: 904, kind: 'king' },
      ],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.label])).toEqual([
      ['peak-904', '关卡 2'],
      ['peak-knights', '骑士试炼'],
    ]);
  });

  it('王棋缺 id 时 key 按源序推导（不随排序漂移）', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [{ kind: 'knight', name: '骑士（一）' }, { kind: 'king', name: '将杀王棋' }],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.label])).toEqual([
      ['peak-2', '将杀王棋'],
      ['peak-knights', '骑士试炼'],
    ]);
  });

  it('只有骑士关时合并档是唯一 tab（不产生空的王棋档）', () => {
    const peak = {
      id: '9', zh: '军团再临',
      levels: [{ id: 901, kind: 'knight', name: '骑士（一）' }],
    } as MazeListEntry;
    expect(buildLevelTabs(peak).map((t) => [t.key, t.kind, t.label])).toEqual([
      ['peak-knights', 'peakNodes', '骑士试炼'],
    ]);
  });

  it('无数据/无关卡时不产生 tab', () => {
    expect(buildLevelTabs(null)).toEqual([]);
    expect(buildLevelTabs({ id: '3001', zh: '冽风骑士' } as MazeListEntry)).toEqual([]);
  });
});

describe('defaultLevelKey 默认激活的子 tab', () => {
  it('含星启的赛季默认星启；不含星启的赛季（含全部异相仲裁期）退回清单首位（该模式最高一档）', () => {
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

describe('levelTabPeakNodes 合并档 → 节点清单', () => {
  const peak = {
    id: '9', zh: '军团再临',
    levels: [
      { id: 901, kind: 'knight', name: '骑士（一）' },
      { id: 902, kind: 'knight', name: '骑士（二）' },
      { id: 903, kind: 'knight', name: '骑士（三）' },
      { id: 904, kind: 'king', name: '将杀王棋', hard: { name: '将杀王棋•绝境' } },
    ],
  } as MazeListEntry;

  it('王棋档 = 普通难度 / 绝境难度，两节点都指向主关', () => {
    const nodes = levelTabPeakNodes(peak, 'peak-904');
    expect(nodes.map((n) => [n.key, n.label, n.hard, n.level.id])).toEqual([
      ['king', '普通难度', false, 904],
      ['hard', '绝境难度', true, 904],
    ]);
    expect(nodes[1].level).toBe(nodes[0].level);
  });

  it('王棋没有绝境变体时只有普通难度一个节点', () => {
    const noHard = {
      id: '9', zh: '军团再临',
      levels: [{ id: 904, kind: 'king', name: '将杀王棋' }],
    } as MazeListEntry;
    expect(levelTabPeakNodes(noHard, 'peak-904').map((n) => n.key)).toEqual(['king']);
  });

  it('骑士档 = 三关骑士逐关一个节点（key 取关卡 ID、label 取官方关名）', () => {
    expect(levelTabPeakNodes(peak, 'peak-knights').map((n) => [n.key, n.label, n.hard]))
      .toEqual([['901', '骑士（一）', false], ['902', '骑士（二）', false], ['903', '骑士（三）', false]]);
  });

  it('非合并档 key / 缺数据返回空数组（不渲染卡片行）', () => {
    expect(levelTabPeakNodes(peak, 'floor-3')).toEqual([]);
    expect(levelTabPeakNodes(peak, 'peak-999')).toEqual([]);
    expect(levelTabPeakNodes(null, 'peak-knights')).toEqual([]);
    expect(levelTabPeakNodes({ id: '3020', zh: '仙客天狼', floor_details: floors } as MazeListEntry, 'peak-1'))
      .toEqual([]);
  });
});
