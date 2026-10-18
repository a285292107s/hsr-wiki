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
/** 模式展示名（官方玩法名，词典键解析） */
const modeLabel = computed(() => (modeInfo.value ? t(modeInfo.value.labelKey) : props.modeKey));
const status = computed(() => mazeStatus(props.data));
const statusClass = computed(() => MAZE_STATUS_CLASS[status.value] || 'unknown');
/** 状态文案走词典（`endgame.status.*`，13 语言包齐备）：Hero 曾直接渲染裸枚举（DOM 文本 `live`），
 *  与目录页 `mazeStatusLabelKey` 的口径分叉（枚举恒为 live/ended/upcoming/unknown，键必命中）。 */
const statusLabel = computed(() => t(mazeStatusLabelKey(status.value)));
const dateRange = computed(() => mazeDateRange(props.data));
/** 无排期的期不挂状态徽章（与目录卡同判据，见 catalog/pages/endgame.ts:217 的 `st !== 'unknown'`）：
 *  `mazeStatus` 只在 `live_begin/begin/live_end/end` **全缺**时返回 unknown，故 `unknown` ⟺ 无排期。
 *  异相仲裁（peak）全期无排期 ⇒ 此前每期都在 Hero 上挂一个「未知」徽章，属无信息噪声。 */
const showStatus = computed(() => status.value !== 'unknown');
/** 本季规模读数（P2：赛季页此前首屏不给「这期多大」，13 个关架子 tab 的定位成本全靠扫）。
 *  判据与玩法页「结构口径」同源：层级模式取 `floor_details`（层），异相仲裁取 `levels`（关）；
 *  星启附加关不计入层数（它不是「层」，在子 tab 里单独一档）。无数据则不渲染，不写占位。 */
const scaleLabel = computed(() => {
  const floors = (props.data.floor_details || []).length;
  if (floors) return t('egm.value.floors', { n: floors });
  const levels = (props.data.levels || []).length;
  if (levels) return t('vor.stageCount', { n: levels }, levels);
  return '';
});
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