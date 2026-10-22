import {
  DMG_REDUCTION_CAP,
  TOUGHNESS_DMG_REDUCTION,
  VULNERABILITY_CAP,
  WEAKNESS_FLOOR,
} from './constants';
import {
  defenseZone,
  effectiveResistance,
  enemyDefenseValue,
  resistanceZone,
} from './defense';

export type ZoneKey = 'base' | 'modifier' | 'crit' | 'defense' | 'resist' | 'special';

export interface DamageInput {
  stat: number;
  multiplier: number;
  flat?: number;
  dmgBonus?: number;
  vulnerability?: number;
  dmgReduction?: number;
  dmgReductions?: number[];
  weakness?: number;
  critRate?: number;
  critDmg?: number;
  attackerLevel: number;
  defenderLevel: number;
  defReduction?: number;
  defPenetration?: number;
  defModify?: number;
  swarm?: boolean;
  resistance?: number;
  resBonus?: number;
  resReduction?: number;
  resPenetration?: number;
  toughnessReduction?: number;
  specialBonus?: number;
  specialVulnerability?: number;
}

export interface DamageBreakdown {
  base: number;
  bonusZone: number;
  vulnerabilityZone: number;
  reductionZone: number;
  weaknessZone: number;
  modifierZone: number;
  critZone: number;
  critExpectedZone: number;
  defenseValue: number;
  defenseZone: number;
  resistanceValue: number;
  resistanceZone: number;
  specialZone: number;
  critDamage: number;
  expectedDamage: number;
  zoneValues: Record<ZoneKey, number>;
}

export interface ZoneLedgerRow {
  key: ZoneKey;
  factor: number;
  delta: number;
}

const ZONE_KEYS: readonly ZoneKey[] = ['base', 'modifier', 'crit', 'defense', 'resist', 'special'];

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegative(value: number | undefined): number {
  return Math.max(0, finiteOr(value, 0));
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function reductionProduct(values: number[]): number {
  return values.reduce((product, value) => product * (1 - Math.max(0, finiteOr(value, 0))), 1);
}

export function zoneLedger(zones: Record<ZoneKey, number>): ZoneLedgerRow[] {
  const rows = ZONE_KEYS.map((key) => {
    const factor = Number.isFinite(zones[key]) ? zones[key] : 1;
    return { key, factor, delta: factor - 1 };
  });
  return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function expectedCritZone(critRate: number, critDmg: number): number {
  return 1 + clampUnit(finiteOr(critRate, 0)) * nonNegative(critDmg);
}

export function critShare(critRate: number, critDmg: number): number {
  const expected = expectedCritZone(critRate, critDmg);
  return (expected - 1) / expected;
}

export function damageBreakdown(input: DamageInput): DamageBreakdown {
  const base = finiteOr(input.stat, 0) * finiteOr(input.multiplier, 0) + finiteOr(input.flat, 0);

  const bonusZone = 1 + nonNegative(input.dmgBonus);
  const vulnerabilityZone = Math.min(VULNERABILITY_CAP, 1 + nonNegative(input.vulnerability));
  const reductionZone = input.dmgReductions?.length
    ? Math.max(1 - DMG_REDUCTION_CAP, reductionProduct(input.dmgReductions))
    : 1 - Math.min(DMG_REDUCTION_CAP, nonNegative(input.dmgReduction));
  const weaknessZone = Math.max(WEAKNESS_FLOOR, 1 - nonNegative(input.weakness));
  const modifierZone = bonusZone * vulnerabilityZone * reductionZone * weaknessZone;

  const critZone = 1 + nonNegative(input.critDmg);
  const critExpectedZone = expectedCritZone(finiteOr(input.critRate, 0), finiteOr(input.critDmg, 0));

  const defenseValue = enemyDefenseValue(input.defenderLevel, {
    defReduction: input.defReduction,
    defPenetration: input.defPenetration,
    defModify: input.defModify,
    swarm: input.swarm,
  });
  const defenseZoneValue = defenseZone(input.attackerLevel, defenseValue);

  const resistanceValue = effectiveResistance({
    base: input.resistance,
    bonus: input.resBonus,
    reduction: input.resReduction,
    penetration: input.resPenetration,
  });
  const resistanceZoneValue = resistanceZone(resistanceValue);

  const specialZone =
    (1 + finiteOr(input.specialBonus, 0)) * (1 + finiteOr(input.specialVulnerability, 0));

  const toughnessReduction = clampUnit(
    finiteOr(input.toughnessReduction, TOUGHNESS_DMG_REDUCTION),
  );
  const toughnessMultiplier = 1 - toughnessReduction;

  const critDamage =
    base * modifierZone * critZone * defenseZoneValue * resistanceZoneValue * specialZone * toughnessMultiplier;
  const expectedDamage =
    base * modifierZone * critExpectedZone * defenseZoneValue * resistanceZoneValue * specialZone * toughnessMultiplier;

  const zoneValues: Record<ZoneKey, number> = {
    base,
    modifier: modifierZone,
    crit: critExpectedZone,
    defense: defenseZoneValue,
    resist: resistanceZoneValue,
    special: specialZone,
  };

  return {
    base,
    bonusZone,
    vulnerabilityZone,
    reductionZone,
    weaknessZone,
    modifierZone,
    critZone,
    critExpectedZone,
    defenseValue,
    defenseZone: defenseZoneValue,
    resistanceValue,
    resistanceZone: resistanceZoneValue,
    specialZone,
    critDamage,
    expectedDamage,
    zoneValues,
  };
}
