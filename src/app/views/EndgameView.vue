<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { seasonPosterTabUrl } from '../catalog/pages/endgame';
import { SITE_NAME } from '../../lib/constants';
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
  loadLocalEndgameGuide,
} from '../../services/api';
import type {
  EndgameGuideDb, MazeListDb, MazeListEntry,
} from '../../services/types';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { seasonBuffSystemName } from '../endgame/guide';
import { buildLevelTabs, defaultLevelKey, type LevelTab } from '../endgame/levels';
import EndgameHero from '../endgame/EndgameHero.vue';
import EndgameBuffs from '../endgame/EndgameBuffs.vue';
import EndgameLevelTabs from '../endgame/EndgameLevelTabs.vue';
import EndgameLevelPanel from '../endgame/EndgameLevelPanel.vue';
import EndgameStarRewards from '../endgame/EndgameStarRewards.vue';
/* endgame-detail 拆分块：导入顺序即级联顺序（断点覆盖块在基础块后、排版收口块必须最后），不得乱序 */
import '../../styles/endgame-frame.css';
import '../../styles/endgame-panels.css';
import '../../styles/endgame-monsters.css';
import '../../styles/endgame-levels.css';
import '../../styles/endgame-breakpoints.css';
import '../../styles/endgame-pollution.css';
import '../../styles/endgame-type-scale.css';

const route = useRoute();

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


const MODE_LOADERS: Record<string, () => Promise<MazeListDb>> = {
  maze: loadLocalMazeList,
  story: loadLocalStoryList,
  boss: loadLocalBossList,
  peak: loadLocalPeakList,
};

const phase = ref<'loading' | 'error' | 'ready'>('loading');
const error = ref<string | null>(null);
const data = ref<MazeListEntry | null>(null);
const listDb = ref<MazeListDb | null>(null);
const seasonIndex = ref(-1);
const seasonKeys = ref<string[]>([]);
/** 玩法说明（endgame_guide.json）：体系名 / 条数 / 选法。缺省不阻塞页面——体系名回退站点工作名「赛季增益」 */
const guide = ref<EndgameGuideDb | null>(null);

const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');

