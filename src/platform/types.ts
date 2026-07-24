/**
 * 平台抽象层类型定义
 * 油猴模式与 Standalone 模式的唯一结构性差异集中于此，应用代码 100% 共享。
 */

export type PlatformMode = 'userscript' | 'standalone';

/** 分段检测阶段（ADR-0001）：vue-loaded → app-mounted → data-ready，任一段 8s 超时即降级 */
export type FailStage = 'vue-loaded' | 'app-mounted' | 'data-ready';

export interface MountResult {
  /** Vue 应用挂载容器（#nk-app，位于 Shadow Root 内） */
  container: HTMLElement;
  /** 单一 Shadow Root（全部 CSS 与 UI 隔离于此） */
  shadow: ShadowRoot;
  /** Shadow Host（#nk-host，fixed 覆盖视口） */
  host: HTMLElement;
}

export interface NkPlatform {
  readonly mode: PlatformMode;

  /** 是否已降级（降级后应用停止一切渲染与数据活动） */
  readonly degraded: boolean;

  /**
   * 创建挂载结构：#nk-host → shadow-root → <style> + #nk-app
   * @param cssText 全量应用 CSS（tokens + character + catalog）
   */
  mount(cssText: string): Promise<MountResult>;

  /** 标记分段完成，推进 failsafe 计时（standalone 为 no-op） */
  markStage(stage: FailStage): void;

  /** 降级：销毁 Shadow 树、恢复宿主可见性（standalone 为 no-op） */
  degrade(reason: string): void;

  /** 注册降级时需要执行的清理（如 app.unmount()；standalone 为 no-op） */
  registerCleanup(fn: () => void): void;
}
