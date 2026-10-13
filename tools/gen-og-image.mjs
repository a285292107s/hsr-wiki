#!/usr/bin/env node
/**
 * 社交分享图（Open Graph 1200×630）生成器（手动执行，**不进 `pnpm build`**）。
 * 用法：node tools/gen-og-image.mjs
 * 产物：public/og.png（提交入库；`pnpm build` 只复制它，不生成它）。
 *
 * 版式依据 `guizang-social-card-skill`（外部参考，非本仓代码）：
 *   - 模式 = **Editorial Magazine × E-ink**，主题 = Midnight Ink 的**结构**（暗底 + 氛围层 + serif 显示字 + ledger）；
 *     色值不取该技能的调色板，而取本站 token（用户有强品牌约束，见 style-system.md 的例外条款）。
 *   - recipe = **M01 Magazine Issue Cover 的 21:9 宽幅适配**（WeChat Adaptation 段：标题占左安全区，
 *     右半给「系统视觉」）。本站没有照片可作证据层，故右半用**真 ledger**（图鉴索引 + 字段口径），
 *     而不是编造图形——技能禁止装饰性形状与假数据。
 *   - 硬规则落实：单一模式/单一强调色、无 emoji、无圆角/阴影、页脚用 `margin-top: auto`
 *     而**不是** absolute（Anti-pattern C）、正文不小于移动端可读下限、标题与下方内容留 ≥28px。
 *
 * 一致性：色值/字体全部来自 `src/styles/tokens.css` 与 `src/styles/fonts.css`——
 * 本工具把它们（连同所需的 woff2 分片）复制进 `temp/og-card/` 并起本地静态服务喂给浏览器，
 * **本文件不写任何颜色字面量**；主题改色后需重跑，否则分享图静默过期。
 *
 * 联网：显示字（Noto Serif SC）站点未使用，故**不**进 public/fonts，而是在生成期按 `text=` 抓
 * 恰好覆盖本卡字符的极小子集（几 KB），缓存在 `node_modules/.cache/og-card/`。断网会**显式失败**，
 * 不会静默回退成系统字体——那张图看起来「也能用」，但已经不是设计的样子了。
 */

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
/* 从 `@playwright/test` 取 chromium：`playwright` 只是它的传递依赖，pnpm 的严格 node_modules
   下不能从仓库根解析（直接 import 'playwright' 会 ERR_MODULE_NOT_FOUND）。 */
import { chromium } from '@playwright/test';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public', 'og.png');
/** 中间产物（可整目录清空）：HTML + 复制来的 token/字体。技能要求生成物不落在源目录里。 */
const TASK = join(ROOT, 'temp', 'og-card');
const CACHE = join(ROOT, 'node_modules', '.cache', 'og-card');

const W = 1200;
const H = 630;

/* ═══════════ 卡面文案（全部为站点事实；数字一律不写死——会随版本过期） ═══════════ */

const KICKER = 'HONKAI: STAR RAIL DATABASE';
const BRAND = '星铁档案馆';
const GAME = '崩坏：星穹铁道 Wiki';
const LEAD = '角色、光锥、遗器、敌对物种与终局赛季，全部整理成可检索的档案。';
const INDEX_TITLE = '图鉴索引';
/** ledger：真结构（编号 + 名称 + 字段口径），不是装饰 */
const LEDGER = [
  ['01', '角色', '稀有度 · 命途 · 属性 · 技能'],
  ['02', '光锥', '叠影 · 晋阶 · 适配角色'],
  ['03', '遗器', '套装效果 · 部位'],
  ['04', '敌对物种', '弱点 · 抗性 · 掉落 · 出没'],
  ['05', '终局玩法', '四模式 · 赛季与增益档案'],
  ['06', '货币战争', '角色 · 装备 · 羁绊 · 投资策略'],
];
/** 底部 issue strip（技能：一个海报只允许一个 issue 元素） */
const STRIP = ['13 语言', '数据随版本同步', 'myhsr.wiki'];

