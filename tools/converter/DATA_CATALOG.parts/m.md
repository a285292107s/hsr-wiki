# DATA_CATALOG 分片：文件名首字母 M

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 m（共 247 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### MonsterConfig.json (4.10 MB, 2,722 条)

**字段** (26): `AbilityNameList, AttackModifyRatio, CustomValueTags, CustomValues, DamageTypeResistance, DebuffResist, DefenceModifyRatio, DynamicValues, EliteGroup, HPModifyRatio, HardLevelGroup, MonsterID, MonsterIntroduction, MonsterName, MonsterStrategy, MonsterTemplateID, OverrideAIPath, OverrideAISkillSequence, OverrideSkillParams, SkillList, SpeedModifyRatio, SpeedModifyValue, StanceModifyRatio, StanceModifyValue, StanceWeakList, SummonIDList`

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
  "DamageTypeResistance": "<list[5]>",
  "DebuffResist": "<list[1]>",
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

### MessageItemConfig.json (3.10 MB, 13,779 条)

**字段** (9): `ContactsID, ID, ItemContentID, ItemType, MainText, NextItemIDList, OptionText, SectionID, Sender`

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

### MonsterSkillConfig.json (2.48 MB, 3,566 条)

**字段** (19): `AI_CD, AI_ICD, AttackType, DamageType, DelayRatio, ExtraEffectIDList, IconPath, IsThreat, ModifierList, ParamList, PhaseList, SPHitBase, SkillDesc, SkillID, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, SortOrder`

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

### MazeBuff.json (1.40 MB, 2,019 条)

**字段** (20): `BuffDesc, BuffDescBattle, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, DisplayType, ID, InBattleBindingKey, InBattleBindingType, IsDisplayEnvInLevel, Lv, LvMax, MazeBuffIconType, MazeBuffPool, MazeBuffType, ModifierName, ParamList`

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

### MainMission.json (1.06 MB, 2,184 条)

**字段** (21): `BeginOperation, BeginParam, ChapterID, DisplayPriority, DisplayRewardID, IsInRaid, MainMissionID, MissionAdvance, MissionPack, MissionStoryEvent, Name, NextMainMissionList, NextTrackMainMission, RewardID, SubRewardList, SubType, TakeOperation, TakeParam, TrackWeight, Type, WorldID`

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

### MazeProp.json (1.05 MB, 1,841 条)

**字段** (15): `BoardShowList, ConfigEntityPath, DamageTypeList, HasRendererComponent, ID, IsMapContent, JsonPath, LodPriority, MiniMapIconType, MiniMapStateIcons, PerformanceType, PropIconPath, PropName, PropStateList, PropType`

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
  "PropStateList": "<list[5]>",
  "PerformanceType": "D"
}
```

### MonsterDrop.json (0.90 MB, 4,438 条)

**字段** (4): `AvatarExpReward, DisplayItemList, MonsterTemplateID, WorldLevel`

**首条记录摘要**:
```json
{
  "MonsterTemplateID": 1002011,
  "AvatarExpReward": 36,
  "DisplayItemList": "<list[3]>"
}
```

### MonsterTemplateConfig.json (0.90 MB, 632 条)

**字段** (32): `AIPath, AISkillSequence, AtlasSortID, AttackBase, CriticalDamageBase, DefenceBase, HPBase, IconPath, ImagePath, InitialDelayRatio, JsonConfig, ManikinConfigPath, ManikinImagePath, ManikinPrefabPath, MinimumFatigueRatio, MonsterCampID, MonsterName, MonsterStrategy, MonsterTemplateID, NPCMonsterList, NatureID, PrefabPath, Rank, RoundIconPath, SpeedBase, SpeedModifyValue, StanceBase, StanceCount, StanceModifyValue, StanceType, StatusResistanceBase, TemplateGroupID`

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

### MazeFloor.json (0.65 MB, 695 条)

**字段** (18): `BGMWorldState, BaseFloorID, CombatBGMHigh, CombatBGMLow, EnterAudioEvent, ExitAudioEvent, FloorBGMBusyStateName, FloorBGMGroupName, FloorBGMNormalStateName, FloorDefaultEmotion, FloorID, FloorName, FloorTag, FloorType, MapLayerNameList, MunicipalConfigPath, OptionalLoadBlocksConfig, WalkingEffectAdditiveScale`

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
  "MapLayerNameList": "<list[3]>",
  "CombatBGMLow": "State_Spacetrain_Combat",
  "CombatBGMHigh": "State_Spacetrain_Combat"
}
```

### MappingInfo.json (0.57 MB, 1,722 条)

**字段** (9): `Desc, DisplayItemList, FarmType, ID, IsShowInFog, Name, ShowMonsterList, Type, WorldLevel`

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
  "DisplayItemList": "<list[10]>"
}
```

### MazeChest.json (0.34 MB, 2,101 条)

**字段** (3): `ChestType, ID, WorldID`

**首条记录摘要**:
```json
{
  "ID": 10101601,
  "WorldID": 201,
  "ChestType": "<list[3]>"
}
```

### MonsterStatusConfig.json (0.33 MB, 706 条)

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

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

### MonopolyEventOption.json (0.20 MB, 608 条)

**字段** (10): `DiceScoreRequirement, EffectContentText, EffectIDList, EventOptionID, IsHideEffect, NextOptionList, OptionBubbleTalk, OptionContent, OptionType, TextDisplayParam1`

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

### MapEntrance.json (0.19 MB, 923 条)

**字段** (9): `BeginMainMissionList, EntranceType, FinishMainMissionList, FinishSubMissionList, FloorID, ID, PlaneID, StartAnchorID, StartGroupID`

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

### MazePuzzleOrigami.json (0.15 MB, 630 条)

**字段** (11): `ColonyID, CreateNpcPropState, FloorID, GroupID, MainPropID, MainPropStateList, MirrorGroupID, MirrorMainPropID, NpcGroupID, NpcInstanceID, SubPropID`

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

### MiniMapIcon.json (0.13 MB, 422 条)

**字段** (17): `BillboardIcon, CircleRange, ConnectID, FiveDimBillboardIDList, ID, IconName, IconOrientetionSwitch, IconPath, IsCrossLayer, IsFollowMapScale, IsFollowPropScale, IsShowCornerArrow, IsShowInBillboard, MissionIconPath, ModelIcon, Priority, isShowinMap`

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

### MazePlane.json (0.09 MB, 376 条)

**字段** (8): `FloorIDList, MazePoolType, PlaneID, PlaneName, PlaneType, StartFloorID, SubType, WorldID`

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

### MessageGroupConfig.json (0.08 MB, 774 条)

**字段** (4): `ActivityModuleID, ID, MessageContactsID, MessageSectionIDList`

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

**字段** (6): `ID, Mode, PR, Round, TemplatePath, Type`

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

### MessageContactsConfig.json (0.07 MB, 306 条)

**字段** (6): `ContactsCamp, ContactsType, ID, IconPath, Name, SignatureText`

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

### MessageSectionConfig.json (0.07 MB, 786 条)

**字段** (4): `ID, IsPerformMessage, MainMissionLink, StartMessageItemIDList`

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

### MonsterSkillUniqueConfig.json (0.07 MB, 103 条)

**字段** (18): `AI_CD, AI_ICD, AttackType, DamageType, DelayRatio, ExtraEffectIDList, IconPath, IsThreat, ModifierList, ParamList, PhaseList, SPHitBase, SkillDesc, SkillID, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc`

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
  "ParamList": "<list[4]>",
  "ModifierList": [],
  "ExtraEffectIDList": []
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

### MazeSkill.json (0.05 MB, 208 条)

**字段** (7): `MPCost, MazeSkillDesc, MazeSkillId, MazeSkillName, MazeSkilltype, RelatedAvatarSkill, SkillTriggerKey`

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

### MonopolyEventConfig.json (0.05 MB, 201 条)

**字段** (10): `AutoTriggerEffectIDList, DiceNum, EventContent, EventID, EventName, EventOptionIDList, IsDataReport, IsSpecial, PicPath, Type`

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

### MatchThreeScoreCurve.json (0.04 MB, 444 条)

**字段** (6): `AddCurveRatio, AddHigh, AddLow, CurveID, DelayTime, PlayerStep`

**首条记录摘要**:
```json
{
  "CurveID": 1111,
  "PlayerStep": 1,
  "DelayTime": 1,
  "AddCurveRatio": 3
}
```

### MissionChapterConfig.json (0.04 MB, 79 条)

**字段** (12): `ChapterDesc, ChapterDisplayPriority, ChapterFigureIconPath, ChapterIconPath, ChapterName, ChapterSequence, ChapterType, FinalMainMission, ID, LinkChapterList, OriginMainMission, StageName`

**首条记录摘要**:
```json
{
  "ID": 999001,
  "ChapterType": "Normal",
  "LinkChapterList": [],
  "ChapterDisplayPriority": 100,
  "ChapterIconPath": "SpriteOutput/Mission/ChapterIcon/Chapter...",
  "ChapterFigureIconPath": "SpriteOutput/Mission/ChapterIconBig/Chap..."
}
```

### MonsterTemplateUniqueConfig.json (0.04 MB, 29 条)

**字段** (24): `AIPath, AISkillSequence, AttackBase, HPBase, IconPath, ImagePath, InitialDelayRatio, JsonConfig, ManikinConfigPath, ManikinImagePath, ManikinPrefabPath, MinimumFatigueRatio, MonsterName, MonsterStrategy, MonsterTemplateID, NPCMonsterList, NatureID, PrefabPath, Rank, RoundIconPath, SpeedBase, StanceBase, StanceCount, StanceType`

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
  "AISkillSequence": "<list[4]>",
  "NatureID": 1,
  "MinimumFatigueRatio": {
    "Value": 0.2
  }
}
```

