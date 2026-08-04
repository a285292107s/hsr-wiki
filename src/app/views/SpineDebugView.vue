<script setup lang="ts">
/**
 * KV 场景验收台（长期保留，路由 /debug/spine?scene=home-bg）：
 * 游戏每个版本的 KV 场景（official-scene，主背景 + 多层角色群像）资源从官网重新抓取写入
 * spine-manifest.json 后，在本页验收其能否正常渲染：
 * - 「一键验收」顺序加载全部场景：逐层加载状态 + 单画布合并渲染（生产 initSpineSceneViewer 同款）
 *   + 黑块自动检测（近黑不透明像素占比），生成可导出的 PASS/FAIL 报告；
 * - 单层模式保留作逐层诊断：每层独立渲染在透明画布上，混合 slot 对透明 dst 混合
 *   会产生暗色不透明块（透明画布固有现象，非资源问题）。
 * 渲染参数与生产完全一致：同一固定 viewport + pad 0 + rawDataURIs 纹理重映射。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loadSpineSceneKeys, resolveSpine } from '../../services/api';
import type { SpineSceneEntry } from '../../services/types';
import {
  BLEND_NAMES, DebugDrawOrderSlot, SkelLike, SpinePlayerCtor, SpinePlayerInstance,
  SPINE_RUNTIME_VERSION,
  applyBlendLastOn, applyBlendsHiddenOn, applyForceNormalOn, buildOfficialConfig,
  disposePlayer, getSpineCtor, loadSpineRuntime, pickAnimName,
} from '../debug/spine-shared';
/** 单帧步进时长（30fps 一帧） */
const STEP_DELTA = 1 / 30;
/** 浏览器活跃 WebGL 上下文上限约 16，达到此值预警 */
const GL_WARN_AT = 12;

/* ─── 验收参数：黑块检测阈值（近黑不透明像素占比 %）与单场景超时 ─── */
const NEAR_BLACK_WARN = 3;   // ≥3% 提示疑似暗块（夜景底色波动区间）
const NEAR_BLACK_FAIL = 6;   // ≥6% 判 FAIL（实测：正常合并渲染 ≈1.4%，透明画布黑块 ≈9%）
const ACCEPT_SCENE_TIMEOUT_MS = 90_000;

interface AcceptItem {
  key: string;
  layerTotal: number;
  layerOk: number;
  failedLayers: string[];
  mergedOk: boolean;
  loadMs: number;
  nearBlackPct: number | null;
  blendSlots: number;
  verdict: 'PASS' | 'FAIL';
  reason: string;
  durationMs: number;
}

interface LayerState {
  idx: number;
  label: string;
  status: 'loading' | 'ok' | 'fail';
  error: string;
  premultiplied: boolean;
  blendsHidden: boolean;
  blendInfo: string;
  forceNormal: boolean;
  savedBlend: Map<number, number>;
  blendLast: boolean;
  savedDrawOrder: DebugDrawOrderSlot[] | null;
  anims: string[];
  currentAnim: string;
  loadMs: number;
}

const route = useRoute();
const router = useRouter();

const sceneKey = ref(typeof route.query.scene === 'string' && route.query.scene ? route.query.scene : 'home-bg');
const sceneKeys = ref<string[]>([]);
const viewportText = ref('');
const loadError = ref('');
const layers = ref<LayerState[]>([]);
const paused = ref(false);
/** 存活的单层 player 数（= 占用的 WebGL 上下文数） */
const playerAlive = ref(0);
const els = new Map<number, HTMLElement>();

let players: (SpinePlayerInstance | undefined)[] = [];
/* 重建用：记录最近一次场景条目（保持与创建时一致） */
let lastEntry: { viewport: SpineSceneEntry['viewport']; layers: SpineSceneEntry['layers'] } | null = null;

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

function setLayerEl(idx: number, el: unknown): void {
  if (el instanceof HTMLElement) els.set(idx, el);
}

function badgeText(st: LayerState): string {
  return st.status === 'ok' ? 'OK' : st.status === 'fail' ? 'FAIL' : '加载中';
}

/* ─── 场景加载 / 释放 ─── */

function disposeAllPlayers(): void {
  for (const p of players) {
    if (p) disposePlayer(p);
  }
  players = [];
  playerAlive.value = 0;
}

