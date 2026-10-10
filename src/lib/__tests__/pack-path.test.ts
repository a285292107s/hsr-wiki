// @vitest-environment node
/**
 * pack-path.ts（语言包分组规则）单元测试。
 * 规则必须与转换器 `tools/converter/textpack.py: group_of` 一致——算错分组会去取不存在的包，
 * 端到端一致性另由「语言包覆盖」用例对着真实产物验证。
 */
import { describe, it, expect } from 'vitest';
import { packGroupOf } from '../i18n/pack-path';

describe('packGroupOf', () => {
  it('目录文件取首段目录名', () => {
    expect(packGroupOf('characters/1310.json')).toBe('characters');
    expect(packGroupOf('currency/role/1502.json')).toBe('currency');
    expect(packGroupOf('monsters/1003010.json')).toBe('monsters');
  });

  it('顶层文件取文件名（含多级后缀）', () => {
    expect(packGroupOf('characters.json')).toBe('characters');
    expect(packGroupOf('maze.json')).toBe('maze');
    expect(packGroupOf('maze.catalog.json')).toBe('maze.catalog');
  });

  it('容忍反斜杠与前置斜杠', () => {
    expect(packGroupOf('\\characters\\1310.json')).toBe('characters');
    expect(packGroupOf('/characters/1310.json')).toBe('characters');
    expect(packGroupOf('/maze.json')).toBe('maze');
  });

  it('非 json 名称原样作为分组', () => {
    expect(packGroupOf('assets/cw-hero.mp4')).toBe('assets');
  });
});
