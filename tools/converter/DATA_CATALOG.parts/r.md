# DATA_CATALOG 分片：文件名首字母 R

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 r（共 302 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### RogueMazeBuff.json (1.20 MB, 1,852 条)

**字段** (17): `BuffDesc, BuffDescBattle, BuffDescParamByAvatarSkillID, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### RewardData.json (1.01 MB, 9,515 条)

**字段** (27): `Count_1, Count_2, Count_3, Count_4, Count_5, Count_6, Hcoin, IsSpecial, ItemID_1, ItemID_2, ItemID_3, ItemID_4, ItemID_5, ItemID_6, Level_1, Level_2, Level_3, Level_4, Level_5, Level_6, Rank_1, Rank_2, Rank_3, Rank_4, Rank_5, Rank_6, RewardID`

**首条记录摘要**:
```json
{
  "RewardID": 100
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

### RogueDialogueOptionDisplay.json (0.35 MB, 2,302 条)

**字段** (3): `OptionDesc, OptionDisplayID, OptionTitle`

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

### RogueMagicMazeBuff.json (0.24 MB, 387 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### RaidConfig.json (0.23 MB, 322 条)

**字段** (35): `AutoObtainDamageType, BuffDesc, BuffParamList, DamageType, DifficultyAdjustmentType, DisplayEventID, EnterType, EntrancePageBGImagePath, FinishEntranceID, HardLevel, IsEntryByProp, IsHiddenAreaMap, LimitIDList, LockCaptain, LockCaptainAvatarID, MainMissionIDAfter, MainMissionIDBefore, MainMissionIDList, MappingInfoID, MonsterHideList, MonsterList, RaidDesc, RaidID, RaidName, RaidTagList, RaidTargetID, RecoverType, RewardList, SkipJoinLineup, SkipRewardOnFinish, TeamLimitIDList, TeamType, TrialAvatarList, Type, UnlockWorldLevel`

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

### RogueTournBuff.json (0.20 MB, 900 条)

**字段** (8): `ExtraEffectIDList, IsInHandbook, MazeBuffID, MazeBuffLevel, RogueBuffCategory, RogueBuffTag, RogueBuffType, UnlockDisplay`

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

### RogueMonster.json (0.19 MB, 2,016 条)

**字段** (4): `EventID, MonsterDropType, NpcMonsterID, RogueMonsterID`

**首条记录摘要**:
```json
{
  "RogueMonsterID": 9001,
  "NpcMonsterID": 1003010,
  "EventID": 89999001
}
```

### RelicConfig.json (0.19 MB, 774 条)

**字段** (11): `CoinCost, ExpProvide, ExpType, ID, MainAffixGroup, MaxLevel, Mode, Rarity, SetID, SubAffixGroup, Type`

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

### RogueMiracleEffect.json (0.19 MB, 1,038 条)

**字段** (4): `MiracleDesc, MiracleDynamicHint, MiracleEffectID, ParamList`

**首条记录摘要**:
```json
{
  "MiracleEffectID": 1,
  "MiracleDesc": {
    "Hash": 8768956841205858049
  },
  "ParamList": "<list[3]>"
}
```

### RogueUpgradeAvatarSubRelic.json (0.18 MB, 552 条)

**字段** (6): `RelicLevel, RelicRarity, RelicSubValueList, RelicSubValueStepTime, RelicType, SubRelicType`

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

### RogueBuff.json (0.17 MB, 484 条)

**字段** (14): `ActivityModuleID, AeonCrossIcon, AeonID, BattleEventBuffType, ExtraEffectIDList, HandbookUnlockDesc, IsShow, MazeBuffID, MazeBuffLevel, RogueBuffCategory, RogueBuffTag, RogueBuffType, RogueVersion, UnlockIDList`

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

**字段** (5): `DescParamList, ExtraEffect, MiracleDesc, MiracleEffectDisplayID, MiracleSimpleDesc`

**首条记录摘要**:
```json
{
  "MiracleEffectDisplayID": 1,
  "MiracleDesc": {
    "Hash": 1851219478774962691
  },
  "DescParamList": "<list[3]>",
  "ExtraEffect": []
}
```

### RogueRoom.json (0.15 MB, 704 条)

**字段** (6): `GroupID, GroupWithContent, MapEntrance, RogueRoomID, RogueRoomSections, RogueRoomType`

**首条记录摘要**:
```json
{
  "RogueRoomID": 100,
  "RogueRoomType": 1,
  "MapEntrance": 8000101,
  "GroupID": 10,
  "GroupWithContent": "<dict[6]>",
  "RogueRoomSections": [
    0
  ]
}
```

### RogueTournRoom.json (0.15 MB, 1,338 条)

**字段** (4): `RogueRoomID, RogueRoomType, TournMode, VariantType`

**首条记录摘要**:
```json
{
  "RogueRoomID": 11098080,
  "TournMode": "Tourn1",
  "RogueRoomType": "Adventure"
}
```

### RogueNousRoom.json (0.14 MB, 1,224 条)

**字段** (3): `RogueRoomID, RogueRoomSections, RogueSubMode`

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

### RoguePersonaStyleGift.json (0.13 MB, 337 条)

**字段** (10): `DEGHFCJNECP, FMDMDDCBPAM, HILFNIOLPHN, KGOEAGHJFKD, MJOOFPBABEA, NIKKAPEIDJO, NMAHGFAPENI, OLOIFNNLKJP, PBLPLDJKPEI, PMIEAEGJNMJ`

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

### RogueMagicUnit.json (0.13 MB, 277 条)

**字段** (16): `AttachRangeTypeList, EffectTypeList, ExtraEffectID, FuncType, LimitRange, MagicUnitCategory, MagicUnitDesc, MagicUnitID, MagicUnitLevel, MagicUnitMazeBuffID, MagicUnitSimpleDesc, MagicUnitType, SpecialType, StyleType, UnitBasicPower, UnlockID`

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

### RogueTournArea.json (0.12 MB, 270 条)

**字段** (15): `BEOFPCAACEP, DOKMKLJDCEK, EODCEHDOAEB, FOMEIPIEGII, GLNDIILFKBN, GNIFODGCPAA, GOEDJMNFALN, HILINOJPLGA, ILPNADCAIBL, IMNLCDOMMOG, JJKLIJNFIBB, NKLFPMKHELN, PCBLHKODOMG, PIKODOAKLGE, PJGJLMIODBD`

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

### RogueMonsterGroup.json (0.12 MB, 863 条)

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

### RogueDialogueOption.json (0.12 MB, 1,162 条)

**字段** (3): `OptionDisplayID, OptionID, ParamList`

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

### RogueTournMiracle.json (0.12 MB, 699 条)

**字段** (6): `HandbookMiracleID, MiracleCategory, MiracleDisplayID, MiracleEffectID, MiracleID, TournMode`

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

### RogueMagicRoom.json (0.09 MB, 1,518 条)

**字段** (2): `RogueRoomID, RogueRoomType`

**首条记录摘要**:
```json
{
  "RogueRoomID": 11001,
  "RogueRoomType": "Adventure"
}
```

### RogueTournFormula.json (0.09 MB, 328 条)

**字段** (11): `FormulaCategory, FormulaDisplayID, FormulaID, FormulaStoryJson, IsInHandbook, MainBuffNum, MainBuffTypeID, MazeBuffID, SubBuffNum, SubBuffTypeID, TournMode`

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

### RogueTalkNameConfig.json (0.09 MB, 524 条)

**字段** (5): `IconPath, ImageID, Name, SubName, TalkNameID`

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

### RogueDLCRoom.json (0.09 MB, 861 条)

**字段** (3): `RogueRoomID, RogueRoomSections, RogueSubMode`

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

### RogueMiracleDisplay.json (0.09 MB, 314 条)

**字段** (5): `MiracleBGDesc, MiracleDisplayID, MiracleFigureIconPath, MiracleIconPath, MiracleName`

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

### RogueUpgradeAvatarSubValue.json (0.08 MB, 276 条)

**字段** (5): `RelicLevel, RelicRarity, RelicSubValueList, RelicSubValueStepTime, RelicType`

**首条记录摘要**:
```json
{
  "RelicRarity": "CombatPowerRelicRarity2",
  "RelicType": "HEAD",
  "RelicSubValueList": [],
  "RelicSubValueStepTime": 1
}
```

### RogueMap.json (0.07 MB, 615 条)

**字段** (6): `IsStart, NextSiteIDList, PosX, PosY, RogueMapID, SiteID`

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

### RogueTournWeeklyDisplay.json (0.07 MB, 295 条)

**字段** (3): `DescParams, WeeklyDisplayContent, WeeklyDisplayID`

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

### RogueTournCocoonConfig.json (0.07 MB, 70 条)

**字段** (15): `Difficulty, DisplayID, DisplayItemList, DisplayMonsterMap, DropList, EventID, ID, MaxChallengeCnt, NpcMonsterID, PicPath, RecommendDamageTypes, RecommendLevel, RogueKeyCost, StaminaCost, WorldLevel`

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
  "DisplayMonsterMap": "<list[1]>",
  "NpcMonsterID": 1004021,
  "WorldLevel": 1,
  "EventID": 80300031,
  "DisplayItemList": "<list[8]>",
  "DropList": "<list[11]>",
  "StaminaCost": 40,
  "RogueKeyCost": 1,
  "MaxChallengeCnt": 6
}
```

### RogueTournBuffGroup.json (0.07 MB, 458 条)

**字段** (3): `RogueBuffDrop, RogueBuffGroupID, TournMode`

**首条记录摘要**:
```json
{
  "RogueBuffGroupID": 1000001,
  "RogueBuffDrop": "<list[8]>"
}
```

### RetCodeError.json (0.07 MB, 847 条)

**字段** (3): `ErrorID, IsPileToastCenter, Text`

**首条记录摘要**:
```json
{
  "Text": {
    "Hash": 18396014689023842325
  }
}
```

### RogueTournHandbookMiracle.json (0.07 MB, 544 条)

**字段** (5): `HandbookMiracleID, MiracleCategory, MiracleDisplayID, MiracleEffectID, UnlockDesc`

**首条记录摘要**:
```json
{
  "HandbookMiracleID": 6101,
  "MiracleDisplayID": 6101,
  "MiracleCategory": "Common",
  "UnlockDesc": 806
}
```

### RelicDataInfo.json (0.07 MB, 192 条)

**字段** (8): `BGStoryContent, BGStoryTitle, IconPath, ItemBGDesc, ItemFigureIconPath, RelicName, SetID, Type`

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

### RogueWolfGunMiracleTarget.json (0.06 MB, 421 条)

**字段** (5): `Basement, GameMode, LayerMiddle, MiracleID, MiraclePic`

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

### RogueTournFormulaDisplay.json (0.06 MB, 324 条)

**字段** (4): `ExtraEffect, FormulaDisplayID, FormulaStory, HandbookUnlockDisplayID`

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

### RogueTournWeeklyChallenge.json (0.05 MB, 114 条)

**字段** (9): `ChallengeID, DisplayFinalMonsterGroups, DisplayMonsterGroups1, DisplayMonsterGroups2, DisplayMonsterGroups3, RewardID, WeeklyContentDetailList, WeeklyContentList, WeeklyName`

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

### RogueBuffGroup.json (0.05 MB, 546 条)

**字段** (2): `GMLOGNJAIGI, HECJCAMDGNO`

**首条记录摘要**:
```json
{
  "GMLOGNJAIGI": 12000,
  "HECJCAMDGNO": "<list[18]>"
}
```

### RogueNousDiceSurface.json (0.05 MB, 80 条)

**字段** (14): `BranchLimitaion, DescParam, DiceActiveStage, ExtraDesc, Icon, ItemID, Rarity, SlotList, Sort, SurfaceDesc, SurfaceID, SurfaceName, TagList, UnlockDisplayID`

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
  "BranchLimitaion": "<list[12]>"
}
```

