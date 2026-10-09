# AGENTS.md

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》数据展示型 Wiki（Vue + TypeScript + Vite + Pinia / Vue Router）：数据由 Python 工具 `tools/converter` 从官方解包数据离线转换为本地 JSON 随站分发，图片与 Spine 动画在运行期走 CDN 双源回退。

> **加载指引**：先读本文件；确认命中某域后再按「任务 → 必读」读**对应那一份**子文件——不预读、不整目录通读。
> 术语与 `_Avoid_` 禁用词以 [CONTEXT.md](CONTEXT.md) 为准；决策 [docs/adr/](docs/adr/)、字段裁决 [docs/audit/](docs/audit/)、数据源与字段探索 [docs/data/](docs/data/)、Spine 机制 [docs/spine/](docs/spine/)、按域坑位 [docs/memory/](docs/memory/)。

## 任务 → 必读

> 「必读」= 规则（目标形态）；「坑位」= 该域静默失败的判据——两者都要，**坑位只读对应域那 1 份**，作用是省掉一次返工。
> 本表是 `docs/agents/*` 的**唯一入口索引**：新增 `docs/agents/` 子文件必须在此登记（[doc-audit.mjs](tools/doc-audit.mjs) 检查②）；`docs/adr/` / `docs/audit/` / `docs/data/` / `docs/spine/` 按上节目录链接进入，不逐文件登记。
> 子文件一律用相对链接引用——**禁止改回 `@path` 导入写法**（Qoder 等工具会把 `@` 递归展开为 include，子文件全量塞进上下文，失去按需加载）。

| 你要做的事 | 必读（规则） | 坑位（该域 memory） |
| --- | --- | --- |
| 任何改动（硬约束 / 验证级别 / 文档落位 / 工作区） | 本文「强制规则」+「验证流程」+「文档分级」+「工作区与提交」 | [docs-process.md](docs/memory/docs-process.md) |
| 目录页 / 路由 / 分层结构 / 研究线 / 新增目录端到端 | [architecture.md](docs/agents/architecture.md) | [architecture.md](docs/memory/architecture.md) |
| 技术栈 / 版本 / 依赖现状与禁用清单 | [tech-stack.md](docs/agents/tech-stack.md) | [build-deploy.md](docs/memory/build-deploy.md) |
| 数据转换 / 字段探索 / vendor 数据查询 | [data-pipeline.md](docs/agents/data-pipeline.md) | [data-pipeline.md](docs/memory/data-pipeline.md) |
| 数据源总结 / 字段与研究文档查询 | [docs/data/](docs/data/) + [DATA_CATALOG.md](tools/converter/DATA_CATALOG.md)（总索引，按需读 [.parts/](tools/converter/DATA_CATALOG.parts/) 分片） | [data-pipeline.md](docs/memory/data-pipeline.md) |
| 转换器字段映射（表 → 输出 JSON） | [转换器字段映射.md](docs/data/转换器字段映射.md) | [data-pipeline.md](docs/memory/data-pipeline.md) |
| 数据口径 / 赛季代际 / 展示数值判据 | ADR 数据裁决（`docs/adr/` 索引） | [data-semantics.md](docs/memory/data-semantics.md) |
| 术语 / 命名 / 禁用词 / 玩家侧文案措辞 | [CONTEXT.md](CONTEXT.md) | [data-semantics.md](docs/memory/data-semantics.md)（命名裁决） |
| Spine 机制 / 官网抓取 / 技能预览动画抓取 / 黑块成因 | [docs/spine/](docs/spine/) | [spine.md](docs/memory/spine.md) |
| AI 检索可见性 / 预渲染快照 / robots.txt / sitemap | [ai-discoverability.md](docs/agents/ai-discoverability.md) | [ai-visibility.md](docs/memory/ai-visibility.md) |
| 写改测试 / e2e 分层 / 像素基线 | [testing.md](docs/agents/testing.md) | [testing.md](docs/memory/testing.md) |
| 命令 / 端口 / dev 缓存陈旧 / 临时工作区 / 部署与门禁 | [commands.md](docs/agents/commands.md) | [build-deploy.md](docs/memory/build-deploy.md) |
| UI 样式 / 色彩令牌 / 主题与强调色 / 断点 / 反 AI 味 | [ui-design.md](docs/agents/ui-design.md) | [ui-tokens.md](docs/memory/ui-tokens.md) |
| UI 质量验收标准（获奖级达标判据 / 分层门禁 / 终止条件） | [UI质量验收标准.md](docs/audit/UI质量验收标准.md) | [testing.md](docs/memory/testing.md) |
| 视觉职责边界 / 降级与耗时纪律 / 环境性排障 / 取证金字塔 / headless 与 PowerShell 陷阱 | [verification.md](docs/agents/verification.md) | [testing.md](docs/memory/testing.md) |
| 代码与注释规范 / ADR 门槛 / commit 风格 / 字段审计 | [conventions.md](docs/agents/conventions.md) | [docs-process.md](docs/memory/docs-process.md) |

