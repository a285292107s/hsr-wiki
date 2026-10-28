import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, settleAnimations, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

test.describe('布局验收：终局敌方卡内溢出（8 语言，合并自 overflow / overflow-alt）', () => {
  const LANGS = ['cn', 'de', 'ru', 'es', 'fr', 'pt', 'vi', 'th'] as const;

  for (const code of LANGS) {
    test(`/endgame：敌方卡内不横向溢出（${code}）`, { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
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

test.describe('布局验收：赛季页 + 玩法页根 overflow-x:hidden 硬裁切（de / ru）', () => {
  const ROUTES: { name: string; path: string; ready: string }[] = [
    ...['maze/1034', 'story/2026', 'boss/3021', 'peak/9']
      .map((path) => ({ name: `赛季页 ${path}`, path, ready: '#egd-level-tabs [role="tab"]' })),
    ...['maze', 'story', 'boss', 'peak']
      .map((path) => ({ name: `玩法页 ${path}`, path, ready: '.nk-egm__rule' })),
  ];

  for (const code of ['de', 'ru'] as const) {
    test(`/endgame：赛季页 + 玩法页无硬裁切（${code}）`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(300_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      const failures: string[] = [];

      for (const vw of [320, 390]) {
        await page.setViewportSize({ width: vw, height: 900 });
        for (const route of ROUTES) {
          await page.goto(`/${code}/endgame/${route.path}`);
          await settleAnimations(page);
          await page.waitForSelector(route.ready, { timeout: 20_000 });
          const bad = await page.evaluate(() => {
            const root = document.querySelector('.nk-page--detail') as HTMLElement | null;
            if (!root) return ['找不到 .nk-page--detail'];
            const rr = root.getBoundingClientRect();
            const scrollable = (el: Element): boolean => {
              let p = el.parentElement;
              while (p && p !== root) {
                const ox = getComputedStyle(p).overflowX;
                if (ox === 'auto' || ox === 'scroll') return true;
                p = p.parentElement;
              }
              return false;
            };
            const out: string[] = [];
            for (const el of root.querySelectorAll('*')) {
              const r = el.getBoundingClientRect();
              if (r.width <= 0 || r.height <= 0) continue;
              const over = r.right - rr.right;
              if (over <= 1) continue;
              if (scrollable(el)) continue;
              const cls = (el.className || el.tagName).toString().trim().split(/\s+/)[0];
              out.push(`${cls} 越出页根右缘 ${Math.round(over)}px`);
            }
            return [...new Set(out)].slice(0, 6);
          });
          for (const b of bad) failures.push(`${code}@${vw} ${route.name}: ${b}`);
        }
      }

      expect(failures, `${code}：赛季页 / 玩法页越出根右缘的元素（overflow-x:hidden 下不可达）`).toEqual([]);
      assertNoErrors();
    });
  }
});
