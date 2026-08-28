# HSR Wiki · 崩坏：星穹铁道

独立部署于 **Vercel** 的《崩坏：星穹铁道》数据展示型 Wiki：角色骨骼动画、虚拟滚动卡片、双模式暗色数据面板。全部数据由官方解包数据经本地转换管线产出，随站部署，无运行时外部列表拉取。

- **在线 Demo**：`https://hsr-wiki.vercel.app/`
- **截图**：<!-- TODO: 在此插入首页 / 角色详情 / 货币战争 Hub 截图 -->

## ✨ 功能特性

- **角色详情**：技能表（等级数值 / 附加能力）、行迹树、星魂、晋阶属性、推荐装备，支持「砺烁新辉」强化形态切换（默认强化，与游戏内一致）
- **Spine 角色动画**：详情页 Hero 区渲染骨骼动画，双源 manifest 分发（nanoka `.skel` / 官网 `.json`），官方优先、多 CDN 兜底；spine-player 运行时随站本地分发（`public/vendor/spine/`），CDN 仅兜底
- **终局内容四模式**：忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁，赛季详情页 + 模式筛选目录
- **双模式主题**：常规模式（黑紫）× 货币战争模式（黑金，`/currency/*` 独立路由树），全局色彩走三层令牌体系
- **虚拟滚动目录**：目录卡片以模板字符串渲染，长列表虚拟滚动保持流畅
- **响应式**：桌面 / 平板 / 手机三断点；手机端固定底部导航，首页 Hero 断点切换 KV Spine 场景与立绘轮播

## 🛠 技术亮点

- **配置驱动目录引擎**：12 个目录页全部由 `CatalogPageConfig` 配置渲染，新增目录 = 新增 `pages/<id>.ts` 子模块 + 注册 + 路由
- **三级缓存**：L1 内存 Map（80 条上限）→ L2 in-flight 去重 → L3 网络（15s 超时 + 可中断），唯一底层请求函数 `fetchJSON<T>()`（跨刷新持久化由 HTTP 缓存承担，2026-08 已移除 IndexedDB 层）
- **资源三级解析**：公共小图标随站本地（local-first）→ 官方 StarRailTextures 镜像（jsDelivr）→ nanoka 回退；URL 构造统一经 `services/cdn/` 纯函数解析
- **构建守卫**：`pnpm build` 前置 `check-guards.mjs` 统一入口——色彩收口（`check-colors.mjs --strict`）、Spine 清单一致性、对比度校验，之后才进行 vue-tsc 类型检查与产物构建
- **a11y 持续扫描**：Playwright + axe-core 全路由扫描，已知违规登记于 `KNOWN_VIOLATIONS`（命中降级 warning，新增违规仍失败）
- **研究线（Spine Lab）**：Spine 审核 / KV 验收独立为 `spine-lab/` 子应用（端口 5174），与主项目双向隔离，共享 `src/spine/` 引擎层

## 🗺 页面地图

- **常规模式**（7 板块）：角色 / 光锥 / 遗器 / 物品 / 成就 / 敌对物种 / 终局内容，枢纽页 `/`
- **货币战争模式**（5 板块）：角色图鉴 / 装备图鉴 / 投资环境 / 投资策略 / 羁绊图鉴，枢纽页 `/currency`
- **研究线（Spine Lab）**：`spine-lab/` 独立子应用（`pnpm dev:lab` → 5174），Spine 清单审核 / KV 场景验收台，不随主站部署（详见下文「研究线」）

## 技术栈

| 分类 | 选型 |
|---|---|
| 框架 | Vue 3（`<script setup>` SFC） |
| 构建 | Vite |
| 语言 | TypeScript |
| 状态 | Pinia |
| 路由 | Vue Router（`createWebHistory`） |
| 测试 | Vitest + happy-dom（前端）/ Playwright（e2e）/ pytest（转换工具） |
| 数据转换 | Python（`tools/converter/`，见下文） |
| 包管理 | pnpm（`packageManager` 锁定，Node 22+） |

## 快速开始

环境要求：Node 22+（包管理器使用 `packageManager` 指定的 pnpm 11）。

```bash
# 安装依赖
pnpm install

# 本地开发（http://localhost:5173/；strictPort 固定端口，被占用时报错而非静默换端口）
pnpm dev

# 类型检查 + 生产构建（含色彩 / Spine 清单 / 对比度三守卫）
pnpm build

# 预览构建产物
pnpm preview

# 前端单元测试（Vitest）
pnpm test

# 监听模式 / 运行单个测试文件
pnpm test:watch
pnpm vitest run src/services/__tests__/api.test.ts

# e2e 验收（Playwright 布局 / a11y / 像素基线，自动起 dev server）
pnpm test:e2e

# 刷新像素基线（确认改动是预期后）
pnpm test:e2e:update

# 常规快速回归（只跑改动实际影响的用例，如首页；visual 全量约 90s 禁止）
pnpm exec playwright test e2e/layout.spec.ts e2e/visual.spec.ts --grep 首页

# 研究线（Spine Lab，独立端口 5174）
pnpm dev:lab
pnpm build:lab
pnpm test:lab
```

