# HSR Wiki · 崩坏：星穹铁道

独立部署于 **Vercel** 的《崩坏：星穹铁道》游戏数据 Wiki，提供 Gaming HUD 风格的沉浸式浏览体验（Spine 角色动画、虚拟滚动卡片、暗色数据面板等）。

- 技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router（History 模式）
- 数据源：**本地优先**——全部目录/详情数据为预转换 JSON（随站部署），运行时仅图片与 Spine 动画从 CDN 加载
- 双主题：常规模式（黑紫）与货币战争模式（黑金，`/currency/*` 路由），全局色彩走三层令牌体系

## 技术栈

| 分类 | 选型 |
|---|---|
| 框架 | Vue 3（`<script setup>` SFC） |
| 构建 | Vite |
| 语言 | TypeScript |
| 状态 | Pinia |
| 路由 | Vue Router（`createWebHistory`） |
| 测试 | Vitest + happy-dom（前端） / pytest（转换工具） |
| 包管理 | pnpm（`packageManager` 锁定，Node 22+） |

## 目录结构

```
hsr wiki/
├── docs/                     # 项目文档（ADR、字段审计、色彩收口、数据总结）
│   ├── adr/                  # 架构决策记录（0003~0013）
│   └── audit/                # 字段价值审计流程 / 色彩收口流程
├── public/
│   └── data/cn/              # 转换工具产出的本地数据 JSON（随站部署）
│       ├── characters/       # 角色详情（<id>.json）
│       ├── light_cones/      # 光锥详情
│       ├── monsters/         # 敌对详情
│       └── currency/         # 货币战争模式数据（role / portals / traits / season）
├── src/
│   ├── app/                  # 应用层：views 视图、catalog 配置驱动目录引擎、
│   │                         #   character 角色详情子组件、components、stores、router
│   ├── lib/                  # 纯函数工具（constants / format / icons / html / diff / errors）
│   ├── services/             # 数据层：api/ 按域拆分加载器、cdn/ 双源 URL 解析、
│   │                         #   cache.ts 缓存、types/ 共享接口
│   ├── spine/                # 中立 Spine 引擎层（零 Vue 依赖，DOM/WebGL/rAF）
│   ├── debug/                # 诊断支撑层（仅 /debug/* 路由可达，动态打包隔离）
│   ├── styles/               # tokens.css 设计令牌 + catalog.css + 页面专属 CSS（随路由懒加载）
│   ├── main.ts               # 唯一入口
│   └── vite-env.d.ts
├── tools/converter/          # Python 转换工具：TurnBasedGameData → 本地数据
├── vendor/TurnBasedGameData/ # git 子模块：官方解包数据（ExcelOutput + TextMap）
├── AGENTS.md                 # 协作与工程规则指南（Lingma/Agent 工作约定）
└── CONTEXT.md                # 项目术语表
```

## 快速开始

环境要求：Node 22+（包管理器使用 `packageManager` 指定的 pnpm 11）。

```bash
# 安装依赖
pnpm install

# 本地开发（访问 http://localhost:5173/）
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 预览构建产物
pnpm preview

# 运行全部测试（前端）
pnpm test

# 监听模式运行测试
pnpm test:watch
```

## 数据架构

**本地优先**：全部目录与详情数据均为预转换 JSON，存放于 `public/data/cn/`（随站部署），无运行时 CDN 列表拉取。加载器集中在 `src/services/api/`（`characters` / `light_cones` / `relics` / `items` / `monsters` / `endgame` / `achievements` / `currency` / `spine` 按域拆分，共享列表走单例 Promise）。

- **角色 / 光锥 / 遗器 / 物品 / 敌对**：列表数据由 `tools/converter/` 从 `vendor/TurnBasedGameData` 产出（`characters.json`、`light_cones.json`、`relics.json`、`items.json`、`monsters.json`）；详情页数据为 `characters/<id>.json`、`light_cones/<id>.json`、`monsters/<id>.json`。
- **终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）**：由 `endgame.py` 从 `ChallengeMazeConfig` / `ChallengeStoryMazeConfig` / `ChallengeBossMazeConfig` / `ChallengePeakConfig` 产出，落地为 `maze.json`、`maze_extra.json`、`maze_boss.json`、`maze_peak.json`。四季合并为单目录页，模式以筛选选项切换（与原站 story/boss 行为一致）。
- **货币战争模式**：`currency/` 下角色 / 装备 / 传送门 / 强化 / 词条数据（含跨星级合并、`#N` 引用解析），路由位于 `/currency/*` 并切换黑金主题。
- **图片资源**：非 Spine 图标优先走 **jsDelivr 官方 StarRailTextures 镜像**（`src/lib/constants.ts` 的 `OFFICIAL_ICON_BASE` + converter 输出的仓库相对路径反查表），nanoka 保留回退；Spine `.skel`/`.atlas` 与未收录分类走 `https://static.nanoka.cc`。全部图片 URL 构造统一经 `src/services/cdn/` 纯函数解析（双源 + 回退属性 + 请求失败 CSS 占位降级）。