### MainMissionSchedule.json (0.04 MB, 462 条)

**字段** (5): `ActivityModuleID, HideRemainTime, IsNotDelete, MainMissionID, ScheduleDataID`

**首条记录摘要**:
```json
{
  "MainMissionID": 8000101,
  "ActivityModuleID": 3000201
}
```

### MonsterUniqueConfig.json (0.04 MB, 35 条)

**字段** (26): `AbilityNameList, AttackModifyRatio, CustomValueTags, CustomValues, DamageTypeResistance, DebuffResist, DefenceModifyRatio, DynamicValues, EliteGroup, HPModifyRatio, HardLevelGroup, MonsterID, MonsterIntroduction, MonsterName, MonsterStrategy, MonsterTemplateID, OverrideAIPath, OverrideAISkillSequence, OverrideSkillParams, SkillList, SpeedModifyRatio, SpeedModifyValue, StanceModifyRatio, StanceModifyValue, StanceWeakList, SummonIDList`

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
  "StanceWeakList": "<list[7]>",
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

### MechCraftBanCellScheme.json (0.03 MB, 115 条)

**字段** (5): `DIIINDCGMBE, EMCCLPLCOKG, GMFGFLLHPJJ, NJMFEDCACPC, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 100011,
  "NJMFEDCACPC": 5,
  "GMFGFLLHPJJ": 5,
  "EMCCLPLCOKG": "MFJEGBIOEJG",
  "DIIINDCGMBE": [
    {
      "GAOAMKBNDPN": 2,
      "EBJKJAGJGPK": 2
    }
  ]
}
```

### MarbleRandomBuff.json (0.03 MB, 76 条)

**字段** (14): `ActivityID, ConditionList, Desc, EffectParam, EffectType, GameMode, ID, IconPath, IsRepeat, Name, ParamList, SetInactive, UnlockSubMission, Weight`

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

### MonsterGuideConfig.json (0.03 MB, 84 条)

**字段** (7): `Difficulty, DifficultyGuideList, DifficultyList, MonsterID, PhaseList, TagList, TextGuideList`

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

### MazePuzzleSwitchHand.json (0.03 MB, 32 条)

**字段** (11): `BanRocketPunch, ChestID, CoinPropID, ColliderPath, ControllerListID, FloorID, GroupIDList, IsRaid, PlaneID, SwitchHandID, SwitchID`

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
  "CoinPropID": "<list[3]>",
  "ColliderPath": "Stages/OriginalResPos/Chapter04/Prefab/C...",
  "ControllerListID": "<list[1]>",
  "ChestID": []
}
```

### MechCraftProductPartMat.json (0.03 MB, 126 条)

**字段** (4): `CADLBIKGCCP, EHLMAJICIGJ, OAPONHEHCOJ, OHILMAPCAHM`

**首条记录摘要**:
```json
{
  "CADLBIKGCCP": "AIDNPNEBLII",
  "OAPONHEHCOJ": "PHMKDHKBLDE",
  "OHILMAPCAHM": "<list[1]>"
}
```

### MuseumStats.json (0.03 MB, 210 条)

**字段** (6): `AreaID, FundCost, Level, PhaseLimit, StatsType, StatsValue`

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

### MarbleSeal.json (0.02 MB, 28 条)

**字段** (29): `ActionPriority, ActivityID, AiStrategyID, Attack, BuffIDList, CommonTalkIDList, Desc, EnemyIconPath, GameMode, Hp, ID, IconPath, IsShow, LevelUpPriority, Mass, MaxSpeed, Name, PrefabPath, Price, ShopTalkID, Size, SmallEnemyIconPath, SmallIconPath, UnlockBuySubMissionID, UnlockHint, UnlockShowSubMissionID, UnlockSubMissionID, VideoID, VoiceType`

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

### MechCraftChip.json (0.02 MB, 36 条)

**字段** (8): `FBFCPNADPKB, FODGHIDJAPP, GJBOKLDCKEG, KOGHELCCHJC, NFHLAIMKFPI, OENAMINOLLF, PHFMCACHFIJ, PMIEAEGJNMJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "OENAMINOLLF": {
    "Hash": 15781196652993065144
  },
  "PMIEAEGJNMJ": 1,
  "NFHLAIMKFPI": "01",
  "GJBOKLDCKEG": "<list[2]>",
  "KOGHELCCHJC": "<dict[5]>",
  "FBFCPNADPKB": "Gentle",
  "FODGHIDJAPP": []
}
```

### MazePuzzleOrigamiFD.json (0.02 MB, 102 条)

**字段** (8): `ColonyID, FDContainerID, FDEntityID, FDSGP, FDSGPValue, FloorID, GroupID, MainPropID`

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

### MazeFloorLD.json (0.02 MB, 22 条)

**字段** (18): `BGMWorldState, BaseFloorID, CombatBGMHigh, CombatBGMLow, EnterAudioEvent, ExitAudioEvent, FloorBGMBusyStateName, FloorBGMGroupName, FloorBGMNormalStateName, FloorDefaultEmotion, FloorID, FloorName, FloorTag, FloorType, MapLayerNameList, MunicipalConfigPath, OptionalLoadBlocksConfig, WalkingEffectAdditiveScale`

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
  "MapLayerNameList": "<list[3]>",
  "CombatBGMLow": "State_Penocony_Combat_P03_InDoor_Low",
  "CombatBGMHigh": "State_Penocony_Combat_P03_InDoor_High"
}
```

