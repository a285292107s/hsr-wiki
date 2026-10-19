import type { SpineRuntimeVersion } from './types';

export const SPINE_RUNTIME_VERSION = '4.2.43';

export const SPINE_RUNTIME_41_VERSION = '4.1.23';

export const SPINE_RUNTIME_LOCAL: Record<SpineRuntimeVersion, string> = {
  '4.2': '/vendor/spine/spine-player-4.2.43.js',
  '4.1': '/vendor/spine/spine-player-4.1.23.js',
};

export const SPINE_RUNTIME_CDNS = [
  `https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
  `https://unpkg.com/@esotericsoftware/spine-player@${SPINE_RUNTIME_VERSION}/dist/iife/spine-player.js`,
];

export const SPINE_RUNTIME_41_CDNS = [
  `https://cdn.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
  `https://fastly.jsdelivr.net/npm/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
  `https://unpkg.com/@esotericsoftware/spine-player@${SPINE_RUNTIME_41_VERSION}/dist/iife/spine-player.js`,
];
