import { CDN } from '../../lib/constants';

export const CDN_PROBE_TIMEOUT_MS = 3000;

export const CDN_RETRY_INTERVAL_MS = 30_000;

const PROBE_URL = `${CDN}/manifest.json`;

type CdnHealthListener = (down: boolean) => void;

let cdnDown = false;
let probeStarted = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<CdnHealthListener>();

export function isCdnDown(): boolean {
  return cdnDown;
}

export function subscribeCdnHealth(fn: CdnHealthListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setDown(down: boolean): void {
  if (cdnDown === down) return;
  cdnDown = down;
  for (const fn of [...listeners]) fn(down);
}

async function probeOnce(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CDN_PROBE_TIMEOUT_MS);
  try {
    const r = await fetch(PROBE_URL, { method: 'HEAD', cache: 'no-store', signal: ctrl.signal });
    return r.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function probeLoop(): Promise<void> {
  while (true) {
    const ok = await probeOnce();
    if (ok) {
      setDown(false);
      return;
    }
    setDown(true);
    await new Promise((r) => {
      retryTimer = setTimeout(r, CDN_RETRY_INTERVAL_MS);
    });
  }
}

export function startCdnHealthProbe(): void {
  if (probeStarted) return;
  probeStarted = true;
  void probeLoop();
}

export function resetCdnHealthForTest(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  probeStarted = false;
  cdnDown = false;
  listeners.clear();
}
