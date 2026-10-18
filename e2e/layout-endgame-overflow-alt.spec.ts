import { test, expect } from '@playwright/test';
import { collectConsoleIssues, computedNumber, fontPx, readJson, readTokenPx, waitForCatalogCards } from './helpers';
import { CN_NUM, cnBigNumber, expectTokenNumber, floorBossName, floorGuide, grouped, itemNameMap, lastWaveMonster, levelTabLabels, monsterBadge, noUnknownOverflow, peakTabId, peakTabLabels, pollutedMonsters, pollutedSeasonHrefs, pollutedSummons, pollutionEntries, rewardNames, rewardNums, seasonData, seasonTabLabels, stageGuide, summonBadge, summonsOf, tierceNodeBossNames } from './layout.shared';

/**
 * 布局验收：终局敌方卡内的**元素级**横向溢出 —— fr / pt / vi / th。
 *
 * 拆成两个文件而不是一条 gross 用例循环八语言：`--shard` 的切分单位是**文件 × project**
 * （同一文件内的多条永远进同一片）⇒ 光把 for 循环改成多条 `test()` 拿不到并行，必须物理分文件。
 * 判据与取值范围与拆前逐字相同（耗时数字不记：它们必然过期）。
 *
 * 判据为什么落在卡片自身而不是页面：页面级溢出恒为 0（`html` 上有 `overflow: clip`），
 * `noUnknownOverflow` 与既有溢出守卫全都看不见它——只有逐卡量 `scrollWidth` 才看得见。
 */
test.describe('布局验收：终局敌方卡内溢出（fr / pt / vi / th）', () => {
  /**
   * 敌方卡内**元素级**横向溢出：判据 = 任一敌方卡 `scrollWidth > clientWidth`（含 +1px 容差）。
   *
   * 存在理由（这条缺陷的可见性极差，值得单列）：召唤物行的行长由「图 26px + 名 + 污染徽标」共同
   * 决定，flex 项默认 `min-width: auto` 不会缩到 min-content 之下 ⇒ 长译文名会把该行 min-content
   * 顶到手机档可用宽之外，整行拒绝收缩、溢出沿 `.nk-egd-summon__list → .nk-egd-summons →
   * .nk-egd-mon__data` 一路撑破卡片。实测 en 4 / es 40 / fr 28 / pt 25 / ru 21px。
   *
   * **页面级溢出恒为 0（`html` 上有 `overflow: clip`），`noUnknownOverflow` 与既有溢出守卫全都
   * 看不见它**——只有逐卡量 `scrollWidth` 才看得见。故判据落在卡片与列表自身，不落在页面上。
   *
   * **一语言一条用例**：gross 形态（一条里循环 4 语言）在条数上算 1、在耗时上算 4，
   * `--shard` 按条数均分时会把这 4 份工作整块塞进一片。拆开后 8 条能摊到多台 runner。
   */
  const LANGS = ['fr', 'pt', 'vi', 'th'] as const;

  for (const code of LANGS) {
    test(`/endgame：敌方卡内不横向溢出（${code}）`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(240_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 390, height: 844 });
      const failures: string[] = [];

      /** 量之前先等布局定下来：点完 tab 立刻采样会把 reflow 中间态记成溢出（实测假阳性：
       *  boss/3020 报 19/35px，稳定态恒为 0）。判据只在稳定态成立。 */
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

      // ① 忘却之庭星启节点：长译文下星启节点 3 是溢出点，逐节点扫全
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

      // ② 末日幻影 3020：召唤物名最长的一页（ru 逐字竖排与 ru/id 溢出的实测落点）
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
