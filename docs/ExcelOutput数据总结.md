# `vendor/TurnBasedGameData/ExcelOutput` 数据详细分析

> 分析对象：`vendor/TurnBasedGameData/ExcelOutput/`
> 数据来源：StarRailData（《崩坏：星穹铁道》发行数据解包）的策划配表导出目录
> 文件数量：**2,140 个 JSON 文件**（全部为玩法配置表，扁平记录结构）

---

## 一、总体特征

`ExcelOutput` 是整套数据中**最结构化、最易被 wiki 直接消费**的一层。与 `Config/`（引擎底层配置）不同，这里的每个文件对应游戏策划在 Excel 中维护的一张「配表」，导出为 JSON。

主要特征：
- **扁平记录数组**：绝大多数文件是「记录数组」`[ {字段...}, {字段...} ]`，少数以 ID 为键的对象。
- **英文驼峰命名 + 中文语义**：文件名即表名（如 `AvatarConfig`、`MonsterConfig`、`RelicSetConfig`），字段名亦为英文。
- **文本用 hash 引用**：所有可见文字（名称、描述）存为 `{"Hash": <xxhash数字>}` 或 `{"Hash": ...}`，需到 `TextMap/` 反查为实际文案。
- **图片走资源路径**：图标/立绘以相对路径引用，如 `SpriteOutput/ItemIcon/900001.png`、`SpriteOutput/LightConeMaxFigures/20000.png`，资源本体不在此目录。
- **存在 `LD` 后缀变体**：大量表有 `*LD` 版本（如 `AvatarConfigLD`、`StageConfigLD`），通常为「低配/精简」或本地化派生表，与主表字段相近。

> 注意：个别表体量极大，`StageConfig.json` 约 **24 MB**（单文件超 20 MB 读取上限），`ItemConfig` 等也较大，解析时应按需流式读取，避免整体载入。

---

## 二、分域详细分类（2,140 个文件）

下面按游戏功能域归类。`活动 / 限时玩法` 占比最大（约 40%+），其次为「模拟宇宙 / 肉鸽」与「核心养成」。

### 1. 角色养成（Avatar / 角色）——约 80 个文件
角色相关的全部配置，是角色 wiki 页的**主干数据源**。
- 主表：`AvatarConfig`、`AvatarConfigTrial`、`AvatarConfigEnhanced`、`AvatarTestConfig`
- 突破 / 行迹：`AvatarPromotionConfig`、`AvatarRankConfig`、`AvatarSkillTreeConfig`、`AvatarLevelSkillConfig`、`AvatarSpecialSkillTree`
- 技能：`AvatarSkillConfig`、`AvatarSkillLink`、`AvatarUltraSkillConfig`、`AvatarEnhancedSkill`、`AvatarServantSkillConfig`（随从）
- 属性 / 数值：`AvatarPropertyConfig`、`AvatarPropertyOverride`、`AvatarBreakDamage`、`AvatarStatusConfig`、`AvatarBaseType`、`AvatarCamp`
- 推荐 / 来源：`AvatarRelicRecommend`、`AvatarEquipRecommend`、`AvatarSourceConfig`、`AvatarComefrom`
- 外观 / 语音：`AvatarSkin`、`AvatarSkinSpecialAction`、`AvatarVO`、`AvatarPlayerIcon`、`AvatarAtlas`
- 关联表：`AvatarExpItemConfig`（经验书）、`UpgradeAvatar*`（养成消耗）

### 2. 光锥（LightCone / 武器）——约 10+ 文件
- `EquipmentConfig`（光锥主表）、`EquipmentPromotionConfig`（突破）、`EquipmentSkillConfig`（技能）、`EquipmentExpType`、`EquipmentExpItemConfig`、`EquipmentAtlas`

### 3. 遗器（Relic / 圣遗物）——约 15 个文件
- `RelicConfig`（遗器主表）、`RelicSetConfig`（套装）、`RelicSetSkillConfig`、`RelicBaseType`
- 词条：`RelicMainAffixConfig`、`RelicSubAffixConfig`、`RelicMainAffixBaseValue`、`RelicMainAffixAvatarValue`、`RelicSubAffixBaseValue`、`RelicSubAffixAvatarValue`
- 养成：`RelicComposeConfig`、`RelicExpItem`、`RelicExpType`、`RelicSetBonusValue`

