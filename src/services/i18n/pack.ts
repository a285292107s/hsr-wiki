import { fetchJSON } from '../cache';
import { LOCAL_PACK_BASE } from '../api/base';
import { activeLocale } from '../../lib/i18n/active';
import type { TextPack } from '../../lib/i18n/text-ref';

const slots = new Map<string, Promise<TextPack>>();

export function loadTextPack(group: string, locale: string = activeLocale()): Promise<TextPack> {
  const key = `${locale}/${group}`;
  const hit = slots.get(key);
  if (hit) return hit;
  const p = fetchJSON<TextPack>(`${LOCAL_PACK_BASE}/${locale}/${group}.json`).catch((e: unknown) => {
    slots.delete(key);
    throw e;
  });
  slots.set(key, p);
  return p;
}

export function resetTextPacks(): void {
  slots.clear();
}
