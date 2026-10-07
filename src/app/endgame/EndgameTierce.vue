<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameStarTargets from './EndgameStarTargets.vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import EndgameReward from './EndgameReward.vue';
import { seasonBuffList } from './renders';
import EnemyCard from '../components/EnemyCard.vue';
import type { MazeBuffInfo, MazeListEntry, MazeTierceNode } from '../../services/types';

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
const NODE_ZH: Record<number, string> = { 1: '节点一', 2: '节点二', 3: '节点三' };
function nodeLabel(nd: MazeTierceNode): string {
  return NODE_ZH[nd.idx] || `节点${nd.idx}`;
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
      <div v-if="tierceCountdown || tierceScore != null" class="nk-egd-tierce__stats">
        <div v-if="tierceCountdown" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceCountdown }}</span>
          <span class="nk-egd-tierce__label">回合限制 CYCLES</span>
        </div>
        <div v-if="tierceScore != null" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceScore.toLocaleString() }}</span>
          <span class="nk-egd-tierce__label">分数限制 SCORE</span>
        </div>
      </div>
      <div v-if="tierceTargets.length || tierceRewards.length" class="nk-egd-head">
        <EndgameStarTargets v-if="tierceTargets.length" :items="tierceTargets" />
        <EndgameReward
          v-if="tierceRewards.length"
          label="通关奖励"
          :goal="tierceScore ? `通关目标：获得 ${tierceScore.toLocaleString()} 分` : undefined"
          :items="tierceRewards"
        />
      </div>
      <EndgameNodeCards
        v-if="cardItems.length > 1"
        :items="cardItems"
        :active="activeKey"
        id-prefix="egd-tierce-node-tab"
        tabs-label="星启节点"
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
