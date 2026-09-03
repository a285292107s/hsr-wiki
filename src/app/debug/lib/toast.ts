/**
 * 研究线 toast（Spine Lab 迁入主站后桥接主 store）：
 * 研究线组件调用 toast(type, message) 不感知 Pinia，这里桥接 useAppStore().toast
 * （主站路由 /debug 仅在 dev 注册，运行时 Pinia 已就绪），由全局 ToastHost 渲染。
 * TTL 沿用研究线原 2500ms（主 store 默认 3500ms）。
 */
import { useAppStore } from '../../stores/app';

export type LabToastType = 'success' | 'error';

export function toast(type: LabToastType, message: string): void {
  const app = useAppStore();
  app.toast(type, message, 2500);
}
