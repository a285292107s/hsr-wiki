import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import { hasTextToken, resolveTextTokens, type TextPack } from '../src/lib/i18n/text-ref';

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
  //
  // **「等到没有 -active」是空真，必须配「测量结果是否稳定」的自检**（2026-10-16 CI 实测）：
  // 客户端路由跳转后，`waitForFunction` 会在**过渡尚未开始**时立刻通过（此刻旧视图还在场、新视图
  // 的 chunk 还没到，DOM 里没有任何 -active ⇒ 谓词为真）。随后 `evaluate` 排队执行，而 CSS 过渡由
  // 合成器驱动、照常推进 ⇒ 测量落进过渡中间态。CI 报出的正是这个：`div right=1282 left=2`
  // （宽恰 1280 = 布局视口宽、右移恰 2px）+ 诊断 `htmlScrollWidth=1280 #app=0.0..1280.0`
  // ——**文档根本没溢出**。它是页根 `#nk-catalog-app` 在 `nk-view-fwd` 进入动画
  // （`translateX(24px)` → 0）里的相位：本地 rAF 采样实测该元素经过 L=4/L=1 两帧，
  // 且报出的元素**无 class** ⇒ 是「类已摘、位移还在」的合成器尾帧（helpers 只按 className 拼描述，
  // 带 id 无 class 的页根就被打成了裸 `div`，故本次同时给描述补上 id）。
  // 与 docs/memory/testing.md 里 `.theme-transitioning` 那条同类（等「不在场」等到的是空真）。
  //
  // 判据用**两次采样逐项一致**而不是只看类：类消失与几何归位之间隔着合成器的一帧，只查类会漏。
  // 稳定态下两次采样必然一致；过渡 / 落位中则不一致 ⇒ 重测。
  // **这不是 `--retries`**（那会把真红转绿，仓库禁止）：此处只判「量到的时刻是否已经是稳定态」，
  // 真缺陷的几何是稳态属性，两次采样照样一致、照样上报 ⇒ 真红不会被抹掉。
  // 重试上限内仍不一致才按当前结果返回，并在诊断里标明「未稳定」。
  const MAX_ATTEMPTS = 5;
  let transitionTimedOut = false;
  for (let attempt = 1; ; attempt += 1) {
    transitionTimedOut = !(await page
      .waitForFunction(() => !document.querySelector('[class*="nk-view-"][class*="-active"]'), undefined, { timeout: attempt === 1 ? 10_000 : 5_000 })
      .then(() => true)
      .catch(() => false));
    if (transitionTimedOut) {
      console.warn(
        '[L3 溢出] 等待视图过渡类消失超时，按当前态测量；若报出整页同向位移（right ≈ 视口 + 24/40）即为过渡未结束，不是布局缺陷',
      );
    }
    const first = await measureOverflowOnce(page);
    if (!first.bad.length) return first.bad;
    const second = await measureOverflowOnce(page);
    const settled = !first.inFlight && !second.inFlight
      && first.bad.length === second.bad.length
      && first.bad.every((s, i) => s === second.bad[i]);
    if (settled || attempt >= MAX_ATTEMPTS) {
      return [
        `<诊断 ${second.ctx}${transitionTimedOut ? ' 过渡等待超时' : ''}`
        + `${settled ? '' : ` 两次采样不一致（已重试 ${attempt} 次，可能仍在过渡/落位）`}>`,
        ...second.bad,
      ];
    }
    console.warn(`[L3 溢出] 第 ${attempt} 次测量未稳定（命中 ${first.bad.length} 项），重测`);
  }
}

/** 单次横向溢出测量：先等两帧绘制（落在稳定绘帧边界），再量。
 *  `inFlight` = 测量当刻 DOM 里仍有 `nk-view-*-active`（结果不可信，调用方应重测）。 */
async function measureOverflowOnce(page: Page): Promise<{ bad: string[]; ctx: string; inFlight: boolean }> {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const { bad, ctx, inFlight } = await page.evaluate(() => {
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
          // 描述**带 id**：`#app` / `#nk-catalog-app` 这类带 id 无 class 的页根，只按 className
          // 拼出来是裸 `div`，事后无法定位（2026-10-16 CI 那次 2px 报告正因此无从定性）。
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
          bad.push(
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
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
    // 测量当刻过渡是否仍在跑（含「等待通过之后才启动」的窗口）——为真则本次结果不可信
    return {
      bad: bad.slice(0, 20),
      inFlight: !!document.querySelector('[class*="nk-view-"][class*="-active"]'),
      ctx: `innerWidth=${window.innerWidth} clientWidth=${vw} htmlScrollWidth=${de.scrollWidth}`
        + ` dpr=${window.devicePixelRatio} #app=${appRect ? `${appRect.left.toFixed(1)}..${appRect.right.toFixed(1)}` : 'n/a'}`,
    };
  });
  return { bad, ctx, inFlight };
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

const packCache = new Map<string, TextPack>();

/** 指定语言的语言包合并表（各分组包并成一张 `键 → 正文` 表）；目录不存在时为空的表。 */
export function textPackOf(locale: string): TextPack {
  const hit = packCache.get(locale);
  if (hit) return hit;
  const merged: Record<string, string> = {};
  const dir = join('public', 'data', 'i18n', locale);
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (f.endsWith('.json')) {
        Object.assign(merged, JSON.parse(readFileSync(join(dir, f), 'utf8')) as TextPack);
      }
    }
  }
  packCache.set(locale, merged);
  return merged;
}

