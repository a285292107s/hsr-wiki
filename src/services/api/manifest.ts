/** manifest 加载与版本解析 */
import { CDN } from '../../lib/constants';
import { cachedFetch } from '../cache';
import type { Manifest } from '../types';

export async function loadManifest(): Promise<Manifest> {
  return cachedFetch<Manifest>(`${CDN}/manifest.json`, 'manifest');
}

/** 从 manifest 解析当前数据版本 */
export function resolveVersion(m: Manifest): string {
  return m.hsr?.latest || (m.hsr?.available || [])[0] || '';
}
