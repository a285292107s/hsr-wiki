import { fetchResourceStatus, fetchText } from '../../services/cache';
import { spineRuntimeFor } from '../../services/api';
import type { SpineResolved, SpineSource } from '../../services/types';
import {
  BLEND_NAMES,
  type SpinePlayerCtor, type SpinePlayerInstance, type SpinePlayerConfig, type SpineRuntimeVersion,
} from '../../spine/types';
import { buildOfficialConfig } from '../../spine/config';
import { disposePlayer, pickAnimName, spawnPlayer } from '../../spine/player';
import { getSpineCtor, loadSpineRuntime } from '../../spine/runtime';
export { analyzePixels, type PixelAnalysis } from './pixels';
import { analyzePixels } from './pixels';

const SAMPLE_FRAMES = 15;

export type AuditKind = 'skel' | 'official' | 'official-scene';
export type AuditStatus = 'pending' | 'running' | 'pass' | 'warn' | 'fail';

export interface AuditResource {
  url: string;
  ok: boolean;
  status: number;
  ms: number;
}
export interface AtlasDiff {
  atlasPages: string[];
  mappedKeys: string[];
  missingInManifest: string[];
  missingInAtlas: string[];
}
export interface FrameSample {
  anim: string;
  layer: number | null;
  visible: number;
  total: number;
  ratio: number;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}
export interface BlendSlotInfo {
  index: number;
  mode: number;
  name: string;
}
export interface AuditMeta {
  animations: string[];
  skins: string[];
  slots: number;
  bones: number;
  attachments: number;
  blendSlots: BlendSlotInfo[];
}
export interface AuditEntry {
  key: string;
  kind: AuditKind;
  source: SpineSource;
  label: string;
  status: AuditStatus;
  checks: string[];
  errors: string[];
  warnings: string[];
  resources: AuditResource[];
  atlasDiffs: { layer: number | null; diff: AtlasDiff }[];
  meta: AuditMeta | null;
  frames: FrameSample[];
  loadMs: number;
  renderError: string;
}

export function createAuditEntry(key: string, kind: AuditKind, label: string, source: SpineSource = 'official'): AuditEntry {
  return {
    key, kind, source, label,
    status: 'pending',
    checks: [],
    errors: [], warnings: [],
    resources: [], atlasDiffs: [],
    meta: null, frames: [],
    loadMs: 0, renderError: '',
  };
}

export function resetAuditEntry(entry: AuditEntry): void {
  entry.status = 'pending';
  entry.checks = [];
  entry.errors = [];
  entry.warnings = [];
  entry.resources = [];
  entry.atlasDiffs = [];
  entry.meta = null;
  entry.frames = [];
  entry.loadMs = 0;
  entry.renderError = '';
}

export function runtimeVersionFor(resolved: SpineResolved): SpineRuntimeVersion {
  return spineRuntimeFor(resolved);
}

export async function ensureSpineCtor(resolved: SpineResolved): Promise<SpinePlayerCtor | null> {
  const version = runtimeVersionFor(resolved);
  if (!getSpineCtor(version)) {
    const ok = await loadSpineRuntime(version);
    if (!ok) return null;
  }
  return getSpineCtor(version);
}

export type AuditPlayerConfig = SpinePlayerConfig & { sampleLayer?: number; sampleAnimations?: boolean };

export function buildAuditPlayerConfig(resolved: SpineResolved, sceneLayer?: number): AuditPlayerConfig {
  if (resolved.kind === 'skel') {
    return { skelUrl: `${resolved.base}.skel`, atlasUrl: `${resolved.base}.atlas` };
  }
  if (resolved.kind === 'official') {
    return { ...buildOfficialConfig(resolved), sampleAnimations: true };
  }
  const layer = resolved.layers[sceneLayer ?? 0];
  return {
    ...buildOfficialConfig(layer),
    viewport: { ...resolved.viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
    sampleLayer: sceneLayer ?? 0,
  };
}

// atlas 格式：page 块以顶格 `<名>.png` 行开头，其后紧跟缩进的 `size: w, h` 行；
// region 块与属性行均缩进。判据 = 顶格 + 下一行以 size: 开头。
export function parseAtlasPages(atlasText: string): string[] {
  const lines = atlasText.split(/\r?\n/);
  const pages: string[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith(' ') || line.startsWith('\t')) continue;
    const next = lines[i + 1];
    if (next && next.trimStart().startsWith('size:')) pages.push(line.trim());
  }
  return pages;
}

export function classifyStatus(entry: AuditEntry): AuditStatus {
  if (entry.errors.length > 0) return 'fail';
  if (entry.warnings.length > 0) return 'warn';
  return 'pass';
}

