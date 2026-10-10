/* 本地数据取数（结构层 + 语言包 → 解析后的对象）。
 *
 * 结构层 JSON 里来自 TextMap 的文本是引用令牌 `"$t:<键>"`（[ADR 0052]），本模块是**唯一**
 * 把令牌换成正文的地方：取数与解析同批完成，故缓存里存的是解析后的值，缓存键必须带语言维度。
 * 调用方拿到的形状与令牌化之前完全一致（字段仍是 `string`），store / 视图无需感知语言包。
 */
import { cachedLoad, fetchJSON } from '../cache';
import { LOCAL_DATA_BASE } from './base';
import { activeLocale } from '../../lib/i18n/active';
import { packGroupOf } from '../../lib/i18n/pack-path';
import { hasTextToken, resolveTextTokens } from '../../lib/i18n/text-ref';
import { loadTextPack } from '../i18n/pack';
import { singletonOf } from './singleton';

/** 本地数据相对路径（相对 `data/cn/`）→ 完整 URL。 */
export function localDataUrl(relPath: string): string {
  return `${LOCAL_DATA_BASE}/${relPath}`;
}

/**
 * 取本地 JSON 并解析文本令牌；结果进请求缓存（L1 + in-flight 去重），
 * 缓存键 = `cacheKey@<语言>`（同一份文件换语言后必须重新解析）。
 *
 * **先探测令牌再取包**：语言无关的数据（数值曲线 / 清单表）与尚未令牌化的结构层都零额外请求。
 */
export function loadLocalJSON<T>(relPath: string, cacheKey: string): Promise<T> {
  const locale = activeLocale();
  return cachedLoad<T>(localDataUrl(relPath), `${cacheKey}@${locale}`, async (url) => {
    const raw = await fetchJSON<T>(url);
    if (!hasTextToken(raw)) return raw;
    const pack = await loadTextPack(packGroupOf(relPath), locale);
    return resolveTextTokens(raw, pack);
  });
}

/** 共享列表（索引级数据）单例加载器：只请求一次，失败自动重置允许重试，**切换语言即重建**。 */
export function singletonLocalData<T>(relPath: string): () => Promise<T> {
  return singletonOf<T>(() => loadLocalJSON<T>(relPath, `local_${relPath}`), activeLocale);
}
