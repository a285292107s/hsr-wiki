<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { damageChainRows } from '../../lib/formula/chains';
import { damageBreakdown } from '../../lib/formula/damage';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import NumberField from './NumberField.vue';
import SliderField from './SliderField.vue';
import ZoneFlow from './ZoneFlow.vue';
import { sharedDamageInput, toughnessFactor } from './inputs';
import { equationTerms } from './rows';

const props = defineProps<{ idx: string; stat: number; enemyLevel: number }>();

type BaseSource = 'stat' | 'flat';

const SOURCE_KEYS: Record<BaseSource, string> = {
  stat: 'formula.added.sourceStat',
  flat: 'formula.added.sourceFlat',
};

const SOURCES = Object.keys(SOURCE_KEYS) as BaseSource[];

const POINTS = [
  'formula.added.ruleNoAttack',
  'formula.added.ruleFullZones',
  'formula.added.ruleAttackType',
  'formula.added.ruleVsTrue',
];

const LABELS = { base: 'formula.row.addedBase' };

const source = ref<BaseSource>('stat');
const stat = ref(0);
const multiplierPct = ref(50);
const flat = ref(1000);

watch(() => props.stat, (value) => {
  const next = Math.round(Math.max(0, value) * 10) / 10;
  if (next > 0) stat.value = next;
}, { immediate: true });

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function text(value: number, digits: number): string {
  return fmtNumber(round(Number.isFinite(value) ? value : 0, digits));
}

const baseValue = computed(() => (source.value === 'stat' ? stat.value : flat.value));

const baseMultiplier = computed(() => (source.value === 'stat' ? multiplierPct.value / 100 : 1));

const breakdown = computed(() =>
  damageBreakdown(
    sharedDamageInput({
      stat: baseValue.value,
      multiplier: baseMultiplier.value,
      defenderLevel: props.enemyLevel,
    }),
  ),
);

const flowRows = computed(() => damageChainRows(breakdown.value.zoneValues, toughnessFactor()));

const equation = computed(() => equationTerms(flowRows.value, LABELS));

const expected = computed(() => text(breakdown.value.expectedDamage, 1));
const crit = computed(() => text(breakdown.value.critDamage, 1));
</script>

<template>
  <section id="formula-added" class="nk-formula-sec" data-sec="added">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.added') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.added.lead') }}</p>
    <p class="nk-formula-eq">
      <template v-for="(term, i) in equation" :key="`${i}-${term}`">
        <span v-if="i" class="nk-formula-eq__op" aria-hidden="true">×</span><span class="nk-formula-eq__term">{{ term }}</span>
      </template>
    </p>

    <div class="nk-formula-grid">
      <div class="nk-formula-panel nk-formula-panel--flat">
        <div class="nk-formula-summary">
          <div class="nk-formula-summary__item">
            <span class="nk-formula-zone-result__label">{{ t('formula.elation.expected') }}</span>
            <span class="nk-formula-zone-result__value" data-role="added-expected">{{ expected }}</span>
          </div>
          <div class="nk-formula-summary__item">
            <span class="nk-formula-zone-result__label">{{ t('formula.elation.result') }}</span>
            <span class="nk-formula-zone-result__value" data-role="added-crit">{{ crit }}</span>
          </div>
        </div>

        <ZoneFlow
          :base="breakdown.base"
          :rows="flowRows"
          :labels="LABELS"
          :total-label="t('formula.sec.added')"
        />
      </div>

      <div class="nk-formula-panel nk-formula-panel--flat">
        <p class="nk-formula-chainfield__label">{{ t('formula.added.baseSource') }}</p>
        <div class="nk-formula-chips" role="group" :aria-label="t('formula.added.baseSource')">
          <button
            v-for="item in SOURCES"
            :key="item"
            type="button"
            class="nk-formula-chip"
            :class="{ 'nk-formula-chip--on': source === item }"
            data-role="added-source"
            :data-value="item"
            :aria-pressed="source === item"
            @click="source = item"
          >{{ t(SOURCE_KEYS[item]) }}</button>
        </div>

        <div class="nk-formula-block">
          <div class="nk-formula-fields">
            <template v-if="source === 'stat'">
              <NumberField
                :label="t('formula.term.stat')"
                :model-value="stat"
                :min="0"
                :max="5000"
                :step="1"
                :digits="1"
                :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.stat') })"
                data-role="added-stat"
                @update:model-value="stat = $event"
              />
              <SliderField
                :label="t('formula.added.ratio')"
                :model-value="multiplierPct"
                :min="0"
                :max="200"
                :step="5"
                unit="%"
                :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.added.ratio') })"
                data-role="added-multiplier"
                @update:model-value="multiplierPct = $event"
              />
            </template>
            <NumberField
              v-else
              :label="t('formula.term.flat')"
              :model-value="flat"
              :min="0"
              :max="100000"
              :step="100"
              :digits="1"
              :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.term.flat') })"
              data-role="added-flat"
              @update:model-value="flat = $event"
            />
          </div>
          <p class="nk-formula-note">{{ t('formula.added.baseNote') }}</p>
        </div>

        <div class="nk-formula-brief">
          <h3 class="nk-formula-sub">{{ t('formula.break.mechTitle') }}</h3>
          <ul class="nk-formula-points">
            <li v-for="key in POINTS" :key="key" class="nk-formula-point">{{ t(key) }}</li>
          </ul>
        </div>
        <p class="nk-formula-note">{{ t('formula.added.exception') }}</p>
      </div>
    </div>
  </section>
</template>
