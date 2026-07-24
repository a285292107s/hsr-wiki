<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast
 * 过渡类名来自 tokens.css（nk-view-fwd / nk-view-back / nk-view-fade），
 * 方向由 router beforeEach 计算的 navDir 驱动。
 */
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const transitionName = computed(() =>
  navDir.value > 0 ? 'nk-view-fwd' : navDir.value < 0 ? 'nk-view-back' : 'nk-view-fade',
);
</script>

<template>
  <SidebarNav />
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
