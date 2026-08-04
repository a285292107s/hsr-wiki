<script setup lang="ts">
/**
 * KV 场景验收台（长期保留，路由 /debug/spine?scene=home-bg）：
 * 游戏每个版本的 KV 场景（official-scene，主背景 + 多层角色群像）资源从官网重新抓取写入
 * spine-manifest.json 后，在本页验收其能否正常渲染：
 * - 「一键验收」顺序加载全部场景：逐层加载状态 + 单画布合并渲染（复用生产管线 createScenePipeline，
 *   验收基线 = 生产渲染由代码结构保证）+ 黑块自动检测（近黑不透明像素占比），生成可导出的 PASS/FAIL 报告；
 *   判定引擎在 app/debug/kv-acceptance.ts，验收编排在 app/debug/use-kv-acceptance.ts。
 * - 单层模式为逐层状态视图：每层独立画布 + 加载状态/耗时/错误，供定位「哪一层异常」；
 *   画布带不透明深色衬底（LAYER_BG），混合 slot 的 dst 非透明 → 无透明退化黑块。
 * 渲染参数与生产完全一致：同一固定 viewport + pad 0 + rawDataURIs 纹理重映射。
 * 逻辑拆分：单层 player 管理在 debug/use-single-layers.ts，合并管线在 debug/use-merged-pipeline.ts；
 * 本文件仅承担场景加载编排、跨模式播放控制、PNG 导出装配与视图组装。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadSpineSceneKeys, resolveSpine } from '../../services/api';
import { SPINE_RUNTIME_VERSION } from '../../lib/constants';
import { getSpineCtor, loadSpineRuntime } from '../../lib/spine/runtime';
import { nearBlackClass as blackClass } from '../debug/kv-acceptance';
import { copyText, downloadCanvas, downloadJson } from '../debug/report';
import { useKvAcceptance, type AcceptBridge } from '../debug/use-kv-acceptance';
import { useMergedPipeline } from '../debug/use-merged-pipeline';
import { type LayerState, useSingleLayers } from '../debug/use-single-layers';
import { useAppStore } from '../stores/app';
/** 浏览器活跃 WebGL 上下文上限约 16，达到此值预警 */
const GL_WARN_AT = 12;

const route = useRoute();
const router = useRouter();
const app = useAppStore();

/* ─── 渲染子系统：单层 player / 合并管线（debug/* composable） ─── */

const layersApi = useSingleLayers();
const merged = useMergedPipeline();

/* 模板绑定别名（保持既有模板引用名不变） */
const { layers, playerAlive } = layersApi;
const mergedOn = merged.on;
const mergedReady = merged.ready;
const mergedError = merged.error;
const mergedRef = merged.registerEl;
const setLayerEl = layersApi.registerEl;

const sceneKey = ref(typeof route.query.scene === 'string' && route.query.scene ? route.query.scene : 'home-bg');
const sceneKeys = ref<string[]>([]);
const viewportText = ref('');
const loadError = ref('');
const paused = ref(false);

/** 当前占用的 WebGL 上下文总数（单层 player + 合并画布） */
const glTotal = computed(() => playerAlive.value + (mergedOn.value ? 1 : 0));

/** 汇总：就绪/失败/总数（头部工具栏状态条） */
const summary = computed(() => {
  const ok = layers.value.filter((l) => l.status === 'ok').length;
  const fail = layers.value.filter((l) => l.status === 'fail').length;
  const total = layers.value.length;
  if (fail > 0) return `FAIL ${fail}/${total}`;
  if (ok === total && total > 0) return `READY ${ok}/${total}`;
  return `LOADING ${ok}/${total}`;
});

/** 验收报告 PASS 数（报告头部汇总徽章） */
const reportPass = computed(() => acceptReport.value.filter((r) => r.verdict === 'PASS').length);

function badgeText(st: LayerState): string {
  return st.status === 'ok' ? 'OK' : st.status === 'fail' ? 'FAIL' : '加载中';
}

