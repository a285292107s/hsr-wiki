<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { stripLocalePrefix } from '../../lib/i18n/locales';
import { bgVar, cdnSrc } from '../../lib/image';
import { userErrorDetail } from '../../lib/errors';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '../stores/app';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useLoadGeneration } from '../composables/use-load-generation';
import { getSavedCwSeason } from '../../lib/cw-season';
import { useScrollRestore } from '../composables/use-scroll-restore';
import CatalogToolbar from './CatalogToolbar.vue';
import { useVirtualGrid, vReveal } from './use-virtual-grid';
import type { CatalogItem, CatalogPageConfig, CatalogFilterOption } from './types';

const props = defineProps<{ config: CatalogPageConfig }>();

const groundUrl = cdnSrc('bgpic', 'BgWiki.webp');
const app = useAppStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

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
const splitRef = ref<HTMLElement | null>(null);
const selectedId = ref<string | null>(null);

const scroll = useScrollRestore(scrollerRef, `nk-scroll:${props.config.id}`);
const noReveal = ref(scroll.hasArchive);

const filters = computed(() =>
  props.config.buildFilters && items.value.length
    ? props.config.buildFilters(items.value)
    : props.config.filters || [],
);

const pageTitle = computed(() => {
  const args = props.config.titleArgs;
  if (!args) return t(props.config.titleKey);
  return t(props.config.titleKey, Object.fromEntries(
    Object.entries(args).map(([name, key]) => [name, t(key)]),
  ));
});

const useVirtual = computed(() => items.value.length > VIRTUAL_THRESHOLD);

const skeletonVariant = computed(() => props.config.skeleton?.variant ?? 'card');
const skeletonCount = computed(() => props.config.skeleton?.count ?? 16);
const skeletonRows = computed(() => props.config.skeleton?.rows ?? 6);

const filtered = computed<CatalogItem[]>(() => {
  const q = query.value.trim().toLowerCase();
  const af = activeFilters.value;
  const list = items.value.filter((item) => {
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
  if (!q) return list;
  const rank = (it: CatalogItem): number => {
    const name = String(it.name || '').toLowerCase();
    if (name.startsWith(q)) return 0;
    if (name.includes(q)) return 1;
    return 2;
  };
  return [...list].sort((a, b) => rank(a) - rank(b));
});

const gridHtml = computed(() =>
  props.config.renderColumns
    ? props.config.renderColumns(filtered.value, (item, i) => props.config.renderCard(item, i))
    : filtered.value.map((item, i) => props.config.renderCard(item, i)).join(''),
);

const split = computed(() => props.config.split ?? null);

const splitTabs = computed<CatalogFilterOption[]>(() => {
  const cfg = split.value;
  if (!cfg) return [];
  return filters.value.find((f) => f.key === cfg.tabFilterKey)?.options ?? [];
});

const splitVal = computed(() => split.value ? activeFilters.value[split.value.tabFilterKey] || '' : '');

const selectedItem = computed<CatalogItem | null>(() => {
  if (!split.value) return null;
  const list = filtered.value;
  return list.find((item) => String(item.id) === selectedId.value) ?? list[0] ?? null;
});

const detailHtml = computed(() => {
  const cfg = split.value;
  const item = selectedItem.value;
  return cfg && item ? cfg.renderDetail(item) : '';
});

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
    items.value = await props.config.fetchData({ version: app.version, cwSeason: getSavedCwSeason() });
    if (!loadGen.isCurrent(gen)) return;
    phase.value = 'ready';
    scrollerRef.value?.scrollTo({ top: 0 });
    props.config.prefetch?.({ version: app.version, cwSeason: getSavedCwSeason() });
  } catch (e) {
    if (cancelled.value || !loadGen.isCurrent(gen)) return;
    errorMsg.value = userErrorDetail(e);
    phase.value = 'error';
  }
}

async function softSwitchTab(): Promise<void> {
  const gen = loadGen.begin();
  try {
    const data = await props.config.fetchData!({ version: app.version, cwSeason: getSavedCwSeason() });
    if (!loadGen.isCurrent(gen) || cancelled.value) return;
    items.value = data;
    phase.value = 'ready';
    ensureSplitTab();
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
  ensureSplitTab();
  await nextTick();
  void syncSplitSelection();
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
  void syncSplitSelection();
});

