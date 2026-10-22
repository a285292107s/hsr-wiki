import {
  BREAK_ELEMENT_MULTIPLIER,
  BREAK_LENGTH_DIVISOR,
  BREAK_LENGTH_OFFSET,
  DMG_REDUCTION_CAP,
  ELATION_JOKE_SLOPE,
  ELATION_JOKE_SPAN,
  SUPER_BREAK_BASE_DIVISOR,
  TOUGHNESS_DMG_REDUCTION,
  TOUGHNESS_UNIT,
  VULNERABILITY_CAP,
} from './constants';
import {
  defenseZone,
  effectiveResistance,
  enemyDefenseValue,
  resistanceZone,
} from './defense';
import { expectedCritZone, type ZoneKey } from './damage';
import { BREAK_BASE, ELATION_BASE, levelBase } from './tables';

export type ChainRowKey = string;

export interface ChainRow {
  key: ChainRowKey;
  factor: number | null;
}

export type BreakElement =
  | 'Physical'
  | 'Fire'
  | 'Wind'
  | 'Ice'
  | 'Thunder'
  | 'Quantum'
  | 'Imaginary';

export interface CombatZones {
  vulnerability?: number;
  dmgReduction?: number;
  resistance?: number;
  resPenetration?: number;
  defReduction?: number;
  defPenetration?: number;
  swarm?: boolean;
  attackerLevel: number;
  defenderLevel: number;
}

export interface BreakInput extends CombatZones {
  level: number;
  element: BreakElement;
  breakEffect: number;
  toughness: number;
  breakBonus?: number;
  superBreak?: boolean;
  superBreakBonus?: number;
  superToughness?: number;
}

export interface BreakBreakdown {
  base: number;
  elementZone: number;
  breakEffectZone: number;
  lengthZone: number;
  breakBonusZone: number;
  vulnerabilityZone: number;
  defenseZone: number;
  resistanceZone: number;
  reductionZone: number;
  toughnessZone: number;
  total: number;
  rows: ChainRow[];
}

export interface ElationInput extends CombatZones {
  level: number;
  multiplier: number;
  elation: number;
  joke: number;
  laugh?: number;
  critRate: number;
  critDmg: number;
}

