# 数据转换工具集

将 `vendor/TurnBasedGameData`（游戏解包子模块）转换为前端可用的 JSON 数据，并提供数据探索工具。

## 环境要求

- Python 3.10+
- 依赖安装：`pip install -r requirements.txt`
- 子模块已初始化：`git submodule update --init --remote vendor/TurnBasedGameData`

## 工具一览

| 工具 | 用途 | 典型场景 |
|------|------|----------|
| `convert.py` | 数据转换器（源数据 → 前端 JSON） | 子模块更新后重新生成数据 |
| `query.py` | 数据查询 CLI | 精确查找/检索源数据记录 |
| `gen_catalog.py` | 索引生成器 | 生成 DATA_CATALOG.md 供快速浏览结构 |

---

## convert.py — 数据转换器

将 ExcelOutput + TextMap 转换为 `public/data/cn/` 下的前端 JSON。

```bash
python convert.py                        # 全量转换（增量跳过未变更模块）
python convert.py --only characters      # 仅重跑指定模块
python convert.py --only characters,relics  # 多模块逗号分隔
python convert.py --force                # 强制全量（忽略增量缓存）
python convert.py --pretty               # 输出缩进格式（调试用，默认紧凑）
```

### 可用模块

| 模块名 | 输出文件 | 源数据 |
|--------|----------|--------|
| `paths` | paths.json | AvatarBaseType |
| `elements` | elements.json | DamageType |
| `properties` | properties.json | （自建映射） |
| `items` | items.json | ItemConfig |
| `characters` | characters.json | AvatarConfig(LD) |
| `character_ranks` | character_ranks.json | AvatarRankConfig |
| `character_skills` | character_skills.json | AvatarSkillConfig |
| `character_detail` | characters/{id}.json | 多文件联合 |
| `light_cones` | light_cones.json | EquipmentConfig, EquipmentSkillConfig |
| `light_cone_detail` | light_cones/{id}.json | 多文件联合 |
| `relics` | relics.json, relic_stories.json | RelicSetConfig, RelicConfig 等 |
| `relic_affixes` | relic_main_affixes.json, relic_sub_affixes.json | RelicMainAffixConfig, RelicSubAffixConfig |
| `monsters` | monsters.json | MonsterTemplateConfig |
| `endgame` | maze*.json | ChallengePeakConfig |
| `currency` | currency/ | AvatarConfigLD（本地） |
| `season` | currency/seasons.json | （本地数据） |

### 增量机制

- 基于源文件 mtime + size 签名判断是否需要重跑
- 状态存储于 `.converter-state.json`（已 gitignore）
- `--force` 可强制忽略缓存

---

## query.py — 数据查询工具

无需打开 GB 级原始 JSON，即可精确检索子模块数据。**AI 辅助开发的首选工具。**

### 基本用法

```bash
cd tools/converter
```

### 文件探索

```bash
# 列出所有文件名（模糊搜索）
python query.py --list Avatar
python query.py --list Relic

# 查看文件 schema（字段名 + 类型 + 记录数）
python query.py AvatarConfig --schema
python query.py RelicSetConfig --schema
```

### 记录查询

```bash
# 按 ID 查单条（自动检测 ID 字段名）
python query.py AvatarConfig --id 1001
python query.py EquipmentConfig --id 23000

# 仅返回指定字段
python query.py AvatarConfig --id 1001 --fields AvatarName,DamageType,Rarity

# 条件过滤
python query.py AvatarConfig --where "DamageType=Ice" --limit 5
python query.py AvatarConfig --where "Rarity=CombatPowerAvatarRarityType5" --fields AvatarID,AvatarName

# 多条件（逗号分隔）
python query.py AvatarConfig --where "DamageType=Ice,Rarity=CombatPowerAvatarRarityType5"

# 模糊搜索（字段值包含关键词）
python query.py ItemConfig --grep "星琼" --limit 5

# 显示前 N 条
python query.py AvatarConfig --head 3
```

### TextMap 查询

```bash
# 解析 Hash 值 → 中文文本
python query.py --resolve 6186714091647966180

# 按文本内容搜索（返回 hash + 文本）
python query.py --search "黄泉"
python query.py --search "存护" --limit 10

# 强制重建 SQLite 索引（一般无需手动执行）
python query.py --rebuild-textmap
```

