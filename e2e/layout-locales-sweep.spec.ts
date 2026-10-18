import { test, expect } from '@playwright/test';
import {
  SWEEP_LOCALES, collectI18nWarnings, routeFamilies,
} from './locales-smoke.shared';
import { collectConsoleIssues } from './helpers';

/**
 * 全语言冒烟 —— 全路由族扫描。
 *
 * 完整存在理由与判据见 `locales-smoke.shared.ts` 文件头（本文件同口径，不重复）。
 * 本文件只承担 **风险语言 × 全部路由族（25 条路径）**：这一项成本高（每语言 25 次导航），故只跑风险语言子集，全量由 ci-full.yml 周跑承担。
 *
 * 拆文件而非加片：`--shard` 只在**文件**边界生效，单文件内的 for 循环无论几条都挤在一片里。
 * 风险语言子集由 `SMOKE_SCOPE=fast` 控制，全量矩阵见 `ci-full.yml`。
 */
test.describe('全语言冒烟 · 全部路由族', () => {
  for (const code of SWEEP_LOCALES) {
    const base = code === 'cn' ? '' : `/${code}`;
    test(`${code}：全部路由族均无未解析令牌、无未捕获异常`, { tag: ['@viewport-independent'] }, async ({ page }) => {
      /* 用例级预算：本用例把 25 条路由串行走一遍（dev 模式每次 `goto` 都是整页重载），CI 实测
         29–34s，越过 Playwright 默认 30s ⇒ 表现为「某条路径内容未就位」的**假缺陷**（失败 path
         随耗尽位置漂移，同一用例 retry 有时 28.9s 通过）。每路由的「内容就位」判据仍是 20s 的
         `expect.poll`，这里只是把「25 次导航之和」纳入预算——真出现某页挂住仍会在 20s 落到该 path。 */
      test.setTimeout(120_000);
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
           不用元素级的 `expectNoUnknownOverflow`：它会把横向滚动容器内的元素判为未知溢出，口径不同。
           但整页口径**查不到「被撑出列框」这类缺陷**：`<html>` 上是 `overflow: clip`，长文本撑破
           列框时 `scrollWidth` 恒等于 `clientWidth`（本行断言永远为 0），而列框与祖先链全是
           `overflow: visible` ⇒ 越出的部分直接压到相邻列上。此前把 `.nk-guide-link` 在 1280 下
           right=1422 记成「检测口径问题」是**误判**：那是 i18n 迁移把含模式名的 aria 模板当成了
           可见文本，实测 145/208 个终局列头被撑破、最重 +216px。该类缺陷现由
           `layout-endgame.spec.ts`（列头逐子项几何）与 `layout-i18n-overflow.spec.ts`
           （多语言长文案）分别覆盖，本文件不重复建断言。 */
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
