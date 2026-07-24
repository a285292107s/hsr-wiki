/**
 * 油猴模式平台适配
 * - document-start：initFailsafe 隐藏宿主并启动分段计时（由 main.ts 同步调用）
 * - mount：body 就绪后创建 #nk-host → shadow-root → <style> + #nk-app
 */
import type { MountResult, NkPlatform } from './types';
import { initFailsafe, markStage, degrade, isDegraded, registerCleanup } from './failsafe';

const HOST_ID = 'nk-host';

/** body 可能尚未解析（document-start），轮询等待 */
function whenBody(): Promise<HTMLElement> {
  if (document.body) return Promise.resolve(document.body);
  return new Promise((resolve) => {
    const onReady = () => {
      if (document.body) resolve(document.body);
      else requestAnimationFrame(onReady);
    };
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
    requestAnimationFrame(onReady);
  });
}

export function createUserscriptPlatform(): NkPlatform {
  // 立即进入隐藏态并启动 failsafe（纯 vanilla，先于任何 Vue 代码）
  initFailsafe();

  return {
    mode: 'userscript',
    get degraded() {
      return isDegraded();
    },
    markStage,
    degrade,
    registerCleanup,
    async mount(cssText: string): Promise<MountResult> {
      const body = await whenBody();
      let host = document.getElementById(HOST_ID);
      if (!host) {
        host = document.createElement('div');
        host.id = HOST_ID;
        host.style.cssText = 'position:fixed;inset:0;z-index:9999;';
        body.appendChild(host);
      }
      const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = cssText;
      const container = document.createElement('div');
      container.id = 'nk-app';
      shadow.append(style, container);
      return { container, shadow, host };
    },
  };
}
