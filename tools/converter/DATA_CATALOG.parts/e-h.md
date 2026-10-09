# DATA_CATALOG 分片：文件名首字母 EFGH

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 e-h（共 385 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### GridFightFrontSkill.json (6.05 MB, 4,052 条)

**字段** (34): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, HideInUI, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
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
  "ParamList": "<list[6]>",
  "SimpleParamList": "<list[6]>",
  "SkillEffect": "Impair"
}
```

### FreeStyleMotion.json (3.63 MB, 7,972 条)

**字段** (7): `FreeStyleCharacterID, ID, LoopMotionPath, LoopMotionRibbonPath, StartMotion, StartMotionPath, StartMotionRibbonPath`

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

### FinishWay.json (1.26 MB, 5,798 条)

**字段** (13): `FinishType, ID, IsBackTrack, MazeFloorID, MazePlaneID, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

### FunNumMultiplier.json (0.75 MB, 10,000 条)

**字段** (2): `FunNum, Multiplier`

**首条记录摘要**:
```json
{
  "Multiplier": {
    "Value": 1
  }
}
```

### EquipmentPromotionConfig.json (0.65 MB, 1,190 条)

**字段** (12): `BaseAttack, BaseAttackAdd, BaseDefence, BaseDefenceAdd, BaseHP, BaseHPAdd, EquipmentID, MaxLevel, PlayerLevelRequire, Promotion, PromotionCostList, WorldLevelRequire`

**首条记录摘要**:
```json
{
  "EquipmentID": 20000,
  "PromotionCostList": "<list[2]>",
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

### GridFightBackBESkillConfig.json (0.55 MB, 446 条)

**字段** (24): `AttackType, BPAdd, BPNeed, CutinPath, DelayRatio, ParamList, SPBase, SPMultipleRatio, SPNeed, ShowStanceList, SimpleParamList, SimpleSkillDesc, SkillButtonEffType, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
  "SPMultipleRatio": {
    "Value": 0.5
  },
  "BPNeed": {
    "Value": -1
  },
  "DelayRatio": {
    "Value": 1
  },
  "ParamList": "<list[7]>",
  "SimpleParamList": "<list[7]>",
  "AttackType": "BPSkill",
  "SkillEffect": "Defence",
  "SkillButtonEffType": ""
}
```

### GridFightRoleStar.json (0.41 MB, 266 条)

**字段** (27): `AIPath, BEID, BESkillIDList, BackAbilityName, BackEnergyBar, BackInitialEnergyBar, BackInitialSP, BackMaxSP, BackOneWordDesc, BackParamList, BackPowerBase, BackShowSkillIDList, ExtraHealBase, ExtraShieldBase, FrontOneWordDesc, FrontPowerBase, FrontShowSkillIDList, GeneralPropertyModifyList, ID, JsonOverrideConfig, LuckChance, LuckDamage, ShowStanceList, SkillOverrideDest, SkillOverrideSrc, StanceDamageDisplay, Star`

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
  "GeneralPropertyModifyList": "<list[4]>",
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

### FateMazeBuff.json (0.39 MB, 383 条)

**字段** (18): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, DisplayType, ID, InBattleBindingKey, InBattleBindingType, IsDisplayEnvInLevel, Lv, LvMax, MazeBuffIconType, MazeBuffType, ModifierName, ParamList`

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
  "ParamList": "<list[4]>",
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

### EquipmentSkillConfig.json (0.38 MB, 850 条)

**字段** (7): `AbilityName, AbilityProperty, Level, ParamList, SkillDesc, SkillID, SkillName`

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

### HardLevelGroup.json (0.37 MB, 745 条)

**字段** (10): `AttackRatio, CombatPowerList, DefenceRatio, HPRatio, HardLevelGroup, Level, SpeedRatio, StanceRatio, StatusProbability, StatusResistance`

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
  "CombatPowerList": "<list[4]>"
}
```

### EliteGroup.json (0.35 MB, 1,423 条)

**字段** (6): `AttackRatio, DefenceRatio, EliteGroup, HPRatio, SpeedRatio, StanceRatio`

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

### EvoBdSCMazeBuff.json (0.34 MB, 315 条)

**字段** (17): `BuffDesc, BuffDescBattle, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffIconType, MazeBuffType, ModifierName, ParamList`

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
  "ParamList": "<list[20]>",
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

### GridFightRankAttachment.json (0.30 MB, 1,596 条)

**字段** (4): `GeneralPropertyModifyList, Rank, RoleID, Star`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "Rank": 1,
  "Star": 1,
  "GeneralPropertyModifyList": "<list[1]>"
}
```

### EvolveBuildMazeBuff.json (0.28 MB, 248 条)

**字段** (17): `BuffDesc, BuffDescBattle, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffIconType, MazeBuffType, ModifierName, ParamList`

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
  "ParamList": "<list[20]>",
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

### GridFightEnemyDifficultyLv.json (0.26 MB, 903 条)

**字段** (7): `AttackRatio, ChapterID, DefenceRatio, EnemyDifficultyLevel, HPRatio, SpeedRatio, StanceRatio`

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

**字段** (7): `ConditionDesc, ConditionSimpleDesc, ExtraEffectIDList, ParamList, SimpleExtraEffectIDList, SimpleParamList, SkillID`

**首条记录摘要**:
```json
{
  "SkillID": 10010201,
  "ConditionDesc": {
    "Hash": 11085778083433463291
  },
  "ParamList": "<list[7]>",
  "ConditionSimpleDesc": {
    "Hash": 10307392774845083218
  },
  "SimpleParamList": "<list[7]>",
  "ExtraEffectIDList": [],
  "SimpleExtraEffectIDList": []
}
```

### GridFightAugment.json (0.24 MB, 334 条)

**字段** (15): `AugmentGameRefScore, AugmentGameRefTrait, AugmentSavedValueList, AugmentSearchKey, CategoryID, ChapterLimitList, EffectParamList, HexDesc, HexName, ID, IconPath, IsOCEffective, JsonPath, MiniIconPath, Quality`

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

### HeliobusComment.json (0.18 MB, 909 条)

**字段** (8): `CommentOptionTextID, HeliobusCommentID, HeliobusCommentTextID, HeliobusUserID, IsPlayerComment, PlayerCommentIDList, ReplyIncomeReward, Tendency`

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

### GachaBasicInfo.json (0.18 MB, 292 条)

**字段** (12): `EndTime, GachaID, GachaType, PoolDesc, PoolDescFTC, PoolLabelIcon, PoolLabelIconSelected, PoolName, PrefabPath, SortID, StartTime, TypeTitle`

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

### GridFightServantSkill.json (0.17 MB, 132 条)

**字段** (25): `AttackType, DelayRatio, ExtraEffectIDList, Level, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
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
  "ParamList": "<list[7]>",
  "SimpleParamList": "<list[7]>",
  "StanceDamageType": "Ice",
  "AttackType": "Servant",
  "SkillEffect": "AoEAttack"
}
```

### GridFightBackRoleRank.json (0.15 MB, 252 条)

**字段** (14): `AllMemberGeneralPropertyList, Desc, DescParamList, ExtraEffectIDList, IconPath, ModifyEnergyBar, ModifySkillList, Name, OwnerGeneralPropertyList, Param, Rank, RankAbility, RankID, Trigger`

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
  "OwnerGeneralPropertyList": "<list[1]>",
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

### GridFightTraitLayerOld.json (0.14 MB, 378 条)

**字段** (8): `AllMemberPropertyList, ExistSeason, Layer, MazebuffID, PropertyBindType, Quality, TraitID, TraitMemberPropertyList`

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

### GridFightEquipment.json (0.13 MB, 148 条)

**字段** (15): `AbilityName, DressRule, DressRuleParamList, EffectParamList, EquipCategory, EquipDesc, EquipFunc, EquipFuncParamList, EquipType, EquipmentTagList, GeneralPropertyList, ID, IsDisplaySpecialParam, JsonPath, ParamList`

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
  "GeneralPropertyList": "<list[1]>",
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

### HeartDialTalk.json (0.13 MB, 989 条)

**字段** (5): `FloorIDList, ID, IsKaomoji, SDFText, VoiceID`

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

### EquipmentConfig.json (0.12 MB, 170 条)

**字段** (18): `AvatarBaseType, AvatarDetailOffset, BattleDialogOffset, CoinCost, EquipmentID, EquipmentName, ExpProvide, ExpType, GachaResultOffset, ImagePath, ItemRightPanelOffset, MaxPromotion, MaxRank, RankUpCostList, Rarity, Release, SkillID, ThumbnailPath`

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

### GridFightTraitMazebuff.json (0.10 MB, 158 条)

**字段** (15): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, BuffSimpleDesc, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### GotoConfig.json (0.10 MB, 768 条)

**字段** (6): `GotoType, ID, ParamIntList, ParamStringList, UnlockID, UnlockMainMission`

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

### GridFightBasicBonusPoolV2.json (0.10 MB, 811 条)

**字段** (5): `BonusID, BonusType, BonusTypeParam, BonusTypeParamList, Value`

**首条记录摘要**:
```json
{
  "BonusID": 1,
  "Value": 1,
  "BonusTypeParam": 1,
  "BonusTypeParamList": []
}
```

### EmojiConfig.json (0.10 MB, 487 条)

**字段** (8): `EmojiGroupID, EmojiID, EmojiPath, Gender, GenderLink, IsTrainMembers, KeyWords, SameGroupOrder`

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

### ExtraEffectConfig.json (0.09 MB, 315 条)

**字段** (6): `DescParamList, ExtraEffectDesc, ExtraEffectID, ExtraEffectIconPath, ExtraEffectName, ExtraEffectType`

**首条记录摘要**:
```json
{
  "ExtraEffectID": 10000000,
  "ExtraEffectName": {
    "Hash": 7512346344860791758
  },
  "ExtraEffectDesc": {
    "Hash": 10083305102969301560
  },
  "DescParamList": [],
  "ExtraEffectIconPath": "SpriteOutput/BuffIcon/Inlevel/IconBuffCo...",
  "ExtraEffectType": 2
}
```

### FateRinHouguConfig.json (0.09 MB, 107 条)

**字段** (22): `AHONBLHLHIO, GBOMPEGMLEN, GINFOPOAKHK, GMPGDEINODK, HHBNIODGKKE, IJEJGCEAFAF, JKCHLJNLLNA, KALCGCPPMBD, KEDLONFFJHO, NALMBOOCCIN, NHALJPDONCP, NOFHEEJMCLH, OCMHKMFBLJN, OENAMINOLLF, OICGFNGNLOE, OKCCPDBENOJ, OLOIFNNLKJP, PBLPLDJKPEI, PDLFPMJCLDF, PHFMCACHFIJ, PLHINENDNDO, PMIEAEGJNMJ`

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

### FateMasterTalk.json (0.09 MB, 329 条)

**字段** (8): `BIFDDEDBGAL, HHDKOKBHBCA, KLAGNGDGAIC, LJPJOPFFGGF, MGNIIAODKMF, NFIKBPNJGDG, NNDOABPFDMI, OKHNDIGJMIG`

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

**字段** (7): `BasicGoldRewardNum, IsAugment, NodeTemplateID, NodeType, ParamList, PenaltyBonusRuleID, StageID`

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

### FuncUnlockData.json (0.08 MB, 486 条)

**字段** (3): `Conditions, ShowCondition, UnlockID`

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

### GridFightBackEquipment.json (0.08 MB, 165 条)

