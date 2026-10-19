
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

export function monsterStatAt(
  prop: "hp" | "atk" | "def" | "speed",
  level: number,
  input: StatAtLevelInput,
): number | null {
  const group = String(input.levelGroup ?? 1);
  const bar = input.stats ?? null;
  const baseV = bar?.[prop as keyof MonsterStatBase];
  if (typeof baseV !== "number") return null;
  const row = curveRowOf(input.curve, group, level);
  if (!row) return null;
  const curveV = row[prop];
  if (typeof curveV !== "number") return null;
  const modifyV = input.modify?.[prop as keyof MonsterStatRatios];
  const add = typeof modifyV === "number" && Number.isFinite(modifyV) ? modifyV : 0;
  const out = baseV * ratioOf(input.statRatio, prop) * ratioOf(input.eliteRatios, prop) * curveV + add;
  if (!Number.isFinite(out)) return null;
  return Math.round(out * 10) / 10;
}

export function monsterStanceValue(
  base: number | null | undefined,
  modify?: number | null,
  eliteStance?: number | null,
): number | null {
  if (typeof base !== "number") return null;
  const add = typeof modify === "number" && Number.isFinite(modify) ? modify : 0;
  const e = typeof eliteStance === "number" && Number.isFinite(eliteStance) && eliteStance > 0 ? eliteStance : 1;
  return base * e + add;
}

export function monsterMaxLevel(curve: MonsterLevelCurve | null | undefined, groupKey: string): number {
  const byLevel = curve?.[groupKey];
  if (!byLevel) return 0;
  const lvls = Object.keys(byLevel)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));
  return lvls.length ? Math.max(...lvls) : 0;
}
