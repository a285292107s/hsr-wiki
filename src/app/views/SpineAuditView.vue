<script setup lang="ts">
/**
 * Spine 导入审核台（长期保留的诊断页，路由 /debug/spine-audit）：
 * 全量 spine-manifest 条目批量体检（skel / official / official-scene），三级自动诊断：
 *   L0 静态：URL 可达性 + atlas 纹理映射对照（零 WebGL）
 *   L1 解析：骨架元数据提取（动画/皮肤/slot/附件/混合模式）
 *   L2 渲染：串行单实例渲染检查 + 像素采样（official 逐动画；skel/场景降级仅默认动画）
 * 人工只需浏览异常项 → 展开详情看资源表/纹理对照/元数据/采样 → 预览动画确认 → 按诊断建议修复。
 * 本文件仅承担队列编排与页面框架；审核引擎在 src/debug/spine-audit.ts，
 * 展开详情（含预览生命周期）在 src/debug/SpineAuditDetail.vue。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { loadSpineManifests, resolveSpine } from '../../services/api';
import type { SpineResolved } from '../../services/types';
import { useAppStore } from '../stores/app';
import SpineAuditDetail from '../../debug/SpineAuditDetail.vue';
import { copyText, downloadJson } from '../../debug/report';
import {
  AuditEntry, AuditKind, buildDiagnosis, classifyStatus,
  createAuditEntry, resetAuditEntry, auditRender, auditStaticResources,
} from '../../debug/spine-audit';

const app = useAppStore();

/* ─── 常量与状态 ─── */

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

/** 组内状态统计（组头迷你徽章） */
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

/** 行内错误摘要（截断） */
function shortErrors(e: AuditEntry): string {
  return e.errors
    .map((t) => (t.includes('HTTP ') ? t.slice(0, t.indexOf(':')) : t))
    .join(' | ')
    .slice(0, 120);
}

/* ─── 审核队列 ─── */

async function buildEntries(): Promise<AuditEntry[]> {
  const { official, nanoka } = await loadSpineManifests();
  const list: AuditEntry[] = [];
  // 官方源（优先）：official / official-scene 条目
  for (const [key, v] of Object.entries(official?.entries ?? {})) {
    if (v.kind === 'official') {
      list.push(createAuditEntry(key, 'official', Object.keys(v.textures)[0] ?? '—', 'official'));
    } else {
      list.push(createAuditEntry(key, 'official-scene', key, 'official'));
    }
  }
  // nanoka 源（回退）：skel 条目，label 加前缀便于与官方条目区分
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
      resetAuditEntry(e); // 重跑前清空旧结果，防 errors/frames 叠加重复计数
      e.status = 'running';
      let resolved: SpineResolved | null = null;
      try {
        // 按条目所属源强制解析（nanoka 条目不被官方优先拦截）
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

/** 仅重跑异常条目（fail / warn），保留已 pass 的结果 */
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

/** 停止审核：置取消标志并解除暂停阻塞，队列在下一检查点退出（在途渲染自然走完） */
function stopAudit(): void {
  cancelled = true;
  paused.value = false;
}

/* ─── 详情下钻（预览生命周期由 SpineAuditDetail 子组件自管理） ─── */

const detailResolved = ref<SpineResolved | null>(null);
/** 详情代际令牌：解析在途时若被后续展开/收起抢占，过期结果丢弃 */
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
    // 按条目所属源解析（nanoka 条目不被官方优先拦截）
    resolved = await resolveSpine(e.key, e.source);
  } catch {
    resolved = null;
  }
  if (epoch !== detailEpoch) return; // 已被后续操作抢占，丢弃过期结果
  detailResolved.value = resolved;
  expandedKey.value = e.key;
}

function closeDetail(): void {
  detailEpoch++;
  detailResolved.value = null;
  expandedKey.value = null;
}

/** 预览 WebGL 上下文占用变化 → 汇总至顶部 GL 配额徽章 */
function onPreviewGlChange(delta: number): void {
  glAlive.value += delta;
}

/* ─── 报告导出 ─── */

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
    app.toast('success', '审核报告已复制到剪贴板');
  } else {
    // 剪贴板不可用时下载文件兜底
    downloadJson(report, `spine-audit-${Date.now()}.json`);
    app.toast('success', '剪贴板不可用，报告已下载为 JSON');
  }
}

onMounted(async () => {
  // 仅预加载条目清单（不自动开跑，人工确认后点「开始审核」）
  try {
    entries.value = await buildEntries();
  } catch {
    loadError.value = 'manifest 加载失败';
  }
});

onBeforeUnmount(() => {
  cancelled = true;
  closeDetail(); // 详情子组件卸载时自行释放预览 WebGL 上下文
});
</script>

<template>
  <div class="nk-spine-audit">
    <header class="nk-spine-audit__head">
      <p class="nk-spine-audit__kicker">SPINE AUDIT // 导入体检</p>
      <h1>Spine 审核台</h1>
      <p class="nk-spine-audit__desc">
        全量 manifest 三级诊断：L0 资源可达性 → L1 骨架解析 → L2 真实渲染 + 像素采样（official 逐动画，skel/场景降级）。异常项展开详情查看资源表 / 诊断建议，并可预览动画确认。
      </p>

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
    </header>

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
      <template v-if="grouped[kind].length">
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
      </template>
    </section>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：OLED 深色控制台，左侧避让导航条（与 SpineDebugView 同语言） ─── */
