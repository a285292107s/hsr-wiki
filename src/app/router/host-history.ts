/**
 * Host-Sync History（油猴模式核心机制）
 *
 * 目录页数据来自宿主渲染的 [data-ui="content-card"] 节点（DOM 抓取），
 * 因此我们的每次路由跳转必须驱动宿主 SPA 同步渲染目标页面。
 *
 * ⚠️ 宿主是 SvelteKit 应用。其实测的 popstate 处理逻辑为：
 *     if (event.state?.['sveltekit:index']) {
 *       if (event.state['sveltekit:index'] === 内部计数器) return; // 相同则忽略
 *       navigate(新 URL);                                        // 不同才重新渲染
 *     } else {
 *       仅更新 URL store，不重新渲染内容。                          // ← 旧实现的失败点
 *     }
 * 旧实现 pushState 的 state 是纯 vue-router 结构（无 sveltekit:index），
 * 宿主收到 popstate 后落入 else 分支——URL 变了但内容卡片不渲染，
 * 导致光锥/遗器等 DOM 数据源目录抓取不到卡片（角色仅在恰好是初始页时可用）。
 *
 * 修复：push/replace 后向当前历史条目补写一个全新的 sveltekit:index
 * （必须 ≠ 宿主内部计数器，故取「当前条目 index + 1」并单调递增），
 * 再 dispatch popstate，宿主即会重新渲染目标页。
 *
 *   1. inner.push()          —— history.pushState 更新 URL（vue-router 状态同步）
 *   2. 补写 sveltekit:index  —— replaceState 合并进当前条目 state
 *   3. inner.pauseListeners()—— 置 pauseState = 新位置（必须在 push 之后：
 *                               dispatchEvent 是同步的，此时 currentLocation 已更新为新值）
 *   4. dispatch popstate     —— 宿主收到事件重新渲染；vue-router 的
 *                               popStateHandler 因 pauseState === from 提前返回，
 *                               不会触发重复导航
 *
 * 特例：URL 未变化（初始导航 / 同路由 push）时宿主本就渲染着目标页，
 * 直接返回——既不补写 index（避免宿主同 URL 分支读取未登记的滚动位置报错），
 * 也不 dispatch（无需重渲染）。
 *
 * 浏览器前进/后退（真实 popstate，异步触发）无需包装：我们补写 index 的
 * 条目同时保留 vue-router 的 position 等字段，宿主与 vue-router 各自响应
 * 同一事件，天然同步。
 */
import { createWebHistory, type RouterHistory } from 'vue-router';

/**
 * createWebHistory 运行时返回值包含 pauseListeners（来自 useHistoryListeners
 * 的展开），但公共 RouterHistory 类型未声明它。router 内部不会从外部调用
 * 该方法，仅我们的 host-sync 包装层需要。
 */
interface InternalHistory extends RouterHistory {
  pauseListeners(): void;
}

/** SvelteKit 用作历史条目标识的 state 键名 */
const SVELTEKIT_INDEX = 'sveltekit:index';

/** 本应用签发的 sveltekit:index 单调计数器（种子取自首个读到的宿主 index） */
let nkIndex = -1;

/** 读取当前历史条目的 sveltekit:index（== 宿主内部计数器），无则 undefined */
function readSveltekitIndex(): number | undefined {
  const v = (window.history.state as Record<string, unknown> | null)?.[SVELTEKIT_INDEX];
  return typeof v === 'number' ? v : undefined;
}

/** 生成一个必然 ≠ 宿主当前计数器的新 index（取 max(计数器, 当前 index) + 1） */
function nextSveltekitIndex(prev: number | undefined): number {
  nkIndex = Math.max(nkIndex, prev ?? nkIndex) + 1;
  return nkIndex;
}

/** 检测路由 base：nanoka.cc 主站下 HSR 位于 /hsr 子目录；hsr.nanoka.cc 子域为根路径 */
export function detectBase(): string {
  const host = location.hostname;
  if (host === 'nanoka.cc' || host === 'www.nanoka.cc') return '/hsr';
  return '/';
}

export function createHostSyncHistory(base?: string): RouterHistory {
  const inner = createWebHistory(base) as InternalHistory;

  const notifyHost = (): void => {
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
  };

  /**
   * inner.push/replace 之后驱动宿主重渲染。
   * @param prevIndex push/replace 之前读到的当前条目 sveltekit:index
   * @param beforeHref push/replace 之前的 location.href（用于判定 URL 是否变化）
   */
  const syncHost = (prevIndex: number | undefined, beforeHref: string): void => {
    // URL 未变化（初始导航 / 同路由 push）：宿主已渲染目标页，无需通知
    if (window.location.href === beforeHref) return;
    const next = nextSveltekitIndex(prevIndex);
    window.history.replaceState({ ...window.history.state, [SVELTEKIT_INDEX]: next }, '');
    inner.pauseListeners();
    notifyHost();
  };

  return {
    get location() {
      return inner.location;
    },
    get state() {
      return inner.state;
    },
    base: inner.base,
    createHref: inner.createHref,
    go: inner.go,
    listen: inner.listen,
    destroy: inner.destroy,
    push(to, data) {
      const prevIndex = readSveltekitIndex();
      const before = window.location.href;
      inner.push(to, data);
      syncHost(prevIndex, before);
    },
    replace(to, data) {
      const prevIndex = readSveltekitIndex();
      const before = window.location.href;
      inner.replace(to, data);
      syncHost(prevIndex, before);
    },
  };
}
