<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import {
  TARGET_TYPE_LABEL, TARGET_TYPE_SVG, elemRow, targetHtml, targetTypeIconHtml,
} from './renders';
import { pollutionLabel } from './pollution';
import { tabNextIndex } from './tabs';
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameTraitGroup from './EndgameTraitGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import { itemIconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { loadLocalItems } from '../../services/api';
import EnemyCard from '../components/EnemyCard.vue';
import type {
  LocalItemEntry, MazeBossTrait, MazeBuffInfo, MazeListEntry, MazeMonsterInfo, MazeTierceNode,
} from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  /** 作为子 tab 面板渲染（末日幻影）：不渲染区块标题 */
  embedded?: boolean;
}>();

const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [])));

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

/** 该节点的末波首领（最后一波的第 1 只）：末日幻影多数节点 1 敌即首领本体，
 *  忘却之庭 / 虚构叙事的末波是压轴首领（波 1 是小怪） */
function nodeBoss(nd: MazeTierceNode): MazeMonsterInfo | null {
  const ms = nd.monsters || [];
  if (!ms.length) return null;
  const maxWave = Math.max(...ms.map((m) => m.wave ?? 1));
  return ms.find((m) => (m.wave ?? 1) === maxWave) ?? ms[ms.length - 1] ?? null;
}

/** 节点卡片 = 子切换导航 + 节点自身属性（节点号 + 末波首领头像 + 推荐属性 + 等级）。
 *  看板不再重复陈述节点身份：切换行即当前节点的身份位。 */
const nodeCards = computed(() => tierceNodes.value.map((nd) => {
  const boss = nodeBoss(nd);
  return {
    idx: nd.idx,
    label: nodeLabel(nd),
    icon: boss?.icon ? cdnUri('monstermiddleicon', `${boss.icon}.webp`) : '',
    elems: nd.damage?.length ? elemRow(nd.damage) : '',
    level: nd.level || 0,
  };
}));

/** 看板当前节点：节点子切换的选中态，缺失时退回第一个（切换赛季后旧序号可能不存在） */
const activeIdx = ref(1);
const activeNd = computed<MazeTierceNode | null>(
  () => tierceNodes.value.find((nd) => nd.idx === activeIdx.value) || tierceNodes.value[0] || null,
);
/** 该场次的赛季增益与首领特性：按 origin 取赛季级分场次字段（仅末日幻影产出） */
const activeBuffs = computed<MazeBuffInfo[]>(
  () => (activeNd.value ? props.data.buff_groups?.[activeNd.value.origin] || [] : []),
);
const activeTraits = computed<MazeBossTrait[]>(
  () => (activeNd.value ? props.data.boss_traits?.[activeNd.value.origin] || [] : []),
);

