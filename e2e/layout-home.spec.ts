import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJson, waitForCatalogCards, waitForSettled } from './helpers';
import { noUnknownOverflow } from './layout.shared';

type HomeKind = 'character' | 'lightcone' | 'relic';

interface IndexEntry {
  id: number;
  name: string;
  release_version?: string;
  rarity?: number;
  path?: string;
  element?: string;
}

interface CharacterDetail {
  ranks?: Record<string, { name?: string }>;
}

interface RelicEntry extends IndexEntry {
  pieces?: { type_name?: string }[];
}

const UI_TEXT = readJson<Record<string, string>>('src/lib/i18n/messages/cn.json');
const KIND_LABEL: Record<HomeKind, string> = {
  character: String(UI_TEXT['nav.character'] ?? ''),
  lightcone: String(UI_TEXT['nav.lightcone'] ?? ''),
  relic: String(UI_TEXT['nav.relic'] ?? ''),
};
const LIST_ROUTE: Record<HomeKind, string> = { character: '/character', lightcone: '/lightcone', relic: '/relic' };
const SECTION_ITEM = {
  character: '.nk-home__chars .nk-home__char',
  lightcone: '.nk-home__cones > li.nk-home__cone',
  relic: '.nk-home__relics > article.nk-home__relic',
} as const;

const VERSION = readJson<{ version_label?: string }>('public/data/cn/version.json');
const VERSION_LABEL = String(VERSION.version_label ?? '').trim();

function releaseEntries(file: string): IndexEntry[] {
  return readJson<IndexEntry[]>(`public/data/cn/${file}`)
    .filter((entry) => VERSION_LABEL !== '' && String(entry.release_version ?? '').trim() === VERSION_LABEL);
}

const RELEASE: Record<HomeKind, IndexEntry[]> = {
  character: releaseEntries('characters.json'),
  lightcone: releaseEntries('light_cones.json'),
  relic: releaseEntries('relics.json'),
};
const KINDS: HomeKind[] = ['character', 'lightcone', 'relic'];
const TOTAL = KINDS.reduce((n, kind) => n + RELEASE[kind].length, 0);
const FLAT = KINDS.flatMap((kind) => RELEASE[kind].map((entry) => ({ kind, entry })));
const PRESENT_KINDS = KINDS.filter((kind) => RELEASE[kind].length > 0);

function charIconCounts(id: number): { eidolons: number } {
  const detail = readJson<{ ranks?: Record<string, unknown> }>(`public/data/cn/characters/${id}.json`);
  return { eidolons: Math.min(6, Object.keys(detail.ranks ?? {}).length) };
}

