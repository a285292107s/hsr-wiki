/**
 * Spine 骨骼动画查看器（迁移自 要迁移的代码/spine.js）
 * 双通道策略：
 * ① 快路径——复用原站已初始化的 WebGL canvas（原站可用时零额外开销、与原站渲染完全一致）
 * ② 回退——原站不可用（如角色页 SSR 500）时，动态加载 spine-player 运行时，
 *    直接从 CDN 拉取 .skel/.atlas 自主渲染（数据驱动，不依赖原站 DOM）
 * 资源路径：static.nanoka.cc/assets/hsr/spine/{charId}/{name}.skel|.atlas
 * 版本约束：CDN .skel 为 Spine 4.1.23，运行时须严格匹配 4.1.x
 */
import { resolveSpineName, spineBaseUrl } from '../../services/api';

// spine-player 4.1.23 运行时（多 CDN 兜底，jsdelivr 优先以兼顾国内可达性）
const SPINE_RUNTIME_CDNS = [
  'https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@4.1.23/dist/iife/spine-player.js',
  'https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@4.1.23/dist/iife/spine-player.js',
  'https://unpkg.com/@esotericsoftware/spine-player@4.1.23/dist/iife/spine-player.js',
];
/** 快路径等待窗口：超时未拿到原站 canvas 则启动自主渲染 */
const SPINE_CANVAS_GRACE = 2000;
// 原站可能创建的 spine canvas（viewer 容器 / hero 媒体兜底），仅用于存在性探测
const SITE_SPINE_CANVAS = '[data-ui="character-model-viewer"] canvas, .ui-character-hero__media canvas';

/* ─── spine-player 松散类型（IIFE 运行时注入全局 spine） ─── */

interface SpineAtlasPage {
  texture?: { bind(): void } | null;
}
interface SpinePlayerInstance {
  dispose(): void;
  setAnimation(name: string): void;
  play(): void;
  assetManager?: { require(url: string): { pages?: SpineAtlasPage[] } | null } | null;
  context?: { gl?: WebGLRenderingContext | null } | null;
  skeleton?: { data?: { animations?: { name: string }[] } | null } | null;
  config?: { atlasUrl?: string } | null;
}
interface SpinePlayerConfig {
  skelUrl: string;
  atlasUrl: string;
  alpha?: boolean;
  backgroundColor?: string;
  /** nanoka atlas 无 pma 字段 = 直通 alpha 纹理，必须 false（true 会预乘混合导致边缘亮边伪影） */
  premultipliedAlpha?: boolean;
  showControls?: boolean;
  showLoading?: boolean;
  success?: (p: SpinePlayerInstance) => void;
  error?: (p: SpinePlayerInstance, msg: string) => void;
}
type SpinePlayerCtor = new (container: HTMLElement, config: SpinePlayerConfig) => SpinePlayerInstance;

let _runtimePromise: Promise<boolean> | null = null; // 运行时加载单例（避免重复下载 ~500KB）
let _player: SpinePlayerInstance | null = null; // 当前自主渲染实例（路由/角色切换时需释放）

function getSpineCtor(): SpinePlayerCtor | null {
  const g = globalThis as { spine?: { SpinePlayer?: SpinePlayerCtor } };
  return (g.spine && g.spine.SpinePlayer) || null;
}

/** 释放当前 SpinePlayer：停止 rAF 循环 + 移除播放器 DOM + 释放 WebGL 资源，避免泄漏 */
export function disposeSpineViewer(): void {
  if (_player) {
    try {
      _player.dispose();
    } catch {
      /* 已释放或运行时异常均静默 */
    }
    _player = null;
  }
}

/** 检测 canvas 是否已有实际渲染内容（采样中心像素） */
function isCanvasPainted(cvs: HTMLCanvasElement): boolean {
  try {
    const ctx = cvs.getContext('webgl2') || cvs.getContext('webgl');
    if (!ctx) return cvs.width > 0;
    const px = new Uint8Array(4);
    ctx.readPixels(cvs.width >> 1, cvs.height >> 1, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, px);
    return px[3] > 0;
  } catch {
    return cvs.width > 0;
  }
}

/** 查找可复用的原站 canvas：ready 状态的 viewer，或已绘制内容的 hero media canvas */
function findSiteCanvas(): HTMLCanvasElement | null {
  const viewer = document.querySelector<HTMLCanvasElement>(
    '[data-ui="character-model-viewer"][data-status="ready"] canvas',
  );
  if (viewer) return viewer;
  const fallback = document.querySelector<HTMLCanvasElement>('.ui-character-hero__media canvas');
  return fallback && fallback.width > 0 && isCanvasPainted(fallback) ? fallback : null;
}

