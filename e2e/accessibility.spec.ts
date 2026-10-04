import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForCatalogCards, waitForSettled } from './helpers';

/**
 * 可访问性扫描（WCAG 2.2 AA，axe-core）
 *
 * **规则集**：显式传 `withTags(WCAG_TAGS)`。此前用 `new AxeBuilder({ page }).analyze()` 走 axe-core
 * 默认标签（只含 WCAG 2.0/2.1 的 A+AA），**2.2 新增规则从未被覆盖**——而全仓口径一直宣称
 * 「WCAG 2.2 AA 目标尺寸」。声明 2.2 之前必须先确认扫描器真按 2.2 跑。
 * 判据出处见 `docs/audit/角色详情页验收标准.md`（B2）。
 *
 * 断言策略：
 * - 命中 KNOWN_VIOLATIONS（已裁决的既有缺陷）→ 降级为 warning，仅打印不失败
 * - 新增 serious/critical 违规 → 失败
 *
 * KNOWN_VIOLATIONS 为空是实测结论，不是遗漏：曾登记一条 color-contrast @
 * 侧边栏激活链接英文小字（ui-sidebar-link__en，半透明主色 ~3.2:1），但其 axe impact 为 moderate，
 * 被下方 critical||serious 过滤挡在断言之外——该豁免从未真正豁免任何东西。
 * 若日后出现 serious 级 color-contrast 违规，再按实测 target 重新登记。
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

interface KnownViolation {
  id: string;
  /** target 的 CSS 选择器指纹（axe node.target 数组 join 后的首段） */
  targetContains: string;
  note: string;
  /** 登记日期（YYYY-MM-DD），超过 KNOWN_VIOLATION_REVIEW_DAYS 打印复查提醒 */
  since: string;
}

/** 已知缺陷超过该天数未复查，运行 a11y 扫描时打印超期提醒 */
const KNOWN_VIOLATION_REVIEW_DAYS = 30;

const KNOWN_VIOLATIONS: KnownViolation[] = [];

const PAGES = [
  { path: '/', label: '首页', wait: null },
  { path: '/character', label: '角色图鉴', wait: () => waitForCatalogCards },
  { path: '/character/1001', label: '角色详情', wait: () => (page: Page) => waitForCatalogCards(page, '.nk-hero--char') },
  // 等光锥 hero 面板出现即数据就绪（入口数据首条 = 首个 3★ 光锥 id 20000）
  { path: '/lightcone/20000', label: '光锥详情', wait: () => (page: Page) => page.waitForSelector('.nk-hero--lc', { timeout: 15_000 }) },
  // 适配角色区块只在「该光锥有官方推荐记录」时渲染（20000 是空态）：另取一份带 chip 的样本单独扫
  { path: '/lightcone/24000', label: '光锥详情·适配角色', wait: () => (page: Page) => page.waitForSelector('.nk-lc-adapt__item', { timeout: 15_000 }) },
  { path: '/endgame', label: '终局内容', wait: () => waitForCatalogCards },
  // 终局详情（含污染等级区块，ADR 0026）：等层级子 tab 出现即数据就绪
  { path: '/endgame/boss/3021', label: '终局详情·含污染', wait: () => (page: Page) => page.waitForSelector('.nk-egd-tabs [role="tab"]', { state: 'attached', timeout: 15_000 }) },
  // 星启看板（ADR 0033）：节点子切换与首领特性整组单卡只在星启 tab 下渲染，先切 tab 再扫
  { path: '/endgame/boss/3020', label: '终局详情·星启看板', wait: () => async (page: Page) => {
    await page.locator('#egd-level-tab-tierce').click();
    await page.waitForSelector('.nk-egd-traits .nk-egd-trait', { state: 'attached', timeout: 15_000 });
  } },
  { path: '/currency', label: '货币战争 Hub', wait: null },
  // 专题页（ADR 0025）：等分区导航出现即数据就绪；无分区导航时首屏仍是骨架屏
  { path: '/voracity', label: '贪饕污染', wait: () => (page: Page) => page.waitForSelector('.nk-vor-secnav .nk-secnav__btn', { state: 'attached', timeout: 15_000 }) },
] as const;

const isKnown = (id: string, target: string): KnownViolation | undefined =>
  KNOWN_VIOLATIONS.find((k) => k.id === id && target.includes(k.targetContains));

for (const { path, label, wait } of PAGES) {
  test(`a11y 扫描：${label} ${path}`, async ({ page }) => {
    await page.goto(path);
    if (wait) await wait()(page);
    // 等首屏稳定（骨架退场 + 字体就绪）后再扫，避免骨架屏阶段误报
    await waitForSettled(page);
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
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

/**
 * 手机档（390×844）单独一条：本文件被 playwright 的 mobile-chromium 项目 `testIgnore` 排除，
 * 而**侧栏底栏只在 <768 档显示文字标签**（≥768 标签 `display: none`）——即手机档独有的对比度路径
 * 此前从未被这条流水线扫过。实测该档曾出现 7 处 serious 级 `color-contrast`
 * （`--text2` 以 0.72 不透明度复合到手机底栏底色 = 4.07:1 < 4.5:1），修在 `tokens.css` 的
 * `.ui-sidebar-link`。本用例把这条路径纳入常规回归。
 */
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
