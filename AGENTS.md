# AGENTS.md

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》数据展示型 Wiki（Vue 3 + TypeScript + Vite + Pinia / Vue Router）：数据由 Python 工具 `tools/converter` 从官方解包数据离线转换为本地 JSON 随站分发，图片与 Spine 动画在运行期走 CDN 双源回退。

> 术语与 `_Avoid_` 禁用词以 [CONTEXT.md](CONTEXT.md) 为准；架构决策见 [docs/adr/](docs/adr/)（索引 [docs/adr/README.md](docs/adr/README.md)）；字段审计裁决见 [docs/audit/](docs/audit/)；历史复盘与坑位见 [docs/memory/](docs/memory/)；数据源总结与字段探索见 [docs/data/](docs/data/)；Spine 机制与抓取流程见 [docs/spine/](docs/spine/)。以下按需读取，不必预读。

## 任务 → 必读

> 本表是子文件的唯一入口索引：**新增子文件必须在此登记**。子文件一律用相对链接引用——**禁止改回 `@path` 导入写法**（Qoder 等工具会把 `@` 导入递归展开为 include，等于把子文件全量塞进上下文，失去按需加载）。

| 你要做的事 | 必读 |
| --- | --- |
| 任何改动（硬约束 + 验证级别 + 文档落位） | 本文「强制规则」+「验证流程」+「文档分级（可逆性路由）」 |
| 目录页 / 路由 / 分层结构 / 研究线 / 新增目录端到端 | [docs/agents/architecture.md](docs/agents/architecture.md) |
| 数据转换 / 字段探索 / vendor 数据查询 | [docs/agents/data-pipeline.md](docs/agents/data-pipeline.md) |
| 数据源总结 / 字段与研究文档查询 | [docs/data/](docs/data/) + [tools/converter/DATA_CATALOG.md](tools/converter/DATA_CATALOG.md) |
| 转换器字段映射（表 → 输出 JSON） | [docs/data/转换器字段映射.md](docs/data/转换器字段映射.md) |
| Spine 机制 / 官网抓取 / 技能预览动画抓取 / 黑块成因 | [docs/spine/](docs/spine/) |
| AI 检索可见性 / 预渲染快照 / robots.txt / sitemap | [docs/agents/ai-discoverability.md](docs/agents/ai-discoverability.md) |
| 写改测试 / e2e 分层 / 像素基线 | [docs/agents/testing.md](docs/agents/testing.md) |
| 命令 / 端口 / dev 缓存陈旧 / 部署与门禁 | [docs/agents/commands.md](docs/agents/commands.md) |
| UI 样式 / 色彩令牌 / 主题与强调色 / 断点 / 反 AI 味 | [docs/agents/ui-design.md](docs/agents/ui-design.md) |
| 视觉职责边界 / 环境性排障 / 取证金字塔 / headless 与 PowerShell 陷阱 | [docs/agents/verification.md](docs/agents/verification.md) |
| 代码与注释规范 / ADR 门槛 / commit 风格 / 字段审计 | [docs/agents/conventions.md](docs/agents/conventions.md) |

## 常用命令

```bash
pnpm install            # 需 Node 22+；包管理器锁定 pnpm 11（packageManager 字段）
pnpm dev                # → http://localhost:6188/（固定端口 strictPort；禁止改回 5173；「改了不生效」先自愈，见 commands.md）
pnpm build              # 三守卫（色彩收口 / Spine 清单 / 对比度）→ vue-tsc -b → vite build → AI 端点生成 + AI 端点守卫
pnpm test               # 运行全部测试（Vitest）
pnpm vitest run <文件>   # 运行单个测试文件
pnpm test:e2e:ci        # e2e CI 层（layout + a11y）
node tools/gen-ai-endpoints.mjs   # 单独重建 AI 快照（读 dist/index.html 为模板，须先 vite build）
node tools/check-ai-endpoints.mjs # AI 端点守卫（快照正文/内链/sitemap/robots 覆盖率；pnpm build 末步自动跑）
node tools/check-doc-links.mjs   # 文档链接/重复校验（断链或误删引用即非零退出；仅手动，未进 CI）
```

