import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildHeroFocusCss, clampFocus, DEFAULT_FOCUS, FOCUS_LIMITS, getHeroFocus, heroFocusStyleVars, HERO_POS_VAR,
  getFocusRoles, setFocusRoles, setRoleFocus, removeRoleFocus,
} from '../currency-hero-focus';

describe('currency-hero-focus', () => {
  beforeEach(() => {
    setFocusRoles({});
  });

  it('clampFocus 夹紧到合法区间（x/y 0–100，scale 有上下限）', () => {
    expect(clampFocus({ x: -20, y: 140, scale: 0.1 })).toEqual({
      x: 0, y: 100, scale: FOCUS_LIMITS.scaleMin,
    });
    expect(clampFocus({ x: 50, y: 50, scale: 99 })).toEqual({
      x: 50, y: 50, scale: FOCUS_LIMITS.scaleMax,
    });
  });

  it('buildHeroFocusCss 产出 position 与 scale 两条声明', () => {
    expect(buildHeroFocusCss('--pos', { x: 38, y: 30, scale: 1.4 }))
      .toBe('--pos: 38% 30%; --pos-scale: 1.4;');
  });

  it('未配置的角色返回 undefined，且不产生任何内联变量（保持默认 right center）', () => {
    expect(getHeroFocus('__mh_absent__')).toBeUndefined();
    expect(heroFocusStyleVars('__mh_absent__')).toEqual({});
  });

  it('DEFAULT_FOCUS 复现旧的 right center 取景', () => {
    expect(DEFAULT_FOCUS).toEqual({ x: 100, y: 50, scale: 1 });
    expect(HERO_POS_VAR).toBe('--nk-crole-hero-pos');
  });

  it('setRoleFocus 立即反映到 getHeroFocus / heroFocusStyleVars（保存后即时生效）', () => {
    setRoleFocus('1001', { x: 42, y: 18, scale: 1.2 });
    expect(getHeroFocus('1001')).toEqual({ x: 42, y: 18, scale: 1.2 });
    expect(heroFocusStyleVars('1001')).toEqual({
      [HERO_POS_VAR]: '42% 18%',
      [`${HERO_POS_VAR}-scale`]: '1.2',
    });
  });

  it('removeRoleFocus 落到默认取景（不再注入变量）', () => {
    setRoleFocus('1001', { x: 10, y: 10, scale: 1.5 });
    removeRoleFocus('1001');
    expect(getHeroFocus('1001')).toBeUndefined();
    expect(heroFocusStyleVars('1001')).toEqual({});
  });

  it('setFocusRoles 整表替换且与入参解耦（不共享可变引用）', () => {
    const input = { '1003': { x: 20, y: 70, scale: 1 } };
    setFocusRoles(input);
    input['1003'].x = 999;
    expect(getFocusRoles()['1003']).toEqual({ x: 20, y: 70, scale: 1 });
  });
});
