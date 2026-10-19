<script setup lang="ts">
import type { FormCard, FormMode } from '../composables/use-enhanced-form';
import { translate } from '../i18n';

const t = translate;

defineProps<{
  forms: FormCard[];
  mode: FormMode;
  changedCount: number;
  notes: string[];
}>();

const emit = defineEmits<{ pick: [mode: FormMode, key: string | null] }>();
</script>

<template>
  <section class="nk-forms" role="group" :aria-label="t('char.enhModeAria')">
    <button
      v-for="f in forms"
      :key="f.mode + (f.key || '')"
      class="nk-forms__card"
      :class="{ 'nk-forms__card--on': f.mode === mode }"
      type="button"
      :aria-pressed="f.mode === mode"
      @click="emit('pick', f.mode, f.key)"
    >
      <span class="nk-forms__note">{{ f.note }}</span>
      <span class="nk-forms__label">{{ f.label }}</span>
      <span v-if="f.mode === 'compare' && changedCount" class="nk-forms__count">
        {{ t('char.changedCount', { n: changedCount }) }}
      </span>
    </button>
    <ol v-if="notes.length" class="nk-forms__notes">
      <li v-for="(n, i) in notes" :key="i" class="nk-forms__nt" v-html="n"></li>
    </ol>
  </section>
</template>
