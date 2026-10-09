# DATA_CATALOG 分片：文件名首字母 A

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 a（共 321 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### AvatarSkillConfig.json (10.33 MB, 7,040 条)

**字段** (36): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, HideInUI, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillComboValueDelta, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillNeed, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 100106,
  "SkillName": {
    "Hash": 7167396225780900216
  },
  "SkillTag": {
    "Hash": 16752756560315677817
  },
  "SkillTypeDesc": {
    "Hash": 3601902557209832706
  },
  "Level": 1,
  "MaxLevel": 1,
  "SkillTriggerKey": "",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 6612596470888090439
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "StanceDamageDisplay": 10,
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [],
  "SimpleParamList": [],
  "StanceDamageType": "Ice",
  "AttackType": "MazeNormal",
  "SkillEffect": "MazeAttack"
}
```

### AvatarSkillTreeConfig.json (4.18 MB, 5,378 条)

**字段** (24): `AbilityName, AnchorType, AvatarID, AvatarLevelLimit, AvatarPromotionLimit, DefaultUnlock, EnhancedID, ExtraEffectIDList, IconPath, Level, LevelUpSkillID, MaterialList, MaxLevel, ParamList, PointDesc, PointID, PointName, PointTriggerKey, PointType, PrePoint, RecommendPriority, SimpleExtraEffectIDList, SimplePointDesc, StatusAddList`

**首条记录摘要**:
```json
{
  "PointID": 1001001,
  "Level": 1,
  "AvatarID": 1001,
  "PointType": 2,
  "AnchorType": "Point01",
  "MaxLevel": 6,
  "DefaultUnlock": true,
  "PrePoint": [],
  "StatusAddList": [],
  "MaterialList": [],
  "LevelUpSkillID": [
    100101
  ],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "PointName": "",
  "PointDesc": "",
  "SimplePointDesc": "",
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "RecommendPriority": 3,
  "AbilityName": "",
  "PointTriggerKey": "PointNormal",
  "ParamList": []
}
```

### AchievementData.json (0.71 MB, 1,950 条)

**字段** (16): `AchievementDesc, AchievementDescPS, AchievementID, AchievementTitle, AchievementTitlePS, HideAchievementDesc, LinearQuestID, PSTrophyID, ParamList, Priority, QuestID, Rarity, RecordText, RecordType, SeriesID, ShowType`

**首条记录摘要**:
```json
{
  "AchievementID": 4010101,
  "SeriesID": 1,
  "QuestID": 4010101,
  "LinearQuestID": 4010101,
  "AchievementTitle": {
    "Hash": 16201268731039036366
  },
  "AchievementDesc": {
    "Hash": 11752061240597642139
  },
  "AchievementDescPS": {
    "Hash": 16599511039194141254
  },
  "ParamList": [],
  "Priority": 10000,
  "Rarity": "High",
  "ShowType": "ShowAfterFinish",
  "PSTrophyID": "0001"
}
```

### AvatarServantSkillConfig.json (0.59 MB, 480 条)

**字段** (28): `AttackType, BPNeed, DelayRatio, ExtraEffectIDList, HideInUI, Level, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillNeed, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 1140201,
  "SkillName": {
    "Hash": 474908829947930591
  },
  "SkillTag": {
    "Hash": 8271918951422785867
  },
  "SkillTypeDesc": {
    "Hash": 14537074486625075419
  },
  "Level": 1,
  "MaxLevel": 10,
  "SkillTriggerKey": "Skill01",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1402/Skil...",
  "UltraSkillIcon": "",
  "SkillDesc": {
    "Hash": 3942575346024233467
  },
  "SimpleSkillDesc": {
    "Hash": 6141215541844076818
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "StanceDamageDisplay": 10,
  "SPBase": {
    "Value": 10
  },
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": "<list[3]>",
  "SimpleParamList": "<list[3]>",
  "StanceDamageType": "Thunder",
  "AttackType": "Servant",
  "SkillEffect": "Blast"
}
```

### AvatarSkillConfigTrial.json (0.48 MB, 355 条)

**字段** (32): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SkillComboValueDelta, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 720501,
  "SkillName": {
    "Hash": 1534315940183180822
  },
  "SkillTag": {
    "Hash": 11585018240195872680
  },
  "SkillTypeDesc": {
    "Hash": 12757588871161859361
  },
  "Level": 1,
  "MaxLevel": 10,
  "SkillTriggerKey": "Skill01",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1205/Skil...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "SPBase": {
    "Value": 20
  },
  "StanceDamageDisplay": 10,
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "BPAdd": {
    "Value": 1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [
    {
      "Value": 0.5
    }
  ],
  "SimpleParamList": [
    {
      "Value": 0.5
    }
  ],
  "StanceDamageType": "Wind",
  "AttackType": "Normal",
  "SkillEffect": "SingleAttack",
  "SkillComboValueDelta": {
    "Value": 10
  }
}
```

### AvatarPromotionConfig.json (0.47 MB, 658 条)

**字段** (16): `AttackAdd, AttackBase, AvatarID, BaseAggro, CriticalChance, CriticalDamage, DefenceAdd, DefenceBase, HPAdd, HPBase, MaxLevel, PlayerLevelRequire, Promotion, PromotionCostList, SpeedBase, WorldLevelRequire`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "PromotionCostList": "<list[2]>",
  "MaxLevel": 20,
  "PlayerLevelRequire": 15,
  "AttackBase": {
    "Value": 69.6
  },
  "AttackAdd": {
    "Value": 3.48
  },
  "DefenceBase": {
    "Value": 78
  },
  "DefenceAdd": {
    "Value": 3.9
  },
  "HPBase": {
    "Value": 144
  },
  "HPAdd": {
    "Value": 7.2
  },
  "SpeedBase": {
    "Value": 101
  },
  "CriticalChance": {
    "Value": 0.05
  },
  "CriticalDamage": {
    "Value": 0.5
  },
  "BaseAggro": {
    "Value": 150
  }
}
```

### AvatarSkillConfigLD.json (0.44 MB, 293 条)

**字段** (34): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, HideInUI, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 101401,
  "SkillName": {
    "Hash": 13679607945320415018
  },
  "SkillTag": {
    "Hash": 11585018240195872680
  },
  "SkillTypeDesc": {
    "Hash": 12757588871161859361
  },
  "Level": 1,
  "MaxLevel": 10,
  "SkillTriggerKey": "Skill01",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1014/Skil...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 12970092482072173397
  },
  "SimpleSkillDesc": {
    "Hash": 9516498190573986486
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "SPBase": {
    "Value": 20
  },
  "StanceDamageDisplay": 10,
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "BPAdd": {
    "Value": 1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [
    {
      "Value": 0.5
    }
  ],
  "SimpleParamList": [
    {
      "Value": 0.5
    }
  ],
  "StanceDamageType": "Wind",
  "AttackType": "Normal",
  "SkillEffect": "SingleAttack"
}
```

### AvatarStatusConfig.json (0.36 MB, 778 条)

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 10010011,
  "ModifierName": "MAvatar_March7th_00_BPSkill_Shield",
  "StatusName": {
    "Hash": 6161806733770540342
  },
  "StatusType": "Buff",
  "StatusDesc": {
    "Hash": 14130710874451147525
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffSh...",
  "StatusIconPathHighSize": "",
  "StatusEffect": {
    "Hash": 860407710466520716
  },
  "CanDispel": true,
  "ReadParamList": [],
  "TagList": []
}
```

### ActivityHipplenEffect.json (0.32 MB, 2,781 条)

**字段** (4): `AAIAEKDKMMK, EJHODPJIFIN, GMPGDEINODK, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 30101111,
  "GMPGDEINODK": "StatChange",
  "EJHODPJIFIN": "1,0",
  "AAIAEKDKMMK": []
}
```

### AvatarRankConfig.json (0.30 MB, 624 条)

**字段** (11): `Desc, ExtraEffectIDList, IconPath, Name, Param, Rank, RankAbility, RankID, SkillAddLevelList, Trigger, UnlockCost`

**首条记录摘要**:
```json
{
  "RankID": 100101,
  "Rank": 1,
  "Trigger": {
    "Hash": 2089636447
  },
  "Name": "AvatarRankName_100101",
  "Desc": "AvatarRankDesc_100101",
  "ExtraEffectIDList": [],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "SkillAddLevelList": {},
  "RankAbility": [],
  "UnlockCost": [
    {
      "ItemID": 11001,
      "ItemNum": 1
    }
  ],
  "Param": [
    {
      "Value": 6
    }
  ]
}
```

### AvatarConfig.json (0.22 MB, 94 条)

**字段** (40): `AIPath, ActionAvatarHeadIconPath, AdventurePlayerID, AssistBgOffset, AssistOffset, AvatarBaseType, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarFullName, AvatarGachaResultImgPath, AvatarID, AvatarMiniIconPath, AvatarName, AvatarSelfShowOffset, AvatarSideIconPath, AvatarTrialOffset, AvatarVOTag, DamageType, DamageTypeResistance, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, ExpGroup, JsonPath, ManikinJsonPath, MaxPromotion, MaxRank, PlayerCardOffset, RankIDList, Rarity, Release, SPNeed, SideAvatarHeadIconPath, SkillList, SkilltreePrefabPath, UIAvatarModelPath, UltraSkillCutInPrefabPath, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "AvatarName": {
    "Hash": 6186714091647966180
  },
  "AvatarFullName": {
    "Hash": 9058972803650014395
  },
  "AdventurePlayerID": 1001,
  "AvatarVOTag": "mar7th",
  "Rarity": "CombatPowerAvatarRarityType4",
  "JsonPath": "Config/ConfigCharacter/Avatar/Avatar_Mar...",
  "DamageType": "Ice",
  "SPNeed": {
    "Value": 120
  },
  "ExpGroup": 1,
  "MaxPromotion": 6,
  "MaxRank": 6,
  "RankIDList": "<list[6]>",
  "SkillList": "<list[6]>",
  "AvatarBaseType": "Knight",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Avatar/Mar_7...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/Avatar/1001.png",
  "AvatarSideIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001...",
  "AvatarMiniIconPath": "SpriteOutput/AvatarMiniIcon/1001.png",
  "AvatarGachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/1001.p...",
  "ActionAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1001B.png",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/UltraSk...",
  "UIAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Avat...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Avatar/Ma...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "SkilltreePrefabPath": "UI/Avatar/Widget/KnightSkillTreeGroup.pr...",
  "DamageTypeResistance": [],
  "Release": true,
  "SideAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1001.png",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1001.png",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/1001.png",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/1001.png",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/1001.png",
  "AvatarCutinIntroText": {
    "Hash": 7663786577497784004
  },
  "AvatarDropOffset": "<list[9]>",
  "AvatarTrialOffset": [],
  "PlayerCardOffset": [
    82,
    -84,
    0.77
  ],
  "AssistOffset": [
    70,
    -72,
    1.1
  ],
  "AssistBgOffset": [
    108,
    -300,
    1
  ],
  "AvatarSelfShowOffset": [
    0,
    -100,
    5
  ]
}
```

### ActivityPanel.json (0.21 MB, 270 条)

**字段** (20): `ActivityTagList, ActivityThemeID, DailyHint, DisplayItemList, DisplayItemManualSort, FinishConditions, FinishType, IntroDesc, IsSkipSwitchStoryLine, IsSocialShow, PanelBrief, PanelDesc, PanelID, SortWeight, TabIcon, TabName, TagDesc, TitleName, UIPrefab, UnlockConditions`

**首条记录摘要**:
```json
{
  "PanelID": 10014,
  "UIPrefab": "UI/Quest/Widget/SevenDayRewardPanel.pref...",
  "UnlockConditions": "[FinishMainMission:1000510]",
  "SortWeight": 3010,
  "TabName": {
    "Hash": 13731166576056034340
  },
  "TitleName": {
    "Hash": 3846159296087366346
  },
  "ActivityTagList": [],
  "TabIcon": "SpriteOutput/Quest/TabIcon/SignInRewardT...",
  "TagDesc": {
    "Hash": 4551139714852869785
  },
  "IntroDesc": {
    "Hash": 16859379134862628959
  },
  "DisplayItemList": [],
  "FinishConditions": ""
}
```

### AvatarSkillTreeConfigTrial.json (0.19 MB, 250 条)

**字段** (22): `AbilityName, AnchorType, AvatarID, AvatarLevelLimit, AvatarPromotionLimit, DefaultUnlock, ExtraEffectIDList, IconPath, Level, LevelUpSkillID, MaterialList, MaxLevel, ParamList, PointDesc, PointID, PointName, PointTriggerKey, PointType, PrePoint, SimpleExtraEffectIDList, SimplePointDesc, StatusAddList`

**首条记录摘要**:
```json
{
  "PointID": 7205001,
  "Level": 1,
  "AvatarID": 7205,
  "PointType": 2,
  "AnchorType": "Point01",
  "MaxLevel": 6,
  "DefaultUnlock": true,
  "PrePoint": [],
  "StatusAddList": [],
  "MaterialList": [],
  "LevelUpSkillID": [
    720501,
    720508
  ],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1205/Skil...",
  "PointName": "",
  "PointDesc": "",
  "SimplePointDesc": "",
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "AbilityName": "",
  "PointTriggerKey": "PointNormal",
  "ParamList": []
}
```

### AvatarSkillTreeConfigLD.json (0.16 MB, 200 条)

**字段** (23): `AbilityName, AnchorType, AvatarID, AvatarLevelLimit, AvatarPromotionLimit, DefaultUnlock, ExtraEffectIDList, IconPath, Level, LevelUpSkillID, MaterialList, MaxLevel, ParamList, PointDesc, PointID, PointName, PointTriggerKey, PointType, PrePoint, RecommendPriority, SimpleExtraEffectIDList, SimplePointDesc, StatusAddList`

**首条记录摘要**:
```json
{
  "PointID": 1014001,
  "Level": 1,
  "AvatarID": 1014,
  "PointType": 2,
  "AnchorType": "Point01",
  "MaxLevel": 6,
  "DefaultUnlock": true,
  "PrePoint": [],
  "StatusAddList": [],
  "MaterialList": [],
  "LevelUpSkillID": [
    101401,
    101408
  ],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1014/Skil...",
  "PointName": "",
  "PointDesc": "",
  "SimplePointDesc": "",
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "RecommendPriority": 3,
  "AbilityName": "",
  "PointTriggerKey": "PointNormal",
  "ParamList": []
}
```

### ActivityHipplenWork.json (0.11 MB, 292 条)

**字段** (8): `Cost, ID, Param, Type, WorkDesc, WorkIcon, WorkSmallIcon, WorkTitle`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "WorkTitle": {
    "Hash": 9792963974635494762
  },
  "Type": "Performance",
  "Param": 1001,
  "WorkIcon": "",
  "WorkSmallIcon": ""
}
```

### ActionGroup.json (0.11 MB, 280 条)

**字段** (10): `ActionGroupName, ActionGroupTextmapID, ActionListForAnd, ActionListForOr, ActionName, FranceKeyMouseImagePath, GermanyKeyMouseImagePath, KeyMouseImagePath, PsImagePath, XboxImagePath`

**首条记录摘要**:
```json
{
  "ActionGroupName": "ActionGroup_SelectMenu",
  "ActionName": "",
  "ActionGroupTextmapID": {
    "Hash": 11644356251167687380
  },
  "KeyMouseImagePath": "",
  "FranceKeyMouseImagePath": "",
  "GermanyKeyMouseImagePath": "",
  "XboxImagePath": "",
  "PsImagePath": "",
  "ActionListForOr": "<list[2]>",
  "ActionListForAnd": []
}
```

### AvatarMazeBuff.json (0.10 MB, 148 条)

**字段** (21): `BuffDesc, BuffDescBattle, BuffDescParamByAvatarSkillID, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, DisplayType, ID, InBattleBindingKey, InBattleBindingType, IsDisplayEnvInLevel, Lv, LvMax, MazeBuffIconType, MazeBuffPool, MazeBuffType, ModifierName, ParamList, UseType`

**首条记录摘要**:
```json
{
  "ID": 100801,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_Maze_Arlan",
  "InBattleBindingType": "CharacterSkill",
  "InBattleBindingKey": "SkillMaze",
  "ParamList": [],
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconDotCom...",
  "BuffName": {
    "Hash": 13013349132478528449
  },
  "BuffDesc": {
    "Hash": 13013349132478528449
  },
  "BuffDescBattle": {
    "Hash": 13013349132478528449
  },
  "BuffEffect": "",
  "MazeBuffType": "Character",
  "UseType": "TriggerBattle",
  "MazeBuffIconType": "Other"
}
```

### AvatarDemoConfig.json (0.09 MB, 142 条)

**字段** (21): `AvatarDemoGuide, AvatarID, ConfigList1, EnableMazeSkillEffect, EnableSwitchAvatar, EventIDList1, GuideGroupID, MapEntranceID, MazeGroupID1, NormalWaveNotShowDetail, NpcMonsterIDList1, OperationRecordPath, OverrideDisplaySkillTriggerKeyList, RaidID, RandomSeed, RewardID, SPList, ScoringGroupID, StageID, StageType, TrialAvatarList`

**首条记录摘要**:
```json
{
  "StageID": 310130,
  "StageType": "TrialActivity",
  "AvatarID": 1013,
  "TrialAvatarList": [
    2000021,
    2000022
  ],
  "SPList": [
    0,
    0
  ],
  "RewardID": 100,
  "OperationRecordPath": "",
  "OverrideDisplaySkillTriggerKeyList": [],
  "MapEntranceID": 30527001,
  "MazeGroupID1": 6,
  "ConfigList1": [
    200001
  ],
  "NpcMonsterIDList1": [
    1002040
  ],
  "EventIDList1": [
    310130
  ],
  "EnableMazeSkillEffect": true,
  "EnableSwitchAvatar": true
}
```

### ActivityDiceAvatarConfig.json (0.09 MB, 64 条)

**字段** (23): `AttackAnimation, AttackDiceNumber, AttackEffectEnemyPath, AttackEffectPath, AttackJson, ColorfulDiceAvailableCount, DefendDiceNumber, DiceAvatarID, DiceCountPerRare, DiceIDPerRare, FinalAttackVoice, HP, HighLevelBGImgPath, HighLevelBGImgPathUI3D, ImgPath, ImgPathHeadIcon, ImgPathUI3D, IsCollection, Name, Rare, RecommendDiceIDList, ShopIcon, SkillID`

**首条记录摘要**:
```json
{
  "DiceAvatarID": 264001,
  "Rare": 1,
  "Name": {
    "Hash": 4537760151162357063
  },
  "HP": 22,
  "SkillID": 264001,
  "DiceIDPerRare": [
    264101,
    264201,
    0,
    0
  ],
  "DiceCountPerRare": [
    2,
    2,
    0,
    0
  ],
  "AttackDiceNumber": 3,
  "DefendDiceNumber": 2,
  "ImgPath": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "ImgPathUI3D": "SpriteOutput/Quest/DiceCombat/UI3DAvatar...",
  "HighLevelBGImgPath": "",
  "HighLevelBGImgPathUI3D": "",
  "ImgPathHeadIcon": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "ShopIcon": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "IsCollection": true,
  "AttackEffectPath": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "AttackEffectEnemyPath": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "AttackAnimation": "Attack",
  "RecommendDiceIDList": [],
  "FinalAttackVoice": "",
  "AttackJson": "Config/Gameplays/LittleGame/DiceCombat/D..."
}
```

### AvatarRelicRecommend.json (0.09 MB, 94 条)

**字段** (11): `AvatarID, LocalCriticalChance, PropertyList, PropertyList3, PropertyList4, PropertyList5, PropertyList6, ScoreRankList, Set2IDList, Set4IDList, SubAffixPropertyList`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "Set4IDList": [
    103,
    128,
    106
  ],
  "Set2IDList": [
    304,
    310,
    317
  ],
  "PropertyList3": "<list[2]>",
  "PropertyList4": [
    "SpeedDelta",
    "DefenceAddedRatio"
  ],
  "PropertyList5": [
    "DefenceAddedRatio"
  ],
  "PropertyList6": [
    "DefenceAddedRatio"
  ],
  "PropertyList": "<list[4]>",
  "SubAffixPropertyList": "<list[4]>",
  "ScoreRankList": [
    279,
    216
  ]
}
```

### ActivityConfig.json (0.08 MB, 525 条)

**字段** (5): `ActivityID, ActivityModuleIDList, ActivityPanelID, EarlyAccessContentID, ResidentModuleList`

**首条记录摘要**:
```json
{
  "ActivityID": 10012,
  "ResidentModuleList": [],
  "ActivityModuleIDList": [
    1001201
  ]
}
```

### ActivityDiceContentConfig.json (0.08 MB, 116 条)

**字段** (12): `AIEffectWeight, Content, ContentID, DiceSkillJsonPath, GlossaryIDList, ImageTextmap, ImgPath, SKillDesc, SKillImagePathSmall, SKillImgPath, SKillImgPathUI3D, SkillParam`

**首条记录摘要**:
```json
{
  "ContentID": 1,
  "Content": 1,
  "DiceSkillJsonPath": "",
  "SkillParam": [],
  "GlossaryIDList": [],
  "ImgPath": "UI/UI3D/DiceCombat/_dependencies/Texture...",
  "SKillImgPath": "",
  "SKillImgPathUI3D": "",
  "SKillImagePathSmall": ""
}
```

### ActivityAvatarPromotion.json (0.07 MB, 133 条)

**字段** (14): `AttackAdd, AttackBase, AvatarID, BaseAggro, CriticalChance, CriticalDamage, DefenceAdd, DefenceBase, HPAdd, HPBase, MaxLevel, Promotion, PromotionCostList, SpeedBase`

**首条记录摘要**:
```json
{
  "AvatarID": 8901,
  "PromotionCostList": "<list[2]>",
  "MaxLevel": 20,
  "AttackBase": {
    "Value": 84.48
  },
  "AttackAdd": {
    "Value": 4.224
  },
  "DefenceBase": {
    "Value": 62.7
  },
  "DefenceAdd": {
    "Value": 3.135
  },
  "HPBase": {
    "Value": 163.68
  },
  "HPAdd": {
    "Value": 8.184
  },
  "SpeedBase": {
    "Value": 100
  },
  "CriticalChance": {
    "Value": 0.05
  },
  "CriticalDamage": {
    "Value": 0.5
  },
  "BaseAggro": {
    "Value": 125
  }
}
```

### AetherDivideSpiritSkill.json (0.07 MB, 78 条)

**字段** (20): `AttackType, BPAdd, BPNeed, ExtraEffectIDList, ParamList, PropertyType, SPMultipleRatio, SPNeed, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 600101,
  "SkillName": {
    "Hash": 13513754767712507400
  },
  "SkillTag": {
    "Hash": 8271918951422785867
  },
  "SkillTypeDesc": {
    "Hash": 12757588871161859361
  },
  "SkillTriggerKey": "Skill01",
  "AttackType": "Normal",
  "SkillIcon": "SpriteOutput/Quest/AetherDivide/SkillIco...",
  "UltraSkillIcon": "",
  "SimpleExtraEffectIDList": [],
  "ExtraEffectIDList": [],
  "SkillDesc": {
    "Hash": 14202240982688043173
  },
  "SimpleSkillDesc": {
    "Hash": 1722155405714606574
  },
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPAdd": {
    "Value": 1
  },
  "BPNeed": {
    "Value": -1
  },
  "SimpleParamList": [
    {
      "Value": 1
    }
  ],
  "ParamList": [
    {
      "Value": 1
    }
  ],
  "SkillEffect": "SingleAttack"
}
```

### ActivityConfigPunkLord.json (0.06 MB, 98 条)

**字段** (17): `AssistPoint, ExistTime, GroupType, ID, KillPoint, ManikinConfig, MonsterBuff, MonsterHP, MonsterLevel, MonsterPic, MonsterRare, PluralHP, RaidID, ShowMonster, SummonPoint, TurnLimit, WorldLevel`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RaidID": 7001,
  "GroupType": "Common",
  "ManikinConfig": "Config/ConfigCharacter/Manikin/Monster/M...",
  "ShowMonster": "Characters/CharacterPrefabs/Manikin/Mons...",
  "MonsterPic": "SpriteOutput/MonsterFigure/Monster_10040...",
  "MonsterBuff": {
    "Hash": 17026905197060307721
  },
  "MonsterRare": "S",
  "TurnLimit": 7,
  "MonsterHP": 42099,
  "PluralHP": 20,
  "MonsterLevel": 28,
  "ExistTime": 43200,
  "KillPoint": 1500,
  "SummonPoint": 1500,
  "AssistPoint": 180
}
```

