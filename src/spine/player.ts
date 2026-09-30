
import type { SpinePlayerConfig, SpinePlayerCtor, SpinePlayerInstance, SpineRuntimeVersion } from './types';
import { registerSpineEntry } from './registry';
import { getSpineCtor } from './runtime';

export function pickAnimName(names: string[]): string {
  return names.find((n) => n === 'idle') || names.find((n) => /idle|standby|stand/i.test(n)) || names[0] || '';
}

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

export function disposePlayer(p: SpinePlayerInstance): void {
  try {
    const gl = p.context && p.context.gl;
    if (gl && typeof gl.getExtension === 'function') gl.getExtension('WEBGL_lose_context')?.loseContext();
    p.dispose();
  } catch {
    /* 已释放或运行时异常均静默 */
  }
}

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

          playFirstAnimation(p);
          registerSpineEntry(key, { dispose: () => disposePlayer(p), gl: p.context?.gl ?? null });
          settle(p);
        },
        error(_p, msg) {
          console.warn('[nk-wiki] spine-player 渲染失败:', msg);
          if (created) disposePlayer(created);
          settle(null);
        },
      });
      created = player;

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

export interface PlayerOutcome {
  ok: boolean;
  err: string;
  player: SpinePlayerInstance | null;
  created: SpinePlayerInstance | null;
}

const SETTLE_TIMEOUT_MS = 30_000;

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