## 目录结构

```
hsr wiki/
├── public/data/cn/          # 转换工具产出的本地数据 JSON（随站部署）
├── src/
│   ├── app/                 # 应用层：views / catalog 配置驱动目录引擎 / character 详情子组件
│   ├── lib/                 # 纯函数工具（constants / format / icons / html / diff / errors）
│   ├── services/            # 数据层：api 按域拆分的加载器、cache 三级缓存、cdn 双源解析、types
│   ├── spine/               # 中立 Spine 引擎层（零 Vue 依赖，DOM/WebGL/rAF）
│   └── styles/              # tokens.css 设计令牌 + catalog.css + 页面 CSS（随路由懒加载）
├── spine-lab/               # 研究线（Spine Lab）：独立 Vite 子应用（审核/验收台）+ 研究文档与脚本
├── tools/converter/         # Python 转换工具：官方解包数据 → 本地数据 JSON
├── vendor/TurnBasedGameData/ # git 子模块：官方解包数据（ExcelOutput + TextMap）
├── e2e/                     # Playwright 布局验收 / a11y 扫描 / 像素基线
├── docs/                    # ADR / 字段审计 / 数据总结（详见「文档」）
├── AGENTS.md                # 工程规则与架构指南（AI 协作约定）
└── CONTEXT.md               # 项目术语表
```

> 分层结构与数据流向的详细说明见 [AGENTS.md](AGENTS.md)。

## 数据架构

**本地优先**：全部目录与详情数据均为预转换 JSON，存放于 `public/data/cn/`（随站部署），无运行时 CDN 列表拉取。加载器集中在 `src/services/api/`（按域拆分，共享列表走单例 Promise）。

- **角色 / 光锥 / 遗器 / 物品 / 敌对**：列表数据由 `tools/converter/` 从 `vendor/TurnBasedGameData` 产出（`characters.json`、`light_cones.json`、`relics.json`、`items.json`、`monsters.json`）；详情页数据为 `characters/<id>.json`、`light_cones/<id>.json`、`monsters/<id>.json`。
- **终局内容**：忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁，由转换器的 endgame 模块从挑战配置表产出（`maze*.json`），四模式合并为单目录页，模式以筛选选项切换。
- **货币战争模式**：`currency/` 下角色 / 装备 / 传送门 / 强化 / 词条数据（含跨星级合并、`#N` 引用解析），路由位于 `/currency/*` 并切换黑金主题。
- **图片资源**：公共小图标（element / pathicon / trace / 遗器通用部位）与 spine-player 运行时、货币战争 Hero 视频随站本地分发（`public/data/cn/assets/`、`public/vendor/spine/`）；其余非 Spine 图标优先走 **jsDelivr 官方 StarRailTextures 镜像**（`src/lib/constants.ts` 的 `OFFICIAL_ICON_BASE`），nanoka 保留回退；Spine `.skel`/`.atlas` 与未收录分类走 `https://static.nanoka.cc`。全部图片 URL 构造统一经 `src/services/cdn/` 纯函数解析（本地优先 + 双源回退 + 请求失败 CSS 占位降级）。

> 全部本地数据由 `tools/converter/convert.py` 从 `vendor/TurnBasedGameData` 真实产出，严禁以任何外部样本作为数据源读取或随站部署。上游解包更新后重跑 `convert.py` 即可，前端无需改动。

## 数据转换工具

`tools/converter/` 是一套 Python 脚本，将官方解包数据（`vendor/TurnBasedGameData/`，git 子模块）转换为 StarRailRes 兼容的索引 JSON，输出到 `public/data/cn/`。

```bash
cd tools/converter
pip install -r requirements.txt     # 需 python-xxhash 等
python convert.py                   # 全量转换（增量跳过未变更模块）
python convert.py --only characters # 仅重跑指定模块
python convert.py --force --pretty  # 强制全量 + 缩进输出
python -m pytest tests/ -v          # 转换工具单元测试
```

关键机制：**增量转换**（源文件 mtime+size 签名，依赖声明由测试 AST 校验锁住）、**TextMap 解析**（Hash 对象 / 字面量双形式，SQLite 缓存毫秒级查询）、**数值扁平化**（`{ "Value": N }` 递归展开）、**子模块数据探索**（`query.py` + `DATA_CATALOG.md` 轻量索引，禁止直接读取 GB 级原始文件）。

