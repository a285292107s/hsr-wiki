import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForCatalogCards, waitForSettled } from './helpers';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const AXE_OPTIONS = { rules: { 'target-size': { enabled: true } } } as const;

interface KnownViolation {
  id: string;
  targetContains: string;
  note: string;
  since: string;
}

const KNOWN_VIOLATION_REVIEW_DAYS = 30;

const KNOWN_VIOLATIONS: KnownViolation[] = [];

const PAGES = [
  { path: '/', label: '首页', wait: () => (page: Page) => page.waitForSelector('.nk-home__ledger-item a[href], .nk-home__empty, .nk-error-state', { timeout: 15_000 }) },
  { path: '/character', label: '角色图鉴', wait: () => waitForCatalogCards },
  { path: '/character/1001', label: '角色详情', wait: () => (page: Page) => waitForCatalogCards(page, '.nk-hero--char') },
  { path: '/lightcone/20000', label: '光锥详情', wait: () => (page: Page) => page.waitForSelector('.nk-hero--lc', { timeout: 15_000 }) },
  { path: '/lightcone/24000', label: '光锥详情·适配角色', wait: () => (page: Page) => page.waitForSelector('.nk-lc-adapt__item', { timeout: 15_000 }) },
  { path: '/endgame', label: '终局内容', wait: () => waitForCatalogCards },
  { path: '/endgame/maze', label: '玩法详情·忘却之庭', wait: () => (page: Page) => page.waitForSelector('.nk-egm__rule', { state: 'attached', timeout: 15_000 }) },
  { path: '/endgame/boss/3021', label: '终局详情·含污染', wait: () => (page: Page) => page.waitForSelector('.nk-egd-tabs [role="tab"]', { state: 'attached', timeout: 15_000 }) },
  { path: '/endgame/boss/3020', label: '终局详情·星启看板', wait: () => async (page: Page) => {
    await page.locator('#egd-level-tab-tierce').click();
    await page.waitForSelector('.nk-egd-guide .nk-egd-trait', { state: 'attached', timeout: 15_000 });
  } },
  { path: '/endgame/peak/9', label: '终局详情·异相仲裁单关', wait: () => async (page: Page) => {
    await page.locator('#egd-level-tab-peak-904').click();
    await page.locator('#egd-peak-node-tab-hard').click();
    await page.waitForSelector('#egd-peak-board[aria-labelledby="egd-peak-node-tab-hard"]', { state: 'attached', timeout: 15_000 });
  } },
  { path: '/currency', label: '货币战争 Hub', wait: null },
  { path: '/voracity', label: '贪饕污染', wait: () => (page: Page) => page.waitForSelector('.nk-vor-secnav .nk-secnav__btn', { state: 'attached', timeout: 15_000 }) },
  { path: '/formula', label: '战斗公式', wait: () => (page: Page) => page.waitForSelector('.nk-formula-secnav .nk-secnav__btn', { state: 'attached', timeout: 15_000 }) },
] as const;

const isKnown = (id: string, target: string): KnownViolation | undefined =>
  KNOWN_VIOLATIONS.find((k) => k.id === id && target.includes(k.targetContains));

for (const { path, label, wait } of PAGES) {
  test(`a11y 扫描：${label} ${path}`, async ({ page }) => {
    await page.goto(path);
    if (wait) await wait()(page);
    await waitForSettled(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).options(AXE_OPTIONS).analyze();
    const violations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

    const unknown = violations.filter((v) => {
      const targets = v.nodes.map((n) => n.target.join(' '));
      return !targets.some((t) => isKnown(v.id, t));
    });
    const known = violations.filter((v) => v.nodes.some((n) => isKnown(v.id, n.target.join(' '))));

    for (const v of known) {
      const targets = v.nodes.map((n) => n.target.join(' ')).join(' | ');
      const rec = v.nodes.map((n) => isKnown(v.id, n.target.join(' '))).find(Boolean);
      console.warn(`[a11y 已知违规] ${label}: ${v.id} @ ${targets} — ${rec?.note ?? ''}`);
      if (rec) {
        const days = Math.floor((Date.now() - new Date(rec.since).getTime()) / (24 * 60 * 60 * 1000));
        if (days > KNOWN_VIOLATION_REVIEW_DAYS) {
          console.warn(
            `[a11y 已知违规超期] ${label}: ${rec.id} 登记已 ${days} 天，请人工复查是否已修复（修复后从 KNOWN_VIOLATIONS 移除）：${rec.note}`,
          );
        }
      }
    }

    expect(
      unknown.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
      })),
      `a11y 新增违规：${label}`,
    ).toEqual([]);
  });
}

