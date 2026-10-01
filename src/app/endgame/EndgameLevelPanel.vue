<script setup lang="ts">
import { computed } from 'vue';
import EndgameBossFloor from './EndgameBossFloor.vue';
import EndgameTierce from './EndgameTierce.vue';
import { bossLevelFloor, type BossLevelTab } from './levels';
import type { MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  tabs: BossLevelTab[];
  active: string;
}>();

const activeTab = computed(
  () => props.tabs.find((t) => t.key === props.active) || props.tabs[0] || null,
);
const activeFloor = computed(
  () => (activeTab.value?.kind === 'floor' ? bossLevelFloor(props.data, activeTab.value.key) : null),
);
</script>

<template>
  <div
    id="egd-level-panel"
    class="nk-egd-level-panel"
    role="tabpanel"
    :aria-labelledby="activeTab ? `egd-level-tab-${activeTab.key}` : undefined"
  >
    <EndgameBossFloor v-if="activeFloor" :data="data" :floor="activeFloor" />
    <EndgameTierce v-else-if="activeTab?.kind === 'tierce'" :data="data" :mode-key="modeKey" embedded />
  </div>
</template>
