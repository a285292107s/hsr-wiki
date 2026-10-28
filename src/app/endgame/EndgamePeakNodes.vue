<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgamePeak from './EndgamePeak.vue';
import type { PeakNodeEntry } from './levels';
import type { MazeStageDetail } from '../../services/types';

import { translate } from '../i18n';

const props = defineProps<{
  nodes: PeakNodeEntry[];
  tabsLabel: string;
  systemName?: string;
  systemChoice?: string;
}>();

const cards = computed(() => props.nodes.map((n) => {
  const hard = n.hard ? n.level.hard : null;
  const stage = (hard
    ? { damage: n.level.damage, monsters: hard.monsters, invasion: n.level.invasion }
    : n.level) as MazeStageDetail;
  return {
    key: n.key,
    label: n.label,
    stage,
    level: (hard ? hard.level : n.level.level) || 0,
    danger: n.hard ? translate('egd.peak.hard') : '',
  };
}));

const activeKey = ref('');
watch(cards, (list) => {
  if (!list.some((c) => c.key === activeKey.value)) activeKey.value = list[0]?.key || '';
}, { immediate: true });

const activeNode = computed<PeakNodeEntry | null>(
  () => props.nodes.find((n) => n.key === activeKey.value) || null,
);

function selectNode(key: string): void {
  activeKey.value = key;
}
</script>

<template>
  <div class="nk-egd-lvl">
    <EndgameNodeCards
      v-if="cards.length > 1"
      :items="cards"
      :active="activeKey"
      id-prefix="egd-peak-node-tab"
      :tabs-label="tabsLabel"
      panel-id="egd-peak-board"
      @select="selectNode"
    />
    <div
      v-if="activeNode"
      id="egd-peak-board"
      role="tabpanel"
      :aria-labelledby="cards.length > 1 ? `egd-peak-node-tab-${activeKey}` : undefined"
    >
      <EndgamePeak
        :level="activeNode.level"
        :hard="activeNode.hard"
        :cards-above="cards.length > 1"
        :system-name="props.systemName"
        :system-choice="props.systemChoice"
      />
    </div>
  </div>
</template>
