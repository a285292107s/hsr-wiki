<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import EnemyCard from '../components/EnemyCard.vue';
import { seasonNodeBuff } from './renders';
import type { MazeBuffInfo, MazeListEntry, MazeTierceNode } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  data: MazeListEntry;
  systemName?: string;
}>();

const tierceMonsters = computed(() => props.data.tierce?.monsters || []);
const tierceNodes = computed<MazeTierceNode[]>(() => props.data.tierce?.nodes || []);

const NODE_KEY: Record<number, string> = { 1: 'egd.node.1', 2: 'egd.node.2', 3: 'egd.node.3' };
function nodeLabel(nd: MazeTierceNode): string {
  return NODE_KEY[nd.idx] ? translate(NODE_KEY[nd.idx]) : translate('egd.node.n', { n: nd.idx });
}

const cardItems = computed(() => tierceNodes.value.map((nd) => ({
  key: String(nd.idx),
  label: nodeLabel(nd),
  stage: nd,
  level: nd.level || 0,
})));

const activeKey = ref('1');
const activeNd = computed<MazeTierceNode | null>(
  () => tierceNodes.value.find((nd) => String(nd.idx) === activeKey.value) || tierceNodes.value[0] || null,
);
const nodeBuffs = computed<MazeBuffInfo[]>(() => {
  if (!activeNd.value) return [];
  return props.data.buff_groups?.[activeNd.value.origin] ?? [];
});

const hoistedBuffId = computed(() => seasonNodeBuff(props.data)?.id ?? 0);

function selectNode(key: string): void {
  activeKey.value = key;
}

watch(
  () => props.data.tierce,
  (t) => {
    if (!t) return;
    const first = t.nodes?.[0];
    activeKey.value = first ? String(first.idx) : '1';
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="data.tierce">
    <div class="nk-egd-tierce">
      <EndgameNodeCards
        v-if="cardItems.length > 1"
        :items="cardItems"
        :active="activeKey"
        id-prefix="egd-tierce-node-tab"
        :tabs-label="t('egd.tierceNodes')"
        panel-id="egd-tierce-board"
        @select="selectNode"
      />
      <EndgameBoard
        v-if="activeNd"
        id="egd-tierce-board"
        :labelled-by="cardItems.length > 1 ? `egd-tierce-node-tab-${activeKey}` : undefined"
        :stage="activeNd"
        :buff="activeNd.buff?.id === hoistedBuffId ? null : activeNd.buff"
        :guides="props.data.boss_guides"
        :buffs="nodeBuffs"
        :system-name="props.systemName"
      />
      <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
        <EnemyCard
          v-for="m in tierceMonsters"
          :key="m.id"
          :monster="m"
          :guide="m.boss_guide ? props.data.boss_guides?.[m.boss_guide] : undefined"
        />
      </div>
    </div>
  </template>
</template>
