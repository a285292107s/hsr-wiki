<script setup lang="ts">
/**
 * 首页 `/`：站点首页 —— 版本上新页（ADR 0019 决策 2/3/8/9/10）。
 *
 * 结构 = 紧凑品牌带（.nk-hub-brand，声明 tokens.css）+ 本版本新增三分区（角色/光锥/遗器）+ 共享页脚。
 * 全站板块索引整体退场，选路由导航条承担（决策 2/6）；跨模式只走侧栏「交换」。
 * 三分区各成一行横向卡片带，无增量的分区不渲染，三分区皆空则显示唯一一行空态（决策 9/10）。
 * 取数与卡片 HTML 全部复用目录配置的 fetchData() / renderCard()（见 use-release-showcase.ts），
 * **禁止**为首页另写卡片组件或复制卡片 CSS。
 *
 * 首屏密度（决策 8）：1920×1080 内品牌带（200px，**禁止改高度**）+ 三分区标题 + 各自首行卡片必须完整可见；
 * 节拍靠字号/间距/卡片宽度调节，禁改品牌带与页脚原语。
 *
 * **禁止恢复全屏 KV Spine 场景 / 五星立绘轮播 / 枢纽滚轮**（ADR 0018 决策 2/3/4 继续有效，恢复前必须先改 ADR）：
 * - KV 场景（home-bg）为 15 个 CDN 资源共 8.23MB + spine-player 运行时 587KB，只为装饰首屏；
 * - 枢纽滚轮的立论是「枢纽页是全屏 KV/视频展示页」——品牌带形态下 Hero 仅 200px，滚轮劫持会把
 *   「从顶部正常下滚」变成跳转；跨模式通路已由导航条「交换」承担（ADR 0019 决策 6）。
 */
import { computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';
import { useReleaseShowcase } from '../composables/use-release-showcase';
import { prefetchHighPriority } from '../router/chunks';
import { SITE_NAME } from '../../lib/constants';

const app = useAppStore();
const { sections, loaded, load } = useReleaseShowcase();

/** 标题恒含本版本号（version.json 缺失时才退化为无版本号的「版本上新」） */
const releaseTitle = computed(() =>
  app.versionLabel ? `${app.versionLabel} 版本上新` : '版本上新',
);

onMounted(() => {
  prefetchHighPriority();
  // 版本与新上三分区（含 version.json 加载；单来源失败只跳过该分区，永不 reject）
  void load();
});
</script>

<template>
  <div id="nk-home-app">
    <!-- 品牌带：跨页共享原语（tokens.css），与 /currency 共用同一份骨架与断点 -->
    <header class="nk-hub-brand">
      <div class="nk-hub-brand__scrim" aria-hidden="true"></div>
      <div class="nk-hub-brand__content">
        <p class="nk-hub-brand__supra">HSR DATA ARCHIVE</p>
        <h1 class="nk-hub-brand__title">{{ SITE_NAME }}</h1>
        <p class="nk-hub-brand__tagline">角色 · 光锥 · 遗器，全图鉴数据</p>
      </div>
    </header>

    <!-- 本版本上新：三分区（角色/光锥/遗器）各一行横向卡片带；卡片 HTML 由 renderCard 产出（v-html） -->
    <div class="nk-home-release">
      <div class="nk-home-release__head">
        <h2 class="nk-home-release__title">{{ releaseTitle }}</h2>
        <span class="nk-home-release__rule" aria-hidden="true"></span>
      </div>

      <template v-if="loaded && sections.length">
        <section
          v-for="s in sections"
          :key="s.kind"
          class="nk-home-release__section"
          :data-kind="s.kind"
          :aria-label="s.label"
        >
          <h3 class="nk-home-release__label">{{ s.label }}</h3>
          <div class="nk-home-release__band" v-html="s.html"></div>
        </section>
      </template>
      <!-- 三分区皆无增量（基线缺失 / 本版本无新增）：不回退板块索引、不改显历史版本（决策 10） -->
      <p v-else-if="loaded" class="nk-home-release__empty">本版本暂无新增条目</p>
    </div>

    <!-- 页脚：跨页共享原语，与 CW 枢纽页共用（声明于 tokens.css，禁止在两页各写一份） -->
    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
