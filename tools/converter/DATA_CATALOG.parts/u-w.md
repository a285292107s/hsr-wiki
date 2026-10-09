# DATA_CATALOG 分片：文件名首字母 UVW

> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 u-w（共 22 个文件）。
> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。
> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。

### VoiceConfig.json (8.39 MB, 90,284 条)

**字段** (4): `IsPlayerInvolved, VoiceID, VoicePath, VoiceType`

**首条记录摘要**:
```json
{
  "VoiceID": 10030,
  "IsPlayerInvolved": true,
  "VoicePath": "vo_belobog_cutscene_030",
  "VoiceType": "Cutscene"
}
```

### VoiceAtlas.json (1.36 MB, 5,445 条)

**字段** (10): `AudioEvent, AudioID, AvatarID, IsBattleVoice, ReplaceID, SortID, Unlock, VoiceID, VoiceTitle, Voice_M`

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
  "SortID": 100
}
```

### UpgradeAvatarSubRelic.json (0.67 MB, 2,208 条)

**字段** (6): `AMAPBCEEKFP, EMLJEDBDDDM, FAONKFODAHF, GMNJOHLBFDA, HHBEAPOCLPC, PPBBCGALMLJ`

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

### UIRedDot.json (0.19 MB, 1,246 条)

**字段** (6): `RedDot, RedDotChildren, RedDotID, Type, UnlockID, Weight`

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

### VisitorBehaviorConfig.json (0.08 MB, 270 条)

**字段** (11): `AnchorID, BehaviorID, DefaultIdleFreeStyleMotionID, DefaultPerformanceID, NPCGroupID, NPCID, NPCRotationYInfo, NpcBubbleTalkSentenceID, PerformanceID, RewardID, VisitorID`

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

### VideoConfig.json (0.05 MB, 351 条)

**字段** (4): `CaptionPath, IsPlayerInvolved, VideoID, VideoPath`

**首条记录摘要**:
```json
{
  "VideoID": 1,
  "VideoPath": "CS_Chap01_Act010.usm",
  "IsPlayerInvolved": true,
  "CaptionPath": "Config/CutSceneCaption/CS_Chap01_Act010_..."
}
```

### VideoEncryptionConfig.json (0.02 MB, 351 条)

**字段** (3): `Encryption, EncryptionMethod, VideoID`

**首条记录摘要**:
```json
{
  "VideoID": 1,
  "Encryption": true
}
```

### UniqueActor.json (0.02 MB, 204 条)

**字段** (2): `ActorID, UniqueName`

**首条记录摘要**:
```json
{
  "UniqueName": "Bronya_00",
  "ActorID": "Actor_Bronya_00"
}
```

### WorldDataConfig.json (0.01 MB, 9 条)

**字段** (17): `CameraHeight, CameraWidth, ChapterIconBigPath, ChronicleWorldBgPath, ChronicleWorldPredictPath, ChronicleWorldProcessingPath, ChronicleWorldSubBgPath, ID, IsRealWorld, IsShow, MapSpaceTypeList, SimpleWorldDesc, SmallWorldIconPath, TrainSpaceType, WorldDesc, WorldLanguageName, WorldName`

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

### VersionReviewMission.json (0.00 MB, 17 条)

**字段** (4): `PreMainMissionID, ReviewMainMissionID, StoryPerformanceID, StoryStartEntranceID`

**首条记录摘要**:
```json
{
  "ReviewMainMissionID": 1036001,
  "PreMainMissionID": 1034109,
  "StoryPerformanceID": 103600151,
  "StoryStartEntranceID": 1000003
}
```

### UniqueProp.json (0.00 MB, 32 条)

**字段** (2): `PropID, UniqueName`

**首条记录摘要**:
```json
{
  "UniqueName": "Chess_00",
  "PropID": "Prop_Chess_00"
}
```

### UpgradeAvatar.json (0.00 MB, 7 条)

**字段** (11): `BAFNGNPHHEC, EEBNMNAJJHF, HLLMOIBCKNO, HMKPKMILCAE, ILHDODKFKOI, JDGHCBCNMBI, JPJLIFNHPAA, LEPEPJIHEFL, NHAFDDACLLA, OCMAKGJLFBJ, OPJDGJNAKFF`

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

### UpgradeAvatarSubType.json (0.00 MB, 32 条)

**字段** (2): `ACCJKGEKHKP, AMAPBCEEKFP`

**首条记录摘要**:
```json
{
  "ACCJKGEKHKP": 1403,
  "AMAPBCEEKFP": "LowSpeed"
}
```

### WorldLevelConfig.json (0.00 MB, 7 条)

**字段** (6): `Breaktips1, Breaktips2, Level, LevelUpMission, LevelUpMissionTips, MaxPlayerLevel`

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

### WorldUnlockConfig.json (0.00 MB, 4 条)

**字段** (8): `DirectUnlockCondition, ID, InitMainMissionList, NewWorldHintDialogActivityID, NewWorldHintDialogPrefab, PreWorldID, WorldPreUnlockEndMission, WorldPreUnlockStartMission`

**首条记录摘要**:
```json
{
  "ID": 501,
  "InitMainMissionList": [
    1040101
  ],
  "DirectUnlockCondition": "![RealFinishMainMission:1036106] |![SubM...",
  "WorldPreUnlockStartMission": 1040101,
  "WorldPreUnlockEndMission": 1040101,
  "NewWorldHintDialogPrefab": ""
}
```

### WorldLevelStageUnlockConfig.json (0.00 MB, 6 条)

**字段** (4): `RaidID, UIEntranceBgPath, UIEntranceParam, UIEnviromentParam`

**首条记录摘要**:
```json
{
  "RaidID": 41001,
  "UIEntranceParam": 3001,
  "UIEntranceBgPath": "UI/UI3D/UI3DFarmStage/_dependencies/Mate...",
  "UIEnviromentParam": 41000007
}
```

### WheelSelectConfig.json (0.00 MB, 17 条)

**字段** (4): `FourSlotOrder, FunctionHudID, IndexID, Order`

**首条记录摘要**:
```json
{
  "IndexID": 1,
  "FunctionHudID": 4,
  "Order": 5,
  "FourSlotOrder": 4
}
```

### World3DMapEntranceConfig.json (0.00 MB, 9 条)

**字段** (6): `Anchor, ConditionParamInt, ConditionType, FormID, ID, Priority`

**首条记录摘要**:
```json
{
  "ID": 101,
  "Anchor": "W0"
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

### UIPageBGM.json (0.00 MB, 4 条)

**字段** (2): `BGMEvent, PagePrefab`

**首条记录摘要**:
```json
{
  "PagePrefab": "BattleLineupUI",
  "BGMEvent": "Ev_bgm_menu_ui_play"
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

### VideoConfigLD.json (0.00 MB, 0 条)