#### SQLite 缓存机制

TextMap 查询走本地 SQLite 索引（`.textmap-cache.db`，已 gitignore）：

- **首次查询**：自动从 `TextMapCHS.json` 建库（~5-8s，一次性）
- **后续查询**：`--resolve` 走主键索引 <1ms；`--search` 走 LIKE 全表扫描 ~100-300ms
- **自动失效**：基于源文件 `mtime_ns:size` 签名检测，子模块更新后下次查询自动重建
- **手动重建**：`--rebuild-textmap` 或直接删除 DB 文件

### 参数速查

| 参数 | 说明 |
|------|------|
| `file` | ExcelOutput 下的文件名（可省略 .json） |
| `--schema` | 显示文件结构（字段、类型、记录数） |
| `--id <值>` | 按 ID 精确查询 |
| `--where <条件>` | 字段=值 过滤，多条件逗号分隔 |
| `--fields <列表>` | 仅输出指定字段 |
| `--grep <文本>` | 模糊搜索记录内容 |
| `--head <N>` | 显示前 N 条 |
| `--limit <N>` | 限制输出条数 |
| `--list [关键词]` | 列出匹配的文件名 |
| `--resolve <Hash>` | 解析 TextMap Hash |
| `--search <文本>` | TextMap 全文搜索 |
| `--rebuild-textmap` | 强制重建 TextMap SQLite 索引 |

---

## gen_catalog.py — 索引生成器

扫描全部 ExcelOutput 文件，生成 `DATA_CATALOG.md` 轻量索引（~760 KB），包含每个文件的 schema、记录数、首条记录摘要。

```bash
python gen_catalog.py                    # 全量生成
python gen_catalog.py --top 50           # 仅索引前 50 个最大文件
python gen_catalog.py --filter Avatar    # 仅索引文件名含 Avatar 的
```

### CI 自动触发

`.github/workflows/catalog.yml` 在子模块指针变更时自动：
1. 运行 `convert.py --force` 刷新前端 JSON
2. 运行 `gen_catalog.py` 刷新索引
3. 自动提交回 main（`[skip ci]` 防循环）

---

## 推荐工作流

### AI 辅助开发（探索新数据）

```
1. 读 DATA_CATALOG.md → 定位目标文件
2. python query.py <文件> --schema → 了解字段结构
3. python query.py <文件> --id/--where → 取出具体记录
4. 编写/修改 converter 模块
5. python convert.py --only <模块> --pretty → 验证输出
```

### 子模块更新后

```bash
git submodule update --init --remote vendor/TurnBasedGameData
cd tools/converter
python convert.py --force        # 本地全量重跑
python gen_catalog.py            # 刷新索引（可选，CI 会自动做）
```

### 调试单个模块

```bash
python convert.py --only character_detail --pretty
# 输出缩进 JSON 到 public/data/cn/，方便人工检查
```

---

## 文件结构

```
tools/converter/
├── convert.py              # 主入口：模块注册 + CLI
├── config.py               # 路径/枚举/图标映射配置
├── textmap.py              # TextMap 加载 + Hash 解析
├── utils.py                # 通用工具（load/save/unwrap/map_icon）
├── incremental.py          # 增量转换状态管理
├── query.py                # 数据查询 CLI（本文件）
├── textmap_db.py           # TextMap SQLite 缓存（query.py 专用）
├── gen_catalog.py          # 索引生成器
├── DATA_CATALOG.md         # 自动生成的数据索引（纳入版本控制）
├── requirements.txt        # Python 依赖
├── converters/             # 各模块转换器
│   ├── characters.py
│   ├── character_detail.py
│   ├── character_ranks.py
│   ├── character_skills.py
│   ├── light_cones.py
│   ├── light_cone_detail.py
│   ├── relics.py
│   ├── relic_affixes.py
│   ├── monsters.py
│   ├── endgame.py
│   ├── items.py
│   ├── paths.py
│   ├── elements.py
│   ├── properties.py
│   ├── currency.py
│   └── season.py
└── tests/                  # pytest 单元测试
    └── test_utils.py
```
