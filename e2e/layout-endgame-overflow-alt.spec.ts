import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

test.describe('布局验收：终局敌方卡内溢出（fr / pt / vi / th）', () => {
  const LANGS = ['fr', 'pt', 'vi', 'th'] as const;

  for (const code of LANGS) {
    test(`/endgame：敌方卡内不横向溢出（${code}）`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(240_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 390, height: 844 });
      const failures: string[] = [];

      const measure = async (): Promise<string[]> => {
        await page.waitForTimeout(600);
        return page.evaluate(() => {
          const out: string[] = [];
          for (const card of document.querySelectorAll('.nk-egd-mon')) {
            const over = card.scrollWidth - card.clientWidth;
            if (over > 1) {
              const path = [...card.querySelectorAll('*')]
                .filter((el) => el.scrollWidth - el.clientWidth > 0)
                .map((el) => String(el.className).split(/\s+/)[0]);
              out.push(`敌方卡内溢出 ${Math.round(over)}px（${path.join(' < ') || '卡自身'}）`);
            }
            const list = card.querySelector('.nk-egd-summon__list');
            if (list && list.scrollWidth - list.clientWidth > 1) {
              out.push(`召唤物列表溢出 ${Math.round(list.scrollWidth - list.clientWidth)}px`);
            }
          }
          return out;
        });
      };

      await page.goto(code === 'cn' ? '/endgame/maze/1036' : `/${code}/endgame/maze/1036`);
      await page.waitForSelector('#egd-level-tabs [role="tab"]', { timeout: 30_000 });
      await page.locator('#egd-level-tab-tierce').click();
      await page.waitForSelector('.nk-egd-mon', { timeout: 30_000 });
      const nodeTabs = page.locator('.nk-egd-nodecards [role="tab"]');
      const nodeCount = await nodeTabs.count();
      for (let i = 0; i < nodeCount; i += 1) {
        await nodeTabs.nth(i).click();
        for (const b of await measure()) failures.push(`maze/1036 节点${i + 1}: ${b}`);
      }

      await page.goto(code === 'cn' ? '/endgame/boss/3020' : `/${code}/endgame/boss/3020`);
      await page.waitForSelector('#egd-level-tabs [role="tab"]', { timeout: 30_000 });
      await page.waitForSelector('.nk-egd-mon', { timeout: 30_000 });
      const levelTabs = page.locator('#egd-level-tabs [role="tab"]');
      for (let i = 0; i < await levelTabs.count(); i += 1) {
        await levelTabs.nth(i).click();
        await page.waitForSelector('.nk-egd-mon', { timeout: 30_000 });
        const halves = page.locator('.nk-egd-nodecards [role="tab"]');
        const halfCount = await halves.count();
        for (let j = 0; j < (halfCount > 1 ? halfCount : 1); j += 1) {
          if (halfCount > 1) await halves.nth(j).click();
          for (const b of await measure()) failures.push(`boss/3020 tab${i}/半场${j + 1}: ${b}`);
        }
      }

      expect(failures, `${code}：敌方卡 / 召唤物列表横向溢出（页面级溢出看不见它）`).toEqual([]);
      assertNoErrors();
    });
  }
});
