/**
 * Spine 播放器注册表（按 key 精确释放 + WebGL 上下文计数）
 *
 * 旧版为模块级数组 + 全局释放（disposeSpineViewer 一次释放全部实例），释放粒度不可控，
 * 无法支撑多容器并存（keep-alive 页 / 列表缩略预览），且 dispose 未显式丢上下文。
 * 本注册表以 key（如 `player:1001`）精确管理实例：
 * - 同 key 重复注册先释放旧实例（防覆盖泄漏）
 * - 释放统一走 loseContext 立即回收 WebGL 上下文（不依赖 GC 延迟）
 * - 活跃上下文数超阈值预警（浏览器上限约 16）
 */

export interface SpineRegistryEntry {
  /** 释放动作（含显式 loseContext） */
  dispose(): void;
  /** 持有的 WebGL 上下文（计数用） */
  gl?: WebGLRenderingContext | null;
}

/** 浏览器活跃 WebGL 上下文上限约 16，达到此值预警 */
export const GL_WARN_AT = 12;

const entries = new Map<string, SpineRegistryEntry>();

/** 当前注册条目持有的活跃 WebGL 上下文数 */
export function glContextCount(): number {
  let n = 0;
  for (const e of entries.values()) if (e.gl) n++;
  return n;
}

/** 注册（同 key 先释放旧条目，防止覆盖泄漏）；活跃上下文超阈值时预警 */
export function registerSpineEntry(key: string, entry: SpineRegistryEntry): void {
  disposeSpineEntry(key);
  entries.set(key, entry);
  const count = glContextCount();
  if (count >= GL_WARN_AT) {
    console.warn(
      `[nk-wiki] WebGL 上下文活跃数 ${count} ≥ ${GL_WARN_AT}（浏览器上限约 16），请检查 spine 实例释放`,
    );
  }
}

/** 按 key 精确释放（不存在时静默） */
export function disposeSpineEntry(key: string): void {
  const entry = entries.get(key);
  if (!entry) return;
  entries.delete(key);
  try {
    entry.dispose();
  } catch {
    /* 已释放或运行时异常均静默 */
  }
}

/** 释放全部注册实例（路由级全局清理用） */
export function disposeAllSpineEntries(): void {
  for (const key of [...entries.keys()]) disposeSpineEntry(key);
}
