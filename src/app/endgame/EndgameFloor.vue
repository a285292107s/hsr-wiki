<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import EndgameReward from './EndgameReward.vue';
import EndgameClearCondition from './EndgameClearCondition.vue';
import EndgameStarTierList from './EndgameStarTierList.vue';
import { halfLabel } from './pollution';
import { seasonBuffList, starTierRows } from './renders';
import type {
  MazeBuffInfo, MazeFloorDetail, MazeListEntry, MazeStageDetail,
} from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  floor: MazeFloorDetail;
  /** 增益体系名（自上而下透传；缺省回退站点工作名） */
  systemName?: string;
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

/** 敌方配置之前的赛季增益：末日幻影按半场取分组；其余玩法取赛季增益并剔除已由层级增益承载的
 *  同 ID 项（忘却之庭的「记忆紊流」由看板首块末法余烬位逐层呈现，此处不再复述）。 */
const nodeBuffs = computed<MazeBuffInfo[]>(() => {
  if (!activeNode.value) return [];
  const grouped = props.data.buff_groups?.[activeNode.value.half];
  if (grouped?.length) return grouped;
  return seasonBuffList(props.data);
});
const targets = computed(() => props.floor.targets || []);
/** 该层通关奖励（Challenge*MazeConfig.RewardID → RewardData，ADR 0051） */
const floorReward = computed(() => props.floor.reward || []);
/** 该层星级奖励：本赛季累计星数奖励阶梯**按层序切片**（忘却之庭每层一档、虚构/末日每层三档；
 *  切片由转换器按层序累计目标数算好，前端不推层序，见 ADR 0051 补记） */
const starTiers = computed(() => props.floor.star_rewards || []);
/** 等级奖励列表：目标 × 奖励按档配成一行一行 */
const tierRows = computed(() => starTierRows(targets.value, starTiers.value));
/** 通关条件（只取值）：回合上限（失败判据）+ 通关分数线；两者都无时退到该难度场次数
 *  （末日幻影官方判据「击败 2 个首领」，场次数取自本层实际渲染的场次） */
const clearRows = computed(() => {
  const rows: { value: string; label: string }[] = [];
  if (props.data.clear_score) {
    rows.push({ value: props.data.clear_score.toLocaleString(), label: '通关分数线 SCORE' });
  }
  const cd = props.floor.countdown || props.data.countdown || 0;
  if (cd) rows.push({ value: String(cd), label: '回合上限 CYCLES' });
  if (!rows.length && nodes.value.length) {
    rows.push({ value: String(nodes.value.length), label: '击败首领 ENEMIES' });
  }
  return rows;
});
</script>

<template>
  <div class="nk-egd-lvl">
    <!-- 面板顶部奖励板：通关条件｜通关奖励 两栏 + 星级奖励列表（一档一行，跨满整行） -->
    <div v-if="targets.length || floorReward.length" class="nk-egd-head">
      <EndgameClearCondition :rows="clearRows" />
      <EndgameReward v-if="floorReward.length" label="通关奖励" :items="floorReward" />
      <EndgameStarTierList :rows="tierRows" />
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
      :guides="props.data.boss_guides"
      :buffs="nodeBuffs"
      :system-name="props.systemName"
    />
  </div>
</template>