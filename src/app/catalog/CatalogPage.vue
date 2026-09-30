<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAppStore } from '../stores/app';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useLoadGeneration } from '../composables/use-load-generation';
import { useScrollRestore } from '../composables/use-scroll-restore';
import { useCardTilt } from '../composables/use-card-tilt';
import CatalogToolbar from './CatalogToolbar.vue';
import { useVirtualGrid, vReveal } from './use-virtual-grid';
import type { CatalogItem, CatalogPageConfig } from './types';

const props = defineProps<{ config: CatalogPageConfig }>();

const app = useAppStore();
const router = useRouter();
const route = useRoute();

const VIRTUAL_THRESHOLD = 400;

type Phase = 'loading' | 'ready' | 'error';
const phase = ref<Phase>('loading');
const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');
const errorMsg = ref('');
const items = ref<CatalogItem[]>([]);
const query = ref(String(route.query.q || ''));
const activeFilters = ref<Record<string, string>>((() => {
  const init: Record<string, string> = {};
  for (const [k, v] of Object.entries(route.query)) {
    if (k !== 'q' && typeof v === 'string' && v) init[k] = v;
  }
  return init;
})());
const cancelled = { value: false };
const loadGen = useLoadGeneration();
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const scrollerRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

const scroll = useScrollRestore(scrollerRef, `nk-scroll:${props.config.id}`);
const noReveal = ref(scroll.hasArchive);

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
    if (q) {
      const haystack = `${item.name || ''}\n${item.searchText || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
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

const gridHtml = computed(() =>
  props.config.renderColumns
    ? props.config.renderColumns(filtered.value, (item, i) => props.config.renderCard(item, i))
    : filtered.value.map((item, i) => props.config.renderCard(item, i)).join(''),
);

const { cells, gridMinHeight, fastJump, start, stop, refresh } = useVirtualGrid({
  filtered,
  config: () => props.config,
  scroller: scrollerRef,
  grid: gridRef,
});

async function load(): Promise<void> {
  const gen = loadGen.begin();
  phase.value = 'loading';
  errorMsg.value = '';
  void app.initManifest();
  try {
    if (!props.config.fetchData) throw new Error('配置缺少 fetchData');
    items.value = await props.config.fetchData({ version: app.version });
    if (!loadGen.isCurrent(gen)) return;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
    props.config.prefetch?.({ version: app.version });
  } catch (e) {
    if (cancelled.value || !loadGen.isCurrent(gen)) return;
    errorMsg.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
    app.toast('error', `${props.config.title}: ${errorMsg.value}`);
  }
}

async function softSwitchTab(): Promise<void> {
  const gen = loadGen.begin();
  try {
    const data = await props.config.fetchData!({ version: app.version });
    if (!loadGen.isCurrent(gen) || cancelled.value) return;
    items.value = data;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
  } catch {
    if (!loadGen.isCurrent(gen) || cancelled.value) return;
    void load();
  }
}

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

watch(phase, async (p) => {
  if (p !== 'ready') return;
  await nextTick();
  if (useVirtual.value) {
    start();
    if (scroll.hasArchive) {
      await nextTick();
      if (scroll.restore()) refresh();
    }
  } else {
    markImagesLoaded();
    scroll.restore();
  }
});

watch(gridHtml, async () => {
  if (!useVirtual.value) {
    await nextTick();
    markImagesLoaded();
  }
});

function onFilterSelect(filterKey: string, val: string): void {
  activeFilters.value = { ...activeFilters.value, [filterKey]: val };
  if (useVirtual.value) refresh();
}

function onSearch(value: string): void {
  query.value = value;
  onSearchInput();
}

function onSearchInput(): void {
  if (!useVirtual.value) return;
  if (searchTimer !== null) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => refresh(), 150);
}

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

function onContentClick(e: MouseEvent): void {
  const a = (e.target as HTMLElement).closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (!href || href === '#' || href.startsWith('http')) return;
  e.preventDefault();
  void router.push(href);
}

function onCardImgError(e: Event): void {
  const img = e.target as HTMLImageElement;
  if (!img.classList.contains('nk-eg-card__art')) return;
  img.style.display = 'none';
  img.closest('.nk-eg-card')?.classList.remove('nk-eg-card--has-art');
}

function onGridMove(e: MouseEvent): void {
  tilt.onMove(e);
}

function onGridLeave(): void {
  tilt.onLeave();
}

const tilt = useCardTilt(gridRef, () => props.config.cardClass || '.nk-cat-card');

onMounted(() => {
  void load();
});

onBeforeUnmount(() => {
  scroll.save();
  cancelled.value = true;
  stop();
  if (searchTimer !== null) clearTimeout(searchTimer);
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
});
</script>

<template>
  <div
    id="nk-catalog-app"
    ref="scrollerRef"
    :aria-busy="phase === 'loading'"
    @click="onContentClick"
    @error.capture="onCardImgError"
  >
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

    <template v-else>
      <CatalogToolbar
        :title="config.title"
        :subtitle="config.subtitle"
        :placeholder="config.searchPlaceholder"
        :query="query"
        :count-text="phase === 'loading' ? '—' : `${filtered.length} / ${items.length}`"
        :filters="filters"
        :active-filters="activeFilters"
        :disabled="phase === 'loading'"
        @search="onSearch"
        @select="onFilterSelect"
      />

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

      <template v-else-if="phase === 'ready'">
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