### ActivityDiceModifier.json (0.05 MB, 286 条)

**字段** (9): `BOKJJKFCFME, LKOIJINLBBK, NHALJPDONCP, NIDFIGFJJLL, NMAHGFAPENI, OBDINDDLCIO, OENAMINOLLF, OLOIFNNLKJP, PNEIDAGEBOC`

**首条记录摘要**:
```json
{
  "LKOIJINLBBK": 26400001,
  "PNEIDAGEBOC": 1,
  "OLOIFNNLKJP": "",
  "BOKJJKFCFME": 264000
}
```

### ActivityHipplenIncident.json (0.05 MB, 103 条)

**字段** (6): `EffectList, ExpectedBasicList, ExpectedRatioProbability, ID, PerformanceJsonConfigPath, Type`

**首条记录摘要**:
```json
{
  "ID": 30101,
  "PerformanceJsonConfigPath": "Config/Gameplays/Hipplen/Incident/Activi...",
  "EffectList": "<list[1]>",
  "ExpectedBasicList": "<list[5]>",
  "ExpectedRatioProbability": []
}
```

### ActivityAvatarSkillConfig.json (0.05 MB, 35 条)

**字段** (34): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillComboValueDelta, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 890106,
  "SkillName": {
    "Hash": 9802521681134028062
  },
  "SkillTag": {
    "Hash": 16752756560315677817
  },
  "SkillTypeDesc": {
    "Hash": 3601902557209832706
  },
  "Level": 1,
  "MaxLevel": 1,
  "SkillTriggerKey": "",
  "SkillIcon": "SpriteOutput/Quest/AetherDivide/SkillIco...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 7589439724132350591
  },
  "SimpleSkillDesc": {
    "Hash": 18290573128538525496
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "StanceDamageDisplay": 10,
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [],
  "SimpleParamList": [],
  "AttackType": "MazeNormal",
  "SkillEffect": "MazeAttack"
}
```

### ActivityHipplenSentence.json (0.04 MB, 371 条)

**字段** (3): `ID, SentenceDesc, TalkSentenceName`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "SentenceDesc": {
    "Hash": 17423896724394629438
  }
}
```

### ActivityQuestRewardData.json (0.04 MB, 191 条)

**字段** (4): `ActivityModuleID, QuestList, QuestTabID, QuestTabName`

**首条记录摘要**:
```json
{
  "QuestTabID": 10001,
  "QuestTabName": {
    "Hash": 164194306843482777
  },
  "QuestList": "<list[7]>",
  "ActivityModuleID": 5000701
}
```

### ActivityResidentPanel.json (0.04 MB, 38 条)

**字段** (11): `DisplayItemList, DisplayItemManualSort, EntranceImg, ExpectTime, FinishConditions, IntroDesc, IntroGuideImg, IntroGuideVideoID, PanelDesc, PanelID, SortWeight`

**首条记录摘要**:
```json
{
  "PanelID": 50003,
  "SortWeight": 6012,
  "FinishConditions": "<list[1]>",
  "PanelDesc": {
    "Hash": 9458567706652469545
  },
  "IntroDesc": {
    "Hash": 13375576847739960114
  },
  "EntranceImg": "SpriteOutput/Quest/TabIcon/PermanentActi...",
  "DisplayItemList": "<list[9]>",
  "DisplayItemManualSort": true,
  "ExpectTime": {
    "Value": 2
  },
  "IntroGuideVideoID": 50003,
  "IntroGuideImg": ""
}
```

### ActivityAvatarConfig.json (0.04 MB, 19 条)

**字段** (39): `AIPath, ActionAvatarHeadIconPath, AdventurePlayerID, AssistBgOffset, AssistOffset, AvatarBaseType, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarFullName, AvatarGachaResultImgPath, AvatarID, AvatarMiniIconPath, AvatarName, AvatarSelfShowOffset, AvatarSideIconPath, AvatarTrialOffset, AvatarVOTag, DamageType, DamageTypeResistance, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, ExpGroup, JsonPath, ManikinJsonPath, MaxPromotion, PlayerCardOffset, RankIDList, Rarity, Release, SPNeed, SideAvatarHeadIconPath, SkillList, SkilltreePrefabPath, UIAvatarModelPath, UltraSkillCutInPrefabPath, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "AvatarID": 6023,
  "AvatarName": {
    "Hash": 3935327619204177027
  },
  "AvatarFullName": {
    "Hash": 10074817416191240931
  },
  "AdventurePlayerID": 1001,
  "AvatarVOTag": "test",
  "Rarity": "CombatPowerAvatarRarityType4",
  "JsonPath": "Config/ConfigCharacter/Activity/Avatar/A...",
  "DamageType": "Physical",
  "SPNeed": {
    "Value": 100
  },
  "ExpGroup": 1,
  "MaxPromotion": 6,
  "RankIDList": [
    6023
  ],
  "SkillList": [
    602301,
    602302,
    602303,
    602304
  ],
  "AvatarBaseType": "Warrior",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Activity/Ava...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/Avatar/999.png",
  "AvatarSideIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/999....",
  "AvatarMiniIconPath": "SpriteOutput/AvatarDrawCard/999.png",
  "AvatarGachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/999.pn...",
  "ActionAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/6023B.png",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/UltraSk...",
  "UIAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Avat...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Avatar/Ma...",
  "AIPath": "Config/ConfigAI/Avatar_ComplexSkilll_Aut...",
  "SkilltreePrefabPath": "UI/Avatar/Widget/WarriorSkillTreeGroup.p...",
  "DamageTypeResistance": [],
  "Release": true,
  "SideAvatarHeadIconPath": "SpriteOutput/MosterIcon/Monster_8033010....",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/6023.png",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/999.png",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/999.png",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/999.png",
  "AvatarDropOffset": [],
  "AvatarTrialOffset": [],
  "PlayerCardOffset": [],
  "AssistOffset": [],
  "AssistBgOffset": [],
  "AvatarSelfShowOffset": []
}
```

### AdventurePlayer.json (0.04 MB, 94 条)

**字段** (7): `AvatarID, DefaultAvatarHeadIconPath, ID, MazeSkillIdList, PlayerJsonPath, PlayerName, PlayerPrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "AvatarID": 1001,
  "PlayerName": {
    "Hash": 6186714091647966180
  },
  "PlayerPrefabPath": "Characters/CharacterPrefabs/Player/Mar_7...",
  "PlayerJsonPath": "Config/ConfigCharacter/LocalPlayer/Local...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1001.png",
  "MazeSkillIdList": [
    100101,
    100102
  ]
}
```

### AetherDivideSpirit.json (0.04 MB, 19 条)

**字段** (30): `AIPath, ActionAvatarHeadIconPath, AtlasAvatarHeadIconPath, AvatarID, AvatarName, AvatarSideIconPath, AvatarVOTag, DamageType, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, ExpItemID, GymLocation, JsonPath, ManikinAvatarModelPath, ManikinJsonPath, MaxPromotion, MiddleAvatarHeadIconPath, PassiveSkillSlotList, Rarity, RecommendPassiveSkillList, SPMax, SideAvatarHeadIconPath, SkillList, SpiritDescription, SpiritType, SpiritUnlockDescription, TeamLeftPrefabPath, TeamRightPrefabPath, UltraSkillCutInPrefabPath, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "AvatarID": 6001,
  "AvatarName": {
    "Hash": 2714258197281482930
  },
  "SpiritDescription": {
    "Hash": 13621821422836165171
  },
  "SpiritUnlockDescription": {
    "Hash": 11960811170697689353
  },
  "Rarity": "RarityType4",
  "SPMax": {
    "Value": 3
  },
  "JsonPath": "Config/ConfigCharacter/Avatar/Avatar_Aet...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Monster/M...",
  "AvatarSideIconPath": "SpriteOutput/MonsterRoundIcon/Monster_10...",
  "GymLocation": 1,
  "MaxPromotion": 6,
  "SkillList": [
    600101,
    600102,
    600103,
    600104
  ],
  "DefaultAvatarHeadIconPath": "SpriteOutput/MonsterFigure/Monster_10020...",
  "AtlasAvatarHeadIconPath": "SpriteOutput/Quest/AetherDivide/Monster/...",
  "MiddleAvatarHeadIconPath": "SpriteOutput/MonsterMiddleIcon/Monster_1...",
  "TeamLeftPrefabPath": "UI/Quest/AetherDivide/MonsterList/Monste...",
  "TeamRightPrefabPath": "UI/Quest/AetherDivide/Monster/Monster_10...",
  "WaitingAvatarHeadIconPath": "SpriteOutput/Quest/AetherDivide/MonsterI...",
  "ActionAvatarHeadIconPath": "SpriteOutput/Quest/AetherDivide/MonsterI...",
  "SideAvatarHeadIconPath": "SpriteOutput/MosterIcon/Monster_1002030....",
  "UltraSkillCutInPrefabPath": "UI/Battle/AetherDivide/ADCutin/AetherDiv...",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Avatar/Activ...",
  "ManikinAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "AIPath": "Config/ConfigAI/Avatar_ComplexSkilll_Aut...",
  "PassiveSkillSlotList": [
    "Trick",
    "Assist"
  ],
  "ExpItemID": 250300,
  "AvatarVOTag": "test",
  "DamageType": "Physical",
  "RecommendPassiveSkillList": [
    250220,
    250205,
    250209,
    250232
  ]
}
```

### ActivityDiceStageConfig.json (0.04 MB, 144 条)

**字段** (13): `AILevel, DiceAvatarID, DiceAvatarLevel, DiceCampaignID, DiceIDPerRare, DiceStageID, FirstType, HardLevel, IsUseDiceLuckControl, OverWriteMaxHPLuckControl, PresetID, RecommendAvatarList, RewardID`

**首条记录摘要**:
```json
{
  "DiceStageID": 1001,
  "DiceAvatarID": 102,
  "DiceAvatarLevel": 1,
  "DiceIDPerRare": [],
  "PresetID": 1,
  "AILevel": 1,
  "RewardID": 8014100,
  "HardLevel": 1,
  "OverWriteMaxHPLuckControl": 1,
  "RecommendAvatarList": [
    264002
  ]
}
```

### AvatarLinkConfig.json (0.04 MB, 714 条)

**字段** (2): `AvatarID, LinkAvatar`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "LinkAvatar": 8001
}
```

### AvatarDemoGuide.json (0.03 MB, 319 条)

**字段** (4): `AvatarDemoIntroduction, Index, StageID, Type`

**首条记录摘要**:
```json
{
  "StageID": 311020,
  "AvatarDemoIntroduction": {
    "Hash": 11551778507788622741
  }
}
```

### ActivityHipplenGame.json (0.03 MB, 101 条)

**字段** (2): `EffectList, ID`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "EffectList": "<list[3]>"
}
```

### ActivityPanelCondition.json (0.03 MB, 102 条)

**字段** (9): `ActivityGoto, ActivityGotoStoryLineRestore, ActivityOpenActivityModule, GuideConditions, GuideGoto, GuideTakeMission, PanelID, PreConditions, ShopOnlyActivityModule`

**首条记录摘要**:
```json
{
  "PanelID": 30006,
  "PreConditions": [],
  "GuideConditions": "<list[1]>"
}
```

### AvatarTestSkillConfig.json (0.03 MB, 4,079 条)

### AetherDivideSpiritPromotion.json (0.03 MB, 114 条)

**字段** (9): `AttackBase, AvatarID, BaseAggro, Exp, HPBase, Promotion, Slot, SpecialSkillList, SpeedBase`

**首条记录摘要**:
```json
{
  "AvatarID": 6001,
  "Promotion": 1,
  "AttackBase": {
    "Value": 304.75
  },
  "HPBase": {
    "Value": 3040
  },
  "SpeedBase": {
    "Value": 95
  },
  "BaseAggro": {
    "Value": 100
  },
  "Exp": 1,
  "SpecialSkillList": []
}
```

### AvatarUseMaterialData.json (0.03 MB, 94 条)

**字段** (9): `AvatarID, BossMaterial, PromotionMaterial, SkillMaterialLarge, SkillMaterialMedium, SkillMaterialSmall, WorldMaterialLarge, WorldMaterialMedium, WorldMaterialSmall`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "PromotionMaterial": 110403,
  "BossMaterial": 110501,
  "SkillMaterialSmall": 110141,
  "SkillMaterialMedium": 110142,
  "SkillMaterialLarge": 110143,
  "WorldMaterialSmall": 111011,
  "WorldMaterialMedium": 111012,
  "WorldMaterialLarge": 111013
}
```

### ActivityDiceV2Stage.json (0.03 MB, 11 条)

**字段** (15): `AJJDAJLFNBP, BFJDEHGEDFB, DEAKHCBABDF, EKMLKINHNOJ, ENHDOJLCADJ, HPIANKGODCK, JDMNNJLANMI, KKKDCNECFDG, LCNHHDJNHPF, LIPCDDAPHNF, MBHMFMANFOJ, MPHLEBAPCOK, NCNDBAIHDMC, OKDHOHKPEKK, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "MPHLEBAPCOK": 1,
  "LIPCDDAPHNF": 804220004,
  "MBHMFMANFOJ": [
    20501,
    20502
  ],
  "DEAKHCBABDF": 3,
  "HPIANKGODCK": 501,
  "ENHDOJLCADJ": [],
  "OKDHOHKPEKK": 3,
  "JDMNNJLANMI": [
    264018
  ],
  "BFJDEHGEDFB": 1,
  "LCNHHDJNHPF": "<list[24]>",
  "KKKDCNECFDG": "UI/UI3D/DiceCombat/V2/_dependencies/Text...",
  "AJJDAJLFNBP": "UI/UI3D/DiceCombat/V2/_dependencies/Text...",
  "EKMLKINHNOJ": []
}
```

### AvatarAtlas.json (0.03 MB, 89 条)

**字段** (7): `AvatarID, CV_CN, CV_EN, CV_JP, CV_KR, CampID, DefaultUnlock`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "DefaultUnlock": true,
  "CV_CN": {
    "Hash": 7802620064838336067
  },
  "CV_JP": {
    "Hash": 1063823762930993958
  },
  "CV_KR": {
    "Hash": 4192964690940311577
  },
  "CV_EN": {
    "Hash": 382378936445878100
  },
  "CampID": 100
}
```

### AvatarPromotionConfigTrial.json (0.02 MB, 35 条)

**字段** (16): `AttackAdd, AttackBase, AvatarID, BaseAggro, CriticalChance, CriticalDamage, DefenceAdd, DefenceBase, HPAdd, HPBase, MaxLevel, PlayerLevelRequire, Promotion, PromotionCostList, SpeedBase, WorldLevelRequire`

**首条记录摘要**:
```json
{
  "AvatarID": 7205,
  "PromotionCostList": "<list[2]>",
  "MaxLevel": 20,
  "PlayerLevelRequire": 15,
  "AttackBase": {
    "Value": 92.4
  },
  "AttackAdd": {
    "Value": 4.62
  },
  "DefenceBase": {
    "Value": 59.4
  },
  "DefenceAdd": {
    "Value": 2.97
  },
  "HPBase": {
    "Value": 184.8
  },
  "HPAdd": {
    "Value": 9.24
  },
  "SpeedBase": {
    "Value": 97
  },
  "CriticalChance": {
    "Value": 0.05
  },
  "CriticalDamage": {
    "Value": 0.5
  },
  "BaseAggro": {
    "Value": 125
  }
}
```

### AvatarTestSkillTreeConfig.json (0.02 MB, 3,250 条)

### AvatarPropertyConfig.json (0.02 MB, 56 条)

**字段** (13): `IconPath, IsDisplay, MainRelicFilter, Order, PropertyClassify, PropertyInstructionID, PropertyName, PropertyNameFilter, PropertyNameRelic, PropertyNameSkillTree, PropertyType, SubRelicFilter, isBattleDisplay`

**首条记录摘要**:
```json
{
  "PropertyType": "MaxHP",
  "PropertyName": {
    "Hash": 6221757978868999847
  },
  "PropertyNameRelic": {
    "Hash": 6221757978868999847
  },
  "PropertyNameFilter": {
    "Hash": 6221757978868999847
  },
  "IsDisplay": true,
  "isBattleDisplay": true,
  "Order": 1,
  "IconPath": "SpriteOutput/UI/Avatar/Icon/IconMaxHP.pn..."
}
```

### ActivityDiceConstValueCommo.json (0.02 MB, 141 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Dice_Gote_DiceID_Level_1",
  "Value": {
    "IntValue": 9001
  }
}
```

### ActivityDiceAIGroup.json (0.02 MB, 32 条)

**字段** (15): `AIGroupID, BuyTacticsCardWaitTimeRange, CanUseTactics, ColorfulDiceWeight, ExchangeWaitTimeRange, PrepareCancelWaitTimeRange, PrepareFinishWaitTimeRange, Quantile, RerollMaxAttack, RerollMaxDefend, SelectTimeRange, SelectWrongRate, SkillWeight, SpecialRuleWeight, UseTacticsCardWaitTimeRange`

**首条记录摘要**:
```json
{
  "AIGroupID": 1,
  "SpecialRuleWeight": 2,
  "SkillWeight": 2,
  "ColorfulDiceWeight": 2,
  "SelectTimeRange": {
    "JOACOBOICAF": 0.2,
    "JLLFPNIFOMB": 0.3
  },
  "ExchangeWaitTimeRange": {
    "JOACOBOICAF": 0.2,
    "JLLFPNIFOMB": 0.3
  },
  "UseTacticsCardWaitTimeRange": {
    "JOACOBOICAF": 0.2,
    "JLLFPNIFOMB": 0.3
  },
  "BuyTacticsCardWaitTimeRange": {
    "JOACOBOICAF": 0.2,
    "JLLFPNIFOMB": 0.3
  },
  "PrepareFinishWaitTimeRange": {
    "JOACOBOICAF": 2,
    "JLLFPNIFOMB": 2
  },
  "PrepareCancelWaitTimeRange": {
    "JOACOBOICAF": 2,
    "JLLFPNIFOMB": 2
  }
}
```

### AvatarVO.json (0.02 MB, 95 条)

**字段** (9): `ActionBegin, ActionBeginAdvantage, ActionBeginHighThreat, LightHit, ReceiveHealing, Revived, StandBy, UltraReady, VOTag`

**首条记录摘要**:
```json
{
  "VOTag": "mar7th",
  "ActionBegin": 100,
  "ActionBeginAdvantage": 100,
  "ActionBeginHighThreat": 100,
  "ReceiveHealing": 100,
  "Revived": 100,
  "UltraReady": 100,
  "LightHit": 100,
  "StandBy": 100
}
```

### ActivityDiceConfig.json (0.02 MB, 50 条)

**字段** (11): `ACAALPMLBFL, BDBHCLOLJBI, DKFDAEFMFHJ, FNHCABDPBGJ, GMPGDEINODK, HDCPODKFCAI, JPJGIPHPFCA, OENAMINOLLF, ONEFJICFIJI, PHLHIKNOAFC, PICNGJMJELF`

**首条记录摘要**:
```json
{
  "DKFDAEFMFHJ": 264101,
  "GMPGDEINODK": "D4",
  "ACAALPMLBFL": "Blue",
  "PICNGJMJELF": [
    1,
    2,
    3,
    4
  ],
  "BDBHCLOLJBI": "",
  "FNHCABDPBGJ": [],
  "JPJGIPHPFCA": []
}
```

### AvatarPromotionConfigLD.json (0.02 MB, 28 条)

**字段** (16): `AttackAdd, AttackBase, AvatarID, BaseAggro, CriticalChance, CriticalDamage, DefenceAdd, DefenceBase, HPAdd, HPBase, MaxLevel, PlayerLevelRequire, Promotion, PromotionCostList, SpeedBase, WorldLevelRequire`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "PromotionCostList": "<list[2]>",
  "MaxLevel": 20,
  "PlayerLevelRequire": 15,
  "AttackBase": {
    "Value": 81.84
  },
  "AttackAdd": {
    "Value": 4.092
  },
  "DefenceBase": {
    "Value": 89.1
  },
  "DefenceAdd": {
    "Value": 4.455
  },
  "HPBase": {
    "Value": 168.96
  },
  "HPAdd": {
    "Value": 8.448
  },
  "SpeedBase": {
    "Value": 101
  },
  "CriticalChance": {
    "Value": 0.05
  },
  "CriticalDamage": {
    "Value": 0.5
  },
  "BaseAggro": {
    "Value": 125
  }
}
```