**字段** (8): `AllMemberGeneralPropertyList, BackEquipmentDesc, EquipmentID, Level, OwnerGeneralPropertyList, ParamFormat, ParamList, RoleID`

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
  "OwnerGeneralPropertyList": "<list[1]>"
}
```

### GFTraitElationTemplate.json (0.07 MB, 272 条)

**字段** (5): `FirstRecommendEquipList, ID, PreEquipList, SecondRecommendEquipList, Weight`

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

### GridFightTraitLayer.json (0.07 MB, 152 条)

**字段** (10): `AllMemberPropertyList, Layer, MazebuffID, OverrideBEPropertyList, PropertyBindType, PropertyDesc, PropertyParamList, Quality, TraitID, TraitMemberPropertyList`

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

**字段** (15): `AbilityList, ActionBarDescrptionText, AssetPackName, BEActionBarType, BattleEventID, BattleEventName, DescrptionText, EliteGroup, EventSubType, HardLevel, HeadIcon, OverrideProperty, ParamList, Speed, Team`

**首条记录摘要**:
```json
{
  "BattleEventID": 62200,
  "Team": "TeamNeutral",
  "EventSubType": "GridFightCountDownWarningEvent",
  "BattleEventName": "BattleEventName_62200",
  "HeadIcon": "SpriteOutput/AvatarIconTeam/999.png",
  "AbilityList": "<list[2]>",
  "OverrideProperty": "<list[1]>",
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

### HeartDialScript.json (0.07 MB, 153 条)

**字段** (11): `ControlDialogueID, DefaultEmoType, FullDialogueID, LockDialogueID, MissingDialogueID, MissingEmoList, RaidID, ScriptID, StepList, TotalEmoInfoList, UnLockDialogueID`

**首条记录摘要**:
```json
{
  "ScriptID": 10001,
  "TotalEmoInfoList": "<list[3]>",
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

**字段** (11): `AvatarID, BackendRankList, ChargeType, EquipmentID, ExistSeason, FrontBackType, ID, MaxSPIcon, Rarity, SpecialAvatarID, TraitList`

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
  "BackendRankList": "<list[6]>",
  "SpecialAvatarID": 3701001
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

**字段** (11): `CanDispel, ModifierName, ReadParamList, StatusDesc, StatusEffect, StatusID, StatusIconPath, StatusIconPathHighSize, StatusName, StatusType, TagList`

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

### FarmElementConfig.json (0.05 MB, 203 条)

**字段** (10): `AutoObtainDamageType, DamageType, DropList, ID, MappingInfoID, MaxChallengeCnt, ParamList, StageID, StaminaCost, WorldLevel`

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

### EndmostChroniclePerformance.json (0.05 MB, 547 条)

**字段** (4): `EndmostChronicleID, ID, Order, Type`

**首条记录摘要**:
```json
{
  "ID": 103010102,
  "Type": "D",
  "EndmostChronicleID": 1030101,
  "Order": 1
}
```

### HeliobusPost.json (0.05 MB, 33 条)

**字段** (15): `HeliobusPostContent, HeliobusPostID, HeliobusPostTitle, HeliobusUserID, IsClosePanel, Likes, PlayerCommentIDList, PostFansPreview, PostFansReward, PostImgID, PostIncomeReward, PostType, PostTypeParameter, PostUnlockPhase, PostUnlockSubMissionIDList`

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
  "Likes": "<list[15]>",
  "PlayerCommentIDList": [
    10100
  ],
  "PostIncomeReward": 8005001,
  "PostFansPreview": {
    "Hash": 6624939037943933109
  },
  "PostFansReward": "<dict[10]>",
  "IsClosePanel": true
}
```

### EventMission.json (0.05 MB, 108 条)

**字段** (15): `ClearGroupList, Desc, FinishWayID, ID, LoadGroupList, MazeFloorID, MazePlaneID, MissionJsonPath, NextEventMissionList, RewardID, TakeParamIntList, TakeType, Title, Type, UnLoadGroupList`

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

### GridFightPortalBuff.json (0.05 MB, 84 条)

**字段** (14): `DelayedShowBonus, EffectParamList, ID, IconPath, IfInBook, IsOCEffective, JsonPath, PortalBuffDesc, PortalBuffTitle, PortalGameRefScore, PortalGameRefTrait, ShowBonusID, ShowBonusIDList, ShowNpcIDList`

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

**字段** (14): `BattleArea, CountdownList, DeadLinePosition, EmotionList, EventID, PeriodRank, PeriodScore, SpecialMonsterScoreList, StageID, StagePeriodID, StageScore, WaveCount, WeaknessList, Weight`

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
  "WeaknessList": "<list[7]>",
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

### GridFightDivisionStage.json (0.05 MB, 97 条)

**字段** (15): `AffixChooseNumList, BinaryNodeDiffAddRule, DivisionID, EnemyDifficultyLevel, EnvironmentBuffList, EnvironmentDescList, ExpModify, JsonPath, LevelBaseAttackMultiRatio, LevelBaseHPMultiRatio, OCScoreRule, ScoreRule, SeasonID, UniqueEnvironmentDescList, WeeklyScoreModify`

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

### EvolveBuildStagePeriod.json (0.05 MB, 57 条)

**字段** (14): `BattleArea, CountdownList, DeadLinePosition, EmotionList, EventID, PeriodRank, PeriodScore, SpecialMonsterScoreList, StageID, StagePeriodID, StageScore, WaveCount, WeaknessList, Weight`

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
  "WeaknessList": "<list[7]>",
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

### FinishWayRogue.json (0.04 MB, 213 条)

**字段** (11): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

**字段** (4): `ChapterID, ID, NodeTemplateID, SectionID`

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

**字段** (9): `AvatarReviveDelayLose, HPProgressValueList, ID, ProgressPenaltyCoefficient, ProgressValueList, ThresholdFailPlayerHPPenalty, ThresholdPassBasicPlayerHPPenalty, ThresholdPosition, TotalTurn`

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

### GameplayGuideData.json (0.04 MB, 112 条)

**字段** (12): `ID, IconPath, MapEntranceID, Name, Order, OverrideShowCondition, RelatedID, ShowItemAmount, SubType, TabID, TabIconPath, UnlockMission`

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

### GridFightAffixMazebuff.json (0.04 MB, 71 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### HeartDialDialogue.json (0.04 MB, 700 条)

**字段** (3): `ControlTalkList, ID, RewardID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "ControlTalkList": []
}
```

### GridFightItems.json (0.04 MB, 166 条)

**字段** (5): `ID, IconPath, ItemName, ItemPriority, SmallIconPath`

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

**字段** (7): `BEActionBarPrefab, BasePoint, BattleEventID, Config, LevelAreaPrefab, Prefab, SkillIDList`

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

### GridFightRoleBasicInfo.json (0.04 MB, 77 条)

**字段** (17): `AvatarID, BackendRankList, ChargeType, EquipmentID, FrontBackType, HealOrShieldDisplay, ID, IsExpert, IsInBook, IsInPool, MaxSPIcon, Rarity, RoleSavedValueList, SeasonID, SeasonIDList, SpecialAvatarID, TraitList`

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
  "BackendRankList": "<list[6]>",
  "SpecialAvatarID": 3701001,
  "SeasonID": 1,
  "RoleSavedValueList": [
    "GP_Avatar_Mar_7th_01"
  ]
}
```

### FuncEntrance.json (0.04 MB, 80 条)

**字段** (16): `FirstWorldText, FuncHudIconPath, FuncIconPath, FuncName, GotoID, ID, IsLargeBtn, NotInScheduleToast, ParentSystem, RedDot, RedDotHud, UnLockIconPath, UnlockDesc, UnlockID, UnlockMainMission, UnlockPrompt`

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

### GridFightCombinationBonus.json (0.04 MB, 230 条)

**字段** (3): `BonusID, BonusNumberList, CombinationBonusList`

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

**字段** (7): `DynamicIndexList, GearID, IndexList, Level, MazeBuffID, SimpIndexList, Type`

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

**字段** (6): `AttackRatio, DefenceRatio, EliteGroup, HPRatio, SpeedRatio, StanceRatio`

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

**字段** (12): `BACLIEMHMDK, BEOGEKDEPLO, EFAIIOHKFGD, ENHOJEFAFNM, GDLBCMFFGOI, GDLLGLFCEHC, IGOAKKNPDKK, KBNHPKIOGLH, KJOAJDBDOBN, LBLJLNPBDPB, MDEBFIFOKHH, PHFPFCALNDJ`

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

**字段** (5): `CategoryTagList, FrontBackType, IconPath, Name, RoleID`

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

### GuideChallengeData.json (0.04 MB, 102 条)

**字段** (8): `ID, IconPath, MapEntranceID, Name, RelatedID, TabID, TabIconPath, UnlockConditions`

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

### FiveDimPuzzleChallenge.json (0.04 MB, 52 条)

**字段** (15): `ActiveDescText, ActiveNameText, DescText, FinishDescText, FinishNameText, FloorID, GroupID, InstanceID, NameText, ProgressGPList, ProgressLimit, PuzzleID, PuzzleStateGP, RelatedMissionIDList, UIActiveGP`

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
  "ProgressGPList": "<list[3]>",
  "ProgressLimit": 3,
  "RelatedMissionIDList": []
}
```

### GridFightAugmentMazebuff.json (0.03 MB, 58 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### GridFightRoleRecommendEquip.json (0.03 MB, 154 条)

**字段** (4): `FirstRecommendEquipList, FrontBackType, RoleID, SecondRecommendEquipList`

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

### GridFightElationEquip.json (0.03 MB, 126 条)

**字段** (3): `ElationEquipDesc, ID, ParamList`

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

### EvolveBuildGearConfig.json (0.03 MB, 181 条)

**字段** (7): `DynamicIndexList, GearID, IndexList, Level, MazeBuffID, SimpIndexList, Type`

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

**字段** (3): `BEParamList, MazebuffID, ShowStanceList`

**首条记录摘要**:
```json
{
  "MazebuffID": 35100101,
  "ShowStanceList": "<list[3]>",
  "BEParamList": "<list[5]>"
}
```

### GridFightTraitRemark.json (0.03 MB, 58 条)

**字段** (10): `ConditionParamList, ConditionType, Format, ID, IsInBook, Position, TextOrder, TraitRemark, TraitRemarkParamList, TraitSimpleRemark`

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
  "TraitRemarkParamList": "<list[13]>",
  "IsInBook": true
}
```

### ExpeditionBattleDisplay.json (0.03 MB, 97 条)

**字段** (6): `AvatarID, BattleEmojiPath, CommonTalk, EmojiPath, StartTalk, VictoryTalk`

**首条记录摘要**:
```json
{
  "AvatarID": 1001,
  "EmojiPath": "SpriteOutput/Emoji/101002.png",
  "BattleEmojiPath": "SpriteOutput/UI/Quest/ExpeditionBattle/A...",
  "VictoryTalk": {
    "Hash": 16114976940113416221
  },
  "CommonTalk": {
    "Hash": 4569316468101330838
  },
  "StartTalk": {
    "Hash": 16119197816245095298
  }
}
```

### FreeStyleCharacterInfo.json (0.03 MB, 301 条)

**字段** (3): `AvatarBodyID, AvatarFlagID, FreeStyleCharacterID`

**首条记录摘要**:
```json
{
  "FreeStyleCharacterID": "NPC_Male",
  "AvatarFlagID": 1,
  "AvatarBodyID": 1
}
```

### FarmStageUnlockConfig.json (0.03 MB, 90 条)

**字段** (10): `FarmGachaIDList, FarmType, ID, OpenInAdvanceLimitActivityModuleID, OpenInAdvanceLimitUnlockID, UIEnterBattleArea, UIEntranceBgPath, UIEnviromentConfig, UnlockWorldLevelEnd, UnlockWorldLevelStart`

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

**字段** (6): `ControlConditionID, FullConditionID, LockConditionID, MissingConditionID, ScriptID, UnLockConditionID`

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

### GridFightDivisionInfo.json (0.03 MB, 97 条)

**字段** (9): `DivisionIcon, DivisionLevel, DivisionName, DivisionRewardQuest, DivisionShowPic, ID, IsPromotion, Progress, SeasonID`

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

### FateTraitBuff.json (0.03 MB, 64 条)

**字段** (11): `BNCKFPAGOMF, ENJOALLODBG, EPHLMOECOHP, FCGFFAJIBKA, GODMIEOJGAE, JFKADAONNOD, KBNHPKIOGLH, LBLJLNPBDPB, NHALJPDONCP, PBLPLDJKPEI, PDMPABKDHDI`

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
  "PBLPLDJKPEI": "<list[4]>",
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

### GridFightMonster.json (0.03 MB, 162 条)

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

### GridFightOrb.json (0.03 MB, 376 条)

**字段** (4): `BonusID, OrbID, OrbName, Type`

**首条记录摘要**:
```json
{
  "OrbID": 100,
  "BonusID": 20001,
  "Type": "White"
}
```

### GridFightTraitBasicInfo.json (0.03 MB, 33 条)

**字段** (16): `ActivationType, BEIDList, BaseDescParamList, CutinPath, ID, IconPath, LevelGraphPath, MiniIconPath, SeasonID, TraitBaseDesc, TraitBaseSimpleDesc, TraitEffectList, TraitName, TraitSearchKey, TraitSortPriority, TraitType`

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
  "LevelGraphPath": "",
  "SeasonID": 1,
  "TraitSortPriority": 61
}
```

