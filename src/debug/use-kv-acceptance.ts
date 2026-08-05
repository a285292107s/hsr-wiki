/**
 * 一键验收编排 composable（SpineDebugView 专用）：
 * 顺序跑全部 official-scene —— 加载 → 轮询结算 → 黑块采样 → 交判定引擎（kv-acceptance.ts）出 PASS/FAIL。
 *
 * 场景控制与渲染状态经 AcceptBridge 由视图层注入（依赖倒置）：
 * 本模块不依赖 Vue 视图 / 路由 / 渲染实现，轮询、中止、超时逻辑可独立单测。
 */
import { ref } from 'vue';
import { SPINE_RUNTIME_VERSION } from '../spine/constants';
import {
  type AcceptItem, type AcceptSceneSnapshot, buildAcceptReportText, judgeAccept,
} from './kv-acceptance';
import { sampleNearBlackPct } from './pixels';

/** 单场景验收超时（超时后按未结算状态交判定引擎，合并未就绪 → FAIL） */
export const ACCEPT_SCENE_TIMEOUT_MS = 90_000;
/** 结算轮询间隔（中止响应延迟上界） */
const POLL_MS = 300;
/** 结算后额外等待一拍，确保合并画布已绘制首帧（像素采样需要） */
const SETTLE_DELAY_MS = 500;

/** 验收台与视图层之间的状态投影契约（测试可注入假实现） */
export interface AcceptBridge {
  /** 当前场景键（验收结束后恢复用） */
  getKey(): string;
  /** 写入 sceneKey 与 URL（验收期间逐场景改写） */
  setSceneKey(key: string): void;
  /** 加载场景（内部释放旧资源；完成后 epoch() 应已递增） */
  loadScene(key: string): Promise<void>;
  /** 场景代际：与加载完成时捕获值不同 = 被外部操作抢占，轮询中止 */
  epoch(): number;
  /** spine-manifest 场景键列表（工具条下拉与验收共用） */
  loadKeys(): Promise<string[]>;
  /** 全部层与合并管线已结算（层非空、无 loading、合并 ready 或 error） */
  settled(): boolean;
  /** 场景条目本身加载失败（无层 + 有错误）→ 无需等待直接判定 */
  failFast(): boolean;
  /** 渲染状态投影（aborted / nearBlackPct 由验收流程补齐） */
  snapshot(key: string): Omit<AcceptSceneSnapshot, 'aborted' | 'abortReason' | 'nearBlackPct'>;
  /** 合并画布（黑块采样入口；未就绪返回 null） */
  mergedCanvas(): HTMLCanvasElement | null;
}

