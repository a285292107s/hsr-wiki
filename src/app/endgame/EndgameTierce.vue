<script setup lang="ts">
/**
 * 终局赛季详情 · 星启模式面板（独立进阶关卡：星启弱点 / 目标 / Boss）。
 * 节点/波次折叠状态机本地化（默认全部展开，仅记录「已折叠」条目）。
 */
import { computed, ref, watch } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import {
  TARGET_TYPE_LABEL, elemRow, monWaveGroups, nodeSummary, targetHtml, targetTypeIconHtml,
} from './renders';
import { itemIconUrl } from '../../lib/format';
import { loadLocalItems } from '../../services/api';
import EnemyCard from '../components/EnemyCard.vue';
import type { LocalItemEntry, MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

/** 板块编号（与吸顶条导航同源：sections.ts 单一事实源） */
const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [])));

const tierceDamage = computed<string[]>(() => props.data.tierce?.damage_types || []);
const tierceCountdown = computed<number>(() => props.data.tierce?.countdown || 0);
const tierceScore = computed<number | null>(() => props.data.tierce?.score ?? null);
const tierceLevel = computed<number>(() => props.data.tierce?.level || 0);
const tierceTargets = computed(() => props.data.tierce?.targets || []);
const tierceMonsters = computed(() => props.data.tierce?.monsters || []);
/** 星启 3 节点敌方（节点 1/2 = 常规最高难度关上下半场；节点 3 = 星启附加关） */
const tierceNodes = computed(() => props.data.tierce?.nodes || []);

/** 物品库 id → {name, icon}（星启通关奖励映射；loadLocalItems 共享单例去重） */
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
    loadLocalItems()
      .then((list) => { itemMap.value = new Map(list.map((it) => [it.id, { name: it.name, icon: it.icon }])); })
      .catch(() => { /* 失败降级空表：奖励名称回退 #id，不阻塞正文 */ });
  },
  { immediate: true },
);

/* ═══════════ 星启节点 / 波次折叠状态机 ═══════════
 * 默认全部展开；仅记录「已折叠」的条目，未命中视为展开（无需初始化键集）。 */
const collapsedNodes = ref<Set<string>>(new Set());
const collapsedWaves = ref<Set<string>>(new Set());
function nodeKey(ni: number): string { return `n${ni}`; }
function waveKey(ni: number, wi: number): string { return `n${ni}-w${wi}`; }
function isNodeExpanded(ni: number): boolean { return !collapsedNodes.value.has(nodeKey(ni)); }
function isWaveExpanded(ni: number, wi: number): boolean { return !collapsedWaves.value.has(waveKey(ni, wi)); }
function toggleNode(ni: number): void {
  const s = new Set(collapsedNodes.value);
  const k = nodeKey(ni);
  if (s.has(k)) s.delete(k); else s.add(k);
  collapsedNodes.value = s;
}
function toggleWave(ni: number, wi: number): void {
  const s = new Set(collapsedWaves.value);
  const k = waveKey(ni, wi);
  if (s.has(k)) s.delete(k); else s.add(k);
  collapsedWaves.value = s;
}
</script>

