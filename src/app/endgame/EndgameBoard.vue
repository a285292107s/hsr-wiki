<script setup lang="ts">
import { ref, watch } from 'vue';
import StageContent from './StageContent.vue';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import EndgameFloorBuff from './EndgameFloorBuff.vue';
import EndgameSeasonBoss from './EndgameSeasonBoss.vue';
import { fallbackSystemName } from './guide';
import type { StageKey } from './boss-guide';
import type { MazeBossGuide, MazeBuffInfo, MazeStageDetail } from '../../services/types';

const props = defineProps<{
  id: string;
  labelledBy?: string;
  stage: MazeStageDetail;
  stageKey: StageKey;
  buffs: MazeBuffInfo[];
  guides?: Record<string, MazeBossGuide>;
  buff?: MazeBuffInfo | null;
  systemName?: string;
  systemChoice?: string;
}>();

const phase = ref(1);
watch(() => props.stage, () => { phase.value = 1; });
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
      <EndgameBuffGroup
        v-if="buffs.length"
        :title="systemName || fallbackSystemName()"
        :items="buffs"
        :tail="systemChoice"
      />
      <EndgameSeasonBoss
        :stage="stage"
        :guides="guides"
        :stage-key="stageKey"
        :phase="phase"
        @update:phase="phase = $event"
      />
      <StageContent :stage="stage" :phase="phase" head @update:phase="phase = $event" />
    </div>
  </div>
</template>
