#!/usr/bin/env node

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public', 'og.png');
const TASK = join(ROOT, 'temp', 'og-card');
const CACHE = join(ROOT, 'node_modules', '.cache', 'og-card');

const W = 1200;
const H = 630;


const KICKER = 'HONKAI: STAR RAIL DATABASE';
const BRAND = '星铁档案馆';
const GAME = '崩坏：星穹铁道 Wiki';
const LEAD = '角色、光锥、遗器、敌对物种与终局赛季，全部整理成可检索的档案。';
const INDEX_TITLE = '图鉴索引';
const LEDGER = [
  ['01', '角色', '稀有度 · 命途 · 属性 · 技能'],
  ['02', '光锥', '叠影 · 晋阶 · 适配角色'],
  ['03', '遗器', '套装效果 · 部位'],
  ['04', '敌对物种', '弱点 · 抗性 · 掉落 · 出没'],
  ['05', '终局玩法', '四模式 · 赛季与增益档案'],
  ['06', '货币战争', '角色 · 装备 · 羁绊 · 投资策略'],
];
const STRIP = ['13 语言', '数据随版本同步', 'myhsr.wiki'];


const GOOGLE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function cardChars() {
  const parts = [KICKER, BRAND, GAME, LEAD, INDEX_TITLE, ...LEDGER.flat(), ...STRIP];
  return [...new Set(parts.join('').split(''))].sort().join('');
}

function inlineSiteFonts(css, families, dir) {
  const blocks = css.match(/@font-face\s*\{[^}]*\}/g) || [];
  const picked = blocks.filter((b) => families.some((f) => b.includes(`font-family: '${f}'`)));
  if (!picked.length) throw new Error(`未在 src/styles/fonts.css 里找到家族：${families.join(', ')}（先跑 node tools/fetch-fonts.mjs）`);
  mkdirSync(join(dir, 'fonts'), { recursive: true });
  let missing = 0;
  const out = picked.map((b) =>
    b.replace(/url\(\/fonts\/([^)]+)\)/g, (_m, file) => {
      const src = join(ROOT, 'public', 'fonts', file);
      if (!existsSync(src)) { missing++; return `url(./fonts/${file})`; }
      writeFileSync(join(dir, 'fonts', file), readFileSync(src));
      return `url(./fonts/${file})`;
    }));
  if (missing) throw new Error(`站内字体有 ${missing} 个分片缺失（先跑 node tools/fetch-fonts.mjs）`);
  return out.join('\n');
}

