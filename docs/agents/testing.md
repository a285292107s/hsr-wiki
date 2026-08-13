# 测试体系

> AGENTS.md 的按主题子文件（主文件经 `@docs/agents/testing.md` 引用）。存放测试三件套的细节资料。验证级别与预算纪律见主文件「验证流程」节。

## 前端（Vitest）

- 框架：Vitest + happy-dom
- 位置：`src/**/__tests__/*.test.ts`
- 范围：仅数据层（纯函数、三级缓存逻辑、API 契约）——不测组件
- 跨刷新持久化由 HTTP 缓存承担

## 前端（Playwright e2e / 布局验收层）

- 框架：`@playwright/test` + `@axe-core/playwright`，单 Chromium（`playwright.config.ts`，webServer 自动起 dev server，复用已有 5173 实例）
- 位置：`e2e/`（layout.spec.ts 布局验收 / accessibility.spec.ts WCAG 扫描 / visual.spec.ts 像素基线）
- 运行：`pnpm test:e2e`；基线刷新 `pnpm test:e2e:update`（必须显式 `=all` 全覆盖模式——Playwright 默认 `--update-snapshots` 为 changed，更新已有基线时静默 pass 不落盘）；基线截图提交 git（`e2e/snapshots/`）；CI（ci.yml e2e job）在 push main 与 PR 时自动运行（软门禁：失败仅通知不拦 push）；mobile-chromium project（Pixel 7）仅跑 layout（溢出/结构/console 守卫），不跑像素基线
- e2e 层已固化「验证流程」各级别的可重复断言：`toHaveCSS`/`toHaveText`（T1b/T2）、溢出检测 helper（L3）、`toHaveScreenshot`（L4，像素基线）、axe-core（a11y）、console/pageerror 守卫（CDN 404 / JS 异常）
- 已知 a11y 缺陷登记在 `e2e/accessibility.spec.ts` 的 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败）——修复需人工裁决后从清单移除
- 首页 Hero：≥1024px 渲染 KV Spine 场景（WebGL 动画，CSS animations 禁用无效），像素基线中隐藏 `.nk-home-hero__spine`（其渲染验收归 `spine-lab` 研究线）；<1024px 为随机五星立绘轮播（不涉及 WebGL，像素基线不覆盖该路径）

## Converter（pytest）

- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail / currency 纯函数契约、gen_catalog 索引生成、query / textmap_db TextMap 缓存查询；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- CI：已接入 `.github/workflows/ci.yml`（push/PR）与 `data-sync.yml`（数据同步时）