### AvatarStatusConfigLD.json (0.02 MB, 43 条)

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 10010142,
  "ModifierName": "MAvatar_Saber_00_SkillTree01_Buff",
  "StatusName": {
    "Hash": 15581856802943047963
  },
  "StatusType": "Buff",
  "StatusDesc": {
    "Hash": 7472415217407868377
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffCr...",
  "StatusIconPathHighSize": "",
  "ReadParamList": [
    "MDF_PropertyValue"
  ],
  "TagList": []
}
```

### AetherDivideChallengeList.json (0.02 MB, 42 条)

**字段** (14): `BattleAreaID, ChallengeType, EventID, GroupID, ID, MissionID, OpponentImageIconPath, OpponentImagePath, OpponentName, OpponentPrefabPath, OpponentStrength, Rank, RewardID, VersusImagePath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 2,
  "BattleAreaID": 1,
  "Rank": 1,
  "OpponentImagePath": "",
  "OpponentPrefabPath": "UI/Quest/AetherDivide/AvatarRole/AvatarR...",
  "OpponentImageIconPath": "SpriteOutput/AvatarShopIcon/NPC/Wenshili...",
  "OpponentName": {
    "Hash": 14131216893855260044
  },
  "OpponentStrength": 1,
  "VersusImagePath": "",
  "RewardID": 8003206,
  "EventID": 43103904,
  "MissionID": 8014121
}
```

### AetherDividePassiveSkill.json (0.02 MB, 32 条)

**字段** (11): `AbilityName, ExtraEffectIDList, ItemDescription, ItemID, ParamList, PassiveSkillDescription, PassiveSkillName, PassiveSkillType, Rarity, SimpleExtraEffectIDList, SimpleParamList`

**首条记录摘要**:
```json
{
  "ItemID": 250201,
  "PassiveSkillName": "AetherDividePassiveSkill_PassiveSkillNam...",
  "ItemDescription": "AetherDividePassiveSkill_ItemDescription...",
  "PassiveSkillDescription": "AetherDividePassiveSkill_PassiveSkillDes...",
  "SimpleExtraEffectIDList": [],
  "ExtraEffectIDList": [],
  "AbilityName": "Avatar_AetherDivide_Add_Perk_0001",
  "PassiveSkillType": "Storm",
  "Rarity": 1,
  "SimpleParamList": [
    {
      "Value": 0.5
    }
  ],
  "ParamList": [
    {
      "Value": 0.5
    }
  ]
}
```

### ActionOperationSet.json (0.02 MB, 144 条)

**字段** (2): `ActionNameList, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActionNameList": [
    "ActionGroup_Return"
  ]
}
```

### ActivityDiceShopGoodsConfig.json (0.02 MB, 56 条)

**字段** (6): `DiceShopGoodsID, GoodsSortID, ItemCost, ItemID, UnlockCondition, UnlockTipsList`

**首条记录摘要**:
```json
{
  "DiceShopGoodsID": 1101,
  "ItemID": 264001,
  "ItemCost": [
    {
      "ItemID": 264996,
      "ItemNum": 1
    }
  ],
  "UnlockCondition": [],
  "GoodsSortID": 10,
  "UnlockTipsList": []
}
```

### ActivityDiceSkill.json (0.02 MB, 62 条)

**字段** (6): `CDNGHDNMMAG, NJJEIJGIENP, NMAHGFAPENI, PBLPLDJKPEI, PGAMJHMNLLN, PMKEDGGOLKD`

**首条记录摘要**:
```json
{
  "CDNGHDNMMAG": 264001,
  "PMKEDGGOLKD": "Config/Gameplays/LittleGame/DiceCombat/D...",
  "PBLPLDJKPEI": [
    3,
    4,
    7
  ],
  "NJJEIJGIENP": [
    3,
    7
  ],
  "NMAHGFAPENI": {
    "Hash": 8501315528084562143
  },
  "PGAMJHMNLLN": []
}
```

### ActivityAvatarSkillConfigLD.json (0.02 MB, 12 条)

**字段** (31): `AttackType, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillComboValueDelta, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 603603,
  "SkillName": {
    "Hash": 16563513199119626315
  },
  "SkillTag": {
    "Hash": 9868503137584243444
  },
  "SkillTypeDesc": {
    "Hash": 4243237131156021087
  },
  "Level": 1,
  "MaxLevel": 1,
  "SkillTriggerKey": "Skill03",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1014/Skil...",
  "UltraSkillIcon": "SpriteOutput/Collaboration/FateRin/FateU...",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 9733360488091117392
  },
  "SimpleSkillDesc": {
    "Hash": 1080617521360174217
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "<list[3]>",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "SPNeed": {
    "Value": 200
  },
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [
    {
      "Value": 2.25
    },
    {
      "Value": 0
    }
  ],
  "SimpleParamList": [
    {
      "Value": 2.25
    },
    {
      "Value": 0
    }
  ],
  "StanceDamageType": "Wind",
  "AttackType": "Ultra",
  "SkillEffect": "AoEAttack",
  "SkillComboValueDelta": {
    "Value": 60
  }
}
```

### ActivityDiceLuckControl.json (0.02 MB, 20 条)

**字段** (9): `AANFAMJILOB, DJGJIPEMIGE, ENIJMCCMFFJ, HDJGBKABEKF, JPOEFHLLNIK, KLGMFBFNALH, NOIDIGCCPEJ, OGDLLCOBDNB, OGMFNGPLDOB`

**首条记录摘要**:
```json
{
  "OGMFNGPLDOB": 1,
  "HDJGBKABEKF": [
    10,
    10,
    40,
    40
  ],
  "OGDLLCOBDNB": [
    5,
    10,
    10,
    20,
    25,
    30
  ],
  "DJGJIPEMIGE": [
    2,
    3,
    5,
    10,
    15,
    20,
    20,
    25
  ],
  "JPOEFHLLNIK": "<list[12]>",
  "AANFAMJILOB": [
    40,
    40,
    10,
    10
  ],
  "ENIJMCCMFFJ": [
    30,
    25,
    20,
    10,
    10,
    5
  ],
  "KLGMFBFNALH": [
    25,
    20,
    20,
    15,
    10,
    5,
    3,
    2
  ],
  "NOIDIGCCPEJ": "<list[12]>"
}
```

### AvatarComefrom.json (0.02 MB, 94 条)

**字段** (6): `ComefromID, Desc, GotoID, GotoParam, ID, Sort`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "ComefromID": 99,
  "Sort": 1,
  "Desc": {
    "Hash": 6368553998257230895
  },
  "GotoID": 2300,
  "GotoParam": [
    1001
  ]
}
```

### ActivityHipplenPhase.json (0.02 MB, 12 条)

**字段** (14): `ActionPointsTotal, BackwardTrialClosePage, CycleID, DailyAgendaIDs, ForwardTrialClosePage, ForwardTrialSubMissionID, GrowthPhaseID, MiniGameAreaPath, PhaseType, StatGrade, StatRange, TrailTargetDesc, TrialGameID, UnlockAutoTrialConditions`

**首条记录摘要**:
```json
{
  "CycleID": 1,
  "PhaseType": 1,
  "GrowthPhaseID": 1,
  "ActionPointsTotal": 4,
  "StatRange": [
    0,
    1000
  ],
  "StatGrade": "<list[9]>",
  "ForwardTrialSubMissionID": 803610103,
  "ForwardTrialClosePage": true,
  "BackwardTrialClosePage": true,
  "UnlockAutoTrialConditions": "<list[1]>",
  "TrialGameID": 1000001,
  "TrailTargetDesc": {
    "Hash": 1561504926771401536
  },
  "DailyAgendaIDs": [
    1,
    2,
    3
  ],
  "MiniGameAreaPath": "Gameplays/HipplenBuilder/Prefabs/Hipplen..."
}
```

### AvatarSkin.json (0.02 MB, 8 条)

**字段** (34): `ActionAvatarHeadIconPath, ActivityIntroDataID, ActivitySkinName, AdventureCharacterConfigOverrideJsonPath, AdventureDefaultAvatarHeadIconPath, AssistOffset, AudioEventTag, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinImgPath, AvatarDropOffset, AvatarID, AvatarMiniIconPath, AvatarSelfShowOffset, AvatarSideIconPath, AvatarSkinSynopsis, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, DressIconPath, FreeStyleCharacterID, GachaResultImgPath, ID, IntroDataID, PlayerCardID, PlayerPrefabPath, ShopBgPath, ShowType, SideAvatarHeadIconPath, SkinConfigPath, Type, UIAvatarModelPath, UltraSkillCutInPrefabPath, VideoID, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "ID": 1100101,
  "AvatarID": 1001,
  "Type": "Normal",
  "PlayerCardID": 202029,
  "AvatarSkinSynopsis": {
    "Hash": 1478179930850312670
  },
  "FreeStyleCharacterID": "NPC_Avatar_Maid_Mar_7th_01",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/AvatarSkin/1...",
  "AssistOffset": [],
  "PlayerPrefabPath": "Characters/CharacterPrefabs/Player/Mar_7...",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Avatar/Mar_7...",
  "UIAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Avat...",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/AvatarS...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/AvatarSkin/11001...",
  "AdventureDefaultAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/AvatarSkin/1...",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/AvatarSkin/1...",
  "ActionAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/AvatarSkin/1...",
  "SideAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/AvatarSkin/1...",
  "AvatarSideIconPath": "SpriteOutput/AvatarRoundIcon/AvatarSkin/...",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/AvatarSk...",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/AvatarSkin/11...",
  "AvatarMiniIconPath": "SpriteOutput/AvatarMiniIcon/AvatarSkin/1...",
  "AvatarDropOffset": [
    -100,
    20,
    0.38
  ],
  "AvatarSelfShowOffset": [],
  "ShowType": "Always",
  "IntroDataID": 126,
  "ShopBgPath": "UI/Shop/AvatarSkinPanel/AvatarSkinShop_1...",
  "GachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/Avatar...",
  "SkinConfigPath": "Config/ConfigSkin/Avatar/AvatarSkin_Mar_...",
  "AdventureCharacterConfigOverrideJsonPath": "",
  "AudioEventTag": "",
  "DressIconPath": ""
}
```

### AvatarPlayerIcon.json (0.02 MB, 94 条)

**字段** (6): `AvatarID, ID, ImagePath, Sort, SortType, Type`

**首条记录摘要**:
```json
{
  "ID": 201001,
  "ImagePath": "SpriteOutput/AvatarRoundIcon/Avatar/1001...",
  "AvatarID": 1001,
  "Type": "Avatar",
  "SortType": 3,
  "Sort": 61
}
```

### AlleyOrder.json (0.01 MB, 27 条)

**字段** (8): `OrderContent, OrderGoodList, OrderID, OrderProfit, OrderShip, OrderTips, OrderTipsTime, UnlockMission`

**首条记录摘要**:
```json
{
  "OrderID": 100,
  "OrderContent": [
    {
      "GoodsID": 202,
      "GoodsCnt": 6
    }
  ],
  "OrderGoodList": [
    202
  ],
  "UnlockMission": 8003201,
  "OrderShip": 1,
  "OrderProfit": 9500,
  "OrderTips": "SpriteOutput/Quest/Alley/AlleyCargoTips/...",
  "OrderTipsTime": [
    600,
    5
  ]
}
```

### ActivityHipplenTrait.json (0.01 MB, 35 条)

**字段** (9): `Effects, ID, ImagePath, Rarity, TraitDesc, TraitDescParam, TraitTitle, TraitUnlockDesc, TraitUnlockDescParam`

**首条记录摘要**:
```json
{
  "ID": 2101,
  "TraitTitle": {
    "Hash": 9628432400429294688
  },
  "TraitUnlockDesc": {
    "Hash": 13546815418555766361
  },
  "TraitUnlockDescParam": [
    4
  ],
  "TraitDesc": {
    "Hash": 9559955462940383596
  },
  "TraitDescParam": [
    1
  ],
  "ImagePath": "SpriteOutput/Quest/Hipplen/HeadIcon/Hipp...",
  "Effects": [
    421011
  ],
  "Rarity": 1
}
```

### ActivityDiceSpecialRule.json (0.01 MB, 31 条)

**字段** (11): `AIEffectWeightList, Desc, GlossaryIDList, IconPath, ModifierID, Name, ParamList, RuleTag, ShowType, SpecialRuleID, SpecialRuleJson`

**首条记录摘要**:
```json
{
  "SpecialRuleID": 1,
  "SpecialRuleJson": "Config/Gameplays/LittleGame/DiceCombat/W...",
  "ModifierID": 10001,
  "ParamList": [
    1
  ],
  "AIEffectWeightList": [
    3
  ],
  "Name": {
    "Hash": 12811157495977558488
  },
  "Desc": {
    "Hash": 701932015177196102
  },
  "GlossaryIDList": [
    19
  ],
  "IconPath": "SpriteOutput/Quest/DiceCombat/Weather/Di...",
  "ShowType": "Snowy",
  "RuleTag": "Defence"
}
```

### ActivityParkourAIConfig.json (0.01 MB, 29 条)

**字段** (15): `AIPlayerScore, ActionIntervalTime, CalcStepCnt, ID, LocalPlayerScore, Name, NearPlayerScore, ObstacleScore, PrefabPath, ResPath, SkillItemScore, SlowDownRegionScore, SpeedItemScore, SpeedUpRegionScore, SwitchRoadScore`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 8058006855659122103
  },
  "PrefabPath": "Activity/Parkour/ParkourCharacter/Parkou...",
  "ResPath": "SpriteOutput/Quest/Parkour/ParkourGame_C...",
  "CalcStepCnt": 10,
  "ActionIntervalTime": 0.4,
  "SwitchRoadScore": -20,
  "SlowDownRegionScore": -30,
  "SpeedUpRegionScore": 30,
  "SpeedItemScore": 30,
  "SkillItemScore": 3,
  "ObstacleScore": -30,
  "LocalPlayerScore": -70,
  "AIPlayerScore": -10
}
```

### ActivityTelevisionLevel.json (0.01 MB, 10 条)

**字段** (27): `AllMonsterList, AvailableBuffList, BuffCount, BuffDesc, BuffShortDesc, BuffShowLevelList, BuffTips, EventID, ExtraEffectID, ExtraInfoMonsterIDList, ExtraInfoMonsterWave, FirstMonsterWave, MazeBuffID, MazeBuffMulList, MonsterBuffDesc, MonsterBuffShortDesc, MonsterBuffTips, MonsterList, MonsterParmList, MonsterPic, ParmList, PreTelevisionList, RecommadNature, SpecialAvatarList, TargetTextList, TelevisionID, UIEnterBattleAreaID`

**首条记录摘要**:
```json
{
  "TelevisionID": 2,
  "EventID": 413004,
  "MonsterBuffTips": {
    "Hash": 4804298768494049085
  },
  "MonsterBuffDesc": {
    "Hash": 12649482857836573305
  },
  "MonsterParmList": [
    20
  ],
  "BuffTips": {
    "Hash": 8836876089658519468
  },
  "MonsterBuffShortDesc": {
    "Hash": 16661573903982373453
  },
  "BuffDesc": {
    "Hash": 12577405363125881862
  },
  "BuffShortDesc": {
    "Hash": 14087162483382905294
  },
  "ParmList": [
    100,
    50,
    60
  ],
  "TargetTextList": "<list[2]>",
  "PreTelevisionList": [],
  "MazeBuffID": 3105004,
  "BuffShowLevelList": [
    4,
    8,
    12
  ],
  "MazeBuffMulList": [
    2
  ],
  "AvailableBuffList": [],
  "MonsterList": [
    3002051,
    2024014,
    1004011
  ],
  "AllMonsterList": "<list[9]>",
  "ExtraInfoMonsterIDList": [],
  "MonsterPic": "SpriteOutput/Quest/Television/Television...",
  "SpecialAvatarList": "<list[5]>",
  "UIEnterBattleAreaID": 2031102,
  "RecommadNature": [
    "Quantum"
  ]
}
```

### AlleyEvent.json (0.01 MB, 24 条)

**字段** (17): `EventFinishTitle, EventID, EventIcon, EventNewOrderTips, EventPic, EventPriority, EventShopContent, EventShopFinish, EventShopOrder, EventShopTitle, EventTitle, EventType, MapEntranceID, MappingInfoID, RewardID, StartMissionIDList, UnlockConditions`

**首条记录摘要**:
```json
{
  "EventID": 1,
  "EventTitle": {
    "Hash": 12145216224205532822
  },
  "EventShopContent": {
    "Hash": 15400905602135200530
  },
  "StartMissionIDList": [
    8003201
  ],
  "EventType": "Main",
  "EventPic": "",
  "EventIcon": "",
  "EventPriority": 1,
  "UnlockConditions": []
}
```

### ActivityHipplenDialogue.json (0.01 MB, 166 条)

**字段** (2): `ID, SentenceIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "SentenceIDList": [
    10101,
    10102,
    10103,
    10104,
    10105
  ]
}
```

### AlleyGoods.json (0.01 MB, 30 条)

**字段** (7): `GoodsConfig, GoodsID, GoodsPic, GoodsPicLocked, GoodsProfit, RotateAudioEvent, SettleAudioEvent`

**首条记录摘要**:
```json
{
  "GoodsID": 101,
  "GoodsConfig": "Config/Gameplays/Alley/AlleyShipment/All...",
  "GoodsProfit": 200,
  "GoodsPic": "SpriteOutput/Quest/Alley/AlleyCargoIcon/...",
  "GoodsPicLocked": "SpriteOutput/Quest/Alley/AlleyCargoIcon/...",
  "SettleAudioEvent": "Ev_sfx_alleycargo_woodbox_drop",
  "RotateAudioEvent": "Ev_sfx_alleycargo_woodbox_switch"
}
```

### ActivityModuleDemo.json (0.01 MB, 141 条)

**字段** (4): `ActivityModuleID, AvatarDemoStageID, AvatarDemoType, Sort`

**首条记录摘要**:
```json
{
  "AvatarDemoStageID": 311020,
  "ActivityModuleID": 2000101,
  "Sort": 1
}
```

### ActionSetting.json (0.01 MB, 59 条)

**字段** (5): `ActionName, BlackListKeys, GroupType, SettableInControlTypes, ShowType`

**首条记录摘要**:
```json
{
  "ActionName": "Special_MouseOperating",
  "GroupType": 1,
  "ShowType": 1,
  "BlackListKeys": [],
  "SettableInControlTypes": []
}
```

### AvatarConfigTrial.json (0.01 MB, 5 条)

**字段** (40): `AIPath, ActionAvatarHeadIconPath, AdventurePlayerID, AssistBgOffset, AssistOffset, AvatarBaseType, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarFullName, AvatarGachaResultImgPath, AvatarID, AvatarMiniIconPath, AvatarName, AvatarSelfShowOffset, AvatarSideIconPath, AvatarTrialOffset, AvatarVOTag, DamageType, DamageTypeResistance, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, ExpGroup, JsonPath, ManikinJsonPath, MaxPromotion, MaxRank, PlayerCardOffset, RankIDList, Rarity, Release, SPNeed, SideAvatarHeadIconPath, SkillList, SkilltreePrefabPath, UIAvatarModelPath, UltraSkillCutInPrefabPath, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "AvatarID": 7205,
  "AvatarName": {
    "Hash": 103726147856851960
  },
  "AvatarFullName": {
    "Hash": 5073335473210565972
  },
  "AdventurePlayerID": 1205,
  "AvatarVOTag": "blade",
  "Rarity": "CombatPowerAvatarRarityType5",
  "JsonPath": "Config/ConfigCharacter/Avatar/Avatar_Ren...",
  "DamageType": "Wind",
  "SPNeed": {
    "Value": 130
  },
  "ExpGroup": 1,
  "MaxPromotion": 6,
  "MaxRank": 6,
  "RankIDList": "<list[6]>",
  "SkillList": "<list[7]>",
  "AvatarBaseType": "Warrior",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Avatar/Ren_0...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/Avatar/1205.png",
  "AvatarSideIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1205...",
  "AvatarMiniIconPath": "SpriteOutput/AvatarMiniIcon/1205.png",
  "AvatarGachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/1205.p...",
  "ActionAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1205B.png",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/UltraSk...",
  "UIAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Avat...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Avatar/Ma...",
  "AIPath": "Config/ConfigAI/Avatar_ComplexSkilll_Aut...",
  "SkilltreePrefabPath": "UI/Avatar/Widget/WarriorSkillTreeGroup.p...",
  "DamageTypeResistance": [],
  "Release": true,
  "SideAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1205.png",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1205.png",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/1205.png",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/1205.png",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/1205.png",
  "AvatarCutinIntroText": {
    "Hash": 16617459917855698582
  },
  "AvatarDropOffset": "<list[9]>",
  "AvatarTrialOffset": [],
  "PlayerCardOffset": [
    75,
    -379,
    0.87
  ],
  "AssistOffset": [
    63.8,
    -242,
    1.2
  ],
  "AssistBgOffset": [
    -124,
    -224,
    1
  ],
  "AvatarSelfShowOffset": []
}
```

### AvatarRankConfigLD.json (0.01 MB, 24 条)

**字段** (11): `Desc, ExtraEffectIDList, IconPath, Name, Param, Rank, RankAbility, RankID, SkillAddLevelList, Trigger, UnlockCost`

**首条记录摘要**:
```json
{
  "RankID": 101401,
  "Rank": 1,
  "Trigger": {
    "Hash": 2089636447
  },
  "Name": "AvatarRankName_101401",
  "Desc": "AvatarRankDesc_101401",
  "ExtraEffectIDList": [],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1014/Skil...",
  "SkillAddLevelList": {},
  "RankAbility": [],
  "UnlockCost": [
    {
      "ItemID": 11014,
      "ItemNum": 1
    }
  ],
  "Param": [
    {
      "Value": 0.6
    },
    {
      "Value": 1
    }
  ]
}
```

### ActivityDiceCampaignConfig.json (0.01 MB, 11 条)

**字段** (18): `DiceCampaignID, DisplayProgress, EnterProgress, ExitMainPage, ExitProgress, GroupEntityID, IMGPath, LoseBattle, MainPageIMGPath, MainPageSilhouettePath, MustLose, Name, Progress, ProgressIMGPath, ProgressTitle, RuleGroupMapList, SubMissonID, WinBattle`

**首条记录摘要**:
```json
{
  "DiceCampaignID": 1,
  "SubMissonID": 804010018,
  "IMGPath": "SpriteOutput/MonsterRoundIcon/Monster_10...",
  "ProgressIMGPath": "SpriteOutput/AvatarIcon/NPC/2105.png",
  "MainPageIMGPath": "SpriteOutput/Quest/DiceCombat/MainEntran...",
  "MainPageSilhouettePath": "SpriteOutput/Quest/DiceCombat/MainEntran...",
  "Progress": 1,
  "ProgressTitle": {
    "Hash": 16953454931031337781
  },
  "DisplayProgress": [
    1,
    6
  ],
  "Name": {
    "Hash": 16025909734818766418
  },
  "EnterProgress": {
    "Hash": 7045057400919373680
  },
  "LoseBattle": {
    "Hash": 3635203876605897632
  },
  "ExitProgress": {
    "Hash": 16861308019325214808
  },
  "ExitMainPage": true,
  "RuleGroupMapList": "<list[4]>"
}
```

### ActivityExpedition.json (0.01 MB, 24 条)

**字段** (13): `AssignDesc, AssignerName, AvatarNumMax, AvatarNumMin, BonusBaseTypeList, Duration, ExpeditionID, ExpeditionRank, Grade1ExtraRewardID, Grade2ExtraRewardID, Grade3ExtraRewardID, Name, RewardID`

**首条记录摘要**:
```json
{
  "ExpeditionID": 100301,
  "ExpeditionRank": "High",
  "Name": {
    "Hash": 6568731981894110203
  },
  "AssignerName": {
    "Hash": 3590006581088555600
  },
  "AssignDesc": {
    "Hash": 12051521719562762682
  },
  "AvatarNumMin": 2,
  "AvatarNumMax": 4,
  "BonusBaseTypeList": [
    "Shaman"
  ],
  "Duration": 4,
  "RewardID": 3152001,
  "Grade1ExtraRewardID": 3152002,
  "Grade2ExtraRewardID": 3152003,
  "Grade3ExtraRewardID": 3152004
}
```

### ActivityHipplenInteraction.json (0.01 MB, 85 条)

**字段** (3): `Effects, ID, InteractType`

**首条记录摘要**:
```json
{
  "ID": 20301,
  "Effects": [
    203011,
    203012,
    203013,
    203014,
    203015
  ]
}
```

### AvatarEnhancedSkill.json (0.01 MB, 32 条)

**字段** (10): `AvatarID, Comment01, Comment02, CommentIndex, DescAfter, DescBefore, SimpleDescAfter, SimpleDescBefore, SkillID, SkillTreeID`

**首条记录摘要**:
```json
{
  "SkillID": 1121201,
  "AvatarID": 1212,
  "SkillTreeID": 11212001,
  "SimpleDescBefore": {
    "Hash": 18271905104574951792
  },
  "SimpleDescAfter": {
    "Hash": 15764192973696736736
  },
  "DescBefore": {
    "Hash": 12506700047623823727
  },
  "DescAfter": {
    "Hash": 8142618144611801805
  }
}
```

### AvatarRankConfigTrial.json (0.01 MB, 30 条)

**字段** (11): `Desc, ExtraEffectIDList, IconPath, Name, Param, Rank, RankAbility, RankID, SkillAddLevelList, Trigger, UnlockCost`

**首条记录摘要**:
```json
{
  "RankID": 720501,
  "Rank": 1,
  "Trigger": {
    "Hash": 2089636447
  },
  "Name": "",
  "Desc": "",
  "ExtraEffectIDList": [],
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1205/Skil...",
  "SkillAddLevelList": {},
  "RankAbility": [],
  "UnlockCost": [],
  "Param": [
    {
      "Value": 0.2
    },
    {
      "Value": 2
    }
  ]
}
```

### ActivityDiceV2Talk.json (0.01 MB, 57 条)

**字段** (4): `LLBDOPKHHEB, OOLEAPLDIEA, PEPOHJHNFHF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 111,
  "LLBDOPKHHEB": "AEEFKMNGBEI",
  "OOLEAPLDIEA": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "PEPOHJHNFHF": {
    "Hash": 17787639020707603433
  }
}
```

### ActivitySummonSkill.json (0.01 MB, 20 条)

**字段** (9): `SimpleSkillDesc, SimpleSkillParmList, SkillDesc, SkillID, SkillIconPath, SkillName, SkillParmList, SkillTriggerKey, SkillType`

**首条记录摘要**:
```json
{
  "SkillID": 1001,
  "SkillType": "AvatarSkill",
  "SkillTriggerKey": "Skill02",
  "SkillDesc": {
    "Hash": 3634788196948440532
  },
  "SimpleSkillDesc": {
    "Hash": 3634788196948440532
  },
  "SkillParmList": "<list[4]>",
  "SimpleSkillParmList": "<list[4]>",
  "SkillIconPath": "SpriteOutput/SkillIcons/Avatar/8001/Skil..."
}
```

### ActivityItemConfigAvatar.json (0.01 MB, 19 条)

**字段** (14): `CustomDataList, ID, InventoryDisplayTag, ItemAvatarIconPath, ItemBGDesc, ItemCurrencyIconPath, ItemFigureIconPath, ItemIconPath, ItemMainType, ItemName, ItemSubType, PileLimit, Rarity, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 8901,
  "ItemMainType": "AvatarCard",
  "ItemSubType": "AvatarCard",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "ItemName": {
    "Hash": 1976568521562450739
  },
  "ItemBGDesc": {
    "Hash": 8623253761789416013
  },
  "ItemIconPath": "SpriteOutput/AvatarIcon/Avatar/8001.png",
  "ItemFigureIconPath": "SpriteOutput/AvatarIcon/Avatar/8001.png",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "SpriteOutput/AvatarShopIcon/Avatar/8001....",
  "PileLimit": 1,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### ActivityGuessSilhouette.json (0.01 MB, 17 条)

