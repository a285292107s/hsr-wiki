# DATA_CATALOG 分片：文件名首字母 ST

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 s-t（共 257 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### SpecialAvatarRelicMainValue.json (48.64 MB, 64,400 条)

**字段** (2): `MainValue, RelicMainValueType`

**首条记录摘要**:
```json
{
  "RelicMainValueType": 1111200,
  "MainValue": "<list[6]>"
}
```

### TalkSentenceConfig.json (39.73 MB, 244,380 条)

**字段** (4): `TalkSentenceID, TalkSentenceText, TextmapTalkSentenceName, VoiceID`

**首条记录摘要**:
```json
{
  "TalkSentenceID": 802410000,
  "TalkSentenceText": {
    "Hash": 8848118382525453197
  }
}
```

### StageConfig.json (24.59 MB, 29,515 条)

**字段** (21): `BattleScoringGroup, EliteGroup, ForbidAutoBattle, ForbidExitBattle, ForbidViewMode, HardLevelGroup, Level, LevelGraphPath, LevelLoseCondition, LevelWinCondition, MonsterList, MonsterWarningRatio, Release, ResetBattleSpeed, StageAbilityConfig, StageConfigData, StageID, StageName, StageType, SubLevelGraphs, TrialAvatarList`

**首条记录摘要**:
```json
{
  "StageID": 103201,
  "StageType": "Mainline",
  "StageName": {
    "Hash": 3319612321481484338
  },
  "HardLevelGroup": 1,
  "Level": 29,
  "LevelGraphPath": "Config/Level/StageCommonTemplate.json",
  "StageAbilityConfig": [],
  "SubLevelGraphs": [],
  "StageConfigData": "<list[2]>",
  "MonsterList": "<list[1]>",
  "LevelLoseCondition": [],
  "LevelWinCondition": [],
  "ForbidAutoBattle": true,
  "Release": true,
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### SpecialAvatarRelic.json (4.07 MB, 11,534 条)

**字段** (3): `Comment2, RelicIDList, RelicPropertyType`

**首条记录摘要**:
```json
{
  "RelicPropertyType": 310100,
  "RelicIDList": "<list[4]>",
  "Comment2": "过客"
}
```

### SpecialAvatar.json (3.30 MB, 4,925 条)

**字段** (34): `AIPath, AbilityNameList, AnchorName, AvatarID, CustomSkillTreeKey, EnhancedID, EquipmentID, EquipmentLevel, EquipmentPromotion, EquipmentRank, HasJoinHint, HasLeaveHint, HaveActionDelay, IsAutoBattle, IsProtected, IsUseWorldLevel, JsonPath, Level, LevelAreaPrefab, LockBattleInfo, LockMazeSkill, OverrideProperty, PlayerID, PlayerJsonPath, Promotion, Rank, RelicMainValue, RelicPropertyType, RelicPropertyTypeExtra, RelicSubValue, SkillTreeTemplate, SpecialAvatarID, Type, WorldLevel`

**首条记录摘要**:
```json
{
  "SpecialAvatarID": 1021213,
  "IsUseWorldLevel": true,
  "PlayerID": 1213,
  "AvatarID": 7213,
  "Type": "TYPE_PLOT",
  "LockMazeSkill": true,
  "LockBattleInfo": true,
  "LevelAreaPrefab": "",
  "AnchorName": "",
  "Level": 40,
  "Promotion": 2,
  "OverrideProperty": [],
  "HaveActionDelay": true,
  "SkillTreeTemplate": "TYPE_CUSTOM",
  "CustomSkillTreeKey": "MaxWithInLevel",
  "EquipmentID": 21019,
  "EquipmentLevel": 40,
  "EquipmentPromotion": 2,
  "EquipmentRank": 1,
  "RelicPropertyType": 411202,
  "RelicMainValue": 4404302,
  "RelicSubValue": 302,
  "AbilityNameList": "<list[2]>",
  "PlayerJsonPath": "",
  "JsonPath": "Config/ConfigCharacter/SpecialAvatar/Spe...",
  "AIPath": ""
}
```

### SpecialAvatarRelicSubValue.json (2.97 MB, 1,689 条)

**字段** (2): `RelicSubValueType, SubValue`

**首条记录摘要**:
```json
{
  "RelicSubValueType": 1,
  "SubValue": "<list[21]>"
}
```

### SubMission.json (1.70 MB, 14,897 条)

**字段** (3): `DescrptionText, SubMissionID, TargetText`

**首条记录摘要**:
```json
{
  "SubMissionID": 100010100,
  "TargetText": {
    "Hash": 13723479424410089166
  },
  "DescrptionText": {
    "Hash": 11219213692454402967
  }
}
```

### StageInfiniteMonsterGroup.json (1.37 MB, 1,714 条)

**字段** (3): `EliteGroup, InfiniteMonsterGroupID, MonsterList`

**首条记录摘要**:
```json
{
  "InfiniteMonsterGroupID": 1201,
  "MonsterList": "<list[20]>",
  "EliteGroup": 85
}
```

### StatusConfig.json (1.11 MB, 2,457 条)

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 10060011,
  "ModifierName": "Avatar_Soldier04_00_IsSupporting",
  "StatusName": {
    "Hash": 7669891492451093496
  },
  "StatusType": "Other",
  "StatusDesc": {
    "Hash": 5077213314620894320
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconMonste...",
  "StatusIconPathHighSize": "",
  "StatusEffect": {
    "Hash": 2883616867414336133
  },
  "ReadParamList": [],
  "TagList": []
}
```

### StageTestConfig.json (0.59 MB, 829 条)

**字段** (19): `BattleScoringGroup, EliteGroup, ForbidAutoBattle, ForbidExitBattle, HardLevelGroup, Level, LevelGraphPath, LevelLoseCondition, LevelWinCondition, MonsterList, MonsterWarningRatio, Release, StageAbilityConfig, StageConfigData, StageID, StageName, StageType, SubLevelGraphs, TrialAvatarList`

**首条记录摘要**:
```json
{
  "StageID": 47,
  "StageType": "Mainline",
  "StageName": {
    "Hash": 10247983769183018110
  },
  "HardLevelGroup": 1,
  "Level": 40,
  "LevelGraphPath": "Config/Level/StageCommonTemplate.json",
  "StageAbilityConfig": [],
  "SubLevelGraphs": [],
  "StageConfigData": "<list[2]>",
  "MonsterList": "<list[1]>",
  "LevelLoseCondition": [],
  "LevelWinCondition": [],
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### StageInfiniteWaveConfig.json (0.53 MB, 1,778 条)

**字段** (7): `Ability, ClearPreviousAbility, InfiniteWaveID, MaxMonsterCount, MaxTeammateCount, MonsterGroupIDList, ParamList`

**首条记录摘要**:
```json
{
  "InfiniteWaveID": 10101,
  "MonsterGroupIDList": [
    1201,
    1202
  ],
  "MaxMonsterCount": 31,
  "MaxTeammateCount": 5,
  "Ability": "",
  "ParamList": [],
  "ClearPreviousAbility": true
}
```

### TutorialData.json (0.46 MB, 1,283 条)

**字段** (7): `CanInterrupt, FinishTriggerParams, Priority, RestoreType, TriggerParams, TutorialID, TutorialJsonPath`

**首条记录摘要**:
```json
{
  "TutorialID": 1001,
  "Priority": 10,
  "TutorialJsonPath": "Config/Level/Tutorial/Tutorial_1001.json",
  "TriggerParams": "<list[1]>",
  "FinishTriggerParams": "<list[1]>"
}
```

### TutorialGuideTalkData.json (0.42 MB, 2,764 条)

**字段** (3): `AvatarHeadIcon, ID, TalkDataText`

**首条记录摘要**:
```json
{
  "ID": 51401,
  "AvatarHeadIcon": ""
}
```

### StoryCharacter.json (0.39 MB, 1,721 条)

**字段** (5): `CharacterID, ConfigEntityPath, JsonPath, StoryCharacterID, SubType`

**首条记录摘要**:
```json
{
  "StoryCharacterID": "NPC_Avatar_Boy_Arlan_00",
  "SubType": "Avatar",
  "ConfigEntityPath": "Config/ConfigEntity/NPC/Avatar/NPC_Avata...",
  "JsonPath": "Config/ConfigCharacter/NPC/Avatar/NPC_Av..."
}
```

### ShopGoodsConfig.json (0.33 MB, 900 条)

**字段** (27): `ActivityModuleID, CurrencyCostList, CurrencyList, CycleDays, GoodsID, GoodsSortID, IsLimitedTimePurchase, IsNew, IsOnSale, ItemCount, ItemGroupID, ItemID, Level, LimitTimes, LimitType1, LimitValue1List, LimitValue2List, OnShelfType1, OnShelfType2, OnShelfValue1List, OnShelfValue2List, Rank, RefreshType, ScheduleDataID, ShopID, TagParam, TagType`

**首条记录摘要**:
```json
{
  "GoodsID": 101001,
  "ItemID": 101,
  "ItemCount": 1,
  "CurrencyList": [
    252
  ],
  "CurrencyCostList": [
    20
  ],
  "GoodsSortID": 2,
  "LimitValue1List": [],
  "LimitValue2List": [],
  "OnShelfValue1List": [],
  "OnShelfValue2List": [],
  "ShopID": 101,
  "ScheduleDataID": 10101001
}
```

### TutorialGuideGroup.json (0.32 MB, 871 条)

**字段** (10): `CanReview, FinishTriggerParams, GroupID, MessageText, Order, RewardID, TriggerParams, TutorialGuideIDList, TutorialShowType, TutorialType`

**首条记录摘要**:
```json
{
  "GroupID": 1101,
  "TutorialGuideIDList": [
    110101
  ],
  "TutorialType": 1,
  "CanReview": true,
  "TutorialShowType": "Hide",
  "Order": 199,
  "TriggerParams": "<list[1]>",
  "FinishTriggerParams": "<list[1]>",
  "MessageText": {
    "Hash": 560005623724621359
  },
  "RewardID": 201
}
```

### TutorialGuideData.json (0.23 MB, 1,569 条)

**字段** (4): `DescText, ID, ImagePath, PlatformType`

**首条记录摘要**:
```json
{
  "ID": 100601,
  "ImagePath": "SpriteOutput/TutorialPic/TutorialPage_10...",
  "DescText": {
    "Hash": 2392811638690661935
  }
}
```

### TarotBookSentence.json (0.15 MB, 1,437 条)

**字段** (3): `ID, Sentence, VoiceID`

**首条记录摘要**:
```json
{
  "ID": 10010101,
  "Sentence": {
    "Hash": 13507939961766361359
  },
  "VoiceID": 80101001
}
```

### TreasureDungeonMap.json (0.11 MB, 400 条)

**字段** (2): `MapID, MapInfo`

**首条记录摘要**:
```json
{
  "MapID": 1001,
  "MapInfo": "<list[25]>"
}
```

### TalkSentenceMultiVoice.json (0.10 MB, 1,044 条)

**字段** (2): `TalkSentenceID, VoiceIDList`

**首条记录摘要**:
```json
{
  "TalkSentenceID": 599000101,
  "VoiceIDList": [
    502000001,
    502000002
  ]
}
```

### ScheduleDataShop.json (0.10 MB, 983 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 300101,
  "BeginTime": "2021-05-28 04:00:00",
  "EndTime": "2099-12-30 04:00:00"
}
```

### StoryProp.json (0.09 MB, 377 条)

**字段** (6): `ConfigEntityPath, JsonPath, PropID, StoryCharacterID, StoryCharacterModelPath, StoryCharacterUniqueName`

**首条记录摘要**:
```json
{
  "StoryCharacterID": "Prop_W2_Luocha_Coffin_01",
  "StoryCharacterUniqueName": "W2_Luocha_Coffin_01",
  "StoryCharacterModelPath": "Props/Outputs/Chap02/Chap02_Prop_Luocha_...",
  "ConfigEntityPath": "",
  "JsonPath": ""
}
```

### SwordTrainingEffect.json (0.08 MB, 547 条)

**字段** (6): `Condition, Count, EffectType, EnhanceActionList, ID, ParamList`

**首条记录摘要**:
```json
{
  "ID": 111,
  "EffectType": "AddStatus",
  "ParamList": [
    9,
    0,
    0,
    0
  ],
  "EnhanceActionList": []
}
```

### StageInfiniteGroup.json (0.06 MB, 620 条)

**字段** (2): `WaveGroupID, WaveIDList`

**首条记录摘要**:
```json
{
  "WaveGroupID": 101,
  "WaveIDList": [
    10101,
    10102,
    10103,
    10104,
    10105
  ]
}
```

### SFXConfig.json (0.06 MB, 639 条)

**字段** (4): `IsPlayerInvolved, SFXID, SFXPath, SFXType`

**首条记录摘要**:
```json
{
  "SFXID": 10030,
  "SFXPath": "sfx_belobog_cutscene_030"
}
```

### TeamBuildConfig.json (0.06 MB, 135 条)

