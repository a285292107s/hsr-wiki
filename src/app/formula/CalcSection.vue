<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { damageChainRows } from '../../lib/formula/chains';
import { damageBreakdown } from '../../lib/formula/damage';
import { defenseZone, enemyDefenseValue } from '../../lib/formula/defense';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import NumberField from './NumberField.vue';
import ZoneFlow from './ZoneFlow.vue';
import { formulaInputs, sharedDamageInput, toughnessFactor } from './inputs';

const props = defineProps<{
  idx: string;
  attack: number;
  defenderLevel: number;
}>();

const emit = defineEmits<{ 'update:defenderLevel': [value: number] }>();

const RES_PRESETS = [0, 20, 40, 60];

const inputs = formulaInputs;
const stat = ref(Math.max(0, Math.round(props.attack * 10) / 10));
const multiplierPct = ref(200);

watch(() => props.attack, (value) => {
  if (Number.isFinite(value) && value > 0) stat.value = Math.round(value * 10) / 10;
});

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const multiplier = computed(() => multiplierPct.value / 100);

const breakdown = computed(() =>
  damageBreakdown(
    sharedDamageInput({
      stat: stat.value,
      multiplier: multiplier.value,
      defenderLevel: props.defenderLevel,
    }),
  ),
);

const result = computed(() => text(breakdown.value.expectedDamage, 1));

const flowRows = computed(() => damageChainRows(breakdown.value.zoneValues, toughnessFactor()));

const toughnessText = computed(() =>
  inputs.broken ? t('formula.status.broken') : t('formula.status.unbroken'),
);

const toughnessFactorText = computed(() => `×${text(toughnessFactor(), 2)}`);

const swarmText = computed(() => (inputs.swarm ? t('formula.status.on') : t('formula.status.off')));

const defReductionRatio = computed(() => inputs.defReduction / 100 + inputs.defPenetration / 100);

const defZoneNormal = computed(() =>
  defenseZone(
    inputs.attackerLevel,
    enemyDefenseValue(props.defenderLevel, { defReduction: defReductionRatio.value }),
  ),
);

const defZoneSwarm = computed(() =>
  defenseZone(
    inputs.attackerLevel,
    enemyDefenseValue(props.defenderLevel, { defReduction: defReductionRatio.value, swarm: true }),
  ),
);

const swarmCompare = computed(
  () => `×${text(defZoneNormal.value, 3)} → ×${text(defZoneSwarm.value, 3)}`,
);

const swarmEffectParams = computed(() => ({
  normal: text(defZoneNormal.value, 3),
  swarm: text(defZoneSwarm.value, 3),
}));

function toggleBroken(): void {
  inputs.broken = !inputs.broken;
}

function toggleSwarm(): void {
  inputs.swarm = !inputs.swarm;
}
</script>

