<script setup lang="ts">
/**
 * 首页：沉浸式品牌门户
 * 全屏官网 KV 场景（Spine 10 层：主背景 + 角色群像）+ 左下 HUD 标题 + 导航卡片网格
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAppStore } from '../stores/app';
import { NORMAL_NAV_ITEMS, CW_GATEWAY } from '../components/nav-items';
import { prefetchHighPriority } from '../router/chunks';
import { initSpineSceneViewer } from '../character/spine';

const app = useAppStore();
const loading = ref(true);

/* ─── 导航卡片：常规 7 板块 + 货币战争网关卡片（金色第二入口） ─── */
const navCards = [...NORMAL_NAV_ITEMS, CW_GATEWAY];

/* ─── Hero 背景 Spine 场景（官网背景节点 home-bg：主背景 + 9 层角色，固定视口叠加对齐） ─── */

const spineRef = ref<HTMLElement | null>(null);
const spineReady = ref(false);
let disposeSpine: (() => void) | null = null;

function mountHeroSpine(): void {
  const el = spineRef.value;
  if (!el) return;
  disposeSpine = initSpineSceneViewer(el, 'home-bg', () => {
    spineReady.value = true;
  });
}

/* ─── 卡片 3D 倾斜（grid 级事件委托 + rAF 节流） ─── */

const gridRef = ref<HTMLElement | null>(null);
let tiltRaf: number | null = null;
let tiltPending: { card: HTMLElement; x: number; y: number } | null = null;

function onGridMove(e: MouseEvent): void {
  const card = (e.target as HTMLElement).closest('.nk-home-card');
  if (!(card instanceof HTMLElement)) return;
  tiltPending = { card, x: e.clientX, y: e.clientY };
  if (tiltRaf !== null) return;
  tiltRaf = requestAnimationFrame(() => {
    tiltRaf = null;
    if (!tiltPending) return;
    const { card: c, x, y } = tiltPending;
    tiltPending = null;
    const rect = c.getBoundingClientRect();
    c.style.setProperty('--rx', ((x - rect.left) / rect.width - 0.5).toFixed(3));
    c.style.setProperty('--ry', (0.5 - (y - rect.top) / rect.height).toFixed(3));
  });
}

function onGridLeave(): void {
  tiltPending = null;
  gridRef.value?.querySelectorAll<HTMLElement>('.nk-home-card').forEach((c) => {
    c.style.setProperty('--rx', '0');
    c.style.setProperty('--ry', '0');
  });
}

/* ─── 标题逐字动画 / 滚动 / 生命周期 ─── */

function chars(str: string, base: number): { ch: string; delay: string }[] {
  return str.split('').map((ch, i) => ({
    ch: ch === ' ' ? '\u00A0' : ch,
    delay: `${(base + i * 0.06).toFixed(2)}s`,
  }));
}
const titleChars = chars('HSR WIKI', 0.45);

const navRef = ref<HTMLElement | null>(null);
function scrollToNav(): void {
  navRef.value?.scrollIntoView({ behavior: 'smooth' });
}

onMounted(() => {
  prefetchHighPriority();
  // 版本号后台加载（CDN manifest 失败时静默降级为 —，不阻塞首屏）
  void app.initManifest().catch(() => { /* 离线降级：版本显示 —，页面仍可用 */ });
  loading.value = false;
  void nextTick().then(mountHeroSpine); // v-if 解锁后 Hero 才入 DOM，再挂载背景 Spine
});

onBeforeUnmount(() => {
  if (disposeSpine) disposeSpine();
  if (tiltRaf !== null) cancelAnimationFrame(tiltRaf);
});
</script>

<template>
  <div id="nk-home-app">
    <div v-if="loading" class="nk-loading">LOADING</div>
    <template v-else>
      <section class="nk-home-hero">
        <div ref="spineRef" class="nk-home-hero__spine" :class="{ 'nk-on': spineReady }"></div>
        <div class="nk-home-hero__scrim"></div>
        <div class="nk-home-hero__content">
          <div class="nk-home-hero__kicker">
            <span class="nk-home-hero__kicker-line"></span>
            <span class="nk-home-hero__kicker-text">崩坏：星穹铁道 · 数据百科</span>
          </div>
          <h1 class="nk-home-hero__title">
            <span v-for="(c, i) in titleChars" :key="i" :style="{ animationDelay: c.delay }">{{ c.ch }}</span>
          </h1>
          <p class="nk-home-hero__tagline">角色 · 光锥 · 遗器 · 全图鉴数据</p>
        </div>
        <div class="nk-home-hero__scroll" role="button" tabindex="0" @click="scrollToNav" @keydown.enter="scrollToNav">
          <span>SCROLL</span>
          <div class="nk-home-hero__scroll-line"></div>
        </div>
      </section>

      <nav ref="navRef" class="nk-home-nav">
        <div class="nk-home-nav__head">
          <span class="nk-home-nav__label">SECTIONS</span>
          <span class="nk-home-nav__line"></span>
          <span class="nk-home-nav__count">0{{ navCards.length }}</span>
        </div>
        <div
          ref="gridRef"
          class="nk-home-nav__grid"
          @mousemove="onGridMove"
          @mouseleave="onGridLeave"
        >
          <RouterLink
            v-for="(n, i) in navCards"
            :key="n.path"
            :to="n.path"
            class="nk-home-card"
            :class="{ 'nk-home-card--gateway': n.path === CW_GATEWAY.path }"
            :style="{ '--i': i }"
          >
            <div class="nk-home-card__sheen"></div>
            <div class="nk-home-card__icon" v-html="n.icon"></div>
            <div class="nk-home-card__body">
              <div class="nk-home-card__title">
                <span class="nk-home-card__cn">{{ n.title }}</span>
                <span class="nk-home-card__en">{{ n.en }}</span>
              </div>
              <div class="nk-home-card__desc">{{ n.desc }}</div>
            </div>
            <svg
              class="nk-home-card__arrow"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round"
            ><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
          </RouterLink>
        </div>
      </nav>

      <footer class="nk-home-footer">DATA SOURCE — static.nanoka.cc · v{{ app.version || '—' }}</footer>
    </template>
  </div>
</template>