/* ─── 场景加载编排（驱动单层 + 合并两条渲染链） ─── */

/** 场景代际令牌：loadScene 每次递增；验收轮询检测到变化即中止当前项（外部操作抢占场景） */
let sceneEpoch = 0;

/** 加载指定场景：先释放旧资源，再重建两条渲染链 */
async function loadScene(key: string): Promise<void> {
  sceneEpoch++;
  layersApi.reset();
  merged.dispose();
  paused.value = false;
  loadError.value = '';
  viewportText.value = '';
  try {
    const entry = await resolveSpine(key);
    if (sceneKey.value !== key) return; // 已切换到其他场景，丢弃过期结果
    if (!entry || entry.kind !== 'official-scene') {
      loadError.value = `未找到 ${key} 场景条目（kind 非 official-scene）`;
      return;
    }
    viewportText.value = `viewport ${entry.viewport.width}×${entry.viewport.height} @ (${entry.viewport.x}, ${entry.viewport.y})`;
    const ok = await loadSpineRuntime();
    if (sceneKey.value !== key) return;
    if (!ok) {
      // 保持 layers 为空 → 验收轮询走「无层 + 有错误」快速失败路径，不空转 90s
      loadError.value = 'spine-player 运行时加载失败（全部 CDN 不可达），点击「重新加载」重试';
      return;
    }
    const Ctor = getSpineCtor();
    if (!Ctor) return;
    // runtime 就绪后才填充层状态（失败时保持空数组，供验收快速判定）
    await layersApi.initLayers(entry, Ctor);
    // 默认开启合并渲染（生产 initSpineSceneViewer 同款单画布方案，为正确呈现基准）
    merged.enable(entry, paused.value);
  } catch (e) {
    loadError.value = String(e);
  }
}

function selectScene(key: string): void {
  if (!key || key === sceneKey.value) return;
  sceneKey.value = key;
  void router.replace({ query: { ...route.query, scene: key } });
  void loadScene(key);
}

/* ─── 播放控制：暂停/恢复（两种渲染模式通用） ─── */

/** 显式设置暂停状态（单选组） */
function setPaused(on: boolean): void {
  if (paused.value === on) return;
  togglePause();
}

function togglePause(): void {
  paused.value = !paused.value;
  if (mergedOn.value) {
    merged.setPaused(paused.value);
    return;
  }
  layersApi.setPausedAll(paused.value);
}

/* ─── PNG 导出：合并模式直接导出画布（单层模式无导出） ─── */

function exportPng(): void {
  try {
    const canvas = merged.canvas(); // 管线 preserveDrawingBuffer=true，像素稳定可读
    if (canvas) downloadCanvas(canvas, `spine-${sceneKey.value}-merged.png`);
  } catch (e) {
    console.warn('[debug-spine] PNG 导出失败:', e);
  }
}

/* ─── 一键验收：编排在 use-kv-acceptance.ts，经 Bridge 注入场景控制与状态投影 ─── */

const bridge: AcceptBridge = {
  getKey: () => sceneKey.value,
  setSceneKey(key) {
    sceneKey.value = key;
    void router.replace({ query: { ...route.query, scene: key } });
  },
  loadScene: (key) => loadScene(key),
  epoch: () => sceneEpoch,
  loadKeys: async () => {
    const keys = await loadSpineSceneKeys();
    sceneKeys.value = keys; // 工具条下拉共用同一数据源
    return keys;
  },
  settled: () => layers.value.length > 0
    && layers.value.every((l) => l.status !== 'loading')
    && (mergedReady.value || !!mergedError.value),
  failFast: () => layers.value.length === 0 && !!loadError.value,
  snapshot: (key) => ({
    key,
    loadError: loadError.value,
    layers: layers.value.map((l) => ({
      status: l.status,
      error: l.error,
      label: l.label,
      loadMs: l.loadMs,
    })),
    mergedReady: mergedReady.value,
    mergedError: mergedError.value,
    missingKeys: merged.missingKeys.value,
  }),
  mergedCanvas: () => merged.canvas(),
};