.nk-spine-audit {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
  overflow-x: auto;
}
@media (min-width: 768px) {
  .nk-spine-audit { margin-left: 72px; }
}
@media (min-width: 1024px) {
  .nk-spine-audit { margin-left: 88px; }
}

/* ─── 头部 ─── */
.nk-spine-audit__head { max-width: 1480px; margin-bottom: 16px; }
.nk-spine-audit__kicker {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-spine-audit__head h1 {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.nk-spine-audit__desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.72;
}
.nk-spine-audit__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 16px;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
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
.nk-spine-audit__chip--gl { opacity: 0.55; } /* 次要监控信息：弱化不抢主状态注意力 */
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
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 10%, transparent);
  overflow: hidden;
}
.nk-spine-audit__progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), #A78BFA);
  box-shadow: 0 0 8px var(--primary-glow);
  transition: width 0.3s;
}
.nk-spine-audit__error {
  margin: 10px 0 0;
  color: #ff6b6b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

/* ─── 筛选行 ─── */
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
/* 「仅异常」为审核台核心操作（人工只看异常项），开启态用主色强化 */
.nk-spine-audit__btn.is-toggle.is-on {
  border-color: var(--primary);
  color: var(--text-bright);
  background: color-mix(in srgb, var(--primary) 22%, transparent);
  box-shadow: 0 0 12px var(--primary-glow);
}

/* ─── 分组 ─── */
.nk-spine-audit__group { max-width: 1480px; margin-bottom: 18px; }
.nk-spine-audit__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
}
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

/* ─── 条目行 ─── */
.nk-spine-audit__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
  cursor: pointer;
  transition: background 0.15s;
}
.nk-spine-audit__row:hover { background: color-mix(in srgb, var(--text) 6%, transparent); }
/* 左侧状态条：异常强信号，PASS 弱化避免绿色噪声 */
.nk-spine-audit__bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
}
.nk-spine-audit__row.is-fail { background: rgba(229, 72, 77, 0.07); }
.nk-spine-audit__row.is-fail .nk-spine-audit__bar { background: #e5484d; box-shadow: 0 0 8px rgba(229, 72, 77, 0.6); }
.nk-spine-audit__row.is-warn { background: rgba(245, 166, 35, 0.05); }
.nk-spine-audit__row.is-warn .nk-spine-audit__bar { background: #f5a623; box-shadow: 0 0 8px rgba(245, 166, 35, 0.5); }
.nk-spine-audit__row.is-running { background: rgba(245, 166, 35, 0.05); }
.nk-spine-audit__row.is-running .nk-spine-audit__bar { background: #f5a623; animation: nk-audit-pulse 1.2s ease-in-out infinite; }
.nk-spine-audit__row.is-pass { opacity: 0.82; }
.nk-spine-audit__row.is-pass .nk-spine-audit__bar { background: rgba(127, 224, 138, 0.55); }
.nk-spine-audit__row.is-open { background: color-mix(in srgb, var(--text) 8%, transparent); }
@keyframes nk-audit-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
.nk-spine-audit__num {
  padding: 1px 7px;
  border-radius: 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
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
.nk-spine-audit__badge.is-fail { color: #ffb3b3; background: rgba(229, 72, 77, 0.16); border: 1px solid rgba(229, 72, 77, 0.5); box-shadow: 0 0 8px rgba(229, 72, 77, 0.25); }
.nk-spine-audit__badge.is-warn { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
.nk-spine-audit__badge.is-running { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); animation: nk-audit-pulse 1.2s ease-in-out infinite; }
.nk-spine-audit__badge.is-pending { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-audit__caret { color: var(--text3); font-size: 10px; flex: none; }

/* ─── 通用控件 ─── */
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
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, box-shadow 0.18s;
}
.nk-spine-audit__btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-spine-audit__btn:active:not(:disabled) { background: color-mix(in srgb, var(--text) 14%, transparent); }
.nk-spine-audit__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.nk-spine-audit__btn.is-danger { border-color: rgba(229, 72, 77, 0.5); color: #ffb3b3; }
.nk-spine-audit__btn.is-danger:hover:not(:disabled) { background: rgba(229, 72, 77, 0.12); }
/* 主操作按钮：仅「开始审核」使用，填充主色突出入口 */
.nk-spine-audit__btn.is-primary {
  border-color: var(--primary);
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary) 85%, #fff 8%), var(--primary));
  color: var(--text-bright);
  font-weight: 600;
  box-shadow: 0 0 14px var(--primary-glow);
}
.nk-spine-audit__btn.is-primary:hover:not(:disabled) { border-color: #A78BFA; box-shadow: 0 0 20px var(--primary-glow); }

@media (max-width: 560px) {
  .nk-spine-audit { padding: 16px 12px; }
  /* 移动端行内仅保留身份 + 徽章：错误摘要与耗时折叠进详情 */
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
