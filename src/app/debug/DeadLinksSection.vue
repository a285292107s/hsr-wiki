<script setup lang="ts">
/**
 * 死链审核台（研究线 Tab 之一）：
 * 浏览器端数据驱动死链审计（替代 tools/dead-links.test.ts 的 Node 版本机运行）——
 * 复用同一批 URL 构造函数收集全量渲染 URL，HEAD 探测可达性，明确 404 才判 DEAD。
 * 引擎与限流纪律（并发 ≤3、404 本地缓存、内容签名零网络）见 spine-lab/src/dead-links.ts。
 * 本文件仅承担队列编排与面板框架，不承载审核逻辑。
 */
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { toast } from './lib/toast';
import { downloadJson } from './report';
import {
  AuditControl,
  CacheEntry,
  CACHE_STORAGE_KEY,
  DEFAULT_CONCURRENCY,
  ProbeStatus,
  UrlDomain,
  UrlMap,
  domainOf,
  loadCacheFromStorage,
  planProbe,
  prepareAudit,
  runAudit,
  saveCacheToStorage,
} from './dead-links';

type Row = { url: string; source: string; status: ProbeStatus | 'pending' };

const DOMAIN_ORDER: UrlDomain[] = ['jsdelivr', 'nanoka', 'other'];
const DOMAIN_LABEL: Record<UrlDomain, string> = { jsdelivr: 'jsDelivr', nanoka: 'nanoka', other: 'other' };

/* ─── 状态 ─── */

const phase = ref<'idle' | 'loading' | 'running' | 'error'>('idle');
const loadError = ref('');
const urls = ref<UrlMap>(new Map());
const sourceHashes = ref<Record<string, string>>({});
const results = ref<Record<string, CacheEntry>>({});
const dataFileCount = ref(0);
const reuseCount = ref(0);

const control: AuditControl = reactive({ stopped: false, paused: false });
const concurrency = ref(DEFAULT_CONCURRENCY);
const filterDomain = ref<'all' | UrlDomain>('all');
const onlyIssue = ref(false);

const doneCount = ref(0);
const totalCount = ref(0);

/** localStorage 批量落盘间隔（条）：死链结果必须持久化（jsDelivr 404 不缓存，复用靠本地） */
const SAVE_BATCH = 25;
let saveDirty = 0;

function persist(): void {
  saveCacheToStorage({ sourceHashes: sourceHashes.value, entries: results.value });
}

const stats = computed(() => {
  let ok = 0, dead = 0, env = 0, pending = 0;
  for (const url of urls.value.keys()) {
    const st = results.value[url]?.status;
    if (st === 'ok') ok++;
    else if (st === 'dead') dead++;
    else if (st === 'env') env++;
    else pending++;
  }
  return { ok, dead, env, pending };
});

const rankOf = (s: Row['status']): number => (s === 'dead' ? 0 : s === 'env' ? 1 : s === 'pending' ? 2 : 3);

const grouped = computed(() => {
  const g: Record<UrlDomain, Row[]> = { jsdelivr: [], nanoka: [], other: [] };
  for (const [url, source] of urls.value) {
    const dom = domainOf(url);
    if (filterDomain.value !== 'all' && filterDomain.value !== dom) continue;
    const st: Row['status'] = results.value[url]?.status ?? 'pending';
    // 非异常（ok/待测）跳过；写为 非dead且非env 避免 TS 收窄链报错
    if (onlyIssue.value && st !== 'dead' && st !== 'env') continue;
    g[dom].push({ url, source, status: st });
  }
  for (const dom of DOMAIN_ORDER) {
    g[dom].sort((a, b) => rankOf(a.status) - rankOf(b.status) || a.url.localeCompare(b.url));
  }
  return g;
});

function groupState(dom: UrlDomain): { dead: number; env: number } {
  let dead = 0, env = 0;
  for (const row of grouped.value[dom]) {
    if (row.status === 'dead') dead++;
    else if (row.status === 'env') env++;
  }
  return { dead, env };
}

