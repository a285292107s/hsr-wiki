import type { SpineResolvedSceneLayer, SpineSceneEntry } from '../services/types';

export type SpineRuntimeVersion = '4.1' | '4.2';

export interface SpineAtlasPage {
  texture?: { bind(): void } | null;
}

export interface SpineCamera {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  position: { x: number; y: number };
  setViewport(w: number, h: number): void;
  update(): void;
}

export interface SkelSlot {
  data: { index: number; blendMode: number; attachmentName?: string | null };
  setAttachment(attachment: unknown): void;
  attachment?: unknown | null;
}

export interface DrawOrderSlot {
  data: { index: number; blendMode: number };
}

export interface SkelLike {
  slots: SkelSlot[];
  drawOrder?: DrawOrderSlot[];
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
  resume?(): void;
  requestFrame?(): void;
  assetManager?: { require(url: string): { pages?: SpineAtlasPage[] } | null } | null;
  context?: { gl?: WebGLRenderingContext | null } | null;
  skeleton?: SkelLike | null;
  config?: { atlasUrl?: string } | null;
  canvas?: HTMLCanvasElement | null;
  sceneRenderer?: { camera?: SpineCamera | null } | null;
}

export interface SpinePlayerConfig {
  skelUrl?: string;
  jsonUrl?: string;
  atlasUrl: string;
  rawDataURIs?: Record<string, string>;
  alpha?: boolean;
  backgroundColor?: string;
  fit?: 'contain' | 'cover';
  update?: (player: SpinePlayerInstance, delta: number) => void;
  draw?: (player: SpinePlayerInstance, delta: number) => void;
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
  premultipliedAlpha?: boolean;
  showControls?: boolean;
  showLoading?: boolean;
  preserveDrawingBuffer?: boolean;
  success?: (p: SpinePlayerInstance) => void;
  error?: (p: SpinePlayerInstance, msg: string) => void;
}

export type SpinePlayerCtor = new (container: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;

export interface SpineSceneRenderer {
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

export interface SpineSceneSkeleton extends SkelLike {
  updateWorldTransform(physics: number): void;
}

export interface SpineLib {
  SpinePlayer?: SpinePlayerCtor;
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

export interface SpineSceneMountOptions {
  container: HTMLElement;
  layers: SpineResolvedSceneLayer[];
  viewport: SpineSceneEntry['viewport'];
  lib: SpineLib;
  onReady: () => void;
}

export interface SpineSceneController {
  teardown(): void;
}

export interface SpineScenePipelineOptions {
  container: HTMLElement;
  layers: SpineResolvedSceneLayer[];
  viewport: SpineSceneEntry['viewport'];
  lib: SpineLib;
  preserveDrawingBuffer?: boolean;
  skipWhenHidden?: boolean;
  stageCss?: string;
  onSettled?: (result: { items: SceneItem[]; missing: string[] }) => void;
  onError?: (message: string) => void;
  loadTimeoutMs?: number;
}

export interface SpineScenePipelineController {
  settled: Promise<{ items: SceneItem[]; missing: string[] }>;
  canvas: HTMLCanvasElement | null;
  items: SceneItem[];
  setPaused(on: boolean): void;
  stepOnce(delta: number): void;
  teardown(): void;
}

export const BLEND_NAMES: Record<number, string> = { 0: 'normal', 1: 'additive', 2: 'multiply', 3: 'screen' };
