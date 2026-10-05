<script setup lang="ts">
import EnemyCard from '../components/EnemyCard.vue';
import { elemRow, monCountLabel, monWaveGroups } from './renders';
import type { MazeStageDetail } from '../../services/types';

/** 战斗看板的「推荐属性 + 敌方配置」块（敌方一律走敌方详情卡，ADR 0036）：场次身份与推荐属性
 *  通常由上方卡片行承担，故 `damage` / `showCount` 只由**没有卡片行**的调用方传——异相仲裁单关
 *  面板没有卡片行，推荐属性与「N 波 · M 敌」摘要都只能落在面板内。 */
const props = defineProps<{
  stage: MazeStageDetail;
  /** 该场次推荐属性（仅无卡片行的调用方传） */
  damage?: string[];
  /** 显示「N 波 · M 敌」摘要（层级看板的该统计随看板行头退场，ADR 0033 决策 11；异相仲裁保留） */
  showCount?: boolean;
}>();
</script>

<template>
  <div v-if="props.damage?.length || stage.monsters?.length || stage.invasion" class="nk-egd-floor__stage">
    <div v-if="props.damage?.length" class="nk-egd-floor__row">
      <span class="nk-egd-floor__label">推荐属性</span>
      <span class="nk-egd-floor__elems" v-html="elemRow(props.damage)"></span>
    </div>
    <div class="nk-egd-floor__row nk-egd-floor__row--mons">
      <span class="nk-egd-floor__label">敌方配置</span>
      <span
        v-if="props.showCount && monCountLabel(stage.monsters)"
        class="nk-egd-floor__moncount"
      >{{ monCountLabel(stage.monsters) }}</span>
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