function onFilterSelect(filterKey: string, val: string): void {
  activeFilters.value = { ...activeFilters.value, [filterKey]: val };
  if (useVirtual.value) refresh();
}

function ensureSplitTab(): void {
  const key = split.value?.tabFilterKey;
  if (!key || activeFilters.value[key]) return;
  const first = splitTabs.value.find((opt) => opt.val);
  if (!first) return;
  activeFilters.value = { ...activeFilters.value, [key]: first.val };
}

function splitTabLabel(opt: CatalogFilterOption): string {
  return (opt.label ?? '') + (opt.labelKey ? t(opt.labelKey) : '');
}


function selectSplitTab(val: string): void {
  const key = split.value?.tabFilterKey;
  if (!key) return;
  selectedId.value = null;
  onFilterSelect(key, val);
  if (gridRef.value) gridRef.value.scrollTop = 0;
  resetSplitScroll();
}

function selectSplitItem(id: string): void {
  if (selectedId.value === id) return;
  selectedId.value = id;
  void nextTick(syncSplitSelection);
  scrollSplitTop();
}

async function syncSplitSelection(): Promise<void> {
  if (!split.value) return;
  await nextTick();
  const root = gridRef.value;
  if (!root) return;
  const id = selectedItem.value ? String(selectedItem.value.id) : '';
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-id]')) {
    const on = link.dataset.id === id;
    link.classList.toggle('is-selected', on);
    if (on) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function scrollSplitTop(): void {
  const scroller = scrollerRef.value;
  const el = splitRef.value;
  if (!scroller || !el) return;
  const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  if (scroller.scrollTop <= delta + 8) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const offset = props.config.headless ? 24 : 16;
  scroller.scrollTo({ top: scroller.scrollTop + delta - offset, behavior: reduce ? 'auto' : 'smooth' });
}

function resetSplitScroll(): void {
  const scroller = scrollerRef.value;
  if (!scroller) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scroller.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
}

function onSearch(value: string): void {
  query.value = value;
  onSearchInput();
}

const hasQuery = computed(() => query.value.trim().length > 0);
const hasFilters = computed(() => Object.values(activeFilters.value).some(Boolean));
function resetSearchAndFilters(): void {
  query.value = '';
  activeFilters.value = {};
  ensureSplitTab();
  if (useVirtual.value) refresh();
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

  const id = a.getAttribute('data-id');
  if (id && split.value && splitRef.value?.contains(a) && a.closest('.nk-cat-split__rail')) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    e.preventDefault();
    selectSplitItem(id);
    return;
  }

  const href = a.getAttribute('href') || '';
  if (!href || href === '#' || href.startsWith('http')) return;
  e.preventDefault();
  void router.push(stripLocalePrefix(href));
}

