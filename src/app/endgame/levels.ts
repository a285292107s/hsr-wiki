import type { MazeFloorDetail, MazeListEntry } from '../../services/types';

/** 层级模式（忘却之庭 / 虚构叙事 / 末日幻影）子 tab 的两种形态：常规层级与星启模式 */
export type LevelTabKind = 'floor' | 'tierce';

export interface LevelTab {
  key: string;
  kind: LevelTabKind;
  label: string;
  /** 层序号（kind = 'floor'） */
  floor?: number;
}

const FLOOR_KEY_PREFIX = 'floor-';

/** 层 tab 的 key（如 `floor-4`）：构建与解析共用同一前缀 */
export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

/** 子 tab 清单：第 1..N 层升序 + 星启模式（仅含星启的赛季存在） */
export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  const tabs: LevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => a - b)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor' as const, label: `第 ${floor} 层`, floor }));
  if (data.tierce) tabs.push({ key: 'tierce', kind: 'tierce', label: '星启模式' });
  return tabs;
}

/** 默认激活的子 tab：星启模式优先（用户裁决，推翻 ADR 0030 决策 6 的「默认第 1 层」），
 *  不含星启的赛季退回首个层级 tab */
export function defaultLevelKey(tabs: LevelTab[]): string {
  return (tabs.find((t) => t.kind === 'tierce') || tabs[0])?.key || '';
}

/** 子 tab → 层级详情（非层级 tab 或数据缺层时返回 null） */
export function levelTabFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}

/** 层级模式（关卡层级子 tab 承载关卡的玩法）：异相仲裁无层级，仍走顶部区块导航 */
export function isLevelMode(modeKey: string): boolean {
  return modeKey === 'maze' || modeKey === 'story' || modeKey === 'boss';
}