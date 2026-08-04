/**
 * Spine 骨骼动画查看器
 * 仅自主渲染（ADR 0002/0009）：动态加载 spine-player 运行时，按 Spine 清单分发渲染。
 * - skel 源：nanoka CDN .skel/.atlas（Spine 4.1.23）
 * - official 源：官网 CDN .json 骨架 + atlas 纹理重映射（Spine 4.2.43）
 * 资源路径：skel 为 static.nanoka.cc/assets/hsr/spine/{charId}/{name}.skel|.atlas
 * 运行时约束：spine-player 4.2.x 向后兼容 4.1 数据、向前不兼容（升级需回归验证）
 */
import { resolveSpine } from '../../services/api';
import type { SpineResolved, SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';
import { SPINE_RUNTIME_CDNS } from '../../lib/constants';
import { buildSceneItems, getSpineLib, type SpineLib, type SpineSceneAssetManager } from '../debug/spine-shared';

/* ─── spine-player 松散类型（IIFE 运行时注入全局 spine） ─── */

interface SpineAtlasPage {
  texture?: { bind(): void } | null;
}
/** spine-player 内部相机（OrthoCamera）：可见世界范围 = zoom × viewportWidth/Height */
interface SpineCamera {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  position: { x: number; y: number };
  setViewport(w: number, h: number): void;
  update(): void;
}
interface SpinePlayerInstance {
  dispose(): void;
  setAnimation(name: string): void;
  play(): void;
  assetManager?: { require(url: string): { pages?: SpineAtlasPage[] } | null } | null;
  context?: { gl?: WebGLRenderingContext | null } | null;
  skeleton?: { data?: { animations?: { name: string }[] } | null } | null;
  config?: { atlasUrl?: string } | null;
  /** 4.2.43 运行时实际暴露（IIFE 全局实例） */
  canvas?: HTMLCanvasElement | null;
  sceneRenderer?: { camera?: SpineCamera | null } | null;
}
interface SpinePlayerConfig {
  /** nanoka 源：二进制骨架（skel 与 official 二选一） */
  skelUrl?: string;
  /** 官网源：JSON 骨架（skel 与 official 二选一） */
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
  success?: (p: SpinePlayerInstance) => void;
  error?: (p: SpinePlayerInstance, msg: string) => void;
}
type SpinePlayerCtor = new (container: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;

let _runtimePromise: Promise<boolean> | null = null; // 运行时加载单例（避免重复下载 ~500KB）
let _players: SpinePlayerInstance[] = []; // 当前自主渲染单实例（角色页），路由切换时需释放；场景实例由 initSpineSceneViewer 局部管理

function getSpineCtor(): SpinePlayerCtor | null {
  const g = globalThis as { spine?: { SpinePlayer?: SpinePlayerCtor } };
  return (g.spine && g.spine.SpinePlayer) || null;
}

/** 释放全部 SpinePlayer：停止 rAF 循环 + 移除播放器 DOM + 释放 WebGL 资源，避免泄漏 */
export function disposeSpineViewer(): void {
  for (const p of _players) {
    try {
      p.dispose();
    } catch {
      /* 已释放或运行时异常均静默 */
    }
  }
  _players = [];
}

/**
 * 初始化 Spine 查看器（纯自主渲染）。
 * @param container 播放器挂载容器（.nk-hero__spine）
 * @param spineKey 清单条目键（角色 ID 或场景标识如 home-bg）
 * @param onReady 动画就绪回调（视图层据此点亮切换按钮 / 压暗背景）
 * @param opts 可选渲染参数（fit: cover 用于背景场景铺满）
 * @returns 清理函数（组件卸载 / 角色切换时调用）
 */
export function initSpineViewer(
  container: HTMLElement,
  spineKey: string,
  onReady: () => void,
  opts?: { fit?: 'contain' | 'cover' },
): () => void {
  renderSpineSelf(container, spineKey, (ok) => {
    if (ok && container.isConnected) onReady();
  }, opts);
  return () => {
    disposeSpineViewer();
  };
}

/**
 * 初始化多层场景 Spine（official-scene 条目，如枢纽页背景）。
 * 单画布多骨架渲染（官网 Three.js 管线同款）：全部层骨架在同一画布按层序绘制，
 * 混合 slot（screen/additive/multiply）的 dst 始终为真实画面——
 * 修复旧版多透明画布叠放时混合对着透明 dst 产生不透明黑块的问题
 * （打光/光效纹理含暗色高 alpha 像素，additive/screen 对透明 dst 会写出暗色不透明像素）。
 * 全部层共享同一固定世界视口保证对齐（官网背景节点同款方案：各层骨架共享统一坐标系）。
 * 就绪条件：资源加载完成且至少一层骨架构建成功——单层资源缺失仅跳过该层。
 * 窄屏（<768px）仅渲染主背景层以控制 WebGL 开销，跨断点变化时自动重建。
 * 相比旧版 N 个 SpinePlayer，仅占用 1 个 WebGL 上下文。
 * @param container 场景挂载容器（内部自建舞台 + 单画布）
 * @param sceneKey 清单条目键（如 home-bg）
 * @param onReady 场景就绪回调（视图层据此点亮切换按钮 / 压暗背景）
 * @returns 清理函数
 */
export function initSpineSceneViewer(
  container: HTMLElement,
  sceneKey: string,
  onReady: () => void,
): () => void {
  let cancelled = false; // 清理后终止一切异步行为（加载完成 / 断点重建）
  let stage: HTMLDivElement | null = null;
  let rafId = 0;
  let mq: MediaQueryList | null = null;
  let rebuild: (() => void) | null = null;
  let onStageResize: (() => void) | null = null;
  let teardownCanvas: (() => void) | null = null;

  /** 释放当前场景：渲染循环 + WebGL 资源 + 舞台 DOM + 尺寸监听（断点重建 / 组件卸载共用） */
  const teardownScene = (): void => {
    if (teardownCanvas) {
      teardownCanvas();
      teardownCanvas = null;
    }
    if (onStageResize) {
      window.removeEventListener('resize', onStageResize);
      onStageResize = null;
    }
    if (stage) {
      stage.remove();
      stage = null;
    }
  };

  /**
   * 构建场景舞台：单画布顺序渲染全部层（layers 顺序 = renderOrder 升序 = 官网绘制顺序）。
   */
  const buildScene = async (
    layers: SpineResolvedSceneLayer[],
    vp: SpineSceneEntry['viewport'],
    lib: SpineLib,
  ): Promise<void> => {
    if (cancelled || !container.isConnected) return;
    // 官网同款方案：固定设计画布舞台（官网 boxStyle 1920×1080 同款，按视口实际比例取高），
    // canvas buffer 尺寸与舞台 CSS 恒为 1:1 → buffer 比例永远等于视口比例；
    // 舞台再对挂载容器做 CSS 级适配（居中）兼容任意窗口比例
    const stageEl = document.createElement('div');
    const ar = vp.width > 0 && vp.height > 0 ? vp.width / vp.height : 16 / 9;
    // 高 DPR 下收缩舞台 CSS 尺寸，保证 buffer 最长边 ≤ 2560（WebGL 内存控制；舞台会被缩放到容器，不损失清晰度）
    const dpr = window.devicePixelRatio || 1;
    const STAGE_W = Math.round(Math.min(1920, 2560 / dpr));
    const STAGE_H = Math.round(STAGE_W / ar);
    stageEl.style.cssText = `position:absolute;left:50%;top:50%;width:${STAGE_W}px;height:${STAGE_H}px;overflow:hidden;pointer-events:none;`;
    const layoutStage = (): void => {
      const r = container.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // 官网同款 cover 全幅铺满：任意窗口比例均无边框留白（场景主角化设计）。
      // 官网 KV 构图主体集中于画布 4%~96% 中央带：宽屏裁上下窄带、窄屏裁两侧，主体始终可见；
      // 透明区域由外层 Hero 渐变兑底背景承接
      const scale = Math.max(r.width / STAGE_W, r.height / STAGE_H);
      stageEl.style.transform = `translate(-50%,-50%) scale(${scale.toFixed(4)})`;
    };
    layoutStage();
    onStageResize = layoutStage;
    window.addEventListener('resize', layoutStage);

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(STAGE_W * dpr);
    canvas.height = Math.round(STAGE_H * dpr);
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    stageEl.appendChild(canvas);
    container.appendChild(stageEl);
    stage = stageEl;

    const gl = canvas.getContext('webgl2', { alpha: true }) || canvas.getContext('webgl', { alpha: true });
    if (!gl) return; // WebGL 不可用 → 保持视图层渐变兑底背景
    const renderer = new lib.SceneRenderer(canvas, gl, true);
    // 相机 = 固定世界视口（中心对齐 vp 中心，与多层骨架共享坐标系）
    renderer.camera.position.set(vp.x + vp.width / 2, vp.y + vp.height / 2, 0);
    renderer.camera.viewportWidth = vp.width;
    renderer.camera.viewportHeight = vp.height;
    renderer.camera.zoom = 1;

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
        if (cancelled || !container.isConnected) return;
        try {
          // 统一骨架构建：缺失层跳过（局部降级；与调试验收台共用 buildSceneItems 保持同一语义）
          const { items, missing } = buildSceneItems(lib, manager, layers);
          for (const atlas of missing) console.warn(`[nk-wiki] spine 场景层资源缺失，已跳过: ${atlas}`);
          if (items.length === 0) throw new Error('全部场景层资源缺失');
          applyAtlasQualityFixes(manager, layers, gl);
          teardownCanvas = () => {
            cancelAnimationFrame(rafId);
            try {
              renderer.dispose();
              // 显式 loseContext 立即释放上下文配额（回收依赖 GC 有延迟）
              gl.getExtension('WEBGL_lose_context')?.loseContext();
            } catch { /* 已释放或运行时异常均静默 */ }
          };
          let last = performance.now();
          const frame = (now: number): void => {
            if (cancelled) return;
            const delta = Math.min((now - last) / 1000, 0.1);
            last = now;
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
            rafId = requestAnimationFrame(frame);
          };
          rafId = requestAnimationFrame(frame);
          if (container.isConnected) onReady();
        } catch (e) {
          console.warn('[nk-wiki] spine 场景构建失败:', e);
        }
      })
      .catch((e: unknown) => {
        console.warn('[nk-wiki] spine 场景资源加载失败:', e);
      });
  };

  void (async () => {
    try {
      const entry = await resolveSpine(sceneKey);
      if (!entry || entry.kind !== 'official-scene') return;
      const ok = await loadSpineRuntime();
      if (!ok || !container.isConnected) return;
      const lib = getSpineLib();
      if (!lib) return;
      // 窄屏降级：仅主背景层（全量层 WebGL 开销过高）；跨断点变化时重建场景
      const mql = window.matchMedia('(min-width: 768px)');
      mq = mql;
            const pickLayers = (): SpineResolvedSceneLayer[] =>
        mql.matches ? entry.layers : entry.layers.slice(0, 1);
      rebuild = (): void => {
        if (cancelled) return;
        teardownScene();
        void buildScene(pickLayers(), entry.viewport, lib);
      };
      mq.addEventListener('change', rebuild);
      rebuild();
    } catch (e) {
      console.warn('[nk-wiki] spine 场景渲染失败:', e);
    }
  })();
  return () => {
    cancelled = true;
    if (mq && rebuild) mq.removeEventListener('change', rebuild);
    mq = null;
    rebuild = null;
    teardownScene();
  };
}

