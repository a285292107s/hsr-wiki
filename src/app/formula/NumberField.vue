<script setup lang="ts">
import { ref, watch } from 'vue';

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

function round(value: number): number {
  const f = 10 ** (props.digits ?? 2);
  return Math.round(value * f) / f;
}

function clamp(value: number): number {
  return Math.min(props.max, Math.max(props.min, value));
}

function display(value: number): string {
  return String(round(clamp(value)));
}

const draft = ref(display(props.modelValue));

watch(() => props.modelValue, (value) => {
  if (Number(draft.value) !== round(value)) draft.value = display(value);
});

function commit(value: number): void {
  const next = round(clamp(value));
  emit('update:modelValue', next);
  draft.value = display(next);
}

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  draft.value = raw;
  const parsed = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(parsed)) return;
  if (parsed < props.min || parsed > props.max) return;
  emit('update:modelValue', round(parsed));
}

function onBlur(): void {
  const parsed = Number(draft.value);
  if (draft.value.trim() === '' || !Number.isFinite(parsed)) {
    draft.value = display(props.modelValue);
    return;
  }
  commit(parsed);
}

function nudge(direction: 1 | -1): void {
  commit(props.modelValue + direction * props.step);
}
</script>

<template>
  <div class="nk-formula-field nk-formula-field--number">
    <span class="nk-formula-field__label">{{ label }}</span>
    <div class="nk-formula-number">
      <button
        type="button"
        class="nk-formula-number__step"
        :disabled="modelValue <= min"
        :aria-label="`${label} −`"
        @click="nudge(-1)"
      >−</button>
      <input
        class="nk-formula-number__input"
        type="number"
        inputmode="decimal"
        :min="min"
        :max="max"
        :step="step"
        :value="draft"
        :aria-label="ariaLabel"
        :data-role="dataRole"
        @input="onInput"
        @blur="onBlur"
      >
      <span v-if="unit" class="nk-formula-number__unit">{{ unit }}</span>
      <button
        type="button"
        class="nk-formula-number__step"
        :disabled="modelValue >= max"
        :aria-label="`${label} +`"
        @click="nudge(1)"
      >+</button>
    </div>
  </div>
</template>