function badgeText(s: Row['status']): string {
  switch (s) {
    case 'ok': return 'OK';
    case 'dead': return 'DEAD';
    case 'env': return 'ENV';
    case 'pending': return '待测';
    default: return '—';
  }
}

/* ─── 队列编排 ─── */

const onResult = (url: string, status: ProbeStatus): void => {
  results.value[url] = { status, ts: Date.now() };
  if (++saveDirty >= SAVE_BATCH) {
    saveDirty = 0;
    persist();
  }
};

async function run(toProbe: string[]): Promise<void> {
  doneCount.value = 0;
  totalCount.value = toProbe.length;
  phase.value = 'running';
  try {
    await runAudit(toProbe, concurrency.value, control, {
      onResult,
      onProgress: (done, total) => {
        doneCount.value = done;
        totalCount.value = total;
      },
    });
    persist();
    phase.value = 'idle';
    toast('success', `探测完成：${doneCount.value}/${totalCount.value}`);
  } catch (e) {
    phase.value = 'error';
    loadError.value = String(e);
  }
}

/** 增量审核：先收集数据（会话内复用），再按缓存 + 内容签名计算待测集 */
async function startAudit(force: boolean): Promise<void> {
  if (phase.value === 'running' || phase.value === 'loading') return;
  control.stopped = false;
  control.paused = false;
  loadError.value = '';
  try {
    if (force || urls.value.size === 0) {
      phase.value = 'loading';
      const prepared = await prepareAudit();
      urls.value = prepared.urls;
      sourceHashes.value = prepared.sourceHashes;
      dataFileCount.value = prepared.dataFileCount;
    }
    // force 时忽略缓存（清空结果态）；增量时缓存 + 来源内容签名决定待测集
    const cache = force ? null : loadCacheFromStorage();
    const plan = planProbe(urls.value, cache, sourceHashes.value, Date.now(), force);
    results.value = plan.results;
    reuseCount.value = plan.reuseCount;
    if (plan.toProbe.length === 0) {
      phase.value = 'idle';
      toast('success', '全部 URL 已有有效缓存，无需探测');
      return;
    }
    await run(plan.toProbe);
  } catch (e) {
    phase.value = 'error';
    loadError.value = String(e);
  }
}

/** 仅重跑异常条目（dead/env）：先清其缓存条目强制重测，保留 ok 结果 */
async function rerunIssues(): Promise<void> {
  if (phase.value === 'running' || phase.value === 'loading') return;
  const issues = Object.entries(results.value)
    .filter(([, e]) => e.status === 'dead' || e.status === 'env')
    .map(([url]) => url);
  if (issues.length === 0) {
    toast('success', '无异常条目可重跑');
    return;
  }
  control.stopped = false;
  control.paused = false;
  for (const url of issues) delete results.value[url];
  await run(issues);
}

function stopAudit(): void {
  control.stopped = true;
  control.paused = false;
}

function clearAll(): void {
  localStorage.removeItem(CACHE_STORAGE_KEY);
  urls.value = new Map();
  sourceHashes.value = {};
  results.value = {};
  reuseCount.value = 0;
  doneCount.value = 0;
  totalCount.value = 0;
  phase.value = 'idle';
  toast('success', '本地缓存已清空');
}

function exportReport(): void {
  const items = [...urls.value].map(([url, source]) => ({
    url,
    source,
    domain: domainOf(url),
    status: results.value[url]?.status ?? 'pending',
    ts: results.value[url]?.ts ?? null,
  }));
  downloadJson(
    {
      exportedAt: new Date().toISOString(),
      dataFileCount: dataFileCount.value,
      urls: urls.value.size,
      items,
    },
    `dead-links-${Date.now()}.json`,
  );
}

onBeforeUnmount(() => {
  control.stopped = true; // 切 Tab 不卸载组件（v-show 常驻），仅兜底
});
</script>

