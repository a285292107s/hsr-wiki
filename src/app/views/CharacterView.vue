<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useAppStore } from '../stores/app';
import { useCharacterStore } from '../stores/character';
import { useDetailView } from '../composables/use-detail-view';
import { useScrollSpy } from '../composables/use-scroll-spy';
import { useEnhancedForm } from '../composables/use-enhanced-form';
import CharHero from '../character/CharHero.vue';
import StatsPanel from '../character/StatsPanel.vue';
import OverviewPanel from '../character/OverviewPanel.vue';
import SkillsPanel from '../character/SkillsPanel.vue';
import EidolonsPanel from '../character/EidolonsPanel.vue';
import BuildsPanel from '../character/BuildsPanel.vue';
import ComparePanel from '../character/ComparePanel.vue';
import EnhFormCards from '../character/EnhFormCards.vue';
import { visibleSections, SECTION_IDX } from '../character/sections';
import { loadSkillAnimations } from '../../services/api';
import type { CharacterData, SkillAnimationsDb } from '../../services/types';
import type { FormCard } from '../composables/use-enhanced-form';
import '../../styles/skill-card.css';
import '../../styles/character-hero.css';
import '../../styles/character-skills.css';
import '../../styles/character-builds.css';
import '../../styles/character-enhance.css';
import '../../styles/character-compare.css';
import '../../styles/character-skeleton.css';
import { translate } from '../i18n';

const t = translate;

const app = useAppStore();
const char = useCharacterStore();
const form = useEnhancedForm();
const formCards = computed<FormCard[]>(() => form.forms.value);
const formMode = computed(() => form.mode.value);
const formNotes = computed(() => form.notes.value);
const formChanged = computed(() => form.changedCount.value);
const enhanceable = computed(() => char.enhKeys.length > 0);

const { phase, showSkeleton, retry } = useDetailView({
  hasData: () => !!char.data,
  error: () => char.error,
  currentId: () => char.charId,
  load: (id) => char.load(id),
  onLoaded: () => {
    loadSkillAnimations().then((db) => { animDb.value = db; }).catch(() => {});
  },
});
const d = computed<CharacterData | null>(() => char.renderData);

const animDb = ref<SkillAnimationsDb | null>(null);

const sectionDefs = [
  { id: 'stats', label: t('char.sec.stats') },
  { id: 'skills', label: t('catalog.sig.skills') },
  { id: 'talents', label: t('char.sec.talents') },
  { id: 'eidolons', label: t('char.sec.eidolons') },
  { id: 'bonuses', label: t('char.sec.bonuses') },
  { id: 'cones', label: t('catalog.lightcone.title') },
  { id: 'teams', label: t('char.sec.teams') },
  { id: 'relics', label: t('catalog.relic.title') },
  { id: 'stories', label: t('char.sec.stories') },
  { id: 'profile', label: t('char.sec.profile') },
] as const;

const navSections = computed(() => {
  const dd = d.value;
  if (!dd) return [];
  if (char.compareOn) {
    return sectionDefs.filter((s) => s.id === 'skills' || s.id === 'talents' || s.id === 'eidolons');
  }
  const vis = new Set(visibleSections(dd));
  return sectionDefs.filter((s) => vis.has(s.id));
});

const vis = computed(() => new Set(visibleSections(d.value)));
const pageRef = ref<HTMLElement | null>(null);
const enhBarRef = ref<HTMLElement | null>(null);

let panels: HTMLElement[] = [];

function collectPanels(): void {
  panels = Array.from(
    pageRef.value?.querySelectorAll<HTMLElement>('.nk-panel[data-panel]') || [],
  );
}

const { activeId, progress, showTop, jumpTo, scrollTop } = useScrollSpy(
  pageRef,
  () => navSections.value.map((s) => s.id),
  (id) => panels.find((p) => p.dataset.panel === id) || null,
  { offset: () => (enhBarRef.value?.offsetHeight || 0) + 12 },
);

const NAV_FADE_EDGE = 28;
const NAV_PAN_HOLD = 1200;
const navFade = ref<'none' | 'start' | 'middle' | 'end'>('start');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let navEl: HTMLElement | null = null;
let navRo: ResizeObserver | null = null;
let navPanAt = 0;
let navRaf = 0;

function syncNavFade(): void {
  if (!navEl) return;
  const max = navEl.scrollWidth - navEl.clientWidth;
  const x = navEl.scrollLeft;
  navFade.value = max <= 1 ? 'none' : x <= 1 ? 'start' : x >= max - 1 ? 'end' : 'middle';
}