**字段** (10): `AvatarID, BackupGroupList1, BackupGroupList2, BackupGroupList3, BackupList1, BackupList2, BackupList3, MemberList, Position, TeamID`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "TeamID": 1,
  "Position": 1,
  "MemberList": [
    1408,
    1412,
    1313
  ],
  "BackupList1": [],
  "BackupList2": [
    1313,
    1403,
    1309,
    1303
  ],
  "BackupList3": [
    1403,
    1309,
    1303
  ],
  "BackupGroupList1": [
    103,
    102
  ],
  "BackupGroupList2": [
    104
  ],
  "BackupGroupList3": [
    101
  ]
}
```

### TrainPartyCardConfig.json (0.06 MB, 174 条)

**字段** (7): `CardActJson, CardEffectJson, CardID, CardImage, CardName, PassengerID, Rarity`

**首条记录摘要**:
```json
{
  "CardID": 101,
  "CardName": {
    "Hash": 8369859666529231710
  },
  "CardImage": "SpriteOutput/Emoji/20004.png",
  "Rarity": 1,
  "CardActJson": "Config/Level/TrainParty/TrainPartyCard/T...",
  "CardEffectJson": "Config/Level/TrainParty/TrainPartyCard/T..."
}
```

### TeleportConfig.json (0.06 MB, 482 条)

**字段** (6): `ConfigID, FloorID, GroupID, ID, InitialEnable, PlaneID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "PlaneID": 20101,
  "FloorID": 20101001,
  "GroupID": 56,
  "ConfigID": 300001
}
```

### StoryAtlas.json (0.05 MB, 461 条)

**字段** (6): `AvatarID, ReplaceID, SortID, Story, StoryID, Unlock`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "StoryID": 11,
  "Story": {
    "Hash": 6823950950020371399
  },
  "Unlock": 70006
}
```

### StageConfigLD.json (0.05 MB, 51 条)

**字段** (17): `EliteGroup, ForbidAutoBattle, ForbidExitBattle, HardLevelGroup, Level, LevelGraphPath, LevelLoseCondition, LevelWinCondition, MonsterList, MonsterWarningRatio, StageAbilityConfig, StageConfigData, StageID, StageName, StageType, SubLevelGraphs, TrialAvatarList`

**首条记录摘要**:
```json
{
  "StageID": 429001,
  "StageType": "FateRin",
  "StageName": {
    "Hash": 7086853316639384589
  },
  "HardLevelGroup": 4401,
  "Level": 10,
  "LevelGraphPath": "Config/Level/StageCommonTemplate.json",
  "StageAbilityConfig": "<list[4]>",
  "SubLevelGraphs": "<list[1]>",
  "StageConfigData": "<list[3]>",
  "MonsterList": "<list[3]>",
  "LevelLoseCondition": [],
  "LevelWinCondition": "<list[1]>",
  "ForbidAutoBattle": true,
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### ShopConfig.json (0.05 MB, 106 条)

**字段** (17): `ActivityModuleID, HideRemainTime, IsOpen, LimitType1, LimitValue1List, LimitValue2List, ScheduleDataID, ServerVerification, ShopBar, ShopDesc, ShopGroupID, ShopID, ShopIconPath, ShopMainType, ShopName, ShopSortID, ShopType`

**首条记录摘要**:
```json
{
  "ShopID": 101,
  "ShopGroupID": 1,
  "ShopMainType": "Main",
  "ShopType": 1,
  "ShopName": {
    "Hash": 16829471444158351973
  },
  "ShopDesc": {
    "Hash": 5242659586514105497
  },
  "ShopIconPath": "SpriteOutput/TabIcon/Shop/ShopDrawcardIc...",
  "ShopBar": "Shop101Page",
  "ShopSortID": 2,
  "LimitType1": "Level",
  "LimitValue1List": [
    1
  ],
  "LimitValue2List": [],
  "IsOpen": true,
  "ScheduleDataID": 300101,
  "HideRemainTime": true
}
```

### TextJoinItem.json (0.05 MB, 559 条)

**字段** (2): `TextJoinItemID, TextJoinText`

**首条记录摘要**:
```json
{
  "TextJoinItemID": 180,
  "TextJoinText": {
    "Hash": 16160812477419508579
  }
}
```

### SwordTrainingEventOption.json (0.04 MB, 120 条)

**字段** (6): `EffectIDList, OptionDesc, OptionID, ResultAudio, ResultDesc, ResultImage`

**首条记录摘要**:
```json
{
  "OptionID": 1111,
  "EffectIDList": [
    211111
  ],
  "OptionDesc": {
    "Hash": 7786959404161372706
  },
  "ResultDesc": {
    "Hash": 16970365847542267942
  },
  "ResultImage": "SpriteOutput/Quest/SwordTraining/Partner...",
  "ResultAudio": "Ev_Vo_Activity_Mar7th_vo_exclamation_w2_..."
}
```

### SwordTrainingPartnerAbility.json (0.04 MB, 115 条)

**字段** (7): `AbilityDesc, AbilityIcon, AbilityName, DescParamList, EffectIDList, PartnerAbilityID, Rare`

**首条记录摘要**:
```json
{
  "PartnerAbilityID": 1101,
  "EffectIDList": [
    1110101
  ],
  "Rare": 1,
  "AbilityIcon": "SpriteOutput/Quest/SwordTraining/SwordTr...",
  "AbilityName": {
    "Hash": 10066422990272588355
  },
  "AbilityDesc": {
    "Hash": 10947698740486564784
  },
  "DescParamList": [
    50
  ]
}
```

### TreasureDungeonGrid.json (0.04 MB, 118 条)

**字段** (13): `EffectType, GridID, GridSubType, GridType, IconPath, IconPath2D, Name, OpenBuff, ParamInt, ReplaceGridID, TutorialTriggerString, TutorialTriggerType, TypeParam`

**首条记录摘要**:
```json
{
  "GridType": "Normal",
  "TypeParam": [],
  "IconPath": "",
  "IconPath2D": "",
  "TutorialTriggerString": ""
}
```

### StroyLineUIData.json (0.03 MB, 68 条)

**字段** (9): `ChronicleIconPath, Color, FigurePath, Gender, IconPath, LargeImgPath, MediumImgPath, Name, StoryLineID`

**首条记录摘要**:
```json
{
  "Gender": "GENDER_MAN",
  "Name": {
    "Hash": 4453270059291636354
  },
  "IconPath": "SpriteOutput/AvatarIcon/Avatar/8001.png",
  "ChronicleIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/8001...",
  "MediumImgPath": "SpriteOutput/StoryLine/StoryLineChapterI...",
  "LargeImgPath": "SpriteOutput/StoryLine/StoryLineChapterI...",
  "FigurePath": "SpriteOutput/StoryLine/StoryLineChapterI...",
  "Color": "#dbc291"
}
```

### TreasureDungeonBuff.json (0.03 MB, 125 条)

**字段** (14): `BattleTargetBouns, BattleTargetID, BgDesc, BuffGroupID, BuffID, Desc, DisplayRarity, FigurePath, IsSaveNextFloor, ParamInt, TargetBounsParam, Type, TypeParam, UseTime`

**首条记录摘要**:
```json
{
  "BuffID": 2,
  "Type": "BattleAddMazeBuff",
  "TypeParam": [],
  "ParamInt": 3100046,
  "DisplayRarity": 1,
  "FigurePath": "SpriteOutput/ItemIcon/140140.png"
}
```

### TutorialSubGuideGroup.json (0.03 MB, 83 条)

**字段** (9): `BHHPLHIGOHE, FLBGELFEBCK, HNLJKFJOACC, JMDGIBDPMJF, JMLNPBDIHDG, JNDOMOJHOEF, LLDCHLHNADA, LPBKPCCKFJG, ODEKADIBFAO`

**首条记录摘要**:
```json
{
  "LLDCHLHNADA": 1001,
  "LPBKPCCKFJG": true,
  "BHHPLHIGOHE": [
    100101,
    100102
  ],
  "FLBGELFEBCK": 998,
  "JMDGIBDPMJF": "<list[1]>",
  "JNDOMOJHOEF": [],
  "HNLJKFJOACC": {
    "Hash": 18212868757188547349
  },
  "ODEKADIBFAO": 90006
}
```

### ScheduleDataQuest.json (0.03 MB, 287 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 21001801,
  "BeginTime": "2022-04-25 04:00:00",
  "EndTime": "2022-06-21 04:00:00"
}
```

### TrainPartyEventConfig.json (0.03 MB, 180 条)

**字段** (3): `EffectJsonPath, EventActPath, EventID`

**首条记录摘要**:
```json
{
  "EventID": 10001,
  "EventActPath": "Config/Level/TrainParty/TrainPartyEvent/...",
  "EffectJsonPath": "Config/Level/TrainParty/TrainPartyEvent/..."
}
```

### StoryLine.json (0.03 MB, 66 条)

**字段** (9): `BeginCondition, EarlyAccessContentID, EndCondition, InitAnchorID, InitEntranceID, InitGroupID, PerformanceStoryAvatar, ShowCondition, StoryLineID`

**首条记录摘要**:
```json
{
  "StoryLineID": 1031101,
  "BeginCondition": "<dict[2]>",
  "EndCondition": "<dict[2]>",
  "ShowCondition": "[BetweenSubMission:103110108,103110151]|...",
  "InitEntranceID": 2031101,
  "InitGroupID": 634,
  "InitAnchorID": 1,
  "PerformanceStoryAvatar": "NPC_Avatar_Lad_Aventurine_00"
}
```

### TextJoinConfig.json (0.02 MB, 191 条)

**字段** (5): `DefaultItem, IsOverride, TextJoinID, TextJoinItemList, Type`

**首条记录摘要**:
```json
{
  "TextJoinID": 18,
  "DefaultItem": 180,
  "TextJoinItemList": [
    180,
    181,
    182
  ]
}
```

### StatusConfigLD.json (0.02 MB, 50 条)

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 63061008,
  "ModifierName": "Modifier_Activity_FateRin_Card_Ability_6...",
  "StatusName": {
    "Hash": 10740594613519151003
  },
  "StatusType": "Debuff",
  "StatusDesc": {
    "Hash": 16180776029672158461
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconDeBuff...",
  "StatusIconPathHighSize": "",
  "StatusEffect": {
    "Hash": 7138621048020541947
  },
  "CanDispel": true,
  "ReadParamList": [
    "DamageUpRatio"
  ],
  "TagList": []
}
```

### TarotMails.json (0.02 MB, 294 条)

**字段** (2): `ID, Sentence`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Sentence": {
    "Hash": 7603403399977458823
  }
}
```

### TreasureDungeonFloor.json (0.02 MB, 74 条)

**字段** (8): `AddExploreValue, DungeonBuffID, DungeonID, EliteGroup2, FloorID, HardLevelGroupID, HardLevelList, MapID`

**首条记录摘要**:
```json
{
  "DungeonID": 10,
  "FloorID": 1,
  "MapID": [
    1001
  ],
  "DungeonBuffID": [
    309
  ],
  "HardLevelGroupID": 1,
  "HardLevelList": [
    25,
    35,
    45,
    55,
    65,
    75,
    80
  ],
  "EliteGroup2": 400
}
```

### TrainPartyEventBgConfig.json (0.02 MB, 119 条)

**字段** (4): `BgConfigJsonPath, BgID, BgImage, TriggerAnimationName`

**首条记录摘要**:
```json
{
  "BgID": 1,
  "BgImage": "",
  "BgConfigJsonPath": "",
  "TriggerAnimationName": ""
}
```

### TrainPartyMTRank.json (0.02 MB, 104 条)

**字段** (5): `Rank, RankName, RankNum, RankPrefabPath, RankScore`

**首条记录摘要**:
```json
{
  "Rank": 1,
  "RankPrefabPath": "UI/Quest/TrainParty/Widget/MeetingCard/R...",
  "RankName": {
    "Hash": 10291089486624136460
  }
}
```

### SwordTrainingAction.json (0.02 MB, 23 条)

**字段** (11): `ActionID, ActionIcon, ActionImage, ActionLevel, ActionName, ActionPerformPrefab, ActionPlanImage, ActionSubName, ActionType, DisplayEffectHintList, EffectIDList`

**首条记录摘要**:
```json
{
  "ActionID": 1,
  "ActionLevel": 1,
  "ActionType": "Train",
  "EffectIDList": [
    111,
    112
  ],
  "ActionName": {
    "Hash": 15684106641866289524
  },
  "ActionSubName": {
    "Hash": 6979935689184989260
  },
  "DisplayEffectHintList": [],
  "ActionImage": "SpriteOutput/Quest/SwordTraining/PlanImg...",
  "ActionIcon": "SpriteOutput/Quest/SwordTraining/SwordTr...",
  "ActionPlanImage": "SpriteOutput/Quest/SwordTraining/PlanImg...",
  "ActionPerformPrefab": "<list[4]>"
}
```

### SwordTrainingCondition.json (0.02 MB, 176 条)

**字段** (3): `CheckType, ConditionID, ParamList`

**首条记录摘要**:
```json
{
  "ConditionID": 2,
  "CheckType": "CurStoryLine",
  "ParamList": [
    2
  ]
}
```

### TarotBookClue.json (0.02 MB, 195 条)

**字段** (3): `ID, Name, Style`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "Name": {
    "Hash": 1913316339683067349
  },
  "Style": 300
}
```

### ScheduleDataActivityPanel.json (0.02 MB, 183 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 510012,
  "BeginTime": "2022-08-11 10:00:00",
  "EndTime": "2022-09-20 04:00:01"
}
```

### SwordTrainingProgress.json (0.02 MB, 60 条)

**字段** (10): `ActionIDList, ExamID, PartnerAbilityGroupID, PartnerAbilitySelectHint, PartnerAbilitySelectNum, RecommendPower, SectionHint, TurnID, TurnName, TurnType`

**首条记录摘要**:
```json
{
  "TurnID": 101,
  "TurnType": "Action",
  "ActionIDList": [
    1,
    2,
    3,
    4,
    5
  ],
  "RecommendPower": 2,
  "TurnName": {
    "Hash": 13469068884463697628
  },
  "SectionHint": {
    "Hash": 18400355173954856460
  }
}
```

### SummonUnitData.json (0.02 MB, 74 条)

