
export interface MonsterStatBase {
  hp?: number | null;
  atk?: number | null;
  def?: number | null;
  speed?: number | null;
  [k: string]: unknown;
}

export interface MonsterLevelCurveRow {
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

export type MonsterLevelCurve = Record<string, Record<string, MonsterLevelCurveRow>>;

export interface MonsterEliteRatios {
  hp?: number;
  atk?: number;
  def?: number;
  speed?: number;
  stance?: number;
}

export type MonsterEliteGroups = Record<string, MonsterEliteRatios>;

export function monsterEliteRatiosProduct(
  ...rows: (MonsterEliteRatios | null | undefined)[]
): MonsterEliteRatios {
  const out: MonsterEliteRatios = {};
  for (const row of rows) {
    if (!row) continue;
    for (const k of ["hp", "atk", "def", "speed", "stance"] as const) {
      const v = row[k];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) {
        out[k] = (out[k] ?? 1) * v;
      }
    }
  }
  return out;
}

export interface MonsterStatRatios {
  hp?: number;
  atk?: number;
  def?: number;
  speed?: number;
}

export interface StatAtLevelInput {
  statRatio?: MonsterStatRatios | null;
  levelGroup?: number | string | null;
  eliteRatios?: MonsterEliteRatios | null;
  stats?: MonsterStatBase | null;
  curve?: MonsterLevelCurve | null;
  modify?: MonsterStatRatios | null;
}

function ratioOf(r: MonsterStatRatios | null | undefined, prop: string): number {
  const v = r?.[prop as keyof MonsterStatRatios];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 1;
}

function curveRowOf(curve: MonsterLevelCurve | null | undefined, groupKey: string, level: number): MonsterLevelCurveRow | null {
  const byLevel = curve?.[groupKey];
  if (!byLevel) return null;
  const row = byLevel[String(level)];
  return row ?? null;
}

export interface MonsterStatBreakdown {
  base: number | null;
  statRatio: number;
  eliteRatio: number;
  curve: number | null;
  modify: number | null;
  value: number | null;
}

export function monsterStatBreakdown(
  prop: "hp" | "atk" | "def" | "speed",
  level: number,
  input: StatAtLevelInput,
): MonsterStatBreakdown {
  const baseV = input.stats?.[prop as keyof MonsterStatBase];
  const base = typeof baseV === "number" && Number.isFinite(baseV) ? baseV : null;
  const statRatio = ratioOf(input.statRatio, prop);
  const eliteRatio = ratioOf(input.eliteRatios, prop);
  const modifyV = input.modify?.[prop as keyof MonsterStatRatios];
  const modify = typeof modifyV === "number" && Number.isFinite(modifyV) ? modifyV : null;
  const row = curveRowOf(input.curve, String(input.levelGroup ?? 1), level);
  const curveV = row?.[prop];
  const curve = typeof curveV === "number" && Number.isFinite(curveV) ? curveV : null;
  let value: number | null = null;
  if (base != null && curve != null) {
    const out = base * statRatio * eliteRatio * curve + (modify ?? 0);
    if (Number.isFinite(out)) value = Math.round(out * 10) / 10;
  }
  return { base, statRatio, eliteRatio, curve, modify, value };
}

export function monsterStatAt(
  prop: "hp" | "atk" | "def" | "speed",
  level: number,
  input: StatAtLevelInput,
): number | null {
  return monsterStatBreakdown(prop, level, input).value;
}

export interface MonsterStanceBreakdown {
  base: number | null;
  eliteRatio: number;
  modify: number | null;
  value: number | null;
}

export function monsterStanceBreakdown(
  base: number | null | undefined,
  modify?: number | null,
  eliteStance?: number | null,
): MonsterStanceBreakdown {
  const b = typeof base === "number" ? base : null;
  const add = typeof modify === "number" && Number.isFinite(modify) ? modify : null;
  const e = typeof eliteStance === "number" && Number.isFinite(eliteStance) && eliteStance > 0 ? eliteStance : 1;
  return { base: b, eliteRatio: e, modify: add, value: b == null ? null : b * e + (add ?? 0) };
}

export function monsterStanceValue(
  base: number | null | undefined,
  modify?: number | null,
  eliteStance?: number | null,
): number | null {
  return monsterStanceBreakdown(base, modify, eliteStance).value;
}

export function monsterMaxLevel(curve: MonsterLevelCurve | null | undefined, groupKey: string): number {
  const byLevel = curve?.[groupKey];
  if (!byLevel) return 0;
  const lvls = Object.keys(byLevel)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));
  return lvls.length ? Math.max(...lvls) : 0;
}
