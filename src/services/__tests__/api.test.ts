/**
 * api.ts API 层测试
 * 内联 fixture 参照 cdn-samples 真实结构（manifest / spine manifest 的 "bg|a|b" 多段格式）。
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
      if (u.includes(k)) return { ok: true, status: 200, json: async () => v };
    }
    return { ok: false, status: 404, json: async () => ({}) };
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
});

/* ─── Spine 清单解析 ─── */

describe('resolveSpineName', () => {
  it('普通名 / 多段跳过 bg / 不存在 → null', async () => {
    const api = await freshApi();
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