## 常用命令

```bash
pnpm install            # 依赖安装（版本口径唯一落位 tech-stack.md）
pnpm dev                # → http://localhost:6188/（固定端口 strictPort；禁止改回 5173；「改了不生效」先自愈，见 commands.md）
pnpm build              # 三守卫（色彩收口 / Spine 清单 / 对比度）→ vue-tsc -b → vite build → AI 端点生成 + AI 端点守卫
pnpm test               # 运行全部测试（Vitest）
pnpm vitest run <文件>   # 运行单个测试文件
pnpm test:e2e:affected  # 只跑按 git diff 推导出的受影响用例（「禁全量 e2e」的落地命令）
pnpm test:e2e:ci        # e2e CI 层（layout + a11y）
node tools/gen-ai-endpoints.mjs   # 单独重建 AI 快照（读 dist/index.html 为模板，须先 vite build）
node tools/check-ai-endpoints.mjs # AI 端点守卫（快照正文/内链/sitemap/robots 覆盖率；pnpm build 末步自动跑）
node tools/check-doc-links.mjs   # 文档链接校验（断链或误删引用即非零退出；仅手动，未进 CI）
node tools/doc-audit.mjs         # 文档结构化审核（体量红线 / 路由登记 / 版本号 / 汇报腔；改文档后跑）
```

全量命令手册（e2e 分层与像素基线、研究线 `/debug`、converter、漂移检查器、部署与门禁、dev 缓存自愈）见 [commands.md](docs/agents/commands.md)。

## 架构（每次改动前必知）

> 只留「动手前必须知道、且子文件不便替代」的判据；细节与决策经过见子文件与 ADR——**同一事实不在两处重述**。

- **配置驱动目录页**：列表页一律 `CatalogPageConfig`（`src/app/catalog/pages/` + `pages.ts` 注册，目录清单以注册表为准）+ 单一 `CatalogView` 按 `route.meta.catalog` 渲染；专属样式在配置 `styles` 声明，随路由并行加载。
- **本地优先数据**：目录 / 详情数据全部是预转换 JSON（`public/data/cn/`）；仅图片与 Spine 动画运行期走 CDN（基址 `src/lib/constants.ts → CDN`）。
- **单强调色主题**：全站（含货币战争）共用一套可切换强调色，开关 `<html data-accent>`；`meta.cw` → `<html data-theme="cw">` 只是**模式标记**，不重映射颜色（[ADR 0041](docs/adr/0041-主题色统一为单强调色通道.md)）。色板、缺省值与令牌分层见 [ui-design.md](docs/agents/ui-design.md) §2/§3。
- **样式随路由懒加载**：页面 CSS 随视图 import 拆独立 chunk；全局仅 tokens.css + catalog.css。
- **首页＝版本上新页**：`/` 与 `/currency` **全断点渲染导航条**；`/` 为品牌带 + 角色 / 光锥 / 遗器三分区 + 页脚，跨模式只走侧栏「交换」（[ADR 0019](docs/adr/0019-枢纽页导航条回归与首页改为版本上新页.md)）。
  - **禁止按 ADR 0018 旧形态回改**（板块索引、无侧栏、「首页 8 行入口首屏可见」断言均已作废）；**禁止恢复全屏媒体层 / 立绘轮播 / 枢纽滚轮**。
  - 现行断言在 `e2e/layout-home.spec.ts` 与 `e2e/layout-hub.spec.ts`。
