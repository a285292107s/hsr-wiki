<script setup lang="ts">
/**
 * 首页：沉浸式品牌门户
 * 全屏视差 Hero（立绘轮播 + 鼠标视差）+ HUD 标题 + 导航卡片网格
 * 移植自原 home.js 首页渲染
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAppStore } from '../stores/app';
import { NAV_ITEMS } from '../components/nav-items';
import { CDN } from '../../lib/constants';

const app = useAppStore();
const loading = ref(true);

/* ─── 立绘轮播（双缓冲交叉淡入，6s 间隔） ─── */

const HOME_BG_IDS = [1005, 1112, 1213, 1307, 1408, 1224];
const bgUrl = (id: number): string => `${CDN}/assets/hsr/avatardrawcard/${id}.webp`;

const layerA = ref({ url: bgUrl(HOME_BG_IDS[0]), on: true });
const layerB = ref({ url: '', on: false });
let bgIdx = 0;
let rotateTimer: ReturnType<typeof setInterval> | null = null;

function startRotation(): void {
  rotateTimer = setInterval(() => {
    bgIdx = (bgIdx + 1) % HOME_BG_IDS.length;
    const url = bgUrl(HOME_BG_IDS[bgIdx]);
    const img = new Image();
    img.onload = () => {
      // 预加载完成后切换：新图层显示，旧图层淡出
      if (layerA.value.on) {
        layerB.value = { url, on: true };
        layerA.value = { ...layerA.value, on: false };
      } else {
        layerA.value = { url, on: true };
        layerB.value = { ...layerB.value, on: false };
      }
    };
    img.src = url;
  }, 6000);
}

/* ─── 鼠标视差（lerp + rAF，变换直接写入 style 避免响应式开销） ─── */

const heroRef = ref<HTMLElement | null>(null);
const bgARef = ref<HTMLElement | null>(null);
const bgBRef = ref<HTMLElement | null>(null);

let tx = 0, ty = 0, cx = 0, cy = 0;
let parallaxRaf: number | null = null;

function lerpLoop(): void {
  cx += (tx - cx) * 0.06;
  cy += (ty - cy) * 0.06;
  const t = `translate3d(${(cx * 15).toFixed(2)}px, ${(cy * 10).toFixed(2)}px, 0) scale(1.06)`;
  if (bgARef.value) bgARef.value.style.transform = t;
  if (bgBRef.value) bgBRef.value.style.transform = t;
  if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
    parallaxRaf = requestAnimationFrame(lerpLoop);
  } else {
    parallaxRaf = null;
  }
}

function kickParallax(): void {
  if (parallaxRaf === null) parallaxRaf = requestAnimationFrame(lerpLoop);
}

function onHeroMove(e: MouseEvent): void {
  const el = heroRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  tx = (e.clientX - r.left) / r.width - 0.5;
  ty = (e.clientY - r.top) / r.height - 0.5;
  kickParallax();
}

function onHeroLeave(): void {
  tx = 0;
  ty = 0;
  kickParallax();
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
const titleChars = chars('NANOKA', 0.15);
const title2Chars = chars('HSR WIKI', 0.55);

const navRef = ref<HTMLElement | null>(null);
function scrollToNav(): void {
  navRef.value?.scrollIntoView({ behavior: 'smooth' });
}

onMounted(async () => {
  startRotation();
  try {
    await app.initManifest();
  } catch {
    /* 离线降级：版本显示 —，页面仍可用 */
  }
  loading.value = false;
});

onBeforeUnmount(() => {
  if (rotateTimer !== null) clearInterval(rotateTimer);
  if (parallaxRaf !== null) cancelAnimationFrame(parallaxRaf);
  if (tiltRaf !== null) cancelAnimationFrame(tiltRaf);
});
</script>

<template>
  <div id="nk-home-app">
    <div v-if="loading" class="nk-loading">LOADING</div>
    <template v-else>
      <section
        ref="heroRef"
        class="nk-home-hero"
        @mousemove="onHeroMove"
        @mouseleave="onHeroLeave"
      >
        <div
          ref="bgARef"
          class="nk-home-hero__bg nk-home-hero__bg--a"
          :class="{ 'nk-on': layerA.on }"
          :style="{ backgroundImage: `url('${layerA.url}')` }"
        ></div>
        <div
          ref="bgBRef"
          class="nk-home-hero__bg nk-home-hero__bg--b"
          :class="{ 'nk-on': layerB.on }"
          :style="layerB.url ? { backgroundImage: `url('${layerB.url}')` } : undefined"
        ></div>
        <div class="nk-home-hero__glow"></div>
        <div class="nk-home-hero__scrim"></div>
        <div class="nk-home-hero__content">
          <div class="nk-home-hero__badge">
            <span class="nk-home-hero__badge-dot"></span>DATA v{{ app.version || '—' }}
          </div>
          <h1 class="nk-home-hero__title">
            <span v-for="(c, i) in titleChars" :key="i" :style="{ animationDelay: c.delay }">{{ c.ch }}</span>
          </h1>
          <div class="nk-home-hero__title2">
            <span v-for="(c, i) in title2Chars" :key="i" :style="{ animationDelay: c.delay }">{{ c.ch }}</span>
          </div>
          <p class="nk-home-hero__tagline">崩坏：星穹铁道 · 数据百科</p>
        </div>
        <div class="nk-home-hero__scroll" @click="scrollToNav">
          <span>SCROLL</span>
          <div class="nk-home-hero__scroll-line"></div>
        </div>
      </section>

      <nav ref="navRef" class="nk-home-nav">
        <div class="nk-home-nav__head">
          <span class="nk-home-nav__label">SECTIONS</span>
          <span class="nk-home-nav__line"></span>
          <span class="nk-home-nav__count">0{{ NAV_ITEMS.length }}</span>
        </div>
        <div
          ref="gridRef"
          class="nk-home-nav__grid"
          @mousemove="onGridMove"
          @mouseleave="onGridLeave"
        >
          <RouterLink
            v-for="(n, i) in NAV_ITEMS"
            :key="n.path"
            :to="n.path"
            class="nk-home-card"
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
