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
