<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useCharacterStore } from '../stores/character';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useScrollSpy } from '../composables/use-scroll-spy';
import CharHero from '../character/CharHero.vue';
import StatsPanel from '../character/StatsPanel.vue';
import OverviewPanel from '../character/OverviewPanel.vue';
import SkillsPanel from '../character/SkillsPanel.vue';
import EidolonsPanel from '../character/EidolonsPanel.vue';
import BuildsPanel from '../character/BuildsPanel.vue';
import ComparePanel from '../character/ComparePanel.vue';
import { visibleSections, SECTION_IDX } from '../character/sections';
import { SITE_NAME } from '../../lib/constants';
import { loadSkillAnimations } from '../../services/api';
import { gameTagsToHtml } from '../../lib/format';
import type { CharacterData, SkillAnimationsDb } from '../../services/types';
import '../../styles/skill-card.css';
import '../../styles/character.css';

const route = useRoute();
const app = useAppStore();
const char = useCharacterStore();


const phase = computed<'loading' | 'error' | 'ready'>(() =>
  char.error ? 'error' : char.data ? 'ready' : 'loading',
);
const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');
watch(() => char.data, (data) => {
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});
const d = computed<CharacterData | null>(() => char.renderData);

const animDb = ref<SkillAnimationsDb | null>(null);

async function load(id: string): Promise<void> {
  try {
    await char.load(id);
    loadSkillAnimations().then((db) => { animDb.value = db; }).catch(() => {});
  } catch {
    app.toast('error', `加载失败: ${char.error || '未知错误'}`);
  }
}
function retry(): void {
  void load(String(route.params.id || ''));
}

onMounted(() => {
  void load(String(route.params.id || ''));
});
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== char.charId) void load(String(id));
  },
);

const enhNotes = computed<string[]>(() => {
  if (!char.enhKey || !char.data) return [];
  const enh = char.data.enhanced && char.data.enhanced[char.enhKey];
  const descs = enh && (enh.descs as string[] | undefined);
  if (!descs || !descs.length) return [];
  return descs.map((t) => gameTagsToHtml(t));
});

const enhMark = computed<{ skillIds: Set<number>; rankIds: Set<number> } | null>(() => {
  if (char.compareOn) return null;
  const key = char.enhKey;
  if (!key || !d.value) return null;
  const enh = d.value.enhanced && d.value.enhanced[key];
  if (!enh) return null;
  return {
    skillIds: new Set(enh.skill_ids || []),
    rankIds: new Set(enh.rank_ids || []),
  };
});

const enhLabel = computed<string>(() => (char.enhKey ? `V${char.enhKey}` : ''));

const enhStateLabel = computed<string>(() => {
  if (char.compareOn) return '对比';
  return char.enhKey ? `V${char.enhKey} 强化` : '原始';
});

const sectionDefs = [
  { id: 'stats', label: '属性' },
  { id: 'skills', label: '技能' },
  { id: 'talents', label: '附加' },
  { id: 'eidolons', label: '星魂' },
  { id: 'bonuses', label: '加成' },
  { id: 'cones', label: '光锥' },
  { id: 'teams', label: '队伍' },
  { id: 'relics', label: '遗器' },
  { id: 'stories', label: '档案' },
  { id: 'profile', label: '配音' },
] as const;

const navSections = computed(() => {
  const dd = d.value;
  if (!dd) return [];
  if (char.compareOn) {
    return sectionDefs.filter((s) => s.id === 'skills' || s.id === 'talents' || s.id === 'eidolons');
  }
  const vis = new Set(visibleSections(dd));
  return sectionDefs.filter((s) => vis.has(s.id));
});

const vis = computed(() => new Set(visibleSections(d.value)));
const pageRef = ref<HTMLElement | null>(null);
const enhBarRef = ref<HTMLElement | null>(null);

let panels: HTMLElement[] = [];
const enhModuleRef = ref<HTMLElement | null>(null);