**字段** (9): `DestroyOnEnterBattle, ID, IsClient, IsTeamSummon, JsonPath, MaxSummonCount, RemoveMazeBuffOnDestroy, SummonerType, UniqueGroup`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "JsonPath": "Config/ConfigSummonUnit/SummonUnit_Himek...",
  "DestroyOnEnterBattle": true,
  "RemoveMazeBuffOnDestroy": true,
  "MaxSummonCount": 1,
  "UniqueGroup": "TeamField"
}
```

### SKillNavigationConfig.json (0.02 MB, 166 条)

**字段** (6): `AvatarBaseType, Down, Left, PointID, Right, Up`

**首条记录摘要**:
```json
{
  "AvatarBaseType": "Warrior",
  "PointID": 1,
  "Up": 17,
  "Down": 6,
  "Left": 11,
  "Right": 3
}
```

### TutorialSubGuideData.json (0.02 MB, 125 条)

**字段** (4): `FBKAMIHGLFK, FLEADHOPGGN, PHFMCACHFIJ, PJHMJKEIGOA`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 100101,
  "FBKAMIHGLFK": "",
  "PJHMJKEIGOA": {
    "Hash": 6636153336510038151
  }
}
```

### TextSpriteConfig.json (0.02 MB, 131 条)

**字段** (2): `SpriteName, SpritePath`

**首条记录摘要**:
```json
{
  "SpriteName": "ActivityChimeraATK",
  "SpritePath": "SpriteOutput/UI/Quest/Chimera/ChimeraTex..."
}
```

### TreasureDungeonItem.json (0.02 MB, 46 条)

**字段** (9): `AudioEventName, Desc, IconPath, IconPath2D, ItemID, Name, ParamInt, Type, TypeParam`

**首条记录摘要**:
```json
{
  "ItemID": 1,
  "Type": "ExploreRecovery",
  "TypeParam": [],
  "ParamInt": 3,
  "Name": {
    "Hash": 7561453359220851805
  },
  "IconPath": "SpriteOutput/ItemFigures/Activity/Treasu...",
  "IconPath2D": "SpriteOutput/ItemFigures/Activity/Treasu...",
  "AudioEventName": "Ev_sfx_ui_feedback_activity_treasuredung..."
}
```

### SwordTrainingSkill.json (0.01 MB, 30 条)

**字段** (14): `AvatarStatusAddList, Condition, Cost, MazeBuffID, NextSkillIDList, ParamList, Rare, SkillID, SkillIcon, SkillName, SkillPower, SkillRank, SkillTag, SkillTypeID`

**首条记录摘要**:
```json
{
  "SkillID": 101,
  "SkillTypeID": 1,
  "NextSkillIDList": [
    102
  ],
  "Cost": {
    "ItemID": 281023
  },
  "AvatarStatusAddList": [],
  "Condition": 101,
  "MazeBuffID": 3112001,
  "Rare": 1,
  "SkillTag": {
    "Hash": 6823582124702493409
  },
  "SkillName": {
    "Hash": 11873996174668511132
  },
  "SkillPower": 2,
  "SkillIcon": "SpriteOutput/UI/Avatar/Icon/IconAttack.p...",
  "ParamList": [
    200
  ],
  "SkillRank": 1
}
```

### SwordTrainingEvent.json (0.01 MB, 40 条)

**字段** (6): `EventID, EventImage, OptionIDList, TalkEventText1, TalkEventText2, TalkEventText3`

**首条记录摘要**:
```json
{
  "EventID": 111,
  "OptionIDList": [
    1111,
    1112,
    1113
  ],
  "EventImage": "SpriteOutput/Quest/SwordTraining/EventIm...",
  "TalkEventText1": {
    "Hash": 6997922848393363886
  },
  "TalkEventText2": {
    "Hash": 16939692042680317212
  },
  "TalkEventText3": {
    "Hash": 17885712915137190987
  }
}
```

### TrainPartyMTSkill.json (0.01 MB, 108 条)

**字段** (4): `BOKJJKFCFME, LDCJONHGDAN, OFLMIGOHDDF, PBLPLDJKPEI`

**首条记录摘要**:
```json
{
  "BOKJJKFCFME": 101,
  "OFLMIGOHDDF": 1,
  "PBLPLDJKPEI": [
    10
  ],
  "LDCJONHGDAN": [
    101011
  ]
}
```

### ScoringConfig.json (0.01 MB, 92 条)

**字段** (5): `AbilityName, DisplayTypeList, GameModeGroup, ParamList, ScoringID`

**首条记录摘要**:
```json
{
  "ScoringID": 10001,
  "AbilityName": "FantasticStoryHard_Scoring_Ability_0001",
  "DisplayTypeList": [
    "Normal"
  ],
  "ParamList": [],
  "GameModeGroup": 1001
}
```

### TrainPartyDynamicConfig.json (0.01 MB, 52 条)

**字段** (6): `ID, IconPath, IsActivity, PrefabPath, Taglist, UseLowLight`

**首条记录摘要**:
```json
{
  "ID": 291001,
  "IconPath": "SpriteOutput/ItemIcon/FurnitureIconNoBox...",
  "Taglist": [
    2,
    5
  ],
  "PrefabPath": "Stages/OriginalResPos/Chapter00/Prefab/C...",
  "IsActivity": 1
}
```

### StoryLineFloorData.json (0.01 MB, 89 条)

**字段** (4): `ConditionExpression, DimensionID, FloorID, StoryLineID`

**首条记录摘要**:
```json
{
  "FloorID": 20322001,
  "StoryLineID": 1031101,
  "ConditionExpression": "[BetweenSubMission:103110108,103110163]",
  "DimensionID": 2
}
```

### TarotWikiSubdata.json (0.01 MB, 72 条)

**字段** (5): `ChangeID, Details, ID, Title, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "Title": {
    "Hash": 10850999383928572771
  },
  "Details": {
    "Hash": 4718648923422940396
  },
  "ChangeID": [
    3510101
  ]
}
```

### StrongChallengeStage.json (0.01 MB, 10 条)

**字段** (23): `ActivityModuleID, AvailableBuffList, BattleAreaGroupID, BattleAreaID, BattleType, BossDetailList, ClearScoreLine, CostLimit, EventID, FloorID, MonsterBgFigurePath, MonsterFigurePath, MonsterGrayFigurePath, Name, PlaneID, PreStageID, QuestGroupID, QuestList, RecommendAvatar, RecommendNature, ScoreInterval, SpecialAvatarIDList, StrongChallengeStageID`

**首条记录摘要**:
```json
{
  "StrongChallengeStageID": 1,
  "ActivityModuleID": 4000401,
  "MonsterFigurePath": "SpriteOutput/UI/Quest/ActivityStrongChal...",
  "MonsterGrayFigurePath": "SpriteOutput/UI/Quest/ActivityStrongChal...",
  "MonsterBgFigurePath": "SpriteOutput/UI/Quest/ActivityStrongChal...",
  "Name": {
    "Hash": 12318370232788081571
  },
  "QuestList": [
    6000500,
    6000501,
    6000502,
    6000503
  ],
  "QuestGroupID": 1,
  "BattleType": "Normal",
  "CostLimit": 2,
  "AvailableBuffList": [
    3104102,
    3104104,
    3104501,
    3104504
  ],
  "BossDetailList": [
    101,
    102,
    105,
    103
  ],
  "ScoreInterval": [
    3200,
    2600,
    2000,
    1000,
    0
  ],
  "ClearScoreLine": 500,
  "RecommendNature": [
    "Fire",
    "Ice",
    "Quantum"
  ],
  "RecommendAvatar": [
    1002,
    1005
  ],
  "SpecialAvatarIDList": [
    3091102,
    3091006
  ],
  "EventID": 420011,
  "PlaneID": 20222,
  "FloorID": 20222001,
  "BattleAreaGroupID": 3,
  "BattleAreaID": 2
}
```

### TrainPartyStepConfig.json (0.01 MB, 40 条)

**字段** (9): `CoinCost, GroupID, HasCutScene, HasPreview, ID, ImgPath, Name, SortID, StaticPropIDList`

**首条记录摘要**:
```json
{
  "ID": 101010,
  "GroupID": 100,
  "CoinCost": 1000,
  "SortID": 1,
  "StaticPropIDList": [
    10003
  ],
  "HasPreview": true,
  "HasCutScene": true,
  "Name": {
    "Hash": 9917778097374476027
  },
  "ImgPath": "SpriteOutput/Quest/TrainParty/BuildAreaI..."
}
```

### StroyLineTrialAvatarData.json (0.01 MB, 66 条)

**字段** (5): `CaptainAvatarID, InitTrialAvatarList, SkipJoinLineup, StoryLineID, TrialAvatarList`

**首条记录摘要**:
```json
{
  "StoryLineID": 1031101,
  "TrialAvatarList": [
    1021304
  ],
  "InitTrialAvatarList": [
    1021304
  ],
  "CaptainAvatarID": 1021304
}
```

### TrainPartySkillConfig.json (0.01 MB, 32 条)

**字段** (6): `IsRare, SKillID, SkillDescription, SkillFigurePath, SkillIconPath, SkillName`

**首条记录摘要**:
```json
{
  "SKillID": 101,
  "SkillName": {
    "Hash": 18271744060401339940
  },
  "SkillDescription": {
    "Hash": 9300207435174953117
  },
  "SkillIconPath": "SpriteOutput/Quest/TrainParty/Skill/Item...",
  "SkillFigurePath": "SpriteOutput/Quest/TrainParty/Skill/Item..."
}
```

### TrainPartySkillEffect.json (0.01 MB, 112 条)

**字段** (3): `EffectID, EffectType, ParamList`

**首条记录摘要**:
```json
{
  "EffectID": 101011,
  "EffectType": "BaseScoreUpPerCard",
  "ParamList": [
    10
  ]
}
```

### SwordTrainingPartnerGroup.json (0.01 MB, 80 条)

**字段** (3): `PartnerAbilityDrop, PartnerAbilityGroupID, PartnerAbilityWeight`

**首条记录摘要**:
```json
{
  "PartnerAbilityGroupID": 10000,
  "PartnerAbilityDrop": [
    1101,
    1103
  ],
  "PartnerAbilityWeight": 100
}
```

### TalkReward.json (0.01 MB, 66 条)

**字段** (8): `FloorID, GroupID, ID, NPCConfigID, PlaneID, PropConfigID, RewardID, VerificationID`

**首条记录摘要**:
```json
{
  "ID": 1000006,
  "PlaneID": 20001,
  "FloorID": 20001001,
  "GroupID": 53,
  "NPCConfigID": 400002,
  "RewardID": 2000047,
  "VerificationID": 1
}
```

### TarotBookCharacterLevel.json (0.01 MB, 91 条)

**字段** (4): `CharacterID, HintID, ImagePath, Level`

**首条记录摘要**:
```json
{
  "CharacterID": 1,
  "ImagePath": "",
  "HintID": {
    "Hash": 16685926943213793590
  }
}
```

### TravelBrochureConfig.json (0.01 MB, 18 条)

**字段** (13): `BackgroundPrefab, Conditions, DiaryGroupID, DirectoryName, FinishQuestID, FrontPrefab, ID, PasterAchievementPic, PicPath, ShowInDirectory, ShowUnlockToast, Sort, Type`

**首条记录摘要**:
```json
{
  "ID": 101,
  "DiaryGroupID": 101,
  "Conditions": "<list[1]>",
  "Type": "Intro",
  "DirectoryName": {
    "Hash": 7207941608492344885
  },
  "Sort": 1,
  "BackgroundPrefab": "UI/TravelBrochure/Widget/TBStickerBg/TBS...",
  "FrontPrefab": "UI/TravelBrochure/Widget/TBStickerBg/TBS...",
  "PicPath": "",
  "PasterAchievementPic": "",
  "ShowInDirectory": true
}
```

### TeamTowersStage.json (0.01 MB, 21 条)

**字段** (10): `AJJOOHJFNMC, BFDOFFNMCPO, EBDLFNOELLO, GMPGDEINODK, IOCHHAPIOJA, JDKLJBMHHKO, MMOFKKMMKLK, PEOFHNELHLJ, PHFMCACHFIJ, PPNLEBDNKNI`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "GMPGDEINODK": "Normal",
  "BFDOFFNMCPO": 1001,
  "EBDLFNOELLO": [
    1,
    2,
    4,
    6
  ],
  "IOCHHAPIOJA": "Config/Gameplays/LittleGame/TeamTowers/L...",
  "AJJOOHJFNMC": "Config/Gameplays/LittleGame/TeamTowers/P...",
  "PEOFHNELHLJ": [],
  "PPNLEBDNKNI": [
    101
  ],
  "JDKLJBMHHKO": []
}
```

### SpaceZooFeatureConfig.json (0.01 MB, 33 条)

**字段** (7): `Channel, FeatureID, FeatureKey, ImagePath, LargeImagePath, Name, ResearchPoint`

**首条记录摘要**:
```json
{
  "FeatureID": 100,
  "Channel": "BodyDecal",
  "ImagePath": "",
  "LargeImagePath": "",
  "FeatureKey": ""
}
```

### TrainPartyStaticConfig.json (0.01 MB, 62 条)

**字段** (6): `AreaID, ID, IconPath, SlotList, Type, UseLowLight`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "AreaID": 11,
  "SlotList": [],
  "IconPath": "",
  "Type": "Rubbish",
  "UseLowLight": true
}
```

### TarotBookInteraction.json (0.01 MB, 24 条)