<template>
  <div class="nk-deadlinks">
    <div class="nk-deadlinks__banner" role="note">
      <strong>jsDelivr 限流纪律</strong>
      · 404 不缓存于 CDN（每次探测回源 GitHub），已知结果由本地缓存 + 来源内容签名复用，内容未变零网络
      · 并发硬上限 3（默认，可调低）；禁止另开页签并行审计
      · 冷缓存全量耗时较长：可暂停后分次续跑，进度实时落盘；浏览器后台标签页会节流计时器，请保持前台
    </div>

    <div class="nk-deadlinks__toolbar">
      <div class="nk-deadlinks__chips">
        <span class="nk-deadlinks__chip" title="全量渲染 URL 数（含缓存复用）">URL {{ urls.size }}</span>
        <span class="nk-deadlinks__chip is-reuse" title="来源文件内容未变 → 复用缓存结果，零网络">复用 {{ reuseCount }}</span>
        <span class="nk-deadlinks__chip is-pending" title="未探测 / 缓存过期 / 来源内容变化">待测 {{ stats.pending }}</span>
        <span class="nk-deadlinks__chip is-ok">OK {{ stats.ok }}</span>
        <span class="nk-deadlinks__chip is-fail">DEAD {{ stats.dead }}</span>
        <span class="nk-deadlinks__chip is-warn" title="环境性信号（403/429/5xx/超时/CORS）不判失败">ENV {{ stats.env }}</span>
        <label class="nk-deadlinks__conc">
          并发
          <select v-model.number="concurrency" :disabled="phase === 'running'" aria-label="探测并发（限流硬上限 3）">
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
          </select>
        </label>
      </div>
      <div class="nk-deadlinks__bulk">
        <template v-if="phase === 'running'">
          <span class="nk-deadlinks__progress-text" aria-live="polite">{{ doneCount }}/{{ totalCount }}</span>
          <button type="button" class="nk-deadlinks__btn" @click="control.paused = !control.paused">
            {{ control.paused ? '继续' : '暂停' }}
          </button>
          <button type="button" class="nk-deadlinks__btn is-danger" @click="stopAudit">停止</button>
        </template>
        <template v-else>
          <button
            type="button"
            class="nk-deadlinks__btn is-primary"
            :disabled="phase === 'loading'"
            @click="startAudit(false)"
          >{{ phase === 'loading' ? '收集数据…' : '开始审核' }}</button>
          <button type="button" class="nk-deadlinks__btn" :disabled="urls.size === 0" @click="startAudit(true)">全量重测</button>
          <button
            type="button"
            class="nk-deadlinks__btn"
            :disabled="stats.dead + stats.env === 0"
            @click="rerunIssues"
          >仅异常重跑</button>
          <button type="button" class="nk-deadlinks__btn" :disabled="urls.size === 0" @click="exportReport">导出报告</button>
          <button type="button" class="nk-deadlinks__btn" @click="clearAll">清缓存</button>
        </template>
      </div>
    </div>

    <div class="nk-deadlinks__progress" aria-hidden="true">
      <div
        class="nk-deadlinks__progress-bar"
        :style="{ width: `${totalCount ? (doneCount / totalCount) * 100 : 0}%` }"
      ></div>
    </div>
    <p v-if="phase === 'running'" class="nk-deadlinks__hint-line" aria-live="polite">
      {{ control.paused ? '已暂停 — 点击「继续」' : `探测中… ${doneCount}/${totalCount}` }}
    </p>
    <p v-if="loadError" class="nk-deadlinks__error" role="alert">{{ loadError }}</p>

    <div class="nk-deadlinks__filters">
      <select v-model="filterDomain" class="nk-deadlinks__select" aria-label="按域名筛选">
        <option value="all">全部域名</option>
        <option v-for="d in DOMAIN_ORDER" :key="d" :value="d">{{ DOMAIN_LABEL[d] }}</option>
      </select>
      <button
        type="button"
        class="nk-deadlinks__btn is-toggle"
        :class="{ 'is-on': onlyIssue }"
        :aria-pressed="onlyIssue"
        @click="onlyIssue = !onlyIssue"
      >{{ onlyIssue ? '仅异常 ✓' : '仅异常' }}</button>
      <span v-if="urls.size" class="nk-deadlinks__cache-note" title="缓存有效期：ok/dead 7 天、env 1 天；来源文件内容变化自动重测">
        缓存：{{ reuseCount }} 复用 · {{ totalCount }} 待测
      </span>
    </div>

    <section v-for="dom in DOMAIN_ORDER" :key="dom" class="nk-deadlinks__group">
      <template v-if="grouped[dom].length">
        <header class="nk-deadlinks__group-head">
          <span class="nk-deadlinks__group-name">{{ DOMAIN_LABEL[dom] }}</span>
          <span class="nk-deadlinks__group-count">{{ grouped[dom].length }}</span>
          <span v-if="groupState(dom).dead" class="nk-deadlinks__group-state is-fail">✕{{ groupState(dom).dead }}</span>
          <span v-if="groupState(dom).env" class="nk-deadlinks__group-state is-warn">▲{{ groupState(dom).env }}</span>
        </header>
        <div
          v-for="row in grouped[dom]"
          :key="row.url"
          class="nk-deadlinks__row"
          :class="`is-${row.status}`"
        >
          <span class="nk-deadlinks__bar" aria-hidden="true"></span>
          <span class="nk-deadlinks__url" :title="`${row.url}\n来源: ${row.source}`">{{ row.url }}</span>
          <span class="nk-deadlinks__src" :title="row.source">{{ row.source }}</span>
          <span class="nk-deadlinks__badge" :class="`is-${row.status}`">{{ badgeText(row.status) }}</span>
        </div>
      </template>
    </section>

    <p v-if="urls.size === 0 && phase === 'idle'" class="nk-deadlinks__empty">
      尚未收集数据。点击「开始审核」收集全量渲染 URL 并探测可达性（首次冷缓存耗时较长，可暂停分次续跑）。
    </p>
  </div>
