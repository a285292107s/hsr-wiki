import type { MazeFloorDetail, MazeListEntry } from '../../services/types';

/** 末日幻影子 tab 的两种形态：常规层级（1..N 层）与星启模式 */
export type BossLevelKind = 'floor' | 'tierce';

export interface BossLevelTab {
  key: string;
  kind: BossLevelKind;
  label: string;
  /** 层序号（kind = 'floor'） */
  floor?: number;
}

const FLOOR_KEY_PREFIX = 'floor-';

/** 层 tab 的 key（如 `floor-4`）：构建与解析共用同一前缀 */
export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

/** 末日幻影子 tab 清单：第 1..N 层升序 + 星启模式（仅含星启的赛季存在） */
export function buildBossLevelTabs(data: MazeListEntry | null): BossLevelTab[] {
  if (!data) return [];
  const tabs: BossLevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => a - b)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor', label: `第 ${floor} 层`, floor }));
  if (data.tierce) tabs.push({ key: 'tierce', kind: 'tierce', label: '星启模式' });
  return tabs;
}

/** 子 tab → 层级详情（非层级 tab 或数据缺层时返回 null） */
export function bossLevelFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}
