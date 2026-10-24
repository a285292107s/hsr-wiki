<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { MAX_CHAR_LEVEL } from '../../lib/constants';
import { levelStatValue, maxLevelStat } from '../../lib/format';
import type { MonsterEliteGroups, MonsterLevelCurve } from '../../lib/monster-stats';
import {
  loadLocalCharacter,
  loadLocalCharacterList,
  loadLocalMonsterDetail,
  loadLocalMonsterEliteGroups,
  loadLocalMonsterLevelCurve,
  loadLocalMonsterList,
} from '../../services/api';
import type { CharacterData, LocalCharList, LocalMonsterList, MonsterDetail } from '../../services/types';
import { usePageData } from '../composables/use-page-data';
import { useScrollSpy } from '../composables/use-scroll-spy';
import BreakSection from '../formula/BreakSection.vue';
import CalcSection from '../formula/CalcSection.vue';
import ElationSection from '../formula/ElationSection.vue';
import ExtraSection from '../formula/ExtraSection.vue';
import GrowthSection from '../formula/GrowthSection.vue';
import HealSection from '../formula/HealSection.vue';
import OverviewSection from '../formula/OverviewSection.vue';
import SpeedSection from '../formula/SpeedSection.vue';
import TrueSection from '../formula/TrueSection.vue';
import { translate as t } from '../i18n';
import '../../styles/formula.css';

interface FormulaSource {
  chars: LocalCharList;
  monsters: LocalMonsterList;
  curve: MonsterLevelCurve;
  elite: MonsterEliteGroups;
  char: CharacterData | null;
  monster: MonsterDetail | null;
}

const SECTION_DEFS = [
  { id: 'overview', labelKey: 'formula.sec.overview' },
  { id: 'break', labelKey: 'formula.sec.break' },
  { id: 'elation', labelKey: 'formula.sec.elation' },
  { id: 'true', labelKey: 'formula.sec.true' },
  { id: 'growth', labelKey: 'formula.sec.growth' },
  { id: 'heal', labelKey: 'formula.sec.heal' },
  { id: 'speed', labelKey: 'formula.sec.speed' },
  { id: 'extra', labelKey: 'formula.sec.extra' },
  { id: 'calc', labelKey: 'formula.sec.calc' },
];

async function loadSource(): Promise<FormulaSource> {
  const [chars, monsters, curve, elite] = await Promise.all([
    loadLocalCharacterList(),
    loadLocalMonsterList(),
    loadLocalMonsterLevelCurve(),
    loadLocalMonsterEliteGroups(),
  ]);
  const firstChar = chars[0];
  const firstMonster = monsters[0];
  const char = firstChar ? await loadLocalCharacter(String(firstChar.id)) : null;
  const monster = firstMonster ? await loadLocalMonsterDetail(String(firstMonster.id)) : null;
  return { chars, monsters, curve, elite, char, monster };
}

const { data, error, loading, showSkeleton, run: load, retry } = usePageData<FormulaSource>(loadSource);

const pageRef = ref<HTMLElement | null>(null);
const charId = ref('');
const monsterId = ref('');
const charDetail = ref<CharacterData | null>(null);
const monsterDetail = ref<MonsterDetail | null>(null);
const charLoading = ref(false);
const monsterLoading = ref(false);
const enemyLevel = ref(MAX_CHAR_LEVEL);

let charToken = 0;
let monsterToken = 0;

const sections = computed(() =>
  SECTION_DEFS.map((def, i) => ({ id: def.id, idx: String(i + 1).padStart(2, '0'), label: t(def.labelKey) })),
);

function sectionIdx(id: string): string {
  const flat = SECTION_DEFS.findIndex((def) => def.id === id);
  return String(flat + 1).padStart(2, '0');
}

const { activeId, progress, showTop, jumpTo, scrollTop, refresh } = useScrollSpy(
  pageRef,
  () => SECTION_DEFS.map((def) => def.id),
  (id) => document.getElementById(`formula-${id}`),
  { offset: 64, fallbackFirst: true },
);

const activeSection = computed(() => {
  if (progress.value >= 99.5) return SECTION_DEFS[SECTION_DEFS.length - 1].id;
  return activeId.value;
});

