<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameStarTargets from './EndgameStarTargets.vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import { halfLabel } from './pollution';
import { seasonRules } from './renders';
import type {
  MazeBossTrait, MazeBuffInfo, MazeFloorDetail, MazeListEntry, MazeStageDetail,
} from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  floor: MazeFloorDetail;
}>();

type HalfKey = 'stage1' | 'stage2';

interface HalfNode {
  half: HalfKey;
  stage: MazeStageDetail;
}

/** 一层只有上下半场两场战斗（ADR 0031）：敌方取实际战斗数据（EventIDList1/2 波次），
 *  星启附加关归星启子 tab，不在层内出现。 */
const nodes = computed<HalfNode[]>(() =>
  (['stage1', 'stage2'] as const)
    .map((half) => ({ half, stage: props.floor[half] }))
    .filter((n): n is HalfNode => !!n.stage && (!!n.stage.monsters?.length || !!n.stage.damage?.length)));

/** 半场卡片 = 子切换导航，卡面与星启节点卡片同形（半场名 + 末波首领图 + 推荐属性 + 等级 / 回合）。
 *  等级与回合是层共用值，只在卡片上出现（层标题不再复述）。 */
const cards = computed(() => nodes.value.map((n) => ({
  key: n.half,
  label: halfLabel(n.half),
  stage: n.stage,
  level: props.floor.level || 0,
  countdown: props.floor.countdown || 0,
})));

/** 看板当前半场：缺该场次时退回第一个（数据缺半场或切层后旧场次不存在） */
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

/** 该半场的赛季增益与首领特性：按场次键取赛季级分场次字段（仅末日幻影产出） */
const activeBuffs = computed<MazeBuffInfo[]>(
  () => (activeNode.value ? props.data.buff_groups?.[activeNode.value.half] || [] : []),
);
const activeTraits = computed<MazeBossTrait[]>(
  () => (activeNode.value ? props.data.boss_traits?.[activeNode.value.half] || [] : []),
);

const targets = computed(() => props.floor.targets || []);
const rules = computed(() => seasonRules(props.data));
</script>

<template>
  <div class="nk-egd-lvl">
    <div v-if="targets.length || rules.length" class="nk-egd-head">
      <EndgameStarTargets v-if="targets.length" :items="targets" />
      <div v-if="rules.length" class="nk-egd-head__col">
        <span class="nk-egd-head__label">赛季规则</span>
        <span v-for="r in rules" :key="r.label" class="nk-egd-rules__item">
          <span class="nk-egd-rules__val">{{ r.value.toLocaleString() }}</span>
          <span class="nk-egd-rules__label">{{ r.label }}</span>
        </span>
      </div>
    </div>

    <EndgameNodeCards
      v-if="cards.length > 1"
      :items="cards"
      :active="activeHalf"
      id-prefix="egd-floor-half-tab"
      tabs-label="半场"
      panel-id="egd-floor-board"
      @select="selectHalf"
    />

    <EndgameBoard
      v-if="activeNode"
      id="egd-floor-board"
      :labelled-by="cards.length > 1 ? `egd-floor-half-tab-${activeHalf}` : undefined"
      :stage="activeNode.stage"
      :buff="floor.buff"
      :traits="activeTraits"
      :buffs="activeBuffs"
    />
  </div>
</template>