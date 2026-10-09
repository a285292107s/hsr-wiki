# DATA_CATALOG 分片：文件名首字母 NOPQ

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 n-q（共 211 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### PlaneEvent.json (11.16 MB, 79,030 条)

**字段** (7): `DisplayItemList, DropList, EventID, IsUseMonsterDrop, Reward, StageID, WorldLevel`

**首条记录摘要**:
```json
{
  "EventID": 99999001,
  "DropList": [],
  "DisplayItemList": []
}
```

### PerformanceE.json (2.59 MB, 12,585 条)

**字段** (11): `ChangePlayerType, EndBlack, EndWithCrack, FloorID, IsIntroDialogue, IsSkip, PerformanceCharacter, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 100000199,
  "PerformancePath": "Config/Level/Mission/1000001/Talk/Act100...",
  "PerformanceCharacter": ""
}
```

### PerformanceSkipFlagE.json (1.44 MB, 12,404 条)

**字段** (4): `ActorList, ContainImportBranch, PerformanceID, Skippable`

**首条记录摘要**:
```json
{
  "PerformanceID": 100000199,
  "ActorList": []
}
```

### PerformanceDS.json (1.24 MB, 5,042 条)

**字段** (10): `EndBlack, EndWithCrack, FloorID, GroupID, IsSkip, PerformanceCharacter, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 103010102,
  "PerformancePath": "Story/Discussion/Mission/1030101/DS10301...",
  "IsSkip": "AfterSeen",
  "PerformanceCharacter": "",
  "StartBlack": "Full",
  "EndBlack": "Full",
  "PlaneID": 10000,
  "FloorID": 10000000
}
```

### QuestData.json (1.22 MB, 5,783 条)

**字段** (10): `FinishWayID, GotoID, ImagePath, QuestDisplay, QuestID, QuestTitle, QuestType, RewardID, UnlockParamList, UnlockType`

**首条记录摘要**:
```json
{
  "QuestID": 1001711,
  "QuestType": 1,
  "QuestTitle": {
    "Hash": 3832054575976972327
  },
  "ImagePath": "",
  "UnlockType": "AutoUnlock",
  "UnlockParamList": [],
  "RewardID": 21001711,
  "FinishWayID": 1001711,
  "GotoID": 404
}
```

### PerformanceSkipFlagD.json (1.13 MB, 6,872 条)

**字段** (4): `ActorList, ContainImportBranch, PerformanceID, Skippable`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010104,
  "Skippable": true,
  "ActorList": "<list[2]>"
}
```

### PerformanceShiftBlockCfg.json (1.12 MB, 17,345 条)

**字段** (2): `PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "C",
  "PerformanceID": 100010101
}
```

### PerformanceSkipOverride.json (0.64 MB, 4,102 条)

**字段** (9): `Desc, IsConfirmRequiredToSkipFlag, IsOverrideCharacter, IsOverrideImportantFlag, OverrideCharacterList, OverrideImportantFlag, PackID, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 100010104,
  "Desc": {
    "Hash": 1711697987223622458
  },
  "OverrideCharacterList": []
}
```

### NPCData.json (0.58 MB, 2,044 条)

**字段** (7): `ConfigEntityPath, DefaultNPCName, DefaultNPCTitle, ID, JsonPath, SeriesID, SubType`

**首条记录摘要**:
```json
{
  "ID": 100,
  "ConfigEntityPath": "Config/ConfigEntity/NPC/Special/NPC_Spec...",
  "JsonPath": "Config/ConfigCharacter/NPC/Special/NPC_S...",
  "SubType": "Special"
}
```

### PerformanceD.json (0.43 MB, 1,860 条)

**字段** (11): `ChangePlayerType, EndBlack, EndWithCrack, FloorID, GroupID, IsSkip, PerformanceCharacter, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010104,
  "PerformancePath": "Config/Level/Mission/1000101/Act/Act1000...",
  "IsSkip": "AfterSeen",
  "ChangePlayerType": "Character",
  "PerformanceCharacter": "NPC_Avatar_Lady_Kafka_00",
  "StartBlack": "NoPre",
  "EndBlack": "NoPost",
  "PlaneID": 20001,
  "FloorID": 20001001
}
```

### PlanetFesAvatarLevel.json (0.18 MB, 1,000 条)

**字段** (4): `CostNum, GrantItemList, IncomeNum, Level`

**首条记录摘要**:
```json
{
  "Level": 1,
  "IncomeNum": {
    "base_value": 1
  },
  "CostNum": {
    "base_value": 1
  },
  "GrantItemList": {}
}
```

### PerformanceC.json (0.16 MB, 750 条)

**字段** (8): `EndBlack, EndWithCrack, FloorID, IsSkip, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010101,
  "PerformancePath": "Story/Mission/1000101/Story100010101.jso...",
  "IsSkip": "AfterSeen",
  "StartBlack": "NoPre",
  "EndBlack": "Full",
  "PlaneID": 20001,
  "FloorID": 20001001
}
```

### PhotoGraphEmotionConfig.json (0.16 MB, 486 条)

**字段** (7): `BrowClipName, EmotionClipPath, EmotionID, EmotionIconPath, EmotionName, EyeClipName, MouthClipName`

**首条记录摘要**:
```json
{
  "EmotionName": {
    "Hash": 11485770122095695563
  },
  "EmotionIconPath": "SpriteOutput/CameraIcon/CameraPic/Camera...",
  "EmotionClipPath": "",
  "BrowClipName": "",
  "EyeClipName": "",
  "MouthClipName": ""
}
```

### PerformanceRecallData.json (0.15 MB, 295 条)

**字段** (13): `CategoryID, ID, ImgHeightSize, ImgPath, ImgPathWall, ImgPathWall_F, ImgPath_F, Name, PerformanceID, ShowInPlayerRoom, UnlockCondition, WorldID, isVideo`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Name": {
    "Hash": 4794729775508324404
  },
  "CategoryID": 1000,
  "ImgPath": "SpriteOutput/StoryReview/100010100.png",
  "ImgPath_F": "SpriteOutput/StoryReview/100010100.png",
  "ImgHeightSize": 287,
  "UnlockCondition": "<list[1]>",
  "PerformanceID": 100010100,
  "isVideo": true,
  "ImgPathWall": "",
  "ImgPathWall_F": "",
  "WorldID": 101
}
```

### NPCMonsterData.json (0.14 MB, 298 条)

**字段** (10): `ConfigEntityPath, DefaultAIPath, ID, IsMazeLink, JsonPath, MappingInfoID, MiniMapIconType, NPCName, PrototypeID, Rank`

**首条记录摘要**:
```json
{
  "ID": 1002020,
  "NPCName": {
    "Hash": 4666833257090447360
  },
  "ConfigEntityPath": "Config/ConfigEntity/NPCMonster/NPCMonste...",
  "JsonPath": "Config/ConfigCharacter/NPCMonster/NPCMon...",
  "DefaultAIPath": "Config/ConfigAI/Adventure/NPCMonster/ST_...",
  "MiniMapIconType": 5,
  "Rank": "MinionLv2",
  "IsMazeLink": true,
  "PrototypeID": 1002020,
  "MappingInfoID": 3008
}
```

### PerformanceSkipFlagC.json (0.14 MB, 750 条)

**字段** (4): `ActorList, ContainImportBranch, PerformanceID, Skippable`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010101,
  "Skippable": true,
  "ActorList": "<list[2]>"
}
```

### PossessionConfig.json (0.09 MB, 240 条)

**字段** (7): `AttachPoint, IsEffect, LocalPosition, LocalRotation, LocalScale, PossessionName, PossessionPrefabPath`

**首条记录摘要**:
```json
{
  "PossessionName": "Decoration_GhostLight_A",
  "PossessionPrefabPath": "Characters/CharacterPrefabs/NPC/Possessi...",
  "AttachPoint": "Prop",
  "LocalPosition": [
    0.425,
    0.291,
    0
  ],
  "LocalRotation": [
    0,
    0,
    0
  ],
  "LocalScale": [
    1,
    1,
    1
  ]
}
```

### ProgramGroupConfig.json (0.09 MB, 340 条)

**字段** (8): `Asset, Duration, ID, IfAnAsset, Order, PlayType, ProgramGroupID, SoundEvent`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ProgramGroupID": 99,
  "Order": 1,
  "PlayType": 2,
  "Asset": "Chap01_Eff_Dual_A_01.usm",
  "IfAnAsset": "SpriteOutput/PicTalkCG/Common/PicChap01_...",
  "Duration": 2,
  "SoundEvent": ""
}
```

### PerformanceVideo.json (0.08 MB, 332 条)

**字段** (8): `EndBlack, EndWithCrack, FloorID, IsSkip, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010100,
  "PerformancePath": "Config/Level/Mission/1000101/Act/Act1000...",
  "IsSkip": "AfterSeen",
  "StartBlack": "NoPre",
  "EndBlack": "NoPrePost",
  "PlaneID": 20001,
  "FloorID": 20001001
}
```

### PixAirSkillConfig.json (0.07 MB, 339 条)

**字段** (4): `Desc, ID, JsonConfig, SkillParams`

**首条记录摘要**:
```json
{
  "ID": 30101,
  "Desc": {
    "Hash": 9006074007758013948
  },
  "JsonConfig": "Config/Gameplays/PixAir/Skills/PixAir_30...",
  "SkillParams": []
}
```

### PlanetFesAvatarEventOption.json (0.07 MB, 288 条)

**字段** (6): `ActivityRewardID, EventContent, EventOptionID, NextOptionList, OptionBubbleTalk, RewardPoolID`

**首条记录摘要**:
```json
{
  "EventOptionID": 1011,
  "NextOptionList": [
    10111,
    10112
  ],
  "EventContent": {
    "Hash": 10394835662176167975
  },
  "OptionBubbleTalk": {
    "Hash": 4458770637833778801
  }
}
```

### PasterConfig.json (0.06 MB, 244 条)

**字段** (8): `DefaultUnlock, ID, IncreaseCompletion, PasterTextmap, PasterUnlockDesc, TextPasterPrefab, TravelBrochureID, Type`

**首条记录摘要**:
```json
{
  "ID": 223000,
  "TravelBrochureID": [
    1
  ],
  "IncreaseCompletion": 15,
  "DefaultUnlock": true,
  "Type": "Image",
  "TextPasterPrefab": "",
  "PasterUnlockDesc": {
    "Hash": 8724362708873172445
  }
}
```

