<script setup lang="ts">
/**
 * 通用目录引擎组件（移植自原 catalog.js 的 initGenericCatalog + initCatalog）
 *
 * 数据源：角色走本地转换数据；其余目录统一走 CDN fetchData。
 * >400 条目启用虚拟网格；卡片走 renderCard HTML（v-html）+ 事件委托。
 * 卡片点击：角色详情 → SPA 导航；未迁移详情页 → 静默忽略。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useVirtualGrid, vReveal } from './use-virtual-grid';
import type { CatalogItem, CatalogPageConfig, CatalogSubNavItem } from './types';

const props = defineProps<{ config: CatalogPageConfig }>();

const app = useAppStore();
const router = useRouter();
const route = useRoute();

const VIRTUAL_THRESHOLD = 400;

type Phase = 'loading' | 'ready' | 'error';
const phase = ref<Phase>('loading');
/** 延迟显示骨架屏：加载超过阈值才呈现，缓存命中的快速切换不闪骨架屏 */
const showSkeleton = ref(false);
const SKELETON_DELAY = 150;
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;
const errorMsg = ref('');
const items = ref<CatalogItem[]>([]);
/** 搜索关键词（从 URL query.q 初始化） */
const query = ref(String(route.query.q || ''));
/** 筛选状态（从 URL query 初始化，排除 q 参数） */
const activeFilters = ref<Record<string, string>>((() => {
  const init: Record<string, string> = {};
  for (const [k, v] of Object.entries(route.query)) {
    if (k !== 'q' && typeof v === 'string' && v) init[k] = v;
  }
  return init;
})());
const filtersOpen = ref(true);

const cancelled = { value: false };
/** 加载代：递增序号，过期加载（Tab 已切走）的结果静默丢弃 */
let loadGen = 0;
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let panelTimer: ReturnType<typeof setTimeout> | null = null;
let tiltRaf: number | null = null;
let tiltPending: { card: HTMLElement; x: number; y: number } | null = null;

const scrollerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

/* ─── 滚动位置保存/恢复（sessionStorage，key = catalog id） ─── */
const SCROLL_KEY = `nk-scroll:${props.config.id}`;
/**
 * 抑制入场交错动画：存在待恢复的滚动位置时（从详情页返回、落点在中部），
 * 卡片 delay 按绝对索引从列表首个起算，视口内卡片会滞留最多 ~0.95s 才显现。
 * 此时交错波浪（本为从顶部首屏设计）既错位又拖慢感知，故整体禁用入场动画。
 * 须在 setup 同步求值（早于网格挂载），保证卡片首帧即无动画。
 */
const noReveal = ref(sessionStorage.getItem(SCROLL_KEY) != null);

const filters = computed(() =>
  props.config.buildFilters && items.value.length
    ? props.config.buildFilters(items.value)
    : props.config.filters || [],
);

const useVirtual = computed(() => items.value.length > VIRTUAL_THRESHOLD);

const filtered = computed<CatalogItem[]>(() => {
  const q = query.value.trim().toLowerCase();
  const af = activeFilters.value;
  return items.value.filter((item) => {
    if (q && !(item.name || '').toLowerCase().includes(q)) return false;
    for (const key of Object.keys(af)) {
      const want = af[key];
      if (!want) continue;
      const cur = item[key];
      if (cur == null) return false;
      if (Array.isArray(cur)) {
        if (!cur.map(String).includes(want)) return false;
      } else if (String(cur) !== want) {
        return false;
      }
    }
    return true;
  });
});

/** 非虚拟网格：筛选/搜索变化 → 重新拼接卡片 HTML（--i 重新编号） */
const gridHtml = computed(() =>
  filtered.value.map((item, i) => props.config.renderCard(item, i)).join(''),
);

const { cells, gridMinHeight, fastJump, start, stop, refresh } = useVirtualGrid({
  filtered,
  config: () => props.config,
  scroller: scrollerRef,
  grid: gridRef,
});

/* ─── 数据加载 ─── */

