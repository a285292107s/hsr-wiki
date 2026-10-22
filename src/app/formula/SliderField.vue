<script setup lang="ts">
import { computed } from 'vue';
import { fmtNumber } from '../../lib/format';

const props = defineProps<{
  label: string;
  modelValue: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  ariaLabel: string;
  dataRole: string;
  digits?: number;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const display = computed(() => {
  const f = 10 ** (props.digits ?? 0);
  return `${fmtNumber(Math.round(props.modelValue * f) / f)}${props.unit ?? ''}`;
});

function onInput(event: Event): void {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) emit('update:modelValue', value);
}
</script>

<template>
  <label class="nk-formula-field">
    <span class="nk-formula-field__label">{{ label }}</span>
    <span class="nk-formula-field__value">{{ display }}</span>
    <input
      class="nk-formula-range"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :data-role="dataRole"
      :aria-label="ariaLabel"
      @input="onInput"
    >
  </label>
</template>
