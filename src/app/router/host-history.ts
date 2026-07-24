/**
 * Host-Sync History（油猴模式核心机制）
 *
 * 目录页数据来自宿主渲染的 [data-ui="content-card"] 节点（DOM 抓取），
 * 因此我们的每次路由跳转必须驱动宿主 SPA 同步渲染目标页面。
 * 宿主 SPA 只监听 popstate（Shadow DOM 内的链接点击不会被其事件委托捕获），
 * 所以 push/replace 的流程为：
 *
 *   1. inner.push()          —— history.pushState 更新 URL（vue-router 状态同步）
 *   2. inner.pauseListeners()—— 置 pauseState = 新位置（必须在 push 之后：
 *                               dispatchEvent 是同步的，此时 currentLocation 已更新为新值）
 *   3. dispatch popstate     —— 宿主 SPA 收到事件重新渲染；vue-router 的
 *                               popStateHandler 因 pauseState === from 提前返回，
 *                               不会触发重复导航
 *
 * 浏览器前进/后退（真实 popstate，异步触发）无需包装：宿主与 vue-router
 * 各自响应同一事件，天然同步。
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
      inner.push(to, data);
      inner.pauseListeners();
      notifyHost();
    },
    replace(to, data) {
      inner.replace(to, data);
      inner.pauseListeners();
      notifyHost();
    },
  };
}
