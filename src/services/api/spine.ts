import { CDN, SPINE_MANIFEST_VERSION } from '../../lib/constants';
import { cachedFetch } from '../cache';
import type { SpineOfficialManifest, SpineNanokaManifest, SpineResolved, SpineRuntimeVersion, SpineSource } from '../types';
import { LOCAL_DATA_BASE } from './base';

const SPINE_OFFICIAL_KEY = `spine_manifest_official_v${SPINE_MANIFEST_VERSION}`;
const SPINE_NANOKA_KEY = `spine_manifest_nanoka_v${SPINE_MANIFEST_VERSION}`;

export function expandSpineUrl(base: string, dir: string, file: string): string {
  return base + dir + file;
}

export function loadSpineOfficialManifest(): Promise<SpineOfficialManifest> {
  return cachedFetch<SpineOfficialManifest>(`${LOCAL_DATA_BASE}/spine-manifest-official.json`, SPINE_OFFICIAL_KEY);
}

export function loadSpineNanokaManifest(): Promise<SpineNanokaManifest> {
  return cachedFetch<SpineNanokaManifest>(`${LOCAL_DATA_BASE}/spine-manifest-nanoka.json`, SPINE_NANOKA_KEY);
}

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

export async function resolveSpine(spineKey: string, source?: SpineSource): Promise<SpineResolved | null> {
  try {
    if (source !== 'nanoka') {
      const official = await resolveOfficial(spineKey);
      if (official) return official;
      if (source === 'official') return null;
    }
    return await resolveNanoka(spineKey);
  } catch {
    return null;
  }
}

export async function resolveSpineSource(spineKey: string): Promise<SpineSource | null> {
  try {
    if (await resolveOfficial(spineKey)) return 'official';
    if (await resolveNanoka(spineKey)) return 'nanoka';
    return null;
  } catch {
    return null;
  }
}

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
    ...(entry.runtime ? { runtime: entry.runtime } : {}),
  };
}

async function resolveNanoka(spineKey: string): Promise<SpineResolved | null> {
  const manifest = await cachedFetch<SpineNanokaManifest>(`${LOCAL_DATA_BASE}/spine-manifest-nanoka.json`, SPINE_NANOKA_KEY);
  const entry = manifest && manifest.entries && manifest.entries[spineKey];
  if (!entry || entry.kind !== 'skel') return null;
  const parts = String(entry.name).split('|').filter(Boolean);
  const name = parts.find((p) => p !== 'bg') || parts[0] || null;
  if (!name) return null;
  return { kind: 'skel', base: spineBaseUrl(spineKey, name) };
}

function expandLayer(layer: { dir: string; atlas: string; json: string; textures: Record<string, string> }, base: string) {
  return {
    atlas: expandSpineUrl(base, layer.dir, layer.atlas),
    json: expandSpineUrl(base, layer.dir, layer.json),
    textures: expandTextures(base, layer.dir, layer.textures),
  };
}

function expandTextures(base: string, dir: string, textures: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [logicalName, file] of Object.entries(textures)) {
    out[logicalName] = expandSpineUrl(base, dir, file);
  }
  return out;
}

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

export function spineRuntimeFor(entry: SpineResolved): SpineRuntimeVersion {
  if (entry.kind === 'skel') return '4.1';
  if (entry.kind === 'official') return entry.runtime ?? '4.2';
  return '4.2';
}

export function spineBaseUrl(charId: string, name: string): string {
  return `${CDN}/assets/hsr/spine/${charId}/${name}`;
}
