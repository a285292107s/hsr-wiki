/**
 * Spine 骨骼动画查看器
 * 仅自主渲染（ADR 0002/0009）：动态加载 spine-player 运行时，按 Spine 清单分发渲染。
 * - skel 源：nanoka CDN .skel/.atlas（Spine 4.1.23）
 * - official 源：官网 CDN .json 骨架 + atlas 纹理重映射（Spine 4.2.43）
 * 资源路径：skel 为 static.nanoka.cc/assets/hsr/spine/{charId}/{name}.skel|.atlas
 * 运行时约束：spine-player 4.2.x 向后兼容 4.1 数据、向前不兼容（升级需回归验证）
 */
import { resolveSpine } from '../../services/api';
import type { SpineResolved } from '../../services/types';

// spine-player 4.2.43 运行时（多 CDN 兜底，jsdelivr 优先以兼顾国内可达性）
const SPINE_RUNTIME_CDNS = [
  'https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@4.2.43/dist/iife/spine-player.js',
  'https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@4.2.43/dist/iife/spine-player.js',
  'https://unpkg.com/@esotericsoftware/spine-player@4.2.43/dist/iife/spine-player.js',
];

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
  /** nanoka 源：二进制骨架（skel 与 official 二选一） */
  skelUrl?: string;
  /** 官网源：JSON 骨架（skel 与 official 二选一） */
  jsonUrl?: string;
  atlasUrl: string;
  /** 官网源：纹理路径（atlas 目录 + 逻辑名）→ 实际 hash URL 映射（ADR 0009） */
  rawDataURIs?: Record<string, string>;
  alpha?: boolean;
  backgroundColor?: string;
  /** nanoka/官网 atlas 均无 pma 字段 = 直通 alpha 纹理，必须 false（true 会预乘混合导致边缘亮边伪影） */
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

/**
 * 初始化 Spine 查看器（纯自主渲染）。
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
  renderSpineSelf(container, charId, (ok) => {
    if (ok && container.isConnected) onReady();
  });
  return () => {
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
      const entry = await resolveSpine(charId);
      if (!entry) return onDone(false);
      const ok = await loadSpineRuntime();
      if (!ok || !container.isConnected) return onDone(false);
      const Ctor = getSpineCtor();
      if (!Ctor) return onDone(false);
      disposeSpineViewer(); // 先释放上一实例（角色/路由切换），避免 WebGL 上下文与 rAF 循环泄漏
      const player = new Ctor(container, {
        ...(entry.kind === 'skel'
          ? { skelUrl: `${entry.base}.skel`, atlasUrl: `${entry.base}.atlas` }
          : buildOfficialConfig(entry)),
        alpha: true, // WebGL 上下文开启 alpha 通道
        backgroundColor: '00000000', // 全透明背景，透出 Hero 视差立绘
        premultipliedAlpha: false,
        showControls: false, // 隐藏播放器控件条
        showLoading: false, // 隐藏内置加载屏（由页面骨架屏接管）
        success(p) {
          applyQualityFixes(p);
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