### MuseumComments.json (0.02 MB, 87 条)

**字段** (6): `AreaID, CommentContent, CommentID, CommentIconPath, CommentName, IsPositive`

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

### MatchThreeV2PVPScore.json (0.02 MB, 46 条)

**字段** (12): `ActivityID, Desc, FinishType, FixedScoreMap, GameModeList, Param, ParamMap, Rarity, ScoreID, Title, Title2, Type`

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
  "FixedScoreMap": "<dict[5]>"
}
```

### MazePuzzleDollyZoomTeleport.json (0.02 MB, 74 条)

**字段** (12): `DefaultComplete, FloorID, GroupID, ID, InstanceIDA, InstanceIDB, OverrideInitFOV, OverridePosA, OverridePosB, OverrideTargetPosA, OverrideTargetPosB, PuzzlePrefab`

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

### MonsterDropUnique.json (0.02 MB, 203 条)

**字段** (3): `DisplayItemList, MonsterTemplateID, WorldLevel`

**首条记录摘要**:
```json
{
  "MonsterTemplateID": 7001010,
  "DisplayItemList": []
}
```

### MatchThreeBird.json (0.02 MB, 30 条)

**字段** (15): `BirdDesc, BirdID, BirdName, DefaultEmo, DrawEmo, FaceMat, GuideID, IconPath, ImagePath, IsShow, LoseEmo, ModelPath, SkillID, UnlockLevel, WinEmo`

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

### MonsterGuideTag.json (0.02 MB, 68 条)

**字段** (6): `EffectID, ParameterList, SkillID, TagBriefDescription, TagID, TagName`

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

### MonopolyGoodsConfig.json (0.01 MB, 60 条)

**字段** (8): `Cost, Desc, GoodsID, GoodsType, IconPath, Name, TextDisplayParam1, TextDisplayParam2`

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

### MatchThreeOpponent.json (0.01 MB, 46 条)

**字段** (8): `AIConfig, AILevel, IconPath, ImagePath, Level, MapImagePath, Nickname, OpponentID`

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

### MechCraftReportCmt.json (0.01 MB, 58 条)

**字段** (6): `BEDKAABCNDD, BNLCCCCMABF, JMBJBDDMNLO, OENAMINOLLF, OOLEAPLDIEA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1010,
  "OOLEAPLDIEA": "SpriteOutput/Quest/Heliobus/HeliobusUser...",
  "OENAMINOLLF": {
    "Hash": 11935151975505196541
  },
  "JMBJBDDMNLO": {
    "Hash": 16713082211308352993
  }
}
```

### MarbleMatchPlayer.json (0.01 MB, 22 条)

**字段** (12): `Desc, HighNegativeEmojiList, HighPositiveEmojiList, ID, IconPath, ImagePath, LowNegativeEmojiList, LowPositiveEmojiList, Name, PlayerActionEmojiList, PrefabPath, SealGroupID`

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

### MonsterSkillTestConfig.json (0.01 MB, 1,881 条)

### MonopolyAssetConfig.json (0.01 MB, 48 条)

**字段** (8): `AssetDesc, AssetID, AssetName, BonusValue, FigurePath, Level, Price, TaxValue`

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

### MatchThreeSkill.json (0.01 MB, 28 条)

**字段** (8): `BirdSkillTrailEffectPath, Desc, DescFigure, SkillChargedImg, SkillID, SkillJson, SkillUnchangedImg, VideoID`

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

### MonsterTestConfig.json (0.01 MB, 1,612 条)

### MatchThreeV2BattleItem.json (0.01 MB, 24 条)

**字段** (15): `BattleItemID, InputGridCount, IsUnlock, ItemDesc, ItemEffectJson, ItemHint, ItemIcon, ItemLevel, ItemLevelUpDesc, ItemName, ItemUseCount, ItemUseFailHint, LevelUpCost, Order, PropType`

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

### MarbleSkill.json (0.01 MB, 53 条)

**字段** (8): `GroupID, ID, IconPath, Level, SkillDesc, SkillHintType, SkillName, SkillParamList`

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

### MonsterAtlasExtraPhases.json (0.01 MB, 12 条)

**字段** (10): `CustomValueTags, DamageTypeResistance, DebuffResist, ManikinConfigPath, ManikinPrefabPath, MonsterIntroduction, MonsterName, PhaseID, StanceWeakList, TemplateGroupID`

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
  "DebuffResist": "<list[1]>",
  "DamageTypeResistance": "<list[4]>",
  "CustomValueTags": [],
  "ManikinPrefabPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M..."
}
```

### MazeFloorUnlock.json (0.01 MB, 100 条)

