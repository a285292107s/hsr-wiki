# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## 项目概述

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》数据展示型 Wiki。数据源为本地 JSON（由 Python 工具从官方解包数据转换而来），图片走 jsDelivr 官方镜像与 nanoka 双源回退，Spine 动画走 `https://static.nanoka.cc` CDN。

> 术语与规范速查：领域术语与 `_Avoid_` 禁用词以 `CONTEXT.md`（术语表）为准；架构决策记录见 `docs/adr/`（0002-0014，按需读取）；字段审计裁决文档见 `docs/audit/`。

## 常用命令

```bash
# 安装依赖（需 Node 22+；本地与 CI 均使用 packageManager 指定的 pnpm 11）
pnpm install

# 本地开发 → http://localhost:5173/（strictPort：端口被占用时明确报错，先探测 5173 复用已有实例，无实例才新起）
pnpm dev

# dev 缓存自愈（rolldown-vite 8 Windows 坑位，排查见 docs/memory/2026-08-13.md）
# 症状：改 CSS/TS 后 dev 永远返回旧内容（事件被软失效吸收，无 mtime 兜底），重启才恢复
# 用法：仅当「文件已最新但 dev 响应旧」时执行——node tools/refresh-vite-cache.mjs <文件/目录...>
# 纪律：先诊断（curl 对比磁盘特征串）→ 自愈 → 才允许重启；禁止引入自动改源文件的失效方案（已废弃）
node tools/refresh-vite-cache.mjs

# 类型检查 + 生产构建 → dist/（前置 check-guards 三守卫：色彩收口 / Spine 清单 / 对比度）
pnpm build

# 预览构建产物
pnpm preview

# 运行全部测试
pnpm test

# 运行单个测试文件
pnpm vitest run src/services/__tests__/api.test.ts

# 监听模式
pnpm test:watch

# e2e 分层（Playwright，自动起 dev server；2026-08-15 决策：视觉基线回本机，详见 ci.yml 注释）
#   CI 层（layout + a11y，零外部依赖、环境无关）：
pnpm test:e2e:ci
#   本机层（含像素基线，基线在本地 Windows 刷新；CI 不跑 visual）
pnpm test:e2e
pnpm test:e2e:update   # 刷新像素基线（确认改动是预期后；必须显式 =all——默认 changed 模式更新已有基线会静默不写）
pnpm exec playwright test e2e/visual.spec.ts --grep 首页   # 仅首页像素基线（改动只影响首页时用，避免全量 ~90s）
pnpm exec playwright test e2e/layout.spec.ts e2e/visual.spec.ts --grep 首页   # 常规快速回归：布局 + 首页基线

# 研究线（Spine Lab，独立子应用 → http://localhost:5174/）
pnpm dev:lab        # 研究线 dev（独立端口 5174，与主项目 5173 互不抢占）
pnpm build:lab      # 研究线构建（vue-tsc 独立 tsconfig + vite build）
pnpm test:lab       # 研究线单测（独立 vitest 配置，不进主项目 pnpm test）

# 数据转换工具（Python，需 vendor/TurnBasedGameData 本地目录，见 .gitignore 注释）
cd tools/converter
pip install -r requirements.txt
python convert.py                        # 全量转换（增量跳过未变更）
python convert.py --only characters      # 仅重跑指定模块
python convert.py --force --pretty       # 强制全量 + 缩进输出
python -m pytest tests/ -v               # converter 单元测试

# 本地数据探索工具（query.py / gen_catalog.py）用法见 docs/agents/data-pipeline.md

# fastctx（MCP 仓库工具，已注册于 .qoder-cn/mcp.json；文件工具 4 个已生效，Bash 工具默认未启用，见「项目约定」）
fastctx status        # 检查配置/二进制/MCP 握手状态（[PASS]/[INFO]/[FAIL]）
fastctx jobs          # 列出所有会话的后台任务（Bash 工具启用后才有内容）
```

部署：推送到 `main` 分支 → Vercel 自动构建部署（SPA 路由重写见 `vercel.json`）；回滚 = Vercel Dashboard → Deployments → 选中上一个构建 Rollback。

> 门禁语义（软门禁）：main 分支 protection 仅保留防 force push 与防删除
> （required status checks / enforce_admins / PR 强制均已移除）——push main 直接通过，推送后
> CI（`unit-tests` + `e2e`＝layout+a11y）自动运行，失败由 GitHub 通知；Vercel 生产构建（`pnpm build`
> 含 vue-tsc + 色彩/清单/对比度三守卫）为上线前最后一道守卫（CI 不再重复跑 build，见 ci.yml
> 注释），构建失败不部署、可一键回滚。
> 注意：本地推送前仍建议先跑 `pnpm build` + `pnpm test` 自检（CI 红不会拦 push，但会留失败记录）。

