<script setup lang="ts">
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
