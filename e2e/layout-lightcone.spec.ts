import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson } from './helpers';
import { noUnknownOverflow } from './layout.shared';

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
    expect(
      clipped.map((c) => `${c.text}（可用 ${c.avail}px / 需 ${c.need}px）`),
      '适配角色名不得被 ellipsis 截断（列宽下限须覆盖最长名）',
    ).toEqual([]);

    await noUnknownOverflow(page);
    assertNoErrors();
  });
});
