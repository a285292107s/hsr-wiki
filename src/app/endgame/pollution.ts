import type {
  MazeFloorDetail, MazeListEntry, MazeStageInvasion,
} from '../../services/types';

/** 污染节点在关卡里的位置：上下半场 / 异相仲裁单关 / 星启附加关（见 ADR 0026） */
export type PollutionHalf = 'stage1' | 'stage2' | 'level' | 'tierce';

/** 一个污染节点（层半场 / 异相仲裁单关 / 星启节点） */
export interface PollutionEntry {
  half: PollutionHalf;
  invasion: MazeStageInvasion;
  /** 层序号（层级模式） */
  floor?: number;
  /** 所属节点官方名（层名 / 异相仲裁关名） */
  title?: string;
}

/** 徽标文案：统一用「污染等级 N」（CONTEXT.md 术语，勿简写成侵蚀等级） */
export function pollutionLabel(inv: MazeStageInvasion | undefined | null): string {
  return inv ? `污染等级 ${inv.level}` : '';
}

/** 位置文案入参（专题页的 scopes 与终局节点共用同一套文案，避免两处口径漂移） */
export interface PollutionPos {
  half: string;
  floor?: number;
  title?: string;
}

/** 节点位置文案：层级 =「第 N 层 · 上半场」/ 异相仲裁 = 关名 / 星启 =「星启附加关」 */
export function pollutionPosition(e: PollutionPos): string {
  if (e.half === 'tierce') return '星启附加关';
  if (e.half === 'level') return e.title || '关卡';
  const half = e.half === 'stage1' ? '上半场' : '下半场';
  return e.floor ? `第 ${e.floor} 层 · ${half}` : half;
}

/** 半场文案（层级卡徽标用：层号已在楼层头，此处只区分上下半场） */
export function halfLabel(half: PollutionHalf): string {
  if (half === 'stage1') return '上半场';
  if (half === 'stage2') return '下半场';
  return '';
}

/** 单层的污染节点（楼层头徽标用；展开后的半场另有同级徽标，两级一致） */
export function floorPollution(f: MazeFloorDetail): PollutionEntry[] {
  const out: PollutionEntry[] = [];
  for (const half of ['stage1', 'stage2'] as const) {
    const invasion = f[half]?.invasion;
    if (invasion) out.push({ half, invasion, floor: f.floor, title: f.name });
  }
  return out;
}

/** 本季全部污染节点：层级（按详情页展示顺序，高层在前）→ 异相仲裁单关 → 星启节点。
 *  顺序与页面章节一致，避免汇总区与下方章节的层序相反。
 *  按 `stage_id` 去重：星启节点 1/2 就是常规最后一层的上下半场（同一关卡），
 *  重复列出会与赛季汇总的 `pollution.count` 对不上（计数同样按 StageID 去重）。 */
export function pollutionEntries(data: MazeListEntry | null): PollutionEntry[] {
  if (!data) return [];
  const out: PollutionEntry[] = [];
  const seen = new Set<number>();
  const push = (e: PollutionEntry): void => {
    const sid = e.invasion.stage_id;
    if (sid != null) {
      if (seen.has(sid)) return;
      seen.add(sid);
    }
    out.push(e);
  };
  for (const f of [...(data.floor_details || [])].reverse()) {
    for (const e of floorPollution(f)) push(e);
  }
  for (const lv of data.levels || []) {
    if (lv.invasion) push({ half: 'level', invasion: lv.invasion, title: lv.name });
  }
  for (const nd of data.tierce?.nodes || []) {
    if (nd.invasion) push({ half: 'tierce', invasion: nd.invasion });
  }
  return out;
}
