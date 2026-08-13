#!/usr/bin/env node
/**
 * 自愈 rolldown-vite 8 的「transform 缓存永久陈旧」（Windows 实测规律，2026-08-13）
 *
 * 用法：node tools/refresh-vite-cache.mjs <文件或目录...>
 * 例：  node tools/refresh-vite-cache.mjs src/styles/character.css src/app/views
 *
 * 背景坑位（详见 docs/memory/2026-08-13.md）：Vite 8.1.5（rolldown 内核）在 Windows 下，
 * 「文件被整写（O_TRUNC 重写，如工具保存/脚本改写）之后的紧邻变更事件」会被软失效吸收——
 * 事件到达 vite（page reload 日志可见）但 rolldown rust 缓存未刷新，transform 重跑仍输出旧内容，
 * 且无 mtime 兜底——文件永久陈旧（改 CSS/TS 后 dev 页面不更新，重启才恢复）。
 * JS 侧 invalidateAll / watcher.emit / utimes 均无法打通 rust 缓存（已逐一实测），仅真实内容写入有效。
 *
 * 自愈原理：对目标文件「读回 → 写回」两次（间隔 400ms），第二次写回必被 watcher 捕获为
 * 真实写入 → rust 缓存失效 → 重新 transform 读到磁盘最新内容（内容本身未变，纯事件触发）。
 * 注意：勿将此原理自动化为 dev 插件定时改写源文件——多进程并发写入会破坏源文件（已实测事故，
 * 见 docs/memory/2026-08-13.md），只能手动按需使用。
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