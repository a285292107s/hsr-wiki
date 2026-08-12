/**
 * services/api API 层测试
 * 内联 fixture 参照真实响应结构手工构造（manifest / spine manifest 的 "bg|a|b" 多段格式）。
 * 二期数据源已统一为本地：此处覆盖本地数据加载（loadLocal*）、物品库转换与纯函数。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { CDN } from '../../lib/constants';
import type { Manifest } from '../types';

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
      if (u.includes(k)) return { ok: true, status: 200, text: async () => JSON.stringify(v) };
    }
    return { ok: false, status: 404, text: async () => '{}' };
  });
}

const manifestFixture: Manifest = {
  hsr: { latest: '4.3.1', available: ['4.3.1', '4.2.0'], live: '4.3.1', new: { '4.3.1': [1508] } },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ─── 纯函数：URL 构建 / 版本解析 ─── */

describe('URL 构建与版本解析', () => {
  it('spineBaseUrl 拼装正确', async () => {
    const api = await freshApi();
    expect(api.spineBaseUrl('1403', 'tibao1')).toBe(`${CDN}/assets/hsr/spine/1403/tibao1`);
  });

  it('resolveVersion：latest 优先 → available[0] → 空串', async () => {
    const api = await freshApi();
    expect(api.resolveVersion(manifestFixture)).toBe('4.3.1');
    expect(api.resolveVersion({ hsr: { ...manifestFixture.hsr, latest: '', available: ['4.2.0'] } })).toBe('4.2.0');
    expect(api.resolveVersion({} as Manifest)).toBe('');
  });
});

/* ─── manifest / 本地数据加载 ─── */