/** 选择并播放动画：优先 idle 系，否则首个（场景层动画名均为 animation） */
function playFirstAnimation(p: SpinePlayerInstance): void {
  try {
    const anims = (p.skeleton && p.skeleton.data && p.skeleton.data.animations) || [];
    const chosen =
      anims.find((a) => a.name === 'idle') ||
      anims.find((a) => /idle|standby|stand/i.test(a.name)) ||
      anims[0];
    if (chosen) {
      p.setAnimation(chosen.name);
      p.play();
    }
  } catch (e) {
    console.warn('[nk-wiki] spine 动画选择失败:', e);
  }
}

/* ─── 自主 Spine 渲染：manifest 解析 → 运行时加载 → SpinePlayer 实例化 ─── */

function renderSpineSelf(
  container: HTMLElement,
  charId: string,
  onDone: (ok: boolean) => void,
  opts?: { fit?: 'contain' | 'cover' },
): void {
  if (!charId) {
    onDone(false);
    return;
  }
  void (async () => {
    try {
      disposeSpineViewer(); // 先释放上一实例（角色/路由切换），避免 WebGL 上下文与 rAF 循环泄漏
      // 官方源优先（resolveSpine 官方缺失时自动回退 nanoka）；场景条目走 initSpineSceneViewer
      const entry = await resolveSpine(charId);
      if (!entry || entry.kind === 'official-scene') return onDone(false);
      const ok = await renderPlayer(container, entry, opts);
      if (!ok && entry.kind === 'official') {
        // 官方源失效（404/解析失败）→ 回退 nanoka 源（强制指定源避免再次命中官方）
        console.warn('[nk-wiki] 官方源渲染失败，回退 nanoka 源');
        const fallback = await resolveSpine(charId, 'nanoka');
        if (fallback && fallback.kind === 'skel') {
          disposeSpineViewer(); // 释放失败实例的 WebGL 上下文后再重建
          return onDone(await renderPlayer(container, fallback, opts));
        }
      }
      onDone(ok);
    } catch (e) {
      console.warn('[nk-wiki] spine 自主渲染失败:', e);
      onDone(false);
    }
  })();
}

