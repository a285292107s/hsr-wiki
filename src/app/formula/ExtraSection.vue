<script setup lang="ts">
import { computed, ref } from 'vue';
import { breakToughness, effectChance } from '../../lib/formula/combat';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import SliderField from './SliderField.vue';

defineProps<{ idx: string }>();

const baseToughness = ref(1);
const breakEfficiency = ref(0);
const baseChance = ref(100);
const effectHit = ref(0);
const effectRes = ref(30);
const targetChance = ref(100);

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const breakValue = computed(() => breakToughness(baseToughness.value, breakEfficiency.value / 100));
const chanceValue = computed(() => effectChance({
  base: baseChance.value / 100,
  effectHit: effectHit.value / 100,
  effectRes: effectRes.value / 100,
}));
const chancePct = computed(() => Math.max(0, Math.min(100, round(chanceValue.value * 100, 1))));

const targetPct = computed(() => Math.min(100, Math.max(0, targetChance.value)));

const neededHit = computed(() => {
  const denom = (baseChance.value / 100) * (1 - Math.min(1, Math.max(0, effectRes.value / 100)));
  if (denom <= 0) return null;
  const need = targetPct.value / 100 / denom - 1;
  return Math.max(0, round(need * 100, 1));
});

const neededHitText = computed(() => {
  const need = neededHit.value;
  if (need == null) return '-';
  return `${text(need, 1)}%`;
});

const reverseReached = computed(() => neededHit.value != null && neededHit.value <= effectHit.value);
</script>

<template>
  <section id="formula-extra" class="nk-formula-sec" data-sec="extra">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.extra') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.extra.lead') }}</p>

    <div class="nk-formula-cards">
      <article class="nk-formula-card">
        <h3 class="nk-formula-card__title">{{ t('formula.extra.baseToughness') }}</h3>
        <p class="nk-formula-card__formula">{{ t('formula.extra.breakFormula') }}</p>
        <div class="nk-formula-zone-result">
          <span class="nk-formula-zone-result__label">{{ t('formula.extra.breakValue') }}</span>
          <span class="nk-formula-break__value">{{ text(breakValue, 2) }}</span>
        </div>
        <div class="nk-formula-fields">
          <SliderField
            :label="t('formula.extra.baseToughness')"
            :model-value="baseToughness"
            :min="0.5"
            :max="10"
            :step="0.5"
            :digits="1"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.extra.baseToughness') })"
            data-role="base-toughness"
            @update:model-value="baseToughness = $event"
          />
          <SliderField
            :label="t('formula.term.breakEfficiency')"
            :model-value="breakEfficiency"
            :min="0"
            :max="200"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.breakEfficiency') })"
            data-role="break-efficiency"
            @update:model-value="breakEfficiency = $event"
          />
        </div>
        <p class="nk-formula-note">{{ t('formula.extra.breakUnit') }}</p>
        <p class="nk-formula-note">{{ t('formula.extra.breakNote') }}</p>
        <p class="nk-formula-note">{{ t('formula.extra.breakBoostNote') }}</p>
      </article>

      <article class="nk-formula-card">
        <h3 class="nk-formula-card__title">{{ t('formula.term.effectChance') }}</h3>
        <p class="nk-formula-card__formula">{{ t('formula.extra.chanceFormula') }}</p>
        <div class="nk-formula-zone-result">
          <span class="nk-formula-zone-result__label">{{ t('formula.extra.chanceResult') }}</span>
          <span class="nk-formula-chance__value">{{ text(chancePct, 1) }}%</span>
        </div>
        <div class="nk-formula-chance__track">
          <div class="nk-formula-chance__fill" :style="{ width: `${chancePct}%` }"></div>
        </div>

        <div class="nk-formula-fields">
          <SliderField
            :label="t('formula.term.effectChance')"
            :model-value="baseChance"
            :min="0"
            :max="100"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.effectChance') })"
            data-role="base-chance"
            @update:model-value="baseChance = $event"
          />
          <SliderField
            :label="t('formula.term.effectHit')"
            :model-value="effectHit"
            :min="0"
            :max="300"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.effectHit') })"
            data-role="effect-hit"
            @update:model-value="effectHit = $event"
          />
          <SliderField
            :label="t('formula.term.effectRes')"
            :model-value="effectRes"
            :min="0"
            :max="100"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.effectRes') })"
            data-role="effect-res"
            @update:model-value="effectRes = $event"
          />
          <SliderField
            :label="t('formula.extra.hitTarget')"
            :model-value="targetChance"
            :min="0"
            :max="100"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.extra.hitTarget') })"
            data-role="hit-target"
            @update:model-value="targetChance = $event"
          />
        </div>

        <div class="nk-formula-zone-result">
          <span class="nk-formula-zone-result__label">{{ t('formula.extra.hitReverse') }}</span>
          <span class="nk-formula-chance__need" data-role="hit-reverse">{{ neededHitText }}</span>
          <span v-if="reverseReached" class="nk-formula-hint" data-state="met">{{ t('formula.speed.needMet') }}</span>
        </div>
        <p class="nk-formula-note">{{ t('formula.extra.hitReverseNote') }}</p>
        <p class="nk-formula-note">{{ t('formula.extra.chanceNote') }}</p>
      </article>
    </div>
  </section>
</template>
