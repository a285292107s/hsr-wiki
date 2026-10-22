<script setup lang="ts">
import { computed } from 'vue';
import { fmtNumber } from '../../lib/format';
import { rowLabel } from './rows';

interface FlowChainRow {
  key: string;
  factor: number | null;
}

const props = defineProps<{
  base: number;
  rows: FlowChainRow[];
  totalLabel: string;
  labels?: Record<string, string>;
}>();

function finite(value: number | null | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function amount(value: number): string {
  return fmtNumber(round(finite(value), 1));
}

function factor(value: number): string {
  return `×${fmtNumber(round(finite(value, 1), 3))}`;
}

function signed(value: number): string {
  const rounded = round(finite(value), 1);
  if (rounded > 0) return `+${fmtNumber(rounded)}`;
  if (rounded < 0) return `−${fmtNumber(Math.abs(rounded))}`;
  return '0';
}

function labelOf(key: string): string {
  return rowLabel(key, props.labels);
}

interface FlowRow {
  key: string;
  label: string;
  factorText: string;
  run: number;
  delta: number | null;
  step: number;
  width: number;
  direction: 'gain' | 'loss' | 'flat' | 'base';
}

const steps = computed<FlowRow[]>(() => {
  let running = finite(props.base);
  const mapped = props.rows.map((row, index) => {
    if (row.factor == null) {
      return {
        key: row.key,
        label: labelOf(row.key),
        factorText: '—',
        run: running,
        delta: null,
        step: index + 1,
        direction: 'base' as const,
      };
    }
    const zone = finite(row.factor, 1);
    const next = running * zone;
    const item = {
      key: row.key,
      label: labelOf(row.key),
      factorText: factor(zone),
      run: next,
      delta: next - running,
      step: index + 1,
      direction: (next > running ? 'gain' : next < running ? 'loss' : 'flat') as FlowRow['direction'],
    };
    running = next;
    return item;
  });
  const peak = mapped.reduce((top, row) => Math.max(top, Math.abs(row.run)), 0) || 1;
  return mapped.map((row) => ({
    ...row,
    width: Math.max(0, Math.min(100, (Math.abs(row.run) / peak) * 100)),
  }));
});

const total = computed(() => steps.value[steps.value.length - 1]?.run ?? finite(props.base));
</script>

<template>
  <div class="nk-formula-flow">
    <div
      v-for="row in steps"
      :key="row.key"
      class="nk-formula-flow__row"
      :class="`nk-formula-flow__row--${row.direction}`"
      :data-zone="row.key"
      :data-step="row.step"
    >
      <span class="nk-formula-flow__name">{{ row.label }}</span>
      <span class="nk-formula-flow__track">
        <span
          class="nk-formula-flow__bar"
          :style="{ width: `${row.width}%` }"
          aria-hidden="true"
        ></span>
      </span>
      <span class="nk-formula-flow__factor">{{ row.factorText }}</span>
      <span class="nk-formula-flow__run">{{ amount(row.run) }}</span>
      <span class="nk-formula-flow__delta">{{ row.delta == null ? '' : signed(row.delta) }}</span>
    </div>
    <div class="nk-formula-flow__row nk-formula-flow__row--total">
      <span class="nk-formula-flow__name">{{ totalLabel }}</span>
      <span class="nk-formula-flow__track nk-formula-flow__track--static" aria-hidden="true"></span>
      <span class="nk-formula-flow__factor"></span>
      <span class="nk-formula-flow__run nk-formula-flow__run--total">{{ amount(total) }}</span>
      <span class="nk-formula-flow__delta"></span>
    </div>
  </div>
</template>
