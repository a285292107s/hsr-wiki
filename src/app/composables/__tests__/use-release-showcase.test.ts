// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildCwSeason,
  buildReleaseSections,
  buildReleaseSectionsBy,
  fillFeatureBriefs,
  pickCurrentVersion,
  splitSources,
  type CwSeason,
  type ReleaseSource,
  type ReleaseTagged,
} from '../use-release-showcase';
import type { CatalogItem } from '../../catalog/types';

const tag = (id: number, release_version?: string): ReleaseTagged => ({ id, release_version });

describe('splitSources（单源失败只丢该分区，但必须计数）', () => {
  it('全部成功 → 保持顺序、失败数 0', () => {
    expect(splitSources(['a', 'b', 'c'])).toEqual({ ok: ['a', 'b', 'c'], failed: 0 });
  });

  it('部分失败 → 保序丢弃 null，失败数 = null 个数（视图据此渲染「未取到」提示）', () => {
    expect(splitSources(['a', null, 'c'])).toEqual({ ok: ['a', 'c'], failed: 1 });
  });

  it('全失败 → ok 为空且失败数 = 源总数（视图据此渲染错误态，而不是「本版本暂无新增」）', () => {
    expect(splitSources([null, null, null])).toEqual({ ok: [], failed: 3 });
  });

  it('空数组（未来源被删空）→ 不把 0 个源误判成全失败', () => {
    expect(splitSources([])).toEqual({ ok: [], failed: 0 });
  });
});

describe('pickCurrentVersion', () => {
  it('只取 release_version 恰等于本版本的条目，保持入参顺序', () => {
    const list = [tag(1, '4.5'), tag(2, '4.6'), tag(3, '4.6'), tag(4, '4.4')];
    expect(pickCurrentVersion(list, '4.6').map((i) => i.id)).toEqual([2, 3]);
  });

  it('不做前缀 / 子串匹配（"4" 不等于 "4.6"）', () => {
    const list = [tag(1, '4.6'), tag(2, '4')];
    expect(pickCurrentVersion(list, '4').map((i) => i.id)).toEqual([2]);
    expect(pickCurrentVersion(list, '4.6').map((i) => i.id)).toEqual([1]);
  });

  it('本版本标签为空（version.json 缺失 / 无基线）→ 恒空，不把未打标条目当本版本', () => {
    const list = [tag(1, '4.6'), tag(2), tag(3, '')];
    expect(pickCurrentVersion(list, '')).toEqual([]);
    expect(pickCurrentVersion(list, '   ')).toEqual([]);
  });

  it('标签两端空白被忽略，且不修改入参', () => {
    const list = [tag(1, '4.6'), tag(2, ' 4.6 '), tag(3, undefined)];
    const snapshot = JSON.stringify(list);
    expect(pickCurrentVersion(list, ' 4.6 ').map((i) => i.id)).toEqual([1, 2]);
    expect(JSON.stringify(list)).toBe(snapshot);
  });
});