> 全部本地数据由 `tools/converter/convert.py` 从 `vendor/TurnBasedGameData` 真实产出，严禁以任何外部样本作为数据源读取或随站部署。
>
> 本地数据需随上游解包更新时，重跑 `tools/converter/convert.py` 即可，前端无需改动。

## 数据转换工具

`tools/converter/` 是一套 Python 脚本，将官方解包数据（`vendor/TurnBasedGameData/`，含 `ExcelOutput/`、`TextMap/`、`Config/`）转换为 StarRailRes 兼容的索引 JSON，输出到 `public/data/cn/`。

```bash
cd tools/converter
pip install -r requirements.txt     # 需 python-xxhash 等
python convert.py                   # 全量转换（增量跳过未变更模块）
python convert.py --only characters # 仅重跑指定模块
python convert.py --force --pretty  # 强制全量 + 缩进输出
python -m pytest tests/ -v          # 转换工具单元测试
```

转换逻辑按模块拆分于 `tools/converter/converters/`，由 `convert.py` 模块注册表驱动（`--only` / `--force` / `--pretty`）：

| 模块 | 输出（节选） |
|---|---|
| `paths.py` / `elements.py` / `properties.py` | `paths.json`、`elements.json`、`properties.json` |
| `items.py` | `items.json` |
| `monsters.py` / `monster_common.py` / `monster_detail.py` | `monsters.json`、`monsters/<id>.json` |
| `endgame.py` | `maze.json`、`maze_extra.json`、`maze_boss.json`、`maze_peak.json` |
| `achievements.py` | `achievements.json` |
| `characters.py` / `character_detail.py` | `characters.json`、`characters/<id>.json` |
| `light_cones.py` / `light_cone_detail.py` | `light_cones.json`、`light_cones/<id>.json` |
| `relics.py` / `relic_affixes.py` | `relics.json`、`relic_main_affixes.json`、`relic_sub_affixes.json` |
| `currency.py` / `currency_catalog.py` / `season.py` | `currency/*.json` |
| `version.py` | 数据版本信息 |

关键机制：

- **增量转换**：`incremental.py` 基于源文件 mtime+size 签名跳过未变更模块（状态存于 `.converter-state.json`，已 gitignore），依赖声明由测试 AST 校验锁住。
- **文本解析**：`textmap.py` 处理 `{ "Hash": N }` 对象引用与字面量字符串两种 TextMap 引用方式；`textmap_db.py` 将 `TextMapCHS.json` 预建为 SQLite 索引（`.textmap-cache.db`），供 `query.py --resolve/--search` 毫秒级查询。
- **子模块数据探索**：`query.py` 支持 `--list` / `--schema` / `--id` / `--where` / `--resolve` / `--search`，`gen_catalog.py` 生成 `DATA_CATALOG.md` 轻量索引（禁止直接读取 GB 级原始文件）。
- **数值扁平化**：源数据所有数值包装为 `{ "Value": N }`，转换时递归展开。

## 测试

- **前端（Vitest + happy-dom）**：位于 `src/**/__tests__/*.test.ts`，覆盖数据层纯函数、缓存逻辑、API 契约（含 CDN 双源解析、spine-manifest 版本一致性校验）。
- **转换工具（pytest）**：位于 `tools/converter/tests/`，合成数据 + mock TextMap，不依赖真实源数据。
- **CI**：`.github/workflows/ci.yml`（push/PR 全量验证）与 `data-sync.yml`（数据同步时）。

## 部署

推送到 `main` 分支后 Vercel 自动构建部署。SPA 路由重写与缓存头配置见根目录 `vercel.json`（`/data/*` 短缓存、`/assets/*` 长期不可变缓存）。`vite.config.ts` 中 `base` 为 `/`，部署于域名根路径。

## 文档

- `CONTEXT.md`：项目术语表（数据源、命途/属性枚举、图片路径映射等）。
- `AGENTS.md`：工程规则与架构指南（分层结构、数据流向、强制约定——如禁裸 `fetch`、色彩三层令牌、构建守卫等）。
- `docs/adr/`：架构决策记录（自建侧边栏、货币战争模式、官网 Spine 动画接入、全局色彩管理黑紫/黑金、CDN 资源兜底等）。
- `docs/audit/`：字段价值审计流程与色彩收口流程。
- `docs/` 下另有数据还原样例、`ExcelOutput` / `TurnBasedGameData` 数据总结、官网 Spine 动画分析等。
