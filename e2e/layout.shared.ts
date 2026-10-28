import { test, expect, type Locator } from '@playwright/test';
import { computedNumber, expectNoUnknownOverflow, readJson, splitKnownOverflow } from './helpers';

export async function expectTokenNumber(loc: Locator, prop: string, tokenValue: number, label: string): Promise<void> {
  expect(await computedNumber(loc, prop), `${label} 应等于令牌值 ${tokenValue}`).toBe(tokenValue);
}

export function seasonRewardGroups(page: import('@playwright/test').Page): Locator {
  return page.locator('#egd-season-rewards .nk-egd-season-group');
}

export const noUnknownOverflow = expectNoUnknownOverflow;

export async function expectNoSkillsOverflow(page: import('@playwright/test').Page): Promise<void> {
  expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
}

export async function collectNavAnchors(page: import('@playwright/test').Page) {
  return page.locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)').evaluateAll((els) =>
    els.map((el) => ({
      href: el.getAttribute('href'),
      visible: (el as HTMLElement).offsetParent !== null,
    })),
  );
}

export async function waitForNavMode(
  page: import('@playwright/test').Page,
  mode: 'normal' | 'cw',
  timeout = 10_000,
): Promise<void> {
  const want = mode === 'cw' ? '/currency/role' : '/character';
  const gone = mode === 'cw' ? '/character' : '/currency/role';
  await page
    .waitForFunction(
      ({ w, g }: { w: string; g: string }) => {
        const bar = document.querySelector('.ui-sidebar');
        if (!bar) return false;
        const is = (a: Element, suffix: string): boolean => {
          const raw = a.getAttribute('href') ?? '';
          let p = raw;
          try {
            p = new URL(raw, location.origin).pathname;
          } catch {
          }
          return p === suffix || p.endsWith(suffix);
        };
        const links = [...bar.querySelectorAll('a.ui-sidebar-link')];
        if (links.some((a) => is(a, g))) return false;
        const mine = links.find((a) => is(a, w));
        return !!mine && (mine as HTMLElement).offsetParent !== null;
      },
      { w: want, g: gone },
      { timeout },
    )
    .catch(() => {});
}

export async function navEntryReachable(
  page: import('@playwright/test').Page,
  href: string,
): Promise<boolean> {
  if (await page.locator(`.ui-sidebar a.ui-sidebar-link[href="${href}"]`).count() > 0) return true;
  const more = page.locator('.ui-sidebar-more');
  if (!(await more.isVisible())) return false;
  await more.click();
  const inDrawer = await page.locator(`.ui-more__item[href="${href}"]`).count() > 0;
  await page.keyboard.press('Escape');
  return inDrawer;
}

export async function readContentOffset(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('html').evaluate((el) =>
    parseFloat(getComputedStyle(el).getPropertyValue('--nk-content-offset')) || 0,
  );
}

export interface MonsterLike {
  id?: string;
  name: string;
  icon?: string;
  wave?: number;
  summons?: SummonLike[];
  boss_guide?: string;
  debuff_resist?: { key: string; value: number; icon: string }[];
  intro?: string;
  skills?: { name: string; tag?: string; phase_list?: number[] }[];
  weak?: string[];
  resist?: Record<string, number>;
  rank?: string;
  hp?: number;
  phase_hp?: number[];
}
export interface InvasionLike { level: number; stage_id?: number; monsters?: MonsterLike[] }
export interface SummonLike { id: string; name: string; tpl?: string; polluted?: number }
export interface BossGuideLike {
  traits?: { name: string; param_list?: number[] }[];
  phases?: { id: number; name: string; desc?: string; answer?: string; skills?: { name: string; desc?: string }[] }[];
}
export interface StageLike { monsters?: MonsterLike[]; invasion?: InvasionLike; damage?: string[] }
export interface RewardItemLike { id: number; num?: number }
export interface FloorLike {
  floor: number;
  name?: string;
  level?: number;
  countdown?: number;
  buff?: { name: string };
  targets?: { param: number; type?: string }[];
  reward?: RewardItemLike[];
  star_rewards?: { star: number; label?: string; items: RewardItemLike[] }[];
  stage1?: StageLike;
  stage2?: StageLike;
}
export interface MechanicLike { id?: number; name: string; desc?: string; param_list?: number[] }
export interface SeasonLike {
  id: string;
  zh?: string;
  floors?: number;
  countdown?: number;
  clear_score?: number;
  buffs?: { id: number; name: string }[];
  sub_buffs?: { id: number; name: string }[];
  floor_details?: FloorLike[];
  buff_groups?: Record<string, { name: string }[]>;
  boss_guides?: Record<string, BossGuideLike>;
  tierce?: {
    targets?: { param: number }[];
    rewards?: unknown[];
    monsters?: MonsterLike[];
    nodes?: { idx: number; level?: number; damage?: string[]; monsters?: MonsterLike[]; invasion?: InvasionLike; buff?: { name: string } }[];
  };
  levels?: {
    id?: number;
    kind?: 'knight' | 'king';
    name?: string;
    level?: number;
    damage?: string[];
    targets?: { text?: string; param: number | null }[];
    monsters?: MonsterLike[];
    buffs?: { id: number; name: string }[];
    tags?: MechanicLike[];
    invasion?: InvasionLike;
    star_rewards?: { star: number; label?: string; items: RewardItemLike[] }[];
    hard?: {
      name?: string;
      level?: number;
      monsters?: MonsterLike[];
      targets?: { param: number | null }[];
      tags?: MechanicLike[];
      star_rewards?: { star: number; label?: string; items: RewardItemLike[] }[];
    };
  }[];
  buffs?: { name: string }[];
  pollution?: { count: number; levels: number[] };
  star_rewards?: { star: number; label?: string; items: RewardItemLike[] }[];
  badges?: { level: string; name: string; desc?: string; icon: string }[];
}

