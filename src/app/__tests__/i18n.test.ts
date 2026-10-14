/**
 * UI 词典的**复数形式**契约（vue-i18n 的 `|` 语法，`{n}` 隐式触发）。
 *
 * 计数类文案（`{n} stages` / `{n} уровней`）在 n=1 时必须走单数形式。俄语理论上还要区分
 * 2–4 与 5+ 两档，但**本配置取不到**：`src/app/i18n.ts` 未声明 `pluralizationRules`，
 * vue-i18n 也不按 `Intl.PluralRules` 的 one/few/many 选形 ⇒ 词典只给两形式，2–4 走复数。
 * 这里钉住的就是这个实际行为（快照生成器 `uiT()` 必须与之一致）。
 */
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
    /* 俄语的三形式（1 / 2–4 / 5+）在本配置下取不到：vue-i18n 既不调用 `pluralizationRules`
       （实测规则函数零调用），也不按 `Intl.PluralRules` 的 one/few/many 选形 ⇒ 只有两形式可用。
       两形式对 1 与 5+ 正确，2–4 仍走复数（比只有一种写法更接近，且不回归）。 */
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
