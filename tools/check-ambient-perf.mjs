#!/usr/bin/env node
/**
 * 环境层性能守卫（A3.3 可重复取证）：node tools/check-ambient-perf.mjs
 *
 * 为什么单独成守卫：A3.3 的判据是「滚动长任务单次 ≤50ms、掉帧 <1%」，而环境层是**唯一常驻全站、
 * 且用 `background-attachment: fixed` 的合成层**——它一旦变贵，会让每一页都掉帧，且不会有任何报错。
 * 手工探针只在当次会话有效，故固化成可重复命令（阈值与判据来源见 docs/audit/UI质量验收标准.md A3.3）。
 *
 * 判据（全部可断言）：
 *   1. 长任务：最差单次 ≤ 50ms（目标线）
 *   2. 掉帧率：< 1%（目标线）
 *   3. **环境层贡献**：把 `--nk-ambient-image`（光晕 / 地平线 / 暗角）整层摘掉重跑同一路径，
 *      中位帧时长差 ≤ 0.5ms、掉帧率差 ≤ 0.5%
 *      —— 这一条是本守卫的核心：它把「环境层没拖慢滚动」变成可重复断言，
 *         而不是靠「看起来不卡」。
 *
 * 掉帧判据说明：阈值取 `中位帧时长 × 1.5`（≈漏一次 vsync）。**不能拿 16.7 当阈值**——
 * 中位恰好落在 16.7 时会把一半正常帧判成掉帧（本守卫开发时实测踩过，报出过 52% 的假掉帧率）。
 *
 * 用法：先确保有可访问的实例（默认 http://localhost:6188/，`pnpm dev` 或 `pnpm preview`），
 *   node tools/check-ambient-perf.mjs [--url=http://localhost:6188] [--json]
 * 退出码：0 全绿 / 1 有超线项 / 2 环境不可用（未能连上实例或无 Chromium）
 */
import { spawnSync } from 'node:child_process';

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const BASE = arg('url', 'http://localhost:6188');
const AS_JSON = process.argv.includes('--json');

/* 阈值：A3.3 目标线（docs/audit/UI质量验收标准.md） */
const MAX_LONG_TASK_MS = 50;
const MAX_DROP_RATE_PCT = 1;
const MAX_MEDIAN_DELTA_MS = 0.5;
const MAX_DROP_RATE_DELTA_PCT = 0.5;

/* ── 用 playwright（项目已有的 e2e 依赖，不新增任何依赖）驱动 ──
   注意：本仓只装了 `@playwright/test`（它 re-export `chromium`），**没有**裸 `playwright` 包；
   `require('playwright')` 会 MODULE_NOT_FOUND。 */
const PROBE = `
const { chromium } = require('@playwright/test');
const BASE = ${JSON.stringify(BASE)};

const measure = async (page) => page.evaluate(async () => {
  const longs = [];
  const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) longs.push(Math.round(e.duration)); });
  try { po.observe({ entryTypes: ['longtask'] }); } catch (e) {}
  const junk = document.createElement('div');
  junk.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:8000px;pointer-events:none;opacity:0';
  document.body.appendChild(junk);
  const frames = [];
  let last = performance.now();
  const t0 = last;
  await new Promise((res) => {
    const step = () => {
      const now = performance.now();
      frames.push(now - last); last = now;
      window.scrollTo(0, (window.scrollY + 70) % 4000);
      if (now - t0 < 4000) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  po.disconnect(); junk.remove(); window.scrollTo(0, 0);
  const f = frames.slice(6).sort((a, b) => a - b);
  const med = f[Math.floor(f.length / 2)];
  const thr = med * 1.5;
  return {
    frames: f.length,
    medianMs: +med.toFixed(2),
    worstMs: +f[f.length - 1].toFixed(2),
    dropThresholdMs: +thr.toFixed(2),
    droppedFrames: f.filter((d) => d > thr).length,
    dropRatePct: +((f.filter((d) => d > thr).length / f.length) * 100).toFixed(2),
    longTasks: longs.length,
    worstLongTaskMs: longs.length ? Math.max(...longs) : 0,
  };
});

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const out = {};
  // 目录页：卡片墙 + 虚拟滚动，是滚动最贵的代表页
  await page.goto(BASE + '/character', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  out.withAmbient = await measure(page);

  // 对照：把环境层整层摘掉（只留 --bg 纯色），量同一滚动路径
  await page.addStyleTag({ content: '#app{background-image:none !important}' });
  await page.waitForTimeout(500);
  out.noAmbient = await measure(page);

  out.delta = {
    medianMs: +(out.withAmbient.medianMs - out.noAmbient.medianMs).toFixed(2),
    worstMs: +(out.withAmbient.worstMs - out.noAmbient.worstMs).toFixed(2),
    dropRatePct: +(out.withAmbient.dropRatePct - out.noAmbient.dropRatePct).toFixed(2),
  };
  await browser.close();
  process.stdout.write(JSON.stringify(out));
})().catch((e) => { console.error('PROBE_ERROR: ' + e.message); process.exit(3); });
`;

