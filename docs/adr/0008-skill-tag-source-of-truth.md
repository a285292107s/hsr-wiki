# 技能标签以官方 SkillTag 为唯一数据源（取代枚举 + 前端映射）

**Status**: Accepted（2026-09 复核：转换器直出官方 `SkillTag`、前端无 TAG 映射，决策在线）

常规模式角色技能原本输出英文枚举 `SkillEffect`（如 `SingleAttack`），由前端 `TAG` 硬编码映射为中文标签（单攻/群攻/扩散…）。该映射缺 `Summon`（91 条源记录，召唤系技能标签空白），且 `Impair→削弱`、`Restore→恢复` 与官方文案（妨害、回复）漂移。同时货币战争模块（currency.py）早已直接输出官方中文 `SkillTag`。我们决定统一：**转换器直接输出官方 `SkillTag` 中文文本（如「单攻」「召唤」），前端直显，删除 TAG 映射**——既符合「文本数据必须来自现有数据源，禁止写死或自建数据源」原则，也消除映射漂移。

## Considered Options

- **保留枚举 + 补全前端映射（Summon→召唤，修正漂移文案）**：改动最小。放弃原因：映射表本质是自建数据源，新枚举（如 3.x 的 `Summon`）每次都要人工补表，文案仍可能漂移。
- **双字段输出（tag=枚举 + tag_name=官方文本）**：兼容 CDN 格式但字段冗余，且前端需维护两份来源的优先级逻辑。放弃原因：本站为本地优先数据，CDN 兼容无实际消费方。

## Consequences

- `character_detail.py` 的 `_build_skills` / `_build_servant_skills` 改从 `SkillTag`(Hash) 解析 tag，空值输出 `null`；需重跑转换（`--force`）。
- 前端删除 `TAG` 映射；韧性条标签（`show_stance_list` 枚举索引）独立为 `STANCE_TAG`，`fmtToughness` 行为不变。
- `SkillType` 类型放宽为含 `null`（数据本就有 null，类型此前失实）；索引处用 `?? ''` 安全回退。
- 顺带修复：`AttackType` 缺失的空串会让前端 `SKILL_ORDER.includes('')` 为 false 而隐藏技能（SkillP02「天赋 2」）——空值一律转 `null`，前端按独立成组显示。
- 槽位映射契约（未知 TriggerKey → AttackType 兜底 / None 透传）由 converter 契约测试锁定，禁止将 SkillP02 映射为 Passive（会嵌套进主天赋卡片）。
- 行迹属性节点的未映射图标路径为日志噪音（point_desc 全空不渲染，前端走 `PROP_ICON` 映射），不处理。