async function load(): Promise<void> {
  const gen = ++loadGen;
  phase.value = 'loading';
  errorMsg.value = '';
  showSkeleton.value = false;
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  skeletonTimer = setTimeout(() => { showSkeleton.value = true; }, SKELETON_DELAY);
  try {
    await app.initManifest();
  } catch { /* 版本为空 → fetchData 将报错 */ }
  try {
    if (!props.config.fetchData) throw new Error('配置缺少 fetchData');
    items.value = await props.config.fetchData({ version: app.version });
    if (gen !== loadGen) return;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
    props.config.prefetch?.({ version: app.version });
  } catch (e) {
    if (cancelled.value || gen !== loadGen) return;
    errorMsg.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
    app.toast('error', `${props.config.title}: ${errorMsg.value}`);
  } finally {
    if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
  }
}

/**
 * Tab 软切换：静默取数 + 原地替换 items。
 * 不设 loading 态、不清空旧内容；数据已由 prefetch 预热至 L1，
 * 命中时取数→渲染在同一帧微任务内完成。静默失败回退完整 load()。
 */
async function softSwitchTab(): Promise<void> {
  const gen = ++loadGen;
  if (skeletonTimer !== null) { clearTimeout(skeletonTimer); skeletonTimer = null; }
  try {
    const data = await props.config.fetchData!({ version: app.version });
    if (gen !== loadGen || cancelled.value) return;
    items.value = data;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
  } catch {
    if (gen !== loadGen || cancelled.value) return;
    void load(); // 静默失败 → 回退完整加载（含错误态）
  }
}

/** 目录配置轮换：重置搜索/筛选，按数据源选择软/硬切换 */
watch(() => props.config, (cfg) => {
  query.value = '';
  activeFilters.value = {};
  stop();
  if (cfg.fetchData) {
    void softSwitchTab();
  } else {
    void load();
  }
});

/** 非虚拟网格：图片加载完成后加 .loaded，触发 shimmer 淡出（光锥卡片用） */
function markImagesLoaded(): void {
  const g = gridRef.value;
  if (!g) return;
  g.querySelectorAll<HTMLImageElement>('img:not(.loaded)').forEach((img) => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      const done = (): void => img.classList.add('loaded');
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });
}

/** 数据就绪 → 虚拟网格启动滚动；非虚拟网格标记图片加载态；按需恢复滚动位置 */
watch(phase, async (p) => {
  if (p !== 'ready') return;
  await nextTick();
  if (useVirtual.value) {
    start();
    // 仅当确有存档时才等 gridMinHeight 生效 + 恢复 + 重渲染，
    // 避免首次访问（无存档）多一帧延迟与首屏双重渲染。
    if (sessionStorage.getItem(SCROLL_KEY) != null) {
      await nextTick();
      if (restoreScroll()) refresh();
    }
  } else {
    markImagesLoaded();
    restoreScroll();
  }
});

/** 非虚拟网格筛选/搜索重渲染后，重新标记图片加载态 */
watch(gridHtml, async () => {
  if (!useVirtual.value) {
    await nextTick();
    markImagesLoaded();
  }
});

/* ─── 筛选 / 搜索 ─── */

function toggleFilters(): void {
  filtersOpen.value = !filtersOpen.value;
  if (useVirtual.value) {
    // 面板折叠动画（0.35s）结束后重算网格位置
    if (panelTimer !== null) clearTimeout(panelTimer);
    panelTimer = setTimeout(() => refresh(), 380);
  }
}

function onChipClick(filterKey: string, val: string): void {
  activeFilters.value = { ...activeFilters.value, [filterKey]: val };
  if (useVirtual.value) refresh();
}

function onSearchInput(): void {
  // 非虚拟模式由 computed 即时重渲染；虚拟模式节流重建窗口
  if (!useVirtual.value) return;
  if (searchTimer !== null) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => refresh(), 150);
}

/* ─── 筛选/搜索状态同步 URL query（debounce 300ms，replace 不污染历史栈） ─── */
let urlSyncTimer: ReturnType<typeof setTimeout> | null = null;
watch([activeFilters, query], () => {
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
  urlSyncTimer = setTimeout(() => {
    const params: Record<string, string> = {};
    if (query.value.trim()) params.q = query.value.trim();
    for (const [k, v] of Object.entries(activeFilters.value)) {
      if (v) params[k] = v;
    }
    void router.replace({ query: params });
  }, 300);
}, { deep: true });