### NPCMonsterMark.json (0.06 MB, 797 条)

**字段** (3): `GroupID, ID, InstanceID`

**首条记录摘要**:
```json
{
  "ID": 2000101,
  "GroupID": 3,
  "InstanceID": 200005
}
```

### PerformanceReplayLOverride.json (0.05 MB, 183 条)

**字段** (19): `IsOverrideBranchFlag, IsOverrideDeactiveGroupFlag, IsOverrideEndBlackTypeFlag, IsOverrideMissionAudioStateFlag, IsOverrideMissionLGDisableFlag, IsOverridePerformancePriorityFlag, IsOverridePropStateFlag, OverrideActiveGroup, OverrideDeactiveGroup, OverrideEndBlackType, OverrideIntent, OverrideIsBranch, OverrideMissionAudioState, OverrideMissionLGDisable, OverridePerformancePriority, OverridePropState, PatchLevelGraph, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "PlayVideo",
  "PerformanceID": 103080104,
  "IsOverrideBranchFlag": 1,
  "OverrideIntent": 1,
  "OverrideActiveGroup": [],
  "OverrideDeactiveGroup": [],
  "OverridePropState": [],
  "OverrideMissionAudioState": "",
  "PatchLevelGraph": ""
}
```

### PlanetFesFinishway.json (0.05 MB, 221 条)

**字段** (11): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

**首条记录摘要**:
```json
{
  "ID": 6050101,
  "FinishType": "PlanetFesLevel",
  "ParamType": "NoPara",
  "ParamInt1": 1,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1,
  "IsBackTrack": true
}
```

### OfferingLevelConfig.json (0.05 MB, 584 条)

**字段** (6): `ItemCost, Level, RewardID, Type, TypeID, UnlockID`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Level": 1,
  "RewardID": 119001,
  "ItemCost": 300
}
```

### PlanetFesQuest.json (0.05 MB, 165 条)

**字段** (7): `Description, FinishwayID, ID, IconPath, Name, QuestType, RewardItemList`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "QuestType": "Achievement",
  "RewardItemList": [
    {
      "ItemID": 252125,
      "ItemNum": 20
    }
  ],
  "FinishwayID": 6050601,
  "Name": {
    "Hash": 1690248871155196869
  },
  "Description": {
    "Hash": 2375375001568235945
  },
  "IconPath": "SpriteOutput/Quest/PlanetFes/PlanetFesTa..."
}
```

### PixAirEquipEnchantConfig.json (0.04 MB, 450 条)

**字段** (3): `EnchantType, EquipID, SkillList`

**首条记录摘要**:
```json
{
  "EquipID": 3101,
  "EnchantType": "Damage",
  "SkillList": [
    900001
  ]
}
```

### PerformanceReplayOverride.json (0.04 MB, 313 条)

**字段** (3): `Desc, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "PlayVideo",
  "PerformanceID": 100010100,
  "Desc": {
    "Hash": 6584996130495776715
  }
}
```

### PixAirEquipLevelConfig.json (0.04 MB, 213 条)

**字段** (10): `BurnPower, ChargePower, CoolDown, DamagePower, EquipID, EquipLevel, JamPower, MultiPower, ShieldPower, SkillList`

**首条记录摘要**:
```json
{
  "EquipID": 301,
  "EquipLevel": 1,
  "CoolDown": {
    "Value": 5
  },
  "DamagePower": {
    "Value": 30
  },
  "ChargePower": {
    "Value": 1
  },
  "SkillList": [
    30101,
    30102
  ]
}
```

### PerformanceSkipCharacter.json (0.03 MB, 257 条)

**字段** (2): `IconPath, TalkSentenceName`

**首条记录摘要**:
```json
{
  "TalkSentenceName": "TalkSentenceName_Mar_7th",
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001..."
}
```

### PixAirContentConfig.json (0.03 MB, 146 条)

**字段** (5): `ContentID, CoreTagIndexList, EventOptionDescribe, Name, Rarity`

**首条记录摘要**:
```json
{
  "ContentID": 2014,
  "CoreTagIndexList": [],
  "Name": {
    "Hash": 17480832321808898405
  },
  "EventOptionDescribe": {
    "Hash": 6595950340679184800
  }
}
```

### PlanetFesBuff.json (0.03 MB, 220 条)

**字段** (5): `Duration, ID, SourceID, Type, TypeParam`

**首条记录摘要**:
```json
{
  "ID": 20011,
  "SourceID": 4,
  "Type": "AllLandIncomeIncrease",
  "TypeParam": [
    0
  ]
}
```

### PetMarbleView.json (0.03 MB, 63 条)

**字段** (8): `BDACPPLKLGL, FJDFAJDHIBI, IODLAAIECIG, JOAPPDJLNNN, KILFKBDMJGI, OENAMINOLLF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 301,
  "OENAMINOLLF": "PetMarbleView_Name_301_0",
  "BDACPPLKLGL": "Gameplays/Marble/PetMarble/PlayerBall_Pe...",
  "OLOIFNNLKJP": "SpriteOutput/Quest/ActivityMarble/SealIc...",
  "KILFKBDMJGI": "SpriteOutput/Quest/ActivityMarble/SealIc...",
  "FJDFAJDHIBI": "",
  "JOAPPDJLNNN": ""
}
```

### PixAirEquipConfig.json (0.02 MB, 96 条)

**字段** (7): `AffectedTaglist, EquipID, EquipIcon, IsCore, Name, SlotType, TagList`

**首条记录摘要**:
```json
{
  "EquipID": 301,
  "Name": {
    "Hash": 13576441978723640574
  },
  "EquipIcon": "SpriteOutput/Quest/PixAir/PixAir_EquipIc...",
  "SlotType": "Small",
  "IsCore": true,
  "TagList": [
    "Core",
    "Damage",
    "Charge"
  ],
  "AffectedTaglist": [
    "Damage"
  ]
}
```

### PlanetFesAvatarBuff.json (0.02 MB, 190 条)

**字段** (4): `ID, SourceID, Type, TypeParam`

**首条记录摘要**:
```json
{
  "ID": 10010,
  "SourceID": 2,
  "Type": "IncomeIncreaseIfLandTypeMatch",
  "TypeParam": [
    2,
    30
  ]
}
```

### PixAirEnemyDisplayConfig.json (0.02 MB, 52 条)

**字段** (7): `EnemyDeadTalk, EnemyDesc, EnemyDisplayID, EnemyIcon, EnemyName, EnemyTrashTalk, PrefabPath`

**首条记录摘要**:
```json
{
  "EnemyDisplayID": 101,
  "EnemyIcon": "SpriteOutput/Quest/PixAir/PixAir_EnemyIc...",
  "EnemyName": {
    "Hash": 12304483370570958069
  },
  "EnemyTrashTalk": {
    "Hash": 17095909772026089298
  },
  "EnemyDeadTalk": {
    "Hash": 580352435125051426
  },
  "EnemyDesc": {
    "Hash": 16232955041710378142
  },
  "PrefabPath": "UI/UI3D/ActivityPixAir/Plane/PixAirPlane..."
}
```

### PlayerRoomDynamicConfig.json (0.02 MB, 79 条)

**字段** (7): `DisplayTaglist, ID, IconPath, IsActivity, PrefabPath, Taglist, UseLowLight`

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
  "IsActivity": 1,
  "DisplayTaglist": []
}
```

### PetMarbleTalk.json (0.02 MB, 121 条)

**字段** (6): `FBPKGPODAJE, HGAOKKFGLBF, IBGNNBCPHFO, LMFCOMHHEIG, NNDOABPFDMI, PBLDLDIEFNC`

**首条记录摘要**:
```json
{
  "NNDOABPFDMI": 1,
  "PBLDLDIEFNC": 2,
  "LMFCOMHHEIG": "OnShootAction",
  "IBGNNBCPHFO": {
    "Hash": 16818065489886786161
  },
  "FBPKGPODAJE": 1.5,
  "HGAOKKFGLBF": "Ev_vo_haibao_text_02"
}
```

### NounAtlas.json (0.02 MB, 100 条)

**字段** (8): `ID, IsIntroPage, NounDesc, NounTitle, RelatedTerms, SortID, Type, Unlock`

**首条记录摘要**:
```json
{
  "Type": 1,
  "NounTitle": {
    "Hash": 2702432903392642343
  },
  "NounDesc": {
    "Hash": 2336704873428742309
  },
  "RelatedTerms": [],
  "IsIntroPage": true
}
```

### PlanetFesAvatar.json (0.02 MB, 25 条)

**字段** (18): `AnimConfig, Body, CD, CargoIcon, Description, GachaUnlockIDList, HeadIcon, ID, IncomeParam, ItemID, LandType, MidIcon, MiniIcon, Name, PlanetType, Rarity, Skill1List, Skill2List`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlanetType": "Exhibition",
  "LandType": "Exhibition",
  "Rarity": 1,
  "ItemID": 252201,
  "CD": 20,
  "Skill1List": [
    10010,
    10011,
    10012,
    10013,
    10014
  ],
  "Skill2List": [],
  "IncomeParam": 100,
  "GachaUnlockIDList": [
    103
  ],
  "Name": {
    "Hash": 14504468711031923758
  },
  "Description": "PlanetFesAvatar_Description_1",
  "HeadIcon": "SpriteOutput/AvatarSpine/AvatarRoundIcon...",
  "MiniIcon": "SpriteOutput/AvatarSpine/AvatarMiniIcon/...",
  "Body": "UI/Quest/PlanetFes/AvatarSpinePrefab/Pla...",
  "AnimConfig": "Config/Gameplays/PlanetFes/PlanetFesSpin...",
  "MidIcon": "SpriteOutput/AvatarSpine/AvatarIcon/1317...",
  "CargoIcon": "SpriteOutput/Quest/PlanetFes/TransportIt..."
}
```

### PlayerIcon.json (0.02 MB, 119 条)

**字段** (6): `ID, ImagePath, IsVisible, Sort, SortType, Type`

**首条记录摘要**:
```json
{
  "ID": 200001,
  "ImagePath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "IsVisible": true,
  "Type": "Default",
  "SortType": 1,
  "Sort": 71
}
```

### PlayerReturnConfig.json (0.02 MB, 29 条)

**字段** (20): `ActivityModuleID, AssistGroupID, BpExpExtraRatio, DailyDoubleTime, DispatchLink, ExtraHcoinConfigID, ExtraHcoinTime, ExtraMultipleDropList, FarmMultipleDropID, KeyPointID, LimitTime, LoginReward, PlayerReturnID, QuestGroupID, RecommendActivity, RecommendAvatar, RecommendMission, ReturnRewardIDList, TotalDoubleTime, ValidityPeriod`

