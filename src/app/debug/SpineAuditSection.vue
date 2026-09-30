<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { loadSpineManifests, resolveSpine } from '../../services/api';
import type { SpineResolved } from '../../services/types';
import { toast } from './lib/toast';
import SpineAuditDetail from './SpineAuditDetail.vue';
import { copyText, downloadJson } from './report';
import {
  AuditEntry, AuditKind, buildDiagnosis, classifyStatus,
  createAuditEntry, resetAuditEntry, auditRender, auditStaticResources,
} from './spine-audit';

const KIND_LABEL: Record<AuditKind, string> = {
  skel: 'NANOKA 源',
  official: '官网源',
  'official-scene': '场景',
};
const KIND_ORDER: AuditKind[] = ['official-scene', 'official', 'skel'];

const entries = ref<AuditEntry[]>([]);
const running = ref(false);
const paused = ref(false);
let cancelled = false;
const glAlive = ref(0);
const loadError = ref('');
const filterKind = ref<'all' | AuditKind>('all');
const onlyIssue = ref(false);
const expandedKey = ref<string | null>(null);

const GL_WARN_AT = 14; // 队列 1 实例 + 预览 1 实例，占用上限宽松

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const summary = computed(() => {
  const fail = entries.value.filter((e) => e.status === 'fail').length;
  const warn = entries.value.filter((e) => e.status === 'warn').length;
  const pass = entries.value.filter((e) => e.status === 'pass').length;
  return { fail, warn, pass, done: fail + warn + pass, total: entries.value.length };
});

const filtered = computed(() =>
  entries.value.filter(
    (e) =>
      (filterKind.value === 'all' || e.kind === filterKind.value) &&
      (!onlyIssue.value || e.status === 'fail' || e.status === 'warn'),
  ),
);

const grouped = computed(() => {
  const g: Record<AuditKind, AuditEntry[]> = { skel: [], official: [], 'official-scene': [] };
  for (const e of filtered.value) g[e.kind].push(e);
  return g;
});

function groupState(kind: AuditKind): { fail: number; warn: number; pass: number } {
  const list = grouped.value[kind];
  let fail = 0, warn = 0, pass = 0;
  for (const e of list) {
    if (e.status === 'fail') fail++;
    else if (e.status === 'warn') warn++;
    else if (e.status === 'pass') pass++;
  }
  return { fail, warn, pass };
}

function badgeText(e: AuditEntry): string {
  switch (e.status) {
    case 'fail': return 'FAIL';
    case 'warn': return 'WARN';
    case 'pass': return 'PASS';
    case 'running': return '运行中';
    default: return '—';
  }
}

function shortErrors(e: AuditEntry): string {
  return e.errors
    .map((t) => (t.includes('HTTP ') ? t.slice(0, t.indexOf(':')) : t))
    .join(' | ')
    .slice(0, 120);
}

async function buildEntries(): Promise<AuditEntry[]> {
  const { official, nanoka } = await loadSpineManifests();
  const list: AuditEntry[] = [];
  for (const [key, v] of Object.entries(official?.entries ?? {})) {
    if (v.kind === 'official') {
      list.push(createAuditEntry(key, 'official', Object.keys(v.textures)[0] ?? '—', 'official'));
    } else {
      list.push(createAuditEntry(key, 'official-scene', key, 'official'));
    }
  }
  for (const [key, v] of Object.entries(nanoka?.entries ?? {})) {
    list.push(createAuditEntry(key, 'skel', `[nanoka] ${v.name}`, 'nanoka'));
  }
  return list;
}

async function runQueue(list: AuditEntry[]): Promise<void> {
  running.value = true;
  try {
    for (const e of list) {
      while (paused.value && !cancelled) await sleep(200);
      if (cancelled) break;
      resetAuditEntry(e);
      e.status = 'running';
      let resolved: SpineResolved | null = null;
      try {
        resolved = await resolveSpine(e.key, e.source);
      } catch {
        resolved = null;
      }
      if (!resolved) {
        e.errors.push('manifest 条目不可解析');
        e.status = classifyStatus(e);
        continue;
      }
      await auditStaticResources(e, resolved);
      if (cancelled) break;
      await auditRender(e, {
        resolved,
        sampleAnimations: e.kind === 'official',
        cancelled: () => cancelled,
        onGlChange: (d) => { glAlive.value += d; },
      });
    }
  } finally {
    running.value = false;
  }
}

async function startAudit(): Promise<void> {
  if (running.value) return;
  cancelled = false;
  paused.value = false;
  try {
    entries.value = await buildEntries();
  } catch (e) {
    loadError.value = `manifest 加载失败: ${String(e)}`;
    return;
  }
  await runQueue(entries.value);
}

