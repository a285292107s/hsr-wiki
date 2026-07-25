/**
 * 样式汇总：三个 CSS 文件以 ?inline 导入为字符串，拼接后由
 * platform.mount(cssText) 注入 Shadow Root 的 <style>。
 *
 * 为什么不用 SFC <style>：油猴模式下 Vue 会把组件样式插入 document.head，
 * 无法穿透 Shadow DOM；统一走单 <style> 注入保证两种形态表现一致。
 *
 * 顺序沿用原 styles.js：tokens（设计令牌 + 全局组件）→ character → catalog。
 */
import tokensCss from './tokens.css?inline';
import characterCss from './character.css?inline';
import catalogCss from './catalog.css?inline';

export const appCss: string = tokensCss + characterCss + catalogCss;

/**
 * 注册可动画自定义属性（必须走 JS API）：
 * Chrome 不处理 Shadow DOM <style> 内的 @property 规则（静默忽略），
 * 导致 --spine-inner / --spine-outer 的 transition 退化为离散跳变（遮罩无扩散动画）。
 * CSS.registerProperty() 为文档级注册，对 Shadow DOM 内元素同样生效。
 */
for (const [name, initialValue] of [
  ['--spine-inner', '0%'],
  ['--spine-outer', '1%'],
] as const) {
  try {
    CSS.registerProperty({ name, syntax: '<percentage>', inherits: false, initialValue });
  } catch { /* 已注册或环境不支持——降级为无遮罩动画，不影响功能 */ }
}