function revealActive(): void {
  const nav = navEl;
  const btn = nav?.querySelector<HTMLElement>('.nk-secnav__btn--active');
  if (!nav || !btn) return;
  if (Date.now() - navPanAt < NAV_PAN_HOLD) return;
  const max = nav.scrollWidth - nav.clientWidth;
  if (max <= 1) return;
  const nb = nav.getBoundingClientRect();
  const bb = btn.getBoundingClientRect();
  const viewLeft = nb.left + (nav.scrollLeft > 1 ? NAV_FADE_EDGE : 0);
  const viewRight = nb.right - (nav.scrollLeft < max - 1 ? NAV_FADE_EDGE : 0);
  if (viewRight - viewLeft <= 0) return;
  if (bb.left >= viewLeft && bb.right <= viewRight) return;
  const delta = (bb.left + bb.right) / 2 - (viewLeft + viewRight) / 2;
  nav.scrollTo({ left: Math.max(0, nav.scrollLeft + delta), behavior: reducedMotion ? 'auto' : 'smooth' });
}

function onNavScroll(): void {
  if (navRaf) return;
  navRaf = requestAnimationFrame(() => { navRaf = 0; syncNavFade(); });
}

function onNavPan(): void { navPanAt = Date.now(); }

function unbindNav(): void {
  if (navEl) {
    navEl.removeEventListener('scroll', onNavScroll);
    navEl.removeEventListener('pointerdown', onNavPan);
    navEl.removeEventListener('wheel', onNavPan);
    navEl = null;
  }
  navRo?.disconnect();
  navRo = null;
  if (navRaf) { cancelAnimationFrame(navRaf); navRaf = 0; }
}

function bindNav(): void {
  unbindNav();
  const nav = enhBarRef.value?.querySelector<HTMLElement>('.nk-secnav') || null;
  if (!nav) return;
  navEl = nav;
  nav.addEventListener('scroll', onNavScroll, { passive: true });
  nav.addEventListener('pointerdown', onNavPan, { passive: true });
  nav.addEventListener('wheel', onNavPan, { passive: true });
  navRo = new ResizeObserver(() => syncNavFade());
  navRo.observe(nav);
  const firstBtn = nav.querySelector<HTMLElement>('.nk-secnav__btn');
  if (firstBtn) navRo.observe(firstBtn);
  syncNavFade();
}

watch(activeId, async () => {
  await nextTick();
  revealActive();
});

watch([d, () => char.compareOn], async (val) => {
  if (val) {
    await nextTick();
    collectPanels();
    bindNav();
  }
});

onBeforeUnmount(() => {
  unbindNav();
  char.reset();
});
</script>