export function seasonData(file: 'maze_boss.json' | 'maze.json' | 'maze_extra.json' | 'maze_peak.json', id: string): SeasonLike {
  const all = readJson<Record<string, SeasonLike>>(`public/data/cn/${file}`);
  const found = all[id];
  if (!found) throw new Error(`public/data/cn/${file} 缺少赛季 ${id}`);
  return found;
}

export const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export function lastWaveMonster(stage: { monsters?: MonsterLike[] } | undefined): MonsterLike {
  const mons = stage?.monsters ?? [];
  if (!mons.length) throw new Error('该节点/场次无敌方数据，无法派生末波首领');
  const lastWave = Math.max(...mons.map((m) => m.wave ?? 1));
  return mons.filter((m) => (m.wave ?? 1) === lastWave)[0];
}

export function lastWaveBossName(stage: StageLike | undefined): string {
  return lastWaveMonster(stage).name;
}

function seasonFloorLabels(season: SeasonLike): string[] {
  return [...(season.floor_details ?? [])]
    .sort((a, b) => b.floor - a.floor)
    .map((f) => `第 ${f.floor} 层`);
}

export function levelTabLabels(season: SeasonLike): string[] {
  return ['星启模式', ...seasonFloorLabels(season)];
}

export function seasonTabLabels(season: SeasonLike): string[] {
  const floors = seasonFloorLabels(season);
  return season.tierce ? ['星启模式', ...floors] : floors;
}

export function peakTabLabels(season: SeasonLike): string[] {
  const king = (season.levels ?? []).find((l) => l.kind === 'king');
  const labels = king ? [king.name ?? ''] : [];
  return (season.levels ?? []).some((l) => l.kind === 'knight') ? [...labels, '骑士试炼'] : labels;
}

export const peakTabId = (level: { id?: number }): string => `#egd-level-tab-peak-${level.id}`;
export const peakKnightsTabId = '#egd-level-tab-peak-knights';
export const PEAK_KING_NODE = 'king';
export const PEAK_HARD_NODE = 'hard';
export const peakNodeTabId = (key: string): string => `#egd-peak-node-tab-${key}`;
export const peakKnightNodeTabId = (level: { id?: number }, i = 0): string =>
  `#egd-peak-node-tab-${level.id ?? i + 1}`;
export function peakKnightLevels(season: SeasonLike): NonNullable<SeasonLike['levels']> {
  return (season.levels ?? []).filter((l) => l.kind === 'knight');
}

export function monCountLabel(mons: MonsterLike[] | undefined): string {
  if (!mons?.length) return '';
  return `${new Set(mons.map((m) => m.wave ?? 1)).size} 波 · ${mons.length} 敌`;
}

export function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function cnBigNumber(v: number): string {
  const digits = String(Math.round(Math.abs(v)));
  const chunks: string[] = [];
  for (let end = digits.length; end > 0; end -= 4) chunks.push(digits.slice(Math.max(0, end - 4), end));
  let lowest = 0;
  while (lowest < chunks.length - 1 && chunks[lowest] === '0000') lowest++;
  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= lowest; i--) {
    const text = i === chunks.length - 1 ? String(Number(chunks[i])) : chunks[i];
    parts.push(text + (i === 0 ? '' : i === 1 ? '万' : '亿'));
  }
  return parts.join('');
}

