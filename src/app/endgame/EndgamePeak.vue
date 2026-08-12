<script setup lang="ts">
/**
 * 终局赛季详情 · 异相仲裁关卡组成面板（3 骑士试炼 + 1 王棋最终关，含绝境变体）。
 */
import { computed } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import {
  BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl,
  elemRow, monCountLabel, monWaveGroups, monTitle, peakTagsHtml, targetHtml,
} from './renders';
import { itemIconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import type { MazeListEntry, PeakLevelInfo } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  peakLevels: PeakLevelInfo[];
}>();

/** 板块编号（吸顶条导航同源；peak 分支固定 01） */
const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, 'peak', props.peakLevels)));
</script>

<template>
  <template v-if="peakLevels.length">
    <h2 id="egd-levels" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['levels'] || '01' }}</span>关卡组成 LEVELS</h2>
    <!-- 段位徽章：当期青铜/白银/黄金/彩钻勋章（ChallengeBadgeConfig） -->
    <div v-if="data.badges?.length" class="nk-egd-peak__badges">
      <div v-for="b in data.badges" :key="b.level" class="nk-egd-peak__badge" :title="b.desc || b.name">
        <img v-if="itemIconUrl(b.icon)" :src="itemIconUrl(b.icon)" :alt="b.name" loading="lazy" @error="($event.target as HTMLImageElement).classList.add('nk-img-error')">
        <span>{{ b.name }}</span>
      </div>
    </div>
    <div class="nk-egd-floors">
      <section
        v-for="(l, i) in peakLevels"
        :key="l.id"
        class="nk-egd-floor nk-egd-peak"
        :style="{ '--i': i }"
      >
        <!-- 章节头：骑士/王棋徽标 + 官方关卡名 + 等级 -->
        <header class="nk-egd-floor__head">
          <span class="nk-egd-peak__kind" :class="`nk-egd-peak__kind--${l.kind}`">
            {{ l.kind === 'king' ? '王棋' : '骑士' }}
          </span>
          <h3 class="nk-egd-floor__title">{{ l.name }}</h3>
          <span v-if="l.level" class="nk-egd-floor__data">
            <span class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ l.level }}</span>
              <span class="nk-egd-floor__datalabel">等级</span>
            </span>
          </span>
        </header>

        <!-- 推荐属性 + 敌方配置 -->
        <div class="nk-egd-floor__stage">
          <div v-if="l.damage?.length" class="nk-egd-floor__row">
            <span class="nk-egd-floor__label">推荐属性</span>
            <span class="nk-egd-floor__elems" v-html="elemRow(l.damage)"></span>
          </div>
          <div v-if="l.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
            <span class="nk-egd-floor__label">敌方配置</span>
            <span v-if="monCountLabel(l.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(l.monsters) }}</span>
            <span class="nk-egd-floor__monswrap">
              <span v-for="(g, gi) in monWaveGroups(l.monsters)" :key="gi" class="nk-egd-floor__wave">
                <span v-if="monWaveGroups(l.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                <span class="nk-egd-floor__mons">
                  <router-link
                    v-for="m in g.items"
                    :key="`${m.id}-${gi}`"
                    class="nk-egd-floor__monlink"
                    :to="`/monster/${m.tpl || m.id}`"
                    :title="monTitle(m)"
                    :aria-label="`查看 ${m.name} 详情`"
                  >
                    <img
                      class="nk-egd-floor__mon"
                      :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                      :alt="m.name"
                      loading="lazy"
                      @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                    >
                  </router-link>
                </span>
              </span>
            </span>
          </div>
        </div>

        <!-- 机制标签（如韧甲/反相/吸能） -->
        <div v-if="l.tags?.length" class="nk-egd-floor__tagsrow">
          <span class="nk-egd-floor__label">机制</span>
          <span class="nk-egd-floor__tags" v-html="peakTagsHtml(l.tags)"></span>
        </div>

        <!-- 挑战目标 -->
        <ol v-if="l.targets?.length" class="nk-egd-floor__targets">
          <li v-for="(t, ti) in l.targets" :key="ti" class="nk-egd-floor__target">
            <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
            <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
          </li>
        </ol>

        <!-- 王棋增益（出奇制胜/步骑协同/锤砧战术） -->
        <div v-if="l.buffs?.length" class="nk-egd-floor__buffs">
          <div v-for="b in l.buffs" :key="b.id" class="nk-egd-floor__buff">
            <div class="nk-egd-floor__buffhead">
              <img v-if="b.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
              <span class="nk-egd-floor__bufflabel">可用增益</span>
              <span class="nk-egd-floor__buffname">{{ b.name }}</span>
            </div>
            <p v-if="b.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(b)"></p>
          </div>
        </div>

        <!-- 王棋•绝境变体 -->
        <div v-if="l.hard" class="nk-egd-floor__hard">
          <div class="nk-egd-floor__hardhead">
            <span class="nk-egd-peak__kind nk-egd-peak__kind--hard">绝境</span>
            <span class="nk-egd-floor__hardname">{{ l.hard.name }}</span>
            <span v-if="l.hard.level" class="nk-egd-floor__data">
              <span class="nk-egd-floor__dataitem">
                <span class="nk-egd-floor__dataval">{{ l.hard.level }}</span>
                <span class="nk-egd-floor__datalabel">等级</span>
              </span>
            </span>
          </div>
          <div v-if="l.hard.monsters?.length" class="nk-egd-floor__row nk-egd-floor__row--mons">
            <span class="nk-egd-floor__label">敌方配置</span>
            <span v-if="monCountLabel(l.hard.monsters)" class="nk-egd-floor__moncount">{{ monCountLabel(l.hard.monsters) }}</span>
            <span class="nk-egd-floor__monswrap">
              <span v-for="(g, gi) in monWaveGroups(l.hard.monsters)" :key="gi" class="nk-egd-floor__wave">
                <span v-if="monWaveGroups(l.hard.monsters).length > 1" class="nk-egd-floor__wavelabel">第 {{ g.wave }} 波</span>
                <span class="nk-egd-floor__mons">
                  <router-link
                    v-for="m in g.items"
                    :key="`${m.id}-${gi}`"
                    class="nk-egd-floor__monlink"
                    :to="`/monster/${m.tpl || m.id}`"
                    :title="monTitle(m)"
                    :aria-label="`查看 ${m.name} 详情`"
                  >
                    <img
                      class="nk-egd-floor__mon"
                      :src="m.icon ? cdnUri('monstermiddleicon', `${m.icon}.webp`) : ''"
                      :alt="m.name"
                      loading="lazy"
                      @error="($event.target as HTMLImageElement).classList.add('nk-img-error')"
                    >
                  </router-link>
                </span>
              </span>
            </span>
          </div>
          <div v-if="l.hard.tags?.length" class="nk-egd-floor__tagsrow">
            <span class="nk-egd-floor__label">机制</span>
            <span class="nk-egd-floor__tags" v-html="peakTagsHtml(l.hard.tags)"></span>
          </div>
          <ol v-if="l.hard.targets?.length" class="nk-egd-floor__targets">
            <li v-for="(t, ti) in l.hard.targets" :key="ti" class="nk-egd-floor__target">
              <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
              <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </template>
</template>