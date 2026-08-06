<script setup lang="ts">
/**
 * 角色详情页（编排层）
 * 结构：吸顶增强切换工具条 / 平铺内容（头图 → 技能 → 附加能力 → 星魂 → 属性加成 →
 *   光锥/配队 → 遗器 → 角色档案 → 配音，滚动浏览）
 * 本文件保留：加载编排、强化模式状态、骨架屏与错误态。
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
  void load(String(route.params.id || ''));
});
// 角色 → 角色导航（同组件复用）时重新加载
watch(
  () => route.params.id,
  (id) => {
    if (id && String(id) !== char.charId) void load(String(id));
  },
);

/* ═══════════ 强化模式 ═══════════ */

/** 加强摘要横幅（剥离 <color> 标签） */
const enhNotes = computed<string[]>(() => {
  if (!char.enhKey || !char.data) return [];
  const enh = char.data.enhanced && char.data.enhanced[char.enhKey];
  const descs = enh && (enh.descs as string[] | undefined);
  if (!descs || !descs.length) return [];
  return descs.map((t) => stripAllTags(t));
});

/* ═══════════ 区块导航（平铺长页：吸顶索引条 + 当前位置高亮 + 阅读进度 + 返回顶部） ═══════════ */

/** 区块定义：id 对应面板 data-panel，顺序即页面视觉顺序（hero 概览区在顶部，无需跳转） */
const sectionDefs = [
  { id: 'skills', label: '技能' },
  { id: 'talents', label: '附加' },
  { id: 'eidolons', label: '星魂' },
  { id: 'bonuses', label: '属性' },
  { id: 'cones', label: '光锥' },
  { id: 'teams', label: '队伍' },
  { id: 'relics', label: '遗器' },
  { id: 'stories', label: '档案' },
  { id: 'profile', label: '配音' },
] as const;

const pageRef = ref<HTMLElement | null>(null);
const enhBarRef = ref<HTMLElement | null>(null);
/** 当前阅读区块（滚动位置计算；顶部概览区时为空不高亮） */
const activeSection = ref<string>('');
/** 页面阅读进度（0-100，驱动吸顶条底部进度线） */
const progressPct = ref(0);
/** 滚动超过阈值后显示返回顶部 */
const showTop = ref(false);
/** 系统减弱动态偏好：跳转/回顶改为瞬时滚动 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 面板 DOM 引用（d 就绪后收集一次；角色切换时重新收集） */
let panels: HTMLElement[] = [];
let rafId = 0;

function collectPanels(): void {
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
}

function onScroll(): void {
  if (rafId) return; // rAF 节流：滚动事件高频触发，逐帧仅计算一次
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    const c = pageRef.value;
    if (!c) return;
    // 阅读进度
    const max = c.scrollHeight - c.clientHeight;
    progressPct.value = max > 0 ? Math.min((c.scrollTop / max) * 100, 100) : 0;
    // 返回顶部阈值
    showTop.value = c.scrollTop > 480;
    // 当前区块：最后一个顶部越过工具条下沿的面板
    if (!panels.length) return;
    const cTop = c.getBoundingClientRect().top;
    const offset = enhBarRef.value?.offsetHeight || 0;
    let cur = '';
    for (const p of panels) {
      if (p.getBoundingClientRect().top - cTop <= offset + 12) {
        const id = p.dataset.panel || '';
        if (id) cur = id;
      } else break;
    }
    activeSection.value = cur;
  });
}

function jumpTo(id: string): void {
  const c = pageRef.value;
  if (!c) return;
  const el = c.querySelector<HTMLElement>(`.nk-panel[data-panel="${id}"]`);
  if (!el) return;
  // 目标 = 面板在容器中的偏移 - 吸顶工具条高度（内容不被遮挡）
  const offset = enhBarRef.value?.offsetHeight || 0;
  const top = el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop - offset;
  c.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
  activeSection.value = id;
}

function scrollTop(): void {
  pageRef.value?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
}

/* ═══════════ 卸载清理 ═══════════ */

onMounted(() => {
  pageRef.value?.addEventListener('scroll', onScroll, { passive: true });
});

// 数据就绪后收集面板引用（模板 v-else-if 渲染，需等下一帧 DOM 稳定）
watch(d, async (val) => {
  if (val) {
    await nextTick();
    collectPanels();
  }
});

onBeforeUnmount(() => {
  pageRef.value?.removeEventListener('scroll', onScroll);
  if (rafId) cancelAnimationFrame(rafId);
  char.reset();
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-char-page" :aria-busy="phase === 'loading'">
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
      <!-- 吸顶工具条：强化模式切换（可选）+ 区块导航 + 阅读进度线 -->
      <div ref="enhBarRef" class="nk-enh-bar">
        <div class="nk-enh-bar__inner">
          <template v-if="char.enhKeys.length">
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
            <span class="nk-enh-bar__divider" aria-hidden="true"></span>
          </template>
          <nav class="nk-secnav" aria-label="内容区块导航">
            <button
              v-for="(s, i) in sectionDefs"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeSection === s.id }"
              :aria-current="activeSection === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ String(i + 1).padStart(2, '0') }}</span>
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-enh-bar__progress" :style="{ width: `${progressPct}%` }"></div>
      </div>

      <!-- 返回顶部（滚动超过阈值出现） -->
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <!-- 加强摘要横幅 -->
      <div class="nk-enh-notes">
        <div v-if="enhNotes.length" class="nk-enh-notes__banner">
          <span class="nk-enh-notes__title">强化内容</span>
          <ul class="nk-enh-notes__list">
            <li v-for="(n, i) in enhNotes" :key="i">{{ n }}</li>
          </ul>
        </div>
      </div>

      <!-- 内容平铺：头图 + 各区块按序排列（技能 → 附加能力 → 星魂 → 属性加成 → 光锥/配队 → 遗器 → 角色档案 → 配音） -->
      <div class="nk-panels">
        <div class="nk-panel nk-panel--overview nk-panel--flat" data-panel="hero">
          <CharHero :d="d" :old-d="oldD" :char-id="char.charId" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="skills">
          <SkillsPanel :d="d" :old-d="oldD" :char-id="char.charId" :enh-key="char.enhKey" :anim-db="animDb" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="talents">
          <OverviewPanel :d="d" :old-d="oldD" :sections="['talents']" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="eidolons">
          <EidolonsPanel :d="d" :old-d="oldD" :char-id="char.charId" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="bonuses">
          <OverviewPanel :d="d" :old-d="oldD" :sections="['bonuses']" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="cones">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['cones']"
          />
        </div>
        <div v-if="d.teams && d.teams.length" class="nk-panel nk-panel--flat" data-panel="teams">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['teams']"
          />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="relics">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['relics']"
          />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="stories">
          <OverviewPanel :d="d" :old-d="oldD" :sections="['stories']" />
        </div>
        <div class="nk-panel nk-panel--flat" data-panel="profile">
          <OverviewPanel :d="d" :old-d="oldD" :sections="['profile']" />
        </div>
      </div>
    </template>
  </div>
</template>
