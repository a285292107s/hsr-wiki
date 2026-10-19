import { describe, it, expect, afterAll } from 'vitest';
import { i18n, setI18nLocale } from '../i18n';

const t = i18n.global.t;

afterAll(() => setI18nLocale('cn'));

describe('复数形式（计数类文案）', () => {
  it('英语：1 用单数、其余用复数', () => {
    setI18nLocale('en');
    expect(t('vor.stageCount', { n: 1 })).toBe('1 stage');
    expect(t('vor.stageCount', { n: 2 })).toBe('2 stages');
    expect(t('vor.stageCount', { n: 0 })).toBe('0 stages');
    expect(t('egm.value.floors', { n: 1 })).toBe('1 tier');
    expect(t('egm.value.floors', { n: 3 })).toBe('3 tiers');
  });

  it('俄语：1 用单数、其余用复数（两形式）', () => {
    setI18nLocale('ru');
    expect(t('vor.stageCount', { n: 1 })).toBe('1 этап');
    expect(t('vor.stageCount', { n: 5 })).toBe('5 этапов');
    expect(t('vor.stageCount', { n: 21 })).toBe('21 этапов');
  });

  it('无单复数区分的语言：始终一种写法', () => {
    setI18nLocale('jp');
    expect(t('vor.stageCount', { n: 1 })).toBe('1 ステージ');
    expect(t('vor.stageCount', { n: 5 })).toBe('5 ステージ');
  });
});