- **两页条目判据互斥，禁止混用**：常规首页＝**版本增量**（`release_version` 恰等于 `version.json` 的 `version_label`）；货币战争＝**赛季代际差集**（`is_season_new`，仅角色 + 羁绊，文案不显示赛季号）。
  - 前端只读字段、判据在 converter——字段见 [转换器字段映射.md](docs/data/转换器字段映射.md)，决策见 [ADR 0019](docs/adr/0019-枢纽页导航条回归与首页改为版本上新页.md) / [ADR 0020](docs/adr/0020-货币战争枢纽页改为本赛季新增页.md)。
- **数据边界**：`vendor/TurnBasedGameData` **禁止直接读取或写入**——探索走 `query.py`，字段结构走 `DATA_CATALOG.md` 总索引（按需读 `.parts/` 分片，禁整读），转换走 `convert.py`。
- **AI 检索可见性＝构建期预渲染快照**：服务端 HTML 决定可见性（实测爬虫零 JS 执行）；`pnpm build` 末步生成 `dist/prerender/**.html`，`vercel.json` 在 catch-all 之前用明确 rewrite 投递，JS 用户与爬虫拿到同一份 HTML（非 cloaking）。
  - **新增可索引路由必须同步快照 + rewrite + sitemap**，否则末步守卫 `tools/check-ai-endpoints.mjs` 失败（契约见 [ai-discoverability.md](docs/agents/ai-discoverability.md)）。

> 分层结构与依赖矩阵 / 研究线（Spine Lab）/ 新增目录扩展指南（端到端）→ [architecture.md](docs/agents/architecture.md)

## 任务交付流程

用户抛出任务后的执行契约。核心原则：**数据可自动沉淀 · 默认直接做，例外经确认**。

1. **默认直接做**：机械、可验、可回滚的改动（数据 / 文案 / 样式数值 / 加字段）直接执行，无清单无确认。
2. **例外确认**：意图有歧义、有设计自由，或命中跨模块公共基础（shared 组件 / 共享样式 / services 核心）→ 简述方案与可断言结果，确认后执行。
3. **执行与验证**：按「验证流程」级别与预算执行，超预算即降级并记录（禁全量 e2e）；收尾汇报改动 diff + 规格验证结果 + 降级/豁免说明，视觉改动附加「视觉待用户确认」清单。
4. **返工**：失败先修本层（低层失败不触发全量重跑）；同一问题两次修复未果即停下说明，不自动重试。
5. **沉淀**：命中（用户纠正流程 / 返工 ≥2 次 / 重要教训）→ 写入 [docs/memory/](docs/memory/) **对应域**文件（按域组织，禁止按月 / 按日新建；见 [memory/README.md](docs/memory/README.md)）；流程规则改进须用户确认后生效。

## 文档分级（可逆性路由）+ 重构期模式

> 本节是「这次改动该不该写文档、写到哪」的**唯一路由原则**；可逆性判据与正反例在 [conventions.md](docs/agents/conventions.md)，细则一律进子文件。

**同一事实只在一处声明**：同一规则在两处出现即视为漂移，删至一处。

| 改动性质 | 判据 | 落位 |
| --- | --- | --- |
| 可逆的展示迭代（数值 / 块序 / 形态 / 文案） | 被推翻后返工只限于展示层，且不改变任何下游契约 | `docs/memory/` 一段 + commit message 正文；**不开 ADR、不同步子文件** |
| 不可逆决策（数据判据 / 路由 / 字段归属 / 令牌层级） | 推翻即牵动数据口径、导航形态或跨模块契约 | ADR（门槛判据与正反例见子文件） |
| 契约变化（新目录页 / 新令牌类别 / 新 e2e 分层 / 新命令） | 新增了后续要依赖的登记项 | 对应子文件（按上方路由表登记） |

**memory 写法（防流水账）**：memory 只留**判据与坑位**；过程叙事与验证数字（实现落点 / 用例数与耗时 / 降级记录 / 交付清单 / 时序编号）一律进 commit message。三条准入判据见 [memory/README.md](docs/memory/README.md)。

