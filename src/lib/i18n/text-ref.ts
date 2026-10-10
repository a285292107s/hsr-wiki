/* 文本引用令牌的解析层（[ADR 0052](../../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2）。
 *
 * 结构层 JSON（`public/data/*.json`）里来自 TextMap 的文本一律是这个形态：
 *   `"$t:<TextMap 键>"`（见 `tools/converter/textpack.py`，两侧格式互为镜像）
 * 语言包 `{<键>: <该语言文本>}` 由转换器生成、**缺键已从缺省语言回填**，因此运行期只要一份包。
 *
 * 数据层在 `fetchJSON` 之后调用 `resolveTextTokens`，把令牌换成当前语言文本；
 * 解析之后的形状与改造前完全一致（仍是 `string`），所以 store / 视图 / 目录配置无需改写。
 */

import { NkError } from '../errors';

export const TEXT_TOKEN_PREFIX = '$t:';

/** 语言包：TextMap 键 → 该语言文本。 */
export type TextPack = Readonly<Record<string, string>>;

/** 判断一个值是否为文本引用令牌（仅字符串形态；数字 / 对象一律不是）。 */
export function isTextToken(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(TEXT_TOKEN_PREFIX);
}

/** 从令牌取回 TextMap 键；非令牌抛错。 */
export function textTokenKey(value: string): string {
  if (!isTextToken(value)) throw new NkError(`不是文本引用令牌: ${value}`);
  return value.slice(TEXT_TOKEN_PREFIX.length);
}

/**
 * 结构里是否存在文本令牌（**命中即返回**，不必走完整棵树）。
 *
 * 取数层用它决定要不要去取语言包：语言无关的数据（数值曲线 / 清单表）与尚未令牌化的
 * 结构层都返回 false ⇒ 零额外请求、零解析开销。
 */
export function hasTextToken(value: unknown): boolean {
  if (isTextToken(value)) return true;
  if (Array.isArray(value)) return value.some(hasTextToken);
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasTextToken);
  }
  return false;
}

/**
 * 递归把所有令牌换成语言包里的文本，返回新结构（不改动入参）。
 *
 * 缺键视为**数据与语言包版本不一致**（语言包自包含，正常不该缺），抛 `NkError` 交由 store
 * 的错误边界呈现——静默回填空串会把数据缺陷藏成「这页少了几行字」。
 */
export function resolveTextTokens<T>(value: T, pack: TextPack, path = ''): T {
  if (isTextToken(value)) {
    const key = textTokenKey(value);
    const text = pack[key];
    if (text === undefined) {
      throw new NkError(`语言包缺键 ${key}${path ? ` @ ${path}` : ''}（数据与语言包不同源）`);
    }
    return text as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => resolveTextTokens(v, pack, path ? `${path}[${i}]` : `[${i}]`)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveTextTokens(v, pack, path ? `${path}.${k}` : k);
    }
    return out as unknown as T;
  }
  return value;
}

/** 统计结构里的令牌（键 → 次数）；供守卫与测试核对结构层是否还有残留原文。 */
export function collectTextTokens(value: unknown, sink: Map<string, number> = new Map()): Map<string, number> {
  if (isTextToken(value)) {
    const key = textTokenKey(value);
    sink.set(key, (sink.get(key) ?? 0) + 1);
  } else if (Array.isArray(value)) {
    for (const v of value) collectTextTokens(v, sink);
  } else if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) collectTextTokens(v, sink);
  }
  return sink;
}
