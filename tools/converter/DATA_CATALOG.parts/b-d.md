# DATA_CATALOG 分片：文件名首字母 BCD

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 b-d（共 319 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### CycleQuest.json (0.68 MB, 2,733 条)

**字段** (10): `ActivityModuleID, CycleID, Cycledays, FinishedTimes, IsNonPeriodic, MaxLevel, MinLevel, QuestList, ScheduleDataID, WeekDayList`

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

### ChallengeMazeConfig.json (0.53 MB, 627 条)

**字段** (25): `ChallengeCountDown, ChallengeTargetID, ConfigList1, ConfigList2, DamageType1, DamageType2, EventIDList1, EventIDList2, Floor, GroupID, ID, MapEntranceID, MapEntranceID2, MazeBuffID, MazeGroupID1, MazeGroupID2, MonsterID1, MonsterID2, Name, NpcMonsterIDList1, NpcMonsterIDList2, PreChallengeMazeID, PreLevel, RewardID, StageNum`

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

### DialogueNPC.json (0.50 MB, 1,725 条)

**字段** (7): `ActPath, ConditionIDs, GroupID, GroupType, IconType, InteractTitle, Priority`

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

### ClockParkCardAction.json (0.46 MB, 738 条)

**字段** (10): `CardActionID, CardDesc, DiceList, EffectList, ForeImgPath, ImgPath, ImgPath1, ImgPath2, ImgPath3, SuccessEffectList`

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

### ConstValueClient.json (0.33 MB, 2,089 条)

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

### BattleEventConfig.json (0.32 MB, 498 条)

**字段** (16): `AbilityList, ActionBarDescrptionText, AssetPackName, BEActionBarType, BattleEventButtonType, BattleEventID, BattleEventName, DescrptionText, EliteGroup, EventSubType, HardLevel, HeadIcon, OverrideProperty, ParamList, Speed, Team`

**首条记录摘要**:
```json
{
  "BattleEventID": 1,
  "Team": "TeamNeutral",
  "EventSubType": "ChallengerEvent",
  "BattleEventName": "BattleEventName_1",
  "HeadIcon": "SpriteOutput/AvatarIconTeam/999.png",
  "AbilityList": "<list[4]>",
  "OverrideProperty": "<list[1]>",
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

### BattleEventSkillConfig.json (0.29 MB, 324 条)

**字段** (26): `AttackType, BPNeed, CutinPath, DelayRatio, ParamList, SPAdd, SPBase, SPMultipleRatio, SPNeed, ShowStanceList, SimpleParamList, SimpleSkillDesc, SkillButtonEffType, SkillComboValueDelta, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillNeed, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

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
  "ParamList": [],
  "SimpleParamList": [],
  "AttackType": "Ultra",
  "SkillEffect": "Support",
  "SkillButtonEffType": ""
}
```

### CocoonConfig.json (0.22 MB, 427 条)

**字段** (16): `AutoObtainDamageType, BuffDesc, CocoonType, DamageType, DropList, FarmType, ID, MappingInfoID, MaxChallengeCnt, OpenDate, ParamList, PropID, StageID, StageIDList, StaminaCost, WorldLevel`

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
  "DropList": "<list[9]>",
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

### BookSeriesConfig.json (0.18 MB, 828 条)

**字段** (6): `BookSeries, BookSeriesComments, BookSeriesID, BookSeriesNum, BookSeriesWorld, IsShowInBookshelf`

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

### ClockParkCard.json (0.14 MB, 348 条)

**字段** (11): `CardActionList, CardConflictTagList, CardDesc, CardDiceNum, CardID, CardTips, CardTipsParam, CardType, ForeImgPath, ImgPath, Priority`

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

### ChimeraDuelSkill.json (0.14 MB, 320 条)

**字段** (12): `AbilityJsonPath, AdditionalTriggerConditionList, Description, HasDisplay, IsImmediate, ParamList, PlainDescription, Priority, SkillCD, SkillID, TriggerEventList, Type`

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

### ChenLingEnemy.json (0.12 MB, 368 条)

**字段** (11): `AtkRatio, AtkSpdRatio, CrtDMGRatio, CrtRatio, EnchantList, GridIndex, HpRatio, ID, IsPromotion, Level, SoldierID`

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

### DialogueCondition.json (0.11 MB, 1,081 条)

**字段** (4): `ID, Param1, Param2, Type`

**首条记录摘要**:
```json
{
  "ID": 200045,
  "Type": "submission_state_equal",
  "Param1": 404018901,
  "Param2": 1
}
```

### DialogueProp.json (0.11 MB, 378 条)

**字段** (7): `ActPath, ConditionIDs, GroupID, GroupType, IconType, InteractTitle, Priority`

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

### BattleEventData.json (0.10 MB, 458 条)

**字段** (8): `BEActionBarPrefab, BasePoint, BattleEventID, Config, IsSPReserved, LevelAreaPrefab, Prefab, SkillIDList`

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

### ChimeraWorkData.json (0.09 MB, 254 条)

**字段** (9): `Atk, DisplayID, Hp, JsonConfig, Tag, WorkID, WorkIcon, WorkPrefab, WorkValue`

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

### BattleEventSkillConfigLD.json (0.09 MB, 100 条)

**字段** (19): `AttackType, BPNeed, CutinPath, DelayRatio, ParamList, SPMultipleRatio, SPNeed, ShowStanceList, SimpleParamList, SimpleSkillDesc, SkillButtonEffType, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
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

### ChallengeStoryMazeConfig.json (0.08 MB, 108 条)

**字段** (23): `ChallengeTargetID, ConfigList1, ConfigList2, DamageType1, DamageType2, EventIDList1, EventIDList2, Floor, GroupID, ID, MapEntranceID, MapEntranceID2, MazeBuffID, MazeGroupID1, MazeGroupID2, MonsterID1, MonsterID2, Name, NpcMonsterIDList1, NpcMonsterIDList2, PreChallengeMazeID, RewardID, StageNum`

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

### ClockParkEffect.json (0.08 MB, 530 条)

**字段** (9): `DiceParam, EffectID, EffectType, Param1, Param2, Param3, ParamList, PlayCardEffectDesc, PlayCardEffectDescParamList`

**首条记录摘要**:
```json
{
  "ParamList": [],
  "PlayCardEffectDescParamList": []
}
```

### ChallengeBossMazeConfig.json (0.07 MB, 88 条)

**字段** (23): `ChallengeTargetID, ConfigList1, ConfigList2, DamageType1, DamageType2, EventIDList1, EventIDList2, Floor, GroupID, ID, MapEntranceID, MapEntranceID2, MazeBuffID, MazeGroupID1, MazeGroupID2, MonsterID1, MonsterID2, Name, NpcMonsterIDList1, NpcMonsterIDList2, PreChallengeMazeID, RewardID, StageNum`

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

### CakeRacePerformance.json (0.06 MB, 335 条)

**字段** (6): `AudioTag, PerformTextmap, PerformType, PerformanceID, PerformanceParam, Priority`

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

### BackGroundMusic.json (0.06 MB, 283 条)

**字段** (6): `BGMDesc, GroupID, ID, MusicName, Unlock, UnlockDesc`

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

### BattleAchievement.json (0.06 MB, 494 条)

**字段** (5): `AbilityName, BattleAchievementID, ExcludeTagList, GameModeGroup, NeedTagList`

**首条记录摘要**:
```json
{
  "BattleAchievementID": 20001,
  "AbilityName": "StageAbility_Scoring_20001",
  "NeedTagList": [],
  "ExcludeTagList": []
}
```

### BattleFailureTipsConfig.json (0.06 MB, 79 条)

**字段** (15): `BattleFailureTipID, CustomStringList, GameModeList, MainMissionFinishForce, MainMissionTakenForce, MainMissionUnfinishForce, MazebuffIDList, MonsterTemplateIDList, PlayerLevel, Priority, StageIDForce, StageTypeForce, TipContent, Type, WorldList`

**首条记录摘要**:
```json
{
  "BattleFailureTipID": 1,
  "TipContent": {
    "Hash": 7533112957357412991
  },
  "GameModeList": "<list[10]>",
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

### ChestGroupProperty.json (0.06 MB, 326 条)

**字段** (7): `ChestID, FloorID, GPValue, GroupID, GroupProperty, InstanceID, LittleGameEntityID`

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

### BattleTargetConfig.json (0.06 MB, 143 条)

**字段** (16): `AbilityName, HintStep, ID, IconNum, IconType, IsFixableHeight, IsShowProgress, MultiTarget, MultiTargetIconType, ParamType, ShowInScoreCounter, SkipWhenSuccessOnEnterBattle, TargetName, TargetNameSimple, TargetParam, Type`

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

### ChimeraDuelChimeraPreset.json (0.05 MB, 550 条)

**字段** (7): `ChimeraID, ChimeraPresetID, DeltaAttack, DeltaHP, EquipmentID, ExpGained, SpecialParam`

**首条记录摘要**:
```json
{
  "ChimeraPresetID": 1011,
  "ChimeraID": 108
}
```

### ChimeraDuelTalkConfig.json (0.05 MB, 303 条)

**字段** (5): `ChimeraDuelTalkText, ID, TalkID, TriggerEventID, Type`

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

### DrinkMakerGuestComment.json (0.05 MB, 144 条)

**字段** (8): `CommentContent, CommentID, GuestID, IconPath, SatisfyTriggerType, TriggerTypeParamList, Type, Weight`

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

### ChronicleConclusion.json (0.04 MB, 450 条)

**字段** (2): `MissionConclusion, MissionID`

**首条记录摘要**:
```json
{
  "MissionID": 1000101,
  "MissionConclusion": {
    "Hash": 6221540891368254044
  }
}
```

### ChimeraDuelChimera.json (0.04 MB, 73 条)

**字段** (15): `BaseAttack, BaseHp, ChimeraHeadIconPath, ChimeraID, ChimeraIconPath, ChimeraName, EmojiPath, ModelBody, ModelEye, ModelHorn, ModelItemMatOverride, ModelTail, ModelWing, Price, Rarity`

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

### ChimeraTalk.json (0.04 MB, 295 条)

**字段** (3): `EvPath, TalkContent, TalkID`

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

### BattlePassLevel.json (0.04 MB, 350 条)

**字段** (7): `FreeReward, GroupID, Level, PremiumFixedReward1, PremiumFixedReward2, PremiumOptional, SpeicalPoint`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "Level": 1,
  "FreeReward": 120001,
  "PremiumFixedReward1": 120101
}
```

