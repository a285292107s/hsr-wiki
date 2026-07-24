/**
 * 宿主 DOM 抓取工具
 *
 * 目录页数据源之一：宿主 React 应用渲染的 content-card 节点。
 * 宿主被「离屏定位」隐藏（见 platform/failsafe.ts）但持续渲染，
 * DOM 属性可读——这是角色目录的唯一数据源（CDN 无完整列表端点）。
 *
 * 抓取目标是宿主 document（非 Shadow Root）。
 */
import type { CatalogItem, CatalogPageConfig } from './types';

/**
 * 轮询等待宿主卡片出现（150ms 间隔，默认 8s 超时后仍继续——空数据渲染）
 * @param cancelled 取消哨兵：组件卸载后置 true，停止轮询
 */
export function waitForCards(
  validator: (el: Element) => boolean,
  selector: string,
  cancelled: { value: boolean },
  timeout = 8000,
): Promise<void> {
  const check = (): boolean =>
    Array.from(document.querySelectorAll(selector)).some(validator);
  return new Promise((resolve) => {
    if (check()) {
      resolve();
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (cancelled.value) {
        clearInterval(timer);
        return;
      }
      if (check() || Date.now() - start > timeout) {
        clearInterval(timer);
        resolve();
      }
    }, 150);
  });
}

/** 按配置抓取宿主卡片为条目数组 */
export function scrapeCards(config: CatalogPageConfig): CatalogItem[] {
  const selector = config.cardSelector || '[data-ui="content-card"]';
  const validator = config.cardValidator || ((): boolean => true);
  const scrape = config.scrapeCard || ((): CatalogItem | null => null);
  const data: CatalogItem[] = [];
  document.querySelectorAll(selector).forEach((card) => {
    if (!validator(card)) return;
    const item = scrape(card);
    if (item) data.push(item);
  });
  return data;
}
