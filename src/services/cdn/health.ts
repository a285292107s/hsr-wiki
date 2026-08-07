/**
 * CDN 健康探测（全局兜底信号源，唯一实现）
 *
 * 背景：CDN（static.nanoka.cc / 官网源）整体不可达时，逐资源失败会放大等待与破图。
 * 本模块在 bootstrap 后发起一次轻量探测（HEAD manifest.json，3s 超时）：
 * - 失败 → cdnDown 置位，订阅方（图片委托 / spine 运行时 / manifest 加载）短路跳过等待
 * - down 状态下每 30s 后台重探直至恢复；恢复后 cdnDown 清除并通知订阅方（图片重载 / toast 提示）
 *   恢复即停止探测（正常态无需监视；若会话内再次失效由新会话的探测覆盖）
 * 探测永不阻塞调用方：fire-and-forget，状态经 isCdnDown() / subscribeCdnHealth() 读取。
 */
import { CDN } from '../../lib/constants';

/** 探测超时：远小于 fetchJSON 15s，保证短路信号尽快生效 */
export const CDN_PROBE_TIMEOUT_MS = 3000;
/** 探测失败后的重探周期（恢复检测） */
export const CDN_RETRY_INTERVAL_MS = 30_000;

/** 探测目标：manifest.json 为 CDN 根上最小稳定资源（HEAD 无下载成本） */
const PROBE_URL = `${CDN}/manifest.json`;

type CdnHealthListener = (down: boolean) => void;

let cdnDown = false;
let probeStarted = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<CdnHealthListener>();

/** 当前是否判定 CDN 不可用（探测完成前恒 false，不阻塞任何正常路径） */
export function isCdnDown(): boolean {
  return cdnDown;
}

/** 订阅 CDN 健康状态变化（down 置位 / 恢复清除；返回退订函数） */
export function subscribeCdnHealth(fn: CdnHealthListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setDown(down: boolean): void {
  if (cdnDown === down) return;
  cdnDown = down;
  for (const fn of [...listeners]) fn(down);
}

/** 单次探测：HEAD manifest.json，3s 超时；超时/网络/非 2xx 均视为不可用 */
async function probeOnce(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CDN_PROBE_TIMEOUT_MS);
  try {
    const r = await fetch(PROBE_URL, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** 探测主循环：失败置 down 并每 30s 重探；成功一次即清除 down 并停止 */
async function probeLoop(): Promise<void> {
  while (true) {
    const ok = await probeOnce();
    if (ok) {
      setDown(false);
      return;
    }
    setDown(true);
    await new Promise((r) => {
      retryTimer = setTimeout(r, CDN_RETRY_INTERVAL_MS);
    });
  }
}

/**
 * 启动 CDN 健康探测（幂等，bootstrap 注册一次）。
 * 探测结果经 isCdnDown() / subscribeCdnHealth() 消费；模块内持有 retryTimer，
 * 测试通过 resetCdnHealth() 清理后重新探测。
 */
export function startCdnHealthProbe(): void {
  if (probeStarted) return;
  probeStarted = true;
  void probeLoop();
}

/** 测试专用：重置模块状态（停止重探定时器、清空订阅、清除 down 标记），允许重新探测 */
export function resetCdnHealthForTest(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  probeStarted = false;
  cdnDown = false;
  listeners.clear();
}
