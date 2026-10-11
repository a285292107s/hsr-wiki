import { test, expect } from '@playwright/test';
import { collectConsoleIssues, readJsonIn, waitForSettled } from './helpers';

/**
 * 布局验收：多语言长文案下的**排版破损**（ADR 0052 落地后的回归契约）。
 *
 * 存在理由：站点支持 13 种语言后，译文长度与中文差异极大（德语/俄语比中文长约 30%，
 * 泰语无词间空格），原先按中文长度调好的容器成片失效。既有 e2e 只在**缺省语言**上跑溢出断言
 * ⇒ 这类缺陷在 de/ru/th 下真实存在却零覆盖。本文件把「长文案下的破损」建成契约。
 *
 * 处置分级（本文件与相关 CSS 注释里出现的 P0~P3 即指这四档；判据只在本处声明一次）：
 *   **P0 硬裁切**——文字被容器吃掉或压到相邻元素上（`overflow: hidden` 且墨迹越界、`nowrap`
 *     且 `overflow: visible` 的横向外溢）。用户既看不到也读不到 ⇒ **一律修到 0**。
 *   **P1 卡主名称**——卡片里用于区分条目的主标识（名称）。放宽到 2 行仍不够时，必须挂
 *     `title` / `aria-label` 复原（②③ 两类断言共同覆盖）。
 *   **P2 次要元信息**——元素 / 命途 / 属性名 / 副标等二级信息。**允许保留 ellipsis**，
 *     但必须有 `title` / `aria-label` 复原；换行代价为零时优先换行。
 *   **P3 导航标签**——侧栏 / 底栏 / 区块导航 / 页签。**禁止截断**（被截的导航等于失效导航），
 *     且「能点到」才算没被截：内容变高把导航项推出视口同样违规。
 *
 * 三类判据（口径见 `docs/audit/UI质量验收标准.md` A5.6 与 `docs/memory/ui-tokens.md`）：
 *   ① **硬裁切 / 外溢**（`overflow != visible` 且 `scrollWidth > clientWidth` 且**无** ellipsis；
 *      `nowrap` + `overflow: visible` 的横向外溢；纵向硬裁切）——文字被吃掉或压到别人身上，恒为缺陷。
 *   ② **导航标签不得被省略**（P3）：导航是骨架，被截的导航等于失效导航。
 *   ③ **截断必须有复原手段**：任何被截断的叶子（含有意 ellipsis / line-clamp）必须能在自身或
 *      5 层祖先上找到含该文本的 `title` / `aria-label`（触屏没有 hover，否则那段字永久读不到）。
 *      这一条沿用 `e2e/layout-catalog.spec.ts` 的既有判据，本文件把它扩到**多语言 + 迭代全范围**。
 *
 * 与既有文件的分工：`helpers.findHorizontalOverflow`（整页右边界越界）管「元素越出视口」；
 * 本文件管「文本被容器吃掉」（CSS 溢出探针看不见它——`scrollWidth` 不产生布局越界）。
 * 两者互补，不重复。
 *
 * 标签：用例内自钉视口 ⇒ 必须静态声明 `@viewport-pinned`（mobile-chromium 项目以 `grepInvert` 跳过；
 * 动态 annotation 对收集期过滤无效）。手机断点面单独一条用例覆盖。
 *
 * 期望值一律**不写死**：路由取迭代范围清单，详情 id 从随站数据派生。
 */

/** 迭代范围（`docs/audit/UI质量验收标准.md` §6）：范围外页面不因本目标改动，也不在此断言 */
const ROUTE_FAMILIES: readonly { name: string; path: (base: string) => string }[] = [
  { name: 'home', path: (b) => `${b}/` },
  { name: 'character-catalog', path: (b) => `${b}/character` },
  { name: 'lightcone-catalog', path: (b) => `${b}/lightcone` },
  { name: 'relic-catalog', path: (b) => `${b}/relic` },
  { name: 'cw-hub', path: (b) => `${b}/currency` },
  { name: 'cw-role-catalog', path: (b) => `${b}/currency/role` },
  { name: 'cw-item', path: (b) => `${b}/currency/item` },
  { name: 'cw-buff', path: (b) => `${b}/currency/buff` },
  { name: 'cw-augment', path: (b) => `${b}/currency/augment` },
  { name: 'cw-trait-catalog', path: (b) => `${b}/currency/trait` },
];

/**
 * 长文案风险最高的语言（译文最长 + 断行规则最特殊）：
 * de 复合词、ru 长词 + 西里尔、th 无词间空格、vi 音节多 + 变音符、pt 长介词短语。
 * 缺省语言 cn 作对照（它在改动前就命中若干条，属真实既有缺陷而非译文问题）。
 * 需要全量时设 `I18N_OVERFLOW_ALL=1`（13 语言，墙钟约 ×2.6）。
 */
