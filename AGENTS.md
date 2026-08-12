# AGENTS.md

This file provides guidance to Lingma (lingma.aliyun.com) when working with code in this repository.

## 项目概述

HSR Wiki — 部署于 Vercel 的《崩坏：星穹铁道》数据展示型 Wiki。数据源为本地 JSON（由 Python 工具从官方解包数据转换而来），图片与 Spine 动画走 `https://static.nanoka.cc` CDN。

## 常用命令

```bash
# 安装依赖（需 Node 22+；本地与 CI 均使用 packageManager 指定的 pnpm 11）
pnpm install

# 本地开发 → http://localhost:5173/（strictPort：端口被占用时明确报错，先探测 5173 复用已有实例，无实例才新起）
pnpm dev

# 类型检查 + 生产构建 → dist/
pnpm build

# 运行全部测试
pnpm test

# 运行单个测试文件
pnpm vitest run src/services/__tests__/api.test.ts

# 监听模式
pnpm test:watch

# e2e 布局验收 / a11y 扫描 / 像素基线（Playwright，自动起 dev server）
pnpm test:e2e
pnpm test:e2e:update   # 刷新像素基线（确认改动是预期后）
pnpm exec playwright test e2e/visual.spec.ts --grep 首页   # 仅首页像素基线（改动只影响首页时用，避免全量 ~90s）
pnpm exec playwright test e2e/layout.spec.ts e2e/visual.spec.ts --grep 首页   # 常规快速回归：布局 + 首页基线

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

> 门禁语义（2026-08-12 配置）：GitHub main 分支已配置 branch protection——`build-and-test` 与
> `e2e` 两个 CI job 为 required status checks（strict，enforce_admins=true），CI 红则 push 被拦截，
> 发布门禁为硬门禁；Vercel 构建（`pnpm build` 含 vue-tsc + 色彩/清单守卫）为第二道硬门禁。
> 注意：直接 push main 需 CI 全绿（本地推送前先跑 `pnpm build` + `pnpm test` 或走 PR）。

## 架构

### 分层结构

```
src/
├── main.ts              → bootstrap() 唯一入口
├── app/                 → 应用层
│   ├── bootstrap.ts     → createApp + Pinia + Router + 全局 CSS 导入（仅 tokens + catalog）
│   ├── App.vue          → 外壳：SidebarNav + 方向过渡 RouterView + ToastHost
│   ├── router/index.ts  → History 路由；meta.depth 驱动导航方向动画；
│   │                        终局合并单页 /endgame（四模式身份为筛选选项，endgame.css 随路由并行加载）；
│   │                        meta.cw 触发 data-theme="cw"（货币战争黑金主题）；
│   │                        CW 目录路由经 cwCatalogView / cwRoleCatalogView 并行加载目录专属 CSS
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
│   ├── errors.ts        → NkError 错误类
│   └── currency-role.ts → 货币战争角色详情数据转换（标签映射 / 跨星级合并 / #N 引用解析）
├── spine/               → 中立引擎层（零 Vue 依赖，有副作用：DOM/WebGL/rAF/全局注册表）
│   ├── types.ts         → 双运行时（4.1/4.2）松散契约唯一收口
│   ├── runtime.ts       → 运行时动态加载（访问器代理隔离 window.spine + 多 CDN 兜底）
│   ├── config.ts        → buildOfficialConfig 官网源 URL 构造（ADR 0009）
│   ├── player.ts        → SpinePlayer 单实例工厂 + 结算工厂 + 质量修复
│   ├── scene.ts         → 单画布多骨架场景渲染器（固定舞台 cover 适配 + 渲染管线插桩）
│   ├── registry.ts      → 按 key 精确释放注册表 + WebGL 上下文计数预警
│   └── constants.ts     → 运行时版本 + CDN 列表（引擎自包含）
├── debug/               → 诊断支撑层（仅 /debug/* 路由可达，动态 import 打包隔离；
│                           依赖方向仅限 services 数据层 + spine 引擎层，严禁被业务代码引用）
│   ├── spine-audit.ts   → 审核引擎（L0 静态 / L1 解析 / L2 渲染三级检查）
│   ├── kv-acceptance.ts → KV 场景验收判定引擎（黑块检测 + PASS/FAIL 报告）
│   ├── use-kv-acceptance.ts → 一键验收编排 composable（可独立单测）
│   ├── use-merged-pipeline.ts / use-single-layers.ts → 合并/单层渲染编排
│   ├── pixels.ts / report.ts → 像素分析 / 报告导出
│   └── SpineAuditDetail.vue → 审核详情（含预览生命周期）
└── styles/              → 全局仅 tokens.css（设计令牌）+ catalog.css（目录引擎）；
                           页面专属 CSS（character / lightcone / relic / currency-* /
                           skill-card）随各自路由 chunk 懒加载
```

### 核心架构模式

1. **配置驱动目录页**：所有列表页均在 `src/app/catalog/pages/` 子模块中定义（character.ts / lightcone.ts / relic.ts / item.ts / monster.ts / endgame.ts（四模式合并单页，模式为筛选选项）/ currency-role.ts / currency-equipment.ts / currency-portal.ts / currency-augment.ts / currency-trait.ts，shared.ts 提供共享常量），由 `pages.ts` 统一注册为 `CatalogPageConfig`（共 13 个目录）。单一 `CatalogView.vue` 根据 `route.meta.catalog` 匹配配置渲染任意目录。新增目录 = 新增子模块 + 注册 + 路由。

2. **数据流向**：`Pinia store` → 调用 `services/api/` 纯函数 → 从 `public/data/cn/`（随站部署）获取本地 JSON 或从 CDN 获取图片。Store 编排加载、缓存与错误处理；API 函数本身不持有状态（单例 Promise 除外）。

3. **本地优先数据**：全部目录/详情数据为预转换 JSON，存放于 `public/data/cn/`。仅图片与 Spine 动画在运行时从 CDN 加载。CDN 基址定义于 `src/lib/constants.ts → CDN`。

4. **双模式主题**：常规模式（黑与紫双色）vs 货币战争模式（黑与金双色，见 ADR 0011 双色约束）。路由 `meta.cw` 切换 `<html data-theme="cw">`，附带 450ms 过渡动画类。CW 路由位于 `/currency/*` 下。

5. **方向性页面过渡**：Router `beforeEach` 比较 from/to 路由的 `meta.depth` 计算 `navDir`（1=前进、-1=返回、0=平级）。App.vue 据此选择过渡动画名。手机端（<768px）统一使用简单淡入淡出。

6. **样式随路由懒加载**：页面专属 CSS 在对应视图组件内 `import`（CharacterView 引 character.css + skill-card.css；LightconeView 引 lightcone.css + skill-card.css；RelicView 引 relic.css；CW 视图引 currency-*.css），由 Vite 拆为独立 CSS chunk 随路由加载。CW 目录路由（共享 CatalogView）在 router 内通过 `Promise.all` 并行加载目录样式（角色图鉴目录经 `cwRoleCatalogView` 额外加载 currency-role.css），保证样式先于渲染到达。全局仅 tokens.css + catalog.css。

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
| endgame | ChallengeMazeConfig, ChallengeStoryMazeConfig, ChallengeBossMazeConfig, ChallengePeakConfig |
| items | ItemConfig |
| paths | AvatarBaseType |
| elements | DamageType |
| properties | （自建映射，无源文件） |
| currency | AvatarConfigLD（本地数据） |
| currency_catalog | GridFightItems, GridFightEquipment, GridFightEquipCategoryInfo, GridFightEquipTag, GridFightEquipRecommendRole, GridFightPortalBuff, GridFightAugment, GridFightTraitBasicInfo, GridFightTraitLayer, GridFightTraitMazebuff |
| season | （本地数据） |

> 所有模块均依赖 `TextMapCHS.json` 解析 Hash 文本引用。

### 测试

**前端（Vitest）：**
- 框架：Vitest + happy-dom
- 位置：`src/**/__tests__/*.test.ts`
- 范围：仅数据层（纯函数、缓存逻辑、API 契约）——不测组件
- IndexedDB 在测试中通过 mock 提供

**前端（Playwright e2e / 布局验收层）：**
- 框架：`@playwright/test` + `@axe-core/playwright`，单 Chromium（`playwright.config.ts`，webServer 自动起 dev server，复用已有 5173 实例）
- 位置：`e2e/`（layout.spec.ts 布局验收 / accessibility.spec.ts WCAG 扫描 / visual.spec.ts 像素基线）
- 运行：`pnpm test:e2e`；基线刷新 `pnpm test:e2e:update`（`-u`）；基线截图提交 git（`e2e/snapshots/`）；CI（ci.yml e2e job）在 push main 与 PR 时全量运行（发布门禁）；mobile-chromium project（Pixel 7）仅跑 layout（溢出/结构/console 守卫），不跑像素基线
- 把 AGENTS.md「验证流程」T1b/T2/L3/L4 从一次性 CDP 取证固化为可重复断言：`toHaveCSS`/`toHaveText`（T1b/T2）、溢出检测 helper（L3）、`toHaveScreenshot`（L4，本地 Percy）、axe-core（a11y 维度）、console/pageerror 守卫（CDN 404 / JS 异常）
- 已知 a11y 缺陷登记在 `e2e/accessibility.spec.ts` 的 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败）——修复需人工裁决后从清单移除
- 首页 Hero：≥1024px 渲染 KV Spine 场景（WebGL 动画，CSS animations 禁用无效），像素基线中隐藏 `.nk-home-hero__spine`（其渲染验收归 `debug/spine-audit` 引擎）；<1024px 为随机五星立绘轮播（不涉及 WebGL，像素基线不覆盖该路径）

**Converter（pytest）：**
- 位置：`tools/converter/tests/`
- 范围：工具函数（unwrap_value / map_icon_path / sort_by_id / resolve_text）、clean_text 标签清洗全分支、增量依赖 AST 一致性、character_detail / currency 纯函数契约、gen_catalog 索引生成、query / textmap_db TextMap 缓存查询；合成数据 + mock TextMap，不依赖真实源数据
- 运行：`cd tools/converter && python -m pytest tests/ -v`
- CI：已接入 `.github/workflows/ci.yml`（push/PR）与 `data-sync.yml`（数据同步时）

## 任务交付流程

用户抛出任务后的执行契约（2026-08-11 敲定）。核心原则：**数据可自动沉淀 · 契约（清单/基线/流程规则）须用户签发**。

1. **定级**：按「设计自由度 × 影响面」分 L1/L2/L3，任务开场一句话声明级别，用户可否决。
   - L1 微任务：明确映射、可回滚、机器可验（改文案/调数值/加字段）→ 直接做，无清单无确认
   - L2 常规任务：起草 3-5 条可验证清单 → 用户一次确认 → 执行 → 验证 → 交付
   - L3 大型任务：完整清单 + 里程碑拆解（清单超 8 条自动拆）+ 各里程碑 check-in + 分段目检
2. **清单**：AI 起草「可验证清单」，每条 = 客观检查项，标注判据类型（机器可验 / 人工目检）。机器可验项从下方「验证流程」的 T0-T3 级别中选取；目检项（视觉/动效/Spine/内容创作）列出供用户签发。
3. **确认**：有设计自由度才请求确认；「明确映射 + 机器可验 + 可回滚」直接做，不打断。
4. **执行**：进度类 check-in 异步简报；决策类（偏离 spec / 缺信息 / 更优方案）必须停下等确认，**不乐观执行**。spec 是用户签发的契约，AI 无权单方面修改。
5. **验证**：按 AI 声明的影响域选择「验证流程」级别（T0/T1a/T1b/T2/T3）；改动命中公共模块（shared 组件 / 共享样式 / services 核心）自动升级验证范围。遵循下方预算与降级纪律；**验证耗时与执行同量级，超预算即降级**；交付循环禁跑全量 e2e / 像素基线全量（全量仅发布前合入时执行，兜底漏测）。
6. **返工**：失败层级决定重跑深度（低层失败不触发全量重跑）；失败信息结构化回传（哪层/哪项/证据）；同任务返工满 3 轮停止自动循环，转人工决策。
7. **签发**：基线 / 目检项 / 验收标准的变更必须用户确认，AI 只出示证据（diff 表 / 截图对比）；未签发条目按「未完成」处理，不得自行移动验收标准。
8. **复盘**：异常信号（返工 ≥1 轮 / 验证超预算 / 用户纠正清单或定级 / 发布全量抓到漏测）触发；数据层自动写入 `docs/memory/` 日志；流程规则改进需用户确认后生效。

## 项目约定

- Vue SFC 统一使用 `<script setup lang="ts">`
- 字段筛选遵循 `docs/audit/字段价值审计流程.md`：AI 生成解读卡（字段名→人话语义→证据→置信度→价值建议），人工裁决四档分级；AI 无权判 🔴 排除（闸门 1），StarRailRes 基线有而本地无的字段必须标 ⚪ 待定（闸门 2）
- 路由使用 `createWebHistory`（History 模式）——Vercel 支持 SPA fallback
- Vite `base` 为 `/`——Vercel 部署于域名根路径
- 目录卡片 HTML 以模板字符串渲染（非 Vue 组件），服务于虚拟滚动性能
- CSS 采用 BEM 风格命名，统一 `nk-` 前缀（如 `nk-cat-card__img`）
- 样式分层：tokens.css = 设计令牌 + 跨页共享原语（nk-tabs / nk-panel 等）；catalog.css = 目录引擎专属（含 v-html 卡片，scoped 无法命中）；页面 css = 页面专属（随路由懒加载）。页面间复用样式先查原语，禁止在页面 css 复制粘贴；组件专属样式（如货币战争 Hub 的导航）用 SFC scoped style，不污染全局命名空间
- 全局设计令牌位于 `src/styles/tokens.css`；不使用 CSS 预处理器
- 先确认模型有没有识图功能，如果模型没有识图功能，不要截图，直接用 DOM 与计算样式取证
- 首页 Hero 断点策略：桌面（≥1024px）渲染官网 KV Spine 场景（home-bg 全量层）；平板（768-1023px）与手机（<768px）不渲染 Spine，改为随机五星立绘轮播（6s 交叉淡入淡出，`prefers-reduced-motion` 停播，后台标签页停播）。布局改动须保持该策略（策略与实现见 HomeView.vue 注释）

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
- **色彩三层令牌**：所有颜色必须落入 tokens.css 三层令牌体系——原始层（`--ph-*` / `--gold-*` 色阶事实）、语义层（`--primary` 等主题映射，派生色用 `color-mix(in srgb, var(--primary) X%, transparent)` 表达）、领域层（`--rarity-*` / `--prop-*` / `--elem-*` / `--skill-*` / `--diff-*` 数据语义色，不随主题）。禁止在页面 CSS/组件内联裸色值（豁免：中性灰阶/黑/白/深底色、`var()` fallback；CW 专属 `currency-*` 文件与 debug 分析色待迁移）。新增颜色先查令牌，缺失则落入对应层。可用 `node tools/check-colors.mjs --strict` 扫描未收口色值。
- **构建守卫**：每次变更必须通过 `pnpm build`（含 vue-tsc 类型检查）+ `pnpm test` 全绿后方可提交。

### 验证流程

> 分级收敛：改动前先定**可断言的验收标准 + 终止条件**（如「icon 160px、无边框、无溢出」而非「布局正常」），按级别验证，达标即停；
> **验证成本与风险敞口成正比**：能静态审查确认的（字面量数值、简单算术、断点区间、选择器覆盖范围）不启动浏览器；CSS 语法错误由 dev server 编译即时暴露。
> 模型无识图能力时一律走 DOM 与计算样式取证（见项目约定），禁止截图路径。

| 级别 | 任务类型 | 验证内容 | 预算 |
|---|---|---|---|
| T0 | 数据层 / 纯函数 / API | `pnpm test` + `pnpm build` 即止 | — |
| T1a | 纯 CSS 数值微调（尺寸/间距/颜色，无选择器结构变化） | 守卫 + RunPreview 肉眼确认；**不启动 headless 取证** | ≤5 min |
| T1b | CSS 布局/结构变化（选择器、flex/grid、断点区间） | 守卫 + `pnpm test:e2e`（toHaveCSS / 溢出检测 / 像素基线，仅取有疑问的断点）；审美项 RunPreview | ≤10 min |
| T2 | 模板结构 / v-if / v-for / 数据流 | 守卫 + `pnpm test:e2e`（toHaveText / toHaveCount / a11y 扫描）；L2/L3 按需 | ≤15 min |
| T3 | Spine / Canvas / 动画 / 异步编排 | 守卫 + 取证金字塔 L1-L4 按需；先探测 `visibilityState` 与 rAF（后台标签页挂起陷阱） | ≤30 min |

执行纪律（超预算即降级）：
- **降级必须记录**：任何「超预算降级」「跳过某级验证」「豁免项」必须在交付记录/回复中写明（原级别、降级原因）；禁止静默降级——降级即覆盖缩减，未记录视为漏测，且作为「任务交付流程」第 8 条的复盘信号
- **验证耗时控制**：`visual.spec` 全量禁止——只跑改动实际影响的用例（`--grep 首页` 等），与改动无关的 character/endgame/currency 用例直接跳过；同一会话内全量 e2e 最多执行一次；T1a/T1b 纯 CSS 改动用守卫 + 单探针计算样式断言 + `layout.spec`（约 20s）即可，不跑像素基线
- **环境问题先排除**：headless 内 CDN/网络加载失败先判定环境性（`curl` 验证 URL 可达），不当代码缺陷深究
- **探针脚本一次成型**：CDP 连接 + 设视口 + 单 evaluate（只含断言）+ 阶段日志，总超时 30s；禁止图片等待长循环、禁止 base64 大注入（可卡死渲染进程）；含正则/引号/`$` 的脚本一律 Write 文件执行（`.mjs`/`.ps1`），禁止内联（PowerShell 转义 + Bash 沙箱会预展开 `$var`）
- **探针输出与等待**：结果用 node 内 `writeFileSync(path, data, 'utf8')` 写文件，禁止 shell 重定向 `>`（中文 Windows PowerShell 会损坏 UTF-8，导致 JSON 乱码引发重跑）；条件等待用 `page.waitForFunction` / `expect.poll` 精确条件，禁止固定 sleep 与长轮询；不等待与断言目标无关的就绪状态（如只查 padding 就不等 spine 渲染）
- **PowerShell 编码**：本机 pwsh 7 的 `[Console]::OutputEncoding` 默认 gb2312（OEMCP/ACP 936），解码外部程序（node）的 UTF-8 stdout 会双重乱码（写侧已是 UTF-8，仅读侧不平）；必须管道/重定向外部输出时前缀 `[Console]::OutputEncoding = [Text.UTF8Encoding]::new()`；读文件显式 `-Encoding UTF8`
- **headless 首选 Chrome**（本机 Edge 的 CDP evaluate 通道不可用，dump-dom 正常）；必须 `--disable-extensions` + 独立 `--user-data-dir`，启动后验 `/json` 隔离（出现未知标签页立即 kill 重启）
- **失败快速降级**：CDP evaluate 无响应 15s 内 kill 重启一次，仍失败降级 `--dump-dom`（L1），禁止在卡死页面上重试
- **临时文件**：验证确认后单独 Remove-Item 清理
