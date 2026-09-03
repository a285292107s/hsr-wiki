/**
 * 系统地图数据（单一事实源）
 *
 * 等轴测系统地图的静态数据底座：分层（LAYERS）、建筑（NODES）、真实控制/数据路径（EDGES）。
 * 全部字段由当前 main 分支源码静态推导——文件路径为仓库内真实路径，禁止编造。
 * 本文件不持有任何颜色值：颜色经 layer.color 引用 tokens 三层令牌（原始层色阶），
 * 由 SystemMapSection.vue 内联为 CSS 变量 --nk-c 后以 color-mix 派生面/边/装饰色。
 * 修改地图内容（增删建筑/路径）只改本文件；渲染层零改动。
 */
export type EdgeKind = 'control' | 'data' | 'cdn' | 'theme' | 'build';

/** 建筑屋顶形态（决定 3D 轮廓多样性；视图据此绘制装饰） */
export type BuildingShape =
  | 'flat' | 'tower' | 'spire' | 'dome' | 'twin' | 'silo'
  | 'factory' | 'bunker' | 'bank' | 'sat';

export interface MapLayer {
  id: string;
  /** 分层中文名（图例/解释面板展示） */
  name: string;
  en: string;
  /** tokens 原始层色阶变量名（如 '--ir-500'）；视图解析为 var() 引用 */
  color: string;
  /** 图例说明 */
  desc: string;
}

export interface MapNode {
  id: string;
  name: string;
  en: string;
  layer: string;
  /** 等轴测网格坐标（2:1 投影；(gx+gy) 相同 = 同一视觉行） */
  gx: number;
  gy: number;
  shape: BuildingShape;
  /** 高度倍率（1..4；基础 34px） */
  h: number;
  /** 关键文件（仓库真实路径；外部节点 = 引用它的仓库文件） */
  files: string[];
  /** 职责一句话（解释面板） */
  desc: string;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  /** 路径名（图例/解释面板） */
  label: string;
  /** 路径涉及的仓库文件（真实引用链） */
  files: string[];
}

export interface EdgeKindSpec {
  id: EdgeKind;
  label: string;
  desc: string;
}

/* ═══════════════════════════ 分层 ═══════════════════════════ */

export const LAYERS: MapLayer[] = [
  { id: 'entry',     name: '入口与引导',   en: 'ENTRY',   color: '--ir-500', desc: 'main.ts → bootstrap()：应用启动装配（Pinia/Router/CDN 探测）' },
  { id: 'shell',     name: '应用壳',       en: 'SHELL',   color: '--sl-500', desc: 'App.vue 外壳：侧栏/方向过渡/Toast/主题切换' },
  { id: 'router',    name: '路由层',       en: 'ROUTER',  color: '--ir-400', desc: 'History 路由表（meta.depth / meta.cw）+ chunk 预加载' },
  { id: 'theme',     name: '主题系统',     en: 'THEME',   color: '--tc-400', desc: '常规/货币战争双主题 + data-accent 强调色链路' },
  { id: 'views',     name: '视图层',       en: 'VIEWS',   color: '--ph-500', desc: '路由级页面组件（动态 import + 页面样式懒加载）' },
  { id: 'engine',    name: '目录引擎',     en: 'ENGINE',  color: '--ph-400', desc: '配置驱动目录：CATALOG_PAGES 注册表 + 虚拟滚动' },
  { id: 'store',     name: '状态仓库',     en: 'STORE',   color: '--ol-500', desc: 'Pinia store：加载编排/缓存/错误处理/Toast' },
  { id: 'api',       name: '数据接口层',   en: 'API',     color: '--ol-400', desc: 'services/api 按域拆分纯函数加载器 + 单例 Promise 工厂' },
  { id: 'cache',     name: '请求缓存',     en: 'CACHE',   color: '--ol-600', desc: 'L1 内存 → L2 in-flight 去重 → L3 网络（唯一 fetch 入口）' },
  { id: 'cdn',       name: '资源解析',     en: 'CDN',     color: '--gold-400', desc: '图片 URL 双源解析 + HEAD 健康探测 + v-html 回退委托' },
  { id: 'types',     name: '类型契约',     en: 'TYPES',   color: '--sl-400', desc: 'services/types 共享接口 barrel（api 禁止内联 interface）' },
  { id: 'spine',     name: 'Spine 引擎',   en: 'SPINE',   color: '--em-500', desc: '中立引擎层：运行时动态加载/播放器/场景渲染' },
  { id: 'lib',       name: '工具函数',     en: 'LIB',     color: '--sd-300', desc: '纯函数：constants/format/icons/html/errors' },
  { id: 'styles',    name: '样式令牌',     en: 'STYLES',  color: '--ir-300', desc: 'tokens.css 三层令牌 + catalog.css 目录引擎全局样式' },
  { id: 'comp',      name: '组合式函数',   en: 'COMP',    color: '--tc-300', desc: 'composables：加载代竞态/延迟骨架屏/滚动恢复' },
  { id: 'lab',       name: '研究线',       en: 'LAB',     color: '--em-400', desc: 'Spine Lab 独立子应用（5174，共享只读依赖，不进 CI/线上）' },
  { id: 'converter', name: '数据转换',     en: 'CONV',    color: '--sd-500', desc: 'Python converter：官方解包 → public/data/cn（增量跳过）' },
  { id: 'data',      name: '本地数据',     en: 'DATA',    color: '--sd-600', desc: 'public/data/cn：2954 个预转换 JSON（随站部署）' },
  { id: 'ext',       name: '外部云端',     en: 'CLOUD',   color: '--sl-600', desc: 'nanoka / jsDelivr 镜像 / 官网源 / Vercel' },
];