async function rerunIssues(): Promise<void> {
  if (running.value) return;
  cancelled = false;
  paused.value = false;
  const issues = entries.value.filter((e) => e.status === 'fail' || e.status === 'warn');
  if (issues.length === 0) return;
  await runQueue(issues);
}

function togglePause(): void {
  paused.value = !paused.value;
}

function stopAudit(): void {
  cancelled = true;
  paused.value = false;
}

const detailResolved = ref<SpineResolved | null>(null);
let detailEpoch = 0;

async function toggleDetail(e: AuditEntry): Promise<void> {
  if (expandedKey.value === e.key) {
    closeDetail();
    return;
  }
  closeDetail();
  const epoch = ++detailEpoch;
  let resolved: SpineResolved | null = null;
  try {
    resolved = await resolveSpine(e.key, e.source);
  } catch {
    resolved = null;
  }
  if (epoch !== detailEpoch) return;
  detailResolved.value = resolved;
  expandedKey.value = e.key;
}

function closeDetail(): void {
  detailEpoch++;
  detailResolved.value = null;
  expandedKey.value = null;
}

function onPreviewGlChange(delta: number): void {
  glAlive.value += delta;
}

async function exportReport(): Promise<void> {
  const report = {
    exportedAt: new Date().toISOString(),
    items: entries.value.map((e) => ({
      key: e.key,
      kind: e.kind,
      label: e.label,
      status: e.status,
      loadMs: e.loadMs,
      errors: e.errors,
      warnings: e.warnings,
      resources: e.resources,
      atlasDiffs: e.atlasDiffs,
      meta: e.meta,
      frames: e.frames,
      diagnosis: buildDiagnosis(e),
    })),
  };
  const text = JSON.stringify(report, null, 2);
  if (await copyText(text)) {
    toast('success', '审核报告已复制到剪贴板');
  } else {
    downloadJson(report, `spine-audit-${Date.now()}.json`);
    toast('success', '剪贴板不可用，报告已下载为 JSON');
  }
}

onMounted(async () => {
  try {
    entries.value = await buildEntries();
  } catch {
    loadError.value = 'manifest 加载失败';
  }
});

onBeforeUnmount(() => {
  cancelled = true;
  closeDetail();
});
</script>

