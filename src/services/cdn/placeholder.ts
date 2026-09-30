/* 图标占位（真缺失的最终视觉，由 dom.ts 在双源皆失效后替换 src）。
   图形为中性的描边问号（读作「此处无图」而非「加载中」）；**不得**改用 `<text>` 字形——字体
   可用性随宿主变化，字形会偏移或缺失。data URI 内不能用 var()，故取中性灰阶（check-colors
   对严格中性自动豁免）。已有语义更具体的组件级占位（物品卡的立方体线框、终局 buff 的星形、
   遗器部位图的真实通用图标）**不得**被本占位覆盖——它们各自带语义，由 dom.ts 的 opt-out 路径排除。 */
import { escHtml } from '../../lib/html';

const COLOR = '%23a0a0b0';
export const MISSING_ICON_SVG =
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${COLOR}'`
  + ` stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'>`
  + `<path d='M8.7 9.1a3.4 3.4 0 1 1 4.7 3.2c-.9.4-1.4 1.1-1.4 2v.4'/>`
  + `<circle cx='12' cy='17.6' r='1.05' fill='${COLOR}' stroke='none'/></svg>`;

export const MISSING_ICON_SRC = `data:image/svg+xml,${MISSING_ICON_SVG}`;

/* v-html 卡片用（属性值需转义）：与 cdnImgFallbackAttr 同形态，但只画占位图形。
   宿主容器需自行保证占位尺寸（占位 SVG 为 24×24、随容器缩放）。 */
export function placeholderImgAttrs(): string {
  return ` src="${escHtml(MISSING_ICON_SRC)}" data-cdn-placeholder="1"`;
}