/** 单实例渲染（成功/失败 Promise 化）：失败由调用方决定是否回退 nanoka 源 */
function renderPlayer(
  container: HTMLElement,
  entry: SpineResolved,
  opts?: { fit?: 'contain' | 'cover' },
): Promise<boolean> {
  return new Promise((resolve) => {
    const Ctor = getSpineCtor();
    if (!Ctor) return resolve(false);
    try {
      // 场景条目不会走到本函数（renderSpineSelf 已拦截）；skel=nanoka 源，official=官网源
      const urls = entry.kind === 'skel'
        ? { skelUrl: `${entry.base}.skel`, atlasUrl: `${entry.base}.atlas` }
        : entry.kind === 'official'
          ? buildOfficialConfig(entry)
          : null;
      if (!urls) return resolve(false);
      const player = new Ctor(container, {
        ...urls,
        alpha: true, // WebGL 上下文开启 alpha 通道
        backgroundColor: '00000000', // 全透明背景，透出 Hero 视差立绘
        ...(opts?.fit ? { fit: opts.fit } : {}),
        premultipliedAlpha: false,
        showControls: false, // 隐藏播放器控件条
        showLoading: false, // 隐藏内置加载屏（由页面骨架屏接管）
        success(p) {
          applyQualityFixes(p);
          // spine-player 默认不播放任何动画（setEmptyAnimation），需手动选择并播放
          playFirstAnimation(p);
          resolve(true);
        },
        error(_p, msg) {
          console.warn('[nk-wiki] spine-player 渲染失败:', msg);
          resolve(false);
        },
      });
      _players.push(player);
    } catch (e) {
      console.warn('[nk-wiki] spine 渲染创建失败:', e);
      resolve(false);
    }
  });
}

