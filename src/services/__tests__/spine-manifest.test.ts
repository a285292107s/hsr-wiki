/**
 * spine-manifest 双清单回退链回归锁
 *
 * 唯一的职责是「回退链不能整体消失」：官方角色必须在 nanoka 清单里保留同名回退条目。
 * **禁止在此恢复清单结构断言**（version 一致性 / 顶层键集合 / 键排序 / 折叠格式 /
 * textures 扩展名 / nanoka 全 skel）——这些已由 `pnpm build` 前置守卫
 * `tools/check-spine-manifest.mjs` 逐项校验（且额外含 --fetch 在线可达性）；
 * 两份维护同一规则意味着改一条规则要改两处，属重复覆盖。
 */
import { describe, expect, it } from 'vitest';
import type { SpineNanokaManifest, SpineOfficialManifest } from '../types';

// ?raw 导入避免 node fs 依赖（happy-dom 环境无 @types/node）
const officialRaw = (await import('../../../public/data/cn/spine-manifest-official.json?raw')).default;
const nanokaRaw = (await import('../../../public/data/cn/spine-manifest-nanoka.json?raw')).default;
const official = JSON.parse(officialRaw) as SpineOfficialManifest;
const nanoka = JSON.parse(nanokaRaw) as SpineNanokaManifest;

describe('spine-manifest 双清单一致性', () => {
  it('两清单重复键 = 官方角色回退条目（官方优先，失效时回退 nanoka）', () => {
    const overlap = Object.keys(official.entries).filter((k) => k in nanoka.entries);
    // 15 个官方角色中 12 个有 nanoka 回退（1508/1509/1510 为 4.4 新角色，nanoka 未收录 → 无回退，官方失效时回退立绘）
    expect(overlap.length).toBeGreaterThan(0);
    for (const k of overlap) {
      expect(nanoka.entries[k].kind, `${k} nanoka 侧应为 skel`).toBe('skel');
    }
  });
});
