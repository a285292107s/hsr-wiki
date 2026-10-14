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

/* 显示文案一律经词典：nav-items 只留结构（路径 / 图标 / 拉丁副标）与**完整词典键**（`nav.*`）。
   注：`ui-sidebar-link__cn` 是既有的主标类名（e2e 与样式依赖），现在承载的是**当前语言**主标。 */
const itemLabel = (item: NavItem): string => t(item.key);
const itemShort = (item: NavItem): string => t(item.shortKey ?? item.key);

const isCw = computed(() => !!route.meta.cw);

/** 跨模式入口的可见文案 = 目的地模式名（常规模式页显示「货币战争」，反之显示「常规模式」） */
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

/* 底栏槽位数 = 纯视口函数（不参考任何文案宽度），因此**与语言无关**——这是本轮的核心契约。
   改前「显示几个」由译文固有宽决定：同一 390px 视口 cn 显示 5 项而 pt 只有 3 项。
   不设「固定 4 项」之类的人为上限：那会把中文/韩文从 5 项压到 4 项，等于用「多数语言没变好」
   换「少数字语言变好」。上限改为物理值（槽宽 ≥ `--nk-nav-slot-min`）。 */

/** 底栏槽位预算（**只读令牌与视口，不量 DOM**）。
 *
 * 为什么不再量 DOM 固有宽：`flex-basis: auto` 下每项的「固有宽」等于该语言标签的像素宽，
 * 折叠结果因此被译文长度决定。改成等分槽位（CSS `flex: 1 1 0`）后槽宽只由视口决定，
 * 「显示几个」也就可以用纯算术定下来。
 * 取数口径必须是 `clientWidth`（= 视口宽）：底栏是 fixed 全宽，量 `offsetWidth` 等于把
 * 「当前折叠成的窄盒」当输入，会自锁。
 *
 * **两段式预算**（次序有意义）：
 * ① 先问「不收折时全量放得下吗」——放得下就全部平铺、**不占「更多」槽**。
 *    这一段是 ADR 0007「CW 手机端 6 槽位平铺、无更多抽屉」的落地：若一上来就预留「更多」，
 *    该项在 390px 档会退成「5 项 + 更多」，等于用可见性换一致性。
 * ② 放不下才预留「更多」槽，再按同一下限取前缀——此时槽数仍与语言无关。
 * `--nk-nav-slot-min` 取的是「最宽语言仍能折两行」所需的槽宽，故两段的取值对 13 语言同一。 */
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
  // ① 全域平铺：固定位只有「跨模式入口 + 设置」+ 分隔线
  const full = avail - toolW * 2 - dividerW;
  if (Math.floor(full / slotMin) >= n) {
    visibleCount.value = n;
    return;
  }
  // ② 需要折叠：「更多」入口加入固定位
  const budget = avail - toolW * 3 - dividerW;
  /* 下界 2：再窄也不能出现「底栏全是工具位」的无导航形态。 */
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

/** 地址栏里的当前站内路径（去掉语言前缀 base）。**开关的两个方向都以它为准，不以 `route.path` 为准**：
 *  `push` 是「先改 URL、再解析路由」，解析完成前 `route.path` 仍是 START_LOCATION（`'/'`）——
 *  那时用 `route.path` 判「是否已在设置页」会把收起误判成「进入设置」，落回一次重复 push
 *  （NAVIGATION_DUPLICATED ⇒ 点了没反应，停留在设置页）。实测：首屏目录 chunk 未就绪时点两次，
 *  落点从 `/en/` 变成 `/en/settings`，两种都不是来源页。 */
function locationAppPath(): string {
  const { pathname } = window.location;
  const stripped = `/${pathname.slice(localeBaseFromPath(pathname).length)}`.replace(/\/+$/, '');
  return stripped || '/';
}

const SETTINGS_PATHS = new Set(['/settings', '/currency/settings']);

/** 设置位是**可收起的开关**：已在设置页时再点即「收起」＝回到进入设置前那一页。
 *
 * 为什么不用 RouterLink 的默认行为：同址 `push` 被 vue-router 判为 NAVIGATION_DUPLICATED
 * （既无跳转、又照跑一次 `scrollBehavior`）⇒ 再点毫无反应，页面出不去。
 *
 * 收起的目标页**自持**，不读 `history.state.back`：后者是 vue-router 的内部簿记，实测在 CI 上
 * 为空或指错页。来源页在**点击那一刻**记（`route.fullPath`）——此刻它是唯一确定的来源。
 * `router.afterEach` 的 `from.fullPath` 只当补充，因为它有一个整段失效的窗口：首屏懒加载
 * chunk 未到位时侧栏已可点，而那时 `from` 是 START_LOCATION（path 恰为 `'/'`）、
 * `history.state.back` 也指 `'/'`——记录被 `from.matched.length === 0` 当成「直达设置页」跳过、
 * 簿记又指错页，**两条来源同时失效**（不是时序抖动：该窗口内必错）。实测延迟目录视图 chunk 后
 * 点设置两次，4/4 落到枢纽 `/en/`（与 CI 的 `Received: "/en/"` 同值）。
 * 路由尚未解析时以**本次落地 URL** 兜底（见 LANDING_PATH），落地即设置页时为 null，
 * 以保留「直达设置页 → 收起回本模式枢纽」的契约。
 * 仅本 SPA 会话有效：整页加载随文档卸载清零。
 * 带修饰键的点击（Ctrl/Cmd/中键）是「新标签页打开设置」，不得劫持。 */
let settingsEntryPath: string | null = null;
let offSettingsEntry: (() => void) | null = null;

/** 本次落地的站内路径，**仅用于「首屏路由尚未解析」这一档**：整页加载后它不再变化，
 *  解析完成后来源一律取 `route.fullPath`。落地即设置页时为 null（直达没有来源页）。 */
const LANDING_PATH: string | null = (() => {
  const path = locationAppPath();
  const { search, hash } = window.location;
  return SETTINGS_PATHS.has(path) ? null : `${path}${search}${hash}`;
})();

onMounted(() => {
  /* 补充来源：点击之外的入口（历史前进/后退落到设置页）也会经过这里。
     首屏未解析时 `from` 是 START_LOCATION（path 恰为 '/'）——那一档由点击时的 LANDING 兜底，见上。 */
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
  // 进入设置：跳转交给 RouterLink，来源**当场**记（理由见上方 settingsEntryPath 注释）
  if (!SETTINGS_PATHS.has(here)) {
    settingsEntryPath = route.matched.length > 0 ? route.fullPath : LANDING_PATH;
    return;
  }
  e.preventDefault();
  const back = router.options.history.state.back;
  if (settingsEntryPath && back === settingsEntryPath) {
    router.back(); // 簿记与自持记录一致：走浏览器返回，历史里不留两条相邻同页条目
    return;
  }
  // 簿记缺失/指错页时以自持来源页为准；都没记到（直达设置页）才回本模式枢纽。
  // `replace` 而非 `push`：免得历史里留下「收起后还能前进回设置页」的假入口。
  // 枢纽按**地址栏**分模式（不用 `isCw`：路由未解析时它还是常规模式，货币战争直达会落错页）。
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

      <!-- 跨模式入口：属「工具」位而非内容章节，故与设置同组、紧贴设置之上 -->
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
