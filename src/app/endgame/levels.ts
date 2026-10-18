import type { MazeFloorDetail, MazeListEntry, PeakLevelInfo } from '../../services/types';
import { translate } from '../i18n';

/** 关卡子 tab 的三种形态：常规层级 / 星启模式 / 异相仲裁节点合并档 */
export type LevelTabKind = 'floor' | 'tierce' | 'peakNodes';

export interface LevelTab {
  key: string;
  kind: LevelTabKind;
  label: string;
  /** 层序号（kind = 'floor'） */
  floor?: number;
  /** 王棋合并档的主关 ID（kind = 'peakNodes' 的王棋档）：两个节点都挂在它上面；
   *  骑士合并档无此字段（节点来自三关骑士自身） */
  peakId?: number;
}

const FLOOR_KEY_PREFIX = 'floor-';
const PEAK_KEY_PREFIX = 'peak-';
/** 三关骑士试炼合并档的 key（关卡 ID 不再逐个成 tab，见 ADR 0043 补记七/八） */
export const PEAK_KNIGHTS_KEY = 'peak-knights';

/** 王棋合并档两个节点的 key：节点一 = 普通难度，节点二 = 绝境难度（用户裁决） */
export const PEAK_KING_NODE_KEY = 'king';
export const PEAK_HARD_NODE_KEY = 'hard';

/** 合并档里的一个节点：卡片行的一张卡 + 看板的当前场次 */
export interface PeakNodeEntry {
  /** 节点 key（稳定，供卡片 DOM id 与激活态）：王棋档 `king` / `hard`、骑士档关卡 ID */
  key: string;
  /** 卡片文案：王棋档 = 普通难度 / 绝境难度；骑士档 = 官方关名 */
  label: string;
  /** 节点主数据：王棋档两节点都指向**主关**（绝境靠 `hard` 取 `level.hard` 那一场，
   *  推荐属性与裁决象限增益在数据上挂主关），骑士档各指自己那一关 */
  level: PeakLevelInfo;
  /** 是否为「绝境」变体（只有王棋档的节点二） */
  hard: boolean;
}

/** 层 tab 的 key（如 `floor-4`）：构建与解析共用同一前缀 */
export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

/** 王棋合并档的 key（如 `peak-904`，取自王棋主关 ID） */
export function peakKey(peakId: number): string {
  return `${PEAK_KEY_PREFIX}${peakId}`;
}

/** 子 tab 清单：层级模式 = 星启模式 → 第 N..1 层（**倒序**，高层在前）；
 *  异相仲裁 = **两个节点合并档**——王棋档（节点一普通 / 节点二绝境）+ 骑士试炼档（三关试炼），
 *  排序口径与另外三模式一致：最高难度在前（王棋打头，默认激活项不变）。档内改由节点卡片切换
 *  （ADR 0043 补记七/八）。
 *  层级模式无星启时（早期赛季）只有层级 tab，仍按倒序。 */
export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  if (data.levels?.length) {
    const tabs: LevelTab[] = [];
    const king = data.levels.find((level) => level.kind === 'king');
    if (king) {
      // 关卡身份（官方关名）仍由 tab 承担；两个节点在档内由卡片切换
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

/** 默认激活的子 tab = 清单首位（星启模式；无星启的模式是该模式最高一档，
 *  异相仲裁即王棋合并档）。星启优先由 `buildLevelTabs` 的排序承担，此处不重复判定。 */
export function defaultLevelKey(tabs: LevelTab[]): string {
  return tabs[0]?.key || '';
}

/** 子 tab → 层级详情（非层级 tab 或数据缺层时返回 null） */
export function levelTabFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}

/** 子 tab → 合并档的节点清单（源序）。
 *  王棋档 = 普通难度 / 绝境难度（主关带 `hard` 时才出现后者）；骑士档 = 三关骑士试炼逐关一个节点。
 *  非合并档 / 缺数据返回空数组——调用方据此决定是否渲染卡片行。 */
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