/**
 * 缺省语言（cn）的语言包合并表。
 * 结构层未令牌化时目录不存在 ⇒ 返回空表，`readJson` 行为与改造前一致。
 */
export function defaultTextPack(): TextPack {
  return textPackOf('cn');
}

/**
 * 读随站分发的数据 JSON 并**按指定语言**解析令牌（多语言契约取证用，如断言英文页正文）。
 */
export function readJsonIn<T>(locale: string, relPath: string): T {
  const raw = JSON.parse(readFileSync(relPath, 'utf8')) as T;
  return hasTextToken(raw) ? resolveTextTokens(raw, textPackOf(locale)) : raw;
}

/**
 * 读取随站分发的数据 JSON（相对仓库根路径），供期望值从数据派生。
 * 结构层里的文本是引用令牌（ADR 0052）⇒ 先解析成缺省语言正文再交给断言；未令牌化时原样返回。
 */
export function readJson<T>(relPath: string): T {
  const raw = JSON.parse(readFileSync(relPath, 'utf8')) as T;
  return hasTextToken(raw) ? resolveTextTokens(raw, defaultTextPack()) : raw;
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

/**
 * 等待**路由视图真的挂载**（懒加载 chunk 执行完并渲染出页面根）。
 *
 * 为什么必须有这一步：`#app` 里先只有外壳（SidebarNav + ToastHost），视图 chunk 到达前
 * **既没有骨架也没有正文**——此时「无 `.nk-skeleton`」是**空真**，只查它会立刻通过，
 * 随后的取值拿到 null（CI 实测：骨架检查通过 24ms 后取值，`/endgame/maze` 的 note 链接还不存在；
 * 实测 DOM 形态：挂载前 `#app` 子节点 = `nav.ui-sidebar` + `div.nk-toast-container`、正文 165 字符、
 * 标题仍是站点默认；挂载后多出视图根、正文数千字符）。
 *
 * 判据 = `#app` 出现**非外壳**子节点。外壳清单（`SHELL_OWNED`）新增成员时必须同步这里，
 * 否则新外壳元素会被误判成视图（退化成空真）。超时不失败：页面缺陷由用例自己的断言暴露。
 */
const SHELL_OWNED = ['.ui-sidebar', '.nk-toast-container'];

export async function waitForViewMounted(page: Page, timeout = 10_000): Promise<void> {
  await page
    .waitForFunction(
      (shell: string[]) => {
        const app = document.getElementById('app');
        if (!app) return false;
        return [...app.children].some((el) => !shell.some((s) => el.matches(s)));
      },
      SHELL_OWNED,
      { timeout },
    )
    .catch(() => {});
}

/** 首屏稳定：字体就绪 + **视图挂载** + 骨架退场 + 两帧绘制。a11y 扫描与像素基线取值前必须调用
 *  （骨架阶段取值会误报）。
 *  **字体等待不能只查 `document.fonts.status`**：入口 CSS 的 `@font-face` 尚未应用（或首屏还没有对应文本）
 *  时它已经是 `'loaded'`，测量就落在**回退字体**的几何上——CI 实测两次假红：首页被回退字宽撑出
 *  `scrollable-region-focusable`、`shell.spec` 的字体可用性断言为假。故显式 `load()` 两个族的样本文本
 *  再等 `ready`。各等待都设上限：最坏情况（字体请求卡住 + 骨架不退场）也只花 ~15s，不逼近用例超时。 */
export async function waitForSettled(page: Page): Promise<void> {
  await page
    .evaluate(
      (ms) =>
        Promise.race([
          (async () => {
            for (const [family, text] of [['Noto Sans SC', '角色图鉴'], ['IBM Plex Mono', '1234']] as const) {
              try { await document.fonts.load(`12px "${family}"`, text); } catch { /* 字体缺失不阻断，交给调用方的断言 */ }
            }
            await document.fonts.ready;
          })(),
          new Promise((resolve) => setTimeout(resolve, ms)),
        ]),
      10_000,
    )
    .catch(() => {});
  await page.waitForFunction(() => document.fonts.status === 'loaded', undefined, { timeout: 5_000 }).catch(() => {});
  await waitForViewMounted(page);
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
