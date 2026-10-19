<script setup lang="ts">
import { computed } from 'vue';
import EndgameReward from './EndgameReward.vue';
import EndgameClearCondition from './EndgameClearCondition.vue';
import EndgameStarTierList from './EndgameStarTierList.vue';
import EndgameTargetRow from './EndgameTargetRow.vue';
import EndgameSeasonRewardGroup from './EndgameSeasonRewardGroup.vue';
import { seasonRewardPlan } from './season-rewards';
import type { MazeListEntry } from '../../services/types';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{ data: MazeListEntry }>();

const plan = computed(() => seasonRewardPlan(props.data));

const conditionsLabel = computed(() => {
  const targets = plan.value.conditions || [];
  const allScore = targets.length > 0 && targets.every((target) => target.type === 'TOTAL_SCORE');
  return t(allScore ? 'egd.starGoal' : 'egd.challengeGoal');
});
</script>

<template>
  <section
    v-if="plan.uniform || plan.groups.length"
    id="egd-season-rewards"
    class="nk-egd-season"
    aria-labelledby="egd-season-rewards-title"
  >
    <h2 id="egd-season-rewards-title" class="nk-egd-season__title">{{ t('egd.seasonRewards') }}</h2>
    <template v-if="plan.uniform">
      <div class="nk-egd-season-shared">
        <div class="nk-egd-season-group__clear">
          <EndgameClearCondition v-if="plan.clear?.rules.length" :rows="plan.clear.rules" />
          <div v-if="plan.clear?.items.length" class="nk-egd-season-group__rewards">
            <span class="nk-egd-head__label">{{ t('egd.rewards') }}</span>
            <EndgameReward :items="plan.clear.items" />
          </div>
        </div>
        <p class="nk-egd-season__note">
          {{ t('egd.rewardScope', { from: plan.floorFrom, to: plan.floorTo }) }}
        </p>
        <div class="nk-egd-season-flat">
          <div class="nk-egd-season-flat__conditions">
            <span class="nk-egd-head__label">{{ conditionsLabel }}</span>
            <EndgameTargetRow
              v-for="(target, i) in (plan.conditions || [])"
              :key="i"
              :item="target"
              :star="(plan.conditions?.length || 0) > 1"
            />
          </div>
          <div class="nk-egd-season-flat__ladder">
            <span class="nk-egd-head__label">{{ t('egd.starRewards') }}</span>
            <EndgameStarTierList :rows="plan.ladder || []" hide-label />
          </div>
        </div>
      </div>
      <EndgameSeasonRewardGroup v-if="plan.tierce" :group="plan.tierce" />
    </template>
    <template v-else>
      <EndgameSeasonRewardGroup v-for="group in plan.groups" :key="group.key" :group="group" />
    </template>
  </section>
</template>
