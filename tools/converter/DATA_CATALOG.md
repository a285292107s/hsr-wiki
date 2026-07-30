# ExcelOutput 数据目录索引

> 本文件由 `gen_catalog.py` 自动生成，描述 `vendor/TurnBasedGameData/ExcelOutput/` 下所有 JSON 文件的结构。
> AI 可通过本索引快速定位目标数据文件，再用 `query.py` 精确查询具体记录。

**生成时间**: 2026-07-30 17:32:16
**文件总数**: 2140
**总大小**: 246.9 MB

## TextMap

| 文件 | 大小 | 条目数 |
|------|------|--------|
| TextMapCHS.json | 47.0 MB | 449,615 |
| TextMapCHT.json | 47.2 MB | 跳过 |
| TextMapDE.json | 59.2 MB | 跳过 |
| TextMapEN.json | 53.0 MB | 跳过 |
| TextMapES.json | 56.1 MB | 跳过 |
| TextMapFR.json | 60.4 MB | 跳过 |
| TextMapID.json | 55.8 MB | 跳过 |
| TextMapJP.json | 62.1 MB | 跳过 |
| TextMapKR_0.json | 36.8 MB | 跳过 |
| TextMapKR_1.json | 39.7 MB | 跳过 |
| TextMapMainCHS.json | 0.1 MB | 1,116 |
| TextMapMainCHT.json | 0.1 MB | 跳过 |
| TextMapMainDE.json | 0.1 MB | 跳过 |
| TextMapMainEN.json | 0.1 MB | 跳过 |
| TextMapMainES.json | 0.1 MB | 跳过 |
| TextMapMainFR.json | 0.1 MB | 跳过 |
| TextMapMainID.json | 0.1 MB | 跳过 |
| TextMapMainJP.json | 0.1 MB | 跳过 |
| TextMapMainKR.json | 0.1 MB | 跳过 |
| TextMapMainPT.json | 0.1 MB | 跳过 |
| TextMapMainRU.json | 0.1 MB | 跳过 |
| TextMapMainTH.json | 0.1 MB | 跳过 |
| TextMapMainVI.json | 0.1 MB | 跳过 |
| TextMapPT.json | 56.6 MB | 跳过 |
| TextMapRU_0.json | 38.6 MB | 跳过 |
| TextMapRU_1.json | 41.4 MB | 跳过 |
| TextMapTH_0.json | 53.6 MB | 跳过 |
| TextMapTH_1.json | 56.9 MB | 跳过 |
| TextMapVI.json | 66.2 MB | 跳过 |

## ExcelOutput 文件列表

按文件大小降序排列。`fields` 为首条记录的字段名（即该文件的 schema）。

### SpecialAvatarRelicMainValue.json (48.64 MB, 64,400 条)

**字段** (2): `RelicMainValueType, MainValue`

**首条记录摘要**:
```json
{
  "RelicMainValueType": 1111200,
  "MainValue": "[{\"FODBMMCKAEN\": \"HPDelta\", \"MNDFOPKBHKP..."
}
```

### TalkSentenceConfig.json (37.68 MB, 231,687 条)

**字段** (2): `TalkSentenceID, TalkSentenceText`

**首条记录摘要**:
```json
{
  "TalkSentenceID": 802410000,
  "TalkSentenceText": {
    "Hash": 8848118382525453197
  }
}
```

### StageConfig.json (24.00 MB, 28,832 条)

**字段** (17): `StageID, StageType, StageName, HardLevelGroup, Level, LevelGraphPath, StageAbilityConfig, SubLevelGraphs, StageConfigData, MonsterList, LevelLoseCondition, LevelWinCondition, ForbidAutoBattle, Release, ForbidExitBattle, MonsterWarningRatio, TrialAvatarList`

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
  "StageConfigData": "[{\"BFLIFKBEOPJ\": \"_Wave\", \"MNDFOPKBHKP\":...",
  "MonsterList": "[{\"Monster0\": 1022020, \"Monster1\": 10230...",
  "LevelLoseCondition": [],
  "LevelWinCondition": [],
  "ForbidAutoBattle": true,
  "Release": true,
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### PlaneEvent.json (10.78 MB, 76,461 条)

**字段** (3): `EventID, DropList, DisplayItemList`

**首条记录摘要**:
```json
{
  "EventID": 99999001,
  "DropList": [],
  "DisplayItemList": []
}
```

### AvatarSkillConfig.json (9.97 MB, 6,804 条)

**字段** (29): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, StanceDamageDisplay, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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

### VoiceConfig.json (7.89 MB, 85,598 条)

**字段** (4): `VoiceID, IsPlayerInvolved, VoicePath, VoiceType`

**首条记录摘要**:
```json
{
  "VoiceID": 10030,
  "IsPlayerInvolved": true,
  "VoicePath": "vo_belobog_cutscene_030",
  "VoiceType": "Cutscene"
}
```

### GridFightFrontSkill.json (6.05 MB, 4,052 条)

**字段** (26): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, SPMultipleRatio, DelayRatio, ParamList, SimpleParamList, SkillEffect`

**首条记录摘要**:
```json
{
  "SkillID": 10049901,
  "SkillName": {
    "Hash": 10757580757608256614
  },
  "SkillTag": {
    "Hash": 6578596258331267887
  },
  "SkillTypeDesc": {
    "Hash": 765041958489320547
  },
  "Level": 1,
  "MaxLevel": 1,
  "SkillTriggerKey": "SkillPC01",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1004/Skil...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 9192523533256437007
  },
  "SimpleSkillDesc": {
    "Hash": 15692000613629154604
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": "[{\"Value\": 1.5}, {\"Value\": 1}, {\"Value\":...",
  "SimpleParamList": "[{\"Value\": 1.5}, {\"Value\": 1}, {\"Value\":...",
  "SkillEffect": "Impair"
}
```

### AvatarSkillTreeConfig.json (4.04 MB, 5,196 条)

**字段** (21): `PointID, Level, AvatarID, PointType, AnchorType, MaxLevel, DefaultUnlock, PrePoint, StatusAddList, MaterialList, LevelUpSkillID, IconPath, PointName, PointDesc, SimplePointDesc, ExtraEffectIDList, SimpleExtraEffectIDList, RecommendPriority, AbilityName, PointTriggerKey, ParamList`

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

### SpecialAvatarRelic.json (4.03 MB, 11,442 条)

**字段** (3): `RelicPropertyType, RelicIDList, Comment2`

**首条记录摘要**:
```json
{
  "RelicPropertyType": 310100,
  "RelicIDList": "[{\"JENCANJIFHE\": 31011}, {\"JENCANJIFHE\":...",
  "Comment2": "过客"
}
```

### MonsterConfig.json (3.90 MB, 2,591 条)

**字段** (24): `MonsterName, MonsterIntroduction, MonsterStrategy, MonsterID, MonsterTemplateID, EliteGroup, HardLevelGroup, AttackModifyRatio, DefenceModifyRatio, HPModifyRatio, SpeedModifyRatio, StanceModifyRatio, StanceWeakList, DamageTypeResistance, DebuffResist, CustomValueTags, CustomValues, DynamicValues, SummonIDList, OverrideAIPath, OverrideAISkillSequence, AbilityNameList, SkillList, OverrideSkillParams`

**首条记录摘要**:
```json
{
  "MonsterName": {
    "Hash": 329737901974927635
  },
  "MonsterIntroduction": {
    "Hash": 9842692892110851210
  },
  "MonsterStrategy": [],
  "MonsterID": 1002011,
  "MonsterTemplateID": 1002011,
  "EliteGroup": 1,
  "HardLevelGroup": 1,
  "AttackModifyRatio": {
    "Value": 1
  },
  "DefenceModifyRatio": {
    "Value": 1
  },
  "HPModifyRatio": {
    "Value": 1
  },
  "SpeedModifyRatio": {
    "Value": 1
  },
  "StanceModifyRatio": {
    "Value": 1
  },
  "StanceWeakList": [
    "Fire",
    "Thunder"
  ],
  "DamageTypeResistance": "[{\"DamageType\": \"Physical\", \"Value\": {\"V...",
  "DebuffResist": "[{\"Key\": \"STAT_CTRL_Frozen\", \"Value\": {\"...",
  "CustomValueTags": [
    "W1_Ice"
  ],
  "CustomValues": [],
  "DynamicValues": [],
  "SummonIDList": [],
  "OverrideAIPath": "",
  "OverrideAISkillSequence": [],
  "AbilityNameList": [],
  "SkillList": [
    100201101
  ],
  "OverrideSkillParams": []
}
```

### FreeStyleMotion.json (3.44 MB, 7,548 条)

**字段** (7): `ID, FreeStyleCharacterID, StartMotion, StartMotionPath, LoopMotionPath, StartMotionRibbonPath, LoopMotionRibbonPath`

**首条记录摘要**:
```json
{
  "ID": 310010000,
  "FreeStyleCharacterID": "NPC_Avatar_Maid_Mar_7th_00",
  "StartMotion": "StandBy",
  "StartMotionPath": "Characters/Avatar/00_Common/Animation/Ma...",
  "LoopMotionPath": "",
  "StartMotionRibbonPath": "Characters/Avatar/Mar_7th/Avatar_00/Anim...",
  "LoopMotionRibbonPath": ""
}
```

### SpecialAvatar.json (3.10 MB, 4,748 条)

**字段** (25): `SpecialAvatarID, IsUseWorldLevel, PlayerID, AvatarID, Type, LockMazeSkill, LockBattleInfo, LevelAreaPrefab, AnchorName, Level, Promotion, OverrideProperty, HaveActionDelay, SkillTreeTemplate, CustomSkillTreeKey, EquipmentID, EquipmentLevel, EquipmentPromotion, EquipmentRank, RelicPropertyType, RelicMainValue, RelicSubValue, AbilityNameList, PlayerJsonPath, JsonPath`

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
  "AbilityNameList": "[\"TrialPlayer_1021213_DanHengIL_Ability\"...",
  "PlayerJsonPath": "",
  "JsonPath": "Config/ConfigCharacter/SpecialAvatar/Spe..."
}
```

### MessageItemConfig.json (2.98 MB, 13,253 条)

**字段** (6): `ID, Sender, ItemType, MainText, NextItemIDList, SectionID`

**首条记录摘要**:
```json
{
  "ID": 100000000,
  "Sender": "NPC",
  "ItemType": "Text",
  "MainText": {
    "Hash": 17189619196329181780
  },
  "NextItemIDList": [
    100000001
  ],
  "SectionID": 1000000
}
```

### SpecialAvatarRelicSubValue.json (2.94 MB, 1,674 条)

**字段** (2): `RelicSubValueType, SubValue`

**首条记录摘要**:
```json
{
  "RelicSubValueType": 1,
  "SubValue": "[{\"FODBMMCKAEN\": \"HPDelta\"}, {\"FODBMMCKA..."
}
```

### PerformanceE.json (2.52 MB, 12,267 条)

**字段** (3): `PerformanceID, PerformancePath, PerformanceCharacter`

**首条记录摘要**:
```json
{
  "PerformanceID": 100000199,
  "PerformancePath": "Config/Level/Mission/1000001/Talk/Act100...",
  "PerformanceCharacter": ""
}
```

### MonsterSkillConfig.json (2.41 MB, 3,462 条)

**字段** (17): `SkillID, SkillName, SkillTriggerKey, SkillTypeDesc, SkillTag, DamageType, AttackType, SPHitBase, DelayRatio, AI_CD, AI_ICD, IconPath, SkillDesc, PhaseList, ParamList, ModifierList, ExtraEffectIDList`

**首条记录摘要**:
```json
{
  "SkillID": 100201101,
  "SkillName": {
    "Hash": 10030733179492869324
  },
  "SkillTriggerKey": "Skill04",
  "SkillTypeDesc": {
    "Hash": 4236760374151560033
  },
  "SkillTag": {
    "Hash": 13718219806540082081
  },
  "DamageType": "Ice",
  "AttackType": "Normal",
  "SPHitBase": {
    "Value": 10
  },
  "DelayRatio": {
    "Value": 1
  },
  "AI_CD": 1,
  "AI_ICD": 1,
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "SkillDesc": {
    "Hash": 2506186724985781422
  },
  "PhaseList": [
    1
  ],
  "ParamList": [
    {
      "Value": 2
    }
  ],
  "ModifierList": [],
  "ExtraEffectIDList": []
}
```

### ItemConfig.json (1.76 MB, 2,890 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, PurposeType, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ItemMainType": "Virtual",
  "ItemSubType": "Virtual",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "PurposeType": 12,
  "ItemName": {
    "Hash": 7739077644877555281
  },
  "ItemBGDesc": {
    "Hash": 4559313086410327619
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/900001.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/900001.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemCurrency/1.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 999999999,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### SubMission.json (1.65 MB, 14,584 条)

**字段** (3): `SubMissionID, TargetText, DescrptionText`

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

### PerformanceSkipFlagE.json (1.41 MB, 12,134 条)

**字段** (2): `PerformanceID, ActorList`

**首条记录摘要**:
```json
{
  "PerformanceID": 100000199,
  "ActorList": []
}
```

### MazeBuff.json (1.35 MB, 1,947 条)

**字段** (16): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffDescBattle, BuffEffect, MazeBuffType, MazeBuffIconType`

**首条记录摘要**:
```json
{
  "ID": 1000101,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_MazeCommon_EnterBattle_...",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_MazeCommon_EnterBattle_Play...",
  "ParamList": [],
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
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
  "MazeBuffIconType": "Buff"
}
```

### StageInfiniteMonsterGroup.json (1.33 MB, 1,608 条)

**字段** (3): `InfiniteMonsterGroupID, MonsterList, EliteGroup`

**首条记录摘要**:
```json
{
  "InfiniteMonsterGroupID": 1201,
  "MonsterList": "[800101007, 800101007, 800102009, 800102...",
  "EliteGroup": 85
}
```

### VoiceAtlas.json (1.30 MB, 5,236 条)

**字段** (8): `AvatarID, VoiceID, VoiceTitle, Voice_M, AudioID, AudioEvent, Unlock, SortID`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "VoiceID": 1,
  "VoiceTitle": {
    "Hash": 2249310869761751169
  },
  "Voice_M": {
    "Hash": 7144009791015770867
  },
  "AudioID": 78001001,
  "AudioEvent": "",
  "Unlock": 70006,
  "SortID": 1
}
```

### FinishWay.json (1.21 MB, 5,567 条)

**字段** (8): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 1001711,
  "FinishType": "AvatarLevelCnt",
  "ParamType": "GreaterEqual",
  "ParamInt1": 10,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### RogueMazeBuff.json (1.19 MB, 1,825 条)

**字段** (16): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffSimpleDesc, BuffDescBattle, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 612030,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 2,
  "ModifierName": "ADV_StageAbility_612030",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_612030",
  "ParamList": [
    {
      "Value": 1
    },
    {
      "Value": 0
    }
  ],
  "BuffIcon": "SpriteOutput/Rogue/Buff/IconRogueKnight0...",
  "BuffName": {
    "Hash": 18291970299144161371
  },
  "BuffDesc": {
    "Hash": 16166204137435355247
  },
  "BuffSimpleDesc": {
    "Hash": 6555513616528233023
  },
  "BuffDescBattle": {
    "Hash": 16166204137435355247
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### QuestData.json (1.17 MB, 5,552 条)

**字段** (9): `QuestID, QuestType, QuestTitle, ImagePath, UnlockType, UnlockParamList, RewardID, FinishWayID, GotoID`

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

### PerformanceDS.json (1.16 MB, 4,733 条)

**字段** (8): `PerformanceID, PerformancePath, IsSkip, PerformanceCharacter, StartBlack, EndBlack, PlaneID, FloorID`

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

### PerformanceSkipFlagD.json (1.07 MB, 6,569 条)

**字段** (3): `PerformanceID, Skippable, ActorList`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010104,
  "Skippable": true,
  "ActorList": "[\"TalkSentenceName_Kafka\", \"TalkSentence..."
}
```

### StatusConfig.json (1.06 MB, 2,333 条)

**字段** (10): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, StatusEffect, ReadParamList, TagList`

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

### MainMission.json (1.04 MB, 2,131 条)

**字段** (16): `MainMissionID, Type, WorldID, DisplayPriority, NextMainMissionList, Name, TakeOperation, BeginOperation, TakeParam, BeginParam, NextTrackMainMission, TrackWeight, RewardID, DisplayRewardID, ChapterID, SubRewardList`

**首条记录摘要**:
```json
{
  "MainMissionID": 1000101,
  "Type": "Main",
  "WorldID": 101,
  "DisplayPriority": 1000101,
  "NextMainMissionList": [],
  "Name": {
    "Hash": 7313040413849220147
  },
  "TakeOperation": "And",
  "BeginOperation": "And",
  "TakeParam": [
    {
      "Type": "Auto"
    }
  ],
  "BeginParam": [
    {
      "Type": "Auto"
    }
  ],
  "NextTrackMainMission": 1000201,
  "TrackWeight": 100,
  "RewardID": 11000101,
  "DisplayRewardID": 11000101,
  "ChapterID": 100001,
  "SubRewardList": []
}
```

### MazeProp.json (1.01 MB, 1,760 条)

**字段** (11): `ID, PropType, PropName, PropIconPath, BoardShowList, ConfigEntityPath, DamageTypeList, MiniMapStateIcons, JsonPath, PropStateList, PerformanceType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PropType": "PROP_ORDINARY",
  "PropName": {
    "Hash": 13013349132478528449
  },
  "PropIconPath": "SpriteOutput/TalkIcon/ChatIcon.png",
  "BoardShowList": [],
  "ConfigEntityPath": "Config/ConfigEntity/Props/Common/Prop_Co...",
  "DamageTypeList": [],
  "MiniMapStateIcons": [],
  "JsonPath": "Config/Props/Common/Prop_Common_AreaIden...",
  "PropStateList": "[\"Closed\", \"Open\", \"Locked\", \"TriggerDis...",
  "PerformanceType": "D"
}
```

### RewardData.json (0.97 MB, 9,234 条)

**字段** (1): `RewardID`

**首条记录摘要**:
```json
{
  "RewardID": 100
}
```

### MonsterTemplateConfig.json (0.88 MB, 613 条)

**字段** (27): `MonsterName, MonsterStrategy, MonsterTemplateID, Rank, NPCMonsterList, IconPath, RoundIconPath, ImagePath, ManikinImagePath, JsonConfig, PrefabPath, ManikinPrefabPath, ManikinConfigPath, AttackBase, DefenceBase, HPBase, SpeedBase, StanceBase, CriticalDamageBase, StatusResistanceBase, InitialDelayRatio, StanceCount, StanceType, AIPath, AISkillSequence, NatureID, MinimumFatigueRatio`

**首条记录摘要**:
```json
{
  "MonsterName": {
    "Hash": 329737901974927635
  },
  "MonsterStrategy": [],
  "MonsterTemplateID": 1002011,
  "Rank": "MinionLv2",
  "NPCMonsterList": [],
  "IconPath": "SpriteOutput/MosterIcon/Monster_1002011....",
  "RoundIconPath": "SpriteOutput/MonsterRoundIcon/Monster_10...",
  "ImagePath": "SpriteOutput/MonsterFigure/Monster_10020...",
  "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_1...",
  "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W...",
  "PrefabPath": "Characters/CharacterPrefabs/Monster/Coco...",
  "ManikinPrefabPath": "",
  "ManikinConfigPath": "",
  "AttackBase": {
    "Value": 18
  },
  "DefenceBase": {
    "Value": 210
  },
  "HPBase": {
    "Value": 69.75
  },
  "SpeedBase": {
    "Value": 100
  },
  "StanceBase": {
    "Value": 60
  },
  "CriticalDamageBase": {
    "Value": 0.2
  },
  "StatusResistanceBase": {
    "Value": 0.2
  },
  "InitialDelayRatio": {
    "Value": 1
  },
  "StanceCount": 1,
  "StanceType": "Ice",
  "AIPath": "Config/ConfigAI/Monster_Common_SequenceT...",
  "AISkillSequence": [
    {
      "MNAHFIGOHML": 100201101
    }
  ],
  "NatureID": 1,
  "MinimumFatigueRatio": {
    "Value": 0.2
  }
}
```

### MonsterDrop.json (0.87 MB, 4,305 条)

**字段** (3): `MonsterTemplateID, AvatarExpReward, DisplayItemList`

**首条记录摘要**:
```json
{
  "MonsterTemplateID": 1002011,
  "AvatarExpReward": 36,
  "DisplayItemList": "[{\"ItemID\": 2}, {\"ItemID\": 112001}, {\"It..."
}
```

### FunNumMultiplier.json (0.75 MB, 10,000 条)

**字段** (1): `Multiplier`

**首条记录摘要**:
```json
{
  "Multiplier": {
    "Value": 1
  }
}
```

### AchievementData.json (0.68 MB, 1,869 条)

**字段** (12): `AchievementID, SeriesID, QuestID, LinearQuestID, AchievementTitle, AchievementDesc, AchievementDescPS, ParamList, Priority, Rarity, ShowType, PSTrophyID`

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

### UpgradeAvatarSubRelic.json (0.67 MB, 2,208 条)

**字段** (5): `AMAPBCEEKFP, GMNJOHLBFDA, EMLJEDBDDDM, HHBEAPOCLPC, PPBBCGALMLJ`

**首条记录摘要**:
```json
{
  "AMAPBCEEKFP": "Base",
  "GMNJOHLBFDA": "CombatPowerRelicRarity2",
  "EMLJEDBDDDM": "HEAD",
  "HHBEAPOCLPC": [],
  "PPBBCGALMLJ": 1
}
```

### CycleQuest.json (0.65 MB, 2,611 条)

**字段** (7): `CycleID, QuestList, MinLevel, MaxLevel, Cycledays, WeekDayList, ScheduleDataID`

**首条记录摘要**:
```json
{
  "CycleID": 1001801,
  "QuestList": [
    1001801
  ],
  "MinLevel": 1,
  "MaxLevel": 999,
  "Cycledays": 1,
  "WeekDayList": [
    1,
    2,
    3,
    4,
    5,
    6,
    7
  ],
  "ScheduleDataID": 21001801
}
```

### MazeFloor.json (0.63 MB, 679 条)

**字段** (17): `FloorID, FloorName, BaseFloorID, FloorTag, BGMWorldState, FloorBGMGroupName, FloorBGMNormalStateName, FloorDefaultEmotion, FloorBGMBusyStateName, EnterAudioEvent, ExitAudioEvent, FloorType, OptionalLoadBlocksConfig, MunicipalConfigPath, MapLayerNameList, CombatBGMLow, CombatBGMHigh`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "FloorName": "FloorName_10000000",
  "BaseFloorID": 10000000,
  "FloorTag": [],
  "BGMWorldState": "State_Spaceship",
  "FloorBGMGroupName": "StateGroup_Spaceship",
  "FloorBGMNormalStateName": "State_Spaceship_Default",
  "FloorDefaultEmotion": "State_Hollowing",
  "FloorBGMBusyStateName": "",
  "EnterAudioEvent": [
    "Ev_amb_city_starrail"
  ],
  "ExitAudioEvent": [],
  "FloorType": "Default",
  "OptionalLoadBlocksConfig": "Config/ConfigOptionalLoadBlocks/Train.js...",
  "MunicipalConfigPath": "",
  "MapLayerNameList": "[{\"Hash\": 5769206023853488854}, {\"Hash\":...",
  "CombatBGMLow": "State_Spacetrain_Combat",
  "CombatBGMHigh": "State_Spacetrain_Combat"
}
```

### EquipmentPromotionConfig.json (0.63 MB, 1,155 条)

**字段** (10): `EquipmentID, PromotionCostList, PlayerLevelRequire, MaxLevel, BaseHP, BaseHPAdd, BaseAttack, BaseAttackAdd, BaseDefence, BaseDefenceAdd`

**首条记录摘要**:
```json
{
  "EquipmentID": 20000,
  "PromotionCostList": "[{\"ItemID\": 2, \"ItemNum\": 3000}, {\"ItemI...",
  "PlayerLevelRequire": 15,
  "MaxLevel": 20,
  "BaseHP": {
    "Value": 38.4
  },
  "BaseHPAdd": {
    "Value": 5.76
  },
  "BaseAttack": {
    "Value": 14.4
  },
  "BaseAttackAdd": {
    "Value": 2.16
  },
  "BaseDefence": {
    "Value": 12
  },
  "BaseDefenceAdd": {
    "Value": 1.8
  }
}
```

### PerformanceSkipOverride.json (0.61 MB, 3,894 条)

**字段** (4): `PerformanceType, PerformanceID, Desc, OverrideCharacterList`

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

### ResourceDeletionVPList.json (0.60 MB, 10,255 条)

**字段** (2): `ID, Path`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Path": "CG_38_crowdA_101"
}
```

### StageTestConfig.json (0.58 MB, 824 条)

**字段** (15): `StageID, StageType, StageName, HardLevelGroup, Level, LevelGraphPath, StageAbilityConfig, SubLevelGraphs, StageConfigData, MonsterList, LevelLoseCondition, LevelWinCondition, ForbidExitBattle, MonsterWarningRatio, TrialAvatarList`

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
  "StageConfigData": "[{\"BFLIFKBEOPJ\": \"_Wave\", \"MNDFOPKBHKP\":...",
  "MonsterList": "[{\"Monster0\": 8001010, \"Monster1\": 10220...",
  "LevelLoseCondition": [],
  "LevelWinCondition": [],
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### MappingInfo.json (0.56 MB, 1,669 条)

**字段** (8): `ID, Type, FarmType, IsShowInFog, Name, Desc, ShowMonsterList, DisplayItemList`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Type": "FARM_ENTRANCE",
  "FarmType": "COCOON",
  "IsShowInFog": true,
  "Name": {
    "Hash": 7403741912309641086
  },
  "Desc": {
    "Hash": 17997180657769776512
  },
  "ShowMonsterList": [
    8001010,
    8001020
  ],
  "DisplayItemList": "[{\"ItemID\": 22, \"ItemNum\": 50}, {\"ItemID..."
}
```

### GridFightBackBESkillConfig.json (0.55 MB, 446 条)

**字段** (20): `SkillID, SkillName, SkillTag, SkillTypeDesc, SkillTriggerKey, SkillIcon, UltraSkillIcon, CutinPath, SkillDesc, SimpleSkillDesc, ShowStanceList, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect, SkillButtonEffType`

**首条记录摘要**:
```json
{
  "SkillID": 10010201,
  "SkillName": {
    "Hash": 2653531561220764323
  },
  "SkillTag": {
    "Hash": 9917237756149299580
  },
  "SkillTypeDesc": {
    "Hash": 16911956374043616971
  },
  "SkillTriggerKey": "Skill02",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "UltraSkillIcon": "",
  "CutinPath": "",
  "SkillDesc": {
    "Hash": 10372959612166531171
  },
  "SimpleSkillDesc": {
    "Hash": 10011909412818046902
  },
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": "[{\"Value\": 2}, {\"Value\": 0.81}, {\"Value\"...",
  "SimpleParamList": "[{\"Value\": 2}, {\"Value\": 0.81}, {\"Value\"...",
  "StanceDamageType": "Quantum",
  "AttackType": "BPSkill",
  "SkillEffect": "Defence",
  "SkillButtonEffType": ""
}
```

### AvatarServantSkillConfig.json (0.54 MB, 440 条)

**字段** (26): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, StanceDamageDisplay, SPBase, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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
  "ParamList": "[{\"Value\": 0.55}, {\"Value\": 0.33}, {\"Val...",
  "SimpleParamList": "[{\"Value\": 0.55}, {\"Value\": 0.33}, {\"Val...",
  "StanceDamageType": "Thunder",
  "AttackType": "Servant",
  "SkillEffect": "Blast"
}
```

### NPCData.json (0.53 MB, 1,882 条)

**字段** (4): `ID, ConfigEntityPath, JsonPath, SubType`

**首条记录摘要**:
```json
{
  "ID": 100,
  "ConfigEntityPath": "Config/ConfigEntity/NPC/Special/NPC_Spec...",
  "JsonPath": "Config/ConfigCharacter/NPC/Special/NPC_S...",
  "SubType": "Special"
}
```

### ChallengeMazeConfig.json (0.51 MB, 603 条)

**字段** (22): `ID, Name, GroupID, MapEntranceID, MapEntranceID2, PreLevel, RewardID, DamageType1, DamageType2, ChallengeTargetID, StageNum, MonsterID1, MonsterID2, ChallengeCountDown, MazeGroupID1, ConfigList1, NpcMonsterIDList1, EventIDList1, ConfigList2, NpcMonsterIDList2, EventIDList2, MazeBuffID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 7610618346915917303
  },
  "GroupID": 100,
  "MapEntranceID": 3000101,
  "MapEntranceID2": 3000101,
  "PreLevel": 1,
  "RewardID": 101001,
  "DamageType1": [
    "Physical",
    "Wind",
    "Imaginary"
  ],
  "DamageType2": [],
  "ChallengeTargetID": [
    11,
    12,
    13
  ],
  "StageNum": 1,
  "MonsterID1": [],
  "MonsterID2": [],
  "ChallengeCountDown": 20,
  "MazeGroupID1": 2,
  "ConfigList1": [
    200001
  ],
  "NpcMonsterIDList1": [
    8013010
  ],
  "EventIDList1": [
    30001011
  ],
  "ConfigList2": [
    0
  ],
  "NpcMonsterIDList2": [],
  "EventIDList2": [],
  "MazeBuffID": 3030001
}
```

### StageInfiniteWaveConfig.json (0.51 MB, 1,672 条)

**字段** (7): `InfiniteWaveID, MonsterGroupIDList, MaxMonsterCount, MaxTeammateCount, Ability, ParamList, ClearPreviousAbility`

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

### DialogueNPC.json (0.50 MB, 1,725 条)

**字段** (7): `GroupID, GroupType, InteractTitle, ConditionIDs, Priority, IconType, ActPath`

**首条记录摘要**:
```json
{
  "GroupID": 90001,
  "GroupType": "Simple",
  "InteractTitle": "NPCName_Normal_871",
  "ConditionIDs": [
    9099901
  ],
  "Priority": 1,
  "IconType": {
    "EnumIndex": 20,
    "Value": 10
  },
  "ActPath": "Config/Level/Test/Dialogue/90001.json"
}
```

### AvatarSkillConfigTrial.json (0.48 MB, 355 条)

**字段** (31): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, SPBase, StanceDamageDisplay, SPMultipleRatio, BPNeed, BPAdd, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect, SkillComboValueDelta`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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

### ItemConfigRelic.json (0.47 MB, 742 条)

**字段** (16): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList, SellType`

**首条记录摘要**:
```json
{
  "ID": 31011,
  "ItemMainType": "Relic",
  "ItemSubType": "Relic",
  "InventoryDisplayTag": 1,
  "Rarity": "NotNormal",
  "isVisible": true,
  "ItemName": {
    "Hash": 3577701605246524164
  },
  "ItemBGDesc": {
    "Hash": 26176757811863663
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/RelicIcons/IconRel...",
  "ItemFigureIconPath": "SpriteOutput/RelicFigures/IconRelic_101_...",
  "ItemCurrencyIconPath": "0",
  "ItemAvatarIconPath": "",
  "PileLimit": 9999,
  "CustomDataList": [],
  "ReturnItemIDList": [
    {
      "ItemID": 231,
      "ItemNum": 3
    }
  ],
  "SellType": "Sell"
}
```

### ItemConfigBook.json (0.46 MB, 692 条)

**字段** (18): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, PurposeType, isVisible, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, UseMethod, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 190420,
  "ItemMainType": "Usable",
  "ItemSubType": "Book",
  "InventoryDisplayTag": 1,
  "Rarity": "Normal",
  "PurposeType": 21,
  "isVisible": true,
  "ItemName": {
    "Hash": 3376216980212468034
  },
  "ItemDesc": {
    "Hash": 7567250262231580424
  },
  "ItemBGDesc": {
    "Hash": 14022552176919748575
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/190007.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/190007.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/190007.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 99999,
  "UseMethod": "AutoConversionItem",
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### ClockParkCardAction.json (0.46 MB, 738 条)

**字段** (10): `CardActionID, DiceList, EffectList, SuccessEffectList, CardDesc, ForeImgPath, ImgPath, ImgPath1, ImgPath2, ImgPath3`

**首条记录摘要**:
```json
{
  "CardActionID": 100101,
  "DiceList": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "EffectList": [
    1
  ],
  "SuccessEffectList": [],
  "CardDesc": {
    "Hash": 10973806532575788973
  },
  "ForeImgPath": "SpriteOutput/Quest/ClockPark/GamePlayPag...",
  "ImgPath": "SpriteOutput/Quest/ClockPark/GamePlayPag...",
  "ImgPath1": "SpriteOutput/Quest/ClockPark/GamePlayPag...",
  "ImgPath2": "SpriteOutput/Quest/ClockPark/GamePlayPag...",
  "ImgPath3": "SpriteOutput/Quest/ClockPark/GamePlayPag..."
}
```

### AvatarPromotionConfig.json (0.45 MB, 637 条)

**字段** (14): `AvatarID, PromotionCostList, MaxLevel, PlayerLevelRequire, AttackBase, AttackAdd, DefenceBase, DefenceAdd, HPBase, HPAdd, SpeedBase, CriticalChance, CriticalDamage, BaseAggro`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "PromotionCostList": "[{\"ItemID\": 2, \"ItemNum\": 3200}, {\"ItemI...",
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

**字段** (32): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, SPBase, StanceDamageDisplay, SPMultipleRatio, BPNeed, BPAdd, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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

### TutorialData.json (0.44 MB, 1,222 条)

**字段** (5): `TutorialID, Priority, TutorialJsonPath, TriggerParams, FinishTriggerParams`

**首条记录摘要**:
```json
{
  "TutorialID": 1001,
  "Priority": 10,
  "TutorialJsonPath": "Config/Level/Tutorial/Tutorial_1001.json",
  "TriggerParams": "[{\"TriggerType\": \"EnterBattle\", \"Trigger...",
  "FinishTriggerParams": "[{\"TriggerType\": \"FinishMainMission\", \"T..."
}
```

### PerformanceD.json (0.43 MB, 1,860 条)

**字段** (9): `PerformanceID, PerformancePath, IsSkip, ChangePlayerType, PerformanceCharacter, StartBlack, EndBlack, PlaneID, FloorID`

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

### GridFightRoleStar.json (0.41 MB, 266 条)

**字段** (20): `ID, Star, BEID, SkillOverrideSrc, SkillOverrideDest, FrontShowSkillIDList, FrontOneWordDesc, BackAbilityName, BackParamList, JsonOverrideConfig, AIPath, GeneralPropertyModifyList, ShowStanceList, FrontPowerBase, LuckChance, LuckDamage, ExtraHealBase, ExtraShieldBase, BESkillIDList, BackShowSkillIDList`

**首条记录摘要**:
```json
{
  "ID": 1004,
  "Star": 1,
  "BEID": 62304,
  "SkillOverrideSrc": [
    0,
    1100402,
    1100403
  ],
  "SkillOverrideDest": [
    10049901,
    110040201,
    110040301
  ],
  "FrontShowSkillIDList": [
    10049901,
    110040201,
    110040301
  ],
  "FrontOneWordDesc": {
    "Hash": 14017016590361980335
  },
  "BackAbilityName": "StageAbility_GridFight_Welt_00",
  "BackParamList": [],
  "JsonOverrideConfig": "Config/ConfigCharacter/GridFight/3.5/Ava...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "GeneralPropertyModifyList": "[{\"PropertyType\": \"ExtraAllDamageTypeAdd...",
  "ShowStanceList": [],
  "FrontPowerBase": {
    "Value": 200
  },
  "LuckChance": {
    "Value": 0.05
  },
  "LuckDamage": {
    "Value": 1
  },
  "ExtraHealBase": {
    "Value": 60
  },
  "ExtraShieldBase": {
    "Value": 60
  },
  "BESkillIDList": [],
  "BackShowSkillIDList": []
}
```

### TutorialGuideTalkData.json (0.40 MB, 2,619 条)

**字段** (2): `ID, AvatarHeadIcon`

**首条记录摘要**:
```json
{
  "ID": 51401,
  "AvatarHeadIcon": ""
}
```

### FateMazeBuff.json (0.39 MB, 383 条)

**字段** (16): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType, MazeBuffIconType, IsDisplayEnvInLevel`

**首条记录摘要**:
```json
{
  "ID": 3150001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_3150001",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "Activity_Fate_LancerBE_Base_Ability",
  "ParamList": "[{\"Value\": 1}, {\"Value\": 0.3}, {\"Value\":...",
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffFu...",
  "BuffName": {
    "Hash": 11087312986692773275
  },
  "BuffDesc": {
    "Hash": 13013349132478528449
  },
  "BuffEffect": "",
  "MazeBuffType": "Level",
  "MazeBuffIconType": "Buff",
  "IsDisplayEnvInLevel": true
}
```

### ItemComefrom.json (0.37 MB, 2,300 条)

**字段** (6): `ID, ComefromID, Sort, Desc, GotoID, GotoParam`

**首条记录摘要**:
```json
{
  "ID": 2,
  "ComefromID": 1,
  "Sort": 4,
  "Desc": {
    "Hash": 17095865097057274405
  },
  "GotoID": 5603,
  "GotoParam": [
    1003
  ]
}
```

### HardLevelGroup.json (0.37 MB, 741 条)

**字段** (8): `HardLevelGroup, Level, AttackRatio, DefenceRatio, HPRatio, SpeedRatio, StanceRatio, CombatPowerList`

**首条记录摘要**:
```json
{
  "HardLevelGroup": 1,
  "Level": 1,
  "AttackRatio": {
    "Value": 0.64
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 0.8
  },
  "SpeedRatio": {
    "Value": 1
  },
  "StanceRatio": {
    "Value": 1
  },
  "CombatPowerList": "[{\"Value\": 1}, {\"Value\": 0}, {\"Value\": 0..."
}
```

### EquipmentSkillConfig.json (0.36 MB, 825 条)

**字段** (7): `SkillID, SkillName, SkillDesc, Level, AbilityName, ParamList, AbilityProperty`

**首条记录摘要**:
```json
{
  "SkillID": 20000,
  "SkillName": {
    "Hash": 570935296534718368
  },
  "SkillDesc": {
    "Hash": 6055381904431186061
  },
  "Level": 1,
  "AbilityName": "Ability20000",
  "ParamList": [
    {
      "Value": 0.12
    },
    {
      "Value": 3
    }
  ],
  "AbilityProperty": []
}
```

### StoryCharacter.json (0.35 MB, 1,580 条)

**字段** (4): `StoryCharacterID, SubType, ConfigEntityPath, JsonPath`

**首条记录摘要**:
```json
{
  "StoryCharacterID": "NPC_Avatar_Boy_Arlan_00",
  "SubType": "Avatar",
  "ConfigEntityPath": "Config/ConfigEntity/NPC/Avatar/NPC_Avata...",
  "JsonPath": "Config/ConfigCharacter/NPC/Avatar/NPC_Av..."
}
```

### IdleLiveChatContent.json (0.35 MB, 4,209 条)

**字段** (2): `ID, Content`

**首条记录摘要**:
```json
{
  "ID": 8011101,
  "Content": {
    "Hash": 516133481596018267
  }
}
```

### EliteGroup.json (0.34 MB, 1,394 条)

**字段** (6): `EliteGroup, AttackRatio, DefenceRatio, HPRatio, SpeedRatio, StanceRatio`

**首条记录摘要**:
```json
{
  "EliteGroup": 1,
  "AttackRatio": {
    "Value": 1
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  },
  "SpeedRatio": {
    "Value": 1
  },
  "StanceRatio": {
    "Value": 1
  }
}
```

### AvatarStatusConfig.json (0.34 MB, 736 条)

**字段** (11): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, StatusEffect, CanDispel, ReadParamList, TagList`

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

### EvoBdSCMazeBuff.json (0.34 MB, 315 条)

**字段** (17): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffSimpleDesc, BuffDescBattle, BuffEffect, MazeBuffType, MazeBuffIconType`

**首条记录摘要**:
```json
{
  "ID": 3113001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 8,
  "ModifierName": "ADV_StageAbility_MazeCommon_Empty",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_VS_Weapon_S2_001",
  "ParamList": "[{\"Value\": 0}, {\"Value\": 100}, {\"Value\":...",
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "BuffName": {
    "Hash": 17262933300562868619
  },
  "BuffDesc": {
    "Hash": 4750842360883654352
  },
  "BuffSimpleDesc": {
    "Hash": 6848412204963582056
  },
  "BuffDescBattle": {
    "Hash": 4750842360883654352
  },
  "BuffEffect": "",
  "MazeBuffType": "Level",
  "MazeBuffIconType": "Other"
}
```

### RogueDialogueOptionDisplay.json (0.34 MB, 2,260 条)

**字段** (3): `OptionDisplayID, OptionTitle, OptionDesc`

**首条记录摘要**:
```json
{
  "OptionDisplayID": 10001,
  "OptionTitle": {
    "Hash": 8663764787473980736
  },
  "OptionDesc": {
    "Hash": 13686242179302134078
  }
}
```

### MazeChest.json (0.33 MB, 1,998 条)

**字段** (3): `ID, WorldID, ChestType`

**首条记录摘要**:
```json
{
  "ID": 10101601,
  "WorldID": 201,
  "ChestType": "[\"CHEST_WORLD_ONE\", \"CHEST_TREASURE_NORM..."
}
```

### ActivityHipplenEffect.json (0.32 MB, 2,781 条)

**字段** (4): `PHFMCACHFIJ, GMPGDEINODK, EJHODPJIFIN, AAIAEKDKMMK`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 30101111,
  "GMPGDEINODK": "StatChange",
  "EJHODPJIFIN": "1,0",
  "AAIAEKDKMMK": []
}
```

### ShopGoodsConfig.json (0.31 MB, 847 条)

**字段** (12): `GoodsID, ItemID, ItemCount, CurrencyList, CurrencyCostList, GoodsSortID, LimitValue1List, LimitValue2List, OnShelfValue1List, OnShelfValue2List, ShopID, ScheduleDataID`

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

### LinearQuest.json (0.31 MB, 2,888 条)

**字段** (4): `LinearID, QuestList, MinLevel, MaxLevel`

**首条记录摘要**:
```json
{
  "LinearID": 1001711,
  "QuestList": [
    1001711
  ],
  "MinLevel": 1,
  "MaxLevel": 999
}
```

### TutorialGuideGroup.json (0.31 MB, 855 条)

**字段** (10): `GroupID, TutorialGuideIDList, TutorialType, CanReview, TutorialShowType, Order, TriggerParams, FinishTriggerParams, MessageText, RewardID`

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
  "TriggerParams": "[{\"TriggerType\": \"EnterBattle\", \"Trigger...",
  "FinishTriggerParams": "[{\"TriggerType\": \"FinishMainMission\", \"T...",
  "MessageText": {
    "Hash": 560005623724621359
  },
  "RewardID": 201
}
```

### MonsterStatusConfig.json (0.31 MB, 668 条)

**字段** (11): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, StatusEffect, CanDispel, ReadParamList, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 210010101,
  "ModifierName": "Monster_W1_Soldier01_00_DefenceRatioDown",
  "StatusName": {
    "Hash": 3065829081083807034
  },
  "StatusType": "Debuff",
  "StatusDesc": {
    "Hash": 375598738860759584
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconDeBuff...",
  "StatusIconPathHighSize": "",
  "StatusEffect": {
    "Hash": 6624709895125874672
  },
  "CanDispel": true,
  "ReadParamList": [
    "MDF_PropertyValue"
  ],
  "TagList": []
}
```

### BattleEventConfig.json (0.30 MB, 459 条)

**字段** (13): `BattleEventID, Team, EventSubType, BattleEventName, HeadIcon, AbilityList, OverrideProperty, Speed, HardLevel, ActionBarDescrptionText, DescrptionText, ParamList, AssetPackName`

**首条记录摘要**:
```json
{
  "BattleEventID": 1,
  "Team": "TeamNeutral",
  "EventSubType": "ChallengerEvent",
  "BattleEventName": "BattleEventName_1",
  "HeadIcon": "SpriteOutput/AvatarIconTeam/999.png",
  "AbilityList": "[\"BattleEventAbility_TargetAttack\", \"Bat...",
  "OverrideProperty": "[{\"PropertyType\": \"BaseAttack\", \"Value\":...",
  "Speed": {
    "Value": 100
  },
  "HardLevel": true,
  "ActionBarDescrptionText": {
    "Hash": 17658199342156365329
  },
  "DescrptionText": "BattleEventDesc_1",
  "ParamList": [],
  "AssetPackName": ""
}
```

### GridFightRankAttachment.json (0.30 MB, 1,596 条)

**字段** (4): `RoleID, Rank, Star, GeneralPropertyModifyList`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "Rank": 1,
  "Star": 1,
  "GeneralPropertyModifyList": "[{\"PropertyType\": \"ExtraAllDamageTypeAdd..."
}
```

### AvatarRankConfig.json (0.29 MB, 606 条)

**字段** (11): `RankID, Rank, Trigger, Name, Desc, ExtraEffectIDList, IconPath, SkillAddLevelList, RankAbility, UnlockCost, Param`

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

### GridFightAugment.json (0.28 MB, 334 条)

**字段** (16): `ID, CategoryID, Quality, HexName, HexDesc, DescParamList, IconPath, AugmentSearchKey, MiniIconPath, ChapterLimitList, IsOCEffective, JsonPath, EffectParamList, AugmentSavedValueList, AugmentGameRefTrait, AugmentGameRefScore`

**首条记录摘要**:
```json
{
  "ID": 100101,
  "CategoryID": 1,
  "Quality": "Silver",
  "HexName": {
    "Hash": 1806895644678960298
  },
  "HexDesc": {
    "Hash": 10523607790638753906
  },
  "DescParamList": [
    {
      "Value": 7
    }
  ],
  "IconPath": "SpriteOutput/GridFight/AugmentBig/100101...",
  "AugmentSearchKey": "Augment_100101",
  "MiniIconPath": "SpriteOutput/GridFight/Augment/100101.pn...",
  "ChapterLimitList": [
    1
  ],
  "IsOCEffective": 1,
  "JsonPath": "Config/Level/GridFight/Augment/GridFight...",
  "EffectParamList": [
    {
      "Value": 7
    }
  ],
  "AugmentSavedValueList": [
    "Augment100101_SavedValue01"
  ],
  "AugmentGameRefTrait": [],
  "AugmentGameRefScore": []
}
```

### EvolveBuildMazeBuff.json (0.28 MB, 248 条)

**字段** (16): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffSimpleDesc, BuffDescBattle, BuffEffect, MazeBuffType, MazeBuffIconType`

**首条记录摘要**:
```json
{
  "ID": 3106001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 8,
  "ModifierName": "ADV_StageAbility_MazeCommon_Empty",
  "InBattleBindingKey": "StageAbility_VS_Weapon_001",
  "ParamList": "[{\"Value\": 0}, {\"Value\": 1}, {\"Value\": 1...",
  "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "BuffName": {
    "Hash": 10759209296645104090
  },
  "BuffDesc": {
    "Hash": 17259666158573416793
  },
  "BuffSimpleDesc": {
    "Hash": 9091020683810657067
  },
  "BuffDescBattle": {
    "Hash": 17259666158573416793
  },
  "BuffEffect": "",
  "MazeBuffType": "Level",
  "MazeBuffIconType": "Other"
}
```

### LocalbookConfig.json (0.27 MB, 1,051 条)

**字段** (7): `BookID, BookSeriesID, BookSeriesInsideID, BookInsideName, BookContent, BookDisplayType, LocalBookImagePath`

**首条记录摘要**:
```json
{
  "BookID": 190101,
  "BookSeriesID": 1,
  "BookSeriesInsideID": 1,
  "BookInsideName": {
    "Hash": 2534899127637171729
  },
  "BookContent": {
    "Hash": 12541941129514264389
  },
  "BookDisplayType": 1,
  "LocalBookImagePath": []
}
```

### GridFightEnemyDifficultyLv.json (0.26 MB, 903 条)

**字段** (6): `ChapterID, AttackRatio, DefenceRatio, HPRatio, SpeedRatio, StanceRatio`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "AttackRatio": {
    "Value": 1
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  },
  "SpeedRatio": {
    "Value": 1
  },
  "StanceRatio": {
    "Value": 1
  }
}
```

### GridFightBackSkillExtraDesc.json (0.25 MB, 450 条)

**字段** (7): `SkillID, ConditionDesc, ParamList, ConditionSimpleDesc, SimpleParamList, ExtraEffectIDList, SimpleExtraEffectIDList`

**首条记录摘要**:
```json
{
  "SkillID": 10010201,
  "ConditionDesc": {
    "Hash": 11085778083433463291
  },
  "ParamList": "[{\"Value\": 2}, {\"Value\": 0.81}, {\"Value\"...",
  "ConditionSimpleDesc": {
    "Hash": 10307392774845083218
  },
  "SimpleParamList": "[{\"Value\": 2}, {\"Value\": 0.81}, {\"Value\"...",
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": []
}
```

### RogueMagicMazeBuff.json (0.24 MB, 387 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 682010,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 3,
  "ModifierName": "ADV_StageAbility_682010",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "RogueMagic_PassiveScepter_682010",
  "ParamList": [
    {
      "Value": 50
    },
    {
      "Value": 120
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 16356235835466006092
  },
  "BuffDesc": {
    "Hash": 9765760878995806737
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### RaidConfig.json (0.23 MB, 316 条)

**字段** (26): `RaidID, RaidTagList, UnlockWorldLevel, Type, MonsterList, MonsterHideList, DisplayEventID, RaidName, RaidDesc, FinishEntranceID, BuffParamList, TeamLimitIDList, LimitIDList, RecoverType, RewardList, TeamType, TrialAvatarList, MainMissionIDList, MainMissionIDBefore, MainMissionIDAfter, IsEntryByProp, SkipRewardOnFinish, EntrancePageBGImagePath, DamageType, RaidTargetID, DifficultyAdjustmentType`

**首条记录摘要**:
```json
{
  "RaidID": 1,
  "RaidTagList": [],
  "UnlockWorldLevel": [],
  "Type": "Mission",
  "MonsterList": [
    8003040,
    1022010
  ],
  "MonsterHideList": [
    1005010
  ],
  "DisplayEventID": 20133003,
  "RaidName": {
    "Hash": 11573801932731014253
  },
  "RaidDesc": {
    "Hash": 15984731500279404580
  },
  "FinishEntranceID": 2013402,
  "BuffParamList": [],
  "TeamLimitIDList": [
    1,
    2
  ],
  "LimitIDList": [],
  "RecoverType": [
    "Unknown"
  ],
  "RewardList": [],
  "TeamType": "Player",
  "TrialAvatarList": [],
  "MainMissionIDList": [
    1011401,
    1011402
  ],
  "MainMissionIDBefore": 1011400,
  "MainMissionIDAfter": 1011403,
  "IsEntryByProp": true,
  "SkipRewardOnFinish": true,
  "EntrancePageBGImagePath": "",
  "DamageType": [
    "Fire",
    "Thunder",
    "Quantum"
  ],
  "RaidTargetID": [],
  "DifficultyAdjustmentType": 1
}
```

### TutorialGuideData.json (0.23 MB, 1,530 条)

**字段** (3): `ID, ImagePath, DescText`

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

### CocoonConfig.json (0.22 MB, 420 条)

**字段** (13): `ID, PropID, CocoonType, MappingInfoID, StageID, StageIDList, ParamList, DropList, StaminaCost, MaxChallengeCnt, OpenDate, DamageType, FarmType`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "PropID": 808,
  "CocoonType": "TYPE_NORMAL",
  "MappingInfoID": 1001,
  "StageID": 1022010,
  "StageIDList": [
    1022010,
    1022020,
    1022030
  ],
  "ParamList": [],
  "DropList": "[1000849, 1000339, 1001002, 1001022, 730...",
  "StaminaCost": 10,
  "MaxChallengeCnt": 24,
  "OpenDate": [],
  "DamageType": [
    "Physical",
    "Ice",
    "Fire",
    "Wind"
  ],
  "FarmType": "COCOON_AVATAR_EXP"
}
```

### AvatarConfig.json (0.22 MB, 91 条)

**字段** (40): `AvatarID, AvatarName, AvatarFullName, AdventurePlayerID, AvatarVOTag, Rarity, JsonPath, DamageType, SPNeed, ExpGroup, MaxPromotion, MaxRank, RankIDList, SkillList, AvatarBaseType, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, AvatarSideIconPath, AvatarMiniIconPath, AvatarGachaResultImgPath, ActionAvatarHeadIconPath, UltraSkillCutInPrefabPath, UIAvatarModelPath, ManikinJsonPath, AIPath, SkilltreePrefabPath, DamageTypeResistance, Release, SideAvatarHeadIconPath, WaitingAvatarHeadIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarTrialOffset, PlayerCardOffset, AssistOffset, AssistBgOffset, AvatarSelfShowOffset`

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
  "RankIDList": "[100101, 100102, 100103, 100104, 100105,...",
  "SkillList": "[100101, 100102, 100103, 100104, 100106,...",
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
  "AvatarDropOffset": "[31, 29, 0.59, 31, 29, 0.59, 31, 29, 0.5...",
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

### MonopolyEventOption.json (0.20 MB, 608 条)

**字段** (5): `EventOptionID, OptionType, EffectIDList, EffectContentText, NextOptionList`

**首条记录摘要**:
```json
{
  "EventOptionID": 10001,
  "OptionType": "Common",
  "EffectIDList": [],
  "EffectContentText": "",
  "NextOptionList": []
}
```

### RogueTournBuff.json (0.20 MB, 900 条)

**字段** (8): `MazeBuffID, MazeBuffLevel, RogueBuffType, RogueBuffCategory, RogueBuffTag, ExtraEffectIDList, IsInHandbook, UnlockDisplay`

**首条记录摘要**:
```json
{
  "MazeBuffID": 615030,
  "MazeBuffLevel": 1,
  "RogueBuffType": 120,
  "RogueBuffCategory": "Legendary",
  "RogueBuffTag": 1503001,
  "ExtraEffectIDList": [
    60000001
  ],
  "IsInHandbook": true,
  "UnlockDisplay": 805
}
```

### BattleEventSkillConfig.json (0.20 MB, 218 条)

**字段** (17): `SkillID, SkillName, SkillTag, SkillTypeDesc, SkillTriggerKey, SkillIcon, UltraSkillIcon, CutinPath, ShowStanceList, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, AttackType, SkillEffect, SkillButtonEffType`

**首条记录摘要**:
```json
{
  "SkillID": 2001801,
  "SkillName": {
    "Hash": 9406363350117198765
  },
  "SkillTag": {
    "Hash": 12601813654230214900
  },
  "SkillTypeDesc": {
    "Hash": 4243237131156021087
  },
  "SkillTriggerKey": "Skill03",
  "SkillIcon": "SpriteOutput/SkillIcons/BattleEvent/Skil...",
  "UltraSkillIcon": "SpriteOutput/SkillIcons/BattleEvent/Skil...",
  "CutinPath": "",
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
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
  "AttackType": "Ultra",
  "SkillEffect": "Support",
  "SkillButtonEffType": ""
}
```

### ActivityPanel.json (0.19 MB, 255 条)

**字段** (12): `PanelID, UIPrefab, UnlockConditions, SortWeight, TabName, TitleName, ActivityTagList, TabIcon, TagDesc, IntroDesc, DisplayItemList, FinishConditions`

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

### MenuItemName.json (0.19 MB, 2,357 条)

**字段** (2): `ID, TextID`

**首条记录摘要**:
```json
{
  "ID": 90001,
  "TextID": {
    "Hash": 17148349206267042326
  }
}
```

### ItemComposeConfig.json (0.19 MB, 339 条)

**字段** (16): `ID, FormulaType, RelicList, SpecialMaterialCost, ItemID, MaterialCost, Type, Order, WorldLevelRequire, MaxCount, IsShowHoldNumber, ItemComposeTag, LimitType, LimitTypeParam, LimitValue, FuncType`

**首条记录摘要**:
```json
{
  "ID": 101,
  "FormulaType": "Normal",
  "RelicList": [],
  "SpecialMaterialCost": [],
  "ItemID": 236,
  "MaterialCost": [
    {
      "ItemID": 235,
      "ItemNum": 800
    }
  ],
  "Type": 12,
  "Order": 2,
  "WorldLevelRequire": 3,
  "MaxCount": 9999,
  "IsShowHoldNumber": true,
  "ItemComposeTag": [
    14
  ],
  "LimitType": "Monthly",
  "LimitTypeParam": [],
  "LimitValue": 2,
  "FuncType": "Compose"
}
```

### RogueMonster.json (0.19 MB, 1,979 条)

**字段** (3): `RogueMonsterID, NpcMonsterID, EventID`

**首条记录摘要**:
```json
{
  "RogueMonsterID": 9001,
  "NpcMonsterID": 1003010,
  "EventID": 89999001
}
```

### AvatarSkillTreeConfigTrial.json (0.19 MB, 250 条)

**字段** (20): `PointID, Level, AvatarID, PointType, AnchorType, MaxLevel, DefaultUnlock, PrePoint, StatusAddList, MaterialList, LevelUpSkillID, IconPath, PointName, PointDesc, SimplePointDesc, ExtraEffectIDList, SimpleExtraEffectIDList, AbilityName, PointTriggerKey, ParamList`

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

### MapEntrance.json (0.19 MB, 896 条)

**字段** (7): `ID, EntranceType, PlaneID, FloorID, BeginMainMissionList, FinishMainMissionList, FinishSubMissionList`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "EntranceType": "Town",
  "PlaneID": 10000,
  "FloorID": 10000000,
  "BeginMainMissionList": [],
  "FinishMainMissionList": [
    1000501
  ],
  "FinishSubMissionList": [
    100050102
  ]
}
```

### LoadingDesc.json (0.19 MB, 403 条)

**字段** (14): `ID, MinLevel, MaxLevel, Group, LockParam, LockParamForOr, UnlockParam, UnlockParamForOr, ForceParam, ForceParamForOr, Weight, TitleTextmapID, DescTextmapID, ImageID`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "MinLevel": 1,
  "MaxLevel": 80,
  "Group": "NormalIP",
  "LockParam": [],
  "LockParamForOr": [],
  "UnlockParam": [],
  "UnlockParamForOr": [],
  "ForceParam": [],
  "ForceParamForOr": [],
  "Weight": 20,
  "TitleTextmapID": {
    "Hash": 3542554784376528797
  },
  "DescTextmapID": {
    "Hash": 4472936415286069643
  },
  "ImageID": 10008
}
```

### RogueMiracleEffect.json (0.18 MB, 1,014 条)

**字段** (3): `MiracleEffectID, MiracleDesc, ParamList`

**首条记录摘要**:
```json
{
  "MiracleEffectID": 1,
  "MiracleDesc": {
    "Hash": 8768956841205858049
  },
  "ParamList": "[{\"Value\": 1}, {\"Value\": 1}, {\"Value\": 2..."
}
```

### RelicConfig.json (0.18 MB, 742 条)

**字段** (11): `ID, SetID, Type, Rarity, MainAffixGroup, SubAffixGroup, MaxLevel, ExpType, ExpProvide, CoinCost, Mode`

**首条记录摘要**:
```json
{
  "ID": 31011,
  "SetID": 101,
  "Type": "HEAD",
  "Rarity": "CombatPowerRelicRarity2",
  "MainAffixGroup": 21,
  "SubAffixGroup": 2,
  "MaxLevel": 6,
  "ExpType": 1,
  "ExpProvide": 300,
  "CoinCost": 450,
  "Mode": "BASIC"
}
```

### UIRedDot.json (0.18 MB, 1,199 条)

**字段** (5): `RedDot, RedDotID, RedDotChildren, Type, Weight`

**首条记录摘要**:
```json
{
  "RedDot": "ItemIcon",
  "RedDotID": 1,
  "RedDotChildren": [],
  "Type": 3,
  "Weight": []
}
```

### HeliobusComment.json (0.18 MB, 909 条)

**字段** (5): `HeliobusCommentID, HeliobusUserID, IsPlayerComment, HeliobusCommentTextID, PlayerCommentIDList`

**首条记录摘要**:
```json
{
  "HeliobusCommentID": 10100,
  "HeliobusUserID": 1,
  "IsPlayerComment": true,
  "HeliobusCommentTextID": {
    "Hash": 3465349314410659807
  },
  "PlayerCommentIDList": []
}
```

### RogueUpgradeAvatarSubRelic.json (0.18 MB, 552 条)

**字段** (5): `SubRelicType, RelicRarity, RelicType, RelicSubValueList, RelicSubValueStepTime`

**首条记录摘要**:
```json
{
  "SubRelicType": "Base",
  "RelicRarity": "CombatPowerRelicRarity2",
  "RelicType": "HEAD",
  "RelicSubValueList": [],
  "RelicSubValueStepTime": 1
}
```

### PlanetFesAvatarLevel.json (0.18 MB, 1,000 条)

**字段** (4): `Level, IncomeNum, CostNum, GrantItemList`

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

### LimaoNewsComment.json (0.17 MB, 1,302 条)

**字段** (3): `HFFBGDNDBHC, JAKLCIIEDON, DNJCIDFBHPC`

**首条记录摘要**:
```json
{
  "HFFBGDNDBHC": 101001,
  "JAKLCIIEDON": 1033,
  "DNJCIDFBHPC": {
    "Hash": 5224510114687973413
  }
}
```

### GridFightServantSkill.json (0.17 MB, 132 条)

**字段** (25): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, StanceDamageDisplay, SPBase, SPMultipleRatio, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect`

**首条记录摘要**:
```json
{
  "SkillID": 180070101,
  "SkillName": {
    "Hash": 2291692387484833446
  },
  "SkillTag": {
    "Hash": 9868503137584243444
  },
  "SkillTypeDesc": {
    "Hash": 14537074486625075419
  },
  "Level": 1,
  "MaxLevel": 15,
  "SkillTriggerKey": "Skill01",
  "SkillIcon": "SpriteOutput/SkillIcons/Avatar/8007/Skil...",
  "UltraSkillIcon": "",
  "SkillDesc": {
    "Hash": 17575637945906726281
  },
  "SimpleSkillDesc": {
    "Hash": 1338207594678719627
  },
  "RatedSkillTreeID": [
    8007102,
    8007103,
    8008102,
    8008103
  ],
  "RatedRankID": [
    800701,
    800801
  ],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "[{\"Value\": 15}, {\"Value\": 30}, {\"Value\":...",
  "StanceDamageDisplay": 15,
  "SPBase": {
    "Value": 10
  },
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": "[{\"Value\": 3}, {\"Value\": 4}, {\"Value\": 4...",
  "SimpleParamList": "[{\"Value\": 3}, {\"Value\": 4}, {\"Value\": 4...",
  "StanceDamageType": "Ice",
  "AttackType": "Servant",
  "SkillEffect": "AoEAttack"
}
```

### BookSeriesConfig.json (0.17 MB, 761 条)

**字段** (6): `BookSeriesID, BookSeries, BookSeriesComments, BookSeriesNum, BookSeriesWorld, IsShowInBookshelf`

**首条记录摘要**:
```json
{
  "BookSeriesID": 1,
  "BookSeries": {
    "Hash": 458864378374624357
  },
  "BookSeriesComments": {
    "Hash": 12740325635257467646
  },
  "BookSeriesNum": 1,
  "BookSeriesWorld": 2,
  "IsShowInBookshelf": true
}
```

### GachaBasicInfo.json (0.17 MB, 278 条)

**字段** (12): `GachaID, GachaType, SortID, StartTime, EndTime, PrefabPath, PoolName, PoolDesc, PoolDescFTC, PoolLabelIcon, PoolLabelIconSelected, TypeTitle`

**首条记录摘要**:
```json
{
  "GachaID": 1001,
  "GachaType": "Normal",
  "SortID": 99,
  "StartTime": "",
  "EndTime": "",
  "PrefabPath": "UI/Drawcard/GachaPanel/StandardGacha_100...",
  "PoolName": {
    "Hash": 12642828881931173103
  },
  "PoolDesc": {
    "Hash": 1121704090967857799
  },
  "PoolDescFTC": {
    "Hash": 6970163302865048869
  },
  "PoolLabelIcon": "SpriteOutput/DrawCardPic/GachaTabIcon/Ta...",
  "PoolLabelIconSelected": "SpriteOutput/DrawCardPic/GachaTabIcon/Ta...",
  "TypeTitle": {
    "Hash": 10012362747660649297
  }
}
```

### RogueBuff.json (0.17 MB, 484 条)

**字段** (10): `MazeBuffID, MazeBuffLevel, RogueBuffType, RogueBuffCategory, RogueBuffTag, ExtraEffectIDList, RogueVersion, UnlockIDList, HandbookUnlockDesc, AeonCrossIcon`

**首条记录摘要**:
```json
{
  "MazeBuffID": 600000,
  "MazeBuffLevel": 1,
  "RogueBuffType": 100,
  "RogueBuffCategory": "Common",
  "RogueBuffTag": 1000001,
  "ExtraEffectIDList": [],
  "RogueVersion": 1,
  "UnlockIDList": [],
  "HandbookUnlockDesc": {
    "Hash": 11342503824064533286
  },
  "AeonCrossIcon": ""
}
```

### RogueMiracleEffectDisplay.json (0.16 MB, 769 条)

**字段** (4): `MiracleEffectDisplayID, MiracleDesc, DescParamList, ExtraEffect`

**首条记录摘要**:
```json
{
  "MiracleEffectDisplayID": 1,
  "MiracleDesc": {
    "Hash": 1851219478774962691
  },
  "DescParamList": "[{\"Value\": 1}, {\"Value\": 1}, {\"Value\": 2...",
  "ExtraEffect": []
}
```

### PhotoGraphEmotionConfig.json (0.16 MB, 486 条)

**字段** (6): `EmotionName, EmotionIconPath, EmotionClipPath, BrowClipName, EyeClipName, MouthClipName`

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

### ItemConfigDisk.json (0.16 MB, 255 条)

**字段** (17): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, PurposeType, isVisible, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 210001,
  "ItemMainType": "Usable",
  "ItemSubType": "MusicAlbum",
  "InventoryDisplayTag": 3,
  "Rarity": "Rare",
  "PurposeType": 20,
  "isVisible": true,
  "ItemName": {
    "Hash": 5923940271264800189
  },
  "ItemDesc": {
    "Hash": 12542057290048714977
  },
  "ItemBGDesc": {
    "Hash": 11971749779350493101
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/210001.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/210001.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/210001.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 999,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### PerformanceC.json (0.16 MB, 724 条)

**字段** (7): `PerformanceID, PerformancePath, IsSkip, StartBlack, EndBlack, PlaneID, FloorID`

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

### AvatarSkillTreeConfigLD.json (0.16 MB, 200 条)

**字段** (21): `PointID, Level, AvatarID, PointType, AnchorType, MaxLevel, DefaultUnlock, PrePoint, StatusAddList, MaterialList, LevelUpSkillID, IconPath, PointName, PointDesc, SimplePointDesc, ExtraEffectIDList, SimpleExtraEffectIDList, RecommendPriority, AbilityName, PointTriggerKey, ParamList`

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

### GridFightBackRoleRank.json (0.15 MB, 252 条)

**字段** (13): `RankID, Rank, Name, Desc, IconPath, Trigger, OwnerGeneralPropertyList, AllMemberGeneralPropertyList, ModifySkillList, RankAbility, Param, DescParamList, ExtraEffectIDList`

**首条记录摘要**:
```json
{
  "RankID": 100101,
  "Rank": 1,
  "Name": {
    "Hash": 6337308428856077169
  },
  "Desc": {
    "Hash": 1528372340106895187
  },
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "Trigger": {
    "Hash": 2089636447
  },
  "OwnerGeneralPropertyList": "[{\"PropertyType\": \"SpeedAddedRatio\", \"Va...",
  "AllMemberGeneralPropertyList": [],
  "ModifySkillList": [],
  "RankAbility": [],
  "Param": [],
  "DescParamList": [
    0.15
  ],
  "ExtraEffectIDList": []
}
```

### RogueRoom.json (0.15 MB, 704 条)

**字段** (6): `RogueRoomID, RogueRoomType, MapEntrance, GroupID, GroupWithContent, RogueRoomSections`

**首条记录摘要**:
```json
{
  "RogueRoomID": 100,
  "RogueRoomType": 1,
  "MapEntrance": 8000101,
  "GroupID": 10,
  "GroupWithContent": "{\"10\": 1006, \"3\": 1001, \"4\": 1002, \"5\": ...",
  "RogueRoomSections": [
    0
  ]
}
```

### RogueTournRoom.json (0.15 MB, 1,338 条)

**字段** (3): `RogueRoomID, TournMode, RogueRoomType`

**首条记录摘要**:
```json
{
  "RogueRoomID": 11098080,
  "TournMode": "Tourn1",
  "RogueRoomType": "Adventure"
}
```

### ClockParkCard.json (0.14 MB, 348 条)

**字段** (9): `CardID, CardType, CardConflictTagList, CardDiceNum, CardActionList, Priority, CardDesc, ForeImgPath, ImgPath`

**首条记录摘要**:
```json
{
  "CardID": 1001,
  "CardType": "AttributeChange",
  "CardConflictTagList": [],
  "CardDiceNum": 1,
  "CardActionList": [
    100101
  ],
  "Priority": 1,
  "CardDesc": {
    "Hash": 2263067653856074052
  },
  "ForeImgPath": "SpriteOutput/Quest/ClockPark/GamePlayPag...",
  "ImgPath": "SpriteOutput/Quest/ClockPark/GamePlayPag..."
}
```

### PerformanceRecallData.json (0.14 MB, 282 条)

**字段** (12): `ID, Name, CategoryID, ImgPath, ImgPath_F, ImgHeightSize, UnlockCondition, PerformanceID, isVideo, ImgPathWall, ImgPathWall_F, WorldID`

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
  "UnlockCondition": "[{\"Type\": \"FinishMainMission\", \"Param\": ...",
  "PerformanceID": 100010100,
  "isVideo": true,
  "ImgPathWall": "",
  "ImgPathWall_F": "",
  "WorldID": 101
}
```

### MazePuzzleOrigami.json (0.14 MB, 590 条)

**字段** (9): `FloorID, GroupID, ColonyID, MainPropID, MainPropStateList, SubPropID, NpcGroupID, NpcInstanceID, CreateNpcPropState`

**首条记录摘要**:
```json
{
  "FloorID": 20311001,
  "GroupID": 168,
  "ColonyID": 1,
  "MainPropID": 300001,
  "MainPropStateList": [
    "EventClose"
  ],
  "SubPropID": 300002,
  "NpcGroupID": 159,
  "NpcInstanceID": 400002,
  "CreateNpcPropState": "EventOpen"
}
```

### ChimeraDuelSkill.json (0.14 MB, 320 条)

**字段** (11): `SkillID, Type, TriggerEventList, AdditionalTriggerConditionList, AbilityJsonPath, Priority, Description, ParamList, HasDisplay, IsImmediate, PlainDescription`

**首条记录摘要**:
```json
{
  "SkillID": 10101,
  "Type": "Battle",
  "TriggerEventList": [
    4009
  ],
  "AdditionalTriggerConditionList": [],
  "AbilityJsonPath": "Config/Gameplays/ChimeraDuel/Ability/Chi...",
  "Priority": 20,
  "Description": {
    "Hash": 16888295970870805826
  },
  "ParamList": [
    1
  ],
  "HasDisplay": true,
  "IsImmediate": true,
  "PlainDescription": {
    "Hash": 4574099781298373345
  }
}
```

### GridFightTraitLayerOld.json (0.14 MB, 378 条)

**字段** (7): `ExistSeason, TraitID, Layer, MazebuffID, PropertyBindType, TraitMemberPropertyList, AllMemberPropertyList`

**首条记录摘要**:
```json
{
  "ExistSeason": 101,
  "TraitID": 1001,
  "Layer": 2,
  "MazebuffID": 35100101,
  "PropertyBindType": "SpecificScope",
  "TraitMemberPropertyList": [],
  "AllMemberPropertyList": []
}
```

### RogueNousRoom.json (0.14 MB, 1,224 条)

**字段** (3): `RogueRoomID, RogueSubMode, RogueRoomSections`

**首条记录摘要**:
```json
{
  "RogueRoomID": 1211541,
  "RogueSubMode": "ChessRogueNous",
  "RogueRoomSections": [
    0
  ]
}
```

### GridFightEquipment.json (0.13 MB, 148 条)

**字段** (10): `ID, DressRuleParamList, EquipCategory, EquipFuncParamList, AbilityName, ParamList, GeneralPropertyList, EquipmentTagList, JsonPath, EffectParamList`

**首条记录摘要**:
```json
{
  "ID": 350201,
  "DressRuleParamList": [],
  "EquipCategory": "Basic",
  "EquipFuncParamList": [],
  "AbilityName": "",
  "ParamList": [
    {
      "Value": 0.05
    }
  ],
  "GeneralPropertyList": "[{\"PropertyType\": \"ExtraSpeedAddedRatio1...",
  "EquipmentTagList": [
    6
  ],
  "JsonPath": "",
  "EffectParamList": [
    {
      "Value": 0.05
    }
  ]
}
```

### NPCMonsterData.json (0.13 MB, 287 条)

**字段** (10): `ID, NPCName, ConfigEntityPath, JsonPath, DefaultAIPath, MiniMapIconType, Rank, IsMazeLink, PrototypeID, MappingInfoID`

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

### LimaoNewsCommentState.json (0.13 MB, 1,311 条)

**字段** (4): `HFFBGDNDBHC, AEDOBNFDODI, GLBIANIMBII, GNDCCBNILML`

**首条记录摘要**:
```json
{
  "HFFBGDNDBHC": 101001,
  "AEDOBNFDODI": 1,
  "GLBIANIMBII": [],
  "GNDCCBNILML": true
}
```

### PerformanceSkipFlagC.json (0.13 MB, 724 条)

**字段** (3): `PerformanceID, Skippable, ActorList`

**首条记录摘要**:
```json
{
  "PerformanceID": 100010101,
  "Skippable": true,
  "ActorList": "[\"TalkSentenceName_Silwolf\", \"TalkSenten..."
}
```

### RogueMagicUnit.json (0.13 MB, 277 条)

**字段** (10): `MagicUnitID, MagicUnitLevel, MagicUnitCategory, MagicUnitType, MagicUnitMazeBuffID, MagicUnitDesc, MagicUnitSimpleDesc, ExtraEffectID, AttachRangeTypeList, EffectTypeList`

**首条记录摘要**:
```json
{
  "MagicUnitID": 4001,
  "MagicUnitLevel": 1,
  "MagicUnitCategory": "Common",
  "MagicUnitType": "Active",
  "MagicUnitMazeBuffID": 686010,
  "MagicUnitDesc": {
    "Hash": 17534411253061629072
  },
  "MagicUnitSimpleDesc": {
    "Hash": 4537441664999750047
  },
  "ExtraEffectID": [],
  "AttachRangeTypeList": [
    "None"
  ],
  "EffectTypeList": [
    "None"
  ]
}
```

### MiniMapIcon.json (0.13 MB, 409 条)

**字段** (8): `ID, IconPath, IconName, FiveDimBillboardIDList, MissionIconPath, isShowinMap, IsShowCornerArrow, Priority`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/MapPics/NaviIcons/IconMapPl...",
  "IconName": "MazeText_Empty",
  "FiveDimBillboardIDList": [],
  "MissionIconPath": "SpriteOutput/MapPics/Billboard/IconBillb...",
  "isShowinMap": true,
  "IsShowCornerArrow": true,
  "Priority": 99
}
```

### LimaoNewsInterviewContent.json (0.13 MB, 771 条)

**字段** (5): `DFFLADLLADD, MMNJODIJPOE, ODLDEEANNCM, EEIEODMEMFI, ANECPHCPLPP`

**首条记录摘要**:
```json
{
  "DFFLADLLADD": 20100,
  "MMNJODIJPOE": "Text",
  "ODLDEEANNCM": "",
  "EEIEODMEMFI": "",
  "ANECPHCPLPP": {
    "Hash": 8759638413218193220
  }
}
```

### HeartDialTalk.json (0.13 MB, 956 条)

**字段** (4): `ID, VoiceID, SDFText, FloorIDList`

**首条记录摘要**:
```json
{
  "ID": 103050403,
  "VoiceID": 103050403,
  "SDFText": {
    "Hash": 6332579846061516669
  },
  "FloorIDList": [
    20312001
  ]
}
```

### RogueTournArea.json (0.12 MB, 268 条)

**字段** (10): `BEOFPCAACEP, PJGJLMIODBD, JJKLIJNFIBB, EODCEHDOAEB, DOKMKLJDCEK, GLNDIILFKBN, GOEDJMNFALN, NKLFPMKHELN, IMNLCDOMMOG, PIKODOAKLGE`

**首条记录摘要**:
```json
{
  "BEOFPCAACEP": 101,
  "PJGJLMIODBD": "Guide",
  "JJKLIJNFIBB": 3001301,
  "EODCEHDOAEB": [
    1001
  ],
  "DOKMKLJDCEK": {
    "LHLKJIDFLIN": "Battle"
  },
  "GLNDIILFKBN": [
    101
  ],
  "GOEDJMNFALN": "Difficulty_1",
  "NKLFPMKHELN": 99,
  "IMNLCDOMMOG": 110600,
  "PIKODOAKLGE": {
    "Hash": 7942183719110286571
  }
}
```

### ChenLingEnemy.json (0.12 MB, 368 条)

**字段** (10): `ID, SoldierID, Level, GridIndex, AtkRatio, HpRatio, AtkSpdRatio, CrtRatio, CrtDMGRatio, EnchantList`

**首条记录摘要**:
```json
{
  "ID": 1011,
  "SoldierID": 4,
  "Level": 2,
  "GridIndex": 4,
  "AtkRatio": {
    "Value": 1
  },
  "HpRatio": {
    "Value": 0.55
  },
  "AtkSpdRatio": {
    "Value": 1
  },
  "CrtRatio": {
    "Value": 1
  },
  "CrtDMGRatio": {
    "Value": 1
  },
  "EnchantList": {}
}
```

### RogueMonsterGroup.json (0.12 MB, 849 条)

**字段** (2): `RogueMonsterGroupID, RogueMonsterListAndWeight`

**首条记录摘要**:
```json
{
  "RogueMonsterGroupID": 11,
  "RogueMonsterListAndWeight": {
    "111": 1
  }
}
```

### EquipmentConfig.json (0.12 MB, 165 条)

**字段** (18): `EquipmentID, Release, EquipmentName, Rarity, AvatarBaseType, MaxPromotion, MaxRank, ExpType, SkillID, ExpProvide, CoinCost, RankUpCostList, ThumbnailPath, ImagePath, ItemRightPanelOffset, AvatarDetailOffset, BattleDialogOffset, GachaResultOffset`

**首条记录摘要**:
```json
{
  "EquipmentID": 20000,
  "Release": true,
  "EquipmentName": {
    "Hash": 1315631816518421847
  },
  "Rarity": "CombatPowerLightconeRarity3",
  "AvatarBaseType": "Rogue",
  "MaxPromotion": 6,
  "MaxRank": 5,
  "ExpType": 1,
  "SkillID": 20000,
  "ExpProvide": 500,
  "CoinCost": 250,
  "RankUpCostList": [],
  "ThumbnailPath": "SpriteOutput/LightConeMediumIcon/20000.p...",
  "ImagePath": "SpriteOutput/LightConeMaxFigures/20000.p...",
  "ItemRightPanelOffset": [
    0,
    -64,
    0.7
  ],
  "AvatarDetailOffset": [
    0,
    -71,
    1.15
  ],
  "BattleDialogOffset": [
    12,
    -6,
    0.6
  ],
  "GachaResultOffset": [
    14,
    -9,
    0.545
  ]
}
```

### ActivityHipplenWork.json (0.11 MB, 292 条)

**字段** (6): `ID, WorkTitle, Type, Param, WorkIcon, WorkSmallIcon`

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

### RogueDialogueOption.json (0.11 MB, 1,120 条)

**字段** (3): `OptionID, OptionDisplayID, ParamList`

**首条记录摘要**:
```json
{
  "OptionID": 1000901,
  "OptionDisplayID": 10009,
  "ParamList": [
    {
      "Value": 50
    },
    {
      "Value": 1
    }
  ]
}
```

### DialogueCondition.json (0.11 MB, 1,081 条)

**字段** (4): `ID, Type, Param1, Param2`

**首条记录摘要**:
```json
{
  "ID": 200045,
  "Type": "submission_state_equal",
  "Param1": 404018901,
  "Param2": 1
}
```

### RogueTournMiracle.json (0.11 MB, 674 条)

**字段** (6): `MiracleID, TournMode, MiracleCategory, MiracleDisplayID, MiracleEffectID, HandbookMiracleID`

**首条记录摘要**:
```json
{
  "MiracleID": 6101,
  "TournMode": "Tourn1",
  "MiracleCategory": "Common",
  "MiracleDisplayID": 3,
  "MiracleEffectID": 801,
  "HandbookMiracleID": 6101
}
```

### RoguePersonaStyleGift.json (0.11 MB, 287 条)

**字段** (7): `FMDMDDCBPAM, MJOOFPBABEA, OLOIFNNLKJP, NMAHGFAPENI, PBLPLDJKPEI, PMIEAEGJNMJ, NIKKAPEIDJO`

**首条记录摘要**:
```json
{
  "FMDMDDCBPAM": 101,
  "MJOOFPBABEA": {
    "Hash": 16987609856870313279
  },
  "OLOIFNNLKJP": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "NMAHGFAPENI": {
    "Hash": 1606445963322294786
  },
  "PBLPLDJKPEI": [
    {
      "Value": 2
    }
  ],
  "PMIEAEGJNMJ": "Common",
  "NIKKAPEIDJO": [
    104,
    107,
    103,
    110
  ]
}
```

### TreasureDungeonMap.json (0.11 MB, 400 条)

**字段** (2): `MapID, MapInfo`

**首条记录摘要**:
```json
{
  "MapID": 1001,
  "MapInfo": "[92, 93, 91, 300, 2, 93, 0, 13, 92, 300,..."
}
```

### DialogueProp.json (0.11 MB, 378 条)

**字段** (7): `GroupID, GroupType, InteractTitle, ConditionIDs, Priority, IconType, ActPath`

**首条记录摘要**:
```json
{
  "GroupID": 100010117,
  "GroupType": "Simple",
  "InteractTitle": "PropInteractTitle_1",
  "ConditionIDs": [
    100010117
  ],
  "Priority": 1,
  "IconType": {
    "EnumIndex": 20,
    "Value": 10
  },
  "ActPath": "Config/Level/Mission/1000101/Talk/Talk_1..."
}
```

### ItemConfigEquipment.json (0.11 MB, 165 条)

**字段** (17): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList, SellType`

**首条记录摘要**:
```json
{
  "ID": 20000,
  "ItemMainType": "Equipment",
  "ItemSubType": "Equipment",
  "InventoryDisplayTag": 1,
  "Rarity": "Rare",
  "isVisible": true,
  "ItemName": {
    "Hash": 3938930023512122568
  },
  "ItemDesc": {
    "Hash": 16159044508835640864
  },
  "ItemBGDesc": {
    "Hash": 5435417150194813419
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/LightConeIcons/200...",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/LightCone/20000...",
  "ItemCurrencyIconPath": "0",
  "ItemAvatarIconPath": "",
  "PileLimit": 9999,
  "CustomDataList": [],
  "ReturnItemIDList": [
    {
      "ItemID": 221,
      "ItemNum": 1
    }
  ],
  "SellType": "Sell"
}
```

### GridFightTraitMazebuff.json (0.10 MB, 158 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35300211,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_Origin_3002_Type1",
  "ParamList": [
    {
      "Value": 0.1
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 4548294859696429646
  },
  "BuffDesc": {
    "Hash": 16103914094188446966
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### ActionGroup.json (0.10 MB, 265 条)

**字段** (10): `ActionGroupName, ActionName, ActionGroupTextmapID, KeyMouseImagePath, FranceKeyMouseImagePath, GermanyKeyMouseImagePath, XboxImagePath, PsImagePath, ActionListForOr, ActionListForAnd`

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
  "ActionListForOr": "[\"Menu_UnchangeLeftBumper\", \"Menu_Unchan...",
  "ActionListForAnd": []
}
```

### GridFightBasicBonusPoolV2.json (0.10 MB, 811 条)

**字段** (4): `BonusID, Value, BonusTypeParam, BonusTypeParamList`

**首条记录摘要**:
```json
{
  "BonusID": 1,
  "Value": 1,
  "BonusTypeParam": 1,
  "BonusTypeParamList": []
}
```

### GotoConfig.json (0.10 MB, 737 条)

**字段** (6): `ID, GotoType, ParamIntList, ParamStringList, UnlockMainMission, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 200,
  "GotoType": 2,
  "ParamIntList": [],
  "ParamStringList": [],
  "UnlockMainMission": 1010301,
  "UnlockID": 200
}
```

### IdleLiveFinishway.json (0.10 MB, 413 条)

**字段** (7): `ID, FinishType, ParamType, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 8060101,
  "FinishType": "IdleLiveOpenChestNum",
  "ParamType": "NoPara",
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### TalkSentenceMultiVoice.json (0.10 MB, 999 条)

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

### EmojiConfig.json (0.10 MB, 471 条)

**字段** (7): `EmojiID, Gender, EmojiGroupID, KeyWords, EmojiPath, SameGroupOrder, IsTrainMembers`

**首条记录摘要**:
```json
{
  "EmojiID": 20001,
  "Gender": "All",
  "EmojiGroupID": 107,
  "KeyWords": {
    "Hash": 2794378749265010380
  },
  "EmojiPath": "SpriteOutput/Emoji/20001.png",
  "SameGroupOrder": 1,
  "IsTrainMembers": true
}
```

### RogueMagicRoom.json (0.09 MB, 1,518 条)

**字段** (2): `RogueRoomID, RogueRoomType`

**首条记录摘要**:
```json
{
  "RogueRoomID": 11001,
  "RogueRoomType": "Adventure"
}
```

### ScheduleDataShop.json (0.09 MB, 933 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 300101,
  "BeginTime": "2021-05-28 04:00:00",
  "EndTime": "2099-12-30 04:00:00"
}
```

### InControlActionMap.json (0.09 MB, 328 条)

**字段** (7): `actionName, actionTextmapID, actionTypeList, defaultKey, defaultMouseType, defaultInControlTypes, FuncGotoIDList`

**首条记录摘要**:
```json
{
  "actionName": "Special_PositiveY",
  "actionTextmapID": {
    "Hash": 4278844815157924407
  },
  "actionTypeList": [
    0
  ],
  "defaultKey": "",
  "defaultMouseType": "PositiveY",
  "defaultInControlTypes": [],
  "FuncGotoIDList": []
}
```

### AvatarMazeBuff.json (0.09 MB, 144 条)

**字段** (17): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffDescBattle, BuffEffect, MazeBuffType, UseType, MazeBuffIconType`

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

### BattleEventData.json (0.09 MB, 419 条)

**字段** (7): `BattleEventID, Config, Prefab, LevelAreaPrefab, BEActionBarPrefab, BasePoint, SkillIDList`

**首条记录摘要**:
```json
{
  "BattleEventID": 11203,
  "Config": "",
  "Prefab": "",
  "LevelAreaPrefab": "",
  "BEActionBarPrefab": "",
  "BasePoint": "",
  "SkillIDList": []
}
```

### RogueDLCRoom.json (0.09 MB, 861 条)

**字段** (3): `RogueRoomID, RogueSubMode, RogueRoomSections`

**首条记录摘要**:
```json
{
  "RogueRoomID": 2111141,
  "RogueSubMode": "ChessRogue",
  "RogueRoomSections": [
    0
  ]
}
```

### MazePlane.json (0.09 MB, 362 条)

**字段** (8): `PlaneID, PlaneType, SubType, MazePoolType, WorldID, PlaneName, StartFloorID, FloorIDList`

**首条记录摘要**:
```json
{
  "PlaneID": 10000,
  "PlaneType": "Train",
  "SubType": 1,
  "MazePoolType": 1,
  "WorldID": 100,
  "PlaneName": {
    "Hash": 9871415347087427644
  },
  "StartFloorID": 10000000,
  "FloorIDList": [
    10000000,
    10000002,
    10000003
  ]
}
```

### RogueTalkNameConfig.json (0.09 MB, 508 条)

**字段** (5): `TalkNameID, Name, SubName, IconPath, ImageID`

**首条记录摘要**:
```json
{
  "TalkNameID": 1,
  "Name": {
    "Hash": 6128047544831472841
  },
  "SubName": {
    "Hash": 548192794296363567
  },
  "IconPath": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "ImageID": 201
}
```

### ExtraEffectConfig.json (0.09 MB, 310 条)

**字段** (6): `ExtraEffectID, ExtraEffectName, ExtraEffectDesc, DescParamList, ExtraEffectIconPath, ExtraEffectType`

**首条记录摘要**:
```json
{
  "ExtraEffectID": 10000000,
  "ExtraEffectName": {
    "Hash": 17770103784896915777
  },
  "ExtraEffectDesc": {
    "Hash": 13494037450049286295
  },
  "DescParamList": [],
  "ExtraEffectIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffCo...",
  "ExtraEffectType": 2
}
```

### ILBattleStage.json (0.09 MB, 292 条)

**字段** (7): `ID, HardLevelGroup, Level, EliteGroup, CombatValue, StageAbilityConfig, JsonConfigPath`

**首条记录摘要**:
```json
{
  "ID": 1011,
  "HardLevelGroup": 1,
  "Level": 1,
  "EliteGroup": 5,
  "CombatValue": 300,
  "StageAbilityConfig": [
    "RtCommon_TeachingStage_NoCD"
  ],
  "JsonConfigPath": "Config/Activity/RtBattle/Stage/RtBattleS..."
}
```

### ActivityDiceAvatarConfig.json (0.09 MB, 64 条)

**字段** (22): `DiceAvatarID, Rare, Name, HP, SkillID, DiceIDPerRare, DiceCountPerRare, AttackDiceNumber, DefendDiceNumber, ImgPath, ImgPathUI3D, HighLevelBGImgPath, HighLevelBGImgPathUI3D, ImgPathHeadIcon, ShopIcon, IsCollection, AttackEffectPath, AttackEffectEnemyPath, AttackAnimation, RecommendDiceIDList, FinalAttackVoice, AttackJson`

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

### ILBattleAvatar.json (0.09 MB, 42 条)

**字段** (28): `ID, AvatarName, FullName, FormalAvatar, Rarity, TagList, SkillList, PromotionIDList, Attack, Defence, HP, MoveSpeed, CriticalChanceBase, CriticalDamageBase, ElementMastery, JsonPath, AIPath, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, DefaultAvatarMiniIconPath, UltraSkillCutInPrefabPath, AvatarSideIconPath, DefaultAvatarRoundIconPath, AvatarShopIconPath, MainTag, AvatarDesc1, AvatarDesc2, AvatarDesc3`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "AvatarName": {
    "Hash": 7186395139045690207
  },
  "FullName": {
    "Hash": 9058972803650014395
  },
  "FormalAvatar": true,
  "Rarity": 5,
  "TagList": [
    "Debuff",
    "Hunt"
  ],
  "SkillList": [
    100101,
    100102,
    100103,
    100104
  ],
  "PromotionIDList": [
    100101,
    100102,
    100103,
    100104,
    100105
  ],
  "Attack": "{\"PEDFLGGDHDP\": {\"Value\": 245}, \"OEELKOM...",
  "Defence": "{\"PEDFLGGDHDP\": {\"Value\": 76}, \"OEELKOMP...",
  "HP": "{\"PEDFLGGDHDP\": {\"Value\": 3200}, \"OEELKO...",
  "MoveSpeed": {
    "Value": 5
  },
  "CriticalChanceBase": {
    "Value": 0.05
  },
  "CriticalDamageBase": {
    "Value": 0.5
  },
  "ElementMastery": {
    "Value": 0.2
  },
  "JsonPath": "Config/Activity/RtBattle/Character/Avata...",
  "AIPath": "Config/Activity/RtBattle/AI/ST_RtBattle_...",
  "DefaultAvatarModelPath": "Characters/CharacterPrefabs/Activity/RtB...",
  "DefaultAvatarHeadIconPath": "SpriteOutput/AvatarIcon/Avatar/1001.png",
  "DefaultAvatarMiniIconPath": "SpriteOutput/AvatarMiniIcon/1001.png",
  "UltraSkillCutInPrefabPath": "UI/Battle/UltraSkillCutIn/Avatar/UltraSk...",
  "AvatarSideIconPath": "SpriteOutput/AvatarCutinFigures/1001.png",
  "DefaultAvatarRoundIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001...",
  "AvatarShopIconPath": "SpriteOutput/AvatarShopIcon/Avatar/1001....",
  "MainTag": "Hunt",
  "AvatarDesc1": {
    "Hash": 8486440531592369693
  },
  "AvatarDesc2": {
    "Hash": 7082471571781590681
  },
  "AvatarDesc3": {
    "Hash": 5986400126688376131
  }
}
```

### AvatarDemoConfig.json (0.09 MB, 135 条)

**字段** (15): `StageID, StageType, AvatarID, TrialAvatarList, SPList, RewardID, OperationRecordPath, OverrideDisplaySkillTriggerKeyList, MapEntranceID, MazeGroupID1, ConfigList1, NpcMonsterIDList1, EventIDList1, EnableMazeSkillEffect, EnableSwitchAvatar`

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

### ChimeraWorkData.json (0.09 MB, 254 条)

**字段** (9): `WorkID, Tag, Atk, Hp, WorkPrefab, WorkIcon, JsonConfig, WorkValue, DisplayID`

**首条记录摘要**:
```json
{
  "WorkID": 501,
  "Tag": "Normal",
  "Atk": 4,
  "Hp": 10,
  "WorkPrefab": "Gameplays/Chimera/Work/Prefab/Chimera_Tr...",
  "WorkIcon": "SpriteOutput/Quest/Chimera/ChimeraWorkIc...",
  "JsonConfig": "Config/Gameplays/Chimera/Work/ChimeraWor...",
  "WorkValue": 2,
  "DisplayID": 518
}
```

### RogueTournFormula.json (0.09 MB, 304 条)

**字段** (9): `FormulaID, MainBuffTypeID, MainBuffNum, SubBuffTypeID, SubBuffNum, FormulaCategory, MazeBuffID, FormulaDisplayID, FormulaStoryJson`

**首条记录摘要**:
```json
{
  "FormulaID": 100001,
  "MainBuffTypeID": 126,
  "MainBuffNum": 3,
  "SubBuffTypeID": 128,
  "SubBuffNum": 2,
  "FormulaCategory": "Rare",
  "MazeBuffID": 675680,
  "FormulaDisplayID": 2102019,
  "FormulaStoryJson": ""
}
```

### FateRinHouguConfig.json (0.09 MB, 107 条)

**字段** (18): `PHFMCACHFIJ, GMPGDEINODK, OENAMINOLLF, PLHINENDNDO, IJEJGCEAFAF, OKCCPDBENOJ, AHONBLHLHIO, NHALJPDONCP, NOFHEEJMCLH, GINFOPOAKHK, PBLPLDJKPEI, OLOIFNNLKJP, HHBNIODGKKE, JKCHLJNLLNA, KALCGCPPMBD, OCMHKMFBLJN, PMIEAEGJNMJ, KEDLONFFJHO`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "GMPGDEINODK": "Trailblazer",
  "OENAMINOLLF": {
    "Hash": 4267639606838403393
  },
  "PLHINENDNDO": {
    "Hash": 17483858099201079400
  },
  "IJEJGCEAFAF": {
    "Hash": 16114985427923166313
  },
  "OKCCPDBENOJ": {
    "Hash": 17144615025799456916
  },
  "AHONBLHLHIO": [],
  "NHALJPDONCP": 1,
  "NOFHEEJMCLH": [],
  "GINFOPOAKHK": "Config/Activity/FateRin/Ability/Activity...",
  "PBLPLDJKPEI": [
    {
      "Value": 0.5
    },
    {
      "Value": 0
    }
  ],
  "OLOIFNNLKJP": "SpriteOutput/Collaboration/FateRin/FateC...",
  "HHBNIODGKKE": "",
  "JKCHLJNLLNA": "SpriteOutput/Collaboration/FateRin/FateC...",
  "KALCGCPPMBD": "",
  "OCMHKMFBLJN": "",
  "PMIEAEGJNMJ": "R",
  "KEDLONFFJHO": true
}
```

### BattleEventSkillConfigLD.json (0.09 MB, 100 条)

**字段** (18): `SkillID, SkillName, SkillTag, SkillTypeDesc, SkillTriggerKey, SkillIcon, UltraSkillIcon, CutinPath, SimpleSkillDesc, ShowStanceList, SPNeed, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, SkillEffect, SkillButtonEffType`

**首条记录摘要**:
```json
{
  "SkillID": 10000101,
  "SkillName": {
    "Hash": 15146358426722564720
  },
  "SkillTag": {
    "Hash": 11585018240195872680
  },
  "SkillTypeDesc": {
    "Hash": 2720894228476091124
  },
  "SkillTriggerKey": "Skill03",
  "SkillIcon": "SpriteOutput/SkillIcons/Collaboration/Fa...",
  "UltraSkillIcon": "SpriteOutput/SkillIcons/Collaboration/Fa...",
  "CutinPath": "",
  "SimpleSkillDesc": {
    "Hash": 11381020486967881462
  },
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "SPNeed": {
    "Value": 100
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
  "ParamList": [],
  "SimpleParamList": [],
  "SkillEffect": "AoEAttack",
  "SkillButtonEffType": "UI/Battle/SPInfo/Eff_Special/SPInfoEff_F..."
}
```

### FateMasterTalk.json (0.09 MB, 329 条)

**字段** (6): `NNDOABPFDMI, LJPJOPFFGGF, HHDKOKBHBCA, KLAGNGDGAIC, BIFDDEDBGAL, NFIKBPNJGDG`

**首条记录摘要**:
```json
{
  "NNDOABPFDMI": 12210101,
  "LJPJOPFFGGF": 1221,
  "HHDKOKBHBCA": {
    "Hash": 11720371912364289831
  },
  "KLAGNGDGAIC": "PreBattleOverview",
  "BIFDDEDBGAL": [],
  "NFIKBPNJGDG": []
}
```

### GridFightNodeTemplate.json (0.09 MB, 493 条)

**字段** (6): `NodeTemplateID, StageID, NodeType, ParamList, PenaltyBonusRuleID, BasicGoldRewardNum`

**首条记录摘要**:
```json
{
  "NodeTemplateID": 10011,
  "StageID": 70000001,
  "NodeType": "Monster",
  "ParamList": [
    900
  ],
  "PenaltyBonusRuleID": 90301,
  "BasicGoldRewardNum": 3
}
```

### AvatarRelicRecommend.json (0.09 MB, 91 条)

**字段** (10): `AvatarID, Set4IDList, Set2IDList, PropertyList3, PropertyList4, PropertyList5, PropertyList6, PropertyList, SubAffixPropertyList, ScoreRankList`

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
  "PropertyList3": "[\"DefenceAddedRatio\", \"StatusProbability...",
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
  "PropertyList": "[{\"RelicType\": \"BODY\", \"PropertyType\": \"...",
  "SubAffixPropertyList": "[\"DefenceAddedRatio\", \"SpeedDelta\", \"Sta...",
  "ScoreRankList": [
    279,
    216
  ]
}
```

### SwordTrainingEffect.json (0.08 MB, 547 条)

**字段** (4): `ID, EffectType, ParamList, EnhanceActionList`

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

### RogueUpgradeAvatarSubValue.json (0.08 MB, 276 条)

**字段** (4): `RelicRarity, RelicType, RelicSubValueList, RelicSubValueStepTime`

**首条记录摘要**:
```json
{
  "RelicRarity": "CombatPowerRelicRarity2",
  "RelicType": "HEAD",
  "RelicSubValueList": [],
  "RelicSubValueStepTime": 1
}
```

### RogueMiracleDisplay.json (0.08 MB, 294 条)

**字段** (5): `MiracleDisplayID, MiracleName, MiracleBGDesc, MiracleIconPath, MiracleFigureIconPath`

**首条记录摘要**:
```json
{
  "MiracleDisplayID": 1,
  "MiracleName": {
    "Hash": 16215705090798908027
  },
  "MiracleBGDesc": {
    "Hash": 2054227000900414224
  },
  "MiracleIconPath": "SpriteOutput/Rogue/MiracleIcon/1001.png",
  "MiracleFigureIconPath": "SpriteOutput/Rogue/MiracleFigureIcon/100..."
}
```

### ProgramGroupConfig.json (0.08 MB, 320 条)

**字段** (8): `ID, ProgramGroupID, Order, PlayType, Asset, IfAnAsset, Duration, SoundEvent`

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

### FuncUnlockData.json (0.08 MB, 481 条)

**字段** (3): `UnlockID, Conditions, ShowCondition`

**首条记录摘要**:
```json
{
  "UnlockID": 200,
  "Conditions": [
    {
      "Type": "PlayerLevel",
      "Param": "1"
    }
  ],
  "ShowCondition": []
}
```

### PossessionConfig.json (0.08 MB, 220 条)

**字段** (6): `PossessionName, PossessionPrefabPath, AttachPoint, LocalPosition, LocalRotation, LocalScale`

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

### InclinationText.json (0.08 MB, 686 条)

**字段** (3): `TalkSentenceID, InclinationTypeList, InclinationAddValueList`

**首条记录摘要**:
```json
{
  "TalkSentenceID": 100000417,
  "InclinationTypeList": [
    1003
  ],
  "InclinationAddValueList": []
}
```

### StoryProp.json (0.08 MB, 347 条)

**字段** (5): `StoryCharacterID, StoryCharacterUniqueName, StoryCharacterModelPath, ConfigEntityPath, JsonPath`

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

### IdleLiveGift.json (0.08 MB, 299 条)

**字段** (10): `ID, MainText, RewardID, Icon, TriggerID, SenderID, RarityType, FlySpeed, SourceType, SourceID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "MainText": {
    "Hash": 4928310697490933968
  },
  "RewardID": 8017117,
  "Icon": "",
  "TriggerID": 5,
  "SenderID": 36,
  "RarityType": 1,
  "FlySpeed": 0.8,
  "SourceType": "Unlock",
  "SourceID": 1
}
```

### ChallengeStoryMazeConfig.json (0.08 MB, 100 条)

**字段** (22): `ID, Name, GroupID, MapEntranceID, MapEntranceID2, Floor, RewardID, DamageType1, DamageType2, ChallengeTargetID, StageNum, MonsterID1, MonsterID2, MazeGroupID1, ConfigList1, NpcMonsterIDList1, EventIDList1, MazeGroupID2, ConfigList2, NpcMonsterIDList2, EventIDList2, MazeBuffID`

**首条记录摘要**:
```json
{
  "ID": 20011,
  "Name": {
    "Hash": 3413375142382921872
  },
  "GroupID": 2001,
  "MapEntranceID": 3000205,
  "MapEntranceID2": 3000205,
  "Floor": 1,
  "RewardID": 101401,
  "DamageType1": [
    "Thunder",
    "Imaginary"
  ],
  "DamageType2": [
    "Ice",
    "Wind"
  ],
  "ChallengeTargetID": [
    2001,
    2002,
    2003
  ],
  "StageNum": 2,
  "MonsterID1": [],
  "MonsterID2": [],
  "MazeGroupID1": 6,
  "ConfigList1": [
    200001
  ],
  "NpcMonsterIDList1": [
    1023010
  ],
  "EventIDList1": [
    30019011
  ],
  "MazeGroupID2": 7,
  "ConfigList2": [
    200001
  ],
  "NpcMonsterIDList2": [
    2023020
  ],
  "EventIDList2": [
    30019012
  ],
  "MazeBuffID": 3031001
}
```

### MessageGroupConfig.json (0.08 MB, 739 条)

**字段** (3): `ID, MessageContactsID, MessageSectionIDList`

**首条记录摘要**:
```json
{
  "ID": 10000,
  "MessageContactsID": 1002,
  "MessageSectionIDList": [
    1000000
  ]
}
```

### MatchThreeTemplateApplyRule.json (0.08 MB, 426 条)

**字段** (6): `ID, Mode, Round, TemplatePath, Type, PR`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Mode": "PVP",
  "Round": 1,
  "TemplatePath": "Config/Gameplays/Match3/ChessboardTempla...",
  "Type": "Fire",
  "PR": 7
}
```

### VisitorBehaviorConfig.json (0.08 MB, 252 条)

**字段** (11): `VisitorID, BehaviorID, NPCGroupID, NPCID, AnchorID, RewardID, NPCRotationYInfo, DefaultIdleFreeStyleMotionID, PerformanceID, DefaultPerformanceID, NpcBubbleTalkSentenceID`

**首条记录摘要**:
```json
{
  "VisitorID": 1009001,
  "BehaviorID": 1,
  "NPCGroupID": 49,
  "NPCID": 400001,
  "AnchorID": 5,
  "RewardID": 211,
  "NPCRotationYInfo": 76.55777,
  "DefaultIdleFreeStyleMotionID": 310090209,
  "PerformanceID": 500100101,
  "DefaultPerformanceID": 500100201,
  "NpcBubbleTalkSentenceID": 500100115
}
```

### GridFightBackEquipment.json (0.08 MB, 165 条)

**字段** (8): `RoleID, EquipmentID, Level, BackEquipmentDesc, ParamList, ParamFormat, AllMemberGeneralPropertyList, OwnerGeneralPropertyList`

**首条记录摘要**:
```json
{
  "RoleID": 1003,
  "EquipmentID": 23000,
  "Level": 1,
  "BackEquipmentDesc": {
    "Hash": 9778359379731183808
  },
  "ParamList": [
    {
      "Value": 0.06
    },
    {
      "Value": 0
    }
  ],
  "ParamFormat": "[i]%",
  "AllMemberGeneralPropertyList": [],
  "OwnerGeneralPropertyList": "[{\"PropertyType\": \"ExtraAllDamageTypeAdd..."
}
```

### ActivityDiceContentConfig.json (0.08 MB, 116 条)

**字段** (9): `ContentID, Content, DiceSkillJsonPath, SkillParam, GlossaryIDList, ImgPath, SKillImgPath, SKillImgPathUI3D, SKillImagePathSmall`

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

### ClockParkEffect.json (0.08 MB, 530 条)

**字段** (2): `ParamList, PlayCardEffectDescParamList`

**首条记录摘要**:
```json
{
  "ParamList": [],
  "PlayCardEffectDescParamList": []
}
```

### RogueMap.json (0.07 MB, 615 条)

**字段** (6): `RogueMapID, SiteID, IsStart, PosX, PosY, NextSiteIDList`

**首条记录摘要**:
```json
{
  "RogueMapID": 1,
  "SiteID": 1,
  "IsStart": true,
  "PosX": 100,
  "PosY": -360,
  "NextSiteIDList": []
}
```

### GFTraitElationTemplate.json (0.07 MB, 272 条)

**字段** (5): `ID, Weight, PreEquipList, FirstRecommendEquipList, SecondRecommendEquipList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Weight": 300,
  "PreEquipList": [
    350201,
    350201,
    350201
  ],
  "FirstRecommendEquipList": [
    35030102,
    35030102,
    35030102
  ],
  "SecondRecommendEquipList": [
    35030101,
    35030101,
    35030101
  ]
}
```

### AetherDivideSpiritSkill.json (0.07 MB, 78 条)

**字段** (18): `SkillID, SkillName, SkillTag, SkillTypeDesc, SkillTriggerKey, AttackType, SkillIcon, UltraSkillIcon, SimpleExtraEffectIDList, ExtraEffectIDList, SkillDesc, SimpleSkillDesc, SPMultipleRatio, BPAdd, BPNeed, SimpleParamList, ParamList, SkillEffect`

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

### GridFightTraitLayer.json (0.07 MB, 152 条)

**字段** (8): `TraitID, Layer, MazebuffID, PropertyBindType, TraitMemberPropertyList, AllMemberPropertyList, OverrideBEPropertyList, PropertyParamList`

**首条记录摘要**:
```json
{
  "TraitID": 1001,
  "Layer": 2,
  "MazebuffID": 35100101,
  "PropertyBindType": "SpecificScope",
  "TraitMemberPropertyList": [],
  "AllMemberPropertyList": [],
  "OverrideBEPropertyList": [],
  "PropertyParamList": []
}
```

### GridFightBackBEConfig.json (0.07 MB, 119 条)

**字段** (12): `BattleEventID, Team, EventSubType, BattleEventName, HeadIcon, AbilityList, OverrideProperty, Speed, HardLevel, DescrptionText, ParamList, AssetPackName`

**首条记录摘要**:
```json
{
  "BattleEventID": 62200,
  "Team": "TeamNeutral",
  "EventSubType": "GridFightCountDownWarningEvent",
  "BattleEventName": "BattleEventName_62200",
  "HeadIcon": "SpriteOutput/AvatarIconTeam/999.png",
  "AbilityList": "[\"BattleEventAbility_SummonMonsterInfini...",
  "OverrideProperty": "[{\"PropertyType\": \"BaseHP\", \"Value\": {\"V...",
  "Speed": {
    "Value": 100
  },
  "HardLevel": true,
  "DescrptionText": "",
  "ParamList": [
    {
      "Value": 0.5
    }
  ],
  "AssetPackName": ""
}
```

### ItemPlayerCard.json (0.07 MB, 112 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, UseMethod, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 200001,
  "ItemMainType": "Usable",
  "ItemSubType": "HeadIcon",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "isVisible": true,
  "ItemName": {
    "Hash": 216656405702675284
  },
  "ItemIconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "ItemFigureIconPath": "",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "",
  "PileLimit": 1,
  "UseMethod": "AutoConversionItem",
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### MessageContactsConfig.json (0.07 MB, 295 条)

**字段** (6): `ID, Name, IconPath, SignatureText, ContactsType, ContactsCamp`

**首条记录摘要**:
```json
{
  "ID": 1000,
  "Name": {
    "Hash": 7756966884920887303
  },
  "IconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "SignatureText": {
    "Hash": 8614338816010844770
  },
  "ContactsType": 1,
  "ContactsCamp": 1
}
```

### PerformanceVideo.json (0.07 MB, 317 条)

**字段** (7): `PerformanceID, PerformancePath, IsSkip, StartBlack, EndBlack, PlaneID, FloorID`

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

### ActivityConfig.json (0.07 MB, 487 条)

**字段** (3): `ActivityID, ResidentModuleList, ActivityModuleIDList`

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

### ConstValueClient.json (0.07 MB, 436 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "UseLess",
  "Value": {
    "IntValue": 1
  }
}
```

### ILBattleAvatarSkill.json (0.07 MB, 127 条)

**字段** (7): `ID, SkillDesc, MaxLevel, SkillTriggerKey, SkillNameKey, AttackType, ParamList`

**首条记录摘要**:
```json
{
  "ID": 100101,
  "SkillDesc": {
    "Hash": 7961333003494811414
  },
  "MaxLevel": 10,
  "SkillTriggerKey": "Skill01",
  "SkillNameKey": "Skill01",
  "AttackType": "Normal",
  "ParamList": "[{\"PEDFLGGDHDP\": {\"Value\": 0.8}, \"NKAACM..."
}
```

### PixAirSkillConfig.json (0.07 MB, 339 条)

**字段** (4): `ID, Desc, JsonConfig, SkillParams`

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

### RogueTournCocoonConfig.json (0.07 MB, 70 条)

**字段** (15): `ID, Difficulty, DisplayID, PicPath, RecommendDamageTypes, RecommendLevel, DisplayMonsterMap, NpcMonsterID, WorldLevel, EventID, DisplayItemList, DropList, StaminaCost, RogueKeyCost, MaxChallengeCnt`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Difficulty": 1,
  "DisplayID": 201,
  "PicPath": "SpriteOutput/Rogue/BossRush/BgRogueTourm...",
  "RecommendDamageTypes": [
    "Physical",
    "Thunder",
    "Imaginary"
  ],
  "RecommendLevel": 45,
  "DisplayMonsterMap": "[{\"DBLDCKODNEN\": 1004022, \"NCKAICABJIK\":...",
  "NpcMonsterID": 1004021,
  "WorldLevel": 1,
  "EventID": 80300031,
  "DisplayItemList": "[{\"ItemID\": 22, \"ItemNum\": 200}, {\"ItemI...",
  "DropList": "[1000919, 1000410, 713012, 713012, 71301...",
  "StaminaCost": 40,
  "RogueKeyCost": 1,
  "MaxChallengeCnt": 6
}
```

### MessageSectionConfig.json (0.07 MB, 751 条)

**字段** (3): `ID, StartMessageItemIDList, IsPerformMessage`

**首条记录摘要**:
```json
{
  "ID": 1150300,
  "StartMessageItemIDList": [
    115030004
  ],
  "IsPerformMessage": true
}
```

### RogueTournBuffGroup.json (0.07 MB, 453 条)

**字段** (2): `RogueBuffGroupID, RogueBuffDrop`

**首条记录摘要**:
```json
{
  "RogueBuffGroupID": 1000001,
  "RogueBuffDrop": "[1505001, 1505101, 1505201, 1505301, 150..."
}
```

### MonsterSkillUniqueConfig.json (0.07 MB, 103 条)

**字段** (16): `SkillID, SkillName, SkillTriggerKey, SkillTypeDesc, SkillTag, DamageType, AttackType, DelayRatio, AI_CD, AI_ICD, IconPath, SkillDesc, PhaseList, ParamList, ModifierList, ExtraEffectIDList`

**首条记录摘要**:
```json
{
  "SkillID": 700101001,
  "SkillName": {
    "Hash": 5124523702867116025
  },
  "SkillTriggerKey": "Skill01",
  "SkillTypeDesc": {
    "Hash": 4236760374151560033
  },
  "SkillTag": {
    "Hash": 4014610187872883999
  },
  "DamageType": "Fire",
  "AttackType": "Normal",
  "DelayRatio": {
    "Value": 1
  },
  "AI_CD": 1,
  "AI_ICD": 1,
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "SkillDesc": {
    "Hash": 18279663942721429976
  },
  "PhaseList": [
    1
  ],
  "ParamList": "[{\"Value\": 3.5}, {\"Value\": 0.5}, {\"Value...",
  "ModifierList": [],
  "ExtraEffectIDList": []
}
```

### PlanetFesAvatarEventOption.json (0.07 MB, 288 条)

**字段** (4): `EventOptionID, NextOptionList, EventContent, OptionBubbleTalk`

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

### ChallengeBossMazeConfig.json (0.07 MB, 80 条)

**字段** (22): `ID, Name, GroupID, MapEntranceID, MapEntranceID2, Floor, RewardID, DamageType1, DamageType2, ChallengeTargetID, StageNum, MonsterID1, MonsterID2, MazeGroupID1, ConfigList1, NpcMonsterIDList1, EventIDList1, MazeGroupID2, ConfigList2, NpcMonsterIDList2, EventIDList2, MazeBuffID`

**首条记录摘要**:
```json
{
  "ID": 30011,
  "Name": {
    "Hash": 10692183560853744694
  },
  "GroupID": 3001,
  "MapEntranceID": 3012401,
  "MapEntranceID2": 3012402,
  "Floor": 1,
  "RewardID": 101401,
  "DamageType1": [
    "Thunder",
    "Quantum"
  ],
  "DamageType2": [
    "Physical",
    "Fire",
    "Imaginary"
  ],
  "ChallengeTargetID": [
    3001,
    3002,
    3003
  ],
  "StageNum": 2,
  "MonsterID1": [],
  "MonsterID2": [],
  "MazeGroupID1": 5,
  "ConfigList1": [
    200001
  ],
  "NpcMonsterIDList1": [
    1004012
  ],
  "EventIDList1": [
    420101
  ],
  "MazeGroupID2": 6,
  "ConfigList2": [
    200001
  ],
  "NpcMonsterIDList2": [
    3024012
  ],
  "EventIDList2": [
    420111
  ],
  "MazeBuffID": 3110001
}
```

### HeartDialScript.json (0.07 MB, 153 条)

**字段** (7): `ScriptID, TotalEmoInfoList, StepList, MissingEmoList, MissingDialogueID, FullDialogueID, LockDialogueID`

**首条记录摘要**:
```json
{
  "ScriptID": 10001,
  "TotalEmoInfoList": "[{\"POAIHJCEKCF\": 1001}, {\"BNFEAFPEOIE\": ...",
  "StepList": [
    "Missing",
    "Full",
    "Normal"
  ],
  "MissingEmoList": [
    "Sad"
  ],
  "MissingDialogueID": 1004,
  "FullDialogueID": 1005,
  "LockDialogueID": 1006
}
```

### GridFightRoleBasicInfoOld.json (0.07 MB, 198 条)

**字段** (10): `ExistSeason, ID, AvatarID, FrontBackType, Rarity, ChargeType, MaxSPIcon, TraitList, BackendRankList, SpecialAvatarID`

**首条记录摘要**:
```json
{
  "ExistSeason": 101,
  "ID": 1001,
  "AvatarID": 1001,
  "FrontBackType": "Back",
  "Rarity": 1,
  "ChargeType": [
    "Speed"
  ],
  "MaxSPIcon": "",
  "TraitList": [
    1001,
    2010
  ],
  "BackendRankList": "[100101, 100102, 100103, 100104, 100105,...",
  "SpecialAvatarID": 3701001
}
```

### ILBattleMonster.json (0.07 MB, 72 条)

**字段** (17): `ID, MonsterName, OriginalTemplateID, Rank, SkillList, AbilityNameList, SummonIDList, CustomValueTags, DynamicValues, AttackBase, DefenceBase, HPBase, JsonConfig, PrefabPath, AIPath, IconPath, RoundIconPath`

**首条记录摘要**:
```json
{
  "ID": 1002011,
  "MonsterName": {
    "Hash": 6883339205480473763
  },
  "OriginalTemplateID": 1002011,
  "Rank": "Minion",
  "SkillList": [
    100201101
  ],
  "AbilityNameList": [],
  "SummonIDList": [],
  "CustomValueTags": [],
  "DynamicValues": [],
  "AttackBase": {
    "Value": 160
  },
  "DefenceBase": {
    "Value": 140
  },
  "HPBase": {
    "Value": 2400
  },
  "JsonConfig": "Config/Activity/RtBattle/Character/Monst...",
  "PrefabPath": "Characters/CharacterPrefabs/Activity/RtB...",
  "AIPath": "Config/Activity/RtBattle/AI/ST_RtBattle_...",
  "IconPath": "SpriteOutput/MosterIcon/Monster_1002011....",
  "RoundIconPath": "SpriteOutput/MonsterRoundIcon/Monster_10..."
}
```

### RetCodeError.json (0.07 MB, 805 条)

**字段** (1): `Text`

**首条记录摘要**:
```json
{
  "Text": {
    "Hash": 18396014689023842325
  }
}
```

### RogueTournHandbookMiracle.json (0.07 MB, 524 条)

**字段** (4): `HandbookMiracleID, MiracleDisplayID, MiracleCategory, UnlockDesc`

**首条记录摘要**:
```json
{
  "HandbookMiracleID": 6101,
  "MiracleDisplayID": 6101,
  "MiracleCategory": "Common",
  "UnlockDesc": 806
}
```

### RogueWolfGunMiracleTarget.json (0.06 MB, 421 条)

**字段** (5): `MiracleID, GameMode, MiraclePic, Basement, LayerMiddle`

**首条记录摘要**:
```json
{
  "MiracleID": 6101,
  "GameMode": "TournRogue",
  "MiraclePic": "SpriteOutput/Rogue/MiracleIcon/1003.png",
  "Basement": 3,
  "LayerMiddle": 16
}
```

### CakeRacePerformance.json (0.06 MB, 335 条)

**字段** (3): `PerformanceID, PerformanceParam, PerformTextmap`

**首条记录摘要**:
```json
{
  "PerformanceID": 1011,
  "PerformanceParam": [],
  "PerformTextmap": {
    "Hash": 7470042023964606390
  }
}
```

### RogueTournWeeklyDisplay.json (0.06 MB, 275 条)

**字段** (3): `WeeklyDisplayID, WeeklyDisplayContent, DescParams`

**首条记录摘要**:
```json
{
  "WeeklyDisplayID": 1001,
  "WeeklyDisplayContent": {
    "Hash": 16523463738176474651
  },
  "DescParams": []
}
```

### LimaoNewsUser.json (0.06 MB, 377 条)

**字段** (4): `JAKLCIIEDON, NJPLKACOMMM, DKCPEGMOAHB, JEJNHIBLJNM`

**首条记录摘要**:
```json
{
  "JAKLCIIEDON": 1,
  "NJPLKACOMMM": {
    "Hash": 2541523136256793332
  },
  "DKCPEGMOAHB": "SpriteOutput/AvatarRoundIcon/WebIcon/Web...",
  "JEJNHIBLJNM": "Official"
}
```

### SFXConfig.json (0.06 MB, 639 条)

**字段** (2): `SFXID, SFXPath`

**首条记录摘要**:
```json
{
  "SFXID": 10030,
  "SFXPath": "sfx_belobog_cutscene_030"
}
```

### RelicDataInfo.json (0.06 MB, 184 条)

**字段** (8): `SetID, Type, IconPath, ItemFigureIconPath, RelicName, ItemBGDesc, BGStoryTitle, BGStoryContent`

**首条记录摘要**:
```json
{
  "SetID": 101,
  "Type": "HEAD",
  "IconPath": "SpriteOutput/ItemIcon/RelicIcons/IconRel...",
  "ItemFigureIconPath": "SpriteOutput/RelicFigures/IconRelic_101_...",
  "RelicName": "RelicName_31011",
  "ItemBGDesc": "ItemBGDesc_31011",
  "BGStoryTitle": "RelicStoryTitle_31011",
  "BGStoryContent": "RelicStoryContent_31011"
}
```

### GridFightSkillSubIcon.json (0.06 MB, 997 条)

**字段** (3): `SkillComeFrom, SkillID, SubIconType`

**首条记录摘要**:
```json
{
  "SkillComeFrom": "Back",
  "SkillID": 10060201,
  "SubIconType": "Replace"
}
```

### FateStatusConfig.json (0.06 MB, 141 条)

**字段** (10): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, StatusEffect, ReadParamList, TagList`

**首条记录摘要**:
```json
{
  "StatusID": 63059001,
  "ModifierName": "MActivity_Fate_LancerBE_Base_Debuff",
  "StatusName": {
    "Hash": 11585901065144575146
  },
  "StatusType": "Debuff",
  "StatusDesc": {
    "Hash": 1027333570222348079
  },
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/Collaborat...",
  "StatusIconPathHighSize": "",
  "StatusEffect": {
    "Hash": 4576959021952076817
  },
  "ReadParamList": [],
  "TagList": []
}
```

### ItemUseBuffData.json (0.06 MB, 205 条)

**字段** (14): `UseDataID, ConsumeType, ConsumeTag, UseTargetType, MazeBuffID, MazeBuffParam, MazeBuffParam2, UseMultipleMax, IsCheckHP, UseEffect, PreviewHPRecoveryPercent, PreviewHPRecoveryValue, IsShowItemDesc, ActivityCount`

**首条记录摘要**:
```json
{
  "UseDataID": 400004,
  "ConsumeType": 4,
  "ConsumeTag": [
    "HP"
  ],
  "UseTargetType": "Alive",
  "MazeBuffID": 400004,
  "MazeBuffParam": [],
  "MazeBuffParam2": [],
  "UseMultipleMax": 1,
  "IsCheckHP": true,
  "UseEffect": "AvatarItemIcon_Eff_Heal",
  "PreviewHPRecoveryPercent": 0.15,
  "PreviewHPRecoveryValue": 150,
  "IsShowItemDesc": true,
  "ActivityCount": 1
}
```

### ActivityConfigPunkLord.json (0.06 MB, 98 条)

**字段** (16): `ID, RaidID, GroupType, ManikinConfig, ShowMonster, MonsterPic, MonsterBuff, MonsterRare, TurnLimit, MonsterHP, PluralHP, MonsterLevel, ExistTime, KillPoint, SummonPoint, AssistPoint`

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

### LimaoNewsMessageItem.json (0.06 MB, 254 条)

**字段** (7): `IJBDLNLOJKK, JAKLCIIEDON, GEFCMECLLIJ, LINLNNHIBAK, JGMIOKAJMFB, FBKAMIHGLFK, BHNIBPKLDKO`

**首条记录摘要**:
```json
{
  "IJBDLNLOJKK": 100000100,
  "JAKLCIIEDON": 1,
  "GEFCMECLLIJ": "Limao",
  "LINLNNHIBAK": "Text",
  "JGMIOKAJMFB": {
    "Hash": 16545384359784665760
  },
  "FBKAMIHGLFK": "",
  "BHNIBPKLDKO": [
    100000101
  ]
}
```

### IdleLiveSpecialChat.json (0.06 MB, 169 条)

**字段** (7): `ID, TriggerID, ChatList, Interval, FlySpeed, IsExclusive, RepeatCount`

**首条记录摘要**:
```json
{
  "ID": 80111,
  "TriggerID": 5,
  "ChatList": "[8011101, 8011102, 8011103, 8011104, 801...",
  "Interval": 1,
  "FlySpeed": 1,
  "IsExclusive": true,
  "RepeatCount": 1
}
```

### PasterConfig.json (0.06 MB, 244 条)

**字段** (7): `ID, TravelBrochureID, IncreaseCompletion, DefaultUnlock, Type, TextPasterPrefab, PasterUnlockDesc`

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

### StageInfiniteGroup.json (0.06 MB, 575 条)

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

### TrainPartyCardConfig.json (0.06 MB, 174 条)

**字段** (6): `CardID, CardName, CardImage, Rarity, CardActJson, CardEffectJson`

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

### BattleAchievement.json (0.06 MB, 477 条)

**字段** (4): `BattleAchievementID, AbilityName, NeedTagList, ExcludeTagList`

**首条记录摘要**:
```json
{
  "BattleAchievementID": 20001,
  "AbilityName": "StageAbility_Scoring_20001",
  "NeedTagList": [],
  "ExcludeTagList": []
}
```

### ActivityAvatarPromotion.json (0.06 MB, 84 条)

**字段** (13): `AvatarID, PromotionCostList, MaxLevel, AttackBase, AttackAdd, DefenceBase, DefenceAdd, HPBase, HPAdd, SpeedBase, CriticalChance, CriticalDamage, BaseAggro`

**首条记录摘要**:
```json
{
  "AvatarID": 8901,
  "PromotionCostList": "[{\"ItemID\": 2, \"ItemNum\": 3200}, {\"ItemI...",
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

### BackGroundMusic.json (0.06 MB, 265 条)

**字段** (6): `ID, GroupID, MusicName, UnlockDesc, BGMDesc, Unlock`

**首条记录摘要**:
```json
{
  "ID": 210000,
  "GroupID": 1,
  "MusicName": {
    "Hash": 13461049653840041895
  },
  "UnlockDesc": {
    "Hash": 4163372770562334535
  },
  "BGMDesc": {
    "Hash": 9271587731720215217
  },
  "Unlock": true
}
```

### TeamBuildConfig.json (0.06 MB, 126 条)

**字段** (10): `AvatarID, TeamID, Position, MemberList, BackupList1, BackupList2, BackupList3, BackupGroupList1, BackupGroupList2, BackupGroupList3`

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

### BattleTargetConfig.json (0.06 MB, 139 条)

**字段** (13): `ID, Type, AbilityName, ParamType, TargetParam, HintStep, TargetName, TargetNameSimple, MultiTarget, MultiTargetIconType, IconType, IconNum, SkipWhenSuccessOnEnterBattle`

**首条记录摘要**:
```json
{
  "ID": 2001,
  "Type": "PassTarget",
  "AbilityName": "BattleTarget_FantasticStoryBattleScore1",
  "ParamType": "GreaterEqual",
  "TargetParam": 30000,
  "HintStep": [
    0,
    30000
  ],
  "TargetName": {
    "Hash": 3905298046439386743
  },
  "TargetNameSimple": {
    "Hash": 14910763374163119994
  },
  "MultiTarget": [],
  "MultiTargetIconType": [],
  "IconType": "Round",
  "IconNum": 1,
  "SkipWhenSuccessOnEnterBattle": true
}
```

### MonopolyEventEffect.json (0.06 MB, 634 条)

**字段** (3): `EffectID, Type, TypeParam`

**首条记录摘要**:
```json
{
  "EffectID": 101,
  "Type": "SetRemainStep",
  "TypeParam": [
    1,
    0
  ]
}
```

### BattleFailureTipsConfig.json (0.06 MB, 73 条)

**字段** (15): `BattleFailureTipID, TipContent, GameModeList, PlayerLevel, WorldList, StageIDForce, MainMissionTakenForce, MainMissionFinishForce, MainMissionUnfinishForce, MazebuffIDList, MonsterTemplateIDList, CustomStringList, StageTypeForce, Priority, Type`

**首条记录摘要**:
```json
{
  "BattleFailureTipID": 1,
  "TipContent": {
    "Hash": 7533112957357412991
  },
  "GameModeList": "[\"Town\", \"Maze\", \"Challenge\", \"RogueExpl...",
  "PlayerLevel": [
    1,
    99
  ],
  "WorldList": [],
  "StageIDForce": [],
  "MainMissionTakenForce": [],
  "MainMissionFinishForce": [],
  "MainMissionUnfinishForce": [],
  "MazebuffIDList": [],
  "MonsterTemplateIDList": [],
  "CustomStringList": [],
  "StageTypeForce": [],
  "Priority": 10,
  "Type": "AvatarLevel"
}
```

### ILBattleAvatarPromotion.json (0.06 MB, 185 条)

**字段** (11): `ID, AvatarID, Trigger, ParamList, UnlockLevel, UnlockStar, PromotionDesc, IsProperty, PropertyType, Param, PropertyTarget`

**首条记录摘要**:
```json
{
  "ID": 100101,
  "AvatarID": 1001,
  "Trigger": "triggertest1",
  "ParamList": [],
  "UnlockLevel": 20,
  "UnlockStar": 2,
  "PromotionDesc": {
    "Hash": 1859712068028017973
  },
  "IsProperty": true,
  "PropertyType": "AttackAddedRatio",
  "Param": {
    "Value": 0.1
  },
  "PropertyTarget": "All"
}
```

### LimaoNewsPost.json (0.05 MB, 79 条)

**字段** (14): `DGLJLJEHNNB, NEPKPFOBEIO, GAPKKIEIEHE, BDKECJFBAJJ, MHLNDBFHHLF, HIHLLBFEONI, EFFFIJHJHMA, ODLDEEANNCM, EEIEODMEMFI, BDEBECLIHMD, BDACPPLKLGL, DPFCAIKMBEP, KJGJGNLACKF, LIDHGBEAJMA`

**首条记录摘要**:
```json
{
  "DGLJLJEHNNB": 101,
  "NEPKPFOBEIO": [
    2
  ],
  "GAPKKIEIEHE": "Auto",
  "BDKECJFBAJJ": [
    2400073
  ],
  "MHLNDBFHHLF": [],
  "HIHLLBFEONI": 3,
  "EFFFIJHJHMA": "Picture",
  "ODLDEEANNCM": "SpriteOutput/UI/LimaoNews/PostPic/post_1...",
  "EEIEODMEMFI": "",
  "BDEBECLIHMD": "",
  "BDACPPLKLGL": "",
  "DPFCAIKMBEP": {
    "Hash": 7745117516287334929
  },
  "KJGJGNLACKF": {
    "Hash": 13023016003766530778
  },
  "LIDHGBEAJMA": "[101001, 101002, 101003, 101004, 101005,..."
}
```

### TeleportConfig.json (0.05 MB, 462 条)

**字段** (5): `ID, PlaneID, FloorID, GroupID, ConfigID`

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

### ActivityDiceModifier.json (0.05 MB, 286 条)

**字段** (4): `LKOIJINLBBK, PNEIDAGEBOC, OLOIFNNLKJP, BOKJJKFCFME`

**首条记录摘要**:
```json
{
  "LKOIJINLBBK": 26400001,
  "PNEIDAGEBOC": 1,
  "OLOIFNNLKJP": "",
  "BOKJJKFCFME": 264000
}
```

### NPCMonsterMark.json (0.05 MB, 773 条)

**字段** (3): `ID, GroupID, InstanceID`

**首条记录摘要**:
```json
{
  "ID": 2000101,
  "GroupID": 3,
  "InstanceID": 200005
}
```

### RogueBuffGroup.json (0.05 MB, 546 条)

**字段** (2): `GMLOGNJAIGI, HECJCAMDGNO`

**首条记录摘要**:
```json
{
  "GMLOGNJAIGI": 12000,
  "HECJCAMDGNO": "[1203001, 1203101, 1203201, 1204001, 120..."
}
```

### ItemConfigAvatar.json (0.05 MB, 96 条)

**字段** (14): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "ItemMainType": "AvatarCard",
  "ItemSubType": "AvatarCard",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "ItemName": {
    "Hash": 5115085844323377115
  },
  "ItemBGDesc": {
    "Hash": 13926276512027878662
  },
  "ItemIconPath": "SpriteOutput/AvatarIcon/Avatar/1001.png",
  "ItemFigureIconPath": "SpriteOutput/AvatarIcon/Avatar/1001.png",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "SpriteOutput/AvatarShopIcon/Avatar/1001....",
  "PileLimit": 1,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### IdleLiveNode.json (0.05 MB, 129 条)

**字段** (10): `ChapterIndex, Index, SubNodeList, ChestLevel, RewardID, PossibleEventIDList, ChatPhase, EmojiPhaseID, LiveRoomExpGainOnFinished, BGMState`

**首条记录摘要**:
```json
{
  "ChapterIndex": 1,
  "Index": 1,
  "SubNodeList": [
    1011,
    1012,
    1013
  ],
  "ChestLevel": 1,
  "RewardID": 8016015,
  "PossibleEventIDList": [],
  "ChatPhase": 1001,
  "EmojiPhaseID": 1,
  "LiveRoomExpGainOnFinished": 100,
  "BGMState": "State_Menu_Season_Herta_Space_Station_Ba..."
}
```

### FarmElementConfig.json (0.05 MB, 203 条)

**字段** (8): `ID, MappingInfoID, DropList, StaminaCost, MaxChallengeCnt, DamageType, ParamList, StageID`

**首条记录摘要**:
```json
{
  "ID": 1101,
  "MappingInfoID": 1101,
  "DropList": [],
  "StaminaCost": 30,
  "MaxChallengeCnt": 8,
  "DamageType": [
    "Physical",
    "Wind",
    "Imaginary"
  ],
  "ParamList": [],
  "StageID": 1012010
}
```

### RogueNousDiceSurface.json (0.05 MB, 80 条)

**字段** (14): `SurfaceID, ItemID, DescParam, Icon, Rarity, SlotList, DiceActiveStage, Sort, ExtraDesc, TagList, UnlockDisplayID, SurfaceName, SurfaceDesc, BranchLimitaion`

**首条记录摘要**:
```json
{
  "SurfaceID": 2001,
  "ItemID": 250500,
  "DescParam": [],
  "Icon": "SpriteOutput/Rogue/DLC/Dice/SurfaceIcon/...",
  "Rarity": 3,
  "SlotList": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "DiceActiveStage": 1,
  "Sort": 1,
  "ExtraDesc": [
    61000011,
    61000013,
    61000009
  ],
  "TagList": [
    "BlockChange",
    "BuffProMax"
  ],
  "UnlockDisplayID": 101,
  "SurfaceName": {
    "Hash": 7167814852154582124
  },
  "SurfaceDesc": {
    "Hash": 3876252306278908249
  },
  "BranchLimitaion": "[101, 102, 103, 201, 202, 203, 301, 302,..."
}
```

### StoryAtlas.json (0.05 MB, 446 条)

**字段** (4): `AvatarID, StoryID, Story, Unlock`

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

**字段** (16): `StageID, StageType, StageName, HardLevelGroup, Level, LevelGraphPath, StageAbilityConfig, SubLevelGraphs, StageConfigData, MonsterList, LevelLoseCondition, LevelWinCondition, ForbidAutoBattle, ForbidExitBattle, MonsterWarningRatio, TrialAvatarList`

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
  "StageAbilityConfig": "[\"Activity_FateRin_Stage_Ability_Setup\",...",
  "SubLevelGraphs": "[{\"BFLIFKBEOPJ\": \"_DefaultSubStage\", \"KA...",
  "StageConfigData": "[{\"BFLIFKBEOPJ\": \"_Wave\", \"MNDFOPKBHKP\":...",
  "MonsterList": "[{\"Monster0\": 501202001, \"Monster1\": 501...",
  "LevelLoseCondition": [],
  "LevelWinCondition": "[\"[CDT_WaitCustomString:Level_SpecialWin...",
  "ForbidAutoBattle": true,
  "ForbidExitBattle": true,
  "MonsterWarningRatio": 1,
  "TrialAvatarList": []
}
```

### RogueTournFormulaDisplay.json (0.05 MB, 300 条)

**字段** (4): `FormulaDisplayID, FormulaStory, ExtraEffect, HandbookUnlockDisplayID`

**首条记录摘要**:
```json
{
  "FormulaDisplayID": 10114000,
  "FormulaStory": {
    "Hash": 5706619527573856621
  },
  "ExtraEffect": [],
  "HandbookUnlockDisplayID": 808
}
```

### ILBattleMonsterSkill.json (0.05 MB, 165 条)

**字段** (6): `ID, SkillTriggerKey, AttackType, InitialCD, CoolDown, ParamList`

**首条记录摘要**:
```json
{
  "ID": 101202001,
  "SkillTriggerKey": "Skill01",
  "AttackType": "Normal",
  "InitialCD": {
    "Value": 1
  },
  "CoolDown": {
    "Value": 4
  },
  "ParamList": "[{\"Value\": 0.4}, {\"Value\": 0}, {\"Value\":..."
}
```

### EndmostChroniclePerformance.json (0.05 MB, 547 条)

**字段** (4): `ID, Type, EndmostChronicleID, Order`

**首条记录摘要**:
```json
{
  "ID": 103010102,
  "Type": "D",
  "EndmostChronicleID": 1030101,
  "Order": 1
}
```

### RogueAreaConfig.json (0.05 MB, 38 条)

**字段** (14): `RogueAreaID, Difficulty, AreaEnvironment, RecommendLevel, RecommendNature, AreaNameID, AreaIcon, AreaFigure, DisplayMonsterMap, DisplayMonsterMap2, MapDisplayItemList, ChestDisplayItemList, ScoreMap, AreaTipsIcon`

**首条记录摘要**:
```json
{
  "RogueAreaID": 100,
  "Difficulty": 1,
  "AreaEnvironment": [],
  "RecommendLevel": 5,
  "RecommendNature": [
    "Ice"
  ],
  "AreaNameID": {
    "Hash": 10117035598078858438
  },
  "AreaIcon": "SpriteOutput/Rogue/World/PicRogueN2.png",
  "AreaFigure": "UI/Rogue/World/PicRogueN2.png",
  "DisplayMonsterMap": {
    "8003020": 8
  },
  "DisplayMonsterMap2": {},
  "MapDisplayItemList": [],
  "ChestDisplayItemList": [],
  "ScoreMap": {
    "3": 3600
  },
  "AreaTipsIcon": "SpriteOutput/Rogue/Planet/IconRoguePlane..."
}
```

### MazeSkill.json (0.05 MB, 202 条)

**字段** (6): `MazeSkillId, MazeSkillName, MazeSkilltype, MazeSkillDesc, RelatedAvatarSkill, SkillTriggerKey`

**首条记录摘要**:
```json
{
  "MazeSkillId": 100101,
  "MazeSkillName": {
    "Hash": 7167396225780900216
  },
  "MazeSkilltype": 1,
  "MazeSkillDesc": {
    "Hash": 6612596470888090439
  },
  "RelatedAvatarSkill": 100106,
  "SkillTriggerKey": "NormalAtk"
}
```

### ItemConfigPlayerRoomDynamic.json (0.05 MB, 79 条)

**字段** (16): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList, ItemGroup`

**首条记录摘要**:
```json
{
  "ID": 291001,
  "ItemMainType": "Material",
  "ItemSubType": "TrainPartyDiyMaterial",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "ItemName": {
    "Hash": 17450310681412571793
  },
  "ItemDesc": {
    "Hash": 15653177744920198895
  },
  "ItemBGDesc": {
    "Hash": 18022915134580072984
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/FurnitureIcon/2910...",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/FurnitureIcon/2...",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/FurnitureIcon/2910...",
  "ItemAvatarIconPath": "",
  "PileLimit": 100,
  "CustomDataList": [],
  "ReturnItemIDList": [],
  "ItemGroup": 1001
}
```

### VideoConfig.json (0.05 MB, 349 条)

**字段** (4): `VideoID, VideoPath, IsPlayerInvolved, CaptionPath`

**首条记录摘要**:
```json
{
  "VideoID": 1,
  "VideoPath": "CS_Chap01_Act010.usm",
  "IsPlayerInvolved": true,
  "CaptionPath": "Config/CutSceneCaption/CS_Chap01_Act010_..."
}
```

### PlanetFesFinishway.json (0.05 MB, 221 条)

**字段** (9): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress, IsBackTrack`

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

### RogueHandBookEvent.json (0.05 MB, 96 条)

**字段** (9): `EventHandbookID, UnlockNPCProgressIDList, EventTitle, EventType, EventReward, Order, EventTypeList, UnlockHintDesc, ImageID`

**首条记录摘要**:
```json
{
  "EventHandbookID": 1,
  "UnlockNPCProgressIDList": [
    {
      "FDOELDMEBPE": 40398
    }
  ],
  "EventTitle": {
    "Hash": 16491763588252988023
  },
  "EventType": {
    "Hash": 13528438480440474623
  },
  "EventReward": 106021,
  "Order": 57,
  "EventTypeList": [
    100
  ],
  "UnlockHintDesc": {
    "Hash": 4838455899358310382
  },
  "ImageID": 101
}
```

### IdleLiveChatStoryPhase.json (0.05 MB, 119 条)

**字段** (4): `ID, ChatList, Interval, FlySpeed`

**首条记录摘要**:
```json
{
  "ID": 101,
  "ChatList": "[300101002, 300101003, 300101004, 300101...",
  "Interval": 2,
  "FlySpeed": 1
}
```

### HeliobusPost.json (0.05 MB, 33 条)

**字段** (15): `HeliobusPostID, PostType, PostTypeParameter, PostUnlockPhase, PostUnlockSubMissionIDList, HeliobusUserID, PostImgID, HeliobusPostTitle, HeliobusPostContent, Likes, PlayerCommentIDList, PostIncomeReward, PostFansPreview, PostFansReward, IsClosePanel`

**首条记录摘要**:
```json
{
  "HeliobusPostID": 101,
  "PostType": "MissionMain",
  "PostTypeParameter": 8015101,
  "PostUnlockPhase": 1,
  "PostUnlockSubMissionIDList": [
    801519103
  ],
  "HeliobusUserID": 101,
  "PostImgID": 101,
  "HeliobusPostTitle": {
    "Hash": 499227738009209122
  },
  "HeliobusPostContent": {
    "Hash": 12441124696554909331
  },
  "Likes": "[{\"DOHOMJBJLLG\": 553}, {\"GNIFLCBGAAA\": 1...",
  "PlayerCommentIDList": [
    10100
  ],
  "PostIncomeReward": 8005001,
  "PostFansPreview": {
    "Hash": 6624939037943933109
  },
  "PostFansReward": "{\"0\": 10800, \"1\": 600, \"2\": 240, \"3\": 12...",
  "IsClosePanel": true
}
```

### EventMission.json (0.05 MB, 108 条)

**字段** (15): `ID, Type, Title, Desc, NextEventMissionList, TakeType, TakeParamIntList, FinishWayID, MazePlaneID, MazeFloorID, LoadGroupList, UnLoadGroupList, ClearGroupList, MissionJsonPath, RewardID`

**首条记录摘要**:
```json
{
  "ID": 100086,
  "Type": "Normal",
  "Title": {
    "Hash": 371857150
  },
  "Desc": {
    "Hash": 371857150
  },
  "NextEventMissionList": [],
  "TakeType": "Auto",
  "TakeParamIntList": [],
  "FinishWayID": 100086,
  "MazePlaneID": 10101,
  "MazeFloorID": 10101001,
  "LoadGroupList": [],
  "UnLoadGroupList": [],
  "ClearGroupList": [],
  "MissionJsonPath": "Config/Level/Mission/Common/Mission_Null...",
  "RewardID": 2000169
}
```

### ChestGroupProperty.json (0.05 MB, 271 条)

**字段** (7): `ChestID, FloorID, GroupID, InstanceID, LittleGameEntityID, GroupProperty, GPValue`

**首条记录摘要**:
```json
{
  "ChestID": 10501631,
  "FloorID": 10501001,
  "GroupID": 252,
  "InstanceID": 110001,
  "LittleGameEntityID": 40,
  "GroupProperty": "LG_110001__40_ChestStateS_Auto",
  "GPValue": 2
}
```

### ActivityHipplenIncident.json (0.05 MB, 103 条)

**字段** (5): `ID, PerformanceJsonConfigPath, EffectList, ExpectedBasicList, ExpectedRatioProbability`

**首条记录摘要**:
```json
{
  "ID": 30101,
  "PerformanceJsonConfigPath": "Config/Gameplays/Hipplen/Incident/Activi...",
  "EffectList": "[{\"LIPDNKKCKNN\": 1, \"NNACKOBKFGE\": \"3010...",
  "ExpectedBasicList": "[30101111, 30101112, 30101113, 30101114,...",
  "ExpectedRatioProbability": []
}
```

### RogueTournWeeklyChallenge.json (0.05 MB, 103 条)

**字段** (9): `ChallengeID, WeeklyName, WeeklyContentList, WeeklyContentDetailList, RewardID, DisplayFinalMonsterGroups, DisplayMonsterGroups1, DisplayMonsterGroups2, DisplayMonsterGroups3`

**首条记录摘要**:
```json
{
  "ChallengeID": 1,
  "WeeklyName": {
    "Hash": 16713295253780243020
  },
  "WeeklyContentList": [
    1011,
    1012,
    1003
  ],
  "WeeklyContentDetailList": [
    1001,
    1002
  ],
  "RewardID": 110701,
  "DisplayFinalMonsterGroups": {
    "0": 300402
  },
  "DisplayMonsterGroups1": {
    "0": 300202,
    "3": 300601
  },
  "DisplayMonsterGroups2": {
    "0": 300302,
    "3": 300701
  },
  "DisplayMonsterGroups3": {
    "0": 300402
  }
}
```

### ChimeraDuelChimeraPreset.json (0.05 MB, 550 条)

**字段** (2): `ChimeraPresetID, ChimeraID`

**首条记录摘要**:
```json
{
  "ChimeraPresetID": 1011,
  "ChimeraID": 108
}
```

### ItemConfigAvatarRank.json (0.05 MB, 91 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 11001,
  "ItemMainType": "Material",
  "ItemSubType": "Eidolon",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "ItemName": {
    "Hash": 10258558812087375294
  },
  "ItemDesc": {
    "Hash": 17141367724171878934
  },
  "ItemBGDesc": {
    "Hash": 6467139915672525026
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/11001.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/11001.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/11001.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 999,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### GridFightPortalBuff.json (0.05 MB, 84 条)

**字段** (14): `ID, JsonPath, EffectParamList, PortalBuffTitle, PortalBuffDesc, IconPath, ShowBonusID, ShowBonusIDList, IsOCEffective, PortalGameRefTrait, PortalGameRefScore, DelayedShowBonus, IfInBook, ShowNpcIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "JsonPath": "Config/Level/GridFight/PortalBuff/GridFi...",
  "EffectParamList": [
    {
      "Value": 2
    }
  ],
  "PortalBuffTitle": {
    "Hash": 9052694893348241712
  },
  "PortalBuffDesc": {
    "Hash": 9437218109261494594
  },
  "IconPath": "SpriteOutput/GridFight/Portal/101.png",
  "ShowBonusID": 40017,
  "ShowBonusIDList": [
    40017
  ],
  "IsOCEffective": 1,
  "PortalGameRefTrait": [],
  "PortalGameRefScore": [],
  "DelayedShowBonus": [],
  "IfInBook": true,
  "ShowNpcIDList": []
}
```

### EvoBdSCStagePeriod.json (0.05 MB, 56 条)

**字段** (13): `StagePeriodID, StageID, EventID, CountdownList, WeaknessList, PeriodScore, EmotionList, BattleArea, PeriodRank, WaveCount, StageScore, Weight, SpecialMonsterScoreList`

**首条记录摘要**:
```json
{
  "StagePeriodID": 424001,
  "StageID": 4240016,
  "EventID": 424001,
  "CountdownList": [
    99,
    99,
    99,
    99
  ],
  "WeaknessList": "[{\"GIBLLBPOJHN\": \"Fire\", \"NBPFHHJJBFG\": ...",
  "PeriodScore": 30000,
  "EmotionList": [
    0,
    0.2,
    0.5,
    0.8
  ],
  "BattleArea": 2041301,
  "PeriodRank": "PeriodFirst",
  "WaveCount": 4,
  "StageScore": 3000,
  "Weight": 100,
  "SpecialMonsterScoreList": {}
}
```

### ChimeraDuelTalkConfig.json (0.05 MB, 303 条)

**字段** (5): `TalkID, TriggerEventID, ID, Type, ChimeraDuelTalkText`

**首条记录摘要**:
```json
{
  "TalkID": 101001,
  "TriggerEventID": 5001,
  "ID": 101,
  "Type": "Chimera",
  "ChimeraDuelTalkText": {
    "Hash": 1084653355669836652
  }
}
```

### GridFightDivisionStage.json (0.05 MB, 97 条)

**字段** (13): `DivisionID, AffixChooseNumList, EnvironmentBuffList, UniqueEnvironmentDescList, EnvironmentDescList, SeasonID, ScoreRule, OCScoreRule, WeeklyScoreModify, ExpModify, JsonPath, LevelBaseHPMultiRatio, LevelBaseAttackMultiRatio`

**首条记录摘要**:
```json
{
  "DivisionID": 1,
  "AffixChooseNumList": [],
  "EnvironmentBuffList": [],
  "UniqueEnvironmentDescList": [],
  "EnvironmentDescList": [
    "GridFight_EnvironmentDesc_None"
  ],
  "SeasonID": 1,
  "ScoreRule": 801,
  "OCScoreRule": 801,
  "WeeklyScoreModify": 100,
  "ExpModify": 100,
  "JsonPath": "",
  "LevelBaseHPMultiRatio": {
    "Value": 1
  },
  "LevelBaseAttackMultiRatio": {
    "Value": 1
  }
}
```

### ShopConfig.json (0.05 MB, 98 条)

**字段** (15): `ShopID, ShopGroupID, ShopMainType, ShopType, ShopName, ShopDesc, ShopIconPath, ShopBar, ShopSortID, LimitType1, LimitValue1List, LimitValue2List, IsOpen, ScheduleDataID, HideRemainTime`

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

### EvolveBuildStagePeriod.json (0.05 MB, 57 条)

**字段** (14): `StagePeriodID, StageID, EventID, CountdownList, WeaknessList, PeriodScore, EmotionList, BattleArea, PeriodRank, WaveCount, DeadLinePosition, StageScore, Weight, SpecialMonsterScoreList`

**首条记录摘要**:
```json
{
  "StagePeriodID": 3097,
  "StageID": 3097,
  "EventID": 414011,
  "CountdownList": [
    20,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    5
  ],
  "WeaknessList": "[{\"GIBLLBPOJHN\": \"Fire\", \"NBPFHHJJBFG\": ...",
  "PeriodScore": 30000,
  "EmotionList": [
    0,
    0.2,
    0.5,
    0.8
  ],
  "BattleArea": 2000101,
  "PeriodRank": "PeriodFirst",
  "WaveCount": 10,
  "DeadLinePosition": {
    "Value": 0.4
  },
  "StageScore": 1500,
  "Weight": 100,
  "SpecialMonsterScoreList": {}
}
```

### RogueTournMiracleDisplay.json (0.05 MB, 166 条)

**字段** (5): `MiracleDisplayID, MiracleName, MiracleBGDesc, MiracleIconPath, MiracleFigureIconPath`

**首条记录摘要**:
```json
{
  "MiracleDisplayID": 6101,
  "MiracleName": {
    "Hash": 9202833263594178227
  },
  "MiracleBGDesc": {
    "Hash": 13812463557786566736
  },
  "MiracleIconPath": "SpriteOutput/Rogue/MiracleIcon/1003.png",
  "MiracleFigureIconPath": "SpriteOutput/Rogue/MiracleFigureIcon/100..."
}
```

### PerformanceReplayLOverride.json (0.05 MB, 163 条)

**字段** (9): `PerformanceType, PerformanceID, IsOverrideBranchFlag, OverrideIntent, OverrideActiveGroup, OverrideDeactiveGroup, OverridePropState, OverrideMissionAudioState, PatchLevelGraph`

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

### OfferingLevelConfig.json (0.05 MB, 552 条)

**字段** (4): `TypeID, Level, RewardID, ItemCost`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Level": 1,
  "RewardID": 119001,
  "ItemCost": 300
}
```

### DrinkMakerGuestComment.json (0.05 MB, 144 条)

**字段** (7): `CommentID, GuestID, Type, TriggerTypeParamList, CommentContent, IconPath, Weight`

**首条记录摘要**:
```json
{
  "CommentID": 11,
  "GuestID": 1,
  "Type": "Unsatisfactory",
  "TriggerTypeParamList": [],
  "CommentContent": {
    "Hash": 14780781291160292341
  },
  "IconPath": "SpriteOutput/Quest/DrinkMaker/DrinkMaker...",
  "Weight": 1
}
```

### PlanetFesQuest.json (0.05 MB, 165 条)

**字段** (7): `ID, QuestType, RewardItemList, FinishwayID, Name, Description, IconPath`

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

### LimaoNewsFinishway.json (0.05 MB, 200 条)

**字段** (7): `ID, FinishType, ParamType, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 2499999,
  "FinishType": "SubMissionFinishCnt",
  "ParamType": "ListContain",
  "ParamStr1": "",
  "ParamIntList": [
    804010118
  ],
  "ParamItemList": [],
  "Progress": 1
}
```

### MonopolyEventConfig.json (0.05 MB, 201 条)

**字段** (5): `EventID, Type, PicPath, EventOptionIDList, AutoTriggerEffectIDList`

**首条记录摘要**:
```json
{
  "EventID": 101,
  "Type": "Simple",
  "PicPath": "",
  "EventOptionIDList": [
    1011
  ],
  "AutoTriggerEffectIDList": []
}
```

### HeliobusUser.json (0.05 MB, 235 条)

**字段** (3): `HeliobusUserID, HeliobusUserName, UserIconPath`

**首条记录摘要**:
```json
{
  "HeliobusUserID": 1,
  "HeliobusUserName": {
    "Hash": 3907393653287306190
  },
  "UserIconPath": "SpriteOutput/Quest/Heliobus/HeliobusUser..."
}
```

### RogueTournHandBookEvent.json (0.04 MB, 118 条)

**字段** (8): `EventHandbookID, UnlockNPCProgressIDList, EventTitle, TypeDisplayID, UnlockDisplayID, Priority, IsUsed, ImageID`

**首条记录摘要**:
```json
{
  "EventHandbookID": 5,
  "UnlockNPCProgressIDList": "[{\"FDOELDMEBPE\": 410301}, {\"FDOELDMEBPE\"...",
  "EventTitle": {
    "Hash": 7000029817862836798
  },
  "TypeDisplayID": 801,
  "UnlockDisplayID": 804,
  "Priority": 5,
  "IsUsed": true,
  "ImageID": 101
}
```

### TextJoinItem.json (0.04 MB, 508 条)

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

### ActivityHipplenSentence.json (0.04 MB, 371 条)

**字段** (2): `ID, SentenceDesc`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "SentenceDesc": {
    "Hash": 17423896724394629438
  }
}
```

### FinishWayRogue.json (0.04 MB, 213 条)

**字段** (8): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "FinishType": "RogueAeonLevel",
  "ParamType": "EqualOrZeroAny",
  "ParamInt1": 1,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### GridFightStageRoute.json (0.04 MB, 493 条)

**字段** (4): `ID, ChapterID, SectionID, NodeTemplateID`

**首条记录摘要**:
```json
{
  "ID": 100,
  "ChapterID": 1,
  "SectionID": 1,
  "NodeTemplateID": 10011
}
```

### GridFightPenaltyRule.json (0.04 MB, 114 条)

**字段** (7): `ID, ProgressValueList, HPProgressValueList, ThresholdPassBasicPlayerHPPenalty, ProgressPenaltyCoefficient, TotalTurn, AvatarReviveDelayLose`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ProgressValueList": [
    2,
    3,
    10,
    15,
    0,
    0
  ],
  "HPProgressValueList": [
    0,
    0,
    0,
    0,
    100,
    100
  ],
  "ThresholdPassBasicPlayerHPPenalty": 5,
  "ProgressPenaltyCoefficient": 10,
  "TotalTurn": {
    "Value": 99
  },
  "AvatarReviveDelayLose": {
    "Value": 0.25
  }
}
```

### PixAirEquipEnchantConfig.json (0.04 MB, 450 条)

**字段** (3): `EquipID, EnchantType, SkillList`

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

### LoopCGConfig.json (0.04 MB, 441 条)

**字段** (3): `VideoID, VideoPath, CaptionPath`

**首条记录摘要**:
```json
{
  "VideoID": 101,
  "VideoPath": "CS_ChapLoop01_Act0010.usm",
  "CaptionPath": ""
}
```

### ItemConfigAvatarPlayerIcon.json (0.04 MB, 91 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, UseMethod, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 201001,
  "ItemMainType": "Usable",
  "ItemSubType": "HeadIcon",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "isVisible": true,
  "ItemName": {
    "Hash": 3109440993392776578
  },
  "ItemIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001...",
  "ItemFigureIconPath": "",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "",
  "PileLimit": 1,
  "UseMethod": "AutoConversionItem",
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### SwordTrainingEventOption.json (0.04 MB, 120 条)

**字段** (6): `OptionID, EffectIDList, OptionDesc, ResultDesc, ResultImage, ResultAudio`

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

**字段** (7): `PartnerAbilityID, EffectIDList, Rare, AbilityIcon, AbilityName, AbilityDesc, DescParamList`

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

### GameplayGuideData.json (0.04 MB, 111 条)

**字段** (12): `ID, Name, Order, IconPath, TabIconPath, MapEntranceID, ShowItemAmount, UnlockMission, TabID, RelatedID, OverrideShowCondition, SubType`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Name": {
    "Hash": 15273583115720605064
  },
  "Order": 1001,
  "IconPath": "SpriteOutput/DailyMission/AvatarRelicPac...",
  "TabIconPath": "",
  "MapEntranceID": 2010101,
  "ShowItemAmount": 1,
  "UnlockMission": [
    4010121
  ],
  "TabID": 1001,
  "RelatedID": 1001,
  "OverrideShowCondition": [],
  "SubType": 201
}
```

### ChronicleConclusion.json (0.04 MB, 428 条)

**字段** (2): `MissionID, MissionConclusion`

**首条记录摘要**:
```json
{
  "MissionID": 1000101,
  "MissionConclusion": {
    "Hash": 6221540891368254044
  }
}
```

### MatchThreeScoreCurve.json (0.04 MB, 444 条)

**字段** (4): `CurveID, PlayerStep, DelayTime, AddCurveRatio`

**首条记录摘要**:
```json
{
  "CurveID": 1111,
  "PlayerStep": 1,
  "DelayTime": 1,
  "AddCurveRatio": 3
}
```

### MonsterTemplateUniqueConfig.json (0.04 MB, 29 条)

**字段** (24): `MonsterName, MonsterStrategy, MonsterTemplateID, Rank, NPCMonsterList, IconPath, RoundIconPath, ImagePath, ManikinImagePath, JsonConfig, PrefabPath, ManikinPrefabPath, ManikinConfigPath, AttackBase, HPBase, SpeedBase, StanceBase, InitialDelayRatio, StanceCount, StanceType, AIPath, AISkillSequence, NatureID, MinimumFatigueRatio`

**首条记录摘要**:
```json
{
  "MonsterName": {
    "Hash": 7263979482598087016
  },
  "MonsterStrategy": [],
  "MonsterTemplateID": 7001010,
  "Rank": "Minion",
  "NPCMonsterList": [],
  "IconPath": "SpriteOutput/MosterIcon/Monster_2011010....",
  "RoundIconPath": "SpriteOutput/MonsterRoundIcon/Monster_20...",
  "ImagePath": "SpriteOutput/MonsterFigure/Monster_20110...",
  "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_2...",
  "JsonConfig": "Config/ConfigCharacter/Monster/Monster_A...",
  "PrefabPath": "Characters/CharacterPrefabs/Monster/Aeth...",
  "ManikinPrefabPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M...",
  "AttackBase": {
    "Value": 18
  },
  "HPBase": {
    "Value": 1395
  },
  "SpeedBase": {
    "Value": 95
  },
  "StanceBase": {
    "Value": 30
  },
  "InitialDelayRatio": {
    "Value": 1
  },
  "StanceCount": 1,
  "StanceType": "Physical",
  "AIPath": "Config/ConfigAI/Monster_Common_SequenceT...",
  "AISkillSequence": "[{\"MNAHFIGOHML\": 700101001}, {\"MNAHFIGOH...",
  "NatureID": 1,
  "MinimumFatigueRatio": {
    "Value": 0.2
  }
}
```

### RogueDLCChessBoard.json (0.04 MB, 216 条)

**字段** (4): `ChessBoardID, ChessBoardConfiguration, BlockCreatGroupID, ChessBoardEventList`

**首条记录摘要**:
```json
{
  "ChessBoardID": 10111,
  "ChessBoardConfiguration": "Config/Gameplays/RogueDLC/RogueDLC_Tutor...",
  "BlockCreatGroupID": 10111,
  "ChessBoardEventList": []
}
```

### ChimeraDuelChimera.json (0.04 MB, 73 条)

**字段** (15): `ChimeraID, ChimeraName, Price, Rarity, BaseAttack, BaseHp, ChimeraIconPath, ChimeraHeadIconPath, ModelBody, ModelHorn, ModelWing, ModelTail, ModelEye, ModelItemMatOverride, EmojiPath`

**首条记录摘要**:
```json
{
  "ChimeraID": 101,
  "ChimeraName": {
    "Hash": 13400984576048883831
  },
  "Price": 3,
  "Rarity": 1,
  "BaseAttack": 1,
  "BaseHp": 3,
  "ChimeraIconPath": "SpriteOutput/Quest/ChimeraDuel/Chimera/C...",
  "ChimeraHeadIconPath": "SpriteOutput/Quest/ChimeraDuel/ChimeraHe...",
  "ModelBody": "PurePurple",
  "ModelHorn": "Bull",
  "ModelWing": "Angel",
  "ModelTail": "Normal",
  "ModelEye": "Default",
  "ModelItemMatOverride": "",
  "EmojiPath": ""
}
```

### HeartDialDialogue.json (0.04 MB, 700 条)

**字段** (2): `ID, ControlTalkList`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "ControlTalkList": []
}
```

### MainMissionSchedule.json (0.04 MB, 457 条)

**字段** (2): `MainMissionID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "MainMissionID": 8000101,
  "ActivityModuleID": 3000201
}
```

### TreasureDungeonGrid.json (0.04 MB, 118 条)

**字段** (5): `GridType, TypeParam, IconPath, IconPath2D, TutorialTriggerString`

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

### IntroData.json (0.04 MB, 215 条)

**字段** (4): `ID, Title, Desc, Desc_Os`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Title": {
    "Hash": 13590640095077714833
  },
  "Desc": {
    "Hash": 10994966869424268828
  },
  "Desc_Os": {
    "Hash": 10994966869424268828
  }
}
```

### GridFightAffixMazebuff.json (0.04 MB, 67 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35301001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_35301001",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_MonsterTag_1001",
  "ParamList": [
    {
      "Value": 0.6
    },
    {
      "Value": 0.3
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 11973524563197982816
  },
  "BuffDesc": {
    "Hash": 203591965729467267
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### AetherDivideSpirit.json (0.04 MB, 19 条)

**字段** (29): `AvatarID, AvatarName, SpiritDescription, SpiritUnlockDescription, Rarity, SPMax, JsonPath, ManikinJsonPath, AvatarSideIconPath, GymLocation, MaxPromotion, SkillList, DefaultAvatarHeadIconPath, AtlasAvatarHeadIconPath, MiddleAvatarHeadIconPath, TeamLeftPrefabPath, TeamRightPrefabPath, WaitingAvatarHeadIconPath, ActionAvatarHeadIconPath, SideAvatarHeadIconPath, UltraSkillCutInPrefabPath, DefaultAvatarModelPath, ManikinAvatarModelPath, AIPath, PassiveSkillSlotList, ExpItemID, AvatarVOTag, DamageType, RecommendPassiveSkillList`

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

### GridFightItems.json (0.04 MB, 165 条)

**字段** (5): `ID, ItemPriority, IconPath, SmallIconPath, ItemName`

**首条记录摘要**:
```json
{
  "ID": 350101,
  "ItemPriority": 1,
  "IconPath": "SpriteOutput/GridFight/Equipment/350101....",
  "SmallIconPath": "SpriteOutput/GridFight/EquipmentSmall/35...",
  "ItemName": {
    "Hash": 10537163807765380095
  }
}
```

### GridFightBackBEData.json (0.04 MB, 120 条)

**字段** (7): `BattleEventID, Config, Prefab, LevelAreaPrefab, BEActionBarPrefab, BasePoint, SkillIDList`

**首条记录摘要**:
```json
{
  "BattleEventID": 62200,
  "Config": "",
  "Prefab": "",
  "LevelAreaPrefab": "",
  "BEActionBarPrefab": "",
  "BasePoint": "",
  "SkillIDList": []
}
```

### MissionChapterConfig.json (0.04 MB, 74 条)

**字段** (9): `ID, ChapterName, StageName, ChapterDesc, ChapterType, LinkChapterList, ChapterDisplayPriority, ChapterIconPath, ChapterFigureIconPath`

**首条记录摘要**:
```json
{
  "ID": 999001,
  "ChapterName": "",
  "StageName": "",
  "ChapterDesc": "",
  "ChapterType": "Normal",
  "LinkChapterList": [],
  "ChapterDisplayPriority": 100,
  "ChapterIconPath": "SpriteOutput/Mission/ChapterIcon/Chapter...",
  "ChapterFigureIconPath": "SpriteOutput/Mission/ChapterIconBig/Chap..."
}
```

### PixAirEquipLevelConfig.json (0.04 MB, 213 条)

**字段** (6): `EquipID, EquipLevel, CoolDown, DamagePower, ChargePower, SkillList`

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

### GridFightRoleBasicInfo.json (0.04 MB, 77 条)

**字段** (15): `ID, AvatarID, SeasonIDList, FrontBackType, Rarity, HealOrShieldDisplay, ChargeType, MaxSPIcon, TraitList, IsInPool, IsInBook, BackendRankList, SpecialAvatarID, SeasonID, RoleSavedValueList`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "AvatarID": 1001,
  "SeasonIDList": [],
  "FrontBackType": "Back",
  "Rarity": 1,
  "HealOrShieldDisplay": "Shield",
  "ChargeType": [
    "Speed"
  ],
  "MaxSPIcon": "",
  "TraitList": [
    1001,
    2010
  ],
  "IsInPool": true,
  "IsInBook": true,
  "BackendRankList": "[100101, 100102, 100103, 100104, 100105,...",
  "SpecialAvatarID": 3701001,
  "SeasonID": 1,
  "RoleSavedValueList": [
    "GP_Avatar_Mar_7th_01"
  ]
}
```

### AdventurePlayer.json (0.04 MB, 91 条)

**字段** (7): `ID, AvatarID, PlayerName, PlayerPrefabPath, PlayerJsonPath, DefaultAvatarHeadIconPath, MazeSkillIdList`

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

### ChimeraTalk.json (0.04 MB, 295 条)

**字段** (3): `TalkID, TalkContent, EvPath`

**首条记录摘要**:
```json
{
  "TalkID": 101001,
  "TalkContent": {
    "Hash": 11730041925149019505
  },
  "EvPath": "Ev_vo_wsw_work01_01"
}
```

### FuncEntrance.json (0.04 MB, 80 条)

**字段** (14): `ID, FuncName, FuncIconPath, FuncHudIconPath, GotoID, UnlockMainMission, UnlockID, UnlockDesc, RedDot, RedDotHud, UnlockPrompt, UnLockIconPath, NotInScheduleToast, FirstWorldText`

**首条记录摘要**:
```json
{
  "ID": 2,
  "FuncName": {
    "Hash": 1405076994
  },
  "FuncIconPath": "SpriteOutput/PhoneAPPIcon/MapIcon.png",
  "FuncHudIconPath": "SpriteOutput/PhoneAPPIcon/MapIcon.png",
  "GotoID": 200,
  "UnlockMainMission": 1010301,
  "UnlockID": 200,
  "UnlockDesc": {
    "Hash": -693209280
  },
  "RedDot": "",
  "RedDotHud": "",
  "UnlockPrompt": "Entrance",
  "UnLockIconPath": "SpriteOutput/PhoneAPPIcon/MapIcon.png",
  "NotInScheduleToast": {
    "Hash": 371857150
  },
  "FirstWorldText": ""
}
```

### ActivityDiceStageConfig.json (0.04 MB, 144 条)

**字段** (10): `DiceStageID, DiceAvatarID, DiceAvatarLevel, DiceIDPerRare, PresetID, AILevel, RewardID, HardLevel, OverWriteMaxHPLuckControl, RecommendAvatarList`

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

### BattlePassLevel.json (0.04 MB, 350 条)

**字段** (4): `GroupID, Level, FreeReward, PremiumFixedReward1`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "Level": 1,
  "FreeReward": 120001,
  "PremiumFixedReward1": 120101
}
```

### ActivityResidentPanel.json (0.04 MB, 35 条)

**字段** (11): `PanelID, SortWeight, FinishConditions, PanelDesc, IntroDesc, EntranceImg, DisplayItemList, DisplayItemManualSort, ExpectTime, IntroGuideVideoID, IntroGuideImg`

**首条记录摘要**:
```json
{
  "PanelID": 50003,
  "SortWeight": 6012,
  "FinishConditions": "[{\"Type\": \"FinishQuest\", \"Param\": \"60131...",
  "PanelDesc": {
    "Hash": 9458567706652469545
  },
  "IntroDesc": {
    "Hash": 13375576847739960114
  },
  "EntranceImg": "SpriteOutput/Quest/TabIcon/PermanentActi...",
  "DisplayItemList": "[{\"ItemID\": 22}, {\"ItemID\": 241}, {\"Item...",
  "DisplayItemManualSort": true,
  "ExpectTime": {
    "Value": 2
  },
  "IntroGuideVideoID": 50003,
  "IntroGuideImg": ""
}
```

### ActivityQuestRewardData.json (0.04 MB, 174 条)

**字段** (4): `QuestTabID, QuestTabName, QuestList, ActivityModuleID`

**首条记录摘要**:
```json
{
  "QuestTabID": 10001,
  "QuestTabName": {
    "Hash": 164194306843482777
  },
  "QuestList": "[6017201, 6017202, 6017209, 6017210, 601...",
  "ActivityModuleID": 5000701
}
```

### PerformanceReplayOverride.json (0.04 MB, 298 条)

**字段** (3): `PerformanceType, PerformanceID, Desc`

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

### GridFightCombinationBonus.json (0.04 MB, 230 条)

**字段** (3): `BonusID, CombinationBonusList, BonusNumberList`

**首条记录摘要**:
```json
{
  "BonusID": 11001,
  "CombinationBonusList": [
    1,
    201
  ],
  "BonusNumberList": [
    20000,
    10000
  ]
}
```

### EvoBdSCGearConfig.json (0.04 MB, 198 条)

**字段** (6): `GearID, IndexList, SimpIndexList, DynamicIndexList, Level, MazeBuffID`

**首条记录摘要**:
```json
{
  "GearID": 3113001,
  "IndexList": [
    2,
    3
  ],
  "SimpIndexList": [],
  "DynamicIndexList": [],
  "Level": 1,
  "MazeBuffID": 3113001
}
```

### GridFightEliteGroup.json (0.04 MB, 146 条)

**字段** (6): `EliteGroup, AttackRatio, DefenceRatio, HPRatio, SpeedRatio, StanceRatio`

**首条记录摘要**:
```json
{
  "EliteGroup": 831,
  "AttackRatio": {
    "Value": 0.6
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  },
  "SpeedRatio": {
    "Value": 1
  },
  "StanceRatio": {
    "Value": 1
  }
}
```

### FateReiju.json (0.04 MB, 70 条)

**字段** (11): `IGOAKKNPDKK, PHFPFCALNDJ, KJOAJDBDOBN, ENHOJEFAFNM, BACLIEMHMDK, GDLBCMFFGOI, MDEBFIFOKHH, KBNHPKIOGLH, BEOGEKDEPLO, LBLJLNPBDPB, GDLLGLFCEHC`

**首条记录摘要**:
```json
{
  "IGOAKKNPDKK": 2101,
  "PHFPFCALNDJ": [
    1,
    2,
    3
  ],
  "KJOAJDBDOBN": "BoundEnhance",
  "ENHOJEFAFNM": {
    "Hash": 2651070685285826733
  },
  "BACLIEMHMDK": {
    "Hash": 6467143643474135992
  },
  "GDLBCMFFGOI": {
    "Hash": 15386818773360517919
  },
  "MDEBFIFOKHH": [
    {
      "Value": 1
    },
    {
      "Value": 1
    }
  ],
  "KBNHPKIOGLH": {
    "Hash": 8823436758381905109
  },
  "BEOGEKDEPLO": [],
  "LBLJLNPBDPB": "Config/Gameplays/Fate/ReijuConfig/FateRe...",
  "GDLLGLFCEHC": 2
}
```

### GridFightRoleSkillDisplay.json (0.04 MB, 154 条)

**字段** (5): `RoleID, FrontBackType, Name, IconPath, CategoryTagList`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "FrontBackType": "Back",
  "Name": {
    "Hash": 10699595132174638196
  },
  "IconPath": "SpriteOutput/SkillIcons/Avatar/1001/Skil...",
  "CategoryTagList": [
    "Shield"
  ]
}
```

### IdleLiveCLTrigger.json (0.04 MB, 342 条)

**字段** (3): `TriggerID, Type, ParamList`

**首条记录摘要**:
```json
{
  "TriggerID": 1,
  "Type": "KillMonsterCount",
  "ParamList": [
    "1"
  ]
}
```

### MonsterUniqueConfig.json (0.04 MB, 35 条)

**字段** (24): `MonsterName, MonsterIntroduction, MonsterStrategy, MonsterID, MonsterTemplateID, EliteGroup, HardLevelGroup, AttackModifyRatio, DefenceModifyRatio, HPModifyRatio, SpeedModifyRatio, StanceModifyRatio, StanceWeakList, DamageTypeResistance, DebuffResist, CustomValueTags, CustomValues, DynamicValues, SummonIDList, OverrideAIPath, OverrideAISkillSequence, AbilityNameList, SkillList, OverrideSkillParams`

**首条记录摘要**:
```json
{
  "MonsterName": {
    "Hash": 7263979482598087016
  },
  "MonsterIntroduction": {
    "Hash": 582352897848256449
  },
  "MonsterStrategy": [],
  "MonsterID": 7001010,
  "MonsterTemplateID": 7001010,
  "EliteGroup": 1,
  "HardLevelGroup": 1,
  "AttackModifyRatio": {
    "Value": 1
  },
  "DefenceModifyRatio": {
    "Value": 1
  },
  "HPModifyRatio": {
    "Value": 1
  },
  "SpeedModifyRatio": {
    "Value": 1
  },
  "StanceModifyRatio": {
    "Value": 1
  },
  "StanceWeakList": "[\"Physical\", \"Fire\", \"Ice\", \"Thunder\", \"...",
  "DamageTypeResistance": [],
  "DebuffResist": [],
  "CustomValueTags": [],
  "CustomValues": [],
  "DynamicValues": [],
  "SummonIDList": [],
  "OverrideAIPath": "",
  "OverrideAISkillSequence": [],
  "AbilityNameList": [],
  "SkillList": [
    700101001,
    700101002,
    700101003
  ],
  "OverrideSkillParams": []
}
```

### AvatarLinkConfig.json (0.03 MB, 672 条)

**字段** (2): `AvatarID, LinkAvatar`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "LinkAvatar": 8001
}
```

### ChenLingFesItem.json (0.03 MB, 59 条)

**字段** (14): `ID, LogicJsonPath, ViewJsonPath, ItemName, ParamList, BaseCoinNum, BaseMaxEffectTriggerNum, BaseProbability, BaseLoopInterval, ItemDesc, Rare, TagList, EffectItemTypeList, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LogicJsonPath": "Config/Gameplays/LittleGame/ChenLingFes/...",
  "ViewJsonPath": "",
  "ItemName": {
    "Hash": 11551764337870441968
  },
  "ParamList": [
    30
  ],
  "BaseCoinNum": "#1",
  "BaseMaxEffectTriggerNum": "",
  "BaseProbability": "",
  "BaseLoopInterval": "",
  "ItemDesc": {
    "Hash": 14896889252899792282
  },
  "Rare": "Normal",
  "TagList": [],
  "EffectItemTypeList": [],
  "IconPath": "Gameplays/ChenLingFes/Prefab/ScreenShots..."
}
```

### ItemConfigTrainDynamic.json (0.03 MB, 52 条)

**字段** (16): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemDesc, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList, ItemGroup`

**首条记录摘要**:
```json
{
  "ID": 291001,
  "ItemMainType": "Material",
  "ItemSubType": "TrainPartyDiyMaterial",
  "InventoryDisplayTag": 1,
  "Rarity": "VeryRare",
  "ItemName": {
    "Hash": 18275679769456901297
  },
  "ItemDesc": {
    "Hash": 216043791385183611
  },
  "ItemBGDesc": {
    "Hash": 1015777491491260694
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/FurnitureIcon/2910...",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/FurnitureIcon/2...",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/FurnitureIcon/2910...",
  "ItemAvatarIconPath": "",
  "PileLimit": 100,
  "CustomDataList": [],
  "ReturnItemIDList": [],
  "ItemGroup": 1001
}
```

### GridFightAugmentMazebuff.json (0.03 MB, 57 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35401001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 3,
  "ModifierName": "ADV_StageAbility_35401001",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_MonsterTag_1001",
  "ParamList": [
    {
      "Value": 0.3
    },
    {
      "Value": 0.3
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 18118184519004368802
  },
  "BuffDesc": {
    "Hash": 2068835060799850456
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### RogueTournNPC.json (0.03 MB, 309 条)

**字段** (2): `RogueNPCID, NPCJsonPath`

**首条记录摘要**:
```json
{
  "RogueNPCID": 410001,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC_230..."
}
```

### GridFightRoleRecommendEquip.json (0.03 MB, 154 条)

**字段** (4): `RoleID, FrontBackType, FirstRecommendEquipList, SecondRecommendEquipList`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "FrontBackType": "Back",
  "FirstRecommendEquipList": [
    35030203,
    35030608,
    35030508
  ],
  "SecondRecommendEquipList": [
    35030506,
    35030206,
    35030305
  ]
}
```

### ActivityHipplenGame.json (0.03 MB, 101 条)

**字段** (2): `ID, EffectList`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "EffectList": "[{\"NNACKOBKFGE\": \"1010111;1010112;101011..."
}
```

### RogueManager.json (0.03 MB, 78 条)

**字段** (6): `RogueSeason, RogueVersion, RogueAreaIDList, BeginTime, EndTime, ScheduleDataID`

**首条记录摘要**:
```json
{
  "RogueSeason": 1,
  "RogueVersion": 1,
  "RogueAreaIDList": [],
  "BeginTime": "2021-05-30 04:00:00",
  "EndTime": "2022-05-30 03:59:59",
  "ScheduleDataID": 100001
}
```

### AvatarDemoGuide.json (0.03 MB, 310 条)

**字段** (2): `StageID, AvatarDemoIntroduction`

**首条记录摘要**:
```json
{
  "StageID": 311020,
  "AvatarDemoIntroduction": {
    "Hash": 11551778507788622741
  }
}
```

### ClientLogConfig.json (0.03 MB, 153 条)

**字段** (3): `ID, Actionid, Params`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Actionid": 1026,
  "Params": "{\"ArrayValue\": [{\"StringValue\": \"PID\"}, ..."
}
```

### GridFightElationEquip.json (0.03 MB, 126 条)

**字段** (3): `ID, ElationEquipDesc, ParamList`

**首条记录摘要**:
```json
{
  "ID": 350201,
  "ElationEquipDesc": {
    "Hash": 4387124778405518223
  },
  "ParamList": [
    {
      "Value": 0.05
    }
  ]
}
```

### GuideChallengeData.json (0.03 MB, 96 条)

**字段** (6): `ID, Name, IconPath, TabIconPath, UnlockConditions, TabID`

**首条记录摘要**:
```json
{
  "ID": 9999,
  "Name": {
    "Hash": 6410641494565517684
  },
  "IconPath": "",
  "TabIconPath": "",
  "UnlockConditions": [
    {
      "Type": "PlayerLevel",
      "Param": "21"
    }
  ],
  "TabID": 1001
}
```

### BackGroundMusicNormal.json (0.03 MB, 252 条)

**字段** (4): `PHFMCACHFIJ, KILDBPGFAPG, PNOPJBELEDM, FCHEGBOMJHB`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 210000,
  "KILDBPGFAPG": "BGM_Spacetrain",
  "PNOPJBELEDM": 112,
  "FCHEGBOMJHB": "TYPE_EASY"
}
```

### EvolveBuildGearConfig.json (0.03 MB, 181 条)

**字段** (6): `GearID, IndexList, SimpIndexList, DynamicIndexList, Level, MazeBuffID`

**首条记录摘要**:
```json
{
  "GearID": 3106001,
  "IndexList": [
    4,
    2
  ],
  "SimpIndexList": [],
  "DynamicIndexList": [],
  "Level": 1,
  "MazeBuffID": 3106001
}
```

### GridFightTraitMazebuffPlus.json (0.03 MB, 154 条)

**字段** (3): `MazebuffID, ShowStanceList, BEParamList`

**首条记录摘要**:
```json
{
  "MazebuffID": 35100101,
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "BEParamList": "[{\"Value\": 0}, {\"Value\": 0.2}, {\"Value\":..."
}
```

### TreasureDungeonBuff.json (0.03 MB, 125 条)

**字段** (6): `BuffID, Type, TypeParam, ParamInt, DisplayRarity, FigurePath`

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

### RogueMagicScepter.json (0.03 MB, 72 条)

**字段** (10): `ScepterID, ScepterLevel, LockMagicUnit, TrenchCount, FuncType, StyleType, ScepterBasicPower, StaffMazeBuffID, LimitRangeType, EffectTypeList`

**首条记录摘要**:
```json
{
  "ScepterID": 2001,
  "ScepterLevel": 1,
  "LockMagicUnit": "[{\"GDDPJLJKGEO\": 4001, \"LPCBFACBGAE\": 1}...",
  "TrenchCount": {
    "Active": 1,
    "Attach": 1,
    "Passive": 2
  },
  "FuncType": "SP",
  "StyleType": "Dot",
  "ScepterBasicPower": {
    "Value": 150
  },
  "StaffMazeBuffID": 682010,
  "LimitRangeType": "Eject",
  "EffectTypeList": [
    "Stack",
    "Turn"
  ]
}
```

### GridFightTraitRemark.json (0.03 MB, 58 条)

**字段** (10): `ID, Position, TextOrder, TraitRemark, TraitSimpleRemark, Format, ConditionType, ConditionParamList, TraitRemarkParamList, IsInBook`

**首条记录摘要**:
```json
{
  "ID": 1002,
  "Position": "Back",
  "TextOrder": 2,
  "TraitRemark": {
    "Hash": 1850822872832395150
  },
  "TraitSimpleRemark": {
    "Hash": 8828794964573923387
  },
  "Format": "GreyToHighlight",
  "ConditionType": "ExpertActivate",
  "ConditionParamList": [
    1205
  ],
  "TraitRemarkParamList": "[{\"Value\": 4}, {\"Value\": 4}, {\"Value\": 5...",
  "IsInBook": true
}
```

### BoxingClubStageGroup.json (0.03 MB, 43 条)

**字段** (6): `StageGroupID, EventIDList, Weight, MonsterIDList, DisplayEventIDList, DisplayIndexList`

**首条记录摘要**:
```json
{
  "StageGroupID": 10,
  "EventIDList": [
    304004,
    304002,
    304009,
    304010
  ],
  "Weight": 9999,
  "MonsterIDList": "[1002040, 1002050, 1003010, 1002030, 101...",
  "DisplayEventIDList": "[304002, 304003, 304008, 304027, 304024,...",
  "DisplayIndexList": [
    9,
    5,
    1,
    12
  ]
}
```

### PerformanceSkipCharacter.json (0.03 MB, 256 条)

**字段** (2): `TalkSentenceName, IconPath`

**首条记录摘要**:
```json
{
  "TalkSentenceName": "TalkSentenceName_Mar_7th",
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001..."
}
```

### StroyLineUIData.json (0.03 MB, 66 条)

**字段** (8): `Gender, Name, IconPath, ChronicleIconPath, MediumImgPath, LargeImgPath, FigurePath, Color`

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

### FreeStyleCharacterInfo.json (0.03 MB, 292 条)

**字段** (3): `FreeStyleCharacterID, AvatarFlagID, AvatarBodyID`

**首条记录摘要**:
```json
{
  "FreeStyleCharacterID": "NPC_Male",
  "AvatarFlagID": 1,
  "AvatarBodyID": 1
}
```

### RechargeConfig.json (0.03 MB, 131 条)

**字段** (9): `ProductID, TierID, GiftType, FirstCharge, ListOrder, GiftName, GiftImage, FirstRechangeConfirm, NormalRechargeConfirm`

**首条记录摘要**:
```json
{
  "ProductID": "rpgchncoin60tier1",
  "TierID": "Tier_1",
  "GiftType": 1,
  "FirstCharge": 60,
  "ListOrder": 1,
  "GiftName": {
    "Hash": 8571471899151841129
  },
  "GiftImage": "SpriteOutput/ItemFigures/3-t1.png",
  "FirstRechangeConfirm": {
    "Hash": 16675377132639930049
  },
  "NormalRechargeConfirm": {
    "Hash": 11629888359110689337
  }
}
```

### AvatarTestSkillConfig.json (0.03 MB, 4,079 条)

### MarbleRandomBuff.json (0.03 MB, 76 条)

**字段** (12): `ID, ActivityID, GameMode, Name, Desc, ParamList, IconPath, EffectType, EffectParam, ConditionList, Weight, UnlockSubMission`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityID": 50029,
  "GameMode": "MARBLE",
  "Name": {
    "Hash": 10266392257552005485
  },
  "Desc": {
    "Hash": 1335123673348389684
  },
  "ParamList": [
    60
  ],
  "IconPath": "",
  "EffectType": 1,
  "EffectParam": 1,
  "ConditionList": [
    1
  ],
  "Weight": 15,
  "UnlockSubMission": 803210001
}
```

### ActivityPanelCondition.json (0.03 MB, 94 条)

**字段** (3): `PanelID, PreConditions, GuideConditions`

**首条记录摘要**:
```json
{
  "PanelID": 30006,
  "PreConditions": [],
  "GuideConditions": "[{\"Type\": \"FinishMainMission\", \"Param\": ..."
}
```

### ConstValueCommon.json (0.03 MB, 274 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Equipment_Exp_Recyle_Ratio",
  "Value": {
    "IntValue": 80
  }
}
```

### AetherDivideSpiritPromotion.json (0.03 MB, 114 条)

**字段** (8): `AvatarID, Promotion, AttackBase, HPBase, SpeedBase, BaseAggro, Exp, SpecialSkillList`

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

### ChallengeGroupConfig.json (0.03 MB, 55 条)

**字段** (12): `GroupID, GroupName, RewardLineGroupID, PreMissionID, MapEntranceID, MappingInfoID, WorldID, BackGroundPath, TabPicPath, TabPicSelectPath, ChallengeGroupType, ThemePicPath`

**首条记录摘要**:
```json
{
  "GroupID": 100,
  "GroupName": {
    "Hash": 13535919676396601281
  },
  "RewardLineGroupID": 1,
  "PreMissionID": 4010134,
  "MapEntranceID": 1010201,
  "MappingInfoID": 1206,
  "WorldID": 201,
  "BackGroundPath": "SpriteOutput/Abyss/UI3D_SceneBg/AbyssSen...",
  "TabPicPath": "SpriteOutput/UI/Abyss/Process/TypeIcon/A...",
  "TabPicSelectPath": "SpriteOutput/UI/Abyss/Process/TypeIcon/A...",
  "ChallengeGroupType": "Memory",
  "ThemePicPath": ""
}
```

### IdleLiveImgDanmu.json (0.03 MB, 140 条)

**字段** (9): `ID, UnlockID, TriggerID, ImagePath, Interval, FlySpeed, IsExclusive, SizeType, RepeatCount`

**首条记录摘要**:
```json
{
  "ID": 1,
  "UnlockID": 1005,
  "TriggerID": 5,
  "ImagePath": "SpriteOutput/Quest/IdleLive/BulletCommen...",
  "Interval": 2,
  "FlySpeed": 1,
  "IsExclusive": true,
  "SizeType": 2,
  "RepeatCount": 3
}
```

### FarmStageUnlockConfig.json (0.03 MB, 89 条)

**字段** (7): `ID, FarmType, FarmGachaIDList, UnlockWorldLevelEnd, UIEnterBattleArea, UIEntranceBgPath, UIEnviromentConfig`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "FarmType": "COCOON_AVATAR_EXP",
  "FarmGachaIDList": [],
  "UnlockWorldLevelEnd": 4,
  "UIEnterBattleArea": 2010101,
  "UIEntranceBgPath": "UI/UI3D/UI3DFarmStage/_dependencies/Mate...",
  "UIEnviromentConfig": ""
}
```

### HeartDialScriptCondition.json (0.03 MB, 153 条)

**字段** (6): `ScriptID, MissingConditionID, FullConditionID, LockConditionID, UnLockConditionID, ControlConditionID`

**首条记录摘要**:
```json
{
  "ScriptID": 10001,
  "MissingConditionID": 10001004,
  "FullConditionID": 10001003,
  "LockConditionID": 10001001,
  "UnLockConditionID": 10001001,
  "ControlConditionID": 10001001
}
```

### ItemConfigLD.json (0.03 MB, 69 条)

**字段** (12): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 268001,
  "ItemMainType": "Material",
  "ItemSubType": "FateRinHougu",
  "InventoryDisplayTag": 2,
  "Rarity": "VeryRare",
  "ItemIconPath": "SpriteOutput/ItemIcon/269001.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/269001.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemCurrency/269001.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 99999,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### RelicSetSkillConfig.json (0.03 MB, 92 条)

**字段** (6): `SetID, RequireNum, SkillDesc, PropertyList, AbilityName, AbilityParamList`

**首条记录摘要**:
```json
{
  "SetID": 101,
  "RequireNum": 2,
  "SkillDesc": "RelicDesc_1012",
  "PropertyList": "[{\"FODBMMCKAEN\": \"HealRatioBase\", \"MNDFO...",
  "AbilityName": "",
  "AbilityParamList": [
    {
      "Value": 0.1
    }
  ]
}
```

### FiveDimPuzzleChallenge.json (0.03 MB, 42 条)

**字段** (15): `PuzzleID, FloorID, GroupID, InstanceID, PuzzleStateGP, UIActiveGP, NameText, DescText, ActiveNameText, ActiveDescText, FinishNameText, FinishDescText, ProgressGPList, ProgressLimit, RelatedMissionIDList`

**首条记录摘要**:
```json
{
  "PuzzleID": 1050101,
  "FloorID": 10501001,
  "GroupID": 53,
  "InstanceID": 110001,
  "PuzzleStateGP": "LG_110001__63_ChestStateS_Auto",
  "UIActiveGP": "LG_110001_LittleGameUIActive",
  "NameText": {
    "Hash": 15465075350105141510
  },
  "DescText": {
    "Hash": 2189671480971208087
  },
  "ActiveNameText": {
    "Hash": 15465075350105141510
  },
  "ActiveDescText": {
    "Hash": 2189671480971208087
  },
  "FinishNameText": {
    "Hash": 2012001348524219443
  },
  "FinishDescText": {
    "Hash": 5177779949803579851
  },
  "ProgressGPList": "[\"LG_110001__59_PressureSwitchState_Auto...",
  "ProgressLimit": 3,
  "RelatedMissionIDList": []
}
```

### MonsterGuideConfig.json (0.03 MB, 80 条)

**字段** (7): `MonsterID, Difficulty, DifficultyList, TagList, PhaseList, DifficultyGuideList, TextGuideList`

**首条记录摘要**:
```json
{
  "MonsterID": 100401401,
  "Difficulty": 1,
  "DifficultyList": [
    1,
    1,
    3,
    4
  ],
  "TagList": [
    100101,
    100102,
    100103,
    100104
  ],
  "PhaseList": [
    10011,
    10012
  ],
  "DifficultyGuideList": [
    10010,
    10011
  ],
  "TextGuideList": [
    10060,
    10011
  ]
}
```

### RaidTargetConfig.json (0.03 MB, 67 条)

**字段** (10): `ID, AbilityName, ParamList, TargetType, ParamType, TargetParam1, HintStep, IsShowProgress, RewardID, TargetName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "AbilityName": "RaidAbility_TargetCheckDie",
  "ParamList": [
    {
      "Value": 1
    }
  ],
  "TargetType": "DeadAvatarCount",
  "ParamType": "Less",
  "TargetParam1": 3,
  "HintStep": [
    0
  ],
  "IsShowProgress": 1,
  "RewardID": 139001,
  "TargetName": {
    "Hash": 10577267953868263011
  }
}
```

### RogueMiracle.json (0.03 MB, 250 条)

**字段** (4): `MiracleID, MiracleDisplayID, MiracleEffectDisplayID, UnlockHandbookMiracleID`

**首条记录摘要**:
```json
{
  "MiracleID": 1,
  "MiracleDisplayID": 1,
  "MiracleEffectDisplayID": 1,
  "UnlockHandbookMiracleID": 1
}
```

### GridFightDivisionInfo.json (0.03 MB, 97 条)

**字段** (7): `ID, SeasonID, Progress, DivisionRewardQuest, DivisionIcon, DivisionShowPic, DivisionName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SeasonID": 1,
  "Progress": 1,
  "DivisionRewardQuest": [],
  "DivisionIcon": "",
  "DivisionShowPic": "",
  "DivisionName": {
    "Hash": 9148341949944255495
  }
}
```

### RestaurantMessageConfig.json (0.03 MB, 154 条)

**字段** (6): `ID, ContactsID, Sender, ItemType, MainText, NextItemIDList`

**首条记录摘要**:
```json
{
  "ID": 2000,
  "ContactsID": 1402,
  "Sender": "NPC",
  "ItemType": "Text",
  "MainText": {
    "Hash": 16256551897853024040
  },
  "NextItemIDList": [
    2001
  ]
}
```

### BattlePassConfig.json (0.03 MB, 29 条)

**字段** (13): `ID, GroupID, NextID, ScheduleDataID, BattlePassWeekID, WeekQuestList, WeekOrder1, WeekOrder2, WeekChainQuestList, VersionQuestList, LevelUpShow, BillboardShow, EquipmentShow`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 1,
  "NextID": 2,
  "ScheduleDataID": 1000001,
  "BattlePassWeekID": 1,
  "WeekQuestList": "[2000101, 2000104, 2000105, 2000106, 200...",
  "WeekOrder1": [
    2000102,
    2000103
  ],
  "WeekOrder2": [],
  "WeekChainQuestList": [],
  "VersionQuestList": "[2000201, 2000202, 2000203, 2000207, 200...",
  "LevelUpShow": [],
  "BillboardShow": [],
  "EquipmentShow": []
}
```

### ActivityAvatarSkillConfig.json (0.03 MB, 21 条)

**字段** (29): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, StanceDamageDisplay, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, AttackType, SkillEffect`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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

### MazePuzzleSwitchHand.json (0.03 MB, 32 条)

**字段** (9): `SwitchID, PlaneID, FloorID, GroupIDList, SwitchHandID, CoinPropID, ColliderPath, ControllerListID, ChestID`

**首条记录摘要**:
```json
{
  "SwitchID": 1,
  "PlaneID": 90300,
  "FloorID": 90300004,
  "GroupIDList": [],
  "SwitchHandID": [
    6,
    300002
  ],
  "CoinPropID": "[{\"LLDCHLHNADA\": 7, \"GACEMBBAGMP\": 30000...",
  "ColliderPath": "Stages/OriginalResPos/Chapter04/Prefab/C...",
  "ControllerListID": "[{\"LLDCHLHNADA\": 2, \"GACEMBBAGMP\": 30000...",
  "ChestID": []
}
```

### ScheduleDataQuest.json (0.03 MB, 277 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 21001801,
  "BeginTime": "2022-04-25 04:00:00",
  "EndTime": "2022-06-21 04:00:00"
}
```

### RogueMagicFinishway.json (0.03 MB, 135 条)

**字段** (7): `ID, FinishType, ParamType, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 5013001,
  "FinishType": "RogueMagicFinishCnt",
  "ParamType": "NoPara",
  "ParamStr1": "",
  "ParamIntList": [
    201
  ],
  "ParamItemList": [],
  "Progress": 1
}
```

### InteractConfig.json (0.03 MB, 225 条)

**字段** (3): `InteractID, TargetState, ItemCostList`

**首条记录摘要**:
```json
{
  "InteractID": 1010,
  "TargetState": "Open",
  "ItemCostList": []
}
```

### FateTraitBuff.json (0.03 MB, 64 条)

**字段** (10): `PDMPABKDHDI, BNCKFPAGOMF, GODMIEOJGAE, JFKADAONNOD, PBLPLDJKPEI, NHALJPDONCP, FCGFFAJIBKA, ENJOALLODBG, EPHLMOECOHP, LBLJLNPBDPB`

**首条记录摘要**:
```json
{
  "PDMPABKDHDI": 10101,
  "BNCKFPAGOMF": 101,
  "GODMIEOJGAE": {
    "Hash": 4772007636666229802
  },
  "JFKADAONNOD": {
    "Hash": 2626323646513519044
  },
  "PBLPLDJKPEI": "[{\"Value\": 0.25}, {\"Value\": 0.05}, {\"Val...",
  "NHALJPDONCP": "Base",
  "FCGFFAJIBKA": "Additional",
  "ENJOALLODBG": 3,
  "EPHLMOECOHP": [
    3150021,
    3150022
  ],
  "LBLJLNPBDPB": ""
}
```

### TrainPartyEventConfig.json (0.03 MB, 180 条)

**字段** (3): `EventID, EventActPath, EffectJsonPath`

**首条记录摘要**:
```json
{
  "EventID": 10001,
  "EventActPath": "Config/Level/TrainParty/TrainPartyEvent/...",
  "EffectJsonPath": "Config/Level/TrainParty/TrainPartyEvent/..."
}
```

### PixAirContentConfig.json (0.03 MB, 146 条)

**字段** (4): `ContentID, CoreTagIndexList, Name, EventOptionDescribe`

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

### ILHardLevelGroup.json (0.03 MB, 140 条)

**字段** (5): `HardLevelGroup, Level, AttackRatio, DefenceRatio, HPRatio`

**首条记录摘要**:
```json
{
  "HardLevelGroup": 1,
  "Level": 1,
  "AttackRatio": {
    "Value": 1
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  }
}
```

### TutorialSubGuideGroup.json (0.03 MB, 76 条)

**字段** (8): `LLDCHLHNADA, LPBKPCCKFJG, BHHPLHIGOHE, FLBGELFEBCK, JMDGIBDPMJF, JNDOMOJHOEF, HNLJKFJOACC, ODEKADIBFAO`

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
  "JMDGIBDPMJF": "[{\"TriggerType\": \"ShowUIPage\", \"TriggerP...",
  "JNDOMOJHOEF": [],
  "HNLJKFJOACC": {
    "Hash": 18212868757188547349
  },
  "ODEKADIBFAO": 90006
}
```

### BoxingClubStage.json (0.03 MB, 97 条)

**字段** (6): `EventID, BuffID, BuffOptionalList, Name, BubbleTalkPlayer, BubbleTalkEnemy`

**首条记录摘要**:
```json
{
  "EventID": 304001,
  "BuffID": 3100001,
  "BuffOptionalList": [],
  "Name": {
    "Hash": 8564188942280376345
  },
  "BubbleTalkPlayer": {
    "Hash": 712012665082434515
  },
  "BubbleTalkEnemy": {
    "Hash": 2892712590094533198
  }
}
```

### ChenLingFesItemRuleGroup.json (0.03 MB, 86 条)

**字段** (3): `ID, ItemList, ItemRareWeight`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "ItemList": [
    1,
    2,
    3
  ],
  "ItemRareWeight": [
    100,
    50,
    50
  ]
}
```

### BillboardIconConfig.json (0.03 MB, 212 条)

**字段** (3): `ID, Priority, BillboardIconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Priority": 1,
  "BillboardIconPath": "SpriteOutput/MapPics/Billboard/IconBillb..."
}
```

### GridFightMonster.json (0.03 MB, 160 条)

**字段** (6): `MonsterID, MonsterTier, Star1EliteGroup3, Star2EliteGroup3, Star3EliteGroup3, Star4EliteGroup3`

**首条记录摘要**:
```json
{
  "MonsterID": 800101020,
  "MonsterTier": 1,
  "Star1EliteGroup3": 851,
  "Star2EliteGroup3": 852,
  "Star3EliteGroup3": 853,
  "Star4EliteGroup3": 854
}
```

### PlanetFesBuff.json (0.03 MB, 220 条)

**字段** (4): `ID, SourceID, Type, TypeParam`

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

### StoryLine.json (0.03 MB, 64 条)

**字段** (8): `StoryLineID, BeginCondition, EndCondition, ShowCondition, InitEntranceID, InitGroupID, InitAnchorID, PerformanceStoryAvatar`

**首条记录摘要**:
```json
{
  "StoryLineID": 1031101,
  "BeginCondition": "{\"Type\": \"SubMissionTaken\", \"Param\": \"10...",
  "EndCondition": "{\"Type\": \"FinishSubMission\", \"Param\": \"1...",
  "ShowCondition": "[BetweenSubMission:103110108,103110151]|...",
  "InitEntranceID": 2031101,
  "InitGroupID": 634,
  "InitAnchorID": 1,
  "PerformanceStoryAvatar": "NPC_Avatar_Lad_Aventurine_00"
}
```

### GridFightOrb.json (0.03 MB, 376 条)

**字段** (3): `OrbID, BonusID, Type`

**首条记录摘要**:
```json
{
  "OrbID": 100,
  "BonusID": 20001,
  "Type": "White"
}
```

### ActivityDiceV2Stage.json (0.03 MB, 11 条)

**字段** (14): `PHFMCACHFIJ, MPHLEBAPCOK, LIPCDDAPHNF, MBHMFMANFOJ, DEAKHCBABDF, HPIANKGODCK, ENHDOJLCADJ, OKDHOHKPEKK, JDMNNJLANMI, BFJDEHGEDFB, LCNHHDJNHPF, KKKDCNECFDG, AJJDAJLFNBP, EKMLKINHNOJ`

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
  "LCNHHDJNHPF": "[{\"BFLIFKBEOPJ\": 42001, \"MNDFOPKBHKP\": 2...",
  "KKKDCNECFDG": "UI/UI3D/DiceCombat/V2/_dependencies/Text...",
  "AJJDAJLFNBP": "UI/UI3D/DiceCombat/V2/_dependencies/Text...",
  "EKMLKINHNOJ": []
}
```

### AvatarUseMaterialData.json (0.03 MB, 91 条)

**字段** (9): `AvatarID, PromotionMaterial, BossMaterial, SkillMaterialSmall, SkillMaterialMedium, SkillMaterialLarge, WorldMaterialSmall, WorldMaterialMedium, WorldMaterialLarge`

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

### RogueDLCChessBoardEvent.json (0.03 MB, 150 条)

**字段** (3): `ChessBoardEventID, ChessBoardEventName, ChessBoardEventDesc`

**首条记录摘要**:
```json
{
  "ChessBoardEventID": 101,
  "ChessBoardEventName": {
    "Hash": 14536513564460507360
  },
  "ChessBoardEventDesc": {
    "Hash": 18084152724274937062
  }
}
```

### RogueNPC.json (0.03 MB, 260 条)

**字段** (2): `RogueNPCID, NPCJsonPath`

**首条记录摘要**:
```json
{
  "RogueNPCID": 40398,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC4039..."
}
```

### MuseumStats.json (0.03 MB, 210 条)

**字段** (6): `Level, AreaID, StatsType, PhaseLimit, FundCost, StatsValue`

**首条记录摘要**:
```json
{
  "Level": 1,
  "AreaID": 1,
  "StatsType": 1,
  "PhaseLimit": 1,
  "FundCost": 100,
  "StatsValue": 40
}
```

### GridFightRankSkillModify.json (0.03 MB, 124 条)

**字段** (5): `RankID, SkillID, ModifySkillIndexs, ModifyOps, ModifyValues`

**首条记录摘要**:
```json
{
  "RankID": 100306,
  "SkillID": 10030401,
  "ModifySkillIndexs": [
    3
  ],
  "ModifyOps": [
    "Mul"
  ],
  "ModifyValues": [
    {
      "Value": 1.2
    }
  ]
}
```

### RogueImage.json (0.03 MB, 93 条)

**字段** (6): `ImageID, ImageType, ImagePath, ParamStr1, ParamStr2, TexturePath`

**首条记录摘要**:
```json
{
  "ImageID": 101,
  "ImageType": "RandomEvt",
  "ImagePath": "SpriteOutput/Rogue/RandomEvent/PicRogueE...",
  "ParamStr1": "Ev_sfx_ui_feedback_rogue_random_event",
  "ParamStr2": "",
  "TexturePath": "Characters/NPC/Special/RogueEventPaintin..."
}
```

### GridFightTraitBasicInfo.json (0.03 MB, 33 条)

**字段** (14): `ID, ActivationType, TraitSearchKey, IconPath, MiniIconPath, BEIDList, TraitName, TraitEffectList, TraitBaseDesc, TraitBaseSimpleDesc, BaseDescParamList, CutinPath, SeasonID, TraitSortPriority`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "ActivationType": "GreaterEqualThan",
  "TraitSearchKey": "Origin_1001",
  "IconPath": "SpriteOutput/GridFight/TraitIcon/Icon/10...",
  "MiniIconPath": "SpriteOutput/GridFight/TraitIcon/MiniIco...",
  "BEIDList": [
    62201
  ],
  "TraitName": {
    "Hash": 16635147986466422796
  },
  "TraitEffectList": [],
  "TraitBaseDesc": {
    "Hash": 14610959320175737237
  },
  "TraitBaseSimpleDesc": {
    "Hash": 17340321087791696433
  },
  "BaseDescParamList": [
    {
      "Value": 10
    }
  ],
  "CutinPath": "",
  "SeasonID": 1,
  "TraitSortPriority": 61
}
```

### ActivityAvatarConfig.json (0.02 MB, 12 条)

**字段** (38): `AvatarID, AvatarName, AvatarFullName, AdventurePlayerID, AvatarVOTag, Rarity, JsonPath, DamageType, SPNeed, ExpGroup, MaxPromotion, RankIDList, SkillList, AvatarBaseType, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, AvatarSideIconPath, AvatarMiniIconPath, AvatarGachaResultImgPath, ActionAvatarHeadIconPath, UltraSkillCutInPrefabPath, UIAvatarModelPath, ManikinJsonPath, AIPath, SkilltreePrefabPath, DamageTypeResistance, Release, SideAvatarHeadIconPath, WaitingAvatarHeadIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarDropOffset, AvatarTrialOffset, PlayerCardOffset, AssistOffset, AssistBgOffset, AvatarSelfShowOffset`

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

### AvatarPromotionConfigTrial.json (0.02 MB, 35 条)

**字段** (14): `AvatarID, PromotionCostList, MaxLevel, PlayerLevelRequire, AttackBase, AttackAdd, DefenceBase, DefenceAdd, HPBase, HPAdd, SpeedBase, CriticalChance, CriticalDamage, BaseAggro`

**首条记录摘要**:
```json
{
  "AvatarID": 7205,
  "PromotionCostList": "[{\"ItemID\": 2, \"ItemNum\": 4000}, {\"ItemI...",
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

### RogueDLCAeonTalent.json (0.02 MB, 63 条)

**字段** (8): `AeonTalentID, AeonDimensionID, UnlockAeonDimensionPoint, TalentIcon, EffectTitle, EffectDesc, EffectDescParamList, GamePlayEffectList`

**首条记录摘要**:
```json
{
  "AeonTalentID": 101,
  "AeonDimensionID": 1,
  "UnlockAeonDimensionPoint": 1,
  "TalentIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffDe...",
  "EffectTitle": {
    "Hash": 18383077418821921705
  },
  "EffectDesc": {
    "Hash": 15071451535567131134
  },
  "EffectDescParamList": [
    {
      "Value": 0.12
    }
  ],
  "GamePlayEffectList": [
    101
  ]
}
```

### RogueUnlockConfig.json (0.02 MB, 299 条)

**字段** (2): `RogueUnlockID, UnlockFinishWay`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 1,
  "UnlockFinishWay": 10100
}
```

### PixAirEquipConfig.json (0.02 MB, 96 条)

**字段** (7): `EquipID, Name, EquipIcon, SlotType, IsCore, TagList, AffectedTaglist`

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

### AvatarAtlas.json (0.02 MB, 86 条)

**字段** (7): `AvatarID, DefaultUnlock, CV_CN, CV_JP, CV_KR, CV_EN, CampID`

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

### RogueTournGambleGroup.json (0.02 MB, 126 条)

**字段** (4): `GambleGroupID, GambleGroupType, GroupName, GambleGroupIcon`

**首条记录摘要**:
```json
{
  "GambleGroupID": 100,
  "GambleGroupType": "SlotMachine",
  "GroupName": {
    "Hash": 13357321088829524448
  },
  "GambleGroupIcon": ""
}
```

### RogueBonus.json (0.02 MB, 79 条)

**字段** (6): `BonusID, BonusEvent, BonusTitle, BonusDesc, BonusTag, BonusIcon`

**首条记录摘要**:
```json
{
  "BonusID": 1,
  "BonusEvent": 100001,
  "BonusTitle": {
    "Hash": 6501557233376229984
  },
  "BonusDesc": {
    "Hash": 7434800025493403305
  },
  "BonusTag": {
    "Hash": 8687582118987184760
  },
  "BonusIcon": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### AvatarPropertyConfig.json (0.02 MB, 56 条)

**字段** (8): `PropertyType, PropertyName, PropertyNameRelic, PropertyNameFilter, IsDisplay, isBattleDisplay, Order, IconPath`

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

### StatusConfigLD.json (0.02 MB, 50 条)

**字段** (11): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, StatusEffect, CanDispel, ReadParamList, TagList`

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

### RogueNousDiceBranch.json (0.02 MB, 12 条)

**字段** (30): `BranchID, BranchTag, BranchName, BranchIntroduction, EffectDesc, EffectExtraDesc, PassiveEffectDesc, ExtraDesc, PassiveEffectExtraDesc, StartingEffectDescToast, EffectDescParam1, ParamValue1, EffectDescParam2, ParamValue2, EffectDescParam3, ParamValue3, DefaultUltraSurface, DefaultCommonSurfaceList, SuggestiveSurfaceList, BranchCorePrefab, BranchEditCorePrefab, BranchIcon, DiceIcon, BranchPrefab, DiceLightColor, SoundRoll, SoundReRoll, SoundSuspensionStart, SoundSuspensionStop, RecommendSurfaceList`

**首条记录摘要**:
```json
{
  "BranchID": 101,
  "BranchTag": 1,
  "BranchName": {
    "Hash": 11481090187541518864
  },
  "BranchIntroduction": {
    "Hash": 6280843551651826720
  },
  "EffectDesc": {
    "Hash": 13876745819918922889
  },
  "EffectExtraDesc": [
    61000007,
    61000008
  ],
  "PassiveEffectDesc": {
    "Hash": 13367356773081089019
  },
  "ExtraDesc": [],
  "PassiveEffectExtraDesc": [
    61000022
  ],
  "StartingEffectDescToast": {
    "Hash": 8090465823475344800
  },
  "EffectDescParam1": {
    "Hash": 14790359989943718375
  },
  "ParamValue1": [],
  "EffectDescParam2": {
    "Hash": 3114534170203516322
  },
  "ParamValue2": [
    {
      "Value": 80
    }
  ],
  "EffectDescParam3": {
    "Hash": 8729752646577383277
  },
  "ParamValue3": [
    {
      "Value": 1
    }
  ],
  "DefaultUltraSurface": 2043,
  "DefaultCommonSurfaceList": [
    2001,
    2022,
    2007,
    2004,
    2084
  ],
  "SuggestiveSurfaceList": [
    2043,
    2001,
    2025,
    2042,
    2007,
    2018
  ],
  "BranchCorePrefab": "UI/Rogue/DLC/RogueNous/DiceCustomCore/Di...",
  "BranchEditCorePrefab": "UI/Rogue/DLC/RogueNous/DiceCustomCore/Sm...",
  "BranchIcon": "SpriteOutput/Rogue/DLC/RogueNous/Dice/Ic...",
  "DiceIcon": "SpriteOutput/Rogue/DLC/RogueNous/Dice/Ic...",
  "BranchPrefab": "Effects/Eff_Prefab/Eff_Scene/Interactive...",
  "DiceLightColor": "#FF6D42",
  "SoundRoll": "Ev_sfx_rogue_dice01_spawn",
  "SoundReRoll": "Ev_sfx_rogue_dice01_reroll",
  "SoundSuspensionStart": "Ev_sfx_rogue_dice01_idle",
  "SoundSuspensionStop": "Ev_sfx_rogue_dice01_idle_stop",
  "RecommendSurfaceList": "[2001, 2007, 2014, 2018, 2022, 2025, 204..."
}
```

### RogueTournExpReward.json (0.02 MB, 280 条)

**字段** (4): `MainTournID, Level, Exp, RewardID`

**首条记录摘要**:
```json
{
  "MainTournID": 1,
  "Level": 1,
  "Exp": 800,
  "RewardID": 110901
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

### MarbleSeal.json (0.02 MB, 28 条)

**字段** (28): `ID, ActivityID, GameMode, Size, Mass, Attack, Hp, MaxSpeed, PrefabPath, IconPath, EnemyIconPath, SmallIconPath, SmallEnemyIconPath, BuffIDList, Name, Desc, Price, UnlockBuySubMissionID, UnlockShowSubMissionID, AiStrategyID, LevelUpPriority, ActionPriority, ShopTalkID, CommonTalkIDList, VoiceType, VideoID, UnlockHint, IsShow`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityID": 50029,
  "GameMode": "MARBLE",
  "Size": 0.416,
  "Mass": 8,
  "Attack": 5,
  "Hp": 40,
  "MaxSpeed": 20,
  "PrefabPath": "Gameplays/Marble/PlayerBall_01.prefab",
  "IconPath": "SpriteOutput/Quest/ActivityMarble/SealIc...",
  "EnemyIconPath": "",
  "SmallIconPath": "SpriteOutput/Quest/ActivityMarble/SealIc...",
  "SmallEnemyIconPath": "",
  "BuffIDList": [],
  "Name": "MarbleSeal_Name_1",
  "Desc": "",
  "Price": 1,
  "UnlockBuySubMissionID": 803210103,
  "UnlockShowSubMissionID": 803210003,
  "AiStrategyID": 1,
  "LevelUpPriority": 1,
  "ActionPriority": 2,
  "ShopTalkID": 101,
  "CommonTalkIDList": [
    201,
    202
  ],
  "VoiceType": "SwitchGroup_NPC_haibaoA",
  "VideoID": 1535,
  "UnlockHint": {
    "Hash": 18267415662329451395
  },
  "IsShow": true
}
```

### ChallengeTargetConfig.json (0.02 MB, 133 条)

**字段** (5): `ID, ChallengeTargetType, ChallengeTargetName, ChallengeTargetParam1, RewardID`

**首条记录摘要**:
```json
{
  "ID": 11,
  "ChallengeTargetType": "ROUNDS_LEFT",
  "ChallengeTargetName": {
    "Hash": 12508471847671960592
  },
  "ChallengeTargetParam1": 10,
  "RewardID": 100102
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

### RogueTournFinishway.json (0.02 MB, 104 条)

**字段** (10): `ID, FinishType, ParamType, ParamInt1, ParamInt2, ParamInt3, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 3000201,
  "FinishType": "RogueTournFinishWithDifficultyCompCnt",
  "ParamType": "NoPara",
  "ParamInt1": 5,
  "ParamInt2": 1,
  "ParamInt3": 2,
  "ParamStr1": "Cond_InRogueTournMode(1)",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### RogueTournExhibition.json (0.02 MB, 68 条)

**字段** (6): `ExhibitionID, ExhibitionType, IconPath, SlotIconPath, ImagePath, ProgramGroupID`

**首条记录摘要**:
```json
{
  "ExhibitionID": 101,
  "ExhibitionType": "Wide",
  "IconPath": "SpriteOutput/Rogue/Tourn/Collection/Item...",
  "SlotIconPath": "SpriteOutput/Rogue/Tourn/Collection/Slot...",
  "ImagePath": "SpriteOutput/Rogue/RandomEvent/Horizon/R...",
  "ProgramGroupID": 501
}
```

### RogueDLCAeonDiceSurface.json (0.02 MB, 42 条)

**字段** (13): `AeonSurfaceDiceID, AeonDiceID, Dice3DSurfaceList, DiceActiveStage, DiceSurfaceIcon, DiceSurfaceName, DiceSurfaceDesc, DescParam, DiceEffectType, DiceEffectParam, Rarity, Sort, ExtraEffect`

**首条记录摘要**:
```json
{
  "AeonSurfaceDiceID": 101,
  "AeonDiceID": 1,
  "Dice3DSurfaceList": [
    1
  ],
  "DiceActiveStage": 1,
  "DiceSurfaceIcon": "SpriteOutput/Rogue/DLC/Dice/SurfaceIcon/...",
  "DiceSurfaceName": {
    "Hash": 18116394533523572482
  },
  "DiceSurfaceDesc": {
    "Hash": 12883724531496839482
  },
  "DescParam": [],
  "DiceEffectType": "SelectCellToProtect",
  "DiceEffectParam": [
    11,
    12
  ],
  "Rarity": 2,
  "Sort": 3,
  "ExtraEffect": [
    61000002,
    61000018,
    61000019
  ]
}
```

### GridFightSeasonTalent.json (0.02 MB, 40 条)

**字段** (12): `ID, SeasonID, NextTalentIDList, PreTalentIDList, Cost, IconPath, JsonPath, IsOCEffective, EffectParamList, EffectTag, EffectTitle, EffectDesc`

**首条记录摘要**:
```json
{
  "ID": 2011,
  "SeasonID": 1,
  "NextTalentIDList": [],
  "PreTalentIDList": [],
  "Cost": 20,
  "IconPath": "SpriteOutput/GridFight/AttributeIcon/Whi...",
  "JsonPath": "Config/Level/GridFight/SeasonTalent/Seas...",
  "IsOCEffective": 1,
  "EffectParamList": "[{\"Value\": 1}, {\"Value\": 1}, {\"Value\": 4...",
  "EffectTag": {
    "Hash": 15097219401480747513
  },
  "EffectTitle": {
    "Hash": 5627671704163293419
  },
  "EffectDesc": {
    "Hash": 11893880221757873933
  }
}
```

### GridFightConstCommon.json (0.02 MB, 142 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "GridFight_AvatarRarity",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 1}, {\"IntVa..."
}
```

### TreasureDungeonFloor.json (0.02 MB, 74 条)

**字段** (7): `DungeonID, FloorID, MapID, DungeonBuffID, HardLevelGroupID, HardLevelList, EliteGroup2`

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

### RogueMiracleGroup.json (0.02 MB, 100 条)

**字段** (2): `RogueMiracleGroupID, MiracleWeight`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 1000,
  "MiracleWeight": "{\"102\": 1, \"2001\": 1, \"2004\": 1, \"64\": 1..."
}
```

### ILBattleStatusConfig.json (0.02 MB, 76 条)

**字段** (8): `ID, ModifierName, StatusType, DisplayPriority, StatusIconPath, StatusIconPathHighSize, ReadParamList, TagList`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "ModifierName": "RTMCommon_MDF_Attack",
  "StatusType": "Buff",
  "DisplayPriority": 1,
  "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "StatusIconPathHighSize": "",
  "ReadParamList": [],
  "TagList": []
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

### EnterPageConfig.json (0.02 MB, 492 条)

**字段** (1): `Key`

**首条记录摘要**:
```json
{
  "Key": "AchievementPage"
}
```

### PixAirEnemyDisplayConfig.json (0.02 MB, 52 条)

**字段** (7): `EnemyDisplayID, EnemyIcon, EnemyName, EnemyTrashTalk, EnemyDeadTalk, EnemyDesc, PrefabPath`

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

**字段** (6): `ID, IconPath, Taglist, PrefabPath, IsActivity, DisplayTaglist`

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

### RogueNousDiceBranchValue.json (0.02 MB, 108 条)

**字段** (4): `BranchID, AeonID, BranchEffectDesc, ParamList`

**首条记录摘要**:
```json
{
  "BranchID": 101,
  "AeonID": 1,
  "BranchEffectDesc": {
    "Hash": 11858386196630117145
  },
  "ParamList": [
    {
      "Value": 1
    },
    {
      "Value": 0.12
    }
  ]
}
```

### TextJoinConfig.json (0.02 MB, 181 条)

**字段** (3): `TextJoinID, DefaultItem, TextJoinItemList`

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

### RogueHandbookMiracle.json (0.02 MB, 112 条)

**字段** (6): `MiracleHandbookID, MiracleReward, MiracleTypeList, MiracleDisplayID, MiracleEffectDisplayID, Order`

**首条记录摘要**:
```json
{
  "MiracleHandbookID": 1,
  "MiracleReward": 106011,
  "MiracleTypeList": [
    100,
    130,
    160
  ],
  "MiracleDisplayID": 1,
  "MiracleEffectDisplayID": 1,
  "Order": 34
}
```

### InControlKeyInfo.json (0.02 MB, 98 条)

**字段** (5): `key, isSettingKey, keyString, keyStringFrance, keyStringGermany`

**首条记录摘要**:
```json
{
  "key": "A",
  "isSettingKey": true,
  "keyString": {
    "Hash": 9678956301714591549
  },
  "keyStringFrance": {
    "Hash": 8868851299996242705
  },
  "keyStringGermany": {
    "Hash": 6857657487639993831
  }
}
```

### FateTrait.json (0.02 MB, 19 条)

**字段** (17): `BNCKFPAGOMF, NHLFBFKBOEK, HCCMEBGFMCE, DFMLAIADNGI, PBLPLDJKPEI, KCBDHKEKNHD, PDMDDELEAAG, BEOGEKDEPLO, CCBONMNIPPL, ELNGIJIGJOO, FBFCPNADPKB, AJLLAEEDBJL, NLIPGMKKIED, DHKNKNGGJCK, ODEKADIBFAO, MFGKFAMKMFH, PDDPFOBKIEN`

**首条记录摘要**:
```json
{
  "BNCKFPAGOMF": 101,
  "NHLFBFKBOEK": {
    "Hash": 1311274686713581502
  },
  "HCCMEBGFMCE": {
    "Hash": 12870402275007181438
  },
  "DFMLAIADNGI": {
    "Hash": 16975619132162457677
  },
  "PBLPLDJKPEI": [],
  "KCBDHKEKNHD": [
    10101,
    10102,
    10103,
    10104,
    10105
  ],
  "PDMDDELEAAG": 1014,
  "BEOGEKDEPLO": [],
  "CCBONMNIPPL": "[\"SpriteOutput/Collaboration/Fate/FateTr...",
  "ELNGIJIGJOO": "SpriteOutput/Collaboration/Fate/FateTrai...",
  "FBFCPNADPKB": "Clazz",
  "AJLLAEEDBJL": "",
  "NLIPGMKKIED": {
    "Hash": 12200022930819803836
  },
  "DHKNKNGGJCK": {
    "Hash": 2961890358865508487
  },
  "ODEKADIBFAO": 15001,
  "MFGKFAMKMFH": "SpriteOutput/Collaboration/Fate/FateTrai...",
  "PDDPFOBKIEN": {
    "Hash": 15109673991290108396
  }
}
```

### PlanetFesAvatar.json (0.02 MB, 25 条)

**字段** (18): `ID, PlanetType, LandType, Rarity, ItemID, CD, Skill1List, Skill2List, IncomeParam, GachaUnlockIDList, Name, Description, HeadIcon, MiniIcon, Body, AnimConfig, MidIcon, CargoIcon`

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

### RogueDLCFinishWay.json (0.02 MB, 102 条)

**字段** (8): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "FinishType": "RogueDLCFinishCnt",
  "ParamType": "GreaterEqual",
  "ParamInt1": 101,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### NounAtlas.json (0.02 MB, 99 条)

**字段** (5): `Type, NounTitle, NounDesc, RelatedTerms, IsIntroPage`

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

### ActivityDiceAIGroup.json (0.02 MB, 32 条)

**字段** (10): `AIGroupID, SpecialRuleWeight, SkillWeight, ColorfulDiceWeight, SelectTimeRange, ExchangeWaitTimeRange, UseTacticsCardWaitTimeRange, BuyTacticsCardWaitTimeRange, PrepareFinishWaitTimeRange, PrepareCancelWaitTimeRange`

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

### IdleLiveSubNode.json (0.02 MB, 252 条)

**字段** (3): `SubNodeID, StageID, EquipOrbDrop`

**首条记录摘要**:
```json
{
  "SubNodeID": 1011,
  "StageID": 1011,
  "EquipOrbDrop": 1
}
```

### GridFightPrayQuest.json (0.02 MB, 88 条)

**字段** (6): `ID, PrayType, FinishWayID, FinishBonus, PrayDesc, PrayTitle`

**首条记录摘要**:
```json
{
  "ID": 7320001,
  "PrayType": "FateWhite",
  "FinishWayID": 7320001,
  "FinishBonus": 23140,
  "PrayDesc": {
    "Hash": 6309928406107447514
  },
  "PrayTitle": {
    "Hash": 15361108566241695636
  }
}
```

### GridFightAffixConfig.json (0.02 MB, 51 条)

**字段** (7): `ID, RuleParamList, JsonPath, EffectParamList, AffixName, AffixDesc, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "RuleParamList": [
    35301001
  ],
  "JsonPath": "Config/Level/GridFight/Affix/GridFightAf...",
  "EffectParamList": [
    {
      "Value": 0.6
    },
    {
      "Value": 0.3
    }
  ],
  "AffixName": {
    "Hash": 1726888233084287987
  },
  "AffixDesc": {
    "Hash": 10427075857524976263
  },
  "IconPath": "SpriteOutput/GridFight/BattleIcon/BuffIc..."
}
```

### RelicSetConfig.json (0.02 MB, 60 条)

**字段** (9): `SetID, SetSkillList, SetIconPath, SetIconFigurePath, SetName, DisplayItemID, DisplayItemIDRarity4, Release, ReleaseVersion`

**首条记录摘要**:
```json
{
  "SetID": 101,
  "SetSkillList": [
    2,
    4
  ],
  "SetIconPath": "SpriteOutput/ItemIcon/71000.png",
  "SetIconFigurePath": "SpriteOutput/ItemFigures/71000.png",
  "SetName": {
    "Hash": 17317659818484992751
  },
  "DisplayItemID": 81014,
  "DisplayItemIDRarity4": 81013,
  "Release": true,
  "ReleaseVersion": "1.0"
}
```

### CakeConfig.json (0.02 MB, 27 条)

**字段** (12): `ID, NPCID, RuanMadeCakeName, CatCakeHeadIcon, CatCakeMiniIcon, CatCakeTailPath, CatCaughtLines, CatMissedLines, CatTailColour, RuanMadeCakeStory, CatMatPath, CakeDarkMatPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NPCID": 3103,
  "RuanMadeCakeName": {
    "Hash": 11429265512633565575
  },
  "CatCakeHeadIcon": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "CatCakeMiniIcon": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "CatCakeTailPath": "SpriteOutput/Quest/SpaceZoo/CakeTailIcon...",
  "CatCaughtLines": [
    428005001,
    428005002
  ],
  "CatMissedLines": [
    428005001,
    428005002
  ],
  "CatTailColour": 1,
  "RuanMadeCakeStory": {
    "Hash": 17210980118085034222
  },
  "CatMatPath": "Characters/NPC/Special/RuanMadeCake/Mati...",
  "CakeDarkMatPath": "UI/UI3D/CakeCatch/Materials/UI3D_Special..."
}
```

### ClockParkTalkText.json (0.02 MB, 251 条)

**字段** (2): `TalkID, TalkText`

**首条记录摘要**:
```json
{
  "TalkID": 1101,
  "TalkText": {
    "Hash": 4367570168964178882
  }
}
```

### GridFightSkillDescMod.json (0.02 MB, 155 条)

**字段** (3): `ModifySkillID, ModifySkillType, ModifySkillDesc`

**首条记录摘要**:
```json
{
  "ModifySkillID": 10030401,
  "ModifySkillType": "BESkill",
  "ModifySkillDesc": {
    "Hash": 827595434715150605
  }
}
```

### MazeFloorLD.json (0.02 MB, 22 条)

**字段** (18): `FloorID, FloorName, BaseFloorID, FloorTag, BGMWorldState, FloorBGMGroupName, FloorBGMNormalStateName, FloorDefaultEmotion, FloorBGMBusyStateName, EnterAudioEvent, ExitAudioEvent, FloorType, WalkingEffectAdditiveScale, OptionalLoadBlocksConfig, MunicipalConfigPath, MapLayerNameList, CombatBGMLow, CombatBGMHigh`

**首条记录摘要**:
```json
{
  "FloorID": 40445001,
  "FloorName": "MazeText_Empty",
  "BaseFloorID": 40445001,
  "FloorTag": [],
  "BGMWorldState": "State_Penacony",
  "FloorBGMGroupName": "StateGroup_Penocony",
  "FloorBGMNormalStateName": "State_Penocony_MAZ_P302",
  "FloorDefaultEmotion": "State_Hollowing_D",
  "FloorBGMBusyStateName": "State_Maze_Busy",
  "EnterAudioEvent": [
    "Ev_amb_maze_penocony_p3_2"
  ],
  "ExitAudioEvent": [],
  "FloorType": "Default",
  "WalkingEffectAdditiveScale": 1,
  "OptionalLoadBlocksConfig": "",
  "MunicipalConfigPath": "Config/ConfigMunicipal/Chap03_Town_Munic...",
  "MapLayerNameList": "[{\"Hash\": 5769206023853488854}, {\"Hash\":...",
  "CombatBGMLow": "State_Penocony_Combat_P03_InDoor_Low",
  "CombatBGMHigh": "State_Penocony_Combat_P03_InDoor_High"
}
```

### RogueTalent.json (0.02 MB, 42 条)

**字段** (10): `TalentID, IsImportant, NextTalentIDList, Cost, UnlockIDList, Icon, EffectTag, EffectTitle, EffectDesc, EffectDescParamList`

**首条记录摘要**:
```json
{
  "TalentID": 1,
  "IsImportant": true,
  "NextTalentIDList": [
    2
  ],
  "Cost": [
    {
      "ItemID": 32,
      "ItemNum": 50
    }
  ],
  "UnlockIDList": [],
  "Icon": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "EffectTag": {
    "Hash": 6077559846474215225
  },
  "EffectTitle": {
    "Hash": 13717576368934950933
  },
  "EffectDesc": {
    "Hash": 14564630821001376871
  },
  "EffectDescParamList": [
    {
      "Value": 3
    }
  ]
}
```

### TrainPartyEventBgConfig.json (0.02 MB, 119 条)

**字段** (4): `BgID, BgImage, BgConfigJsonPath, TriggerAnimationName`

**首条记录摘要**:
```json
{
  "BgID": 1,
  "BgImage": "",
  "BgConfigJsonPath": "",
  "TriggerAnimationName": ""
}
```

### MuseumComments.json (0.02 MB, 87 条)

**字段** (6): `CommentID, AreaID, IsPositive, CommentName, CommentContent, CommentIconPath`

**首条记录摘要**:
```json
{
  "CommentID": 1,
  "AreaID": 1,
  "IsPositive": true,
  "CommentName": {
    "Hash": 14762298684435961780
  },
  "CommentContent": {
    "Hash": 9267056115631643008
  },
  "CommentIconPath": "SpriteOutput/AvatarIcon/NPC/11115.png"
}
```

### TrainPartyMTRank.json (0.02 MB, 104 条)

**字段** (3): `Rank, RankPrefabPath, RankName`

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

### ChestMonster.json (0.02 MB, 125 条)

**字段** (7): `ID, PlaneID, FloorID, GroupID, ConfigID, EventID, MonsterType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlaneID": 20001,
  "FloorID": 20001001,
  "GroupID": 28,
  "ConfigID": 200001,
  "EventID": 20001111,
  "MonsterType": "Chest"
}
```

### HudUIInfoTemplate.json (0.02 MB, 33 条)

**字段** (5): `ID, HideHudUINodeList, LockGotoTypeList, LockInputActionName, ActionOperationSetID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "HideHudUINodeList": "[\"Phone\", \"Mission\", \"Message\", \"Guide\",...",
  "LockGotoTypeList": "[\"AreaSwitch\", \"Mission\", \"PhoneNotice\",...",
  "LockInputActionName": [
    "Maze_Walk"
  ],
  "ActionOperationSetID": 135
}
```

### ActivityDiceConfig.json (0.02 MB, 50 条)

**字段** (7): `DKFDAEFMFHJ, GMPGDEINODK, ACAALPMLBFL, PICNGJMJELF, BDBHCLOLJBI, FNHCABDPBGJ, JPJGIPHPFCA`

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

### SwordTrainingAction.json (0.02 MB, 23 条)

**字段** (11): `ActionID, ActionLevel, ActionType, EffectIDList, ActionName, ActionSubName, DisplayEffectHintList, ActionImage, ActionIcon, ActionPlanImage, ActionPerformPrefab`

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
  "ActionPerformPrefab": "[\"UI/Quest/SwordTraining/ComicAct/SwordT..."
}
```

### AvatarVO.json (0.02 MB, 92 条)

**字段** (9): `VOTag, ActionBegin, ActionBeginAdvantage, ActionBeginHighThreat, ReceiveHealing, Revived, UltraReady, LightHit, StandBy`

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

### CutsceneActor.json (0.02 MB, 111 条)

**字段** (4): `ActorID, ActorModelPath, ResidentEffectKey, ResidentPossessionKey`

**首条记录摘要**:
```json
{
  "ActorID": "Actor_Bronya_00",
  "ActorModelPath": "Characters/CharacterPrefabs/Actor/Actor_...",
  "ResidentEffectKey": "",
  "ResidentPossessionKey": ""
}
```

### RelicMainAffixConfig.json (0.02 MB, 117 条)

**字段** (5): `GroupID, AffixID, Property, BaseValue, LevelAdd`

**首条记录摘要**:
```json
{
  "GroupID": 21,
  "AffixID": 1,
  "Property": "HPDelta",
  "BaseValue": {
    "Value": 45.1584
  },
  "LevelAdd": {
    "Value": 15.80544
  }
}
```

### GridFightBonusPoolV2.json (0.02 MB, 110 条)

**字段** (5): `RandomBonusID, TotalValue, BonusList, BonusMaxNumberList, BonusWeightList`

**首条记录摘要**:
```json
{
  "RandomBonusID": 2000101,
  "TotalValue": 2,
  "BonusList": [
    2
  ],
  "BonusMaxNumberList": [
    5
  ],
  "BonusWeightList": [
    100
  ]
}
```

### MatchThreeV2PVPScore.json (0.02 MB, 46 条)

**字段** (12): `ScoreID, ActivityID, GameModeList, Rarity, Type, Title, Title2, Desc, FinishType, Param, ParamMap, FixedScoreMap`

**首条记录摘要**:
```json
{
  "ScoreID": 101,
  "ActivityID": 50041,
  "GameModeList": [
    "MATCH3",
    "MATCH3_SOLO"
  ],
  "Rarity": "Gold",
  "Type": "Rank",
  "Title": {
    "Hash": 2888050649057282143
  },
  "Title2": {
    "Hash": 15214596288870990583
  },
  "Desc": {
    "Hash": 7642642519386413365
  },
  "FinishType": "Rank",
  "Param": 1,
  "ParamMap": {},
  "FixedScoreMap": "{\"1\": 1000, \"2\": 1000, \"3\": 1000, \"4\": 1..."
}
```

### AvatarPromotionConfigLD.json (0.02 MB, 28 条)

**字段** (14): `AvatarID, PromotionCostList, MaxLevel, PlayerLevelRequire, AttackBase, AttackAdd, DefenceBase, DefenceAdd, HPBase, HPAdd, SpeedBase, CriticalChance, CriticalDamage, BaseAggro`

**首条记录摘要**:
```json
{
  "AvatarID": 1014,
  "PromotionCostList": "[{\"ItemID\": 2, \"ItemNum\": 4000}, {\"ItemI...",
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

### RelicMainAffixAvatarValue.json (0.02 MB, 95 条)

**字段** (11): `AvatarID, Attack, HP, Defence, Speed, CriticalChance, CriticalDamage, StatusProbability, BreakDamage, DamageAddedRatio, SPRatio`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "Attack": 0.1,
  "HP": 0.1,
  "Defence": 1,
  "Speed": 1,
  "CriticalChance": 0.1,
  "CriticalDamage": 0.1,
  "StatusProbability": 0.8,
  "BreakDamage": 0.1,
  "DamageAddedRatio": 0.1,
  "SPRatio": 0.8
}
```

### PlayerIcon.json (0.02 MB, 112 条)

**字段** (6): `ID, ImagePath, IsVisible, Type, SortType, Sort`

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

### RogueTournTitanTalent.json (0.02 MB, 36 条)

**字段** (10): `ID, TitanType, Level, Cost, TalentTitle, TalentDesc, DescParamList, TalentIconPath, ActTitle, ActJson`

**首条记录摘要**:
```json
{
  "ID": 12001,
  "TitanType": "Moneta",
  "Level": 1,
  "Cost": [
    {
      "ItemID": 281020,
      "ItemNum": 50
    }
  ],
  "TalentTitle": {
    "Hash": 17387068967906875769
  },
  "TalentDesc": {
    "Hash": 1061377387375447842
  },
  "DescParamList": [],
  "TalentIconPath": "SpriteOutput/Rogue/Talent/1006.png",
  "ActTitle": {
    "Hash": 1940729002136459627
  },
  "ActJson": "Config/Level/RogueDialogue/RogueNpcDialo..."
}
```

### GridFightRolePropertyConfig.json (0.02 MB, 55 条)

**字段** (5): `PropertyType, IsDisplay, Order, IconPath, MiniIconPath`

**首条记录摘要**:
```json
{
  "PropertyType": "ExtraAttackAddedRatio1",
  "IsDisplay": true,
  "Order": 12,
  "IconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "MiniIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt..."
}
```

### FinishWayEventMission.json (0.02 MB, 108 条)

**字段** (7): `ID, FinishType, ParamType, ParamStr1, ParamIntList, ParamItemList, Progress`

**首条记录摘要**:
```json
{
  "ID": 100086,
  "FinishType": "Talk",
  "ParamType": "Equal",
  "ParamStr1": "EventMission_100086",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 1
}
```

### ChenLingCard.json (0.02 MB, 52 条)

**字段** (9): `ID, Type, TypeID, ShopCost, Weight, ParamList, IconPath, IconOutlinePath, EffectGridPreShow`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Type": "Soldier",
  "TypeID": 1,
  "ShopCost": 25,
  "Weight": 40,
  "ParamList": [],
  "IconPath": "SpriteOutput/Quest/ActivityChenLing/Sold...",
  "IconOutlinePath": "SpriteOutput/Quest/ActivityChenLing/Sold...",
  "EffectGridPreShow": []
}
```

### AvatarStatusConfigLD.json (0.02 MB, 43 条)

**字段** (9): `StatusID, ModifierName, StatusName, StatusType, StatusDesc, StatusIconPath, StatusIconPathHighSize, ReadParamList, TagList`

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

### ItemCureInfoData.json (0.02 MB, 101 条)

**字段** (4): `ID, CureInfoTitle, CureInfoDesc, ImgPath`

**首条记录摘要**:
```json
{
  "ID": 140066,
  "CureInfoTitle": {
    "Hash": 8473171996317953795
  },
  "CureInfoDesc": {
    "Hash": 9562581932070426903
  },
  "ImgPath": "SpriteOutput/UI/TempSprite/SubMissionTes..."
}
```

### ContentPackageConfig.json (0.02 MB, 43 条)

**字段** (7): `ContentID, MainMissionIDList, EarlyAccessCondition, ReleaseCondition, InitEntranceID, GuideConditions, AfterGuideEntranceID`

**首条记录摘要**:
```json
{
  "ContentID": 200001,
  "MainMissionIDList": [
    8023301
  ],
  "EarlyAccessCondition": "[PlayerLevel:21]&((![FinishMainMission:1...",
  "ReleaseCondition": "[FinishMainMission:1032501]",
  "InitEntranceID": 1030403,
  "GuideConditions": "[FinishSubMission:802330102]",
  "AfterGuideEntranceID": 1030402
}
```

### DrinkMakerCheersIngredient.json (0.02 MB, 38 条)

**字段** (9): `ID, IncludeTagList, IngredientName, IngredientDesc, IconPath, SmallIconPath, Color, PhyParam, EffParam`

**首条记录摘要**:
```json
{
  "ID": 1000,
  "IncludeTagList": [
    1001,
    1004
  ],
  "IngredientName": {
    "Hash": 223693193062117860
  },
  "IngredientDesc": {
    "Hash": 14519468350142307269
  },
  "IconPath": "SpriteOutput/Quest/DrinkMaker/ItemIcon/S...",
  "SmallIconPath": "SpriteOutput/Quest/DrinkMaker/ItemIconLi...",
  "Color": [
    199,
    112,
    186
  ],
  "PhyParam": [
    0.8,
    0,
    0,
    0.3
  ],
  "EffParam": [
    1,
    0,
    0,
    0
  ]
}
```

### HeliobusSpecialPost.json (0.02 MB, 16 条)

**字段** (5): `HeliobusSpecialPostID, SubMissionID, PostImgIDList, TemplateIDList, Likes`

**首条记录摘要**:
```json
{
  "HeliobusSpecialPostID": 6101,
  "SubMissionID": 801510118,
  "PostImgIDList": [
    6101
  ],
  "TemplateIDList": [
    610101,
    610102,
    610103
  ],
  "Likes": "[{\"DOHOMJBJLLG\": 698}, {\"GNIFLCBGAAA\": 1..."
}
```

### LoopCGEncryptionConfig.json (0.02 MB, 441 条)

**字段** (1): `VideoID`

**首条记录摘要**:
```json
{
  "VideoID": 101
}
```

### RogueNousTalent.json (0.02 MB, 40 条)

**字段** (9): `TalentID, NextTalentIDList, Cost, UnlockIDList, Icon, EffectTag, EffectTitle, EffectDesc, EffectDescParamList`

**首条记录摘要**:
```json
{
  "TalentID": 101,
  "NextTalentIDList": [
    201
  ],
  "Cost": [
    {
      "ItemID": 281013,
      "ItemNum": 250
    }
  ],
  "UnlockIDList": [],
  "Icon": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "EffectTag": {
    "Hash": 13054281870394055602
  },
  "EffectTitle": {
    "Hash": 17872332580203135893
  },
  "EffectDesc": {
    "Hash": 2476122351637728858
  },
  "EffectDescParamList": [
    {
      "Value": 0.2
    }
  ]
}
```

### SwordTrainingCondition.json (0.02 MB, 176 条)

**字段** (3): `ConditionID, CheckType, ParamList`

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

### AetherDivideChallengeList.json (0.02 MB, 42 条)

**字段** (13): `ID, GroupID, BattleAreaID, Rank, OpponentImagePath, OpponentPrefabPath, OpponentImageIconPath, OpponentName, OpponentStrength, VersusImagePath, RewardID, EventID, MissionID`

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

### ChimeraDuelItem.json (0.02 MB, 48 条)

**字段** (10): `ItemID, Type, ItemName, Vendor, Price, Rarity, SkillIDList, EffectID, ShopItemIconPath, ChimeraItemIconPath`

**首条记录摘要**:
```json
{
  "ItemID": 1101,
  "Type": "Food",
  "ItemName": {
    "Hash": 17129699891615886376
  },
  "Vendor": "Default",
  "Price": 3,
  "Rarity": 1,
  "SkillIDList": [
    110101
  ],
  "EffectID": 8001,
  "ShopItemIconPath": "SpriteOutput/Quest/ChimeraDuel/ChimeraDu...",
  "ChimeraItemIconPath": "SpriteOutput/Quest/ChimeraDuel/ChimeraDu..."
}
```

### IdleLiveMessageContent.json (0.02 MB, 110 条)

**字段** (5): `ContentID, SenderID, MainText, NextContentID, ContentType`

**首条记录摘要**:
```json
{
  "ContentID": 1010,
  "SenderID": 4,
  "MainText": {
    "Hash": 10360930866046369098
  },
  "NextContentID": [
    1011
  ],
  "ContentType": "DisplayText"
}
```

### FateReijuAffix.json (0.02 MB, 60 条)

**字段** (7): `HNIMELBCBBJ, PMIEAEGJNMJ, HEDNBIABAKP, IDABEFMAPFE, MDEBFIFOKHH, BEOGEKDEPLO, LBLJLNPBDPB`

**首条记录摘要**:
```json
{
  "HNIMELBCBBJ": 4000,
  "PMIEAEGJNMJ": "Legendary",
  "HEDNBIABAKP": {
    "Hash": 6873455534942088452
  },
  "IDABEFMAPFE": {
    "Hash": 2692144553455666898
  },
  "MDEBFIFOKHH": [],
  "BEOGEKDEPLO": [],
  "LBLJLNPBDPB": ""
}
```

### PlayerReturnConfig.json (0.02 MB, 27 条)

**字段** (16): `PlayerReturnID, DispatchLink, FarmMultipleDropID, LimitTime, QuestGroupID, ReturnRewardIDList, KeyPointID, LoginReward, ValidityPeriod, DailyDoubleTime, TotalDoubleTime, ExtraMultipleDropList, RecommendAvatar, RecommendMission, RecommendActivity, AssistGroupID`

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

### AetherDividePassiveSkill.json (0.02 MB, 32 条)

**字段** (11): `ItemID, PassiveSkillName, ItemDescription, PassiveSkillDescription, SimpleExtraEffectIDList, ExtraEffectIDList, AbilityName, PassiveSkillType, Rarity, SimpleParamList, ParamList`

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

### ChenLingSoldierUnit.json (0.02 MB, 50 条)

**字段** (12): `UnitID, SoldierID, UnitLevel, Scale, ReadyScale, Atk, Hp, AtkSpd, MoveSpd, Crt, CrtDMG, Range`

**首条记录摘要**:
```json
{
  "UnitID": 101,
  "SoldierID": 1,
  "UnitLevel": 1,
  "Scale": 1,
  "ReadyScale": 0.4,
  "Atk": {
    "Value": 26
  },
  "Hp": {
    "Value": 240
  },
  "AtkSpd": {
    "Value": 0.5
  },
  "MoveSpd": {
    "Value": 4.8
  },
  "Crt": {
    "Value": 20
  },
  "CrtDMG": {
    "Value": 150
  },
  "Range": {
    "Value": 0.5
  }
}
```

### RogueDLCAeonCabinet.json (0.02 MB, 31 条)

**字段** (11): `CabinetID, CabinetType, UnlockCabinetID, QuestID, FinishAeonDimensionPointList, CabinetIcon, CabinetName, CabinetMissionDesc, CabinetDesc, Sort, DescParam`

**首条记录摘要**:
```json
{
  "CabinetID": 1,
  "CabinetType": "Normal",
  "UnlockCabinetID": [],
  "QuestID": 6013201,
  "FinishAeonDimensionPointList": "[{\"DimensionID\": 1, \"Increments\": 1}, {\"...",
  "CabinetIcon": "SpriteOutput/Rogue/DLC/Dice/MissionTree/...",
  "CabinetName": {
    "Hash": 12580168975159807047
  },
  "CabinetMissionDesc": {
    "Hash": 16982659022799858834
  },
  "CabinetDesc": {
    "Hash": 14521726860113800121
  },
  "Sort": 1,
  "DescParam": [
    750
  ]
}
```

### EvoBdSCCardConfig.json (0.02 MB, 56 条)

**字段** (9): `LvID, ID, Type, ItemIcon, ItemMiniIcon, ParamList, UnlockQuest, Season, CardSelectablePeriod`

**首条记录摘要**:
```json
{
  "LvID": 31137031,
  "ID": 3113703,
  "Type": "Growth",
  "ItemIcon": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "ItemMiniIcon": "",
  "ParamList": [],
  "UnlockQuest": 6070210,
  "Season": "SecondChapter",
  "CardSelectablePeriod": [
    2,
    3
  ]
}
```

### ChimeraDuelPresetTeam.json (0.02 MB, 144 条)

**字段** (3): `TeamID, MasterID, PresetIDList`

**首条记录摘要**:
```json
{
  "TeamID": 703001,
  "MasterID": 602,
  "PresetIDList": [
    1011,
    1012
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

### ChimeraDuelChimeraLevel.json (0.02 MB, 219 条)

**字段** (3): `ChimeraID, Level, SkillIDList`

**首条记录摘要**:
```json
{
  "ChimeraID": 101,
  "Level": 1,
  "SkillIDList": [
    10101
  ]
}
```

### MazePuzzleDollyZoomTeleport.json (0.02 MB, 74 条)

**字段** (8): `ID, FloorID, GroupID, InstanceIDA, OverridePosA, InstanceIDB, OverridePosB, PuzzlePrefab`

**首条记录摘要**:
```json
{
  "ID": 2041101,
  "FloorID": 20411001,
  "GroupID": 89,
  "InstanceIDA": 300001,
  "OverridePosA": 1,
  "InstanceIDB": 300002,
  "OverridePosB": 2,
  "PuzzlePrefab": "Gameplays/DollyZoomTeleport/DZTeleport_P..."
}
```

### RelicSubAffixAvatarValue.json (0.02 MB, 95 条)

**字段** (10): `AvatarID, Attack, HP, Defence, Speed, CriticalChance, CriticalDamage, StatusProbability, StatusResistance, BreakDamage`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "Attack": 0.1,
  "HP": 0.1,
  "Defence": 1,
  "Speed": 1,
  "CriticalChance": 0.1,
  "CriticalDamage": 0.1,
  "StatusProbability": 0.8,
  "StatusResistance": 0.8,
  "BreakDamage": 0.1
}
```

### ScheduleDataActivityPanel.json (0.02 MB, 183 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 510012,
  "BeginTime": "2022-08-11 10:00:00",
  "EndTime": "2022-09-20 04:00:01"
}
```

### SwordTrainingProgress.json (0.02 MB, 60 条)

**字段** (6): `TurnID, TurnType, ActionIDList, RecommendPower, TurnName, SectionHint`

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

### NPCMonsterTrackConfig.json (0.02 MB, 76 条)

**字段** (4): `ID, MapEntranceID, NPCMonsterMarkList, SortID`

**首条记录摘要**:
```json
{
  "ID": 111001,
  "MapEntranceID": 2010101,
  "NPCMonsterMarkList": "[2010101, 2010102, 2010103, 2010104, 201...",
  "SortID": 4
}
```

### ActionOperationSet.json (0.02 MB, 144 条)

**字段** (2): `ID, ActionNameList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActionNameList": [
    "ActionGroup_Return"
  ]
}
```

### RoguePersonaRoomAttribute.json (0.02 MB, 55 条)

**字段** (6): `HHPFKDEBMGP, MJOOFPBABEA, NMAHGFAPENI, PBLPLDJKPEI, OOMBNFMJLEO, OLOIFNNLKJP`

**首条记录摘要**:
```json
{
  "HHPFKDEBMGP": 101,
  "MJOOFPBABEA": {
    "Hash": 1192557363478528000
  },
  "NMAHGFAPENI": {
    "Hash": 16760361666979060036
  },
  "PBLPLDJKPEI": [
    {
      "Value": 100
    }
  ],
  "OOMBNFMJLEO": "Positive",
  "OLOIFNNLKJP": "SpriteOutput/Rogue/Tourn/Persona/RoomBuf..."
}
```

### LimaoNewsInterview.json (0.02 MB, 15 条)

**字段** (9): `DKPOHCDMHBF, LNHLPKEHJBA, HMFGANHKHIM, LMDEHNMJHDJ, PFKLDBGEGAO, GEKGGMKGIPE, EECIBIDGPEI, LIDHGBEAJMA, KMIBDJKKGDE`

**首条记录摘要**:
```json
{
  "DKPOHCDMHBF": 201,
  "LNHLPKEHJBA": {
    "Hash": 1513001872307035594
  },
  "HMFGANHKHIM": {
    "Hash": 5169119345462893113
  },
  "LMDEHNMJHDJ": "SpriteOutput/UI/LimaoNews/PostPic/Spcial...",
  "PFKLDBGEGAO": "SpriteOutput/UI/LimaoNews/PostPic/Spcial...",
  "GEKGGMKGIPE": [],
  "EECIBIDGPEI": "[20100, 20101, 20102, 20103, 20104, 2010...",
  "LIDHGBEAJMA": "[201001, 201002, 201003, 201004, 201005,...",
  "KMIBDJKKGDE": 16032
}
```

### FateAffix.json (0.02 MB, 71 条)

**字段** (7): `BELHHHIHCEF, PMIEAEGJNMJ, HEDNBIABAKP, IDABEFMAPFE, MDEBFIFOKHH, BEOGEKDEPLO, LBLJLNPBDPB`

**首条记录摘要**:
```json
{
  "BELHHHIHCEF": 3001,
  "PMIEAEGJNMJ": "Common",
  "HEDNBIABAKP": {
    "Hash": 5718413461698639287
  },
  "IDABEFMAPFE": {
    "Hash": 17072642275892253757
  },
  "MDEBFIFOKHH": [
    {
      "Value": 2
    }
  ],
  "BEOGEKDEPLO": [],
  "LBLJLNPBDPB": ""
}
```

### RogueTournPermanentTalent.json (0.02 MB, 38 条)

**字段** (9): `TalentID, IsImportant, NextTalentIDList, Cost, Icon, EffectTag, EffectTitle, EffectDesc, EffectDescParamList`

**首条记录摘要**:
```json
{
  "TalentID": 100,
  "IsImportant": true,
  "NextTalentIDList": [
    101,
    301,
    501
  ],
  "Cost": [
    {
      "ItemID": 281018,
      "ItemNum": 100
    }
  ],
  "Icon": "SpriteOutput/Rogue/Talent/1006.png",
  "EffectTag": {
    "Hash": 1088094891818916936
  },
  "EffectTitle": {
    "Hash": 5948844923736049166
  },
  "EffectDesc": {
    "Hash": 6247385609997241073
  },
  "EffectDescParamList": []
}
```

### VideoEncryptionConfig.json (0.02 MB, 349 条)

**字段** (2): `VideoID, Encryption`

**首条记录摘要**:
```json
{
  "VideoID": 1,
  "Encryption": true
}
```

### ActivityDiceShopGoodsConfig.json (0.02 MB, 56 条)

**字段** (6): `DiceShopGoodsID, ItemID, ItemCost, UnlockCondition, GoodsSortID, UnlockTipsList`

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

### GridFightCyreneModify.json (0.02 MB, 63 条)

**字段** (6): `ModifyRoleID, ModifySkillID, ModifySkillIndexs, ModifyOps, ModifyValues, CyreneMultipleValueKey`

**首条记录摘要**:
```json
{
  "ModifyRoleID": 1403,
  "ModifySkillID": 14039901,
  "ModifySkillIndexs": [
    1
  ],
  "ModifyOps": [
    "Add"
  ],
  "ModifyValues": [
    {
      "Value": 0.06
    }
  ],
  "CyreneMultipleValueKey": "GP_Avatar_Cyrene_01"
}
```

### ChimeraDuelRound.json (0.02 MB, 55 条)

**字段** (8): `RoundID, ShopChimeraSlotCount, ShopItemSlotCount, ShopChimeraGroup, ShopChimeraWeightList, ShopItemGroup, ShopItemWeightList, ShopUnlockTutorial`

**首条记录摘要**:
```json
{
  "RoundID": 1001,
  "ShopChimeraSlotCount": 3,
  "ShopItemSlotCount": 1,
  "ShopChimeraGroup": 40011,
  "ShopChimeraWeightList": [
    60,
    40,
    0,
    0,
    10
  ],
  "ShopItemGroup": 60015,
  "ShopItemWeightList": [
    60,
    40,
    0,
    0
  ],
  "ShopUnlockTutorial": ""
}
```

### RogueDLCBossDecay.json (0.02 MB, 42 条)

**字段** (9): `BossDecayID, BossDecayName, BossDecayDesc, DescParam, ExtraDesc, BossDecayComeFrom, DecayIcon, EffectParamList, BossEffectIcon`

**首条记录摘要**:
```json
{
  "BossDecayID": 1,
  "BossDecayName": {
    "Hash": 2176176528586309632
  },
  "BossDecayDesc": {
    "Hash": 6788458352882615967
  },
  "DescParam": [],
  "ExtraDesc": [],
  "BossDecayComeFrom": {
    "Hash": 15903815692538113266
  },
  "DecayIcon": "SpriteOutput/UI/Rogue/DLC/Dice/IconRogue...",
  "EffectParamList": [
    610001
  ],
  "BossEffectIcon": ""
}
```

### ActivityDiceSkill.json (0.02 MB, 62 条)

**字段** (6): `CDNGHDNMMAG, PMKEDGGOLKD, PBLPLDJKPEI, NJJEIJGIENP, NMAHGFAPENI, PGAMJHMNLLN`

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

### GridFightBackServant.json (0.02 MB, 265 条)

**字段** (3): `RoleID, Star, BESkillIDList`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "Star": 1,
  "BESkillIDList": []
}
```

### IdleLiveTechTreePoint.json (0.02 MB, 34 条)

**字段** (13): `ID, Type, AbilityName, AbilityParamList, TechPowerFactor, TechAddPower, Cost, PrePointIDList, IsBase, IconPath, Name, Desc, IsMainPoint`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "AddAbility",
  "AbilityName": "RtBattle_SkillTree_CommonTree_Point4",
  "AbilityParamList": [
    {
      "Value": 25
    }
  ],
  "TechPowerFactor": {
    "Value": 0.1
  },
  "TechAddPower": {
    "Value": 3000
  },
  "Cost": 1,
  "PrePointIDList": [],
  "IsBase": true,
  "IconPath": "SpriteOutput/UI/Avatar/Icon/IconEnergyRe...",
  "Name": {
    "Hash": 2556084615123273284
  },
  "Desc": {
    "Hash": 3640456732851834329
  },
  "IsMainPoint": true
}
```

### RogueMagicUnitDisplay.json (0.02 MB, 109 条)

**字段** (2): `MagicUnitID, MagicUnitIcon`

**首条记录摘要**:
```json
{
  "MagicUnitID": 4001,
  "MagicUnitIcon": "SpriteOutput/BuffIcon/Inlevel/IconDotBur..."
}
```

### MazePuzzleOrigamiFD.json (0.02 MB, 83 条)

**字段** (8): `FloorID, GroupID, MainPropID, ColonyID, FDSGP, FDSGPValue, FDContainerID, FDEntityID`

**首条记录摘要**:
```json
{
  "FloorID": 20502001,
  "GroupID": 73,
  "MainPropID": 300010,
  "ColonyID": 33,
  "FDSGP": "LG_110001__154_MapIconState_Auto",
  "FDSGPValue": 2,
  "FDContainerID": 110001,
  "FDEntityID": 154
}
```

### SKillNavigationConfig.json (0.02 MB, 166 条)

**字段** (6): `AvatarBaseType, PointID, Up, Down, Left, Right`

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

### PlanetFesRecommendTeam.json (0.02 MB, 27 条)

**字段** (5): `FesLevel, ID, Exhibition, Business, Game`

**首条记录摘要**:
```json
{
  "FesLevel": 1,
  "ID": 1,
  "Exhibition": "[{\"ACCJKGEKHKP\": 8, \"OPJDGJNAKFF\": 20}, ...",
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

### RogueTournLayerRoom.json (0.02 MB, 103 条)

**字段** (5): `LayerID, RoomIndex, Door1, Door2, Door3`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "RoomIndex": 1,
  "Door1": {
    "0": 1
  },
  "Door2": {
    "103": 1
  },
  "Door3": {
    "0": 1
  }
}
```

### CutSceneConfig.json (0.02 MB, 41 条)

**字段** (10): `CutSceneName, IsPlayerInvolved, CutScenePath, CutSceneSFXJsonPath, CutSceneBGMStateName, CaptionPath, PosOffSet, MazePlaneID, MazeFloorID, HideBlockList`

**首条记录摘要**:
```json
{
  "CutSceneName": "CS_Chap01_Act010",
  "IsPlayerInvolved": true,
  "CutScenePath": "CutScene/_Timeline/CS_Chap01_Act010_Time...",
  "CutSceneSFXJsonPath": "",
  "CutSceneBGMStateName": "State_Cutscene_010",
  "CaptionPath": "",
  "PosOffSet": [
    0,
    0,
    0
  ],
  "MazePlaneID": 10000,
  "MazeFloorID": 10000000,
  "HideBlockList": []
}
```

### MonsterDropUnique.json (0.02 MB, 203 条)

**字段** (2): `MonsterTemplateID, DisplayItemList`

**首条记录摘要**:
```json
{
  "MonsterTemplateID": 7001010,
  "DisplayItemList": []
}
```

### ChallengeStoryGroupExtra.json (0.02 MB, 25 条)

**字段** (10): `GroupID, ThemeToastPicPath, ThemeIconPicPath, ThemePosterEffectPrefabPath, ThemePosterBgPicPath, ThemePosterTabPicPath, ThemeID, SubMazeBuffList, StoryType, BuffList`

**首条记录摘要**:
```json
{
  "GroupID": 2001,
  "ThemeToastPicPath": "SpriteOutput/ChallengeTheme/ThemePic/Cha...",
  "ThemeIconPicPath": "SpriteOutput/ChallengeTheme/ThemeIcon/Ch...",
  "ThemePosterEffectPrefabPath": "UI/Abyss/ChallengeStoryPosterEffThemePan...",
  "ThemePosterBgPicPath": "SpriteOutput/ChallengeTheme/ThemeBg/Chal...",
  "ThemePosterTabPicPath": "SpriteOutput/Quest/TabIcon/BtnChallengeS...",
  "ThemeID": 1,
  "SubMazeBuffList": [],
  "StoryType": "Normal",
  "BuffList": [
    3031301,
    3031302,
    3031303
  ]
}
```

### DailyMissionData.json (0.02 MB, 88 条)

**字段** (6): `ID, DailyMissionType, GroupID, UnlockMainMission, IconPath, QuestID`

**首条记录摘要**:
```json
{
  "ID": 3000201,
  "DailyMissionType": 1,
  "GroupID": 30002,
  "UnlockMainMission": 2000116,
  "IconPath": "SpriteOutput/TabIcon/Quest/QuestDailyIco...",
  "QuestID": 2100003
}
```

### GridFightSeasonAugment.json (0.02 MB, 334 条)

**字段** (2): `AugmentID, SeasonID`

**首条记录摘要**:
```json
{
  "AugmentID": 100101,
  "SeasonID": 1
}
```

### FateHougu.json (0.02 MB, 34 条)

**字段** (11): `OHFGNODANEP, GMPGDEINODK, LEPNNKOAOJF, GMGEMCFDIOE, CBCOAKMDBHD, MDEBFIFOKHH, BEOGEKDEPLO, NGAGNNIHGFE, ILLBMODJJGP, EFAIIOHKFGD, AMONFPEGLAF`

**首条记录摘要**:
```json
{
  "OHFGNODANEP": 1001,
  "GMPGDEINODK": "Fake",
  "LEPNNKOAOJF": {
    "Hash": 7849154998020094009
  },
  "GMGEMCFDIOE": {
    "Hash": 7608999115480777201
  },
  "CBCOAKMDBHD": {
    "Hash": 9317393799569703429
  },
  "MDEBFIFOKHH": [
    {
      "Value": 0.1
    }
  ],
  "BEOGEKDEPLO": [],
  "NGAGNNIHGFE": "SpriteOutput/Collaboration/Fate/FateHoju...",
  "ILLBMODJJGP": 99,
  "EFAIIOHKFGD": 3152001,
  "AMONFPEGLAF": 4
}
```

### ConstValueSwordTraining.json (0.02 MB, 60 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "SwordTraining_Skill_Point_Item_ID",
  "Value": {
    "IntValue": 281023
  }
}
```

### FunctionHud.json (0.02 MB, 74 条)

**字段** (7): `ID, FunctionID, Name, IconPath, RedDot, OverrideHudIconPath, RedDotHud`

**首条记录摘要**:
```json
{
  "ID": 2,
  "FunctionID": 2,
  "Name": {
    "Hash": 6024850270121446748
  },
  "IconPath": "SpriteOutput/PhoneAPPIcon/MapIcon.png",
  "RedDot": "",
  "OverrideHudIconPath": "",
  "RedDotHud": ""
}
```

### IdleLiveEquipDiscard.json (0.02 MB, 120 条)

**字段** (3): `EquipLevel, EquipLevelAddPower, SpEquipLevelAddPower`

**首条记录摘要**:
```json
{
  "EquipLevel": 1,
  "EquipLevelAddPower": {
    "Value": 105
  },
  "SpEquipLevelAddPower": {
    "Value": 315
  }
}
```

### LimaoNewsContent.json (0.02 MB, 102 条)

**字段** (5): `DFFLADLLADD, MMNJODIJPOE, ANECPHCPLPP, ODLDEEANNCM, EEIEODMEMFI`

**首条记录摘要**:
```json
{
  "DFFLADLLADD": 40200101,
  "MMNJODIJPOE": "Text",
  "ANECPHCPLPP": {
    "Hash": 10558367673738183344
  },
  "ODLDEEANNCM": "",
  "EEIEODMEMFI": ""
}
```

### TextSpriteConfig.json (0.02 MB, 124 条)

**字段** (2): `SpriteName, SpritePath`

**首条记录摘要**:
```json
{
  "SpriteName": "ActivityChimeraATK",
  "SpritePath": "SpriteOutput/UI/Quest/Chimera/ChimeraTex..."
}
```

### MatchThreeBird.json (0.02 MB, 30 条)

**字段** (14): `BirdID, SkillID, BirdName, BirdDesc, ModelPath, FaceMat, DefaultEmo, WinEmo, DrawEmo, LoseEmo, ImagePath, IconPath, IsShow, GuideID`

**首条记录摘要**:
```json
{
  "BirdID": 300,
  "SkillID": 400,
  "BirdName": {
    "Hash": 12008905950214015285
  },
  "BirdDesc": {
    "Hash": 14183593592437106551
  },
  "ModelPath": "Characters/NPC/Special/OrigamiBird/Matie...",
  "FaceMat": "Characters/NPC/Special/OrigamiBird/Matie...",
  "DefaultEmo": 12,
  "WinEmo": 13,
  "DrawEmo": 14,
  "LoseEmo": 15,
  "ImagePath": "SpriteOutput/Quest/MatchThree/ImgBirdPla...",
  "IconPath": "SpriteOutput/Quest/MatchThree/ImgBirdMid...",
  "IsShow": true,
  "GuideID": 8131
}
```

### BattleBGM.json (0.02 MB, 188 条)

**字段** (2): `BGMName, Priority`

**首条记录摘要**:
```json
{
  "BGMName": "State_Combat_Silence",
  "Priority": 100
}
```

### RogueTournGambleUnit.json (0.02 MB, 89 条)

**字段** (4): `GambleUnitID, GambleUnitType, GambleUnitParam, GambleUnitIcon`

**首条记录摘要**:
```json
{
  "GambleUnitID": 101,
  "GambleUnitType": "BuffCommon",
  "GambleUnitParam": 1010001,
  "GambleUnitIcon": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### ActivityAvatarSkillConfigLD.json (0.02 MB, 12 条)

**字段** (31): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, SPNeed, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect, SkillComboValueDelta`

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
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
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

### EvoBdSCGearCollection.json (0.02 MB, 45 条)

**字段** (8): `ID, Name, LvMax, ItemIcon, ElementList, TagList, Season, DamageCustomName`

**首条记录摘要**:
```json
{
  "ID": 3113001,
  "Name": {
    "Hash": 15171578985747915758
  },
  "LvMax": 8,
  "ItemIcon": "SpriteOutput/Quest/EvolveBuild/EvoLveBui...",
  "ElementList": "[\"Ice\", \"Fire\", \"Wind\", \"Thunder\", \"Quan...",
  "TagList": [
    1,
    2
  ],
  "Season": "SecondChapter",
  "DamageCustomName": "VS_Weapon_SC_001_Base"
}
```

### CakeRaceCat.json (0.02 MB, 15 条)

**字段** (17): `CatID, CatName, CatIcon, CatMiddleIcon, CatMiniIcon, CatMatPath, CatPrefabPath, CatAIJson, CatAbilityJson, CatSkillTitle, CatSkillDesc, CakeTips, StartPerformanceIDList, BetPerformanceIDList, ChampionPerformanceIDList, RunnerupPerformanceIDList, TitlePerformanceIDList`

**首条记录摘要**:
```json
{
  "CatID": 1,
  "CatName": {
    "Hash": 9075955232653033174
  },
  "CatIcon": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "CatMiddleIcon": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake...",
  "CatMiniIcon": "SpriteOutput/Quest/CakeRace/CakeHeadIcon...",
  "CatMatPath": "Characters/NPC/Special/RuanMadeCake/Mati...",
  "CatPrefabPath": "",
  "CatAIJson": "Config/Gameplays/LittleGame/CakeRace/AI/...",
  "CatAbilityJson": "Config/Gameplays/LittleGame/CakeRace/Abi...",
  "CatSkillTitle": {
    "Hash": 12798017427019615582
  },
  "CatSkillDesc": {
    "Hash": 941393386944536356
  },
  "CakeTips": {
    "Hash": 16653073237706757390
  },
  "StartPerformanceIDList": [],
  "BetPerformanceIDList": [
    2011,
    2012
  ],
  "ChampionPerformanceIDList": [
    2015
  ],
  "RunnerupPerformanceIDList": [
    2016
  ],
  "TitlePerformanceIDList": [
    2014
  ]
}
```

### ActivityDiceLuckControl.json (0.02 MB, 20 条)

**字段** (9): `OGMFNGPLDOB, HDJGBKABEKF, OGDLLCOBDNB, DJGJIPEMIGE, JPOEFHLLNIK, AANFAMJILOB, ENIJMCCMFFJ, KLGMFBFNALH, NOIDIGCCPEJ`

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
  "JPOEFHLLNIK": "[1, 2, 3, 4, 5, 5, 10, 10, 10, 15, 15, 2...",
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
  "NOIDIGCCPEJ": "[20, 15, 15, 10, 10, 10, 5, 5, 4, 3, 2, ..."
}
```

### TutorialSubGuideData.json (0.02 MB, 115 条)

**字段** (3): `PHFMCACHFIJ, FBKAMIHGLFK, PJHMJKEIGOA`

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

### GridFightEquipRecommendRole.json (0.02 MB, 133 条)

**字段** (2): `EquipID, RecommendRoleIDList`

**首条记录摘要**:
```json
{
  "EquipID": 35030101,
  "RecommendRoleIDList": [
    1310,
    1315,
    1015,
    1204,
    1402,
    1502
  ]
}
```

### RogueTournTitanBless.json (0.02 MB, 84 条)

**字段** (6): `TitanBlessID, TitanType, TitanBlessLevel, MazeBuffID, ExtraEffectIDList, BlessBattleDisplayCategoryList`

**首条记录摘要**:
```json
{
  "TitanBlessID": 10101,
  "TitanType": "Ianos",
  "TitanBlessLevel": 1,
  "MazeBuffID": 634020,
  "ExtraEffectIDList": [],
  "BlessBattleDisplayCategoryList": []
}
```

### ChimeraDuelMaster.json (0.02 MB, 13 条)

**字段** (25): `MasterID, AvatarID, SkillIDList, SignatureChimeraID, MasterDisplayOrder, Difficulty, FigurePath, FloorGroupID, BattleAvatarFloorConfigID, BattleOpponentAvatarFloorConfigID, MasterSelectAvatarFloorConfigID, VictoryText, LossText, DrawText, VictoryEmojiPath, LossEmojiPath, DrawEmojiPath, MasterSkillDescription, ChimeraSkillDescription, RecommendationTitle, BattleVSBodyType, MasterAudio, MasterHeadIconPath, TalkSentenceID, FriendChallengeMasterIcon`

**首条记录摘要**:
```json
{
  "MasterID": 601,
  "AvatarID": 1409,
  "SkillIDList": [
    60101
  ],
  "SignatureChimeraID": 501,
  "MasterDisplayOrder": 2,
  "Difficulty": 1,
  "FigurePath": "SpriteOutput/AvatarDrawCard/1409.png",
  "FloorGroupID": 949,
  "BattleAvatarFloorConfigID": 400001,
  "BattleOpponentAvatarFloorConfigID": 400016,
  "MasterSelectAvatarFloorConfigID": 400014,
  "VictoryText": {
    "Hash": 7796718188930158929
  },
  "LossText": {
    "Hash": 16576739648495546241
  },
  "DrawText": {
    "Hash": 7715698376437670621
  },
  "VictoryEmojiPath": "SpriteOutput/Emoji/122012.png",
  "LossEmojiPath": "SpriteOutput/Emoji/122009.png",
  "DrawEmojiPath": "SpriteOutput/Emoji/122010.png",
  "MasterSkillDescription": {
    "Hash": 15256464317325616456
  },
  "ChimeraSkillDescription": {
    "Hash": 17544075958957342362
  },
  "RecommendationTitle": {
    "Hash": 698253354548387769
  },
  "BattleVSBodyType": "Middle",
  "MasterAudio": "Ev_vo_ambient_w4_v380_broadcast_hyacine_...",
  "MasterHeadIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1409...",
  "TalkSentenceID": 831071001,
  "FriendChallengeMasterIcon": "SpriteOutput/AvatarIconTeam/1409B.png"
}
```

### PixAirEnemyConfig.json (0.02 MB, 60 条)

**字段** (6): `EnemyID, EquipsID, EquipsLevel, CoinLoot, DisplayID, HP`

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

### UniqueActor.json (0.02 MB, 204 条)

**字段** (2): `UniqueName, ActorID`

**首条记录摘要**:
```json
{
  "UniqueName": "Bronya_00",
  "ActorID": "Actor_Bronya_00"
}
```

### ActivityHipplenPhase.json (0.02 MB, 12 条)

**字段** (14): `CycleID, PhaseType, GrowthPhaseID, ActionPointsTotal, StatRange, StatGrade, ForwardTrialSubMissionID, ForwardTrialClosePage, BackwardTrialClosePage, UnlockAutoTrialConditions, TrialGameID, TrailTargetDesc, DailyAgendaIDs, MiniGameAreaPath`

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
  "StatGrade": "[{\"GMPGDEINODK\": \"SSS\", \"NNACKOBKFGE\": 1...",
  "ForwardTrialSubMissionID": 803610103,
  "ForwardTrialClosePage": true,
  "BackwardTrialClosePage": true,
  "UnlockAutoTrialConditions": "[{\"GMPGDEINODK\": \"StatValue\", \"NNACKOBKF...",
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

### IdleLiveSpineAnimGroup.json (0.02 MB, 71 条)

**字段** (3): `AnimGroupID, MaleStateList, FemaleStateList`

**首条记录摘要**:
```json
{
  "AnimGroupID": 1,
  "MaleStateList": [
    "Move_Sit_Idle"
  ],
  "FemaleStateList": [
    "Move_Sit_Idle"
  ]
}
```

### GridFightSpecialGoods.json (0.02 MB, 43 条)

**字段** (10): `ID, GroupID, Cost, Quality, IconPath, MiniIconPath, JsonPath, GoodName, GoodDesc, EffectParamList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "GroupID": 1,
  "Cost": 24,
  "Quality": 1,
  "IconPath": "",
  "MiniIconPath": "",
  "JsonPath": "Config/Level/GridFight/SpecialGoods/Cyre...",
  "GoodName": {
    "Hash": 678352926252366
  },
  "GoodDesc": {
    "Hash": 11037750777867872464
  },
  "EffectParamList": []
}
```

### RogueDLCSubStory.json (0.02 MB, 42 条)

**字段** (6): `RogueDLCSubStoryID, Layer, LevelGraphPath, OptionPath, SubStoryName, ImgPath`

**首条记录摘要**:
```json
{
  "RogueDLCSubStoryID": 101,
  "Layer": 1,
  "LevelGraphPath": "Config/Level/RogueDialogue/RogueDialogue...",
  "OptionPath": "Config/Level/RogueDialogue/RogueDialogue...",
  "SubStoryName": {
    "Hash": 2231265055562231027
  },
  "ImgPath": "SpriteOutput/Rogue/RandomEvent/Horizon/R..."
}
```

### GridFightPrayQuestFinishWay.json (0.02 MB, 73 条)

**字段** (9): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress, IsBackTrack`

**首条记录摘要**:
```json
{
  "ID": 7320001,
  "FinishType": "GridFightTraitRoleTotalStar",
  "ParamType": "NoPara",
  "ParamInt1": 1013,
  "ParamStr1": "",
  "ParamIntList": [],
  "ParamItemList": [],
  "Progress": 5,
  "IsBackTrack": true
}
```

### FateBuff.json (0.02 MB, 51 条)

**字段** (8): `NDAIGIEMABD, NOKPLOBPMMD, OFNCHIDJOME, BEOGEKDEPLO, BJBGDFFIFJF, PMIEAEGJNMJ, EFAIIOHKFGD, JFGICGNCKDA`

**首条记录摘要**:
```json
{
  "NDAIGIEMABD": 10101,
  "NOKPLOBPMMD": 101,
  "OFNCHIDJOME": 207,
  "BEOGEKDEPLO": [],
  "BJBGDFFIFJF": "SpriteOutput/Collaboration/Fate/FateClas...",
  "PMIEAEGJNMJ": "Normal",
  "EFAIIOHKFGD": 3151011,
  "JFGICGNCKDA": {
    "Hash": 11704338782879787708
  }
}
```

### AvatarComefrom.json (0.02 MB, 91 条)

**字段** (6): `ID, ComefromID, Sort, Desc, GotoID, GotoParam`

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

### TreasureDungeonItem.json (0.02 MB, 46 条)

**字段** (8): `ItemID, Type, TypeParam, ParamInt, Name, IconPath, IconPath2D, AudioEventName`

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

### MonopolyGoodsConfig.json (0.01 MB, 60 条)

**字段** (6): `GoodsID, Cost, GoodsType, Name, Desc, IconPath`

**首条记录摘要**:
```json
{
  "GoodsID": 1001,
  "Cost": 1200,
  "GoodsType": "Buff",
  "Name": {
    "Hash": 4276269442523892374
  },
  "Desc": {
    "Hash": 2304418440836809528
  },
  "IconPath": "SpriteOutput/ItemFigures/281014.png"
}
```

### HeliobusTemplate.json (0.01 MB, 39 条)

**字段** (8): `HeliobusTemplateID, TemplateType, PostImgID, HeliobusTemplateTitle, HeliobusTemplateContent, PrefabPathNormal, PrefabPathSmall, TemplateTendency`

**首条记录摘要**:
```json
{
  "HeliobusTemplateID": 610101,
  "TemplateType": "ImageWithText",
  "PostImgID": 6101,
  "HeliobusTemplateTitle": {
    "Hash": 4652270158693420336
  },
  "HeliobusTemplateContent": {
    "Hash": 17917046928661861185
  },
  "PrefabPathNormal": "UI/Quest/Heliobus/PostTemplate/ScreenImg...",
  "PrefabPathSmall": "",
  "TemplateTendency": "Tendency1"
}
```

### ChallengeBadgeConfig.json (0.01 MB, 23 条)

**字段** (12): `BadgeID, Type, ChallengePeakGroupID, ChallengePeakLevel, Name, Prefab, IconMiddlePath, IconItemPath, IconFigurePath, ComeFromText, ComeFromGoto, Desc`

**首条记录摘要**:
```json
{
  "BadgeID": 295520,
  "Type": "Peak",
  "ChallengePeakGroupID": 4,
  "ChallengePeakLevel": "Bronze",
  "Name": {
    "Hash": 9832126497013102949
  },
  "Prefab": "Stages/OriginalResPos/InteractiveProp/Ch...",
  "IconMiddlePath": "SpriteOutput/ItemIcon/FurnitureIconNoBox...",
  "IconItemPath": "SpriteOutput/ItemIcon/FurnitureIcon/2955...",
  "IconFigurePath": "SpriteOutput/ItemFigures/FurnitureIcon/2...",
  "ComeFromText": {
    "Hash": 15511089575408139317
  },
  "ComeFromGoto": 6281,
  "Desc": {
    "Hash": 1447986700011264002
  }
}
```

### AvatarPlayerIcon.json (0.01 MB, 91 条)

**字段** (6): `ID, ImagePath, AvatarID, Type, SortType, Sort`

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

### MatchThreeOpponent.json (0.01 MB, 46 条)

**字段** (7): `OpponentID, Nickname, ImagePath, IconPath, MapImagePath, Level, AIConfig`

**首条记录摘要**:
```json
{
  "OpponentID": 100,
  "Nickname": {
    "Hash": 5623960860919255901
  },
  "ImagePath": "SpriteOutput/Quest/MatchThree/ShopIcon_G...",
  "IconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "MapImagePath": "SpriteOutput/AvatarIconTeam/999.png",
  "Level": 40,
  "AIConfig": "Config/Gameplays/Match3/EnvConfigs/Env_P..."
}
```

### AlleyOrder.json (0.01 MB, 27 条)

**字段** (8): `OrderID, OrderContent, OrderGoodList, UnlockMission, OrderShip, OrderProfit, OrderTips, OrderTipsTime`

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

### ResourceOverallConfig.json (0.01 MB, 178 条)

**字段** (2): `PageKey, CurrencyIDList`

**首条记录摘要**:
```json
{
  "PageKey": "InventoryPage",
  "CurrencyIDList": [
    2,
    1
  ]
}
```

### RogueMagicArea.json (0.01 MB, 13 条)

**字段** (10): `AreaID, AreaGroupID, DefaultStyle, CustomStageDisplayParams, DifficultyIDList, LayerIDList, FirstReward, AreaNameID, WorldLevel2DisplayMonster, CustomStageDisplayIcon`

**首条记录摘要**:
```json
{
  "AreaID": 101,
  "AreaGroupID": "Guide",
  "DefaultStyle": "Ultimate",
  "CustomStageDisplayParams": [],
  "DifficultyIDList": [
    1
  ],
  "LayerIDList": [
    101
  ],
  "FirstReward": 111300,
  "AreaNameID": {
    "Hash": 3399626268318166388
  },
  "WorldLevel2DisplayMonster": "[{\"DBLDCKODNEN\": 2004011, \"NCKAICABJIK\":...",
  "CustomStageDisplayIcon": ""
}
```

### SwordTrainingSkill.json (0.01 MB, 30 条)

**字段** (14): `SkillID, SkillTypeID, NextSkillIDList, Cost, AvatarStatusAddList, Condition, MazeBuffID, Rare, SkillTag, SkillName, SkillPower, SkillIcon, ParamList, SkillRank`

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

### ChenLingSkill.json (0.01 MB, 74 条)

**字段** (3): `ID, SkillJsonConfig, SkillParamList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "SkillJsonConfig": "Config/Gameplays/ChenLingBattle/Attacks/...",
  "SkillParamList": []
}
```

### SwordTrainingEvent.json (0.01 MB, 40 条)

**字段** (6): `EventID, OptionIDList, EventImage, TalkEventText1, TalkEventText2, TalkEventText3`

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

### ActivityHipplenTrait.json (0.01 MB, 35 条)

**字段** (9): `ID, TraitTitle, TraitUnlockDesc, TraitUnlockDescParam, TraitDesc, TraitDescParam, ImagePath, Effects, Rarity`

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

### EvoBdSCShopConfig.json (0.01 MB, 16 条)

**字段** (14): `ID, Season, MazeBuffID, PriceList, LvMax, TotalBuff, BuffTextFormat, ShopType, Category, ItemIcon, ItemBackground, Name, ShopDesc, ParamList`

**首条记录摘要**:
```json
{
  "ID": 3113805,
  "Season": "SecondChapter",
  "MazeBuffID": 3113805,
  "PriceList": "[{\"KDKPDJNMMCM\": 100, \"MDBPDAJJLMG\": 1},...",
  "LvMax": 5,
  "TotalBuff": {
    "Hash": 7625177546586225778
  },
  "BuffTextFormat": {
    "Hash": 9585488195194225650
  },
  "ShopType": "AddMazeBuff",
  "Category": {
    "Hash": 14171285228507359708
  },
  "ItemIcon": "SpriteOutput/BuffIcon/ActivityFantasticS...",
  "ItemBackground": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "Name": {
    "Hash": 16521246906647600457
  },
  "ShopDesc": {
    "Hash": 2927806752116400776
  },
  "ParamList": [
    {
      "Value": 0.12
    }
  ]
}
```

### MarbleMatchPlayer.json (0.01 MB, 22 条)

**字段** (12): `ID, LowPositiveEmojiList, HighPositiveEmojiList, LowNegativeEmojiList, HighNegativeEmojiList, PlayerActionEmojiList, ImagePath, IconPath, PrefabPath, Name, Desc, SealGroupID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LowPositiveEmojiList": [
    121102,
    121115,
    120015
  ],
  "HighPositiveEmojiList": [
    121102,
    121115,
    120012
  ],
  "LowNegativeEmojiList": [
    121101,
    121104,
    121103
  ],
  "HighNegativeEmojiList": [
    121101,
    121104,
    121103
  ],
  "PlayerActionEmojiList": [
    121104,
    121101,
    121103
  ],
  "ImagePath": "SpriteOutput/AvatarShopIcon/Avatar/1403....",
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1403...",
  "PrefabPath": "UI/UI3D/ActivityMarble/Prefab/MarblePlay...",
  "Name": {
    "Hash": 9223832744779733640
  },
  "Desc": {
    "Hash": 4437553148004700440
  },
  "SealGroupID": 4
}
```

### LimaoNewsOfficeSurvey.json (0.01 MB, 27 条)

**字段** (14): `KHIALKEMEGH, AAPEGNAHMJB, JBJJIOFBBCN, HIHLLBFEONI, OMLFNLJDHKG, IODMEPHIMDB, ANPKNOHCPDK, ADJDGJOFEJF, DCCHGAPFMJI, OGICJALDJHP, OOBCHJJPIAC, MGAANANONJP, ODLDEEANNCM, EEIEODMEMFI`

**首条记录摘要**:
```json
{
  "KHIALKEMEGH": 402001,
  "AAPEGNAHMJB": "Branch",
  "JBJJIOFBBCN": [
    10
  ],
  "HIHLLBFEONI": 1,
  "OMLFNLJDHKG": [
    2400004
  ],
  "IODMEPHIMDB": [
    2400015
  ],
  "ANPKNOHCPDK": [
    2400006
  ],
  "ADJDGJOFEJF": 8015005,
  "DCCHGAPFMJI": [
    2054000
  ],
  "OGICJALDJHP": [],
  "OOBCHJJPIAC": [
    40200101,
    40200102
  ],
  "MGAANANONJP": [],
  "ODLDEEANNCM": "SpriteOutput/UI/LimaoNews/PostPic/post_1...",
  "EEIEODMEMFI": ""
}
```

### RogueMagicMiracleGroup.json (0.01 MB, 47 条)

**字段** (2): `RogueMiracleGroupID, MiracleWeight`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 50002,
  "MiracleWeight": "{\"7302\": 1, \"7304\": 1, \"7305\": 1, \"7306\"..."
}
```

### MonsterSkillTestConfig.json (0.01 MB, 1,881 条)

### GFTraitBESkillConfig.json (0.01 MB, 12 条)

**字段** (17): `SkillID, SkillName, SkillTag, SkillTypeDesc, SkillTriggerKey, SkillIcon, UltraSkillIcon, CutinPath, SkillDesc, SimpleSkillDesc, ShowStanceList, SPMultipleRatio, DelayRatio, ParamList, SimpleParamList, SkillEffect, SkillButtonEffType`

**首条记录摘要**:
```json
{
  "SkillID": 20120101,
  "SkillName": {
    "Hash": 509493294835931323
  },
  "SkillTag": {
    "Hash": 15983939177738998168
  },
  "SkillTypeDesc": {
    "Hash": 765041958489320547
  },
  "SkillTriggerKey": "SkillP01EX",
  "SkillIcon": "SpriteOutput/SkillIcons/Com/SkillIcon_Pr...",
  "UltraSkillIcon": "",
  "CutinPath": "",
  "SkillDesc": {
    "Hash": 14274449035728838828
  },
  "SimpleSkillDesc": {
    "Hash": 12968048256951062608
  },
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": [
    {
      "Value": 1
    }
  ],
  "SimpleParamList": [
    {
      "Value": 1
    }
  ],
  "SkillEffect": "Enhance",
  "SkillButtonEffType": ""
}
```

### PSObjectMissionMap.json (0.01 MB, 194 条)

**字段** (2): `ObjectID, MissionIDList`

**首条记录摘要**:
```json
{
  "ObjectID": 1000101,
  "MissionIDList": [
    1000101
  ]
}
```

### DrinkMakerRequestData.json (0.01 MB, 59 条)

**字段** (5): `RequestID, RequestDesc, Mode, ParamList, BanModeEntrance`

**首条记录摘要**:
```json
{
  "RequestID": 1000,
  "RequestDesc": {
    "Hash": 10880578088852277757
  },
  "Mode": "ByFormula",
  "ParamList": [
    1
  ],
  "BanModeEntrance": "BanTagMode"
}
```

### MonsterGuideTag.json (0.01 MB, 64 条)

**字段** (6): `TagID, TagName, TagBriefDescription, ParameterList, SkillID, EffectID`

**首条记录摘要**:
```json
{
  "TagID": 100101,
  "TagName": {
    "Hash": 7045240788021610782
  },
  "TagBriefDescription": {
    "Hash": 6300875263989191075
  },
  "ParameterList": [
    0.6,
    1.25,
    1
  ],
  "SkillID": 100401410,
  "EffectID": []
}
```

### CakeRaceAvatarTalk.json (0.01 MB, 59 条)

**字段** (5): `AvatarTalkID, AvatarIcon, FemaleAvatarIcon, AvatarName, TalkText`

**首条记录摘要**:
```json
{
  "AvatarTalkID": 1011,
  "AvatarIcon": "SpriteOutput/AvatarRoundIcon/Avatar/8001...",
  "FemaleAvatarIcon": "SpriteOutput/AvatarRoundIcon/Avatar/8002...",
  "AvatarName": {
    "Hash": 2224714490989968486
  },
  "TalkText": {
    "Hash": 15722056641800600
  }
}
```

### ActivityDiceSpecialRule.json (0.01 MB, 31 条)

**字段** (11): `SpecialRuleID, SpecialRuleJson, ModifierID, ParamList, AIEffectWeightList, Name, Desc, GlossaryIDList, IconPath, ShowType, RuleTag`

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

### RestaurantRecipeUpConfig.json (0.01 MB, 85 条)

**字段** (6): `RecipeID, Level, UpgradeMaterials, Price, MaxLevel, CookTime`

**首条记录摘要**:
```json
{
  "RecipeID": 101,
  "Level": 1,
  "UpgradeMaterials": {},
  "Price": 8,
  "MaxLevel": 5,
  "CookTime": 5
}
```

### ClockParkCheckPoint.json (0.01 MB, 17 条)

**字段** (6): `CheckPointID, CheckPointType, CheckParam1, CheckPoint, CheckWinTextList, CheckFailTextList`

**首条记录摘要**:
```json
{
  "CheckPointID": 111,
  "CheckPointType": "AttrGreaterEqual",
  "CheckParam1": 15,
  "CheckPoint": {
    "Hash": 1246869436751600127
  },
  "CheckWinTextList": "[{\"Hash\": 14414119763666348395}, {\"Hash\"...",
  "CheckFailTextList": "[{\"Hash\": 7963475979374232765}, {\"Hash\":..."
}
```

### ActivityParkourAIConfig.json (0.01 MB, 29 条)

**字段** (14): `ID, Name, PrefabPath, ResPath, CalcStepCnt, ActionIntervalTime, SwitchRoadScore, SlowDownRegionScore, SpeedUpRegionScore, SpeedItemScore, SkillItemScore, ObstacleScore, LocalPlayerScore, AIPlayerScore`

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

### OverrideFloorConfig.json (0.01 MB, 122 条)

**字段** (4): `ContentID, FloorID, DimensionID, EnableCondition`

**首条记录摘要**:
```json
{
  "ContentID": 200001,
  "FloorID": 10304001,
  "DimensionID": 1001,
  "EnableCondition": ""
}
```

### ChallengePeakConfig.json (0.01 MB, 32 条)

**字段** (8): `ID, Title, NormalTargetList, DamageType, EventIDList, TagList, ProgressValueList, HPProgressValueList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Title": {
    "Hash": 9016368862888813841
  },
  "NormalTargetList": [
    3001,
    3002,
    3000
  ],
  "DamageType": [
    "Fire",
    "Imaginary"
  ],
  "EventIDList": [
    30501011
  ],
  "TagList": [
    3033001
  ],
  "ProgressValueList": [
    3,
    5,
    0,
    0,
    0
  ],
  "HPProgressValueList": [
    0,
    0,
    20,
    60,
    60
  ]
}
```

### ActivityTelevisionLevel.json (0.01 MB, 10 条)

**字段** (23): `TelevisionID, EventID, MonsterBuffTips, MonsterBuffDesc, MonsterParmList, BuffTips, MonsterBuffShortDesc, BuffDesc, BuffShortDesc, ParmList, TargetTextList, PreTelevisionList, MazeBuffID, BuffShowLevelList, MazeBuffMulList, AvailableBuffList, MonsterList, AllMonsterList, ExtraInfoMonsterIDList, MonsterPic, SpecialAvatarList, UIEnterBattleAreaID, RecommadNature`

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
  "TargetTextList": "[{\"Hash\": 12423621184827415367}, {\"Hash\"...",
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
  "AllMonsterList": "[3002051, 2013010, 1003010, 8003010, 800...",
  "ExtraInfoMonsterIDList": [],
  "MonsterPic": "SpriteOutput/Quest/Television/Television...",
  "SpecialAvatarList": "[3021006, 3021303, 3021003, 3021110, 302...",
  "UIEnterBattleAreaID": 2031102,
  "RecommadNature": [
    "Quantum"
  ]
}
```

### EvolveBuildGearCollection.json (0.01 MB, 42 条)

**字段** (8): `ID, Name, LvMax, ItemIcon, ElementList, TagList, Season, DamageCustomName`

**首条记录摘要**:
```json
{
  "ID": 3106001,
  "Name": {
    "Hash": 10827137465364959427
  },
  "LvMax": 8,
  "ItemIcon": "SpriteOutput/Quest/EvolveBuild/EvoLveBui...",
  "ElementList": [],
  "TagList": [
    3
  ],
  "Season": "EarlyAccess",
  "DamageCustomName": "EvoBuildWeapon_01_Base"
}
```

### TrainPartyMTSkill.json (0.01 MB, 108 条)

**字段** (4): `BOKJJKFCFME, OFLMIGOHDDF, PBLPLDJKPEI, LDCJONHGDAN`

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

### GridFightCamp.json (0.01 MB, 25 条)

**字段** (9): `ID, InitialRandomCode, IfRandomEnabled, IconPath, ShowPicPath, CampName, MonsterList, BattleAreaList, SeasonID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "InitialRandomCode": 1,
  "IfRandomEnabled": 1,
  "IconPath": "SpriteOutput/BuffIcon/Inlevel/IconDeBuff...",
  "ShowPicPath": "SpriteOutput/MonsterMiddleIcon/Monster_1...",
  "CampName": {
    "Hash": 9407187405023584149
  },
  "MonsterList": "[100203025, 100204030, 100205028, 100301...",
  "BattleAreaList": [
    2011101,
    2013201
  ],
  "SeasonID": 1
}
```

### IdleLiveGiftSender.json (0.01 MB, 101 条)

**字段** (3): `ID, HeadIcon, Name`

**首条记录摘要**:
```json
{
  "ID": 2,
  "HeadIcon": "SpriteOutput/MonsterMiddleIcon/Monster_9...",
  "Name": {
    "Hash": 7457796273253218739
  }
}
```

### ScoringConfig.json (0.01 MB, 92 条)

**字段** (5): `ScoringID, AbilityName, DisplayTypeList, ParamList, GameModeGroup`

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

### EquipmentExpType.json (0.01 MB, 240 条)

**字段** (3): `ExpType, Level, Exp`

**首条记录摘要**:
```json
{
  "ExpType": 1,
  "Level": 1,
  "Exp": 40
}
```

### MonopolyAssetConfig.json (0.01 MB, 48 条)

**字段** (8): `AssetID, Level, TaxValue, BonusValue, Price, FigurePath, AssetName, AssetDesc`

**首条记录摘要**:
```json
{
  "AssetID": 1,
  "Level": 1,
  "TaxValue": 2000,
  "BonusValue": 8000,
  "Price": 6000,
  "FigurePath": "SpriteOutput/Quest/Monopoly/EventPic/Ass...",
  "AssetName": {
    "Hash": 7332342431329778168
  },
  "AssetDesc": {
    "Hash": 101145171087441489
  }
}
```

### GiftDanmuSender.json (0.01 MB, 100 条)

**字段** (3): `ID, Name, IconPath`

**首条记录摘要**:
```json
{
  "ID": 2,
  "Name": {
    "Hash": 16381686742476373737
  },
  "IconPath": "SpriteOutput/MonsterMiddleIcon/Monster_9..."
}
```

### MatchThreeSkill.json (0.01 MB, 28 条)

**字段** (7): `SkillID, Desc, DescFigure, SkillJson, BirdSkillTrailEffectPath, SkillChargedImg, SkillUnchangedImg`

**首条记录摘要**:
```json
{
  "SkillID": 400,
  "Desc": {
    "Hash": 2602162258175181220
  },
  "DescFigure": "SpriteOutput/Quest/MatchThree/SkillTutPl...",
  "SkillJson": "Config/Gameplays/Match3/BirdSkills/test_...",
  "BirdSkillTrailEffectPath": "UI/Quest/MatchThree/Effect/Eff_MatchThre...",
  "SkillChargedImg": "SpriteOutput/Quest/MatchThree/FruitSkill...",
  "SkillUnchangedImg": "SpriteOutput/Quest/MatchThree/UnlockFrui..."
}
```

### TrainPartyDynamicConfig.json (0.01 MB, 52 条)

**字段** (5): `ID, IconPath, Taglist, PrefabPath, IsActivity`

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

### ActivityAvatarConfigLD.json (0.01 MB, 6 条)

**字段** (39): `AvatarID, AvatarName, AvatarFullName, AdventurePlayerID, AvatarVOTag, Rarity, JsonPath, DamageType, SPNeed, ExpGroup, MaxPromotion, RankIDList, SkillList, AvatarBaseType, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, AvatarSideIconPath, AvatarMiniIconPath, AvatarGachaResultImgPath, ActionAvatarHeadIconPath, UltraSkillCutInPrefabPath, UIAvatarModelPath, ManikinJsonPath, AIPath, SkilltreePrefabPath, DamageTypeResistance, Release, SideAvatarHeadIconPath, WaitingAvatarHeadIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarTrialOffset, PlayerCardOffset, AssistOffset, AssistBgOffset, AvatarSelfShowOffset`

**首条记录摘要**:
```json
{
  "AvatarID": 6036,
  "AvatarName": {
    "Hash": 16008017046237451018
  },
  "AvatarFullName": {
    "Hash": 3714411688930055020
  },
  "AdventurePlayerID": 1014,
  "AvatarVOTag": "saber",
  "Rarity": "CombatPowerAvatarRarityType5",
  "JsonPath": "Config/ConfigCharacter/Activity/FateRin/...",
  "DamageType": "Wind",
  "SPNeed": {
    "Value": 200
  },
  "ExpGroup": 1,
  "MaxPromotion": 6,
  "RankIDList": [
    6036
  ],
  "SkillList": [
    603603,
    603604
  ],
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
  "AIPath": "Config/ConfigAI/Avatar_ComplexSkilll_Aut...",
  "SkilltreePrefabPath": "UI/Avatar/Widget/WarriorSkillTreeGroup.p...",
  "DamageTypeResistance": [],
  "Release": true,
  "SideAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014.png",
  "WaitingAvatarHeadIconPath": "SpriteOutput/AvatarIconTeam/1014.png",
  "AvatarCutinImgPath": "SpriteOutput/AvatarCutinFigures/1014.png",
  "AvatarCutinBgImgPath": "SpriteOutput/AvatarCutinBg/1014.png",
  "AvatarCutinFrontImgPath": "SpriteOutput/AvatarDrawCard/1014.png",
  "AvatarCutinIntroText": {
    "Hash": 13648649189742784530
  },
  "AvatarDropOffset": "[134, 2, 0.64, 134, 2, 0.64, 134, 2, 0.6...",
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

### RestaurantDailyConfig.json (0.01 MB, 28 条)

**字段** (6): `ProgressID, DayID, RandomEventTypeList, SpecialCustomerMapList, RecommendRecipeList, WaveConfig`

**首条记录摘要**:
```json
{
  "ProgressID": 1,
  "DayID": 1,
  "RandomEventTypeList": [],
  "SpecialCustomerMapList": {},
  "RecommendRecipeList": [
    101
  ],
  "WaveConfig": "P1_Day1"
}
```

### DrinkMakerFormula.json (0.01 MB, 26 条)

**字段** (12): `FormulaID, FormulaName, FormulaDesc, IconPath, SmallIconPath, CupID, IceID, DecoID, IngredientList, MixRate, UnlockType, UnlockParam`

**首条记录摘要**:
```json
{
  "FormulaID": 1,
  "FormulaName": {
    "Hash": 2867967299929258358
  },
  "FormulaDesc": {
    "Hash": 11223043150962649653
  },
  "IconPath": "SpriteOutput/Quest/DrinkMaker/DrinkFigur...",
  "SmallIconPath": "SpriteOutput/Quest/DrinkMaker/ItemIconLi...",
  "CupID": 32,
  "IceID": 2,
  "DecoID": 3,
  "IngredientList": [
    1,
    3,
    5
  ],
  "MixRate": 2,
  "UnlockType": "PlayerLevel",
  "UnlockParam": 1
}
```

### GridFightTraitEffectLayerPa.json (0.01 MB, 74 条)

**字段** (4): `ID, Layer, EffectParamList, DescParamList`

**首条记录摘要**:
```json
{
  "ID": 10021,
  "Layer": 2,
  "EffectParamList": [
    {
      "Value": 1
    }
  ],
  "DescParamList": []
}
```

### AlleyEvent.json (0.01 MB, 24 条)

**字段** (9): `EventID, EventTitle, EventShopContent, StartMissionIDList, EventType, EventPic, EventIcon, EventPriority, UnlockConditions`

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

### StoryLineFloorData.json (0.01 MB, 87 条)

**字段** (4): `FloorID, StoryLineID, ConditionExpression, DimensionID`

**首条记录摘要**:
```json
{
  "FloorID": 20322001,
  "StoryLineID": 1031101,
  "ConditionExpression": "[BetweenSubMission:103110108,103110163]",
  "DimensionID": 2
}
```

### IdleLiveEquip.json (0.01 MB, 96 条)

**字段** (4): `ID, SlotID, IconPath, Name`

**首条记录摘要**:
```json
{
  "ID": 101,
  "SlotID": 1,
  "IconPath": "SpriteOutput/RelicFigures/IconRelic_108_...",
  "Name": "IdleLiveEquip_Name_101"
}
```

### RestaurantBehaviorConfig.json (0.01 MB, 16 条)

**字段** (15): `BehaviorID, BehaviorJSON, CleanTip, AngryLeave, PutDownFoodNormal, PutDownFoodBloodShot, EatingNormal, EatingPerfect, LeavePerfect, CallStop, Help, Complaint, Thank, KeepInLinePerform, Drink`

**首条记录摘要**:
```json
{
  "BehaviorID": 1,
  "BehaviorJSON": "Config/Level/LittleGame/ElfRestaurant/El...",
  "CleanTip": {
    "Hash": 11715560861531011245
  },
  "AngryLeave": {
    "Hash": 2816629056031099983
  },
  "PutDownFoodNormal": {
    "Hash": 3257299678815602662
  },
  "PutDownFoodBloodShot": {
    "Hash": 7813532531029804714
  },
  "EatingNormal": {
    "Hash": 18215434230290351414
  },
  "EatingPerfect": {
    "Hash": 17108477092369006820
  },
  "LeavePerfect": {
    "Hash": 12729187315715887564
  },
  "CallStop": {
    "Hash": 1077598755212005397
  },
  "Help": {
    "Hash": 6930951580587901117
  },
  "Complaint": {
    "Hash": 4279350081005572594
  },
  "Thank": {
    "Hash": 5531606128804689524
  },
  "KeepInLinePerform": {
    "Hash": 11890341442191809727
  },
  "Drink": {
    "Hash": 16547175817981375615
  }
}
```

### PlanetFesCard.json (0.01 MB, 40 条)

**字段** (7): `CardID, Rarity, Name, Description, PicPath, PieceItemList, BuffIDList`

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

### EvolveBuildShopConfig.json (0.01 MB, 14 条)

**字段** (14): `ID, Season, MazeBuffID, PriceList, LvMax, TotalBuff, BuffTextFormat, ShopType, Category, ItemIcon, ItemBackground, Name, ShopDesc, ParamList`

**首条记录摘要**:
```json
{
  "ID": 3106801,
  "Season": "EarlyAccess",
  "MazeBuffID": 3106801,
  "PriceList": "[{\"KDKPDJNMMCM\": 100, \"MDBPDAJJLMG\": 1},...",
  "LvMax": 5,
  "TotalBuff": {
    "Hash": 7625177546586225778
  },
  "BuffTextFormat": {
    "Hash": 9585488195194225650
  },
  "ShopType": "AddMazeBuff",
  "Category": {
    "Hash": 14171285228507359708
  },
  "ItemIcon": "SpriteOutput/BuffIcon/ActivityFantasticS...",
  "ItemBackground": "SpriteOutput/Quest/EvolveBuild/EvolveSki...",
  "Name": {
    "Hash": 986399703890706395
  },
  "ShopDesc": {
    "Hash": 1908624221257331642
  },
  "ParamList": [
    {
      "Value": 0.5
    }
  ]
}
```

### ChallengeBossGroupExtra.json (0.01 MB, 20 条)

**字段** (10): `GroupID, BuffList1, BuffList2, BuffList3, ThemeIconPicPath, ThemePosterTabPicPath, BossPositionPrefabPath1, BossPositionPrefabPath2, BossPositionEntrancePrefabPath3, BossPositionDetailPrefabPath3`

**首条记录摘要**:
```json
{
  "GroupID": 3001,
  "BuffList1": [
    3111008,
    3111010,
    3111011
  ],
  "BuffList2": [
    3111008,
    3111009,
    3111012
  ],
  "BuffList3": [],
  "ThemeIconPicPath": "SpriteOutput/ChallengeBoss/ChallengeBoss...",
  "ThemePosterTabPicPath": "SpriteOutput/Quest/TabIcon/BtnChallengeB...",
  "BossPositionPrefabPath1": "UI/UI3D/ChallengeBoss/Widget/CB_SmallBos...",
  "BossPositionPrefabPath2": "UI/UI3D/ChallengeBoss/Widget/CB_SmallBos...",
  "BossPositionEntrancePrefabPath3": "",
  "BossPositionDetailPrefabPath3": ""
}
```

### ILCombatAdvantageGroup.json (0.01 MB, 80 条)

**字段** (4): `CombatAdvantageGroup, CombatAdvantage, DamageRatio, DamageTakenRatio`

**首条记录摘要**:
```json
{
  "CombatAdvantageGroup": 1,
  "CombatAdvantage": -10000,
  "DamageRatio": {
    "Value": 0.0009999999
  },
  "DamageTakenRatio": {
    "Value": 1000
  }
}
```

### AlleyGoods.json (0.01 MB, 30 条)

**字段** (7): `GoodsID, GoodsConfig, GoodsProfit, GoodsPic, GoodsPicLocked, SettleAudioEvent, RotateAudioEvent`

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

### RogueMagicStory.json (0.01 MB, 39 条)

**字段** (7): `StoryID, StoryCategory, StoryName, IsHide, LevelGraphPath, StoryImage, UnLockDisplay`

**首条记录摘要**:
```json
{
  "StoryID": 53001,
  "StoryCategory": "MagicFaction",
  "StoryName": {
    "Hash": 6008700703766746319
  },
  "IsHide": true,
  "LevelGraphPath": "Config/Level/RogueDialogue/RogueNpcDialo...",
  "StoryImage": "SpriteOutput/Rogue/RandomEvent/Horizon/R...",
  "UnLockDisplay": 801
}
```

### NavMapSubTab.json (0.01 MB, 77 条)

**字段** (4): `FloorID, MenuSortID, UnlockConditionExpression, NavMapTabID`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "MenuSortID": 2,
  "UnlockConditionExpression": "[RealFinishMainMission:1000501]|[RealFin...",
  "NavMapTabID": 10000000
}
```

### RogueTournKeyword.json (0.01 MB, 25 条)

**字段** (8): `KeywordID, MazeBuffID, KeywordIcon, MazeBuffList, RogueFormulaList, KeywordExtraEffect, ExtraEffect, KeywordBuffType`

**首条记录摘要**:
```json
{
  "KeywordID": 1615010,
  "MazeBuffID": 615010,
  "KeywordIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "MazeBuffList": [
    615030,
    615031,
    615040,
    615041,
    615046
  ],
  "RogueFormulaList": "[140102, 130103, 130104, 120107, 1230601...",
  "KeywordExtraEffect": 60000001,
  "ExtraEffect": 61000200,
  "KeywordBuffType": 120
}
```

### PlanetFesAvatarEvent.json (0.01 MB, 40 条)

**字段** (7): `ID, UnlockIDList, EventOptionIDList, AvatarID, IconPath, EventContent, PicPath`

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

### ActionSetting.json (0.01 MB, 59 条)

**字段** (5): `ActionName, GroupType, ShowType, BlackListKeys, SettableInControlTypes`

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

### ChallengeStoryGroupConfig.json (0.01 MB, 25 条)

**字段** (11): `GroupID, GroupName, RewardLineGroupID, PreMissionID, ScheduleDataID, MazeBuffID, BackGroundPath, TabPicPath, TabPicSelectPath, ChallengeGroupType, ThemePicPath`

**首条记录摘要**:
```json
{
  "GroupID": 2001,
  "GroupName": {
    "Hash": 16470015507639752765
  },
  "RewardLineGroupID": 2000,
  "PreMissionID": 4020103,
  "ScheduleDataID": 202001,
  "MazeBuffID": 3031001,
  "BackGroundPath": "",
  "TabPicPath": "SpriteOutput/TabIcon/Abyss/ChallengeThem...",
  "TabPicSelectPath": "SpriteOutput/TabIcon/Abyss/ChallengeThem...",
  "ChallengeGroupType": "Story",
  "ThemePicPath": "SpriteOutput/DailyMission/Banner/Challen..."
}
```

### PhotoExhibitionDetail.json (0.01 MB, 19 条)

**字段** (11): `ID, MissionID, FinishSubMissionID, Name, AuthorName, Unlock, RuikeReply, UnlockPicPath, TaskOption, MalePicPath, FemalePicPath`

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
  "MalePicPath": "[\"SpriteOutput/Quest/PhotoExhibition/Pho...",
  "FemalePicPath": "[\"SpriteOutput/Quest/PhotoExhibition/Pho..."
}
```

### MonsterTestConfig.json (0.01 MB, 1,612 条)

### IdleLiveSpEquipSkill.json (0.01 MB, 36 条)

**字段** (5): `ID, Rarity, SkillDesc, AbilityName, ParamList`

**首条记录摘要**:
```json
{
  "ID": 701,
  "Rarity": 4,
  "SkillDesc": {
    "Hash": 15389038157159599577
  },
  "AbilityName": "RtBattle_Equip_WindArrow",
  "ParamList": "[{\"Value\": 0.04}, {\"Value\": 2}, {\"Value\"..."
}
```

### TarotWikiSubdata.json (0.01 MB, 72 条)

**字段** (4): `ID, Title, Details, ChangeID`

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

### AvatarConfigTrial.json (0.01 MB, 5 条)

**字段** (40): `AvatarID, AvatarName, AvatarFullName, AdventurePlayerID, AvatarVOTag, Rarity, JsonPath, DamageType, SPNeed, ExpGroup, MaxPromotion, MaxRank, RankIDList, SkillList, AvatarBaseType, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, AvatarSideIconPath, AvatarMiniIconPath, AvatarGachaResultImgPath, ActionAvatarHeadIconPath, UltraSkillCutInPrefabPath, UIAvatarModelPath, ManikinJsonPath, AIPath, SkilltreePrefabPath, DamageTypeResistance, Release, SideAvatarHeadIconPath, WaitingAvatarHeadIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarTrialOffset, PlayerCardOffset, AssistOffset, AssistBgOffset, AvatarSelfShowOffset`

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
  "RankIDList": "[720501, 720502, 720503, 720504, 720505,...",
  "SkillList": "[720501, 720502, 720503, 720504, 720506,...",
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
  "AvatarDropOffset": "[0, -91, 0.52, 0, -91, 0.52, 0, -91, 0.5...",
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

### RogueTournCollection.json (0.01 MB, 22 条)

**字段** (9): `CollectionID, UnlockID, IconPath, SlotIconPath, CollectionName, CollectionDesc, CollectionEffectDesc, ParamList, EntityRuntimeReplaceArtPrefabID`

**首条记录摘要**:
```json
{
  "CollectionID": 101,
  "UnlockID": 3001101,
  "IconPath": "SpriteOutput/Rogue/Tourn/Collection/Item...",
  "SlotIconPath": "SpriteOutput/Rogue/Tourn/Collection/Slot...",
  "CollectionName": {
    "Hash": 17037508516896732414
  },
  "CollectionDesc": {
    "Hash": 12320826870147610386
  },
  "CollectionEffectDesc": {
    "Hash": 3620301454646532519
  },
  "ParamList": [
    {
      "Value": 0.02
    }
  ],
  "EntityRuntimeReplaceArtPrefabID": 10000101
}
```

### MatchThreeV2BattleItem.json (0.01 MB, 24 条)

**字段** (14): `BattleItemID, ItemLevel, ItemName, Order, ItemDesc, ItemLevelUpDesc, ItemIcon, ItemUseCount, PropType, InputGridCount, ItemHint, ItemUseFailHint, ItemEffectJson, LevelUpCost`

**首条记录摘要**:
```json
{
  "BattleItemID": 1,
  "ItemLevel": 1,
  "ItemName": {
    "Hash": 6024191801058219116
  },
  "Order": 2,
  "ItemDesc": {
    "Hash": 6409540895462096214
  },
  "ItemLevelUpDesc": {
    "Hash": 2318432692452982356
  },
  "ItemIcon": "SpriteOutput/ItemIcon/140342.png",
  "ItemUseCount": 2,
  "PropType": "BreakPiece",
  "InputGridCount": 1,
  "ItemHint": {
    "Hash": 5840239281155540300
  },
  "ItemUseFailHint": {
    "Hash": 15330992422555304581
  },
  "ItemEffectJson": "",
  "LevelUpCost": 40
}
```

### RestaurantAbilityConfig.json (0.01 MB, 52 条)

**字段** (6): `AbilityID, Type, TargetType, BuffList, DynamicValues, Detail`

**首条记录摘要**:
```json
{
  "AbilityID": 101,
  "Type": "WaiterSpeedUp",
  "TargetType": "OwnerEntity",
  "BuffList": [
    "MoveSpeedRatioAdd"
  ],
  "DynamicValues": [
    0.1
  ],
  "Detail": {
    "Hash": 18093620100730439423
  }
}
```

### RogueDLCArea.json (0.01 MB, 16 条)

**字段** (13): `AreaID, SubType, AreaNameID, AreaGroupID, UnlockID, Difficulty, DifficultyID, LayerIDList, RecommendLevel, RecommendNature, DisplayMonsterMap, FirstReward, AreaScoreMap`

**首条记录摘要**:
```json
{
  "AreaID": 101,
  "SubType": "ChessRogue",
  "AreaNameID": {
    "Hash": 12571336509673901180
  },
  "AreaGroupID": "Guide",
  "UnlockID": 1000020,
  "Difficulty": "Difficulty_1",
  "DifficultyID": [
    1011,
    1012
  ],
  "LayerIDList": [
    1011,
    1012
  ],
  "RecommendLevel": 59,
  "RecommendNature": [
    "Fire",
    "Ice"
  ],
  "DisplayMonsterMap": {
    "8003051": 56
  },
  "FirstReward": 109011,
  "AreaScoreMap": []
}
```

### MarbleSkill.json (0.01 MB, 53 条)

**字段** (7): `ID, GroupID, Level, SkillName, IconPath, SkillDesc, SkillParamList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "GroupID": 100,
  "Level": 1,
  "SkillName": {
    "Hash": 17782883084860980011
  },
  "IconPath": "",
  "SkillDesc": {
    "Hash": 14018875500211028029
  },
  "SkillParamList": [
    2
  ]
}
```

### StrongChallengeStage.json (0.01 MB, 10 条)

**字段** (22): `StrongChallengeStageID, ActivityModuleID, MonsterFigurePath, MonsterGrayFigurePath, MonsterBgFigurePath, Name, QuestList, QuestGroupID, BattleType, CostLimit, AvailableBuffList, BossDetailList, ScoreInterval, ClearScoreLine, RecommendNature, RecommendAvatar, SpecialAvatarIDList, EventID, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID`

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

### FinishTypeConfig.json (0.01 MB, 200 条)

**字段** (0): ``

**首条记录摘要**:
```json
{}
```

### ActivityModuleDemo.json (0.01 MB, 133 条)

**字段** (3): `ActivityModuleID, AvatarDemoStageID, Sort`

**首条记录摘要**:
```json
{
  "ActivityModuleID": 2000101,
  "AvatarDemoStageID": 311020,
  "Sort": 1
}
```

### ChallengeStoryMazeExtra.json (0.01 MB, 100 条)

**字段** (4): `ID, TurnLimit, BattleTargetID, ClearScore`

**首条记录摘要**:
```json
{
  "ID": 20011,
  "TurnLimit": 5,
  "BattleTargetID": [
    2001,
    2002
  ],
  "ClearScore": 30000
}
```

### AvatarRankConfigLD.json (0.01 MB, 24 条)

**字段** (11): `RankID, Rank, Trigger, Name, Desc, ExtraEffectIDList, IconPath, SkillAddLevelList, RankAbility, UnlockCost, Param`

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

### TrainPartyStepConfig.json (0.01 MB, 40 条)

**字段** (9): `ID, GroupID, CoinCost, SortID, StaticPropIDList, HasPreview, HasCutScene, Name, ImgPath`

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

### FateRinCaseBoardInfo.json (0.01 MB, 19 条)

**字段** (9): `BEDFGGKCODK, OENAMINOLLF, OLOIFNNLKJP, IAOIMDKHPCG, HKDMGOBJIMA, CENPLDELHNG, ILEHHBEEDBP, LEPNNKOAOJF, PDBNACBFHGN`

**首条记录摘要**:
```json
{
  "BEDFGGKCODK": "Rin",
  "OENAMINOLLF": {
    "Hash": 5898728298108064653
  },
  "OLOIFNNLKJP": "SpriteOutput/Collaboration/FateRin/FateA...",
  "IAOIMDKHPCG": "SpriteOutput/Collaboration/FateRin/FateE...",
  "HKDMGOBJIMA": {
    "Hash": 372900313432161252
  },
  "CENPLDELHNG": {
    "Hash": 694396234746880687
  },
  "ILEHHBEEDBP": {
    "Hash": 886350345068403478
  },
  "LEPNNKOAOJF": {
    "Hash": 3098760207267033287
  },
  "PDBNACBFHGN": {
    "Hash": 15738906469824349764
  }
}
```

### GuideVideoConfig.json (0.01 MB, 113 条)

**字段** (3): `VideoID, VideoPath, SizeType`

**首条记录摘要**:
```json
{
  "VideoID": 11001,
  "VideoPath": "Activity_Parkour_Guide_Bomb.usm",
  "SizeType": "Small"
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

### AvatarSkin.json (0.01 MB, 6 条)

**字段** (32): `ID, AvatarID, Type, PlayerCardID, AvatarSkinSynopsis, FreeStyleCharacterID, AvatarCutinFrontImgPath, AssistOffset, PlayerPrefabPath, DefaultAvatarModelPath, UIAvatarModelPath, UltraSkillCutInPrefabPath, DefaultAvatarHeadIconPath, AdventureDefaultAvatarHeadIconPath, WaitingAvatarHeadIconPath, ActionAvatarHeadIconPath, SideAvatarHeadIconPath, AvatarSideIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarMiniIconPath, AvatarDropOffset, AvatarSelfShowOffset, ShowType, IntroDataID, ShopRecommendTabBgPath, ShopBgPath, GachaResultImgPath, SkinConfigPath, AdventureCharacterConfigOverrideJsonPath, AudioEventTag, DressIconPath`

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
  "ShopRecommendTabBgPath": "",
  "ShopBgPath": "UI/Shop/AvatarSkinPanel/AvatarSkinShop_1...",
  "GachaResultImgPath": "SpriteOutput/AvatarDrawCardResult/Avatar...",
  "SkinConfigPath": "Config/ConfigSkin/Avatar/AvatarSkin_Mar_...",
  "AdventureCharacterConfigOverrideJsonPath": "",
  "AudioEventTag": "",
  "DressIconPath": ""
}
```

### ActivityDiceCampaignConfig.json (0.01 MB, 11 条)

**字段** (15): `DiceCampaignID, SubMissonID, IMGPath, ProgressIMGPath, MainPageIMGPath, MainPageSilhouettePath, Progress, ProgressTitle, DisplayProgress, Name, EnterProgress, LoseBattle, ExitProgress, ExitMainPage, RuleGroupMapList`

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
  "RuleGroupMapList": "[{\"LJHECKCGJCJ\": 2, \"PDOJDPDCJOH\": 90012..."
}
```

### FuncEntranceList.json (0.01 MB, 21 条)

**字段** (7): `ID, FuncEntranceIDList, BottomFuncEntranceIDList, HudFuncEntranceIDList, LeftHudFuncEntranceIDList, UnlockGotoTypeList, WheelSupport`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FuncEntranceIDList": "[6, 8, 31, 30, 41, 28, 29, 33, 23, 4, 15...",
  "BottomFuncEntranceIDList": [
    9,
    10,
    11,
    32
  ],
  "HudFuncEntranceIDList": "[52001, 52002, 6, 8, 33, 23, 15, 5, 3, 4...",
  "LeftHudFuncEntranceIDList": [
    1,
    3,
    4,
    16
  ],
  "UnlockGotoTypeList": "[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14,...",
  "WheelSupport": true
}
```

### GridFightServantStar.json (0.01 MB, 29 条)

**字段** (14): `ID, Star, ServantID, JsonOverrideConfig, AIPath, SkillOverrideSrc, SkillOverrideDest, ServantShowSkiilIDList, HPBase, HPInherit, HPSkill, SpeedBase, SpeedInherit, SpeedSkill`

**首条记录摘要**:
```json
{
  "ID": 1402,
  "Star": 1,
  "ServantID": 11402,
  "JsonOverrideConfig": "Config/ConfigCharacter/GridFight/3.5/Ava...",
  "AIPath": "Config/ConfigAI/ComplexSkillAIGlobalGrou...",
  "SkillOverrideSrc": [
    1140203
  ],
  "SkillOverrideDest": [
    114020301
  ],
  "ServantShowSkiilIDList": [],
  "HPBase": "#6",
  "HPInherit": "#5",
  "HPSkill": 140204,
  "SpeedBase": "0",
  "SpeedInherit": "#4",
  "SpeedSkill": 140204
}
```

### ActivityExpedition.json (0.01 MB, 24 条)

**字段** (13): `ExpeditionID, ExpeditionRank, Name, AssignerName, AssignDesc, AvatarNumMin, AvatarNumMax, BonusBaseTypeList, Duration, RewardID, Grade1ExtraRewardID, Grade2ExtraRewardID, Grade3ExtraRewardID`

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

### RogueTournMiracleGroup.json (0.01 MB, 286 条)

**字段** (1): `RogueMiracleGroupID`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 40000
}
```

### ExpType.json (0.01 MB, 200 条)

**字段** (3): `TypeID, Level, Exp`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Level": 1,
  "Exp": 200
}
```

### ActivityHipplenInteraction.json (0.01 MB, 85 条)

**字段** (2): `ID, Effects`

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

### ChenLingGameBoyRankingsNPC.json (0.01 MB, 44 条)

**字段** (5): `GameBoyRankingsNPCID, NPCNameID, NPCIconPath, NPCSignature, NPCScore`

**首条记录摘要**:
```json
{
  "GameBoyRankingsNPCID": 1,
  "NPCNameID": {
    "Hash": 13404786005867661949
  },
  "NPCIconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "NPCSignature": {
    "Hash": 2941117082371005839
  },
  "NPCScore": 34420
}
```

### ClockParkChapterConfig.json (0.01 MB, 28 条)

**字段** (9): `ChapterID, ChapterTitle, ChapterAutoUnlock, NextChapterID, ChapterRoundIDList, ChapterGamePlayRoundRandomList, ChapterStoryIDList, CheckPointList, SuccessToRoundID`

**首条记录摘要**:
```json
{
  "ChapterID": 101,
  "ChapterTitle": {
    "Hash": 8160449730899793042
  },
  "ChapterAutoUnlock": 1,
  "NextChapterID": [
    102
  ],
  "ChapterRoundIDList": [
    10101,
    10102,
    10103
  ],
  "ChapterGamePlayRoundRandomList": [],
  "ChapterStoryIDList": [
    10101
  ],
  "CheckPointList": [
    111
  ],
  "SuccessToRoundID": 10107
}
```

### EvoBdSCStageConfig.json (0.01 MB, 7 条)

**字段** (19): `StageMergedID, PreName, Name, IntroID, Season, TeamBonusIconPath, TeamBonusShortDesc, BuffTextFormat, TeamBonusMazeBuffID, StagePeriod1, StagePeriod2, StagePeriod3, StagePeriod4, FirstWinQuest, RankList, InitialWeapon, TrialAvatar, RecommendList, GearRecommendList`

**首条记录摘要**:
```json
{
  "StageMergedID": 424000,
  "PreName": {
    "Hash": 69152460762382822
  },
  "Name": {
    "Hash": 14828109482724934485
  },
  "IntroID": 8340,
  "Season": "SecondChapter",
  "TeamBonusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "TeamBonusShortDesc": {
    "Hash": 5287587947546140338
  },
  "BuffTextFormat": {
    "Hash": 5466090491709284181
  },
  "TeamBonusMazeBuffID": 3113607,
  "StagePeriod1": [
    424001
  ],
  "StagePeriod2": [
    424002
  ],
  "StagePeriod3": [],
  "StagePeriod4": [],
  "FirstWinQuest": [],
  "RankList": "[{\"OENAMINOLLF\": \"C\"}, {\"OENAMINOLLF\": \"...",
  "InitialWeapon": [],
  "TrialAvatar": "[3231406, 1048001, 1048002, 3231306, 323...",
  "RecommendList": [],
  "GearRecommendList": []
}
```

### ChenLingStageWave.json (0.01 MB, 85 条)

**字段** (4): `StageID, Wave, Type, EnemyList`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "Wave": 1,
  "Type": "Normal",
  "EnemyList": [
    1011
  ]
}
```

### TrainPartySkillConfig.json (0.01 MB, 32 条)

**字段** (5): `SKillID, SkillName, SkillDescription, SkillIconPath, SkillFigurePath`

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

### IdleLiveConstCommon.json (0.01 MB, 87 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "IdleLive_EquipLevelOffset",
  "Value": {
    "IntValue": 1
  }
}
```

### BattleEventConfigLD.json (0.01 MB, 21 条)

**字段** (13): `BattleEventID, Team, EventSubType, BattleEventName, HeadIcon, AbilityList, OverrideProperty, Speed, HardLevel, EliteGroup, DescrptionText, ParamList, AssetPackName`

**首条记录摘要**:
```json
{
  "BattleEventID": 100000,
  "Team": "TeamNeutral",
  "EventSubType": "AssistEvent",
  "BattleEventName": "BattleEventName_100000",
  "HeadIcon": "SpriteOutput/BattleEventIcon/HoshinoKami...",
  "AbilityList": [
    "BattleEventAbility_620101_Camera"
  ],
  "OverrideProperty": "[{\"PropertyType\": \"BaseHP\", \"Value\": {\"V...",
  "Speed": {
    "Value": 100
  },
  "HardLevel": true,
  "EliteGroup": true,
  "DescrptionText": "BattleEventDesc_100000",
  "ParamList": [],
  "AssetPackName": "Rogue_Shield"
}
```

### RogueMagicScore.json (0.01 MB, 133 条)

**字段** (3): `LayerNum, RoomNum, WeeklyScore`

**首条记录摘要**:
```json
{
  "LayerNum": 1,
  "RoomNum": 1,
  "WeeklyScore": 450
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

### StroyLineTrialAvatarData.json (0.01 MB, 64 条)

**字段** (4): `StoryLineID, TrialAvatarList, InitTrialAvatarList, CaptainAvatarID`

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

### IdleLiveTeamRecommend.json (0.01 MB, 6 条)

**字段** (5): `ID, Title, Desc, TeamMember, DisplayCondition`

**首条记录摘要**:
```json
{
  "ID": 3,
  "Title": {
    "Hash": 11186568345286525770
  },
  "Desc": {
    "Hash": 4425778821286498051
  },
  "TeamMember": "[{\"ACCJKGEKHKP\": 8001, \"APAKCBFMCAB\": 5}...",
  "DisplayCondition": "4"
}
```

### SwordTrainingPartnerGroup.json (0.01 MB, 80 条)

**字段** (3): `PartnerAbilityGroupID, PartnerAbilityDrop, PartnerAbilityWeight`

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

### IdleLiveQuestionOption.json (0.01 MB, 50 条)

**字段** (6): `ID, SpineAnimGroupId, SpecialChatList, IconPath, GiftDelayTime, GiftIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "SpineAnimGroupId": 101,
  "SpecialChatList": [
    101
  ],
  "IconPath": "SpriteOutput/Quest/IdleLive/IdleLiveIcon...",
  "GiftDelayTime": 1,
  "GiftIDList": [
    90002
  ]
}
```

### RogueHint.json (0.01 MB, 134 条)

**字段** (2): `HintID, HintText`

**首条记录摘要**:
```json
{
  "HintID": 1,
  "HintText": {
    "Hash": 2434173039158367342
  }
}
```

### AvatarEnhancedSkill.json (0.01 MB, 32 条)

**字段** (7): `SkillID, AvatarID, SkillTreeID, SimpleDescBefore, SimpleDescAfter, DescBefore, DescAfter`

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

### PerformanceReplayExclude.json (0.01 MB, 167 条)

**字段** (2): `PerformanceType, PerformanceID`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 102030196
}
```

### FightFestPaperInterview.json (0.01 MB, 30 条)

**字段** (8): `PaperID, TextJoinItemID, SortWeight, IconPath, Name, Info, Comment, Detail`

**首条记录摘要**:
```json
{
  "PaperID": 1,
  "TextJoinItemID": 1071,
  "SortWeight": 1,
  "IconPath": "SpriteOutput/Quest/FightFest/News/HeadIc...",
  "Name": {
    "Hash": 13694010111058844893
  },
  "Info": {
    "Hash": 8750393440615490094
  },
  "Comment": {
    "Hash": 11416366286361312080
  },
  "Detail": {
    "Hash": 3069891676442314369
  }
}
```

### IdleLiveTeamSlotUpgradeCost.json (0.01 MB, 120 条)

**字段** (3): `Level, Cost, LevelAddPower`

**首条记录摘要**:
```json
{
  "Level": 1,
  "Cost": 20,
  "LevelAddPower": {
    "Value": 120
  }
}
```

### RogueBuffHint.json (0.01 MB, 128 条)

**字段** (2): `HintID, HintTextMap`

**首条记录摘要**:
```json
{
  "HintID": 1,
  "HintTextMap": {
    "Hash": 13081548210540464233
  }
}
```

### AvatarRankConfigTrial.json (0.01 MB, 30 条)

**字段** (11): `RankID, Rank, Trigger, Name, Desc, ExtraEffectIDList, IconPath, SkillAddLevelList, RankAbility, UnlockCost, Param`

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

### ChimeraData.json (0.01 MB, 27 条)

**字段** (12): `ChimeraID, Type, ChimeraIcon, Body, Horn, Tail, Eye, DisplayID, RaritySetting, Sort, DataJson, VoiceType`

**首条记录摘要**:
```json
{
  "ChimeraID": 101,
  "Type": "Common",
  "ChimeraIcon": "SpriteOutput/Quest/Chimera/ChimeraHeadIc...",
  "Body": "TigerLava",
  "Horn": "Demon",
  "Tail": "Scorpion",
  "Eye": "Default",
  "DisplayID": 101,
  "RaritySetting": 1,
  "Sort": 101,
  "DataJson": "Config/Gameplays/Chimera/ChimeraConfig_1...",
  "VoiceType": "SwitchGroup_NPC_Chimera_xionghen"
}
```

### MonsterAtlasExtraPhases.json (0.01 MB, 11 条)

**字段** (8): `TemplateGroupID, PhaseID, StanceWeakList, DebuffResist, DamageTypeResistance, CustomValueTags, ManikinPrefabPath, ManikinConfigPath`

**首条记录摘要**:
```json
{
  "TemplateGroupID": 4014010,
  "PhaseID": 1,
  "StanceWeakList": [
    "Ice",
    "Thunder",
    "Quantum"
  ],
  "DebuffResist": "[{\"Key\": \"STAT_CTRL\", \"Value\": {\"Value\":...",
  "DamageTypeResistance": "[{\"DamageType\": \"Physical\", \"Value\": {\"V...",
  "CustomValueTags": [],
  "ManikinPrefabPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M..."
}
```

### PixAirBattleConfig.json (0.01 MB, 57 条)

**字段** (3): `ContentID, EnemyIDList, EnemyShow`

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

### MazeFloorUnlock.json (0.01 MB, 95 条)

**字段** (2): `FloorID, UnlockConditionExpression`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "UnlockConditionExpression": "[RealFinishMainMission:1000501]|[RealFin..."
}
```

### TalkReward.json (0.01 MB, 66 条)

**字段** (7): `ID, PlaneID, FloorID, GroupID, NPCConfigID, RewardID, VerificationID`

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

### NavMapTab.json (0.01 MB, 75 条)

**字段** (6): `ID, WorldID, Name, Desc, SortID, MenuIconID`

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

### CakeRaceEffect.json (0.01 MB, 25 条)

**字段** (9): `EffectID, EffectName, EffectDesc, ParamList, EffectIcon, AbilityJson, AllowSectionIndex, AllowRegionTagList, NotAllowRegionTagList`

**首条记录摘要**:
```json
{
  "EffectID": 1,
  "EffectName": {
    "Hash": 2692605350533894866
  },
  "EffectDesc": {
    "Hash": 26555359236034810
  },
  "ParamList": [],
  "EffectIcon": "SpriteOutput/Quest/CakeRace/BuffIcon/Cak...",
  "AbilityJson": "Config/Gameplays/LittleGame/CakeRace/Abi...",
  "AllowSectionIndex": [],
  "AllowRegionTagList": [],
  "NotAllowRegionTagList": []
}
```

### RogueMagicTalent.json (0.01 MB, 25 条)

**字段** (7): `TalentID, Level, Cost, TalentIcon, NameDisplayID, EffectDesc, DescParams`

**首条记录摘要**:
```json
{
  "TalentID": 1001,
  "Level": 1,
  "Cost": [
    {
      "ItemID": 281026,
      "ItemNum": 25
    }
  ],
  "TalentIcon": "SpriteOutput/Rogue/Talent/1005.png",
  "NameDisplayID": 201,
  "EffectDesc": {
    "Hash": 5260649366817668065
  },
  "DescParams": "[{\"GMPGDEINODK\": \"Number\", \"EJHODPJIFIN\"..."
}
```

### TarotBookCharacterLevel.json (0.01 MB, 91 条)

**字段** (3): `CharacterID, ImagePath, HintID`

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

### ChenLingEnemyMaterialMap.json (0.01 MB, 72 条)

**字段** (3): `StageID, SoldierID, MaterialPath`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "SoldierID": 1,
  "MaterialPath": "Characters/NPC/Special/ChenLing_00/Matie..."
}
```

### ExpeditionReward.json (0.01 MB, 88 条)

**字段** (5): `ExpeditionID, Duration, AvatarNum, RewardID, ExtraRewardID`

**首条记录摘要**:
```json
{
  "ExpeditionID": 1001,
  "Duration": 4,
  "AvatarNum": 2,
  "RewardID": 114111,
  "ExtraRewardID": 115111
}
```

### ActivitySummonSkill.json (0.01 MB, 20 条)

**字段** (8): `SkillID, SkillType, SkillTriggerKey, SkillDesc, SimpleSkillDesc, SkillParmList, SimpleSkillParmList, SkillIconPath`

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
  "SkillParmList": "[{\"Value\": 1}, {\"Value\": 5}, {\"Value\": 5...",
  "SimpleSkillParmList": "[{\"Value\": 1}, {\"Value\": 5}, {\"Value\": 5...",
  "SkillIconPath": "SpriteOutput/SkillIcons/Avatar/8001/Skil..."
}
```

### ActivityDiceV2Talk.json (0.01 MB, 57 条)

**字段** (4): `PHFMCACHFIJ, LLBDOPKHHEB, OOLEAPLDIEA, PEPOHJHNFHF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 111,
  "LLBDOPKHHEB": "Opponent",
  "OOLEAPLDIEA": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "PEPOHJHNFHF": {
    "Hash": 17787639020707603433
  }
}
```

### RaidNPCMonsterOverride.json (0.01 MB, 55 条)

**字段** (5): `RaidID, GroupID, ConfigIDList, NpcMonsterIDList, PlaneEventIDList`

**首条记录摘要**:
```json
{
  "RaidID": 41001,
  "GroupID": 2,
  "ConfigIDList": [
    200001,
    200002
  ],
  "NpcMonsterIDList": [
    1023010,
    8003010
  ],
  "PlaneEventIDList": [
    103201,
    103202
  ]
}
```

### ItemUseData.json (0.01 MB, 74 条)

**字段** (3): `UseDataID, UseParam, UseMultipleMax`

**首条记录摘要**:
```json
{
  "UseDataID": 201,
  "UseParam": [
    1000011
  ],
  "UseMultipleMax": 5
}
```

### RogueMagicScepterDisplay.json (0.01 MB, 24 条)

**字段** (6): `ScepterID, ScepterIconPath, ScepterFigurePath, ScepterName, ScepterBGDesc, ScepterTriggerDesc`

**首条记录摘要**:
```json
{
  "ScepterID": 2001,
  "ScepterIconPath": "SpriteOutput/Rogue/DLC/RogueMagic/Sceptr...",
  "ScepterFigurePath": "SpriteOutput/Rogue/DLC/RogueMagic/Sceptr...",
  "ScepterName": {
    "Hash": 13897411986841096793
  },
  "ScepterBGDesc": {
    "Hash": 8369612225689284424
  },
  "ScepterTriggerDesc": {
    "Hash": 4119325316976010770
  }
}
```

### DamageType.json (0.01 MB, 7 条)

**字段** (25): `ID, DamageTypeName, DamageTypeIntro, DamageTypeIconPath, IconNatureForWeakActive, IconNatureForWeakUnactive, IconNatureColorSimple, IconNatureColor, IconNatureWhite, SPInfoEffFront, SPInfoEffFrontDouble, Color, ShaderColor, UnfullColor, LightColor, Light1Color, SkillBtnEff, SkillTreeLightColor, SkillTreeDecoColor, SkillTreeLeftPanelColor, SPMazeInfoEffFront, NormalDamage, CriticalDamage, SkillTreePanelPath, MazeEnterBattleWeakIconPath`

**首条记录摘要**:
```json
{
  "ID": "Physical",
  "DamageTypeName": {
    "Hash": 16955357985363994060
  },
  "DamageTypeIntro": {
    "Hash": 13748112518925829258
  },
  "DamageTypeIconPath": "SpriteOutput/UI/Nature/IconAttribute/Ico...",
  "IconNatureForWeakActive": "SpriteOutput/UI/Nature/IconNatureForWeak...",
  "IconNatureForWeakUnactive": "SpriteOutput/UI/Nature/IconNatureForWeak...",
  "IconNatureColorSimple": "SpriteOutput/IconDamageType/IconDamageTy...",
  "IconNatureColor": "SpriteOutput/UI/Nature/IconNatureColor/I...",
  "IconNatureWhite": "SpriteOutput/UI/Nature/IconAttribute/Ico...",
  "SPInfoEffFront": "UI/Battle/SPInfo/Eff_Front/SPInfoEff_Fro...",
  "SPInfoEffFrontDouble": "UI/Battle/SPInfo/Eff_Front/SPInfoEff_Fro...",
  "Color": "#FFFFFF",
  "ShaderColor": "#FFFFFF",
  "UnfullColor": "#FFFFFF",
  "LightColor": "#B7B7B796",
  "Light1Color": "#828282D2",
  "SkillBtnEff": "UI/Battle/SkillButton/SkillBtnEff/SkillB...",
  "SkillTreeLightColor": "#ecdcf7",
  "SkillTreeDecoColor": "#cbd9f2",
  "SkillTreeLeftPanelColor": "#3D3B3F",
  "SPMazeInfoEffFront": "UI/VXAsset/ShineEffCom_Physical.prefab",
  "NormalDamage": "#e1e1e1",
  "CriticalDamage": "#bababa",
  "SkillTreePanelPath": "SpriteOutput/UI/Avatar/SkillTree/Attribu...",
  "MazeEnterBattleWeakIconPath": "SpriteOutput/UI/Nature/IconAttributeMidd..."
}
```

### MazePuzzle.json (0.01 MB, 62 条)

**字段** (7): `MazePuzzleID, NormalModeID, IsResetable, ProgressList, IsShowToast, IsShowWaypoint, IsTopPriority`

**首条记录摘要**:
```json
{
  "MazePuzzleID": 1000,
  "NormalModeID": 1000,
  "IsResetable": 1,
  "ProgressList": [
    2,
    3,
    1
  ],
  "IsShowToast": true,
  "IsShowWaypoint": true,
  "IsTopPriority": true
}
```

### TravelBrochureConfig.json (0.01 MB, 18 条)

**字段** (11): `ID, DiaryGroupID, Conditions, Type, DirectoryName, Sort, BackgroundPrefab, FrontPrefab, PicPath, PasterAchievementPic, ShowInDirectory`

**首条记录摘要**:
```json
{
  "ID": 101,
  "DiaryGroupID": 101,
  "Conditions": "[{\"Type\": \"FinishSubMission\", \"Param\": \"...",
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

### BattleArea.json (0.01 MB, 96 条)

**字段** (6): `ID, PlaneID, FloorID, IsLegacy, BattleAreaGroupID, BattleAreaID`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "PlaneID": 10000,
  "FloorID": 10000000,
  "IsLegacy": true,
  "BattleAreaGroupID": 2,
  "BattleAreaID": 1
}
```

### MonopolyContentDisplay.json (0.01 MB, 137 条)

**字段** (3): `CellContentID, CellType, DisplayID`

**首条记录摘要**:
```json
{
  "CellContentID": 5101,
  "CellType": "Event",
  "DisplayID": 4
}
```

### CommonAvatarSkillConfig.json (0.01 MB, 9 条)

**字段** (29): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, SimpleSkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, SPMultipleRatio, BPNeed, BPAdd, DelayRatio, ParamList, SimpleParamList, SkillEffect, HideInUI`

**首条记录摘要**:
```json
{
  "SkillID": 700001,
  "SkillName": {
    "Hash": 3916455871357096748
  },
  "SkillTag": {
    "Hash": 9917237756149299580
  },
  "SkillTypeDesc": {
    "Hash": 12773409472058430613
  },
  "Level": 1,
  "MaxLevel": 1,
  "SkillTriggerKey": "Skill11_Painter_00",
  "SkillIcon": "SpriteOutput/SkillIcons/Monster/SkillIco...",
  "UltraSkillIcon": "",
  "LevelUpCostList": [],
  "SkillDesc": {
    "Hash": 9472853721830190327
  },
  "SimpleSkillDesc": {
    "Hash": 13506161887518875162
  },
  "RatedSkillTreeID": [],
  "RatedRankID": [],
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": [],
  "ShowStanceList": "[{\"Value\": 0}, {\"Value\": 0}, {\"Value\": 0...",
  "ShowDamageList": [],
  "ShowHealList": [],
  "InitCoolDown": -1,
  "CoolDown": -1,
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
  "ParamList": [],
  "SimpleParamList": [],
  "SkillEffect": "Defence",
  "HideInUI": true
}
```

### ActivityGuessSilhouette.json (0.01 MB, 17 条)

**字段** (16): `SilhouetteID, ActivityModuleID, ActivityID, Day, Order, MissionID, FinishSubMissionID, Daily, Tab, Title, Aim01, Aim02, Unlock, SilhouetteIconPath, KeyIconPath, KeyIconPath2`

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

### RoguePersonaTalent.json (0.01 MB, 18 条)

**字段** (11): `PHFMCACHFIJ, DBALOLNOLGL, AAGKEBFHLMC, OICGFNGNLOE, MJOOFPBABEA, NMAHGFAPENI, PBLPLDJKPEI, OLOIFNNLKJP, MOEDOCHOCPJ, OMKFHNLHBBB, HGHFCLHKJNJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 12001,
  "DBALOLNOLGL": 120,
  "AAGKEBFHLMC": 1,
  "OICGFNGNLOE": [
    {
      "ItemID": 281030,
      "ItemNum": 100
    }
  ],
  "MJOOFPBABEA": {
    "Hash": 13309801192421790411
  },
  "NMAHGFAPENI": {
    "Hash": 2619781658438091214
  },
  "PBLPLDJKPEI": [
    {
      "Value": 30
    },
    {
      "Value": 2
    }
  ],
  "OLOIFNNLKJP": "SpriteOutput/BuffIcon/ActivityFantasticS...",
  "MOEDOCHOCPJ": {
    "Hash": 17699056949045957896
  },
  "OMKFHNLHBBB": "Config/Level/RogueDialogue/RogueNpcDialo...",
  "HGHFCLHKJNJ": {
    "Hash": 8736134095247300154
  }
}
```

### ExpeditionData.json (0.01 MB, 22 条)

**字段** (11): `ExpeditionID, Name, AssignerIDList, AssignDesc, GroupID, AvatarNumMin, AvatarNumMax, DisplayItemList, UnlockMission, BonusDamageTypeList, BonusBaseTypeList`

**首条记录摘要**:
```json
{
  "ExpeditionID": 1001,
  "Name": {
    "Hash": 17255729330588065669
  },
  "AssignerIDList": [
    1001
  ],
  "AssignDesc": {
    "Hash": 3672348568158143192
  },
  "GroupID": 1,
  "AvatarNumMin": 2,
  "AvatarNumMax": 2,
  "DisplayItemList": [
    {
      "ItemID": 111001
    }
  ],
  "UnlockMission": 1010403,
  "BonusDamageTypeList": [
    "Wind"
  ],
  "BonusBaseTypeList": [
    "Mage"
  ]
}
```

### GridFightRoleConfig_Index_SeasonAndTrait.json (0.01 MB, 32 条)

**字段** (3): `PNPJBPCMINL, PIKLFGGHKGD, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "PIKLFGGHKGD": 1001,
  "MGNHKOHFLPO": "[{\"PHFMCACHFIJ\": 1001}, {\"PHFMCACHFIJ\": ..."
}
```

### PlanetFesConstValueCommon.json (0.01 MB, 58 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Planet_Fes_Initial_Item_Map",
  "Value": "{\"MapValue\": {\"IntValue\": {\"IntValue\": 1..."
}
```

### ChimeraDuelEffect.json (0.01 MB, 108 条)

**字段** (4): `EffectID, EffectType, ParamInt, Attack`

**首条记录摘要**:
```json
{
  "EffectID": 8001,
  "EffectType": "FoodAddStats",
  "ParamInt": 1,
  "Attack": 2
}
```

### DrinkMakerChat.json (0.01 MB, 103 条)

**字段** (5): `ChatID, PerformanceID, RequestID, SuccessNextChatID, FailNextChatID`

**首条记录摘要**:
```json
{
  "ChatID": 1101,
  "PerformanceID": 802129901,
  "RequestID": 1101,
  "SuccessNextChatID": 1111,
  "FailNextChatID": 1112
}
```

### ActivityTelevisionStage.json (0.01 MB, 10 条)

**字段** (18): `TelevisionID, Season, ActivityModuleID, QuestGroupID, OriginalStageName, StageName, OriginalDesc, Desc, ChannelName, GotoID, MappingInfo, EntranceID, MissionID, OriginalImagePath, OriginalOutlineImagePath, ImagePath, OriginalMiniImagePath, MiniImagePath`

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

### GridFightSeasonExpScore.json (0.01 MB, 80 条)

**字段** (6): `DivisionID, ScoreRuleID, ChapterID, SectionID, WeeklyScore, Exp`

**首条记录摘要**:
```json
{
  "DivisionID": 1,
  "ScoreRuleID": 1,
  "ChapterID": 1,
  "SectionID": 1,
  "WeeklyScore": 1200,
  "Exp": 25
}
```

### RogueMagicMiracle.json (0.01 MB, 81 条)

**字段** (4): `MiracleID, MiracleDisplayID, MiracleEffectDisplayID, UnlockHandbookMiracleID`

**首条记录摘要**:
```json
{
  "MiracleID": 7101,
  "MiracleDisplayID": 4,
  "MiracleEffectDisplayID": 601,
  "UnlockHandbookMiracleID": 4
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

### EndmostChronicle.json (0.01 MB, 32 条)

**字段** (8): `PHFMCACHFIJ, GFOGDOBBJAF, LGPDIDLJFOI, FBKAMIHGLFK, LDIHBHDHOMF, KEMBKKLCPBD, PCFNMMOAGLA, OFABOLACEEN`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1033802,
  "GFOGDOBBJAF": {
    "Hash": 6983349159444388851
  },
  "LGPDIDLJFOI": {
    "Hash": 12673075775220023688
  },
  "FBKAMIHGLFK": "SpriteOutput/Chronicle/1033802.png",
  "LDIHBHDHOMF": "",
  "KEMBKKLCPBD": 1033802,
  "PCFNMMOAGLA": [
    1033803
  ],
  "OFABOLACEEN": []
}
```

### TeamTowersStage.json (0.01 MB, 21 条)

**字段** (9): `PHFMCACHFIJ, GMPGDEINODK, BFDOFFNMCPO, EBDLFNOELLO, IOCHHAPIOJA, AJJOOHJFNMC, PEOFHNELHLJ, PPNLEBDNKNI, JDKLJBMHHKO`

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

### AlleySpecialOrder.json (0.01 MB, 9 条)

**字段** (11): `SpecialOrderID, SpecialOrderShip, SpecialOrderGoods, SpecialOrderReward, SpecialOrderContent, OrderTips, OrderTipsTime, OrderPic, SubTitleID, SpecialOrderShopID, UnlockMission`

**首条记录摘要**:
```json
{
  "SpecialOrderID": 101,
  "SpecialOrderShip": 1,
  "SpecialOrderGoods": "[{\"GoodsID\": 101, \"GoodsCnt\": 4}, {\"Good...",
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

### FightFestStageInfo.json (0.01 MB, 20 条)

**字段** (10): `EventID, EnvironmentBuffID, ChallengeName, HighLightDesc, PreviewMonsterList, RecommadNature, SpecialAvatarList, RecommadCoachID, UIEnterBattleAreaID, TutorialID`

**首条记录摘要**:
```json
{
  "EventID": 419000,
  "EnvironmentBuffID": 3120011,
  "ChallengeName": {
    "Hash": 3615152687972935366
  },
  "HighLightDesc": {
    "Hash": 8033752862372714977
  },
  "PreviewMonsterList": "[201302010, 800304014, 200203105, 200201...",
  "RecommadNature": [
    "Thunder",
    "Physical"
  ],
  "SpecialAvatarList": [
    3101111,
    3101106,
    3101103,
    3101105
  ],
  "RecommadCoachID": [
    250700,
    250701
  ],
  "UIEnterBattleAreaID": 2024202,
  "TutorialID": 8182
}
```

### MatchThreeLevel.json (0.01 MB, 24 条)

**字段** (11): `LevelID, EnvironmentID, PlayerID, OpponentID, TurnStep, HPmax, OpponentBirdID, PlayerBirdID, VictoryDesc, LevelImage, VSTalkList`

**首条记录摘要**:
```json
{
  "LevelID": 1000,
  "EnvironmentID": [],
  "PlayerID": 900,
  "OpponentID": 100,
  "TurnStep": 5,
  "HPmax": 10,
  "OpponentBirdID": 310,
  "PlayerBirdID": 311,
  "VictoryDesc": {
    "Hash": 17204578040470795989
  },
  "LevelImage": "",
  "VSTalkList": []
}
```

### AvatarConfigLD.json (0.01 MB, 4 条)

**字段** (40): `AvatarID, AvatarName, AvatarFullName, AdventurePlayerID, AvatarVOTag, Rarity, JsonPath, DamageType, SPNeed, ExpGroup, MaxPromotion, MaxRank, RankIDList, SkillList, AvatarBaseType, DefaultAvatarModelPath, DefaultAvatarHeadIconPath, AvatarSideIconPath, AvatarMiniIconPath, AvatarGachaResultImgPath, ActionAvatarHeadIconPath, UltraSkillCutInPrefabPath, UIAvatarModelPath, ManikinJsonPath, AIPath, SkilltreePrefabPath, DamageTypeResistance, Release, SideAvatarHeadIconPath, WaitingAvatarHeadIconPath, AvatarCutinImgPath, AvatarCutinBgImgPath, AvatarCutinFrontImgPath, AvatarCutinIntroText, AvatarDropOffset, AvatarTrialOffset, PlayerCardOffset, AssistOffset, AssistBgOffset, AvatarSelfShowOffset`

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
  "RankIDList": "[101401, 101402, 101403, 101404, 101405,...",
  "SkillList": "[101401, 101402, 101403, 101404, 101406,...",
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
  "AvatarDropOffset": "[134, 2, 0.64, 134, 2, 0.64, 134, 2, 0.6...",
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

### ChimeraDuelChimeraGroup.json (0.01 MB, 57 条)

**字段** (2): `ChimeraGroupID, ChimeraIDList`

**首条记录摘要**:
```json
{
  "ChimeraGroupID": 40000,
  "ChimeraIDList": "[101, 102, 103, 104, 105, 106, 107, 108,..."
}
```

### SpaceZooFeatureConfig.json (0.01 MB, 33 条)

**字段** (5): `FeatureID, Channel, ImagePath, LargeImagePath, FeatureKey`

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

### AlleySpecialOrderFinish.json (0.01 MB, 54 条)

**字段** (4): `SpecialOrderFinishID, SpecialOrderFinishType, Param1, SpecialOrderFinishDesc`

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

### CakeRaceTriggerEvent.json (0.01 MB, 57 条)

**字段** (3): `EventID, ConditionIDList, TriggerPerformanceIDList`

**首条记录摘要**:
```json
{
  "EventID": 101,
  "ConditionIDList": [
    1011
  ],
  "TriggerPerformanceIDList": [
    1011
  ]
}
```

### RogueTournCurseChest.json (0.01 MB, 29 条)

**字段** (10): `ChestID, Type, MainTitleDisplayID, MainDescDisplayID, SubTitleDisplayID, SubDescDisplayID, IconPath, ParamValue1, ParamValue3, ParamValue4`

**首条记录摘要**:
```json
{
  "ChestID": 1001,
  "Type": "Treasure",
  "MainTitleDisplayID": 1101,
  "MainDescDisplayID": 1201,
  "SubTitleDisplayID": 1002,
  "SubDescDisplayID": 1003,
  "IconPath": "SpriteOutput/UI/Rogue/Tourn/Tourn1/Rogue...",
  "ParamValue1": {
    "Value": 1
  },
  "ParamValue3": {
    "Value": 1
  },
  "ParamValue4": {
    "Value": 3
  }
}
```

### ChallengeBossGroupConfig.json (0.01 MB, 20 条)

**字段** (11): `GroupID, GroupName, RewardLineGroupID, PreMissionID, ScheduleDataID, MazeBuffID, BackGroundPath, TabPicPath, TabPicSelectPath, ChallengeGroupType, ThemePicPath`

**首条记录摘要**:
```json
{
  "GroupID": 3001,
  "GroupName": {
    "Hash": 4153661169282237429
  },
  "RewardLineGroupID": 3000,
  "PreMissionID": 4020103,
  "ScheduleDataID": 203001,
  "MazeBuffID": 3031001,
  "BackGroundPath": "",
  "TabPicPath": "SpriteOutput/TabIcon/Abyss/ChallengeBoss...",
  "TabPicSelectPath": "SpriteOutput/TabIcon/Abyss/ChallengeBoss...",
  "ChallengeGroupType": "Boss",
  "ThemePicPath": "SpriteOutput/DailyMission/Banner/Challen..."
}
```

### GridFightStage.json (0.01 MB, 15 条)

**字段** (16): `StageID, StageRuleID, MinionProgressValue, EliteProgressValue, BossProgressValue, ThresholdPosition, ThresholdFailGlobalHPLose, ThresholdPassBasicGlobalHPLose, MinionGlobalHPLose, EliteGlobalHPLose, BossGlobalHPLose, TotalTurn, AvatarReviveDelayLose, VictoryBonusList, ThresholdBonusList, CardStolenList`

**首条记录摘要**:
```json
{
  "StageID": 3260,
  "StageRuleID": 1,
  "MinionProgressValue": 1,
  "EliteProgressValue": 3,
  "BossProgressValue": 15,
  "ThresholdPosition": {
    "Value": 0.4
  },
  "ThresholdFailGlobalHPLose": 15,
  "ThresholdPassBasicGlobalHPLose": 5,
  "MinionGlobalHPLose": 1,
  "EliteGlobalHPLose": 3,
  "BossGlobalHPLose": 15,
  "TotalTurn": {
    "Value": 2
  },
  "AvatarReviveDelayLose": {
    "Value": 0.5
  },
  "VictoryBonusList": [
    1000110,
    2000101,
    3000103,
    3000100
  ],
  "ThresholdBonusList": [
    1000112,
    3000100,
    3000103
  ],
  "CardStolenList": [
    15,
    10,
    0,
    0,
    0
  ]
}
```

### RogueDLCUnlock.json (0.01 MB, 110 条)

**字段** (3): `RogueUnlockID, UnlockFinishWay, RogueUnlockDetail`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 1000001,
  "UnlockFinishWay": 1000001,
  "RogueUnlockDetail": {
    "Hash": 10705884503992387686
  }
}
```

### PlanetFesSkillTree.json (0.01 MB, 22 条)

**字段** (9): `SkillID, Phase, NextSkillIDList, Name, Icon, MaxLevel, LevelSkillList, LevelCostList, UnlockIDList`

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

### InfiniteEliteGroup.json (0.01 MB, 40 条)

**字段** (6): `EliteGroup, AttackRatio, DefenceRatio, HPRatio, SpeedRatio, StanceRatio`

**首条记录摘要**:
```json
{
  "EliteGroup": 42600101,
  "AttackRatio": {
    "Value": 1
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  },
  "SpeedRatio": {
    "Value": 1
  },
  "StanceRatio": {
    "Value": 1
  }
}
```

### GachaGroupData.json (0.01 MB, 30 条)

**字段** (5): `GroupID, GachaIDList, GroupType, PoolLabelIcon, PoolLabelIconSelected`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "GachaIDList": [
    2042,
    2043,
    2044
  ],
  "GroupType": "MultiAvatarUp",
  "PoolLabelIcon": "SpriteOutput/DrawCardPic/GachaTabIconLim...",
  "PoolLabelIconSelected": "SpriteOutput/DrawCardPic/GachaTabIconLim..."
}
```

### TrainPartyStaticConfig.json (0.01 MB, 62 条)

**字段** (6): `ID, AreaID, SlotList, IconPath, Type, UseLowLight`

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

### ChenLingEffect.json (0.01 MB, 80 条)

**字段** (6): `ID, EffectType, Param1, Param3, Param4, ParamList`

**首条记录摘要**:
```json
{
  "ID": 105,
  "EffectType": "AddSoldierAttrWhenAddCoin",
  "Param1": 4,
  "Param3": 3,
  "Param4": 10,
  "ParamList": []
}
```

### IdleLiveTask.json (0.01 MB, 78 条)

**字段** (4): `ID, FinishwayID, RewardID, Desc`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FinishwayID": 8060173,
  "RewardID": 8017201,
  "Desc": {
    "Hash": 15658815716696453040
  }
}
```

### TarotBookInteraction.json (0.01 MB, 24 条)

**字段** (6): `ID, Priority, Title, StartConditionList, FinishConditionList, JsonPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Priority": 1,
  "Title": {
    "Hash": 808850406999250189
  },
  "StartConditionList": "[{\"Type\": \"TakeSubmission\", \"Param\": \"10...",
  "FinishConditionList": [],
  "JsonPath": "Config/Level/TarotBook/TarotBookInteract..."
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

### FateRinHouguMapFight.json (0.01 MB, 15 条)

**字段** (16): `PHFMCACHFIJ, OBJEJHKENKF, HGNACOAJMIJ, JAJPGCBAIJA, NHAINGEIMJA, KAHNDIPJGHI, HPJHKACDIMB, HNEIIAGADGO, PKLFLANJCDG, JKCHLJNLLNA, BNGEMNHEMAK, JFDHFPIIGCC, EHAFJKIKKMC, NCHLCBICBGO, BMOKJDHHJBH, MMEGCIGMALC`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OBJEJHKENKF": {
    "Hash": 16410271405847647180
  },
  "HGNACOAJMIJ": {
    "Hash": 12712251878649505731
  },
  "JAJPGCBAIJA": {
    "Hash": 15084259479017972334
  },
  "NHAINGEIMJA": 429006,
  "KAHNDIPJGHI": 429016,
  "HPJHKACDIMB": 429026,
  "HNEIIAGADGO": 2050301,
  "PKLFLANJCDG": true,
  "JKCHLJNLLNA": "",
  "BNGEMNHEMAK": [
    105440701,
    105440706
  ],
  "JFDHFPIIGCC": 5013030,
  "EHAFJKIKKMC": "Enemy",
  "NCHLCBICBGO": {
    "Hash": 7876842958917133059
  },
  "BMOKJDHHJBH": {
    "Hash": 17690008315646127871
  },
  "MMEGCIGMALC": 2050365
}
```

### CakeCatchConstValueCommon.json (0.01 MB, 77 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "CatCatch_UnlockMissionID",
  "Value": {
    "IntValue": 4020800
  }
}
```

### FuncUnlockHint.json (0.01 MB, 52 条)

**字段** (5): `UnlockID, Type, Title, Desc, IconPath`

**首条记录摘要**:
```json
{
  "UnlockID": 200,
  "Type": "Entrance",
  "Title": {
    "Hash": 6024850270121446748
  },
  "Desc": {
    "Hash": 8723184909037099482
  },
  "IconPath": "SpriteOutput/PhoneAPPIcon/MapIcon.png"
}
```

### EquipmentAtlas.json (0.01 MB, 165 条)

**字段** (2): `EquipmentID, DefaultUnlock`

**首条记录摘要**:
```json
{
  "EquipmentID": 20000,
  "DefaultUnlock": true
}
```

### QuestTimeLimitConfig.json (0.01 MB, 55 条)

**字段** (5): `QuestID, UnlockData, FigurePath, WorldID, GuideImgPath`

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

### RogueDLCChessBoardAnimation.json (0.01 MB, 76 条)

**字段** (3): `ModifierType, RogueSubMode, AnimationType`

**首条记录摘要**:
```json
{
  "ModifierType": "TriggerAreaShuffle",
  "RogueSubMode": "ChessRogue",
  "AnimationType": "Portal"
}
```

### ActivityDiceV2TacticsCard.json (0.01 MB, 24 条)

**字段** (10): `PHFMCACHFIJ, MJPKBIGCFOM, OENAMINOLLF, NMAHGFAPENI, PGAMJHMNLLN, GMPGDEINODK, PMIEAEGJNMJ, DODGNGAGMMG, CCMBLCMCIPD, PBLPLDJKPEI`

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

### MaterialSubmitterReply.json (0.01 MB, 42 条)

**字段** (5): `ID, Tag, Content, PersonName, HeadIconPath`

**首条记录摘要**:
```json
{
  "ID": 201001,
  "Tag": 1,
  "Content": {
    "Hash": 8451588217215470146
  },
  "PersonName": {
    "Hash": 8362720009627729616
  },
  "HeadIconPath": "SpriteOutput/Quest/Heliobus/HeliobusUser..."
}
```

### HeliobusChallengeStage.json (0.01 MB, 16 条)

**字段** (15): `ChallengeID, EventID, ChallengeName, ChallengeDesc, HeliobusChallengeHard, UnlockPhase, RewardID, BattleTargetList, HeliobusMazeBuff, MonsterList, HeliobusSkillRecList, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID`

**首条记录摘要**:
```json
{
  "ChallengeID": 1001,
  "EventID": 309202,
  "ChallengeName": {
    "Hash": 12782768665796587578
  },
  "ChallengeDesc": {
    "Hash": 12068415878708960938
  },
  "HeliobusChallengeHard": 1,
  "UnlockPhase": 1,
  "RewardID": 8005004,
  "BattleTargetList": [
    50006012,
    5000602,
    50006071
  ],
  "HeliobusMazeBuff": 3103002,
  "MonsterList": [
    200201003,
    200203001
  ],
  "HeliobusSkillRecList": [
    10001
  ],
  "PlaneID": 20223,
  "FloorID": 20223001,
  "BattleAreaGroupID": 1,
  "BattleAreaID": 1
}
```

### EvoBdSCConstValueCommon.json (0.01 MB, 76 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "EvolveBuildSC_Weight1",
  "Value": {
    "IntValue": 18
  }
}
```

### FightFestPhase.json (0.01 MB, 13 条)

**字段** (13): `PhaseID, PhaseType, SortWeight, UnlockSubMissionID, BoardTitle, PhaseTitle, TargetTips, IconPath1, MiniIconPath1, IconPath2, PhaseTutorialParams, Board3DTexture, LukaAnimTrigger`

**首条记录摘要**:
```json
{
  "PhaseID": 201,
  "PhaseType": "ScoreRace",
  "SortWeight": 1,
  "UnlockSubMissionID": 802510113,
  "BoardTitle": {
    "Hash": 16908382949285764970
  },
  "PhaseTitle": {
    "Hash": 13348880785949899372
  },
  "TargetTips": {
    "Hash": 6931262794071806768
  },
  "IconPath1": "SpriteOutput/Quest/FightFest/Avatar/Chal...",
  "MiniIconPath1": "SpriteOutput/Quest/FightFest/Avatar/Head...",
  "IconPath2": "",
  "PhaseTutorialParams": [
    802511102
  ],
  "Board3DTexture": "UI/UI3D/FightFest/_dependencies/Texture/...",
  "LukaAnimTrigger": "StandBy"
}
```

### RoguePersonaStyle.json (0.01 MB, 10 条)

**字段** (12): `KLOEJIMMPJM, BCGJNNDCIFH, DOKOMKFGOOC, MJOOFPBABEA, DDGDJCKKHPH, NMAHGFAPENI, PJNNPOKJEFD, FBOICELIKNJ, PBLPLDJKPEI, JEHDKAKMCGC, GIFCDPFAKKP, PILOLAAEAHB`

**首条记录摘要**:
```json
{
  "KLOEJIMMPJM": 101,
  "BCGJNNDCIFH": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "DOKOMKFGOOC": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "MJOOFPBABEA": {
    "Hash": 13548995702470921752
  },
  "DDGDJCKKHPH": {
    "Hash": 13668289307753628803
  },
  "NMAHGFAPENI": {
    "Hash": 3229452050505925461
  },
  "PJNNPOKJEFD": {
    "Hash": 6434289307571048648
  },
  "FBOICELIKNJ": {
    "Hash": 589803160953193191
  },
  "PBLPLDJKPEI": "[{\"Value\": 45}, {\"Value\": 3}, {\"Value\": ...",
  "JEHDKAKMCGC": "[1005, 1005, 1006, 1007, 1007, 1008, 100...",
  "GIFCDPFAKKP": true,
  "PILOLAAEAHB": 1
}
```

### RogueTournExpScore.json (0.01 MB, 119 条)

**字段** (4): `ID, ScoreExpID, WeeklyScore, Exp`

**首条记录摘要**:
```json
{
  "ID": 11001,
  "ScoreExpID": 1,
  "WeeklyScore": 300,
  "Exp": 50
}
```

### MonopolyConstValue.json (0.01 MB, 67 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Monopoly_Activity_Game_MaxRaiseValue",
  "Value": {
    "IntValue": 4
  }
}
```

### GridFightEnhance.json (0.01 MB, 25 条)

**字段** (8): `ID, GroupID, Cost, EffectParamList, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 30021,
  "Cost": 5,
  "EffectParamList": [
    {
      "Value": 0.1
    }
  ],
  "EnhanceDesc": {
    "Hash": 9177983544050011641
  },
  "EnhanceName": {
    "Hash": 16893851613310700444
  },
  "EnhanceSimpleDesc": {
    "Hash": 11151812731105197968
  },
  "IconPath": "SpriteOutput/GridFight/TraitTargetEffect..."
}
```

### ActivityRaidCollection.json (0.01 MB, 66 条)

**字段** (5): `RaidCollectionID, RaidID, PrepareType, SubMissionID, GuideID`

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

### MonsterGuideSkill.json (0.01 MB, 54 条)

**字段** (5): `SkillID, Difficulty, Type, SkillName, SkillTextIDList`

**首条记录摘要**:
```json
{
  "SkillID": 100111,
  "Difficulty": 1,
  "Type": "Normal",
  "SkillName": {
    "Hash": 17315960548241071615
  },
  "SkillTextIDList": [
    1001111
  ]
}
```

### ActivitySummonGroup.json (0.01 MB, 5 条)

**字段** (25): `GroupID, ActivityModuleID, MonsterName, MonsterDesc, AvatarSkillList, MonsterSkillList, MonsterEventID, MonsterSkillDescList, OriginalStageName, StageName, OriginalDesc, Desc, GotoID, MappingInfo, EntranceID, SubMissionID, BackgroundTrashImageList, MonsterMiddleIcon, MasterImagePath, MonsterImagePath, OriginalImagePath, ImagePath, OriginalMiniImagePath, MiniImagePath, MazeBuffID`

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
  "MonsterSkillDescList": "[{\"Hash\": 15225379244613558208}, {\"Hash\"...",
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
  "BackgroundTrashImageList": "[\"SpriteOutput/UI/Quest/TrashCanSummon/S...",
  "MonsterMiddleIcon": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MasterImagePath": "[\"SpriteOutput/AvatarShopIcon/Avatar/800...",
  "MonsterImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Pos...",
  "OriginalImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "ImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "OriginalMiniImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MiniImagePath": "SpriteOutput/UI/Quest/TrashCanSummon/Sum...",
  "MazeBuffID": 3200029
}
```

### MultiplePathAvatarAtlas.json (0.01 MB, 12 条)

**字段** (3): `AvatarID, VoiceIDList, StoryIDList`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "VoiceIDList": "[1, 2, 3, 4, 6, 10, 11, 14, 15, 16, 17, ...",
  "StoryIDList": [
    11,
    12,
    13,
    14,
    15,
    16
  ]
}
```

### ChenLingPolicy.json (0.01 MB, 28 条)

**字段** (9): `ID, EffectID, Weight, Name, IconPath, Desc, RelatedCardList, SkillSoldierList, IconType`

**首条记录摘要**:
```json
{
  "ID": 5,
  "EffectID": 505,
  "Weight": 100,
  "Name": {
    "Hash": 1808420830123843039
  },
  "IconPath": "SpriteOutput/Quest/ActivityChenLing/Buil...",
  "Desc": {
    "Hash": 5673863225645885048
  },
  "RelatedCardList": [
    209
  ],
  "SkillSoldierList": [],
  "IconType": "Building"
}
```

### TarotBookStory.json (0.01 MB, 65 条)

**字段** (4): `ID, CharacterID, CardID, ClueList`

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

### RelicSubAffixConfig.json (0.01 MB, 48 条)

**字段** (6): `GroupID, AffixID, Property, BaseValue, StepValue, StepNum`

**首条记录摘要**:
```json
{
  "GroupID": 2,
  "AffixID": 1,
  "Property": "HPDelta",
  "BaseValue": {
    "Value": 13.548016
  },
  "StepValue": {
    "Value": 1.693502
  },
  "StepNum": 2
}
```

### AvatarDemoGuideGroup.json (0.01 MB, 95 条)

**字段** (3): `AvatarID, StageID, IndexList`

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

### ActivityAvatarPromotionLD.json (0.01 MB, 42 条)

**字段** (6): `AvatarID, PromotionCostList, MaxLevel, AttackBase, HPBase, BaseAggro`

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

### ChimeraDuelTriggerEvent.json (0.01 MB, 57 条)

**字段** (4): `EventID, EventJsonPath, Priority, ParamList`

**首条记录摘要**:
```json
{
  "EventID": 4001,
  "EventJsonPath": "Config/Gameplays/ChimeraDuel/Event/Globa...",
  "Priority": 1,
  "ParamList": []
}
```

### Function.json (0.01 MB, 77 条)

**字段** (5): `ID, GotoID, UnlockID, OverrideGotoID, OverrideUnlockID`

**首条记录摘要**:
```json
{
  "ID": 2,
  "GotoID": 200,
  "UnlockID": 200,
  "OverrideGotoID": "[{\"BFLIFKBEOPJ\": 17, \"MNDFOPKBHKP\": 5800...",
  "OverrideUnlockID": []
}
```

### EvolveBuildStageConfig.json (0.01 MB, 6 条)

**字段** (19): `StageMergedID, Name, IntroID, Season, TeamBonusIconPath, TeamBonusShortDesc, BuffTextFormat, TeamBonusMazeBuffID, Difficulty, StagePeriod1, StagePeriod2, StagePeriod3, StagePeriod4, FirstWinQuest, RankList, InitialWeapon, TrialAvatar, RecommendList, GearRecommendList`

**首条记录摘要**:
```json
{
  "StageMergedID": 414001,
  "Name": {
    "Hash": 9257932061750773546
  },
  "IntroID": 8141,
  "Season": "EarlyAccess",
  "TeamBonusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "TeamBonusShortDesc": {
    "Hash": 14336167067068109421
  },
  "BuffTextFormat": {
    "Hash": 5466090491709284181
  },
  "TeamBonusMazeBuffID": 3106601,
  "Difficulty": 1,
  "StagePeriod1": [
    414011
  ],
  "StagePeriod2": [
    414012
  ],
  "StagePeriod3": [
    414013
  ],
  "StagePeriod4": [],
  "FirstWinQuest": [],
  "RankList": "[{\"OENAMINOLLF\": \"C\"}, {\"OENAMINOLLF\": \"...",
  "InitialWeapon": [
    3106002
  ],
  "TrialAvatar": [
    1021003,
    1031013,
    3231110
  ],
  "RecommendList": "[{\"BOKJJKFCFME\": 3106807, \"AAGKEBFHLMC\":...",
  "GearRecommendList": [
    3106013,
    3106011,
    3106010
  ]
}
```

### PlanetFesGameReward.json (0.01 MB, 94 条)

**字段** (4): `GameRewardID, ItemList, GoldNum, BuffList`

**首条记录摘要**:
```json
{
  "GameRewardID": 10001,
  "ItemList": {},
  "GoldNum": 100,
  "BuffList": []
}
```

### MonsterGuideSkillText.json (0.01 MB, 54 条)

**字段** (5): `SkillTextID, Difficulty, SkillDescription, ParameterList, EffectIDList`

**首条记录摘要**:
```json
{
  "SkillTextID": 1001111,
  "Difficulty": 1,
  "SkillDescription": {
    "Hash": 15210234913514481605
  },
  "ParameterList": [],
  "EffectIDList": [
    70000301
  ]
}
```

### RogueTournRoomMark.json (0.01 MB, 24 条)

**字段** (5): `LHLKJIDFLIN, OPLOPGILKKH, LJFOMBOOEIC, ICIDICKIDCB, JLFLCFGCHHC`

**首条记录摘要**:
```json
{
  "LHLKJIDFLIN": "Boss",
  "OPLOPGILKKH": {
    "Hash": 4907355383946419622
  },
  "LJFOMBOOEIC": "Stages/OriginalResPos/InteractiveProp/Ro...",
  "ICIDICKIDCB": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "JLFLCFGCHHC": "SpriteOutput/Rogue/Map/RogueBossIcon.png"
}
```

### LimaoNewsOfficeEvent.json (0.01 MB, 27 条)

**字段** (10): `NMBKAIEIAPE, GMPGDEINODK, ELGNMHLEEEH, CPCMBMBFBAI, LDBCBEDHFPD, JCAGGCBNNDL, MPJLNHJIFIM, AJGGLOMPFOJ, HPLHMBBGAOO, GHOCDNJOCBH`

**首条记录摘要**:
```json
{
  "NMBKAIEIAPE": 10100,
  "GMPGDEINODK": "High",
  "ELGNMHLEEEH": 15,
  "CPCMBMBFBAI": 1,
  "LDBCBEDHFPD": {
    "Hash": 14449453907142003372
  },
  "JCAGGCBNNDL": {
    "Hash": 4054242077052354096
  },
  "MPJLNHJIFIM": "Config/Level/LINews/LINewsAct_10100.json",
  "AJGGLOMPFOJ": "",
  "HPLHMBBGAOO": 201160285,
  "GHOCDNJOCBH": 12
}
```

### AvatarBaseType.json (0.01 MB, 10 条)

**字段** (12): `ID, BaseTypeIcon, BaseTypeIconMiddle, BaseTypeIconSmall, EquipmentLightMatPath, Equipment3DTgaPath, BaseTypeIconPathTalk, BgPath, LightConeCardBackImagePath, BaseTypeText, BaseTypeDesc, FirstWordText`

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

### RogueTournHexDisplay.json (0.01 MB, 34 条)

**字段** (5): `HexDisplayID, Name, BgDesc, IconPath, FigureIconPath`

**首条记录摘要**:
```json
{
  "HexDisplayID": 1001,
  "Name": {
    "Hash": 16879572376825683541
  },
  "BgDesc": {
    "Hash": 5527099997371639934
  },
  "IconPath": "SpriteOutput/Rogue/MiracleIcon/1111.png",
  "FigureIconPath": "SpriteOutput/Rogue/MiracleFigureIcon/111..."
}
```

### AllowedTextLanguage.json (0.01 MB, 13 条)

**字段** (18): `TextLanguageKey, SDKkey, LanguageType, ShowString, Font, PSFont, CondensedFont, FontName, PSFontName, CondensedFontName, LogoImgPath, LanguageCultureCode, NoLeading, Ellipsis, NoWrap, FontGrowSize, TextureScale, RubyStrRatio`

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

### EvolveBuildConstValueCommon.json (0.01 MB, 70 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "EvolveBuild_Weight1",
  "Value": {
    "IntValue": 18
  }
}
```

### RogueTournTitanType.json (0.01 MB, 12 条)

**字段** (9): `RogueTitanType, RogueTitanCategory, TitanTitle, CharacterName, RogueTitanCardIcon, RogueTitanCardShadowIcon, RogueTitanTalentIcon, RogueTitanAvatarRoundIconSmall, RogueTitanAvatarRoundIconMid`

**首条记录摘要**:
```json
{
  "RogueTitanType": "Moneta",
  "RogueTitanCategory": "Day",
  "TitanTitle": {
    "Hash": 8595072891265059613
  },
  "CharacterName": {
    "Hash": 11483205432436410682
  },
  "RogueTitanCardIcon": "SpriteOutput/Rogue/Tourn/Titan/AvatarEnv...",
  "RogueTitanCardShadowIcon": "SpriteOutput/Rogue/Tourn/Titan/AvatarEnv...",
  "RogueTitanTalentIcon": "SpriteOutput/Rogue/Tourn/Titan/TitanIcon...",
  "RogueTitanAvatarRoundIconSmall": "SpriteOutput/Rogue/Tourn/Titan/AvatarRou...",
  "RogueTitanAvatarRoundIconMid": "SpriteOutput/Rogue/Tourn/Titan/AvatarRou..."
}
```

### GridFightOverrideRoleVO.json (0.01 MB, 82 条)

**字段** (4): `RoleID, ForbidVOTypes, OverrideVOTypes, OverrideVOTag`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "ForbidVOTypes": [],
  "OverrideVOTypes": [],
  "OverrideVOTag": "mar7th"
}
```

### GridFightTutorialTask.json (0.01 MB, 77 条)

**字段** (2): `TaskID, LevelGraphPath`

**首条记录摘要**:
```json
{
  "TaskID": 1,
  "LevelGraphPath": "Config/Level/GridFight/TutorialTask/Grid..."
}
```

### RestaurantCustomerConfig.json (0.01 MB, 23 条)

**字段** (9): `CustomerID, Type, NPCID, GroupID, ConfigID, BehaviorID, Model, IMGPath, IconPath`

**首条记录摘要**:
```json
{
  "CustomerID": 101,
  "Type": "Normal",
  "NPCID": 3202,
  "GroupID": 274,
  "ConfigID": 400012,
  "BehaviorID": 1,
  "Model": "Gameplays/ElfRestaurant/Prefab/Npcs/ElfR...",
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/NPC/NPC...",
  "IconPath": "SpriteOutput/Quest/ElfRestaurant/NPC/NPC..."
}
```

### SysMailConfig.json (0.01 MB, 37 条)

**字段** (5): `MailID, MailTitle, MailSender, MailDetail, MailLifeTime`

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

### ActivityRaidCollectionGroup.json (0.01 MB, 24 条)

**字段** (5): `RaidCollectionGroupID, RaidCollectionList, RaidCollectionGroupNextEnable, RaidCollectionGroupName, GroupEntrancePrefabPath`

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

### RogueTournUnlock.json (0.01 MB, 97 条)

**字段** (2): `RogueUnlockID, UnlockFinishWay`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 3000201,
  "UnlockFinishWay": 3000201
}
```

### ChatInviteConfig.json (0.01 MB, 16 条)

**字段** (11): `ID, ChatNoticeType, NoticeTime, NoticeDesc, SendDesc, PicPath, ExpireTime, InviteTitle, InviteContent, InviteGo, InviteInvalid`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ChatNoticeType": "MatchThreeInvite",
  "NoticeTime": 10,
  "NoticeDesc": {
    "Hash": 15755680163693366266
  },
  "SendDesc": {
    "Hash": 5773777254699910061
  },
  "PicPath": "SpriteOutput/Quest/MatchThree/Invitation...",
  "ExpireTime": 600,
  "InviteTitle": {
    "Hash": 12866596689499122105
  },
  "InviteContent": {
    "Hash": 4774431735713383061
  },
  "InviteGo": {
    "Hash": 7222123860325037981
  },
  "InviteInvalid": {
    "Hash": 14589409455103331985
  }
}
```

### CakeRaceField.json (0.01 MB, 4 条)

**字段** (14): `FieldID, FieldName, FieldDesc, FieldCost, FieldScoreRate, RewardID, FieldBattleItemList, FieldEffectWeight, FieldUnlockConditionList, FieldBetCost, FieldSectionWeight, FieldSectionNum, FieldCatWeight, FieldCatNum`

**首条记录摘要**:
```json
{
  "FieldID": 1,
  "FieldName": {
    "Hash": 16159436349629715625
  },
  "FieldDesc": {
    "Hash": 3509470383431490892
  },
  "FieldCost": 30000,
  "FieldScoreRate": 100,
  "RewardID": 313111,
  "FieldBattleItemList": [
    1,
    5,
    3
  ],
  "FieldEffectWeight": [],
  "FieldUnlockConditionList": [],
  "FieldBetCost": 10000,
  "FieldSectionWeight": "[{\"BFLIFKBEOPJ\": 1, \"MNDFOPKBHKP\": 15}, ...",
  "FieldSectionNum": 3,
  "FieldCatWeight": "[{\"BFLIFKBEOPJ\": 4, \"MNDFOPKBHKP\": 10}, ...",
  "FieldCatNum": 5
}
```

### MatchThreeV2Level.json (0.01 MB, 15 条)

**字段** (16): `LevelID, EnvironmentIDList, PlayerID, LevelImage, OpponentID, TurnStep, OpponentBirdID, OpponentBattleItemMap, VictoryDesc, LoseDesc, VSTalk, SpecialRuleIDList, RecommendBirdList, RecommendBattleItemList, PreSubmission, MaxRatioPowerDiff`

**首条记录摘要**:
```json
{
  "LevelID": 101,
  "EnvironmentIDList": [
    201
  ],
  "PlayerID": 1000,
  "LevelImage": "",
  "OpponentID": 1101,
  "TurnStep": 2,
  "OpponentBirdID": 510,
  "OpponentBattleItemMap": {
    "1": 1
  },
  "VictoryDesc": {
    "Hash": 4781967691310123735
  },
  "LoseDesc": {
    "Hash": 5615291525657610587
  },
  "VSTalk": [
    1101
  ],
  "SpecialRuleIDList": [
    1
  ],
  "RecommendBirdList": [
    501,
    504
  ],
  "RecommendBattleItemList": [
    6
  ],
  "PreSubmission": 803410116,
  "MaxRatioPowerDiff": 100
}
```

### MessageItemImage.json (0.01 MB, 68 条)

**字段** (3): `ID, ImagePath, FemaleImagePath`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "ImagePath": "SpriteOutput/PhoneMessagePic/PhoneMessag...",
  "FemaleImagePath": ""
}
```

### ElationBasicLevelDamage.json (0.01 MB, 101 条)

**字段** (2): `Level, ElationBasicLevelDamage`

**首条记录摘要**:
```json
{
  "Level": 1,
  "ElationBasicLevelDamage": {
    "Value": 108
  }
}
```

### IdleLiveEmojiSender.json (0.01 MB, 397 条)

**字段** (1): `ID`

**首条记录摘要**:
```json
{
  "ID": 1
}
```

### ChallengePeakGroupConfig.json (0.01 MB, 8 条)

**字段** (13): `ID, Title, RecommendID, ActivityModule, PreLevelIDList, BossLevelID, RewardGroupID, BossUI3DPrefabPath, BossUI3DAnimatorPath, ThemePosterTabPicPath, ThemeIconPicPath, HandBookPanelBannerPath, RankIconPathList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Title": {
    "Hash": 3550232802813737810
  },
  "RecommendID": 1,
  "ActivityModule": 2100101,
  "PreLevelIDList": [
    101,
    102,
    103
  ],
  "BossLevelID": 104,
  "RewardGroupID": 1,
  "BossUI3DPrefabPath": "UI/UI3D/ChallengePeak/_dependencies/Pref...",
  "BossUI3DAnimatorPath": "UI/UI3D/ChallengePeak/_dependencies/Anim...",
  "ThemePosterTabPicPath": "SpriteOutput/Quest/TabIcon/BtnChallengeP...",
  "ThemeIconPicPath": "SpriteOutput/ChallengePeak/ChallengePeak...",
  "HandBookPanelBannerPath": "SpriteOutput/DailyMission/Banner/Challen...",
  "RankIconPathList": "[\"SpriteOutput/ChallengePeak/MedallionIc..."
}
```

### MatchThreeV2AvatarCutin.json (0.01 MB, 44 条)

**字段** (4): `CutinID, ImagePath, TalkText, MaxTriggerNum`

**首条记录摘要**:
```json
{
  "CutinID": 1011,
  "ImagePath": "SpriteOutput/Quest/MatchThree/LevelItem/...",
  "TalkText": {
    "Hash": 6617548240040557714
  },
  "MaxTriggerNum": 1
}
```

### ModelIconConfig.json (0.01 MB, 66 条)

**字段** (2): `ID, PrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PrefabPath": "Stages/OriginalResPos/Chapter03/Prefab/3..."
}
```

### MonsterAtlasExtraPhase.json (0.01 MB, 9 条)

**字段** (7): `TemplateGroupID, PhaseID, StanceWeakList, DebuffResist, DamageTypeResistance, ManikinPrefabPath, ManikinConfigPath`

**首条记录摘要**:
```json
{
  "TemplateGroupID": 4014010,
  "PhaseID": 1,
  "StanceWeakList": [
    "Ice",
    "Thunder",
    "Quantum"
  ],
  "DebuffResist": "[{\"Key\": \"STAT_CTRL\", \"Value\": {\"Value\":...",
  "DamageTypeResistance": "[{\"DamageType\": \"Physical\", \"Value\": {\"V...",
  "ManikinPrefabPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M..."
}
```

### FateMaster.json (0.01 MB, 21 条)

**字段** (7): `ACCJKGEKHKP, LEKEEONHDLP, DMMLHHHPBMO, LAFABGLMPIA, OHGFMOPCOKM, MDEBFIFOKHH, BELPGNDDELK`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 1221,
  "LEKEEONHDLP": "Saber",
  "DMMLHHHPBMO": "Config/Gameplays/Fate/MasterConfig/FateM...",
  "LAFABGLMPIA": {
    "Hash": 14361656855367862028
  },
  "OHGFMOPCOKM": {
    "Hash": 16124817143345338173
  },
  "MDEBFIFOKHH": [
    {
      "Value": 1
    }
  ],
  "BELPGNDDELK": "SpriteOutput/AvatarShopIcon/Avatar/1221...."
}
```

### TreasureDungeonAvatar.json (0.01 MB, 45 条)

**字段** (5): `AvatarPickID, SpecialAvataID, Dialogue1, FigureDiff, FigureScale`

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

### DrinkMakerIngredientData.json (0.01 MB, 15 条)

**字段** (11): `ID, IngredientName, IngredientDesc, IconPath, SmallIconPath, Color, PhyParam, EffParam, UnlockType, UnlockParam, IncludeTagList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IngredientName": {
    "Hash": 10745686697800912086
  },
  "IngredientDesc": {
    "Hash": 6854268960942700495
  },
  "IconPath": "SpriteOutput/Quest/DrinkMaker/ItemIcon/S...",
  "SmallIconPath": "SpriteOutput/Quest/DrinkMaker/ItemIconLi...",
  "Color": [
    199,
    112,
    186
  ],
  "PhyParam": [
    0.8,
    0,
    0,
    0.3
  ],
  "EffParam": [
    1,
    0,
    0,
    0
  ],
  "UnlockType": "Level",
  "UnlockParam": [
    1
  ],
  "IncludeTagList": [
    3,
    22
  ]
}
```

### FateHandbookMaster.json (0.01 MB, 21 条)

**字段** (11): `ACCJKGEKHKP, JKIMMLOIJKJ, JFOOFHLOJAO, AMOILJKCNOI, HLBMOIKELLN, PPMFCIIEGJF, MNMGEPNEJDO, LEPNNKOAOJF, AJKJEBNLMIE, PAFJIBPHLBF, HMGGLIEMDDF`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 1221,
  "JKIMMLOIJKJ": "A",
  "JFOOFHLOJAO": "E",
  "AMOILJKCNOI": "B",
  "HLBMOIKELLN": "E",
  "PPMFCIIEGJF": "B",
  "MNMGEPNEJDO": "B",
  "LEPNNKOAOJF": "FateHandbookMaster_HouguName_1221",
  "AJKJEBNLMIE": {
    "Hash": 3616672462042834862
  },
  "PAFJIBPHLBF": {
    "Hash": 4609378366164803259
  },
  "HMGGLIEMDDF": {
    "Hash": 5029542976110337709
  }
}
```

### ActivityAvatarDemo.json (0.01 MB, 69 条)

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

### MazePuzzleOrigamiColony.json (0.01 MB, 40 条)

**字段** (5): `OrigamiColonyID, FloorID, MaterialCost, TalkSentenceID, FinishQuestID`

**首条记录摘要**:
```json
{
  "OrigamiColonyID": 1,
  "FloorID": 20311001,
  "MaterialCost": [
    {
      "ItemID": 122000,
      "ItemNum": 1
    }
  ],
  "TalkSentenceID": 414030589,
  "FinishQuestID": 2200011
}
```

### ParkourLevelConfig.json (0.01 MB, 13 条)

**字段** (17): `ID, StoryLevel, Name, Desc, UnlockType, UnlockParam, RailBallLimit, GameAssetPath, GameAssetPathOnClear, MinimapResPath, MinimapAngle, LevelRegionState, LapCount, TargetRank, FinishDisplay, BGMIDList, TriggerCarTaskUnlock`

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

### DrinkMakerTagData.json (0.01 MB, 59 条)

**字段** (7): `TagID, TagName, Type, Priority, SourceType, MixParam, IsShow`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "TagName": {
    "Hash": 6779908625200616704
  },
  "Type": "Taste",
  "Priority": 4,
  "SourceType": "Ingredient",
  "MixParam": [],
  "IsShow": true
}
```

### AvatarDefaultMazeBuff.json (0.01 MB, 91 条)

**字段** (3): `ID, SkillIndex, DefaultMazeBuffIDList`

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

### ActivityDiceSkillCutin.json (0.01 MB, 33 条)

**字段** (4): `KJCGGEPHCMC, BDACPPLKLGL, OLOIFNNLKJP, OENAMINOLLF`

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

### ServerInteractVerification.json (0.01 MB, 93 条)

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

### ImgDanmuContent.json (0.01 MB, 122 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 19,
  "IconPath": "SpriteOutput/Emoji/131015.png"
}
```

### ClockParkConst.json (0.01 MB, 38 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Panel_Goto_Mapping_Info",
  "Value": {
    "IntValue": 2401
  }
}
```

### MuseumRandomEventConfig.json (0.01 MB, 35 条)

**字段** (6): `RandomEventID, EventType, EventTypeParameter, TriggerTypeParameter, EventTitle, Event`

**首条记录摘要**:
```json
{
  "RandomEventID": 102,
  "EventType": "Operate",
  "EventTypeParameter": [
    301,
    302
  ],
  "TriggerTypeParameter": [
    3,
    6
  ],
  "EventTitle": {
    "Hash": 6847811289494213084
  },
  "Event": {
    "Hash": 16875807577354901038
  }
}
```

### MazePuzzleMovieLevel.json (0.01 MB, 27 条)

**字段** (6): `MovieLevel, Title, Description, QuestList, TriggerCustomString, Tutorial`

**首条记录摘要**:
```json
{
  "MovieLevel": 1,
  "Title": {
    "Hash": 14278655786619169730
  },
  "Description": {
    "Hash": 735032320176704012
  },
  "QuestList": [
    2200017
  ],
  "TriggerCustomString": "Racing_Lv1",
  "Tutorial": 6091
}
```

### ActivityRogueAreaOverride.json (0.01 MB, 35 条)

**字段** (3): `RogueAreaID, ScoreMap, RecommendLevel`

**首条记录摘要**:
```json
{
  "RogueAreaID": 10100,
  "ScoreMap": "{\"1\": 50, \"2\": 100, \"3\": 150, \"4\": 200, ...",
  "RecommendLevel": 30
}
```

### AvatarEquipRecommend.json (0.01 MB, 91 条)

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

### TarotBookCharacter.json (0.01 MB, 13 条)

**字段** (11): `ID, StoryList, Name, MainCatalogTitle, SubCatalogTitle, MaxLevel, PrefabPath, TabIconPath, RoundIconPath, RectIconPath, Position`

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

### ChenLingSoldierLevel.json (0.01 MB, 50 条)

**字段** (5): `SoldierID, Level, UnitIDList, FormationType, BattleScoreFix`

**首条记录摘要**:
```json
{
  "SoldierID": 1,
  "Level": 1,
  "UnitIDList": [
    101,
    101,
    101
  ],
  "FormationType": 3,
  "BattleScoreFix": {
    "Value": 0.0009999999
  }
}
```

### MaterialSubmitter.json (0.01 MB, 28 条)

**字段** (6): `ID, ActivityModuleID, ParamList, MaterialList, MissionID, RewardID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 3000501,
  "ParamList": [],
  "MaterialList": "[{\"ItemID\": 111011, \"ItemNum\": 1}, {\"Ite...",
  "MissionID": 8000170,
  "RewardID": 3100301
}
```

### RogueMagicLayerRoom.json (0.01 MB, 176 条)

**字段** (2): `LayerID, RoomIndex`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "RoomIndex": 1
}
```

### RestaurantSpecialBubble.json (0.01 MB, 45 条)

**字段** (6): `ID, BehaviorName, DynamicValue, Content, GenCustomerNumGap, GenMaxNum`

**首条记录摘要**:
```json
{
  "ID": 1,
  "BehaviorName": "EatingNormal",
  "DynamicValue": 101,
  "Content": {
    "Hash": 13711050355164731966
  },
  "GenCustomerNumGap": 1,
  "GenMaxNum": 1
}
```

### MazePuzzleGravityBall.json (0.01 MB, 49 条)

**字段** (4): `PuzzleID, WallPrefab, DestructablePropList, HiddenStoryCode`

**首条记录摘要**:
```json
{
  "PuzzleID": 1,
  "WallPrefab": "Props/DesignerBackup/GravityBall/Gravity...",
  "DestructablePropList": [],
  "HiddenStoryCode": ""
}
```

### SpecialNPCData.json (0.01 MB, 24 条)

**字段** (5): `ID, PrefabPath, ConfigEntityPath, JsonPath, MazeSkillIdList`

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

### MainMissionPack.json (0.01 MB, 80 条)

**字段** (2): `MissionPack, MainMissionIdList`

**首条记录摘要**:
```json
{
  "MissionPack": 1000201,
  "MainMissionIdList": [
    1000201,
    1000202,
    1000203,
    1000204
  ]
}
```

### LimaoNewsPostState.json (0.01 MB, 81 条)

**字段** (4): `DGLJLJEHNNB, AEDOBNFDODI, CNCKNJMHDIL, KMIBDJKKGDE`

**首条记录摘要**:
```json
{
  "DGLJLJEHNNB": 101,
  "AEDOBNFDODI": 1,
  "CNCKNJMHDIL": [],
  "KMIBDJKKGDE": 3258
}
```

### MonsterGuidePhase.json (0.01 MB, 27 条)

**字段** (7): `PhaseID, Difficulty, PhasePic, PhaseName, PhaseAnswer, PhaseDescription, SkillList`

**首条记录摘要**:
```json
{
  "PhaseID": 10011,
  "Difficulty": 1,
  "PhasePic": "",
  "PhaseName": {
    "Hash": 8795189296306663420
  },
  "PhaseAnswer": {
    "Hash": 9796150480090223892
  },
  "PhaseDescription": {
    "Hash": 17152208794596079138
  },
  "SkillList": [
    100111,
    100112,
    100113
  ]
}
```

### ParkourTriggerEventContent.json (0.01 MB, 63 条)

**字段** (3): `ID, TriggerShowType, SpritePath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "TriggerShowType": "Sprite",
  "SpritePath": "SpriteOutput/Emoji/114006.png"
}
```

### TeamTowersBoss.json (0.01 MB, 16 条)

**字段** (10): `PHFMCACHFIJ, OENAMINOLLF, NMAHGFAPENI, BDACPPLKLGL, KKJHBCAHFAO, FBKAMIHGLFK, GFLGOBHOKHI, DBIHGLJEGPO, HAEDMJHMJHC, CBBDEODGNDG`

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

### IdleLiveGiftAction.json (0.01 MB, 54 条)

**字段** (4): `ID, AbilityName, AbilityParam, EffectType`

**首条记录摘要**:
```json
{
  "ID": 2011,
  "AbilityName": "RtBattle_Gift_Rocket",
  "AbilityParam": [
    {
      "Value": 0.05
    }
  ],
  "EffectType": "Rocket"
}
```

### ActivityFarmMultipleDrop.json (0.01 MB, 14 条)

**字段** (13): `ID, Type, MultipleDropTypeList, DropMultiple, CountRefreshType, CountValue, Priority, HintText, LabelText, NameText, BannerText, ActivityPanelBannerText, MappingInfoBannerText`

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

### ChenLingSoldier.json (0.01 MB, 12 条)

**字段** (12): `ID, PromotionConditionList, InitialMaxLevel, Name, Position, ModelPath, SmallIconPath, SmallIconOutlinePath, SkillDesc, PromotionSkillDesc, SkillIDList, AtkSkillIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PromotionConditionList": [
    101,
    102,
    103
  ],
  "InitialMaxLevel": 3,
  "Name": {
    "Hash": 9053650208705105013
  },
  "Position": "Middle",
  "ModelPath": "UI/UI3D/ActivityChenLingBattle/ChenLingS...",
  "SmallIconPath": "SpriteOutput/Quest/ActivityChenLing/Sold...",
  "SmallIconOutlinePath": "SpriteOutput/Quest/ActivityChenLing/Sold...",
  "SkillDesc": {
    "Hash": 12163990470400221003
  },
  "PromotionSkillDesc": {
    "Hash": 3529286232504630742
  },
  "SkillIDList": [
    104
  ],
  "AtkSkillIDList": [
    101
  ]
}
```

### PlayerRoomSlotConfig.json (0.01 MB, 44 条)

**字段** (6): `ID, Name, SortID, CameraStaticID, TagList, TypeList`

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

### MapShortCutConfig.json (0.01 MB, 29 条)

**字段** (8): `ID, Name, Type, Params, IconPath, UnlockID, EntranceID, MappingInfoID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Name": {
    "Hash": 14378181723708027634
  },
  "Type": "WORLD_LEVEL_REWARD",
  "Params": [],
  "IconPath": "SpriteOutput/MapPics/Collect/IconCollect...",
  "UnlockID": 9909,
  "EntranceID": 1000001,
  "MappingInfoID": 2463
}
```

### AvatarServantConfig.json (0.01 MB, 6 条)

**字段** (21): `ServantID, ServantName, HeadIcon, UnCreateHeadIconPath, WaitingServantHeadIconPath, ActionServantHeadIconPath, ServantSideIconPath, ServantMiniIconPath, Config, AIPath, Prefab, ManikinJsonPath, UIServantModelPath, SkillIDList, HPBase, HPInherit, HPSkill, SpeedBase, SpeedInherit, SpeedSkill, Aggro`

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

### ChimeraDuelConstCommon.json (0.01 MB, 44 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChimeraDuel_ChimeraExp_List",
  "Value": "{\"MapValue\": {\"IntValue\": {\"IntValue\": 3..."
}
```

### ParkourTriggerEvent.json (0.01 MB, 29 条)

**字段** (8): `EventID, OriginType, OriginID, TargetType, LimitLevelID, TriggerEventType, Param, DisplayContentIDList`

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

### GridFightSeasonItem.json (0.01 MB, 164 条)

**字段** (2): `ItemID, SeasonID`

**首条记录摘要**:
```json
{
  "ItemID": 350101,
  "SeasonID": 1
}
```

### AvatarBreakDamage.json (0.01 MB, 101 条)

**字段** (2): `Level, BreakBaseDamage`

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

**字段** (12): `GroupID, GroupTitle, Season, MazeBuffID, GroupPicPath, PerfectQuest, PerfectWave, ActivityModuleID, EvaluateWave, TutorialGuideID, TrialAvatar, ElementList`

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

### ScheduleDataRogue.json (0.01 MB, 78 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 100001,
  "BeginTime": "2021-05-30 04:00:00",
  "EndTime": "2022-05-30 03:59:59"
}
```

### MatchThreeConstValueCommon.json (0.01 MB, 52 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "MatchThree_PVPUnlock",
  "Value": {
    "IntValue": 802310509
  }
}
```

### GridFightRoleAutoWeight.json (0.01 MB, 77 条)

**字段** (2): `RoleID, OverWriteDamageCarry`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "OverWriteDamageCarry": {
    "Value": -1
  }
}
```

### RestaurantRecipeConfig.json (0.01 MB, 17 条)

**字段** (8): `RecipeID, Name, Detail, Materials, TAGList, Model, IMGPath, UnlockIDList`

**首条记录摘要**:
```json
{
  "RecipeID": 101,
  "Name": {
    "Hash": 11314786028561392240
  },
  "Detail": {
    "Hash": 17817409095951395668
  },
  "Materials": {
    "201": 2
  },
  "TAGList": [
    9901
  ],
  "Model": "Gameplays/ElfRestaurant/Prefab/ResFoods/...",
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/Dishes/...",
  "UnlockIDList": []
}
```

### ActivityQuestRewardTab.json (0.01 MB, 44 条)

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

### CakeRaceTriggerCondition.json (0.01 MB, 72 条)

**字段** (3): `ConditionID, ConditionType, ParamList`

**首条记录摘要**:
```json
{
  "ConditionID": 1011,
  "ConditionType": "BattleItemIDIs",
  "ParamList": [
    "1"
  ]
}
```

### TravelBrochureDiaryChoice.json (0.01 MB, 56 条)

**字段** (2): `ID, ChoiceMessage`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "ChoiceMessage": {
    "Hash": 16109048495737127650
  }
}
```

### MusicRhythmLevel.json (0.01 MB, 27 条)

**字段** (8): `ID, Group, Difficulty, StarScoreList, StarRewardIDList, EnterType, InputScore, FeverComboCount`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Group": 1,
  "Difficulty": 1,
  "StarScoreList": [
    800,
    1600,
    2400
  ],
  "StarRewardIDList": [
    261001,
    261002,
    261003
  ],
  "EnterType": 1,
  "InputScore": [
    100,
    85,
    0
  ],
  "FeverComboCount": 10
}
```

### RogueNousSubStory.json (0.01 MB, 20 条)

**字段** (10): `StoryID, MaxNousValue, NextIDList, RequireArea, Layer, TriggerCondition, DisplayID, QuestID, LevelGraphPath, TalkNameID`

**首条记录摘要**:
```json
{
  "StoryID": 1001,
  "MaxNousValue": 40,
  "NextIDList": [
    2011,
    2012,
    2013,
    2014
  ],
  "RequireArea": 401,
  "Layer": 1,
  "TriggerCondition": {
    "Hash": 5747710745894397252
  },
  "DisplayID": [
    101
  ],
  "QuestID": 6014101,
  "LevelGraphPath": "Config/Level/RogueDialogue/RogueNpcDialo...",
  "TalkNameID": 139
}
```

### MarbleSealLevel.json (0.01 MB, 56 条)

**字段** (5): `ID, Level, UnlockSkillID, LevelUpDesc, SkillParamList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Level": 1,
  "UnlockSkillID": 101,
  "LevelUpDesc": {
    "Hash": 5487731049582873711
  },
  "SkillParamList": [
    2
  ]
}
```

### SummonUnitData.json (0.01 MB, 39 条)

**字段** (6): `ID, JsonPath, DestroyOnEnterBattle, RemoveMazeBuffOnDestroy, MaxSummonCount, UniqueGroup`

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

### CakeRaceRegion.json (0.01 MB, 41 条)

**字段** (5): `RegionID, CatIDList, FieldIDList, TagList, RegionJson`

**首条记录摘要**:
```json
{
  "RegionID": 1,
  "CatIDList": [
    4,
    8,
    12
  ],
  "FieldIDList": [
    3,
    4
  ],
  "TagList": [
    "Normal",
    "Travelator"
  ],
  "RegionJson": ""
}
```

### RogueAeonLevelConfig.json (0.01 MB, 64 条)

**字段** (3): `RogueAeonID, AeonStoryID, Level`

**首条记录摘要**:
```json
{
  "RogueAeonID": 1,
  "AeonStoryID": 1,
  "Level": 1
}
```

### MuseumItem.json (0.01 MB, 21 条)

**字段** (11): `ItemID, AreaID, UnlockPhase, MuseumItemDesc, SceneGroupID, ScenePropID, EvidenceInfoTextID, ItemSkillList, DisplayOrder, CollectedReward, HideGetHint`

**首条记录摘要**:
```json
{
  "ItemID": 250001,
  "AreaID": 1,
  "UnlockPhase": 1,
  "MuseumItemDesc": {
    "Hash": 13429187189885476910
  },
  "SceneGroupID": 28,
  "ScenePropID": 300020,
  "EvidenceInfoTextID": {
    "Hash": 329233695369069764
  },
  "ItemSkillList": [
    1
  ],
  "DisplayOrder": 1,
  "CollectedReward": 26000106,
  "HideGetHint": true
}
```

### PerformanceSubMissionLink.json (0.01 MB, 79 条)

**字段** (3): `PerformanceType, PerformanceID, SubMissionID`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 201160107,
  "SubMissionID": 201160107
}
```

### IdleLiveSpEquip.json (0.01 MB, 9 条)

**字段** (6): `ID, HpParam, AttackParam, DefenceParam, Name, IconPath`

**首条记录摘要**:
```json
{
  "ID": 701,
  "HpParam": "{\"LIOIAIIHLON\": {\"Value\": 1500}, \"CONAIK...",
  "AttackParam": "{\"LIOIAIIHLON\": {\"Value\": 30}, \"CONAIKKD...",
  "DefenceParam": "{\"LIOIAIIHLON\": {\"Value\": 27}, \"CONAIKKD...",
  "Name": {
    "Hash": 13895689034350914730
  },
  "IconPath": "SpriteOutput/Quest/EvolveBuild/EvoLveBui..."
}
```

### RoguePersonaRoomCompType.json (0.01 MB, 18 条)

**字段** (8): `LLICIMBCNPF, LHLKJIDFLIN, JPLIONFJGCL, BAAOGIMCALN, NMAHGFAPENI, LJPBJNANBLB, OLOIFNNLKJP, CILPGJAFCOK`

**首条记录摘要**:
```json
{
  "LLICIMBCNPF": 1,
  "LHLKJIDFLIN": "Boss",
  "JPLIONFJGCL": "Red",
  "BAAOGIMCALN": {
    "Hash": 1451107305156829947
  },
  "NMAHGFAPENI": {
    "Hash": 12538922076328420828
  },
  "LJPBJNANBLB": {
    "Hash": 12380651845040323157
  },
  "OLOIFNNLKJP": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "CILPGJAFCOK": "SpriteOutput/Rogue/Map/RogueBossIcon.png"
}
```

### MonsterDifficultyGuide.json (0.01 MB, 48 条)

**字段** (4): `DifficultyGuideID, DifficultyGuideDescription, SkillID, ParameterList`

**首条记录摘要**:
```json
{
  "DifficultyGuideID": 10010,
  "DifficultyGuideDescription": {
    "Hash": 1916644733650887747
  },
  "SkillID": 100401410,
  "ParameterList": [
    0.6,
    1.25,
    1
  ]
}
```

### AlleyGrid.json (0.01 MB, 29 条)

**字段** (6): `GridID, GridType, GridTitle, GridIcon, GridDesc, ShopInfoIcon`

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

### SpecialMappingInfo.json (0.01 MB, 109 条)

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

### MuseumArea.json (0.01 MB, 42 条)

**字段** (8): `AreaID, Level, PhaseLimit, FundCost, RenewPoint, RequireStatsA, RequireStatsB, RequireStatsC`

**首条记录摘要**:
```json
{
  "AreaID": 1,
  "Level": 1,
  "PhaseLimit": 1,
  "FundCost": 200,
  "RenewPoint": 80,
  "RequireStatsA": 65,
  "RequireStatsB": 65,
  "RequireStatsC": 65
}
```

### ToastManager.json (0.01 MB, 93 条)

**字段** (2): `FuncName, Priority`

**首条记录摘要**:
```json
{
  "FuncName": "MissionStart",
  "Priority": 20
}
```

### PixAirEventOptionConfig.json (0.01 MB, 37 条)

**字段** (5): `ContentID, OptionID, BasicCost, OptionDescribe, OptionEffectDesc`

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

### CakeRaceConstValueClient.json (0.01 MB, 50 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "CakeRace_Runnerup_Coin_Reward_Ratio",
  "Value": {
    "DoubleValue": 0.8
  }
}
```

### ChenLingGameBoyCase.json (0.01 MB, 11 条)

**字段** (16): `GameBoyCaseID, FDGroupID, FDHardInstanceID, FDHardEntityID, FDCheatInstanceID, FDCheatEntityID, CheatCodeList, CoverImagePath, GameBoyChallengeIDList, ChallengeTimeLimit, GameBoyNameID, GameBoyThemeID, CheatQuestID, RankingsNPCList, SettlementTitleID, CheatSettlementTitleID`

**首条记录摘要**:
```json
{
  "GameBoyCaseID": 1,
  "FDGroupID": 28,
  "FDHardInstanceID": 110001,
  "FDHardEntityID": 17,
  "FDCheatInstanceID": 110002,
  "FDCheatEntityID": 17,
  "CheatCodeList": "WWDDASDW",
  "CoverImagePath": "SpriteOutput/AvatarDrawCardResult/1212.p...",
  "GameBoyChallengeIDList": [
    7,
    5,
    6
  ],
  "ChallengeTimeLimit": 60,
  "GameBoyNameID": {
    "Hash": 17804661510867958164
  },
  "GameBoyThemeID": "01",
  "CheatQuestID": 2200641,
  "RankingsNPCList": [
    1,
    2,
    3,
    4
  ],
  "SettlementTitleID": {
    "Hash": 13186066336154128023
  },
  "CheatSettlementTitleID": {
    "Hash": 5790321781566483320
  }
}
```

### LocalLegendStageConfig.json (0.01 MB, 15 条)

**字段** (8): `GroupID, DifficultyLevel, EventID, BattleTargetList, BattleAreaID, TrialAvatarList, ManikinPrefabPath, ManikinConfigPath`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "DifficultyLevel": "Easy",
  "EventID": 426004,
  "BattleTargetList": [
    5001804
  ],
  "BattleAreaID": 2042104,
  "TrialAvatarList": "[3231402, 3231403, 3231302, 3238007, 323...",
  "ManikinPrefabPath": "UI/UI3D/LocalLegend/Monster/LocalLegend_...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M..."
}
```

### MuseumStuff.json (0.01 MB, 33 条)

**字段** (12): `ItemID, Type, StatsA, StatsB, StatsC, UnlockPhase, EvidenceInfoTextID, MuseumStuffDesc, SceneGroupID, ScenePropID, DisplayOrder, CollectedReward`

**首条记录摘要**:
```json
{
  "ItemID": 250101,
  "Type": "Avatar",
  "StatsA": 48,
  "StatsB": 23,
  "StatsC": 85,
  "UnlockPhase": 1,
  "EvidenceInfoTextID": {
    "Hash": 8508517841704101751
  },
  "MuseumStuffDesc": {
    "Hash": 10172304998134125961
  },
  "SceneGroupID": 18,
  "ScenePropID": 300008,
  "DisplayOrder": 4,
  "CollectedReward": 26000107
}
```

### DecalConfig.json (0.01 MB, 19 条)

**字段** (9): `DecalID, Comment, TextureMapPath, Name, Desc, IconPath, FigurePath, BgPath, UnlockMission`

**首条记录摘要**:
```json
{
  "DecalID": 2,
  "Comment": "测试-汗滴",
  "TextureMapPath": "Stages/OriginalResPos/InteractiveProp/Co...",
  "Name": {
    "Hash": 4461017402447956550
  },
  "Desc": {
    "Hash": 12138165668760321568
  },
  "IconPath": "SpriteOutput/UI/Quest/Graffit/GraffitTag...",
  "FigurePath": "SpriteOutput/UI/Quest/Graffit/GraffitTag...",
  "BgPath": "SpriteOutput/UI/Quest/Graffit/GraffitPho...",
  "UnlockMission": 2000701
}
```

### BoxingClubChallenge.json (0.01 MB, 12 条)

**字段** (15): `ChallengeID, Type, StageBuffAndGroupMap, StageGroupList, FirstPassRewardID, ActivityModuleID, Name, IconPath, DamageType, ChallengeTurnLimit, PerfectTurn, ChallengeBuff, ChallengeTip, SpecialAvatarIDList, SpecialAvatarActivityModule`

**首条记录摘要**:
```json
{
  "ChallengeID": 1,
  "Type": "First",
  "StageBuffAndGroupMap": {},
  "StageGroupList": [
    10,
    11,
    12,
    13,
    14,
    15
  ],
  "FirstPassRewardID": 139011,
  "ActivityModuleID": 5000002,
  "Name": {
    "Hash": 6351739166480473374
  },
  "IconPath": "SpriteOutput/UI/Quest/FistClub/FistClubT...",
  "DamageType": [
    "Wind",
    "Quantum",
    "Fire",
    "Thunder"
  ],
  "ChallengeTurnLimit": 20,
  "PerfectTurn": 7,
  "ChallengeBuff": 3100037,
  "ChallengeTip": {
    "Hash": 2447714964684200877
  },
  "SpecialAvatarIDList": [
    3051204
  ],
  "SpecialAvatarActivityModule": 5000001
}
```

### GridFightNpcConfig.json (0.01 MB, 24 条)

**字段** (7): `ID, NpcType, NpcName, NpcDesc, Icon, RoundIcon, PositionRegion`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NpcType": 1,
  "NpcName": {
    "Hash": 1588884086553304121
  },
  "NpcDesc": {
    "Hash": 3519899702110441244
  },
  "Icon": "SpriteOutput/AvatarIcon/NPC/3015.png",
  "RoundIcon": "SpriteOutput/AvatarRoundIcon/3015.png",
  "PositionRegion": "Back"
}
```

### GridFightCraftConfig.json (0.01 MB, 57 条)

**字段** (4): `CraftID, ID, CraftEquipID, CostEquipList`

**首条记录摘要**:
```json
{
  "CraftID": 1,
  "ID": 35030101,
  "CraftEquipID": 35030101,
  "CostEquipList": [
    350201,
    350201
  ]
}
```

### MazePuzzleSwitchMascot.json (0.01 MB, 4 条)

**字段** (11): `SwitchID, PlaneID, FloorID, EntryBlackHoleID, Section1LoadEntityList, Section2LoadEntityList, Section3LoadEntityList, ColliderPath, CoinPropID, ControllerBlackHoleID, ChestID`

**首条记录摘要**:
```json
{
  "SwitchID": 1,
  "PlaneID": 20461,
  "FloorID": 20461001,
  "EntryBlackHoleID": [
    2,
    300001
  ],
  "Section1LoadEntityList": "[{\"LLDCHLHNADA\": 3, \"GDBJDAOOCOH\": 30000...",
  "Section2LoadEntityList": "[{\"LLDCHLHNADA\": 3, \"GDBJDAOOCOH\": 30000...",
  "Section3LoadEntityList": [
    {}
  ],
  "ColliderPath": "Stages/OriginalResPos/Chapter04/Prefab/C...",
  "CoinPropID": "[{\"LLDCHLHNADA\": 2, \"GDBJDAOOCOH\": 30000...",
  "ControllerBlackHoleID": [
    2,
    300001
  ],
  "ChestID": [
    2,
    300010
  ]
}
```

### IdleLiveEquipProperty.json (0.01 MB, 13 条)

**字段** (9): `ID, PropertyType, BasicParam, LevelParam, RarityParam, RarityPower, OffsetRange, OffsetQuantizeCount, RandomFactorList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PropertyType": "BaseHP",
  "BasicParam": {
    "Value": 800
  },
  "LevelParam": {
    "Value": 600
  },
  "RarityParam": {
    "Value": 1590
  },
  "RarityPower": {
    "Value": 1.096
  },
  "OffsetRange": {
    "Value": 0.1
  },
  "OffsetQuantizeCount": 5,
  "RandomFactorList": "[{\"Value\": 0.98}, {\"Value\": 0.99}, {\"Val..."
}
```

### ConstValueRogue.json (0.01 MB, 85 条)

**字段** (2): `ConstRogueName, ConstValue`

**首条记录摘要**:
```json
{
  "ConstRogueName": "Rogue_Entrance_Cost",
  "ConstValue": ""
}
```

### ClockParkRound.json (0.01 MB, 169 条)

**字段** (1): `RoundID`

**首条记录摘要**:
```json
{
  "RoundID": 10101
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

**字段** (3): `LLGEOLMFMAB, IHDKMCABFBO, BLKFELPDINH`

**首条记录摘要**:
```json
{
  "LLGEOLMFMAB": 1,
  "IHDKMCABFBO": 1,
  "BLKFELPDINH": "Config/Gameplays/Hipplen/MiniGame/Hipple..."
}
```

### BattlePassReward.json (0.01 MB, 98 条)

**字段** (4): `ID, RewardItem, RewardIcon, NumShow`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RewardItem": 300011,
  "RewardIcon": "",
  "NumShow": true
}
```

### InControlControlTypeInfo.json (0.01 MB, 35 条)

**字段** (5): `controlType, isSettingControlType, iconForSony, iconForXBox, iconForSwitch`

**首条记录摘要**:
```json
{
  "controlType": "Action1",
  "isSettingControlType": true,
  "iconForSony": "SpriteOutput/KeyMapIcons/PS4/UI_ps4_key4...",
  "iconForXBox": "SpriteOutput/KeyMapIcons/XBox/UI_xbox_ke...",
  "iconForSwitch": ""
}
```

### DrinkMakerCheersEngage.json (0.01 MB, 48 条)

**字段** (3): `IngredientID, HeadIconPath, Engage`

**首条记录摘要**:
```json
{
  "IngredientID": 1000,
  "HeadIconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "Engage": {
    "Hash": 11685771222802258303
  }
}
```

### TreasureDungeonConfig.json (0.01 MB, 10 条)

**字段** (14): `DungeonID, GroupID, InitialExplore, MaxExplore, GridExploreCost, ExploreSubHpRatio, SpecialAvatarIDList, Name, Desc, ImgPath, EntranceIconPath, DisplayMonsterIDList, DisplayEventID, RecommendNature`

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

### RogueAeonDisplay.json (0.01 MB, 14 条)

**字段** (8): `DisplayID, RogueAeonName, RogueAeonPathName, RogueAeonPathName2, AeonBuffIcon, AeonImage, AeonIcon, AeonFigure`

**首条记录摘要**:
```json
{
  "DisplayID": 1,
  "RogueAeonName": {
    "Hash": 17724893610956674447
  },
  "RogueAeonPathName": {
    "Hash": 9572907484878915248
  },
  "RogueAeonPathName2": {
    "Hash": 4069822649330089345
  },
  "AeonBuffIcon": "SpriteOutput/HoshinoKami/HoshinoKami_001...",
  "AeonImage": "SpriteOutput/HoshinoKami/HoshinoKami_001...",
  "AeonIcon": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "AeonFigure": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### AtlasUnlockData.json (0.01 MB, 46 条)

**字段** (3): `UnlockID, Conditions, ShowCondition`

**首条记录摘要**:
```json
{
  "UnlockID": 70001,
  "Conditions": "[{\"Type\": \"FinishMainMission\", \"Param\": ...",
  "ShowCondition": []
}
```

### LoadingStratageConfig.json (0.01 MB, 29 条)

**字段** (6): `LoadingID, StratageType, FloorOperation, MissionIDList, AvailableEntranceIDList, Priority`

**首条记录摘要**:
```json
{
  "LoadingID": 2,
  "StratageType": "Plain",
  "FloorOperation": [],
  "MissionIDList": [
    103010104
  ],
  "AvailableEntranceIDList": [
    43301001
  ],
  "Priority": 10
}
```

### SwordTrainingStory.json (0.01 MB, 21 条)

**字段** (8): `StoryID, StoryType, MissionID, RepeatPerformanceID, StoryImage, StoryTitle, StoryDesc, EffectIDList`

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

### GridFightConstValueCommonV2.json (0.01 MB, 27 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "GridFight_CardWeight_Lv1",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 100}, {\"Int..."
}
```

### MusicRhythmGroup.json (0.01 MB, 9 条)

**字段** (19): `ID, Phase, Index, UnlockSubMissionID, TakeMissionID, RewardTrackIDList, GroupName, GroupDesc, MapName, GroupCoverImgPath, BGMpath, GotoID, EntranceID, MapInfoID, EntityGroup, EntityGroupMission, InputTimeList, LongInputTimeList, LongInputUpTimeList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Phase": 1,
  "Index": 2,
  "UnlockSubMissionID": 802611006,
  "TakeMissionID": 8026111,
  "RewardTrackIDList": [
    12
  ],
  "GroupName": {
    "Hash": 18430391953031884090
  },
  "GroupDesc": {
    "Hash": 3844862223923266400
  },
  "MapName": {
    "Hash": 16983587579647765436
  },
  "GroupCoverImgPath": "SpriteOutput/Quest/MusicRhythm/MRChooseC...",
  "BGMpath": "State_Menu_Season_Rhythm_Peppy_Tutorial",
  "GotoID": 32003,
  "EntranceID": 1030614,
  "MapInfoID": 2444,
  "EntityGroup": 159,
  "EntityGroupMission": 156,
  "InputTimeList": [
    0.08,
    0.17,
    0.25
  ],
  "LongInputTimeList": [
    0.08,
    0.17,
    0.25
  ],
  "LongInputUpTimeList": [
    0.08,
    0.17,
    0.25
  ]
}
```

### FantasticStoryBattleID.json (0.01 MB, 6 条)

**字段** (24): `BattleID, FigurePath, Name, QuestList, TurnLimit, TextJoinIDList, TextJoinIDListChange, FinishQuest, UnlockChapterID, EnvironmentBuffID, RecommendNature, RecommendAvatar, DisplayMonsterList, SpecialAvatarIDList, ActivityModuleID, EventID, AvailableBuffSlotID, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID, BookTitle, BookContext, BookContextChange`

**首条记录摘要**:
```json
{
  "BattleID": 1,
  "FigurePath": "SpriteOutput/UI/Quest/FantasticStory/Fan...",
  "Name": {
    "Hash": 8431233699063807453
  },
  "QuestList": [
    6000339,
    6000340,
    6000341,
    6000342
  ],
  "TurnLimit": 4,
  "TextJoinIDList": [
    55,
    56,
    57,
    58
  ],
  "TextJoinIDListChange": [
    83,
    84,
    85,
    86
  ],
  "FinishQuest": 6000363,
  "UnlockChapterID": 1,
  "EnvironmentBuffID": 3102003,
  "RecommendNature": [],
  "RecommendAvatar": [
    1003,
    1013
  ],
  "DisplayMonsterList": "[800205001, 100204020, 100205016, 800101...",
  "SpecialAvatarIDList": [
    3061003,
    3061013
  ],
  "ActivityModuleID": 4000208,
  "EventID": 308001,
  "AvailableBuffSlotID": [
    1,
    2
  ],
  "PlaneID": 20211,
  "FloorID": 20211001,
  "BattleAreaGroupID": 1,
  "BattleAreaID": 1,
  "BookTitle": {
    "Hash": 2868211527394541879
  },
  "BookContext": {
    "Hash": 1349076569644049069
  },
  "BookContextChange": {
    "Hash": 14295422440807266998
  }
}
```

### RogueMagicDifficultyDrop.json (0.01 MB, 91 条)

**字段** (1): `AreaID`

**首条记录摘要**:
```json
{
  "AreaID": 101
}
```

### MonopolyQuizPlayerConfig.json (0.01 MB, 47 条)

**字段** (3): `QuizPlayerID, Name, IconPath`

**首条记录摘要**:
```json
{
  "QuizPlayerID": 1001,
  "Name": {
    "Hash": 10801972946609024961
  },
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1001..."
}
```

### PlayerLevelConfig.json (0.01 MB, 70 条)

**字段** (2): `Level, StaminaLimit`

**首条记录摘要**:
```json
{
  "Level": 1,
  "StaminaLimit": 300
}
```

### RogueDLCBlockIntro.json (0.01 MB, 20 条)

**字段** (8): `BlockIntroID, BlockIntroName, BlockIntroDesc, BlockIntroIcon, BlockTypeChessBoardColor, Sort, IntroGroup, SubType`

**首条记录摘要**:
```json
{
  "BlockIntroID": 1,
  "BlockIntroName": {
    "Hash": 2777052956254022747
  },
  "BlockIntroDesc": {
    "Hash": 15791535522217967416
  },
  "BlockIntroIcon": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "BlockTypeChessBoardColor": "#ffffffd9",
  "Sort": 1,
  "IntroGroup": 1,
  "SubType": []
}
```

### GridFightBonusRule.json (0.01 MB, 114 条)

**字段** (2): `ID, ProgressBonusList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ProgressBonusList": [
    1
  ]
}
```

### RestaurantConstValueCommon.json (0.01 MB, 43 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Elf_Restaurant_Coin_Item_ID",
  "Value": {
    "IntValue": 260000
  }
}
```

### ExpeditionHarvestData.json (0.01 MB, 23 条)

**字段** (7): `ExpeditionID, RewardID, UnlockCondition, Name, IconPath, Group, Order`

**首条记录摘要**:
```json
{
  "ExpeditionID": 1001,
  "RewardID": 115601,
  "UnlockCondition": "[{\"Type\": \"FinishMainMission\", \"Param\": ...",
  "Name": {
    "Hash": 14909458032570007003
  },
  "IconPath": "SpriteOutput/ItemIcon/111001.png",
  "Group": 1,
  "Order": 1
}
```

### RogueMagicRoomMark.json (0.01 MB, 18 条)

**字段** (5): `RoomType, RoomTypeName, RoomIconEffect, RoomTypeIcon, ToastIcon`

**首条记录摘要**:
```json
{
  "RoomType": "Boss",
  "RoomTypeName": {
    "Hash": 6552530398095788910
  },
  "RoomIconEffect": "Stages/OriginalResPos/InteractiveProp/Ro...",
  "RoomTypeIcon": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "ToastIcon": "SpriteOutput/Rogue/Map/RogueBossIcon.png"
}
```

### BattleCollegeConfig.json (0.01 MB, 13 条)

**字段** (16): `ID, StageID, TutorialTypeGroupID, TrialAvatarList, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID, StageIntroTitle, StageIntroDescIDList, VideoCoverPath, VideoAssetID, AimList, RewardID, TutorialID, SortID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageID": 400101,
  "TutorialTypeGroupID": 1,
  "TrialAvatarList": [
    3080000,
    3080001,
    3080002,
    3080003
  ],
  "PlaneID": 30501,
  "FloorID": 30501001,
  "BattleAreaGroupID": 2,
  "BattleAreaID": 1,
  "StageIntroTitle": {
    "Hash": 13154354815515415153
  },
  "StageIntroDescIDList": 101,
  "VideoCoverPath": "SpriteOutput/Teach/TeachBattleCollege1.p...",
  "VideoAssetID": 1001,
  "AimList": [
    400101
  ],
  "RewardID": 140011,
  "TutorialID": 7501,
  "SortID": 1
}
```

### PlayerOutfitDetail.json (0.01 MB, 44 条)

**字段** (3): `OutfitID, TargetGenderType, JsonPath`

**首条记录摘要**:
```json
{
  "OutfitID": 1000,
  "TargetGenderType": "TARGET_GENDER_MAN",
  "JsonPath": "Config/ConfigPlayerOutfit/PlayerBoy_Char..."
}
```

### RogueTalkNameColor.json (0.01 MB, 77 条)

**字段** (2): `TextmapID, Color`

**首条记录摘要**:
```json
{
  "TextmapID": {
    "Hash": 14629195021455409417
  },
  "Color": "Pink"
}
```

### SpaceZooSpecialCat.json (0.01 MB, 10 条)

**字段** (10): `SpecialCatID, ImagePath, LargeImagePath, MatPath, MatchedChannelFeature, Name, SpecialItem, TipsCustomizedCat, ResearchPointSSR, ColorBar`

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

**字段** (6): `ID, SentenceTextmapID, SentenceName, ProgressDesc, ProgressEnd, FadeInTime`

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

### RewardDataLD.json (0.01 MB, 79 条)

**字段** (3): `RewardID, ItemID_1, Count_1`

**首条记录摘要**:
```json
{
  "RewardID": 8020001,
  "ItemID_1": 268001,
  "Count_1": 1
}
```

### BattleActionEventConfig.json (0.01 MB, 11 条)

**字段** (10): `EventID, ActiveDefault, EventName, FullDescription, BriefDescription, IconPath, InitialInterval, Interval, AbilityName, ParamList`

**首条记录摘要**:
```json
{
  "EventID": 10001,
  "ActiveDefault": true,
  "EventName": {
    "Hash": 5951919654712765325
  },
  "FullDescription": {
    "Hash": 8197088555739211918
  },
  "BriefDescription": {
    "Hash": 5328383168028266304
  },
  "IconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffAt...",
  "InitialInterval": 3,
  "Interval": 5,
  "AbilityName": "Heliobus_Action_Ability",
  "ParamList": "[{\"Value\": 61001}, {\"Value\": 2}, {\"Value..."
}
```

### IdleLiveAmphoreusCard.json (0.01 MB, 15 条)

**字段** (9): `ID, Name, Desc, AbilityName, Param, CardFigure, MiniIcon, TriggerChapter, TriggerNode`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 6885756913808832774
  },
  "Desc": {
    "Hash": 75329348010146883
  },
  "AbilityName": "RtBattle_Story_Aglaea",
  "Param": [
    {
      "Value": 1
    }
  ],
  "CardFigure": "SpriteOutput/UI/Avatar/Special/Special_1...",
  "MiniIcon": "SpriteOutput/UI/Avatar/Special/Special_1...",
  "TriggerChapter": 7,
  "TriggerNode": 1
}
```

### GridFightTalent.json (0.01 MB, 13 条)

**字段** (11): `ID, NextTalentIDList, PreTalentIDList, Cost, IconPath, JsonPath, EffectParamList, IsOCEffective, EffectTag, EffectTitle, EffectDesc`

**首条记录摘要**:
```json
{
  "ID": 1011,
  "NextTalentIDList": [],
  "PreTalentIDList": [],
  "Cost": 20,
  "IconPath": "SpriteOutput/GridFight/AttributeIcon/Whi...",
  "JsonPath": "Config/Level/GridFight/Talent/GridFightT...",
  "EffectParamList": [],
  "IsOCEffective": 1,
  "EffectTag": {
    "Hash": 13879380692996673792
  },
  "EffectTitle": {
    "Hash": 17117565562455911775
  },
  "EffectDesc": {
    "Hash": 1539424656315782912
  }
}
```

### ActivityItemConfigAvatar.json (0.01 MB, 12 条)

**字段** (14): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

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

### ChimeraArrangementPreset.json (0.01 MB, 40 条)

**字段** (3): `PresetID, Description, CommonChimeras`

**首条记录摘要**:
```json
{
  "PresetID": 601,
  "Description": {
    "Hash": 12565023480074133121
  },
  "CommonChimeras": [
    111,
    110,
    0,
    0,
    0
  ]
}
```

### ActivityDiceGlossary.json (0.01 MB, 28 条)

**字段** (4): `PHFMCACHFIJ, OLOIFNNLKJP, OENAMINOLLF, NMAHGFAPENI`

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

### ChenLingFesLevelConfig.json (0.01 MB, 5 条)

**字段** (15): `ID, LevelName, LevelAbilityParamList, TotalWeek, WeekStarCount, RequiredScoreList, ItemRuleGroupID, VisitorRuleGroupID, LevelDayDuration, InitItemNumList, LevelAbilityGap, LevelAbilityList, VisitorTimeInterval, AwardListID, UnlockSubMission`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LevelName": "ChenLingFesLevelConfig_LevelName_1",
  "LevelAbilityParamList": [],
  "TotalWeek": 3,
  "WeekStarCount": 3,
  "RequiredScoreList": "[350, 700, 1050, 2100, 4200, 6300, 7000,...",
  "ItemRuleGroupID": "[111, 112, 113, 114, 121, 122, 123, 124,...",
  "VisitorRuleGroupID": "[10001, 10001, 10001, 10001, 10001, 1000...",
  "LevelDayDuration": [
    2,
    3,
    4
  ],
  "InitItemNumList": [
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2
  ],
  "LevelAbilityGap": 1,
  "LevelAbilityList": [],
  "VisitorTimeInterval": [
    2,
    2,
    2
  ],
  "AwardListID": [
    111,
    112,
    113,
    121,
    122,
    123
  ],
  "UnlockSubMission": 804320301
}
```

### ChimeraWorkRound.json (0.01 MB, 18 条)

**字段** (7): `RoundID, WorkList, NewChimeraList, OptionList, ArrangeHintImage, RecommendedArrangementPresets, DisplayTeamID`

**首条记录摘要**:
```json
{
  "RoundID": 1,
  "WorkList": [
    501,
    502,
    503
  ],
  "NewChimeraList": [],
  "OptionList": [
    1
  ],
  "ArrangeHintImage": "",
  "RecommendedArrangementPresets": [],
  "DisplayTeamID": 7
}
```

### CakeRaceNPC.json (0.01 MB, 14 条)

**字段** (6): `NPCID, NPCName, NPCIcon, NPCAIJsonPath, EmojiIDList, MessageIDList`

**首条记录摘要**:
```json
{
  "NPCID": 1,
  "NPCName": {
    "Hash": 15750839207814313644
  },
  "NPCIcon": "SpriteOutput/AvatarRoundIcon/Avatar/1013...",
  "NPCAIJsonPath": "Config/Gameplays/LittleGame/CakeRace/AI/...",
  "EmojiIDList": [
    2011
  ],
  "MessageIDList": "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, ..."
}
```

### TarotWikiChangeinfo.json (0.01 MB, 39 条)

**字段** (4): `ChangeID, UnlockID, NewTitle, NewDetails`

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

### AreaMapConfig.json (0.01 MB, 44 条)

**字段** (5): `ID, Name, Desc, MenuSortID, MenuIconID`

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

### DrinkMakerTagCombination.json (0.01 MB, 36 条)

**字段** (6): `TagCombinationID, TagRequestDesc, IncludeTags, ExcludeTags, HintStr, HintIconType`

**首条记录摘要**:
```json
{
  "TagCombinationID": 1,
  "TagRequestDesc": {
    "Hash": 2327008378847104576
  },
  "IncludeTags": [
    1
  ],
  "ExcludeTags": [],
  "HintStr": "≤-2",
  "HintIconType": "Sweetness"
}
```

### TutorialResConfig.json (0.01 MB, 42 条)

**字段** (5): `ID, PrefabPath, TextPath, KeyMapPath, ContentPath`

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

### PsActivity.json (0.01 MB, 17 条)

**字段** (5): `ActivityID, ObjectIDList, name, description, task`

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

### ClockParkBuff.json (0.01 MB, 42 条)

**字段** (5): `BuffID, BuffType, Param1, Times, BuffDesc`

**首条记录摘要**:
```json
{
  "BuffID": 4,
  "BuffType": "ThirdAttributeGainRate",
  "Param1": 2,
  "Times": 1,
  "BuffDesc": {
    "Hash": 16251790224416226698
  }
}
```

### SwordTrainingPowerRank.json (0.01 MB, 19 条)

**字段** (5): `RankID, RankGroupID, RankSubName, RankGroupName, RankIcon`

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

### FightFestPaper.json (0.01 MB, 6 条)

**字段** (13): `PaperID, UnlockSubMissionID, IssueNumber, IssueNumberText, MainPageTitle, MainPageDesc, MainFgPathList, MainBgPathList, InterviewFgPath, InterviewBgPath, CollectionFgPath, CollectionBgPath, GameAdFigurePath`

**首条记录摘要**:
```json
{
  "PaperID": 1,
  "UnlockSubMissionID": 802511105,
  "IssueNumber": {
    "Hash": 3524473669863980862
  },
  "IssueNumberText": {
    "Hash": 14084507130855055464
  },
  "MainPageTitle": {
    "Hash": 16038944407343565826
  },
  "MainPageDesc": {
    "Hash": 8660796981155528944
  },
  "MainFgPathList": "[\"SpriteOutput/Quest/FightFest/News/Figh...",
  "MainBgPathList": "[\"SpriteOutput/Quest/FightFest/News/Figh...",
  "InterviewFgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "InterviewBgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "CollectionFgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "CollectionBgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "GameAdFigurePath": "SpriteOutput/Quest/FightFest/News/FightF..."
}
```

### ActivityFightConfig.json (0.01 MB, 33 条)

**字段** (7): `ActivityFightGroupID, DifficultyLevel, FightEventID, RewardID, RewardWave, RoundsLimit, OffsetLevel`

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

**字段** (6): `TalkID, TalkTypeParam, TalkPriority, TalkWeight, TextIDList, CustomString`

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

### ChallengeBossMazeExtra.json (0.01 MB, 80 条)

**字段** (3): `ID, MonsterID1, MonsterID2`

**首条记录摘要**:
```json
{
  "ID": 30011,
  "MonsterID1": 100401401,
  "MonsterID2": 302401301
}
```

### TeamTowersBubble.json (0.01 MB, 56 条)

**字段** (3): `PHFMCACHFIJ, IEHPFADHJFD, AABNPBGMOFN`

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

### MapDefaultEntrance.json (0.01 MB, 111 条)

**字段** (2): `FloorID, EntranceID`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "EntranceID": 1000001
}
```

### IdleLiveChapter.json (0.01 MB, 20 条)

**字段** (9): `ChapterIndex, Name, BackgroundState, IconPath, FinalAct, FinalActChatPhase, BossID, Number, FSVList`

**首条记录摘要**:
```json
{
  "ChapterIndex": 1,
  "Name": {
    "Hash": 6954964983266676189
  },
  "BackgroundState": "World0",
  "IconPath": "SpriteOutput/Quest/IdleLive/World/IdleLi...",
  "FinalAct": 804210501,
  "FinalActChatPhase": 101,
  "BossID": 1,
  "Number": {
    "Hash": 18398436844442730630
  },
  "FSVList": []
}
```

### IdleLiveAvatarProperty.json (0.01 MB, 16 条)

**字段** (9): `PropertyType, PropertyName, CaptainPowerFactor, FrontPowerFactor, BackgroundPowerFactor, SupportPowerFactor, Order, IsDisplay, IconPath`

**首条记录摘要**:
```json
{
  "PropertyType": "BaseHP",
  "PropertyName": {
    "Hash": 9827125162713422139
  },
  "CaptainPowerFactor": {
    "Value": 0.0009999999
  },
  "FrontPowerFactor": {
    "Value": 0.0009999999
  },
  "BackgroundPowerFactor": {
    "Value": 0.0009999999
  },
  "SupportPowerFactor": {
    "Value": 0.0009999999
  },
  "Order": 1,
  "IsDisplay": true,
  "IconPath": "SpriteOutput/UI/Avatar/Icon/IconMaxHP.pn..."
}
```

### ChimeraConstClient.json (0.01 MB, 32 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Chimera_PlayerTeam_Icon",
  "Value": "{\"StringValue\": \"SpriteOutput/AvatarRoun..."
}
```

### TrainPartyPassengerConfig.json (0.01 MB, 9 条)

**字段** (11): `PassengerID, DiaryOrder, Name, IconPath, AvatarRoundIconPath, AvatarRoundIconBgPath, MiniIconPath, MeetingIconPath, AvatarCardPrefabPath, PassengerQuest, UnlcokDesc`

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

### PerformanceA.json (0.01 MB, 28 条)

**字段** (7): `PerformanceID, PerformancePath, IsSkip, StartBlack, EndWithCrack, PlaneID, FloorID`

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

### MarblePVPRank.json (0.01 MB, 10 条)

**字段** (11): `ID, Rank, GameMode, Name, ScoreArea, LevelPool, SmallIconPath, IconPath, BigIconPath, TimeOutAIRank, LoseAIRank`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Rank": 1,
  "GameMode": "MARBLE",
  "Name": {
    "Hash": 6643235076550301340
  },
  "ScoreArea": [
    0,
    500
  ],
  "LevelPool": "[100, 101, 102, 103, 104, 105, 106, 107,...",
  "SmallIconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "IconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "BigIconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "TimeOutAIRank": 3,
  "LoseAIRank": 1
}
```

### FightFestAvatarInfo.json (0.01 MB, 15 条)

**字段** (7): `AvatarID, AvatarName, FullFigurePath, FigureOffset, HalfFigurePath, IconPath, VSImgPath`

**首条记录摘要**:
```json
{
  "AvatarID": 1,
  "AvatarName": {
    "Hash": 6460027324771770162
  },
  "FullFigurePath": "SpriteOutput/Quest/FightFest/Avatar/Chal...",
  "FigureOffset": [
    0,
    0
  ],
  "HalfFigurePath": "",
  "IconPath": "SpriteOutput/Quest/FightFest/Avatar/Head...",
  "VSImgPath": ""
}
```

### ElationBattleLevel.json (0.01 MB, 7 条)

**字段** (18): `ID, StageName, ImagePath, EventID, ModifiedAvatarIDList, NewModifiedAvatarID, LevelDes_Out, LevelDes_In, LevelDes_In_Down, AvailableAvatarList, MonsterList, SpecialAvatarList, UIEnterBattleAreaID, TutorialGuideGroupID, GiftBoxLevel, BattleTargetList, PerfectWave, UnlockCondition`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageName": {
    "Hash": 13953478671382162234
  },
  "ImagePath": "SpriteOutput/Quest/ActivityElationBattle...",
  "EventID": 427001,
  "ModifiedAvatarIDList": [
    1
  ],
  "NewModifiedAvatarID": 1,
  "LevelDes_Out": {
    "Hash": 658453885908045419
  },
  "LevelDes_In": {
    "Hash": 1055330194028712910
  },
  "LevelDes_In_Down": {
    "Hash": 15809135432646532087
  },
  "AvailableAvatarList": [],
  "MonsterList": [
    2024010,
    1003010
  ],
  "SpecialAvatarList": [
    3231403,
    3231015,
    3321217
  ],
  "UIEnterBattleAreaID": 2032101,
  "TutorialGuideGroupID": 10012,
  "GiftBoxLevel": [
    10
  ],
  "BattleTargetList": [
    5001911,
    5001912,
    5001913
  ],
  "PerfectWave": 3,
  "UnlockCondition": {
    "Type": "PlayerLevel",
    "Param": "21"
  }
}
```

### RogueDLCAeon.json (0.01 MB, 8 条)

**字段** (19): `AeonID, Sort, PlayShortDesc, RogueAeonDisplayID, AeonDiceID, EffectDesc3, DescParam, RogueBuffType, BattleEventBuffGroup, BattleEventEnhanceBuffGroup, EffectType1, EffectParam1, EffectParam2, EffectType3, EffectParam3, EffectParam4, EntrancePrefabPath, UnlockID, ExtraEffect`

**首条记录摘要**:
```json
{
  "AeonID": 1,
  "Sort": 1,
  "PlayShortDesc": {
    "Hash": 2698926103862767780
  },
  "RogueAeonDisplayID": 1,
  "AeonDiceID": 1,
  "EffectDesc3": {
    "Hash": 16936054459392242721
  },
  "DescParam": "[{\"Value\": 2}, {\"Value\": 0.04}, {\"Value\"...",
  "RogueBuffType": 120,
  "BattleEventBuffGroup": 12004,
  "BattleEventEnhanceBuffGroup": 12005,
  "EffectType1": "AddMazeBuff",
  "EffectParam1": [
    641200
  ],
  "EffectParam2": [
    0
  ],
  "EffectType3": "ProtectCellNoCollapse",
  "EffectParam3": [
    0,
    2
  ],
  "EffectParam4": [
    200620,
    3,
    10003
  ],
  "EntrancePrefabPath": "UI/Rogue/DLC/Dice/Widget/BtnGenreDice1.p...",
  "UnlockID": 1000018,
  "ExtraEffect": [
    61000002,
    61000018,
    61000019
  ]
}
```

### ActivityDiceEffect.json (0.01 MB, 16 条)

**字段** (9): `NIDFIGFJJLL, BDACPPLKLGL, KOIJMGCHFII, CGANPPICDAM, HAEBLLPPDHO, HPLKADFDFAI, KIPAGNCANAJ, BBDAFOAINPD, CLCFMLOGBAN`

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

### MarbleMatchInfo.json (0.01 MB, 14 条)

**字段** (9): `ID, LevelID, Reward, PlayerID, AIRank, FirstType, BanSealList, ANpcIds, BNpcIds`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LevelID": 1,
  "Reward": 8010003,
  "PlayerID": 99,
  "AIRank": 1,
  "FirstType": 1,
  "BanSealList": [],
  "ANpcIds": [],
  "BNpcIds": []
}
```

### RogueScoreReward.json (0.01 MB, 70 条)

**字段** (4): `RewardPoolID, ScoreRow, Score, Reward`

**首条记录摘要**:
```json
{
  "RewardPoolID": 20,
  "ScoreRow": 1,
  "Score": 350,
  "Reward": 108001
}
```

### SpaceZooInteraction.json (0.01 MB, 27 条)

**字段** (6): `ID, RoomID, Priority, Case, Param, PerformanceID`

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

### RogueMagicNPC.json (0.01 MB, 55 条)

**字段** (2): `RogueNPCID, NPCJsonPath`

**首条记录摘要**:
```json
{
  "RogueNPCID": 510001,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC_260..."
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

### ActivityFeverTimeConfig.json (0.01 MB, 6 条)

**字段** (18): `FeverTimeID, ActivityModuleID, EventID, P1AvailableBuffList, P2AvailableBuffList, P3MazeBuffID, SpecialAvatarList, ImagePath, StageName, LevelDes1, MonsterList, WaveMonsterList_1, WaveMonsterList_2, WaveMonsterList_3, QuestGroupID, RecommadNature, UIEnterBattleAreaID, TutorialGuideGroupID`

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
  "SpecialAvatarList": "[3021308, 3021307, 3041005, 3021301, 302...",
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
  "WaveMonsterList_1": "[801301018, 800205044, 801201028, 201201...",
  "WaveMonsterList_2": "[300301001, 800205044, 300203005, 300101...",
  "WaveMonsterList_3": "[302402002, 800205044, 300204001, 300203...",
  "QuestGroupID": 3,
  "RecommadNature": [
    "Thunder",
    "Wind"
  ],
  "UIEnterBattleAreaID": 2000301,
  "TutorialGuideGroupID": 8093
}
```

### RestaurantEmployeeUpConfig.json (0.01 MB, 50 条)

**字段** (3): `EmployeeID, Level, AbilityIDList`

**首条记录摘要**:
```json
{
  "EmployeeID": 101,
  "Level": 1,
  "AbilityIDList": [
    101
  ]
}
```

### PlanetFesAssistantMessage.json (0.01 MB, 25 条)

**字段** (8): `ID, AssistantMessageType, TypePara, Description, Delay, Interval, Priority, UnlockPlanetFesLevel`

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

### ItemHintSpecial.json (0.01 MB, 115 条)

**字段** (2): `PHFMCACHFIJ, BLPAFDKHEPJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 33,
  "BLPAFDKHEPJ": true
}
```

### DrinkMakerCheersConfig.json (0.01 MB, 10 条)

**字段** (10): `ID, Mode, ParamList, AvatarRequestText, OriginalName, FunctionName, TagName, DrinkIconPath, CommentList, DrinkIconPrefab`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Mode": "ByTags",
  "ParamList": [
    999,
    994,
    997,
    996,
    998
  ],
  "AvatarRequestText": {
    "Hash": 1217797090721282942
  },
  "OriginalName": {
    "Hash": 9867279123797572997
  },
  "FunctionName": {
    "Hash": 14567053272565911387
  },
  "TagName": {
    "Hash": 16301598439999804159
  },
  "DrinkIconPath": "",
  "CommentList": [],
  "DrinkIconPrefab": ""
}
```

### BattlePassQuest.json (0.01 MB, 129 条)

**字段** (2): `ID, ShowTime`

**首条记录摘要**:
```json
{
  "ID": 2000204,
  "ShowTime": true
}
```

### GridFightTraitBonus.json (0.01 MB, 32 条)

**字段** (5): `ID, BonusThreshold, BonusType, TraitBonusParamList, BonusParamList`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "BonusThreshold": 6,
  "BonusType": "Bonus",
  "TraitBonusParamList": [
    {
      "Value": 23031
    }
  ],
  "BonusParamList": [
    23031
  ]
}
```

### PreAvatarLevelingTemplate.json (0.01 MB, 18 条)

**字段** (7): `TemplateID, WorldLevel, BossMaterialAmount, SkillMaterialSmallAmount, WorldMaterialSmallAmount, CoinAmount, ExpAmount`

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

### RogueEndlessConstValue.json (0.01 MB, 32 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueEndless_ActivityModuleID",
  "Value": {
    "IntValue": 6000601
  }
}
```

### FightFestScoreRace.json (0.01 MB, 8 条)

**字段** (18): `ScoreRaceID, PhaseID, ScoreRaceType, SortWeight, EventIDList, EventID, TakeMainMissionID, RewardScore, RewardID, TutorialID, BlueAvatarID, RedAvatarID, RaceDesc, StageName, RaceBgFigurePath, DetailImgPath, ResultImgPath, TutorialImgPath`

**首条记录摘要**:
```json
{
  "ScoreRaceID": 2002,
  "PhaseID": 203,
  "ScoreRaceType": "Score",
  "SortWeight": 6,
  "EventIDList": [
    419101
  ],
  "EventID": 419101,
  "TakeMainMissionID": 8025132,
  "RewardScore": 300,
  "RewardID": 251001,
  "TutorialID": 8188,
  "BlueAvatarID": 1,
  "RedAvatarID": 8,
  "RaceDesc": {
    "Hash": 7175092518073377653
  },
  "StageName": {
    "Hash": 5082273589609039221
  },
  "RaceBgFigurePath": "SpriteOutput/UI/Quest/AetherDivide/ADIco...",
  "DetailImgPath": "SpriteOutput/Quest/FightFest/Monster/Fig...",
  "ResultImgPath": "SpriteOutput/Quest/FightFest/Monster/Mid...",
  "TutorialImgPath": "SpriteOutput/Quest/FightFest/Monster/Hea..."
}
```

### WorldDataConfig.json (0.01 MB, 8 条)

**字段** (12): `ID, WorldName, WorldLanguageName, MapSpaceTypeList, ChapterIconBigPath, ChronicleWorldBgPath, ChronicleWorldSubBgPath, ChronicleWorldPredictPath, ChronicleWorldProcessingPath, CameraWidth, CameraHeight, SmallWorldIconPath`

**首条记录摘要**:
```json
{
  "ID": 100,
  "WorldName": {
    "Hash": 6725144922804506895
  },
  "WorldLanguageName": {
    "Hash": 4974142298582977146
  },
  "MapSpaceTypeList": [
    "Unknow"
  ],
  "ChapterIconBigPath": "SpriteOutput/Mission/ChapterIconBig/Chap...",
  "ChronicleWorldBgPath": "",
  "ChronicleWorldSubBgPath": "",
  "ChronicleWorldPredictPath": "",
  "ChronicleWorldProcessingPath": "",
  "CameraWidth": 30,
  "CameraHeight": 33,
  "SmallWorldIconPath": ""
}
```

### GridFightSubTraitBasicInfo.json (0.01 MB, 16 条)

**字段** (8): `ID, FatherTraitID, SubTraitName, TraitEffectList, TraitBaseDesc, TraitBaseSimpleDesc, BaseDescParamList, TraitSearchKey`

**首条记录摘要**:
```json
{
  "ID": 2501,
  "FatherTraitID": 1010,
  "SubTraitName": {
    "Hash": 1923860435107655659
  },
  "TraitEffectList": [],
  "TraitBaseDesc": {
    "Hash": 1375034122455326284
  },
  "TraitBaseSimpleDesc": {
    "Hash": 2100990914266137899
  },
  "BaseDescParamList": [],
  "TraitSearchKey": "Origin_2501"
}
```

### PlanetFesLevel.json (0.01 MB, 10 条)

**字段** (8): `Level, BasicBuffIDList, BuffIDList, CostNum, GrantItemList, GrantGold, Description, NewTipsList`

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

### ActivityBannerComMission.json (0.01 MB, 12 条)

**字段** (11): `BannerID, AvatarIDList, SortID, MainMissionIDList, UnlockMissionList, Title, SubTitle, ShortDesc, MainImagePath, SubImagePath, ActivityModuleID`

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

### DialogueIcon.json (0.01 MB, 48 条)

**字段** (2): `Type, IconPath`

**首条记录摘要**:
```json
{
  "Type": {
    "EnumIndex": 20,
    "Value": 0
  },
  "IconPath": "SpriteOutput/TalkIcon/ChatMissionIcon.pn..."
}
```

### RogueTournHexAvatarBaseType.json (0.01 MB, 57 条)

**字段** (3): `MiracleID, AvatarDamageType, AvatarType`

**首条记录摘要**:
```json
{
  "MiracleID": 6501,
  "AvatarDamageType": [],
  "AvatarType": [
    "Priest"
  ]
}
```

### BattleEventDataLD.json (0.01 MB, 21 条)

**字段** (8): `BattleEventID, Config, Prefab, LevelAreaPrefab, BEActionBarPrefab, BasePoint, SkillIDList, IsSPReserved`

**首条记录摘要**:
```json
{
  "BattleEventID": 100000,
  "Config": "Config/ConfigCharacter/BattleEvent/Avata...",
  "Prefab": "",
  "LevelAreaPrefab": "",
  "BEActionBarPrefab": "",
  "BasePoint": "",
  "SkillIDList": [],
  "IsSPReserved": true
}
```

### RogueDLCAeonDice.json (0.01 MB, 8 条)

**字段** (12): `AeonDiceID, DiceShortDesc, DescParam, DiceIcon, DiceModel, DiceStartEffectDesc, StartDescParam, ExtraEffect, SoundRoll, SoundReRoll, SoundSuspensionStart, SoundSuspensionStop`

**首条记录摘要**:
```json
{
  "AeonDiceID": 1,
  "DiceShortDesc": {
    "Hash": 14765377648846133200
  },
  "DescParam": [
    {
      "Value": 0.04
    },
    {
      "Value": 1
    }
  ],
  "DiceIcon": "SpriteOutput/UI/Rogue/DLC/Dice/DiceIcon/...",
  "DiceModel": "Effects/Eff_Prefab/Eff_Scene/Interactive...",
  "DiceStartEffectDesc": {
    "Hash": 16813505302278884996
  },
  "StartDescParam": [
    2
  ],
  "ExtraEffect": [
    61000002,
    61000018,
    61000019
  ],
  "SoundRoll": "Ev_sfx_rogue_dice_spawn_preservation",
  "SoundReRoll": "Ev_sfx_rogue_dice_reroll_preservation",
  "SoundSuspensionStart": "Ev_sfx_rogue_dice_idle_preservation",
  "SoundSuspensionStop": "Ev_sfx_rogue_dice_idle_preservation_stop"
}
```

### ActivityRogueAreaConfig.json (0.01 MB, 5 条)

**字段** (26): `AreaID, ActivityModuleID, StageID, QuestIDList, TargetParamList, EventID, AreaEffectIDList, Describe, FigurePath, FigurePath2, MazeBuffIDList, MiracleEffectIDList, DisplayMapID, DisplayMonster, DisplayMonster2, GamePlay_1, ParamList_1, GamePlay_2, ParamList_2, GamePlay_3, ParamList_3, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID, Endless_GamePlay`

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
  "DisplayMonster": "{\"1013020\": 3, \"1023010\": 3, \"8013010\": ...",
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

### SwordTrainingExam.json (0.01 MB, 12 条)

**字段** (11): `ExamID, PrePerformID, StageID, BattleAreaID, SuccessPerformID, FailPerformID, EnemyPower, EnemyImage, EnemyName, ExcellentCommentList, NormalCommentList`

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

**字段** (29): `SkillID, SkillName, SkillTag, SkillTypeDesc, Level, MaxLevel, SkillTriggerKey, SkillIcon, UltraSkillIcon, LevelUpCostList, SkillDesc, RatedSkillTreeID, RatedRankID, ExtraEffectIDList, SimpleExtraEffectIDList, ShowStanceList, ShowDamageList, ShowHealList, InitCoolDown, CoolDown, StanceDamageDisplay, SPMultipleRatio, BPNeed, DelayRatio, ParamList, SimpleParamList, StanceDamageType, AttackType, SkillEffect`

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
  "ShowStanceList": "[{\"Value\": 30}, {\"Value\": 0}, {\"Value\": ...",
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

### RogueTournExpScore_Index_ScoreExpID.json (0.01 MB, 11 条)

**字段** (2): `OEJJLDOAICN, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "OEJJLDOAICN": 1,
  "MGNHKOHFLPO": "[{\"PHFMCACHFIJ\": 11001}, {\"PHFMCACHFIJ\":..."
}
```

### MazeFloorConnectivity.json (0.01 MB, 49 条)

**字段** (4): `FromFloorID, ToFloorID, WayPointGroupID, WayPointEntityID`

**首条记录摘要**:
```json
{
  "FromFloorID": 10000000,
  "ToFloorID": 10000002,
  "WayPointGroupID": 7,
  "WayPointEntityID": 300001
}
```

### ClockParkScriptConfig.json (0.01 MB, 6 条)

**字段** (15): `ActivityStudioScriptID, ActivityModuleID, ScriptType, ScriptUnlockCondition, ScriptUnlockCost, StartChapterID, TalentCanBeUsed, ScriptTitle, ScriptDesc, ImgPath, PrefabPath, IconPath, ScriptBGM, ScriptPostPrefabPath, ScriptResultLogoMaskPath`

**首条记录摘要**:
```json
{
  "ActivityStudioScriptID": 1,
  "ActivityModuleID": 5001202,
  "ScriptType": "Normal",
  "ScriptUnlockCondition": "[{\"Type\": \"FinishSubMission\", \"Param\": \"...",
  "ScriptUnlockCost": {},
  "StartChapterID": 101,
  "TalentCanBeUsed": [],
  "ScriptTitle": {
    "Hash": 12745183541006089479
  },
  "ScriptDesc": {
    "Hash": 7136871017103063791
  },
  "ImgPath": "SpriteOutput/UI/Quest/ClockPark/ClockPar...",
  "PrefabPath": "",
  "IconPath": "SpriteOutput/UI/Quest/ClockPark/ClockPar...",
  "ScriptBGM": "State_Menu_Season_ClockPark_Script_01",
  "ScriptPostPrefabPath": "UI/Quest/ClockPark/Widget/ClockParkTapeI...",
  "ScriptResultLogoMaskPath": "SpriteOutput/UI/Quest/ClockPark/ClockPar..."
}
```

### DailyQuest.json (0.01 MB, 53 条)

**字段** (4): `DailyID, QuestList, MinLevel, MaxLevel`

**首条记录摘要**:
```json
{
  "DailyID": 2100003,
  "QuestList": [
    2100003
  ],
  "MinLevel": 10,
  "MaxLevel": 999
}
```

### ActivityQuestRewardConfig.json (0.01 MB, 41 条)

**字段** (4): `ActivityRewardID, QuestTabGroupList, FinalRewardQuest, ActivityModule`

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

### RestaurantOpEffectConfig.json (0.01 MB, 36 条)

**字段** (5): `ID, Type, OptionText, EventRewardID, ResultText`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "Type": "Normal",
  "OptionText": {
    "Hash": 14016838156962261901
  },
  "EventRewardID": 10101,
  "ResultText": {
    "Hash": 3762166443362276783
  }
}
```

### GridFightTutorialStageNode.json (0.01 MB, 32 条)

**字段** (4): `DivisionID, ChapterID, SectionID, FunctionList`

**首条记录摘要**:
```json
{
  "DivisionID": 1,
  "ChapterID": 1,
  "SectionID": 1,
  "FunctionList": "[\"Trait\", \"Strategy\", \"Interest\", \"Guide..."
}
```

### GridFightRoleGameRefScore.json (0.01 MB, 77 条)

**字段** (3): `RoleID, SeasonID, RoleInGameRefScore`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "SeasonID": 1,
  "RoleInGameRefScore": 3
}
```

### TeamLimitCondition.json (0.01 MB, 49 条)

**字段** (5): `ID, LimitType, ParamInt1, ParamIntList, LimitDesc`

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

### MatchThreeV2StarTarget.json (0.01 MB, 30 条)

**字段** (5): `StarTargetID, FinishType, FinishParamList, Reward, Desc`

**首条记录摘要**:
```json
{
  "StarTargetID": 10101,
  "FinishType": "UseBird",
  "FinishParamList": [
    501,
    504
  ],
  "Reward": 139401,
  "Desc": {
    "Hash": 12260593840324955187
  }
}
```

### RestaurantSpecialCustomer.json (0.01 MB, 35 条)

**字段** (3): `SpecialCustomerID, CustomerID, EventConfigPath`

**首条记录摘要**:
```json
{
  "SpecialCustomerID": 101,
  "CustomerID": 101,
  "EventConfigPath": "Config/Level/LittleGame/ElfRestaurant/Sp..."
}
```

### IdleLiveChestLevel.json (0.01 MB, 120 条)

**字段** (2): `Level, ExpUpLimit`

**首条记录摘要**:
```json
{
  "Level": 1,
  "ExpUpLimit": 10
}
```

### ElationBattleModifiedAvatar.json (0.01 MB, 6 条)

**字段** (14): `ID, SpecialAvatarID, GiftName, GiftIcon, Tag, EnergyCollection, EnergyCollection_Simple, ParamList_EnergyCollection, BESkill, BESkill_Simple, ParamList_BESkill, ModifiedSkill, ModifiedSkill_Simple, ParamList_ModifiedSkill`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SpecialAvatarID": 3121306,
  "GiftName": {
    "Hash": 15485593234338109350
  },
  "GiftIcon": "SpriteOutput/Quest/ActivityElationBattle...",
  "Tag": {
    "Hash": 5194647480700527863
  },
  "EnergyCollection": {
    "Hash": 3559121180355751652
  },
  "EnergyCollection_Simple": {
    "Hash": 6250999010110231383
  },
  "ParamList_EnergyCollection": [
    {
      "Value": 1
    }
  ],
  "BESkill": {
    "Hash": 16406550069587592032
  },
  "BESkill_Simple": {
    "Hash": 3041754129774414938
  },
  "ParamList_BESkill": [
    {
      "Value": 5
    }
  ],
  "ModifiedSkill": {
    "Hash": 9828752696450998570
  },
  "ModifiedSkill_Simple": {
    "Hash": 10762895603202634547
  },
  "ParamList_ModifiedSkill": [
    {
      "Value": 3
    }
  ]
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

**字段** (5): `ID, Type, MapEntranceID, NearbyTeleportMappingInfoID, IndoorTeleportMapIconID`

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

**字段** (5): `ID, Title, From, To, MailSentenceIDList`

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
  "MailSentenceIDList": "[1001, 1002, 1003, 1004, 1005, 1006, 100..."
}
```

### TarotWikiData.json (0.01 MB, 25 条)

**字段** (5): `ID, Title, Details, ChangeID, SubdataList`

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

### GFTraitBEOverrideConfig.json (0.01 MB, 4 条)

**字段** (9): `TraitID, TraitLayer, OverrideBEProperty, OverrideSkillIDList, AbilityName, TraitTitleDesc, OneWordDesc, OneWordDescSimple, SpecialIconPath`

**首条记录摘要**:
```json
{
  "TraitID": 2012,
  "TraitLayer": 3,
  "OverrideBEProperty": "[{\"PropertyType\": \"ExtraFrontPowerAddedR...",
  "OverrideSkillIDList": [
    20120101,
    20120201,
    20120301
  ],
  "AbilityName": "StageAbility_GridFight_Origin_2012_Trait...",
  "TraitTitleDesc": {
    "Hash": 4748922567390602214
  },
  "OneWordDesc": {
    "Hash": 11459212831199823686
  },
  "OneWordDescSimple": {
    "Hash": 4288701258675993229
  },
  "SpecialIconPath": "SpriteOutput/SkillIcons/Com/SkillIcon_Pr..."
}
```

### RestaurantFacilityUpConfig.json (0.01 MB, 49 条)

**字段** (3): `FacilityID, Level, AbilityIDList`

**首条记录摘要**:
```json
{
  "FacilityID": 101,
  "Level": 3,
  "AbilityIDList": [
    1103
  ]
}
```

### RogueTournBuffType.json (0.01 MB, 10 条)

**字段** (8): `RogueBuffType, RogueBuffTypeName, RogueBuffTypeTitle, RogueBuffTypeSubTitle, RogueBuffTypeDecoName, RogueBuffTypeIcon, RogueBuffTypeSmallIcon, RogueBuffTypeLargeIcon`

**首条记录摘要**:
```json
{
  "RogueBuffType": 120,
  "RogueBuffTypeName": {
    "Hash": 9068562576598104923
  },
  "RogueBuffTypeTitle": {
    "Hash": 11458725456967511694
  },
  "RogueBuffTypeSubTitle": {
    "Hash": 2970038426630829786
  },
  "RogueBuffTypeDecoName": "Preservation",
  "RogueBuffTypeIcon": "SpriteOutput/ProfessionIconMiddle/IconPr...",
  "RogueBuffTypeSmallIcon": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "RogueBuffTypeLargeIcon": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### IdleLiveGachaAvatarText.json (0.01 MB, 37 条)

**字段** (3): `AvatarID, AvatarText, VoiceID`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "AvatarText": {
    "Hash": 12290626317035918465
  },
  "VoiceID": "Ev_archive_vo_avatar_turn_begin_mar7th_0..."
}
```

### PlanetFesTask.json (0.01 MB, 102 条)

**字段** (2): `TaskID, QuestID`

**首条记录摘要**:
```json
{
  "TaskID": 1,
  "QuestID": 101
}
```

### FateConstValueCommon.json (0.01 MB, 38 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Fate_Shop_RefreshCost",
  "Value": {
    "IntValue": 2
  }
}
```

### ClockParkStory.json (0.01 MB, 27 条)

**字段** (3): `StoryID, StoryJsonPath, ImgPath`

**首条记录摘要**:
```json
{
  "StoryID": 10101,
  "StoryJsonPath": "Config/ConfigActivityClockPark/GamePlayP...",
  "ImgPath": "SpriteOutput/UI/Quest/ActivityQuestTimeL..."
}
```

### HealPool.json (0.01 MB, 70 条)

**字段** (3): `PlayerLevel, MaxHealPool, RecoverTime`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "MaxHealPool": 1000,
  "RecoverTime": 1800
}
```

### DrinkMakerCheersTypeTextmap.json (0.01 MB, 18 条)

**字段** (6): `GroupID, Type, QuantifyNameP2, QuantifyNameN2, TypeIconPath, TypeProgressBarPath`

**首条记录摘要**:
```json
{
  "GroupID": 1000,
  "Type": "CheersTypeA",
  "QuantifyNameP2": {
    "Hash": 1816045755662579937
  },
  "QuantifyNameN2": {
    "Hash": 9138122276017477134
  },
  "TypeIconPath": "SpriteOutput/Quest/DrinkMaker/TagTypeIco...",
  "TypeProgressBarPath": "#f27a73"
}
```

### PixAirPlaneConfig.json (0.01 MB, 8 条)

**字段** (14): `PlaneID, EquipID, EquipIDList, RecommendTagList, BaseHP, BaseLife, Name, PlaneIconPath, LargePlaneIconPath, ModelPath, IconPath, AvatarName, desc, IsSelectable`

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

### StageBattleEventConfig.json (0.01 MB, 16 条)

**字段** (8): `EventID, EventType, IconPath, IncludeAvatar, ModifierNameList, AbilityNameList, SelfModifierNameList, ParamList`

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

### MarbleMatchLevel.json (0.01 MB, 33 条)

**字段** (4): `ID, JsonConfigPath, TutorialGroupID, TotalScore`

**首条记录摘要**:
```json
{
  "ID": 1,
  "JsonConfigPath": "Config/Gameplays/LittleGame/Marble/Level...",
  "TutorialGroupID": 9838,
  "TotalScore": 4
}
```

### ChimeraDuelItemGroup.json (0.01 MB, 38 条)

**字段** (2): `ItemGroupID, ItemIDList`

**首条记录摘要**:
```json
{
  "ItemGroupID": 60000,
  "ItemIDList": "[1101, 1102, 1201, 1202, 1301, 1302, 140..."
}
```

### TrainVisitorConfig.json (0.01 MB, 36 条)

**字段** (4): `VisitorID, MissionID, AvatarID, MessageCome`

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

### FatePhase.json (0.01 MB, 10 条)

**字段** (9): `HFGNHCDNPHL, POCKPDCKPMA, MKPCBHODIFB, COPIFAPBMJH, AENCLGAIGMD, LOEPLBPFMEN, MLNNCPNNDOO, JAKDNHOHINO, LKJNMGCBCAK`

**首条记录摘要**:
```json
{
  "HFGNHCDNPHL": 1,
  "POCKPDCKPMA": 12,
  "MKPCBHODIFB": 20,
  "COPIFAPBMJH": 12,
  "AENCLGAIGMD": 12,
  "LOEPLBPFMEN": 102,
  "MLNNCPNNDOO": [
    "Common"
  ],
  "JAKDNHOHINO": "[{\"Value\": 0.6}, {\"Value\": 0.4}, {\"Value...",
  "LKJNMGCBCAK": "[{\"Value\": 0.589}, {\"Value\": 0.4}, {\"Val..."
}
```

### RogueTournConstCommon.json (0.01 MB, 34 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTourn_Talent_TalentCoinItemID",
  "Value": {
    "IntValue": 281018
  }
}
```

### ScheduleDataChallengeMaze.json (0.01 MB, 53 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 200101,
  "BeginTime": "2023-02-06 04:00:00",
  "EndTime": "2023-03-06 04:00:00"
}
```

### RestaurantEmployeeConfig.json (0.01 MB, 11 条)

**字段** (13): `EmployeeID, Type, NPCID, GroupID, ConfigID, BehaviorID, Model, IMGPath, Name, Detail, FirstTalk, UnlockIDList, IsShow`

**首条记录摘要**:
```json
{
  "EmployeeID": 101,
  "Type": "Waiter",
  "NPCID": 3217,
  "GroupID": 219,
  "ConfigID": 400004,
  "BehaviorID": 21,
  "Model": "Gameplays/ElfRestaurant/Prefab/Npcs/ElfR...",
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/NPC/NPC...",
  "Name": {
    "Hash": 16144028895189742182
  },
  "Detail": {
    "Hash": 13057992232574732947
  },
  "FirstTalk": {
    "Hash": 13323048209405616961
  },
  "UnlockIDList": [],
  "IsShow": true
}
```

### AvatarConfigEnhanced.json (0.01 MB, 10 条)

**字段** (7): `AvatarID, EnhancedID, JsonPath, AIPath, SPNeed, RankIDList, SkillList`

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
  "RankIDList": "[1121201, 1121202, 1121203, 1121204, 112...",
  "SkillList": "[1121201, 1121202, 1121203, 1121204, 112..."
}
```

### RogueAeonStoryConfig.json (0.01 MB, 26 条)

**字段** (4): `RogueAeonID, AeonStoryID, AeonStory_Name, AeonStory`

**首条记录摘要**:
```json
{
  "RogueAeonID": 1,
  "AeonStoryID": 1,
  "AeonStory_Name": {
    "Hash": 4983113306767004281
  },
  "AeonStory": {
    "Hash": 5115281272635460101
  }
}
```

### StarFightStageConfig.json (0.01 MB, 30 条)

**字段** (5): `GroupID, DifficultyLevel, EventID, QuestList, BattleAreaID`

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

**字段** (4): `ID, StoryList, CardList, ClueList`

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

### RogueDLCDifficulty.json (0.01 MB, 37 条)

**字段** (3): `DifficultyID, DifficultyCutList, LevelList`

**首条记录摘要**:
```json
{
  "DifficultyID": 1011,
  "DifficultyCutList": [
    6
  ],
  "LevelList": [
    53,
    54
  ]
}
```

### RogueTournDifficulty.json (0.01 MB, 58 条)

**字段** (2): `DifficultyID, LevelList`

**首条记录摘要**:
```json
{
  "DifficultyID": 1001,
  "LevelList": []
}
```

### IdleLiveAvatarUpgradeCost.json (0.01 MB, 120 条)

**字段** (2): `Level, Cost`

**首条记录摘要**:
```json
{
  "Level": 1,
  "Cost": 20
}
```

### EmojiGroup.json (0.01 MB, 28 条)

**字段** (4): `EmojiGroupID, EmojiGroupType, GroupName, ImgPath`

**首条记录摘要**:
```json
{
  "EmojiGroupID": 101,
  "EmojiGroupType": "All",
  "GroupName": {
    "Hash": 7512617610515537341
  },
  "ImgPath": "SpriteOutput/UI/Friend/TabEmoji/TabEmoji..."
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

### RestaurantTradeOrderConfig.json (0.00 MB, 21 条)

**字段** (6): `OrderID, CostProductMap, RewardProductMap, Detail, UnlockIDList, CustomerID`

**首条记录摘要**:
```json
{
  "OrderID": 34061,
  "CostProductMap": {
    "203": 15
  },
  "RewardProductMap": {
    "406": 15
  },
  "Detail": {
    "Hash": 3557399192582485322
  },
  "UnlockIDList": [
    109004
  ],
  "CustomerID": 110
}
```

### HeartDialCondition.json (0.00 MB, 55 条)

**字段** (2): `ID, FinishType`

**首条记录摘要**:
```json
{
  "ID": 10001001,
  "FinishType": "AutoFinish"
}
```

### ActivityDiceV2Opponent.json (0.00 MB, 6 条)

**字段** (12): `PHFMCACHFIJ, HBAEOBMGAOO, DOEJKEGCHIG, OOLEAPLDIEA, FNFACKPFNKL, OBCPCPLBIGP, KANFOJDEPME, JPBADMFEFKL, GFLNPPIFGGE, EPBIIPGGHIJ, HOHLFFPPBON, ELAIIFMNEHD`

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

### DrinkMakerCheersCombination.json (0.00 MB, 27 条)

**字段** (5): `TagCombinationID, TagRequestDesc, IncludeTags, ExcludeTags, HintStr`

**首条记录摘要**:
```json
{
  "TagCombinationID": 10011,
  "TagRequestDesc": {
    "Hash": 11211546202324978839
  },
  "IncludeTags": [],
  "ExcludeTags": [
    1002,
    1003,
    1100
  ],
  "HintStr": ""
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

### MazePuzzleWolfGunPlayLevel.json (0.00 MB, 17 条)

**字段** (7): `GunLevel, Title, Description, QuestList, ShowInUI, TriggerCustomString, TargetScore`

**首条记录摘要**:
```json
{
  "GunLevel": 1,
  "Title": {
    "Hash": 8998444615258011685
  },
  "Description": {
    "Hash": 7491557505754125272
  },
  "QuestList": [
    2200401
  ],
  "ShowInUI": true,
  "TriggerCustomString": "WolfGunPlay_Lv1",
  "TargetScore": 6000
}
```

### MonsterTextGuide.json (0.00 MB, 39 条)

**字段** (3): `TextGuideID, TextGuideDescription, ParameterList`

**首条记录摘要**:
```json
{
  "TextGuideID": 10010,
  "TextGuideDescription": {
    "Hash": 3311593509976790101
  },
  "ParameterList": []
}
```

### RogueActivityResidentConfig.json (0.00 MB, 5 条)

**字段** (12): `ActivityID, SubMode, ResidentName, ResidentBrief, ResidentDesc, TitleIconPath, DisplayItemList, IntroGuideImg, IntroID, ActivityTagList, SortWeight, UnlockID`

**首条记录摘要**:
```json
{
  "ActivityID": 100,
  "SubMode": "CosmosRogue",
  "ResidentName": {
    "Hash": 10889204567943942718
  },
  "ResidentBrief": {
    "Hash": 12528162485576940411
  },
  "ResidentDesc": {
    "Hash": 7276791121849754233
  },
  "TitleIconPath": "SpriteOutput/Quest/TabIcon/PermanentActi...",
  "DisplayItemList": "[{\"ItemID\": 101}, {\"ItemID\": 24005}, {\"I...",
  "IntroGuideImg": "SpriteOutput/Quest/PermanentActivity/Det...",
  "IntroID": 12,
  "ActivityTagList": [
    3
  ],
  "SortWeight": 6000,
  "UnlockID": 50017
}
```

### MatchThreeRobotDB.json (0.00 MB, 30 条)

**字段** (4): `RobotID, Name, Level, HeadIcon`

**首条记录摘要**:
```json
{
  "RobotID": 10001,
  "Name": {
    "Hash": 8425519474407966878
  },
  "Level": 61,
  "HeadIcon": "SpriteOutput/AvatarRoundIcon/Series/2020..."
}
```

### IdleLiveQuestRoundIcon.json (0.00 MB, 39 条)

**字段** (2): `QuestID, QuestRoundIconPath`

**首条记录摘要**:
```json
{
  "QuestID": 8061501,
  "QuestRoundIconPath": "SpriteOutput/Quest/IdleLive/RewardFuctio..."
}
```

### RogueDLCBlockType.json (0.00 MB, 16 条)

**字段** (6): `BlockTypeID, BlockTypeNameID, BlockTypeIcon, BlockTypeChessBoardIcon, BlockTypeChessBoardColor, BlockIntroID`

**首条记录摘要**:
```json
{
  "BlockTypeID": 1,
  "BlockTypeNameID": {
    "Hash": 5977083739219287398
  },
  "BlockTypeIcon": "SpriteOutput/Rogue/Map/RogueDlcEmptyIcon...",
  "BlockTypeChessBoardIcon": "SpriteOutput/Rogue/SceneNavi/SceneNaviRo...",
  "BlockTypeChessBoardColor": "#ffffffd9",
  "BlockIntroID": 1
}
```

### DecalGameplayConfig.json (0.00 MB, 20 条)

**字段** (3): `DecalID, TextureMapPath, IconPath`

**首条记录摘要**:
```json
{
  "DecalID": 1,
  "TextureMapPath": "Stages/OriginalResPos/InteractiveProp/Ch...",
  "IconPath": ""
}
```

### MonopolyBuffConfig.json (0.00 MB, 29 条)

**字段** (7): `BuffID, EffectID, Duration, BuffName, BuffDesc, IconPath, Rank`

**首条记录摘要**:
```json
{
  "BuffID": 100,
  "EffectID": 1100,
  "Duration": 4,
  "BuffName": {
    "Hash": 18177319977138791297
  },
  "BuffDesc": {
    "Hash": 1272401975647823654
  },
  "IconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon...",
  "Rank": 1
}
```

### InventoryTabData.json (0.00 MB, 9 条)

**字段** (10): `ID, TabName, IconImagePath, DisplayInventoryType, DisplayItemSubType, InventoryDisplayTag, TabSortWeight, ItemSortTypeList, SellType, UnlockCondition`

**首条记录摘要**:
```json
{
  "ID": 101,
  "TabName": {
    "Hash": 3641587384539519619
  },
  "IconImagePath": "SpriteOutput/TabIcon/Inventory/Inventory...",
  "DisplayInventoryType": "Normal",
  "DisplayItemSubType": "[\"Virtual\", \"Material\", \"AvatarExp\", \"Av...",
  "InventoryDisplayTag": 1,
  "TabSortWeight": 10,
  "ItemSortTypeList": [
    "Default",
    "Rarity"
  ],
  "SellType": "Destroy",
  "UnlockCondition": {
    "Type": "PlayerLevel",
    "Param": "1"
  }
}
```

### ActivitySummonLevel.json (0.00 MB, 10 条)

**字段** (10): `GroupID, DifficultyLevel, EventID, BattleTargetList, MasterAvatarList, ReplaceMasterAvatarList, TrialAvatarList, ReplaceTrialAvatarList, UIEnterBattleAreaID, ImagePath`

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

### RogueBuffType.json (0.00 MB, 10 条)

**字段** (6): `RogueBuffType, RogueBuffTypeTextmapID, RogueBuffTypeIcon, RogueBuffTypeTitle, RugueBuffTypeRewardQuestList, RogueBuffTypeSubTitle`

**首条记录摘要**:
```json
{
  "RogueBuffType": 100,
  "RogueBuffTypeTextmapID": {
    "Hash": 1417439802148964015
  },
  "RogueBuffTypeIcon": "SpriteOutput/TabIcon/Common/AllIcon.png",
  "RogueBuffTypeTitle": {
    "Hash": 5227951559305542412
  },
  "RugueBuffTypeRewardQuestList": [],
  "RogueBuffTypeSubTitle": {
    "Hash": 7360959888899262187
  }
}
```

### ActivityDiceV2PVPTitle.json (0.00 MB, 17 条)

**字段** (7): `PHFMCACHFIJ, OFGKEMCCMIM, LKMNEALKDLO, NJPLBONOODI, PBLPLDJKPEI, NALMBOOCCIN, JPLIONFJGCL`

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

### MatchThreeConstValueClient.json (0.00 MB, 29 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "MatchThree_SwitchNightUnlock",
  "Value": {
    "IntValue": 0
  }
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

### RogueTournRole.json (0.00 MB, 95 条)

**字段** (2): `AvatarID, BuffID`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "BuffID": 661001
}
```

### CityShopRewardList.json (0.00 MB, 45 条)

**字段** (4): `GroupID, Level, ItemNeed, TotalItem`

**首条记录摘要**:
```json
{
  "GroupID": 401,
  "Level": 1,
  "ItemNeed": 10,
  "TotalItem": 10
}
```

### ILEliteGroup.json (0.00 MB, 30 条)

**字段** (4): `EliteGroup, AttackRatio, DefenceRatio, HPRatio`

**首条记录摘要**:
```json
{
  "EliteGroup": 1,
  "AttackRatio": {
    "Value": 1
  },
  "DefenceRatio": {
    "Value": 1
  },
  "HPRatio": {
    "Value": 1
  }
}
```

### AlleyMission.json (0.00 MB, 48 条)

**字段** (4): `MissionID, IsMissionTrack, EventEffect, NextMission`

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

### FiveDimFluteConfig.json (0.00 MB, 17 条)

**字段** (10): `ID, Type, Code, EntranceID, GroupID, TeleAnchorID, ContainerID, FiveDimAnchorID, GPName, TeleAreaName`

**首条记录摘要**:
```json
{
  "ID": 1050001,
  "Type": "Teleport",
  "Code": "89681231",
  "EntranceID": 1050101,
  "GroupID": 570,
  "TeleAnchorID": 1,
  "ContainerID": 110001,
  "FiveDimAnchorID": 17,
  "GPName": "",
  "TeleAreaName": {
    "Hash": 13088770917174101698
  }
}
```

### FantasticStoryBuffID.json (0.00 MB, 23 条)

**字段** (7): `BuffID, BuffSlot, UnlockChapterID, AvailableBattleID, ClientShowAvailableTips, ActivityModuleID, MazebuffID`

**首条记录摘要**:
```json
{
  "BuffID": 1,
  "BuffSlot": 1,
  "UnlockChapterID": 1,
  "AvailableBattleID": [
    1,
    4
  ],
  "ClientShowAvailableTips": true,
  "ActivityModuleID": 4000208,
  "MazebuffID": 3102107
}
```

### RogueTournAvatar.json (0.00 MB, 79 条)

**字段** (2): `AvatarID, SpecialAvatarID`

**首条记录摘要**:
```json
{
  "AvatarID": 1002,
  "SpecialAvatarID": 3711002
}
```

### PlanetFesLevelUnlock.json (0.00 MB, 15 条)

**字段** (5): `ID, Name, Description, IconPath, MiniIconPath`

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

### TrainPartySlotConfig.json (0.00 MB, 28 条)

**字段** (5): `ID, Name, SortID, CameraStaticID, TagList`

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

### ChallengeMazeGroupExtra.json (0.00 MB, 55 条)

**字段** (2): `GroupID, ThemePosterBgPicPath`

**首条记录摘要**:
```json
{
  "GroupID": 100,
  "ThemePosterBgPicPath": "SpriteOutput/Abyss/2D_SceneBg/AbyssSence..."
}
```

### AvatarEnhancedSkillTree.json (0.00 MB, 25 条)

**字段** (4): `SkillTreeID, AvatarID, DescBefore, DescAfter`

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

### RestaurantSeedConfig.json (0.00 MB, 12 条)

**字段** (11): `SeedID, Name, SortID, Price, ProductID, ProductCount, GrowTime, SpecialProductList, CropsModelPath, BigCropsModelPath, ItemID`

**首条记录摘要**:
```json
{
  "SeedID": 101,
  "Name": {
    "Hash": 9823267097206249725
  },
  "SortID": 1,
  "Price": 1,
  "ProductID": 201,
  "ProductCount": 3,
  "GrowTime": 1,
  "SpecialProductList": [],
  "CropsModelPath": "Gameplays/ElfRestaurant/Prefab/Products/...",
  "BigCropsModelPath": "",
  "ItemID": 260001
}
```

### NormalMode.json (0.00 MB, 32 条)

**字段** (5): `NormalModeID, Title, Desc01, Desc02, Desc03`

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

### MarbleBuffCondition.json (0.00 MB, 45 条)

**字段** (4): `ID, DrawType, DrawTypeParameter, ParamList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "DrawType": "AssignSeal",
  "DrawTypeParameter": 1,
  "ParamList": []
}
```

### MonopolyQuizResult.json (0.00 MB, 32 条)

**字段** (4): `ID, QuizID, PlayerIDList, Desc`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "QuizID": 101,
  "PlayerIDList": [],
  "Desc": {
    "Hash": 2551815791069446368
  }
}
```

### TeamTowersBossSkill.json (0.00 MB, 9 条)

**字段** (8): `PHFMCACHFIJ, OENAMINOLLF, OLOIFNNLKJP, PNCFJGFAEMA, NMAHGFAPENI, PBLPLDJKPEI, ODEKADIBFAO, GINFOPOAKHK`

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

### ResourceDeletionUsmList.json (0.00 MB, 76 条)

**字段** (2): `ID, Path`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Path": "CS_Chap_TestRes.usm"
}
```

### PixAirShopConfig.json (0.00 MB, 90 条)

**字段** (1): `ContentID`

**首条记录摘要**:
```json
{
  "ContentID": 8001
}
```

### AchievementSeries.json (0.00 MB, 9 条)

**字段** (8): `SeriesID, SeriesTitle, MainIconPath, IconPath, GoldIconPath, SilverIconPath, CopperIconPath, Priority`

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

### FightFestChallenge.json (0.00 MB, 5 条)

**字段** (19): `ChallengeID, GroupID, UnlockSubMussionID, UnlockSubMissionID, UnlockConditionList, EventID, EnvironmentBuffID, SpecialAvatarList, BattleTargetList, QuestGroupID, TabName, TabIconPath, UnlockTips, QuestIDList, TutorialID, OriginalStageName, OriginalFigurePath, FigurePath, AvatarInfoID`

**首条记录摘要**:
```json
{
  "ChallengeID": 1,
  "GroupID": 1,
  "UnlockSubMussionID": 802511104,
  "UnlockSubMissionID": 802511104,
  "UnlockConditionList": [],
  "EventID": 419201,
  "EnvironmentBuffID": 3107201,
  "SpecialAvatarList": [
    3231308,
    3231218
  ],
  "BattleTargetList": [
    5001301,
    5001302,
    5001303
  ],
  "QuestGroupID": 1,
  "TabName": {
    "Hash": 11138937894715987869
  },
  "TabIconPath": "SpriteOutput/AvatarIconTeam/1112.png",
  "UnlockTips": {
    "Hash": 11880329699434634116
  },
  "QuestIDList": [
    6027115,
    6027100,
    6027101,
    6027102
  ],
  "TutorialID": 8183,
  "OriginalStageName": {
    "Hash": 18282416382830888914
  },
  "OriginalFigurePath": "SpriteOutput/AvatarCutinFigures/999.png",
  "FigurePath": "SpriteOutput/Quest/FightFest/Avatar/Chal...",
  "AvatarInfoID": 2
}
```

### RogueDLCLayer.json (0.00 MB, 20 条)

**字段** (4): `LayerID, LayerNumID, LayerNameID, LayerIcon`

**首条记录摘要**:
```json
{
  "LayerID": 1011,
  "LayerNumID": {
    "Hash": 6447344968498276241
  },
  "LayerNameID": {
    "Hash": 14068184658691614415
  },
  "LayerIcon": "SpriteOutput/UI/Rogue/DLC/Dice/Level/Img..."
}
```

### SpecialChestFindData.json (0.00 MB, 26 条)

**字段** (7): `FloorID, GroupID, InstanceID, ReplaceGroupID, ReplaceInstanceID, IsUseSpecialMappinginfo, ReplaceType`

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

### MatchThreeV2PVPRank.json (0.00 MB, 10 条)

**字段** (8): `RankID, Rank, GameModeList, MaxScore, Name, SmallIconPath, IconPath, BigIconPath`

**首条记录摘要**:
```json
{
  "RankID": 1,
  "Rank": 1,
  "GameModeList": [
    "MATCH3",
    "MATCH3_SOLO"
  ],
  "MaxScore": 1000,
  "Name": {
    "Hash": 15418445943938095360
  },
  "SmallIconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "IconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "BigIconPath": "SpriteOutput/Quest/MatchThree/RankIcon/M..."
}
```

### MatchThreeV2Tips.json (0.00 MB, 23 条)

**字段** (4): `TipsID, TipsDesc, Condition, Weight`

**首条记录摘要**:
```json
{
  "TipsID": 1,
  "TipsDesc": {
    "Hash": 14927483021586036889
  },
  "Condition": "[{\"GMPGDEINODK\": \"LevelMode\", \"NNACKOBKF...",
  "Weight": 100
}
```

### DrinkMakerCheersComment.json (0.00 MB, 28 条)

**字段** (3): `ID, HeadIconPath, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 1,
  "HeadIconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "UnlockQuest": 6070620
}
```

### ActivityQuestTimeLimitGroup.json (0.00 MB, 11 条)

**字段** (8): `QuestTimeLimitGroupID, QuestList, Name, EnName, FigurePath, UIPanelType, ActivityModuleID, ActivityID`

**首条记录摘要**:
```json
{
  "QuestTimeLimitGroupID": 1,
  "QuestList": "[6000601, 6000602, 6000603, 6000604, 600...",
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

### HeliobusPostImg.json (0.00 MB, 39 条)

**字段** (2): `PostImgID, PostImgPath`

**首条记录摘要**:
```json
{
  "PostImgID": 101,
  "PostImgPath": "SpriteOutput/Quest/Heliobus/PhotoImg/Hel..."
}
```

### ActivityDiceTypeConfig.json (0.00 MB, 4 条)

**字段** (12): `PBFMMOGEBAK, MBNNCBAAHFC, OLOIFNNLKJP, BFJGHPDNIOI, BDACPPLKLGL, JACANFAMGBO, HLMCIPNJIHM, NAODLBMKJKN, PNIDDEEJPCI, JBNNNICBNFE, CILPGJAFCOK, LNPCPJCEMHL`

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

### ChimeraEvaluation.json (0.00 MB, 17 条)

**字段** (5): `EvaluationID, EvaluationName, EvaluationDesc, ConditionJson, GroupID`

**首条记录摘要**:
```json
{
  "EvaluationID": 1,
  "EvaluationName": {
    "Hash": 5526056476372875543
  },
  "EvaluationDesc": {
    "Hash": 10247238918747935851
  },
  "ConditionJson": "Config/Gameplays/Chimera/Evalution/Chime...",
  "GroupID": 4
}
```

### LimaoNewsInteractEntity.json (0.00 MB, 47 条)

**字段** (4): `KFAGIEFOAGN, LPDDNLPNGJG, MMDDLJCIJLE, FLLFLEEHCJI`

**首条记录摘要**:
```json
{
  "KFAGIEFOAGN": 40300201,
  "LPDDNLPNGJG": 2540,
  "MMDDLJCIJLE": 434051102,
  "FLLFLEEHCJI": 434051107
}
```

### PamChatGreeting.json (0.00 MB, 19 条)

**字段** (5): `ID, Condition, GreetingTextIDList, IsDailyGreeting, Priority`

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

### RogueTournBuildRefAvatar.json (0.00 MB, 84 条)

**字段** (2): `AvatarID, SortWeight`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "SortWeight": 1001
}
```

### RogueDLCMainStory.json (0.00 MB, 13 条)

**字段** (6): `MainStoryID, Layer, UnlockAeonDimension, UnlockPoint, MainStoryName, MainStoryButtonIcon`

**首条记录摘要**:
```json
{
  "MainStoryID": 1,
  "Layer": 3,
  "UnlockAeonDimension": 5,
  "UnlockPoint": 2,
  "MainStoryName": {
    "Hash": 7243112898305965080
  },
  "MainStoryButtonIcon": "SpriteOutput/UI/Rogue/DLC/Dice/StarGodSt..."
}
```

### FateBroadcast.json (0.00 MB, 22 条)

**字段** (4): `PKGJBPODCOG, JGAICIJPHNO, CIMMEBGNABD, FFCBLPDHCFO`

**首条记录摘要**:
```json
{
  "PKGJBPODCOG": 10101,
  "JGAICIJPHNO": {
    "Hash": 10672144692988465381
  },
  "CIMMEBGNABD": "Ev_vo_HuoDongFate_ambient_w3_v340_broadc...",
  "FFCBLPDHCFO": []
}
```

### CakeDialogue.json (0.00 MB, 41 条)

**字段** (3): `ID, CatID, RuanMadeCakeDialogue`

**首条记录摘要**:
```json
{
  "ID": 1,
  "CatID": 7,
  "RuanMadeCakeDialogue": {
    "Hash": 5545516011862299792
  }
}
```

### ActivityHipplenFinishWay.json (0.00 MB, 22 条)

**字段** (8): `ID, FinishType, ParamType, ParamInt1, ParamStr1, ParamIntList, ParamItemList, Progress`

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

### MultiplePathAvatarConfig.json (0.00 MB, 12 条)

**字段** (6): `AvatarID, Gender, UnlockConditions, BaseAvatarID, Desc, ChangeConfigPath`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "Gender": "GENDER_MAN",
  "UnlockConditions": [],
  "BaseAvatarID": 8001,
  "Desc": {
    "Hash": 12336609480192427249
  },
  "ChangeConfigPath": "Config/ConfigAvatarPathChange/Avatar_Pla..."
}
```

### CakeRaceTitle.json (0.00 MB, 14 条)

**字段** (9): `TitleID, TitleName, TitleDesc, ParamType, ParamList, ConditionType, ConditionParam, Priority, BgColor`

**首条记录摘要**:
```json
{
  "TitleID": 1,
  "TitleName": {
    "Hash": 4549008222802919165
  },
  "TitleDesc": {
    "Hash": 11029799204550236701
  },
  "ParamType": "FightEndRankCnt",
  "ParamList": [
    1
  ],
  "ConditionType": "GreaterEqual",
  "ConditionParam": 3,
  "Priority": 3000,
  "BgColor": "Orange"
}
```

### FightFestCoachSkill.json (0.00 MB, 12 条)

**字段** (8): `CoachItemID, CoachType, MazeBuffID, SortWeight, CoachSkillName, FigurePath, CoachSkillExtraDesc, UnlockDesc`

**首条记录摘要**:
```json
{
  "CoachItemID": 250700,
  "CoachType": "ActiveSkill",
  "MazeBuffID": 3123001,
  "SortWeight": 1,
  "CoachSkillName": {
    "Hash": 16161635596904560720
  },
  "FigurePath": "SpriteOutput/ItemFigures/250700.png",
  "CoachSkillExtraDesc": {
    "Hash": 12933747803904903082
  },
  "UnlockDesc": {
    "Hash": 3304792965130813138
  }
}
```

### GridFightDivisionLevelShow.json (0.00 MB, 10 条)

**字段** (5): `SeasonID, DivisionIcon, DivisionShowPic, DivisionName, DivisionNameWithNum`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "DivisionIcon": "",
  "DivisionShowPic": "",
  "DivisionName": {
    "Hash": 18432933150825449103
  },
  "DivisionNameWithNum": {
    "Hash": 90175006323261507
  }
}
```

### TreasureDungeonEnemyConfig.json (0.00 MB, 29 条)

**字段** (3): `EnemyID, EnemyLevel, StageEventList`

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

### GameplayGuideSubTypeData.json (0.00 MB, 21 条)

**字段** (4): `SubTypeID, Name, TabIconPath, ItemListForType`

**首条记录摘要**:
```json
{
  "SubTypeID": 1,
  "Name": {
    "Hash": 11529769430929077637
  },
  "TabIconPath": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "ItemListForType": []
}
```

### DrinkMakerChallenge.json (0.00 MB, 12 条)

**字段** (8): `ChallengeID, ChallengeRequest, ChallengePic, ChallengeIngredientList, ChallengeRewardID, UnlockLevel, UnlockType, UnlockParam`

**首条记录摘要**:
```json
{
  "ChallengeID": 1,
  "ChallengeRequest": 10001,
  "ChallengePic": "SpriteOutput/Quest/DrinkMaker/DrinkFigur...",
  "ChallengeIngredientList": [
    5,
    3,
    1
  ],
  "ChallengeRewardID": 210101,
  "UnlockLevel": 2,
  "UnlockType": "SubMission",
  "UnlockParam": [
    802110102
  ]
}
```

### PlanetFesLand.json (0.00 MB, 9 条)

**字段** (10): `ID, PlanetType, LandType, PriceNum, GrantItemList, UnlockIDList, Name, Description, Pic, CargoIcon`

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

### ActivityHipplenInteractProp.json (0.00 MB, 12 条)

**字段** (8): `ID, Name, IconPath, SmallIconPath, StringParam, LikeType, UnlockCycleID, UnlockPhaseID`

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

### PhoneThemeConfig.json (0.00 MB, 14 条)

**字段** (5): `ID, ShowType, PhoneThemeItem, PhoneThemeMain, PhoneThemeApp`

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

### RogueTournDivision.json (0.00 MB, 9 条)

**字段** (6): `DivisionLevel, DivisionProgress, DivisionName, DivisionIconPath, DivisionIconPrefabPath, DivisionSmallIconPath`

**首条记录摘要**:
```json
{
  "DivisionLevel": 1,
  "DivisionProgress": 1,
  "DivisionName": {
    "Hash": 11944719438675247831
  },
  "DivisionIconPath": "SpriteOutput/Rogue/Tourn/Titan/RankIcon/...",
  "DivisionIconPrefabPath": "UI/Rogue/Tourn/Titan/Widget/RankIcon/Rog...",
  "DivisionSmallIconPath": "SpriteOutput/Rogue/Tourn/Titan/RankIcon/..."
}
```

### DrinkMakerConstValueClient.json (0.00 MB, 29 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "DrinkMaker_CustomDrink_IconPath",
  "Value": "{\"StringValue\": \"SpriteOutput/Quest/Drin..."
}
```

### FateRinAvatar.json (0.00 MB, 6 条)

**字段** (10): `HHDMOCBJKOF, GHNJCLNKGHH, PKJDFMCKNMC, EMFJFPAAEMB, NCCJOMIOKML, MEPIMHPJKPP, OHMIIOMCIMA, LFMFLBMDCGE, GKLAPFJKONI, GAIFKHJMCJO`

**首条记录摘要**:
```json
{
  "HHDMOCBJKOF": 6036,
  "GHNJCLNKGHH": "Saber",
  "PKJDFMCKNMC": 6036001,
  "EMFJFPAAEMB": "SpriteOutput/Collaboration/FateRin/FateA...",
  "NCCJOMIOKML": "SpriteOutput/Collaboration/FateRin/FateA...",
  "MEPIMHPJKPP": "SpriteOutput/Collaboration/FateRin/FateA...",
  "OHMIIOMCIMA": "SpriteOutput/Collaboration/FateRin/FateA...",
  "LFMFLBMDCGE": "",
  "GKLAPFJKONI": "saber",
  "GAIFKHJMCJO": "UI/Collaboration/FateRin/Battle/Widget/E..."
}
```

### CakeDialogueRule.json (0.00 MB, 12 条)

**字段** (4): `ID, CakeDialogueList, CakeRequirementList, TypeList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "CakeDialogueList": [
    1,
    2
  ],
  "CakeRequirementList": "[{\"PHFMCACHFIJ\": 7, \"HCDEOKNIGKG\": 1}, {...",
  "TypeList": [
    "Shelf",
    "Ground"
  ]
}
```

### ChenLingCondition.json (0.00 MB, 40 条)

**字段** (4): `ID, Type, Param1, Progress`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "HpLessThan",
  "Param1": 3,
  "Progress": 1
}
```

### RestaurantEventRewardConfig.json (0.00 MB, 25 条)

**字段** (4): `ID, EventType, BuffName, DynamicValues`

**首条记录摘要**:
```json
{
  "ID": 50101,
  "EventType": "CleanTable",
  "BuffName": "",
  "DynamicValues": []
}
```

### AtlasUnlockTextmap.json (0.00 MB, 46 条)

**字段** (2): `UnlockID, UnlockDesc`

**首条记录摘要**:
```json
{
  "UnlockID": 70001,
  "UnlockDesc": {
    "Hash": 6465342970467533940
  }
}
```

### LittleWheelSelectConfig.json (0.00 MB, 20 条)

**字段** (9): `GameMode, Left1, Left2, Left3, Left4, Right1, Right2, Right3, Right4`

**首条记录摘要**:
```json
{
  "GameMode": "Town",
  "Left1": [
    1
  ],
  "Left2": [
    11
  ],
  "Left3": [
    17
  ],
  "Left4": [
    4
  ],
  "Right1": [
    5
  ],
  "Right2": [
    15
  ],
  "Right3": [],
  "Right4": []
}
```

### DrinkMakerGuest.json (0.00 MB, 6 条)

**字段** (11): `GuestID, BartenderGuestName, FavorTagList, IconPath, BigIconPath, LinePath, MaxFaith, MaxFaithReward, FinishSubMissionID, FinishQuestID, EmotionProblemList`

**首条记录摘要**:
```json
{
  "GuestID": 1,
  "BartenderGuestName": {
    "Hash": 590513886203173576
  },
  "FavorTagList": [
    1,
    2,
    3,
    4
  ],
  "IconPath": "SpriteOutput/Quest/DrinkMaker/DMkMonster...",
  "BigIconPath": "SpriteOutput/Quest/DrinkMaker/DMEnterMon...",
  "LinePath": "SpriteOutput/Quest/DrinkMaker/DMEnterMon...",
  "MaxFaith": 2,
  "MaxFaithReward": 210110,
  "FinishSubMissionID": 802112103,
  "FinishQuestID": 6018115,
  "EmotionProblemList": "[{\"Hash\": 6462287894102293646}, {\"Hash\":..."
}
```

### SpaceZooSpecialEvent.json (0.00 MB, 30 条)

**字段** (4): `SpecialCatID, EventState, SpecialCatIsMask, HintTip`

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

### MuseumDeskTalk.json (0.00 MB, 14 条)

**字段** (7): `TalkID, TriggerType, TalkType, TalkTypeParameter, TextIDList, Priority, CustomString`

**首条记录摘要**:
```json
{
  "TalkID": 101,
  "TriggerType": "EnterOpenDay",
  "TalkType": "EnterOpenDayDefault",
  "TalkTypeParameter": "",
  "TextIDList": "[{\"Hash\": 3181678734706622919}, {\"Hash\":...",
  "Priority": 100,
  "CustomString": "MuseumDeskTalk_101"
}
```

### MatchThreeVsTalk.json (0.00 MB, 42 条)

**字段** (3): `ID, OpponentTalk, MyTalk`

**首条记录摘要**:
```json
{
  "ID": 101,
  "OpponentTalk": {
    "Hash": 13976717563956685259
  },
  "MyTalk": {
    "Hash": 3254318589816927249
  }
}
```

### ItemDisplaySortNew.json (0.00 MB, 44 条)

**字段** (5): `ID, Rank, SortID, Type, Param`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Rank": 1,
  "SortID": 1,
  "Type": "ItemID",
  "Param": 22
}
```

### MatchThreeEmoji.json (0.00 MB, 52 条)

**字段** (2): `EmojiID, ImagePath`

**首条记录摘要**:
```json
{
  "EmojiID": 111,
  "ImagePath": "SpriteOutput/Emoji/30007.png"
}
```

### RogueTournFormulaRandom.json (0.00 MB, 136 条)

**字段** (1): `RandomID`

**首条记录摘要**:
```json
{
  "RandomID": 1001
}
```

### AvatarRelicRecommendLD.json (0.00 MB, 4 条)

**字段** (10): `AvatarID, Set4IDList, Set2IDList, PropertyList3, PropertyList4, PropertyList5, PropertyList6, PropertyList, SubAffixPropertyList, ScoreRankList`

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
  "PropertyList3": "[\"CriticalChanceBase\", \"CriticalDamageBa...",
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
  "PropertyList": "[{\"RelicType\": \"BODY\", \"PropertyType\": \"...",
  "SubAffixPropertyList": "[\"CriticalChanceBase\", \"CriticalDamageBa...",
  "ScoreRankList": [
    336,
    281
  ]
}
```

### MapPropConditionConfig.json (0.00 MB, 16 条)

**字段** (7): `ID, UnlockConditions, UnloadConditions, ActivityModuleID, MappingInfoID, MiniMapIconID, Priority`

**首条记录摘要**:
```json
{
  "ID": 50001,
  "UnlockConditions": [],
  "UnloadConditions": [],
  "ActivityModuleID": 3000401,
  "MappingInfoID": 5001,
  "MiniMapIconID": 120,
  "Priority": 1
}
```

### TrainPartyGridConfig.json (0.00 MB, 24 条)

**字段** (4): `GridID, GridType, ParamList, GridIconPath`

**首条记录摘要**:
```json
{
  "GridID": 1001,
  "GridType": "Normal",
  "ParamList": [],
  "GridIconPath": "SpriteOutput/Quest/TrainParty/GameplayGr..."
}
```

### DrinkMakerCheersGuest.json (0.00 MB, 13 条)

**字段** (9): `ID, GroupID, DrinkID, PerformanceID, NextPerformanceID, FinishSettlementPerformanceID, SurpriseCommentList, OneMoreDrinkPerformanceID, DrinkNamePerformanceID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 1,
  "DrinkID": 100,
  "PerformanceID": 803520601,
  "NextPerformanceID": [
    803520104
  ],
  "FinishSettlementPerformanceID": 803520603,
  "SurpriseCommentList": [],
  "OneMoreDrinkPerformanceID": 803520610,
  "DrinkNamePerformanceID": 803520105
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

### EndmostChronicleMissionPack.json (0.00 MB, 32 条)

**字段** (2): `MissionPack, MainMissionIdList`

**首条记录摘要**:
```json
{
  "MissionPack": 1034101,
  "MainMissionIdList": "[1033808, 1034101, 1034103, 1034104, 103..."
}
```

### PlanetFesBusinessDay.json (0.00 MB, 19 条)

**字段** (3): `BusinessDay, PamNum, NaturalDay`

**首条记录摘要**:
```json
{
  "BusinessDay": 1,
  "PamNum": 10,
  "NaturalDay": 1
}
```

### ChenLingDeck.json (0.00 MB, 5 条)

**字段** (13): `ID, Name, InitialCardList, CardList, InitialEffectList, ShowCardList, ActivityPanelSoldieList, BGDesc, Desc, IconPath, RelatedCardList, GuideGroupID, DeckIconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 13567511781977671237
  },
  "InitialCardList": [
    103,
    203
  ],
  "CardList": "[101, 102, 103, 202, 203, 204, 205, 207,...",
  "InitialEffectList": [
    601
  ],
  "ShowCardList": [
    101,
    102,
    103
  ],
  "ActivityPanelSoldieList": [
    102,
    101,
    103
  ],
  "BGDesc": {
    "Hash": 10158932602178545397
  },
  "Desc": {
    "Hash": 11860097842095281298
  },
  "IconPath": "SpriteOutput/Quest/ActivityChenLing/Sold...",
  "RelatedCardList": [
    309,
    205
  ],
  "GuideGroupID": 9861,
  "DeckIconPath": "SpriteOutput/Quest/ActivityChenLing/Buff..."
}
```

### EventMuseumItemConfig.json (0.00 MB, 18 条)

**字段** (7): `EventMuseumItemID, MuseumItemID, MissionID, EventContentTextID, MissionStartString, ForceComplete, IsTargetReward`

**首条记录摘要**:
```json
{
  "EventMuseumItemID": 1,
  "MuseumItemID": 250005,
  "MissionID": 8001201,
  "EventContentTextID": {
    "Hash": 2755434235303506934
  },
  "MissionStartString": "Mission_800120110",
  "ForceComplete": true,
  "IsTargetReward": true
}
```

### GridFightSeasonTraitShow.json (0.00 MB, 25 条)

**字段** (5): `TraitID, SeasonID, QuestList, StandardQuestList, Priority`

**首条记录摘要**:
```json
{
  "TraitID": 1001,
  "SeasonID": 1,
  "QuestList": [
    7300201,
    7300224
  ],
  "StandardQuestList": [
    7300247
  ],
  "Priority": 6
}
```

### MonopolyReportResult.json (0.00 MB, 9 条)

**字段** (9): `ID, MBTIValueX, MBTIValueY, Name, Desc, DescDetail, UnlockTips, FigurePrefabPath, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "MBTIValueX": 140,
  "MBTIValueY": 230,
  "Name": {
    "Hash": 13398341607585665801
  },
  "Desc": {
    "Hash": 4013875643067257773
  },
  "DescDetail": {
    "Hash": 13644735355316664209
  },
  "UnlockTips": {
    "Hash": 10309198066778817097
  },
  "FigurePrefabPath": "UI/Quest/Monopoly/ReportPic/MonopolyRepo...",
  "IconPath": "SpriteOutput/UI/Quest/Monopoly/TestImg1...."
}
```

### RogueNousConstValueClient.json (0.00 MB, 25 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueNous_BoardPage_FuncEntranceIDList",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 51003}, {\"I..."
}
```

### PixAirAreaConfig.json (0.00 MB, 32 条)

**字段** (2): `AreaID, NodeIDList`

**首条记录摘要**:
```json
{
  "AreaID": 101,
  "NodeIDList": "[10101, 10102, 10103, 10104, 10105, 1010..."
}
```

### ActivityLoginConfig.json (0.00 MB, 25 条)

**字段** (3): `ID, RewardList, ActivityModuleID`

**首条记录摘要**:
```json
{
  "ID": 1002,
  "RewardList": "[3000001, 3000002, 3000003, 3000004, 300...",
  "ActivityModuleID": 1001402
}
```

### RestaurantFestivalConfig.json (0.00 MB, 11 条)

**字段** (8): `FestivalID, TagList, MaterialList, PriceIncrease, Detail, Name, Title, FOList`

**首条记录摘要**:
```json
{
  "FestivalID": 202,
  "TagList": [
    9901
  ],
  "MaterialList": [],
  "PriceIncrease": 0.5,
  "Detail": {
    "Hash": 11438130582101866230
  },
  "Name": {
    "Hash": 11677809501262311605
  },
  "Title": {
    "Hash": 8922134388160128804
  },
  "FOList": [
    101
  ]
}
```

### PamAction.json (0.00 MB, 14 条)

**字段** (9): `PamAction, AnimGroupName, MinMoodPoint, MaxMoodPoint, MinStrengthPoint, MaxStrengthPoint, Weight, Settle, PerformanceID`

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

### ShareChannelConfig.json (0.00 MB, 17 条)

**字段** (9): `ShareChannelID, IconPath, Platform, DisplayLanguageList, Title, Content, UrlTitle, Forum, Topics`

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

### ChimeraDuelConstClient.json (0.00 MB, 27 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChimeraDuel_WinHpInfo_UnlockRound",
  "Value": {
    "IntValue": 2
  }
}
```

### IdleLiveQuestion.json (0.00 MB, 25 条)

**字段** (6): `ID, SenderID, Content, Duration, Option1, Option2`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SenderID": 7,
  "Content": {
    "Hash": 4135185969317649564
  },
  "Duration": 40,
  "Option1": 101,
  "Option2": 102
}
```

### TitanAtlas.json (0.00 MB, 18 条)

**字段** (6): `TitanID, TitanName, TitanDesc, TitanGroupID, TitanVoicePoolID, ChangeUnlockID`

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

### MarbleSealTalk.json (0.00 MB, 34 条)

**字段** (3): `ID, Talk, VoiceEvt`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Talk": {
    "Hash": 11644644344582090249
  },
  "VoiceEvt": "Ev_vo_haibao_text_01"
}
```

### GridFightSeasonPortal.json (0.00 MB, 83 条)

**字段** (2): `PortalID, SeasonID`

**首条记录摘要**:
```json
{
  "PortalID": 101,
  "SeasonID": 1
}
```

### TrainPartyAreaConfig.json (0.00 MB, 6 条)

**字段** (10): `ID, Name, Sort, RequireAreaID, ProgressBonusList, IconPath, HiddenBlockList, ShowBlockList, FirstStep, IsShowInActivity`

**首条记录摘要**:
```json
{
  "ID": 11,
  "Name": {
    "Hash": 2624959422002899822
  },
  "Sort": 2,
  "RequireAreaID": 12,
  "ProgressBonusList": "[{\"Progress\": 20, \"AddStar\": 1}, {\"Progr...",
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

### IdleLiveSpineAnimTrigger.json (0.00 MB, 23 条)

**字段** (2): `TriggerType, AnimGroupPool`

**首条记录摘要**:
```json
{
  "TriggerType": "Idle",
  "AnimGroupPool": "[{\"KCDMPPMHGHD\": 0.6, \"BOJGKMOFMCJ\": 1},..."
}
```

### PlanetFesUnlock.json (0.00 MB, 58 条)

**字段** (3): `UnlockID, FinishWayID, UnlockDesc`

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

### BoxingBreakBuffSelectConfig.json (0.00 MB, 35 条)

**字段** (3): `BoxingClubBuffID, BoxingClubNatureType, ExtraEffectIDList`

**首条记录摘要**:
```json
{
  "BoxingClubBuffID": 3101051,
  "BoxingClubNatureType": "Ice",
  "ExtraEffectIDList": []
}
```

### RecolorConfig.json (0.00 MB, 45 条)

**字段** (3): `ID, DefaultColor, WhiteBGColor`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "DefaultColor": "#ffffffff",
  "WhiteBGColor": "#ffffffff"
}
```

### AmphoreusCurioUIConfig.json (0.00 MB, 7 条)

**字段** (7): `ID, Name, NameAfter, Desc, IconPath, ReplyIDList, TextmapIDList`

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
  "TextmapIDList": "[{\"Hash\": 4033818508597533780}, {\"Hash\":..."
}
```

### CakeRaceConstValueCommon.json (0.00 MB, 36 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "CakeRace_Score_Rank_Ratio_List",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 150}, {\"Int..."
}
```

### FightFestConstValueCommon.json (0.00 MB, 21 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "FightFest_Time_Round_Limit",
  "Value": {
    "IntValue": 5
  }
}
```

### ActivityRaidConfig.json (0.00 MB, 59 条)

**字段** (2): `RaidID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "RaidID": 4000211,
  "ActivityModuleID": 5000105
}
```

### MonopolyQuizTaskConfig.json (0.00 MB, 24 条)

**字段** (3): `QuizTaskID, PriorityPlayerIDList, TaskDesc`

**首条记录摘要**:
```json
{
  "QuizTaskID": 1011,
  "PriorityPlayerIDList": [
    1001,
    1002,
    1211
  ],
  "TaskDesc": {
    "Hash": 4493223943375539433
  }
}
```

### ChallengeBossMazeTierce.json (0.00 MB, 3 条)

**字段** (14): `PHFMCACHFIJ, DLCKKJFMJOB, EMNJGCPDIFF, LCHKKJDBLGM, PHOIICMCGIH, MLMEGBLDFKE, JEBMBCLBIOI, HFIAAGAKFMD, LOJCIDLKPKG, OGEOMCGNNMP, GNGENMHNLAH, IMCMJHAMMKK, EGEEJLHBALB, OGALGHMIIAH`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 30185,
  "DLCKKJFMJOB": 30184,
  "EMNJGCPDIFF": 3013102,
  "LCHKKJDBLGM": [],
  "PHOIICMCGIH": 5,
  "MLMEGBLDFKE": [
    200001
  ],
  "JEBMBCLBIOI": [
    4034013
  ],
  "HFIAAGAKFMD": [
    420464
  ],
  "LOJCIDLKPKG": "[\"Physical\", \"Ice\", \"Thunder\", \"Quantum\"...",
  "OGEOMCGNNMP": [
    5001,
    5002,
    5003
  ],
  "GNGENMHNLAH": 5000,
  "IMCMJHAMMKK": 101713,
  "EGEEJLHBALB": "[{\"ItemID\": 122003}, {\"ItemID\": 1, \"Item...",
  "OGALGHMIIAH": "[{\"ItemID\": 122003}, {\"ItemID\": 1}, {\"It..."
}
```

### GridFightTraitEffect.json (0.00 MB, 24 条)

**字段** (4): `ID, TraitEffectType, TraitEffectJson, TraitEffectIconPath`

**首条记录摘要**:
```json
{
  "ID": 10021,
  "TraitEffectType": "CoreRoleByEquipNum",
  "TraitEffectJson": "",
  "TraitEffectIconPath": "SpriteOutput/GridFight/TraitBuff/GridFig..."
}
```

### FateClazz.json (0.00 MB, 8 条)

**字段** (8): `BKKAOIBLCJG, DOBKKDIECDO, KJKMDFEJIJJ, EMFGEFNHOIB, PMGABBELKNG, KILFKBDMJGI, HOGDKNENKMB, FLLGGNAPJOI`

**首条记录摘要**:
```json
{
  "BKKAOIBLCJG": "Saber",
  "DOBKKDIECDO": 425001,
  "KJKMDFEJIJJ": 1,
  "EMFGEFNHOIB": 100,
  "PMGABBELKNG": {
    "Hash": 8133012097645491228
  },
  "KILFKBDMJGI": "SpriteOutput/Collaboration/Fate/FateTrai...",
  "HOGDKNENKMB": "SpriteOutput/Collaboration/Fate/FateColl...",
  "FLLGGNAPJOI": "SpriteOutput/Collaboration/Fate/FateColl..."
}
```

### RogueRoomType.json (0.00 MB, 9 条)

**字段** (6): `RogueRoomType, RogueRoomTypeTextmapID, RoomTypeDescTextmapID, RogueRoomTypeIcon, MapShowType, RoomIconEffect`

**首条记录摘要**:
```json
{
  "RogueRoomType": 1,
  "RogueRoomTypeTextmapID": {
    "Hash": 4928827656326042325
  },
  "RoomTypeDescTextmapID": {
    "Hash": 7011743375192670848
  },
  "RogueRoomTypeIcon": "SpriteOutput/Rogue/Map/RogueFoeIcon.png",
  "MapShowType": true,
  "RoomIconEffect": "Stages/OriginalResPos/InteractiveProp/Ro..."
}
```

### MazePuzzleWolfBro.json (0.00 MB, 17 条)

**字段** (7): `WolfBroID, PlaneID, FloorID, GroupIDList, MonsterGroupIDList, ControlGroupID, StartState`

**首条记录摘要**:
```json
{
  "WolfBroID": 1,
  "PlaneID": 20311,
  "FloorID": 20311001,
  "GroupIDList": [
    226,
    385
  ],
  "MonsterGroupIDList": [
    385
  ],
  "ControlGroupID": 224,
  "StartState": 1
}
```

### ParkourRailBallSkill.json (0.00 MB, 9 条)

**字段** (8): `ID, Name, Desc, IconPath, VideoID, TutorialID, MiniIconPath, MiniIconBGPath`

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

### ActivityFightGroup.json (0.00 MB, 11 条)

**字段** (8): `ActivityFightGroupID, FightStageTitle, FightStageDesc, ActivityFightGroupIconPath, PlaneID, FloorID, BattleAreaGroupID, BattleAreaID`

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

### RogueTournRecordShowcase.json (0.00 MB, 13 条)

**字段** (5): `AreaID, RankName, RankIconPath, RankIconLargePath, RankTextColor`

**首条记录摘要**:
```json
{
  "AreaID": 201,
  "RankName": {
    "Hash": -1137425449
  },
  "RankIconPath": "SpriteOutput/UI/Rogue/Tourn/Rank/RogueTo...",
  "RankIconLargePath": "SpriteOutput/UI/Rogue/Tourn/Rank/RogueTo...",
  "RankTextColor": "#b48459"
}
```

### RogueTournFormulaAeonIcon.json (0.00 MB, 10 条)

**字段** (5): `BuffTypeID, FormulaIcon, FormulaSubIcon, UltraFormulaIcon, UltraFormulaCardIcon`

**首条记录摘要**:
```json
{
  "BuffTypeID": 120,
  "FormulaIcon": "SpriteOutput/UI/Rogue/Tourn/Tourn1/Formu...",
  "FormulaSubIcon": "SpriteOutput/UI/Rogue/Tourn/Tourn1/Formu...",
  "UltraFormulaIcon": "SpriteOutput/Rogue/Tourn/HoshinoKami/Hos...",
  "UltraFormulaCardIcon": "SpriteOutput/HoshinoKami/HoshinoKami_001..."
}
```

### RogueNousConstValueCommon.json (0.00 MB, 22 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueNous_SlotRarity_UnlockID",
  "Value": {
    "IntValue": 0
  }
}
```

### CakeRaceMessage.json (0.00 MB, 28 条)

**字段** (5): `MessageID, CanPlayerUse, MessageType, CatID, MessageText`

**首条记录摘要**:
```json
{
  "MessageID": 1,
  "CanPlayerUse": true,
  "MessageType": "Special",
  "CatID": 1,
  "MessageText": {
    "Hash": 16900203660680289150
  }
}
```

### MarbleEmoji.json (0.00 MB, 41 条)

**字段** (3): `ID, GroupID, EmojiPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 1,
  "EmojiPath": "SpriteOutput/Emoji/20001.png"
}
```

### RoguePersonaLayerRoom.json (0.00 MB, 60 条)

**字段** (3): `CBCHIHEOEGK, EEPIDJJJMAH, BKHDBIFFIKP`

**首条记录摘要**:
```json
{
  "CBCHIHEOEGK": 103,
  "EEPIDJJJMAH": 1,
  "BKHDBIFFIKP": 9007
}
```

### GridFightLevelV2.json (0.00 MB, 10 条)

**字段** (5): `GridFightLevel, LevelUpExp, AvatarMaxNumber, Rarity1Weight, GeneralPropertyList`

**首条记录摘要**:
```json
{
  "GridFightLevel": 1,
  "LevelUpExp": 2,
  "AvatarMaxNumber": 1,
  "Rarity1Weight": 100,
  "GeneralPropertyList": "[{\"PropertyType\": \"AttackDelta\"}, {\"Prop..."
}
```

### TeamTowersStageGroup.json (0.00 MB, 7 条)

**字段** (9): `PHFMCACHFIJ, DIFINBBBPHM, HPJHKACDIMB, OENAMINOLLF, OHANIOHKHMG, EBLHFPKFNOB, IOLJNBOEIPI, HKPPAJKICII, GMCBNNKJAGJ`

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

### EvolveBuildCardConfig.json (0.00 MB, 11 条)

**字段** (8): `LvID, ID, Type, ItemIcon, ItemMiniIcon, ParamList, Season, CardSelectablePeriod`

**首条记录摘要**:
```json
{
  "LvID": 31067031,
  "ID": 3106703,
  "Type": "Growth",
  "ItemIcon": "SpriteOutput/Quest/EvolveBuild/EvolveBui...",
  "ItemMiniIcon": "SpriteOutput/Quest/EvolveBuild/EvolveBui...",
  "ParamList": [],
  "Season": "EarlyAccess",
  "CardSelectablePeriod": []
}
```

### MapEntranceLD.json (0.00 MB, 18 条)

**字段** (7): `ID, EntranceType, PlaneID, FloorID, BeginMainMissionList, FinishMainMissionList, FinishSubMissionList`

**首条记录摘要**:
```json
{
  "ID": 40447001,
  "EntranceType": "Explore",
  "PlaneID": 40447,
  "FloorID": 40447001,
  "BeginMainMissionList": [],
  "FinishMainMissionList": [],
  "FinishSubMissionList": []
}
```

### TrainPartyRewardConfig.json (0.00 MB, 30 条)

**字段** (4): `Level, RequireStar, RewardID, Name`

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

### GridFightPlayerLevel.json (0.00 MB, 10 条)

**字段** (5): `PlayerLevel, LevelUpExp, AvatarMaxNumber, Rarity1Weight, GeneralPropertyList`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "LevelUpExp": 2,
  "AvatarMaxNumber": 1,
  "Rarity1Weight": 100,
  "GeneralPropertyList": "[{\"PropertyType\": \"AttackDelta\"}, {\"Prop..."
}
```

### GridFightEquipMazebuff.json (0.00 MB, 6 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 3570352302,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_3570352302",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "GridFight_Equipment_SilverWolf999_352302",
  "ParamList": [
    {
      "Value": 0.35
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 817162084146098338
  },
  "BuffDesc": {
    "Hash": 5343609481178583837
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### AvatarEnhancedRank.json (0.00 MB, 20 条)

**字段** (4): `RankID, AvatarID, RankDescBefore, RankDescAfter`

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

**字段** (3): `EventEffectID, EventEffectType, Param1`

**首条记录摘要**:
```json
{
  "EventEffectID": 11,
  "EventEffectType": "UnlockShip",
  "Param1": 1
}
```

### ChallengePeakCommonConst.json (0.00 MB, 29 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChallengePeak_Pre_Quest",
  "Value": {
    "IntValue": 2200506
  }
}
```

### TrackPhotoStage.json (0.00 MB, 6 条)

**字段** (16): `StageID, ActivityModuleID, RaidID, StarList, MaxScore, TotalTrashCanNum, StageName, StageLocation, StageDesc, MainMissionID, JunkNumList, ImagePath, TrackMoveSpeed, Fov, XYRange, DisLimit`

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

### MatchThreeV2Challenger.json (0.00 MB, 10 条)

**字段** (7): `ChallengerID, UnlockBattleItem, StarTargetList, LevelID, ChallengerTitle, ChallengerDesc, ChallengerImage`

**首条记录摘要**:
```json
{
  "ChallengerID": 101,
  "UnlockBattleItem": 1,
  "StarTargetList": [
    10101,
    10102,
    10103
  ],
  "LevelID": 101,
  "ChallengerTitle": {
    "Hash": 1868058960331300005
  },
  "ChallengerDesc": {
    "Hash": 11424130676797109994
  },
  "ChallengerImage": "SpriteOutput/Quest/MatchThree/LevelItem/..."
}
```

### AvatarServantSkillLink.json (0.00 MB, 14 条)

**字段** (5): `SkillID, LinkToAvatarID, TarotFigurePath, TarotIconPath, Order`

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

### MessageItemTextOverride.json (0.00 MB, 26 条)

**字段** (3): `ItemID, MainText, Conditions`

**首条记录摘要**:
```json
{
  "ItemID": 201750013,
  "MainText": {
    "Hash": 10207309115142039176
  },
  "Conditions": "[FinishMainMission:1043710]"
}
```

### CakePerformanceConfig.json (0.00 MB, 12 条)

**字段** (6): `ID, PerformanceName, ActorsList, PerformanceID, MoviePicPath, QuestID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PerformanceName": {
    "Hash": 6056734215849860632
  },
  "ActorsList": [
    1,
    2
  ],
  "PerformanceID": 402080071,
  "MoviePicPath": "SpriteOutput/Train/CakeCatch/CakeCatchSt...",
  "QuestID": 6079001
}
```

### ItemConfigAvatarSkin.json (0.00 MB, 6 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 1100101,
  "ItemMainType": "Usable",
  "ItemSubType": "AvatarSkin",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "isVisible": true,
  "ItemName": {
    "Hash": 1022407058163508865
  },
  "ItemDesc": {
    "Hash": 17127819250941528667
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/Skin/1100101.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/Skin/1100101.pn...",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "SpriteOutput/AvatarShopIcon/AvatarSkin/1...",
  "PileLimit": 1,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### ActivityDiceV2LuckControl.json (0.00 MB, 3 条)

**字段** (13): `GCPIKDBKKHJ, HDJGBKABEKF, OGDLLCOBDNB, DJGJIPEMIGE, JPOEFHLLNIK, JAABDPEPHBF, PENMJDMOCKI, HMHGEJKHPJP, MIECBNMEDGL, OGEBAEGKHNO, OGCDCMNMFIJ, BKGBDEKBMAM, APDKGPIBHCP`

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
  "JPOEFHLLNIK": "[1, 2, 3, 4, 5, 5, 10, 10, 10, 15, 15, 2...",
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
  "MIECBNMEDGL": "[1, 2, 3, 4, 5, 5, 10, 10, 10, 15, 15, 2...",
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
  "APDKGPIBHCP": "[20, 15, 15, 10, 10, 10, 5, 5, 4, 3, 2, ..."
}
```

### AvatarTestPromotionConfig.json (0.00 MB, 455 条)

### DailyActiveConfig.json (0.00 MB, 35 条)

**字段** (3): `Level, DailyActivePoint, DailyActiveReward`

**首条记录摘要**:
```json
{
  "Level": 1,
  "DailyActivePoint": 100,
  "DailyActiveReward": 103101
}
```

### MatchThreeEnvironment.json (0.00 MB, 11 条)

**字段** (6): `EnvironmentID, Name, IconPath, ImagePath, Desc, ParamList`

**首条记录摘要**:
```json
{
  "EnvironmentID": 201,
  "Name": {
    "Hash": 2431352844597698620
  },
  "IconPath": "SpriteOutput/Quest/MatchThree/SpecialChe...",
  "ImagePath": "SpriteOutput/Quest/MatchThree/SpecialChe...",
  "Desc": {
    "Hash": 1799079516979160389
  },
  "ParamList": [
    "MatchThree_Tag_GemPackPieceCount"
  ]
}
```

### IdleLiveEmojiConfig.json (0.00 MB, 28 条)

**字段** (3): `EmojiPhaseID, TextNumRange, Interval`

**首条记录摘要**:
```json
{
  "EmojiPhaseID": 1,
  "TextNumRange": {
    "OOGCAPCIJGN": 1,
    "JLLGOBPAGLD": 5
  },
  "Interval": 5
}
```

### MuseumItemSkillConfig.json (0.00 MB, 22 条)

**字段** (4): `ItemSkillID, Type, TypeParameter, SkillDesc`

**首条记录摘要**:
```json
{
  "ItemSkillID": 1,
  "Type": "StatsNeedDecAbs",
  "TypeParameter": [
    1,
    5
  ],
  "SkillDesc": {
    "Hash": 147789203509417643
  }
}
```

### GridFightPortalMazebuff.json (0.00 MB, 6 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35500127,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_35500127",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_Stage_35500127",
  "ParamList": [],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 4114015859128955217
  },
  "BuffDesc": {
    "Hash": 3818658188270881007
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### TeamTowersPlayerSkill.json (0.00 MB, 7 条)

**字段** (11): `PHFMCACHFIJ, AAGKEBFHLMC, OLOIFNNLKJP, OENAMINOLLF, EJKGHBAGFIB, CNGOPBADLLP, NMAHGFAPENI, GMPGDEINODK, PBLPLDJKPEI, ODEKADIBFAO, MEIFEJGOLJC`

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

### AdvertisingBoardConfig.json (0.00 MB, 41 条)

**字段** (3): `AdvertisingBoardID, IsSwitch, VoiceID`

**首条记录摘要**:
```json
{
  "AdvertisingBoardID": 1001,
  "IsSwitch": true,
  "VoiceID": 100025128
}
```

### IdleLiveFuncUnlockHint.json (0.00 MB, 16 条)

**字段** (5): `ID, FuncUnlockType, Desc, Icon, UnlockId`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FuncUnlockType": "OpenEntryTechTree",
  "Desc": {
    "Hash": 11225328060385880130
  },
  "Icon": "SpriteOutput/Quest/IdleLive/FuctionIcon/...",
  "UnlockId": 2001
}
```

### MarbleMatchTitle.json (0.00 MB, 13 条)

**字段** (9): `ID, Name, Desc, Param, ValueType, Condition, Quality, Priority, PVPScore`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 16602426258341663436
  },
  "Desc": {
    "Hash": 7900271195300718133
  },
  "Param": [],
  "ValueType": "TotalDamage",
  "Condition": "Max",
  "Quality": 3,
  "Priority": 3000,
  "PVPScore": 30
}
```

### ChimeraEndlessWorkRound.json (0.00 MB, 30 条)

**字段** (2): `EndlessRoundID, WorkList`

**首条记录摘要**:
```json
{
  "EndlessRoundID": 1,
  "WorkList": [
    1511,
    1512,
    1513,
    1514,
    1515
  ]
}
```

### GridFightRoleConfig_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `PNPJBPCMINL, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "[{\"PHFMCACHFIJ\": 1001}, {\"PHFMCACHFIJ\": ..."
}
```

### RogueTournHex.json (0.00 MB, 17 条)

**字段** (7): `HexID, TournMode, AvatarDamageType, AvatarType, DisplayID, MazeBuffID, ExtraEffect`

**首条记录摘要**:
```json
{
  "HexID": 1001,
  "TournMode": "Tourn3",
  "AvatarDamageType": [],
  "AvatarType": [
    "Rogue"
  ],
  "DisplayID": 1014,
  "MazeBuffID": 633401,
  "ExtraEffect": []
}
```

### GroupSystemUnlockData.json (0.00 MB, 54 条)

**字段** (2): `GroupSystemUnlockID, UnlockID`

**首条记录摘要**:
```json
{
  "GroupSystemUnlockID": 9916,
  "UnlockID": 9916
}
```

### ActivityDiceAvatarLevel.json (0.00 MB, 3 条)

**字段** (11): `ID, Dice1FramePath, Dice2FramePath, Dice3FramePath, Dice4FramePath, Dice1FramePathUI3D, Dice2FramePathUI3D, Dice3FramePathUI3D, Dice4FramePathUI3D, FrontAndBackUI3DMatPath, SideUI3DMatPath`

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

**字段** (12): `ActivityID, Order, ActivityModuleID, MissionID, RewardQuestID, StartSubMissionID, FinishSubMissionID, Title, Aim01, Aim02, Result01, Result02`

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

### GridFightMazeBuffEnhance.json (0.00 MB, 7 条)

**字段** (6): `ID, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, AbilityName, ParamList`

**首条记录摘要**:
```json
{
  "ID": 100811,
  "EnhanceDesc": {
    "Hash": 8201651410598500061
  },
  "EnhanceName": {
    "Hash": 17491749069671662204
  },
  "EnhanceSimpleDesc": {
    "Hash": 15516065189181892167
  },
  "AbilityName": "StageAbility_GridFight_Origin_1008_Evo_0...",
  "ParamList": [
    {
      "Value": 300
    },
    {
      "Value": 12
    }
  ]
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

### StarFightGoal.json (0.00 MB, 60 条)

**字段** (2): `ID, BattleTargetID`

**首条记录摘要**:
```json
{
  "ID": 6026100,
  "BattleTargetID": 5001104
}
```

### ActivityItemConfigAvatarLD.json (0.00 MB, 6 条)

**字段** (14): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

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
  "Value": "{\"StringValue\": \"SpriteOutput/TabIcon/Co..."
}
```

### FateBattleZone.json (0.00 MB, 12 条)

**字段** (6): `LLKBBKNBNBG, EOFGAIBKBNM, PKGJBPODCOG, BMAJPBPJNGD, ILPOIGJFLFM, JHPNHNFJAJJ`

**首条记录摘要**:
```json
{
  "LLKBBKNBNBG": 1,
  "EOFGAIBKBNM": 1034101,
  "PKGJBPODCOG": 10101,
  "BMAJPBPJNGD": 10102,
  "ILPOIGJFLFM": "SpriteOutput/Collaboration/Fate/BattleSc...",
  "JHPNHNFJAJJ": "SpriteOutput/Collaboration/Fate/BattleSc..."
}
```

### DrinkMakerDecorationData.json (0.00 MB, 10 条)

**字段** (5): `DecorationName, PrefabPath, CupAnchoPath, IconPath, IncludeTagList`

**首条记录摘要**:
```json
{
  "DecorationName": {
    "Hash": 6203471975101717776
  },
  "PrefabPath": "",
  "CupAnchoPath": "",
  "IconPath": "SpriteOutput/Quest/DrinkMaker/ItemIcon/I...",
  "IncludeTagList": [
    300
  ]
}
```

### RaidConfigLD.json (0.00 MB, 4 条)

**字段** (28): `RaidID, RaidTagList, UnlockWorldLevel, Type, MonsterList, MonsterHideList, RaidName, RaidDesc, FinishEntranceID, BuffParamList, TeamLimitIDList, LimitIDList, RecoverType, RewardList, TeamType, TrialAvatarList, MainMissionIDList, MainMissionIDBefore, MainMissionIDAfter, SkipRewardOnFinish, EntrancePageBGImagePath, AutoObtainDamageType, DamageType, RaidTargetID, LockCaptain, LockCaptainAvatarID, EnterType, IsHiddenAreaMap`

**首条记录摘要**:
```json
{
  "RaidID": 40542001,
  "RaidTagList": [],
  "UnlockWorldLevel": [],
  "Type": "Mission",
  "MonsterList": [],
  "MonsterHideList": [],
  "RaidName": {
    "Hash": 5276088358834273782
  },
  "RaidDesc": {
    "Hash": 11291156123449971325
  },
  "FinishEntranceID": 40548004,
  "BuffParamList": [],
  "TeamLimitIDList": [],
  "LimitIDList": [],
  "RecoverType": [
    "Unknown"
  ],
  "RewardList": [
    130040
  ],
  "TeamType": "TrialOnly",
  "TrialAvatarList": [
    1068001,
    1068002
  ],
  "MainMissionIDList": [
    1054401
  ],
  "MainMissionIDBefore": 1054400,
  "MainMissionIDAfter": 1054400,
  "SkipRewardOnFinish": true,
  "EntrancePageBGImagePath": "",
  "AutoObtainDamageType": true,
  "DamageType": [],
  "RaidTargetID": [],
  "LockCaptain": true,
  "LockCaptainAvatarID": 8001,
  "EnterType": "SkipUI",
  "IsHiddenAreaMap": true
}
```

### ChimeraAbilityDisplay.json (0.00 MB, 22 条)

**字段** (3): `DisplayID, AbilityName, AbilityDesc`

**首条记录摘要**:
```json
{
  "DisplayID": 1101,
  "AbilityName": {
    "Hash": 741385176420867737
  },
  "AbilityDesc": {
    "Hash": 1779865618724740722
  }
}
```

### PlayerReturnQuest.json (0.00 MB, 49 条)

**字段** (3): `ID, LinearQuestID, GroupID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LinearQuestID": 1010000,
  "GroupID": 1
}
```

### BoxingClubNatureConfig.json (0.00 MB, 7 条)

**字段** (5): `BoxingClubNatureType, BoxingBuffIcon, BoxingBuffBackground, BoxingBuffIconBackground, NatureIconBackGround`

**首条记录摘要**:
```json
{
  "BoxingClubNatureType": "Wind",
  "BoxingBuffIcon": "SpriteOutput/UI/Nature/IconAttributeMidd...",
  "BoxingBuffBackground": "SpriteOutput/Quest/BoxingClubResonance/A...",
  "BoxingBuffIconBackground": "SpriteOutput/Quest/BoxingClubResonance/A...",
  "NatureIconBackGround": "SpriteOutput/Quest/BoxingClubResonance/A..."
}
```

### RoguePersonaRoomPreset.json (0.00 MB, 34 条)

**字段** (4): `LIIPLGLNPGB, LLICIMBCNPF, AAGKEBFHLMC, FJIKMHCJMKH`

**首条记录摘要**:
```json
{
  "LIIPLGLNPGB": 1001,
  "LLICIMBCNPF": 3,
  "AAGKEBFHLMC": 3,
  "FJIKMHCJMKH": []
}
```

### RogueTournConstClient.json (0.00 MB, 21 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTourn_Workbench_EnhancementIcon",
  "Value": "{\"StringValue\": \"SpriteOutput/Rogue/Rogu..."
}
```

### MonopolyGameResource.json (0.00 MB, 17 条)

**字段** (4): `ResourceID, IconPath, RuleIconPath, IconOutlinePath`

**首条记录摘要**:
```json
{
  "ResourceID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon...",
  "RuleIconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon...",
  "IconOutlinePath": "SpriteOutput/Quest/Monopoly/MonopolyIcon..."
}
```

### ChenLingGameBoyChallenge.json (0.00 MB, 12 条)

**字段** (6): `GameBoyChallengeID, ChallengeType, TextmapMazePuzzle, Parameter1, Parameter2, Parameter3`

**首条记录摘要**:
```json
{
  "GameBoyChallengeID": 1,
  "ChallengeType": "Time",
  "TextmapMazePuzzle": {
    "Hash": 11134269247780150671
  },
  "Parameter1": {
    "IntValue": 20
  },
  "Parameter2": {
    "IntValue": 0
  },
  "Parameter3": {
    "IntValue": 0
  }
}
```

### IdleLiveDungeon.json (0.00 MB, 5 条)

**字段** (16): `ID, UnlockChapterIndex, RewardID, CrystalPerHourIncrease, IncomeHpProgress, MaxHpProgress, BattleTime, Name, Desc, BossFigurePath, ChatPhase, BossIconPath, MonsterFigure, BGMState, RecommondTagList, StageID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "UnlockChapterIndex": 1,
  "RewardID": 8017501,
  "CrystalPerHourIncrease": 200,
  "IncomeHpProgress": 30,
  "MaxHpProgress": 99,
  "BattleTime": 60,
  "Name": {
    "Hash": 16618076712521002778
  },
  "Desc": {
    "Hash": 530010504373771887
  },
  "BossFigurePath": "SpriteOutput/MonsterMiddleIcon/Monster_8...",
  "ChatPhase": 1007,
  "BossIconPath": "SpriteOutput/MonsterRoundIcon/Monster_80...",
  "MonsterFigure": "SpriteOutput/MonsterFigure/Monster_80250...",
  "BGMState": "State_Menu_Season_Herta_Space_Station_Ba...",
  "RecommondTagList": [
    "Assault"
  ],
  "StageID": 88881
}
```

### RogueMonsterEliteDropItem.json (0.00 MB, 27 条)

**字段** (2): `MonsterEliteDropItemID, MonsterEliteDropItemDisplayList`

**首条记录摘要**:
```json
{
  "MonsterEliteDropItemID": 101,
  "MonsterEliteDropItemDisplayList": [
    2,
    231,
    111000
  ]
}
```

### FateExpReward.json (0.00 MB, 30 条)

**字段** (4): `AAGKEBFHLMC, PJNNPOKJEFD, KNIMCDCHFFN, DOHPJPEMDON`

**首条记录摘要**:
```json
{
  "AAGKEBFHLMC": 1,
  "PJNNPOKJEFD": 100,
  "KNIMCDCHFFN": 3151201,
  "DOHPJPEMDON": 3151301
}
```

### ChenLingBuilding.json (0.00 MB, 10 条)

**字段** (6): `ID, InitialMaxLevel, Name, Desc, ModelPath, SmallIconPath`

**首条记录摘要**:
```json
{
  "ID": 2,
  "InitialMaxLevel": 3,
  "Name": {
    "Hash": 16463610559373664517
  },
  "Desc": {
    "Hash": 16361097018847489612
  },
  "ModelPath": "UI/UI3D/ActivityChenLingBattle/Prefab/Ch...",
  "SmallIconPath": "SpriteOutput/Quest/ActivityChenLing/Buil..."
}
```

### ActivityRaidOrder.json (0.00 MB, 6 条)

**字段** (6): `OrderID, OrderContent, OrderGoodList, OrderShip, OrderTipsTime, OrderTips`

**首条记录摘要**:
```json
{
  "OrderID": 2001,
  "OrderContent": "[{\"GoodsID\": 102, \"GoodsCnt\": 3}, {\"Good...",
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

### MonsterCamp.json (0.00 MB, 18 条)

**字段** (5): `ID, SortID, Name, IconPath, CampType`

**首条记录摘要**:
```json
{
  "ID": 6,
  "SortID": 1,
  "Name": {
    "Hash": 11373287202780603548
  },
  "IconPath": "SpriteOutput/TabIcon/Camp/CampAntimatter...",
  "CampType": "Monster"
}
```

### MultiplayConstValueClient.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "MatchThree_Royale_VSDialog_WaitSec",
  "Value": {
    "IntValue": 5
  }
}
```

### SpaceZooMutationMaterial.json (0.00 MB, 15 条)

**字段** (6): `ItemID, ChangeChannelList, ChangeFeatureList, UnlockMissionID, ExchangeCost, FeatureConditionList`

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

### CutsceneProp.json (0.00 MB, 15 条)

**字段** (4): `PropID, PropModelPath, ResidentEffectKey, ResidentPossessionKey`

**首条记录摘要**:
```json
{
  "PropID": "Prop_Chess_00",
  "PropModelPath": "Props/Outputs/Cutscene/Chap01_Act020/Pro...",
  "ResidentEffectKey": "",
  "ResidentPossessionKey": ""
}
```

### RelicExpType.json (0.00 MB, 64 条)

**字段** (2): `TypeID, Exp`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Exp": 170
}
```

### RndOptionsData.json (0.00 MB, 13 条)

**字段** (6): `ID, GroupID, MenuItemID, MenuItemType, JsonPath, Weight`

**首条记录摘要**:
```json
{
  "ID": 10001001,
  "GroupID": "Pam",
  "MenuItemID": 406000100,
  "MenuItemType": {
    "EnumIndex": 20,
    "Value": 10
  },
  "JsonPath": "Config/Level/Mission/4060000/Act/Act4060...",
  "Weight": 10
}
```

### TrackPhotoNpcConfig.json (0.00 MB, 34 条)

**字段** (4): `NpcID, GroupID, StageID, CanTypeID`

**首条记录摘要**:
```json
{
  "NpcID": 400002,
  "GroupID": 19,
  "StageID": 2,
  "CanTypeID": "SilverCan"
}
```

### PlayerPersonalCard.json (0.00 MB, 6 条)

**字段** (7): `CardID, ReplaceIconPath, CardPrefabPath, FriendPrefabPath, SupportPrefabPath, ChatPrefabPath, ShowType`

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

### TeamBuildGroupConfig.json (0.00 MB, 29 条)

**字段** (2): `GroupID, AvatarIDList`

**首条记录摘要**:
```json
{
  "GroupID": 101,
  "AvatarIDList": "[1409, 1414, 1222, 1304, 1217, 1208, 120..."
}
```

### ChimeraDuelMasterChallenge.json (0.00 MB, 13 条)

**字段** (5): `ChallengeID, MasterID, MasterRankLevel, PresetIDList, MasterHeadIconPath`

**首条记录摘要**:
```json
{
  "ChallengeID": 900001,
  "MasterID": 601,
  "MasterRankLevel": 1,
  "PresetIDList": [
    16011,
    16012,
    16013,
    16014,
    16015
  ],
  "MasterHeadIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1409..."
}
```

### ChenLingConstValueCommon.json (0.00 MB, 23 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_ChenLing_RefreshCost",
  "Value": {
    "ArrayValue": [
      {
        "IntValue": 5
      }
    ]
  }
}
```

### RogueAeon.json (0.00 MB, 9 条)

**字段** (10): `AeonID, RogueVersion, Sort, DisplayID, EffectDesc1, EffectDesc2, RogueBuffType, ArrivedTalkDialogueGroupID, BattleEventBuffGroup, BattleEventEnhanceBuffGroup`

**首条记录摘要**:
```json
{
  "AeonID": 1,
  "RogueVersion": 1,
  "Sort": 1,
  "DisplayID": 1,
  "EffectDesc1": {
    "Hash": 12237892320685312009
  },
  "EffectDesc2": {
    "Hash": 14252607361796843381
  },
  "RogueBuffType": 120,
  "ArrivedTalkDialogueGroupID": 403000189,
  "BattleEventBuffGroup": 12004,
  "BattleEventEnhanceBuffGroup": 12005
}
```

### FateDifficulty.json (0.00 MB, 7 条)

**字段** (8): `DJHMIDECBMH, LMPLLJFMFEC, IJEJGCEAFAF, JGBCKHKPPCA, MCPJKENJILA, PGLIPCKDFNB, FAEHFMIFPBG, DEIGIJJFOAK`

**首条记录摘要**:
```json
{
  "DJHMIDECBMH": 1,
  "LMPLLJFMFEC": [
    300,
    250,
    200,
    175,
    150,
    125,
    100,
    0
  ],
  "IJEJGCEAFAF": {
    "Hash": 4640659226320055193
  },
  "JGBCKHKPPCA": [],
  "MCPJKENJILA": {
    "Hash": 8977523863283992778
  },
  "PGLIPCKDFNB": [],
  "FAEHFMIFPBG": 3151102,
  "DEIGIJJFOAK": {
    "Hash": 1659005832825893567
  }
}
```

### ScoringGroup.json (0.00 MB, 20 条)

**字段** (3): `ScoringGroupID, DisplayType, ScoringIDList`

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

### IdleLiveEquipRarity.json (0.00 MB, 7 条)

**字段** (6): `Rarity, RarityIcon, RarityBg, StateName, OrbEffectPath, SpEquipPowerFactor`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "RarityIcon": "SpriteOutput/ItemIcon/Rarity/FrameItemRa...",
  "RarityBg": "SpriteOutput/ItemIcon/Rarity/FrameItemRa...",
  "StateName": "Rarity1",
  "OrbEffectPath": "Effects/Eff_Prefab/Eff_ActivityProp/Eff_...",
  "SpEquipPowerFactor": {
    "Value": 1
  }
}
```

### BattlePassConstValue.json (0.00 MB, 22 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "BP_Level_Exp",
  "Value": {
    "IntValue": 800
  }
}
```

### ChallengeMazeRewardLine.json (0.00 MB, 45 条)

**字段** (3): `GroupID, StarCount, RewardID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "StarCount": 3,
  "RewardID": 101101
}
```

### IdleLiveGacha.json (0.00 MB, 6 条)

**字段** (8): `GachaID, UpgradeCount, CrystalProbability, StarProbabilityList, WorldTagList, IsStarUp, IsAvatarGroupUp, GachaName`

**首条记录摘要**:
```json
{
  "GachaID": 1,
  "UpgradeCount": 30,
  "CrystalProbability": {
    "Value": 0.8
  },
  "StarProbabilityList": "[{\"Value\": 0.2}, {\"Value\": 0}, {\"Value\":...",
  "WorldTagList": [
    1
  ],
  "IsStarUp": true,
  "IsAvatarGroupUp": true,
  "GachaName": {
    "Hash": 4385135621580189899
  }
}
```

### PlanetFesRegionPhase.json (0.00 MB, 10 条)

**字段** (7): `PhaseID, ProgressValue, BuffID, PicPath, Name, Description, EffectDesc`

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

### AvatarTestStatusConfig.json (0.00 MB, 398 条)

### RogueTournAdventureRoom.json (0.00 MB, 32 条)

**字段** (3): `RoomID, AdventureType, ParamGroupID`

**首条记录摘要**:
```json
{
  "RoomID": 21098010,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
}
```

### MuseumTarget.json (0.00 MB, 17 条)

**字段** (7): `TargetID, MuseumMissionList, Order, TriggerTurns, TriggerPhase, RewardType, TypeParameter`

**首条记录摘要**:
```json
{
  "TargetID": 1,
  "MuseumMissionList": [
    11
  ],
  "Order": 1,
  "TriggerTurns": 3,
  "TriggerPhase": 1,
  "RewardType": "Staff",
  "TypeParameter": 250119
}
```

### MusicRhythmSong.json (0.00 MB, 4 条)

**字段** (16): `ID, UnlockType, UnlockTypeParam, GridNum, GridNumList, MixingWaveMatPath, BGMMenuState, BGMStageState, SongName, TrackIDList, PresetIDList, GridTransitionTime, PresetStartGrid, PresetEndGrid, SoundEffectUnlockSubMission, SoundEffectIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "UnlockType": 3,
  "UnlockTypeParam": 802610216,
  "GridNum": 10,
  "GridNumList": [
    2,
    3,
    3,
    4,
    4,
    2,
    2,
    4,
    2,
    2,
    2,
    3
  ],
  "MixingWaveMatPath": "UI/Materials/Quest/MusicRhythm/UI_MusicM...",
  "BGMMenuState": "State_Menu_Season_MusicPruduction_Jrock",
  "BGMStageState": "MusicRhythm_OrigamiUniversity_Stage_Jroc...",
  "SongName": {
    "Hash": 7615120814171282351
  },
  "TrackIDList": [
    11,
    12,
    13
  ],
  "PresetIDList": [
    1,
    2
  ],
  "GridTransitionTime": 412,
  "PresetStartGrid": 1,
  "PresetEndGrid": 12,
  "SoundEffectUnlockSubMission": 802610423,
  "SoundEffectIDList": [
    11,
    12,
    13,
    14
  ]
}
```

### TravelBrochureDiaryGroup.json (0.00 MB, 18 条)

**字段** (4): `ID, ChoiceIDList, TextIDList, DiaryDescription`

**首条记录摘要**:
```json
{
  "ID": 101,
  "ChoiceIDList": [],
  "TextIDList": "[10101, 10102, 10103, 10104, 10105, 1010...",
  "DiaryDescription": {
    "Hash": 2014329979317590681
  }
}
```

### GridFightSelectEnhance.json (0.00 MB, 7 条)

**字段** (9): `ID, TraitEffectID, Cost, ParamList, EffectParamList, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "TraitEffectID": 30021,
  "Cost": 5,
  "ParamList": [
    0.1
  ],
  "EffectParamList": [
    {
      "Value": 0.1
    }
  ],
  "EnhanceDesc": {
    "Hash": 9471695125908847210
  },
  "EnhanceName": {
    "Hash": 12256906291438327544
  },
  "EnhanceSimpleDesc": {
    "Hash": 2082898599205552085
  },
  "IconPath": "SpriteOutput/GridFight/TraitTargetEffect..."
}
```

### DrinkMakerCheersGroup.json (0.00 MB, 6 条)

**字段** (7): `GroupID, NextGroupID, PrimaryDrinkID, IngredientList, AvatarRequestHeadIcon, HeadbookHeadIcon, TutorialGuideGroupID`

**首条记录摘要**:
```json
{
  "GroupID": 1000,
  "NextGroupID": 3,
  "PrimaryDrinkID": 1,
  "IngredientList": [
    1000,
    1001,
    1002,
    1003,
    1004
  ],
  "AvatarRequestHeadIcon": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "HeadbookHeadIcon": "",
  "TutorialGuideGroupID": 10000
}
```

### ChimeraWorkDisplay.json (0.00 MB, 35 条)

**字段** (2): `DisplayID, WorkName`

**首条记录摘要**:
```json
{
  "DisplayID": 501,
  "WorkName": {
    "Hash": 18120990285137646372
  }
}
```

### AlleyShop.json (0.00 MB, 10 条)

**字段** (5): `ShopID, ShopGoods, ShopBox, ShopEnergy, EnergyColor`

**首条记录摘要**:
```json
{
  "ShopID": 101,
  "ShopGoods": "[{\"GoodsID\": 101, \"Num\": 1}, {\"GoodsID\":...",
  "ShopBox": 3,
  "ShopEnergy": 30,
  "EnergyColor": [
    6,
    11
  ]
}
```

### GridFightTraitThreshold.json (0.00 MB, 27 条)

**字段** (3): `ID, Level, IconPath`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "Level": 1,
  "IconPath": "SpriteOutput/GridFight/BuffItem/GridFigh..."
}
```

### MarbleSealGroup.json (0.00 MB, 39 条)

**字段** (2): `ID, SealList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SealList": [
    202,
    203,
    202
  ]
}
```

### ReShaRouteDisplay.json (0.00 MB, 6 条)

**字段** (9): `ID, RouteName, RoutePanelPrefab, AssistantItemID, NoClueHint, HintText, AssistantImagePanelPrefab, HiddenRouteUnlockFloorSavedValueKey, HiddenRouteClearFloorSavedValueKey`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RouteName": {
    "Hash": 11873791313872570499
  },
  "RoutePanelPrefab": "UI/Maze/MiniGame/Widget/MiniGameReShaInf...",
  "AssistantItemID": 190648,
  "NoClueHint": {
    "Hash": 15458415693727481122
  },
  "HintText": {
    "Hash": 18395734573091619423
  },
  "AssistantImagePanelPrefab": "UI/Maze/MiniGame/Widget/MiniGameReshaGui...",
  "HiddenRouteUnlockFloorSavedValueKey": "EasterA1",
  "HiddenRouteClearFloorSavedValueKey": "EasterA1Phase"
}
```

### AetherDivideGymInfo.json (0.00 MB, 4 条)

**字段** (14): `ID, EntranceID, ActivityModuleID, ChallengeQuestList, Name, Description, IconPath, TabIconPath, BGPath, SpiritQuest, TrainerQuest, UnlockID, BadgeUnlockID, DisplayMonsterMap`

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
  "DisplayMonsterMap": "{\"7003030\": 1, \"7003010\": 1, \"7002070\": ..."
}
```

### AvatarEnhancedHintConfig.json (0.00 MB, 10 条)

**字段** (9): `SeasonID, AvatarID, EnhancedID, TrialStageID, PreviewModuleID, EnhancedDescNum, EnhancedDesc1, EnhancedDesc2, EnhancedDesc3`

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

**字段** (9): `BEIFJFDOEND, PLBGKDFKCAA, ADAIMBJKPND, JNGDPJMPNKF, LICNLIMAGHF, DGFMCMDNJLC, CJNNJCBJOHP, EOPMMKLODKL, AMHCLPKEAAK`

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

### MultiplayMatchThreeItem.json (0.00 MB, 8 条)

**字段** (8): `BattleItemID, ItemName, ItemDesc, ItemIcon, PropType, InputGridCount, ItemHint, ItemUseFailHint`

**首条记录摘要**:
```json
{
  "BattleItemID": 1,
  "ItemName": {
    "Hash": 478996712735799061
  },
  "ItemDesc": {
    "Hash": 10483042712655200107
  },
  "ItemIcon": "SpriteOutput/ItemIcon/140342.png",
  "PropType": "BreakPiece",
  "InputGridCount": 1,
  "ItemHint": {
    "Hash": 11321489462393644105
  },
  "ItemUseFailHint": {
    "Hash": 9243752854117156495
  }
}
```

### TeamTowersBubbleGroup.json (0.00 MB, 37 条)

**字段** (2): `PHFMCACHFIJ, DEMJCAMBEDN`

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

### PerformanceCG.json (0.00 MB, 13 条)

**字段** (6): `PerformanceID, PerformancePath, IsSkip, PerformanceCharacter, PlaneID, FloorID`

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

### ActivityDiceRankConfig.json (0.00 MB, 5 条)

**字段** (6): `DiceRankID, RankMaxScore, Name, IconPath, IconSmallPath, RuleGroupMapList`

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
  "RuleGroupMapList": "[{\"LJHECKCGJCJ\": 2, \"PDOJDPDCJOH\": 11012..."
}
```

### MainMissionType.json (0.00 MB, 6 条)

**字段** (7): `TypeName, TypePriority, TypeIcon, TypeIconMini, MenuItemIcon, TypeColor, TypeChapterColor`

**首条记录摘要**:
```json
{
  "TypeName": {
    "Hash": 4262575404395154898
  },
  "TypePriority": 1,
  "TypeIcon": "SpriteOutput/TabIcon/Quest/QuestAllIcon....",
  "TypeIconMini": "SpriteOutput/Mission/TypeIcon/AllTasksIc...",
  "MenuItemIcon": "SpriteOutput/TalkIcon/SpecialChatMission...",
  "TypeColor": "#ffffff",
  "TypeChapterColor": "#ffffff"
}
```

### RestaurantContactsConfig.json (0.00 MB, 22 条)

**字段** (3): `ContactsID, Name, IconPath`

**首条记录摘要**:
```json
{
  "ContactsID": 1402,
  "Name": {
    "Hash": 3766440365158960317
  },
  "IconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1402..."
}
```

### DifficultyAdjustmentStage.json (0.00 MB, 41 条)

**字段** (2): `ID, EventIDs`

**首条记录摘要**:
```json
{
  "ID": 20003011,
  "EventIDs": [
    20003011
  ]
}
```

### RogueMagicConstCommon.json (0.00 MB, 14 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueMagic_UnitCompose",
  "Value": {
    "IntValue": 3
  }
}
```

### DrinkMakerCupData.json (0.00 MB, 6 条)

**字段** (10): `CupID, CupName, Type, Capacity, PrefabPath, IconPath, AudioEvent, IceCount, PerLayerHeight, IncludeTagList`

**首条记录摘要**:
```json
{
  "CupID": 31,
  "CupName": {
    "Hash": 9805611165342121575
  },
  "Type": "SmallCup",
  "Capacity": 3,
  "PrefabPath": "Gameplays/FrightmareDrinkMaker/Prefab/Cu...",
  "IconPath": "SpriteOutput/Quest/DrinkMaker/ItemIcon/C...",
  "AudioEvent": "Ev_sfx_blending_wineglass_01",
  "IceCount": [
    1,
    3
  ],
  "PerLayerHeight": [
    0.36,
    0.33,
    0.31
  ],
  "IncludeTagList": [
    101
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

**字段** (3): `QuestID, IconPath, FigurePath`

**首条记录摘要**:
```json
{
  "QuestID": 6000019,
  "IconPath": "SpriteOutput/UI/Quest/Graffit/GraffitiPh...",
  "FigurePath": "SpriteOutput/UI/Quest/Graffit/GraffitiPh..."
}
```

### ActivityMultiplayerConfig.json (0.00 MB, 6 条)

**字段** (9): `ActivityID, ActivityModuleID, GuideVideoID, CompleteCondition, CurrentModuleID, DisplayModuleID, ProgramGroupID, CardImgPath, CardColor`

**首条记录摘要**:
```json
{
  "ActivityID": 50114,
  "ActivityModuleID": 5011401,
  "GuideVideoID": 5011412,
  "CompleteCondition": "[{\"Type\": \"FinishMainMission\", \"Param\": ...",
  "CurrentModuleID": 5011401,
  "DisplayModuleID": 5011402,
  "ProgramGroupID": 3006,
  "CardImgPath": "SpriteOutput/Train/OnlineGameEntrance/Ga...",
  "CardColor": "SpriteOutput/Train/OnlineGameEntrance/Ga..."
}
```

### PlanetFesBuffSource.json (0.00 MB, 16 条)

**字段** (4): `ID, Type, Name, IconPath`

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

### CakeRaceBattleItem.json (0.00 MB, 5 条)

**字段** (9): `BattleItemID, BattleItemName, BattleItemDesc, BattleItemIcon, BattleItemInvalidIcon, BattleItemUseType, BattleItemUseHint, AbilityJson, BattleItemEffectParamList`

**首条记录摘要**:
```json
{
  "BattleItemID": 1,
  "BattleItemName": {
    "Hash": 2605676646647575486
  },
  "BattleItemDesc": {
    "Hash": 7195564694666691740
  },
  "BattleItemIcon": "SpriteOutput/Quest/CakeRace/SkillIcon/Ca...",
  "BattleItemInvalidIcon": "SpriteOutput/Quest/CakeRace/SkillIcon/Ca...",
  "BattleItemUseType": "Ground",
  "BattleItemUseHint": {
    "Hash": 3836135111649270773
  },
  "AbilityJson": "Config/Gameplays/LittleGame/CakeRace/Abi...",
  "BattleItemEffectParamList": []
}
```

### MazePropLD.json (0.00 MB, 6 条)

**字段** (12): `ID, PropType, PropIconPath, BoardShowList, ConfigEntityPath, DamageTypeList, MiniMapStateIcons, JsonPath, PropStateList, PerformanceType, HasRendererComponent, LodPriority`

**首条记录摘要**:
```json
{
  "ID": 105209,
  "PropType": "PROP_ORDINARY",
  "PropIconPath": "",
  "BoardShowList": [],
  "ConfigEntityPath": "Config/ConfigEntity/Props/Chap05/Prop_Ch...",
  "DamageTypeList": [],
  "MiniMapStateIcons": [],
  "JsonPath": "Config/Props/Chap05/Prop_Chap05_BlackBoa...",
  "PropStateList": [
    "Closed",
    "Open"
  ],
  "PerformanceType": "B",
  "HasRendererComponent": true,
  "LodPriority": 1
}
```

### MatchThreeV2SpecialRule.json (0.00 MB, 19 条)

**字段** (3): `SpecialRuleID, Icon, Desc`

**首条记录摘要**:
```json
{
  "SpecialRuleID": 1,
  "Icon": "SpriteOutput/Quest/MatchThree/Chess/Spec...",
  "Desc": {
    "Hash": 5859186307309541393
  }
}
```

### ActivityRewardRogueEndless.json (0.00 MB, 20 条)

**字段** (4): `RewardLevel, RewardPoint, RewardID, RewardLevelName`

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

### TreasureDungeonGridBuff.json (0.00 MB, 15 条)

**字段** (5): `GridBuffID, Type, TypeParam, GridBuffMaxLevel, Desc`

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

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 1000001,
  "BeginTime": "2023-04-17 04:00:00",
  "EndTime": "2023-06-05 03:59:59"
}
```

### CurrencyDisplayConfig.json (0.00 MB, 85 条)

**字段** (2): `CurrencyID, GotoID`

**首条记录摘要**:
```json
{
  "CurrencyID": 1,
  "GotoID": 3800
}
```

### MazePlaneLD.json (0.00 MB, 11 条)

**字段** (8): `PlaneID, PlaneType, SubType, MazePoolType, WorldID, PlaneName, StartFloorID, FloorIDList`

**首条记录摘要**:
```json
{
  "PlaneID": 40445,
  "PlaneType": "Raid",
  "SubType": 1,
  "MazePoolType": 1,
  "WorldID": 101,
  "PlaneName": {
    "Hash": 13013349132478528449
  },
  "StartFloorID": 40445001,
  "FloorIDList": [
    40445001
  ]
}
```

### ChimeraTeam.json (0.00 MB, 9 条)

**字段** (6): `TeamID, TeamIcon, TeamAvatarIcon, TeamName, TeamConfigJson, RoundTalkMap`

**首条记录摘要**:
```json
{
  "TeamID": 1,
  "TeamIcon": "SpriteOutput/Quest/Chimera/ChimeraTeamIc...",
  "TeamAvatarIcon": "SpriteOutput/Quest/Chimera/ChimeraTraine...",
  "TeamName": "ChimeraTeam_TeamName_1",
  "TeamConfigJson": "",
  "RoundTalkMap": {
    "12": 11201
  }
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

### GridFightBinaryNodeRule.json (0.00 MB, 44 条)

**字段** (3): `ID, Quality, PerformLevel`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Quality": 1,
  "PerformLevel": 1
}
```

### RogueTournContentDisplay.json (0.00 MB, 30 条)

**字段** (2): `DisplayID, DisplayContent`

**首条记录摘要**:
```json
{
  "DisplayID": 801,
  "DisplayContent": {
    "Hash": 3412936056238852280
  }
}
```

### GridFightTutorialStage.json (0.00 MB, 2 条)

**字段** (9): `DivisionID, RewardQuest, TutorialStageName, IsAlltrial, ForbiddenBattleFail, ForbiddenSellRoleBeforeChapterId, ForbiddenSellRoleBeforeSectionId, ForbiddenSellRoleList, ForbiddenAutoOpenShopNodeList`

**首条记录摘要**:
```json
{
  "DivisionID": 1,
  "RewardQuest": 7303101,
  "TutorialStageName": {
    "Hash": 17835817723450284223
  },
  "IsAlltrial": 1,
  "ForbiddenBattleFail": 1,
  "ForbiddenSellRoleBeforeChapterId": 1,
  "ForbiddenSellRoleBeforeSectionId": 7,
  "ForbiddenSellRoleList": "[{\"GAJICDKPHPA\": 1220, \"BDCOFIOCJFO\": 1}...",
  "ForbiddenAutoOpenShopNodeList": "[{\"EEBLMLAEFHO\": 1, \"IMDPJFEGIDF\": 1}, {..."
}
```

### ExpeditionAssigner.json (0.00 MB, 30 条)

**字段** (2): `AssignerID, AssignerName`

**首条记录摘要**:
```json
{
  "AssignerID": 1001,
  "AssignerName": {
    "Hash": 7418314293190794404
  }
}
```

### ActivityDiceV2Robot.json (0.00 MB, 17 条)

**字段** (5): `PHFMCACHFIJ, FIGEGOBFPIF, OENAMINOLLF, IBLFDGEHJBK, LCBCODGENJD`

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

### SwordTrainingPartner.json (0.00 MB, 7 条)

**字段** (5): `PartnerID, PartnerName, PartnerAbilityIDList, PartnerImage, AvatarID`

**首条记录摘要**:
```json
{
  "PartnerID": 1,
  "PartnerName": {
    "Hash": 9717664300024737687
  },
  "PartnerAbilityIDList": "[1101, 1102, 1103, 1104, 1105, 1106, 110...",
  "PartnerImage": "SpriteOutput/AvatarShopIcon/Avatar/1217....",
  "AvatarID": 1217
}
```

### ChenLingCardPreCheck.json (0.00 MB, 18 条)

**字段** (5): `ID, UseCardType, TargetGridType, ConditionType, Toast`

**首条记录摘要**:
```json
{
  "ID": 2,
  "UseCardType": "Soldier",
  "TargetGridType": "Soldier",
  "ConditionType": "SameID",
  "Toast": {
    "Hash": 14502428434859331236
  }
}
```

### AvatarMazeBuffLD.json (0.00 MB, 4 条)

**字段** (20): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffDescParamByAvatarSkillID, BuffIcon, BuffName, BuffDesc, BuffDescBattle, BuffEffect, MazeBuffType, UseType, MazeBuffIconType, MazeBuffPool, DisplayType`

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

### PlanetFesBuffDescOverride.json (0.00 MB, 33 条)

**字段** (2): `ID, Decription`

**首条记录摘要**:
```json
{
  "ID": 70001,
  "Decription": {
    "Hash": 8216729816190751722
  }
}
```

### ActivityTelevisionQuest.json (0.00 MB, 12 条)

**字段** (4): `QuestGroupID, QuestIDList, OriginalTabName, TabName`

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

### AvatarAbilityStatistics.json (0.00 MB, 24 条)

**字段** (2): `AvatarID, ExtractionAbilityList`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "ExtractionAbilityList": "[\"Avatar_Mar_7th_00_PassiveSkill01_Inser..."
}
```

### GridFightEquipTag.json (0.00 MB, 32 条)

**字段** (2): `TagID, EquipTagDesc`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "EquipTagDesc": {
    "Hash": 16237398910470728219
  }
}
```

### RoguePersonaRoomComposition.json (0.00 MB, 54 条)

**字段** (2): `LLICIMBCNPF, AAGKEBFHLMC`

**首条记录摘要**:
```json
{
  "LLICIMBCNPF": 1,
  "AAGKEBFHLMC": 1
}
```

### IdleLivePowerbyTag.json (0.00 MB, 21 条)

**字段** (2): `AvatarTag, Num`

**首条记录摘要**:
```json
{
  "AvatarTag": "Assault",
  "Num": 1
}
```

### ItemRarityConfig.json (0.00 MB, 5 条)

**字段** (9): `Rarity, AvatarShowBgPath, ItemShowBgPath, FrameItemRarityPath, FrameIconRarityPath, FrameItemRarityBgPath, FrameItemRarityColor, LineItemRarityColor, ItemRarityStarImgPath`

**首条记录摘要**:
```json
{
  "Rarity": "Normal",
  "AvatarShowBgPath": "",
  "ItemShowBgPath": "",
  "FrameItemRarityPath": "SpriteOutput/ItemIcon/Rarity/FrameItemRa...",
  "FrameIconRarityPath": "SpriteOutput/ItemIcon/Rarity/FrameIconRa...",
  "FrameItemRarityBgPath": "SpriteOutput/ItemIcon/Rarity/FrameItemRa...",
  "FrameItemRarityColor": "#cdcdd8",
  "LineItemRarityColor": "#8f8f9a",
  "ItemRarityStarImgPath": "SpriteOutput/ItemIcon/Rarity/ItemRarityS..."
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

### RogueMagicUnlock.json (0.00 MB, 30 条)

**字段** (3): `RogueUnlockID, UnlockFinishWay, RogueUnlockDetail`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 5013001,
  "UnlockFinishWay": 5013001,
  "RogueUnlockDetail": {
    "Hash": 2368115733644224361
  }
}
```

### MonsterTestStatusConfig.json (0.00 MB, 347 条)

### OfferingUIPageConfig.json (0.00 MB, 14 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 7000775562918729249
  }
}
```

### MarbleRoundCustomBuff.json (0.00 MB, 27 条)

**字段** (4): `ID, Round, BuffList, EnemySelectBuff`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Round": 1,
  "BuffList": [
    4,
    22,
    26
  ],
  "EnemySelectBuff": 30
}
```

### RestaurantProductConfig.json (0.00 MB, 17 条)

**字段** (5): `ProductID, Name, IsCrops, UnlockIDList, ItemID`

**首条记录摘要**:
```json
{
  "ProductID": 201,
  "Name": {
    "Hash": 10332571355435105917
  },
  "IsCrops": true,
  "UnlockIDList": [],
  "ItemID": 260013
}
```

### InventorySortType.json (0.00 MB, 27 条)

**字段** (2): `SortType, SortTypeName`

**首条记录摘要**:
```json
{
  "SortType": "Count",
  "SortTypeName": {
    "Hash": 9080344861401396811
  }
}
```

### LoadingImage.json (0.00 MB, 29 条)

**字段** (2): `ID, ImagePath`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "ImagePath": "SpriteOutput/LoadingPic/LoadingIcon/Load..."
}
```

### RogueDLCSubStoryGroup.json (0.00 MB, 14 条)

**字段** (4): `SubStoryGroupID, ShowGroup, SubStoryList, SubStoryGroupName`

**首条记录摘要**:
```json
{
  "SubStoryGroupID": 1,
  "ShowGroup": 1,
  "SubStoryList": [
    101,
    102,
    103
  ],
  "SubStoryGroupName": {
    "Hash": 1565402620980138204
  }
}
```

### HeliobusSkill.json (0.00 MB, 8 条)

**字段** (8): `HeliobusSkillID, UnlockMissionID, UnlockToastMissionID, RelatedEventID, SkillUIPosition, BGDescription, SkillIconPath, SkillEffect`

**首条记录摘要**:
```json
{
  "HeliobusSkillID": 10001,
  "UnlockMissionID": 801515001,
  "UnlockToastMissionID": 801515001,
  "RelatedEventID": 10001,
  "SkillUIPosition": 1,
  "BGDescription": {
    "Hash": 9267377376250852867
  },
  "SkillIconPath": "SpriteOutput/SkillIcons/Heliobus/Heliobu...",
  "SkillEffect": "AoEAttack"
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

### ChenLingPrivilege.json (0.00 MB, 10 条)

**字段** (6): `ID, Cost, NextIDList, IconPath, Name, SkillDesc`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Cost": 1,
  "NextIDList": [
    5,
    6
  ],
  "IconPath": "SpriteOutput/GridFight/AugmentBig/102401...",
  "Name": {
    "Hash": 5547741589587730195
  },
  "SkillDesc": {
    "Hash": 7675474127227023709
  }
}
```

### ActivityPhotoExhibition.json (0.00 MB, 9 条)

**字段** (4): `GroupID, ActivityModuleID, PhotoID, CommentList`

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

### RogueNousAeon.json (0.00 MB, 9 条)

**字段** (9): `AeonID, Sort, RogueBuffType, EffectType1, EffectParam1, EffectDesc1, BattleEventBuffGroup, BattleEventEnhanceBuffGroup, DisplayID`

**首条记录摘要**:
```json
{
  "AeonID": 1,
  "Sort": 1,
  "RogueBuffType": 120,
  "EffectType1": "AddMazeBuff",
  "EffectParam1": [
    650100
  ],
  "EffectDesc1": {
    "Hash": 10800985423518996997
  },
  "BattleEventBuffGroup": 12004,
  "BattleEventEnhanceBuffGroup": 12005,
  "DisplayID": 1
}
```

### AlleyMapEffect.json (0.00 MB, 16 条)

**字段** (3): `MapEffectID, MapEffectSubType, MapEffectTitle`

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

### GridFightTraitGameRef.json (0.00 MB, 25 条)

**字段** (5): `TraitID, Season, BasicScore, BonusScore, PenaltyScore`

**首条记录摘要**:
```json
{
  "TraitID": 1001,
  "Season": 1,
  "BasicScore": 4,
  "BonusScore": 20,
  "PenaltyScore": 200
}
```

### ChallengeStoryMazeTierce.json (0.00 MB, 2 条)

**字段** (16): `PHFMCACHFIJ, DLCKKJFMJOB, EMNJGCPDIFF, LCHKKJDBLGM, PHOIICMCGIH, MLMEGBLDFKE, JEBMBCLBIOI, HFIAAGAKFMD, LOJCIDLKPKG, OGEOMCGNNMP, GNGENMHNLAH, IDBJENCBJHM, LDKPJPCMMAE, IMCMJHAMMKK, EGEEJLHBALB, OGALGHMIIAH`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 20245,
  "DLCKKJFMJOB": 20244,
  "EMNJGCPDIFF": 3000301,
  "LCHKKJDBLGM": [],
  "PHOIICMCGIH": 9,
  "MLMEGBLDFKE": [
    200001
  ],
  "JEBMBCLBIOI": [
    2004010
  ],
  "HFIAAGAKFMD": [
    30322043
  ],
  "LOJCIDLKPKG": [
    "Physical",
    "Imaginary"
  ],
  "OGEOMCGNNMP": [
    4001,
    4002,
    4003
  ],
  "GNGENMHNLAH": 4000,
  "IDBJENCBJHM": 45000,
  "LDKPJPCMMAE": [
    4001,
    4002
  ],
  "IMCMJHAMMKK": 102113,
  "EGEEJLHBALB": "[{\"ItemID\": 122002}, {\"ItemID\": 1, \"Item...",
  "OGALGHMIIAH": "[{\"ItemID\": 122002}, {\"ItemID\": 1}, {\"It..."
}
```

### MusicRhythmTrack.json (0.00 MB, 12 条)

**字段** (5): `ID, UnlockSubMissionID, IconPath, TrackName, EmptyGridList`

**首条记录摘要**:
```json
{
  "ID": 11,
  "UnlockSubMissionID": 802611005,
  "IconPath": "SpriteOutput/Quest/MusicRhythm/MRMusicMi...",
  "TrackName": {
    "Hash": 4363004274901613814
  },
  "EmptyGridList": []
}
```

### ChenLingFesAward.json (0.00 MB, 35 条)

**字段** (2): `ID, ExtendNum`

**首条记录摘要**:
```json
{
  "ID": 111,
  "ExtendNum": 6
}
```

### ActivityDiceV2PVEStage.json (0.00 MB, 6 条)

**字段** (11): `PHFMCACHFIJ, PPEBOKHAFNL, HMFPPOIIKHL, PPCOMAHNFOL, BGDFEPFLGOC, CKOIGMMCPKH, LEIDKFJDHMM, DGHMGKCJAAF, LIIPLGLNPGB, GNCEJNFIOJP, GNDCCBNILML`

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

### RogueEventSpecialOption.json (0.00 MB, 13 条)

**字段** (3): `SpecialOptionID, AeonIcon, AeonFigure`

**首条记录摘要**:
```json
{
  "SpecialOptionID": 1,
  "AeonIcon": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "AeonFigure": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### RogueMagicConstClient.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueMagic_LimitedTeamMember",
  "Value": {
    "IntValue": 4
  }
}
```

### HeliobusPhase.json (0.00 MB, 5 条)

**字段** (5): `HeliobusPhaseID, PhaseTextID, Heliobus_ToDoListTitle_After, PhaseBigIconPath, PhaseSmallIconPath`

**首条记录摘要**:
```json
{
  "HeliobusPhaseID": 1,
  "PhaseTextID": {
    "Hash": 6176926502798800280
  },
  "Heliobus_ToDoListTitle_After": {
    "Hash": 11595187734908681724
  },
  "PhaseBigIconPath": "SpriteOutput/Quest/Museum/MuseumPhaseIco...",
  "PhaseSmallIconPath": "SpriteOutput/Quest/Museum/MuseumPhaseIco..."
}
```

### ChenLingEnchantLevel.json (0.00 MB, 45 条)

**字段** (3): `ID, Level, SkillID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Level": 1,
  "SkillID": 10011
}
```

### TrainPartyCardSpecialShow.json (0.00 MB, 12 条)

**字段** (3): `CardID, SpecialShowTitle, SpecialShowDesc`

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

### GridFightForge.json (0.00 MB, 10 条)

**字段** (7): `ID, EquipCategory, EquipNum, ForgeDesc, FuncType, ParamList, ForgeTypeDesc`

**首条记录摘要**:
```json
{
  "ID": 99999,
  "EquipCategory": "Basic",
  "EquipNum": 4,
  "ForgeDesc": {
    "Hash": 4771493019422090940
  },
  "FuncType": "Equip",
  "ParamList": [
    1
  ],
  "ForgeTypeDesc": {
    "Hash": 12254417321308275778
  }
}
```

### FateRinConstClient.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "FateRin_Normal_Reward_QuestList",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 6088001}, {..."
}
```

### RogueMagicContentDisplay.json (0.00 MB, 39 条)

**字段** (1): `DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 301
}
```

### GridFightSeasonCraft.json (0.00 MB, 57 条)

**字段** (2): `CraftID, SeasonID`

**首条记录摘要**:
```json
{
  "CraftID": 1,
  "SeasonID": 1
}
```

### DocumentaryPhaseQuestPanel.json (0.00 MB, 9 条)

**字段** (6): `PhaseID, NextPhase, QuestList, PanelTitle, PanelDesc, ExtraQuest`

**首条记录摘要**:
```json
{
  "PhaseID": 101,
  "NextPhase": 102,
  "QuestList": "[1001711, 1001712, 1001713, 1001714, 100...",
  "PanelTitle": {
    "Hash": 2968996071244643990
  },
  "PanelDesc": {
    "Hash": 9029072456416460181
  },
  "ExtraQuest": 1002001
}
```

### ScheduleDataChallengeStory.json (0.00 MB, 25 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 202001,
  "BeginTime": "2024-01-08 04:00:00",
  "EndTime": "2024-02-19 04:00:00"
}
```

### TreasureDungeonGroupConfig.json (0.00 MB, 5 条)

**字段** (14): `GroupID, ActivityModuleID, ATKMazeBuffID, MaxATK, DEFMazeBuffID, MaxDEF, HpConversionRate, HpConversionRate2, ATKExchangeRatio, ATKExchangeIconPath, ATKExchangeName, DungeonIDList, Name, ImgPath`

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

### ChallengeMazeTierce.json (0.00 MB, 2 条)

**字段** (15): `PHFMCACHFIJ, DLCKKJFMJOB, EMNJGCPDIFF, LCHKKJDBLGM, PHOIICMCGIH, MLMEGBLDFKE, JEBMBCLBIOI, HFIAAGAKFMD, LOJCIDLKPKG, GNOOAGPBNLD, OGEOMCGNNMP, GNGENMHNLAH, IMCMJHAMMKK, EGEEJLHBALB, OGALGHMIIAH`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 5213,
  "DLCKKJFMJOB": 5212,
  "EMNJGCPDIFF": 3014002,
  "LCHKKJDBLGM": [],
  "PHOIICMCGIH": 11,
  "MLMEGBLDFKE": [
    200001
  ],
  "JEBMBCLBIOI": [
    5014010
  ],
  "HFIAAGAKFMD": [
    30123123
  ],
  "LOJCIDLKPKG": [
    "Fire",
    "Imaginary"
  ],
  "GNOOAGPBNLD": 45,
  "OGEOMCGNNMP": [
    601,
    602,
    603
  ],
  "GNGENMHNLAH": 600,
  "IMCMJHAMMKK": 101913,
  "EGEEJLHBALB": "[{\"ItemID\": 122001}, {\"ItemID\": 1, \"Item...",
  "OGALGHMIIAH": "[{\"ItemID\": 122001}, {\"ItemID\": 1}, {\"It..."
}
```

### MatchThreePiece.json (0.00 MB, 14 条)

**字段** (4): `PieceID, ImagePath, RowBombPath, SquareBombPath`

**首条记录摘要**:
```json
{
  "PieceID": 1,
  "ImagePath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi...",
  "RowBombPath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi...",
  "SquareBombPath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi..."
}
```

### SpecialMode.json (0.00 MB, 15 条)

**字段** (5): `SpecialModeID, Title, Desc01, Desc02, Desc03`

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

### FindChestFuncData.json (0.00 MB, 7 条)

**字段** (10): `FuncID, GameModeList, FindNum, ChestTypeList, WorldIDList, TriggerType, TriggerParamList, MapIconID, MappingInfoID, SpecialMappinginfo`

**首条记录摘要**:
```json
{
  "FuncID": 101,
  "GameModeList": [
    "Town",
    "Maze",
    "TownRoom"
  ],
  "FindNum": 3,
  "ChestTypeList": [
    "CHEST_TREASURE_NORMAl"
  ],
  "WorldIDList": [],
  "TriggerType": "Avatar",
  "TriggerParamList": [
    1401
  ],
  "MapIconID": 284,
  "MappingInfoID": 2104,
  "SpecialMappinginfo": 2110
}
```

### CakeRaceHandBook.json (0.00 MB, 15 条)

**字段** (4): `CatID, Order, BubblePerformanceIDList, AvatarTalkIDList`

**首条记录摘要**:
```json
{
  "CatID": 1,
  "Order": 6,
  "BubblePerformanceIDList": [
    2013
  ],
  "AvatarTalkIDList": [
    1011,
    1012,
    1013,
    1014
  ]
}
```

### RelicComposeConfig.json (0.00 MB, 12 条)

**字段** (7): `ID, ItemID, MaterialCost, CoinCost, Type, Order, WorldLevelRequire`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ItemID": 71000,
  "MaterialCost": [
    {
      "ItemID": 235,
      "ItemNum": 60
    }
  ],
  "CoinCost": 5000,
  "Type": 11,
  "Order": 1,
  "WorldLevelRequire": 4
}
```

### RelicMainAffixBaseValue.json (0.00 MB, 20 条)

**字段** (4): `RelicMainAffix, Type, BaseValue, ValuePerLevel`

**首条记录摘要**:
```json
{
  "RelicMainAffix": "AttackDelta",
  "Type": "Attack",
  "BaseValue": 5.12,
  "ValuePerLevel": 1.792
}
```

### GameplayGuideTab.json (0.00 MB, 8 条)

**字段** (9): `ID, Name, Priority, GuideType, Desc, ResBarKey, IconPath, IntroDataID, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Name": {
    "Hash": 17270097842088462076
  },
  "Priority": 20,
  "GuideType": "FarmCocoon",
  "Desc": {
    "Hash": 9236530736931440495
  },
  "ResBarKey": "HandBookGuide",
  "IconPath": "SpriteOutput/ItemIcon/2.png",
  "IntroDataID": 34,
  "UnlockID": 9913
}
```

### FateConstValueClient.json (0.00 MB, 17 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Fate_PlayerDisplayRealID",
  "Value": {
    "IntValue": 8005
  }
}
```

### PixAirStageConfig.json (0.00 MB, 7 条)

**字段** (9): `StageID, Type, UnlockScore, PreStageList, AreaIDList, Name, IconPath, MechanismTip, RewardTip`

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

### BelobogShopUIConfig.json (0.00 MB, 7 条)

**字段** (6): `ID, Name, Desc, IconPath, ImgPath, ReplyIDList`

**首条记录摘要**:
```json
{
  "ID": 201,
  "Name": {
    "Hash": 15131311345790041742
  },
  "Desc": {
    "Hash": 12039910145047610089
  },
  "IconPath": "SpriteOutput/ItemFigures/180006.png",
  "ImgPath": "SpriteOutput/Quest/MaterialSubmit/Belobo...",
  "ReplyIDList": [
    201001,
    201002,
    201003
  ]
}
```

### PropTriggerEvent.json (0.00 MB, 11 条)

**字段** (4): `ID, Name, JsonPath, ExitJsonPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "FaceToPropOnly",
  "JsonPath": "Config/Level/Props/InteractMode/TriggerE...",
  "ExitJsonPath": "Config/Level/Props/InteractMode/TriggerE..."
}
```

### RogueArcadeType.json (0.00 MB, 7 条)

**字段** (6): `ArcadeID, PicPathList, BriefName, DetailedName, Desc, ExitDesc`

**首条记录摘要**:
```json
{
  "ArcadeID": 1,
  "PicPathList": "[\"SpriteOutput/Rogue/Tourn/Arcade/RogueA...",
  "BriefName": {
    "Hash": 14865721950124009911
  },
  "DetailedName": {
    "Hash": 17113876415148825711
  },
  "Desc": {
    "Hash": 12692901297623426732
  },
  "ExitDesc": {
    "Hash": 15240946242968396662
  }
}
```

### UniqueProp.json (0.00 MB, 32 条)

**字段** (2): `UniqueName, PropID`

**首条记录摘要**:
```json
{
  "UniqueName": "Chess_00",
  "PropID": "Prop_Chess_00"
}
```

### RogueNousDifficultyLevel.json (0.00 MB, 12 条)

**字段** (6): `DifficultyID, DifficultyType, DifficultyDesc, ParamList, Tag, Sort`

**首条记录摘要**:
```json
{
  "DifficultyID": 101,
  "DifficultyType": "AttributeDifficulty",
  "DifficultyDesc": {
    "Hash": 6597020033789644097
  },
  "ParamList": [],
  "Tag": 1,
  "Sort": 1
}
```

### SwordTrainingStoryLine.json (0.00 MB, 4 条)

**字段** (11): `StoryLine, EndingStoryIDList, EndingOptionKey, StoryLineName, StartTalkImage, StoryLineImage, StoryLineDesc, AvatarIDList, StoryHardDesc, RewardID, TurnIDList`

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
  "TurnIDList": "[101, 102, 103, 104, 105, 106, 107, 108,..."
}
```

### FiveDimMiniGameReward.json (0.00 MB, 21 条)

**字段** (4): `MiniGameID, ScoreLine, RepeatableRewardID, OneTimeRewardID`

**首条记录摘要**:
```json
{
  "MiniGameID": 1000,
  "ScoreLine": 200,
  "RepeatableRewardID": 27001001,
  "OneTimeRewardID": 241
}
```

### ActivityLocalLegendGroup.json (0.00 MB, 5 条)

**字段** (9): `GroupID, GroupTitle, ActivityModuleID, GroupPicPath, TutorialGuideID, StageMechanismTitle, StageMechanism, ChallengeStrategy, TeamBuildTip`

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

### DailyActiveQuestPool.json (0.00 MB, 53 条)

**字段** (2): `QuestID, Type`

**首条记录摘要**:
```json
{
  "QuestID": 2100003,
  "Type": 1
}
```

### IdleLiveBossData.json (0.00 MB, 10 条)

**字段** (5): `BossID, Name, Desc, NodeIcon, ImagePath`

**首条记录摘要**:
```json
{
  "BossID": 1,
  "Name": {
    "Hash": 12882568536812783330
  },
  "Desc": {
    "Hash": 8880365020025297198
  },
  "NodeIcon": "SpriteOutput/MonsterRoundIcon/Monster_80...",
  "ImagePath": "SpriteOutput/MonsterFigure/Monster_80250..."
}
```

### ChallengePeakBossConfig.json (0.00 MB, 8 条)

**字段** (7): `ID, HardTitle, BuffList, ColorMedalTarget, HardTarget, HardEventIDList, HardTagList`

**首条记录摘要**:
```json
{
  "ID": 104,
  "HardTitle": {
    "Hash": 7760170859122248016
  },
  "BuffList": [
    3033006,
    3033007,
    3033008
  ],
  "ColorMedalTarget": 6,
  "HardTarget": 3007,
  "HardEventIDList": [
    30501022
  ],
  "HardTagList": [
    3033010,
    3033013,
    3033019
  ]
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

### ChimeraDisplay.json (0.00 MB, 27 条)

**字段** (2): `DisplayID, ChimeraName`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "ChimeraName": {
    "Hash": 18421239265317616120
  }
}
```

### ParkourRailBallConfig.json (0.00 MB, 5 条)

**字段** (10): `ID, Name, SkillID, UI3DPrefabPath, PrefabPath, ResPath, BigResPath, SpeedDisplay, StabilityDisplay, SkillChargeDisplay`

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

### RelicBaseType.json (0.00 MB, 7 条)

**字段** (4): `Type, BaseTypeText, BaseTypeIconPath, ValidPropertyList`

**首条记录摘要**:
```json
{
  "Type": "HEAD",
  "BaseTypeText": {
    "Hash": 13032099003837540320
  },
  "BaseTypeIconPath": "SpriteOutput/UI/Avatar/Relic/IconRelicHe...",
  "ValidPropertyList": [
    "HPDelta"
  ]
}
```

### MappingInfoEntranceConfig.json (0.00 MB, 48 条)

**字段** (2): `ID, EntranceID`

**首条记录摘要**:
```json
{
  "ID": 2101,
  "EntranceID": 102020107
}
```

### ChallengeStoryTheme.json (0.00 MB, 7 条)

**字段** (7): `ThemeID, ThemePanelPrefabPath, ThemeBgPrefabPath, ThemeMainColor, ThemeSubColor1, ThemeSubColor2, ThemeEffColor`

**首条记录摘要**:
```json
{
  "ThemeID": 1,
  "ThemePanelPrefabPath": "UI/Abyss/ChallengeStoryThemePanel/Challe...",
  "ThemeBgPrefabPath": "UI/Abyss/ChallengeStoryThemePanel/Challe...",
  "ThemeMainColor": "#4fa4e1",
  "ThemeSubColor1": "#2c68c2",
  "ThemeSubColor2": "#3164ae",
  "ThemeEffColor": "#8AC0F5"
}
```

### TarotWikiUnlockConditions.json (0.00 MB, 15 条)

**字段** (3): `UnlockID, Conditions, ShowCondition`

**首条记录摘要**:
```json
{
  "UnlockID": 101,
  "Conditions": "[{\"Type\": \"FinishSubMission\", \"Param\": \"...",
  "ShowCondition": []
}
```

### HeartDialNpc.json (0.00 MB, 17 条)

**字段** (5): `FloorID, GroupID, InstanceID, ScriptIDList, DefaultScriptID`

**首条记录摘要**:
```json
{
  "FloorID": 90170015,
  "GroupID": 18,
  "InstanceID": 400001,
  "ScriptIDList": [
    10001
  ],
  "DefaultScriptID": 10001
}
```

### AvatarCamp.json (0.00 MB, 21 条)

**字段** (4): `ID, SortID, Name, IconPath`

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

### RogueDLCMainStoryBranch.json (0.00 MB, 34 条)

**字段** (2): `MainStoryBranchID, RogueNPCID`

**首条记录摘要**:
```json
{
  "MainStoryBranchID": 101,
  "RogueNPCID": 100
}
```

### RestaurantQuestGroup.json (0.00 MB, 6 条)

**字段** (7): `QuestGroupID, QuestIDList, Name, Content, CharacterName, IMGPath, UnlockIDList`

**首条记录摘要**:
```json
{
  "QuestGroupID": 1,
  "QuestIDList": [
    6070341,
    6070342,
    6070344,
    6070345
  ],
  "Name": {
    "Hash": 4480792007570306269
  },
  "Content": {
    "Hash": 15684969680285690547
  },
  "CharacterName": {
    "Hash": 17289043142524518218
  },
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/NPC/NPC...",
  "UnlockIDList": []
}
```

### ActivityHipplenTrial.json (0.00 MB, 12 条)

**字段** (3): `ID, TrialTitle, GameJson`

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

### RogueNousMainStory.json (0.00 MB, 8 条)

**字段** (7): `StoryID, Layer, MainStoryName, DisplayID, RogueNPCID, QuestID, StoryGroup`

**首条记录摘要**:
```json
{
  "StoryID": 910,
  "Layer": 1,
  "MainStoryName": {
    "Hash": 1939845597572254493
  },
  "DisplayID": [],
  "RogueNPCID": 131,
  "QuestID": 6014121,
  "StoryGroup": 1
}
```

### SpecialAvatarLD.json (0.00 MB, 6 条)

**字段** (15): `SpecialAvatarID, PlayerID, AvatarID, Type, LevelAreaPrefab, AnchorName, Level, Promotion, OverrideProperty, HaveActionDelay, SkillTreeTemplate, CustomSkillTreeKey, AbilityNameList, PlayerJsonPath, JsonPath`

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
  "JsonPath": ""
}
```

### FateMonsterPool.json (0.00 MB, 7 条)

**字段** (6): `NHLFOCNBABI, MMNICKEOGNN, JHGNLBADBAE, BDJIGCAEKBE, JMCDCEGBJNJ, BKABFEJOAKM`

**首条记录摘要**:
```json
{
  "NHLFOCNBABI": 1,
  "MMNICKEOGNN": [
    4014018
  ],
  "JHGNLBADBAE": [
    4013013,
    8003021
  ],
  "BDJIGCAEKBE": [
    401401004
  ],
  "JMCDCEGBJNJ": [
    4013010,
    4033020,
    8003020
  ],
  "BKABFEJOAKM": "[4012010, 4012020, 4012030, 4012040, 800..."
}
```

### GridFightLevelBaseValue.json (0.00 MB, 23 条)

**字段** (4): `ChapterID, SectionID, LevelBaseAttack, LevelBaseHP`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "SectionID": 1,
  "LevelBaseAttack": 16000,
  "LevelBaseHP": 16000
}
```

### SwordTrainingExamComment.json (0.00 MB, 18 条)

**字段** (3): `CommentID, ImgPath, Desc`

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

### GridFightFrontSpecialSP.json (0.00 MB, 24 条)

**字段** (4): `RoleID, Star, SpecialSPType, MaxSpecialSP`

**首条记录摘要**:
```json
{
  "RoleID": 1407,
  "Star": 1,
  "SpecialSPType": "MaxSP",
  "MaxSpecialSP": 150000
}
```

### RogueUpgradeAvatar.json (0.00 MB, 7 条)

**字段** (9): `AvatarLevel, AvatarPromotion, AvatarSkillTreeKey, RelicSet4AverageLevel, RelicSet4Rarity, RelicSet2AverageLevel, RelicSet2Rarity, EquipmentLevel, EquipmentPromotion`

**首条记录摘要**:
```json
{
  "AvatarLevel": 25,
  "AvatarPromotion": 1,
  "AvatarSkillTreeKey": "W0_Standard_20-30",
  "RelicSet4AverageLevel": 1,
  "RelicSet4Rarity": "CombatPowerRelicRarity3",
  "RelicSet2AverageLevel": 1,
  "RelicSet2Rarity": "CombatPowerRelicRarity3",
  "EquipmentLevel": 25,
  "EquipmentPromotion": 1
}
```

### ItemGiftPackData.json (0.00 MB, 12 条)

**字段** (4): `ID, GroupID, RewardList, GroupDesc`

**首条记录摘要**:
```json
{
  "ID": 311000,
  "GroupID": 1,
  "RewardList": "[1201001, 1201002, 1201003, 1201004, 120...",
  "GroupDesc": {
    "Hash": 7509559092966294882
  }
}
```

### MarbleConstValueClient.json (0.00 MB, 21 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Marble_PlayerID_Male",
  "Value": {
    "IntValue": 100
  }
}
```

### RogueDLCConstValueClient.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueDLC_BoardPage_FuncEntranceIDList",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 51003}, {\"I..."
}
```

### PamAnchor.json (0.00 MB, 15 条)

**字段** (5): `ID, FloorID, AreaName, AnchorName, PamPlaceType`

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

### LittleWheelFuncConfig.json (0.00 MB, 20 条)

**字段** (2): `LittleWheelFuncID, IconPath`

**首条记录摘要**:
```json
{
  "LittleWheelFuncID": "Message",
  "IconPath": "SpriteOutput/labyrinthPlay/PhoneMessageN..."
}
```

### ParkourRankingList.json (0.00 MB, 6 条)

**字段** (4): `RailBallID, LevelBestRecordList, NPCName, NPCIconPath`

**首条记录摘要**:
```json
{
  "RailBallID": 5,
  "LevelBestRecordList": "[{\"MLDLOJJBIJD\": 10, \"GAFENHHEBPG\": 8132...",
  "NPCName": {
    "Hash": 10089855168639591785
  },
  "NPCIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1006..."
}
```

### RogueDLCConstValueCommon.json (0.00 MB, 19 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueDLC_Recover_ItemCost",
  "Value": "{\"MapValue\": {\"IntValue\": {\"IntValue\": 8..."
}
```

### ItemConfigAvatarLD.json (0.00 MB, 4 条)

**字段** (14): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemBGDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "ItemMainType": "AvatarCard",
  "ItemSubType": "AvatarCard",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "ItemName": {
    "Hash": 9372088759984559843
  },
  "ItemBGDesc": {
    "Hash": 15294814221316395218
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

### ActivityConstantSilverWolf.json (0.00 MB, 27 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "SilverWolf_Unlock_Missions",
  "Value": "1000401"
}
```

### RestaurantProgressConfig.json (0.00 MB, 5 条)

**字段** (15): `ProgressID, OpenTime, WaiterNumber, ChefNumber, EmployeeMaxLevel, TableNumber, TableMaxLevel, RecipeMaxLevel, BaseCustomer, MenuNumber, GoalIncome, GoalQuestIDList, BreakMission, Name, CheckDay`

**首条记录摘要**:
```json
{
  "ProgressID": 1,
  "OpenTime": 60,
  "WaiterNumber": 1,
  "ChefNumber": 1,
  "EmployeeMaxLevel": 1,
  "TableNumber": 2,
  "TableMaxLevel": 1,
  "RecipeMaxLevel": 1,
  "BaseCustomer": 5,
  "MenuNumber": 1,
  "GoalIncome": 6070300,
  "GoalQuestIDList": [
    6070801
  ],
  "BreakMission": 803510121,
  "Name": {
    "Hash": 9902320084036006552
  },
  "CheckDay": 2
}
```

### MessageContactsCamp.json (0.00 MB, 22 条)

**字段** (3): `ContactsCamp, Name, SortID`

**首条记录摘要**:
```json
{
  "ContactsCamp": 1,
  "Name": {
    "Hash": 10654186520031922482
  },
  "SortID": 1
}
```

### RogueTournRoomGroup.json (0.00 MB, 27 条)

**字段** (1): `RoomTypeList`

**首条记录摘要**:
```json
{
  "RoomTypeList": []
}
```

### RechargeBenefitData.json (0.00 MB, 24 条)

**字段** (2): `BenefitID, Reward`

**首条记录摘要**:
```json
{
  "BenefitID": 1001,
  "Reward": 10301
}
```

### FiveDimSkillPanelConfig.json (0.00 MB, 5 条)

**字段** (6): `ID, SkillName, Desc1, IconPath, IconPath2, UI3DPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "SkillName": {
    "Hash": 249873488852560307
  },
  "Desc1": {
    "Hash": 6698802320971982561
  },
  "IconPath": "SpriteOutput/SkillIcons/Com/SkillIcon_Fi...",
  "IconPath2": "",
  "UI3DPath": ""
}
```

### GameModeFuncEntrance.json (0.00 MB, 21 条)

**字段** (3): `GameModeType, MainLineFuncEntranceListID, BranchLineFuncEntranceListID`

**首条记录摘要**:
```json
{
  "GameModeType": 1,
  "MainLineFuncEntranceListID": 1,
  "BranchLineFuncEntranceListID": 17
}
```

### GridFightRoleChoose.json (0.00 MB, 16 条)

**字段** (4): `TraitID, Parameter, SubTraitID, ChooseDesc`

**首条记录摘要**:
```json
{
  "TraitID": 1010,
  "Parameter": 1301,
  "SubTraitID": 2501,
  "ChooseDesc": {
    "Hash": 2039529428112320282
  }
}
```

### ChenLingStage.json (0.00 MB, 6 条)

**字段** (7): `ID, NextID, FinishUnlockDeckID, CommanderName, IconPath, IconPathInBattle, LockDeckID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NextID": 2,
  "FinishUnlockDeckID": 1,
  "CommanderName": {
    "Hash": 16577688881459151230
  },
  "IconPath": "",
  "IconPathInBattle": "SpriteOutput/Quest/ActivityChenLing/Chen...",
  "LockDeckID": 5
}
```

### VersionReviewMission.json (0.00 MB, 15 条)

**字段** (4): `ReviewMainMissionID, PreMainMissionID, StoryPerformanceID, StoryStartEntranceID`

**首条记录摘要**:
```json
{
  "ReviewMainMissionID": 1036001,
  "PreMainMissionID": 1034109,
  "StoryPerformanceID": 103600151,
  "StoryStartEntranceID": 1000003
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

### RestaurantFieldConfig.json (0.00 MB, 6 条)

**字段** (7): `FieldID, ConfigIDList, BigCropsReplaceConfigIDList, BigCropsConfigID, PropGroupIDList, PropConfigIDList, UnlockIDList`

**首条记录摘要**:
```json
{
  "FieldID": 1,
  "ConfigIDList": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8
  ],
  "BigCropsReplaceConfigIDList": [
    1,
    2,
    6,
    7
  ],
  "BigCropsConfigID": 100,
  "PropGroupIDList": [
    274
  ],
  "PropConfigIDList": [
    300007
  ],
  "UnlockIDList": []
}
```

### EvoBdSCTutorial.json (0.00 MB, 20 条)

**字段** (4): `ID, StageMergedID, TutorialID, Season`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageMergedID": 424000,
  "TutorialID": "6005",
  "Season": "SecondChapter"
}
```

### MatchThreeV2Reputation.json (0.00 MB, 5 条)

**字段** (6): `Reputation, ChallengerList, Title, TabName, ImagePath, BgPath`

**首条记录摘要**:
```json
{
  "Reputation": 1,
  "ChallengerList": [
    101,
    102
  ],
  "Title": {
    "Hash": 12615677423402992174
  },
  "TabName": {
    "Hash": 15100581136354356667
  },
  "ImagePath": "SpriteOutput/Quest/MatchThree/RankIcon/C...",
  "BgPath": "SpriteOutput/Quest/MatchThree/RankIcon/C..."
}
```

### MonsterDamageResistanceType.json (0.00 MB, 7 条)

**字段** (5): `Type, Icon, Resistance, HighResistanceIcon, HighResistance`

**首条记录摘要**:
```json
{
  "Type": "Physical",
  "Icon": "SpriteOutput/UI/Avatar/Icon/IconPhysical...",
  "Resistance": {
    "Hash": 17481945539992914833
  },
  "HighResistanceIcon": "SpriteOutput/UI/Avatar/Icon/IconPhysical...",
  "HighResistance": {
    "Hash": 4466734658322446797
  }
}
```

### FightFestMainRace.json (0.00 MB, 6 条)

**字段** (10): `MainRaceID, FightPhaseID, EventID, RewardID, TutorialID, BlueAvatarID, RedAvatarID, StageName, StageEndDesc, RaceBgFigurePath`

**首条记录摘要**:
```json
{
  "MainRaceID": 101,
  "FightPhaseID": 101,
  "EventID": 419000,
  "RewardID": 250000,
  "TutorialID": 8182,
  "BlueAvatarID": 1,
  "RedAvatarID": 16,
  "StageName": {
    "Hash": 16326872052626033075
  },
  "StageEndDesc": {
    "Hash": 15961946333718006142
  },
  "RaceBgFigurePath": "SpriteOutput/UI/Quest/AetherDivide/ADIco..."
}
```

### CatDialogueBubbleOffset.json (0.00 MB, 25 条)

**字段** (3): `ID, BubbleOffsetY, BubbleType`

**首条记录摘要**:
```json
{
  "ID": 111,
  "BubbleOffsetY": -0.4,
  "BubbleType": "Left"
}
```

### ActivityRewardPunkLord.json (0.00 MB, 15 条)

**字段** (4): `RewardLevel, RewardLevelName, RewardPoint, RewardID`

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

### EvoBdSCGearTypeConfig.json (0.00 MB, 5 条)

**字段** (7): `Season, FontColor, WeaponToastEffectBg, MixDetailPropsInfoBg, TypeImg, TypeImgColor, Name`

**首条记录摘要**:
```json
{
  "Season": "SecondChapter",
  "FontColor": "#ffc06a",
  "WeaponToastEffectBg": "SpriteOutput/UI/Quest/EvolveBuild/Evolve...",
  "MixDetailPropsInfoBg": "SpriteOutput/UI/Quest/EvolveBuild/Evolve...",
  "TypeImg": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "TypeImgColor": "#FFCF70",
  "Name": "UIText_EvolveBuild_WeaponTag"
}
```

### AetherDivideActivityQuest.json (0.00 MB, 12 条)

**字段** (5): `ID, Name, TypeGroupID, QuestList, ActivityModuleID`

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

### EvolveBuildTutorial.json (0.00 MB, 20 条)

**字段** (4): `ID, StageMergedID, TutorialID, Season`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageMergedID": 414000,
  "TutorialID": "5355",
  "Season": "EarlyAccess"
}
```

### ActivityDiceCommunicate.json (0.00 MB, 21 条)

**字段** (3): `PJJLNCANODD, GMPGDEINODK, OBLOHIGPEEP`

**首条记录摘要**:
```json
{
  "PJJLNCANODD": 1,
  "GMPGDEINODK": "Emoji",
  "OBLOHIGPEEP": 123002
}
```

### UpgradeAvatar.json (0.00 MB, 7 条)

**字段** (10): `OPJDGJNAKFF, HMKPKMILCAE, EEBNMNAJJHF, OCMAKGJLFBJ, ILHDODKFKOI, LEPEPJIHEFL, NHAFDDACLLA, HLLMOIBCKNO, JDGHCBCNMBI, JPJLIFNHPAA`

**首条记录摘要**:
```json
{
  "OPJDGJNAKFF": 25,
  "HMKPKMILCAE": 1,
  "EEBNMNAJJHF": "W0_Standard_20-30",
  "OCMAKGJLFBJ": 1,
  "ILHDODKFKOI": "CombatPowerRelicRarity3",
  "LEPEPJIHEFL": 1,
  "NHAFDDACLLA": "CombatPowerRelicRarity3",
  "HLLMOIBCKNO": 25,
  "JDGHCBCNMBI": 1,
  "JPJLIFNHPAA": 6
}
```

### DrinkMakerGuestSequence.json (0.00 MB, 25 条)

**字段** (4): `SequenceID, GuestID, StartChatID, NeedOpenWorkBook`

**首条记录摘要**:
```json
{
  "SequenceID": 11,
  "GuestID": 1,
  "StartChatID": 1101,
  "NeedOpenWorkBook": true
}
```

### ItemConfigAvatarRankLD.json (0.00 MB, 4 条)

**字段** (14): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, ItemName, ItemDesc, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 11014,
  "ItemMainType": "Material",
  "ItemSubType": "Eidolon",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "ItemName": {
    "Hash": 10280517407674501024
  },
  "ItemDesc": {
    "Hash": 17872245014823595764
  },
  "ItemIconPath": "SpriteOutput/ItemIcon/11003.png",
  "ItemFigureIconPath": "SpriteOutput/ItemFigures/11003.png",
  "ItemCurrencyIconPath": "SpriteOutput/ItemIcon/11003.png",
  "ItemAvatarIconPath": "",
  "PileLimit": 999,
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### BattleCollegeAimList.json (0.00 MB, 13 条)

**字段** (4): `AimID, AimTitle, AimDesc, AimProgress`

**首条记录摘要**:
```json
{
  "AimID": 400101,
  "AimTitle": {
    "Hash": 12649864743080715795
  },
  "AimDesc": {
    "Hash": 1546710312290645918
  },
  "AimProgress": 1
}
```

### ClockParkSpecialMission.json (0.00 MB, 6 条)

**字段** (8): `SpecialMissionUnlockItemID, SpecialMissionID, SpecialMissionImgPath, SpecialMissionIconPath, EventName, EventNum, EventScript, SpecialMissionGotoIDBefore`

**首条记录摘要**:
```json
{
  "SpecialMissionUnlockItemID": 140483,
  "SpecialMissionID": 8022110,
  "SpecialMissionImgPath": "SpriteOutput/ItemFigures/140400.png",
  "SpecialMissionIconPath": "SpriteOutput/ItemFigures/140320.png",
  "EventName": {
    "Hash": 742507716946316258
  },
  "EventNum": 2,
  "EventScript": 2,
  "SpecialMissionGotoIDBefore": 28005
}
```

### SubNavMap.json (0.00 MB, 19 条)

**字段** (4): `ID, Type, FloorID, NavMapSubTabID`

**首条记录摘要**:
```json
{
  "ID": 101010901,
  "Type": "AnotherFloor",
  "FloorID": 10101009,
  "NavMapSubTabID": 10101001
}
```

### ChimeraDuelRecommendation.json (0.00 MB, 15 条)

**字段** (3): `RecommendationID, MasterID, ChimeraIDList`

**首条记录摘要**:
```json
{
  "RecommendationID": 60101,
  "MasterID": 601,
  "ChimeraIDList": [
    301,
    302,
    501,
    103,
    401
  ]
}
```

### MonopolyCellMoveConfig.json (0.00 MB, 8 条)

**字段** (3): `MapID, CellID, MoveParam`

**首条记录摘要**:
```json
{
  "MapID": 3,
  "CellID": 9,
  "MoveParam": "[\"MapArea/Ground/WorldContainer/WorldMap..."
}
```

### ActivityAvatarDeliverConfig.json (0.00 MB, 10 条)

**字段** (5): `AvatarID, Name, MailDesc, Sign, Sort`

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

### EvoBdSCForgeMaterial.json (0.00 MB, 14 条)

**字段** (3): `ForgeGearID, MaterialGearList, CostGearList`

**首条记录摘要**:
```json
{
  "ForgeGearID": 3113901,
  "MaterialGearList": {
    "3113001": 8,
    "3113114": 1
  },
  "CostGearList": [
    3113001
  ]
}
```

### GridFightEquipUpgrade.json (0.00 MB, 37 条)

**字段** (2): `PreID, UpgradeID`

**首条记录摘要**:
```json
{
  "PreID": 35030101,
  "UpgradeID": 35040101
}
```

### MatchThreePVPScore.json (0.00 MB, 7 条)

**字段** (9): `ScoreID, Title, Title2, Desc, Rarity, Type, FinishType, Param1, FixedScore`

**首条记录摘要**:
```json
{
  "ScoreID": 1,
  "Title": {
    "Hash": 7162306622499053599
  },
  "Title2": {
    "Hash": 6915912118126682626
  },
  "Desc": {
    "Hash": 9004210586575572038
  },
  "Rarity": "Gold",
  "Type": "Rank",
  "FinishType": "Rank",
  "Param1": 1,
  "FixedScore": 1000
}
```

### MazeSkillLD.json (0.00 MB, 8 条)

**字段** (6): `MazeSkillId, MazeSkillName, MazeSkilltype, MazeSkillDesc, RelatedAvatarSkill, SkillTriggerKey`

**首条记录摘要**:
```json
{
  "MazeSkillId": 101401,
  "MazeSkillName": {
    "Hash": 1705476568878360541
  },
  "MazeSkilltype": 1,
  "MazeSkillDesc": {
    "Hash": 2349585899956578359
  },
  "RelatedAvatarSkill": 101406,
  "SkillTriggerKey": "NormalAtk"
}
```

### SwordTrainingStatus.json (0.00 MB, 7 条)

**字段** (6): `StatusID, InitialValue, MaximumValue, StatusName, StatusIcon, StatusOutLineIcon`

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

### RogueDLCAeonDimension.json (0.00 MB, 7 条)

**字段** (5): `AeonDimensionID, PlayShortDesc, AeonDimensionMaxPoint, DimensionIcon, AeonIcon`

**首条记录摘要**:
```json
{
  "AeonDimensionID": 1,
  "PlayShortDesc": {
    "Hash": 7542850558362908042
  },
  "AeonDimensionMaxPoint": 20,
  "DimensionIcon": "SpriteOutput/ProfessionIconSmall/IconPro...",
  "AeonIcon": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### FateRinDeckRecommend.json (0.00 MB, 7 条)

**字段** (3): `LOALOLNACOA, OFIGPIFELHJ, NJBEMAEAEIL`

**首条记录摘要**:
```json
{
  "LOALOLNACOA": "Trailblazer",
  "OFIGPIFELHJ": [
    1005,
    1001,
    1002,
    1003,
    1004
  ],
  "NJBEMAEAEIL": "[6013, 6015, 6019, 6008, 6016, 6005, 602..."
}
```

### RogueNousAeonCross.json (0.00 MB, 18 条)

**字段** (5): `MainAeonID, SubAeonID, MainAeonNum, SubAeonNum, BuffGroup`

**首条记录摘要**:
```json
{
  "MainAeonID": 1,
  "SubAeonID": 6,
  "MainAeonNum": 3,
  "SubAeonNum": 3,
  "BuffGroup": 12023
}
```

### ScheduleDataChallengeBoss.json (0.00 MB, 20 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 203001,
  "BeginTime": "2024-06-17 04:00:00",
  "EndTime": "2024-08-05 04:00:00"
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

### UpgradeAvatarSubType.json (0.00 MB, 32 条)

**字段** (2): `ACCJKGEKHKP, AMAPBCEEKFP`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 1403,
  "AMAPBCEEKFP": "LowSpeed"
}
```

### RogueTournDivisionEffect.json (0.00 MB, 8 条)

**字段** (3): `DivisionLevel, DescText, DescParamList`

**首条记录摘要**:
```json
{
  "DivisionLevel": 1,
  "DescText": {
    "Hash": 5428064629844130967
  },
  "DescParamList": "[{\"Value\": 0.32}, {\"Value\": 2}, {\"Value\"..."
}
```

### TrainPartyProgress.json (0.00 MB, 6 条)

**字段** (8): `ProgressID, TeamIDList, ProgressTitle, InitialStatExp, StatRatio, CoinRatio, UnlockPassengerList, PassengerUnlockActPath`

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

### AvatarDemoEntrance.json (0.00 MB, 6 条)

**字段** (5): `AvatarID, StageID, TrialRoleAvatarPath, TrialRoleAvatarBackPath, TrialRoleAvatarFrontPath`

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

### ItemComposeType.json (0.00 MB, 9 条)

**字段** (7): `TypeID, TypeTextmapID, TypeIconPath, IsMainType, MainTypeOrder, UnlockID, UnlockDescribe`

**首条记录摘要**:
```json
{
  "TypeID": 10,
  "TypeTextmapID": "ItemComposeType_TypeTextmapID_10",
  "TypeIconPath": "SpriteOutput/TabIcon/Inventory/Inventory...",
  "IsMainType": true,
  "MainTypeOrder": 2,
  "UnlockID": 10004,
  "UnlockDescribe": "ItemComposeType_UnlockDescribe_10"
}
```

### GridFightStageLevelValue.json (0.00 MB, 23 条)

**字段** (3): `StageID, LevelBaseAttack, LevelBaseHP`

**首条记录摘要**:
```json
{
  "StageID": 70000001,
  "LevelBaseAttack": 20000,
  "LevelBaseHP": 16000
}
```

### GridFightAugmentMonster.json (0.00 MB, 30 条)

**字段** (1): `Quality`

**首条记录摘要**:
```json
{
  "Quality": "Silver"
}
```

### ActivityDicePresetConfig.json (0.00 MB, 6 条)

**字段** (8): `LIIPLGLNPGB, KFNMJCJPNBK, GBJGDOAAEKL, NJINPDOKGPM, BIDDPFIKJLN, PLGOICOBHGA, NBKAKPMNIDF, KECPLLBNNNA`

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

### MonopolyGameConfig.json (0.00 MB, 7 条)

**字段** (8): `GameID, GameType, ParamStr1, ParamStr2, GameResourceIDList, BaseRaiseMaxValue, RaiseCurveID, GameIcon`

**首条记录摘要**:
```json
{
  "GameID": 1,
  "GameType": "MonopolyGachaA",
  "ParamStr1": "1:9000,2:6500,3:4000",
  "ParamStr2": "",
  "GameResourceIDList": [
    1,
    2,
    3
  ],
  "BaseRaiseMaxValue": 2,
  "RaiseCurveID": 1,
  "GameIcon": ""
}
```

### PlanetFesQuestGroup.json (0.00 MB, 7 条)

**字段** (3): `GroupID, QuestList, RewardIDList`

**首条记录摘要**:
```json
{
  "GroupID": 104,
  "QuestList": "[3001, 3002, 3003, 3004, 3005, 3006, 300...",
  "RewardIDList": "[13001, 13002, 13003, 13004, 13005, 1300..."
}
```

### SpaceZooSlotTags.json (0.00 MB, 15 条)

**字段** (3): `FeatureID, Channel, ImagePath`

**首条记录摘要**:
```json
{
  "FeatureID": 100,
  "Channel": "BodyDecal",
  "ImagePath": "SpriteOutput/Quest/SpaceZoo/SpaceZooIcon..."
}
```

### GridFightTraitVideo.json (0.00 MB, 18 条)

**字段** (3): `TraitID, VideoID, Description`

**首条记录摘要**:
```json
{
  "TraitID": 1001,
  "VideoID": 17001,
  "Description": {
    "Hash": 14207447682659426092
  }
}
```

### SilverWolfSubTab.json (0.00 MB, 9 条)

**字段** (7): `TabType, GroupID, QuestList, FinalQuest, UnlockMission, EntranceID, MappingInfoID`

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

### FateRinCaseBoardTeamInfo.json (0.00 MB, 10 条)

**字段** (3): `JCDIEKGKCPP, NMAHGFAPENI, BGNGIBBEGMB`

**首条记录摘要**:
```json
{
  "JCDIEKGKCPP": "TrailblazerRin",
  "NMAHGFAPENI": {
    "Hash": 17391385267496103767
  },
  "BGNGIBBEGMB": {
    "Hash": 14603695102054900311
  }
}
```

### PlayerOutfitBase.json (0.00 MB, 22 条)

**字段** (2): `OutfitID, SlotTypeList`

**首条记录摘要**:
```json
{
  "OutfitID": 1000,
  "SlotTypeList": [
    "HeadDecor"
  ]
}
```

### GuideRogueData.json (0.00 MB, 6 条)

**字段** (7): `ID, Name, IconPath, TabIconPath, UnlockConditions, OpenConditions, TabID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 7618010570370743835
  },
  "IconPath": "",
  "TabIconPath": "",
  "UnlockConditions": "[{\"Type\": \"PlayerLevel\", \"Param\": \"21\"},...",
  "OpenConditions": "[{\"Type\": \"FinishSubMission\", \"Param\": \"...",
  "TabID": 1001
}
```

### TeamTowersConstClient.json (0.00 MB, 16 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "TeamTowers_SilverWolfIcon",
  "Value": "{\"StringValue\": \"SpriteOutput/Quest/Team..."
}
```

### AdventurePlayerEnhanced.json (0.00 MB, 10 条)

**字段** (4): `ID, EnhancedID, PlayerJsonPath, MazeSkillIdList`

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

### TarotBookRevealedCharacter.json (0.00 MB, 12 条)

**字段** (4): `ID, UnlockID, Name, MainCatalogTitle`

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

### ItemConfigAvatarPlayerIcLD.json (0.00 MB, 4 条)

**字段** (15): `ID, ItemMainType, ItemSubType, InventoryDisplayTag, Rarity, isVisible, ItemName, ItemIconPath, ItemFigureIconPath, ItemCurrencyIconPath, ItemAvatarIconPath, PileLimit, UseMethod, CustomDataList, ReturnItemIDList`

**首条记录摘要**:
```json
{
  "ID": 201014,
  "ItemMainType": "Usable",
  "ItemSubType": "HeadIcon",
  "InventoryDisplayTag": 1,
  "Rarity": "SuperRare",
  "isVisible": true,
  "ItemName": {
    "Hash": 9372088759984559843
  },
  "ItemIconPath": "SpriteOutput/AvatarRoundIcon/Avatar/1014...",
  "ItemFigureIconPath": "",
  "ItemCurrencyIconPath": "",
  "ItemAvatarIconPath": "",
  "PileLimit": 1,
  "UseMethod": "AutoConversionItem",
  "CustomDataList": [],
  "ReturnItemIDList": []
}
```

### ChenLingConstValueClient.json (0.00 MB, 15 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_ChenLing_AtkMaxTimes_PerSec",
  "Value": {
    "IntValue": 10
  }
}
```

### FateRinHouguKeyword.json (0.00 MB, 12 条)

**字段** (4): `PHFMCACHFIJ, OENAMINOLLF, NMAHGFAPENI, NKEJALOLCIF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "OENAMINOLLF": {
    "Hash": 5294278101553205987
  },
  "NMAHGFAPENI": {
    "Hash": 6946172744543695082
  },
  "NKEJALOLCIF": true
}
```

### EvoBdSCBoxItem.json (0.00 MB, 10 条)

**字段** (2): `ID, ItemIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ItemIDList": "[3113001, 3113002, 3113003, 3113114, 311..."
}
```

### EvolveBuildForgeMaterial.json (0.00 MB, 13 条)

**字段** (3): `ForgeGearID, MaterialGearList, CostGearList`

**首条记录摘要**:
```json
{
  "ForgeGearID": 3106901,
  "MaterialGearList": {
    "3106001": 8,
    "3106124": 1
  },
  "CostGearList": [
    3106001
  ]
}
```

### ElationSkill.json (0.00 MB, 30 条)

**字段** (2): `ElationSkillID, PriorityValue`

**首条记录摘要**:
```json
{
  "ElationSkillID": 150120,
  "PriorityValue": 144
}
```

### ActivityHipplenInteractInfo.json (0.00 MB, 4 条)

**字段** (6): `JsonConfigPath, PrefabPath, IconPath, PropIDList, Hint, InAreaHint`

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

### BackGroundMusicWhiteNoise.json (0.00 MB, 13 条)

**字段** (3): `PHFMCACHFIJ, OLOIFNNLKJP, DHMDAEKJENF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 215001,
  "OLOIFNNLKJP": "UI/Atlas/AtlasRoot/Common/Icon/IconWeath...",
  "DHMDAEKJENF": "Ev_amb_starrail_rain"
}
```

### RestaurantFacilityConfig.json (0.00 MB, 13 条)

**字段** (4): `FacilityID, Type, UnlockIDList, Name`

**首条记录摘要**:
```json
{
  "FacilityID": 101,
  "Type": "Table",
  "UnlockIDList": [],
  "Name": {
    "Hash": 14329161034240783518
  }
}
```

### MuseumMission.json (0.00 MB, 17 条)

**字段** (3): `MuseumMissionID, Type, TypeParameter`

**首条记录摘要**:
```json
{
  "MuseumMissionID": 11,
  "Type": "AreaLevel",
  "TypeParameter": [
    1,
    5,
    1
  ]
}
```

### PamSkinConfig.json (0.00 MB, 5 条)

**字段** (5): `SkinID, SkinIcon, ConfigEntityPath, JsonPath, ManikinPrefab`

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

### SwordTrainingEnding.json (0.00 MB, 5 条)

**字段** (7): `EndingID, StoryID, QuestID, StoryImage, StoryUnlockImage, StoryTitle, UnlockDesc`

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

### ChenLingEnchant.json (0.00 MB, 9 条)

**字段** (4): `ID, Name, Desc, SmallIconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 7195590270945117180
  },
  "Desc": {
    "Hash": 2815466407258098357
  },
  "SmallIconPath": "SpriteOutput/Quest/ActivityChenLing/Buff..."
}
```

### RogueNousMiscDisplay.json (0.00 MB, 20 条)

**字段** (2): `DisplayID, DisplayContent`

**首条记录摘要**:
```json
{
  "DisplayID": 100,
  "DisplayContent": {
    "Hash": 5745626520447684580
  }
}
```

### MonopolyDisplayCell.json (0.00 MB, 7 条)

**字段** (6): `DisplayID, Type, IconPath, CellName, CellDesc, DisplaySort`

**首条记录摘要**:
```json
{
  "DisplayID": 1,
  "Type": "Common",
  "IconPath": "SpriteOutput/Quest/Monopoly/MapIcon/Mono...",
  "CellName": {
    "Hash": 12533588023810573879
  },
  "CellDesc": {
    "Hash": 5997746460564156951
  },
  "DisplaySort": 10
}
```

### WorldLevelConfig.json (0.00 MB, 7 条)

**字段** (5): `MaxPlayerLevel, LevelUpMission, Breaktips1, Breaktips2, LevelUpMissionTips`

**首条记录摘要**:
```json
{
  "MaxPlayerLevel": 20,
  "LevelUpMission": 4020101,
  "Breaktips1": {
    "Hash": 11730014845369790229
  },
  "Breaktips2": {
    "Hash": 16020206661773507787
  },
  "LevelUpMissionTips": {
    "Hash": 11669373064128698006
  }
}
```

### LoadingFuncConfig.json (0.00 MB, 8 条)

**字段** (5): `LoadingFuncID, LoadingFuncType, LoadingFuncTypeParam, RandomNumber, LoadingRandomParam`

**首条记录摘要**:
```json
{
  "LoadingFuncID": 101,
  "LoadingFuncType": "WorldTele",
  "LoadingFuncTypeParam": [
    100
  ],
  "RandomNumber": 10,
  "LoadingRandomParam": "{\"NormalIP\": 10, \"NormalRule\": 4, \"World..."
}
```

### MonopolyCellResource.json (0.00 MB, 13 条)

**字段** (3): `ResourceID, IconPath, Type`

**首条记录摘要**:
```json
{
  "ResourceID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/3DBlockIcon/...",
  "Type": "ChangeColor"
}
```

### BoxingClubActivityQuest.json (0.00 MB, 12 条)

**字段** (4): `ID, Name, ChallengeID, QuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "BoxingClubChallenge_Name_1",
  "ChallengeID": 1,
  "QuestList": [
    6000060,
    6000061,
    6000062
  ]
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

### RogueDLCAeonCross.json (0.00 MB, 16 条)

**字段** (5): `MainAeonID, SubAeonID, MainAeonNum, SubAeonNum, BuffGroup`

**首条记录摘要**:
```json
{
  "MainAeonID": 1,
  "SubAeonID": 3,
  "MainAeonNum": 3,
  "SubAeonNum": 3,
  "BuffGroup": 12021
}
```

### MonopolyQuizConfig.json (0.00 MB, 8 条)

**字段** (5): `QuizID, Duration, QuizTaskIDList, QuizName, QuizDesc`

**首条记录摘要**:
```json
{
  "QuizID": 101,
  "Duration": 6,
  "QuizTaskIDList": [
    1011,
    1012,
    1013
  ],
  "QuizName": {
    "Hash": 3636567354941826972
  },
  "QuizDesc": {
    "Hash": 16323366398742956686
  }
}
```

### RelicSetBonusValue.json (0.00 MB, 15 条)

**字段** (4): `SetID, Property, Threshold, BonusValue`

**首条记录摘要**:
```json
{
  "SetID": 124,
  "Property": "Speed",
  "Threshold": {
    "Value": 95.01
  },
  "BonusValue": -10
}
```

### TeamTowersBossSkillGroup.json (0.00 MB, 16 条)

**字段** (3): `PHFMCACHFIJ, GMPGDEINODK, KPHIIIDGLEB`

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

### ChenLingMagic.json (0.00 MB, 12 条)

**字段** (4): `ID, Name, Desc, EffectID`

**首条记录摘要**:
```json
{
  "ID": 2,
  "Name": {
    "Hash": 17885047008040132960
  },
  "Desc": {
    "Hash": 18136215418303127739
  },
  "EffectID": 302
}
```

### FateRinCaseBoardServant.json (0.00 MB, 10 条)

**字段** (7): `HOPKBCJIOCD, JKIMMLOIJKJ, JFOOFHLOJAO, AMOILJKCNOI, HLBMOIKELLN, PPMFCIIEGJF, MNMGEPNEJDO`

**首条记录摘要**:
```json
{
  "HOPKBCJIOCD": "Trailblazer",
  "JKIMMLOIJKJ": "?",
  "JFOOFHLOJAO": "?",
  "AMOILJKCNOI": "?",
  "HLBMOIKELLN": "?",
  "PPMFCIIEGJF": "?",
  "MNMGEPNEJDO": "?"
}
```

### BattleEventButtonTypeConfig.json (0.00 MB, 7 条)

**字段** (5): `ID, ButtonPath, ButtonReadyPath, CutinPath, SkillButtonEffPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ButtonPath": "UI/Battle/SkillButton/BattleItemUseMiniB...",
  "ButtonReadyPath": "UI/Battle/SkillButton/BattleItemUseButto...",
  "CutinPath": "UI/Battle/SpecialAction/SpecialAction_It...",
  "SkillButtonEffPath": ""
}
```

### ActivityFeverTimeTutorial.json (0.00 MB, 12 条)

**字段** (3): `P2AvailableBuffID, TutorialID, RecommendAvatarList`

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

### MuseumPhase.json (0.00 MB, 5 条)

**字段** (8): `MuseumPhaseID, RenewPointCost, UnlockMissionID, UnlockAreaID, PhaseQuestID, PhaseTextID, PhaseIconPath, PhaseName`

**首条记录摘要**:
```json
{
  "MuseumPhaseID": 1,
  "RenewPointCost": 4000,
  "UnlockMissionID": 8001266,
  "UnlockAreaID": 1,
  "PhaseQuestID": 6000101,
  "PhaseTextID": {
    "Hash": 1886020956422722396
  },
  "PhaseIconPath": "SpriteOutput/Quest/Museum/MuseumPhaseIco...",
  "PhaseName": {
    "Hash": 2000627003234660789
  }
}
```

### StrongChallengeBuffConfig.json (0.00 MB, 28 条)

**字段** (2): `StrongChallengeBuffID, BuffCost`

**首条记录摘要**:
```json
{
  "StrongChallengeBuffID": 3104101,
  "BuffCost": 1
}
```

### ChimeraDuelRank.json (0.00 MB, 6 条)

**字段** (4): `RankLevel, RankIconPath, RankName, RankIconPrefabPath`

**首条记录摘要**:
```json
{
  "RankLevel": 1,
  "RankIconPath": "SpriteOutput/PlayerRankIcon/CommonPlayer...",
  "RankName": {
    "Hash": 16904384042463888315
  },
  "RankIconPrefabPath": "Assets/AsbRes/UI/CommonKits/Icon/CommonP..."
}
```

### PlayerReturnRecommendConfig.json (0.00 MB, 8 条)

**字段** (6): `RecommendID, Type, Weight, ImagePath, Condition, GachaID`

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

### AlleyMapReward.json (0.00 MB, 19 条)

**字段** (4): `ScoreID, LayerID, MapScore, RewardID`

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

**字段** (3): `PHFMCACHFIJ, BDACPPLKLGL, FBKAMIHGLFK`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "BDACPPLKLGL": "Gameplays/HipplenBuilder/Prefabs/Props/A...",
  "FBKAMIHGLFK": "SpriteOutput/Quest/Hipplen/FindGoods/Hip..."
}
```

### MusicRhythmSoundEffect.json (0.00 MB, 16 条)

**字段** (2): `ID, SoundEffectIconPath`

**首条记录摘要**:
```json
{
  "ID": 11,
  "SoundEffectIconPath": "SpriteOutput/Quest/MusicRhythm/MusicRhyt..."
}
```

### IdleLiveReply.json (0.00 MB, 21 条)

**字段** (2): `ID, OptionText`

**首条记录摘要**:
```json
{
  "ID": 1014,
  "OptionText": {
    "Hash": 16247815956139743247
  }
}
```

### GridFightTalentMazebuff.json (0.00 MB, 3 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35602011,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_35602011",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_Season_35602011",
  "ParamList": [
    {
      "Value": 1
    }
  ],
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 1146816021674428379
  },
  "BuffDesc": {
    "Hash": 5820098661361095371
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### ChimeraDuelGame.json (0.00 MB, 6 条)

**字段** (6): `GameID, WinCon, CoinNum, GameType, RoundIDList, ChimeraNumLimitList`

**首条记录摘要**:
```json
{
  "GameID": 701,
  "WinCon": 5,
  "CoinNum": 1,
  "GameType": "PVP",
  "RoundIDList": "[1001, 1002, 1003, 1004, 1005, 1006, 100...",
  "ChimeraNumLimitList": []
}
```

### HeartDialTraceConsume.json (0.00 MB, 8 条)

**字段** (5): `HeartDialTraceID, MaterialCost, FloorID, MapInfoID, MiniMapID`

**首条记录摘要**:
```json
{
  "HeartDialTraceID": 1,
  "MaterialCost": [
    {
      "ItemID": 122000,
      "ItemNum": 1
    }
  ],
  "FloorID": 10301001,
  "MapInfoID": 2383,
  "MiniMapID": 192
}
```

### RogueTournLayer.json (0.00 MB, 34 条)

**字段** (2): `LayerID, LayerNumID`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "LayerNumID": 101
}
```

### ItemPurpose.json (0.00 MB, 21 条)

**字段** (2): `ID, PurposeText`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PurposeText": {
    "Hash": 8092518062232321212
  }
}
```

### ChallengeStoryRewardLine.json (0.00 MB, 24 条)

**字段** (3): `GroupID, StarCount, RewardID`

**首条记录摘要**:
```json
{
  "GroupID": 2000,
  "StarCount": 1,
  "RewardID": 101501
}
```

### AdventurePlayerLD.json (0.00 MB, 4 条)

**字段** (7): `ID, AvatarID, PlayerName, PlayerPrefabPath, PlayerJsonPath, DefaultAvatarHeadIconPath, MazeSkillIdList`

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

**字段** (2): `ID, Content`

**首条记录摘要**:
```json
{
  "ID": 105440000,
  "Content": {
    "Hash": 17236653353538695838
  }
}
```

### BookSeriesWorld.json (0.00 MB, 6 条)

**字段** (4): `BookSeriesWorld, BookSeriesWorldTextmapID, BookSeriesWorldIconPath, BookSeriesWorldBackgroundPath`

**首条记录摘要**:
```json
{
  "BookSeriesWorld": 1,
  "BookSeriesWorldTextmapID": {
    "Hash": 11503545092450896779
  },
  "BookSeriesWorldIconPath": "SpriteOutput/TabIcon/World/World00Icon.p...",
  "BookSeriesWorldBackgroundPath": "SpriteOutput/Mission/ChapterIconBig/Chap..."
}
```

### BoxingClubConstValueClient.json (0.00 MB, 10 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "BoxingClubResonance_UnlockMissionList",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 2010720}, {..."
}
```

### IdleLiveChestRank.json (0.00 MB, 12 条)

**字段** (2): `Rank, RarityList`

**首条记录摘要**:
```json
{
  "Rank": 1,
  "RarityList": [
    8000,
    2000,
    0,
    0,
    0,
    0,
    0
  ]
}
```

### RogueNousStoryReward.json (0.00 MB, 29 条)

**字段** (2): `MainStoryReward, QuestID`

**首条记录摘要**:
```json
{
  "MainStoryReward": 1,
  "QuestID": 6014301
}
```

### AetherDivideChallengeRank.json (0.00 MB, 6 条)

**字段** (6): `ChallengeRank, TrainerLevel, ActivityModuleID, IconPath, FunctionUnlockID, UnlockText`

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

**字段** (4): `ItemID, PartID, IsDefault, ColorName`

**首条记录摘要**:
```json
{
  "ItemID": 262000,
  "PartID": 1,
  "IsDefault": true,
  "ColorName": "Skin1"
}
```

### GridFightEquipCategoryInfo.json (0.00 MB, 14 条)

**字段** (3): `EquipCategory, CategoryName, EquipCount`

**首条记录摘要**:
```json
{
  "EquipCategory": "Basic",
  "CategoryName": {
    "Hash": 2072718879487809846
  },
  "EquipCount": 1
}
```

### RogueShop.json (0.00 MB, 29 条)

**字段** (1): `RogueShopID`

**首条记录摘要**:
```json
{
  "RogueShopID": 100011
}
```

### MonopolyClickContentConfig.json (0.00 MB, 40 条)

**字段** (2): `ID, ClickNum`

**首条记录摘要**:
```json
{
  "ID": 999,
  "ClickNum": 1
}
```

### RogueDLCJoyHelp.json (0.00 MB, 17 条)

**字段** (2): `AeonDimensionID, PlayShortDesc`

**首条记录摘要**:
```json
{
  "AeonDimensionID": 1,
  "PlayShortDesc": {
    "Hash": 7557666616111862424
  }
}
```

### RestaurantSelectEventConfig.json (0.00 MB, 9 条)

**字段** (6): `SelectEventID, Describe, ContactsID, OpEffect1, OpEffect2, Type`

**首条记录摘要**:
```json
{
  "SelectEventID": 101,
  "Describe": {
    "Hash": 5132074185417883815
  },
  "ContactsID": 201,
  "OpEffect1": 10101,
  "OpEffect2": 10102,
  "Type": "Normal"
}
```

### RogueMagicGambleGroup.json (0.00 MB, 10 条)

**字段** (3): `GambleGroupID, GambleGroupType, GambleGroupIcon`

**首条记录摘要**:
```json
{
  "GambleGroupID": 100,
  "GambleGroupType": "SlotMachine",
  "GambleGroupIcon": ""
}
```

### ChenLingEffectProgress.json (0.00 MB, 16 条)

**字段** (4): `ID, Progress, ActionIDList, EffectIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Progress": 3,
  "ActionIDList": [
    1
  ],
  "EffectIDList": []
}
```

### RollShopReward.json (0.00 MB, 32 条)

**字段** (2): `GroupID, RewardID`

**首条记录摘要**:
```json
{
  "GroupID": 101,
  "RewardID": 201000
}
```

### MapSpaceTypeConfig.json (0.00 MB, 9 条)

**字段** (2): `Icon, SortID`

**首条记录摘要**:
```json
{
  "Icon": "",
  "SortID": 1
}
```

### RogueMagicLayer.json (0.00 MB, 32 条)

**字段** (2): `LayerID, LayerNumID`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "LayerNumID": 101
}
```

### ChallengePeakReward.json (0.00 MB, 13 条)

**字段** (5): `ID, RewardGroupID, RewardType, TypeValue, RewardID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RewardGroupID": 1,
  "RewardType": "MOB_PASS_REWARD",
  "TypeValue": 1,
  "RewardID": 102301
}
```

### FateDiffPassProgress.json (0.00 MB, 8 条)

**字段** (3): `GAOMJHOKMMG, FMCNCMENCFF, IODFDGLGOJI`

**首条记录摘要**:
```json
{
  "GAOMJHOKMMG": {
    "Hash": 8519915564627777067
  },
  "FMCNCMENCFF": {
    "Hash": 15081302720934571633
  },
  "IODFDGLGOJI": {
    "Hash": 671872345689336793
  }
}
```

### HeartDialBillboard.json (0.00 MB, 24 条)

**字段** (1): `MapIconID`

**首条记录摘要**:
```json
{
  "MapIconID": 136
}
```

### ClockParkBuffType.json (0.00 MB, 14 条)

**字段** (4): `BuffType, BuffJoint, BuffDisplay, IconPath`

**首条记录摘要**:
```json
{
  "BuffType": "FirstAttributeContinue",
  "BuffJoint": true,
  "BuffDisplay": true,
  "IconPath": "SpriteOutput/IconDamageType/IconDamageTy..."
}
```

### RecommendConfig.json (0.00 MB, 7 条)

**字段** (7): `ID, Order, OrderAfterSell, Type, ImagePath, NameText, GoodsID`

**首条记录摘要**:
```json
{
  "ID": 3,
  "Order": 30,
  "OrderAfterSell": 130,
  "Type": 15,
  "ImagePath": "SpriteOutput/TabIcon/Shop/AnniversaryGif...",
  "NameText": "ShopRecommend_3",
  "GoodsID": []
}
```

### ActivityHipplenGift.json (0.00 MB, 9 条)

**字段** (4): `PHFMCACHFIJ, AEONKNDCDKN, MONJPEJECGL, LOGJBKBLNEM`

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

### PlayerOutfitSlot.json (0.00 MB, 8 条)

**字段** (6): `SlotType, DefaultOutfitID, SlotName, SlotTipsIntroID, SlotIconPath, VirtualCameraPath`

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

### RogueTournMiscDisplay.json (0.00 MB, 17 条)

**字段** (2): `DisplayID, DisplayContent`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "DisplayContent": {
    "Hash": 4363364653664122176
  }
}
```

### MapEntranceGroup.json (0.00 MB, 13 条)

**字段** (4): `ID, MapGuideID, Type, GroupName`

**首条记录摘要**:
```json
{
  "ID": 10000,
  "MapGuideID": 1001,
  "Type": 1,
  "GroupName": {
    "Hash": 15953137022438924263
  }
}
```

### ChimeraGalleryTalk.json (0.00 MB, 9 条)

**字段** (4): `ConditionType, Title, NumberedTitle, Sort`

**首条记录摘要**:
```json
{
  "ConditionType": "UseAbility",
  "Title": {
    "Hash": 3240698813497397429
  },
  "NumberedTitle": {
    "Hash": 13365392720921639745
  },
  "Sort": 4
}
```

### RogueTournKeywordParam.json (0.00 MB, 9 条)

**字段** (2): `KeywordID, ParamList`

**首条记录摘要**:
```json
{
  "KeywordID": 1615010,
  "ParamList": "[{\"Value\": 1.8}, {\"Value\": 0.35}, {\"Valu..."
}
```

### PixAirRecommendConfig.json (0.00 MB, 6 条)

**字段** (5): `ID, CoreID, EquipList, Title, CoreRecommendTags`

**首条记录摘要**:
```json
{
  "ID": 1,
  "CoreID": 301,
  "EquipList": "[3101, 3102, 3103, 3104, 3105, 3106, 360...",
  "Title": {
    "Hash": 3185185266711017959
  },
  "CoreRecommendTags": [
    "Damage"
  ]
}
```

### TitanAtlasVoicePool.json (0.00 MB, 12 条)

**字段** (4): `TitanVoiceID, TitanVoicePoolID, Weight, AudioEvent`

**首条记录摘要**:
```json
{
  "TitanVoiceID": 1010101,
  "TitanVoicePoolID": 10101,
  "Weight": 100,
  "AudioEvent": "Ev_archive_vo_god05_war"
}
```

### FateRinSwitchDayTalk.json (0.00 MB, 13 条)

**字段** (3): `GNIFLCBGAAA, EOAGGGKKHLN, IBGNNBCPHFO`

**首条记录摘要**:
```json
{
  "GNIFLCBGAAA": 1,
  "EOAGGGKKHLN": 1,
  "IBGNNBCPHFO": {
    "Hash": 6142144686994576644
  }
}
```

### DrinkMakerNote.json (0.00 MB, 12 条)

**字段** (3): `GuestID, UnlockDay, DrinkMakerNoteList`

**首条记录摘要**:
```json
{
  "GuestID": 1,
  "UnlockDay": 1,
  "DrinkMakerNoteList": [
    {
      "Hash": 2779135793181659283
    }
  ]
}
```

### FateArea.json (0.00 MB, 3 条)

**字段** (9): `BEOFPCAACEP, MHNEABPPJBG, LMPLLJFMFEC, NDAAAOEGMNL, GIGIHGOFGMN, LMFDBGIAPFC, ECCJCKCCPBP, FAEHFMIFPBG, ANKBAKDHDJD`

**首条记录摘要**:
```json
{
  "BEOFPCAACEP": 1000000,
  "MHNEABPPJBG": [
    10,
    20,
    30,
    40,
    50,
    60,
    80
  ],
  "LMPLLJFMFEC": [
    200,
    175,
    150,
    125,
    100,
    75,
    50,
    0
  ],
  "NDAAAOEGMNL": {
    "Hash": 12927496900320682000
  },
  "GIGIHGOFGMN": {
    "Hash": 9909995690541294199
  },
  "LMFDBGIAPFC": {
    "Hash": 6594948133766771045
  },
  "ECCJCKCCPBP": "[9021014, 3321313, 3231303, 3231217, 902...",
  "FAEHFMIFPBG": 3151101,
  "ANKBAKDHDJD": "Guide"
}
```

### FinishActionConfig.json (0.00 MB, 27 条)

**字段** (0): ``

**首条记录摘要**:
```json
{}
```

### ActivityDiceV2Brand.json (0.00 MB, 6 条)

**字段** (4): `PHFMCACHFIJ, OENAMINOLLF, ABJGONAEFCB, JCNCDOOLACB`

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

### ChimeraTeamTalk.json (0.00 MB, 14 条)

**字段** (3): `TalkID, TalkContent, Effect`

**首条记录摘要**:
```json
{
  "TalkID": 10307,
  "TalkContent": {
    "Hash": 15074812439767437584
  },
  "Effect": "Fire"
}
```

### ChenLingBuildingLevel.json (0.00 MB, 24 条)

**字段** (3): `BuildingID, Level, EffectID`

**首条记录摘要**:
```json
{
  "BuildingID": 2,
  "Level": 1,
  "EffectID": 2021
}
```

### PetConfig.json (0.00 MB, 5 条)

**字段** (6): `PetID, PetItemID, SummonUnitID, UIPetModelPath, ManikinJsonPath, UIIdleShow`

**首条记录摘要**:
```json
{
  "PetID": 1001,
  "PetItemID": 251001,
  "SummonUnitID": 24001,
  "UIPetModelPath": "Characters/CharacterPrefabs/Manikin/Pet/...",
  "ManikinJsonPath": "Config/ConfigCharacter/Manikin/Pet/Manik...",
  "UIIdleShow": "Idle_Show_02"
}
```

### LimitType.json (0.00 MB, 9 条)

**字段** (3): `LimitType, LimitTypeDesc, LimitTypeDetailDesc`

**首条记录摘要**:
```json
{
  "LimitType": "Level",
  "LimitTypeDesc": {
    "Hash": 3548003916367050775
  },
  "LimitTypeDetailDesc": {
    "Hash": 695601595237057866
  }
}
```

### PlanetFesBuffType.json (0.00 MB, 8 条)

**字段** (3): `ID, Decription, IconPath`

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

### MapEntranceUnlock.json (0.00 MB, 14 条)

**字段** (2): `EntranceID, UnlockConditionExpression`

**首条记录摘要**:
```json
{
  "EntranceID": 1000102,
  "UnlockConditionExpression": "[RealFinishMainMission:1000400]"
}
```

### MazePuzzleConfig.json (0.00 MB, 10 条)

**字段** (3): `PuzzleFuncType, IconPath, ShowFuncBtnHint`

**首条记录摘要**:
```json
{
  "PuzzleFuncType": "Info",
  "IconPath": "SpriteOutput/MazePuzzleIcon/TreasureMap....",
  "ShowFuncBtnHint": {
    "Hash": 15237219729869738325
  }
}
```

### RogueMagicDifficultyComp.json (0.00 MB, 6 条)

**字段** (5): `DifficultyCompID, UnlockID, Level, DifficultyDesc, ParamList`

**首条记录摘要**:
```json
{
  "DifficultyCompID": 10101,
  "UnlockID": 5013005,
  "Level": 1,
  "DifficultyDesc": {
    "Hash": 16020208869497004996
  },
  "ParamList": "[{\"Value\": 1}, {\"Value\": 5}, {\"Value\": 1..."
}
```

### GridFightTraitBaseConfig_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `PNPJBPCMINL, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "[{\"PHFMCACHFIJ\": 1001}, {\"PHFMCACHFIJ\": ..."
}
```

### ClockParkLottery.json (0.00 MB, 12 条)

**字段** (4): `LotteryID, LotteryAttributeGain, Weight, LotteryType`

**首条记录摘要**:
```json
{
  "LotteryID": 41,
  "LotteryAttributeGain": {
    "AttributeA": 4
  },
  "Weight": 1,
  "LotteryType": 4
}
```

### PlanetFesSummary.json (0.00 MB, 9 条)

**字段** (4): `ID, TargetNum, Name, Description`

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

### HeliobusActivityQuest.json (0.00 MB, 7 条)

**字段** (5): `QuestTabID, QuestTabName, TypeGroupID, QuestList, ActivityModuleID`

**首条记录摘要**:
```json
{
  "QuestTabID": 1,
  "QuestTabName": {
    "Hash": 14536884776425909639
  },
  "TypeGroupID": 1,
  "QuestList": "[6032101, 6032102, 6032103, 6032209, 603...",
  "ActivityModuleID": 5000606
}
```

### AetherDivideTrainerLevel.json (0.00 MB, 5 条)

**字段** (6): `ID, Name, IconPath, QuestID, RareMonsterNumID, QuestList`

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

### IdleLiveTeamSlot.json (0.00 MB, 7 条)

**字段** (4): `Slot, Type, Name, SlotPowerFactor`

**首条记录摘要**:
```json
{
  "Slot": 1,
  "Type": "Captain",
  "Name": {
    "Hash": 5019249625605932392
  },
  "SlotPowerFactor": {
    "Value": 1.2
  }
}
```

### MuseumAreaConfig.json (0.00 MB, 4 条)

**字段** (6): `AreaID, MuseumAreaName, FirstWorldText, MuseumAreaTabIcon, MuseumAreaHintIcon, AreaItemNoTextID`

**首条记录摘要**:
```json
{
  "AreaID": 1,
  "MuseumAreaName": {
    "Hash": 17847216903392680159
  },
  "FirstWorldText": "General",
  "MuseumAreaTabIcon": "SpriteOutput/Quest/Museum/MuseumAreaTabI...",
  "MuseumAreaHintIcon": "SpriteOutput/Quest/Museum/MuseumAreaHint...",
  "AreaItemNoTextID": {
    "Hash": 9498466054790979532
  }
}
```

### GridFightNodeTypeShow.json (0.00 MB, 5 条)

**字段** (5): `NodeType, NodeName, NodeDetailName, NodePic, NodeDesc`

**首条记录摘要**:
```json
{
  "NodeType": "Monster",
  "NodeName": {
    "Hash": 5371430405571759387
  },
  "NodeDetailName": {
    "Hash": 628531430381561032
  },
  "NodePic": "SpriteOutput/GridFight/ProgressIcon/Grid...",
  "NodeDesc": {
    "Hash": 5626677263404827289
  }
}
```

### TrainPartyLogConfig.json (0.00 MB, 12 条)

**字段** (3): `LogType, LogContent, Priority`

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

### ItemRecycle.json (0.00 MB, 12 条)

**字段** (4): `ItemID, RecycleTime, Tips, ShowType`

**首条记录摘要**:
```json
{
  "ItemID": 270000,
  "RecycleTime": "",
  "Tips": {
    "Hash": 13669093689788819786
  },
  "ShowType": "ItemRecycleShow_Time"
}
```

### RecordRefresh.json (0.00 MB, 14 条)

**字段** (2): `RefreshID, RefreshTime`

**首条记录摘要**:
```json
{
  "RefreshID": 1,
  "RefreshTime": [
    0
  ]
}
```

### ActivityDiceV2TacticsPoint.json (0.00 MB, 8 条)

**字段** (4): `PHFMCACHFIJ, BEEFBPGJJOD, BDGECKGNFFM, KEGANNHEKHA`

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

### LimaoNewsSpecial.json (0.00 MB, 5 条)

**字段** (7): `IHALCLABNOJ, OOKJNEGICEI, OMLFNLJDHKG, BDKECJFBAJJ, AEONKNDCDKN, LIDHGBEAJMA, CFKKNEHABHH`

**首条记录摘要**:
```json
{
  "IHALCLABNOJ": 1,
  "OOKJNEGICEI": [
    201,
    202,
    203
  ],
  "OMLFNLJDHKG": [
    2400030
  ],
  "BDKECJFBAJJ": [
    2400004
  ],
  "AEONKNDCDKN": 8015010,
  "LIDHGBEAJMA": [
    201001,
    202003,
    201010
  ],
  "CFKKNEHABHH": "PressConference"
}
```

### FateRinChallengeFight.json (0.00 MB, 4 条)

**字段** (7): `PHFMCACHFIJ, DOBKKDIECDO, HNEIIAGADGO, JFDHFPIIGCC, BFMNOLGCCKH, FOHHOOKJPIM, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "DOBKKDIECDO": 429401,
  "HNEIIAGADGO": 2051102,
  "JFDHFPIIGCC": 5014020,
  "BFMNOLGCCKH": "SpriteOutput/Collaboration/FateRin/FateR...",
  "FOHHOOKJPIM": "[3232001, 3232002, 3232003, 3232004, 323...",
  "OENAMINOLLF": {
    "Hash": 11169810328513533655
  }
}
```

### AvatarUltraSkillConfig.json (0.00 MB, 7 条)

**字段** (4): `AvatarID, UltraSkillType, UltraSkillResourcePath, UltraSkillUse`

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

**字段** (16): `AvatarID, SkillID, Name, SkillTag, Desc, SimpleDesc, ParamList, SimpleParamList, ExtraEffectIDList, SimpleExtraEffectIDList, MazeBuffID, GameModeBlackList, StageTypeBlackList, TeamStageTypeBlackList, TeamBlackList, TrialBagStageTypeWhiteList`

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

### TarotWikiTimeline.json (0.00 MB, 9 条)

**字段** (4): `ID, Title, Progress, DataList`

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

### EvolveBuildReward.json (0.00 MB, 21 条)

**字段** (1): `RewardID`

**首条记录摘要**:
```json
{
  "RewardID": 100
}
```

### PassengerBehaviorConfig.json (0.00 MB, 6 条)

**字段** (6): `BehaviorID, FloorID, AnchorID, NPCGroupID, NPCID, NPCOverrideConfig`

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

### TrainPartyTeam.json (0.00 MB, 6 条)

**字段** (5): `TeamID, PassengerList, TeamName, LeaderWorkingBuffID, GridNum`

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

### BattleAreaUnifiedConfig.json (0.00 MB, 55 条)

**字段** (1): `ID`

**首条记录摘要**:
```json
{
  "ID": 1001
}
```

### PlanetFesGameRewardPool.json (0.00 MB, 8 条)

**字段** (4): `RewardPoolID, Order, Type, RewardParam`

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

### FateRinDeck.json (0.00 MB, 4 条)

**字段** (8): `PHFMCACHFIJ, LOALOLNACOA, LIPCDDAPHNF, NMAHGFAPENI, KJGFIMDLFHF, NMPFJBDGGDE, DHJDDBMCNKJ, ENKMNJDEMJE`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "LOALOLNACOA": "Trailblazer",
  "LIPCDDAPHNF": 105440004,
  "NMAHGFAPENI": {
    "Hash": 4509853725992352812
  },
  "KJGFIMDLFHF": {
    "Hash": 11616481830773731159
  },
  "NMPFJBDGGDE": {
    "Hash": 6597126118314974636
  },
  "DHJDDBMCNKJ": {
    "Hash": 7780540486347622573
  },
  "ENKMNJDEMJE": 10201
}
```

### LimaoNewsLocation.json (0.00 MB, 16 条)

**字段** (1): `JFKMCIFGHLK`

**首条记录摘要**:
```json
{
  "JFKMCIFGHLK": {
    "Hash": 1652022200471624107
  }
}
```

### TrainPartyConstValueCommon.json (0.00 MB, 8 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "train_party_need_break_move_grid_type_li...",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 11}, {\"IntV..."
}
```

### ActivityHipplenPhaseGrade.json (0.00 MB, 9 条)

**字段** (3): `GradeType, GradeShowText, GradeIcon`

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

### HeliobusPostTypeConfig.json (0.00 MB, 5 条)

**字段** (4): `PostType, PostTypeIconPath, PostTypeIconPathUnselected, PostTypeName`

**首条记录摘要**:
```json
{
  "PostType": "MissionMain",
  "PostTypeIconPath": "SpriteOutput/Quest/Heliobus/HeliobusIcon...",
  "PostTypeIconPathUnselected": "SpriteOutput/Quest/Heliobus/HeliobusIcon...",
  "PostTypeName": {
    "Hash": 14326317688418705473
  }
}
```

### AchievementLevel.json (0.00 MB, 21 条)

**字段** (3): `Level, Count, LevelIconPath`

**首条记录摘要**:
```json
{
  "Level": 1,
  "Count": 1100,
  "LevelIconPath": ""
}
```

### FateRinConstCommon.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_FateRin_DeepBuffUnlockLevel",
  "Value": {
    "IntValue": 3
  }
}
```

### RogueDLCMarkType.json (0.00 MB, 8 条)

**字段** (1): `MarkTypeChessBoardIcon`

**首条记录摘要**:
```json
{
  "MarkTypeChessBoardIcon": ""
}
```

### PlanetFesGachaBasic.json (0.00 MB, 7 条)

**字段** (7): `GachaID, GachaType, CostItemID, CostGemNum, UnlockIDList, MultiGachaUnlockIDList, MultiGachaCount`

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

### IdleLiveAvatarUpgradeReward.json (0.00 MB, 24 条)

**字段** (2): `Level, RewardID`

**首条记录摘要**:
```json
{
  "Level": 5,
  "RewardID": 8017301
}
```

### ConstValueFantasticStory.json (0.00 MB, 17 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityNPC_Mapinfo",
  "Value": "5004"
}
```

### PlanetFesAvatarStar.json (0.00 MB, 15 条)

**字段** (4): `Rarity, StarLevel, CostItemNumber, IncomeParam`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "StarLevel": 1,
  "CostItemNumber": 1,
  "IncomeParam": 100
}
```

### ChimeraGalleryAct.json (0.00 MB, 8 条)

**字段** (4): `ActID, Name, Icon, Sort`

**首条记录摘要**:
```json
{
  "ActID": 1,
  "Name": {
    "Hash": 1522225629569021982
  },
  "Icon": "SpriteOutput/Quest/Chimera/ChimeraAtlasA...",
  "Sort": 1
}
```

### GachaTypeBasicInfo.json (0.00 MB, 6 条)

**字段** (6): `GachaTypeID, ItemCosume, ItemPrice, DiamondID, GachaBar, BuyPos`

**首条记录摘要**:
```json
{
  "GachaTypeID": "Normal",
  "ItemCosume": 101,
  "ItemPrice": 160,
  "DiamondID": 1,
  "GachaBar": "StandardGachaPage",
  "BuyPos": {
    "ShopID": 1000,
    "ShopGoodID": 1000001
  }
}
```

### RogueEndlessMegaBuffDesc.json (0.00 MB, 8 条)

**字段** (3): `MazeBuffID, BuffDesc, BuffPreshowDesc`

**首条记录摘要**:
```json
{
  "MazeBuffID": 620001,
  "BuffDesc": {
    "Hash": 1435625717400460466
  },
  "BuffPreshowDesc": {
    "Hash": 14093924171039015490
  }
}
```

### RestaurantShopItemConfig.json (0.00 MB, 6 条)

**字段** (9): `ShopItemID, ProductID, Count, LimitCount, BuyPrice, AddLimitDay, AddLimitParam, UnlockIDList, DeleteIDList`

**首条记录摘要**:
```json
{
  "ShopItemID": 94031,
  "ProductID": 403,
  "Count": 1,
  "LimitCount": 10,
  "BuyPrice": 8,
  "AddLimitDay": 1,
  "AddLimitParam": 10,
  "UnlockIDList": [
    109003
  ],
  "DeleteIDList": []
}
```

### AetherSpiritType.json (0.00 MB, 3 条)

**字段** (7): `Name, IconPath, SmallIconPath, IconNatureForWeakActive, SPInfoEffFront, Color, UnfullColor`

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

### FateBuffSlot.json (0.00 MB, 12 条)

**字段** (5): `FMLGGKAFMKC, MPADIDFJBEF, AEDGAKOBDOC, IOHKGPKODJL, HNAMEIDAANH`

**首条记录摘要**:
```json
{
  "FMLGGKAFMKC": 1,
  "MPADIDFJBEF": "Common",
  "AEDGAKOBDOC": 1,
  "IOHKGPKODJL": 1,
  "HNAMEIDAANH": 801
}
```

### ActivityRaidCollectionTab.json (0.00 MB, 6 条)

**字段** (4): `RaidCollectionTabID, RaidCollectionType, RaidCollectionGroupList, RaidCollectionTabName`

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

### GridFightProjMazebuff.json (0.00 MB, 2 条)

**字段** (14): `ID, BuffSeries, BuffRarity, Lv, LvMax, ModifierName, InBattleBindingType, InBattleBindingKey, ParamList, BuffIcon, BuffName, BuffDesc, BuffEffect, MazeBuffType`

**首条记录摘要**:
```json
{
  "ID": 35610001,
  "BuffSeries": 1,
  "BuffRarity": 1,
  "Lv": 1,
  "LvMax": 1,
  "ModifierName": "ADV_StageAbility_35610001",
  "InBattleBindingType": "StageAbilityBeforeCharacterBorn",
  "InBattleBindingKey": "StageAbility_GridFight_Projection_Gilgam...",
  "ParamList": "[{\"Value\": 0.02}, {\"Value\": 6}, {\"Value\"...",
  "BuffIcon": "SpriteOutput/AvatarProfessionTattoo/Prof...",
  "BuffName": {
    "Hash": 14668333444873254312
  },
  "BuffDesc": {
    "Hash": 27007966458479784
  },
  "BuffEffect": "",
  "MazeBuffType": "Level"
}
```

### BoxingClubPerformance.json (0.00 MB, 5 条)

**字段** (7): `ID, PlayerRank, EnemyRank, Name, MonsterTemplateID, BubbleTalkPlayer, BubbleTalkEnemy`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlayerRank": "",
  "EnemyRank": "",
  "Name": "BoxingClubPerformance_Name_1",
  "MonsterTemplateID": 1012020,
  "BubbleTalkPlayer": "BoxingClubPerformance_BubbleTalkPlayer_1",
  "BubbleTalkEnemy": "BoxingClubPerformance_BubbleTalkEnemy_1"
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

### RogueDLCEntrance.json (0.00 MB, 3 条)

**字段** (7): `ID, SubType, SubTypeTitle, RewardList, ButtonPath, PatternBgPath, SwitchBannerImgPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SubType": "ChessRogue",
  "SubTypeTitle": {
    "Hash": 2527403513851859277
  },
  "RewardList": "[1, 236, 241, 101, 235, 213, 233, 300041...",
  "ButtonPath": "UI/Rogue/Widget/RoguePlanetDlcSelect1.pr...",
  "PatternBgPath": "UI/Rogue/Widget/RogueDlcPatternBg1.prefa...",
  "SwitchBannerImgPath": "SpriteOutput/Rogue/Planet/Dlc/IconRogueS..."
}
```

### RogueMagicWorkbenchFunc.json (0.00 MB, 5 条)

**字段** (5): `FuncID, FuncType, FuncName, FuncDesc, FuncIcon`

**首条记录摘要**:
```json
{
  "FuncID": 6,
  "FuncType": "MagicScepterShop",
  "FuncName": {
    "Hash": 460052789853497270
  },
  "FuncDesc": {
    "Hash": 1449664858631814581
  },
  "FuncIcon": "SpriteOutput/Quest/SpaceZoo/SpaceZooCake..."
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

### GridFightProjection.json (0.00 MB, 2 条)

**字段** (12): `ID, RoleID, ProjectionDesc, ParamList, ProjectionName, TraitList, UnlockType, ActivationTraitLayerList, MazebuffID, Rarity, AllMemberGeneralPropertyList, TraitListMemberGeneralPropertyList`

**首条记录摘要**:
```json
{
  "ID": 1509,
  "RoleID": 1509,
  "ProjectionDesc": {
    "Hash": 15904450975080006017
  },
  "ParamList": "[{\"Value\": 0.02}, {\"Value\": 6}, {\"Value\"...",
  "ProjectionName": {
    "Hash": 4623922265512348344
  },
  "TraitList": [],
  "UnlockType": "SpecialGoods",
  "ActivationTraitLayerList": [],
  "MazebuffID": 35610001,
  "Rarity": 2,
  "AllMemberGeneralPropertyList": "[{\"PropertyType\": \"ExtraAllDamageTypeAdd...",
  "TraitListMemberGeneralPropertyList": []
}
```

### RogueNousStoryDisplay.json (0.00 MB, 14 条)

**字段** (2): `DisplayID, TriggerCondition`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "TriggerCondition": {
    "Hash": 7083227154665823209
  }
}
```

### MonopolyPlayerTalkConfig.json (0.00 MB, 13 条)

**字段** (3): `ID, ContentTextID, Priority`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ContentTextID": {
    "Hash": 14226930841599353017
  },
  "Priority": 3
}
```

### PamMood.json (0.00 MB, 7 条)

**字段** (5): `PamMood, MinMoodPoint, MaxMoodPoint, PerformanceID, EmotionClipPath`

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

### ItemComposeTag.json (0.00 MB, 12 条)

**字段** (3): `ItemComposeTagID, BelongTypeID, TagTextmapID`

**首条记录摘要**:
```json
{
  "ItemComposeTagID": 1,
  "BelongTypeID": 2,
  "TagTextmapID": "ItemComposeTag_TagTextmapID_1"
}
```

### EvoBdSCCardType.json (0.00 MB, 4 条)

**字段** (4): `Season, CardBuffItemBgSmall, CardBuffItemBgMid, CardBuffItemBgBig`

**首条记录摘要**:
```json
{
  "Season": "SecondChapter",
  "CardBuffItemBgSmall": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "CardBuffItemBgMid": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "CardBuffItemBgBig": "SpriteOutput/Quest/EvolveBuild/SC/Evolve..."
}
```

### RogueDLCMainStoryReward.json (0.00 MB, 14 条)

**字段** (4): `MainStoryReward, IsImportant, Sort, QuestID`

**首条记录摘要**:
```json
{
  "MainStoryReward": 1,
  "IsImportant": 1,
  "Sort": 1,
  "QuestID": 6013301
}
```

### SystemDefaultLanguage.json (0.00 MB, 13 条)

**字段** (3): `SystemLanguage, DefaultTextLanguage, DefaultAudioLanguage`

**首条记录摘要**:
```json
{
  "SystemLanguage": "cn",
  "DefaultTextLanguage": "cn",
  "DefaultAudioLanguage": "cn"
}
```

### SilverWolfTabGroup.json (0.00 MB, 3 条)

**字段** (7): `GroupID, Name, IconPath, ExploreFigurePath, RaidFigurePath, Conditions, ActivityModuleID`

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
  "Conditions": "[{\"Type\": \"FinishMainMission\", \"Param\": ...",
  "ActivityModuleID": 5000102
}
```

### FightFestScorePhase.json (0.00 MB, 3 条)

**字段** (8): `PhaseID, TargetScore, RewardID, AvatarInfoID, TargetAvatarIcon, TargetAvatarMiniIcon, TargetAvatarName, TargetTip`

**首条记录摘要**:
```json
{
  "PhaseID": 201,
  "TargetScore": 200,
  "RewardID": 252001,
  "AvatarInfoID": 2,
  "TargetAvatarIcon": "SpriteOutput/Quest/FightFest/Avatar/Chal...",
  "TargetAvatarMiniIcon": "SpriteOutput/Quest/FightFest/Avatar/Head...",
  "TargetAvatarName": {
    "Hash": 8030641555304480295
  },
  "TargetTip": {
    "Hash": 568103880559171729
  }
}
```

### MapProgressConfig.json (0.00 MB, 8 条)

**字段** (3): `ID, IconPath, ProgressName`

**首条记录摘要**:
```json
{
  "ID": "Normal",
  "IconPath": "SpriteOutput/MapPics/Collect/IconCollect...",
  "ProgressName": {
    "Hash": 4766085590236706246
  }
}
```

### TeamTowersLevel.json (0.00 MB, 19 条)

**字段** (3): `MFIEHPLADIM, HLCEBFIMJGN, EKLFKIEBIMM`

**首条记录摘要**:
```json
{
  "MFIEHPLADIM": 1,
  "HLCEBFIMJGN": 200,
  "EKLFKIEBIMM": 6087100
}
```

### OfferingTypeConfig.json (0.00 MB, 15 条)

**字段** (4): `ID, ItemID, MaxLevel, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ItemID": 120003,
  "MaxLevel": 50,
  "UnlockID": 9937
}
```

### ActivityVersionBanner.json (0.00 MB, 17 条)

**字段** (3): `ActivityID, Type, ChapterID`

**首条记录摘要**:
```json
{
  "ActivityID": 80012,
  "Type": "Gap",
  "ChapterID": 103005
}
```

### TalkSentenceImage.json (0.00 MB, 10 条)

**字段** (3): `Speaker, ImagePath, Comment`

**首条记录摘要**:
```json
{
  "Speaker": "TheHerta",
  "ImagePath": "SpriteOutput/AvatarRoundIcon/Avatar/1401...",
  "Comment": "大黑塔"
}
```

### RogueDestroyProp.json (0.00 MB, 10 条)

**字段** (4): `ParamGroupID, PrepareTime, GameTime, ScoreRange`

**首条记录摘要**:
```json
{
  "ParamGroupID": 1001,
  "PrepareTime": 3,
  "GameTime": 35,
  "ScoreRange": [
    0,
    15,
    30
  ]
}
```

### MarbleConstValueCommon.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_Marble_MaxLevelUpSkill",
  "Value": {
    "IntValue": 2
  }
}
```

### ChenLingFesConstValueCommon.json (0.00 MB, 8 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RaidID",
  "Value": {
    "IntValue": 40532
  }
}
```

### EvolveGearTypeConfig.json (0.00 MB, 3 条)

**字段** (7): `Season, FontColor, WeaponToastEffectBg, MixDetailPropsInfoBg, TypeImg, TypeImgColor, Name`

**首条记录摘要**:
```json
{
  "Season": "EarlyAccess",
  "FontColor": "#ffc06a",
  "WeaponToastEffectBg": "SpriteOutput/UI/Quest/EvolveBuild/Evolve...",
  "MixDetailPropsInfoBg": "SpriteOutput/UI/Quest/EvolveBuild/Evolve...",
  "TypeImg": "SpriteOutput/UI/Quest/EvolveBuild/Evolve...",
  "TypeImgColor": "#FFCF70",
  "Name": "UIText_EvolveBuild_WeaponTag"
}
```

### MarbleMatchGroupStageRank.json (0.00 MB, 16 条)

**字段** (4): `ID, PlayerID, Rank, Index`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlayerID": 1,
  "Rank": 1,
  "Index": 1
}
```

### GridFightConsumables.json (0.00 MB, 7 条)

**字段** (5): `ID, ConsumableParamList, IfStack, IfConsume, ConsumableDesc`

**首条记录摘要**:
```json
{
  "ID": 350101,
  "ConsumableParamList": [],
  "IfStack": true,
  "IfConsume": true,
  "ConsumableDesc": {
    "Hash": 15298412367088846627
  }
}
```

### SwordTrainingMood.json (0.00 MB, 4 条)

**字段** (7): `MoodLevel, MaximumValue, EffectIDList, MoodIcon, EffectDesc, MoodStatus, EffectNumDesc`

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

### ActivityHipplenStat.json (0.00 MB, 4 条)

**字段** (6): `StatType, Name, IconPath, OutlineIconPath, SmallIconPath, BgColor`

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

**字段** (4): `GroupID, QuestIDList, TabID, GotoID`

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

**字段** (4): `FinishID, FinishRare, FinishName, FinishPoint`

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

### ChimeraWorkRoundOption.json (0.00 MB, 13 条)

**字段** (3): `OptionID, Type, ParamList`

**首条记录摘要**:
```json
{
  "OptionID": 1,
  "Type": "RequireMemberCount",
  "ParamList": [
    3
  ]
}
```

### ActivityDiceShopConfig.json (0.00 MB, 3 条)

**字段** (5): `DiceShopID, GoodsList, IMGPath, ShopSortID, Name`

**首条记录摘要**:
```json
{
  "DiceShopID": 1,
  "GoodsList": "[1101, 1102, 1103, 1104, 1105, 1106, 110...",
  "IMGPath": "SpriteOutput/Quest/DiceCombat/DiceCombat...",
  "ShopSortID": 1,
  "Name": {
    "Hash": 8312944906758085024
  }
}
```

### RoguePersonaConstCommon.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTournPersona_FixedCompList",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 1}, {\"IntVa..."
}
```

### TarotBookStarPanel.json (0.00 MB, 13 条)

**字段** (2): `Position, LockedImgPath`

**首条记录摘要**:
```json
{
  "Position": 1,
  "LockedImgPath": "SpriteOutput/TarotBookTitanIcon/01_Ianos..."
}
```

### RechargeGiftConfig.json (0.00 MB, 10 条)

**字段** (4): `GiftType, GiftIDList, Discount, DiscountForFiat`

**首条记录摘要**:
```json
{
  "GiftType": 15,
  "GiftIDList": [
    10010
  ],
  "Discount": 570,
  "DiscountForFiat": []
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

### HeliobusChallengePhase.json (0.00 MB, 4 条)

**字段** (7): `ChallengePhaseID, ChallengeGroupList, UnlockMissionID, ChallengePhaseName, ChallengePhaseUnlock, MappingInfoID, MapEntranceID`

**首条记录摘要**:
```json
{
  "ChallengePhaseID": 1001,
  "ChallengeGroupList": [
    1001
  ],
  "UnlockMissionID": 8015101,
  "ChallengePhaseName": {
    "Hash": 5141860685383914304
  },
  "ChallengePhaseUnlock": {
    "Hash": 12743386085939013698
  },
  "MappingInfoID": 2310,
  "MapEntranceID": 2022301
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

### HeliobusChallengeReward.json (0.00 MB, 5 条)

**字段** (5): `ChallengeRewardTabID, ChallengeRewardTabName, QuestList, UnlockQuest, ChallengePhaseID`

**首条记录摘要**:
```json
{
  "ChallengeRewardTabID": 1,
  "ChallengeRewardTabName": {
    "Hash": 13067430794996080931
  },
  "QuestList": [
    6031051,
    6031052,
    6031053,
    6031054
  ],
  "UnlockQuest": 6030006,
  "ChallengePhaseID": 1001
}
```

### ChallengeGeneralConfig.json (0.00 MB, 3 条)

**字段** (5): `ChallengeGroupType, GotoID, TabImgPath, PreConditions, GuideConditions`

**首条记录摘要**:
```json
{
  "ChallengeGroupType": "Memory",
  "GotoID": 218,
  "TabImgPath": "SpriteOutput/UI/ChallengeBoss/ChallengeB...",
  "PreConditions": [],
  "GuideConditions": "[{\"Type\": \"FinishMainMission\", \"Param\": ..."
}
```

### DrinkMakerQuantifyTag.json (0.00 MB, 20 条)

**字段** (3): `TagID, Type, Value`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "Type": "Sweetness",
  "Value": -2
}
```

### WorldLevelStageUnlockConfig.json (0.00 MB, 6 条)

**字段** (4): `RaidID, UIEntranceParam, UIEntranceBgPath, UIEnviromentParam`

**首条记录摘要**:
```json
{
  "RaidID": 41001,
  "UIEntranceParam": 3001,
  "UIEntranceBgPath": "UI/UI3D/UI3DFarmStage/_dependencies/Mate...",
  "UIEnviromentParam": 41000007
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

**字段** (3): `ID, QuestKeyPoint, QuestKeyPointReward`

**首条记录摘要**:
```json
{
  "ID": 1,
  "QuestKeyPoint": 100,
  "QuestKeyPointReward": 160301
}
```

### AlleyActivityQuest.json (0.00 MB, 7 条)

**字段** (4): `ID, MainTabTitle, SubTab, QuestList`

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

### RogueArcade.json (0.00 MB, 10 条)

**字段** (4): `ArcadeRoomID, ArcadeID, AdventureType, ParamGroupID`

**首条记录摘要**:
```json
{
  "ArcadeRoomID": 100001,
  "ArcadeID": 1,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
}
```

### AudioBookData.json (0.00 MB, 12 条)

**字段** (2): `BookID, AudioEvent`

**首条记录摘要**:
```json
{
  "BookID": 190784,
  "AudioEvent": "Ev_sfx_amphoreus_audiocollection_titan_f..."
}
```

### LimaoNewsLevel.json (0.00 MB, 5 条)

**字段** (5): `Level, BeforeLevelEvent, AfterLevelEvent, EventFinishConditionIDList, IsTriggerEvent`

**首条记录摘要**:
```json
{
  "Level": 6,
  "BeforeLevelEvent": {
    "Hash": 18163543512485838568
  },
  "AfterLevelEvent": {
    "Hash": 11322732727837157983
  },
  "EventFinishConditionIDList": [
    2400069
  ],
  "IsTriggerEvent": true
}
```

### AssistantTipsConfig.json (0.00 MB, 8 条)

**字段** (4): `TipsID, TipsRule, Content, ParamList`

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

### ActivityHipplenEnding.json (0.00 MB, 4 条)

**字段** (7): `ID, Name, Desc, UnlockDesc, RewardID, ImagePath, IsShowInGuidePage`

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

### GuideChallengeTab.json (0.00 MB, 5 条)

**字段** (7): `ID, Name, Priority, GuideType, ResBarKey, IconPath, IntroDataID`

**首条记录摘要**:
```json
{
  "ID": 1002,
  "Name": {
    "Hash": 11651535771617851880
  },
  "Priority": 3,
  "GuideType": "Challenge",
  "ResBarKey": "HandBookGuide",
  "IconPath": "SpriteOutput/ItemIcon/110501.png",
  "IntroDataID": 44
}
```

### IdleLiveQuestTreeTab.json (0.00 MB, 5 条)

**字段** (4): `ID, Name, UnlockChapter, QuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 8483086226905415731
  },
  "UnlockChapter": 1,
  "QuestList": "[8061501, 8061502, 8061503, 8061511, 806..."
}
```

### ChallengeStoryTargetConfig.json (0.00 MB, 7 条)

**字段** (4): `ID, ChallengeTargetType, ChallengeTargetName, ChallengeTargetParam1`

**首条记录摘要**:
```json
{
  "ID": 2001,
  "ChallengeTargetType": "TOTAL_SCORE",
  "ChallengeTargetName": {
    "Hash": 11408150447023752054
  },
  "ChallengeTargetParam1": 40000
}
```

### ChimeraDuelCoreflameLevel.json (0.00 MB, 14 条)

**字段** (3): `ChimeraID, Level, SkillIDList`

**首条记录摘要**:
```json
{
  "ChimeraID": 512,
  "Level": 1,
  "SkillIDList": [
    51201
  ]
}
```

### GameplayGuideConstValue.json (0.00 MB, 12 条)

**字段** (2): `GameplayGuideConstValueName, Value`

**首条记录摘要**:
```json
{
  "GameplayGuideConstValueName": "HandBookRogueMappingInfo",
  "Value": "2220"
}
```

### ActivityHipplenGrowthPhase.json (0.00 MB, 6 条)

**字段** (5): `ID, PhaseTitle, PhaseTrialTitle, BodySize, SpeedRatioMultiplier`

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

### BattlePassAdvertisement.json (0.00 MB, 5 条)

**字段** (4): `ID, IconBundlePath, Title, Desc`

**首条记录摘要**:
```json
{
  "ID": 16,
  "IconBundlePath": "SpriteOutput/UI/BattlePass/BattlePassAdd...",
  "Title": {
    "Hash": 11367356674318029546
  },
  "Desc": {
    "Hash": 17601296254541657242
  }
}
```

### PlanetFesCardTheme.json (0.00 MB, 4 条)

**字段** (4): `ThemeID, CardIDList, Name, IconPath`

**首条记录摘要**:
```json
{
  "ThemeID": 201,
  "CardIDList": "[20101, 20102, 20103, 20104, 20105, 2010...",
  "Name": {
    "Hash": 7200521242610986890
  },
  "IconPath": "SpriteOutput/TabIcon/World/World00Icon.p..."
}
```

### ChallengeBossTargetConfig.json (0.00 MB, 7 条)

**字段** (4): `ID, ChallengeTargetType, ChallengeTargetName, ChallengeTargetParam1`

**首条记录摘要**:
```json
{
  "ID": 3001,
  "ChallengeTargetType": "TOTAL_SCORE",
  "ChallengeTargetName": {
    "Hash": 11408150447023752054
  },
  "ChallengeTargetParam1": 4000
}
```

### TarotBookEnergy.json (0.00 MB, 12 条)

**字段** (3): `SubmissionID, IsSilence, Toast`

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

### ActivityHipplenOutfitType.json (0.00 MB, 4 条)

**字段** (3): `Name, IconPath, IconCheckPath`

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

### MusicRhythmPresetSong.json (0.00 MB, 8 条)

**字段** (3): `ID, PresetGridConfig, PresetName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PresetGridConfig": [
    3767,
    4095,
    2015
  ],
  "PresetName": {
    "Hash": 13679938612936039877
  }
}
```

### AvatarUseMaterialDataLD.json (0.00 MB, 4 条)

**字段** (9): `AvatarID, PromotionMaterial, BossMaterial, SkillMaterialSmall, SkillMaterialMedium, SkillMaterialLarge, WorldMaterialSmall, WorldMaterialMedium, WorldMaterialLarge`

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

### ChenLingWaveExp.json (0.00 MB, 30 条)

**字段** (2): `Wave, Exp`

**首条记录摘要**:
```json
{
  "Wave": 1,
  "Exp": 10
}
```

### InControlMouseTypeInfo.json (0.00 MB, 15 条)

**字段** (2): `controlType, iconForMouse`

**首条记录摘要**:
```json
{
  "controlType": "LeftButton",
  "iconForMouse": "SpriteOutput/KeyMapIcons/PC/IconMouseLef..."
}
```

### GridFightSeasonTrait_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `PNPJBPCMINL, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "[{\"BNCKFPAGOMF\": 1001}, {\"BNCKFPAGOMF\": ..."
}
```

### HeliobusReward.json (0.00 MB, 16 条)

**字段** (0): ``

**首条记录摘要**:
```json
{}
```

### MonopolyShopConfig.json (0.00 MB, 13 条)

**字段** (2): `ShopID, GoodsIDList`

**首条记录摘要**:
```json
{
  "ShopID": 100,
  "GoodsIDList": [
    1012,
    1013,
    1015
  ]
}
```

### RechargeGiftData.json (0.00 MB, 17 条)

**字段** (3): `GiftID, RewardsPay, RewardsFree`

**首条记录摘要**:
```json
{
  "GiftID": 10010,
  "RewardsPay": 10101,
  "RewardsFree": 10102
}
```

### ActivityReward.json (0.00 MB, 11 条)

**字段** (4): `ActivityRewardID, RewardIconPath, Count, Reward`

**首条记录摘要**:
```json
{
  "ActivityRewardID": 10012001,
  "RewardIconPath": "",
  "Count": 8000,
  "Reward": 100
}
```

### FunctionHudSpecial.json (0.00 MB, 5 条)

**字段** (7): `ID, IsLargeBtn, FirstWorldText, ActivityModuleIDList, ControlRightHud, OverrideIconPath, HideConditions`

**首条记录摘要**:
```json
{
  "ID": 6,
  "IsLargeBtn": true,
  "FirstWorldText": "Store",
  "ActivityModuleIDList": [
    5003601
  ],
  "ControlRightHud": true,
  "OverrideIconPath": "SpriteOutput/PhoneAPPIcon/ShopActivityIc...",
  "HideConditions": []
}
```

### RelicSubAffixBaseValue.json (0.00 MB, 12 条)

**字段** (3): `RelicSubAffix, Type, BaseValue`

**首条记录摘要**:
```json
{
  "RelicSubAffix": "AttackDelta",
  "Type": "Attack",
  "BaseValue": 1.728
}
```

### ScheduleDataMission.json (0.00 MB, 11 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 42020305,
  "BeginTime": "2023-06-28 12:00:00",
  "EndTime": "2099-12-30 04:00:00"
}
```

### ChallengeRaid.json (0.00 MB, 8 条)

**字段** (4): `ChallengeID, MonsterList, ScoringGroupID, IconPath`

**首条记录摘要**:
```json
{
  "ChallengeID": 5001,
  "MonsterList": [
    1022020,
    1023010,
    8003020,
    1022020
  ],
  "ScoringGroupID": 5001,
  "IconPath": ""
}
```

### LoadingWorldImage.json (0.00 MB, 7 条)

**字段** (3): `ImagePath, EffectContainer, PamuPrefabName`

**首条记录摘要**:
```json
{
  "ImagePath": "SpriteOutput/LoadingPic/LoadingBg/BgLoad...",
  "EffectContainer": "",
  "PamuPrefabName": "Pamu_Walk"
}
```

### RoguePersonaTalentGroup.json (0.00 MB, 6 条)

**字段** (3): `PHFMCACHFIJ, MJOOFPBABEA, OLOIFNNLKJP`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 120,
  "MJOOFPBABEA": {
    "Hash": 9950428738457886749
  },
  "OLOIFNNLKJP": "SpriteOutput/UI/Rogue/Tourn/Persona/Skil..."
}
```

### EvoBld2RaccoonTalk.json (0.00 MB, 4 条)

**字段** (4): `RaccoonState, Season, TextmapList, RaccoonPicPath`

**首条记录摘要**:
```json
{
  "RaccoonState": "Bad",
  "Season": "SecondChapter",
  "TextmapList": "[{\"Hash\": 5241237556957842895}, {\"Hash\":...",
  "RaccoonPicPath": "SpriteOutput/Quest/EvolveBuild/RaccoonIc..."
}
```

### GridFightGuideQuestGoToWiki.json (0.00 MB, 17 条)

**字段** (2): `QuestID, TutorialGuideGroupID`

**首条记录摘要**:
```json
{
  "QuestID": 7300004,
  "TutorialGuideGroupID": 100046
}
```

### MonopolyAreaAssetConfig.json (0.00 MB, 4 条)

**字段** (4): `ID, Name, FigurePath, AssetList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 4178089911621864054
  },
  "FigurePath": "SpriteOutput/Quest/Monopoly/EventPic/Are...",
  "AssetList": [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12
  ]
}
```

### RogueAeonListConfig.json (0.00 MB, 14 条)

**字段** (3): `RogueAeonID, DisplayID, Sort`

**首条记录摘要**:
```json
{
  "RogueAeonID": 1,
  "DisplayID": 1,
  "Sort": 1
}
```

### GridFightCoreRoleChoose.json (0.00 MB, 8 条)

**字段** (4): `TraitID, Parameter, SubTraitID, ChooseDesc`

**首条记录摘要**:
```json
{
  "TraitID": 1010,
  "Parameter": 1301,
  "SubTraitID": 2501,
  "ChooseDesc": {
    "Hash": 3358497061258258444
  }
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

### MusicRhythmConstValueCommon.json (0.00 MB, 9 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_MusicRhythm_MusicComposeUnlockM...",
  "Value": {
    "IntValue": 8026102
  }
}
```

### TrainPartyStatusRank.json (0.00 MB, 16 条)

**字段** (2): `Rank, RankRequireExp`

**首条记录摘要**:
```json
{
  "Rank": 1,
  "RankRequireExp": 10
}
```

### EvolveBuildRaccoonTalk.json (0.00 MB, 4 条)

**字段** (4): `RaccoonState, Season, TextmapList, RaccoonPicPath`

**首条记录摘要**:
```json
{
  "RaccoonState": "Bad",
  "Season": "EarlyAccess",
  "TextmapList": "[{\"Hash\": 17849680565487846117}, {\"Hash\"...",
  "RaccoonPicPath": "SpriteOutput/Quest/EvolveBuild/RaccoonIc..."
}
```

### GridFightRarityWeight.json (0.00 MB, 10 条)

**字段** (2): `PlayerLevel, Rarity1Weight`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "Rarity1Weight": 100
}
```

### PlanetFesEvent.json (0.00 MB, 6 条)

**字段** (7): `ID, UnlockIDList, InitialAppearCD, RecurCD, FailRecurCD, StayInterval, ReenterAppearCD`

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

**字段** (3): `ID, LoginReward, FirstWordText`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LoginReward": 160101,
  "FirstWordText": "Stellar Jade"
}
```

### SpaceZooQuest.json (0.00 MB, 6 条)

**字段** (4): `ID, QuestTabName, Type, QuestList`

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

**字段** (4): `GroupID, ItemID, GroupType, RotateOrder`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "ItemID": 1009,
  "GroupType": "Rotate",
  "RotateOrder": 1
}
```

### ChimeraConstCommon.json (0.00 MB, 9 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Chimera_RequireMemberCount_Max",
  "Value": {
    "IntValue": 5
  }
}
```

### MatchThreeAvatarSkillDialog.json (0.00 MB, 10 条)

**字段** (3): `ID, EnvironmentID, AvatarPic`

**首条记录摘要**:
```json
{
  "ID": 1100,
  "EnvironmentID": 201,
  "AvatarPic": "SpriteOutput/AvatarDrawCardResult/1006.p..."
}
```

### MonsterStatusResistanceType.json (0.00 MB, 11 条)

**字段** (2): `Type, Icon`

**首条记录摘要**:
```json
{
  "Type": "STAT_DOT_Burn",
  "Icon": "SpriteOutput/UI/Avatar/Icon/IconImmuneBu..."
}
```

### TrainPartyMTCategoryConfig.json (0.00 MB, 5 条)

**字段** (4): `CategoryID, CategoryTableName, CategoryName, CategoryDesc`

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

### PixAirSupplyConfig.json (0.00 MB, 36 条)

**字段** (1): `ContentID`

**首条记录摘要**:
```json
{
  "ContentID": 2014
}
```

### AlleyStage.json (0.00 MB, 3 条)

**字段** (8): `StageID, StageAlleyEvent, StageSpecialOrder, StageTitle, StageDesc, TakeMainMission, StageTarget, StageMainMission`

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

### RogueNousDiceSlot.json (0.00 MB, 6 条)

**字段** (4): `SlotID, SlotName, UpgradedSlotName, MaxRarity`

**首条记录摘要**:
```json
{
  "SlotID": 1,
  "SlotName": {
    "Hash": 4684877858458558909
  },
  "UpgradedSlotName": {
    "Hash": 11957613697151495391
  },
  "MaxRarity": 3
}
```

### IdleLiveEventSentence.json (0.00 MB, 5 条)

**字段** (5): `SectionID, Index, Sentence, Name, FigurePath`

**首条记录摘要**:
```json
{
  "SectionID": 1,
  "Index": 1,
  "Sentence": {
    "Hash": 8477942384117102134
  },
  "Name": {
    "Hash": 6549100409743183681
  },
  "FigurePath": "SpriteOutput/AvatarCutinFigures/8004.png"
}
```

### FiveDimBillboardConfig.json (0.00 MB, 6 条)

**字段** (2): `ID, BillboardPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "BillboardPath": "Stages/OriginalResPos/InteractiveProp/Ch..."
}
```

### GFActivityResidentConfig.json (0.00 MB, 1 条)

**字段** (11): `ActivityID, ActivityModuleID, RelatedActivityPanelID, ResidentName, ResidentBrief, ResidentDesc, TitleIconPath, DisplayItemList, IntroGuideImg, ActivityTagList, SortWeight`

**首条记录摘要**:
```json
{
  "ActivityID": 201,
  "ActivityModuleID": 7100101,
  "RelatedActivityPanelID": 71002,
  "ResidentName": {
    "Hash": 16901324935405054266
  },
  "ResidentBrief": {
    "Hash": 6611891108986718712
  },
  "ResidentDesc": {
    "Hash": 8013962817586461325
  },
  "TitleIconPath": "SpriteOutput/Quest/TabIcon/PermanentActi...",
  "DisplayItemList": "[{\"ItemID\": 1}, {\"ItemID\": 238}, {\"ItemI...",
  "IntroGuideImg": "SpriteOutput/Quest/PermanentActivity/Det...",
  "ActivityTagList": [
    3
  ],
  "SortWeight": 6040
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

### RandomEventChoice.json (0.00 MB, 8 条)

**字段** (5): `ChoiceID, EventCostOption, EventRewardBuff, EventBuffDay, Option`

**首条记录摘要**:
```json
{
  "ChoiceID": 201,
  "EventCostOption": 3000,
  "EventRewardBuff": 15,
  "EventBuffDay": 3,
  "Option": {
    "Hash": 1372027059617807883
  }
}
```

### ShareConfig.json (0.00 MB, 8 条)

**字段** (2): `PlatformType, ShareChannelList`

**首条记录摘要**:
```json
{
  "PlatformType": 3,
  "ShareChannelList": []
}
```

### RogueMagicGambleUnit.json (0.00 MB, 7 条)

**字段** (4): `GambleUnitID, GambleUnitType, GambleUnitParam, GambleUnitIcon`

**首条记录摘要**:
```json
{
  "GambleUnitID": 101,
  "GambleUnitType": "MagicUnitRare",
  "GambleUnitParam": 1102,
  "GambleUnitIcon": "SpriteOutput/BuffIcon/Inlevel/Icon301402..."
}
```

### WheelSelectConfig.json (0.00 MB, 17 条)

**字段** (4): `IndexID, FunctionHudID, Order, FourSlotOrder`

**首条记录摘要**:
```json
{
  "IndexID": 1,
  "FunctionHudID": 4,
  "Order": 5,
  "FourSlotOrder": 4
}
```

### GridFightShopPrice.json (0.00 MB, 5 条)

**字段** (9): `Rarity, SellGoldStar1, SellGoldStar2, SellGoldStar3, SellGoldStar4, BuyGoldStar1, BuyGoldStar2, BuyGoldStar3, BuyGoldStar4`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "SellGoldStar1": 1,
  "SellGoldStar2": 3,
  "SellGoldStar3": 9,
  "SellGoldStar4": 27,
  "BuyGoldStar1": 1,
  "BuyGoldStar2": 3,
  "BuyGoldStar3": 9,
  "BuyGoldStar4": 27
}
```

### GachaShowToastData.json (0.00 MB, 5 条)

**字段** (7): `GachaID, ShowVideoID, LoopVideoID, LoopBGMState, GotoBGMState, LoopUIOpenTime, LoopBGMOpenTime`

**首条记录摘要**:
```json
{
  "GachaID": 2067,
  "ShowVideoID": 32,
  "LoopVideoID": 1532,
  "LoopBGMState": "State_Menu_Get_Avatar_Castorice_Loop",
  "GotoBGMState": "",
  "LoopUIOpenTime": 6,
  "LoopBGMOpenTime": 6
}
```

### MainStoryActView.json (0.00 MB, 6 条)

**字段** (4): `ID, Name, SortID, BannerPicPath`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 12797381317990825304
  },
  "SortID": 9,
  "BannerPicPath": "SpriteOutput/DailyMission/Banner/MainSto..."
}
```

### BackGroundMusicGroup.json (0.00 MB, 7 条)

**字段** (3): `ID, GroupName, GroupIcon`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupName": {
    "Hash": 4653917360591113803
  },
  "GroupIcon": "SpriteOutput/UI/Train/Jukebox/JukeboxAlb..."
}
```

### TrainPartyWorkingBuffConfig.json (0.00 MB, 5 条)

**字段** (4): `WorkingBuffID, Name, Description, IconPath`

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

### GridFightScoreReward.json (0.00 MB, 12 条)

**字段** (4): `ScoreRank, ScoreRow, Score, Reward`

**首条记录摘要**:
```json
{
  "ScoreRank": 1,
  "ScoreRow": 1,
  "Score": 1500,
  "Reward": 312901
}
```

### CLGameBoyChallengePack.json (0.00 MB, 9 条)

**字段** (4): `GameBoyChallengePackID, HardChallengeID, CheatChallengeID, RewardID`

**首条记录摘要**:
```json
{
  "GameBoyChallengePackID": 1,
  "HardChallengeID": 1,
  "CheatChallengeID": 4,
  "RewardID": 319003
}
```

### PlanetFesLandType.json (0.00 MB, 3 条)

**字段** (5): `Type, Name, IconPath, BigBuffIconPath, SmallBuffIconPath`

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

### AvatarPropertyOverride.json (0.00 MB, 6 条)

**字段** (5): `AvatarID, ShowPropertyList, ShowPropertyInBattleList, HidePropertyList, HidePropertyInBattleList`

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

### RogueTournWorkbenchFunc.json (0.00 MB, 6 条)

**字段** (4): `FuncID, FuncType, FuncName, FuncDesc`

**首条记录摘要**:
```json
{
  "FuncID": 1,
  "FuncType": "BuffEnhance",
  "FuncName": {
    "Hash": 14270682151257424115
  },
  "FuncDesc": {
    "Hash": 14227153442758834295
  }
}
```

### TreasureDungeoActivityQuest.json (0.00 MB, 6 条)

**字段** (1): `QuestList`

**首条记录摘要**:
```json
{
  "QuestList": [
    6000321
  ]
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

### MultiplayConstValueCommon.json (0.00 MB, 5 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "MatchThree_Royale_PVP_Turn_Time",
  "Value": {
    "IntValue": 75
  }
}
```

### ActivityDiceV2PVPScoreRank.json (0.00 MB, 5 条)

**字段** (3): `PHFMCACHFIJ, HDCDMCBPLKI, OLOIFNNLKJP`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "HDCDMCBPLKI": "SpriteOutput/UI/Quest/FeverTime/RankIcon...",
  "OLOIFNNLKJP": "SpriteOutput/UI/Quest/FeverTime/RankIcon..."
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

### BattleCollegeTypeGroup.json (0.00 MB, 3 条)

**字段** (5): `BattleCollegeTypeGroupID, UnlockConditions, BattleCollegeTypeGroupIDTitle, BackGroundImagePath, TabIconPath`

**首条记录摘要**:
```json
{
  "BattleCollegeTypeGroupID": 1,
  "UnlockConditions": [],
  "BattleCollegeTypeGroupIDTitle": {
    "Hash": 12907586130115931916
  },
  "BackGroundImagePath": "SpriteOutput/DailyMission/TeachCompleteI...",
  "TabIconPath": "SpriteOutput/TabIcon/Teach/BattleTeachBa..."
}
```

### ChenLingGameBoyCheatCode.json (0.00 MB, 4 条)

**字段** (4): `GameBoyCheatCodeString, BasemapPath, CorrectmapPath, WrongmapPath`

**首条记录摘要**:
```json
{
  "GameBoyCheatCodeString": "W",
  "BasemapPath": "SpriteOutput/Quest/MatchThree/chessArrow...",
  "CorrectmapPath": "SpriteOutput/Quest/MatchThree/chessArrow...",
  "WrongmapPath": "SpriteOutput/Quest/MatchThree/chessArrow..."
}
```

### EvoBdSCTagConfig.json (0.00 MB, 4 条)

**字段** (6): `ID, Season, Name, ExtraEffectID, ShopSkillID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Season": "SecondChapter",
  "Name": {
    "Hash": 4449500830183881557
  },
  "ExtraEffectID": 70000210,
  "ShopSkillID": 3113808,
  "IconPath": "SpriteOutput/Quest/EvolveBuild/EvolveBui..."
}
```

### EvolveBuildTagConfig.json (0.00 MB, 4 条)

**字段** (6): `ID, Season, Name, ExtraEffectID, ShopSkillID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Season": "EarlyAccess",
  "Name": {
    "Hash": 15803266228334050614
  },
  "ExtraEffectID": 70000210,
  "ShopSkillID": 3106807,
  "IconPath": "SpriteOutput/Quest/EvolveBuild/EvolveBui..."
}
```

### TarotBookCardPack.json (0.00 MB, 13 条)

**字段** (2): `ID, Hint`

**首条记录摘要**:
```json
{
  "ID": 3011,
  "Hint": {
    "Hash": 6835111933626958571
  }
}
```

### CakeRaceEmoji.json (0.00 MB, 11 条)

**字段** (3): `EmojiID, CanPlayerUse, ImagePath`

**首条记录摘要**:
```json
{
  "EmojiID": 1001,
  "CanPlayerUse": true,
  "ImagePath": "SpriteOutput/Emoji/116012.png"
}
```

### ChenLingProperty.json (0.00 MB, 6 条)

**字段** (4): `Property, Name, IconPath, IsShow`

**首条记录摘要**:
```json
{
  "Property": 2,
  "Name": {
    "Hash": 13939614449514890104
  },
  "IconPath": "SpriteOutput/UI/Avatar/Icon/IconAttack.p...",
  "IsShow": true
}
```

### MatchThreeV2Bird.json (0.00 MB, 14 条)

**字段** (3): `BirdID, UnlockLevelList, Order`

**首条记录摘要**:
```json
{
  "BirdID": 501,
  "UnlockLevelList": [],
  "Order": 1
}
```

### PlanetFesFunction.json (0.00 MB, 6 条)

**字段** (4): `SkillID, FunctionType, Description, ParamList`

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

### DrinkMakerCheersQuantifyTag.json (0.00 MB, 15 条)

**字段** (3): `TagID, Type, Value`

**首条记录摘要**:
```json
{
  "TagID": 1000,
  "Type": "CheersTypeA",
  "Value": 1
}
```

### ClockParkCardTipsType.json (0.00 MB, 6 条)

**字段** (3): `CardTipsTypeID, CardTips, CardTips_Detail`

**首条记录摘要**:
```json
{
  "CardTipsTypeID": "Positive",
  "CardTips": {
    "Hash": 12047484415032342998
  },
  "CardTips_Detail": {
    "Hash": 13531174706369267031
  }
}
```

### IdleLiveEquipSlot.json (0.00 MB, 6 条)

**字段** (4): `ID, Type, ImagePath, Title`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "Normal",
  "ImagePath": "SpriteOutput/UI/Avatar/Relic/IconRelicHe...",
  "Title": {
    "Hash": 7629190249921340592
  }
}
```

### SpecialNPCMazeSkill.json (0.00 MB, 7 条)

**字段** (4): `MazeSkillId, MazeSkilltype, RelatedAvatarSkill, SkillTriggerKey`

**首条记录摘要**:
```json
{
  "MazeSkillId": 1211201,
  "MazeSkilltype": 1,
  "RelatedAvatarSkill": 1211206,
  "SkillTriggerKey": "NormalAtk"
}
```

### RogueHandbookMiracleType.json (0.00 MB, 5 条)

**字段** (3): `RogueHandbookMiracleType, RogueMiracleTypeTitle, TypeIcon`

**首条记录摘要**:
```json
{
  "RogueHandbookMiracleType": 1,
  "RogueMiracleTypeTitle": {
    "Hash": 3424053103747799453
  },
  "TypeIcon": "SpriteOutput/TabIcon/Common/AllIcon.png"
}
```

### PlanetFesLargeBonus.json (0.00 MB, 4 条)

**字段** (9): `ID, UnlockIDList, ActivityRewardID, Duration, TapCD, TimePerSecond, TapIncome, ComboIncome, BaseIncome`

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

### ActivityTheme.json (0.00 MB, 4 条)

**字段** (5): `ThemeID, Name, IconPath, CornerIconPath, LittleCornerIconPath`

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

### RogueNousValueAreaLimit.json (0.00 MB, 13 条)

**字段** (3): `AreaID, MinNousValue, MaxNousValue`

**首条记录摘要**:
```json
{
  "AreaID": 301,
  "MinNousValue": -20,
  "MaxNousValue": 20
}
```

### EventStuffConfig.json (0.00 MB, 5 条)

**字段** (5): `EventStuffID, StuffID, MissionID, EventContentTextID, MissionStartString`

**首条记录摘要**:
```json
{
  "EventStuffID": 1,
  "StuffID": 250103,
  "MissionID": 8001251,
  "EventContentTextID": {
    "Hash": 16180302199409425739
  },
  "MissionStartString": "Mission_800125110"
}
```

### ActivityHot.json (0.00 MB, 4 条)

**字段** (6): `ActivityID, DesName, ImgPath, SortWeight, RewardShow, RewardReceived`

**首条记录摘要**:
```json
{
  "ActivityID": 10172,
  "DesName": {
    "Hash": 633537383099069310
  },
  "ImgPath": "",
  "SortWeight": 6004,
  "RewardShow": [],
  "RewardReceived": []
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

### GridFightGenderOverride.json (0.00 MB, 6 条)

**字段** (4): `RoleID, AvatarID, Star, JsonOverridePath`

**首条记录摘要**:
```json
{
  "RoleID": 8007,
  "AvatarID": 8008,
  "Star": 1,
  "JsonOverridePath": "Config/ConfigCharacter/GridFight/3.5/Ava..."
}
```

### SpaceZooChannelConfig.json (0.00 MB, 6 条)

**字段** (5): `Channel, InheritType, DefaultFeatureID, HandbookTag, OfficialNameText`

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

### RogueHandBookEventType.json (0.00 MB, 5 条)

**字段** (3): `RogueHandBookEventType, RogueEventTypeTitle, TypeIcon`

**首条记录摘要**:
```json
{
  "RogueHandBookEventType": 1,
  "RogueEventTypeTitle": {
    "Hash": 16337566089746637330
  },
  "TypeIcon": "SpriteOutput/TabIcon/Common/AllIcon.png"
}
```

### RogueNousSurfaceTag.json (0.00 MB, 10 条)

**字段** (3): `TagID, Sort, TagName`

**首条记录摘要**:
```json
{
  "TagID": 2,
  "Sort": 2,
  "TagName": {
    "Hash": 7535031826393913187
  }
}
```

### TrainExteriorConfig.json (0.00 MB, 9 条)

**字段** (4): `ID, Priority, Conditions, DynamicOptionalBlock`

**首条记录摘要**:
```json
{
  "ID": 100,
  "Priority": 1,
  "Conditions": [],
  "DynamicOptionalBlock": "100"
}
```

### PlayerReturnJourneyItem.json (0.00 MB, 3 条)

**字段** (8): `ID, Type, Title, Name, ExtraDesc, IsHideInBeta, BgPath, Sort`

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

### GridFightAugmentRemark.json (0.00 MB, 10 条)

**字段** (2): `AugmentID, AugmentRemark`

**首条记录摘要**:
```json
{
  "AugmentID": 200801,
  "AugmentRemark": {
    "Hash": 619877460824267569
  }
}
```

### TutorialGuideGroupType.json (0.00 MB, 6 条)

**字段** (2): `MessageIconPath, MessageTitle`

**首条记录摘要**:
```json
{
  "MessageIconPath": "SpriteOutput/TabIcon/Common/AllIcon.png",
  "MessageTitle": {
    "Hash": 15165646382604923628
  }
}
```

### BoxingClubChallengeSeason.json (0.00 MB, 2 条)

**字段** (7): `SeasonID, SeasonType, ChallengeIDList, ActivityQuestID, ActivityTitle, SeasonIconPath, SeasonTabPath`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "SeasonType": "First",
  "ChallengeIDList": [
    1,
    2,
    3,
    4,
    5
  ],
  "ActivityQuestID": [
    1,
    2,
    3,
    4,
    5
  ],
  "ActivityTitle": "UIText_BoxingClub_Challenge_SubTitle",
  "SeasonIconPath": "SpriteOutput/Quest/BoxingClubResonance/B...",
  "SeasonTabPath": "SpriteOutput/Quest/BoxingClubResonance/B..."
}
```

### GridFightAssistantMessage.json (0.00 MB, 4 条)

**字段** (7): `ID, TypePara, Interval, ExclusiveID, Priority, Description, EndDivisionID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "TypePara": [
    7
  ],
  "Interval": 999,
  "ExclusiveID": 1,
  "Priority": 1,
  "Description": {
    "Hash": 11040980322662104204
  },
  "EndDivisionID": 10701
}
```

### IdleLiveSender.json (0.00 MB, 7 条)

**字段** (3): `ID, Icon, SenderType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Icon": "",
  "SenderType": "Self"
}
```

### RogueHandbookType.json (0.00 MB, 4 条)

**字段** (4): `HandBookType, RogueHandBookType, RogueHandBookDesc, HandBookIconPath`

**首条记录摘要**:
```json
{
  "HandBookType": 1,
  "RogueHandBookType": {
    "Hash": 5949406083742153478
  },
  "RogueHandBookDesc": {
    "Hash": 15312308474043802413
  },
  "HandBookIconPath": "SpriteOutput/Rogue/Cover/RogueCoverBuff...."
}
```

### MuseumActivityQuest.json (0.00 MB, 4 条)

**字段** (4): `ID, Name, QuestIconPath, QuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "UIText_Activity_Museum_Activity_Tab1",
  "QuestIconPath": "SpriteOutput/TabIcon/Museum/MuseumPhaseR...",
  "QuestList": [
    6000111,
    6000112,
    6000113,
    6000114
  ]
}
```

### ChatBubbleConfig.json (0.00 MB, 12 条)

**字段** (2): `ID, ShowType`

**首条记录摘要**:
```json
{
  "ID": 220000,
  "ShowType": "Always"
}
```

### ActivityAdventurePlayer.json (0.00 MB, 2 条)

**字段** (7): `ID, AvatarID, PlayerName, PlayerPrefabPath, PlayerJsonPath, DefaultAvatarHeadIconPath, MazeSkillIdList`

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

### TeamTowersAchievement.json (0.00 MB, 5 条)

**字段** (5): `PHFMCACHFIJ, GMPGDEINODK, NMAHGFAPENI, PBLPLDJKPEI, NALMBOOCCIN`

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

### RollShopConfig.json (0.00 MB, 3 条)

**字段** (11): `RollShopID, ShopName, CostItemID, CostItemNum, T1GroupID, T2GroupID, T3GroupID, T4GroupID, SpecialGroupList, RollShopType, IntroduceID`

**首条记录摘要**:
```json
{
  "RollShopID": 1,
  "ShopName": {
    "Hash": 13173302290280017573
  },
  "CostItemID": 122000,
  "CostItemNum": 2,
  "T1GroupID": 101,
  "T2GroupID": 102,
  "T3GroupID": 103,
  "T4GroupID": 104,
  "SpecialGroupList": [],
  "RollShopType": "Mall",
  "IntroduceID": 79
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

### AvatarVOLD.json (0.00 MB, 4 条)

**字段** (9): `VOTag, ActionBegin, ActionBeginAdvantage, ActionBeginHighThreat, ReceiveHealing, Revived, UltraReady, LightHit, StandBy`

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

### TeamLimitTypeEvent.json (0.00 MB, 6 条)

**字段** (3): `LimitType, LimitDesc, ToastDesc`

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

### ActivityTelevisionSeason.json (0.00 MB, 1 条)

**字段** (8): `Season, LastStage, LastStageQuest, FirstMainMissionID, LevelMessageSubmission, BuffLevelIconPathList, BuffLevelBackgroundPathList, BuffLevelDefaultBackgroundPath`

**首条记录摘要**:
```json
{
  "Season": 2,
  "LastStage": 305,
  "LastStageQuest": 306,
  "FirstMainMissionID": 8030300,
  "LevelMessageSubmission": 803030505,
  "BuffLevelIconPathList": "[\"SpriteOutput/Quest/Television/Season2/...",
  "BuffLevelBackgroundPathList": "[\"SpriteOutput/Quest/Television/Season2/...",
  "BuffLevelDefaultBackgroundPath": "SpriteOutput/Quest/Television/Season2/TV..."
}
```

### ConvinceGameplaySkill.json (0.00 MB, 4 条)

**字段** (4): `ID, SkillNameText, SkillDescriptionID, SkillIconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SkillNameText": {
    "Hash": 229924546759871602
  },
  "SkillDescriptionID": {
    "Hash": 7211294218472133058
  },
  "SkillIconPath": "SpriteOutput/Talk/ConvinceSkill/Convince..."
}
```

### RogueDialogueDynamicDisplay.json (0.00 MB, 10 条)

**字段** (2): `DisplayID, ContentText`

**首条记录摘要**:
```json
{
  "DisplayID": 120,
  "ContentText": {
    "Hash": 6178763687218641443
  }
}
```

### GridFightSettleRank.json (0.00 MB, 6 条)

**字段** (2): `ID, RankName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RankName": {
    "Hash": 1597035123788724731
  }
}
```

### FateRinChallengeFightBuff.json (0.00 MB, 20 条)

**字段** (1): `NDAIGIEMABD`

**首条记录摘要**:
```json
{
  "NDAIGIEMABD": 3232001
}
```

### CakeRaceFieldScore.json (0.00 MB, 4 条)

**字段** (8): `FieldID, TotalScoreRate, TotalScoreMaxLimit, TotalScoreMinLimit, SingleScoreRate, SingleScoreMaxLimit, SingleScoreMinLimit, BetBaseScore`

**首条记录摘要**:
```json
{
  "FieldID": 1,
  "TotalScoreRate": 1,
  "TotalScoreMaxLimit": 400,
  "TotalScoreMinLimit": 200,
  "SingleScoreRate": 1,
  "SingleScoreMaxLimit": 160,
  "SingleScoreMinLimit": 80,
  "BetBaseScore": 2000
}
```

### DrinkMakerIceData.json (0.00 MB, 3 条)

**字段** (6): `IceName, PrefabPath, IconPath, AudioEvent, CupAnchoPath, IncludeTagList`

**首条记录摘要**:
```json
{
  "IceName": {
    "Hash": 6540408451165463261
  },
  "PrefabPath": "",
  "IconPath": "SpriteOutput/Quest/DrinkMaker/ItemIcon/I...",
  "AudioEvent": "Ev_sfx_blending_addice_withoutice",
  "CupAnchoPath": "",
  "IncludeTagList": [
    201
  ]
}
```

### PerformanceCategoryData.json (0.00 MB, 10 条)

**字段** (2): `CategoryID, IconPath`

**首条记录摘要**:
```json
{
  "CategoryID": 1,
  "IconPath": ""
}
```

### MonsterRandomPool.json (0.00 MB, 4 条)

**字段** (3): `RandomPoolID, ElitePool, MinionPool`

**首条记录摘要**:
```json
{
  "RandomPoolID": 1,
  "ElitePool": "[1013020, 1023010, 2013020, 2023020, 202...",
  "MinionPool": "[1012020, 1002040, 1002030, 1012010, 200..."
}
```

### RogueNousMissionReward.json (0.00 MB, 5 条)

**字段** (3): `MissionRewardID, TabTitle, QuestList`

**首条记录摘要**:
```json
{
  "MissionRewardID": 1,
  "TabTitle": {
    "Hash": 10918788271102758081
  },
  "QuestList": [
    6014201,
    6014202,
    6014203
  ]
}
```

### DefaultPlayerOutfitDetail.json (0.00 MB, 2 条)

**字段** (9): `KODCANKFHAO, FJDEIHMGHIF, PMIEAEGJNMJ, AGNDDHOLJNL, OEPDNGFAKDA, PMNJAKBDNEG, GJMHAJGIHOM, HHIIGAIJEDA, DEJJGGOABPA`

**首条记录摘要**:
```json
{
  "KODCANKFHAO": 3000,
  "FJDEIHMGHIF": "TARGET_GENDER_MAN",
  "PMIEAEGJNMJ": "VeryRare",
  "AGNDDHOLJNL": {
    "Hash": 6419107222420581518
  },
  "OEPDNGFAKDA": {
    "Hash": 1160186544537240326
  },
  "PMNJAKBDNEG": {
    "Hash": 11793619679787817876
  },
  "GJMHAJGIHOM": "SpriteOutput/ItemIcon/DressIcon/229000_m...",
  "HHIIGAIJEDA": "SpriteOutput/ItemFigures/DressIcon/22900...",
  "DEJJGGOABPA": ""
}
```

### HeliobusChallengeRaid.json (0.00 MB, 4 条)

**字段** (5): `ChallengeRaidID, RaidID, UnlockQuestID, UnlockTips, HeliobusSkillRecList`

**首条记录摘要**:
```json
{
  "ChallengeRaidID": 1001,
  "RaidID": 4420201,
  "UnlockQuestID": 6030015,
  "UnlockTips": {
    "Hash": 5532771485799578454
  },
  "HeliobusSkillRecList": [
    10001,
    10005,
    10008
  ]
}
```

### RaidLimitCondition.json (0.00 MB, 6 条)

**字段** (6): `ID, LimitType, ParamType, ParamInt1, ParamIntList, LimitDesc`

**首条记录摘要**:
```json
{
  "ID": 3,
  "LimitType": "HasMainMission",
  "ParamType": "Equal",
  "ParamInt1": 2011301,
  "ParamIntList": [],
  "LimitDesc": {
    "Hash": 12900916881265823415
  }
}
```

### DrinkMakerDay.json (0.00 MB, 5 条)

**字段** (4): `DayID, GuestSequenceList, FinishDaySubMissionIDList, CanStartSubMissionID`

**首条记录摘要**:
```json
{
  "DayID": 1,
  "GuestSequenceList": [
    11,
    12
  ],
  "FinishDaySubMissionIDList": [
    802110102
  ],
  "CanStartSubMissionID": 802110101
}
```

### FateRinCaseBoard.json (0.00 MB, 6 条)

**字段** (3): `PHFMCACHFIJ, GMCBNNKJAGJ, GINFOPOAKHK`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "GMCBNNKJAGJ": 105440013,
  "GINFOPOAKHK": "Config/Level/FateRin/FateRinCaseBoardPer..."
}
```

### PlayerReturnRelic.json (0.00 MB, 7 条)

**字段** (3): `RelicRarity, RelicLevel, IsRelicMatchMainAffix`

**首条记录摘要**:
```json
{
  "RelicRarity": "CombatPowerRelicRarity4",
  "RelicLevel": 9,
  "IsRelicMatchMainAffix": true
}
```

### LimaoNewsLimao.json (0.00 MB, 9 条)

**字段** (4): `CPCMBMBFBAI, BGOLMOKHCGD, JAKLCIIEDON, FPDNFOLDFOB`

**首条记录摘要**:
```json
{
  "CPCMBMBFBAI": 1,
  "BGOLMOKHCGD": 2501,
  "JAKLCIIEDON": 1,
  "FPDNFOLDFOB": true
}
```

### RogueTournExhibitionConfig.json (0.00 MB, 12 条)

**字段** (3): `PaintingID, Type, Floor`

**首条记录摘要**:
```json
{
  "PaintingID": 1,
  "Type": "Narrow",
  "Floor": "Floor1"
}
```

### ActivityFinishWayPunkLord.json (0.00 MB, 12 条)

**字段** (3): `FinishID, FinishRare, FinishPoint`

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
  "Value": "{\"StringValue\": \"SpriteOutput/TrialRole/..."
}
```

### MessageItemLink.json (0.00 MB, 4 条)

**字段** (5): `ID, Title, ImagePath, Type, OnceOnly`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "Title": {
    "Hash": 7631269583607498300
  },
  "ImagePath": "SpriteOutput/Quest/Heliobus/PhoneMessage...",
  "Type": "Exit",
  "OnceOnly": true
}
```

### IdleLiveWorldTag.json (0.00 MB, 6 条)

**字段** (3): `WorldTagID, WorldTag, Icon`

**首条记录摘要**:
```json
{
  "WorldTagID": 1,
  "WorldTag": {
    "Hash": 14095290639770520121
  },
  "Icon": "SpriteOutput/TabIcon/World/World00Icon.p..."
}
```

### MusicRhythmOptical.json (0.00 MB, 5 条)

**字段** (5): `QuestID, Type, MainMissionID, ActivityModuleID, GotoConfig`

**首条记录摘要**:
```json
{
  "QuestID": 6029201,
  "Type": 1,
  "MainMissionID": 8026102,
  "ActivityModuleID": 5002201,
  "GotoConfig": 6209
}
```

### NpcMonsterTrackQuest.json (0.00 MB, 10 条)

**字段** (3): `QuestID, NpcMonsterTrackID, MapInfoID`

**首条记录摘要**:
```json
{
  "QuestID": 6000601,
  "NpcMonsterTrackID": 800001,
  "MapInfoID": 5007
}
```

### PlanetFesOptical.json (0.00 MB, 5 条)

**字段** (5): `QuestID, Type, MainMissionID, ActivityModuleID, GotoConfig`

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

### ChallengeBossRewardLine.json (0.00 MB, 12 条)

**字段** (3): `GroupID, StarCount, RewardID`

**首条记录摘要**:
```json
{
  "GroupID": 3000,
  "StarCount": 1,
  "RewardID": 101701
}
```

### TalkBehavior.json (0.00 MB, 5 条)

**字段** (7): `ID, BehaviorType, ParaType, ParaInt, ParaList, CurrencyItem, CustomString`

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

### ChenLingCamp.json (0.00 MB, 6 条)

**字段** (2): `ID, FlagPrefab`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FlagPrefab": "Stages/ActivityProp/ActivityProp_ChenLin..."
}
```

### FiveDimFluteTalkConfig.json (0.00 MB, 2 条)

**字段** (7): `FluteID, IconPath, IconPathInputTips, IconPathErrorTIps, EnterTipsTextID, InputTipsTextID, ErrorTIpsTextID`

**首条记录摘要**:
```json
{
  "FluteID": 1052101,
  "IconPath": "SpriteOutput/AvatarShopIcon/Avatar/1502....",
  "IconPathInputTips": "SpriteOutput/AvatarShopIcon/Avatar/1505....",
  "IconPathErrorTIps": "SpriteOutput/AvatarShopIcon/Avatar/1502....",
  "EnterTipsTextID": {
    "Hash": 6942614650430467242
  },
  "InputTipsTextID": {
    "Hash": 4890749676782546261
  },
  "ErrorTIpsTextID": {
    "Hash": 14729659591316585031
  }
}
```

### AvatarSkillPropertyOverride.json (0.00 MB, 6 条)

**字段** (3): `SkillID, IsSecretSkillNeed, ReplacePointIconPrefab`

**首条记录摘要**:
```json
{
  "SkillID": 140703,
  "IsSecretSkillNeed": true,
  "ReplacePointIconPrefab": ""
}
```

### WorldUnlockConfig.json (0.00 MB, 3 条)

**字段** (5): `ID, InitMainMissionList, DirectUnlockCondition, MainMissionIDList, NewWorldHintDialogPrefab`

**首条记录摘要**:
```json
{
  "ID": 501,
  "InitMainMissionList": [
    1040101
  ],
  "DirectUnlockCondition": "![RealFinishMainMission:1036106] |![SubM...",
  "MainMissionIDList": [
    1040101
  ],
  "NewWorldHintDialogPrefab": ""
}
```

### FantasticStoryChapter.json (0.00 MB, 3 条)

**字段** (6): `ChapterID, Name, describe, FigurePath, MissionID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "Name": {
    "Hash": 18368984164970313798
  },
  "describe": {
    "Hash": 16019727946254232929
  },
  "FigurePath": "SpriteOutput/UI/Quest/FantasticStory/Fan...",
  "MissionID": 8002211,
  "ActivityModuleID": 4000208
}
```

### RogueMagicAdventureRoom.json (0.00 MB, 9 条)

**字段** (3): `RoomID, AdventureType, ParamGroupID`

**首条记录摘要**:
```json
{
  "RoomID": 11001,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
}
```

### ChimeraPhase.json (0.00 MB, 5 条)

**字段** (5): `PhaseID, NextPhaseID, RoundList, TargetType, TargetParam`

**首条记录摘要**:
```json
{
  "PhaseID": 1,
  "NextPhaseID": 2,
  "RoundList": [
    1,
    2
  ],
  "TargetType": "NoTarget",
  "TargetParam": []
}
```

### RogueCommonDialogue.json (0.00 MB, 7 条)

**字段** (2): `DialogueID, DialoguePath`

**首条记录摘要**:
```json
{
  "DialogueID": 501,
  "DialoguePath": "Config/Level/RogueDialogue/RogueNpcDialo..."
}
```

### ActivitySummonRewardTab.json (0.00 MB, 5 条)

**字段** (4): `ID, GroupID, OriginalQuestName, QuestName`

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

**字段** (4): `GradeID, MapID, MapConfig, GradeConditions`

**首条记录摘要**:
```json
{
  "GradeID": 101,
  "MapID": 1,
  "MapConfig": "Config/Gameplays/Alley/AlleyLogistics/Al...",
  "GradeConditions": []
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

### RogueCommonModeTitle.json (0.00 MB, 5 条)

**字段** (3): `SubMode, TitleTextmapID, TitleIconPath`

**首条记录摘要**:
```json
{
  "SubMode": "CosmosRogue",
  "TitleTextmapID": {
    "Hash": 18043789236200601465
  },
  "TitleIconPath": "SpriteOutput/TabIcon/Activity/Rogue.png"
}
```

### ActivityEquipMaterialQuest.json (0.00 MB, 8 条)

**字段** (4): `QuestID, ProgressText, RealProgress, GotoID`

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

### LimaoNewsMessage.json (0.00 MB, 11 条)

**字段** (2): `IIAJADPLGLH, JNFGLIOMLEJ`

**首条记录摘要**:
```json
{
  "IIAJADPLGLH": 1000001,
  "JNFGLIOMLEJ": 100000100
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

### RogueTournWorkbench.json (0.00 MB, 11 条)

**字段** (2): `WorkbenchID, FuncList`

**首条记录摘要**:
```json
{
  "WorkbenchID": 101,
  "FuncList": [
    2,
    1
  ]
}
```

### SilverWolfCollection.json (0.00 MB, 9 条)

**字段** (4): `Type, TypeParam, PositionID, QuestID`

**首条记录摘要**:
```json
{
  "Type": "Decal",
  "TypeParam": 2,
  "PositionID": 1,
  "QuestID": 6000010
}
```

### RogueMagicStyleTypeSelect.json (0.00 MB, 4 条)

**字段** (4): `EnumType, DisplayID, IconPath, EnumDesc`

**首条记录摘要**:
```json
{
  "EnumType": "Ultimate",
  "DisplayID": 103,
  "IconPath": "SpriteOutput/Rogue/StyleType/IconRogueSt...",
  "EnumDesc": {
    "Hash": 10262849724569676079
  }
}
```

### GridFightSeasonModule.json (0.00 MB, 4 条)

**字段** (7): `SeasonID, SubSeasonID, ActivityModuleID, MaxRewardExp, OfferingID, ActivityQuestConfigID, GirlHeroSpecialAvatarId`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "SubSeasonID": 1,
  "ActivityModuleID": 7100201,
  "MaxRewardExp": 48000,
  "OfferingID": 11,
  "ActivityQuestConfigID": 71001,
  "GirlHeroSpecialAvatarId": 3708008
}
```

### ConstValueChallengeCommon.json (0.00 MB, 7 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Strong_Challenge_Battle_MaxHPScore",
  "Value": {
    "IntValue": 2000
  }
}
```

### ChenLingFesTag.json (0.00 MB, 5 条)

**字段** (3): `ID, TagTitle, TagIconPath`

**首条记录摘要**:
```json
{
  "ID": 2,
  "TagTitle": {
    "Hash": 12411183805349746830
  },
  "TagIconPath": "SpriteOutput/Quest/ChenLingFes/ItemTypeI..."
}
```

### ItemHintGroup.json (0.00 MB, 11 条)

**字段** (2): `FIPANNNNKLH, LBOADDIBILJ`

**首条记录摘要**:
```json
{
  "FIPANNNNKLH": "Mission",
  "LBOADDIBILJ": "NotNormal"
}
```

### ScheduleDataGlobal.json (0.00 MB, 5 条)

**字段** (5): `ID, BeginTime, GlobalBeginTime, EndTime, GlobalEndTime`

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

### EventMissionChallenge.json (0.00 MB, 13 条)

**字段** (4): `ID, LimitTime, IsBeginPrepare, IsCancellable`

**首条记录摘要**:
```json
{
  "ID": 900003,
  "LimitTime": 60,
  "IsBeginPrepare": true,
  "IsCancellable": true
}
```

### BattleConditionConfig.json (0.00 MB, 6 条)

**字段** (6): `ID, WinOrLose, TargetParam, IsShowProgress, AbilityName, ConditionDes`

**首条记录摘要**:
```json
{
  "ID": 10002,
  "WinOrLose": true,
  "TargetParam": 4,
  "IsShowProgress": 1,
  "AbilityName": "",
  "ConditionDes": {
    "Hash": 11795606743550522696
  }
}
```

### LoadingSpecialTypeConfig.json (0.00 MB, 6 条)

**字段** (4): `SubMissionID, LoadingType, AvailableEntranceIDList, Priority`

**首条记录摘要**:
```json
{
  "SubMissionID": 200090103,
  "LoadingType": 5,
  "AvailableEntranceIDList": [
    2000401
  ],
  "Priority": 10
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

**字段** (7): `Rarity, IncomeParam, CostParam, PieceTransferNum, IconPath, Name, LevelSkipStarUpDetail`

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

### ActivityRaidCollectionQuest.json (0.00 MB, 4 条)

**字段** (3): `QuestTabID, QuestTabName, QuestList`

**首条记录摘要**:
```json
{
  "QuestTabID": 1,
  "QuestTabName": {
    "Hash": 13119286508734114980
  },
  "QuestList": "[6017201, 6017202, 6017209, 6017210, 601..."
}
```

### CityShopConfig.json (0.00 MB, 3 条)

**字段** (8): `ShopID, RewardListGroupID, ItemID, MaxLevel, WorldID, WorldImgPath, Name, HintOverNum`

**首条记录摘要**:
```json
{
  "ShopID": 401,
  "RewardListGroupID": 401,
  "ItemID": 120000,
  "MaxLevel": 10,
  "WorldID": 101,
  "WorldImgPath": "SpriteOutput/WorldPic/WorldPicMiddle_100...",
  "Name": {
    "Hash": 17474500167336942627
  },
  "HintOverNum": 50
}
```

### MonopolyRaiseConfig.json (0.00 MB, 12 条)

**字段** (2): `RaiseCurveID, RaiseValue`

**首条记录摘要**:
```json
{
  "RaiseCurveID": 1,
  "RaiseValue": 1
}
```

### GridFightFuncManage.json (0.00 MB, 9 条)

**字段** (3): `ID, UnlockID, UnlockShowType`

**首条记录摘要**:
```json
{
  "ID": "SeasonExpLine",
  "UnlockID": 1001,
  "UnlockShowType": "Hide"
}
```

### OptionalRewardQuest.json (0.00 MB, 12 条)

**字段** (2): `QuestID, OptionalGiftItemID`

**首条记录摘要**:
```json
{
  "QuestID": 6023502,
  "OptionalGiftItemID": 309001
}
```

### RogueDLCAdventureRoom.json (0.00 MB, 8 条)

**字段** (3): `RoomID, AdventureType, ParamGroupID`

**首条记录摘要**:
```json
{
  "RoomID": 2320601,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 2001
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

### IdleLiveEvent.json (0.00 MB, 5 条)

**字段** (4): `ID, AvatarList, FigurePath, ChangeTeam`

**首条记录摘要**:
```json
{
  "ID": 1,
  "AvatarList": [
    8004
  ],
  "FigurePath": "SpriteOutput/Quest/TrainParty/EventBg/Ca...",
  "ChangeTeam": true
}
```

### ILBattleSkillTriggerKey.json (0.00 MB, 8 条)

**字段** (2): `SkillTriggerKey, Name`

**首条记录摘要**:
```json
{
  "SkillTriggerKey": "Skill01",
  "Name": {
    "Hash": 17463272543800423219
  }
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

### TrackPhotoTrashCanConfig.json (0.00 MB, 4 条)

**字段** (5): `CanTypeID, Score, NpcTemplateID, ExtraAnimList, IconPath`

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

### AvatarCobrand.json (0.00 MB, 4 条)

**字段** (5): `ID, AudioLanguage, StateGroupName, OffStateName, OnStateName`

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

### DanmuGroup.json (0.00 MB, 3 条)

**字段** (6): `ID, Type, Contents, FlySpeed, Interval, RepeatTimesTillEnd`

**首条记录摘要**:
```json
{
  "ID": 10544000,
  "Type": "Text",
  "Contents": "[105440000, 105440001, 105440002, 105440...",
  "FlySpeed": 1,
  "Interval": 2,
  "RepeatTimesTillEnd": 1
}
```

### DailyActiveType.json (0.00 MB, 18 条)

**字段** (2): `Type, PoolSort`

**首条记录摘要**:
```json
{
  "Type": 1,
  "PoolSort": 1
}
```

### AllowedLanguage.json (0.00 MB, 4 条)

**字段** (4): `Area, Type, LanguageList, DefaultLanguage`

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

### TitanAtlasGroup.json (0.00 MB, 4 条)

**字段** (4): `TitanGroupID, TitanGroupName, TitanGroupDesc, TitleBGColor`

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

### AvatarTestMazeBuff.json (0.00 MB, 96 条)

### PhoneCaseConfig.json (0.00 MB, 2 条)

**字段** (6): `CaseID, IconPath, ItemFigurePath, ImagePath, PrefabPath, ShowType`

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

### ItemConsumeType.json (0.00 MB, 5 条)

**字段** (3): `TypeID, FilterName, TypeIconPath`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "FilterName": {
    "Hash": 17220750191163312997
  },
  "TypeIconPath": "SpriteOutput/ConsumablesIcon/AttackIcon...."
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

### RestaurantFOConfig.json (0.00 MB, 6 条)

**字段** (3): `FOID, AvatarID, IMGPath`

**首条记录摘要**:
```json
{
  "FOID": 101,
  "AvatarID": 1403,
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/AvatarD..."
}
```

### DrinkMakerCheersPerformance.json (0.00 MB, 10 条)

**字段** (3): `ID, GroupID, PerformanceID`

**首条记录摘要**:
```json
{
  "ID": 10000,
  "GroupID": 1000,
  "PerformanceID": 803520001
}
```

### MultipleDropFarmType.json (0.00 MB, 6 条)

**字段** (3): `MultipleDropType, UnlockID, SignIconPath`

**首条记录摘要**:
```json
{
  "MultipleDropType": "COCOON",
  "UnlockID": 9924,
  "SignIconPath": "SpriteOutput/UI/Quest/DoubleCocoon/IconD..."
}
```

### ActivityRankIcon.json (0.00 MB, 5 条)

**字段** (3): `ID, Text, CommonRankIconPath`

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

### RogueDLCEndGameReward.json (0.00 MB, 10 条)

**字段** (3): `EndGameRewardID, QuestID, Sort`

**首条记录摘要**:
```json
{
  "EndGameRewardID": 1,
  "QuestID": 6013240,
  "Sort": 1
}
```

### ActivityNewbiePromote.json (0.00 MB, 5 条)

**字段** (5): `ID, Desc, DisplayItem, FinishQuest, SortID`

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

### ConstValuePamSkin.json (0.00 MB, 5 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "PamID_Index_Npc_List",
  "Value": {
    "ArrayValue": [
      {
        "IntValue": 3001
      }
    ]
  }
}
```

### RogueNousDiceBranchTag.json (0.00 MB, 4 条)

**字段** (3): `TagID, TagIcon, BranchTagName`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "TagIcon": "SpriteOutput/UI/Rogue/DLC/RogueNous/Icon...",
  "BranchTagName": {
    "Hash": 7852518661316351735
  }
}
```

### GridFightGuideQuest.json (0.00 MB, 4 条)

**字段** (3): `ChapterID, ChapterAimQuest, QuestList`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "ChapterAimQuest": 7300001,
  "QuestList": "[7300002, 7300003, 7300004, 7300005, 730..."
}
```

### IdleLiveAdvTechTreeTab.json (0.00 MB, 3 条)

**字段** (5): `ID, Name, RecommendAvatarList, IconPath, StartPoint`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 6227026022665176847
  },
  "RecommendAvatarList": [
    8003,
    1205,
    1204
  ],
  "IconPath": "SpriteOutput/UI/Avatar/Icon/IconDefence....",
  "StartPoint": 101
}
```

### RogueNousEndGameReward.json (0.00 MB, 2 条)

**字段** (5): `EndGameRewardID, TabTitle, QuestList, QuestID, UnlockID`

**首条记录摘要**:
```json
{
  "EndGameRewardID": 1,
  "TabTitle": {
    "Hash": 1466611023929028975
  },
  "QuestList": "[6014217, 6014218, 6014219, 6014220, 601...",
  "QuestID": 6014338,
  "UnlockID": 1001007
}
```

### PixAirTagDisplayConfig.json (0.00 MB, 6 条)

**字段** (3): `TagType, Name, IsEquipDisplayTag`

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

### ActivityLocalLegendReward.json (0.00 MB, 10 条)

**字段** (3): `ID, TaskType, Sort`

**首条记录摘要**:
```json
{
  "ID": 6072147,
  "TaskType": "EasyHard",
  "Sort": 5
}
```

### AvatarSourceConfig.json (0.00 MB, 12 条)

**字段** (2): `AvatarID, SourceAvatarID`

**首条记录摘要**:
```json
{
  "AvatarID": 8901,
  "SourceAvatarID": 8001
}
```

### CycleScoreReward.json (0.00 MB, 10 条)

**字段** (3): `ScoreRank, Score, Reward`

**首条记录摘要**:
```json
{
  "ScoreRank": 1,
  "Score": 1800,
  "Reward": 323001
}
```

### AvatarComefromLD.json (0.00 MB, 4 条)

**字段** (6): `ID, ComefromID, Sort, Desc, GotoID, GotoParam`

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

### RestaurantEmojiConfig.json (0.00 MB, 6 条)

**字段** (2): `EmojiType, EmojiPath`

**首条记录摘要**:
```json
{
  "EmojiType": "Disappointed",
  "EmojiPath": "SpriteOutput/EmojiCommon/EmojiCurrency/E..."
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

### MuseumPhaseUpgrade.json (0.00 MB, 14 条)

**字段** (2): `MuseumPhaseID, AreaID`

**首条记录摘要**:
```json
{
  "MuseumPhaseID": 1,
  "AreaID": 1
}
```

### AvatarPlayerIconLD.json (0.00 MB, 4 条)

**字段** (6): `ID, ImagePath, AvatarID, Type, SortType, Sort`

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

### FateRinHouguMapGroup.json (0.00 MB, 3 条)

**字段** (5): `PHFMCACHFIJ, LIPCDDAPHNF, CJEEEFLFFOL, AJCDFGPPLJP, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "LIPCDDAPHNF": 105440016,
  "CJEEEFLFFOL": [
    1,
    2,
    3,
    4,
    5
  ],
  "AJCDFGPPLJP": 105440017,
  "OENAMINOLLF": {
    "Hash": 3790278115595503371
  }
}
```

### FirstPerformance.json (0.00 MB, 17 条)

**字段** (1): `PerformanceID`

**首条记录摘要**:
```json
{
  "PerformanceID": 501023501
}
```

### RogueTournDifficultyComp.json (0.00 MB, 8 条)

**字段** (3): `ADHGMAGMGJE, HILINOJPLGA, AAGKEBFHLMC`

**首条记录摘要**:
```json
{
  "ADHGMAGMGJE": 10101,
  "HILINOJPLGA": "Tourn1",
  "AAGKEBFHLMC": 1
}
```

### ActivityHonorPunkLord.json (0.00 MB, 6 条)

**字段** (3): `HonorID, HonorName, DisplayPriority`

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

### TeamTowersStageStar.json (0.00 MB, 4 条)

**字段** (4): `PHFMCACHFIJ, GMPGDEINODK, NMAHGFAPENI, PBLPLDJKPEI`

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

### RogueTournModule.json (0.00 MB, 8 条)

**字段** (3): `MainTournID, SubTournID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "MainTournID": 1,
  "SubTournID": 1,
  "ActivityModuleID": 6001101
}
```

### RogueTurntable.json (0.00 MB, 9 条)

**字段** (3): `ParamGroupID, PrepareTime, RewardLevel`

**首条记录摘要**:
```json
{
  "ParamGroupID": 3001,
  "PrepareTime": 3,
  "RewardLevel": "High"
}
```

### PamChatQuickFunction.json (0.00 MB, 5 条)

**字段** (3): `ID, BtnName, PlayerInputText`

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

### RogueMagicMiscDisplay.json (0.00 MB, 7 条)

**字段** (2): `DisplayID, DisplayContent`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "DisplayContent": {
    "Hash": 18225913322700411644
  }
}
```

### ILBattleAvatarTag.json (0.00 MB, 4 条)

**字段** (4): `ID, Name, IconPath, AssociatedStatusId`

**首条记录摘要**:
```json
{
  "ID": "Assault",
  "Name": {
    "Hash": 3453035284623612404
  },
  "IconPath": "SpriteOutput/Quest/IdleLive/IdleLiveIcon...",
  "AssociatedStatusId": "RTMCommon_MDF_Attack"
}
```

### CeilingCharacterInfo.json (0.00 MB, 7 条)

**字段** (2): `CharacterID, CeilingDesc`

**首条记录摘要**:
```json
{
  "CharacterID": 1003,
  "CeilingDesc": {
    "Hash": 17048992647563964215
  }
}
```

### MonopolyQuest.json (0.00 MB, 4 条)

**字段** (3): `ID, Name, QuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 14529803407538114927
  },
  "QuestList": "[6021101, 6021102, 6021103, 6021104, 602..."
}
```

### ActivityBenefitV2Prize.json (0.00 MB, 2 条)

**字段** (4): `PHFMCACHFIJ, EJDNMAFLACG, MJOOFPBABEA, LDCCBCIIIEC`

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
  "LDCCBCIIIEC": "[{\"Hash\": 10621946112088347260}, {\"Hash\"..."
}
```

### ActivityDiceV2PVPScore.json (0.00 MB, 4 条)

**字段** (4): `PHFMCACHFIJ, FBBBHPDMFAP, PBLPLDJKPEI, OACJHAFNCCB`

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

### SwordTrainingStoryLineBonus.json (0.00 MB, 3 条)

**字段** (2): `StoryLineNum, EffectDescList`

**首条记录摘要**:
```json
{
  "StoryLineNum": 1,
  "EffectDescList": "[{\"Hash\": 720852388048058045}, {\"Hash\": ..."
}
```

### StaminaSaleConfig.json (0.00 MB, 8 条)

**字段** (3): `Times, Price, ToStamina`

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

### GridFightPortalRemark.json (0.00 MB, 7 条)

**字段** (2): `PortalID, PortalRemark`

**首条记录摘要**:
```json
{
  "PortalID": 120,
  "PortalRemark": {
    "Hash": 13459647519000326917
  }
}
```

### IdleLiveEmoji.json (0.00 MB, 6 条)

**字段** (2): `ID, EmojiIcon`

**首条记录摘要**:
```json
{
  "ID": 1,
  "EmojiIcon": "SpriteOutput/EmojiCommon/EmojiFifthWorld..."
}
```

### MappingInfoConnection.json (0.00 MB, 5 条)

**字段** (4): `SourceEntranceID, SourceMappingInfoID, TargetEntranceID, TargetMappingInfoID`

**首条记录摘要**:
```json
{
  "SourceEntranceID": 1000001,
  "SourceMappingInfoID": 2206,
  "TargetEntranceID": 100000104,
  "TargetMappingInfoID": 2206
}
```

### RestaurantFarmConfig.json (0.00 MB, 3 条)

**字段** (6): `FarmID, Type, Name, FieldIDList, UnlockIDList, ManagerEmployeeID`

**首条记录摘要**:
```json
{
  "FarmID": 1,
  "Type": "Player",
  "Name": {
    "Hash": 15477269014283419720
  },
  "FieldIDList": [
    1,
    2
  ],
  "UnlockIDList": [],
  "ManagerEmployeeID": 301
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

### ItemStroyLine.json (0.00 MB, 9 条)

**字段** (2): `ID, StoryLineIDList`

**首条记录摘要**:
```json
{
  "ID": 222000,
  "StoryLineIDList": [
    0
  ]
}
```

### OfferingLevelUnlockDesc.json (0.00 MB, 7 条)

**字段** (2): `UnlockID, UnlockDesc`

**首条记录摘要**:
```json
{
  "UnlockID": 9944,
  "UnlockDesc": {
    "Hash": 11994204856210995253
  }
}
```

### MusicRhythmPhase.json (0.00 MB, 3 条)

**字段** (6): `Phase, SongID, TrackIDList, FinishMissionID, LiveName, PostImgPath`

**首条记录摘要**:
```json
{
  "Phase": 1,
  "SongID": 1,
  "TrackIDList": [
    11,
    12,
    13
  ],
  "FinishMissionID": 8026102,
  "LiveName": {
    "Hash": 6893769388982078134
  },
  "PostImgPath": ""
}
```

### DrinkMakerCheersFormula.json (0.00 MB, 3 条)

**字段** (8): `FormulaID, IconPath, SmallIconPath, CupID, IceID, DecoID, IngredientList, MixRate`

**首条记录摘要**:
```json
{
  "FormulaID": 1000,
  "IconPath": "",
  "SmallIconPath": "",
  "CupID": 31,
  "IceID": 2,
  "DecoID": 2,
  "IngredientList": [
    503,
    504,
    504
  ],
  "MixRate": 2
}
```

### ActivityStartHintConfig.json (0.00 MB, 3 条)

**字段** (4): `ActivityStartHintID, ActivityModuleID, UIPrefab, ToastDesc`

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

### RaidTypeConfig.json (0.00 MB, 10 条)

**字段** (2): `RaidType, FinishType`

**首条记录摘要**:
```json
{
  "RaidType": "Mission",
  "FinishType": "RaidMissionFinish"
}
```

### RechargeBenefitConfig.json (0.00 MB, 3 条)

**字段** (4): `ID, Type, ActivityModuleID, BenefitIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "SecondAnniversary",
  "ActivityModuleID": 5003801,
  "BenefitIDList": "[1001, 1002, 1003, 1004, 1005, 1006, 100..."
}
```

### IdleLiveTeamSlotType.json (0.00 MB, 4 条)

**字段** (2): `Name, ImagePath`

**首条记录摘要**:
```json
{
  "Name": {
    "Hash": 1289424735672006701
  },
  "ImagePath": "SpriteOutput/Quest/IdleLive/IdleLiveIcon..."
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

### GFTraitElationProperty.json (0.00 MB, 8 条)

**字段** (2): `PropertyType, ExtraEffectID`

**首条记录摘要**:
```json
{
  "PropertyType": "ExtraFrontPowerAddedRatio1",
  "ExtraEffectID": 80000101
}
```

### LimaoNewsSponsor.json (0.00 MB, 3 条)

**字段** (4): `IFAGMAOMHCL, OLOIFNNLKJP, OOOAGMPJPGG, DGLJLJEHNNB`

**首条记录摘要**:
```json
{
  "IFAGMAOMHCL": 1,
  "OLOIFNNLKJP": "SpriteOutput/UI/LimaoNews/LimaoNewsAdver...",
  "OOOAGMPJPGG": "SpriteOutput/UI/LimaoNews/LimaoNewsAdver...",
  "DGLJLJEHNNB": 992
}
```

### NounAtlasChangeInfo.json (0.00 MB, 9 条)

**字段** (2): `NounID, ChangeNounIDList`

**首条记录摘要**:
```json
{
  "NounID": 23,
  "ChangeNounIDList": [
    24
  ]
}
```

### AllowedAudioLanguage.json (0.00 MB, 4 条)

**字段** (3): `AudioLanguageKey, ShowString, WwiseLanguageKey`

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

### IdleLiveStar.json (0.00 MB, 5 条)

**字段** (2): `Star, Name`

**首条记录摘要**:
```json
{
  "Star": 1,
  "Name": {
    "Hash": 15096037531641942452
  }
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

### TrainPartyAreaGoalConfig.json (0.00 MB, 6 条)

**字段** (3): `ID, AreaID, StepGroupList`

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

### ParkourBGMConfig.json (0.00 MB, 4 条)

**字段** (3): `ID, NormalEventName, FastEventName`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NormalEventName": "State_Menu_Season_Parkour_MovieGame_Norm...",
  "FastEventName": "State_Menu_Season_Parkour_MovieGame_Fast"
}
```

### CakeRaceSection.json (0.00 MB, 9 条)

**字段** (2): `SectionID, RegionNum`

**首条记录摘要**:
```json
{
  "SectionID": 1,
  "RegionNum": 2
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

### GuideRogueTab.json (0.00 MB, 3 条)

**字段** (6): `ID, Priority, GuideType, ResBarKey, Name, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "Priority": 2,
  "GuideType": "RogueRelease",
  "ResBarKey": "",
  "Name": {
    "Hash": 3848846982209751333
  },
  "IconPath": "SpriteOutput/ItemIcon/110501.png"
}
```

### DecideAvatarOrder.json (0.00 MB, 13 条)

**字段** (2): `ItemID, Order`

**首条记录摘要**:
```json
{
  "ItemID": 1211,
  "Order": 1007
}
```

### FateRinHouguTag.json (0.00 MB, 5 条)

**字段** (3): `PHFMCACHFIJ, NHALJPDONCP, OCBFMPOCBIK`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "NHALJPDONCP": {
    "Hash": 3682576761072467301
  },
  "OCBFMPOCBIK": "type1"
}
```

### TarotBookCard.json (0.00 MB, 13 条)

**字段** (2): `ID, CharacterID`

**首条记录摘要**:
```json
{
  "ID": 9901,
  "CharacterID": 1
}
```

### FateRinOwner.json (0.00 MB, 6 条)

**字段** (2): `PHFMCACHFIJ, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": "Rin",
  "OENAMINOLLF": {
    "Hash": 4000111212109118117
  }
}
```

### BattleCollegeStageIntro.json (0.00 MB, 16 条)

**字段** (1): `StageIntroDescID`

**首条记录摘要**:
```json
{
  "StageIntroDescID": 101
}
```

### IdleLiveNodeTypeData.json (0.00 MB, 4 条)

**字段** (2): `NodeIcon, Name`

**首条记录摘要**:
```json
{
  "NodeIcon": "SpriteOutput/GridFight/ProgressIcon/Grid...",
  "Name": {
    "Hash": 6662154772159375172
  }
}
```

### MissionSubType.json (0.00 MB, 7 条)

**字段** (2): `TypePriority, ShowIconPath`

**首条记录摘要**:
```json
{
  "TypePriority": 5,
  "ShowIconPath": ""
}
```

### AetherPassiveSkillType.json (0.00 MB, 4 条)

**字段** (2): `Name, IconPath`

**首条记录摘要**:
```json
{
  "Name": "AetherPassiveSkillType_Name_0",
  "IconPath": "SpriteOutput/Rogue/Buff/IconRogueBuffDef..."
}
```

### ConvinceGameplayNPC.json (0.00 MB, 3 条)

**字段** (4): `ID, NPCNameID, NPCDescriptionID, NPCIconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "NPCNameID": {
    "Hash": 9367833259123447974
  },
  "NPCDescriptionID": [
    222070310
  ],
  "NPCIconPath": "SpriteOutput/AvatarShopIcon/NPC/Skott.pn..."
}
```

### InclinationType.json (0.00 MB, 15 条)

**字段** (1): `InclinationTypeID`

**首条记录摘要**:
```json
{
  "InclinationTypeID": 1
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

### StuffStatsConfig.json (0.00 MB, 3 条)

**字段** (3): `StatsID, MuseumStatsName, StatsIconPath`

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

### MessageItemRaidEntrance.json (0.00 MB, 3 条)

**字段** (4): `ID, RaidID, ImagePath, InvalidMissionList`

**首条记录摘要**:
```json
{
  "ID": 120110007,
  "RaidID": 20213002,
  "ImagePath": "SpriteOutput/PhoneMessageChallenge/Phone...",
  "InvalidMissionList": [
    1021201
  ]
}
```

### ConstValueChallengeClient.json (0.00 MB, 5 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Strong_Challenge_Mapinfo",
  "Value": {
    "IntValue": 5005
  }
}
```

### UpgradeAvatarEquipment.json (0.00 MB, 9 条)

**字段** (2): `LKLNGCCIMEM, NBFOFKGNNIO`

**首条记录摘要**:
```json
{
  "LKLNGCCIMEM": "Priest",
  "NBFOFKGNNIO": 21021
}
```

### ActiveConfig.json (0.00 MB, 1 条)

**字段** (7): `ID, ActivityModuleID, PowerConsume, ActiveItemID, ItemLimit, BenefitIDList, GiftShowList`

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
  "GiftShowList": "[{\"ItemID\": 235, \"ItemNum\": 20}, {\"ItemI..."
}
```

### IdleLiveGachaAvatarStar.json (0.00 MB, 6 条)

**字段** (2): `AvatarStar, AvatarPiece`

**首条记录摘要**:
```json
{
  "AvatarStar": 1,
  "AvatarPiece": 1
}
```

### RecommendConstValueCommon.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Assist_List_Stranger_Candidate_Num",
  "Value": {
    "IntValue": 80
  }
}
```

### ItemConfigAvatarTest.json (0.00 MB, 70 条)

### IdleLiveSpEquipSlot.json (0.00 MB, 3 条)

**字段** (5): `ID, UnlockID, ImagePath, TeamSlot, UnlockHint`

**首条记录摘要**:
```json
{
  "ID": 7,
  "UnlockID": 2007,
  "ImagePath": "SpriteOutput/TabIcon/Inventory/IconPet.p...",
  "TeamSlot": 1,
  "UnlockHint": {
    "Hash": 10816351141291215419
  }
}
```

### MuseumAreaMission.json (0.00 MB, 4 条)

**字段** (4): `AreaID, CollectItemNum, DialogDesc, MissionID`

**首条记录摘要**:
```json
{
  "AreaID": 1,
  "CollectItemNum": 5,
  "DialogDesc": {
    "Hash": 9367552517932764181
  },
  "MissionID": 8001241
}
```

### ItemDisplaySort.json (0.00 MB, 13 条)

**字段** (2): `ID, SortID`

**首条记录摘要**:
```json
{
  "ID": 22,
  "SortID": 1
}
```

### GridFightRoleGlobalModifier.json (0.00 MB, 6 条)

**字段** (3): `Roleid, SavedValueName, PerformParamList`

**首条记录摘要**:
```json
{
  "Roleid": 1501,
  "SavedValueName": "GP_Avatar_Sparxie_00",
  "PerformParamList": [
    30,
    90,
    180
  ]
}
```

### ElationBattleConstCommon.json (0.00 MB, 5 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ElationBattle_ElationEnergy",
  "Value": {
    "StringValue": "_ElationEnergy"
  }
}
```

### RogueEscapeLaser.json (0.00 MB, 2 条)

**字段** (7): `ParamGroupID, PrepareTime, GameTimeperRound, TotalRounds, ScoreperWave, ScoreperRound, ScoreRange`

**首条记录摘要**:
```json
{
  "ParamGroupID": 4001,
  "PrepareTime": 3,
  "GameTimeperRound": 5,
  "TotalRounds": 6,
  "ScoreperWave": 100,
  "ScoreperRound": [
    100,
    200,
    300,
    400,
    500
  ],
  "ScoreRange": [
    0,
    400,
    600
  ]
}
```

### PlanetFesRaiseConfig.json (0.00 MB, 8 条)

**字段** (2): `RaiseCurveID, RaiseValue`

**首条记录摘要**:
```json
{
  "RaiseCurveID": 1,
  "RaiseValue": 1
}
```

### RogueTournAreaGroupByTourn.json (0.00 MB, 3 条)

**字段** (3): `JFMBIOOCPIL, OENAMINOLLF, ANBDGFJDBPF`

**首条记录摘要**:
```json
{
  "JFMBIOOCPIL": "Guide",
  "OENAMINOLLF": {
    "Hash": 5771716240833390686
  },
  "ANBDGFJDBPF": {
    "Hash": 3087756842981685612
  }
}
```

### GridFightRoleRemark.json (0.00 MB, 6 条)

**字段** (2): `RoleID, RoleRemark`

**首条记录摘要**:
```json
{
  "RoleID": 1404,
  "RoleRemark": {
    "Hash": 14344086811640825811
  }
}
```

### ActivityEquipmentReward.json (0.00 MB, 2 条)

**字段** (6): `ID, MainMissionID, EquipmentRewardQuestID, EquipmentRewardQuestGotoID, MaterialRewardQuestIDList, ActivityModuleID`

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

### RogueUpgradeAvatarEquipment.json (0.00 MB, 8 条)

**字段** (2): `AvatarBaseType, EquipmentID`

**首条记录摘要**:
```json
{
  "AvatarBaseType": "Priest",
  "EquipmentID": 21021
}
```

### ChenLingConquerLevel.json (0.00 MB, 10 条)

**字段** (2): `Level, PrivilegePointNum`

**首条记录摘要**:
```json
{
  "Level": 1,
  "PrivilegePointNum": 1
}
```

### GridFightBinaryDiffAddRule.json (0.00 MB, 8 条)

**字段** (2): `ID, Quality`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Quality": 1
}
```

### CharacterNatureConfig.json (0.00 MB, 7 条)

**字段** (2): `NatureID, SpritePath`

**首条记录摘要**:
```json
{
  "NatureID": 1,
  "SpritePath": ""
}
```

### FantasticStoryConfig.json (0.00 MB, 1 条)

**字段** (6): `FantasticStoryID, ChapterIDList, BattleIDList, BuffIDList, BuffSlotIDList, ActivityModuleID`

**首条记录摘要**:
```json
{
  "FantasticStoryID": 1,
  "ChapterIDList": [
    1,
    2,
    3
  ],
  "BattleIDList": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "BuffIDList": "[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13,...",
  "BuffSlotIDList": [
    1,
    2,
    3,
    4
  ],
  "ActivityModuleID": 4000208
}
```

### ItemConfigAvatarTestRank.json (0.00 MB, 65 条)

### PlayerRoomSubAreaConfig.json (0.00 MB, 3 条)

**字段** (4): `ID, Name, Icon, StaticCameraID`

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

### StrongChallengeQuestGroup.json (0.00 MB, 6 条)

**字段** (2): `QuestGroupID, Name`

**首条记录摘要**:
```json
{
  "QuestGroupID": 1,
  "Name": {
    "Hash": 12344218773630475725
  }
}
```

### FateRinResidentReward.json (0.00 MB, 5 条)

**字段** (1): `ELJPCBHPKJK`

**首条记录摘要**:
```json
{
  "ELJPCBHPKJK": "[6088001, 6088002, 6088003, 6088004, 608..."
}
```

### PlanetFesSkillTreePhase.json (0.00 MB, 5 条)

**字段** (3): `Phase, UnlockIDList, Name`

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

### ActivityMazeSkill.json (0.00 MB, 2 条)

**字段** (6): `MazeSkillId, MazeSkillName, MazeSkilltype, MazeSkillDesc, RelatedAvatarSkill, SkillTriggerKey`

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

### HeartDialConstValue.json (0.00 MB, 4 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChangeEmotion_Unlock_Sub_Mission",
  "Value": {
    "IntValue": 103040103
  }
}
```

### ActivityRaidCollectionInfo.json (0.00 MB, 3 条)

**字段** (4): `ActivityID, RaidCollectionType, IconPath, TabIDList`

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

### ChimeraEvaluationGroup.json (0.00 MB, 10 条)

**字段** (2): `EvaluationGroupID, Sort`

**首条记录摘要**:
```json
{
  "EvaluationGroupID": 1,
  "Sort": 1
}
```

### LimaoNewsMainPage.json (0.00 MB, 3 条)

**字段** (4): `HFGNHCDNPHL, GKPHGMMADOJ, BGGDPGOLLEM, IDCGINLDIAD`

**首条记录摘要**:
```json
{
  "HFGNHCDNPHL": 1,
  "GKPHGMMADOJ": [
    1
  ],
  "BGGDPGOLLEM": [
    1,
    2,
    3
  ],
  "IDCGINLDIAD": []
}
```

### MatchThreeVersion.json (0.00 MB, 3 条)

**字段** (4): `ActivityVersion, ActivityID, PVPModuleID, BirdIDList`

**首条记录摘要**:
```json
{
  "ActivityVersion": 1,
  "ActivityID": 50014,
  "PVPModuleID": 5001400,
  "BirdIDList": [
    300,
    301,
    302,
    303,
    304,
    305,
    310,
    311
  ]
}
```

### FateRinStoryFight.json (0.00 MB, 6 条)

**字段** (3): `PHFMCACHFIJ, DOBKKDIECDO, HNEIIAGADGO`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "DOBKKDIECDO": 429001,
  "HNEIIAGADGO": 2050101
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

### LimaoNewsOfficeSurveyType.json (0.00 MB, 3 条)

**字段** (3): `AAPEGNAHMJB, MJGHNNBHFML, BCNPCBKGFBK`

**首条记录摘要**:
```json
{
  "AAPEGNAHMJB": "Branch",
  "MJGHNNBHFML": "SpriteOutput/LimaoNews/LimaoNewsTaskIcon...",
  "BCNPCBKGFBK": {
    "Hash": 11358458902115902277
  }
}
```

### RogueDLCDiceSurfaceRarity.json (0.00 MB, 3 条)

**字段** (3): `Rarity, NameColor, DiceSurfaceRarityImage`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "NameColor": "#73b0f4",
  "DiceSurfaceRarityImage": "SpriteOutput/UI/Rogue/DLC/Dice/DiceSufac..."
}
```

### PerformanceSkipPack.json (0.00 MB, 2 条)

**字段** (2): `PackID, PackList`

**首条记录摘要**:
```json
{
  "PackID": 803410110,
  "PackList": "[{\"DNGFHOEACBI\": \"D\", \"HNPDLANHONH\": 803..."
}
```

### IdleLiveTeamSlotLevelLimit.json (0.00 MB, 10 条)

**字段** (1): `LevelLimit`

**首条记录摘要**:
```json
{
  "LevelLimit": 1
}
```

### GridFightOrbDisplay.json (0.00 MB, 4 条)

**字段** (3): `OrbType, IconPath, PrefabPath`

**首条记录摘要**:
```json
{
  "OrbType": "White",
  "IconPath": "SpriteOutput/GridFight/GridItem/GridFigh...",
  "PrefabPath": ""
}
```

### PlayerRoomSlotOffset.json (0.00 MB, 6 条)

**字段** (2): `SlotID, Offset`

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

### TarotBookRevealedIcon.json (0.00 MB, 2 条)

**字段** (4): `ID, UnlockID, NewRoundIconPath, NewRectIconPath`

**首条记录摘要**:
```json
{
  "ID": 3,
  "UnlockID": 36202,
  "NewRoundIconPath": "SpriteOutput/TarotBook/TarotCard/RoundIc...",
  "NewRectIconPath": "SpriteOutput/TarotBook/TarotCard/Catalog..."
}
```

### GridFightExpertRestrict.json (0.00 MB, 5 条)

**字段** (5): `Cost, Chapter, Section, OCChapter, OCSection`

**首条记录摘要**:
```json
{
  "Cost": 1,
  "Chapter": 1,
  "Section": 1,
  "OCChapter": 1,
  "OCSection": 1
}
```

### FateRinLevelUp.json (0.00 MB, 4 条)

**字段** (1): `AAGKEBFHLMC`

**首条记录摘要**:
```json
{
  "AAGKEBFHLMC": 1
}
```

### GridFightTraitSPBattleArea.json (0.00 MB, 4 条)

**字段** (3): `ID, TraitLayer, BattleAreaNumList`

**首条记录摘要**:
```json
{
  "ID": 2004,
  "TraitLayer": 3,
  "BattleAreaNumList": [
    1,
    5
  ]
}
```

### PreAvatarTextmapConfig.json (0.00 MB, 5 条)

**字段** (2): `PreAvatarID, PreAvatarName`

**首条记录摘要**:
```json
{
  "PreAvatarID": 1510,
  "PreAvatarName": {
    "Hash": 8203254166742420857
  }
}
```

### ItemComefromLimit.json (0.00 MB, 4 条)

**字段** (4): `ID, ComefromID, OpenType, OpenParaList`

**首条记录摘要**:
```json
{
  "ID": 281,
  "ComefromID": 2,
  "OpenType": "FinishQuest",
  "OpenParaList": [
    2200502
  ]
}
```

### IdleLiveMessage.json (0.00 MB, 5 条)

**字段** (5): `MessageID, UnlockID, TriggerID, RewardID, StartContentID`

**首条记录摘要**:
```json
{
  "MessageID": 2,
  "UnlockID": 3,
  "TriggerID": 1,
  "RewardID": 8016015,
  "StartContentID": 1010
}
```

### ChenLingFesAwardType.json (0.00 MB, 4 条)

**字段** (3): `AwardType, AwardDesc, AwardIconPath`

**首条记录摘要**:
```json
{
  "AwardType": "Reroll",
  "AwardDesc": {
    "Hash": 7851603938510214337
  },
  "AwardIconPath": ""
}
```

### MessageContactsCondition.json (0.00 MB, 6 条)

**字段** (3): `ID, TruthMissionCondition, FakeContactID`

**首条记录摘要**:
```json
{
  "ID": 36,
  "TruthMissionCondition": 2020302,
  "FakeContactID": 57
}
```

### MarbleBuffHint.json (0.00 MB, 6 条)

**字段** (2): `ID, HintText`

**首条记录摘要**:
```json
{
  "ID": 1,
  "HintText": {
    "Hash": 2163855309307223733
  }
}
```

### HeliobusChallengeGroup.json (0.00 MB, 4 条)

**字段** (2): `ChallengeGroupID, ChallengeStageList`

**首条记录摘要**:
```json
{
  "ChallengeGroupID": 1001,
  "ChallengeStageList": [
    1001,
    1002,
    1003,
    1004
  ]
}
```

### ActiveBenefitData.json (0.00 MB, 6 条)

**字段** (3): `BenefitID, ActiveItemNum, Reward`

**首条记录摘要**:
```json
{
  "BenefitID": 1001,
  "ActiveItemNum": 6,
  "Reward": 3173001
}
```

### TutorialSubGuideConfig.json (0.00 MB, 2 条)

**字段** (6): `HBEDCNGOIMI, IECMJPALEOA, OENAMINOLLF, FIFINLKGEAC, OPFOHDKJNJI, LBJFALJAINI`

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

### MessageStateIcon.json (0.00 MB, 4 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": "Normal",
  "IconPath": "SpriteOutput/UI/AdventurePhase/MobilePho..."
}
```

### RogueCaptureMonster.json (0.00 MB, 3 条)

**字段** (5): `ParamGroupID, PrepareTime, GameTime, MonsterNum, ScoreRange`

**首条记录摘要**:
```json
{
  "ParamGroupID": 2001,
  "PrepareTime": 3,
  "GameTime": 40,
  "MonsterNum": 16,
  "ScoreRange": [
    0,
    2000,
    3600
  ]
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

**字段** (5): `ServantID, HidePropertyList, HidePropertyInBattleList, SecretPropertyList, SkillPointIconSourceTriggerKey`

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

### ItemGenderedConfig.json (0.00 MB, 2 条)

**字段** (5): `CMNOEFFFNPE, KAINAFFMLBK, GJMHAJGIHOM, HHIIGAIJEDA, DEJJGGOABPA`

**首条记录摘要**:
```json
{
  "CMNOEFFFNPE": 229001,
  "KAINAFFMLBK": "GENDER_MAN",
  "GJMHAJGIHOM": "SpriteOutput/ItemIcon/DressIcon/229001_m...",
  "HHIIGAIJEDA": "SpriteOutput/ItemFigures/DressIcon/22900...",
  "DEJJGGOABPA": ""
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

### PlayerReturnAssist.json (0.00 MB, 3 条)

**字段** (3): `AssistGroupID, AssistAvatarList, TeamDes`

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

### TitanAtlasChangeInfo.json (0.00 MB, 6 条)

**字段** (2): `TitanID, ChangeTitanIDList`

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

**字段** (1): `ImagePath`

**首条记录摘要**:
```json
{
  "ImagePath": ""
}
```

### GotoTips.json (0.00 MB, 5 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": "FinishMainMission",
  "Name": {
    "Hash": 13240467892538975246
  }
}
```

### TeamTowersRobot.json (0.00 MB, 2 条)

**字段** (4): `PHFMCACHFIJ, OENAMINOLLF, HCCKLLGBPIA, NMAHGFAPENI`

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

### AlleyShip.json (0.00 MB, 3 条)

**字段** (3): `ShipID, ShipConfig, ShipType`

**首条记录摘要**:
```json
{
  "ShipID": 1,
  "ShipConfig": "Config/Gameplays/Alley/AlleyShipment/All...",
  "ShipType": "Small"
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

### GridFightFormationWave.json (0.00 MB, 5 条)

**字段** (4): `ID, MaxTeammateCount, Ability, ParamList`

**首条记录摘要**:
```json
{
  "ID": 5,
  "MaxTeammateCount": 5,
  "Ability": "",
  "ParamList": []
}
```

### IdleLiveAvatarUpgradeLimit.json (0.00 MB, 9 条)

**字段** (1): `LevelLimit`

**首条记录摘要**:
```json
{
  "LevelLimit": 1
}
```

### ActivityPanelSevenDayReward.json (0.00 MB, 1 条)

**字段** (6): `ID, BGImgPath, PicImgPath, CardWidget0ImgPath, CardWidget1ImgPath, CardWidget2ImgPath`

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

### GachaNews.json (0.00 MB, 2 条)

**字段** (5): `DecideID, NewsID, Title, Desc, AvatarList`

**首条记录摘要**:
```json
{
  "DecideID": 1,
  "NewsID": 1,
  "Title": {
    "Hash": 2072679761731225071
  },
  "Desc": {
    "Hash": 9984054319420717892
  },
  "AvatarList": [
    1102,
    1205,
    1208
  ]
}
```

### RogueTournUseBuffType.json (0.00 MB, 3 条)

**字段** (1): `UseBuffTypeList`

**首条记录摘要**:
```json
{
  "UseBuffTypeList": [
    121,
    122,
    124,
    125,
    126,
    127,
    128,
    129
  ]
}
```

### ChallengeActivityConfig.json (0.00 MB, 1 条)

**字段** (4): `ActivityID, ChallengeList, ActivityRewardList, MarkScoreList`

**首条记录摘要**:
```json
{
  "ActivityID": 10012,
  "ChallengeList": "[5001, 5002, 5003, 5004, 5006, 5007, 500...",
  "ActivityRewardList": "[10012001, 10012002, 10012003, 10012004,...",
  "MarkScoreList": [
    1,
    5000,
    8000,
    11000
  ]
}
```

### DirectDeliveryNotice.json (0.00 MB, 3 条)

**字段** (4): `ID, ActivityModule, UnlockQuestId, RewardList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModule": 5004901,
  "UnlockQuestId": 6070508,
  "RewardList": [
    3140101,
    3140102,
    3140103
  ]
}
```

### ActivityExpeditionGroup.json (0.00 MB, 1 条)

**字段** (3): `GroupID, ExpeditionIdList, ActivityModuleID`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "ExpeditionIdList": "[100301, 100302, 100303, 100304, 100305,...",
  "ActivityModuleID": 5006201
}
```

### MissionStoryEvent.json (0.00 MB, 4 条)

**字段** (2): `ID, ConditionExpression`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ConditionExpression": "[RealFinishSubMission:104040403]"
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

### ActivityPanelSingeQuest.json (0.00 MB, 4 条)

**字段** (4): `ID, AvatarID, GotoID, QuestList`

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

### TeamTowersDepartment.json (0.00 MB, 3 条)

**字段** (3): `PHFMCACHFIJ, OENAMINOLLF, NOIDBOIGBFM`

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

### FateRinDayProgress.json (0.00 MB, 7 条)

**字段** (2): `GNIFLCBGAAA, DHONGKBFCNE`

**首条记录摘要**:
```json
{
  "GNIFLCBGAAA": 1,
  "DHONGKBFCNE": 105440019
}
```

### MultiMaterialConfig.json (0.00 MB, 3 条)

**字段** (5): `ItemID, ItemSubType, ExchangeRare2, ExchangeRare3, ExchangeRare4`

**首条记录摘要**:
```json
{
  "ItemID": 110101,
  "ItemSubType": "TracePath",
  "ExchangeRare2": 1,
  "ExchangeRare3": 3,
  "ExchangeRare4": 9
}
```

### MissionGotoConfig.json (0.00 MB, 5 条)

**字段** (2): `GotoID, Desc`

**首条记录摘要**:
```json
{
  "GotoID": 4000,
  "Desc": {
    "Hash": 182991156390222188
  }
}
```

### PamPlaceInfo.json (0.00 MB, 5 条)

**字段** (2): `PamPlaceType, PamActionList`

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

### ShopGroup.json (0.00 MB, 3 条)

**字段** (3): `ID, Name, IconPath`

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

### AvatarCutinChangeConfig.json (0.00 MB, 2 条)

**字段** (3): `AvatarID, ChangeConditions, AvatarImgPath`

**首条记录摘要**:
```json
{
  "AvatarID": 8007,
  "ChangeConditions": "[{\"Type\": \"FinishSubMission\", \"Param\": \"...",
  "AvatarImgPath": "SpriteOutput/AvatarDrawCard/8007_02.png"
}
```

### MazeCampData.json (0.00 MB, 5 条)

**字段** (2): `CampID, HostileCampList`

**首条记录摘要**:
```json
{
  "CampID": "Player",
  "HostileCampList": [
    3,
    4
  ]
}
```

### RestaurantTagConfig.json (0.00 MB, 4 条)

**字段** (3): `TagID, Name, ColorID`

**首条记录摘要**:
```json
{
  "TagID": 9901,
  "Name": {
    "Hash": 8852834761778284931
  },
  "ColorID": 8003
}
```

### AvatarPathItemTransfer.json (0.00 MB, 2 条)

**字段** (5): `AvatarID, SourceItemID, TargetItemID, DialogTitle, DialogDesc`

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

### TestHotUpdateExcel.json (0.00 MB, 6 条)

**字段** (2): `AvatarID, AvatarName`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "AvatarName": "Avatar_CherryBlossom_YS"
}
```

### MenuItemExtraInfo.json (0.00 MB, 3 条)

**字段** (4): `ID, Condition, ExtraInfoType, ExtraInfoParam`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Condition": "PamLevelReward",
  "ExtraInfoType": [
    1,
    3
  ],
  "ExtraInfoParam": "#dbc291"
}
```

### ActivityHipplenPerformance.json (0.00 MB, 3 条)

**字段** (2): `PHFMCACHFIJ, LCGBMLNLHLC`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "LCGBMLNLHLC": "Config/Gameplays/Hipplen/Performance/Act..."
}
```

### ChenLingAction.json (0.00 MB, 8 条)

**字段** (2): `ID, ActionType`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActionType": "AddCard"
}
```

### GridFightPresentConfig.json (0.00 MB, 2 条)

**字段** (5): `ID, PresentDesc, PresentName, BonusID, ShortenType`

**首条记录摘要**:
```json
{
  "ID": 150101,
  "PresentDesc": {
    "Hash": 12431317978357667832
  },
  "PresentName": {
    "Hash": 6796082680286378829
  },
  "BonusID": 21040,
  "ShortenType": "Perfect"
}
```

### RogueTournCollectionConfig.json (0.00 MB, 8 条)

**字段** (2): `PillarID, Floor`

**首条记录摘要**:
```json
{
  "PillarID": 1,
  "Floor": "Floor1"
}
```

### AvatarSkillLink.json (0.00 MB, 2 条)

**字段** (3): `SkillID, LinkToAvatarIDList, LinkToAvatarIDSimplifiedList`

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

### ExpeditionGroup.json (0.00 MB, 3 条)

**字段** (3): `GroupID, Name, IconPath`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "Name": {
    "Hash": 5580727083240489480
  },
  "IconPath": "SpriteOutput/ItemIcon/110111.png"
}
```

### GridFightSummonBEOverride.json (0.00 MB, 2 条)

**字段** (4): `SeasonID, BEID, FrontJsonOverride, BackJsonOverride`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "BEID": 11222,
  "FrontJsonOverride": "Config/ConfigCharacter/GridFight/3.5/Ava...",
  "BackJsonOverride": ""
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

### GameModeGroup.json (0.00 MB, 2 条)

**字段** (2): `GameModeGroupID, GamemodeList`

**首条记录摘要**:
```json
{
  "GameModeGroupID": 1001,
  "GamemodeList": "[\"Town\", \"Maze\", \"Train\", \"Challenge\", \"..."
}
```

### GridFightSkinCutin.json (0.00 MB, 3 条)

**字段** (2): `SkinID, CutinPath`

**首条记录摘要**:
```json
{
  "SkinID": 1100101,
  "CutinPath": "SpriteOutput/AvatarSpecialActionFigures/..."
}
```

### TeamVoiceAtlasBinding.json (0.00 MB, 5 条)

**字段** (3): `AvatarID, LinkAvatar, AtlasVoiceID`

**首条记录摘要**:
```json
{
  "AvatarID": 1315,
  "LinkAvatar": 1504,
  "AtlasVoiceID": 35
}
```

### PerformanceReplayGender.json (0.00 MB, 4 条)

**字段** (3): `PerformanceType, PerformanceID, Gender`

**首条记录摘要**:
```json
{
  "PerformanceType": "C",
  "PerformanceID": 100050103,
  "Gender": "GENDER_MAN"
}
```

### AvatarDefaultMazeBuffLD.json (0.00 MB, 4 条)

**字段** (3): `ID, SkillIndex, DefaultMazeBuffIDList`

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

### GridFightVictoryBonus.json (0.00 MB, 7 条)

**字段** (2): `GoldBonus, ExtraGroupID`

**首条记录摘要**:
```json
{
  "GoldBonus": 1,
  "ExtraGroupID": 2
}
```

### MarbleSealBuff.json (0.00 MB, 4 条)

**字段** (2): `ID, AssetsPath`

**首条记录摘要**:
```json
{
  "ID": 9,
  "AssetsPath": "SpriteOutput/BuffIcon/Inlevel/IconMonste..."
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

### HeadFrameConfig.json (0.00 MB, 4 条)

**字段** (2): `ID, PrefabPath`

**首条记录摘要**:
```json
{
  "ID": 226001,
  "PrefabPath": "UI/Resources/HeadFrame/HeadFrame226001.p..."
}
```

### MarbleMatchDetail.json (0.00 MB, 5 条)

**字段** (2): `ID, NpcList`

**首条记录摘要**:
```json
{
  "ID": 5,
  "NpcList": [
    11,
    13,
    12,
    16,
    15,
    17,
    14
  ]
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

### EvoBdSCBoxGroup.json (0.00 MB, 5 条)

**字段** (2): `GroupID, BoxItemIDList`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "BoxItemIDList": [
    1,
    2
  ]
}
```

### MessageItemVideo.json (0.00 MB, 3 条)

**字段** (3): `ID, ImagePath, VideoID`

**首条记录摘要**:
```json
{
  "ID": 121901,
  "ImagePath": "SpriteOutput/PhoneMessagePic/PhoneMessag...",
  "VideoID": 301
}
```

### PlanetFesGameConfig.json (0.00 MB, 2 条)

**字段** (6): `GameID, LandID, ParamInt3, ParamStr1, RewardPool, RaiseCurveID`

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

### RaidPerformance.json (0.00 MB, 4 条)

**字段** (3): `RaidID, PerformanceID, PerformanceType`

**首条记录摘要**:
```json
{
  "RaidID": 40233001,
  "PerformanceID": 102150109,
  "PerformanceType": "A"
}
```

### FateRinOwnerInitHougu.json (0.00 MB, 6 条)

**字段** (2): `PHFMCACHFIJ, KFFNBKGCCKO`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": "Rin",
  "KFFNBKGCCKO": 4
}
```

### GuideResConfig.json (0.00 MB, 5 条)

**字段** (2): `ID, PrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PrefabPath": "UI/Guide/GuideArrow.prefab"
}
```

### SwordTrainingUnlock.json (0.00 MB, 3 条)

**字段** (3): `UnlockID, FinishWayID, UnlockDesc`

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

### PixAirEquipPriceConfig.json (0.00 MB, 4 条)

**字段** (4): `SlotType, Level, BuyPrice, SellPrice`

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

**字段** (3): `GachaID, CardThemeID, UnlockIDList`

**首条记录摘要**:
```json
{
  "GachaID": 201,
  "CardThemeID": 201,
  "UnlockIDList": []
}
```

### UIPageBGM.json (0.00 MB, 4 条)

**字段** (2): `PagePrefab, BGMEvent`

**首条记录摘要**:
```json
{
  "PagePrefab": "BattleLineupUI",
  "BGMEvent": "Ev_bgm_menu_ui_play"
}
```

### AvatarSourceConfigLD.json (0.00 MB, 6 条)

**字段** (2): `AvatarID, SourceAvatarID`

**首条记录摘要**:
```json
{
  "AvatarID": 6036,
  "SourceAvatarID": 1014
}
```

### FateRinMainMissions.json (0.00 MB, 6 条)

**字段** (2): `PHFMCACHFIJ, KGOOAOJLLDA`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "KGOOAOJLLDA": 1054400
}
```

### TrainPartyGridTutorial.json (0.00 MB, 4 条)

**字段** (3): `NMMKHFIFPEJ, BHGKDNAPGOC, ALNDEGPBMLI`

**首条记录摘要**:
```json
{
  "NMMKHFIFPEJ": 6001,
  "BHGKDNAPGOC": "Grid_8011",
  "ALNDEGPBMLI": 5
}
```

### InteractiveSceneConstClient.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ReSha_MazePuzzleID",
  "Value": {
    "IntValue": 1034
  }
}
```

### MatchThreeDmgLimit.json (0.00 MB, 5 条)

**字段** (3): `Round, BasicDamage, MaxDamage`

**首条记录摘要**:
```json
{
  "Round": 1,
  "BasicDamage": 10,
  "MaxDamage": 100
}
```

### GridFightRoleTagInfo.json (0.00 MB, 4 条)

**字段** (2): `ID, TagDesc`

**首条记录摘要**:
```json
{
  "ID": "DPS",
  "TagDesc": {
    "Hash": 12696585421154091836
  }
}
```

### MapGuide.json (0.00 MB, 2 条)

**字段** (6): `ID, WorldID, MapGuideName, SheetID, SheetType, MapGuideIconPath`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "WorldID": 1,
  "MapGuideName": {
    "Hash": 7432120750562036116
  },
  "SheetID": 1,
  "SheetType": 1,
  "MapGuideIconPath": ""
}
```

### EvolveBuildMonsteCollection.json (0.00 MB, 6 条)

**字段** (2): `ID, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 302401007,
  "UnlockQuest": 6070000
}
```

### MatchThreeV2DmgLimit.json (0.00 MB, 5 条)

**字段** (3): `Round, BasicDamage, MaxDamage`

**首条记录摘要**:
```json
{
  "Round": 1,
  "BasicDamage": 50,
  "MaxDamage": 50
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

### StaminaItemList.json (0.00 MB, 3 条)

**字段** (4): `ItemID, IsAlwaysShown, SortWeight, Desc`

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

### DrinkMakerConstValueCommon.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "DrinkMaker_FreePhaseStartMainMissionID",
  "Value": {
    "IntValue": 8021106
  }
}
```

### RogueMagicWorkbench.json (0.00 MB, 4 条)

**字段** (2): `WorkbenchID, FuncList`

**首条记录摘要**:
```json
{
  "WorkbenchID": 101,
  "FuncList": [
    6,
    7,
    10
  ]
}
```

### DrinkMakerLayerData.json (0.00 MB, 5 条)

**字段** (2): `LayerID, IncludeTagList`

**首条记录摘要**:
```json
{
  "LayerID": 1,
  "IncludeTagList": [
    401
  ]
}
```

### HeartDialEmo.json (0.00 MB, 4 条)

**字段** (1): `EmoName`

**首条记录摘要**:
```json
{
  "EmoName": {
    "Hash": 4283366908221791014
  }
}
```

### MonopolyPhaseReward.json (0.00 MB, 4 条)

**字段** (3): `PhaseRewardID, ProgressValue, RewardID`

**首条记录摘要**:
```json
{
  "PhaseRewardID": 1,
  "ProgressValue": 250,
  "RewardID": 3112501
}
```

### RogueTournAreaGroup.json (0.00 MB, 2 条)

**字段** (3): `JFMBIOOCPIL, OENAMINOLLF, ANBDGFJDBPF`

**首条记录摘要**:
```json
{
  "JFMBIOOCPIL": "Formal",
  "OENAMINOLLF": {
    "Hash": 15599434989027431241
  },
  "ANBDGFJDBPF": {
    "Hash": 1186989134934936683
  }
}
```

### ChallengeBossConstValue.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChallengeBoss_Special_MonsterTemplateID",
  "Value": "{\"ArrayValue\": [{\"IntValue\": 8015012}, {..."
}
```

### GridFightHandBookReward.json (0.00 MB, 2 条)

**字段** (2): `HandBookType, QuestList`

**首条记录摘要**:
```json
{
  "HandBookType": "HandBookAugment",
  "QuestList": "[7301301, 7301302, 7301303, 7301304, 730..."
}
```

### ReportType.json (0.00 MB, 4 条)

**字段** (2): `TypeID, Text`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Text": {
    "Hash": 13868038024686836006
  }
}
```

### ActivityQuestTabGroupUI.json (0.00 MB, 2 条)

**字段** (3): `QuestTabGroupID, BgPrefabPath, TabItemPrefabPath`

**首条记录摘要**:
```json
{
  "QuestTabGroupID": 6001201,
  "BgPrefabPath": "UI/Rogue/Tourn/Titan/Widget/RogueTournTi...",
  "TabItemPrefabPath": ""
}
```

### AetherDivideBadge.json (0.00 MB, 5 条)

**字段** (1): `MaxSpiritLevel`

**首条记录摘要**:
```json
{
  "MaxSpiritLevel": 2
}
```

### FateAvatarDescription.json (0.00 MB, 2 条)

**字段** (3): `ACCJKGEKHKP, GPNOCGKJJCG, MDEBFIFOKHH`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 1014,
  "GPNOCGKJJCG": {
    "Hash": 8409481060853266328
  },
  "MDEBFIFOKHH": [
    {
      "Value": 1
    }
  ]
}
```

### RogueUpgradeAvatarConst.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueUpgradeAvatar_4Set",
  "Value": {
    "IntValue": 101
  }
}
```

### AtlasAvatarChangeInfo.json (0.00 MB, 3 条)

**字段** (4): `ELDCAFJBIPN, JJKLIJNFIBB, ACCJKGEKHKP, ADGKGGIBBEC`

**首条记录摘要**:
```json
{
  "ELDCAFJBIPN": 1,
  "JJKLIJNFIBB": 70015,
  "ACCJKGEKHKP": 1308,
  "ADGKGGIBBEC": 112
}
```

### GachaPoolReward.json (0.00 MB, 1 条)

**字段** (8): `ID, GachaID, QuestID, ActivityID, Title, Desc, Tips, Bubble`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GachaID": 2124,
  "QuestID": 6084000,
  "ActivityID": 50115,
  "Title": {
    "Hash": 549424256089645061
  },
  "Desc": {
    "Hash": 13769591662499285958
  },
  "Tips": {
    "Hash": 10287720400106713852
  },
  "Bubble": {
    "Hash": 4970141103905144593
  }
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

### TutorialGuideSpecialGoto.json (0.00 MB, 2 条)

**字段** (4): `LLDCHLHNADA, OENAMINOLLF, ABCDGEFDNPC, BGDEAHEAOFF`

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

### MessageContactsType.json (0.00 MB, 3 条)

**字段** (3): `ContactsType, Name, SortID`

**首条记录摘要**:
```json
{
  "ContactsType": 1,
  "Name": {
    "Hash": 1380494021982098653
  },
  "SortID": 1
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

### ChenLingConditionDesc.json (0.00 MB, 3 条)

**字段** (2): `Type, Desc`

**首条记录摘要**:
```json
{
  "Type": "SoldierAdjacentBuildingMaxLevel",
  "Desc": {
    "Hash": 11701372574607580914
  }
}
```

### ChimeraEmoji.json (0.00 MB, 4 条)

**字段** (2): `EmojiID, EmojiPath`

**首条记录摘要**:
```json
{
  "EmojiID": 1,
  "EmojiPath": "SpriteOutput/Emoji/120016.png"
}
```

### RogueCandyCrash.json (0.00 MB, 2 条)

**字段** (5): `ParamGroupID, PrepareTime, TotalTime, TotalRounds, RoundRange`

**首条记录摘要**:
```json
{
  "ParamGroupID": 4001,
  "PrepareTime": 3,
  "TotalTime": 35,
  "TotalRounds": 3,
  "RoundRange": [
    0,
    1,
    3
  ]
}
```

### RogueAdventureRoom.json (0.00 MB, 3 条)

**字段** (3): `RoomID, AdventureType, ParamGroupID`

**首条记录摘要**:
```json
{
  "RoomID": 1000006,
  "AdventureType": "RogueDestroyProp",
  "ParamGroupID": 101001
}
```

### UpgradeAvatarConst.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "UpgradeAvatar_4Set",
  "Value": {
    "IntValue": 101
  }
}
```

### AvatarSpecialSkillTree.json (0.00 MB, 2 条)

**字段** (4): `AvatarID, AnchorType, AvatarImgPath, ShowSkill`

**首条记录摘要**:
```json
{
  "AvatarID": 8007,
  "AnchorType": "Point21",
  "AvatarImgPath": "SpriteOutput/AvatarDrawCard/8007_02.png",
  "ShowSkill": 800708
}
```

### DrinkMakerMixTag.json (0.00 MB, 4 条)

**字段** (2): `TagID, IncludeTagList`

**首条记录摘要**:
```json
{
  "TagID": 31,
  "IncludeTagList": [
    2,
    6
  ]
}
```

### RogueGuideActivityPanelData.json (0.00 MB, 4 条)

**字段** (2): `ActivityID, AvatarID`

**首条记录摘要**:
```json
{
  "ActivityID": 60001,
  "AvatarID": 1013
}
```

### GridFightTraitEquipRelation.json (0.00 MB, 3 条)

**字段** (2): `EquipID, TraitEquipIDList`

**首条记录摘要**:
```json
{
  "EquipID": 35030107,
  "TraitEquipIDList": [
    35100001,
    35100011
  ]
}
```

### RelicExpItem.json (0.00 MB, 4 条)

**字段** (3): `ItemID, ExpProvide, CoinCost`

**首条记录摘要**:
```json
{
  "ItemID": 231,
  "ExpProvide": 100,
  "CoinCost": 150
}
```

### PlayerReturnExtraHcoin.json (0.00 MB, 1 条)

**字段** (5): `ConfigID, OfflineDays, HcoinThresholdList, ExtraHcoinNumList, ExtraHcoinUIProgressRatioList`

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

### ClockParkProgressReward.json (0.00 MB, 5 条)

**字段** (2): `QuestID, QuestProgress`

**首条记录摘要**:
```json
{
  "QuestID": 6022101,
  "QuestProgress": 20
}
```

### GridFightGamePlayResource.json (0.00 MB, 2 条)

**字段** (4): `ID, Name, Desc, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "ResourceName_1",
  "Desc": "ResourceDesc_1",
  "IconPath": "SpriteOutput/GridFight/GridItem/281034.p..."
}
```

### LimaoNewsConstValueClient.json (0.00 MB, 3 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Limao_News_Ban",
  "Value": {
    "IntValue": 0
  }
}
```

### PixAirNodeTypeConfig.json (0.00 MB, 3 条)

**字段** (2): `NodeType, NodeName`

**首条记录摘要**:
```json
{
  "NodeType": "Select",
  "NodeName": {
    "Hash": 8368572679024374711
  }
}
```

### FateMiscDisplay.json (0.00 MB, 3 条)

**字段** (2): `LOEPLBPFMEN, FNBIFDIHIJH`

**首条记录摘要**:
```json
{
  "LOEPLBPFMEN": 101,
  "FNBIFDIHIJH": {
    "Hash": 7832065335160047335
  }
}
```

### LimaoNewsSponsorState.json (0.00 MB, 4 条)

**字段** (3): `IFAGMAOMHCL, AEDOBNFDODI, GNDCCBNILML`

**首条记录摘要**:
```json
{
  "IFAGMAOMHCL": 1,
  "AEDOBNFDODI": 1,
  "GNDCCBNILML": true
}
```

### GridFightRoleSwitchConfig.json (0.00 MB, 2 条)

**字段** (4): `RoleID, Condition, ParamList, BaseRoleID`

**首条记录摘要**:
```json
{
  "RoleID": 11012,
  "Condition": "ByMaxTrait",
  "ParamList": [
    2006,
    1005
  ],
  "BaseRoleID": 11011
}
```

### AetherDivideOverflowChunk.json (0.00 MB, 2 条)

**字段** (6): `ID, EventID, SpiritID, MazeBuffID, GroupID, BattleAreaID`

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

### RogueMagicLayerEffect.json (0.00 MB, 1 条)

**字段** (4): `LayerEffectID, LayerEffectName, LayerEffectDesc, DescParamList`

**首条记录摘要**:
```json
{
  "LayerEffectID": 401,
  "LayerEffectName": {
    "Hash": 17991810395032776825
  },
  "LayerEffectDesc": {
    "Hash": 11022754334612478965
  },
  "DescParamList": [
    {
      "Value": 500
    },
    {
      "Value": 4
    }
  ]
}
```

### AssistantTipsShowCase.json (0.00 MB, 2 条)

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

### ClockParkRaid.json (0.00 MB, 3 条)

**字段** (3): `RaidID, RaidUnlockProgress, RaidMapinfo`

**首条记录摘要**:
```json
{
  "RaidID": 44305001,
  "RaidUnlockProgress": 4000,
  "RaidMapinfo": 1415
}
```

### GridFightTraitBonusAddRule.json (0.00 MB, 3 条)

**字段** (2): `ID, ParamList`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "ParamList": []
}
```

### IdleLiveFinalActGift.json (0.00 MB, 4 条)

**字段** (3): `ID, FinalAct, RewardID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FinalAct": 1,
  "RewardID": 8016016
}
```

### MarblePhase.json (0.00 MB, 3 条)

**字段** (2): `ID, Name`

**首条记录摘要**:
```json
{
  "ID": "Group",
  "Name": {
    "Hash": 14374891196539431026
  }
}
```

### IdleLiveConstClient.json (0.00 MB, 2 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "IdleLive_EquipRarityMax",
  "Value": {
    "IntValue": 7
  }
}
```

### AreaMapShowConfig.json (0.00 MB, 2 条)

**字段** (2): `ID, Conditions`

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

**字段** (3): `ID, SpiritID, Promotion`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SpiritID": 6014,
  "Promotion": 3
}
```

### MissionDisable.json (0.00 MB, 1 条)

**字段** (5): `SubMissionID, MainMissionIDListClientDisplay, MainMissionIDList, RecycleItemList, CompensateItemList`

**首条记录摘要**:
```json
{
  "SubMissionID": 102120119,
  "MainMissionIDListClientDisplay": [
    2020103,
    2020104
  ],
  "MainMissionIDList": [
    2020103,
    2020104,
    2020106
  ],
  "RecycleItemList": [],
  "CompensateItemList": []
}
```

### ActivityHipplenGameGrade.json (0.00 MB, 3 条)

**字段** (2): `GradeType, GradeText`

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

**字段** (4): `ID, SkinID, SpecialActionPrefabPath, SkinSpecialActionPrefabPath`

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

**字段** (2): `TagID, Desc`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "Desc": {
    "Hash": 10093778241051061883
  }
}
```

### GrowthTargetTimeLimitTop.json (0.00 MB, 4 条)

**字段** (2): `GachaID, ActivityModule`

**首条记录摘要**:
```json
{
  "GachaID": 5001,
  "ActivityModule": 1011001
}
```

### MessageSpecialChange.json (0.00 MB, 3 条)

**字段** (2): `ItemID, ActionType`

**首条记录摘要**:
```json
{
  "ItemID": 150370109,
  "ActionType": "Flash"
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

### CommonActiveSkillConfig.json (0.00 MB, 3 条)

**字段** (2): `CommonActiveSkillID, AbilityName`

**首条记录摘要**:
```json
{
  "CommonActiveSkillID": 101,
  "AbilityName": "CommonActiveSkill_Fire_Single_Phase02"
}
```

### ContentUnlockDescConfig.json (0.00 MB, 1 条)

**字段** (4): `ContentID, UnlockDesc01, UnlockDesc02, UnlockDesc03`

**首条记录摘要**:
```json
{
  "ContentID": 200003,
  "UnlockDesc01": {
    "Hash": 18306363007307211805
  },
  "UnlockDesc02": {
    "Hash": 16225148912155353599
  },
  "UnlockDesc03": {
    "Hash": 2085975518952413370
  }
}
```

### SysMailGotoConfig.json (0.00 MB, 2 条)

**字段** (3): `TemplateID, GotoID, GotoBtnName`

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

### FantasticStoryBuffSlotID.json (0.00 MB, 4 条)

**字段** (2): `BuffSlotID, UnlockChapterID`

**首条记录摘要**:
```json
{
  "BuffSlotID": 1,
  "UnlockChapterID": 1
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

### ChallengeSkipConfig.json (0.00 MB, 3 条)

**字段** (4): `NDEEOPGAILP, CEELPELAICJ, NAGOAODFACD, NEBFIEHMLJB`

**首条记录摘要**:
```json
{
  "NDEEOPGAILP": "Memory",
  "CEELPELAICJ": 9,
  "NAGOAODFACD": 1,
  "NEBFIEHMLJB": 1
}
```

### IdleLiveQuestionMessage.json (0.00 MB, 5 条)

**字段** (2): `ID, MessageID`

**首条记录摘要**:
```json
{
  "ID": 202,
  "MessageID": 3
}
```

### TrainPassengerConfig.json (0.00 MB, 2 条)

**字段** (2): `PassengerID, BehaviorList`

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

### EquipmentExpItemConfig.json (0.00 MB, 3 条)

**字段** (3): `ItemID, ExpProvide, CoinCost`

**首条记录摘要**:
```json
{
  "ItemID": 221,
  "ExpProvide": 500,
  "CoinCost": 250
}
```

### ActivityDiceUnlockTips.json (0.00 MB, 2 条)

**字段** (2): `UnlockType, UnlockTips`

**首条记录摘要**:
```json
{
  "UnlockType": "OfferingLevel",
  "UnlockTips": {
    "Hash": 6372015737488760663
  }
}
```

### ConstValueContentPackage.json (0.00 MB, 2 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "EarlyAccess_System_UnlockID",
  "Value": {
    "IntValue": 10008
  }
}
```

### BattlePassWeekConfig.json (0.00 MB, 3 条)

**字段** (3): `ID, BPLevelExp, BPWeekMaxExp`

**首条记录摘要**:
```json
{
  "ID": 1,
  "BPLevelExp": 800,
  "BPWeekMaxExp": 8000
}
```

### HPShowRule.json (0.00 MB, 3 条)

**字段** (4): `ID, Max, Color, IsDanger`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Max": 0.3,
  "Color": "#e23977ff",
  "IsDanger": true
}
```

### MarbleCustomAction.json (0.00 MB, 2 条)

**字段** (3): `ID, SealInsID, LaunchParamList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SealInsID": 302,
  "LaunchParamList": [
    -0.359,
    -0.151
  ]
}
```

### OpenURLWebViewRule.json (0.00 MB, 4 条)

**字段** (3): `RuleID, Default, iOS`

**首条记录摘要**:
```json
{
  "RuleID": 1,
  "Default": 2,
  "iOS": 1
}
```

### GachaCeiling.json (0.00 MB, 1 条)

**字段** (4): `GachaType, CeilingType, CeilingNum, CeilingItemList`

**首条记录摘要**:
```json
{
  "GachaType": "Normal",
  "CeilingType": "Option",
  "CeilingNum": 300,
  "CeilingItemList": "[1003, 1004, 1101, 1104, 1107, 1209, 121..."
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

### ChooseDeliveryGroup.json (0.00 MB, 2 条)

**字段** (2): `GroupID, RewardList`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "RewardList": [
    3140301,
    3140302,
    3140303
  ]
}
```

### DrinkMakerLevel.json (0.00 MB, 4 条)

**字段** (2): `Level, LevelUpExp`

**首条记录摘要**:
```json
{
  "Level": 1,
  "LevelUpExp": 500
}
```

### ChallengeActMark.json (0.00 MB, 4 条)

**字段** (1): `MarkIconPath`

**首条记录摘要**:
```json
{
  "MarkIconPath": ""
}
```

### FateRinHouguRarity.json (0.00 MB, 3 条)

**字段** (2): `PMIEAEGJNMJ, OCBFMPOCBIK`

**首条记录摘要**:
```json
{
  "PMIEAEGJNMJ": "R",
  "OCBFMPOCBIK": "rank1"
}
```

### GridFightModuleBanAugment.json (0.00 MB, 3 条)

**字段** (2): `BanAugmentId, ModuleId`

**首条记录摘要**:
```json
{
  "BanAugmentId": 203801,
  "ModuleId": 7110501
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

### ActivityBenefitV2Config.json (0.00 MB, 1 条)

**字段** (4): `PHFMCACHFIJ, FBJNOBODCLF, LABFIMHODHC, JJCIOIKKJEM`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBJNOBODCLF": "[5008401, 5008402, 5008403, 5008404, 500...",
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

### MaterialSubmitterGroup.json (0.00 MB, 1 条)

**字段** (3): `ActivityID, SubmitterIDList, Type`

**首条记录摘要**:
```json
{
  "ActivityID": 30014,
  "SubmitterIDList": [
    301,
    302,
    303,
    304,
    305,
    306,
    307
  ],
  "Type": "AmphoreusCurio"
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

### RoguePersonaConstClient.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTournPersona_CantViewStyleIDList",
  "Value": {
    "ArrayValue": [
      {
        "IntValue": 901
      }
    ]
  }
}
```

### PSTrophy.json (0.00 MB, 1 条)

**字段** (3): `AchievementID, AchievementTitle, AchievementDesc`

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

### RestartBattleBlackList.json (0.00 MB, 5 条)

**字段** (1): `EventID`

**首条记录摘要**:
```json
{
  "EventID": 20001001
}
```

### GridFightUnlock.json (0.00 MB, 3 条)

**字段** (2): `UnlockID, QuestID`

**首条记录摘要**:
```json
{
  "UnlockID": 1001,
  "QuestID": 7302101
}
```

### ExpeditionTeam.json (0.00 MB, 4 条)

**字段** (1): `TeamID`

**首条记录摘要**:
```json
{
  "TeamID": 1
}
```

### AvatarEnhancedSeason.json (0.00 MB, 3 条)

**字段** (2): `SeasonID, ActivityID`

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

### ItemAutoTransfer.json (0.00 MB, 1 条)

**字段** (2): `ItemID, TransferList`

**首条记录摘要**:
```json
{
  "ItemID": 237,
  "TransferList": "[{\"CMNOEFFFNPE\": 236, \"JJFIGIJBIJI\": 1, ..."
}
```

### IdleLiveAvatarRarity.json (0.00 MB, 6 条)

**字段** (1): `Rarity`

**首条记录摘要**:
```json
{
  "Rarity": 1
}
```

### PerformanceBackupLock.json (0.00 MB, 1 条)

**字段** (4): `PerformanceType, PerformanceID, BackupPerformanceType, BackupPerformanceID`

**首条记录摘要**:
```json
{
  "PerformanceType": "D",
  "PerformanceID": 103410821,
  "BackupPerformanceType": "D",
  "BackupPerformanceID": 103410820
}
```

### IdleLiveQuestionTeam.json (0.00 MB, 2 条)

**字段** (2): `ID, TeamRecommendIDList`

**首条记录摘要**:
```json
{
  "ID": 602,
  "TeamRecommendIDList": [
    7
  ]
}
```

### AvatarExpItemConfig.json (0.00 MB, 3 条)

**字段** (2): `ItemID, Exp`

**首条记录摘要**:
```json
{
  "ItemID": 211,
  "Exp": 1000
}
```

### GridFightModuleSubTrait.json (0.00 MB, 2 条)

**字段** (3): `TraitID, ModuleID, SubTraitID`

**首条记录摘要**:
```json
{
  "TraitID": 1013,
  "ModuleID": 7110501,
  "SubTraitID": 10132
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

### PlayerReturnInvite.json (0.00 MB, 1 条)

**字段** (4): `ID, ActivityModuleID, APILabel, DisplayRewardItems`

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

### ChooseDelivery.json (0.00 MB, 1 条)

**字段** (4): `ID, ActivityModuleID, UnlockID, RewardGroupList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 5011801,
  "UnlockID": 109028,
  "RewardGroupList": [
    1,
    2
  ]
}
```

### ItemGotoData.json (0.00 MB, 3 条)

**字段** (2): `ID, GotoID`

**首条记录摘要**:
```json
{
  "ID": 281,
  "GotoID": 617
}
```

### RogueUpgradeAvatarSubType.json (0.00 MB, 2 条)

**字段** (2): `AvatarID, SubRelicType`

**首条记录摘要**:
```json
{
  "AvatarID": 1403,
  "SubRelicType": "LowSpeed"
}
```

### MultiFloorConflictGroup.json (0.00 MB, 1 条)

**字段** (3): `GroupID, PlaneID, FloorIDList`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "PlaneID": 10000,
  "FloorIDList": [
    10000000,
    10000002,
    10000003
  ]
}
```

### IdleLiveSpineCLTrigger.json (0.00 MB, 2 条)

**字段** (2): `TriggerID, TriggerType`

**首条记录摘要**:
```json
{
  "TriggerID": 3,
  "TriggerType": "BattleFail"
}
```

### ILBattleAvatarGender.json (0.00 MB, 2 条)

**字段** (2): `BoyAvatarID, GirlAvatarID`

**首条记录摘要**:
```json
{
  "BoyAvatarID": 8001,
  "GirlAvatarID": 8002
}
```

### GridFightModuleBanPortal.json (0.00 MB, 2 条)

**字段** (2): `BanPortalId, ModuleId`

**首条记录摘要**:
```json
{
  "BanPortalId": 1202,
  "ModuleId": 7110501
}
```

### SubNavMapName.json (0.00 MB, 1 条)

**字段** (3): `FloorID, SubMapID, Name`

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

### BookDisplayType.json (0.00 MB, 2 条)

**字段** (2): `BookDisplayTypeID, Alignment`

**首条记录摘要**:
```json
{
  "BookDisplayTypeID": 1,
  "Alignment": 1
}
```

### ChimeraMotion.json (0.00 MB, 2 条)

**字段** (2): `MotionID, MotionKey`

**首条记录摘要**:
```json
{
  "MotionID": 1,
  "MotionKey": "WaterHit"
}
```

### BenefitV2ConstClient.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ActivityBenefitV2_PreReward",
  "Value": {
    "IntValue": 6077001
  }
}
```

### ShopGoodsPackConfig.json (0.00 MB, 1 条)

**字段** (4): `ID, BundleGoodsID, ComboGoodsID1, ComboGoodsID2`

**首条记录摘要**:
```json
{
  "ID": 1,
  "BundleGoodsID": 107007,
  "ComboGoodsID1": 107008,
  "ComboGoodsID2": 107009
}
```

### GridFightModuleBanRole.json (0.00 MB, 2 条)

**字段** (2): `RoleId, ModuleId`

**首条记录摘要**:
```json
{
  "RoleId": 1509,
  "ModuleId": 7110501
}
```

### ConstValueFantasticCommon.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_StageClear_Score",
  "Value": {
    "IntValue": 10000
  }
}
```

### ScheduleDataDropLimit.json (0.00 MB, 1 条)

**字段** (3): `ID, BeginTime, EndTime`

**首条记录摘要**:
```json
{
  "ID": 800001,
  "BeginTime": "2022-03-23 00:00:00",
  "EndTime": "2022-03-23 23:59:59"
}
```

### BattleCollegeConstantValue.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "BattleCollege_UnlockID",
  "Value": {
    "IntValue": 9902
  }
}
```

### IdleLiveSpecialRoomIcon.json (0.00 MB, 1 条)

**字段** (2): `ID, IconPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "IconPath": "SpriteOutput/AvatarRoundIcon/WebIcon/Web..."
}
```

### MuseumTutorialTalk.json (0.00 MB, 1 条)

**字段** (2): `TriggerMissionID, TriggerCustomString`

**首条记录摘要**:
```json
{
  "TriggerMissionID": 8001265,
  "TriggerCustomString": "MuseumTutorial_8001265"
}
```

### RogueImmerseLevel.json (0.00 MB, 2 条)

**字段** (2): `Level, UnlockID`

**首条记录摘要**:
```json
{
  "Level": 1,
  "UnlockID": 12001
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

### MarblePreMatchChat.json (0.00 MB, 1 条)

**字段** (3): `SealID, MatchID, TalkIDList`

**首条记录摘要**:
```json
{
  "SealID": 111,
  "MatchID": 10,
  "TalkIDList": [
    401
  ]
}
```

### TalkVerificationDistance.json (0.00 MB, 2 条)

**字段** (2): `ID, Distance`

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

### ActivityDiceHint.json (0.00 MB, 1 条)

**字段** (2): `ID, Content`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Content": {
    "Hash": 699110669517638831
  }
}
```

### DailyMissionCount.json (0.00 MB, 1 条)

**字段** (3): `ID, DailyMissionType, DailyCount`

**首条记录摘要**:
```json
{
  "ID": 1,
  "DailyMissionType": 1,
  "DailyCount": 1
}
```

### ShopGiftConfig.json (0.00 MB, 1 条)

**字段** (3): `GiftID, ShopID, GiftSortID`

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

### MissionVersionConst.json (0.00 MB, 1 条)

**字段** (2): `ID, VersionFinalMainMissionID`

**首条记录摘要**:
```json
{
  "ID": 440,
  "VersionFinalMainMissionID": 1054417
}
```

### AutoFightVO.json (0.00 MB, 1 条)

**字段** (3): `Mode, ReceiveBuff, LightHit`

**首条记录摘要**:
```json
{
  "Mode": 1,
  "ReceiveBuff": 1,
  "LightHit": 1
}
```

### ActivityModulePunkLord.json (0.00 MB, 1 条)

**字段** (2): `ID, ActivityModuleID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 3000201
}
```

### IdleLiveQuestionRoomIcon.json (0.00 MB, 1 条)

**字段** (2): `ID, SpecialRoomIconID`

**首条记录摘要**:
```json
{
  "ID": 1602,
  "SpecialRoomIconID": 1
}
```

### RndOptionGroup.json (0.00 MB, 1 条)

**字段** (2): `ID, OptionCount`

**首条记录摘要**:
```json
{
  "ID": "Pam",
  "OptionCount": 1
}
```

### IdleLiveQuestionSpEquip.json (0.00 MB, 1 条)

**字段** (2): `ID, SpEquipID`

**首条记录摘要**:
```json
{
  "ID": 702,
  "SpEquipID": 701
}
```

### ActivityRaidSpecialOrder.json (0.00 MB, 0 条)

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

### AvatarTeamBuff.json (0.00 MB, 0 条)

### AvatarTestConfig.json (0.00 MB, 0 条)

### AvatarTestPropertyOverride.json (0.00 MB, 0 条)

### AvatarTestRankConfig.json (0.00 MB, 0 条)

### ChallengePeakRewardOR.json (0.00 MB, 0 条)

### ChenLingFesLevelAbility.json (0.00 MB, 0 条)

### ClockParkTalent.json (0.00 MB, 0 条)

### ConstValueClientTest.json (0.00 MB, 0 条)

### ConstValueCommonTest.json (0.00 MB, 0 条)

### EnergyBarConfig.json (0.00 MB, 0 条)

### ENpcA07.json (0.00 MB, 0 条)

### FinishTypeConfigLD.json (0.00 MB, 0 条)

### FreeStyleCharacterInfoLD.json (0.00 MB, 0 条)

### GiftDanmuContent.json (0.00 MB, 0 条)

### GMAccountConfig.json (0.00 MB, 0 条)

### GMAccountEquipmentConfig.json (0.00 MB, 0 条)

### GMAccountItemConfig.json (0.00 MB, 0 条)

### GMAccountRelicConfig.json (0.00 MB, 0 条)

### GridFightAugmentExpired.json (0.00 MB, 0 条)

### GridFightAvatarRankConfig.json (0.00 MB, 0 条)

### GridFightBackRank.json (0.00 MB, 0 条)

### GridFightBasicBonus.json (0.00 MB, 0 条)

### GridFightConstValueCommon.json (0.00 MB, 0 条)

### GridFightCoreRoleInfo.json (0.00 MB, 0 条)

### GridFightLotteryShop.json (0.00 MB, 0 条)

### GridFightModuleSwitchTrait.json (0.00 MB, 0 条)

### GridFightModuleTraitSwitch.json (0.00 MB, 0 条)

### GridFightPortalExpired.json (0.00 MB, 0 条)

### GridFightPray.json (0.00 MB, 0 条)

### GridFightRandomBonusPool.json (0.00 MB, 0 条)

### IdleLiveDisplayImage.json (0.00 MB, 0 条)

### IdleLiveQuestEquip.json (0.00 MB, 0 条)

### IdleLiveSpineUnlock.json (0.00 MB, 0 条)

### IdleLiveSuperChat.json (0.00 MB, 0 条)

### ItemUseCondition.json (0.00 MB, 0 条)

### LoopCGConfigLD.json (0.00 MB, 0 条)

### MainMissionPackLD.json (0.00 MB, 0 条)

### MainMissionScheduleLD.json (0.00 MB, 0 条)

### MatchThreeBasic.json (0.00 MB, 0 条)

### MazeSkillTest.json (0.00 MB, 0 条)

### MechanismBarConfig.json (0.00 MB, 0 条)

### MechanismBarEffectConfig.json (0.00 MB, 0 条)

### MessageContactsConfigLD.json (0.00 MB, 0 条)

### MessageGroupConfigLD.json (0.00 MB, 0 条)

### MessageSectionConfigLD.json (0.00 MB, 0 条)

### MissionChapterConfigLD.json (0.00 MB, 0 条)

### MonopolyGuessConfig.json (0.00 MB, 0 条)

### MonopolyGuessPlayerConfig.json (0.00 MB, 0 条)

### MonopolyReportStats.json (0.00 MB, 0 条)

### MonsterDropTest.json (0.00 MB, 0 条)

### MonsterTemplateTestConfig.json (0.00 MB, 0 条)

### MusicRhythmConstValueClient.json (0.00 MB, 0 条)

### NPCDataLD.json (0.00 MB, 0 条)

### PerformanceCLD.json (0.00 MB, 0 条)

### PerformanceDLD.json (0.00 MB, 0 条)

### PerformanceDSLD.json (0.00 MB, 0 条)

### PerformanceVideoLD.json (0.00 MB, 0 条)

### PixAirLockActionConfig.json (0.00 MB, 0 条)

### PixAirTalentConfig.json (0.00 MB, 0 条)

### PlanetFesUseItem.json (0.00 MB, 0 条)

### QuestLimitConstValueCommon.json (0.00 MB, 0 条)

### RogueMagicMiracleDisplay.json (0.00 MB, 0 条)

### RogueMiracleDisplayTest.json (0.00 MB, 0 条)

### RogueMiracleEffectTest.json (0.00 MB, 0 条)

### RogueTournMiracleGroupTest.json (0.00 MB, 0 条)

### RogueTournMiracleTest.json (0.00 MB, 0 条)

### StateBroadcastPermission.json (0.00 MB, 0 条)

### StoryCharacterLD.json (0.00 MB, 0 条)

### StoryPropLD.json (0.00 MB, 0 条)

### TagInfo.json (0.00 MB, 0 条)

### TextJoinConditionalItem.json (0.00 MB, 0 条)

### VideoConfigLD.json (0.00 MB, 0 条)