export interface ElationBreakdown {
  base: number;
  multiplierZone: number;
  elationZone: number;
  jokeZone: number;
  critZone: number;
  critExpectedZone: number;
  laughZone: number;
  vulnerabilityZone: number;
  defenseZone: number;
  resistanceZone: number;
  toughnessZone: number;
  reductionZone: number;
  total: number;
  expectedTotal: number;
  rows: ChainRow[];
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegative(value: number | undefined): number {
  return Math.max(0, finiteOr(value, 0));
}

function vulnerabilityFactor(value: number | undefined): number {
  return Math.min(VULNERABILITY_CAP, 1 + nonNegative(value));
}

function reductionFactor(value: number | undefined): number {
  return 1 - Math.min(DMG_REDUCTION_CAP, nonNegative(value));
}

function defenseFactor(zones: CombatZones): number {
  const value = enemyDefenseValue(zones.defenderLevel, {
    defReduction: zones.defReduction,
    defPenetration: zones.defPenetration,
    swarm: zones.swarm,
  });
  return defenseZone(zones.attackerLevel, value);
}

function resistanceFactor(zones: CombatZones): number {
  const value = effectiveResistance({
    base: zones.resistance,
    penetration: zones.resPenetration,
  });
  return resistanceZone(value);
}

function elementFactor(element: BreakElement): number {
  const value = BREAK_ELEMENT_MULTIPLIER[element];
  return Number.isFinite(value) ? value : 1;
}

function chainTotal(base: number, rows: ChainRow[]): number {
  return rows.reduce((total, row) => (row.factor == null ? total : total * row.factor), base);
}

export function breakBreakdown(input: BreakInput): BreakBreakdown {
  const superBreak = input.superBreak === true;
  const rawBase = levelBase(BREAK_BASE, input.level);
  const base = superBreak ? rawBase / SUPER_BREAK_BASE_DIVISOR : rawBase;
  const elementZone = superBreak ? 1 : elementFactor(input.element);
  const breakEffectZone = 1 + finiteOr(input.breakEffect, 0);
  const lengthZone = superBreak
    ? 1
    : (nonNegative(input.toughness) / TOUGHNESS_UNIT + BREAK_LENGTH_OFFSET) / BREAK_LENGTH_DIVISOR;
  const superToughnessZone = nonNegative(input.superToughness);
  const breakBonusZone =
    1 + finiteOr(superBreak ? input.superBreakBonus : input.breakBonus, 0);
  const vulnerabilityZone = vulnerabilityFactor(input.vulnerability);
  const defenseZoneValue = defenseFactor(input);
  const resistanceZoneValue = resistanceFactor(input);
  const reductionZone = reductionFactor(input.dmgReduction);
  const toughnessZone = superBreak ? 1 : 1 - TOUGHNESS_DMG_REDUCTION;

  const shared: ChainRow[] = [
    { key: 'elementBreak', factor: elementZone },
    { key: 'breakEffect', factor: breakEffectZone },
  ];
  const tail: ChainRow[] = [
    { key: 'vuln', factor: vulnerabilityZone },
    { key: 'defense', factor: defenseZoneValue },
    { key: 'resist', factor: resistanceZoneValue },
    { key: 'reduce', factor: reductionZone },
    { key: 'toughness', factor: toughnessZone },
  ];
  const rows: ChainRow[] = superBreak
    ? [
        { key: 'breakBase', factor: null },
        ...shared,
        { key: 'superToughness', factor: superToughnessZone },
        { key: 'superBonus', factor: breakBonusZone },
        ...tail,
      ]
    : [
        { key: 'breakBase', factor: null },
        ...shared,
        { key: 'toughnessLength', factor: lengthZone },
        { key: 'breakBonus', factor: breakBonusZone },
        ...tail,
      ];

  return {
    base,
    elementZone,
    breakEffectZone,
    lengthZone,
    breakBonusZone,
    vulnerabilityZone,
    defenseZone: defenseZoneValue,
    resistanceZone: resistanceZoneValue,
    reductionZone,
    toughnessZone,
    total: chainTotal(base, rows),
    rows,
  };
}

export function elationBreakdown(input: ElationInput): ElationBreakdown {
  const base = levelBase(ELATION_BASE, input.level);
  const multiplierZone = nonNegative(input.multiplier);
  const elationZone = 1 + finiteOr(input.elation, 0);
  const jokeZone = 1 + (ELATION_JOKE_SLOPE * nonNegative(input.joke)) / ELATION_JOKE_SPAN;
  const critZone = 1 + nonNegative(input.critDmg);
  const critExpectedZone = expectedCritZone(finiteOr(input.critRate, 0), finiteOr(input.critDmg, 0));
  const laughZone = 1 + finiteOr(input.laugh, 0);
  const vulnerabilityZone = vulnerabilityFactor(input.vulnerability);
  const defenseZoneValue = defenseFactor(input);
  const resistanceZoneValue = resistanceFactor(input);
  const toughnessZone = 1 - TOUGHNESS_DMG_REDUCTION;
  const reductionZone = reductionFactor(input.dmgReduction);

  const rows: ChainRow[] = [
    { key: 'elationBase', factor: null },
    { key: 'elationMultiplier', factor: multiplierZone },
    { key: 'elationDegree', factor: elationZone },
    { key: 'joke', factor: jokeZone },
    { key: 'crit', factor: critZone },
    { key: 'laugh', factor: laughZone },
    { key: 'vuln', factor: vulnerabilityZone },
    { key: 'resist', factor: resistanceZoneValue },
    { key: 'toughness', factor: toughnessZone },
    { key: 'defense', factor: defenseZoneValue },
    { key: 'reduce', factor: reductionZone },
  ];

  const expectedRows = rows.map((row) =>
    row.key === 'crit' ? { key: row.key, factor: critExpectedZone } : row,
  );

  return {
    base,
    multiplierZone,
    elationZone,
    jokeZone,
    critZone,
    critExpectedZone,
    laughZone,
    vulnerabilityZone,
    defenseZone: defenseZoneValue,
    resistanceZone: resistanceZoneValue,
    toughnessZone,
    reductionZone,
    total: chainTotal(base, rows),
    expectedTotal: chainTotal(base, expectedRows),
    rows,
  };
}

export function trueDamage(original: number, ratio: number): { added: number; total: number } {
  const base = nonNegative(original);
  const added = base * nonNegative(ratio);
  return { added, total: base + added };
}

export function damageChainRows(
  zoneValues: Record<ZoneKey, number>,
  toughness: number,
): ChainRow[] {
  const toughnessFactor = Number.isFinite(toughness) ? Math.min(1, Math.max(0, toughness)) : 1;
  return [
    { key: 'base', factor: null },
    { key: 'modifier', factor: finiteOr(zoneValues.modifier, 1) },
    { key: 'crit', factor: finiteOr(zoneValues.crit, 1) },
    { key: 'defense', factor: finiteOr(zoneValues.defense, 1) },
    { key: 'resist', factor: finiteOr(zoneValues.resist, 1) },
    { key: 'special', factor: finiteOr(zoneValues.special, 1) },
    { key: 'toughness', factor: toughnessFactor },
  ];
}
