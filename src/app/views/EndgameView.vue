<script setup lang="ts">
/**
 * 终局内容布局：模式 Tab 导航 + 内嵌 RouterView
 * 子路由（maze/story/boss/peak）共享此布局实例，Tab 切换不触发 App 级过渡。
 * 星际档案样式（子导航 + v-html 卡片）随本视图懒加载：../styles/endgame.css
 */
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { ENDGAME_MODES } from '../catalog/pages/endgame';
import '../../styles/endgame.css';
const route = useRoute();

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}
</script>

<template>
  <div class="nk-endgame">
    <nav class="nk-eg-subnav" aria-label="终局内容分类">
      <RouterLink
        v-for="m in ENDGAME_MODES"
        :key="m.key"
        :to="m.path"
        class="nk-eg-subnav__item"
        :class="{ active: isActive(m.path) }"
        :data-mode="m.key"
      >
        <span class="nk-eg-subnav__emblem" v-html="m.emblem"></span>
        <span class="nk-eg-subnav__text">
          <span class="nk-eg-subnav__name">{{ m.label }}</span>
          <span class="nk-eg-subnav__en">{{ m.en }}</span>
        </span>
      </RouterLink>
    </nav>
    <!-- 滚动区容器：CatalogPage 根节点为 absolute inset:0，需相对定位约束其只覆盖 Tab 栏下方，
         否则目录页会覆盖整个 .nk-endgame，导致吸顶工具条遮蔽 4 个 Tab 选项 -->
    <div class="nk-endgame__body">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.nk-endgame {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
}

/* 滚动区容器：目录页（absolute inset:0）的相对定位参照，使 Tab 栏固定于顶部、吸顶工具条吸附其下 */
.nk-endgame__body { position: relative; flex: 1; min-height: 0; }
</style>
