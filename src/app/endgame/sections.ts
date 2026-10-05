import type { MazeListEntry, PeakLevelInfo } from '../../services/types';
import { seasonBuffList } from './renders';

export interface EndgameSection {
  id: string;
  idx: string;
  label: string;
}

export function buildEndgameSections(
  data: MazeListEntry | null,
  modeKey: string,
  peakLevels: PeakLevelInfo[],
  /** 该玩法的增益体系名（`endgame_guide.json` 分节标题派生）；空串/缺省回退站点工作名「赛季增益」 */
  systemName = '赛季增益',
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
  // 层级模式（忘却之庭 / 虚构叙事 / 末日幻影，ADR 0030 + 0037）：关卡层级与星启模式由
  // 「第 1..N 层 / 星启模式」子 tab 承载，区块导航只剩赛季级维度
  if (modeKey === 'boss') {
    if (data?.pollution) push('pollution', '污染等级');
    return s;
  }
  if (data?.sub_buffs?.length) push('sub-buffs', '战意机制');
  if (data && seasonBuffList(data).length) push('buffs', systemName || '赛季增益');
  if (data?.pollution) push('pollution', '污染等级');
  return s;
}

export function sectionIdxMap(sections: EndgameSection[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const sec of sections) m[sec.id] = sec.idx;
  return m;
}