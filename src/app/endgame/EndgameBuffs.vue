<script setup lang="ts">
// 战意（Fever）赛季主题机制 + 两阶段效果（官网"战意机制 / 战意效果"对应 SubMazeBuffList：
// 机制 1 条 + 效果 2 条，仅虚构叙事 Fever 赛季）；赛季增益为当期环境效果（记忆紊流 / 战意），
// 与逐层已呈现的增益同文的不再复述（见 seasonBuffList）。
import { computed } from 'vue';
import { seasonThemeIconUrl } from '../catalog/pages/endgame';
import { buildEndgameSections, sectionIdxMap } from './sections';
import { FALLBACK_SYSTEM_NAME } from './guide';
import {
  BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl, seasonBuffList,
} from './renders';
import EndgameBuffGroup from './EndgameBuffGroup.vue';
import type { MazeBuffInfo, MazeListEntry } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  /** 该玩法的增益体系名（游戏内命名，来自 `endgame_guide.json`）；缺省回退站点工作名「赛季增益」 */
  systemName?: string;
  /** 选法说明（`3 条 · 每场战斗选 1 条`）；为空则不渲染该行 */
  systemLine?: string;
}>();

const subBuffsMech = computed<MazeBuffInfo | null>(() => props.data.sub_buffs?.[0] || null);
const subBuffsEffects = computed<MazeBuffInfo[]>(() => props.data.sub_buffs?.slice(1) || []);
const seasonBuffs = computed(() => seasonBuffList(props.data));
const seasonThemeIcon = computed(() => seasonThemeIconUrl(props.data.arts));
const systemTitle = computed(() => props.systemName || FALLBACK_SYSTEM_NAME);
/** 站点工作名只在体系名生效时降为次标；回退时主标题已是它，不再重复 */
const aliasTitle = computed(() => (props.systemName ? '赛季增益' : ''));
const sectionIdx = computed(
  () => sectionIdxMap(buildEndgameSections(props.data, props.modeKey, [], systemTitle.value)),
);
</script>

<template>
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

  <template v-if="seasonBuffs.length">
    <h2 id="egd-buffs" class="nk-title">
      <img
        v-if="seasonThemeIcon"
        class="nk-egd-title-icon"
        :src="seasonThemeIcon"
        alt=""
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display='none'"
      >
      <span class="nk-title__idx">{{ sectionIdx['buffs'] }}</span>{{ systemTitle }}<span v-if="aliasTitle" class="nk-egd-title-alias">{{ aliasTitle }}</span>
    </h2>
    <p v-if="systemLine" class="nk-egd-buffs__hint">{{ systemLine }}</p>
    <div class="nk-egd-groups">
      <EndgameBuffGroup :items="seasonBuffs" />
    </div>
  </template>
</template>