### BackGroundMusicNormal.json (0.04 MB, 269 条)

**字段** (4): `FCHEGBOMJHB, KILDBPGFAPG, PHFMCACHFIJ, PNOPJBELEDM`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 210000,
  "KILDBPGFAPG": "BGM_Spacetrain",
  "PNOPJBELEDM": 112,
  "FCHEGBOMJHB": "TYPE_EASY"
}
```

### ChenLingFesItem.json (0.03 MB, 59 条)

**字段** (15): `BaseCoinNum, BaseLoopInterval, BaseMaxEffectTriggerNum, BaseProbability, EffectItemTypeList, ID, IconPath, ItemDesc, ItemName, LogicJsonPath, MaxPutDownNum, ParamList, Rare, TagList, ViewJsonPath`

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

### ClientLogConfig.json (0.03 MB, 153 条)

**字段** (4): `Actionid, ID, IsWhiteMode, Params`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Actionid": 1026,
  "Params": "<dict[1]>"
}
```

### BoxingClubStageGroup.json (0.03 MB, 43 条)

**字段** (6): `DisplayEventIDList, DisplayIndexList, EventIDList, MonsterIDList, StageGroupID, Weight`

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
  "MonsterIDList": "<list[20]>",
  "DisplayEventIDList": "<list[17]>",
  "DisplayIndexList": [
    9,
    5,
    1,
    12
  ]
}
```

### ConstValueCommon.json (0.03 MB, 281 条)

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

### B51RacingTR.json (0.03 MB, 99 条)

**字段** (10): `AvatarIconPath, DriverID, ID, MaxCount, Priority, TRContent, TRName, Type, TypeCD, VoiceID`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Type": "RaceStart",
  "Priority": 100,
  "MaxCount": 1,
  "TypeCD": 999,
  "TRName": {
    "Hash": 523944838451989252
  },
  "TRContent": {
    "Hash": 13485609647660094837
  },
  "AvatarIconPath": "SpriteOutput/UI/Quest/B51Racing/HUD/B51R...",
  "VoiceID": 841110001
}
```

### ChallengeGroupConfig.json (0.03 MB, 57 条)

**字段** (15): `BackGroundPath, ChallengeGroupType, GroupID, GroupName, MapEntranceID, MappingInfoID, MazeBuffID, PreMissionID, RewardLineGroupID, ScheduleDataID, TabPicPath, TabPicSelectPath, ThemePicPath, TierceID, WorldID`

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

### BattlePassConfig.json (0.03 MB, 31 条)

**字段** (16): `BattlePassWeekID, BillboardShow, EquipmentShow, GroupID, ID, LevelUpShow, NextID, Purchase128, Purchase68, RefreshBeginWeek, ScheduleDataID, VersionQuestList, WeekChainQuestList, WeekOrder1, WeekOrder2, WeekQuestList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "GroupID": 1,
  "NextID": 2,
  "ScheduleDataID": 1000001,
  "BattlePassWeekID": 1,
  "WeekQuestList": "<list[6]>",
  "WeekOrder1": [
    2000102,
    2000103
  ],
  "WeekOrder2": [],
  "WeekChainQuestList": [],
  "VersionQuestList": "<list[6]>",
  "LevelUpShow": [],
  "BillboardShow": [],
  "EquipmentShow": []
}
```

### BillboardIconConfig.json (0.03 MB, 216 条)