export function itemNameMap(): Map<number, string> {
  const list = readJson<{ id: number; name: string }[]>('public/data/cn/items.json');
  return new Map(list.map((it) => [it.id, it.name]));
}

export function rewardNames(items: RewardItemLike[], names: Map<number, string>): string[] {
  return items.map((it) => names.get(it.id) || `#${it.id}`);
}

export function rewardNums(items: RewardItemLike[]): string[] {
  return items.filter((it) => it.num).map((it) => `×${grouped(it.num!)}`);
}

export interface TierRun {
  from: number;
  to: number;
  step: number;
  items: RewardItemLike[];
}

export function tierRuns(tiers: { star: number; items: RewardItemLike[] }[]): TierRun[] {
  const runs: TierRun[] = [];
  const sig = (items: RewardItemLike[]): string =>
    items.map((it) => `${it.id}:${it.num ?? ''}`).sort().join(',');
  for (const tier of tiers) {
    const last = runs[runs.length - 1];
    if (last && last.step > 0 && sig(last.items) === sig(tier.items) && tier.star - last.to === last.step) {
      last.to = tier.star;
      continue;
    }
    if (last && last.from === last.to && sig(last.items) === sig(tier.items) && tier.star > last.to) {
      last.step = tier.star - last.to;
      last.to = tier.star;
      continue;
    }
    runs.push({ from: tier.star, to: tier.star, step: 0, items: tier.items });
  }
  return runs;
}

export function tierBadges(runs: TierRun[]): string[] {
  return runs.map((run) => (run.from === run.to ? `累计 ${run.from}★` : `累计 ${run.from}–${run.to}★`));
}

export function tierUnits(runs: TierRun[]): string[] {
  return runs
    .filter((run) => run.to > run.from)
    .map((run) => (run.step > 1 ? `每 ${run.step}★ 一档，各 1 份` : '每颗星各 1 份'));
}

export function floorBossName(season: SeasonLike, floor: number, half: 'stage1' | 'stage2'): string {
  const f = (season.floor_details ?? []).find((x) => x.floor === floor);
  if (!f) throw new Error(`赛季 ${season.id} 缺少第 ${floor} 层`);
  return lastWaveBossName(f[half]);
}

export function tierceNodeBossNames(season: SeasonLike): string[] {
  return (season.tierce?.nodes ?? []).map((nd) => lastWaveMonster(nd).name);
}

export function guideOf(season: SeasonLike, m?: MonsterLike): BossGuideLike | undefined {
  return m?.boss_guide ? season.boss_guides?.[m.boss_guide] : undefined;
}

export function stageGuide(season: SeasonLike, stage?: StageLike): BossGuideLike | undefined {
  for (const m of stage?.monsters ?? []) {
    const g = guideOf(season, m);
    if (g) return g;
  }
  return undefined;
}

export function floorGuide(
  season: SeasonLike, floor: number, half: 'stage1' | 'stage2',
): BossGuideLike | undefined {
  const f = (season.floor_details ?? []).find((x) => x.floor === floor);
  return stageGuide(season, f?.[half]);
}

export interface PollutionEntry {
  half: 'stage1' | 'stage2' | 'level' | 'tierce';
  floor?: number;
  title?: string;
  invasion: InvasionLike;
}

export function pollutionEntries(season: SeasonLike): PollutionEntry[] {
  const out: PollutionEntry[] = [];
  const seen = new Set<number>();
  const push = (e: PollutionEntry): void => {
    const sid = e.invasion.stage_id;
    if (sid != null) {
      if (seen.has(sid)) return;
      seen.add(sid);
    }
    out.push(e);
  };
  for (const f of [...(season.floor_details ?? [])].reverse()) {
    for (const half of ['stage1', 'stage2'] as const) {
      const invasion = f[half]?.invasion;
      if (invasion) push({ half, floor: f.floor, title: f.name, invasion });
    }
  }
  for (const lv of season.levels ?? []) {
    if (lv.invasion) push({ half: 'level', title: lv.name, invasion: lv.invasion });
  }
  for (const nd of season.tierce?.nodes ?? []) {
    if (nd.invasion) push({ half: 'tierce', invasion: nd.invasion });
  }
  return out;
}

export function summonsOf(mons: MonsterLike[] | undefined): SummonLike[] {
  return (mons ?? []).flatMap((m) => m.summons ?? []);
}

export function pollutedSummons(mons: MonsterLike[] | undefined): SummonLike[] {
  return summonsOf(mons).filter((s) => s.polluted);
}

export const summonBadge = (s: SummonLike): string => `污染等级 ${s.polluted}`;

