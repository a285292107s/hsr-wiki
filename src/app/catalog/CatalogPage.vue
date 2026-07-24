<script setup lang="ts">
/**
 * 通用目录引擎组件（迁移自 catalog.js 的 initGenericCatalog + initCatalog）
 *
 * 数据源：dom = 轮询抓取宿主 content-card（隐藏但持续渲染）；cdn = 直接拉取 JSON。
 * >400 条目启用虚拟网格；卡片走 renderCard HTML（v-html）+ 事件委托。
 * 卡片点击：角色详情 → SPA 导航；未迁移详情页 → 油猴交还宿主 / standalone 提示。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/app';
import { platform } from '../../platform';
import { prefetchCharData } from '../../services/api';
import { scrapeCards, waitForCards } from './scrape';
import { useVirtualGrid, vReveal } from './use-virtual-grid';
import type { CatalogItem, CatalogPageConfig } from './types';

const props = defineProps<{ config: CatalogPageConfig }>();

const app = useAppStore();
const router = useRouter();

const VIRTUAL_THRESHOLD = 400;

type Phase = 'loading' | 'ready' | 'error';
const phase = ref<Phase>('loading');
const errorMsg = ref('');
const items = ref<CatalogItem[]>([]);
const query = ref('');
const activeFilters = ref<Record<string, string>>({});
const filtersOpen = ref(true);

const cancelled = { value: false };
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let panelTimer: ReturnType<typeof setTimeout> | null = null;
let tiltRaf: number | null = null;
let tiltPending: { card: HTMLElement; x: number; y: number } | null = null;

const scrollerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

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
      if (af[key] && String(item[key] ?? '') !== af[key]) return false;
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
  config: props.config,
  scroller: scrollerRef,
  grid: gridRef,
});

/* ─── 数据加载 ─── */

async function load(): Promise<void> {
  phase.value = 'loading';
  errorMsg.value = '';
  // 版本信息（cdn 数据源与 hover 预取使用；离线时不阻塞 dom 抓取）
  try {
    await app.initManifest();
  } catch {
    /* 版本为空 → cdn 拉取将在下方报错 */
  }
  try {
    if (props.config.dataSource === 'cdn') {
      if (!props.config.fetchData) throw new Error('配置缺少 fetchData');
      items.value = await props.config.fetchData({ version: app.version });
    } else {
      const selector = props.config.cardSelector || '[data-ui="content-card"]';
      const validator = props.config.cardValidator || ((): boolean => true);
      await waitForCards(validator, selector, cancelled);
      if (cancelled.value) return;
      items.value = scrapeCards(props.config);
    }
    phase.value = 'ready';
  } catch (e) {
    if (cancelled.value) return;
    errorMsg.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
    app.toast('error', `${props.config.title}: ${errorMsg.value}`);
  } finally {
    if (!cancelled.value) app.markDataReady();
  }
}

/** 数据就绪且为虚拟模式 → 网格渲染后启动虚拟滚动 */
watch(phase, async (p) => {
  if (p === 'ready' && useVirtual.value) {
    await nextTick();
    start();
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

/* ─── 卡片交互：点击路由 / hover 预取 / 3D 倾斜 ─── */

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
  // 未迁移的详情页（光锥/遗器/怪物/赛季等）：
  // 油猴模式整页导航交还宿主（路由门在 document-start 放行）；standalone 提示
  if (platform().mode === 'userscript') {
    location.href = href;
  } else {
    app.toast('info', '该详情页第二期支持，敬请期待');
  }
}

function onCardHover(e: Event): void {
  if (props.config.id !== 'character') return;
  const card = (e.target as HTMLElement).closest('.nk-cat-card');
  if (!card) return;
  const m = (card.getAttribute('href') || '').match(/\/character\/(\d+)/);
  if (m) prefetchCharData(app.version, m[1]);
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

/* ─── 生命周期 ─── */

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  cancelled.value = true;
  stop();
  if (searchTimer !== null) clearTimeout(searchTimer);
  if (panelTimer !== null) clearTimeout(panelTimer);
  if (tiltRaf !== null) cancelAnimationFrame(tiltRaf);
});
</script>

<template>
  <div
    id="nk-catalog-app"
    ref="scrollerRef"
    @click="onContentClick"
    @pointerenter.capture="onCardHover"
  >
    <!-- 骨架屏 -->
    <div v-if="phase === 'loading'" class="nk-skeleton nk-skeleton--catalog">
      <div class="nk-skeleton__header">
        <div class="nk-sk" style="width:100px;height:18px;border-radius:4px;"></div>
        <div class="nk-sk" style="width:200px;height:32px;border-radius:20px;"></div>
        <div class="nk-sk" style="width:60px;height:14px;border-radius:4px;"></div>
      </div>
      <div class="nk-skeleton__filters">
        <div class="nk-sk" style="width:100%;height:28px;border-radius:8px;"></div>
      </div>
      <div class="nk-skeleton__grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));">
        <div v-for="i in 10" :key="i" class="nk-skeleton__card">
          <div class="nk-sk nk-sk--shimmer" style="width:100%;aspect-ratio:3/4;border-radius:10px;"></div>
        </div>
      </div>
    </div>

    <!-- 错误态 -->
    <div v-else-if="phase === 'error'" class="nk-error-state">
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

    <!-- 目录主体 -->
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
        <span class="nk-cat-count">{{ filtered.length }} / {{ items.length }}</span>
        <button
          v-if="filters.length"
          class="nk-cat-filter-btn"
          :class="{ active: filtersOpen }"
          @click="toggleFilters"
        ><span class="arrow">▼</span> 筛选</button>
      </div>

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
        :class="[config.gridClass, 'nk-virtual-grid', { 'nk-fast-jump': fastJump }]"
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
        :class="config.gridClass"
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
  </div>
</template>
