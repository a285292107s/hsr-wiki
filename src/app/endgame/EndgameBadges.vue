<script setup lang="ts">
import { computed } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import { itemIconUrl } from '../../lib/format';
import type { MazeBadgeInfo, MazeListEntry } from '../../services/types';

/** 赛季级「段位徽章」区块（异相仲裁专属字段 `badges`：青铜/白银/黄金/彩钻四段，按期分组、
 *  部分期缺省）：徽章是赛季成就而非某一关的属性，故不进关卡面板。 */
const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

const badges = computed<MazeBadgeInfo[]>(() => props.data.badges || []);
const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey)));
</script>

<template>
  <template v-if="badges.length">
    <h2 id="egd-badges" class="nk-title">
      <span class="nk-title__idx">{{ sectionIdx['badges'] }}</span>段位徽章 MEDALS
    </h2>
    <div class="nk-egd-badges">
      <span
        v-for="b in badges"
        :key="b.level"
        class="nk-egd-badges__item"
        :title="b.desc || b.name"
      >
        <img
          v-if="itemIconUrl(b.icon)"
          :src="itemIconUrl(b.icon)"
          :alt="b.name"
          loading="lazy"
          @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
        >
        <span class="nk-egd-badges__name">{{ b.name }}</span>
      </span>
    </div>
  </template>
</template>