<template>
  <div class="nk-spine-audit">
    <div class="nk-spine-audit__toolbar">
      <div class="nk-spine-audit__chips">
        <span class="nk-spine-audit__chip is-ok" title="通过条目数">PASS {{ summary.pass }}</span>
        <span class="nk-spine-audit__chip is-fail" title="失败条目数 — 需人工处理">FAIL {{ summary.fail }}</span>
        <span class="nk-spine-audit__chip is-warn" title="警告条目数 — 建议核查">WARN {{ summary.warn }}</span>
        <span
          class="nk-spine-audit__chip nk-spine-audit__chip--gl"
          :class="glAlive >= GL_WARN_AT ? 'is-fail' : ''"
          title="活跃 WebGL 上下文数（浏览器上限约 16，队列 1 + 预览 1）"
        >GL {{ glAlive }}/16</span>
      </div>
      <div class="nk-spine-audit__bulk">
        <template v-if="running">
          <span class="nk-spine-audit__progress-text" aria-live="polite">{{ summary.done }}/{{ summary.total }}</span>
          <button type="button" class="nk-spine-audit__btn" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button>
          <button type="button" class="nk-spine-audit__btn is-danger" @click="stopAudit">停止</button>
        </template>
        <template v-else>
          <button type="button" class="nk-spine-audit__btn is-primary" @click="startAudit">开始审核</button>
          <button type="button" class="nk-spine-audit__btn" :disabled="summary.fail + summary.warn === 0" @click="rerunIssues">仅异常重跑</button>
          <button type="button" class="nk-spine-audit__btn" :disabled="summary.done === 0" @click="exportReport">导出报告</button>
        </template>
      </div>
    </div>
    <div class="nk-spine-audit__progress" aria-hidden="true">
      <div class="nk-spine-audit__progress-bar" :style="{ width: `${summary.total ? (summary.done / summary.total) * 100 : 0}%` }"></div>
    </div>
    <p v-if="loadError" class="nk-spine-audit__error" role="alert">{{ loadError }}</p>

    <div class="nk-spine-audit__filters">
      <select class="nk-spine-audit__select" v-model="filterKind" aria-label="按来源筛选">
        <option value="all">全部来源</option>
        <option v-for="k in KIND_ORDER" :key="k" :value="k">{{ KIND_LABEL[k] }}</option>
      </select>
      <button
        type="button"
        class="nk-spine-audit__btn is-toggle"
        :class="{ 'is-on': onlyIssue }"
        :aria-pressed="onlyIssue"
        @click="onlyIssue = !onlyIssue"
      >{{ onlyIssue ? '仅异常 ✓' : '仅异常' }}</button>
      <span v-if="running" class="nk-spine-audit__hint">{{ paused ? '队列已暂停 — 点击「继续」' : '审核进行中…' }}</span>
    </div>

    <section v-for="kind in KIND_ORDER" :key="kind" class="nk-spine-audit__group">
      <div v-if="grouped[kind].length" class="nk-spine-audit__panel">
        <header class="nk-spine-audit__group-head">
          <span class="nk-spine-audit__group-name">{{ KIND_LABEL[kind] }}</span>
          <span class="nk-spine-audit__group-count">{{ grouped[kind].length }}</span>
          <span v-if="groupState(kind).fail" class="nk-spine-audit__group-state is-fail">✕{{ groupState(kind).fail }}</span>
          <span v-if="groupState(kind).warn" class="nk-spine-audit__group-state is-warn">▲{{ groupState(kind).warn }}</span>
          <span v-if="groupState(kind).pass" class="nk-spine-audit__group-state is-ok">✓{{ groupState(kind).pass }}</span>
        </header>
        <template v-for="(e, i) in grouped[kind]" :key="e.key">
          <div
            class="nk-spine-audit__row"
            :class="[`is-${e.status}`, { 'is-open': expandedKey === e.key }]"
            role="button"
            tabindex="0"
            :aria-expanded="expandedKey === e.key"
            @click="toggleDetail(e)"
            @keydown.enter="toggleDetail(e)"
          >
            <span class="nk-spine-audit__bar" aria-hidden="true"></span>
            <span class="nk-spine-audit__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="nk-spine-audit__key">{{ e.key }}</span>
            <span class="nk-spine-audit__label">{{ e.label }}</span>
            <span v-if="e.errors.length" class="nk-spine-audit__err" :title="e.errors.join('\n')">{{ shortErrors(e) }}</span>
            <span v-else-if="e.warnings.length" class="nk-spine-audit__err is-warn" :title="e.warnings.join('\n')">{{ e.warnings.join(' | ').slice(0, 100) }}</span>
            <span v-else-if="e.status === 'pass' && e.loadMs" class="nk-spine-audit__ms">{{ e.loadMs }}ms</span>
            <span class="nk-spine-audit__badge" :class="`is-${e.status}`">{{ badgeText(e) }}</span>
            <span class="nk-spine-audit__caret">{{ expandedKey === e.key ? '▾' : '▸' }}</span>
          </div>
          <SpineAuditDetail
            v-if="expandedKey === e.key"
            :entry="e"
            :resolved="detailResolved"
            @gl-change="onPreviewGlChange"
          />
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.nk-spine-audit__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 16px;
  max-width: 1480px;
  padding: 10px 14px;
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  background: var(--nk-sheet-bg);
  box-shadow: var(--nk-shadow-card);
}
.nk-spine-audit__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.nk-spine-audit__chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
}
.nk-spine-audit__chip.is-ok { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.45); background: rgba(127, 224, 138, 0.12); }
.nk-spine-audit__chip.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-spine-audit__chip.is-warn { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-spine-audit__chip--gl { opacity: 0.55; }
.nk-spine-audit__chip--gl.is-fail { opacity: 1; }
.nk-spine-audit__bulk { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.nk-spine-audit__progress-text {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text2);
  min-width: 52px;
  text-align: right;
}

.nk-spine-audit__progress {
  margin-top: 10px;
  max-width: 1480px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 10%, transparent);
  overflow: hidden;
}
.nk-spine-audit__progress-bar {
  height: 100%;
  border-radius: 999px;
  background: var(--primary);
  transition: width 0.3s var(--nk-ease-out);
}
.nk-spine-audit__error {
  margin: 10px 0 0;
  color: #ff6b6b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.nk-spine-audit__filters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.nk-spine-audit__hint {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #ffd9a3;
}
.nk-spine-audit__btn.is-toggle.is-on {
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  background: color-mix(in srgb, var(--primary) 18%, transparent);
}

