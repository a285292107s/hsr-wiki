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

/* ─── 终局内容 Tab 导航（原 catalog.css .nk-cat-subnav 迁入：组件专属样式，CatalogPage 已不再使用该命名空间） ─── */
.nk-cat-subnav { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 16px 0 4px; }
.nk-cat-subnav__item { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; background: var(--card); border: 1px solid rgba(124,58,237,0.16); border-radius: 10px; text-decoration: none; cursor: pointer; transition: all 0.25s var(--ease); overflow: hidden; }
.nk-cat-subnav__item::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(124,58,237,0.06) 0%, transparent 60%); opacity: 0; transition: opacity 0.25s; }
.nk-cat-subnav__item:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 12px rgba(124,58,237,0.1); }
.nk-cat-subnav__item:hover::before { opacity: 1; }
.nk-cat-subnav__item.active { border-color: var(--primary); background: rgba(124,58,237,0.1); box-shadow: 0 0 16px rgba(124,58,237,0.15), inset 0 0 20px rgba(124,58,237,0.05); }
.nk-cat-subnav__item.active::before { opacity: 1; }
.nk-cat-subnav__name { font-size: 0.88rem; font-weight: 700; color: var(--text-bright); }
.nk-cat-subnav__en { font-family: var(--font-hud); font-size: 0.5rem; letter-spacing: 0.12em; color: var(--text3); }
.nk-cat-subnav__item:not(.active) .nk-cat-subnav__name { color: var(--text2); }
.nk-cat-subnav__item:not(.active):hover .nk-cat-subnav__name { color: var(--text-bright); }
@media (max-width: 767px) { .nk-cat-subnav { grid-template-columns: repeat(2, 1fr); gap: 8px; } .nk-cat-subnav__item { padding: 10px 12px; } }
@media (max-width: 374px) { .nk-cat-subnav { grid-template-columns: 1fr; } }
@media (min-width: 1600px) { .nk-cat-subnav { max-width: var(--nk-content-max); margin-left: auto; margin-right: auto; } }
</style>
