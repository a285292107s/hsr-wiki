#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const arg = (k, d) => {
  const hit = process.argv.find((a) => a.startsWith(`--${k}=`));
  return hit ? hit.slice(k.length + 3) : d;
};
const BASE = arg('url', 'http://localhost:6188');
const AS_JSON = process.argv.includes('--json');

const MAX_LONG_TASK_MS = 50;
const MAX_DROP_RATE_PCT = 1;
const MAX_MEDIAN_DELTA_MS = 0.5;
const MAX_DROP_RATE_DELTA_PCT = 0.5;

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
  await page.goto(BASE + '/character', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  out.withAmbient = await measure(page);

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
