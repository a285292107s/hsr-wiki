<script setup lang="ts">
import { computed, ref } from 'vue';
import { breakBreakdown } from '../../lib/formula/chains';
import type { BreakElement, BreakInput } from '../../lib/formula/chains';
import { elemLabel } from '../../lib/enum-labels';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import NumberField from './NumberField.vue';
import SliderField from './SliderField.vue';
import ZoneFlow from './ZoneFlow.vue';
import { formulaInputs } from './inputs';
import { equationTerms } from './rows';

const props = defineProps<{ idx: string; enemyLevel: number }>();

const ELEMENTS: BreakElement[] = ['Physical', 'Fire', 'Wind', 'Ice', 'Thunder', 'Quantum', 'Imaginary'];
const TOUGHNESS_OPTIONS = [30, 60, 90, 180, 360];
const EFFECT_ROWS: { element: BreakElement; key: string }[] = [
  { element: 'Physical', key: 'formula.break.effectPhysical' },
  { element: 'Fire', key: 'formula.break.effectFire' },
  { element: 'Thunder', key: 'formula.break.effectThunder' },
  { element: 'Wind', key: 'formula.break.effectWind' },
  { element: 'Ice', key: 'formula.break.effectIce' },
  { element: 'Quantum', key: 'formula.break.effectQuantum' },
  { element: 'Imaginary', key: 'formula.break.effectImaginary' },
];
const MECH_POINTS = [
  'formula.break.mechToughness',
  'formula.break.mechReduction',
  'formula.break.mechDelay',
];
const SUPER_POINTS = ['formula.break.superTrigger', 'formula.break.superRule'];
const SUPER_EQUATION = [
  'formula.break.eqSuperBase',
  'formula.row.superToughness',
  'formula.row.breakEffect',
  'formula.row.superBonus',
  'formula.row.vuln',
  'formula.row.defense',
  'formula.row.resist',
  'formula.row.reduce',
];
const LABELS: Record<string, string> = {
  defense: 'formula.row.defense',
  resist: 'formula.row.resist',
  toughness: 'formula.row.toughnessCheck',
};

const inputs = formulaInputs;
const element = ref<BreakElement>('Physical');
const toughness = ref(60);
const breakEffect = ref(200);
const breakBonus = ref(0);
const superBreak = ref(false);
const superToughness = ref(20);
const superBonus = ref(0);

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const zones = computed(() => ({
  vulnerability: inputs.vuln / 100,
  dmgReduction: inputs.reduce / 100,
  resistance: inputs.resBase / 100,
  resPenetration: inputs.resPenetration / 100,
  defReduction: inputs.defReduction / 100,
  defPenetration: inputs.defPenetration / 100,
  swarm: inputs.swarm,
  attackerLevel: inputs.attackerLevel,
  defenderLevel: props.enemyLevel,
}));

const normalInput = computed<BreakInput>(() => ({
  ...zones.value,
  level: inputs.attackerLevel,
  element: element.value,
  breakEffect: breakEffect.value / 100,
  toughness: toughness.value,
  breakBonus: breakBonus.value / 100,
}));

const breakResult = computed(() => breakBreakdown(normalInput.value));

const superInput = computed<BreakInput>(() => ({
  ...zones.value,
  level: inputs.attackerLevel,
  element: element.value,
  breakEffect: breakEffect.value / 100,
  toughness: toughness.value,
  superBreak: true,
  superToughness: superToughness.value,
  superBreakBonus: superBonus.value / 100,
}));

const superResult = computed(() => breakBreakdown(superInput.value));

const lengthFactor = computed(() => `×${text(breakResult.value.lengthZone, 3)}`);
const breakTotal = computed(() => text(breakResult.value.total, 1));
const superTotal = computed(() => text(superResult.value.total, 1));
const normalEquation = computed(() => equationTerms(breakResult.value.rows, LABELS));
const superEquationTerms = computed(() => SUPER_EQUATION.map((key) => t(key)));

function elementName(id: BreakElement): string {
  return elemLabel(id);
}

function toggleSuper(): void {
  superBreak.value = !superBreak.value;
}
</script>

