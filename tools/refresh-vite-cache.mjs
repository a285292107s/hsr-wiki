#!/usr/bin/env node
/**
 * 自愈 rolldown-vite 8 的「transform 缓存永久陈旧」（Windows 实测规律，2026-08-13）
 *
 * 用法：node tools/refresh-vite-cache.mjs <文件或目录...>
 * 例：  node tools/refresh-vite-cache.mjs src/styles/character.css src/app/views
 *
 * 背景坑位（详见 docs/memory/）：Vite 8.1.5（rolldown 内核）在 Windows 下，
 * 「文件被整写（O_TRUNC 重写，如工具保存/脚本改写）之后的紧邻变更事件」会被 watcher
 * 吞掉；而 transform 缓存无 mtime 兜底——事件丢失 = 该文件 transform 结果永久陈旧
 * （改 CSS/TS 后 dev 页面不更新，重启才恢复）。
 *
 * 自愈原理：对被吞文件的后续写入事件会被 watcher 正常捕获。本工具把目标文件
 * 「读回 → 写回」两次（间隔 400ms），第二次写回必触发捕获 → invalidate 模块 →
 * 重新 transform 时读到磁盘最新内容（内容本身未变，纯事件触发）。
 *
 * 注意：仅供「文件已是最新但 dev server 返回旧内容」时使用；运行前先保存全部编辑，
 * 本工具不会改动文件内容（写回 = 原样）。
 */
import fs from 'node:fs';
import path from 'node:path';

/** 收集目录/文件到文件清单（递归目录） */
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
  fs.writeFileSync(f, content); // 第 1 次：可能被吞（等价于被吞场景的写）
  await new Promise((r) => setTimeout(r, WAIT));
  fs.writeFileSync(f, content); // 第 2 次：必被捕获 → invalidate
  console.log(`已刷新: ${f}`);
}
console.log(`\n完成（${targets.length} 个文件，内容未改动）。浏览器刷新页面即可拿到最新模块。`);