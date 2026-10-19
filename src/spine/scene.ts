import type { SpineResolvedSceneLayer } from '../services/types';
import { pickAnimName } from './player';
import type {
  SceneItem,
  SpineAtlasPage,
  SpineLib,
  SpineSceneAnimState,
  SpineSceneAssetManager,
  SpineSceneController,
  SpineSceneMountOptions,
  SpineScenePipelineController,
  SpineScenePipelineOptions,
  SpineSceneSkeleton,
} from './types';

export function buildSceneItems(
  lib: SpineLib,
  manager: SpineSceneAssetManager,
  layers: SpineResolvedSceneLayer[],
): { items: SceneItem[]; missing: string[] } {
  const items: SceneItem[] = [];
  const missing: string[] = [];
  for (const layer of layers) {
    const atlas = manager.get(layer.atlas);
    const json = manager.get(layer.json);
    if (!atlas || !json) {
      missing.push(layer.atlas);
      continue;
    }
    const data = new lib.SkeletonJson(new lib.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
    const skeleton = new lib.Skeleton(data) as SpineSceneSkeleton;
    const state = new lib.AnimationState(new lib.AnimationStateData(data)) as SpineSceneAnimState;
    const anims = (data as { animations?: { name: string }[] }).animations || [];
    const chosen = pickAnimName(anims.map((a) => a.name));
    if (chosen) state.setAnimation(0, chosen, true);
    items.push({ skeleton, state });
  }
  return { items, missing };
}

function applyAtlasQualityFixes(
  manager: SpineSceneAssetManager,
  layers: SpineResolvedSceneLayer[],
  gl: WebGLRenderingContext,
): void {
  try {
    for (const layer of layers) {
      const atlas = manager.get(layer.atlas) as { pages?: SpineAtlasPage[] } | null;
      if (!atlas || !atlas.pages) continue;
      for (const page of atlas.pages) {
        if (page.texture) {
          page.texture.bind();
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
      }
    }
  } catch {
  }
}

export function createScenePipeline(opts: SpineScenePipelineOptions): SpineScenePipelineController {
  const { container, layers, viewport, lib } = opts;
  const skipWhenHidden = opts.skipWhenHidden ?? true;

  let cancelled = false;
  let rafId = 0;
  let stage: HTMLDivElement | null = null;
  let onStageResize: (() => void) | null = null;
  let teardownGl: (() => void) | null = null;
  let paused = false;
  let stepDelta: number | null = null;
  let loadTimer: ReturnType<typeof setTimeout> | null = null;
  const loadTimeoutMs = opts.loadTimeoutMs ?? 20_000;

  let settle: (r: { items: SceneItem[]; missing: string[] }) => void;
  let rejectSettled: (e: unknown) => void;
  const settled = new Promise<{ items: SceneItem[]; missing: string[] }>((resolve, reject) => {
    settle = resolve;
    rejectSettled = reject;
  });
  let settledOnce = false;
  const settleOnce = (r: { items: SceneItem[]; missing: string[] }): void => {
    if (settledOnce) return;
    settledOnce = true;
    if (loadTimer !== null) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
    settle(r);
    opts.onSettled?.(r);
  };
  const failOnce = (reason: string): void => {
    if (settledOnce) return;
    settledOnce = true;
    if (loadTimer !== null) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
    rejectSettled(new Error(reason));
  };

  const canvas: HTMLCanvasElement | null = null;
  const ctrl: SpineScenePipelineController = {
    settled,
    canvas,
    items: [],
    setPaused(on: boolean): void {
      paused = on;
    },
    stepOnce(delta: number): void {
      stepDelta = delta;
    },
    teardown,
  };

  function teardown(): void {
    cancelled = true;
    if (loadTimer !== null) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
    if (teardownGl) {
      teardownGl();
      teardownGl = null;
    }
    if (onStageResize) {
      window.removeEventListener('resize', onStageResize);
      onStageResize = null;
    }
    if (stage) {
      stage.remove();
      stage = null;
    }
  }

  if (!container.isConnected) return ctrl;

  const stageEl = document.createElement('div');
  const ar = viewport.width > 0 && viewport.height > 0 ? viewport.width / viewport.height : 16 / 9;
  const dpr = window.devicePixelRatio || 1;
  const STAGE_W = Math.round(Math.min(1920, 2560 / dpr));
  const STAGE_H = Math.round(STAGE_W / ar);
  stageEl.style.cssText = opts.stageCss
    ?? `position:absolute;left:50%;top:50%;width:${STAGE_W}px;height:${STAGE_H}px;overflow:hidden;pointer-events:none;`;
  if (!stageEl.style.width) stageEl.style.width = `${STAGE_W}px`;
  if (!stageEl.style.height) stageEl.style.height = `${STAGE_H}px`;
  const layoutStage = (): void => {
    if (opts.stageCss) return;
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.max(r.width / STAGE_W, r.height / STAGE_H);
    stageEl.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(4)})`;
  };
  layoutStage();
  if (!opts.stageCss) {
    onStageResize = layoutStage;
    window.addEventListener('resize', layoutStage);
  }

  const cvs = document.createElement('canvas');
  cvs.width = Math.round(STAGE_W * dpr);
  cvs.height = Math.round(STAGE_H * dpr);
  cvs.style.cssText = 'width:100%;height:100%;display:block;';
  stageEl.appendChild(cvs);
  container.appendChild(stageEl);
  stage = stageEl;
  ctrl.canvas = cvs;

  const glCtxAttrs: WebGLContextAttributes = { alpha: true };
  if (opts.preserveDrawingBuffer) glCtxAttrs.preserveDrawingBuffer = true;
  const gl = cvs.getContext('webgl2', glCtxAttrs) || cvs.getContext('webgl', glCtxAttrs);
  if (!gl) {
    opts.onError?.('WebGL 不可用');
    return ctrl;
  }
  const renderer = new lib.SceneRenderer(cvs, gl, true);
  renderer.camera.position.set(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2, 0);
  renderer.camera.viewportWidth = viewport.width;
  renderer.camera.viewportHeight = viewport.height;
  renderer.camera.zoom = 1;

  teardownGl = (): void => {
    cancelAnimationFrame(rafId);
    try {
      renderer.dispose();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
    }
  };

  const manager = new lib.AssetManager(gl, '');
  for (const layer of layers) {
    const atlasDir = layer.atlas.slice(0, layer.atlas.lastIndexOf('/') + 1);
    for (const [logical, real] of Object.entries(layer.textures)) {
      manager.setRawDataURI(atlasDir + logical, real);
    }
    manager.loadTextureAtlas(layer.atlas);
    manager.loadJson(layer.json);
  }

  void manager
    .loadAll()
    .catch(() => undefined)
    .then(() => {
      if (settledOnce) return;
      if (cancelled) {
        failOnce("场景渲染已取消");
        return;
      }
      if (!container.isConnected) {
        failOnce("容器已从文档移除");
        return;
      }
      try {
        const { items, missing } = buildSceneItems(lib, manager, layers);
        for (const atlas of missing) console.warn(`[nk-wiki] spine 场景层资源缺失，已跳过: ${atlas}`);
        if (items.length === 0) {
          settleOnce({ items, missing });
          opts.onError?.(`全部场景层资源缺失（${missing.length} 层）`);
          return;
        }
        applyAtlasQualityFixes(manager, layers, gl);
        ctrl.items = items;
        settleOnce({ items, missing });
        let last = performance.now();
        const frame = (now: number): void => {
          if (cancelled) return;
          rafId = requestAnimationFrame(frame);
          if (skipWhenHidden && document.hidden) return;
          let delta = Math.min((now - last) / 1000, 0.1);
          last = now;
          if (stepDelta !== null) {
            delta = stepDelta;
            stepDelta = null;
          } else if (paused) {
            delta = 0;
          }
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          renderer.begin();
          for (const it of items) {
            it.state.update(delta);
            it.state.apply(it.skeleton);
            it.skeleton.updateWorldTransform(lib.Physics.update);
            renderer.drawSkeleton(it.skeleton);
          }
          renderer.end();
        };
        rafId = requestAnimationFrame(frame);
      } catch (e) {
        console.warn('[nk-wiki] spine 场景构建失败:', e);
        settleOnce({ items: [], missing: [] });
        opts.onError?.(String(e));
      }
    })
    .catch((e: unknown) => {
      console.warn('[nk-wiki] spine 场景资源加载失败:', e);
      settleOnce({ items: [], missing: [] });
      opts.onError?.(String(e));
    });

  loadTimer = setTimeout(() => {
    console.warn(`[nk-wiki] spine 场景资源加载超时（${Math.round(loadTimeoutMs / 1000)}s），按全部层缺失结算`);
    settleOnce({ items: [], missing: layers.map((l) => l.atlas) });
    opts.onError?.(`场景资源加载超时（${Math.round(loadTimeoutMs / 1000)}s）`);
    teardown();
  }, loadTimeoutMs);

  return ctrl;
}

export function mountSpineScene(options: SpineSceneMountOptions): SpineSceneController {
  const ctrl = createScenePipeline({
    container: options.container,
    layers: options.layers,
    viewport: options.viewport,
    lib: options.lib,
    skipWhenHidden: true,
    onSettled({ items }) {
      if (items.length > 0 && options.container.isConnected) options.onReady();
    },
    onError(msg) {
      console.warn('[nk-wiki] spine 场景渲染失败:', msg);
    },
  });
  return { teardown: ctrl.teardown };
}
