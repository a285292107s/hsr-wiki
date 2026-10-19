import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';
import { hasTextToken, resolveTextTokens, type TextPack } from '../src/lib/i18n/text-ref';

export interface ConsoleIssues {
  pageErrors: string[];
  consoleErrors: string[];
}

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
      const errors = issues.pageErrors.filter(
        (e) => !e.includes('ResizeObserver loop') && !e.includes('ResizeObserver loop completed'),
      );
      if (errors.length) {
        throw new Error(`页面存在未捕获 JS 异常：\n${errors.join('\n')}`);
      }
    },
  };
}

export const KNOWN_OVERFLOWS: { match: string; note: string }[] = [];

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

export async function findHorizontalOverflow(page: Page): Promise<string[]> {
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

async function measureOverflowOnce(page: Page): Promise<{ bad: string[]; ctx: string; inFlight: boolean }> {
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const { bad, ctx, inFlight } = await page.evaluate(() => {
    const bad: string[] = [];
    const de = document.documentElement;
    const vw = de.clientWidth;
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
      if (rect.right > vw + 1 || rect.left < -1) {
        if (cs.position !== 'fixed' && !inScrollableAncestor(el)) {
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
          bad.push(
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
          );
        }
      }
    });
    if (de.scrollWidth > vw + 1) {
      bad.push(`<html> scrollWidth=${de.scrollWidth} clientWidth=${vw}`);
    }
    const app = document.getElementById('app');
    const appRect = app?.getBoundingClientRect();
    return {
      bad: bad.slice(0, 20),
      inFlight: !!document.querySelector('[class*="nk-view-"][class*="-active"]'),
      ctx: `innerWidth=${window.innerWidth} clientWidth=${vw} htmlScrollWidth=${de.scrollWidth}`
        + ` dpr=${window.devicePixelRatio} #app=${appRect ? `${appRect.left.toFixed(1)}..${appRect.right.toFixed(1)}` : 'n/a'}`,
    };
  });
  return { bad, ctx, inFlight };
}

export async function readToken(page: Page, name: string, host = 'html'): Promise<string> {
  return page.locator(host).first().evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name);
}

export async function readTokenPx(page: Page, name: string, host = 'html'): Promise<number> {
  return parseFloat(await readToken(page, name, host)) || 0;
}

export async function computedNumber(loc: Locator, prop: string): Promise<number> {
  return loc.evaluate((el, p) => parseFloat(getComputedStyle(el).getPropertyValue(p)) || 0, prop);
}

export async function fontPx(loc: Locator): Promise<number> {
  return computedNumber(loc, 'font-size');
}

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

export function defaultTextPack(): TextPack {
  return textPackOf('cn');
}

export function readJsonIn<T>(locale: string, relPath: string): T {
  const raw = JSON.parse(readFileSync(relPath, 'utf8')) as T;
  return hasTextToken(raw) ? resolveTextTokens(raw, textPackOf(locale)) : raw;
}

export function readJson<T>(relPath: string): T {
  const raw = JSON.parse(readFileSync(relPath, 'utf8')) as T;
  return hasTextToken(raw) ? resolveTextTokens(raw, defaultTextPack()) : raw;
}

export async function expectNoUnknownOverflow(page: Page): Promise<void> {
  expect(splitKnownOverflow(await findHorizontalOverflow(page)).unknown).toEqual([]);
}

async function afterSkeletonGone(page: Page, timeout = 5_000): Promise<void> {
  await page.waitForFunction(() => !document.querySelector('.nk-skeleton'), undefined, { timeout }).catch(() => {});
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

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

export async function waitForSettled(page: Page): Promise<void> {
  await page
    .evaluate(
      (ms) =>
        Promise.race([
          (async () => {
            for (const [family, text] of [['Noto Sans SC', '角色图鉴'], ['IBM Plex Mono', '1234']] as const) {
              try { await document.fonts.load(`12px "${family}"`, text); } catch { }
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

export async function waitForCatalogCards(page: Page, selector = '[class*="-grid"] a') {
  await page.waitForSelector(selector, { state: 'attached', timeout: 15_000 });
  await afterSkeletonGone(page);
}