## 架构

> 详细的架构资料按主题拆分（本文件之外）：
> - 分层结构 / 研究线（Spine Lab）/ 核心架构模式 / 新增目录扩展指南 → @docs/agents/architecture.md
> - 数据转换管线 / 本地数据探索 / Converter 模块 → 源文件映射 → @docs/agents/data-pipeline.md
> - 测试体系（Vitest / Playwright e2e / pytest）→ @docs/agents/testing.md
> 以下为每次改动前必知要点：

- **配置驱动目录页**：所有列表页均为 `CatalogPageConfig`（`src/app/catalog/pages/` 子模块 + `pages.ts` 注册，目录清单以注册表为准）+ 单一 `CatalogView` 按 `route.meta.catalog` 渲染，无需新视图；带专属样式的目录在配置 `styles` 字段声明，自动随路由并行加载
- **本地优先数据**：全部目录/详情数据为预转换 JSON（`public/data/cn/`，converter 输出）；仅图片与 Spine 动画运行期走 CDN（基址 `src/lib/constants.ts → CDN`）
- **双模式主题**：常规（黑紫）vs 货币战争（黑金，`meta.cw` → `<html data-theme="cw">`，见 ADR 0011）；`meta.depth` 驱动方向性页面过渡（手机端 <768px 淡入淡出）
- **样式随路由懒加载**：页面 CSS 随视图 import 拆为独立 chunk；全局仅 tokens.css + catalog.css（样式分层原则见「项目约定」）
- **数据边界**：`vendor/TurnBasedGameData`（2140+ 文件 / ~250 MB + TextMap ~830 MB）**禁止直接读取**——数据探索一律走 `query.py` / `DATA_CATALOG.md`，转换走 `convert.py`（用法见 @docs/agents/data-pipeline.md）

## 任务交付流程

用户抛出任务后的执行契约。核心原则：**数据可自动沉淀 · 默认直接做，例外经确认**。

1. **默认直接做**：机械、可验、可回滚的改动（数据/文案/样式数值/加字段）直接执行，无清单无确认。
2. **例外确认**：意图有歧义、有设计自由、或命中跨模块公共基础（shared 组件 / 共享样式 / services 核心）的改动 → 简述方案与可断言结果，一次确认后执行。
3. **执行与验证**：按「验证流程」节预算执行，超预算即降级并记录（禁全量 e2e，见该节纪律）；收尾汇报：改动 diff + 验证结果 + 降级/豁免说明。
4. **返工**：失败先修本层（低层失败不触发全量重跑）；同一问题两次修复尝试未果，停下向用户说明情况，不自动重试。
5. **沉淀**：收尾时命中（用户纠正流程 / 返工 ≥2 次 / 重要教训）→ 写入 `docs/memory/` 日志；流程规则改进须用户确认后生效。

## 项目约定