**首条记录摘要**:
```json
{
  "PlayerReturnID": 1,
  "DispatchLink": "return_questionnaire_a_url",
  "FarmMultipleDropID": 20001,
  "LimitTime": 40,
  "QuestGroupID": [
    1,
    2,
    3,
    4
  ],
  "ReturnRewardIDList": [
    160001
  ],
  "KeyPointID": [
    1,
    2,
    3,
    4,
    5
  ],
  "LoginReward": [
    1,
    2,
    3,
    4,
    5,
    6,
    7
  ],
  "ValidityPeriod": 14,
  "DailyDoubleTime": 6,
  "TotalDoubleTime": 42,
  "ExtraMultipleDropList": [],
  "RecommendAvatar": [],
  "RecommendMission": [],
  "RecommendActivity": [],
  "AssistGroupID": []
}
```

### NPCMonsterTrackConfig.json (0.02 MB, 76 条)

**字段** (4): `ID, MapEntranceID, NPCMonsterMarkList, SortID`

**首条记录摘要**:
```json
{
  "ID": 111001,
  "MapEntranceID": 2010101,
  "NPCMonsterMarkList": "<list[6]>",
  "SortID": 4
}
```

### OverrideFloorConfig.json (0.02 MB, 148 条)

**字段** (5): `ContentID, DimensionID, EnableCondition, FloorID, IsHideInNavMapSubTab`

**首条记录摘要**:
```json
{
  "ContentID": 200001,
  "FloorID": 10304001,
  "DimensionID": 1001,
  "EnableCondition": ""
}
```

### PlanetFesRecommendTeam.json (0.02 MB, 27 条)

**字段** (5): `Business, Exhibition, FesLevel, Game, ID`

**首条记录摘要**:
```json
{
  "FesLevel": 1,
  "ID": 1,
  "Exhibition": "<list[2]>",
  "Business": [
    {
      "ACCJKGEKHKP": 6,
      "OPJDGJNAKFF": 20
    }
  ],
  "Game": [
    {
      "ACCJKGEKHKP": 3,
      "OPJDGJNAKFF": 20
    }
  ]
}
```

### PixAirEnemyConfig.json (0.02 MB, 60 条)

**字段** (6): `CoinLoot, DisplayID, EnemyID, EquipsID, EquipsLevel, HP`

**首条记录摘要**:
```json
{
  "EnemyID": 101,
  "EquipsID": [
    4014,
    3404
  ],
  "EquipsLevel": [
    1,
    1
  ],
  "CoinLoot": 2,
  "DisplayID": 101,
  "HP": {
    "Value": 100
  }
}
```

### PSObjectMissionMap.json (0.01 MB, 194 条)

**字段** (2): `MissionIDList, ObjectID`

**首条记录摘要**:
```json
{
  "ObjectID": 1000101,
  "MissionIDList": [
    1000101
  ]
}
```

### NavMapSubTab.json (0.01 MB, 82 条)

**字段** (4): `FloorID, MenuSortID, NavMapTabID, UnlockConditionExpression`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "MenuSortID": 2,
  "UnlockConditionExpression": "[RealFinishMainMission:1000501]|[RealFin...",
  "NavMapTabID": 10000000
}
```

### PlanetFesCard.json (0.01 MB, 40 条)

**字段** (7): `BuffIDList, CardID, Description, Name, PicPath, PieceItemList, Rarity`

**首条记录摘要**:
```json
{
  "CardID": 20101,
  "Rarity": 1,
  "Name": {
    "Hash": 9014703220144065970
  },
  "Description": {
    "Hash": 10486395408880048324
  },
  "PicPath": "SpriteOutput/Quest/PlanetFes/SwapCardPic...",
  "PieceItemList": [
    252301,
    252302,
    252303
  ],
  "BuffIDList": [
    80103
  ]
}
```

### PetMarbleFriend.json (0.01 MB, 50 条)

**字段** (5): `BMCKCHLJFIE, KILFKBDMJGI, OENAMINOLLF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 14760136372759249387
  },
  "OLOIFNNLKJP": "SpriteOutput/AvatarRoundIcon/Avatar/1002...",
  "KILFKBDMJGI": "SpriteOutput/AvatarRoundIcon/Avatar/1002...",
  "BMCKCHLJFIE": [
    1,
    2
  ]
}
```

### PlanetFesAvatarEvent.json (0.01 MB, 40 条)

**字段** (7): `AvatarID, EventContent, EventOptionIDList, ID, IconPath, PicPath, UnlockIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "UnlockIDList": [],
  "EventOptionIDList": [
    1011,
    1012
  ],
  "AvatarID": 1306,
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1306...",
  "EventContent": {
    "Hash": 11109865534701052734
  },
  "PicPath": "SpriteOutput/Quest/PlanetFes/EventPic/Ev..."
}
```

### PhotoExhibitionDetail.json (0.01 MB, 19 条)

**字段** (13): `AuthorName, FemalePicPath, FinishSubMissionID, GroupphotoDesc, ID, MalePicPath, MissionID, Name, RuikeReply, ShowRuikeName, TaskOption, Unlock, UnlockPicPath`

**首条记录摘要**:
```json
{
  "ID": 100,
  "MissionID": 8027200,
  "FinishSubMissionID": 802720005,
  "Name": {
    "Hash": 3860716878318847090
  },
  "AuthorName": {
    "Hash": 3803160757241820235
  },
  "Unlock": {
    "Hash": 9921546195335340336
  },
  "RuikeReply": {
    "Hash": 14785362198113908998
  },
  "UnlockPicPath": "SpriteOutput/Quest/PhotoExhibition/Photo...",
  "TaskOption": [],
  "MalePicPath": "<list[1]>",
  "FemalePicPath": "<list[1]>"
}
```

### PhotoGraphAvatarConfig.json (0.01 MB, 96 条)

**字段** (2): `AvatarID, EmotionConfigList`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "EmotionConfigList": [
    10010,
    10011,
    10012,
    10013,
    10014
  ]
}
```

### NavMapTab.json (0.01 MB, 80 条)

**字段** (7): `Desc, ID, MapSpaceType, MenuIconID, Name, SortID, WorldID`

**首条记录摘要**:
```json
{
  "ID": 10000000,
  "WorldID": 100,
  "Name": {
    "Hash": 18144084950729133413
  },
  "Desc": {
    "Hash": 10635602258988564180
  },
  "SortID": 1,
  "MenuIconID": 1
}
```

### PerformanceReplayExclude.json (0.01 MB, 168 条)

**字段** (2): `PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 102030196
}
```

### PixAirBattleConfig.json (0.01 MB, 57 条)

**字段** (5): `ContentID, EnemyHealthPercentage, EnemyIDList, EnemyShow, PlayerHealthPercentage`

**首条记录摘要**:
```json
{
  "ContentID": 9999,
  "EnemyIDList": [
    9999
  ],
  "EnemyShow": 9999
}
```

### PlanetFesConstValueCommon.json (0.01 MB, 58 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Planet_Fes_Initial_Item_Map",
  "Value": "<dict[1]>"
}
```

### PhotoExhibitionComment.json (0.01 MB, 51 条)

**字段** (4): `ID, Name, NpcHandIcon, Reply`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 2016445084217114363
  },
  "NpcHandIcon": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "Reply": {
    "Hash": 9538735765592561234
  }
}
```

### PlanetFesSkillTree.json (0.01 MB, 22 条)

**字段** (10): `Icon, IsImportant, LevelCostList, LevelSkillList, MaxLevel, Name, NextSkillIDList, Phase, SkillID, UnlockIDList`

**首条记录摘要**:
```json
{
  "SkillID": 101,
  "Phase": 1,
  "NextSkillIDList": [
    110
  ],
  "Name": {
    "Hash": 12100941884165077411
  },
  "Icon": "SpriteOutput/Quest/PlanetFes/Buff/Planet...",
  "MaxLevel": 2,
  "LevelSkillList": [
    51011,
    51012
  ],
  "LevelCostList": [
    1,
    1
  ],
  "UnlockIDList": []
}
```

### PixAirNodeConfig.json (0.01 MB, 184 条)

**字段** (2): `NodeID, NodeType`

**首条记录摘要**:
```json
{
  "NodeID": 10101,
  "NodeType": "Select"
}
```

### QuestTimeLimitConfig.json (0.01 MB, 55 条)

**字段** (6): `BGDesc, FigurePath, GuideImgPath, QuestID, UnlockData, WorldID`

**首条记录摘要**:
```json
{
  "QuestID": 6000601,
  "UnlockData": 103007,
  "FigurePath": "SpriteOutput/Quest/ActivityQuestTimeLimi...",
  "WorldID": 401,
  "GuideImgPath": ""
}
```

### PlanetFesGameReward.json (0.01 MB, 94 条)

**字段** (4): `BuffList, GameRewardID, GoldNum, ItemList`

**首条记录摘要**:
```json
{
  "GameRewardID": 10001,
  "ItemList": {},
  "GoldNum": 100,
  "BuffList": []
}
```

### PetMarble.json (0.01 MB, 48 条)

**字段** (9): `BIGDEPHIPAI, BOKJJKFCFME, DCJPFHPHABK, JDLIPEJMGCP, KJMPDIHMBGO, ONMOHCJHJPN, PBLDLDIEFNC, PHFMCACHFIJ, PMFHEJEFCLM`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "PBLDLDIEFNC": 251501,
  "DCJPFHPHABK": true,
  "PMFHEJEFCLM": 301,
  "ONMOHCJHJPN": 501,
  "BOKJJKFCFME": 48201,
  "JDLIPEJMGCP": 1,
  "KJMPDIHMBGO": "SwitchGroup_NPC_haibaoB"
}
```

### ParkourLevelConfig.json (0.01 MB, 13 条)

**字段** (18): `BGMIDList, Desc, FinishDisplay, GameAssetPath, GameAssetPathOnClear, ID, LapCount, LevelRegionState, MinimapAngle, MinimapResPath, Name, NextStorySubMissionID, RailBallLimit, StoryLevel, TargetRank, TriggerCarTaskUnlock, UnlockParam, UnlockType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StoryLevel": true,
  "Name": {
    "Hash": 1045523278266222914
  },
  "Desc": {
    "Hash": 2687868557309787501
  },
  "UnlockType": "FinishSubMission",
  "UnlockParam": 803320103,
  "RailBallLimit": 1,
  "GameAssetPath": "Activity/Parkour/RoadMapInfo/ParkourGame...",
  "GameAssetPathOnClear": "",
  "MinimapResPath": "SpriteOutput/Quest/Parkour/MiniMap/Minim...",
  "MinimapAngle": 45,
  "LevelRegionState": 2,
  "LapCount": 3,
  "TargetRank": 3,
  "FinishDisplay": {
    "Hash": 17652283284798684579
  },
  "BGMIDList": [
    3
  ],
  "TriggerCarTaskUnlock": ""
}
```

### ParkourTriggerEventContent.json (0.01 MB, 63 条)

**字段** (4): `ID, SpritePath, TextContent, TriggerShowType`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "TriggerShowType": "Sprite",
  "SpritePath": "SpriteOutput/Emoji/114006.png"
}
```

