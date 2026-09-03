# 架构参考 — 分层结构 / 研究线 / 核心架构模式 / 扩展指南

> AGENTS.md 的按主题子文件（主文件经 `@docs/agents/architecture.md` 引用）。存放低频技能资料：分层结构、研究线、核心架构模式、新增目录链路。必知要点已留在主文件「架构」节。

## 分层结构

```
src/
├── main.ts              → bootstrap() 唯一入口
├── app/                 → 应用层
│   ├── bootstrap.ts     → createApp + Pinia + Router + 全局 CSS 导入（仅 tokens + catalog）
│   ├── App.vue          → 外壳：SidebarNav + 方向过渡 RouterView + ToastHost
│   ├── router/index.ts  → History 路由；meta.depth 驱动导航方向动画；
│   │                        终局合并单页 /endgame（四模式身份为筛选选项，endgame.css 随路由并行加载）；
│   │                        meta.cw 触发 data-theme="cw"（货币战争黑金主题）；
│   │                        CW 目录路由经 cwCatalogView / cwRoleCatalogView 并行加载目录专属 CSS
│   ├── router/chunks.ts → 路由 chunk 预加载函数（侧栏 hover / 首页 idle）
│   ├── stores/          → Pinia 状态仓库（app、character、lightcone、relic）
│   ├── views/           → 路由级页面组件（每个视图内 import 自己的专属样式）
│   ├── composables/     → 复用组合式函数（useDelayedSkeleton / useLoadGeneration /
│   │                        useParallax / useScrollRestore / useCardTilt）
│   ├── character/       → 角色详情页子组件（CharHero + OverviewPanel / SkillsPanel /
│   │                        EidolonsPanel / BuildsPanel + SkillCard + spine 编排层 + utils）
│   ├── catalog/         → 配置驱动目录引擎（pages/ 子模块各目录配置；
│   │                        pages.ts 为纯注册表；CatalogPage.vue 通过配置渲染任意目录；
│   │                        CatalogToolbar.vue 为搜索/筛选工具条）
│   └── components/      → 复用组件（SidebarNav、ToastHost、nav-items）
├── services/            → API 层（纯函数，无全局状态）
│   ├── api/             → 按域拆分的加载器（characters / relics / items / endgame /
│   │                        currency / spine / manifest；index.ts 为 barrel；
│   │                        singleton.ts 提供 singletonLoad 工厂；base.ts 提供数据基址）
│   ├── cache.ts         → 三级缓存（内存 → in-flight 去重 → 网络）+ 唯一底层请求函数 fetchJSON（15s 超时 + NkError）
│   ├── cdn/             → 图片 URL 三级解析（本地图标 local-first + jsDelivr 镜像 + nanoka 回退 + 请求失败 CSS 占位降级）
│   └── types/           → 按域拆分的共享接口（character / relic / spine / currency /
│                           misc；index.ts 为 barrel）
├── lib/                 → 纯工具函数
│   ├── constants.ts     → CDN 基址、枚举映射（PATH/ELEM/TYPE/TAG/SKILL_ORDER/PROP_NAMES…）
│   ├── format.ts        → 数值格式化 + 加强模式视图构建 + 数据校验；并 re-export 下列子模块
│   ├── html.ts          → HTML 转义与富文本标签清洗（escHtml / gameTagsToHtml / stripTags）
│   ├── diff.ts          → 参数对比与 word-level LCS diff（fmtDescDiff / wordDiff）
│   ├── icons.ts         → 图标/图片 URL 构造器（skillIconUrl / itemName / avatarDrawCardUrl…）
│   ├── errors.ts        → NkError 错误类
│   └── currency-role.ts → 货币战争角色详情数据转换（标签映射 / 跨星级合并 / #N 引用解析）
├── spine/               → 中立引擎层（零 Vue 依赖，有副作用：DOM/WebGL/rAF/全局注册表）
│   ├── types.ts         → 双运行时（4.1/4.2）松散契约唯一收口
│   ├── runtime.ts       → 运行时动态加载（访问器代理隔离 window.spine + 多 CDN 兜底）
│   ├── config.ts        → buildOfficialConfig 官网源 URL 构造（ADR 0009）
│   ├── player.ts        → SpinePlayer 单实例工厂 + 结算工厂 + 质量修复
│   ├── scene.ts         → 单画布多骨架场景渲染器（固定舞台 cover 适配 + 渲染管线插桩）
│   ├── registry.ts      → 按 key 精确释放注册表 + WebGL 上下文计数预警
│   └── constants.ts     → 运行时版本 + CDN 列表（引擎自包含）
└── styles/              → 全局仅 tokens.css（设计令牌）+ catalog.css（目录引擎）；
                           页面专属 CSS（character / lightcone / relic / currency-* /
                           skill-card）随各自路由 chunk 懒加载
```

