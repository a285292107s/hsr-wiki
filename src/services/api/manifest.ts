
import { CDN } from '../../lib/constants';
import { cachedFetch } from '../cache';
import type { Manifest } from '../types';

export async function loadManifest(): Promise<Manifest> {
  return cachedFetch<Manifest>(`${CDN}/manifest.json`, 'manifest');
}

export function resolveVersion(m: Manifest): string {
  return m.hsr?.latest || (m.hsr?.available || [])[0] || '';
}
