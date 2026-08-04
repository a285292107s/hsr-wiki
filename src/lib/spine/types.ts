/**
 * Spine 引擎层共享类型契约（全站唯一收口）
 *
 * spine-player / spine-webgl 为 CDN IIFE 运行时（注入全局 window.spine），无本地类型声明。
 * 本文件维护其松散实例/配置/场景 API 类型的唯一来源：
 * - 生产编排（app/character/spine.ts）与调试验收台（SpineDebugView / SpineAuditView）共用
 * - 升级运行时（4.2.x → 新版本）时只需回归本文件契约 + 审核台 L2 渲染检查
 * 字段按运行时实际暴露按需探测，可空字段以 `?` 标注。
 */
import type { SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';

/** atlas 纹理页（画质修复用） */
export interface SpineAtlasPage {
  texture?: { bind(): void } | null;
}

/** spine-player 内部相机（OrthoCamera）：可见世界范围 = zoom × viewportWidth/Height */
export interface SpineCamera {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  position: { x: number; y: number };
  setViewport(w: number, h: number): void;
  update(): void;
}

/** 骨架 slot 松散形态 */
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

/** spine-player 播放器实例（松散契约；字段按需探测，升级运行时需回归验证） */
export interface SpinePlayerInstance {
  dispose(): void;
  setAnimation(name: string): void;
  play(): void;
  pause(): void;
  resume(): void;
  /** 手动请求渲染一帧（暂停状态下步进后刷新画面） */
  requestFrame(): void;
  assetManager?: { require(url: string): { pages?: SpineAtlasPage[] } | null } | null;
  context?: { gl?: WebGLRenderingContext | null } | null;
  skeleton?: SkelLike | null;
  config?: { atlasUrl?: string } | null;
  /** 4.2.43 运行时实际暴露（IIFE 全局实例） */
  canvas?: HTMLCanvasElement | null;
  sceneRenderer?: { camera?: SpineCamera | null } | null;
}

/** spine-player 播放器配置（生产/审核台共用参数基线；升级运行时需回归验证） */
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
  /** 每帧钩子（drawFrame 内相机计算之后、绘制之前执行），用于强制修正相机映射 */
  update?: (player: SpinePlayerInstance, delta: number) => void;
  /** 骨架绘制完成后回调（帧内可安全 readPixels，审核台像素采样用） */
  draw?: (player: SpinePlayerInstance, delta: number) => void;
  /** 固定世界视口（多层场景对齐用）：给定 x/y/width/height 后不再按动画边界自动计算；
   *  pad* 设为数值 0 关闭默认 10% 边距 */
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
  /** nanoka/官网 atlas 均无 pma 字段 = 直通 alpha 纹理，必须 false（true 会预乘混合导致边缘亮边伪影） */
  premultipliedAlpha?: boolean;
  showControls?: boolean;
  showLoading?: boolean;
  /** 保留绘制缓冲：关闭后读回/导出只能拿到最近一帧（rAF 暂停时可能全空）；调试页开启以便稳定采样 */
  preserveDrawingBuffer?: boolean;
  success?: (p: SpinePlayerInstance) => void;
  error?: (p: SpinePlayerInstance, msg: string) => void;
}

export type SpinePlayerCtor = new (container: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;

/* ─── 场景级渲染（spine-webgl 原生 API；生产 mountSpineScene 与调试验收台共用） ─── */

export interface SpineSceneRenderer {
  /** position 为 Vector3：set(x, y, z) 三参全传（z 缺省 undefined 会污染 view 矩阵） */
  camera: {
    position: { set(x: number, y: number, z: number): void };
    viewportWidth: number;
    viewportHeight: number;
    zoom: number;
  };
  begin(): void;
  end(): void;
  drawSkeleton(s: unknown, premultipliedAlpha?: boolean): void;
  dispose(): void;
}

export interface SpineSceneAssetManager {
  setRawDataURI(path: string, url: string): void;
  loadTextureAtlas(url: string): void;
  loadJson(url: string): void;
  loadAll(): Promise<unknown>;
  get(url: string): unknown;
}

export interface SpineSceneAnimState {
  update(d: number): void;
  apply(s: unknown): void;
  setAnimation(track: number, name: string, loop: boolean): void;
}

/** 场景层骨架：在 SkelLike（实验辅助函数通用形态）之上补充 updateWorldTransform */
export interface SpineSceneSkeleton extends SkelLike {
  updateWorldTransform(physics: number): void;
}

export interface SpineLib {
  SceneRenderer: new (canvas: HTMLCanvasElement, gl: WebGLRenderingContext, twoColorTint?: boolean) => SpineSceneRenderer;
  AssetManager: new (gl: WebGLRenderingContext, pathPrefix: string) => SpineSceneAssetManager;
  SkeletonJson: new (loader: unknown) => { readSkeletonData(json: unknown): unknown };
  AtlasAttachmentLoader: new (atlas: unknown) => unknown;
  Skeleton: new (data: unknown) => SpineSceneSkeleton;
  AnimationState: new (data: unknown) => SpineSceneAnimState;
  AnimationStateData: new (data: unknown) => unknown;
  Physics: { update: number };
}

export interface SceneItem {
  skeleton: SpineSceneSkeleton;
  state: SpineSceneAnimState;
}

/** 场景挂载输入（layers 按叠加顺序底→顶；viewport 为共享固定世界视口） */
export interface SpineSceneMountOptions {
  container: HTMLElement;
  layers: SpineResolvedSceneLayer[];
  viewport: SpineSceneEntry['viewport'];
  lib: SpineLib;
  /** 场景就绪回调（资源加载完成且至少一层骨架构建成功） */
  onReady: () => void;
}

/** 场景控制器：teardown 释放渲染循环 + WebGL 资源 + 舞台 DOM + 尺寸监听 */
export interface SpineSceneController {
  teardown(): void;
}

/** 混合模式数值 → 可读名（0=normal 1=additive 2=multiply 3=screen） */
export const BLEND_NAMES: Record<number, string> = { 0: 'normal', 1: 'additive', 2: 'multiply', 3: 'screen' };