export function pollutedMonsters(inv: InvasionLike | undefined, mons: MonsterLike[] | undefined): MonsterLike[] {
  const ids = new Set((inv?.monsters ?? []).map((m) => String(m.id)));
  return (mons ?? []).filter((m) => m.id != null && ids.has(String(m.id)));
}

export const monsterBadge = (inv: InvasionLike): string => `污染等级 ${inv.level}`;

export function pollutedSeasonHrefs(): string[] {
  const sources: [file: string, mode: 'boss' | 'maze' | 'story' | 'peak'][] = [
    ['maze_boss.catalog.json', 'boss'],
    ['maze.catalog.json', 'maze'],
    ['maze_extra.catalog.json', 'story'],
    ['maze_peak.catalog.json', 'peak'],
  ];
  return sources.flatMap(([file, mode]) =>
    Object.values(readJson<Record<string, { id: string; pollution?: { count?: number } | null }>>(`public/data/cn/${file}`))
      .filter((e) => (e.pollution?.count ?? 0) > 0)
      .map((e) => `/endgame/${mode}/${e.id}`),
  );
}

export function charFamilyIds(charId: string, anchor: string): number[] {
  const d = readJson<{
    skill_trees: Record<string, Record<string, { level_up_skill_id?: number[] }>>;
  }>(`public/data/cn/characters/${charId}.json`);
  for (const node of Object.values(d.skill_trees[anchor] || {})) {
    if (node.level_up_skill_id?.length) return node.level_up_skill_id;
  }
  throw new Error(`characters/${charId}.json 锚点 ${anchor} 无 level_up_skill_id`);
}

export function charSkillNames(charId: string, ids: number[]): string[] {
  const d = readJson<{ skills: Record<string, { name: string }> }>(`public/data/cn/characters/${charId}.json`);
  return ids.map((id) => d.skills[String(id)].name);
}

export async function skillRailX(host: Locator): Promise<number> {
  return host.evaluate((el) => {
    const node = el.classList.contains('nk-skill--child') || el.classList.contains('nk-skill__body')
      ? el
      : el.querySelector(':scope > .nk-skill__body')!;
    const left = parseFloat(getComputedStyle(node, '::before').left) || 0;
    return node.getBoundingClientRect().left + left;
  });
}

export interface PseudoBox {
  top: number;
  height: number;
  left: number;
  width: number;
  rightX: number;
  topY: number;
  bottomY: number;
  borderLeftWidth: string;
  borderLeftColor: string;
  borderTopWidth: string;
  borderTopStyle: string;
  content: string;
}

export async function pseudoBox(loc: Locator, pseudo: '::before' | '::after'): Promise<PseudoBox> {
  return loc.evaluate((el, p) => {
    const cs = getComputedStyle(el, p);
    const r = el.getBoundingClientRect();
    const hostCs = getComputedStyle(el);
    const bt = parseFloat(hostCs.borderTopWidth) || 0;
    const bl = parseFloat(hostCs.borderLeftWidth) || 0;
    const top = parseFloat(cs.top) || 0;
    const height = parseFloat(cs.height) || 0;
    const left = parseFloat(cs.left) || 0;
    const width = parseFloat(cs.width) || 0;
    return {
      top,
      height,
      left: r.left + bl + left,
      width,
      rightX: r.left + bl + left + width,
      topY: r.top + bt + top,
      bottomY: r.top + bt + top + height,
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftColor: cs.borderLeftColor,
      borderTopWidth: cs.borderTopWidth,
      borderTopStyle: cs.borderTopStyle,
      content: cs.content,
    };
  }, pseudo);
}

export async function tableBoxWithinCard(card: Locator): Promise<{
  left: number;
  right: number;
  contentLeft: number;
  contentRight: number;
}> {
  return card.evaluate((el) => {
    const wrap = el.querySelector(':scope > .nk-skill__body > .nk-skill__table-wrap')!;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    return {
      left: w.left,
      right: w.right,
      contentLeft: r.left + (parseFloat(cs.paddingLeft) || 0),
      contentRight: r.right - (parseFloat(cs.paddingRight) || 0),
    };
  });
}

export async function skillsPanelOverflow(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = document.querySelector('[data-panel="skills"]');
    if (!root) return ['[data-panel="skills"] 缺失'];
    const vw = document.documentElement.clientWidth;
    const bad: string[] = [];
    const inScrollable = (el: Element): boolean => {
      let cur = el.parentElement;
      while (cur && cur !== root.parentElement) {
        const o = getComputedStyle(cur).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    root.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        if (cs.position !== 'fixed' && !inScrollable(el)) {
          bad.push(
            `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''} right=${Math.round(r.right)} left=${Math.round(r.left)}`,
          );
        }
      }
    });
    return bad.slice(0, 20);
  });
}
