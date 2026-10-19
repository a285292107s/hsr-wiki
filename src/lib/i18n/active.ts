import { DEFAULT_LOCALE, localizedPath, normalizeLocaleCode } from './locales';

let active = DEFAULT_LOCALE;

export function activeLocale(): string {
  return active;
}

export function activeHref(path: string): string {
  return localizedPath(active, path);
}

export function setActiveLocale(code: string): void {
  active = normalizeLocaleCode(code);
}

export function resetActiveLocale(): void {
  active = DEFAULT_LOCALE;
}