const accept = useKvAcceptance(bridge);
const accepting = accept.accepting;
const acceptProgress = accept.progress;
const acceptReport = accept.report;
const acceptError = accept.error;
const reacceptingKey = accept.reacceptingKey;
const runAcceptance = accept.run;
const cancelAcceptance = accept.cancel;
/** 报告行「重验」：仅重跑该场景，结束后停留在该场景（不强制恢复） */
const reacceptScene = accept.reaccept;

/* ─── 验收报告导出：文本复制 + JSON 下载（剪贴板/Blob 工具在 debug/report.ts） ─── */

async function copyReport(): Promise<void> {
  const ok = await copyText(accept.reportText());
  if (ok) app.toast('success', '验收报告已复制');
  else app.toast('error', '报告复制失败');
}

function downloadReportJson(): void {
  try {
    downloadJson(
      accept.reportJsonPayload(),
      `kv-acceptance-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`,
    );
    app.toast('success', '验收报告 JSON 已下载');
  } catch (e) {
    console.warn('[debug-spine] 报告下载失败:', e);
    app.toast('error', '报告下载失败');
  }
}

/** 显式设置渲染模式（单选组：合并渲染 / 单层模式） */
function setMerged(on: boolean): void {
  merged.set(on, paused.value);
}

onMounted(async () => {
  // 场景键列表（下拉选择用；失败不影响当前场景渲染）
  void bridge.loadKeys().catch(() => undefined);
  await loadScene(sceneKey.value);
});

// 响应地址栏 / 外部导航的 ?scene= 变化（同一路由复用 / 手改 URL 均生效；验收期间场景被抢占时由 epoch 令牌中止轮询）
watch(
  () => route.query.scene,
  (v) => {
    const k = typeof v === 'string' && v ? v : 'home-bg';
    if (k !== sceneKey.value) selectScene(k);
  },
);

onBeforeUnmount(() => {
  accept.markDisposed(); // 验收轮询检测到卸载即中止，避免旧循环在组件销毁后继续跑
  merged.dispose(); // 合并渲染的 rAF 循环与 WebGL 上下文必须在此释放（否则离开页面后持续泄漏）
  layersApi.disposeAll();
});
</script>

