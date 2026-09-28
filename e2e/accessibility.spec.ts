import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForCatalogCards } from './helpers';

/**
 * 可访问性扫描（WCAG，axe-core）
 *
 * 每页一次 analyze。断言策略：
 * - 命中 KNOWN_VIOLATIONS（已裁决的既有缺陷）→ 降级为 warning，仅打印不失败
 * - 新增 serious/critical 违规 → 失败（守住回归防线）
 *
 * KNOWN_VIOLATIONS 为空是**实测结论**，不是遗漏：曾登记一条 color-contrast @
 * 侧边栏激活链接英文小字（ui-sidebar-link__en，半透明主色 ~3.2:1）。核对发现
 * 该违规的 axe impact 为 moderate，被下方 critical||serious 过滤挡在断言之外——
 * 即该豁免从未真正豁免任何东西，且超期提醒也永不触发（whitewash 条目）。
 * 因此移除；若日后确实出现 serious 级 color-contrast 违规，再按实测 target 重新登记。
 *
 * 注意：对比度规则对暗色游戏主题存在误报风险，新增 color-contrast 违规时
 * 先人工复核目标元素再决定 disable 或修复。
 */

interface KnownViolation {
  id: string;
  /** target 的 CSS 选择器指纹（axe node.target 数组 join 后的首段） */
  targetContains: string;
  note: string;
  /** 登记日期（YYYY-MM-DD）。超过 KNOWN_VIOLATION_REVIEW_DAYS 打印复查提醒（P2-1） */
  since: string;
}

/** 已知缺陷超过该天数未复查，运行 a11y 扫描时打印超期提醒 */
const KNOWN_VIOLATION_REVIEW_DAYS = 30;

const KNOWN_VIOLATIONS: KnownViolation[] = [];

const PAGES = [
  { path: '/', label: '首页', wait: null },
  { path: '/character', label: '角色图鉴', wait: () => waitForCatalogCards },
  { path: '/endgame', label: '终局内容', wait: () => waitForCatalogCards },
  { path: '/currency', label: '货币战争 Hub', wait: null },
] as const;

const isKnown = (id: string, target: string): KnownViolation | undefined =>
  KNOWN_VIOLATIONS.find((k) => k.id === id && target.includes(k.targetContains));

for (const { path, label, wait } of PAGES) {
  test(`a11y 扫描：${label} ${path}`, async ({ page }) => {
    await page.goto(path);
    if (wait) await wait()(page);
    // 等首屏稳定后再扫，避免骨架屏阶段误报
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
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