/* ─── 卡片交互：点击路由 / hover 预取 / 3D 倾斜 ─── */

function onSubNavClick(tab: CatalogSubNavItem): void {
  if (tab.active) return;
  void router.push(tab.href);
}

function onContentClick(e: MouseEvent): void {
  const a = (e.target as HTMLElement).closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href || href === '#') return;
  e.preventDefault();
  const m = href.match(/\/character\/(\d+)/);
  if (m) {
    void router.push(`/character/${m[1]}`);
    return;
  }
  const lc = href.match(/\/lightcone\/(\d+)/);
  if (lc) {
    void router.push(`/lightcone/${lc[1]}`);
    return;
  }
  const relic = href.match(/\/relic\/(\d+)/);
  if (relic) {
    void router.push(`/relic/${relic[1]}`);
    return;
  }
  const crole = href.match(/\/currency\/role\/(\d+)/);
  if (crole) {
    void router.push(`/currency/role/${crole[1]}`);
    return;
  }
  if (/^\/currency\/role\/?$/.test(href)) {
    void router.push('/currency/role');
    return;
  }
  // 未迁移的详情页：静默忽略
}

function onGridMove(e: MouseEvent): void {
  const selector = props.config.cardClass || '.nk-cat-card';
  const card = (e.target as HTMLElement).closest(selector);
  if (!(card instanceof HTMLElement)) return;
  tiltPending = { card, x: e.clientX, y: e.clientY };
  if (tiltRaf !== null) return;
  tiltRaf = requestAnimationFrame(() => {
    tiltRaf = null;
    if (!tiltPending) return;
    const { card: c, x, y } = tiltPending;
    tiltPending = null;
    const rect = c.getBoundingClientRect();
    c.style.setProperty('--rx', ((x - rect.left) / rect.width - 0.5).toFixed(3));
    c.style.setProperty('--ry', (0.5 - (y - rect.top) / rect.height).toFixed(3));
  });
}

function onGridLeave(): void {
  tiltPending = null;
  const selector = props.config.cardClass || '.nk-cat-card';
  gridRef.value?.querySelectorAll<HTMLElement>(selector).forEach((c) => {
    c.style.setProperty('--rx', '0');
    c.style.setProperty('--ry', '0');
  });
}

/* ─── 滚动位置保存/恢复 ─── */
function saveScroll(): void {
  const el = scrollerRef.value;
  if (el) sessionStorage.setItem(SCROLL_KEY, String(el.scrollTop));
}

function restoreScroll(): boolean {
  const el = scrollerRef.value;
  if (!el) return false;
  const saved = sessionStorage.getItem(SCROLL_KEY);
  if (saved == null) return false;
  el.scrollTo({ top: Number(saved), behavior: 'instant' });
  sessionStorage.removeItem(SCROLL_KEY);
  return true;
}

/* ─── 生命周期 ─── */

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  saveScroll();
  cancelled.value = true;
  stop();
  if (searchTimer !== null) clearTimeout(searchTimer);
  if (panelTimer !== null) clearTimeout(panelTimer);
  if (skeletonTimer !== null) clearTimeout(skeletonTimer);
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
  if (tiltRaf !== null) cancelAnimationFrame(tiltRaf);
});
</script>