**字段** (6): `FinishConditionList, ID, JsonPath, Priority, StartConditionList, Title`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Priority": 1,
  "Title": {
    "Hash": 808850406999250189
  },
  "StartConditionList": "<list[1]>",
  "FinishConditionList": [],
  "JsonPath": "Config/Level/TarotBook/TarotBookInteract..."
}
```

### TarotBookStory.json (0.01 MB, 65 条)

**字段** (5): `CardID, CharacterID, ClueList, ID, PreStoryID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "CharacterID": 1,
  "CardID": 9901,
  "ClueList": [
    10101,
    10102,
    10103
  ]
}
```

### ServerInteractVerification.json (0.01 MB, 101 条)

**字段** (3): `ID, InteractType, InteractTypeConfig`

**首条记录摘要**:
```json
{
  "ID": 1,
  "InteractType": "Shop",
  "InteractTypeConfig": [
    2
  ]
}
```

### SysMailConfig.json (0.01 MB, 37 条)

**字段** (6): `MailDetail, MailID, MailLifeTime, MailSender, MailTitle, Type`

**首条记录摘要**:
```json
{
  "MailID": 101,
  "MailTitle": {
    "Hash": 62901240679193809
  },
  "MailSender": {
    "Hash": 5555264597229776791
  },
  "MailDetail": {
    "Hash": 16520542609381106997
  },
  "MailLifeTime": 30
}
```

### TreasureDungeonAvatar.json (0.01 MB, 45 条)

**字段** (5): `AvatarPickID, Dialogue1, FigureDiff, FigureScale, SpecialAvataID`

**首条记录摘要**:
```json
{
  "AvatarPickID": 11101,
  "SpecialAvataID": 3021101,
  "Dialogue1": {
    "Hash": 13805220870049440957
  },
  "FigureDiff": [
    106,
    126
  ],
  "FigureScale": 1.3
}
```

### TarotBookCharacter.json (0.01 MB, 13 条)

**字段** (12): `ID, MainCatalogTitle, MaxLevel, Name, Position, PrefabPath, RectIconPath, RoundIconPath, StoryList, SubCatalogTitle, TabIconPath, Tag`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StoryList": [
    101,
    102,
    103,
    104,
    105
  ],
  "Name": {
    "Hash": 5641617775544308405
  },
  "MainCatalogTitle": {
    "Hash": 5415111323548479597
  },
  "SubCatalogTitle": {
    "Hash": 7985981783084873334
  },
  "MaxLevel": 6,
  "PrefabPath": "UI/TarotBook/Card/TarotBookCard01Element...",
  "TabIconPath": "SpriteOutput/TarotBookTitanIcon/01_Ianos...",
  "RoundIconPath": "SpriteOutput/TarotBook/TarotCard/RoundIc...",
  "RectIconPath": "SpriteOutput/TarotBook/TarotCard/Catalog...",
  "Position": 1
}
```

### SpecialNPCData.json (0.01 MB, 24 条)

**字段** (5): `ConfigEntityPath, ID, JsonPath, MazeSkillIdList, PrefabPath`

**首条记录摘要**:
```json
{
  "ID": 12113,
  "PrefabPath": "Characters/CharacterPrefabs/FakePlayer/W...",
  "ConfigEntityPath": "",
  "JsonPath": "Config/ConfigCharacter/FakePlayer/FakePl...",
  "MazeSkillIdList": [
    1211201
  ]
}
```

### TeamTowersBoss.json (0.01 MB, 16 条)

**字段** (10): `BDACPPLKLGL, CBBDEODGNDG, DBIHGLJEGPO, FBKAMIHGLFK, GFLGOBHOKHI, HAEDMJHMJHC, KKJHBCAHFAO, NMAHGFAPENI, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "OENAMINOLLF": {
    "Hash": 15858580885622246638
  },
  "NMAHGFAPENI": {
    "Hash": 1112436894330204912
  },
  "BDACPPLKLGL": "Gameplays/TeamTowers/Boss/TeamTowers_Bos...",
  "KKJHBCAHFAO": "Config/Gameplays/LittleGame/TeamTowers/P...",
  "FBKAMIHGLFK": "SpriteOutput/Quest/TeamTower/BossItem/Te...",
  "GFLGOBHOKHI": [],
  "DBIHGLJEGPO": 1001,
  "HAEDMJHMJHC": 100101,
  "CBBDEODGNDG": []
}
```

### SpecialMappingInfo.json (0.01 MB, 114 条)

**字段** (2): `ID, ParamList`

**首条记录摘要**:
```json
{
  "ID": 2223,
  "ParamList": [
    402
  ]
}
```

### ScheduleDataRogue.json (0.01 MB, 78 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 100001,
  "BeginTime": "2021-05-30 04:00:00",
  "EndTime": "2022-05-30 03:59:59"
}
```

### TravelBrochureDiaryChoice.json (0.01 MB, 56 条)

**字段** (3): `ChoiceMessage, DetailMessage, ID`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "ChoiceMessage": {
    "Hash": 16109048495737127650
  }
}
```

### ToastManager.json (0.01 MB, 94 条)

**字段** (4): `Duration, FuncName, IsinBattle, Priority`

**首条记录摘要**:
```json
{
  "FuncName": "MissionStart",
  "Priority": 20
}
```

### TreasureDungeonConfig.json (0.01 MB, 10 条)

**字段** (17): `Desc, DisplayEventID, DisplayMonsterIDList, DungeonID, EntranceIconPath, ExploreSubHpRatio, GridExploreCost, GridPrefabType, GroupID, ImgPath, InitialExplore, MaxExplore, Name, PreDungeonID, RecommendNature, SpecialAvatarIDList, UnlockID`

**首条记录摘要**:
```json
{
  "DungeonID": 10,
  "GroupID": 10,
  "InitialExplore": 25,
  "MaxExplore": 30,
  "GridExploreCost": 1,
  "ExploreSubHpRatio": 300,
  "SpecialAvatarIDList": [
    3021005,
    3021111
  ],
  "Name": {
    "Hash": 17280840603754046950
  },
  "Desc": {
    "Hash": 11924036041317694522
  },
  "ImgPath": "UI/UI3D/TreasureDungeon/_dependencies/Ma...",
  "EntranceIconPath": "SpriteOutput/UI/Quest/TreasureDungeon/TG...",
  "DisplayMonsterIDList": [
    1013010,
    1013020
  ],
  "DisplayEventID": 306010,
  "RecommendNature": [
    "Ice",
    "Thunder",
    "Fire",
    "Imaginary"
  ]
}
```

### SwordTrainingStory.json (0.01 MB, 21 条)

**字段** (12): `EffectDesc, EffectIDList, MissionID, PartnerID, PerformanceID, RepeatPerformanceID, StoryDesc, StoryHint, StoryID, StoryImage, StoryTitle, StoryType`

**首条记录摘要**:
```json
{
  "StoryID": 1,
  "StoryType": "Ending",
  "MissionID": 8024111,
  "RepeatPerformanceID": 802411154,
  "StoryImage": "SpriteOutput/Quest/SwordTraining/CoverIm...",
  "StoryTitle": {
    "Hash": 10153724180338103935
  },
  "StoryDesc": {
    "Hash": 14133579955557688322
  },
  "EffectIDList": []
}
```

### SpaceZooSpecialCat.json (0.01 MB, 10 条)

**字段** (13): `ColorBar, ImagePath, IsHide, LargeImagePath, MatPath, MatchedChannelFeature, Name, PhotoSubmissionID, ResearchPointSSR, SpecialCatID, SpecialItem, TipsCustomizedCat, TipsMissionID`

**首条记录摘要**:
```json
{
  "SpecialCatID": 10001,
  "ImagePath": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "LargeImagePath": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "MatPath": "Characters/NPC/Special/RuanMadeCake/Mati...",
  "MatchedChannelFeature": [
    0,
    204,
    303,
    0,
    502,
    0
  ],
  "Name": {
    "Hash": 17014757071790289333
  },
  "SpecialItem": 408001,
  "TipsCustomizedCat": [],
  "ResearchPointSSR": 80,
  "ColorBar": [
    "[#71d7bb,#7dacc1,#88bcd2,#c6e1e9]"
  ]
}
```

### TarotBookDeleteInfo.json (0.01 MB, 26 条)

**字段** (7): `FadeInTime, ID, ProgressDesc, ProgressEnd, ProgressGapTime, SentenceName, SentenceTextmapID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SentenceTextmapID": {
    "Hash": 6391890611050163086
  },
  "SentenceName": {
    "Hash": 4102155200587281604
  },
  "ProgressDesc": {
    "Hash": 17612408029520425557
  },
  "ProgressEnd": 1,
  "FadeInTime": 0.3
}
```

### TarotWikiChangeinfo.json (0.01 MB, 39 条)

**字段** (4): `ChangeID, NewDetails, NewTitle, UnlockID`

**首条记录摘要**:
```json
{
  "ChangeID": 3510101,
  "UnlockID": 3501,
  "NewTitle": {
    "Hash": 14274959297760483262
  },
  "NewDetails": {
    "Hash": 6250229155128522918
  }
}
```

### TutorialResConfig.json (0.01 MB, 42 条)

**字段** (5): `ContentPath, ID, KeyMapPath, PrefabPath, TextPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PrefabPath": "UI/Guide/Widget/GuideBtnTypeRound.prefab",
  "TextPath": "",
  "KeyMapPath": "",
  "ContentPath": ""
}
```

### SwordTrainingPowerRank.json (0.01 MB, 19 条)

**字段** (8): `PowerRequire, RankGroupID, RankGroupName, RankID, RankIcon, RankProgressName, RankSubName, UnlockID`

**首条记录摘要**:
```json
{
  "RankID": 1,
  "RankGroupID": 1,
  "RankSubName": {
    "Hash": 1625235432135426331
  },
  "RankGroupName": {
    "Hash": 10310691591367248864
  },
  "RankIcon": "SpriteOutput/Quest/SwordTraining/SwordTr..."
}
```

### TeamTowersBubble.json (0.01 MB, 56 条)

**字段** (3): `AABNPBGMOFN, IEHPFADHJFD, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1101,
  "IEHPFADHJFD": 4,
  "AABNPBGMOFN": {
    "Hash": 14504390237389058438
  }
}
```

### TrainPartyPassengerConfig.json (0.01 MB, 9 条)

**字段** (11): `AvatarCardPrefabPath, AvatarRoundIconBgPath, AvatarRoundIconPath, DiaryOrder, IconPath, MeetingIconPath, MiniIconPath, Name, PassengerID, PassengerQuest, UnlcokDesc`

**首条记录摘要**:
```json
{
  "PassengerID": 1001,
  "DiaryOrder": 5,
  "Name": {
    "Hash": 3791589741975246687
  },
  "IconPath": "SpriteOutput/AvatarShopIcon/Avatar/8001....",
  "AvatarRoundIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/8001...",
  "AvatarRoundIconBgPath": "SpriteOutput/UI/Quest/TrainParty/Meeting...",
  "MiniIconPath": "SpriteOutput/AvatarMiniIcon/8001.png",
  "MeetingIconPath": "UI/Quest/TrainParty/Widget/MeetingCard/M...",
  "AvatarCardPrefabPath": "UI/Quest/TrainParty/Widget/MeetingCard/T...",
  "PassengerQuest": 6029321,
  "UnlcokDesc": {
    "Hash": 3207378639361032813
  }
}
```

### SpaceZooInteraction.json (0.01 MB, 27 条)

**字段** (6): `Case, ID, Param, PerformanceID, Priority, RoomID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "RoomID": 2,
  "Priority": 1,
  "Case": "Unfilled",
  "Param": {
    "IntValue": 0
  },
  "PerformanceID": 500900011
}
```

### SpaceZooCustomizedCat.json (0.01 MB, 51 条)

**字段** (3): `AddCatID, ChannelFeature, NotShowDialog`

**首条记录摘要**:
```json
{
  "AddCatID": 100,
  "ChannelFeature": [
    100,
    201,
    303,
    400,
    500,
    600
  ],
  "NotShowDialog": true
}
```

### SwordTrainingExam.json (0.01 MB, 12 条)

**字段** (12): `BattleAreaID, EnemyImage, EnemyName, EnemyPower, ExamID, ExcellentCommentList, FailPerformID, IsLastExam, NormalCommentList, PrePerformID, StageID, SuccessPerformID`

**首条记录摘要**:
```json
{
  "ExamID": 101,
  "PrePerformID": 802410161,
  "StageID": 418001,
  "BattleAreaID": 2021101,
  "SuccessPerformID": [
    802410162
  ],
  "FailPerformID": 802410191,
  "EnemyPower": 2,
  "EnemyImage": "SpriteOutput/Quest/SwordTraining/BattleI...",
  "EnemyName": {
    "Hash": 12974797388302778397
  },
  "ExcellentCommentList": [
    101,
    102,
    103
  ],
  "NormalCommentList": [
    104,
    105,
    106
  ]
}
```

### SpecialNPCSkillConfig.json (0.01 MB, 5 条)

**字段** (29): `AttackType, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPMultipleRatio, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

**首条记录摘要**:
```json
{
  "SkillID": 1211206,
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
  "SkillIcon": "SpriteOutput/SkillIcons/AetherDivide/Ski...",
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
  "StanceDamageType": "Physical",
  "AttackType": "MazeNormal",
  "SkillEffect": "MazeAttack"
}
```

### TrainVisitorConfig.json (0.01 MB, 39 条)

**字段** (8): `AvatarID, LockMissionID, MessageCome, MessageLeave, MessageResident, MissionID, ToastFinishMainMission, VisitorID`

**首条记录摘要**:
```json
{
  "VisitorID": 1009001,
  "MissionID": 2000202,
  "AvatarID": 1009,
  "MessageCome": {
    "Hash": 17444278683495156719
  }
}
```

### TeamLimitCondition.json (0.01 MB, 49 条)

**字段** (5): `ID, LimitDesc, LimitType, ParamInt1, ParamIntList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LimitType": "IncludeAvatar",
  "ParamInt1": 8001,
  "ParamIntList": [],
  "LimitDesc": {
    "Hash": 9501671119615940282
  }
}
```

### SpaceZooConstValueCommon.json (0.01 MB, 32 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "SpaceZoo_BagLimit",
  "Value": {
    "IntValue": 200
  }
}
```