### GridFightRankSkillModify.json (0.03 MB, 124 条)

**字段** (5): `ModifyOps, ModifySkillIndexs, ModifyValues, RankID, SkillID`

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

### GridFightConstCommon.json (0.02 MB, 146 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "GridFight_AvatarRarity",
  "Value": "<dict[1]>"
}
```

### EnterPageConfig.json (0.02 MB, 513 条)

**字段** (1): `Key`

**首条记录摘要**:
```json
{
  "Key": "AchievementPage"
}
```

### GridFightAffixConfig.json (0.02 MB, 55 条)

**字段** (7): `AffixDesc, AffixName, EffectParamList, ID, IconPath, JsonPath, RuleParamList`

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

### GridFightSeasonTalent.json (0.02 MB, 40 条)

**字段** (13): `Cost, EffectDesc, EffectParamList, EffectTag, EffectTitle, ID, IconPath, IsImportant, IsOCEffective, JsonPath, NextTalentIDList, PreTalentIDList, SeasonID`

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
  "EffectParamList": "<list[3]>",
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

### FateTrait.json (0.02 MB, 19 条)

**字段** (18): `AJLLAEEDBJL, BEOGEKDEPLO, BNCKFPAGOMF, CCBONMNIPPL, DFMLAIADNGI, DHKNKNGGJCK, ELNGIJIGJOO, FBFCPNADPKB, HCCMEBGFMCE, KBNHPKIOGLH, KCBDHKEKNHD, MFGKFAMKMFH, NHLFBFKBOEK, NLIPGMKKIED, ODEKADIBFAO, PBLPLDJKPEI, PDDPFOBKIEN, PDMDDELEAAG`

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
  "CCBONMNIPPL": "<list[6]>",
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

### GridFightPrayQuest.json (0.02 MB, 88 条)

**字段** (8): `AcceptBonus, FinishBonus, FinishWayID, ID, PrayDesc, PrayPriceDesc, PrayTitle, PrayType`

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

### GridFightSkillDescMod.json (0.02 MB, 155 条)

**字段** (4): `ModifySkillDesc, ModifySkillID, ModifySkillSimpleDesc, ModifySkillType`

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

### HudUIInfoTemplate.json (0.02 MB, 33 条)

**字段** (5): `ActionOperationSetID, HideHudUINodeList, ID, LockGotoTypeList, LockInputActionName`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "HideHudUINodeList": "<list[10]>",
  "LockGotoTypeList": "<list[16]>",
  "LockInputActionName": [
    "Maze_Walk"
  ],
  "ActionOperationSetID": 135
}
```

### GridFightBonusPoolV2.json (0.02 MB, 110 条)

**字段** (5): `BonusList, BonusMaxNumberList, BonusWeightList, RandomBonusID, TotalValue`

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

### GridFightRolePropertyConfig.json (0.02 MB, 55 条)

**字段** (8): `ExtraEffectID, IconPath, IsDisplay, MiniIconPath, Order, PanelPropertyName, PropertyName, PropertyType`

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

**字段** (10): `FinishType, ID, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

### HeliobusSpecialPost.json (0.02 MB, 16 条)

**字段** (5): `HeliobusSpecialPostID, Likes, PostImgIDList, SubMissionID, TemplateIDList`

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
  "Likes": "<list[15]>"
}
```

### FateReijuAffix.json (0.02 MB, 60 条)

**字段** (8): `BEOGEKDEPLO, EFAIIOHKFGD, HEDNBIABAKP, HNIMELBCBBJ, IDABEFMAPFE, LBLJLNPBDPB, MDEBFIFOKHH, PMIEAEGJNMJ`

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

### EvoBdSCCardConfig.json (0.02 MB, 56 条)

**字段** (10): `CardSelectablePeriod, ID, InfluenceScope, ItemIcon, ItemMiniIcon, LvID, ParamList, Season, Type, UnlockQuest`

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

### FateAffix.json (0.02 MB, 71 条)

**字段** (9): `BELHHHIHCEF, BEOGEKDEPLO, EFAIIOHKFGD, HEDNBIABAKP, IDABEFMAPFE, KBNHPKIOGLH, LBLJLNPBDPB, MDEBFIFOKHH, PMIEAEGJNMJ`

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

### GridFightCyreneModify.json (0.02 MB, 63 条)

**字段** (7): `CyreneMultipleValueKey, ModifyOps, ModifyRoleID, ModifySkillID, ModifySkillIndexs, ModifySkillType, ModifyValues`

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

### GridFightBackServant.json (0.02 MB, 265 条)

**字段** (4): `BESkillIDList, RoleID, ServantBEID, Star`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "Star": 1,
  "BESkillIDList": []
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

**字段** (12): `AMONFPEGLAF, BEOGEKDEPLO, CBCOAKMDBHD, EFAIIOHKFGD, GDLLGLFCEHC, GMGEMCFDIOE, GMPGDEINODK, ILLBMODJJGP, LEPNNKOAOJF, MDEBFIFOKHH, NGAGNNIHGFE, OHFGNODANEP`

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

### FunctionHud.json (0.02 MB, 74 条)

**字段** (7): `FunctionID, ID, IconPath, Name, OverrideHudIconPath, RedDot, RedDotHud`

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

### EvoBdSCGearCollection.json (0.02 MB, 45 条)

**字段** (10): `DamageCustomName, ElementList, ID, ItemIcon, LvMax, Name, Season, TagList, Type, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 3113001,
  "Name": {
    "Hash": 15171578985747915758
  },
  "LvMax": 8,
  "ItemIcon": "SpriteOutput/Quest/EvolveBuild/EvoLveBui...",
  "ElementList": "<list[7]>",
  "TagList": [
    1,
    2
  ],
  "Season": "SecondChapter",
  "DamageCustomName": "VS_Weapon_SC_001_Base"
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

### GridFightSpecialGoods.json (0.02 MB, 43 条)

**字段** (10): `Cost, EffectParamList, GoodDesc, GoodName, GroupID, ID, IconPath, JsonPath, MiniIconPath, Quality`

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

### GridFightPrayQuestFinishWay.json (0.02 MB, 73 条)

**字段** (11): `FinishType, ID, IsBackTrack, ParamInt1, ParamInt2, ParamInt3, ParamIntList, ParamItemList, ParamStr1, ParamType, Progress`

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

**字段** (8): `BEOGEKDEPLO, BJBGDFFIFJF, EFAIIOHKFGD, JFGICGNCKDA, NDAIGIEMABD, NOKPLOBPMMD, OFNCHIDJOME, PMIEAEGJNMJ`

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

### HeliobusTemplate.json (0.01 MB, 39 条)

**字段** (8): `HeliobusTemplateContent, HeliobusTemplateID, HeliobusTemplateTitle, PostImgID, PrefabPathNormal, PrefabPathSmall, TemplateTendency, TemplateType`

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

### EvoBdSCShopConfig.json (0.01 MB, 16 条)

**字段** (14): `BuffTextFormat, Category, ID, ItemBackground, ItemIcon, LvMax, MazeBuffID, Name, ParamList, PriceList, Season, ShopDesc, ShopType, TotalBuff`

**首条记录摘要**:
```json
{
  "ID": 3113805,
  "Season": "SecondChapter",
  "MazeBuffID": 3113805,
  "PriceList": "<list[5]>",
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

### GFTraitBESkillConfig.json (0.01 MB, 12 条)

**字段** (17): `CutinPath, DelayRatio, ParamList, SPMultipleRatio, ShowStanceList, SimpleParamList, SimpleSkillDesc, SkillButtonEffType, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
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

### EvolveBuildGearCollection.json (0.01 MB, 42 条)

**字段** (10): `DamageCustomName, ElementList, ID, ItemIcon, LvMax, Name, Season, TagList, Type, UnlockQuest`

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

### GridFightCamp.json (0.01 MB, 25 条)

**字段** (10): `BattleAreaList, BossBattleArea, CampName, ID, IconPath, IfRandomEnabled, InitialRandomCode, MonsterList, SeasonID, ShowPicPath`

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
  "MonsterList": "<list[10]>",
  "BattleAreaList": [
    2011101,
    2013201
  ],
  "SeasonID": 1
}
```

### EquipmentExpType.json (0.01 MB, 240 条)

**字段** (3): `Exp, ExpType, Level`

**首条记录摘要**:
```json
{
  "ExpType": 1,
  "Level": 1,
  "Exp": 40
}
```

### GiftDanmuSender.json (0.01 MB, 100 条)

**字段** (3): `ID, IconPath, Name`

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

### GridFightTraitEffectLayerPa.json (0.01 MB, 74 条)

**字段** (5): `DescParamList, EffectParamList, ID, Layer, TraitEffectDesc`

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

### EvolveBuildShopConfig.json (0.01 MB, 14 条)

**字段** (14): `BuffTextFormat, Category, ID, ItemBackground, ItemIcon, LvMax, MazeBuffID, Name, ParamList, PriceList, Season, ShopDesc, ShopType, TotalBuff`

**首条记录摘要**:
```json
{
  "ID": 3106801,
  "Season": "EarlyAccess",
  "MazeBuffID": 3106801,
  "PriceList": "<list[5]>",
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

### GuideVideoConfig.json (0.01 MB, 123 条)

**字段** (3): `SizeType, VideoID, VideoPath`

**首条记录摘要**:
```json
{
  "VideoID": 11001,
  "VideoPath": "Activity_Parkour_Guide_Bomb.usm",
  "SizeType": "Small"
}
```

### FinishTypeConfig.json (0.01 MB, 209 条)

**字段** (2): `FinishType, NeedVerseParam`

**首条记录摘要**:
```json
{}
```

### FuncEntranceList.json (0.01 MB, 21 条)

**字段** (7): `BottomFuncEntranceIDList, FuncEntranceIDList, HudFuncEntranceIDList, ID, LeftHudFuncEntranceIDList, UnlockGotoTypeList, WheelSupport`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FuncEntranceIDList": "<list[27]>",
  "BottomFuncEntranceIDList": [
    9,
    10,
    11,
    32
  ],
  "HudFuncEntranceIDList": "<list[10]>",
  "LeftHudFuncEntranceIDList": [
    1,
    3,
    4,
    16
  ],
  "UnlockGotoTypeList": "<list[74]>",
  "WheelSupport": true
}
```

### FateRinCaseBoardInfo.json (0.01 MB, 19 条)

**字段** (15): `BEDFGGKCODK, CENPLDELHNG, EEJPJOPLIFH, ENACPJCCIAP, FGKOGGMACBA, GMCBNNKJAGJ, HKDMGOBJIMA, IAOIMDKHPCG, IIIOIGMEHGG, ILEHHBEEDBP, LEPNNKOAOJF, NNLLEEHJHMK, OENAMINOLLF, OLOIFNNLKJP, PDBNACBFHGN`

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

### GridFightServantStar.json (0.01 MB, 29 条)

**字段** (14): `AIPath, HPBase, HPInherit, HPSkill, ID, JsonOverrideConfig, ServantID, ServantShowSkiilIDList, SkillOverrideDest, SkillOverrideSrc, SpeedBase, SpeedInherit, SpeedSkill, Star`

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

### ExpType.json (0.01 MB, 200 条)

**字段** (3): `Exp, Level, TypeID`

**首条记录摘要**:
```json
{
  "TypeID": 1,
  "Level": 1,
  "Exp": 200
}
```

### EvoBdSCStageConfig.json (0.01 MB, 7 条)

**字段** (22): `BuffTextFormat, Difficulty, FirstWinQuest, GearRecommendList, InitialWeapon, IntroID, Name, PreName, RankList, RecommendList, Season, StageMergedID, StagePeriod1, StagePeriod2, StagePeriod3, StagePeriod4, TeamBonusIconPath, TeamBonusMazeBuffID, TeamBonusShortDesc, TrialAvatar, UnlockQuest, WeaponSelectable`

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
  "RankList": "<list[5]>",
  "InitialWeapon": [],
  "TrialAvatar": "<list[5]>",
  "RecommendList": [],
  "GearRecommendList": []
}
```

### FightFestPaperInterview.json (0.01 MB, 30 条)

**字段** (8): `Comment, Detail, IconPath, Info, Name, PaperID, SortWeight, TextJoinItemID`

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

### GridFightSeasonItem.json (0.01 MB, 225 条)

**字段** (2): `ItemID, SeasonID`

**首条记录摘要**:
```json
{
  "ItemID": 99990,
  "SeasonID": 1
}
```

### ExpeditionReward.json (0.01 MB, 88 条)

**字段** (5): `AvatarNum, Duration, ExpeditionID, ExtraRewardID, RewardID`

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

### ExpeditionData.json (0.01 MB, 22 条)

**字段** (11): `AssignDesc, AssignerIDList, AvatarNumMax, AvatarNumMin, BonusBaseTypeList, BonusDamageTypeList, DisplayItemList, ExpeditionID, GroupID, Name, UnlockMission`

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

**字段** (3): `MGNHKOHFLPO, PIKLFGGHKGD, PNPJBPCMINL`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "PIKLFGGHKGD": 1001,
  "MGNHKOHFLPO": "<list[8]>"
}
```

