<script setup lang="ts">
import { pollutionLabel } from './pollution';
import { monCountLabel } from './renders';
import type { MazeStageDetail } from '../../services/types';

/** 场次行头片段（场次标签 / 污染徽标 / 波次·敌数）：
 *  只出三个 chip，几何由所在容器承担——StageContent 内联时是 `.nk-egd-floor__stagehead`。 */
defineProps<{
  label?: string;
  stage: MazeStageDetail | undefined;
}>();
</script>

<template>
  <template v-if="stage">
    <span v-if="label" class="nk-egd-floor__stagelabel">{{ label }}</span>
    <span
      v-if="stage.invasion"
      class="nk-egd-pollchip"
      :data-level="stage.invasion.level"
    >{{ pollutionLabel(stage.invasion) }}</span>
    <span v-if="monCountLabel(stage.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(stage.monsters) }}</span>
  </template>
</template>
