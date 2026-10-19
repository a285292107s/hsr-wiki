import { NkError } from '../lib/errors';

const FETCH_TIMEOUT = 15000;
const MEM_MAX = 80;

async function requestText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new NkError(`HTTP ${r.status}: ${url}`, true);
    return await r.text();
  } catch (e) {
    if (e instanceof NkError) throw e;
    if (e instanceof Error && (e.name === 'AbortError' || (e as DOMException).code === 20)) {
      throw new NkError(`Request timed out: ${url}`, true);
    }
    throw new NkError(e instanceof Error ? e.message || 'Network error' : 'Network error', true);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const text = await requestText(url);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new NkError(`Invalid JSON: ${url}`, true);
  }
}

export function fetchText(url: string): Promise<string> {
  return requestText(url);
}

export interface ResourceStatus {
  ok: boolean;
  status: number;
  ms: number;
}

export async function fetchResourceStatus(url: string, timeoutMs = 15000): Promise<ResourceStatus> {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    try {
      if (r.body && typeof r.body.cancel === 'function') r.body.cancel();
    } catch { }
    return { ok: r.ok, status: r.status, ms: Math.round(performance.now() - t0) };
  } catch {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

const mem = new Map<string, unknown>();

function memSet(key: string, data: unknown): void {
  if (mem.size >= MEM_MAX) {
    const evict = Math.ceil(MEM_MAX * 0.2);
    const it = mem.keys();
    for (let i = 0; i < evict; i++) {
      const k = it.next().value;
      if (k !== undefined) mem.delete(k);
    }
  }
  mem.set(key, data);
}

export function memHas(key: string): boolean {
  return mem.has(key);
}

export function memStore(key: string, data: unknown): void {
  memSet(key, data);
}

const pending = new Map<string, Promise<unknown>>();

async function cachedRequest<T>(
  url: string,
  cacheKey: string,
  load: (u: string) => Promise<T>,
): Promise<T> {
  if (mem.has(cacheKey)) return mem.get(cacheKey) as T;
  const inflight = pending.get(cacheKey);
  if (inflight) return inflight as Promise<T>;
  const p = load(url)
    .then((data) => {
      memSet(cacheKey, data);
      return data;
    })
    .finally(() => pending.delete(cacheKey));
  pending.set(cacheKey, p);
  return p;
}

export function cachedFetch<T>(url: string, cacheKey: string): Promise<T> {
  return cachedRequest(url, cacheKey, (u) => fetchJSON<T>(u));
}

export function cachedLoad<T>(url: string, cacheKey: string, load: (url: string) => Promise<T>): Promise<T> {
  return cachedRequest(url, cacheKey, load);
}
