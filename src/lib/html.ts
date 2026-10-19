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
    .replace(/\{PROP:([A-Za-z0-9_]+)\}/g, (m: string, k: string, offset: number, whole: string) => {
      const label = labelTextOr(`prop.${k}`, k);
      if (!/^[A-Za-z0-9]/.test(label)) return label;
      const padBefore = /[A-Za-z0-9]/.test(whole[offset - 1] ?? '') ? ' ' : '';
      const padAfter = /[A-Za-z0-9]/.test(whole[offset + m.length] ?? '') ? ' ' : '';
      return `${padBefore}${label}${padAfter}`;
    })
    .replace(/\{[FM]#([^}]*)\}/g, '$1')
    .replace(/\{RUBY_[EB]#(?:[^}]*)?\}/g, '')
    .replace(/\{TEXTJOIN#\d+\}/g, '')
    .replace(/<color=#([0-9A-Fa-f]{6,8})>([\s\S]*?)<\/color>/g, '\x01span style="color:#$1"\x02$2\x01/span\x02')
    .replace(/<unbreak>([\s\S]*?)<\/unbreak>/g, '\x01span class="nowrap"\x02$1\x01/span\x02')
    .replace(/<color=[^>]*>/g, '')
    .replace(/<\/color>/g, '')
    .replace(/<(?!\/?u>)[^>]+>/g, '')
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
