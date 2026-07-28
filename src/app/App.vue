<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast
 * 过渡类名来自 tokens.css（nk-view-fwd / nk-view-back / nk-view-fade），
 * 方向由 router beforeEach 计算的 navDir 驱动。
 * viewKey：终局 4 路由（meta.endgameTab）共享同一 key，互切不触发页面过渡。
 * 手机断点（<768px）统一使用快速纯淡入淡出，避免方向滑移造成闪烁。
 */
import { computed, onBeforeUnmount, ref } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();

/* ─── 手机断点检测：<768px 时禁用方向滑移过渡 ─── */
const mobileQuery = window.matchMedia('(max-width: 767px)');
const isMobile = ref(mobileQuery.matches);
const onMqChange = (e: MediaQueryListEvent): void => { isMobile.value = e.matches; };
mobileQuery.addEventListener('change', onMqChange);
onBeforeUnmount(() => mobileQuery.removeEventListener('change', onMqChange));

const transitionName = computed(() =>
  isMobile.value
    ? 'nk-view-fade'
    : navDir.value > 0 ? 'nk-view-fwd' : navDir.value < 0 ? 'nk-view-back' : 'nk-view-fade',
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
