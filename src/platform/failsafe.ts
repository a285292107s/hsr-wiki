/**
 * 分段检测 Failsafe（ADR-0001）
 *
 * ⚠️ 本模块必须是纯 vanilla 实现——不得 import 任何 Vue 生态模块。
 * 它在 document-start 阶段（Vue 尚未加载）就要工作：
 *
 *   1. initFailsafe()  —— 立即隐藏宿主（零闪烁），启动 vue-loaded 段计时
 *   2. markStage()     —— 每段完成推进计时：vue-loaded → app-mounted → data-ready
 *   3. degrade()       —— 任一段 8s 超时 / 数据层连续失败 / 引导异常：
 *                         销毁 #nk-host Shadow 树、移除隐藏样式、恢复宿主
 *
 * 宿主隐藏采用「离屏定位」而非 display:none（沿用原脚本验证过的方案）：
 * 保留宿主布局尺寸与 WebGL 渲染——目录页 DOM 抓取（content-card）依赖宿主
 * 在隐藏状态下仍正常渲染出卡片节点。
 */

const STAGE_TIMEOUT = 8000;
const HIDE_STYLE_ID = 'nk-hide-style';
const HIDE_CLASS = 'nk-host-hidden';
const HOST_ID = 'nk-host';

type Stage = 'vue-loaded' | 'app-mounted' | 'data-ready';
const STAGES: Stage[] = ['vue-loaded', 'app-mounted', 'data-ready'];

let degraded = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let cleanupFn: (() => void) | null = null;

function hideStyleText(): string {
  return `
    html.${HIDE_CLASS}, html.${HIDE_CLASS} body {
      background: #0F0F23 !important;
      overflow: hidden !important;
    }
    html.${HIDE_CLASS} body > *:not(#${HOST_ID}) {
      position: fixed !important;
      left: -9999px !important;
      top: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      opacity: 0 !important;
      pointer-events: none !important;
      z-index: -1 !important;
      overflow: hidden !important;
    }
  `;
}

/** document-start 阶段调用：隐藏宿主 + 启动第一段计时 */
export function initFailsafe(): void {
  if (document.getElementById(HIDE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = HIDE_STYLE_ID;
  style.textContent = hideStyleText();
  // document-start 时 head 可能尚未解析出来，回退到 documentElement
  (document.head || document.documentElement).appendChild(style);
  document.documentElement.classList.add(HIDE_CLASS);
  armTimer('vue-loaded');
}

/** 注册降级时需要执行的清理（如 Vue app.unmount()） */
export function registerCleanup(fn: () => void): void {
  cleanupFn = fn;
}

/** 标记某段完成；最后一段（data-ready）完成后停止计时，宿主保持隐藏 */
export function markStage(stage: Stage): void {
  if (degraded) return;
  clearTimer();
  const idx = STAGES.indexOf(stage);
  if (idx < 0 || idx >= STAGES.length - 1) return;
  armTimer(STAGES[idx + 1]);
}

/** 降级：恢复宿主原站，停止应用的一切活动 */
export function degrade(reason: string): void {
  if (degraded) return;
  degraded = true;
  clearTimer();
  // eslint-disable-next-line no-console
  console.warn(`[nk-wiki] degraded → ${reason}`);
  try {
    cleanupFn?.();
  } catch {
    /* 清理失败不阻塞恢复 */
  }
  document.getElementById(HOST_ID)?.remove();
  document.documentElement.classList.remove(HIDE_CLASS);
  document.getElementById(HIDE_STYLE_ID)?.remove();
  showRetryButton();
}

/** 降级后的角落重试按钮（纯 vanilla，重载页面重新引导脚本） */
function showRetryButton(): void {
  if (document.getElementById('nk-retry-btn')) return;
  const whenReady = () => {
    if (!document.body) {
      requestAnimationFrame(whenReady);
      return;
    }
    const btn = document.createElement('button');
    btn.id = 'nk-retry-btn';
    btn.textContent = '↻ 重试';
    btn.title = '脚本加载失败，已恢复原站界面';
    btn.style.cssText =
      'position:fixed;bottom:16px;right:16px;z-index:99999;padding:8px 16px;border-radius:8px;' +
      'border:1px solid rgba(124,58,237,0.4);background:rgba(15,15,35,0.9);color:#E2E8F0;' +
      'font-size:13px;cursor:pointer;backdrop-filter:blur(8px);';
    btn.onclick = () => location.reload();
    document.body.appendChild(btn);
  };
  whenReady();
}

export function isDegraded(): boolean {
  return degraded;
}

function armTimer(nextStage: Stage): void {
  timer = setTimeout(() => degrade(`stage-timeout:${nextStage}`), STAGE_TIMEOUT);
}

function clearTimer(): void {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}