<template>
  <div class="nk-spine-debug">
    <header class="nk-spine-debug__head">
      <p class="nk-spine-debug__kicker">KV SCENE ACCEPTANCE // {{ sceneKey.toUpperCase() }}</p>
      <h1>KV 场景验收台</h1>
      <p class="nk-spine-debug__desc">
        每版本官网抓取的 KV 场景在此验收：一键验收全部场景（逐层加载 + 单画布合并渲染 + 黑块检测）→ 导出 PASS/FAIL 报告；单层模式供逐层排查。
      </p>
      <!-- 状态栏：只读状态（层 / 视口 / GL 配额 / 渲染模式），与操作按钮分离 -->
      <div class="nk-spine-debug__statusbar">
        <span class="nk-spine-debug__chip" :class="summary.startsWith('READY') ? 'is-ok' : summary.startsWith('FAIL') ? 'is-fail' : 'is-loading'">{{ summary }}</span>
        <span class="nk-spine-debug__chip">{{ viewportText || 'viewport —' }}</span>
        <span class="nk-spine-debug__chip" :class="glTotal >= GL_WARN_AT ? 'is-fail' : ''" title="活跃 WebGL 上下文数（浏览器上限约 16）">GL {{ glTotal }}/16</span>
        <span class="nk-spine-debug__chip" :class="mergedOn ? 'is-ok' : ''">模式 {{ mergedOn ? '合并' : '单层' }}</span>
      </div>
      <!-- 工具条：按功能分组（场景 / 渲染 / 验收），主任务「一键验收」独立于实验性操作 -->
      <div class="nk-spine-debug__toolbar">
        <div class="nk-spine-debug__group">
          <span class="nk-spine-debug__group-label">场景</span>
          <select class="nk-spine-debug__select" :value="sceneKey" aria-label="选择场景" :disabled="accepting" @change="selectScene(($event.target as HTMLSelectElement).value)">
            <option v-for="key in (sceneKeys.includes(sceneKey) ? sceneKeys : [sceneKey, ...sceneKeys])" :key="key" :value="key">{{ key }}</option>
          </select>
          <button type="button" class="nk-spine-debug__btn" :disabled="accepting" @click="loadScene(sceneKey)">重新加载</button>
        </div>
        <div class="nk-spine-debug__group">
          <span class="nk-spine-debug__group-label">渲染</span>
          <div class="nk-spine-debug__seg" role="radiogroup" aria-label="渲染模式">
            <button type="button" class="nk-spine-debug__seg-btn" role="radio" :aria-checked="mergedOn" :class="{ 'is-active': mergedOn }" :disabled="accepting" @click="setMerged(true)">合并渲染</button>
            <button type="button" class="nk-spine-debug__seg-btn" role="radio" :aria-checked="!mergedOn" :class="{ 'is-active': !mergedOn }" :disabled="accepting" @click="setMerged(false)">单层模式</button>
          </div>
          <button v-if="mergedOn" type="button" class="nk-spine-debug__btn" :disabled="accepting" @click="exportPng">导出 PNG</button>
          <div class="nk-spine-debug__seg" role="radiogroup" aria-label="播放状态">
            <button type="button" class="nk-spine-debug__seg-btn" role="radio" :aria-checked="!paused" :class="{ 'is-active': !paused }" :disabled="accepting" @click="setPaused(false)">播放</button>
            <button type="button" class="nk-spine-debug__seg-btn" role="radio" :aria-checked="paused" :class="{ 'is-active': paused }" :disabled="accepting" @click="setPaused(true)">暂停</button>
          </div>
        </div>
        <div class="nk-spine-debug__group is-accept">
          <span class="nk-spine-debug__group-label">验收</span>
          <button type="button" class="nk-spine-debug__btn is-primary" :disabled="accepting" @click="runAcceptance">一键验收</button>
          <span v-if="accepting" class="nk-spine-debug__chip is-loading">{{ acceptProgress || '验收中…' }}</span>
          <button v-if="accepting" type="button" class="nk-spine-debug__btn is-danger" @click="cancelAcceptance">中止</button>
        </div>
      </div>
      <p v-if="loadError" class="nk-spine-debug__error" role="alert">{{ loadError }}</p>
    </header>

    <!-- 验收报告：一键验收完成后展示，可复制文本 / 下载 JSON -->
    <section v-if="acceptReport.length > 0 || acceptError" class="nk-spine-debug__report">
      <header class="nk-spine-debug__report-head">
        <span class="nk-spine-debug__num">RPT</span>
        <span class="nk-spine-debug__label">验收报告 · spine-player {{ SPINE_RUNTIME_VERSION }}</span>
        <span v-if="acceptReport.length > 0" class="nk-spine-debug__chip" :class="reportPass === acceptReport.length ? 'is-ok' : 'is-fail'">PASS {{ reportPass }}/{{ acceptReport.length }}</span>
        <div class="nk-spine-debug__bulk">
          <button type="button" class="nk-spine-debug__btn" :disabled="acceptReport.length === 0" @click="copyReport">复制文本</button>
          <button type="button" class="nk-spine-debug__btn" :disabled="acceptReport.length === 0" @click="downloadReportJson">下载 JSON</button>
        </div>
      </header>
      <p v-if="acceptError" class="nk-spine-debug__error" role="alert">{{ acceptError }}</p>
      <table v-if="acceptReport.length > 0" class="nk-spine-debug__report-table">
        <thead>
          <tr><th>判定</th><th>场景</th><th>层</th><th>合并</th><th>近黑占比</th><th>耗时</th><th>原因</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in acceptReport" :key="r.key">
            <td><span class="nk-spine-debug__badge" :class="r.verdict === 'PASS' ? 'is-ok' : 'is-fail'">{{ r.verdict }}</span></td>
            <td class="nk-spine-debug__report-key">{{ r.key }}</td>
            <td>{{ r.layerOk }}/{{ r.layerTotal }}</td>
            <td>{{ r.mergedOk ? 'OK' : 'FAIL' }}</td>
            <td><span class="nk-spine-debug__badge" :class="blackClass(r.nearBlackPct)">{{ r.nearBlackPct === null ? '-' : r.nearBlackPct.toFixed(2) + '%' }}</span></td>
            <td>{{ (r.durationMs / 1000).toFixed(1) }}s</td>
            <td class="nk-spine-debug__report-reason">{{ r.reason || '—' }}</td>
            <td><button type="button" class="nk-spine-debug__btn" :disabled="reacceptingKey === r.key" @click="reacceptScene(r.key)">{{ reacceptingKey === r.key ? '验中…' : '重验' }}</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="mergedOn" class="nk-spine-debug__merged">
      <header class="nk-spine-debug__merged-head">
        <span class="nk-spine-debug__num">ALL</span>
        <span class="nk-spine-debug__label">单画布合并渲染（官网同款：主背景先画铺满 → 混合 dst 为真实画面）</span>
        <div class="nk-spine-debug__states">
          <span class="nk-spine-debug__badge" :class="mergedReady ? 'is-ok' : mergedError ? 'is-fail' : 'is-loading'">{{ mergedReady ? 'OK' : mergedError ? 'FAIL' : '加载中' }}</span>
        </div>
      </header>
      <div :ref="(el) => mergedRef(el)" class="nk-spine-debug__merged-stage"></div>
      <p v-if="mergedError" class="nk-spine-debug__card-err" role="alert">{{ mergedError }}</p>
    </section>
    <div v-show="!mergedOn" class="nk-spine-debug__grid">
      <section
        v-for="st in layers"
        :key="st.idx"
        class="nk-spine-debug__card"
        :class="`is-${st.status}`"
      >
        <header class="nk-spine-debug__card-head">
          <span class="nk-spine-debug__num">{{ String(st.idx + 1).padStart(2, '0') }}</span>
          <span class="nk-spine-debug__label">{{ st.label }}</span>
          <div class="nk-spine-debug__states">
            <span v-if="st.status === 'ok' && st.loadMs > 0" class="nk-spine-debug__state is-off">{{ st.loadMs }}ms</span>
            <span class="nk-spine-debug__badge" :class="`is-${st.status}`">{{ badgeText(st) }}</span>
          </div>
        </header>
        <div :ref="(el) => setLayerEl(st.idx, el)" class="nk-spine-debug__stage"></div>
        <p v-if="st.error" class="nk-spine-debug__card-err" role="alert">{{ st.error }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ─── 页面骨架：OLED 深色控制台风格，左侧避让导航条（平板 72 / 桌面 88） ─── */
.nk-spine-debug {
  padding: 24px;
  font-family: var(--font-body);
  color: var(--text);
  overflow-x: auto;
}
@media (min-width: 768px) {
  .nk-spine-debug { margin-left: 72px; }
}
@media (min-width: 1024px) {
  .nk-spine-debug { margin-left: 88px; }
}

/* ─── 头部：HUD 引导行 + 标题 + 说明 + 工具栏 ─── */
.nk-spine-debug__head { max-width: 1480px; margin-bottom: 20px; }
.nk-spine-debug__kicker {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--primary);
  text-transform: uppercase;
}
.nk-spine-debug__head h1 {
  margin: 0 0 6px;
  font-family: var(--font-hud);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.nk-spine-debug__desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.7;
  opacity: 0.72;
}
/* 状态栏：只读状态（层 / 视口 / GL 配额 / 渲染模式），与操作按钮分离 */
.nk-spine-debug__statusbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 0 2px;
}
.nk-spine-debug__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 10px 0;
  padding: 10px 14px;
  border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg) 55%, transparent);
}
/* 工具条分组：场景 / 渲染 / 验收（组间分隔线建立视觉层级） */
.nk-spine-debug__group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-left: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
}
.nk-spine-debug__group:first-child { padding-left: 0; border-left: none; }
.nk-spine-debug__group.is-accept { margin-left: auto; }
.nk-spine-debug__group-label {
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--text3);
  text-transform: uppercase;
}
.nk-spine-debug__chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
}
.nk-spine-debug__chip.is-ok { color: #b7f2bd; border-color: rgba(127, 224, 138, 0.45); background: rgba(127, 224, 138, 0.12); }
.nk-spine-debug__chip.is-fail { color: #ffb3b3; border-color: rgba(229, 72, 77, 0.5); background: rgba(229, 72, 77, 0.14); }
.nk-spine-debug__chip.is-loading { color: #ffd9a3; border-color: rgba(245, 166, 35, 0.45); background: rgba(245, 166, 35, 0.1); }
.nk-spine-debug__bulk { display: flex; flex-wrap: wrap; gap: 8px; }
/* 渲染模式单选组（分段控件）：合并渲染 / 单层模式互斥选中 */
.nk-spine-debug__seg {
  display: inline-flex;
  border: 1px solid color-mix(in srgb, var(--text) 30%, transparent);
  border-radius: 6px;
  overflow: hidden;
}
.nk-spine-debug__seg-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.nk-spine-debug__seg-btn + .nk-spine-debug__seg-btn { border-left: 1px solid color-mix(in srgb, var(--text) 22%, transparent); }
.nk-spine-debug__seg-btn:hover { color: var(--text); background: color-mix(in srgb, var(--text) 8%, transparent); }
.nk-spine-debug__seg-btn.is-active { color: var(--primary); background: color-mix(in srgb, var(--primary) 14%, transparent); }
.nk-spine-debug__seg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.nk-spine-debug__seg-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-debug__btn.is-primary { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 18%, transparent); color: var(--primary); font-weight: 600; }
.nk-spine-debug__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.nk-spine-debug__btn.is-danger { border-color: rgba(229, 72, 77, 0.5); color: #ffb3b3; }

/* ─── 验收报告：头部汇总 + 明细表（等宽代码风） ─── */
.nk-spine-debug__report {
  max-width: 1480px;
  margin-bottom: 20px;
  border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
  border-radius: 10px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 60%, transparent);
}
.nk-spine-debug__report-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 5%, transparent);
}
.nk-spine-debug__report-head .nk-spine-debug__label { flex: 1; }
.nk-spine-debug__report-table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
.nk-spine-debug__report-table th,
.nk-spine-debug__report-table td {
  padding: 6px 10px;
  text-align: left;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
  white-space: nowrap;
}
.nk-spine-debug__report-table th {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  background: color-mix(in srgb, var(--text) 4%, transparent);
}
.nk-spine-debug__report-key { font-weight: 600; }
.nk-spine-debug__report-reason {
  max-width: 340px;
  color: var(--text3);
  white-space: normal;
  word-break: break-all;
}

