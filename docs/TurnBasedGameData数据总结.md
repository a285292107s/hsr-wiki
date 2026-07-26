# `vendor/TurnBasedGameData` 数据总结报告

> 分析对象：`vendor/TurnBasedGameData/`
> 数据来源：开源项目 **StarRailData**（由 Dimbreath 维护），即《崩坏：星穹铁道》（Honkai: Star Rail）的官方发行数据（release data）解包。
> 数据规模：约 **124,060 个 JSON 文件** + 1 个 `README.md`，全部为游戏内配置与资源描述数据（无二进制资源本体）。

---

## 一、顶层结构总览

| 目录 / 文件 | 文件数量 | 说明 |
| --- | --- | --- |
| `Config/` | 113,707 | 游戏运行时配置与关卡数据（体量最大，占总量 ~92%） |
| `ExcelOutput/` | 2,140 | 策划“Excel”配表，结构化玩法数据（角色、光锥、遗器、任务、成就等） |
| `Stages/` | 2,826 | 战斗 / 副本关卡的**场景物件布局**数据（按章节组织） |
| `Story/` | 5,358 | 剧情表现脚本（任务过场、对话讨论、战斗演出） |
| `TextMap/` | 29 | 多语言文本表，以 **xxhash** 数字 ID 为键 |
| `README.md` | 1 | 仓库说明（标注数据来源、TextMap 使用 xxhash，以及致谢信息） |

**统一格式约定（贯穿所有子目录）：**
- 全部为 JSON，部分文件体积很大（`TextMapCHS.json` 约 53 MB，单文件超过 20 MB）。
- 剧情 / 能力类文件使用 `$type` 字段做类型标记（如 `"RPG.GameCore.TriggerAbility"`），是 Unity `GameCore` 命名空间下的游戏逻辑图（Gameplay Ability / Sequence）。
- 文本一律不直接写中文，而是引用 `TextMap` 中的 hash ID，需二次查表还原文案。
- 关卡、实体、道具等多用纯数字 ID 命名文件。

---

## 二、各文件夹详细内容

### 1. `Config/` —— 游戏配置与关卡数据（113,707 个文件）

这是体量最大的目录，混合了两类内容：**根目录的零散配置表** + **按类型划分的子目录**。

#### 1.1 根目录的零散 `Config*.json` 文件（数千个）
这些是按游戏内“配置类”逐个导出的系统配置表，文件名即配置类名。涵盖几乎所有游戏系统，例如：
`ConfigAvatar`（角色基础配置）、`ConfigAvatarActor`、`ConfigLightCone`、`ConfigRelic`、`ConfigItem`、`ConfigEquip`、`ConfigMonster`、`ConfigNPC`、`ConfigSkill`、`ConfigStage`、`ConfigMaze`、`ConfigRogue`、`ConfigShop`、`ConfigGacha`、`ConfigReward`、`ConfigAchievement`、`ConfigChat`、`ConfigPhone`、`ConfigTutorial`、`ConfigTitle` 等。

> 注意：部分文件名在更早版本中存在，当前快照里已拆分为下方子目录（如 `ConfigAvatar` 对应 `Config/ConfigAvatar/`）。根目录仅保留尚未归类或仍为单表的配置项。

#### 1.2 主要子目录（按文件量排序）

