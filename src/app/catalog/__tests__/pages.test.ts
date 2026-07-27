/**
 * 目录页数据流测试：验证 catalog/pages.ts 的 fetchData 将本地数据映射为统一 CatalogItem[]。
 * 通过对 src/services/api 整体 mock（纯内存 fixture），不依赖网络与本地数据文件，可在 CI 稳定运行。
 */
import { describe, it, expect, vi } from 'vitest';
import type { LocalCharList, LocalItemList, LocalLightConeList } from '../../../services/types';
import { CATALOG_PAGES } from '../pages';

vi.mock('../../../services/api', () => ({
  loadLocalItems: vi.fn(),
  loadLocalLightCones: vi.fn(),
  loadLocalRelicSets: vi.fn(),
  loadLocalMonsterList: vi.fn(),
  loadLocalMazeList: vi.fn(),
  loadLocalStoryList: vi.fn(),
  loadLocalBossList: vi.fn(),
  loadLocalPeakList: vi.fn(),
  prefetchEndgameAll: vi.fn(),
  loadLocalCharacterList: vi.fn(),
  RARITY_NUM_TO_KEY: { 5: 'SuperRare', 4: 'VeryRare', 3: 'Rare', 2: 'NotNormal', 1: 'Normal' },
}));

import { loadLocalCharacterList, loadLocalItems, loadLocalLightCones } from '../../../services/api';

const charSample: LocalCharList = [
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

const itemSample: LocalItemList = [
  {
    id: 23013, name: '星琼', desc: '', bg_desc: '',
    main_type: 'Virtual', sub_type: 'Virtual', rarity: 5, purpose_type: 0,
    icon: '', figure_icon: 'icon/item_figure/23013.png',
  },
];

const lcSample: LocalLightConeList = [
  {
    id: 20000, name: '镜中故我', rarity: 5, path: 'Destruction',
    skill_id: 0, skill_name: '', skill_desc: '', icon: '', icon_figure: '',
  },
];

describe('character 目录页 fetchData', () => {
  it('将本地角色列表映射为统一 CatalogItem[]', async () => {
    vi.mocked(loadLocalCharacterList).mockResolvedValue(charSample);
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

describe('item 目录页 fetchData', () => {
  it('将本地物品数组映射为 CatalogItem（数字稀有度→字符串键）', async () => {
    vi.mocked(loadLocalItems).mockResolvedValue(itemSample);
    const page = CATALOG_PAGES.item;
    const items = await page.fetchData!({ version: '4.3.1' });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: '23013',
      name: '星琼',
      rarity: 'SuperRare', // 数字 5 经 RARITY_NUM_TO_KEY 映射
      subType: 'Virtual',
    });
  });
});

describe('lightcone 目录页 fetchData', () => {
  it('将本地光锥数组映射为 CatalogItem', async () => {
    vi.mocked(loadLocalLightCones).mockResolvedValue(lcSample);
    const page = CATALOG_PAGES.lightcone;
    const items = await page.fetchData!({ version: '4.3.1' });
    expect(items[0]).toMatchObject({
      id: '20000',
      name: '镜中故我',
      rarity: 5,
      path: 'destruction',
    });
  });
});
