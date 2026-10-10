// @vitest-environment node
/**
 * local.ts（本地数据取数 + 令牌解析）契约测试。
 *
 * 模块级状态（请求缓存 / 单例槽位 / 语言包槽位）用 `vi.resetModules()` + 动态 import 隔离。
 * 覆盖两个方向：**未令牌化**结构层零语言包请求（迁移期与语言无关数据），**已令牌化**结构层按语言取包并解析。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

const DATA = '/data/cn/characters.json';
const PACK_CN = '/data/i18n/cn/characters.json';
const PACK_EN = '/data/i18n/en/characters.json';

/** 按 URL 片段路由的 fetch 桩；未登记的路径返回 404。 */
function routedFetch(routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const hit = Object.keys(routes).find((k) => url.includes(k));
    if (!hit) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => JSON.stringify(routes[hit]) };
  });
}

async function fresh() {
  vi.resetModules();
  const local = await import('../api/local');
  const pack = await import('../i18n/pack');
  const active = await import('../../lib/i18n/active');
  active.resetActiveLocale();
  pack.resetTextPacks();
  return { local, pack, active };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadLocalJSON：未令牌化结构层（迁移期 / 语言无关数据）', () => {
  it('原样返回且不发语言包请求', async () => {
    const { local } = await fresh();
    const body = { name: '三月七', tags: ['冰'], n: 1 };
    const fetchMock = routedFetch({ [DATA]: body });
    vi.stubGlobal('fetch', fetchMock);

    await expect(local.loadLocalJSON(DATA.replace('/data/cn/', ''), 'char_1001')).resolves.toEqual(body);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(DATA);
  });
});

describe('loadLocalJSON：已令牌化结构层', () => {
  it('取当前语言的语言包并解析令牌', async () => {
    const { local } = await fresh();
    const fetchMock = routedFetch({
      [DATA]: { name: '$t:111', tags: ['$t:222', 'plain'] },
      [PACK_CN]: { '111': '三月七', '222': '冰' },
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(local.loadLocalJSON(DATA.replace('/data/cn/', ''), 'char_1001')).resolves.toEqual({
      name: '三月七',
      tags: ['冰', 'plain'],
    });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([DATA, PACK_CN]);
  });

  it('按当前语言取对应语言包（切换语言即换路径）', async () => {
    const { local, active } = await fresh();
    const fetchMock = routedFetch({
      [DATA]: { name: '$t:111' },
      [PACK_EN]: { '111': 'March 7th' },
    });
    vi.stubGlobal('fetch', fetchMock);
    active.setActiveLocale('en');

    await expect(local.loadLocalJSON(DATA.replace('/data/cn/', ''), 'char_1001')).resolves.toEqual({
      name: 'March 7th',
    });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual([DATA, PACK_EN]);
  });

  it('语言包缺键 → NkError（不静默漏字）', async () => {
    const { local } = await fresh();
    vi.stubGlobal('fetch', routedFetch({
      [DATA]: { name: '$t:999' },
      [PACK_CN]: { '111': '三月七' },
    }));
    await expect(local.loadLocalJSON(DATA.replace('/data/cn/', ''), 'char_1001')).rejects.toMatchObject({
      name: 'NkError',
      message: expect.stringContaining('999'),
    });
  });

  it('同一 (语言, 分组) 的包只取一次（多文件共享）', async () => {
    const { local } = await fresh();
    const fetchMock = routedFetch({
      '/data/cn/characters/1001.json': { name: '$t:111' },
      '/data/cn/characters/1002.json': { name: '$t:222' },
      [PACK_CN]: { '111': '三月七', '222': '丹恒' },
    });
    vi.stubGlobal('fetch', fetchMock);

    await local.loadLocalJSON('characters/1001.json', 'char_1001');
    await local.loadLocalJSON('characters/1002.json', 'char_1002');
    expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/i18n/'))).toHaveLength(1);
  });
});

describe('singletonLocalData', () => {
  it('并发/重复调用只请求一次', async () => {
    const { local } = await fresh();
    const body = [{ id: 1001, name: '$t:111' }];
    const fetchMock = routedFetch({
      [DATA]: body,
      [PACK_CN]: { '111': '三月七' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const load = local.singletonLocalData<unknown>('characters.json');
    const [a, b] = await Promise.all([load(), load()]);
    await load();
    expect(a).toEqual([{ id: 1001, name: '三月七' }]);
    expect(b).toEqual(a);
    expect(fetchMock.mock.calls.filter((c) => String(c[0]) === DATA)).toHaveLength(1);
  });

  it('切换语言后槽位重建（不返回上一语言的数据）', async () => {
    const { local, active } = await fresh();
    const fetchMock = routedFetch({
      [DATA]: { name: '$t:111' },
      [PACK_CN]: { '111': '三月七' },
      [PACK_EN]: { '111': 'March 7th' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const load = local.singletonLocalData<{ name: string }>('characters.json');
    await expect(load()).resolves.toEqual({ name: '三月七' });
    active.setActiveLocale('en');
    await expect(load()).resolves.toEqual({ name: 'March 7th' });
  });
});
