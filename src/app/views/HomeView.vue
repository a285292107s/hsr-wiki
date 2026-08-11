<script setup lang="ts">
/**
 * 首页：深空档案品牌门户（taste-skill 重设计）
 * 全屏官网 KV 场景为唯一视觉主角，标题退居左下档案构图；
 * 板块入口由卡片网格改为编辑式索引（战斗 / 情报 / 独立模式分组）。
 * 移除原 HUD 电玩元素：逐字标题动画 / SCROLL 指示 / 3D 倾斜 / 全息扫光 / 漫射发光。
 */
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useAppStore } from '../stores/app';
import { NORMAL_NAV_ITEMS, CW_GATEWAY } from '../components/nav-items';
import { prefetchHighPriority } from '../router/chunks';
import { initSpineSceneViewer } from '../character/spine';
import { loadLocalCharacterList } from '../../services/api';
import { avatarDrawCardUrl } from '../../lib/format';
import { SITE_NAME } from '../../lib/constants';

const app = useAppStore();
const loading = ref(true);

/* ─── 板块索引分组：战斗（角色/光锥/遗器）· 情报（物品/成就/敌对/终局）· 独立模式（货币战争） ─── */
const indexGroups = [
  { items: NORMAL_NAV_ITEMS.slice(0, 3) }, // 战斗
  { items: NORMAL_NAV_ITEMS.slice(3) },    // 情报
  { items: [CW_GATEWAY] },                 // 独立模式
];
const sectionCount = NORMAL_NAV_ITEMS.length + 1;

/* ─── Hero 背景：桌面（≥1024px）= 官网 KV Spine 场景；平板与手机（<1024px）= 随机五星立绘 ───
   KV 场景（主背景 + 9 层角色群像）在窄屏下降级仅剩主背景层、群像丢失，且宽幅 frieze 被 cover
   裁剪大半，显示效果差；故 <1024px 统一改为随机五星角色立绘（与 KV 群像皆为五星的观感对齐）。
   立绘仅在页面刷新（F5/重载）时更换：上次展示 ID 存 localStorage，下次加载时排除，保证刷新必换。 */

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

const isSpine = ref(false);
let mq: MediaQueryList | null = null;

/* ─── 立绘展示：静态单层，预加载完成才入栈；上次展示 ID 持久化，刷新时排除换新 ─── */
interface HeroArt { key: number; id: number; url: string }
const heroArts = ref<HeroArt[]>([]);
const activeArtKey = ref(0);
let artSeq = 0;
let artEpoch = 0; // 代际令牌：断点切换/卸载后丢弃过期异步结果
const LAST_ART_KEY = 'nk-home-last-art'; // localStorage：上次展示的角色 ID

/** 预加载图片（失败静默，调用方以渐变背景直接承接） */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/** 读取上次展示的角色 ID（localStorage 读取失败视为无记录） */
function loadLastArtId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ART_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

/** 记录本次展示的角色 ID，作为下次刷新排除项 */
function saveLastArtId(id: number): void {
  try {
    localStorage.setItem(LAST_ART_KEY, String(id));
  } catch { /* 忽略：仅失去去重能力 */ }
}

/** 随机抽取一张角色立绘（五星优先；排除上次刷新展示过的，保证每次刷新换人） */
async function pickHeroArt(): Promise<HeroArt | null> {
  try {
    const list = await loadLocalCharacterList();
    const fives = list.filter((c) => c.rarity === 5);
    const pool = fives.length > 0 ? fives : list;
    const lastId = loadLastArtId();
    const candidates = lastId ? pool.filter((c) => c.id !== lastId) : pool;
    const pick = (candidates.length > 0 ? candidates : pool)[
      Math.floor(Math.random() * (candidates.length > 0 ? candidates.length : pool.length))
    ];
    if (!pick) return null;
    saveLastArtId(pick.id);
    return { key: ++artSeq, id: pick.id, url: avatarDrawCardUrl(pick.id) };
  } catch {
    return null;
  }
}

