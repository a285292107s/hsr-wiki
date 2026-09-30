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
          :data-kind="s.kind"
          :aria-label="s.label"
        >
          <h3 class="nk-hub-release__label">{{ s.label }}</h3>
          <div class="nk-hub-release__band" v-html="s.html"></div>
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
