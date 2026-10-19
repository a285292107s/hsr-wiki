<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { userErrorDetail } from '../../lib/errors';
import { useRoute, RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { pageTitle } from '../seo';
import {
  ENDGAME_MODES, endgamePage, mazeStatus, mazeStatusLabelKey, modeDefaultArtUrl,
} from '../catalog/pages/endgame';
import {
  loadLocalBossList, loadLocalEndgameGuide, loadLocalMazeList,
  loadLocalPeakList, loadLocalStoryList,
} from '../../services/api';
import type {
  EndgameGuideDb, EndgameGuideMode, EndgameGuideSection,
  MazeListDb, MazeListEntry,
} from '../../services/types';
import type { CatalogItem } from '../catalog/types';
import { seasonBuffChoiceLabel, seasonBuffCount } from '../endgame/guide';
import '../../styles/endgame.css';
import '../../styles/endgame-mode.css';

const { t } = useI18n();

const route = useRoute();
const modeKey = computed(() => String(route.params.mode || ''));

const MODE_LIST_LOADERS: Record<string, () => Promise<MazeListDb>> = {
  maze: loadLocalMazeList,
  story: loadLocalStoryList,
  boss: loadLocalBossList,
  peak: loadLocalPeakList,
};

const phase = ref<'loading' | 'ready' | 'error'>('loading');
const error = ref<string | null>(null);
const guide = ref<EndgameGuideDb | null>(null);
const listDb = ref<MazeListDb | null>(null);
const seasonCards = ref<CatalogItem[]>([]);

const mode = computed(() => ENDGAME_MODES.find((m) => m.key === modeKey.value) || null);
const guideMode = computed<EndgameGuideMode | null>(() => guide.value?.modes?.[modeKey.value] ?? null);
const system = computed(() => guideMode.value?.system ?? null);
const heroArt = computed(() => modeDefaultArtUrl(modeKey.value));
const otherModes = computed(() => ENDGAME_MODES.filter((m) => m.key !== modeKey.value));

const currentSeasonInfo = computed<{ id: string; entry: MazeListEntry | null; live: boolean }>(() => {
  const pick = (card: CatalogItem | undefined) => {
    const id = String(card?.href || '').split('/').pop() || '';
    return { id, entry: (id && listDb.value?.[id]) || null };
  };
  for (const card of seasonCards.value) {
    const { id, entry } = pick(card);
    if (entry && mazeStatus(entry) === 'live') return { id, entry, live: true };
  }
  const { id, entry } = pick(seasonCards.value[0]);
  return { id, entry, live: false };
});
const currentSeason = computed<MazeListEntry | null>(() => currentSeasonInfo.value.entry);
const currentSeasonId = computed(() => currentSeasonInfo.value.id);
const currentSeasonLive = computed(() => currentSeasonInfo.value.live);
const hasCurrentSeason = computed(() => Boolean(currentSeasonId.value && currentSeason.value));
const currentSeasonStatusKey = computed(() =>
  currentSeason.value ? mazeStatus(currentSeason.value) : 'unknown',
);
const currentSeasonStatus = computed(() => t(mazeStatusLabelKey(currentSeasonStatusKey.value)));

const structure = computed<Array<{ label: string; value: string }>>(() => {
  const s = currentSeason.value;
  if (!s) return [];
  const rows: Array<{ label: string; value: string }> = [];
  const floors = s.floor_details || [];
  if (floors.length) {
    rows.push({ label: t('egm.stat.floors'), value: t('egm.value.floors', { n: floors.length }) });
    const halfs = (floors[0].stage1 ? 1 : 0) + (floors[0].stage2 ? 1 : 0);
    if (halfs) rows.push({ label: t('egm.stat.halfs'), value: t('egm.value.halfs', { n: halfs }) });
  }
  const levels = s.levels || [];
  if (levels.length) {
    rows.push({ label: t('egm.stat.levels'), value: t('vor.stageCount', { n: levels.length }) });
    const knights = levels.filter((l) => l.kind === 'knight').length;
    const kings = levels.filter((l) => l.kind === 'king').length;
    if (knights) rows.push({ label: t('egm.stat.knights'), value: t('vor.stageCount', { n: knights }) });
    if (kings) rows.push({ label: t('egm.stat.kings'), value: t('vor.stageCount', { n: kings }) });
    const withTargets = levels.filter((l) => (l.targets || []).length).length;
    if (withTargets) rows.push({ label: t('egm.stat.targets'), value: t('vor.stageCount', { n: withTargets }) });
  }
  if (s.countdown != null && s.countdown > 0) {
    rows.push({ label: t('egm.stat.countdown'), value: t('egm.value.countdown', { n: s.countdown }) });
  }
  if (s.clear_score) rows.push({ label: t('egm.stat.scoreCap'), value: String(s.clear_score) });
  rows.push({ label: t('egm.stat.tierce'), value: t(s.tierce ? 'egm.value.tierceOn' : 'egm.value.tierceOff') });
  return rows;
});


const ruleBlocks = computed<Array<{ title: string; paras: string[]; items: string[] }>>(
  () => (guideMode.value?.sections || []).map((sec: EndgameGuideSection) => {
    const lines = sec.text.split('\\n').map((l) => l.trim()).filter(Boolean);
    return {
      title: sec.title,
      paras: lines.filter((l) => !l.startsWith('●') && !l.startsWith('○')),
      items: lines.filter((l) => l.startsWith('●') || l.startsWith('○')).map((l) => l.replace(/^[●○]\s*/, '')),
    };
  }),
);

async function load(): Promise<void> {
  const loader = MODE_LIST_LOADERS[modeKey.value];
  if (!loader) {
    phase.value = 'error';
    error.value = t('egm.unknownMode', { key: modeKey.value });
    return;
  }
  phase.value = 'loading';
  error.value = null;
  try {
    const [guideDb, list, cards] = await Promise.all([
      loadLocalEndgameGuide().catch(() => null),
      loader(),
      endgamePage.fetchData?.({ version: '' }) ?? Promise.resolve([]),
    ]);
    guide.value = guideDb;
    listDb.value = list;
    seasonCards.value = cards.filter((c) => c.mode === modeKey.value);
    document.title = pageTitle(mode.value ? t(mode.value.labelKey) : modeKey.value);
    phase.value = 'ready';
  } catch (e) {
    error.value = userErrorDetail(e);
    phase.value = 'error';
  }
}

onMounted(() => { void load(); });
watch(modeKey, () => { void load(); });

function cardHtml(item: CatalogItem, i: number): string {
  return endgamePage.renderCard ? endgamePage.renderCard(item, i) : '';
}
</script>

<template>
  <div class="nk-page--detail nk-egm" :aria-busy="phase === 'loading'">
    <template v-if="phase === 'ready'">
      <header class="nk-egm__hero" :data-mode="modeKey">
        <nav class="nk-egm__crumbs" :aria-label="t('egm.crumbsAria')">
          <RouterLink to="/">{{ t('nav.home') }}</RouterLink>
          <span class="nk-egm__sep">›</span>
          <RouterLink to="/endgame">{{ t('nav.endgame') }}</RouterLink>
          <span class="nk-egm__sep">›</span>
          <span>{{ mode ? t(mode.labelKey) : '' }}</span>
        </nav>
        <div class="nk-egm__head">
          <img v-if="heroArt" class="nk-egm__emblem" :src="heroArt" alt="" width="48" height="48">
          <div>
            <h1 class="nk-egm__title">{{ mode ? t(mode.labelKey) : '' }}</h1>
            <p class="nk-egm__en">{{ mode?.en }}</p>
          </div>
        </div>
      </header>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">01</span>{{ t('egm.sec.rules') }} RULES</h2>
        <article v-for="(block, bi) in ruleBlocks" :key="bi" class="nk-egm__rule">
          <h3 class="nk-egm__rule-title">{{ block.title }}</h3>
          <p v-for="(p, pi) in block.paras" :key="pi" class="nk-egm__para">{{ p }}</p>
          <ul v-if="block.items.length" class="nk-egm__list">
            <li v-for="(it, ii) in block.items" :key="ii">{{ it }}</li>
          </ul>
        </article>
        <div v-if="!ruleBlocks.length" class="nk-slot-empty">{{ t('egm.empty') }}</div>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">02</span>{{ t('egm.sec.structure') }} STRUCTURE</h2>
        <p v-if="currentSeasonLive" class="nk-egm__note">{{ t('egm.note') }}</p>
        <dl v-if="structure.length" class="nk-egm__facts">
          <div v-for="row in structure" :key="row.label" class="nk-egm__fact">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
        <div v-else class="nk-slot-empty">{{ t('egm.empty') }}</div>
        <p v-if="hasCurrentSeason" class="nk-egm__note">
          {{ currentSeasonLive ? t('egm.currentSeason') : (currentSeasonStatusKey === 'unknown' ? t('egm.latestSeason') : t('egm.latestSeasonWith', { status: currentSeasonStatus })) }}：<RouterLink class="nk-egm__link" :to="`/endgame/${modeKey}/${currentSeasonId}`">{{ currentSeason?.zh }}</RouterLink>
        </p>
      </section>

      <section class="nk-egm__panel">
        <h2 class="nk-title"><span class="nk-title__idx">03</span>{{ system?.name || t('egm.sec.buffs') }} BUFFS</h2>
        <p v-if="system" class="nk-egm__system">
          <span class="nk-egm__system-count">{{ t('egm.buffCount', { n: seasonBuffCount(guide, modeKey) }) }}</span>
          <span class="nk-egm__system-choice">{{ seasonBuffChoiceLabel(guide, modeKey) }}</span>
        </p>
        <RouterLink v-if="hasCurrentSeason" class="nk-guide-link nk-egm__system-cta" :to="`/endgame/${modeKey}/${currentSeasonId}`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          {{ t('egm.viewSeasonBuffs', { which: currentSeasonLive ? t('egm.whichCurrent') : t('egm.whichLatest'), name: currentSeason?.zh }) }}
        </RouterLink>
      </section>

      <section class="nk-egm__panel" aria-labelledby="egm-sec-seasons">
        <h2 id="egm-sec-seasons" class="nk-title"><span class="nk-title__idx">04</span>{{ t('egm.sec.seasons') }} SEASONS</h2>
        <div v-if="seasonCards.length" class="nk-egm__seasons" v-html="seasonCards.map(cardHtml).join('')"></div>
        <div v-else class="nk-slot-empty">{{ t('egm.empty') }}</div>
      </section>

      <nav class="nk-egm__others" :aria-label="t('egm.othersAria')">
        <RouterLink v-for="m in otherModes" :key="m.key" class="nk-egm__other" :to="`/endgame/${m.key}`">
          <span class="nk-egm__other-cn">{{ t(m.labelKey) }}</span>
          <span class="nk-egm__other-en">{{ m.en }}</span>
        </RouterLink>
      </nav>
    </template>

    <div v-else-if="phase === 'loading'" class="nk-skeleton nk-skeleton--egm">
      <div class="nk-skeleton__hero nk-skeleton__hero--egm">
        <div class="nk-sk nk-skeleton__hero-panel nk-sk--title"></div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--stat"></div>
        <div class="nk-sk nk-sk--stat"></div>
        <div class="nk-sk nk-sk--stat"></div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state">
      <p class="nk-error-state__title">{{ t('egm.errorTitle') }}</p>
      <p class="nk-error-state__desc">{{ error }}</p>
      <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
    </div>
  </div>
</template>
