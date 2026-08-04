/**
 * Spine 导入审核引擎（SpineAuditView 体检台专用）：
 *
 *   L0 静态资源检查 —— 全部 URL 可达性（只取响应头不下载 body）+ atlas 纹理映射对照（零 WebGL，秒级）
 *   L1 骨架解析与元数据提取 —— 复用 L2 渲染 success 回调提取（避免重复解析），空动画/零附件/混合占比判定
 *   L2 真实渲染检查 —— 串行单实例队列（视图驱动），渲染参数与生产一致（premultipliedAlpha=false）
 *     - skel 条目：渲染成功 + 元数据 + 默认动画首帧采样（降级，不逐动画）
 *     - official 条目：逐动画像素采样（每动画播满 N 帧后 readPixels 统计可见像素）
 *     - official-scene 条目：逐层串行渲染成功 + 元数据 + 每层默认动画采样
 */
import { fetchResourceStatus, fetchText } from '../../services/cache';
import type { SpineResolved, SpineSource } from '../../services/types';
import {
  BLEND_NAMES,
  type SpinePlayerCtor, type SpinePlayerInstance, type SpinePlayerConfig,
} from '../../lib/spine/types';
import { buildOfficialConfig } from '../../lib/spine/config';
import { disposePlayer, pickAnimName } from '../../lib/spine/player';
import { getSpineCtor, loadSpineRuntime } from '../../lib/spine/runtime';

/* ─── 常量 ─── */

/** 每动画采样帧数（draw 回调计数；官方条目逐动画采样深度） */
const SAMPLE_FRAMES = 15;
/** 单个 player 渲染整体超时（加载 + 采样，含网络） */
const RENDER_TIMEOUT = 30000;

/* ─── 结果类型 ─── */

export type AuditKind = 'skel' | 'official' | 'official-scene';
export type AuditStatus = 'pending' | 'running' | 'pass' | 'warn' | 'fail';

export interface AuditResource {
  url: string;
  ok: boolean;
  status: number;
  ms: number;
}
export interface AtlasDiff {
  /** atlas 文本实际解析出的 page 名（含扩展名） */
  atlasPages: string[];
  /** manifest textures 键（含扩展名） */
  mappedKeys: string[];
  /** atlas 有而 manifest 无（多余 page） */
  missingInManifest: string[];
  /** manifest 有而 atlas 无（映射失效） */
  missingInAtlas: string[];
}
export interface FrameSample {
  anim: string;
  /** 场景层索引（非场景条目为 null） */
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
  /** 挂载了附件的 slot 数 */
  attachments: number;
  blendSlots: BlendSlotInfo[];
}
export interface AuditEntry {
  key: string;
  kind: AuditKind;
  /** 资源源：official=官网 CDN（优先）/ nanoka=nanoka CDN（回退） */
  source: SpineSource;
  /** 可读名（skel name / 首纹理名 / 场景键） */
  label: string;
  status: AuditStatus;
  /** 已完成阶段记录（'L0 静态' / 'L2 渲染'） */
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

/* ─── 纯函数（可单测） ─── */

/**
 * 解析 Spine atlas 文本的 page 名列表。
 * atlas 格式：page 块以顶格 `<名>.png` 行开头，其后紧跟缩进的 `size: w, h` 行；
 * region 块与属性行均缩进。判据 = 顶格 + 下一行以 size: 开头。
 */
export function parseAtlasPages(atlasText: string): string[] {
  const lines = atlasText.split(/\r?\n/);
  const pages: string[] = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line.startsWith(' ') || line.startsWith('\t')) continue; // 缩进行 = 属性/region
    const next = lines[i + 1];
    if (next && next.trimStart().startsWith('size:')) pages.push(line.trim());
  }
  return pages;
}

export interface PixelAnalysis {
  visible: number;
  total: number;
  ratio: number;
  bbox: { x0: number; y0: number; x1: number; y1: number } | null;
}

