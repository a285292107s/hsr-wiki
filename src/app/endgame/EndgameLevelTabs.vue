<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { tabNextIndex } from './tabs';
import type { BossLevelTab } from './levels';

const props = defineProps<{
  tabs: BossLevelTab[];
  active: string;
}>();

const emit = defineEmits<{ select: [key: string] }>();

const listRef = ref<HTMLElement | null>(null);

function onKeydown(e: KeyboardEvent, i: number): void {
  const next = tabNextIndex(e.key, i, props.tabs.length);
  if (next < 0) return;
  e.preventDefault();
  const tab = props.tabs[next];
  if (!tab) return;
  emit('select', tab.key);
  void nextTick(() => {
    listRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  });
}
</script>

<template>
  <div id="egd-level-tabs" ref="listRef" class="nk-egd-tabs" role="tablist" aria-label="关卡层级">
    <button
      v-for="(t, i) in tabs"
      :id="`egd-level-tab-${t.key}`"
      :key="t.key"
      type="button"
      role="tab"
      class="nk-tab"
      :class="{ 'nk-tab--active': t.key === active }"
      :aria-selected="t.key === active"
      aria-controls="egd-level-panel"
      :tabindex="t.key === active ? 0 : -1"
      @click="emit('select', t.key)"
      @keydown="onKeydown($event, i)"
    >{{ t.label }}</button>
  </div>
</template>
