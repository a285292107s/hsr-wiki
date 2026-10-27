<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import { halfLabel } from './pollution';
import type {
  MazeBuffInfo, MazeFloorDetail, MazeListEntry, MazeStageDetail,
} from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  floor: MazeFloorDetail;
  systemName?: string;
}>();

type HalfKey = 'stage1' | 'stage2';

interface HalfNode {
  half: HalfKey;
  stage: MazeStageDetail;
}

const nodes = computed<HalfNode[]>(() =>
  (['stage1', 'stage2'] as const)
    .map((half) => ({ half, stage: props.floor[half] }))
    .filter((n): n is HalfNode => !!n.stage && (!!n.stage.monsters?.length || !!n.stage.damage?.length)));

const cards = computed(() => nodes.value.map((n) => ({
  key: n.half,
  label: halfLabel(n.half),
  stage: n.stage,
  level: props.floor.level || 0,
  countdown: props.floor.countdown || 0,
})));

const activeHalf = ref<HalfKey | ''>('');
watch(nodes, (list) => {
  if (!list.some((n) => n.half === activeHalf.value)) activeHalf.value = list[0]?.half || '';
}, { immediate: true });
const activeNode = computed<HalfNode | null>(
  () => nodes.value.find((n) => n.half === activeHalf.value) || null,
);

function selectHalf(key: string): void {
  activeHalf.value = key as HalfKey;
}

const nodeBuffs = computed<MazeBuffInfo[]>(() => {
  if (!activeNode.value) return [];
  return props.data.buff_groups?.[activeNode.value.half] ?? [];
});
</script>

<template>
  <div class="nk-egd-lvl">
    <EndgameNodeCards
      v-if="cards.length > 1"
      :items="cards"
      :active="activeHalf"
      id-prefix="egd-floor-half-tab"
      :tabs-label="t('egd.halfTabs')"
      panel-id="egd-floor-board"
      @select="selectHalf"
    />

    <EndgameBoard
      v-if="activeNode"
      id="egd-floor-board"
      :labelled-by="cards.length > 1 ? `egd-floor-half-tab-${activeHalf}` : undefined"
      :stage="activeNode.stage"
      :buff="modeKey === 'boss' ? null : floor.buff"
      :guides="props.data.boss_guides"
      :buffs="nodeBuffs"
      :system-name="props.systemName"
    />
  </div>
</template>