**字段** (2): `FloorID, UnlockConditionExpression`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "UnlockConditionExpression": "[RealFinishMainMission:1000501]|[RealFin..."
}
```

### MazePuzzle.json (0.01 MB, 62 条)

**字段** (9): `IsResetable, IsShowToast, IsShowWaypoint, IsTopPriority, MazePuzzleID, NormalModeID, ProgressList, SpecialModeID, TutorialID`

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

### MatchThreeLevel.json (0.01 MB, 24 条)

**字段** (20): `EnvironmentID, GoMissionCondition, HPmax, LevelDescription, LevelID, LevelImage, LevelMission, LevelName, LoseDesc, MissionDescription, Mode, OpponentBirdID, OpponentID, PlayerBirdID, PlayerID, RewardID, TurnStep, UnlockID, VSTalkList, VictoryDesc`

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

### MonsterGuideSkill.json (0.01 MB, 57 条)

**字段** (5): `Difficulty, SkillID, SkillName, SkillTextIDList, Type`

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

### MonsterGuideSkillText.json (0.01 MB, 57 条)

**字段** (5): `Difficulty, EffectIDList, ParameterList, SkillDescription, SkillTextID`

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

### ModelIconConfig.json (0.01 MB, 73 条)

**字段** (2): `ID, PrefabPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PrefabPath": "Stages/OriginalResPos/Chapter03/Prefab/3..."
}
```

### MaterialSubmitterReply.json (0.01 MB, 42 条)

**字段** (5): `Content, HeadIconPath, ID, PersonName, Tag`

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

### MechCraftOrder.json (0.01 MB, 22 条)

**字段** (12): `AAGKEBFHLMC, ANCJFPFEGHA, BLAJKCJIAPH, CLGNIABAHII, GGBPEGPAGNJ, JKKJNOPADBO, KHIJNANHBFB, KHPNJPFNHKN, LNPNCKGNKID, MEPGCJIPDON, NMAHGFAPENI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 10001,
  "KHIJNANHBFB": 2000,
  "CLGNIABAHII": 10001,
  "GGBPEGPAGNJ": 100,
  "ANCJFPFEGHA": 100,
  "MEPGCJIPDON": [],
  "JKKJNOPADBO": [],
  "BLAJKCJIAPH": 6001,
  "AAGKEBFHLMC": 1,
  "NMAHGFAPENI": {
    "Hash": 828202433390053834
  },
  "LNPNCKGNKID": {
    "Hash": 2298204487359582162
  },
  "KHPNJPFNHKN": {
    "Hash": 4777937433354781248
  }
}
```

### MultiplePathAvatarAtlas.json (0.01 MB, 12 条)

**字段** (3): `AvatarID, StoryIDList, VoiceIDList`

**首条记录摘要**:
```json
{
  "AvatarID": 8001,
  "VoiceIDList": "<list[59]>",
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

### MazePuzzleOrigamiColony.json (0.01 MB, 43 条)

**字段** (6): `FinishQuestID, FloorID, MaterialCost, MirrorFloorID, OrigamiColonyID, TalkSentenceID`

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

### MessageItemImage.json (0.01 MB, 71 条)

**字段** (3): `FemaleImagePath, ID, ImagePath`

**首条记录摘要**:
```json
{
  "ID": 10001,
  "ImagePath": "SpriteOutput/PhoneMessagePic/PhoneMessag...",
  "FemaleImagePath": ""
}
```

### MonsterGuidePhase.json (0.01 MB, 29 条)

**字段** (7): `Difficulty, PhaseAnswer, PhaseDescription, PhaseID, PhaseName, PhasePic, SkillList`

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

### MatchThreeV2Level.json (0.01 MB, 15 条)

**字段** (19): `EnvironmentIDList, FirstType, LevelID, LevelImage, LoseDesc, MaxRatioPowerDiff, OpponentBattleItemMap, OpponentBirdID, OpponentID, PlayerBirdID, PlayerID, PreLevel, PreSubmission, RecommendBattleItemList, RecommendBirdList, SpecialRuleIDList, TurnStep, VSTalk, VictoryDesc`

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

### MatchThreeV2AvatarCutin.json (0.01 MB, 44 条)

**字段** (4): `CutinID, ImagePath, MaxTriggerNum, TalkText`

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

### MonsterAtlasExtraPhase.json (0.01 MB, 9 条)

**字段** (9): `DamageTypeResistance, DebuffResist, ManikinConfigPath, ManikinPrefabPath, MonsterIntroduction, MonsterName, PhaseID, StanceWeakList, TemplateGroupID`

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
  "DebuffResist": "<list[1]>",
  "DamageTypeResistance": "<list[4]>",
  "ManikinPrefabPath": "Characters/CharacterPrefabs/Manikin/Mons...",
  "ManikinConfigPath": "Config/ConfigCharacter/Manikin/Monster/M..."
}
```

### MuseumRandomEventConfig.json (0.01 MB, 35 条)

**字段** (6): `Event, EventTitle, EventType, EventTypeParameter, RandomEventID, TriggerTypeParameter`

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

**字段** (10): `Description, MovieLevel, MovieMode, QuestList, Title, TriggerCustomString, Tutorial, UnlockCondition, UnlockConditionMode, UnlockSubmission`

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

### MainMissionPack.json (0.01 MB, 81 条)

**字段** (2): `MainMissionIdList, MissionPack`

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

### MaterialSubmitter.json (0.01 MB, 28 条)

**字段** (6): `ActivityModuleID, ID, MaterialList, MissionID, ParamList, RewardID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActivityModuleID": 3000501,
  "ParamList": [],
  "MaterialList": "<list[3]>",
  "MissionID": 8000170,
  "RewardID": 3100301
}
```

### MazePuzzleGravityBall.json (0.01 MB, 49 条)

**字段** (4): `DestructablePropList, HiddenStoryCode, PuzzleID, WallPrefab`

**首条记录摘要**:
```json
{
  "PuzzleID": 1,
  "WallPrefab": "Props/DesignerBackup/GravityBall/Gravity...",
  "DestructablePropList": [],
  "HiddenStoryCode": ""
}
```

### MechCraftRequirement.json (0.01 MB, 27 条)

**字段** (7): `ADEJDFIJOKF, BFANELAELAK, ENGGEFINDPH, IBNALLEGIFH, KEDCLDIKAGC, PCEHNLCLKGH, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 10001,
  "ENGGEFINDPH": [
    100011,
    100012,
    100013,
    100014,
    100015
  ],
  "IBNALLEGIFH": {
    "AIDNPNEBLII": 1
  },
  "KEDCLDIKAGC": [],
  "PCEHNLCLKGH": []
}
```

### MonsterDifficultyGuide.json (0.01 MB, 51 条)

**字段** (4): `DifficultyGuideDescription, DifficultyGuideID, ParameterList, SkillID`

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

### MapShortCutConfig.json (0.01 MB, 29 条)

**字段** (8): `EntranceID, ID, IconPath, MappingInfoID, Name, Params, Type, UnlockID`

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

### MusicRhythmLevel.json (0.01 MB, 27 条)

**字段** (8): `Difficulty, EnterType, FeverComboCount, Group, ID, InputScore, StarRewardIDList, StarScoreList`

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

### MarbleSealLevel.json (0.01 MB, 56 条)

**字段** (5): `ID, Level, LevelUpDesc, SkillParamList, UnlockSkillID`

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

### MuseumItem.json (0.01 MB, 21 条)

**字段** (12): `AreaID, CollectedReward, DisplayOrder, EvidenceInfoTextID, HideGetHint, ItemID, ItemSkillList, MuseumItemDesc, RenewPoint, SceneGroupID, ScenePropID, UnlockPhase`

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

### MechCraftDiyEffectColor.json (0.01 MB, 6 条)

**字段** (14): `ACPJGPFJAOO, ADIIIAFGFJB, CADLBIKGCCP, DDLJDMFBDJA, EILBLKKAIDJ, FBKAMIHGLFK, FIPKFIOMAJI, IEJKJKDFGAG, JCNLGFPDCBL, JFNMGODGCAA, KCLDOCJPEPO, KGHMLPKFDNG, PHFMCACHFIJ, PNFOMBOEKJN`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBKAMIHGLFK": "SpriteOutput/Quest/MechCraft/DIY/MechCra...",
  "CADLBIKGCCP": "AIDNPNEBLII",
  "FIPKFIOMAJI": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "PNFOMBOEKJN": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "KGHMLPKFDNG": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "EILBLKKAIDJ": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "ACPJGPFJAOO": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "ADIIIAFGFJB": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "JCNLGFPDCBL": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "DDLJDMFBDJA": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "JFNMGODGCAA": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "IEJKJKDFGAG": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N...",
  "KCLDOCJPEPO": "Effects/Eff_Prefab/Eff_NPC/Special/Eff_N..."
}
```

### MuseumArea.json (0.01 MB, 42 条)

**字段** (8): `AreaID, FundCost, Level, PhaseLimit, RenewPoint, RequireStatsA, RequireStatsB, RequireStatsC`

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

### MuseumStuff.json (0.01 MB, 33 条)

**字段** (16): `CollectedReward, DisplayOrder, EvidenceInfoTextID, IsInitial, IsTargetReward, ItemID, MuseumStuffDesc, RecruitPrice, RecruitUnlockMission, SceneGroupID, ScenePropID, StatsA, StatsB, StatsC, Type, UnlockPhase`

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

### MazePuzzleSwitchMascot.json (0.01 MB, 4 条)

**字段** (11): `ChestID, CoinPropID, ColliderPath, ControllerBlackHoleID, EntryBlackHoleID, FloorID, PlaneID, Section1LoadEntityList, Section2LoadEntityList, Section3LoadEntityList, SwitchID`

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
  "Section1LoadEntityList": "<list[2]>",
  "Section2LoadEntityList": "<list[10]>",
  "Section3LoadEntityList": [
    {}
  ],
  "ColliderPath": "Stages/OriginalResPos/Chapter04/Prefab/C...",
  "CoinPropID": "<list[3]>",
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

### MusicRhythmGroup.json (0.01 MB, 9 条)

**字段** (19): `BGMpath, EntityGroup, EntityGroupMission, EntranceID, GotoID, GroupCoverImgPath, GroupDesc, GroupName, ID, Index, InputTimeList, LongInputTimeList, LongInputUpTimeList, MapInfoID, MapName, Phase, RewardTrackIDList, TakeMissionID, UnlockSubMissionID`

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

