<script setup lang="ts">
import { computed, ref } from 'vue';
import { healAmount, shieldAmount } from '../../lib/formula/combat';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import SliderField from './SliderField.vue';

defineProps<{ idx: string }>();

const healBase = ref(1000);
const healBonus = ref(60);
const healReduce = ref(0);
const shieldBase = ref(1000);
const shieldBonus = ref(40);

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const healValue = computed(() => healAmount({
  stat: healBase.value,
  multiplier: 1,
  bonus: [healBonus.value / 100],
  reduce: [healReduce.value / 100],
}));

const shieldValue = computed(() => shieldAmount({
  stat: shieldBase.value,
  multiplier: 1,
  shieldBonus: [shieldBonus.value / 100],
}));

const healZone = computed(() => (1 + healBonus.value / 100) * (1 - healReduce.value / 100));
const shieldZone = computed(() => 1 + shieldBonus.value / 100);
</script>

<template>
  <section id="formula-heal" class="nk-formula-sec" data-sec="heal">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.heal') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.heal.lead') }}</p>

    <div class="nk-formula-cards nk-formula-cards--heal">
      <article class="nk-formula-card nk-formula-card--even">
        <h3 class="nk-formula-card__title">{{ t('formula.heal.healValue') }}</h3>
        <p class="nk-formula-card__formula">{{ t('formula.heal.baseFormula') }}</p>
        <div class="nk-formula-zone-result">
          <span class="nk-formula-heal__value">{{ text(healValue, 1) }}</span>
          <span class="nk-formula-zone-result__sub">{{ t('formula.zone.heal') }} {{ text(healZone, 3) }}</span>
        </div>
        <div class="nk-formula-fields">
          <SliderField
            :label="t('formula.heal.baseInput')"
            :model-value="healBase"
            :min="100"
            :max="5000"
            :step="50"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.heal.baseInput') })"
            data-role="heal-base"
            @update:model-value="healBase = $event"
          />
          <SliderField
            :label="t('formula.term.healBonus')"
            :model-value="healBonus"
            :min="0"
            :max="200"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.healBonus') })"
            data-role="heal-bonus"
            @update:model-value="healBonus = $event"
          />
          <SliderField
            :label="t('formula.term.healReduce')"
            :model-value="healReduce"
            :min="0"
            :max="100"
            :step="1"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.healReduce') })"
            data-role="heal-reduce"
            @update:model-value="healReduce = $event"
          />
        </div>
        <p class="nk-formula-note">{{ t('formula.heal.zoneFormula') }}</p>
      </article>

      <article class="nk-formula-card nk-formula-card--even">
        <h3 class="nk-formula-card__title">{{ t('formula.heal.shieldValue') }}</h3>
        <p class="nk-formula-card__formula">{{ t('formula.shield.baseFormula') }}</p>
        <div class="nk-formula-zone-result">
          <span class="nk-formula-shield__value">{{ text(shieldValue, 1) }}</span>
          <span class="nk-formula-zone-result__sub">{{ t('formula.zone.shield') }} {{ text(shieldZone, 3) }}</span>
        </div>
        <div class="nk-formula-fields">
          <SliderField
            :label="t('formula.shield.baseInput')"
            :model-value="shieldBase"
            :min="100"
            :max="5000"
            :step="50"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.shield.baseInput') })"
            data-role="shield-base"
            @update:model-value="shieldBase = $event"
          />
          <SliderField
            :label="t('formula.term.shieldBonus')"
            :model-value="shieldBonus"
            :min="0"
            :max="200"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.shieldBonus') })"
            data-role="shield-bonus"
            @update:model-value="shieldBonus = $event"
          />
        </div>
        <p class="nk-formula-note">{{ t('formula.heal.shieldFormula') }}</p>
      </article>
    </div>

    <p class="nk-formula-note">{{ t('formula.heal.keepNote') }}</p>
  </section>
</template>
