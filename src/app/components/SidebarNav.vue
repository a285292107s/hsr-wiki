<script setup lang="ts">
/**
 * 自建侧边栏（复用 NAV_ITEMS，共 9 项）
 */
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
