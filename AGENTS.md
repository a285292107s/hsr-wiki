# AGENTS.md

This file provides guidance to Lingma (lingma.aliyun.com) when working with code in this repository.

## 项目概述

HSR Wiki — 部署于 GitHub Pages 的《崩坏：星穹铁道》游戏数据 Wiki，Gaming HUD 视觉风格。数据源为本地 JSON（由 Python 工具从官方解包数据转换而来），图片与 Spine 动画走 `https://static.nanoka.cc` CDN。

## 常用命令

```bash
# 安装依赖（需 Node 22+、pnpm 9+）
pnpm install

# 本地开发 → http://localhost:5173/hsr_wiki/
pnpm dev

# 类型检查 + 生产构建 → dist/
pnpm build

# 运行全部测试
pnpm test

# 运行单个测试文件
pnpm vitest run src/services/__tests__/api.test.ts

# 监听模式
pnpm test:watch

# 数据转换工具（Python，需 vendor/TurnBasedGameData 子模块）
cd tools/converter
pip install -r requirements.txt
python convert.py                        # 全量转换（增量跳过未变更）
python convert.py --only characters      # 仅重跑指定模块
python convert.py --force --pretty       # 强制全量 + 缩进输出
python -m pytest tests/ -v               # converter 单元测试
```

部署：推送到 `main` 分支 → GitHub Actions 自动部署至 GitHub Pages。

## 架构

### 分层结构

```
src/
├── main.ts              → bootstrap() 唯一入口
├── app/                 → 应用层
│   ├── bootstrap.ts     → createApp + Pinia + Router + 全局 CSS 导入
│   ├── App.vue          → 外壳：SidebarNav + 方向过渡 RouterView + ToastHost
│   ├── router/index.ts  → Hash 路由；meta.depth 驱动导航方向动画；
│   │                        meta.endgameTab 共享 transition key（终局 4 路由 = 同页 Tab）；
│   │                        meta.cw 触发 data-theme="cw"（货币战争暗金主题）
│   ├── stores/          → Pinia 状态仓库（app、character、lightcone、relic）
│   ├── views/           → 路由级页面组件
│   ├── catalog/         → 配置驱动目录引擎（pages/ 子模块各目录配置；
│   │                        pages.ts 为纯注册表；CatalogPage.vue 通过配置渲染任意目录）
│   └── components/      → 复用组件（SidebarNav、ToastHost、nav-items）
├── services/            → API 层（纯函数，无全局状态）
│   ├── api.ts           → 全部数据加载器（统一走 cache.ts 的 fetchJSON；共享列表用单例 Promise）
│   ├── cache.ts         → 四级缓存 + 唯一底层请求函数 fetchJSON（15s 超时 + NkError）
│   └── types.ts         → 全部共享 TypeScript 接口（含货币战争类型）
├── lib/                 → 纯工具函数
│   ├── constants.ts     → CDN 基址、枚举映射（PATH/ELEM/TYPE/TAG/SKILL_ORDER/PROP_NAMES…）
│   ├── format.ts        → HTML 转义、标签剥离、图标 URL 构造器
│   └── errors.ts        → NkError 错误类
└── styles/              → 全局样式（tokens.css = 设计令牌；按模块拆分 CSS 文件）
```

### 核心架构模式

1. **配置驱动目录页**：所有列表页均在 `src/app/catalog/pages/` 子模块中定义（character.ts / lightcone.ts / relic.ts / item.ts / monster.ts / endgame.ts / currency-role.ts），由 `pages.ts` 统一注册为 `CatalogPageConfig`。单一 `CatalogView.vue` 根据 `route.meta.catalog` 匹配配置渲染任意目录。新增目录 = 新增子模块 + 注册 + 路由。

2. **数据流向**：`Pinia store` → 调用 `services/api.ts` 纯函数 → 从 `public/data/cn/`（随站部署）获取本地 JSON 或从 CDN 获取图片。Store 编排加载、缓存与错误处理；API 函数本身不持有状态（单例 Promise 除外）。

