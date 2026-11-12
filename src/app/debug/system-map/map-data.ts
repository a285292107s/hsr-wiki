export type EdgeKind = 'control' | 'data' | 'cdn' | 'theme' | 'build';

export type Domain = 'system' | 'external';

export const DOMAIN_VAR: Record<Domain, string> = {
  system: 'var(--primary)',
  external: 'var(--gold-400)',
};

export const DOMAIN_LABEL: Record<Domain, string> = {
  system: '站内模块',
  external: '外部依赖',
};

export type ModuleDecor = 'none' | 'mast' | 'dish' | 'chimney' | 'tank' | 'dome';

export interface MapTier {
  id: string;
  gy: number;
  name: string;
  en: string;
  note: string;
}

export interface MapLayer {
  id: string;
  name: string;
  en: string;
  domain: Domain;
  decor: ModuleDecor;
  desc: string;
}

export interface MapNode {
  id: string;
  name: string;
  en: string;
  layer: string;
  gx: number;
  gy: number;
  files: string[];
  desc: string;
}

export interface MapEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  label: string;
  files: string[];
}

export interface EdgeKindSpec {
  id: EdgeKind;
  label: string;
  en: string;
  desc: string;
}

export const TIERS: MapTier[] = [
  { id: 'upstream', gy: 0, name: '上游与交付', en: 'UPSTREAM',  note: 'CDN · 构建门禁 · 部署' },
  { id: 'boot',    gy: 1, name: '启动与壳',   en: 'BOOTSTRAP', note: '装配 · 路由 · 主题' },
  { id: 'surface', gy: 2, name: '页面与引擎', en: 'SURFACE',   note: '路由级视图 · 目录' },
  { id: 'service', gy: 3, name: '服务层',     en: 'SERVICES',  note: '仓库 · 接口 · 缓存 · 资源' },
  { id: 'core',    gy: 4, name: '引擎与工具', en: 'CORE',      note: '渲染 · 令牌 · 组合式' },
  { id: 'dataset', gy: 5, name: '数据生产',   en: 'DATA',      note: 'converter → public/data' },
];

export const LAYERS: MapLayer[] = [
  { id: 'entry',     name: '入口与引导', en: 'ENTRY',    domain: 'system', decor: 'mast',  desc: 'main.ts → bootstrap()：createApp + Pinia + vue-i18n（locale 路径前缀）+ Router + 主题初始化 + 枚举标签 + CDN 探测/健康订阅 + 全局样式' },
  { id: 'i18n',      name: '国际化装配', en: 'I18N',     domain: 'system', decor: 'none',  desc: 'vue-i18n：13 个 UI 词典包 + 路径前缀 locale 解析（ADR 0052）' },
  { id: 'shell',     name: '应用壳',     en: 'SHELL',    domain: 'system', decor: 'none',  desc: 'App.vue 外壳：侧栏（常规 9 项 / 货币战争 5 项 + 枢纽 + 交换）+ 方向过渡 + Toast + 主题切换' },
  { id: 'router',    name: '路由层',     en: 'ROUTER',   domain: 'system', decor: 'none',  desc: 'History 路由表（meta.depth / meta.cw）+ chunk 预加载' },
  { id: 'theme',     name: '主题系统',   en: 'THEME',    domain: 'system', decor: 'none',  desc: '单强调色通道（5 色板，缺省橄榄青）+ data-accent；全站含货币战争共用（ADR 0041）' },
  { id: 'views',     name: '视图层',     en: 'VIEWS',    domain: 'system', decor: 'none',  desc: '路由级页面组件（动态 import + 页面样式懒加载）' },
  { id: 'engine',    name: '目录引擎',   en: 'ENGINE',   domain: 'system', decor: 'none',  desc: '配置驱动目录：CATALOG_PAGES 注册表 + 虚拟滚动' },
  { id: 'store',     name: '状态仓库',   en: 'STORE',    domain: 'system', decor: 'none',  desc: 'Pinia store：加载编排/缓存/错误处理/Toast' },
  { id: 'api',       name: '数据接口层', en: 'API',      domain: 'system', decor: 'none',  desc: 'services/api 按域拆分纯函数加载器 + 单例 Promise 工厂' },
  { id: 'cache',     name: '请求缓存',   en: 'CACHE',    domain: 'system', decor: 'mast',  desc: 'L1 内存 → L2 in-flight 去重 → L3 网络（数据请求唯一入口；CDN 健康 HEAD 探针为登记豁免）' },
  { id: 'cdn',       name: '资源解析',   en: 'CDN',      domain: 'system', decor: 'mast',  desc: '图片 URL 双源解析 + HEAD 健康探测 + v-html 回退委托' },
  { id: 'types',     name: '类型契约',   en: 'TYPES',    domain: 'system', decor: 'none',  desc: 'services/types 共享接口 barrel（api 禁止内联 interface）' },
  { id: 'spine',     name: 'Spine 引擎', en: 'SPINE',    domain: 'system', decor: 'mast',  desc: '中立引擎层：运行时动态加载/播放器/场景渲染' },
  { id: 'lib',       name: '工具函数',   en: 'LIB',      domain: 'system', decor: 'none',  desc: '纯函数：constants/format/icons/html/errors' },
  { id: 'styles',    name: '样式令牌',   en: 'STYLES',   domain: 'system', decor: 'none',  desc: 'tokens.css 四层令牌 + catalog.css 目录引擎全局样式 + fonts.css 自托管字型' },
  { id: 'comp',      name: '组合式函数', en: 'COMP',     domain: 'system', decor: 'none',  desc: 'composables：加载代竞态/延迟骨架屏/滚动恢复' },
  { id: 'lab',       name: '研究线',     en: 'LAB',      domain: 'system', decor: 'dome',  desc: 'Spine Lab 调试台：主站 dev-only 路由 /debug（import.meta.env.DEV 注册，生产构建摇树）' },
  { id: 'delivery',  name: '构建与交付', en: 'DELIVERY', domain: 'external', decor: 'mast', desc: 'pnpm build 守卫链 → 预渲染快照 → Vercel 投递' },
  { id: 'converter', name: '数据转换',   en: 'CONV',     domain: 'system', decor: 'chimney', desc: 'Python converter：官方解包 → public/data/cn + public/data/i18n（增量跳过）' },
  { id: 'data',      name: '本地数据',   en: 'DATA',     domain: 'system', decor: 'tank',  desc: 'public/data：结构层 cn + 语言包 i18n（随站部署）' },
  { id: 'ext',       name: '外部云端',   en: 'CLOUD',    domain: 'external', decor: 'dish', desc: 'nanoka / jsDelivr 镜像 / 官网源' },
];

