/**
 * Standalone 模式平台适配（独立预览站点）
 * 无宿主可隐藏、无 failsafe 需求；同样使用 Shadow DOM 挂载，
 * 保证 `:host` CSS 令牌与油猴模式行为完全一致。
 */
import type { MountResult, NkPlatform } from './types';

export function createStandalonePlatform(): NkPlatform {
  return {
    mode: 'standalone',
    get degraded() {
      return false;
    },
    markStage() {
      /* standalone 无分段检测 */
    },
    degrade() {
      /* standalone 无宿主可恢复 */
    },
    registerCleanup() {
      /* standalone 无降级清理需求 */
    },
    async mount(cssText: string): Promise<MountResult> {
      let host = document.getElementById('app');
      if (!host) {
        host = document.createElement('div');
        host.id = 'app';
        document.body.appendChild(host);
      }
      const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '';
      const style = document.createElement('style');
      style.textContent = cssText;
      const container = document.createElement('div');
      container.id = 'nk-app';
      shadow.append(style, container);
      // 页面底色与主题一致，避免边缘露白
      document.documentElement.style.background = '#0F0F23';
      document.body.style.background = '#0F0F23';
      return { container, shadow, host };
    },
  };
}
