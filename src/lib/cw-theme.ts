/**
 * 货币战争主题色（CW Accent）选择
 * CW 模式主色可经设置页在预置色阶间切换，与常规模式（theme.ts / data-accent）独立、互不影响。
 * 实现：<html data-cw-accent="..."> 驱动 tokens.css 的
 * [data-theme="cw"][data-cw-accent] 规则重映射 --cwth-* 色阶别名层，
 * CW 语义层（--primary/--accent/--metric-val 等）经它自动跟随。缺省为香槟金 gold。
 * 选择持久化于 localStorage（HSR_WIKI_CW_ACCENT）。
 */

export type CwAccentKey = 'gold' | 'rose' | 'silver' | 'emerald' | 'copper';

export interface CwAccentOption {
  /** localStorage 持久化键值 & <html data-cw-accent> 值 */
  key: CwAccentKey;
  /** 设置页展示名 */
  label: string;
  /** 设置页展示的色板（色阶 300/400/500 三点，直观预览主题色向） */
  swatch: [string, string, string];
}

const STORAGE_KEY = 'HSR_WIKI_CW_ACCENT';
/** 默认主题（缺省 / 非法值时回退；gold = 无 data-cw-accent 即命中 :root 缺省） */
export const DEFAULT_CW_ACCENT: CwAccentKey = 'gold';

/** 预置主题色（与 tokens.css 各 [data-cw-accent] 色阶一一对应；贵金属/珠宝调性） */
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

/** 读取持久化主题（非法/缺失回退默认） */
export function getSavedCwAccent(): CwAccentKey {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isCwAccentKey(v) ? v : DEFAULT_CW_ACCENT;
  } catch {
    return DEFAULT_CW_ACCENT;
  }
}

/** 设置 <html data-cw-accent>（不持久化；仅反映当前应用的主题状态） */
export function applyCwAccent(accent: CwAccentKey): void {
  const root = document.documentElement;
  if (accent === DEFAULT_CW_ACCENT) delete root.dataset.cwAccent;
  else root.dataset.cwAccent = accent;
}

/** 持久化主题选择并应用到文档（设置页调用） */
export function setCwAccent(accent: CwAccentKey): void {
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    // 存储不可用（隐私模式/配额）：仅本次会话生效，忽略
  }
  applyCwAccent(accent);
}

/** 应用初始化：读取持久化主题并写入 <html>（在路由首跳前执行，避免主题闪烁） */
export function initCwAccent(): void {
  applyCwAccent(getSavedCwAccent());
}