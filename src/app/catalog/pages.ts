import type { CatalogPageConfig } from './types';
import { characterPage } from './pages/character';
import { lightconePage } from './pages/lightcone';
import { relicPage } from './pages/relic';
import { itemPage } from './pages/item';
import { monsterPage } from './pages/monster';
import { endgamePage } from './pages/endgame';
import { currencyRolePage } from './pages/currency-role';
import { currencyEquipmentPage } from './pages/currency-equipment';
import { currencyPortalPage } from './pages/currency-portal';
import { currencyAugmentPage } from './pages/currency-augment';
import { currencyTraitPage } from './pages/currency-trait';
import { achievementPage } from './pages/achievement';

export const CATALOG_PAGES: Record<string, CatalogPageConfig> = {
  character: characterPage,
  lightcone: lightconePage,
  relic: relicPage,
  item: itemPage,
  monster: monsterPage,
  endgame: endgamePage,
  'currency-role': currencyRolePage,
  'currency-equipment': currencyEquipmentPage,
  'currency-portal': currencyPortalPage,
  'currency-augment': currencyAugmentPage,
  'currency-trait': currencyTraitPage,
  achievement: achievementPage,
};