**字段** (3): `BillboardIconPath, ID, Priority`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Priority": 1,
  "BillboardIconPath": "SpriteOutput/MapPics/Billboard/IconBillb..."
}
```

### BoxingClubStage.json (0.03 MB, 97 条)

**字段** (7): `BubbleTalkEnemy, BubbleTalkPlayer, BuffID, BuffOptionalList, EventID, MonsterWaveIndex, Name`

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

**字段** (4): `GroupID, ID, ItemList, ItemRareWeight`

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

### ChallengeTargetConfig.json (0.02 MB, 133 条)

**字段** (5): `ChallengeTargetName, ChallengeTargetParam1, ChallengeTargetType, ID, RewardID`

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

### ChestMonster.json (0.02 MB, 134 条)

**字段** (8): `ConfigID, EventID, FloorID, GroupID, ID, MainMissionID, MonsterType, PlaneID`

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

### CommonAvatarSkillConfig.json (0.02 MB, 17 条)

**字段** (35): `AttackType, BPAdd, BPNeed, CoolDown, DelayRatio, ExtraEffectIDList, HideInUI, InitCoolDown, Level, LevelUpCostList, MaxLevel, ParamList, RatedRankID, RatedSkillTreeID, SPBase, SPMultipleRatio, SPNeed, ShowDamageList, ShowHealList, ShowStanceList, SimpleExtraEffectIDList, SimpleParamList, SimpleSkillDesc, SkillComboValueDelta, SkillDesc, SkillEffect, SkillID, SkillIcon, SkillName, SkillTag, SkillTriggerKey, SkillTypeDesc, StanceDamageDisplay, StanceDamageType, UltraSkillIcon`

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
  "ShowStanceList": "<list[3]>",
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

### ContentPackageConfig.json (0.02 MB, 49 条)

**字段** (9): `ActivityModuleID, AfterGuideEntranceID, ContentID, EarlyAccessCondition, GuideConditions, InitEntranceID, IsHaveResidentPart, MainMissionIDList, ReleaseCondition`

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

### CakeConfig.json (0.02 MB, 27 条)

**字段** (12): `CakeDarkMatPath, CatCakeHeadIcon, CatCakeMiniIcon, CatCakeTailPath, CatCaughtLines, CatMatPath, CatMissedLines, CatTailColour, ID, NPCID, RuanMadeCakeName, RuanMadeCakeStory`

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

### CutsceneActor.json (0.02 MB, 111 条)

**字段** (4): `ActorID, ActorModelPath, ResidentEffectKey, ResidentPossessionKey`

**首条记录摘要**:
```json
{
  "ActorID": "Actor_Bronya_00",
  "ActorModelPath": "Characters/CharacterPrefabs/Actor/Actor_...",
  "ResidentEffectKey": [],
  "ResidentPossessionKey": ""
}
```

### ChenLingCard.json (0.02 MB, 52 条)

**字段** (10): `EffectGridPreShow, ID, IconOutlinePath, IconPath, IsSpecialCard, ParamList, ShopCost, Type, TypeID, Weight`

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

### DrinkMakerCheersIngredient.json (0.02 MB, 38 条)

**字段** (9): `Color, EffParam, ID, IconPath, IncludeTagList, IngredientDesc, IngredientName, PhyParam, SmallIconPath`

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

### ChimeraDuelItem.json (0.02 MB, 48 条)

**字段** (10): `ChimeraItemIconPath, EffectID, ItemID, ItemName, Price, Rarity, ShopItemIconPath, SkillIDList, Type, Vendor`

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

### ChenLingSoldierUnit.json (0.02 MB, 50 条)

**字段** (12): `Atk, AtkSpd, Crt, CrtDMG, Hp, MoveSpd, Range, ReadyScale, Scale, SoldierID, UnitID, UnitLevel`

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

### ChimeraDuelPresetTeam.json (0.02 MB, 144 条)

**字段** (3): `MasterID, PresetIDList, TeamID`

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

### ChallengeStoryGroupExtra.json (0.02 MB, 27 条)

**字段** (10): `BuffList, GroupID, StoryType, SubMazeBuffList, ThemeID, ThemeIconPicPath, ThemePosterBgPicPath, ThemePosterEffectPrefabPath, ThemePosterTabPicPath, ThemeToastPicPath`

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

### ChimeraDuelRound.json (0.02 MB, 55 条)

**字段** (8): `RoundID, ShopChimeraGroup, ShopChimeraSlotCount, ShopChimeraWeightList, ShopItemGroup, ShopItemSlotCount, ShopItemWeightList, ShopUnlockTutorial`

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

### ChallengeBadgeConfig.json (0.02 MB, 27 条)

**字段** (12): `BadgeID, ChallengePeakGroupID, ChallengePeakLevel, ComeFromGoto, ComeFromText, Desc, IconFigurePath, IconItemPath, IconMiddlePath, Name, Prefab, Type`

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

### ChallengePeakConfig.json (0.02 MB, 40 条)

**字段** (8): `DamageType, EventIDList, HPProgressValueList, ID, NormalTargetList, ProgressValueList, TagList, Title`

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

### BattleBGM.json (0.02 MB, 197 条)

**字段** (3): `BGMName, Priority, StageType`

**首条记录摘要**:
```json
{
  "BGMName": "State_Combat_Silence",
  "Priority": 100
}
```

### CutSceneConfig.json (0.02 MB, 41 条)

**字段** (12): `CaptionPath, CutSceneBGMStateName, CutSceneName, CutScenePath, CutSceneSFXJsonPath, HideBlockList, IsPlayerInvolved, MazeFloorID, MazePlaneID, PosOffSet, SFXID, VoiceID`

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

### DailyMissionData.json (0.02 MB, 88 条)

**字段** (6): `DailyMissionType, GroupID, ID, IconPath, QuestID, UnlockMainMission`

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

### CakeRaceCat.json (0.02 MB, 15 条)

**字段** (17): `BetPerformanceIDList, CakeTips, CatAIJson, CatAbilityJson, CatID, CatIcon, CatMatPath, CatMiddleIcon, CatMiniIcon, CatName, CatPrefabPath, CatSkillDesc, CatSkillTitle, ChampionPerformanceIDList, RunnerupPerformanceIDList, StartPerformanceIDList, TitlePerformanceIDList`

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

### ChimeraDuelMaster.json (0.02 MB, 13 条)

**字段** (26): `AvatarID, BattleAvatarFloorConfigID, BattleOpponentAvatarFloorConfigID, BattleVSBodyType, ChimeraSkillDescription, Difficulty, DrawEmojiPath, DrawText, FigurePath, FloorGroupID, FriendChallengeMasterIcon, LossEmojiPath, LossText, MasterAudio, MasterDisplayOrder, MasterHeadIconPath, MasterID, MasterSelectAvatarFloorConfigID, MasterSkillDescription, RecommendationTitle, SignatureChimeraID, SkillIDList, TalkSentenceID, UnlockRequiredGameID, VictoryEmojiPath, VictoryText`

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

### BlindBoxPetAppearance.json (0.01 MB, 34 条)

**字段** (8): `CHMJNLMHJBA, EGBGCKNLHDH, FNBGMDDOHEA, GEANMKLMFEI, IODLAAIECIG, OLJDOBFJLOM, OLOIFNNLKJP, PBLDLDIEFNC`

**首条记录摘要**:
```json
{
  "PBLDLDIEFNC": 251501,
  "FNBGMDDOHEA": 46001,
  "EGBGCKNLHDH": "Characters/CharacterPrefabs/Manikin/Pet/...",
  "OLJDOBFJLOM": "Config/ConfigCharacter/Manikin/Pet/Manik...",
  "OLOIFNNLKJP": "SpriteOutput/ItemIcon/Pet/251501.png",
  "CHMJNLMHJBA": "SpriteOutput/ItemFigures/Pet/251501.png",
  "GEANMKLMFEI": {
    "Hash": 16915352016841396247
  }
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

### ChenLingGameBoyRankingsNPC.json (0.01 MB, 56 条)

**字段** (5): `GameBoyRankingsNPCID, NPCIconPath, NPCNameID, NPCScore, NPCSignature`

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

### ChallengeBossGroupExtra.json (0.01 MB, 22 条)

**字段** (10): `BossPositionDetailPrefabPath3, BossPositionEntrancePrefabPath3, BossPositionPrefabPath1, BossPositionPrefabPath2, BuffList1, BuffList2, BuffList3, GroupID, ThemeIconPicPath, ThemePosterTabPicPath`

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

### DrinkMakerRequestData.json (0.01 MB, 59 条)

**字段** (8): `BanModeEntrance, FailTip, Mode, ParamList, RequestDesc, RequestID, RequestShortDesc, SuccessTip`

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

### CakeRaceAvatarTalk.json (0.01 MB, 59 条)

**字段** (5): `AvatarIcon, AvatarName, AvatarTalkID, FemaleAvatarIcon, TalkText`

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

### ClockParkCheckPoint.json (0.01 MB, 17 条)

**字段** (8): `CheckFailTextList, CheckParam1, CheckParam2, CheckParam3, CheckPoint, CheckPointID, CheckPointType, CheckWinTextList`

**首条记录摘要**:
```json
{
  "CheckPointID": 111,
  "CheckPointType": "AttrGreaterEqual",
  "CheckParam1": 15,
  "CheckPoint": {
    "Hash": 1246869436751600127
  },
  "CheckWinTextList": "<list[5]>",
  "CheckFailTextList": "<list[6]>"
}
```

### ChallengeStoryGroupConfig.json (0.01 MB, 27 条)

**字段** (12): `BackGroundPath, ChallengeGroupType, GroupID, GroupName, MazeBuffID, PreMissionID, RewardLineGroupID, ScheduleDataID, TabPicPath, TabPicSelectPath, ThemePicPath, TierceID`

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

### DrinkMakerFormula.json (0.01 MB, 26 条)

**字段** (14): `CupID, DecoID, FormulaDesc, FormulaID, FormulaName, IceID, IconPath, IngredientList, IsChallengeMode, IsMission, MixRate, SmallIconPath, UnlockParam, UnlockType`

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

### ChallengeStoryMazeExtra.json (0.01 MB, 108 条)

**字段** (4): `BattleTargetID, ClearScore, ID, TurnLimit`

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

### ClockParkChapterConfig.json (0.01 MB, 28 条)

**字段** (12): `ChapterAutoUnlock, ChapterGamePlayRoundRandomList, ChapterID, ChapterRoundIDList, ChapterStoryIDList, ChapterTitle, ChapterType, CheckPointList, NextChapterID, RewardID, RewardProgress, SuccessToRoundID`

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

### ChenLingStageWave.json (0.01 MB, 85 条)

**字段** (4): `EnemyList, StageID, Type, Wave`

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

### BattleEventConfigLD.json (0.01 MB, 21 条)

**字段** (14): `AbilityList, AssetPackName, BattleEventButtonType, BattleEventID, BattleEventName, DescrptionText, EliteGroup, EventSubType, HardLevel, HeadIcon, OverrideProperty, ParamList, Speed, Team`

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
  "OverrideProperty": "<list[1]>",
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

### ChimeraData.json (0.01 MB, 27 条)

**字段** (13): `Body, ChimeraID, ChimeraIcon, DataJson, DisplayID, Eye, Horn, RaritySetting, Sort, Tail, Type, VoiceType, Wing`

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

### ChallengeBossGroupConfig.json (0.01 MB, 22 条)

**字段** (12): `BackGroundPath, ChallengeGroupType, GroupID, GroupName, MazeBuffID, PreMissionID, RewardLineGroupID, ScheduleDataID, TabPicPath, TabPicSelectPath, ThemePicPath, TierceID`

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

### ChallengePeakGroupConfig.json (0.01 MB, 10 条)

**字段** (14): `ActivityModule, BossLevelID, BossUI3DAnimatorPath, BossUI3DPrefabPath, HandBookPanelBannerPath, HintGoodsID, ID, PreLevelIDList, RankIconPathList, RecommendID, RewardGroupID, ThemeIconPicPath, ThemePosterTabPicPath, Title`

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
  "RankIconPathList": "<list[4]>"
}
```

### CakeRaceEffect.json (0.01 MB, 25 条)

**字段** (9): `AbilityJson, AllowRegionTagList, AllowSectionIndex, EffectDesc, EffectID, EffectIcon, EffectName, NotAllowRegionTagList, ParamList`

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

### ChenLingEnemyMaterialMap.json (0.01 MB, 72 条)

**字段** (3): `MaterialPath, SoldierID, StageID`

**首条记录摘要**:
```json
{
  "StageID": 1,
  "SoldierID": 1,
  "MaterialPath": "Characters/NPC/Special/ChenLing_00/Matie..."
}
```

### BattleArea.json (0.01 MB, 98 条)

**字段** (9): `BattleAreaGroupID, BattleAreaID, FloorBattleAreaID, FloorID, ID, IsLegacy, IsUseUnifiedConfig, PlaneID, UnifiedConfigID`

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

### DamageType.json (0.01 MB, 7 条)

**字段** (25): `Color, CriticalDamage, DamageTypeIconPath, DamageTypeIntro, DamageTypeName, ID, IconNatureColor, IconNatureColorSimple, IconNatureForWeakActive, IconNatureForWeakUnactive, IconNatureWhite, Light1Color, LightColor, MazeEnterBattleWeakIconPath, NormalDamage, SPInfoEffFront, SPInfoEffFrontDouble, SPMazeInfoEffFront, ShaderColor, SkillBtnEff, SkillTreeDecoColor, SkillTreeLeftPanelColor, SkillTreeLightColor, SkillTreePanelPath, UnfullColor`

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

### ChatInviteConfig.json (0.01 MB, 19 条)

**字段** (11): `ChatNoticeType, ExpireTime, ID, InviteContent, InviteGo, InviteInvalid, InviteTitle, NoticeDesc, NoticeTime, PicPath, SendDesc`

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

### ChimeraDuelEffect.json (0.01 MB, 108 条)

**字段** (7): `Attack, EffectID, EffectType, Exp, Hp, ParamBool, ParamInt`

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

**字段** (5): `ChatID, FailNextChatID, PerformanceID, RequestID, SuccessNextChatID`

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

### ChimeraDuelChimeraGroup.json (0.01 MB, 57 条)

**字段** (2): `ChimeraGroupID, ChimeraIDList`

**首条记录摘要**:
```json
{
  "ChimeraGroupID": 40000,
  "ChimeraIDList": "<list[53]>"
}
```

### CakeRaceTriggerEvent.json (0.01 MB, 57 条)

**字段** (4): `ConditionIDList, EventID, TriggerEventType, TriggerPerformanceIDList`

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

### ChenLingEffect.json (0.01 MB, 80 条)

**字段** (7): `EffectType, ID, Param1, Param2, Param3, Param4, ParamList`

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

### ChenLingGameBoyCase.json (0.01 MB, 14 条)

**字段** (16): `ChallengeTimeLimit, CheatCodeList, CheatQuestID, CheatSettlementTitleID, CoverImagePath, FDCheatEntityID, FDCheatInstanceID, FDGroupID, FDHardEntityID, FDHardInstanceID, GameBoyCaseID, GameBoyChallengeIDList, GameBoyNameID, GameBoyThemeID, RankingsNPCList, SettlementTitleID`

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

### B51RacingMatch.json (0.01 MB, 29 条)

**字段** (7): `EnemyCarIDList, ID, IsTutorial, LockDriverID, Name, TeamRankList, TrackIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 12321308079432408117
  },
  "EnemyCarIDList": "<list[10]>",
  "TrackIDList": [
    3
  ],
  "TeamRankList": [
    10,
    1,
    2,
    3,
    4,
    5
  ]
}
```

### ChenLingPolicy.json (0.01 MB, 28 条)

**字段** (10): `Desc, EffectID, ID, IconPath, IconType, Name, RelatedCardList, SkillID, SkillSoldierList, Weight`

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

### ChimeraDuelTriggerEvent.json (0.01 MB, 57 条)

**字段** (4): `EventID, EventJsonPath, ParamList, Priority`

**首条记录摘要**:
```json
{
  "EventID": 4001,
  "EventJsonPath": "Config/Gameplays/ChimeraDuel/Event/Globa...",
  "Priority": 1,
  "ParamList": []
}
```

### CakeRaceField.json (0.01 MB, 4 条)

**字段** (17): `FieldBattleItemList, FieldBetCost, FieldCatNum, FieldCatWeight, FieldCost, FieldDesc, FieldEffectWeight, FieldID, FieldName, FieldScoreRate, FieldSectionNum, FieldSectionWeight, FieldUnlockConditionList, FieldUnlockDesc, IsMultiPlaySupported, RegionRandomType, RewardID`

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
  "FieldSectionWeight": "<list[6]>",
  "FieldSectionNum": 3,
  "FieldCatWeight": "<list[5]>",
  "FieldCatNum": 5
}
```