/** 加载指定场景：先释放旧资源，再逐层创建 player */
async function loadScene(key: string): Promise<void> {
  disposeAllPlayers();
  disposeMerged();
  mergedOn.value = false;
  paused.value = false;
  layers.value = [];
  loadError.value = '';
  viewportText.value = '';
  lastEntry = null;
  try {
    const entry = await resolveSpine(key);
    if (sceneKey.value !== key) return; // 已切换到其他场景，丢弃过期结果
    if (!entry || entry.kind !== 'official-scene') {
      loadError.value = `未找到 ${key} 场景条目（kind 非 official-scene）`;
      return;
    }
    viewportText.value = `viewport ${entry.viewport.width}×${entry.viewport.height} @ (${entry.viewport.x}, ${entry.viewport.y})`;
    lastEntry = entry;
    layers.value = entry.layers.map((layer, idx) => {
      const texKey = Object.keys(layer.textures)[0] ?? '';
      // 默认预乘 OFF：官网 atlas 无 pma 字段且像素取证为直通 alpha（半透明像素 RGB>A 占 40%），
      // 与枢纽页生产配置一致；ON 仅作为对照实验手动开启
      return { idx, label: texKey.replace(/\.png$/i, ''), status: 'loading' as const, error: '', premultiplied: false, blendsHidden: false, blendInfo: '', forceNormal: false, savedBlend: new Map(), blendLast: false, savedDrawOrder: null, anims: [], currentAnim: '', loadMs: 0 };
    });
    await nextTick();
    const ok = await loadSpineRuntime();
    if (sceneKey.value !== key) return;
    if (!ok) {
      loadError.value = 'spine-player 运行时加载失败（全部 CDN 不可达），点击「重新加载」重试';
      return;
    }
    const Ctor = getSpineCtor();
    if (!Ctor) return;
    for (const st of layers.value) {
      createPlayer(st, entry, Ctor);
    }
    // 默认开启合并渲染（生产 initSpineSceneViewer 同款单画布方案，为正确呈现基准）
    mergedOn.value = true;
    void nextTick().then(() => void mountMerged());
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

/** 为某层创建 SpinePlayer（premultiplied 由 st.premultiplied 控制） */
function createPlayer(st: LayerState, entry: { viewport: SpineSceneEntry['viewport']; layers: SpineSceneEntry['layers'] }, Ctor: SpinePlayerCtor): void {
  const el = els.get(st.idx);
  const layer = entry.layers[st.idx];
  if (!el || !layer) return;
  const t0 = performance.now();
  const player = new Ctor(el, {
    ...buildOfficialConfig(layer),
    alpha: true,
    backgroundColor: '00000000',
    premultipliedAlpha: st.premultiplied,
    viewport: { ...entry.viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
    showControls: false,
    showLoading: false,
    success(p) {
      st.loadMs = Math.round(performance.now() - t0);
      st.status = 'ok';
      const names = ((p.skeleton && p.skeleton.data && p.skeleton.data.animations) || []).map((a) => a.name);
      st.anims = names;
      const chosen = pickAnimName(names);
      st.currentAnim = chosen;
      if (chosen) {
        try {
          p.setAnimation(chosen);
          p.play();
        } catch { /* 静默 */ }
      }
      // 运行时实际解析的混合模式（可读名）
      st.blendInfo = (p.skeleton?.slots || [])
        .filter((s) => s.data.blendMode !== 0)
        .map((s) => `S${s.data.index}:${BLEND_NAMES[s.data.blendMode] ?? s.data.blendMode}`)
        .join(' ');
      if (st.blendsHidden && p.skeleton) applyBlendsHiddenOn(p.skeleton, true);
    },
    error(_p, msg) {
      st.status = 'fail';
      st.error = String(msg);
    },
  });
  players[st.idx] = player;
  playerAlive.value++;
}

function onAnimChange(st: LayerState, name: string): void {
  st.currentAnim = name;
  const p = players[st.idx];
  if (!p) return;
  try {
    p.setAnimation(name);
    p.play();
  } catch { /* 静默 */ }
}

function togglePremultiplied(idx: number): void {
  const st = layers.value.find((l) => l.idx === idx);
  if (!st) return;
  st.premultiplied = !st.premultiplied;
  st.status = 'loading';
  st.error = '';
  const old = players[idx];
  if (old) {
    disposePlayer(old);
    players[idx] = undefined;
    playerAlive.value--;
  }
  const Ctor = getSpineCtor();
  if (!Ctor) return;
  void nextTick().then(() => {
    if (lastEntry) createPlayer(st, lastEntry, Ctor);
  });
}

function toggleBlends(idx: number): void {
  const st = layers.value.find((l) => l.idx === idx);
  const p = players[idx];
  if (!st || !p || !p.skeleton) return;
  st.blendsHidden = !st.blendsHidden;
  applyBlendsHiddenOn(p.skeleton, st.blendsHidden);
}

/** 批量隐藏/恢复全部层的打光层（对照实验） */
function toggleAllBlends(hidden: boolean): void {
  for (const st of layers.value) {
    st.blendsHidden = hidden;
    const p = players[st.idx];
    if (p && p.skeleton) applyBlendsHiddenOn(p.skeleton, hidden);
  }
}

function toggleForceNormal(idx: number): void {
  const st = layers.value.find((l) => l.idx === idx);
  const p = players[idx];
  if (!st || !p || !p.skeleton) return;
  st.forceNormal = !st.forceNormal;
  applyForceNormalOn(p.skeleton, st.forceNormal, st.savedBlend);
}

function toggleBlendLast(idx: number): void {
  const st = layers.value.find((l) => l.idx === idx);
  const p = players[idx];
  if (!st || !p || !p.skeleton) return;
  st.blendLast = !st.blendLast;
  applyBlendLastOn(p.skeleton, st.blendLast, st);
}

/* ─── 播放控制：暂停/恢复 + 单帧步进（两种渲染模式通用） ─── */

function togglePause(): void {
  paused.value = !paused.value;
  if (mergedOn.value) return; // 合并渲染循环每帧读取 paused
  for (const p of players) {
    if (!p) continue;
    try {
      if (paused.value) p.pause();
      else p.resume();
    } catch { /* 静默 */ }
  }
}

function stepFrame(): void {
  if (!paused.value) togglePause();
  if (mergedOn.value) {
    mergedStepPending++;
    return;
  }
  for (const p of players) {
    if (!p || !p.skeleton) continue;
    try {
      p.skeleton.update(STEP_DELTA);
      p.requestFrame();
    } catch { /* 静默 */ }
  }
}

/* ─── PNG 导出：合并模式直接导出画布；单层模式按叠加顺序合成全层拼合图 ─── */

function downloadCanvas(canvas: HTMLCanvasElement, name: string): void {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = name;
  a.click();
}

function exportPng(): void {
  try {
    if (mergedOn.value) {
      const canvas = mergedRef.value && mergedRef.value.querySelector('canvas');
      if (canvas) downloadCanvas(canvas, `spine-${sceneKey.value}-merged.png`);
      return;
    }
    // 单层画布未开 preserveDrawingBuffer，尽力合成（刚渲染完的帧通常可取到像素）
    const out = document.createElement('canvas');
    out.width = 960;
    out.height = 540;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    for (const st of layers.value) {
      const host = els.get(st.idx);
      const c = host && host.querySelector('canvas');
      if (c) ctx.drawImage(c, 0, 0, out.width, out.height);
    }
    downloadCanvas(out, `spine-${sceneKey.value}-composite.png`);
  } catch (e) {
    console.warn('[debug-spine] PNG 导出失败:', e);
  }
}

/* ─── 一键验收：顺序跑全部 official-scene（逐层 + 合并渲染 + 黑块检测）生成报告 ─── */

const accepting = ref(false);
const acceptProgress = ref('');
const acceptReport = ref<AcceptItem[]>([]);
const acceptError = ref('');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** 黑块检测：近黑不透明像素占比（画布降采样到 ≤320px 宽采样，合并画布 preserveDrawingBuffer=true 读回可靠） */
function sampleNearBlackPct(canvas: HTMLCanvasElement): number {
  const w = 320;
  const h = Math.max(1, Math.round((canvas.height / canvas.width) * w));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return 0;
  ctx.drawImage(canvas, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let nearBlack = 0;
  const total = w * h;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < 15 && d[i + 1] < 15 && d[i + 2] < 15 && d[i + 3] > 200) nearBlack++;
  }
  return (nearBlack / total) * 100;
}

/** 验收单个场景：加载 → 等全部层与合并渲染结算 → 采样判定 → 返回验收项 */
async function acceptScene(key: string): Promise<AcceptItem> {
  const t0 = performance.now();
  sceneKey.value = key;
  void router.replace({ query: { scene: key } });
  await loadScene(key);
  const deadline = t0 + ACCEPT_SCENE_TIMEOUT_MS;
  while (performance.now() < deadline) {
    // 场景条目本身加载失败（非 official-scene / 运行时不可达）时无需等待，直接判定
    if (layers.value.length === 0 && loadError.value) break;
    const settled = layers.value.length > 0
      && layers.value.every((l) => l.status !== 'loading')
      && (mergedReady.value || !!mergedError.value);
    if (settled) break;
    await sleep(300);
  }
  await sleep(500); // 多等一拍确保合并画布已绘制首帧（像素采样需要）
  const mergedCanvas = mergedRef.value && mergedRef.value.querySelector('canvas');
  const nearBlackPct = mergedCanvas && mergedReady.value ? sampleNearBlackPct(mergedCanvas) : null;
  const failedLayers = layers.value.filter((l) => l.status === 'fail').map((l) => `${l.label}: ${l.error}`);
  const layerOk = layers.value.filter((l) => l.status === 'ok').length;
  const reasons: string[] = [];
  if (layers.value.length === 0) reasons.push(loadError.value || '场景条目加载失败');
  if (failedLayers.length > 0) reasons.push(`${failedLayers.length} 层加载失败`);
  if (!mergedReady.value) reasons.push(`合并渲染失败: ${mergedError.value || '超时'}`);
  if (nearBlackPct !== null && nearBlackPct >= NEAR_BLACK_FAIL) {
    reasons.push(`疑似黑块：近黑不透明像素 ${nearBlackPct.toFixed(2)}% ≥ ${NEAR_BLACK_FAIL}%`);
  }
  return {
    key,
    layerTotal: layers.value.length,
    layerOk,
    failedLayers,
    mergedOk: mergedReady.value,
    loadMs: layers.value.reduce((s, l) => s + l.loadMs, 0),
    nearBlackPct,
    blendSlots: layers.value.reduce((s, l) => s + (l.blendInfo ? l.blendInfo.split(' ').length : 0), 0),
    verdict: reasons.length > 0 ? 'FAIL' : 'PASS',
    reason: reasons.join('；'),
    durationMs: Math.round(performance.now() - t0),
  };
}

/** 一键验收：顺序跑全部场景（每场景结束后释放 WebGL 上下文再进下一个，不超浏览器配额） */
async function runAcceptance(): Promise<void> {
  if (accepting.value) return;
  accepting.value = true;
  acceptReport.value = [];
  acceptError.value = '';
  try {
    const keys = await loadSpineSceneKeys();
    if (keys.length === 0) {
      acceptError.value = 'spine-manifest 中无 official-scene 条目（KV 场景尚未接入）';
      return;
    }
    sceneKeys.value = keys;
    for (let i = 0; i < keys.length; i++) {
      acceptProgress.value = `验收 ${i + 1}/${keys.length} — ${keys[i]}`;
      const item = await acceptScene(keys[i]);
      acceptReport.value = [...acceptReport.value, item];
    }
  } catch (e) {
    acceptError.value = String(e);
  } finally {
    accepting.value = false;
    acceptProgress.value = '';
  }
}

/* ─── 验收报告导出：文本复制 + JSON 下载 ─── */

function buildReportText(): string {
  const total = acceptReport.value.length;
  const lines = [
    `KV 场景验收报告 — ${new Date().toLocaleString()}`,
    `runtime spine-player ${SPINE_RUNTIME_VERSION} | 场景 ${total} | PASS ${reportPass.value}/${total}`,
    ...acceptReport.value.map((r) => [
      `[${r.verdict}] ${r.key}`,
      `层 ${r.layerOk}/${r.layerTotal}`,
      `合并 ${r.mergedOk ? 'OK' : 'FAIL'}`,
      `nearBlack ${r.nearBlackPct === null ? '-' : r.nearBlackPct.toFixed(2) + '%'}`,
      `混合slot ${r.blendSlots}`,
      `耗时 ${r.durationMs}ms`,
      r.reason ? `← ${r.reason}` : '',
    ].filter(Boolean).join('  ')),
  ];
  return lines.join('\n');
}

async function copyReport(): Promise<void> {
  try {
    await navigator.clipboard.writeText(buildReportText());
  } catch (e) {
    console.warn('[debug-spine] 报告复制失败:', e);
  }
}

function downloadReportJson(): void {
  try {
    const blob = new Blob(
      [JSON.stringify({ generatedAt: new Date().toISOString(), runtime: SPINE_RUNTIME_VERSION, items: acceptReport.value }, null, 2)],
      { type: 'application/json' },
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kv-acceptance-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    console.warn('[debug-spine] 报告下载失败:', e);
  }
}

/** nearBlack 徽章配色：≥FAIL 红 / ≥WARN 黄 / 其余绿 */
function blackClass(pct: number | null): string {
  if (pct === null) return 'is-off';
  if (pct >= NEAR_BLACK_FAIL) return 'is-fail';
  if (pct >= NEAR_BLACK_WARN) return 'is-warn';
  return 'is-ok';
}

/* ─── 合并渲染实验：单 canvas 多骨架（官网同款）——主背景先画铺满，所有混合的 dst 都是真实画面 ─── */

const mergedOn = ref(false);
const mergedReady = ref(false);
const mergedError = ref('');
const mergedRef = ref<HTMLElement | null>(null);
const mergedBlendsHidden = ref(false);
const mergedForceNormal = ref(false);
const mergedBlendLast = ref(false);

type MergedSkeleton = SkelLike & { updateWorldTransform(physics: number): void };
interface MergedItem {
  skeleton: MergedSkeleton;
  state: { update(d: number): void; apply(s: unknown): void };
  savedBlend: Map<number, number>;
  savedDrawOrder: DebugDrawOrderSlot[] | null;
}

let mergedCleanup: (() => void) | null = null;
let mergedItems: MergedItem[] = [];
let mergedStepPending = 0;

function disposeMerged(): void {
  if (mergedCleanup) {
    mergedCleanup();
    mergedCleanup = null;
  }
  mergedItems = [];
  mergedReady.value = false;
  mergedError.value = '';
}

function toggleMerged(): void {
  mergedOn.value = !mergedOn.value;
  if (!mergedOn.value) {
    disposeMerged();
    return;
  }
  void nextTick().then(() => {
    void mountMerged();
  });
}

function toggleMergedBlends(): void {
  mergedBlendsHidden.value = !mergedBlendsHidden.value;
  for (const it of mergedItems) applyBlendsHiddenOn(it.skeleton, mergedBlendsHidden.value);
}
function toggleMergedForceNormal(): void {
  mergedForceNormal.value = !mergedForceNormal.value;
  for (const it of mergedItems) applyForceNormalOn(it.skeleton, mergedForceNormal.value, it.savedBlend);
}
function toggleMergedBlendLast(): void {
  mergedBlendLast.value = !mergedBlendLast.value;
  for (const it of mergedItems) applyBlendLastOn(it.skeleton, mergedBlendLast.value, it);
}

/** 单 canvas 顺序渲染全部层（layers 数组顺序 = renderOrder 升序 = 官网绘制顺序） */
async function mountMerged(): Promise<void> {
  const el = mergedRef.value;
  const g = (globalThis as { spine?: unknown }).spine as
    | {
        SceneRenderer: new (c: HTMLCanvasElement, gl: WebGLRenderingContext, tct: boolean) => {
          camera: { position: { set(x: number, y: number, z: number): void }; viewportWidth: number; viewportHeight: number; zoom: number };
          begin(): void;
          end(): void;
          drawSkeleton(s: unknown): void;
          dispose(): void;
        };
        AssetManager: new (gl: WebGLRenderingContext, base: string) => {
          setRawDataURI(path: string, url: string): void;
          loadTextureAtlas(url: string): void;
          loadJson(url: string): void;
          loadAll(): Promise<unknown>;
          get(url: string): unknown;
        };
        SkeletonJson: new (loader: unknown) => { readSkeletonData(json: unknown): unknown };
        AtlasAttachmentLoader: new (atlas: unknown) => unknown;
        Skeleton: new (data: unknown) => unknown;
        Physics: { update: number };
        AnimationState: new (data: unknown) => { update(d: number): void; apply(s: unknown): void; setAnimation(i: number, name: string, loop: boolean): void };
        AnimationStateData: new (data: unknown) => unknown;
      }
    | undefined;
  if (!el || !g || !lastEntry) return;
  disposeMerged();
  mergedBlendsHidden.value = false;
  mergedForceNormal.value = false;
  mergedBlendLast.value = false;
  mergedStepPending = 0;
  const entry = lastEntry;
  const vp = entry.viewport;
  let rafId = 0;
  // 局部完成标记（勿与外部状态混用；cleanup 时置 true 终止 rAF 循环）
  let mergedDone = false;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = 960;
  const H = 540;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  // 宽度自适应收缩（小屏），buffer 比例恒为 16:9
  canvas.style.cssText = 'width:100%;max-width:960px;height:auto;display:block;';
  el.replaceChildren(canvas);

  try {
    // preserveDrawingBuffer: true → PNG 导出可稳定取到像素
    const gl = canvas.getContext('webgl2', { alpha: true, preserveDrawingBuffer: true }) || canvas.getContext('webgl', { alpha: true, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL 不可用');
    const renderer = new g.SceneRenderer(canvas, gl, true);
    // 相机 = viewport（中心对齐 vp 中心；Vector3.set 三参全传，z 缺省会污染 view 矩阵）
    renderer.camera.position.set(vp.x + vp.width / 2, vp.y + vp.height / 2, 0);
    renderer.camera.viewportWidth = vp.width;
    renderer.camera.viewportHeight = vp.height;
    renderer.camera.zoom = 1;

    const manager = new g.AssetManager(gl, '');
    for (const layer of entry.layers) {
      const atlasDir = layer.atlas.slice(0, layer.atlas.lastIndexOf('/') + 1);
      for (const [logical, real] of Object.entries(layer.textures)) {
        manager.setRawDataURI(atlasDir + logical, real);
      }
      manager.loadTextureAtlas(layer.atlas);
      manager.loadJson(layer.json);
    }
    // 4.2.x AssetManager.loadAll 为 Promise 风格（内部 rAF 轮询完成状态），完成后建骨架并启动渲染循环
    void manager
      .loadAll()
      .then(() => {
        if (mergedDone) return;
        const items: MergedItem[] = [];
        try {
          for (const layer of entry.layers) {
            const atlas = manager.get(layer.atlas);
            const json = manager.get(layer.json);
            if (!atlas || !json) throw new Error(`资源缺失: ${layer.atlas}`);
            const data = new g.SkeletonJson(new g.AtlasAttachmentLoader(atlas)).readSkeletonData(json);
            const skeleton = new g.Skeleton(data) as unknown as MergedSkeleton;
            const state = new g.AnimationState(new g.AnimationStateData(data));
            const anims = (data as { animations?: { name: string }[] }).animations || [];
            const chosen = pickAnimName(anims.map((a) => a.name));
            if (chosen) state.setAnimation(0, chosen, true);
            items.push({ skeleton, state, savedBlend: new Map(), savedDrawOrder: null });
          }
        } catch (e) {
          mergedError.value = String(e);
          return;
        }
        mergedItems = items;
        mergedReady.value = true;
        let last = performance.now();
        const frame = (now: number): void => {
          if (mergedDone) return;
          let delta = Math.min((now - last) / 1000, 0.1);
          last = now;
          if (mergedStepPending > 0) {
            delta = STEP_DELTA;
            mergedStepPending = 0;
          } else if (paused.value) {
            delta = 0;
          }
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          renderer.begin();
          for (const it of items) {
            it.state.update(delta);
            it.state.apply(it.skeleton);
            it.skeleton.updateWorldTransform(g.Physics.update);
            renderer.drawSkeleton(it.skeleton);
          }
          renderer.end();
          rafId = requestAnimationFrame(frame);
        };
        rafId = requestAnimationFrame(frame);
      })
      .catch((e: unknown) => {
        mergedError.value = String(e);
      });
    mergedCleanup = () => {
      mergedDone = true;
      cancelAnimationFrame(rafId);
      try {
        renderer.dispose();
        const c = gl.getExtension('WEBGL_lose_context');
        if (c) c.loseContext();
      } catch { /* 静默 */ }
    };
  } catch (e) {
    mergedError.value = String(e);
  }
}

onMounted(async () => {
  // 场景键列表（下拉选择用；失败不影响当前场景渲染）
  void loadSpineSceneKeys().then((keys) => {
    sceneKeys.value = keys;
  });
  await loadScene(sceneKey.value);
});

onBeforeUnmount(() => {
  disposeMerged(); // 合并渲染的 rAF 循环与 WebGL 上下文必须在此释放（否则离开页面后持续泄漏）
  disposeAllPlayers();
});
</script>

<template>
  <div class="nk-spine-debug">
    <header class="nk-spine-debug__head">
      <p class="nk-spine-debug__kicker">KV SCENE ACCEPTANCE // {{ sceneKey.toUpperCase() }}</p>
      <h1>KV 场景验收台</h1>
      <p class="nk-spine-debug__desc">
        每个游戏版本的 KV 场景资源从官网重新抓取写入 spine-manifest.json 后，在此验收其能否正常渲染：
        「一键验收」顺序跑全部场景（逐层加载 + 单画布合并渲染 + 黑块自动检测），生成可导出的 PASS/FAIL 报告。
        默认展示合并渲染（生产 initSpineSceneViewer 同款方案）；单层模式仅供逐层诊断——混合 slot 对透明 dst 混合会产生暗色不透明块，属透明画布固有现象而非资源问题。
      </p>
      <div class="nk-spine-debug__toolbar">
        <div class="nk-spine-debug__chips">
          <select class="nk-spine-debug__select" :value="sceneKey" aria-label="选择场景" @change="selectScene(($event.target as HTMLSelectElement).value)">
            <option v-for="key in (sceneKeys.includes(sceneKey) ? sceneKeys : [sceneKey, ...sceneKeys])" :key="key" :value="key">{{ key }}</option>
          </select>
          <span class="nk-spine-debug__chip">{{ viewportText || 'viewport —' }}</span>
          <span class="nk-spine-debug__chip" :class="summary.startsWith('READY') ? 'is-ok' : summary.startsWith('FAIL') ? 'is-fail' : 'is-loading'">{{ summary }}</span>
          <span class="nk-spine-debug__chip" :class="glTotal >= GL_WARN_AT ? 'is-fail' : ''" title="活跃 WebGL 上下文数（浏览器上限约 16）">GL {{ glTotal }}/16</span>
          <span class="nk-spine-debug__chip" :class="mergedOn ? 'is-ok' : ''">合并 {{ mergedOn ? 'ON' : 'OFF' }}</span>
        </div>
        <div class="nk-spine-debug__bulk">
          <button type="button" class="nk-spine-debug__btn is-primary" :disabled="accepting" @click="runAcceptance">{{ accepting ? (acceptProgress || '验收中…') : '一键验收' }}</button>
          <button type="button" class="nk-spine-debug__btn" @click="loadScene(sceneKey)">重新加载</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="paused" @click="togglePause">{{ paused ? '播放' : '暂停' }}</button>
          <button type="button" class="nk-spine-debug__btn" @click="stepFrame">步进 1/30s</button>
          <button type="button" class="nk-spine-debug__btn" @click="exportPng">导出 PNG</button>
          <button type="button" class="nk-spine-debug__btn" @click="toggleAllBlends(true)">全部隐藏打光</button>
          <button type="button" class="nk-spine-debug__btn" @click="toggleAllBlends(false)">全部显示打光</button>
          <button type="button" class="nk-spine-debug__btn" :class="{ merged: mergedOn }" :aria-pressed="mergedOn" @click="toggleMerged">合并渲染</button>
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
          <tr><th>判定</th><th>场景</th><th>层</th><th>合并</th><th>近黑占比</th><th>混合slot</th><th>耗时</th><th>原因</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in acceptReport" :key="r.key">
            <td><span class="nk-spine-debug__badge" :class="r.verdict === 'PASS' ? 'is-ok' : 'is-fail'">{{ r.verdict }}</span></td>
            <td class="nk-spine-debug__report-key">{{ r.key }}</td>
            <td>{{ r.layerOk }}/{{ r.layerTotal }}</td>
            <td>{{ r.mergedOk ? 'OK' : 'FAIL' }}</td>
            <td><span class="nk-spine-debug__badge" :class="blackClass(r.nearBlackPct)">{{ r.nearBlackPct === null ? '-' : r.nearBlackPct.toFixed(2) + '%' }}</span></td>
            <td>{{ r.blendSlots }}</td>
            <td>{{ (r.durationMs / 1000).toFixed(1) }}s</td>
            <td class="nk-spine-debug__report-reason">{{ r.reason || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="mergedOn" class="nk-spine-debug__merged">
      <header class="nk-spine-debug__merged-head">
        <span class="nk-spine-debug__num">ALL</span>
        <span class="nk-spine-debug__label">单画布合并渲染（官网同款：主背景先画铺满 → 混合 dst 为真实画面）</span>
        <div class="nk-spine-debug__states">
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="mergedBlendsHidden" @click="toggleMergedBlends">打光 {{ mergedBlendsHidden ? '隐藏' : '显示' }}</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="mergedForceNormal" @click="toggleMergedForceNormal">强制normal</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="mergedBlendLast" @click="toggleMergedBlendLast">光效后置</button>
          <span class="nk-spine-debug__badge" :class="mergedReady ? 'is-ok' : mergedError ? 'is-fail' : 'is-loading'">{{ mergedReady ? 'OK' : mergedError ? 'FAIL' : '加载中' }}</span>
        </div>
      </header>
      <div ref="mergedRef" class="nk-spine-debug__merged-stage"></div>
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
          <span v-if="st.blendInfo" class="nk-spine-debug__blend" :title="st.blendInfo">{{ st.blendInfo }}</span>
          <div class="nk-spine-debug__states">
            <span v-if="st.status === 'ok' && st.loadMs > 0" class="nk-spine-debug__state is-off">{{ st.loadMs }}ms</span>
            <span class="nk-spine-debug__state" :class="st.premultiplied ? 'is-on' : 'is-off'">预乘 {{ st.premultiplied ? 'ON' : 'OFF' }}</span>
            <span class="nk-spine-debug__state" :class="st.blendsHidden ? 'is-warn' : 'is-on'">打光 {{ st.blendsHidden ? '隐藏' : '显示' }}</span>
            <span class="nk-spine-debug__state" :class="st.forceNormal ? 'is-warn' : 'is-on'">混合 {{ st.forceNormal ? 'N' : 'S' }}</span>
            <span class="nk-spine-debug__state" :class="st.blendLast ? 'is-on' : 'is-off'">光效 {{ st.blendLast ? '后置' : '原位' }}</span>
            <span class="nk-spine-debug__badge" :class="`is-${st.status}`">{{ badgeText(st) }}</span>
          </div>
        </header>
        <div :ref="(el) => setLayerEl(st.idx, el)" class="nk-spine-debug__stage"></div>
        <p v-if="st.error" class="nk-spine-debug__card-err" role="alert">{{ st.error }}</p>
        <footer class="nk-spine-debug__ctl">
          <select
            v-if="st.anims.length > 1"
            class="nk-spine-debug__select"
            :value="st.currentAnim"
            aria-label="选择动画"
            @change="onAnimChange(st, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="anim in st.anims" :key="anim" :value="anim">{{ anim }}</option>
          </select>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="st.premultiplied" @click="togglePremultiplied(st.idx)">预乘</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="st.blendsHidden" @click="toggleBlends(st.idx)">打光</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="st.forceNormal" @click="toggleForceNormal(st.idx)">强制normal</button>
          <button type="button" class="nk-spine-debug__btn" :aria-pressed="st.blendLast" @click="toggleBlendLast(st.idx)">光效后置</button>
        </footer>
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
.nk-spine-debug__toolbar {
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
.nk-spine-debug__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
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
.nk-spine-debug__btn.merged { border-color: var(--primary); color: var(--primary); }
.nk-spine-debug__btn.is-primary { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 18%, transparent); color: var(--primary); font-weight: 600; }
.nk-spine-debug__btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
/* 运行时解析的混合模式信息（等宽小字，截断超长） */
.nk-spine-debug__blend {
  flex: 1;
  min-width: 0;
  margin-right: 10px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: var(--text3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
/* 右上角状态组：实验参数徽章 + 就绪徽章（预乘/打光状态与 OK 并排） */
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
.nk-spine-debug__state.is-on { color: #b7f2bd; background: rgba(127, 224, 138, 0.14); border: 1px solid rgba(127, 224, 138, 0.4); }
.nk-spine-debug__state.is-off { color: var(--text3); background: color-mix(in srgb, var(--text) 10%, transparent); border: 1px solid color-mix(in srgb, var(--text) 18%, transparent); }
.nk-spine-debug__state.is-warn { color: #ffd9a3; background: rgba(245, 166, 35, 0.1); border: 1px solid rgba(245, 166, 35, 0.45); }
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

/* ─── 控制按钮：纯动作名（状态见卡片右上角徽章） ─── */
.nk-spine-debug__ctl {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
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