const r = spawnSync(process.execPath, ['-e', PROBE], { encoding: 'utf8', cwd: process.cwd() });
/** 取 stderr 里最有信息量的一行（最后一行常是 Node 版本号，故往上找 Error/Cannot/ERR 开头的行） */
const errLine = (s) => {
  const lines = (s || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const hit = [...lines].reverse().find((l) => /Error|Cannot|ERR_|not found|MODULE_NOT/i.test(l));
  return hit || lines[lines.length - 1] || '(无输出)';
};
if (r.status === 3 || !r.stdout) {
  console.error('[SKIP] 环境层性能守卫未能运行（实例不可用或未装 Chromium）');
  console.error(`       原因：${errLine(r.stderr)}`);
  console.error('       这不是失败——守卫依赖运行实例；起实例后重跑：pnpm dev');
  process.exit(2);
}
if (r.status !== 0) {
  console.error(`[FAIL] 探针异常退出（${r.status}）：${errLine(r.stderr)}`);
  process.exit(1);
}

let data;
try { data = JSON.parse(r.stdout); } catch (e) {
  console.error(`[FAIL] 探针输出无法解析：${r.stdout.slice(0, 200)}`);
  process.exit(1);
}

const { withAmbient: w, noAmbient: n, delta: d } = data;
const problems = [];

if (w.worstLongTaskMs > MAX_LONG_TASK_MS) {
  problems.push(`最差长任务 ${w.worstLongTaskMs}ms 超目标线 ${MAX_LONG_TASK_MS}ms`);
}
if (w.dropRatePct > MAX_DROP_RATE_PCT) {
  problems.push(`滚动掉帧率 ${w.dropRatePct}% 超目标线 ${MAX_DROP_RATE_PCT}%（阈值 ${w.dropThresholdMs}ms，样本 ${w.frames} 帧）`);
}
if (d.medianMs > MAX_MEDIAN_DELTA_MS) {
  problems.push(`摘掉环境层后中位帧时长差 ${d.medianMs}ms 超 ${MAX_MEDIAN_DELTA_MS}ms ⇒ 环境层在拖慢滚动`);
}
if (d.dropRatePct > MAX_DROP_RATE_DELTA_PCT) {
  problems.push(`摘掉环境层后掉帧率差 ${d.dropRatePct}% 超 ${MAX_DROP_RATE_DELTA_PCT}% ⇒ 环境层在造成掉帧`);
}

if (AS_JSON) console.log(JSON.stringify(data, null, 1));
else {
  console.log(`  环境层开：中位 ${w.medianMs}ms / 最差 ${w.worstMs}ms / 掉帧 ${w.droppedFrames}（${w.dropRatePct}%）/ 长任务 ${w.longTasks}（最差 ${w.worstLongTaskMs}ms）`);
  console.log(`  环境层关：中位 ${n.medianMs}ms / 最差 ${n.worstMs}ms / 掉帧 ${n.droppedFrames}（${n.dropRatePct}%）/ 长任务 ${n.longTasks}（最差 ${n.worstLongTaskMs}ms）`);
  console.log(`  环境层贡献：中位 ${d.medianMs >= 0 ? '+' : ''}${d.medianMs}ms / 最差 ${d.worstMs >= 0 ? '+' : ''}${d.worstMs}ms / 掉帧率 ${d.dropRatePct >= 0 ? '+' : ''}${d.dropRatePct}%`);
}

if (problems.length) {
  console.error(`\n[FAIL] 环境层性能守卫：${problems.length} 项超线`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('[PASS] 环境层性能守卫：无长任务、掉帧 <1%、环境层对滚动的贡献为 0 量级');