### SubMapConfig.json (0.01 MB, 37 条)

**字段** (8): `AreaID, DefaultLayer, ID, IndoorTeleportMapIconID, MapEntranceID, NearbyTeleportMappingInfoID, RegionID, Type`

**首条记录摘要**:
```json
{
  "ID": 101010901,
  "Type": "AnotherFloor",
  "MapEntranceID": 1010109,
  "NearbyTeleportMappingInfoID": 1010102,
  "IndoorTeleportMapIconID": 121
}
```

### TarotMailbox.json (0.01 MB, 10 条)

**字段** (6): `From, ID, IsSpecial, MailSentenceIDList, Title, To`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Title": {
    "Hash": 3305461588353994037
  },
  "From": {
    "Hash": 16166663696075055106
  },
  "To": {
    "Hash": 17541190453610790690
  },
  "MailSentenceIDList": "<list[28]>"
}
```

### TarotWikiData.json (0.01 MB, 25 条)

**字段** (6): `ChangeID, Details, ID, SubdataList, Title, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Title": {
    "Hash": 6650493134909686108
  },
  "Details": {
    "Hash": 16526754978238015656
  },
  "ChangeID": [],
  "SubdataList": [
    10101,
    10102,
    10103
  ]
}
```

### StageBattleEventConfig.json (0.01 MB, 16 条)

**字段** (9): `AbilityNameList, EventID, EventType, IconPath, IncludeAvatar, IncludeMonster, ModifierNameList, ParamList, SelfModifierNameList`

**首条记录摘要**:
```json
{
  "EventID": 10001,
  "EventType": "Buff",
  "IconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "IncludeAvatar": true,
  "ModifierNameList": [
    "TurnEventMDF_AddDamage"
  ],
  "AbilityNameList": [],
  "SelfModifierNameList": [],
  "ParamList": [
    {
      "Value": 2
    }
  ]
}
```

### ScheduleDataChallengeMaze.json (0.01 MB, 53 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 200101,
  "BeginTime": "2023-02-06 04:00:00",
  "EndTime": "2023-03-06 04:00:00"
}
```

### StarFightStageConfig.json (0.01 MB, 30 条)

**字段** (6): `BattleAreaID, DifficultyLevel, EventID, GroupID, QuestList, UnlockQuest`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "DifficultyLevel": "Easy",
  "EventID": 417001,
  "QuestList": [
    6026100
  ],
  "BattleAreaID": 2033101
}
```

### TarotBookCardPool.json (0.01 MB, 13 条)

**字段** (4): `CardList, ClueList, ID, StoryList`

**首条记录摘要**:
```json
{
  "ID": 301,
  "StoryList": [
    1001
  ],
  "CardList": [
    9910
  ],
  "ClueList": [
    100101,
    100102,
    100103
  ]
}
```

### SpecialChestFindData.json (0.00 MB, 27 条)

**字段** (7): `FloorID, GroupID, InstanceID, IsUseSpecialMappinginfo, ReplaceGroupID, ReplaceInstanceID, ReplaceType`

**首条记录摘要**:
```json
{
  "FloorID": 20223001,
  "GroupID": 21,
  "InstanceID": 300013,
  "ReplaceGroupID": 13,
  "ReplaceInstanceID": 300001,
  "IsUseSpecialMappinginfo": true,
  "ReplaceType": "Always"
}
```

### TarotBookConstValue.json (0.00 MB, 30 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TarotBook_StartTimeSubission",
  "Value": {
    "IntValue": 0
  }
}
```

### TrainPartySlotConfig.json (0.00 MB, 28 条)

**字段** (5): `CameraStaticID, ID, Name, SortID, TagList`

**首条记录摘要**:
```json
{
  "ID": 1100101,
  "Name": {
    "Hash": 5254048492297383726
  },
  "SortID": 1,
  "CameraStaticID": 11001,
  "TagList": [
    6
  ]
}
```

### TeamTowersBossSkill.json (0.00 MB, 9 条)

**字段** (8): `GINFOPOAKHK, NMAHGFAPENI, ODEKADIBFAO, OENAMINOLLF, OLOIFNNLKJP, PBLPLDJKPEI, PHFMCACHFIJ, PNCFJGFAEMA`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 101,
  "OENAMINOLLF": {
    "Hash": 14056339903258328428
  },
  "OLOIFNNLKJP": "SpriteOutput/Quest/TeamTower/BossSkillIc...",
  "PNCFJGFAEMA": "SpriteOutput/Quest/TeamTower/BossSkillIc...",
  "NMAHGFAPENI": {
    "Hash": 12734227099690139018
  },
  "PBLPLDJKPEI": [
    {
      "Value": 3
    }
  ],
  "ODEKADIBFAO": 5011401,
  "GINFOPOAKHK": "Config/Gameplays/LittleGame/TeamTowers/S..."
}
```

### TreasureDungeonEnemyConfig.json (0.00 MB, 29 条)

**字段** (4): `EnemyID, EnemyLevel, SpecialMonsterID, StageEventList`

**首条记录摘要**:
```json
{
  "EnemyID": 1,
  "EnemyLevel": 1,
  "StageEventList": [
    306007
  ]
}
```

### SpaceZooSpecialEvent.json (0.00 MB, 30 条)

**字段** (4): `EventState, HintTip, SpecialCatID, SpecialCatIsMask`

**首条记录摘要**:
```json
{
  "SpecialCatID": 10001,
  "EventState": "Unlock",
  "SpecialCatIsMask": "Translucent",
  "HintTip": {
    "Hash": 11420632185531156705
  }
}
```

### StageInvasionConfig.json (0.00 MB, 14 条)

**字段** (3): `InvasionID, MonsterInvasionList, StageID`

**首条记录摘要**:
```json
{
  "StageID": 30509012,
  "InvasionID": 2,
  "MonsterInvasionList": "<list[2]>"
}
```

### TrainPartyGridConfig.json (0.00 MB, 24 条)

**字段** (4): `GridID, GridIconPath, GridType, ParamList`

**首条记录摘要**:
```json
{
  "GridID": 1001,
  "GridType": "Normal",
  "ParamList": [],
  "GridIconPath": "SpriteOutput/Quest/TrainParty/GameplayGr..."
}
```

### TrainPartyConstValueClient.json (0.00 MB, 24 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Train_Party_Display_Grid_Num",
  "Value": {
    "IntValue": 11
  }
}
```

### ShareChannelConfig.json (0.00 MB, 17 条)

**字段** (10): `Content, DisplayLanguageList, Forum, IconPath, Platform, ShareByNative, ShareChannelID, Title, Topics, UrlTitle`

**首条记录摘要**:
```json
{
  "ShareChannelID": 101,
  "IconPath": "SpriteOutput/CameraShare/Hyperion.png",
  "Platform": "12",
  "DisplayLanguageList": [],
  "Title": "",
  "Content": "",
  "UrlTitle": "",
  "Forum": "",
  "Topics": []
}
```

### TitanAtlas.json (0.00 MB, 18 条)

**字段** (6): `ChangeUnlockID, TitanDesc, TitanGroupID, TitanID, TitanName, TitanVoicePoolID`

**首条记录摘要**:
```json
{
  "TitanID": 10101,
  "TitanName": {
    "Hash": 12464720467448228709
  },
  "TitanDesc": {
    "Hash": 12762966130990980067
  },
  "TitanGroupID": 1,
  "TitanVoicePoolID": 10101,
  "ChangeUnlockID": 9948
}
```

### TrainPartyAreaConfig.json (0.00 MB, 6 条)

**字段** (10): `FirstStep, HiddenBlockList, ID, IconPath, IsShowInActivity, Name, ProgressBonusList, RequireAreaID, ShowBlockList, Sort`

**首条记录摘要**:
```json
{
  "ID": 11,
  "Name": {
    "Hash": 2624959422002899822
  },
  "Sort": 2,
  "RequireAreaID": 12,
  "ProgressBonusList": "<list[5]>",
  "IconPath": "SpriteOutput/Quest/TrainParty/BuildAreaI...",
  "HiddenBlockList": [],
  "ShowBlockList": [
    "Bar_2F_Bathroom"
  ],
  "FirstStep": 101010,
  "IsShowInActivity": true
}
```

### TarotBookReadReward.json (0.00 MB, 65 条)

**字段** (3): `ID, Number, Quest`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Number": 1,
  "Quest": 1004001
}
```

### TeamTowersStageGroup.json (0.00 MB, 7 条)

**字段** (9): `DIFINBBBPHM, EBLHFPKFNOB, GMCBNNKJAGJ, HKPPAJKICII, HPJHKACDIMB, IOLJNBOEIPI, OENAMINOLLF, OHANIOHKHMG, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "DIFINBBBPHM": 101,
  "HPJHKACDIMB": 102,
  "OENAMINOLLF": {
    "Hash": 9402596100331847302
  },
  "OHANIOHKHMG": "UI/UI3D/TeamTower/_dependencies/Model/Te...",
  "EBLHFPKFNOB": "UI/UI3D/TeamTower/_dependencies/Model/Te...",
  "IOLJNBOEIPI": "SpriteOutput/Quest/TeamTower/AvatarRound...",
  "HKPPAJKICII": {
    "Hash": 13696608959662307489
  },
  "GMCBNNKJAGJ": 804411005
}
```

### TrainPartyRewardConfig.json (0.00 MB, 30 条)

**字段** (4): `Level, Name, RequireStar, RewardID`

**首条记录摘要**:
```json
{
  "Level": 1,
  "RequireStar": 1,
  "RewardID": 241001,
  "Name": {
    "Hash": 11516494628851743198
  }
}
```

### TrackPhotoStage.json (0.00 MB, 6 条)

**字段** (17): `ActivityModuleID, DisLimit, Fov, ImagePath, JunkNumList, MainMissionID, MaxScore, RaidID, StageDesc, StageID, StageLocation, StageName, StarList, TotalTrashCanNum, TrackMoveSpeed, UnlockSubMissionID, XYRange`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "ActivityModuleID": 5001701,
  "RaidID": 40237005,
  "StarList": [
    1100,
    2200,
    2900
  ],
  "MaxScore": 3700,
  "TotalTrashCanNum": 25,
  "StageName": {
    "Hash": 12065678480382356896
  },
  "StageLocation": {
    "Hash": 15469811659248183648
  },
  "StageDesc": {
    "Hash": 10289333903137978925
  },
  "MainMissionID": 8024301,
  "JunkNumList": [
    3,
    12,
    10
  ],
  "ImagePath": "",
  "TrackMoveSpeed": 1.3,
  "Fov": 40,
  "XYRange": [
    35,
    20
  ],
  "DisLimit": 35
}
```

### StageInvasionRogueMonster.json (0.00 MB, 18 条)

**字段** (4): `InvasionID, MonsterInvasionList, RogueMonsterID, StageID`

**首条记录摘要**:
```json
{
  "RogueMonsterID": 3000991,
  "StageID": 83000991,
  "InvasionID": 3,
  "MonsterInvasionList": "<list[1]>"
}
```

### StageInvasionMaterialWhite.json (0.00 MB, 108 条)

**字段** (1): `MonsterID`

**首条记录摘要**:
```json
{
  "MonsterID": 1002020
}
```

### TeamTowersPlayerSkill.json (0.00 MB, 7 条)

**字段** (11): `AAGKEBFHLMC, CNGOPBADLLP, EJKGHBAGFIB, GMPGDEINODK, MEIFEJGOLJC, NMAHGFAPENI, ODEKADIBFAO, OENAMINOLLF, OLOIFNNLKJP, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 101,
  "AAGKEBFHLMC": 1,
  "OLOIFNNLKJP": "SpriteOutput/Quest/TeamTower/SkillIcon/T...",
  "OENAMINOLLF": {
    "Hash": 14171503961074382988
  },
  "EJKGHBAGFIB": 8,
  "CNGOPBADLLP": 2,
  "NMAHGFAPENI": {
    "Hash": 10921832019093221103
  },
  "GMPGDEINODK": "ActiveSkill",
  "PBLPLDJKPEI": [
    {
      "Value": 1
    }
  ],
  "ODEKADIBFAO": 5011405,
  "MEIFEJGOLJC": "Config/Gameplays/LittleGame/TeamTowers/S..."
}
```

### StarFightGoal.json (0.00 MB, 60 条)

**字段** (2): `BattleTargetID, ID`

**首条记录摘要**:
```json
{
  "ID": 6026100,
  "BattleTargetID": 5001104
}
```

### TeamBuildGroupConfig.json (0.00 MB, 30 条)

**字段** (2): `AvatarIDList, GroupID`

**首条记录摘要**:
```json
{
  "GroupID": 101,
  "AvatarIDList": "<list[14]>"
}
```

### SpaceZooMutationMaterial.json (0.00 MB, 15 条)

**字段** (6): `ChangeChannelList, ChangeFeatureList, ExchangeCost, FeatureConditionList, ItemID, UnlockMissionID`

**首条记录摘要**:
```json
{
  "ItemID": 181007,
  "ChangeChannelList": [
    4
  ],
  "ChangeFeatureList": [
    401
  ],
  "UnlockMissionID": 8016202,
  "ExchangeCost": 390,
  "FeatureConditionList": [
    303,
    305
  ]
}
```

### TrackPhotoNpcConfig.json (0.00 MB, 34 条)

**字段** (4): `CanTypeID, GroupID, NpcID, StageID`

