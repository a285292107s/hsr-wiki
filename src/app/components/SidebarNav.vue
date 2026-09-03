<script setup lang="ts">
/**
 * 自建侧边栏（双模式导航，手机底部栏动态溢出折叠，切换时按钮位置不偏移）
 * 单一规范顺序 = navItems（交换 → 枢纽 → 板块 → 设置），所有断点共用，仅展示形式不同：
 * 手机（<768px）底部栏每槽 ≥44px（触控下限），按规范顺序从前往后展示，放不下的尾部折叠
 * 进"更多"抽屉（按钮按规范顺序位于折叠边界，ResizeObserver 随宽度变化实时重算）；
 * 平板/桌面竖排侧栏全部平铺（"更多"恒隐藏）。
 * 首项为「交换」按钮：跳转对方模式枢纽页（/ ↔ /currency）。
 * 分隔线后首项为本模式枢纽页 Tab（常规=首页 /；CW=枢纽 /currency）。
 * 常规模式：枢纽+7 板块；CW 模式：枢纽+5 板块（短标签）。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { NORMAL_NAV_ITEMS, CW_NAV_ITEMS, NORMAL_HUB_ITEM, CW_HUB_ITEM, SWAP_ITEM, type NavItem } from './nav-items';
import { prefetchByPath } from '../router/chunks';

const route = useRoute();
const router = useRouter();

/** 当前是否处于货币战争模式（由路由 meta.cw 驱动，与 App.vue 主题切换同源） */
const isCw = computed(() => !!route.meta.cw);

/** 模式感知导航项（枢纽页 Tab 置顶，其后为各板块） */
const navItems = computed<NavItem[]>(() =>
  isCw.value ? [CW_HUB_ITEM, ...CW_NAV_ITEMS] : [NORMAL_HUB_ITEM, ...NORMAL_NAV_ITEMS],
);

/** 「交换」：跳转对方模式的枢纽页 */
function onSwap(): void {
  void router.push(isCw.value ? '/' : '/currency');
}

/* ─── 模式切换过渡：导航板块「重凝」动画（交换按钮与分隔线保持不动） ─── */
const swapping = ref(false);
let swapTimer: ReturnType<typeof setTimeout> | null = null;
watch(isCw, () => {
  swapping.value = true;
  if (swapTimer !== null) clearTimeout(swapTimer);
  swapTimer = setTimeout(() => { swapping.value = false; }, 420);
});

/** 目录项高亮：精确匹配或其子路径（如 /currency/role 在 /currency/role/1001 下仍高亮）；
 *  配置了 activePaths 的项（如终局内容 4 路由）对每个路径分别判定；
 *  exact 项（枢纽页）仅精确匹配，避免与板块项同时高亮 */
function isActive(item: NavItem): boolean {
  const p = route.path;
  const paths = item.activePaths || [item.path];
  return paths.some((ap) => p === ap || (!item.exact && p.startsWith(ap + '/')));
}

/* ─── 手机"更多"聚合（动态溢出折叠，仅 <768px 生效；平板/桌面全部平铺） ─── */
const sidebarRef = ref<HTMLElement | null>(null);
const moreOpen = ref(false);
const moreBtnRef = ref<HTMLElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);

/** 可见导航板块数（规范顺序前缀）；放不下的尾部折叠进"更多"抽屉 */
const visibleCount = ref(navItems.value.length);
const visibleItems = computed(() => navItems.value.slice(0, visibleCount.value));
const foldedItems = computed(() => navItems.value.slice(visibleCount.value));
/** 任一项命中当前路由时"更多"高亮 */
const moreActive = computed(() => foldedItems.value.some(isActive));

