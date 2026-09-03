/**
 * 场景渲染编排 composable（SpineDebugView 专用）：
 * 单层模式（每层独立 SpinePlayer，逐层状态可视化）+ 合并模式
 * （复用生产场景管线 createScenePipeline，单 canvas 顺序绘制全部层）。
 *
 * 职责边界：只管 player / 管线的创建、释放与播放控制；
 * 场景加载编排与验收循环在视图层与 use-kv-acceptance.ts。
 * 关键约束：rAF 循环与 WebGL 上下文必须经 dispose / disposeAll 释放（视图 onBeforeUnmount 调用）。
 */
import { nextTick, ref } from 'vue';
import type { SpineResolvedSceneLayer, SpineSceneEntry } from '../../services/types';
import { buildOfficialConfig } from '../../spine/config';
import { disposePlayer, pickAnimName } from '../../spine/player';
import { getSpineLib } from '../../spine/runtime';
import { createScenePipeline } from '../../spine/scene';
import type { SpinePlayerCtor, SpinePlayerInstance, SpineScenePipelineController } from '../../spine/types';

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

/* ─── 单层模式：每层一个独立 SpinePlayer ─── */

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

/* ─── 合并模式：生产场景管线（单 canvas 顺序绘制全部层） ─── */

export function useMergedPipeline() {
  const on = ref(false);
  const ready = ref(false);
  const error = ref('');
  const containerRef = ref<HTMLElement | null>(null);
  /** 合并渲染中因资源缺失被跳过的层 atlas（验收判定为 FAIL 的依据） */
  const missingKeys = ref<string[]>([]);

  /** 合并渲染管线控制器（生产同款 createScenePipeline；teardown 释放 rAF + WebGL 上下文） */
  let ctrl: SpineScenePipelineController | null = null;
  /** 最近一次挂载的条目（关/开切换时复用；dispose 不清除） */
  let savedEntry: LayerEntryRef | null = null;

  /** 模板 ref 回调：注册合并舞台容器元素（传 null = 元素卸载） */
  function registerEl(el: unknown): void {
    containerRef.value = el instanceof HTMLElement ? el : null;
  }

  function dispose(): void {
    if (ctrl) {
      ctrl.teardown(); // teardown 后管线内部 cancelled 闸门阻断一切异步回调，无过期写入风险
      ctrl = null;
    }
    on.value = false;
    ready.value = false;
    error.value = '';
    missingKeys.value = [];
  }

  /** 挂载管线：entry 缺省时复用最近一次条目（关/开切换场景） */
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
      preserveDrawingBuffer: true, // PNG 导出 / 黑块采样需稳定像素读回
      skipWhenHidden: false,       // 验收采样需持续出帧（后台标签 rAF 本身会被浏览器暂停）
      // 流式布局：宽度自适应收缩（小屏），buffer 比例由管线恒等于 viewport 比例
      stageCss: 'width:100%;max-width:960px;height:auto;aspect-ratio:16/9;display:block;',
      onSettled({ items: settledItems, missing }) {
        missingKeys.value = missing;
        if (settledItems.length === 0) return; // 「全部层缺失」由 onError 写入 error
        ready.value = true;
      },
      onError(msg) {
        error.value = msg;
      },
    });
    ctrl = c;
  }

  /** 启用（场景加载后调用）：等容器元素挂载后再建管线 */
  function enable(entry: LayerEntryRef, paused: boolean): void {
    on.value = true;
    void nextTick().then(() => {
      void mount(entry).then(() => {
        ctrl?.setPaused(paused); // 继承当前播放状态（单层暂停后切回合并模式时保持一致）
      });
    });
  }

  /** 开关切换（工具条单选组）：关闭立即释放；开启复用最近条目 */
  function set(turnedOn: boolean, paused: boolean): void {
    if (on.value === turnedOn) return;
    if (!turnedOn) {
      dispose();
      return;
    }
    on.value = true; // 先点亮使 v-if 容器渲染，元素挂载后再建管线
    void nextTick().then(() => {
      void mount().then(() => {
        ctrl?.setPaused(paused);
      });
    });
  }

  /* ─── 播放控制（合并侧；暂停状态由视图层统一持有） ─── */

  function setPaused(paused: boolean): void {
    ctrl?.setPaused(paused); // 管线 rAF 循环照常出帧，仅 delta 置零
  }

  /** 渲染画布（像素采样 / PNG 导出入口；未挂载返回 null） */
  function canvas(): HTMLCanvasElement | null {
    return ctrl?.canvas ?? null; // 管线 preserveDrawingBuffer=true，像素稳定可读
  }

  return {
    on, ready, error, containerRef, registerEl, missingKeys,
    dispose, enable, set, setPaused, canvas,
  };
}