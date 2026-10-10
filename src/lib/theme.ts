
export type AccentKey = 'terracotta' | 'olive' | 'slate' | 'sand' | 'iris';

export interface AccentOption {

  key: AccentKey;

  /** 词典键（模块加载期不能翻译，展示时由视图解析） */
  labelKey: string;

  swatch: [string, string, string];
}

const STORAGE_KEY = 'HSR_WIKI_ACCENT';

/** 缺省主题色 = 橄榄青（`--th-*` 默认块同样指向 `--ol-*`，两处必须一致；改一处即视为契约变更） */
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
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
  applyAccent(accent);
}

export function initAccent(): void {
  applyAccent(getSavedAccent());
}
