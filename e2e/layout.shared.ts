import { test, expect, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { computedNumber, expectNoUnknownOverflow, readJson, splitKnownOverflow } from './helpers';

/**
 * layout 验收层的**共享层**：跨 spec 文件复用的取值原语与数据派生。
 *
 * 存在理由：layout 原本是单文件（`fullyParallel: false` 下文件内串行 → 全量墙钟 6.6 分钟）。
 * 按 describe 边界拆成多个 spec 后，文件级并行才能生效；本模块承接被多块共用的符号，
 * 使各 spec 保持「只 import 自己用得到的」而不复制粘贴。
 *
 * 纪律：这里只放**取值与派生**（读令牌 / 量几何 / 从随站 JSON 派生期望值），
 * 不放 `test()` / `expect()` 断言——断言一律留在各 spec 的 describe 内，
 * 否则跨文件断言失败会指不到具体用例。
 */

/* ─── 通用断言辅助（原 layout.spec.ts 文件头）─── */

/** 元素计算样式必须等于令牌落值（令牌缺失时读数为 0，断言随之变红） */
export async function expectTokenNumber(loc: Locator, prop: string, tokenValue: number, label: string): Promise<void> {
  expect(await computedNumber(loc, prop), `${label} 应等于令牌值 ${tokenValue}`).toBe(tokenValue);
}

/** 未知横向溢出（整页判据；技能区子树见 expectNoSkillsOverflow） */
export const noUnknownOverflow = expectNoUnknownOverflow;

/** 技能区子树未知溢出（见 skillsPanelOverflow 注释：Hero spine 画布恒越出视口，整页判据会误伤） */
export async function expectNoSkillsOverflow(page: import('@playwright/test').Page): Promise<void> {
  expect(splitKnownOverflow(await skillsPanelOverflow(page)).unknown).toEqual([]);
}

/* ─── 侧栏与内容区避让（原「常规主题」块内，供导航折叠 / 枢纽页 / 页脚三块共用）─── */

/** 收集侧栏导航锚点（排除 设置/交换/更多/调试台入口——仅统计 navItems 板块）；返回 DOM 序（= 规范序）下的可见性 */
export async function collectNavAnchors(page: import('@playwright/test').Page) {
  return page.locator('a.ui-sidebar-link:not(.ui-sidebar-settings):not(.ui-sidebar-debug)').evaluateAll((els) =>
    els.map((el) => ({
      href: el.getAttribute('href'),
      visible: (el as HTMLElement).offsetParent !== null,
    })),
  );
}

/** 读取 <html> 上的内容区避让令牌（断言 --nk-content-offset 的实际落值，单位 px）。
 *  注意：自定义属性按原样返回（手机断点声明为无单位 `0`），故必须 parseFloat 归一化。 */
export async function readContentOffset(page: import('@playwright/test').Page): Promise<number> {
  return page.locator('html').evaluate((el) =>
    parseFloat(getComputedStyle(el).getPropertyValue('--nk-content-offset')) || 0,
  );
}

/* ─── 期望值从随站数据派生（沿用 charFamilyIds 模式）───
   页面文案 / 计数 / 分数档一律不在断言里写死：数据一改，断言跟着数据走；页面写错才红。
   无法派生的只剩两类：① 站点自创文案（如 H1「贪饕污染」、区块标题「首领特性」）；
   ② UI 格式（「第 N 层」「污染等级 N」「NO.<id>」的拼装方式）——这两类保留字面量并注明理由。 */

export interface MonsterLike { name: string; icon?: string; wave?: number; summons?: SummonLike[] }
export interface InvasionLike { level: number; stage_id?: number; monsters?: MonsterLike[] }
/** 召唤物（ADR 0036 修订）：轻形态 + 受污染者带 polluted（污染等级）；挂在召唤者自己的敌方条目上 */
export interface SummonLike { id: string; name: string; tpl?: string; polluted?: number }
export interface StageLike { monsters?: MonsterLike[]; invasion?: InvasionLike; damage?: string[] }
export interface FloorLike {
  floor: number;
  name?: string;
  level?: number;
  countdown?: number;
  buff?: { name: string };
  targets?: { param: number; type?: string }[];
  stage1?: StageLike;
  stage2?: StageLike;
}
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
  boss_traits?: Record<string, { name: string; param_list?: number[] }[]>;
  tierce?: {
    targets?: { param: number }[];
    rewards?: unknown[];
    monsters?: MonsterLike[];
    nodes?: { idx: number; level?: number; damage?: string[]; monsters?: MonsterLike[]; invasion?: InvasionLike; buff?: { name: string } }[];
  };
  levels?: {
    name?: string;
    damage?: string[];
    monsters?: MonsterLike[];
    invasion?: InvasionLike;
    hard?: { monsters?: MonsterLike[] };
  }[];
  buffs?: { name: string }[];
  pollution?: { count: number; levels: number[] };
}

