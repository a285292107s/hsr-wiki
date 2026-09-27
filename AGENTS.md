# AGENTS.md

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》数据展示型 Wiki（Vue 3 + TypeScript + Vite + Pinia / Vue Router）：数据由 Python 工具 `tools/converter` 从官方解包数据离线转换为本地 JSON 随站分发，图片与 Spine 动画在运行期走 CDN 双源回退。

> 术语与 `_Avoid_` 禁用词以 [CONTEXT.md](CONTEXT.md) 为准；架构决策见 [docs/adr/](docs/adr/)（索引 [docs/adr/README.md](docs/adr/README.md)）；字段审计裁决见 [docs/audit/](docs/audit/)；历史复盘与坑位见 [docs/memory/](docs/memory/)；数据源总结与字段探索见 [docs/data/](docs/data/)；Spine 机制与抓取流程见 [docs/spine/](docs/spine/)。以下按需读取，不必预读。

## 任务 → 必读

> 本表是子文件的唯一入口索引：**新增子文件必须在此登记**。子文件一律用相对链接引用——**禁止改回 `@path` 导入写法**（Qoder 等工具会把 `@` 导入递归展开为 include，等于把子文件全量塞进上下文，失去按需加载）。

| 你要做的事 | 必读 |
| --- | --- |
| 任何改动（硬约束 + 验证级别） | 本文「强制规则」+「验证流程」 |
| 目录页 / 路由 / 分层结构 / 研究线 / 新增目录端到端 | [docs/agents/architecture.md](docs/agents/architecture.md) |
| 数据转换 / 字段探索 / vendor 数据查询 | [docs/agents/data-pipeline.md](docs/agents/data-pipeline.md) |
| 数据源总结 / 字段与研究文档查询 | [docs/data/](docs/data/) + [tools/converter/DATA_CATALOG.md](tools/converter/DATA_CATALOG.md) |
| Spine 机制 / 官网抓取 / 黑块成因 | [docs/spine/](docs/spine/) |
| 写改测试 / e2e 分层 / 像素基线 | [docs/agents/testing.md](docs/agents/testing.md) |
| 命令 / 端口 / dev 缓存陈旧 / 部署与门禁 | [docs/agents/commands.md](docs/agents/commands.md) |
| UI 样式 / 色彩令牌 / 主题与强调色 / 断点 / 反 AI 味 | [docs/agents/ui-design.md](docs/agents/ui-design.md) |
| 视觉职责边界 / 环境性排障 / 取证金字塔 / headless 与 PowerShell 陷阱 | [docs/agents/verification.md](docs/agents/verification.md) |
| 代码与注释规范 / ADR 门槛 / commit 风格 / 字段审计 | [docs/agents/conventions.md](docs/agents/conventions.md) |

## 常用命令

```bash
pnpm install            # 需 Node 22+；包管理器锁定 pnpm 11（packageManager 字段）
pnpm dev                # → http://localhost:6188/（固定端口 strictPort；禁止改回 5173；「改了不生效」先自愈，见 commands.md）
pnpm build              # 三守卫（色彩收口 / Spine 清单 / 对比度）→ vue-tsc -b → vite build
pnpm test               # 运行全部测试（Vitest）
pnpm vitest run <文件>   # 运行单个测试文件
pnpm test:e2e:ci        # e2e CI 层（layout + a11y）
node tools/check-doc-links.mjs   # 文档链接/重复校验（断链或误删引用即非零退出；仅手动，未进 CI）
```

全量命令手册（e2e 分层与像素基线、研究线 `/debug`、converter、部署与门禁、dev 缓存自愈）见 [docs/agents/commands.md](docs/agents/commands.md)。

## 架构（每次改动前必知）

