/**
 * 单例 Promise 工厂：静态 JSON 只请求一次，失败自动重置允许重试。
 * 共享列表（characters / light_cones / relics 等）必须沿用此模式。
 */
import { fetchJSON } from '../cache';

/**
 * 创建模块级单例加载器：首次调用发起请求，后续调用复用同一 Promise；
 * 失败时将槽位置空，允许下次调用重试。
 */
export function singletonLoad<T>(url: string): () => Promise<T> {
  let p: Promise<T> | null = null;
  return () => {
    if (!p) {
      p = fetchJSON<T>(url).catch((e) => { p = null; throw e; });
    }
    return p;
  };
}
