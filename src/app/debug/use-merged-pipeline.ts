/**
 * 合并渲染管线 composable（SpineDebugView 专用）：
 * 复用生产场景管线 createScenePipeline（单 canvas 顺序绘制全部层）。
 *
 * 职责边界：管线 mount / dispose / 暂停（合并侧）；
 * 验收基线 = 生产渲染由「同一管线实现」保证；暂停状态由视图层统一持有。
 * 关键约束：rAF 循环与 WebGL 上下文必须经 dispose 释放（视图 onBeforeUnmount 调用）。
 */
import { nextTick, ref } from 'vue';
import { getSpineLib } from '../../spine/runtime';
import { createScenePipeline } from '../../spine/scene';
import type { SpineScenePipelineController } from '../../spine/types';
import type { LayerEntryRef } from './use-single-layers';

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