async function load(mode: string, id: string): Promise<void> {
  const loader = MODE_LOADERS[mode];
  if (!loader) {
    phase.value = 'error';
    error.value = `未知的终局模式: ${mode}`;
    return;
  }
  phase.value = 'loading';
  error.value = null;
  try {
    const db = await loader();
    const keys = Object.keys(db);
    seasonKeys.value = keys;
    listDb.value = db;
    const entry = db[id];
    if (!entry || !entry.zh) {
      phase.value = 'error';
      error.value = `未找到赛季 ${mode}/${id}`;
      return;
    }
    data.value = entry;
    seasonIndex.value = keys.indexOf(id);
    document.title = `${entry.zh} - ${SITE_NAME}`;
    // 玩法说明同属「按需、不阻塞」：拿不到就回退站点工作名，不因此判页面失败
    loadLocalEndgameGuide()
      .then((g) => { guide.value = g; })
      .catch(() => { guide.value = null; });
    // 后台标签页 rAF 会被浏览器暂停导致永久骨架屏：visibility hidden 时用 setTimeout 兜底推进
    const settleReady = (): void => {
      phase.value = 'ready';
      pageRef.value?.scrollTo({ top: 0 });
      void nextTick(() => { refresh(); });
    };
    if (document.visibilityState === 'hidden') {
      setTimeout(settleReady, 0);
    } else {
      requestAnimationFrame(settleReady);
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    phase.value = 'error';
  }
}

function retry(): void {
  void load(String(route.params.mode || ''), String(route.params.id || ''));
}

onMounted(() => {
  void load(String(route.params.mode || ''), String(route.params.id || ''));
});
watch(
  () => [route.params.mode, route.params.id],
  ([mode, id]) => {
    if (mode && id) void load(String(mode), String(id));
  },
);

const modeKey = computed(() => String(route.params.mode || ''));

/** 增益体系名（按玩法取自 endgame_guide.json） */
const systemName = computed(() => seasonBuffSystemName(guide.value, modeKey.value));

/** 星数奖励阶梯的落位：异相仲裁挂赛季级头部（其段位徽章区块已退场，头部留白给它）；
 *  其余三模式按关卡切片落在层 tab 内（`EndgameFloor`），故这里只渲染头部形态 */
const starRewardsInHeader = computed(() => modeKey.value === 'peak');

/** 四个玩法的关卡都由子 tab 承载（ADR 0043）：层级模式 = 「第 1..N 层 / 星启模式」，
 *  异相仲裁 = 「骑士（一）… / 将杀王棋」。默认激活星启，无星启的模式激活首关（见 `defaultLevelKey`）。 */
const levelTabs = computed<LevelTab[]>(() => buildLevelTabs(data.value));
const activeLevel = ref('');
watch(
  levelTabs,
  (tabs) => {
    if (!tabs.some((t) => t.key === activeLevel.value)) activeLevel.value = defaultLevelKey(tabs);
  },
  { immediate: true },
);

function selectLevel(key: string): void {
  activeLevel.value = key;
  void nextTick(() => {
    document.getElementById('egd-level-tabs')?.scrollIntoView({
      block: 'start',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  });
}

const prevSeason = computed(() => {
  const i = seasonIndex.value;
  if (i <= 0 || !listDb.value) return null;
  const key = seasonKeys.value[i - 1];
  if (!key) return null;
  return { key, href: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});
const nextSeason = computed(() => {
  const i = seasonIndex.value;
  if (i < 0 || i >= seasonKeys.value.length - 1 || !listDb.value) return null;
  const key = seasonKeys.value[i + 1];
  if (!key) return null;
  return { key, href: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});

const pageRef = ref<HTMLElement | null>(null);
/** 固定条退场后（ADR 0043）本页没有区块导航：关卡定位由子 tab 承担，滚动定位只剩「返回顶部」圆钮 */
const NO_BLOCK_NAV: string[] = [];
const { showTop, scrollTop, refresh } = useScrollSpy(pageRef, () => NO_BLOCK_NAV, () => null);


onBeforeUnmount(() => {
  data.value = null;
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-egd" :data-mode="modeKey" :aria-busy="phase === 'loading'">
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--egd"
      role="status"
      aria-live="polite"
      aria-label="赛季详情加载中"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-egd-sk nk-sk--shimmer"></div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-sk--block-md"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-lg"></div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">赛季数据加载失败</div>
      <div v-if="error" class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="data">
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        aria-label="返回顶部"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <EndgameHero :data="data" :mode-key="modeKey" />

      <div class="nk-panels nk-egd-body">
        <div class="nk-egd-panel">
          <template v-if="levelTabs.length">
            <EndgameBuffs
              v-if="modeKey === 'story' && data.sub_buffs?.length"
              :data="data"
              :mode-key="modeKey"
            />

            <!-- 赛季级累计星数奖励阶梯（ADR 0051）：每达成 1 个挑战目标计 1 星。
                 异相仲裁无段位徽章区块（用户裁决），该阶梯挂赛季级头部（子 tab 之上）；
                 其余三模式按**关卡**切片，落在各自的层 tab 内（`EndgameFloor`） -->
            <EndgameStarRewards v-if="starRewardsInHeader" head :items="data.star_rewards || []" />

            <EndgameLevelTabs
              :tabs="levelTabs"
              :active="activeLevel"
              @select="selectLevel"
            />

            <EndgameLevelPanel
              :data="data"
              :mode-key="modeKey"
              :tabs="levelTabs"
              :active="activeLevel"
              :system-name="systemName"
            />
          </template>

          <div v-else class="nk-slot-empty">本赛季暂无关卡数据</div>

          <nav v-if="prevSeason || nextSeason" class="nk-egd-nav" aria-label="相邻赛季">
            <router-link
              v-if="prevSeason"
              class="nk-egd-nav__item nk-egd-nav__item--prev"
              :to="prevSeason.href"
            >
              <img
                v-if="prevSeason.posterTab"
                class="nk-egd-nav__thumb"
                :src="seasonPosterTabUrl({ poster_tab: prevSeason.posterTab })"
                alt=""
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'"
              >
              <span class="nk-egd-nav__body">
                <span class="nk-egd-nav__dir">← 上一赛季</span>
                <span class="nk-egd-nav__id">{{ prevSeason.key }}</span>
              </span>
            </router-link>
            <span v-else class="nk-egd-nav__item nk-egd-nav__item--void"></span>
            <router-link
              v-if="nextSeason"
              class="nk-egd-nav__item nk-egd-nav__item--next"
              :to="nextSeason.href"
            >
              <span class="nk-egd-nav__body">
                <span class="nk-egd-nav__dir">下一赛季 →</span>
                <span class="nk-egd-nav__id">{{ nextSeason.key }}</span>
              </span>
              <img
                v-if="nextSeason.posterTab"
                class="nk-egd-nav__thumb"
                :src="seasonPosterTabUrl({ poster_tab: nextSeason.posterTab })"
                alt=""
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display='none'"
              >
            </router-link>
          </nav>
        </div>
      </div>
    </template>
  </div>
</template>