**字段** (18): `ActivityID, ActivityModuleID, Aim01, Aim02, BranchQuestID, Daily, Day, FinishSubMissionID, KeyIconPath, KeyIconPath2, MissionID, Order, QuestID, SilhouetteID, SilhouetteIconPath, Tab, Title, Unlock`

**首条记录摘要**:
```json
{
  "SilhouetteID": 1,
  "ActivityModuleID": 3000601,
  "ActivityID": 30006,
  "Day": 1,
  "Order": 1,
  "MissionID": 8002101,
  "FinishSubMissionID": 800210101,
  "Daily": "ActivityGuessSilhouette_Daily_1",
  "Tab": "ActivityGuessSilhouette_Tab_1",
  "Title": "ActivityGuessSilhouette_Title_1",
  "Aim01": "ActivityGuessSilhouette_Aim01_1",
  "Aim02": "ActivityGuessSilhouette_Aim02_1",
  "Unlock": "",
  "SilhouetteIconPath": "SpriteOutput/Quest/GuessTheSilhouette/Gu...",
  "KeyIconPath": "SpriteOutput/Quest/GuessTheSilhouette/Gu...",
  "KeyIconPath2": ""
}
```

### ActivityTelevisionStage.json (0.01 MB, 10 条)

**字段** (18): `ActivityModuleID, ChannelName, Desc, EntranceID, GotoID, ImagePath, MappingInfo, MiniImagePath, MissionID, OriginalDesc, OriginalImagePath, OriginalMiniImagePath, OriginalOutlineImagePath, OriginalStageName, QuestGroupID, Season, StageName, TelevisionID`

**首条记录摘要**:
```json
{
  "TelevisionID": 2,
  "Season": 1,
  "ActivityModuleID": 4000501,
  "QuestGroupID": 2,
  "OriginalStageName": {
    "Hash": 12373314995153940444
  },
  "StageName": {
    "Hash": 4947497772803885348
  },
  "OriginalDesc": {
    "Hash": 6353813797126759609
  },
  "Desc": {
    "Hash": 11258004175228618023
  },
  "ChannelName": {
    "Hash": 1018956259155271397
  },
  "GotoID": 26003,
  "MappingInfo": 2386,
  "EntranceID": 2031103,
  "MissionID": 802030203,
  "OriginalImagePath": "SpriteOutput/Quest/Television/Television...",
  "OriginalOutlineImagePath": "",
  "ImagePath": "SpriteOutput/Quest/Television/Television...",
  "OriginalMiniImagePath": "SpriteOutput/Quest/Television/Television...",
  "MiniImagePath": "SpriteOutput/Quest/Television/Television..."
}
```

### AlleySpecialOrder.json (0.01 MB, 9 条)

**字段** (11): `OrderPic, OrderTips, OrderTipsTime, SpecialOrderContent, SpecialOrderGoods, SpecialOrderID, SpecialOrderReward, SpecialOrderShip, SpecialOrderShopID, SubTitleID, UnlockMission`

**首条记录摘要**:
```json
{
  "SpecialOrderID": 101,
  "SpecialOrderShip": 1,
  "SpecialOrderGoods": "<list[4]>",
  "SpecialOrderReward": 8002002,
  "SpecialOrderContent": [
    10101
  ],
  "OrderTips": "SpriteOutput/Quest/Alley/AlleyCargoTips/...",
  "OrderTipsTime": [
    60,
    10,
    10,
    5
  ],
  "OrderPic": "SpriteOutput/Quest/Alley/AlleyMissionImg...",
  "SubTitleID": "UIText_ActivityAlley_SpecialOrder_Name10...",
  "SpecialOrderShopID": 101,
  "UnlockMission": 8003201
}
```

### AvatarConfigLD.json (0.01 MB, 4 条)

**字段** (40): `AIPath, ActionAvatarHeadIconPath, AdventurePlayerID, AssistBgOffset, AssistOffset, AvatarBaseType, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarFullName, AvatarGachaResultImgPath, AvatarID, AvatarMiniIconPath, AvatarName, AvatarSelfShowOffset, AvatarSideIconPath, AvatarTrialOffset, AvatarVOTag, DamageType, DamageTypeResistance, DefaultAvatarHeadIconPath, DefaultAvatarModelPath, ExpGroup, JsonPath, ManikinJsonPath, MaxPromotion, MaxRank, PlayerCardOffset, RankIDList, Rarity, Release, SPNeed, SideAvatarHeadIconPath, SkillList, SkilltreePrefabPath, UIAvatarModelPath, UltraSkillCutInPrefabPath, WaitingAvatarHeadIconPath`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "AvatarName": {
    "Hash": 11292532298779825003
  },
  "AvatarFullName": {
    "Hash": 8951245737780219460
  },
  "AdventurePlayerID": 1014,
  "AvatarVOTag": "saber",
  "Rarity": "CombatPowerAvatarRarityType5",
  "JsonPath": "Config/ConfigCharacter/Avatar/Avatar_Sab...",
  "DamageType": "Wind",
  "SPNeed": {
    "Value": 360
  },
  "ExpGroup": 1,
  "MaxPromotion": 6,
  "MaxRank": 6,
  "RankIDList": "<list[6]>",
  "SkillList": "<list[7]>",
  "AvatarBaseType": "Warrior",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Avatar/Saber...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/Avatar/1014.png",
  "AvatarSideIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1014...",
  "AvatarMiniIconPath": "SpriteOutput/AvatarMiniIcon/1014.png",
  "AvatarGachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/1014.p...",
  "ActionAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014B.png",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/UltraSk...",
  "UIAvatarModelPath": "Characters/CharacterPrefabs/Manikin/Avat...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Avatar/Ma...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "SkilltreePrefabPath": "UI/Avatar/Widget/WarriorSkillTreeGroup.p...",
  "DamageTypeResistance": [],
  "Release": true,
  "SideAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014.png",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014.png",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/1014.png",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/1014.png",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/1014.png",
  "AvatarCutinIntroText": {
    "Hash": 4799067612581879871
  },
  "AvatarDropOffset": "<list[9]>",
  "AvatarTrialOffset": [],
  "PlayerCardOffset": [
    82,
    -84,
    0.77
  ],
  "AssistOffset": [
    70,
    -72,
    1.1
  ],
  "AssistBgOffset": [
    108,
    -300,
    1
  ],
  "AvatarSelfShowOffset": [
    0,
    -100,
    5
  ]
}
```

### AlleySpecialOrderFinish.json (0.01 MB, 54 条)

**字段** (5): `Param1, Param2, SpecialOrderFinishDesc, SpecialOrderFinishID, SpecialOrderFinishType`

**首条记录摘要**:
```json
{
  "SpecialOrderFinishID": 10101,
  "SpecialOrderFinishType": "ProfitGreater",
  "Param1": 2200,
  "SpecialOrderFinishDesc": {
    "Hash": 12088865336407545888
  }
}
```

### ActivityDiceV2TacticsCard.json (0.01 MB, 24 条)

**字段** (10): `CCMBLCMCIPD, DODGNGAGMMG, GMPGDEINODK, MJPKBIGCFOM, NMAHGFAPENI, OENAMINOLLF, PBLPLDJKPEI, PGAMJHMNLLN, PHFMCACHFIJ, PMIEAEGJNMJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 42001,
  "MJPKBIGCFOM": "SpriteOutput/Quest/DiceCombat/V2/Tactics...",
  "OENAMINOLLF": {
    "Hash": 17653952083116766941
  },
  "NMAHGFAPENI": {
    "Hash": 5382110620606506229
  },
  "PGAMJHMNLLN": [],
  "GMPGDEINODK": "Attack",
  "PMIEAEGJNMJ": 1,
  "DODGNGAGMMG": 2,
  "CCMBLCMCIPD": 42001,
  "PBLPLDJKPEI": [
    3
  ]
}
```

### AvatarDemoGuideGroup.json (0.01 MB, 98 条)

**字段** (3): `AvatarID, IndexList, StageID`

**首条记录摘要**:
```json
{
  "AvatarID": 1013,
  "StageID": 310130,
  "IndexList": [
    0,
    1
  ]
}
```

### ActivityRaidCollection.json (0.01 MB, 66 条)

**字段** (5): `GuideID, PrepareType, RaidCollectionID, RaidID, SubMissionID`

**首条记录摘要**:
```json
{
  "RaidCollectionID": 10101,
  "RaidID": 4430113,
  "PrepareType": "DirectStart",
  "SubMissionID": 802021301,
  "GuideID": 6064
}
```

### ActivitySummonGroup.json (0.01 MB, 5 条)

**字段** (25): `ActivityModuleID, AvatarSkillList, BackgroundTrashImageList, Desc, EntranceID, GotoID, GroupID, ImagePath, MappingInfo, MasterImagePath, MazeBuffID, MiniImagePath, MonsterDesc, MonsterEventID, MonsterImagePath, MonsterMiddleIcon, MonsterName, MonsterSkillDescList, MonsterSkillList, OriginalDesc, OriginalImagePath, OriginalMiniImagePath, OriginalStageName, StageName, SubMissionID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "ActivityModuleID": 5002001,
  "MonsterName": {
    "Hash": 10444118461571719412
  },
  "MonsterDesc": {
    "Hash": 9579777602227446229
  },
  "AvatarSkillList": [
    1001,
    1002
  ],
  "MonsterSkillList": [
    1003,
    1004
  ],
  "MonsterEventID": 96103,
  "MonsterSkillDescList": "<list[2]>",
  "OriginalStageName": {
    "Hash": 14817410839684929265
  },
  "StageName": {
    "Hash": 9991887162142716519
  },
  "OriginalDesc": {
    "Hash": 5108442549992631232
  },
  "Desc": {
    "Hash": 5674033553188944512
  },
  "GotoID": 30010,
  "MappingInfo": 2431,
  "EntranceID": 1010111,
  "SubMissionID": 802420201,
  "BackgroundTrashImageList": "<list[4]>",
  "MonsterMiddleIcon": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MasterImagePath": "<list[2]>",
  "MonsterImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Pos...",
  "OriginalImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "ImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "OriginalMiniImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MiniImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MazeBuffID": 3200029
}
```

### ActivityAvatarPromotionLD.json (0.01 MB, 42 条)

**字段** (7): `AttackBase, AvatarID, BaseAggro, HPBase, MaxLevel, Promotion, PromotionCostList`

**首条记录摘要**:
```json
{
  "AvatarID": 6036,
  "PromotionCostList": [],
  "MaxLevel": 20,
  "AttackBase": {
    "Value": 40
  },
  "HPBase": {
    "Value": 600
  },
  "BaseAggro": {
    "Value": 125
  }
}
```

### AvatarServantConfig.json (0.01 MB, 7 条)

**字段** (21): `AIPath, ActionServantHeadIconPath, Aggro, Config, HPBase, HPInherit, HPSkill, HeadIcon, ManikinJsonPath, Prefab, ServantID, ServantMiniIconPath, ServantName, ServantSideIconPath, SkillIDList, SpeedBase, SpeedInherit, SpeedSkill, UIServantModelPath, UnCreateHeadIconPath, WaitingServantHeadIconPath`

**首条记录摘要**:
```json
{
  "ServantID": 11402,
  "ServantName": {
    "Hash": 977300310163143285
  },
  "HeadIcon": "SpriteOutput/ServantRoundIcon/11402.png",
  "UnCreateHeadIconPath": "SpriteOutput/ServantIconTeam/11402E.png",
  "WaitingServantHeadIconPath": "SpriteOutput/ServantIconTeam/11402.png",
  "ActionServantHeadIconPath": "SpriteOutput/ServantIconTeam/11402B.png",
  "ServantSideIconPath": "SpriteOutput/ServantIconTeam/11402.png",
  "ServantMiniIconPath": "SpriteOutput/ServantMiniIcon/11402.png",
  "Config": "Config/ConfigCharacter/Servant/Servant_A...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "Prefab": "Characters/CharacterPrefabs/Servant/Agla...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Servant/M...",
  "UIServantModelPath": "Characters/CharacterPrefabs/Manikin/Serv...",
  "SkillIDList": [
    1140201,
    1140203,
    1140205,
    1140206
  ],
  "HPBase": "#6",
  "HPInherit": "#5",
  "HPSkill": 140204,
  "SpeedBase": "0",
  "SpeedInherit": "#4",
  "SpeedSkill": 140204,
  "Aggro": {
    "Value": 125
  }
}
```

### AvatarBaseType.json (0.01 MB, 10 条)

**字段** (12): `BaseTypeDesc, BaseTypeIcon, BaseTypeIconMiddle, BaseTypeIconPathTalk, BaseTypeIconSmall, BaseTypeText, BgPath, Equipment3DTgaPath, EquipmentLightMatPath, FirstWordText, ID, LightConeCardBackImagePath`

**首条记录摘要**:
```json
{
  "ID": "Warrior",
  "BaseTypeIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BaseTypeIconMiddle": "SpriteOutput/ProfessionIconMiddle/IconPr...",
  "BaseTypeIconSmall": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "EquipmentLightMatPath": "UI/UI_Texture/System/ProfessionalLight/U...",
  "Equipment3DTgaPath": "UI/UI3D/LightCone/_dependencies/Textures...",
  "BaseTypeIconPathTalk": "SpriteOutput/TalkIcon/ProfessionIcon/Ico...",
  "BgPath": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "LightConeCardBackImagePath": "SpriteOutput/LightConeFigures/DecoLightC...",
  "BaseTypeText": {
    "Hash": 10116566940563878966
  },
  "BaseTypeDesc": {
    "Hash": 1812126894190082015
  },
  "FirstWordText": "Destruction"
}
```

### AllowedTextLanguage.json (0.01 MB, 13 条)

**字段** (19): `CondensedFont, CondensedFontName, Ellipsis, Font, FontGrowSize, FontName, LanguageCultureCode, LanguageType, LogoImgPath, NoLeading, NoWrap, PSFont, PSFontName, ReplaceSpaceWithNBSPInRuby, RubyStrRatio, SDKkey, ShowString, TextLanguageKey, TextureScale`

**首条记录摘要**:
```json
{
  "TextLanguageKey": "cn",
  "SDKkey": "zh-cn",
  "LanguageType": 1,
  "ShowString": {
    "Hash": 8738820964772992783
  },
  "Font": "SpriteOutput/UI/Fonts/RPG_CN.ttf",
  "PSFont": "SpriteOutput/UI/Fonts/RPG_CN_Playstation...",
  "CondensedFont": "SpriteOutput/UI/Fonts/RPG_CN_Condensed.t...",
  "FontName": "RPG_CN",
  "PSFontName": "RPG_CN_Playstation",
  "CondensedFontName": "RPG_CN_Condensed",
  "LogoImgPath": "SpriteOutput/UI/Login/LOGO/LogoCB1_CN_Wh...",
  "LanguageCultureCode": "zh-CN",
  "NoLeading": "，。、；：？！-…—）｝〕】》〉」』”‧~]>%",
  "Ellipsis": "…",
  "NoWrap": true,
  "FontGrowSize": 256,
  "TextureScale": 1.5,
  "RubyStrRatio": 0.65
}
```

### ActivityAvatarDemo.json (0.01 MB, 72 条)

**字段** (2): `ActivityID, TypeParam`

**首条记录摘要**:
```json
{
  "ActivityID": 20001,
  "TypeParam": [
    311020,
    311060,
    311090,
    311050
  ]
}
```

### ActivityRaidCollectionGroup.json (0.01 MB, 24 条)

**字段** (6): `GroupEntrancePrefabPath, RaidCollectionGroupID, RaidCollectionGroupName, RaidCollectionGroupNextEnable, RaidCollectionList, UnlockGroupID`

**首条记录摘要**:
```json
{
  "RaidCollectionGroupID": 101,
  "RaidCollectionList": [
    10104,
    10101
  ],
  "RaidCollectionGroupNextEnable": true,
  "RaidCollectionGroupName": {
    "Hash": 15164838755741499474
  },
  "GroupEntrancePrefabPath": "UI/MiniGame/Widget/BtnMiniGameSpace/BtnM..."
}
```

### AvatarDefaultMazeBuff.json (0.01 MB, 94 条)

**字段** (3): `DefaultMazeBuffIDList, ID, SkillIndex`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "SkillIndex": 2,
  "DefaultMazeBuffIDList": [
    100101
  ]
}
```

### AvatarEquipRecommend.json (0.01 MB, 94 条)