/**
 * 初始化 Spine 查看器（双通道竞速，任一成功即定局）。
 * @param container 播放器挂载容器（.nk-hero__spine）
 * @param charId 角色 ID
 * @param onReady 动画就绪回调（视图层据此点亮切换按钮 / 压暗背景）
 * @returns 清理函数（组件卸载 / 角色切换时调用）
 */
export function initSpineViewer(
  container: HTMLElement,
  charId: string,
  onReady: () => void,
): () => void {
  const TIMEOUT = 20000; // 总超时
  const startTime = Date.now();
  let observer: MutationObserver | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;
  let settled = false; // 任一通道已成功展示动画（防止双通道竞态重复渲染）
  let selfRenderStarted = false;
  let disposed = false;

  function cleanup(): void {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
    if (safetyTimer) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  }

  /* ── 通道①：复用原站 canvas ── */
  function tryGrab(): void {
    if (settled || disposed) return;
    if (!container.isConnected || Date.now() - startTime > TIMEOUT) {
      cleanup();
      return;
    }
    const canvas = findSiteCanvas();
    if (!canvas) return;
    settled = true;
    cleanup();
    container.appendChild(canvas);
    if (!disposed) onReady();
  }

  /* ── 通道②：自主渲染（spine-player） ── */
  function startSelfRender(): void {
    if (settled || selfRenderStarted || disposed) return;
    selfRenderStarted = true;
    renderSpineSelf(container, charId, (ok) => {
      if (ok && !settled && !disposed && container.isConnected) {
        settled = true;
        cleanup();
        onReady();
      }
    });
  }

  // 快路径接线：原站 canvas 已存在 → 轮询等其就绪；尚未出现 → 监听插入后转轮询
  if (document.querySelector(SITE_SPINE_CANVAS)) {
    tryGrab();
    if (!settled && !disposed) pollTimer = setInterval(tryGrab, 100);
  } else {
    observer = new MutationObserver(() => {
      if (!document.querySelector(SITE_SPINE_CANVAS)) return;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      tryGrab();
      if (!settled && !disposed && !pollTimer) pollTimer = setInterval(tryGrab, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 宽限期后仍未拿到原站 canvas → 启动自主渲染（原站大概率不可用）
  graceTimer = setTimeout(() => {
    if (!settled) startSelfRender();
  }, SPINE_CANVAS_GRACE);

  // 安全网：总超时后清理监听资源
  safetyTimer = setTimeout(cleanup, TIMEOUT + 500);

  return () => {
    disposed = true;
    cleanup();
    disposeSpineViewer();
  };
}

/* ─── 自主 Spine 渲染：manifest 解析 → 运行时加载 → SpinePlayer 实例化 ─── */

function renderSpineSelf(
  container: HTMLElement,
  charId: string,
  onDone: (ok: boolean) => void,
): void {
  if (!charId) {
    onDone(false);
    return;
  }
  void (async () => {
    try {
      const name = await resolveSpineName(charId);
      if (!name) return onDone(false);
      const ok = await loadSpineRuntime();
      if (!ok || !container.isConnected) return onDone(false);
      const Ctor = getSpineCtor();
      if (!Ctor) return onDone(false);
      const base = spineBaseUrl(charId, name);
      disposeSpineViewer(); // 先释放上一实例（角色/路由切换），避免 WebGL 上下文与 rAF 循环泄漏
      const player = new Ctor(container, {
        skelUrl: `${base}.skel`,
        atlasUrl: `${base}.atlas`,
        alpha: true, // WebGL 上下文开启 alpha 通道
        backgroundColor: '00000000', // 全透明背景，透出 Hero 视差立绘
        premultipliedAlpha: false,
        showControls: false, // 隐藏播放器控件条
        showLoading: false, // 隐藏内置加载屏（由页面骨架屏接管）
        success(p) {
          // ── 抗锯齿修复 ──
          // nanoka atlas 以低 scale 降采样打包（filter: Linear,Linear），且缩放比逐角色不同
          // （如卡芙卡 scale:0.19 ≈ 放大 5.3 倍，部分角色 0.32 ≈ 3 倍），全屏显示需显著放大。
          // spine-player 默认 mipmaps:true，loadSkeleton() 会强制把 magFilter 覆盖为 Nearest，
          // 放大时产生块状像素锯齿。此处保留 mipmaps（缩小侧三线性+各向异性过滤），
          // 仅将放大过滤覆盖回 Linear，恢复 atlas 声明的平滑采样。
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
          // spine-player 默认不播放任何动画（setEmptyAnimation），需手动选择并播放
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
          onDone(true);
        },
        error(_p, msg) {
          console.warn('[nk-wiki] spine-player 渲染失败:', msg);
          onDone(false);
        },
      });
      _player = player;
    } catch (e) {
      console.warn('[nk-wiki] spine 自主渲染失败:', e);
      onDone(false);
    }
  })();
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