</template>

<style scoped>
/* ─── 限流警示条：行为约束常驻可见，弱化样式不抢操作区注意力 ─── */
.nk-deadlinks__banner {
  max-width: 1480px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border: 1px solid rgba(245, 166, 35, 0.35);
  border-radius: 8px;
  background: rgba(245, 166, 35, 0.07);
  color: var(--text2);
  font-size: 12px;
  line-height: 1.7;
}
.nk-deadlinks__banner strong { color: #ffd9a3; font-weight: 700; }

/* ─── 工具栏 ─── */
.nk-deadlinks__toolbar {
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
.nk-deadlinks__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.nk-deadlinks__chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
}
.nk-deadlinks__chip.is-ok { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.45); background: rgba(127, 224, 138, 0.12); }
.nk-deadlinks__chip.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-deadlinks__chip.is-warn { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-deadlinks__chip.is-pending { opacity: 0.75; }
.nk-deadlinks__chip.is-reuse { opacity: 0.7; }
.nk-deadlinks__conc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text2);
}
.nk-deadlinks__conc select {
  padding: 2px 6px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 24%, transparent);
  border-radius: 6px;
}
.nk-deadlinks__bulk { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.nk-deadlinks__progress-text {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text2);
  min-width: 56px;
  text-align: right;
}

.nk-deadlinks__progress {
  max-width: 1480px;
  margin-top: 10px;
  height: 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text) 10%, transparent);
  overflow: hidden;
}
.nk-deadlinks__progress-bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), var(--th-400));
  transition: width 0.3s;
}
.nk-deadlinks__hint-line {
  max-width: 1480px;
  margin: 6px 0 0;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #ffd9a3;
}
.nk-deadlinks__error {
  max-width: 1480px;
  margin: 10px 0 0;
  color: #ff6b6b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

/* ─── 筛选行 ─── */
.nk-deadlinks__filters {
  max-width: 1480px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
  flex-wrap: wrap;
}
.nk-deadlinks__btn.is-toggle.is-on {
  border-color: var(--primary);
  color: var(--text-bright);
  background: color-mix(in srgb, var(--primary) 22%, transparent);
  box-shadow: 0 0 12px var(--primary-glow);
}
.nk-deadlinks__cache-note {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text3);
}

