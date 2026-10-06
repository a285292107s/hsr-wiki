import type { MazeListEntry } from '../../services/types';

export interface EndgameSection {
  id: string;
  idx: string;
  label: string;
}

export function buildEndgameSections(
  data: MazeListEntry | null,
  modeKey: string,
  /** 该玩法的增益体系名由当前节点面板消费；区块构建不使用它。 */
  _systemName = '赛季增益',
): EndgameSection[] {
  const s: EndgameSection[] = [];
  let idx = 1;
  const push = (id: string, label: string): void => {
    s.push({ id, idx: String(idx++).padStart(2, '0'), label });
  };
  // 区块顺序必须与 EndgameView 模板里的组件顺序一致（区块序号按同一份清单派生）
  if (modeKey === 'peak') {
    if (data?.pollution) push('pollution', '污染等级');
    if (data?.badges?.length) push('badges', '段位徽章');
    return s;
  }
  // 四种玩法的关卡与增益均由各节点面板承载；赛季级导航只列其他赛季维度
  if (modeKey === 'boss') {
    if (data?.pollution) push('pollution', '污染等级');
    return s;
  }
  if (data?.pollution) push('pollution', '污染等级');
  return s;
}

export function sectionIdxMap(sections: EndgameSection[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const sec of sections) m[sec.id] = sec.idx;
  return m;
}