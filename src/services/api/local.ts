import { cachedLoad, fetchJSON } from '../cache';
import { LOCAL_DATA_BASE } from './base';
import { activeLocale } from '../../lib/i18n/active';
import { packGroupOf } from '../../lib/i18n/pack-path';
import { hasTextToken, resolveTextTokens } from '../../lib/i18n/text-ref';
import { loadTextPack } from '../i18n/pack';
import { singletonOf } from './singleton';

export function localDataUrl(relPath: string): string {
  return `${LOCAL_DATA_BASE}/${relPath}`;
}

export function loadLocalJSON<T>(relPath: string, cacheKey: string): Promise<T> {
  const locale = activeLocale();
  return cachedLoad<T>(localDataUrl(relPath), `${cacheKey}@${locale}`, async (url) => {
    const raw = await fetchJSON<T>(url);
    if (!hasTextToken(raw)) return raw;
    const pack = await loadTextPack(packGroupOf(relPath), locale);
    return resolveTextTokens(raw, pack);
  });
}

export function singletonLocalData<T>(relPath: string): () => Promise<T> {
  return singletonOf<T>(() => loadLocalJSON<T>(relPath, `local_${relPath}`), activeLocale);
}
