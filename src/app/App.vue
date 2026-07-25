<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast
 * 过渡类名来自 tokens.css（nk-view-fwd / nk-view-back / nk-view-fade），
 * 方向由 router beforeEach 计算的 navDir 驱动。
 * viewKey：终局 4 路由（meta.endgameTab）共享同一 key，互切不触发页面过渡。
 */
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();

const transitionName = computed(() =>
  navDir.value > 0 ? 'nk-view-fwd' : navDir.value < 0 ? 'nk-view-back' : 'nk-view-fade',
);

const viewKey = computed(() => (route.meta.endgameTab ? 'endgame' : route.path));
</script>

<template>
  <SidebarNav />
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="viewKey" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
