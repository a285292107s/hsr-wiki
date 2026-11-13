import { describe, it, expect } from 'vitest';
import { buildCwSeason, type CwDomainStat } from '../use-cw-season';
import type { CatalogItem } from '../../catalog/types';

const LEDGER: CwDomainStat[] = [
  { key: 'portals', navKey: 'nav.cwPortal', href: '/currency/buff', season: 36, total: 120 },
  { key: 'equipment', navKey: 'nav.cwEquipment', href: '/currency/item', season: 174, total: 269 },
];

const roleOf = (id: string, over: Record<string, unknown> = {}): CatalogItem => ({
  id, name: `角色${id}`, is_season_new: true, ...over,
});

const traitOf = (id: string, over: Record<string, unknown> = {}): CatalogItem => ({
  id, name: `羁绊${id}`, is_season_new: true, cat: 'faction', ...over,
});

describe('buildCwSeason：赛季入册口径', () => {
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
    ], LEDGER);

    expect(season.roles.map((role) => role.name)).toEqual(['角色1001', '角色1003']);
    expect(season.traits.map((trait) => trait.id)).toEqual(['3001']);
  });

  it('字段缺失 / 非布尔真值都不算新增，且不退化成全量', () => {
    const season = buildCwSeason([
      { id: '1', name: '甲', is_season_new: 'true' } as unknown as CatalogItem,
      { id: '2', name: '乙', is_season_new: 1 } as unknown as CatalogItem,
    ], [
      { id: '10', name: '丁', is_season_new: 'true' } as unknown as CatalogItem,
    ], LEDGER);

    expect(season.roles).toEqual([]);
    expect(season.traits).toEqual([]);
  });

  it('totals 是全量档案数，不是新增数', () => {
    const season = buildCwSeason([
      roleOf('1'),
      roleOf('2', { is_season_new: false }),
    ], [
      traitOf('10'),
      { id: '11', name: '旧羁绊' } as CatalogItem,
    ], LEDGER);

    expect(season.totals).toEqual({ roles: 2, traits: 2 });
  });
});

describe('buildCwSeason：阿哈式费用变体归并', () => {
  it('同 avatar_id 的多条角色归成一张卡，变体逐个保留', () => {
    const season = buildCwSeason([
      roleOf('151112', { avatar_id: '1511', rarity: 4, front_back_type: 'Front' }),
      roleOf('151122', { avatar_id: '1511', rarity: 5, front_back_type: 'Front' }),
      roleOf('151132', { avatar_id: '1511', rarity: 5, front_back_type: 'Front' }),
      roleOf('1107', { avatar_id: '1107', rarity: 5 }),
    ], [], LEDGER);

    expect(season.roles).toHaveLength(2);
    const [aha] = season.roles;
    expect(aha.name).toBe('角色151112');
    expect(aha.cost).toBe(5);
    expect(aha.costs).toEqual([4, 5, 5]);
    expect(aha.variants.map((variant) => variant.id)).toEqual(['151112', '151122', '151132']);
    expect(aha.variants.map((variant) => variant.cost)).toEqual([4, 5, 5]);
  });

  it('没有 avatar_id 时按角色 id 各自成卡', () => {
    const season = buildCwSeason([roleOf('1001'), roleOf('1002')], [], LEDGER);
    expect(season.roles.map((role) => role.variants.length)).toEqual([1, 1]);
  });

  it('费用 / 站位分布按变体计数（阿哈三变体算三条）', () => {
    const season = buildCwSeason([
      roleOf('151112', { avatar_id: '1511', rarity: 4, front_back_type: 'Front' }),
      roleOf('151122', { avatar_id: '1511', rarity: 5, front_back_type: 'Front' }),
      roleOf('151132', { avatar_id: '1511', rarity: 5, front_back_type: 'Front' }),
      roleOf('1201', { avatar_id: '1201', rarity: 1, front_back_type: 'Back' }),
    ], [], LEDGER);

    expect(season.costDist).toEqual([
      { cost: 1, key: 'catalog.cost.1', count: 1 },
      { cost: 4, key: 'catalog.cost.4', count: 1 },
      { cost: 5, key: 'catalog.cost.5', count: 2 },
    ]);
    expect(season.posDist.map((row) => [row.key, row.count])).toEqual([
      ['catalog.position.front', 3],
      ['catalog.position.back', 1],
    ]);
  });
});

