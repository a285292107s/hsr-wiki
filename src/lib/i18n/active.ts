/* 当前语言（站点运行期状态）。
 *
 * `lib/` 不引 Vue，故这里只放一个模块级值 + setter（与 `src/lib/constants.ts` 的
 * `setUseOfficialPaths` 同一模式）：取数层要靠它决定加载哪个语言包，路由层在导航时写入。
 */
import { DEFAULT_LOCALE, localizedPath, normalizeLocaleCode } from './locales';

let active = DEFAULT_LOCALE;

/** 当前语言代码（未设置时为缺省语言）。 */
export function activeLocale(): string {
  return active;
}

/**
 * 当前语言下的站内链接。
 *
 * 供**模板字符串卡片**等非 `RouterLink` 场合使用：目录卡的 HTML 是拼出来的 `<a href>`，
 * 不走 router 的 history base，不显式加前缀就会在非缺省语言下静默跳回缺省语言。
 */
export function activeHref(path: string): string {
  return localizedPath(active, path);
}

/** 设置当前语言（未登记代码回退缺省语言）。 */
export function setActiveLocale(code: string): void {
  active = normalizeLocaleCode(code);
}

/** 复位为缺省语言（测试用）。 */
export function resetActiveLocale(): void {
  active = DEFAULT_LOCALE;
}