### GridFightSeasonExpScore.json (0.01 MB, 80 条)

**字段** (6): `ChapterID, DivisionID, Exp, ScoreRuleID, SectionID, WeeklyScore`

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

### EndmostChronicle.json (0.01 MB, 32 条)

**字段** (10): `FBKAMIHGLFK, FPGMJLNEJCF, GFOGDOBBJAF, JMEJCLEBFHN, KEMBKKLCPBD, LDIHBHDHOMF, LGPDIDLJFOI, OFABOLACEEN, PCFNMMOAGLA, PHFMCACHFIJ`

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

### FightFestStageInfo.json (0.01 MB, 20 条)

**字段** (10): `ChallengeName, EnvironmentBuffID, EventID, HighLightDesc, PreviewMonsterList, RecommadCoachID, RecommadNature, SpecialAvatarList, TutorialID, UIEnterBattleAreaID`

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
  "PreviewMonsterList": "<list[5]>",
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

### EquipmentAtlas.json (0.01 MB, 170 条)

**字段** (2): `DefaultUnlock, EquipmentID`

**首条记录摘要**:
```json
{
  "EquipmentID": 20000,
  "DefaultUnlock": true
}
```

### GridFightStage.json (0.01 MB, 15 条)

**字段** (17): `AvatarReviveDelayLose, BossGlobalHPLose, BossProgressValue, CardStolenList, EliteGlobalHPLose, EliteProgressValue, MinionGlobalHPLose, MinionProgressValue, StageID, StageRuleID, ThresholdBonusList, ThresholdFailGlobalHPLose, ThresholdPassBasicGlobalHPLose, ThresholdPosition, TotalTurn, VictoryBonusList, WaveIndex`

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

### FateRinHouguMapFight.json (0.01 MB, 15 条)

**字段** (18): `BMOKJDHHJBH, BNGEMNHEMAK, EHAFJKIKKMC, HGNACOAJMIJ, HNEIIAGADGO, HPJHKACDIMB, JAJPGCBAIJA, JFDHFPIIGCC, JKCHLJNLLNA, KAHNDIPJGHI, KPJMHEPOOBL, MMEGCIGMALC, NCHLCBICBGO, NHAINGEIMJA, OBJEJHKENKF, OHFGNODANEP, PHFMCACHFIJ, PKLFLANJCDG`

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

### FuncUnlockHint.json (0.01 MB, 52 条)

**字段** (6): `Desc, IconPath, SubTitle, Title, Type, UnlockID`

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

### GachaGroupData.json (0.01 MB, 29 条)

**字段** (5): `GachaIDList, GroupID, GroupType, PoolLabelIcon, PoolLabelIconSelected`

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

### HeliobusChallengeStage.json (0.01 MB, 16 条)

**字段** (16): `BattleAreaGroupID, BattleAreaID, BattleTargetList, ChallengeDesc, ChallengeID, ChallengeName, EventID, FloorID, HeliobusChallengeHard, HeliobusMazeBuff, HeliobusSkillRecList, MonsterList, PlaneID, PreChallengeID, RewardID, UnlockPhase`

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

**字段** (13): `Board3DTexture, BoardTitle, IconPath1, IconPath2, LukaAnimTrigger, MiniIconPath1, PhaseID, PhaseTitle, PhaseTutorialParams, PhaseType, SortWeight, TargetTips, UnlockSubMissionID`

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

### GridFightEnhance.json (0.01 MB, 25 条)

**字段** (9): `Cost, EffectParamList, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, GroupID, ID, IconPath, SelectCondition`

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

### Function.json (0.01 MB, 77 条)

**字段** (5): `GotoID, ID, OverrideGotoID, OverrideUnlockID, UnlockID`

**首条记录摘要**:
```json
{
  "ID": 2,
  "GotoID": 200,
  "UnlockID": 200,
  "OverrideGotoID": "<list[5]>",
  "OverrideUnlockID": []
}
```

### EvolveBuildStageConfig.json (0.01 MB, 6 条)

**字段** (21): `BuffTextFormat, Difficulty, FirstWinQuest, GearRecommendList, InitialWeapon, IntroID, Name, RankList, RecommendList, Season, StageMergedID, StagePeriod1, StagePeriod2, StagePeriod3, StagePeriod4, TeamBonusIconPath, TeamBonusMazeBuffID, TeamBonusShortDesc, TrialAvatar, UnlockQuest, WeaponSelectable`

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
  "RankList": "<list[5]>",
  "InitialWeapon": [
    3106002
  ],
  "TrialAvatar": [
    1021003,
    1031013,
    3231110
  ],
  "RecommendList": "<list[3]>",
  "GearRecommendList": [
    3106013,
    3106011,
    3106010
  ]
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

### GridFightOverrideRoleVO.json (0.01 MB, 82 条)

**字段** (4): `ForbidVOTypes, OverrideVOTag, OverrideVOTypes, RoleID`

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

**字段** (2): `LevelGraphPath, TaskID`

**首条记录摘要**:
```json
{
  "TaskID": 1,
  "LevelGraphPath": "Config/Level/GridFight/TutorialTask/Grid..."
}
```

### ElationBasicLevelDamage.json (0.01 MB, 101 条)

**字段** (2): `ElationBasicLevelDamage, Level`

**首条记录摘要**:
```json
{
  "Level": 1,
  "ElationBasicLevelDamage": {
    "Value": 108
  }
}
```

### FateMaster.json (0.01 MB, 21 条)

**字段** (8): `ACCJKGEKHKP, BELPGNDDELK, DMMLHHHPBMO, KBNHPKIOGLH, LAFABGLMPIA, LEKEEONHDLP, MDEBFIFOKHH, OHGFMOPCOKM`

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

### FateHandbookMaster.json (0.01 MB, 21 条)

**字段** (11): `ACCJKGEKHKP, AJKJEBNLMIE, AMOILJKCNOI, HLBMOIKELLN, HMGGLIEMDDF, JFOOFHLOJAO, JKIMMLOIJKJ, LEPNNKOAOJF, MNMGEPNEJDO, PAFJIBPHLBF, PPMFCIIEGJF`

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

### GridFightRoleAutoWeight.json (0.01 MB, 77 条)

**字段** (3): `IsDamageEnhancedByEquip, OverWriteDamageCarry, RoleID`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "OverWriteDamageCarry": {
    "Value": -1
  }
}
```

### FiveDimFluteConfig.json (0.01 MB, 26 条)

**字段** (13): `AutoPlayChangeGPFailTextmapKey, Code, ContainerID, EntranceID, FiveDimAnchorID, GPName, GPValue, GroupID, ID, KeepContentIDList, TeleAnchorID, TeleAreaName, Type`

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
  },
  "KeepContentIDList": []
}
```

### ExpeditionBattleRoute.json (0.01 MB, 16 条)

**字段** (8): `BuffID, ID, LevelIDList, MainMonster, MazeBuffID, MonsterFigurePath, MonsterWeakPoint, SpecialAvatarIDList`

**首条记录摘要**:
```json
{
  "ID": 10101,
  "LevelIDList": [
    101011,
    101012,
    101013,
    101014
  ],
  "BuffID": 60101,
  "SpecialAvatarIDList": "<list[6]>",
  "MainMonster": 5014010,
  "MazeBuffID": 3220001,
  "MonsterFigurePath": "SpriteOutput/UI/Quest/ExpeditionBattle/M...",
  "MonsterWeakPoint": [
    "Fire",
    "Quantum",
    "Imaginary"
  ]
}
```

### GridFightNpcConfig.json (0.01 MB, 24 条)

**字段** (7): `ID, Icon, NpcDesc, NpcName, NpcType, PositionRegion, RoundIcon`

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

**字段** (4): `CostEquipList, CraftEquipID, CraftID, ID`

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

### GridFightConstValueCommonV2.json (0.01 MB, 27 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "GridFight_CardWeight_Lv1",
  "Value": "<dict[1]>"
}
```

### FantasticStoryBattleID.json (0.01 MB, 6 条)

**字段** (25): `ActivityModuleID, AvailableBuffSlotID, BattleAreaGroupID, BattleAreaID, BattleID, BookContext, BookContextChange, BookTitle, DisplayMonsterList, EnvironmentBuffID, EventID, FigurePath, FinishQuest, FloorID, Name, PlaneID, PreBattleID, QuestList, RecommendAvatar, RecommendNature, SpecialAvatarIDList, TextJoinIDList, TextJoinIDListChange, TurnLimit, UnlockChapterID`

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
  "DisplayMonsterList": "<list[6]>",
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

### GridFightBonusRule.json (0.01 MB, 114 条)

**字段** (3): `ID, ProgressBonusList, ProgressRatio`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ProgressBonusList": [
    1
  ]
}
```

### ExpeditionHarvestData.json (0.01 MB, 23 条)

**字段** (7): `ExpeditionID, Group, IconPath, Name, Order, RewardID, UnlockCondition`

**首条记录摘要**:
```json
{
  "ExpeditionID": 1001,
  "RewardID": 115601,
  "UnlockCondition": "<list[1]>",
  "Name": {
    "Hash": 14909458032570007003
  },
  "IconPath": "SpriteOutput/ItemIcon/111001.png",
  "Group": 1,
  "Order": 1
}
```

### GridFightTalent.json (0.01 MB, 13 条)

**字段** (12): `Cost, EffectDesc, EffectParamList, EffectTag, EffectTitle, ID, IconPath, IsImportant, IsOCEffective, JsonPath, NextTalentIDList, PreTalentIDList`

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

### FightFestPaper.json (0.01 MB, 6 条)

