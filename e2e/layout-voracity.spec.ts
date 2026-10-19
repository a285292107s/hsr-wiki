import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { collectConsoleIssues, readJson } from './helpers';
import { collectNavAnchors, navEntryReachable, noUnknownOverflow } from './layout.shared';

test.describe('布局验收：贪饕污染专题页（ADR 0025）', () => {
  test('/voracity：H1、八区块、怪物内链、侧栏前缀性、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const vor = readJson<{
      activity?: { scores?: number[]; progress_steps?: unknown[]; buff_levels?: unknown[] };
      invasion?: { levels?: unknown[]; stages?: { invasion_id: number; scopes?: { mode: string; season_id: string }[] }[] };
      statuses?: unknown[];
      tutorials?: unknown[];
      affixes?: { name: string }[];
    }>('public/data/cn/voracity.json');
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-hero__title')).toHaveText('贪饕污染');
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
    await expect.poll(() => page.locator('.nk-vor-mon__name--link').count()).toBeGreaterThan(0);
    expect(
      await page.locator('.nk-vor-mon__name--link').evaluateAll((els) =>
        els.every((el) => /^\/monster\/\d+$/.test(el.getAttribute('href') || '')),
      ),
    ).toBe(true);
    const expectedScopes = [...(vor.invasion?.stages ?? [])]
      .sort((a, b) => a.invasion_id - b.invasion_id)
      .flatMap((s) => s.scopes ?? []);
    expect(expectedScopes.length).toBeGreaterThan(0);
    const scopeHrefs = await page.locator('.nk-vor-scope').evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') || ''),
    );
    expect(scopeHrefs).toEqual(expectedScopes.map((sc) => `/endgame/${sc.mode}/${sc.season_id}`));
    expect(scopeHrefs.every((h) => /^\/endgame\/(maze|story|boss|peak)\/\d+$/.test(h))).toBe(true);
    const firstInvasionId = Math.min(...(vor.invasion?.stages ?? []).map((s) => s.invasion_id));
    await expect(page.locator('.nk-vor-stgroup__badge').first()).toHaveText(`污染等级 ${firstInvasionId}`);
    const anchors = await collectNavAnchors(page);
    expect(anchors.length).toBeGreaterThan(1);
    const visIdx = anchors.map((a, i) => (a.visible ? i : -1)).filter((i) => i >= 0);
    expect(visIdx).toEqual(Array.from({ length: visIdx.length }, (_, i) => i));
    expect(await navEntryReachable(page, '/voracity'), '/voracity 入口必须可达（底栏或「更多」抽屉）').toBe(true);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('/voracity：hero 与首区块同轴（含分割线），愿力档位「文案在前、读数在后」', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/voracity');
    await expect(page.locator('.nk-vor-sec .nk-title').first()).toBeVisible();

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
    expect(axis!.heroWidth).toBeGreaterThanOrEqual(axis!.secWidth);

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
    expect(new Set(metered.map((r) => r.trackWidth)).size, '各档读数条必须同宽').toBe(1);
    expect(
      metered.filter((r) => Math.abs(r.fillPct - r.shownPct) > 2).map((r) => `${r.fillPct}% vs ${r.shownPct}%`),
      '填充比例必须与该档显示的百分比一致',
    ).toEqual([]);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