const RISK_LOCALES = process.env.I18N_OVERFLOW_ALL
  ? ['cn', 'cht', 'en', 'kr', 'jp', 'es', 'ru', 'th', 'vi', 'id', 'fr', 'de', 'pt']
  : ['cn', 'de', 'ru', 'th', 'vi'];

const prefixOf = (code: string): string => (code === 'cn' ? '' : `/${code}`);

const firstId = (file: string, listKey?: string): string => {
  const raw = readJsonIn<Record<string, unknown> | unknown[]>('cn', `public/data/cn/${file}`);
  const arr = Array.isArray(raw) ? raw : ((raw as Record<string, unknown[]>)[listKey ?? ''] ?? []);
  const first = (Array.isArray(raw) ? raw[0] : arr[0]) as { id: number | string };
  return String(first.id);
};

/**
 * 详情页路径（迭代范围内的 5 个详情族），id 从结构层派生。
 * 详情页同构 ⇒ 每族抽一条代表路由即可覆盖版式；规格扫全量由各域既有分域文件承担。
 */
const detailRoutes = (base: string): { name: string; path: string }[] => [
  { name: 'character-detail', path: `${base}/character/${firstId('characters.json')}` },
  { name: 'lightcone-detail', path: `${base}/lightcone/${firstId('light_cones.json')}` },
  { name: 'relic-detail', path: `${base}/relic/${firstId('relics.json')}` },
  { name: 'cw-role-detail', path: `${base}/currency/role/${firstId('currency/role.json', 'roles')}` },
  { name: 'cw-trait-detail', path: `${base}/currency/trait/${firstId('currency/traits.json', 'traits')}` },
];

/**
 * 确定性就绪门。**骨架退场不等于内容到位**：目录卡在数据取回后才渲染，
 * 只等骨架会把「卡片还没渲染」记成「零缺陷」（实测踩过：de/cw-buff 的整批卡名截断被漏掉）。
 * 故轮询正文长度直到连续两轮不变。
 */
