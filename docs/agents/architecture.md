# 架构参考 — 分层结构 / 研究线 / 核心架构模式 / 扩展指南

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。必知要点已留在主文件「架构」节；样式分层与令牌见 [ui-design.md](ui-design.md)，验证级别与预算见主文件「验证流程」节。

## 分层结构

```
src/
├── main.ts / app/bootstrap.ts → 入口：createApp + Pinia + Router；全局 CSS 仅导入 tokens.css + catalog.css
├── app/          → 应用层：router（meta.depth 驱动方向过渡、chunks.ts 预加载）、views 路由级页面、catalog 配置驱动目录引擎、character / endgame 详情子组件、stores、composables、components、debug（dev-only 研究线）
├── services/     → 数据层：api 按域加载器（index.ts barrel、singleton.ts 单例工厂、base.ts 数据基址）、cache 三级缓存、cdn 双源解析、types 共享接口
├── lib/          → 纯函数：constants（CDN 基址与枚举映射）、format / icons / html（转义与富文本清洗）、compare（强化对比）、currency-role、theme（全站唯一强调色通道）、errors
├── spine/        → 中立 Spine 引擎层：零 Vue 依赖，有副作用（DOM / WebGL / rAF / 全局注册表）
└── styles/       → tokens.css（四层令牌 + 全局原语）+ catalog.css（目录引擎）；页面专属 CSS 随路由 chunk 懒加载
```

约束：`spine/` 禁止依赖 Vue 与 `app/`；`services/` 为纯函数层（单例 Promise 除外），不持有全局状态。

### 分层依赖矩阵（越权调用前先查本表）

| 层 | 允许 import | 严禁 import | 核心职责 |
| --- | --- | --- | --- |
| `spine/` | 自身 + `lib/constants` | Vue、`app/`、`services/` | Spine 引擎与双运行时（4.2.43 / 4.1.23），零框架依赖 |
| `services/` | `lib/`、`services/types` | Vue、`app/`、`spine/`（动画播放由 app 编排） | 数据加载 / CDN 解析 / 缓存 / 错误边界，纯函数 + 单例 Promise |
| `lib/` | 自身 | `app/`、`services/`、`spine/`、Vue | 纯函数：常量映射、格式化、转义、主题通道、错误类型 |
| `app/`（views / catalog / stores / components / composables） | `lib/`、`services/`、`spine/`（仅动画消费） | 反向被下层引用（禁止） | 页面编排、目录引擎、状态管理、组合式逻辑 |
| `app/debug/`（研究线） | `lib/`、`services/`、`spine/` | `app/` 业务模块（SidebarNav / 各目录视图）、`stores/` | dev-only `/debug` 调试台四 Tab |
| `styles/` | —（CSS 令牌单向依赖：原始层 → 别名层 → 语义层 → 领域层） | 消费层直引原始层、领域层引用别名层 | `tokens.css` + `catalog.css` 全局两层；页面 CSS 随路由 import |

派生规则：**下层永远不知道上层的存在**；新增跨层需求时先在本表找允许路径，没有就在对应层内实现，禁止为走捷径反向 import。

### 数据流（端到端一图）

```
ExcelOutput/TextMap（vendor，禁直读）
   │ convert.py（离线，tools/converter；开源数据 → 本地 JSON）
   ▼
public/data/cn/*.json（语言无关结构层：文本位置是引用令牌 "$t:<键>"）+ public/data/i18n/<语言>/<分组>.json（各语言正文）
   │ loadLocalJSON（src/services/api/local.ts：取数 → 按当前语言解析令牌；底层走 cache.ts 的 15s 超时 / NkError / in-flight 去重）
   ▼
services/api/<域>.ts（按域加载器；共享列表 = 模块级单例 Promise，随语言重建）
   │
   ▼
Pinia store（加载编排 / 缓存 / 错误态；不写业务计算）
   │
   ▼
view / catalog 组件（模板字符串卡片 + escHtml；虚拟滚动）
   │
   ├─ 图片 / Spine → services/cdn/ 纯函数解析基址 → CDN 双源回退（运行期）
   └─ 构建期 gen-ai-endpoints.mjs：dist/index.html → dist/prerender/** 快照（AI 可见性）
```

## 研究线（Spine Lab 调试台，主站 dev-only 路由）

研究线调试台已并入主站，为 **dev-only 路由 `/debug`**（视图与引擎在 `src/app/debug/`：KV 场景验收 / 清单审核 / 死链审核 / 系统地图 四 Tab）：

