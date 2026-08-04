/**
 * Spine 调试共享设施（SpineDebugView KV 场景验收台 / SpineAuditView 审核台共用）：
 * spine-player 4.2.43 运行时动态加载（多 CDN 兜底）、松散实例类型、资源配置构造与骨架实验工具。
 * 与 character/spine.ts 生产渲染共用同一运行时版本与参数基线（premultipliedAlpha=false 等）。
 */

import { SPINE_RUNTIME_CDNS } from '../../lib/constants';

// 验收报告展示用（常量本体定义于 lib/constants.ts，生产/调试共用单一来源）
export { SPINE_RUNTIME_VERSION } from '../../lib/constants';

/* ─── spine-player 松散类型（CDN IIFE 运行时注入全局 spine） ─── */

export interface SkelSlot {
  data: { index: number; blendMode: number; attachmentName?: string | null };
  setAttachment(attachment: unknown): void;
  attachment?: unknown | null;
}
/** 光效后置实验：drawOrder 元素（Slot 的松散类型） */
export interface DebugDrawOrderSlot {
  data: { index: number; blendMode: number };
}
/** 骨架通用形态（player 骨架与合并渲染骨架共用实验辅助函数） */
export interface SkelLike {
  slots: SkelSlot[];
  drawOrder?: DebugDrawOrderSlot[];
  getAttachment(slotIndex: number, name: string): unknown;
  update(delta: number): void;
  data?: {
    animations?: { name: string }[] | null;
    skins?: { name: string }[] | null;
    bones?: unknown[] | null;
    slots?: unknown[] | null;
  } | null;
}
export interface SpinePlayerInstance {
  dispose(): void;
  setAnimation(name: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  /** 手动请求渲染一帧（暂停状态下步进后刷新画面） */
  requestFrame(): void;
  /** 播放器画布（像素采样用） */
  canvas?: HTMLCanvasElement | null;
  context?: { gl?: WebGLRenderingContext | null } | null;
  skeleton?: SkelLike | null;
}
export interface SpinePlayerConfig {
  /** nanoka 源：二进制骨架（skel 与 json 二选一） */
  skelUrl?: string;
  /** 官网源：JSON 骨架（skel 与 json 二选一） */
  jsonUrl?: string;
  atlasUrl: string;
  /** 官网源：纹理路径（atlas 目录 + 逻辑名）→ 实际 hash URL 映射（ADR 0009） */
  rawDataURIs?: Record<string, string>;
  alpha?: boolean;
  backgroundColor?: string;
  /** 骨架适配容器方式：contain（默认，完整可见）/ cover（铺满裁剪） */
  fit?: 'contain' | 'cover';
  premultipliedAlpha?: boolean;
  viewport?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    padLeft?: number | string;
    padRight?: number | string;
    padTop?: number | string;
    padBottom?: number | string;
  };
  showControls?: boolean;
  showLoading?: boolean;
  success?: (p: SpinePlayerInstance) => void;
  error?: (p: SpinePlayerInstance, msg: string) => void;
  /** 每帧钩子（drawFrame 内相机计算之后、绘制之前执行），用于强制修正相机映射 */
  update?: (p: SpinePlayerInstance, delta: number) => void;
  /** 骨架绘制完成后回调（帧内可安全 readPixels，审核台像素采样用） */
  draw?: (p: SpinePlayerInstance, delta: number) => void;
}
export type SpinePlayerCtor = new (container: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;

/** 运行时加载单例 Promise：失败后自动置空允许重试，成功则共享结果 */
let _runtimeLoad: Promise<boolean> | null = null;

export function getSpineCtor(): SpinePlayerCtor | null {
  const g = globalThis as { spine?: { SpinePlayer?: SpinePlayerCtor } };
  return (g.spine && g.spine.SpinePlayer) || null;
}

/** 动态加载 spine-player 运行时（CDN IIFE；全部 CDN 失败时返回 false 并允许下次重试） */
export function loadSpineRuntime(): Promise<boolean> {
  if (getSpineCtor()) return Promise.resolve(true);
  if (_runtimeLoad) return _runtimeLoad;
  _runtimeLoad = (async () => {
    for (const url of SPINE_RUNTIME_CDNS) {
      const ok = await new Promise<boolean>((resolve) => {
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => resolve(!!getSpineCtor());
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
      });
      if (ok) return true;
    }
    return false;
  })().then((ok) => {
    if (!ok) _runtimeLoad = null; // 失败后清空单例 → 「重新加载」按钮可重试
    return ok;
  });
  return _runtimeLoad;
}

/** 释放 SpinePlayer：主动丢弃 WebGL 上下文（dispose 只释放 GL 资源，显式 loseContext 立即回收配额） */
export function disposePlayer(p: SpinePlayerInstance): void {
  try {
    const gl = p.context && p.context.gl;
    if (gl && typeof gl.getExtension === 'function') gl.getExtension('WEBGL_lose_context')?.loseContext();
    p.dispose();
  } catch { /* 已释放或运行时异常均静默 */ }
}

/** 混合模式数值 → 可读名（0=normal 1=additive 2=multiply 3=screen） */
export const BLEND_NAMES: Record<number, string> = { 0: 'normal', 1: 'additive', 2: 'multiply', 3: 'screen' };

/** 动画挑选：优先精确 idle，其次 idle/standby 系，否则首个 */
export function pickAnimName(names: string[]): string {
  return names.find((n) => n === 'idle') || names.find((n) => /idle|standby|stand/i.test(n)) || names[0] || '';
}

/** 官网源配置：atlas 原样加载 + rawDataURIs 把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL */
export function buildOfficialConfig(layer: {
  atlas: string;
  json: string;
  textures: Record<string, string>;
}): { jsonUrl: string; atlasUrl: string; rawDataURIs: Record<string, string> } {
  const atlasDir = layer.atlas.slice(0, layer.atlas.lastIndexOf('/') + 1);
  const rawDataURIs: Record<string, string> = {};
  for (const [logicalName, realUrl] of Object.entries(layer.textures)) {
    rawDataURIs[atlasDir + logicalName] = realUrl;
  }
  return { jsonUrl: layer.json, atlasUrl: layer.atlas, rawDataURIs };
}

/* ─── 骨架实验辅助（单层 player 与合并渲染共用） ─── */

/** 隐藏/恢复 screen(3)/additive(1) 混合的 slot（诊断黑块来源） */
export function applyBlendsHiddenOn(skel: SkelLike, hidden: boolean): void {
  for (const slot of skel.slots) {
    const bm = slot.data.blendMode;
    if (bm !== 1 && bm !== 3) continue;
    if (hidden) {
      slot.setAttachment(null);
    } else if (slot.data.attachmentName) {
      slot.setAttachment(skel.getAttachment(slot.data.index, slot.data.attachmentName));
    }
  }
}

/** 强制把非 normal slot 的混合模式改为 normal（saved 记录原值用于恢复） */
export function applyForceNormalOn(skel: SkelLike, on: boolean, saved: Map<number, number>): void {
  for (const slot of skel.slots) {
    const bm = slot.data.blendMode;
    if (bm === 0) continue;
    if (on) {
      saved.set(slot.data.index, bm);
      slot.data.blendMode = 0;
    } else {
      slot.data.blendMode = saved.get(slot.data.index) ?? bm;
    }
  }
}

/** 光效后置：把 screen/additive 混合的 slot 移到 drawOrder 末尾（模拟 Three.js 透明后置） */
export function applyBlendLastOn(skel: SkelLike, on: boolean, holder: { savedDrawOrder: DebugDrawOrderSlot[] | null }): void {
  const order = skel.drawOrder;
  if (!order) return;
  if (on) {
    holder.savedDrawOrder = order.slice();
    const normal = order.filter((s) => s.data.blendMode === 0);
    const blended = order.filter((s) => s.data.blendMode !== 0);
    order.length = 0;
    order.push(...normal, ...blended);
  } else if (holder.savedDrawOrder) {
    order.length = 0;
    order.push(...holder.savedDrawOrder);
  }
}