### MonopolyQuizPlayerConfig.json (0.01 MB, 47 条)

**字段** (3): `IconPath, Name, QuizPlayerID`

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

### MapDefaultEntrance.json (0.01 MB, 116 条)

**字段** (2): `EntranceID, FloorID`

**首条记录摘要**:
```json
{
  "FloorID": 10000000,
  "EntranceID": 1000001
}
```

### MechCraftActor.json (0.01 MB, 26 条)

**字段** (4): `HIKPBAFAIMF, HLDFOGCMOMM, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1004,
  "OENAMINOLLF": {
    "Hash": 8467426987336291189
  },
  "HIKPBAFAIMF": "SpriteOutput/AvatarRoundIcon/Avatar/1004...",
  "HLDFOGCMOMM": "SpriteOutput/AvatarCutinFigures/1004.png"
}
```

### MarblePVPRank.json (0.01 MB, 10 条)

**字段** (11): `BigIconPath, GameMode, ID, IconPath, LevelPool, LoseAIRank, Name, Rank, ScoreArea, SmallIconPath, TimeOutAIRank`

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
  "LevelPool": "<list[10]>",
  "SmallIconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "IconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "BigIconPath": "SpriteOutput/Quest/ActivityMarble/Player...",
  "TimeOutAIRank": 3,
  "LoseAIRank": 1
}
```

### MarbleMatchInfo.json (0.01 MB, 14 条)

**字段** (15): `AIRank, ANpcIds, BNpcIds, BanSealList, CanGoMatchSubMission, CustomID, FirstType, ID, LevelID, Name, PerformanceID, PhaseID, PlayerID, Reward, Round`

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

### MazeFloorConnectivity.json (0.01 MB, 49 条)

**字段** (5): `FromFloorID, LockAreaMapID, ToFloorID, WayPointEntityID, WayPointGroupID`

**首条记录摘要**:
```json
{
  "FromFloorID": 10000000,
  "ToFloorID": 10000002,
  "WayPointGroupID": 7,
  "WayPointEntityID": 300001
}
```

### MatchThreeV2StarTarget.json (0.01 MB, 30 条)

**字段** (5): `Desc, FinishParamList, FinishType, Reward, StarTargetID`

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

### MarbleMatchLevel.json (0.01 MB, 33 条)

**字段** (4): `ID, JsonConfigPath, TotalScore, TutorialGroupID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "JsonConfigPath": "Config/Gameplays/LittleGame/Marble/Level...",
  "TutorialGroupID": 9838,
  "TotalScore": 4
}
```

### MonsterTextGuide.json (0.01 MB, 42 条)

**字段** (3): `ParameterList, TextGuideDescription, TextGuideID`

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

### MazePuzzleWolfGunPlayLevel.json (0.00 MB, 17 条)

**字段** (9): `Description, GunLevel, GunMode, QuestList, ShowInUI, TargetScore, Title, TriggerCustomString, UnlockCondition`

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

### MatchThreeRobotDB.json (0.00 MB, 30 条)

**字段** (4): `HeadIcon, Level, Name, RobotID`

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

### MonopolyBuffConfig.json (0.00 MB, 29 条)

**字段** (8): `BuffDesc, BuffID, BuffName, Duration, EffectID, IconPath, IsPermanent, Rank`

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

### MarbleBuffCondition.json (0.00 MB, 45 条)

**字段** (5): `DrawType, DrawTypeParameter, ID, OperationType, ParamList`

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

**字段** (4): `Desc, ID, PlayerIDList, QuizID`

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

### MatchThreeV2PVPRank.json (0.00 MB, 10 条)

**字段** (8): `BigIconPath, GameModeList, IconPath, MaxScore, Name, Rank, RankID, SmallIconPath`

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

**字段** (4): `Condition, TipsDesc, TipsID, Weight`

**首条记录摘要**:
```json
{
  "TipsID": 1,
  "TipsDesc": {
    "Hash": 14927483021586036889
  },
  "Condition": "<list[1]>",
  "Weight": 100
}
```

### MapPropConditionConfig.json (0.00 MB, 18 条)

**字段** (7): `ActivityModuleID, ID, MappingInfoID, MiniMapIconID, Priority, UnloadConditions, UnlockConditions`

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

### MultiplePathAvatarConfig.json (0.00 MB, 12 条)

**字段** (9): `AllowRepeatUnlockReward, AvatarID, BaseAvatarID, ChangeConfigPath, Desc, Gender, IsEarlyUnlock, UnlockConditions, UnlockToast`

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

### MechCraftDiyMechatron.json (0.00 MB, 9 条)

**字段** (10): `CDDCLPHPKNC, DFKJCMCDMEI, GDBJDAOOCOH, GNHGAOHCDNK, IEFAOJFMIJB, KHIJNANHBFB, MGHLJNKMDJJ, OENAMINOLLF, PHFMCACHFIJ, PNEPAFOAEJD`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "GDBJDAOOCOH": 400001,
  "GNHGAOHCDNK": "SpriteOutput/Quest/MechCraft/Jikai/MechC...",
  "CDDCLPHPKNC": "Characters/NPC/Special/JiKai_00/Art_NPC_...",
  "OENAMINOLLF": {
    "Hash": 17778747008932339596
  },
  "IEFAOJFMIJB": [
    1,
    2,
    3,
    4,
    5,
    6
  ],
  "MGHLJNKMDJJ": [],
  "PNEPAFOAEJD": []
}
```

### MuseumDeskTalk.json (0.00 MB, 14 条)

**字段** (7): `CustomString, Priority, TalkID, TalkType, TalkTypeParameter, TextIDList, TriggerType`

**首条记录摘要**:
```json
{
  "TalkID": 101,
  "TriggerType": "EnterOpenDay",
  "TalkType": "EnterOpenDayDefault",
  "TalkTypeParameter": "",
  "TextIDList": "<list[4]>",
  "Priority": 100,
  "CustomString": "MuseumDeskTalk_101"
}
```

### MatchThreeVsTalk.json (0.00 MB, 42 条)

**字段** (3): `ID, MyTalk, OpponentTalk`

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

### MatchThreeEmoji.json (0.00 MB, 52 条)

**字段** (3): `CanPlayerUse, EmojiID, ImagePath`

**首条记录摘要**:
```json
{
  "EmojiID": 111,
  "ImagePath": "SpriteOutput/Emoji/30007.png"
}
```

### MonopolyReportResult.json (0.00 MB, 9 条)

**字段** (9): `Desc, DescDetail, FigurePrefabPath, ID, IconPath, MBTIValueX, MBTIValueY, Name, UnlockTips`

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

### MechCraftCondition.json (0.00 MB, 38 条)

**字段** (3): `GMPGDEINODK, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "GMPGDEINODK": "FBBPJEHGBKM",
  "PBLPLDJKPEI": [
    1
  ]
}
```

### MonopolyQuizTaskConfig.json (0.00 MB, 24 条)

**字段** (3): `PriorityPlayerIDList, QuizTaskID, TaskDesc`

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

### MazePuzzleWolfBro.json (0.00 MB, 17 条)

**字段** (7): `ControlGroupID, FloorID, GroupIDList, MonsterGroupIDList, PlaneID, StartState, WolfBroID`

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

### MechCraftProductPartMesh.json (0.00 MB, 21 条)

**字段** (3): `EHLMAJICIGJ, OAPONHEHCOJ, OJFFBFCEMKL`

**首条记录摘要**:
```json
{
  "OAPONHEHCOJ": "PHMKDHKBLDE",
  "OJFFBFCEMKL": "Config/Gameplays/MechCraft/JiKaiOutfitPa..."
}
```

