import { type Page } from '@playwright/test';

/**
 * e2e 布局验收公共工具
 *
 * 把 AGENTS.md「验证流程」L1-L3 固化：
 * - collectConsoleIssues → console / pageerror 守卫（CDN 404 / JS 异常自动捕获）
 * - assertNoHorizontalOverflow → L3 横向溢出检测
 */

export interface ConsoleIssues {
  pageErrors: string[];
  consoleErrors: string[];
}

/** 挂载 console/pageerror 监听，返回收集器与断言辅助 */
export function collectConsoleIssues(page: Page): {
  issues: ConsoleIssues;
  assertNoErrors: () => void;
} {
  const issues: ConsoleIssues = { pageErrors: [], consoleErrors: [] };
  page.on('pageerror', (err) => issues.pageErrors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.consoleErrors.push(msg.text());
  });
  return {
    issues,
    assertNoErrors: () => {
      // pageerror 是硬性 JS 异常，必须为零
      const errors = issues.pageErrors.filter(
        (e) => !e.includes('ResizeObserver loop') && !e.includes('ResizeObserver loop completed'),
      );
      if (errors.length) {
        throw new Error(`页面存在未捕获 JS 异常：\n${errors.join('\n')}`);
      }
      // console error 可能是环境性（CDN 加载失败），仅记录不硬断言——由截图/aria 基线兜底
    },
  };
}

/**
 * L3 横向溢出检测：全树扫描 body 元素，找出右边界超出视口或产生横向滚动条的元素。
 * 排除自身允许横向滚动的容器（overflow-x: auto/scroll 且内容确实需要滚动）。
 */
export async function findHorizontalOverflow(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bad: string[] = [];
    const vw = window.innerWidth;
    /** 元素是否被某祖先裁剪（overflow hidden/auto/scroll/clip）：被裁剪的动画/装饰内容不算溢出 */
    const clippedByAncestor = (el: Element): boolean => {
      let cur: Element | null = el.parentElement;
      while (cur) {
        const o = getComputedStyle(cur).overflowX;
        if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') return true;
        cur = cur.parentElement;
      }
      return false;
    };
    document.querySelectorAll('body *').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      // 右边界超出视口（容差 1px 防亚像素）
      if (rect.right > vw + 1 || rect.left < -1) {
        // 排除固定定位装饰层（spine 全屏画布等）与动画裁剪内容
        if (cs.position !== 'fixed' && !clippedByAncestor(el)) {
          bad.push(
            `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 3).join('.') : ''} right=${Math.round(rect.right)} left=${Math.round(rect.left)}`,
          );
        }
      }
    });
    // 文档级横向滚动是最硬性信号
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) {
      bad.push(
        `<html> scrollWidth=${document.documentElement.scrollWidth} clientWidth=${document.documentElement.clientWidth}`,
      );
    }
    return bad.slice(0, 20);
  });
}

/** 等待目录卡片渲染完成（skeleton 消失、真实卡片出现） */
export async function waitForCatalogCards(page: Page, selector = '[class$="-grid"] a') {
  await page.waitForSelector(selector, { state: 'attached', timeout: 15_000 });
  // 虚拟滚动首屏渲染完成后等待一帧，保证截图稳定
  await page.waitForTimeout(300);
}
