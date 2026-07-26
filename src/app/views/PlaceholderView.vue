<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// 占位页：第一期尚未重构的内容模块（成就等，第二期实现）
const route = useRoute();
const title = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '该页面'));
</script>

<template>
  <div class="nk-placeholder">
    <div class="nk-empty">
      <div class="nk-empty__icon">🚧</div>
      <h2 class="nk-empty__title">{{ title }}</h2>
      <p class="nk-empty__sub">该页面将在第二期重构中迁移，敬请期待</p>
    </div>
  </div>
</template>