<template>
  <div ref="pageRef" class="nk-page--detail nk-char-page" :aria-busy="phase === 'loading'">
    <main class="nk-char-main">
    <div
      v-if="phase === 'loading' && showSkeleton"
      class="nk-skeleton nk-skeleton--char"
      role="status"
      aria-live="polite"
      :aria-label="t('char.loadingAria')"
    >
      <div class="nk-skeleton__hero">
        <div class="nk-skeleton__hero-visual">
          <div class="nk-sk nk-sk--shimmer nk-sk--fill"></div>
        </div>
        <div class="nk-skeleton__hero-panel">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:90px;"></div>
            <div class="nk-sk nk-sk--shimmer" style="flex:1;height:1px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:52px;"></div>
          </div>
          <div style="display:flex;gap:8px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:64px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:60px;"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--chip" style="width:70px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div class="nk-sk nk-sk--shimmer nk-sk--title nk-sk--bar-lg"></div>
            <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:120px;"></div>
          </div>
          <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:240px;"></div>
        </div>
      </div>
      <div class="nk-skeleton__body">
        <div class="nk-sk nk-sk--shimmer nk-skeleton__stats-title" style="width:120px;"></div>
        <div class="nk-sk nk-sk--shimmer nk-skeleton__stats-level"></div>
        <div class="nk-skeleton__stat-grid nk-skeleton__stat-grid--panel">
          <div v-for="i in 3" :key="`sp${i}`" class="nk-sk nk-sk--shimmer nk-sk--stat"></div>
          <div class="nk-sk nk-sk--shimmer nk-skeleton__stats-note nk-skeleton__stats-note--inline"></div>
        </div>
        <div class="nk-skeleton__stat-grid nk-skeleton__stat-grid--param">
          <div v-for="i in 5" :key="`sq${i}`" class="nk-sk nk-sk--shimmer nk-sk--stat"></div>
        </div>
        <div class="nk-sk nk-sk--shimmer nk-skeleton__stats-note nk-skeleton__stats-note--flow" style="width:220px;"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--block-sm" style="margin-top:24px;"></div>
        <div class="nk-sk nk-sk--shimmer nk-sk--text-sm" style="width:100px;"></div>
        <div class="nk-skeleton__stat-grid">
          <div v-for="i in 6" :key="i" class="nk-sk nk-sk--shimmer nk-sk--block" style="height:56px;"></div>
        </div>
        <div class="nk-sk nk-sk--shimmer nk-sk--text-sm nk-sk--bar-sm"></div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer nk-sk--text-md nk-sk--bar-md"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--block" style="height:36px;border-radius:6px;"></div>
        </div>
        <div class="nk-skeleton__ability">
          <div class="nk-sk nk-sk--shimmer nk-sk--text-md" style="width:100px;"></div>
          <div class="nk-sk nk-sk--shimmer nk-sk--block" style="height:36px;border-radius:6px;"></div>
        </div>
      </div>
    </div>

    <div v-else-if="phase === 'error'" class="nk-error-state" role="alert">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('char.errorTitle') }}</div>
      <div v-if="char.error" class="nk-error-state__detail">{{ char.error }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">RETRY</button>
    </div>

    <template v-else-if="d">
      <div ref="enhBarRef" class="nk-enh-bar" :data-nav-fade="navFade">
        <div class="nk-enh-bar__inner">
          <nav class="nk-secnav" :aria-label="t('cwRole.navAria')">
            <button
              v-for="s in navSections"
              :key="s.id"
              type="button"
              class="nk-secnav__btn"
              :class="{ 'nk-secnav__btn--active': activeId === s.id }"
              :aria-current="activeId === s.id ? 'true' : undefined"
              @click="jumpTo(s.id)"
            >
              <span class="nk-secnav__idx">{{ SECTION_IDX[s.id] }}</span>
              {{ s.label }}
            </button>
          </nav>
        </div>
        <div class="nk-enh-bar__progress" :style="{ width: `${progress}%` }"></div>
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

      <div class="nk-panels">
        <section class="nk-panel nk-panel--overview" data-panel="hero" :aria-label="t('char.heroAria')">
          <CharHero :d="d" :char-id="char.charId" />
        </section>

        <section v-if="enhanceable" class="nk-forms-slot" :aria-label="t('char.enhForm')">
          <EnhFormCards
            :forms="formCards"
            :mode="formMode"
            :changed-count="formChanged"
            :notes="formNotes"
            @pick="(m, k) => form.pick(m, k)"
          />
        </section>

        <section v-if="vis.has('stats')" class="nk-panel" data-panel="stats">
          <StatsPanel :d="d" />
        </section>

        <section v-if="vis.has('skills')" class="nk-panel" data-panel="skills">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['skills']"
          />
          <SkillsPanel v-else :d="d" :char-id="char.charId" :enh-key="char.enhKey" :anim-db="animDb" />
        </section>
        <section v-if="vis.has('talents')" class="nk-panel" data-panel="talents">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['talents']"
          />
          <OverviewPanel v-else :d="d" :sections="['talents']" />
        </section>
        <section v-if="vis.has('eidolons')" class="nk-panel" data-panel="eidolons">
          <ComparePanel
            v-if="char.compareOn"
            :base="char.data"
            :enh-key="char.enhKey"
            :char-id="char.charId"
            :sections="['eidolons']"
          />
          <EidolonsPanel v-else :d="d" :char-id="char.charId" />
        </section>
        <section v-if="vis.has('bonuses') && !char.compareOn" class="nk-panel" data-panel="bonuses">
          <OverviewPanel :d="d" :sections="['bonuses']" />
        </section>
        <section v-if="vis.has('cones') && !char.compareOn" class="nk-panel" data-panel="cones">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['cones']"
          />
        </section>
        <section v-if="vis.has('teams') && !char.compareOn" class="nk-panel" data-panel="teams">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['teams']"
          />
        </section>
        <section v-if="vis.has('relics') && !char.compareOn" class="nk-panel" data-panel="relics">
          <BuildsPanel
            :d="d"
            :base-data="char.data"
            :char-id="char.charId"
            :name-cache="app.nameCache"
            :item-db="app.itemDb"
            :sections="['relics']"
          />
        </section>
        <section v-if="vis.has('stories') && !char.compareOn" class="nk-panel" data-panel="stories">
          <OverviewPanel :d="d" :sections="['stories']" />
        </section>
        <section v-if="vis.has('profile') && !char.compareOn" class="nk-panel" data-panel="profile">
          <OverviewPanel :d="d" :sections="['profile']" />
        </section>
      </div>
    </template>
    </main>
  </div>
</template>
