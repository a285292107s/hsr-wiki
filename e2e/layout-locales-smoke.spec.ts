/**
 * 全语言冒烟：语言包完整性的**端到端**兜底。
 *
 * 两级覆盖：
 *   1. **13 语言 × 「首页 + 一个角色详情」**——断言无未解析 `$t:` 令牌、首页无非中日韩中文残留、
 *      **无未捕获 JS 异常**。第 3 条抓过真缺陷：德语/法语/葡语的词典值带官方性别变体标记
 *      `{M#Trailblazer}`，被 vue-i18n 当占位符编译 ⇒ SyntaxError + 整页渲染异常。
 *   2. **13 语言 × 全部路由族（25 条路径）**——标记类与缺键类缺陷只在「该语言 + 该页」同时命中时才暴露，
 *      实测全量约 2.3 分钟；需要快速一轮时 `SMOKE_FAST=1` 只扫 cn/de/jp/ru。
 *
 * 构建期守卫查键与计数，这里查**用户实际看到的那一份**。断言保持轻量，细节留在 layout-i18n.spec.ts。
 */
import { test, expect } from '@playwright/test';
import { collectConsoleIssues, expectNoUnknownOverflow, readJsonIn, waitForSettled } from './helpers';
import { LOCALES } from '../src/lib/i18n/locales';
import { SITE_NAME } from '../src/lib/constants';
import { readFileSync } from 'node:fs';

/** UI 词典（源语言文件即键集基准；各语言值用于比对文档级元信息）。 */
const dictOf = (code: string): Record<string, string> =>
  JSON.parse(readFileSync(`src/lib/i18n/messages/${code}.json`, 'utf8')) as Record<string, string>;

/** 允许出现汉字的语言（韩语译文自带汉字注音，故 kr 单独按「括号内」放行） */
const HAN_OK = new Set(['cn', 'cht', 'jp']);
const HAN_RE = /[\u4e00-\u9fff]/;

const firstId = (file: string, listKey?: string): string => {
  const raw = readJsonIn<Record<string, unknown> | unknown[]>('cn', `public/data/cn/${file}`);
  const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown[]>)[listKey ?? '']!;
  const first = (Array.isArray(raw) ? raw[0] : arr[0]) as { id: number | string };
  return String(first.id);
};

/**
 * 收集 vue-i18n 的**缺键告警**（`[intlify] Not found '…' key`）。
 * 动态拼的键（`t('itemType.' + v)` 这类）静态守卫查不到，只有运行期会以 warn 暴露 ⇒ 这里兜住。
 */
const collectI18nWarnings = (page: import('@playwright/test').Page): (() => string[]) => {
  const warns: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (/\[intlify\]/.test(text) || /Not found .* key/.test(text)) warns.push(text.slice(0, 200));
  });
  return () => warns;
};

const charId = (): string => firstId('characters.json');
const lightconeId = (): string => firstId('light_cones.json');
const relicId = (): string => firstId('relics.json');
const monsterId = (): string => firstId('monsters.json');
const roleId = (): string => firstId('currency/role.json', 'roles');
const traitId = (): string => firstId('currency/traits.json', 'traits');

/** 全路由族（每个族取一条代表性路径） */
const routeFamilies = (base: string): string[] => [
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
  `${base}/currency`,
  `${base}/currency/role`,
  `${base}/currency/role/${roleId()}`,
  `${base}/currency/trait`,
  `${base}/currency/trait/${traitId()}`,
  `${base}/currency/item`,
  `${base}/currency/buff`,
  `${base}/currency/augment`,
  `${base}/currency/settings`,
  `${base}/voracity`,
  `${base}/settings`,
  `${base}/definitely-not-a-real-path`,
];

/* 扫全路由的语言：默认**全部 13 语言**（实测 13×25 条路径约 2.3 分钟，值得）；
   需要快速一轮时设 `SMOKE_FAST=1` 只扫标记风险最高的四种（cn 缺省 / de 性别变体 / jp ruby / ru 分片）。 */