/* ─── 分组 ─── */
.nk-deadlinks__group { max-width: 1480px; margin-bottom: 18px; }
.nk-deadlinks__group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
}
.nk-deadlinks__group-name {
  font-family: var(--font-hud);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-deadlinks__group-count {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
}
.nk-deadlinks__group-state {
  padding: 1px 7px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid transparent;
}
.nk-deadlinks__group-state.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-deadlinks__group-state.is-warn { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }

/* ─── 条目行 ─── */
.nk-deadlinks__row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 8%, transparent);
}
.nk-deadlinks__bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: transparent;
}
.nk-deadlinks__row.is-dead { background: rgba(229, 72, 77, 0.07); }
.nk-deadlinks__row.is-dead .nk-deadlinks__bar { background: #e5484d; box-shadow: 0 0 8px rgba(229, 72, 77, 0.6); }
.nk-deadlinks__row.is-env { background: rgba(245, 166, 35, 0.05); }
.nk-deadlinks__row.is-env .nk-deadlinks__bar { background: #f5a623; box-shadow: 0 0 8px rgba(245, 166, 35, 0.5); }
.nk-deadlinks__row.is-ok { opacity: 0.72; }
.nk-deadlinks__row.is-ok .nk-deadlinks__bar { background: rgba(127, 224, 138, 0.55); }
.nk-deadlinks__url {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.nk-deadlinks__src {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: var(--text3);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: none;
}
.nk-deadlinks__badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  flex: none;
}
.nk-deadlinks__badge.is-ok { color: #b7f2bd; background: rgba(127, 224, 138, 0.14); border: 1px solid rgba(127, 224, 138, 0.4); }
.nk-deadlinks__badge.is-dead { color: #ffb3b3; background: rgba(229, 72, 77, 0.16); border: 1px solid rgba(229, 72, 77, 0.5); box-shadow: 0 0 8px rgba(229, 72, 77, 0.25); }
.nk-deadlinks__badge.is-env { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
.nk-deadlinks__badge.is-pending { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }

.nk-deadlinks__empty {
  max-width: 1480px;
  padding: 24px 12px;
  color: var(--text3);
  font-size: 13px;
  line-height: 1.7;
}

/* ─── 通用控件 ─── */
.nk-deadlinks__select {
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
.nk-deadlinks__select:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-deadlinks__btn {
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
.nk-deadlinks__btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-deadlinks__btn:active:not(:disabled) { background: color-mix(in srgb, var(--text) 14%, transparent); }
.nk-deadlinks__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-deadlinks__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.nk-deadlinks__btn.is-danger { border-color: rgba(229, 72, 77, 0.5); color: #ffb3b3; }
.nk-deadlinks__btn.is-danger:hover:not(:disabled) { background: rgba(229, 72, 77, 0.12); }
.nk-deadlinks__btn.is-primary {
  border-color: var(--primary);
  background: linear-gradient(180deg, color-mix(in srgb, var(--primary) 85%, #fff 8%), var(--primary));
  color: var(--text-bright);
  font-weight: 600;
  box-shadow: 0 0 14px var(--primary-glow);
}
.nk-deadlinks__btn.is-primary:hover:not(:disabled) { border-color: var(--th-400); box-shadow: 0 0 20px var(--primary-glow); }

@media (max-width: 560px) {
  .nk-deadlinks__src { display: none; }
  .nk-deadlinks__row { gap: 8px; padding: 8px 10px 8px 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .nk-deadlinks__btn, .nk-deadlinks__progress-bar { transition: none; }
}
</style>
