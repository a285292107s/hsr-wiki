import { ref } from 'vue';
import { SPINE_RUNTIME_VERSION } from '../../spine/constants';
import {
  type AcceptItem, type AcceptSceneSnapshot, buildAcceptReportText, judgeAccept,
} from './kv-acceptance';
import { sampleNearBlackPct } from './pixels';

export const ACCEPT_SCENE_TIMEOUT_MS = 90_000;
const POLL_MS = 300;
/** 结算后额外等待一拍，确保合并画布已绘制首帧（像素采样需要） */
const SETTLE_DELAY_MS = 500;

export interface AcceptBridge {
  getKey(): string;
  setSceneKey(key: string): void;
  loadScene(key: string): Promise<void>;
  epoch(): number;
  loadKeys(): Promise<string[]>;
  settled(): boolean;
  failFast(): boolean;
  snapshot(key: string): Omit<AcceptSceneSnapshot, 'aborted' | 'abortReason' | 'nearBlackPct'>;
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
  const reacceptingKey = ref<string | null>(null);
  let cancelled = false;
  let disposed = false;

  async function acceptScene(key: string): Promise<AcceptItem> {
    const t0 = performance.now();
    deps.setSceneKey(key);
    await deps.loadScene(key);
    const epoch = deps.epoch();
    const deadline = t0 + timeoutMs;
    let aborted = false;
    let abortReason = '已中止';
    while (performance.now() < deadline) {
      if (cancelled || disposed || deps.epoch() !== epoch) {
        aborted = true;
        abortReason = cancelled ? '已中止' : disposed ? '组件已卸载' : '场景被外部操作切换';
        break;
      }
      if (deps.failFast()) break;
      if (deps.settled()) break;
      await sleep(pollMs);
    }
    await sleep(settleDelayMs);
    const base = deps.snapshot(key);
    const canvas = deps.mergedCanvas();
    const nearBlackPct = canvas && base.mergedReady ? sampleNearBlackPct(canvas) : null;
    return judgeAccept({ ...base, nearBlackPct, aborted, abortReason }, performance.now() - t0);
  }

  async function run(): Promise<void> {
    if (accepting.value) return;
    accepting.value = true;
    cancelled = false;
    report.value = [];
    error.value = '';
    const originalKey = deps.getKey();
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
  }

  function cancel(): void {
    cancelled = true;
  }

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

  function markDisposed(): void {
    disposed = true;
  }

  function reportText(): string {
    return buildAcceptReportText(report.value, SPINE_RUNTIME_VERSION);
  }

  function reportJsonPayload(): unknown {
    return { generatedAt: new Date().toISOString(), runtime: SPINE_RUNTIME_VERSION, items: report.value };
  }

  return {
    accepting, progress, report, error, reacceptingKey,
    run, cancel, reaccept, markDisposed,
    reportText, reportJsonPayload,
  };
}