/* ─── 场景/动画下拉：代码风等宽，贴合深色控制台 ─── */
.nk-spine-debug__select {
  padding: 3px 8px;
  max-width: 180px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--text);
  background: color-mix(in srgb, var(--bg) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--text) 24%, transparent);
  border-radius: 6px;
  cursor: pointer;
}
.nk-spine-debug__select:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
.nk-spine-debug__select:disabled { opacity: 0.5; cursor: not-allowed; }

/* ─── 错误（就近展示 + 读屏播报） ─── */
.nk-spine-debug__error {
  margin: 10px 0 0;
  color: #ff6b6b;
  font-size: 13px;
  line-height: 1.6;
}

/* ─── 合并渲染区（单画布多骨架） ─── */
.nk-spine-debug__merged {
  border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
  border-radius: 10px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  max-width: 1000px;
}
.nk-spine-debug__merged-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 5%, transparent);
}
.nk-spine-debug__merged-stage {
  width: 100%;
  background:
    linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(19, 26, 46, 0.9) 50%, rgba(10, 15, 30, 0.9) 100%),
    repeating-conic-gradient(#151d33 0% 25%, #0d1326 0% 50%) 0 0 / 24px 24px;
}

/* ─── 层卡片网格 ─── */
.nk-spine-debug__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 16px;
  padding-top: 4px;
}
.nk-spine-debug__card {
  border: 1px solid color-mix(in srgb, var(--text) 15%, transparent);
  border-radius: 10px;
  overflow: hidden;
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.nk-spine-debug__card:hover { border-color: color-mix(in srgb, var(--text) 28%, transparent); }
.nk-spine-debug__card.is-fail { border-color: rgba(229, 72, 77, 0.45); }

.nk-spine-debug__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  background: color-mix(in srgb, var(--text) 5%, transparent);
}
.nk-spine-debug__num {
  padding: 1px 7px;
  border-radius: 5px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--text2);
  background: color-mix(in srgb, var(--text) 12%, transparent);
}
.nk-spine-debug__label {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 右上角状态组：加载耗时徽章 + 就绪徽章 */
.nk-spine-debug__states {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: none;
  flex-wrap: wrap;
}
.nk-spine-debug__state {
  padding: 2px 8px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.nk-spine-debug__state.is-off { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-debug__badge {
  padding: 2px 9px;
  border-radius: 999px;
  font-family: var(--font-hud);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.nk-spine-debug__badge.is-ok { color: #b7f2bd; background: rgba(127, 224, 138, 0.14); border: 1px solid rgba(127, 224, 138, 0.4); }
.nk-spine-debug__badge.is-fail { color: #ffb3b3; background: rgba(229, 72, 77, 0.16); border: 1px solid rgba(229, 72, 77, 0.5); }
.nk-spine-debug__badge.is-loading { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.4); }
.nk-spine-debug__badge.is-warn { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
.nk-spine-debug__badge.is-off { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }

/* 固定舞台尺寸：实例化前容器即有此尺寸 → canvas buffer 比例恒等于 viewport 比例（规避半屏渲染陷阱） */
.nk-spine-debug__stage {
  width: 480px;
  height: 270px;
  background:
    linear-gradient(135deg, rgba(10, 15, 30, 0.9) 0%, rgba(19, 26, 46, 0.9) 50%, rgba(10, 15, 30, 0.9) 100%),
    repeating-conic-gradient(#151d33 0% 25%, #0d1326 0% 50%) 0 0 / 24px 24px;
}
.nk-spine-debug__card-err {
  margin: 0;
  padding: 8px 10px;
  color: #ff9c9c;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  line-height: 1.6;
  word-break: break-all;
  background: rgba(229, 72, 77, 0.08);
}

.nk-spine-debug__btn {
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
.nk-spine-debug__btn:hover { border-color: color-mix(in srgb, var(--text) 55%, transparent); }
.nk-spine-debug__btn:active { background: color-mix(in srgb, var(--text) 14%, transparent); }
.nk-spine-debug__btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }

/* ─── 移动端：单列 + 舞台按比例缩放（16:9，实例化前尺寸即确定，不触发 buffer 比例错位） ─── */
@media (max-width: 560px) {
  .nk-spine-debug { padding: 16px 12px; }
  .nk-spine-debug__grid { grid-template-columns: 1fr; }
  .nk-spine-debug__stage { width: 100%; height: auto; aspect-ratio: 16 / 9; }
  .nk-spine-debug__report { overflow-x: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .nk-spine-debug__btn { transition: none; }
  .nk-spine-debug__card { transition: none; }
}
</style>
