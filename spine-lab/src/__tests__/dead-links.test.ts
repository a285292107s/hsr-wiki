/**
 * dead-links.ts 死链审核引擎纯函数测试
 * 仅测纯逻辑（URL 收集 / 缓存计划 / 探测分类 / 队列并发）；真实网络探测由审核台人工运行。
 * URL 断言与真实构造函数输出比对（引擎与 Node 版 tools/dead-links.test.ts 同源）。
 */
import { describe, expect, it, vi } from 'vitest';
import {
  CacheFile,
  collectUrls,
  computeSourceHashes,
  domainOf,
  planProbe,
  prepareAudit,
  probeUrl,
  runAudit,
  sha1Hex,
  type DataMap,
} from '../dead-links';
import {
  avatarDrawCardUrl,
  avatarShopIconUrl,
  eidolonIconUrl,
  elementIconUrl,
  gridFightEquipIconUrl,
  gridFightEquipIconWithFallback,
  gridFightIconUrl,
  gridFightTraitIconById,
  gridFightTraitIconUrl,
  iconUrl,
  itemIconUrl,
  lightconeIconUrl,
  monsterFigureUrl,
  monsterIconUrl,
  pathIconUrl,
  skillIconUrl,
} from '../../../src/lib/icons';
import { SLOT_INDEX } from '../../../src/lib/constants';
import { cdnUri } from '../../../src/services/cdn';

/** mock 数据覆盖 collectUrls 全部来源分支（字段结构与 converter 输出对齐） */
function mockData(): DataMap {
  return {
    'characters.json': [{ id: 1001, element: 'Ice', path: 'Knight' }],
    'characters/1001.json': {
      skills: {
        '100101': { type: 'Normal', icon: 'SkillIcon_1001_Normal.png' },
        '100103': { type: 'Ultra', icon: '' },
      },
      ranks: { '1': { icon: 'icon/skill/Avatar/1001/SkillIcon_1001_Rank1.png' } },
      extra: { abilities: { a: { icon: 'SpriteOutput/AvatarSkill/1001/AbilityIcon.png', name: '冰刻箭雨' } } },
      skin: { url: 'https://act-webstatic.mihoyo.com/puzzle/skin/1001.png' },
    },
    'light_cones.json': [{ id: 20000, path: 'Rogue' }],
    'monsters.json': [{ id: 1002011, icon: 'SpriteOutput/MosterIcon/Monster_1002011.png' }],
    'monsters/1002011.json': { id: 1002011, figure: 'Monster_1002011', icon: 'Monster_1002011' },
    'items.json': [
      { id: 1, icon: 'icon/items/1.png', figure_icon: 'icon/items/2.png' },
    ],
    'maze.json': { '100001': { id: 100001, icon: 'icon/items/3.png' } },
    'relics.json': [{ id: 101, icon: 'icon/relics/101.png', icon_figure: 'icon/relics/102.png' }],
    'currency/equipment.json': { items: [{ id: 350101, icon: 'SpriteOutput/GridFight/Equipment/350101.png' }] },
    'currency/augments.json': { augments: [{ id: 1, icon: 'SpriteOutput/GridFight/GridItem/Box1.png' }] },
    'currency/portals.json': { portals: [{ id: 1, icon: 'SpriteOutput/GridFight/Portal/1.png' }] },
    'currency/traits.json': { traits: [{ id: 1001, icon: 'SpriteOutput/TraitIcon/Icon/1001.png' }] },
    'currency/role.json': { roles: [{ id: 1001, avatar_id: 1001 }] },
    'currency/role/1001.json': {
      avatar_id: 1001,
      rank: [{ rank: 1, icon: 'SpriteOutput/AvatarRankIcon/1001.png' }],
      equipment: [{ equipment_id: 350101, icon: 'SpriteOutput/GridFight/Equipment/350101.png' }],
      traits: [{ id: 1001, icon: 'SpriteOutput/TraitIcon/Icon/1001.png' }],
    },
  };
}

