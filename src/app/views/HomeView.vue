<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { SITE_NAME } from '../../lib/constants';
import { cdnUri } from '../../services/cdn';
import { STAR_SVG } from '../catalog/pages/shared';
import {
  searchHome, useHomeRelease,
  type HomeEntry, type HomeKind,
} from '../composables/use-home-release';
import { prefetchHighPriority } from '../router/chunks';
import '../../styles/home.css';

const { t } = useI18n();
const router = useRouter();
const { release, loaded, failedCount, labels, load } = useHomeRelease();

const groundUrl = cdnUri('bgpic', 'BgWiki.webp');
const entries = computed<HomeEntry[]>(() =>
  release.value ? [...release.value.characters, ...release.value.lightcones, ...release.value.relics] : [],
);
const allFailed = computed(() => labels.length > 0 && failedCount.value >= labels.length);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);

const kindLabel: Record<HomeKind, string> = {
  character: t('nav.character'),
  lightcone: t('nav.lightcone'),
  relic: t('nav.relic'),
};

function factLine(entry: HomeEntry): string {
  return entry.facts.map((fact) => fact.text).join(' · ');
}

const query = ref('');
const results = computed(() => (release.value ? searchHome(release.value.searchable, query.value) : []));
const searchActive = computed(() => query.value.trim().length > 0);

function submitSearch(): void {
  const first = results.value[0];
  if (first) {
    query.value = '';
    void router.push(first.to);
    return;
  }
  if (query.value.trim()) void router.push({ path: '/character', query: { q: query.value.trim() } });
}

const COVER_INTERVAL_MS = 5200;

const coverIndex = ref(0);
const coverPaused = ref(false);
let coverTimer: ReturnType<typeof setInterval> | null = null;

function stopCoverRotation(): void {
  if (coverTimer === null) return;
  clearInterval(coverTimer);
  coverTimer = null;
}

function startCoverRotation(): void {
  stopCoverRotation();
  if ((release.value?.cover.length ?? 0) < 2) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  coverTimer = setInterval(() => {
    if (coverPaused.value) return;
    const total = release.value?.cover.length ?? 0;
    if (total < 2) return;
    coverIndex.value = (coverIndex.value + 1) % total;
  }, COVER_INTERVAL_MS);
}

function selectCover(index: number): void {
  coverIndex.value = index;
}

watch(release, () => {
  coverIndex.value = 0;
  startCoverRotation();
});

const art = ref<{ src: string; fallback: string; alt: string } | null>(null);
const artDialog = ref<HTMLDialogElement | null>(null);
const artLabel = computed(() => (art.value ? t('home.viewArt', { name: art.value.alt }) : ''));

function openArt(entry: HomeEntry): void {
  if (!entry.plate) return;
  art.value = { src: entry.plate, fallback: entry.plateFallback, alt: entry.name };
  artDialog.value?.showModal();
}

function closeArt(): void {
  artDialog.value?.close();
}

onMounted(() => {
  prefetchHighPriority();
  void load();
});

onBeforeUnmount(stopCoverRotation);
</script>

