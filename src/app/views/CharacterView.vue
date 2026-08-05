<script setup lang="ts">
/**
 * 角色详情页（编排层）
 * 结构：CharHero（视差立绘 + Spine + 属性 diff）/ 吸顶 Tabs（含强化模式切换）/ 四面板
 *   概览 OverviewPanel / 技能 SkillsPanel / 星魂 EidolonsPanel / 配装 BuildsPanel
 * 本文件保留：加载编排、Tab 切换（含热键）、强化模式状态、骨架屏与错误态。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useCharacterStore } from '../stores/character';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import CharHero from '../character/CharHero.vue';
import OverviewPanel from '../character/OverviewPanel.vue';
import SkillsPanel from '../character/SkillsPanel.vue';
import EidolonsPanel from '../character/EidolonsPanel.vue';
import BuildsPanel from '../character/BuildsPanel.vue';
import { loadSkillAnimations } from '../../services/api';
import { stripAllTags } from '../../lib/format';
import { CHAR_TABS } from '../../lib/constants';
import type { CharacterData, SkillAnimationsDb } from '../../services/types';
// 角色详情页专属样式（随本路由 chunk 懒加载；技能卡片原语与光锥页共享）
import '../../styles/skill-card.css';
import '../../styles/character.css';

const route = useRoute();
const app = useAppStore();
const char = useCharacterStore();

/* ═══════════ 加载 ═══════════ */

const phase = computed<'loading' | 'error' | 'ready'>(() =>
  char.error ? 'error' : char.data ? 'ready' : 'loading',
);
/** 延迟显示骨架屏：加载超过阈值才呈现，缓存命中的快速切换不闪骨架屏 */
const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');
/** 动态页面标题 */
watch(() => char.data, (data) => {
  if (data) document.title = `${data.name} - 咸鱼百科`;
});
/** 渲染数据：加强模式 → 加强视图 + 重映射旧视图；原始模式 → oldD=null */
const d = computed<CharacterData | null>(() => char.renderData.d);
const oldD = computed<CharacterData | null>(() => char.renderData.oldD);

/** 技能动画映射（可选增强，失败静默） */
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
  window.addEventListener('keydown', onKeydown);
  void load(String(route.params.id || ''));
});
// 角色 → 角色导航（同组件复用）时重新加载
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== char.charId) void load(String(id));
  },
);

/* ═══════════ Tabs / 强化模式 ═══════════ */

const TAB_DEFS: { key: string; label: string }[] = [
  { key: 'overview', label: '概览' },
  { key: 'skills', label: '技能' },
  { key: 'eidolons', label: '星魂' },
  { key: 'builds', label: '配装' },
];

/** 加强摘要横幅（剥离 <color> 标签） */
const enhNotes = computed<string[]>(() => {
  if (!char.enhKey || !char.data) return [];
  const enh = char.data.enhanced && char.data.enhanced[char.enhKey];
  const descs = enh && (enh.descs as string[] | undefined);
  if (!descs || !descs.length) return [];
  return descs.map((t) => stripAllTags(t));
});

/** 角色页热键 1-4 切 Tab（忽略输入框，生命周期内作用域） */
function onKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target as HTMLElement | null;
  if (t) {
    const tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return;
  }
  const idx = ['1', '2', '3', '4'].indexOf(e.key);
  if (idx >= 0) char.setTab(CHAR_TABS[idx]);
}

/* ─── Tabs 横向滚动淡出提示（检测溢出；滚到末尾自动隐藏） ─── */
const tabsRef = ref<HTMLElement | null>(null);
const tabsOverflow = ref(false);
const tabsAtEnd = ref(false);
const tabsFade = computed(() => tabsOverflow.value && !tabsAtEnd.value);
let tabsRo: ResizeObserver | null = null;
function checkTabsOverflow(): void {
  const el = tabsRef.value;
  if (!el) { tabsOverflow.value = false; return; }
  tabsOverflow.value = el.scrollWidth > el.clientWidth + 2;
  tabsAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
}
function onTabsScroll(): void {
  const el = tabsRef.value;
  if (!el) return;
  tabsAtEnd.value = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
}
watch(
  () => phase.value,
  () => {
    void nextTick(() => {
      if (tabsRo) { tabsRo.disconnect(); tabsRo = null; }
      if (tabsRef.value) {
        tabsRo = new ResizeObserver(checkTabsOverflow);
        tabsRo.observe(tabsRef.value);
      }
      checkTabsOverflow();
    });
  },
);

