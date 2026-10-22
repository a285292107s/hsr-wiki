<script setup lang="ts">
import { computed, ref } from 'vue';
import { CYCLE_AV, FIRST_CYCLE_AV, actionValue, speedNeeded, turnsInBudget } from '../../lib/formula/combat';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import SliderField from './SliderField.vue';

defineProps<{ idx: string }>();

const SPEED_MIN = 50;
const SPEED_MAX = 300;
const TWO_CYCLE_BUDGET = FIRST_CYCLE_AV + CYCLE_AV;

const speed = ref(134);
const needTurns = ref(2);

const TURN_OPTIONS = [1, 2, 3, 4];
const TWO_CYCLE_TURNS = [2, 4, 6];

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const av = computed(() => actionValue(speed.value));
const cycleTurns = computed(() => turnsInBudget(speed.value, CYCLE_AV));
const firstTurns = computed(() => turnsInBudget(speed.value, FIRST_CYCLE_AV));

const firstTable = computed(() =>
  TURN_OPTIONS.map((turns) => ({
    turns,
    label: t('formula.speed.turnsUnit', { n: turns }),
    speed: text(speedNeeded(turns, FIRST_CYCLE_AV), 2),
    reached: speed.value >= speedNeeded(turns, FIRST_CYCLE_AV),
  })),
);

const twoTable = computed(() =>
  TWO_CYCLE_TURNS.map((turns) => ({
    turns,
    label: t('formula.speed.turnsUnit', { n: turns }),
    speed: text(speedNeeded(turns, TWO_CYCLE_BUDGET), 2),
    reached: speed.value >= speedNeeded(turns, TWO_CYCLE_BUDGET),
  })),
);

const neededSpeed = computed(() => speedNeeded(needTurns.value, FIRST_CYCLE_AV));
const needMet = computed(() => speed.value >= neededSpeed.value);
const needGap = computed(() => Math.max(0, round(neededSpeed.value - speed.value, 2)));
</script>

<template>
  <section id="formula-speed" class="nk-formula-sec" data-sec="speed">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.speed') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.speed.lead') }}</p>
    <p class="nk-formula-eq">{{ t('formula.speed.formula') }}</p>

    <div class="nk-formula-stack">
      <div class="nk-formula-readouts nk-formula-readouts--wide">
        <div class="nk-formula-readout">
          <span class="nk-formula-readout__label">{{ t('formula.axis.actionValue') }}</span>
          <span class="nk-formula-speed__av">{{ text(av, 2) }}</span>
        </div>
        <div class="nk-formula-readout">
          <span class="nk-formula-readout__label">{{ t('formula.speed.turns') }}</span>
          <span class="nk-formula-speed__turns">{{ fmtNumber(cycleTurns) }}</span>
        </div>
        <div class="nk-formula-readout">
          <span class="nk-formula-readout__label">{{ t('formula.speed.firstCycle') }}</span>
          <span class="nk-formula-readout__value">{{ fmtNumber(firstTurns) }}</span>
        </div>
      </div>

      <div class="nk-formula-speed-panel">
        <SliderField
          :label="t('formula.axis.speed')"
          :model-value="speed"
          :min="SPEED_MIN"
          :max="SPEED_MAX"
          :step="1"
          :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.axis.speed') })"
          data-role="speed"
          @update:model-value="speed = $event"
        />
        <div class="nk-formula-zone-result">
          <span class="nk-formula-zone-result__label">{{ t('formula.speed.needTurns') }}</span>
          <div class="nk-formula-chips">
            <button
              v-for="turns in TURN_OPTIONS"
              :key="turns"
              type="button"
              class="nk-formula-chip"
              :class="{ 'nk-formula-chip--on': needTurns === turns }"
              data-role="need-turns"
              :data-value="turns"
              :aria-pressed="needTurns === turns"
              @click="needTurns = turns"
            >{{ t('formula.speed.turnsUnit', { n: turns }) }}</button>
          </div>
        </div>
        <div class="nk-formula-zone-result">
          <span class="nk-formula-zone-result__label">{{ t('formula.speed.needSpeed') }}</span>
          <span class="nk-formula-speed__need" data-role="need-speed">{{ text(neededSpeed, 2) }}</span>
          <span v-if="needMet" class="nk-formula-hint" data-state="met">{{ t('formula.speed.needMet') }}</span>
          <span v-else class="nk-formula-hint" data-state="gap">{{ t('formula.speed.needGap', { v: text(needGap, 2) }) }}</span>
        </div>
      </div>

      <div class="nk-formula-speed-table">
        <h3 class="nk-formula-sub">{{ t('formula.speed.thresholdTitle') }}</h3>
        <div class="nk-formula-thresholds">
          <div class="nk-formula-thresholds__group">
            <span class="nk-formula-thresholds__title">{{ t('formula.speed.tableFirst') }}</span>
            <div
              v-for="row in firstTable"
              :key="`f${row.turns}`"
              class="nk-formula-thresholds__row"
              :class="{ 'nk-formula-thresholds__row--on': row.reached }"
            >
              <span class="nk-formula-thresholds__turns">{{ row.label }}</span>
              <span class="nk-formula-thresholds__speed">{{ row.speed }}</span>
            </div>
          </div>
          <div class="nk-formula-thresholds__group">
            <span class="nk-formula-thresholds__title">{{ t('formula.speed.tableTwo') }}</span>
            <div
              v-for="row in twoTable"
              :key="`t${row.turns}`"
              class="nk-formula-thresholds__row"
              :class="{ 'nk-formula-thresholds__row--on': row.reached }"
            >
              <span class="nk-formula-thresholds__turns">{{ row.label }}</span>
              <span class="nk-formula-thresholds__speed">{{ row.speed }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="nk-formula-note">{{ t('formula.speed.cyclesNote') }}</p>
  </section>
</template>
