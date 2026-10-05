<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { Analytics } from '@vercel/analytics/vue';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();

const mobileQuery = window.matchMedia('(max-width: 767px)');
const isMobile = ref(mobileQuery.matches);
const onMqChange = (e: MediaQueryListEvent): void => { isMobile.value = e.matches; };
mobileQuery.addEventListener('change', onMqChange);
onBeforeUnmount(() => mobileQuery.removeEventListener('change', onMqChange));

const SWAP_PATHS = new Set(['/', '/currency']);
let lastPath = route.path;
const isHubSwapHit = ref(false);

watch(() => route.path, (path) => {
  isHubSwapHit.value = SWAP_PATHS.has(lastPath) && SWAP_PATHS.has(path);
  lastPath = path;
});

const isHubSwap = computed(() => isHubSwapHit.value);

const transitionName = computed(() =>
  isMobile.value
    ? 'nk-view-fade'
    : isHubSwap.value ? 'nk-view-swap'
      : navDir.value > 0 ? 'nk-view-fwd' : navDir.value < 0 ? 'nk-view-back' : 'nk-view-fade',
);

const viewKey = computed(() => route.path);

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

applyTheme(isCw.value, false);
watch(isCw, (cw) => applyTheme(cw, true));
onBeforeUnmount(() => { if (themeTimer !== null) clearTimeout(themeTimer); });
</script>

<template>
  <SidebarNav />
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName">
      <component :is="Component" :key="viewKey" />
    </Transition>
  </RouterView>
  <ToastHost />
  <Analytics />
</template>