const nodeCardsRef = ref<HTMLElement | null>(null);
function onNodeKeydown(e: KeyboardEvent, i: number): void {
  const next = tabNextIndex(e.key, i, tierceNodes.value.length);
  if (next < 0) return;
  e.preventDefault();
  const nd = tierceNodes.value[next];
  if (!nd) return;
  activeIdx.value = nd.idx;
  void nextTick(() => {
    nodeCardsRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  });
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
    activeIdx.value = first ? first.idx : 1;
    loadLocalItems()
      .then((list) => { itemMap.value = new Map(list.map((it) => [it.id, { name: it.name, icon: it.icon }])); })
      .catch(() => {});
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="data.tierce">
    <h2 v-if="!embedded" id="egd-tierce" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['tierce'] }}</span>星启模式 STARLIT</h2>
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
      <div v-if="tierceTargets.length || tierceRewards.length" class="nk-egd-tierce__head">
        <div v-if="tierceTargets.length" class="nk-egd-tierce__col">
          <span class="nk-egd-tierce__headlabel">星级目标</span>
          <ol class="nk-egd-tierce__targets">
            <li v-for="(t, i) in tierceTargets" :key="i" class="nk-egd-node">
              <span
                v-if="t.type && t.type !== 'TOTAL_SCORE' && TARGET_TYPE_LABEL[t.type]"
                class="nk-egd-node__type"
                :title="TARGET_TYPE_LABEL[t.type]"
                v-html="targetTypeIconHtml(t.type)"
              ></span>
              <span v-else class="nk-egd-tierce__star" aria-hidden="true" v-html="TARGET_TYPE_SVG.TOTAL_SCORE"></span>
              <span class="nk-egd-node__text" v-html="targetHtml(t)"></span>
            </li>
          </ol>
        </div>
        <div v-if="tierceRewards.length" class="nk-egd-tierce__col nk-egd-reward">
          <div class="nk-egd-reward__head">
            <span class="nk-egd-tierce__headlabel">通关奖励</span>
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
      <div
        v-if="nodeCards.length > 1"
        id="egd-tierce-nodetabs"
        ref="nodeCardsRef"
        class="nk-egd-nodecards"
        role="tablist"
        aria-label="星启节点"
      >
        <button
          v-for="(t, i) in nodeCards"
          :id="`egd-tierce-node-tab-${t.idx}`"
          :key="t.idx"
          type="button"
          role="tab"
          class="nk-egd-nodecard"
          :class="{ 'nk-egd-nodecard--active': t.idx === activeIdx }"
          :aria-selected="t.idx === activeIdx"
          aria-controls="egd-tierce-board"
          :tabindex="t.idx === activeIdx ? 0 : -1"
          @click="activeIdx = t.idx"
          @keydown="onNodeKeydown($event, i)"
        >
          <span class="nk-egd-nodecard__fig">
            <img
              v-if="t.icon"
              class="nk-egd-nodecard__img"
              :src="t.icon"
              alt=""
              loading="lazy"
              @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
            >
          </span>
          <span class="nk-egd-nodecard__body">
            <span class="nk-egd-nodecard__name">{{ t.label }}</span>
            <span v-if="t.elems" class="nk-egd-nodecard__row nk-egd-nodecard__row--elems">
              <span class="nk-egd-nodecard__label">推荐属性</span>
              <span class="nk-egd-nodecard__elems" v-html="t.elems"></span>
            </span>
            <span v-if="t.level" class="nk-egd-nodecard__row nk-egd-nodecard__row--level">
              <span class="nk-egd-nodecard__label">等级</span>
              <span class="nk-egd-nodecard__val">{{ t.level }}</span>
            </span>
          </span>
        </button>
      </div>
      <div
        v-if="activeNd"
        id="egd-tierce-board"
        class="nk-egd-tierce__node"
        :role="tierceNodes.length > 1 ? 'tabpanel' : undefined"
        :aria-labelledby="tierceNodes.length > 1 ? `egd-tierce-node-tab-${activeNd.idx}` : undefined"
      >
        <div class="nk-egd-tierce__nodebody nk-egd-children">
          <header v-if="activeNd.invasion && !activeTraits.length" class="nk-egd-tierce__nodehead">
            <span class="nk-egd-pollchip" :data-level="activeNd.invasion.level">{{ pollutionLabel(activeNd.invasion) }}</span>
          </header>
          <EndgameFloorBuff :buff="activeNd.buff" />
          <EndgameTraitGroup v-if="activeTraits.length" card title="首领特性" :items="activeTraits">
            <template #head-end>
              <span v-if="activeNd.invasion" class="nk-egd-pollchip" :data-level="activeNd.invasion.level">{{ pollutionLabel(activeNd.invasion) }}</span>
            </template>
          </EndgameTraitGroup>
          <StageContent :stage="activeNd" :is-boss="true" headless hide-damage />
          <EndgameBuffGroup v-if="activeBuffs.length" title="赛季增益" :items="activeBuffs" />
        </div>
      </div>
      <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
        <EnemyCard v-for="m in tierceMonsters" :key="m.id" :monster="m" />
      </div>
    </div>
  </template>
</template>
