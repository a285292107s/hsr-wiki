"""monster_extra 详情附加块契约测试（合成数据，不依赖真实源数据）。

三块各自的判据都锁一条**反直觉**的边界，这些边界都是实测撞出来的：
- 掉落：空档位行（`DisplayItemList` 为空）必须丢掉，`WorldLevel=None` 的基准档必须排在最前；
- 出没：同关多波只计一次；**召唤者出场要算作被召唤者的出场**（漏了会把冰锋这类召唤型小怪
  判成从未出场）；样本按「关卡名 + StageType」双去重（只按类型去重会得到三条同名样本）；
  活动关卡的名必须取活动表（`StageConfig.StageName` 是活动级常量），常量名不落样本；
- 阶段：同名双表按 `(组, 阶段)` 去重取并集；族内每个成员都带同一组阶段；组号为空无阶段。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import items as it  # noqa: E402
from converters import monster_extra as mx  # noqa: E402


def _fake_sources(monkeypatch, **overrides):
    """按文件名分发 load_json（模块内所有读取都走这一个入口）。"""
    tables = {
        "ItemConfig.json": [
            {"ID": 2, "ItemName": {"Hash": 1}, "ItemIconPath": "icon/item/2.png"},
            {"ID": 112001, "ItemName": {"Hash": 2}, "ItemIconPath": "icon/item/112001.png"},
            {"ID": 999, "ItemName": {}, "ItemIconPath": "icon/item/999.png"},  # 无名称 → 不收录
        ],
        "MonsterDrop.json": [
            {"MonsterTemplateID": 1002011, "WorldLevel": 2, "AvatarExpReward": 60,
             "DisplayItemList": [{"ItemID": 2}, {"ItemID": 112001}]},
            {"MonsterTemplateID": 1002011, "WorldLevel": None, "AvatarExpReward": 36,
             "DisplayItemList": [{"ItemID": 2}]},
            # 空档位行（实测 1645 行如此）必须丢掉
            {"MonsterTemplateID": 1004010, "WorldLevel": 1, "AvatarExpReward": None, "DisplayItemList": []},
            # 未知 ItemID 与无名称物品都不落
            {"MonsterTemplateID": 1002011, "WorldLevel": 3, "AvatarExpReward": 70,
             "DisplayItemList": [{"ItemID": 424242}, {"ItemID": 999}]},
        ],
        "MonsterConfig.json": [
            {"MonsterID": 1002011, "MonsterTemplateID": 1002011, "SummonIDList": []},
            # 召唤者：冰锋由它召唤出场，波次名单里没有冰锋
            {"MonsterID": 1005010, "MonsterTemplateID": 1005010, "SummonIDList": [1002011]},
            # 活动关卡用（见下 StageID 4190010）
            {"MonsterID": 1002040, "MonsterTemplateID": 1002040, "SummonIDList": []},
            # 活动关卡名四条链各自的被试怪物（键互不重叠，断言互不干扰）
            {"MonsterID": 1003010, "MonsterTemplateID": 1003010, "SummonIDList": []},
            {"MonsterID": 1003011, "MonsterTemplateID": 1003011, "SummonIDList": []},
            {"MonsterID": 1003012, "MonsterTemplateID": 1003012, "SummonIDList": []},
            {"MonsterID": 1003013, "MonsterTemplateID": 1003013, "SummonIDList": []},
            {"MonsterID": 1003014, "MonsterTemplateID": 1003014, "SummonIDList": []},
            {"MonsterID": 1003015, "MonsterTemplateID": 1003015, "SummonIDList": []},
            {"MonsterID": 1003016, "MonsterTemplateID": 1003016, "SummonIDList": []},
            {"MonsterID": 1003017, "MonsterTemplateID": 1003017, "SummonIDList": []},
            # ②③④ 三档实名源各自的被试怪物
            {"MonsterID": 1003020, "MonsterTemplateID": 1003020, "SummonIDList": []},
            {"MonsterID": 1003021, "MonsterTemplateID": 1003021, "SummonIDList": []},
            {"MonsterID": 1003022, "MonsterTemplateID": 1003022, "SummonIDList": []},
            {"MonsterID": 1003023, "MonsterTemplateID": 1003023, "SummonIDList": []},
            # 无实名源关卡（且关卡名与本怪同名）的被试怪物
            {"MonsterID": 1003024, "MonsterTemplateID": 1003024, "SummonIDList": []},
        ],
        "StageConfig.json": [
            # 同一关两波都带 1002011 → 只能计一次；名字来自终局表（StageName 一律不取）
            {"StageID": 1, "StageType": "Challenge", "StageName": {"Hash": 11},
             "MonsterList": [{"a": 1002011}, {"b": 1002011}]},
            # 召唤者出场 → 被召唤者（1002011）也计一次；同类型（Challenge）只出一条样本
            {"StageID": 2, "StageType": "Challenge", "StageName": {"Hash": 12},
             "MonsterList": [{"a": 1005010}]},
            # 无实名源的三关（Mainline / Trial / VerseSimulation）→ 只计 total、不落样本
            {"StageID": 3, "StageType": "Mainline", "StageName": {"Hash": 11},
             "MonsterList": [{"a": 1002011}]},
            {"StageID": 4, "StageType": "Trial", "StageName": {},
             "MonsterList": [{"a": 1002011}]},
            {"StageID": 5, "StageType": "VerseSimulation", "StageName": {"Hash": 11},
             "MonsterList": [{"a": 1002011}]},
            # 关卡名与本怪同名（hash 96 = 测试怪）且无实名源 → 依然不落样本
            {"StageID": 6, "StageType": "VerseSimulation", "StageName": {"Hash": 96},
             "MonsterList": [{"a": 1003024}]},
            # 活动关卡：StageType 与 ActivityPanel.UIPrefab 同名（FightFest）→ 产出活动出处。
            # 用 1002040（不参与 drops/appearances 夹具断言），避免扰动既有用例。
            {"StageID": 4190010, "StageType": "FightFest", "StageName": {"Hash": 74}, "Level": 20,
             "MonsterList": [{"Monster0": 1002040}]},
            # 活动级常量名且无实名源（FightActivity）→ 只计 total、不落样本
            {"StageID": 30, "StageType": "FightActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003010}]},
            {"StageID": 31, "StageType": "FightActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003010}]},
            # 四条活动链：EventID = StageID // 10
            {"StageID": 4270010, "StageType": "ElationActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003011}]},
            {"StageID": 4280010, "StageType": "TelevisionActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003012}]},
            {"StageID": 4210010, "StageType": "SummonActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003013}]},
            # 「关卡号 = 活动号」的单关特例：对不上 //10 折算，退回原值查活动表
            {"StageID": 419000, "StageType": "FightFest", "StageName": {"Hash": 74}, "Level": 85,
             "MonsterList": [{"Monster0": 1003014}]},
            # BoxingClub：304099 没有名称行 ⇒ 不落样本（**不退回** StageName）
            {"StageID": 3040010, "StageType": "BoxingClub", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003015}]},
            {"StageID": 3040990, "StageType": "BoxingClub", "StageName": {"Hash": 13},
             "MonsterList": [{"a": 1003016}]},
            # StarFightActivity：两跳链 EventID → GroupID → GroupTitle
            {"StageID": 4170010, "StageType": "StarFightActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003017}]},
            # ③ 侵蚀隧洞 / 凝滞虚影：StageID(列表/单值) + MappingInfoID → MappingInfo.Name
            {"StageID": 1043050, "StageType": "Cocoon", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003020}]},
            {"StageID": 1012160, "StageType": "FarmElement", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003021}]},
            # ④ 强敌挑战 / 剑试：EventID==StageID / StageID 精确连接
            {"StageID": 420012, "StageType": "StrongChallengeActivity", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003022}]},
            {"StageID": 418001, "StageType": "SwordTraining", "StageName": {"Hash": 15},
             "MonsterList": [{"a": 1003023}]},
        ],
        "ChallengeMazeConfig.json": [
            {"ID": 2001, "Name": {"Hash": 90}, "EventIDList1": [1, 3], "EventIDList2": []},
        ],
        "ChallengeStoryMazeConfig.json": [
            {"ID": 2002, "Name": {"Hash": 91}, "EventIDList1": [], "EventIDList2": [2]},
        ],
        "ChallengeBossMazeConfig.json": [],
        "ChallengePeakConfig.json": [],
        "MappingInfo.json": [
            {"ID": 900, "Name": {"Hash": 93}},
            {"ID": 901, "Name": {"Hash": 93}},
        ],
        "CocoonConfig.json": [
            {"ID": 1, "StageIDList": [1043050], "MappingInfoID": 900},
        ],
        "FarmElementConfig.json": [
            {"ID": 1, "StageID": 1012160, "MappingInfoID": 901},
        ],
        "StrongChallengeStage.json": [
            {"StrongChallengeStageID": 6, "EventID": 420012, "Name": {"Hash": 94}},
            # 类型闸：这条指向 Challenge 关（StageID 1），StageType 不匹配时必须整条忽略
            {"StrongChallengeStageID": 7, "EventID": 1, "Name": {"Hash": 94}},
        ],
        "SwordTrainingExam.json": [
            {"ExamID": 101, "StageID": 418001, "EnemyName": {"Hash": 95}},
        ],
        "FightFestStageInfo.json": [
            {"EventID": 419001, "ChallengeName": {"Hash": 75}},
            # 关卡号 = 活动号的单关特例（StageID 419000 对不上 //10 折算）由调用方退回原值查
            {"EventID": 419000, "ChallengeName": {"Hash": 79}},
        ],
        "ElationBattleLevel.json": [
            {"EventID": 427001, "StageName": {"Hash": 76}},
        ],
        "ActivityTelevisionLevel.json": [
            {"EventID": 428001, "TelevisionID": 7},
        ],
        "ActivityTelevisionStage.json": [
            {"TelevisionID": 7, "StageName": {"Hash": 77}, "ActivityModuleID": 4000501},
        ],
        "ActivitySummonLevel.json": [
            {"EventID": 421001, "GroupID": 3},
        ],
        "ActivitySummonGroup.json": [
            {"GroupID": 3, "StageName": {"Hash": 78}, "ActivityModuleID": 5002001},
        ],
        "BoxingClubStage.json": [
            {"EventID": 304001, "Name": {"Hash": 80}},
        ],
        "StarFightStageConfig.json": [
            {"EventID": 417001, "GroupID": 1},
        ],
        "ActivityStarFightGroup.json": [
            {"GroupID": 1, "GroupTitle": {"Hash": 81}, "ActivityModuleID": 5001601},
        ],
        "ActivityPanel.json": [
            {"PanelID": 50018, "UIPrefab": "UI/Quest/Widget/FightFestPanel.prefab",
             "TitleName": {"Hash": 71}},
            # 活动名前缀：ActivityModuleID 前导 = PanelID（4000 是短号干扰项，必须被 40005 盖住）
            {"PanelID": 4000, "UIPrefab": "UI/Quest/Widget/UnknownPanel.prefab",
             "TitleName": {"Hash": 89}},
            {"PanelID": 40005, "UIPrefab": "UI/Quest/Widget/QuestTelevisionPanel.prefab",
             "TitleName": {"Hash": 97}},
            {"PanelID": 50020, "UIPrefab": "UI/Quest/Widget/QuestTrashCanSummonPanel.prefab",
             "TitleName": {"Hash": 98}},
            {"PanelID": 50016, "UIPrefab": "UI/Quest/Widget/QuestStarChallengePanel.prefab",
             "TitleName": {"Hash": 99}},
        ],
        "ActivityQuestRewardData.json": [
            # ActivityModuleID 以该面板 ID 开头 → 它的页签算这个活动的
            {"ActivityModuleID": 5001801, "QuestTabName": {"Hash": 72}},
            # 别的活动的页签不得混入
            {"ActivityModuleID": 9999999, "QuestTabName": {"Hash": 73}},
        ],
        "MonsterTemplateConfig.json": [
            {"MonsterTemplateID": 4014010, "TemplateGroupID": 4014010},
            {"MonsterTemplateID": 4014011, "TemplateGroupID": 4014010},
            {"MonsterTemplateID": 1002011, "TemplateGroupID": None},
            # 状态词条归属用：同一只怪的两种形态（去括号后缀同名 → 都归属）
            {"MonsterTemplateID": 7001, "MonsterName": {"Hash": 51},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Alpha_00_Config.json"},
            {"MonsterTemplateID": 7002, "MonsterName": {"Hash": 52},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Alpha_00_Config.json"},
            # 同一 token 下**另一个怪物**（去括号后缀仍不同名 → 该 token 的状态整条丢弃）
            {"MonsterTemplateID": 7003, "MonsterName": {"Hash": 53},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Beta_00_Config.json"},
            {"MonsterTemplateID": 7004, "MonsterName": {"Hash": 54},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Beta_00_Config.json"},
        ],
        "MonsterStatusConfig.json": [
            # 命中唯一 token，描述无占位符 → 全字段落
            {"StatusID": 9001, "ModifierName": "MMonster_W9_Alpha_00_Skill01_DefenceDown",
             "StatusName": {"Hash": 61}, "StatusType": "Debuff",
             "StatusDesc": {"Hash": 62}, "CanDispel": True},
            # 描述带 #N[i] 占位符（数值来自动态属性）→ 不落 desc，其余照落
            {"StatusID": 9002, "ModifierName": "MMonster_W9_Alpha_00_AttackUp",
             "StatusName": {"Hash": 63}, "StatusType": "Buff",
             "StatusDesc": {"Hash": 64}, "CanDispel": False},
            # 命中的 token 跨了两个名字（贝塔/伽马）→ 整条丢弃，两边都不挂
            {"StatusID": 9004, "ModifierName": "MMonster_W9_Beta_00_Fury",
             "StatusName": {"Hash": 66}, "StatusType": "Debuff", "StatusDesc": {"Hash": 62}},
            # 无 token 命中 → 丢弃
            {"StatusID": 9003, "ModifierName": "MCommon_SuperArmor",
             "StatusName": {"Hash": 65}, "StatusType": "Other", "StatusDesc": {"Hash": 62}},
            # 渲染签名与 9001 全同（不同 StatusID）→ 去重后只留一条
            {"StatusID": 9005, "ModifierName": "MMonster_W9_Alpha_00_Skill02_DefenceDown",
             "StatusName": {"Hash": 61}, "StatusType": "Debuff",
             "StatusDesc": {"Hash": 62}, "CanDispel": True},
            # 描述带 `%宏`（运行时替换的施放者名）→ 同样不落 desc
            {"StatusID": 9006, "ModifierName": "MMonster_W9_Alpha_00_Support",
             "StatusName": {"Hash": 67}, "StatusType": "Other",
             "StatusDesc": {"Hash": 68}},
        ],
        "MonsterAtlasExtraPhase.json": [
            {"TemplateGroupID": 4014010, "PhaseID": 1,
             "StanceWeakList": ["Ice", "Thunder", "Ice"],
             "DamageTypeResistance": [{"DamageType": "Fire", "Value": {"Value": 0.2}}],
             "MonsterName": {"Hash": 21},
             # 阶段块里的 DebuffResist 刻意不取
             "DebuffResist": [{"Key": "STAT_CTRL", "Value": {"Value": 0.5}}]},
        ],
        "MonsterAtlasExtraPhases.json": [
            # 同名双表里的同一条 → 去重
            {"TemplateGroupID": 4014010, "PhaseID": 1, "StanceWeakList": ["Ice", "Thunder"]},
            {"TemplateGroupID": 4014010, "PhaseID": 2,
             "StanceWeakList": ["Physical"],
             "DamageTypeResistance": [{"DamageType": "Ice", "Value": {"Value": {"Value": 0.4}}}],
             "MonsterIntroduction": {"Hash": 22}},
        ],
        "ExtraEffectConfig.json": [
            {"ExtraEffectID": 10000027, "ExtraEffectName": {"Hash": 41},
             "ExtraEffectDesc": {"Hash": 42}, "DescParamList": [{"Value": 0.3}]},
            # 无名称的效果不收录（与物品/技能同一纪律：无文本不上屏）
            {"ExtraEffectID": 10000028, "ExtraEffectName": {}, "ExtraEffectDesc": {"Hash": 43}},
        ],
        "MonsterSkillConfig.json": [
            {"SkillID": 100203001, "ExtraEffectIDList": [10000027, 999999]},
            {"SkillID": 100203002, "ExtraEffectIDList": []},
        ],
    }
    tables.update(overrides)

    def fake_load(path):
        return tables[Path(path).name]

    monkeypatch.setattr(mx, "load_json", fake_load)
    # 文本表夹具：真实管线**按 `textmap._text_map` 取值**（令牌化、组合器、枚举登记读的都是它），
    # 故这里补文本表本身，而不是各处 `resolve_text` 的替身——否则组合文案（活动名剥「」/
    # 小节正文 join）拿不到键，多语言化那部分路径在测试里是空跑。
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {
        str(k): v for k, v in {
            1: "信用点", 2: "铁卫扣饰", 11: "于枯冬之中", 12: "混沌回忆", 21: "疯王·第二阶段", 22: "阶段介绍",
            41: "额外回合", 42: "获得 #1[i] 个额外回合",
            51: "阿尔法", 52: "阿尔法（完整）", 53: "贝塔", 54: "伽马",
            13: "第八日", 15: "裂界造物",
            61: "防御力降低", 62: "防御力降低 20%。", 63: "攻击力提高", 64: "攻击力提高#1[i]%。",
            65: "超甲", 66: "狂怒", 67: "支援", 68: "受到%CasterName支援。",
            71: "「星天演武仪典」", 72: "「梦境训练」", 73: "别的活动页签", 74: "活动关卡",
            75: "擂台赛•其一", 76: "花火的千变假面", 77: "与银袋山同行", 78: "人山人海的桶",
            79: "新人首秀", 80: "很多鸽子", 81: "星海竞逐",
            90: "回忆其一", 91: "虚构其一", 93: "魔占之径 • 侵蚀隧洞", 94: "长生久视的一梦",
            95: "热血的云骑战士", 96: "测试怪", 89: "短号活动", 97: "惊梦电视台", 98: "开拓，友谊魔法！",
            99: "星芒烁变",
        }.items()
    })


class TestLoadDrops:
    def test_tiers_sorted_and_empty_rows_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        drops = mx.load_drops()
        assert set(drops) == {1002011}, "只有空档位的模板不产出 drops 键"
        # 基准档（None）在最前、其余升序；WorldLevel=3 那档的物品全部解析失败（未知 ID + 无名称）
        # ⇒ 该档整档不落，而不是留一个空物品列表
        assert [t["world_level"] for t in drops[1002011]] == [None, 2]

    def test_items_resolved_from_itemconfig_and_unknown_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        tiers = mx.load_drops()[1002011]
        assert tiers[0]["items"] == [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}]
        assert tiers[0]["avatar_exp"] == 36
        # 未知 ItemID 与无名称物品都被丢掉 → 第三档没有物品，整档不落
        assert [t["world_level"] for t in tiers] == [None, 2]
        assert [i["name"] for i in tiers[1]["items"]] == ["信用点", "铁卫扣饰"]


class TestLoadAppearances:
    def test_counts_stage_once_and_follows_summons(self, monkeypatch):
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        assert app[1002011]["total"] == 5, "同关两波只计一次；召唤者所在关卡也要计入被召唤者"
        assert app[1005010]["total"] == 1

    def test_samples_only_from_player_visible_sources(self, monkeypatch):
        """样本名只取玩家可见源（本夹具 = 终局表）；`StageConfig.StageName` 一律不取。"""
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        # 关 1（Challenge，两波同怪）与关 2（Challenge，召唤者）都命中终局表 → 同一 StageType 只出一条
        assert app[1002011]["samples"] == [{"id": 1, "name": "回忆其一"}]
        assert app[1005010]["samples"] == [{"id": 2, "name": "虚构其一"}]

    def test_activity_name_travels_as_its_own_field(self, monkeypatch):
        """活动名不拼进 `name`：视图/AI 快照各按同一格式拼接（数据层两个字段各管一件事）。"""
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        assert app[1002040]["samples"] == [
            {"id": 4190010, "name": "擂台赛•其一", "activity": "星天演武仪典", "level": 20}
        ], "关卡行带 Level 时样本透传关卡语境（4190010 的夹具行 Level=20）"
        assert app[1003011]["samples"] == [{"id": 4270010, "name": "花火的千变假面"}], (
            "ElationActivity 无活动名验证链 → 不落 activity 键"
        )

    def test_stage_context_carries_level_group_and_elite_group(self, monkeypatch):
        """关卡语境三件套（ADR 0050）：Level/HardLevelGroup/EliteGroup 逐项透传，缺位不落键；
        嵌套 `{Value:…}` 包装逐层解开；关卡名解析不出的关卡不产样本，语境随行丢弃。"""
        stages = [
            # 全套语境：隧洞类关卡行（实测形态：Level + HardLevelGroup + EliteGroup）；
            # StageID 1 挂假终局表 EventIDList1 拿到玩家可见关卡名
            {"StageID": 1, "StageType": "Challenge", "StageName": {"Hash": 11},
             "Level": 68, "HardLevelGroup": 1, "EliteGroup": 6,
             "MonsterList": [{"a": 1002011}]},
            # 精英组双层包装 + 缺 Level：只有解出的 elite_group 落键（走④强敌挑战链的关卡名）
            {"StageID": 420012, "StageType": "StrongChallengeActivity", "Level": None,
             "EliteGroup": {"Value": {"Value": 35001}},
             "MonsterList": [{"a": 1002011}]},
        ]
        _fake_sources(monkeypatch, **{"StageConfig.json": stages})
        app = mx.load_appearances()
        assert app[1002011]["samples"][0] == {"id": 1, "name": "回忆其一",
                                              "level": 68, "level_group": 1, "elite_group": 6}
        assert app[1002011]["samples"][1] == {"id": 420012, "name": "长生久视的一梦", "elite_group": 35001}

    def test_stage_context_absent_fields_not_emitted(self, monkeypatch):
        """关卡行不带 Level/HardLevelGroup/EliteGroup（如夹具的 Challenge 关）→ 样本保持三键。"""
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        assert app[1002011]["samples"][0] == {"id": 1, "name": "回忆其一"}

    def test_stage_without_player_visible_name_yields_no_sample(self, monkeypatch):
        """无实名源的关卡只进 total：关 3/4/5 都不落样本，即便关卡名与本怪同名（关 6）。"""
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        assert app[1003024]["total"] == 1
        assert app[1003024]["samples"] == [], "关卡名 == 本怪名字（敌方标识）不得上屏"
        # 1002011 还出现在关 3/4/5（Mainline / Trial / VerseSimulation）→ total 5，但样本只有关 1
        assert app[1002011]["total"] == 5


class TestPlayerStageNames:
    """出没样本的唯一名称来源：活动链 + 终局四表 + 入口表 + 强敌/剑试表（ADR 0047）。"""

    def test_activity_chains_indexed_by_event_id(self, monkeypatch):
        """活动链返回 `{EventID: {name, activity}}`；活动名只在**有验证链**时给。"""
        _fake_sources(monkeypatch)
        names = mx.load_activity_stage_names()
        assert names["FightFest"][419001] == {"name": "擂台赛•其一", "activity": "星天演武仪典"}, (
            "FightFest 的活动名走「UIPrefab basename == StageType」同名约定"
        )
        assert names["TelevisionActivity"][428001] == {"name": "与银袋山同行", "activity": "惊梦电视台"}
        assert names["SummonActivity"][421001] == {"name": "人山人海的桶", "activity": "开拓，友谊魔法！"}
        assert names["StarFightActivity"][417001] == {"name": "星海竞逐", "activity": "星芒烁变"}
        assert names["ElationActivity"][427001] == {"name": "花火的千变假面", "activity": ""}, (
            "ElationActivity 全库无 ActivityModuleID 连接 → 宁缺前缀，不猜活动"
        )
        assert names["BoxingClub"][304001] == {"name": "很多鸽子", "activity": ""}, (
            "BoxingClub 只有 20/97 个活动号能连到挑战表 → 同样不带活动名"
        )

    def test_four_source_families_resolve_to_stage_id(self, monkeypatch):
        _fake_sources(monkeypatch)
        stage_types = {r["StageID"]: r["StageType"] for r in mx._load_table("StageConfig")}
        names = mx.load_player_stage_names(stage_types)
        # ① 活动（含「关卡号 = 活动号」的单关特例、无名称行；活动名与关卡名分列两个字段）
        assert names[4190010] == {"name": "擂台赛•其一", "activity": "星天演武仪典"}
        assert names[419000] == {"name": "新人首秀", "activity": "星天演武仪典"}
        assert names[3040010] == {"name": "很多鸽子", "activity": ""}, "无活动名验证链的活动链 activity 为空"
        assert names[4270010] == {"name": "花火的千变假面", "activity": ""}
        assert names[4280010] == {"name": "与银袋山同行", "activity": "惊梦电视台"}
        assert names[4210010] == {"name": "人山人海的桶", "activity": "开拓，友谊魔法！"}
        assert names[4170010] == {"name": "星海竞逐", "activity": "星芒烁变"}
        assert 3040990 not in names, "活动表无名称行的关卡不产出名字"
        # ② 终局四表：列表里直接装关卡 ID
        assert names[1] == {"name": "回忆其一", "activity": ""}
        assert names[2] == {"name": "虚构其一", "activity": ""}
        # ③ MappingInfoID（真外键）→ MappingInfo.Name
        assert names[1043050] == {"name": "魔占之径 • 侵蚀隧洞", "activity": ""}
        assert names[1012160] == {"name": "魔占之径 • 侵蚀隧洞", "activity": ""}
        # ④ EventID == StageID / StageID 精确连接
        assert names[420012] == {"name": "长生久视的一梦", "activity": ""}
        assert names[418001] == {"name": "热血的云骑战士", "activity": ""}
        # 无源的关卡（FightActivity 常量名 / Mainline / Trial / VerseSimulation / BoxingClub 缺行）都不在表里
        for sid in (3, 4, 5, 6, 30, 31, 3040990):
            assert sid not in names

    def test_activity_prefix_takes_longest_panel_id(self, monkeypatch):
        """`ActivityModuleID` 前导匹配取**最长** PanelID：夹具里 4000 与 40005 都能前缀命中，须选 40005。"""
        _fake_sources(monkeypatch)
        stage_types = {r["StageID"]: r["StageType"] for r in mx._load_table("StageConfig")}
        names = mx.load_player_stage_names(stage_types)
        assert names[4280010]["activity"] == "惊梦电视台", "短号面板 4000 不得抢匹配"

    def test_stage_type_guard_rejects_cross_type_record(self, monkeypatch):
        """表内记录指向了**别的 StageType** 的关卡时整条忽略（夹具里 EventID=1 是 Challenge 关）。"""
        _fake_sources(monkeypatch)
        stage_types = {r["StageID"]: r["StageType"] for r in mx._load_table("StageConfig")}
        names = mx.load_player_stage_names(stage_types)
        assert names[1]["name"] == "回忆其一", "强敌挑战表的 EventID=1 记录不得覆盖 Challenge 关的名字"

    def test_missing_table_skips_that_source_only(self, monkeypatch):
        _fake_sources(monkeypatch)
        inner = mx.load_json

        def fake(path):
            if Path(path).name in ("ElationBattleLevel.json", "ChallengeMazeConfig.json"):
                raise FileNotFoundError(path)
            return inner(path)

        monkeypatch.setattr(mx, "load_json", fake)
        stage_types = {r["StageID"]: r["StageType"] for r in mx._load_table("StageConfig")}
        names = mx.load_player_stage_names(stage_types)
        assert names[4190010] == {"name": "擂台赛•其一", "activity": "星天演武仪典"}, "缺表只掉对应那条源"
        assert 1 not in names, "终局表缺失 → 该关退化为无名（不退回 StageName）"
        assert names[1043050] == {"name": "魔占之径 • 侵蚀隧洞", "activity": ""}


class TestLoadPhases:
    def test_dedupes_twin_tables_and_assigns_to_every_member(self, monkeypatch):
        _fake_sources(monkeypatch)
        phases = mx.load_phases()
        assert set(phases) == {4014010, 4014011}, "族内每个成员都带同一组阶段；组号为空的模板没有阶段"
        assert [p["phase_id"] for p in phases[4014010]] == [1, 2], "按阶段号升序"
        p1, p2 = phases[4014010]
        assert p1["weak"] == ["Ice", "Thunder"], "弱点去重保序"
        assert p1["resist"] == {"Fire": 0.2}
        assert p1["name"] == "疯王·第二阶段"
        assert "DebuffResist" not in p1 and "debuff_resist" not in p1, "阶段块刻意不取 DebuffResist"
        assert p2["resist"] == {"Ice": 0.4}, "双层 ValueWrap 也要剥到数值"
        assert p2["intro"] == "阶段介绍"
        assert "name" not in p2


class TestLoadSkillExtraEffects:
    def test_foreign_key_join_and_skips(self, monkeypatch):
        """`ExtraEffectIDList` × `ExtraEffectConfig` 是**完整外键**（不是命名约定猜测）：
        只保留表里登记且有名者，空列表与未登记 ID 都不产出键；描述参数逐层剥 Value 包装。"""
        _fake_sources(monkeypatch)
        fx = mx.load_skill_extra_effects()
        assert set(fx) == {100203001}, "空 ExtraEffectIDList / 未登记的 ID 都不产出键"
        assert fx[100203001] == [{
            "id": 10000027, "name": "额外回合",
            "desc": "获得 #1[i] 个额外回合", "param_list": [0.3],
        }]


class TestLoadEventSources:
    """活动出处：判据是 `ActivityPanel.UIPrefab` basename ↔ `StageConfig.StageType` 的同名约定。"""

    def test_derives_name_tabs_levels(self, monkeypatch):
        _fake_sources(monkeypatch)
        ev = mx.load_event_sources()
        assert set(ev) == {1002040, 1003014}, "只有活动关卡的怪物产出"
        assert ev[1002040]["name"] == "星天演武仪典", "TitleName 的「」要剥掉"
        assert ev[1002040]["tabs"] == ["梦境训练"], "只取 ActivityModuleID 属于该面板的页签"
        assert ev[1002040]["levels"] == [20]
        assert ev[1002040]["count"] == 1

    def test_panel_missing_yields_nothing(self, monkeypatch):
        _fake_sources(monkeypatch)
        inner = mx.load_json

        def fake(path):
            if Path(path).name == "ActivityPanel.json":
                raise FileNotFoundError(path)
            return inner(path)

        monkeypatch.setattr(mx, "load_json", fake)
        assert mx.load_event_sources() == {}, "表缺失就整条不产出（静默降级，不猜）"

    def test_non_event_stages_ignored(self, monkeypatch):
        _fake_sources(monkeypatch)
        # 夹具里 Mainline / Challenge / Trial 三个非活动关不得产出任何条目
        ev = mx.load_event_sources()
        assert 1002011 not in ev and 1005010 not in ev


class TestLoadStatuses:
    """状态词条的安全子集：**最长 token + 去形态后缀同名**；只有无占位符的描述才落。"""

    def test_attributes_to_same_name_forms_only(self, monkeypatch):
        _fake_sources(monkeypatch)
        st = mx.load_statuses()
        # 阿尔法 / 阿尔法（完整）同 token 同基名 → 两条都拿到
        assert set(st) == {7001, 7002}, "跨名 token（贝塔/伽马）整条丢弃，两边都不挂"
        assert [s["name"] for s in st[7001]] == ["防御力降低", "攻击力提高", "支援"], (
            "渲染签名全同的两条（9001 / 9005）只留一条，且按 StatusID 升序"
        )

    def test_desc_only_without_placeholder_and_dispenl_flag(self, monkeypatch):
        _fake_sources(monkeypatch)
        rows = {s["id"]: s for s in mx.load_statuses()[7001]}
        assert rows[9001]["desc"] == "防御力降低 20%。", "无占位符 → 描述照落"
        assert rows[9001]["dispel"] is True
        assert "desc" not in rows[9002], "带 #N[i] 占位符（数值来自动态属性）→ 不落不可渲染的描述"
        assert "desc" not in rows[9006], "带 %宏（运行时替换的施放者名）→ 同样不落描述"
        assert "dispel" not in rows[9002], "CanDispel 为假不落键"

    def test_unmatched_status_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        ids = {s["id"] for rows in mx.load_statuses().values() for s in rows}
        assert 9003 not in ids, "无 token 命中的通用状态（MCommon_*）不归属任何怪物"
