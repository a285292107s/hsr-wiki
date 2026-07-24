/**
 * api.ts CDN API 层测试
 * 内联 fixture 参照 cdn-samples 真实结构（manifest / spine manifest 的 "bg|a|b" 多段格式）。
 * ⚠️ 仅测试用；运行时始终实时请求 https://static.nanoka.cc。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CDN } from '../../lib/constants';
import type { CharacterData, Manifest } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 全新模块实例（api 依赖 cache 的模块级状态，一并重置） */
async function freshApi() {
  vi.resetModules();
  return await import('../api');
}

/** 按 URL 子串路由的 fetch mock；failUrls 中的路径抛网络异常 */
function routeFetch(routes: Record<string, unknown>, failUrls: string[] = []) {
  return vi.fn(async (url: string) => {
    const u = String(url);
    if (failUrls.some((f) => u.includes(f))) throw new Error('network down');
    for (const [k, v] of Object.entries(routes)) {
      if (u.includes(k)) return { ok: true, status: 200, json: async () => v };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

const manifestFixture: Manifest = {
  hsr: { latest: '4.3.1', available: ['4.3.1', '4.2.0'], live: '4.3.1', new: { '4.3.1': [1508] } },
};

/** 最小 CharacterData（仅 loadBuildNames 用到的字段 + 必填字段） */
const charFixture = (over: Partial<CharacterData> = {}): CharacterData => ({
  name: '测试',
  rarity: 'CombatPowerAvatarRarityType5',
  base_type: 'Mage',
  damage_type: 'Quantum',
  ranks: {},
  skills: {},
  skill_trees: {},
  stats: {},
  ...over,
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ─── 纯函数：URL 构建 / 版本解析 ─── */

describe('URL 构建与版本解析', () => {
  it('characterUrl / spineBaseUrl', async () => {
    const api = await freshApi();
    expect(api.characterUrl('4.3.1', '1508')).toBe(`${CDN}/hsr/4.3.1/zh/character/1508.json`);
    expect(api.spineBaseUrl('1403', 'tibao1')).toBe(`${CDN}/assets/hsr/spine/1403/tibao1`);
  });

  it('resolveVersion：latest 优先 → available[0] → 空串', async () => {
    const api = await freshApi();
    expect(api.resolveVersion(manifestFixture)).toBe('4.3.1');
    expect(api.resolveVersion({ hsr: { ...manifestFixture.hsr, latest: '', available: ['4.2.0'] } })).toBe('4.2.0');
    expect(api.resolveVersion({} as Manifest)).toBe('');
  });
});

/* ─── manifest / 角色 / 遗器加载 ─── */

describe('数据加载', () => {
  it('loadManifest 返回清单并走缓存', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({ '/manifest.json': manifestFixture });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadManifest()).resolves.toEqual(manifestFixture);
    await api.loadManifest();
    expect(fetchMock).toHaveBeenCalledTimes(1); // 第二次命中内存
  });

  it('loadCharacter 返回角色数据并缓存', async () => {
    const api = await freshApi();
    const charData = charFixture({ name: '远坂凛' });
    const fetchMock = routeFetch({ 'character/1508.json': charData });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadCharacter('4.3.1', '1508')).resolves.toEqual(charData);
    await api.loadCharacter('4.3.1', '1508');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loadItems 返回物品库', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', routeFetch({ 'item.json': { '23013': { item_name: 'X', item_sub_type: 'Lightcone', rarity: 'SuperRare' } } }));
    const items = await api.loadItems('4.3.1');
    expect(items['23013'].item_name).toBe('X');
  });

  it('loadRelicSet：成功返回数据，失败静默 null', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', routeFetch({ 'relicset/110.json': { name: '套装A' } }));
    await expect(api.loadRelicSet('4.3.1', 110)).resolves.toEqual({ name: '套装A' });
    await expect(api.loadRelicSet('4.3.1', 999)).resolves.toBeNull(); // 404 → null
  });
});

/* ─── Spine 清单解析 ─── */

describe('resolveSpineName', () => {
  it('普通名 / 多段跳过 bg / 不存在 → null', async () => {
    const api = await freshApi();
    // 结构参照 cdn-samples/local-spine-manifest.json
    vi.stubGlobal('fetch', routeFetch({
      'spine/manifest.json': { '1005': 'kafuka', '1403': 'bg|tibao1|tibao2|tibao3|tibaoqj', '8009': 'nan_42' },
    }));
    await expect(api.resolveSpineName('1005')).resolves.toBe('kafuka');
    await expect(api.resolveSpineName('1403')).resolves.toBe('tibao1'); // 跳过 bg
    await expect(api.resolveSpineName('9999')).resolves.toBeNull();
  });

  it('仅 bg 段 → 回退 parts[0]', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', routeFetch({ 'spine/manifest.json': { '1': 'bg' } }));
    await expect(api.resolveSpineName('1')).resolves.toBe('bg');
  });

  it('网络失败 → null（不抛出）', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    await expect(api.resolveSpineName('1005')).resolves.toBeNull();
  });
});

/* ─── 配装名称批量加载 ─── */

describe('loadBuildNames', () => {
  it('收集光锥/遗器套装/队伍成员名称，失败回退 #id，已有缓存跳过请求', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({
      'lightcone/23013.json': { name: '光锥名' },
      'relicset/110.json': { name: '套装A' },
      'character/1006.json': {}, // 无 name 字段 → #1006
    }, ['relicset/120.json']); // 网络失败 → #120
    vi.stubGlobal('fetch', fetchMock);
    const d = charFixture({
      lightcones: [23013],
      relics: { set4_id_list: [110], set2_id_list: [120] },
      teams: [{ avatar_id: 1508, team_id: 1, position: 0, member_list: [1005, 1006] }],
    });
    const result = await api.loadBuildNames('4.3.1', d, { '1005': '已有名' });
    expect(result).toEqual({
      '1005': '已有名',
      '23013': '光锥名',
      '110': '套装A',
      '120': '#120',
      '1006': '#1006',
    });
    const urls = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(urls.some((u) => u.includes('character/1005'))).toBe(false); // 已有 → 跳过
    expect(urls.filter((u) => u.includes('character/1006'))).toHaveLength(1);
  });

  it('无配装引用 → 原样返回 existing', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({});
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadBuildNames('4.3.1', charFixture(), { a: '1' })).resolves.toEqual({ a: '1' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/* ─── Hover 预取 ─── */

describe('prefetchCharData', () => {
  it('预取成功写入内存缓存；重复预取同角色只请求一次', async () => {
    const api = await freshApi();
    const cache = await import('../cache'); // 与 api 同模块图
    const fetchMock = routeFetch({ 'character/1508.json': charFixture({ name: '预取' }) });
    vi.stubGlobal('fetch', fetchMock);
    api.prefetchCharData('4.3.1', '1508');
    api.prefetchCharData('4.3.1', '1508'); // 重复 → prefetched Set 去重
    await sleep(150);
    expect(cache.memHas('char_4.3.1_1508')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('空 ver / charId 不预取', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({});
    vi.stubGlobal('fetch', fetchMock);
    api.prefetchCharData('', '1508');
    api.prefetchCharData('4.3.1', '');
    await sleep(50);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