全量命令手册（e2e 分层与像素基线、研究线 `/debug`、converter、部署与门禁、dev 缓存自愈）见 [docs/agents/commands.md](docs/agents/commands.md)。

## 架构（每次改动前必知）

- **配置驱动目录页**：所有列表页均为 `CatalogPageConfig`（`src/app/catalog/pages/` 子模块 + `pages.ts` 注册，目录清单以注册表为准）+ 单一 `CatalogView` 按 `route.meta.catalog` 渲染，无需新视图；带专属样式的目录在配置 `styles` 字段声明，自动随路由并行加载。
- **本地优先数据**：全部目录/详情数据为预转换 JSON（`public/data/cn/`，converter 输出）；仅图片与 Spine 动画运行期走 CDN（基址 `src/lib/constants.ts → CDN`）。
- **单强调色主题**：全站（含货币战争）共用一套可切换强调色（缺省赤陶），开关 `<html data-accent>`；货币战争的 `meta.cw` → `<html data-theme="cw">` 只是**模式标记**，不再重映射颜色（[ADR 0041](docs/adr/0041-主题色统一为单强调色通道.md)）。`meta.depth` 驱动方向性页面过渡（手机端 <768px 淡入淡出）。令牌分层、强调色通道与色彩门禁见 [docs/agents/ui-design.md](docs/agents/ui-design.md)。
- **样式随路由懒加载**：页面 CSS 随视图 import 拆为独立 chunk；全局仅 tokens.css + catalog.css。
- **枢纽页导航条回归 / 首页＝版本上新页（ADR 0019，已实现）**：`/` 与 `/currency` **全断点渲染导航条**（`meta.bareNav` / `data-nav` / 避让回退三件已删除，内容区回到 148px 侧栏避让）；`/` 是**版本上新页**＝品牌带 + `release_version` 恰等于 `version.json` 的 `version_label` 的角色/光锥/遗器三分区 + 页脚，板块索引与两条页内跨模式行已退场，跨模式只走侧栏「交换」。**禁止按 ADR 0018 旧形态回改**——「无侧栏枢纽」与「首页 8 行入口首屏可见」断言均已作废，新断言（1920×1080 内品牌带 + 版本上新标题与第一分区首行卡片完整可见 / 全断点渲染导航条 / 空态一行；ADR 0019 决策 11）在 `e2e/layout-home.spec.ts` 与 `e2e/layout-hub.spec.ts`。**禁止恢复全屏媒体层 / 立绘轮播 / 枢纽滚轮**（ADR 0018 该条继续有效）。
- **版本上新数据判据（ADR 0019 决策 3-5）**：条目判据 = `release_version` 恰等于 `version.json` 的 `version_label`；角色 / 光锥的版本号由「与上一版已提交输出的 id 差集」推导（converter 侧，无基线时留空），遗器用源数据权威 `RelicSetConfig.ReleaseVersion`；两者同写一个字段，前端只读该字段。
- **货币战争本赛季新增（ADR 0020，已实现）**：`/currency` 的判据是**赛季代际差集**——`GridFightRoleBasicInfoOld` / `GridFightTraitLayerOld` 的 `ExistSeason` 最大一代 = 上一代名册，当前代名册在 `GridFightRoleBasicInfo` 与 `traits.json`；converter 给 `role.json` / `traits.json` 写布尔 `is_season_new`（表缺失或代数 < 2 → 全 false + 告警，判据纯函数在 `tools/converter/season_delta.py`）。覆盖域仅**角色 + 羁绊**（装备 / 环境 / 策略既无 `*Old` 代际表、版本差集也实测为 0，**禁止**为它们新造判据）。**两页口径禁止混用**：常规模式 = 版本增量，货币战争 = 赛季代际；文案写「本赛季新增」且**不显示赛季号**（当前代编号 1 与旧代 101/102/103 体系不一致）。两页共用区块原语 `.nk-hub-release*`（单点声明在 `catalog.css`）。
- **数据边界**：`vendor/TurnBasedGameData` **禁止直接读取或写入**——数据探索一律走 `query.py` / `DATA_CATALOG.md`，转换走 `convert.py`。
- **AI 检索可见性＝构建期预渲染快照**：服务端 HTML 决定 AI 可见性（实测 AI 爬虫零 JS 执行），故 `pnpm build` 末步由 `tools/gen-ai-endpoints.mjs` 为每个可索引路由生成含正文与内链的 `dist/prerender/**.html`，`vercel.json` 在 catch-all 之前用明确 rewrite 投递（并排除 `robots.txt`/`sitemap.xml`）；JS 用户拿到同一份 HTML、Vue 挂载覆盖快照，内容对所有 UA 一致（非 cloaking）。**新增可索引路由必须同步快照覆盖 + rewrite + sitemap**，否则末步守卫 `tools/check-ai-endpoints.mjs` 失败。契约见 [docs/agents/ai-discoverability.md](docs/agents/ai-discoverability.md)。

