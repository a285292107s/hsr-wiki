import {
  ACTION_VALUE_BASE,
  CYCLE_ACTION_VALUE,
  FIRST_CYCLE_ACTION_VALUE,
} from './constants';

export const FIRST_CYCLE_AV = FIRST_CYCLE_ACTION_VALUE;
export const CYCLE_AV = CYCLE_ACTION_VALUE;

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sumOf(values: number[] | undefined): number {
  if (!values) return 0;
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? Math.max(0, value) : 0), 0);
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function actionValue(speed: number): number {
  return ACTION_VALUE_BASE / Math.max(1, finiteOr(speed, 0));
}

export function turnsPerCycle(speed: number, cycleActionValue?: number): number {
  const cycle = finiteOr(cycleActionValue, CYCLE_ACTION_VALUE);
  const span = cycle > 0 ? cycle : CYCLE_ACTION_VALUE;
  return span / actionValue(speed);
}

export function speedNeeded(turns: number, budget: number): number {
  const span = finiteOr(budget, 0);
  if (span <= 0) return 0;
  return (Math.max(0, finiteOr(turns, 0)) * ACTION_VALUE_BASE) / span;
}

export function turnsInBudget(speed: number, budget: number): number {
  const value = finiteOr(speed, 0);
  const span = finiteOr(budget, 0);
  if (value <= 0 || span <= 0) return 0;
  const turns = (span * value) / ACTION_VALUE_BASE;
  return Number.isFinite(turns) ? Math.floor(turns) : 0;
}

export function breakToughness(baseToughness: number, breakEfficiency?: number): number {
  const base = Math.max(0, finiteOr(baseToughness, 0));
  return base * (1 + Math.max(0, finiteOr(breakEfficiency, 0)));
}

export function effectChance(o: {
  base: number;
  effectHit?: number;
  effectRes?: number;
  specificResist?: number;
}): number {
  const chance =
    Math.max(0, finiteOr(o.base, 0)) *
    (1 + Math.max(0, finiteOr(o.effectHit, 0))) *
    (1 - clampUnit(finiteOr(o.effectRes, 0))) *
    (1 - clampUnit(finiteOr(o.specificResist, 0)));
  return clampUnit(chance);
}

export function healAmount(o: {
  stat: number;
  multiplier: number;
  flat?: number;
  bonus?: number[];
  reduce?: number[];
}): number {
  const base = Math.max(0, finiteOr(o.stat, 0) * finiteOr(o.multiplier, 0) + finiteOr(o.flat, 0));
  const boost = 1 + sumOf(o.bonus);
  const cut = clampUnit(1 - sumOf(o.reduce));
  return base * boost * cut;
}

export function shieldAmount(o: {
  stat: number;
  multiplier: number;
  flat?: number;
  shieldBonus?: number[];
  shieldGain?: number[];
}): number {
  const base = Math.max(0, finiteOr(o.stat, 0) * finiteOr(o.multiplier, 0) + finiteOr(o.flat, 0));
  const boost = 1 + sumOf(o.shieldBonus) + sumOf(o.shieldGain);
  return base * boost;
}
