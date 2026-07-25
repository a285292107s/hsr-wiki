<script setup lang="ts">
/**
 * 目录视图：从 route.meta.catalog 解析页面配置，交给通用目录引擎渲染。
 * :key 强制在目录间切换（/lightcone → /relic）时完整重建引擎状态；
 * 终局 4 路由（meta.endgameTab）共享 'endgame' key，组件实例存活，
 * 由 CatalogPage 内部 watcher 原地刷新数据。
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CatalogPage from '../catalog/CatalogPage.vue';
import { CATALOG_PAGES } from '../catalog/pages';

const route = useRoute();
const config = computed(() => CATALOG_PAGES[String(route.meta.catalog || '')]);

const pageKey = computed(() =>
  route.meta.endgameTab ? 'endgame' : (config.value?.id ?? ''),
);
</script>

<template>
  <CatalogPage v-if="config" :key="pageKey" :config="config" />
</template>
