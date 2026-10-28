<script setup lang="ts">
import { computed } from 'vue';
import BossGuideSection from './BossGuideSection.vue';
import { stageBossGuide, stageOwnerLabel } from './boss-guide';
import type { StageKey } from './boss-guide';
import type { MazeBossGuide, MazeStageDetail } from '../../services/types';

const props = defineProps<{
  stage: MazeStageDetail | undefined;
  guides?: Record<string, MazeBossGuide>;
  stageKey: StageKey;
  phase: number;
}>();

const emit = defineEmits<{ 'update:phase': [phase: number] }>();

const entry = computed(() => stageBossGuide(props.stage, props.guides));
const owner = computed(() => stageOwnerLabel(props.stageKey, props.stage));
</script>

<template>
  <BossGuideSection
    v-if="entry"
    :guide="entry.guide"
    :owner="owner"
    :phase="phase"
    @update:phase="emit('update:phase', $event)"
  />
</template>
