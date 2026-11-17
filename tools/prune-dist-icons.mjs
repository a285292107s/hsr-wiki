#!/usr/bin/env node
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST_DIR = join(ROOT, 'dist');
const INDEX_FILE = join(DIST_DIR, 'index.html');
const ICONS_DIR = join(DIST_DIR, 'data', 'assets', 'icons');
const EMPTY_PARENTS = [join(DIST_DIR, 'data', 'assets'), join(DIST_DIR, 'data')];

function measure(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = measure(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

if (!existsSync(INDEX_FILE)) {
  console.error('[prune-dist-icons] dist/index.html 缺失，未执行 vite build 时拒绝裁剪');
  process.exit(1);
}

if (!existsSync(ICONS_DIR)) {
  console.log('[prune-dist-icons] dist/data/assets/icons 不存在，跳过');
  process.exit(0);
}

const { files, bytes } = measure(ICONS_DIR);
rmSync(ICONS_DIR, { recursive: true, force: true });

for (const dir of EMPTY_PARENTS) {
  if (existsSync(dir) && readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true });
}

console.log(
  `[prune-dist-icons] 已从构建产物移除 ${files} 个图标文件（${(bytes / 1e6).toFixed(2)} MB）；源文件仍在 public/data/assets/icons，供 jsDelivr 镜像`,
);