**重构期模式**：UI 重构迭代期内展示层反复变动，验收基准从「取值正确」降为「不变量与契约不破」——只跑不变量层与受影响用例，不为可逆改动开 ADR / 同步子文件 / 逐轮刷新像素基线；收敛后一次性重建基线，并补登记本轮真实发生的契约变化。

## 强制规则（MUST）

> **生成期约束唯一来源**：本节是强制约束的生成期视图，每条只写可判定的判据 + 守卫命令 + 细则出处，不复述子文件。

- **不读就不断言**：未实际读取文件，禁止声称「已检查 / 已确认」；路径与事实一律用工具核验，不靠推测。
- **禁止裸 `fetch`**：数据请求一律走 `src/services/cache.ts` 的 `fetchJSON<T>(url)`（超时 / `NkError` / 中断），api 与视图层禁止直接调 `fetch()`。**唯一登记豁免**：`src/services/cdn/health.ts` 的 CDN 健康 HEAD 探针；新增裸 `fetch` 必须在此登记。
- **错误类型统一**：请求失败必须抛 `NkError(message, true)`（operational），由 store 层决定是否展示重试 UI；禁止抛裸 `new Error()`。
- **共享列表单例**：`characters.json` / `light_cones.json` / `relics.json` 用模块级单例 Promise（失败自动重置允许重试）；新增同类共享数据沿用此模式。
- **类型定义归属**：共享接口一律定义在 `src/services/types/`（按域拆分 + index barrel）；`src/services/api/` 只允许 `import type` + 函数实现，禁止内联 `export interface`。
- **一目录一文件**：目录页配置放 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册；禁止在 `pages.ts` 里写目录逻辑。
- **卡片渲染**：目录卡片 HTML 用模板字符串（非 Vue 组件，为虚拟滚动性能）；所有用户可见文本必须经 `escHtml()` 转义。
- **文本数据来源**：展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **禁止手改生成物**：`public/data/**` 是 converter 输出，重跑即整体覆盖——文本 / 数值有误改 `tools/converter/` 后重跑，**禁止直接编辑产物 JSON**；同理禁止手工追加 `DATA_CATALOG.md` 分片。
- **色彩令牌收口**：颜色必须落入 `tokens.css` 四层令牌（原始层色阶 → `--th-*` 别名层（全站唯一，随 `data-accent`）→ 语义层 → 领域层）；派生色用 `color-mix(in srgb, var(--primary) X%, transparent)`。
  - 禁令：页面 CSS / 组件内联裸色值；消费层直接引用原始层；领域色引用别名层。
  - 守卫：`node tools/check-colors.mjs --strict` 与 `node tools/check-contrast.mjs --strict` 必须全绿；四层定义、豁免与新增流程见 [ui-design.md](docs/agents/ui-design.md) §2/§5。
- **构建守卫**：每次变更必须 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。
- **版本号禁入叙述性文档**：README / 本文件 / `docs/agents/` 子文件只写**选型名**；版本口径唯一落位 [tech-stack.md](docs/agents/tech-stack.md)，由 `node tools/doc-audit.mjs` 与 `package.json` / `requirements.txt` / CI 工作流逐字比对。
- **依赖准入**：新增依赖（含 devDependencies）与已有依赖大版本升级都先经用户确认，并说明「为何现有依赖 / 原生实现不够」。运行时依赖维持 `vue` / `pinia` / `vue-router` 三件——前端数据 / UI / 工具类一律不引库（禁用清单见 [tech-stack.md](docs/agents/tech-stack.md) §5）。
- **改动范围最小化**：只改任务明确要求的内容，**禁止顺手重构 / 改名 / 「优化」任务外代码**；交付记录不得出现范围外改动。仅两类例外需显式登记：① 阻断本任务的硬错误；② 已登记的漂移修正——且须在交付记录中单列。范围外缺陷记入「待用户裁决」清单，不自动修。
- **helper 先查再用**：新增工具函数 / composable / 选择器 / 原语前，先查 `src/lib/`、`src/services/`、既有共享原语与 `CatalogPageConfig` 注册表；有则复用，**禁止跨目录重复封装**（跨文件复制 CSS 同罪，见 [ui-design.md](docs/agents/ui-design.md) §1）。
- **文档体量红线（AI 可读性）**：面向 AI 的单文件超约 5 万 token（≈120 KB 中文）即失去「整读」价值——持续增长的内容必须在生成器里拆成「小总索引 + 按需分片」，禁止堆到只能靠 grep 捞；口径与手法见 [conventions.md](docs/agents/conventions.md)。
- **代码与样式约定（速查）**：Vue SFC 用 `<script setup lang="ts">`；CSS 用 BEM 双前缀（内容 `nk-` / 外壳 `ui-`），不用预处理器，**不引入 ESLint / Prettier**；注释只写「代码与数据都推不出、且 `docs/` 里也不存在」的事实。完整规范见 [conventions.md](docs/agents/conventions.md) 与 [ui-design.md](docs/agents/ui-design.md) §1。