### 4. 物品 / 材料 / 经济（Item）——约 40 个文件
- 主表：`ItemConfig`（全部物品，含虚拟货币/材料/道具）、`ItemConfigBook`、`ItemConfigDisk`、`ItemConfigRelic`、`ItemConfigEquipment`、`ItemConfigAvatar*`
- 合成 / 用途：`ItemComposeConfig`、`ItemComposeTag`、`ItemComposeType`、`ItemPurpose`、`ItemRecycle`、`ItemUseData`、`ItemUseCondition`、`ItemUseBuffData`、`ItemConsumeType`
- 来源 / 排序：`ItemComefrom`、`ItemComefromLimit`、`ItemGotoData`、`ItemDisplaySort`、`ItemRarityConfig`、`ItemHintGroup`
- 体力 / 货币：`StaminaItemList`、`StaminaSaleConfig`、`CurrencyDisplayConfig`、`RewardData`、`RewardDataLD`

### 5. 敌人 / 怪物（Monster）——约 25 个文件
- 主表：`MonsterConfig`、`MonsterTemplateConfig`、`MonsterUniqueConfig`、`MonsterTestConfig`
- 技能 / 状态：`MonsterSkillConfig`、`MonsterSkillUniqueConfig`、`MonsterStatusConfig`、`MonsterStatusResistanceType`、`MonsterTextGuide`
- 掉落：`MonsterDrop`、`MonsterDropUnique`、`MonsterDropTest`、`MonsterRandomPool`
- 图鉴 / 指引：`MonsterAtlasExtraPhase`、`MonsterGuideConfig`、`MonsterGuideSkill`、`MonsterGuideTag`、`MonsterCamp`、`EliteGroup`、`InfiniteEliteGroup`、`HardLevelGroup`

### 6. 关卡 / 战斗 / 副本（Stage / Battle / Maze / Challenge / Raid）
- 关卡：`StageConfig`（主表，24MB）、`StageConfigLD`、`StageTestConfig`、`StageInfiniteGroup`、`StageInfiniteMonsterGroup`、`StageInfiniteWaveConfig`、`StageBattleEventConfig`
- 迷宫 / 大世界：`MazePlane`、`MazeFloor`、`MazeProp`、`MazeBuff`、`MazeChest`、`MazeSkill`、`MazeCampData`、`MazePuzzle*`（多类解谜配置）
- 战斗系统：`BattlePass*`（纪行）、`BattleAchievement`、`BattleCollege*`（战斗教学）、`BattleConditionConfig`、`BattleEventConfig`、`BattleTargetConfig`、`BattleArea`、`BattleBGM`、`BattleActionEventConfig`
- 挑战：`ChallengeBoss*`、`ChallengeMaze*`、`ChallengeStory*`、`ChallengePeak*`、`ChallengeGeneralConfig`、`ChallengeGroupConfig`
- 副本 raid：`RaidConfig`、`RaidTargetConfig`、`RaidTypeConfig`、`RaidLimitCondition`、`RaidNPCMonsterOverride`

### 7. 任务 / 成就 / 剧情线（Mission / Achievement / Quest）——约 50 个文件
- 主线 / 支线：`MainMission`、`MainMissionPack`、`SubMission`、`QuestData`、`MissionChapterConfig`、`MissionSubType`、`MissionGotoConfig`、`MissionStoryEvent`
- 循环 / 限时：`CycleQuest`、`LinearQuest`、`DailyMissionData`、`DailyQuest`、`EventMission`、`OptionalRewardQuest`、`CycleScoreReward`
- 成就：`AchievementData`、`AchievementSeries`、`AchievementLevel`、`BattleAchievement`、`PlanetFesAchievement`、`TeamTowersAchievement`
- 剧情资产（与 `Story/` 配合）：`StoryLine`、`StoryCharacter`、`StoryProp`、`StoryAtlas`、`Performance*`（过场）、`CutSceneConfig`、`TalkSentenceConfig`、`TextJoin*`

### 8. 模拟宇宙 / 肉鸽（Rogue / AetherDivide）——约 240 个文件
占比极高的玩法体系，几乎每个子系统都有独立前缀簇：
- 通用：`RogueBuff`、`RogueMiracle`、`RogueAreaConfig`、`RogueMonster`、`RogueShop`、`RogueTalent`、`RogueRoom`、`RogueMap`、`RogueScoreReward`、`RogueHandBook*`
- 分支玩法：`RogueNous*`（寰宇蝗灾/智识）、`RogueDLC*`（黄金与机械/存护）、`RogueMagic*`（奇境/记忆）、`RogueTourn*`（差分宇宙/纷争）、`RoguePersona*`（溢价/欢愉）、`RogueEndless*`、`RogueAeon*`
- 虚构宇宙：`AetherDivideSpirit`、`AetherDividePassiveSkill`、`AetherDivideMonster`、`AetherDivideTrainerLevel`、`AetherDivideChallenge*`

