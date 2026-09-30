
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
    .replace(/\{NICKNAME\}/g, '开拓者')
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
    .replace(/\{NICKNAME\}/g, '开拓者')
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#(?:[^}]*)?\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/<[^>]+>/g, '');
}

export function stripAllTags(s: string | null | undefined): string {
  return (s || '').replace(/<[^>]+>/g, '');
}
