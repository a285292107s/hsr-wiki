// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  floorPollution, halfLabel, pollutionEntries, pollutionLabel, pollutionPosition,
} from '../pollution';
import { buildEndgameSections, sectionIdxMap } from '../sections';
import type { MazeFloorDetail, MazeListEntry } from '../../../services/types';

function floor(n: number, patch: Partial<MazeFloorDetail> = {}): MazeFloorDetail {
  return { floor: n, name: `层${n}`, stage1: {}, stage2: {}, ...patch };
}

const pollutedFloor = floor(11, {
  stage1: { invasion: { level: 3, stage_id: 30125121 } },
});
const cleanFloor = floor(10);

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

describe('floorPollution', () => {
  it('只取有 invasion 的半场', () => {
    expect(floorPollution(cleanFloor)).toEqual([]);
    expect(floorPollution(pollutedFloor)).toEqual([
      { half: 'stage1', invasion: { level: 3, stage_id: 30125121 }, floor: 11, title: '层11' },
    ]);
  });

  it('同层上下半场都污染时各出一枚', () => {
    const f = floor(4, {
      stage1: { invasion: { level: 2 } },
      stage2: { invasion: { level: 3 } },
    });
    expect(floorPollution(f).map((e) => e.half)).toEqual(['stage1', 'stage2']);
  });
});

describe('pollutionEntries', () => {
  const data = {
    id: '1035',
    zh: '来生泅渡',
    floor_details: [cleanFloor, pollutedFloor],
    pollution: { count: 1, levels: [3] },
  } as MazeListEntry;

  it('层级按详情页展示顺序（高层在前），与下方章节一致', () => {
    expect(pollutionEntries(data).map((e) => e.floor)).toEqual([11]);
  });

  it('汇总层半场 → 异相仲裁单关 → 星启节点', () => {
    const entry = {
      id: '1', zh: '混合',
      floor_details: [pollutedFloor],
      levels: [{ kind: 'knight', name: '骑士（一）', invasion: { level: 2 } }],
      tierce: { id: 9, nodes: [{ idx: 3, origin: 'tierce', monsters: [], invasion: { level: 3 } }] },
    } as MazeListEntry;
    expect(pollutionEntries(entry).map((e) => e.half)).toEqual(['stage1', 'level', 'tierce']);
  });

  it('按 stage_id 去重：星启节点 1/2 与常规末层同关卡不得重复列出', () => {
    const summary = { count: 2, levels: [3] };
    const entry = {
      id: '1', zh: '去重',
      floor_details: [floor(4, { stage1: { invasion: { level: 3, stage_id: 420534 } } })],
      tierce: { id: 9, nodes: [
        { idx: 1, origin: 'stage1', monsters: [], invasion: { level: 3, stage_id: 420534 } },
        { idx: 3, origin: 'tierce', monsters: [], invasion: { level: 3, stage_id: 30126123 } },
      ] },
      pollution: summary,
    } as MazeListEntry;
    const entries = pollutionEntries(entry);
    expect(entries.map((e) => e.half)).toEqual(['stage1', 'tierce']);
    expect(entries.map((e) => e.invasion.stage_id)).toEqual([420534, 30126123]);
    // 与赛季级汇总的计数口径一致（同一 StageID 只算一处）
    expect(entries.length).toBe(summary.count);
  });

  it('无污染数据返回空数组（区块整体不渲染）', () => {
    expect(pollutionEntries(null)).toEqual([]);
    expect(pollutionEntries({ id: '1', zh: 'x' } as MazeListEntry)).toEqual([]);
  });
});

describe('buildEndgameSections 污染等级区块', () => {
  const polluted = { id: '3021', zh: '支配遗忘', pollution: { count: 2, levels: [2, 3] } } as MazeListEntry;
  const clean = { id: '3001', zh: '冽风骑士' } as MazeListEntry;

  it('层级模式：排在赛季增益之后；星启与关卡层级已由子 tab 承载，不进区块导航', () => {
    const data = {
      ...polluted,
      buffs: [{ id: 1, name: '增益' }],
      tierce: { id: 9 },
      floor_details: [cleanFloor],
    } as MazeListEntry;
    expect(buildEndgameSections(data, 'maze', []).map((s) => s.id))
      .toEqual(['buffs', 'pollution']);
    expect(sectionIdxMap(buildEndgameSections(data, 'maze', []))).toMatchObject({
      buffs: '01', pollution: '02',
    });
  });

  it('异相仲裁：排在关卡组成之前（污染等级是本期维度）', () => {
    const levels = [{ kind: 'knight' as const, name: '骑士（一）' }];
    expect(buildEndgameSections(polluted, 'peak', levels).map((s) => s.id))
      .toEqual(['pollution', 'levels']);
  });

  it('无污染赛季不产生该区块', () => {
    expect(buildEndgameSections(clean, 'maze', []).map((s) => s.id))
      .not.toContain('pollution');
    expect(buildEndgameSections(clean, 'peak', [{ kind: 'knight' as const }]).map((s) => s.id))
      .toEqual(['levels']);
  });
});