### DrinkMakerIngredientData.json (0.01 MB, 15 条)

**字段** (12): `Color, EffParam, ID, IconPath, IncludeTagList, IngredientDesc, IngredientName, IsMission, PhyParam, SmallIconPath, UnlockParam, UnlockType`

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

### BadgeConfig.json (0.01 MB, 21 条)

**字段** (9): `BadgeID, BadgeLevel, ComeFromGoto, ComeFromText, IconMiddlePath, ItemID, Param, Prefab, Type`

**首条记录摘要**:
```json
{
  "BadgeID": 295532,
  "ItemID": 230532,
  "Type": "Memory",
  "Prefab": "Stages/OriginalResPos/InteractiveProp/Ch...",
  "IconMiddlePath": "SpriteOutput/ItemFigures/295532.png",
  "ComeFromText": {
    "Hash": 7569505056917482352
  },
  "ComeFromGoto": 1517
}
```

### DrinkMakerTagData.json (0.01 MB, 59 条)

**字段** (8): `IsShow, MixParam, MixType, Priority, SourceType, TagID, TagName, Type`

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

### ChenLingSoldierLevel.json (0.01 MB, 50 条)

**字段** (6): `BattleScoreFix, EffectID, FormationType, Level, SoldierID, UnitIDList`

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

### ChenLingSoldier.json (0.01 MB, 12 条)

**字段** (13): `AtkSkillIDList, ID, InitialMaxLevel, ModelPath, Name, Position, PromotionConditionList, PromotionEffectID, PromotionSkillDesc, SkillDesc, SkillIDList, SmallIconOutlinePath, SmallIconPath`

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

### ChimeraDuelConstCommon.json (0.01 MB, 44 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChimeraDuel_ChimeraExp_List",
  "Value": "<dict[1]>"
}
```

### B51RacingTrack.json (0.01 MB, 15 条)

**字段** (9): `ID, LittleGameConfig, MinimapPath, MinimapPath_Dark, Name, RecordDriverIconPath, RecordDriverName, RecordTime, TotalLap`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 15221624973236559137
  },
  "LittleGameConfig": "Config/Gameplays/LittleGame/RoadRash/Roa...",
  "MinimapPath": "SpriteOutput/Quest/B51Racing/Map/TrackMa...",
  "MinimapPath_Dark": "SpriteOutput/Quest/B51Racing/Map_Dark/Tr...",
  "TotalLap": 3,
  "RecordDriverName": {
    "Hash": 12552245710429879754
  },
  "RecordDriverIconPath": "SpriteOutput/AvatarRoundIcon/WebIcon/Web...",
  "RecordTime": 101.32
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

### CakeRaceRegion.json (0.01 MB, 41 条)

**字段** (5): `CatIDList, FieldIDList, RegionID, RegionJson, TagList`

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

### BattlePassReward.json (0.01 MB, 102 条)

**字段** (4): `ID, NumShow, RewardIcon, RewardItem`

**首条记录摘要**:
```json
{
  "ID": 1,
  "RewardItem": 300011,
  "RewardIcon": "",
  "NumShow": true
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

### DecalConfig.json (0.01 MB, 19 条)

**字段** (9): `BgPath, Comment, DecalID, Desc, FigurePath, IconPath, Name, TextureMapPath, UnlockMission`

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

**字段** (17): `ActivityModuleID, ChallengeBuff, ChallengeID, ChallengeTip, ChallengeTurnLimit, DamageType, FirstPassRewardID, IconPath, IsSpecialChallenge, Name, PerfectTurn, PreChallengeID, SpecialAvatarActivityModule, SpecialAvatarIDList, StageBuffAndGroupMap, StageGroupList, Type`

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

**字段** (3): `DiceSpecialDisplay, RoundID, RoundType`

**首条记录摘要**:
```json
{
  "RoundID": 10101
}
```

### DrinkMakerCheersEngage.json (0.01 MB, 48 条)

**字段** (5): `Engage, HeadIconPath, IngredientID, IsProtagonist, MatchGroupID`

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

### ChallengeBossMazeExtra.json (0.01 MB, 88 条)

**字段** (4): `ID, MonsterID1, MonsterID2, MonsterID3`

**首条记录摘要**:
```json
{
  "ID": 30011,
  "MonsterID1": 100401401,
  "MonsterID2": 302401301
}
```

### BattleCollegeConfig.json (0.01 MB, 13 条)

**字段** (16): `AimList, BattleAreaGroupID, BattleAreaID, FloorID, ID, PlaneID, RewardID, SortID, StageID, StageIntroDescIDList, StageIntroTitle, TrialAvatarList, TutorialID, TutorialTypeGroupID, VideoAssetID, VideoCoverPath`

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

### BattleActionEventConfig.json (0.01 MB, 11 条)

**字段** (10): `AbilityName, ActiveDefault, BriefDescription, EventID, EventName, FullDescription, IconPath, InitialInterval, Interval, ParamList`

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
  "ParamList": "<list[5]>"
}
```

### ChimeraArrangementPreset.json (0.01 MB, 40 条)

**字段** (3): `CommonChimeras, Description, PresetID`

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

### ChenLingFesLevelConfig.json (0.01 MB, 5 条)

**字段** (16): `AwardListID, ID, InitItemNumList, IsFeverLevel, ItemRuleGroupID, LevelAbilityGap, LevelAbilityList, LevelAbilityParamList, LevelDayDuration, LevelName, RequiredScoreList, TotalWeek, UnlockSubMission, VisitorRuleGroupID, VisitorTimeInterval, WeekStarCount`

**首条记录摘要**:
```json
{
  "ID": 1,
  "LevelName": "ChenLingFesLevelConfig_LevelName_1",
  "LevelAbilityParamList": [],
  "TotalWeek": 3,
  "WeekStarCount": 3,
  "RequiredScoreList": "<list[9]>",
  "ItemRuleGroupID": "<list[12]>",
  "VisitorRuleGroupID": "<list[12]>",
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

**字段** (9): `ArrangeHintImage, DisplayTeamID, IsSSR, NewChimeraList, OptionList, RecommendedArrangementPresets, RoundID, WarningText, WorkList`

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

**字段** (6): `EmojiIDList, MessageIDList, NPCAIJsonPath, NPCID, NPCIcon, NPCName`

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
  "MessageIDList": "<list[16]>"
}
```

### DrinkMakerTagCombination.json (0.01 MB, 36 条)

**字段** (6): `ExcludeTags, HintIconType, HintStr, IncludeTags, TagCombinationID, TagRequestDesc`

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

### ClockParkBuff.json (0.01 MB, 42 条)

**字段** (5): `BuffDesc, BuffID, BuffType, Param1, Times`

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

### BattlePassQuest.json (0.01 MB, 136 条)

**字段** (2): `ID, ShowTime`

**首条记录摘要**:
```json
{
  "ID": 2000204,
  "ShowTime": true
}
```

### ChimeraConstClient.json (0.01 MB, 32 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Chimera_PlayerTeam_Icon",
  "Value": "<dict[1]>"
}
```

### B51RacingConstValueCommon.json (0.01 MB, 34 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "Activity_B51Racing_RankScoreList",
  "Value": "<dict[1]>"
}
```

### ChallengeBossMazeTierce.json (0.01 MB, 5 条)

**字段** (14): `DLCKKJFMJOB, EGEEJLHBALB, EMNJGCPDIFF, GNGENMHNLAH, HFIAAGAKFMD, IMCMJHAMMKK, JEBMBCLBIOI, LCHKKJDBLGM, LOJCIDLKPKG, MLMEGBLDFKE, OGALGHMIIAH, OGEOMCGNNMP, PHFMCACHFIJ, PHOIICMCGIH`

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
  "LOJCIDLKPKG": "<list[4]>",
  "OGEOMCGNNMP": [
    5001,
    5002,
    5003
  ],
  "GNGENMHNLAH": 5000,
  "IMCMJHAMMKK": 101713,
  "EGEEJLHBALB": "<list[8]>",
  "OGALGHMIIAH": "<list[8]>"
}
```

### DrinkMakerCheersConfig.json (0.01 MB, 10 条)

**字段** (12): `AvatarRequestText, CommentList, Contraindications, DrinkIconPath, DrinkIconPrefab, DrinkNameTextJoinID, FunctionName, ID, Mode, OriginalName, ParamList, TagName`

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

### DialogueIcon.json (0.01 MB, 49 条)

**字段** (2): `IconPath, Type`

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

### B51RacingSkill.json (0.01 MB, 18 条)

