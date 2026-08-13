# 数据转换管线与本地数据探索

> AGENTS.md 的按主题子文件（主文件经 `@docs/agents/data-pipeline.md` 引用）。存放数据侧低频技能资料：转换管线、本地数据探索、Converter 模块映射。常用命令见主文件「常用命令」节。

## 数据转换管线（Python）

`tools/converter/` 将 `vendor/TurnBasedGameData/`（本地数据目录，非 git 子模块：ExcelOutput + TextMap；克隆方式见 `.gitignore` 注释）转换为 `public/data/cn/` 下的 JSON。上游数据无手动流程：`data-sync.yml` 每日 04:00 UTC 自动浅克隆上游 → 转换 → 死链审计 → 直达 main（全局版本号取自数据子库 git HEAD 提交标题，见 version 模块）。

- 入口：`convert.py` → 模块注册表驱动，支持 `--only` / `--force` / `--pretty` CLI 参数
- 增量转换：`incremental.py` 基于源文件 mtime+size 签名，未变更模块自动跳过（状态存于 `.converter-state.json`，已 gitignore）；依赖声明由 `tests/test_incremental.py` AST 校验锁住，防止声明与实际读取漂移
- 文本解析：`textmap.py` 加载 `TextMapCHS.json`，同时处理 `{ "Hash": N }` 对象引用和字面量字符串键
- TextMap 查询缓存：`textmap_db.py` 将 TextMap 预建为 SQLite 索引（`.textmap-cache.db`，已 gitignore），`query.py --resolve/--search` 走缓存（<1ms），基于 mtime_ns:size 签名自动失效重建
- 数值扁平化：源数据将所有数值包装为 `{ "Value": N }`，转换器递归展开
- 配置：`config.py` 存放路径映射、枚举回退表、图标路径重映射表
- 输出格式：默认紧凑 JSON（无缩进），`--pretty` 切换为缩进模式（调试用）
- 转换摘要：每次运行结束输出各模块耗时统计
- 输出确定性：上游解包数据更新后重跑即可，前端无需改动

## 本地数据探索（AI 专用）

`vendor/TurnBasedGameData` 本地数据目录含 2140+ 个 JSON 文件（~250 MB）+ TextMap（~830 MB），**禁止直接读取原始文件**。使用以下工具：

- **`DATA_CATALOG.md`**：自动生成的轻量索引，含每个文件的 schema、记录数、首条样例。查结构先读此文件。
- **`query.py`**：精确查询 CLI，支持 `--id` / `--where` / `--fields` / `--grep` / `--schema` / `--resolve` / `--search` / `--rebuild-textmap`。TextMap 查询（`--resolve` / `--search`）走本地 SQLite 缓存（`textmap_db.py`），首次自动建库，后续 <1ms 响应。
- **`gen_catalog.py`**：本地数据更新后重跑 `python gen_catalog.py` 刷新索引。

## Converter 模块 → 源文件映射

| 模块 | 读取的 ExcelOutput 源文件 |
|------|---------------------------|
| characters | AvatarConfig, AvatarConfigLD |
| character_detail | AvatarConfig(LD), AvatarSkillConfig(LD), AvatarRankConfig(LD), AvatarSkillTreeConfig(LD), AvatarPromotionConfig(LD) |
| light_cones | EquipmentConfig, EquipmentSkillConfig |
| light_cone_detail | EquipmentConfig, EquipmentSkillConfig, EquipmentPromotionConfig, ItemConfigEquipment |
| relics | RelicSetConfig, RelicConfig, RelicSetSkillConfig, RelicDataInfo |
| relic_affixes | RelicMainAffixConfig, RelicSubAffixConfig |
| monsters | MonsterTemplateConfig |
| monster_detail | MonsterTemplateConfig, MonsterConfig, MonsterCamp, MonsterSkillConfig |
| endgame | ChallengeMazeConfig, ChallengeStoryMazeConfig, ChallengeBossMazeConfig, ChallengePeakConfig |
| items | ItemConfig |
| paths | AvatarBaseType |
| elements | DamageType |
| properties | （自建映射，无源文件） |
| currency | AvatarConfigLD（本地数据） |
| currency_catalog | GridFightItems, GridFightEquipment, GridFightEquipCategoryInfo, GridFightEquipTag, GridFightEquipRecommendRole, GridFightPortalBuff, GridFightAugment, GridFightTraitBasicInfo, GridFightTraitLayer, GridFightTraitMazebuff |
| season | （本地数据） |
| achievements | AchievementData, AchievementSeries, TextJoinConfig, TextJoinItem |
| version | （无 ExcelOutput 源文件；读数据子库 git HEAD 提交标题 → version.json） |

> 除 version 外，所有模块均依赖 `TextMapCHS.json` 解析 Hash 文本引用。