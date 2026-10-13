#!/usr/bin/env node
/**
 * 自托管字体抓取器（手动执行，**不进 `pnpm build`**——构建必须离线可跑）。
 * 用法：node tools/fetch-fonts.mjs [--force]
 *
 * 为什么自托管：`index.html` 原先直接 `<link rel="stylesheet">` 引 fonts.googleapis.com，
 * 那是一条**渲染阻塞**的跨域样式表，且该域在中国大陆不可达 —— 浏览器要等连接超时才继续渲染，
 * FCP/LCP 直接塌掉，而本站主受众正在大陆（这也是 origin 迁到自有域名的原因）。
 * 自托管后字体 CSS 与宿主同源、随主样式一起走 `/assets/*`（内容哈希 + immutable），
 * woff2 落在 `public/fonts/`（`/fonts/*`，vercel.json 单独给长缓存）。
 *
 * 产物：
 *   1. `public/fonts/<hash>[.N].woff2` —— Google 的 unicode-range 分片**原样保留**（每片 10~70 KB，
 *      浏览器只下载当前页面真正用到的片；合并成一个大文件会让 CJK 首屏多下几 MB）；
 *   2. `src/styles/fonts.css` —— 把 424 条 `@font-face` 的 `src` 改写成 `/fonts/…` 的本地副本。
 *
 * 语言族与字重必须与 `src/styles/tokens.css` 的 `--font-body` / `--font-hud` 一致：
 * 改了那边就必须同步这里的 FAMILIES 并重跑本工具（否则新字重静默回退系统字体）。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FONT_DIR = join(ROOT, 'public', 'fonts');
const CSS_FILE = join(ROOT, 'src', 'styles', 'fonts.css');
const FORCE = process.argv.includes('--force');

/** 与 tokens.css 的 `--font-body` / `--font-hud` / `--font-mono` 对应；改字体栈必须同步本表。 */
const FAMILIES = [
  'Noto+Sans+SC:wght@400;500;700;900',
  'IBM+Plex+Mono:wght@400;500;600;700',
];

/** 必须是现代 Chrome UA：Google 只对支持 woff2 的 UA 返回 woff2（否则给 ttf，体积翻数倍）。 */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const CSS_URL =
  `https://fonts.googleapis.com/css2?${FAMILIES.map((f) => `family=${f}`).join('&')}&display=swap`;

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const css = await (await get(CSS_URL)).text();
const remote = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
if (!remote.length) throw new Error('未从 Google CSS 解析到任何 gstatic 字体地址（接口格式变化？）');

mkdirSync(FONT_DIR, { recursive: true });
let downloaded = 0;
let bytes = 0;
for (const url of remote) {
  const name = url.split('/').pop();
  const dest = join(FONT_DIR, name);
  // 文件名带内容哈希：已存在即视为同一内容，不重下（--force 用于校验/修复）
  if (!existsSync(dest) || FORCE) {
    const buf = Buffer.from(await (await get(url)).arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
  }
  bytes += statSync(dest).size;
}

/** 只保留**文件名**（Google 的文件名自带内容哈希），上游的 `/<family>/<version>/` 路径段一律丢掉：
    文件平铺在 public/fonts/，保留路径段会指向不存在的目录（拼错时浏览器静默回退系统字体，
    不会有任何报错——所以这里必须用 basename 而不是「替换主机名」。） */
const local = css.replace(/https:\/\/fonts\.gstatic\.com\/\S*?\/([^/)]+\.woff2)/g, (_m, file) => `/fonts/${file}`);

const header = `/*
 * 自托管字体声明（**生成物**，勿手改；重跑 node tools/fetch-fonts.mjs 覆盖）。
 * 上游：${CSS_URL}
 * 为什么不用 Google CDN：那是渲染阻塞的跨域样式表，且 fonts.googleapis.com 在中国大陆不可达。
 * 为什么保留 unicode-range 分片：CJK 每片 10~70 KB，浏览器只取当前页面用到的分片。
 * 入口：src/app/bootstrap.ts（与 tokens.css / catalog.css 同批进入口 CSS chunk，随 /assets/* 走内容哈希缓存）。
 */
`;

writeFileSync(CSS_FILE, header + local);

/* 反向自检：CSS 里出现的每个本地字体地址都必须有对应文件。漏一个就是**静默**回退系统字体
   （浏览器不会报错），故必须在这里判死，而不是等用户发现排版变了。 */
const referenced = [...new Set([...local.matchAll(/url\((\/fonts\/[^)]+)\)/g)].map((m) => m[1]))];
const missing = referenced.filter((u) => !existsSync(join(FONT_DIR, u.slice('/fonts/'.length))));
if (missing.length) {
  console.error(`[FAIL] 有 ${missing.length} 个本地字体地址没有对应文件，例如：${missing.slice(0, 3).join(', ')}`);
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`[OK] fonts: ${remote.length} 个 woff2（本次新下载 ${downloaded}），合计 ${kb(bytes)} → public/fonts/`);
console.log(`[OK] ${CSS_FILE}（${kb(Buffer.byteLength(header + local))}；自检 ${referenced.length} 个本地引用全部命中）`);
