<script setup lang="ts">
/**
 * 目录页工具条：标题 + 搜索框 + 计数 + 筛选下拉组（每组一个下拉，直接内嵌工具条）。
 * 纯展示组件；搜索输入与筛选选择由父组件处理（含节流/网格刷新）。
 */
import CatalogFilterSelect from './CatalogFilterSelect.vue';
import type { CatalogFilter } from './types';

defineProps<{
  title: string;
  /** 标题旁的英文副标（如 CHARACTER INDEX） */
  subtitle?: string;
  placeholder: string;
  query: string;
  /** 计数文本（如 `12 / 89`；加载中传 `—`） */
  countText: string;
  /** 筛选组（渲染为工具条内下拉） */
  filters: CatalogFilter[];
  /** 当前筛选状态（filterKey → val） */
  activeFilters: Record<string, string>;
  /** 加载中禁用筛选下拉 */
  disabled: boolean;
}>();

const emit = defineEmits<{
  search: [value: string];
  select: [key: string, val: string];
}>();
</script>

<template>
  <!-- 页头（档案式 masthead，非吸顶）：标题 + 等宽副标 + 发丝线延伸 + 计数元信息，
       随内容滚动离开；吸顶工具条（toolbar）为轻量工具层，与其分离 -->
  <div class="nk-cat-masthead">
    <span class="nk-cat-title">
      {{ title }}<span v-if="subtitle" class="nk-cat-subtitle">{{ subtitle }}</span>
    </span>
    <span class="nk-cat-count">{{ countText }}</span>
  </div>
  <div class="nk-cat-toolbar">
    <div class="nk-cat-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4" stroke-linecap="round"/>
      </svg>
      <input
        type="text"
        :placeholder="placeholder"
        :value="query"
        @input="(e) => emit('search', (e.target as HTMLInputElement).value)"
      >
    </div>
    <!-- 筛选下拉组：每组一个下拉；移动端整区横向滚动（filters-bar CSS 接管） -->
    <div v-if="filters.length" class="nk-cat-filters-bar">
      <CatalogFilterSelect
        v-for="f in filters"
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