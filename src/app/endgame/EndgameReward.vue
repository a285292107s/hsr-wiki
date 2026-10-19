<script setup lang="ts">
import { computed, watch } from 'vue';
import { itemIconUrl, fmtNumber } from '../../lib/format';
import { ensureRewardItemMap, rewardItemMap } from './renders';
import type { MazeRewardItem } from '../../services/types';

const props = defineProps<{
  items: MazeRewardItem[];
  label?: string;
  goal?: string;
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
          alt=""
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
