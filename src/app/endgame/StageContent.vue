<script setup lang="ts">
import { computed } from 'vue';
import EnemyCard from '../components/EnemyCard.vue';
import { elemRow, monCountLabel, monWaveGroups } from './renders';
import type { MazeStageDetail, MazeStageInvasion } from '../../services/types';

import { translate } from '../i18n';

const t = translate;

const props = defineProps<{
  stage: MazeStageDetail;
  damage?: string[];
  showCount?: boolean;
  invasion?: MazeStageInvasion;
  phase?: number;
  head?: boolean;
}>();

const emit = defineEmits<{ 'update:phase': [phase: number] }>();

const pollutedById = computed<Map<string, number>>(() => {
  const inv = props.invasion ?? props.stage.invasion;
  const level = inv?.level;
  if (!level) return new Map();
  return new Map((inv?.monsters || []).map((m) => [String(m.id), level]));
});

const waves = computed(() => monWaveGroups(props.stage.monsters || []));
</script>

<template>
  <div
    v-if="props.damage?.length || stage.monsters?.length || stage.invasion"
    class="nk-egd-floor__stage"
    :class="{ 'nk-egd-floor__stage--head': head }"
  >
    <header v-if="head" class="nk-egd-stage__head">
      <h2 class="nk-egd-stage__title">{{ t('egd.enemySetup') }}</h2>
    </header>
    <div v-if="props.damage?.length" class="nk-egd-floor__row">
      <span class="nk-egd-floor__label">{{ t('egd.label.attr') }}</span>
      <span class="nk-egd-floor__elems" v-html="elemRow(props.damage)"></span>
    </div>
    <div class="nk-egd-floor__row nk-egd-floor__row--mons">
      <span v-if="!head" class="nk-egd-floor__label">{{ t('egd.enemySetup') }}</span>
      <span
        v-if="props.showCount && monCountLabel(stage.monsters)"
        class="nk-egd-floor__moncount"
      >{{ monCountLabel(stage.monsters) }}</span>
      <span class="nk-egd-floor__monswrap">
        <span v-for="(g, gi) in waves" :key="gi" class="nk-egd-floor__wave">
          <span v-if="waves.length > 1" class="nk-egd-floor__wavelabel">{{ t('egd.waveLabel', { n: g.wave }) }}</span>
          <div class="nk-egd-mons">
            <EnemyCard
              v-for="m in g.items"
              :key="`${m.id}-${gi}`"
              :monster="m"
              :polluted="pollutedById.get(String(m.id))"
              :phase="m.boss_guide ? phase : undefined"
              @update:phase="emit('update:phase', $event)"
            />
          </div>
        </span>
      </span>
    </div>
  </div>
</template>
