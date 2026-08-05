# AGENTS.md

This file provides guidance to Lingma (lingma.aliyun.com) when working with code in this repository.

## 项目概述

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》游戏数据 Wiki，Gaming HUD 视觉风格。数据源为本地 JSON（由 Python 工具从官方解包数据转换而来），图片与 Spine 动画走 `https://static.nanoka.cc` CDN。

## 常用命令

```bash
# 安装依赖（需 Node 22+、pnpm 9+）
pnpm install

# 本地开发 → http://localhost:5173/
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

# 子模块数据探索工具（无需全量加载 GB 级原始文件）
python query.py --list Avatar            # 搜索文件名
python query.py AvatarConfig --schema    # 查看文件 schema
python query.py AvatarConfig --id 1001   # 按 ID 查单条记录
python query.py AvatarConfig --where "DamageType=Ice" --fields AvatarID,AvatarName --limit 5
python query.py --resolve 6186714091647966180  # 解析 TextMap Hash（走 SQLite 缓存）
python query.py --search "黄泉"          # TextMap 全文搜索（走 SQLite 缓存）
python query.py --rebuild-textmap        # 强制重建 TextMap SQLite 索引
python gen_catalog.py                    # 重新生成 DATA_CATALOG.md 索引
```

部署：推送到 `main` 分支 → Vercel 自动构建部署（SPA 路由重写见 `vercel.json`）。

## 架构

### 分层结构

```
src/
├── main.ts              → bootstrap() 唯一入口
├── app/                 → 应用层
│   ├── bootstrap.ts     → createApp + Pinia + Router + 全局 CSS 导入（仅 tokens + catalog）
│   ├── App.vue          → 外壳：SidebarNav + 方向过渡 RouterView + ToastHost
│   ├── router/index.ts  → History 路由；meta.depth 驱动导航方向动画；
│   │                        meta.endgameTab 共享 transition key（终局 4 路由 = 同页 Tab）；
│   │                        meta.cw 触发 data-theme="cw"（货币战争暗金主题）；
│   │                        CW 目录路由经 cwCatalogView 并行加载目录专属 CSS
│   ├── router/chunks.ts → 路由 chunk 预加载函数（侧栏 hover / 首页 idle）
│   ├── stores/          → Pinia 状态仓库（app、character、lightcone、relic）
│   ├── views/           → 路由级页面组件（每个视图内 import 自己的专属样式）
│   ├── composables/     → 复用组合式函数（useDelayedSkeleton / useLoadGeneration /
│   │                        useParallax / useScrollRestore / useCardTilt）
│   ├── character/       → 角色详情页子组件（CharHero + OverviewPanel / SkillsPanel /
│   │                        EidolonsPanel / BuildsPanel + SkillCard + spine 编排层 + utils）
│   ├── catalog/         → 配置驱动目录引擎（pages/ 子模块各目录配置；
│   │                        pages.ts 为纯注册表；CatalogPage.vue 通过配置渲染任意目录；
│   │                        CatalogToolbar.vue 为搜索/筛选工具条）
│   └── components/      → 复用组件（SidebarNav、ToastHost、nav-items）
├── services/            → API 层（纯函数，无全局状态）
│   ├── api/             → 按域拆分的加载器（characters / relics / items / endgame /
│   │                        currency / spine / manifest；index.ts 为 barrel；
│   │                        singleton.ts 提供 singletonLoad 工厂；base.ts 提供数据基址）
│   ├── cache.ts         → 四级缓存 + 唯一底层请求函数 fetchJSON（15s 超时 + NkError）
│   └── types/           → 按域拆分的共享接口（character / relic / spine / currency /
│                           misc；index.ts 为 barrel）
├── lib/                 → 纯工具函数
│   ├── constants.ts     → CDN 基址、枚举映射（PATH/ELEM/TYPE/TAG/SKILL_ORDER/PROP_NAMES…）
│   ├── format.ts        → 数值格式化 + 加强模式视图构建 + 数据校验；并 re-export 下列子模块
│   ├── html.ts          → HTML 转义与富文本标签清洗（escHtml / gameTagsToHtml / stripTags）
│   ├── diff.ts          → 参数对比与 word-level LCS diff（fmtDescDiff / wordDiff）
│   ├── icons.ts         → 图标/图片 URL 构造器（skillIconUrl / itemName / avatarDrawCardUrl…）
│   └── errors.ts        → NkError 错误类
├── spine/               → 中立引擎层（零 Vue 依赖，有副作用：DOM/WebGL/rAF/全局注册表）
│   ├── types.ts         → 双运行时（4.1/4.2）松散契约唯一收口
│   ├── runtime.ts       → 运行时动态加载（访问器代理隔离 window.spine + 多 CDN 兜底）
│   ├── config.ts        → buildOfficialConfig 官网源 URL 构造（ADR 0009）
│   ├── player.ts        → SpinePlayer 单实例工厂 + 结算工厂 + 质量修复
│   ├── scene.ts         → 单画布多骨架场景渲染器（固定舞台 cover 适配 + 渲染管线插桩）
│   ├── registry.ts      → 按 key 精确释放注册表 + WebGL 上下文计数预警
│   └── constants.ts     → 运行时版本 + CDN 列表（引擎自包含）
└── styles/              → 全局仅 tokens.css（设计令牌）+ catalog.css（目录引擎）；
                           页面专属 CSS（character / lightcone / relic / currency-* /
                           skill-card）随各自路由 chunk 懒加载
```

