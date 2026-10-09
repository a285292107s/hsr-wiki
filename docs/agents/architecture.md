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
public/data/cn/*.json（随站部署，唯一展示数据源）
   │ fetchJSON<T>（src/services/cache.ts：15s 超时 / NkError / AbortController）
   ▼
services/api/<域>.ts（按域加载器；共享列表 = 模块级单例 Promise）
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
2. **数据流向**：`Pinia store` → `src/services/api/` 纯函数 → 本地 JSON（`public/data/cn/`，随站部署）；图片 URL 经 `src/services/cdn/` 纯函数解析。Store 负责加载编排、缓存与错误处理。
3. **本地优先数据**：全部目录/详情数据为预转换 JSON；仅图片与 Spine 动画在运行期走 CDN。CDN 基址定义于 `src/lib/constants.ts → CDN`。
4. **单强调色主题**：全站（含货币战争）共用一套可切换强调色（缺省橄榄青），开关为 `<html data-accent>`；货币战争的 `meta.cw` → `<html data-theme="cw">` 只作**模式标记**，不再重映射颜色（[ADR 0041](../adr/0041-主题色统一为单强调色通道.md)），CW 路由位于 `/currency/*`。令牌分层与强调色通道见 [ui-design.md](ui-design.md) §2/§3。
5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 的 `meta.depth` 得到 `navDir`（1 前进 / -1 返回 / 0 平级），`App.vue` 据此选择过渡动画。桌面/平板为**交叉过渡**（两视图重叠，离场视图在上层且起步更早，见 [CONTEXT.md](../../CONTEXT.md)「页面过渡」）；手机端（<768px）、平级导航与 `prefers-reduced-motion` 统一简单淡入淡出。
6. **样式随路由懒加载**：页面 CSS 在对应视图组件内 `import`，由 Vite 拆为独立 CSS chunk；全局样式仅 `tokens.css` + `catalog.css`。分层、命名与共享原语纪律见 [ui-design.md](ui-design.md) §1。
7. **无侧栏枢纽（已作废，见 [ADR 0019](../adr/0019-枢纽页导航条回归与首页改为版本上新页.md)）**：曾由 `route.meta.bareNav` 标记的枢纽页（`/` 与 `/currency`）在**所有断点**都不渲染 `SidebarNav`，并以 `<html data-nav="bare">` 令 `--nk-content-offset` 回退为页面留白（平板 32 / 桌面 48）。**该形态、该旗标与该属性均已作废**——两页全断点恢复导航条，`/` 改为版本上新页（本版本新增角色 / 光锥 / 遗器）。术语见 [CONTEXT.md](../../CONTEXT.md)「无侧栏枢纽」（已移除）。

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