### 9. 活动 / 限时玩法（Activities / Events）——约 900+ 文件（占比最大）
每个版本活动都有成簇的专属配置表，是文件数最多的域。典型集群：
- 通用活动框架：`ActivityConfig`、`ActivityPanel`、`ActivityReward`、`ActivityTheme`、`ActivityTag`、`ActivityBenefitV2*`、`ActivityQuestReward*`
- 具体活动（仅列举代表性前缀）：`ActivityDice*`（骰子）、`ActivityExpedition*`（派遣）、`ActivityFeverTime*`、`ActivityFight*`、`ActivityHipplen*`、`ActivityRelicBox*`、`ActivityRaidCollection*`、`ActivityTelevision*`、`ActivityLocalLegend*`
- 版本大型活动集群：`Alley*`（长巷逸事）、`Museum*`（博物馆）、`BoxingClub*`（拳馆）、`Cake*`（甜品）、`DrinkMaker*`（调饮）、`Heliobus*`（螺旋）、`Chimera*`（奇美拉）、`ChenLing*`（辰灵）、`Fate*` / `FateRin*`（Fate 联动）、`FightFest*`（搏击）、`GridFight*`（网格战斗/差分宇宙编辑器）、`HeartDial*`（心电仪）、`IdleLive*`（直播）、`LimaoNews*`（新闻）、`Marble*`（弹珠）、`MatchThree*`（三消）、`Monopoly*`（大富翁）、`MusicRhythm*`（音游）、`Parkour*`（跑酷）、`PlanetFes*`（行星节）、`PixAir*`（像素飞行）、`Restaurant*`（餐厅）、`SilverWolf*`（银狼）、`SpaceZoo*`（太空动物园）、`SwordTraining*`（剑道）、`Tarot*`（塔罗）、`TeamTowers*`（叠塔）、`TrainParty*`（列车派对）、`TravelBrochure*`（旅行手册）、`TreasureDungeon*`（寻宝地牢）、`EvolveBuild*`（进化建造）、`Anniv*`（周年庆）

### 10. 社交 / 通讯 / 文本（Social / Phone / Chat / Text）——约 80 个文件
- 手机系统：`PhoneCaseConfig`、`PhoneThemeConfig`
- 短信 / 消息：`MessageContactsConfig`、`MessageGroupConfig`、`MessageItemConfig`、`MessageSectionConfig`、`MessageStateIcon`
- 对话泡泡：`ChatBubbleConfig`、`ChatInviteConfig`、`EmojiConfig`、`EmojiGroup`
- 文本拼接：`TextJoinConfig`、`TextJoinItem`、`TextJoinConditionalItem`、`TextSpriteConfig`
- 对话 / 台词：`DialogueNPC`、`DialogueProp`、`DialogueCondition`、`DialogueIcon`、`TalkSentenceConfig`、`TalkReward`、`TalkBehavior`

### 11. 地图 / 导航 / 世界（Maps / Navigation / World）——约 60 个文件
- 地图入口：`MapEntrance`、`MapEntranceGroup`、`MapEntranceUnlock`、`MapProgressConfig`、`MapShortCutConfig`、`MapGuide`、`MapSpaceTypeConfig`
- 区域图：`AreaMapConfig`、`AreaMapShowConfig`、`AreaMapMenuIcon`、`MiniMapIcon`
- 导航 UI：`NavMapTab`、`NavMapSubTab`、`SubMapConfig`、`SubNavMap`、`SubNavMapName`
- 世界 / 解锁：`WorldDataConfig`、`WorldLevelConfig`、`WorldUnlockConfig`、`WorldLevelStageUnlockConfig`、`MazePlane`、`TeleportConfig`、`MappingInfo*`、`SpecialMappingInfo`