### RogueAreaConfig.json (0.05 MB, 38 条)

**字段** (20): `AreaEnvironment, AreaFigure, AreaIcon, AreaNameID, AreaProgress, AreaTipsIcon, ChestDisplayItemList, Difficulty, DisplayMonsterMap, DisplayMonsterMap2, FirstReward, MapDisplayItemList, MonsterEliteDropDisplayID, RecommendLevel, RecommendNature, RecommendSkillTreePoints, RogueAreaID, ScoreMap, UnlockID, isActivityArea`

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
  "ScoreMap": {},
  "AreaTipsIcon": "SpriteOutput/Rogue/Planet/IconRoguePlane..."
}
```

### RogueHandBookEvent.json (0.05 MB, 96 条)

**字段** (9): `EventHandbookID, EventReward, EventTitle, EventType, EventTypeList, ImageID, Order, UnlockHintDesc, UnlockNPCProgressIDList`

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

### RogueTournHandBookEvent.json (0.05 MB, 128 条)

**字段** (8): `EventHandbookID, EventTitle, ImageID, IsUsed, Priority, TypeDisplayID, UnlockDisplayID, UnlockNPCProgressIDList`

**首条记录摘要**:
```json
{
  "EventHandbookID": 5,
  "UnlockNPCProgressIDList": "<list[3]>",
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

### RogueTournMiracleDisplay.json (0.05 MB, 166 条)

**字段** (5): `MiracleBGDesc, MiracleDisplayID, MiracleFigureIconPath, MiracleIconPath, MiracleName`

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

### RogueDLCChessBoard.json (0.04 MB, 216 条)

**字段** (4): `BlockCreatGroupID, ChessBoardConfiguration, ChessBoardEventList, ChessBoardID`

**首条记录摘要**:
```json
{
  "ChessBoardID": 10111,
  "ChessBoardConfiguration": "Config/Gameplays/RogueDLC/RogueDLC_Tutor...",
  "BlockCreatGroupID": 10111,
  "ChessBoardEventList": []
}
```

### RogueTournNPC.json (0.03 MB, 316 条)

**字段** (2): `NPCJsonPath, RogueNPCID`

**首条记录摘要**:
```json
{
  "RogueNPCID": 410001,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC_230..."
}
```

### RogueManager.json (0.03 MB, 78 条)

**字段** (6): `BeginTime, EndTime, RogueAreaIDList, RogueSeason, RogueVersion, ScheduleDataID`

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

### RogueMagicScepter.json (0.03 MB, 72 条)

**字段** (11): `EffectTypeList, FuncType, LimitRangeType, LockMagicUnit, ScepterBasicPower, ScepterID, ScepterLevel, StaffMazeBuffID, StyleType, TrenchCount, UnlockID`

**首条记录摘要**:
```json
{
  "ScepterID": 2001,
  "ScepterLevel": 1,
  "LockMagicUnit": "<list[1]>",
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

### RechargeConfig.json (0.03 MB, 138 条)

**字段** (10): `FirstCharge, FirstRechangeConfirm, GiftImage, GiftName, GiftType, ListOrder, NormalCharge, NormalRechargeConfirm, ProductID, TierID`

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

### RelicSetSkillConfig.json (0.03 MB, 96 条)

**字段** (6): `AbilityName, AbilityParamList, PropertyList, RequireNum, SetID, SkillDesc`

**首条记录摘要**:
```json
{
  "SetID": 101,
  "RequireNum": 2,
  "SkillDesc": "RelicDesc_1012",
  "PropertyList": "<list[1]>",
  "AbilityName": "",
  "AbilityParamList": [
    {
      "Value": 0.1
    }
  ]
}
```

### RaidTargetConfig.json (0.03 MB, 67 条)

**字段** (12): `AbilityName, HintStep, ID, IsInBattle, IsShowProgress, ParamList, ParamType, RewardID, TargetName, TargetNameSimple, TargetParam1, TargetType`

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

**字段** (4): `MiracleDisplayID, MiracleEffectDisplayID, MiracleID, UnlockHandbookMiracleID`

**首条记录摘要**:
```json
{
  "MiracleID": 1,
  "MiracleDisplayID": 1,
  "MiracleEffectDisplayID": 1,
  "UnlockHandbookMiracleID": 1
}
```

### RestaurantMessageConfig.json (0.03 MB, 154 条)

**字段** (7): `ContactsID, ID, ItemType, MainText, NextItemIDList, OptionEffectID, Sender`

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

### RogueMagicFinishway.json (0.03 MB, 135 条)

**字段** (11): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

### RogueDLCChessBoardEvent.json (0.03 MB, 150 条)

**字段** (3): `ChessBoardEventDesc, ChessBoardEventID, ChessBoardEventName`

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

### RogueTournExpReward.json (0.03 MB, 300 条)

**字段** (4): `Exp, Level, MainTournID, RewardID`

**首条记录摘要**:
```json
{
  "MainTournID": 1,
  "Level": 1,
  "Exp": 800,
  "RewardID": 110901
}
```

### RogueNPC.json (0.03 MB, 260 条)

**字段** (2): `NPCJsonPath, RogueNPCID`

**首条记录摘要**:
```json
{
  "RogueNPCID": 40398,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC4039..."
}
```

### RogueImage.json (0.03 MB, 93 条)

**字段** (6): `ImageID, ImagePath, ImageType, ParamStr1, ParamStr2, TexturePath`

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

### RogueDLCAeonTalent.json (0.02 MB, 63 条)

**字段** (9): `AeonDimensionID, AeonTalentID, EffectDesc, EffectDescParamList, EffectTitle, GamePlayEffectList, IsImportant, TalentIcon, UnlockAeonDimensionPoint`

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

**字段** (3): `RogueUnlockDetail, RogueUnlockID, UnlockFinishWay`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 1,
  "UnlockFinishWay": 10100
}
```

### RogueTournGambleGroup.json (0.02 MB, 126 条)

**字段** (5): `GambleGroupID, GambleGroupIcon, GambleGroupLevel, GambleGroupType, GroupName`

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

**字段** (6): `BonusDesc, BonusEvent, BonusID, BonusIcon, BonusTag, BonusTitle`

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

### RogueTournExhibition.json (0.02 MB, 70 条)

**字段** (6): `ExhibitionID, ExhibitionType, IconPath, ImagePath, ProgramGroupID, SlotIconPath`

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

### RogueNousDiceBranch.json (0.02 MB, 12 条)

**字段** (31): `BranchCorePrefab, BranchEditCorePrefab, BranchID, BranchIcon, BranchIntroduction, BranchName, BranchPrefab, BranchTag, DefaultCommonSurfaceList, DefaultUltraSurface, DiceIcon, DiceLightColor, EffectDesc, EffectDescParam1, EffectDescParam2, EffectDescParam3, EffectExtraDesc, ExtraDesc, ParamValue1, ParamValue2, ParamValue3, PassiveEffectDesc, PassiveEffectExtraDesc, RecommendSurfaceList, SoundReRoll, SoundRoll, SoundSuspensionStart, SoundSuspensionStop, StartingEffectDescToast, SuggestiveSurfaceList, UnlockID`

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
  "RecommendSurfaceList": "<list[10]>"
}
```

### RogueTournFinishway.json (0.02 MB, 104 条)

**字段** (11): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

### RogueDLCAeonDiceSurface.json (0.02 MB, 42 条)

**字段** (13): `AeonDiceID, AeonSurfaceDiceID, DescParam, Dice3DSurfaceList, DiceActiveStage, DiceEffectParam, DiceEffectType, DiceSurfaceDesc, DiceSurfaceIcon, DiceSurfaceName, ExtraEffect, Rarity, Sort`

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

### RogueMiracleGroup.json (0.02 MB, 100 条)

**字段** (2): `MiracleWeight, RogueMiracleGroupID`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 1000,
  "MiracleWeight": "<dict[5]>"
}
```