describe('数据加载', () => {
  it('loadManifest 返回清单并走缓存', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({ '/manifest.json': manifestFixture });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadManifest()).resolves.toEqual(manifestFixture);
    await api.loadManifest();
    expect(fetchMock).toHaveBeenCalledTimes(1); // 第二次命中内存
  });

  it('loadLocalItems 返回本地物品数组', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', routeFetch({
      'items.json': [
        { id: 23013, name: '星琼', desc: '', bg_desc: '', main_type: 'Virtual', sub_type: 'Virtual', rarity: 5, purpose_type: 0, icon: '', figure_icon: 'icon/item_figure/23013.png' },
      ],
    }));
    const items = await api.loadLocalItems();
    expect(items[0].id).toBe(23013);
    expect(items[0].name).toBe('星琼');
  });

  it('loadLocalItemDb 将数字稀有度映射为字符串键并构建 Record', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', routeFetch({
      'items.json': [
        { id: 23013, name: '星琼', desc: '', bg_desc: '', main_type: 'Virtual', sub_type: 'Virtual', rarity: 5, purpose_type: 0, icon: '', figure_icon: '' },
        { id: 1001, name: '便当', desc: '', bg_desc: '', main_type: 'Food', sub_type: 'Food', rarity: 3, purpose_type: 0, icon: '', figure_icon: '' },
      ],
    }));
    const db = await api.loadLocalItemDb();
    expect(db['23013'].item_name).toBe('星琼');
    expect(db['23013'].rarity).toBe('SuperRare');
    expect(db['1001'].rarity).toBe('Rare');
    expect(db['23013'].item_figure_icon_path).toBe('');
  });

  it('loadLocalMonsterDetail 按 ID 加载详情 JSON', async () => {
    const api = await freshApi();
    const fixture = {
      id: 8013010, name: '虚卒·践踏者', icon: 'Monster_8013010',
      figure: 'Monster_8013010', rank: 'Elite', camp: '反物质军团',
      stance: 300, weak: ['Physical'], resist: { Fire: 0.2 },
      intro: '介绍', stats: { hp: 1, atk: 2, def: 3, speed: 4 },
      skills: [{ id: 801301001, name: '践踏', tag: '单攻' }],
    };
    const fetchMock = routeFetch({ 'monsters/8013010.json': fixture });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadLocalMonsterDetail('8013010')).resolves.toEqual(fixture);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/monsters/8013010.json');
  });

  it('详情加载器走四级缓存：同会话二次调用不重复请求（角色/光锥/怪物）', async () => {
    const api = await freshApi();
    const charFixture = { id: 1001, name: '阿姬' };
    const lcFixture = { id: 23003, name: '拂晓之前' };
    const monFixture = { id: 3011010, name: '虚卒' };
    const fetchMock = routeFetch({
      'characters/1001.json': charFixture,
      'light_cones/23003.json': lcFixture,
      'monsters/3011010.json': monFixture,
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadLocalCharacter('1001')).resolves.toEqual(charFixture);
    await expect(api.loadLocalCharacter('1001')).resolves.toEqual(charFixture);
    await expect(api.loadLocalLightConeDetail('23003')).resolves.toEqual(lcFixture);
    await expect(api.loadLocalMonsterDetail('3011010')).resolves.toEqual(monFixture);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 每个 cacheKey 仅一次网络请求
  });

  it('共享列表走单例：同会话二次调用不重复请求（items/monsters）', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({
      'items.json': [{ id: 23013, name: '星琼' }],
      'monsters.json': [{ id: 3011010, name: '虚卒' }],
    });
    vi.stubGlobal('fetch', fetchMock);
    await api.loadLocalItems();
    await api.loadLocalItems();
    await api.loadLocalMonsterList();
    await api.loadLocalMonsterList();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

/* ─── Spine 双清单解析（official 优先，缺失/失效回退 nanoka） ─── */

describe('resolveSpine', () => {
  const BASE = 'https://act-webstatic.mihoyo.com/puzzle/hkrpg/';
  /** 官方源清单（折叠格式） */
  const officialManifest = {
    version: 15,
    base: BASE,
    entries: {
      '1508': {
        kind: 'official',
        dir: 'pz_Devp46QZiu/resource/puzzle/2026/06/29/',
        atlas: 'd6219db1db381ca7deaed7868ba7eaa7_3205060559394643680.atlas',
        json: '25786df602b5a5fbf32f185f40676d73_1852508389443353702.json',
        textures: { 'TohsakaRin.png': '7eeeaa4d89f3ce6234b877102ed22486_800838663379293561.png' },
      },
      'home-bg': {
        kind: 'official-scene',
        viewport: { x: -960, y: -540, width: 1920, height: 1080 },
        layers: [
          { dir: 'pk1/d1/', atlas: 'bg.atlas', json: 'bg.json', textures: { '01_bg_pc.png': 'bg.png' } },
        ],
      },
    },
  };
  /** nanoka 源清单（仅 skel；与官方重叠的 key 为回退条目） */
  const nanokaManifest = {
    version: 15,
    entries: {
      '1005': { kind: 'skel', name: 'kafuka' },
      '1403': { kind: 'skel', name: 'bg|tibao1|tibao2|tibao3|tibaoqj' },
      '8009': { kind: 'skel', name: 'nan_42' },
    },
  };

  const route = (extra: Record<string, unknown> = {}) => routeFetch({
    'spine-manifest-official.json': officialManifest,
    'spine-manifest-nanoka.json': nanokaManifest,
    ...extra,
  });

  it('skel 条目（仅 nanoka 源）：普通名 / 多段跳过 bg / 不存在 → null', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('1005')).resolves.toEqual({ kind: 'skel', base: `${CDN}/assets/hsr/spine/1005/kafuka` });
    await expect(api.resolveSpine('1403')).resolves.toEqual({ kind: 'skel', base: `${CDN}/assets/hsr/spine/1403/tibao1` }); // 跳过 bg
    await expect(api.resolveSpine('9999')).resolves.toBeNull();
  });

  it('official 条目（官方源优先）：折叠格式展开为完整官网资源 URL', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('1508')).resolves.toEqual({
      kind: 'official',
      atlas: `${BASE}pz_Devp46QZiu/resource/puzzle/2026/06/29/d6219db1db381ca7deaed7868ba7eaa7_3205060559394643680.atlas`,
      json: `${BASE}pz_Devp46QZiu/resource/puzzle/2026/06/29/25786df602b5a5fbf32f185f40676d73_1852508389443353702.json`,
      textures: { 'TohsakaRin.png': `${BASE}pz_Devp46QZiu/resource/puzzle/2026/06/29/7eeeaa4d89f3ce6234b877102ed22486_800838663379293561.png` },
    });
  });

  it('官方源命中时不请求 nanoka 清单', async () => {
    const api = await freshApi();
    const fetchMock = route();
    vi.stubGlobal('fetch', fetchMock);
    await api.resolveSpine('1508');
    const called = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(called.some((u) => u.includes('spine-manifest-nanoka'))).toBe(false);
  });

  it('官方缺失 → 回退 nanoka 源（skel）', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('1005')).resolves.toEqual({ kind: 'skel', base: `${CDN}/assets/hsr/spine/1005/kafuka` });
  });

  it('强制 nanoka 源：resolveSpine(key, \'nanoka\') 忽略官方条目（渲染层失效回退用）', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('1508', 'nanoka')).resolves.toBeNull(); // 官方有而 nanoka 无
    await expect(api.resolveSpine('1005', 'nanoka')).resolves.toEqual({ kind: 'skel', base: `${CDN}/assets/hsr/spine/1005/kafuka` });
  });

  it('强制官方源：resolveSpine(key, \'official\') 未命中时不回退', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('1005', 'official')).resolves.toBeNull();
  });

  it('resolveSpineSource：官方优先 → nanoka → null', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpineSource('1508')).resolves.toBe('official');
    await expect(api.resolveSpineSource('1005')).resolves.toBe('nanoka');
    await expect(api.resolveSpineSource('9999')).resolves.toBeNull();
  });

  it('official-scene 场景条目（home-bg）：展开各层 URL', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.resolveSpine('home-bg')).resolves.toEqual({
      kind: 'official-scene',
      viewport: { x: -960, y: -540, width: 1920, height: 1080 },
      layers: [
        { atlas: `${BASE}pk1/d1/bg.atlas`, json: `${BASE}pk1/d1/bg.json`, textures: { '01_bg_pc.png': `${BASE}pk1/d1/bg.png` } },
      ],
    });
  });

  it('loadSpineSceneKeys：仅列出官方清单中的场景键', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    await expect(api.loadSpineSceneKeys()).resolves.toEqual(['home-bg']);
  });

  it('loadSpineManifests：双清单聚合（单源失败容错返回 null）', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route());
    const { official, nanoka } = await api.loadSpineManifests();
    expect(official?.entries['1508']).toBeDefined();
    expect(nanoka?.entries['1005']).toBeDefined();
    // 官方清单请求失败 → official 为 null，nanoka 不受影响（freshApi 重置内存缓存）
    const api2 = await freshApi();
    vi.stubGlobal('fetch', routeFetch({ 'spine-manifest-nanoka.json': nanokaManifest }));
    const partial = await api2.loadSpineManifests();
    expect(partial.official).toBeNull();
    expect(partial.nanoka?.entries['1005']).toBeDefined();
  });

  it('仅 bg 段 → 回退 parts[0]', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', route({
      'spine-manifest-nanoka.json': { version: 15, entries: { '1': { kind: 'skel', name: 'bg' } } },
    }));
    await expect(api.resolveSpine('1')).resolves.toEqual({ kind: 'skel', base: `${CDN}/assets/hsr/spine/1/bg` });
  });

  it('网络失败 → null（不抛出）', async () => {
    const api = await freshApi();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    await expect(api.resolveSpine('1005')).resolves.toBeNull();
  });
});

