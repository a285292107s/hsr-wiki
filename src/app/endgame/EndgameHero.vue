<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ENDGAME_MODES, MAZE_STATUS_CLASS, mazeStatus, mazeDateRange,
  modeDefaultArtUrl, seasonBannerUrl, seasonHeroBgUrl,
} from '../catalog/pages/endgame';
import { hideOnError } from './renders';
import type { MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

const modeInfo = computed(() => ENDGAME_MODES.find((m) => m.key === props.modeKey));
const status = computed(() => mazeStatus(props.data));
const statusClass = computed(() => MAZE_STATUS_CLASS[status.value] || 'unknown');
const dateRange = computed(() => mazeDateRange(props.data));
/** 玩法级默认图标（modeDefaultArtUrl：统一用玩法入口默认图，抛弃每季 arts.tab 页签图——
 *  4 类玩法图标恒定不随新赛季漂移，规避 jsDelivr fork 冻结后的新赛季破图残留；空串不渲染）。
 *  徽标盘**只放这一张官方图标**：自绘的 `EMBLEMS` 圆环曾叠在它上面，读起来像「图标上又盖了一个
 *  默认图标」，已删（用户裁决）。 */
const seasonArt = computed(() => modeDefaultArtUrl(props.modeKey));
const seasonBanner = computed(() => seasonBannerUrl(props.data.arts));
const seasonHeroBg = computed(() => seasonHeroBgUrl(props.data.arts));
/** Hero 背景：赛季 banner 存在时用它（**左右翻转**后铺底，见 CSS `--flip`），否则回退赛季大图
 *  （maze `background` / story `theme_bg` / peak `handbook_banner`）。 */
const heroBg = computed(() => seasonBanner.value || seasonHeroBg.value);
/** banner 的画面重心在右（原先挂在右缘当画框），铺成整幅背景时要**左右翻转**，
 *  否则重心与右侧内容列打架；赛季大图不翻。 */
const flipHeroBg = computed(() => !!seasonBanner.value);
</script>

<template>
  <header class="nk-egd-hero">
    <img
      v-if="heroBg"
      class="nk-egd-hero__bg"
      :class="{ 'nk-egd-hero__bg--flip': flipHeroBg }"
      :src="heroBg"
      alt=""
      aria-hidden="true"
      loading="lazy"
      @error="hideOnError"
    >
    <div class="nk-egd-hero__plate">
      <img v-if="seasonArt" class="nk-egd-hero__art" :src="seasonArt" alt="" aria-hidden="true" @error="hideOnError">
    </div>
    <div class="nk-egd-hero__panel">
      <div class="nk-egd-hero__camp">
        <span>{{ modeInfo?.label || modeKey }} · {{ modeInfo?.en || '' }}</span>
        <RouterLink class="nk-guide-link" :to="`/endgame/${modeKey}`" :aria-label="`${modeInfo?.label || modeKey}玩法说明`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19"/></svg>
          玩法说明
        </RouterLink>
      </div>
      <h1 class="nk-egd-hero__name">{{ data.zh }}</h1>
      <div class="nk-egd-hero__meta">
        <span
          class="nk-egd-hero__status"
          :class="`nk-egd-hero__status--${statusClass}`"
        >{{ status }}</span>
        <span v-if="dateRange" class="nk-egd-hero__date">{{ dateRange }}</span>
        <span class="nk-egd-hero__sid" :title="`赛季编号 ${data.id}`">No.{{ data.id }}</span>
      </div>
    </div>
  </header>
</template>