<template>
  <template v-if="data.tierce">
    <h2 id="egd-tierce" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['tierce'] }}</span>星启模式 STARLIT</h2>
    <div class="nk-egd-tierce">
      <!-- 星启节点指标：推荐属性 / 等级 / 回合 / 分数（副注把内部计数翻译成玩家语义） -->
      <div v-if="tierceDamage.length || tierceLevel || tierceCountdown || tierceScore != null" class="nk-egd-tierce__stats">
        <div v-if="tierceDamage.length" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val nk-egd-tierce__val--elems" v-html="elemRow(tierceDamage)"></span>
          <span class="nk-egd-tierce__label">推荐属性 RECOMMENDED</span>
        </div>
        <div v-if="tierceLevel" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceLevel }}</span>
          <span class="nk-egd-tierce__label">敌人等级 ENEMY LV</span>
        </div>
        <div v-if="tierceCountdown" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceCountdown }}</span>
          <span class="nk-egd-tierce__label">回合限制 CYCLES</span>
        </div>
        <div v-if="tierceScore != null" class="nk-egd-tierce__stat">
          <span class="nk-egd-tierce__val">{{ tierceScore.toLocaleString() }}</span>
          <span class="nk-egd-tierce__label">分数限制 SCORE</span>
        </div>
      </div>
      <!-- 星启目标：整场星启挑战的评价条件（分数档/剩余轮数/减员限制），
           与 3 个节点（敌方配置）正交，非节点级条件 -->
      <ol v-if="tierceTargets.length" class="nk-egd-tierce__targets">
        <li v-for="(t, i) in tierceTargets" :key="i" class="nk-egd-node">
          <span
            v-if="t.type && TARGET_TYPE_LABEL[t.type]"
            class="nk-egd-node__type"
            :title="TARGET_TYPE_LABEL[t.type]"
            v-html="targetTypeIconHtml(t.type)"
          ></span>
          <span class="nk-egd-node__text" v-html="targetHtml(t)"></span>
        </li>
      </ol>
      <!-- 星启敌方：3 节点各自挑战（节点 1/2 = 常规最高难度关上下半场；节点 3 = 星启附加关），
           节点内按波次分组的完整信息卡
           分组层级：节点 = 外层章节卡（左模式色竖条 + HUD 角标 + 整头可折叠）；波 = 中层分组容器（L 刻度线 + 级联色条 + 头可折叠）；敌 = 内层内容卡 -->
      <ul v-if="tierceNodes.length" class="nk-egd-tierce__waves" aria-label="星启节点列表">
        <li
          v-for="(nd, ni) in tierceNodes"
          :key="ni"
          class="nk-egd-tierce__node"
          :class="{ 'nk-egd-tierce__node--collapsed': !isNodeExpanded(ni) }"
        >
          <!-- 节点卡片头（按钮：点击切换整个节点折叠） -->
          <button
            type="button"
            class="nk-egd-tierce__nodehead"
            :aria-expanded="isNodeExpanded(ni)"
            :aria-controls="`egd-node-${ni}-body`"
            :aria-label="`节点 ${nd.idx}，${nodeSummary(nd)}，点击${isNodeExpanded(ni) ? '折叠' : '展开'}`"
            @click="toggleNode(ni)"
          >
            <span class="nk-egd-tierce__nodelabel"><span class="nk-egd-tierce__nodezh">节点</span>NODE-{{ String(nd.idx).padStart(2, '0') }}</span>
            <span class="nk-egd-tierce__nodesummary" :title="nodeSummary(nd)">{{ nodeSummary(nd) }}</span>
            <svg class="nk-egd-tierce__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <!-- 节点卡片体（waves 容器，grid-rows 折叠过渡）；折叠时 inert 移出焦点序 -->
          <div
            class="nk-egd-tierce__nodebody"
            :id="`egd-node-${ni}-body`"
            role="region"
            :inert="!isNodeExpanded(ni)"
            :class="{ 'nk-egd-tierce__nodebody--collapsed': !isNodeExpanded(ni) }"
          >
            <div class="nk-egd-tierce__nodebody-inner">
              <div
                v-for="(g, gi) in monWaveGroups(nd.monsters)"
                :key="gi"
                class="nk-egd-tierce__wave"
                :class="{ 'nk-egd-tierce__wave--collapsed': !isWaveExpanded(ni, gi) }"
              >
                <!-- 波次头部（永远可见：分组标签 + 敌数摘要；多波时显示，单波时仍展示精简版标签用于层级一致） -->
                <button
                  type="button"
                  class="nk-egd-tierce__wavehead"
                  :aria-expanded="isWaveExpanded(ni, gi)"
                  :aria-controls="`egd-wave-${ni}-${gi}-body`"
                  :aria-label="`节点 ${nd.idx} 第 ${g.wave} 波，${g.items.length} 敌，点击${isWaveExpanded(ni, gi) ? '折叠' : '展开'}`"
                  @click="toggleWave(ni, gi)"
                >
                  <span class="nk-egd-tierce__wavename">第 {{ g.wave }} 波</span>
                  <span class="nk-egd-tierce__wavesummary" :title="`${g.items.length} 敌`">× {{ g.items.length }} 敌</span>
                  <svg class="nk-egd-tierce__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <!-- 波次体：敌方卡片网格（折叠过渡）；折叠时 inert 移出焦点序 -->
                <div
                  class="nk-egd-tierce__wavebody"
                  :id="`egd-wave-${ni}-${gi}-body`"
                  role="group"
                  :inert="!isWaveExpanded(ni, gi)"
                  :class="{ 'nk-egd-tierce__wavebody--collapsed': !isWaveExpanded(ni, gi) }"
                >
                  <div class="nk-egd-tierce__wavebody-inner">
                    <div class="nk-egd-mons">
                      <EnemyCard v-for="m in g.items" :key="`${m.id}-${ni}-${gi}`" :monster="m" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      </ul>
      <!-- 兼容：无 nodes 时回退 tierceMonsters 直接渲染 -->
      <div v-else-if="tierceMonsters.length" class="nk-egd-mons">
        <EnemyCard v-for="m in tierceMonsters" :key="m.id" :monster="m" />
      </div>
      <!-- 通关奖励（仅虚构叙事：EGEEJLHBALB 每期固定，与 score 通关分数线对应） -->
      <div v-if="tierceRewards.length" class="nk-egd-reward">
        <div class="nk-egd-reward__head">
          <span class="nk-egd-reward__label">通关奖励</span>
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
  </template>
</template>