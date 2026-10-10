/* UI 文案多语言实例（[ADR 0052](../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 4）。
 *
 * 词典本体是**纯数据**（`src/lib/i18n/messages/<语言>.json`，源语言 = `cn`，键集由
 * `tools/check-i18n-messages.mjs` 强制对齐）；实例必须落在 app 层——`lib/` 禁止 import Vue。
 * 语言在加载期由 URL 前缀确定（`bootstrap.ts` 先 `setActiveLocale`，再建本实例），
 * 切语言走整页导航，故 `locale` 无需响应式更新。
 *
 * 词典用 `import.meta.glob` 收拢：新增语言只加一个 JSON 文件，不必改本文件；
 * 「词典 ↔ 语言清单」的一致性由 `src/lib/__tests__/messages.test.ts` 与守卫双向钉住。
 */
import { createI18n } from 'vue-i18n';

const bundles = import.meta.glob<Record<string, string>>('../lib/i18n/messages/*.json', {
  eager: true,
  import: 'default',
});

const messages: Record<string, Record<string, string>> = {};
for (const [path, body] of Object.entries(bundles)) {
  const code = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
  messages[code] = body;
}

const DEV = import.meta.env.DEV;

export const i18n = createI18n({
  legacy: false,
  /* 初值固定为缺省语言：本模块的**求值早于** `bootstrap()`（静态 import 链），
     在顶层读 `activeLocale()` 会读到尚未设置的值。语言由 `setI18nLocale` 在启动流程里显式注入。 */
  locale: 'cn',
  /* 缺键回退缺省语言：漏译在界面上表现为中文而非空白；漏译本身由守卫在构建前拦下 */
  fallbackLocale: 'cn',
  messages,
  missingWarn: DEV,
  fallbackWarn: DEV,
});

/** 设置界面语言（`bootstrap()` 在 `setActiveLocale` 之后调用；语言来自 URL 前缀）。 */
export function setI18nLocale(code: string): void {
  i18n.global.locale.value = code;
}

/** 供非组件模块（路由 afterEach、模板字符串卡片等）取译文；支持具名插值。 */
export function translate(key: string, named?: Record<string, unknown>): string {
  return named ? i18n.global.t(key, named) : i18n.global.t(key);
}