describe('buildReleaseSections', () => {
  const items: CatalogItem[] = [
    { id: '1503', name: '甲' },
    { id: '1001', name: '乙' },
  ];
  const renderCard = (item: CatalogItem, i: number): string =>
    `<a class="c" data-name="${String(item.name)}" style="--i:${i}"></a>`;

  const source = (
    kind: ReleaseSource['kind'],
    label: string,
    tagged: readonly ReleaseTagged[],
    list: readonly CatalogItem[] = items,
  ): ReleaseSource => ({ kind, label, listHref: `/${kind}`, tagged, items: list, renderCard });

  it('无本版本条目的分区不产出，顺序与入参一致', () => {
    const sections = buildReleaseSections([
      source('character', '角色', [tag(1503, '4.5')]),
      source('lightcone', '光锥', [tag(23055, '4.6')], [{ id: '23055', name: '丙' }]),
      source('relic', '遗器', [tag(133, '4.6'), tag(134, '4.6')], [
        { id: '133', name: '丁' },
        { id: '134', name: '戊' },
      ]),
    ], '4.6');
    expect(sections.map((s) => s.kind)).toEqual(['lightcone', 'relic']);
    expect(sections.map((s) => s.label)).toEqual(['光锥', '遗器']);
    expect(sections.map((s) => s.count)).toEqual([1, 2]);
  });

  it('三分区皆无增量 → 返回空数组（视图据此渲染唯一一行空态）', () => {
    const sections = buildReleaseSections([
      source('character', '角色', [tag(1503, '4.5')]),
      source('lightcone', '光锥', []),
      source('relic', '遗器', [tag(133, '4.0')]),
    ], '4.6');
    expect(sections).toEqual([]);
  });

  it('卡片 HTML 复用 renderCard，且 --i 按分区内显示顺序重排', () => {
    const sections = buildReleaseSections([
      source('relic', '遗器', [tag(134, '4.6'), tag(133, '4.6')], [
        { id: '133', name: '丁' },
        { id: '134', name: '戊' },
      ]),
    ], '4.6');
    expect(sections).toHaveLength(1);
    expect(sections[0].html).toBe(
      '<a class="c" data-name="丁" style="--i:0"></a><a class="c" data-name="戊" style="--i:1"></a>',
    );
  });

  it('fetchData 产物缺该 id（被目录自身规则过滤）→ 该分区不渲染空带', () => {
    const sections = buildReleaseSections([
      source('character', '角色', [tag(1503, '4.6')], [{ id: '1001', name: '乙' }]),
    ], '4.6');
    expect(sections).toEqual([]);
  });
});

describe('特写档判据 = 恰 1 条（≥2 条不再偏袒第一条）', () => {
  const items: CatalogItem[] = [
    { id: '1', name: '甲' },
    { id: '2', name: '乙' },
    { id: '3', name: '丙' },
  ];
  const renderCard = (item: CatalogItem, i: number): string =>
    `<a class="c" data-name="${String(item.name)}" style="--i:${i}"></a>`;
  const withLead = (tagged: readonly ReleaseTagged[]): ReleaseSource => ({
    kind: 'character', label: '角色', listHref: '/character', tagged, items, renderCard,
    leadMeta: (item) => ({ name: String(item.name), href: `/character/${item.id}` }),
  });

  it('恰 1 条 → 特写档，并带这一条的名字与入口（它在行右端承担排版权重与显式动作）', () => {
    const [s] = buildReleaseSections([withLead([tag(1, '4.6')])], '4.6');
    expect(s.feature).toBe(true);
    expect(s.count).toBe(1);
    expect(s.leadMeta).toEqual({ name: '甲', href: '/character/1' });
    expect(s.listHref).toBe('/character');
  });

  it('2 条及以上 → 平权卡带：不 feature、无 leadMeta（旧判据 count ≤ 2 会让第一条独占大名字与入口）', () => {
    for (const ids of [['1', '2'], ['1', '2', '3']]) {
      const [s] = buildReleaseSections([withLead(ids.map((id) => tag(Number(id), '4.6')))], '4.6');
      expect(s.feature, `${ids.length} 条不应进特写档`).toBe(false);
      expect(s.leadMeta, `${ids.length} 条不应有 leadMeta`).toBeUndefined();
      expect(s.listHref, `${ids.length} 条仍须带分区级入口`).toBe('/character');
      expect(s.count).toBe(ids.length);
      expect(s.html).toBe(items.slice(0, ids.length).map((it, i) => renderCard(it, i)).join(''));
    }
  });
});

