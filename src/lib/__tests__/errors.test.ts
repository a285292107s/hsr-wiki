// @vitest-environment node
/**
 * `userErrorDetail`：错误态「详情行」要不要渲染。
 *
 * 背景：`CatalogPage` / `EndgameView` / `EndgameModeView` 曾把 `e.message` 直接渲染进错误态，
 * 而 `NkError` 的 message 是**内部诊断**（机检白名单按此归类，文案为中文）⇒ 非缺省语言用户
 * 会在界面上看到中文诊断（如「角色数据缺少必要字段: …」）。现在 operational 错误只进控制台，
 * 界面用本地化标题 + 重试；非 NkError（编程错误）仍原样暴露。
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NkError, userErrorDetail } from '../errors';

afterEach(() => vi.restoreAllMocks());

describe('userErrorDetail', () => {
  it('operational NkError：不渲染详情，只留控制台痕迹', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(userErrorDetail(new NkError('遗器套装不存在: 101'))).toBe('');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0].join(' ')).toContain('遗器套装不存在');
  });

  it('非 operational 的 NkError：原样暴露（编程错误要能看见）', () => {
    expect(userErrorDetail(new NkError('配置缺少 fetchData', false))).toBe('配置缺少 fetchData');
  });

  it('普通 Error / 非 Error：原样返回文本', () => {
    expect(userErrorDetail(new Error('boom'))).toBe('boom');
    expect(userErrorDetail('plain')).toBe('plain');
    expect(userErrorDetail(undefined)).toBe('undefined');
  });
});
