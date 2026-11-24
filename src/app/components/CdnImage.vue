<script setup lang="ts">
import { computed } from 'vue';
import { cdnImgAttrs } from '../../lib/image';

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
}>(), {
  alt: '',
});

const attrs = computed(() => cdnImgAttrs(props.src, props.alt, {
  loading: props.loading,
  fetchpriority: props.fetchpriority,
}));
</script>

<template>
  <img v-bind="attrs">
</template>
