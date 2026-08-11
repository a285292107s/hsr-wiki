/**
 * 主题强调色（Accent）选择
 * 常规模式主色可经设置页在预置色阶间切换；CW（货币战争）黑金模式独立，不受影响。
 * 实现：<html data-accent="..."> 驱动 tokens.css 的 [data-accent] 规则重映射 --th-* 色阶，
 * 语义层（--primary/--accent/--metric-val 等）经它自动跟随。缺省为 Terracotta。
 * 选择持久化于 localStorage（HSR_WIKI_ACCENT）。
 */

export type AccentKey = 'terracotta' | 'olive' | 'slate' | 'sand';

export interface AccentOption {
  /** localStorage 持久化键值 & <html data-accent> 值 */
  key: AccentKey;
  /** 设置页展示名 */
  label: string;
  /** 设置页展示的色板（色阶 300/400/500 三点，直观预览主题色向） */
  swatch: [string, string, string];
}

const STORAGE_KEY = 'HSR_WIKI_ACCENT';
/** 默认主题（缺省 / 非法值时回退） */
export const DEFAULT_ACCENT: AccentKey = 'terracotta';

/** 预置主题色（与 tokens.css 各 [data-accent] 色阶一一对应） */
export const ACCENTS: AccentOption[] = [
  { key: 'terracotta', label: '赤陶', swatch: ['#DE9A74', '#CC7648', '#B85C33'] },
  { key: 'olive', label: '橄榄青', swatch: ['#A8B88C', '#8A9B6A', '#6F7F4E'] },
  { key: 'slate', label: '雾霭蓝灰', swatch: ['#9FAFB9', '#7E919D', '#63767F'] },
  { key: 'sand', label: '暖沙棕', swatch: ['#C6AC82', '#AD8E5F', '#937447'] },
];

function isAccentKey(v: unknown): v is AccentKey {
  return typeof v === 'string' && ACCENTS.some((a) => a.key === v);
}

/** 读取持久化主题（非法/缺失回退默认） */
export function getSavedAccent(): AccentKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isAccentKey(v) ? v : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

/** 设置 <html data-accent>（不持久化；仅反映当前应用的主题状态） */
export function applyAccent(accent: AccentKey): void {
  const root = document.documentElement;
  if (accent === DEFAULT_ACCENT) delete root.dataset.accent;
  else root.dataset.accent = accent;
}

/** 持久化主题选择并应用到文档（设置页调用） */
export function setAccent(accent: AccentKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
  applyAccent(accent);
}

/** 应用初始化：读取持久化主题并写入 <html>（在路由首跳前执行，避免主题闪烁） */
export function initAccent(): void {
  applyAccent(getSavedAccent());
}