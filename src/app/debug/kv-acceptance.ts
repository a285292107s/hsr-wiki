
export const NEAR_BLACK_WARN = 3;  // ≥3% 提示疑似暗块（夜景底色波动区间）
export const NEAR_BLACK_FAIL = 6;  // ≥6% 判 FAIL（实测：正常合并渲染 ≈1.4%，透明画布黑块 ≈9%）

export interface AcceptSceneSnapshot {
  key: string;
  loadError: string;
  layers: { status: 'loading' | 'ok' | 'fail'; error: string; label: string; loadMs: number }[];
  mergedReady: boolean;
  mergedError: string;
  missingKeys: string[];
  nearBlackPct: number | null;
  aborted: boolean;
  abortReason?: string;
}

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

export function nearBlackClass(pct: number | null): 'is-fail' | 'is-warn' | 'is-ok' | 'is-off' {
  if (pct === null) return 'is-off';
  if (pct >= NEAR_BLACK_FAIL) return 'is-fail';
  if (pct >= NEAR_BLACK_WARN) return 'is-warn';
  return 'is-ok';
}

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