### PlayerRoomSlotConfig.json (0.01 MB, 44 条)

**字段** (7): `CameraStaticID, ID, Name, SortID, SubArea, TagList, TypeList`

**首条记录摘要**:
```json
{
  "ID": 1100101,
  "Name": {
    "Hash": 5534510744101215634
  },
  "SortID": 1,
  "CameraStaticID": 11001,
  "TagList": [
    6
  ],
  "TypeList": [
    "Desk"
  ]
}
```

### ParkourTriggerEvent.json (0.01 MB, 29 条)

**字段** (10): `DisplayContentIDList, EventID, LimitLevelID, LimitRepeatTimeOverride, OriginID, OriginType, Param, TargetID, TargetType, TriggerEventType`

**首条记录摘要**:
```json
{
  "EventID": 1,
  "OriginType": "RailBall",
  "OriginID": 1,
  "TargetType": "Any",
  "LimitLevelID": [],
  "TriggerEventType": "Passed",
  "Param": [
    {
      "Value": 80
    }
  ],
  "DisplayContentIDList": [
    1001,
    1002
  ]
}
```

### PerformanceSubMissionLink.json (0.01 MB, 80 条)

**字段** (3): `PerformanceID, PerformanceType, SubMissionID`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 201160107,
  "SubMissionID": 201160107
}
```

### PixAirEventOptionConfig.json (0.01 MB, 37 条)

**字段** (5): `BasicCost, ContentID, OptionDescribe, OptionEffectDesc, OptionID`

**首条记录摘要**:
```json
{
  "ContentID": 3001,
  "OptionID": 1,
  "BasicCost": {},
  "OptionDescribe": {
    "Hash": 5655783007847169295
  },
  "OptionEffectDesc": {
    "Hash": 6199293668962027298
  }
}
```

### PlayerOutfitDetail.json (0.01 MB, 48 条)

**字段** (3): `JsonPath, OutfitID, TargetGenderType`

**首条记录摘要**:
```json
{
  "OutfitID": 1000,
  "TargetGenderType": "TARGET_GENDER_MAN",
  "JsonPath": "Config/ConfigPlayerOutfit/PlayerBoy_Char..."
}
```

### PlayerLevelConfig.json (0.01 MB, 70 条)

**字段** (4): `Level, LevelRewardID, PlayerExp, StaminaLimit`

**首条记录摘要**:
```json
{
  "Level": 1,
  "StaminaLimit": 300
}
```

### PetMarbleBattleProperty.json (0.01 MB, 48 条)

**字段** (6): `AMMPNOLLCIN, FELDBBKJCHO, IDKONBFPBLH, PGDKIGEIBAA, PGFBFDJIDLM, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 501,
  "IDKONBFPBLH": 0.462,
  "PGDKIGEIBAA": 12,
  "PGFBFDJIDLM": 22,
  "FELDBBKJCHO": 6,
  "AMMPNOLLCIN": 60
}
```

### PsActivity.json (0.01 MB, 17 条)

**字段** (5): `ActivityID, ObjectIDList, description, name, task`

**首条记录摘要**:
```json
{
  "ActivityID": 1,
  "ObjectIDList": [
    1000101,
    1000203,
    1000300
  ],
  "name": {
    "Hash": 15344922488414949004
  },
  "description": {
    "Hash": 1605177514783006610
  },
  "task": {
    "Hash": 14453569066108792740
  }
}
```

### PerformanceA.json (0.01 MB, 28 条)

**字段** (8): `EndBlack, EndWithCrack, FloorID, IsSkip, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010102,
  "PerformancePath": "Config/Level/Mission/1000101/CS100010102...",
  "IsSkip": "AfterSeen",
  "StartBlack": "NoPre",
  "EndWithCrack": true,
  "PlaneID": 20001,
  "FloorID": 20001001
}
```

### PetMarbleSkill.json (0.01 MB, 47 条)

**字段** (3): `ALIDICNGLGL, OHLBMAGECPM, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 47801,
  "OHLBMAGECPM": {
    "Hash": 1996454075903616702
  },
  "ALIDICNGLGL": [
    3
  ]
}
```

### PlanetFesAssistantMessage.json (0.01 MB, 25 条)

**字段** (9): `AssistantMessageType, Delay, Description, ID, Interval, IsUseGLobalCD, Priority, TypePara, UnlockPlanetFesLevel`

**首条记录摘要**:
```json
{
  "ID": 1,
  "AssistantMessageType": "PlanetFesLandAvailableForPurchase",
  "TypePara": [],
  "Description": {
    "Hash": 6192082335486502911
  },
  "Delay": 10,
  "Interval": 200,
  "Priority": 1,
  "UnlockPlanetFesLevel": 2
}
```

### PreAvatarLevelingTemplate.json (0.01 MB, 18 条)

**字段** (13): `BossMaterialAmount, CoinAmount, ExpAmount, PromotionMaterialAmount, SkillMaterialLargeAmount, SkillMaterialMediumAmount, SkillMaterialSmallAmount, TemplateID, TracksDestinyAmount, WorldLevel, WorldMaterialLargeAmount, WorldMaterialMediumAmount, WorldMaterialSmallAmount`

**首条记录摘要**:
```json
{
  "TemplateID": 1,
  "WorldLevel": 1,
  "BossMaterialAmount": 1,
  "SkillMaterialSmallAmount": 18,
  "WorldMaterialSmallAmount": 56,
  "CoinAmount": 101734,
  "ExpAmount": 497340
}
```

### PlanetFesLevel.json (0.01 MB, 10 条)

**字段** (9): `BasicBuffIDList, BuffIDList, CostNum, Description, GrantGold, GrantItemList, Level, NewTipsList, QuestID`

**首条记录摘要**:
```json
{
  "Level": 1,
  "BasicBuffIDList": [],
  "BuffIDList": [],
  "CostNum": {
    "unit": "K"
  },
  "GrantItemList": [],
  "GrantGold": {
    "unit": "K"
  },
  "Description": {
    "Hash": 5465431144998608721
  },
  "NewTipsList": [
    1
  ]
}
```

### PlanetFesTask.json (0.01 MB, 102 条)

**字段** (4): `QuestID, RandomGroupID, TaskID, TaskTips`

**首条记录摘要**:
```json
{
  "TaskID": 1,
  "QuestID": 101
}
```

### PetMarbleEnemy.json (0.01 MB, 14 条)

**字段** (8): `ACECCFPKEHJ, CANEJABOMFI, HDFPMFOJCLD, KILFKBDMJGI, NMAHGFAPENI, OENAMINOLLF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 100,
  "OENAMINOLLF": {
    "Hash": 11775103514208448498
  },
  "NMAHGFAPENI": {
    "Hash": 13335055843441454212
  },
  "OLOIFNNLKJP": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "KILFKBDMJGI": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "CANEJABOMFI": 2,
  "ACECCFPKEHJ": [
    1,
    2
  ],
  "HDFPMFOJCLD": 23
}
```

### PixAirPlaneConfig.json (0.01 MB, 8 条)

**字段** (16): `AvatarName, BaseHP, BaseLife, EquipID, EquipIDList, GrantBySubmissionID, IconPath, IsSelectable, LargePlaneIconPath, ModelPath, Name, PlaneID, PlaneIconPath, RecommendTagList, UnlockScore, desc`

**首条记录摘要**:
```json
{
  "PlaneID": 1,
  "EquipID": 301,
  "EquipIDList": [
    301
  ],
  "RecommendTagList": [
    "Damage"
  ],
  "BaseHP": 300,
  "BaseLife": 3,
  "Name": "PixAirPlaneConfig_Name_1",
  "PlaneIconPath": "SpriteOutput/UI/Quest/PixAir/AreaLoading...",
  "LargePlaneIconPath": "SpriteOutput/Quest/PixAir/PixAir_ScreenI...",
  "ModelPath": "UI/UI3D/ActivityPixAir/Plane/PixAirPlane...",
  "IconPath": "SpriteOutput/AvatarIcon/Avatar/8001.png",
  "AvatarName": {
    "Hash": 4389774298525171889
  },
  "desc": {
    "Hash": 10612815521686981484
  },
  "IsSelectable": true
}
```

### PixAirConstValueCommon.json (0.01 MB, 34 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_PixAir_ModuleID",
  "Value": {
    "IntValue": 5011202
  }
}
```

### PetDiyParkSlot.json (0.00 MB, 21 条)

**字段** (10): `AILMCDDKIFO, BEOFPCAACEP, DGIPOMANFEM, EMNHIJAIMBE, FMLGGKAFMKC, HCDCEPGEMKD, HFKHMNJPGMI, LLDCHLHNADA, MPADIDFJBEF, OBOMNIHKHMM`

**首条记录摘要**:
```json
{
  "BEOFPCAACEP": 1,
  "FMLGGKAFMKC": 1,
  "LLDCHLHNADA": 58,
  "OBOMNIHKHMM": 1,
  "HFKHMNJPGMI": "Config/Level/PetDiy/LG_PetDiy_BubbleInte...",
  "HCDCEPGEMKD": ""
}
```

### PlanetFesLevelUnlock.json (0.00 MB, 15 条)

**字段** (5): `Description, ID, IconPath, MiniIconPath, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 16590016568203352501
  },
  "Description": {
    "Hash": 13253610577273195627
  },
  "IconPath": "SpriteOutput/Quest/PlanetFes/Function/Pl...",
  "MiniIconPath": "SpriteOutput/Quest/PlanetFes/Function/Li..."
}
```

### NormalMode.json (0.00 MB, 32 条)