| 子目录 | 文件数 | 内容说明 |
| --- | --- | --- |
| `Level/` | 60,443 | **单个关卡的配置与场景数据**，按关卡 ID 组织（含 `Mission/`、`Maze/` 等细分）。最大子目录，是地图/副本的底层定义。 |
| `LevelOutput/` | 30,824 | 关卡数据的**导出/编译产物**，结构与 `Level/` 对应，为工具链消费用的二次输出。 |
| `ConfigEntity/` | 3,187 | **实体定义**（Entity）：怪物、NPC、可交互物件在战斗/大世界中的实体参数。 |
| `ConfigAbility/` | 2,555 | **能力/技能逻辑定义**（Ability）：技能、普攻、天赋、秘技的行为图。如 `Avatar_Arlan_00_Ability.json` 内以 `AbilityList` + `OnStart` 任务列表描述施法流程（触发镜头、动画、伤害结算等）。 |
| `ConfigNPC/` | 908 | NPC 的配置（外观、对话绑定、阵营等）。 |
| `ConfigProp/` | 1,158 | 场景道具（Prop）定义。 |
| `Activity/` | 1,239 | 活动（Activity）相关配置表。 |
| `LevelMapping/` | 1,008 | 关卡 ID 到地图/区域 / 资源路径的映射关系。 |
| `ConfigAI/` | 1,011 | 怪物 / 单位的 **AI 行为树 / 决策配置**。 |
| `ConfigAvatar/` | 987 | 玩家 / 角色 Avatar 的动画、模型、技能绑定等配置（含 `Avatar/`、`NPC/` 等细分）。 |
| `ConfigAnimEvents/` | 442 | 动画事件（AnimEvent）配置，绑定动画帧触发的逻辑。 |
| `ConfigSkill/` | 387 | 技能（Skill）配置表。 |
| `ConfigCharacter/` | 187 | 角色（Character）基础属性与成长配置。 |
| `ConfigSummon/` | 117 | 召唤物（Summon）配置。 |
| `BattleLineupPage/` | 111 | 战斗编队 / 预设阵容页面配置。 |
| `AssetPreload/` | 64 | 资源预加载（Preload）清单。 |
| `BattleCollegeCaption/` | 9 | 战斗教学（Battle College）字幕 / 提示文本配置。 |
| `MappingInfo/`、`MazePlot/`、`PropRevert/`、`TextJoin/` | 各 1–3 | 小型映射 / 剧情点位 / 道具还原 / 文本拼接配置，数量极少。 |

此外还存在一批 **空目录**（当前快照未导出内容），例如：`BattleMode`、`CameraTemplate`、`ConfigAIFunc`、`ConfigBattleAction`、`ConfigBattleExt`、`ConfigChatBubbleText`、`ConfigDropDialog`、`ConfigInteract`、`ConfigMap`、`ConfigMonster`、`ConfigNPCShop`、`ConfigNPCSpawn`、`ConfigObstacle`、`ConfigObstacleConfig`、`ConfigPropAnimator`、`ConfigRewardGroup`、`ConfigShop`、`ConfigSkillSkill`、`ConfigTutorial`、`ConfigUAV`、`DialoguePerformance`、`HeroData`。这些多为历史/预留目录或尚未填充数据的类。

---

### 2. `ExcelOutput/` —— 策划配表（2,140 个文件）

这是**结构化、最易于直接使用**的玩法数据层，对应游戏策划填的 Excel 表，导出为 JSON。每个文件通常是一个「以 ID 为键 / 或记录数组」的对象，字段直观。

典型内容类别（从命名即可识别）：
- **角色 / 养成**：`AvatarConfig`、`AvatarSkillTreeConfig`、`AvatarPromotionConfig`、`LightCone*`、`Relic*`、`Equipment*`。
- **物品 / 经济**：`ItemConfig`、`Shop*`、`Gacha*`、`Reward*`。
- **任务 / 成就**：`Mission*`、`AchievementData`、`Adventure*`。
- **战斗 / 敌人**：`Monster*`、`Stage*`、`Maze*`、`Rogue*`（模拟宇宙）。
- **活动 / 玩法**：`Activity*`、`AetherDivide*`（虚构宇宙）、`Alley*`（长巷逸事）、`Arena*`。
- **文本 / 系统**：`TextJoin*`、`Phone*`、`Chat*`、`Tutorial*` 等。

> 示例（`AchievementData.json`）：以成就 ID 为键，含 `AchievementName`（TextMap hash）、`Desc`、`Goal`、`RewardID`、`Series`、`Category` 等字段——是 wiki 成就页最直接的数据源。

---

### 3. `Stages/` —— 关卡场景布局（2,826 个文件）

按章节组织的**战斗 / 副本场景物件布局**数据（场景几何，而非玩法逻辑）。

