<script setup lang="ts">
/**
 * 自建侧边栏（双模式导航，手机底部栏统一 6 槽位，切换时按钮位置不偏移）
 * 首项为「交换」按钮：跳转对方模式枢纽页（/ ↔ /currency）。
 * 常规模式：7 板块；手机（<768px）底部栏 = 交换 + 4 主项 + "更多"抽屉。
 * CW 模式：5 板块；手机底部栏 = 交换 + 5 板块平铺（短标签），无抽屉。
 * 平板/桌面：竖排图标侧栏，当前模式全部板块展示 + 顶部 brand 标识。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { NORMAL_NAV_ITEMS, CW_NAV_ITEMS, SWAP_ITEM, type NavItem } from './nav-items';

const route = useRoute();
const router = useRouter();

/** 当前是否处于货币战争模式（由路由 meta.cw 驱动，与 App.vue 主题切换同源） */
const isCw = computed(() => !!route.meta.cw);

/** 模式感知导航项 */
const navItems = computed<NavItem[]>(() => (isCw.value ? CW_NAV_ITEMS : NORMAL_NAV_ITEMS));

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
 *  配置了 activePaths 的项（如终局内容 4 路由）对每个路径分别判定 */
function isActive(item: NavItem): boolean {
  const p = route.path;
  const paths = item.activePaths || [item.path];
  return paths.some((ap) => p === ap || p.startsWith(ap + '/'));
}

/* ─── 手机"更多"聚合（仅常规模式） ─── */
const moreItems = NORMAL_NAV_ITEMS.filter((n) => !n.primary);
const moreOpen = ref(false);
const moreBtnRef = ref<HTMLElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);
/** 任一项命中当前路由时"更多"高亮 */
const moreActive = computed(() => moreItems.some(isActive));

/** 路由变化后自动收起抽屉（含切走时重置） */
watch(() => route.path, () => { moreOpen.value = false; });
watch(isCw, (cw) => { if (cw) moreOpen.value = false; });

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
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (swapTimer !== null) clearTimeout(swapTimer);
});

/** "更多"入口图标（横三点，与其他图标同族） */
const MORE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
</script>

<template>
  <nav class="ui-sidebar" :class="{ 'ui-sidebar--cw': isCw, 'ui-sidebar--swap-anim': swapping }" aria-label="主导航">
    <!-- 交换按钮：模式切换入口（与下方导航板块以分隔线区隔） -->
    <button
      type="button"
      class="ui-sidebar-link ui-sidebar-swap"
      :title="isCw ? '交换 · 返回常规模式' : '交换 · 进入货币战争'"
      :aria-label="isCw ? '切换到常规模式' : '切换到货币战争模式'"
      @click="onSwap"
    >
      <span class="ui-sidebar-link__icon" v-html="SWAP_ITEM.icon" />
      <span class="ui-sidebar-link__label">交换</span>
    </button>

    <!-- 分隔线：交换（模式切换）与导航板块的视觉分界 -->
    <span class="ui-sidebar-divider" aria-hidden="true"></span>

    <!-- 当前模式的导航板块 -->
    <RouterLink
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :title="`${item.title} · ${item.en}`"
      :aria-current="isActive(item) ? 'page' : undefined"
      :class="[
        'ui-sidebar-link',
        {
          'ui-sidebar-link--active': isActive(item),
          'ui-sidebar-link--in-more': !isCw && !item.primary,
        },
      ]"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
      <span class="ui-sidebar-link__label">{{ item.short || item.title }}</span>
    </RouterLink>

    <!-- 手机："更多"聚合入口（仅常规模式；CW 模式 5 板块平铺无需收纳） -->
    <button
      v-if="!isCw"
      ref="moreBtnRef"
      type="button"
      title="更多 · MORE"
      class="ui-sidebar-link ui-sidebar-more"
      :class="{ 'ui-sidebar-link--active': moreActive || moreOpen }"
      :aria-expanded="moreOpen"
      aria-controls="ui-more-sheet"
      @click="moreOpen = !moreOpen"
    >
      <span class="ui-sidebar-link__icon" v-html="MORE_ICON" />
      <span class="ui-sidebar-link__label">更多</span>
    </button>
  </nav>

  <!-- 手机："更多"抽屉（点遮罩关闭；导航后由 route watcher 自动收起） -->
  <Transition name="ui-more">
    <div v-if="moreOpen && !isCw" class="ui-more" @click.self="moreOpen = false">
      <div id="ui-more-sheet" ref="sheetRef" class="ui-more__sheet" role="dialog" aria-label="更多导航">
        <RouterLink
          v-for="item in moreItems"
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