**字段** (13): `CollectionBgPath, CollectionFgPath, GameAdFigurePath, InterviewBgPath, InterviewFgPath, IssueNumber, IssueNumberText, MainBgPathList, MainFgPathList, MainPageDesc, MainPageTitle, PaperID, UnlockSubMissionID`

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
  "MainFgPathList": "<list[2]>",
  "MainBgPathList": "<list[2]>",
  "InterviewFgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "InterviewBgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "CollectionFgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "CollectionBgPath": "SpriteOutput/Quest/FightFest/News/FightF...",
  "GameAdFigurePath": "SpriteOutput/Quest/FightFest/News/FightF..."
}
```

### FinalityBattleRole.json (0.01 MB, 5 条)

**字段** (10): `AvatarEnglishName, AvatarFeverDesc, AvatarFeverSimpleDesc, ID, ParamList_ModifiedSkill, ParamList_Stage, SpecialAvatarID, StageFeverCond, StageFeverDesc, StageFeverSimpleDesc`

**首条记录摘要**:
```json
{
  "ID": 3141310,
  "AvatarEnglishName": "Firefly",
  "SpecialAvatarID": 3141310,
  "StageFeverCond": {
    "Hash": 4473598428994701331
  },
  "StageFeverSimpleDesc": {
    "Hash": 2606634592848736858
  },
  "StageFeverDesc": {
    "Hash": 12078006042091767097
  },
  "ParamList_Stage": "<list[10]>",
  "AvatarFeverSimpleDesc": {
    "Hash": 6643054897394527968
  },
  "AvatarFeverDesc": {
    "Hash": 6418216982273669823
  },
  "ParamList_ModifiedSkill": "<list[16]>"
}
```

### FightFestAvatarInfo.json (0.01 MB, 15 条)

**字段** (7): `AvatarID, AvatarName, FigureOffset, FullFigurePath, HalfFigurePath, IconPath, VSImgPath`

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

**字段** (19): `AvailableAvatarList, BattleTargetList, EventID, GiftBoxLevel, ID, ImagePath, IsModifiedAvatarFixed, LevelDes_In, LevelDes_In_Down, LevelDes_Out, ModifiedAvatarIDList, MonsterList, NewModifiedAvatarID, PerfectWave, SpecialAvatarList, StageName, TutorialGuideGroupID, UIEnterBattleAreaID, UnlockCondition`

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

### GridFightTraitBonus.json (0.01 MB, 32 条)

**字段** (5): `BonusParamList, BonusThreshold, BonusType, ID, TraitBonusParamList`

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

### FightFestScoreRace.json (0.01 MB, 8 条)

**字段** (18): `BlueAvatarID, DetailImgPath, EventID, EventIDList, PhaseID, RaceBgFigurePath, RaceDesc, RedAvatarID, ResultImgPath, RewardID, RewardScore, ScoreRaceID, ScoreRaceType, SortWeight, StageName, TakeMainMissionID, TutorialID, TutorialImgPath`

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

### GridFightSubTraitBasicInfo.json (0.01 MB, 16 条)

**字段** (8): `BaseDescParamList, FatherTraitID, ID, SubTraitName, TraitBaseDesc, TraitBaseSimpleDesc, TraitEffectList, TraitSearchKey`

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

### GridFightTutorialStageNode.json (0.01 MB, 32 条)

**字段** (6): `ChapterID, DivisionID, FunctionList, SectionID, Unlock, UnlockTutorialTask`

**首条记录摘要**:
```json
{
  "DivisionID": 1,
  "ChapterID": 1,
  "SectionID": 1,
  "FunctionList": "<list[8]>"
}
```

### GridFightRoleGameRefScore.json (0.01 MB, 77 条)

**字段** (3): `RoleID, RoleInGameRefScore, SeasonID`

**首条记录摘要**:
```json
{
  "RoleID": 1001,
  "SeasonID": 1,
  "RoleInGameRefScore": 3
}
```

### ElationBattleModifiedAvatar.json (0.01 MB, 6 条)

**字段** (14): `BESkill, BESkill_Simple, EnergyCollection, EnergyCollection_Simple, GiftIcon, GiftName, ID, ModifiedSkill, ModifiedSkill_Simple, ParamList_BESkill, ParamList_EnergyCollection, ParamList_ModifiedSkill, SpecialAvatarID, Tag`

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

### GFTraitBEOverrideConfig.json (0.01 MB, 4 条)

**字段** (9): `AbilityName, OneWordDesc, OneWordDescSimple, OverrideBEProperty, OverrideSkillIDList, SpecialIconPath, TraitID, TraitLayer, TraitTitleDesc`

**首条记录摘要**:
```json
{
  "TraitID": 2012,
  "TraitLayer": 3,
  "OverrideBEProperty": "<list[8]>",
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

### HealPool.json (0.01 MB, 70 条)

**字段** (3): `MaxHealPool, PlayerLevel, RecoverTime`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "MaxHealPool": 1000,
  "RecoverTime": 1800
}
```

### FatePhase.json (0.01 MB, 10 条)

**字段** (9): `AENCLGAIGMD, COPIFAPBMJH, HFGNHCDNPHL, JAKDNHOHINO, LKJNMGCBCAK, LOEPLBPFMEN, MKPCBHODIFB, MLNNCPNNDOO, POCKPDCKPMA`

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
  "JAKDNHOHINO": "<list[4]>",
  "LKJNMGCBCAK": "<list[4]>"
}
```

### EmojiGroup.json (0.01 MB, 29 条)

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

### HeartDialCondition.json (0.00 MB, 55 条)

**字段** (5): `FinishType, ID, ParamUint1, ParamUint2, ParamUint3`

**首条记录摘要**:
```json
{
  "ID": 10001001,
  "FinishType": "AutoFinish"
}
```

### FantasticStoryBuffID.json (0.00 MB, 23 条)

**字段** (7): `ActivityModuleID, AvailableBattleID, BuffID, BuffSlot, ClientShowAvailableTips, MazebuffID, UnlockChapterID`

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

### FightFestChallenge.json (0.00 MB, 5 条)

**字段** (19): `AvatarInfoID, BattleTargetList, ChallengeID, EnvironmentBuffID, EventID, FigurePath, GroupID, OriginalFigurePath, OriginalStageName, QuestGroupID, QuestIDList, SpecialAvatarList, TabIconPath, TabName, TutorialID, UnlockConditionList, UnlockSubMissionID, UnlockSubMussionID, UnlockTips`

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

### HeliobusPostImg.json (0.00 MB, 39 条)

**字段** (2): `PostImgID, PostImgPath`

**首条记录摘要**:
```json
{
  "PostImgID": 101,
  "PostImgPath": "SpriteOutput/Quest/Heliobus/PhotoImg/Hel..."
}
```

### FateBroadcast.json (0.00 MB, 22 条)

**字段** (6): `BCNBKEAJDNG, CIMMEBGNABD, FFCBLPDHCFO, JGAICIJPHNO, LOAGIPDPLFM, PKGJBPODCOG`

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

### FightFestCoachSkill.json (0.00 MB, 12 条)

**字段** (8): `CoachItemID, CoachSkillExtraDesc, CoachSkillName, CoachType, FigurePath, MazeBuffID, SortWeight, UnlockDesc`

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

**字段** (9): `DivisionAbbr, DivisionIcon, DivisionLevel, DivisionName, DivisionNameWithNum, DivisionRewardQuest, DivisionSPRewardQuest, DivisionShowPic, SeasonID`

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

### GameplayGuideSubTypeData.json (0.00 MB, 21 条)

**字段** (4): `ItemListForType, Name, SubTypeID, TabIconPath`

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

### FateRinAvatar.json (0.00 MB, 6 条)

**字段** (10): `EMFJFPAAEMB, GAIFKHJMCJO, GHNJCLNKGHH, GKLAPFJKONI, HHDMOCBJKOF, LFMFLBMDCGE, MEPIMHPJKPP, NCCJOMIOKML, OHMIIOMCIMA, PKJDFMCKNMC`

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

### EndmostChronicleMissionPack.json (0.00 MB, 32 条)

**字段** (2): `MainMissionIdList, MissionPack`

**首条记录摘要**:
```json
{
  "MissionPack": 1034101,
  "MainMissionIdList": "<list[8]>"
}
```

### EventMuseumItemConfig.json (0.00 MB, 18 条)

**字段** (7): `EventContentTextID, EventMuseumItemID, ForceComplete, IsTargetReward, MissionID, MissionStartString, MuseumItemID`

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

**字段** (5): `Priority, QuestList, SeasonID, StandardQuestList, TraitID`

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

### GridFightSeasonPortal.json (0.00 MB, 83 条)

**字段** (2): `PortalID, SeasonID`

**首条记录摘要**:
```json
{
  "PortalID": 101,
  "SeasonID": 1
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

### GridFightTraitEffect.json (0.00 MB, 24 条)

**字段** (4): `ID, TraitEffectIconPath, TraitEffectJson, TraitEffectType`

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

**字段** (8): `BKKAOIBLCJG, DOBKKDIECDO, EMFGEFNHOIB, FLLGGNAPJOI, HOGDKNENKMB, KILFKBDMJGI, KJKMDFEJIJJ, PMGABBELKNG`

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

### GridFightLevelV2.json (0.00 MB, 10 条)

**字段** (9): `AvatarMaxNumber, GeneralPropertyList, GridFightLevel, LevelUpExp, Rarity1Weight, Rarity2Weight, Rarity3Weight, Rarity4Weight, Rarity5Weight`

**首条记录摘要**:
```json
{
  "GridFightLevel": 1,
  "LevelUpExp": 2,
  "AvatarMaxNumber": 1,
  "Rarity1Weight": 100,
  "GeneralPropertyList": "<list[2]>"
}
```

### EvolveBuildCardConfig.json (0.00 MB, 11 条)

**字段** (9): `CardSelectablePeriod, ID, InfluenceScope, ItemIcon, ItemMiniIcon, LvID, ParamList, Season, Type`

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

### GridFightPlayerLevel.json (0.00 MB, 10 条)

**字段** (9): `AvatarMaxNumber, GeneralPropertyList, LevelUpExp, PlayerLevel, Rarity1Weight, Rarity2Weight, Rarity3Weight, Rarity4Weight, Rarity5Weight`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "LevelUpExp": 2,
  "AvatarMaxNumber": 1,
  "Rarity1Weight": 100,
  "GeneralPropertyList": "<list[2]>"
}
```

### GridFightEquipMazebuff.json (0.00 MB, 6 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### GridFightSeasonCraft.json (0.00 MB, 80 条)

**字段** (2): `CraftID, SeasonID`

**首条记录摘要**:
```json
{
  "CraftID": 1,
  "SeasonID": 1
}
```

### GridFightPortalMazebuff.json (0.00 MB, 6 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### GridFightRoleConfig_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `MGNHKOHFLPO, PNPJBPCMINL`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "<list[77]>"
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

### GridFightMazeBuffEnhance.json (0.00 MB, 7 条)

**字段** (6): `AbilityName, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, ID, ParamList`

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

### FateBattleZone.json (0.00 MB, 12 条)

**字段** (6): `BMAJPBPJNGD, EOFGAIBKBNM, ILPOIGJFLFM, JHPNHNFJAJJ, LLKBBKNBNBG, PKGJBPODCOG`

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

### FateExpReward.json (0.00 MB, 30 条)

**字段** (4): `AAGKEBFHLMC, DOHPJPEMDON, KNIMCDCHFFN, PJNNPOKJEFD`

**首条记录摘要**:
```json
{
  "AAGKEBFHLMC": 1,
  "PJNNPOKJEFD": 100,
  "KNIMCDCHFFN": 3151201,
  "DOHPJPEMDON": 3151301
}
```

### FateDifficulty.json (0.00 MB, 7 条)

**字段** (8): `DEIGIJJFOAK, DJHMIDECBMH, FAEHFMIFPBG, IJEJGCEAFAF, JGBCKHKPPCA, LMPLLJFMFEC, MCPJKENJILA, PGLIPCKDFNB`

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

### GridFightSelectEnhance.json (0.00 MB, 7 条)

**字段** (10): `Cost, EffectParamList, EnhanceDesc, EnhanceName, EnhanceSimpleDesc, ID, IconPath, ParamList, SelectCondition, TraitEffectID`

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