.nk-spine-audit__group { max-width: 1480px; margin-bottom: 18px; }
.nk-spine-audit__panel {
  border: 1px solid var(--nk-sheet-border);
  border-radius: var(--nk-radius-card);
  background: var(--nk-sheet-bg);
  box-shadow: var(--nk-shadow-card);
  overflow: hidden;
}
.nk-spine-audit__group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px 7px;
}
.nk-spine-audit__group-head + .nk-spine-audit__row,
.nk-spine-audit__detail + .nk-spine-audit__row { border-top: 1px solid color-mix(in srgb, var(--text) 8%, transparent); }
.nk-spine-audit__group-name {
  font-family: var(--font-hud);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-spine-audit__group-count {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
}
.nk-spine-audit__group-state {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid transparent;
}
.nk-spine-audit__group-state.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-spine-audit__group-state.is-warn { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-spine-audit__group-state.is-ok { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.4); background: rgba(127, 224, 138, 0.1); }

.nk-spine-audit__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
  cursor: pointer;
  transition: background 0.15s;
}
.nk-spine-audit__row:hover { background: color-mix(in srgb, var(--text) 6%, transparent); }
.nk-spine-audit__bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
}
.nk-spine-audit__row.is-fail { background: rgba(229, 72, 77, 0.07); }
.nk-spine-audit__row.is-fail .nk-spine-audit__bar { background: #e5484d; }
.nk-spine-audit__row.is-warn { background: rgba(245, 166, 35, 0.05); }
.nk-spine-audit__row.is-warn .nk-spine-audit__bar { background: #f5a623; }
.nk-spine-audit__row.is-running { background: rgba(245, 166, 35, 0.05); }
.nk-spine-audit__row.is-running .nk-spine-audit__bar { background: #f5a623; animation: nk-audit-pulse 1.2s ease-in-out infinite; }
.nk-spine-audit__row.is-pass { opacity: 0.82; }
.nk-spine-audit__row.is-pass .nk-spine-audit__bar { background: rgba(127, 224, 138, 0.55); }
.nk-spine-audit__row.is-open { background: color-mix(in srgb, var(--text) 8%, transparent); }
@keyframes nk-audit-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
.nk-spine-audit__num {
  min-width: 24px;
  padding: 2px 7px;
  border-radius: 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 12%, transparent);
  flex: none;
}
.nk-spine-audit__key {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  flex: none;
}
.nk-spine-audit__label {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.nk-spine-audit__ms {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text3);
  flex: none;
}
.nk-spine-audit__err {
  max-width: 380px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #ff9c9c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: none;
}
.nk-spine-audit__err.is-warn { color: #ffd9a3; }
.nk-spine-audit__badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  flex: none;
}
.nk-spine-audit__badge.is-pass { color: #b7f2bd; background: rgba(127, 224, 138, 0.14); border: 1px solid rgba(127, 224, 138, 0.4); }
.nk-spine-audit__badge.is-fail { color: #ffb3b3; background: rgba(229, 72, 77, 0.16); border: 1px solid rgba(229, 72, 77, 0.5); }
.nk-spine-audit__badge.is-warn { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
.nk-spine-audit__badge.is-running { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); animation: nk-audit-pulse 1.2s ease-in-out infinite; }
.nk-spine-audit__badge.is-pending { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-audit__caret { color: var(--text3); font-size: 10px; flex: none; }

.nk-spine-audit__select {
  padding: 3px 8px;
  max-width: 220px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 24%, transparent);
  border-radius: 6px;
  cursor: pointer;
}
.nk-spine-audit__select:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn {
  padding: 4px 12px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s, transform 0.18s var(--nk-ease-out);
}
.nk-spine-audit__btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-spine-audit__btn:active:not(:disabled) { background: color-mix(in srgb, var(--text) 14%, transparent); transform: translateY(0); }
.nk-spine-audit__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
.nk-spine-audit__btn.is-danger { border-color: rgba(229, 72, 77, 0.5); color: #ffb3b3; }
.nk-spine-audit__btn.is-danger:hover:not(:disabled) { background: rgba(229, 72, 77, 0.12); }
.nk-spine-audit__btn.is-primary {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 20%, transparent);
  color: var(--primary);
  font-weight: 600;
}
.nk-spine-audit__btn.is-primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 30%, transparent);
  border-color: var(--th-400);
  box-shadow: var(--nk-shadow-card);
  transform: translateY(-1px);
}

@media (max-width: 560px) {
  .nk-spine-audit__err { display: none; }
  .nk-spine-audit__ms { display: none; }
  .nk-spine-audit__row { gap: 8px; padding: 8px 10px 8px 12px; }
  .nk-spine-audit__label { font-size: 11px; }
}

@media (prefers-reduced-motion: reduce) {
  .nk-spine-audit__btn, .nk-spine-audit__row, .nk-spine-audit__progress-bar { transition: none; }
  .nk-spine-audit__row.is-running .nk-spine-audit__bar,
  .nk-spine-audit__badge.is-running { animation: none; }
}
</style>