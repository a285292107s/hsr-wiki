<script setup lang="ts">
import { computed } from 'vue';
import EnemyCard from '../components/EnemyCard.vue';
import { elemRow, monCountLabel, monWaveGroups } from './renders';
import type { MazeBossGuide, MazeStageDetail, MazeStageInvasion } from '../../services/types';

import { translate } from '../i18n';

const t = translate;

const props = defineProps<{
  stage: MazeStageDetail;
  damage?: string[];
  showCount?: boolean;
  invasion?: MazeStageInvasion;
  guides?: Record<string, MazeBossGuide>;
}>();

const pollutedById = computed<Map<string, number>>(() => {
  const inv = props.invasion ?? props.stage.invasion;
  const level = inv?.level;
  if (!level) return new Map();
  return new Map((inv?.monsters || []).map((m) => [String(m.id), level]));
});
</script>

<template>
  <div v-if="props.damage?.length || stage.monsters?.length || stage.invasion" class="nk-egd-floor__stage">
    <div v-if="props.damage?.length" class="nk-egd-floor__row">
      <span class="nk-egd-floor__label">{{ t('egd.label.attr') }}</span>
      <span class="nk-egd-floor__elems" v-html="elemRow(props.damage)"></span>
    </div>
    <div class="nk-egd-floor__row nk-egd-floor__row--mons">
      <span class="nk-egd-floor__label">{{ t('egd.enemySetup') }}</span>
      <span
        v-if="props.showCount && monCountLabel(stage.monsters)"
        class="nk-egd-floor__moncount"
      >{{ monCountLabel(stage.monsters) }}</span>
      <span class="nk-egd-floor__monswrap">
        <span v-for="(g, gi) in monWaveGroups(stage.monsters || [])" :key="gi" class="nk-egd-floor__wave">
          <span v-if="monWaveGroups(stage.monsters || []).length > 1" class="nk-egd-floor__wavelabel">{{ t('egd.waveLabel', { n: g.wave }) }}</span>
          <div class="nk-egd-mons">
            <EnemyCard
              v-for="m in g.items"
              :key="`${m.id}-${gi}`"
              :monster="m"
              :polluted="pollutedById.get(String(m.id))"
              :guide="m.boss_guide ? props.guides?.[m.boss_guide] : undefined"
            />
          </div>
        </span>
      </span>
    </div>
  </div>
</template>
