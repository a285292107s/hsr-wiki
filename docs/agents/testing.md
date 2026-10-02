# 测试体系

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。本文件是**测试三件套与 e2e 分层归属的唯一事实源**。验证级别、预算与执行纪律见主文件「验证流程」节与 [verification.md](verification.md)；测试命令与像素基线刷新方式见 [commands.md](commands.md)。

## 前端单元（Vitest + happy-dom）

- 配置：`vitest.config.ts`（独立于 `vite.config.ts`），`include: src/**/__tests__/**/*.test.ts`
- 范围：纯逻辑——数据层（缓存、API 契约、CDN 解析与健康探测）、`lib/` 与 `spine/` 纯函数、组合式函数、路由注册表、调试台引擎；**不挂载组件**（项目无组件测试运行器，禁止为此引入依赖）
- 跨刷新持久化由 HTTP 缓存承担，无 IndexedDB 持久层

## 前端 e2e（Playwright / 布局验收层）

- 配置：`playwright.config.ts`；`webServer` 起 `pnpm dev` 并复用已有 6188 实例（非 CI），单 Chromium；`mobile-chromium`（Pixel 7）仅跑 layout（溢出 / 结构 / console 守卫），`testIgnore` 排除 visual 与 accessibility，`grepInvert: /@viewport-pinned/` 排除**自行 `setViewportSize` 固定视口**的用例（其视口已由用例钉死，两个 project 下重复执行同一断言；标签须静态写在 `test(...)` 第二参，动态 annotation 对收集期过滤无效；标签纪律见 `e2e/layout.spec.ts` 头部）
- 用例：`e2e/guards.spec.ts`（不变量，见下「三层归属」）/ `e2e/layout.spec.ts`（布局与语义契约验收）/ `accessibility.spec.ts`（axe-core WCAG 扫描）/ `visual.spec.ts`（像素基线）；公共工具在 `e2e/helpers.ts`
- **分层**：CI 层 = `pnpm test:e2e:ci`（layout + accessibility，零外部依赖、环境无关）；像素基线回本机（判定依赖环境——CI IP 对 jsDelivr burst 限流 + Linux/Windows 渲染差异，见 `ci.yml` 注释），**禁止把 `visual.spec` 加回 CI**
- 基线：截图提交 git（`e2e/snapshots/`），本机刷新用 `pnpm test:e2e:update`（详细约束见 [commands.md](commands.md)）
- 断言能力已固化「验证流程」各级别：`toHaveCSS` / `toHaveText` / `toHaveCount`（T1b/T2）、横向溢出检测 `findHorizontalOverflow`（L3）、`toHaveScreenshot`（L4）、axe-core（a11y）、`pageerror` 硬断言（`console` error 仅收集记录，环境性 CDN 失败不硬断言，见 `helpers.ts` 注释）
- a11y 既有缺陷登记在 `accessibility.spec.ts` 的 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败；登记带超期复查提示）——修复后须人工裁决并从清单移除。**登记前必须先实测**：只有 axe impact 为 `serious`/`critical` 的违规才进入断言路径，`moderate` 级登记进去等于永不生效的白名单（曾有一条此类死条目，已删）
- 枢纽页：`/` 与 `/currency` 为静态品牌带 + 板块索引（无 WebGL / 视频帧），像素基线直接稳定——旧的双枢纽 Hero 媒体层隐藏块已随 [ADR 0018](../adr/0018-枢纽页改为工具化入口页.md) 删除（那些元素已不存在，保留会让 `evaluate` 直接失败）。`/` 首屏入口行数由 `layout.spec.ts` 的可执行断言锁定

### e2e 断言三层归属（不变量 / 契约 / 规格；与上方 CI / 本机归属正交）

| 层 | 职责 | 更新时机 | 落点与机检 |
|---|---|---|---|
| **guards 不变量层** | 页面可达、无未捕获 JS 异常、无未知横向溢出 | **永不**因展示改动（数值 / 块序 / 形态 / 文案）而改；新增页面才补条目 | `e2e/guards.spec.ts` → `pnpm test:e2e:guards`（+ a11y，永远可跑） |
| **contracts 语义契约层** | 语义与跨会话契约：数据驱动的真值、跨模块共享的避让 / 断点 / 尺寸下限 | 契约本身变更时改（即 ADR 或子文件登记过的口径变化） | 与规格层当前同由 `e2e/layout.spec.ts` 承载（按 `describe` 分组），**不预设独立文件名**；将来拆分按本表职责迁移 |
| **specs 数值规格层** | 尺寸 / 间距 / 字号 / 圆角等展示取值 | 随展示迭代改 | 同上；裸 px 由字面量工具扫描（命令与退出码见 [commands.md](commands.md)） |

- **数值断言硬规则（specs 层，可机检）**：禁止裸 px 断言——数值断言必须**令牌派生**（`e2e/helpers.ts → readToken`）或**相对序**（如 `scale.card > scale.groupTitle > scale.label`）；内容真值（首领名 / 污染等级 / 目标分数 / 节点数等）优先从 `public/data/cn/` 的产物 JSON 派生，不在断言里写死页面文案。真正不可漂移的契约值（令牌单点声明值、`0px` 直角 / `1px` 发丝线的**语义即值**类）允许保留字面量，二选一收口：行内标 `// e2e-literal-ok: 理由`，或由基线计数兜底（`tools/e2e-literal-baseline.json`）。扫描器只统计**断言调用里的** px——注释 / 用例标题 / 视口声明不进计数，避免守卫对着注释报警再逼人改注释。
- **改动路由**：展示迭代只需跑 guards 层 + 受影响用例（`pnpm test:e2e:affected`）；**禁止**为过测修改 guards 层——它变红即不变量被破坏，是代码问题而非断言问题。`pnpm test:e2e:ci` 语义不变（layout + a11y），**CI 覆盖率不得下降**。

## Converter（pytest）

- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail / currency 纯函数契约、gen_catalog 索引生成、query / textmap_db 缓存查询；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- **不在 CI 常驻**：回归由 data-sync 的 Run converter 步骤兜底（转换失败即 job 失败）+ converter 变更时本机 pytest
