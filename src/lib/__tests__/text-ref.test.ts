// @vitest-environment node
/**
 * text-ref.ts（文本引用令牌解析层）单元测试。
 * 同时钉住与转换器侧 `tools/converter/textpack.py` 的令牌格式一致性——两侧互为镜像，
 * 格式漂移会让产物里的令牌全部解析失败，故在这里做跨侧比对。
 */
import { describe, it, expect } from 'vitest';
import {
  TEXT_TOKEN_PREFIX,
  collectTextTokens,
  hasTextToken,
  isTextToken,
  resolveTextTokens,
  textTokenKey,
} from '../i18n/text-ref';
import { NkError } from '../errors';

// ?raw 导入避免 node fs 依赖（vue-tsc 门禁无 @types/node，见 text-ref 同目录既有约定）
const textpackPy = (await import('../../../tools/converter/textpack.py?raw')).default;

const PACK = { '111': 'March 7th', '222': 'Ice', '333': 'Skill' } as const;

describe('令牌格式与转换器侧一致', () => {
  it('TOKEN_PREFIX 与 textpack.py 逐字相同', () => {
    const m = /TOKEN_PREFIX\s*=\s*(['"])([^'"]*)\1/.exec(textpackPy);
    expect(m, 'textpack.py 未声明 TOKEN_PREFIX').not.toBeNull();
    expect(m![2]).toBe(TEXT_TOKEN_PREFIX);
  });
});

describe('isTextToken / textTokenKey', () => {
  it('只认字符串形态的令牌', () => {
    expect(isTextToken('$t:111')).toBe(true);
    expect(isTextToken(111)).toBe(false);
    expect(isTextToken(null)).toBe(false);
    expect(isTextToken({ $t: '111' })).toBe(false);
    expect(isTextToken('三月七')).toBe(false);
  });

  it('取键；非令牌抛 NkError', () => {
    expect(textTokenKey('$t:111')).toBe('111');
    expect(() => textTokenKey('三月七')).toThrow(NkError);
  });
});

describe('resolveTextTokens', () => {
  it('替换嵌套结构里的全部令牌且不改写入参', () => {
    const src = {
      name: '$t:111',
      tags: ['$t:222', 'plain', 3],
      nested: { d: '$t:333' },
      n: null,
    };
    const out = resolveTextTokens(src, PACK);
    expect(out).toEqual({
      name: 'March 7th',
      tags: ['Ice', 'plain', 3],
      nested: { d: 'Skill' },
      n: null,
    });
    expect(src.name).toBe('$t:111');
    expect(out).not.toBe(src);
  });

  it('标量与无令牌结构原样返回', () => {
    expect(resolveTextTokens('三月七', PACK)).toBe('三月七');
    expect(resolveTextTokens(42, PACK)).toBe(42);
    expect(resolveTextTokens({ a: 1, b: ['x'] }, PACK)).toEqual({ a: 1, b: ['x'] });
  });

  it('缺键抛 NkError 并带上路径（语言包自包含，缺键即数据不同源）', () => {
    expect(() => resolveTextTokens({ a: { b: '$t:999' } }, PACK)).toThrow(NkError);
    try {
      resolveTextTokens({ a: { b: '$t:999' } }, PACK);
    } catch (e) {
      expect((e as NkError).message).toContain('a.b');
      expect((e as NkError).message).toContain('999');
    }
  });

  it('数组路径带下标', () => {
    try {
      resolveTextTokens({ list: ['plain', '$t:999'] }, PACK);
      throw new Error('应当抛错');
    } catch (e) {
      expect((e as NkError).message).toContain('list[1]');
    }
  });
});

describe('hasTextToken', () => {
  it('命中最内层令牌', () => {
    expect(hasTextToken({ a: { b: ['x', '$t:111'] } })).toBe(true);
    expect(hasTextToken('$t:111')).toBe(true);
  });

  it('无令牌（未令牌化 / 语言无关数据）返回 false', () => {
    expect(hasTextToken({ a: '三月七', b: [1, 2, null] })).toBe(false);
    expect(hasTextToken({ $t: '111' })).toBe(false); // 对象形态不是令牌
    expect(hasTextToken(null)).toBe(false);
    expect(hasTextToken(undefined)).toBe(false);
    expect(hasTextToken(0)).toBe(false);
  });
});

describe('collectTextTokens', () => {
  it('统计键出现次数', () => {
    const sink = collectTextTokens({ a: '$t:111', b: ['$t:111', '$t:222', 'plain'] });
    expect([...sink.entries()].sort()).toEqual([['111', 2], ['222', 1]]);
  });

  it('无令牌时返回空表', () => {
    expect(collectTextTokens({ a: '三月七' }).size).toBe(0);
  });
});
