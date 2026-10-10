/* 单例 Promise 工厂：静态 JSON 只请求一次，**失败自动重置允许重试**。
   共享列表（characters / light_cones / relics 等）必须沿用此模式（本地数据经
   `local.ts → singletonLocalData` 绑定当前语言后使用本工厂）。
 */
/**
 * 创建模块级单例加载器：首次调用发起请求，后续调用复用同一 Promise；失败时将槽位置空，允许下次调用重试。
 * 传入 `generation` 时，其返回值变化即视为「换了语境」（如语言），下一次调用重建槽位。
 */
export function singletonOf<T>(load: () => Promise<T>, generation?: () => string): () => Promise<T> {
  let p: Promise<T> | null = null;
  let gen: string | undefined;
  return () => {
    const now = generation ? generation() : undefined;
    if (!p || now !== gen) {
      gen = now;
      p = load().catch((e) => { p = null; throw e; });
    }
    return p;
  };
}
