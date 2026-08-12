/**
 * Spine 场景渲染器（单画布多骨架，官网 Three.js 管线同款）
 *
 * 全部层骨架在同一画布按层序绘制，混合 slot（screen/additive/multiply）的 dst 始终为
 * 真实画面——修复多透明画布叠放时混合对透明 dst 退化产生不透明黑块的问题
 * （打光/光效纹理含暗色高 alpha 像素，additive/screen 对透明 dst 会写出暗色不透明像素）。
 * 全部层共享同一固定世界视口保证对齐（官网背景节点同款方案：各层骨架共享统一坐标系）。
 *
 * 架构：createScenePipeline 为唯一渲染管线实现，生产 mountSpineScene 与调试验收台
 * （Spine Lab 合并渲染）共用——「验收基线 = 生产渲染」由代码结构保证而非注释承诺；
 * 调试侧仅通过管线控制器的插桩点（items / canvas / setPaused / stepOnce）做诊断。
 *
 * 渲染方案：
 * - 固定设计画布舞台 + CSS scale 适配：canvas buffer 与舞台 CSS 恒为 1:1，
 *   buffer 比例永远等于视口比例（规避半屏 buffer 错位陷阱）
 * - 高 DPR 收缩舞台尺寸，保证 buffer 最长边 ≤ 2560（WebGL 内存控制）
 * - 页面不可见（document.hidden）时可跳过绘制（skipWhenHidden），恢复后自动续播
 * 相比旧版 N 个 SpinePlayer，仅占用 1 个 WebGL 上下文。
 */
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

/** 统一场景层骨架构建（loadAll 完成后调用）：逐层 get()，任一层资源缺失仅跳过该层
 * （局部降级，与生产 mountSpineScene 语义一致），全部缺失时返回空 items。
 * @returns missing 缺失层的 atlas 列表（调用方用于警告展示/验收判定）
 */
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

/** 场景级抗锯齿修复（AssetManager 加载的 atlas 页同款 magFilter 覆盖） */
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
    /* 过滤覆盖失败不影响播放，仅画质回退 */
  }
}