/** 读某个终局赛季的原始数据（maze_boss / maze / maze_peak 三表同构） */
export function seasonData(file: 'maze_boss.json' | 'maze.json' | 'maze_extra.json' | 'maze_peak.json', id: string): SeasonLike {
  const all = readJson<Record<string, SeasonLike>>(`public/data/cn/${file}`);
  const found = all[id];
  if (!found) throw new Error(`public/data/cn/${file} 缺少赛季 ${id}`);
  return found;
}

/** 节点卡片序号文案的中文数字（站点自创格式，非数据字段） */
export const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** 末波首领（= 战斗卡片「打谁」的判据，与 `renders.lastWaveBoss` 同源：最后一波的第 1 只） */
export function lastWaveMonster(stage: { monsters?: MonsterLike[] } | undefined): MonsterLike {
  const mons = stage?.monsters ?? [];
  if (!mons.length) throw new Error('该节点/场次无敌方数据，无法派生末波首领');
  const lastWave = Math.max(...mons.map((m) => m.wave ?? 1));
  return mons.filter((m) => (m.wave ?? 1) === lastWave)[0];
}

/** 末波首领名 */
export function lastWaveBossName(stage: StageLike | undefined): string {
  return lastWaveMonster(stage).name;
}

/** 层级 tab 文案：数据层序 + 星启模式（不写死层数） */
export function levelTabLabels(season: SeasonLike): string[] {
  return [...(season.floor_details ?? []).map((f) => `第 ${f.floor} 层`), '星启模式'];
}

/** 子 tab 文案（层 tab + 有星启才有的星启 tab；层级模式三玩法共用） */
export function seasonTabLabels(season: SeasonLike): string[] {
  const floors = (season.floor_details ?? []).map((f) => `第 ${f.floor} 层`);
  return season.tierce ? [...floors, '星启模式'] : floors;
}