3. **本地优先数据**：全部目录/详情数据为预转换 JSON，存放于 `public/data/cn/`。仅图片与 Spine 动画在运行时从 CDN 加载。CDN 基址定义于 `src/lib/constants.ts → CDN`。

4. **双模式主题**：常规模式（紫色调）vs 货币战争模式（暗金色）。路由 `meta.cw` 切换 `<html data-theme="cw">`，附带 400ms 过渡动画类。CW 路由位于 `/currency/*` 下。

5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 路由的 `meta.depth` 计算 `navDir`（1=前进、-1=返回、0=平级）。App.vue 据此选择过渡动画名。手机端（<768px）统一使用简单淡入淡出。

### 数据转换管线（Python）

`tools/converter/` 将 `vendor/TurnBasedGameData/`（git 子模块：ExcelOutput + TextMap）转换为 `public/data/cn/` 下的 JSON。

- 入口：`convert.py` → 模块注册表驱动，支持 `--only` / `--force` / `--pretty` CLI 参数
- 增量转换：`incremental.py` 基于源文件 mtime+size 签名，未变更模块自动跳过（状态存于 `.converter-state.json`，已 gitignore）
- 文本解析：`textmap.py` 加载 `TextMapCHS.json`，同时处理 `{ "Hash": N }` 对象引用和字面量字符串键
- 数值扁平化：源数据将所有数值包装为 `{ "Value": N }`，转换器递归展开
- 配置：`config.py` 存放路径映射、枚举回退表、图标路径重映射表
- 输出格式：默认紧凑 JSON（无缩进），`--pretty` 切换为缩进模式（调试用）
- 转换摘要：每次运行结束输出各模块耗时统计
- 输出确定性：上游解包数据更新后重跑即可，前端无需改动

### 测试

**前端（Vitest）：**
- 框架：Vitest + happy-dom
- 位置：`src/**/__tests__/*.test.ts`
- 范围：仅数据层（纯函数、缓存逻辑、API 契约）——不测组件
- IndexedDB 在测试中通过 mock 提供

**Converter（pytest）：**
- 位置：`tools/converter/tests/`
- 范围：核心工具函数（unwrap_value / map_icon_path / resolve_text / sort_by_id）
- 运行：`cd tools/converter && python -m pytest tests/ -v`

## 项目约定

- Vue SFC 统一使用 `<script setup lang="ts">`
- 路由使用 `createWebHashHistory`（Hash 模式）——GitHub Pages 必需
- Vite `base` 为 `/hsr_wiki/`——所有资源路径自动带前缀
- `cdn-samples/` 仅作参考样本，严禁作为数据源导入或随站部署
- 目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能
- CSS 采用 BEM 风格命名，统一 `nk-` 前缀（如 `nk-cat-card__img`）
- 全局设计令牌位于 `src/styles/tokens.css`；不使用 CSS 预处理器

## 强制规则（MUST）

### 请求层

- **禁止裸 `fetch`**：所有 HTTP 请求必须走 `services/cache.ts` 导出的 `fetchJSON<T>(url)`。它提供 15s 超时、NkError 包装、AbortController 中断。绝不允许在 api.ts 或视图层直接调用 `fetch()`。
- **错误类型统一**：请求失败必须抛出 `NkError(message, true)`（operational），由 store 层决定是否展示重试 UI。禁止抛裸 `new Error()`。

### 数据层

- **共享列表单例**：`characters.json` / `light_cones.json` / `relics.json` 使用模块级单例 Promise（失败自动重置允许重试）。新增同类共享数据必须沿用此模式。
- **类型定义归属**：所有共享接口必须定义在 `services/types.ts`。`api.ts` 仅允许 `import type` + 函数实现，禁止内联定义 export interface。

### 目录页

- **一目录一文件**：每个目录页配置必须放在 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册。禁止在 `pages.ts` 中直接编写目录逻辑。
- **卡片渲染**：目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能。所有用户可见文本必须经 `escHtml()` 转义。

### 通用

- **文本数据来源**：所有展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **构建守卫**：每次变更必须通过 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。
