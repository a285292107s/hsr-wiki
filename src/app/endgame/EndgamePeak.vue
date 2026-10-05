<script setup lang="ts">
import StageContent from './StageContent.vue';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl, peakTagsHtml, targetHtml } from './renders';
import { pollutionLabel } from './pollution';
import type { PeakLevelInfo } from '../../services/types';

/** 异相仲裁单关面板（由关卡子 tab 切换，一次只渲染一关）：关卡身份（关卡名）由激活的 tab 承担，
 *  面板头只留类别胶囊 + 污染等级徽标 + 敌方等级（该关独有、tab 上读不到的字段）；
 *  推荐属性与敌方配置走共享件 `StageContent`（敌方一律敌方详情卡，与末日幻影层看板同口径）。 */
defineProps<{
  level: PeakLevelInfo;
  /** 增益体系名（异相仲裁 = 裁决象限；来自 `endgame_guide.json`，空串则不渲染该标签） */
  systemName?: string;
}>();
</script>

<template>
  <section class="nk-egd-floor nk-egd-peak">
    <header class="nk-egd-floor__head">
      <span class="nk-egd-peak__kind" :class="`nk-egd-peak__kind--${level.kind}`">
        {{ level.kind === 'king' ? '王棋' : '骑士' }}
      </span>
      <span v-if="level.invasion" class="nk-egd-pollchip" :data-level="level.invasion.level">{{ pollutionLabel(level.invasion) }}</span>
      <span v-if="level.level" class="nk-egd-floor__data">
        <span class="nk-egd-floor__dataitem">
          <span class="nk-egd-floor__dataval">{{ level.level }}</span>
          <span class="nk-egd-floor__datalabel">等级</span>
        </span>
      </span>
    </header>

    <div class="nk-egd-peak__body nk-egd-children">

      <!-- 推荐属性 / 敌方配置走共享件（敌方详情卡，与末日幻影层看板同一渲染口径）：
           异相仲裁没有卡片行，故推荐属性与「N 波 · M 敌」摘要由调用方显式传入 -->
      <StageContent :stage="level" :damage="level.damage" show-count />

      <div v-if="level.tags?.length" class="nk-egd-floor__tagsrow">
        <span class="nk-egd-floor__label">机制</span>
        <span class="nk-egd-floor__tags" v-html="peakTagsHtml(level.tags)"></span>
      </div>

      <ol v-if="level.targets?.length" class="nk-egd-floor__targets">
        <li v-for="(t, ti) in level.targets" :key="ti" class="nk-egd-floor__target">
          <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
          <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
        </li>
      </ol>

      <div v-if="level.buffs?.length" class="nk-egd-floor__buffs">
        <!-- 王棋关卡增益的体系名（游戏内「裁决象限」，取自 endgame_guide.json） -->
        <div v-if="systemName" class="nk-egd-floor__label">{{ systemName }}</div>
        <div v-for="b in level.buffs" :key="b.id" class="nk-egd-floor__buff">
          <div class="nk-egd-floor__buffhead">
            <img v-if="b.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
            <span class="nk-egd-floor__buffname">{{ b.name }}</span>
          </div>
          <p v-if="b.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(b)"></p>
        </div>
      </div>

      <div v-if="level.hard" class="nk-egd-floor__hard nk-egd-children">
        <div class="nk-egd-floor__hardhead">
          <span class="nk-egd-peak__kind nk-egd-peak__kind--hard">绝境</span>
          <span class="nk-egd-floor__hardname">{{ level.hard.name }}</span>
          <span v-if="level.hard.level" class="nk-egd-floor__data">
            <span class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ level.hard.level }}</span>
              <span class="nk-egd-floor__datalabel">等级</span>
            </span>
          </span>
        </div>
        <StageContent :stage="level.hard" show-count />
        <div v-if="level.hard.tags?.length" class="nk-egd-floor__tagsrow">
          <span class="nk-egd-floor__label">机制</span>
          <span class="nk-egd-floor__tags" v-html="peakTagsHtml(level.hard.tags)"></span>
        </div>
        <ol v-if="level.hard.targets?.length" class="nk-egd-floor__targets">
          <li v-for="(t, ti) in level.hard.targets" :key="ti" class="nk-egd-floor__target">
            <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
            <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
          </li>
        </ol>
      </div>

    </div>
  </section>
</template>
