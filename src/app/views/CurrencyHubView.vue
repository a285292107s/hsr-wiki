<script setup lang="ts">
/**
 * 货币战争模式枢纽页（/currency）
 * 「交换」的落地目标，与 HomeView 对等的"模式之家"。
 *
 * 视觉基调（V4 重构：官方背景视频 + 首页同构范式，双段式禁令）：
 * 第一段（素材豁免）：Hero 背景 = 官方货币战争活动页背景视频（2500×1080 宽幅循环，
 * 直引 act-webstatic，见 CW_HERO_VIDEO）。行情/展览式视觉存在于官方素材本身，属豁免。
 * 第二段（文字克制）：视频层之上禁止新增行情式装饰——霓虹 glow、金币雨、行情板、
 * div 合成装饰、装饰字符、em-dash、装饰性 eyebrow 全部禁止；档案编号（序号 01-05）
 * 与真实数据徽章为数据锚点，允许使用。
 * 视频降级纪律：加载失败/慢网/prefers-reduced-motion → 静态 poster 帧（CW_HERO_POSTER）
 * + 黑金渐变兜底，禁止以装饰动画替代视频。
 *
 * 页面结构镜像 HomeView：全屏视频 Hero（**右上标题范式**——视频主体居左侧，
 * 标题置右上平衡构图，scrim/标题位置调整见 currency-hub.css 注释）→ 板块索引行 → 页脚。
 * 赛季扩充说明（真实数据，season 转换器产物）置于 Hero 标题下方空间——
 * V4 重构曾移除（三轮对齐），2026-08-15 用户裁定恢复（唯一保留的 converter 数据源）。
 * 破坏性重构（三轮对齐裁定）：阵容档案表 / 机制泳道已移除，页面与其余数据源解耦。
 * 样式独立实现于 currency-hub.css（随路由懒加载），不抽 tokens 共享原语：
 * Hero 视频层与首页 Spine 场景的媒体来源/断点语义不同，共享仅能覆盖 scrim/content
 * 骨架，抽原语需连带改造首页（回归风险大于收益），故判定为不共享。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
import { CW_HERO_VIDEO, CW_HERO_POSTER } from '../../lib/constants';
import { loadLocalCurrencySeasons } from '../../services/api';
import type { CurrencySeason } from '../../services/types';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

/* ─── 板块入口：5 板块全部上线（路由与目录页配置均已注册，无占位） ─── */
const sections = CW_NAV_ITEMS;

/* ─── Hero 背景视频状态机 ───
   poster 帧（本地抽帧资产）常驻兜底：video 就绪（loadeddata）前 opacity 0 隐藏，
   就绪后淡入盖住 poster；加载失败则 poster 常驻。全断点同一策略，无重建。 */
const videoEl = ref<HTMLVideoElement | null>(null);
const videoReady = ref(false);
const REDUCE_MOTION = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onVideoReady(): void {
  videoReady.value = true;
}

function onVideoError(): void {
  /* 降级：video 保持隐藏（opacity 0），poster 帧 + 渐变兜底常驻；不重试（慢网重试会反复失败） */
  videoReady.value = false;
}

/* 后台标签页暂停/恢复（rAF 之外的媒体同样需要，避免后台持续解码耗电） */
function onVisibilityChange(): void {
  const v = videoEl.value;
  if (!v || REDUCE_MOTION) return;
  if (document.hidden) {
    v.pause();
  } else if (v.paused) {
    void v.play().catch(() => { /* autoplay 策略拦截：poster 常驻，不影响页面 */ });
  }
}

/* ─── 赛季扩充说明（唯一 converter 数据源，标题下方空间展示） ─── */
const seasons = ref<CurrencySeason[]>([]);

/** 正文 → 段落数组（数据管线约定：字面 \n 分隔段落，此处按 (?:\n)+ 切分合并连续换行） */
function bodyParas(s: CurrencySeason): string[] {
  return s.body.split(/(?:\\n)+/).map((p) => p.trim()).filter(Boolean);
}