/**
 * 创建场景渲染管线（生产与调试共用的唯一实现）。
 *
 * 就绪条件：资源加载完成且骨架构建结束——单层资源缺失仅跳过该层（局部降级）。
 * settled Promise / onSettled 必定结算一次（含全部层缺失、构建异常路径），可 await 作就绪信号。
 * teardown 可在任意阶段调用（含资源加载期间）：渲染循环 + WebGL 上下文 + 舞台 DOM + 尺寸监听全部回收。
 */
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
  /** 资源加载超时（CDN 连接黑洞时 loadAll 可能永不结算）：缺省 20s */
  const loadTimeoutMs = opts.loadTimeoutMs ?? 20_000;

  /* settled 必定结算一次：加载失败 / 全部层缺失 / 构建异常 / 加载超时路径均 resolve（空 items） */
  let settle: (r: { items: SceneItem[]; missing: string[] }) => void;
  const settled = new Promise<{ items: SceneItem[]; missing: string[] }>((resolve) => {
    settle = resolve;
  });
  let settledOnce = false;
  const settleOnce = (r: { items: SceneItem[]; missing: string[] }): void => {
    if (settledOnce) return; // 幂等闸门：超时与后续结算并发时只结算一次
    settledOnce = true;
    if (loadTimer !== null) {
      clearTimeout(loadTimer);
      loadTimer = null;
    }
    settle(r);
    opts.onSettled?.(r);
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

  /** 释放当前场景：渲染循环 + WebGL 资源 + 舞台 DOM + 尺寸监听 + 加载超时定时器 */
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

  // 官网同款方案：固定设计画布舞台（官网 boxStyle 1920×1080 同款，按视口实际比例取高），
  // canvas buffer 尺寸与舞台 CSS 恒为 1:1 → buffer 比例永远等于视口比例；
  // 舞台再对挂载容器做 CSS 级适配（居中）兼容任意窗口比例
  const stageEl = document.createElement('div');
  const ar = viewport.width > 0 && viewport.height > 0 ? viewport.width / viewport.height : 16 / 9;
  // 高 DPR 下收缩舞台 CSS 尺寸，保证 buffer 最长边 ≤ 2560（WebGL 内存控制；舞台会被缩放到容器，不损失清晰度）
  const dpr = window.devicePixelRatio || 1;
  const STAGE_W = Math.round(Math.min(1920, 2560 / dpr));
  const STAGE_H = Math.round(STAGE_W / ar);
  stageEl.style.cssText = opts.stageCss
    ?? `position:absolute;left:50%;top:50%;width:${STAGE_W}px;height:${STAGE_H}px;overflow:hidden;pointer-events:none;`;
  // 未覆盖宽高的自定义舞台样式补齐尺寸（调试页流式布局）
  if (!stageEl.style.width) stageEl.style.width = `${STAGE_W}px`;
  if (!stageEl.style.height) stageEl.style.height = `${STAGE_H}px`;
  const layoutStage = (): void => {
    if (opts.stageCss) return; // 自定义布局（流式/宽度自适应）由调用方 CSS 接管，不做容器适配
    const r = container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // 官网同款 cover 全幅铺满：任意窗口比例均无边框留白（场景主角化设计）。
    // 官网 KV 构图主体集中于画布 4%~96% 中央带：宽屏裁上下窄带、窄屏裁两侧，主体始终可见；
    // 透明区域由外层 Hero 渐变兑底背景承接
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
    return ctrl; // 保持视图层渐变兑底背景
  }
  const renderer = new lib.SceneRenderer(cvs, gl, true);
  // 相机 = 固定世界视口（中心对齐 vp 中心，与多层骨架共享坐标系）
  renderer.camera.position.set(viewport.x + viewport.width / 2, viewport.y + viewport.height / 2, 0);
  renderer.camera.viewportWidth = viewport.width;
  renderer.camera.viewportHeight = viewport.height;
  renderer.camera.zoom = 1;

  // GL 创建后立即可释放（资源加载期间 teardown 也回收上下文，修复旧版加载期泄漏点）
  teardownGl = (): void => {
    cancelAnimationFrame(rafId);
    try {
      renderer.dispose();
      // 显式 loseContext 立即释放上下文配额（回收依赖 GC 有延迟）
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      /* 已释放或运行时异常均静默 */
    }
  };

  const manager = new lib.AssetManager(gl, '');
  for (const layer of layers) {
    // 官网源：atlas 原样加载 + rawDataURIs 把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL（ADR 0009）
    const atlasDir = layer.atlas.slice(0, layer.atlas.lastIndexOf('/') + 1);
    for (const [logical, real] of Object.entries(layer.textures)) {
      manager.setRawDataURI(atlasDir + logical, real);
    }
    manager.loadTextureAtlas(layer.atlas);
    manager.loadJson(layer.json);
  }

  // 4.2.x AssetManager.loadAll 为 Promise 风格（内部 rAF 轮询完成状态）。
  // 注意：任一资源失败 loadAll 会 reject（errors 非空），此时不视为整体失败——
  // catch 后照常进入 then 分支，由逐层 get() 检查实现「缺失层跳过」的局部降级
  void manager
    .loadAll()
    .catch(() => undefined)
    .then(() => {
      if (cancelled || settledOnce) return; // 已卸载或已超时结算：不再构建/渲染（防超时后悬挂渲染）
      if (!container.isConnected) return;
      try {
        // 统一骨架构建：缺失层跳过（局部降级；生产与验收台共用同一实现保持同一语义）
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
          if (skipWhenHidden && document.hidden) return; // 页面不可见时暂停绘制（rAF 保持调度，恢复自动续播，省 GPU 带宽）
          let delta = Math.min((now - last) / 1000, 0.1);
          last = now; // 暂停期间持续更新基准，恢复播放无 delta 突跳
          if (stepDelta !== null) {
            delta = stepDelta; // 步进帧优先于暂停
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
            // premultipliedAlpha 默认 false：与全站基线一致（官网/nanoka atlas 均无 pma 字段 = 直通 alpha）
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

  // 资源加载超时兜底：连接黑洞时 loadAll 永不结算 → 按全部层缺失结算并释放本管线（防悬挂）
  loadTimer = setTimeout(() => {
    console.warn(`[nk-wiki] spine 场景资源加载超时（${Math.round(loadTimeoutMs / 1000)}s），按全部层缺失结算`);
    settleOnce({ items: [], missing: layers.map((l) => l.atlas) });
    opts.onError?.(`场景资源加载超时（${Math.round(loadTimeoutMs / 1000)}s）`);
    teardown();
  }, loadTimeoutMs);

  return ctrl;
}

/**
 * 挂载多层 Spine 场景（生产入口：每次调用创建全新独立场景；断点重建 = teardown + 重新 mount）。
 * 就绪条件：资源加载完成且至少一层骨架构建成功——单层资源缺失仅跳过该层。
 * teardown 可在任意阶段调用（含资源加载期间）：渲染循环 + WebGL 上下文 + 舞台 DOM + 尺寸监听全部回收。
 */
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