### 12. 商店 / 卡池 / 充值（Shop / Gacha / Recharge）——约 60 个文件
- 商店：`ShopConfig`、`ShopGoodsConfig`、`ShopGroup`、`ShopItemGroupConfig`、`ShopGiftConfig`、`CityShopConfig`、`BelobogShopUIConfig`、`RollShopConfig`、`RogueShop`、`MonopolyShopConfig`、`RestaurantShopItemConfig`、`PixAirShopConfig`、`GridFightLotteryShop`
- 卡池：`GachaBasicInfo`、`GachaGroupData`、`GachaPoolReward`、`GachaCeiling`、`GachaNews`、`GachaTypeBasicInfo`、`GachaShowToastData`
- 充值 / 礼包：`RechargeConfig`、`RechargeBenefitConfig`、`RechargeBenefitData`、`RechargeGiftConfig`、`RechargeGiftData`

### 13. 图鉴 / 收集（Atlas / Codex）——约 30 个文件
- `AvatarAtlas`、`EquipmentAtlas`、`MonsterAtlasExtraPhase(s)`、`NounAtlas`、`StoryAtlas`、`TitanAtlas`、`MultiplePathAvatarAtlas`、`AtlasConfig`、`AtlasUnlockData`、`AtlasUnlockTextmap`、`PhotoGraphAvatarConfig`、`StoryAtlasTextmap`

### 14. 系统 / UI / 设置 / 引导（System / UI / Settings / Tutorial）——约 120 个文件
- 引导：`TutorialData`、`TutorialGuideData`、`TutorialGuideGroup`、`TutorialSubGuide*`
- 功能解锁：`Function`、`FuncEntrance`、`FuncEntranceList`、`FuncUnlockData`、`FuncUnlockHint`、`FunctionHud`、`GameModeFuncEntrance`
- 设置：`SettingDisplayMode`、`SettingImageQuality`、`AllowedLanguage`、`AllowedTextLanguage`、`SystemDefaultLanguage`、`InControl*`（键位）
- 加载 / 音乐：`Loading*`（LoadingDesc/Image/WorldImage）、`BackGroundMusic*`、`BattleBGM`、`SFXConfig`、`UIPageBGM`
- UI：`UIRedDot`、`GotoConfig`、`GotoTips`、`ToastManager`、`HudUIInfoTemplate`、`InventoryTabData`

### 15. 演出 / 过场 / 镜头（Performance / Cutscene / Video）——约 80 个文件
- 演出：`PerformanceA/C/D/E`、`PerformanceCG`、`PerformanceVideo`、`PerformanceSkip*`、`PerformanceSubMissionLink`、`PerformanceRecallData`
- 过场：`CutSceneConfig`、`CutsceneActor`、`CutsceneProp`、`FirstPerformance`、`LoopCGConfig`、`RaidPerformance`
- 视频：`VideoConfig`、`VideoConfigLD`、`VideoEncryptionConfig`、`GuideVideoConfig`、`ResourceDeletionVPList`

### 16. 其他杂项 / 工具 / 常量
- 全局常量：`ConstValueClient`、`ConstValueCommon`、`ConstValueChallenge*`、`ConstValueFantastic*`、`ConstValueRogue`
- GM / 调试：`GMAccountConfig`、`GMAccountItemConfig`、`GMAccountEquipmentConfig`、`GMAccountRelicConfig`、`GMAccountAvatar`(隐)
- 错误 / 校验：`RetCodeError`、`ServerInteractVerification`、`ClientLogConfig`
- 资源总控：`ResourceOverallConfig`、`ResourceDeletionUsmList`、`ResourceDeletionVPList`
- 新体系（版本演进）：`Servant*`（随从/召唤物）、`SpecialAvatar*`（特殊角色）、`FateRin*`（联动）、`PsActivity` / `PSTrophy`（PS 成就）等

---

## 三、核心表 Schema 速查（抽样）

下面给出 5 张最常用表的字段样例，供 wiki 取数参考。

### AvatarConfig（角色主表）
```json
[
  {
    "AvatarID": 1001,
    "AvatarName": { "Hash": 6186714091647966180 },
    "AvatarFullName": { "Hash": 9058972803650014395 },
    "AdventurePlayerID": 1001,
    "AvatarVOTag": "mar7th",
    "Rarity": "CombatPowerAvatarRarityType4",
    "JsonPath": "Config/ConfigCharacter/Avatar/Avatar_Mar_7th_00_Config.json",
    "DamageType": "Ice",
    "SPNeed": { "Value": 120 },
    "ExpGroup": 1,
    "MaxPromotion": 6,
    "MaxRank": 6,
    "RankIDList": [100101, 100102, 100103, 100104]
  }
]
```
> 关键字段：`AvatarID`、`DamageType`（属性）、`Rarity`（稀有度）、`JsonPath`（回链到 `Config/ConfigCharacter` 的详细配置）、`MaxPromotion` / `MaxRank`（养成上限）。文本字段为 hash。

