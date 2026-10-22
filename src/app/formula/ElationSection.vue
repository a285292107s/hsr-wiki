<script setup lang="ts">
import { computed, ref } from 'vue';
import { elationBreakdown } from '../../lib/formula/chains';
import type { ElationInput } from '../../lib/formula/chains';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import NumberField from './NumberField.vue';
import SliderField from './SliderField.vue';
import ZoneFlow from './ZoneFlow.vue';
import { formulaInputs } from './inputs';
import { equationTerms } from './rows';

const props = defineProps<{ idx: string; enemyLevel: number }>();

const LABELS: Record<string, string> = {
  crit: 'formula.row.crit',
  defense: 'formula.row.defense',
  resist: 'formula.row.resist',
  toughness: 'formula.row.toughnessCheck',
};

const inputs = formulaInputs;
const multiplier = ref(20);
const elation = ref(120);
const joke = ref(60);
const laugh = ref(0);

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

const input = computed<ElationInput>(() => ({
  ...zones.value,
  level: inputs.attackerLevel,
  multiplier: multiplier.value / 100,
  elation: elation.value / 100,
  joke: Math.max(0, joke.value),
  laugh: laugh.value / 100,
  critRate: inputs.critRate / 100,
  critDmg: inputs.critDmg / 100,
}));

const breakdown = computed(() => elationBreakdown(input.value));

const equation = computed(() => equationTerms(breakdown.value.rows, LABELS));

const critTotal = computed(() => text(breakdown.value.total, 1));
const expectedTotal = computed(() => text(breakdown.value.expectedTotal, 1));
</script>

<template>
  <section id="formula-elation" class="nk-formula-sec" data-sec="elation">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.elation') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.elation.lead') }}</p>
    <p class="nk-formula-eq">
      <template v-for="(term, i) in equation" :key="`${i}-${term}`">
        <span v-if="i" class="nk-formula-eq__op" aria-hidden="true">×</span><span class="nk-formula-eq__term">{{ term }}</span>
      </template>
    </p>

    <div class="nk-formula-grid">
      <div class="nk-formula-panel nk-formula-panel--flat">
        <div class="nk-formula-summary">
          <div class="nk-formula-summary__item">
            <span class="nk-formula-zone-result__label">{{ t('formula.elation.result') }}</span>
            <span class="nk-formula-zone-result__value" data-role="elation-total">{{ critTotal }}</span>
          </div>
          <div class="nk-formula-summary__item">
            <span class="nk-formula-zone-result__label">{{ t('formula.elation.expected') }}</span>
            <span class="nk-formula-zone-result__value" data-role="elation-expected">{{ expectedTotal }}</span>
          </div>
        </div>

        <ZoneFlow
          :base="breakdown.base"
          :rows="breakdown.rows"
          :labels="LABELS"
          :total-label="t('formula.elation.result')"
        />
      </div>

      <div class="nk-formula-panel nk-formula-panel--flat">
        <div class="nk-formula-fields">
          <NumberField
            :label="t('formula.break.level')"
            :model-value="inputs.attackerLevel"
            :min="1"
            :max="80"
            :step="1"
            :digits="0"
            :ariaLabel="t('formula.ui.fieldAria', { name: t('formula.break.level') })"
            data-role="elation-level"
            @update:model-value="inputs.attackerLevel = $event"
          />
          <SliderField
            :label="t('formula.elation.multiplier')"
            :model-value="multiplier"
            :min="0"
            :max="200"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.elation.multiplier') })"
            data-role="elation-multiplier"
            @update:model-value="multiplier = $event"
          />
          <SliderField
            :label="t('formula.elation.degree')"
            :model-value="elation"
            :min="0"
            :max="300"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.elation.degree') })"
            data-role="elation-degree"
            @update:model-value="elation = $event"
          />
          <SliderField
            :label="t('formula.elation.joke')"
            :model-value="joke"
            :min="0"
            :max="240"
            :step="5"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.elation.joke') })"
            data-role="elation-joke"
            @update:model-value="joke = $event"
          />
          <SliderField
            :label="t('formula.elation.laugh')"
            :model-value="laugh"
            :min="0"
            :max="100"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.elation.laugh') })"
            data-role="elation-laugh"
            @update:model-value="laugh = $event"
          />
          <SliderField
            :label="t('formula.term.critRate')"
            :model-value="inputs.critRate"
            :min="0"
            :max="100"
            :step="1"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.critRate') })"
            data-role="elation-crit-rate"
            @update:model-value="inputs.critRate = $event"
          />
          <SliderField
            :label="t('formula.term.critDmg')"
            :model-value="inputs.critDmg"
            :min="0"
            :max="500"
            :step="5"
            unit="%"
            :ariaLabel="t('formula.ui.sliderAria', { name: t('formula.term.critDmg') })"
            data-role="elation-crit-dmg"
            @update:model-value="inputs.critDmg = $event"
          />
        </div>

        <p class="nk-formula-chainfield__excluded" data-role="elation-not-included">
          {{ t('formula.elation.notIncluded') }}
        </p>
        <p class="nk-formula-note">{{ t('formula.elation.jokeNote') }}</p>
      </div>
    </div>
  </section>
</template>