### RogueNousDiceBranchValue.json (0.02 MB, 108 条)

**字段** (4): `AeonID, BranchEffectDesc, BranchID, ParamList`

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

### RelicSetConfig.json (0.02 MB, 62 条)

**字段** (10): `DisplayItemID, DisplayItemIDRarity4, IsPlanarSuit, Release, ReleaseVersion, SetID, SetIconFigurePath, SetIconPath, SetName, SetSkillList`

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

### RogueHandbookMiracle.json (0.02 MB, 112 条)

**字段** (6): `MiracleDisplayID, MiracleEffectDisplayID, MiracleHandbookID, MiracleReward, MiracleTypeList, Order`

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

### RogueDLCFinishWay.json (0.02 MB, 102 条)

**字段** (10): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

### RogueTalent.json (0.02 MB, 42 条)

**字段** (10): `Cost, EffectDesc, EffectDescParamList, EffectTag, EffectTitle, Icon, IsImportant, NextTalentIDList, TalentID, UnlockIDList`

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

### RelicMainAffixAvatarValue.json (0.02 MB, 98 条)

**字段** (12): `Attack, AvatarID, BreakDamage, CriticalChance, CriticalDamage, DamageAddedRatio, Defence, HP, HealRatio, SPRatio, Speed, StatusProbability`

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

### RelicMainAffixConfig.json (0.02 MB, 117 条)

**字段** (5): `AffixID, BaseValue, GroupID, LevelAdd, Property`

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

### RogueTournTitanTalent.json (0.02 MB, 36 条)

**字段** (11): `ActJson, ActTitle, Cost, DescParamList, ID, Level, PreID, TalentDesc, TalentIconPath, TalentTitle, TitanType`

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

### RogueNousTalent.json (0.02 MB, 40 条)

**字段** (9): `Cost, EffectDesc, EffectDescParamList, EffectTag, EffectTitle, Icon, NextTalentIDList, TalentID, UnlockIDList`

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

### RelicSubAffixAvatarValue.json (0.02 MB, 98 条)

**字段** (10): `Attack, AvatarID, BreakDamage, CriticalChance, CriticalDamage, Defence, HP, Speed, StatusProbability, StatusResistance`

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

### RogueDLCAeonCabinet.json (0.02 MB, 31 条)

**字段** (11): `CabinetDesc, CabinetID, CabinetIcon, CabinetMissionDesc, CabinetName, CabinetType, DescParam, FinishAeonDimensionPointList, QuestID, Sort, UnlockCabinetID`

**首条记录摘要**:
```json
{
  "CabinetID": 1,
  "CabinetType": "Normal",
  "UnlockCabinetID": [],
  "QuestID": 6013201,
  "FinishAeonDimensionPointList": "<list[2]>",
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

### RoguePersonaRoomAttribute.json (0.02 MB, 55 条)

**字段** (6): `HHPFKDEBMGP, MJOOFPBABEA, NMAHGFAPENI, OLOIFNNLKJP, OOMBNFMJLEO, PBLPLDJKPEI`

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

### RogueTournPermanentTalent.json (0.02 MB, 38 条)

**字段** (9): `Cost, EffectDesc, EffectDescParamList, EffectTag, EffectTitle, Icon, IsImportant, NextTalentIDList, TalentID`

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

### RogueDLCBossDecay.json (0.02 MB, 42 条)

**字段** (10): `BossDecayComeFrom, BossDecayDesc, BossDecayID, BossDecayName, BossEffectIcon, DecayIcon, DescParam, EffectParamList, EffectType, ExtraDesc`

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

### RoguePersonaStyle.json (0.02 MB, 15 条)

**字段** (15): `BCGJNNDCIFH, DDGDJCKKHPH, DOKOMKFGOOC, FBOICELIKNJ, GIFCDPFAKKP, JEHDKAKMCGC, JJKLIJNFIBB, KLOEJIMMPJM, LCNLDGGAOBH, MJOOFPBABEA, NMAHGFAPENI, OHBMLDNKGMD, PBLPLDJKPEI, PILOLAAEAHB, PJNNPOKJEFD`

**首条记录摘要**:
```json
{
  "KLOEJIMMPJM": 101,
  "BCGJNNDCIFH": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "LCNLDGGAOBH": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "DOKOMKFGOOC": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
  "OHBMLDNKGMD": "SpriteOutput/Rogue/Tourn/Persona/Persona...",
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
  "PBLPLDJKPEI": "<list[4]>",
  "JEHDKAKMCGC": "<list[14]>",
  "GIFCDPFAKKP": true,
  "PILOLAAEAHB": 1
}
```

### RogueMagicUnitDisplay.json (0.02 MB, 109 条)

**字段** (3): `MagicUnitID, MagicUnitIcon, MagicUnitName`

**首条记录摘要**:
```json
{
  "MagicUnitID": 4001,
  "MagicUnitIcon": "SpriteOutput/BuffIcon/Inlevel/IconDotBur..."
}
```

### RogueTournLayerRoom.json (0.02 MB, 103 条)

**字段** (5): `Door1, Door2, Door3, LayerID, RoomIndex`

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

### RogueTournGambleUnit.json (0.02 MB, 89 条)

**字段** (5): `GambleUnitID, GambleUnitIcon, GambleUnitParam, GambleUnitType, UnitTextureParam`

**首条记录摘要**:
```json
{
  "GambleUnitID": 101,
  "GambleUnitType": "BuffCommon",
  "GambleUnitParam": 1010001,
  "GambleUnitIcon": "SpriteOutput/AvatarProfessionTattoo/Prof..."
}
```

### RogueTournTitanBless.json (0.02 MB, 84 条)

**字段** (8): `BlessBattleDisplayCategoryList, BlessRatio, ExtraEffectIDList, MazeBuffID, SpeedUpRatio, TitanBlessID, TitanBlessLevel, TitanType`

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

### RogueDLCSubStory.json (0.02 MB, 42 条)

**字段** (6): `ImgPath, Layer, LevelGraphPath, OptionPath, RogueDLCSubStoryID, SubStoryName`

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

### ResourceOverallConfig.json (0.01 MB, 179 条)

**字段** (2): `CurrencyIDList, PageKey`

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

**字段** (14): `AreaGroupID, AreaID, AreaIndex, AreaNameID, CustomStageDisplayIcon, CustomStageDisplayParams, DefaultStyle, DifficultyIDList, ExtraLayerID, FirstReward, IsHard, LayerIDList, UnlockID, WorldLevel2DisplayMonster`

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
  "WorldLevel2DisplayMonster": "<list[7]>",
  "CustomStageDisplayIcon": ""
}
```

### RogueMagicMiracleGroup.json (0.01 MB, 47 条)

**字段** (2): `MiracleWeight, RogueMiracleGroupID`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 50002,
  "MiracleWeight": "<dict[9]>"
}
```

### RoguePersonaTalent.json (0.01 MB, 24 条)

**字段** (12): `AAGKEBFHLMC, DBALOLNOLGL, DPCMGDIIAKN, HGHFCLHKJNJ, MJOOFPBABEA, MOEDOCHOCPJ, NMAHGFAPENI, OICGFNGNLOE, OLOIFNNLKJP, OMKFHNLHBBB, PBLPLDJKPEI, PHFMCACHFIJ`

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

### RestaurantRecipeUpConfig.json (0.01 MB, 85 条)

**字段** (6): `CookTime, Level, MaxLevel, Price, RecipeID, UpgradeMaterials`

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

### RestaurantDailyConfig.json (0.01 MB, 28 条)

**字段** (14): `BeginMainPageMission, DayID, FestivalID, IsLoop, OrderTableID, ProgressID, RandomEventNumber, RandomEventTypeList, RecommendRecipeList, ShareCropsRewardID, SpecialCustomerMapList, StartMessageID, Tips, WaveConfig`

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

### RestaurantBehaviorConfig.json (0.01 MB, 16 条)

**字段** (25): `AngryLeave, BehaviorID, BehaviorJSON, CallStop, CleanObstacle, CleanTable, CleanTip, Complaint, Drink, EatingNormal, EatingPerfect, Help, KeepInLinePerform, LeavePerfect, ProcessComplaint, ProcessEscapeBill, ProcessHelp, ProcessThank, PutDownFoodBloodShot, PutDownFoodNormal, Sleep, Thank, TimeOverPerform, WaiterPutDownFoodBloodShot, WaiterPutDownFoodNormal`

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

### RogueTournKeyword.json (0.01 MB, 25 条)

**字段** (8): `ExtraEffect, KeywordBuffType, KeywordExtraEffect, KeywordID, KeywordIcon, MazeBuffID, MazeBuffList, RogueFormulaList`

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
  "RogueFormulaList": "<list[8]>",
  "KeywordExtraEffect": 60000001,
  "ExtraEffect": 61000200,
  "KeywordBuffType": 120
}
```