/** 概览 → { heading, items }（▌标题行 + ● 条目行；缺失返回 null） */
function overviewOf(s: CurrencySeason): { heading: string; items: string[] } | null {
  if (!s.overview) return null;
  const lines = s.overview.split(/(?:\\n)+/).map((l) => l.trim()).filter(Boolean);
  let heading = '';
  const items: string[] = [];
  for (const l of lines) {
    if (l.startsWith('▌')) { heading = l.replace(/^▌\s*/, ''); continue; }
    items.push(l.replace(/^●\s*/, ''));
  }
  return { heading: heading || '扩充内容概览', items };
}

/** 预解析赛季 → 段落 + 概览，避免模板内重复计算 */
const seasonViews = computed(() =>
  seasons.value.map((s) => ({
    id: s.id,
    title: s.title,
    paras: bodyParas(s),
    overview: overviewOf(s),
  })),
);

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisibilityChange);
  try {
    const sData = await loadLocalCurrencySeasons();
    seasons.value = sData.seasons ?? [];
  } catch {
    /* 离线降级：赛季说明不展示，不影响页面其余部分 */
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<template>
  <div id="nk-cwhub-app">
    <!-- ═══ Hero：全屏官方背景视频（左下标题范式，镜像首页布局） ═══ -->
    <section class="nk-cwhub-hero" aria-label="货币战争">
      <div class="nk-cwhub-hero__fallback" aria-hidden="true"></div>
      <img
        v-if="!REDUCE_MOTION"
        class="nk-cwhub-hero__poster"
        :src="CW_HERO_POSTER"
        alt=""
        aria-hidden="true"
        fetchpriority="high"
      >
      <video
        v-if="!REDUCE_MOTION"
        ref="videoEl"
        class="nk-cwhub-hero__video"
        :class="{ 'nk-on': videoReady }"
        :src="CW_HERO_VIDEO"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        aria-hidden="true"
        tabindex="-1"
        @loadeddata="onVideoReady"
        @error="onVideoError"
      ></video>
      <div class="nk-cwhub-hero__scrim" aria-hidden="true"></div>
      <div class="nk-cwhub-hero__content">
        <p class="nk-cwhub-hero__supra">CURRENCY WAR · GRID FIGHT</p>
        <h1 class="nk-cwhub-hero__title">货币战争</h1>
        <p class="nk-cwhub-hero__tagline">
          赢者通吃的零和博弈。招募、羁绊、站位、策略，构筑你的最强阵容。
        </p>

        <!-- ═══ 赛季扩充说明（真实数据，标题下方空间） ═══ -->
        <!-- tabindex="0"：内部滚动容器需键盘可达（axe scrollable-region-focusable） -->
        <section v-if="seasonViews.length" class="nk-cwhub-season" aria-label="赛季扩充说明" tabindex="0">
          <article
            v-for="s in seasonViews"
            :key="s.id"
            class="nk-cwhub-season__card"
          >
            <h2 class="nk-cwhub-season__title">{{ s.title }}</h2>
            <div class="nk-cwhub-season__body">
              <p v-for="(p, i) in s.paras" :key="i">{{ p }}</p>
            </div>
            <aside
              v-if="s.overview"
              class="nk-cwhub-season__overview"
              aria-label="扩充内容概览"
            >
              <div class="nk-cwhub-season__ov-head">
                <span class="nk-cwhub-season__ov-title">{{ s.overview.heading }}</span>
              </div>
              <ul class="nk-cwhub-season__ov-list">
                <li
                  v-for="(it, i) in s.overview.items"
                  :key="i"
                  class="nk-cwhub-season__ov-item"
                >
                  <span class="nk-cwhub-season__ov-text">{{ it }}</span>
                </li>
              </ul>
            </aside>
          </article>
        </section>
      </div>
    </section>

    <!-- ═══ 板块索引：编辑式索引行（镜像首页行范式，icon + 标题 + 箭头；无收录计数） ═══ -->
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

    <footer class="nk-cwhub-footer">DATA SOURCE · TurnBasedGameData GRIDFIGHT</footer>
  </div>
</template>