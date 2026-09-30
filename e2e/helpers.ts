import { type Page } from '@playwright/test';

export interface ConsoleIssues {
  pageErrors: string[];
  consoleErrors: string[];
}

/** 挂载 console/pageerror 监听，返回收集器与断言辅助 */
export function collectConsoleIssues(page: Page): {
  issues: ConsoleIssues;
  assertNoErrors: () => void;
} {
  const issues: ConsoleIssues = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => issues.pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.consoleErrors.push(msg.text());
  });
  return {
    issues,
    assertNoErrors: () => {
      // pageerror 是硬性 JS 异常，必须为零
      const errors = issues.pageErrors.filter(
        (e) => !e.includes('ResizeObserver loop') && !e.includes('ResizeObserver loop completed'),
      );
      if (errors.length) {
        throw new Error(`页面存在未捕获 JS 异常：\n${errors.join('\n')}`);
      }
      // console error 可能是环境性（CDN 加载失败），仅记录不硬断言——由截图/aria 基线兜底
    },
  };
}

/**
 * 已登记的既有横向溢出（已知缺陷，非豁免机制）。
 * 命中项在 `splitKnownOverflow` 里被过滤并 `console.warn`，未登记的新溢出仍然失败。
 * 纪律：禁止往这里堆条目以「修绿」——每条必须是已实测、已定性、且已裁决暂不修的真实缺陷，
 * 并在 note 里写清现象与修法归属。修掉后必须把条目删掉。
 */
export const KNOWN_OVERFLOWS: { match: string; note: string }[] = [
  {
    match: 'nk-seg',
    note: '「开拓者形态」分段控件（SettingsView.vue 的 .nk-seg 双列 grid；两选项 min-content 各约 182px）在手机宽（320 / 412 实测）下超出可用宽，被自身 overflow:hidden 裁掉第二列（412px 实测 right=467）。属真实排版缺陷；修法涉排版取舍 → 视觉改动须用户确认后再动产品 CSS',
  },
];

/**
 * 拆分溢出检测结果：`known` = 已登记项（打印告警），`unknown` = 新溢出（调用方断言为空）。
 * 用法：`expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([])`
 */
export function splitKnownOverflow(found: string[]): { known: string[]; unknown: string[] } {
  const isKnown = (s: string) => KNOWN_OVERFLOWS.some((k) => s.includes(k.match));
  const known = found.filter(isKnown);
  for (const s of known) {
    const hit = KNOWN_OVERFLOWS.find((k) => s.includes(k.match));
    console.warn(`[layout 已知溢出] ${s} — ${hit?.note ?? ''}`);
  }
  return { known, unknown: found.filter((s) => !isKnown(s)) };
}

/**
 * L3 横向溢出检测：全树扫描 body 元素，找出右边界超出视口的元素。
 *
 * 只豁免「用户能滚动到位」的祖先（overflow-x: auto/scroll）——那里内容横向可达，属设计内滚动。
 * hidden / clip 不做豁免：全站布局根（`#app { overflow: clip }`、`#nk-catalog-app` / `#nk-home-app`
 * / `.nk-page--detail` 的 `overflow-x: hidden`）会把超宽内容直接裁掉，被它们裁掉的正是本函数要找的
 * 布局缺陷。若把「被任意祖先裁剪」计入豁免，每个应用内元素都会被 `#app` 豁免、本函数恒返回 `[]`。
 */
export async function findHorizontalOverflow(page: Page): Promise<string[]> {
  // 页面过渡期间视图根带 nk-view-*-active 位移（±24/±40px），此刻测量会把「整页」报成溢出（假阳性）。
  // 语义上应测**稳定态**布局，故先等过渡类消失（上限 1s，超时按当前态测量，不掩盖真实超时）。
  await page
    .waitForFunction(() => !document.querySelector('[class*="nk-view-"][class*="-active"]'), undefined, { timeout: 1_000 })
    .catch(() => {});
  return page.evaluate(() => {
    const bad: string[] = [];
    const vw = window.innerWidth;
    /** 元素是否处于「用户可横向滚动到位」的祖先内 */
    const inScrollableAncestor = (el: Element): boolean => {
      let cur: Element | null = el.parentElement;
      while (cur) {
        const o = getComputedStyle(cur).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    document.querySelectorAll('body *').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      // 右边界超出视口（容差 1px 防亚像素）
      if (rect.right > vw + 1 || rect.left < -1) {
        // 排除固定定位层（spine 全屏画布、侧栏、Toast 等）与可滚动容器内的内容
        if (cs.position !== 'fixed' && !inScrollableAncestor(el)) {
          bad.push(
            `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 3).join('.') : ''} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
          );
        }
      }
    });
    // 文档级横向滚动是最硬性信号
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      bad.push(
        `<html> scrollWidth=${document.documentElement.scrollWidth} clientWidth=${document.documentElement.clientWidth}`,
      );
    }
    return bad.slice(0, 20);
  });
}

/**
 * 等待目录卡片渲染完成（skeleton 消失、真实卡片出现）
 *
 * 选择器必须用子串 `[class*="-grid"]`，禁止写作 `[class$="-grid"]`：
 * `CatalogPage.vue` 的网格 class 绑定为 `[config.gridClass, 'nk-virtual-grid', { 'nk-fast-jump': …, 'nk-no-reveal': … }]`
 * ——尾随条件类一旦挂上，属性串就不再以 `-grid` 结尾，属性结尾选择器会失配并退化成 15s 超时。
 * `nk-skeleton__grid` 不含 `-grid` 子串，不会误命中。
 */
export async function waitForCatalogCards(page: Page, selector = '[class*="-grid"] a') {
  await page.waitForSelector(selector, { state: 'attached', timeout: 15_000 });
  // 虚拟滚动首屏渲染完成后等待一帧，保证截图稳定
  await page.waitForTimeout(300);
}