/** RGBA 像素缓冲可见性统计（alpha>0 计数 + 包围盒；readPixels 原点在左下，返回坐标已翻转为左上原点） */
export function analyzePixels(buf: Uint8Array, w: number, h: number): PixelAnalysis {
  let visible = 0;
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y++) {
    const glY = h - 1 - y; // WebGL readPixels 从底部行开始
    for (let x = 0; x < w; x++) {
      const a = buf[(glY * w + x) * 4 + 3];
      if (a > 0) {
        visible++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return {
    visible,
    total: w * h,
    ratio: visible / (w * h),
    bbox: visible ? { x0, y0, x1, y1 } : null,
  };
}

/** 由 errors/warnings 判定终态（有 errors 即 FAIL，有 warnings 即 WARN，否则 PASS） */
export function classifyStatus(entry: AuditEntry): AuditStatus {
  if (entry.errors.length > 0) return 'fail';
  if (entry.warnings.length > 0) return 'warn';
  return 'pass';
}

/** 诊断建议：错误/警告文本 → 人话排查路径（关键词匹配） */
export function buildDiagnosis(entry: AuditEntry): string[] {
  const advice: string[] = [];
  const all = [...entry.errors, ...entry.warnings];
  if (all.some((t) => t.includes('404'))) {
    advice.push('资源 404：官网 publish_key 换代或 CDN 缺文件 → 重新抓取并更新 spine-manifest（docs/官网Spine动画抓取流程.md）');
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
        ? '骨架解析失败：nanoka skel 为 4.1.23 二进制，与 4.2.43 运行时二进制不兼容（已知问题）→ 生产角色页已回退立绘；如需动画请抓取官网 official 源（docs/官网Spine动画抓取流程.md）'
        : '骨架/atlas 解析失败 → 核对 Spine 版本兼容（nanoka 源 4.1.23 / 官网源 4.2.43 vs 运行时 4.2.43）',
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
    advice.push('混合 slot 占比高 → 留意 additive/screen 打光层黑块风险（预乘/打光对照实验见 /debug/spine）');
  }
  return advice;
}

/* ─── L0 静态资源检查 ─── */

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

/** 并发检查一组 URL（同条目内并行，条目间由队列串行）；失败写入 entry.errors */
async function checkResources(entry: AuditEntry, urls: string[]): Promise<void> {
  const results = await Promise.all(urls.map(async (url) => ({ url, ...(await fetchResourceStatus(url)) })));
  const seen = new Set<string>();
  for (const r of results) {
    if (seen.has(r.url)) continue; // 同一纹理可能被多个层引用，去重展示
    seen.add(r.url);
    entry.resources.push(r);
    if (!r.ok) entry.errors.push(`HTTP ${r.status || 'ERR'}: ${r.url}`);
  }
}

/** 下载 atlas 文本并对照 manifest textures 键；atlas 获取失败时 diff 置空（错误由资源检查兜底） */
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

/* ─── L2 渲染检查（含 L1 元数据提取） ─── */

export interface AuditRenderOptions {
  resolved: SpineResolved;
  /** 逐动画像素采样：official=true；skel/official-scene=false（仅默认动画采样） */
  sampleAnimations: boolean;
  /** 取消信号（返回 true 停止后续动画/层检查） */
  cancelled?: () => boolean;
  /** WebGL 上下文占用变化通知（创建 +1 / 释放 -1） */
  onGlChange?: (delta: number) => void;
}

export async function auditRender(entry: AuditEntry, opts: AuditRenderOptions): Promise<void> {
  entry.checks.push('L2 渲染');
  const t0 = performance.now();
  try {
    if (!getSpineCtor()) {
      const ok = await loadSpineRuntime();
      if (!ok) {
        entry.errors.push('spine-player 运行时加载失败（全部 CDN 不可达）');
        return;
      }
    }
    const Ctor = getSpineCtor();
    if (!Ctor) return;
    const resolved = opts.resolved;
    if (resolved.kind === 'official-scene') {
      // 逐层串行：固定视口 + pad 0（与生产 initSpineSceneViewer 一致）
      for (let i = 0; i < resolved.layers.length; i++) {
        if (opts.cancelled?.()) return;
        const layer = resolved.layers[i];
        await renderOnce(entry, Ctor, {
          ...buildOfficialConfig(layer),
          viewport: { ...resolved.viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
          sampleLayer: i,
        }, opts);
      }
    } else if (resolved.kind === 'official') {
      await renderOnce(entry, Ctor, {
        ...buildOfficialConfig(resolved),
        sampleAnimations: true,
      }, opts);
    } else {
      await renderOnce(entry, Ctor, {
        skelUrl: `${resolved.base}.skel`,
        atlasUrl: `${resolved.base}.atlas`,
      }, opts);
    }
  } finally {
    entry.loadMs = Math.round(performance.now() - t0);
    entry.status = classifyStatus(entry);
  }
}

/** 单实例渲染检查：建 player → 提取元数据 → 健康判定 → 动画采样 → 释放 */
async function renderOnce(
  entry: AuditEntry,
  Ctor: SpinePlayerCtor,
  cfg: SpinePlayerConfig & { sampleLayer?: number; sampleAnimations?: boolean },
  opts: AuditRenderOptions,
): Promise<void> {
  // 隐藏舞台：实例化前容器尺寸即确定（480×270 = 16:9，规避 buffer 比例错位陷阱）
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:480px;height:270px;';
  document.body.appendChild(host);
  opts.onGlChange?.(1);

  // 采样状态机（draw 回调在帧内执行，readPixels 可安全读取）
  let frames = 0;
  let pendingSample: { anim: string; layer: number | null; resolve: (f: FrameSample | null) => void } | null = null;
  const settleSample = (p: SpinePlayerInstance): void => {
    if (!pendingSample) return;
    const { anim, layer, resolve } = pendingSample;
    pendingSample = null;
    resolve(sampleFrame(p, anim, layer));
  };

  /** 已创建的 player 实例（失败路径也需释放，避免 WebGL 上下文泄漏） */
  let created: SpinePlayerInstance | null = null;

  const outcome = await new Promise<{ ok: boolean; err: string; player: SpinePlayerInstance | null }>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ ok: false, err: `渲染超时（${RENDER_TIMEOUT / 1000}s）`, player: null });
      }
    }, RENDER_TIMEOUT);
    try {
      const player = new Ctor(host, {
        ...cfg,
        alpha: true,
        backgroundColor: '00000000',
        premultipliedAlpha: false,
        showControls: false,
        showLoading: false,
        success(p) {
          entry.meta = extractMeta(p);
          judgeMetaHealth(entry);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ ok: true, err: '', player: p });
          }
        },
        error(_p, msg) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({ ok: false, err: String(msg), player: null });
          }
        },
        draw(p) {
          frames++;
          if (pendingSample && frames >= SAMPLE_FRAMES) settleSample(p);
        },
      });
      created = player;
      if (!player) {
        // 构造函数同步抛错已在 catch；此处防 undefined 实例
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ ok: false, err: 'player 实例创建失败', player: null });
        }
      }
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ ok: false, err: String(e), player: null });
      }
    }
  });

  if (!outcome.ok || !outcome.player) {
    entry.renderError = outcome.err;
    entry.errors.push(`渲染失败: ${outcome.err}`);
    // 失败路径释放已创建的 player（error/超时后仍可能持有 WebGL 上下文）
    if (created) disposePlayer(created);
    host.remove();
    // 与 renderOnce 开头 +1 配对，只递减一次
    opts.onGlChange?.(-1);
    return;
  }
  const player = outcome.player;

  // 动画采样：official 逐动画；skel/scene 仅默认动画
  const anims = entry.meta?.animations ?? [];
  const list = cfg.sampleAnimations
    ? anims
    : (() => {
        const def = pickAnimName(anims);
        return def ? [def] : [];
      })();
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
      // 兜底：动画未出帧（视口错位等）不无限等待
      setTimeout(() => {
        if (pendingSample) {
          pendingSample = null;
          resolve(null);
        }
      }, 10000);
    });
    if (sample) entry.frames.push(sample);
  }

  // 全透明判定（骨架空 / 视口错位 / 附件未挂载）
  for (const f of entry.frames) {
    if (f.visible === 0) {
      const where = f.layer !== null ? `层 ${f.layer + 1}` : `动画「${f.anim}」`;
      entry.errors.push(`${where}渲染全透明`);
    }
  }

  disposePlayer(player);
  host.remove();
  opts.onGlChange?.(-1);
}

/** 提取骨架元数据（L1：解析成功的证据 + 健康指标） */
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

/** 骨架健康判定：空动画 / 零附件 / 混合占比过高 */
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