/* ─── 单例缓存：静态 JSON 只请求一次，失败后重试 ─── */

describe('单例缓存', () => {
  it('loadLocalRelicSets 多次调用只触发一次 fetch', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({ 'relics.json': [{ id: 1, name: '测试' }] });
    vi.stubGlobal('fetch', fetchMock);
    const [a, b] = await Promise.all([api.loadLocalRelicSets(), api.loadLocalRelicSets()]);
    expect(a).toBe(b); // 同一引用
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loadLocalCharacterList 失败后再次调用会重试', async () => {
    const api = await freshApi();
    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url: string) => {
      callCount++;
      if (callCount === 1) throw new Error('network down');
      return { ok: true, status: 200, text: async () => JSON.stringify([{ id: 1001, name: '角色' }]) };
    }));
    await expect(api.loadLocalCharacterList()).rejects.toThrow();
    const list = await api.loadLocalCharacterList();
    expect(list[0].name).toBe('角色');
    expect(callCount).toBe(2);
  });

  it('loadLocalLightCones 多次调用只触发一次 fetch', async () => {
    const api = await freshApi();
    const fetchMock = routeFetch({ 'light_cones.json': [{ id: 23001, name: '光锥' }] });
    vi.stubGlobal('fetch', fetchMock);
    await api.loadLocalLightCones();
    await api.loadLocalLightCones();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loadLocalVersion 返回游戏版本且多次调用只触发一次 fetch', async () => {
    const api = await freshApi();
    const versionFixture = {
      game_version: '4.4.0', version_label: '4.4', client: 'OSPRODWin4.4.0',
      build: 'D15909703_A15802547_L15874300', synced_at: '2026-07-29',
    };
    const fetchMock = routeFetch({ 'version.json': versionFixture });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api.loadLocalVersion()).resolves.toEqual(versionFixture);
    await api.loadLocalVersion();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