**字段** (11): `Desc, Desc_Back, Desc_Front, ID, IconPath, IconPath_128, Level, Name, PassiveList, PassiveParamList, Type`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Level": 1,
  "Type": "Active",
  "Name": {
    "Hash": 2408116791410147221
  },
  "Desc": {
    "Hash": 4248271908080126951
  },
  "Desc_Front": {
    "Hash": 5068569701852599187
  },
  "IconPath": "SpriteOutput/Quest/B51Racing/SkillIcon/B...",
  "IconPath_128": "SpriteOutput/Quest/B51Racing/SkillIcon/B...",
  "PassiveList": [],
  "PassiveParamList": []
}
```

### BattleEventDataLD.json (0.01 MB, 21 条)

**字段** (8): `BEActionBarPrefab, BasePoint, BattleEventID, Config, IsSPReserved, LevelAreaPrefab, Prefab, SkillIDList`

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

### B51RacingCar.json (0.01 MB, 18 条)

**字段** (9): `AIRole, CarNumber, ID, InitHexColor, PartIDList, SkillIDList, StatValueMap, TeamID, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "Player",
  "TeamID": 10,
  "StatValueMap": "<dict[5]>",
  "SkillIDList": [
    101
  ],
  "PartIDList": [
    21,
    22,
    23
  ],
  "InitHexColor": "#C7CAD0"
}
```

### ClockParkScriptConfig.json (0.01 MB, 6 条)

**字段** (19): `ActivityModuleID, ActivityStudioScriptID, IconPath, ImgPath, PrefabPath, ScriptBGM, ScriptCharacteristic, ScriptDesc, ScriptEndingUnlockChapterID, ScriptGamePlayDesc, ScriptGamePlayGuideGroupID, ScriptPostPrefabPath, ScriptResultLogoMaskPath, ScriptTitle, ScriptType, ScriptUnlockCondition, ScriptUnlockCost, StartChapterID, TalentCanBeUsed`

**首条记录摘要**:
```json
{
  "ActivityStudioScriptID": 1,
  "ActivityModuleID": 5001202,
  "ScriptType": "Normal",
  "ScriptUnlockCondition": "<list[1]>",
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

**字段** (5): `DailyID, IsDelete, MaxLevel, MinLevel, QuestList`

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

### ClockParkStory.json (0.01 MB, 27 条)

**字段** (3): `ImgPath, StoryID, StoryJsonPath`

**首条记录摘要**:
```json
{
  "StoryID": 10101,
  "StoryJsonPath": "Config/ConfigActivityClockPark/GamePlayP...",
  "ImgPath": "SpriteOutput/UI/Quest/ActivityQuestTimeL..."
}
```

### DrinkMakerCheersTypeTextmap.json (0.01 MB, 18 条)

**字段** (6): `GroupID, QuantifyNameN2, QuantifyNameP2, Type, TypeIconPath, TypeProgressBarPath`

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

### ChimeraDuelItemGroup.json (0.01 MB, 38 条)

**字段** (2): `ItemGroupID, ItemIDList`

**首条记录摘要**:
```json
{
  "ItemGroupID": 60000,
  "ItemIDList": "<list[17]>"
}
```

### B51RacingPart.json (0.01 MB, 15 条)

**字段** (8): `AddStatTierMap, AssetPath, ID, IconPath, IsDefault, Name, SkillID, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 7141042211714784218
  },
  "Type": "RearWing",
  "AddStatTierMap": {
    "Acceleration": 1,
    "Drift": 1
  },
  "SkillID": 301,
  "AssetPath": "Stages/ActivityProp/ActivityProp_Racer_P...",
  "IconPath": "SpriteOutput/Quest/B51Racing/CarpartIcon..."
}
```

### ChallengeStoryMazeTierce.json (0.01 MB, 4 条)

**字段** (16): `DLCKKJFMJOB, EGEEJLHBALB, EMNJGCPDIFF, GNGENMHNLAH, HFIAAGAKFMD, IDBJENCBJHM, IMCMJHAMMKK, JEBMBCLBIOI, LCHKKJDBLGM, LDKPJPCMMAE, LOJCIDLKPKG, MLMEGBLDFKE, OGALGHMIIAH, OGEOMCGNNMP, PHFMCACHFIJ, PHOIICMCGIH`

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
  "EGEEJLHBALB": "<list[8]>",
  "OGALGHMIIAH": "<list[8]>"
}
```

### ChallengeMazeTierce.json (0.00 MB, 4 条)

**字段** (15): `DLCKKJFMJOB, EGEEJLHBALB, EMNJGCPDIFF, GNGENMHNLAH, GNOOAGPBNLD, HFIAAGAKFMD, IMCMJHAMMKK, JEBMBCLBIOI, LCHKKJDBLGM, LOJCIDLKPKG, MLMEGBLDFKE, OGALGHMIIAH, OGEOMCGNNMP, PHFMCACHFIJ, PHOIICMCGIH`

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
  "EGEEJLHBALB": "<list[8]>",
  "OGALGHMIIAH": "<list[8]>"
}
```

### DrinkMakerCheersCombination.json (0.00 MB, 27 条)

**字段** (5): `ExcludeTags, HintStr, IncludeTags, TagCombinationID, TagRequestDesc`

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

### ChallengeMazeGroupExtra.json (0.00 MB, 57 条)

**字段** (2): `GroupID, ThemePosterBgPicPath`

**首条记录摘要**:
```json
{
  "GroupID": 100,
  "ThemePosterBgPicPath": "SpriteOutput/Abyss/2D_SceneBg/AbyssSence..."
}
```

### DecalGameplayConfig.json (0.00 MB, 20 条)

**字段** (3): `DecalID, IconPath, TextureMapPath`

**首条记录摘要**:
```json
{
  "DecalID": 1,
  "TextureMapPath": "Stages/OriginalResPos/InteractiveProp/Ch...",
  "IconPath": ""
}
```

### CityShopRewardList.json (0.00 MB, 45 条)

**字段** (5): `GroupID, ItemNeed, Level, RewardID, TotalItem`

**首条记录摘要**:
```json
{
  "GroupID": 401,
  "Level": 1,
  "ItemNeed": 10,
  "TotalItem": 10
}
```

### DrinkMakerCheersComment.json (0.00 MB, 28 条)

**字段** (5): `Comment, HeadIconPath, ID, IsProtagonist, UnlockQuest`

**首条记录摘要**:
```json
{
  "ID": 1,
  "HeadIconPath": "SpriteOutput/AvatarRoundIcon/UI_Message_...",
  "UnlockQuest": 6070620
}
```

### ChimeraEvaluation.json (0.00 MB, 17 条)

**字段** (5): `ConditionJson, EvaluationDesc, EvaluationID, EvaluationName, GroupID`

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

### CakeDialogue.json (0.00 MB, 41 条)

**字段** (3): `CatID, ID, RuanMadeCakeDialogue`

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

### CakeRaceTitle.json (0.00 MB, 14 条)

**字段** (10): `BgColor, ConditionParam, ConditionType, ExtremType, ParamList, ParamType, Priority, TitleDesc, TitleID, TitleName`

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

### DrinkMakerChallenge.json (0.00 MB, 12 条)

**字段** (8): `ChallengeID, ChallengeIngredientList, ChallengePic, ChallengeRequest, ChallengeRewardID, UnlockLevel, UnlockParam, UnlockType`

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

### DrinkMakerConstValueClient.json (0.00 MB, 29 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "DrinkMaker_CustomDrink_IconPath",
  "Value": "<dict[1]>"
}
```

### CakeDialogueRule.json (0.00 MB, 12 条)

**字段** (5): `CakeDialogueList, CakeRequirementList, ID, SpeakerPolicy, TypeList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "CakeDialogueList": [
    1,
    2
  ],
  "CakeRequirementList": "<list[2]>",
  "TypeList": [
    "Shelf",
    "Ground"
  ]
}
```

### ChenLingCondition.json (0.00 MB, 40 条)

**字段** (5): `ID, Param1, Param2, Progress, Type`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Type": "HpLessThan",
  "Param1": 3,
  "Progress": 1
}
```

### DrinkMakerGuest.json (0.00 MB, 6 条)

**字段** (11): `BartenderGuestName, BigIconPath, EmotionProblemList, FavorTagList, FinishQuestID, FinishSubMissionID, GuestID, IconPath, LinePath, MaxFaith, MaxFaithReward`

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
  "EmotionProblemList": "<list[3]>"
}
```

### DrinkMakerCheersGuest.json (0.00 MB, 13 条)

**字段** (10): `DrinkID, DrinkNamePerformanceID, FinishSettlementPerformanceID, GroupID, ID, NextPerformanceID, OneMoreDrinkPerformanceID, PerformanceID, SurpriseCommentList, SurpriseRequest`

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

### ChenLingDeck.json (0.00 MB, 5 条)

**字段** (13): `ActivityPanelSoldieList, BGDesc, CardList, DeckIconPath, Desc, GuideGroupID, ID, IconPath, InitialCardList, InitialEffectList, Name, RelatedCardList, ShowCardList`

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
  "CardList": "<list[19]>",
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

### CakeRaceConstValueCommon.json (0.00 MB, 36 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "CakeRace_Score_Rank_Ratio_List",
  "Value": "<dict[1]>"
}
```

### CakeRaceMessage.json (0.00 MB, 28 条)

**字段** (5): `CanPlayerUse, CatID, MessageID, MessageText, MessageType`

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

### CakePerformanceConfig.json (0.00 MB, 12 条)

**字段** (6): `ActorsList, ID, MoviePicPath, PerformanceID, PerformanceName, QuestID`

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

### DailyActiveConfig.json (0.00 MB, 35 条)

**字段** (4): `DailyActivePoint, DailyActiveReward, Level, WorldLevel`

