import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson } from './helpers';
import { noUnknownOverflow } from './layout.shared';

/**
 * 布局验收：光锥详情页 —— layout 验收层（语义契约 + 数值规格）分域文件之一。
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

/** 取推荐条目最多的光锥当样本（名字长度覆盖最全，见下方 describe 的判据） */
const SAMPLE_ID = 24000;

interface LightconeDetail {
  id: number;
  recommend_chars?: { id: number; rank: number }[];
}
interface CharacterRow {
  id: number;
  name: string;
}

const detail = readJson<LightconeDetail>(`public/data/cn/light_cones/${SAMPLE_ID}.json`);
const charName = new Map(
  readJson<CharacterRow[]>('public/data/cn/characters.json').map((c) => [String(c.id), c.name]),
);
const expectNames = (detail.recommend_chars || []).map((r) => charName.get(String(r.id)));

test.describe('布局验收：光锥详情页 · 适配角色', () => {

  test('条目与数据逐条对应，且角色名一个都不许被截断', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto(`/lightcone/${SAMPLE_ID}`);
    await expect(page.locator('.nk-lc-adapt__item')).toHaveCount(expectNames.length);

    // 文案按数据派生（recommend_chars 序 = DOM 序），同时逐条量「名字是否被裁」
    const items = await page.locator('.nk-lc-adapt__name').evaluateAll((els) =>
      els.map((el) => ({
        text: el.textContent?.trim() ?? '',
        clipped: el.scrollWidth > el.clientWidth + 1,
        avail: Math.round(el.getBoundingClientRect().width),
        need: el.scrollWidth,
      })),
    );
    expect(items.map((i) => i.text)).toEqual(expectNames);
    const clipped = items.filter((i) => i.clipped);
    // 失败时把「哪个名字、差多少 px」带进报告——这条断言就是 2026-10 那次「名字被截成 开拓者·同…」的回归闸
    expect(
      clipped.map((c) => `${c.text}（可用 ${c.avail}px / 需 ${c.need}px）`),
      '适配角色名不得被 ellipsis 截断（列宽下限须覆盖最长名）',
    ).toEqual([]);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
