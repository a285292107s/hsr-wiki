<script setup lang="ts">
/**
 * 货币战争模式枢纽页(/currency)：模式身份页 + 本赛季新增页（ADR 0020 决策 1/2/5/6）。
 * 到达方式 = CW 枢纽 Tab（导航条全站恒在，ADR 0019）；**不是「交换」落点**（后者跳图签页，ADR 0016 决策 1）。
 * 结构 = 紧凑品牌带（.nk-hub-brand，声明 tokens.css）+ 本赛季新增两分区（角色图鉴 / 羁绊图鉴）+ 共享页脚；
 * 5 行板块索引已整体退场（选路交给导航条，与 `/` 同策）——禁止恢复该类选择器（索引块已整体删除）。
 * 判据 = 赛季代际差集（converter 写 is_season_new，前端只读该字段，见 use-release-showcase.ts 的 pickSeasonNew）；
 * 文案恒为「本赛季新增」，**禁止显示赛季号 / 版本号**（当前代编号 1 与旧代 101/102/103 体系不一致，ADR 0020 决策 5）。
 * 无增量的分区不渲染，两分区皆空则唯一一行空态（决策 6）；卡片 HTML 由两个目录配置的 renderCard 产出，
 * **禁止**在本页另写卡片模板或复制卡片 CSS。
 * 样式实现于 currency-hub.css（随本路由 chunk 懒加载）；视觉基调与禁令见该文件头注释。
 *
 * **禁止恢复全屏背景视频 / poster 帧 / 枢纽滚轮**（ADR 0018 决策，恢复前必须先改 ADR）：
 * - Hero 视频（cw-hero.mp4，本地随站 5.09MB）+ poster 兜底帧已随工具化移除，品牌带为纯令牌渐变；
 * - 跨模式通路只走侧栏「交换」（ADR 0019 决策 6）：本页不再设页内跨模式行，禁止再补。
 */
import { onMounted } from 'vue';
import { useCwReleaseShowcase } from '../composables/use-release-showcase';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

const { sections, loaded, load } = useCwReleaseShowcase();

onMounted(() => { void load(); });
</script>

<template>
  <div id="nk-cwhub-app">
    <!-- 品牌带：跨页共享原语（tokens.css），与 `/` 共用同一份骨架与断点 -->
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

    <!-- 本赛季新增：两分区（角色图鉴 / 羁绊图鉴）各一行横向卡片带（ADR 0020 决策 1/6）；
         区块骨架 = 跨页共享原语 .nk-hub-release（声明 catalog.css，本页禁止复制）；
         卡片 HTML 由目录配置 renderCard 产出（v-html），取数 / 过滤见 use-release-showcase.ts。
         禁止在此补「设置 / 交换」工具组，也禁止补任何页内跨模式行（ADR 0019 决策 6）：导航条全断点恒在。 -->
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
          <h3 class="nk-hub-release__label">{{ s.label }}</h3>
          <div class="nk-hub-release__band" v-html="s.html"></div>
        </section>
      </template>
      <!-- 两分区皆无增量（*Old 代际表缺失 / 本赛季无扩充）：不回退板块索引（ADR 0020 决策 6） -->
      <p v-else-if="loaded" class="nk-hub-release__empty">本赛季暂无新增条目</p>
    </div>

    <!-- 页脚：跨页共享原语 .nk-hub-footer（声明于 tokens.css，与常规枢纽页共用同一份骨架） -->
    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
