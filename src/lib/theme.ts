
export type AccentKey = 'terracotta' | 'olive' | 'slate' | 'sand' | 'iris';

export interface AccentOption {

  key: AccentKey;

  labelKey: string;

  swatch: [string, string, string];
}

const STORAGE_KEY = 'HSR_WIKI_ACCENT';

export const DEFAULT_ACCENT: AccentKey = 'olive';

export const ACCENTS: AccentOption[] = [
  { key: 'terracotta', labelKey: 'theme.accent.terracotta', swatch: ['#DE9A74', '#CC7648', '#B85C33'] },
  { key: 'olive', labelKey: 'theme.accent.olive', swatch: ['#A8B88C', '#8A9B6A', '#6F7F4E'] },
  { key: 'slate', labelKey: 'theme.accent.slate', swatch: ['#9FAFB9', '#7E919D', '#63767F'] },
  { key: 'sand', labelKey: 'theme.accent.sand', swatch: ['#C6AC82', '#AD8E5F', '#937447'] },
  { key: 'iris', labelKey: 'theme.accent.iris', swatch: ['#B0A6D4', '#9184BE', '#786BA8'] },
];

function isAccentKey(v: unknown): v is AccentKey {
  return typeof v === 'string' && ACCENTS.some((a) => a.key === v);
}

export function getSavedAccent(): AccentKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isAccentKey(v) ? v : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

export function applyAccent(accent: AccentKey): void {
  const root = document.documentElement;
  if (accent === DEFAULT_ACCENT) delete root.dataset.accent;
  else root.dataset.accent = accent;
}

export function setAccent(accent: AccentKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
  }
  applyAccent(accent);
}

export function initAccent(): void {
  applyAccent(getSavedAccent());
}
