/**
 * kv-acceptance.ts 验收判定引擎纯函数测试（判定阈值 / reasons 聚合 / 报告文本）
 * 像素采样（pixels.ts）依赖 canvas/WebGL，由人工验收台验证；此处仅测判定与报告逻辑。
 */
import { describe, expect, it } from 'vitest';
import {
  type AcceptSceneSnapshot,
  NEAR_BLACK_FAIL,
  NEAR_BLACK_WARN,
  buildAcceptReportText,
  judgeAccept,
  nearBlackClass,
} from '../kv-acceptance';

/** 全绿快照基线：逐层 OK + 合并就绪 + 无缺失 + 正常近黑占比 */
const okSnapshot = (over: Partial<AcceptSceneSnapshot> = {}): AcceptSceneSnapshot => ({
  key: 'home-bg',
  loadError: '',
  layers: [
    { status: 'ok', error: '', label: '01_bg', loadMs: 120 },
    { status: 'ok', error: '', label: '02_char', loadMs: 80 },
  ],
  mergedReady: true,
  mergedError: '',
  missingKeys: [],
  nearBlackPct: 1.4,
  aborted: false,
  ...over,
});

describe('judgeAccept', () => {
  it('全绿快照 → PASS（无 reason）', () => {
    const item = judgeAccept(okSnapshot(), 3210);
    expect(item.verdict).toBe('PASS');
    expect(item.reason).toBe('');
    expect(item.layerOk).toBe(2);
    expect(item.layerTotal).toBe(2);
    expect(item.loadMs).toBe(200); // 各层 loadMs 求和
    expect(item.durationMs).toBe(3210);
    expect(item.aborted).toBe(false);
  });

  it(`近黑占比 ≥ ${NEAR_BLACK_FAIL}% → FAIL 且 reason 含疑似黑块`, () => {
    const item = judgeAccept(okSnapshot({ nearBlackPct: NEAR_BLACK_FAIL }), 100);
    expect(item.verdict).toBe('FAIL');
    expect(item.reason).toContain('疑似黑块');
  });

  it(`近黑占比处于 WARN 区间（${NEAR_BLACK_WARN}%~${NEAR_BLACK_FAIL}%）不判 FAIL`, () => {
    const item = judgeAccept(okSnapshot({ nearBlackPct: NEAR_BLACK_WARN + 1 }), 100);
    expect(item.verdict).toBe('PASS');
  });

  it('nearBlackPct 为 null（采样未执行）不判 FAIL', () => {
    expect(judgeAccept(okSnapshot({ nearBlackPct: null }), 100).verdict).toBe('PASS');
  });

  it('层加载失败 → FAIL + failedLayers 明细（label: error）', () => {
    const item = judgeAccept(okSnapshot({
      layers: [
        { status: 'ok', error: '', label: '01_bg', loadMs: 10 },
        { status: 'fail', error: 'HTTP 404', label: '03_fx', loadMs: 0 },
      ],
    }), 100);
    expect(item.verdict).toBe('FAIL');
    expect(item.failedLayers).toEqual(['03_fx: HTTP 404']);
    expect(item.reason).toContain('1 层加载失败');
  });

  it('合并渲染失败 → FAIL（带 mergedError 文案；空文案降级为「超时」）', () => {
    const item = judgeAccept(okSnapshot({ mergedReady: false, mergedError: 'WebGL 不可用' }), 100);
    expect(item.reason).toContain('合并渲染失败: WebGL 不可用');
    const item2 = judgeAccept(okSnapshot({ mergedReady: false }), 100);
    expect(item2.reason).toContain('合并渲染失败: 超时');
  });

  it('缺失层资源（已跳过）→ FAIL', () => {
    const item = judgeAccept(okSnapshot({ missingKeys: ['https://cdn/a.atlas'] }), 100);
    expect(item.reason).toContain('缺失 1 层资源');
  });

  it('空层 + loadError → FAIL 且 reason 直出加载错误', () => {
    const item = judgeAccept(okSnapshot({ layers: [], loadError: 'spine-player 运行时加载失败' }), 100);
    expect(item.verdict).toBe('FAIL');
    expect(item.reason).toContain('spine-player 运行时加载失败');
  });

  it('中止 → FAIL 且使用 abortReason（缺省「已中止」）', () => {
    expect(judgeAccept(okSnapshot({ aborted: true }), 100).reason).toBe('已中止');
    const item = judgeAccept(okSnapshot({ aborted: true, abortReason: '场景被外部操作切换' }), 100);
    expect(item.reason).toBe('场景被外部操作切换');
    expect(item.aborted).toBe(true);
  });

  it('多重异常 reasons 以「；」聚合', () => {
    const item = judgeAccept(okSnapshot({ mergedReady: false, missingKeys: ['x'] }), 100);
    expect(item.reason.split('；').length).toBe(2);
  });
});

describe('nearBlackClass', () => {
  it('null → is-off；< WARN → is-ok；≥ WARN → is-warn；≥ FAIL → is-fail', () => {
    expect(nearBlackClass(null)).toBe('is-off');
    expect(nearBlackClass(1.4)).toBe('is-ok');
    expect(nearBlackClass(NEAR_BLACK_WARN)).toBe('is-warn');
    expect(nearBlackClass(NEAR_BLACK_FAIL - 0.01)).toBe('is-warn');
    expect(nearBlackClass(NEAR_BLACK_FAIL)).toBe('is-fail');
  });
});

describe('buildAcceptReportText', () => {
  const passItem = judgeAccept(okSnapshot({ key: 'scene-a' }), 1200);
  const failItem = judgeAccept(okSnapshot({ key: 'scene-b', mergedReady: false }), 900);

  it('头部含日期 / runtime 版本 / PASS 汇总', () => {
    const text = buildAcceptReportText([passItem, failItem], '4.2.43', '2026-08-05 12:00:00');
    const [line1, line2] = text.split('\n');
    expect(line1).toBe('KV 场景验收报告 — 2026-08-05 12:00:00');
    expect(line2).toBe('runtime spine-player 4.2.43 | 场景 2 | PASS 1/2');
  });

  it('每场景一行：判定 / 层 / 合并 / nearBlack / 耗时；FAIL 附 reason', () => {
    const text = buildAcceptReportText([passItem, failItem], '4.2.43', 't');
    expect(text).toContain('[PASS] scene-a  层 2/2  合并 OK  nearBlack 1.40%  耗时 1200ms');
    expect(text).toContain('[FAIL] scene-b');
    expect(text).toContain('← 合并渲染失败: 超时');
  });

  it('nearBlackPct 为 null → 占位「-」', () => {
    const item = judgeAccept(okSnapshot({ key: 'k', nearBlackPct: null }), 10);
    expect(buildAcceptReportText([item], 'x', 't')).toContain('nearBlack -');
  });

  it('空报告仍输出头部', () => {
    const text = buildAcceptReportText([], '4.2.43', 't');
    expect(text).toContain('场景 0 | PASS 0/0');
  });
});