/** 千分位（页面数值档用 toLocaleString 渲染，断言不依赖运行环境的 locale） */
export function grouped(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 某层半场的末波首领名 */
export function floorBossName(season: SeasonLike, floor: number, half: 'stage1' | 'stage2'): string {
  const f = (season.floor_details ?? []).find((x) => x.floor === floor);
  if (!f) throw new Error(`赛季 ${season.id} 缺少第 ${floor} 层`);
  return lastWaveBossName(f[half]);
}

/** 星启节点看板的敌方（看板只渲染当前节点，敌方同源于 tierce.nodes） */
export function tierceNodeBossNames(season: SeasonLike): string[] {
  return (season.tierce?.nodes ?? []).map((nd) => lastWaveMonster(nd).name);
}

export interface PollutionEntry {
  half: 'stage1' | 'stage2' | 'level' | 'tierce';
  floor?: number;
  title?: string;
  invasion: InvasionLike;
}

/** 污染节点（与 src/app/endgame/pollution.ts 同口径：层序倒置 → 异相仲裁单关 → 星启节点，按 stage_id 去重） */
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

/** 污染徽标文案（站点术语「污染等级 N」，勿简写成侵蚀等级） */
export const pollutionBadge = (e: PollutionEntry): string => `污染等级 ${e.invasion.level}`;

/** 某场次/某节点敌方条目上的召唤物（按召唤者分发，见 ADR 0036 修订） */
export function summonsOf(mons: MonsterLike[] | undefined): SummonLike[] {
  return (mons ?? []).flatMap((m) => m.summons ?? []);
}

/** 其中受污染的那些（站点在它们身上挂污染等级徽标） */
export function pollutedSummons(mons: MonsterLike[] | undefined): SummonLike[] {
  return summonsOf(mons).filter((s) => s.polluted);
}

/** 污染徽标文案（召唤物条目上的 polluted = 该场次 InvasionID） */
export const summonBadge = (s: SummonLike): string => `污染等级 ${s.polluted}`;

/** 污染节点位置文案（与 pollutionPosition 同口径） */
export function pollutionPosition(e: PollutionEntry): string {
  if (e.half === 'tierce') return '星启附加关';
  if (e.half === 'level') return e.title || '关卡';
  return `第 ${e.floor} 层 · ${e.half === 'stage1' ? '上半场' : '下半场'}`;
}

/** 被污染怪物总数（污染数据自带，不在本页敌方配置里） */
export function pollutedMonsterCount(season: SeasonLike): number {
  return pollutionEntries(season).reduce((n, e) => n + (e.invasion.monsters?.length ?? 0), 0);
}

/** 已登记的污染赛季（四张终局目录的 `pollution` 字段 = 目录页标记的唯一判据；目录文件 → 路由 mode 一一对应） */
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

/* ─── 技能族层级（ADR 0022）取证工具 ───
   期望文案一律从 characters/*.json 读（族成员 id 原序 → 名），不在断言里写死页面文案；
   族 id 原序与 src/lib/skill-family.ts 同口径（取锚点首个非空 level_up_skill_id 级）。 */
export function charFamilyIds(charId: string, anchor: string): number[] {
  const d = JSON.parse(readFileSync(`public/data/cn/characters/${charId}.json`, 'utf8')) as {
    skill_trees: Record<string, Record<string, { level_up_skill_id?: number[] }>>;
  };
  for (const node of Object.values(d.skill_trees[anchor] || {})) {
    if (node.level_up_skill_id?.length) return node.level_up_skill_id;
  }
  throw new Error(`characters/${charId}.json 锚点 ${anchor} 无 level_up_skill_id`);
}

export function charSkillNames(charId: string, ids: number[]): string[] {
  const d = JSON.parse(readFileSync(`public/data/cn/characters/${charId}.json`, 'utf8')) as {
    skills: Record<string, { name: string }>;
  };
  return ids.map((id) => d.skills[String(id)].name);
}

/**
 * 层级线竖轨的页面 x。三种宿主都必须支持：
 * - 子卡自身（竖轨在 `.nk-skill--child::before`，left 用负偏移抵消行缩进）；
 * - 父卡（竖轨在其 `.nk-skill__body::before`）；
 * - 直接传 `.nk-skill__body`。
 * left 是相对宿主 padding box 的值，故必须 host.rect.left + left 换算成页面 x 后比较（父/子宿主不同，不可直接比数值）。
 */
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
  /** 伪元素左端页面 x（宿主 rect.left + 计算 left；宿主与伪元素均无横向边框） */
  left: number;
  width: number;
  /** 伪元素右端页面 x（left + 计算 width） */
  rightX: number;
  /** 伪元素顶边页面 y（宿主 rect.top + 计算 top） */
  topY: number;
  /** 伪元素底边页面 y（宿主 rect.top + 计算 top + 计算 height） */
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
    // 绝对定位伪元素的包含块是宿主 padding box 的**外缘**（= border box + border 宽度）——
    // 宿主的 padding 不属于偏移量。曾误按「padding box 内缘」加 paddingTop 换算，整套坐标被抬低
    // 一个 child-gap，掩盖了「折角必须落在子图标中线」的公式错误（见 docs/memory/2026-09.md「包含块原点实测」）。
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

/** 技能数据表盒 vs 卡片内容区（左/右缘）——用于断言「表格不侵入图标列、不产生卡片级横向溢出」 */
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

/**
 * 技能区横向溢出（与 helpers.ts findHorizontalOverflow 同判据，但限定 `[data-panel="skills"]` 子树）。
 * **为何不直接对整页断言**：角色详情页 Hero 的 `canvas.spine-player-canvas` 实测恒越出视口
 * （1212/1503/1509 实测 1280 宽下 right=1289、375 宽下 left=-28 right=403；`.nk-hero__visual { overflow-x: hidden }`
 * 把它裁掉，故 documentElement.scrollWidth 不越界），属 Hero/spine 域的既有条件，与本轮技能层级改动无关；
 * 整页断言会把无关缺陷算进技能区用例。此处只对技能区子树取证。
 */
export async function skillsPanelOverflow(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const root = document.querySelector('[data-panel="skills"]');
    if (!root) return ['[data-panel="skills"] 缺失'];
    const vw = window.innerWidth;
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
