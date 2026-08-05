<script setup lang="ts">
/**
 * 目录页工具条：标题 + 搜索框 + 计数 + 筛选面板开关按钮。
 * 纯展示组件；搜索输入与筛选开合由父组件处理（含节流/网格刷新）。
 */
defineProps<{
  title: string;
  placeholder: string;
  query: string;
  /** 计数文本（如 `12 / 89`；加载中传 `—`） */
  countText: string;
  hasFilters: boolean;
  filtersOpen: boolean;
  /** 加载中禁用筛选按钮 */
  disabled: boolean;
}>();

const emit = defineEmits<{
  search: [value: string];
  toggleFilters: [];
}>();
</script>

<template>
  <div class="nk-cat-header">
    <span class="nk-cat-title">{{ title }}</span>
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
    <span class="nk-cat-count">{{ countText }}</span>
    <button
      v-if="hasFilters"
      class="nk-cat-filter-btn"
      :class="{ active: filtersOpen }"
      :disabled="disabled"
      @click="emit('toggleFilters')"
    ><span class="arrow">▼</span> 筛选</button>
  </div>
</template>