**字段** (5): `Desc01, Desc02, Desc03, NormalModeID, Title`

**首条记录摘要**:
```json
{
  "NormalModeID": 1006,
  "Title": "NormalMode_Title_1006",
  "Desc01": "NormalMode_Desc01_1006",
  "Desc02": "",
  "Desc03": ""
}
```

### PixAirShopConfig.json (0.00 MB, 90 条)

**字段** (2): `ContentID, RefreshCount`

**首条记录摘要**:
```json
{
  "ContentID": 8001
}
```

### PamChatGreeting.json (0.00 MB, 19 条)

**字段** (7): `CanTriggerWhenLLMDisabled, Condition, GreetingTextIDList, HudBubble, ID, IsDailyGreeting, Priority`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Condition": "[NoOtherGreetingTriggered]",
  "GreetingTextIDList": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "IsDailyGreeting": true,
  "Priority": 1
}
```

### PlanetFesLand.json (0.00 MB, 9 条)

**字段** (10): `CargoIcon, Description, GrantItemList, ID, LandType, Name, Pic, PlanetType, PriceNum, UnlockIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlanetType": "Exhibition",
  "LandType": "Exhibition",
  "PriceNum": {
    "base_value": 15
  },
  "GrantItemList": {},
  "UnlockIDList": [],
  "Name": {
    "Hash": 16351075054501747985
  },
  "Description": {
    "Hash": 2836398004766939927
  },
  "Pic": "SpriteOutput/Quest/PlanetFes/BuildingImg...",
  "CargoIcon": "SpriteOutput/Quest/Monopoly/3DBlockIcon/..."
}
```

### PhoneThemeConfig.json (0.00 MB, 14 条)

**字段** (6): `ID, PhoneThemeApp, PhoneThemeItem, PhoneThemeMain, ShowParam, ShowType`

**首条记录摘要**:
```json
{
  "ID": 221000,
  "ShowType": "Always",
  "PhoneThemeItem": "SpriteOutput/PhoneTheme/Theme/PhoneTheme...",
  "PhoneThemeMain": "SpriteOutput/PhoneTheme/Theme/PhoneTheme...",
  "PhoneThemeApp": "SpriteOutput/PhoneTheme/Theme/PhoneTheme..."
}
```

### NPCSeries.json (0.00 MB, 132 条)

**字段** (1): `SeriesID`

**首条记录摘要**:
```json
{
  "SeriesID": 100101
}
```

### PlanetFesBusinessDay.json (0.00 MB, 19 条)

**字段** (8): `AvatarEventNum, BusinessDay, LargeBonusNum, LittleBonusNum, MiddleBonusNum, NaturalDay, PamNum, StartText`

**首条记录摘要**:
```json
{
  "BusinessDay": 1,
  "PamNum": 10,
  "NaturalDay": 1
}
```

### PixAirAreaConfig.json (0.00 MB, 32 条)

**字段** (2): `AreaID, NodeIDList`

**首条记录摘要**:
```json
{
  "AreaID": 101,
  "NodeIDList": "<list[6]>"
}
```

### PamAction.json (0.00 MB, 14 条)

**字段** (12): `AnimGroupName, AnyDirection, MaxMoodPoint, MaxStrengthPoint, MinMoodPoint, MinStrengthPoint, PamAction, PamMood, PerformanceID, Settle, Weight, WithoutAnchor`

**首条记录摘要**:
```json
{
  "PamAction": "Music",
  "AnimGroupName": "Music01_StandBy",
  "MinMoodPoint": 60,
  "MaxMoodPoint": 100,
  "MinStrengthPoint": 20,
  "MaxStrengthPoint": 100,
  "Weight": 0.5,
  "Settle": [
    20,
    -10
  ],
  "PerformanceID": 501020101
}
```

### PlanetFesUnlock.json (0.00 MB, 58 条)

**字段** (3): `FinishWayID, UnlockDesc, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 101,
  "FinishWayID": 6050101,
  "UnlockDesc": {
    "Hash": 17518801394188451150
  }
}
```

### ParkourRailBallSkill.json (0.00 MB, 9 条)

**字段** (8): `Desc, ID, IconPath, MiniIconBGPath, MiniIconPath, Name, TutorialID, VideoID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 13437874252785268148
  },
  "Desc": {
    "Hash": 15655561507080038116
  },
  "IconPath": "SpriteOutput/UI/Quest/Parkour/MainPlayPa...",
  "VideoID": 11001,
  "TutorialID": 9981,
  "MiniIconPath": "SpriteOutput/Quest/Parkour/CarSkillIcon/...",
  "MiniIconBGPath": "SpriteOutput/Quest/Parkour/CarSkillIcon/..."
}
```

### PetMarbleTitle.json (0.00 MB, 13 条)

**字段** (9): `ACBKMOPHPLE, DPICNGBHFAC, EKIJFPIPCKF, JAADBJBIBPH, NALMBOOCCIN, NMAHGFAPENI, NNACKOBKFGE, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 7753563658954605488
  },
  "NMAHGFAPENI": {
    "Hash": 6704553460634076820
  },
  "NNACKOBKFGE": [],
  "ACBKMOPHPLE": "TotalDamage",
  "EKIJFPIPCKF": "Max",
  "JAADBJBIBPH": 3,
  "NALMBOOCCIN": 3000
}
```

### PlayerReturnQuest.json (0.00 MB, 49 条)

**字段** (3): `GroupID, ID, LinearQuestID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LinearQuestID": 1010000,
  "GroupID": 1
}
```

### PixAirAnnouncement.json (0.00 MB, 42 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 8390433179620883636
  }
}
```

### PlayerPersonalCard.json (0.00 MB, 6 条)

**字段** (8): `CardID, CardPrefabPath, ChatPrefabPath, FriendPrefabPath, ReplaceIconPath, ShowParam, ShowType, SupportPrefabPath`

**首条记录摘要**:
```json
{
  "CardID": 253000,
  "ReplaceIconPath": "SpriteOutput/PlayerInfo/Card/PlayerInfoi...",
  "CardPrefabPath": "UI/PlayerInfo/PersonalCard/253000/Person...",
  "FriendPrefabPath": "UI/PlayerInfo/PersonalCard/253000/Person...",
  "SupportPrefabPath": "UI/PlayerInfo/PersonalCard/253000/Person...",
  "ChatPrefabPath": "UI/PlayerInfo/PersonalCard/253000/Person...",
  "ShowType": "Always"
}
```

### PixAirEventConfig.json (0.00 MB, 35 条)

**字段** (2): `ContentID, EventDesc`

**首条记录摘要**:
```json
{
  "ContentID": 3001,
  "EventDesc": {
    "Hash": 17072540994495985522
  }
}
```

### PlanetFesRegionPhase.json (0.00 MB, 10 条)

**字段** (8): `BuffID, Description, EffectDesc, Name, PhaseID, PicPath, ProgressValue, RewardID`

**首条记录摘要**:
```json
{
  "PhaseID": 1,
  "ProgressValue": 100,
  "BuffID": 70001,
  "PicPath": "SpriteOutput/Quest/PlanetFes/KVPic/KV200...",
  "Name": {
    "Hash": 7998532747638178515
  },
  "Description": {
    "Hash": 7345622375690861803
  },
  "EffectDesc": {
    "Hash": 12643872006416556444
  }
}
```

### PerformanceCG.json (0.00 MB, 13 条)

**字段** (8): `EndBlack, FloorID, IsSkip, PerformanceCharacter, PerformanceID, PerformancePath, PlaneID, StartBlack`

**首条记录摘要**:
```json
{
  "PerformanceID": 201020356,
  "PerformancePath": "Story/Mission/2010203/Story201020356.jso...",
  "IsSkip": "AfterSeen",
  "PerformanceCharacter": "",
  "PlaneID": 10101,
  "FloorID": 10101002
}
```

### PlanetFesBuffSource.json (0.00 MB, 16 条)

**字段** (4): `ID, IconPath, Name, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "Land",
  "Name": {
    "Hash": 319885287280577579
  },
  "IconPath": "SpriteOutput/BuffIcon/ActivityFantasticS..."
}
```

### PetMarbleEnemyWave.json (0.00 MB, 33 条)

**字段** (2): `BMCKCHLJFIE, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "BMCKCHLJFIE": [
    24,
    25,
    26,
    28
  ]
}
```

### OfferingUIPageConfig.json (0.00 MB, 14 条)

**字段** (8): `CostTitle, ID, LevelTitle, LongTailDesc, LongTailTitle, MaxTip, Name, SubmitBtnName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 7000775562918729249
  }
}
```

### PlanetFesBuffDescOverride.json (0.00 MB, 33 条)

**字段** (2): `Decription, ID`

**首条记录摘要**:
```json
{
  "ID": 70001,
  "Decription": {
    "Hash": 8216729816190751722
  }
}
```

### ParkourConstValueCommon.json (0.00 MB, 22 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "parkour_activity_module_id",
  "Value": {
    "IntValue": 5003901
  }
}
```

### PlayerRoomConstValueClient.json (0.00 MB, 18 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Challenge_Badge_Item_Rarity",
  "Value": {
    "IntValue": 5
  }
}
```

### PixAirStageConfig.json (0.00 MB, 7 条)

**字段** (9): `AreaIDList, IconPath, MechanismTip, Name, PreStageList, RewardTip, StageID, Type, UnlockScore`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "Type": "Normal",
  "UnlockScore": 2000,
  "PreStageList": [
    8
  ],
  "AreaIDList": [
    101,
    102,
    103,
    104,
    105
  ],
  "Name": {
    "Hash": 11782358933836378367
  },
  "IconPath": "SpriteOutput/UI/Quest/PixAir/PixAirLevel...",
  "MechanismTip": {
    "Hash": 4426597032943869212
  },
  "RewardTip": {
    "Hash": 11807661102719463210
  }
}
```

### PropTriggerEvent.json (0.00 MB, 11 条)

**字段** (4): `ExitJsonPath, ID, JsonPath, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "FaceToPropOnly",
  "JsonPath": "Config/Level/Props/InteractMode/TriggerE...",
  "ExitJsonPath": "Config/Level/Props/InteractMode/TriggerE..."
}
```

### OperationRedDotConstValue.json (0.00 MB, 23 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "OP_RedDotType_IM",
  "Value": {
    "IntValue": 9999
  }
}
```

### ParkourRailBallConfig.json (0.00 MB, 5 条)