- **配置驱动目录页**：所有列表页均为 `CatalogPageConfig`（`src/app/catalog/pages/` 子模块 + `pages.ts` 注册，目录清单以注册表为准）+ 单一 `CatalogView` 按 `route.meta.catalog` 渲染，无需新视图；带专属样式的目录在配置 `styles` 字段声明，自动随路由并行加载。
- **本地优先数据**：全部目录/详情数据为预转换 JSON（`public/data/cn/`，converter 输出）；仅图片与 Spine 动画运行期走 CDN（基址 `src/lib/constants.ts → CDN`）。
- **双模式主题**：常规（黑底 + 可切换强调色，缺省赤陶）vs 货币战争（`meta.cw` → `<html data-theme="cw">`，缺省香槟金）；`meta.depth` 驱动方向性页面过渡（手机端 <768px 淡入淡出）。令牌分层、强调色切换通道与色彩门禁见 [docs/agents/ui-design.md](docs/agents/ui-design.md)。
- **样式随路由懒加载**：页面 CSS 随视图 import 拆为独立 chunk；全局仅 tokens.css + catalog.css。
- **首页 Hero 断点策略**：桌面（≥1024px）渲染官网 KV Spine 场景；平板（768-1023px）与手机（<768px）不渲染 Spine，改为随机五星立绘轮播（6s 交叉淡入淡出，`prefers-reduced-motion` 与后台标签页停播）——布局改动必须保持该策略，策略与实现见 HomeView.vue 注释。
- **数据边界**：`vendor/TurnBasedGameData` **禁止直接读取或写入**——数据探索一律走 `query.py` / `DATA_CATALOG.md`，转换走 `convert.py`。

> 分层结构 / 研究线（Spine Lab）/ 核心架构模式 / 新增目录扩展指南（端到端）→ [docs/agents/architecture.md](docs/agents/architecture.md)

## 代码约定（速查）

- Vue SFC 统一 `<script setup lang="ts">`；CSS 用 BEM + 双前缀（内容与设计系统 `nk-` / 应用外壳 `ui-`）；不使用预处理器；**不引入 ESLint / Prettier**。
- 样式分层（tokens.css 令牌与全局原语 / catalog.css 目录引擎 / 页面 css 随路由懒加载 / SFC scoped 组件）与命名、共享原语的完整纪律见 [docs/agents/ui-design.md](docs/agents/ui-design.md) §1——页面间复用先查原语，**禁止复制粘贴**。
- 注释第一读者是后续接手的 AI：写成「禁止…」「必须…」可执行形态，只写可验证事实，禁复述实现、禁过期断言，坑位当场注释。细则见 [docs/agents/conventions.md](docs/agents/conventions.md)。

## 任务交付流程

用户抛出任务后的执行契约。核心原则：**数据可自动沉淀 · 默认直接做，例外经确认**。

1. **默认直接做**：机械、可验、可回滚的改动（数据/文案/样式数值/加字段）直接执行，无清单无确认。
2. **例外确认**：意图有歧义、有设计自由、或命中跨模块公共基础（shared 组件 / 共享样式 / services 核心）的改动 → 简述方案与可断言结果，一次确认后执行。
3. **执行与验证**：按「验证流程」级别与预算执行，超预算即降级并记录（禁全量 e2e）；收尾汇报：改动 diff + 规格验证结果 + 降级/豁免说明；涉及视觉表现的改动附加「视觉待用户确认」清单。
4. **返工**：失败先修本层（低层失败不触发全量重跑）；同一问题两次修复尝试未果，停下向用户说明情况，不自动重试。
5. **沉淀**：收尾时命中（用户纠正流程 / 返工 ≥2 次 / 重要教训）→ 写入 `docs/memory/` 日志；流程规则改进须用户确认后生效。

## 强制规则（MUST）

> **生成期约束唯一来源**：本节是强制约束的生成期视图（AI 写码时遵守）。若仓库存在 `.opencodereview/rule.json`（评审期视图，OCR 检查时加载），修改本节任一已映射条目（请求层 2 条 / 类型定义归属 / 目录页 2 条 / 文本数据来源 / 色彩令牌收口）必须同步该文件对应条目，反之亦然；「共享列表单例」与「构建守卫」为流程/CI 约束，不进 rule.json。

