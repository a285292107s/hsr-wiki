/**
 * `lib/` 内部的词典翻译入口：**由 app 层注入**（`bootstrap.ts` 挂载前调用一次）。
 *
 * 为什么不是直接 import `src/app/i18n.ts`：`app` 依赖 `lib`，反向 import 会成环；这与
 * `lib/i18n/active.ts` 的 module-level setter 同一模式。注入前 `labelText` 返回键本身，
 * `labelTextOr` 回退到兜底值 ⇒ 界面永远不会露出原始词典键。
 */
let translateFn: ((key: string) => string) | null = null;

/** 注入词典翻译函数（`bootstrap.ts` 调用；幂等）。 */
export function setLabelTranslator(fn: (key: string) => string): void {
  translateFn = fn;
}

/** 词典键 → 译文；未注入时返回键本身（便于调用方判断缺键）。 */
export function labelText(key: string): string {
  return translateFn ? translateFn(key) : key;
}

/** 词典键 → 译文；缺键或未注入时返回 `fallback`（不显示原始键）。 */
export function labelTextOr(key: string, fallback: string): string {
  const got = labelText(key);
  return got === key ? fallback : got;
}