### ExpeditionBattleLevel.json (0.00 MB, 64 条)

**字段** (2): `ID, StageID`

**首条记录摘要**:
```json
{
  "ID": 101011,
  "StageID": 428001
}
```

### GridFightTraitThreshold.json (0.00 MB, 27 条)

**字段** (3): `ID, IconPath, Level`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "Level": 1,
  "IconPath": "SpriteOutput/GridFight/BuffItem/GridFigh..."
}
```

### FinalityBattleLevel.json (0.00 MB, 10 条)

**字段** (8): `BattleAreaID, BattleTargetList, DifficultyLevel, ID, StageID, SupportingAllRoleList, SupportingRoleList, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 100,
  "DifficultyLevel": "Easy",
  "StageID": 431001,
  "BattleTargetList": [
    5002001
  ],
  "SupportingRoleList": [
    3151222
  ],
  "SupportingAllRoleList": [],
  "BattleAreaID": 2055101
}
```

### ExpeditionBattleFunTitle.json (0.00 MB, 13 条)

**字段** (6): `ConditionParam, ConditionParamType, FunTitleDesc, FunTitleName, ID, Type`

**首条记录摘要**:
```json
{
  "ID": 8001,
  "Type": "Dps",
  "ConditionParamType": "GreaterEqual",
  "FunTitleName": {
    "Hash": 4499678920084074977
  },
  "FunTitleDesc": {
    "Hash": 1548234941186645741
  }
}
```

### FindChestFuncData.json (0.00 MB, 8 条)

**字段** (10): `ChestTypeList, FindNum, FuncID, GameModeList, MapIconID, MappingInfoID, SpecialMappinginfo, TriggerParamList, TriggerType, WorldIDList`

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

### FiveDimSkillPanelConfig.json (0.00 MB, 6 条)

**字段** (12): `Desc1, Desc2, ID, IconPath, IconPath2, IpDesc, IpDesc2, Name, SkillName, Type, UI3DPath, UnlockID`

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

### GridFightBinaryNodeRule.json (0.00 MB, 44 条)

**字段** (3): `ID, PerformLevel, Quality`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Quality": 1,
  "PerformLevel": 1
}
```

### GridFightTutorialStage.json (0.00 MB, 2 条)

**字段** (14): `DivisionID, ForbiddenAutoOpenShopNodeList, ForbiddenBattleFail, ForbiddenSellRoleBeforeChapterId, ForbiddenSellRoleBeforeSectionId, ForbiddenSellRoleList, IsAlltrial, IsBossToastShow, IsEquipRecommendShow, IsInitialSupply, IsPortal, IsRouteShow, RewardQuest, TutorialStageName`

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
  "ForbiddenSellRoleList": "<list[8]>",
  "ForbiddenAutoOpenShopNodeList": "<list[7]>"
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

### GridFightEquipTag.json (0.00 MB, 32 条)

**字段** (2): `EquipTagDesc, TagID`

**首条记录摘要**:
```json
{
  "TagID": 1,
  "EquipTagDesc": {
    "Hash": 16237398910470728219
  }
}
```

### HeliobusSkill.json (0.00 MB, 8 条)

**字段** (8): `BGDescription, HeliobusSkillID, RelatedEventID, SkillEffect, SkillIconPath, SkillUIPosition, UnlockMissionID, UnlockToastMissionID`

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

### GridFightTraitGameRef.json (0.00 MB, 25 条)

**字段** (5): `BasicScore, BonusScore, PenaltyScore, Season, TraitID`

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

### HeliobusPhase.json (0.00 MB, 5 条)

**字段** (10): `HeliobusPhaseID, Heliobus_ToDoListTitle_After, Heliobus_ToDoListTitle_Before, Heliobus_UpMissionDesc, PhaseBigIconPath, PhaseFans, PhaseSmallIconPath, PhaseTextID, ReceiveMissionID, UnlockMissionID`

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

### ExpeditionBattleBuff.json (0.00 MB, 16 条)

**字段** (5): `BuffDataDesc, BuffDataIsPercentage, BuffRank, ID, MazeBuffID`

**首条记录摘要**:
```json
{
  "ID": 60101,
  "MazeBuffID": 3220001,
  "BuffRank": 60,
  "BuffDataDesc": {
    "Hash": 9397042811744567852
  },
  "BuffDataIsPercentage": true
}
```

### GridFightForge.json (0.00 MB, 10 条)

**字段** (7): `EquipCategory, EquipNum, ForgeDesc, ForgeTypeDesc, FuncType, ID, ParamList`

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
  "Value": "<dict[1]>"
}
```

### GameplayGuideTab.json (0.00 MB, 8 条)

**字段** (9): `Desc, GuideType, ID, IconPath, IntroDataID, Name, Priority, ResBarKey, UnlockID`

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

### FiveDimMiniGameReward.json (0.00 MB, 21 条)

**字段** (4): `MiniGameID, OneTimeRewardID, RepeatableRewardID, ScoreLine`

**首条记录摘要**:
```json
{
  "MiniGameID": 1000,
  "ScoreLine": 200,
  "RepeatableRewardID": 27001001,
  "OneTimeRewardID": 241
}
```

### HeartDialNpc.json (0.00 MB, 17 条)

**字段** (5): `DefaultScriptID, FloorID, GroupID, InstanceID, ScriptIDList`

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

### FateMonsterPool.json (0.00 MB, 7 条)

**字段** (6): `BDJIGCAEKBE, BKABFEJOAKM, JHGNLBADBAE, JMCDCEGBJNJ, MMNICKEOGNN, NHLFOCNBABI`

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
  "BKABFEJOAKM": "<list[5]>"
}
```

### GridFightLevelBaseValue.json (0.00 MB, 23 条)

**字段** (4): `ChapterID, LevelBaseAttack, LevelBaseHP, SectionID`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "SectionID": 1,
  "LevelBaseAttack": 16000,
  "LevelBaseHP": 16000
}
```

### GridFightFrontSpecialSP.json (0.00 MB, 24 条)

**字段** (4): `MaxSpecialSP, RoleID, SpecialSPType, Star`

**首条记录摘要**:
```json
{
  "RoleID": 1407,
  "Star": 1,
  "SpecialSPType": "MaxSP",
  "MaxSpecialSP": 150000
}
```

### GameModeFuncEntrance.json (0.00 MB, 21 条)

**字段** (3): `BranchLineFuncEntranceListID, GameModeType, MainLineFuncEntranceListID`

**首条记录摘要**:
```json
{
  "GameModeType": 1,
  "MainLineFuncEntranceListID": 1,
  "BranchLineFuncEntranceListID": 17
}
```

### GridFightRoleChoose.json (0.00 MB, 16 条)

**字段** (5): `ChooseDesc, Parameter, SubTraitID, TraitID, Type`

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

### ElationSkill.json (0.00 MB, 35 条)

**字段** (2): `ElationSkillID, PriorityValue`

**首条记录摘要**:
```json
{
  "ElationSkillID": 150120,
  "PriorityValue": 144
}
```

### EvoBdSCTutorial.json (0.00 MB, 20 条)

**字段** (5): `ID, Season, StageMergedID, TutorialID, WeaponLevel`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageMergedID": 424000,
  "TutorialID": "6005",
  "Season": "SecondChapter"
}
```

### FightFestMainRace.json (0.00 MB, 6 条)

**字段** (10): `BlueAvatarID, EventID, FightPhaseID, MainRaceID, RaceBgFigurePath, RedAvatarID, RewardID, StageEndDesc, StageName, TutorialID`

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

### EvoBdSCGearTypeConfig.json (0.00 MB, 5 条)

**字段** (8): `FontColor, ID, MixDetailPropsInfoBg, Name, Season, TypeImg, TypeImgColor, WeaponToastEffectBg`

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

### EvolveBuildTutorial.json (0.00 MB, 20 条)

**字段** (5): `ID, Season, StageMergedID, TutorialID, WeaponLevel`

**首条记录摘要**:
```json
{
  "ID": 1,
  "StageMergedID": 414000,
  "TutorialID": "5355",
  "Season": "EarlyAccess"
}
```

### EvoBdSCForgeMaterial.json (0.00 MB, 14 条)

**字段** (3): `CostGearList, ForgeGearID, MaterialGearList`

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

### FateRinDeckRecommend.json (0.00 MB, 7 条)

**字段** (4): `JGAKLKBOPEG, LOALOLNACOA, NJBEMAEAEIL, OFIGPIFELHJ`

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
  "NJBEMAEAEIL": "<list[13]>"
}
```

### GridFightStageLevelValue.json (0.00 MB, 23 条)

**字段** (3): `LevelBaseAttack, LevelBaseHP, StageID`

**首条记录摘要**:
```json
{
  "StageID": 70000001,
  "LevelBaseAttack": 20000,
  "LevelBaseHP": 16000
}
```

### GridFightAugmentMonster.json (0.00 MB, 30 条)

**字段** (3): `DivisionLevel, EnemyDiffLvAdd, Quality`

**首条记录摘要**:
```json
{
  "Quality": "Silver"
}
```

### GridFightTraitVideo.json (0.00 MB, 18 条)

**字段** (3): `Description, TraitID, VideoID`

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

### FateRinCaseBoardTeamInfo.json (0.00 MB, 10 条)

**字段** (6): `BGNGIBBEGMB, GMCBNNKJAGJ, IGKPNJCFCPN, JCDIEKGKCPP, KONCALJBIOB, NMAHGFAPENI`

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

### GuideRogueData.json (0.00 MB, 6 条)

**字段** (9): `ID, IconPath, Name, OpenConditions, Priority, RelatedID, TabID, TabIconPath, UnlockConditions`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Name": {
    "Hash": 7618010570370743835
  },
  "IconPath": "",
  "TabIconPath": "",
  "UnlockConditions": "<list[2]>",
  "OpenConditions": "<list[1]>",
  "TabID": 1001
}
```

### FateRinHouguKeyword.json (0.00 MB, 12 条)

**字段** (4): `NKEJALOLCIF, NMAHGFAPENI, OENAMINOLLF, PHFMCACHFIJ`

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
  "ItemIDList": "<list[10]>"
}
```

### EvolveBuildForgeMaterial.json (0.00 MB, 13 条)

**字段** (3): `CostGearList, ForgeGearID, MaterialGearList`

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

### ExpeditionBattleMap.json (0.00 MB, 4 条)

**字段** (7): `ActivityModuleID, ExpeditionBGM, ExpeditionBackgroundPrefabPath, ID, MapIconPath, MapName, RouteIDList`

**首条记录摘要**:
```json
{
  "ID": 101,
  "ActivityModuleID": 5010601,
  "RouteIDList": [
    10201,
    10202,
    10203,
    10204
  ],
  "MapName": {
    "Hash": 14969595882551478116
  },
  "MapIconPath": "SpriteOutput/UI/Quest/ExpeditionBattle/S...",
  "ExpeditionBackgroundPrefabPath": "SpriteOutput/UI/Quest/ExpeditionBattle/E...",
  "ExpeditionBGM": "State_Menu_Season_Planarcadia_Combat_ADV..."
}
```

### FateRinCaseBoardServant.json (0.00 MB, 10 条)

**字段** (7): `AMOILJKCNOI, HLBMOIKELLN, HOPKBCJIOCD, JFOOFHLOJAO, JKIMMLOIJKJ, MNMGEPNEJDO, PPMFCIIEGJF`

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

### GridFightTalentMazebuff.json (0.00 MB, 3 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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

### HeartDialTraceConsume.json (0.00 MB, 8 条)

**字段** (6): `FloorID, HeartDialEmotion, HeartDialTraceID, MapInfoID, MaterialCost, MiniMapID`

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

### FiveDimFluteTalkConfig.json (0.00 MB, 4 条)

**字段** (7): `EnterTipsTextID, ErrorTIpsTextID, FluteID, IconPath, IconPathErrorTIps, IconPathInputTips, InputTipsTextID`

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

### GridFightEquipCategoryInfo.json (0.00 MB, 14 条)

**字段** (3): `CategoryName, EquipCategory, EquipCount`

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

### FateDiffPassProgress.json (0.00 MB, 8 条)

**字段** (4): `FMCNCMENCFF, GAOMJHOKMMG, IODFDGLGOJI, JIDGCHINCKC`

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

**字段** (3): `EmoType, MapIconID, StepType`

**首条记录摘要**:
```json
{
  "MapIconID": 136
}
```

### FateRinSwitchDayTalk.json (0.00 MB, 13 条)

**字段** (4): `EOAGGGKKHLN, GNIFLCBGAAA, IBGNNBCPHFO, PFNEMONCJFE`

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

### FateArea.json (0.00 MB, 3 条)

**字段** (9): `ANKBAKDHDJD, BEOFPCAACEP, ECCJCKCCPBP, FAEHFMIFPBG, GIGIHGOFGMN, LMFDBGIAPFC, LMPLLJFMFEC, MHNEABPPJBG, NDAAAOEGMNL`

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
  "ECCJCKCCPBP": "<list[8]>",
  "FAEHFMIFPBG": 3151101,
  "ANKBAKDHDJD": "Guide"
}
```

