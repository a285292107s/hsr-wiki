import { SPINE_RUNTIME_41_CDNS, SPINE_RUNTIME_CDNS, SPINE_RUNTIME_LOCAL } from './constants';
import { isCdnDown } from '../services/cdn/health';
import type { SpineLib, SpinePlayerCtor, SpineRuntimeVersion } from './types';

const SCRIPT_TIMEOUT_MS = 8000;

const VERSION_CDNS: Record<SpineRuntimeVersion, string[]> = {
  '4.1': SPINE_RUNTIME_41_CDNS,
  '4.2': SPINE_RUNTIME_CDNS,
};

const libs = new Map<SpineRuntimeVersion, SpineLib>();

const _runtimeLoads = new Map<SpineRuntimeVersion, Promise<boolean>>();

let loadingVersion: SpineRuntimeVersion | null = null;

let proxyInstalled = false;

let injectChain: Promise<unknown> = Promise.resolve();

function installSpineProxy(): void {
  if (proxyInstalled) return;
  proxyInstalled = true;
  try {
    Object.defineProperty(window, 'spine', {
      configurable: true,
      get(): SpineLib | null {
        return libs.get('4.2') ?? libs.get('4.1') ?? null;
      },
      set(v: unknown): void {
        try {
          if (loadingVersion && v && typeof v === 'object') libs.set(loadingVersion, v as SpineLib);
        } catch {
        }
      },
    });
  } catch {
  }
}

function captureFallback(version: SpineRuntimeVersion): boolean {
  try {
    const g = globalThis as { spine?: SpineLib };
    if (!g.spine) return false;
    libs.set(version, g.spine);
    const main = libs.get('4.2');
    if (main && g.spine !== main) g.spine = main;
    return true;
  } catch {
    return false;
  }
}

function injectScript(url: string, version: SpineRuntimeVersion): Promise<boolean> {
  const run = injectChain.then(
    () =>
      new Promise<boolean>((resolve) => {
        let settled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;
        const settle = (ok: boolean): void => {
          if (settled) return;
          settled = true;
          if (timer !== null) clearTimeout(timer);
          s.onload = null;
          s.onerror = null;
          resolve(ok);
        };
        loadingVersion = version;
        const s = document.createElement('script');
        s.src = url;
        s.onload = () => settle(proxyInstalled ? getSpineCtor(version) !== null : captureFallback(version));
        s.onerror = () => settle(false);
        timer = setTimeout(() => {
          s.remove();
          settle(false);
        }, SCRIPT_TIMEOUT_MS);
        document.head.appendChild(s);
      }),
  );
  injectChain = run.catch(() => undefined);
  return run;
}

export function getSpineCtor(version: SpineRuntimeVersion = '4.2'): SpinePlayerCtor | null {
  const lib = libs.get(version);
  return (lib && lib.SpinePlayer) || null;
}

export function getSpineLib(version: SpineRuntimeVersion = '4.2'): SpineLib | null {
  return libs.get(version) ?? null;
}

export function loadSpineRuntime(version: SpineRuntimeVersion = '4.2'): Promise<boolean> {
  if (getSpineCtor(version)) return Promise.resolve(true);
  const pending = _runtimeLoads.get(version);
  if (pending) return pending;
  const promise = (async (): Promise<boolean> => {
    installSpineProxy();
    if (await injectScript(SPINE_RUNTIME_LOCAL[version], version)) return true;
    if (isCdnDown()) return false;
    for (const url of VERSION_CDNS[version]) {
      const ok = await injectScript(url, version);
      if (ok) return true;
    }
    return false;
  })().then((ok) => {
    if (!ok) _runtimeLoads.delete(version);
    return ok;
  });
  _runtimeLoads.set(version, promise);
  return promise;
}
