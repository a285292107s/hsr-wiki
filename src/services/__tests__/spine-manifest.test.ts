// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { SpineNanokaManifest, SpineOfficialManifest } from '../types';

const officialRaw = (await import('../../../public/data/cn/spine-manifest-official.json?raw')).default;
const nanokaRaw = (await import('../../../public/data/cn/spine-manifest-nanoka.json?raw')).default;
const official = JSON.parse(officialRaw) as SpineOfficialManifest;
const nanoka = JSON.parse(nanokaRaw) as SpineNanokaManifest;

describe('spine-manifest 双清单一致性', () => {
  it('两清单重复键 = 官方角色回退条目（官方优先，失效时回退 nanoka）', () => {
    const overlap = Object.keys(official.entries).filter((k) => k in nanoka.entries);
    expect(overlap.length).toBeGreaterThan(0);
    for (const k of overlap) {
      expect(nanoka.entries[k].kind, `${k} nanoka 侧应为 skel`).toBe('skel');
    }
  });
});