### 核心架构模式

1. **配置驱动目录页**：所有列表页均在 `src/app/catalog/pages/` 子模块中定义（character.ts / lightcone.ts / relic.ts / item.ts / monster.ts / endgame.ts / currency-role.ts），由 `pages.ts` 统一注册为 `CatalogPageConfig`。单一 `CatalogView.vue` 根据 `route.meta.catalog` 匹配配置渲染任意目录。新增目录 = 新增子模块 + 注册 + 路由。

2. **数据流向**：`Pinia store` → 调用 `services/api/` 纯函数 → 从 `public/data/cn/`（随站部署）获取本地 JSON 或从 CDN 获取图片。Store 编排加载、缓存与错误处理；API 函数本身不持有状态（单例 Promise 除外）。

3. **本地优先数据**：全部目录/详情数据为预转换 JSON，存放于 `public/data/cn/`。仅图片与 Spine 动画在运行时从 CDN 加载。CDN 基址定义于 `src/lib/constants.ts → CDN`。

4. **双模式主题**：常规模式（紫色调）vs 货币战争模式（暗金色）。路由 `meta.cw` 切换 `<html data-theme="cw">`，附带 400ms 过渡动画类。CW 路由位于 `/currency/*` 下。

5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 路由的 `meta.depth` 计算 `navDir`（1=前进、-1=返回、0=平级）。App.vue 据此选择过渡动画名。手机端（<768px）统一使用简单淡入淡出。

6. **样式随路由懒加载**：页面专属 CSS 在对应视图组件内 `import`（CharacterView 引 character.css + skill-card.css；LightconeView 引 lightcone.css + skill-card.css；RelicView 引 relic.css；CW 视图引 currency-*.css），由 Vite 拆为独立 CSS chunk 随路由加载。CW 目录路由（共享 CatalogView）在 router 内通过 `Promise.all` 并行加载目录样式，保证样式先于渲染到达。全局仅 tokens.css + catalog.css。

### 数据转换管线（Python）

`tools/converter/` 将 `vendor/TurnBasedGameData/`（git 子模块：ExcelOutput + TextMap）转换为 `public/data/cn/` 下的 JSON。

- 入口：`convert.py` → 模块注册表驱动，支持 `--only` / `--force` / `--pretty` CLI 参数
- 增量转换：`incremental.py` 基于源文件 mtime+size 签名，未变更模块自动跳过（状态存于 `.converter-state.json`，已 gitignore）；依赖声明由 `tests/test_incremental.py` AST 校验锁住，防止声明与实际读取漂移
- 文本解析：`textmap.py` 加载 `TextMapCHS.json`，同时处理 `{ "Hash": N }` 对象引用和字面量字符串键
- TextMap 查询缓存：`textmap_db.py` 将 TextMap 预建为 SQLite 索引（`.textmap-cache.db`，已 gitignore），`query.py --resolve/--search` 走缓存（<1ms），基于 mtime_ns:size 签名自动失效重建
- 数值扁平化：源数据将所有数值包装为 `{ "Value": N }`，转换器递归展开
- 配置：`config.py` 存放路径映射、枚举回退表、图标路径重映射表
- 输出格式：默认紧凑 JSON（无缩进），`--pretty` 切换为缩进模式（调试用）
- 转换摘要：每次运行结束输出各模块耗时统计
- 输出确定性：上游解包数据更新后重跑即可，前端无需改动