<template>
  <div id="nk-home-app" :style="{ '--nk-home-ground': `url(${groundUrl})` }">
    <main class="nk-intake nk-home">
      <header class="nk-hub-masthead">
        <h1 class="nk-hub-masthead__title">{{ SITE_NAME }}</h1>
        <p class="nk-hub-masthead__tagline">{{ t('home.tagline') }}</p>
      </header>

      <div
        v-if="!loaded"
        class="nk-home__skeleton"
        role="status"
        aria-live="polite"
        :aria-label="t('home.loadingAria')"
      >
        <div class="nk-home__skeleton-main">
          <span class="nk-sk nk-sk--shimmer nk-home__skeleton-version" aria-hidden="true"></span>
          <span v-for="label in labels" :key="label" class="nk-sk nk-sk--shimmer nk-home__skeleton-row" aria-hidden="true"></span>
        </div>
        <span class="nk-sk nk-sk--shimmer nk-home__skeleton-cover" aria-hidden="true"></span>
      </div>

      <div v-else-if="allFailed" class="nk-error-state" role="alert">
        <div class="nk-error-state__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </div>
        <div class="nk-error-state__title">{{ t('home.errorTitle') }}</div>
        <div class="nk-error-state__detail">{{ t('home.errorDetail', { labels: labels.join(' / ') }) }}</div>
        <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
      </div>

      <template v-else-if="release">
        <p v-if="partialFailed" class="nk-home__notice" role="status">
          {{ t('home.partialDetail', { n: failedCount }) }}
          <button class="nk-home__retry" type="button" @click="load">{{ t('common.retry') }}</button>
        </p>

        <section class="nk-home__release" :aria-label="t('home.ledger')">
          <div class="nk-home__release-main">
            <p class="nk-home__stamp">
              <span class="nk-home__version">{{ release.version || t('home.releaseTitleNoVersion') }}</span>
              <span v-if="release.version" class="nk-home__stamp-note">{{ t('home.releaseTitleNoVersion') }}</span>
            </p>
            <p v-if="release.syncedAt" class="nk-home__date">{{ t('home.releaseDate', { date: release.syncedAt }) }}</p>

            <template v-if="entries.length">
              <h2 class="nk-home__ledger-title">
                {{ t('home.ledger') }}<span class="nk-home__ledger-count">{{ release.total }}</span>
              </h2>
              <ol class="nk-home__ledger">
                <li v-for="entry in entries" :key="`${entry.kind}-${entry.id}`" class="nk-home__ledger-item">
                  <RouterLink class="nk-home__ledger-link" :to="entry.to">
                    <span class="nk-home__ledger-kind">{{ kindLabel[entry.kind] }}</span>
                    <span class="nk-home__ledger-name">{{ entry.name }}</span>
                    <span class="nk-home__ledger-facts">
                      <span v-if="factLine(entry)">{{ factLine(entry) }}</span>
                      <span v-if="entry.kind !== 'relic' && entry.rarity" class="nk-home__ledger-rarity">
                        <span class="nk-home__star" aria-hidden="true" v-html="STAR_SVG"></span>{{ entry.rarity }}
                      </span>
                    </span>
                    <svg class="nk-home__ledger-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </RouterLink>
                </li>
              </ol>
            </template>
            <p v-else class="nk-home__empty">{{ t('home.empty') }}</p>

            <form class="nk-home__search" role="search" @submit.prevent="submitSearch">
              <input
                v-model="query"
                class="nk-home__search-input"
                type="search"
                name="q"
                autocomplete="off"
                :placeholder="t('home.searchPlaceholder')"
                :aria-label="t('home.searchAria')"
              >
              <button class="nk-home__search-go" type="submit" :aria-label="t('home.searchAria')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" /><path d="M20 20l-4.2-4.2" stroke-linecap="round" />
                </svg>
              </button>
              <ul v-if="searchActive" class="nk-home__results" role="list">
                <li v-for="item in results" :key="`${item.kind}-${item.id}`">
                  <RouterLink class="nk-home__result" :to="item.to" @click="query = ''">
                    <span class="nk-home__result-kind">{{ kindLabel[item.kind] }}</span>
                    <span class="nk-home__result-name">{{ item.name }}</span>
                    <span class="nk-home__result-stars" aria-hidden="true"><span v-for="n in item.rarity" :key="n" class="nk-home__result-star" v-html="STAR_SVG" /></span>
                  </RouterLink>
                </li>
                <li v-if="!results.length" class="nk-home__result-empty">{{ t('home.searchEmpty') }}</li>
              </ul>
            </form>
          </div>

          <div
            v-if="release.cover.length"
            class="nk-home__cover"
            @mouseenter="coverPaused = true"
            @mouseleave="coverPaused = false"
            @focusin="coverPaused = true"
            @focusout="coverPaused = false"
          >
            <img
              v-for="(cover, i) in release.cover"
              :key="cover.src"
              class="nk-home__cover-img"
              :src="cover.src"
              :data-cdn-fallback="cover.fallback"
              :alt="cover.alt"
              :data-active="i === coverIndex"
              :aria-hidden="i === coverIndex ? undefined : 'true'"
              loading="eager"
            >
            <div v-if="release.cover.length > 1" class="nk-home__cover-dots">
              <button
                v-for="(cover, i) in release.cover"
                :key="cover.src"
                type="button"
                class="nk-home__cover-dot"
                :aria-current="i === coverIndex ? 'true' : undefined"
                :aria-label="t('home.viewArt', { name: cover.alt })"
                @click="selectCover(i)"
              />
            </div>
          </div>
        </section>

        <section v-if="release.characters.length" class="nk-home__section" data-kind="character" :aria-label="t('nav.character')">
          <header class="nk-home__head">
            <h2 class="nk-home__title">{{ t('nav.character') }}<span class="nk-home__count">{{ release.characters.length }}</span></h2>
            <RouterLink class="nk-home__all" to="/character">
              {{ t('home.viewAll', { label: t('nav.character') }) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </header>
          <div class="nk-home__chars" :data-count="release.characters.length">
            <article v-for="character in release.characters" :key="character.id" class="nk-home__char">
              <div class="nk-home__char-art">
                <img
                  :src="character.plate"
                  :data-cdn-fallback="character.plateFallback"
                  :alt="character.name"
                  loading="lazy"
                >
              </div>
              <div class="nk-home__char-copy">
                <h3 class="nk-home__char-name">{{ character.name }}</h3>
                <p class="nk-home__facts">
                  <span v-for="fact in character.facts" :key="fact.text" class="nk-home__fact">
                    <img v-if="fact.icon" class="nk-home__fact-icon" :src="fact.icon" alt="" loading="lazy">
                    <span>{{ fact.text }}</span>
                  </span>
                  <span class="nk-home__rarity">
                    <span class="nk-home__star" aria-hidden="true" v-html="STAR_SVG"></span>{{ character.rarity }}
                  </span>
                </p>
                <p v-if="character.brief" class="nk-home__brief" v-html="character.brief"></p>
              </div>
              <div
                v-if="character.eidolons.length"
                class="nk-home__orbit"
                role="group"
                :aria-labelledby="`nk-home-eidolons-${character.id}`"
              >
                <span :id="`nk-home-eidolons-${character.id}`" class="nk-home__orbit-label">{{ t('home.eidolons') }}</span>
                <div class="nk-home__orbit-stage">
                  <img
                    class="nk-home__orbit-plate"
                    :src="character.plate"
                    :data-cdn-fallback="character.plateFallback"
                    :alt="character.name"
                    loading="lazy"
                  >
                  <span class="nk-home__orbit-rail" aria-hidden="true"></span>
                  <ul class="nk-home__icon-list nk-home__icon-list--eidolon">
                    <li
                      v-for="(eidolon, index) in character.eidolons"
                      :key="eidolon.name"
                      class="nk-home__icon nk-home__orbit-slot"
                      :style="{ '--nk-orbit-index': index }"
                    >
                      <span class="nk-home__orbit-arm">
                        <span class="nk-home__orbit-upright">
                          <span class="nk-home__orbit-face">
                            <img :src="eidolon.icon" :data-cdn-fallback="eidolon.fallback" :alt="eidolon.name" loading="lazy">
                          </span>
                        </span>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              <div class="nk-home__char-acts">
                <RouterLink class="nk-home__cta" :to="character.to">{{ t('home.viewArchive') }}</RouterLink>
                <button
                  v-if="character.art"
                  class="nk-home__art-link"
                  type="button"
                  @click="openArt(character)"
                >{{ t('home.viewArt', { name: character.name }) }}</button>
              </div>
            </article>
          </div>
        </section>

        <section v-if="release.lightcones.length" class="nk-home__section" data-kind="lightcone" :aria-label="t('nav.lightcone')">
          <header class="nk-home__head">
            <h2 class="nk-home__title">{{ t('nav.lightcone') }}<span class="nk-home__count">{{ release.lightcones.length }}</span></h2>
            <RouterLink class="nk-home__all" to="/lightcone">
              {{ t('home.viewAll', { label: t('nav.lightcone') }) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </header>
          <ul class="nk-home__cones">
            <li v-for="cone in release.lightcones" :key="cone.id" class="nk-home__cone">
              <div class="nk-home__cone-art">
                <img :src="cone.plate" :data-cdn-fallback="cone.plateFallback" :alt="cone.name" loading="lazy">
              </div>
              <div class="nk-home__cone-body">
                <h3 class="nk-home__cone-name">{{ cone.name }}</h3>
                <p class="nk-home__facts">
                  <span v-for="fact in cone.facts" :key="fact.text" class="nk-home__fact">
                    <img v-if="fact.icon" class="nk-home__fact-icon" :src="fact.icon" alt="" loading="lazy">
                    <span>{{ fact.text }}</span>
                  </span>
                  <span class="nk-home__rarity">
                    <span class="nk-home__star" aria-hidden="true" v-html="STAR_SVG"></span>{{ cone.rarity }}
                  </span>
                </p>
                <p v-if="cone.skillName" class="nk-home__cone-skill">{{ cone.skillName }}</p>
                <p v-if="cone.skillDesc" class="nk-home__brief nk-home__brief--cone" v-html="cone.skillDesc"></p>
                <RouterLink class="nk-home__cta" :to="cone.to">{{ t('home.viewArchive') }}</RouterLink>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="release.relics.length" class="nk-home__section" data-kind="relic" :aria-label="t('nav.relic')">
          <header class="nk-home__head">
            <h2 class="nk-home__title">{{ t('nav.relic') }}<span class="nk-home__count">{{ release.relics.length }}</span></h2>
            <RouterLink class="nk-home__all" to="/relic">
              {{ t('home.viewAll', { label: t('nav.relic') }) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </RouterLink>
          </header>
          <div class="nk-home__relics">
            <article v-for="relic in release.relics" :key="relic.id" class="nk-home__relic">
              <div class="nk-home__relic-art">
                <img :src="relic.plate" :data-cdn-fallback="relic.plateFallback" :alt="relic.name" loading="lazy">
              </div>
              <div class="nk-home__relic-body">
                <h3 class="nk-home__relic-name">{{ relic.name }}</h3>
                <dl class="nk-home__effects">
                  <template v-if="relic.set4">
                    <dt class="nk-home__effect-tag">{{ t('relic.setPieces', { n: 4 }) }}</dt>
                    <dd class="nk-home__effect-desc" v-html="relic.set4"></dd>
                  </template>
                  <template v-if="relic.set2">
                    <dt class="nk-home__effect-tag">{{ t('relic.setPieces', { n: 2 }) }}</dt>
                    <dd class="nk-home__effect-desc" v-html="relic.set2"></dd>
                  </template>
                </dl>
                <RouterLink class="nk-home__cta" :to="relic.to">{{ t('home.viewArchive') }}</RouterLink>
              </div>
            </article>
          </div>
        </section>
      </template>
    </main>

    <footer class="nk-hub-footer">
      <div v-if="release && release.total" class="nk-home__totals">
        <RouterLink class="nk-home__total" to="/character">
          <span class="nk-home__total-num">{{ release.totals.characters }}</span>
          <span class="nk-home__total-label">{{ t('nav.character') }}</span>
        </RouterLink>
        <RouterLink class="nk-home__total" to="/lightcone">
          <span class="nk-home__total-num">{{ release.totals.lightcones }}</span>
          <span class="nk-home__total-label">{{ t('nav.lightcone') }}</span>
        </RouterLink>
        <RouterLink class="nk-home__total" to="/relic">
          <span class="nk-home__total-num">{{ release.totals.relics }}</span>
          <span class="nk-home__total-label">{{ t('nav.relic') }}</span>
        </RouterLink>
      </div>
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
    </footer>

    <dialog ref="artDialog" class="nk-home__dialog" :aria-label="artLabel" @close="art = null">
      <button class="nk-home__dialog-close" type="button" :aria-label="t('home.closeArt')" @click="closeArt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
      <figure v-if="art" class="nk-home__dialog-fig">
        <img class="nk-home__dialog-img" :src="art.src" :data-cdn-fallback="art.fallback" :alt="art.alt">
        <figcaption class="nk-home__dialog-cap">{{ art.alt }}</figcaption>
      </figure>
    </dialog>
  </div>
</template>
