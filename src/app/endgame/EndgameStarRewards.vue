<script setup lang="ts">
import { computed } from 'vue';
import EndgameReward from './EndgameReward.vue';
import type { MazeStarReward } from '../../services/types';

/** 赛季级「星数奖励」阶梯（ADR 0051）：累计星数 → 该档奖励。
 *
 *  口径＝官方玩法说明：每达成 1 个挑战目标计 1 星（忘却之庭「印记星数」/ 虚构叙事
 *  「故事星数」，上限＝本期层数 × 3）；异相仲裁按 `label` 分两组（骑士星数 / 王棋星数）。
 *  档位由转换器按本期可达星数上限截断，前端不再过滤。
 *  `head` 挂赛季级头部（异相仲裁：段位徽章区块退场后头部留白给它），
 *  缺省作面板之后的赛季附录（其余三模式）。 */
const props = defineProps<{ items: MazeStarReward[]; head?: boolean }>();

/** 按口径分组（主模式只有一组，label 缺省） */
const groups = computed<[string, MazeStarReward[]][]>(() => {
  const out = new Map<string, MazeStarReward[]>();
  for (const r of props.items) {
    const key = r.label || '';
    out.set(key, [...(out.get(key) || []), r]);
  }
  return [...out.entries()];
});
</script>

<template>
  <section v-if="items.length" class="nk-egd-starrewards" :class="{ 'nk-egd-starrewards--head': head }">
    <header class="nk-egd-starrewards__head">
      <h2 class="nk-egd-starrewards__title">星数奖励 STAR REWARDS</h2>
      <span class="nk-egd-starrewards__note">每达成 1 个挑战目标计 1 星，累计达下列档位可领取</span>
    </header>
    <div v-for="[label, rows] in groups" :key="label" class="nk-egd-starrewards__group">
      <span v-if="label" class="nk-egd-head__label">{{ label }}</span>
      <EndgameReward v-for="r in rows" :key="`${label}-${r.star}`" :star="r.star" :items="r.items" />
    </div>
  </section>
</template>
