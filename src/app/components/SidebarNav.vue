<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { NORMAL_NAV_ITEMS, CW_NAV_ITEMS, NORMAL_HUB_ITEM, CW_HUB_ITEM, SWAP_ITEM, type NavItem } from './nav-items';
import { prefetchByPath } from '../router/chunks';
import { DEBUG_PATH } from '../debug';

const route = useRoute();
const router = useRouter();

const isCw = computed(() => !!route.meta.cw);

/** 跨模式入口的可见文案 = 目的地模式名（常规模式页显示「货币战争」，反之显示「常规模式」） */
const swapLabel = computed(() => (isCw.value ? SWAP_ITEM.inCw : SWAP_ITEM.inNormal));
const swapDest = computed(() => (isCw.value ? '常规模式' : '货币战争'));

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
  el.classList.add('ui-sidebar--measure');
  try {
    const cs = getComputedStyle(el);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const q = (sel: string): number => {
      const n = el.querySelector<HTMLElement>(sel);
      if (!n) return 0;
      const cs = getComputedStyle(n);
      return n.offsetWidth + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
    };
    const fixed = q('.ui-sidebar-swap') + q('.ui-sidebar-divider') + q('.ui-sidebar-settings');
    const moreW = q('.ui-sidebar-more');
    const navW = Array.from(
      el.querySelectorAll<HTMLElement>('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)'),
    ).map((n) => n.offsetWidth);
    const total = navW.reduce((a, b) => a + b, 0);
    let k = navW.length;
    if (fixed + total > avail) {
      let used = fixed + moreW;
      k = 0;
      while (k < navW.length && used + navW[k] <= avail) {
        used += navW[k];
        k++;
      }
    }
    visibleCount.value = k;
  } finally {
    el.classList.remove('ui-sidebar--measure');
  }
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
const SETTINGS_ITEM = {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
} as const;

const IS_DEV = import.meta.env.DEV;
const DEBUG_ITEM = {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3z"/><path d="M21 3l-6.3 6.3"/></svg>',
} as const;
</script>

<template>
  <nav ref="sidebarRef" class="ui-sidebar" :class="{ 'ui-sidebar--cw': isCw, 'ui-sidebar--swap-anim': swapping }" aria-label="主导航">
    <RouterLink to="/" class="ui-sidebar-brand" title="星铁档案馆 · 首页">
      <span class="ui-sidebar-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2c.7 4 2.3 7.2 4.9 8.6-2.6 1.4-4.2 4.6-4.9 8.6-.7-4-2.3-7.2-4.9-8.6C9.7 9.2 11.3 6 12 2z"/><circle cx="18.4" cy="5.6" r="1.1"/><circle cx="5.2" cy="18.6" r="0.9"/></svg>
      </span>
      <span class="ui-sidebar-brand__text">
        <span class="ui-sidebar-brand__cn">星铁档案馆</span>
        <span class="ui-sidebar-brand__en">HSR Archive</span>
      </span>
    </RouterLink>

    <span class="ui-sidebar-divider" aria-hidden="true"></span>

    <RouterLink
      v-for="item in visibleItems"
      :key="item.path"
      :to="item.path"
      :title="`${item.title} · ${item.en}`"
      :aria-current="isActive(item) ? 'page' : undefined"
      :class="['ui-sidebar-link', { 'ui-sidebar-link--active': isActive(item) }]"
      @pointerenter="prefetchByPath(item.path)"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
      <span class="ui-sidebar-link__text">
        <span class="ui-sidebar-link__cn">{{ item.title }}</span>
        <span class="ui-sidebar-link__en">{{ item.en }}</span>
      </span>
      <span class="ui-sidebar-link__label">{{ item.short || item.title }}</span>
    </RouterLink>

    <button
      ref="moreBtnRef"
      type="button"
      title="更多 · MORE"
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
      <span class="ui-sidebar-link__label">更多</span>
    </button>

    <RouterLink
      v-for="item in foldedItems"
      :key="item.path"
      :to="item.path"
      :title="`${item.title} · ${item.en}`"
      :aria-current="isActive(item) ? 'page' : undefined"
      :class="['ui-sidebar-link', 'ui-sidebar-link--in-more', { 'ui-sidebar-link--active': isActive(item) }]"
      @pointerenter="prefetchByPath(item.path)"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
      <span class="ui-sidebar-link__text">
        <span class="ui-sidebar-link__cn">{{ item.title }}</span>
        <span class="ui-sidebar-link__en">{{ item.en }}</span>
      </span>
      <span class="ui-sidebar-link__label">{{ item.short || item.title }}</span>
    </RouterLink>

    <div class="ui-sidebar-tools">
      <RouterLink
        v-if="IS_DEV"
        :to="DEBUG_PATH"
        title="调试台 · DEBUG"
        class="ui-sidebar-link ui-sidebar-debug"
        :class="{ 'ui-sidebar-link--active': route.path === DEBUG_PATH }"
        @pointerenter="prefetchByPath(DEBUG_PATH)"
      >
        <span class="ui-sidebar-link__icon" v-html="DEBUG_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">调试台</span>
          <span class="ui-sidebar-link__en">DEBUG</span>
        </span>
        <span class="ui-sidebar-link__label">调试台</span>
      </RouterLink>

      <!-- 跨模式入口：属「工具」位而非内容章节，故与设置同组、紧贴设置之上 -->
      <button
        type="button"
        class="ui-sidebar-link ui-sidebar-swap"
        :title="`前往${swapDest}`"
        :aria-label="`前往${swapDest}`"
        @click="onSwap"
      >
        <span class="ui-sidebar-link__icon" v-html="SWAP_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">{{ swapLabel.title }}</span>
          <span class="ui-sidebar-link__en">{{ swapLabel.en }}</span>
        </span>
        <span class="ui-sidebar-link__label">{{ swapLabel.title }}</span>
      </button>

      <RouterLink
        :to="settingsPath"
        title="设置 · SETTINGS"
        class="ui-sidebar-link ui-sidebar-settings"
        :class="{ 'ui-sidebar-link--active': route.path === settingsPath }"
      >
        <span class="ui-sidebar-link__icon" v-html="SETTINGS_ITEM.icon" />
        <span class="ui-sidebar-link__text">
          <span class="ui-sidebar-link__cn">设置</span>
          <span class="ui-sidebar-link__en">SETTINGS</span>
        </span>
        <span class="ui-sidebar-link__label">设置</span>
      </RouterLink>
    </div>
  </nav>

  <Transition name="ui-more">
    <div v-if="moreOpen" class="ui-more" @click.self="moreOpen = false">
      <div id="ui-more-sheet" ref="sheetRef" class="ui-more__sheet" role="dialog" aria-label="更多导航">
        <RouterLink
          v-for="item in foldedItems"
          :key="item.path"
          :to="item.path"
          :class="['ui-more__item', { 'ui-more__item--active': isActive(item) }]"
        >
          <span class="ui-more__icon" v-html="item.icon" />
          <span class="ui-more__label">{{ item.title }}</span>
          <span class="ui-more__en">{{ item.en }}</span>
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>