export function buildDiagnosis(entry: AuditEntry): string[] {
  const advice: string[] = [];
  const all = [...entry.errors, ...entry.warnings];
  if (all.some((t) => t.includes('404'))) {
    advice.push('资源 404：官网 publish_key 换代或 CDN 缺文件 → 重新抓取并更新 spine-manifest（docs/spine/官网Spine动画抓取流程.md）');
  }
  if (all.some((t) => t.includes('401') || t.includes('403'))) {
    advice.push('鉴权/防盗链拒绝 → curl 不带 Referer 验证真实状态码');
  }
  if (all.some((t) => /ERR:|超时|不可达/.test(t))) {
    advice.push('网络不可达/超时 → 检查 CDN 可用性（act-webstatic / static.nanoka.cc）');
  }
  if (all.some((t) => /Invalid|解析失败|加载失败|Could not load|must not be null|outside the bounds|string table/.test(t))) {
    advice.push(
      entry.kind === 'skel'
        ? '骨架解析失败：skel 条目走 4.1.23 备用运行时 → 核对 nanoka CDN 资源状态与 4.1 运行时加载（双运行时机制见 src/spine/runtime.ts）'
        : '骨架/atlas 解析失败 → 核对 Spine 版本兼容（官网源 4.2.43 vs 运行时 4.2.43）',
    );
  }
  if (all.some((t) => t.includes('纹理映射缺失'))) {
    advice.push('textures 键与 atlas page 不一致 → 逐字对齐（键必须含 .png 扩展名，见 ADR 0009）');
  }
  if (all.some((t) => t.includes('未映射'))) {
    advice.push('atlas 存在多余 page → 检查 manifest textures 是否漏配或资源版本不匹配');
  }
  if (all.some((t) => t.includes('全透明'))) {
    advice.push('渲染无可见像素 → 检查视口 / 骨架坐标 / 附件挂载（可到 /debug/spine 场景调试台对照）');
  }
  if (all.some((t) => t.includes('无动画'))) {
    advice.push('骨架缺少动画 → 检查导出文件');
  }
  if (all.some((t) => t.includes('占比过高'))) {
    advice.push('混合 slot 占比高 → additive/screen 打光层有黑块风险；生产已用单画布合并渲染根治（成因与方案见 docs/spine/单层模式透明画布黑块成因与衬底方案.md）');
  }
  return advice;
}

export async function auditStaticResources(entry: AuditEntry, resolved: SpineResolved): Promise<void> {
  entry.checks.push('L0 静态');
  if (resolved.kind === 'skel') {
    await checkResources(entry, [`${resolved.base}.skel`, `${resolved.base}.atlas`]);
  } else if (resolved.kind === 'official') {
    await checkResources(entry, [resolved.atlas, resolved.json, ...Object.values(resolved.textures)]);
    entry.atlasDiffs.push({ layer: null, diff: await buildAtlasDiff(resolved.atlas, resolved.textures) });
  } else {
    for (let i = 0; i < resolved.layers.length; i++) {
      const layer = resolved.layers[i];
      await checkResources(entry, [layer.atlas, layer.json, ...Object.values(layer.textures)]);
      entry.atlasDiffs.push({ layer: i, diff: await buildAtlasDiff(layer.atlas, layer.textures) });
    }
  }
}

async function checkResources(entry: AuditEntry, urls: string[]): Promise<void> {
  const results = await Promise.all(urls.map(async (url) => ({ url, ...(await fetchResourceStatus(url)) })));
  const seen = new Set<string>();
  for (const r of results) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    entry.resources.push(r);
    if (!r.ok) entry.errors.push(`HTTP ${r.status || 'ERR'}: ${r.url}`);
  }
}

async function buildAtlasDiff(atlasUrl: string, textures: Record<string, string>): Promise<AtlasDiff> {
  const mappedKeys = Object.keys(textures);
  try {
    const atlasPages = parseAtlasPages(await fetchText(atlasUrl));
    return {
      atlasPages,
      mappedKeys,
      missingInManifest: atlasPages.filter((p) => !mappedKeys.includes(p)),
      missingInAtlas: mappedKeys.filter((k) => !atlasPages.includes(k)),
    };
  } catch {
    return { atlasPages: [], mappedKeys, missingInManifest: [], missingInAtlas: [] };
  }
}

export interface AuditRenderOptions {
  resolved: SpineResolved;
  sampleAnimations: boolean;
  cancelled?: () => boolean;
  onGlChange?: (delta: number) => void;
}

export async function auditRender(entry: AuditEntry, opts: AuditRenderOptions): Promise<void> {
  entry.checks.push('L2 渲染');
  const t0 = performance.now();
  try {
    const resolved = opts.resolved;
    const Ctor = await ensureSpineCtor(resolved);
    if (!Ctor) {
      entry.errors.push(`spine-player ${runtimeVersionFor(resolved)} 运行时加载失败（全部 CDN 不可达）`);
      return;
    }
    if (resolved.kind === 'official-scene') {
      for (let i = 0; i < resolved.layers.length; i++) {
        if (opts.cancelled?.()) return;
        await renderOnce(entry, Ctor, buildAuditPlayerConfig(resolved, i), opts);
      }
    } else {
      await renderOnce(entry, Ctor, buildAuditPlayerConfig(resolved), opts);
    }
  } finally {
    entry.loadMs = Math.round(performance.now() - t0);
    entry.status = classifyStatus(entry);
  }
}

