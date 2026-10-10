export interface NavItem {
  /** 词典键：显示文案的唯一来源是 `src/lib/i18n/messages/*.json`（`nav.<key>`）。 */
  key: string;
  /** 折叠态短标签的词典键（`nav.<shortKey>`）；缺省时用 `key`。 */
  shortKey?: string;
  /** 拉丁副标：**设计元素，不翻译**（侧栏每项下方的英文大写描述，与主标形成双语排版）。 */
  en: string;
  path: string;
  activePaths?: string[];
  exact?: boolean;
  icon: string;
}

/** 侧栏/底栏首项：跨模式入口。可见文案写的是**目的地模式名**而非「交换」——
 *  按钮自身不解释「交换什么」，玩家看到的就是点进去会到哪（`inNormal` = 当前在常规模式时显示，
 *  `inCw` = 当前在货币战争模式时显示）。无障碍文案在此基础上补动词「前往…」，保持 Label in Name。 */
export const SWAP_ITEM = {
  inNormal: { key: 'nav.swapToCw', en: 'CURRENCY WAR' },
  inCw: { key: 'nav.swapToNormal', en: 'NORMAL MODE' },
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h13"/><path d="M16 4l4 4-4 4"/><path d="M17 16H4"/><path d="M8 12l-4 4 4 4"/></svg>',
} as const;

export const NORMAL_HUB_ITEM: NavItem = {
  key: 'nav.home', en: 'HOME', path: '/', exact: true,
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
};

export const CW_HUB_ITEM: NavItem = {
  key: 'nav.currencyHub', shortKey: 'nav.currencyHubShort', en: 'HUB', path: '/currency', exact: true,
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/></svg>',
};

export const NORMAL_NAV_ITEMS: NavItem[] = [
  {
    key: 'nav.character', en: 'CHARACTERS', path: '/character',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
  },
  {
    key: 'nav.lightcone', en: 'LIGHT CONES', path: '/lightcone',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 10-7 10L5 12z"/><path d="M12 2v20"/></svg>',
  },
  {
    key: 'nav.relic', en: 'RELICS', path: '/relic',
    icon: '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M5.12 2 6.42 4.25 8.49 4.84 6.03 6.14 5.38 8.04 3.82 5.67 2 5.08 4.47 3.78 5.12 2.12Z M8.88 2.24 11.22 2.47 12.26 3.42 12.65 4.96 10.44 7.44 5.51 11.11 3.69 13.95 4.08 16.44 6.68 18.57 7.45 19.99 4.86 19.51 3.43 18.45 2.13 15.96 2 13.72 3.82 10.4 10.57 5.31 10.83 4.49 10.44 4.01 8.49 3.78 7.58 4.13 7.06 3.66 7.32 2.83 9.01 2.24Z M16.94 6.85 19.79 7.33 21.48 8.63 22 11.94 21.35 14.07 20.05 12.41 20.05 10.28 19.01 8.98 18.23 8.63 13.56 8.86 15.25 7.33 17.06 6.85Z M12.78 10.05 15.25 10.17 18.1 11.59 19.4 13.12 20.18 15.61 19.92 17.74 18.88 19.63 17.19 21.05 14.34 22 11.22 21.64 9.27 20.58 7.71 18.8 7.06 17.03 7.06 14.9 8.36 12.3 10.31 10.76 12.91 10.05Z M15.77 12.77 17.06 13.24 17.45 14.66 16.42 15.73 14.86 15.49 14.21 14.54 14.34 13.72 14.99 13.01 15.9 12.89Z"/></svg>',
  },
  {
    key: 'nav.endgame', en: 'ENDGAME', path: '/endgame',
    activePaths: ['/endgame'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1"/></svg>',
  },
  {
    key: 'nav.item', en: 'ITEMS', path: '/item',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
  },
  {
    key: 'nav.achievement', en: 'ACHIEVEMENTS', path: '/achievement',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5"/><path d="M17 6h3a3 3 0 0 1-3 5"/></svg>',
  },
  {
    key: 'nav.monster', en: 'ENEMIES', path: '/monster',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/></svg>',
  },
  {
    key: 'nav.voracity', en: 'GLUTTONY', path: '/voracity',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21A9 9 0 1 1 21 12"/><path d="M12 17A5 5 0 1 1 17 12"/><circle cx="12" cy="12" r="1.3"/></svg>',
  },
];

export const CW_NAV_ITEMS: NavItem[] = [
  {
    key: 'nav.cwRole', shortKey: 'nav.cwRoleShort', en: 'ROLES', path: '/currency/role',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
  },
  {
    key: 'nav.cwEquipment', shortKey: 'nav.cwEquipmentShort', en: 'EQUIPMENT', path: '/currency/item',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 10-7 10L5 12z"/><path d="M12 2v20"/></svg>',
  },
  {
    key: 'nav.cwPortal', shortKey: 'nav.cwPortalShort', en: 'PORTALS', path: '/currency/buff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/></svg>',
  },
  {
    key: 'nav.cwAugment', shortKey: 'nav.cwAugmentShort', en: 'AUGMENTS', path: '/currency/augment',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z"/></svg>',
  },
  {
    key: 'nav.cwTrait', shortKey: 'nav.cwTraitShort', en: 'TRAITS', path: '/currency/trait',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 20c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><path d="M12 20c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/></svg>',
  },
];
