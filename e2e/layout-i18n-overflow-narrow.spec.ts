import { test, expect } from '@playwright/test';
import { collectConsoleIssues } from './helpers';
import {
  RISK_LOCALES, detailRoutes, prefixOf, scanDefects, settleForMeasurement,
} from './i18n-overflow.shared';

/**
 * 布局验收：多语言长文案下的排版破损 —— 最窄档（320）。
 *
 * 存在理由、P0~P3 处置分级与三类判据见 `i18n-overflow.shared.ts` 文件头（本文件同口径，不重复）。
 * 本文件只承担 **最窄断点面（320）**：视口档不同 ⇒ 溢出根因不同（桌面档是译文撑破容器、手机档是固定卡宽 /
 * 列数、320 档是窄容器里不收缩的短标签），故按档拆文件——`--shard` 只在**文件**边界生效，
 * 不拆就没有并行余地（耗时数字不记：它们必然过期）。
 *
 * 标签：用例内自钉视口 ⇒ 必须静态声明 `@viewport-pinned`（mobile-chromium 以 `grepInvert` 跳过）。
 * 期望值一律**不写死**：路由取迭代范围清单，详情 id 从随站数据派生。
 */
test.describe('布局验收：多语言长文案 · 最窄档（320）', () => {
  /* 最窄档（320px）：`e2e/shell.spec.ts` 的既有 320 契约只查「元素越出视口」且**只跑缺省语言**
     ⇒ 查不到「长译文把内容撑出容器后被祖先 `overflow: hidden` 吃掉」（不产生布局越界）。
     实测该档基线 hardClipX=56 / spillX=48 / hardClipY=56 / escapeX=537，是本轮修复前
     缺陷最密集的一档，且随语言不同而不同（cn 恒 0）⇒ 必须按语言覆盖。
     范围收窄到详情族代表页：320 档下目录族的溢出根因已由 390 那条覆盖，
     而详情族的 `__hero__camp` / 索引条属于另一类根因（窄容器里不收缩的短标签）。 */
  test('最窄档（320）：长文案不撑破容器亦不被祖先静默裁掉', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 320, height: 720 });

    const failures: string[] = [];
    /* 全部 5 个详情族：320 档的残留恰好集中在详情族（`__hero__camp` 不收缩、索引条项内 `nowrap`），
       且**按语言分化**（cn 恒 0、fr 最重）⇒ 必须按语言逐个跑。 */
    const routes = detailRoutes('');
    for (const code of RISK_LOCALES) {
      const base = prefixOf(code);
      for (const route of routes) {
        await page.goto(base + route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${code}/${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${code}/${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${code}/${route.name} 横向外溢 ${x}`);
      }
    }
    expect(failures, '320 档布局破损').toEqual([]);
    assertNoErrors();
  });
});
