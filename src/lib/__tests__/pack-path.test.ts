// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { packGroupOf } from '../i18n/pack-path';

describe('packGroupOf', () => {
  it('详情文件按所在目录与 ID 取模分包（单页只取自己那份）', () => {
    expect(packGroupOf('characters/1310.json')).toBe(`characters.${1310 % 32}`);
    expect(packGroupOf('currency/role/1502.json')).toBe(`currency.role.${1502 % 32}`);
    expect(packGroupOf('light_cones/23003.json')).toBe(`light_cones.${23003 % 32}`);
  });

  it('共享键密集的详情目录不分片（分片会按片复制同一批键）', () => {
    expect(packGroupOf('monsters/1003010.json')).toBe('monsters');
  });

  it('顶层索引文件取文件名并加 .index 后缀（与详情分包隔离）', () => {
    expect(packGroupOf('characters.json')).toBe('characters.index');
    expect(packGroupOf('maze.json')).toBe('maze.index');
    expect(packGroupOf('maze.catalog.json')).toBe('maze.catalog.index');
  });

  it('非数字命名的目录内文件取首段目录', () => {
    expect(packGroupOf('currency/prop_icons.json')).toBe('currency');
  });

  it('容忍反斜杠与前置斜杠', () => {
    expect(packGroupOf('\\characters\\1310.json')).toBe(`characters.${1310 % 32}`);
    expect(packGroupOf('/characters/1310.json')).toBe(`characters.${1310 % 32}`);
    expect(packGroupOf('/maze.json')).toBe('maze.index');
  });

  it('非 json 名称原样作为分组', () => {
    expect(packGroupOf('assets/cw-hero.mp4')).toBe('assets');
  });
});