**字段** (2): `AvatarID, EquipmentList`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "EquipmentList": [
    21002,
    23005,
    24002
  ]
}
```

### ActivityQuestRewardTab.json (0.01 MB, 48 条)

**字段** (3): `QuestTabGroupID, QuestTabGroupName, QuestTabList`

**首条记录摘要**:
```json
{
  "QuestTabGroupID": 5000701,
  "QuestTabGroupName": {
    "Hash": 13747580877814280336
  },
  "QuestTabList": [
    10001,
    10002
  ]
}
```

### ActivityDiceSkillCutin.json (0.01 MB, 33 条)

**字段** (4): `BDACPPLKLGL, KJCGGEPHCMC, OENAMINOLLF, OLOIFNNLKJP`

**首条记录摘要**:
```json
{
  "KJCGGEPHCMC": 1,
  "BDACPPLKLGL": "UI/Quest/DiceCombat/DiceCombatBattleComB...",
  "OLOIFNNLKJP": "SpriteOutput/Quest/DiceCombat/BuffIcon/I...",
  "OENAMINOLLF": {
    "Hash": 14310684675150578273
  }
}
```

### ActivityRogueAreaOverride.json (0.01 MB, 35 条)

**字段** (5): `RecommendLevel, RecommendSkillTreePoints, RogueAreaID, ScoreMap, WorldLevel`

**首条记录摘要**:
```json
{
  "RogueAreaID": 10100,
  "ScoreMap": "<dict[7]>",
  "RecommendLevel": 30
}
```

### ActivityFarmMultipleDrop.json (0.01 MB, 14 条)

**字段** (15): `ActivityModuleID, ActivityPanelBannerText, ActivityThemeID, BannerText, CountRefreshType, CountValue, DropMultiple, HintText, ID, LabelText, MappingInfoBannerText, MultipleDropTypeList, NameText, Priority, Type`

**首条记录摘要**:
```json
{
  "ID": 20001,
  "Type": "PlayerReturn",
  "MultipleDropTypeList": [
    "COCOON",
    "COCOON3"
  ],
  "DropMultiple": 2,
  "CountRefreshType": "DailyRefresh",
  "CountValue": 12,
  "Priority": 1,
  "HintText": {
    "Hash": 1559816358954517786
  },
  "LabelText": {
    "Hash": 17588482903246929210
  },
  "NameText": {
    "Hash": 5930623120954227677
  },
  "BannerText": {
    "Hash": 5541302298257535586
  },
  "ActivityPanelBannerText": {
    "Hash": 15991531075507224897
  },
  "MappingInfoBannerText": {
    "Hash": 5116868865959589295
  }
}
```

### AvatarBreakDamage.json (0.01 MB, 101 条)

**字段** (2): `BreakBaseDamage, Level`

**首条记录摘要**:
```json
{
  "Level": 1,
  "BreakBaseDamage": {
    "Value": 54
  }
}
```

### ActivityStarFightGroup.json (0.01 MB, 15 条)

**字段** (12): `ActivityModuleID, ElementList, EvaluateWave, GroupID, GroupPicPath, GroupTitle, MazeBuffID, PerfectQuest, PerfectWave, Season, TrialAvatar, TutorialGuideID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "GroupTitle": {
    "Hash": 7721243581042398709
  },
  "Season": "Season230",
  "MazeBuffID": 3109001,
  "GroupPicPath": "SpriteOutput/UI/Quest/Challenge/IconStar...",
  "PerfectQuest": 6026150,
  "PerfectWave": 6,
  "ActivityModuleID": 5001601,
  "EvaluateWave": [
    6,
    5,
    4,
    3
  ],
  "TutorialGuideID": 8150,
  "TrialAvatar": [
    3231310,
    3238005,
    3238006
  ],
  "ElementList": [
    "Fire",
    "Quantum"
  ]
}
```

### AtlasUnlockData.json (0.01 MB, 49 条)

**字段** (3): `Conditions, ShowCondition, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 70001,
  "Conditions": "<list[1]>",
  "ShowCondition": []
}
```

### AlleyGrid.json (0.01 MB, 29 条)

**字段** (8): `GridDesc, GridID, GridIcon, GridTitle, GridType, RelatedEventID, RelatedMainMission, ShopInfoIcon`

**首条记录摘要**:
```json
{
  "GridID": 101,
  "GridType": "Shop",
  "GridTitle": {
    "Hash": 3633119828727153617
  },
  "GridIcon": "SpriteOutput/Quest/Alley/AlleyMapIcon/Al...",
  "GridDesc": {
    "Hash": 8935585156155265696
  },
  "ShopInfoIcon": "SpriteOutput/Quest/Alley/AlleyMapIcon/Al..."
}
```

### AetherDivideMonster.json (0.01 MB, 36 条)

**字段** (4): `MonsterID, MonsterType, SPMax, UltraSkillCutInPrefabPath`

**首条记录摘要**:
```json
{
  "MonsterID": 7002040,
  "MonsterType": "Machine",
  "SPMax": {
    "Value": 2
  },
  "UltraSkillCutInPrefabPath": "UI/Battle/AetherDivide/ADCutin/AetherDiv..."
}
```

### ActivityHipplenGameConfig.json (0.01 MB, 43 条)

**字段** (4): `BLKFELPDINH, GMPGDEINODK, IHDKMCABFBO, LLGEOLMFMAB`

**首条记录摘要**:
```json
{
  "LLGEOLMFMAB": 1,
  "IHDKMCABFBO": 1,
  "BLKFELPDINH": "Config/Gameplays/Hipplen/MiniGame/Hipple..."
}
```

### ActivityDiceGlossary.json (0.01 MB, 28 条)

**字段** (4): `NMAHGFAPENI, OENAMINOLLF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OLOIFNNLKJP": "SpriteOutput/Quest/DiceCombat/BuffIcon/I...",
  "OENAMINOLLF": {
    "Hash": 11189837582726677656
  },
  "NMAHGFAPENI": {
    "Hash": 9766982246481187120
  }
}
```

### AreaMapConfig.json (0.01 MB, 44 条)

**字段** (7): `Desc, ID, IsUnlockAfterEnter, MapSpaceType, MenuIconID, MenuSortID, Name`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "Name": {
    "Hash": 1267322278
  },
  "Desc": {
    "Hash": -1759685348
  },
  "MenuSortID": 1,
  "MenuIconID": 1
}
```

### ActivityFightConfig.json (0.01 MB, 33 条)

**字段** (10): `ActivityFightGroupID, DifficultyLevel, FightEventID, OffsetLevel, RewardID, RewardQuest, RewardWave, RewardWave2, RoundsLimit, TotalWave`

**首条记录摘要**:
```json
{
  "ActivityFightGroupID": 10006,
  "DifficultyLevel": "Easy",
  "FightEventID": 303004,
  "RewardID": 3100011,
  "RewardWave": 2,
  "RoundsLimit": 3,
  "OffsetLevel": 2
}
```

### AlleyDeskTalk.json (0.01 MB, 32 条)

**字段** (7): `CustomString, TalkID, TalkPriority, TalkType, TalkTypeParam, TalkWeight, TextIDList`

**首条记录摘要**:
```json
{
  "TalkID": 9801,
  "TalkTypeParam": "8003201",
  "TalkPriority": 100,
  "TalkWeight": 100,
  "TextIDList": "800329801",
  "CustomString": "AlleyDeskTalk_Talk"
}
```

### ActivityQuestRewardConfig.json (0.01 MB, 45 条)

**字段** (4): `ActivityModule, ActivityRewardID, FinalRewardQuest, QuestTabGroupList`

**首条记录摘要**:
```json
{
  "ActivityRewardID": 50007,
  "QuestTabGroupList": [
    5000701
  ],
  "FinalRewardQuest": 6017102,
  "ActivityModule": 5000701
}
```

### ActivityDiceEffect.json (0.01 MB, 16 条)

**字段** (9): `BBDAFOAINPD, BDACPPLKLGL, CGANPPICDAM, CLCFMLOGBAN, HAEBLLPPDHO, HPLKADFDFAI, KIPAGNCANAJ, KOIJMGCHFII, NIDFIGFJJLL`

**首条记录摘要**:
```json
{
  "NIDFIGFJJLL": 1,
  "BDACPPLKLGL": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "KOIJMGCHFII": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "CGANPPICDAM": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "HAEBLLPPDHO": "UI/UI3D/DiceCombat/_dependencies/Effect/...",
  "HPLKADFDFAI": "TargetSide",
  "KIPAGNCANAJ": 2.5,
  "BBDAFOAINPD": "",
  "CLCFMLOGBAN": ""
}
```

### ActivityFeverTimeConfig.json (0.01 MB, 6 条)

**字段** (19): `ActivityModuleID, EventID, ExtraEffectID, FeverTimeID, ImagePath, LevelDes1, MonsterList, P1AvailableBuffList, P2AvailableBuffList, P3MazeBuffID, QuestGroupID, RecommadNature, SpecialAvatarList, StageName, TutorialGuideGroupID, UIEnterBattleAreaID, WaveMonsterList_1, WaveMonsterList_2, WaveMonsterList_3`

**首条记录摘要**:
```json
{
  "FeverTimeID": 1,
  "ActivityModuleID": 5001001,
  "EventID": 415003,
  "P1AvailableBuffList": [
    3107202,
    3107203
  ],
  "P2AvailableBuffList": [
    3107204,
    3107205
  ],
  "P3MazeBuffID": [
    3107201
  ],
  "SpecialAvatarList": "<list[5]>",
  "ImagePath": "SpriteOutput/UI/Quest/FeverTime/Buff/Ico...",
  "StageName": {
    "Hash": 1636215138976477220
  },
  "LevelDes1": {
    "Hash": 8869742209654751382
  },
  "MonsterList": [
    801301018,
    300301001,
    302402002
  ],
  "WaveMonsterList_1": "<list[4]>",
  "WaveMonsterList_2": "<list[5]>",
  "WaveMonsterList_3": "<list[5]>",
  "QuestGroupID": 3,
  "RecommadNature": [
    "Thunder",
    "Wind"
  ],
  "UIEnterBattleAreaID": 2000301,
  "TutorialGuideGroupID": 8093
}
```

### ActivityBannerComMission.json (0.01 MB, 12 条)

**字段** (11): `ActivityModuleID, AvatarIDList, BannerID, MainImagePath, MainMissionIDList, ShortDesc, SortID, SubImagePath, SubTitle, Title, UnlockMissionList`

**首条记录摘要**:
```json
{
  "BannerID": 101,
  "AvatarIDList": [
    1209
  ],
  "SortID": 1,
  "MainMissionIDList": [
    2020313
  ],
  "UnlockMissionList": [],
  "Title": {
    "Hash": 16652188612472577220
  },
  "SubTitle": {
    "Hash": 9920216309712098685
  },
  "ShortDesc": {
    "Hash": 18128138738965641136
  },
  "MainImagePath": "SpriteOutput/Quest/Colleague/ColleagueFi...",
  "SubImagePath": "",
  "ActivityModuleID": 2200101
}
```

### ActivityRogueAreaConfig.json (0.01 MB, 5 条)

**字段** (26): `ActivityModuleID, AreaEffectIDList, AreaID, BattleAreaGroupID, BattleAreaID, Describe, DisplayMapID, DisplayMonster, DisplayMonster2, Endless_GamePlay, EventID, FigurePath, FigurePath2, FloorID, GamePlay_1, GamePlay_2, GamePlay_3, MazeBuffIDList, MiracleEffectIDList, ParamList_1, ParamList_2, ParamList_3, PlaneID, QuestIDList, StageID, TargetParamList`

**首条记录摘要**:
```json
{
  "AreaID": 10100,
  "ActivityModuleID": 6000601,
  "StageID": 307101,
  "QuestIDList": [
    6040001,
    6040006,
    6040007,
    6040008
  ],
  "TargetParamList": [
    30000,
    40000,
    55000
  ],
  "EventID": 307101,
  "AreaEffectIDList": [
    1,
    14
  ],
  "Describe": {
    "Hash": 8419521258301430571
  },
  "FigurePath": "SpriteOutput/Rogue/Endless/BtnRogueEndle...",
  "FigurePath2": "SpriteOutput/Rogue/Endless/BtnRogueEndle...",
  "MazeBuffIDList": [],
  "MiracleEffectIDList": [
    2007,
    2008
  ],
  "DisplayMapID": 10001,
  "DisplayMonster": "<dict[4]>",
  "DisplayMonster2": {
    "1004022": 7
  },
  "GamePlay_1": {
    "Hash": 15651020128205506563
  },
  "ParamList_1": [],
  "GamePlay_2": {
    "Hash": 13274810423414975690
  },
  "ParamList_2": [],
  "GamePlay_3": {
    "Hash": 3208054184063596682
  },
  "ParamList_3": [],
  "PlaneID": 80301,
  "FloorID": 80301001,
  "BattleAreaGroupID": 11,
  "BattleAreaID": 1,
  "Endless_GamePlay": {
    "Hash": 8639076121250013241
  }
}
```

### AvatarConfigEnhanced.json (0.01 MB, 10 条)

**字段** (7): `AIPath, AvatarID, EnhancedID, JsonPath, RankIDList, SPNeed, SkillList`

**首条记录摘要**:
```json
{
  "AvatarID": 1212,
  "EnhancedID": 1,
  "JsonPath": "Config/ConfigCharacter/Avatar/Advanced/A...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "SPNeed": {
    "Value": 140
  },
  "RankIDList": "<list[6]>",
  "SkillList": "<list[7]>"
}
```

### ActivityDiceV2Opponent.json (0.00 MB, 6 条)

**字段** (12): `DOEJKEGCHIG, ELAIIFMNEHD, EPBIIPGGHIJ, FNFACKPFNKL, GFLNPPIFGGE, HBAEOBMGAOO, HOHLFFPPBON, JPBADMFEFKL, KANFOJDEPME, OBCPCPLBIGP, OOLEAPLDIEA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "HBAEOBMGAOO": "SpriteOutput/Quest/DiceCombat/V2/AvatarF...",
  "DOEJKEGCHIG": "SpriteOutput/Quest/DiceCombat/V2/AvatarF...",
  "OOLEAPLDIEA": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "FNFACKPFNKL": "SpriteOutput/Quest/DiceCombat/V2/AvatarF...",
  "OBCPCPLBIGP": {
    "Hash": 13451424002695636177
  },
  "KANFOJDEPME": {
    "Hash": 16606190537932731777
  },
  "JPBADMFEFKL": {
    "Hash": 12577823432645958308
  },
  "GFLNPPIFGGE": {
    "Hash": 1534731061856939826
  },
  "EPBIIPGGHIJ": "SpriteOutput/Quest/DiceCombat/V2/Logo/Di...",
  "HOHLFFPPBON": "SpriteOutput/Quest/DiceCombat/V2/Logo/Di...",
  "ELAIIFMNEHD": {
    "Hash": 16014589389872412704
  }
}
```

### ActivityDiceRuleGroup.json (0.00 MB, 68 条)

**字段** (2): `ID, RuleList`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "RuleList": [
    2
  ]
}
```

### ActivitySummonLevel.json (0.00 MB, 10 条)

**字段** (10): `BattleTargetList, DifficultyLevel, EventID, GroupID, ImagePath, MasterAvatarList, ReplaceMasterAvatarList, ReplaceTrialAvatarList, TrialAvatarList, UIEnterBattleAreaID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "DifficultyLevel": "Easy",
  "EventID": 421001,
  "BattleTargetList": [
    5001201
  ],
  "MasterAvatarList": [
    3248001,
    3248002
  ],
  "ReplaceMasterAvatarList": [],
  "TrialAvatarList": [
    3241104
  ],
  "ReplaceTrialAvatarList": [
    1104
  ],
  "UIEnterBattleAreaID": 2011101,
  "ImagePath": "SpriteOutput/Quest/Television/Television..."
}
```

### ActivityDiceV2PVPTitle.json (0.00 MB, 17 条)

**字段** (7): `JPLIONFJGCL, LKMNEALKDLO, NALMBOOCCIN, NJPLBONOODI, OFGKEMCCMIM, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OFGKEMCCMIM": {
    "Hash": 8762910082980530210
  },
  "LKMNEALKDLO": {
    "Hash": 16105799507697469125
  },
  "NJPLBONOODI": "AttackPointGreaterEqual",
  "PBLPLDJKPEI": [
    0
  ],
  "NALMBOOCCIN": 1,
  "JPLIONFJGCL": "Blue"
}
```

### AlleyMission.json (0.00 MB, 48 条)

**字段** (5): `EventEffect, IsMissionTrack, IsUrgent, MissionID, NextMission`

**首条记录摘要**:
```json
{
  "MissionID": 8003201,
  "IsMissionTrack": true,
  "EventEffect": [
    11,
    12,
    101,
    201
  ],
  "NextMission": 8003202
}
```

### ActivityConstantPunkLord.json (0.00 MB, 37 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "PunkLord_Search_Count",
  "Value": {
    "IntValue": 3
  }
}
```

### AvatarEnhancedSkillTree.json (0.00 MB, 25 条)

**字段** (6): `AvatarID, Comment01, CommentIndex, DescAfter, DescBefore, SkillTreeID`

**首条记录摘要**:
```json
{
  "SkillTreeID": 11212101,
  "AvatarID": 1212,
  "DescBefore": {
    "Hash": 15132587144041687961
  },
  "DescAfter": {
    "Hash": 521744979223549073
  }
}
```

### AchievementSeries.json (0.00 MB, 9 条)

**字段** (8): `CopperIconPath, GoldIconPath, IconPath, MainIconPath, Priority, SeriesID, SeriesTitle, SilverIconPath`

**首条记录摘要**:
```json
{
  "SeriesID": 1,
  "SeriesTitle": {
    "Hash": 10688429699583087549
  },
  "MainIconPath": "SpriteOutput/Achievement/CultivateAchiev...",
  "IconPath": "SpriteOutput/Achievement/CultivateAchiev...",
  "GoldIconPath": "SpriteOutput/Achievement/LevelTypeIcon/C...",
  "SilverIconPath": "SpriteOutput/Achievement/LevelTypeIcon/C...",
  "CopperIconPath": "SpriteOutput/Achievement/LevelTypeIcon/C...",
  "Priority": 9
}
```

### ActivityQuestTimeLimitGroup.json (0.00 MB, 11 条)

**字段** (9): `ActivityID, ActivityModuleID, Desc, EnName, FigurePath, Name, QuestList, QuestTimeLimitGroupID, UIPanelType`

**首条记录摘要**:
```json
{
  "QuestTimeLimitGroupID": 1,
  "QuestList": "<list[5]>",
  "Name": {
    "Hash": 17406201981466799149
  },
  "EnName": {
    "Hash": 5161760566809900183
  },
  "FigurePath": "SpriteOutput/Quest/ActivityQuestTimeLimi...",
  "UIPanelType": "FirstDream",
  "ActivityModuleID": 3001001,
  "ActivityID": 30010
}
```

### ActivityDiceTypeConfig.json (0.00 MB, 4 条)

**字段** (12): `BDACPPLKLGL, BFJGHPDNIOI, CILPGJAFCOK, HLMCIPNJIHM, JACANFAMGBO, JBNNNICBNFE, LNPCPJCEMHL, MBNNCBAAHFC, NAODLBMKJKN, OLOIFNNLKJP, PBFMMOGEBAK, PNIDDEEJPCI`

**首条记录摘要**:
```json
{
  "PBFMMOGEBAK": "D4",
  "MBNNCBAAHFC": [
    60,
    -16,
    -48
  ],
  "OLOIFNNLKJP": "SpriteOutput/Quest/DiceCombat/CardDiceIt...",
  "BFJGHPDNIOI": "",
  "BDACPPLKLGL": "UI/UI3D/DiceCombat/_dependencies/DiceMod...",
  "JACANFAMGBO": "SpriteOutput/UI/Quest/DiceCombat/BattleD...",
  "HLMCIPNJIHM": "Stages/ActivityProp/ActivityProp_DiceBat...",
  "NAODLBMKJKN": "Stages/ActivityProp/ActivityProp_DiceBat...",
  "PNIDDEEJPCI": "Stages/ActivityProp/ActivityProp_DiceBat...",
  "JBNNNICBNFE": "Stages/ActivityProp/ActivityProp_DiceBat...",
  "CILPGJAFCOK": "SpriteOutput/Quest/DiceCombat/V2/DiceIco...",
  "LNPCPJCEMHL": ""
}
```

### AtlasUnlockTextmap.json (0.00 MB, 49 条)

**字段** (2): `UnlockDesc, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 70001,
  "UnlockDesc": {
    "Hash": 6465342970467533940
  }
}
```

### ActivityHipplenFinishWay.json (0.00 MB, 22 条)

**字段** (8): `FinishType, ID, ParamInt1, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

**首条记录摘要**:
```json
{
  "ID": 2101,
  "FinishType": "HipplenWorkTypeFinish",
  "ParamType": "Equal",
  "ParamInt1": 1,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 4
}
```

### ActivityLoginConfig.json (0.00 MB, 27 条)

**字段** (3): `ActivityModuleID, ID, RewardList`

**首条记录摘要**:
```json
{
  "ID": 1002,
  "RewardList": "<list[7]>",
  "ActivityModuleID": 1001402
}
```

### ActivityHipplenInteractProp.json (0.00 MB, 12 条)

**字段** (8): `ID, IconPath, LikeType, Name, SmallIconPath, StringParam, UnlockCycleID, UnlockPhaseID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 10695112801846710130
  },
  "IconPath": "SpriteOutput/Quest/Hipplen/InteractIcon/...",
  "SmallIconPath": "SpriteOutput/Quest/Hipplen/InteractIcon/...",
  "StringParam": "Red",
  "LikeType": "Dislike",
  "UnlockCycleID": 2,
  "UnlockPhaseID": 2
}
```

### AvatarRelicRecommendLD.json (0.00 MB, 4 条)

**字段** (10): `AvatarID, PropertyList, PropertyList3, PropertyList4, PropertyList5, PropertyList6, ScoreRankList, Set2IDList, Set4IDList, SubAffixPropertyList`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "Set4IDList": [
    126,
    131,
    122
  ],
  "Set2IDList": [
    328,
    306,
    301
  ],
  "PropertyList3": "<list[2]>",
  "PropertyList4": [
    "AttackAddedRatio",
    "SpeedDelta"
  ],
  "PropertyList5": [
    "WindAddedRatio",
    "AttackAddedRatio"
  ],
  "PropertyList6": [
    "AttackAddedRatio",
    "SPRatioBase"
  ],
  "PropertyList": "<list[4]>",
  "SubAffixPropertyList": "<list[4]>",
  "ScoreRankList": [
    336,
    281
  ]
}
```

### AmphoreusCurioUIConfig.json (0.00 MB, 7 条)

**字段** (8): `Desc, ID, IconPath, Name, NameAfter, ReplyIDList, Tag, TextmapIDList`

**首条记录摘要**:
```json
{
  "ID": 301,
  "Name": {
    "Hash": 1934064472760108734
  },
  "NameAfter": {
    "Hash": 8564097544912950930
  },
  "Desc": {
    "Hash": 9232660100065886343
  },
  "IconPath": "SpriteOutput/Quest/MaterialSubmit/Amphor...",
  "ReplyIDList": [
    301001,
    301002,
    301003
  ],
  "TextmapIDList": "<list[3]>"
}
```