- **禁止裸 `fetch`**：所有数据请求必须走 `src/services/cache.ts` 导出的 `fetchJSON<T>(url)`。它提供 15s 超时、NkError 包装、AbortController 中断。绝不允许在 api.ts 或视图层直接调用 `fetch()`。**唯一登记豁免**：`src/services/cdn/health.ts` 的 CDN 健康 HEAD 探针（fire-and-forget、3s 超时，与 fetchJSON 的 15s/NkError 语义不兼容）；新增裸 `fetch` 必须在此登记豁免。
- **错误类型统一**：请求失败必须抛出 `NkError(message, true)`（operational），由 store 层决定是否展示重试 UI。禁止抛裸 `new Error()`。
- **共享列表单例**：`characters.json` / `light_cones.json` / `relics.json` 使用模块级单例 Promise（失败自动重置允许重试）。新增同类共享数据必须沿用此模式。
- **类型定义归属**：所有共享接口必须定义在 `src/services/types/`（按域拆分，index.ts barrel）。`src/services/api/` 仅允许 `import type` + 函数实现，禁止内联定义 export interface。
- **一目录一文件**：每个目录页配置必须放在 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册。禁止在 `pages.ts` 中直接编写目录逻辑。
- **卡片渲染**：目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能。所有用户可见文本必须经 `escHtml()` 转义。
- **文本数据来源**：所有展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **色彩令牌收口**：所有颜色必须落入 `tokens.css` 四层令牌体系（原始层色阶 → 主题色阶别名层 `--th-*` / `--cwth-*` → 语义层 `--primary` 等 → 领域层数据语义色）。派生色用 `color-mix(in srgb, var(--primary) X%, transparent)` 表达；**禁止在页面 CSS / 组件内联裸色值**，**禁止消费层直接引用原始层**，**领域色不得引用别名层**。新增颜色先查令牌，缺失按四步评审闸落层；`node tools/check-colors.mjs --strict` 与 `node tools/check-contrast.mjs --strict` 必须全绿。四层定义、豁免与流程见 [docs/agents/ui-design.md](docs/agents/ui-design.md) §2/§5。
- **构建守卫**：每次变更必须通过 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。

## 验证流程

> **分级收敛**：改动前先定**可断言的验收标准 + 终止条件**（如「icon 160px、无边框、无溢出」而非「布局正常」），按级别验证，达标即停。
> **成本正比**：能静态审查确认的（字面量数值、简单算术、断点区间、选择器覆盖范围）不启动浏览器；CSS 语法错误由 dev server 编译即时暴露。
> **职责边界**：AI 侧验证基线 = 代码与规格工作流（静态审查 + 可断言规格 + DOM 与计算样式取证）；视觉表现（审美/观感/像素细节）由用户亲自 RunPreview 确认，AI 不输出「看起来正常/美观」类结论。细则见 [docs/agents/verification.md](docs/agents/verification.md)。

| 级别 | 任务类型 | 验证内容 | 预算 |
|---|---|---|---|
| T0 | 数据层 / 纯函数 / API | `pnpm test` + `pnpm build` 即止 | — |
| T1a | 纯 CSS 数值微调（尺寸/间距/颜色，无选择器结构变化） | 守卫 + 静态审查（字面量/计算确认）；**视觉交用户 RunPreview 确认，不启动 headless 取证** | ≤5 min |
| T1b | CSS 布局/结构变化（选择器、flex/grid、断点区间） | 守卫 + `pnpm test:e2e`（toHaveCSS / 溢出检测 / 像素基线，仅取有疑问的断点）；审美项交用户 RunPreview 确认 | ≤10 min |
| T2 | 模板结构 / v-if / v-for / 数据流 | 守卫 + `pnpm test:e2e`（toHaveText / toHaveCount / a11y 扫描）；较大改动按需 | ≤15 min |
| T3 | Spine / Canvas / 动画 / 异步编排 | 守卫 + 取证金字塔 L1-L4 按需；先探测 `visibilityState` 与 rAF（后台标签页挂起陷阱） | ≤30 min |

核心纪律（完整纪律、取证金字塔定义与取证陷阱见 [docs/agents/verification.md](docs/agents/verification.md)）：

- **降级必须记录**：任何「超预算降级」「跳过某级验证」「豁免项」必须在交付记录/回复中写明（原级别、降级原因）；**禁止静默降级**——未记录视为漏测，并作为「任务交付流程」第 5 条的沉淀信号。
- **验证耗时控制**：`visual.spec` 全量禁止——只跑改动实际影响的用例（`--grep 首页` 等），无关用例直接跳过；同一会话内全量 e2e 最多执行一次；T1a/T1b 纯 CSS 改动用守卫 + 单探针计算样式断言 + `layout.spec`（约 20s）即可，不跑像素基线。
- **环境与排障纪律**（环境性问题先定性、dev 缓存陈旧先自愈、条件等待、PowerShell 编码、CDP 兜底取证）见 [docs/agents/verification.md](docs/agents/verification.md)。

## 本文件维护（防回流）

新增指令前先判落位：**每个任务都需要** → 本节或上方各节；**只有某一域需要** → 对应子文件 + 在「任务 → 必读」登记；**单次历史/坑位** → `docs/memory/`。禁止用脚本自动生成或批量膨胀本文件；禁止写入会漂移的目录/文件清单、日期、版本号、「已修复」类断言（过期信息会毒化上下文）。
