/**
 * Spine 动画清单（双清单：spine-manifest-official.json 官网源优先
 * + spine-manifest-nanoka.json 回退源，随站部署）
 */
import { CDN, SPINE_MANIFEST_VERSION } from '../../lib/constants';
import { cachedFetch } from '../cache';
import type { SpineOfficialManifest, SpineNanokaManifest, SpineResolved, SpineSource } from '../types';
import { LOCAL_DATA_BASE } from './base';

/** 缓存键后缀随 manifest.version 联动（v{SPINE_MANIFEST_VERSION}）；
 *  版本号必须与两个清单文件顶层 version 一致（测试强制） */
const SPINE_OFFICIAL_KEY = `spine_manifest_official_v${SPINE_MANIFEST_VERSION}`;
const SPINE_NANOKA_KEY = `spine_manifest_nanoka_v${SPINE_MANIFEST_VERSION}`;

/** 官网源 URL 展开：manifest 折叠格式（base + dir + 文件名）→ 完整 URL */
export function expandSpineUrl(base: string, dir: string, file: string): string {
  return base + dir + file;
}

/** 官方源全量清单（审核台条目清单用；与 resolveSpine 同一缓存键） */
export function loadSpineOfficialManifest(): Promise<SpineOfficialManifest> {
  return cachedFetch<SpineOfficialManifest>(`${LOCAL_DATA_BASE}/spine-manifest-official.json`, SPINE_OFFICIAL_KEY);
}

/** nanoka 源全量清单（回退源；与 resolveSpine 同一缓存键） */
export function loadSpineNanokaManifest(): Promise<SpineNanokaManifest> {
  return cachedFetch<SpineNanokaManifest>(`${LOCAL_DATA_BASE}/spine-manifest-nanoka.json`, SPINE_NANOKA_KEY);
}

/** 双清单聚合（审核台专用）：单个源失败返回 null（可部分加载，容错展示） */
export async function loadSpineManifests(): Promise<{
  official: SpineOfficialManifest | null;
  nanoka: SpineNanokaManifest | null;
}> {
  const [official, nanoka] = await Promise.allSettled([
    loadSpineOfficialManifest(),
    loadSpineNanokaManifest(),
  ]);
  return {
    official: official.status === 'fulfilled' ? official.value : null,
    nanoka: nanoka.status === 'fulfilled' ? nanoka.value : null,
  };
}

/**
 * 解析 spine 资源描述（官方源优先，缺失回退 nanoka 源）：
 * - official 条目展开为完整官网资源 URL（atlas/json/纹理映射）
 * - official-scene 条目展开多层场景 URL（固定视口 + 骨架层列表）
 * - skel 条目返回 nanoka 基地址（多段名跳过 bg）
 * 传 source 强制指定源（渲染层失效回退用：resolveSpine(key, 'nanoka')）。
 * 查无或解析失败返回 null。
 */
export async function resolveSpine(spineKey: string, source?: SpineSource): Promise<SpineResolved | null> {
  try {
    if (source !== 'nanoka') {
      const official = await resolveOfficial(spineKey);
      if (official) return official;
      if (source === 'official') return null; // 强制官方源且未命中
    }
    return await resolveNanoka(spineKey);
  } catch {
    return null;
  }
}

/** 查询条目命中的资源源（官方优先；调试/UI 徽标用；查无返回 null） */
export async function resolveSpineSource(spineKey: string): Promise<SpineSource | null> {
  try {
    if (await resolveOfficial(spineKey)) return 'official';
    if (await resolveNanoka(spineKey)) return 'nanoka';
    return null;
  } catch {
    return null;
  }
}

/** 官方源解析（spine-manifest-official.json） */
async function resolveOfficial(spineKey: string): Promise<SpineResolved | null> {
  const manifest = await cachedFetch<SpineOfficialManifest>(`${LOCAL_DATA_BASE}/spine-manifest-official.json`, SPINE_OFFICIAL_KEY);
  const entry = manifest && manifest.entries && manifest.entries[spineKey];
  if (!entry) return null;
  if (entry.kind === 'official-scene') {
    return {
      kind: 'official-scene',
      viewport: entry.viewport,
      layers: entry.layers.map((l) => expandLayer(l, manifest.base)),
    };
  }
  return {
    kind: 'official',
    atlas: expandSpineUrl(manifest.base, entry.dir, entry.atlas),
    json: expandSpineUrl(manifest.base, entry.dir, entry.json),
    textures: expandTextures(manifest.base, entry.dir, entry.textures),
  };
}

/** nanoka 源解析（spine-manifest-nanoka.json）：多段资源（如 "bg|tibao1|tibao2"）优先跳过背景层 bg */
async function resolveNanoka(spineKey: string): Promise<SpineResolved | null> {
  const manifest = await cachedFetch<SpineNanokaManifest>(`${LOCAL_DATA_BASE}/spine-manifest-nanoka.json`, SPINE_NANOKA_KEY);
  const entry = manifest && manifest.entries && manifest.entries[spineKey];
  if (!entry || entry.kind !== 'skel') return null;
  const parts = String(entry.name).split('|').filter(Boolean);
  const name = parts.find((p) => p !== 'bg') || parts[0] || null;
  if (!name) return null;
  return { kind: 'skel', base: spineBaseUrl(spineKey, name) };
}

/** 场景单层 URL 展开（与 official 条目同一折叠格式） */
function expandLayer(layer: { dir: string; atlas: string; json: string; textures: Record<string, string> }, base: string) {
  return {
    atlas: expandSpineUrl(base, layer.dir, layer.atlas),
    json: expandSpineUrl(base, layer.dir, layer.json),
    textures: expandTextures(base, layer.dir, layer.textures),
  };
}

/** 纹理映射展开：atlas 逻辑纹理名 → 完整 hash URL */
function expandTextures(base: string, dir: string, textures: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [logicalName, file] of Object.entries(textures)) {
    out[logicalName] = expandSpineUrl(base, dir, file);
  }
  return out;
}

/** 列出官方清单中全部 official-scene 场景键（调试页场景选择用；场景仅存于官方源） */
export async function loadSpineSceneKeys(): Promise<string[]> {
  try {
    const manifest = await cachedFetch<SpineOfficialManifest>(`${LOCAL_DATA_BASE}/spine-manifest-official.json`, SPINE_OFFICIAL_KEY);
    if (!manifest || !manifest.entries) return [];
    return Object.entries(manifest.entries)
      .filter(([, v]) => v.kind === 'official-scene')
      .map(([k]) => k);
  } catch {
    return [];
  }
}

/** Spine 资源基地址（.skel / .atlas 后缀由调用方拼接） */
export function spineBaseUrl(charId: string, name: string): string {
  return `${CDN}/assets/hsr/spine/${charId}/${name}`;
}
