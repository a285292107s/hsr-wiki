<script setup lang="ts">
/**
 * 应用外壳：侧边栏 + 方向过渡路由视图 + Toast。
 * 过渡类名来自 tokens.css（nk-view-fwd/back/fade/swap）；前三条由 router beforeEach 的 navDir 驱动；
 * 手机(<768px) 统一快速淡入淡出避免闪烁；route.meta.cw 驱动 <html data-theme="cw">；
 * 枢纽页(route.meta.bareNav: / 与 /currency) 所有断点不渲染导航条，内容区以 <html data-nav="bare"> 不再避让。
 *
 * 完整交叉过渡/叠层/swap 实测根因见 docs/memory/2026-09.md（同 tokens.css 段逐字）；ADR 0016 记落点分工。
 * 硬约束：① 禁止恢复 mode="out-in"；② 不加 z-index/isolation、不改 DOM 顺序修叠层（令牌用 z-index:1）；
 * ③ 禁止大 z-index 抢层（侧栏 100000/Toast 99999/颗粒层 100001）；④ 错峰只由 CSS transition-delay 承担，JS 禁加定时器；
 * ⑤ nk-view-swap 仅两「无侧栏枢纽」互切（meta.depth 皆 0）：判定必须用 meta.bareNav，禁止简化为 depth 相等
 *    （/settings、/currency/settings、NotFound、/debug 也 depth 0 会误命中）；from/to 跨渲染周期须自行记录 lastBareNav。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { navDir } from './router';
import SidebarNav from './components/SidebarNav.vue';
import ToastHost from './components/ToastHost.vue';

const route = useRoute();
const router = useRouter();

/* ─── 手机断点检测：<768px 时禁用方向滑移过渡 ─── */
const mobileQuery = window.matchMedia('(max-width: 767px)');
const isMobile = ref(mobileQuery.matches);
const onMqChange = (e: MediaQueryListEvent): void => { isMobile.value = e.matches; };
mobileQuery.addEventListener('change', onMqChange);
onBeforeUnmount(() => mobileQuery.removeEventListener('change', onMqChange));

/* ─── 枢纽页无导航条（route.meta.bareNav）───
   **全断点生效**：枢纽页身份是「选路」，页内索引即导航，导航条在任何断点都不出现
   （用户裁定）——平板/桌面不渲染左侧竖栏，手机不渲染底部栏。
   历史约束「手机保留底部栏（设置页唯一入口）」已作废：设置入口随底部栏一并消失，
   手机枢纽页通过页内索引进入任一板块页即恢复导航条（浏览器后退亦可）。
   隐藏侧栏后 --nk-content-offset 失去避让对象，由 CSS 按 data-nav="bare" 回退为页面留白
   （手机本就为 0，无需回退）。
   首帧防闪：bootstrap 先 mount 后 await router.isReady()，此刻 route 仍是 START_LOCATION
   （meta 为空）——直接读 route.meta 会让深链直达枢纽页先画出侧栏再消失（实测 ~80ms），
   故初始值以当前 location 同步 resolve 出 meta；后续导航仍以 route.meta 为准
   （与目标视图同帧切换，不在过渡动画期间抖动内容区）。
   工具组（设置 / 交换）全断点都不在枢纽页出现，页内也不补入口（用户裁定：工具组留在侧栏
   单一居所，枢纽页身份是「选路」；见 CONTEXT.md「无侧栏枢纽」）——禁止顺手补上。
   注意 isMobile 仍是手机断点检测（下方过渡通道用），但**不参与**导航条显隐判定：
   禁止在 showSidebar 里恢复 `|| isMobile.value`，那正是本次作废的旧行为。 */
const bareNav = ref(!!router.resolve(window.location.pathname).meta.bareNav);
watch(() => route.meta.bareNav, (v) => { bareNav.value = !!v; });
const showSidebar = computed(() => !bareNav.value);

function applyBareNav(bare: boolean): void {
  const root = document.documentElement;
  if (bare) root.dataset.nav = 'bare';
  else delete root.dataset.nav;
}

/* 首次加载（深链直达枢纽页）不依赖 watch 触发，与 applyTheme 同模式 */
applyBareNav(bareNav.value);
watch(bareNav, (bare) => applyBareNav(bare));

/* ─── 模式置换过渡通道判定（/ ↔ /currency；理由与禁用项见文件顶部 ⑤）───
   本块**必须**位于 bareNav 之后（初始值取自 bareNav，提前读会 TDZ 报错）。
   transitionName 在路由切换**之后**求值，此刻 route.meta 已是新页，故必须自己记上一页。
   记录手段**必须**是 watch(route.path)，**禁止**改用 watch(bareNav)：
   / ↔ /currency 互切时 bareNav 两侧同为 true，值不变 → watch(bareNav) 不回调，
   会直接漏掉互切（实测落回 fade）。以「路径」为导航事件源才覆盖得住。
   时序（watch 默认 flush: 'pre'，先于本次计算属性重求值与渲染）：
     ① 路由提交，route 已是新页；
     ② watch(path) 回调：此时 lastBareNav 仍是**上一页**的值，先算命中再更新为当前页的值；
     ③ isHubSwapHit / transitionName 重求值 → 读到刚算出的命中结果。
   故命中结果必须缓存成 ref（isHubSwapHit），不能在回调外重读 lastBareNav（那时已被覆盖）。
   首帧与初值：lastBareNav **必须**以 bareNav 同步初值，**禁止**写 false 常量。
   原因（实测）：bootstrap 先 mount 后 await router.isReady()，mount 时 route 是
   START_LOCATION 而解析结果仍是 '/'，route.path 前后同为 '/' → 本 watch **不触发**。
   若初值写 false，则首次 / → /currency 会读到「上一页非枢纽」而漏掉置换（落回 fade）。
   以 bareNav 同步初值即真实值：深链直达 / 或 /currency 时没有「上一页」，
   isHubSwapHit 初始为 false → 首帧不发生任何置换（实测 A 组两条均为无过渡类名）。 */
let lastBareNav = bareNav.value;
const isHubSwapHit = ref(false);

watch(() => route.path, () => {
  isHubSwapHit.value = lastBareNav && !!route.meta.bareNav;  // 用上一页的标签判定本跳
  lastBareNav = !!route.meta.bareNav;
});

/** 上一跳是否为「两个枢纽互切」（meta.bareNav 两侧皆真）→ 模式置换通道 */
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
  <SidebarNav v-if="showSidebar" />
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName">
      <component :is="Component" :key="viewKey" />
    </Transition>
  </RouterView>
  <ToastHost />
</template>