**首条记录摘要**:
```json
{
  "NpcID": 400002,
  "GroupID": 19,
  "StageID": 2,
  "CanTypeID": "SilverCan"
}
```

### ScoringGroup.json (0.00 MB, 20 条)

**字段** (4): `DisplayType, ScoreName, ScoringGroupID, ScoringIDList`

**首条记录摘要**:
```json
{
  "ScoringGroupID": 101,
  "DisplayType": "Normal",
  "ScoringIDList": [
    90001
  ]
}
```

### TravelBrochureDiaryGroup.json (0.00 MB, 18 条)

**字段** (4): `ChoiceIDList, DiaryDescription, ID, TextIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "ChoiceIDList": [],
  "TextIDList": "<list[6]>",
  "DiaryDescription": {
    "Hash": 2014329979317590681
  }
}
```

### TeamTowersBubbleGroup.json (0.00 MB, 37 条)

**字段** (2): `DEMJCAMBEDN, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 101,
  "DEMJCAMBEDN": [
    1101,
    1102,
    1103,
    1104,
    1105
  ]
}
```

### TrainPartyPassengerDiary.json (0.00 MB, 34 条)

**字段** (2): `DiaryID, DiaryText`

**首条记录摘要**:
```json
{
  "DiaryID": 101,
  "DiaryText": {
    "Hash": 1331093776257852373
  }
}
```

### SilverWolfQuestConfig.json (0.00 MB, 27 条)

**字段** (4): `FigurePath, IconPath, QuestID, RaidID`

**首条记录摘要**:
```json
{
  "QuestID": 6000019,
  "IconPath": "SpriteOutput/UI/Quest/Graffit/GraffitiPh...",
  "FigurePath": "SpriteOutput/UI/Quest/Graffit/GraffitiPh..."
}
```

### TreasureDungeonGridBuff.json (0.00 MB, 15 条)

**字段** (7): `Desc, DisplayMazeBuffID, GridBuffID, GridBuffMaxLevel, ParamInt, Type, TypeParam`

**首条记录摘要**:
```json
{
  "GridBuffID": 1,
  "Type": "CostExploreAfterAction",
  "TypeParam": [
    3,
    5
  ],
  "GridBuffMaxLevel": 1,
  "Desc": {
    "Hash": 7140133497724038893
  }
}
```

### ScheduleDataBattlePass.json (0.00 MB, 28 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "BeginTime": "2023-04-17 04:00:00",
  "EndTime": "2023-06-05 03:59:59"
}
```

### TeamTowersBrick.json (0.00 MB, 25 条)

**字段** (2): `JGFADOCKGOO, MCCIHOMFKFK`

**首条记录摘要**:
```json
{
  "JGFADOCKGOO": 1,
  "MCCIHOMFKFK": "SpriteOutput/Quest/TeamTower/BrickType/T..."
}
```

### SwordTrainingPartner.json (0.00 MB, 7 条)

**字段** (5): `AvatarID, PartnerAbilityIDList, PartnerID, PartnerImage, PartnerName`

**首条记录摘要**:
```json
{
  "PartnerID": 1,
  "PartnerName": {
    "Hash": 9717664300024737687
  },
  "PartnerAbilityIDList": "<list[16]>",
  "PartnerImage": "SpriteOutput/AvatarShopIcon/Avatar/1217....",
  "AvatarID": 1217
}
```

### TravelBrochureConstValue.json (0.00 MB, 14 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TravelBrochure_Show_World",
  "Value": {
    "IntValue": 401
  }
}
```

### ScheduleDataChallengeStory.json (0.00 MB, 27 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 202001,
  "BeginTime": "2024-01-08 04:00:00",
  "EndTime": "2024-02-19 04:00:00"
}
```

### TrainPartyCardSpecialShow.json (0.00 MB, 12 条)

**字段** (5): `CardID, OverWriteTips, PreShowGridNum, SpecialShowDesc, SpecialShowTitle`

**首条记录摘要**:
```json
{
  "CardID": 101,
  "SpecialShowTitle": {
    "Hash": 11417180965420093755
  },
  "SpecialShowDesc": {
    "Hash": 4839507035165266030
  }
}
```

### TreasureDungeonGroupConfig.json (0.00 MB, 5 条)

**字段** (14): `ATKExchangeIconPath, ATKExchangeName, ATKExchangeRatio, ATKMazeBuffID, ActivityModuleID, DEFMazeBuffID, DungeonIDList, GroupID, HpConversionRate, HpConversionRate2, ImgPath, MaxATK, MaxDEF, Name`

**首条记录摘要**:
```json
{
  "GroupID": 10,
  "ActivityModuleID": 5000401,
  "ATKMazeBuffID": 31001009,
  "MaxATK": 400,
  "DEFMazeBuffID": 3200005,
  "MaxDEF": 40,
  "HpConversionRate": 200,
  "HpConversionRate2": 1000,
  "ATKExchangeRatio": 80,
  "ATKExchangeIconPath": "SpriteOutput/BuffIcon/Inlevel/IconDeBuff...",
  "ATKExchangeName": {
    "Hash": 10004651696134355605
  },
  "DungeonIDList": [
    10,
    11
  ],
  "Name": {
    "Hash": 8864531898012155588
  },
  "ImgPath": ""
}
```

### SpecialMode.json (0.00 MB, 15 条)

**字段** (7): `Desc01, Desc02, Desc03, IsUImode, PuzzleType, SpecialModeID, Title`

**首条记录摘要**:
```json
{
  "SpecialModeID": 1017,
  "Title": "SpecialMode_Title_1017",
  "Desc01": "SpecialMode_Desc01_1017",
  "Desc02": "",
  "Desc03": ""
}
```

### SwordTrainingStoryLine.json (0.00 MB, 4 条)

**字段** (12): `AvatarIDList, EndingOptionKey, EndingStoryIDList, RewardID, StartTalkImage, StoryHardDesc, StoryLine, StoryLineDesc, StoryLineImage, StoryLineName, TurnIDList, UnlockID`

**首条记录摘要**:
```json
{
  "StoryLine": 1,
  "EndingStoryIDList": [
    1,
    11
  ],
  "EndingOptionKey": "TalkSentence_802411410",
  "StoryLineName": {
    "Hash": 16197369886857036067
  },
  "StartTalkImage": "",
  "StoryLineImage": "",
  "StoryLineDesc": {
    "Hash": 4272292206981348682
  },
  "AvatarIDList": [],
  "StoryHardDesc": {
    "Hash": 5784996678433989964
  },
  "RewardID": 240011,
  "TurnIDList": "<list[15]>"
}
```

### SpecialAvatarLD.json (0.00 MB, 6 条)

**字段** (16): `AIPath, AbilityNameList, AnchorName, AvatarID, CustomSkillTreeKey, HaveActionDelay, JsonPath, Level, LevelAreaPrefab, OverrideProperty, PlayerID, PlayerJsonPath, Promotion, SkillTreeTemplate, SpecialAvatarID, Type`

**首条记录摘要**:
```json
{
  "SpecialAvatarID": 6036001,
  "PlayerID": 1014,
  "AvatarID": 6036,
  "Type": "TYPE_TRIAL",
  "LevelAreaPrefab": "",
  "AnchorName": "",
  "Level": 80,
  "Promotion": 6,
  "OverrideProperty": [],
  "HaveActionDelay": true,
  "SkillTreeTemplate": "TYPE_CUSTOM",
  "CustomSkillTreeKey": "None",
  "AbilityNameList": [],
  "PlayerJsonPath": "",
  "JsonPath": "",
  "AIPath": ""
}
```

### TarotWikiUnlockConditions.json (0.00 MB, 15 条)

**字段** (3): `Conditions, ShowCondition, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 101,
  "Conditions": "<list[1]>",
  "ShowCondition": []
}
```

### SwordTrainingExamComment.json (0.00 MB, 18 条)

**字段** (3): `CommentID, Desc, ImgPath`

**首条记录摘要**:
```json
{
  "CommentID": 101,
  "ImgPath": "SpriteOutput/Emoji/103002.png",
  "Desc": {
    "Hash": 9119038707340371448
  }
}
```

### ScheduleDataChallengeBoss.json (0.00 MB, 22 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 203001,
  "BeginTime": "2024-06-17 04:00:00",
  "EndTime": "2024-08-05 04:00:00"
}
```

### StrongChallengeBossDetail.json (0.00 MB, 25 条)

**字段** (2): `BossDetailID, Detail`

**首条记录摘要**:
```json
{
  "BossDetailID": 101,
  "Detail": {
    "Hash": 1858835865843126933
  }
}
```

### SubNavMap.json (0.00 MB, 19 条)

**字段** (4): `FloorID, ID, NavMapSubTabID, Type`

**首条记录摘要**:
```json
{
  "ID": 101010901,
  "Type": "AnotherFloor",
  "FloorID": 10101009,
  "NavMapSubTabID": 10101001
}
```

### SwordTrainingStatus.json (0.00 MB, 7 条)

**字段** (6): `InitialValue, MaximumValue, StatusID, StatusIcon, StatusName, StatusOutLineIcon`

**首条记录摘要**:
```json
{
  "StatusID": 1,
  "InitialValue": 59,
  "MaximumValue": 9999,
  "StatusName": {
    "Hash": 4774745260354890372
  },
  "StatusIcon": "SpriteOutput/Quest/SwordTraining/SwordTr...",
  "StatusOutLineIcon": "SpriteOutput/Quest/SwordTraining/SwordTr..."
}
```

### TelevisionConstValueCommon.json (0.00 MB, 9 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Television_Special_Score_Line",
  "Value": {
    "IntValue": 1000
  }
}
```

### TrainPartyProgress.json (0.00 MB, 6 条)

**字段** (9): `CoinRatio, InitialStatExp, PassengerUnlockActPath, ProgressID, ProgressTitle, StatRatio, TeamIDList, UnlcokRequireArea, UnlockPassengerList`

**首条记录摘要**:
```json
{
  "ProgressID": 1,
  "TeamIDList": [
    1
  ],
  "ProgressTitle": {
    "Hash": 6273583131620554953
  },
  "InitialStatExp": 10,
  "StatRatio": 100,
  "CoinRatio": 100,
  "UnlockPassengerList": [],
  "PassengerUnlockActPath": ""
}
```

### SpaceZooSlotTags.json (0.00 MB, 15 条)

**字段** (3): `Channel, FeatureID, ImagePath`

**首条记录摘要**:
```json
{
  "FeatureID": 100,
  "Channel": "BodyDecal",
  "ImagePath": "SpriteOutput/Quest/SpaceZoo/SpaceZooIcon..."
}
```

### SilverWolfSubTab.json (0.00 MB, 9 条)

**字段** (7): `EntranceID, FinalQuest, GroupID, MappingInfoID, QuestList, TabType, UnlockMission`

**首条记录摘要**:
```json
{
  "TabType": "Exploration",
  "GroupID": 1,
  "QuestList": [
    6000022,
    6000023,
    6000024
  ],
  "FinalQuest": 6000029,
  "UnlockMission": 2000701,
  "EntranceID": 2000101,
  "MappingInfoID": 2000101
}
```

### TeamTowersConstClient.json (0.00 MB, 16 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TeamTowers_SilverWolfIcon",
  "Value": "<dict[1]>"
}
```

### TarotBookRevealedCharacter.json (0.00 MB, 12 条)

**字段** (4): `ID, MainCatalogTitle, Name, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 7,
  "UnlockID": 101,
  "Name": {
    "Hash": 16303889943092683754
  },
  "MainCatalogTitle": {
    "Hash": 1479815852269523841
  }
}
```

### SwordTrainingEnding.json (0.00 MB, 5 条)

**字段** (7): `EndingID, QuestID, StoryID, StoryImage, StoryTitle, StoryUnlockImage, UnlockDesc`

**首条记录摘要**:
```json
{
  "EndingID": 1,
  "StoryID": 1,
  "QuestID": 6025122,
  "StoryImage": "SpriteOutput/Quest/SwordTraining/CoverIm...",
  "StoryUnlockImage": "SpriteOutput/Quest/SwordTraining/CoverIm...",
  "StoryTitle": {
    "Hash": 3940525190880709867
  },
  "UnlockDesc": {
    "Hash": 2443362677953230883
  }
}
```

### TeamTowersBossSkillGroup.json (0.00 MB, 16 条)

**字段** (3): `GMPGDEINODK, KPHIIIDGLEB, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "GMPGDEINODK": "Sequence",
  "KPHIIIDGLEB": [
    101
  ]
}
```

### StrongChallengeBuffConfig.json (0.00 MB, 28 条)

**字段** (2): `BuffCost, StrongChallengeBuffID`

**首条记录摘要**:
```json
{
  "StrongChallengeBuffID": 3104101,
  "BuffCost": 1
}
```