### ActivityRaidConfig.json (0.00 MB, 59 条)

**字段** (3): `ActivityModuleID, HardLevel, RaidID`

**首条记录摘要**:
```json
{
  "RaidID": 4000211,
  "ActivityModuleID": 5000105
}
```

### ActivityFightGroup.json (0.00 MB, 11 条)

**字段** (9): `ActivityFightGroupID, ActivityFightGroupIconPath, BattleAreaGroupID, BattleAreaID, FightStageDesc, FightStageTitle, FloorID, PlaneID, SpecialAvatarID`

**首条记录摘要**:
```json
{
  "ActivityFightGroupID": 10003,
  "FightStageTitle": {
    "Hash": 14346819517254208259
  },
  "FightStageDesc": {
    "Hash": 1435888487233335137
  },
  "ActivityFightGroupIconPath": "",
  "PlaneID": 20111,
  "FloorID": 20111001,
  "BattleAreaGroupID": 2,
  "BattleAreaID": 1
}
```

### AvatarEnhancedRank.json (0.00 MB, 20 条)

**字段** (6): `AvatarID, Comment01, CommentIndex, RankDescAfter, RankDescBefore, RankID`

**首条记录摘要**:
```json
{
  "RankID": 1121201,
  "AvatarID": 1212,
  "RankDescBefore": {
    "Hash": 8890317207791243058
  },
  "RankDescAfter": {
    "Hash": 7818755168355363031
  }
}
```

### AlleyEventEffect.json (0.00 MB, 36 条)

**字段** (4): `EventEffectID, EventEffectType, Param1, Param2`

**首条记录摘要**:
```json
{
  "EventEffectID": 11,
  "EventEffectType": "UnlockShip",
  "Param1": 1
}
```

### AvatarServantSkillLink.json (0.00 MB, 14 条)

**字段** (5): `LinkToAvatarID, Order, SkillID, TarotFigurePath, TarotIconPath`

**首条记录摘要**:
```json
{
  "SkillID": 1141513,
  "LinkToAvatarID": 8007,
  "TarotFigurePath": "SpriteOutput/UI/Avatar/Special/Special_1...",
  "TarotIconPath": "SpriteOutput/UI/Avatar/Special/Special_1...",
  "Order": 14
}
```

### ActivityDiceV2LuckControl.json (0.00 MB, 3 条)

**字段** (13): `APDKGPIBHCP, BKGBDEKBMAM, DJGJIPEMIGE, GCPIKDBKKHJ, HDJGBKABEKF, HMHGEJKHPJP, JAABDPEPHBF, JPOEFHLLNIK, MIECBNMEDGL, OGCDCMNMFIJ, OGDLLCOBDNB, OGEBAEGKHNO, PENMJDMOCKI`

**首条记录摘要**:
```json
{
  "GCPIKDBKKHJ": 1,
  "HDJGBKABEKF": [
    10,
    10,
    40,
    40
  ],
  "OGDLLCOBDNB": [
    5,
    10,
    10,
    20,
    25,
    30
  ],
  "DJGJIPEMIGE": [
    2,
    3,
    5,
    10,
    15,
    20,
    20,
    25
  ],
  "JPOEFHLLNIK": "<list[12]>",
  "JAABDPEPHBF": [
    10,
    10,
    40,
    40
  ],
  "PENMJDMOCKI": [
    5,
    10,
    10,
    20,
    25,
    30
  ],
  "HMHGEJKHPJP": [
    2,
    3,
    5,
    10,
    15,
    20,
    20,
    25
  ],
  "MIECBNMEDGL": "<list[12]>",
  "OGEBAEGKHNO": [
    40,
    40,
    10,
    10
  ],
  "OGCDCMNMFIJ": [
    30,
    25,
    20,
    10,
    10,
    5
  ],
  "BKGBDEKBMAM": [
    25,
    20,
    20,
    15,
    10,
    5,
    3,
    2
  ],
  "APDKGPIBHCP": "<list[12]>"
}
```

### AvatarTestPromotionConfig.json (0.00 MB, 455 条)

### AdvertisingBoardConfig.json (0.00 MB, 41 条)

**字段** (4): `AdvertisingBoardID, Interval, IsSwitch, VoiceID`

**首条记录摘要**:
```json
{
  "AdvertisingBoardID": 1001,
  "IsSwitch": true,
  "VoiceID": 100025128
}
```

### ActivityMultiplayerConfig.json (0.00 MB, 7 条)

**字段** (9): `ActivityID, ActivityModuleID, CardColor, CardImgPath, CompleteCondition, CurrentModuleID, DisplayModuleID, GuideVideoID, ProgramGroupID`

**首条记录摘要**:
```json
{
  "ActivityID": 50134,
  "ActivityModuleID": 5013401,
  "GuideVideoID": 50134,
  "CompleteCondition": "<list[1]>",
  "CurrentModuleID": 5013401,
  "DisplayModuleID": 5013402,
  "ProgramGroupID": 3007,
  "CardImgPath": "SpriteOutput/Train/OnlineGameEntrance/Ga...",
  "CardColor": "SpriteOutput/Train/OnlineGameEntrance/Ga..."
}
```

### ActivityDiceAvatarLevel.json (0.00 MB, 3 条)

**字段** (11): `Dice1FramePath, Dice1FramePathUI3D, Dice2FramePath, Dice2FramePathUI3D, Dice3FramePath, Dice3FramePathUI3D, Dice4FramePath, Dice4FramePathUI3D, FrontAndBackUI3DMatPath, ID, SideUI3DMatPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Dice1FramePath": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "Dice2FramePath": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "Dice3FramePath": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "Dice4FramePath": "SpriteOutput/Quest/DiceCombat/AvatarCard...",
  "Dice1FramePathUI3D": "SpriteOutput/Quest/DiceCombat/UI3DAvatar...",
  "Dice2FramePathUI3D": "SpriteOutput/Quest/DiceCombat/UI3DAvatar...",
  "Dice3FramePathUI3D": "SpriteOutput/Quest/DiceCombat/UI3DAvatar...",
  "Dice4FramePathUI3D": "SpriteOutput/Quest/DiceCombat/UI3DAvatar...",
  "FrontAndBackUI3DMatPath": "UI/UI3D/DiceCombat/_dependencies/Materia...",
  "SideUI3DMatPath": "UI/UI3D/DiceCombat/_dependencies/Materia..."
}
```

### ActivityModuleFindTrotter.json (0.00 MB, 7 条)

**字段** (12): `ActivityID, ActivityModuleID, Aim01, Aim02, FinishSubMissionID, MissionID, Order, Result01, Result02, RewardQuestID, StartSubMissionID, Title`

**首条记录摘要**:
```json
{
  "ActivityID": 30004,
  "Order": 1,
  "ActivityModuleID": 3000401,
  "MissionID": 8000181,
  "RewardQuestID": 6000082,
  "StartSubMissionID": 800018101,
  "FinishSubMissionID": 800018103,
  "Title": {
    "Hash": 2247649540931438718
  },
  "Aim01": {
    "Hash": 14613959298457380408
  },
  "Aim02": {
    "Hash": 2492419774334599461
  },
  "Result01": {
    "Hash": 9965053175502116107
  },
  "Result02": {
    "Hash": 16990420933057905260
  }
}
```

### ActivityDiceV2BossAdvice.json (0.00 MB, 22 条)

**字段** (3): `ACCJKGEKHKP, AEMNEJEHNKA, AOCDOMPGEKK`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 20301,
  "AEMNEJEHNKA": {
    "Hash": 14847338992275961723
  },
  "AOCDOMPGEKK": {
    "Hash": 3120231131919003629
  }
}
```

### ActivityItemConfigAvatarLD.json (0.00 MB, 6 条)

**字段** (14): `CustomDataList, ID, InventoryDisplayTag, ItemAvatarIconPath, ItemBGDesc, ItemCurrencyIconPath, ItemFigureIconPath, ItemIconPath, ItemMainType, ItemName, ItemSubType, PileLimit, Rarity, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 6036,
  "ItemMainType": "AvatarCard",
  "ItemSubType": "AvatarCard",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "ItemName": {
    "Hash": 12697036397308293697
  },
  "ItemBGDesc": {
    "Hash": 13828859094945502224
  },
  "ItemIconPath": "SpriteOutput/AvatarIcon/Avatar/1014.png",
  "ItemFigureIconPath": "SpriteOutput/AvatarIcon/Avatar/1014.png",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "SpriteOutput/AvatarShopIcon/Avatar/1014....",
  "PileLimit": 1,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### AetherDivideConstClient.json (0.00 MB, 19 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "AetherDivide_SpiritTypeAllIconPath",
  "Value": "<dict[1]>"
}
```

### ActivityRaidOrder.json (0.00 MB, 6 条)

**字段** (6): `OrderContent, OrderGoodList, OrderID, OrderShip, OrderTips, OrderTipsTime`

**首条记录摘要**:
```json
{
  "OrderID": 2001,
  "OrderContent": "<list[3]>",
  "OrderGoodList": [
    102,
    501,
    901
  ],
  "OrderShip": 1,
  "OrderTipsTime": [
    60,
    10,
    10,
    5
  ],
  "OrderTips": "SpriteOutput/Quest/Alley/AlleyCargoTips/..."
}
```

### AvatarTestStatusConfig.json (0.00 MB, 398 条)

### AlleyShop.json (0.00 MB, 10 条)

**字段** (5): `EnergyColor, ShopBox, ShopEnergy, ShopGoods, ShopID`

**首条记录摘要**:
```json
{
  "ShopID": 101,
  "ShopGoods": "<list[3]>",
  "ShopBox": 3,
  "ShopEnergy": 30,
  "EnergyColor": [
    6,
    11
  ]
}
```

### AetherDivideGymInfo.json (0.00 MB, 4 条)

**字段** (14): `ActivityModuleID, BGPath, BadgeUnlockID, ChallengeQuestList, Description, DisplayMonsterMap, EntranceID, ID, IconPath, Name, SpiritQuest, TabIconPath, TrainerQuest, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "EntranceID": 43103001,
  "ActivityModuleID": 5000501,
  "ChallengeQuestList": [
    6023603,
    6023601,
    6023602
  ],
  "Name": {
    "Hash": 13837478836491035809
  },
  "Description": {
    "Hash": 11423631224826730823
  },
  "IconPath": "SpriteOutput/UI/Quest/AetherDivide/IconG...",
  "TabIconPath": "SpriteOutput/UI/Quest/AetherDivide/IconG...",
  "BGPath": "SpriteOutput/Quest/AetherDivide/AetherDi...",
  "SpiritQuest": 6023601,
  "TrainerQuest": 6023602,
  "UnlockID": 100001,
  "BadgeUnlockID": 100006,
  "DisplayMonsterMap": "<dict[5]>"
}
```

### AvatarEnhancedHintConfig.json (0.00 MB, 10 条)

**字段** (9): `AvatarID, EnhancedDesc1, EnhancedDesc2, EnhancedDesc3, EnhancedDescNum, EnhancedID, PreviewModuleID, SeasonID, TrialStageID`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "AvatarID": 1212,
  "EnhancedID": 1,
  "TrialStageID": 312129,
  "PreviewModuleID": 5005101,
  "EnhancedDescNum": 3,
  "EnhancedDesc1": {
    "Hash": 16721654158508793793
  },
  "EnhancedDesc2": {
    "Hash": 3307626862647835362
  },
  "EnhancedDesc3": {
    "Hash": 16204654208129910433
  }
}
```

### ArtNPCFace.json (0.00 MB, 8 条)

**字段** (10): `ADAIMBJKPND, AMHCLPKEAAK, BEIFJFDOEND, CJNNJCBJOHP, DGFMCMDNJLC, EOPMMKLODKL, JNGDPJMPNKF, LICNLIMAGHF, MKFMPOOOHPI, PLBGKDFKCAA`

**首条记录摘要**:
```json
{
  "BEIFJFDOEND": "NPC_Full_W1_Male_Face_Oleg_Lod0",
  "PLBGKDFKCAA": 3,
  "ADAIMBJKPND": 5,
  "JNGDPJMPNKF": 0.15,
  "LICNLIMAGHF": 75,
  "DGFMCMDNJLC": [
    "Eye_WinkA",
    "Eye_WinkB"
  ],
  "CJNNJCBJOHP": [
    "Eye_WinkA",
    "Eye_WinkB"
  ],
  "EOPMMKLODKL": [
    10,
    90
  ],
  "AMHCLPKEAAK": "NPC_Full_W1_Male_Face_Oleg"
}
```

### ActivityDiceRankConfig.json (0.00 MB, 5 条)

**字段** (6): `DiceRankID, IconPath, IconSmallPath, Name, RankMaxScore, RuleGroupMapList`

**首条记录摘要**:
```json
{
  "DiceRankID": 1,
  "RankMaxScore": 499,
  "Name": {
    "Hash": 13775668994744105628
  },
  "IconPath": "SpriteOutput/Quest/DiceCombat/RankIcon/D...",
  "IconSmallPath": "SpriteOutput/Quest/DiceCombat/RankIcon/D...",
  "RuleGroupMapList": "<list[4]>"
}
```

### ActivityRewardRogueEndless.json (0.00 MB, 20 条)

**字段** (4): `RewardID, RewardLevel, RewardLevelName, RewardPoint`

**首条记录摘要**:
```json
{
  "RewardLevel": 1,
  "RewardPoint": 10000,
  "RewardID": 3103201,
  "RewardLevelName": {
    "Hash": 5394515654764321936
  }
}
```

### ActivityDiceV2Robot.json (0.00 MB, 17 条)

**字段** (5): `FIGEGOBFPIF, IBLFDGEHJBK, LCBCODGENJD, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FIGEGOBFPIF": 201308,
  "OENAMINOLLF": {
    "Hash": 15302882570557665677
  },
  "IBLFDGEHJBK": 264013,
  "LCBCODGENJD": 3
}
```

### AvatarMazeBuffLD.json (0.00 MB, 4 条)

**字段** (20): `BuffDesc, BuffDescBattle, BuffDescParamByAvatarSkillID, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, DisplayType, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffIconType, MazeBuffPool, MazeBuffType, ModifierName, ParamList, UseType`

**首条记录摘要**:
```json
{
  "ID": 101401,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_Maze_Saber",
  "InBattleBindingType": "CharacterSkill",
  "InBattleBindingKey": "SkillMaze",
  "ParamList": [],
  "BuffDescParamByAvatarSkillID": 101407,
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/Avatar/Ico...",
  "BuffName": {
    "Hash": 13558717196216530943
  },
  "BuffDesc": {
    "Hash": 6038227548647645091
  },
  "BuffDescBattle": {
    "Hash": 6038227548647645091
  },
  "BuffEffect": "MazeBuffEffect_101401",
  "MazeBuffType": "Character",
  "UseType": "AddBattleBuff",
  "MazeBuffIconType": "Other",
  "MazeBuffPool": 3,
  "DisplayType": "Fixed"
}
```

### ActivityTelevisionQuest.json (0.00 MB, 12 条)

**字段** (4): `OriginalTabName, QuestGroupID, QuestIDList, TabName`

**首条记录摘要**:
```json
{
  "QuestGroupID": 2,
  "QuestIDList": [
    6000702,
    6000708,
    6000709,
    6000710
  ],
  "OriginalTabName": {
    "Hash": 564222812804587114
  },
  "TabName": {
    "Hash": 7065980396933164140
  }
}
```

### AvatarAbilityStatistics.json (0.00 MB, 24 条)

**字段** (2): `AvatarID, ExtractionAbilityList`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "ExtractionAbilityList": "<list[1]>"
}
```

### ActionPointOverdraw.json (0.00 MB, 50 条)

**字段** (2): `ActionPoint, MazeBuff`

**首条记录摘要**:
```json
{
  "ActionPoint": -1,
  "MazeBuff": 643001
}
```

### ActivityPhotoExhibition.json (0.00 MB, 9 条)

**字段** (7): `ActivityModuleID, CommentList, Daily, GroupID, PhotoID, QuestID, Tab`

**首条记录摘要**:
```json
{
  "GroupID": 100,
  "ActivityModuleID": 5002501,
  "PhotoID": [
    100
  ],
  "CommentList": []
}
```

### AlleyMapEffect.json (0.00 MB, 16 条)

**字段** (6): `BuffOrDebuff, MapEffectID, MapEffectSubType, MapEffectTitle, Param1, Param2`

**首条记录摘要**:
```json
{
  "MapEffectID": 1,
  "MapEffectSubType": "BatteryIncrease",
  "MapEffectTitle": {
    "Hash": 13703195638818861675
  }
}
```

### ActivityDiceV2PVEStage.json (0.00 MB, 6 条)

**字段** (11): `BGDFEPFLGOC, CKOIGMMCPKH, DGHMGKCJAAF, GNCEJNFIOJP, GNDCCBNILML, HMFPPOIIKHL, LEIDKFJDHMM, LIIPLGLNPGB, PHFMCACHFIJ, PPCOMAHNFOL, PPEBOKHAFNL`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "PPEBOKHAFNL": "SpriteOutput/AvatarRoundIcon/Avatar/1006...",
  "HMFPPOIIKHL": "SpriteOutput/AvatarShopIcon/Avatar/1006....",
  "PPCOMAHNFOL": {
    "Hash": 9803355207077340360
  },
  "BGDFEPFLGOC": 264022,
  "CKOIGMMCPKH": 3,
  "LEIDKFJDHMM": 401,
  "DGHMGKCJAAF": 8018001,
  "LIIPLGLNPGB": 5,
  "GNCEJNFIOJP": "Config/Gameplays/LittleGame/DiceCombat/D...",
  "GNDCCBNILML": true
}
```

### ActivityLocalLegendGroup.json (0.00 MB, 5 条)

**字段** (9): `ActivityModuleID, ChallengeStrategy, GroupID, GroupPicPath, GroupTitle, StageMechanism, StageMechanismTitle, TeamBuildTip, TutorialGuideID`

**首条记录摘要**:
```json
{
  "GroupID": 2,
  "GroupTitle": {
    "Hash": 6364807751103641290
  },
  "ActivityModuleID": 5007001,
  "GroupPicPath": "SpriteOutput/UI/Quest/LocalLegend/Monste...",
  "TutorialGuideID": 10031,
  "StageMechanismTitle": {
    "Hash": 9473086513365140457
  },
  "StageMechanism": {
    "Hash": 12197968969099512763
  },
  "ChallengeStrategy": {
    "Hash": 15865408958142310871
  },
  "TeamBuildTip": {
    "Hash": 2498281780171583194
  }
}
```

### ActivityFinalityBattle.json (0.00 MB, 5 条)

**字段** (10): `ActivityModuleID, EntranceBigIconPath, EntranceSmallIconPath, GroupTitle, ID, LeadingRoleList, LevelList, Order, PerfectRound, TutorialGuideID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Order": 4,
  "LevelList": [
    100,
    101
  ],
  "GroupTitle": {
    "Hash": 1764044583014315243
  },
  "ActivityModuleID": 5012504,
  "LeadingRoleList": [
    3141310
  ],
  "PerfectRound": 2,
  "EntranceBigIconPath": "SpriteOutput/UI/Quest/FinalityBattle/Rol...",
  "EntranceSmallIconPath": "SpriteOutput/UI/Quest/FinalityBattle/Rol...",
  "TutorialGuideID": 10310
}
```

### AssistantTipsConfig.json (0.00 MB, 16 条)

**字段** (4): `Content, ParamList, TipsID, TipsRule`

**首条记录摘要**:
```json
{
  "TipsID": 101,
  "TipsRule": "ElfRestaurantTargetRecipe",
  "Content": {
    "Hash": 8322360841397471378
  },
  "ParamList": []
}
```

### AvatarCamp.json (0.00 MB, 21 条)

**字段** (4): `ID, IconPath, Name, SortID`

**首条记录摘要**:
```json
{
  "ID": 100,
  "SortID": 1,
  "Name": {
    "Hash": 12540279988938861890
  },
  "IconPath": ""
}
```

### ActivityHipplenTrial.json (0.00 MB, 12 条)

**字段** (4): `GameJson, ID, TrialTitle, Type`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "TrialTitle": {
    "Hash": 16482589459533608618
  },
  "GameJson": "Config/Gameplays/Hipplen/MiniGame/Hipple..."
}
```

### ActivityConstantSilverWolf.json (0.00 MB, 27 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "SilverWolf_Unlock_Missions",
  "Value": "1000401"
}
```

### ActivityRewardPunkLord.json (0.00 MB, 15 条)

**字段** (4): `RewardID, RewardLevel, RewardLevelName, RewardPoint`

**首条记录摘要**:
```json
{
  "RewardLevel": 1,
  "RewardLevelName": {
    "Hash": 7694098823670753908
  },
  "RewardPoint": 10000,
  "RewardID": 3200001
}
```

### AetherDivideActivityQuest.json (0.00 MB, 12 条)

**字段** (5): `ActivityModuleID, ID, Name, QuestList, TypeGroupID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "AetherDivideActivityQuest_Name_1",
  "TypeGroupID": 100,
  "QuestList": [
    6023201,
    6023202,
    6023203
  ],
  "ActivityModuleID": 5000501
}
```

### ActivityDiceCommunicate.json (0.00 MB, 21 条)

**字段** (4): `AABNPBGMOFN, GMPGDEINODK, OBLOHIGPEEP, PJJLNCANODD`

**首条记录摘要**:
```json
{
  "PJJLNCANODD": 1,
  "GMPGDEINODK": "Emoji",
  "OBLOHIGPEEP": 123002
}
```

### ActivityAvatarDeliverConfig.json (0.00 MB, 10 条)

