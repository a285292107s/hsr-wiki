<script setup lang="ts">
/**
 * 自建侧边栏（复用 NAV_ITEMS，共 9 项）
 * 手机（<768px）：底部 Tab Bar，仅展示 primary 主项（首页/角色/光锥）+“更多”聚合入口；
 * 平板/桌面：竖排图标侧边栏，9 项全部展示。
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { NAV_ITEMS, type NavItem } from './nav-items';

const route = useRoute();

/** 目录项高亮：精确匹配或其子路径（如 /character 在 /character/1005 下仍高亮）；
 *  配置了 activePaths 的项（如终局内容 4 路由）对每个路径分别判定 */
function isActive(item: NavItem): boolean {
  const p = route.path;
  const paths = item.activePaths || [item.path];
  return paths.some((ap) => p === ap || p.startsWith(ap + '/'));
}

/* ─── 手机“更多”聚合 ─── */
const moreItems = NAV_ITEMS.filter((n) => !n.primary);
const moreOpen = ref(false);
const moreBtnRef = ref<HTMLElement | null>(null);
const sheetRef = ref<HTMLElement | null>(null);
/** 任一项命中当前路由时“更多”高亮 */
const moreActive = computed(() => moreItems.some(isActive));

/** 路由变化后自动收起抽屉 */
watch(() => route.path, () => { moreOpen.value = false; });

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
    /* 关闭时焦点归还“更多”按钮 */
    moreBtnRef.value?.focus();
  }
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));

/** “更多”入口图标（横三点，与其他图标同族） */
const MORE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
</script>

<template>
  <nav class="ui-sidebar" aria-label="主导航">
    <RouterLink
      v-for="item in NAV_ITEMS"
      :key="item.path"
      :to="item.path"
      :title="`${item.title} · ${item.en}`"
      :aria-current="isActive(item) ? 'page' : undefined"
      :class="[
        'ui-sidebar-link',
        { 'ui-sidebar-link--active': isActive(item), 'ui-sidebar-link--in-more': !item.primary },
      ]"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
      <span class="ui-sidebar-link__label">{{ item.title }}</span>
    </RouterLink>

    <!-- 手机：“更多”聚合入口（平板/桌面隐藏）；展开期间保持高亮（moreOpen） -->
    <button
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

  <!-- 手机：“更多”抽屉（点遮罩关闭；导航后由 route watcher 自动收起） -->
  <Transition name="ui-more">
    <div v-if="moreOpen" class="ui-more" @click.self="moreOpen = false">
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
