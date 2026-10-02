/** roving tabindex 键盘导航：左右环回 + Home/End。
 *  返回下一个焦点位序号，-1 = 该键不归本控件处理。 */
export function tabNextIndex(key: string, i: number, n: number): number {
  if (key === 'ArrowRight') return (i + 1) % n;
  if (key === 'ArrowLeft') return (i - 1 + n) % n;
  if (key === 'Home') return 0;
  if (key === 'End') return n - 1;
  return -1;
}
