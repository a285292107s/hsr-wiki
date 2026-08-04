/**
 * Spine 骨骼动画查看器编排层（薄层）
 *
 * 仅自主渲染（ADR 0002/0009）：引擎层实现见 src/lib/spine/
 * （types 契约 / runtime 运行时加载 / config URL 构造 / player 单实例 / scene 场景渲染器 / registry 注册表）。
 * 本文件只保留业务编排：
 * - 清单解析与源回退（resolveSpine 官方优先 → 渲染失败强制回退 nanoka）
 * - 单角色查看器（initSpineViewer）：按 `player:{spineKey}` 精确释放
 * - 多层场景（initSpineSceneViewer）：窄屏降级（仅主背景层）+ 断点变化重建
 * 资源路径：skel 为 static.nanoka.cc/assets/hsr/spine/{charId}/{name}.skel|.atlas
 */
import { resolveSpine } from '../../services/api';
import type { SpineResolved, SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';
import { buildOfficialConfig } from '../../lib/spine/config';
import { createSpinePlayer } from '../../lib/spine/player';
import { disposeSpineEntry } from '../../lib/spine/registry';
import { getSpineLib, loadSpineRuntime } from '../../lib/spine/runtime';
import { mountSpineScene } from '../../lib/spine/scene';
import type { SpineLib, SpineRuntimeVersion } from '../../lib/spine/types';

/** 播放器注册 key 命名空间（registry 按 key 精确释放，与场景互不干扰） */
const PLAYER_KEY = (spineKey: string): string => `player:${spineKey}`;

/**
 * 初始化 Spine 查看器（纯自主渲染）。
 * @param container 播放器挂载容器（.nk-hero__spine）
 * @param spineKey 清单条目键（角色 ID 或场景标识如 home-bg）
 * @param onReady 动画就绪回调（视图层据此点亮切换按钮 / 压暗背景）
 * @param opts 可选渲染参数（fit: cover 用于背景场景铺满）
 * @returns 清理函数（组件卸载 / 角色切换时调用，仅释放本 key 实例）
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
    disposeSpineEntry(PLAYER_KEY(spineKey));
  };
}

/**
 * 初始化多层场景 Spine（official-scene 条目，如枢纽页背景）。
 * 场景渲染细节见 lib/spine/scene.ts（单画布多骨架 + 固定舞台 cover 适配）；
 * 本层负责：清单解析 → 运行时就绪 → 窄屏降级（<768px 仅主背景层）→ 断点变化重建。
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
  let mq: MediaQueryList | null = null;
  let rebuild: (() => void) | null = null;
  let ctrl: { teardown(): void } | null = null;

  /** 释放当前挂载的场景（断点重建 / 组件卸载共用） */
  const teardownScene = (): void => {
    if (ctrl) {
      ctrl.teardown();
      ctrl = null;
    }
  };

  /** 挂载新场景（每次全新构建，无状态残留） */
  const mount = (layers: SpineResolvedSceneLayer[], vp: SpineSceneEntry['viewport'], lib: SpineLib): void => {
    ctrl = mountSpineScene({ container, layers, viewport: vp, lib, onReady });
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
        mount(pickLayers(), entry.viewport, lib);
      };
      mql.addEventListener('change', rebuild);
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

/** 单实例渲染（成功/失败 Promise 化）：失败由调用方决定是否回退 nanoka 源 */
async function renderPlayer(
  container: HTMLElement,
  key: string,
  entry: SpineResolved,
  opts?: { fit?: 'contain' | 'cover' },
): Promise<boolean> {
  // 场景条目不会走到本函数（renderSpineSelf 已拦截）；skel=nanoka 源，official=官网源
  const urls = entry.kind === 'skel'
    ? { skelUrl: `${entry.base}.skel`, atlasUrl: `${entry.base}.atlas` }
    : entry.kind === 'official'
      ? buildOfficialConfig(entry)
      : null;
  if (!urls) return false;
  // 双运行时分派：skel（nanoka 4.1.23 二进制）→ 4.1 备用运行时；official（官网 JSON）→ 4.2 主运行时
  const runtimeVersion: SpineRuntimeVersion = entry.kind === 'skel' ? '4.1' : '4.2';
  const ok = await loadSpineRuntime(runtimeVersion);
  if (!ok) return false;
  const player = await createSpinePlayer(
    container,
    key,
    {
      ...urls,
      ...(opts?.fit ? { fit: opts.fit } : {}),
    },
    runtimeVersion,
  );
  return player !== null;
}

/** 自主 Spine 渲染：manifest 解析 → 运行时加载 → SpinePlayer 实例化 */
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
  const key = PLAYER_KEY(charId);
  void (async () => {
    try {
      disposeSpineEntry(key); // 先释放同 key 上一实例（角色/路由切换），避免 WebGL 上下文与 rAF 循环泄漏
      // 官方源优先（resolveSpine 官方缺失时自动回退 nanoka）；场景条目走 initSpineSceneViewer
      const entry = await resolveSpine(charId);
      if (!entry || entry.kind === 'official-scene') return onDone(false);
      const ok = await renderPlayer(container, key, entry, opts);
      if (!ok && entry.kind === 'official') {
        // 官方源失效（404/解析失败）→ 回退 nanoka 源（强制指定源避免再次命中官方）
        console.warn('[nk-wiki] 官方源渲染失败，回退 nanoka 源');
        const fallback = await resolveSpine(charId, 'nanoka');
        if (fallback && fallback.kind === 'skel') {
          disposeSpineEntry(key); // 释放失败实例的 WebGL 上下文后再重建
          return onDone(await renderPlayer(container, key, fallback, opts));
        }
      }
      onDone(ok);
    } catch (e) {
      console.warn('[nk-wiki] spine 自主渲染失败:', e);
      onDone(false);
    }
  })();
}
