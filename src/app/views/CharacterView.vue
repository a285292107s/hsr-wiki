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
import { useScrollSpy } from '../composables/use-scroll-spy';
import CharHero from '../character/CharHero.vue';
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
  if (data) document.title = `${data.name} - ${SITE_NAME}`;
});
/** 渲染数据：强化模式 → 强化视图；原始模式 → 原数据 */
const d = computed<CharacterData | null>(() => char.renderData);

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

/** 强化摘要（保留官方 <color> 强调词，gameTagsToHtml 渲染） */
const enhNotes = computed<string[]>(() => {
  if (!char.enhKey || !char.data) return [];
  const enh = char.data.enhanced && char.data.enhanced[char.enhKey];
  const descs = enh && (enh.descs as string[] | undefined);
  if (!descs || !descs.length) return [];
  return descs.map((t) => gameTagsToHtml(t));
});

/** 强化角标：当前强化键下被强化的技能/星魂 ID 集合（原始/对比模式为 null——对比态无需角标） */
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

/** 导航区块：按实际渲染过滤（缺数据区块同步隐藏，编号缺口保留）；
 *  对比模式页面级收敛——仅保留变化三区块（技能/附加/星魂），其余模块整体隐藏 */
const navSections = computed(() => {
  const dd = d.value;
  if (!dd) return [];
  if (char.compareOn) {
    return sectionDefs.filter((s) => s.id === 'skills' || s.id === 'talents' || s.id === 'eidolons');
  }
  const vis = new Set(visibleSections(dd));
  return sectionDefs.filter((s) => vis.has(s.id));
});

/** 内容区块可见性（与导航同源：visibleSections 单一事实源，驱动面板挂载门控；数据未就绪为空集） */
const vis = computed(() => new Set(visibleSections(d.value)));
const pageRef = ref<HTMLElement | null>(null);
const enhBarRef = ref<HTMLElement | null>(null);

/** 面板 DOM 引用（d 就绪后收集一次；角色切换时重新收集） */
let panels: HTMLElement[] = [];

function collectPanels(): void {
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
}

/** 滚动追踪：区块导航激活态 + 阅读进度 + 返回顶部（原 onScroll/jumpTo/scrollTop 收敛于此） */
const { activeId, progress, showTop, jumpTo, scrollTop } = useScrollSpy(
  pageRef,
  () => navSections.value.map((s) => s.id),
  (id) => panels.find((p) => p.dataset.panel === id) || null,
  { offset: () => (enhBarRef.value?.offsetHeight || 0) + 12 },
);

/* ═══════════ 卸载清理 ═══════════ */

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
      <!-- 吸顶工具条：区块导航 + 阅读进度线（强化模式切换已下沉至 skills 模块上方） -->
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

      <!-- 内容平铺：头图 + 各区块按序排列（技能 → 附加能力 → 星魂 → 属性加成 → 光锥/配队 → 遗器 → 角色档案 → 配音） -->
      <div class="nk-panels">
        <!-- 数据区块挂载门控与吸顶导航同源（visibleSections）：缺数据区块整体不挂载，杜绝「导航有、正文空」漂移。
             hero 概览区恒显（含 spine/属性总览），不参与门控，对比模式下同样保留（上下文锚点） -->
        <div class="nk-panel nk-panel--overview nk-panel--flat" data-panel="hero">
          <CharHero :d="d" :char-id="char.charId" />
        </div>

        <!-- 强化模式（skills 模块上方）：模块标题 + 选项卡切换 + 强化摘要 -->
        <div v-if="vis.has('skills') && char.enhKeys.length" class="nk-panel nk-panel--flat nk-enh-module">
          <div class="nk-enh-module__head">
            <span class="nk-enh-module__idx">00</span>
            <span>强化模式</span>
          </div>
          <div class="nk-enh-tabs" role="group" aria-label="强化模式切换">
            <button
              :class="['nk-enh-tab', { 'nk-enh-tab--active': !char.enhKey }]"
              type="button"
              :aria-pressed="!char.enhKey"
              @click="char.setEnhKey(null)"
            >
              原始
            </button>
            <button
              v-for="k in char.enhKeys"
              :key="k"
              :class="['nk-enh-tab', { 'nk-enh-tab--active': char.enhKey === k }]"
              type="button"
              :aria-pressed="char.enhKey === k"
              @click="char.setEnhKey(k)"
            >
              <span class="nk-enh-tab__idx">V{{ k }}</span>强化
            </button>
            <button
              :class="['nk-enh-tab', { 'nk-enh-tab--active': char.compareOn }]"
              type="button"
              :aria-pressed="char.compareOn"
              @click="char.setCompareOn(true)"
            >
              对比
            </button>
          </div>
          <div class="nk-enh-notes">
            <div v-if="enhNotes.length" class="nk-enh-notes__banner">
              <span class="nk-enh-notes__title">强化内容</span>
              <ul class="nk-enh-notes__list">
                <li v-for="(n, i) in enhNotes" :key="i" v-html="n"></li>
              </ul>
            </div>
          </div>
        </div>

        <div v-if="vis.has('skills')" class="nk-panel nk-panel--flat" data-panel="skills">
          <!-- 对比模式：只渲染实际变化的技能卡（ComparePanel 内部过滤） -->
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['skills']"
          />
          <SkillsPanel v-else :d="d" :char-id="char.charId" :enh-key="char.enhKey" :anim-db="animDb" :enh-mark="enhMark" />
        </div>
        <div v-if="vis.has('talents')" class="nk-panel nk-panel--flat" data-panel="talents">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['talents']"
          />
          <OverviewPanel v-else :d="d" :sections="['talents']" />
        </div>
        <div v-if="vis.has('eidolons')" class="nk-panel nk-panel--flat" data-panel="eidolons">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['eidolons']"
          />
          <EidolonsPanel v-else :d="d" :char-id="char.charId" :enh-mark="enhMark" />
        </div>
        <div v-if="vis.has('bonuses') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="bonuses">
          <OverviewPanel :d="d" :sections="['bonuses']" />
        </div>
        <div v-if="vis.has('cones') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="cones">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['cones']"
          />
        </div>
        <div v-if="vis.has('teams') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="teams">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['teams']"
          />
        </div>
        <div v-if="vis.has('relics') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="relics">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['relics']"
          />
        </div>
        <div v-if="vis.has('stories') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="stories">
          <OverviewPanel :d="d" :sections="['stories']" />
        </div>
        <div v-if="vis.has('profile') && !char.compareOn" class="nk-panel nk-panel--flat" data-panel="profile">
          <OverviewPanel :d="d" :sections="['profile']" />
        </div>
      </div>
    </template>
  </div>
</template>
