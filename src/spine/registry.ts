
export interface SpineRegistryEntry {

  dispose(): void;

  gl?: WebGLRenderingContext | null;
}

export const GL_WARN_AT = 12;

const entries = new Map<string, SpineRegistryEntry>();

export function glContextCount(): number {
  let n = 0;
  for (const e of entries.values()) if (e.gl) n++;
  return n;
}

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

export function disposeAllSpineEntries(): void {
  for (const key of [...entries.keys()]) disposeSpineEntry(key);
}
