<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { fmtDesc, gridFightAffixIconUrl, refsResolved, tutorialPicUrl } from '../../lib/format';
import { cdnFallbackFromPrimary } from '../../services/cdn';
import { loadLocalVoracity } from '../../services/api';
import type { MazeBuffInfo, VoracityDb } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { BUFF_ICON_FALLBACK, buffDescHtml, buffIconUrl } from '../endgame/renders';
import { translate } from '../i18n';
import '../../styles/voracity.css';

const t = translate;

const { data, error, loading, showSkeleton, run: load, retry } = usePageData<VoracityDb>(loadLocalVoracity);

const pageRef = ref<HTMLElement | null>(null);

const activity = computed(() => data.value?.activity ?? null);
const invasion = computed(() => data.value?.invasion ?? null);

const SECTION_DEFS: { id: string; label: string }[] = [
  { id: 'overview', label: t('vor.sec.overview') },
  { id: 'invasion', label: t('vor.sec.invasion') },
  { id: 'tutorials', label: t('vor.sec.tutorials') },
  { id: 'affixes', label: t('vor.sec.affixes') },
];

const sections = computed(() => {
  const d = data.value;
  const on: Record<string, boolean> = {
    overview: !!d?.activity,
    invasion: !!d?.invasion?.levels?.length || !!d?.activity?.buff_levels?.length,
    tutorials: !!d?.tutorials?.length,
    affixes: !!d?.affixes?.length,
  };
  const out: { id: string; idx: string; label: string }[] = [];
  for (const def of SECTION_DEFS) {
    if (on[def.id]) out.push({ ...def, idx: String(out.length + 1).padStart(2, '0') });
  }
  return out;
});

const shownSections = computed(() => new Set(sections.value.map((s) => s.id)));
const sectionIdx = (id: string): string => sections.value.find((s) => s.id === id)?.idx ?? '';

const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => sections.value.map((s) => s.id),
  (id) => document.getElementById(`vor-${id}`),
  { offset: 64, fallbackFirst: true },
);

function plainDesc(desc: string | null | undefined, params?: number[] | null): string {
  return refsResolved(desc, params) ? fmtDesc(desc, params) : '';
}

function buffView(id: number, name: string | undefined, desc: string | undefined, params: number[] | undefined, icon: string | undefined): MazeBuffInfo {
  return { id, name: name ?? '', desc, param_list: params, icon };
}

function buffHtml(b: MazeBuffInfo): string {
  return refsResolved(b.desc, b.param_list) ? buffDescHtml(b) : '';
}

const introHtml = computed(() => plainDesc(activity.value?.intro, null));
const levels = computed(() =>
  (invasion.value?.levels ?? []).map((l) => {
    const buff = buffView(l.maze_buff_id ?? l.invasion_id, undefined, l.desc, l.param_list, l.icon);
    return { ...l, buff, html: buffHtml(buff) };
  }));
const buffLevels = computed(() =>
  (activity.value?.buff_levels ?? []).map((b) => {
    const buff = buffView(b.buff_id, b.name, b.desc, b.param_list, b.icon);
    return { ...b, buff, html: buffHtml(buff) };
  }));
const affixes = computed(() =>
  (data.value?.affixes ?? []).map((a) => ({
    ...a,
    iconUrl: gridFightAffixIconUrl(a.icon),
    html: plainDesc(a.desc, a.params),
  })));
const tutorials = computed(() =>
  (data.value?.tutorials ?? []).map((t) => ({ ...t, html: plainDesc(t.desc, null) })));

function buffIconError(e: Event): void {
  (e.target as HTMLImageElement).src = BUFF_ICON_FALLBACK;
}

function iconFallback(url: string): string | undefined {
  return cdnFallbackFromPrimary(url) || undefined;
}

function ratioPct(v: number | null | undefined): number {
  if (v == null) return 0;
  return Math.max(0, Math.min(100, v <= 1 ? v * 100 : v));
}
const fmtPct = (v: number | null | undefined): string => `${Math.round(ratioPct(v) * 10) / 10}%`;

watch(data, (d) => {
  if (!d) return;
  pageRef.value?.scrollTo({ top: 0 });
  void nextTick(() => { refresh(); });
});

