<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
import { useCwReleaseShowcase } from '../composables/use-release-showcase';
import '../../styles/currency-hub.css';

const { sections, loaded, failedCount, labels, skKinds, load } = useCwReleaseShowcase();

/* 与首页同一套三态判据（共享 splitSources）：全失败 ⇒「本赛季有没有新增」不可判定，
   必须给错误态；部分失败 ⇒ 已拿到的分区照常渲染 + 一行说明。 */
const allFailed = computed(() => labels.length > 0 && failedCount.value >= labels.length);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-cwhub-app">
    <header class="nk-hub-brand">
      <div class="nk-hub-brand__scrim" aria-hidden="true"></div>
      <div class="nk-hub-brand__content">
        <p class="nk-hub-brand__supra">CURRENCY WAR · GRID FIGHT</p>
        <h1 class="nk-hub-brand__title">{{ t('catalog.currencyWar') }}</h1>
        <p class="nk-hub-brand__tagline">
          {{ t('cwHub.tagline') }}
        </p>
      </div>
    </header>

    <main class="nk-hub-release">
      <div class="nk-hub-release__head">
        <h2 class="nk-hub-release__title">{{ t('cwHub.releaseTitle') }}</h2>
        <span class="nk-hub-release__rule" aria-hidden="true"></span>
      </div>

      <!-- 加载期骨架与首页同一套原语；骨架行带 data-sk，页面 CSS 据此按该族真实卡形定几何。
           骨架不渲染 `.nk-hub-release__section` —— 该选择器是「数据已就绪」的判定依据。 -->
      <div
        v-if="!loaded"
        class="nk-hub-release__sk"
        role="status"
        aria-live="polite"
        :aria-label="t('cwHub.loadingAria')"
      >
        <div v-for="(label, i) in labels" :key="label" class="nk-hub-release__sk-row" :data-sk="skKinds[i]">
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
        <div class="nk-error-state__title">{{ t('cwHub.errorTitle') }}</div>
        <div class="nk-error-state__detail">{{ t('cwHub.errorDetail', { labels: labels.join(' / ') }) }}</div>
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
          <div class="nk-hub-release__band" v-html="s.html"></div>
        </section>
      </template>
      <p v-else class="nk-hub-release__empty">{{ t('cwHub.empty') }}</p>
    </main>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">{{ t('ui.footerMotto') }}</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>