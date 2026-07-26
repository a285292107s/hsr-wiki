# ADR-0005: 引入 TurnBasedGameData 转换工具

## 状态

已接受

## 背景

HSR Wiki 当前数据源为 `https://static.nanoka.cc` CDN，运行时实时拉取。该数据源存在以下问题：
- 第三方维护，可用性不受控
- 数据结构为定制格式，字段冗余、命名不统一（如 `CombatPowerAvatarRarityType4`）
- 缺少结构化文档，维护成本高

`DimbreathBot/TurnBasedGameData` 是崩坏：星穹铁道的官方客户端解包数据仓库，包含完整的 `ExcelOutput/`、`TextMap/`、`Config/` 数据，覆盖面全且持续跟进版本更新（截至 2026-07-24 已至 4.4.0）。但其数据结构复杂、字段冗余，无法直接供网站消费。

`Mar-7th/StarRailRes` 仓库定义了一套精简、扁平、文档完备的索引 JSON 格式，是社区广泛参考的标准。本工具的目标是将 TurnBasedGameData 转换为 StarRailRes 兼容格式。

## 决策

1. **技术栈：Python 3**
   - TextMap 使用 xxhash，Python 有成熟实现（`python-xxhash`）
   - 批处理 JSON 转换表达力强
   - 不需要与前端共享类型（输出是纯 JSON）

2. **工具位置：仓库内 `tools/converter/`**
   - 与网站数据强耦合，放一起便于版本同步
   - 独立脚本，不参与 Vite 打包

3. **源数据获取：Git submodule 引入 TurnBasedGameData**
   - 仓库体积大，submodule 不污染主仓库历史
   - 可锁定特定 commit，保证数据版本可追溯
   - 转换时直接读本地文件系统

4. **输出位置：`public/data/[lang]/`，随网站部署到 GitHub Pages**
   - 网站直接 `fetch('/hsr_wiki/data/cn/characters.json')` 即可
   - 版本随仓库 commit 绑定
   - 图片路径仍指向 `https://static.nanoka.cc`（CDN 不动）

5. **第一期语言范围：仅简体中文（CN）**
   - 先跑通单语言链路
   - 架构预留 `output/[lang]/` 目录，多语言可第二期扩展

## 后果

- 新增 `tools/converter/` 子项目，需维护 Python 依赖（`python-xxhash` 等）
- 新增 git submodule，clone 时需 `--recurse-submodules`
- 数据更新流程：更新 submodule → 运行转换脚本 → commit 输出 JSON
- 图片资源仍依赖 nanoka CDN，若 CDN 不可用则图标失效（第二期可考虑自托管图片）
