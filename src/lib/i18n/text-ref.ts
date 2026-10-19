
import { NkError } from '../errors';

export const TEXT_TOKEN_PREFIX = '$t:';

export type TextPack = Readonly<Record<string, string>>;

export function isTextToken(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(TEXT_TOKEN_PREFIX);
}

export function textTokenKey(value: string): string {
  if (!isTextToken(value)) throw new NkError(`不是文本引用令牌: ${value}`);
  return value.slice(TEXT_TOKEN_PREFIX.length);
}

export function hasTextToken(value: unknown): boolean {
  if (isTextToken(value)) return true;
  if (Array.isArray(value)) return value.some(hasTextToken);
  if (value !== null && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasTextToken);
  }
  return false;
}

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
