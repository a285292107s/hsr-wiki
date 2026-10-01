<script setup lang="ts">
import { targetHtml } from './renders';
import type { MazeTargetInfo } from '../../services/types';

defineProps<{ items: MazeTargetInfo[] }>();
</script>

<template>
  <div v-if="items.length" class="nk-egd-floor__goals">
    <span class="nk-egd-floor__goalslabel">挑战目标</span>
    <ol class="nk-egd-floor__targets">
      <li v-for="(t, ti) in items" :key="ti" class="nk-egd-floor__target">
        <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
        <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
      </li>
    </ol>
  </div>
</template>
