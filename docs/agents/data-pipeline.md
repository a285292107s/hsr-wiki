# 数据转换管线与本地数据探索

> AGENTS.md 的按主题子文件（主文件「任务 → 必读」路由表经相对链接引用，按需读取）。存放数据侧低频技能资料：转换管线、本地数据探索。常用命令见 [commands.md](commands.md)，字段裁决见 [conventions.md](conventions.md)。

## 数据转换管线（Python）

`tools/converter/` 将 `vendor/TurnBasedGameData/`（本地数据目录，**非 git 子模块**：ExcelOutput + TextMap；克隆命令见 `.gitignore` 注释）转换为 `public/data/cn/` 下的 JSON。上游数据无手动流程：`data-sync.yml` 每日 04:00 UTC 自动浅克隆上游 → `convert.py --force` → `gen_catalog.py` 重建 `DATA_CATALOG.md` → 有 diff 才提交推送 main（转换失败即 job 失败，不推送坏数据）。

- 入口：`convert.py` → `MODULES` 注册表驱动，支持 `--only` / `--force` / `--pretty`
- 模块 → 源文件映射的**唯一事实源是 `incremental.py` 的 `MODULE_SOURCES`**（由 `tools/converter/tests/test_incremental.py` AST 校验锁住，防止声明与实际读取漂移）；本文件不复述映射表，需要时读代码
- 增量转换：`incremental.py` 基于源文件 mtime + size 签名跳过未变更模块，状态存 `.converter-state.json`（已 gitignore）
- 文本解析：`textmap.py` 加载 `TextMapCHS.json`，同时处理 `{ "Hash": N }` 对象引用与字面量字符串键
- TextMap 查询缓存：`textmap_db.py` 预建 SQLite 索引（`.textmap-cache.db`，已 gitignore），按 `mtime_ns:size` 签名自动失效重建
- 数值扁平化：源数据将数值包装为 `{ "Value": N }`，转换器递归展开
- 配置：`config.py` 存放路径映射、枚举回退表、图标路径重映射表
- 输出：默认紧凑 JSON，`--pretty` 切换缩进（调试用）
- 输出确定性：上游数据更新后重跑即可，前端无需改动

## 本地数据探索（禁止直接读原始文件）

`vendor/TurnBasedGameData` 是 GB 级源数据（`ExcelOutput/` 数千个 JSON + `TextMap/` 多语言全量），**禁止直接读取原始文件**，一律走下列工具：

- **`DATA_CATALOG.md`**：自动生成的轻量索引，含每个文件的 schema、记录数、首条样例。查结构先读此文件。
- **`query.py`**：精确查询 CLI，支持 `--schema` / `--id` / `--where` / `--fields` / `--grep` / `--list` / `--limit` / `--resolve` / `--search` / `--rebuild-textmap`（完整参数以 `python query.py --help` 为准）。`--resolve` / `--search` 走本地 SQLite 缓存，首次自动建库。
- **`gen_catalog.py`**：本地数据更新后重跑 `python gen_catalog.py` 刷新索引（全量模式才写 `DATA_CATALOG.md`；`--top` / `--filter` 输出独立文件，勿提交）。