**字段** (5): `AvatarID, MailDesc, Name, Sign, Sort`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "Name": {
    "Hash": 15083252084135114820
  },
  "MailDesc": {
    "Hash": 12537879773448511278
  },
  "Sign": {
    "Hash": 3878641218377086646
  },
  "Sort": 1
}
```

### AvatarDemoEntrance.json (0.00 MB, 6 条)

**字段** (5): `AvatarID, StageID, TrialRoleAvatarBackPath, TrialRoleAvatarFrontPath, TrialRoleAvatarPath`

**首条记录摘要**:
```json
{
  "AvatarID": 8005,
  "StageID": 380050,
  "TrialRoleAvatarPath": "SpriteOutput/TrialRole/TrialRoleBg/Trial...",
  "TrialRoleAvatarBackPath": "SpriteOutput/TrialRole/TrialRoleBg/Trial...",
  "TrialRoleAvatarFrontPath": "SpriteOutput/TrialRole/TrialRoleBg/Trial..."
}
```

### ActivityDicePresetConfig.json (0.00 MB, 6 条)

**字段** (8): `BIDDPFIKJLN, GBJGDOAAEKL, KECPLLBNNNA, KFNMJCJPNBK, LIIPLGLNPGB, NBKAKPMNIDF, NJINPDOKGPM, PLGOICOBHGA`

**首条记录摘要**:
```json
{
  "LIIPLGLNPGB": 1,
  "KFNMJCJPNBK": 101,
  "GBJGDOAAEKL": [],
  "NJINPDOKGPM": "Config/Gameplays/LittleGame/DiceCombat/S...",
  "BIDDPFIKJLN": "Config/Level/Tutorial/Tutorial_6701.json",
  "PLGOICOBHGA": {
    "Hash": 17019352841129318943
  },
  "NBKAKPMNIDF": "SpriteOutput/AvatarRoundIcon/Avatar/1306...",
  "KECPLLBNNNA": [
    804010002,
    804220003
  ]
}
```

### AdventurePlayerEnhanced.json (0.00 MB, 10 条)

**字段** (4): `EnhancedID, ID, MazeSkillIdList, PlayerJsonPath`

**首条记录摘要**:
```json
{
  "ID": 1212,
  "EnhancedID": 1,
  "PlayerJsonPath": "Config/ConfigCharacter/LocalPlayer/Local...",
  "MazeSkillIdList": [
    1121201,
    1121202
  ]
}
```

### ActivityHipplenInteractInfo.json (0.00 MB, 4 条)

**字段** (7): `Hint, IconPath, InAreaHint, JsonConfigPath, PrefabPath, PropIDList, Type`

**首条记录摘要**:
```json
{
  "JsonConfigPath": "Config/Gameplays/Hipplen/Interact/Activi...",
  "PrefabPath": "Gameplays/HipplenBuilder/Prefabs/Props/A...",
  "IconPath": "SpriteOutput/Quest/Hipplen/HipplenIntera...",
  "PropIDList": [
    7
  ],
  "Hint": {
    "Hash": 4461287943621143815
  },
  "InAreaHint": {
    "Hash": 14166228162895260002
  }
}
```

### ActivityHipplenClientConst.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "hipplen_Energy_Low",
  "Value": {
    "IntValue": 40
  }
}
```

### ActivityFeverTimeTutorial.json (0.00 MB, 12 条)

**字段** (3): `P2AvailableBuffID, RecommendAvatarList, TutorialID`

**首条记录摘要**:
```json
{
  "P2AvailableBuffID": 3107002,
  "TutorialID": 8101,
  "RecommendAvatarList": [
    1102,
    1208,
    1306,
    1202
  ]
}
```

### AlleyMapReward.json (0.00 MB, 19 条)

**字段** (4): `LayerID, MapScore, RewardID, ScoreID`

**首条记录摘要**:
```json
{
  "ScoreID": 101,
  "LayerID": "Low",
  "MapScore": 15,
  "RewardID": 8002002
}
```

### ActivityHipplenGameGoods.json (0.00 MB, 8 条)

**字段** (3): `BDACPPLKLGL, FBKAMIHGLFK, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "BDACPPLKLGL": "Gameplays/HipplenBuilder/Prefabs/Props/A...",
  "FBKAMIHGLFK": "SpriteOutput/Quest/Hipplen/FindGoods/Hip..."
}
```

### AdventurePlayerLD.json (0.00 MB, 4 条)

**字段** (7): `AvatarID, DefaultAvatarHeadIconPath, ID, MazeSkillIdList, PlayerJsonPath, PlayerName, PlayerPrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "AvatarID": 1014,
  "PlayerName": {
    "Hash": 5352897418621401134
  },
  "PlayerPrefabPath": "Characters/CharacterPrefabs/Player/Saber...",
  "PlayerJsonPath": "Config/ConfigCharacter/LocalPlayer/Local...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014.png",
  "MazeSkillIdList": [
    101401,
    101402
  ]
}
```

### AetherDivideChallengeRank.json (0.00 MB, 6 条)

**字段** (8): `ActivityModuleID, ChallengeRank, FunctionUnlockID, IconPath, IsHard, PreRank, TrainerLevel, UnlockText`

**首条记录摘要**:
```json
{
  "ChallengeRank": 1,
  "TrainerLevel": 1,
  "ActivityModuleID": 5000501,
  "IconPath": "SpriteOutput/UI/Quest/AetherDivide/Level...",
  "FunctionUnlockID": 100005,
  "UnlockText": {
    "Hash": 9860357024376327590
  }
}
```

### ActivityHipplenOutfit.json (0.00 MB, 17 条)

**字段** (6): `ColorName, IsDefault, ItemID, MaterialID, PartID, Type`

**首条记录摘要**:
```json
{
  "ItemID": 262000,
  "PartID": 1,
  "IsDefault": true,
  "ColorName": "Skin1"
}
```

### ActivityHipplenGift.json (0.00 MB, 9 条)

**字段** (4): `AEONKNDCDKN, LOGJBKBLNEM, MONJPEJECGL, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "AEONKNDCDKN": 314107,
  "MONJPEJECGL": {
    "Hash": 1271838528109719889
  },
  "LOGJBKBLNEM": {
    "Hash": 730154098405166495
  }
}
```

### ActivityDiceV2Brand.json (0.00 MB, 6 条)

**字段** (4): `ABJGONAEFCB, JCNCDOOLACB, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 17756246825362146169
  },
  "ABJGONAEFCB": "SpriteOutput/Quest/DiceCombat/V2/Logo/Di...",
  "JCNCDOOLACB": [
    3,
    8,
    15,
    20,
    26,
    36
  ]
}
```

### ActivityVersionBanner.json (0.00 MB, 20 条)

**字段** (3): `ActivityID, ChapterID, Type`

**首条记录摘要**:
```json
{
  "ActivityID": 80012,
  "Type": "Gap",
  "ChapterID": 103005
}
```

### AetherDivideTrainerLevel.json (0.00 MB, 5 条)

**字段** (6): `ID, IconPath, Name, QuestID, QuestList, RareMonsterNumID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 2058298033640881623
  },
  "IconPath": "SpriteOutput/UI/Quest/AetherDivide/Level...",
  "QuestID": 6023100,
  "RareMonsterNumID": 1,
  "QuestList": [
    6023000,
    6023001,
    6023002,
    6023003
  ]
}
```

### ActivityDiceV2TacticsPoint.json (0.00 MB, 8 条)

**字段** (5): `BDGECKGNFFM, BEEFBPGJJOD, KEGANNHEKHA, LOAGIPDPLFM, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "BEEFBPGJJOD": [],
  "BDGECKGNFFM": 2,
  "KEGANNHEKHA": {
    "Hash": 15504529651900913142
  }
}
```

### AvatarUltraSkillConfig.json (0.00 MB, 7 条)

**字段** (4): `AvatarID, UltraSkillResourcePath, UltraSkillType, UltraSkillUse`

**首条记录摘要**:
```json
{
  "AvatarID": 1308,
  "UltraSkillType": "SpecialSP",
  "UltraSkillResourcePath": "UI/Battle/Widget/SpecialUltraSP/UltraSPI...",
  "UltraSkillUse": {
    "Hash": 11234853928351196098
  }
}
```

### AvatarGlobalBuffConfig.json (0.00 MB, 2 条)

**字段** (16): `AvatarID, Desc, ExtraEffectIDList, GameModeBlackList, MazeBuffID, Name, ParamList, SimpleDesc, SimpleExtraEffectIDList, SimpleParamList, SkillID, SkillTag, StageTypeBlackList, TeamBlackList, TeamStageTypeBlackList, TrialBagStageTypeWhiteList`

**首条记录摘要**:
```json
{
  "AvatarID": 1407,
  "SkillID": 140704,
  "Name": {
    "Hash": 3729928132145580437
  },
  "SkillTag": {
    "Hash": 12601813654230214900
  },
  "Desc": {
    "Hash": 16078873302292030459
  },
  "SimpleDesc": {
    "Hash": 16866159443345519704
  },
  "ParamList": [
    {
      "Value": 0.1
    }
  ],
  "SimpleParamList": [],
  "ExtraEffectIDList": [
    10000007
  ],
  "SimpleExtraEffectIDList": [],
  "MazeBuffID": 140703,
  "GameModeBlackList": [
    14,
    15
  ],
  "StageTypeBlackList": [
    17,
    19,
    37
  ],
  "TeamStageTypeBlackList": [
    17,
    19,
    37
  ],
  "TeamBlackList": [
    15
  ],
  "TrialBagStageTypeWhiteList": [
    1
  ]
}
```

### ActivityHipplenPhaseGrade.json (0.00 MB, 9 条)

**字段** (3): `GradeIcon, GradeShowText, GradeType`

**首条记录摘要**:
```json
{
  "GradeType": "SSS",
  "GradeShowText": {
    "Hash": 12540321204931201235
  },
  "GradeIcon": "SpriteOutput/Quest/Hipplen/HipplenRankIc..."
}
```

### AchievementLevel.json (0.00 MB, 21 条)

**字段** (3): `Count, Level, LevelIconPath`

**首条记录摘要**:
```json
{
  "Level": 1,
  "Count": 1100,
  "LevelIconPath": ""
}
```

### ActivityEquipMaterialQuest.json (0.00 MB, 12 条)

**字段** (4): `GotoID, ProgressText, QuestID, RealProgress`

**首条记录摘要**:
```json
{
  "QuestID": 6070393,
  "ProgressText": {
    "Hash": 12028054528996864007
  },
  "RealProgress": 1,
  "GotoID": 6280
}
```

### AetherSpiritType.json (0.00 MB, 3 条)

**字段** (8): `Color, IconNatureForWeakActive, IconPath, Name, SPInfoEffFront, SmallIconPath, SpiritType, UnfullColor`

**首条记录摘要**:
```json
{
  "Name": "UIText_AetherDivide_Spirit_Type_Human",
  "IconPath": "SpriteOutput/Quest/AetherDivide/Attribut...",
  "SmallIconPath": "SpriteOutput/Quest/AetherDivide/Attribut...",
  "IconNatureForWeakActive": "",
  "SPInfoEffFront": "UI/Battle/SPInfo/Eff_Front/SPInfoEff_Fro...",
  "Color": "#FF4F53",
  "UnfullColor": "#FF8877"
}
```

### ActivityRaidCollectionTab.json (0.00 MB, 6 条)

**字段** (4): `RaidCollectionGroupList, RaidCollectionTabID, RaidCollectionTabName, RaidCollectionType`

**首条记录摘要**:
```json
{
  "RaidCollectionTabID": 1,
  "RaidCollectionType": "Penacony",
  "RaidCollectionGroupList": [
    101,
    102,
    103,
    104
  ],
  "RaidCollectionTabName": {
    "Hash": 10790204624722468711
  }
}
```

### AlleyReward.json (0.00 MB, 20 条)

**字段** (3): `Level, NumTarget, RewardID`

**首条记录摘要**:
```json
{
  "Level": 1,
  "NumTarget": 5,
  "RewardID": 116001
}
```

### ActivityHipplenStat.json (0.00 MB, 4 条)

**字段** (6): `BgColor, IconPath, Name, OutlineIconPath, SmallIconPath, StatType`

**首条记录摘要**:
```json
{
  "StatType": "IQ",
  "Name": {
    "Hash": 15733518952871553884
  },
  "IconPath": "SpriteOutput/Quest/Hipplen/HipplenAttrib...",
  "OutlineIconPath": "SpriteOutput/Quest/Hipplen/HipplenAttrib...",
  "SmallIconPath": "SpriteOutput/Quest/Hipplen/HipplenAttrib...",
  "BgColor": "#8BCDBA"
}
```

### ActivityRelicBoxQuestConfig.json (0.00 MB, 12 条)

**字段** (4): `GotoID, GroupID, QuestIDList, TabID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "QuestIDList": [
    6071507
  ],
  "TabID": 1,
  "GotoID": 1524
}
```

### ActivityScoreTypePunkLord.json (0.00 MB, 9 条)

**字段** (4): `FinishID, FinishName, FinishPoint, FinishRare`

**首条记录摘要**:
```json
{
  "FinishID": "DAMAGE",
  "FinishRare": "S",
  "FinishName": {
    "Hash": 15741083521729325499
  },
  "FinishPoint": 12
}
```

### ActivityDiceShopConfig.json (0.00 MB, 3 条)

**字段** (5): `DiceShopID, GoodsList, IMGPath, Name, ShopSortID`

**首条记录摘要**:
```json
{
  "DiceShopID": 1,
  "GoodsList": "<list[15]>",
  "IMGPath": "SpriteOutput/Quest/DiceCombat/DiceCombat...",
  "ShopSortID": 1,
  "Name": {
    "Hash": 8312944906758085024
  }
}
```

### AlleyActivityQuest.json (0.00 MB, 7 条)

**字段** (4): `ID, MainTabTitle, QuestList, SubTab`

**首条记录摘要**:
```json
{
  "ID": 1,
  "MainTabTitle": {
    "Hash": 15691010516195022827
  },
  "SubTab": 1,
  "QuestList": [
    6013101,
    6013102,
    6013103,
    6013104
  ]
}
```

### AudioBookData.json (0.00 MB, 12 条)

**字段** (2): `AudioEvent, BookID`

**首条记录摘要**:
```json
{
  "BookID": 190784,
  "AudioEvent": "Ev_sfx_amphoreus_audiocollection_titan_f..."
}
```

### ActivityHipplenEnding.json (0.00 MB, 4 条)

**字段** (7): `Desc, ID, ImagePath, IsShowInGuidePage, Name, RewardID, UnlockDesc`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 4858203287453155302
  },
  "Desc": {
    "Hash": 17585657653029633348
  },
  "UnlockDesc": {
    "Hash": 7789382360948694288
  },
  "RewardID": 8012001,
  "ImagePath": "SpriteOutput/Quest/Hipplen/HipplenEnding...",
  "IsShowInGuidePage": true
}
```

### ActivityHipplenGrowthPhase.json (0.00 MB, 6 条)

**字段** (5): `BodySize, ID, PhaseTitle, PhaseTrialTitle, SpeedRatioMultiplier`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PhaseTitle": {
    "Hash": 1683159988163711455
  },
  "PhaseTrialTitle": {
    "Hash": 15712757052243782780
  },
  "BodySize": 0.6,
  "SpeedRatioMultiplier": 1.5
}
```

### ActivityHipplenOutfitType.json (0.00 MB, 4 条)

**字段** (4): `IconCheckPath, IconPath, Name, Type`

**首条记录摘要**:
```json
{
  "Name": {
    "Hash": 17576449925217057695
  },
  "IconPath": "SpriteOutput/Quest/Hipplen/ChangeClothes...",
  "IconCheckPath": "SpriteOutput/Quest/Hipplen/ChangeClothes..."
}
```

### AvatarUseMaterialDataLD.json (0.00 MB, 4 条)

**字段** (9): `AvatarID, BossMaterial, PromotionMaterial, SkillMaterialLarge, SkillMaterialMedium, SkillMaterialSmall, WorldMaterialLarge, WorldMaterialMedium, WorldMaterialSmall`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "PromotionMaterial": 110425,
  "BossMaterial": 110501,
  "SkillMaterialSmall": 110181,
  "SkillMaterialMedium": 110182,
  "SkillMaterialLarge": 110183,
  "WorldMaterialSmall": 111011,
  "WorldMaterialMedium": 111012,
  "WorldMaterialLarge": 111013
}
```

### ActivityReward.json (0.00 MB, 11 条)

**字段** (4): `ActivityRewardID, Count, Reward, RewardIconPath`

**首条记录摘要**:
```json
{
  "ActivityRewardID": 10012001,
  "RewardIconPath": "",
  "Count": 8000,
  "Reward": 100
}
```

### AlleyStage.json (0.00 MB, 3 条)

**字段** (8): `StageAlleyEvent, StageDesc, StageID, StageMainMission, StageSpecialOrder, StageTarget, StageTitle, TakeMainMission`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "StageAlleyEvent": [
    303,
    304,
    307
  ],
  "StageSpecialOrder": [
    101,
    102,
    103
  ],
  "StageTitle": {
    "Hash": 7175359408555160739
  },
  "StageDesc": {
    "Hash": 18115753076915750159
  },
  "TakeMainMission": 8003201,
  "StageTarget": 100000,
  "StageMainMission": 8003220
}
```

### AvatarSourceConfig.json (0.00 MB, 19 条)

**字段** (2): `AvatarID, SourceAvatarID`

**首条记录摘要**:
```json
{
  "AvatarID": 8901,
  "SourceAvatarID": 8001
}
```

### AvatarPropertyOverride.json (0.00 MB, 6 条)

**字段** (5): `AvatarID, HidePropertyInBattleList, HidePropertyList, ShowPropertyInBattleList, ShowPropertyList`

**首条记录摘要**:
```json
{
  "AvatarID": 1308,
  "ShowPropertyList": [],
  "ShowPropertyInBattleList": [],
  "HidePropertyList": [
    "MaxSP"
  ],
  "HidePropertyInBattleList": []
}
```

### ActivityFeverTimeQuest.json (0.00 MB, 6 条)

**字段** (3): `QuestGroupID, QuestIDList, TabName`

**首条记录摘要**:
```json
{
  "QuestGroupID": 1,
  "QuestIDList": [
    6019123,
    6019101,
    6019102,
    6019103
  ],
  "TabName": {
    "Hash": 3398683217852530798
  }
}
```

### ActivityDiceV2PVPScoreRank.json (0.00 MB, 5 条)

**字段** (4): `FOKEJNDOFNI, HDCDMCBPLKI, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "HDCDMCBPLKI": "SpriteOutput/UI/Quest/FeverTime/RankIcon...",
  "OLOIFNNLKJP": "SpriteOutput/UI/Quest/FeverTime/RankIcon..."
}
```

### ActivityTheme.json (0.00 MB, 4 条)

**字段** (5): `CornerIconPath, IconPath, LittleCornerIconPath, Name, ThemeID`

**首条记录摘要**:
```json
{
  "ThemeID": 1001,
  "Name": {
    "Hash": 12885936480244887170
  },
  "IconPath": "SpriteOutput/UI/Quest/AnniversarySevenDa...",
  "CornerIconPath": "SpriteOutput/Quest/TabIcon/FestivalMarkI...",
  "LittleCornerIconPath": ""
}
```

### ActivityAdventurePlayer.json (0.00 MB, 2 条)

**字段** (7): `AvatarID, DefaultAvatarHeadIconPath, ID, MazeSkillIdList, PlayerJsonPath, PlayerName, PlayerPrefabPath`

**首条记录摘要**:
```json
{
  "ID": 8901,
  "AvatarID": 8001,
  "PlayerName": {
    "Hash": 17595892598541555678
  },
  "PlayerPrefabPath": "Characters/CharacterPrefabs/Activity/Pla...",
  "PlayerJsonPath": "Config/ConfigCharacter/Activity/LocalPla...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/8001.png",
  "MazeSkillIdList": [
    890101
  ]
}
```

### AvatarVOLD.json (0.00 MB, 4 条)

**字段** (9): `ActionBegin, ActionBeginAdvantage, ActionBeginHighThreat, LightHit, ReceiveHealing, Revived, StandBy, UltraReady, VOTag`

**首条记录摘要**:
```json
{
  "VOTag": "saber",
  "ActionBegin": 100,
  "ActionBeginAdvantage": 100,
  "ActionBeginHighThreat": 100,
  "ReceiveHealing": 100,
  "Revived": 100,
  "UltraReady": 100,
  "LightHit": 100,
  "StandBy": 100
}
```

### ActivityTelevisionSeason.json (0.00 MB, 1 条)

**字段** (8): `BuffLevelBackgroundPathList, BuffLevelDefaultBackgroundPath, BuffLevelIconPathList, FirstMainMissionID, LastStage, LastStageQuest, LevelMessageSubmission, Season`

**首条记录摘要**:
```json
{
  "Season": 2,
  "LastStage": 305,
  "LastStageQuest": 306,
  "FirstMainMissionID": 8030300,
  "LevelMessageSubmission": 803030505,
  "BuffLevelIconPathList": "<list[4]>",
  "BuffLevelBackgroundPathList": "<list[4]>",
  "BuffLevelDefaultBackgroundPath": "SpriteOutput/Quest/Television/Season2/TV..."
}
```

### ActivityVoracityInvasionPro.json (0.00 MB, 8 条)

**字段** (3): `ActivityProgress, ProgressDes, RedPoint`

**首条记录摘要**:
```json
{
  "RedPoint": 1,
  "ProgressDes": {
    "Hash": 12264574356790710957
  }
}
```

### ActivityHot.json (0.00 MB, 5 条)

**字段** (6): `ActivityID, DesName, ImgPath, RewardReceived, RewardShow, SortWeight`

**首条记录摘要**:
```json
{
  "ActivityID": 10190,
  "DesName": {
    "Hash": 14949343547002179054
  },
  "ImgPath": "",
  "SortWeight": 6005,
  "RewardShow": [],
  "RewardReceived": []
}
```

### ActivityFinishWayPunkLord.json (0.00 MB, 12 条)

**字段** (3): `FinishID, FinishPoint, FinishRare`

**首条记录摘要**:
```json
{
  "FinishID": 1,
  "FinishRare": "A",
  "FinishPoint": 180
}
```

