/**
 * 站点注册表一致性测试
 *
 * 路由（router/index.ts）、导航（components/nav-items.ts）、目录配置（catalog/pages.ts）
 * 三者彼此独立维护，本测试锁定漂移：
 * - 导航项 path / activePaths 必须能解析到已注册路由
 * - catalog 路由的 meta.catalog 必须存在于 CATALOG_PAGES，且 meta.title 与配置标题一致
 * - 每个 CATALOG_PAGES 注册项必须至少有一条路由暴露
 */
import { describe, it, expect } from 'vitest';
import { createNkRouter } from '../index';
import { CATALOG_PAGES } from '../../catalog/pages';
import { NORMAL_NAV_ITEMS, CW_NAV_ITEMS, NORMAL_HUB_ITEM, CW_HUB_ITEM, CW_GATEWAY } from '../../components/nav-items';
import type { NavItem } from '../../components/nav-items';

const router = createNkRouter();

describe('site map consistency', () => {
  it('every nav item path resolves to a registered route', () => {
    const items: NavItem[] = [NORMAL_HUB_ITEM, CW_HUB_ITEM, CW_GATEWAY, ...NORMAL_NAV_ITEMS, ...CW_NAV_ITEMS];
    for (const item of items) {
      const r = router.resolve(item.path);
      expect(r.matched.length, `nav path "${item.path}" should match a route`).toBeGreaterThan(0);
      for (const ap of item.activePaths || []) {
        const ra = router.resolve(ap);
        expect(ra.matched.length, `nav activePath "${ap}" should match a route`).toBeGreaterThan(0);
      }
    }
  });

  it('every catalog route maps to a registered catalog config and titles agree', () => {
    for (const route of router.getRoutes()) {
      const catalogId = route.meta.catalog as string | undefined;
      if (!catalogId) continue;
      const cfg = CATALOG_PAGES[catalogId];
      expect(cfg, `route ${route.path} catalog "${catalogId}" should exist in CATALOG_PAGES`).toBeDefined();
      expect(route.meta.title, `route ${route.path} title should match catalog config`).toBe(cfg.title);
    }
  });

  it('every catalog config has at least one route exposing it', () => {
    const routes = router.getRoutes();
    for (const key of Object.keys(CATALOG_PAGES)) {
      const hasRoute = routes.some((r) => r.meta.catalog === key);
      expect(hasRoute, `catalog "${key}" should be reachable via a route`).toBe(true);
    }
  });
});
