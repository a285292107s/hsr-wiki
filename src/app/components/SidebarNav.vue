<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { NORMAL_NAV_ITEMS, CW_NAV_ITEMS, NORMAL_HUB_ITEM, CW_HUB_ITEM, SWAP_ITEM, type NavItem } from './nav-items';
import { prefetchByPath } from '../router/chunks';
import { DEBUG_PATH } from '../debug';
import { SITE_NAME } from '../../lib/constants';
import { localeBaseFromPath } from '../../lib/i18n/locales';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const itemLabel = (item: NavItem): string => t(item.key);
const itemShort = (item: NavItem): string => t(item.shortKey ?? item.key);

const isCw = computed(() => !!route.meta.cw);

const swapLabel = computed(() => (isCw.value ? SWAP_ITEM.inCw : SWAP_ITEM.inNormal));
const swapDest = computed(() => t(swapLabel.value.key));
const swapAria = computed(() => t('nav.goto', { dest: swapDest.value }));

const navItems = computed<NavItem[]>(() =>
  isCw.value ? [CW_HUB_ITEM, ...CW_NAV_ITEMS] : [NORMAL_HUB_ITEM, ...NORMAL_NAV_ITEMS],
);

function onSwap(): void {
  void router.push(isCw.value ? '/character' : '/currency/role');
}

const swapping = ref(false);
let swapTimer: ReturnType<typeof setTimeout> | null = null;
watch(isCw, () => {
  swapping.value = true;
  if (swapTimer !== null) clearTimeout(swapTimer);
  swapTimer = setTimeout(() => { swapping.value = false; }, 420);
});

function isActive(item: NavItem): boolean {
  const p = route.path;
  const paths = item.activePaths || [item.path];
  return paths.some((ap) => p === ap || (!item.exact && p.startsWith(ap + '/')));
}

const sidebarRef = ref<HTMLElement | null>(null);
const moreOpen = ref(false);
const moreBtnRef = ref<HTMLElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);

const visibleCount = ref(navItems.value.length);
const visibleItems = computed(() => navItems.value.slice(0, visibleCount.value));
const foldedItems = computed(() => navItems.value.slice(visibleCount.value));
const moreActive = computed(() => foldedItems.value.some(isActive));

function recomputeFold(): void {
  const el = sidebarRef.value;
  if (!el) return;
  if (window.matchMedia('(min-width: 768px)').matches) {
    visibleCount.value = navItems.value.length;
    return;
  }
  const cs = getComputedStyle(el);
  const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const toolW = parseFloat(cs.getPropertyValue('--nk-nav-tool-w')) || 44;
  const slotMin = parseFloat(cs.getPropertyValue('--nk-nav-slot-min')) || 44;
  const dividerW = parseFloat(cs.getPropertyValue('--nk-nav-divider-w')) || 0;
  const n = navItems.value.length;
  const full = avail - toolW * 2 - dividerW;
  if (Math.floor(full / slotMin) >= n) {
    visibleCount.value = n;
    return;
  }
  const budget = avail - toolW * 3 - dividerW;
  visibleCount.value = Math.max(2, Math.min(n, Math.floor(budget / slotMin)));
}

let foldObserver: ResizeObserver | null = null;

watch(() => route.path, () => { moreOpen.value = false; });
watch(isCw, (cw) => { if (cw) moreOpen.value = false; });
watch(navItems, () => { void nextTick(recomputeFold); });
watch(visibleCount, () => {
  if (visibleCount.value >= navItems.value.length) moreOpen.value = false;
});

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') moreOpen.value = false;
}
watch(moreOpen, async (open) => {
  if (open) {
    window.addEventListener('keydown', onKeydown);
    await nextTick();
    sheetRef.value?.querySelector<HTMLElement>('.ui-more__item')?.focus();
  } else {
    window.removeEventListener('keydown', onKeydown);
    moreBtnRef.value?.focus();
  }
});
onMounted(() => {
  recomputeFold();
  if (sidebarRef.value) {
    foldObserver = new ResizeObserver(recomputeFold);
    foldObserver.observe(sidebarRef.value);
  }
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (swapTimer !== null) clearTimeout(swapTimer);
  foldObserver?.disconnect();
  foldObserver = null;
});

const MORE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';

const settingsPath = computed(() => (isCw.value ? '/currency/settings' : '/settings'));

function locationAppPath(): string {
  const { pathname } = window.location;
  const stripped = `/${pathname.slice(localeBaseFromPath(pathname).length)}`.replace(/\/+$/, '');
  return stripped || '/';
}

const SETTINGS_PATHS = new Set(['/settings', '/currency/settings']);

let settingsEntryPath: string | null = null;
let offSettingsEntry: (() => void) | null = null;

const LANDING_PATH: string | null = (() => {
  const path = locationAppPath();
  const { search, hash } = window.location;
  return SETTINGS_PATHS.has(path) ? null : `${path}${search}${hash}`;
})();

onMounted(() => {
  offSettingsEntry = router.afterEach((to, from) => {
    if (from.matched.length === 0) return;
    const target = to.meta.cw ? '/currency/settings' : '/settings';
    if (to.path === target && from.path !== to.path) settingsEntryPath = from.fullPath;
  });
});
onBeforeUnmount(() => offSettingsEntry?.());

