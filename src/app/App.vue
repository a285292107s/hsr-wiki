<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast
 * 过渡类名来自 tokens.css（nk-view-fwd / nk-view-back / nk-view-fade），
 * 方向由 router beforeEach 计算的 navDir 驱动。
 * 手机断点（<768px）统一使用快速纯淡入淡出，避免方向滑移造成闪烁。
 * 模式主题：route.meta.cw 驱动 <html data-theme="cw">（货币战争全壳暗金），
 * 切换瞬间挂载 .theme-transitioning 实现 400ms 世界“褪色重染”。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
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

const viewKey = computed(() => route.path);

/* ─── 货币战争模式：全壳暗金主题切换 ─── */
const isCw = computed(() => !!route.meta.cw);
let themeTimer: ReturnType<typeof setTimeout> | null = null;

function applyTheme(cw: boolean, animate: boolean): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transitioning');
    if (themeTimer !== null) clearTimeout(themeTimer);
    themeTimer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      themeTimer = null;
    }, 450);
  }
  if (cw) root.dataset.theme = 'cw';
  else delete root.dataset.theme;
}

/* 首次加载（深链直达 CW 页）不播放渐变，直接应用主题 */
applyTheme(isCw.value, false);
watch(isCw, (cw) => applyTheme(cw, true));
onBeforeUnmount(() => { if (themeTimer !== null) clearTimeout(themeTimer); });
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
