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
/** 王棋关「绝境」变体 tab 的 key 后缀（如 `peak-904-hard`）：与主关共用关卡 ID，后缀标记变体 */
const PEAK_HARD_KEY_SUFFIX = '-hard';

/** 层 tab 的 key（如 `floor-4`）：构建与解析共用同一前缀 */
export function floorKey(floor: number): string {
  return `${FLOOR_KEY_PREFIX}${floor}`;
}

/** 单关 tab 的 key（如 `peak-901`）：构建与解析共用同一前缀 */
export function peakKey(peakId: number): string {
  return `${PEAK_KEY_PREFIX}${peakId}`;
}

/** 王棋关「绝境」变体 tab 的 key（如 `peak-904-hard`） */
export function peakHardKey(peakId: number): string {
  return `${peakKey(peakId)}${PEAK_HARD_KEY_SUFFIX}`;
}

/** 子 tab 清单：层级模式 = 星启模式 → 第 N..1 层（**倒序**，高层在前）；
 *  异相仲裁 = `levels` 倒序（王棋最终关 → 骑士（三）…），**绝境变体紧跟其主关之后**独立成 tab。
 *  源序是游戏内推进顺序，页面按倒序呈现（用户裁决）：最新的 / 最高的排在最前，
 *  单行不折行、可左右滚动时不必先划过一整排低级关。
 *  层级模式无星启时（早期赛季）只有层级 tab，仍按倒序。 */
export function buildLevelTabs(data: MazeListEntry | null): LevelTab[] {
  if (!data) return [];
  if (data.levels?.length) {
    // id / label 的缺省回退按**源序**推导（与 levelTabPeak 的 id 解析同源），只反转展示顺序；
    // 变体的插入发生在反转之后——先反转再插，变体才落在主关**之后**（先插再反转会跑到主关之前）
    const ordered = data.levels
      .map((level, i) => ({ level, id: level.id ?? i + 1, n: i + 1 }))
      .reverse();
    return ordered.flatMap(({ level, id, n }) => {
      const base: LevelTab = {
        key: peakKey(id), kind: 'peak', label: level.name || translate('egd.levelLabel', { n }), peakId: id,
      };
      const hard = level.hard;
      if (!hard) return [base];
      return [base, {
        key: peakHardKey(id), kind: 'peak' as const, label: hard.name || translate('egd.peak.hard'), peakId: id,
      }];
    });
  }
  const tabs: LevelTab[] = [...(data.floor_details || [])]
    .map((f) => f.floor)
    .sort((a, b) => b - a)
    .map((floor) => ({ key: floorKey(floor), kind: 'floor' as const, label: translate('egd.floorLabel', { n: floor }), floor }));
  if (data.tierce) tabs.unshift({ key: 'tierce', kind: 'tierce', label: translate('egm.stat.tierce') });
  return tabs;
}

/** 默认激活的子 tab = 清单首位（星启模式；无星启的模式是该模式最高一关，
 *  异相仲裁即王棋最终关——绝境变体紧随其后，故首位不变）。星启优先由 `buildLevelTabs` 的排序承担，
 *  此处不重复判定。 */
export function defaultLevelKey(tabs: LevelTab[]): string {
  return tabs[0]?.key || '';
}

/** 子 tab → 层级详情（非层级 tab 或数据缺层时返回 null） */
export function levelTabFloor(data: MazeListEntry | null, key: string): MazeFloorDetail | null {
  if (!data || !key.startsWith(FLOOR_KEY_PREFIX)) return null;
  const floor = Number(key.slice(FLOOR_KEY_PREFIX.length));
  return (data.floor_details || []).find((f) => f.floor === floor) || null;
}

/** 单关 tab key 的形态（由 key 前缀 / 后缀常量拼出，常量改名不会漏掉这里） */
const PEAK_KEY_RE = new RegExp(`^${PEAK_KEY_PREFIX}(\\d+)(${PEAK_HARD_KEY_SUFFIX})?$`);

/** 单关 tab key → 关卡 ID + 是否绝境变体（非单关 key 或形态不符时返回 null）。
 *  主关与变体共用同一关卡 ID，靠 `-hard` 后缀区分——故解析必须走这里，不能只 `Number(slice)`
 *  （`Number('904-hard')` 得 `NaN`，变体 key 会静默解析成「不存在」）。
 *  用正则而非 `Number()` 判形态：`Number('')` 得 0（有限），`peak-` / `peak--hard` 会被误判成关卡 0。 */
export function parsePeakKey(key: string): { id: number; hard: boolean } | null {
  const m = PEAK_KEY_RE.exec(key);
  if (!m) return null;
  return { id: Number(m[1]), hard: !!m[2] };
}

/** 子 tab → 异相仲裁单关（非单关 tab 或缺该关时返回 null）。
 *  变体 key 返回的是**主关**节点：变体的推荐属性与增益都挂在主关上，由面板侧取 `hard` 分支。 */
export function levelTabPeak(data: MazeListEntry | null, key: string): PeakLevelInfo | null {
  const parsed = parsePeakKey(key);
  if (!data || !parsed) return null;
  return (data.levels || []).find((l, i) => (l.id ?? i + 1) === parsed.id) || null;
}
