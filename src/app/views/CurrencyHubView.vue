<script setup lang="ts">
/**
 * 货币战争模式枢纽页(/currency)：模式身份页+选路页，与 HomeView 对等。
 * 到达方式=CW 枢纽 Tab / `/` 的 CW_GATEWAY 网关行 / 枢纽滚轮上滚(≥1024px,Hero 内)；**不是「交换」落点**(后者跳图签页，ADR 0016 决策1)。
 * 视觉基调(双段式禁令)与样式实现决策见 HomeView 同构范式注释 + docs/memory/2026-09.md；currency-hub.css 随路由懒加载。
 * 反 AI 味：① 素材豁免(Hero=官方背景视频 2500×1080，本地随站 CW_HERO_VIDEO/POSTER)；② 视频层上禁止霓虹glow/金币雨/行情板/装饰字符/em-dash/装饰eyebrow，档案编号(01-05)与数据徽章允许；
 * ③ 降级=静态 poster+黑金渐变兜底，禁止装饰动画替代视频；④ Hero 媒体层不共享首页 Spine，页脚 .nk-hub-footer 两页共用(声明 tokens.css)。
 * 破坏性重构已落地：阵容档案表/机制泳道/页内「枢纽切换按钮」(HubToggle)/「赛季扩充说明」均移除；索引区末行「枢纽返回行」——
 * 禁止再补赛季说明或页内模式切换按钮(决策 ADR 0016)；样式独立实现于 currency-hub.css。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { CW_NAV_ITEMS } from '../components/nav-items';
import { useHubWheel } from '../composables/use-hub-wheel';
import { CW_HERO_VIDEO, CW_HERO_POSTER } from '../../lib/constants';
// 货币战争模式专属样式（随本路由 chunk 懒加载）
import '../../styles/currency-hub.css';

/* ─── 枢纽滚轮（ADR 0016）：Hero 区内下滚 → 图签页 /currency/role；上滚 → 常规枢纽页 / ───
   Hero 的 <section> 是独立 ref。本页 Hero **无 v-if 门控**（始终渲染），
   故 composable 在 onMounted 即可完成绑定，无需额外 start()。
   内容可达性：滚轮仅绑在本 Hero 上，鼠标移到下方板块索引行即恢复正常滚动。 */
const heroRef = ref<HTMLElement | null>(null);
useHubWheel({
  router: useRouter(),
  hero: heroRef,
  downPath: '/currency/role',
  upPath: '/',
});

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

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
});
</script>

<template>
  <div id="nk-cwhub-app">
    <!-- ═══ Hero：全屏官方背景视频（左下标题范式，镜像首页布局） ═══ -->
    <section ref="heroRef" class="nk-cwhub-hero" aria-label="货币战争">
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
      </div>
    </section>

    <!-- ═══ 板块索引：编辑式索引行（镜像首页行范式，icon + 标题 + 箭头；无收录计数） ═══
         禁止在此补「设置 / 交换」工具组：桌面态（≥768px）本页不渲染侧栏是用户裁定的
         无侧栏枢纽形态，工具组留在侧栏单一居所（见 CONTEXT.md「无侧栏枢纽」）。
         末行「枢纽返回行」是该禁令的唯一例外（ADR 0016 决策 3），常规枢纽页 `/` **不得**
         对称补行——`/` 的跨模式入口已由既有 CW_GATEWAY 网关行承担，对称补齐属重复入口。 -->
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

      <!-- ═══ 枢纽返回行（ADR 0016 决策 3）：/currency → 常规模式首页 `/` ═══
           必须复用 .nk-cwhub-index__row 原语（含 hover/active/焦点样式），禁止为此行新增 CSS。
           不设 __desc：desc 承载板块收录描述，返回行无板块语义，补描述属伪造内容。
           图标 = 房屋 SVG，与 nav-items.ts 的 CW_HUB_ITEM / NORMAL_HUB_ITEM 同族（枢纽 Tab 图标）。
           它是桌面态（bareNav 不渲染侧栏）从深链 /currency 回到常规模式的唯一页内通路；
           `/` 不设对应行（跨模式入口由 CW_GATEWAY 承担），禁止顺手对称补齐。 -->
      <RouterLink to="/" class="nk-cwhub-index__row">
        <span class="nk-cwhub-index__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"
          ><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></svg>
        </span>
        <span class="nk-cwhub-index__body">
          <span class="nk-cwhub-index__cn">返回常规模式</span>
          <span class="nk-cwhub-index__en">BACK TO NORMAL</span>
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
