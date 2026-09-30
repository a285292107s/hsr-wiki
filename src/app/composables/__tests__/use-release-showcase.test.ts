import { describe, expect, it } from 'vitest';
import {
  buildReleaseSections,
  buildReleaseSectionsBy,
  pickCurrentVersion,
  pickSeasonNew,
  type ReleaseSource,
  type ReleaseTagged,
} from '../use-release-showcase';
import type { CatalogItem } from '../../catalog/types';

const tag = (id: number, release_version?: string): ReleaseTagged => ({ id, release_version });

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
  ): ReleaseSource => ({ kind, label, tagged, items: list, renderCard });

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

describe('pickSeasonNew', () => {
  const season = (id: number, is_season_new?: boolean): ReleaseTagged => ({ id, is_season_new });

  it('只取 is_season_new === true 的条目，保持入参顺序', () => {
    const list = [season(1, true), season(2, false), season(3, true), season(4)];
    expect(pickSeasonNew(list).map((i) => i.id)).toEqual([1, 3]);
  });

  it('字段缺失（未打标 / *Old 代际表缺失）一律视为 false，禁止退化为全量新增', () => {
    const list = [season(1), season(2), season(3, false)];
    expect(pickSeasonNew(list)).toEqual([]);
  });

  it('只认布尔 true（真值串 / 1 不算新增）', () => {
    const list = [{ id: 1, is_season_new: 'true' }, { id: 2, is_season_new: 1 }] as unknown as ReleaseTagged[];
    expect(pickSeasonNew(list)).toEqual([]);
  });

  it('不修改入参', () => {
    const list = [season(1, true), season(2)];
    const snapshot = JSON.stringify(list);
    pickSeasonNew(list);
    expect(JSON.stringify(list)).toBe(snapshot);
  });
});

describe('CW 两分区（buildReleaseSectionsBy + pickSeasonNew）', () => {
  const renderCard = (item: CatalogItem, i: number): string =>
    `<a class="c" data-id="${String(item.id)}" style="--i:${i}"></a>`;

  const cwSource = (
    kind: ReleaseSource['kind'],
    label: string,
    items: readonly CatalogItem[],
  ): ReleaseSource => ({
    kind,
    label,
    tagged: items.map((it) => ({ id: String(it.id), is_season_new: it.is_season_new === true })),
    items,
    renderCard,
  });

  const items: CatalogItem[] = [
    { id: '1001', name: '姬子•启行', is_season_new: true },
    { id: '1002', name: '千冶•刃', is_season_new: true },
    { id: '1003', name: '旧角色' },
    { id: '1004', name: '旧角色2', is_season_new: false },
  ];

  it('两分区按 is_season_new 过滤，data-kind / label 与本页 DOM 契约一致', () => {
    const sections = buildReleaseSectionsBy([
      cwSource('role', '角色图鉴', items),
      cwSource('trait', '羁绊图鉴', [
        { id: '2001', name: '领航员', is_season_new: true },
        { id: '2002', name: '旧羁绊' },
      ]),
    ], pickSeasonNew);
    expect(sections.map((s) => s.kind)).toEqual(['role', 'trait']);
    expect(sections.map((s) => s.label)).toEqual(['角色图鉴', '羁绊图鉴']);
    expect(sections.map((s) => s.count)).toEqual([2, 1]);
    expect(sections[0].html).toBe(
      '<a class="c" data-id="1001" style="--i:0"></a><a class="c" data-id="1002" style="--i:1"></a>',
    );
  });

  it('某分区无新增（字段缺失 / 全 false）→ 该分区不产出', () => {
    const sections = buildReleaseSectionsBy([
      cwSource('role', '角色图鉴', [{ id: '1003', name: '旧角色' }]),
      cwSource('trait', '羁绊图鉴', [{ id: '2001', name: '领航员', is_season_new: true }]),
    ], pickSeasonNew);
    expect(sections.map((s) => s.kind)).toEqual(['trait']);
  });

  it('两分区皆无新增 → 返回空数组（视图据此渲染唯一一行空态）', () => {
    const sections = buildReleaseSectionsBy([
      cwSource('role', '角色图鉴', [{ id: '1003', name: '旧角色' }]),
      cwSource('trait', '羁绊图鉴', []),
    ], pickSeasonNew);
    expect(sections).toEqual([]);
  });
});