## 工作区与提交

- **临时产物只放 `temp/`**（已 gitignore、随时可整目录清空）：探针脚本 / 截图 / 原始日志一律落这里，禁止丢进根目录、`src/`、`public/`；可复用脚本放 `tools/`。**文档与代码不得把 `temp/` 路径当引用目标**（永久死指针，`doc-audit.mjs` 检查⑨强制）。
- **交付 / 提交前自检**：`git status` 确认临时产物不入库；新类型临时产物**优先加 `.gitignore` 规则**；commit 风格（Conventional Commits）见 [conventions.md](docs/agents/conventions.md)。细则见 [commands.md](docs/agents/commands.md)。

## 验证流程

> **分级收敛 + 成本正比**：先定可断言的验收标准与终止条件（如「icon 160px、无边框、无溢出」而非「布局正常」），按级别验证、达标即停；能静态审查确认的不启动浏览器。
> **职责边界**：AI 只交付代码 / 规格 / DOM 与计算样式取证；视觉表现交用户 RunPreview 确认，不输出「看起来正常 / 美观」类结论。
> 取证金字塔（L1-L4）与完整执行纪律见 [verification.md](docs/agents/verification.md)。

| 级别 | 任务类型 | 验证内容 | 预算 |
|---|---|---|---|
| T0 | 数据层 / 纯函数 / API | `pnpm test` + `pnpm build` 即止 | — |
| T1a | 纯 CSS 数值微调（尺寸/间距/颜色，无选择器结构变化） | 守卫 + 静态审查（字面量/计算确认）；**视觉交用户 RunPreview 确认，不启动 headless 取证** | ≤5 min |
| T1b | CSS 布局/结构变化（选择器、flex/grid、断点区间） | 守卫 + `pnpm test:e2e`（toHaveCSS / 溢出检测 / 像素基线，仅取有疑问的断点）；审美项交用户 RunPreview 确认 | ≤10 min |
| T2 | 模板结构 / v-if / v-for / 数据流 | 守卫 + `pnpm test:e2e`（toHaveText / toHaveCount / a11y 扫描）；较大改动按需 | ≤15 min |
| T3 | Spine / Canvas / 动画 / 异步编排 | 守卫 + 取证金字塔 L1-L4 按需；先探测 `visibilityState` 与 rAF（后台标签页挂起陷阱） | ≤30 min |

- **降级必须记录**：任何「超预算降级」「跳过某级验证」「豁免项」必须在交付记录 / 回复中写明（原级别、降级原因）；**禁止静默降级**——未记录视为漏测，并作为「任务交付流程」第 5 条的沉淀信号。
- **验证耗时控制**：`visual.spec` 全量禁止，只跑改动实际影响的用例（`pnpm test:e2e:affected` 或 `--grep <关键词>`）；同一会话内全量 e2e 最多一次；纯 CSS 改动用守卫 + 单探针计算样式断言 + `pnpm test:e2e:ci` 即可，不跑像素基线。

## 本文件维护（防回流）

新增指令前先判落位：**每个任务都需要** → 本节或上方各节；**只有某一域需要** → 对应子文件 + 在「任务 → 必读」登记；**单次历史/坑位** → `docs/memory/`。禁止用脚本自动生成或批量膨胀本文件；禁止写入会漂移的目录/文件清单、日期、版本号、「已修复」类断言。**本文件的事实一律写判据或指针，不复述子文件内容**——复述即制造第二事实源，漂移只是时间问题。
