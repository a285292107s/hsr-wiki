<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import { useReleaseShowcase } from '../composables/use-release-showcase';
import { prefetchHighPriority } from '../router/chunks';
import { SITE_NAME } from '../../lib/constants';

const app = useAppStore();
const { sections, loaded, failedCount, labels, load } = useReleaseShowcase();

const releaseTitle = computed(() =>
  app.versionLabel ? `${app.versionLabel} 版本上新` : '版本上新',
);

/* 三份索引全失败 ⇒「本版本有没有新增」根本不可判定，必须给错误态：
   显示空态等于把一次网络故障写成「本版本暂无新增条目」这句事实陈述。
   只失败一部分 ⇒ 已拿到的分区照常渲染 + 一行说明（静默少一个分区同样会被读成「本版本没有」）。 */
const allFailed = computed(() => labels.length > 0 && failedCount.value >= labels.length);
const partialFailed = computed(() => failedCount.value > 0 && !allFailed.value);

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

    <main class="nk-hub-release">
      <div class="nk-hub-release__head">
        <div class="nk-hub-release__heading">
          <p class="nk-hub-release__kicker">LATEST TRANSMISSION</p>
          <h2 class="nk-hub-release__title">{{ releaseTitle }}</h2>
        </div>
        <span class="nk-hub-release__rule" aria-hidden="true"></span>
        <p class="nk-hub-release__edition" aria-label="角色、光锥与遗器">
          <span class="nk-hub-release__edition-item">CHARACTER</span>
          <span class="nk-hub-release__edition-item">LIGHT CONE</span>
          <span class="nk-hub-release__edition-item">RELIC</span>
        </p>
      </div>

      <!-- 加载期：分区标签与卡片位按就绪态的规格占位（桌面 306×408 = 单条目特写档的卡），
           不渲染 `.nk-hub-release__section` —— 该选择器是「数据已就绪」的判定依据。 -->
      <div
        v-if="!loaded"
        class="nk-hub-release__sk"
        role="status"
        aria-live="polite"
        aria-label="版本上新加载中"
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
        <div class="nk-error-state__title">版本索引加载失败</div>
        <div class="nk-error-state__detail">{{ labels.join(' / ') }}三类索引都没取到，无法判定本版本新增，重试即可恢复。</div>
        <button class="nk-error-state__retry" type="button" @click="load">重试</button>
      </div>

      <template v-else-if="sections.length">
        <p v-if="partialFailed" class="nk-hub-release__notice" role="status">
          有 {{ failedCount }} 类索引未取到，本次未包含其分区。
          <button class="nk-error-state__retry" type="button" @click="load">重试</button>
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
              全部{{ s.label }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </RouterLink>
          </div>
          <div v-if="s.feature" class="nk-hub-release__band nk-hub-release__band--feature">
            <div class="nk-hub-release__cell" v-html="s.html"></div>
            <aside
              v-if="s.leadMeta"
              class="nk-hub-release__spec"
              :aria-label="s.leadMeta.name"
            >
              <h4 class="nk-hub-release__spec-name">{{ s.leadMeta.name }}</h4>
              <p v-if="s.leadMeta.brief" class="nk-hub-release__spec-brief" v-html="s.leadMeta.brief"></p>
              <RouterLink v-if="s.leadMeta.href" class="nk-hub-release__spec-link" :to="s.leadMeta.href">
                查看档案
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </RouterLink>
            </aside>
          </div>
          <div v-else class="nk-hub-release__band" v-html="s.html"></div>
        </section>
      </template>
      <p v-else class="nk-hub-release__empty">本版本暂无新增条目</p>
    </main>

    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