### TeamTowersConstCommon.json (0.00 MB, 16 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TeamTowers_AchievementMaxNum",
  "Value": {
    "IntValue": 3
  }
}
```

### TextDanmuContent.json (0.00 MB, 20 条)

**字段** (2): `Content, ID`

**首条记录摘要**:
```json
{
  "ID": 105440000,
  "Content": {
    "Hash": 17236653353538695838
  }
}
```

### TitanAtlasVoicePool.json (0.00 MB, 12 条)

**字段** (4): `AudioEvent, TitanVoiceID, TitanVoicePoolID, Weight`

**首条记录摘要**:
```json
{
  "TitanVoiceID": 1010101,
  "TitanVoicePoolID": 10101,
  "Weight": 100,
  "AudioEvent": "Ev_archive_vo_god05_war"
}
```

### TrainPartyLogConfig.json (0.00 MB, 12 条)

**字段** (3): `LogContent, LogType, Priority`

**首条记录摘要**:
```json
{
  "LogType": "PassengerStatsExpAddZero",
  "LogContent": {
    "Hash": 7963550545490909352
  },
  "Priority": 99
}
```

### TarotWikiTimeline.json (0.00 MB, 9 条)

**字段** (6): `DataList, ID, Progress, SpecialType, Title, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Title": {
    "Hash": 15367368280144666109
  },
  "Progress": -1,
  "DataList": [
    101,
    102,
    103
  ]
}
```

### TrainPartyTeam.json (0.00 MB, 6 条)

**字段** (6): `GridNum, InitialMeetingSkill, LeaderWorkingBuffID, PassengerList, TeamID, TeamName`

**首条记录摘要**:
```json
{
  "TeamID": 1,
  "PassengerList": [
    1004,
    1002,
    1003,
    1005,
    1001
  ],
  "TeamName": {
    "Hash": 10562319347175139947
  },
  "LeaderWorkingBuffID": 101,
  "GridNum": 11
}
```

### StoryAtlasTextmap.json (0.00 MB, 17 条)

**字段** (2): `StoryID, StoryName`

**首条记录摘要**:
```json
{
  "StoryID": 1,
  "StoryName": {
    "Hash": 9721699537898954231
  }
}
```

### TrainPartyConstValueCommon.json (0.00 MB, 8 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "train_party_need_break_move_grid_type_li...",
  "Value": "<dict[1]>"
}
```

### StanceLevelEffect.json (0.00 MB, 14 条)

**字段** (3): `ID, LevelDifference, StanceLevelEffect`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LevelDifference": 80,
  "StanceLevelEffect": {
    "Value": 1
  }
}
```

### SystemDefaultLanguage.json (0.00 MB, 13 条)

**字段** (3): `DefaultAudioLanguage, DefaultTextLanguage, SystemLanguage`

**首条记录摘要**:
```json
{
  "SystemLanguage": "cn",
  "DefaultTextLanguage": "cn",
  "DefaultAudioLanguage": "cn"
}
```

### SilverWolfTabGroup.json (0.00 MB, 3 条)

**字段** (7): `ActivityModuleID, Conditions, ExploreFigurePath, GroupID, IconPath, Name, RaidFigurePath`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "Name": {
    "Hash": 12281721263014132765
  },
  "IconPath": "SpriteOutput/TabIcon/Activity/AccordIcon...",
  "ExploreFigurePath": "SpriteOutput/UI/Quest/Graffit/GraffitAct...",
  "RaidFigurePath": "SpriteOutput/UI/Quest/Graffit/GraffitAct...",
  "Conditions": "<list[1]>",
  "ActivityModuleID": 5000102
}
```

### TeamTowersLevel.json (0.00 MB, 19 条)

**字段** (3): `EKLFKIEBIMM, HLCEBFIMJGN, MFIEHPLADIM`

**首条记录摘要**:
```json
{
  "MFIEHPLADIM": 1,
  "HLCEBFIMJGN": 200,
  "EKLFKIEBIMM": 6087100
}
```

### TalkSentenceImage.json (0.00 MB, 10 条)

**字段** (3): `Comment, ImagePath, Speaker`

**首条记录摘要**:
```json
{
  "Speaker": "TheHerta",
  "ImagePath": "SpriteOutput/AvatarRoundIcon/Avatar/1401...",
  "Comment": "大黑塔"
}
```

### SwordTrainingMood.json (0.00 MB, 4 条)

**字段** (8): `EffectDesc, EffectIDList, EffectNumDesc, MaximumValue, MinimumValue, MoodIcon, MoodLevel, MoodStatus`

**首条记录摘要**:
```json
{
  "MoodLevel": 1,
  "MaximumValue": 19,
  "EffectIDList": [
    40001
  ],
  "MoodIcon": "SpriteOutput/Quest/SwordTraining/SwordTr...",
  "EffectDesc": {
    "Hash": 7297523532769426335
  },
  "MoodStatus": "Low",
  "EffectNumDesc": {
    "Hash": 10429551673612096970
  }
}
```

### ScheduleDataGlobal.json (0.00 MB, 8 条)

**字段** (5): `BeginTime, EndTime, GlobalBeginTime, GlobalEndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 291008,
  "BeginTime": "2023-12-11 04:00:00",
  "GlobalBeginTime": "",
  "EndTime": "2023-12-25 04:00:00",
  "GlobalEndTime": "2023-12-27 06:00:00"
}
```

### TarotBookStarPanel.json (0.00 MB, 13 条)

**字段** (2): `LockedImgPath, Position`

**首条记录摘要**:
```json
{
  "Position": 1,
  "LockedImgPath": "SpriteOutput/TarotBookTitanIcon/01_Ianos..."
}
```

### TarotFiles.json (0.00 MB, 12 条)

**字段** (3): `ID, Sentence, VoiceID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Sentence": {
    "Hash": 5878644914462574713
  },
  "VoiceID": 80140101
}
```

### TrackPhotoConstValueClient.json (0.00 MB, 7 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TrackPhoto_ResultTime",
  "Value": {
    "DoubleValue": 1.2
  }
}
```

### SpaceZooCattery.json (0.00 MB, 9 条)

**字段** (5): `CatteryID, FloorID, NpcGroupID, NpcInstanceID, UnlockMissionID`

**首条记录摘要**:
```json
{
  "CatteryID": 1,
  "FloorID": 20004001,
  "NpcGroupID": 101,
  "NpcInstanceID": 400001,
  "UnlockMissionID": 801620207
}
```

### TarotBookEnergy.json (0.00 MB, 12 条)

**字段** (4): `IsRepetitive, IsSilence, SubmissionID, Toast`

**首条记录摘要**:
```json
{
  "SubmissionID": 104011001,
  "IsSilence": true,
  "Toast": {
    "Hash": 8023939880902216691
  }
}
```

### ScheduleDataMission.json (0.00 MB, 11 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 42020305,
  "BeginTime": "2023-06-28 12:00:00",
  "EndTime": "2099-12-30 04:00:00"
}
```

### TrainPartyGridType.json (0.00 MB, 7 条)

**字段** (3): `GridType, GridTypeName, GridTypeTipInfo`

**首条记录摘要**:
```json
{
  "GridType": "Normal",
  "GridTypeName": {
    "Hash": 2768853259934548168
  },
  "GridTypeTipInfo": {
    "Hash": 7481072314301812821
  }
}
```

### TrainPartyStatusRank.json (0.00 MB, 16 条)

**字段** (3): `Rank, RankRequireExp, RequireValue`

**首条记录摘要**:
```json
{
  "Rank": 1,
  "RankRequireExp": 10
}
```

### SpaceZooQuest.json (0.00 MB, 6 条)

**字段** (4): `ID, QuestList, QuestTabName, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "QuestTabName": {
    "Hash": 6264527244810425959
  },
  "Type": "TimeLimitedReward",
  "QuestList": [
    6016111,
    6016112,
    6016113
  ]
}
```

### ShopItemGroupConfig.json (0.00 MB, 12 条)

**字段** (4): `GroupID, GroupType, ItemID, RotateOrder`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "ItemID": 1009,
  "GroupType": "Rotate",
  "RotateOrder": 1
}
```

### TrainPartyMTCategoryConfig.json (0.00 MB, 5 条)

**字段** (4): `CategoryDesc, CategoryID, CategoryName, CategoryTableName`

**首条记录摘要**:
```json
{
  "CategoryID": 1,
  "CategoryTableName": {
    "Hash": 15016079924285982716
  },
  "CategoryName": {
    "Hash": 16374119654350914808
  },
  "CategoryDesc": {
    "Hash": 16990097342985775597
  }
}
```

### ShareConfig.json (0.00 MB, 8 条)

**字段** (3): `IsOverSea, PlatformType, ShareChannelList`

**首条记录摘要**:
```json
{
  "PlatformType": 3,
  "ShareChannelList": []
}
```

### TrainPartyWorkingBuffConfig.json (0.00 MB, 5 条)

**字段** (4): `Description, IconPath, Name, WorkingBuffID`

**首条记录摘要**:
```json
{
  "WorkingBuffID": 101,
  "Name": {
    "Hash": 10883739833060359634
  },
  "Description": {
    "Hash": 15214539465304414100
  },
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001..."
}
```

### TrainExteriorConfig.json (0.00 MB, 10 条)

**字段** (4): `Conditions, DynamicOptionalBlock, ID, Priority`

**首条记录摘要**:
```json
{
  "ID": 100,
  "Priority": 1,
  "Conditions": [],
  "DynamicOptionalBlock": "100"
}
```

### TreasureDungeoActivityQuest.json (0.00 MB, 6 条)

**字段** (4): `DungeonGroupID, ID, Name, QuestList`

**首条记录摘要**:
```json
{
  "QuestList": [
    6000321
  ]
}
```

### TarotBookCardPack.json (0.00 MB, 13 条)

**字段** (2): `Hint, ID`

**首条记录摘要**:
```json
{
  "ID": 3011,
  "Hint": {
    "Hash": 6835111933626958571
  }
}
```

### SpecialNPCMazeSkill.json (0.00 MB, 7 条)

**字段** (6): `MPCost, MazeSkillId, MazeSkillName, MazeSkilltype, RelatedAvatarSkill, SkillTriggerKey`

**首条记录摘要**:
```json
{
  "MazeSkillId": 1211201,
  "MazeSkilltype": 1,
  "RelatedAvatarSkill": 1211206,
  "SkillTriggerKey": "NormalAtk"
}
```

### SpaceZooChannelConfig.json (0.00 MB, 6 条)

**字段** (5): `Channel, DefaultFeatureID, HandbookTag, InheritType, OfficialNameText`

**首条记录摘要**:
```json
{
  "Channel": "BodyDecal",
  "InheritType": "Normal",
  "DefaultFeatureID": 100,
  "HandbookTag": 3,
  "OfficialNameText": "UIText_ActivitySpaceZoo_BodyDecal"
}
```

### TutorialGuideGroupType.json (0.00 MB, 6 条)

**字段** (3): `MessageIconPath, MessageTitle, TutorialType`

**首条记录摘要**:
```json
{
  "MessageIconPath": "SpriteOutput/TabIcon/Common/AllIcon.png",
  "MessageTitle": {
    "Hash": 15165646382604923628
  }
}
```

### TeamTowersAchievement.json (0.00 MB, 5 条)

**字段** (5): `GMPGDEINODK, NALMBOOCCIN, NMAHGFAPENI, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "GMPGDEINODK": "SeriesSuccessPlacedCount",
  "NMAHGFAPENI": {
    "Hash": 2235036998832128462
  },
  "PBLPLDJKPEI": [
    10
  ],
  "NALMBOOCCIN": 1
}
```

### SpaceZooHandbookText.json (0.00 MB, 10 条)

**字段** (2): `SpecialCatID, UITextID`

**首条记录摘要**:
```json
{
  "SpecialCatID": 10001,
  "UITextID": "UIText_ActivitySpaceZoo_LockHint_Mission"
}
```

### TrainPartyGridSpecialShow.json (0.00 MB, 7 条)

**字段** (2): `GridID, GridSpecialShowImagePath`

**首条记录摘要**:
```json
{
  "GridID": 4001,
  "GridSpecialShowImagePath": "SpriteOutput/Quest/TrainParty/Rate/Train..."
}
```

### TeamLimitTypeEvent.json (0.00 MB, 6 条)

**字段** (3): `LimitDesc, LimitType, ToastDesc`

**首条记录摘要**:
```json
{
  "LimitType": "IncludeAvatar",
  "LimitDesc": {
    "Hash": 6576864705196127811
  },
  "ToastDesc": {
    "Hash": 9937539640415399583
  }
}
```

### TalkBehavior.json (0.00 MB, 5 条)

**字段** (7): `BehaviorType, CurrencyItem, CustomString, ID, ParaInt, ParaList, ParaType`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "BehaviorType": 1,
  "ParaType": "GREATEQUAL",
  "ParaInt": 500,
  "ParaList": [],
  "CurrencyItem": 2,
  "CustomString": "GreatEqual500"
}
```

### SilverWolfCollection.json (0.00 MB, 9 条)

**字段** (4): `PositionID, QuestID, Type, TypeParam`

**首条记录摘要**:
```json
{
  "Type": "Decal",
  "TypeParam": 2,
  "PositionID": 1,
  "QuestID": 6000010
}
```

### SwordTrainingSkillType.json (0.00 MB, 4 条)

**字段** (4): `SkillTypeID, SkillTypeIcon, SkillTypeName, StatusID`

**首条记录摘要**:
```json
{
  "SkillTypeID": 1,
  "SkillTypeIcon": "SpriteOutput/SkillIcons/Avatar/1005/Skil...",
  "SkillTypeName": {
    "Hash": 1305664380955597089
  },
  "StatusID": 1
}
```

### TrackPhotoTrashCanConfig.json (0.00 MB, 4 条)

**字段** (6): `CanTypeID, ExtraAnimList, ExtraScore, IconPath, NpcTemplateID, Score`

**首条记录摘要**:
```json
{
  "CanTypeID": "CopperCan",
  "Score": 100,
  "NpcTemplateID": 3147,
  "ExtraAnimList": [],
  "IconPath": "SpriteOutput/MonsterRoundIcon/Monster_30..."
}
```

### TitanAtlasGroup.json (0.00 MB, 4 条)

**字段** (4): `TitanGroupDesc, TitanGroupID, TitanGroupName, TitleBGColor`

**首条记录摘要**:
```json
{
  "TitanGroupID": 1,
  "TitanGroupName": {
    "Hash": 6232939832192909239
  },
  "TitanGroupDesc": {
    "Hash": 6066625616766487669
  },
  "TitleBGColor": "#253a7d"
}
```

