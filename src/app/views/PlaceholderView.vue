<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '该页面'));
const isCw = computed(() => !!route.meta.cw);
const sub = computed(() => (isCw.value ? '该板块即将上线，敬请期待' : '该页面将在第二期重构中迁移，敬请期待'));
</script>

<template>
  <div class="nk-placeholder">
    <div class="nk-empty">
      <div class="nk-empty__icon">🚧</div>
      <h2 class="nk-empty__title">{{ title }}</h2>
      <p class="nk-empty__sub">{{ sub }}</p>
    </div>
  </div>
</template>
