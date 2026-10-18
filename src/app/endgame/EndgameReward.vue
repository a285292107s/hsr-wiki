<script setup lang="ts">
import { computed, watch } from 'vue';
import { itemIconUrl, fmtNumber } from '../../lib/format';
import { ensureRewardItemMap, rewardItemMap } from './renders';
import type { MazeRewardItem } from '../../services/types';

/** 奖励条目（层 / 星启面板底部奖励板的「通关奖励」栏与赛季「星数奖励」每档共用）：
 *  物品 id 经 items.json 单例（`loadLocalItems`）映射名称与图标，
 *  查不到时名称回退 `#id`、图标位退化为占位块（不破图）。
 *  id → 名称/图标的映射**提到 `renders.ts` 的模块级共享**（本组件每档一个实例，
 *  原先每实例各建一份全量 Map）。 */
const props = defineProps<{
  items: MazeRewardItem[];
  /** 栏名（缺省不渲染栏名行） */
  label?: string;
  /** 栏名旁的补充口径（星启用：通关目标分数） */
  goal?: string;
  /** 星数档位（星数奖励阶梯每行用；缺省不渲染星标） */
  star?: number;
}>();

watch(
  () => props.items,
  (list) => {
    if (!list.length) return;
    void ensureRewardItemMap();
  },
  { immediate: true },
);

const rows = computed(() => props.items.map((r) => ({
  id: r.id,
  num: r.num,
  ...(rewardItemMap.value.get(r.id) || { name: `#${r.id}`, icon: '' }),
})));
</script>

<template>
  <div class="nk-egd-reward" :class="{ 'nk-egd-reward--row': star != null }">
    <div v-if="label || goal" class="nk-egd-reward__head">
      <span class="nk-egd-head__label">{{ label }}</span>
      <span v-if="goal" class="nk-egd-reward__goal">{{ goal }}</span>
    </div>
    <div class="nk-egd-reward__items">
      <span v-if="star != null" class="nk-egd-reward__star">{{ star }}★</span>
      <span v-for="r in rows" :key="r.id" class="nk-egd-reward__item">
        <img
          v-if="r.icon"
          class="nk-egd-reward__icon"
          :src="itemIconUrl(r.icon)"
          :alt="r.name"
          :title="r.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
        <span v-else class="nk-egd-reward__icon nk-egd-reward__icon--void">{{ String(r.id).slice(0, 2) }}</span>
        <span class="nk-egd-reward__name">{{ r.name }}</span>
        <span v-if="r.num" class="nk-egd-reward__num">×{{ fmtNumber(r.num) }}</span>
      </span>
    </div>
  </div>
</template>
