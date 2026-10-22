import { reactive } from 'vue';
import { TOUGHNESS_DMG_REDUCTION } from '../../lib/formula/constants';
import type { DamageInput } from '../../lib/formula/damage';

export interface FormulaInputs {
  bonus: number;
  vuln: number;
  reduce: number;
  weak: number;
  critRate: number;
  critDmg: number;
  attackerLevel: number;
  defReduction: number;
  defPenetration: number;
  resBase: number;
  resPenetration: number;
  broken: boolean;
  swarm: boolean;
}

export const formulaInputs = reactive<FormulaInputs>({
  bonus: 80,
  vuln: 0,
  reduce: 0,
  weak: 0,
  critRate: 5,
  critDmg: 50,
  attackerLevel: 80,
  defReduction: 0,
  defPenetration: 0,
  resBase: 20,
  resPenetration: 0,
  broken: false,
  swarm: false,
});

export function toughnessFactor(): number {
  return formulaInputs.broken ? 1 : 1 - TOUGHNESS_DMG_REDUCTION;
}

export function sharedDamageInput(parts: { stat: number; multiplier: number; defenderLevel: number }): DamageInput {
  const { stat, multiplier, defenderLevel } = parts;
  const inputs = formulaInputs;
  return {
    stat: Number.isFinite(stat) ? Math.max(0, stat) : 0,
    multiplier: Number.isFinite(multiplier) ? Math.max(0, multiplier) : 0,
    dmgBonus: inputs.bonus / 100,
    vulnerability: inputs.vuln / 100,
    dmgReduction: inputs.reduce / 100,
    weakness: inputs.weak / 100,
    critRate: inputs.critRate / 100,
    critDmg: inputs.critDmg / 100,
    attackerLevel: inputs.attackerLevel,
    defenderLevel,
    defReduction: inputs.defReduction / 100,
    defPenetration: inputs.defPenetration / 100,
    swarm: inputs.swarm,
    resistance: inputs.resBase / 100,
    resPenetration: inputs.resPenetration / 100,
    toughnessReduction: inputs.broken ? 0 : TOUGHNESS_DMG_REDUCTION,
  };
}
