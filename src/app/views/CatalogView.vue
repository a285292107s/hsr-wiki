<script setup lang="ts">
/**
 * 目录视图：从 route.meta.catalog 解析页面配置，交给通用目录引擎渲染。
 * :key 强制在目录间切换（/lightcone → /relic）时完整重建引擎状态。
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CatalogPage from '../catalog/CatalogPage.vue';
import { CATALOG_PAGES } from '../catalog/pages';

const route = useRoute();
const config = computed(() => CATALOG_PAGES[String(route.meta.catalog || '')]);

const pageKey = computed(() => config.value?.id ?? '');
</script>

<template>
  <CatalogPage v-if="config" :key="pageKey" :config="config" />
</template>
