# HSR Wiki · 崩坏：星穹铁道

独立部署于 **GitHub Pages** 的《崩坏：星穹铁道》游戏数据 Wiki，提供 Gaming HUD 风格的沉浸式浏览体验（Spine 角色动画、虚拟滚动卡片、暗色数据面板等）。

- 站点地址：`https://<user>.github.io/hsr_wiki/`
- 技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router（Hash 模式）
- 数据源：运行时从 `https://static.nanoka.cc` 拉取（CDN 已开放 CORS），第二期引入 `TurnBasedGameData` 本地转换数据

## 技术栈

| 分类 | 选型 |
|---|---|
| 框架 | Vue 3（`script setup` SFC） |
| 构建 | Vite |
| 语言 | TypeScript |
| 状态 | Pinia |
| 路由 | Vue Router（`createWebHashHistory`） |
| 测试 | Vitest + happy-dom |
| 包管理 | pnpm |

## 目录结构

```
hsr wiki/
├── docs/                     # 项目文档（ADR、数据还原样例、数据总结）
│   └── adr/                  # 架构决策记录（0002~0006）
├── public/
│   └── data/cn/              # 由转换工具产出的本地数据 JSON（随站部署）
├── src/
│   ├── app/                  # 应用层：视图、组件、路由、store、目录/角色模块
│   ├── components/           # 复用组件
│   ├── lib/                  # 纯函数工具（format、constants、errors）
│   ├── platform/             # 平台适配（历史遗留，当前可忽略）
│   ├── services/             # API 层（api.ts / cache.ts / types.ts）
│   ├── styles/               # 全局样式（tokens / character / catalog）
│   ├── main.ts               # 唯一入口
│   └── vite-env.d.ts
├── tools/converter/          # Python 转换工具：TurnBasedGameData → 本地数据
└── CONTEXT.md                # 项目术语表
```

## 快速开始

环境要求：Node 22+、pnpm 9+。

```bash
# 安装依赖
pnpm install

# 本地开发（访问 http://localhost:5173/hsr_wiki/）
pnpm dev

# 类型检查 + 生产构建
pnpm build

# 预览构建产物
pnpm preview

# 运行单元测试
pnpm test

# 监听模式运行测试
pnpm test:watch
```

## 数据架构

站点数据来源分两期演进：

- **第一期（当前）**：运行时实时拉取 `https://static.nanoka.cc`（CORS 已验证 `access-control-allow-origin: *`）。API 层为纯函数，集中位于 `src/services/api.ts`，由 Pinia store 编排调用，支持内存 + IndexedDB 双层缓存（`src/services/cache.ts`）。
- **第二期**：引入 `DimbreathBot/TurnBasedGameData` 官方解包数据，经 `tools/converter/` 转换为扁平索引 JSON，输出到 `public/data/cn/`，随仓库部署到 GitHub Pages。前端已预留本地数据加载接口（`loadLocalCharacterList` / `loadLocalCharacter` 等）。

图片资源（图标、Spine `.skel`/`.atlas`）始终通过 `https://static.nanoka.cc` 加载，前端拼接固定 CDN 前缀（`src/lib/constants.ts` 中 `CDN`）。

## 数据转换工具

`tools/converter/` 是一套 Python 脚本，将官方解包数据（`vendor/TurnBasedGameData/`，含 `ExcelOutput/`、`TextMap/`、`Config/`）转换为 StarRailRes 兼容的索引 JSON，输出到 `public/data/cn/`。

```bash
cd tools/converter
pip install -r requirements.txt     # 需 python-xxhash 等
python convert.py                   # 依次转换 通用/角色/光锥/遗器 数据
```

转换逻辑按模块拆分于 `tools/converter/converters/`：

| 模块 | 输出（节选） |
|---|---|
| `paths.py` / `elements.py` / `properties.py` | `paths.json`、`elements.json`、`properties.json` |
| `items.py` | `items.json` |
| `characters.py` / `character_ranks.py` / `character_skills.py` / `character_detail.py` | `characters.json`、`character_ranks.json`、`character_skills.json`、`characters/<id>.json` |
| `light_cones.py` | `light_cones.json` |
| `relics.py` / `relic_affixes.py` | `relics.json`、`relic_main_affixes.json`、`relic_sub_affixes.json` |

文本映射通过 `TextMap/TextMapCHS.json` 解析（xxhash），源数据中的 `{ "Hash": ... }` 与字面量字符串两种引用方式统一处理（见 `tools/converter/textmap.py`）。

## 部署

通过 GitHub Actions（`push` 到 `main` 自动部署，配置见 `docs/migration-plan.md` 第 19 步）构建并发布到 GitHub Pages。需在仓库 **Settings → Pages → Source** 选择 "GitHub Actions"。`vite.config.ts` 中 `base` 已设为 `/hsr_wiki/`，资源路径自动带前缀。

## 文档

- `CONTEXT.md`：项目术语表（数据源、命途/属性枚举、图片路径映射等）。
- `docs/migration-plan.md`：寄生油猴脚本 → GitHub Pages 独立站的迁移执行计划。
- `docs/adr/`：架构决策记录（Spine 自主渲染、自建侧边栏、独立站、转换工具、数据格式映射等）。
- `docs/` 下另有数据还原样例与 `ExcelOutput` / `TurnBasedGameData` 数据总结。
