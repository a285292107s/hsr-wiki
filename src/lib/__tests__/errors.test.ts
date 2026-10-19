// @vitest-environment node
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