### RogueMagicStory.json (0.01 MB, 39 条)

**字段** (7): `IsHide, LevelGraphPath, StoryCategory, StoryID, StoryImage, StoryName, UnLockDisplay`

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

### RogueTournCollection.json (0.01 MB, 22 条)

**字段** (9): `CollectionDesc, CollectionEffectDesc, CollectionID, CollectionName, EntityRuntimeReplaceArtPrefabID, IconPath, ParamList, SlotIconPath, UnlockID`

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

### RestaurantAbilityConfig.json (0.01 MB, 52 条)

**字段** (7): `AbilityID, BuffList, Detail, DynamicValues, Name, TargetType, Type`

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

**字段** (15): `AreaGroupID, AreaID, AreaNameID, AreaScoreMap, Difficulty, DifficultyID, DisplayMonsterMap, FirstReward, IsHard, LayerIDList, MonsterEliteDropDisplayID, RecommendLevel, RecommendNature, SubType, UnlockID`

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

### RogueTournMiracleGroup.json (0.01 MB, 288 条)

**字段** (1): `RogueMiracleGroupID`

**首条记录摘要**:
```json
{
  "RogueMiracleGroupID": 40000
}
```

### RogueHint.json (0.01 MB, 137 条)

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

### RogueMagicScore.json (0.01 MB, 133 条)

**字段** (4): `LayerNum, RoomNum, WeeklyScore, WorldLevel`

**首条记录摘要**:
```json
{
  "LayerNum": 1,
  "RoomNum": 1,
  "WeeklyScore": 450
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

### RogueMagicTalent.json (0.01 MB, 25 条)

**字段** (7): `Cost, DescParams, EffectDesc, Level, NameDisplayID, TalentID, TalentIcon`

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
  "DescParams": "<list[3]>"
}
```

### RaidNPCMonsterOverride.json (0.01 MB, 55 条)

**字段** (6): `ConfigIDList, GroupID, HardLevel, NpcMonsterIDList, PlaneEventIDList, RaidID`

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

### RogueMagicScepterDisplay.json (0.01 MB, 24 条)

**字段** (6): `ScepterBGDesc, ScepterFigurePath, ScepterID, ScepterIconPath, ScepterName, ScepterTriggerDesc`

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

### RogueMagicMiracle.json (0.01 MB, 81 条)

**字段** (4): `MiracleDisplayID, MiracleEffectDisplayID, MiracleID, UnlockHandbookMiracleID`

**首条记录摘要**:
```json
{
  "MiracleID": 7101,
  "MiracleDisplayID": 4,
  "MiracleEffectDisplayID": 601,
  "UnlockHandbookMiracleID": 4
}
```

### RogueTournCurseChest.json (0.01 MB, 29 条)

**字段** (11): `ChestID, IconPath, MainDescDisplayID, MainTitleDisplayID, ParamValue1, ParamValue2, ParamValue3, ParamValue4, SubDescDisplayID, SubTitleDisplayID, Type`

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

### RogueDLCUnlock.json (0.01 MB, 110 条)

**字段** (3): `RogueUnlockDetail, RogueUnlockID, UnlockFinishWay`

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

### RogueDLCChessBoardAnimation.json (0.01 MB, 76 条)

**字段** (4): `AnimationType, ModifierType, NeedCheckCoinChange, RogueSubMode`

**首条记录摘要**:
```json
{
  "ModifierType": "TriggerAreaShuffle",
  "RogueSubMode": "ChessRogue",
  "AnimationType": "Portal"
}
```

### RogueTournExpScore.json (0.01 MB, 119 条)

**字段** (4): `Exp, ID, ScoreExpID, WeeklyScore`

**首条记录摘要**:
```json
{
  "ID": 11001,
  "ScoreExpID": 1,
  "WeeklyScore": 300,
  "Exp": 50
}
```

### RelicSubAffixConfig.json (0.01 MB, 48 条)

**字段** (6): `AffixID, BaseValue, GroupID, Property, StepNum, StepValue`

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

### RogueTournRoomMark.json (0.01 MB, 24 条)

**字段** (6): `HLALFNEDFED, ICIDICKIDCB, JLFLCFGCHHC, LHLKJIDFLIN, LJFOMBOOEIC, OPLOPGILKKH`

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

### RoguePersonaRoomCompType.json (0.01 MB, 19 条)

**字段** (11): `BAAOGIMCALN, CILPGJAFCOK, ENFPMJCLEON, HCBADDHNIDG, JPLIONFJGCL, LHLKJIDFLIN, LJPBJNANBLB, LLICIMBCNPF, LOBGFEKCOHM, NMAHGFAPENI, OLOIFNNLKJP`

**首条记录摘要**:
```json
{
  "LLICIMBCNPF": 1,
  "HCBADDHNIDG": 1,
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
  "CILPGJAFCOK": "SpriteOutput/Rogue/Map/RogueBossIcon.png",
  "ENFPMJCLEON": [
    "Level",
    "Attribute"
  ]
}
```

### RogueTournHexDisplay.json (0.01 MB, 34 条)

**字段** (5): `BgDesc, FigureIconPath, HexDisplayID, IconPath, Name`

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

### RogueTournTitanType.json (0.01 MB, 12 条)

**字段** (9): `CharacterName, RogueTitanAvatarRoundIconMid, RogueTitanAvatarRoundIconSmall, RogueTitanCardIcon, RogueTitanCardShadowIcon, RogueTitanCategory, RogueTitanTalentIcon, RogueTitanType, TitanTitle`

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

### RestaurantCustomerConfig.json (0.01 MB, 23 条)

**字段** (9): `BehaviorID, ConfigID, CustomerID, GroupID, IMGPath, IconPath, Model, NPCID, Type`

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

### RogueTournUnlock.json (0.01 MB, 97 条)

**字段** (3): `RogueUnlockDetail, RogueUnlockID, UnlockFinishWay`

