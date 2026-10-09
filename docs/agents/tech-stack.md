# 技术栈与依赖边界（唯一事实源）

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。
> **版本号禁入叙述性文档**：README / AGENTS.md / commands 等只写选型名（`Vue` / `Vite` / `Python`），**一律不写版本号**；需要版本时指向本文件。本文件是**全仓唯一允许内联版本号处**，且必须与机器可读权威源逐字一致（`tools/doc-audit.mjs` 强制校验，不一致即报错）。
> 权威源分级：**Node → `.github/workflows/ci.yml`**（`package.json` 无 `engines` 字段）｜**pnpm → `package.json` 的 `packageManager`**｜**前端依赖 → `package.json`**｜**Python 依赖 → `tools/converter/requirements.txt`**｜**Python 版本 → `.github/workflows/data-sync.yml`**｜**Spine 运行时 → `src/spine/constants.ts`**。
> 运行 / 构建 / 测试命令见 [commands.md](commands.md)；代码与注释规范见 [conventions.md](conventions.md)；工具边界（`vendor` / `query.py`）见 [data-pipeline.md](data-pipeline.md)。

## 一、运行时与构建

| 层 | 选型 | 版本 | 备注 |
| --- | --- | --- | --- |
| 框架 | Vue（`<script setup lang="ts">` SFC） | <!--ver:vue-->3.5.34 | 不用选项式 API |
| 语言 | TypeScript | <!--ver:typescript-->6.0.3 | 类型检查走 `vue-tsc -b`（`pnpm build` 内建） |
| 构建 | Vite（rolldown-vite） | <!--ver:vite-->8.0.11 | Windows dev 缓存坑位见 [commands.md](commands.md)「dev 缓存自愈」 |
| 状态 | Pinia | <!--ver:pinia-->4.0.2 | store 负责加载编排 / 缓存 / 错误处理 |
| 路由 | Vue Router（`createWebHistory`） | <!--ver:vue-router-->4.6.4 | History 模式，Vercel SPA fallback |
| 宿主 | Node | <!--ver:node-->22 | 权威源是 CI `node-version`；`package.json` **无** `engines` 字段，故此处由 CI 守护 |
| 包管理 | pnpm | <!--ver:pnpm-->11.17.0 | 权威源 `packageManager`；**禁 npm / yarn**，`pnpm-lock.yaml` 为准 |
| 部署 | Vercel | — | `vercel.json` rewrite 规则；推送 main 自动构建 |

> 版本单元格统一写成 `<!--ver:<包名>-->x.y.z` 标记，值由 `tools/doc-audit.mjs` 与权威源比对；**升级依赖只改权威文件 + 跑一次 doc-audit 让它报出待更新的行**，禁止凭记忆改这里。

## 二、测试

| 层 | 选型 | 版本 | 说明 |
| --- | --- | --- | --- |
| 单元 | Vitest + happy-dom | <!--ver:vitest-->4.1.10 / <!--ver:happy-dom-->20.11.1 | `pnpm test`；DOM 环境不做真实布局 |
| 组件 / e2e | Playwright + `@axe-core/playwright` | <!--ver:@playwright/test-->1.62.1 / <!--ver:@axe-core/playwright-->4.12.1 | 分层与命令见 [testing.md](testing.md)；像素基线纪律见 [commands.md](commands.md) |
| 类型检查 | vue-tsc | <!--ver:vue-tsc-->3.2.8 | `pnpm build` 内建 |
| converter | pytest（合成数据，不依赖真实源数据） | <!--ver:python-->3.12 | `cd tools/converter && python -m pytest tests/` |

## 三、数据转换工具（Python）

- **Python**：<!--ver:python-->3.12（CI 固定；本地最低 3.10——`requirements.txt` 无下限声明，故以 CI 为准）
- 运行时依赖 `xxhash` <!--ver:xxhash-->3.0.0,<4.0.0；测试依赖 `pytest` <!--ver:pytest-->8.0.0,<10.0.0（权威源 `tools/converter/requirements.txt`）
- Spine 运行时：spine-ts **双运行时** <!--ver:spine-ts-->4.2.43 / 4.1.23（4.0 骨架走 4.1，见 [ADR 0002](../adr/0002-spine-self-render-only.md) / [ADR 0009](../adr/0009-官网spine动画增量接入.md)）；权威源 `src/spine/constants.ts`
- 上游数据：`vendor/TurnBasedGameData` 本地副本（**非 git 子模块**，gitignore，每日 CI 浅克隆）

## 四、依赖现状

维护纪律：**运行时依赖只有三个**（`vue` / `pinia` / `vue-router`）——前端零数据 / UI / 工具类三方库。devDependencies 限于构建（`vite` / `@vitejs/plugin-vue` / `vue-tsc` / `typescript`）、测试（`vitest` / `@vitest/coverage-v8` / `happy-dom` / `@playwright/test` / `@axe-core/playwright`）。全量清单与版本以 `package.json` 为唯一权威，本文件只登记上表被引用到的那些（避免抄成第二份清单）。

## 五、禁用清单（负向约束索引）

> 每条只给一句判据 + 规则出处链接；**规则正文在出处，本表不复述**。新增禁用项先改出处文件，再回本表登记一行。

| 禁用 | 出处 |
| --- | --- |
| 引入 ESLint / Prettier / 任何 lint 工具链 | [AGENTS.md 代码约定](../../AGENTS.md) |
| CSS 预处理器（Sass / Less / Stylus） | 同上 |
| 裸 `fetch()`（唯一豁免见强制规则） | [AGENTS.md 强制规则](../../AGENTS.md) |
| 抛裸 `new Error()` / 内联定义共享 interface | 同上 |
| 页面 CSS / 组件内联裸色值、消费层直引原始层色阶 | [ui-design.md](ui-design.md) §2/§5 |
| 未经准入的新依赖（见 AGENTS.md「依赖准入」规则） | [AGENTS.md 强制规则](../../AGENTS.md) |
| 直读 / 直写 `vendor/TurnBasedGameData`、代码写死展示数据 | [AGENTS.md 数据边界](../../AGENTS.md) |
| 文档引用改回 `@path` 导入写法 | [AGENTS.md「任务 → 必读」](../../AGENTS.md) |
| 研究线（`/debug`）引用 `src/app/` 业务模块 | [architecture.md](architecture.md) |
| 恢复全屏媒体层 / 立绘轮播 / 枢纽滚轮、按 ADR 0018 旧形态回改 | [AGENTS.md 架构节](../../AGENTS.md) / [ADR 0019](../adr/0019-枢纽页导航条回归与首页改为版本上新页.md) |
| 在叙述性文档（README / AGENTS.md / 子文件）写版本号 | 本文件头部「版本号禁入叙述性文档」 |
