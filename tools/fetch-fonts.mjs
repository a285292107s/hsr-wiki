#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FONT_DIR = join(ROOT, 'public', 'fonts');
const CSS_FILE = join(ROOT, 'src', 'styles', 'fonts.css');
const FORCE = process.argv.includes('--force');

const FAMILIES = [
  'Noto+Sans+SC:wght@400;500;700;900',
  'IBM+Plex+Mono:wght@400;500;600;700',
];

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
  if (!existsSync(dest) || FORCE) {
    const buf = Buffer.from(await (await get(url)).arrayBuffer());
    writeFileSync(dest, buf);
    downloaded++;
  }
  bytes += statSync(dest).size;
}

const local = css
  .replace(/https:\/\/fonts\.gstatic\.com\/\S*?\/([^/)]+\.woff2)/g, (_m, file) => `/fonts/${file}`)
  .split('\n')
  .filter((line) => !/^\s*\/\*[\s\S]*?\*\/\s*$/.test(line))
  .join('\n')
  .replace(/\n{2,}/g, '\n\n')
  .trimEnd();

writeFileSync(CSS_FILE, `${local}\n`);

const referenced = [...new Set([...local.matchAll(/url\((\/fonts\/[^)]+)\)/g)].map((m) => m[1]))];
const missing = referenced.filter((u) => !existsSync(join(FONT_DIR, u.slice('/fonts/'.length))));
if (missing.length) {
  console.error(`[FAIL] 有 ${missing.length} 个本地字体地址没有对应文件，例如：${missing.slice(0, 3).join(', ')}`);
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`[OK] fonts: ${remote.length} 个 woff2（本次新下载 ${downloaded}），合计 ${kb(bytes)} → public/fonts/`);
console.log(`[OK] ${CSS_FILE}（${kb(Buffer.byteLength(header + local))}；自检 ${referenced.length} 个本地引用全部命中）`);