### FinishActionConfig.json (0.00 MB, 27 条)

**字段** (2): `FinishActionType, NeedVerseParam`

**首条记录摘要**:
```json
{}
```

### GridFightTraitBaseConfig_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `MGNHKOHFLPO, PNPJBPCMINL`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "<list[33]>"
}
```

### HeliobusActivityQuest.json (0.00 MB, 7 条)

**字段** (5): `ActivityModuleID, QuestList, QuestTabID, QuestTabName, TypeGroupID`

**首条记录摘要**:
```json
{
  "QuestTabID": 1,
  "QuestTabName": {
    "Hash": 14536884776425909639
  },
  "TypeGroupID": 1,
  "QuestList": "<list[7]>",
  "ActivityModuleID": 5000606
}
```

### GridFightNodeTypeShow.json (0.00 MB, 5 条)

**字段** (5): `NodeDesc, NodeDetailName, NodeName, NodePic, NodeType`

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

### FateRinChallengeFight.json (0.00 MB, 4 条)

**字段** (7): `BFMNOLGCCKH, DOBKKDIECDO, FOHHOOKJPIM, HNEIIAGADGO, JFDHFPIIGCC, OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "DOBKKDIECDO": 429401,
  "HNEIIAGADGO": 2051102,
  "JFDHFPIIGCC": 5014020,
  "BFMNOLGCCKH": "SpriteOutput/Collaboration/FateRin/FateR...",
  "FOHHOOKJPIM": "<list[5]>",
  "OENAMINOLLF": {
    "Hash": 11169810328513533655
  }
}
```

### EvolveBuildReward.json (0.00 MB, 21 条)

**字段** (3): `IncomeTarget, Level, RewardID`

**首条记录摘要**:
```json
{
  "RewardID": 100
}
```

### FateRinDeck.json (0.00 MB, 4 条)

**字段** (8): `DHJDDBMCNKJ, ENKMNJDEMJE, KJGFIMDLFHF, LIPCDDAPHNF, LOALOLNACOA, NMAHGFAPENI, NMPFJBDGGDE, PHFMCACHFIJ`

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

### FiveDimBillboardConfig.json (0.00 MB, 8 条)

**字段** (2): `BillboardPath, ID`

**首条记录摘要**:
```json
{
  "ID": 1001,
  "BillboardPath": "Stages/OriginalResPos/InteractiveProp/Ch..."
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

### GachaTypeBasicInfo.json (0.00 MB, 6 条)

**字段** (7): `BuyPos, DiamondID, GachaBar, GachaTypeID, ItemCosume, ItemPrice, UpPropability`

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

### ExpeditionBattleConstCommon.json (0.00 MB, 10 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ExpeditionBattle_RouteCountPerMap",
  "Value": {
    "IntValue": 4
  }
}
```

### FateBuffSlot.json (0.00 MB, 12 条)

**字段** (5): `AEDGAKOBDOC, FMLGGKAFMKC, HNAMEIDAANH, IOHKGPKODJL, MPADIDFJBEF`

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

### GridFightProjMazebuff.json (0.00 MB, 2 条)

**字段** (14): `BuffDesc, BuffEffect, BuffIcon, BuffName, BuffRarity, BuffSeries, ID, InBattleBindingKey, InBattleBindingType, Lv, LvMax, MazeBuffType, ModifierName, ParamList`

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
  "ParamList": "<list[3]>",
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

### GridFightProjection.json (0.00 MB, 2 条)

**字段** (12): `ActivationTraitLayerList, AllMemberGeneralPropertyList, ID, MazebuffID, ParamList, ProjectionDesc, ProjectionName, Rarity, RoleID, TraitList, TraitListMemberGeneralPropertyList, UnlockType`

**首条记录摘要**:
```json
{
  "ID": 1509,
  "RoleID": 1509,
  "ProjectionDesc": {
    "Hash": 15904450975080006017
  },
  "ParamList": "<list[3]>",
  "ProjectionName": {
    "Hash": 4623922265512348344
  },
  "TraitList": [],
  "UnlockType": "SpecialGoods",
  "ActivationTraitLayerList": [],
  "MazebuffID": 35610001,
  "Rarity": 2,
  "AllMemberGeneralPropertyList": "<list[1]>",
  "TraitListMemberGeneralPropertyList": []
}
```

### EvoBdSCCardType.json (0.00 MB, 4 条)

**字段** (5): `CardBuffItemBgBig, CardBuffItemBgMid, CardBuffItemBgSmall, Season, Type`

**首条记录摘要**:
```json
{
  "Season": "SecondChapter",
  "CardBuffItemBgSmall": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "CardBuffItemBgMid": "SpriteOutput/Quest/EvolveBuild/SC/Evolve...",
  "CardBuffItemBgBig": "SpriteOutput/Quest/EvolveBuild/SC/Evolve..."
}
```

### FightFestScorePhase.json (0.00 MB, 3 条)

**字段** (8): `AvatarInfoID, PhaseID, RewardID, TargetAvatarIcon, TargetAvatarMiniIcon, TargetAvatarName, TargetScore, TargetTip`

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

### EvolveGearTypeConfig.json (0.00 MB, 3 条)

**字段** (8): `FontColor, ID, MixDetailPropsInfoBg, Name, Season, TypeImg, TypeImgColor, WeaponToastEffectBg`

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

### GridFightConsumables.json (0.00 MB, 7 条)

**字段** (6): `ConsumableDesc, ConsumableParamList, ConsumableRule, ID, IfConsume, IfStack`

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

### HeliobusChallengePhase.json (0.00 MB, 4 条)

**字段** (7): `ChallengeGroupList, ChallengePhaseID, ChallengePhaseName, ChallengePhaseUnlock, MapEntranceID, MappingInfoID, UnlockMissionID`

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

### HeliobusChallengeReward.json (0.00 MB, 5 条)

**字段** (5): `ChallengePhaseID, ChallengeRewardTabID, ChallengeRewardTabName, QuestList, UnlockQuest`

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

### GuideChallengeTab.json (0.00 MB, 5 条)

**字段** (7): `GuideType, ID, IconPath, IntroDataID, Name, Priority, ResBarKey`

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

### GameplayGuideConstValue.json (0.00 MB, 12 条)

**字段** (2): `GameplayGuideConstValueName, Value`

**首条记录摘要**:
```json
{
  "GameplayGuideConstValueName": "HandBookRogueMappingInfo",
  "Value": "2220"
}
```

### GridFightSeasonTrait_Index_SeasonID.json (0.00 MB, 1 条)

**字段** (2): `MGNHKOHFLPO, PNPJBPCMINL`

**首条记录摘要**:
```json
{
  "PNPJBPCMINL": 1,
  "MGNHKOHFLPO": "<list[25]>"
}
```

### HeliobusReward.json (0.00 MB, 16 条)

**字段** (3): `IncomeTarget, Level, RewardQuestID`

**首条记录摘要**:
```json
{}
```

### FunctionHudSpecial.json (0.00 MB, 5 条)

**字段** (8): `ActivityModuleIDList, ControlRightHud, FirstWorldText, HideConditions, ID, IsLargeBtn, NotInScheduleToast, OverrideIconPath`

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

### EvoBld2RaccoonTalk.json (0.00 MB, 4 条)

**字段** (4): `RaccoonPicPath, RaccoonState, Season, TextmapList`

**首条记录摘要**:
```json
{
  "RaccoonState": "Bad",
  "Season": "SecondChapter",
  "TextmapList": "<list[2]>",
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

### GridFightCoreRoleChoose.json (0.00 MB, 8 条)

**字段** (5): `ChooseDesc, Parameter, SubTraitID, TraitID, Type`

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

### EvolveBuildRaccoonTalk.json (0.00 MB, 4 条)

**字段** (4): `RaccoonPicPath, RaccoonState, Season, TextmapList`

**首条记录摘要**:
```json
{
  "RaccoonState": "Bad",
  "Season": "EarlyAccess",
  "TextmapList": "<list[2]>",
  "RaccoonPicPath": "SpriteOutput/Quest/EvolveBuild/RaccoonIc..."
}
```

### GridFightRarityWeight.json (0.00 MB, 10 条)

**字段** (6): `PlayerLevel, Rarity1Weight, Rarity2Weight, Rarity3Weight, Rarity4Weight, Rarity5Weight`

**首条记录摘要**:
```json
{
  "PlayerLevel": 1,
  "Rarity1Weight": 100
}
```

### GFActivityResidentConfig.json (0.00 MB, 1 条)

**字段** (12): `ActivityID, ActivityModuleID, ActivityTagList, DisplayItemList, IntroGuideImg, IsShowRemainTime, RelatedActivityPanelID, ResidentBrief, ResidentDesc, ResidentName, SortWeight, TitleIconPath`

**首条记录摘要**:
```json
{
  "ActivityID": 201,
  "ActivityModuleID": 7100501,
  "RelatedActivityPanelID": 71002,
  "IsShowRemainTime": true,
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
  "DisplayItemList": "<list[13]>",
  "IntroGuideImg": "SpriteOutput/Quest/PermanentActivity/Det...",
  "ActivityTagList": [
    3
  ],
  "SortWeight": 6036
}
```

### GridFightShopPrice.json (0.00 MB, 5 条)

**字段** (9): `BuyGoldStar1, BuyGoldStar2, BuyGoldStar3, BuyGoldStar4, Rarity, SellGoldStar1, SellGoldStar2, SellGoldStar3, SellGoldStar4`

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

### GridFightScoreReward.json (0.00 MB, 12 条)

**字段** (4): `Reward, Score, ScoreRank, ScoreRow`

**首条记录摘要**:
```json
{
  "ScoreRank": 1,
  "ScoreRow": 1,
  "Score": 1500,
  "Reward": 312901
}
```

### EvoBdSCTagConfig.json (0.00 MB, 4 条)

**字段** (6): `ExtraEffectID, ID, IconPath, Name, Season, ShopSkillID`

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

**字段** (6): `ExtraEffectID, ID, IconPath, Name, Season, ShopSkillID`

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

### EventStuffConfig.json (0.00 MB, 5 条)

**字段** (5): `EventContentTextID, EventStuffID, MissionID, MissionStartString, StuffID`

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

### GridFightGenderOverride.json (0.00 MB, 6 条)

**字段** (4): `AvatarID, JsonOverridePath, RoleID, Star`

**首条记录摘要**:
```json
{
  "RoleID": 8007,
  "AvatarID": 8008,
  "Star": 1,
  "JsonOverridePath": "Config/ConfigCharacter/GridFight/3.5/Ava..."
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

### GridFightAssistantMessage.json (0.00 MB, 4 条)

**字段** (8): `AssistantMessageType, Description, EndDivisionID, ExclusiveID, ID, Interval, Priority, TypePara`

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

### GridFightSettleRank.json (0.00 MB, 6 条)

**字段** (5): `ID, RankName, Rank_LeftInterval, Rank_RightInterval, SettleRankType`

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

**字段** (2): `NDAIGIEMABD, NLCEDPNILIE`

**首条记录摘要**:
```json
{
  "NDAIGIEMABD": 3232001
}
```

### GridFightSkinCutin.json (0.00 MB, 7 条)

**字段** (2): `CutinPath, SkinID`

**首条记录摘要**:
```json
{
  "SkinID": 1100101,
  "CutinPath": "SpriteOutput/AvatarSpecialActionFigures/..."
}
```

### HeliobusChallengeRaid.json (0.00 MB, 4 条)

**字段** (5): `ChallengeRaidID, HeliobusSkillRecList, RaidID, UnlockQuestID, UnlockTips`

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

### FateRinCaseBoard.json (0.00 MB, 6 条)

**字段** (3): `GINFOPOAKHK, GMCBNNKJAGJ, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "GMCBNNKJAGJ": 105440013,
  "GINFOPOAKHK": "Config/Level/FateRin/FateRinCaseBoardPer..."
}
```

### FantasticStoryChapter.json (0.00 MB, 3 条)

**字段** (6): `ActivityModuleID, ChapterID, FigurePath, MissionID, Name, describe`

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

### GridFightSeasonModule.json (0.00 MB, 4 条)

**字段** (7): `ActivityModuleID, ActivityQuestConfigID, GirlHeroSpecialAvatarId, MaxRewardExp, OfferingID, SeasonID, SubSeasonID`

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

### EventMissionChallenge.json (0.00 MB, 13 条)

**字段** (5): `ID, IsBeginPrepare, IsCancellable, IsResetable, LimitTime`

**首条记录摘要**:
```json
{
  "ID": 900003,
  "LimitTime": 60,
  "IsBeginPrepare": true,
  "IsCancellable": true
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

### GridFightGuideQuest.json (0.00 MB, 4 条)

**字段** (3): `ChapterAimQuest, ChapterID, QuestList`

**首条记录摘要**:
```json
{
  "ChapterID": 1,
  "ChapterAimQuest": 7300001,
  "QuestList": "<list[5]>"
}
```

### FateRinHouguMapGroup.json (0.00 MB, 3 条)

**字段** (5): `AJCDFGPPLJP, CJEEEFLFFOL, LIPCDDAPHNF, OENAMINOLLF, PHFMCACHFIJ`

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

### GFTraitElationProperty.json (0.00 MB, 8 条)

**字段** (2): `ExtraEffectID, PropertyType`

**首条记录摘要**:
```json
{
  "PropertyType": "ExtraFrontPowerAddedRatio1",
  "ExtraEffectID": 80000101
}
```

### GuideRogueTab.json (0.00 MB, 3 条)

**字段** (6): `GuideType, ID, IconPath, Name, Priority, ResBarKey`

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

### FateRinHouguTag.json (0.00 MB, 5 条)

**字段** (3): `NHALJPDONCP, OCBFMPOCBIK, PHFMCACHFIJ`

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

### FateRinOwner.json (0.00 MB, 6 条)

**字段** (2): `OENAMINOLLF, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": "Rin",
  "OENAMINOLLF": {
    "Hash": 4000111212109118117
  }
}
```

### GameModeGroup.json (0.00 MB, 3 条)

**字段** (2): `GameModeGroupID, GamemodeList`

**首条记录摘要**:
```json
{
  "GameModeGroupID": 1001,
  "GamemodeList": "<list[10]>"
}
```

### GridFightRoleGlobalModifier.json (0.00 MB, 6 条)

**字段** (3): `PerformParamList, Roleid, SavedValueName`

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

### GridFightBinaryDiffAddRule.json (0.00 MB, 8 条)

**字段** (3): `EnemyDifficultyAddValue, ID, Quality`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Quality": 1
}
```

### FantasticStoryConfig.json (0.00 MB, 1 条)

**字段** (6): `ActivityModuleID, BattleIDList, BuffIDList, BuffSlotIDList, ChapterIDList, FantasticStoryID`

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
  "BuffIDList": "<list[23]>",
  "BuffSlotIDList": [
    1,
    2,
    3,
    4
  ],
  "ActivityModuleID": 4000208
}
```