**首条记录摘要**:
```json
{
  "RogueUnlockID": 3000201,
  "UnlockFinishWay": 3000201
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

**字段** (6): `BehaviorName, Content, DynamicValue, GenCustomerNumGap, GenMaxNum, ID`

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

### RoguePersonaRoomComposition.json (0.01 MB, 153 条)

**字段** (2): `AAGKEBFHLMC, LLICIMBCNPF`

**首条记录摘要**:
```json
{
  "LLICIMBCNPF": 1,
  "AAGKEBFHLMC": 1
}
```

### RestaurantRecipeConfig.json (0.01 MB, 17 条)

**字段** (8): `Detail, IMGPath, Materials, Model, Name, RecipeID, TAGList, UnlockIDList`

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

### RogueNousSubStory.json (0.01 MB, 20 条)

**字段** (11): `DisplayID, Layer, LevelGraphPath, MaxNousValue, MinNousValue, NextIDList, QuestID, RequireArea, StoryID, TalkNameID, TriggerCondition`

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

### RogueAeonLevelConfig.json (0.01 MB, 64 条)

**字段** (7): `AeonStory, AeonStoryID, AeonStory_Name, Exp, Level, RogueAeonID, UnlockID`

**首条记录摘要**:
```json
{
  "RogueAeonID": 1,
  "AeonStoryID": 1,
  "Level": 1
}
```

### RogueAeonDisplay.json (0.01 MB, 14 条)

**字段** (8): `AeonBuffIcon, AeonFigure, AeonIcon, AeonImage, DisplayID, RogueAeonName, RogueAeonPathName, RogueAeonPathName2`

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

### RogueMagicDifficultyDrop.json (0.01 MB, 91 条)

**字段** (3): `AreaID, MonsterEliteDropDisplayID, WorldLevel`

**首条记录摘要**:
```json
{
  "AreaID": 101
}
```

### RogueDLCBlockIntro.json (0.01 MB, 20 条)

**字段** (8): `BlockIntroDesc, BlockIntroID, BlockIntroIcon, BlockIntroName, BlockTypeChessBoardColor, IntroGroup, Sort, SubType`

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

### RogueMagicRoomMark.json (0.01 MB, 18 条)

**字段** (6): `MarkType, RoomIconEffect, RoomType, RoomTypeIcon, RoomTypeName, ToastIcon`

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

### RogueTalkNameColor.json (0.01 MB, 77 条)

**字段** (2): `Color, TextmapID`

**首条记录摘要**:
```json
{
  "TextmapID": {
    "Hash": 14629195021455409417
  },
  "Color": "Pink"
}
```

### RewardDataLD.json (0.01 MB, 79 条)

**字段** (13): `Count_1, Count_2, Count_3, Count_4, Count_5, Count_6, ItemID_1, ItemID_2, ItemID_3, ItemID_4, ItemID_5, ItemID_6, RewardID`

**首条记录摘要**:
```json
{
  "RewardID": 8020001,
  "ItemID_1": 268001,
  "Count_1": 1
}
```

### RogueDLCAeon.json (0.01 MB, 8 条)

**字段** (19): `AeonDiceID, AeonID, BattleEventBuffGroup, BattleEventEnhanceBuffGroup, DescParam, EffectDesc3, EffectParam1, EffectParam2, EffectParam3, EffectParam4, EffectType1, EffectType3, EntrancePrefabPath, ExtraEffect, PlayShortDesc, RogueAeonDisplayID, RogueBuffType, Sort, UnlockID`

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
  "DescParam": "<list[3]>",
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

### RogueScoreReward.json (0.01 MB, 70 条)

**字段** (4): `Reward, RewardPoolID, Score, ScoreRow`

**首条记录摘要**:
```json
{
  "RewardPoolID": 20,
  "ScoreRow": 1,
  "Score": 350,
  "Reward": 108001
}
```

### RogueMagicNPC.json (0.01 MB, 55 条)

**字段** (2): `NPCJsonPath, RogueNPCID`

**首条记录摘要**:
```json
{
  "RogueNPCID": 510001,
  "NPCJsonPath": "Config/Level/Rogue/RogueNPC/RogueNPC_260..."
}
```

### RestaurantEmployeeUpConfig.json (0.01 MB, 50 条)

**字段** (4): `AbilityIDList, EmployeeID, Level, UpgradePrice`

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

### RogueTournHexAvatarBaseType.json (0.01 MB, 57 条)

**字段** (3): `AvatarDamageType, AvatarType, MiracleID`

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

### RogueDLCAeonDice.json (0.01 MB, 8 条)

**字段** (12): `AeonDiceID, DescParam, DiceIcon, DiceModel, DiceShortDesc, DiceStartEffectDesc, ExtraEffect, SoundReRoll, SoundRoll, SoundSuspensionStart, SoundSuspensionStop, StartDescParam`

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

### RogueTournExpScore_Index_ScoreExpID.json (0.01 MB, 11 条)

**字段** (2): `MGNHKOHFLPO, OEJJLDOAICN`

**首条记录摘要**:
```json
{
  "OEJJLDOAICN": 1,
  "MGNHKOHFLPO": "<list[13]>"
}
```

### RestaurantOpEffectConfig.json (0.01 MB, 36 条)

**字段** (6): `EventRewardID, ID, OptionText, Param, ResultText, Type`

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

### RestaurantSpecialCustomer.json (0.01 MB, 35 条)

**字段** (4): `CustomerID, EventConfigPath, SelectEventID, SpecialCustomerID`

**首条记录摘要**:
```json
{
  "SpecialCustomerID": 101,
  "CustomerID": 101,
  "EventConfigPath": "Config/Level/LittleGame/ElfRestaurant/Sp..."
}
```

### RestaurantFacilityUpConfig.json (0.01 MB, 49 条)

**字段** (4): `AbilityIDList, FacilityID, Level, UpgradePrice`

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

**字段** (8): `RogueBuffType, RogueBuffTypeDecoName, RogueBuffTypeIcon, RogueBuffTypeLargeIcon, RogueBuffTypeName, RogueBuffTypeSmallIcon, RogueBuffTypeSubTitle, RogueBuffTypeTitle`

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

### RogueTournConstCommon.json (0.01 MB, 35 条)

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

### RestaurantEmployeeConfig.json (0.01 MB, 11 条)

**字段** (13): `BehaviorID, ConfigID, Detail, EmployeeID, FirstTalk, GroupID, IMGPath, IsShow, Model, NPCID, Name, Type, UnlockIDList`

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

### RogueTournHex.json (0.01 MB, 26 条)

**字段** (7): `AvatarDamageType, AvatarType, DisplayID, ExtraEffect, HexID, MazeBuffID, TournMode`

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

### RogueAeonStoryConfig.json (0.01 MB, 26 条)

**字段** (6): `ActivityModuleID, AeonStory, AeonStoryID, AeonStory_Name, RogueAeonID, UnlockID`

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

### RogueDLCDifficulty.json (0.01 MB, 37 条)

**字段** (3): `DifficultyCutList, DifficultyID, LevelList`

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

### RestaurantTradeOrderConfig.json (0.00 MB, 21 条)

**字段** (6): `CostProductMap, CustomerID, Detail, OrderID, RewardProductMap, UnlockIDList`

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

### RogueTournAvatar.json (0.00 MB, 83 条)

**字段** (2): `AvatarID, SpecialAvatarID`

**首条记录摘要**:
```json
{
  "AvatarID": 1002,
  "SpecialAvatarID": 3711002
}
```

### RogueTournRole.json (0.00 MB, 98 条)

**字段** (2): `AvatarID, BuffID`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "BuffID": 661001
}
```

### RogueActivityResidentConfig.json (0.00 MB, 5 条)

**字段** (14): `ActivityID, ActivityModuleID, ActivityTagList, DisplayItemList, IntroGuideImg, IntroID, RelatedActivityPanelID, ResidentBrief, ResidentDesc, ResidentName, SortWeight, SubMode, TitleIconPath, UnlockID`

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
  "DisplayItemList": "<list[8]>",
  "IntroGuideImg": "SpriteOutput/Quest/PermanentActivity/Det...",
  "IntroID": 12,
  "ActivityTagList": [
    3
  ],
  "SortWeight": 6000,
  "UnlockID": 50017
}
```

### RogueDLCBlockType.json (0.00 MB, 16 条)

**字段** (6): `BlockIntroID, BlockTypeChessBoardColor, BlockTypeChessBoardIcon, BlockTypeID, BlockTypeIcon, BlockTypeNameID`

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

### RogueBuffType.json (0.00 MB, 10 条)

**字段** (7): `HintDesc, RogueBuffType, RogueBuffTypeIcon, RogueBuffTypeSubTitle, RogueBuffTypeTextmapID, RogueBuffTypeTitle, RugueBuffTypeRewardQuestList`

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

### RestaurantSeedConfig.json (0.00 MB, 12 条)

**字段** (11): `BigCropsModelPath, CropsModelPath, GrowTime, ItemID, Name, Price, ProductCount, ProductID, SeedID, SortID, SpecialProductList`

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

### ResourceDeletionUsmList.json (0.00 MB, 76 条)

**字段** (2): `ID, Path`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Path": "CS_Chap_TestRes.usm"
}
```

### RogueDLCLayer.json (0.00 MB, 20 条)

**字段** (4): `LayerID, LayerIcon, LayerNameID, LayerNumID`

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

### RogueTournDivision.json (0.00 MB, 10 条)

**字段** (7): `DivisionHintDesc, DivisionIconPath, DivisionIconPrefabPath, DivisionLevel, DivisionName, DivisionProgress, DivisionSmallIconPath`

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

**字段** (9): `BonusToast, IsBonusUnlock, Layer, MainStoryButtonIcon, MainStoryID, MainStoryName, MainStoryToastType, UnlockAeonDimension, UnlockPoint`

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

### RogueTournFormulaRandom.json (0.00 MB, 141 条)

**字段** (1): `RandomID`

**首条记录摘要**:
```json
{
  "RandomID": 1001
}
```

### RestaurantEventRewardConfig.json (0.00 MB, 25 条)

**字段** (7): `BuffName, DynamicValues, EventDsc, EventType, ID, RewardID, SuperEventType`

**首条记录摘要**:
```json
{
  "ID": 50101,
  "EventType": "CleanTable",
  "BuffName": "",
  "DynamicValues": []
}
```

### RogueNousConstValueClient.json (0.00 MB, 25 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueNous_BoardPage_FuncEntranceIDList",
  "Value": "<dict[1]>"
}
```

### RestaurantFestivalConfig.json (0.00 MB, 11 条)

**字段** (10): `CustomerUpNumber, Detail, FOList, FestivalID, MaterialList, Name, PriceIncrease, TagList, Title, Toast`

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

### RecolorConfig.json (0.00 MB, 45 条)

**字段** (3): `DefaultColor, ID, WhiteBGColor`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "DefaultColor": "#ffffffff",
  "WhiteBGColor": "#ffffffff"
}
```

### RogueRoomType.json (0.00 MB, 9 条)

**字段** (8): `IsSuper, MapShowType, RogueRoomType, RogueRoomTypeIcon, RogueRoomTypeTextmapID, RoomIconEffect, RoomTypeDescTextmapID, RoomTypeDescTextmapID2`

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

### RogueTournRecordShowcase.json (0.00 MB, 13 条)

**字段** (6): `AreaID, DifficultyCompLevel, RankIconLargePath, RankIconPath, RankName, RankTextColor`

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

