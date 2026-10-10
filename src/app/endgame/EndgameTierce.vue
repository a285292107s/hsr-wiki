<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import EndgameReward from './EndgameReward.vue';
import EndgameClearCondition from './EndgameClearCondition.vue';
import EndgameStarTierList from './EndgameStarTierList.vue';
import { seasonBuffList, starTierRows } from './renders';
import EnemyCard from '../components/EnemyCard.vue';
import type { MazeBuffInfo, MazeListEntry, MazeTierceNode } from '../../services/types';

import { translate } from '../i18n';
import { fmtNumber } from '../../lib/format';

/** 模板与脚本统一走词典 */
const t = translate;
const props = defineProps<{
  data: MazeListEntry;
  /** 增益体系名（自上而下透传；缺省回退站点工作名） */
  systemName?: string;
}>();

const tierceCountdown = computed<number>(() => props.data.tierce?.countdown || 0);
const tierceScore = computed<number | null>(() => props.data.tierce?.score ?? null);
const tierceTargets = computed(() => props.data.tierce?.targets || []);
const tierceMonsters = computed(() => props.data.tierce?.monsters || []);
/** 星启 3 节点，每个节点是一整场战斗（完整场次内容） */
const tierceNodes = computed<MazeTierceNode[]>(() => props.data.tierce?.nodes || []);

/** 节点号：子切换口径（游戏内文案作「节点一/节点二」） */
const NODE_KEY: Record<number, string> = { 1: 'egd.node.1', 2: 'egd.node.2', 3: 'egd.node.3' };
function nodeLabel(nd: MazeTierceNode): string {
  return NODE_KEY[nd.idx] ? translate(NODE_KEY[nd.idx]) : translate('egd.node.n', { n: nd.idx });
}

/** 卡片行 = 子切换导航 + 节点自身属性（节点号 + 末波首领图 + 推荐属性 + 等级）。 */
const cardItems = computed(() => tierceNodes.value.map((nd) => ({
  key: String(nd.idx),
  label: nodeLabel(nd),
  stage: nd,
  level: nd.level || 0,
})));

/** 看板当前节点：节点子切换的选中态，缺失时退回第一个（切换赛季后旧序号可能不存在） */
const activeKey = ref('1');
const activeNd = computed<MazeTierceNode | null>(
  () => tierceNodes.value.find((nd) => String(nd.idx) === activeKey.value) || tierceNodes.value[0] || null,
);
/** 敌方配置之前的赛季增益：末日幻影按 origin 取分组；其余玩法取赛季增益并剔除已由节点增益
 *  承载的同 ID 项（忘却之庭的「记忆紊流」由节点看板首块末法余烬位呈现，此处不再复述）。 */
const nodeBuffs = computed<MazeBuffInfo[]>(() => {
  if (!activeNd.value) return [];
  const grouped = props.data.buff_groups?.[activeNd.value.origin];
  if (grouped?.length) return grouped;
  return seasonBuffList(props.data);
});
/** 首领机制随敌方卡呈现（末日幻影）：`boss_guides` 是赛季级正文表，看板按敌方条目上的
 *  `boss_guide` 指针取，故这里不再有场次级首领特性列表（ADR 0029 修订）。 */

function selectNode(key: string): void {
  activeKey.value = key;
}

/** 星启通关奖励（EGEEJLHBALB）：名称与图标由共享件 `EndgameReward` 经 items.json 单例映射
 *  （与层头部的「通关奖励」同源同渲染，避免两处各写一份 chips 模板）。 */
const tierceRewards = computed(() => props.data.tierce?.rewards || []);

/** 星级目标 = 3 个节点目标（3 星）；满分档（`prism`）从它里面拆出来——它是**棱彩星**条件
 *  （官方规则说明「通关且获得 N 分/剩余 N 轮以上，即可以获得棱彩星和额外的新奖励」），
 *  不是第 4 颗星。 */
const starTargets = computed(() => tierceTargets.value.filter((t) => !t.prism));
const prismTarget = computed(() => tierceTargets.value.find((t) => t.prism) || null);
const prismReward = computed(() => props.data.tierce?.prism_reward || []);

/** 通关条件：星启关自己的回合上限与通关分数线（`ClearScore`，虚构叙事 45000 一类）；
 *  两者都无时退到节点数（异相仲裁/末日幻影的星启＝完成 3 个节点） */
const clearRows = computed(() => {
  const rows: { value: string; label: string }[] = [];
  if (tierceScore.value) rows.push({ value: fmtNumber(tierceScore.value), label: t('egd.rule.score') });
  if (tierceCountdown.value) rows.push({ value: String(tierceCountdown.value), label: t('egd.rule.cyclesCap') });
  if (!rows.length && tierceNodes.value.length) {
    rows.push({ value: String(tierceNodes.value.length), label: t('egd.rule.nodes') });
  }
  return rows;
});
/** 星级奖励：星启关的 3 星与常规末层**共享记录**（官方说明「和常规模式第 N 关共享 3 星挑战记录」），
 *  故取末层的切片；星启自己的第 4 档（满分/棱彩星）不进星数档，其额外奖励在 `tierce.rewards` 里。 */
const starTiers = computed(() => {
  const floors = props.data.floor_details || [];
  return floors.length ? floors[floors.length - 1].star_rewards || [] : [];
});
/** 星级奖励列表：3 个节点目标 × 星数档按档配对，棱彩星（满分档 + 其奖励）走同一行形态追加末位 */
const tierRows = computed(() => starTierRows(starTargets.value, starTiers.value, {
  target: prismTarget.value,
  items: prismReward.value,
}));

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
      <!-- 赛季级统计条退场（用户裁决）：回合限制与分数限制已在「通关条件」格里给出，
           同一事实只留一处 -->
      <!-- 面板顶部奖励板：通关条件｜通关奖励 两栏 + 星级奖励列表（一档一行，含棱彩星档） -->
      <div
        v-if="starTargets.length || tierceRewards.length || starTiers.length"
        class="nk-egd-head"
      >
        <EndgameClearCondition :rows="clearRows" />
        <EndgameReward v-if="tierceRewards.length" :label="t('egd.rewards')" :items="tierceRewards" />
        <EndgameStarTierList :rows="tierRows" />
      </div>
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
        :buff="activeNd.buff"
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
