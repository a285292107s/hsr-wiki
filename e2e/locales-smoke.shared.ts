import { readFileSync } from 'node:fs';
import { expect } from '@playwright/test';
import { readJsonIn } from './helpers';
import { LOCALES } from '../src/lib/i18n/locales';

/**
 * 全语言冒烟的**共享层**：语言清单 / 词典读取 / 数据 id 派生 / 告警收集。
 *
 * 纪律同 `layout.shared.ts`：只放取值与派生，不放 `test()`。
 *
 * 端到端兜底的两级覆盖（拆成两个 spec 文件，见 `layout-locales-smoke.spec.ts` 与
 * `layout-locales-sweep.spec.ts`）：
 *   1. **13 语言 ×「首页 + 一个角色详情」**——断言无未解析 `$t:` 令牌、首页无非中日韩中文残留、
 *      **无未捕获 JS 异常**。第 3 条抓过真缺陷：德语/法语/葡语的词典值带官方性别变体标记
 *      `{M#Trailblazer}`，被 vue-i18n 当占位符编译 ⇒ SyntaxError + 整页渲染异常。
 *   2. **13 语言 × 全部路由族（25 条路径）**——标记类与缺键类缺陷只在「该语言 + 该页」同时命中时才暴露。
 *
 * CI 每次 push 走 `SMOKE_SCOPE=fast`（cn/de/jp/ru），全量矩阵由 `.github/workflows/ci-full.yml` 承担。
 * 构建期守卫查键与计数，这里查**用户实际看到的那一份**；细节留在 `layout-i18n.spec.ts`。
 */

/** UI 词典（源语言文件即键集基准；各语言值用于比对文档级元信息）。 */
export const dictOf = (code: string): Record<string, string> =>
  JSON.parse(readFileSync(`src/lib/i18n/messages/${code}.json`, 'utf8')) as Record<string, string>;

/** 允许出现汉字的语言（韩语译文自带汉字注音，故 kr 单独按「括号内」放行） */
export const HAN_OK = new Set(['cn', 'cht', 'jp']);
export const HAN_RE = /[\u4e00-\u9fff]/;

const firstId = (file: string, listKey?: string): string => {
  const raw = readJsonIn<Record<string, unknown> | unknown[]>('cn', `public/data/cn/${file}`);
  const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)[listKey ?? '']!;
  const first = (Array.isArray(raw) ? raw[0] : arr[0]) as { id: number | string };
  return String(first.id);
};

/** 收集 vue-i18n 缺键告警（`[intlify] Not found`）；返回取值器，用例末尾断言为空 */
export const collectI18nWarnings = (page: import('@playwright/test').Page): (() => string[]) => {
  const warns: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[intlify]') && text.includes('Not found')) warns.push(text);
  });
  return () => warns;
};

export const charId = (): string => firstId('characters.json');
const lightconeId = (): string => firstId('light_cones.json');
const relicId = (): string => firstId('relics.json');
const monsterId = (): string => firstId('monsters.json');
export const roleId = (): string => firstId('currency/role.json', 'roles');
const traitId = (): string => firstId('currency/traits.json', 'traits');

/** 全路由族（每个族取一条代表性路径） */
export const routeFamilies = (base: string): string[] => [
  `${base}/`,
  `${base}/character`,
  `${base}/character/${charId()}`,
  `${base}/lightcone`,
  `${base}/lightcone/${lightconeId()}`,
  `${base}/relic`,
  `${base}/relic/${relicId()}`,
  `${base}/item`,
  `${base}/monster`,
  `${base}/monster/${monsterId()}`,
  `${base}/achievement`,
  `${base}/endgame`,
  `${base}/endgame/maze`,
  `${base}/endgame/maze/1036`,
  `${base}/endgame/story`,
  `${base}/endgame/story/2026`,
  `${base}/endgame/boss`,
  `${base}/endgame/boss/3020`,
  `${base}/endgame/peak`,
  `${base}/endgame/peak/9`,
  `${base}/voracity`,
  `${base}/currency`,
  `${base}/currency/role`,
  `${base}/currency/role/${roleId()}`,
  `${base}/currency/trait/${traitId()}`,
];

/* 13 语言全跑太贵：CI 每次 push 只扫风险语言子集
   （cn 缺省 / de 性别变体 / jp ruby / ru 分片）——CI 每次 push 走 fast，定时 workflow 走全量。
   两条 describe 共用这一个清单：只缩一条会让「13 语言 × 首页/详情」成为墙钟大头。 */
const SWEEP_FAST = ['cn', 'de', 'jp', 'ru'];
const SWEEP_ALL = LOCALES.map((l) => l.code);
export const SWEEP_LOCALES =
  process.env.SMOKE_SCOPE === 'fast' || process.env.SMOKE_FAST ? SWEEP_FAST : SWEEP_ALL;
export const SWEEP_SET = new Set(SWEEP_LOCALES);
