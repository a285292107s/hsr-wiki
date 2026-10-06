import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page } from '@playwright/test';

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
export const KNOWN_OVERFLOWS: { match: string; note: string }[] = [];

/**
 * 拆分溢出检测结果：`known` = 已登记项（打印告警），`unknown` = 新溢出（调用方断言为空）。
 * 用法：`expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([])`
 *
 * 告警按**缺陷条目**聚合而非按元素：同一登记项常命中整棵子树的多个元素
 * （`.nk-seg` 实测 5 个元素同源），逐元素打印会把同一条 note 刷 N 遍。
 * 每次调用内按登记项去重——「哪条已知缺陷被触发」本身已是可行动信息，元素级细节留在
 * 报告产物（trace / HTML report）里，不占终端输出。
 */
export function splitKnownOverflow(found: string[]): { known: string[]; unknown: string[] } {
  const isKnown = (s: string) => KNOWN_OVERFLOWS.find((k) => s.includes(k.match));
  const known = found.filter((s) => isKnown(s));
  for (const k of KNOWN_OVERFLOWS) {
    const hits = known.filter((s) => s.includes(k.match));
    if (!hits.length) continue;
    console.warn(
      `[layout 已知溢出] ${k.match}：命中 ${hits.length} 个元素（${hits.map((s) => s.split(' ')[0]).join(', ')}）— ${k.note}`,
    );
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
  // 语义上应测**稳定态**布局，故先等过渡类消失。
  //
  // 上限 10s（原为 1s）：**1s 是 CI flaky 的根因**——慢 runner 上「过渡 + 首屏渲染」实测超过 1s，
  // 上限过期后回落到「按过渡态测量」，于是报出整页同向位移。CI 证据（2026-10）：失败列表首项为
  // `div.nk-view-swap-enter-from.nk-view-swap-enter-active right=1320 left=40`（1280 视口 +40 位移），
  // 其后 5 项（brand / scrim / content / release / footer）是同一棵树的同一位移。10s 留一个数量级余量，
  // 正常路径仍是「条件一满足就返回」（本地实测 <20ms）。
  // 超时只告警不硬失败：真卡住的过渡会在后续断言里以「整页同向位移」现形，且提示语直接给出该指纹。
  let transitionTimedOut = false;
  await page
    .waitForFunction(() => !document.querySelector('[class*="nk-view-"][class*="-active"]'), undefined, { timeout: 10_000 })
    .catch(() => {
      transitionTimedOut = true;
      console.warn(
        '[L3 溢出] 等待视图过渡类消失超时（10s），按当前态测量；若报出整页同向位移（right ≈ 视口 + 24/40）即为过渡未结束，不是布局缺陷',
      );
    });
  const { bad, ctx } = await page.evaluate(() => {
    const bad: string[] = [];
    const de = document.documentElement;
    // 右边界取**布局视口** `clientWidth`：`innerWidth` 含经典滚动条宽度，做右边界会漏检
    // 「内容压在滚动条下」的真实溢出，也与下方文档级判据（本来就用 clientWidth）口径不一致。
    const vw = de.clientWidth;
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
    if (de.scrollWidth > vw + 1) {
      bad.push(`<html> scrollWidth=${de.scrollWidth} clientWidth=${vw}`);
    }
    // 各页根是 `inset: 0` + `left: var(--nk-content-offset)`（tokens.css）⇒ 其右边界**恒等于**
    // 包含块（`#app`）的右边界：页根一旦被判越界，根因在包含块宽度而不是页根本身，故两者一起取证。
    const app = document.getElementById('app');
    const appRect = app?.getBoundingClientRect();
    return {
      bad: bad.slice(0, 20),
      ctx: `innerWidth=${window.innerWidth} clientWidth=${vw} htmlScrollWidth=${de.scrollWidth}`
        + ` dpr=${window.devicePixelRatio} #app=${appRect ? `${appRect.left.toFixed(1)}..${appRect.right.toFixed(1)}` : 'n/a'}`,
    };
  });
  if (!bad.length) return bad;
  // 取证件并入返回值首项：`toEqual([])` 的报错只打印数组本身，没有这些数字就无法区分
  // 「真实溢出 / 经典滚动条 / DPR / 过渡残留」（2026-10 一次 Linux-only 的 2px 报告事后无从定性）。
  return [`<诊断 ${ctx}${transitionTimedOut ? ' 过渡等待超时' : ''}>`, ...bad];
}

/**
 * 令牌/关系规格原语 —— 数值断言不得钉死绝对值，只有三种合法形态：
 *   1) 与 CSS 令牌一致（`readToken`/`readTokenPx` 读期望，`computedNumber`/`fontPx` 读实际）；
 *   2) 元素之间的相对关系（序、等值、整数倍、跨断点只放大不缩小）；
 *   3) 期望值从随站数据派生（`readJson`）。
 * 绝对值只允许出现在「跨会话不得漂移的契约值」（侧栏避让 148/88、断点 768、底部栏高度下限）。
 */

/** 读取 CSS 自定义属性的计算值（原样返回，含单位；缺省返回空串）。 */
export async function readToken(page: Page, name: string, host = 'html'): Promise<string> {
  return page.locator(host).first().evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);
}