async function settleForMeasurement(page: import('@playwright/test').Page): Promise<void> {
  await waitForSettled(page);
  await page
    .waitForFunction(
      () => {
        const n = (document.body.innerText || '').length;
        const w = window as unknown as { __nkStableLen?: number };
        const stable = w.__nkStableLen === n;
        w.__nkStableLen = n;
        return stable && n > 150;
      },
      undefined,
      { timeout: 10_000, polling: 120 },
    )
    .catch(() => {});
  // 视图过渡期间根节点带位移（±24/±40px），此刻测量会把「整页」报成外溢 ⇒ 等过渡类消失
  await page
    .waitForFunction(() => !document.querySelector('[class*="nk-view-"][class*="-active"]'), undefined, {
      timeout: 10_000,
    })
    .catch(() => {});
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

interface Defects {
  pageOverflow: number;
  hardClipX: string[];
  spillX: string[];
  hardClipY: string[];
  clippedNoFallback: string[];
  navClipped: string[];
}

/** 单次 evaluate 取全部判据（避免多次往返之间页面变化导致口径不一致） */
async function scanDefects(page: import('@playwright/test').Page): Promise<Defects> {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const hardClipX: string[] = [];
    const spillX: string[] = [];
    const hardClipY: string[] = [];
    const clippedNoFallback: string[] = [];
    const navClipped: string[] = [];

    /** 视图过渡中的元素带位移，是这个判据的已知假阳性来源 */
    const inTransition = (el: Element): boolean => {
      let cur: Element | null = el;
      while (cur) {
        if (/nk-view-[\w-]*-active/.test(String(cur.className || ''))) return true;
        cur = cur.parentElement;
      }
      return false;
    };
    const inScrollableAncestor = (el: Element): boolean => {
      let cur: Element | null = el.parentElement;
      while (cur) {
        const o = getComputedStyle(cur).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    const sel = (el: Element): string => {
      const parts: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; i < 3 && cur && cur.tagName !== 'BODY'; i++) {
        const cls = String(cur.className || '').trim().split(/\s+/).filter(Boolean).slice(0, 3);
        parts.unshift(`${cur.tagName.toLowerCase()}${cls.length ? '.' + cls.join('.') : ''}`);
        cur = cur.parentElement;
      }
      return parts.join(' > ');
    };
    const txt = (el: Element): string => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46);

    /** 导航骨架（P3：禁止截断）——侧栏 / 底栏 / 区块导航 / 页签。
     *  排除 `.ui-sidebar-link__en`：它是导航项上的**大写拉丁副标**（二级信息，P2），
     *  `tokens.css` 自始就给它 ellipsis 属有意设计；真正承载导航语义的是 `__cn` 主标。 */
    const isNav = (el: Element): boolean =>
      !/ui-sidebar-link__en/.test(String(el.className || '')) &&
      /ui-sidebar-link|nk-secnav|nk-egm__nav|role="tab"|nk-cat-tab/.test(
        `${el.className || ''} ${el.getAttribute('role') || ''}`,
      );

    /**
     * 纵向硬裁切判据 = 「文本墨迹越界」**或**「元素布局盒越界」。
     *
     * 为什么需要两档（每一步都是被实测推翻的）：
     *  - 只看 `scrollHeight > clientHeight` ⇒ **假阳性**：`.nk-ctrait-hero` 的旋转装饰
     *    （`rotate(45deg)` + img 放大 1.3）把 scrollHeight 撑到 198 > 192，但 `overflow` 在
     *    hidden / visible 间切换时该区域**截图逐字节相同** ⇒ 无内容被裁。
     *  - 只加「元素后代布局盒越界」⇒ **漏报**：纯文本因 `line-height` 过小被裁时没有元素后代，
     *    真实案例 `h1.nk-cat-title` 的 `line-height: 1.12`（行盒 33px < 内容 37px，中文也命中）。
     *  - 故二者取或；有效性由四条路径自检：真实 hero 放行 / 纯文本墨迹裁切报出 /
     *    「transform 撑高 + 内层真超框」报出 / 正常文本放行。
     */
    const inkOverflowsY = (el: Element): boolean => {
      const box = el.getBoundingClientRect();
      const elH = el as HTMLElement;
      const limBottom = box.top + elH.clientHeight + 1;
      const limRight = box.left + elH.clientWidth + 1;
      for (const node of el.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;
        if (!(node.textContent || '').trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 0.5 || r.height < 0.5) continue;
          if (r.bottom > limBottom || r.right > limRight) return true;
        }
      }
      return false;
    };
    const layoutOverflows = (host: Element): boolean => {
      const hostEl = host as HTMLElement;
      for (const child of host.querySelectorAll('*')) {
        const ccs = getComputedStyle(child);
        if (ccs.display === 'none' || ccs.visibility === 'hidden') continue;
        let x = 0;
        let y = 0;
        let cur: Element | null = child;
        while (cur && cur !== host) {
          const off = cur as HTMLElement;
          x += off.offsetLeft;
          y += off.offsetTop;
          cur = off.offsetParent;
        }
        if (cur !== host) return true; // 证不出 ⇒ 保守报出
        const childEl = child as HTMLElement;
        if (y + childEl.offsetHeight > hostEl.clientHeight + 1) return true;
        if (x + childEl.offsetWidth > hostEl.clientWidth + 1) return true;
      }
      return false;
    };

    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) <= 0.01) continue;
      if (inTransition(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || el.clientWidth <= 0) continue;

      const text = txt(el);
      if (text.length < 2) continue;

      const isEllipsis = cs.textOverflow === 'ellipsis';
      const isClamp = cs.webkitLineClamp && cs.webkitLineClamp !== 'none';
      /* 只有 `hidden` / `clip` 才是「静默吃掉内容」。`auto` / `scroll` 是**设计性滚动**
         （内容可被用户滚到），把它算作裁切会把可横滚的数据表报成缺陷——实测踩过：
         货币战争成长矩阵 `min-width: 440px` 在 390 视口下可横滚，被误报 4 条。 */
      const clipsX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      const clippedX = el.scrollWidth > el.clientWidth + 1;

      if (clipsX && clippedX) {
        const rec = `${sel(el)} +${el.scrollWidth - el.clientWidth}px "${text}"`;
        // ① 无 ellipsis / clamp 的横向裁切 ⇒ 文字被吃掉且用户无从得知（恒为缺陷）
        if (!isEllipsis && !isClamp) hardClipX.push(rec);
        // ③ 截断必须有复原手段
        let cur: Element | null = el;
        let hasFallback = false;
        for (let i = 0; i < 5 && cur && cur !== document.body; i++) {
          const t = cur.getAttribute('title');
          const a = cur.getAttribute('aria-label');
          if ((t && t.includes(text)) || (a && a.includes(text))) {
            hasFallback = true;
            break;
          }
          cur = cur.parentElement;
        }
        if (!hasFallback) clippedNoFallback.push(rec);
        // ② 导航不得被省略
        if (isNav(el)) navClipped.push(rec);
      } else if (!clipsX && clippedX && cs.whiteSpace === 'nowrap') {
        // nowrap 且 overflow 可见 ⇒ 文字压到相邻元素上
        spillX.push(`${sel(el)} +${el.scrollWidth - el.clientWidth}px "${text}"`);
      }

      if (cs.overflowY === 'hidden' && !isClamp && el.scrollHeight > el.clientHeight + 2) {
        if (inkOverflowsY(el) || layoutOverflows(el)) {
          hardClipY.push(`${sel(el)} +${el.scrollHeight - el.clientHeight}px "${text}"`);
        }
      }
    }

    return {
      pageOverflow: de.scrollWidth - vw,
      hardClipX: [...new Set(hardClipX)].slice(0, 12),
      spillX: [...new Set(spillX)].slice(0, 12),
      hardClipY: [...new Set(hardClipY)].slice(0, 12),
      clippedNoFallback: [...new Set(clippedNoFallback)].slice(0, 12),
      navClipped: [...new Set(navClipped)].slice(0, 12),
    };
  });
}

