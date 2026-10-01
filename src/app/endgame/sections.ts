import type { MazeListEntry, PeakLevelInfo } from '../../services/types';

export interface EndgameSection {
  id: string;
  idx: string;
  label: string;
}

export function buildEndgameSections(
  data: MazeListEntry | null,
  modeKey: string,
  peakLevels: PeakLevelInfo[],
): EndgameSection[] {
  const s: EndgameSection[] = [];
  let idx = 1;
  const push = (id: string, label: string): void => {
    s.push({ id, idx: String(idx++).padStart(2, '0'), label });
  };
  // 区块顺序必须与 EndgameView 模板里的组件顺序一致（滚动定位按 DOM 锚点）
  if (modeKey === 'peak') {
    if (data?.pollution) push('pollution', '污染等级');
    if (peakLevels.length) push('levels', '关卡组成');
    return s;
  }
  if (data?.sub_buffs?.length) push('sub-buffs', '战意机制');
  if (data?.buffs?.length) push('buffs', '赛季增益');
  if (data?.pollution) push('pollution', '污染等级');
  if (data?.tierce) push('tierce', '星启模式');
  if (data?.floor_details?.length) push('floors', '关卡层级');
  return s;
}

export function sectionIdxMap(sections: EndgameSection[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const sec of sections) m[sec.id] = sec.idx;
  return m;
}