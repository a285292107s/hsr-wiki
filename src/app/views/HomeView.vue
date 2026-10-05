<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import { useReleaseShowcase } from '../composables/use-release-showcase';
import { prefetchHighPriority } from '../router/chunks';
import { SITE_NAME } from '../../lib/constants';

const app = useAppStore();
const { sections, loaded, load } = useReleaseShowcase();

const releaseTitle = computed(() =>
  app.versionLabel ? `${app.versionLabel} 版本上新` : '版本上新',
);

onMounted(() => {
  prefetchHighPriority();
  void load();
});
</script>

<template>
  <div id="nk-home-app">
    <header class="nk-hub-brand">
      <div class="nk-hub-brand__scrim" aria-hidden="true"></div>
      <div class="nk-hub-brand__content">
        <p class="nk-hub-brand__supra">HSR DATA ARCHIVE</p>
        <h1 class="nk-hub-brand__title">{{ SITE_NAME }}</h1>
        <p class="nk-hub-brand__tagline">角色 · 光锥 · 遗器，全图鉴数据</p>
      </div>
    </header>

    <div class="nk-hub-release">
      <div class="nk-hub-release__head">
        <h2 class="nk-hub-release__title">{{ releaseTitle }}</h2>
        <span class="nk-hub-release__rule" aria-hidden="true"></span>
      </div>

      <template v-if="loaded && sections.length">
        <section
          v-for="s in sections"
          :key="s.kind"
          class="nk-hub-release__section"
          :class="{ 'nk-hub-release__section--feature': s.feature }"
          :data-kind="s.kind"
          :aria-label="s.label"
        >
          <h3 class="nk-hub-release__label">{{ s.label }}<span class="nk-hub-release__label-count">{{ s.count }}</span></h3>
          <div v-if="s.feature && s.cards && s.positions" class="nk-hub-release__band nk-hub-release__band--feature">
            <div
              v-for="(card, i) in s.cards"
              :key="i"
              class="nk-hub-release__cell"
              :data-pos="s.positions[i]"
              v-html="card"
            ></div>
            <aside
              v-if="s.positions[0] === 'lead' && s.leadMeta"
              class="nk-hub-release__spec"
              :aria-label="s.leadMeta.name"
            >
              <h4 class="nk-hub-release__spec-name">{{ s.leadMeta.name }}</h4>
              <RouterLink v-if="s.leadMeta.href" class="nk-hub-release__spec-link" :to="s.leadMeta.href">
                查看档案
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </RouterLink>
            </aside>
          </div>
          <div v-else class="nk-hub-release__band" v-html="s.html"></div>
        </section>
      </template>
      <p v-else-if="loaded" class="nk-hub-release__empty">本版本暂无新增条目</p>
    </div>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
