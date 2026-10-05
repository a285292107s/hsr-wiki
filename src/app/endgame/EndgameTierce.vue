<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EndgameStarTargets from './EndgameStarTargets.vue';
import EndgameNodeCards from './EndgameNodeCards.vue';
import EndgameBoard from './EndgameBoard.vue';
import { itemIconUrl } from '../../lib/format';
import { loadLocalItems } from '../../services/api';
import EnemyCard from '../components/EnemyCard.vue';
import type {
  LocalItemEntry, MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeTierceNode,
} from '../../services/types';

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
/** 该场次的赛季增益与首领特性：按 origin 取赛季级分场次字段（仅末日幻影产出） */
const activeBuffs = computed<MazeBuffInfo[]>(
  () => (activeNd.value ? props.data.buff_groups?.[activeNd.value.origin] || [] : []),
);
const activeTraits = computed<MazeBossTrait[]>(
  () => (activeNd.value ? props.data.boss_traits?.[activeNd.value.origin] || [] : []),
);

function selectNode(key: string): void {
  activeKey.value = key;
}

const itemMap = ref<Map<number, Pick<LocalItemEntry, 'name' | 'icon'>>>(new Map());
/** 星启通关奖励（EGEEJLHBALB：物品 id + 数量，经 items.json 映射名称/图标） */
const tierceRewards = computed(() => {
  const rs = props.data.tierce?.rewards || [];
  if (!rs.length) return [];
  const map = itemMap.value;
  return rs.map((r) => ({ id: r.id, num: r.num, ...(map.get(r.id) || { name: `#${r.id}`, icon: '' }) }));
});
watch(
  () => props.data.tierce,
  (t) => {
    if (!t) return;
    const first = t.nodes?.[0];
    activeKey.value = first ? String(first.idx) : '1';
    loadLocalItems()
      .then((list) => { itemMap.value = new Map(list.map((it) => [it.id, { name: it.name, icon: it.icon }])); })
      .catch(() => {});
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
        <div v-if="tierceRewards.length" class="nk-egd-head__col nk-egd-reward">
          <div class="nk-egd-reward__head">
            <span class="nk-egd-head__label">通关奖励</span>
            <span v-if="tierceScore" class="nk-egd-reward__goal">通关目标：获得 {{ tierceScore.toLocaleString() }} 分</span>
          </div>
          <div class="nk-egd-reward__items">
            <span v-for="r in tierceRewards" :key="r.id" class="nk-egd-reward__item">
              <img v-if="r.icon" class="nk-egd-reward__icon" :src="itemIconUrl(r.icon)" :alt="r.name" :title="r.name" loading="lazy" @error="($event.target as HTMLImageElement).classList.add('nk-img-error')">
              <span v-else class="nk-egd-reward__icon nk-egd-reward__icon--void">{{ String(r.id).slice(0, 2) }}</span>
              <span class="nk-egd-reward__name">{{ r.name }}</span>
              <span v-if="r.num" class="nk-egd-reward__num">×{{ r.num.toLocaleString() }}</span>
            </span>
          </div>
        </div>
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
        :traits="activeTraits"
        :buffs="activeBuffs"
        :system-name="props.systemName"
      />
      <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
        <EnemyCard v-for="m in tierceMonsters" :key="m.id" :monster="m" />
      </div>
    </div>
  </template>
</template>