/* ═══════════ 字体：站内自托管分片 + 显示字按需子集 ═══════════ */

const GOOGLE_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** 本卡用到的全部字符（含标点）：显示字子集只取这些，字体因此只有几 KB。 */
function cardChars() {
  const parts = [KICKER, BRAND, GAME, LEAD, INDEX_TITLE, ...LEDGER.flat(), ...STRIP];
  return [...new Set(parts.join('').split(''))].sort().join('');
}

/**
 * 站点自托管的 `src/styles/fonts.css`：抽出指定家族的 @font-face 块，把 `/fonts/x.woff2`
 * 改写成 `./fonts/x.woff2` 并把这些分片复制到任务目录。
 */
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

/** 显示字（站点不用 serif）：按 `text=` 抓只含本卡字符的子集，缓存复用。 */
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
      /* `text=` 子集的地址形如 `https://fonts.gstatic.com/l/font?kit=<hash>&v=<ver>`——
         **没有 `.woff2` 后缀**（整族 CSS 才是 `/s/<family>/vN/<hash>.woff2`），故不能按后缀匹配。 */
      const url = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(css)?.[1];
      if (!url) throw new Error(`Google CSS 未返回字体地址（weight ${weight}）；接口格式可能变了`);
      /* 子集判据：整族 CSS 有上百个 @font-face，`text=` 子集只会有一个。
         若 text 参数没生效（旧接口/参数被忽略），这里必须判死——否则抓到的是整族分片。 */
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

/* ═══════════ 卡面（Editorial × Midnight Ink 结构 + M01 宽幅） ═══════════ */

/**
 * 冻结的程序化氛围层（background-systems.md 的「2D fallback」：墨洗 + 等高弧线）。
 * 用固定种子 ⇒ 重复渲染字节稳定（技能要求静态图不使用动态 WebGL）。
 * 弧线只压在右半与顶部，避免「强背景痕迹落在正文之后」。
 */
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

/* ═══════════ 渲染 ═══════════ */

const tokensCss = readFileSync(join(ROOT, 'src', 'styles', 'tokens.css'), 'utf8');
const siteFontsCss = readFileSync(join(ROOT, 'src', 'styles', 'fonts.css'), 'utf8');

rmSync(TASK, { recursive: true, force: true });
mkdirSync(TASK, { recursive: true });
/* tokens.css 原样复制（不重写、不摘抄）：色值只有一个事实源，改了主题这里自动跟上。 */
writeFileSync(join(TASK, 'tokens.css'), tokensCss);
const siteFaces = inlineSiteFonts(siteFontsCss, ['IBM Plex Mono'], TASK);
const serifFaces = await fetchSerifSubset(cardChars(), TASK);

/* 卡面 HTML 落进任务目录：`file://` 下可直接打开，也能直接喂给技能自带的
   `validate-social-deck.mjs`（它读 index.html 并逐个量 `.poster`）。 */
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
  /* 必须等字体真正就位再截图：否则截到系统回退字体（中文明显变样）且不报错 */
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family))].join(', '));
  if (!/Noto Serif SC/.test(loaded)) {
    throw new Error(`显示字未就位（已加载：${loaded || '无'}）——拒绝导出回退字体的图`);
  }
  /* 量一下有没有溢出：宁可这里判死，也不要出一张内容被裁掉的图 */
  const m = await page.evaluate(([w, h]) => {
    const q = (s) => document.querySelector(s);
    const box = (s) => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right) }; };
    return {
      scrollH: q('.poster').scrollHeight,
      clientH: q('.poster').clientHeight,
      display: box('.h-display'), colLeft: box('.col-left'), lead: box('.lead'),
      ledger: box('.ledger'), strip: box('.issue-strip'),
      /* 折行判据：一行文本的 client rects 恰好 1 个。CJK 显示字折行不会被任何溢出断言抓到 */
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
  /* 页脚必须落在下内边距之内（技能：页脚不得被上方内容挤出安全区） */
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