watch(activeSection, (id) => {
  const nav = pageRef.value?.querySelector<HTMLElement>('.nk-formula-secnav');
  const btn = nav?.querySelector<HTMLElement>(`[data-sec="${id}"]`);
  if (!nav || !btn) return;
  const viewLeft = nav.scrollLeft;
  const viewRight = viewLeft + nav.clientWidth;
  const left = btn.offsetLeft;
  const right = left + btn.offsetWidth;
  if (left < viewLeft || right > viewRight) {
    nav.scrollTo({ left: left - (nav.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
  }
});

const chars = computed(() => data.value?.chars ?? []);
const monsters = computed(() => data.value?.monsters ?? []);
const curve = computed<MonsterLevelCurve>(() => data.value?.curve ?? {});
const elite = computed<MonsterEliteGroups>(() => data.value?.elite ?? {});

const attackStat = computed(() => {
  const row = maxLevelStat(charDetail.value?.stats ?? null);
  if (!row) return 0;
  return levelStatValue(row.attack_base, row.attack_add, MAX_CHAR_LEVEL);
});

async function pickChar(id: string): Promise<void> {
  if (!id || id === charId.value) return;
  charId.value = id;
  const token = ++charToken;
  charLoading.value = true;
  try {
    const detail = await loadLocalCharacter(id);
    if (token === charToken) charDetail.value = detail;
  } catch {
  } finally {
    if (token === charToken) charLoading.value = false;
  }
}

async function pickMonster(id: string): Promise<void> {
  if (!id || id === monsterId.value) return;
  monsterId.value = id;
  const token = ++monsterToken;
  monsterLoading.value = true;
  try {
    const detail = await loadLocalMonsterDetail(id);
    if (token === monsterToken) monsterDetail.value = detail;
  } catch {
  } finally {
    if (token === monsterToken) monsterLoading.value = false;
  }
}

watch(data, (source) => {
  if (!source) return;
  charDetail.value = source.char;
  monsterDetail.value = source.monster;
  charId.value = source.chars[0] ? String(source.chars[0].id) : '';
  monsterId.value = source.monsters[0] ? String(source.monsters[0].id) : '';
  pageRef.value?.scrollTo({ top: 0 });
  void nextTick(() => { refresh(); });
});

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-formula-app" class="nk-formula nk-page--detail" ref="pageRef" :aria-busy="loading">
    <div
      v-if="loading && showSkeleton"
      class="nk-skeleton nk-formula-skeleton"
      role="status"
      aria-live="polite"
      :aria-label="t('catalog.loadingAria', { title: t('nav.formula') })"
    >
      <div class="nk-formula-progress">
        <div class="nk-formula-progress__fill"></div>
      </div>
      <header class="nk-formula-hero">
        <div class="nk-formula-hero__main">
          <div class="nk-sk nk-sk--shimmer nk-formula-hero__title nk-skel-hero-title"></div>
          <div class="nk-sk nk-sk--shimmer nk-formula-hero__lead nk-skel-hero-lead"></div>
        </div>
        <div class="nk-formula-hero__aside">
          <div class="nk-sk nk-sk--shimmer nk-formula-hero__note nk-skel-hero-note"></div>
        </div>
      </header>
      <div class="nk-secnav nk-formula-secnav">
        <span v-for="sec in sections" :key="sec.id" class="nk-sk nk-sk--shimmer nk-skel-nav"></span>
      </div>
      <div class="nk-formula-body">
        <section class="nk-formula-sec">
          <div class="nk-formula-sec__title">
            <span class="nk-sk nk-sk--shimmer nk-skel-sec-title"></span>
          </div>
          <div class="nk-sk nk-sk--shimmer nk-formula-sec__lead nk-skel-sec-lead"></div>
          <div class="nk-sk nk-sk--shimmer nk-formula-chain nk-skel-chain"></div>
          <div class="nk-sk nk-sk--shimmer nk-formula-overview nk-skel-overview"></div>
        </section>
      </div>
    </div>

    <div v-else-if="error" class="nk-error-state">
      <div class="nk-error-state__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4" /><path d="M12 17h.01" />
        </svg>
      </div>
      <div class="nk-error-state__title">{{ t('catalog.loadError') }}</div>
      <div class="nk-error-state__detail">{{ error || t('common.loadErrorDetail') }}</div>
      <button class="nk-error-state__retry" type="button" @click="retry">{{ t('common.retry') }}</button>
    </div>

    <template v-else>
      <div class="nk-formula-progress" aria-hidden="true">
        <div class="nk-formula-progress__fill" :style="{ width: `${progress}%` }"></div>
      </div>

      <header class="nk-formula-hero">
        <div class="nk-formula-hero__main">
          <h1 class="nk-formula-hero__title">{{ t('nav.formula') }}</h1>
          <p class="nk-formula-hero__lead">{{ t('formula.hero.lead') }}</p>
        </div>
        <div class="nk-formula-hero__aside">
          <p class="nk-formula-hero__note">{{ t('formula.hero.note') }}</p>
        </div>
      </header>

      <nav class="nk-secnav nk-formula-secnav" :aria-label="t('nav.ariaMain')">
        <button
          v-for="sec in sections"
          :key="sec.id"
          type="button"
          class="nk-secnav__btn"
          :class="{ 'nk-secnav__btn--active': activeSection === sec.id }"
          :data-sec="sec.id"
          :aria-current="activeSection === sec.id ? 'true' : undefined"
          @click="jumpTo(sec.id)"
        >
          <span class="nk-secnav__idx">{{ sec.idx }}</span>
          {{ sec.label }}
        </button>
      </nav>

      <button
        v-show="showTop"
        class="nk-top-btn"
        type="button"
        :aria-label="t('cwRole.topAria')"
        @click="scrollTop"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>

      <div class="nk-formula-body">
        <OverviewSection :stat="attackStat" :idx="sectionIdx('overview')" />
        <BreakSection :enemy-level="enemyLevel" :idx="sectionIdx('break')" />
        <ElationSection :enemy-level="enemyLevel" :idx="sectionIdx('elation')" />
        <TrueSection :enemy-level="enemyLevel" :idx="sectionIdx('true')" />
        <GrowthSection
          :idx="sectionIdx('growth')"
          :chars="chars"
          :monsters="monsters"
          :curve="curve"
          :elite="elite"
          :char="charDetail"
          :monster="monsterDetail"
          :char-id="charId"
          :monster-id="monsterId"
          :char-loading="charLoading"
          :monster-loading="monsterLoading"
          :enemy-level="enemyLevel"
          @update:charId="pickChar"
          @update:monsterId="pickMonster"
          @update:enemyLevel="enemyLevel = $event"
        />
        <HealSection :idx="sectionIdx('heal')" />
        <SpeedSection :idx="sectionIdx('speed')" />
        <ExtraSection :idx="sectionIdx('extra')" />
        <CalcSection
          :idx="sectionIdx('calc')"
          :attack="attackStat"
          :defender-level="enemyLevel"
          @update:defenderLevel="enemyLevel = $event"
        />
      </div>
    </template>
  </div>
</template>