/* ═══════════════════════════ 建筑（27 座） ═══════════════════════════
 * 坐标布局（gy 行）：0=云端带（外部队列）→ 1=入口网关 → 2=视图城区 →
 * 3=逻辑核心 → 4=引擎与地基 → 5=数据矿区（近景）。 */

export const NODES: MapNode[] = [
  /* ─── gy=0 云端带（外部依赖） ─── */
  { id: 'nanoka', name: 'nanoka CDN', en: 'NANOKA', layer: 'ext', gx: 0, gy: 0, shape: 'sat', h: 2,
    files: ['src/lib/constants.ts'], desc: 'static.nanoka.cc：图片/Spine 运行时/场景资源的主 CDN 与统一回退源' },
  { id: 'jsdelivr', name: 'jsDelivr 镜像', en: 'JSDELIVR', layer: 'ext', gx: 1, gy: 0, shape: 'sat', h: 2,
    files: ['src/services/cdn/jsdelivr.ts', 'src/lib/constants.ts (OFFICIAL_ICON_BASE)'], desc: 'cdn.jsdelivr.net/gh/…/StarRailTextures：官方图标镜像首选源（自建 fork 跟 main）' },
  { id: 'actweb', name: '官网资源源', en: 'ACT-WEB', layer: 'ext', gx: 2, gy: 0, shape: 'sat', h: 2,
    files: ['src/services/cdn/base.ts (OFFICIAL_BASE)', 'src/spine/config.ts (ADR 0009)'], desc: 'act-webstatic.mihoyo.com：官网活动素材与 Spine 场景源（atlas/json/纹理 hash URL）' },
  { id: 'vercel', name: 'Vercel 部署', en: 'VERCEL', layer: 'ext', gx: 3, gy: 0, shape: 'tower', h: 3,
    files: ['vercel.json', 'package.json'], desc: 'main 推送 → 自动构建部署（SPA fallback；回滚 = Dashboard Rollback）' },
  /* ─── gy=1 入口网关 ─── */
  { id: 'entry', name: '入口引导', en: 'BOOTSTRAP', layer: 'entry', gx: 0, gy: 1, shape: 'spire', h: 3,
    files: ['src/main.ts', 'src/app/bootstrap.ts'], desc: 'createApp + Pinia + Router + CDN 探测注册 + 全局样式导入' },
  { id: 'shell', name: '应用壳', en: 'APP SHELL', layer: 'shell', gx: 1, gy: 1, shape: 'flat', h: 2,
    files: ['src/app/App.vue', 'src/app/components/SidebarNav.vue', 'src/app/components/ToastHost.vue'], desc: '侧栏（双模式 7 槽位）+ 方向过渡 RouterView + Toast + 主题切换' },
  { id: 'router', name: '路由层', en: 'ROUTER', layer: 'router', gx: 2, gy: 1, shape: 'twin', h: 2,
    files: ['src/app/router/index.ts', 'src/app/router/chunks.ts'], desc: 'History 路由表（meta.depth 过渡方向 / meta.cw 主题）+ chunk 预加载' },
  { id: 'theme', name: '主题系统', en: 'THEME', layer: 'theme', gx: 3, gy: 1, shape: 'bank', h: 2,
    files: ['src/lib/theme.ts', 'src/lib/cw-theme.ts'], desc: '常规黑紫 / 货币战争黑金双主题 + data-accent/data-cw-accent 强调色链路' },
  /* ─── gy=2 视图城区 ─── */
  { id: 'home', name: '首页', en: 'HOME', layer: 'views', gx: 0, gy: 2, shape: 'flat', h: 1,
    files: ['src/app/views/HomeView.vue'], desc: 'KV Spine Hero（≥1024px）+ 板块索引 + idle 预加载' },
  { id: 'catalog', name: '目录引擎', en: 'CATALOG ENGINE', layer: 'engine', gx: 1, gy: 2, shape: 'factory', h: 2,
    files: ['src/app/views/CatalogView.vue', 'src/app/catalog/pages.ts', 'src/app/catalog/CatalogPage.vue', 'src/app/catalog/use-virtual-grid.ts'], desc: '配置驱动：12 个目录注册表 + 虚拟滚动 + 搜索筛选工具条' },
  { id: 'detail', name: '详情页群', en: 'DETAIL VIEWS', layer: 'views', gx: 2, gy: 2, shape: 'bank', h: 3,
    files: ['src/app/views/CharacterView.vue', 'src/app/views/LightconeView.vue', 'src/app/views/RelicView.vue', 'src/app/views/MonsterDetailView.vue', 'src/app/views/EndgameView.vue'], desc: '角色/光锥/遗器/敌对/终局详情编排页（加载编排 + 骨架屏）' },
  { id: 'cw', name: '货币战争模式', en: 'CURRENCY WAR', layer: 'views', gx: 3, gy: 2, shape: 'twin', h: 2,
    files: ['src/app/views/CurrencyHubView.vue', 'src/app/views/CurrencyRoleView.vue', 'src/app/views/CurrencyTraitView.vue'], desc: '独立路由树（/currency/*）+ 暗金主题（meta.cw）' },
  { id: 'settings', name: '设置与兜底', en: 'SETTINGS', layer: 'views', gx: 4, gy: 2, shape: 'bunker', h: 1,
    files: ['src/app/views/SettingsView.vue', 'src/app/views/NotFoundView.vue'], desc: '设置页（主题强调色选择）/ 404 / 旧路径兼容重定向' },
  /* ─── gy=3 逻辑核心 ─── */
  { id: 'stores', name: '状态仓库', en: 'PINIA STORES', layer: 'store', gx: 0, gy: 3, shape: 'bank', h: 2,
    files: ['src/app/stores/app.ts', 'src/app/stores/character.ts', 'src/app/stores/lightcone.ts', 'src/app/stores/relic.ts'], desc: 'Pinia store：数据加载编排 / 竞态代保护 / Toast 队列' },
  { id: 'api', name: '数据接口层', en: 'SERVICES/API', layer: 'api', gx: 1, gy: 3, shape: 'factory', h: 2,
    files: ['src/services/api/index.ts', 'src/services/api/characters.ts', 'src/services/api/currency.ts', 'src/services/api/singleton.ts', 'src/services/api/base.ts'], desc: '按域拆分纯函数加载器 + singletonLoad 单例工厂 + 本地数据基址' },
  { id: 'cache', name: '请求缓存塔', en: 'CACHE', layer: 'cache', gx: 2, gy: 3, shape: 'tower', h: 3,
    files: ['src/services/cache.ts'], desc: 'L1 内存（80 条淘汰）→ L2 in-flight 去重 → L3 网络（15s 超时 + NkError）' },
  { id: 'cdn', name: '资源解析双塔', en: 'CDN RESOLVE', layer: 'cdn', gx: 3, gy: 3, shape: 'twin', h: 2,
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/health.ts', 'src/services/cdn/dom.ts', 'src/services/cdn/base.ts'], desc: '图片 URL 双源解析 + HEAD manifest 健康探测 + v-html 图片回退委托' },
  { id: 'types', name: '类型契约', en: 'SERVICES/TYPES', layer: 'types', gx: 4, gy: 3, shape: 'bunker', h: 1,
    files: ['src/services/types/index.ts', 'src/services/types/character.ts', 'src/services/types/currency.ts'], desc: '共享接口 barrel：所有共享 interface 定义归属（api 仅 import type）' },
  /* ─── gy=4 引擎与地基 ─── */
  { id: 'spine', name: 'Spine 引擎', en: 'SPINE ENGINE', layer: 'spine', gx: 0, gy: 4, shape: 'silo', h: 3,
    files: ['src/spine/runtime.ts', 'src/spine/player.ts', 'src/spine/scene.ts', 'src/spine/registry.ts'], desc: '中立引擎层（零 Vue 依赖）：运行时动态加载 / 播放器单例 / 场景渲染' },
  { id: 'lib', name: '工具函数', en: 'LIB', layer: 'lib', gx: 1, gy: 4, shape: 'flat', h: 1,
    files: ['src/lib/constants.ts', 'src/lib/format.ts', 'src/lib/icons.ts', 'src/lib/errors.ts'], desc: 'CDN 基址/枚举映射/数值格式化/图标 URL 构造/NkError' },
  { id: 'styles', name: '样式令牌', en: 'STYLES', layer: 'styles', gx: 2, gy: 4, shape: 'bunker', h: 1,
    files: ['src/styles/tokens.css', 'src/styles/catalog.css'], desc: '三层令牌（原始/语义/领域）+ 目录引擎全局样式；页面 CSS 随路由懒加载' },
  { id: 'comp', name: '组合式函数', en: 'COMPOSABLES', layer: 'comp', gx: 3, gy: 4, shape: 'flat', h: 1,
    files: ['src/app/composables/use-load-generation.ts', 'src/app/composables/use-delayed-skeleton.ts', 'src/app/composables/use-scroll-restore.ts'], desc: '加载代竞态保护 / 延迟骨架屏 / 滚动恢复 / 视差' },
  { id: 'lab', name: '研究线', en: 'SPINE LAB', layer: 'lab', gx: 4, gy: 4, shape: 'dome', h: 2,
    files: ['spine-lab/src/App.vue', 'spine-lab/vite.config.ts'], desc: 'Spine Lab 独立子应用（5174）：审核/验收/死链审计；共享只读依赖主项目引擎层' },
  /* ─── gy=5 数据矿区 ─── */
  { id: 'converter', name: '数据转换工厂', en: 'CONVERTER', layer: 'converter', gx: 0, gy: 5, shape: 'factory', h: 2,
    files: ['tools/converter/convert.py', 'tools/converter/converters/characters.py', 'tools/converter/query.py'], desc: 'Python 工具：官方解包 ExcelOutput → public/data/cn（增量跳过未变更）' },
  { id: 'data', name: '本地数据仓库', en: 'DATA/CN', layer: 'data', gx: 1, gy: 5, shape: 'bunker', h: 2,
    files: ['public/data/cn/characters.json', 'public/data/cn/items.json', 'public/data/cn/light_cones.json', 'public/data/cn/maze.json'], desc: '2954 个预转换 JSON（随站部署，Vercel CDN 托管；图片/Spine 仍走外部 CDN）' },
  { id: 'manifest', name: 'Spine 清单井', en: 'MANIFESTS', layer: 'data', gx: 3, gy: 5, shape: 'silo', h: 2,
    files: ['public/data/cn/spine-manifest-official.json', 'public/data/cn/spine-manifest-nanoka.json', 'public/data/cn/version.json'], desc: '双清单（官方/nanoka）+ 版本号；SPINE_MANIFEST_VERSION 一致性由单测强制' },
  { id: 'misc', name: '详情数据场', en: 'DETAIL JSON', layer: 'data', gx: 4, gy: 5, shape: 'flat', h: 1,
    files: ['public/data/cn/characters/1001.json', 'public/data/cn/monsters/*.json', 'public/data/cn/currency/role/*.json'], desc: '按 ID 拆分的详情 JSON（角色/敌对/光锥/货币角色）' },
];

/* ═══════════════════════════ 路径（26 条真实控制/数据流） ═══════════════════════════ */

export const EDGE_KINDS: EdgeKindSpec[] = [
  { id: 'control',  label: '控制流',   desc: '模块调用与装配（实线）' },
  { id: 'data',     label: '数据加载', desc: 'JSON/URL 解析链路（流动虚线）' },
  { id: 'cdn',      label: 'CDN 网络', desc: '外部资源/双源回退/健康探测（点划线）' },
  { id: 'theme',    label: '主题传导', desc: '主题/样式令牌流动（点线）' },
  { id: 'build',    label: '构建/部署', desc: 'converter 产出 / Vercel 部署（粗实线）' },
];

export const EDGES: MapEdge[] = [
  /* 装配（控制流） */
  { id: 'boot', from: 'entry', to: 'shell', kind: 'control', label: '应用装配',
    files: ['src/main.ts', 'src/app/bootstrap.ts', 'src/app/App.vue'] },
  { id: 'probe', from: 'entry', to: 'cdn', kind: 'control', label: 'CDN 探测注册',
    files: ['src/app/bootstrap.ts', 'src/services/cdn/health.ts', 'src/services/cdn/dom.ts'] },
  { id: 'app-router', from: 'shell', to: 'router', kind: 'control', label: '路由挂载',
    files: ['src/app/App.vue', 'src/app/router/index.ts'] },
  { id: 'router-detail', from: 'router', to: 'detail', kind: 'control', label: '动态 import 视图',
    files: ['src/app/router/index.ts', 'src/app/views/CharacterView.vue'] },
  { id: 'router-catalog', from: 'router', to: 'catalog', kind: 'control', label: 'meta.catalog → 注册表',
    files: ['src/app/router/index.ts', 'src/app/views/CatalogView.vue', 'src/app/catalog/pages.ts'] },
  { id: 'prefetch', from: 'shell', to: 'detail', kind: 'control', label: 'hover/idle 预加载',
    files: ['src/app/components/SidebarNav.vue', 'src/app/router/chunks.ts'] },
  { id: 'view-store', from: 'detail', to: 'stores', kind: 'control', label: 'store.load() 编排',
    files: ['src/app/views/CharacterView.vue', 'src/app/stores/character.ts'] },
  { id: 'home-store', from: 'home', to: 'stores', kind: 'control', label: 'manifest/版本加载',
    files: ['src/app/views/HomeView.vue', 'src/app/stores/app.ts', 'src/services/api/manifest.ts'] },
  { id: 'store-api', from: 'stores', to: 'api', kind: 'control', label: '加载器调用',
    files: ['src/app/stores/character.ts', 'src/services/api/characters.ts'] },
  { id: 'store-cdn', from: 'stores', to: 'cdn', kind: 'control', label: 'CDN 状态短路',
    files: ['src/app/stores/app.ts', 'src/services/cdn/health.ts'] },
  { id: 'api-types', from: 'api', to: 'types', kind: 'control', label: '类型契约',
    files: ['src/services/api/index.ts', 'src/services/types/index.ts'] },
  /* 数据加载（数据流） */
  { id: 'view-cdn', from: 'detail', to: 'cdn', kind: 'data', label: '图标 URL 双源解析',
    files: ['src/app/views/*.vue', 'src/lib/icons.ts', 'src/services/cdn/resolve.ts'] },
  { id: 'api-cache', from: 'api', to: 'cache', kind: 'data', label: 'cachedFetch / singletonLoad',
    files: ['src/services/api/characters.ts', 'src/services/api/singleton.ts', 'src/services/cache.ts'] },
  { id: 'cache-data', from: 'cache', to: 'data', kind: 'data', label: 'fetch /data/cn/*.json',
    files: ['src/services/cache.ts', 'src/services/api/base.ts'] },
  { id: 'spine-manifest', from: 'spine', to: 'manifest', kind: 'data', label: '双清单加载',
    files: ['src/services/api/spine.ts', 'src/spine/runtime.ts'] },
  /* CDN 网络（外部） */
  { id: 'cdn-jsdelivr', from: 'cdn', to: 'jsdelivr', kind: 'cdn', label: '官方镜像首选',
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/jsdelivr.ts'] },
  { id: 'cdn-nanoka', from: 'cdn', to: 'nanoka', kind: 'cdn', label: 'nanoka 主源/回退 + HEAD 探测',
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/health.ts'] },
  { id: 'manifest-cdn', from: 'api', to: 'nanoka', kind: 'cdn', label: 'manifest.json（CDN 版本）',
    files: ['src/services/api/manifest.ts', 'src/services/cache.ts'] },
  { id: 'spine-cdn', from: 'spine', to: 'nanoka', kind: 'cdn', label: '运行时 + 资源加载',
    files: ['src/spine/runtime.ts', 'src/spine/scene.ts', 'src/spine/player.ts'] },
  { id: 'lab-cdn', from: 'lab', to: 'nanoka', kind: 'cdn', label: '资源可达性审计',
    files: ['spine-lab/src/dead-links.ts'] },
  /* 主题传导 */
  { id: 'theme-shell', from: 'shell', to: 'theme', kind: 'theme', label: 'meta.cw 主题切换',
    files: ['src/app/App.vue', 'src/lib/theme.ts', 'src/lib/cw-theme.ts'] },
  { id: 'theme-styles', from: 'theme', to: 'styles', kind: 'theme', label: 'data-accent → 令牌变量',
    files: ['src/lib/theme.ts', 'src/styles/tokens.css'] },
  { id: 'styles-views', from: 'styles', to: 'detail', kind: 'theme', label: '页面 CSS 随路由懒加载',
    files: ['src/app/views/CharacterView.vue', 'src/styles/character.css', 'src/styles/skill-card.css'] },
  /* 构建/部署 */
  { id: 'converter-data', from: 'converter', to: 'data', kind: 'build', label: 'convert.py 产出 JSON',
    files: ['tools/converter/convert.py', 'tools/converter/converters/characters.py'] },
  { id: 'vercel-deploy', from: 'vercel', to: 'entry', kind: 'build', label: '构建产物部署',
    files: ['vercel.json', 'package.json'] },
  { id: 'lab-share', from: 'lab', to: 'spine', kind: 'build', label: '共享只读依赖',
    files: ['spine-lab/vite.config.ts', 'spine-lab/src/main.ts'] },
  { id: 'spine-actweb', from: 'spine', to: 'actweb', kind: 'cdn', label: '官网场景源 (ADR 0009)',
    files: ['src/spine/config.ts', 'src/spine/scene.ts'] },
  { id: 'router-cw', from: 'router', to: 'cw', kind: 'control', label: '/currency/* 独立路由树',
    files: ['src/app/router/index.ts', 'src/app/views/CurrencyHubView.vue'] },
  { id: 'router-settings', from: 'router', to: 'settings', kind: 'control', label: '/settings 注册',
    files: ['src/app/router/index.ts'] },
  { id: 'cdn-lib', from: 'cdn', to: 'lib', kind: 'control', label: 'CDN 基址/常量依赖',
    files: ['src/services/cdn/resolve.ts', 'src/lib/constants.ts'] },
  { id: 'store-comp', from: 'stores', to: 'comp', kind: 'control', label: '加载代竞态保护',
    files: ['src/app/stores/character.ts', 'src/app/composables/use-load-generation.ts'] },
  { id: 'data-detail', from: 'data', to: 'misc', kind: 'data', label: '按 ID 详情文件',
    files: ['public/data/cn/characters/1001.json', 'public/data/cn/currency/role/*.json'] },
];
