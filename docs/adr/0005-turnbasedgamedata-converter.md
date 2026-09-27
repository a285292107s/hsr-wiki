# ADR-0005: 引入 TurnBasedGameData 转换工具

**Status**: Accepted（技术栈 / 工具位置 / 本地转换路线成立；「git submodule」与「多语言输出路径」条款已被现况取代，见「决策」内标注）

## 背景

原数据源为 `https://static.nanoka.cc` CDN 运行时实时拉取：第三方维护、可用性不受控、结构与命名不统一、缺少结构化文档。`DimbreathBot/TurnBasedGameData`（官方客户端解包数据仓库）覆盖全且持续跟进版本更新，但结构复杂、无法直接消费，故引入本地离线转换。

## 决策

1. **技术栈：Python 3**（TextMap 走 xxhash；批处理 JSON 表达力强；输出纯 JSON 无需与前端共享类型）。现况一致。
2. **工具位置：仓库内 `tools/converter/`**（与数据强耦合、不参与 Vite 打包）。现况一致。
3. **源数据获取**：原定 git submodule。**已被取代（2026-08-12）**：非 submodule，本地目录 `vendor/TurnBasedGameData/`（禁用直接读写，探索走 `query.py` / `DATA_CATALOG.md`），CI 由 `.github/workflows/data-sync.yml` 每日 `git clone --depth 1` 拉取（依赖上游 HEAD 提交标题取版本号）。
4. **输出位置**：原定 `public/data/[lang]/` 且以 `/hsr_wiki/` 子路径 fetch。**已被取代**：实际仅 `public/data/cn/` 单语言（顶层索引 + `characters/` `light_cones/` `currency/` `monsters/` 等子目录），随 Vercel 同域部署、根路径 fetch；转换产物提交进仓库，版本与 commit 绑定。
5. **语言范围：仅简体中文（CN）**。现况一致（多语言未启动）。
6. **图片资源**：原定 nanoka CDN 单源。现况为三级解析：公共小图标本地随站（local-first）→ nanoka 主源 → jsDelivr 回退。

## 后果

- 维护 Python 依赖（`tools/converter/requirements.txt`）；数据更新 = 拉取上游 → 转换 → 提交产物（CI 自动）。
- 输出结构与字段裁决的现况指针：`tools/converter/converters/`、`tools/converter/DATA_CATALOG.md`、docs/audit/。本 ADR 不描述文件清单（易漂移）。
