/**
 * 平台单例访问器
 * 入口（main.ts / main.standalone.ts）负责 setPlatform，
 * 共享应用代码通过 platform() 访问当前平台能力。
 */
import type { NkPlatform } from './types';

let _platform: NkPlatform | null = null;

export function setPlatform(p: NkPlatform): void {
  _platform = p;
}

export function platform(): NkPlatform {
  if (!_platform) throw new Error('[nk-wiki] platform not initialized');
  return _platform;
}

export type { NkPlatform, MountResult, PlatformMode, FailStage } from './types';