### MarbleEmoji.json (0.00 MB, 41 条)

**字段** (3): `EmojiPath, GroupID, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 1,
  "EmojiPath": "SpriteOutput/Emoji/20001.png"
}
```

### MapEntranceLD.json (0.00 MB, 18 条)

**字段** (9): `BeginMainMissionList, EntranceType, FinishMainMissionList, FinishSubMissionList, FloorID, ID, PlaneID, StartAnchorID, StartGroupID`

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

### MatchThreeV2Challenger.json (0.00 MB, 10 条)

**字段** (7): `ChallengerDesc, ChallengerID, ChallengerImage, ChallengerTitle, LevelID, StarTargetList, UnlockBattleItem`

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

### MessageItemTextOverride.json (0.00 MB, 26 条)

**字段** (3): `Conditions, ItemID, MainText`

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

### MatchThreeEnvironment.json (0.00 MB, 11 条)

**字段** (6): `Desc, EnvironmentID, IconPath, ImagePath, Name, ParamList`

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

### MuseumItemSkillConfig.json (0.00 MB, 22 条)

**字段** (4): `ItemSkillID, SkillDesc, Type, TypeParameter`

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

### MarbleMatchTitle.json (0.00 MB, 13 条)

**字段** (10): `CompareValue, Condition, Desc, ID, Name, PVPScore, Param, Priority, Quality, ValueType`

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

### MonsterCamp.json (0.00 MB, 19 条)

**字段** (5): `CampType, ID, IconPath, Name, SortID`

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

### MonopolyGameResource.json (0.00 MB, 17 条)

**字段** (5): `IconOutlinePath, IconPath, ResourceID, ResourceNum, RuleIconPath`

