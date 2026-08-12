<script setup lang="ts">
/**
 * 终局赛季详情 · Hero 头（模式铭牌 + 赛季信息）。
 * 横幅（theme_banner：虚构/末日统一横幅语言）优先，无横幅时回退背景图
 * （maze 场景背景 / peak 图鉴横幅）——同一区域只保留一张主题大图。
 */
import { computed } from 'vue';
import {
  ENDGAME_MODES, MAZE_STATUS_CLASS, mazeStatus, mazeDateRange,
  seasonArtUrl, seasonBannerUrl, seasonHeroBgUrl,
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
/** 赛季图标（seasonArtUrl：赛季专属优先，玩法级默认兜底；无图/路径不匹配时空串不渲染） */
const seasonArt = computed(() => seasonArtUrl(props.data.arts));
/** 赛季横幅（theme_banner：虚构/末日/忘却之庭宣传 BANNER，Hero 右侧装饰；无字段不渲染） */
const seasonBanner = computed(() => seasonBannerUrl(props.data.arts));
/** 赛季 Hero 背景（maze=场景背景 / story=海报背景 / peak=图鉴横幅；boss 无大图不渲染） */
const seasonHeroBg = computed(() => seasonHeroBgUrl(props.data.arts));
const showBanner = computed(() => !!seasonBanner.value);
/** Hero 背景：仅当无横幅时回退使用（同区域双图叠加会重影，横幅优先避免 cover 裁切破构） */
const showHeroBg = computed(() => !!seasonHeroBg.value && !showBanner.value);
</script>

<template>
  <header class="nk-egd-hero">
    <img
      v-if="showHeroBg"
      class="nk-egd-hero__bg"
      :src="seasonHeroBg"
      alt=""
      aria-hidden="true"
      loading="lazy"
      @error="hideOnError"
    >
    <img
      v-if="showBanner"
      class="nk-egd-hero__banner"
      :src="seasonBanner"
      alt=""
      aria-hidden="true"
      loading="lazy"
      @error="hideOnError"
    >
    <div class="nk-egd-hero__plate">
      <span class="nk-egd-hero__emblem" v-html="modeInfo?.emblem || ''"></span>
      <img v-if="seasonArt" class="nk-egd-hero__art" :src="seasonArt" alt="" aria-hidden="true" @error="hideOnError">
    </div>
    <div class="nk-egd-hero__panel">
      <div class="nk-egd-hero__camp">{{ modeInfo?.label || modeKey }} · {{ modeInfo?.en || '' }}</div>
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