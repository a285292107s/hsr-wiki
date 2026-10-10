import { labelText, labelTextOr } from './label-translator';

const ESC_MAP: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

export function escHtml(s: unknown): string {
  return s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

export function gameTagsToHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replaceAll('{SPACE}', '&nbsp;')
    .replace(/\{NICKNAME\}/g, labelText('common.trailblazer'))
    /* 自造属性名（官方无词条）：转换器发 `{PROP:<枚举键>}`，译文只住在 UI 词典里（ADR 0053 方案 A） */
    .replace(/\{PROP:([A-Za-z0-9_]+)\}/g, (m: string, k: string, offset: number, whole: string) => {
      const label = labelTextOr(`prop.${k}`, k);
      /* 源文本按 CJK 排版书写（`{PROP:X}提高` 无空格）⇒ 解析成拉丁标签后会与相邻词粘连
         （实测 16 条：`Lucky Strike DMGIncreases`）。故仅当标签与邻字符都是拉丁字母/数字时补空格，
         CJK 标签保持源排版不加空格。 */
      if (!/^[A-Za-z0-9]/.test(label)) return label;
      const padBefore = /[A-Za-z0-9]/.test(whole[offset - 1] ?? '') ? ' ' : '';
      const padAfter = /[A-Za-z0-9]/.test(whole[offset + m.length] ?? '') ? ' ' : '';
      return `${padBefore}${label}${padAfter}`;
    })
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#(?:[^}]*)?\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    // 成对 color/unbreak → 占位符（\x01=〈 \x02=〉）
    .replace(/<color=#([0-9A-Fa-f]{6,8})>([\s\S]*?)<\/color>/g, '\x01span style="color:#$1"\x02$2\x01/span\x02')
    .replace(/<unbreak>([\s\S]*?)<\/unbreak>/g, '\x01span class="nowrap"\x02$1\x01/span\x02')
    // 剥离无效/孤立 color 标签、其他未知标签（保留 <u>）
    .replace(/<color=[^>]*>/g, '')
    .replace(/<\/color>/g, '')
    .replace(/<(?!\/?u>)[^>]+>/g, '')
    // 占位符还原为真实 HTML
    .replaceAll('\x01', '<')
    .replaceAll('\x02', '>');
}

export function stripTags(desc: string | null | undefined): string {
  if (!desc) return '';
  return desc
    .replaceAll('{SPACE}', ' ')
    .replace(/\{NICKNAME\}/g, labelText('common.trailblazer'))
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#(?:[^}]*)?\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/<[^>]+>/g, '');
}

export function stripAllTags(s: string | null | undefined): string {
  return (s || '').replace(/<[^>]+>/g, '');
}