describe('buildCwSeason：羁绊分类与四件套', () => {
  it('按 cat 分三组，组内 seqCat 从 1 起且保持入参顺序', () => {
    const season = buildCwSeason([], [
      traitOf('100102', { cat: 'faction', name: '仙舟舰队' }),
      traitOf('200202', { cat: 'combat', name: '持续伤害' }),
      traitOf('100302', { cat: 'faction', name: '幻月游戏' }),
      traitOf('300602', { cat: 'special', name: '幻乐之主' }),
    ], LEDGER);

    expect(season.byCat.faction.map((trait) => [trait.name, trait.seqCat])).toEqual([
      ['仙舟舰队', 1],
      ['幻月游戏', 2],
    ]);
    expect(season.byCat.combat.map((trait) => trait.seqCat)).toEqual([1]);
    expect(season.byCat.special.map((trait) => trait.seqCat)).toEqual([1]);
    expect(season.traits.map((trait) => trait.seq)).toEqual([1, 2, 3, 4]);
  });

  it('package 三件映射为布尔；缺字段按全空处理', () => {
    const season = buildCwSeason([], [
      traitOf('100102', { package: { invite: 2101, stock: 2201, badge: null } }),
      traitOf('200202', {}),
    ], LEDGER);

    expect(season.traits[0]!.pkg).toEqual({ invite: true, stock: true, badge: false });
    expect(season.traits[1]!.pkg).toEqual({ invite: false, stock: false, badge: false });
  });

  it('packages 统计齐全 / 部分件', () => {
    const season = buildCwSeason([], [
      traitOf('1', { package: { invite: 1, stock: 2, badge: 3 } }),
      traitOf('2', { package: { invite: 1, stock: null, badge: null } }),
      traitOf('3', { package: { invite: null, stock: null, badge: 4 } }),
      traitOf('4', {}),
    ], LEDGER);

    expect(season.packages).toEqual({ invite: 2, stock: 1, badge: 2, complete: 1, partial: 2 });
  });

  it('品质档按层质量去重取文案键，去重后顺序跟随层顺序', () => {
    const season = buildCwSeason([], [
      traitOf('1', {
        layers: [{ quality: null }, { quality: 'Silver' }, { quality: 'Gold' }, { quality: 'Gold' }],
      }),
    ], LEDGER);

    expect(season.traits[0]!.layers).toBe(4);
    expect(season.traits[0]!.qualityKeys).toEqual(['catalog.quality.silver', 'catalog.quality.gold']);
  });

  it('carriers 从全量角色取（含非新增），并标注 isNew', () => {
    const season = buildCwSeason([
      { id: '1001', name: '旧角色', rarity: 3, traits: [{ id: 3001, name: '领航员' }] } as CatalogItem,
      { id: '1002', name: '新角色', is_season_new: true, rarity: 5, traits: [{ id: 3001, name: '领航员' }] },
    ], [
      traitOf('3001', { name: '领航员' }),
    ], LEDGER);

    expect(season.traits[0]!.carriers).toEqual([
      { id: '1001', name: '旧角色', isNew: false, cost: 3 },
      { id: '1002', name: '新角色', isNew: true, cost: 5 },
    ]);
  });

  it('角色羁绊 chip 的 isNew 只看该 id 是否属于本赛季新增羁绊', () => {
    const [role] = buildCwSeason([
      roleOf('1', { traits: [{ id: 3001, name: '领航员', cat: 'faction' }, { id: 2010, name: '旧羁绊', cat: 'combat' }] }),
    ], [
      traitOf('3001', { name: '领航员' }),
      traitOf('2010', { name: '旧羁绊', is_season_new: false }),
    ], LEDGER).roles;

    expect(role!.traits.map((chip) => [chip.id, chip.isNew, chip.cat])).toEqual([
      ['3001', true, 'faction'],
      ['2010', false, 'combat'],
    ]);
    expect(role!.traits[0]!.icon.endsWith('/3001.webp')).toBe(true);
  });

  it('desc 去噪：字面 \\n 换空格、连续空白折叠、首尾 trim', () => {
    const [trait] = buildCwSeason([], [
      traitOf('1', { simple_desc: '  首行\\n次行   多空格\\n\\n收尾  ' }),
    ], LEDGER).traits;

    expect(trait!.desc).toBe('首行 次行 多空格 收尾');
  });
});

describe('buildCwSeason：账房与元数据', () => {
  it('账房原样透传，每个域都带本赛季登记数与全量', () => {
    const season = buildCwSeason([], [], LEDGER);
    expect(season.ledger).toEqual(LEDGER);
    expect(season.ledger[1]!.season).toBe(174);
    expect(season.ledger[1]!.total).toBe(269);
  });

  it('赛季号 / 版本 / 同步日随元数据透传', () => {
    const season = buildCwSeason([], [], LEDGER, 2, { version: '4.7', syncedAt: '2026-11-10' });
    expect(season.seasonId).toBe(2);
    expect(season.version).toBe('4.7');
    expect(season.syncedAt).toBe('2026-11-10');
  });

  it('不修改入参', () => {
    const roles: CatalogItem[] = [roleOf('1', { avatar_id: '1', traits: [{ id: 3001, name: '领航员' }] })];
    const traits: CatalogItem[] = [traitOf('3001', { simple_desc: '甲\\n乙' })];
    const snapshot = JSON.stringify({ roles, traits });

    buildCwSeason(roles, traits, LEDGER);

    expect(JSON.stringify({ roles, traits })).toBe(snapshot);
  });
});