> 分层结构 / 研究线（Spine Lab）/ 核心架构模式 / 新增目录扩展指南（端到端）→ [docs/agents/architecture.md](docs/agents/architecture.md)

## 代码约定（速查）

- Vue SFC 统一 `<script setup lang="ts">`；CSS 用 BEM + 双前缀（内容与设计系统 `nk-` / 应用外壳 `ui-`）；不使用预处理器；**不引入 ESLint / Prettier**。
- 样式分层（tokens.css 令牌与全局原语 / catalog.css 目录引擎 / 页面 css 随路由懒加载 / SFC scoped 组件）与命名、共享原语的完整纪律见 [docs/agents/ui-design.md](docs/agents/ui-design.md) §1——页面间复用先查原语，**禁止复制粘贴**。
- **注释只写「代码与数据都推不出、且 `docs/` 里也不存在」的事实**；可推理的一律不写，可能频繁改动的（样式数值尤其）一律不写。细则见 [docs/agents/conventions.md](docs/agents/conventions.md)。

## 任务交付流程

用户抛出任务后的执行契约。核心原则：**数据可自动沉淀 · 默认直接做，例外经确认**。

1. **默认直接做**：机械、可验、可回滚的改动（数据/文案/样式数值/加字段）直接执行，无清单无确认。
2. **例外确认**：意图有歧义、有设计自由、或命中跨模块公共基础（shared 组件 / 共享样式 / services 核心）的改动 → 简述方案与可断言结果，一次确认后执行。
3. **执行与验证**：按「验证流程」级别与预算执行，超预算即降级并记录（禁全量 e2e）；收尾汇报：改动 diff + 规格验证结果 + 降级/豁免说明；涉及视觉表现的改动附加「视觉待用户确认」清单。
4. **返工**：失败先修本层（低层失败不触发全量重跑）；同一问题两次修复尝试未果，停下向用户说明情况，不自动重试。
5. **沉淀**：收尾时命中（用户纠正流程 / 返工 ≥2 次 / 重要教训）→ 写入 `docs/memory/` 日志；流程规则改进须用户确认后生效。

## 文档分级（可逆性路由）+ 重构期模式

> 本节是「这次改动该不该写文档、写到哪」的**唯一路由原则**。可逆性判据与正反例在 [docs/agents/conventions.md](docs/agents/conventions.md)；重构期的验证纪律与命令细则在 [docs/agents/verification.md](docs/agents/verification.md) 与 [docs/agents/commands.md](docs/agents/commands.md)——子文件只放链接，不复述本节。

**同一事实只在一处声明**：本节只写原则与路由，细则一律进子文件（入口见上方「任务 → 必读」）；同一规则在两处出现即视为漂移，删至一处。

改动按**可逆性**三路落位：

