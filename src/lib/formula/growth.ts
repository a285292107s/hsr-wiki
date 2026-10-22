import { MAX_CHAR_LEVEL } from '../constants';
import { charStageForLevel, levelStatValue } from '../format';

export interface PhaseStatRow {
  hp_base: number;
  hp_add: number;
  attack_base: number;
  attack_add: number;
  defence_base: number;
  defence_add: number;
  max_level?: number;
}

export type PhaseStatMap = Record<string, PhaseStatRow>;
export type GrowthProp = 'hp' | 'attack' | 'defence';

const PROP_FIELDS = {
  hp: ['hp_base', 'hp_add'],
  attack: ['attack_base', 'attack_add'],
  defence: ['defence_base', 'defence_add'],
} as const satisfies Record<GrowthProp, readonly [keyof PhaseStatRow, keyof PhaseStatRow]>;

const SKILL_LEVEL_CAP = { normal: 10, skill: 15, ultra: 15 } as const;

interface OrderedRow {
  row: PhaseStatRow;
  maxLevel: number | null;
  order: number;
}

function orderedRows(map: PhaseStatMap): OrderedRow[] {
  const rows: OrderedRow[] = Object.entries(map).map(([key, row], index) => ({
    row,
    maxLevel:
      typeof row.max_level === 'number' && Number.isFinite(row.max_level) ? row.max_level : null,
    order: Number.isFinite(Number(key)) ? Number(key) : index,
  }));
  const capped = rows.length > 0 && rows.every((item) => item.maxLevel != null);
  return rows.sort((a, b) =>
    capped ? (a.maxLevel ?? 0) - (b.maxLevel ?? 0) : a.order - b.order,
  );
}

function rowForLevel(rows: OrderedRow[], level: number): PhaseStatRow | null {
  if (rows.length === 0) return null;
  if (rows[0].maxLevel == null) {
    return rows[Math.min(charStageForLevel(level, rows.length), rows.length - 1)].row;
  }
  for (const item of rows) {
    if ((item.maxLevel ?? 0) >= level) return item.row;
  }
  return rows[rows.length - 1].row;
}

function clampLevel(level: number, range: { min: number; max: number }): number {
  const value = Number.isFinite(level) ? level : range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

function clampSkillLevel(level: number, cap: number): number {
  const value = Number.isFinite(level) ? Math.round(level) : 1;
  return Math.min(cap, Math.max(1, value));
}

function skillTierRatio(level: number): number {
  if (level <= 1) return 1;
  if (level <= 6) return 1 + (level - 1) * 0.1;
  if (level <= 10) return 1.5 + (level - 6) * 0.125;
  return 2 + (level - 10) * 0.1;
}

function ultraTierRatio(level: number): number {
  if (level <= 1) return 1;
  if (level <= 6) return 1 + (level - 1) / 15;
  if (level <= 10) return 4 / 3 + (level - 6) / 12;
  return 5 / 3 + (level - 10) / 15;
}

export function growthLevelRange(map: PhaseStatMap): { min: number; max: number } {
  const rows = orderedRows(map);
  if (rows.length === 0) return { min: 1, max: MAX_CHAR_LEVEL };
  const capped = rows[0].maxLevel != null;
  const max = capped
    ? rows.reduce((top, item) => Math.max(top, item.maxLevel ?? 0), 0)
    : MAX_CHAR_LEVEL;
  return { min: 1, max: Math.max(1, max) };
}

export function statAtLevel(map: PhaseStatMap, prop: GrowthProp, level: number): number {
  const range = growthLevelRange(map);
  const rows = orderedRows(map);
  const row = rowForLevel(rows, clampLevel(level, range));
  if (!row) return 0;
  const [baseKey, addKey] = PROP_FIELDS[prop];
  const base = row[baseKey];
  const add = row[addKey];
  if (typeof base !== 'number' || typeof add !== 'number') return 0;
  if (!Number.isFinite(base) || !Number.isFinite(add)) return 0;
  return levelStatValue(base, add, clampLevel(level, range));
}

export function statSeries(
  map: PhaseStatMap,
  prop: GrowthProp,
  from: number,
  to: number,
): { level: number; value: number }[] {
  const range = growthLevelRange(map);
  const start = Math.max(range.min, Math.ceil(Number.isFinite(from) ? from : range.min));
  const end = Math.min(range.max, Math.floor(Number.isFinite(to) ? to : range.max));
  const series: { level: number; value: number }[] = [];
  for (let level = start; level <= end; level += 1) {
    series.push({ level, value: statAtLevel(map, prop, level) });
  }
  return series;
}

export function traceBonuses(skillTrees: unknown): { id: string; value: number }[] {
  if (!skillTrees || typeof skillTrees !== 'object' || Array.isArray(skillTrees)) return [];
  const totals = new Map<string, number>();
  for (const points of Object.values(skillTrees as Record<string, unknown>)) {
    if (!points || typeof points !== 'object' || Array.isArray(points)) continue;
    for (const level of Object.values(points as Record<string, unknown>)) {
      if (!level || typeof level !== 'object') continue;
      const adds = (level as { status_add_list?: unknown }).status_add_list;
      if (!Array.isArray(adds)) continue;
      for (const add of adds) {
        if (!add || typeof add !== 'object') continue;
        const property = (add as { property_type?: unknown }).property_type;
        const value = (add as { value?: unknown }).value;
        if (typeof property !== 'string' || property === '') continue;
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;
        totals.set(property, (totals.get(property) ?? 0) + value);
      }
    }
  }
  return [...totals.entries()]
    .map(([id, value]) => ({ id, value }))
    .sort((a, b) => b.value - a.value);
}

export function skillLineRatio(kind: 'normal' | 'skill' | 'ultra', level: number): number {
  const lv = clampSkillLevel(level, SKILL_LEVEL_CAP[kind]);
  if (kind === 'normal') return 1 + (lv - 1) * 0.2;
  if (kind === 'skill') return skillTierRatio(lv);
  return ultraTierRatio(lv);
}

export function skillGrowthSeries(
  kind: 'normal' | 'skill' | 'ultra',
  cap?: number,
): { level: number; value: number }[] {
  const upper = SKILL_LEVEL_CAP[kind];
  const limit =
    cap === undefined
      ? upper
      : Math.min(upper, Math.max(1, Number.isFinite(cap) ? Math.floor(cap) : upper));
  const series: { level: number; value: number }[] = [];
  for (let level = 1; level <= limit; level += 1) {
    series.push({ level, value: skillLineRatio(kind, level) });
  }
  return series;
}
