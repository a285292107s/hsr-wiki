<script setup lang="ts">
/**
 * 终局赛季详情 · 战意机制 + 赛季增益面板。
 * 战意（Fever）赛季主题机制 + 两阶段效果（官网"战意机制 / 战意效果"对应 SubMazeBuffList：
 * 机制 1 条 + 效果 2 条，仅虚构叙事 Fever 赛季）；赛季增益为当期环境效果
 * （记忆紊流/战意/坚防守备），作用于全赛季挑战（星启同样生效）。
 */
import { computed } from 'vue';
import { seasonThemeIconUrl } from '../catalog/pages/endgame';
import { buildEndgameSections, sectionIdxMap } from './sections';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import type { MazeBuffInfo, MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
}>();

/** 战意赛季主题机制（SubMazeBuffList：机制 1 条 + 效果 2 条，仅 Fever 赛季） */
const subBuffsMech = computed<MazeBuffInfo | null>(() => props.data.sub_buffs?.[0] || null);
const subBuffsEffects = computed<MazeBuffInfo[]>(() => props.data.sub_buffs?.slice(1) || []);
/** 赛季主题图标（theme_icon：虚构/末日每赛季主题图，赛季增益模块标题装饰） */
const seasonThemeIcon = computed(() => seasonThemeIconUrl(props.data.arts));
/** 板块编号（与吸顶条导航同源：sections.ts 单一事实源） */
const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [])));
</script>

<template>
  <!-- 战意机制（仅虚构叙事 Fever 赛季） -->
  <template v-if="modeKey === 'story' && subBuffsMech">
    <h2 id="egd-sub-buffs" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['sub-buffs'] }}</span>战意机制 FURY</h2>
    <div class="nk-egd-fury">
      <div class="nk-egd-fury__mech">
        <span class="nk-egd-fury__label">战意机制</span>
        <article class="nk-egd-buff">
          <div class="nk-egd-buff__head">
            <img v-if="subBuffsMech.icon" class="nk-egd-buff__icon" :src="buffIconUrl(subBuffsMech)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
            <h3 class="nk-egd-buff__name">{{ subBuffsMech.name }}</h3>
          </div>
          <p v-if="subBuffsMech.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(subBuffsMech)"></p>
        </article>
      </div>
      <div v-if="subBuffsEffects.length" class="nk-egd-fury__eff">
        <span class="nk-egd-fury__label">战意效果</span>
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

  <!-- 赛季增益：当期环境效果（记忆紊流/战意/坚防守备），作用于全赛季挑战（星启同样生效）。
       独立模块——与层级内 buff（关卡级）区分；peak 的王棋增益在王棋章节内展示，不在此处 -->
  <template v-if="modeKey !== 'peak' && data.buffs?.length">
    <h2 id="egd-buffs" class="nk-title">
      <img
        v-if="seasonThemeIcon"
        class="nk-egd-title-icon"
        :src="seasonThemeIcon"
        alt=""
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display='none'"
      >
      <span class="nk-title__idx">{{ sectionIdx['buffs'] }}</span>赛季增益 BUFFS
    </h2>
    <div class="nk-egd-buffs">
      <article
        v-for="(b, i) in data.buffs"
        :key="b.id"
        class="nk-egd-buff"
        :style="{ '--i': i }"
      >
        <div class="nk-egd-buff__head">
          <img v-if="b.icon" class="nk-egd-buff__icon" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
          <h3 class="nk-egd-buff__name">{{ b.name }}</h3>
        </div>
        <p v-if="b.desc" class="nk-egd-buff__desc" v-html="buffDescHtml(b)"></p>
      </article>
    </div>
  </template>
</template>