<template>
  <section id="formula-break" class="nk-formula-sec" data-sec="break">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.break') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.break.lead') }}</p>

    <div class="nk-formula-chain-block">
      <h3 class="nk-formula-card__title">{{ t('formula.break.normalTitle') }}</h3>
      <p class="nk-formula-eq">
        <template v-for="(term, i) in normalEquation" :key="`${i}-${term}`">
          <span v-if="i" class="nk-formula-eq__op" aria-hidden="true">×</span><span class="nk-formula-eq__term">{{ term }}</span>
        </template>
      </p>
      <div class="nk-formula-grid">
        <div class="nk-formula-panel nk-formula-panel--flat">
          <div class="nk-formula-zone-result nk-formula-zone-result--head">
            <span class="nk-formula-zone-result__label">{{ t('formula.break.result') }}</span>
            <span class="nk-formula-zone-result__value" data-role="break-total">{{ breakTotal }}</span>
          </div>
          <ZoneFlow
            :base="breakResult.base"
            :rows="breakResult.rows"
            :labels="LABELS"
            :total-label="t('formula.break.result')"
          />
        </div>

        <div class="nk-formula-panel nk-formula-panel--flat">
          <p class="nk-formula-chainfield__label">{{ t('formula.break.element') }}</p>
          <div class="nk-formula-chips" role="group" :aria-label="t('formula.break.element')">
            <button
              v-for="item in ELEMENTS"
              :key="item"
              type="button"
              class="nk-formula-chip"
              :class="{ 'nk-formula-chip--on': element === item }"
              data-role="break-element"
              :data-value="item"
              :aria-pressed="element === item"
              @click="element = item"
            >{{ elementName(item) }}</button>
          </div>

          <div class="nk-formula-fields">
            <NumberField
              :label="t('formula.break.level')"
              :model-value="inputs.attackerLevel"
              :min="1"
              :max="80"
              :step="1"
              :digits="0"
              :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.break.level') })"
              data-role="break-level"
              @update:model-value="inputs.attackerLevel = $event"
            />
          </div>

          <p class="nk-formula-chainfield__label">{{ t('formula.break.toughnessChips') }}</p>
          <div class="nk-formula-chips" role="group" :aria-label="t('formula.break.toughnessChips')">
            <button
              v-for="item in TOUGHNESS_OPTIONS"
              :key="item"
              type="button"
              class="nk-formula-chip"
              :class="{ 'nk-formula-chip--on': toughness === item }"
              data-role="break-toughness"
              :data-value="item"
              :aria-pressed="toughness === item"
              @click="toughness = item"
            >{{ item }}</button>
            <span class="nk-formula-chainfield__readout" data-role="break-length">
              {{ t('formula.break.toughnessFactor') }} {{ lengthFactor }}
            </span>
          </div>

          <div class="nk-formula-fields">
            <SliderField
              :label="t('formula.break.breakEffect')"
              :model-value="breakEffect"
              :min="0"
              :max="500"
              :step="5"
              unit="%"
              :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.break.breakEffect') })"
              data-role="break-effect"
              @update:model-value="breakEffect = $event"
            />
            <SliderField
              :label="t('formula.break.breakBonus')"
              :model-value="breakBonus"
              :min="0"
              :max="100"
              :step="1"
              unit="%"
              :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.break.breakBonus') })"
              data-role="break-bonus"
              @update:model-value="breakBonus = $event"
            />
          </div>

          <p class="nk-formula-note">{{ t('formula.break.noCrit') }}</p>
          <p class="nk-formula-note">{{ t('formula.break.noBonus') }}</p>
          <p class="nk-formula-note">{{ t('formula.break.lengthNote') }}</p>
        </div>
      </div>
      <div class="nk-formula-brief">
        <h3 class="nk-formula-sub">{{ t('formula.break.mechTitle') }}</h3>
        <ul class="nk-formula-points">
          <li v-for="key in MECH_POINTS" :key="key" class="nk-formula-point">{{ t(key) }}</li>
        </ul>
      </div>
      <div class="nk-formula-effects">
        <h3 class="nk-formula-sub">{{ t('formula.break.effectTitle') }}</h3>
        <dl class="nk-formula-effects__rows">
          <div v-for="row in EFFECT_ROWS" :key="row.key" class="nk-formula-effects__row" :data-effect="row.element">
            <dt class="nk-formula-effects__name">{{ elementName(row.element) }}</dt>
            <dd class="nk-formula-effects__value">{{ t(row.key) }}</dd>
          </div>
        </dl>
        <p class="nk-formula-note">{{ t('formula.break.effectNote') }}</p>
      </div>
    </div>

    <div class="nk-formula-chain-block">
      <div class="nk-formula-card__head">
        <h3 class="nk-formula-card__title">{{ t('formula.break.superTitle') }}</h3>
        <button
          type="button"
          class="nk-formula-switch"
          :class="{ 'nk-formula-switch--on': superBreak }"
          role="switch"
          :aria-checked="superBreak"
          data-role="super-break"
          @click="toggleSuper"
        >
          <span class="nk-formula-switch__label">{{ t('formula.break.superBreak') }}</span>
          <span class="nk-formula-switch__state">{{ superBreak ? t('formula.status.on') : t('formula.status.off') }}</span>
        </button>
      </div>

      <p class="nk-formula-eq">
        <template v-for="(term, i) in superEquationTerms" :key="`${i}-${term}`">
          <span v-if="i" class="nk-formula-eq__op" aria-hidden="true">×</span><span class="nk-formula-eq__term">{{ term }}</span>
        </template>
      </p>
      <ul class="nk-formula-points">
        <li v-for="key in SUPER_POINTS" :key="key" class="nk-formula-point">{{ t(key) }}</li>
      </ul>

      <template v-if="superBreak">
        <div class="nk-formula-grid">
          <div class="nk-formula-panel nk-formula-panel--flat">
            <div class="nk-formula-fields">
              <SliderField
                :label="t('formula.break.superToughness')"
                :model-value="superToughness"
                :min="5"
                :max="100"
                :step="5"
                :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.break.superToughness') })"
                data-role="super-toughness"
                @update:model-value="superToughness = $event"
              />
              <SliderField
                :label="t('formula.break.superBonus')"
                :model-value="superBonus"
                :min="0"
                :max="300"
                :step="5"
                unit="%"
                :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.break.superBonus') })"
                data-role="super-bonus"
                @update:model-value="superBonus = $event"
              />
            </div>
          </div>

          <div class="nk-formula-panel nk-formula-panel--flat">
            <div class="nk-formula-zone-result nk-formula-zone-result--head">
              <span class="nk-formula-zone-result__label">{{ t('formula.break.superResult') }}</span>
              <span class="nk-formula-zone-result__value" data-role="super-break-total">{{ superTotal }}</span>
            </div>
            <ZoneFlow
              :base="superResult.base"
              :rows="superResult.rows"
              :labels="LABELS"
              :total-label="t('formula.break.superResult')"
            />
          </div>
        </div>
      </template>
      <p v-else class="nk-formula-note">{{ t('formula.break.superOff') }}</p>
    </div>
  </section>
</template>
