<script setup lang="ts">
import { computed } from 'vue';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import { monsterIconUrl, refsResolved } from '../../lib/format';
import { buildEndgameSections, sectionIdxMap } from './sections';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from './renders';
import { pollutionEntries, pollutionLabel, pollutionPosition } from './pollution';
import type {
  MazeBuffInfo, MazeListEntry, VoracityInvasionLevel,
} from '../../services/types';

const props = defineProps<{
  data: MazeListEntry;
  modeKey: string;
  /** 污染等级词条（voracity.json 的 invasion.levels：描述 + 图标；经 EndgameView 按需加载） */
  levels: VoracityInvasionLevel[];
}>();

const sectionIdx = computed(() => sectionIdxMap(buildEndgameSections(props.data, props.modeKey)));

const entries = computed(() => pollutionEntries(props.data));

/** 本季实际出现的等级（升序），词条只列出现过的档位 */
const presentLevels = computed<VoracityInvasionLevel[]>(() => {
  const used = new Set(entries.value.map((e) => e.invasion.level));
  return [...props.levels]
    .filter((l) => used.has(l.invasion_id))
    .sort((a, b) => a.invasion_id - b.invasion_id);
});

/** 等级描述：MazeBuff 3034001–03 的 BuffName/BuffDesc 在 TextMapCHS 缺失，
 *  上游只有 InvasionDesc 可展示；#N 占位符缺参时整段省略（不硬列无标签数值）。 */
const levelViews = computed(() => presentLevels.value.map((l) => {
  const buff: MazeBuffInfo = {
    id: l.maze_buff_id ?? l.invasion_id,
    name: '',
    desc: l.desc,
    param_list: l.param_list,
    icon: l.icon,
  };
  return { ...l, buff, html: refsResolved(l.desc, l.param_list) ? buffDescHtml(buff) : '' };
}));

/** 污染怪物的详情页跳转键：详情文件按模板 ID 命名（无 tpl 时回退实例 ID） */
function monsterHref(m: { id: string; tpl?: string }): string {
  return `/monster/${m.tpl || m.id}`;
}
</script>

<template>
  <template v-if="entries.length">
    <h2 id="egd-pollution" class="nk-title">
      <span class="nk-title__idx">{{ sectionIdx['pollution'] }}</span>污染等级 CONTAMINATION
    </h2>
    <div class="nk-egd-poll">
      <div v-if="levelViews.length" class="nk-egd-poll__levels">
        <article v-for="l in levelViews" :key="l.invasion_id" class="nk-egd-poll__level">
          <header class="nk-egd-poll__levelhead">
            <img
              v-if="l.icon"
              class="nk-egd-poll__levelicon"
              :src="buffIconUrl(l.buff)"
              alt=""
              loading="lazy"
              @error="($event.target as HTMLImageElement).src = BUFF_ICON_FALLBACK"
            >
            <span class="nk-egd-poll__levelno">{{ pollutionLabel({ level: l.invasion_id }) }}</span>
            <span v-if="l.binding" class="nk-egd-code">{{ l.binding }}</span>
          </header>
          <p v-if="l.html" class="nk-egd-poll__leveldesc" v-html="l.html"></p>
        </article>
      </div>

      <ul class="nk-egd-poll__list">
        <li v-for="(e, i) in entries" :key="`${e.half}-${e.floor ?? ''}-${i}`" class="nk-egd-poll__item">
          <span class="nk-egd-poll__pos">{{ pollutionPosition(e) }}</span>
          <span class="nk-egd-poll__badge" :data-level="e.invasion.level">{{ pollutionLabel(e.invasion) }}</span>
          <span v-if="e.invasion.monsters?.length" class="nk-egd-poll__mons">
            <span class="nk-egd-poll__monslabel">被污染怪物</span>
            <router-link
              v-for="m in e.invasion.monsters"
              :key="m.id"
              class="nk-egd-poll__mon"
              :to="monsterHref(m)"
              :title="m.name"
            >
              <img
                v-if="m.icon"
                class="nk-egd-poll__monicon"
                :src="monsterIconUrl(m.icon)"
                :alt="m.name"
                loading="lazy"
                :data-cdn-fallback="cdnFallbackFromPrimary(monsterIconUrl(m.icon)) || undefined"
              >
              <span class="nk-egd-poll__monname">{{ m.name }}</span>
            </router-link>
          </span>
        </li>
      </ul>

      <p class="nk-egd-poll__more">
        <router-link class="nk-egd-poll__link" to="/voracity">查看「贪饕」污染专题 →</router-link>
      </p>
    </div>
  </template>
</template>
