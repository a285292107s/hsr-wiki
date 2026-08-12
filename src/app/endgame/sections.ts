/**
 * 终局详情页板块章节定义（单一事实源）：
 * EndgameView 吸顶条导航与各面板组件的编号（.nk-title__idx）同源，禁止各自计算。
 */
import type { MazeListEntry, PeakLevelInfo } from '../../services/types';

export interface EndgameSection {
  id: string;
  idx: string;
  label: string;
}

/**
 * 章节导航（吸顶条）：编号与 .nk-title 同源（战意机制 01 / 赛季增益 02 / 星启 03 / 层级 04；
 * peak 关卡组成 01）；编号随板块存在性动态顺延。
 */
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

/** 板块编号映射（模板 .nk-title__idx 与吸顶条导航同源） */
export function sectionIdxMap(sections: EndgameSection[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const sec of sections) m[sec.id] = sec.idx;
  return m;
}