describe('collectUrls', () => {
  it('角色：目录卡片 + 详情（技能/星魂/附加能力）', () => {
    const urls = collectUrls(mockData());
    expect(urls.get(avatarShopIconUrl(1001))).toBe('characters.json#1001.avatar');
    expect(urls.get(avatarDrawCardUrl(1001))).toBe('characters.json#1001.drawcard');
    expect(urls.get(elementIconUrl('Ice'))).toBe('characters.json#1001.element');
    expect(urls.get(pathIconUrl('Knight'))).toBe('characters.json#1001.path');
    // 技能：SkillIcon 字段优先
    expect(urls.has(skillIconUrl({ type: 'Normal', icon: 'SkillIcon_1001_Normal.png' } as never, '1001', null))).toBe(true);
    // 星魂：展示图标 + buff 栏 icon（legacy 短路径）
    expect(urls.get(eidolonIconUrl('1001', '1'))).toBe('characters/1001.json#rank1');
    expect(urls.has(iconUrl('icon/skill/Avatar/1001/SkillIcon_1001_Rank1.png'))).toBe(true);
    // 附加能力
    expect(urls.has(iconUrl('SpriteOutput/AvatarSkill/1001/AbilityIcon.png'))).toBe(true);
  });

  it('光锥 / 怪物 / 物品 / 遗器 / 货币战争：与构造函数输出一致', () => {
    const urls = collectUrls(mockData());
    expect(urls.has(lightconeIconUrl(20000))).toBe(true);
    expect(urls.get(monsterIconUrl('SpriteOutput/MosterIcon/Monster_1002011.png'))).toBe('monsters.json#1002011.icon');
    expect(urls.has(monsterIconUrl('Monster_1002011'))).toBe(true);
    expect(urls.has(monsterFigureUrl('Monster_1002011'))).toBe(true);
    expect(urls.has(itemIconUrl('icon/items/1.png'))).toBe(true);
    expect(urls.has(itemIconUrl('icon/items/3.png'))).toBe(true); // maze 终局奖励
    expect(urls.has(gridFightEquipIconUrl('SpriteOutput/GridFight/Equipment/350101.png'))).toBe(true);
    expect(urls.has(gridFightIconUrl('SpriteOutput/GridFight/GridItem/Box1.png'))).toBe(true);
    expect(urls.has(gridFightTraitIconUrl('SpriteOutput/TraitIcon/Icon/1001.png'))).toBe(true);
    expect(urls.has(gridFightEquipIconWithFallback('SpriteOutput/GridFight/Equipment/350101.png', 350101))).toBe(true);
    expect(urls.has(gridFightTraitIconById(1001))).toBe(true);
  });

  it('遗器：部位图标按 SLOT_INDEX 全量枚举（SLOT_ICONS 不含 HEAD/HAND，无独立图标）', () => {
    const urls = collectUrls(mockData());
    expect(urls.has(cdnUri('relicfigures', `IconRelic_101_${SLOT_INDEX['FOOT']}.webp`))).toBe(true);
    expect(urls.has(cdnUri('relicfigures', `IconRelic_101_${SLOT_INDEX['OBJECT']}.webp`))).toBe(true);
    expect(urls.size).toBeGreaterThan(20);
  });

  it('https 绝对 URL 全量扫描（皮肤图等，来源标签为 文件#直接键）', () => {
    const urls = collectUrls(mockData());
    // scanAbs 递归时来源标签只记直接键（'skin.url' 记作 'url'），与 Node 版一致
    expect(urls.get('https://act-webstatic.mihoyo.com/puzzle/skin/1001.png')).toBe('characters/1001.json#url');
  });

  it('损坏/空文件不抛错，详情 URL 回落目录来源', () => {
    const data = mockData();
    data['monsters/1002011.json'] = null;
    data['characters/1001.json'] = { skills: null, ranks: null };
    expect(() => collectUrls(data)).not.toThrow();
    const urls = collectUrls(data);
    // 详情文件为 null 时无 figure URL；icon URL 仍由 monsters.json（同 URL 去重）提供
    expect(urls.has(monsterFigureUrl('Monster_1002011'))).toBe(false);
    expect(urls.get(monsterIconUrl('Monster_1002011'))).toBe('monsters.json#1002011.icon');
  });
});

describe('domainOf', () => {
  it('按域名分类', () => {
    expect(domainOf('https://cdn.jsdelivr.net/gh/x/a.png')).toBe('jsdelivr');
    expect(domainOf('https://static.nanoka.cc/assets/hsr/a.webp')).toBe('nanoka');
    expect(domainOf('https://act-webstatic.mihoyo.com/a.png')).toBe('other');
  });
});