**字段** (12): `BigResPath, ID, Name, PrefabPath, ResPath, SkillChargeDisplay, SkillID, SpeedDisplay, StabilityDisplay, UI3DPrefabPath, UpgradeBallID, UpgradeSubMission`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 18176798890261946590
  },
  "SkillID": 1,
  "UI3DPrefabPath": "UI/UI3D/Parkour/Widget/UI3D_ParkourGame_...",
  "PrefabPath": "Activity/Parkour/ParkourCharacter/Parkou...",
  "ResPath": "SpriteOutput/Quest/Parkour/ParkourGame_B...",
  "BigResPath": "SpriteOutput/Quest/Parkour/512/ParkourGa...",
  "SpeedDisplay": 7,
  "StabilityDisplay": 6,
  "SkillChargeDisplay": 2
}
```

### PamAnchor.json (0.00 MB, 15 条)

**字段** (5): `AnchorName, AreaName, FloorID, ID, PamPlaceType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FloorID": 10000000,
  "AreaName": "LevelArea_P10000_F10000000_G38",
  "AnchorName": "Ground01",
  "PamPlaceType": "Ground"
}
```

### ParkourRankingList.json (0.00 MB, 6 条)

**字段** (4): `LevelBestRecordList, NPCIconPath, NPCName, RailBallID`

**首条记录摘要**:
```json
{
  "RailBallID": 5,
  "LevelBestRecordList": "<list[3]>",
  "NPCName": {
    "Hash": 10089855168639591785
  },
  "NPCIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1006..."
}
```

### PlayerOutfitBase.json (0.00 MB, 24 条)

**字段** (3): `ItemID, OutfitID, SlotTypeList`

**首条记录摘要**:
```json
{
  "OutfitID": 1000,
  "SlotTypeList": [
    "HeadDecor"
  ]
}
```

### PlanetFesQuestGroup.json (0.00 MB, 7 条)

**字段** (3): `GroupID, QuestList, RewardIDList`

**首条记录摘要**:
```json
{
  "GroupID": 104,
  "QuestList": "<list[10]>",
  "RewardIDList": "<list[7]>"
}
```

### PamSkinConfig.json (0.00 MB, 5 条)

**字段** (5): `ConfigEntityPath, JsonPath, ManikinPrefab, SkinID, SkinIcon`

**首条记录摘要**:
```json
{
  "SkinID": 252000,
  "SkinIcon": "SpriteOutput/AvatarShopIcon/Pam/252000.p...",
  "ConfigEntityPath": "Config/ConfigEntity/NPC/Special/NPC_Spec...",
  "JsonPath": "Config/ConfigCharacter/NPC/Special/NPC_S...",
  "ManikinPrefab": "Characters/CharacterPrefabs/Manikin/Spec..."
}
```

### PetConfig.json (0.00 MB, 5 条)

**字段** (7): `ACJDHMPPCCI, EGBGCKNLHDH, FNBGMDDOHEA, HHDHIDNHCBI, KHDOMCOJDMI, OLJDOBFJLOM, PBLDLDIEFNC`

**首条记录摘要**:
```json
{
  "PBLDLDIEFNC": 1001,
  "HHDHIDNHCBI": 251001,
  "FNBGMDDOHEA": 24001,
  "EGBGCKNLHDH": "Characters/CharacterPrefabs/Manikin/Pet/...",
  "KHDOMCOJDMI": [
    0,
    0,
    0
  ],
  "OLJDOBFJLOM": "Config/ConfigCharacter/Manikin/Pet/Manik...",
  "ACJDHMPPCCI": "Idle_Show_02"
}
```

### PlayerReturnRecommendConfig.json (0.00 MB, 8 条)

**字段** (9): `Condition, GachaID, GotoID, ImagePath, PanelID, RecommendID, Title, Type, Weight`

**首条记录摘要**:
```json
{
  "RecommendID": 1001,
  "Type": "Gacha",
  "Weight": 13,
  "ImagePath": "",
  "Condition": [],
  "GachaID": 2088
}
```

### PlayerOutfitSlot.json (0.00 MB, 8 条)

**字段** (7): `DefaultOutfitID, LimitBaseType, SlotIconPath, SlotName, SlotTipsIntroID, SlotType, VirtualCameraPath`

**首条记录摘要**:
```json
{
  "SlotType": "HeadDecor",
  "DefaultOutfitID": 1000,
  "SlotName": {
    "Hash": 9259308998957837690
  },
  "SlotTipsIntroID": 173,
  "SlotIconPath": "SpriteOutput/UI/Avatar/AvatarSkin/HatIco...",
  "VirtualCameraPath": ""
}
```

### PixAirRecommendConfig.json (0.00 MB, 6 条)

**字段** (5): `CoreID, CoreRecommendTags, EquipList, ID, Title`

**首条记录摘要**:
```json
{
  "ID": 1,
  "CoreID": 301,
  "EquipList": "<list[8]>",
  "Title": {
    "Hash": 3185185266711017959
  },
  "CoreRecommendTags": [
    "Damage"
  ]
}
```

### PlanetFesBuffType.json (0.00 MB, 8 条)

**字段** (3): `Decription, ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": "IncomeIncreaseIfLandTypeMatch",
  "Decription": {
    "Hash": 10638463112482346584
  },
  "IconPath": "SpriteOutput/BuffIcon/ActivityFantasticS..."
}
```

### PlanetFesSummary.json (0.00 MB, 9 条)

**字段** (4): `Description, ID, Name, TargetNum`

**首条记录摘要**:
```json
{
  "ID": "FinishBusinessDay",
  "TargetNum": 7,
  "Name": {
    "Hash": 7796865167056107836
  },
  "Description": {
    "Hash": 7830994119337941640
  }
}
```

### PamAskShareEmoji.json (0.00 MB, 18 条)

**字段** (2): `ID, ImgPath`

**首条记录摘要**:
```json
{
  "ID": 20001,
  "ImgPath": "SpriteOutput/Emoji/EmojiFigure/20001.png"
}
```

### PetMarbleConstValueCommon.json (0.00 MB, 9 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "marble_coop_boss_hard_unlock_need_wins",
  "Value": {
    "IntValue": 5
  }
}
```

### PassengerBehaviorConfig.json (0.00 MB, 6 条)

**字段** (6): `AnchorID, BehaviorID, FloorID, NPCGroupID, NPCID, NPCOverrideConfig`

**首条记录摘要**:
```json
{
  "BehaviorID": 1003001,
  "FloorID": 10000000,
  "AnchorID": 2,
  "NPCGroupID": 40,
  "NPCID": 400002,
  "NPCOverrideConfig": "Config/Level/NPCOverrideConfig/TrainPass..."
}
```

### PlanetFesGameRewardPool.json (0.00 MB, 8 条)

**字段** (4): `Order, RewardParam, RewardPoolID, Type`

**首条记录摘要**:
```json
{
  "RewardPoolID": 1,
  "Order": 1,
  "Type": "Gold",
  "RewardParam": {
    "1": 10001,
    "2": 10002,
    "3": 10003
  }
}
```

### PlanetFesGachaBasic.json (0.00 MB, 7 条)

**字段** (7): `CostGemNum, CostItemID, GachaID, GachaType, MultiGachaCount, MultiGachaUnlockIDList, UnlockIDList`

**首条记录摘要**:
```json
{
  "GachaID": 101,
  "GachaType": "Avatar",
  "CostItemID": 252128,
  "CostGemNum": 30,
  "UnlockIDList": [],
  "MultiGachaUnlockIDList": [
    103
  ],
  "MultiGachaCount": 5
}
```

### PlanetFesAvatarStar.json (0.00 MB, 15 条)

**字段** (4): `CostItemNumber, IncomeParam, Rarity, StarLevel`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "StarLevel": 1,
  "CostItemNumber": 1,
  "IncomeParam": 100
}
```

### PamMood.json (0.00 MB, 7 条)

**字段** (5): `EmotionClipPath, MaxMoodPoint, MinMoodPoint, PamMood, PerformanceID`

**首条记录摘要**:
```json
{
  "PamMood": "Happy",
  "MinMoodPoint": 60,
  "MaxMoodPoint": 100,
  "PerformanceID": 501020121,
  "EmotionClipPath": "Characters/EmotionClip/Special/Pam_00/Em..."
}
```

### OfferingTypeConfig.json (0.00 MB, 15 条)

**字段** (7): `ActivityModuleID, ID, IsAutoOffer, ItemID, LongTailLimit, MaxLevel, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ItemID": 120003,
  "MaxLevel": 50,
  "UnlockID": 9937
}
```

### PerformanceLiveStreamEmoji.json (0.00 MB, 4 条)

**字段** (4): `Atmosphere, MainEmojiPath, SubEmojiPath1, SubEmojiPath2`

**首条记录摘要**:
```json
{
  "Atmosphere": "Chase",
  "MainEmojiPath": "SpriteOutput/EmojiCommon/EmojiFifthWorld...",
  "SubEmojiPath1": "SpriteOutput/EmojiCommon/EmojiFifthWorld...",
  "SubEmojiPath2": "SpriteOutput/EmojiCommon/EmojiFifthWorld..."
}
```

### QuestKeyPointReward.json (0.00 MB, 15 条)

**字段** (4): `ID, QuestKeyPoint, QuestKeyPointItem, QuestKeyPointReward`

**首条记录摘要**:
```json
{
  "ID": 1,
  "QuestKeyPoint": 100,
  "QuestKeyPointReward": 160301
}
```

### PlanetFesCardTheme.json (0.00 MB, 4 条)

**字段** (4): `CardIDList, IconPath, Name, ThemeID`

**首条记录摘要**:
```json
{
  "ThemeID": 201,
  "CardIDList": "<list[10]>",
  "Name": {
    "Hash": 7200521242610986890
  },
  "IconPath": "SpriteOutput/TabIcon/World/World00Icon.p..."
}
```

### PetMarbleHint.json (0.00 MB, 13 条)

**字段** (2): `KEGANNHEKHA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "KEGANNHEKHA": {
    "Hash": 10969150771148706031
  }
}
```

### PlanetFesEvent.json (0.00 MB, 6 条)

**字段** (7): `FailRecurCD, ID, InitialAppearCD, RecurCD, ReenterAppearCD, StayInterval, UnlockIDList`

**首条记录摘要**:
```json
{
  "ID": "PamCargo",
  "UnlockIDList": [
    901
  ],
  "InitialAppearCD": 5,
  "RecurCD": 40,
  "FailRecurCD": 5,
  "StayInterval": 60,
  "ReenterAppearCD": 5
}
```

### PlayerReturnLoginReward.json (0.00 MB, 13 条)

**字段** (4): `FirstWordText, ID, LoginReward, OptionalGiftItem`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LoginReward": 160101,
  "FirstWordText": "Stellar Jade"
}
```