> 模块 → 源文件映射表、CLI 参数说明与探索工具用法见 [AGENTS.md](AGENTS.md)。

## 🔬 研究线（Spine Lab）

Spine 机制研究独立为一条产品线（`spine-lab/`），与主项目双向隔离——主项目构建、路由、测试均不含研究线代码，研究线也不反向引用主项目 `src/app/` 任何模块：

- **独立 Vite 子应用**（端口 5174）：入口 / 组件 / 独立 tsconfig / 测试 / 构建完全自洽，不随主站部署
- **共享只读依赖**：`src/spine/` 引擎层 + `src/services/` 数据层 + `src/lib/` 常量（引擎修复两边同时受益）
- **收录原 `/debug/*` 全部能力**：全量 manifest 三级审核（L0 资源 / L1 解析 / L2 渲染）+ KV 场景一键验收（黑块检测 + PASS/FAIL 报告）
- **研究资产随迁**：文档在 `spine-lab/docs/`（官网动画播放机制分析 / 抓取流程 / 单层模式黑块成因与衬底方案），抓取与审计脚本在 `spine-lab/tools/`

```bash
pnpm dev:lab      # http://localhost:5174/
pnpm build:lab    # 构建（含独立 vue-tsc 类型检查）
pnpm test:lab     # 研究线单测（43 用例）
```

## 测试

- **前端单元（Vitest + happy-dom）**：`src/**/__tests__/*.test.ts`，覆盖数据层纯函数、缓存逻辑、API 契约
- **e2e（Playwright）**：`e2e/` 布局验收 + axe-core 无障碍扫描 + 像素基线（`test:e2e:update` 刷新基线）
- **转换工具（pytest）**：`tools/converter/tests/`，合成数据 + mock TextMap，不依赖真实源数据
- **CI**：`.github/workflows/ci.yml`（push/PR 自动运行 build + 单测 + e2e；软门禁——失败仅通知不拦 push，Vercel 生产构建为上线前最后守卫）与 `data-sync.yml`（数据同步时）

## 贡献

1. **修 bug / 加功能**：本地通过 `pnpm build`（含三守卫）+ `pnpm test` 自检后直推 `main`（软门禁：main 仅防 force push 与删除，CI 自动运行、失败由 GitHub 通知；Vercel 构建失败不部署、可一键回滚）
2. **更新数据**：`vendor/TurnBasedGameData` 子模块更新后重跑 `python convert.py` 即可，前端无需改动
3. **新增目录页**：在 `src/app/catalog/pages/` 新增 `<id>.ts` 配置并注册到 `pages.ts`
4. **数据字段取舍**：遵循 `docs/audit/字段价值审计流程.md`（解读卡 → 人工裁决四档分级，AI 无权判 🔴 排除）
5. 完整工程规则（禁裸 `fetch`、色彩三层令牌、验证分级等）见 [AGENTS.md](AGENTS.md)

## 部署

推送到 `main` 分支后 Vercel 自动构建部署。SPA 路由重写与缓存头配置见根目录 `vercel.json`（`/data/*` 短缓存、`/assets/*` 长期不可变缓存）。`vite.config.ts` 中 `base` 为 `/`，部署于域名根路径。

## 文档

- `CONTEXT.md`：项目术语表（数据源、命途/属性枚举、图片路径映射、双模式与色彩体系术语）
- `AGENTS.md`：工程规则与架构指南（分层结构、数据流向、强制约定、验证分级）
- `docs/adr/`：架构决策记录（自建侧边栏、货币战争模式、官网 Spine 动画接入、全局色彩管理等）
- `docs/audit/`：字段价值审计流程与色彩收口流程
- `docs/memory/`：复盘日志（异常信号 / 流程规则改进记录）
- `docs/` 下另有数据还原样例、`ExcelOutput` / `TurnBasedGameData` 数据总结
- `spine-lab/docs/`：Spine 机制研究文档（动画播放机制分析 / 抓取流程 / 单层模式黑块成因与衬底方案）

## License 与版权声明

- **代码**：本项目代码以 MIT 许可证发布（详见 `LICENSE`）
- **数据来源**：本地数据由社区解包仓库 [`DimbreathBot/TurnBasedGameData`](https://github.com/DimbreathBot/TurnBasedGameData) 经 `tools/converter/` 转换产出，格式参考 [`Mar-7th/StarRailRes`](https://github.com/Mar-7th/StarRailRes)；部分图片与 Spine 动画资源来自 [`hsr.nanoka.cc`](https://hsr.nanoka.cc) 与米哈游官网活动资源
- **版权**：《崩坏：星穹铁道》游戏内容（角色、美术、文本、音视频等）版权归 **米哈游 / HoYoverse** 所有
- **用途**：本项目为非商业用途的数据展示与学习项目，与米哈游无任何关联或背书；如涉侵权请联系移除