describe('planProbe（缓存复用判定）', () => {
  const now = Date.now();
  const urls = new Map([
    ['https://cdn.jsdelivr.net/a.png', 'characters.json#1001.avatar'],
    ['https://cdn.jsdelivr.net/b.png', 'characters.json#1001.drawcard'],
    ['https://static.nanoka.cc/c.webp', 'currency/equipment.json#1'],
  ]);

  it('空缓存 → 全部待测', () => {
    const p = planProbe(urls, null, {}, now, false);
    expect(p.toProbe.length).toBe(3);
    expect(p.reuseCount).toBe(0);
  });

  it('fresh + 来源 hash 未变 → 复用；hash 变化 → 重测', () => {
    const cache: CacheFile = {
      sourceHashes: { 'characters.json': 'old-hash', 'currency/equipment.json': 'eq-hash' },
      entries: {
        'https://cdn.jsdelivr.net/a.png': { status: 'ok', ts: now - 1000 },
        'https://cdn.jsdelivr.net/b.png': { status: 'dead', ts: now - 1000 },
        'https://static.nanoka.cc/c.webp': { status: 'ok', ts: now - 1000 },
      },
    };
    const p = planProbe(urls, cache, { 'characters.json': 'old-hash', 'currency/equipment.json': 'eq-hash' }, now, false);
    expect(p.reuseCount).toBe(3);
    expect(p.toProbe).toEqual([]);
    expect(p.results['https://cdn.jsdelivr.net/b.png'].status).toBe('dead'); // 死链也复用（防反复回源）

    const changed = planProbe(urls, cache, { 'characters.json': 'NEW-hash', 'currency/equipment.json': 'eq-hash' }, now, false);
    expect(changed.toProbe).toContain('https://cdn.jsdelivr.net/a.png');
    expect(changed.toProbe).toContain('https://cdn.jsdelivr.net/b.png');
    expect(changed.toProbe).not.toContain('https://static.nanoka.cc/c.webp');
  });

  it('env 短缓存（1 天）与 ok 长缓存（7 天）', () => {
    const cache: CacheFile = {
      sourceHashes: { 'characters.json': 'h' },
      entries: {
        'https://cdn.jsdelivr.net/a.png': { status: 'env', ts: now - 2 * 24 * 3600 * 1000 }, // 过期
        'https://cdn.jsdelivr.net/b.png': { status: 'ok', ts: now - 5 * 24 * 3600 * 1000 }, // 有效
      },
    };
    const p = planProbe(urls, cache, { 'characters.json': 'h' }, now, false);
    expect(p.toProbe).toContain('https://cdn.jsdelivr.net/a.png');
    expect(p.reuseCount).toBe(1);
  });

  it('force → 无视缓存全部重测', () => {
    const cache: CacheFile = {
      sourceHashes: {},
      entries: { 'https://cdn.jsdelivr.net/a.png': { status: 'ok', ts: now } },
    };
    const p = planProbe(urls, cache, {}, now, true);
    expect(p.reuseCount).toBe(0);
    expect(p.toProbe.length).toBe(3);
  });
});

describe('probeUrl', () => {
  const mkFetch = (responses: Array<{ status: number } | Error>): typeof fetch =>
    (async () => {
      const next = responses.shift();
      if (next instanceof Error) throw next;
      // 断言调用次数与 responses 匹配（超出则按 500 处理，避免类型 undefined）
      return { ok: (next?.status ?? 500) >= 200 && (next?.status ?? 500) < 300, status: next?.status ?? 500 } as Response;
    }) as unknown as typeof fetch;

  const noSleep = async (): Promise<void> => {};

  it('2xx → ok；404 → dead（一次即定，无二次确认）', async () => {
    const fetchSpy = vi.fn(mkFetch([{ status: 200 }]));
    expect(await probeUrl('u', fetchSpy as never, noSleep)).toBe('ok');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(await probeUrl('u', mkFetch([{ status: 404 }]), noSleep)).toBe('dead');
  });

  it('429/503 退避重试后成功 → ok；三次仍限流 → env', async () => {
    const sleepMock = vi.fn(noSleep);
    expect(await probeUrl('u', mkFetch([{ status: 429 }, { status: 503 }, { status: 200 }]), sleepMock)).toBe('ok');
    expect(sleepMock).toHaveBeenCalledTimes(2); // 两次退避
    expect(await probeUrl('u', mkFetch([{ status: 429 }, { status: 429 }, { status: 429 }]), noSleep)).toBe('env');
  });

  it('403 / 网络错误 → env（不判失败）', async () => {
    expect(await probeUrl('u', mkFetch([{ status: 403 }]), noSleep)).toBe('env');
    expect(await probeUrl('u', mkFetch([new TypeError('CORS 拦截')]), noSleep)).toBe('env');
  });
});