export const NODES: MapNode[] = [
  { id: 'nanoka', name: 'nanoka CDN', en: 'NANOKA', layer: 'ext', gx: 0, gy: 0,
    files: ['src/lib/constants.ts'], desc: 'static.nanoka.cc：图片/Spine 运行时/场景资源的主 CDN 与统一回退源' },
  { id: 'jsdelivr', name: 'jsDelivr 镜像', en: 'JSDELIVR', layer: 'ext', gx: 1, gy: 0,
    files: ['src/services/cdn/jsdelivr.ts', 'src/lib/constants.ts (OFFICIAL_ICON_BASE)'], desc: 'cdn.jsdelivr.net/gh/…/StarRailTextures：官方图标镜像首选源（自建 fork 跟 main）' },
  { id: 'actweb', name: '官网资源源', en: 'ACT-WEB', layer: 'ext', gx: 2, gy: 0,
    files: ['public/data/cn/spine-manifest-official.json', 'src/services/api/spine.ts', 'src/spine/config.ts', 'src/spine/scene.ts'], desc: 'act-webstatic.mihoyo.com：官方 Spine 清单 base 与场景源（atlas/json/纹理 hash URL）；官网图标类目回退当前未启用（OFFICIAL_BASE 为空）' },
  { id: 'vercel', name: 'Vercel 部署', en: 'VERCEL', layer: 'delivery', gx: 3, gy: 0,
    files: ['vercel.json', 'package.json'], desc: 'main 推送 → 自动构建 → 明确 rewrite 投递 dist/prerender 快照；catch-all → _shell.html（SPA 兜底 + noindex）；回滚 = Dashboard Rollback' },
  { id: 'build', name: '构建门禁', en: 'BUILD / AI', layer: 'delivery', gx: 4, gy: 0,
    files: ['tools/check-guards.mjs', 'tools/gen-ai-endpoints.mjs', 'tools/check-ai-endpoints.mjs', 'vercel.json', 'public/robots.txt', 'public/llms.txt'], desc: 'pnpm build = check-guards（7 守卫）→ vue-tsc -b → vite build → gen-ai-endpoints（dist/prerender 快照 + sitemap + llms）→ check-ai-endpoints；vercel.json 逐条 rewrite 投递，robots.txt 分区放行' },
  { id: 'entry', name: '入口引导', en: 'BOOTSTRAP', layer: 'entry', gx: 0, gy: 1,
    files: ['src/main.ts', 'src/app/bootstrap.ts'], desc: 'createApp + Pinia + vue-i18n（locale 路径前缀）+ Router + 主题初始化 + 枚举标签 + CDN 探测/健康订阅 + 全局样式' },
  { id: 'shell', name: '应用壳', en: 'APP SHELL', layer: 'shell', gx: 1, gy: 1,
    files: ['src/app/App.vue', 'src/app/components/SidebarNav.vue', 'src/app/components/ToastHost.vue'], desc: '侧栏（常规 9 项 / 货币战争 5 项 + 枢纽 + 交换）+ 方向过渡 RouterView + Toast + 主题切换' },
  { id: 'router', name: '路由层', en: 'ROUTER', layer: 'router', gx: 2, gy: 1,
    files: ['src/app/router/index.ts', 'src/app/router/chunks.ts', 'src/app/seo.ts'], desc: 'History 路由表（meta.depth 过渡方向 / meta.cw 模式标记）+ chunk 预加载 + 标题随 locale 切换' },
  { id: 'theme', name: '主题系统', en: 'THEME', layer: 'theme', gx: 3, gy: 1,
    files: ['src/lib/theme.ts'], desc: '单强调色通道（5 色板，缺省橄榄青）+ data-accent；全站含货币战争共用（ADR 0041）' },
  { id: 'i18n', name: '国际化装配', en: 'I18N', layer: 'i18n', gx: 4, gy: 1,
    files: ['src/app/i18n.ts', 'src/lib/i18n/locales.ts', 'src/lib/i18n/active.ts', 'src/lib/i18n/messages/en.json'], desc: 'vue-i18n 装配：13 个 UI 词典包（每包 981 键，eager glob）+ 路径前缀 locale 解析（/en/、/jp/…，缺省 cn 落根路径）+ bootstrap 在 mount 前 setActiveLocale（ADR 0052）' },
  { id: 'home', name: '首页', en: 'HOME', layer: 'views', gx: 0, gy: 2,
    files: ['src/app/views/HomeView.vue', 'src/app/composables/use-home-release.ts', 'src/styles/home.css'], desc: '版本入册页：报头 + 版本钢印与同步日期 + 本期入册清单 + 站内即时搜索（ADR 0063）' },
  { id: 'catalog', name: '目录引擎', en: 'CATALOG ENGINE', layer: 'engine', gx: 1, gy: 2,
    files: ['src/app/views/CatalogView.vue', 'src/app/catalog/pages.ts', 'src/app/catalog/CatalogPage.vue', 'src/app/catalog/CatalogToolbar.vue', 'src/app/catalog/CatalogFilterSelect.vue', 'src/app/catalog/use-virtual-grid.ts'], desc: '配置驱动：10 个目录注册项 + 卡片渲染 + 搜索筛选工具条' },
  { id: 'detail', name: '详情页群', en: 'DETAIL VIEWS', layer: 'views', gx: 2, gy: 2,
    files: ['src/app/views/CharacterView.vue', 'src/app/views/LightconeView.vue', 'src/app/views/RelicView.vue', 'src/app/views/MonsterDetailView.vue', 'src/app/views/EndgameView.vue', 'src/app/views/EndgameModeView.vue'], desc: '角色/光锥/遗器/敌对/终局（含模式页）详情编排页（加载编排 + 骨架屏）' },
  { id: 'cw', name: '货币战争模式', en: 'CURRENCY WAR', layer: 'views', gx: 3, gy: 2,
    files: ['src/app/views/CurrencyHubView.vue', 'src/app/views/CurrencyRoleView.vue', 'src/app/views/CurrencyTraitView.vue'], desc: '独立路由树（/currency/*）+ meta.cw 模式标记（html[data-theme=cw]，当前无 CSS 消费者、不换色；ADR 0041）' },
  { id: 'settings', name: '设置与兜底', en: 'SETTINGS', layer: 'views', gx: 4, gy: 2,
    files: ['src/app/views/SettingsView.vue', 'src/app/views/NotFoundView.vue'], desc: '设置页（主题强调色选择）/ 404 / 旧路径兼容重定向' },
  { id: 'stores', name: '状态仓库', en: 'PINIA STORES', layer: 'store', gx: 0, gy: 3,
    files: ['src/app/stores/app.ts', 'src/app/stores/character.ts', 'src/app/stores/lightcone.ts', 'src/app/stores/relic.ts'], desc: 'Pinia store：数据加载编排 / 竞态代保护 / Toast 队列' },
  { id: 'api', name: '数据接口层', en: 'SERVICES/API', layer: 'api', gx: 1, gy: 3,
    files: ['src/services/api/index.ts', 'src/services/api/characters.ts', 'src/services/api/currency.ts', 'src/services/api/local.ts', 'src/services/api/singleton.ts', 'src/services/api/base.ts'], desc: '按域拆分纯函数加载器 + singletonOf 单例工厂 + 本地数据基址与语言包解析（local.ts）' },
  { id: 'cache', name: '请求缓存', en: 'CACHE', layer: 'cache', gx: 2, gy: 3,
    files: ['src/services/cache.ts'], desc: 'L1 内存（上限 80 条，超限淘汰 16 条）→ L2 in-flight 去重 → L3 网络（15s 超时 + NkError）' },
  { id: 'cdn', name: '资源解析', en: 'CDN RESOLVE', layer: 'cdn', gx: 3, gy: 3,
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/health.ts', 'src/services/cdn/dom.ts', 'src/services/cdn/base.ts'], desc: '图片 URL 双源解析 + HEAD manifest 健康探测 + v-html 图片回退委托' },
  { id: 'types', name: '类型契约', en: 'SERVICES/TYPES', layer: 'types', gx: 4, gy: 3,
    files: ['src/services/types/index.ts', 'src/services/types/character.ts', 'src/services/types/currency.ts'], desc: '共享接口 barrel：所有共享 interface 定义归属（api 仅 import type）' },
  { id: 'spine', name: 'Spine 引擎', en: 'SPINE ENGINE', layer: 'spine', gx: 0, gy: 4,
    files: ['src/spine/runtime.ts', 'src/spine/player.ts', 'src/spine/scene.ts', 'src/spine/registry.ts'], desc: '中立引擎层（零 Vue 依赖）：运行时动态加载 / 播放器单例 / 场景渲染' },
  { id: 'lib', name: '工具函数', en: 'LIB', layer: 'lib', gx: 1, gy: 4,
    files: ['src/lib/constants.ts', 'src/lib/format.ts', 'src/lib/icons.ts', 'src/lib/errors.ts'], desc: 'CDN 基址/枚举映射/数值格式化/图标 URL 构造/NkError' },
  { id: 'styles', name: '样式令牌', en: 'STYLES', layer: 'styles', gx: 2, gy: 4,
    files: ['src/styles/tokens.css', 'src/styles/catalog.css', 'src/styles/fonts.css'], desc: '四层令牌（原始 / 别名 --th-* / 语义 / 领域）+ 目录引擎全局样式；页面 CSS 随路由懒加载' },
  { id: 'comp', name: '组合式函数', en: 'COMPOSABLES', layer: 'comp', gx: 3, gy: 4,
    files: ['src/app/composables/use-load-generation.ts', 'src/app/composables/use-delayed-skeleton.ts', 'src/app/composables/use-scroll-restore.ts'], desc: '加载代竞态保护 / 延迟骨架屏 / 滚动恢复 / 视差' },
  { id: 'lab', name: '研究线', en: 'SPINE LAB', layer: 'lab', gx: 4, gy: 4,
    files: ['src/app/debug/DebugConsoleView.vue', 'src/app/debug/index.ts', 'src/app/debug/dead-links.ts'], desc: '主站 dev-only 路由 /debug：KV 场景验收 / 清单审核 / 死链审核 / 系统地图（生产构建摇树）' },
  { id: 'converter', name: '数据转换工厂', en: 'CONVERTER', layer: 'converter', gx: 0, gy: 5,
    files: ['tools/converter/convert.py', 'tools/converter/converters/characters.py', 'tools/converter/query.py', 'tools/converter/languages.json'], desc: 'Python 工具：官方解包 ExcelOutput → public/data/cn + public/data/i18n（增量跳过未变更）' },
  { id: 'data', name: '本地数据仓库', en: 'DATA/CN', layer: 'data', gx: 1, gy: 5,
    files: ['public/data/cn/characters.json', 'public/data/cn/items.json', 'public/data/cn/light_cones.json', 'public/data/cn/maze.json'], desc: 'cn 结构层 JSON 约 3.1k（monsters 2.7k / light_cones 170 / characters 98），随站部署；图片/Spine 仍走外部 CDN' },
  { id: 'langpack', name: '语言包仓', en: 'I18N PACKS', layer: 'data', gx: 2, gy: 5,
    files: ['public/data/i18n/en/characters.json', 'src/services/i18n/pack.ts', 'src/lib/i18n/pack-path.ts', 'src/lib/i18n/text-ref.ts'], desc: 'public/data/i18n/<语言>/<分组>.json：13 语言 × 23 组 = 299 个语言包；结构层文本是 "$t:<键>" 引用令牌，唯一解析入口 services/api/local.ts → services/i18n/pack.ts + lib/i18n/text-ref.ts' },
  { id: 'manifest', name: 'Spine 清单', en: 'MANIFESTS', layer: 'data', gx: 3, gy: 5,
    files: ['public/data/cn/spine-manifest-official.json', 'public/data/cn/spine-manifest-nanoka.json', 'public/data/cn/version.json'], desc: '双清单（官方 21 entry / nanoka 66 entry）+ 版本号；SPINE_MANIFEST_VERSION 一致性由构建守卫 tools/check-spine-manifest.mjs 强制（build 首步）' },
  { id: 'misc', name: '详情数据', en: 'DETAIL JSON', layer: 'data', gx: 4, gy: 5,
    files: ['public/data/cn/characters/1001.json', 'public/data/cn/monsters/*.json', 'public/data/cn/currency/role/*.json'], desc: '按 ID 拆分的详情 JSON（角色/敌对/光锥/货币角色）' },
];

export const EDGE_KINDS: EdgeKindSpec[] = [
  { id: 'control', label: '控制流',   en: 'CONTROL', desc: '模块调用与装配（实线）' },
  { id: 'data',    label: '数据加载', en: 'LOAD',    desc: 'JSON/URL 解析链路（流动虚线）' },
  { id: 'cdn',     label: 'CDN 网络', en: 'NETWORK', desc: '外部资源/双源回退/健康探测（点划线）' },
  { id: 'theme',   label: '主题传导', en: 'TOKENS',  desc: '主题/样式令牌流动（点线）' },
  { id: 'build',   label: '构建部署', en: 'BUILD',   desc: 'converter 产出 / Vercel 部署（粗实线）' },
];

export const EDGES: MapEdge[] = [
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
  { id: 'view-cdn', from: 'detail', to: 'cdn', kind: 'data', label: '图标 URL 双源解析',
    files: ['src/app/views/*.vue', 'src/lib/icons.ts', 'src/services/cdn/resolve.ts'] },
  { id: 'api-cache', from: 'api', to: 'cache', kind: 'data', label: 'cachedLoad / cachedFetch',
    files: ['src/services/api/local.ts', 'src/services/api/singleton.ts', 'src/services/cache.ts'] },
  { id: 'cache-data', from: 'cache', to: 'data', kind: 'data', label: 'fetch /data/cn/*.json',
    files: ['src/services/cache.ts', 'src/services/api/base.ts'] },
  { id: 'spine-manifest', from: 'spine', to: 'manifest', kind: 'data', label: '双清单加载',
    files: ['src/services/api/spine.ts', 'src/spine/runtime.ts'] },
  { id: 'cdn-jsdelivr', from: 'cdn', to: 'jsdelivr', kind: 'cdn', label: '官方镜像首选',
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/jsdelivr.ts'] },
  { id: 'cdn-nanoka', from: 'cdn', to: 'nanoka', kind: 'cdn', label: 'nanoka 主源/回退 + HEAD 探测',
    files: ['src/services/cdn/resolve.ts', 'src/services/cdn/health.ts'] },
  { id: 'manifest-cdn', from: 'api', to: 'nanoka', kind: 'cdn', label: 'manifest.json（CDN 版本）',
    files: ['src/services/api/manifest.ts', 'src/services/cache.ts'] },
  { id: 'spine-cdn', from: 'spine', to: 'nanoka', kind: 'cdn', label: '运行时 + 资源加载',
    files: ['src/spine/runtime.ts', 'src/spine/scene.ts', 'src/spine/player.ts'] },
  { id: 'lab-cdn', from: 'lab', to: 'nanoka', kind: 'cdn', label: '资源可达性审计',
    files: ['src/app/debug/dead-links.ts'] },
  { id: 'theme-shell', from: 'shell', to: 'theme', kind: 'theme', label: 'meta.cw 模式标记（不再换色）',
    files: ['src/app/App.vue', 'src/lib/theme.ts'] },
  { id: 'theme-styles', from: 'theme', to: 'styles', kind: 'theme', label: 'data-accent → 令牌变量',
    files: ['src/lib/theme.ts', 'src/styles/tokens.css'] },
  { id: 'styles-views', from: 'styles', to: 'detail', kind: 'theme', label: '页面 CSS 随路由懒加载',
    files: ['src/app/views/CharacterView.vue', 'src/styles/character-hero.css', 'src/styles/character-skills.css', 'src/styles/character-builds.css', 'src/styles/character-enhance.css', 'src/styles/character-compare.css', 'src/styles/character-skeleton.css', 'src/styles/skill-card.css'] },
  { id: 'converter-data', from: 'converter', to: 'data', kind: 'build', label: 'convert.py 产出 JSON',
    files: ['tools/converter/convert.py', 'tools/converter/converters/characters.py'] },
  { id: 'build-vercel', from: 'build', to: 'vercel', kind: 'build', label: 'dist 产物 + rewrite 投递',
    files: ['tools/gen-ai-endpoints.mjs', 'vercel.json'] },
  { id: 'lab-share', from: 'lab', to: 'spine', kind: 'build', label: '共享只读依赖',
    files: ['vite.config.ts', 'src/main.ts'] },
  { id: 'spine-actweb', from: 'spine', to: 'actweb', kind: 'cdn', label: '官网场景源 (ADR 0009)',
    files: ['src/spine/config.ts', 'src/spine/scene.ts'] },
  { id: 'router-cw', from: 'router', to: 'cw', kind: 'control', label: '/currency/* 独立路由树',
    files: ['src/app/router/index.ts', 'src/app/views/CurrencyHubView.vue'] },
  { id: 'router-settings', from: 'router', to: 'settings', kind: 'control', label: '/settings 注册',
    files: ['src/app/router/index.ts'] },
  { id: 'router-lab', from: 'router', to: 'lab', kind: 'control', label: 'dev 路由注册（/debug）',
    files: ['src/app/router/index.ts', 'src/app/debug/index.ts'] },
  { id: 'cdn-lib', from: 'cdn', to: 'lib', kind: 'control', label: 'CDN 基址/常量依赖',
    files: ['src/services/cdn/resolve.ts', 'src/lib/constants.ts'] },
  { id: 'store-comp', from: 'stores', to: 'comp', kind: 'control', label: '加载代竞态保护',
    files: ['src/app/stores/character.ts', 'src/app/composables/use-load-generation.ts'] },
  { id: 'data-detail', from: 'data', to: 'misc', kind: 'data', label: '按 ID 详情文件',
    files: ['public/data/cn/characters/1001.json', 'public/data/cn/currency/role/*.json'] },
  { id: 'boot-i18n', from: 'entry', to: 'i18n', kind: 'control', label: 'locale 解析 + createI18n 装配',
    files: ['src/app/bootstrap.ts', 'src/app/i18n.ts', 'src/lib/i18n/locales.ts'] },
  { id: 'i18n-views', from: 'i18n', to: 'detail', kind: 'control', label: 'useI18n 文案注入',
    files: ['src/app/views/CharacterView.vue', 'src/app/i18n.ts'] },
  { id: 'api-langpack', from: 'api', to: 'langpack', kind: 'control', label: '$t: 令牌解析',
    files: ['src/services/api/local.ts', 'src/lib/i18n/text-ref.ts', 'src/lib/i18n/pack-path.ts'] },
  { id: 'cache-langpack', from: 'cache', to: 'langpack', kind: 'data', label: 'fetch /data/i18n/<语言>/<分组>.json',
    files: ['src/services/i18n/pack.ts', 'src/services/cache.ts', 'src/services/api/base.ts'] },
  { id: 'converter-langpack', from: 'converter', to: 'langpack', kind: 'build', label: 'converter 产出语言包',
    files: ['tools/converter/convert.py', 'tools/converter/languages.json'] },
  { id: 'router-build', from: 'router', to: 'build', kind: 'build', label: '可索引路由 → 快照家族',
    files: ['src/app/router/index.ts', 'tools/gen-ai-endpoints.mjs'] },
];
