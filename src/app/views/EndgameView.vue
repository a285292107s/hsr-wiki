<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { userErrorDetail } from '../../lib/errors';
import { useRoute } from 'vue-router';
import { ENDGAME_MODES, seasonPosterTabUrl } from '../catalog/pages/endgame';
import { pageTitle } from '../seo';
import {
  loadLocalMazeList, loadLocalStoryList, loadLocalBossList, loadLocalPeakList,
  loadLocalEndgameGuide,
} from '../../services/api';
import type {
  EndgameGuideDb, MazeBuffInfo, MazeListDb, MazeListEntry,
} from '../../services/types';
import { useDelayedSkeleton } from '../composables/use-delayed-skeleton';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { fallbackSystemName, seasonBuffSystemName } from '../endgame/guide';
import { buildLevelTabs, defaultLevelKey, type LevelTab } from '../endgame/levels';
import { seasonBuffList, seasonNodeBuff } from '../endgame/renders';
import EndgameHero from '../endgame/EndgameHero.vue';
import EndgameBuffGroup from '../endgame/EndgameBuffGroup.vue';
import EndgameBuffs from '../endgame/EndgameBuffs.vue';
import EndgameFloorBuff from '../endgame/EndgameFloorBuff.vue';
import EndgameLevelTabs from '../endgame/EndgameLevelTabs.vue';
import EndgameLevelPanel from '../endgame/EndgameLevelPanel.vue';
import EndgameSeasonRewards from '../endgame/EndgameSeasonRewards.vue';
import '../../styles/endgame-frame.css';
import '../../styles/endgame-panels.css';
import '../../styles/endgame-monsters.css';
import '../../styles/endgame-levels.css';
import '../../styles/endgame-breakpoints.css';
import '../../styles/endgame-pollution.css';
import '../../styles/endgame-type-scale.css';
import { translate } from '../i18n';

const t = translate;

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
const guide = ref<EndgameGuideDb | null>(null);

const showSkeleton = useDelayedSkeleton(() => phase.value === 'loading');

async function load(mode: string, id: string): Promise<void> {
  const loader = MODE_LOADERS[mode];
  if (!loader) {
    phase.value = 'error';
    error.value = t('egd.unknownMode', { mode });
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
    const modeInfo = ENDGAME_MODES.find((m) => m.key === mode);
    const modeName = modeInfo ? t(modeInfo.labelKey) : mode;
    if (!entry) {
      phase.value = 'error';
      error.value = t('egd.seasonNotFound', { mode: modeName, id });
      return;
    }
    data.value = entry;
    seasonIndex.value = keys.indexOf(id);
    document.title = pageTitle(`${entry.zh || `No.${id}`} - ${modeName}`);
    loadLocalEndgameGuide()
      .then((g) => { guide.value = g; })
      .catch(() => { guide.value = null; });
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
    error.value = userErrorDetail(e);
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

const unpublished = computed(() => Boolean(data.value && !data.value.zh));

const systemName = computed(() => seasonBuffSystemName(guide.value, modeKey.value));

const seasonBuffs = computed(() => (data.value ? seasonBuffList(data.value) : []));

const hoistedNodeBuff = computed<MazeBuffInfo | null>(() => (data.value ? seasonNodeBuff(data.value) : null));

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
  return { key, to: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});
const nextSeason = computed(() => {
  const i = seasonIndex.value;
  if (i < 0 || i >= seasonKeys.value.length - 1 || !listDb.value) return null;
  const key = seasonKeys.value[i + 1];
  if (!key) return null;
  return { key, to: `/endgame/${modeKey.value}/${key}`, posterTab: listDb.value[key]?.arts?.poster_tab };
});

const pageRef = ref<HTMLElement | null>(null);
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
      :aria-label="t('egd.loadingAria')"
    >
      <header class="nk-egd-hero" :data-mode="modeKey">
        <div class="nk-egd-hero__plate">
          <span class="nk-sk nk-sk--shimmer nk-skel-art"></span>
        </div>
        <div class="nk-egd-hero__panel">
          <span class="nk-sk nk-sk--shimmer nk-skel-camp"></span>
          <span class="nk-sk nk-sk--shimmer nk-egd-hero__name nk-skel-name"></span>
          <span class="nk-sk nk-sk--shimmer nk-skel-meta"></span>
        </div>
      </header>
      <div class="nk-panels nk-egd-body">
        <div class="nk-egd-panel">
          <div class="nk-skel-tabs">
            <span class="nk-sk nk-sk--shimmer nk-skel-tab"></span>
            <span class="nk-sk nk-sk--shimmer nk-skel-tab"></span>
            <span class="nk-sk nk-sk--shimmer nk-skel-tab"></span>
            <span class="nk-sk nk-sk--shimmer nk-skel-tab"></span>
          </div>
          <div class="nk-egd-level-panel">
            <div class="nk-title">
              <span class="nk-sk nk-sk--shimmer nk-skel-sec-title"></span>
            </div>
            <div class="nk-sk nk-sk--shimmer nk-skel-board"></div>
            <div class="nk-sk nk-sk--shimmer nk-skel-board-tail"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('egd.errorTitle') }}</div>
      <div v-if="error" class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">{{ t('common.retry') }}</button>
    </div>

    <template v-else-if="data">
      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        :aria-label="t('cwRole.topAria')"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <EndgameHero :data="unpublished ? { ...data, zh: t('egd.seasonUnpublished') } : data" :mode-key="modeKey" />

      <div class="nk-panels nk-egd-body">
        <div class="nk-egd-panel">
          <template v-if="levelTabs.length && !unpublished">
            <section
              v-if="modeKey === 'story' && (seasonBuffs.length || data.sub_buffs?.length)"
              class="nk-egd-buffzone"
              aria-labelledby="egd-buffs-title"
            >
              <h2 id="egd-buffs-title" class="nk-title">{{ t('egm.sec.buffs') }}</h2>
              <EndgameBuffs
                v-if="data.sub_buffs?.length"
                :data="data"
                :mode-key="modeKey"
              />
              <EndgameBuffGroup
                v-if="seasonBuffs.length"
                id="egd-season-buffs"
                class="nk-egd-group--row"
                :title="systemName || fallbackSystemName()"
                :items="seasonBuffs"
              />
            </section>

            <section v-if="hoistedNodeBuff" class="nk-egd-buffzone nk-egd-buffzone--solo">
              <EndgameFloorBuff :buff="hoistedNodeBuff" />
            </section>

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

            <EndgameSeasonRewards :data="data" />
          </template>

          <div v-else class="nk-slot-empty">{{ t('egd.empty.stages') }}</div>

          <nav v-if="prevSeason || nextSeason" class="nk-egd-nav" :aria-label="t('egd.navAria')">
            <router-link
              v-if="prevSeason"
              class="nk-egd-nav__item nk-egd-nav__item--prev"
              :to="prevSeason.to"
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
                <span class="nk-egd-nav__dir">{{ t('egd.prevSeason') }}</span>
                <span class="nk-egd-nav__id">{{ prevSeason.key }}</span>
              </span>
            </router-link>
            <span v-else class="nk-egd-nav__item nk-egd-nav__item--void"></span>
            <router-link
              v-if="nextSeason"
              class="nk-egd-nav__item nk-egd-nav__item--next"
              :to="nextSeason.to"
            >
              <span class="nk-egd-nav__body">
                <span class="nk-egd-nav__dir">{{ t('egd.nextSeason') }}</span>
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