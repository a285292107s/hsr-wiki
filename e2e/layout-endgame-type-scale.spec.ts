import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readToken, waitForSettled } from './helpers';

/**
 * 布局验收：终局两层页面的**字号 / 圆角刻度合规**（`docs/audit/UI质量验收标准.md` A4.1 / A4.2 / A5.3）分文件之一。
 *
 * 存在理由：这两条判据此前**没有任何可跑的取证**（验收标准自己标注「探针（待建成脚本）」），
 * 于是页面 CSS 里的字号 / 圆角字面量可以无限增长而无人察觉——终局两层实测曾达 14–15 档字号、
 * 9–10 种圆角，页面 CSS 又把「末块是唯一字号声明点」写进了注释却无守卫。
 *
 * 判据三条（取值域 = 页面根 `.nk-page--detail` 之内，**不含全站外壳**——外壳字号由 tokens.css 自身保证，
 * 跨页同规格不属本域）：
 *   ① 每个可见文本叶子的 `font-size` 必须落在 `--nk-fs-*` 刻度上（容差 0.06px，抗 rem→px 取整）；
 *   ② 档位数 ≤10（验收标准 A4.1 合格线 ≤12、目标线 ≤10）；
 *   ③ 圆角每个分量只允许 `--nk-radius-1..3` / `50%` / `999px`（四层令牌的形态约束）。
 *   A5.3「无 <0.6rem」不单独断言：刻度最小档 `--nk-fs-1` = 0.5rem 会合法地小于 0.6rem，
 *   故该条的取证方式是「页面不得用 `--nk-fs-1`」——由 ① 收紧为「只用 fs-2 及以上的档」在本用例内联判据给出。
 *
 * 期望值全部**令牌派生**（`readTokenPx` 读 tokens.css），不写死绝对值：见 `e2e/helpers.ts` 的数值断言纪律。
 */

const ROUTES: Array<[string, string]> = [
  ['/endgame/maze', '玩法·忘却之庭'],
  ['/endgame/story', '玩法·虚构叙事'],
  ['/endgame/boss', '玩法·末日幻影'],
  ['/endgame/peak', '玩法·异相仲裁'],
  ['/endgame/maze/1034', '赛季·忘却之庭'],
  ['/endgame/story/2026', '赛季·虚构叙事'],
  ['/endgame/boss/3021', '赛季·末日幻影'],
  ['/endgame/peak/9', '赛季·异相仲裁'],
];
/**
 * 未纳入本用例的终局表面（有意留白，不是遗漏）：`/endgame` 目录族的**页标题**取
 * `catalog.css` 的 `clamp(--nk-fs-title-1, 2.3vw, --nk-fs-title-3)`——clamp 中间值在任意视口都是
 * 「刻度外」的连续值，属于共享外壳的既有响应式口径（禁在本域覆写：路由 CSS 不卸载，覆写会变成
 * 「同一标题尺寸随访问历史变化」）。目录行的字号 / 圆角已随本轮收口到令牌，取证见
 * `docs/audit/` 的探针口径与 `e2e/layout-endgame.spec.ts` 的列头几何断言。
 */

/** 刻度令牌名（tokens.css 的四层收口：界面/正文 8 档 + 标题 5 档 + hero 特写） */
const FS_TOKENS = [
  '--nk-fs-1', '--nk-fs-2', '--nk-fs-3', '--nk-fs-4', '--nk-fs-5', '--nk-fs-6', '--nk-fs-7', '--nk-fs-8',
  '--nk-fs-title-1', '--nk-fs-title-2', '--nk-fs-title-3', '--nk-fs-title-4', '--nk-fs-title-5', '--nk-fs-hero',
];
const RADIUS_TOKENS = ['--nk-radius-1', '--nk-radius-2', '--nk-radius-3'];
/** 圆角形态约束里的两个非长度形态（令牌层登记为形态而非长度，故不进 RADIUS_TOKENS） */
const RADIUS_SHAPES = ['50%', '999px'];
/** A4.1 目标线 */
const MAX_TIERS = 10;

for (const [route, label] of ROUTES) {
  test(`${label}（${route}）：字号与圆角全部来自刻度`, async ({ page }) => {
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.goto(route);
    await page.waitForSelector('.nk-page--detail');
    await waitForSettled(page);

    /* 令牌读的是**声明值**（`getComputedStyle` 对自定义属性不做单位解析）：`--nk-fs-*` 以 rem 声明，
       故必须按根字号折算成 px 再与 computed font-size 比——这是本用例唯一易写错处。 */
    const rootPx = await page.locator('html').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const toPx = (raw: string): number => {
      const v = parseFloat(raw);
      if (!Number.isFinite(v)) return 0;
      return raw.trim().endsWith('rem') ? v * rootPx : v;
    };
    const scale: number[] = [];
    for (const t of FS_TOKENS) scale.push(toPx(await readToken(page, t)));
    const radiusAllowed = [
      ...(await Promise.all(RADIUS_TOKENS.map(async (t) => toPx(await readToken(page, t))))).map((v) => `${v}px`),
      ...RADIUS_SHAPES, '0px',
    ];
    /* A5.3：页面文本不得小于 0.6rem（`--nk-fs-1` 是唯一合法但低于该线的档，故本域不得用它） */
    const floorPx = 0.6 * rootPx;
    const fs1 = scale[0];

    const measured = await page.evaluate(() => {
      const root = document.querySelector('.nk-page--detail');
      if (!root) return null;
      const sizes: number[] = [];
      const radiusSet = new Set<string>();
      for (const el of root.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const box = el.getBoundingClientRect();
        if (box.width <= 0 || box.height <= 0) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
        if (hasText) sizes.push(+parseFloat(cs.fontSize).toFixed(2));
        for (const part of cs.borderRadius.split(/\s+/)) if (part && part !== '0px') radiusSet.add(part);
      }
      return { sizes, radiusSet: [...radiusSet] };
    });
    expect(measured, '页面根 .nk-page--detail 必须存在').not.toBeNull();

    const offScale = [...new Set(measured!.sizes)].filter(
      (v) => !scale.some((s) => Math.abs(s - v) < 0.06),
    ).sort((a, b) => a - b);
    expect(offScale, `以下字号不在 --nk-fs-* 刻度上：${offScale.join(' / ')}px`).toEqual([]);

    const underFloor = [...new Set(measured!.sizes)].filter((v) => v < floorPx - 0.06);
    expect(underFloor, `以下字号低于 0.6rem（A5.3 合格线）：${underFloor.join(' / ')}px`).toEqual([]);

    const tiers = [...new Set(measured!.sizes)].length;
    expect(tiers, `字号档位 ${tiers} 超过目标线 ${MAX_TIERS}`).toBeLessThanOrEqual(MAX_TIERS);

    const badRadius = measured!.radiusSet.filter((v) => !radiusAllowed.includes(v));
    expect(badRadius, `以下圆角不在刻度/形态内：${badRadius.join(' / ')}`).toEqual([]);

    /* 判据自证：令牌读数为 0 说明 readTokenPx 打空（那会让 ① 变成恒真断言） */
    expect(scale.filter((v) => v > 0).length, '--nk-fs-* 令牌必须读到非零值').toBeGreaterThanOrEqual(8);
    expect(fs1, '--nk-fs-1 必须可用（A5.3 的对照档）').toBeGreaterThan(0);

    assertNoErrors();
  });
}
