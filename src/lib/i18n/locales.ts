/* 语言清单（前端镜像）。
 *
 * 事实源是 `tools/converter/languages.json`（转换器侧入口为 `languages.py`）；
 * 本文件是 UI 侧镜像，**两侧必须同步修改**，一致性由 `tools/check-languages.mjs` 强制。
 * 这里只放 UI 与路由需要的事实：代码 / culture / 母语名 / URL 前缀；文案进词典，不在此处。
 */

export interface Locale {
  /** 站内语言代码 = 上游 `TextLanguageKey` */
  readonly code: string;
  /** `LanguageCultureCode`，用于 `<html lang>` 与 hreflang */
  readonly culture: string;
  /** 母语自称（语言选择器上屏文本，不翻译） */
  readonly native: string;
  /** URL 前缀段；缺省语言为空串（保持根路径，不做 `/cn/**` 别名） */
  readonly prefix: string;
  /** 是否为缺省语言（缺省语言同时充当全部回退链的终点） */
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

/** 缺省语言对象（回退链终点）。 */
export const DEFAULT_LOCALE_ENTRY: Locale = BY_CODE.get(DEFAULT_LOCALE) as Locale;

/** 全部语言代码（展示顺序）。 */
export function localeCodes(): readonly string[] {
  return LOCALES.map((l) => l.code);
}

/** 按代码取语言；未登记返回 undefined。 */
export function findLocale(code: string): Locale | undefined {
  return BY_CODE.get(code);
}

/** 把任意外来值收敛为已登记语言代码（未登记 → 缺省语言）。 */
export function normalizeLocaleCode(code: string | null | undefined): string {
  return code && BY_CODE.has(code) ? code : DEFAULT_LOCALE;
}

/** 该语言代码的 URL 前缀段（缺省语言为空串）。 */
export function localePrefix(code: string): string {
  return BY_CODE.get(code)?.prefix ?? '';
}

/**
 * 把「无前缀的站点路径」转成某语言的 URL 路径。
 * `localizedPath('cn', '/character')` → `/character`；`localizedPath('en', '/character')` → `/en/character`。
 * 传入已带前缀的路径时先剥前缀再拼，保证幂等（切换语言时可直接喂 `route.fullPath`）。
 */
export function localizedPath(code: string, path: string): string {
  const stripped = stripLocalePrefix(path);
  const prefix = localePrefix(code);
  if (!prefix) return stripped;
  return stripped === '/' ? `/${prefix}` : `/${prefix}${stripped}`;
}

/**
 * 从 URL pathname 首段解析语言。
 *
 * 语言前缀实现在 **router history base**（`/en/` 或 `/`）而非路由表复制：这样路由名保持唯一、
 * 内部链接一律按「无前缀站点路径」书写即自动带上前缀（见 `router/index.ts`）。首段不是已登记
 * 前缀（含 `/cn/...`——缺省语言不做别名）时返回缺省语言，交由路由层落 404。
 */
export function localeFromPath(pathname: string): Locale {
  const head = pathname.replace(/^\/+/, '').split('/')[0] ?? '';
  return LOCALES.find((l) => l.prefix && l.prefix === head) ?? DEFAULT_LOCALE_ENTRY;
}

/** 从 URL pathname 解析 router history base：非缺省语言为 `/<前缀>/`，否则 `/`。 */
export function localeBaseFromPath(pathname: string): string {
  const locale = localeFromPath(pathname);
  return locale.prefix ? `/${locale.prefix}/` : '/';
}

/**
 * 剥掉路径首段的语言前缀，返回无前缀站点路径（查询串与 hash 原样保留）。
 * 首段不是已登记语言的 prefix 时原样返回（如 `/monster/123` → `/monster/123`）。
 */
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