### StageMonsterInvasionParam.json (0.00 MB, 3 条)

**字段** (2): `InvasionID, ParamList`

**首条记录摘要**:
```json
{
  "InvasionID": 1,
  "ParamList": "<list[5]>"
}
```

### TarotBookCommonConstValue.json (0.00 MB, 6 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TarotBook_SpecialReward_SubmissionID",
  "Value": {
    "IntValue": 104050304
  }
}
```

### SocialPlayConfig.json (0.00 MB, 2 条)

**字段** (10): `BEGLIKIIKHP, EHFGLKJOING, FFLDMJCEMDC, FIMNPJLNLEE, GENDKCAKJIN, JJKLIJNFIBB, LFKCKNCOMMD, NNLJDEBAKHO, ODIHDPCDALI, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "ODIHDPCDALI": 1,
  "OENAMINOLLF": {
    "Hash": 9640871515077411213
  },
  "NNLJDEBAKHO": "SpriteOutput/Online/OnlineScene/OnlineSc...",
  "JJKLIJNFIBB": 5200,
  "BEGLIKIIKHP": 100000399,
  "LFKCKNCOMMD": 100000353,
  "GENDKCAKJIN": 2544,
  "EHFGLKJOING": 17,
  "FIMNPJLNLEE": 10000003,
  "FFLDMJCEMDC": 11001
}
```

### TeamTowersStageStar.json (0.00 MB, 4 条)

**字段** (5): `GMPGDEINODK, GNLGHALIPLD, NMAHGFAPENI, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "GMPGDEINODK": "DeadCount",
  "NMAHGFAPENI": {
    "Hash": 1042796822619779860
  },
  "PBLPLDJKPEI": [
    5
  ]
}
```

### SwordTrainingStoryLineBonus.json (0.00 MB, 3 条)

**字段** (2): `EffectDescList, StoryLineNum`

**首条记录摘要**:
```json
{
  "StoryLineNum": 1,
  "EffectDescList": "<list[3]>"
}
```

### StaminaSaleConfig.json (0.00 MB, 8 条)

**字段** (3): `Price, Times, ToStamina`

**首条记录摘要**:
```json
{
  "Times": 1,
  "Price": {
    "1": 50
  },
  "ToStamina": 60
}
```

### TrainPartyAreaGoalConfig.json (0.00 MB, 6 条)

**字段** (3): `AreaID, ID, StepGroupList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "AreaID": 11,
  "StepGroupList": [
    100,
    101,
    102,
    103
  ]
}
```

### TarotBookCard.json (0.00 MB, 13 条)

**字段** (2): `CharacterID, ID`

**首条记录摘要**:
```json
{
  "ID": 9901,
  "CharacterID": 1
}
```

### StuffStatsConfig.json (0.00 MB, 3 条)

**字段** (3): `MuseumStatsName, StatsID, StatsIconPath`

**首条记录摘要**:
```json
{
  "StatsID": "StatsA",
  "MuseumStatsName": {
    "Hash": 15777258343030123010
  },
  "StatsIconPath": "SpriteOutput/Quest/Museum/MuseumProperty..."
}
```

### StrongChallengeQuestGroup.json (0.00 MB, 6 条)

**字段** (2): `Name, QuestGroupID`

**首条记录摘要**:
```json
{
  "QuestGroupID": 1,
  "Name": {
    "Hash": 12344218773630475725
  }
}
```

### SettingImageQuality.json (0.00 MB, 6 条)

**字段** (2): `ID, ShowString`

**首条记录摘要**:
```json
{
  "ID": "1",
  "ShowString": {
    "Hash": 15190751702059003699
  }
}
```

### TarotBookRevealedIcon.json (0.00 MB, 2 条)

**字段** (4): `ID, NewRectIconPath, NewRoundIconPath, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 3,
  "UnlockID": 36202,
  "NewRoundIconPath": "SpriteOutput/TarotBook/TarotCard/RoundIc...",
  "NewRectIconPath": "SpriteOutput/TarotBook/TarotCard/Catalog..."
}
```

### TutorialSubGuideConfig.json (0.00 MB, 2 条)

**字段** (6): `FIFINLKGEAC, HBEDCNGOIMI, IECMJPALEOA, LBJFALJAINI, OENAMINOLLF, OPFOHDKJNJI`

**首条记录摘要**:
```json
{
  "HBEDCNGOIMI": 1,
  "IECMJPALEOA": 1,
  "OENAMINOLLF": {
    "Hash": 12835042235045520390
  },
  "FIFINLKGEAC": "SpriteOutput/TabIcon/FiveDim/IconSkillCo...",
  "OPFOHDKJNJI": 1000,
  "LBJFALJAINI": 1999
}
```

### SummonConstValue.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Summon_ActivityRewardID",
  "Value": {
    "IntValue": 50020
  }
}
```

### ServantPropertyOverride.json (0.00 MB, 2 条)

**字段** (5): `HidePropertyInBattleList, HidePropertyList, SecretPropertyList, ServantID, SkillPointIconSourceTriggerKey`

**首条记录摘要**:
```json
{
  "ServantID": 11407,
  "HidePropertyList": [
    "MaxSP"
  ],
  "HidePropertyInBattleList": [
    "MaxSP"
  ],
  "SecretPropertyList": [
    "MaxHP"
  ],
  "SkillPointIconSourceTriggerKey": {}
}
```

### TrainPartyTagConfig.json (0.00 MB, 6 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 4536653197021792465
  }
}
```

### TitanAtlasChangeInfo.json (0.00 MB, 6 条)

**字段** (2): `ChangeTitanIDList, TitanID`

**首条记录摘要**:
```json
{
  "TitanID": 10101,
  "ChangeTitanIDList": [
    10102
  ]
}
```

### SpaceZooBagSlots.json (0.00 MB, 4 条)

**字段** (3): `CatteryID, Channel, ImagePath`

**首条记录摘要**:
```json
{
  "ImagePath": ""
}
```

### TeamTowersRobot.json (0.00 MB, 2 条)

**字段** (4): `HCCKLLGBPIA, NMAHGFAPENI, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 369142603910854258
  },
  "HCCKLLGBPIA": "SpriteOutput/Quest/TeamTower/AvatarRound...",
  "NMAHGFAPENI": {
    "Hash": 5907048013380826596
  }
}
```

### SpecialRestartBattle.json (0.00 MB, 7 条)

**字段** (2): `EventID, TowardEventID`

**首条记录摘要**:
```json
{
  "EventID": 20123010,
  "TowardEventID": 20123009
}
```

### StageInvasionNPCMonster.json (0.00 MB, 3 条)

**字段** (6): `FloorID, GroupID, ID, InstanceID, InvasionID, PlaneID`

**首条记录摘要**:
```json
{
  "ID": 2054131,
  "InvasionID": 2,
  "PlaneID": 20541,
  "FloorID": 20541001,
  "GroupID": 261,
  "InstanceID": 200001
}
```

### TeamTowersDepartment.json (0.00 MB, 3 条)

**字段** (3): `NOIDBOIGBFM, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 12060765449882674849
  },
  "NOIDBOIGBFM": [
    1,
    2
  ]
}
```

### ShopGroup.json (0.00 MB, 3 条)

**字段** (3): `ID, IconPath, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 11671296898182301121
  },
  "IconPath": "SpriteOutput/TabIcon/Shop/ShopDrawcardIc..."
}
```

### TestHotUpdateExcel.json (0.00 MB, 6 条)

**字段** (2): `AvatarID, AvatarName`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "AvatarName": "Avatar_CherryBlossom_YS"
}
```

### TeamVoiceAtlasBinding.json (0.00 MB, 5 条)

**字段** (3): `AtlasVoiceID, AvatarID, LinkAvatar`

**首条记录摘要**:
```json
{
  "AvatarID": 1315,
  "LinkAvatar": 1504,
  "AtlasVoiceID": 35
}
```

### TarotMailboxGroup.json (0.00 MB, 4 条)

**字段** (3): `ID, MailboxIDList, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "MailboxIDList": [
    1,
    2,
    3,
    4
  ],
  "UnlockID": 9960
}
```

### StageInvasionRogueConfig.json (0.00 MB, 7 条)

**字段** (2): `ChallengeID, InvasionID`

**首条记录摘要**:
```json
{
  "ChallengeID": 108,
  "InvasionID": 3
}
```

### StageInvasionMaterial.json (0.00 MB, 3 条)

**字段** (3): `FarmTypeList, InvasionID, MaterialType`

**首条记录摘要**:
```json
{
  "MaterialType": 1,
  "FarmTypeList": "<list[4]>",
  "InvasionID": 1
}
```

### StageInvasionBuff.json (0.00 MB, 3 条)

**字段** (3): `InvasionDesc, InvasionID, MazeBuffID`

**首条记录摘要**:
```json
{
  "InvasionID": 1,
  "MazeBuffID": 3034001,
  "InvasionDesc": {
    "Hash": 16261953196955435628
  }
}
```

### SwordTrainingUnlock.json (0.00 MB, 3 条)

**字段** (3): `FinishWayID, UnlockDesc, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 101,
  "FinishWayID": 6025131,
  "UnlockDesc": {
    "Hash": 11346546865844650535
  }
}
```

### TrainPartyGridTutorial.json (0.00 MB, 4 条)

**字段** (3): `ALNDEGPBMLI, BHGKDNAPGOC, NMMKHFIFPEJ`

**首条记录摘要**:
```json
{
  "NMMKHFIFPEJ": 6001,
  "BHGKDNAPGOC": "Grid_8011",
  "ALNDEGPBMLI": 5
}
```

### SettingDisplayMode.json (0.00 MB, 4 条)

**字段** (2): `ID, ShowString`

**首条记录摘要**:
```json
{
  "ID": "1",
  "ShowString": {
    "Hash": 13052930390834340270
  }
}
```

### StaminaItemList.json (0.00 MB, 3 条)

**字段** (4): `Desc, IsAlwaysShown, ItemID, SortWeight`

**首条记录摘要**:
```json
{
  "ItemID": 1,
  "IsAlwaysShown": true,
  "SortWeight": 1,
  "Desc": {
    "Hash": 10216928610666878987
  }
}
```

### TutorialGuideSpecialGoto.json (0.00 MB, 2 条)

**字段** (4): `ABCDGEFDNPC, BGDEAHEAOFF, LLDCHLHNADA, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "LLDCHLHNADA": 6378,
  "OENAMINOLLF": {
    "Hash": 14215491003999476437
  },
  "ABCDGEFDNPC": 6331,
  "BGDEAHEAOFF": "SubGuide_1_1"
}
```

### TrainPartyMTCategoryScore.json (0.00 MB, 5 条)

**字段** (3): `CategoryID, Level, Ratio`

**首条记录摘要**:
```json
{
  "CategoryID": 1,
  "Level": 1,
  "Ratio": 2
}
```

### SysMailGotoConfig.json (0.00 MB, 2 条)

**字段** (3): `GotoBtnName, GotoID, TemplateID`

**首条记录摘要**:
```json
{
  "TemplateID": 131,
  "GotoID": 626,
  "GotoBtnName": {
    "Hash": 3530988016862590860
  }
}
```

### TrainPassengerConfig.json (0.00 MB, 2 条)

**字段** (2): `BehaviorList, PassengerID`

**首条记录摘要**:
```json
{
  "PassengerID": 1003001,
  "BehaviorList": [
    1003001,
    1003002,
    1003003
  ]
}
```

### StateBroadcastPermission.json (0.00 MB, 1 条)

**字段** (2): `InfoList, PackageName`

**首条记录摘要**:
```json
{
  "PackageName": "com.vivo.gamewatch",
  "InfoList": [
    4101,
    4102,
    5001,
    5003
  ]
}
```

### SubNavMapName.json (0.00 MB, 1 条)

**字段** (3): `FloorID, Name, SubMapID`

**首条记录摘要**:
```json
{
  "FloorID": 10306001,
  "SubMapID": 103060101,
  "Name": {
    "Hash": 7691975925428414241
  }
}
```

### ShopGoodsPackConfig.json (0.00 MB, 1 条)

**字段** (4): `BundleGoodsID, ComboGoodsID1, ComboGoodsID2, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "BundleGoodsID": 107007,
  "ComboGoodsID1": 107008,
  "ComboGoodsID2": 107009
}
```

### ScheduleDataDropLimit.json (0.00 MB, 1 条)

**字段** (3): `BeginTime, EndTime, ID`

**首条记录摘要**:
```json
{
  "ID": 800001,
  "BeginTime": "2022-03-23 00:00:00",
  "EndTime": "2022-03-23 23:59:59"
}
```

### TalkVerificationDistance.json (0.00 MB, 2 条)

**字段** (2): `Distance, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Distance": 5
}
```

### SpecialNPCMapOffset.json (0.00 MB, 1 条)

**字段** (2): `ID, MapOffset`

**首条记录摘要**:
```json
{
  "ID": 30001,
  "MapOffset": [
    0,
    2.5,
    0
  ]
}
```

### ShopGiftConfig.json (0.00 MB, 1 条)

**字段** (3): `GiftID, GiftSortID, ShopID`

**首条记录摘要**:
```json
{
  "GiftID": 10050,
  "ShopID": 109,
  "GiftSortID": 1
}
```

### ShareRewardData.json (0.00 MB, 1 条)

**字段** (3): `ID, RewardID, RewardNum`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RewardID": 3002001,
  "RewardNum": 1
}
```

### StoryCharacterLD.json (0.00 MB, 0 条)

### StoryPropLD.json (0.00 MB, 0 条)

### TagInfo.json (0.00 MB, 0 条)

### TextJoinConditionalItem.json (0.00 MB, 0 条)
