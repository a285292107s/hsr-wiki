# 数据转换工具集

把 `vendor/TurnBasedGameData`（官方解包数据的本地副本，非 git 子模块）转换为前端随站分发的 JSON。字段/源表/记录数索引见 [DATA_CATALOG.md](DATA_CATALOG.md)（总索引；全量明细按文件名首字母分片存于 `DATA_CATALOG.parts/`，由 `gen_catalog.py` 生成）；数据探索与改造转换器的完整工作流见 [docs/agents/data-pipeline.md](../../docs/agents/data-pipeline.md)。

## 环境与运行

Python 版本要求（3.10+，CI 固定 3.12）见 [docs/agents/tech-stack.md](../../docs/agents/tech-stack.md)。源数据不在版本控制内，需自行浅克隆，且必须保留 `.git`（`version` 模块用 HEAD 提交取版本号）。

```bash
git clone --depth 1 https://github.com/DimbreathBot/TurnBasedGameData.git vendor/TurnBasedGameData
cd tools/converter
pip install -r requirements.txt
```

## 转换

```bash
python convert.py                          # 全量（源数据未变更的模块自动跳过）
python convert.py --only characters,relics # 仅重跑指定模块（逗号分隔）
python convert.py --force                  # 忽略增量缓存，强制全量
python convert.py --pretty                 # 缩进输出（调试用，默认紧凑）
python convert.py --official-icon-paths    # 图标路径输出官方仓库相对路径
```

输出目录为 `public/data/cn/`（`config.py` 的 `OUTPUT_DIR`）；模块名以 `convert.py` 的 `MODULES` 为准，未知模块名报错退出；`endgame_catalog` 由 `endgame` 的全量输出派生（不读源数据），需在 `endgame` 之后运行。

| 模块 | 输出文件 |
| --- | --- |
| `paths` | `paths.json` |
| `elements` | `elements.json` |
| `properties` | `properties.json` |
| `items` | `items.json` |
| `characters` | `characters.json` |
| `character_detail` | `characters/{id}.json` |
| `light_cones` | `light_cones.json` |
| `light_cone_detail` | `light_cones/{id}.json` |
| `relics` | `relics.json`、`relic_stories.json` |
| `relic_affixes` | `relic_main_affixes.json`、`relic_sub_affixes.json` |
| `monsters` | `monsters.json` |
| `monster_detail` | `monsters/{id}.json` |
| `endgame` | `maze.json`、`maze_extra.json`、`maze_boss.json`、`maze_peak.json` |
| `endgame_catalog` | `maze.catalog.json`、`maze_extra.catalog.json`、`maze_boss.catalog.json`、`maze_peak.catalog.json` |
| `currency` | `currency/role.json`、`currency/role/{id}.json`、`currency/prop_icons.json` |
| `currency_catalog` | `currency/equipment.json`、`currency/portals.json`、`currency/augments.json`、`currency/traits.json` |
| `achievements` | `achievements.json`、`achievement_series.json` |
| `version` | `version.json` |

增量机制：按源文件 `mtime_ns:size` 签名跳过未变更模块，状态存 `.converter-state.json`（已 gitignore）；`incremental.py` 的 `MODULE_SOURCES` 声明各模块源文件依赖（`monster_common.py` 是共享助手，不在 `MODULES` 中），`tests/test_incremental.py` 用 AST 扫描校验「加载调用 ⊆ 声明」与 `MODULES` 全覆盖。

## 数据探索

```bash
python query.py --list Avatar                       # 按文件名模糊列出
python query.py AvatarConfig --schema               # 字段 + 记录数
python query.py AvatarConfig --id 1001 --fields AvatarName,DamageType
python query.py AvatarConfig --where "DamageType=Ice" --limit 5
python query.py ItemConfig --grep "星琼" --limit 5
python query.py --resolve 6186714091647966180       # TextMap Hash → 文本
python query.py --search "黄泉" --limit 10
python query.py --help                              # 全部参数
python gen_catalog.py                               # 全量索引 → DATA_CATALOG.md 总索引 + DATA_CATALOG.parts/*.md 分片
python gen_catalog.py --top 50                      # 局部索引 → DATA_CATALOG.top50.md（勿提交）
python gen_catalog.py --filter Avatar               # 局部索引 → DATA_CATALOG.filter-avatar.md（勿提交）
# TextMap 查询走 .textmap-cache.db（SQLite，已 gitignore）：首次自动建库，源文件变更后自动重建，--rebuild-textmap 强制重建
```

## 测试

不依赖真实源数据（合成数据 + monkeypatch）：`cd tools/converter && python -m pytest tests/`。CI 不跑这些单测：`.github/workflows/data-sync.yml` 每日浅克隆上游 → `convert.py --force` → `gen_catalog.py` → `git diff --cached` 有变更才提交。

## 文件结构

```
tools/converter/
├── convert.py          # 主入口：MODULES 注册 + CLI
├── config.py           # 源/输出路径、枚举与图标路径映射
├── textmap.py          # TextMap 加载与 Hash 解析
├── textmap_db.py       # TextMap SQLite 缓存（query.py 用）
├── utils.py            # load/save、unwrap、图标路径等通用工具
├── incremental.py      # MODULE_SOURCES 增量签名与状态
├── query.py            # 数据查询 CLI
├── gen_catalog.py      # DATA_CATALOG.md 总索引 + DATA_CATALOG.parts/ 分片生成器
├── converters/         # 各模块转换器 + monster_common.py（共享助手）
├── tests/              # pytest 用例（合成数据，不依赖真实源数据）
├── DATA_CATALOG.md     # 自动生成的数据索引总入口（纳入版本控制）
├── DATA_CATALOG.parts/ # 按文件名首字母切分的字段明细分片（自动生成，纳入版本控制）
├── requirements.txt    # xxhash（运行时）+ pytest（测试）
└── README.md
```
