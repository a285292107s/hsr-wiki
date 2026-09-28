# 测试体系

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。本文件是**测试三件套与 e2e 分层归属的唯一事实源**。验证级别、预算与执行纪律见主文件「验证流程」节与 [verification.md](verification.md)；测试命令与像素基线刷新方式见 [commands.md](commands.md)。

## 前端单元（Vitest + happy-dom）

- 配置：`vitest.config.ts`（独立于 `vite.config.ts`），`include: src/**/__tests__/**/*.test.ts`
- 范围：纯逻辑——数据层（缓存、API 契约、CDN 解析与健康探测）、`lib/` 与 `spine/` 纯函数、组合式函数、路由注册表、调试台引擎；**不挂载组件**（项目无组件测试运行器，禁止为此引入依赖）
- 跨刷新持久化由 HTTP 缓存承担，无 IndexedDB 持久层

## 前端 e2e（Playwright / 布局验收层）

- 配置：`playwright.config.ts`；`webServer` 起 `pnpm dev` 并复用已有 6188 实例（非 CI），单 Chromium；`mobile-chromium`（Pixel 7）仅跑 layout（溢出 / 结构 / console 守卫），`testIgnore` 排除 visual 与 accessibility
- 用例：`e2e/layout.spec.ts`（布局验收）/ `accessibility.spec.ts`（axe-core WCAG 扫描）/ `visual.spec.ts`（像素基线）；公共工具在 `e2e/helpers.ts`
- **分层**：CI 层 = `pnpm test:e2e:ci`（layout + accessibility，零外部依赖、环境无关）；像素基线回本机（判定依赖环境——CI IP 对 jsDelivr burst 限流 + Linux/Windows 渲染差异，见 `ci.yml` 注释），**禁止把 `visual.spec` 加回 CI**
- 基线：截图提交 git（`e2e/snapshots/`），本机刷新用 `pnpm test:e2e:update`（详细约束见 [commands.md](commands.md)）
- 断言能力已固化「验证流程」各级别：`toHaveCSS` / `toHaveText` / `toHaveCount`（T1b/T2）、横向溢出检测 `findHorizontalOverflow`（L3）、`toHaveScreenshot`（L4）、axe-core（a11y）、console / pageerror 守卫（CDN 404 与 JS 异常）
- a11y 既有缺陷登记在 `accessibility.spec.ts` 的 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败；登记带超期复查提示）——修复后须人工裁决并从清单移除。**登记前必须先实测**：只有 axe impact 为 `serious`/`critical` 的违规才进入断言路径，`moderate` 级登记进去等于永不生效的白名单（曾有一条此类死条目，已删）
- 首页 Hero：≥1024px 渲染 KV Spine 场景（WebGL rAF 动画，`animations: 'disabled'` 对其无效），像素基线中隐藏 `.nk-home-hero__spine`（其渲染验收归研究线）；<1024px 为随机五星立绘轮播，基线不覆盖

## Converter（pytest）

- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail / currency 纯函数契约、gen_catalog 索引生成、query / textmap_db 缓存查询；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- **不在 CI 常驻**：回归由 data-sync 的 Run converter 步骤兜底（转换失败即 job 失败）+ converter 变更时本机 pytest