- `Stages/Outputs/<ChapterXX>/`：每个章节一个文件夹（如 `Chapter00/`），内含 `ChapterPolymer.json` 等文件。
- 内容（`Polymer` 字段）：记录该章节 / 关卡中每个场景物件（Prop）的 `Name`、`LayerName`、`AssetPath`、`Active`、以及 `PosX/Y/Z`、`ScaleX/Y/Z`、包围盒 `Bound` 等 3D 变换信息。
- 作用：描述“地图上摆了哪些模型、摆在哪里”，是关卡美术 / 碰撞布局的还原数据，对 wiki 的关卡地图可视化有用，但字段偏引擎底层。

---

### 4. `Story/` —— 剧情表现脚本（5,358 个文件）

游戏的**叙事 / 演出逻辑**数据，使用 Sequence 任务列表描述过场、对话、镜头。

| 子目录 | 文件数 | 内容说明 |
| --- | --- | --- |
| `Story/Mission/` | 4,578 | **主线 / 任务过场脚本**，按任务 ID 建子目录（如 `1000101/`），文件如 `Story100010101.json`。结构为 `OnInitSequece` / `OnStartSequece` → `TaskList`，任务类型含 `LevelPerformanceInitialize`（创建角色、加载 prefab）、`PlayTimeline`（播放时间轴）、`EndPerformance` 等。 |
| `Story/Discussion/` | 约 680 | **对话讨论脚本**（含 `Mission/` 等细分），结构同上，表现角色对话站位与镜头（如 `DS103010102.json` 描述三月七、姬子、丹恒、帕姆等角色在讨论中的摆放）。 |
| `Story/BattlePerformance/` | 55 | **战斗演出**脚本（Boss 战演出、特殊镜头等）。 |

> 说明：剧情中的实际文字不直接出现在此处，而是引用 `TextMap` 的 hash，需结合 `TextMap/` 才能还原台词。

---

### 5. `TextMap/` —— 多语言文本表（29 个文件）

游戏所有可见文字的**集中文本库**，以 **xxhash 数字 ID** 为键、本地化字符串为值。

文件清单（每种语言一个文件，外加 `Main` 主线子集）：
- 语言全量：`TextMapCHS.json`（简中，最大）、`TextMapCHT.json`（繁中）、`TextMapDE.json`（德）、`TextMapEN.json`（英）、`TextMapES.json`（西）、`TextMapFR.json`（法）、`TextMapID.json`（印尼）、`TextMapJP.json`（日）、`TextMapKR.json`（韩）、`TextMapPT.json`（葡）、`TextMapRU.json`（俄）、`TextMapTH.json`（泰）、`TextMapVI.json`（越）。
- 主线子集：`TextMapMainCHS.json`、`TextMapMainCHT.json`、`TextMapMainEN.json`、`TextMapMainJP.json`、`TextMapMainKR.json`（仅含主线剧情用到的文本，体积更小）。

> 使用方式：其余所有目录中的文本字段存的是 hash 数字，需用此处对应语言的文件反查为实际文案。TextMap 的键采用 **xxhash** 算法（仓库 `README.md` 已说明，并提供 JS / Python 实现链接）。

---

## 三、对 wiki 重构的使用建议

1. **角色 / 光锥 / 遗器 / 成就 / 任务等内容页**：优先消费 `ExcelOutput/`，结构清晰、字段语义明确，是 wiki 数据的主干来源。
2. **角色技能 / 敌人行为 / 动画**：结合 `Config/ConfigAbility/`、`Config/ConfigAI/`、`Config/ConfigAnimEvents/` 还原技能逻辑与表现。
3. **剧情台词 / 对话**：从 `Story/` 取脚本结构，再从 `TextMap/` 按语言反查台词文本（注意做 xxhash 还原）。
4. **关卡地图可视化**：用 `Stages/` + `Config/Level*` 还原场景布局与物件位置。
5. **性能注意**：`TextMap` 与部分 `Level` 文件体积庞大（数十 MB），构建 / 解析时应按需读取或做索引，避免一次性载入全部 12 万文件。

---

## 四、一句话结论

`vendor/TurnBasedGameData` 是《崩坏：星穹铁道》的完整游戏数据解包，覆盖了**配置（Config）、配表（ExcelOutput）、关卡场景（Stages）、剧情脚本（Story）、多语言文本（TextMap）** 五大维度；其中 `Config` 占比最高且最偏引擎底层，`ExcelOutput` 与 `TextMap` 则是 wiki 内容生产最易直接利用的两层。
