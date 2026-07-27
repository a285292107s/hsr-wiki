/**
 * 目录页数据流测试：验证 catalog/pages.ts 的 fetchData 将本地/远程数据映射为统一 CatalogItem[]。
 * 通过对 src/services/api 整体 mock（纯内存 fixture），不依赖网络与本地数据文件，可在 CI 稳定运行。
 */
import { describe, it, expect, vi } from 'vitest';
import type { LocalCharList } from '../../../services/types';
import { CATALOG_PAGES } from '../pages';

vi.mock('../../../services/api', () => ({
  loadItems: vi.fn(),
  loadLightconeList: vi.fn(),
  loadRelicsetList: vi.fn(),
  loadMonsterList: vi.fn(),
  loadMazeList: vi.fn(),
  loadMazeVersions: vi.fn(),
  loadStoryList: vi.fn(),
  loadBossList: vi.fn(),
  loadPeakList: vi.fn(),
  loadPeakVersions: vi.fn(),
  prefetchEndgameAll: vi.fn(),
  loadLocalCharacterList: vi.fn(),
}));

import { loadLocalCharacterList } from '../../../services/api';

const sample: LocalCharList = [
  {
    id: 1508,
    name: '三月七',
    full_name: '三月七',
    rarity: 5,
    path: 'Preservation',
    element: 'Ice',
    sp_need: 120,
    vo_tag: 'san',
    icon: '1508.png',
    icon_round: '',
    icon_mini: '',
    icon_cutin: '',
    rank_ids: [],
    skill_ids: [],
  },
];

describe('character 目录页 fetchData', () => {
  it('将本地角色列表映射为统一 CatalogItem[]', async () => {
    vi.mocked(loadLocalCharacterList).mockResolvedValue(sample);
    const page = CATALOG_PAGES.character;
    expect(page.fetchData).toBeDefined();
    const items = await page.fetchData!({ version: '4.3.1' });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: '1508',
      name: '三月七',
      rarity: 5,
      path: 'preservation', // fetchData 内部 lowercase
      element: 'ice',
    });
  });
});
