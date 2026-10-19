import { resolveSpine, spineRuntimeFor } from '../../services/api';
import type { SpineResolved } from '../../services/types';
import { buildOfficialConfig } from '../../spine/config';
import { createSpinePlayer } from '../../spine/player';
import { disposeSpineEntry } from '../../spine/registry';
import { getSpineLib, loadSpineRuntime } from '../../spine/runtime';
import { mountSpineScene } from '../../spine/scene';
import type { SpineRuntimeVersion } from '../../spine/types';

const PLAYER_KEY = (spineKey: string): string => `player:${spineKey}`;

export function initSpineViewer(
  container: HTMLElement,
  spineKey: string,
  onReady: () => void,
  opts?: { fit?: 'contain' | 'cover' },
): () => void {
  renderSpineSelf(container, spineKey, (ok) => {
    if (ok && container.isConnected) onReady();
  }, opts);
  return () => {
    disposeSpineEntry(PLAYER_KEY(spineKey));
  };
}

export function initSpineSceneViewer(
  container: HTMLElement,
  sceneKey: string,
  onReady: () => void,
): () => void {
  let cancelled = false;
  let ctrl: { teardown(): void } | null = null;

  void (async () => {
    try {
      const entry = await resolveSpine(sceneKey);
      if (!entry || entry.kind !== 'official-scene') return;
      const ok = await loadSpineRuntime();
      if (!ok || cancelled || !container.isConnected) return;
      const lib = getSpineLib();
      if (!lib) return;
      ctrl = mountSpineScene({ container, layers: entry.layers, viewport: entry.viewport, lib, onReady });
    } catch (e) {
      console.warn('[nk-wiki] spine 场景渲染失败:', e);
    }
  })();

  return () => {
    cancelled = true;
    if (ctrl) {
      ctrl.teardown();
      ctrl = null;
    }
  };
}

async function renderPlayer(
  container: HTMLElement,
  key: string,
  entry: SpineResolved,
  opts?: { fit?: 'contain' | 'cover' },
): Promise<boolean> {
  const urls = entry.kind === 'skel'
    ? { skelUrl: `${entry.base}.skel`, atlasUrl: `${entry.base}.atlas` }
    : entry.kind === 'official'
      ? buildOfficialConfig(entry)
      : null;
  if (!urls) return false;
  const runtimeVersion: SpineRuntimeVersion = spineRuntimeFor(entry);
  const ok = await loadSpineRuntime(runtimeVersion);
  if (!ok) return false;
  const player = await createSpinePlayer(
    container,
    key,
    {
      ...urls,
      ...(opts?.fit ? { fit: opts.fit } : {}),
    },
    runtimeVersion,
  );
  return player !== null;
}

function renderSpineSelf(
  container: HTMLElement,
  charId: string,
  onDone: (ok: boolean) => void,
  opts?: { fit?: 'contain' | 'cover' },
): void {
  if (!charId) {
    onDone(false);
    return;
  }
  const key = PLAYER_KEY(charId);
  void (async () => {
    try {
      disposeSpineEntry(key);
      const entry = await resolveSpine(charId);
      if (!entry || entry.kind === 'official-scene') return onDone(false);
      const ok = await renderPlayer(container, key, entry, opts);
      if (!ok && entry.kind === 'official') {
        console.warn('[nk-wiki] 官方源渲染失败，回退 nanoka 源');
        const fallback = await resolveSpine(charId, 'nanoka');
        if (fallback && fallback.kind === 'skel') {
          disposeSpineEntry(key);
          return onDone(await renderPlayer(container, key, fallback, opts));
        }
      }
      onDone(ok);
    } catch (e) {
      console.warn('[nk-wiki] spine 自主渲染失败:', e);
      onDone(false);
    }
  })();
}
