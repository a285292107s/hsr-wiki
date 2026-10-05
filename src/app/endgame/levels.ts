import type { MazeFloorDetail, MazeListEntry, PeakLevelInfo } from '../../services/types';

/** 关卡子 tab 的三种形态：常规层级 / 星启模式 / 异相仲裁单关 */
export type LevelTabKind = 'floor' | 'tierce' | 'peak';

export interface LevelTab {
  key: string;
  kind: LevelTabKind;
  label: string;
  /** 层序号（kind = 'floor'） */
  floor?: number;
  /** 单关 ID（kind = 'peak'） */
  peakId?: number;
}

const FLOOR_KEY_PREFIX = 'floor-';
const PEAK_KEY_PREFIX = 'peak-';

/** 层 tab 的 key（如 `floor-4`）：构建与解析共用同一前缀 */
export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

/** 单关 tab 的 key（如 `peak-901`）：构建与解析共用同一前缀 */
export function peakKey(peakId: number): string {
  return `${PEAK_KEY_PREFIX}${peakId}`;
}

/** 子 tab 清单：层级模式 = 第 1..N 层升序 + 星启模式（仅含星启的赛季存在）；
 *  异相仲裁 = `levels` 原序（3 骑士试炼 + 1 王棋最终关），tab 名即官方关卡名
 *  （源序就是 一/二/三 → 王棋，不重排）。 */
export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  if (data.levels?.length) {
    return data.levels.map((l, i) => {
      const id = l.id ?? i + 1;
      return { key: peakKey(id), kind: 'peak' as const, label: l.name || `关卡 ${i + 1}`, peakId: id };
    });
  }
  const tabs: LevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => a - b)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor' as const, label: `第 ${floor} 层`, floor }));
  if (data.tierce) tabs.push({ key: 'tierce', kind: 'tierce', label: '星启模式' });
  return tabs;
}

/** 默认激活的子 tab：星启模式优先（用户裁决，推翻 ADR 0030 决策 6 的「默认第 1 层」），
 *  不含星启的赛季（含全部异相仲裁期）退回首个关卡 tab */
export function defaultLevelKey(tabs: LevelTab[]): string {
  return (tabs.find((t) => t.kind === 'tierce') || tabs[0])?.key || '';
}

/** 子 tab → 层级详情（非层级 tab 或数据缺层时返回 null） */
export function levelTabFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}

/** 子 tab → 异相仲裁单关（非单关 tab 或缺该关时返回 null） */
export function levelTabPeak(data: MazeListEntry | null, key: string): PeakLevelInfo | null {
  if (!data || !key.startsWith(PEAK_KEY_PREFIX)) return null;
  const id = Number(key.slice(PEAK_KEY_PREFIX.length));
  return (data.levels || []).find((l, i) => (l.id ?? i + 1) === id) || null;
}