describe('runAudit（并发与停止）', () => {
  const target = Array.from({ length: 20 }, (_, i) => `https://cdn.jsdelivr.net/x/${i}.png`);

  it('并发峰值不超过设定值（jsDelivr 限流硬上限）', async () => {
    let inflight = 0;
    let maxInflight = 0;
    const fetchImpl = (async () => {
      inflight++;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((r) => setTimeout(r, 5));
      inflight--;
      return { ok: true, status: 200 } as Response;
    }) as unknown as typeof fetch;

    const results: string[] = [];
    await runAudit(target, 3, { stopped: false, paused: false }, { onResult: (u, s) => results.push(`${u}:${s}`) }, fetchImpl);
    expect(maxInflight).toBeLessThanOrEqual(3);
    expect(results.length).toBe(20);
    expect(results.every((r) => r.endsWith(':ok'))).toBe(true);
  });

  it('stop 置位后队列立即退出（在途 worker 断出）', async () => {
    const fetchImpl = (async () => {
      await new Promise((r) => setTimeout(r, 10));
      return { ok: true, status: 200 } as Response;
    }) as unknown as typeof fetch;
    const control = { stopped: false, paused: false };
    const seen: string[] = [];
    const run = runAudit(target, 3, control, { onResult: (u) => seen.push(u) }, fetchImpl);
    setTimeout(() => { control.stopped = true; }, 30);
    await run;
    expect(seen.length).toBeLessThan(20); // 中途停止，未探测全部
  });

  it('暂停挂起队列，恢复后继续', async () => {
    const fetchImpl = (async () => {
      await new Promise((r) => setTimeout(r, 5)); // 每探测 5ms，确保暂停时序有效
      return { ok: true, status: 200 } as Response;
    }) as unknown as typeof fetch;
    const control = { stopped: false, paused: false };
    let done = 0;
    const run = runAudit(target, 1, control, { onResult: () => done++ }, fetchImpl);
    setTimeout(() => { control.paused = true; }, 30);
    setTimeout(() => {
      const mid = done;
      setTimeout(() => {
        expect(done).toBe(mid); // 暂停期间无新结果
        control.paused = false;
      }, 120);
    }, 100);
    await run;
    expect(done).toBe(20);
  });
});

describe('prepareAudit（数据加载 + 内容签名）', () => {
  it('清单驱动加载 → URL 集合 + sourceHashes', async () => {
    const files: Record<string, string> = {
      'characters.json': JSON.stringify([{ id: 1001, element: 'Ice', path: 'Knight' }]),
      'characters/1001.json': JSON.stringify({ skills: { '100101': { type: 'Normal', icon: 'SkillIcon_1001_Normal.png' } }, ranks: {}, extra: {} }),
    };
    const fetchImpl = (async (input: string | URL | Request) => {
      const rel = String(input).replace('/data/cn/', '');
      if (rel === 'data-file-index.json') {
        return { ok: true, json: async () => Object.keys(files) } as unknown as Response;
      }
      const text = files[rel];
      return { ok: text !== undefined, text: async () => text ?? '' } as unknown as Response;
    }) as unknown as typeof fetch;
    const sha1 = vi.fn(async (t: string) => `sha1:${t.length}`);

    const result = await prepareAudit({ fetchImpl, sha1Impl: sha1 });
    expect(result.dataFileCount).toBe(2);
    expect(result.urls.has(avatarShopIconUrl(1001))).toBe(true);
    // sha1 对来源文件文本（与 Node 版 readFileSync 字节一致）计算
    expect(result.sourceHashes['characters.json']).toBe(`sha1:${files['characters.json'].length}`);
    expect(sha1).toHaveBeenCalledWith(files['characters.json']);
  });

  it('清单为空 → 报错', async () => {
    const fetchImpl = (async () => ({ ok: true, json: async () => [] }) as unknown as Response) as unknown as typeof fetch;
    await expect(prepareAudit({ fetchImpl, sha1Impl: async () => 'x' })).rejects.toThrow('数据文件清单为空');
  });
});

describe('sha1Hex 与 Node createHash 一致', () => {
  it('UTF-8 字节 SHA-1 与 Node 端等价（浏览器/Node 缓存可互认；期望值 = Node createHash 输出）', async () => {
    expect(await sha1Hex('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(await sha1Hex('{"id":1001,"name":"三月七"}')).toBe('f665584a4f43aeb2c717ea1990a2b3d799d4a76a');
  });
});

describe('computeSourceHashes', () => {
  it('仅对引用的来源文件计算，缺失文件标记 unreadable', async () => {
    const urls = new Map([
      ['https://cdn.jsdelivr.net/a.png', 'characters.json#x'],
      ['https://static.nanoka.cc/b.webp', 'currency/equipment.json#y'],
      ['https://act-webstatic.mihoyo.com/c.png', 'field-value'], // 非 JSON 来源忽略
    ]);
    const texts = new Map<string, string>([['characters.json', 'a'], ['currency/equipment.json', 'b']]);
    const sha1 = async (t: string) => `H(${t})`;
    expect(await computeSourceHashes(urls, texts, sha1)).toEqual({
      'characters.json': 'H(a)',
      'currency/equipment.json': 'H(b)',
    });
    const missing = new Map<string, string>([['characters.json', 'a']]);
    expect(await computeSourceHashes(urls, missing, sha1)).toEqual({
      'characters.json': 'H(a)',
      'currency/equipment.json': 'unreadable',
    });
  });
});
