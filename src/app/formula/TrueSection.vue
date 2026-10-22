<script setup lang="ts">
import { computed, ref } from 'vue';
import { trueDamage } from '../../lib/formula/chains';
import { damageBreakdown } from '../../lib/formula/damage';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import NumberField from './NumberField.vue';
import { formulaInputs, sharedDamageInput } from './inputs';

const props = defineProps<{ idx: string; enemyLevel: number }>();

const RULES = [
  'formula.true.noElement',
  'formula.true.derived',
  'formula.true.noZone',
  'formula.true.notAttack',
  'formula.true.notLethal',
];

const inputs = formulaInputs;
const original = ref(1000);
const ratio = ref(20);

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const result = computed(() => trueDamage(Math.max(0, original.value), Math.max(0, ratio.value) / 100));

const added = computed(() => text(result.value.added, 1));
const total = computed(() => text(result.value.total, 1));
const gainText = computed(() => `+${text(Math.max(0, ratio.value), 1)}%`);

const directInput = computed(() =>
  sharedDamageInput({ stat: 1, multiplier: 1, defenderLevel: props.enemyLevel }),
);

const directDamage = computed(() => damageBreakdown(directInput.value).expectedDamage);

const boostedDamage = computed(() =>
  damageBreakdown({
    ...directInput.value,
    dmgBonus: (inputs.bonus + Math.max(0, ratio.value)) / 100,
  }).expectedDamage,
);

const bonusGain = computed(() => {
  const base = directDamage.value;
  if (!Number.isFinite(base) || base <= 0) return 0;
  const next = boostedDamage.value;
  return Number.isFinite(next) ? Math.max(0, (next / base - 1) * 100) : 0;
});

const bonusGainText = computed(() => `+${text(bonusGain.value, 1)}%`);
</script>

<template>
  <section id="formula-true" class="nk-formula-sec" data-sec="true">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.true') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.true.lead') }}</p>
    <p class="nk-formula-eq">{{ t('formula.true.note') }}</p>

    <div class="nk-formula-grid">
      <div class="nk-formula-panel nk-formula-panel--flat">
        <ul class="nk-formula-rules">
          <li v-for="rule in RULES" :key="rule" class="nk-formula-rules__item">{{ t(rule) }}</li>
        </ul>
        <p class="nk-formula-note">{{ t('formula.true.vsPursued') }}</p>
      </div>

      <div class="nk-formula-panel nk-formula-panel--flat">
        <div class="nk-formula-fields">
          <NumberField
            :label="t('formula.true.original')"
            :model-value="original"
            :min="0"
            :max="100000"
            :step="100"
            :digits="1"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.true.original') })"
            data-role="true-original"
            @update:model-value="original = $event"
          />
          <NumberField
            :label="t('formula.true.ratio')"
            :model-value="ratio"
            :min="0"
            :max="100"
            :step="5"
            :digits="1"
            unit="%"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.true.ratio') })"
            data-role="true-ratio"
            @update:model-value="ratio = $event"
          />
        </div>

        <div class="nk-formula-readouts">
          <div class="nk-formula-readout">
            <span class="nk-formula-readout__label">{{ t('formula.true.added') }}</span>
            <span class="nk-formula-readout__value" data-role="true-added">{{ added }}</span>
          </div>
          <div class="nk-formula-readout">
            <span class="nk-formula-readout__label">{{ t('formula.true.total') }}</span>
            <span class="nk-formula-readout__value" data-role="true-total">{{ total }}</span>
          </div>
          <div class="nk-formula-readout">
            <span class="nk-formula-readout__label">{{ t('formula.true.gain') }}</span>
            <span class="nk-formula-readout__value" data-role="true-gain">{{ gainText }}</span>
          </div>
        </div>

        <h3 class="nk-formula-sub">{{ t('formula.true.compareTitle') }}</h3>
        <div class="nk-formula-compare">
          <div class="nk-formula-compare__col">
            <span class="nk-formula-compare__label">{{ t('formula.true.compareBonus') }}</span>
            <span class="nk-formula-compare__value" data-role="true-bonus-gain">{{ bonusGainText }}</span>
          </div>
          <div class="nk-formula-compare__col">
            <span class="nk-formula-compare__label">{{ t('formula.true.compareTrue') }}</span>
            <span class="nk-formula-compare__value" data-role="true-true-gain">{{ gainText }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
