/**
 * 单层模式 player 管理（SpineDebugView 专用 composable）：
 * 每层一个独立 SpinePlayer，呈现该层独立渲染画面（逐层状态可视化）。
 *
 * 职责边界：只管单层 player 的创建 / 释放与播放控制；
 * 场景加载编排与验收循环在视图层与 use-kv-acceptance.ts。
 */
import { nextTick, ref } from 'vue';
import type { SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';
import { buildOfficialConfig } from '../../lib/spine/config';
import { disposePlayer, pickAnimName } from '../../lib/spine/player';
import type { SpinePlayerCtor, SpinePlayerInstance } from '../../lib/spine/types';

/** 单层画布衬底色（不透明深蓝，与舞台底纹同色系）：
 *  使混合 slot（screen/additive）的 dst 非透明 → 消除「对透明 dst 退化」产生的黑块。
 *  黑块成因已定论（见 docs/单层模式透明画布黑块成因与衬底方案.md），衬底固定启用；
 *  逐层「透明对照」不再保留——验收与人工确认以合并渲染（生产基线）为准。 */
export const LAYER_BG = '0d1326';

export interface LayerState {
  idx: number;
  label: string;
  status: 'loading' | 'ok' | 'fail';
  error: string;
  loadMs: number;
}

/** 场景条目快照（重建用：保持与创建时一致） */
export interface LayerEntryRef {
  viewport: SpineSceneEntry['viewport'];
  layers: SpineResolvedSceneLayer[];
}

export function useSingleLayers() {
  const layers = ref<LayerState[]>([]);
  /** 存活的单层 player 数（= 占用的 WebGL 上下文数） */
  const playerAlive = ref(0);
  const els = new Map<number, HTMLElement>();

  let players: (SpinePlayerInstance | undefined)[] = [];

  /** 模板 ref 回调：注册/注销层舞台元素（传 null = 元素卸载，清理避免滞留 DOM 引用） */
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

  /** 重置层状态并释放全部 player（场景切换入口） */
  function reset(): void {
    disposeAll();
    layers.value = [];
  }

  /** 为某层创建 SpinePlayer（参数固定：预乘 OFF + 深色衬底，与生产基线一致） */
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
          } catch { /* 静默 */ }
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

  /** 初始化：由场景条目填充层状态并逐层创建 player（等舞台元素挂载后再建） */
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

  /* ─── 播放控制（单层侧；暂停状态由视图层统一持有） ─── */

  function setPausedAll(paused: boolean): void {
    for (const p of players) {
      if (!p) continue;
      try {
        if (paused) p.pause();
        else p.resume ? p.resume() : p.play(); // 4.1 运行时无 resume（本页为 4.2 场景语境，存在性判断仅防契约漂移）
      } catch { /* 静默 */ }
    }
  }

  return {
    layers, playerAlive,
    registerEl, reset, disposeAll, initLayers,
    setPausedAll,
  };
}
