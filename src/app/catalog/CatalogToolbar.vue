<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CatalogFilterSelect from './CatalogFilterSelect.vue';
import type { CatalogFilter } from './types';

const props = defineProps<{
  title: string;
  subtitle?: string;
  placeholder: string;
  query: string;
  countText: string;
  filters: CatalogFilter[];
  activeFilters: Record<string, string>;
  disabled: boolean;
}>();

const emit = defineEmits<{
  search: [value: string];
  select: [key: string, val: string];
}>();

const { t } = useI18n();

const resolvedFilters = computed(() =>
  props.filters.map((f) => ({
    ...f,
    label: (f.label ?? '') + (f.labelKey ? t(f.labelKey) : ''),
    options: f.options.map((o) => ({ ...o, label: (o.label ?? '') + (o.labelKey ? t(o.labelKey) : '') })),
  })),
);
</script>

<template>
  <div class="nk-cat-masthead">
    <h1 class="nk-cat-title">
      {{ title }}<span v-if="subtitle" class="nk-cat-subtitle">{{ subtitle }}</span>
    </h1>
    <span class="nk-cat-count">{{ countText }}</span>
  </div>
  <div class="nk-cat-toolbar">
    <label class="nk-cat-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        :placeholder="placeholder"
        :value="query"
        @input="(e) => emit('search', (e.target as HTMLInputElement).value)"
      >
    </label>
    <div v-if="filters.length" class="nk-cat-filters-bar">
      <CatalogFilterSelect
        v-for="f in resolvedFilters"
        :key="f.key"
        :label="f.label"
        :options="f.options"
        :model-value="activeFilters[f.key] || ''"
        :disabled="disabled"
        @change="(v: string) => emit('select', f.key, v)"
      />
    </div>
  </div>
</template>