export interface AcceptTiming {
  sceneTimeoutMs?: number;
  pollMs?: number;
  settleDelayMs?: number;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export function useKvAcceptance(deps: AcceptBridge, timing: AcceptTiming = {}) {
  const timeoutMs = timing.sceneTimeoutMs ?? ACCEPT_SCENE_TIMEOUT_MS;
  const pollMs = timing.pollMs ?? POLL_MS;
  const settleDelayMs = timing.settleDelayMs ?? SETTLE_DELAY_MS;

  const accepting = ref(false);
  const progress = ref('');
  const report = ref<AcceptItem[]>([]);
  const error = ref('');
  /** 报告行「重验」进行中的场景（行内按钮禁用） */
  const reacceptingKey = ref<string | null>(null);
  /** 中止验收标志（普通变量即可，无需响应式） */
  let cancelled = false;
  /** 视图已卸载标志：轮询检测到即中止（路由离开后旧循环不再继续跑场景） */
  let disposed = false;

  /** 验收单个场景：加载 → 等全部层与合并管线结算 → 采样 → 投影快照交引擎判定 */
  async function acceptScene(key: string): Promise<AcceptItem> {
    const t0 = performance.now();
    deps.setSceneKey(key);
    await deps.loadScene(key);
    const epoch = deps.epoch(); // 捕获本场景代际：外部 loadScene 抢占会使轮询中止
    const deadline = t0 + timeoutMs;
    let aborted = false;
    let abortReason = '已中止';
    while (performance.now() < deadline) {
      // 中止 / 视图卸载 / 场景被外部切换：立即退出，不空转
      if (cancelled || disposed || deps.epoch() !== epoch) {
        aborted = true;
        abortReason = cancelled ? '已中止' : disposed ? '组件已卸载' : '场景被外部操作切换';
        break;
      }
      // 场景条目本身加载失败（非 official-scene / 运行时不可达）时无需等待，直接判定
      if (deps.failFast()) break;
      // 合并管线 settled 由 createScenePipeline 保证必结算一次（含失败路径），不会挂起
      if (deps.settled()) break;
      await sleep(pollMs);
    }
    await sleep(settleDelayMs); // 多等一拍确保合并画布已绘制首帧（像素采样需要）
    const base = deps.snapshot(key);
    const canvas = deps.mergedCanvas();
    const nearBlackPct = canvas && base.mergedReady ? sampleNearBlackPct(canvas) : null;
    return judgeAccept({ ...base, nearBlackPct, aborted, abortReason }, performance.now() - t0);
  }

  /**
   * 一键验收：顺序跑全部场景（每场景结束后释放 WebGL 上下文再进下一个，不超浏览器配额）。
   * 可随时中止；结束后恢复验收前的场景。
   */
  async function run(): Promise<void> {
    if (accepting.value) return;
    accepting.value = true;
    cancelled = false;
    report.value = [];
    error.value = '';
    const originalKey = deps.getKey(); // 验收结束后恢复此场景（期间 sceneKey 被逐场景改写）
    try {
      const keys = await deps.loadKeys();
      if (keys.length === 0) {
        error.value = 'spine-manifest 中无 official-scene 条目（KV 场景尚未接入）';
        return;
      }
      for (let i = 0; i < keys.length; i++) {
        if (cancelled) break;
        progress.value = `验收 ${i + 1}/${keys.length} — ${keys[i]}`;
        const item = await acceptScene(keys[i]);
        report.value = [...report.value, item];
        if (item.aborted) break;
      }
    } catch (e) {
      error.value = String(e);
    } finally {
      accepting.value = false;
      progress.value = '';
      cancelled = false;
      if (deps.getKey() !== originalKey) {
        deps.setSceneKey(originalKey);
        void deps.loadScene(originalKey);
      }
    }
    // 保持原语义：恢复加载为异步副作用，不阻塞 run 结算
  }

  /** 中止一键验收：置取消标志；当前场景轮询最快一拍内退出，场景间不再继续 */
  function cancel(): void {
    cancelled = true;
  }

  /** 报告行「重验」：仅重跑该场景，结束后停留在该场景（不强制恢复） */
  async function reaccept(key: string): Promise<void> {
    if (accepting.value || reacceptingKey.value) return;
    reacceptingKey.value = key;
    try {
      const item = await acceptScene(key);
      const idx = report.value.findIndex((r) => r.key === key);
      if (idx >= 0) report.value[idx] = item;
    } finally {
      reacceptingKey.value = null;
    }
  }

  /** 视图卸载时调用：轮询检测到即中止 */
  function markDisposed(): void {
    disposed = true;
  }

  /** 验收报告纯文本（复制剪贴板用） */
  function reportText(): string {
    return buildAcceptReportText(report.value, SPINE_RUNTIME_VERSION);
  }

  /** 验收报告 JSON 载荷（下载用） */
  function reportJsonPayload(): unknown {
    return { generatedAt: new Date().toISOString(), runtime: SPINE_RUNTIME_VERSION, items: report.value };
  }

  return {
    accepting, progress, report, error, reacceptingKey,
    run, cancel, reaccept, markDisposed,
    reportText, reportJsonPayload,
  };
}
