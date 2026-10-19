#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function collect(entries, out = []) {
  for (const e of entries) {
    const st = fs.statSync(e);
    if (st.isDirectory()) {
      for (const f of fs.readdirSync(e)) collect([path.join(e, f)], out);
    } else if (st.isFile() && /\.(vue|ts|js|css|mjs|cjs|json)$/.test(e)) {
      out.push(e);
    }
  }
  return out;
}

const targets = collect(process.argv.slice(2));
if (!targets.length) {
  console.error('用法: node tools/refresh-vite-cache.mjs <文件或目录...>');
  process.exit(1);
}

const WAIT = 400;
for (const f of targets) {
  const content = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, content);
  await new Promise((r) => setTimeout(r, WAIT));
  fs.writeFileSync(f, content);
  console.log(`已刷新: ${f}`);
}
console.log(`\n完成（${targets.length} 个文件，内容未改动）。浏览器刷新页面即可拿到最新模块。`);