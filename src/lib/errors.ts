
export class NkError extends Error {
  readonly operational: boolean;

  constructor(message: string, operational = true) {
    super(message);
    this.name = 'NkError';
    this.operational = operational;
  }
}

/**
 * 面向用户的错误详情行。
 *
 * `NkError` 的 message 是**内部诊断**（`check-ui-chinese.mjs` 的白名单即按此归类，文案为中文）⇒
 * 直接渲染到错误态里会让非缺省语言用户在界面看到中文诊断，而且这类文案带字段名/ID，本来也
 * 不适合给玩家看。故：operational 错误只在控制台留痕（详情行返回空串，界面用本地化标题 + 重试），
 * 非 NkError（编程错误）保持原样暴露。返回值空串表示不渲染详情行。
 */
export function userErrorDetail(err: unknown): string {
  if (err instanceof NkError && err.operational) {
    console.warn('[nk] operational error:', err.message);
    return '';
  }
  return err instanceof Error ? err.message : String(err);
}