- Vue SFC 统一使用 `<script setup lang="ts">`
- 字段筛选遵循 `docs/audit/字段价值审计流程.md`：AI 生成解读卡（字段名→人话语义→证据→置信度→价值建议），人工裁决四档分级；AI 无权判 🔴 排除（闸门 1），StarRailRes 基线有而本地无的字段必须标 ⚪ 待定（闸门 2）
- 路由使用 `createWebHistory`（History 模式）——Vercel 支持 SPA fallback
- Vite `base` 为 `/`——Vercel 部署于域名根路径
- CSS 采用 BEM 风格命名，统一 `nk-` 前缀（如 `nk-cat-card__img`）
- 样式分层：tokens.css = 设计令牌 + 跨页共享原语（nk-tabs / nk-panel 等）；catalog.css = 目录引擎专属（含 v-html 卡片，scoped 无法命中）；页面 css = 页面专属（随路由懒加载）。页面间复用样式先查原语，禁止在页面 css 复制粘贴；组件专属样式（如货币战争 Hub 的导航）用 SFC scoped style，不污染全局命名空间
- 全局设计令牌位于 `src/styles/tokens.css`；不使用 CSS 预处理器
- 先确认模型有没有识图功能，如果模型没有识图功能，不要截图，直接用 DOM 与计算样式取证
- 首页 Hero 断点策略：桌面（≥1024px）渲染官网 KV Spine 场景（home-bg 全量层）；平板（768-1023px）与手机（<768px）不渲染 Spine，改为随机五星立绘轮播（6s 交叉淡入淡出，`prefers-reduced-motion` 停播，后台标签页停播）。布局改动须保持该策略（策略与实现见 HomeView.vue 注释）
- ADR 门槛：ADR 仅用于「不可逆 / 跨模块架构决策」；单文件配置、数值调整、流程细节类决策写入 `docs/memory/` 复盘日志或 commit message，不再新增 ADR
- commit message 使用 Conventional Commits 风格（`feat:` / `fix:` / `chore:` 等，与 data-sync 自动化提交一致）；流程细节类决策写入 message 正文
- 项目不配置 ESLint / Prettier：代码风格靠 vue-tsc 类型检查 + 本文件约定 + 代码审查保证，禁止擅自引入 lint 工具链
- **注释第一读者是后续接手的 AI**：注释本质是传递给未来 AI 代理的行为约束与领域知识，写成可执行指令形态（「禁止…」「必须…」「X 是唯一收口/单一事实源」）——AI 会字面执行注释内容。只写可验证事实（数据映射规则、路径特例、架构委约、坑位），无代码/数据证据不写「为什么」（防 AI 编造决策过程）；禁止复述实现（不解释代码在做什么）；禁止过期断言（日期、版本号、「已修复」——历史职能归 docs/memory/）
- **注释落位分层**：文件内局部约束就近注释在真相发生处；跨文件/跨会话约束进本文件或 docs/memory/；不可逆架构决策进 docs/adr/；术语进 CONTEXT.md。排查出的坑位（数据特例/时序陷阱/环境问题）必须当场注释——后续 AI 未被告知必重复踩坑
- **fastctx 工具边界**：fastctx MCP 已注册生效，提供 4 个文件工具——inspect_local_file（支持批量 1-32 文件/翻页/GBK 编码）、grep（尊重 .gitignore）、glob、replace（dry_run 预览 + 原子写入 + 保留原编码/BOM/换行）；Bash 工具（run/run_background/job_output/job_kill/job_list）默认未启用，禁止假设其可用（启用由用户在 fastctx 控制终端 Config 操作）。批量机械替换（符号重命名/导入重写/配置键迁移）优先走 replace 的 `dry_run` 预览，规避 PowerShell 转义与 UTF-8 陷阱；replace 同样受「数据边界」约束，禁止写入 vendor/TurnBasedGameData

## 验证流程

> 分级收敛：改动前先定**可断言的验收标准 + 终止条件**（如「icon 160px、无边框、无溢出」而非「布局正常」），按级别验证，达标即停；
> **验证成本与风险敞口成正比**：能静态审查确认的（字面量数值、简单算术、断点区间、选择器覆盖范围）不启动浏览器；CSS 语法错误由 dev server 编译即时暴露。
> 模型无识图能力时一律走 DOM 与计算样式取证（见「项目约定」），禁止截图路径。

| 级别 | 任务类型 | 验证内容 | 预算 |
|---|---|---|---|
| T0 | 数据层 / 纯函数 / API | `pnpm test` + `pnpm build` 即止 | — |
| T1a | 纯 CSS 数值微调（尺寸/间距/颜色，无选择器结构变化） | 守卫 + RunPreview 肉眼确认；**不启动 headless 取证** | ≤5 min |
| T1b | CSS 布局/结构变化（选择器、flex/grid、断点区间） | 守卫 + `pnpm test:e2e`（toHaveCSS / 溢出检测 / 像素基线，仅取有疑问的断点）；审美项 RunPreview | ≤10 min |
| T2 | 模板结构 / v-if / v-for / 数据流 | 守卫 + `pnpm test:e2e`（toHaveText / toHaveCount / a11y 扫描）；较大改动按需 | ≤15 min |
| T3 | Spine / Canvas / 动画 / 异步编排 | 守卫 + 取证金字塔 L1-L4 按需；先探测 `visibilityState` 与 rAF（后台标签页挂起陷阱） | ≤30 min |