/**
 * 官网源配置：atlas 原样加载（page 名为逻辑纹理名，无 ':' 可被解析器正常识别），
 * 通过 rawDataURIs 把「atlas 目录 + 逻辑纹理名」映射到实际 hash URL（ADR 0009）。
 * 注意：官网 atlas 的 page 名若替换为含 ':' 的绝对 URL 会被 Spine 解析器当属性行吞掉。
 */
function buildOfficialConfig(
  entry: Extract<SpineResolved, { kind: 'official' }>,
): { jsonUrl: string; atlasUrl: string; rawDataURIs: Record<string, string> } {
  const atlasDir = entry.atlas.slice(0, entry.atlas.lastIndexOf('/') + 1);
  const rawDataURIs: Record<string, string> = {};
  for (const [logicalName, realUrl] of Object.entries(entry.textures)) {
    rawDataURIs[atlasDir + logicalName] = realUrl;
  }
  return { jsonUrl: entry.json, atlasUrl: entry.atlas, rawDataURIs };
}
/** 抗锯齿修复：atlas 低 scale 降采样打包，spine-player 默认 mipmaps 会强制 magFilter Nearest，覆盖回 Linear */
function applyQualityFixes(p: SpinePlayerInstance): void {
  try {
    const atlasUrl = (p.config && p.config.atlasUrl) || '';
    const atlas = p.assetManager && atlasUrl ? p.assetManager.require(atlasUrl) : null;
    const gl = p.context && p.context.gl;
    if (atlas && atlas.pages && gl) {
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

/** 动态加载 spine-player 运行时（单例 + 多 CDN 依次兜底） */
function loadSpineRuntime(): Promise<boolean> {
  if (_runtimePromise) return _runtimePromise;
  _runtimePromise = (async () => {
    if (getSpineCtor()) return true;
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
  })();
  return _runtimePromise;
}