async function renderOnce(
  entry: AuditEntry,
  Ctor: SpinePlayerCtor,
  cfg: AuditPlayerConfig,
  opts: AuditRenderOptions,
): Promise<void> {
  // 隐藏舞台：实例化前容器尺寸即确定（480×270 = 16:9，规避 buffer 比例错位陷阱）
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:480px;height:270px;';
  document.body.appendChild(host);
  opts.onGlChange?.(1);

  let frames = 0;
  let pendingSample: { anim: string; layer: number | null; resolve: (f: FrameSample | null) => void } | null = null;
  const settleSample = (p: SpinePlayerInstance): void => {
    if (!pendingSample) return;
    const { anim, layer, resolve } = pendingSample;
    pendingSample = null;
    resolve(sampleFrame(p, anim, layer));
  };

  const outcome = await spawnPlayer(Ctor, host, cfg, {
    onSuccess(p) {
      entry.meta = extractMeta(p);
      judgeMetaHealth(entry);
    },
    onDraw(p) {
      frames++;
      if (pendingSample && frames >= SAMPLE_FRAMES) settleSample(p);
    },
  });

  if (!outcome.ok || !outcome.player) {
    entry.renderError = outcome.err;
    entry.errors.push(`渲染失败: ${outcome.err}`);
    if (outcome.created) disposePlayer(outcome.created);
    host.remove();
    opts.onGlChange?.(-1);
    return;
  }
  const player = outcome.player;

  const anims = entry.meta?.animations ?? [];
  const list = cfg.sampleAnimations
    ? anims
    : (() => {
        const def = pickAnimName(anims);
        return def ? [def] : [];
      })();
  const frameStart = entry.frames.length;
  for (const anim of list) {
    if (opts.cancelled?.()) break;
    try {
      player.setAnimation(anim);
      player.play();
    } catch {
      entry.errors.push(`动画「${anim}」播放异常`);
      continue;
    }
    frames = 0;
    const sample = await new Promise<FrameSample | null>((resolve) => {
      pendingSample = { anim, layer: cfg.sampleLayer ?? null, resolve };
      setTimeout(() => {
        if (pendingSample) {
          pendingSample = null;
          resolve(null);
        }
      }, 10000);
    });
    if (sample) entry.frames.push(sample);
  }

  for (const f of entry.frames.slice(frameStart)) {
    if (f.visible === 0) {
      const where = f.layer !== null ? `层 ${f.layer + 1}` : `动画「${f.anim}」`;
      entry.errors.push(`${where}渲染全透明`);
    }
  }

  disposePlayer(player);
  host.remove();
  opts.onGlChange?.(-1);
}

function extractMeta(p: SpinePlayerInstance): AuditMeta | null {
  const skel = p.skeleton;
  if (!skel) return null;
  const data = skel.data;
  return {
    animations: (data?.animations ?? []).map((a) => a.name),
    skins: (data?.skins ?? []).map((s) => s.name),
    bones: data?.bones?.length ?? 0,
    slots: skel.slots.length,
    attachments: skel.slots.filter((s) => s.attachment || s.data.attachmentName).length,
    blendSlots: skel.slots
      .filter((s) => s.data.blendMode !== 0)
      .map((s) => ({ index: s.data.index, mode: s.data.blendMode, name: BLEND_NAMES[s.data.blendMode] ?? String(s.data.blendMode) })),
  };
}

function judgeMetaHealth(entry: AuditEntry): void {
  const meta = entry.meta;
  if (!meta) {
    entry.errors.push('骨架元数据缺失（解析不完整）');
    return;
  }
  if (meta.animations.length === 0) entry.errors.push('骨架无动画');
  if (meta.attachments === 0) entry.warnings.push('所有 slot 均无附件');
  if (meta.slots > 0 && meta.blendSlots.length > meta.slots / 2) {
    entry.warnings.push(`混合 slot 占比过高 ${meta.blendSlots.length}/${meta.slots}`);
  }
}

/** 帧内像素采样（draw 回调中调用，preserveDrawingBuffer 关闭也可读） */
function sampleFrame(p: SpinePlayerInstance, anim: string, layer: number | null): FrameSample | null {
  const canvas = p.canvas;
  const gl = p.context?.gl;
  if (!canvas || !gl) return null;
  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return null;
  const buf = new Uint8Array(w * h * 4);
  try {
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  } catch {
    return null;
  }
  return { anim, layer, ...analyzePixels(buf, w, h) };
}