### AvatarDemoConstValue.json (0.00 MB, 6 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Avatar_Background_Path",
  "Value": "<dict[1]>"
}
```

### AvatarSkillPropertyOverride.json (0.00 MB, 6 条)

**字段** (5): `DisableIconColorHint, IsSecretSkillNeed, OverrideAttackType, ReplacePointIconPrefab, SkillID`

**首条记录摘要**:
```json
{
  "SkillID": 140703,
  "IsSecretSkillNeed": true,
  "ReplacePointIconPrefab": ""
}
```

### ActivitySummonRewardTab.json (0.00 MB, 5 条)

**字段** (4): `GroupID, ID, OriginalQuestName, QuestName`

**首条记录摘要**:
```json
{
  "ID": 10080,
  "GroupID": 1,
  "OriginalQuestName": {
    "Hash": 14151279404966629651
  },
  "QuestName": {
    "Hash": 14146225591236469164
  }
}
```

### AlleyMapGrade.json (0.00 MB, 5 条)

**字段** (4): `GradeConditions, GradeID, MapConfig, MapID`

**首条记录摘要**:
```json
{
  "GradeID": 101,
  "MapID": 1,
  "MapConfig": "Config/Gameplays/Alley/AlleyLogistics/Al...",
  "GradeConditions": []
}
```

### ActivityBonusRewardPunkLord.json (0.00 MB, 8 条)

**字段** (4): `BonusID, BonusType, DisplayItemID, DropList`

**首条记录摘要**:
```json
{
  "BonusID": 1,
  "BonusType": 1,
  "DisplayItemID": 2,
  "DropList": [
    3200000
  ]
}
```

### ActivityEquipmentReward.json (0.00 MB, 3 条)

**字段** (6): `ActivityModuleID, EquipmentRewardQuestGotoID, EquipmentRewardQuestID, ID, MainMissionID, MaterialRewardQuestIDList`

**首条记录摘要**:
```json
{
  "ID": 50042,
  "MainMissionID": 8035101,
  "EquipmentRewardQuestID": 6070397,
  "EquipmentRewardQuestGotoID": 6282,
  "MaterialRewardQuestIDList": [
    6070393,
    6070394,
    6070395,
    6070396
  ],
  "ActivityModuleID": 5004201
}
```

### ActivityRaidCollectionQuest.json (0.00 MB, 4 条)

**字段** (3): `QuestList, QuestTabID, QuestTabName`

**首条记录摘要**:
```json
{
  "QuestTabID": 1,
  "QuestTabName": {
    "Hash": 13119286508734114980
  },
  "QuestList": "<list[7]>"
}
```

### ActivityExpeditionConst.json (0.00 MB, 7 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityExpedition_UnlockMission",
  "Value": {
    "IntValue": 803530101
  }
}
```

### AvatarCobrand.json (0.00 MB, 4 条)

**字段** (5): `AudioLanguage, ID, OffStateName, OnStateName, StateGroupName`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "AudioLanguage": "jp",
  "StateGroupName": "StateGroup_Avatar_Saber_ChangeLanguage",
  "OffStateName": "saber_default",
  "OnStateName": "saber_japanese"
}
```

### AllowedLanguage.json (0.00 MB, 4 条)

**字段** (4): `Area, DefaultLanguage, LanguageList, Type`

**首条记录摘要**:
```json
{
  "Area": "cn",
  "Type": 1,
  "LanguageList": [
    "cn",
    "en",
    "kr",
    "jp"
  ],
  "DefaultLanguage": "cn"
}
```

### AvatarTestMazeBuff.json (0.00 MB, 96 条)

### ActivityRankIcon.json (0.00 MB, 5 条)

**字段** (3): `CommonRankIconPath, ID, Text`

**首条记录摘要**:
```json
{
  "ID": "S",
  "Text": {
    "Hash": 8274228564714018
  },
  "CommonRankIconPath": "SpriteOutput/RankIcon/CommonRankBg_S.png"
}
```

### ActivityNewbiePromote.json (0.00 MB, 5 条)

**字段** (5): `Desc, DisplayItem, FinishQuest, ID, SortID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Desc": {
    "Hash": 14007724541189493699
  },
  "DisplayItem": 1013,
  "FinishQuest": 3000011,
  "SortID": 1
}
```

### ActivityLocalLegendReward.json (0.00 MB, 10 条)

**字段** (3): `ID, Sort, TaskType`

**首条记录摘要**:
```json
{
  "ID": 6072147,
  "TaskType": "EasyHard",
  "Sort": 5
}
```

### AvatarComefromLD.json (0.00 MB, 4 条)

**字段** (6): `ComefromID, Desc, GotoID, GotoParam, ID, Sort`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "ComefromID": 99,
  "Sort": 1,
  "Desc": {
    "Hash": 18027043526582915644
  },
  "GotoID": 2300,
  "GotoParam": [
    1014
  ]
}
```

### ActivityWorldUnlock.json (0.00 MB, 13 条)

**字段** (2): `ActivityID, WorldID`

**首条记录摘要**:
```json
{
  "ActivityID": 80014,
  "WorldID": 501
}
```

### AvatarPlayerIconLD.json (0.00 MB, 4 条)

**字段** (6): `AvatarID, ID, ImagePath, Sort, SortType, Type`

**首条记录摘要**:
```json
{
  "ID": 201014,
  "ImagePath": "SpriteOutput/AvatarRoundIcon/Avatar/1014...",
  "AvatarID": 1014,
  "Type": "Avatar",
  "SortType": 3,
  "Sort": 340
}
```

### ActivityHonorPunkLord.json (0.00 MB, 6 条)

**字段** (3): `DisplayPriority, HonorID, HonorName`

**首条记录摘要**:
```json
{
  "HonorID": 1,
  "HonorName": {
    "Hash": 9008494512777246555
  },
  "DisplayPriority": 1
}
```

### ActivityBenefitV2Prize.json (0.00 MB, 2 条)

**字段** (4): `EJDNMAFLACG, LDCCBCIIIEC, MJOOFPBABEA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 101,
  "EJDNMAFLACG": [
    3170000
  ],
  "MJOOFPBABEA": {
    "Hash": 1370576421128545346
  },
  "LDCCBCIIIEC": "<list[5]>"
}
```

### ActivityDiceV2PVPScore.json (0.00 MB, 4 条)

**字段** (4): `FBBBHPDMFAP, OACJHAFNCCB, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBBBHPDMFAP": "HPDamageRatio",
  "PBLPLDJKPEI": [
    50
  ],
  "OACJHAFNCCB": {
    "Hash": 16054471899516734076
  }
}
```

### ActivityFeverTimeUnderline.json (0.00 MB, 9 条)

**字段** (2): `AvailableBuffID, ExtraEffectID`

**首条记录摘要**:
```json
{
  "AvailableBuffID": 3107002,
  "ExtraEffectID": 70000201
}
```

### ActivityStartHintConfig.json (0.00 MB, 3 条)

**字段** (4): `ActivityModuleID, ActivityStartHintID, ToastDesc, UIPrefab`

**首条记录摘要**:
```json
{
  "ActivityStartHintID": 50042,
  "ActivityModuleID": 5004201,
  "UIPrefab": "UI/Quest/QuestStartHint/QuestStartHintEl...",
  "ToastDesc": {
    "Hash": 5359816476245136237
  }
}
```

### AllowedAudioLanguage.json (0.00 MB, 4 条)

**字段** (4): `AudioLanguageKey, AudioTrackIndex, ShowString, WwiseLanguageKey`

**首条记录摘要**:
```json
{
  "AudioLanguageKey": "cn",
  "ShowString": {
    "Hash": 16453723977790693387
  },
  "WwiseLanguageKey": "Chinese(PRC)"
}
```

### ActivityConstantFight.json (0.00 MB, 7 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityFight_Unlock_Mission_Goto",
  "Value": "8000001"
}
```

### ActivityModuleFight.json (0.00 MB, 8 条)

**字段** (2): `ActivityFightGroupID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "ActivityFightGroupID": 10005,
  "ActivityModuleID": 4000102
}
```

### AetherPassiveSkillType.json (0.00 MB, 4 条)

**字段** (3): `IconPath, Name, PassiveSkillType`

**首条记录摘要**:
```json
{
  "Name": "AetherPassiveSkillType_Name_0",
  "IconPath": "SpriteOutput/Rogue/Buff/IconRogueBuffDef..."
}
```

### AetherDivideConstCommon.json (0.00 MB, 5 条)

**字段** (3): `ConstValueName, ConstValueType, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "AetherDivide_OverflowChunk_Recovery",
  "ConstValueType": "Int",
  "Value": "6"
}
```

### ActiveConfig.json (0.00 MB, 1 条)

**字段** (7): `ActiveItemID, ActivityModuleID, BenefitIDList, GiftShowList, ID, ItemLimit, PowerConsume`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 5008601,
  "PowerConsume": 20,
  "ActiveItemID": 300057,
  "ItemLimit": 100,
  "BenefitIDList": [
    1001,
    1002,
    1003,
    1004,
    1005,
    1006
  ],
  "GiftShowList": "<list[5]>"
}
```

### AtlasConfig.json (0.00 MB, 7 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 17721877426547049048
  }
}
```

### ActivityMazeSkill.json (0.00 MB, 2 条)

**字段** (6): `MazeSkillDesc, MazeSkillId, MazeSkillName, MazeSkilltype, RelatedAvatarSkill, SkillTriggerKey`

**首条记录摘要**:
```json
{
  "MazeSkillId": 890101,
  "MazeSkillName": {
    "Hash": 9802521681134028062
  },
  "MazeSkilltype": 1,
  "MazeSkillDesc": {
    "Hash": 7589439724132350591
  },
  "RelatedAvatarSkill": 890106,
  "SkillTriggerKey": "NormalAtk"
}
```

### ActivityRaidCollectionInfo.json (0.00 MB, 3 条)

**字段** (5): `ActivityID, IconPath, RaidCollectionType, RewardID, TabIDList`

**首条记录摘要**:
```json
{
  "ActivityID": 50007,
  "RaidCollectionType": "Penacony",
  "IconPath": "",
  "TabIDList": [
    1,
    2
  ]
}
```

### ActivityRelicBoxCommonConst.json (0.00 MB, 5 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Relicbox_Key_Item",
  "Value": {
    "IntValue": 123002
  }
}
```

### ActiveBenefitData.json (0.00 MB, 6 条)

**字段** (3): `ActiveItemNum, BenefitID, Reward`

**首条记录摘要**:
```json
{
  "BenefitID": 1001,
  "ActiveItemNum": 6,
  "Reward": 3173001
}
```

### ActivityRareConfigPunkLord.json (0.00 MB, 6 条)

**字段** (3): `GroupType, MonsterRare, Weight`

**首条记录摘要**:
```json
{
  "GroupType": "Common",
  "MonsterRare": "S",
  "Weight": 10
}
```

### ActivityPanelSingleReward.json (0.00 MB, 4 条)

**字段** (4): `ActivityID, AvatarID, GotoID, QuestList`

**首条记录摘要**:
```json
{
  "ActivityID": 10017,
  "AvatarID": 1201,
  "GotoID": 218,
  "QuestList": [
    3000018
  ]
}
```

### AlleyShip.json (0.00 MB, 3 条)

**字段** (3): `ShipConfig, ShipID, ShipType`

**首条记录摘要**:
```json
{
  "ShipID": 1,
  "ShipConfig": "Config/Gameplays/Alley/AlleyShipment/All...",
  "ShipType": "Small"
}
```

### AssistantTipsShowCase.json (0.00 MB, 3 条)

**字段** (3): `ID, ShowCase, TipsIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ShowCase": "ElfRestaurantEditRecipe",
  "TipsIDList": [
    102,
    108,
    103,
    104
  ]
}
```

### ActivityPanelSevenDayReward.json (0.00 MB, 1 条)

**字段** (6): `BGImgPath, CardWidget0ImgPath, CardWidget1ImgPath, CardWidget2ImgPath, ID, PicImgPath`

**首条记录摘要**:
```json
{
  "ID": 10018,
  "BGImgPath": "SpriteOutput/UI/Quest/SevenDaysVersion/S...",
  "PicImgPath": "SpriteOutput/UI/Quest/SevenDaysVersion/S...",
  "CardWidget0ImgPath": "SpriteOutput/UI/Quest/SevenDaysVersion/C...",
  "CardWidget1ImgPath": "SpriteOutput/UI/Quest/SevenDaysVersion/C...",
  "CardWidget2ImgPath": "SpriteOutput/UI/Quest/SevenDaysVersion/C..."
}
```

### ActivityExpeditionGroup.json (0.00 MB, 1 条)

**字段** (3): `ActivityModuleID, ExpeditionIdList, GroupID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "ExpeditionIdList": "<list[24]>",
  "ActivityModuleID": 5006201
}
```

### ActivityPanelSingeQuest.json (0.00 MB, 4 条)

**字段** (4): `AvatarID, GotoID, ID, QuestList`

**首条记录摘要**:
```json
{
  "ID": 10017,
  "AvatarID": 1201,
  "GotoID": 218,
  "QuestList": [
    3000018
  ]
}
```

### AtlasAvatarChangeInfo.json (0.00 MB, 4 条)

**字段** (4): `ACCJKGEKHKP, ADGKGGIBBEC, ELDCAFJBIPN, JJKLIJNFIBB`

**首条记录摘要**:
```json
{
  "ELDCAFJBIPN": 1,
  "JJKLIJNFIBB": 70015,
  "ACCJKGEKHKP": 1308,
  "ADGKGGIBBEC": 112
}
```

### AvatarCutinChangeConfig.json (0.00 MB, 2 条)

**字段** (3): `AvatarID, AvatarImgPath, ChangeConditions`

**首条记录摘要**:
```json
{
  "AvatarID": 8007,
  "ChangeConditions": "<list[1]>",
  "AvatarImgPath": "SpriteOutput/AvatarDrawCard/8007_02.png"
}
```

### AvatarPathItemTransfer.json (0.00 MB, 2 条)

**字段** (5): `AvatarID, DialogDesc, DialogTitle, SourceItemID, TargetItemID`

**首条记录摘要**:
```json
{
  "AvatarID": 8009,
  "SourceItemID": 291,
  "TargetItemID": 18009,
  "DialogTitle": {
    "Hash": 5510509706687529656
  },
  "DialogDesc": {
    "Hash": 13223828032509876621
  }
}
```

### ActivityHipplenPerformance.json (0.00 MB, 3 条)

**字段** (2): `LCGBMLNLHLC, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "LCGBMLNLHLC": "Config/Gameplays/Hipplen/Performance/Act..."
}
```

### AvatarSkillLink.json (0.00 MB, 2 条)

**字段** (3): `LinkToAvatarIDList, LinkToAvatarIDSimplifiedList, SkillID`

**首条记录摘要**:
```json
{
  "SkillID": 151025,
  "LinkToAvatarIDList": [
    8001,
    1002,
    1213,
    1414,
    1313
  ],
  "LinkToAvatarIDSimplifiedList": [
    8001,
    1002,
    1313
  ]
}
```

### ActivityConstantGS.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityFindTrotter_GuessSilhouette_Tuto...",
  "Value": "8002100"
}
```

### AvatarDefaultMazeBuffLD.json (0.00 MB, 4 条)

**字段** (3): `DefaultMazeBuffIDList, ID, SkillIndex`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "SkillIndex": 2,
  "DefaultMazeBuffIDList": [
    101401
  ]
}
```

### AvatarDetailTabConfig.json (0.00 MB, 3 条)

**字段** (3): `ID, IconPath, TabName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/UI/Avatar/IconAvatarDetail....",
  "TabName": "AvatarPageName_Detail"
}
```

### ActivityConstantFindTrotter.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityFindTrotter_Quest_Reward",
  "Value": "6000081"
}
```

### AvatarEquipRecommendLD.json (0.00 MB, 4 条)

**字段** (2): `AvatarID, EquipmentList`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "EquipmentList": [
    23045,
    24000
  ]
}
```

### AvatarDeliverConstValue.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Avatar_Deliver_Activity_Module_Id",
  "Value": {
    "IntValue": 1014701
  }
}
```

### ActivityQuestTabGroupUI.json (0.00 MB, 2 条)

**字段** (3): `BgPrefabPath, QuestTabGroupID, TabItemPrefabPath`

**首条记录摘要**:
```json
{
  "QuestTabGroupID": 6001201,
  "BgPrefabPath": "UI/Rogue/Tourn/Titan/Widget/RogueTournTi...",
  "TabItemPrefabPath": ""
}
```

### AetherDivideBadge.json (0.00 MB, 5 条)

**字段** (3): `ItemID, MaxSpiritLevel, Number`

**首条记录摘要**:
```json
{
  "MaxSpiritLevel": 2
}
```

### ActivityRogueGuideBanner.json (0.00 MB, 4 条)

**字段** (2): `ActivityID, TypeParam`

**首条记录摘要**:
```json
{
  "ActivityID": 60001,
  "TypeParam": [
    1013
  ]
}
```

### AvatarSpecialSkillTree.json (0.00 MB, 2 条)

**字段** (4): `AnchorType, AvatarID, AvatarImgPath, ShowSkill`

**首条记录摘要**:
```json
{
  "AvatarID": 8007,
  "AnchorType": "Point21",
  "AvatarImgPath": "SpriteOutput/AvatarDrawCard/8007_02.png",
  "ShowSkill": 800708
}
```

### AetherDivideOverflowChunk.json (0.00 MB, 2 条)

**字段** (6): `BattleAreaID, EventID, GroupID, ID, MazeBuffID, SpiritID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "EventID": 43103015,
  "SpiritID": 6005,
  "MazeBuffID": 3004003,
  "GroupID": 2,
  "BattleAreaID": 1
}
```

### AreaMapShowConfig.json (0.00 MB, 2 条)

**字段** (2): `Conditions, ID`

**首条记录摘要**:
```json
{
  "ID": 2013501,
  "Conditions": [
    {
      "Type": "PlayerLevel",
      "Param": "99"
    }
  ]
}
```

### AetherDivideSpiritTrial.json (0.00 MB, 4 条)

**字段** (3): `ID, Promotion, SpiritID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SpiritID": 6014,
  "Promotion": 3
}
```

### ActivityHipplenGameGrade.json (0.00 MB, 3 条)

**字段** (2): `GradeText, GradeType`

**首条记录摘要**:
```json
{
  "GradeType": "S",
  "GradeText": {
    "Hash": 8902188013388414610
  }
}
```

### AvatarSkinSpecialAction.json (0.00 MB, 1 条)

**字段** (4): `ID, SkinID, SkinSpecialActionPrefabPath, SpecialActionPrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SkinID": 1100101,
  "SpecialActionPrefabPath": "UI/Battle/SpecialAction/Avatar/SpecialAc...",
  "SkinSpecialActionPrefabPath": "UI/Battle/SpecialAction/Avatar/AvatarSki..."
}
```

### ActivityDiceGoodsUnlockTips.json (0.00 MB, 3 条)

**字段** (2): `ID, UnlockTips`

**首条记录摘要**:
```json
{
  "ID": 1,
  "UnlockTips": {
    "Hash": 1612563077642113
  }
}
```

### ActivityTag.json (0.00 MB, 3 条)

**字段** (2): `Desc, TagID`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "Desc": {
    "Hash": 10093778241051061883
  }
}
```

### AetherDivideMaxSpiritLevel.json (0.00 MB, 4 条)

**字段** (2): `MaxSpiritLevel, UnlockID`

**首条记录摘要**:
```json
{
  "MaxSpiritLevel": 3,
  "UnlockID": 100016
}
```

### ActivityDiceUnlockTips.json (0.00 MB, 2 条)

**字段** (2): `UnlockTips, UnlockType`

**首条记录摘要**:
```json
{
  "UnlockType": "OfferingLevel",
  "UnlockTips": {
    "Hash": 6372015737488760663
  }
}
```

### ActivityVoracityInvasionBuf.json (0.00 MB, 3 条)

**字段** (3): `BuffID, BuffLevel, ProgressPercent`

**首条记录摘要**:
```json
{
  "BuffID": 3034011,
  "BuffLevel": 1
}
```

### ActivityHipplenCommonConst.json (0.00 MB, 2 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "hipplen_energy_limit",
  "Value": {
    "IntValue": 200
  }
}
```

### ActivityBenefitV2Config.json (0.00 MB, 1 条)

**字段** (4): `FBJNOBODCLF, JJCIOIKKJEM, LABFIMHODHC, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBJNOBODCLF": "<list[5]>",
  "LABFIMHODHC": 101,
  "JJCIOIKKJEM": 102
}
```

### AreaMapMenuIcon.json (0.00 MB, 2 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/MapPics/MapTab/MapFloorTrai..."
}
```

### AvatarPromotionReward.json (0.00 MB, 3 条)

**字段** (2): `Promotion, PromotionRewardId`

**首条记录摘要**:
```json
{
  "Promotion": 1,
  "PromotionRewardId": 301
}
```

### ActivityRelicBoxQuestTab.json (0.00 MB, 2 条)

**字段** (2): `TabID, TabName`

**首条记录摘要**:
```json
{
  "TabID": 1,
  "TabName": {
    "Hash": 12204315409580890607
  }
}
```

### AvatarEnhancedSeason.json (0.00 MB, 3 条)

**字段** (2): `ActivityID, SeasonID`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "ActivityID": 50047
}
```

### AetherDivideQuestType.json (0.00 MB, 2 条)

**字段** (2): `ID, TypeGroupList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "TypeGroupList": [
    100,
    101,
    102
  ]
}
```

### AvatarExpItemConfig.json (0.00 MB, 3 条)

**字段** (2): `Exp, ItemID`

**首条记录摘要**:
```json
{
  "ItemID": 211,
  "Exp": 1000
}
```

### ActivityRaidCollectionConst.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_RaidCollection_Amphoreus_Charac...",
  "Value": {
    "IntValue": 6029840
  }
}
```

### ActivityDiceHint.json (0.00 MB, 1 条)

**字段** (2): `Content, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Content": {
    "Hash": 699110669517638831
  }
}
```

### AutoFightVO.json (0.00 MB, 1 条)

**字段** (3): `LightHit, Mode, ReceiveBuff`

**首条记录摘要**:
```json
{
  "Mode": 1,
  "ReceiveBuff": 1,
  "LightHit": 1
}
```

### ActivityModulePunkLord.json (0.00 MB, 1 条)

**字段** (2): `ActivityModuleID, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 3000201
}
```

### ActivityAvatarConfigLD.json (0.00 MB, 0 条)

### ActivityRaidSpecialOrder.json (0.00 MB, 0 条)

### ActivityRebateConfig.json (0.00 MB, 0 条)

### ActivityRebateTriggerConfig.json (0.00 MB, 0 条)

### ActivityRelicBoxClientConst.json (0.00 MB, 0 条)

### AdventurePlayerEnhancedTest.json (0.00 MB, 0 条)

### AdventurePlayerTest.json (0.00 MB, 0 条)

### AnnivColleConstValue.json (0.00 MB, 0 条)

### AnnivColleContentConfig.json (0.00 MB, 0 条)

### AnnivColleGroupConfig.json (0.00 MB, 0 条)

### AnnivColleTabConfig.json (0.00 MB, 0 条)

### Anniversary2NDConstValue.json (0.00 MB, 0 条)

### Anniversary2NDContentConfig.json (0.00 MB, 0 条)

### Anniversary2NDTabConfig.json (0.00 MB, 0 条)

### AvatarLevelSkillConfig.json (0.00 MB, 0 条)

### AvatarSourceConfigLD.json (0.00 MB, 0 条)

### AvatarTeamBuff.json (0.00 MB, 0 条)

### AvatarTestConfig.json (0.00 MB, 0 条)

### AvatarTestPropertyOverride.json (0.00 MB, 0 条)

### AvatarTestRankConfig.json (0.00 MB, 0 条)