test.describe('布局验收：多语言长文案（硬裁切 / 外溢 / 截断复原）', () => {
  /* 桌面档每条语言**只加载每个路由一次**、在一趟里取全部判据。
     理由：判据彼此独立但取样成本相同（都要等就绪门 + 过渡结束），拆成多条会让
     同一路由被重复加载 2~3 遍（5 语言 × 15 路由 × 3 遍 = 225 次导航，墙钟不成比例）。
     失败归因仍充分——每条失败串都带「路由名 + 判据 + 选择器 + 实测数字」。 */
  for (const code of RISK_LOCALES) {
    const base = prefixOf(code);

    test(`${code}：迭代全范围长文案无硬裁切 / 外溢 / 截断丢失`, { tag: '@viewport-pinned' }, async ({ page }) => {
      test.setTimeout(180_000);
      const { assertNoErrors } = collectConsoleIssues(page);
      await page.setViewportSize({ width: 1280, height: 900 });

      /* 目录族 + 枢纽页：长文案最密集（卡片主名称、标签链、计数），且**中文也命中**若干条
         ⇒ 这一批是「既有布局缺陷」而非纯译文问题，改前就有、改后必须为 0。 */
      const routes = [
        ...ROUTE_FAMILIES.map((r) => ({ name: r.name, path: r.path(base) })),
        ...detailRoutes(base),
      ];

      const failures: string[] = [];
      for (const route of routes) {
        await page.goto(route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${route.name} 横向外溢 ${x}`);
        for (const x of d.hardClipY) failures.push(`${route.name} 纵向硬裁切 ${x}`);
        for (const x of d.navClipped) failures.push(`${route.name} 导航被截断 ${x}`);
        // ③ 截断必须有复原手段：触屏没有 hover，否则那段字永久读不到
        for (const x of d.clippedNoFallback) failures.push(`${route.name} 截断无复原文本 ${x}`);
      }
      expect(failures, `${code}：长文案布局破损`).toEqual([]);
      assertNoErrors();
    });
  }

  /* 手机断点（390）：窄视口下长文案最先撑破的是网格与标签链。
     独立成条而非并进上面那条——手机档的溢出根因（固定卡宽 / 列数）与桌面档不同。 */
  test('手机档（390）：长文案不撑破网格、不产生整页横向溢出', { tag: '@viewport-pinned' }, async ({ page }) => {
    test.setTimeout(180_000);
    const { assertNoErrors } = collectConsoleIssues(page);
    await page.setViewportSize({ width: 390, height: 844 });

    const failures: string[] = [];
    for (const code of RISK_LOCALES) {
      const base = prefixOf(code);
      // 手机档详情族只抽缺省语言：详情页在窄视口的版式与语言无关（同构骨架），
      // 而 5 语言 × 5 详情族的墙钟不成比例 ⇒ 目录族全语言 + 详情族单语言已覆盖两类根因。
      const routes = [
        ...ROUTE_FAMILIES.map((r) => ({ name: r.name, path: r.path(base) })),
        ...(code === 'cn' ? detailRoutes(base) : []),
      ];
      for (const route of routes) {
        await page.goto(route.path);
        await settleForMeasurement(page);
        const d = await scanDefects(page);
        if (d.pageOverflow > 1) failures.push(`${code}/${route.name}: 整页横向溢出 ${d.pageOverflow}px`);
        for (const x of d.hardClipX) failures.push(`${code}/${route.name} 横向硬裁切 ${x}`);
        for (const x of d.spillX) failures.push(`${code}/${route.name} 横向外溢 ${x}`);
        for (const x of d.navClipped) failures.push(`${code}/${route.name} 导航被截断 ${x}`);
      }
    }
    expect(failures, '手机档布局破损').toEqual([]);
    assertNoErrors();
  });
});
