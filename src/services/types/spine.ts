
import type { SpineRuntimeVersion } from '../../spine/types';

export type { SpineRuntimeVersion };

export type SpineFetchSource = 'home' | 'character' | 'wayback';

export type SpineSource = 'official' | 'nanoka';

export interface SpineSkelEntry {
  kind: 'skel';
  name: string;
}

export interface SpineOfficialEntry {
  kind: 'official';

  version?: string;

  source?: SpineFetchSource;

  runtime?: SpineRuntimeVersion;

  dir: string;
  atlas: string;
  json: string;
  textures: Record<string, string>;
}

export interface SpineSceneLayer {
  dir: string;
  atlas: string;
  json: string;
  textures: Record<string, string>;
}

export interface SpineSceneEntry {
  kind: 'official-scene';

  version?: string;

  source?: SpineFetchSource;

  viewport: { x: number; y: number; width: number; height: number };

  layers: SpineSceneLayer[];
}

export interface SpineOfficialManifest {
  version: number;
  base: string;

  entries: Record<string, SpineOfficialEntry | SpineSceneEntry>;
}

export interface SpineNanokaManifest {
  version: number;

  entries: Record<string, SpineSkelEntry>;
}

export type SpineResolved =
  | { kind: 'skel'; base: string }
  | { kind: 'official'; atlas: string; json: string; textures: Record<string, string>; runtime?: SpineRuntimeVersion }
  | { kind: 'official-scene'; viewport: SpineSceneEntry['viewport']; layers: SpineResolvedSceneLayer[] };

export interface SpineResolvedSceneLayer {
  atlas: string;
  json: string;
  textures: Record<string, string>;
}
