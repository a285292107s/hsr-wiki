# ADR-0006: 数据格式与映射策略

## 状态

部分过时（被实现演进取代）

> 本 ADR 的"StarRailRes 扁平索引格式"及"源数据通过本地解压引入（后续可改 submodule）"已过时：实际以 git submodule 引入源数据（见 ADR-0005），输出结构已演进为多模块、含 detail 子目录（`characters/`、`light_cones/`、`currency/`）并新增 monsters/maze/endgame（`maze*.json`）等数据；TextMap 解析、图片路径映射、枚举规范等策略性内容仍有效。
>
> **2026-08 更新**：`character_ranks.json` / `character_skills.json` 已废弃删除——第二期 `character_detail` 在 `characters/{id}.json` 内自建了质量更高的星魂/技能数据（全等级参数、正确过滤、保留富文本标签），前端全面改用详情数据，两索引无消费方（见 docs/角色转换模块字段分析.md 存疑 1/2）。

## 背景

ADR-0005 确定了转换工具的基础架构。本 ADR 锁定数据格式与字段映射的具体决策，是转换工具实现的直接依据。

源数据位于 `vendor/TurnBasedGameData/`（通过本地解压引入，后续可改为 git submodule）。已确认所有核心源文件存在：
- 角色：`AvatarConfig.json`、`AvatarSkillConfig.json`、`AvatarRankConfig.json`、`AvatarSkillTreeConfig.json`、`AvatarPromotionConfig.json`
- 光锥：`EquipmentConfig.json`、`EquipmentSkillConfig.json`、`EquipmentPromotionConfig.json`
- 遗器：`RelicConfig.json`、`RelicSetConfig.json`、`RelicSetSkillConfig.json`、`RelicMainAffixConfig.json`、`RelicSubAffixConfig.json`
- 通用：`ItemConfig.json`、`AvatarBaseType.json`、`DamageType.json`
- 文本：`TextMap/TextMapCHS.json`（key 为字符串形式的哈希值）

## 决策

### 1. 输出格式：StarRailRes 索引格式

输出到 `public/data/cn/`，扁平索引结构：

```
public/data/cn/
├── characters.json           # 角色基础索引
├── character_ranks.json      # 星魂
├── character_skills.json     # 技能
├── character_skill_trees.json
├── character_promotions.json
├── light_cones.json          # 光锥基础索引
├── light_cone_promotions.json
├── light_cone_ranks.json
├── relics.json               # 遗器套装索引
├── relic_main_affixes.json
├── relic_sub_affixes.json
├── paths.json                # 命途
├── elements.json             # 属性
├── items.json                # 物品
└── properties.json           # 属性类型映射表
```

前端 `src/services/api.ts` 和 `types.ts` 将在第二期重写以适配此格式。

### 2. TextMap 解析方案

- 安装 `pip install xxhash`
- TextMap key 为字符串形式的哈希值（如 `"6186714091647966180"`）
- 两种引用方式统一处理：
  - `{ "Hash": 6186714091647966180 }` → 转字符串 → 查 TextMap
  - `"AvatarRankName_100101"` → 直接作为 key 查 TextMap
- 函数 `resolve_text(ref, text_map)`：自动识别 Hash 对象 vs 字面量
- 未命中返回空字符串 + warning log，不阻断转换

### 3. 第一期输出范围

第一期聚焦"索引级"数据，验证链路：

| 输出文件 | 第一期 | 说明 |
|---------|:------:|------|
| `characters.json` | ✅ | 基础信息：id, name, rarity, path, element, sp_need, icon |
| `character_ranks.json` | ⚠️ 半 | 只含 name/desc/icon，不含参数展开 |
| `character_skills.json` | ⚠️ 半 | 只含 name/type/desc，不含等级数值表 |
| `character_skill_trees.json` | ❌ | 跳过 |
| `character_promotions.json` | ❌ | 跳过 |
| `light_cones.json` | ✅ | 基础信息 + 技能名/描述 |
| `light_cone_promotions.json` | ❌ | 跳过 |
| `relics.json`（套装） | ✅ | 套装名、图标、2件/4件效果、含部位列表 |
| `relic_main_affixes.json` | ✅ | 主词条数据 |
| `relic_sub_affixes.json` | ✅ | 副词条数据 |
| `paths.json` | ✅ | 命途 |
| `elements.json` | ✅ | 属性 |
| `items.json` | ✅ | 物品索引 |
| `properties.json` | ✅ | 属性类型映射表（自建） |

### 4. 图片路径映射

转换工具内置路径映射表，输出相对路径：

```python
ICON_PATH_MAP = {
    "SpriteOutput/AvatarIcon/Avatar/": "icon/character/",
    "SpriteOutput/LightConeMediumIcon/": "icon/light_cone/",
    "SpriteOutput/ItemIcon/": "icon/item/",
    # ...
}
```

- 输出 JSON 中 icon 字段为相对路径
- 前端拼接 `https://static.nanoka.cc/assets/hsr/` + 相对路径
- 无法映射的路径记 warning，保留原路径

### 5. 枚举值规范

key 用英文标识，name 用中文：

```json
{
  "id": "Knight",
  "name": "存护",
  "icon": "icon/path/knight.png"
}
```

## 后果

- 前端需在第二期重构数据层（api.ts + types.ts）
- 第一期不产出角色详情数值（promotions/skill_trees），第二期补充
- 图片路径依赖映射表的完整性，需在实现时对照 nanoka CDN 实际路径校验