**字段** (5): `BuffTypeID, FormulaIcon, FormulaSubIcon, UltraFormulaCardIcon, UltraFormulaIcon`

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

### RoguePersonaLayerRoom.json (0.00 MB, 60 条)

**字段** (3): `BKHDBIFFIKP, CBCHIHEOEGK, EEPIDJJJMAH`

**首条记录摘要**:
```json
{
  "CBCHIHEOEGK": 103,
  "EEPIDJJJMAH": 1,
  "BKHDBIFFIKP": 9007
}
```

### RoguePersonaRoomPreset.json (0.00 MB, 35 条)

**字段** (4): `AAGKEBFHLMC, FJIKMHCJMKH, LIIPLGLNPGB, LLICIMBCNPF`

**首条记录摘要**:
```json
{
  "LIIPLGLNPGB": 1001,
  "LLICIMBCNPF": 3,
  "AAGKEBFHLMC": 3,
  "FJIKMHCJMKH": []
}
```

### RaidConfigLD.json (0.00 MB, 4 条)

**字段** (28): `AutoObtainDamageType, BuffParamList, DamageType, EnterType, EntrancePageBGImagePath, FinishEntranceID, IsHiddenAreaMap, LimitIDList, LockCaptain, LockCaptainAvatarID, MainMissionIDAfter, MainMissionIDBefore, MainMissionIDList, MonsterHideList, MonsterList, RaidDesc, RaidID, RaidName, RaidTagList, RaidTargetID, RecoverType, RewardList, SkipRewardOnFinish, TeamLimitIDList, TeamType, TrialAvatarList, Type, UnlockWorldLevel`

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

### RogueTournConstClient.json (0.00 MB, 21 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTourn_Workbench_EnhancementIcon",
  "Value": "<dict[1]>"
}
```

### RogueMonsterEliteDropItem.json (0.00 MB, 27 条)

**字段** (2): `MonsterEliteDropItemDisplayList, MonsterEliteDropItemID`

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

### RelicExpType.json (0.00 MB, 64 条)

**字段** (3): `Exp, Level, TypeID`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Exp": 170
}
```

### RndOptionsData.json (0.00 MB, 13 条)

**字段** (7): `DialogShowOrder, GroupID, ID, JsonPath, MenuItemID, MenuItemType, Weight`

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

### RogueAeon.json (0.00 MB, 9 条)

**字段** (11): `AeonID, ArrivedTalkDialogueGroupID, BattleEventBuffGroup, BattleEventEnhanceBuffGroup, DisplayID, EffectDesc1, EffectDesc2, RogueBuffType, RogueVersion, Sort, UnlockID`

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

### RogueTournAdventureRoom.json (0.00 MB, 32 条)

**字段** (3): `AdventureType, ParamGroupID, RoomID`

**首条记录摘要**:
```json
{
  "RoomID": 21098010,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
}
```

### ReShaRouteDisplay.json (0.00 MB, 6 条)

**字段** (9): `AssistantImagePanelPrefab, AssistantItemID, HiddenRouteClearFloorSavedValueKey, HiddenRouteUnlockFloorSavedValueKey, HintText, ID, NoClueHint, RouteName, RoutePanelPrefab`

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

### RestaurantContactsConfig.json (0.00 MB, 22 条)

**字段** (3): `ContactsID, IconPath, Name`

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

### RogueTournContentDisplay.json (0.00 MB, 30 条)

**字段** (2): `DisplayContent, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 801,
  "DisplayContent": {
    "Hash": 3412936056238852280
  }
}
```

### RogueMagicUnlock.json (0.00 MB, 30 条)

**字段** (3): `RogueUnlockDetail, RogueUnlockID, UnlockFinishWay`

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

### RestaurantProductConfig.json (0.00 MB, 17 条)

**字段** (5): `IsCrops, ItemID, Name, ProductID, UnlockIDList`

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

### RogueDLCSubStoryGroup.json (0.00 MB, 14 条)

**字段** (5): `ShowGroup, SubStoryGroupID, SubStoryGroupName, SubStoryList, UnlockID`

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

### RogueNousAeon.json (0.00 MB, 9 条)

**字段** (9): `AeonID, BattleEventBuffGroup, BattleEventEnhanceBuffGroup, DisplayID, EffectDesc1, EffectParam1, EffectType1, RogueBuffType, Sort`

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

### RogueEventSpecialOption.json (0.00 MB, 13 条)

**字段** (3): `AeonFigure, AeonIcon, SpecialOptionID`

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

### RogueMagicContentDisplay.json (0.00 MB, 39 条)

**字段** (2): `DisplayContent, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 301
}
```

### RelicComposeConfig.json (0.00 MB, 12 条)

**字段** (7): `CoinCost, ID, ItemID, MaterialCost, Order, Type, WorldLevelRequire`

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

**字段** (4): `BaseValue, RelicMainAffix, Type, ValuePerLevel`

**首条记录摘要**:
```json
{
  "RelicMainAffix": "AttackDelta",
  "Type": "Attack",
  "BaseValue": 5.12,
  "ValuePerLevel": 1.792
}
```

### RogueArcadeType.json (0.00 MB, 7 条)

**字段** (6): `ArcadeID, BriefName, Desc, DetailedName, ExitDesc, PicPathList`

**首条记录摘要**:
```json
{
  "ArcadeID": 1,
  "PicPathList": "<list[1]>",
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

### RogueNousDifficultyLevel.json (0.00 MB, 12 条)

**字段** (6): `DifficultyDesc, DifficultyID, DifficultyType, ParamList, Sort, Tag`

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

### RelicBaseType.json (0.00 MB, 7 条)

**字段** (4): `BaseTypeIconPath, BaseTypeText, Type, ValidPropertyList`

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

### RogueDLCMainStoryBranch.json (0.00 MB, 34 条)

**字段** (3): `AeonID, MainStoryBranchID, RogueNPCID`

**首条记录摘要**:
```json
{
  "MainStoryBranchID": 101,
  "RogueNPCID": 100
}
```

### RestaurantQuestGroup.json (0.00 MB, 6 条)

**字段** (7): `CharacterName, Content, IMGPath, Name, QuestGroupID, QuestIDList, UnlockIDList`

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

### RogueNousMainStory.json (0.00 MB, 8 条)

**字段** (9): `DisplayID, Layer, MainStoryName, QuestID, RogueNPCID, StoryGroup, StoryID, TriggerCondition, UnlockConditionDisplay`

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

### RecommendConfig.json (0.00 MB, 10 条)

**字段** (9): `ActivityModuleID, GoodsID, HideAfterSell, ID, ImagePath, NameText, Order, OrderAfterSell, Type`

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

### RogueUpgradeAvatar.json (0.00 MB, 7 条)

**字段** (10): `AvatarLevel, AvatarPromotion, AvatarSkillTreeKey, EquipmentLevel, EquipmentPromotion, RelicSet2AverageLevel, RelicSet2Rarity, RelicSet4AverageLevel, RelicSet4Rarity, WorldLevel`

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

### RogueDLCConstValueClient.json (0.00 MB, 12 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueDLC_BoardPage_FuncEntranceIDList",
  "Value": "<dict[1]>"
}
```

### RogueTournDivisionEffect.json (0.00 MB, 9 条)

**字段** (3): `DescParamList, DescText, DivisionLevel`

**首条记录摘要**:
```json
{
  "DivisionLevel": 1,
  "DescText": {
    "Hash": 5428064629844130967
  },
  "DescParamList": "<list[3]>"
}
```

### RogueDLCConstValueCommon.json (0.00 MB, 19 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueDLC_Recover_ItemCost",
  "Value": "<dict[1]>"
}
```

### RestaurantProgressConfig.json (0.00 MB, 5 条)

**字段** (16): `BaseCustomer, BreakMission, CheckDay, ChefNumber, EmployeeMaxLevel, FarmerNumber, GoalIncome, GoalQuestIDList, MenuNumber, Name, OpenTime, ProgressID, RecipeMaxLevel, TableMaxLevel, TableNumber, WaiterNumber`

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

### RogueTournRoomGroup.json (0.00 MB, 27 条)

**字段** (2): `RoomGroupID, RoomTypeList`

**首条记录摘要**:
```json
{
  "RoomTypeList": []
}
```

### RechargeBenefitData.json (0.00 MB, 24 条)

**字段** (4): `BenefitID, ConsumeNum, GiftName, Reward`

**首条记录摘要**:
```json
{
  "BenefitID": 1001,
  "Reward": 10301
}
```

### RestaurantFieldConfig.json (0.00 MB, 6 条)

**字段** (8): `BigCropsConfigID, BigCropsReplaceConfigIDList, ConfigIDList, FieldID, Price, PropConfigIDList, PropGroupIDList, UnlockIDList`

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

### RogueDLCAeonDimension.json (0.00 MB, 7 条)

**字段** (5): `AeonDimensionID, AeonDimensionMaxPoint, AeonIcon, DimensionIcon, PlayShortDesc`

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

### RogueNousAeonCross.json (0.00 MB, 18 条)

**字段** (5): `BuffGroup, MainAeonID, MainAeonNum, SubAeonID, SubAeonNum`

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

### RoguePersonaConstCommon.json (0.00 MB, 6 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "RogueTournPersona_FixedCompList",
  "Value": "<dict[1]>"
}
```

