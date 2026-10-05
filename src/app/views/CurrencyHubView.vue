<script setup lang="ts">
import { onMounted } from 'vue';
import { useCwReleaseShowcase } from '../composables/use-release-showcase';
import '../../styles/currency-hub.css';

const { sections, loaded, load } = useCwReleaseShowcase();

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-cwhub-app">
    <header class="nk-hub-brand">
      <div class="nk-hub-brand__scrim" aria-hidden="true"></div>
      <div class="nk-hub-brand__content">
        <p class="nk-hub-brand__supra">CURRENCY WAR · GRID FIGHT</p>
        <h1 class="nk-hub-brand__title">货币战争</h1>
        <p class="nk-hub-brand__tagline">
          赢者通吃的零和博弈。招募、羁绊、站位、策略，构筑你的最强阵容。
        </p>
      </div>
    </header>

    <div class="nk-hub-release">
      <div class="nk-hub-release__head">
        <h2 class="nk-hub-release__title">本赛季新增</h2>
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
          <h3 class="nk-hub-release__label">{{ s.label }}<span class="nk-hub-release__label-count">{{ s.count }}</span></h3>
          <div class="nk-hub-release__band" v-html="s.html"></div>
        </section>
      </template>
      <p v-else-if="loaded" class="nk-hub-release__empty">本赛季暂无新增条目</p>
    </div>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