### FateRinResidentReward.json (0.00 MB, 5 条)

**字段** (2): `ELJPCBHPKJK, IEHAFKLEBEF`

**首条记录摘要**:
```json
{
  "ELJPCBHPKJK": "<list[5]>"
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

### FateRinStoryFight.json (0.00 MB, 6 条)

**字段** (3): `DOBKKDIECDO, HNEIIAGADGO, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "DOBKKDIECDO": 429001,
  "HNEIIAGADGO": 2050101
}
```

### GridFightOrbDisplay.json (0.00 MB, 4 条)

**字段** (3): `IconPath, OrbType, PrefabPath`

**首条记录摘要**:
```json
{
  "OrbType": "White",
  "IconPath": "SpriteOutput/GridFight/GridItem/GridFigh...",
  "PrefabPath": ""
}
```

### GridFightExpertRestrict.json (0.00 MB, 5 条)

**字段** (5): `Chapter, Cost, OCChapter, OCSection, Section`

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

**字段** (3): `AAGKEBFHLMC, NIHODMLGCIK, POLNOFFLNID`

**首条记录摘要**:
```json
{
  "AAGKEBFHLMC": 1
}
```

### GridFightTraitSPBattleArea.json (0.00 MB, 4 条)

**字段** (3): `BattleAreaNumList, ID, TraitLayer`

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

### GridFightFormationWave.json (0.00 MB, 5 条)

**字段** (4): `Ability, ID, MaxTeammateCount, ParamList`

**首条记录摘要**:
```json
{
  "ID": 5,
  "MaxTeammateCount": 5,
  "Ability": "",
  "ParamList": []
}
```

### GachaNews.json (0.00 MB, 2 条)

**字段** (5): `AvatarList, DecideID, Desc, NewsID, Title`

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

### FateRinDayProgress.json (0.00 MB, 7 条)

**字段** (2): `DHONGKBFCNE, GNIFLCBGAAA`

**首条记录摘要**:
```json
{
  "GNIFLCBGAAA": 1,
  "DHONGKBFCNE": 105440019
}
```

### GridFightPresentConfig.json (0.00 MB, 2 条)

**字段** (5): `BonusID, ID, PresentDesc, PresentName, ShortenType`

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

### ExpeditionGroup.json (0.00 MB, 3 条)

**字段** (3): `GroupID, IconPath, Name`

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

**字段** (4): `BEID, BackJsonOverride, FrontJsonOverride, SeasonID`

**首条记录摘要**:
```json
{
  "SeasonID": 1,
  "BEID": 11222,
  "FrontJsonOverride": "Config/ConfigCharacter/GridFight/3.5/Ava...",
  "BackJsonOverride": ""
}
```

### GridFightVictoryBonus.json (0.00 MB, 7 条)

**字段** (3): `ExtraGroupID, GoldBonus, VictoryCount`

**首条记录摘要**:
```json
{
  "GoldBonus": 1,
  "ExtraGroupID": 2
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

### EvoBdSCBoxGroup.json (0.00 MB, 5 条)

**字段** (2): `BoxItemIDList, GroupID`

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

### FateRinOwnerInitHougu.json (0.00 MB, 6 条)

**字段** (2): `KFFNBKGCCKO, PHFMCACHFIJ`

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

### FateRinMainMissions.json (0.00 MB, 6 条)

**字段** (2): `KGOOAOJLLDA, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "KGOOAOJLLDA": 1054400
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

### EvolveBuildMonsteCollection.json (0.00 MB, 6 条)

**字段** (2): `ID, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 302401007,
  "UnlockQuest": 6070000
}
```

### HeartDialEmo.json (0.00 MB, 4 条)

**字段** (2): `EmoName, EmoType`

**首条记录摘要**:
```json
{
  "EmoName": {
    "Hash": 4283366908221791014
  }
}
```

### GridFightHandBookReward.json (0.00 MB, 2 条)

**字段** (2): `HandBookType, QuestList`

**首条记录摘要**:
```json
{
  "HandBookType": "HandBookAugment",
  "QuestList": "<list[6]>"
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

### GachaPoolReward.json (0.00 MB, 1 条)

**字段** (8): `ActivityID, Bubble, Desc, GachaID, ID, QuestID, Tips, Title`

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

### GridFightGamePlayResource.json (0.00 MB, 2 条)

**字段** (4): `Desc, ID, IconPath, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": "ResourceName_1",
  "Desc": "ResourceDesc_1",
  "IconPath": "SpriteOutput/GridFight/GridItem/281034.p..."
}
```

### FateMiscDisplay.json (0.00 MB, 3 条)

**字段** (2): `FNBIFDIHIJH, LOEPLBPFMEN`

**首条记录摘要**:
```json
{
  "LOEPLBPFMEN": 101,
  "FNBIFDIHIJH": {
    "Hash": 7832065335160047335
  }
}
```

### GridFightRoleSwitchConfig.json (0.00 MB, 2 条)

**字段** (4): `BaseRoleID, Condition, ParamList, RoleID`

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

### GridFightTraitBonusAddRule.json (0.00 MB, 3 条)

**字段** (3): `ID, ParamList, TraitBonusType`

**首条记录摘要**:
```json
{
  "ID": 10031,
  "ParamList": []
}
```

### GrowthTargetTimeLimitTop.json (0.00 MB, 4 条)

**字段** (2): `ActivityModule, GachaID`

**首条记录摘要**:
```json
{
  "GachaID": 5001,
  "ActivityModule": 1011001
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

### EquipmentExpItemConfig.json (0.00 MB, 3 条)

**字段** (3): `CoinCost, ExpProvide, ItemID`

**首条记录摘要**:
```json
{
  "ItemID": 221,
  "ExpProvide": 500,
  "CoinCost": 250
}
```

### HPShowRule.json (0.00 MB, 3 条)

**字段** (4): `Color, ID, IsDanger, Max`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Max": 0.3,
  "Color": "#e23977ff",
  "IsDanger": true
}
```

### GachaCeiling.json (0.00 MB, 1 条)

**字段** (4): `CeilingItemList, CeilingNum, CeilingType, GachaType`

**首条记录摘要**:
```json
{
  "GachaType": "Normal",
  "CeilingType": "Option",
  "CeilingNum": 300,
  "CeilingItemList": "<list[7]>"
}
```

### FateRinHouguRarity.json (0.00 MB, 3 条)

**字段** (2): `OCBFMPOCBIK, PMIEAEGJNMJ`

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

### GridFightUnlock.json (0.00 MB, 3 条)

**字段** (2): `QuestID, UnlockID`

**首条记录摘要**:
```json
{
  "UnlockID": 1001,
  "QuestID": 7302101
}
```

### ExpeditionTeam.json (0.00 MB, 4 条)

**字段** (2): `TeamID, UnlockMission`

**首条记录摘要**:
```json
{
  "TeamID": 1
}
```

### GridFightModuleSubTrait.json (0.00 MB, 2 条)

**字段** (3): `ModuleID, SubTraitID, TraitID`

**首条记录摘要**:
```json
{
  "TraitID": 1013,
  "ModuleID": 7110501,
  "SubTraitID": 10132
}
```

### ExpeditionBattleConstClient.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ExpeditionBattle_Quest_ActivityRewardID",
  "Value": {
    "IntValue": 50106
  }
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

### GridFightModuleBanRole.json (0.00 MB, 2 条)

**字段** (2): `ModuleId, RoleId`

**首条记录摘要**:
```json
{
  "RoleId": 1509,
  "ModuleId": 7110501
}
```

### EnergyBarConfig.json (0.00 MB, 0 条)

### ENpcA07.json (0.00 MB, 0 条)

### FinishTypeConfigLD.json (0.00 MB, 0 条)

### FreeStyleCharacterInfoLD.json (0.00 MB, 0 条)

### GachaShowToastData.json (0.00 MB, 0 条)

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