### PixAirSupplyConfig.json (0.00 MB, 36 条)

**字段** (1): `ContentID`

**首条记录摘要**:
```json
{
  "ContentID": 2014
}
```

### PetMarbleBondTalk.json (0.00 MB, 12 条)

**字段** (2): `BMODPDGHLFP, FPNIMOHANFP`

**首条记录摘要**:
```json
{
  "FPNIMOHANFP": 201,
  "BMODPDGHLFP": [
    74,
    75,
    76,
    77
  ]
}
```

### PlanetFesAchievement.json (0.00 MB, 10 条)

**字段** (2): `ID, QuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "QuestList": [
    10001,
    10002,
    10003,
    10004,
    10005
  ]
}
```

### PlayerRoomTagConfig.json (0.00 MB, 14 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 5485505503116308815
  }
}
```

### PlanetFesLandType.json (0.00 MB, 3 条)

**字段** (5): `BigBuffIconPath, IconPath, Name, SmallBuffIconPath, Type`

**首条记录摘要**:
```json
{
  "Type": "Business",
  "Name": {
    "Hash": 16054613956712766495
  },
  "IconPath": "SpriteOutput/Quest/PlanetFes/AreaIcon/Pl...",
  "BigBuffIconPath": "SpriteOutput/Quest/PlanetFes/Buff/Planet...",
  "SmallBuffIconPath": "SpriteOutput/Quest/PlanetFes/Buff/Planet..."
}
```

### ParkourLevelGroup.json (0.00 MB, 5 条)

**字段** (4): `ID, LevelIDList, Name, ResPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LevelIDList": [
    1,
    2
  ],
  "Name": {
    "Hash": 16485195595498892172
  },
  "ResPath": "SpriteOutput/Quest/Parkour/LevelIcon/Par..."
}
```

### PhotoGraphConfig.json (0.00 MB, 6 条)

**字段** (3): `EmotionID, EmotionIconPath, EmotionName`

**首条记录摘要**:
```json
{
  "EmotionName": {
    "Hash": 11485770122095695563
  },
  "EmotionIconPath": "SpriteOutput/CameraIcon/CameraPic/Camera..."
}
```

### PlanetFesFunction.json (0.00 MB, 6 条)

**字段** (4): `Description, FunctionType, ParamList, SkillID`

**首条记录摘要**:
```json
{
  "SkillID": 110,
  "FunctionType": "CollectIncomeCriticalHit",
  "Description": {
    "Hash": 10457385338251605362
  },
  "ParamList": [
    10,
    200
  ]
}
```

### PetDiyParkArea.json (0.00 MB, 3 条)

**字段** (6): `AKOCMKFLEBF, BEOFPCAACEP, HDDIKPLHHPP, OENAMINOLLF, OLOIFNNLKJP, OPBOFEBHDCM`

**首条记录摘要**:
```json
{
  "BEOFPCAACEP": 1,
  "HDDIKPLHHPP": 58,
  "AKOCMKFLEBF": [
    24,
    23,
    22,
    25,
    26
  ],
  "OENAMINOLLF": {
    "Hash": 9685306275015392637
  },
  "OLOIFNNLKJP": "SpriteOutput/Pet/PetPark/PetParkLayoutTa...",
  "OPBOFEBHDCM": "SpriteOutput/Pet/PetPark/PetParkLayoutTa..."
}
```

### PlanetFesLargeBonus.json (0.00 MB, 4 条)

**字段** (9): `ActivityRewardID, BaseIncome, ComboIncome, Duration, ID, TapCD, TapIncome, TimePerSecond, UnlockIDList`

**首条记录摘要**:
```json
{
  "ID": 301,
  "UnlockIDList": [],
  "ActivityRewardID": 1000001,
  "Duration": 5,
  "TapCD": 100,
  "TimePerSecond": 10,
  "TapIncome": {
    "Lower": 1,
    "Upper": 3
  },
  "ComboIncome": 2,
  "BaseIncome": 200
}
```

### PSTrophyGroup.json (0.00 MB, 10 条)

**字段** (2): `PSTrophyGroup, TrophyGroup`

**首条记录摘要**:
```json
{
  "PSTrophyGroup": 10000,
  "TrophyGroup": {
    "Hash": 9205083260363982318
  }
}
```

### PlayerReturnJourneyItem.json (0.00 MB, 3 条)

**字段** (9): `ActivityModuleID, BgPath, ExtraDesc, ID, IsHideInBeta, Name, Sort, Title, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "Questionnaire",
  "Title": {
    "Hash": 3321599064304549599
  },
  "Name": {
    "Hash": 4331165932280067080
  },
  "ExtraDesc": {
    "Hash": 10276716831286808726
  },
  "IsHideInBeta": true,
  "BgPath": "SpriteOutput/Quest/PlayerReturn/PlayerRe...",
  "Sort": 2
}
```

### PerformanceCategoryData.json (0.00 MB, 10 条)

**字段** (4): `Category, CategoryID, IconPath, isSubCategory`

**首条记录摘要**:
```json
{
  "CategoryID": 1,
  "IconPath": ""
}
```

### PlayerReturnRelic.json (0.00 MB, 7 条)

**字段** (4): `IsRelicMatchMainAffix, RelicLevel, RelicRarity, WorldLevel`

**首条记录摘要**:
```json
{
  "RelicRarity": "CombatPowerRelicRarity4",
  "RelicLevel": 9,
  "IsRelicMatchMainAffix": true
}
```

### NpcMonsterTrackQuest.json (0.00 MB, 10 条)

**字段** (3): `MapInfoID, NpcMonsterTrackID, QuestID`

**首条记录摘要**:
```json
{
  "QuestID": 6000601,
  "NpcMonsterTrackID": 800001,
  "MapInfoID": 5007
}
```

### PlanetFesOptical.json (0.00 MB, 5 条)

**字段** (7): `ActivityModuleID, GotoConfig, MainMissionID, Progress, QuestID, RealProgress, Type`

**首条记录摘要**:
```json
{
  "QuestID": 6050121,
  "Type": 1,
  "MainMissionID": 8032201,
  "ActivityModuleID": 5002801,
  "GotoConfig": 6244
}
```

### PlayerReturnConstValue.json (0.00 MB, 8 条)

**字段** (2): `PlayerReturnConstValueName, Value`

**首条记录摘要**:
```json
{
  "PlayerReturnConstValueName": "Cocoon_GoTo",
  "Value": "1504"
}
```

### PropInteractWhiteList.json (0.00 MB, 27 条)

**字段** (1): `PropID`

**首条记录摘要**:
```json
{
  "PropID": 104012
}
```

### PlanetFesAvatarRarity.json (0.00 MB, 3 条)

**字段** (7): `CostParam, IconPath, IncomeParam, LevelSkipStarUpDetail, Name, PieceTransferNum, Rarity`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "IncomeParam": 100,
  "CostParam": 100,
  "PieceTransferNum": 5,
  "IconPath": "SpriteOutput/Quest/PlanetFes/AvatarRarit...",
  "Name": {
    "Hash": 4083090006468002294
  },
  "LevelSkipStarUpDetail": 5
}
```

### OptionalRewardQuest.json (0.00 MB, 12 条)

**字段** (2): `OptionalGiftItemID, QuestID`

**首条记录摘要**:
```json
{
  "QuestID": 6023502,
  "OptionalGiftItemID": 309001
}
```

### PhoneCaseConfig.json (0.00 MB, 2 条)

**字段** (7): `CaseID, IconPath, ImagePath, ItemFigurePath, PrefabPath, ShowParam, ShowType`

**首条记录摘要**:
```json
{
  "CaseID": 254000,
  "IconPath": "SpriteOutput/PhoneTheme/Shell/PhoneShell...",
  "ItemFigurePath": "SpriteOutput/ItemFigures/Figure_Testmate...",
  "ImagePath": "SpriteOutput/PhoneTheme/Shell/PhoneShell...",
  "PrefabPath": "Characters/CharacterPhonePrefabs/Player_...",
  "ShowType": "Always"
}
```

### PlanetFesBonusMascot.json (0.00 MB, 8 条)

**字段** (2): `ID, SourcePath`

**首条记录摘要**:
```json
{
  "ID": 101,
  "SourcePath": "UI/Quest/PlanetFes/MiniEvent/MiniEventWe..."
}
```

### PixAirTagDisplayConfig.json (0.00 MB, 6 条)

**字段** (3): `IsEquipDisplayTag, Name, TagType`

**首条记录摘要**:
```json
{
  "TagType": "Damage",
  "Name": {
    "Hash": 13906356845043677856
  },
  "IsEquipDisplayTag": true
}
```

### PamChatQuickFunction.json (0.00 MB, 5 条)

**字段** (3): `BtnName, ID, PlayerInputText`

**首条记录摘要**:
```json
{
  "ID": 5,
  "BtnName": {
    "Hash": 7437325653845496152
  },
  "PlayerInputText": {
    "Hash": 13389152912789989292
  }
}
```

### PlanetFesBtnUnlock.json (0.00 MB, 10 条)

**字段** (2): `ID, UnlockQuestID`

**首条记录摘要**:
```json
{
  "ID": "BtnQuestPanel",
  "UnlockQuestID": 6050921
}
```

### OfferingLevelUnlockDesc.json (0.00 MB, 7 条)

**字段** (2): `UnlockDesc, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 9944,
  "UnlockDesc": {
    "Hash": 11994204856210995253
  }
}
```

