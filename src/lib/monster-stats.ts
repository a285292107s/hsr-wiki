/** 怪物战斗数值合成（ADR 0040 + ADR 0045）：基准模板值 × 维度修饰比 × 难度组等级曲线 + 实例修正值。
 *  纯函数，供详情页 UI 与单元测试共用；不预测游戏内特殊场景系数（剧情/任务涂改不可知，
 *  显示时必须与字段口径一起呈现，禁止去掉口径宣称「这就是战斗内数值」）。 */

export interface MonsterStatBase {
  hp: number | null;
  atk: number | null;
  def: number | null;
  speed: number | null;
  [k: string]: unknown;
}

export interface MonsterLevelCurveRow {
  hp: number;
  atk: number;
  def: number;
  speed: number;
}

/** 难度组 → 等级 → 各维曲线值；JSON 键为字符串。 */
export type MonsterLevelCurve = Record<string, Record<string, MonsterLevelCurveRow>>;

export interface MonsterStatRatios {
  hp?: number;
  atk?: number;
  def?: number;
  speed?: number;
}

export interface StatAtLevelInput {
  /** 已加载详情页的 stat_ratio（维度修饰比，缺省位按 1）与 level_group（难度组号）。 */
  statRatio?: MonsterStatRatios | null;
  /** 详情的 level_group（难度组号——缺省 1）。 */
  levelGroup?: number | string | null;
  /** 详情的基准 stats（模板原值，可缺省位）。 */
  stats?: MonsterStatBase | null;
  /** 共享单例加载 monster-level-curve.json 后的表。 */
  curve?: MonsterLevelCurve | null;
  /** 实例修正值（`MonsterConfig.{Stance,Speed}ModifyValue`）。**加在曲线之后、不再被缩放**
   *  （ADR 0045：实测该档 `基准 × 曲线` 后直接加修正值；先乘后加与先加后乘结果不同，故位置必须锁死）。 */
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

/** 基准 × 修饰比 × 曲线 **＋ 修正值**，一位小数内展示（游戏内在战斗内亦展示一位小数）。
 *  修正值加在最后：实测同族同模板的两档，速度 `144×1.32=190` 带 −44 修正的那一档显示 146
 *  （若先加后乘会得到 132），见 ADR 0045。 */
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
  const out = baseV * ratioOf(input.statRatio, prop) * curveV + add;
  if (!Number.isFinite(out)) return null;
  return Math.round(out * 10) / 10;
}

/** 韧性值：**不入等级曲线链**（曲线表没有韧性维度），只有「韧性基准 + 实例修正值」。
 *  实测该档：基准 90 + 修正 +30 显示 120（ADR 0045）。 */
export function monsterStanceValue(
  base: number | null | undefined,
  modify?: number | null,
): number | null {
  if (typeof base !== "number") return null;
  const add = typeof modify === "number" && Number.isFinite(modify) ? modify : 0;
  return base + add;
}

/** 难度组曲线可用的最高等级（详情页滑条的上限）。 */
export function monsterMaxLevel(curve: MonsterLevelCurve | null | undefined, groupKey: string): number {
  const byLevel = curve?.[groupKey];
  if (!byLevel) return 0;
  const lvls = Object.keys(byLevel)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));
  return lvls.length ? Math.max(...lvls) : 0;
}