async function fetchSerifSubset(chars, dir) {
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(join(dir, 'fonts'), { recursive: true });
  const faces = [];
  for (const weight of [400, 500]) {
    const key = `serif-${weight}-${Buffer.from(chars).toString('base64url').slice(0, 24)}.woff2`;
    const cached = join(CACHE, key);
    const dest = join(dir, 'fonts', key);
    if (!existsSync(cached)) {
      const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@${weight}&text=${encodeURIComponent(chars)}`;
      let css;
      try {
        const res = await fetch(cssUrl, { headers: { 'User-Agent': GOOGLE_UA } });
        if (!res.ok) throw new Error(`${res.status}`);
        css = await res.text();
      } catch (e) {
        throw new Error(
          `取显示字子集失败（${e.message}）。本工具需要联网抓一次 Noto Serif SC 子集；\n` +
          `  站点自身不依赖它，故它不进 public/fonts。请联网后重跑。`,
        );
      }
      const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(css)?.[1];
      if (!url) throw new Error(`Google CSS 未返回字体地址（weight ${weight}）；接口格式可能变了`);
      const faceCount = (css.match(/@font-face/g) || []).length;
      if (faceCount !== 1) {
        throw new Error(`显示字子集未生效（weight ${weight}）：返回了 ${faceCount} 个 @font-face（期望 1 个）`);
      }
      writeFileSync(cached, Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
    writeFileSync(dest, readFileSync(cached));
    faces.push(
      `@font-face { font-family: 'Noto Serif SC'; font-style: normal; font-weight: ${weight}; ` +
      `font-display: block; src: url(./fonts/${key}) format('woff2'); }`,
    );
  }
  return faces.join('\n');
}


const CONTOUR_JS = `(() => {
  const c = document.querySelector('.contour'); if (!c) return;
  const dpr = 1, w = c.width = ${W} * dpr, h = c.height = ${H} * dpr;
  const g = c.getContext('2d');
  let s = 20261013;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const olive = getComputedStyle(document.documentElement).getPropertyValue('--ol-400').trim() || '#8A9B6A';
  const wash = g.createRadialGradient(w * 0.86, h * 0.30, 0, w * 0.86, h * 0.30, w * 0.58);
  wash.addColorStop(0, 'rgba(138,155,106,.16)');
  wash.addColorStop(1, 'rgba(138,155,106,0)');
  g.fillStyle = wash; g.fillRect(0, 0, w, h);
  g.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const cx = w * (0.62 + rnd() * 0.42), cy = h * (0.06 + rnd() * 0.72);
    const r = 40 + rnd() * 300;
    g.strokeStyle = i % 5 === 0
      ? 'rgba(138,155,106,.13)'
      : 'rgba(226,232,240,.045)';
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  }
  document.documentElement.style.setProperty('--contour-olive', olive);
})();`;

function cardHtml(tokensCss, siteFonts, serifFonts) {
  const rows = LEDGER.map(([nb, name, note]) => `      <div class="ledger-row">
        <span class="ledger-nb">${nb}</span>
        <span class="ledger-title">${name}</span>
        <span class="ledger-note">${note}</span>
      </div>`).join('\n');

  return `<!doctype html>
<html lang="zh-CN" data-theme="midnight-ink">
<head>
<meta charset="utf-8">
<!-- 版式：Editorial Magazine × E-ink / M01 宽幅（标题左安全区 + 右半系统视觉 + 底部 issue strip） -->
<title>og-card</title>
<style>${tokensCss}</style>
<style>${siteFonts}
${serifFonts}</style>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  .poster {
    position: relative; width: ${W}px; height: ${H}px; overflow: hidden;
    background: var(--bg); color: var(--text); font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  /* ── 氛围层（3 层：底 + 墨洗 + 等高质量弧 + 纸granular）── */
  .paper-wash {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(58% 74% at 14% 10%, color-mix(in srgb, var(--text-bright) 5%, transparent), transparent 62%),
      radial-gradient(64% 88% at 92% 92%, color-mix(in srgb, var(--primary) 16%, transparent), transparent 70%),
      linear-gradient(180deg, color-mix(in srgb, var(--text-bright) 2%, transparent), transparent 42%);
  }
  .contour { position: absolute; inset: 0; z-index: 1; width: ${W}px; height: ${H}px; opacity: .9; }
  .grain {
    position: absolute; inset: 0; z-index: 2; pointer-events: none;
    opacity: .3; mix-blend-mode: screen;
    background-image: radial-gradient(rgba(255,244,214,.055) 1px, transparent 1px);
    background-size: 3px 3px;
  }
  /* ── 内容层：flex column + 页脚 margin-top:auto（禁令：不得用 absolute 压页脚）── */
  .content { position: relative; z-index: 3; display: flex; flex-direction: column; height: 100%; padding: 64px 88px 56px; }
  .main { display: grid; grid-template-columns: 1.6fr 1fr; gap: 56px; align-items: stretch; }
  /* 左栏 = 上下锚定（标题组贴顶、论点组贴底），底边与右栏 ledger 同基线。
     这是杂志封面的真实构图手法，**不是**用空 div 把内容挤到中间（技能明令禁止那种做法）。 */
  .col-left { min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }

  .kicker {
    font-family: var(--font-hud); font-size: 20px; font-weight: 500;
    letter-spacing: .22em; text-transform: uppercase;
    color: var(--ol-400);
  }
  /* 显示字：serif-zh 500 + 宽字距（Editorial：「越大越轻」）。
     nowrap 是硬要求——「星铁档案馆」折成「星铁档案 / 馆」是排版事故，靠缩小字号而不是放任折行。 */
  .h-display {
    margin-top: 20px; white-space: nowrap;
    font-family: 'Noto Serif SC', var(--font-body);
    font-size: 110px; font-weight: 500; letter-spacing: .04em; line-height: 1.06;
    color: var(--text-bright);
  }
  /* margin-top 26px：技能 R9 要求显示字与下一块留 ≥24px（16px 会被校验器判 warn） */
  .h-sub {
    margin-top: 26px;
    font-family: 'Noto Serif SC', var(--font-body);
    font-size: 32px; font-weight: 400; letter-spacing: .02em;
    color: color-mix(in srgb, var(--text) 80%, transparent);
  }
  .rule-accent { height: 2px; width: 88px; background: var(--primary); margin: 30px 0 0; border: 0; }
  .lead {
    margin-top: 22px; max-width: 25em;
    font-family: 'Noto Serif SC', var(--font-body);
    font-size: 30px; font-weight: 400; line-height: 1.55;
    color: var(--text2);
  }

  /* ── ledger：真行结构（编号 mono / 名称 serif / 口径 note），行间发丝线 ── */
  .index-label {
    font-family: var(--font-hud); font-size: 20px; font-weight: 500;
    letter-spacing: .2em; color: var(--text3);
  }
  .ledger { margin-top: 16px; border-top: 1px solid var(--line-2); }
  .ledger-row {
    display: grid; grid-template-columns: 32px 1fr; grid-template-rows: auto auto;
    column-gap: 12px; padding: 7px 0; border-bottom: 1px solid color-mix(in srgb, var(--line-2) 55%, transparent);
  }
  .ledger-nb { grid-row: 1 / 3; font-family: var(--font-hud); font-size: 18px; font-weight: 600; letter-spacing: .06em; color: var(--ol-400); padding-top: 3px; }
  /* 末行不画线：ledger 的收口线交给 issue strip 的那条发丝线，避免两条线贴在一起成双线 */
  .ledger-row:last-child { border-bottom: 0; }
  .ledger-title { font-family: 'Noto Serif SC', var(--font-body); font-size: 23px; font-weight: 500; letter-spacing: .02em; line-height: 1.15; color: var(--text-bright); }
  .ledger-note { font-family: var(--font-body); font-size: 20px; font-weight: 400; color: var(--text3); margin-top: 2px; line-height: 1.25; }

  /* ── issue strip：贴底（margin-top:auto），上方发丝线 ── */
  .issue-strip {
    margin-top: auto; padding-top: 18px; border-top: 1px solid var(--line-2);
    display: flex; gap: 14px; align-items: center;
    font-family: var(--font-hud); font-size: 20px; font-weight: 500; letter-spacing: .18em;
    color: var(--text3);
  }
  .issue-strip span { white-space: nowrap; }
  .issue-strip .dot { width: 4px; height: 4px; background: var(--primary); flex: none; }
</style>
</head>
<body>
<section class="poster magazine wide">
  <div class="paper-wash"></div>
  <canvas class="contour" width="${W}" height="${H}"></canvas>
  <div class="grain"></div>
  <div class="content">
    <div class="main">
      <div class="col-left">
        <div class="title-group">
          <p class="kicker">${KICKER}</p>
          <h1 class="h-display">${BRAND}</h1>
          <p class="h-sub">${GAME}</p>
        </div>
        <div class="thesis-group">
          <hr class="rule-accent">
          <p class="lead">${LEAD}</p>
        </div>
      </div>
      <div class="col-right">
        <p class="index-label">${INDEX_TITLE}</p>
        <div class="ledger">
${rows}
        </div>
      </div>
    </div>
    <div class="issue-strip">
      ${STRIP.map((s) => `<span>${s}</span>`).join('<i class="dot"></i>')}
    </div>
  </div>
</body>
<script>${CONTOUR_JS}</script>
</html>
`;
}


const tokensCss = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const siteFontsCss = readFileSync(join(ROOT, 'src', 'styles', 'fonts.css'), 'utf8');

rmSync(TASK, { recursive: true, force: true });
mkdirSync(TASK, { recursive: true });
writeFileSync(join(TASK, 'tokens.css'), tokensCss);
const siteFaces = inlineSiteFonts(siteFontsCss, ['IBM Plex Mono'], TASK);
const serifFaces = await fetchSerifSubset(cardChars(), TASK);

const html = cardHtml(tokensCss, siteFaces, serifFaces);
writeFileSync(join(TASK, 'index.html'), html);

const MIME = { '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8' };
const server = createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  const file = url === '/' ? join(TASK, 'index.html') : join(TASK, decodeURIComponent(url));
  if (!file.startsWith(TASK)) { res.writeHead(403); return res.end(); }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))].join(', '));
  if (!/Noto Serif SC/.test(loaded)) {
    throw new Error(`显示字未就位（已加载：${loaded || '无'}）——拒绝导出回退字体的图`);
  }
  const m = await page.evaluate(([w, h]) => {
    const q = (s) => document.querySelector(s);
    const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }; };
    return {
      scrollH: q('.poster').scrollHeight,
      clientH: q('.poster').clientHeight,
      display: box('.h-display'), colLeft: box('.col-left'), lead: box('.lead'),
      ledger: box('.ledger'), strip: box('.issue-strip'),
      displayLines: q('.h-display').getClientRects().length,
      overflowX: document.documentElement.scrollWidth - w,
      bottomPad: h - 56,
    };
  }, [W, H]);
  const problems = [];
  if (m.scrollH > m.clientH) problems.push(`纵向溢出 ${m.scrollH - m.clientH}px`);
  if (m.overflowX > 0) problems.push(`横向溢出 ${m.overflowX}px`);
  if (m.displayLines !== 1) problems.push(`显示字折成 ${m.displayLines} 行（缩短文案或缩字号，禁止放任折行）`);
  if (m.display && m.colLeft && m.display.r > m.colLeft.r) problems.push(`显示字越出左栏 ${m.display.r - m.colLeft.r}px`);
  for (const [k, b] of Object.entries({ display: m.display, lead: m.lead, ledger: m.ledger, strip: m.strip })) {
    if (b && (b.b > H - 8 || b.l < 0 || b.r > W)) problems.push(`${k} 越界 ${JSON.stringify(b)}`);
  }
  if (m.strip && m.strip.b > m.bottomPad + 2) problems.push(`issue strip 越出下内边距 ${m.strip.b - m.bottomPad}px`);
  if (m.strip && m.ledger && m.strip.t - m.ledger.b < 8) problems.push(`ledger 与 issue strip 之间只有 ${m.strip.t - m.ledger.b}px`);
  if (problems.length) throw new Error(`版式自检失败：\n  - ${problems.join('\n  - ')}`);

  await page.screenshot({ path: OUT });
  console.log(`[OK] ${OUT}（${W}×${H}；字体：${loaded}）`);
  console.log(`     显示字块 ${m.display.t}–${m.display.b}px｜ledger 底 ${m.ledger.b}px｜strip 顶 ${m.strip.t}px｜内容高 ${m.strip.b - 64}px`);
  console.log(`[OK] 任务目录 ${TASK}（可用技能自带校验器量一遍：node validate-social-deck.mjs ${TASK} --style=editorial）`);
} finally {
  await browser.close();
  server.close();
}