### 子模块数据探索（AI 专用）

`vendor/TurnBasedGameData` 子模块含 2140+ 个 JSON 文件（~250 MB）+ TextMap（~830 MB），**禁止直接读取原始文件**。使用以下工具：

- **`DATA_CATALOG.md`**：自动生成的轻量索引，含每个文件的 schema、记录数、首条样例。查结构先读此文件。
- **`query.py`**：精确查询 CLI，支持 `--id` / `--where` / `--fields` / `--grep` / `--schema` / `--resolve` / `--search` / `--rebuild-textmap`。TextMap 查询（`--resolve` / `--search`）走本地 SQLite 缓存（`textmap_db.py`），首次自动建库，后续 <1ms 响应。
- **`gen_catalog.py`**：子模块更新后重跑 `python gen_catalog.py` 刷新索引。

### Converter 模块 → 源文件映射

| 模块 | 读取的 ExcelOutput 源文件 |
|------|---------------------------|
| characters | AvatarConfig, AvatarConfigLD |
| character_detail | AvatarConfig(LD), AvatarSkillConfig(LD), AvatarRankConfig(LD), AvatarSkillTreeConfig(LD), AvatarPromotionConfig(LD) |
| light_cones | EquipmentConfig, EquipmentSkillConfig |
| light_cone_detail | EquipmentConfig, EquipmentSkillConfig, EquipmentPromotionConfig, ItemConfigEquipment |
| relics | RelicSetConfig, RelicConfig, RelicSetSkillConfig, RelicDataInfo |
| relic_affixes | RelicMainAffixConfig, RelicSubAffixConfig |
| monsters | MonsterTemplateConfig |
| endgame | ChallengePeakConfig |
| items | ItemConfig |
| paths | AvatarBaseType |
| elements | DamageType |
| properties | （自建映射，无源文件） |
| currency | AvatarConfigLD（本地数据） |
| season | （本地数据） |

> 所有模块均依赖 `TextMapCHS.json` 解析 Hash 文本引用。

### 测试

**前端（Vitest）：**
- 框架：Vitest + happy-dom
- 位置：`src/**/__tests__/*.test.ts`
- 范围：仅数据层（纯函数、缓存逻辑、API 契约）——不测组件
- IndexedDB 在测试中通过 mock 提供

**Converter（pytest）：**
- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail 纯函数契约；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- CI：已接入 `.github/workflows/ci.yml`（push/PR）与 `data-sync.yml`（数据同步时）

## 项目约定

- Vue SFC 统一使用 `<script setup lang="ts">`
- 字段筛选遵循 `docs/audit/字段价值审计流程.md`：AI 生成解读卡（字段名→人话语义→证据→置信度→价值建议），人工裁决四档分级；AI 无权判 🔴 排除（闸门 1），StarRailRes 基线有而本地无的字段必须标 ⚪ 待定（闸门 2）
- 路由使用 `createWebHistory`（History 模式）——Vercel 支持 SPA fallback
- Vite `base` 为 `/`——Vercel 部署于域名根路径
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
- 类型定义归属：所有共享接口必须定义在 `services/types/`（按域拆分，index.ts barrel）。`services/api/` 仅允许 `import type` + 函数实现，禁止内联定义 export interface。

### 目录页

- **一目录一文件**：每个目录页配置必须放在 `src/app/catalog/pages/<id>.ts`，由 `pages.ts` 统一 re-export 注册。禁止在 `pages.ts` 中直接编写目录逻辑。
- **卡片渲染**：目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能。所有用户可见文本必须经 `escHtml()` 转义。

### 通用

- **文本数据来源**：所有展示文本必须来自现有数据源（converter 输出 JSON / TextMap），禁止在代码中写死或自建数据源。
- **构建守卫**：每次变更必须通过 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。
