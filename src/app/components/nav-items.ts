/**
 * 全站导航配置（双模式：常规 7 板块 + 货币战争 5 板块）
 * 侧边栏（SidebarNav）与首页导航网格（HomeView）共享。
 *
 * 「交换」（SWAP_ITEM）为导航首项：点击跳转对方模式的枢纽页（/ ↔ /currency），
 * 标签固定，附双色状态点指示当前模式（紫=常规，金=货币战争）。
 */
export interface NavItem {
  title: string;
  en: string;
  desc: string;
  /** vue-router 路径（无尾斜杠；由非 strict 路由兼容尾斜杠） */
  path: string;
  /** 额外参与高亮判定的路径（如终局内容 4 路由共享一个侧栏项）；默认仅 path */
  activePaths?: string[];
  /** 主项：手机底部栏始终展示；未标记者收纳进"更多"抽屉（平板/桌面不受影响，均展示） */
  primary?: boolean;
  /** 手机底部栏两字短标签（CW 模式 6 槽位平铺时使用）；缺省回退 title */
  short?: string;
  /** 内联 SVG（静态可信内容，v-html 渲染） */
  icon: string;
}

/** 「交换」按钮：模式切换入口，非普通导航项（目标由当前模式决定） */
export const SWAP_ITEM = {
  title: '交换',
  en: 'SWAP',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 8h13"/><path d="M16 4l4 4-4 4"/><path d="M17 16H4"/><path d="M8 12l-4 4 4 4"/></svg>',
} as const;

/** 常规模式导航（7 板块；货币战争已升级为独立模式，由此移除） */
export const NORMAL_NAV_ITEMS: NavItem[] = [
  {
    title: '角色', en: 'CHARACTERS', desc: '角色数值 · 行迹 · 配装', path: '/character', primary: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
  },
  {
    title: '光锥', en: 'LIGHT CONES', desc: '光锥数值与效果图鉴', path: '/lightcone', primary: true,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 10-7 10L5 12z"/><path d="M12 2v20"/></svg>',
  },
  {
    title: '遗器', en: 'RELICS', desc: '遗器套装与词条', path: '/relic', primary: true,
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
    title: '终局内容', en: 'ENDGAME', desc: '忘却之庭赛季记录', path: '/maze',
    activePaths: ['/maze', '/story', '/boss', '/peak'],
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7a5 5 0 1 0 5 5"/><circle cx="12" cy="12" r="1"/></svg>',
  },
];

/** 货币战争模式导航（5 板块；short 用于手机 6 槽位平铺） */
export const CW_NAV_ITEMS: NavItem[] = [
  {
    title: '角色图鉴', en: 'ROLES', desc: '货币战争角色数值与羁绊', path: '/currency/role', short: '角色',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-5 8-5s8 1.7 8 5"/></svg>',
  },
  {
    title: '装备图鉴', en: 'EQUIPMENT', desc: '专属光锥与装备等级', path: '/currency/item', short: '装备',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 10-7 10L5 12z"/><path d="M12 2v20"/></svg>',
  },
  {
    title: '投资环境', en: 'PORTALS', desc: '环境加成与 portal 效果', path: '/currency/buff', short: '环境',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/></svg>',
  },
  {
    title: '投资策略', en: 'AUGMENTS', desc: '策略强化与增益选择', path: '/currency/augment', short: '策略',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z"/></svg>',
  },
  {
    title: '羁绊图鉴', en: 'TRAITS', desc: '阵营羁绊与层级加成', path: '/currency/trait', short: '羁绊',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M2 20c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><path d="M12 20c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/></svg>',
  },
];

/** 首页网关卡片：常规世界通往货币战争模式的第二入口（金色视觉） */
export const CW_GATEWAY = {
  title: '货币战争',
  en: 'CURRENCY WAR',
  desc: '进入货币战争模式',
  path: '/currency',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c0-1.4-1.1-2-2.5-2s-2.5.7-2.5 1.8c0 2.8 5.4 1.4 5.4 4.2 0 1.1-1.3 2-2.9 2s-2.9-.8-2.9-2"/><path d="M12 5.5v2"/><path d="M12 16.5v2"/></svg>',
} as const;