| 改动性质 | 判据 | 落位 |
| --- | --- | --- |
| 可逆的展示迭代（数值 / 块序 / 形态 / 文案） | 被推翻后返工只限于展示层，且不改变任何下游契约 | `docs/memory/` 一段 + commit message 正文；**不开 ADR、不同步子文件** |
| 不可逆决策（数据判据 / 路由 / 字段归属 / 令牌层级） | 推翻即牵动数据口径、导航形态或跨模块契约 | ADR（门槛判据与正反例见子文件） |
| 契约变化（新目录页 / 新令牌类别 / 新 e2e 分层 / 新命令） | 新增了后续要依赖的登记项 | 对应子文件（按上方路由表登记） |

**memory 写法（防流水账）**：只留**判据与坑位**（为何这样判、踩过什么坑）；「降级记录」压成一行（原级别 + 原因）；**验证数字**（用例数 / 耗时 / 断言计数）进 commit message，**不进 memory**。

**重构期模式**：UI 重构迭代期内展示层反复变动，验收基准从「取值正确」降为「不变量与契约不破」——只跑不变量层与受影响用例，不为可逆改动开 ADR / 同步子文件 / 逐轮刷新像素基线；收敛后一次性重建基线，并补登记本轮真实发生的契约变化。

## 强制规则（MUST）

> **生成期约束唯一来源**：本节是强制约束的生成期视图（AI 写码时遵守）。若仓库存在 `.opencodereview/rule.json`（评审期视图，OCR 检查时加载），修改本节任一已映射条目（请求层 2 条 / 类型定义归属 / 目录页 2 条 / 文本数据来源 / 色彩令牌收口）必须同步该文件对应条目，反之亦然；「共享列表单例」与「构建守卫」为流程/CI 约束，不进 rule.json。

- **禁止裸 `fetch`**：所有数据请求必须走 `src/services/cache.ts` 导出的 `fetchJSON<T>(url)`。它提供 15s 超时、NkError 包装、AbortController 中断。绝不允许在 api.ts 或视图层直接调用 `fetch()`。**唯一登记豁免**：`src/services/cdn/health.ts` 的 CDN 健康 HEAD 探针（fire-and-forget、3s 超时，与 fetchJSON 的 15s/NkError 语义不兼容）；新增裸 `fetch` 必须在此登记豁免。
- **错误类型统一**：请求失败必须抛出 `NkError(message, true)`（operational），由 store 层决定是否展示重试 UI。禁止抛裸 `new Error()`。
- **共享列表单例**：`characters.json` / `light_cones.json` / `relics.json` 使用模块级单例 Promise（失败自动重置允许重试）。新增同类共享数据必须沿用此模式。
- **类型定义归属**：所有共享接口必须定义在 `src/services/types/`（按域拆分，index.ts barrel）。`src/services/api/` 仅允许 `import type` + 函数实现，禁止内联定义 export interface。
- **一目录一文件**：每个目录页配置必须放在 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册。禁止在 `pages.ts` 中直接编写目录逻辑。
- **卡片渲染**：目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能。所有用户可见文本必须经 `escHtml()` 转义。
- **文本数据来源**：所有展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **色彩令牌收口**：所有颜色必须落入 `tokens.css` 四层令牌体系（原始层色阶 → 主题色阶别名层 `--th-*`（全站唯一，随 `data-accent`）→ 语义层 `--primary` 等 → 领域层数据语义色）。派生色用 `color-mix(in srgb, var(--primary) X%, transparent)` 表达；**禁止在页面 CSS / 组件内联裸色值**，**禁止消费层直接引用原始层**，**领域色不得引用别名层**。新增颜色先查令牌，缺失按四步评审闸落层；`node tools/check-colors.mjs --strict` 与 `node tools/check-contrast.mjs --strict` 必须全绿。四层定义、豁免与流程见 [docs/agents/ui-design.md](docs/agents/ui-design.md) §2/§5。
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
