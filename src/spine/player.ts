/**
 * SpinePlayer 单实例封装
 *
 * 创建工厂（默认参数基线 + 质量修复 + 动画播放 + registry 注册）、可等待结算工厂
 * （审核台 L2 渲染队列共用：success/error/超时一次性结算 + 失败路径实例回收）、释放辅助与动画挑选。
 * 验收台合并渲染不走 player（走 scene 管线）；单层诊断 / 审核详情预览因需同步实例句柄与
 * 自定义上下文参数直接实例化。全部创建路径保持同一渲染参数基线（无预乘 / 透明底 / 无控件与加载屏）。
 */
import type { SpinePlayerConfig, SpinePlayerCtor, SpinePlayerInstance, SpineRuntimeVersion } from './types';
import { registerSpineEntry } from './registry';
import { getSpineCtor } from './runtime';

/** 动画挑选：优先精确 idle，其次 idle/standby 系，否则首个 */
export function pickAnimName(names: string[]): string {
  return names.find((n) => n === 'idle') || names.find((n) => /idle|standby|stand/i.test(n)) || names[0] || '';
}

/** 选择并播放动画：优先 idle 系，否则首个（场景层动画名均为 animation） */
export function playFirstAnimation(p: SpinePlayerInstance): void {
  try {
    const anims = (p.skeleton && p.skeleton.data && p.skeleton.data.animations) || [];
    const chosen = pickAnimName(anims.map((a) => a.name));
    if (chosen) {
      p.setAnimation(chosen);
      p.play();
    }
  } catch (e) {
    console.warn('[nk-wiki] spine 动画选择失败:', e);
  }
}

/** 释放 SpinePlayer：主动丢弃 WebGL 上下文（dispose 只释放 GL 资源，显式 loseContext 立即回收配额） */
export function disposePlayer(p: SpinePlayerInstance): void {
  try {
    const gl = p.context && p.context.gl;
    if (gl && typeof gl.getExtension === 'function') gl.getExtension('WEBGL_lose_context')?.loseContext();
    p.dispose();
  } catch {
    /* 已释放或运行时异常均静默 */
  }
}