### RogueTournWorkbenchFunc.json (0.00 MB, 10 条)

**字段** (5): `DisableFuncDesc, FuncDesc, FuncID, FuncName, FuncType`

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

### RestaurantFacilityConfig.json (0.00 MB, 13 条)

**字段** (4): `FacilityID, Name, Type, UnlockIDList`

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

### RogueNousMiscDisplay.json (0.00 MB, 20 条)

**字段** (2): `DisplayContent, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 100,
  "DisplayContent": {
    "Hash": 5745626520447684580
  }
}
```

### RogueDLCAeonCross.json (0.00 MB, 16 条)

**字段** (5): `BuffGroup, MainAeonID, MainAeonNum, SubAeonID, SubAeonNum`

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

### RelicSetBonusValue.json (0.00 MB, 15 条)

**字段** (4): `BonusValue, Property, SetID, Threshold`

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

### RogueTournLayer.json (0.00 MB, 34 条)

**字段** (2): `LayerID, LayerNumID`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "LayerNumID": 101
}
```

### RogueNousStoryReward.json (0.00 MB, 29 条)

**字段** (3): `IsImportant, MainStoryReward, QuestID`

**首条记录摘要**:
```json
{
  "MainStoryReward": 1,
  "QuestID": 6014301
}
```

### RogueShop.json (0.00 MB, 29 条)

**字段** (3): `RogueShopID, ShopType, StageID`

**首条记录摘要**:
```json
{
  "RogueShopID": 100011
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

**字段** (6): `ContactsID, Describe, OpEffect1, OpEffect2, SelectEventID, Type`

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

**字段** (4): `GambleGroupID, GambleGroupIcon, GambleGroupLevel, GambleGroupType`

**首条记录摘要**:
```json
{
  "GambleGroupID": 100,
  "GambleGroupType": "SlotMachine",
  "GambleGroupIcon": ""
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

### RogueMagicLayer.json (0.00 MB, 32 条)

**字段** (2): `LayerID, LayerNumID`

**首条记录摘要**:
```json
{
  "LayerID": 101,
  "LayerNumID": 101
}
```

### RogueTournMiscDisplay.json (0.00 MB, 17 条)

**字段** (2): `DisplayContent, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "DisplayContent": {
    "Hash": 4363364653664122176
  }
}
```

### RogueTournKeywordParam.json (0.00 MB, 9 条)

**字段** (2): `KeywordID, ParamList`

**首条记录摘要**:
```json
{
  "KeywordID": 1615010,
  "ParamList": "<list[3]>"
}
```

### RogueMagicDifficultyComp.json (0.00 MB, 6 条)

**字段** (5): `DifficultyCompID, DifficultyDesc, Level, ParamList, UnlockID`

**首条记录摘要**:
```json
{
  "DifficultyCompID": 10101,
  "UnlockID": 5013005,
  "Level": 1,
  "DifficultyDesc": {
    "Hash": 16020208869497004996
  },
  "ParamList": "<list[3]>"
}
```

### RecordRefresh.json (0.00 MB, 14 条)

**字段** (3): `RefreshID, RefreshTime, RefreshType`

**首条记录摘要**:
```json
{
  "RefreshID": 1,
  "RefreshTime": [
    0
  ]
}
```

### RechargeGiftConfig.json (0.00 MB, 12 条)

**字段** (4): `Discount, DiscountForFiat, GiftIDList, GiftType`

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

### RogueDLCMarkType.json (0.00 MB, 8 条)

**字段** (4): `BlockIntroID, MarkTypeChessBoardIcon, MarkTypeID, MarkTypeNameID`

**首条记录摘要**:
```json
{
  "MarkTypeChessBoardIcon": ""
}
```

### RogueEndlessMegaBuffDesc.json (0.00 MB, 8 条)

**字段** (4): `BuffDesc, BuffPreshowDesc, BuffSimpleDesc, MazeBuffID`

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

**字段** (10): `AddLimitDay, AddLimitParam, BuyPrice, Count, DeleteIDList, IsDiscount, LimitCount, ProductID, ShopItemID, UnlockIDList`

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

### RogueDLCEntrance.json (0.00 MB, 3 条)

**字段** (7): `ButtonPath, ID, PatternBgPath, RewardList, SubType, SubTypeTitle, SwitchBannerImgPath`

**首条记录摘要**:
```json
{
  "ID": 1,
  "SubType": "ChessRogue",
  "SubTypeTitle": {
    "Hash": 2527403513851859277
  },
  "RewardList": "<list[9]>",
  "ButtonPath": "UI/Rogue/Widget/RoguePlanetDlcSelect1.pr...",
  "PatternBgPath": "UI/Rogue/Widget/RogueDlcPatternBg1.prefa...",
  "SwitchBannerImgPath": "SpriteOutput/Rogue/Planet/Dlc/IconRogueS..."
}
```

### RogueMagicWorkbenchFunc.json (0.00 MB, 5 条)

**字段** (5): `FuncDesc, FuncID, FuncIcon, FuncName, FuncType`

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

### RogueDLCMainStoryReward.json (0.00 MB, 14 条)

**字段** (5): `IsImportant, MainStoryID, MainStoryReward, QuestID, Sort`

**首条记录摘要**:
```json
{
  "MainStoryReward": 1,
  "IsImportant": 1,
  "Sort": 1,
  "QuestID": 6013301
}
```

### RogueDestroyProp.json (0.00 MB, 10 条)

**字段** (4): `GameTime, ParamGroupID, PrepareTime, ScoreRange`

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

### RechargeGiftData.json (0.00 MB, 19 条)

**字段** (6): `Days, GiftID, McoinFree, McoinPay, RewardsFree, RewardsPay`

**首条记录摘要**:
```json
{
  "GiftID": 10010,
  "RewardsPay": 10101,
  "RewardsFree": 10102
}
```

### RogueArcade.json (0.00 MB, 10 条)

**字段** (4): `AdventureType, ArcadeID, ArcadeRoomID, ParamGroupID`

**首条记录摘要**:
```json
{
  "ArcadeRoomID": 100001,
  "ArcadeID": 1,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
}
```

### RecommendDisplay.json (0.00 MB, 6 条)

**字段** (5): `EnvironmentProfilePath, ID, IntroID, UI3DPrefab, UIPrefab`

**首条记录摘要**:
```json
{
  "ID": 10,
  "UIPrefab": "",
  "UI3DPrefab": "UI/UI3D/ShopActivity/UI3D_ShopGiftPack2_...",
  "EnvironmentProfilePath": "",
  "IntroID": 204
}
```

### RelicSubAffixBaseValue.json (0.00 MB, 12 条)

**字段** (3): `BaseValue, RelicSubAffix, Type`

**首条记录摘要**:
```json
{
  "RelicSubAffix": "AttackDelta",
  "Type": "Attack",
  "BaseValue": 1.728
}
```

### RoguePersonaTalentGroup.json (0.00 MB, 6 条)

**字段** (3): `MJOOFPBABEA, OLOIFNNLKJP, PHFMCACHFIJ`

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

### RogueAeonListConfig.json (0.00 MB, 14 条)

**字段** (4): `ActivityModuleID, DisplayID, RogueAeonID, Sort`

**首条记录摘要**:
```json
{
  "RogueAeonID": 1,
  "DisplayID": 1,
  "Sort": 1
}
```

### RogueNousDiceSlot.json (0.00 MB, 6 条)

**字段** (5): `ExtraMaxRarity, MaxRarity, SlotID, SlotName, UpgradedSlotName`

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

### RandomEventChoice.json (0.00 MB, 8 条)

**字段** (6): `ChoiceID, EventBuffDay, EventCostOption, EventRewardBuff, IsCancel, Option`

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

### RogueMagicGambleUnit.json (0.00 MB, 7 条)

**字段** (4): `GambleUnitID, GambleUnitIcon, GambleUnitParam, GambleUnitType`

**首条记录摘要**:
```json
{
  "GambleUnitID": 101,
  "GambleUnitType": "MagicUnitRare",
  "GambleUnitParam": 1102,
  "GambleUnitIcon": "SpriteOutput/BuffIcon/Inlevel/Icon301402..."
}
```

### RogueTournWorkbench.json (0.00 MB, 14 条)

**字段** (2): `FuncList, WorkbenchID`

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

### RogueHandbookMiracleType.json (0.00 MB, 5 条)

**字段** (4): `ActivityModuleID, RogueHandbookMiracleType, RogueMiracleTypeTitle, TypeIcon`

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

### RogueNousValueAreaLimit.json (0.00 MB, 13 条)

**字段** (3): `AreaID, MaxNousValue, MinNousValue`

**首条记录摘要**:
```json
{
  "AreaID": 301,
  "MinNousValue": -20,
  "MaxNousValue": 20
}
```

### RogueHandBookEventType.json (0.00 MB, 5 条)

**字段** (4): `ActivityModuleID, RogueEventTypeTitle, RogueHandBookEventType, TypeIcon`

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

**字段** (3): `Sort, TagID, TagName`

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

### RogueHandbookType.json (0.00 MB, 4 条)

**字段** (4): `HandBookIconPath, HandBookType, RogueHandBookDesc, RogueHandBookType`

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

### RollShopConfig.json (0.00 MB, 3 条)

**字段** (12): `CostItemID, CostItemNum, IntroduceID, RollShopID, RollShopType, SecretGroupID, ShopName, SpecialGroupList, T1GroupID, T2GroupID, T3GroupID, T4GroupID`

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

### RogueDialogueDynamicDisplay.json (0.00 MB, 10 条)

**字段** (2): `ContentText, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 120,
  "ContentText": {
    "Hash": 6178763687218641443
  }
}
```

### RogueNousMissionReward.json (0.00 MB, 5 条)

**字段** (3): `MissionRewardID, QuestList, TabTitle`

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

### RaidLimitCondition.json (0.00 MB, 6 条)

**字段** (6): `ID, LimitDesc, LimitType, ParamInt1, ParamIntList, ParamType`

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

### RogueTournExhibitionConfig.json (0.00 MB, 12 条)

**字段** (3): `Floor, PaintingID, Type`

**首条记录摘要**:
```json
{
  "PaintingID": 1,
  "Type": "Narrow",
  "Floor": "Floor1"
}
```

### RogueMagicAdventureRoom.json (0.00 MB, 9 条)

**字段** (3): `AdventureType, ParamGroupID, RoomID`

**首条记录摘要**:
```json
{
  "RoomID": 11001,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 301001
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

### RogueCommonModeTitle.json (0.00 MB, 5 条)

**字段** (3): `SubMode, TitleIconPath, TitleTextmapID`

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

### RogueMagicStyleTypeSelect.json (0.00 MB, 4 条)

**字段** (5): `DisplayID, EnumDesc, EnumType, IconPath, UnlockID`

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

### RogueDLCAdventureRoom.json (0.00 MB, 8 条)

**字段** (3): `AdventureType, ParamGroupID, RoomID`

**首条记录摘要**:
```json
{
  "RoomID": 2320601,
  "AdventureType": "RogueCaptureMonster",
  "ParamGroupID": 2001
}
```

### RestaurantFOConfig.json (0.00 MB, 6 条)

**字段** (3): `AvatarID, FOID, IMGPath`

**首条记录摘要**:
```json
{
  "FOID": 101,
  "AvatarID": 1403,
  "IMGPath": "SpriteOutput/Quest/ElfRestaurant/AvatarD..."
}
```

### RogueTournModule.json (0.00 MB, 9 条)

**字段** (3): `ActivityModuleID, MainTournID, SubTournID`

**首条记录摘要**:
```json
{
  "MainTournID": 1,
  "SubTournID": 1,
  "ActivityModuleID": 6001101
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

### RogueNousDiceBranchTag.json (0.00 MB, 4 条)

**字段** (3): `BranchTagName, TagID, TagIcon`

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

### RogueNousEndGameReward.json (0.00 MB, 2 条)

**字段** (5): `EndGameRewardID, QuestID, QuestList, TabTitle, UnlockID`

**首条记录摘要**:
```json
{
  "EndGameRewardID": 1,
  "TabTitle": {
    "Hash": 1466611023929028975
  },
  "QuestList": "<list[12]>",
  "QuestID": 6014338,
  "UnlockID": 1001007
}
```

### RestaurantEmojiConfig.json (0.00 MB, 6 条)

**字段** (2): `EmojiPath, EmojiType`

**首条记录摘要**:
```json
{
  "EmojiType": "Disappointed",
  "EmojiPath": "SpriteOutput/EmojiCommon/EmojiCurrency/E..."
}
```

### RogueTournDifficultyComp.json (0.00 MB, 8 条)

**字段** (3): `AAGKEBFHLMC, ADHGMAGMGJE, HILINOJPLGA`

**首条记录摘要**:
```json
{
  "ADHGMAGMGJE": 10101,
  "HILINOJPLGA": "Tourn1",
  "AAGKEBFHLMC": 1
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

### RogueMagicMiscDisplay.json (0.00 MB, 7 条)

**字段** (2): `DisplayContent, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "DisplayContent": {
    "Hash": 18225913322700411644
  }
}
```

### RestaurantFarmConfig.json (0.00 MB, 3 条)

**字段** (6): `FarmID, FieldIDList, ManagerEmployeeID, Name, Type, UnlockIDList`

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

### RaidTypeConfig.json (0.00 MB, 10 条)

**字段** (3): `FinishCountDown, FinishType, RaidType`

**首条记录摘要**:
```json
{
  "RaidType": "Mission",
  "FinishType": "RaidMissionFinish"
}
```

### RechargeBenefitConfig.json (0.00 MB, 3 条)

**字段** (4): `ActivityModuleID, BenefitIDList, ID, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "SecondAnniversary",
  "ActivityModuleID": 5003801,
  "BenefitIDList": "<list[8]>"
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

### RogueEscapeLaser.json (0.00 MB, 2 条)

**字段** (7): `GameTimeperRound, ParamGroupID, PrepareTime, ScoreRange, ScoreperRound, ScoreperWave, TotalRounds`

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

### RogueTournAreaGroupByTourn.json (0.00 MB, 3 条)

**字段** (4): `ANBDGFJDBPF, HILINOJPLGA, JFMBIOOCPIL, OENAMINOLLF`

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

### RogueUpgradeAvatarEquipment.json (0.00 MB, 8 条)

**字段** (2): `AvatarBaseType, EquipmentID`

**首条记录摘要**:
```json
{
  "AvatarBaseType": "Priest",
  "EquipmentID": 21021
}
```

### RogueDLCDiceSurfaceRarity.json (0.00 MB, 3 条)

**字段** (3): `DiceSurfaceRarityImage, NameColor, Rarity`

**首条记录摘要**:
```json
{
  "Rarity": 1,
  "NameColor": "#73b0f4",
  "DiceSurfaceRarityImage": "SpriteOutput/UI/Rogue/DLC/Dice/DiceSufac..."
}
```

### RogueCaptureMonster.json (0.00 MB, 3 条)

**字段** (5): `GameTime, MonsterNum, ParamGroupID, PrepareTime, ScoreRange`

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

### RaidPerformance.json (0.00 MB, 5 条)

**字段** (3): `PerformanceID, PerformanceType, RaidID`

**首条记录摘要**:
```json
{
  "RaidID": 40233001,
  "PerformanceID": 102150109,
  "PerformanceType": "A"
}
```

### RogueTournUseBuffType.json (0.00 MB, 3 条)

**字段** (2): `TournMode, UseBuffTypeList`

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

### RestaurantTagConfig.json (0.00 MB, 4 条)

**字段** (3): `ColorID, Name, TagID`

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

### RogueTournCollectionConfig.json (0.00 MB, 8 条)

**字段** (2): `Floor, PillarID`

**首条记录摘要**:
```json
{
  "PillarID": 1,
  "Floor": "Floor1"
}
```

### RogueMagicWorkbench.json (0.00 MB, 4 条)

**字段** (2): `FuncList, WorkbenchID`

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

### RogueTournAreaGroup.json (0.00 MB, 2 条)

**字段** (3): `ANBDGFJDBPF, JFMBIOOCPIL, OENAMINOLLF`

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

### ReportType.json (0.00 MB, 4 条)

**字段** (2): `Text, TypeID`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Text": {
    "Hash": 13868038024686836006
  }
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

### RogueCandyCrash.json (0.00 MB, 2 条)

**字段** (5): `ParamGroupID, PrepareTime, RoundRange, TotalRounds, TotalTime`

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

**字段** (3): `AdventureType, ParamGroupID, RoomID`

**首条记录摘要**:
```json
{
  "RoomID": 1000006,
  "AdventureType": "RogueDestroyProp",
  "ParamGroupID": 101001
}
```

### RogueGuideActivityPanelData.json (0.00 MB, 4 条)

**字段** (3): `ActivityID, AvatarID, RogueAreaID`

**首条记录摘要**:
```json
{
  "ActivityID": 60001,
  "AvatarID": 1013
}
```

### RelicExpItem.json (0.00 MB, 4 条)

**字段** (3): `CoinCost, ExpProvide, ItemID`

**首条记录摘要**:
```json
{
  "ItemID": 231,
  "ExpProvide": 100,
  "CoinCost": 150
}
```

### RogueMagicLayerEffect.json (0.00 MB, 1 条)

**字段** (4): `DescParamList, LayerEffectDesc, LayerEffectID, LayerEffectName`

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

### RestartBattleBlackList.json (0.00 MB, 5 条)

**字段** (1): `EventID`

**首条记录摘要**:
```json
{
  "EventID": 20001001
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

### RogueImmerseLevel.json (0.00 MB, 2 条)

**字段** (2): `Level, UnlockID`

**首条记录摘要**:
```json
{
  "Level": 1,
  "UnlockID": 12001
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

### RogueMagicMiracleDisplay.json (0.00 MB, 0 条)

### RogueMiracleDisplayTest.json (0.00 MB, 0 条)

### RogueMiracleEffectTest.json (0.00 MB, 0 条)

### RogueTournMiracleGroupTest.json (0.00 MB, 0 条)

### RogueTournMiracleTest.json (0.00 MB, 0 条)
