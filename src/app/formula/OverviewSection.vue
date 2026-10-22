<script setup lang="ts">
import { computed, ref } from 'vue';
import { damageChainRows } from '../../lib/formula/chains';
import { damageBreakdown } from '../../lib/formula/damage';
import type { ZoneKey } from '../../lib/formula/damage';
import { fmtNumber } from '../../lib/format';
import { translate as t } from '../i18n';
import ZoneFlow from './ZoneFlow.vue';
import { formulaInputs, sharedDamageInput, toughnessFactor } from './inputs';

const props = defineProps<{ idx: string; stat: number }>();

type ChainKey = ZoneKey | 'toughness';

interface ChainDef {
  key: ChainKey;
  i18n: string;
}

const CHAIN: ChainDef[] = [
  { key: 'base', i18n: 'base' },
  { key: 'modifier', i18n: 'modifier' },
  { key: 'crit', i18n: 'crit' },
  { key: 'defense', i18n: 'def' },
  { key: 'resist', i18n: 'res' },
  { key: 'special', i18n: 'special' },
  { key: 'toughness', i18n: 'toughness' },
];

const NOTE_KEYS: Record<ChainKey, string> = {
  base: 'formula.zoneNote.base',
  modifier: 'formula.zones.capNote',
  crit: 'formula.overview.noCrit',
  defense: 'formula.zones.defNote',
  resist: 'formula.zones.resNote',
  special: 'formula.zoneNote.special',
  toughness: 'formula.zoneNote.toughness',
};

const active = ref<ChainKey>('base');

const breakdown = computed(() =>
  damageBreakdown(
    sharedDamageInput({
      stat: Math.max(0, props.stat),
      multiplier: 1,
      defenderLevel: formulaInputs.attackerLevel,
    }),
  ),
);

const flowRows = computed(() => damageChainRows(breakdown.value.zoneValues, toughnessFactor()));

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function chainLabel(def: ChainDef): string {
  return def.key === 'toughness' ? t('formula.chain.toughness') : t(`formula.zone.${def.i18n}`);
}

function chainFactor(key: ChainKey): number {
  if (key === 'toughness') return toughnessFactor();
  const data = breakdown.value;
  const raw = key === 'base' ? data.base : data.zoneValues[key];
  return Number.isFinite(raw) ? raw : 0;
}

function chainValue(key: ChainKey): string {
  return fmtNumber(round3(chainFactor(key)));
}

const activeDef = computed<ChainDef>(() => CHAIN.find((item) => item.key === active.value) ?? CHAIN[0]);

function formulaText(def: ChainDef): string {
  return t(`formula.zoneFormula.${def.i18n}`);
}

function noteText(def: ChainDef): string {
  return t(NOTE_KEYS[def.key]);
}

function toughnessStateText(): string {
  return formulaInputs.broken ? t('formula.chain.toughnessOn') : t('formula.chain.toughnessOff');
}

function pick(key: ChainKey): void {
  active.value = key;
  if (key === 'toughness') formulaInputs.broken = !formulaInputs.broken;
}
</script>

<template>
  <section id="formula-overview" class="nk-formula-sec" data-sec="overview">
    <h2 class="nk-formula-sec__title">
      <span class="nk-formula-sec__idx">{{ idx }}</span>{{ t('formula.sec.overview') }}
    </h2>
    <p class="nk-formula-sec__lead">{{ t('formula.overview.lead') }}</p>

    <div class="nk-formula-chain" role="group" :aria-label="t('formula.overview.chain')">
      <template v-for="(def, i) in CHAIN" :key="def.key">
        <span v-if="i" class="nk-formula-chain__op" aria-hidden="true">×</span>
        <button
          type="button"
          role="button"
          class="nk-formula-chain__node"
          :class="{
            'nk-formula-chain__node--on': active === def.key,
            'nk-formula-chain__node--tough': def.key === 'toughness',
          }"
          :data-zone="def.key"
          :aria-pressed="def.key === 'toughness' ? formulaInputs.broken : active === def.key"
          @click="pick(def.key)"
        >
          <span class="nk-formula-chain__label">{{ chainLabel(def) }}</span>
          <span class="nk-formula-chain__value">{{ chainValue(def.key) }}</span>
          <span v-if="def.key === 'toughness'" class="nk-formula-chain__state">{{ toughnessStateText() }}</span>
        </button>
      </template>
    </div>

    <div class="nk-formula-overview">
      <div class="nk-formula-detail">
        <span class="nk-formula-detail__name">{{ chainLabel(activeDef) }}</span>
        <p class="nk-formula-detail__formula">{{ formulaText(activeDef) }}</p>
        <p class="nk-formula-detail__note">{{ noteText(activeDef) }}</p>
      </div>

      <div class="nk-formula-flow-block">
        <h3 class="nk-formula-sub">{{ t('formula.ledger.title') }}</h3>
        <ZoneFlow
          :base="breakdown.base"
          :rows="flowRows"
          :total-label="t('formula.overview.total')"
        />
        <p class="nk-formula-note">{{ t('formula.ledger.note') }}</p>
      </div>
    </div>
  </section>
</template>
