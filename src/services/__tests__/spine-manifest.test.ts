/**
 * spine-manifest 双清单一致性校验（防止缓存键漏 bump）：
 * - 两个清单（official / nanoka）顶层 version 必须与 lib/constants.ts 的
 *   SPINE_MANIFEST_VERSION 一致（缓存键 spine_manifest_{official|nanoka}_v{N} 依赖此值）
 * - 静态结构契约：official=折叠格式（base + dir + 文件名）；nanoka=仅 skel；
 *   textures 键含扩展名、entries 键排序、两清单无重复键（官方优先，重复键使 nanoka 侧成为回退路径）
 */
import { describe, expect, it } from 'vitest';
import { SPINE_MANIFEST_VERSION } from '../../lib/constants';
import type { SpineNanokaManifest, SpineOfficialManifest } from '../types';

// ?raw 导入避免 node fs 依赖（happy-dom 环境无 @types/node）；JSON 顶层结构由下方测试校验
const officialRaw = (await import('../../../public/data/cn/spine-manifest-official.json?raw')).default;
const nanokaRaw = (await import('../../../public/data/cn/spine-manifest-nanoka.json?raw')).default;
const official = JSON.parse(officialRaw) as SpineOfficialManifest;
const nanoka = JSON.parse(nanokaRaw) as SpineNanokaManifest;

describe('spine-manifest 双清单一致性', () => {
  it('两清单顶层 version 均与 SPINE_MANIFEST_VERSION 一致（缓存键依赖）', () => {
    expect(official.version).toBe(SPINE_MANIFEST_VERSION);
    expect(nanoka.version).toBe(SPINE_MANIFEST_VERSION);
  });

  it('两清单顶层结构：official=version/base/entries，nanoka=version/entries（无 base）', () => {
    expect(Object.keys(official).sort()).toEqual(['base', 'entries', 'version']);
    expect(Object.keys(nanoka).sort()).toEqual(['entries', 'version']);
    for (const key of [...Object.keys(official.entries), ...Object.keys(nanoka.entries)]) {
      expect(key.startsWith('$')).toBe(false);
    }
  });

  it('两清单重复键 = 官方角色回退条目（官方优先，失效时回退 nanoka）', () => {
    const overlap = Object.keys(official.entries).filter((k) => k in nanoka.entries);
    // 15 个官方角色中 12 个有 nanoka 回退（1508/1509/1510 为 4.4 新角色，nanoka 未收录 → 无回退，官方失效时回退立绘）
    expect(overlap.length).toBeGreaterThan(0);
    for (const k of overlap) {
      expect(nanoka.entries[k].kind, `${k} nanoka 侧应为 skel`).toBe('skel');
    }
    expect(overlap.sort()).toEqual(overlap);
  });

  it('official：base 为站点公共前缀（https:// 开头且无残留 hash 文件名）', () => {
    expect(official.base.startsWith('https://')).toBe(true);
    expect(official.base.endsWith('/')).toBe(true);
    expect(official.base).not.toMatch(/\d{5,}/); // 不含 hash 数字段
  });

  it('entries 键按 ID 升序排列（数字键先，场景键后）', () => {
    for (const entries of [official.entries, nanoka.entries]) {
      const keys = Object.keys(entries);
      const numeric = keys.filter((k) => /^\d+$/.test(k));
      for (let i = 1; i < numeric.length; i++) {
        expect(Number(numeric[i])).toBeGreaterThan(Number(numeric[i - 1]));
      }
      const nonNumeric = keys.filter((k) => !/^\d+$/.test(k));
      const sortedNonNumeric = [...nonNumeric].sort();
      expect(nonNumeric).toEqual(sortedNonNumeric);
    }
  });

  it('official 条目：折叠格式（dir + 相对文件名，无完整 URL）', () => {
    for (const [key, v] of Object.entries(official.entries)) {
      if (v.kind !== 'official') continue;
      expect(v.dir.endsWith('/'), `${key} dir 应以 / 结尾`).toBe(true);
      expect(v.atlas.endsWith('.atlas'), `${key} atlas`).toBe(true);
      expect(v.json.endsWith('.json'), `${key} json`).toBe(true);
      // 相对文件名不得含 '/'（应拆到 dir 段）或完整 URL 前缀
      for (const [field, file] of [
        ['atlas', v.atlas], ['json', v.json], ...Object.entries(v.textures).map(([t, f]) => [t, f] as const),
      ]) {
        expect(file.includes('/'), `${key} ${field} 应为相对文件名`).toBe(false);
        expect(file.startsWith('http'), `${key} ${field} 不应为完整 URL`).toBe(false);
        expect(file.endsWith('.png') || file.endsWith('.atlas') || file.endsWith('.json'), `${key} ${field} 扩展名`).toBe(true);
      }
      // textures 键 = atlas 逻辑纹理名，必须含 .png 扩展名（与 atlas page 行逐字一致）
      for (const [logical, file] of Object.entries(v.textures)) {
        expect(logical.endsWith('.png'), `${key} textures 键 ${logical} 应含 .png`).toBe(true);
        expect(file.endsWith('.png'), `${key} textures 值 ${file} 应为 .png`).toBe(true);
      }
      // 元数据：version 格式与 source 枚举
      if (v.version !== undefined) expect(v.version).toMatch(/^\d+\.\d+$/);
      if (v.source !== undefined) expect(['home', 'character', 'wayback']).toContain(v.source);
      // runtime 标记（4.0 格式导出分派 4.1 运行时）：值必须为引擎支持的运行时版本
      if (v.runtime !== undefined) expect(['4.1', '4.2']).toContain(v.runtime);
    }
  });

  it('official-scene 条目：viewport 完整 + layers 均为折叠格式', () => {
    for (const [key, v] of Object.entries(official.entries)) {
      if (v.kind !== 'official-scene') continue;
      expect(typeof v.viewport.x).toBe('number');
      expect(typeof v.viewport.width).toBe('number');
      expect(v.layers.length).toBeGreaterThan(0);
      for (const layer of v.layers) {
        expect(layer.dir.endsWith('/'), `${key} layer dir`).toBe(true);
        expect(layer.atlas.endsWith('.atlas'), `${key} layer atlas`).toBe(true);
        expect(layer.json.endsWith('.json'), `${key} layer json`).toBe(true);
        expect(layer.atlas.includes('/'), `${key} layer atlas 应为相对文件名`).toBe(false);
        for (const file of Object.values(layer.textures)) {
          expect(file.endsWith('.png'), `${key} layer texture`).toBe(true);
          expect(file.includes('/'), `${key} layer texture 应为相对文件名`).toBe(false);
        }
      }
    }
  });

  it('nanoka 条目：全部为 skel，name 非空且多段以 | 分隔', () => {
    for (const [key, v] of Object.entries(nanoka.entries)) {
      expect(v.kind, `${key} 应为 skel`).toBe('skel');
      expect(v.name.trim().length, `${key} name 为空`).toBeGreaterThan(0);
      for (const part of v.name.split('|')) {
        expect(part.trim().length, `${key} 存在空段`).toBeGreaterThan(0);
      }
    }
  });

  it('official 清单全部 kind 合法（official / official-scene），nanoka 仅 skel', () => {
    const officialKinds = new Set(Object.values(official.entries).map((v) => v.kind));
    expect([...officialKinds].sort()).toEqual(['official', 'official-scene']);
    const nanokaKinds = new Set(Object.values(nanoka.entries).map((v) => v.kind));
    expect([...nanokaKinds]).toEqual(['skel']);
  });
});
