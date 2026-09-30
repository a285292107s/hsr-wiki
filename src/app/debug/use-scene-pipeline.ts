import { nextTick, ref } from 'vue';
import type { SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';
import { buildOfficialConfig } from '../../spine/config';
import { disposePlayer, pickAnimName } from '../../spine/player';
import { getSpineLib } from '../../spine/runtime';
import { createScenePipeline } from '../../spine/scene';
import type { SpinePlayerCtor, SpinePlayerInstance, SpineScenePipelineController } from '../../spine/types';

export const LAYER_BG = '0d1326';

export interface LayerState {
  idx: number;
  label: string;
  status: 'loading' | 'ok' | 'fail';
  error: string;
  loadMs: number;
}

export interface LayerEntryRef {
  viewport: SpineSceneEntry['viewport'];
  layers: SpineResolvedSceneLayer[];
}

export function useSingleLayers() {
  const layers = ref<LayerState[]>([]);
  const playerAlive = ref(0);
  const els = new Map<number, HTMLElement>();

  let players: (SpinePlayerInstance | undefined)[] = [];

  function registerEl(idx: number, el: unknown): void {
    if (el instanceof HTMLElement) els.set(idx, el);
    else els.delete(idx);
  }

  function disposeAll(): void {
    for (const p of players) {
      if (p) disposePlayer(p);
    }
    players = [];
    playerAlive.value = 0;
  }

  function reset(): void {
    disposeAll();
    layers.value = [];
  }

  function createPlayer(st: LayerState, entry: LayerEntryRef, Ctor: SpinePlayerCtor): void {
    const el = els.get(st.idx);
    const layer = entry.layers[st.idx];
    if (!el || !layer) return;
    const t0 = performance.now();
    const player = new Ctor(el, {
      ...buildOfficialConfig(layer),
      alpha: true,
      backgroundColor: LAYER_BG,
      premultipliedAlpha: false, // 与生产基线一致：官网 atlas 无 pma 字段 = 直通 alpha
      preserveDrawingBuffer: true, // 保留绘制缓冲：像素采样稳定（不受 rAF 暂停影响）
      viewport: { ...entry.viewport, padLeft: 0, padRight: 0, padTop: 0, padBottom: 0 },
      showControls: false,
      showLoading: false,
      success(p) {
        st.loadMs = Math.round(performance.now() - t0);
        st.status = 'ok';
        const names = ((p.skeleton && p.skeleton.data && p.skeleton.data.animations) || []).map((a) => a.name);
        const chosen = pickAnimName(names);
        if (chosen) {
          try {
            p.setAnimation(chosen);
            p.play();
          } catch {}
        }
      },
      error(_p, msg) {
        st.status = 'fail';
        st.error = String(msg);
      },
    });
    players[st.idx] = player;
    playerAlive.value++;
  }

  async function initLayers(entry: LayerEntryRef, Ctor: SpinePlayerCtor): Promise<void> {
    layers.value = entry.layers.map((layer, idx) => {
      const texKey = Object.keys(layer.textures)[0] ?? '';
      return { idx, label: texKey.replace(/\.png$/i, ''), status: 'loading' as const, error: '', loadMs: 0 };
    });
    await nextTick();
    for (const st of layers.value) {
      createPlayer(st, entry, Ctor);
    }
  }

  function setPausedAll(paused: boolean): void {
    for (const p of players) {
      if (!p) continue;
      try {
        if (paused) p.pause();
        else p.resume ? p.resume() : p.play(); // 4.1 运行时无 resume（本页为 4.2 场景语境，存在性判断仅防契约漂移）
      } catch {}
    }
  }

  return {
    layers, playerAlive,
    registerEl, reset, disposeAll, initLayers,
    setPausedAll,
  };
}

export function useMergedPipeline() {
  const on = ref(false);
  const ready = ref(false);
  const error = ref('');
  const containerRef = ref<HTMLElement | null>(null);
  const missingKeys = ref<string[]>([]);

  let ctrl: SpineScenePipelineController | null = null;
  let savedEntry: LayerEntryRef | null = null;

  function registerEl(el: unknown): void {
    containerRef.value = el instanceof HTMLElement ? el : null;
  }

  function dispose(): void {
    if (ctrl) {
      ctrl.teardown();
      ctrl = null;
    }
    on.value = false;
    ready.value = false;
    error.value = '';
    missingKeys.value = [];
  }

  async function mount(entry?: LayerEntryRef | null): Promise<void> {
    if (entry) savedEntry = entry;
    const el = containerRef.value;
    const g = getSpineLib();
    if (!el || !g || !savedEntry) return;
    dispose();
    on.value = true;
    const ent = savedEntry;
    const c = createScenePipeline({
      container: el,
      layers: ent.layers,
      viewport: ent.viewport,
      lib: g,
      preserveDrawingBuffer: true,
      skipWhenHidden: false,       // 验收采样需持续出帧（后台标签 rAF 本身会被浏览器暂停）
      stageCss: 'width:100%;max-width:960px;height:auto;aspect-ratio:16/9;display:block;',
      onSettled({ items: settledItems, missing }) {
        missingKeys.value = missing;
        if (settledItems.length === 0) return;
        ready.value = true;
      },
      onError(msg) {
        error.value = msg;
      },
    });
    ctrl = c;
  }

  function enable(entry: LayerEntryRef, paused: boolean): void {
    on.value = true;
    void nextTick().then(() => {
      void mount(entry).then(() => {
        ctrl?.setPaused(paused);
      });
    });
  }

  function set(turnedOn: boolean, paused: boolean): void {
    if (on.value === turnedOn) return;
    if (!turnedOn) {
      dispose();
      return;
    }
    on.value = true;
    void nextTick().then(() => {
      void mount().then(() => {
        ctrl?.setPaused(paused);
      });
    });
  }

  function setPaused(paused: boolean): void {
    ctrl?.setPaused(paused);
  }

  function canvas(): HTMLCanvasElement | null {
    return ctrl?.canvas ?? null;
  }

  return {
    on, ready, error, containerRef, registerEl, missingKeys,
    dispose, enable, set, setPaused, canvas,
  };
}