**首条记录摘要**:
```json
{
  "ResourceID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon...",
  "RuleIconPath": "SpriteOutput/Quest/Monopoly/MonopolyIcon...",
  "IconOutlinePath": "SpriteOutput/Quest/Monopoly/MonopolyIcon..."
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

### MechCraftTalentPoint.json (0.00 MB, 13 条)

**字段** (6): `ABJGONAEFCB, FODGHIDJAPP, KDKPDJNMMCM, LJGHBEFPOPP, NMAHGFAPENI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1001,
  "FODGHIDJAPP": [
    11001
  ],
  "NMAHGFAPENI": {
    "Hash": 13564727423096997945
  },
  "ABJGONAEFCB": "SpriteOutput/Rogue/Skill/Mid/IconRogueMa..."
}
```

### MuseumTarget.json (0.00 MB, 17 条)

**字段** (7): `MuseumMissionList, Order, RewardType, TargetID, TriggerPhase, TriggerTurns, TypeParameter`

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

**字段** (16): `BGMMenuState, BGMStageState, GridNum, GridNumList, GridTransitionTime, ID, MixingWaveMatPath, PresetEndGrid, PresetIDList, PresetStartGrid, SongName, SoundEffectIDList, SoundEffectUnlockSubMission, TrackIDList, UnlockType, UnlockTypeParam`

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

### MultiplayMatchThreeItem.json (0.00 MB, 8 条)

**字段** (8): `BattleItemID, InputGridCount, ItemDesc, ItemHint, ItemIcon, ItemName, ItemUseFailHint, PropType`

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

### MainMissionType.json (0.00 MB, 6 条)

**字段** (15): `IconMapConnect, IconMapOptional, IconMapStarted, IconMapToTake, IsDelete, IsShowRedDot, MenuItemIcon, Type, TypeChapterColor, TypeColor, TypeIcon, TypeIconMini, TypeName, TypePriority, WaypointIconType`

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

### MazePropLD.json (0.00 MB, 6 条)

**字段** (14): `BoardShowList, ConfigEntityPath, DamageTypeList, HasRendererComponent, ID, IsMapContent, JsonPath, LodPriority, MiniMapIconType, MiniMapStateIcons, PerformanceType, PropIconPath, PropStateList, PropType`

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

**字段** (3): `Desc, Icon, SpecialRuleID`

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

### MazePlaneLD.json (0.00 MB, 11 条)

**字段** (8): `FloorIDList, MazePoolType, PlaneID, PlaneName, PlaneType, StartFloorID, SubType, WorldID`

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

### MechCraftExam.json (0.00 MB, 5 条)

**字段** (13): `CCNENAKAHJE, CLGNIABAHII, FGJFNACLHPB, IFHCECGLMHH, JNFHECCIGDG, KFNKBKPKNCC, KLNPCBJKDFI, KMLOGCDOMPG, LCFNABHMODA, NCIOIJHNLHD, OENAMINOLLF, OPGAGANBICN, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 9001,
  "CLGNIABAHII": 90001,
  "KMLOGCDOMPG": 6,
  "JNFHECCIGDG": 6,
  "FGJFNACLHPB": 9001,
  "NCIOIJHNLHD": 1305,
  "OENAMINOLLF": {
    "Hash": 9803829419766462767
  },
  "LCFNABHMODA": true,
  "KFNKBKPKNCC": {
    "Hash": 14373736439208647777
  },
  "IFHCECGLMHH": {
    "Hash": 14300091482058321924
  },
  "CCNENAKAHJE": 1,
  "OPGAGANBICN": 2001,
  "KLNPCBJKDFI": []
}
```

### MonsterTestStatusConfig.json (0.00 MB, 347 条)

### MarbleRoundCustomBuff.json (0.00 MB, 27 条)

**字段** (4): `BuffList, EnemySelectBuff, ID, Round`

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

### MusicRhythmTrack.json (0.00 MB, 12 条)

**字段** (5): `EmptyGridList, ID, IconPath, TrackName, UnlockSubMissionID`

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

### MappingInfoEntranceConfig.json (0.00 MB, 51 条)

**字段** (2): `EntranceID, ID`

**首条记录摘要**:
```json
{
  "ID": 2101,
  "EntranceID": 102020107
}
```

### MatchThreePiece.json (0.00 MB, 14 条)

**字段** (4): `ImagePath, PieceID, RowBombPath, SquareBombPath`

**首条记录摘要**:
```json
{
  "PieceID": 1,
  "ImagePath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi...",
  "RowBombPath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi...",
  "SquareBombPath": "SpriteOutput/Quest/MatchThree/Chess/Kiwi..."
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

### MatchThreeV2Reputation.json (0.00 MB, 5 条)

**字段** (8): `BgPath, ChallengerList, ImagePath, LevelUpDesc, LevelUpReward, Reputation, TabName, Title`

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

**字段** (5): `HighResistance, HighResistanceIcon, Icon, Resistance, Type`

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

### MonopolyCellMoveConfig.json (0.00 MB, 8 条)

**字段** (3): `CellID, MapID, MoveParam`

**首条记录摘要**:
```json
{
  "MapID": 3,
  "CellID": 9,
  "MoveParam": "<list[4]>"
}
```

### MatchThreePVPScore.json (0.00 MB, 7 条)

**字段** (10): `Desc, FinishType, FixedScore, Param1, Param2, Rarity, ScoreID, Title, Title2, Type`

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

**字段** (7): `MPCost, MazeSkillDesc, MazeSkillId, MazeSkillName, MazeSkilltype, RelatedAvatarSkill, SkillTriggerKey`

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

### MechCraftTalentPath.json (0.00 MB, 4 条)

**字段** (10): `CLCBJFKDMKH, EFEAGFOILKE, EIDBOMGAMGO, ELBPOILJNLF, GNNFCCGDJGD, LHPGDMNMDPI, MDHIHFOKECL, NMAHGFAPENI, NOKHLKDMJDD, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "EIDBOMGAMGO": [
    1001,
    1002,
    1003,
    1004
  ],
  "CLCBJFKDMKH": 804611421,
  "NMAHGFAPENI": {
    "Hash": 6950278597142747106
  },
  "GNNFCCGDJGD": {
    "Hash": 10859409461811357897
  },
  "ELBPOILJNLF": 1305,
  "NOKHLKDMJDD": {
    "Hash": 6858730940051496308
  },
  "EFEAGFOILKE": {
    "Hash": 4317850000309198021
  },
  "MDHIHFOKECL": {
    "Hash": 17541515545728290549
  },
  "LHPGDMNMDPI": {
    "Hash": 9233835238554743236
  }
}
```

### MechCraftEffect.json (0.00 MB, 17 条)

**字段** (3): `GMPGDEINODK, PBLPLDJKPEI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 11001,
  "GMPGDEINODK": "ExpandBoard",
  "PBLPLDJKPEI": [
    6,
    5
  ]
}
```

### MonopolyGameConfig.json (0.00 MB, 7 条)

**字段** (10): `BaseRaiseMaxValue, GameID, GameIcon, GameResourceIDList, GameType, IntroDesc, Name, ParamStr1, ParamStr2, RaiseCurveID`

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

### MonopolyDisplayCell.json (0.00 MB, 7 条)

**字段** (6): `CellDesc, CellName, DisplayID, DisplaySort, IconPath, Type`

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

### MonopolyCellResource.json (0.00 MB, 13 条)

**字段** (3): `IconPath, ResourceID, Type`

**首条记录摘要**:
```json
{
  "ResourceID": 1,
  "IconPath": "SpriteOutput/Quest/Monopoly/3DBlockIcon/...",
  "Type": "ChangeColor"
}
```

### MapSpaceTypeConfig.json (0.00 MB, 10 条)

**字段** (4): `Icon, MapSpaceType, Name, SortID`

**首条记录摘要**:
```json
{
  "Icon": "",
  "SortID": 1
}
```

### MonopolyQuizConfig.json (0.00 MB, 8 条)

**字段** (5): `Duration, QuizDesc, QuizID, QuizName, QuizTaskIDList`

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

### MechCraftReport.json (0.00 MB, 5 条)

**字段** (5): `AABNPBGMOFN, BEEMLBPEGKH, FBKAMIHGLFK, JONJKELPPAI, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBKAMIHGLFK": "SpriteOutput/Quest/MechCraft/ReportPic/M...",
  "AABNPBGMOFN": {
    "Hash": 17838278984945899069
  },
  "JONJKELPPAI": 1.6,
  "BEEMLBPEGKH": "<list[11]>"
}
```

### MuseumPhase.json (0.00 MB, 5 条)

**字段** (9): `MuseumPhaseID, PhaseFund, PhaseIconPath, PhaseName, PhaseQuestID, PhaseTextID, RenewPointCost, UnlockAreaID, UnlockMissionID`

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

### MusicRhythmSoundEffect.json (0.00 MB, 16 条)

**字段** (2): `ID, SoundEffectIconPath`

**首条记录摘要**:
```json
{
  "ID": 11,
  "SoundEffectIconPath": "SpriteOutput/Quest/MusicRhythm/MusicRhyt..."
}
```

### MonopolyClickContentConfig.json (0.00 MB, 40 条)

**字段** (2): `ClickNum, ID`

**首条记录摘要**:
```json
{
  "ID": 999,
  "ClickNum": 1
}
```

### MechCraftPlaceChipScheme.json (0.00 MB, 10 条)

**字段** (5): `BBFOLEOPPPL, KBDAHAAAIBO, LNKOLCOBLMO, PFDHNIJBGKO, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 9001,
  "LNKOLCOBLMO": 1,
  "PFDHNIJBGKO": 2101,
  "BBFOLEOPPPL": {
    "GAOAMKBNDPN": 2,
    "EBJKJAGJGPK": 2
  }
}
```

### MapEntranceGroup.json (0.00 MB, 13 条)

**字段** (4): `GroupName, ID, MapGuideID, Type`

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

**字段** (4): `DefaultCDDuration, IconPath, PuzzleFuncType, ShowFuncBtnHint`

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

### MuseumAreaConfig.json (0.00 MB, 4 条)

**字段** (6): `AreaID, AreaItemNoTextID, FirstWorldText, MuseumAreaHintIcon, MuseumAreaName, MuseumAreaTabIcon`

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

### MainStoryActView.json (0.00 MB, 6 条)

**字段** (6): `BannerPicPath, ChronicleChapterName, ID, IsCompletionOverride, Name, SortID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 12797381317990825304
  },
  "ChronicleChapterName": {
    "Hash": 17098130525213388215
  },
  "SortID": 9,
  "BannerPicPath": "SpriteOutput/DailyMission/Banner/MainSto..."
}
```

### MechCraftDiyMechInstance.json (0.00 MB, 18 条)

**字段** (3): `BGHKBBMOEKL, FPPNKOEPFIP, GDBJDAOOCOH`

**首条记录摘要**:
```json
{
  "FPPNKOEPFIP": 1002,
  "BGHKBBMOEKL": 1,
  "GDBJDAOOCOH": 400002
}
```

### MechCraftDiyPose.json (0.00 MB, 10 条)

**字段** (3): `FBKAMIHGLFK, OHKMNJCINAE, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBKAMIHGLFK": "SpriteOutput/Quest/MechCraft/DIY/MechCra...",
  "OHKMNJCINAE": 900450000
}
```

### MonopolyPlayerTalkConfig.json (0.00 MB, 13 条)

**字段** (3): `ContentTextID, ID, Priority`

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

### MarbleMatchGroupStageRank.json (0.00 MB, 16 条)

**字段** (6): `ID, Index, LostNum, PlayerID, Rank, WinNum`

**首条记录摘要**:
```json
{
  "ID": 1,
  "PlayerID": 1,
  "Rank": 1,
  "Index": 1
}
```

### MechCraftAttrTypeDisplay.json (0.00 MB, 6 条)

**字段** (4): `FLBGELFEBCK, GMPGDEINODK, MJPKBIGCFOM, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "GMPGDEINODK": "AIDNPNEBLII",
  "OENAMINOLLF": {
    "Hash": 16776315789907646003
  },
  "MJPKBIGCFOM": "SpriteOutput/Quest/MechCraft/Attribute/M...",
  "FLBGELFEBCK": 1
}
```

### MechCraftDesignLevel.json (0.00 MB, 11 条)

**字段** (3): `AAGKEBFHLMC, FACDDCMCMIP, KJIFHEPDMEI`

**首条记录摘要**:
```json
{
  "FACDDCMCMIP": [
    1001,
    1101,
    1102
  ]
}
```

### MechCraftChipTrait.json (0.00 MB, 10 条)

**字段** (3): `FLBGELFEBCK, GMPGDEINODK, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "GMPGDEINODK": "Frank",
  "OENAMINOLLF": {
    "Hash": 4186676175259681195
  },
  "FLBGELFEBCK": 1
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

### MonopolyShopConfig.json (0.00 MB, 13 条)

**字段** (2): `GoodsIDList, ShopID`

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

### MonopolyAreaAssetConfig.json (0.00 MB, 4 条)

**字段** (4): `AssetList, FigurePath, ID, Name`

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

### MechCraftConditionDisplay.json (0.00 MB, 11 条)

**字段** (2): `GMPGDEINODK, NMAHGFAPENI`

**首条记录摘要**:
```json
{
  "GMPGDEINODK": "LABLGILFHFC",
  "NMAHGFAPENI": {
    "Hash": 1337172978107941286
  }
}
```

### MatchThreeAvatarSkillDialog.json (0.00 MB, 10 条)

**字段** (3): `AvatarPic, EnvironmentID, ID`

**首条记录摘要**:
```json
{
  "ID": 1100,
  "EnvironmentID": 201,
  "AvatarPic": "SpriteOutput/AvatarDrawCardResult/1006.p..."
}
```

### MonsterStatusResistanceType.json (0.00 MB, 11 条)

**字段** (2): `Icon, Type`

**首条记录摘要**:
```json
{
  "Type": "STAT_DOT_Burn",
  "Icon": "SpriteOutput/UI/Avatar/Icon/IconImmuneBu..."
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

### MatchThreeV2Bird.json (0.00 MB, 14 条)

**字段** (3): `BirdID, Order, UnlockLevelList`

**首条记录摘要**:
```json
{
  "BirdID": 501,
  "UnlockLevelList": [],
  "Order": 1
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

### MonsterRandomPool.json (0.00 MB, 4 条)

**字段** (3): `ElitePool, MinionPool, RandomPoolID`

**首条记录摘要**:
```json
{
  "RandomPoolID": 1,
  "ElitePool": "<list[11]>",
  "MinionPool": "<list[16]>"
}
```

### MessageItemLink.json (0.00 MB, 4 条)

**字段** (5): `ID, ImagePath, OnceOnly, Title, Type`

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

### MusicRhythmOptical.json (0.00 MB, 5 条)

**字段** (7): `ActivityModuleID, GotoConfig, MainMissionID, Progress, QuestID, RealProgress, Type`

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

### MonopolyRaiseConfig.json (0.00 MB, 12 条)

**字段** (3): `Cost, RaiseCurveID, RaiseValue`

**首条记录摘要**:
```json
{
  "RaiseCurveID": 1,
  "RaiseValue": 1
}
```

### MultipleDropFarmType.json (0.00 MB, 6 条)

**字段** (3): `MultipleDropType, SignIconPath, UnlockID`

**首条记录摘要**:
```json
{
  "MultipleDropType": "COCOON",
  "UnlockID": 9924,
  "SignIconPath": "SpriteOutput/UI/Quest/DoubleCocoon/IconD..."
}
```

### MuseumPhaseUpgrade.json (0.00 MB, 14 条)

**字段** (2): `AreaID, MuseumPhaseID`

**首条记录摘要**:
```json
{
  "MuseumPhaseID": 1,
  "AreaID": 1
}
```

### MechCraftDiyPaintColor.json (0.00 MB, 6 条)

**字段** (2): `FBKAMIHGLFK, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "FBKAMIHGLFK": "SpriteOutput/Quest/MechCraft/DIY/MechCra..."
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
  "QuestList": "<list[5]>"
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

### MusicRhythmPhase.json (0.00 MB, 3 条)

**字段** (6): `FinishMissionID, LiveName, Phase, PostImgPath, SongID, TrackIDList`

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

### MissionSubType.json (0.00 MB, 7 条)

**字段** (3): `ShowIconPath, Type, TypePriority`

**首条记录摘要**:
```json
{
  "TypePriority": 5,
  "ShowIconPath": ""
}
```

### MessageItemRaidEntrance.json (0.00 MB, 3 条)

**字段** (4): `ID, ImagePath, InvalidMissionList, RaidID`

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

### MessageContactsCondition.json (0.00 MB, 7 条)

**字段** (3): `FakeContactID, ID, TruthMissionCondition`

**首条记录摘要**:
```json
{
  "ID": 36,
  "TruthMissionCondition": 2020302,
  "FakeContactID": 57
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

### MatchThreeVersion.json (0.00 MB, 3 条)

**字段** (4): `ActivityID, ActivityVersion, BirdIDList, PVPModuleID`

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

### MarbleBuffHint.json (0.00 MB, 6 条)

**字段** (2): `HintText, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "HintText": {
    "Hash": 2163855309307223733
  }
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

### MissionStoryEvent.json (0.00 MB, 4 条)

**字段** (4): `ConditionExpression, EventDesc, EventName, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ConditionExpression": "[RealFinishSubMission:104040403]"
}
```

### MultiMaterialConfig.json (0.00 MB, 3 条)

**字段** (5): `ExchangeRare2, ExchangeRare3, ExchangeRare4, ItemID, ItemSubType`

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

**字段** (2): `Desc, GotoID`

**首条记录摘要**:
```json
{
  "GotoID": 4000,
  "Desc": {
    "Hash": 182991156390222188
  }
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

### MechCraftWorkshopLevel.json (0.00 MB, 6 条)

**字段** (3): `AAGKEBFHLMC, AGDJPAPAFEO, MPHAIOHJKCD`

**首条记录摘要**:
```json
{}
```

### MenuItemExtraInfo.json (0.00 MB, 3 条)

**字段** (4): `Condition, ExtraInfoParam, ExtraInfoType, ID`

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

### MarbleSealBuff.json (0.00 MB, 4 条)

**字段** (2): `AssetsPath, ID`

**首条记录摘要**:
```json
{
  "ID": 9,
  "AssetsPath": "SpriteOutput/BuffIcon/Inlevel/IconMonste..."
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

### MatchThreeDmgLimit.json (0.00 MB, 5 条)

**字段** (3): `BasicDamage, MaxDamage, Round`

**首条记录摘要**:
```json
{
  "Round": 1,
  "BasicDamage": 10,
  "MaxDamage": 100
}
```

### MapGuide.json (0.00 MB, 2 条)

**字段** (6): `ID, MapGuideIconPath, MapGuideName, SheetID, SheetType, WorldID`

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

### MatchThreeV2DmgLimit.json (0.00 MB, 5 条)

**字段** (3): `BasicDamage, MaxDamage, Round`

**首条记录摘要**:
```json
{
  "Round": 1,
  "BasicDamage": 50,
  "MaxDamage": 50
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

### MissionDisable.json (0.00 MB, 1 条)

**字段** (5): `CompensateItemList, MainMissionIDList, MainMissionIDListClientDisplay, RecycleItemList, SubMissionID`

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

### MessageSpecialChange.json (0.00 MB, 3 条)

**字段** (3): `ActionType, DialogShowID, ItemID`

**首条记录摘要**:
```json
{
  "ItemID": 150370109,
  "ActionType": "Flash"
}
```

### MarbleCustomAction.json (0.00 MB, 2 条)

**字段** (3): `ID, LaunchParamList, SealInsID`

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

### MultiFloorConflictGroup.json (0.00 MB, 1 条)

**字段** (3): `FloorIDList, GroupID, PlaneID`

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

### MuseumTutorialTalk.json (0.00 MB, 1 条)

**字段** (2): `TriggerCustomString, TriggerMissionID`

**首条记录摘要**:
```json
{
  "TriggerMissionID": 8001265,
  "TriggerCustomString": "MuseumTutorial_8001265"
}
```

### MarblePreMatchChat.json (0.00 MB, 1 条)

**字段** (3): `MatchID, SealID, TalkIDList`

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

### MissionVersionConst.json (0.00 MB, 1 条)

**字段** (2): `ID, VersionFinalMainMissionID`

**首条记录摘要**:
```json
{
  "ID": 460,
  "VersionFinalMainMissionID": 1054604
}
```

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

### MonsterBlackListConfig.json (0.00 MB, 0 条)

### MonsterDropTest.json (0.00 MB, 0 条)

### MonsterTemplateTestConfig.json (0.00 MB, 0 条)

### MusicRhythmConstValueClient.json (0.00 MB, 0 条)
