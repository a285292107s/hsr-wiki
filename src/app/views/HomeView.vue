<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { useAppStore } from '../stores/app';
import { useReleaseShowcase } from '../composables/use-release-showcase';
import { prefetchHighPriority } from '../router/chunks';
import { SITE_NAME } from '../../lib/constants';
import { cdnFallbackFromPrimary, cdnUri } from '../../services/cdn';
import { STAR_SVG } from '../catalog/pages/shared';
import '../../styles/home.css';

const app = useAppStore();
const { sections, loaded, failedCount, labels, load } = useReleaseShowcase();

const groundUrl = cdnUri('bgpic', 'BgWiki.webp');

const totalCount = computed(() => sections.value.reduce((n, s) => n + s.count, 0));

const allFailed = computed(() => labels.length > 0 && failedCount.value >= labels.length);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);

const art = ref<{ src: string; alt: string } | null>(null);
const artDialog = ref<HTMLDialogElement | null>(null);
const artFallback = computed(() => (art.value ? cdnFallbackFromPrimary(art.value.src) : ''));

function openArt(name: string, src?: string): void {
  if (!src) return;
  art.value = { src, alt: name };
  artDialog.value?.showModal();
}
function closeArt(): void {
  artDialog.value?.close();
}
const artLabel = computed(() => (art.value ? t('home.viewArt', { name: art.value.alt }) : ''));

function eagerArt(html: string): string {
  return html.replace(/ loading="lazy"/g, ' loading="eager"');
}

function plateFallback(src?: string): string {
  return src ? cdnFallbackFromPrimary(src) : '';
}

onMounted(() => {
  prefetchHighPriority();
  void load();
});
</script>

<template>
  <div id="nk-home-app" :style="{ '--nk-home-ground': `url(${groundUrl})` }">
    <main class="nk-intake">
      <header class="nk-hub-masthead">
        <h1 class="nk-hub-masthead__title">{{ SITE_NAME }}</h1>
        <p class="nk-hub-masthead__tagline">{{ t('home.tagline') }}</p>
      </header>

      <div class="nk-intake__head">
        <p
          class="nk-intake__batch"
          :aria-label="app.versionLabel ? t('home.releaseTitle', { version: app.versionLabel }) : undefined"
        >
          <span class="nk-intake__batch-num">{{ app.versionLabel || t('home.releaseTitleNoVersion') }}</span>
          <span v-if="app.versionLabel" class="nk-intake__batch-note">{{ t('home.releaseTitleNoVersion') }}</span>
        </p>
        <p v-if="loaded && totalCount > 0" class="nk-intake__claim">
          {{ t('home.batchCount', { n: totalCount }) }}
        </p>
      </div>

      <div
        v-if="!loaded"
        class="nk-hub-release__sk"
        role="status"
        aria-live="polite"
        :aria-label="t('home.loadingAria')"
      >
        <div v-for="label in labels" :key="label" class="nk-hub-release__sk-row">
          <div class="nk-hub-release__label">{{ label }}</div>
          <div class="nk-hub-release__sk-band">
            <span class="nk-sk nk-sk--shimmer nk-hub-release__sk-card" aria-hidden="true"></span>
          </div>
        </div>
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

      <template v-else-if="sections.length">
        <p v-if="partialFailed" class="nk-hub-release__notice" role="status">
          {{ t('home.partialDetail', { n: failedCount }) }}
          <button class="nk-error-state__retry" type="button" @click="load">{{ t('common.retry') }}</button>
        </p>

        <section
          v-for="s in sections"
          :key="s.kind"
          class="nk-hub-release__section"
          :class="{ 'nk-hub-release__section--feature': s.feature }"
          :data-kind="s.kind"
          :aria-label="s.label"
        >
          <div class="nk-hub-release__sechead">
            <h3 class="nk-hub-release__label">{{ s.label }} <span class="nk-hub-release__label-count">{{ s.count }}</span></h3>
            <RouterLink class="nk-hub-release__all" :to="s.listHref">
              {{ t('home.viewAll', { label: s.label }) }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </RouterLink>
          </div>
          <div v-if="s.feature" class="nk-hub-release__band nk-hub-release__band--feature">
            <div class="nk-hub-release__cell">
              <a
                v-if="s.leadMeta?.plateSrc && s.leadMeta.href"
                class="nk-hub-release__plate"
                :href="s.leadMeta.href"
              >
                <img
                  class="nk-hub-release__plate-img"
                  :src="s.leadMeta.plateSrc"
                  :data-cdn-fallback="plateFallback(s.leadMeta.plateSrc) || undefined"
                  :alt="s.leadMeta.name"
                >
              </a>
            </div>
            <aside
              v-if="s.leadMeta"
              class="nk-hub-release__spec"
              :aria-label="s.leadMeta.name"
            >
              <h4 class="nk-hub-release__spec-name">{{ s.leadMeta.name }}</h4>
              <p
                v-if="s.leadMeta.facts?.length || s.leadMeta.rarity"
                class="nk-hub-release__spec-facts"
              >
                <span v-for="f in s.leadMeta.facts" :key="f" class="nk-hub-release__spec-fact">{{ f }}</span>
                <span
                  v-if="s.leadMeta.rarity"
                  class="nk-hub-release__spec-fact nk-hub-release__spec-rarity"
                  :aria-label="`${t('catalog.filter.rarity')} ${s.leadMeta.rarity}`"
                >
                  <span class="nk-hub-release__spec-star" aria-hidden="true" v-html="STAR_SVG" />{{ s.leadMeta.rarity }}
                </span>
              </p>
              <p v-if="s.leadMeta.brief" class="nk-hub-release__spec-brief" v-html="s.leadMeta.brief"></p>
              <div class="nk-hub-release__spec-acts">
                <RouterLink v-if="s.leadMeta.href" class="nk-hub-release__spec-link" :to="s.leadMeta.href">
                  {{ t('home.viewArchive') }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </RouterLink>
                <button
                  v-if="s.leadMeta.artSrc"
                  class="nk-hub-release__art"
                  type="button"
                  @click="openArt(s.leadMeta.name, s.leadMeta.artSrc)"
                >{{ t('home.viewArt', { name: s.leadMeta.name }) }}</button>
              </div>
            </aside>
          </div>
          <div v-else class="nk-hub-release__band" v-html="eagerArt(s.html)"></div>
        </section>
      </template>
      <p v-else class="nk-hub-release__empty">{{ t('home.empty') }}</p>
    </main>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
    </footer>

    <dialog ref="artDialog" class="nk-intake__art" :aria-label="artLabel" @close="art = null">
      <button class="nk-intake__art-close" type="button" :aria-label="t('home.closeArt')" @click="closeArt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
      <img
        v-if="art"
        class="nk-intake__art-img"
        :src="art.src"
        :data-cdn-fallback="artFallback || undefined"
        :alt="art.alt"
      >
    </dialog>
  </div>
</template>
