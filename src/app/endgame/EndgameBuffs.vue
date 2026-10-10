<script setup lang="ts">
// 战意（Fever）赛季主题机制 + 两阶段效果（官网"战意机制 / 战意效果"对应 SubMazeBuffList：
// 机制 1 条 + 效果 2 条，仅虚构叙事 Fever 赛季）。
import { computed } from 'vue';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo, MazeListEntry } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

const subBuffsMech = computed<MazeBuffInfo | null>(() => props.data.sub_buffs?.[0] || null);
const subBuffsEffects = computed<MazeBuffInfo[]>(() => props.data.sub_buffs?.slice(1) || []);
</script>

<template>
  <template v-if="modeKey === 'story' && subBuffsMech">
    <h2 id="egd-sub-buffs" class="nk-title">{{ t('egd.buffs.title') }}</h2>
    <div class="nk-egd-fury">
      <div class="nk-egd-fury__mech">
        <span class="nk-egd-fury__label">{{ t('egd.buffs.mech') }}</span>
        <article class="nk-egd-buff">
          <div class="nk-egd-buff__head">
            <img v-if="subBuffsMech.icon" class="nk-egd-buff__icon" :src="buffIconUrl(subBuffsMech)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
            <h3 class="nk-egd-buff__name">{{ subBuffsMech.name }}</h3>
          </div>
          <p v-if="subBuffsMech.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(subBuffsMech)"></p>
        </article>
      </div>
      <div v-if="subBuffsEffects.length" class="nk-egd-fury__eff">
        <span class="nk-egd-fury__label">{{ t('egd.buffs.effect') }}</span>
        <div class="nk-egd-buffs">
          <article
            v-for="(b, i) in subBuffsEffects"
            :key="b.id"
            class="nk-egd-buff"
            :style="{ '--i': i + 1 }"
          >
            <div class="nk-egd-buff__head">
              <img v-if="b.icon" class="nk-egd-buff__icon" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
              <h3 class="nk-egd-buff__name">{{ b.name }}</h3>
            </div>
            <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
          </article>
        </div>
      </div>
    </div>
  </template>

</template>