执行纪律（超预算即降级）：
- **降级必须记录**：任何「超预算降级」「跳过某级验证」「豁免项」必须在交付记录/回复中写明（原级别、降级原因）；禁止静默降级——降级即覆盖缩减，未记录视为漏测，且作为「任务交付流程」第 5 条的沉淀信号
- **验证耗时控制**：`visual.spec` 全量禁止——只跑改动实际影响的用例（`--grep 首页` 等），与改动无关的 character/endgame/currency 用例直接跳过；同一会话内全量 e2e 最多执行一次；T1a/T1b 纯 CSS 改动用守卫 + 单探针计算样式断言 + `layout.spec`（约 20s）即可，不跑像素基线
- **环境问题先排除**：headless 内 CDN/网络加载失败先判定环境性（`curl` 验证 URL 可达），不当代码缺陷深究
- **dev 缓存陈旧先自愈**：dev 下怀疑「改了不生效」时禁止直接重启分析——先 `curl` 对比 dev 响应与磁盘特征串定位，再 `node tools/refresh-vite-cache.mjs` 自愈（详见常用命令区注释与 docs/memory/2026-08-13.md）；该问题根因是 rolldown-vite 8 事件软失效吸收，`usePolling` 已配置但不根除
- **CDP / headless 取证（兜底，仅 Playwright 覆盖不到时启用）**：首选 Chrome（`--disable-extensions` + 独立 `--user-data-dir`，启动后验 `/json` 隔离，出现未知标签页立即 kill）；探针脚本单 evaluate 一次成型、总超时 30s，含正则/引号/`$` 的脚本一律 Write 成 `.mjs`/`.ps1` 执行、禁止内联（PowerShell 转义 + Bash 预展开 `$var` 陷阱）；结果用 node `writeFileSync` 落盘、禁止 shell 重定向 `>`（中文 Windows PowerShell 损坏 UTF-8）；evaluate 无响应 15s 内 kill 重启一次，仍失败降级 `--dump-dom`（L1），禁止在卡死页面上重试
- **PowerShell 编码**：pwsh 7 `[Console]::OutputEncoding` 默认 gb2312，解码外部程序（node）的 UTF-8 stdout 会乱码；管道外部输出前前缀 `[Console]::OutputEncoding = [Text.UTF8Encoding]::new()`；读文件显式 `-Encoding UTF8`
- **条件等待与清理**：用 `page.waitForFunction` / `expect.poll` 精确条件，禁止固定 sleep 与长轮询；不等待与断言目标无关的就绪状态（如只查 padding 就不等 spine 渲染）；验证确认后单独 Remove-Item 清理临时文件

## 强制规则（MUST）

> **双视图同步**：本节与 `.opencodereview/rule.json` 是同一约束的双视图（本节 = 生成期约束，AI 写码时遵守；rule.json = 评审期视图，OCR 检查时加载）。修改本节任一已映射条目（请求层 2 条 / 类型定义归属 / 目录页 2 条 / 文本数据来源 / 色彩三层令牌）必须同步 rule.json 对应条目，反之亦然；「共享列表单例」与「构建守卫」为流程/CI 约束，不进 rule.json。

### 请求层

- **禁止裸 `fetch`**：所有 HTTP 请求必须走 `services/cache.ts` 导出的 `fetchJSON<T>(url)`。它提供 15s 超时、NkError 包装、AbortController 中断。绝不允许在 api.ts 或视图层直接调用 `fetch()`。
- **错误类型统一**：请求失败必须抛出 `NkError(message, true)`（operational），由 store 层决定是否展示重试 UI。禁止抛裸 `new Error()`。

### 数据层

- **共享列表单例**：`characters.json` / `light_cones.json` / `relics.json` 使用模块级单例 Promise（失败自动重置允许重试）。新增同类共享数据必须沿用此模式。
- 类型定义归属：所有共享接口必须定义在 `services/types/`（按域拆分，index.ts barrel）。`services/api/` 仅允许 `import type` + 函数实现，禁止内联定义 export interface。

### 目录页

- **一目录一文件**：每个目录页配置必须放在 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册。禁止在 `pages.ts` 中直接编写目录逻辑。
- **卡片渲染**：目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能。所有用户可见文本必须经 `escHtml()` 转义。

### 通用

- **文本数据来源**：所有展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **色彩三层令牌**：所有颜色必须落入 tokens.css 三层令牌体系——原始层（`--ph-*` / `--gold-*` 色阶事实）、语义层（`--primary` 等主题映射，派生色用 `color-mix(in srgb, var(--primary) X%, transparent)` 表达）、领域层（`--rarity-*` / `--prop-*` / `--elem-*` / `--skill-*` / `--diff-*` 数据语义色，不随主题）。禁止在页面 CSS/组件内联裸色值（豁免：中性灰阶/黑/白/深底色、`var()` fallback；CW 专属 `currency-*` 文件待迁移）。新增颜色先查令牌，缺失则落入对应层。可用 `node tools/check-colors.mjs --strict` 扫描未收口色值。
- **构建守卫**：每次变更必须通过 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。