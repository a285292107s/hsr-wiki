// 验收编排测试：AcceptBridge 全 fake，时钟走真实定时器，不依赖 DOM
// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { useKvAcceptance, type AcceptBridge } from '../use-kv-acceptance';

const FAST = { pollMs: 5, settleDelayMs: 1, sceneTimeoutMs: 80 };

interface FakeState {
  key: string;
  epochN: number;
  keyLog: string[];
}

function makeBridge(over: Partial<AcceptBridge> = {}): AcceptBridge {
  const st: FakeState = { key: 'home-bg', epochN: 0, keyLog: [] };
  const base: AcceptBridge = {
    getKey: () => st.key,
    setSceneKey: (k) => {
      st.key = k;
      st.keyLog.push(k);
    },
    loadScene: async () => {
      st.epochN++;
    },
    epoch: () => st.epochN,
    loadKeys: async () => ['scene-a', 'scene-b'],
    settled: () => true,
    failFast: () => false,
    snapshot: (key) => ({
      key,
      loadError: '',
      layers: [{ status: 'ok' as const, error: '', label: 'l1', loadMs: 10 }],
      mergedReady: true,
      mergedError: '',
      missingKeys: [],
    }),
    mergedCanvas: () => null,
  };
  return { ...base, ...over };
}

describe('useKvAcceptance', () => {
  it('顺序验收全部场景：结算即 PASS，结束后恢复原场景', async () => {
    const bridge = makeBridge();
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    expect(accept.accepting.value).toBe(false);
    expect(accept.report.value).toHaveLength(2);
    expect(accept.report.value.map((r) => r.verdict)).toEqual(['PASS', 'PASS']);
    expect(accept.report.value.map((r) => r.key)).toEqual(['scene-a', 'scene-b']);
    expect(bridge.getKey()).toBe('home-bg');
  });

  it('无场景条目：写入错误提示且不产出报告', async () => {
    const bridge = makeBridge({ loadKeys: async () => [] });
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    expect(accept.error.value).toContain('无 official-scene 条目');
    expect(accept.report.value).toHaveLength(0);
  });

  it('中止：轮询退出判 aborted，后续场景不再执行', async () => {
    const bridge = makeBridge({ settled: () => false });
    const accept = useKvAcceptance(bridge, FAST);
    const p = accept.run();
    await new Promise((r) => setTimeout(r, 20));
    accept.cancel();
    await p;
    expect(accept.report.value).toHaveLength(1);
    expect(accept.report.value[0].aborted).toBe(true);
    expect(accept.report.value[0].reason).toContain('已中止');
  });

  it('超时：始终未结算 → FAIL（合并渲染超时）', async () => {
    const bridge = makeBridge({
      settled: () => false,
      loadKeys: async () => ['scene-a'],
      snapshot: (key) => ({
        key,
        loadError: '',
        layers: [{ status: 'ok' as const, error: '', label: 'l1', loadMs: 10 }],
        mergedReady: false,
        mergedError: '',
        missingKeys: [],
      }),
    });
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    const item = accept.report.value[0];
    expect(item.verdict).toBe('FAIL');
    expect(item.aborted).toBe(false);
    expect(item.reason).toContain('合并渲染失败');
  });

  it('快速失败：条目加载失败（无层 + 有错误）无需等待轮询', async () => {
    const loadScene = vi.fn(async () => undefined);
    const bridge = makeBridge({
      loadKeys: async () => ['scene-a'],
      loadScene,
      settled: () => false,
      failFast: () => true,
      snapshot: (key) => ({
        key,
        loadError: '运行时加载失败',
        layers: [],
        mergedReady: false,
        mergedError: '',
        missingKeys: [],
      }),
    });
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    const item = accept.report.value[0];
    expect(loadScene).toHaveBeenCalledWith('scene-a');
    expect(item.verdict).toBe('FAIL');
    expect(item.layerTotal).toBe(0);
    expect(item.reason).toContain('运行时加载失败');
  });

  it('重验：仅重跑指定场景并原位替换报告行', async () => {
    const bridge = makeBridge();
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    expect(accept.reacceptingKey.value).toBe(null);
    await accept.reaccept('scene-b');
    expect(accept.report.value).toHaveLength(2);
    expect(accept.report.value[1].key).toBe('scene-b');
    expect(accept.report.value[1].verdict).toBe('PASS');
  });

  it('报告载荷：文本含判定行，JSON 载荷含 items', async () => {
    const bridge = makeBridge({ loadKeys: async () => ['scene-a'] });
    const accept = useKvAcceptance(bridge, FAST);
    await accept.run();
    expect(accept.reportText()).toContain('[PASS] scene-a');
    const payload = accept.reportJsonPayload() as { items: unknown[] };
    expect(payload.items).toHaveLength(1);
  });
});