/* ═══════════ 卸载清理 ═══════════ */

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (tabsRo) { tabsRo.disconnect(); tabsRo = null; }
  char.reset();
});
</script>

<template>
  <div class="nk-page--detail" :aria-busy="phase === 'loading'">
    <!-- ─── 加载骨架屏（延迟显示，缓存命中不闪屏） ─── -->
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
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--block" style="margin-top:14px;"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--bar-line"></div>
          <div class="nk-skeleton__stat-grid" style="margin-top:12px;">
            <div v-for="i in 8" :key="i" class="nk-sk nk-sk--shimmer nk-sk--stat"></div>
          </div>
        </div>
      </div>
      <div class="nk-skeleton__tabs">
        <div class="nk-skeleton__tabs-bar">
          <div class="nk-skeleton__tabs-left">
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-xs"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-xs"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-xs"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-xs"></div>
          </div>
          <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-md"></div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-sm"></div>
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

    <!-- ─── 错误态 ─── -->
    <div v-else-if="phase === 'error'" class="nk-error-state">
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

    <!-- ─── 正文 ─── -->
    <template v-else-if="d">
      <CharHero :d="d" :old-d="oldD" :char-id="char.charId" />

      <!-- Tabs + 强化模式切换器（外壳全宽吸顶，内容条与面板同宽居中） -->
      <div class="nk-tabs">
        <div ref="tabsRef" class="nk-tabs__bar" :class="{ 'nk-tabs--fade': tabsFade }" @scroll.passive="onTabsScroll">
          <div class="nk-tabs__left">
            <button
              v-for="t in TAB_DEFS"
              :key="t.key"
              :class="['nk-tab', { 'nk-tab--active': char.activeTab === t.key }]"
              type="button"
              @click="char.setTab(t.key)"
            >
              {{ t.label }}
            </button>
          </div>
          <div v-if="char.enhKeys.length" class="nk-enh-toggle">
            <span class="nk-enh-toggle__label">强化模式</span>
            <button
              :class="['nk-enh-toggle__btn', { 'nk-enh-toggle__btn--active': !char.enhKey }]"
              type="button"
              @click="char.setEnhKey(null)"
            >
              原始
            </button>
            <button
              v-for="k in char.enhKeys"
              :key="k"
              :class="['nk-enh-toggle__btn', { 'nk-enh-toggle__btn--active': char.enhKey === k }]"
              type="button"
              @click="char.setEnhKey(k)"
            >
              强化 V{{ k }}
            </button>
          </div>
        </div>
      </div>

      <!-- 加强摘要横幅 -->
      <div class="nk-enh-notes">
        <div v-if="enhNotes.length" class="nk-enh-notes__banner">
          <span class="nk-enh-notes__title">强化内容</span>
          <ul class="nk-enh-notes__list">
            <li v-for="(n, i) in enhNotes" :key="i">{{ n }}</li>
          </ul>
        </div>
      </div>

      <!-- 面板区（全部挂载，nk-panel--active 切换显示，保留各面板交互状态） -->
      <div class="nk-panels">
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'overview' }]" data-panel="overview">
          <OverviewPanel :d="d" :old-d="oldD" />
        </div>
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'skills' }]" data-panel="skills">
          <SkillsPanel :d="d" :old-d="oldD" :char-id="char.charId" :enh-key="char.enhKey" :anim-db="animDb" />
        </div>
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'eidolons' }]" data-panel="eidolons">
          <EidolonsPanel :d="d" :old-d="oldD" :char-id="char.charId" />
        </div>
        <div :class="['nk-panel', { 'nk-panel--active': char.activeTab === 'builds' }]" data-panel="builds">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
          />
        </div>
      </div>
    </template>
  </div>
</template>
