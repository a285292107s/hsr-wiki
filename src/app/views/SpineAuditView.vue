<script setup lang="ts">
/**
 * Spine 导入审核台（长期保留的诊断页，路由 /debug/spine-audit）：
 * 全量 spine-manifest 条目批量体检（skel / official / official-scene），三级自动诊断：
 *   L0 静态：URL 可达性 + atlas 纹理映射对照（零 WebGL）
 *   L1 解析：骨架元数据提取（动画/皮肤/slot/附件/混合模式）
 *   L2 渲染：串行单实例渲染检查 + 像素采样（official 逐动画；skel/场景降级仅默认动画）
 * 人工只需浏览异常项 → 展开详情看资源表/纹理对照/元数据/采样 → 预览动画确认 → 按诊断建议修复。
 * 渲染参数与生产一致（premultipliedAlpha=false），支持暂停/继续、仅异常重跑、报告导出。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { loadSpineManifest, resolveSpine } from '../../services/api';
import type { SpineResolved } from '../../services/types';
import {
  SpinePlayerInstance,
  buildOfficialConfig, disposePlayer, getSpineCtor, loadSpineRuntime, pickAnimName,
} from '../debug/spine-shared';
import {
  AuditEntry, AuditKind, buildDiagnosis, classifyStatus,
  createAuditEntry, auditRender, auditStaticResources,
} from '../debug/spine-audit';

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
  const manifest = await loadSpineManifest();
  return Object.entries(manifest)
    .filter(([key]) => !key.startsWith('$')) // 跳过 $note 等元信息键
    .map(([key, v]) => {
      let kind: AuditKind;
      let label: string;
      if (v.kind === 'skel') {
        kind = 'skel';
        label = v.name;
      } else if (v.kind === 'official') {
        kind = 'official';
        label = Object.keys(v.textures)[0] ?? '—';
      } else {
        kind = 'official-scene';
        label = key;
      }
      return createAuditEntry(key, kind, label);
    });
}

async function runQueue(list: AuditEntry[]): Promise<void> {
  running.value = true;
  try {
    for (const e of list) {
      while (paused.value && !cancelled) await sleep(200);
      if (cancelled) break;
      e.status = 'running';
      let resolved: SpineResolved | null = null;
      try {
        resolved = await resolveSpine(e.key);
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

/* ─── 详情下钻与预览 ─── */

const detailResolved = ref<SpineResolved | null>(null);
const previewRef = ref<HTMLElement | null>(null);
const previewPlayer = ref<SpinePlayerInstance | null>(null);
const previewAnims = ref<string[]>([]);
const previewAnim = ref('');
const previewError = ref('');
const previewPaused = ref(false);

async function toggleDetail(e: AuditEntry): Promise<void> {
  if (expandedKey.value === e.key) {
    closeDetail();
    return;
  }
  closeDetail();
  expandedKey.value = e.key;
  previewError.value = '';
  try {
    detailResolved.value = await resolveSpine(e.key);
  } catch {
    detailResolved.value = null;
    previewError.value = '条目不可解析';
    return;
  }
  await mountPreview();
}

function closeDetail(): void {
  disposePreview();
  detailResolved.value = null;
  expandedKey.value = null;
}

function disposePreview(): void {
  if (previewPlayer.value) {
    disposePlayer(previewPlayer.value);
    previewPlayer.value = null;
    glAlive.value--;
  }
  previewAnims.value = [];
  previewAnim.value = '';
  previewPaused.value = false;
}

