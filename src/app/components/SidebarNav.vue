<script setup lang="ts">
/**
 * 自建侧边栏（Shadow DOM 内，复用 HOME_NAV 8 项）
 * 原脚本直接改造宿主 .ui-sidebar；新架构宿主 100% 隐藏，侧边栏完全自建。
 * 点击 RouterLink → host-sync history 同步驱动宿主 SPA 渲染目标页。
 */
import { useRoute, RouterLink } from 'vue-router';
import { NAV_ITEMS, type NavItem } from './nav-items';

const route = useRoute();

/** 目录项高亮：精确匹配或其子路径（如 /character 在 /character/1005 下仍高亮） */
function isActive(item: NavItem): boolean {
  const p = route.path;
  return p === item.path || p.startsWith(item.path + '/');
}
</script>

<template>
  <nav class="ui-sidebar" aria-label="主导航">
    <RouterLink
      v-for="item in NAV_ITEMS"
      :key="item.path"
      :to="item.path"
      :title="`${item.title} · ${item.en}`"
      :class="['ui-sidebar-link', { 'ui-sidebar-link--active': isActive(item) }]"
    >
      <span class="ui-sidebar-link__icon" v-html="item.icon" />
    </RouterLink>
  </nav>
</template>
