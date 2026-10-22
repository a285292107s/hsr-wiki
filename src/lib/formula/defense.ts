import {
  DEF_LEVEL_BASE,
  DEF_LEVEL_STEP,
  RES_MAX,
  RES_MIN,
  SWARM_DEF_LEVEL_BASE,
  SWARM_DEF_LEVEL_STEP,
} from './constants';

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampResistance(value: number): number {
  return Math.min(RES_MAX, Math.max(RES_MIN, value));
}

export function attackerLevelValue(level: number): number {
  return DEF_LEVEL_BASE + DEF_LEVEL_STEP * finiteOr(level, 0);
}

export function enemyDefenseValue(
  level: number,
  o?: { defReduction?: number; defPenetration?: number; defModify?: number; swarm?: boolean },
): number {
  const lv = finiteOr(level, 0);
  const base = o?.swarm
    ? SWARM_DEF_LEVEL_BASE + SWARM_DEF_LEVEL_STEP * lv
    : DEF_LEVEL_BASE + DEF_LEVEL_STEP * lv;
  const reduction = Math.max(0, finiteOr(o?.defReduction, 0) + finiteOr(o?.defPenetration, 0));
  const scaled = base * Math.max(0, 1 - reduction);
  return Math.max(0, scaled + finiteOr(o?.defModify, 0));
}

export function defenseZone(attackerLevel: number, defenseValue: number): number {
  const attacker = Math.max(0, attackerLevelValue(attackerLevel));
  const defender = Math.max(0, finiteOr(defenseValue, 0));
  if (attacker <= 0) return 0;
  return attacker / (defender + attacker);
}

export function effectiveResistance(o: {
  base?: number;
  bonus?: number;
  reduction?: number;
  penetration?: number;
}): number {
  const value =
    finiteOr(o.base, 0) +
    finiteOr(o.bonus, 0) -
    finiteOr(o.reduction, 0) -
    finiteOr(o.penetration, 0);
  return clampResistance(value);
}

export function resistanceZone(resistance: number): number {
  return 1 - clampResistance(finiteOr(resistance, 0));
}