<template>
  <div
    id="nk-catalog-app"
    ref="scrollerRef"
    :aria-busy="phase === 'loading'"
    @click="onContentClick"
  >
    <!-- 错误态 -->
    <div v-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
      </div>
      <div class="nk-error-state__title">数据加载失败</div>
      <div v-if="errorMsg" class="nk-error-state__detail">{{ errorMsg }}</div>
      <button class="nk-error-state__retry" @click="load">RETRY</button>
    </div>

    <!-- 目录主体：头部 + 子导航为稳定外壳，始终渲染；切换时仅下方卡片区刷新（对齐原站体验） -->
    <template v-else>
      <div class="nk-cat-header">
        <span class="nk-cat-title">{{ config.title }}</span>
        <div class="nk-cat-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            :placeholder="config.searchPlaceholder"
            :value="query"
            @input="(e) => { query = (e.target as HTMLInputElement).value; onSearchInput(); }"
          >
        </div>
        <span class="nk-cat-count">{{ phase === 'loading' ? '—' : `${filtered.length} / ${items.length}` }}</span>
        <button
          v-if="filters.length"
          class="nk-cat-filter-btn"
          :class="{ active: filtersOpen }"
          :disabled="phase === 'loading'"
          @click="toggleFilters"
        ><span class="arrow">▼</span> 筛选</button>
      </div>

      <!-- 子导航标签（如终局内容分类） -->
      <div v-if="config.subNav" class="nk-cat-subnav">
        <a
          v-for="tab in config.subNav"
          :key="tab.href"
          class="nk-cat-subnav__item"
          :class="{ active: tab.active }"
          :href="tab.href"
          @click.prevent="onSubNavClick(tab)"
        >
          <span class="nk-cat-subnav__name">{{ tab.label }}</span>
          <span class="nk-cat-subnav__en">{{ tab.en }}</span>
        </a>
      </div>

      <!-- 骨架屏：延迟显示，仅占据网格区（头部/子导航保持稳定，避免切换闪烁）
           复用 config.gridClass 与真实网格共用 --nk-grid-min/--nk-grid-gap，消除 CLS -->
      <div
        v-if="phase === 'loading' && showSkeleton"
        class="nk-skeleton nk-skeleton--catalog"
        role="status"
        aria-live="polite"
        :aria-label="`${config.title}加载中`"
      >
        <div class="nk-skeleton__grid" :class="config.gridClass">
          <div v-for="i in 16" :key="i" class="nk-skeleton__card">
            <div class="nk-sk nk-sk--shimmer nk-skeleton__card-img"></div>
          </div>
        </div>
      </div>

      <!-- 数据主体：筛选 + 网格 + 空态 -->
      <template v-else-if="phase === 'ready'">
      <div v-if="filters.length" class="nk-cat-filters" :class="{ open: filtersOpen }">
        <div class="nk-cat-filters__inner"><div class="nk-cat-filters__body">
          <div v-for="f in filters" :key="f.key" class="nk-cat-filter-group">
            <div class="nk-cat-filter-label">{{ f.label }}</div>
            <div class="nk-cat-chips">
              <button
                v-for="opt in f.options"
                :key="opt.val"
                class="nk-cat-chip"
                :class="{ active: (activeFilters[f.key] || '') === opt.val }"
                @click="onChipClick(f.key, opt.val)"
              >
                <img v-if="opt.icon" class="nk-cat-chip__icon" :src="opt.icon" alt="">
                <span v-html="opt.label"></span>
              </button>
            </div>
          </div>
        </div></div>
      </div>

      <!-- 虚拟网格 -->
      <div
        v-if="useVirtual"
        ref="gridRef"
        :class="[config.gridClass, 'nk-virtual-grid', { 'nk-fast-jump': fastJump, 'nk-no-reveal': noReveal }]"
        :style="{ minHeight: gridMinHeight }"
      >
        <div
          v-for="cell in cells"
          :key="cell.key"
          v-reveal
          class="nk-virtual-cell"
          :style="cell.style"
          v-html="cell.html"
        ></div>
      </div>

      <!-- 常规网格 -->
      <div
        v-else
        ref="gridRef"
        :class="[config.gridClass, { 'nk-no-reveal': noReveal }]"
        v-html="gridHtml"
        @mousemove="onGridMove"
        @mouseleave="onGridLeave"
      ></div>

      <div class="nk-cat-empty" :class="{ show: filtered.length === 0 }">
        <span class="nk-cat-empty__icon">//</span>
        <span class="nk-cat-empty__text">NO MATCH FOUND</span>
        <span class="nk-cat-empty__sub">未找到匹配结果，请调整筛选条件</span>
      </div>
      </template>
    </template>
  </div>
</template>
