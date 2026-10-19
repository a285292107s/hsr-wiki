<script setup lang="ts">
import EndgameReward from './EndgameReward.vue';
import EndgameClearCondition from './EndgameClearCondition.vue';
import EndgameStarTierList from './EndgameStarTierList.vue';
import type { SeasonRewardGroup } from './season-rewards';

import { translate } from '../i18n';

const t = translate;
defineProps<{ group: SeasonRewardGroup }>();
</script>

<template>
  <div class="nk-egd-season-group">
    <h3 class="nk-egd-season-group__title">{{ group.label }}</h3>
    <div class="nk-egd-season-group__body">
      <div v-if="group.rules.length || group.items.length" class="nk-egd-season-group__clear">
        <EndgameClearCondition v-if="group.rules.length" :rows="group.rules" />
        <div v-if="group.items.length" class="nk-egd-season-group__rewards">
          <span class="nk-egd-head__label">{{ t('egd.rewards') }}</span>
          <EndgameReward :items="group.items" />
        </div>
      </div>
      <div v-if="group.rows.length" class="nk-egd-season-group__stars">
        <EndgameStarTierList :rows="group.rows" hide-label />
      </div>
    </div>
  </div>
</template>