<template>
  <section id="formula-calc" class="nk-formula-sec" data-sec="calc">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.calc') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.calc.lead') }}</p>

    <div class="nk-formula-calc">
      <div class="nk-formula-calc__group nk-formula-calc__group--player">
        <h3 class="nk-formula-calc__group-title">{{ t('formula.calc.groupPlayer') }}</h3>
        <div class="nk-formula-fields">
          <NumberField
            :label="t('formula.term.attackerLevel')"
            :model-value="inputs.attackerLevel"
            :min="1"
            :max="80"
            :step="1"
            :digits="0"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.attackerLevel') })"
            data-role="attacker-level"
            @update:model-value="inputs.attackerLevel = $event"
          />
          <NumberField
            :label="t('formula.calc.panelStat')"
            :model-value="stat"
            :min="0"
            :max="5000"
            :step="1"
            :digits="1"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.calc.panelStat') })"
            data-role="stat"
            @update:model-value="stat = $event"
          />
          <NumberField
            :label="t('formula.term.multiplier')"
            :model-value="multiplierPct"
            :min="0"
            :max="2000"
            :step="10"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.multiplier') })"
            data-role="multiplier"
            @update:model-value="multiplierPct = $event"
          />
          <NumberField
            :label="t('formula.term.dmgBonus')"
            :model-value="inputs.bonus"
            :min="0"
            :max="300"
            :step="5"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.dmgBonus') })"
            data-role="bonus"
            @update:model-value="inputs.bonus = $event"
          />
          <NumberField
            :label="t('formula.term.critRate')"
            :model-value="inputs.critRate"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.critRate') })"
            data-role="crit-rate"
            @update:model-value="inputs.critRate = $event"
          />
          <NumberField
            :label="t('formula.term.critDmg')"
            :model-value="inputs.critDmg"
            :min="0"
            :max="500"
            :step="5"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.critDmg') })"
            data-role="crit-dmg"
            @update:model-value="inputs.critDmg = $event"
          />
          <NumberField
            :label="t('formula.term.defReduction')"
            :model-value="inputs.defReduction"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.defReduction') })"
            data-role="def-reduction"
            @update:model-value="inputs.defReduction = $event"
          />
          <NumberField
            :label="t('formula.term.defPenetration')"
            :model-value="inputs.defPenetration"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.defPenetration') })"
            data-role="def-penetration"
            @update:model-value="inputs.defPenetration = $event"
          />
          <NumberField
            :label="t('formula.term.resPenetration')"
            :model-value="inputs.resPenetration"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.resPenetration') })"
            data-role="res-penetration"
            @update:model-value="inputs.resPenetration = $event"
          />
        </div>
      </div>

      <div class="nk-formula-calc__group nk-formula-calc__group--enemy">
        <h3 class="nk-formula-calc__group-title">{{ t('formula.calc.groupEnemy') }}</h3>
        <div class="nk-formula-fields">
          <NumberField
            :label="t('formula.term.defenderLevel')"
            :model-value="defenderLevel"
            :min="1"
            :max="100"
            :step="1"
            :digits="0"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.defenderLevel') })"
            data-role="defender-level"
            @update:model-value="emit('update:defenderLevel', $event)"
          />
          <NumberField
            :label="t('formula.term.vulnerability')"
            :model-value="inputs.vuln"
            :min="0"
            :max="300"
            :step="5"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.vulnerability') })"
            data-role="vuln"
            @update:model-value="inputs.vuln = $event"
          />
          <NumberField
            :label="t('formula.term.dmgReduction')"
            :model-value="inputs.reduce"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.dmgReduction') })"
            data-role="reduce"
            @update:model-value="inputs.reduce = $event"
          />
          <NumberField
            :label="t('formula.term.weakness')"
            :model-value="inputs.weak"
            :min="0"
            :max="100"
            :step="1"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.weakness') })"
            data-role="weak"
            @update:model-value="inputs.weak = $event"
          />
          <NumberField
            :label="t('formula.term.resistance')"
            :model-value="inputs.resBase"
            :min="-100"
            :max="90"
            :step="5"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.resistance') })"
            data-role="res-base"
            @update:model-value="inputs.resBase = $event"
          />
        </div>

        <div class="nk-formula-chips">
          <span class="nk-formula-chips__label">{{ t('formula.calc.resPreset') }}</span>
          <button
            v-for="preset in RES_PRESETS"
            :key="preset"
            type="button"
            class="nk-formula-chip"
            :class="{ 'nk-formula-chip--on': inputs.resBase === preset }"
            data-role="res-preset"
            :data-value="preset"
            :aria-pressed="inputs.resBase === preset"
            @click="inputs.resBase = preset"
          >{{ preset }}%</button>
        </div>

        <div class="nk-formula-effect">
          <button
            type="button"
            class="nk-formula-switch"
            :class="{ 'nk-formula-switch--on': inputs.broken }"
            role="switch"
            :aria-checked="inputs.broken"
            data-role="broken"
            @click="toggleBroken"
          >
            <span class="nk-formula-switch__label">{{ t('formula.calc.toughness') }}</span>
            <span class="nk-formula-switch__state">{{ toughnessText }}</span>
            <span class="nk-formula-switch__hint" data-role="toughness-factor">{{ toughnessFactorText }}</span>
          </button>
          <p class="nk-formula-note">{{ t('formula.calc.toughnessEffect') }}</p>
        </div>

        <div class="nk-formula-effect">
          <button
            type="button"
            class="nk-formula-switch"
            :class="{ 'nk-formula-switch--on': inputs.swarm }"
            role="switch"
            :aria-checked="inputs.swarm"
            data-role="swarm"
            @click="toggleSwarm"
          >
            <span class="nk-formula-switch__label">{{ t('formula.calc.swarm') }}</span>
            <span class="nk-formula-switch__state">{{ swarmText }}</span>
            <span class="nk-formula-switch__hint" data-role="swarm-compare">{{ swarmCompare }}</span>
          </button>
          <p class="nk-formula-note">{{ t('formula.calc.swarmEffect', swarmEffectParams) }}</p>
        </div>
      </div>

      <div class="nk-formula-calc__output">
        <div class="nk-formula-calc__head">
          <span class="nk-formula-total__label">{{ t('formula.calc.result') }}</span>
          <span class="nk-formula-calc__result">{{ result }}</span>
        </div>

        <div class="nk-formula-calc__meta">
          <span class="nk-formula-factor">
            <i class="nk-formula-factor__label">{{ t('formula.term.attackerLevel') }}</i>
            <b class="nk-formula-factor__value">{{ fmtNumber(inputs.attackerLevel) }}</b>
          </span>
          <span class="nk-formula-factor">
            <i class="nk-formula-factor__label">{{ t('formula.term.defenderLevel') }}</i>
            <b class="nk-formula-factor__value">{{ fmtNumber(defenderLevel) }}</b>
          </span>
          <span class="nk-formula-factor">
            <i class="nk-formula-factor__label">{{ t('formula.calc.toughness') }}</i>
            <b class="nk-formula-factor__value">{{ toughnessText }}</b>
          </span>
        </div>
      </div>

      <div class="nk-formula-calc__ledger">
        <h3 class="nk-formula-sub">{{ t('formula.ledger.title') }}</h3>
        <ZoneFlow
          :base="breakdown.base"
          :rows="flowRows"
          :total-label="t('formula.calc.result')"
        />
      </div>
    </div>
  </section>
</template>
