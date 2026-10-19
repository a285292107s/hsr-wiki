import type { MazeFloorDetail, MazeListEntry, PeakLevelInfo } from '../../services/types';
import { translate } from '../i18n';

export type LevelTabKind = 'floor' | 'tierce' | 'peakNodes';

export interface LevelTab {
  key: string;
  kind: LevelTabKind;
  label: string;
  floor?: number;
  peakId?: number;
}

const FLOOR_KEY_PREFIX = 'floor-';
const PEAK_KEY_PREFIX = 'peak-';
export const PEAK_KNIGHTS_KEY = 'peak-knights';

export const PEAK_KING_NODE_KEY = 'king';
export const PEAK_HARD_NODE_KEY = 'hard';

export interface PeakNodeEntry {
  key: string;
  label: string;
  level: PeakLevelInfo;
  hard: boolean;
}

export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

export function peakKey(peakId: number): string {
  return `${PEAK_KEY_PREFIX}${peakId}`;
}

export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  if (data.levels?.length) {
    const tabs: LevelTab[] = [];
    const king = data.levels.find((level) => level.kind === 'king');
    if (king) {
      const n = data.levels.indexOf(king) + 1;
      tabs.push({
        key: peakKey(king.id ?? n),
        kind: 'peakNodes',
        label: king.name || translate('egd.levelLabel', { n }),
        peakId: king.id ?? n,
      });
    }
    if (data.levels.some((level) => level.kind === 'knight')) {
      tabs.push({ key: PEAK_KNIGHTS_KEY, kind: 'peakNodes', label: translate('egd.peak.knightTrial') });
    }
    return tabs;
  }
  const tabs: LevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => b - a)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor' as const, label: translate('egd.floorLabel', { n: floor }), floor }));
  if (data.tierce) tabs.unshift({ key: 'tierce', kind: 'tierce', label: translate('egm.stat.tierce') });
  return tabs;
}

export function defaultLevelKey(tabs: LevelTab[]): string {
  return tabs[0]?.key || '';
}

export function levelTabFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}

export function levelTabPeakNodes(data: MazeListEntry | null, key: string): PeakNodeEntry[] {
  const levels = data?.levels || [];
  if (!levels.length) return [];
  if (key === PEAK_KNIGHTS_KEY) {
    return levels
      .filter((level) => level.kind === 'knight')
      .map((level, i) => ({
        key: String(level.id ?? i + 1),
        label: level.name || translate('egd.levelLabel', { n: i + 1 }),
        level,
        hard: false,
      }));
  }
  const king = levels.find((level, i) => level.kind === 'king' && peakKey(level.id ?? i + 1) === key);
  if (!king) return [];
  const nodes: PeakNodeEntry[] = [{
    key: PEAK_KING_NODE_KEY, label: translate('egd.peak.normalDiff'), level: king, hard: false,
  }];
  if (king.hard) {
    nodes.push({ key: PEAK_HARD_NODE_KEY, label: translate('egd.peak.hardDiff'), level: king, hard: true });
  }
  return nodes;
}
