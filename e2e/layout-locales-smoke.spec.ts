import { test, expect } from '@playwright/test';
import {
  HAN_OK, HAN_RE, SWEEP_SET, charId, collectI18nWarnings, dictOf, roleId,
} from './locales-smoke.shared';
import { LOCALES } from '../src/lib/i18n/locales';
import { SITE_NAME } from '../src/lib/constants';
import { collectConsoleIssues, expectNoUnknownOverflow, waitForSettled } from './helpers';

test.describe('全语言冒烟 · 首页与角色详情', () => {
  for (const loc of LOCALES.filter((l) => SWEEP_SET.has(l.code))) {
    const base = loc.prefix ? `/${loc.prefix}` : '';
    test(`${loc.code}：首页与角色详情无未解析令牌、非中日韩无中文残留`, { tag: ['@viewport-independent'] }, async ({ page }) => {
      const { assertNoErrors } = collectConsoleIssues(page);
      const i18nWarn = collectI18nWarnings(page);
      for (const path of [`${base}/`, `${base}/character/${charId()}`]) {
        await page.goto(path);
        await expect(page.locator('#app')).toBeVisible();
        await expect.poll(async () => (await page.locator('body').innerText()).length, {
          message: `${loc.code} ${path} 内容未就位`, timeout: 20000,
        }).toBeGreaterThan(200);
        const body = await page.locator('body').innerText();
        expect(body.length, `${loc.code} ${path} 渲染内容过少`).toBeGreaterThan(200);
        expect(body, `${loc.code} ${path} 出现未解析令牌`).not.toContain('$t:');
        const title = await page.title();
        expect(title, `${loc.code} ${path} 标题为空或残留未解析令牌`).not.toContain('$t:');
        expect(title.trim().length, `${loc.code} ${path} 标题为空`).toBeGreaterThan(0);
        await expect(page.locator('html')).toHaveAttribute('lang', loc.culture);
        if (path === `${base}/`) {
          await expect(page.locator('meta[name="description"]'))
            .toHaveAttribute('content', dictOf(loc.code)['meta.description']!);
        }
        await waitForSettled(page);
        await expectNoUnknownOverflow(page);
        if (path === `${base}/` && !HAN_OK.has(loc.code)) {
          const text = body.split(SITE_NAME).join('');
          const hits = text.match(new RegExp(HAN_RE, 'g')) ?? [];
          expect(hits.length, `${loc.code} 首页有 ${hits.length} 处中文残留：${text.slice(0, 120)}`).toBe(0);
        }
      }
      if (!HAN_OK.has(loc.code)) {
        await page.goto(`${base}/currency/role/${roleId()}`);
        await expect(page.locator('.nk-crole-layer__pname').first()).toBeVisible({ timeout: 20000 });
        const names = (await page.locator('.nk-crole-layer__pname').allTextContents()).map((v) => v.trim());
        expect(names.length, `${loc.code} 属性行应有内容`).toBeGreaterThan(0);
        const bad = names.filter((v) => HAN_RE.test(v) || /^[A-Za-z]+(AddedRatio|Delta|Base|MaxSP)$/.test(v));
        expect(bad, `${loc.code} 属性行露中文或原始枚举键：${bad.slice(0, 3)}`).toEqual([]);

        const descText = (await page.locator(
          '.nk-crole-skill__desc, .nk-crole-skill__simple, .nk-crole-equip__desc, .nk-crole-timeline__desc',
        ).allTextContents()).join('\n');
        expect(descText, `${loc.code} 描述残留占位符`).not.toContain('{PROP:');
        const descHan = descText.match(new RegExp(HAN_RE, 'g')) ?? [];
        expect(descHan.length, `${loc.code} 描述里 ${descHan.length} 处中文：${descText.slice(0, 100)}`).toBe(0);
      }
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
});