## 研究线（Spine Lab 调试台，主站 dev-only 路由）

研究线调试台（Spine Lab）已从独立 5174 子应用**迁入主站**，为 **dev-only 路由 `/debug`**（2026-09-03 迁移，详见 docs/adr/0015 + docs/memory/2026-09-03.md）：

- 视图与引擎位于 `src/app/debug/`（KV 场景验收 / 清单审核 / 死链审核 / 系统地图 四 Tab + 共享渲染管线）
- 路由与入口 **构建级排除**：`import.meta.env.DEV` 本文件内联（router/index.ts addRoute 分支 + SidebarNav 同文件常量），生产构建摇树——prod 无 `/debug` 路由、零研究线代码打包、深链落 404
- 侧栏「调试台」入口：≥768px 平板/桌面竖排侧栏显示（设置按钮上方）；手机（<768px）隐藏（`.ui-sidebar-debug`，不参与底部栏动态折叠）
- 共享只读依赖同迁移前：spine 引擎层（`src/spine/`）+ services 数据层 + lib 常量；调试台**禁止反向引用** `src/app/` 业务模块（SidebarNav / 各目录视图等）
- 调试台测试并入主 `pnpm test`（`src/app/debug/**/__tests__`）；dev 中间件 `/data/cn/data-file-index.json` 在 vite.config（data-file-index 插件）——死链审核浏览器端用，生产不需要（/debug 不打包）
- 研究文档在 `spine-lab/docs/`，研究脚本在 `spine-lab/tools/`（非应用资产，保留在仓库、不进 CI、不部署线上）

## 核心架构模式

1. **配置驱动目录页**：所有列表页均在 `src/app/catalog/pages/` 子模块中定义（character.ts / lightcone.ts / relic.ts / item.ts / monster.ts / endgame.ts（四模式合并单页，模式为筛选选项）/ currency-role.ts / currency-equipment.ts / currency-portal.ts / currency-augment.ts / currency-trait.ts / achievement.ts，shared.ts 提供共享常量），由 `pages.ts` 统一注册为 `CatalogPageConfig`（共 12 个目录）。单一 `CatalogView.vue` 根据 `route.meta.catalog` 匹配配置渲染任意目录。新增目录 = 新增子模块 + 注册 + 路由。

2. **数据流向**：`Pinia store` → 调用 `services/api/` 纯函数 → 从 `public/data/cn/`（随站部署）获取本地 JSON；图片 URL 经 `services/cdn/` 纯函数解析（官方镜像优先 + nanoka 回退）。Store 编排加载、缓存与错误处理；API 函数本身不持有状态（单例 Promise 除外）。

3. **本地优先数据**：全部目录/详情数据为预转换 JSON，存放于 `public/data/cn/`。仅图片与 Spine 动画在运行时从 CDN 加载。CDN 基址定义于 `src/lib/constants.ts → CDN`。

