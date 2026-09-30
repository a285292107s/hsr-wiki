<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast。
 * 过渡类名来自 tokens.css（nk-view-fwd/back/fade/swap）；前三条由 router beforeEach 的 navDir 驱动；
 * 手机(<768px) 统一快速淡入淡出避免闪烁；route.meta.cw 驱动 <html data-theme="cw">。
 * **导航条全站全断点恒在**（ADR 0019）：不存在「某页没有导航条」的外壳特殊形态，SidebarNav 恒渲染；
 * 禁止再引入任何按路由隐藏导航条 / 底部栏的旗标或根节点属性（ADR 0018 的「无侧栏枢纽」形态已退场）。
 *
 * 完整交叉过渡/叠层/swap 实测根因见 docs/memory/2026-09.md（同 tokens.css 段逐字）；ADR 0016 记落点分工。
 * 硬约束：① 禁止恢复 mode="out-in"；② 不加 z-index/isolation、不改 DOM 顺序修叠层（令牌用 z-index:1）；
 * ③ 禁止大 z-index 抢层（侧栏 100000/Toast 99999/颗粒层 100001）；④ 错峰只由 CSS transition-delay 承担，JS 禁加定时器；
 * ⑤ nk-view-swap 仅 `/` ↔ `/currency` 两向互切命中：判定必须用**路径对**，禁止简化为 depth 相等
 *    （/settings、/currency/settings、NotFound、/debug 也 depth 0 会误命中）；跨渲染周期由 lastPath 自行记录上一页路径；
 *    该通道当前无客户端通路可达（见下方判定块），保留理由是 ADR 0019 决策 7。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();

/* ─── 手机断点检测：<768px 时禁用方向滑移过渡 ─── */
const mobileQuery = window.matchMedia('(max-width: 767px)');
const isMobile = ref(mobileQuery.matches);
const onMqChange = (e: MediaQueryListEvent): void => { isMobile.value = e.matches; };
mobileQuery.addEventListener('change', onMqChange);
onBeforeUnmount(() => mobileQuery.removeEventListener('change', onMqChange));

/* ─── 模式置换过渡通道判定（/ ↔ /currency 路径对；禁令见文件顶部 ⑤）───
    判定 = **路径对**：上一页与当前页都落在 { '/', '/currency' } 即命中（两向互切都覆盖）。
    **该判定当前无客户端通路可达（复核确认）**：两模式侧栏各自只出本模式导航项（`/` 无货币战争
    枢纽项、`/currency` 无首页项），侧栏「交换」落点是对方**图签页**，故 `/` ↔ `/currency`
    不构成相邻客户端历史项、本通道实际不会被触发。**保留理由 = ADR 0019 决策 7**：两模式互切的
    专用通道，恢复枢纽↔枢纽可见入口即自动生效。
    **禁止**改用 depth 相等（/settings、/currency/settings、NotFound、/debug 也是 depth 0 会误命中）；
    **禁止**因「不可达」删掉本判定（删了只能落回 fade，恢复入口时无声降级）。
    时序/记录：transitionName 在路由切换**之后**求值（此刻 route 已是新页），故必须自己记上一页；
    记录手段**必须**是 watch(route.path)（**禁止**用 meta 旗标源——互切时旗标值可能不变，
    watch 不回调会直接漏掉互切，实测落回 fade）；watch 为 flush: 'pre'，先于本次计算属性重求值，
    故命中结果必须缓存成 ref，不能在回调外重读 lastPath（那时已被覆盖）。
    初值：lastPath **必须**以 route.path 同步初值（等价「上一页为 '/'」，与旧实现同构），
    **禁止**写空串常量——否则首次 / → /currency 会读到「上一页非置换页」而漏掉置换（落回 fade）；
    isHubSwapHit 初值恒为 false → 首帧不发生任何置换（实测 A 组两条均为无过渡类名）。 */
const SWAP_PATHS = new Set(['/', '/currency']);
let lastPath = route.path;
const isHubSwapHit = ref(false);

watch(() => route.path, (path) => {
  isHubSwapHit.value = SWAP_PATHS.has(lastPath) && SWAP_PATHS.has(path);  // 用上一页路径判定本跳
  lastPath = path;
});

/** 上一跳是否为「/ ↔ /currency 模式置换」（两侧路径都在置换对里）→ 模式置换通道 */
const isHubSwap = computed(() => isHubSwapHit.value);

const transitionName = computed(() =>
  isMobile.value
    ? 'nk-view-fade'
    : isHubSwap.value ? 'nk-view-swap'
      : navDir.value > 0 ? 'nk-view-fwd' : navDir.value < 0 ? 'nk-view-back' : 'nk-view-fade',
);

const viewKey = computed(() => route.path);

/* ─── 货币战争模式：全壳暗金主题切换 ─── */
const isCw = computed(() => !!route.meta.cw);
let themeTimer: ReturnType<typeof setTimeout> | null = null;

function applyTheme(cw: boolean, animate: boolean): void {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transitioning');
    if (themeTimer !== null) clearTimeout(themeTimer);
    themeTimer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
      themeTimer = null;
    }, 450);
  }
  if (cw) root.dataset.theme = 'cw';
  else delete root.dataset.theme;
}

/* 首次加载（深链直达 CW 页）不播放渐变，直接应用主题 */
applyTheme(isCw.value, false);
watch(isCw, (cw) => applyTheme(cw, true));
onBeforeUnmount(() => { if (themeTimer !== null) clearTimeout(themeTimer); });
</script>

<template>
  <SidebarNav />
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName">
      <component :is="Component" :key="viewKey" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