### PamChatCommonConst.json (0.00 MB, 6 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "PamChat_ActivityModuleID",
  "Value": {
    "IntValue": 5008901
  }
}
```

### PetMarbleEmoji.json (0.00 MB, 6 条)

**字段** (3): `DOPHFLLNGPJ, LLDCHLHNADA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 101,
  "LLDCHLHNADA": 1,
  "DOPHFLLNGPJ": "SpriteOutput/Emoji/20001.png"
}
```

### NounAtlasChangeInfo.json (0.00 MB, 9 条)

**字段** (2): `ChangeNounIDList, NounID`

**首条记录摘要**:
```json
{
  "NounID": 23,
  "ChangeNounIDList": [
    24
  ]
}
```

### ParkourBGMConfig.json (0.00 MB, 4 条)

**字段** (3): `FastEventName, ID, NormalEventName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NormalEventName": "State_Menu_Season_Parkour_MovieGame_Norm...",
  "FastEventName": "State_Menu_Season_Parkour_MovieGame_Fast"
}
```

### PetDiyTrain.json (0.00 MB, 4 条)

**字段** (6): `EHCBBAEMNFE, FMLGGKAFMKC, JGOCJLDLFLM, LLDCHLHNADA, OBOMNIHKHMM, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FMLGGKAFMKC": 1,
  "LLDCHLHNADA": 263,
  "OBOMNIHKHMM": 1,
  "JGOCJLDLFLM": 0.15,
  "EHCBBAEMNFE": 0.22
}
```

### PlanetFesRaiseConfig.json (0.00 MB, 8 条)

**字段** (3): `GoldCost, RaiseCurveID, RaiseValue`

**首条记录摘要**:
```json
{
  "RaiseCurveID": 1,
  "RaiseValue": 1
}
```

### PetConfig_Index_PetItemID.json (0.00 MB, 5 条)

**字段** (2): `HHDHIDNHCBI, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "HHDHIDNHCBI": 251001,
  "MGNHKOHFLPO": [
    {
      "PBLDLDIEFNC": 1001
    }
  ]
}
```

### PlayerRoomSubAreaConfig.json (0.00 MB, 3 条)

**字段** (4): `ID, Icon, Name, StaticCameraID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 9725812809778181764
  },
  "Icon": "SpriteOutput/TabIcon/Train/IconExhibitio...",
  "StaticCameraID": 16002
}
```

### PlanetFesSkillTreePhase.json (0.00 MB, 5 条)

**字段** (3): `Name, Phase, UnlockIDList`

**首条记录摘要**:
```json
{
  "Phase": 1,
  "UnlockIDList": [],
  "Name": {
    "Hash": 4233933590746900872
  }
}
```

### PerformanceSkipPack.json (0.00 MB, 2 条)

**字段** (2): `PackID, PackList`

**首条记录摘要**:
```json
{
  "PackID": 803410110,
  "PackList": "<list[3]>"
}
```

### PlayerRoomSlotOffset.json (0.00 MB, 6 条)

**字段** (2): `Offset, SlotID`

**首条记录摘要**:
```json
{
  "SlotID": 1600101,
  "Offset": [
    0,
    0.65,
    0
  ]
}
```

### PetMarbleBuffState.json (0.00 MB, 2 条)

**字段** (4): `KEGANNHEKHA, MIIPHKBBMAF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 48211,
  "MIIPHKBBMAF": {
    "Hash": 15888655637038937509
  },
  "KEGANNHEKHA": {
    "Hash": 2624902007394667312
  },
  "OLOIFNNLKJP": "SpriteOutput/Quest/PetMarble/PetState/Pe..."
}
```

### PlayerReturnAssist.json (0.00 MB, 3 条)

**字段** (3): `AssistAvatarList, AssistGroupID, TeamDes`

**首条记录摘要**:
```json
{
  "AssistGroupID": 1,
  "AssistAvatarList": [
    3721403,
    3721409
  ],
  "TeamDes": {
    "Hash": 3527829076802035584
  }
}
```

### PamChatClientConst.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "PamHistory_ResponseNum_Once",
  "Value": {
    "IntValue": 3
  }
}
```

### PermanentRecordData.json (0.00 MB, 8 条)

**字段** (2): `RecordID, RefreshID`

**首条记录摘要**:
```json
{
  "RecordID": 1,
  "RefreshID": 1
}
```

### PamPlaceInfo.json (0.00 MB, 5 条)

**字段** (2): `PamActionList, PamPlaceType`

**首条记录摘要**:
```json
{
  "PamPlaceType": "Ground",
  "PamActionList": [
    "Cleaning"
  ]
}
```

### PlanetFesGameBingoSymbol.json (0.00 MB, 4 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon..."
}
```

### PlanetFesGameGachaSymbol.json (0.00 MB, 4 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon..."
}
```

### PerformanceReplayGender.json (0.00 MB, 4 条)

**字段** (3): `Gender, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "C",
  "PerformanceID": 100050103,
  "Gender": "GENDER_MAN"
}
```

### PlanetFesGameConfig.json (0.00 MB, 2 条)

**字段** (6): `GameID, LandID, ParamInt3, ParamStr1, RaiseCurveID, RewardPool`

**首条记录摘要**:
```json
{
  "GameID": "PlanetFesGameGacha",
  "LandID": 3,
  "ParamInt3": 5,
  "ParamStr1": "1:10001,2:10002,3:10003",
  "RewardPool": 1,
  "RaiseCurveID": 2
}
```

### PixAirEquipPriceConfig.json (0.00 MB, 4 条)

**字段** (4): `BuyPrice, Level, SellPrice, SlotType`

**首条记录摘要**:
```json
{
  "SlotType": "Small",
  "Level": 1,
  "BuyPrice": 2,
  "SellPrice": 1
}
```

### PlanetFesGachaCard.json (0.00 MB, 4 条)

**字段** (3): `CardThemeID, GachaID, UnlockIDList`

**首条记录摘要**:
```json
{
  "GachaID": 201,
  "CardThemeID": 201,
  "UnlockIDList": []
}
```

### PetMarbleLevel.json (0.00 MB, 2 条)

**字段** (4): `HKEACDBJCOD, JFKCEOGCOOO, OCFMCLAGNFM, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OCFMCLAGNFM": 5,
  "JFKCEOGCOOO": [
    100,
    101,
    102,
    103,
    104,
    105,
    106
  ]
}
```

### PetDiyOverride.json (0.00 MB, 3 条)

**字段** (3): `FNBGMDDOHEA, JFAGECNFHJL, OHGCLLOGKOE`

**首条记录摘要**:
```json
{
  "FNBGMDDOHEA": 42001,
  "OHGCLLOGKOE": true,
  "JFAGECNFHJL": [
    0,
    0,
    0
  ]
}
```

### PlayerReturnExtraHcoin.json (0.00 MB, 1 条)

**字段** (5): `ConfigID, ExtraHcoinNumList, ExtraHcoinUIProgressRatioList, HcoinThresholdList, OfflineDays`

**首条记录摘要**:
```json
{
  "ConfigID": 1,
  "OfflineDays": 90,
  "HcoinThresholdList": [
    100,
    300,
    700,
    1600
  ],
  "ExtraHcoinNumList": [
    100,
    200,
    400,
    900
  ],
  "ExtraHcoinUIProgressRatioList": [
    2,
    2,
    3,
    4
  ]
}
```

### PixAirNodeTypeConfig.json (0.00 MB, 3 条)

**字段** (2): `NodeName, NodeType`

**首条记录摘要**:
```json
{
  "NodeType": "Select",
  "NodeName": {
    "Hash": 8368572679024374711
  }
}
```

### PetMarbleSelf.json (0.00 MB, 1 条)

**字段** (4): `KILFKBDMJGI, OENAMINOLLF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 5078141360218671828
  },
  "OLOIFNNLKJP": "SpriteOutput/AvatarShopIcon/Avatar/1403....",
  "KILFKBDMJGI": "SpriteOutput/AvatarRoundIcon/Avatar/1403..."
}
```

### PlayerRoomConstValueCommon.json (0.00 MB, 2 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Player_Room_Card_Display_Area_ID",
  "Value": {
    "IntValue": 16
  }
}
```

### OpenURLWebViewRule.json (0.00 MB, 4 条)

**字段** (4): `Default, RuleID, Windows, iOS`

**首条记录摘要**:
```json
{
  "RuleID": 1,
  "Default": 2,
  "iOS": 1
}
```

### PreAvatarTextmapConfig.json (0.00 MB, 2 条)

**字段** (2): `PreAvatarID, PreAvatarName`

**首条记录摘要**:
```json
{
  "PreAvatarID": 1503,
  "PreAvatarName": {
    "Hash": 2879264902344106593
  }
}
```

### PlayerReturnQuestGroup.json (0.00 MB, 7 条)

**字段** (1): `GroupID`

**首条记录摘要**:
```json
{
  "GroupID": 1
}
```

### PixAirEffectConfig.json (0.00 MB, 2 条)

**字段** (3): `EffectID, ParamList, ParamMap`

**首条记录摘要**:
```json
{
  "EffectID": 1,
  "ParamList": [
    1
  ],
  "ParamMap": {}
}
```

### PSTrophy.json (0.00 MB, 1 条)

**字段** (3): `AchievementDesc, AchievementID, AchievementTitle`

**首条记录摘要**:
```json
{
  "AchievementID": 1,
  "AchievementTitle": {
    "Hash": 15314723466992857602
  },
  "AchievementDesc": {
    "Hash": 14073669898634890835
  }
}
```

### PamChatFeedback.json (0.00 MB, 2 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 8182632277076026666
  }
}
```

### PerformanceBackupLock.json (0.00 MB, 1 条)

**字段** (4): `BackupPerformanceID, BackupPerformanceType, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 103410821,
  "BackupPerformanceType": "D",
  "BackupPerformanceID": 103410820
}
```

### PlayerReturnInvite.json (0.00 MB, 1 条)

**字段** (4): `APILabel, ActivityModuleID, DisplayRewardItems, ID`

**首条记录摘要**:
```json
{
  "ID": 440,
  "ActivityModuleID": 1012601,
  "APILabel": "4.4",
  "DisplayRewardItems": {
    "1": 60
  }
}
```

### PetMarbleMap.json (0.00 MB, 1 条)

**字段** (2): `GINFOPOAKHK, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 105,
  "GINFOPOAKHK": "Config/Gameplays/LittleGame/MarbleCoopBo..."
}
```

### PlanetFesGachaAvatar.json (0.00 MB, 3 条)

**字段** (1): `GachaID`

**首条记录摘要**:
```json
{
  "GachaID": 101
}
```

### NPCDataLD.json (0.00 MB, 0 条)

### PerformanceCLD.json (0.00 MB, 0 条)

### PerformanceDLD.json (0.00 MB, 0 条)

### PerformanceDSLD.json (0.00 MB, 0 条)

### PerformanceVideoLD.json (0.00 MB, 0 条)

### PixAirLockActionConfig.json (0.00 MB, 0 条)

### PixAirTalentConfig.json (0.00 MB, 0 条)

### PlanetFesUseItem.json (0.00 MB, 0 条)

### QuestLimitConstValueCommon.json (0.00 MB, 0 条)