describe('fillFeatureBriefs（特写档数据正文：与分区同批就绪，失败只丢正文）', () => {
  const renderCard = (item: CatalogItem, i: number): string =>
    `<a class="c" data-name="${String(item.name)}" style="--i:${i}"></a>`;
  const src = (over: Partial<ReleaseSource>): ReleaseSource => ({
    kind: 'character', label: '角色', listHref: '/character',
    tagged: [{ id: 1, release_version: '4.6' }],
    items: [{ id: '1', name: '甲' }],
    renderCard,
    leadMeta: (item) => ({ name: String(item.name), href: `/character/${item.id}` }),
    ...over,
  });

  it('特写档拿到正文 → 写入 leadMeta.brief；leadId 指向主条目', async () => {
    const [s] = buildReleaseSections([src({ loadBrief: async () => '<span class="hl">正文</span>' })], '4.6');
    expect(s.leadId).toBe('1');
    await fillFeatureBriefs([src({ loadBrief: async () => '<span class="hl">正文</span>' })], [s]);
    expect(s.leadMeta?.brief).toBe('<span class="hl">正文</span>');
  });

  it('平权档（非 feature）不取正文；loadBrief 缺失（CW 源）为 no-op', async () => {
    const sections = buildReleaseSectionsBy([
      src({ tagged: [{ id: 1, release_version: '4.6' }, { id: 2, release_version: '4.6' }], items: [{ id: '1', name: '甲' }, { id: '2', name: '乙' }], loadBrief: async () => 'X' }),
    ], (list) => list);
    expect(sections[0].feature).toBe(false);
    const snapshot = JSON.stringify(sections);
    await fillFeatureBriefs([], sections);
    expect(JSON.stringify(sections)).toBe(snapshot);
  });

  it('正文抛错 / 返回空串 → 规格块保底名字+入口，不抛出', async () => {
    const [failSec] = buildReleaseSections([src({ loadBrief: async () => { throw new Error('net'); } })], '4.6');
    await expect(fillFeatureBriefs([src({ loadBrief: async () => { throw new Error('net'); } })], [failSec])).resolves.toBeUndefined();
    expect(failSec.leadMeta?.brief).toBeUndefined();
    expect(failSec.leadMeta?.name).toBe('甲');

    const [emptySec] = buildReleaseSections([src({ loadBrief: async () => '' })], '4.6');
    await fillFeatureBriefs([src({ loadBrief: async () => '' })], [emptySec]);
    expect(emptySec.leadMeta?.brief).toBeUndefined();
  });
});