test.describe('布局验收：常规主题', () => {
  test('首页 /：报头 / 版本号 / 本期入册清单与三分区条目总数同源，无溢出无控制台错误', async ({ page }) => {
    const { issues, assertNoErrors } = collectConsoleIssues(page);
    expect(VERSION_LABEL, 'version.json 缺 version_label：本用例的抬头判据失去数据来源').toBeTruthy();
    expect(TOTAL, '本版本三分区应至少有一条增量').toBeGreaterThanOrEqual(1);

    await page.goto('/');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-masthead__title')).toHaveText(/\S/);
    await expect(page.locator('.nk-hub-masthead__tagline')).toHaveText(/\S/);
    await expect(page.locator('.nk-home__version')).toHaveText(VERSION_LABEL);
    await expect(page.locator('.nk-home__stamp-note')).toHaveText('版本上新');
    await expect(page.locator('.nk-home__date')).toHaveText(/\d{4}-\d{2}-\d{2}/);
    await expect(page.locator('.nk-home__ledger-title')).toContainText('本期入册');
    await expect(page.locator('.nk-home__ledger-count')).toHaveText(String(TOTAL));
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(TOTAL, { timeout: 15_000 });

    const rows = await page.locator('.nk-home__ledger-link').evaluateAll((els) =>
      els.map((el) => ({
        href: el.getAttribute('href'),
        kind: (el.querySelector('.nk-home__ledger-kind')?.textContent || '').trim(),
        name: (el.querySelector('.nk-home__ledger-name')?.textContent || '').trim(),
        arrow: !!el.querySelector('.nk-home__ledger-arrow'),
      })),
    );
    expect(rows.length, '入册行数应等于三分区条目总数').toBe(TOTAL);
    for (let i = 0; i < FLAT.length; i += 1) {
      const want = FLAT[i];
      const got = rows[i];
      expect(got.kind, `第 ${i + 1} 行应有分区名`).toBe(KIND_LABEL[want.kind]);
      expect(got.name, `第 ${i + 1} 行应写着条目名`).toBe(want.entry.name);
      expect(got.href, `第 ${i + 1} 行应指向 ${LIST_ROUTE[want.kind]} 下的详情`).toBe(`${LIST_ROUTE[want.kind]}/${want.entry.id}`);
      expect(got.arrow, `第 ${i + 1} 行应有跳转箭头`).toBe(true);
    }

    const appOverflow = await page.evaluate(() => {
      const app = document.querySelector('#nk-home-app') as HTMLElement;
      return { scrollWidth: app.scrollWidth, clientWidth: app.clientWidth };
    });
    expect(appOverflow.scrollWidth, '内部滚动容器不得产生横向滚动').toBeLessThanOrEqual(appOverflow.clientWidth + 1);
    await noUnknownOverflow(page);

    const noise = /Failed to load resource|net::ERR_/i;
    expect(issues.consoleErrors.filter((text) => !noise.test(text)), '首页加载不应有控制台错误').toEqual([]);
    assertNoErrors();
  });

  test('首页 /：三分区按增量渲染，计数 / 全部入口 / 条目结构与索引数据对齐', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.nk-home__ledger-item').first()).toBeVisible({ timeout: 15_000 });
    const desktop = (page.viewportSize()?.width ?? 1280) >= 1024;

    const present = await page.locator('.nk-home__section').evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')));
    expect(present, '只渲染有增量的分区，且顺序为 角色 / 光锥 / 遗器').toEqual(PRESENT_KINDS);

    for (const kind of KINDS) {
      const section = page.locator(`.nk-home__section[data-kind="${kind}"]`);
      const expected = RELEASE[kind];
      if (!expected.length) {
        await expect(section, `${kind}：无增量时不得渲染分区`).toHaveCount(0);
        continue;
      }
      await expect(section, `${kind}：有增量时应渲染分区`).toHaveCount(1);
      await expect(section.locator('.nk-home__title')).toContainText(KIND_LABEL[kind]);
      await expect(section.locator('.nk-home__count')).toHaveText(String(expected.length));
      await expect(section.locator(SECTION_ITEM[kind])).toHaveCount(expected.length);

      const all = section.locator('.nk-home__all');
      await expect(all).toContainText(`全部${KIND_LABEL[kind]}`);
      await expect(all).toHaveAttribute('href', LIST_ROUTE[kind]);

      if (kind === 'character') {
        const cards = await section.locator('.nk-home__char').evaluateAll((els) => els.map((el) => {
          const art = el.querySelector('.nk-home__char-art') as HTMLElement | null;
          const artBox = art?.getBoundingClientRect() ?? null;
          const center = artBox ? { x: artBox.left + artBox.width / 2, y: artBox.top + artBox.height / 2 } : null;
          const iconBoxes = Array.from(el.querySelectorAll<HTMLImageElement>('.nk-home__icon-list--eidolon img'))
            .map((img) => {
              const box = img.getBoundingClientRect();
              const cx = box.left + box.width / 2;
              const cy = box.top + box.height / 2;
              return {
                w: Math.round(box.width),
                dx: center ? Math.round(cx - center.x) : 0,
                dy: center ? Math.round(cy - center.y) : 0,
                inside: !!artBox && cx > artBox.left && cx < artBox.right && cy > artBox.top && cy < artBox.bottom,
              };
            });
          return {
            name: (el.querySelector('.nk-home__char-name')?.textContent || '').trim(),
            art: !!el.querySelector('.nk-home__char-art img'),
            artWidth: artBox ? Math.round(artBox.width) : 0,
            facts: el.querySelectorAll('.nk-home__facts .nk-home__fact').length,
            rarity: (el.querySelector('.nk-home__rarity')?.textContent || '').replace(/\s+/g, '').trim(),
            eidolons: el.querySelectorAll('.nk-home__icon-list--eidolon .nk-home__icon').length,
            eidolonMinWidth: iconBoxes.length ? Math.min(...iconBoxes.map((box) => box.w)) : 0,
            eidolonIcons: iconBoxes,
            eidolonRows: (() => {
              const list = el.querySelector('.nk-home__icon-list--eidolon') as HTMLElement | null;
              if (!list) return 0;
              const tops = new Set(
                Array.from(list.children).map((li) => Math.round(li.getBoundingClientRect().top)),
              );
              return tops.size;
            })(),
            otherIconGroups: el.querySelectorAll('.nk-home__icons:not(:has(.nk-home__icon-list--eidolon))').length,
            cta: el.querySelector('.nk-home__cta')?.getAttribute('href') ?? null,
            artLink: (el.querySelector('.nk-home__art-link')?.textContent || '').trim(),
          };
        }));
        for (let i = 0; i < expected.length; i += 1) {
          const want = expected[i];
          const got = cards[i];
          const icons = charIconCounts(want.id);
          expect(got.name, `${kind}：第 ${i + 1} 张卡应写着角色名`).toBe(want.name);
          expect(got.art, `${kind}：第 ${i + 1} 张卡应有立绘`).toBe(true);
          expect(got.facts, `${kind}：第 ${i + 1} 张卡应有属性 / 命途事实`).toBeGreaterThan(0);
          expect(got.rarity, `${kind}：第 ${i + 1} 张卡应有稀有度`).toMatch(/^\d+$/);
          expect(got.eidolons, `${kind}：第 ${i + 1} 张卡星魂图标数应与详情数据一致`).toBe(icons.eidolons);
          if (desktop) {
            const iconsInArt = got.eidolonIcons.every((icon) => icon.inside);
            expect(iconsInArt, `${kind}：第 ${i + 1} 张卡星魂应全部落在立绘舞台内（环绕轨道，不越界）`).toBe(true);
            const width = got.artWidth;
            const xs = got.eidolonIcons.map((icon) => icon.dx);
            const ys = got.eidolonIcons.map((icon) => icon.dy);
            expect(Math.max(...xs) - Math.min(...xs), `${kind}：第 ${i + 1} 张卡星魂环应横向铺开（占舞台 60% 以上）`)
              .toBeGreaterThan(width * 0.6);
            expect(Math.max(...ys) - Math.min(...ys), `${kind}：第 ${i + 1} 张卡轨道应为倾斜环（纵向跨度小于横向）`)
              .toBeLessThan(width * 0.45);
            const radii = got.eidolonIcons.map((icon) => Math.hypot(icon.dx, icon.dy));
            expect(Math.min(...radii), `${kind}：第 ${i + 1} 张卡星魂应离立绘中心足够远（构成环，非堆叠）`)
              .toBeGreaterThan(width * 0.18);
            for (let a = 0; a < radii.length; a += 1) {
              for (let b = a + 1; b < radii.length; b += 1) {
                const gap = Math.hypot(got.eidolonIcons[a].dx - got.eidolonIcons[b].dx, got.eidolonIcons[a].dy - got.eidolonIcons[b].dy);
                expect(gap, `${kind}：第 ${i + 1} 张卡星魂 ${a + 1}/${b + 1} 互相叠压`)
                  .toBeGreaterThan(got.eidolonIcons[a].w * 0.85);
              }
            }
          } else {
            expect(got.eidolonRows, `${kind}：第 ${i + 1} 张卡窄屏星魂应为 2 行（每行 3 枚）`).toBe(2);
          }
          expect(got.eidolonMinWidth, `${kind}：第 ${i + 1} 张卡星魂图宽 ${got.eidolonMinWidth}px 过小，看不清`)
            .toBeGreaterThanOrEqual(80);
          expect(got.otherIconGroups, `${kind}：第 ${i + 1} 张卡只展示星魂，不再展示技能图标`).toBe(0);
          expect(got.cta, `${kind}：第 ${i + 1} 张卡入口应指向详情`).toBe(`/character/${want.id}`);
          expect(got.artLink, `${kind}：第 ${i + 1} 张卡应有立绘入口`).toContain(want.name);
        }
      }

      if (kind === 'lightcone') {
        const cards = await section.locator('.nk-home__cone').evaluateAll((els) => els.map((el) => ({
          name: (el.querySelector('.nk-home__cone-name')?.textContent || '').trim(),
          art: !!el.querySelector('.nk-home__cone-art img'),
          facts: el.querySelectorAll('.nk-home__facts .nk-home__fact').length,
          rarity: (el.querySelector('.nk-home__rarity')?.textContent || '').replace(/\s+/g, '').trim(),
          skillName: (el.querySelector('.nk-home__cone-skill')?.textContent || '').trim(),
          skillDesc: (el.querySelector('.nk-home__brief--cone')?.textContent || '').trim().length,
          cta: el.querySelector('.nk-home__cta')?.getAttribute('href') ?? null,
        })));
        for (let i = 0; i < expected.length; i += 1) {
          const want = expected[i];
          const got = cards[i];
          expect(got.name, `${kind}：第 ${i + 1} 张卡应写着光锥名`).toBe(want.name);
          expect(got.art, `${kind}：第 ${i + 1} 张卡应有立绘`).toBe(true);
          expect(got.facts, `${kind}：第 ${i + 1} 张卡应有命途事实`).toBeGreaterThan(0);
          expect(got.rarity, `${kind}：第 ${i + 1} 张卡应有稀有度`).toMatch(/^\d+$/);
          expect(got.skillName, `${kind}：第 ${i + 1} 张卡应有技能名`).not.toBe('');
          expect(got.skillDesc, `${kind}：第 ${i + 1} 张卡应有技能描述`).toBeGreaterThan(0);
          expect(got.cta, `${kind}：第 ${i + 1} 张卡入口应指向详情`).toBe(`/lightcone/${want.id}`);
        }
      }

      if (kind === 'relic') {
        const cards = await section.locator('.nk-home__relic').evaluateAll((els) => els.map((el) => ({
          name: (el.querySelector('.nk-home__relic-name')?.textContent || '').trim(),
          art: !!el.querySelector('.nk-home__relic-art img'),
          tags: [...el.querySelectorAll('.nk-home__effects dt')].map((node) => (node.textContent || '').trim()),
          descs: [...el.querySelectorAll('.nk-home__effects dd')].map((node) => (node.textContent || '').trim().length),
          cta: el.querySelector('.nk-home__cta')?.getAttribute('href') ?? null,
        })));
        for (let i = 0; i < expected.length; i += 1) {
          const want = expected[i];
          const got = cards[i];
          expect(got.name, `${kind}：第 ${i + 1} 张卡应写着遗器名`).toBe(want.name);
          expect(got.art, `${kind}：第 ${i + 1} 张卡应有图标`).toBe(true);
          expect(got.tags.length, `${kind}：第 ${i + 1} 张卡应有套装效果条目`).toBeGreaterThan(0);
          expect(got.descs.length, `${kind}：第 ${i + 1} 张卡效果标签与描述应成对`).toBe(got.tags.length);
          expect(got.descs.every((len) => len > 0), `${kind}：第 ${i + 1} 张卡不得有空效果描述`).toBe(true);
          expect(got.cta, `${kind}：第 ${i + 1} 张卡入口应指向详情`).toBe(`/relic/${want.id}`);
        }
      }
    }

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：桌面断点星魂环绕立绘持续旋转（悬停不暂停），reduced-motion 静止', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, '轨道环仅在桌面断点启用');
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nk-home__ledger-item').first()).toBeVisible({ timeout: 15_000 });
    const eidolons = charIconCounts(RELEASE.character[0]!.id).eidolons;
    const gear = page.locator('.nk-home__icon-list--eidolon img');
    await page.locator('.nk-home__char').scrollIntoViewIfNeeded();
    await expect(gear).toHaveCount(eidolons);
    await expect
      .poll(
        () => gear.first().evaluate((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0),
        { timeout: 15_000 },
      )
      .toBe(true);

    const centers = () => page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLImageElement>('.nk-home__icon-list--eidolon img')).map((img) => {
        const box = img.getBoundingClientRect();
        return [box.left + box.width / 2, box.top + box.height / 2] as [number, number];
      }));
    const shift = (a: number[][], b: number[][]) =>
      Math.max(...a.map((point, index) => Math.hypot(point[0]! - b[index]![0]!, point[1]! - b[index]![1]!)));

    const before = await centers();
    await page.waitForTimeout(1_200);
    const after = await centers();
    expect(shift(before, after), '星魂环应在旋转（1.2s 内应有明显位移）').toBeGreaterThan(8);

    await page.locator('.nk-home__char').hover();
    await page.waitForTimeout(150);
    const hoverA = await centers();
    await page.waitForTimeout(900);
    const hoverB = await centers();
    expect(shift(hoverA, hoverB), '悬停不得暂停（产品口径：星魂环一直转）').toBeGreaterThan(4);

    await page.mouse.move(2, 2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(page.locator('.nk-home__icon-list--eidolon img').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(300);
    const stillA = await centers();
    await page.waitForTimeout(900);
    const stillB = await centers();
    expect(shift(stillA, stillB), 'reduced-motion 下星魂环应静止（基态即完整环）').toBeLessThan(1.5);
    expect(new Set(stillA.map((point) => Math.round(point[1]))).size, '静态环仍应分布在不同高度，而非叠成一堆')
      .toBeGreaterThan(1);

    assertNoErrors();
  });

  test('首页 /：1440/1920 两档首屏内完整可见报头 + 版本号 + 本期入册全部行（首屏契约）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    expect(TOTAL, `本期入册 ${TOTAL} 行，首屏契约按 4~6 行设计`).toBeGreaterThanOrEqual(4);
    expect(TOTAL, `本期入册 ${TOTAL} 行，首屏契约按 4~6 行设计`).toBeLessThanOrEqual(6);

    for (const viewport of [{ width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.locator('.nk-home__ledger-item')).toHaveCount(TOTAL, { timeout: 15_000 });
      await waitForSettled(page);

      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const box = el.getBoundingClientRect();
          return {
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            left: Math.round(box.left),
            right: Math.round(box.right),
          };
        };
        return {
          masthead: rect('.nk-hub-masthead'),
          title: rect('.nk-hub-masthead__title'),
          version: rect('.nk-home__version'),
          rows: [...document.querySelectorAll('.nk-home__ledger-item')].map((el) => {
            const box = el.getBoundingClientRect();
            return { top: Math.round(box.top), bottom: Math.round(box.bottom) };
          }),
          characterTitleBottom: rect('.nk-home__section[data-kind="character"] .nk-home__title')?.bottom ?? null,
          innerHeight: window.innerHeight,
        };
      });
      const where = `${viewport.width}×${viewport.height}`;

      expect(geometry.masthead, `${where}：报头应存在`).not.toBeNull();
      expect(geometry.masthead!.top, `${where}：报头应贴顶可见`).toBeGreaterThanOrEqual(0);
      expect(geometry.masthead!.bottom, `${where}：报头应在首屏内`).toBeLessThanOrEqual(geometry.innerHeight);
      expect(geometry.title, `${where}：报头标题应可见`).not.toBeNull();
      expect(geometry.version, `${where}：版本号应在首屏内`).not.toBeNull();
      expect(geometry.version!.top, `${where}：版本号应在报头之下`).toBeGreaterThanOrEqual(geometry.masthead!.bottom - 1);
      expect(geometry.version!.bottom, `${where}：版本号底部应在首屏内`).toBeLessThanOrEqual(geometry.innerHeight);

      expect(geometry.rows.length, `${where}：本期入册行数应与数据一致`).toBe(TOTAL);
      for (let i = 0; i < geometry.rows.length; i += 1) {
        const row = geometry.rows[i];
        expect(row.top, `${where}：第 ${i + 1} 行应在报头之下`).toBeGreaterThanOrEqual(geometry.masthead!.bottom - 1);
        expect(
          row.bottom,
          `${where}：第 ${i + 1} 行底部应 ≤ 视口高 ${geometry.innerHeight}，实测 ${row.bottom}`,
        ).toBeLessThanOrEqual(geometry.innerHeight);
      }
      expect(geometry.characterTitleBottom, `${where}：characters 区标题应在首屏内`).not.toBeNull();
      expect(geometry.characterTitleBottom!, `${where}：characters 区标题应在首屏内`).toBeLessThanOrEqual(geometry.innerHeight);

      await noUnknownOverflow(page);
    }
    assertNoErrors();
  });

  test('首页 /：390×844 手机档角色名 / 光锥名可见，底栏不遮挡入册末行，搜索按钮在首屏', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.nk-home__ledger-item').first()).toBeVisible({ timeout: 15_000 });
    await waitForSettled(page);

    for (const [kind, selector] of [['character', '.nk-home__char-name'], ['lightcone', '.nk-home__cone-name']] as const) {
      const expected = RELEASE[kind];
      const names = await page.locator(selector).evaluateAll((els) => els.map((el) => {
        const box = el.getBoundingClientRect();
        return { text: (el.textContent || '').trim(), width: Math.round(box.width), height: Math.round(box.height) };
      }));
      expect(names.map((name) => name.text), `390 档 ${kind} 名字应与数据一致`).toEqual(expected.map((entry) => entry.name));
      for (const name of names) {
        expect(name.width, `390 档 ${kind}「${name.text}」不得塌缩为 0 宽`).toBeGreaterThan(0);
        expect(name.height, `390 档 ${kind}「${name.text}」不得塌缩为 0 高`).toBeGreaterThan(0);
      }
    }

    const geometry = await page.evaluate(() => {
      const bar = document.querySelector('.ui-sidebar');
      const rows = [...document.querySelectorAll('.nk-home__ledger-item')];
      const last = rows[rows.length - 1];
      const lastBox = last.getBoundingClientRect();
      const barBox = bar?.getBoundingClientRect() ?? null;
      const hit = document.elementFromPoint(
        Math.round(lastBox.left + lastBox.width / 2),
        Math.round(lastBox.bottom - 3),
      );
      return {
        barTop: barBox ? Math.round(barBox.top) : null,
        lastBottom: Math.round(lastBox.bottom),
        hitInRow: !!(hit && hit.closest('.nk-home__ledger-item')),
        innerHeight: window.innerHeight,
      };
    });
    expect(geometry.barTop, '390 档应有底部导航栏（否则本判据失去意义）').not.toBeNull();
    expect(
      geometry.lastBottom,
      `入册末行底部 ${geometry.lastBottom} 应高于底栏顶部 ${geometry.barTop}`,
    ).toBeLessThanOrEqual(geometry.barTop!);
    expect(geometry.hitInRow, '入册末行的命中点不得落在底栏上').toBe(true);

    const go = page.locator('.nk-home__search-go');
    await expect(go).toBeVisible();
    const goBox = await go.boundingBox();
    expect(goBox, '搜索按钮应有盒模型').not.toBeNull();
    expect(goBox!.width, '搜索按钮宽度不得为 0').toBeGreaterThan(0);
    expect(goBox!.y, '搜索按钮应在首屏内（上缘）').toBeGreaterThanOrEqual(0);
    expect(
      goBox!.y + goBox!.height,
      `搜索按钮底部 ${Math.round(goBox!.y + goBox!.height)} 应在视口高 ${geometry.innerHeight} 内`,
    ).toBeLessThanOrEqual(geometry.innerHeight);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：入册行与角色 / 光锥卡宽不依赖图片加载（禁 max-content 塌缩）', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const measure = async (delayImages: boolean) => {
      let openGate = () => {};
      const gate = new Promise<void>((resolve) => { openGate = resolve; });
      let gated = 0;
      let pendingResponses = 0;
      if (delayImages) {
        await page.route('**/*.{webp,png}', async (route) => {
          gated += 1;
          pendingResponses += 1;
          try {
            await gate;
            await route.continue();
          } finally {
            pendingResponses -= 1;
          }
        });
      }
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.nk-home__ledger-item').first()).toBeVisible({ timeout: 15_000 });
      if (delayImages) await expect.poll(() => gated, { timeout: 10_000 }).toBeGreaterThan(0);
      await waitForSettled(page);
      await expect
        .poll(() => page.evaluate(() => document.fonts.status), { timeout: 10_000, message: '字体未就绪：两趟测量不可比' })
        .toBe('loaded');
      const boxes = await page.evaluate(() => {
        const size = (selector: string) => [...document.querySelectorAll(selector)].map((el) => {
          const box = el.getBoundingClientRect();
          return { w: Math.round(box.width), h: Math.round(box.height) };
        });
        return {
          ledger: size('.nk-home__ledger-link'),
          chars: size('.nk-home__char'),
          cones: size('.nk-home__cone'),
        };
      });
      if (delayImages) {
        openGate();
        await expect.poll(() => pendingResponses, { timeout: 10_000 }).toBe(0);
        await page.unroute('**/*.{webp,png}');
      }
      return boxes;
    };

    const pending = await measure(true);
    const loaded = await measure(false);

    expect(loaded.ledger.length, '入册行数与数据一致').toBe(TOTAL);
    expect(loaded.chars.length).toBe(RELEASE.character.length);
    expect(loaded.cones.length).toBe(RELEASE.lightcone.length);
    for (const key of ['ledger', 'chars', 'cones'] as const) {
      expect(pending[key].length, `${key}：两趟测量取样数应一致`).toBe(loaded[key].length);
      for (let i = 0; i < loaded[key].length; i += 1) {
        const before = pending[key][i];
        const after = loaded[key][i];
        expect(
          Math.abs(after.w - before.w),
          `${key} 第 ${i + 1} 项盒宽不得依赖图片是否加载（加载前 ${before.w} ↔ 加载后 ${after.w}）`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(after.h - before.h),
          `${key} 第 ${i + 1} 项盒高不得依赖图片是否加载（加载前 ${before.h} ↔ 加载后 ${after.h}）`,
        ).toBeLessThanOrEqual(1);
        expect(after.w, `${key} 第 ${i + 1} 项盒宽应大于 0`).toBeGreaterThan(0);
      }
    }
    const ledgerWidths = loaded.ledger.map((box) => box.w);
    for (const width of ledgerWidths) {
      expect(Math.abs(width - ledgerWidths[0]), `入册各行必须等宽，实测 ${ledgerWidths.join(' / ')}`).toBeLessThanOrEqual(1);
    }
    assertNoErrors();
  });

  test('首页 /：加载期给骨架、索引全失败给错误态且可重试，都不冒充空态', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const INDEXES = '**/data/cn/*.json';
    const isIndex = (url: string) => /(characters|light_cones|relics)\.json$/.test(url);

    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route(INDEXES, async (route) => {
      if (isIndex(route.request().url())) await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-home__skeleton')).toBeVisible();
    await expect(page.locator('.nk-home__skeleton-version')).toHaveCount(1);
    await expect(page.locator('.nk-home__skeleton-row')).toHaveCount(KINDS.length);
    await expect(page.locator('.nk-home__section')).toHaveCount(0);
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(0);
    await expect(page.locator('.nk-home__empty')).toHaveCount(0);
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(TOTAL, { timeout: 20_000 });
    await expect(page.locator('.nk-home__skeleton')).toHaveCount(0);
    await expect(page.locator('.nk-home__section')).toHaveCount(PRESENT_KINDS.length);
    await page.unroute(INDEXES);

    await page.route(INDEXES, (route) =>
      (isIndex(route.request().url()) ? route.abort() : route.continue()));
    await page.goto('/');
    await expect(page.locator('.nk-error-state')).toBeVisible();
    await expect(page.locator('.nk-error-state__retry')).toBeVisible();
    await expect(page.locator('.nk-home__empty')).toHaveCount(0);
    await expect(page.locator('.nk-home__section')).toHaveCount(0);
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(0);

    await page.unroute(INDEXES);
    await page.locator('.nk-error-state__retry').click();
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(TOTAL, { timeout: 20_000 });
    await expect(page.locator('.nk-error-state')).toHaveCount(0);
    await expect(page.locator('.nk-home__section')).toHaveCount(PRESENT_KINDS.length);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：搜索「真」出结果且结果名均含「真」，无匹配给空提示', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/');
    await expect(page.locator('.nk-home__ledger-item').first()).toBeVisible({ timeout: 15_000 });

    const input = page.locator('.nk-home__search-input');
    await expect(input).toBeVisible();
    await input.fill('真');
    await expect(page.locator('.nk-home__results')).toBeVisible();
    const names = (await page.locator('.nk-home__result-name').allTextContents()).map((name) => name.trim());
    expect(names.length, '搜索「真」应有结果').toBeGreaterThan(1);
    expect(names).toContain('真珠');
    expect(names).toContain('真理医生');
    for (const name of names) {
      expect(name, '结果名应含搜索词「真」').toContain('真');
    }
    const hrefs = await page.locator('.nk-home__result').evaluateAll((els) => els.map((el) => el.getAttribute('href')));
    for (const href of hrefs) {
      expect(href, '搜索结果应指向详情页').toMatch(/^\/(character|lightcone|relic)\/\d+$/);
    }

    await input.fill('zzzz查无此条xyz');
    await expect(page.locator('.nk-home__result-empty')).toHaveText('没有匹配的条目');
    await expect(page.locator('.nk-home__result')).toHaveCount(0);

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：三分区皆无增量时只显示一行空态', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ game_version: '9.9.9', version_label: '9.9.9', synced_at: '2026-01-01' }),
      }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.nk-home__empty')).toHaveCount(1);
    await expect(page.locator('.nk-home__empty')).toHaveText('本版本暂无新增条目');
    await expect(page.locator('.nk-home__section')).toHaveCount(0);
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(0);
    await expect(page.locator('.nk-home__version')).toHaveText('9.9.9');
    await expect(page.locator('.nk-home__stamp-note')).toHaveText('版本上新');
    await expect(page.locator('.nk-hub-masthead__title')).toBeVisible();
    await expect(page.locator('.nk-hub-footer')).toHaveCount(1);
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：首屏封面一次只显示一张，双角色轮换（不并排），指示点可手动切换', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    const index = <T extends { release_version?: string; rarity?: number }>(file: string) =>
      readJson<T[]>(file).filter((item) => String(item.release_version ?? '').trim() === '4.5' && Number(item.rarity) === 5);
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ game_version: '4.5.0', version_label: '4.5', synced_at: '2026-09-01' }),
      }),
    );
    await page.route('**/data/cn/characters.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(index('public/data/cn/characters.json')) }),
    );
    await page.route('**/data/cn/light_cones.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(index('public/data/cn/light_cones.json')) }),
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const covers = page.locator('.nk-home__cover-img');
    await expect.poll(() => covers.count(), { timeout: 15_000 }).toBe(2);
    await expect(page.locator('.nk-home__ledger-item')).toHaveCount(4);

    const active = page.locator('.nk-home__cover-img[data-active="true"]');
    const dots = page.locator('.nk-home__cover-dot');

    await expect(active, '封面一次只能有一张处于显示态（双角色不并排）').toHaveCount(1);
    await expect(dots, '指示点数量应与封面张数一致').toHaveCount(2);

    const shown = () =>
      page.evaluate(() => {
        const imgs = [...document.querySelectorAll('.nk-home__cover-img')] as HTMLElement[];
        return imgs
          .filter((img) => img.dataset.active === 'true')
          .map((img) => ({
            src: img.getAttribute('src') ?? '',
            opacity: Number(getComputedStyle(img).opacity),
            width: Math.round(img.getBoundingClientRect().width),
          }));
      });

    const first = await shown();
    expect(first, '显示态的封面必须有可见尺寸与不透明度').toHaveLength(1);
    expect(first[0]!.opacity, '显示态封面不透明度应为 1').toBe(1);
    expect(first[0]!.width, '封面应铺满右栏（未被并排压缩到半幅）').toBeGreaterThan(300);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(dots.nth(1)).not.toHaveAttribute('aria-current', 'true');
    const hiddenOpacity = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('.nk-home__cover-img')] as HTMLElement[];
      const hidden = imgs.find((img) => img.dataset.active !== 'true');
      return hidden ? Number(getComputedStyle(hidden).opacity) : -1;
    });
    expect(hiddenOpacity, '未显示的那张必须透明（叠放在同一格，不能各占半幅）').toBe(0);

    await dots.nth(1).click();
    await expect.poll(async () => (await shown())[0]?.src, { timeout: 5_000 }).not.toBe(first[0]!.src);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');

    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('首页 /：prefers-reduced-motion 下封面不自动轮换，手动切换仍可用', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const index = <T extends { release_version?: string; rarity?: number }>(file: string) =>
      readJson<T[]>(file).filter((item) => String(item.release_version ?? '').trim() === '4.5' && Number(item.rarity) === 5);
    await page.route('**/data/cn/version.json', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ game_version: '4.5.0', version_label: '4.5', synced_at: '2026-09-01' }),
      }),
    );
    await page.route('**/data/cn/characters.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(index('public/data/cn/characters.json')) }),
    );
    await page.route('**/data/cn/light_cones.json', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(index('public/data/cn/light_cones.json')) }),
    );
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect.poll(() => page.locator('.nk-home__cover-img').count(), { timeout: 15_000 }).toBe(2);

    const currentSrc = () =>
      page.evaluate(() => {
        const img = document.querySelector('.nk-home__cover-img[data-active="true"]');
        return img ? img.getAttribute('src') : null;
      });
    const before = await currentSrc();
    await page.waitForTimeout(6_500);
    expect(await currentSrc(), '减少动效下封面不得自动轮换').toBe(before);

    await page.locator('.nk-home__cover-dot').nth(1).click();
    await expect.poll(currentSrc, { timeout: 5_000 }).not.toBe(before);
  });

  test('角色图鉴 /character：卡片渲染、筛选工具条、无溢出', async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto('/character');
    await waitForCatalogCards(page);
    const cardCount = await page.locator('[class*="-grid"] a').count();
    expect(cardCount).toBeGreaterThan(0);
    await expect(page.locator('.nk-cat-toolbar').first()).toBeVisible();
    await noUnknownOverflow(page);
    assertNoErrors();
  });

  test('角色图鉴 /character：手机断点与桌面同一套网格卡（无行式头像卡形态）', { tag: ['@visual-detail', '@viewport-pinned'] }, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);

    const fingerprint = async () => {
      await waitForCatalogCards(page);
      const cards = page.locator('.nk-idx-grid a.nk-idx-card');
      await expect(cards.first()).toBeVisible();
      const base = await cards.first().evaluate((el) => {
        const portrait = el.querySelector('.nk-idx-card__portrait') as HTMLElement;
        const body = el.querySelector('.nk-idx-card__body') as HTMLElement;
        const pcs = getComputedStyle(portrait);
        return {
          display: getComputedStyle(el).display,
          portraitAspect: pcs.aspectRatio,
          portraitRadius: pcs.borderRadius,
          bodyPos: getComputedStyle(body).position,
          hasPicture: !!el.querySelector('picture'),
          columns: getComputedStyle(el.parentElement as HTMLElement).gridTemplateColumns.split(' ').length,
        };
      });
      const img = cards.first().locator('img').first();
      await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).currentSrc), { timeout: 10_000 })
        .toContain('/avatar');
      const curSrc = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
      return { ...base, imgDir: curSrc.includes('avatarroundicon') ? 'avatarroundicon' : 'avatarshopicon' };
    };

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/character');
    const wide = await fingerprint();
    expect(wide.display, '桌面卡应为块级网格卡').toBe('block');
    expect(wide.portraitAspect, '桌面立绘框为 3:4').toBe('3 / 4');
    expect(wide.bodyPos, '桌面文字叠压在立绘下缘').toBe('absolute');
    expect(wide.hasPicture, '不得存在按断点切图的双源 <picture>').toBe(false);
    expect(wide.imgDir, '桌面图源应为商店立绘').toBe('avatarshopicon');

    const narrows = [] as Array<Record<string, unknown>>;
    for (const w of [767, 390, 320]) {
      await page.setViewportSize({ width: w, height: 900 });
      await expect.poll(async () => (await fingerprint()).display).toBe('block');
      const f = await fingerprint();
      narrows.push({ w, ...f });
      expect(f.display, `${w}：手机档卡应为块级网格卡（不得是行式 flex）`).toBe('block');
      expect(f.portraitAspect, `${w}：立绘框比例应与桌面同值`).toBe(wide.portraitAspect);
      expect(f.portraitRadius, `${w}：立绘框不得是圆形`).toBe(wide.portraitRadius);
      expect(f.bodyPos, `${w}：文字应与桌面同套叠压位`).toBe(wide.bodyPos);
      expect(f.hasPicture, `${w}：不得按断点切圆头像`).toBe(false);
      expect(f.imgDir, `${w}：图源应与桌面同源（不得切圆头像）`).toBe(wide.imgDir);
      await noUnknownOverflow(page);
    }

    const cols = narrows.map((n) => n.columns as number);
    const shape = JSON.stringify(narrows.map((n) => [n.w, n.columns]));
    expect(cols[0], `767 档应比 320 档列数多：${shape}`).toBeGreaterThan(cols[2]);
    expect(cols[2], '320 档应至少 1 列').toBeGreaterThanOrEqual(1);
    for (let i = 1; i < cols.length; i++) {
      expect(cols[i - 1], `列数随视口变窄不得增加（取样序为宽→窄）：${shape}`).toBeGreaterThanOrEqual(cols[i]);
    }
    assertNoErrors();
  });
});
