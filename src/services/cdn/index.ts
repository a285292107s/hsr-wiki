/**
 * CDN 资源解析模块（barrel）：统一收口外部图片资源源解析与失效回退。
 * - base.ts    ：资源源类型 + 分类注册表（官方源插槽）
 * - resolve.ts ：双源 URL 解析 + v-html 卡片回退属性
 * - dom.ts     ：全局图片回退事件委托（bootstrap 注册一次）
 * - health.ts  ：CDN 健康探测（down 短路 / 恢复重载信号）
 * 消费方 via `from '.../services/cdn'`。
 */
export * from './base';
export * from './resolve';
export * from './dom';
export * from './health';