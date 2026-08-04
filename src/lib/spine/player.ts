/**
 * SpinePlayer 单实例封装
 *
 * 创建工厂（默认参数基线 + 质量修复 + 动画播放 + registry 注册）、释放辅助与动画挑选。
 * 生产角色页走 createSpinePlayer；审核台因需 draw 采样回调直接 new Ctor（spine-audit.ts），
 * 双方保持同一渲染参数基线（premultipliedAlpha=false / 透明底 / 无控件与加载屏）。
 */
import type { SpinePlayerConfig, SpinePlayerInstance } from './types';
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
 * - 失败（error 回调 / 构造异常）：自动释放已创建实例并返回 null
 * @param key 注册表 key（如 `player:1001`），同 key 覆盖先释放旧实例
 */
export function createSpinePlayer(
  container: HTMLElement,
  key: string,
  cfg: SpinePlayerConfig,
): Promise<SpinePlayerInstance | null> {
  return new Promise((resolve) => {
    const Ctor = getSpineCtor();
    if (!Ctor) return resolve(null);
    try {
      let created: SpinePlayerInstance | null = null;
      const player = new Ctor(container, {
        ...cfg,
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
          resolve(p);
        },
        error(_p, msg) {
          console.warn('[nk-wiki] spine-player 渲染失败:', msg);
          if (created) disposePlayer(created); // 失败实例仍可能持有 WebGL 上下文，主动释放
          resolve(null);
        },
      });
      created = player;
    } catch (e) {
      console.warn('[nk-wiki] spine 渲染创建失败:', e);
      resolve(null);
    }
  });
}
