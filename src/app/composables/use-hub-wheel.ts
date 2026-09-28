/**
 * 枢纽页滚轮手势（ADR 0016）：桌面（≥1024px）且在 Hero 元素内滚动时，
 * **下滚 = 进入本模式图签页**、**上滚 = 切换至另一模式枢纽页**。
 *
 * 由调用方（`HomeView.vue` / `CurrencyHubView.vue`）传入 Hero 元素 ref 与两个目标路径，
 * 本 composable 只管监听与方向判定，不含任何路由知识。
 *
 * 边界：监听绑在 Hero 上（而非 window）——移出 Hero（如 `/currency` 的赛季说明、板块索引行）
 * 即自然恢复正常滚动，ADR 0016 的「内容始终可用滚轮到达」由此保证。
 */
import { onBeforeUnmount, onMounted, type Ref } from 'vue';
import type { Router } from 'vue-router';

/**
 * 触发跳转的最小滚动量（像素当量）：触控板一次微抖动（1–2px）即触发跳转会让页面
 * 「甩不动」，故设 4px 下限——远低于一次真实滚轮刻度（通常 100px）与触控板滑动幅度。
 */
export const WHEEL_THRESHOLD = 4;

/**
 * 两次跳转之间的冷却（毫秒）：一次触控板惯性滑动的 wheel 事件是连续多次触发的，
 * 无冷却时会让 `/` 一路连跳到 `/currency` 再被当作上滚切回。600ms 覆盖惯性事件串，
 * 同时短于用户「意识到跳转并反向操作」的反应时间。
 */
export const WHEEL_COOLDOWN_MS = 600;

/** ADR 0016 的生效断点：平板/手机（<1024px）不拦截滚轮 */
const DESKTOP_MEDIA = '(min-width: 1024px)';

/** deltaMode 归一化系数：把 line/page 单位换算成像素当量，统一与 WHEEL_THRESHOLD 比较 */
const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 800;

export interface HubWheelOptions {
  /** 路由实例（`useRouter()` 的返回值）；composable 不自行调用 `useRouter()`，便于测试注入 */
  router: Pick<Router, 'push'>;
  /** Hero 元素 ref；`null`（未挂载/条件渲染缺席）时不注册监听 */
  hero: Ref<HTMLElement | null>;
  /** 下滚目标：本模式图签页（`/` → `/character`，`/currency` → `/currency/role`） */
  downPath: string;
  /**
   * 上滚目标：另一模式枢纽页（`/` 传 `/currency`，`/currency` 传 `/`）。
   * **传 `null` 表示该页禁用「上滚切模式」**——上滚既不导航也不拦截默认滚动，
   * 交还正常滚动。两页是否需要该通道由调用方决定，composable 不写死。
   */
  upPath: string | null;
}

export interface HubWheel {
  /**
   * 绑定监听。composable 会在 `onMounted` 自动调用一次；但调用方的 Hero 常位于
   * `v-if` / 异步门控内（如 HomeView 的 `v-else` loading 门控），`onMounted` 时元素
   * 尚未入 DOM——此时必须由调用方在元素真正挂载后（`watch(heroRef, …)`）再调一次。
   * **重复调用是安全的**（幂等：已绑定则不重复添加），禁止调用方自行判断状态。
   */
  start(): void;
  /** 卸载监听；由 `onBeforeUnmount` 自动调用，测试需手动触发时可用 */
  stop(): void;
}

/**
 * 归一化 `WheelEvent.deltaY` 到像素当量。
 * 必须处理 `deltaMode`：Firefox 与部分鼠标驱动上报「行」单位（mode=1），
 * 不换算时 deltaY=3 这类合法滚动会被 WHEEL_THRESHOLD 判为无效。
 */
export function normalizeWheelDelta(e: WheelEvent): number {
  switch (e.deltaMode) {
    case 1:
      return e.deltaY * LINE_HEIGHT_PX;
    case 2:
      return e.deltaY * PAGE_HEIGHT_PX;
    default:
      return e.deltaY;
  }
}

export function useHubWheel(opts: HubWheelOptions): HubWheel {
  const { router, hero, downPath, upPath } = opts;

  /** 上次跳转的时间戳；0 表示尚未跳转过（首次必可触发） */
  let lastNavAt = 0;
  let boundEl: HTMLElement | null = null;

  function onWheel(e: WheelEvent): void {
    // 生效条件一：桌面断点。逐事件求值，窗口跨断点缩放后立刻跟随，无缓存陈旧问题。
    if (!window.matchMedia(DESKTOP_MEDIA).matches) return;

    // 生效条件二：事件目标在 Hero 内。监听虽已绑在 Hero 上，但 Hero 内可能存在
    // 需要独立滚动的子元素（如长文案容器），此处显式判定保证语义与 ADR 0016 字面一致。
    const el = hero.value;
    if (!el || !el.contains(e.target as Node)) return;

    const delta = normalizeWheelDelta(e);
    // 不足 WHEEL_THRESHOLD 的偏移视为触控板抖动，直接放行给正常滚动（不跳转）
    if (Math.abs(delta) < WHEEL_THRESHOLD) return;

    // 生效条件三：冷却。同一次惯性手势产生的事件串只允许跳转一次。
    const now = Date.now();
    if (now - lastNavAt < WHEEL_COOLDOWN_MS) return;

    // 方向映射（ADR 0016）：下滚（deltaY > 0）进图签页，上滚（deltaY < 0）切另一模式枢纽页。
    // upPath 为 null 时该页禁用上滚通道：不导航、不占冷却，上滚完全交还默认滚动。
    const target = delta > 0 ? downPath : upPath;
    if (target === null) return;

    lastNavAt = now;

    // 不 preventDefault：跳转本身即离开本页，劫持默认滚动无收益，反而会阻断
    // 那些绕过本判定（如冷却期内、非桌面断点、上滚禁用）的正常滚动。
    router.push(target);
  }

  function stop(): void {
    if (boundEl) {
      boundEl.removeEventListener('wheel', onWheel);
      boundEl = null;
    }
  }

  /**
   * 幂等绑定：已绑定同一元素时直接返回（禁止重复 addEventListener——重复绑定会让
   * 一次 wheel 触发多次 onWheel，冷却虽能挡住重复导航，但语义已错）。
   * `hero.value` 为 null 时静默不绑定，等调用方在元素入 DOM 后再调。
   */
  function start(): void {
    const el = hero.value;
    if (!el || el === boundEl) return;
    if (boundEl) boundEl.removeEventListener('wheel', onWheel);
    boundEl = el;
    boundEl.addEventListener('wheel', onWheel, { passive: false });
  }

  onMounted(start);

  // 路由切换后本页卸载，必须摘除监听，否则残留监听会拿到已失效的 ref 与路由上下文
  onBeforeUnmount(stop);

  return { start, stop };
}
