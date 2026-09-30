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
  if (modeKey === 'peak') {
    if (peakLevels.length) s.push({ id: 'levels', idx: '01', label: '关卡组成' });
  } else {
    let idx = 1;
    const push = (id: string, label: string) => {
      s.push({ id, idx: String(idx++).padStart(2, '0'), label });
    };
    if (data?.sub_buffs?.length) push('sub-buffs', '战意机制');
    if (data?.buffs?.length) push('buffs', '赛季增益');
    if (data?.tierce) push('tierce', '星启模式');
    if (data?.floor_details?.length) push('floors', '关卡层级');
  }
  return s;
}

export function sectionIdxMap(sections: EndgameSection[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const sec of sections) m[sec.id] = sec.idx;
  return m;
}