/** 读取 CSS 自定义属性的数值（px 数字；缺省或无单位如手机档 `--nk-content-offset: 0` 返回 0）。 */
export async function readTokenPx(page: Page, name: string, host = 'html'): Promise<number> {
  return parseFloat(await readToken(page, name, host)) || 0;
}

/** 读取元素某个计算样式的数值（px 数字；`none`/0 等非数值返回 0）。 */
export async function computedNumber(loc: Locator, prop: string): Promise<number> {
  return loc.evaluate((el, p) => parseFloat(getComputedStyle(el).getPropertyValue(p)) || 0, prop);
}

/** 读取元素计算字号（px 数字），字号档位断言的统一入口。 */
export async function fontPx(loc: Locator): Promise<number> {
  return computedNumber(loc, 'font-size');
}

/**
 * 把令牌解析成计算颜色（`rgb(...)`/`rgba(...)`），用于「元素实际颜色 = 令牌」类断言。
 * 实现：把令牌原值挂到一个离线探针元素上再由浏览器归一化（hex / color-mix / rgba 皆可）。
 * 令牌未声明时抛错——空令牌会让探针静默继承父级颜色，断言会假通过。
 */
export async function resolveTokenColor(page: Page, name: string, host = 'html'): Promise<string> {
  const raw = await readToken(page, name, host);
  if (!raw) throw new Error(`令牌 ${name} 在 ${host} 上未声明，无法派生期望颜色`);
  return page.evaluate((value) => {
    const probe = document.createElement('span');
    probe.style.color = value;
    document.body.appendChild(probe);
    const out = getComputedStyle(probe).color;
    probe.remove();
    return out;
  }, raw);
}

/** 读取随站分发的数据 JSON（相对仓库根路径），供期望值从数据派生。 */
export function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(relPath, 'utf8')) as T;
}

/** 未知横向溢出断言：已登记项过滤后必须为空（全站布局根统一判据）。 */
export async function expectNoUnknownOverflow(page: Page): Promise<void> {
  expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
}

/**
 * 骨架退场 + 两帧绘制。确定性等待，替代固定 sleep——固定值在慢机器上不可靠、在快机器上白等。
 * 超时不失败：骨架未退场是页面缺陷，由各用例自己的断言（真卡片 / 关键容器）暴露，不由等待掩盖。
 */
async function afterSkeletonGone(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('.nk-skeleton'), undefined, { timeout }).catch(() => {});
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

/** 首屏稳定：字体就绪 + 骨架退场 + 两帧绘制。a11y 扫描与像素基线取值前必须调用（骨架阶段取值会误报）。
 *  两条等待各设 5s 上限：最坏情况（CI 上字体请求卡住 + 骨架不退场）也只花 10s，不会逼近 30s 的用例超时。 */
export async function waitForSettled(page: Page): Promise<void> {
  await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5_000 }).catch(() => {});
  await afterSkeletonGone(page, 5_000);
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
  // 虚拟滚动首屏渲染完成后等骨架退场 + 两帧
  await afterSkeletonGone(page);
}
