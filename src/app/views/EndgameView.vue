<script setup lang="ts">
/**
 * 终局内容布局：Tab 栏 + 内嵌 RouterView
 * 子路由（maze/story/boss/peak）共享此布局实例，Tab 切换不触发 App 级过渡。
 */
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();

const TABS = [
  { label: '忘却之庭', en: 'FORGOTTEN HALL', path: '/endgame/maze' },
  { label: '虚构叙事', en: 'PURE FICTION', path: '/endgame/story' },
  { label: '末日幻影', en: 'APOCALYPSE', path: '/endgame/boss' },
  { label: '异相仲裁', en: 'ANOMALY', path: '/endgame/peak' },
] as const;

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
</script>

<template>
  <div class="nk-endgame">
    <nav class="nk-cat-subnav" aria-label="终局内容分类">
      <RouterLink
        v-for="tab in TABS"
        :key="tab.path"
        :to="tab.path"
        class="nk-cat-subnav__item"
        :class="{ active: isActive(tab.path) }"
      >
        <span class="nk-cat-subnav__name">{{ tab.label }}</span>
        <span class="nk-cat-subnav__en">{{ tab.en }}</span>
      </RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style scoped>
.nk-endgame {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}
</style>