4. **双模式主题**：常规模式（黑与紫双色）vs 货币战争模式（黑与金双色，见 ADR 0011 双色约束）。路由 `meta.cw` 切换 `<html data-theme="cw">`，附带 450ms 过渡动画类。CW 路由位于 `/currency/*` 下。

5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 路由的 `meta.depth` 计算 `navDir`（1=前进、-1=返回、0=平级）。App.vue 据此选择过渡动画名。手机端（<768px）统一使用简单淡入淡出。

6. **样式随路由懒加载**：页面专属 CSS 在对应视图组件内 `import`（CharacterView 引 character.css + skill-card.css；LightconeView 引 lightcone.css + skill-card.css；RelicView 引 relic.css；CW 视图引 currency-*.css），由 Vite 拆为独立 CSS chunk 随路由加载。CW 目录路由（共享 CatalogView）在 router 内通过 `Promise.all` 并行加载目录样式（角色图鉴目录经 `cwRoleCatalogView` 额外加载 currency-role.css），保证样式先于渲染到达（全局样式仅 tokens.css + catalog.css，见上方分层结构）。

## 新增目录/模块扩展指南（端到端）

新增一个「数据展示目录」的完整链路，当前全部目录均为此模式：

1. **数据侧（Python）**：`tools/converter/converters/<name>.py` 实现 `convert()`（读 ExcelOutput 源表 → `save_json` 到 `public/data/cn/`），在 `convert.py` 的 `MODULES` 注册表登记模块名（增量跳过 / `--only` 均以注册表为准）；补 `tools/converter/tests/` 纯函数契约测试（参照 character_detail / currency 现有模式）；本地刷新用 `python convert.py --only <name>` + `python gen_catalog.py` 重建 `DATA_CATALOG.md`
2. **目录侧（TS）**：`src/app/catalog/pages/<id>.ts` 定义 `CatalogPageConfig`（卡片用模板字符串渲染 + 用户可见文本 `escHtml()`）→ `pages.ts` 注册进 `CATALOG_PAGES` → `src/app/router/index.ts` 添加路由，`meta.catalog` 指向目录 ID——CatalogView 自动渲染无需新视图；带专属样式的目录在配置 `styles` 字段声明，自动随路由并行加载
3. **验证**：converter pytest + `pnpm test` + `pnpm build`（前置三守卫）；页面效果按主文件「验证流程」级别验收——新增目录属「例外确认」类改动，按主文件「任务交付流程」第 2 条列验收标准

## 已知环境坑位（排障必查：CDN 图片加载类问题先读本节，禁止绕路重复排障）

### jsDelivr burst 限流（2026-08-11 / 08-13 三次实证，处置路径已固化）

- **现象**：页面同时加载大量 CDN 图（角色页 301 张 / 铸币墙 9 张并发）时，部分 img 立即失败或长期挂起（`complete=false`），**浏览器不自动重试**（等 40s 仍不恢复）；curl 或 `new Image()` 独立连接同 URL 却成功。本机 Clash 系统代理不影响（Playwright 显式配 proxy 实测无改善——非代理问题）。
- **窗口特征**：同出口 IP 突发请求触发 GitHub 源 429 burst；9 张级并发窗口约 1-2 分钟恢复，301 张级窗口更长。窗口内每轮恰放行 1-2 张。
- **正确处置三步（禁止自由发挥）**：
  1. curl 独立连接探测 URL（单/少量并发 200 即 URL 有效——环境问题，非代码缺陷）；
  2. 渲染态断言用 `waitForFunction` 轮询等窗口恢复（最长 60s），或改用独立连接 HTTP 探测（`page.request.head`）；
  3. 判定环境限流后**禁止改代码规避**（真实用户网络正常）；新增页面控制单页并发图数可减轻症状。
- **静态死链（真 404）审计归属**：`tools/dead-links`（data-sync 数据变更时触发），不放进 e2e（重构决策，见 visual.spec.ts 注释）——排障时勿在 e2e 重做死链检测。