async function mountPreview(): Promise<void> {
  const resolved = detailResolved.value;
  if (!resolved) return;
  if (!getSpineCtor()) {
    const ok = await loadSpineRuntime();
    if (!ok) {
      previewError.value = 'spine-player 运行时加载失败';
      return;
    }
  }
  const Ctor = getSpineCtor();
  if (!Ctor) return;
  await nextTick();
  // v-for 内的模板 ref 会被 Vue 收集为数组，展开详情时取最后一项（当前详情行）
  const refs = previewRef.value as unknown;
  const host = Array.isArray(refs) ? (refs[refs.length - 1] as HTMLElement | undefined) : (refs as HTMLElement | null);
  if (!host) return;
  host.replaceChildren();
  const cfg =
    resolved.kind === 'skel'
      ? { skelUrl: `${resolved.base}.skel`, atlasUrl: `${resolved.base}.atlas` }
      : resolved.kind === 'official'
        ? buildOfficialConfig(resolved)
        : {
            ...buildOfficialConfig(resolved.layers[0]),
            viewport: { ...resolved.viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
          };
  const player = new Ctor(host, {
    ...cfg,
    alpha: true,
    backgroundColor: '00000000',
    premultipliedAlpha: false,
    showControls: false,
    showLoading: false,
    success(p) {
      const anims = ((p.skeleton && p.skeleton.data && p.skeleton.data.animations) || []).map((a) => a.name);
      previewAnims.value = anims;
      const def = pickAnimName(anims);
      if (def) {
        previewAnim.value = def;
        try {
          p.setAnimation(def);
          p.play();
        } catch { /* 静默 */ }
      }
    },
    error(_p, msg) {
      previewError.value = String(msg);
    },
  });
  previewPlayer.value = player;
  glAlive.value++;
}

function onPreviewAnim(name: string): void {
  previewAnim.value = name;
  const p = previewPlayer.value;
  if (!p) return;
  try {
    p.setAnimation(name);
    p.play();
    previewPaused.value = false;
  } catch { /* 静默 */ }
}

function togglePreviewPause(): void {
  const p = previewPlayer.value;
  if (!p) return;
  previewPaused.value = !previewPaused.value;
  try {
    if (previewPaused.value) p.pause();
    else p.resume();
  } catch { /* 静默 */ }
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
  try {
    await navigator.clipboard.writeText(text);
    loadError.value = ''; // 复用顶部错误区做提示位，见 template 提示样式
  } catch {
    // 剪贴板不可用时下载文件兜底
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = `spine-audit-${Date.now()}.json`;
    a.click();
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
  closeDetail();
});
</script>

<template>
  <div class="nk-spine-audit">
    <header class="nk-spine-audit__head">
      <p class="nk-spine-audit__kicker">SPINE AUDIT // 导入体检</p>
      <h1>Spine 审核台</h1>
      <p class="nk-spine-audit__desc">
        全量 manifest 条目三级诊断：L0 资源可达性 + atlas 纹理对照 → L1 骨架解析/元数据 → L2 真实渲染 + 像素采样（official 逐动画，skel/场景降级）。
        异常项展开详情查看资源表 / 纹理对照 / 采样结果，并按诊断建议定位修复。
      </p>
      <div class="nk-spine-audit__toolbar">
        <div class="nk-spine-audit__chips">
          <span class="nk-spine-audit__chip is-ok">PASS {{ summary.pass }}</span>
          <span class="nk-spine-audit__chip is-fail">FAIL {{ summary.fail }}</span>
          <span class="nk-spine-audit__chip is-warn">WARN {{ summary.warn }}</span>
          <span class="nk-spine-audit__chip" :class="glAlive >= GL_WARN_AT ? 'is-fail' : ''" title="活跃 WebGL 上下文数（队列 1 + 预览 1）">GL {{ glAlive }}/16</span>
          <span class="nk-spine-audit__chip" :class="running ? 'is-loading' : ''">进度 {{ summary.done }}/{{ summary.total }}</span>
        </div>
        <div class="nk-spine-audit__bulk">
          <button type="button" class="nk-spine-audit__btn" :disabled="running" @click="startAudit">开始审核</button>
          <button type="button" class="nk-spine-audit__btn" v-if="running" @click="togglePause">{{ paused ? '继续' : '暂停' }}</button>
          <button type="button" class="nk-spine-audit__btn" :disabled="running" @click="rerunIssues">仅异常重跑</button>
          <button type="button" class="nk-spine-audit__btn" :disabled="summary.done === 0" @click="exportReport">导出报告</button>
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
        class="nk-spine-audit__btn"
        :class="{ 'is-on': onlyIssue }"
        :aria-pressed="onlyIssue"
        @click="onlyIssue = !onlyIssue"
      >仅异常</button>
      <span v-if="running" class="nk-spine-audit__hint">{{ paused ? '队列已暂停 — 点击「继续」' : '审核进行中…' }}</span>
    </div>

    <section v-for="kind in KIND_ORDER" :key="kind" class="nk-spine-audit__group">
      <header v-if="grouped[kind].length" class="nk-spine-audit__group-head">
        <span class="nk-spine-audit__group-name">{{ KIND_LABEL[kind] }}</span>
        <span class="nk-spine-audit__group-count">{{ grouped[kind].length }}</span>
      </header>
      <div
        v-for="(e, i) in grouped[kind]"
        :key="e.key"
        class="nk-spine-audit__row"
        :class="[`is-${e.status}`, { 'is-open': expandedKey === e.key }]"
        role="button"
        tabindex="0"
        @click="toggleDetail(e)"
        @keydown.enter="toggleDetail(e)"
      >
        <span class="nk-spine-audit__num">{{ String(i + 1).padStart(2, '0') }}</span>
        <span class="nk-spine-audit__key">{{ e.key }}</span>
        <span class="nk-spine-audit__label">{{ e.label }}</span>
        <span v-if="e.loadMs" class="nk-spine-audit__ms">{{ e.loadMs }}ms</span>
        <span v-if="e.errors.length" class="nk-spine-audit__err" :title="e.errors.join('\n')">{{ shortErrors(e) }}</span>
        <span v-else-if="e.warnings.length" class="nk-spine-audit__err is-warn" :title="e.warnings.join('\n')">{{ e.warnings.join(' | ').slice(0, 100) }}</span>
        <span class="nk-spine-audit__badge" :class="`is-${e.status}`">{{ badgeText(e) }}</span>
        <span class="nk-spine-audit__caret">{{ expandedKey === e.key ? '▾' : '▸' }}</span>

        <div v-if="expandedKey === e.key" class="nk-spine-audit__detail" @click.stop>
          <div class="nk-spine-audit__cols">
            <div class="nk-spine-audit__col">
              <h3 class="nk-spine-audit__sub">资源检查（L0）</h3>
              <table class="nk-spine-audit__table">
                <tbody>
                  <tr v-for="r in e.resources" :key="r.url" :class="{ 'is-bad': !r.ok }">
                    <td class="nk-spine-audit__td-url">{{ r.url }}</td>
                    <td class="nk-spine-audit__td-status">{{ r.status || 'ERR' }}</td>
                    <td class="nk-spine-audit__td-ms">{{ r.ms }}ms</td>
                  </tr>
                </tbody>
              </table>
              <template v-if="e.atlasDiffs.length">
                <h3 class="nk-spine-audit__sub">纹理映射对照</h3>
                <div v-for="(d, i) in e.atlasDiffs" :key="i" class="nk-spine-audit__diff">
                  <p class="nk-spine-audit__diff-head">
                    atlas pages: {{ d.diff.atlasPages.join(', ') || '—' }}
                    <span v-if="d.layer !== null" class="nk-spine-audit__state is-off">层 {{ d.layer + 1 }}</span>
                  </p>
                  <p v-if="d.diff.missingInAtlas.length" class="nk-spine-audit__diff-bad">映射缺失于 atlas: {{ d.diff.missingInAtlas.join(', ') }}</p>
                  <p v-if="d.diff.missingInManifest.length" class="nk-spine-audit__diff-warn">atlas page 未映射: {{ d.diff.missingInManifest.join(', ') }}</p>
                  <p v-if="!d.diff.missingInAtlas.length && !d.diff.missingInManifest.length" class="nk-spine-audit__diff-ok">映射一致</p>
                </div>
              </template>
            </div>
            <div class="nk-spine-audit__col">
              <h3 class="nk-spine-audit__sub">骨架元数据（L1）</h3>
              <p v-if="!e.meta" class="nk-spine-audit__muted">{{ e.renderError || '渲染失败，无元数据' }}</p>
              <template v-else>
                <p class="nk-spine-audit__meta">动画 {{ e.meta.animations.length }} · 皮肤 {{ e.meta.skins.length }} · slot {{ e.meta.slots }} · 骨骼 {{ e.meta.bones }} · 附件 {{ e.meta.attachments }}</p>
                <p v-if="e.meta.blendSlots.length" class="nk-spine-audit__meta">混合: {{ e.meta.blendSlots.map((b) => `S${b.index}:${b.name}`).join(' ') }}</p>
                <h3 class="nk-spine-audit__sub">像素采样（L2）</h3>
                <table class="nk-spine-audit__table">
                  <tbody>
                    <tr v-for="f in e.frames" :key="`${f.layer}-${f.anim}`" :class="{ 'is-bad': f.visible === 0 }">
                      <td>{{ f.layer !== null ? `层${f.layer + 1}` : f.anim }}</td>
                      <td>{{ (f.ratio * 100).toFixed(2) }}%</td>
                      <td v-if="f.bbox">{{ f.bbox.x0 }},{{ f.bbox.y0 }} → {{ f.bbox.x1 }},{{ f.bbox.y1 }}</td>
                      <td v-else>—</td>
                    </tr>
                  </tbody>
                </table>
              </template>
              <h3 class="nk-spine-audit__sub">诊断建议</h3>
              <ul class="nk-spine-audit__advice">
                <li v-for="(a, i) in buildDiagnosis(e)" :key="i">{{ a }}</li>
                <li v-if="buildDiagnosis(e).length === 0" class="nk-spine-audit__muted">未发现问题</li>
              </ul>
            </div>
          </div>
          <div class="nk-spine-audit__preview">
            <h3 class="nk-spine-audit__sub">
              预览
              <span v-if="detailResolved && detailResolved.kind === 'official-scene'" class="nk-spine-audit__state is-off">场景仅主背景层</span>
            </h3>
            <div ref="previewRef" class="nk-spine-audit__stage"></div>
            <p v-if="previewError" class="nk-spine-audit__error" role="alert">{{ previewError }}</p>
            <div class="nk-spine-audit__preview-ctl">
              <select
                v-if="previewAnims.length > 1"
                class="nk-spine-audit__select"
                :value="previewAnim"
                aria-label="预览动画"
                @change="onPreviewAnim(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="a in previewAnims" :key="a" :value="a">{{ a }}</option>
              </select>
              <button type="button" class="nk-spine-audit__btn" :disabled="!previewPlayer" @click="togglePreviewPause">
                {{ previewPaused ? '播放' : '暂停' }}
              </button>
            </div>
          </div>
        </div>
      </div>
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
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
}
.nk-spine-audit__chip.is-ok { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.45); background: rgba(127, 224, 138, 0.12); }
.nk-spine-audit__chip.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-spine-audit__chip.is-warn { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-spine-audit__chip.is-loading { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-spine-audit__bulk { display: flex; flex-wrap: wrap; gap: 8px; }

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
  background: var(--primary);
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
.nk-spine-audit__btn.is-on { border-color: var(--primary); color: var(--primary); }

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

/* ─── 条目行 ─── */
.nk-spine-audit__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
  cursor: pointer;
  transition: background 0.15s;
}
.nk-spine-audit__row:hover { background: color-mix(in srgb, var(--text) 6%, transparent); }
.nk-spine-audit__row.is-fail { background: rgba(229, 72, 77, 0.05); }
.nk-spine-audit__row.is-running { background: rgba(245, 166, 35, 0.05); }
.nk-spine-audit__row.is-open { background: color-mix(in srgb, var(--text) 8%, transparent); }
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
  max-width: 420px;
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
.nk-spine-audit__badge.is-running { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
.nk-spine-audit__badge.is-pending { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-audit__caret { color: var(--text3); font-size: 10px; flex: none; }

/* ─── 详情 ─── */
.nk-spine-audit__detail {
  padding: 14px;
  border-left: 2px solid color-mix(in srgb, var(--primary) 45%, transparent);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
.nk-spine-audit__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
@media (max-width: 1024px) {
  .nk-spine-audit__cols { grid-template-columns: 1fr; }
}
.nk-spine-audit__sub {
  margin: 0 0 8px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--text2);
  text-transform: uppercase;
}
.nk-spine-audit__table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  margin-bottom: 12px;
}
.nk-spine-audit__table td {
  padding: 3px 8px 3px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 7%, transparent);
  vertical-align: top;
}
.nk-spine-audit__table tr.is-bad td { color: #ff9c9c; }
.nk-spine-audit__td-url { word-break: break-all; }
.nk-spine-audit__td-status { text-align: right; white-space: nowrap; }
.nk-spine-audit__td-ms { text-align: right; white-space: nowrap; color: var(--text3); }
.nk-spine-audit__diff { margin-bottom: 10px; }
.nk-spine-audit__diff-head {
  margin: 0 0 4px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text2);
  word-break: break-all;
}
.nk-spine-audit__diff-bad { margin: 2px 0; font-size: 11px; color: #ff9c9c; word-break: break-all; }
.nk-spine-audit__diff-warn { margin: 2px 0; font-size: 11px; color: #ffd9a3; word-break: break-all; }
.nk-spine-audit__diff-ok { margin: 2px 0; font-size: 11px; color: #b7f2bd; }
.nk-spine-audit__state {
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.nk-spine-audit__state.is-off { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-audit__meta {
  margin: 0 0 6px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.7;
  word-break: break-all;
}
.nk-spine-audit__muted { margin: 0 0 6px; font-size: 12px; color: var(--text3); }
.nk-spine-audit__advice {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
}
.nk-spine-audit__advice li { color: #ffd9a3; }

/* ─── 预览 ─── */
.nk-spine-audit__preview { margin-top: 16px; }
.nk-spine-audit__stage {
  width: 480px;
  height: 270px;
  max-width: 100%;
  background:
    linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(19, 26, 46, 0.9) 50%, rgba(10, 15, 30, 0.9) 100%),
    repeating-conic-gradient(#151d33 0% 25%, #0d1326 0% 50%) 0 0 / 24px 24px;
}
.nk-spine-audit__preview-ctl {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

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
  transition: background 0.18s, border-color 0.18s;
}
.nk-spine-audit__btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-spine-audit__btn:active:not(:disabled) { background: color-mix(in srgb, var(--text) 14%, transparent); }
.nk-spine-audit__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-audit__btn:disabled { opacity: 0.45; cursor: not-allowed; }

@media (max-width: 560px) {
  .nk-spine-audit { padding: 16px 12px; }
  .nk-spine-audit__stage { width: 100%; height: auto; aspect-ratio: 16 / 9; }
}

@media (prefers-reduced-motion: reduce) {
  .nk-spine-audit__btn, .nk-spine-audit__row, .nk-spine-audit__progress-bar { transition: none; }
}
</style>