describe('buildCwSeason（本赛季新增账：角色 + 羁绊 + 档案存量）', () => {
  const roleOf = (id: string, over: Record<string, unknown> = {}): CatalogItem => ({
    id, name: `角色${id}`, is_season_new: true, ...over,
  });
  const traitOf = (id: string, over: Record<string, unknown> = {}): CatalogItem => ({
    id, name: `羁绊${id}`, is_season_new: true, ...over,
  });

  it('只收 is_season_new === true，顺序与入参一致', () => {
    const season = buildCwSeason([
      roleOf('1001'),
      roleOf('1002', { is_season_new: false }),
      roleOf('1003'),
      { id: '1004', name: '旧角色' } as CatalogItem,
    ], [
      traitOf('3001'),
      traitOf('3002', { is_season_new: false }),
      { id: '3003', name: '旧羁绊' } as CatalogItem,
    ]);
    expect(season.roles.map((r) => r.id)).toEqual(['1001', '1003']);
    expect(season.traits.map((t) => t.id)).toEqual(['3001']);
  });

  it('字段缺失 / 非布尔真值（"true" / 1）都不算新增，且不退化成全量', () => {
    const season = buildCwSeason([
      { id: '1', name: '甲', is_season_new: 'true' } as unknown as CatalogItem,
      { id: '2', name: '乙', is_season_new: 1 } as unknown as CatalogItem,
      { id: '3', name: '丙' } as CatalogItem,
    ], [
      { id: '10', name: '丁', is_season_new: 'true' } as unknown as CatalogItem,
    ]);
    expect(season.roles).toEqual([]);
    expect(season.traits).toEqual([]);
  });

  it('totals = 入参全量档案数（不是新增数，也不是新增条目的派生）', () => {
    const season = buildCwSeason([
      roleOf('1'),
      roleOf('2', { is_season_new: false }),
      { id: '3', name: '丙' } as CatalogItem,
    ], [
      traitOf('10'),
      { id: '11', name: '旧羁绊' } as CatalogItem,
    ]);
    expect(season.totals).toEqual({ roles: 3, traits: 2 });
    expect(season.roles).toHaveLength(1);
  });

  it('角色字段映射：rarity→cost/costKey、front_back_type→positionKey、charge_type→{key,text}', () => {
    const [card] = buildCwSeason([roleOf('1510', {
      href: '/currency/role/1510', rarity: 3, front_back_type: 'Front', charge_type: ['Speed', 'XX'],
    })], []).roles;
    expect(card.href).toBe('/currency/role/1510');
    expect(card.cost).toBe(3);
    expect(card.costKey).toBe('catalog.cost.3');
    expect(card.positionKey).toBe('catalog.position.front');
    expect(card.charges.map((c) => c.text)).toEqual(['Speed', 'XX']);
    expect(card.charges.map((c) => c.key)).toEqual(['catalog.charge.speed', undefined]);
  });

  it('枚举缺键：无 rarity → cost 0 且无 costKey；无 front_back_type / charge_type → 留空（不落 undefined 键文案）', () => {
    const [card] = buildCwSeason([roleOf('1')], []).roles;
    expect(card.cost).toBe(0);
    expect(card.costKey).toBeUndefined();
    expect(card.positionKey).toBeUndefined();
    expect(card.charges).toEqual([]);
  });

  it('角色 traits 映射为 chip：isNew 只看该 id 属于本赛季新增羁绊；icon 按 id 派生', () => {
    const [card] = buildCwSeason([
      roleOf('1', {
        traits: [{ id: 3001, name: '领航员' }, { id: 2010, name: '旧羁绊' }],
      }),
    ], [
      traitOf('3001', { name: '领航员' }),
      traitOf('2010', { name: '旧羁绊', is_season_new: false }),
    ]).roles;
    expect(card.traits.map(({ id, name, isNew }) => ({ id, name, isNew }))).toEqual([
      { id: '3001', name: '领航员', isNew: true },
      { id: '2010', name: '旧羁绊', isNew: false },
    ]);
    for (const chip of card.traits) {
      expect(chip.icon.endsWith(`/${chip.id}.webp`), `${chip.id} 的 chip 图标应按 id 派生`).toBe(true);
    }
  });

  it('carriers 从全量角色（含非新增）里取持有者，isNew 标注该角色是否本赛季新增；顺序跟随角色入参', () => {
    const season = buildCwSeason([
      { id: '1001', name: '旧角色', traits: [{ id: 3001, name: '领航员' }] } as CatalogItem,
      { id: '1002', name: '新角色', is_season_new: true, traits: [{ id: 3001, name: '领航员' }] },
      {
        id: '1003', name: '旧角色2', is_season_new: false,
        traits: [{ id: 3001, name: '领航员' }, { id: 3003, name: '往期羁绊' }],
      },
    ], [
      traitOf('3001', { name: '领航员' }),
      traitOf('3002', { name: '孤羁绊' }),
      traitOf('3003', { name: '往期羁绊', is_season_new: false }),
    ]);
    const byId = new Map(season.traits.map((t) => [t.id, t]));
    expect(byId.get('3001')!.carriers).toEqual([
      { id: '1001', name: '旧角色', isNew: false },
      { id: '1002', name: '新角色', isNew: true },
      { id: '1003', name: '旧角色2', isNew: false },
    ]);
    expect(byId.get('3002')!.carriers, '无人持有 → 空数组（视图据此不渲染关联角色行）').toEqual([]);
  });

  it('desc 去噪：字面 \\n 换空格、连续空白折叠、首尾 trim', () => {
    const [trait] = buildCwSeason([], [
      traitOf('3001', { simple_desc: '  首行\\n次行   多空格\\n\\n收尾  ' }),
    ]).traits;
    expect(trait.desc).toBe('首行 次行 多空格 收尾');
  });

  it('不修改入参（角色 / 羁绊两侧 JSON 快照一致）', () => {
    const roles: CatalogItem[] = [roleOf('1', { traits: [{ id: 3001, name: '领航员' }] }), roleOf('2')];
    const traits: CatalogItem[] = [traitOf('3001', { simple_desc: '甲\\n乙' }), traitOf('3002')];
    const snapshot = JSON.stringify({ roles, traits });
    const season: CwSeason = buildCwSeason(roles, traits);
    expect(season.roles).toHaveLength(2);
    expect(JSON.stringify({ roles, traits })).toBe(snapshot);
  });
});
