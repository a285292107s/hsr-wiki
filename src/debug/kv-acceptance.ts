/**
 * KV 场景验收判定引擎（SpineDebugView 验收台专用；纯函数可单测）
 *
 * 职责：验收项类型、判定阈值、PASS/FAIL 判定（reasons 聚合）、报告文本构建。
 * 编排（场景加载 / 轮询 / 中止）与渲染状态留在视图层；像素采样在 debug/pixels.ts。
 */

/* ─── 黑块检测阈值（近黑不透明像素占比 %）─── */
export const NEAR_BLACK_WARN = 3;  // ≥3% 提示疑似暗块（夜景底色波动区间）
export const NEAR_BLACK_FAIL = 6;  // ≥6% 判 FAIL（实测：正常合并渲染 ≈1.4%，透明画布黑块 ≈9%）

/** 验收场景快照（视图层把响应式渲染状态投影为纯数据后交给判定） */
export interface AcceptSceneSnapshot {
  key: string;
  loadError: string;
  layers: { status: 'loading' | 'ok' | 'fail'; error: string; label: string; loadMs: number }[];
  mergedReady: boolean;
  mergedError: string;
  missingKeys: string[];
  nearBlackPct: number | null;
  /** 验收被中止（用户点击中止 / 组件卸载 / 场景被外部切换） */
  aborted: boolean;
  /** 中止原因（aborted=true 时写入报告） */
  abortReason?: string;
}

/** 验收报告单行 */
export interface AcceptItem {
  key: string;
  layerTotal: number;
  layerOk: number;
  failedLayers: string[];
  mergedOk: boolean;
  loadMs: number;
  nearBlackPct: number | null;
  verdict: 'PASS' | 'FAIL';
  reason: string;
  durationMs: number;
  aborted: boolean;
}

/** nearBlack 徽章配色档位：≥FAIL 红 / ≥WARN 黄 / 其余绿 / 无采样灰 */
export function nearBlackClass(pct: number | null): 'is-fail' | 'is-warn' | 'is-ok' | 'is-off' {
  if (pct === null) return 'is-off';
  if (pct >= NEAR_BLACK_FAIL) return 'is-fail';
  if (pct >= NEAR_BLACK_WARN) return 'is-warn';
  return 'is-ok';
}

/** 由场景快照判定验收结果（reasons 聚合 → verdict；任一 reason 存在即 FAIL） */
export function judgeAccept(s: AcceptSceneSnapshot, durationMs: number): AcceptItem {
  const failedLayers = s.layers.filter((l) => l.status === 'fail').map((l) => `${l.label}: ${l.error}`);
  const reasons: string[] = [];
  if (s.aborted) reasons.push(s.abortReason ?? '已中止');
  if (s.layers.length === 0 && s.loadError) reasons.push(s.loadError || '场景条目加载失败');
  if (failedLayers.length > 0) reasons.push(`${failedLayers.length} 层加载失败`);
  if (!s.mergedReady) reasons.push(`合并渲染失败: ${s.mergedError || '超时'}`);
  if (s.missingKeys.length > 0) reasons.push(`缺失 ${s.missingKeys.length} 层资源（已跳过）`);
  if (s.nearBlackPct !== null && s.nearBlackPct >= NEAR_BLACK_FAIL) {
    reasons.push(`疑似黑块：近黑不透明像素 ${s.nearBlackPct.toFixed(2)}% ≥ ${NEAR_BLACK_FAIL}%`);
  }
  return {
    key: s.key,
    layerTotal: s.layers.length,
    layerOk: s.layers.filter((l) => l.status === 'ok').length,
    failedLayers,
    mergedOk: s.mergedReady,
    loadMs: s.layers.reduce((sum, l) => sum + l.loadMs, 0),
    nearBlackPct: s.nearBlackPct,
    verdict: reasons.length > 0 ? 'FAIL' : 'PASS',
    reason: reasons.join('；'),
    durationMs: Math.round(durationMs),
    aborted: s.aborted,
  };
}

/** 验收报告纯文本（复制剪贴板用） */
export function buildAcceptReportText(
  items: AcceptItem[],
  runtimeVersion: string,
  dateLabel = new Date().toLocaleString(),
): string {
  const pass = items.filter((r) => r.verdict === 'PASS').length;
  const lines = [
    `KV 场景验收报告 — ${dateLabel}`,
    `runtime spine-player ${runtimeVersion} | 场景 ${items.length} | PASS ${pass}/${items.length}`,
    ...items.map((r) => [
      `[${r.verdict}] ${r.key}`,
      `层 ${r.layerOk}/${r.layerTotal}`,
      `合并 ${r.mergedOk ? 'OK' : 'FAIL'}`,
      `nearBlack ${r.nearBlackPct === null ? '-' : r.nearBlackPct.toFixed(2) + '%'}`,
      `耗时 ${r.durationMs}ms`,
      r.reason ? `← ${r.reason}` : '',
    ].filter(Boolean).join('  ')),
  ];
  return lines.join('\n');
}
