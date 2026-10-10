<script setup lang="ts">
import { computed } from 'vue';
import EndgameReward from './EndgameReward.vue';
import EndgameTargetRow from './EndgameTargetRow.vue';
import type { StarTierRow } from './renders';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 星级奖励列表（层 tab 与星启看板共用，ADR 0051 补记四）：**一档一行**，
 *  行内 = 档位徽章 + 该档条件（星级目标，逐目标一行）+ 该档奖励 chips，条件与奖励之间一条引导虚线。
 *  一档吃多个目标时（忘却之庭：3 星一档）条件块右侧加**跨越这些目标的括号**——括号把「这几个目标
 *  同属一档」写在版面上，奖励仍只一份（虚线也只有一条）。棱彩星档同形，徽章换「棱彩星」。 */
const props = defineProps<{ rows: StarTierRow[] }>();

/** 栏名按目标类型派生（与行内徽章口径一致）：全是分数档时官方口径是「星级目标」，
 *  含回合 / 减员档（忘却之庭）时是「挑战目标」。 */
const label = computed(() => {
  const targets = props.rows.flatMap((r) => r.targets);
  const name = targets.length > 0 && targets.every((x) => x.type === 'TOTAL_SCORE')
    ? translate('egd.starGoal') : translate('egd.challengeGoal');
  return translate('egd.starTierTitle', { name });
});
</script>

<template>
  <div class="nk-egd-head__col nk-egd-tierlist">
    <span class="nk-egd-head__label">{{ label }}</span>
    <ul class="nk-egd-tiers">
      <li v-for="(row, i) in rows" :key="i" class="nk-egd-tier">
        <span class="nk-egd-tier__badge" :class="{ 'nk-egd-tier__badge--prism': row.prism }">
          {{ row.prism ? t('egd.prismStar') : t('egd.accumStars', { n: row.star }) }}
        </span>
        <span class="nk-egd-tier__cond">
          <!-- 一档吃多个目标时逐目标标星（忘却之庭一层 3 目标 = 3 星推一档），见 EndgameTargetRow -->
          <EndgameTargetRow
            v-for="(t, k) in row.targets"
            :key="k"
            :item="t"
            :star="!row.prism && row.targets.length > 1"
          />
        </span>
        <!-- 括号：横跨这几个目标（只在本档吃多个目标时出现），右侧再接引导虚线到该档奖励 -->
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
