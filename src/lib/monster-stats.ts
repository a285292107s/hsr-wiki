/** 怪物战斗数值合成（ADR 0040 + 0045 + 0049）：基准模板值 × 维度修饰比 × 精英组倍率 × 难度组等级曲线
 *  ＋ 实例修正值（曲线后加）。纯函数，供详情页 UI 与单元测试共用；不预测关卡侧精英组指派与
 *  剧情/任务涂改（显示时必须与字段口径一起呈现，禁止去掉口径宣称「这就是战斗内数值」）。 */

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

export interface MonsterEliteRatios {
  hp?: number;
  atk?: number;
  def?: number;
  speed?: number;
  stance?: number;
}

/** 精英组 → 各维整体倍率（monster-elite-group.json，不随等级变化）；JSON 键为字符串。 */
export type MonsterEliteGroups = Record<string, MonsterEliteRatios>;

/** Π精英组别系数（ADR 0049/0050）：怪物自身组 × 关卡指派组，逐维叠乘；缺位维度按中性 1。
 *  输入行整行缺位（组缺号 / 表缺行）等价于不参与叠乘。 */
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
  /** 已加载详情页的 stat_ratio（维度修饰比，缺省位按 1）与 level_group（难度组号）。 */
  statRatio?: MonsterStatRatios | null;
  /** 详情的 level_group（难度组号——缺省 1）。 */
  levelGroup?: number | string | null;
  /** 详情的 elite_group 对应的精英组倍率行（缺省位按 1；表缺组同理中性，ADR 0049）。 */
  eliteRatios?: MonsterEliteRatios | null;
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

/** 基准 × 修饰比 × 精英组倍率 × 曲线 **＋ 修正值**，一位小数内展示（游戏内在战斗内亦展示一位小数）。
 *  修正值加在最后：实测同族同模板的两档，速度 `144×1.32=190` 带 −44 修正的那一档显示 146
 *  （若先加后乘会得到 132），见 ADR 0045。精英组倍率段由参考站变体卡实测逐位验证（ADR 0049：
 *  银鬃射手 #100205006 组 2，L95 显示 51,203 / 574，与 `102.3×1.7×曲线` / `18×0.8×曲线` 吻合）。 */
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

/** 韧性值：**不入等级曲线链**（曲线表没有韧性维度）：韧性 = 韧性基准 × 精英组韧性倍率 ＋ 实例修正值。
 *  实测该档：基准 90 + 修正 +30 显示 120（ADR 0045）；当前被怪物引用的精英组韧性倍率全为 1（ADR 0049）。 */
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

/** 难度组曲线可用的最高等级（详情页滑条的上限）。 */
export function monsterMaxLevel(curve: MonsterLevelCurve | null | undefined, groupKey: string): number {
  const byLevel = curve?.[groupKey];
  if (!byLevel) return 0;
  const lvls = Object.keys(byLevel)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n));
  return lvls.length ? Math.max(...lvls) : 0;
}
