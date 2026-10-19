<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  ENDGAME_MODES, MAZE_STATUS_CLASS, mazeStatus, mazeStatusLabelKey, mazeDateRange,
  modeDefaultArtUrl, seasonBannerUrl, seasonHeroBgUrl,
} from '../catalog/pages/endgame';
import { hideOnError } from './renders';
import type { MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

const modeInfo = computed(() => ENDGAME_MODES.find((m) => m.key === props.modeKey));
const { t } = useI18n();
const modeLabel = computed(() => (modeInfo.value ? t(modeInfo.value.labelKey) : props.modeKey));
const status = computed(() => mazeStatus(props.data));
const statusClass = computed(() => MAZE_STATUS_CLASS[status.value] || 'unknown');
const statusLabel = computed(() => t(mazeStatusLabelKey(status.value)));
const dateRange = computed(() => mazeDateRange(props.data));
const showStatus = computed(() => status.value !== 'unknown');
const scaleLabel = computed(() => {
  const floors = (props.data.floor_details || []).length;
  if (floors) return t('egm.value.floors', { n: floors });
  const levels = (props.data.levels || []).length;
  if (levels) return t('vor.stageCount', { n: levels }, levels);
  return '';
});
const seasonArt = computed(() => modeDefaultArtUrl(props.modeKey));
const seasonBanner = computed(() => seasonBannerUrl(props.data.arts));
const seasonHeroBg = computed(() => seasonHeroBgUrl(props.data.arts));
const heroBg = computed(() => seasonBanner.value || seasonHeroBg.value);
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
        <span>{{ modeLabel }} · {{ modeInfo?.en || '' }}</span>
        <RouterLink class="nk-guide-link" :to="`/endgame/${modeKey}`" :aria-label="t('catalog.modeGuideAria', { name: modeLabel })">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19"/></svg>
          {{ t('egd.guideLabel') }}
        </RouterLink>
      </div>
      <h1 class="nk-egd-hero__name">{{ data.zh }}</h1>
      <div class="nk-egd-hero__meta">
        <span
          v-if="showStatus"
          class="nk-egd-hero__status"
          :class="`nk-egd-hero__status--${statusClass}`"
        >{{ statusLabel }}</span>
        <span v-if="dateRange" class="nk-egd-hero__date">{{ dateRange }}</span>
        <span v-if="scaleLabel" class="nk-egd-hero__scale">{{ scaleLabel }}</span>
        <span class="nk-egd-hero__sid" :title="t('egd.seasonId', { id: data.id })">No.{{ data.id }}</span>
      </div>
    </div>
  </header>
</template>