- 路由与入口**构建级排除**：`import.meta.env.DEV` 在 `src/app/router/index.ts` 内联（addRoute 分支），生产构建摇树——prod 无 `/debug` 路由、零研究线代码打包、深链落 404
- 共享只读依赖：`src/spine/` 引擎层 + `src/services/` 数据层 + `src/lib/` 常量；调试台**禁止反向引用** `src/app/` 业务模块（SidebarNav / 各目录视图等）
- dev 专用中间件：`vite.config.ts` 的 data-file-index 插件提供 `/data/cn/data-file-index.json`（死链审核浏览器端用；浏览器无目录遍历 API，生产不需要）
- 调试台测试并入主 `pnpm test`（`src/app/debug/**/__tests__`）
- 研究文档与脚本资产位置见 [commands.md](commands.md)

## 核心架构模式

1. **配置驱动目录页**：所有列表页都是 `CatalogPageConfig`——每个目录一个 `src/app/catalog/pages/<id>.ts` 子模块（`shared.ts` 提供共享常量），由 `pages.ts` 注册为注册表。目录清单**以 `pages.ts` 注册表为准**，本文件不复述清单。`CatalogView.vue` 按 `route.meta.catalog` 取配置，交由单一 `CatalogPage.vue` 渲染，无需新视图；带专属样式的目录在配置 `styles` 字段声明，路由层并行加载（`src/app/router/index.ts` 的 `catalogView` 工厂）。**非列表页有两类例外**：枢纽页（`/`、`/currency`）与**专题页**（`/voracity`，单页分区承载跨模式机制，既非目录也非实体详情——见 [ADR 0025](../adr/0025-贪饕污染专题页与导航第8板块.md)；其 AI 快照无条目级 `nk-snapshot__entry` 断言）。
2. **数据流向**：`Pinia store` → `src/services/api/` 纯函数 → 本地 JSON（结构层 `public/data/cn/` + 语言包 `public/data/i18n/<语言>/<分组>.json`，均随站部署；解析入口唯一落在 `api/local.ts`，令牌→正文在取数层完成，见 [ADR 0052](../adr/0052-多语言站点架构-路径前缀与语言包.md)）；图片 URL 经 `src/services/cdn/` 纯函数解析。Store 负责加载编排、缓存与错误处理。
3. **本地优先数据**：全部目录/详情数据为预转换 JSON；仅图片与 Spine 动画在运行期走 CDN。CDN 基址定义于 `src/lib/constants.ts → CDN`。
4. **单强调色主题**：全站（含货币战争）共用一套可切换强调色（缺省橄榄青），开关为 `<html data-accent>`；货币战争的 `meta.cw` → `<html data-theme="cw">` 只作**模式标记**，不再重映射颜色（[ADR 0041](../adr/0041-主题色统一为单强调色通道.md)），CW 路由位于 `/currency/*`。令牌分层与强调色通道见 [ui-design.md](ui-design.md) §2/§3。
5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 的 `meta.depth` 得到 `navDir`（1 前进 / -1 返回 / 0 平级），`App.vue` 据此选择过渡动画。桌面/平板为**交叉过渡**（两视图重叠，离场视图在上层且起步更早，见 [CONTEXT.md](../../CONTEXT.md)「页面过渡」）；手机端（<768px）、平级导航与 `prefers-reduced-motion` 统一简单淡入淡出。
6. **样式随路由懒加载**：页面 CSS 在对应视图组件内 `import`，由 Vite 拆为独立 CSS chunk；全局样式仅 `tokens.css` + `catalog.css`。分层、命名与共享原语纪律见 [ui-design.md](ui-design.md) §1。
7. **无侧栏枢纽（已作废，见 [ADR 0019](../adr/0019-枢纽页导航条回归与首页改为版本上新页.md)）**：曾由 `route.meta.bareNav` 标记的枢纽页（`/` 与 `/currency`）在**所有断点**都不渲染 `SidebarNav`，并以 `<html data-nav="bare">` 令 `--nk-content-offset` 回退为页面留白（平板 32 / 桌面 48）。**该形态、该旗标与该属性均已作废**——两页全断点恢复导航条，`/` 改为版本上新页（本版本新增角色 / 光锥 / 遗器）。术语见 [CONTEXT.md](../../CONTEXT.md)「无侧栏枢纽」（已移除）。
8. **语言前缀落在 router history base（非缺省语言）**：`/en/`、`/jp/` 等前缀由 `createWebHistory(localeBaseFromPath(location.pathname))` 承担，**不复制 12 套路由表**——路由名保持唯一、`router-link` / `router.push('/character')` 按「无前缀站点路径」书写即自动带前缀（e2e 断言 DOM `href` 为 `/en/lightcone`）。语言在**页面加载期**一次性确定：`bootstrap.ts` 设 `setActiveLocale()` 与 `<html lang>`；**切语言走整页导航**（`SettingsView` 语言选择器 → `window.location.assign(localizedPath(...))`），使数据层单例、请求缓存与 store 按语言整体重建，避免半新半旧。缺省语言 `cn` 不做 `/cn/**` 别名（该 URL 落 404）。见 [ADR 0052](../adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2 / 5。
9. **UI 文案走词典，非 RouterLink 取址走 `activeHref`，枚举展示名走数据**：壳层与目录页骨架文案的唯一来源是 `src/lib/i18n/messages/*.json`（源语言 `cn`，键集由 `node tools/check-i18n-messages.mjs` 强制对齐），实例在 app 层（`src/app/i18n.ts`，`legacy: false`，**`lib/` 不引 Vue**）；组件内 `useI18n()` 取 `t`，非组件模块（模板字符串卡片、目录页配置）用 `translate()`（支持具名插值）。语言由 `bootstrap.ts` 在 `setActiveLocale` 之后显式注入（模块求值早于 bootstrap，故不在 i18n 模块顶层读语言）。
   - **配置只存键、视图负责解析**：目录页配置在模块加载期求值，`t()` 写进配置体只会冻住缺省语言 ⇒ `CatalogPageConfig.titleKey`（+ `titleArgs` 指定插值参数取自哪个词典键，如「货币战争 · 投资策略」= 模式名 + 图鉴名）/ `searchKey`、`CatalogFilter.labelKey` 都由视图（`CatalogPage` / `CatalogToolbar`）解析；配置里仍可放**数据派生**的 label（元素名 / 系列名等，已随语言包本地化），两者二选一、键优先。路由标题同理：`meta.titleKey` 存键，`afterEach` 里 `translate()` 一次写 `document.title`（`registry.test.ts` 断言路由键 == 配置键）；**数字按站点语言格式化**：`toLocaleString()` 不带参数用的是**浏览器**语言 ⇒ 统一走 `lib/format.ts` 的 `fmtNumber()`（读 `activeLocale()` 的 culture）。日期沿用 `YYYY.MM.DD` 这类语言中立写法，不进本地化。
   - **外层可见摘要同理**：`index.html` 的 `<meta name="description">` 只是缺省语言的静态回退，`bootstrap.ts` 在确定语言后按 `meta.description` 词典键改写（不改写则所有语言的搜索结果与分享摘要恒为中文；`og:*` 是品牌名，语言无关不动）。
   - **元素 / 命途 / 技能类型 / 削韧架势**：前两者**有数据源**（`elements.json` / `paths.json`，转换器已把官方名落成令牌）⇒ 走数据，`lib/enum-labels.ts` 的 `elemLabel()` / `pathLabel()`（与属性表一样在挂载前加载、常驻，并做**大小写兼容**——数据里同一枚举出现过 `Knight` 与 `knight` 两套写法）；后两者没有数据载体 ⇒ 走词典，`skillTypeLabel()`（缺键回退数据里已有的官方 `type_name`）/ `stanceTagLabel()`。`lib/constants.ts` 因此只剩与语言无关的图标 / 序号 / 阈值映射。
   - **筛选选项的 `label` 可以是 HTML 前缀**：`labelKey` 存在时渲染为 `label + t(labelKey)`，这样带星级/前后台图标的选项既能本地化文案又不丢图标（纯文本选项把 `label` 留空即可）。
   - **没有官方词条的类别名走词典 + 回退枚举值**：物品类别（`itemType.*` / `itemMainType.*`）官方无对应词条，词典值由 [commands.md](commands.md) 里 `fill-ui-messages.py` 的 `AUTHORED` 表人工撰写；解析统一经 `labelOfDict()`（词典缺键时返回**枚举值**而不是原始词典键，界面仍可读）。主类别里与子类别同名同义的（Material / Virtual）复用同一个键，不设第二处事实。
   - **`lib/` 需要译文时用「注入 + 键回退」**：`lib/` 不 import 应用层，故 `lib/currency-role.ts`（货币角色详情的属性名/分组名/技能分组名）暴露 `setLabelTranslator(fn)`，由 `bootstrap.ts` 挂载前注入 `translate`；未注入或缺键时 `trAuto()` 回退到**去前缀的枚举值**（不显示原始词典键）。属性名优先用 converter 落地的官方 `prop_name`（数据源），缺失才查词典 `prop.*`（49 项，40 项取自官方词条）。
   - **内部状态用枚举，不用中文当键**：终局赛季状态是 `MazeStatus`（`live`/`ended`/`upcoming`/`unknown`），DOM `data-status` 与 CSS 类名都用枚举，展示文案由 `endgame.status.*` 词典键解析——旧写法把中文状态字符串同时当「类名映射的键」和「界面文案」，多语言下必然二选一。
   - **判定与文案分离（同一坑位已复发两次）**：任何把**本地化后的文案**拿去做 `===` 比较、当 `:key`、当 CSS 类名来源、当缓存键的地方，在非缺省语言下都会静默失效。已修两处：推荐优先级（`grp.priority === '首选'` → lib 返回 `'first' | 'second'` 枚举 + `recommendPriorityKey()`）、赛季状态（`currentSeasonStatus === '未知'` → `currentSeasonStatusKey` 枚举）。判据：**值来源是 `t()` / `translate()` ⇒ 它就不能进判定分支**；需要判定就在同一处留一个枚举/键。
   - **词典里的官方术语必须取官方译文**：`python tools/fill-ui-messages.py`（回填）/ `--check`（漂移检查）把「全部 / 命途 / 弱点 / 玩法名」这类术语直接用官方文本表的 13 语言译文写入词典，站点自造标签走该脚本的 `AUTHORED` 表人工撰写；同形多义（命途 → 界面义 "Path" 而非剧情义 "Fate"）必须人工指定 hash。
   - **枚举展示名（属性 / 部位…）不进词典**：它们是既有数据源的官方词条，经 `src/lib/enum-labels.ts`（`propLabel` / `relicSlotLabel`，标签表在挂载前加载一次并常驻）读取，`lib/constants.ts` 只留与语言无关的图标 / 序号映射——写死中文展示名即第二事实源。目录卡 HTML 是模板字符串拼的 `<a href>`（不走 RouterLink）⇒ 站内取址一律经 `activeHref()`，否则非缺省语言下卡片会静默跳回缺省语言。

## 新增目录/模块扩展指南（端到端）

1. **数据侧（Python）**：在 `tools/converter/converters/<name>.py` 实现 `convert()`（读 ExcelOutput 源表 → `save_json` 到 `public/data/cn/`），并登记到 `convert.py` 的 `MODULES` 注册表（增量跳过与 `--only` 均以注册表为准）；补 `tools/converter/tests/` 纯函数契约测试
2. **目录侧（TS）**：`src/app/catalog/pages/<id>.ts` 定义 `CatalogPageConfig`（卡片模板字符串渲染 + 用户可见文本 `escHtml()`）→ `pages.ts` 注册 → `src/app/router/index.ts` 添加路由，`meta.catalog` 指向目录 ID；带专属样式的目录在配置 `styles` 字段声明即可随路由并行加载
3. **验证**：按主文件「验证流程」级别验收；新增目录属「例外确认」类改动，先按主文件「任务交付流程」第 2 条列可断言的验收标准

## 已知环境坑位（CDN 图片加载类问题先读本节，禁止绕路重复排障）

### jsDelivr burst 限流（多次实证，处置路径已固化）

- **现象**：页面同时加载大量 CDN 图（角色页 301 张 / 铸币墙 9 张并发）时，部分 img 立即失败或长期挂起（`complete=false`），**浏览器不自动重试**；curl 或 `new Image()` 独立连接同 URL 却成功。本机系统代理不影响（Playwright 显式配 proxy 实测无改善）。
- **窗口特征**：同出口 IP 突发请求触发 GitHub 源 429 burst；9 张级并发窗口约 1-2 分钟恢复，301 张级更长，窗口内每轮恰放行 1-2 张。
- **正确处置三步（禁止自由发挥）**：
  1. curl 独立连接探测 URL（单/少量并发 200 即 URL 有效——环境问题，非代码缺陷）；
  2. 渲染态断言改用 `waitForFunction` 轮询等窗口恢复，或改用独立连接 HTTP 探测（`page.request.head`）；
  3. 判定环境限流后**禁止改代码规避**（真实用户网络正常）；新增页面控制单页并发图数可减轻症状。
- **静态死链（真 404）审计**：归 `tools/dead-links.test.ts`（专用配置 `tools/dead-links.vitest.config.ts`），本机按需跑，**不在 e2e 重做**（重构决策见 `ci.yml` / `data-sync.yml` 注释）。
