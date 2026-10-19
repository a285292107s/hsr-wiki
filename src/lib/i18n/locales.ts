
export interface Locale {
  readonly code: string;
  readonly culture: string;
  readonly native: string;
  readonly prefix: string;
  readonly isDefault: boolean;
}

export const DEFAULT_LOCALE = 'cn';

export const LOCALES: readonly Locale[] = [
  { code: 'cn', culture: 'zh-CN', native: '简体中文', prefix: '', isDefault: true },
  { code: 'cht', culture: 'zh-TW', native: '繁體中文', prefix: 'cht', isDefault: false },
  { code: 'en', culture: 'en-US', native: 'English', prefix: 'en', isDefault: false },
  { code: 'kr', culture: 'ko-KR', native: '한국어', prefix: 'kr', isDefault: false },
  { code: 'jp', culture: 'ja-JP', native: '日本語', prefix: 'jp', isDefault: false },
  { code: 'es', culture: 'es-MX', native: 'Español', prefix: 'es', isDefault: false },
  { code: 'ru', culture: 'ru-RU', native: 'Русский', prefix: 'ru', isDefault: false },
  { code: 'th', culture: 'th-TH', native: 'ไทย', prefix: 'th', isDefault: false },
  { code: 'vi', culture: 'vi-VN', native: 'Tiếng Việt', prefix: 'vi', isDefault: false },
  { code: 'id', culture: 'id-ID', native: 'Bahasa Indonesia', prefix: 'id', isDefault: false },
  { code: 'fr', culture: 'fr-FR', native: 'Français', prefix: 'fr', isDefault: false },
  { code: 'de', culture: 'de-DE', native: 'Deutsch', prefix: 'de', isDefault: false },
  { code: 'pt', culture: 'pt-BR', native: 'Português', prefix: 'pt', isDefault: false },
];

const BY_CODE: ReadonlyMap<string, Locale> = new Map(LOCALES.map((l) => [l.code, l]));

export const BIG_NUMBER_UNITS: Readonly<Record<string, readonly [string, string]>> = {
  cn: ['亿', '万'],
  cht: ['億', '萬'],
  jp: ['億', '万'],
  kr: ['억', '만'],
};

export const DEFAULT_LOCALE_ENTRY: Locale = BY_CODE.get(DEFAULT_LOCALE) as Locale;

export function localeCodes(): readonly string[] {
  return LOCALES.map((l) => l.code);
}

export function findLocale(code: string): Locale | undefined {
  return BY_CODE.get(code);
}

export function normalizeLocaleCode(code: string | null | undefined): string {
  return code && BY_CODE.has(code) ? code : DEFAULT_LOCALE;
}

export function localePrefix(code: string): string {
  return BY_CODE.get(code)?.prefix ?? '';
}

export function localizedPath(code: string, path: string): string {
  const stripped = stripLocalePrefix(path);
  const prefix = localePrefix(code);
  if (!prefix) return stripped;
  return stripped === '/' ? `/${prefix}` : `/${prefix}${stripped}`;
}

export function localeFromPath(pathname: string): Locale {
  const head = pathname.replace(/^\/+/, '').split('/')[0] ?? '';
  return LOCALES.find((l) => l.prefix && l.prefix === head) ?? DEFAULT_LOCALE_ENTRY;
}

export function localeBaseFromPath(pathname: string): string {
  const locale = localeFromPath(pathname);
  return locale.prefix ? `/${locale.prefix}/` : '/';
}

export function stripLocalePrefix(path: string): string {
  const cut = path.search(/[?#]/);
  const [pathname, suffix] = cut === -1 ? [path, ''] : [path.slice(0, cut), path.slice(cut)];
  const [head, ...rest] = pathname.replace(/^\//, '').split('/');
  if (head) {
    for (const l of LOCALES) {
      if (l.prefix && l.prefix === head) {
        return (rest.length ? `/${rest.join('/')}` : '/') + suffix;
      }
    }
  }
  return (pathname || '/') + suffix;
}