/* 折叠判定：底部栏每槽 ≥44px（触控下限），按规范顺序从前往后塞入导航板块，
   尾部放不下的折叠进"更多"。--measure 态同一帧同步读各槽位宽度（无可见闪烁）；
   ≥768px 平板/桌面不折叠（全部平铺）。 */
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
      /* offsetWidth 不含外边距：分隔线有 margin: 0 3px（左右共 6px 水平占用），漏计会高估可用空间导致多塞一槽溢出 */
      return n.offsetWidth + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
    };
    const fixed = q('.ui-sidebar-swap') + q('.ui-sidebar-divider') + q('.ui-sidebar-settings');
    const moreW = q('.ui-sidebar-more');
    const navW = Array.from(el.querySelectorAll<HTMLElement>('a.ui-sidebar-link:not(.ui-sidebar-settings)')).map(
      (n) => n.offsetWidth,
    );
    const total = navW.reduce((a, b) => a + b, 0);
    let k = navW.length;
    if (fixed + total > avail) {
      /* 全部放不下：为"更多"按钮留位，再从前往后塞入导航项 */
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

/** 路由变化后自动收起抽屉（含切走时重置） */
watch(() => route.path, () => { moreOpen.value = false; });
watch(isCw, (cw) => { if (cw) moreOpen.value = false; });
/* 模式/宽度变化时重算折叠；折叠数达全量（无折叠）时自动收起抽屉 */
watch(navItems, () => { void nextTick(recomputeFold); });
watch(visibleCount, () => {
  if (visibleCount.value >= navItems.value.length) moreOpen.value = false;
});

/** Escape 关闭 */
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') moreOpen.value = false;
}
watch(moreOpen, async (open) => {
  if (open) {
    window.addEventListener('keydown', onKeydown);
    /* 焦点管理：开启时移入抽屉首项（dialog 模式） */
    await nextTick();
    sheetRef.value?.querySelector<HTMLElement>('.ui-more__item')?.focus();
  } else {
    window.removeEventListener('keydown', onKeydown);
    /* 关闭时焦点归还"更多"按钮 */
    moreBtnRef.value?.focus();
  }
});
/* 挂载后立即收敛折叠 + 监听宽度变化（旋转/分屏/窗口缩放）实时重算 */
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

/** "更多"入口图标（横三点，与其他图标同族） */
const MORE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';

/** 设置入口（齿轮图标，与导航板块同族；跳转当前模式的设置页） */
const settingsPath = computed(() => (isCw.value ? '/currency/settings' : '/settings'));
const SETTINGS_ITEM = {
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
} as const;
</script>

<template>
  <nav ref="sidebarRef" class="ui-sidebar" :class="{ 'ui-sidebar--cw': isCw, 'ui-sidebar--swap-anim': swapping }" aria-label="主导航">
    <!-- 交换按钮：模式切换入口（与下方导航板块以分隔线区隔） -->
    <button
      type="button"
      class="ui-sidebar-link ui-sidebar-swap"
      :title="isCw ? '交换 · 返回常规模式' : '交换 · 进入货币战争'"
      :aria-label="isCw ? '切换到常规模式' : '切换到货币战争模式'"
      @click="onSwap"
    >
      <span class="ui-sidebar-link__icon" v-html="SWAP_ITEM.icon" />
      <span class="ui-sidebar-link__text">
        <span class="ui-sidebar-link__cn">交换</span>
        <span class="ui-sidebar-link__en">SWAP</span>
      </span>
      <span class="ui-sidebar-link__label">交换</span>
    </button>

    <!-- 分隔线：交换（模式切换）与导航板块的视觉分界 -->
    <span class="ui-sidebar-divider" aria-hidden="true"></span>

    <!-- 当前模式的导航板块（单一规范顺序渲染：可见前缀 + "更多"按钮 + 折叠尾部。
         手机端放不下的尾部折叠进"更多"抽屉，平板/桌面全部平铺、按钮隐藏） -->
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

    <!-- 手机："更多"聚合入口（按规范顺序位于折叠边界；无折叠或平板/桌面时隐藏） -->
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

    <!-- 折叠进"更多"的尾部（手机隐藏；平板/桌面由 CSS 恢复平铺） -->
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

    <!-- 设置入口：始终置底（常规/CW 模式均展示，跳转当前模式的设置页） -->
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
  </nav>

  <!-- 手机："更多"抽屉（点遮罩关闭；导航后由 route watcher 自动收起） -->
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
