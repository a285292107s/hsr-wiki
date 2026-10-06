<script setup lang="ts">
import { computed } from 'vue';
import EnemyCard from '../components/EnemyCard.vue';
import { elemRow, monCountLabel, monWaveGroups } from './renders';
import type { MazeBossGuide, MazeStageDetail, MazeStageInvasion } from '../../services/types';

/** 战斗看板的「推荐属性 + 敌方配置」块（敌方一律走敌方详情卡，ADR 0036）：场次身份与推荐属性
 *  通常由上方卡片行承担，故 `damage` / `showCount` 只由**没有卡片行**的调用方传——异相仲裁单关
 *  面板没有卡片行，推荐属性与「N 波 · M 敌」摘要都只能落在面板内。
 *  污染等级不再由面板头承载（用户裁决）：只挂到**被污染的那一只**敌方卡上。
 *  首领机制随敌方卡走：`guides` 是赛季级正文表，按敌方条目上的 `boss_guide` 指针取（末日幻影）。 */
const props = defineProps<{
  stage: MazeStageDetail;
  /** 该场次推荐属性（仅无卡片行的调用方传） */
  damage?: string[];
  /** 显示「N 波 · M 敌」摘要（层级看板的该统计随看板行头退场，ADR 0033 决策 11；异相仲裁保留） */
  showCount?: boolean;
  /** 污染名单（缺省取 `stage.invasion`；异相仲裁「绝境」变体与主关共用本关名单） */
  invasion?: MazeStageInvasion;
  /** 赛季级首领机制正文（仅末日幻影有；缺省即所有卡都无该分区） */
  guides?: Record<string, MazeBossGuide>;
}>();

/** 被污染敌方的实例 ID → 污染等级（与转换器 `_polluted_index` 同源：实例级精确匹配，
 *  未注册进本场次敌方配置的实例（末日幻影的被污染小怪）不在此列，它们只以召唤物形式出现）。 */
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
