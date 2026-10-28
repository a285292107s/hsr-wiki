<script setup lang="ts">
import { computed } from 'vue';
import EndgameReward from './EndgameReward.vue';
import EndgameTargetRow from './EndgameTargetRow.vue';
import type { StarTierRow } from './renders';

import { translate } from '../i18n';

const t = translate;
const props = defineProps<{ rows: StarTierRow[]; hideLabel?: boolean }>();

const label = computed(() => {
  const targets = props.rows.flatMap((r) => r.targets);
  const name = targets.length > 0 && targets.every((x) => x.type === 'TOTAL_SCORE')
    ? translate('egd.starGoal') : translate('egd.challengeGoal');
  return translate('egd.starTierTitle', { name });
});

const hasPrism = computed(() => props.rows.some((r) => r.prism));

function badgeText(row: StarTierRow): string {
  if (row.prism) return t('egd.prismStar');
  if (row.starTo == null) return t('egd.accumStars', { n: row.star });
  return t('egd.accumStarsRange', { from: row.star, to: row.starTo });
}

function unitText(row: StarTierRow): string {
  if (row.prism || row.starTo == null) return '';
  return row.starStep != null && row.starStep > 1
    ? t('egd.accumStarsUnitStep', { step: row.starStep })
    : t('egd.accumStarsUnit');
}
</script>

<template>
  <div class="nk-egd-head__col nk-egd-tierlist">
    <span v-if="!hideLabel" class="nk-egd-head__label">{{ label }}</span>
    <ul class="nk-egd-tiers" :class="{ 'nk-egd-tiers--prism': hasPrism }">
      <li v-for="(row, i) in rows" :key="i" class="nk-egd-tier">
        <span class="nk-egd-tier__stars">
          <span class="nk-egd-tier__badge" :class="{ 'nk-egd-tier__badge--prism': row.prism }">
            {{ badgeText(row) }}
          </span>
          <span v-if="unitText(row)" class="nk-egd-tier__unit">{{ unitText(row) }}</span>
        </span>
        <span class="nk-egd-tier__cond">
          <EndgameTargetRow
            v-for="(t, k) in row.targets"
            :key="k"
            :item="t"
            :star="!row.prism && row.targets.length > 1"
          />
        </span>
        <span
          v-if="row.targets.length > 1"
          class="nk-egd-tier__brace"
          aria-hidden="true"
        ></span>
        <span class="nk-egd-tier__lead" aria-hidden="true"></span>
        <EndgameReward class="nk-egd-tier__reward" :items="row.items" />
      </li>
    </ul>
  </div>
</template>