function onSettingsClick(e: MouseEvent): void {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  const here = locationAppPath();
  if (!SETTINGS_PATHS.has(here)) {
    settingsEntryPath = route.matched.length > 0 ? route.fullPath : LANDING_PATH;
    return;
  }
  e.preventDefault();
  const back = router.options.history.state.back;
  if (settingsEntryPath && back === settingsEntryPath) {
    router.back();
    return;
  }
  const hub = here.startsWith('/currency') ? '/currency' : '/';
  void router.replace(settingsEntryPath ?? (typeof back === 'string' && back.length > 0 ? back : hub));
}

const SETTINGS_ITEM = {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
} as const;

const IS_DEV = import.meta.env.DEV;
const DEBUG_ITEM = {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3z"/><path d="M21 3l-6.3 6.3"/></svg>',
} as const;
</script>

<template>
  <nav ref="sidebarRef" class="ui-sidebar" :class="{ 'ui-sidebar--cw': isCw, 'ui-sidebar--swap-anim': swapping }" :aria-label="t('nav.ariaMain')">
    <RouterLink to="/" class="ui-sidebar-brand" :title="`${SITE_NAME} · ${t('nav.home')}`">
      <span class="ui-sidebar-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c.7 4 2.3 7.2 4.9 8.6-2.6 1.4-4.2 4.6-4.9 8.6-.7-4-2.3-7.2-4.9-8.6C9.7 9.2 11.3 6 12 2z"/><circle cx="18.4" cy="5.6" r="1.1"/><circle cx="5.2" cy="18.6" r="0.9"/></svg>
      </span>
      <span class="ui-sidebar-brand__text">
        <span class="ui-sidebar-brand__cn">{{ SITE_NAME }}</span>
        <span class="ui-sidebar-brand__en">HSR Archive</span>
      </span>
    </RouterLink>

    <span class="ui-sidebar-divider" aria-hidden="true"></span>

    <RouterLink
      v-for="item in visibleItems"
      :key="item.path"
      :to="item.path"
      :title="`${itemLabel(item)} · ${item.en}`"
      :aria-current="isActive(item) ? 'page' : undefined"
      :class="['ui-sidebar-link', { 'ui-sidebar-link--active': isActive(item) }]"
      @pointerenter="prefetchByPath(item.path)"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
      <span class="ui-sidebar-link__text">
        <span class="ui-sidebar-link__cn">{{ itemLabel(item) }}</span>
        <span class="ui-sidebar-link__en">{{ item.en }}</span>
      </span>
      <span class="ui-sidebar-link__label">{{ itemShort(item) }}</span>
    </RouterLink>

    <button
      ref="moreBtnRef"
      type="button"
      :title="t('nav.titleMore')"
      :aria-label="t('nav.ariaMore')"
      class="ui-sidebar-link ui-sidebar-more"
      :class="{
        'ui-sidebar-link--active': moreActive || moreOpen,
        'ui-sidebar-more--hidden': foldedItems.length === 0,
      }"
      :aria-expanded="moreOpen"
      aria-controls="ui-more-sheet"
      @click="moreOpen = !moreOpen"
    >
      <span class="ui-sidebar-link__icon" v-html="MORE_ICON" />
      <span class="ui-sidebar-link__label">{{ t('nav.more') }}</span>
    </button>

    <div class="ui-sidebar-tools">
      <RouterLink
        v-if="IS_DEV"        :to="DEBUG_PATH"
        :title="t('nav.titleDebug')"
        class="ui-sidebar-link ui-sidebar-debug"
        :class="{ 'ui-sidebar-link--active': route.path === DEBUG_PATH }"
        @pointerenter="prefetchByPath(DEBUG_PATH)"
      >
        <span class="ui-sidebar-link__icon" v-html="DEBUG_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">{{ t('nav.debug') }}</span>
          <span class="ui-sidebar-link__en">DEBUG</span>
        </span>
        <span class="ui-sidebar-link__label">{{ t('nav.debug') }}</span>
      </RouterLink>

      <button
        type="button"
        class="ui-sidebar-link ui-sidebar-swap"
        :title="swapAria"
        :aria-label="swapAria"
        @click="onSwap"
      >
        <span class="ui-sidebar-link__icon" v-html="SWAP_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">{{ swapDest }}</span>
          <span class="ui-sidebar-link__en">{{ swapLabel.en }}</span>
        </span>
        <span class="ui-sidebar-link__label">{{ swapDest }}</span>
      </button>

      <RouterLink
        :to="settingsPath"
        :title="t('nav.titleSettings')"
        class="ui-sidebar-link ui-sidebar-settings"
        :class="{ 'ui-sidebar-link--active': route.path === settingsPath }"
        @click="onSettingsClick"
      >
        <span class="ui-sidebar-link__icon" v-html="SETTINGS_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">{{ t('nav.settings') }}</span>
          <span class="ui-sidebar-link__en">SETTINGS</span>
        </span>
        <span class="ui-sidebar-link__label">{{ t('nav.settings') }}</span>
      </RouterLink>
    </div>
  </nav>

  <Transition name="ui-more">
    <div v-if="moreOpen" class="ui-more" @click.self="moreOpen = false">
      <div id="ui-more-sheet" ref="sheetRef" class="ui-more__sheet" role="dialog" :aria-label="t('nav.ariaMore')">
        <RouterLink
          v-for="item in foldedItems"
          :key="item.path"
          :to="item.path"
          :class="['ui-more__item', { 'ui-more__item--active': isActive(item) }]"
        >
          <span class="ui-more__icon" v-html="item.icon" />
          <span class="ui-more__label">{{ itemLabel(item) }}</span>
          <span class="ui-more__en">{{ item.en }}</span>
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>