test('a11y 扫描：角色详情 390×844（手机档底栏文字标签的对比度路径）', { tag: '@viewport-pinned' }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/character/1204');
  await page.waitForSelector('.nk-stats__stat', { timeout: 15_000 });
  await waitForSettled(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(
    violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
    '手机档 WCAG 2.2 AA：不得有 serious/critical 违规',
  ).toEqual([]);
});

test('a11y 扫描：终局玩法页 390×844', { tag: '@viewport-pinned' }, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/endgame/maze');
  await page.waitForSelector('.nk-egm__rule', { state: 'attached', timeout: 15_000 });
  await waitForSettled(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).options(AXE_OPTIONS).analyze();
  const violations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(
    violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
    '终局玩法页 390 档：不得有 serious/critical 违规',
  ).toEqual([]);
});

test('a11y 扫描：终局赛季页 390×844 + 全部关架子 tab', { tag: '@viewport-pinned' }, async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/endgame/maze/1034');
  const tabs = page.locator('#egd-level-tabs [role="tab"]');
  await tabs.first().waitFor({ state: 'attached', timeout: 20_000 });
  await waitForSettled(page);
  const count = await tabs.count();
  expect(count, '/endgame/maze/1034 必须渲染层级子 tab，否则这条轮扫没有被测对象').toBeGreaterThan(1);

  const failures: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const tab = tabs.nth(i);
    const label = (await tab.textContent())?.trim() || `#${i}`;
    await tab.click();
    await expect(tab, `第 ${i + 1} 个 tab 应成为活动档`).toHaveAttribute('aria-selected', 'true');
    await waitForSettled(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).options(AXE_OPTIONS).analyze();
    for (const v of results.violations.filter((x) => x.impact === 'critical' || x.impact === 'serious')) {
      const targets = v.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(' | ');
      failures.push(`${label}: ${v.id}(${v.impact}) ${v.nodes.length} 节点 @ ${targets}`);
    }
  }
  expect(failures, '终局赛季页 390 档：每个关架子 tab 都不得有 serious/critical 违规').toEqual([]);
});

test.describe('prefers-reduced-motion：动画必须立即结束', () => {
  const ROUTES = ['/', '/character', '/monster', '/voracity', '/currency/role/1001'] as const;

  for (const route of ROUTES) {
    test(`${route}：无仍在跑的动画`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      await waitForSettled(page);
      const running = await page.evaluate(() => {
        const out: string[] = [];
        const read = (el: Element, pseudo?: string) => {
          const cs = getComputedStyle(el, pseudo);
          const name = cs.animationName;
          if (!name || name === 'none') return;
          const dur = parseFloat(cs.animationDuration) || 0;
          if (dur <= 0) return;
          const delay = parseFloat(cs.animationDelay) || 0;
          if (dur > 0.001 || delay > 0.001 || cs.animationIterationCount !== '1') {
            const cls = (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.');
            out.push(`${cls || el.tagName.toLowerCase()}${pseudo ?? ''} ${name} ${dur}s/${cs.animationIterationCount}`);
          }
        };
        for (const el of document.querySelectorAll('*')) {
          const b = el.getBoundingClientRect();
          if (b.width < 4 || b.height < 4) continue;
          read(el);
          for (const p of ['::before', '::after']) {
            const cs = getComputedStyle(el, p);
            if (cs.content && cs.content !== 'none' && cs.content !== 'normal') read(el, p);
          }
        }
        return out;
      });
      expect(running, `${route}：reduce 下仍有动画在跑`).toEqual([]);
    });
  }
});
