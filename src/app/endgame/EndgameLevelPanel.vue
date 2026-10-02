<script setup lang="ts">
import { computed } from 'vue';
import EndgameFloor from './EndgameFloor.vue';
import EndgameTierce from './EndgameTierce.vue';
import { levelTabFloor, type LevelTab } from './levels';
import type { MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  tabs: LevelTab[];
  active: string;
}>();

const activeTab = computed(
  () => props.tabs.find((t) => t.key === props.active) || props.tabs[0] || null,
);
const activeFloor = computed(
  () => (activeTab.value?.kind === 'floor' ? levelTabFloor(props.data, activeTab.value.key) : null),
);
</script>

<template>
  <div
    id="egd-level-panel"
    class="nk-egd-level-panel"
    role="tabpanel"
    :aria-labelledby="activeTab ? `egd-level-tab-${activeTab.key}` : undefined"
  >
    <EndgameFloor v-if="activeFloor" :data="data" :floor="activeFloor" />
    <EndgameTierce v-else-if="activeTab?.kind === 'tierce'" :data="data" />
  </div>
</template>