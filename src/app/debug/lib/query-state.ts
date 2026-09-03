/**
 * 研究线 URL query 状态工具(替代 vue-router 的 useRoute/useRouter):
 * 仅读写 location.search 的单个参数,replaceState 不产生历史记录;
 * popstate + 自定义事件双通道通知,供面板响应外部导航/手改 URL。
 */

const QUERY_CHANGE_EVENT = 'lab:querychange';

function readParam(name: string): string | null {
  return new URLSearchParams(location.search).get(name);
}

function writeParam(name: string, value: string): void {
  const params = new URLSearchParams(location.search);
  params.set(name, value);
  history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  window.dispatchEvent(new Event(QUERY_CHANGE_EVENT));
}

export function getQueryParam(name: string): string | null {
  return readParam(name);
}

/** 写入参数(replaceState)并通知订阅方 */
export function setQueryParam(name: string, value: string): void {
  if (readParam(name) === value) return;
  writeParam(name, value);
}

/** 订阅 query 变化(本页写入 + 前进后退);返回退订函数 */
export function subscribeQueryChange(fn: () => void): () => void {
  window.addEventListener(QUERY_CHANGE_EVENT, fn);
  window.addEventListener('popstate', fn);
  return () => {
    window.removeEventListener(QUERY_CHANGE_EVENT, fn);
    window.removeEventListener('popstate', fn);
  };
}