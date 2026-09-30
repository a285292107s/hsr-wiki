
export type CwAccentKey = 'gold' | 'rose' | 'silver' | 'emerald' | 'copper';

export interface CwAccentOption {

  key: CwAccentKey;

  label: string;

  swatch: [string, string, string];
}

const STORAGE_KEY = 'HSR_WIKI_CW_ACCENT';

export const DEFAULT_CW_ACCENT: CwAccentKey = 'gold';

export const CW_ACCENTS: CwAccentOption[] = [
  { key: 'gold', label: '香槟金', swatch: ['#FCD34D', '#FBBF24', '#D4AF37'] },
  { key: 'rose', label: '玫瑰金', swatch: ['#F1C4BA', '#DB8D7D', '#C67360'] },
  { key: 'silver', label: '铂银', swatch: ['#D9E0E6', '#AAB7C2', '#8C9AA7'] },
  { key: 'emerald', label: '翡翠', swatch: ['#A9D3B9', '#6EAC81', '#539260'] },
  { key: 'copper', label: '赤铜', swatch: ['#ECC09B', '#D4905E', '#BC7345'] },
];

function isCwAccentKey(v: unknown): v is CwAccentKey {
  return typeof v === 'string' && CW_ACCENTS.some((a) => a.key === v);
}

export function getSavedCwAccent(): CwAccentKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isCwAccentKey(v) ? v : DEFAULT_CW_ACCENT;
  } catch {
    return DEFAULT_CW_ACCENT;
  }
}

export function applyCwAccent(accent: CwAccentKey): void {
  const root = document.documentElement;
  if (accent === DEFAULT_CW_ACCENT) delete root.dataset.cwAccent;
  else root.dataset.cwAccent = accent;
}

export function setCwAccent(accent: CwAccentKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
  applyCwAccent(accent);
}

export function initCwAccent(): void {
  applyCwAccent(getSavedCwAccent());
}
