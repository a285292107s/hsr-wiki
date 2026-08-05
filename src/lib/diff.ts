/**
 * Diff 工具（参数对比 / word-level LCS / 描述 diff 渲染）。
 * 依赖 html.ts（标签剥离）与 format.ts（参数格式化）——函数声明提升保证循环 import 安全。
 */
import { fmtDesc } from './format';
import { stripAllTags, stripTags } from './html';

/** 浮点安全的参数相等判定 */
export function paramEqual(a: unknown, b: unknown): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  return String(a) === String(b);
}

export function hasParamDiff(newParams: number[], oldParams: number[]): boolean {
  const len = Math.max(newParams.length, oldParams.length);
  for (let i = 0; i < len; i++) {
    if (!paramEqual(newParams[i], oldParams[i])) return true;
  }
  return false;
}

/** 快速判断两段描述是否有实质差异（剥离标签后比较） */
export function hasTextDiff(a: string | null | undefined, b: string | null | undefined): boolean {
  return stripTags(a).replace(/\s+/g, ' ').trim() !== stripTags(b).replace(/\s+/g, ' ').trim();
}

/* ─── Word-level diff（LCS） ─── */

export interface DiffOp {
  type: 'equal' | 'add' | 'remove';
  text: string;
}

/** 检测文本是否含中文（CJK 统一汉字 + 扩展） */
function hasChinese(s: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(s);
}

/** 中文按字符拆分（每个汉字一个 token），英文按空白拆词 */
export function wordDiff(oldText: string, newText: string): DiffOp[] {
  const isCjk = hasChinese(oldText) || hasChinese(newText);
  const oldW = isCjk ? Array.from(oldText).filter(Boolean) : oldText.split(/\s+/).filter(Boolean);
  const newW = isCjk ? Array.from(newText).filter(Boolean) : newText.split(/\s+/).filter(Boolean);
  const m = oldW.length;
  const n = newW.length;
  if (!m && !n) return [];
  if (!m) return newW.map((w) => ({ type: 'add' as const, text: w }));
  if (!n) return oldW.map((w) => ({ type: 'remove' as const, text: w }));
  // LCS DP
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldW[i - 1] === newW[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  // Backtrack
  const ops: DiffOp[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldW[i - 1] === newW[j - 1]) {
      ops.push({ type: 'equal', text: oldW[i - 1] }); i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'add', text: newW[j - 1] }); j--;
    } else {
      ops.push({ type: 'remove', text: oldW[i - 1] }); i--;
    }
  }
  return ops.reverse();
}

/** 渲染 word-diff 结果为 HTML */
export function renderWordDiffHtml(ops: DiffOp[]): string {
  return ops
    .map((op) => {
      if (op.type === 'equal') return op.text;
      if (op.type === 'add') return `<span class="diff-added">${op.text}</span>`;
      return `<span class="diff-removed">${op.text}</span>`;
    })
    .join('');
}

/**
 * 新版描述渲染（带 word-level diff）：
 * 模板文本变化 → 词级 diff；仅参数变化 → 参数级高亮（fmtDesc）。
 */
export function fmtDescDiff(
  desc: string | null | undefined,
  params: number[] | null | undefined,
  oldDesc: string | null | undefined,
  oldParams: number[] | null | undefined,
): string {
  if (!desc) return '';
  const stripped = stripTags(desc);
  const oldStripped = oldDesc ? stripTags(oldDesc) : '';
  const tplChanged = stripped !== oldStripped;
  const hasPDiff = oldParams && hasParamDiff(params || [], oldParams);
  // 仅参数变化、模板相同 → 参数级高亮
  if (!tplChanged && hasPDiff) return fmtDesc(desc, params, oldParams);
  // 无旧数据 → 普通渲染
  if (!oldParams && !tplChanged) return fmtDesc(desc, params);
  // 模板文本变化 → 词级 diff（先剥离渲染 HTML 再 diff，避免标签被当作文本）
  if (tplChanged && oldDesc) {
    const newRendered = stripAllTags(fmtDesc(desc, params));
    const oldRendered = stripAllTags(fmtDesc(oldDesc, oldParams || params));
    return renderWordDiffHtml(wordDiff(oldRendered, newRendered));
  }
  return fmtDesc(desc, params);
}