/** 启动立绘展示：刷新后随机抽一张（排除上次展示），静态展示不轮播 */
function startHeroArt(): void {
  stopHeroArt();
  const epoch = ++artEpoch;
  heroArts.value = [];
  void (async () => {
    const first = await pickHeroArt();
    if (!first || epoch !== artEpoch) return;
    await preloadImage(first.url);
    if (epoch !== artEpoch) return;
    heroArts.value = [first];
    activeArtKey.value = first.key;
  })();
}

/** 停止立绘展示（代际 +1 使在途异步结果作废） */
function stopHeroArt(): void {
  artEpoch++;
}

/** 断点切换：桌面 ↔ 非桌面 重建 Hero 背景（Spine 场景每次全新挂载，无状态残留） */
function onBreakpointChange(): void {
  const wide = mq ? mq.matches : false;
  isSpine.value = wide;
  if (wide) {
    stopHeroArt();
    void nextTick().then(mountHeroSpine);
  } else {
    if (disposeSpine) {
      disposeSpine();
      disposeSpine = null;
    }
    spineReady.value = false;
    startHeroArt();
  }
}

onMounted(() => {
  prefetchHighPriority();
  // 游戏版本后台加载（本地 version.json；未生成时静默降级为 —）
  void app.initVersion().catch(() => { /* 降级：游戏版本显示 — */ });
  loading.value = false;
  // 断点判定：桌面（≥1024px）→ KV Spine 场景（官网同款完整群像）；平板/手机 → 随机五星立绘
  mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', onBreakpointChange);
  isSpine.value = mq.matches;
  if (mq.matches) {
    void nextTick().then(mountHeroSpine); // v-if 解锁后 Hero 才入 DOM，再挂载背景 Spine
  } else {
    startHeroArt();
  }
});

onBeforeUnmount(() => {
  if (mq) mq.removeEventListener('change', onBreakpointChange);
  mq = null;
  stopHeroArt();
  if (disposeSpine) disposeSpine();
});
</script>

<template>
  <div id="nk-home-app">
    <div v-if="loading" class="nk-loading">LOADING</div>
    <template v-else>
      <section class="nk-home-hero">
        <div v-if="isSpine" ref="spineRef" class="nk-home-hero__spine" :class="{ 'nk-on': spineReady }"></div>
        <div v-else class="nk-home-hero__arts" aria-hidden="true">
          <div
            v-for="art in heroArts"
            :key="art.key"
            class="nk-home-hero__art"
            :class="{ 'nk-on': art.key === activeArtKey }"
            :style="{ backgroundImage: `url(${art.url})` }"
          ></div>
        </div>
        <div class="nk-home-hero__scrim"></div>
        <div class="nk-home-hero__content">
          <p class="nk-home-hero__supra">HSR DATA ARCHIVE</p>
          <h1 class="nk-home-hero__title">{{ SITE_NAME }}</h1>
          <p class="nk-home-hero__tagline">角色 · 光锥 · 遗器，全图鉴数据</p>
        </div>
      </section>

      <nav class="nk-home-nav">
        <div class="nk-home-nav__head">
          <h2 class="nk-home-nav__title">全站板块</h2>
          <span class="nk-home-nav__rule" aria-hidden="true"></span>
          <span class="nk-home-nav__meta">DATA v{{ app.gameVersion || '—' }} · {{ sectionCount }} SECTIONS</span>
        </div>
        <div class="nk-home-index">
          <div v-for="group in indexGroups" :key="group.items[0].path" class="nk-home-index__group">
            <RouterLink
              v-for="n in group.items"
              :key="n.path"
              :to="n.path"
              class="nk-home-row"
              :class="{ 'nk-home-row--gateway': n.path === CW_GATEWAY.path }"
            >
              <span class="nk-home-row__icon" v-html="n.icon" aria-hidden="true"></span>
              <span class="nk-home-row__name">{{ n.title }}</span>
              <span class="nk-home-row__en">{{ n.en }}</span>
              <span class="nk-home-row__desc">{{ n.desc }}</span>
              <svg
                class="nk-home-row__arrow"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
              ><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </RouterLink>
          </div>
        </div>
      </nav>

      <footer class="nk-home-footer">
        <p class="nk-home-footer__motto">愿此行，终抵群星</p>
        <p class="nk-home-footer__latin">PER ASPERA AD ASTRA</p>
      </footer>
    </template>
  </div>
</template>