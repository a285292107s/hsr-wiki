<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, watchPostEffect } from 'vue';
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

function isActive(item: NavItem): boolean {
  const p = route.path;
  const paths = item.activePaths || [item.path];
  return paths.some((ap) => p === ap || (!item.exact && p.startsWith(ap + '/')));
}

const navRef = ref<HTMLElement | null>(null);
const measureRef = ref<HTMLElement | null>(null);
const brandRef = ref<{ $el: HTMLElement } | null>(null);
const swapRef = ref<HTMLElement | null>(null);
const toolsRef = ref<HTMLElement | null>(null);
const moreBtnRef = ref<HTMLElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);
const nativePopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
const moreOpen = ref(false);
const fitsInline = ref(false);
const currentItem = computed(() => navItems.value.find(isActive) ?? navItems.value[0]);
const visibleItems = computed(() => fitsInline.value ? navItems.value : [currentItem.value]);
const foldedItems = computed(() => fitsInline.value ? [] : navItems.value.filter(item => item !== currentItem.value));

function recomputeFit(): void {
  const nav = navRef.value;
  const pieces = [brandRef.value?.$el, measureRef.value, swapRef.value, toolsRef.value];
  if (!nav || pieces.some(piece => !piece)) return;
  const css = getComputedStyle(nav);
  const available = nav.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
  const required = pieces.reduce((sum, piece) => sum + (piece?.getBoundingClientRect().width ?? 0), 0);
  fitsInline.value = Math.ceil(required + (parseFloat(css.columnGap) || 0) * 3) <= available;
}

function closeMore(): void {
  if (nativePopover && sheetRef.value?.matches(':popover-open')) sheetRef.value.hidePopover();
  moreOpen.value = false;
}

function onMoreClick(): void {
  if (!nativePopover) moreOpen.value = !moreOpen.value;
}

function onMoreToggle(event: Event): void {
  moreOpen.value = (event.target as HTMLElement).matches(':popover-open');
}

function onFallbackPointer(event: PointerEvent): void {
  if (!moreOpen.value || !(event.target instanceof Node)) return;
  if (!sheetRef.value?.contains(event.target) && !moreBtnRef.value?.contains(event.target)) closeMore();
}

function onFallbackKey(event: KeyboardEvent): void {
  if (!moreOpen.value || event.key !== 'Escape') return;
  event.preventDefault();
  closeMore();
  moreBtnRef.value?.focus();
}

let fitObserver: ResizeObserver | undefined;
watch(() => route.fullPath, closeMore);
watch(fitsInline, (inline) => { if (inline) closeMore(); });
watchPostEffect(recomputeFit);
onMounted(() => {
  fitObserver = new ResizeObserver(recomputeFit);
  for (const element of [navRef.value, measureRef.value, brandRef.value?.$el, swapRef.value, toolsRef.value]) {
    if (element) fitObserver.observe(element);
  }
  if (!nativePopover) {
    document.addEventListener('pointerdown', onFallbackPointer);
    document.addEventListener('keydown', onFallbackKey);
  }
});
onBeforeUnmount(() => {
  fitObserver?.disconnect();
  if (!nativePopover) {
    document.removeEventListener('pointerdown', onFallbackPointer);
    document.removeEventListener('keydown', onFallbackKey);
  }
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
  <header class="ui-site-header">
    <nav ref="navRef" class="ui-sidebar ui-top-nav" :class="{ 'ui-top-nav--compact': !fitsInline }" :aria-label="t('nav.ariaMain')">
      <RouterLink ref="brandRef" to="/" class="ui-sidebar-brand" aria-current="false" :aria-label="`${SITE_NAME} · ${t('nav.home')}`">
        <span class="ui-sidebar-brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c.7 4 2.3 7.2 4.9 8.6-2.6 1.4-4.2 4.6-4.9 8.6-.7-4-2.3-7.2-4.9-8.6C9.7 9.2 11.3 6 12 2z"/><circle cx="18.4" cy="5.6" r="1.1"/><circle cx="5.2" cy="18.6" r="0.9"/></svg>
        </span>
        <span class="ui-sidebar-brand__text">{{ SITE_NAME }}</span>
      </RouterLink>

      <div class="ui-top-nav__links" :class="{ 'ui-top-nav__links--compact': !fitsInline }">
        <RouterLink v-for="item in visibleItems" :key="item.path" :to="item.path"
          :title="itemLabel(item)" :aria-label="itemLabel(item)" :aria-current="isActive(item) ? 'page' : undefined"
          :class="['ui-sidebar-link', { 'ui-sidebar-link--active': isActive(item) }]"
          @pointerenter="prefetchByPath(item.path)">
          <span class="ui-sidebar-link__label">{{ itemShort(item) }}</span>
        </RouterLink>
      </div>

      <div ref="measureRef" class="ui-top-nav__measure" aria-hidden="true" inert>
        <span v-for="item in navItems" :key="item.path" class="ui-sidebar-link">
          <span class="ui-sidebar-link__label">{{ itemShort(item) }}</span>
        </span>
      </div>

      <button v-show="!fitsInline" ref="moreBtnRef" type="button" class="ui-sidebar-link ui-sidebar-more"
        :title="t('nav.titleMore')" :aria-label="t('nav.ariaMore')"
        :aria-expanded="moreOpen" aria-controls="ui-more-sheet"
        :popovertarget="nativePopover ? 'ui-more-sheet' : undefined" @click="onMoreClick">
        <span class="ui-sidebar-link__icon" aria-hidden="true" v-html="MORE_ICON" />
        <span class="ui-sidebar-link__label">{{ t('nav.more') }}</span>
      </button>
      <div id="ui-more-sheet" ref="sheetRef" class="ui-more ui-more__sheet"
        :class="{ 'ui-more--fallback': !nativePopover }"
        :popover="nativePopover ? 'auto' : undefined" :hidden="!nativePopover && !moreOpen" @toggle="onMoreToggle">
        <RouterLink v-for="item in foldedItems" :key="item.path" :to="item.path" class="ui-more__item"
          @pointerenter="prefetchByPath(item.path)" @click="closeMore">
          <span class="ui-more__icon" aria-hidden="true" v-html="item.icon" />
          <span class="ui-more__label">{{ itemLabel(item) }}</span>
        </RouterLink>
      </div>

      <button ref="swapRef" type="button" class="ui-sidebar-link ui-sidebar-swap"
        :title="swapAria" :aria-label="swapAria" @click="onSwap">
        <span class="ui-sidebar-link__icon" aria-hidden="true" v-html="SWAP_ITEM.icon" />
        <span class="ui-sidebar-link__label">{{ swapDest }}</span>
      </button>

      <div ref="toolsRef" class="ui-sidebar-tools">
        <RouterLink v-if="IS_DEV" :to="DEBUG_PATH" :title="t('nav.titleDebug')" :aria-label="t('nav.debug')"
          class="ui-sidebar-link ui-sidebar-debug" :class="{ 'ui-sidebar-link--active': route.path === DEBUG_PATH }"
          @pointerenter="prefetchByPath(DEBUG_PATH)">
          <span class="ui-sidebar-link__icon" aria-hidden="true" v-html="DEBUG_ITEM.icon" />
        </RouterLink>
        <RouterLink :to="settingsPath" :title="t('nav.titleSettings')" :aria-label="t('nav.settings')"
          class="ui-sidebar-link ui-sidebar-settings" :class="{ 'ui-sidebar-link--active': route.path === settingsPath }"
          @click="onSettingsClick">
          <span class="ui-sidebar-link__icon" aria-hidden="true" v-html="SETTINGS_ITEM.icon" />
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
