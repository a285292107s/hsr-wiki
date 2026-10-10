import type { MazeFloorDetail, MazeListEntry, PeakLevelInfo } from '../../services/types';
import { translate } from '../i18n';

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

/** 子 tab 清单：层级模式 = 星启模式 → 第 N..1 层（**倒序**，高层在前）；
 *  异相仲裁 = `levels` 倒序（王棋最终关 → 骑士（三）…）。
 *  源序是游戏内推进顺序，页面按倒序呈现（用户裁决）：最新的 / 最高的排在最前，
 *  单行不折行、可左右滚动时不必先划过一整排低级关。
 *  层级模式无星启时（早期赛季）只有层级 tab，仍按倒序。 */
export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  if (data.levels?.length) {
    // id / label 的缺省回退按**源序**推导（与 levelTabPeak 的 id 解析同源），只反转展示顺序
    const peakTabs: LevelTab[] = data.levels.map((l, i) => {
      const id = l.id ?? i + 1;
      return { key: peakKey(id), kind: 'peak' as const, label: l.name || translate('egd.levelLabel', { n: i + 1 }), peakId: id };
    });
    return peakTabs.reverse();
  }
  const tabs: LevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => b - a)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor' as const, label: translate('egd.floorLabel', { n: floor }), floor }));
  if (data.tierce) tabs.unshift({ key: 'tierce', kind: 'tierce', label: translate('egm.stat.tierce') });
  return tabs;
}

/** 默认激活的子 tab = 清单首位（星启模式；无星启的模式是该模式最高一关，
 *  异相仲裁即王棋最终关）。星启优先由 `buildLevelTabs` 的排序承担，此处不重复判定。 */
export function defaultLevelKey(tabs: LevelTab[]): string {
  return tabs[0]?.key || '';
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
