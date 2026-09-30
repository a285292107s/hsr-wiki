<script setup lang="ts">
import { computed } from 'vue';
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
 *  4 类玩法图标恒定不随新赛季漂移，规避 jsDelivr fork 冻结后的新赛季破图残留；空串不渲染） */
const seasonArt = computed(() => modeDefaultArtUrl(props.modeKey));
const seasonBanner = computed(() => seasonBannerUrl(props.data.arts));
const seasonHeroBg = computed(() => seasonHeroBgUrl(props.data.arts));
const showBanner = computed(() => !!seasonBanner.value);
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