/**
 * 目录页配置注册表
 * 各目录配置已拆分至 ./pages/ 子模块，本文件仅做聚合导出。
 */
import type { CatalogPageConfig } from './types';
import { characterPage } from './pages/character';
import { lightconePage } from './pages/lightcone';
import { relicPage } from './pages/relic';
import { itemPage } from './pages/item';
import { monsterPage } from './pages/monster';
import { mazePage, storyPage, bossPage, peakPage } from './pages/endgame';
import { currencyRolePage } from './pages/currency-role';

export const CATALOG_PAGES: Record<string, CatalogPageConfig> = {
  character: characterPage,
  lightcone: lightconePage,
  relic: relicPage,
  item: itemPage,
  monster: monsterPage,
  maze: mazePage,
  story: storyPage,
  boss: bossPage,
  peak: peakPage,
  'currency-role': currencyRolePage,
};