**首条记录摘要**:
```json
{
  "Level": 1,
  "DailyActivePoint": 100,
  "DailyActiveReward": 103101
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

### DrinkMakerDecorationData.json (0.00 MB, 10 条)

**字段** (6): `CupAnchoPath, DecorationID, DecorationName, IconPath, IncludeTagList, PrefabPath`

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

### ChimeraAbilityDisplay.json (0.00 MB, 22 条)

**字段** (3): `AbilityDesc, AbilityName, DisplayID`

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

### BoxingClubNatureConfig.json (0.00 MB, 7 条)

**字段** (5): `BoxingBuffBackground, BoxingBuffIcon, BoxingBuffIconBackground, BoxingClubNatureType, NatureIconBackGround`

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

### ChenLingGameBoyChallenge.json (0.00 MB, 12 条)

**字段** (6): `ChallengeType, GameBoyChallengeID, Parameter1, Parameter2, Parameter3, TextmapMazePuzzle`

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

### ChenLingBuilding.json (0.00 MB, 10 条)

**字段** (6): `Desc, ID, InitialMaxLevel, ModelPath, Name, SmallIconPath`

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

### CutsceneProp.json (0.00 MB, 15 条)

**字段** (4): `PropID, PropModelPath, ResidentEffectKey, ResidentPossessionKey`

**首条记录摘要**:
```json
{
  "PropID": "Prop_Chess_00",
  "PropModelPath": "Props/Outputs/Cutscene/Chap01_Act020/Pro...",
  "ResidentEffectKey": [],
  "ResidentPossessionKey": ""
}
```

### ChimeraDuelMasterChallenge.json (0.00 MB, 13 条)

**字段** (5): `ChallengeID, MasterHeadIconPath, MasterID, MasterRankLevel, PresetIDList`

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

### BlindBoxPoolItem.json (0.00 MB, 34 条)

**字段** (4): `CMNOEFFFNPE, FCOKEIGNAIN, IODLAAIECIG, LDGGEPJEKND`

**首条记录摘要**:
```json
{
  "LDGGEPJEKND": 1001,
  "CMNOEFFFNPE": 251520,
  "IODLAAIECIG": 1,
  "FCOKEIGNAIN": 52
}
```

### ChallengeMazeRewardLine.json (0.00 MB, 45 条)

**字段** (3): `GroupID, RewardID, StarCount`

**首条记录摘要**:
```json
{
  "GroupID": 1,
  "StarCount": 3,
  "RewardID": 101101
}
```

### B51RacingDevelopmentAction.json (0.00 MB, 20 条)

**字段** (3): `AddStatValueMap, ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 12060979892729805379
  },
  "AddStatValueMap": {
    "Speed": 14
  }
}
```

### DrinkMakerCheersGroup.json (0.00 MB, 6 条)

**字段** (11): `AvatarName, AvatarRequestHeadIcon, GroupID, GroupName, HeadbookHeadIcon, HidingDrinkID, IngredientList, NextGroupID, PrimaryDrinkID, RoleRequirement, TutorialGuideGroupID`

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

### ChallengePeakBossConfig.json (0.00 MB, 10 条)

**字段** (7): `BuffList, ColorMedalTarget, HardEventIDList, HardTagList, HardTarget, HardTitle, ID`

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

### DifficultyAdjustmentStage.json (0.00 MB, 42 条)

**字段** (2): `EventIDs, ID`

**首条记录摘要**:
```json
{
  "ID": 20003011,
  "EventIDs": [
    20003011
  ]
}
```

### BlindBoxPoolItem_Index_PoolID.json (0.00 MB, 1 条)

**字段** (2): `LDGGEPJEKND, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "LDGGEPJEKND": 1001,
  "MGNHKOHFLPO": "<list[34]>"
}
```

### DrinkMakerCupData.json (0.00 MB, 6 条)

**字段** (10): `AudioEvent, Capacity, CupID, CupName, IceCount, IconPath, IncludeTagList, PerLayerHeight, PrefabPath, Type`

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

### CakeRaceBattleItem.json (0.00 MB, 5 条)

**字段** (9): `AbilityJson, BattleItemDesc, BattleItemEffectParamList, BattleItemID, BattleItemIcon, BattleItemInvalidIcon, BattleItemName, BattleItemUseHint, BattleItemUseType`

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

### CurrencyDisplayConfig.json (0.00 MB, 86 条)

**字段** (3): `CurrencyID, GotoID, UnlockID`

**首条记录摘要**:
```json
{
  "CurrencyID": 1,
  "GotoID": 3800
}
```

### ChimeraTeam.json (0.00 MB, 9 条)

**字段** (6): `RoundTalkMap, TeamAvatarIcon, TeamConfigJson, TeamID, TeamIcon, TeamName`

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

### ChenLingCardPreCheck.json (0.00 MB, 18 条)

**字段** (6): `ConditionType, ID, TargetGridType, Toast, UseCardID, UseCardType`

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

### ChenLingPrivilege.json (0.00 MB, 10 条)

**字段** (7): `Cost, EffectID, ID, IconPath, Name, NextIDList, SkillDesc`

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

### ChenLingFesAward.json (0.00 MB, 35 条)

**字段** (4): `ExtendNum, ExtraItem, ID, RerollNum`

**首条记录摘要**:
```json
{
  "ID": 111,
  "ExtendNum": 6
}
```

### ChenLingEnchantLevel.json (0.00 MB, 45 条)

**字段** (4): `EffectID, ID, Level, SkillID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Level": 1,
  "SkillID": 10011
}
```

### DocumentaryPhaseQuestPanel.json (0.00 MB, 9 条)

**字段** (6): `ExtraQuest, NextPhase, PanelDesc, PanelTitle, PhaseID, QuestList`

**首条记录摘要**:
```json
{
  "PhaseID": 101,
  "NextPhase": 102,
  "QuestList": "<list[5]>",
  "PanelTitle": {
    "Hash": 2968996071244643990
  },
  "PanelDesc": {
    "Hash": 9029072456416460181
  },
  "ExtraQuest": 1002001
}
```

### CakeRaceHandBook.json (0.00 MB, 15 条)

**字段** (4): `AvatarTalkIDList, BubblePerformanceIDList, CatID, Order`

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

### BelobogShopUIConfig.json (0.00 MB, 7 条)

**字段** (6): `Desc, ID, IconPath, ImgPath, Name, ReplyIDList`

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

### DailyActiveQuestPool.json (0.00 MB, 53 条)

**字段** (2): `QuestID, Type`

**首条记录摘要**:
```json
{
  "QuestID": 2100003,
  "Type": 1
}
```

### ChimeraDisplay.json (0.00 MB, 27 条)

**字段** (2): `ChimeraName, DisplayID`

**首条记录摘要**:
```json
{
  "DisplayID": 101,
  "ChimeraName": {
    "Hash": 18421239265317616120
  }
}
```

### ChallengeStoryTheme.json (0.00 MB, 7 条)

**字段** (7): `ThemeBgPrefabPath, ThemeEffColor, ThemeID, ThemeMainColor, ThemePanelPrefabPath, ThemeSubColor1, ThemeSubColor2`

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

### ChenLingStage.json (0.00 MB, 6 条)

**字段** (11): `CampID, CommanderName, FinishUnlockDeckID, ID, IconPath, IconPathInBattle, LockDeckID, Name, NextID, Type, UnlockSubMissionID`

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

### CatDialogueBubbleOffset.json (0.00 MB, 25 条)

**字段** (4): `BubbleOffsetX, BubbleOffsetY, BubbleType, ID`

**首条记录摘要**:
```json
{
  "ID": 111,
  "BubbleOffsetY": -0.4,
  "BubbleType": "Left"
}
```

### BlindBoxPet.json (0.00 MB, 17 条)

**字段** (4): `ACJDHMPPCCI, CMNOEFFFNPE, GMPGDEINODK, PBLDLDIEFNC`

**首条记录摘要**:
```json
{
  "PBLDLDIEFNC": 251501,
  "GMPGDEINODK": "GIKNCJMJLFE",
  "CMNOEFFFNPE": 251501,
  "ACJDHMPPCCI": "Idle_Show_02"
}
```

### DrinkMakerGuestSequence.json (0.00 MB, 25 条)

**字段** (4): `GuestID, NeedOpenWorkBook, SequenceID, StartChatID`

**首条记录摘要**:
```json
{
  "SequenceID": 11,
  "GuestID": 1,
  "StartChatID": 1101,
  "NeedOpenWorkBook": true
}
```

### BattleCollegeAimList.json (0.00 MB, 13 条)

**字段** (4): `AimDesc, AimID, AimProgress, AimTitle`

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

**字段** (8): `EventName, EventNum, EventScript, SpecialMissionGotoIDBefore, SpecialMissionID, SpecialMissionIconPath, SpecialMissionImgPath, SpecialMissionUnlockItemID`

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

### ChimeraDuelRecommendation.json (0.00 MB, 15 条)

**字段** (3): `ChimeraIDList, MasterID, RecommendationID`

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

### BackGroundMusicWhiteNoise.json (0.00 MB, 14 条)

**字段** (3): `DHMDAEKJENF, OLOIFNNLKJP, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 215001,
  "OLOIFNNLKJP": "UI/Atlas/AtlasRoot/Common/Icon/IconWeath...",
  "DHMDAEKJENF": "Ev_amb_starrail_rain"
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

### B51RacingAgenda.json (0.00 MB, 28 条)

**字段** (3): `ContentType, CycleID, Day`

**首条记录摘要**:
```json
{
  "CycleID": 1,
  "Day": 1,
  "ContentType": "Mission"
}
```

### ChenLingEnchant.json (0.00 MB, 9 条)

**字段** (4): `Desc, ID, Name, SmallIconPath`

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

### BoxingClubActivityQuest.json (0.00 MB, 12 条)

**字段** (4): `ChallengeID, ID, Name, QuestList`

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

### BlindBoxPet_Index_ItemID.json (0.00 MB, 17 条)

**字段** (2): `CMNOEFFFNPE, MGNHKOHFLPO`

**首条记录摘要**:
```json
{
  "CMNOEFFFNPE": 251501,
  "MGNHKOHFLPO": [
    {
      "PBLDLDIEFNC": 251501
    }
  ]
}
```

### ChenLingMagic.json (0.00 MB, 12 条)

**字段** (4): `Desc, EffectID, ID, Name`

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

### BattleEventButtonTypeConfig.json (0.00 MB, 7 条)

**字段** (5): `ButtonPath, ButtonReadyPath, CutinPath, ID, SkillButtonEffPath`

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

### ChimeraDuelRank.json (0.00 MB, 6 条)

**字段** (5): `RankIconPath, RankIconPrefabPath, RankLevel, RankMinScore, RankName`

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

### ChimeraDuelGame.json (0.00 MB, 6 条)

**字段** (7): `ChimeraNumLimitList, CoinNum, GameID, GameType, RoundIDList, ShouldExitPuzzleOnEnd, WinCon`

**首条记录摘要**:
```json
{
  "GameID": 701,
  "WinCon": 5,
  "CoinNum": 1,
  "GameType": "PVP",
  "RoundIDList": "<list[12]>",
  "ChimeraNumLimitList": []
}
```

