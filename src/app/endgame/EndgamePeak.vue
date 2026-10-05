<script setup lang="ts">
import { computed } from 'vue';
import { buildEndgameSections, sectionIdxMap } from './sections';
import EndgameSummons from './EndgameSummons.vue';
import {
  BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl,
  elemRow, monCountLabel, monWaveGroups, monTitle, peakTagsHtml, targetHtml,
} from './renders';
import { itemIconUrl } from '../../lib/format';
import { cdnUri } from '../../services/cdn';
import { pollutionLabel } from './pollution';
import type { MazeListEntry, PeakLevelInfo } from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  peakLevels: PeakLevelInfo[];
  /** 增益体系名（异相仲裁 = 裁决象限；来自 `endgame_guide.json`，空串则不渲染该标签） */
  systemName?: string;
}>();

const sectionIdx = computed(
  () => sectionIdxMap(buildEndgameSections(props.data, 'peak', props.peakLevels, props.systemName)),
);
</script>

<template>
  <template v-if="peakLevels.length">
    <h2 id="egd-levels" class="nk-title"><span class="nk-title__idx">{{ sectionIdx['levels'] || '01' }}</span>关卡组成 LEVELS</h2>
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
        <header class="nk-egd-floor__head">
          <span class="nk-egd-peak__kind" :class="`nk-egd-peak__kind--${l.kind}`">
            {{ l.kind === 'king' ? '王棋' : '骑士' }}
          </span>
          <h3 class="nk-egd-floor__title">{{ l.name }}</h3>
          <span v-if="l.invasion" class="nk-egd-pollchip" :data-level="l.invasion.level">{{ pollutionLabel(l.invasion) }}</span>
          <span v-if="l.level" class="nk-egd-floor__data">
            <span class="nk-egd-floor__dataitem">
              <span class="nk-egd-floor__dataval">{{ l.level }}</span>
              <span class="nk-egd-floor__datalabel">等级</span>
            </span>
          </span>
        </header>

        <div class="nk-egd-peak__body nk-egd-children">

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
                    <span v-for="m in g.items" :key="`${m.id}-${gi}`" class="nk-egd-floor__moncell">
                      <router-link
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
                      <EndgameSummons :items="m.summons || []" />
                    </span>
                  </span>
                </span>
              </span>
            </div>
          </div>

          <div v-if="l.tags?.length" class="nk-egd-floor__tagsrow">
            <span class="nk-egd-floor__label">机制</span>
            <span class="nk-egd-floor__tags" v-html="peakTagsHtml(l.tags)"></span>
          </div>

          <ol v-if="l.targets?.length" class="nk-egd-floor__targets">
            <li v-for="(t, ti) in l.targets" :key="ti" class="nk-egd-floor__target">
              <span class="nk-egd-floor__targetidx">{{ String(ti + 1).padStart(2, '0') }}</span>
              <span class="nk-egd-floor__targettext" v-html="targetHtml(t)"></span>
            </li>
          </ol>

          <div v-if="l.buffs?.length" class="nk-egd-floor__buffs">
            <!-- 王棋关卡增益的体系名（游戏内「裁决象限」，取自 endgame_guide.json；缺省回退站点工作名） -->
            <div v-if="systemName" class="nk-egd-floor__label">{{ systemName }}</div>
            <div v-for="b in l.buffs" :key="b.id" class="nk-egd-floor__buff">
              <div class="nk-egd-floor__buffhead">
                <img v-if="b.icon" class="nk-egd-buff__icon nk-egd-buff__icon--sm" :src="buffIconUrl(b)" alt="" loading="lazy" @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK">
                <span class="nk-egd-floor__buffname">{{ b.name }}</span>
              </div>
              <p v-if="b.desc" class="nk-egd-floor__buffdesc" v-html="buffDescHtml(b)"></p>
            </div>
          </div>

          <div v-if="l.hard" class="nk-egd-floor__hard nk-egd-children">
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
                    <span v-for="m in g.items" :key="`${m.id}-${gi}`" class="nk-egd-floor__moncell">
                      <router-link
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
                      <EndgameSummons :items="m.summons || []" />
                    </span>
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

        </div>
      </section>
    </div>
  </template>
</template>