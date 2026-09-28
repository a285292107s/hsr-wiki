<script setup lang="ts">
/**
 * 货币战争模式枢纽页(/currency)：模式身份页 + 选路页，与 HomeView 对等。
 * 到达方式 = CW 枢纽 Tab（导航条全站恒在，ADR 0019）；**不是「交换」落点**（后者跳图签页，ADR 0016 决策 1）。
 * 样式实现于 currency-hub.css（随本路由 chunk 懒加载）；视觉基调与禁令见该文件头注释。
 *
 * 工具化形态（ADR 0018）：结构 = 紧凑品牌带（.nk-hub-brand，声明 tokens.css）+ 板块索引 + 共享页脚。
 * **禁止恢复全屏背景视频 / poster 帧 / 枢纽滚轮**（恢复前必须先改 ADR 0018）：
 * - Hero 视频（cw-hero.mp4，本地随站 5.09MB）+ poster 兜底帧已随工具化移除，品牌带为纯令牌渐变；
 * - 枢纽滚轮与 `/` 一并移除（立论随「全屏展示页」前提消失，理由见 HomeView.vue 注释）；
 * - 跨模式通路只走侧栏「交换」（ADR 0019 决策 6）：本页不再设页内跨模式行，禁止再补
 *   （旧立论「无侧栏形态下的唯一页内通路」已随导航条回归消失）。
 */
import { RouterLink } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

/* ─── 板块入口：5 板块全部上线（路由与目录页配置均已注册，无占位） ─── */
const sections = CW_NAV_ITEMS;
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

    <!-- ═══ 板块索引：编辑式索引行（icon + 标题 + 箭头；无收录计数） ═══
         禁止在此补「设置 / 交换」工具组，也禁止补任何页内跨模式行（ADR 0019 决策 6）：
         导航条全站全断点恒在，工具组与「交换」留在侧栏单一居所。 -->
    <nav class="nk-cwhub-index" aria-label="货币战争板块">
      <RouterLink
        v-for="s in sections"
        :key="s.path"
        :to="s.path"
        class="nk-cwhub-index__row"
      >
        <span class="nk-cwhub-index__icon" v-html="s.icon" aria-hidden="true"></span>
        <span class="nk-cwhub-index__body">
          <span class="nk-cwhub-index__cn">{{ s.title }}</span>
          <span class="nk-cwhub-index__en">{{ s.en }}</span>
          <span class="nk-cwhub-index__desc">{{ s.desc }}</span>
        </span>
        <svg
          class="nk-cwhub-index__arrow"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        ><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
      </RouterLink>

    </nav>

    <!-- 页脚：跨页共享原语 .nk-hub-footer（声明于 tokens.css，与常规枢纽页共用同一份骨架） -->
    <footer class="nk-hub-footer">
      <p class="nk-hub-footer__motto">愿此行，终抵群星</p>
      <p class="nk-hub-footer__latin">PER ASPERA AD ASTRA</p>
    </footer>
  </div>
</template>