function onCardImgError(e: Event): void {
  const img = e.target as HTMLImageElement;
  if (!img.classList.contains('nk-eg-card__art')) return;
  img.style.display = 'none';
  img.closest('.nk-eg-card')?.classList.remove('nk-eg-card--has-art');
}

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
    :style="bgVar(groundUrl, '--nk-catalog-ground')"
    :class="{ 'nk-cat--headless': config.headless }"
    :aria-busy="phase === 'loading'"
    @click="onContentClick"
    @error.capture="onCardImgError"
  >
    <h1 v-if="config.headless" class="nk-sr-only">{{ pageTitle }}</h1>
    <div v-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <path d="M12 9v4"/><path d="M12 17h.01"/>
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('catalog.loadError') }}</div>
      <div v-if="errorMsg" class="nk-error-state__detail">{{ errorMsg }}</div>
      <button class="nk-error-state__retry" @click="load">RETRY</button>
    </div>

    <template v-else>
      <CatalogToolbar
        v-if="!config.headless"
        :title="pageTitle"
        :subtitle="config.subtitle"
        :placeholder="t(config.searchKey)"
        :query="query"
        :count-text="phase === 'loading' ? '—' : `${filtered.length} / ${items.length}`"
        :filters="split ? [] : filters"
        :active-filters="activeFilters"
        :disabled="phase === 'loading'"
        @search="onSearch"
        @select="onFilterSelect"
      />

      <div
        v-if="phase === 'loading' && showSkeleton"
        class="nk-skeleton nk-skeleton--catalog"
        :data-page="config.id"
        role="status"
        aria-live="polite"
        :aria-label="t('catalog.loadingAria', { title: pageTitle })"
      >
        <div class="nk-skeleton__grid" :class="config.gridClass">
          <template v-if="skeletonVariant === 'columns'">
            <section v-for="col in 4" :key="`c${col}`" class="nk-skeleton__col">
              <div class="nk-sk nk-sk--shimmer nk-skeleton__col-head"></div>
              <div v-for="row in skeletonRows" :key="`r${row}`" class="nk-skeleton__row">
                <div class="nk-sk nk-sk--shimmer nk-skeleton__row-fig"></div>
                <div class="nk-skeleton__row-main">
                  <div class="nk-sk nk-sk--shimmer nk-skeleton__row-line"></div>
                  <div class="nk-sk nk-sk--shimmer nk-skeleton__row-line nk-skeleton__row-line--meta"></div>
                </div>
              </div>
            </section>
          </template>
          <template v-else>
            <div v-for="i in skeletonCount" :key="i" class="nk-skeleton__card">
              <div v-if="skeletonVariant === 'row'" class="nk-sk nk-sk--shimmer nk-skeleton__card-thumb"></div>
              <div v-else-if="skeletonVariant === 'card'" class="nk-sk nk-sk--shimmer nk-skeleton__card-img"></div>
              <div class="nk-skeleton__card-body">
                <span
                  v-for="line in 4"
                  :key="line"
                  class="nk-sk nk-sk--shimmer nk-skeleton__card-line"
                  :class="`nk-skeleton__card-line--${line}`"
                ></span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <template v-else-if="phase === 'ready'">
      <div v-if="split" ref="splitRef" class="nk-cat-split">
        <aside class="nk-cat-split__rail" :aria-label="split.railLabelKey ? t(split.railLabelKey) : undefined">
          <div
            v-if="splitTabs.length"
            class="nk-cat-split__tabs"
            :aria-label="split.tabGroupLabelKey ? t(split.tabGroupLabelKey) : undefined"
          >
            <button
              v-for="opt in splitTabs"
              :key="opt.val"
              type="button"
              class="nk-cat-split__tab"
              :class="{ 'is-active': splitVal === opt.val }"
              :aria-pressed="splitVal === opt.val"
              @click="selectSplitTab(opt.val)"
            >
              <span class="nk-cat-split__tab-label">{{ splitTabLabel(opt) }}</span>
            </button>
          </div>
          <div ref="gridRef" :class="[config.gridClass, 'nk-cat-split__list']" v-html="gridHtml"></div>
        </aside>
        <section class="nk-cat-split__main">
          <div
            v-if="selectedItem"
            :key="String(selectedItem.id)"
            class="nk-cat-split__detail"
            role="region"
            :aria-label="String(selectedItem.name)"
            v-html="detailHtml"
          ></div>
        </section>
      </div>

      <template v-else>
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
        ></div>
      </template>

      <div class="nk-cat-empty" :class="{ show: filtered.length === 0 }" role="status">
        <span class="nk-cat-empty__mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
            <rect x="9" y="12" width="30" height="24" rx="3" />
            <path d="M15 20h18M15 26h12" opacity="0.55" />
            <path d="M33 33l6 6" />
          </svg>
        </span>
        <span class="nk-cat-empty__text">NO MATCH FOUND</span>
        <p class="nk-cat-empty__sub">
          {{ hasQuery || hasFilters ? t('catalog.emptyFiltered') : t('catalog.emptyAll') }}
        </p>
        <button
          v-if="hasQuery || hasFilters"
          type="button"
          class="nk-cat-empty__reset"
          @click="resetSearchAndFilters"
        >
          {{ t('catalog.clearFilters') }}
        </button>
      </div>
      </template>
    </template>
  </div>
</template>
