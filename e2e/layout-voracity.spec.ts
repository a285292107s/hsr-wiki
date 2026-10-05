import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson } from './helpers';
import { collectNavAnchors, noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：贪饕污染专题页（ADR 0025） —— layout 验收层（语义契约 + 数值规格）分文件之一。
 *
 * 拆分动因：`fullyParallel: false` 下**文件内**串行，单文件 layout（74 用例 / 469s）把全量墙钟
 * 锁死在 6.6 分钟（a11y 仅 85s 跑完后两个 worker 空转）。按 describe 边界拆开后文件级并行生效，
 * 每条用例的隔离性与拆分前完全一致（文件内本就串行），故已记录的并发 flake 纪律不受影响。
 *
 * `@viewport-pinned` 标签：凡用例内自行 `setViewportSize(...)` 固定视口者，必须在 `test(...)`
 * 第二参传该标签（mobile-chromium 以 `grepInvert` 跳过，视口已由用例钉死）。标签须静态书写，
 * 动态 annotation 对收集期过滤无效。
 *
 * 数值断言的三种合法形态：① 令牌派生（`readTokenPx` / `computedNumber`）；② 相对关系（序、等值、
 * 整数倍、跨断点只放大不缩小）；③ 数据派生（期望值从 `public/data/cn/**.json` 读）。
 * 绝对 px 只允许出现在跨会话不得漂移的契约值。**禁止新增** `toHaveCSS(<绝对值>)` 一类断言。
 *
 * 跨块共用的取值原语与数据派生在 `e2e/layout.shared.ts`；不变量层在 `e2e/guards.spec.ts`。
 */

test.describe('布局验收：贪饕污染专题页（ADR 0025）', () => {
  test('/voracity：H1、八区块、怪物内链、侧栏前缀性、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    // 期望值取自 voracity.json：区块数由数据存在性驱动，关卡→赛季链接逐条同序
    const vor = readJson<{
      activity?: { scores?: number[]; progress_steps?: unknown[]; buff_levels?: unknown[] };
      invasion?: { levels?: unknown[]; stages?: { invasion_id: number; scopes?: { mode: string; season_id: string }[] }[] };
      statuses?: unknown[];
      tutorials?: unknown[];
      affixes?: { name: string }[];
    }>('public/data/cn/voracity.json');
    await page.goto('/voracity');
    // H1 是站点自创页面名（数据里的活动名是「镇伏『贪饕』，汇聚愿力」，不承担页面标题）
    await expect(page.locator('.nk-vor-hero__title')).toHaveText('贪饕污染');
    // 区块数 = 数据存在性驱动的区块数（overview/scores/invasion/stages/statuses/tutorials/affixes）+ 恒在的同形词说明
    const dataDrivenSections = [
      !!vor.activity,
      !!(vor.activity?.scores?.length || vor.activity?.progress_steps?.length),
      !!(vor.invasion?.levels?.length || vor.activity?.buff_levels?.length),
      !!vor.invasion?.stages?.length,
      !!vor.statuses?.length,
      !!vor.tutorials?.length,
      !!vor.affixes?.length,
    ].filter(Boolean).length;
    const secnav = page.locator('.nk-vor-secnav .nk-secnav__btn');
    await expect(secnav).toHaveCount(dataDrivenSections + 1);
    await expect(secnav.first()).toContainText('玩法概览');
    await expect(secnav.last()).toContainText('同形词说明');
    await expect(page.locator('#vor-affixes .nk-vor-affix')).toHaveCount(vor.affixes!.length);
    // 波及关卡的怪物项必须内链到敌人详情（detail_id 非空口径）
    await expect.poll(() => page.locator('.nk-vor-mon__name--link').count()).toBeGreaterThan(0);
    expect(
      await page.locator('.nk-vor-mon__name--link').evaluateAll((els) =>
        els.every((el) => /^\/monster\/\d+$/.test(el.getAttribute('href') || '')),
      ),
    ).toBe(true);
    // 关卡 → 所属终局赛季的闭环（ADR 0026）：链接逐条同序等于数据里的 scopes（同组内按 invasion_id 升序）
    const expectedScopes = [...(vor.invasion?.stages ?? [])]
      .sort((a, b) => a.invasion_id - b.invasion_id)
      .flatMap((s) => s.scopes ?? []);
    expect(expectedScopes.length).toBeGreaterThan(0);
    const scopeHrefs = await page.locator('.nk-vor-scope').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    expect(scopeHrefs).toEqual(expectedScopes.map((sc) => `/endgame/${sc.mode}/${sc.season_id}`));
    expect(scopeHrefs.every((h) => /^\/endgame\/(maze|story|boss|peak)\/\d+$/.test(h))).toBe(true);
    // 侵蚀等级徽标文案（站点术语「污染等级 N」）与数据里的分组号一致
    const firstInvasionId = Math.min(...(vor.invasion?.stages ?? []).map((s) => s.invasion_id));
    await expect(page.locator('.nk-vor-stgroup__badge').first()).toHaveText(`污染等级 ${firstInvasionId}`);
    // 侧栏：本页为内容板块，锚点可见性仍是规范序前缀（不写死项数）
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    // 当前板块在侧栏内处于激活态（导航第 8 项入口可达）
    await expect(page.locator('.ui-sidebar a[href="/voracity"]')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/voracity：hero 与首区块同轴（含分割线），愿力档位「文案在前、读数在后」', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-sec .nk-title').first()).toBeVisible();

    /* 回归闸（2026-10 实测缺陷）：hero 是 `.nk-page--detail`（纵向 flex）的直接子项，只写
       `max-width + margin: 0 auto` 会被 auto 外边距顶掉 `align-items: stretch`，盒子塌成内容宽
       （1440 档实测 186px vs 分区 952px）——标题看着像「居中式 hero」、hero 分割线缩成一小截，
       与下方分区全都不同轴。宽度须显式 100%，横向内距须与 `.nk-panel` 同值。 */
    const axis = await page.evaluate(() => {
      const rect = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? el.getBoundingClientRect() : null;
      };
      const hero = rect('.nk-vor-hero');
      const heroTitle = rect('.nk-vor-hero__title');
      const sec = rect('.nk-vor-sec');
      const secTitle = rect('.nk-vor-sec .nk-title');
      const after = getComputedStyle(document.querySelector('.nk-vor-hero')!, '::after');
      if (!hero || !heroTitle || !sec || !secTitle) return null;
      return {
        heroTitleLeft: Math.round(heroTitle.left),
        secTitleLeft: Math.round(secTitle.left),
        ruleLeft: Math.round(hero.left + parseFloat(after.left)),
        ruleRight: Math.round(hero.right - parseFloat(after.right)),
        secRight: Math.round(sec.right),
        heroWidth: Math.round(hero.width),
        secWidth: Math.round(sec.width),
      };
    });
    expect(axis, 'hero / 区块节点缺失').not.toBeNull();
    expect(axis!.heroTitleLeft, 'hero 标题必须与首区块标题同轴').toBe(axis!.secTitleLeft);
    expect(axis!.ruleLeft, 'hero 分割线左端必须落在同一条内容轴上').toBe(axis!.secTitleLeft);
    expect(axis!.ruleRight, 'hero 分割线右端必须与区块右缘对齐').toBe(axis!.secRight);
    // 塌陷判据：hero 盒不得窄于区块盒（曾经 186px vs 952px）
    expect(axis!.heroWidth).toBeGreaterThanOrEqual(axis!.secWidth);

    /* 阅读序：一行两段信息的先后不能反——先给「这是哪一档」，再给「走到多少」。
       旧形态把读数条放在文案之上且 `flex: 1` 拉满区块宽（~880px），% 被推到行尾。 */
    const rows = await page.locator('.nk-vor-step').evaluateAll((els) =>
      els.map((el) => {
        const desc = el.querySelector('.nk-vor-step__desc');
        const meter = el.querySelector('.nk-vor-step__meter');
        const track = el.querySelector('.nk-vor-step__track');
        const fill = el.querySelector('.nk-vor-step__fill');
        const pct = el.querySelector('.nk-vor-step__pct');
        const sec = el.closest('.nk-vor-sec');
        const trackW = track ? track.getBoundingClientRect().width : 0;
        const fillW = fill ? fill.getBoundingClientRect().width : 0;
        return {
          hasPct: !!pct,
          descBeforeMeter: desc && meter ? desc.getBoundingClientRect().top <= meter.getBoundingClientRect().top : true,
          trackWidth: Math.round(trackW),
          fillPct: trackW > 0 ? Math.round((fillW / trackW) * 100) : 0,
          shownPct: Math.round(parseFloat((pct?.textContent || '0').replace('%', ''))),
          secWidth: sec ? Math.round(sec.getBoundingClientRect().width) : 0,
        };
      }),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => !r.descBeforeMeter).length, '档位文案必须排在读数之前').toBe(0);
    const metered = rows.filter((r) => r.hasPct);
    expect(metered.length).toBeGreaterThan(0);
    // 读数条是「行内读数」：整列同宽（对齐成一条竖线），且填充比例必须等于同一行显示的百分比
    expect(new Set(metered.map((r) => r.trackWidth)).size, '各档读数条必须同宽').toBe(1);
    expect(
      metered.filter((r) => Math.abs(r.fillPct - r.shownPct) > 2).map((r) => `${r.fillPct}% vs ${r.shownPct}%`),
      '填充比例必须与该档显示的百分比一致',
    ).toEqual([]);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
