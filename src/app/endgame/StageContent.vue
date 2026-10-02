<script setup lang="ts">
import EnemyCard from '../components/EnemyCard.vue';
import { monWaveGroups } from './renders';
import type { MazeStageDetail } from '../../services/types';

/** 战斗看板的「敌方配置」块：场次身份与推荐属性由上方卡片行承担，看板内不再复述。 */
defineProps<{
  stage: MazeStageDetail;
}>();
</script>

<template>
  <div v-if="stage.monsters?.length || stage.invasion" class="nk-egd-floor__stage">
    <div class="nk-egd-floor__row nk-egd-floor__row--mons">
      <span class="nk-egd-floor__label">敌方配置</span>
      <span class="nk-egd-floor__monswrap">
        <span v-for="(g, gi) in monWaveGroups(stage.monsters || [])" :key="gi" class="nk-egd-floor__wave">
          <span v-if="monWaveGroups(stage.monsters || []).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
          <div class="nk-egd-mons">
            <EnemyCard v-for="m in g.items" :key="`${m.id}-${gi}`" :monster="m" />
          </div>
        </span>
      </span>
    </div>
  </div>
</template>