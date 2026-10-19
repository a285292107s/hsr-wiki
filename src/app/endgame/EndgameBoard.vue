<script setup lang="ts">
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import { fallbackSystemName } from './guide';
import type { MazeBossGuide, MazeBuffInfo, MazeStageDetail } from '../../services/types';

defineProps<{
  id: string;
  labelledBy?: string;
  stage: MazeStageDetail;
  buffs: MazeBuffInfo[];
  guides?: Record<string, MazeBossGuide>;
  buff?: MazeBuffInfo | null;
  systemName?: string;
}>();
</script>

<template>
  <div
    :id="id"
    class="nk-egd-board"
    :role="labelledBy ? 'tabpanel' : undefined"
    :aria-labelledby="labelledBy"
  >
    <div class="nk-egd-board__body nk-egd-children">
      <EndgameFloorBuff :buff="buff" />
      <EndgameBuffGroup v-if="buffs.length" :title="systemName || fallbackSystemName()" :items="buffs" />
      <StageContent :stage="stage" :guides="guides" />
    </div>
  </div>
</template>
