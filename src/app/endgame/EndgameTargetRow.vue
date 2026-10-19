<script setup lang="ts">
import { TARGET_TYPE_LABEL, TARGET_TYPE_SVG, targetHtml, targetTypeIconHtml } from './renders';
import type { MazeTargetInfo } from '../../services/types';

defineProps<{ item: MazeTargetInfo; star?: boolean }>();
</script>

<template>
  <span class="nk-egd-node">
    <span v-if="star" class="nk-egd-node__star" aria-hidden="true" v-html="TARGET_TYPE_SVG.TOTAL_SCORE"></span>
    <span
      v-if="item.type && item.type !== 'TOTAL_SCORE' && TARGET_TYPE_LABEL[item.type]"
      class="nk-egd-node__type"
      :title="TARGET_TYPE_LABEL[item.type]"
      v-html="targetTypeIconHtml(item.type)"
    ></span>
    <span class="nk-egd-node__text" v-html="targetHtml(item)"></span>
  </span>
</template>
