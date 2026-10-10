/**
 * 角色简介的**唯一派生口径**：档案第一篇（`chara_info.stories["0"]`）按字面 `\n` 切分取首行。
 *
 * 产物不再带组合好的 `desc` 字段——「取首行」这一组合会把携带 TextMap 键的文本退化成普通中文
 * （[ADR 0052](../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2/3），使该句在
 * 多语言下恒为中文。改为消费方按本函数从**语言包已解析**的档案文本派生。
 */
export function characterBlurb(stories: Record<string, string | null> | undefined | null): string {
  const first = stories?.['0'] ?? '';
  return first.split('\\n')[0]?.trim() ?? '';
}