### ItemConfig（物品主表）
```json
[
  {
    "ID": 1,
    "ItemMainType": "Virtual",
    "ItemSubType": "Virtual",
    "Rarity": "SuperRare",
    "PurposeType": 12,
    "ItemName": { "Hash": 7739077644877555281 },
    "ItemBGDesc": { "Hash": 4559313086410327619 },
    "ItemIconPath": "SpriteOutput/ItemIcon/900001.png",
    "PileLimit": 999999999
  }
]
```

### MonsterConfig（敌人主表）
```json
[
  {
    "MonsterName": { "Hash": 329737901974927635 },
    "MonsterIntroduction": { "Hash": 9842692892110851210 },
    "MonsterID": 1002011,
    "MonsterTemplateID": 1002011,
    "EliteGroup": 1,
    "HardLevelGroup": 1,
    "HPModifyRatio": { "Value": 1 }
  }
]
```

### RelicSetConfig（遗器套装）
```json
[
  {
    "SetID": 101,
    "SetSkillList": [2, 4],
    "SetIconPath": "SpriteOutput/ItemIcon/71000.png",
    "SetName": { "Hash": 17317659818484992751 },
    "DisplayItemID": 81014,
    "ReleaseVersion": "1.0"
  }
]
```

### EquipmentConfig（光锥主表）
```json
[
  {
    "EquipmentID": 20000,
    "EquipmentName": { "Hash": 1315631816518421847 },
    "Rarity": "CombatPowerLightconeRarity3",
    "AvatarBaseType": "Rogue",
    "MaxPromotion": 6,
    "MaxRank": 5,
    "SkillID": 20000,
    "ThumbnailPath": "SpriteOutput/LightConeMediumIcon/20000.png"
  }
]
```

---

## 四、对 wiki 重构的取数优先级建议

| 优先级 | 表（前缀） | 用途 |
| --- | --- | --- |
| ★★★★★ | `AvatarConfig` / `AvatarPromotionConfig` / `AvatarRankConfig` / `AvatarSkillTreeConfig` | 角色页：属性、突破、星魂、行迹 |
| ★★★★★ | `EquipmentConfig` / `EquipmentPromotionConfig` / `EquipmentSkillConfig` | 光锥页 |
| ★★★★★ | `RelicConfig` / `RelicSetConfig` / `RelicSubAffixConfig` | 遗器页与词条 |
| ★★★★★ | `ItemConfig` / `ItemComposeConfig` | 物品 / 材料页 |
| ★★★★ | `MonsterConfig` / `MonsterDrop` / `MonsterSkillConfig` | 敌人页与掉率 |
| ★★★★ | `StageConfig` / `MazePlane` / `MazeFloor` | 关卡 / 地图页（注意 24MB 大文件） |
| ★★★★ | `MainMission` / `SubMission` / `AchievementData` | 任务 / 成就页 |
| ★★★ | `Rogue*` / `AetherDivide*` | 模拟宇宙专题 |
| ★★★ | `Shop*` / `Gacha*` | 卡池 / 商店页 |
| ★★ | `Activity*` 及各大活动集群 | 版本活动页（按需） |
| ★★ | `TextJoin*` / `Dialogue*` / `Performance*` | 剧情 / 台词还原（需配合 `TextMap`） |

**通用取数流程**：读 `ExcelOutput/<表>` → 用 `JsonPath` / ID 关联 `Config/` 的底层配置 → 用 `Hash` 关联 `TextMap/<语言>` 还原中文文案 → 用 `SpriteOutput/...` 路径关联图片资源（资源本体不在此仓库，需另行对接 CDN/资源库）。

---

## 五、一句话结论

`ExcelOutput` 是 2,140 张「策划配表」的扁平 JSON 汇总，覆盖角色、光锥、遗器、物品、敌人、关卡、任务、成就、模拟宇宙、活动、商店、地图、系统等全部玩法维度；其中 **活动/限时玩法表占比最大，核心养成表（Avatar/LightCone/Relic/Item/Monster/Stage/Mission）是 wiki 内容生产最直接、最高优先级的数据源**。所有文本与图片均以外链（hash / 资源路径）形式存在，需配合 `TextMap` 与资源库还原。