onMounted(() => { void load(); });
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-vor" :aria-busy="loading">
    <div
      v-if="loading && showSkeleton"
      class="nk-skeleton nk-vor-skeleton"
      role="status"
      aria-live="polite"
      :aria-label="t('vor.loadingAria')"
    >
      <div class="nk-vor-bar">
        <div class="nk-vor-bar__inner">
          <div class="nk-secnav nk-vor-secnav">
            <span v-for="def in SECTION_DEFS" :key="def.id" class="nk-sk nk-sk--shimmer nk-skel-nav"></span>
          </div>
        </div>
        <div class="nk-vor-bar__progress"></div>
      </div>
      <header class="nk-vor-hero">
        <div class="nk-sk nk-sk--shimmer nk-vor-hero__title nk-skel-hero-title"></div>
        <div class="nk-sk nk-sk--shimmer nk-skel-hero-act"></div>
      </header>
      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <section class="nk-vor-sec">
            <div class="nk-title">
              <span class="nk-sk nk-sk--shimmer nk-skel-sec-title"></span>
            </div>
            <div class="nk-sk nk-sk--shimmer nk-vor-intro nk-skel-intro"></div>
            <div class="nk-vor-facts">
              <span class="nk-sk nk-sk--shimmer nk-skel-fact"></span>
            </div>
          </section>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('vor.errorTitle') }}</div>
      <div class="nk-error-state__detail">{{ error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="data">
      <div class="nk-vor-bar">
        <div class="nk-vor-bar__inner">
          <nav class="nk-secnav nk-vor-secnav" :aria-label="t('cwRole.navAria')">
            <button
              v-for="s in sections"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeId === s.id }"
              :aria-current="activeId === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ s.idx }}</span>
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-vor-bar__progress" :style="{ width: `${progress}%` }"></div>
      </div>

      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        :aria-label="t('cwRole.topAria')"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <header class="nk-vor-hero">
        <h1 class="nk-vor-hero__title">{{ t('nav.voracity') }}</h1>
        <p v-if="activity?.name" class="nk-vor-hero__act">{{ activity.name }}</p>
      </header>

      <div class="nk-panels">
        <div class="nk-panel nk-panel--active">
          <section v-if="shownSections.has('overview')" id="vor-overview" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('overview') }}</span>{{ t('vor.sec.overview') }} OVERVIEW</h2>
            <p v-if="introHtml" class="nk-vor-intro" v-html="introHtml"></p>
            <dl class="nk-vor-facts">
              <div v-if="activity?.panel_id != null" class="nk-vor-fact">
                <dt>{{ t('vor.field.actId') }}</dt>
                <dd>{{ activity.panel_id }}</dd>
              </div>
              <div v-if="activity?.unlock_mission_id != null" class="nk-vor-fact">
                <dt>{{ t('vor.field.unlockQuest') }}</dt>
                <dd>{{ activity.unlock_mission_id }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="shownSections.has('invasion')" id="vor-invasion" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('invasion') }}</span>{{ t('vor.sec.invasion') }} INVASION</h2>

            <div v-if="levels.length" class="nk-vor-group">
              <h3 class="nk-vor-group__title">{{ t('vor.enemyBoost') }}</h3>
              <div class="nk-vor-levels">
                <article v-for="l in levels" :key="l.invasion_id" class="nk-vor-level">
                  <header class="nk-vor-level__head">
                    <img
                      v-if="l.icon"
                      class="nk-vor-level__icon"
                      :src="buffIconUrl(l.buff)"
                      alt=""
                      loading="lazy"
                      @error="buffIconError"
                    >
                    <span class="nk-vor-level__no">{{ t('vor.invasionLevel', { n: l.invasion_id }) }}</span>
                    <span v-if="l.maze_buff_id != null" class="nk-vor-code">#{{ l.maze_buff_id }}</span>
                    <span v-if="l.binding" class="nk-vor-code nk-vor-code--bind">{{ l.binding }}</span>
                  </header>
                  <p v-if="l.html" class="nk-vor-level__desc" v-html="l.html"></p>
                </article>
              </div>
            </div>

            <div v-if="buffLevels.length" class="nk-vor-group">
              <h3 class="nk-vor-group__title">{{ t('vor.playerSupport') }}</h3>
              <div class="nk-vor-buffs">
                <article v-for="b in buffLevels" :key="b.buff_id" class="nk-vor-buff">
                  <header class="nk-vor-buff__head">
                    <img
                      v-if="b.icon"
                      class="nk-vor-buff__icon"
                      :src="buffIconUrl(b.buff)"
                      alt=""
                      loading="lazy"
                      @error="buffIconError"
                    >
                    <span class="nk-vor-buff__lv">LV {{ b.level }}</span>
                    <h4 v-if="b.name" class="nk-vor-buff__name">{{ b.name }}</h4>
                    <span class="nk-vor-code">#{{ b.buff_id }}</span>
                  </header>
                  <p v-if="b.html" class="nk-vor-buff__desc" v-html="b.html"></p>
                  <div v-if="b.progress_percent != null" class="nk-vor-buff__pct">
                    {{ t('vor.willProgress') }} <span class="nk-vor-buff__pctval">{{ fmtPct(b.progress_percent) }}</span>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section v-if="shownSections.has('tutorials')" id="vor-tutorials" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('tutorials') }}</span>{{ t('vor.sec.tutorials') }} TUTORIAL</h2>
            <div class="nk-vor-tutorials">
              <figure v-for="t in tutorials" :key="t.id" class="nk-vor-tutorial">
                <div v-if="t.image" class="nk-vor-tutorial__frame">
                  <img
                    class="nk-vor-tutorial__img"
                    :src="tutorialPicUrl(t.image)"
                    alt=""
                    loading="lazy"
                    :data-cdn-fallback="iconFallback(tutorialPicUrl(t.image))"
                  >
                </div>
                <figcaption class="nk-vor-tutorial__cap">
                  <span class="nk-vor-code">#{{ t.id }}</span>
                  <span v-if="t.html" class="nk-vor-tutorial__desc" v-html="t.html"></span>
                </figcaption>
              </figure>
            </div>
          </section>

          <section v-if="shownSections.has('affixes')" id="vor-affixes" class="nk-vor-sec">
            <h2 class="nk-title"><span class="nk-title__idx">{{ sectionIdx('affixes') }}</span>{{ t('vor.sec.affixesFull') }} AFFIX</h2>
            <div class="nk-vor-affixes">
              <article v-for="a in affixes" :key="a.id" class="nk-vor-affix">
                <header class="nk-vor-affix__head">
                  <img
                    v-if="a.iconUrl"
                    class="nk-vor-affix__icon"
                    :src="a.iconUrl"
                    alt=""
                    loading="lazy"
                    :data-cdn-fallback="iconFallback(a.iconUrl)"
                  >
                  <h4 class="nk-vor-affix__name">{{ a.name }}</h4>
                  <span class="nk-vor-code">#{{ a.id }}</span>
                </header>
                <p v-if="a.html" class="nk-vor-affix__desc" v-html="a.html"></p>
                <div v-if="a.params?.length" class="nk-vor-params">
                  <span class="nk-vor-params__label">{{ t('common.param') }}</span>
                  <span v-for="(p, i) in a.params" :key="i" class="nk-vor-param">{{ p }}</span>
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
