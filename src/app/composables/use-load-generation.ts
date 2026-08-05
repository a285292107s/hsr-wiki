/**
 * 加载代（load generation）竞态保护：
 * 快速连续导航/切换时，旧请求可能晚于新请求返回；
 * 仅当加载代仍为最新时才允许写入状态，避免过期数据覆盖新数据。
 * 统一 character store / CatalogPage 等处重复的 loadGen 模式。
 */

export interface LoadGeneration {
  /** 开启一次新加载，返回本次加载的代号 */
  begin(): number;
  /** 判断给定代号是否仍为最新（过期加载的结果应静默丢弃） */
  isCurrent(gen: number): boolean;
}

export function useLoadGeneration(): LoadGeneration {
  let gen = 0;
  return {
    begin: () => ++gen,
    isCurrent: (g) => g === gen,
  };
}