/** 抗锯齿修复：atlas 低 scale 降采样打包，spine-player 默认 mipmaps 会强制 magFilter Nearest，覆盖回 Linear */
export function applyQualityFixes(p: SpinePlayerInstance): void {
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

/**
 * 创建并注册 spine-player（生产角色页渲染入口）：
 * - 默认渲染参数基线：透明底（alpha + 00000000）/ 无预乘 / 隐藏控件与加载屏
 * - 成功：应用质量修复 + 播放首选动画 + 注册到 registry（key 粒度释放）
 * - 失败（error 回调 / 构造异常 / 整体超时）：自动释放已创建实例并返回 null
 *   整体超时兜底：CDN 连接黑洞时 success/error 回调可能永不触发，20s 后按失败结算
 * @param key 注册表 key（如 `player:1001`），同 key 覆盖先释放旧实例
 * @param runtimeVersion 运行时版本分派（services/api/spine.ts spineRuntimeFor 收口）：
 *   skel（nanoka 4.1 二进制）与 4.0 格式导出的 official JSON → '4.1'；其余 → '4.2'
 *   调用方须先 loadSpineRuntime(runtimeVersion) 就绪（4.1 无 fit 支持，内部自动剥离）
 */
const PLAYER_SETTLE_TIMEOUT_MS = 20_000;

export function createSpinePlayer(
  container: HTMLElement,
  key: string,
  cfg: SpinePlayerConfig,
  runtimeVersion: SpineRuntimeVersion = '4.2',
): Promise<SpinePlayerInstance | null> {
  return new Promise((resolve) => {
    const Ctor = getSpineCtor(runtimeVersion);
    if (!Ctor) return resolve(null);
    try {
      let created: SpinePlayerInstance | null = null;
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const settle = (p: SpinePlayerInstance | null): void => {
        if (settled) return;
        settled = true;
        if (timer !== null) clearTimeout(timer);
        resolve(p);
      };
      // 4.1 运行时无 fit 概念：显式剥离（其余字段两版本均支持）
      const finalCfg = { ...cfg };
      if (runtimeVersion === '4.1') delete finalCfg.fit;
      const player = new Ctor(container, {
        ...finalCfg,
        alpha: true, // WebGL 上下文开启 alpha 通道
        backgroundColor: '00000000', // 全透明背景，透出 Hero 视差立绘
        premultipliedAlpha: false,
        showControls: false, // 隐藏播放器控件条
        showLoading: false, // 隐藏内置加载屏（由页面骨架屏接管）
        success(p) {
          applyQualityFixes(p);
          // spine-player 默认不播放任何动画（setEmptyAnimation），需手动选择并播放
          playFirstAnimation(p);
          registerSpineEntry(key, { dispose: () => disposePlayer(p), gl: p.context?.gl ?? null });
          settle(p);
        },
        error(_p, msg) {
          console.warn('[nk-wiki] spine-player 渲染失败:', msg);
          if (created) disposePlayer(created); // 失败实例仍可能持有 WebGL 上下文，主动释放
          settle(null);
        },
      });
      created = player;
      // 整体超时：资源加载挂起（CDN 黑洞）时 success/error 均不触发，按失败结算并释放
      timer = setTimeout(() => {
        console.warn('[nk-wiki] spine-player 渲染超时，已按失败结算');
        if (created) disposePlayer(created);
        settle(null);
      }, PLAYER_SETTLE_TIMEOUT_MS);
    } catch (e) {
      console.warn('[nk-wiki] spine 渲染创建失败:', e);
      resolve(null);
    }
  });
}

/** player 结算结果（created = 已创建实例；失败路径也需释放，避免 WebGL 上下文泄漏） */
export interface PlayerOutcome {
  ok: boolean;
  err: string;
  player: SpinePlayerInstance | null;
  created: SpinePlayerInstance | null;
}

/** 结算超时缺省（加载 + 采样，含网络） */
const SETTLE_TIMEOUT_MS = 30_000;

/**
 * 创建 player 并等待 success/error 一次性结算（审核台 L2 渲染队列共用）：
 * 渲染参数基线（透明底 / 无预乘 / 无控件与加载屏）内置且覆盖调用方 cfg；
 * 整体超时兜底；settled 闸门保证只结算一次；失败路径不自动释放（由调用方按 created 释放，
 * 因失败实例可能仍需在错误分支做现场诊断）。
 */
export function spawnPlayer(
  Ctor: SpinePlayerCtor,
  host: HTMLElement,
  cfg: SpinePlayerConfig,
  hooks?: { onSuccess?: (p: SpinePlayerInstance) => void; onDraw?: (p: SpinePlayerInstance) => void },
  timeoutMs = SETTLE_TIMEOUT_MS,
): Promise<PlayerOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    let created: SpinePlayerInstance | null = null;
    const timer = setTimeout(() => {
      settle({ ok: false, err: `渲染超时（${Math.round(timeoutMs / 1000)}s）`, player: null });
    }, timeoutMs);
    const settle = (r: Omit<PlayerOutcome, 'created'>): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ ...r, created });
    };
    try {
      const player = new Ctor(host, {
        ...cfg,
        alpha: true,
        backgroundColor: '00000000',
        premultipliedAlpha: false,
        showControls: false,
        showLoading: false,
        success(p) {
          hooks?.onSuccess?.(p);
          settle({ ok: true, err: '', player: p });
        },
        error(_p, msg) {
          settle({ ok: false, err: String(msg), player: null });
        },
        draw(p) {
          hooks?.onDraw?.(p);
        },
      });
      created = player;
      if (!player) settle({ ok: false, err: 'player 实例创建失败', player: null });
    } catch (e) {
      settle({ ok: false, err: String(e), player: null });
    }
  });
}
