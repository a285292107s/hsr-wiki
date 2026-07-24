/**
 * 全站导航配置（沿用原 home.js 的 HOME_NAV 8 项）
 * 侧边栏（SidebarNav）与首页导航网格（HomeView）共享。
 */
export interface NavItem {
  title: string;
  en: string;
  desc: string;
  /** vue-router 路径（无尾斜杠；宿主 URL 的尾斜杠由非 strict 路由兼容） */
  path: string;
  /** 内联 SVG（静态可信内容，v-html 渲染） */
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: '角色', en: 'CHARACTERS', desc: '角色数值 · 行迹 · 配装', path: '/character',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
  },
  {
    title: '光锥', en: 'LIGHT CONES', desc: '光锥数值与效果图鉴', path: '/lightcone',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 10-7 10L5 12z"/><path d="M12 2v20"/></svg>',
  },
  {
    title: '遗器', en: 'RELICS', desc: '遗器套装与词条', path: '/relic',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 4v6c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  },
  {
    title: '物品', en: 'ITEMS', desc: '材料 · 消耗品 · 货币', path: '/item',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/></svg>',
  },
  {
    title: '成就', en: 'ACHIEVEMENTS', desc: '成就工作区与进度', path: '/achievement',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 5"/><path d="M17 6h3a3 3 0 0 1-3 5"/></svg>',
  },
  {
    title: '敌对物种', en: 'ENEMIES', desc: '敌方单位与弱点', path: '/monster',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/></svg>',
  },
  {
    title: '末日内容', en: 'ENDGAME', desc: '忘却之庭赛季记录', path: '/maze',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1"/></svg>',
  },
  {
    title: '货币战争', en: 'CURRENCY WAR', desc: '货币战争图鉴', path: '/currency',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c0-1.4-1.1-2-2.5-2s-2.5.7-2.5 1.8c0 2.8 5.4 1.4 5.4 4.2 0 1.1-1.3 2-2.9 2s-2.9-.8-2.9-2"/><path d="M12 5.5v2"/><path d="M12 16.5v2"/></svg>',
  },
];
