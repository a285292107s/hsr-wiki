/**
 * HTML 安全与富文本标签工具（无状态纯函数）。
 * 转义 / HSR 游戏富文本标签清洗 / 标签剥离。
 */

const ESC_MAP: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

/** HTML 转义：防止 CDN 数据中的特殊字符被解析为 DOM（XSS 防御） */
export function escHtml(s: unknown): string {
  return s == null ? '' : String(s).replace(/[&<>"']/g, (c) => ESC_MAP[c]);
}

/**
 * 将 HSR 游戏富文本标签转换为可渲染 HTML。
 * 参照 docs/hsr-rich-text-tags.md：
 * - <color=#hex> → span style color（仅接受合法 #RRGGBB[AA]）
 * - <unbreak> → span.nowrap
 * - <u> 保留
 * - {NICKNAME} → 开拓者；{F#}/{M#} → 提取文本；{TEXTJOIN#id} → 移除（构建期应预展开）
 * - 其余未知标签剥离
 *
 * 策略：先将成对的 color/unbreak 转为 \x01(=〈)\x02(=〉) 占位符，剥离残余标签后再还原为 HTML，
 * 避免最终清洗规则误伤自己生成的 span。无效/孤立的 color 标签直接剔除。
 */
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

/** 剥离全部游戏标签/占位符，输出纯文本（用于 diff 比较 / 搜索索引） */
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

/** 剥离所有 HTML 标签（用于 diff 前清理已渲染的 HTML） */
export function stripAllTags(s: string | null | undefined): string {
  return (s || '').replace(/<[^>]+>/g, '');
}