### ChallengeStoryRewardLine.json (0.00 MB, 24 条)

**字段** (3): `GroupID, RewardID, StarCount`

**首条记录摘要**:
```json
{
  "GroupID": 2000,
  "StarCount": 1,
  "RewardID": 101501
}
```

### BookSeriesWorld.json (0.00 MB, 6 条)

**字段** (4): `BookSeriesWorld, BookSeriesWorldBackgroundPath, BookSeriesWorldIconPath, BookSeriesWorldTextmapID`

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
  "Value": "<dict[1]>"
}
```

### ChenLingEffectProgress.json (0.00 MB, 16 条)

**字段** (4): `ActionIDList, EffectIDList, ID, Progress`

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

### ChallengePeakReward.json (0.00 MB, 13 条)

**字段** (5): `ID, RewardGroupID, RewardID, RewardType, TypeValue`

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

### B51RacingStat.json (0.00 MB, 5 条)

**字段** (6): `Desc, ExtraRatio, ID, IconPath, Name, TierRequireValueList`

**首条记录摘要**:
```json
{
  "ID": "Speed",
  "TierRequireValueList": [
    20,
    40,
    60,
    80,
    100
  ],
  "ExtraRatio": 0.3,
  "Name": {
    "Hash": 15986395408019492545
  },
  "Desc": {
    "Hash": 2499249998271908000
  },
  "IconPath": "SpriteOutput/Rogue/Skill/Mid/IconRogueMa..."
}
```

### ClockParkBuffType.json (0.00 MB, 14 条)

**字段** (5): `BuffDisplay, BuffJoint, BuffRelease, BuffType, IconPath`

**首条记录摘要**:
```json
{
  "BuffType": "FirstAttributeContinue",
  "BuffJoint": true,
  "BuffDisplay": true,
  "IconPath": "SpriteOutput/IconDamageType/IconDamageTy..."
}
```

### ChimeraGalleryTalk.json (0.00 MB, 9 条)

**字段** (4): `ConditionType, NumberedTitle, Sort, Title`

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

### DrinkMakerNote.json (0.00 MB, 12 条)

**字段** (3): `DrinkMakerNoteList, GuestID, UnlockDay`

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

### ChimeraTeamTalk.json (0.00 MB, 14 条)

**字段** (3): `Effect, TalkContent, TalkID`

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

**字段** (4): `BuildingID, EffectID, Level, SkillID`

**首条记录摘要**:
```json
{
  "BuildingID": 2,
  "Level": 1,
  "EffectID": 2021
}
```

### ClockParkLottery.json (0.00 MB, 12 条)

**字段** (4): `LotteryAttributeGain, LotteryID, LotteryType, Weight`

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

### BattleAreaUnifiedConfig.json (0.00 MB, 57 条)

**字段** (1): `ID`

**首条记录摘要**:
```json
{
  "ID": 1001
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

### ChimeraGalleryAct.json (0.00 MB, 8 条)

**字段** (4): `ActID, Icon, Name, Sort`

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

### BoxingClubPerformance.json (0.00 MB, 5 条)

**字段** (7): `BubbleTalkEnemy, BubbleTalkPlayer, EnemyRank, ID, MonsterTemplateID, Name, PlayerRank`

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

### ChimeraWorkRoundOption.json (0.00 MB, 13 条)

**字段** (3): `OptionID, ParamList, Type`

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

### ChallengeGeneralConfig.json (0.00 MB, 3 条)

**字段** (6): `ChallengeGroupType, EarlyAccessContentID, GotoID, GuideConditions, PreConditions, TabImgPath`

**首条记录摘要**:
```json
{
  "ChallengeGroupType": "Memory",
  "GotoID": 218,
  "TabImgPath": "SpriteOutput/UI/ChallengeBoss/ChallengeB...",
  "PreConditions": [],
  "GuideConditions": "<list[1]>"
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

### B51RacingTeam.json (0.00 MB, 7 条)

**字段** (4): `ID, IconPath, InitialPoint, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 3734991569412985893
  },
  "IconPath": "SpriteOutput/Quest/B51Racing/Logo/B51Rac...",
  "InitialPoint": 26
}
```

### ChallengeStoryTargetConfig.json (0.00 MB, 7 条)

**字段** (4): `ChallengeTargetName, ChallengeTargetParam1, ChallengeTargetType, ID`

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

### BattlePassAdvertisement.json (0.00 MB, 5 条)

**字段** (4): `Desc, ID, IconBundlePath, Title`

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

### ChallengeBossTargetConfig.json (0.00 MB, 7 条)

**字段** (4): `ChallengeTargetName, ChallengeTargetParam1, ChallengeTargetType, ID`

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

### B51RacingDriver.json (0.00 MB, 4 条)

**字段** (5): `AddStatMap, AvatarIconPath, Desc, ID, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 5522242657658569279
  },
  "Desc": {
    "Hash": 13915176787150994345
  },
  "AvatarIconPath": "SpriteOutput/Quest/B51Racing/DriverAvata...",
  "AddStatMap": {
    "Acceleration": 10,
    "Charge": 10
  }
}
```

### ChenLingWaveExp.json (0.00 MB, 30 条)

**字段** (2): `Exp, Wave`

**首条记录摘要**:
```json
{
  "Wave": 1,
  "Exp": 10
}
```

### ChallengeRaid.json (0.00 MB, 8 条)

**字段** (4): `ChallengeID, IconPath, MonsterList, ScoringGroupID`

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

### BackGroundMusicGroup.json (0.00 MB, 7 条)

**字段** (4): `GroupIcon, GroupName, ID, Type`

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

### CLGameBoyChallengePack.json (0.00 MB, 9 条)

**字段** (4): `CheatChallengeID, GameBoyChallengePackID, HardChallengeID, RewardID`

**首条记录摘要**:
```json
{
  "GameBoyChallengePackID": 1,
  "HardChallengeID": 1,
  "CheatChallengeID": 4,
  "RewardID": 319003
}
```

### BattleCollegeTypeGroup.json (0.00 MB, 3 条)

**字段** (6): `BackGroundImagePath, BattleCollegeTypeGroupID, BattleCollegeTypeGroupIDTitle, IsAdvanced, TabIconPath, UnlockConditions`

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

**字段** (4): `BasemapPath, CorrectmapPath, GameBoyCheatCodeString, WrongmapPath`

**首条记录摘要**:
```json
{
  "GameBoyCheatCodeString": "W",
  "BasemapPath": "SpriteOutput/Quest/MatchThree/chessArrow...",
  "CorrectmapPath": "SpriteOutput/Quest/MatchThree/chessArrow...",
  "WrongmapPath": "SpriteOutput/Quest/MatchThree/chessArrow..."
}
```

### CakeRaceEmoji.json (0.00 MB, 11 条)

**字段** (3): `CanPlayerUse, EmojiID, ImagePath`

**首条记录摘要**:
```json
{
  "EmojiID": 1001,
  "CanPlayerUse": true,
  "ImagePath": "SpriteOutput/Emoji/116012.png"
}
```

### ChenLingProperty.json (0.00 MB, 6 条)

**字段** (4): `IconPath, IsShow, Name, Property`

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

**字段** (3): `CardTips, CardTipsTypeID, CardTips_Detail`

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

### BoxingClubChallengeSeason.json (0.00 MB, 2 条)

**字段** (7): `ActivityQuestID, ActivityTitle, ChallengeIDList, SeasonID, SeasonIconPath, SeasonTabPath, SeasonType`

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

### ChatBubbleConfig.json (0.00 MB, 12 条)

**字段** (3): `ID, ShowParam, ShowType`

**首条记录摘要**:
```json
{
  "ID": 220000,
  "ShowType": "Always"
}
```

### ConvinceGameplaySkill.json (0.00 MB, 4 条)

**字段** (4): `ID, SkillDescriptionID, SkillIconPath, SkillNameText`

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

### CakeRaceFieldScore.json (0.00 MB, 4 条)

**字段** (8): `BetBaseScore, FieldID, SingleScoreMaxLimit, SingleScoreMinLimit, SingleScoreRate, TotalScoreMaxLimit, TotalScoreMinLimit, TotalScoreRate`

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

**字段** (7): `AudioEvent, CupAnchoPath, ID, IceName, IconPath, IncludeTagList, PrefabPath`

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

### DefaultPlayerOutfitDetail.json (0.00 MB, 2 条)

**字段** (9): `AGNDDHOLJNL, DEJJGGOABPA, FJDEIHMGHIF, GJMHAJGIHOM, HHIIGAIJEDA, KODCANKFHAO, OEPDNGFAKDA, PMIEAEGJNMJ, PMNJAKBDNEG`

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

### DrinkMakerDay.json (0.00 MB, 5 条)

**字段** (4): `CanStartSubMissionID, DayID, FinishDaySubMissionIDList, GuestSequenceList`

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

### ChallengeBossRewardLine.json (0.00 MB, 12 条)

**字段** (3): `GroupID, RewardID, StarCount`

**首条记录摘要**:
```json
{
  "GroupID": 3000,
  "StarCount": 1,
  "RewardID": 101701
}
```

### ChenLingCamp.json (0.00 MB, 6 条)

**字段** (2): `FlagPrefab, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "FlagPrefab": "Stages/ActivityProp/ActivityProp_ChenLin..."
}
```

### ChimeraPhase.json (0.00 MB, 5 条)

**字段** (6): `LeaderChariotState, NextPhaseID, PhaseID, RoundList, TargetParam, TargetType`

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

**字段** (3): `ID, TagIconPath, TagTitle`

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

### BattleConditionConfig.json (0.00 MB, 6 条)

**字段** (6): `AbilityName, ConditionDes, ID, IsShowProgress, TargetParam, WinOrLose`

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

### CityShopConfig.json (0.00 MB, 3 条)

**字段** (8): `HintOverNum, ItemID, MaxLevel, Name, RewardListGroupID, ShopID, WorldID, WorldImgPath`

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

### DanmuGroup.json (0.00 MB, 3 条)

**字段** (6): `Contents, FlySpeed, ID, Interval, RepeatTimesTillEnd, Type`

**首条记录摘要**:
```json
{
  "ID": 10544000,
  "Type": "Text",
  "Contents": "<list[10]>",
  "FlySpeed": 1,
  "Interval": 2,
  "RepeatTimesTillEnd": 1
}
```

### DailyActiveType.json (0.00 MB, 18 条)

**字段** (2): `PoolSort, Type`

**首条记录摘要**:
```json
{
  "Type": 1,
  "PoolSort": 1
}
```

### DrinkMakerCheersPerformance.json (0.00 MB, 10 条)

**字段** (3): `GroupID, ID, PerformanceID`

**首条记录摘要**:
```json
{
  "ID": 10000,
  "GroupID": 1000,
  "PerformanceID": 803520001
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

### BlindBoxPoolModelSub.json (0.00 MB, 4 条)

**字段** (4): `DNLFJOJJDNF, FCOKEIGNAIN, NBEKALMIDKH, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "NBEKALMIDKH": 1,
  "FCOKEIGNAIN": 52,
  "OENAMINOLLF": {
    "Hash": 1386149432932972103
  },
  "DNLFJOJJDNF": {
    "Hash": 6529615414765280386
  }
}
```

### CycleScoreReward.json (0.00 MB, 10 条)

**字段** (3): `Reward, Score, ScoreRank`

**首条记录摘要**:
```json
{
  "ScoreRank": 1,
  "Score": 1800,
  "Reward": 323001
}
```

### CeilingCharacterInfo.json (0.00 MB, 7 条)

**字段** (2): `CeilingDesc, CharacterID`

**首条记录摘要**:
```json
{
  "CharacterID": 1003,
  "CeilingDesc": {
    "Hash": 17048992647563964215
  }
}
```

### DrinkMakerCheersFormula.json (0.00 MB, 3 条)

**字段** (8): `CupID, DecoID, FormulaID, IceID, IconPath, IngredientList, MixRate, SmallIconPath`

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

### B51RacingCycle.json (0.00 MB, 2 条)

**字段** (6): `CarIDList, DriverIDList, ID, PaintIDList, PartIDList, TeamIDList`

**首条记录摘要**:
```json
{
  "ID": 1,
  "DriverIDList": [
    1,
    2
  ],
  "CarIDList": [
    1
  ],
  "PaintIDList": [
    1,
    2
  ],
  "PartIDList": [
    1,
    2,
    5,
    6,
    9,
    10
  ],
  "TeamIDList": [
    1,
    2,
    3,
    4,
    5,
    10
  ]
}
```

### CakeRaceSection.json (0.00 MB, 9 条)

**字段** (3): `RegionNum, SectionID, Tag`

**首条记录摘要**:
```json
{
  "SectionID": 1,
  "RegionNum": 2
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

### BattleCollegeStageIntro.json (0.00 MB, 16 条)

**字段** (1): `StageIntroDescID`

**首条记录摘要**:
```json
{
  "StageIntroDescID": 101
}
```

### ConvinceGameplayNPC.json (0.00 MB, 3 条)

**字段** (4): `ID, NPCDescriptionID, NPCIconPath, NPCNameID`

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

### ChenLingConquerLevel.json (0.00 MB, 10 条)

**字段** (2): `Level, PrivilegePointNum`

**首条记录摘要**:
```json
{
  "Level": 1,
  "PrivilegePointNum": 1
}
```

### CharacterNatureConfig.json (0.00 MB, 7 条)

**字段** (3): `NatureID, NatureType, SpritePath`

**首条记录摘要**:
```json
{
  "NatureID": 1,
  "SpritePath": ""
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

### B51RacingLivery.json (0.00 MB, 4 条)

**字段** (4): `AssetPath, ID, IconPath, Name`

**首条记录摘要**:
```json
{
  "ID": 1,
  "Name": {
    "Hash": 10480788566298478056
  },
  "AssetPath": "_G_Paint",
  "IconPath": ""
}
```

### ChenLingFesAwardType.json (0.00 MB, 4 条)

**字段** (3): `AwardDesc, AwardIconPath, AwardType`

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

### BlindBoxPetType.json (0.00 MB, 2 条)

**字段** (6): `AOBEAMFDGGC, GBANBJFKIJL, GMPGDEINODK, IFHBHIHHFBM, KHDOMCOJDMI, OENAMINOLLF`

**首条记录摘要**:
```json
{
  "GMPGDEINODK": "OLMIONCBMHI",
  "IFHBHIHHFBM": true,
  "AOBEAMFDGGC": 60,
  "OENAMINOLLF": {
    "Hash": 10802492420156272069
  },
  "GBANBJFKIJL": 2,
  "KHDOMCOJDMI": [
    0,
    0,
    0
  ]
}
```

### BlindBoxPoolBubble.json (0.00 MB, 5 条)

**字段** (2): `ONBFILEPHPC, PHFMCACHFIJ`

**首条记录摘要**:
```json
{
  "PHFMCACHFIJ": 1,
  "ONBFILEPHPC": {
    "Hash": 7077709781211755916
  }
}
```

### ChallengeActivityConfig.json (0.00 MB, 1 条)

**字段** (4): `ActivityID, ActivityRewardList, ChallengeList, MarkScoreList`

**首条记录摘要**:
```json
{
  "ActivityID": 10012,
  "ChallengeList": "<list[7]>",
  "ActivityRewardList": "<list[11]>",
  "MarkScoreList": [
    1,
    5000,
    8000,
    11000
  ]
}
```

### DirectDeliveryNotice.json (0.00 MB, 3 条)

**字段** (4): `ActivityModule, ID, RewardList, UnlockQuestId`

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

### ChenLingAction.json (0.00 MB, 8 条)

**字段** (2): `ActionType, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "ActionType": "AddCard"
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

### DrinkMakerLayerData.json (0.00 MB, 5 条)

**字段** (2): `IncludeTagList, LayerID`

**首条记录摘要**:
```json
{
  "LayerID": 1,
  "IncludeTagList": [
    401
  ]
}
```

### CumulativeScoreBoardConfig.json (0.00 MB, 2 条)

**字段** (6): `ConfigID, IconPath, IsDecrease, MaxDigit, TargetValue, ZeroFillLength`

**首条记录摘要**:
```json
{
  "ConfigID": 1,
  "IconPath": "SpriteOutput/ItemIcon/2.png",
  "TargetValue": "20000000000",
  "MaxDigit": 11,
  "ZeroFillLength": 4,
  "IsDecrease": true
}
```

### ChallengeBossConstValue.json (0.00 MB, 1 条)

**字段** (2): `ConstValueName, Value`

**首条记录摘要**:
```json
{
  "ConstValueName": "ChallengeBoss_Special_MonsterTemplateID",
  "Value": "<dict[1]>"
}
```

### ChenLingConditionDesc.json (0.00 MB, 3 条)

**字段** (2): `Desc, Type`

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

### DrinkMakerMixTag.json (0.00 MB, 4 条)

**字段** (2): `IncludeTagList, TagID`

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

### ClockParkProgressReward.json (0.00 MB, 5 条)

**字段** (2): `QuestID, QuestProgress`

**首条记录摘要**:
```json
{
  "QuestID": 6022101,
  "QuestProgress": 20
}
```

### BattlePassWeekConfig.json (0.00 MB, 4 条)

**字段** (3): `BPLevelExp, BPWeekMaxExp, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "BPLevelExp": 800,
  "BPWeekMaxExp": 8000
}
```

### ClockParkRaid.json (0.00 MB, 3 条)

**字段** (3): `RaidID, RaidMapinfo, RaidUnlockProgress`

**首条记录摘要**:
```json
{
  "RaidID": 44305001,
  "RaidUnlockProgress": 4000,
  "RaidMapinfo": 1415
}
```

### CommonActiveSkillConfig.json (0.00 MB, 3 条)

**字段** (2): `AbilityName, CommonActiveSkillID`

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

### ChallengeSkipConfig.json (0.00 MB, 3 条)

**字段** (4): `CEELPELAICJ, NAGOAODFACD, NDEEOPGAILP, NEBFIEHMLJB`

**首条记录摘要**:
```json
{
  "NDEEOPGAILP": "Memory",
  "CEELPELAICJ": 9,
  "NAGOAODFACD": 1,
  "NEBFIEHMLJB": 1
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

### B51RacingChallengeCar.json (0.00 MB, 2 条)

**字段** (2): `ID, PartIDList`

**首条记录摘要**:
```json
{
  "ID": 3,
  "PartIDList": [
    1,
    2,
    5,
    6,
    9,
    10
  ]
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

**字段** (2): `MarkIconPath, MarkType`

**首条记录摘要**:
```json
{
  "MarkIconPath": ""
}
```

### ChooseDelivery.json (0.00 MB, 1 条)

**字段** (4): `ActivityModuleID, ID, RewardGroupList, UnlockID`

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

### BlindBoxPool.json (0.00 MB, 1 条)

**字段** (3): `LDGGEPJEKND, NBEKALMIDKH, NMFBJOCJIBN`

**首条记录摘要**:
```json
{
  "LDGGEPJEKND": 1001,
  "NBEKALMIDKH": 1,
  "NMFBJOCJIBN": {
    "Hash": 11750848825003001554
  }
}
```

### BookDisplayType.json (0.00 MB, 2 条)

**字段** (2): `Alignment, BookDisplayTypeID`

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

### DailyMissionCount.json (0.00 MB, 1 条)

**字段** (3): `DailyCount, DailyMissionType, ID`

**首条记录摘要**:
```json
{
  "ID": 1,
  "DailyMissionType": 1,
  "DailyCount": 1
}
```

### ChallengePeakRewardOR.json (0.00 MB, 0 条)

### ChenLingFesLevelAbility.json (0.00 MB, 0 条)

### ClockParkTalent.json (0.00 MB, 0 条)

### ConstValueClientTest.json (0.00 MB, 0 条)

### ConstValueCommonTest.json (0.00 MB, 0 条)
