import { readJsonIn, waitForSettled } from './helpers';

export const ROUTE_FAMILIES: readonly { name: string; path: (base: string) => string }[] = [
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

export const RISK_LOCALES = process.env.I18N_OVERFLOW_ALL
  ? ['cn', 'cht', 'en', 'kr', 'jp', 'es', 'ru', 'th', 'vi', 'id', 'fr', 'de', 'pt']
  : ['cn', 'de', 'ru', 'th', 'vi'];

export const prefixOf = (code: string): string => (code === 'cn' ? '' : `/${code}`);

const firstId = (file: string, listKey?: string): string => {
  const raw = readJsonIn<Record<string, unknown> | unknown[]>('cn', `public/data/cn/${file}`);
  const arr = Array.isArray(raw) ? raw : ((raw as Record<string, unknown[]>)[listKey ?? ''] ?? []);
  const first = (Array.isArray(raw) ? raw[0] : arr[0]) as { id: number | string };
  return String(first.id);
};

export const detailRoutes = (base: string): { name: string; path: string }[] => [
  { name: 'character-detail', path: `${base}/character/${firstId('characters.json')}` },
  { name: 'lightcone-detail', path: `${base}/lightcone/${firstId('light_cones.json')}` },
  { name: 'relic-detail', path: `${base}/relic/${firstId('relics.json')}` },
  { name: 'cw-role-detail', path: `${base}/currency/role/${firstId('currency/role.json', 'roles')}` },
  { name: 'cw-trait-detail', path: `${base}/currency/trait/${firstId('currency/traits.json', 'traits')}` },
];

export async function settleForMeasurement(page: import('@playwright/test').Page): Promise<void> {
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
  await page
    .waitForFunction(() => !document.querySelector('[class*="nk-view-"][class*="-active"]'), undefined, {
      timeout: 10_000,
    })
    .catch(() => {});
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

export interface Defects {
  pageOverflow: number;
  hardClipX: string[];
  spillX: string[];
  hardClipY: string[];
  clippedNoFallback: string[];
  navClipped: string[];
}

export async function scanDefects(page: import('@playwright/test').Page): Promise<Defects> {
  return page.evaluate(() => {
    const de = document.documentElement;
    const vw = de.clientWidth;
    const hardClipX: string[] = [];
    const spillX: string[] = [];
    const hardClipY: string[] = [];
    const clippedNoFallback: string[] = [];
    const navClipped: string[] = [];

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

    const isNav = (el: Element): boolean =>
      !/ui-sidebar-link__en/.test(String(el.className || '')) &&
      /ui-sidebar-link|nk-secnav|nk-egm__nav|role="tab"|nk-cat-tab/.test(
        `${el.className || ''} ${el.getAttribute('role') || ''}`,
      );

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
        if (cur !== host) return true;
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
      const clipsX = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      const clippedX = el.scrollWidth > el.clientWidth + 1;

      if (clipsX && clippedX) {
        const rec = `${sel(el)} +${el.scrollWidth - el.clientWidth}px "${text}"`;
        if (!isEllipsis && !isClamp) hardClipX.push(rec);
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
        if (isNav(el)) navClipped.push(rec);
      } else if (!clipsX && clippedX && cs.whiteSpace === 'nowrap') {
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