/** Hero 强化徽章点击：滚动到强化模块（scroll-margin-top 抵消吸顶工具条遮挡） */
function scrollToEnh(): void {
  enhModuleRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function collectPanels(): void {
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
}

const { activeId, progress, showTop, jumpTo, scrollTop } = useScrollSpy(
  pageRef,
  () => navSections.value.map((s) => s.id),
  (id) => panels.find((p) => p.dataset.panel === id) || null,
  { offset: () => (enhBarRef.value?.offsetHeight || 0) + 12 },
);


// 数据就绪/对比模式切换后收集面板引用（模板条件渲染，需等下一帧 DOM 稳定）
watch([d, () => char.compareOn], async (val) => {
  if (val) {
    await nextTick();
    collectPanels();
  }
});

onBeforeUnmount(() => {
  char.reset();
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-char-page" :aria-busy="phase === 'loading'">
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--char"
      role="status"
      aria-live="polite"
      aria-label="角色详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer nk-sk--fill"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:90px;"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-lg"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-md"></div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:64px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:60px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:70px;"></div>
          </div>
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--block" style="margin-top:16px;"></div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:120px;"></div>
        <div class="nk-skeleton__stat-grid">
          <div v-for="i in 8" :key="i" class="nk-sk nk-sk--shimmer nk-sk--stat"></div>
        </div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-sm" style="margin-top:24px;"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:100px;"></div>
        <div class="nk-skeleton__stat-grid">
          <div v-for="i in 6" :key="i" class="nk-sk nk-sk--shimmer nk-sk--block" style="height:56px;"></div>
        </div>
        <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-sm"></div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer nk-sk--text-md nk-sk--bar-md"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--block" style="height:36px;border-radius:6px;"></div>
        </div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer nk-sk--text-md" style="width:100px;"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--block" style="height:36px;border-radius:6px;"></div>
        </div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">角色数据加载失败</div>
      <div v-if="char.error" class="nk-error-state__detail">{{ char.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="d">
      <div ref="enhBarRef" class="nk-enh-bar">
        <div class="nk-enh-bar__inner">
          <nav class="nk-secnav" aria-label="内容区块导航">
            <button
              v-for="s in navSections"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeId === s.id }"
              :aria-current="activeId === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ SECTION_IDX[s.id] }}</span>
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-enh-bar__progress" :style="{ width: `${progress}%` }"></div>
      </div>

      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <div class="nk-panels">
        <!-- 数据区块挂载门控与吸顶导航同源（visibleSections）：缺数据区块整体不挂载，杜绝「导航有、正文空」漂移。
             hero 概览区恒显（以立绘展示为主），不参与门控，对比模式下同样保留（上下文锚点） -->
        <div class="nk-panel nk-panel--overview" data-panel="hero">
          <CharHero :d="d" :char-id="char.charId" :enh-keys="char.enhKeys" @go-enh="scrollToEnh" />
        </div>

        <!-- 对比模式下同样保留：面板属性与强化形态无关 -->
        <div v-if="vis.has('stats')" class="nk-panel" data-panel="stats">
          <StatsPanel :d="d" />
        </div>

        <div v-if="vis.has('skills') && char.enhKeys.length" ref="enhModuleRef" class="nk-panel nk-enh-module">
          <div class="nk-enh-module__head">
            <span class="nk-enh-module__mark" aria-hidden="true"></span>
            <span>强化形态</span>
            <span class="nk-enh-module__state">{{ enhStateLabel }}</span>
          </div>
          <div class="nk-enh-tabs" role="group" aria-label="强化模式切换">
            <button
              :class="['nk-enh-tab', { 'nk-enh-tab--active': !char.enhKey && !char.compareOn }]"
              type="button"
              :aria-pressed="!char.enhKey && !char.compareOn"
              @click="char.setEnhKey(null)"
            >
              原始
            </button>
            <button
              v-for="k in char.enhKeys"
              :key="k"
              :class="['nk-enh-tab', { 'nk-enh-tab--active': char.enhKey === k && !char.compareOn }]"
              type="button"
              :aria-pressed="char.enhKey === k && !char.compareOn"
              @click="char.setEnhKey(k)"
            >
              <span class="nk-enh-tab__idx">V{{ k }}</span>强化
            </button>
            <span class="nk-enh-tabs__sep" aria-hidden="true"></span>
            <button
              :class="['nk-enh-tab nk-enh-tab--cmp', { 'nk-enh-tab--active': char.compareOn }]"
              type="button"
              :aria-pressed="char.compareOn"
              @click="char.setCompareOn(true)"
            >
              对比
            </button>
          </div>
          <div v-if="enhNotes.length" class="nk-enh-notes">
            <span class="nk-enh-notes__title">强化内容</span>
            <ul class="nk-enh-notes__list">
              <li v-for="(n, i) in enhNotes" :key="i" v-html="n"></li>
            </ul>
          </div>
        </div>

        <div v-if="vis.has('skills')" class="nk-panel" data-panel="skills">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['skills']"
          />
          <SkillsPanel v-else :d="d" :char-id="char.charId" :enh-key="char.enhKey" :anim-db="animDb" :enh-mark="enhMark" />
        </div>
        <div v-if="vis.has('talents')" class="nk-panel" data-panel="talents">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['talents']"
          />
          <OverviewPanel v-else :d="d" :sections="['talents']" />
        </div>
        <div v-if="vis.has('eidolons')" class="nk-panel" data-panel="eidolons">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['eidolons']"
          />
          <EidolonsPanel v-else :d="d" :char-id="char.charId" :enh-mark="enhMark" :enh-label="enhLabel" />
        </div>
        <div v-if="vis.has('bonuses') && !char.compareOn" class="nk-panel" data-panel="bonuses">
          <OverviewPanel :d="d" :sections="['bonuses']" />
        </div>
        <div v-if="vis.has('cones') && !char.compareOn" class="nk-panel" data-panel="cones">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['cones']"
          />
        </div>
        <div v-if="vis.has('teams') && !char.compareOn" class="nk-panel" data-panel="teams">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['teams']"
          />
        </div>
        <div v-if="vis.has('relics') && !char.compareOn" class="nk-panel" data-panel="relics">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['relics']"
          />
        </div>
        <div v-if="vis.has('stories') && !char.compareOn" class="nk-panel" data-panel="stories">
          <OverviewPanel :d="d" :sections="['stories']" />
        </div>
        <div v-if="vis.has('profile') && !char.compareOn" class="nk-panel" data-panel="profile">
          <OverviewPanel :d="d" :sections="['profile']" />
        </div>
      </div>
    </template>
  </div>
</template>