const SWEEP_LOCALES = process.env.SMOKE_FAST
  ? ['cn', 'de', 'jp', 'ru']
  : LOCALES.map((l) => l.code);

test.describe('全语言冒烟', () => {
  for (const loc of LOCALES) {
    const base = loc.prefix ? `/${loc.prefix}` : '';
    test(`${loc.code}：首页与角色详情无未解析令牌、非中日韩无中文残留`, { tag: ['@viewport-independent'] }, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const i18nWarn = collectI18nWarnings(page);
      for (const path of [`${base}/`, `${base}/character/${charId()}`]) {
        await page.goto(path);
        await expect(page.locator('#app')).toBeVisible();
        /* 内容就位：轮询正文长度而不是等某个类名——同类名在不同页/档下有隐藏实例，
           `.first()` 会命中不可见元素（fr/de/pt 实测踩到）。 */
        await expect.poll(async () => (await page.locator('body').innerText()).length, {
          message: `${loc.code} ${path} 内容未就位`, timeout: 20000,
        }).toBeGreaterThan(200);
        const body = await page.locator('body').innerText();
        expect(body.length, `${loc.code} ${path} 渲染内容过少`).toBeGreaterThan(200);
        expect(body, `${loc.code} ${path} 出现未解析令牌`).not.toContain('$t:');
        /* 文档级元信息也要查：`innerText` 取不到 `<title>`，标题里的未解析令牌或原始键名
           （vue-i18n 缺键时会把键名写进 title）此前完全看不见。 */
        const title = await page.title();
        expect(title, `${loc.code} ${path} 标题为空或残留未解析令牌`).not.toContain('$t:');
        expect(title.trim().length, `${loc.code} ${path} 标题为空`).toBeGreaterThan(0);
        await expect(page.locator('html')).toHaveAttribute('lang', loc.culture);
        if (path === `${base}/`) {
          /* 站点描述随语言（bootstrap 改写 `<meta name="description">`）：13 语言逐个比对词典值，
             缺键/漏改都会在这里暴露。 */
          await expect(page.locator('meta[name="description"]'))
            .toHaveAttribute('content', dictOf(loc.code)['meta.description']!);
        }
        /* 溢出面：译文长度差异最大的一档（德语 / 俄语比中文长约三成）最容易撑破容器，
           而既有溢出断言只在缺省语言上跑过 ⇒ 这里按语言各测一遍（字体就绪后测，避免换字期间误判）。 */
        await waitForSettled(page);
        await expectNoUnknownOverflow(page);
        /* 中文残留只在**首页**查：详情页有配音演员专名等合法中文（官方专名，有意保留），
           首页则全部是站点自产文案 + 数据名，出现中文即漏译。
           排除：站点品牌名（有意不本地化）；kr 的官方汉字注音（`세검(細劍)`）。 */
        if (path === `${base}/` && !HAN_OK.has(loc.code)) {
          const text = body.split(SITE_NAME).join('');
          const hits = text.match(new RegExp(HAN_RE, 'g')) ?? [];
          expect(hits.length, `${loc.code} 首页有 ${hits.length} 处中文残留：${text.slice(0, 120)}`).toBe(0);
        }
      }
      /* 错误态不得显示内部诊断：`NkError` 的 message 是中文内部文案（带字段名/ID），
         operational 错误现在只进控制台、界面只留本地化的错误标题 ⇒ 用不存在的 id 触发这条路径。 */
      /* 货币战争属性行：结构层有一张「属性枚举 → 名称」表，其中 SpeedAddedRatio / MaxSP 两条
         官方无独立词条 ⇒ 落成中文回退（转换器已登记）。此处验证这些回退是**惰性**的：
         非缺省语言下属性行必须走词典译文，不得露中文，也不得露原始枚举键。 */
      if (!HAN_OK.has(loc.code)) {
        await page.goto(`${base}/currency/role/${roleId()}`);
        await expect(page.locator('.nk-crole-layer__pname').first()).toBeVisible({ timeout: 20000 });
        const names = (await page.locator('.nk-crole-layer__pname').allTextContents()).map((v) => v.trim());
        expect(names.length, `${loc.code} 属性行应有内容`).toBeGreaterThan(0);
        const bad = names.filter((v) => HAN_RE.test(v) || /^[A-Za-z]+(AddedRatio|Delta|Base|MaxSP)$/.test(v));
        expect(bad, `${loc.code} 属性行露中文或原始枚举键：${bad.slice(0, 3)}`).toEqual([]);

        /* 技能/装备描述里的自造属性名走 `{PROP:<枚举键>}` 占位符（ADR 0053 方案 A）：
           渲染端必须按词典解析掉——既不能残留占位符，也不能落回中文。 */
        const descText = (await page.locator(
          '.nk-crole-skill__desc, .nk-crole-skill__simple, .nk-crole-equip__desc, .nk-crole-timeline__desc',
        ).allTextContents()).join('\n');
        expect(descText, `${loc.code} 描述残留占位符`).not.toContain('{PROP:');
        const descHan = descText.match(new RegExp(HAN_RE, 'g')) ?? [];
        expect(descHan.length, `${loc.code} 描述里 ${descHan.length} 处中文：${descText.slice(0, 100)}`).toBe(0);
      }
      /* 目录卡点击：卡片 href 由 `activeHref()` 生成、**已带前缀**，而 JS 点击走 `router.push()`
         （其 history base 也是该前缀）⇒ 直接推会得到 `/en/en/character/…`（用户实测）。
         这条回归用例就是当初缺的那一层覆盖。 */
      if (loc.prefix) {
        await page.goto(`${base}/character`);
        const card = page.locator('[class*="-grid"] a').first();
        await expect(card).toBeVisible({ timeout: 20000 });
        await card.click();
        await page.waitForURL(new RegExp(`/${loc.prefix}/character/\\d+$`), { timeout: 20000 });
        const path = new URL(page.url()).pathname;
        expect(path.startsWith(`/${loc.prefix}/${loc.prefix}/`), `语言前缀被拼了两次：${page.url()}`).toBe(false);
        expect(path, `应落在 ${loc.code} 的角色详情页`).toMatch(new RegExp(`^/${loc.prefix}/character/\\d+$`));
      }
      expect(i18nWarn(), `缺键告警：${i18nWarn().slice(0, 3)}`).toEqual([]);
      assertNoErrors();
    });
  }

  for (const code of SWEEP_LOCALES) {
    const base = code === 'cn' ? '' : `/${code}`;
    test(`${code}：全部路由族均无未解析令牌、无未捕获异常`, { tag: ['@viewport-independent'] }, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const i18nWarn = collectI18nWarnings(page);
      const paths = routeFamilies(base);
      for (const path of paths) {
        await page.goto(path);
        await expect(page.locator('#app')).toBeVisible();
        await expect.poll(async () => (await page.locator('body').innerText()).length, {
          message: `${code} ${path} 内容未就位`, timeout: 20000,
        }).toBeGreaterThan(150);
        const body = await page.locator('body').innerText();
        expect(body, `${code} ${path} 出现未解析令牌`).not.toContain('$t:');
        /* 路由标题（`meta.titleKey` → translate）也不得残留未解析令牌 */
        expect(await page.title(), `${code} ${path} 标题残留未解析令牌`).not.toContain('$t:');
        /* 全路由只测**整页**横向溢出（长文本最集中的目录卡与规则正文都在这批页面上）。
           不用元素级的 `expectNoUnknownOverflow`：它会把横向滚动容器内的元素判为未知溢出
           （`.nk-guide-link` 是 `white-space:nowrap` 的列头链，实测在 1280 视口下 right=1422
           但整页 `scrollWidth` 并未超出 ⇒ 属检测口径问题，而该白名单按纪律不得为「修绿」堆条目）。 */
        const pageOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(pageOverflow, `${code} ${path} 整页横向溢出 ${pageOverflow}px`).toBeLessThanOrEqual(1);
      }
      expect(i18nWarn(), `缺键告警：${i18nWarn().slice(0, 3)}`).toEqual([]);
      assertNoErrors();
    });
  }
});
