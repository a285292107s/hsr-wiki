"""voracity 转换器契约测试（合成数据，不依赖真实源数据）。

覆盖：
- _parse_unlock_mission_id / _int_values / _score_values：条件串解析与 ArrayValue 包装
- _progress_steps / _buff_levels / _invasion_levels：档位排序、回退、字段省略
- _resolve_detail_id / _invasion_index：实例→模板归一、未命中置 null、侵入归属去重升序
- _scope_index：关卡 → 所属终局赛季与位置（层级 / 星启附加关 / 异相仲裁；未发布赛季不输出）
- _status_entries / _tutorial_entries / _affix_entries：筛选口径、图标去前缀、参数展开
- convert：产物顶层结构、字段缺失即省略（不落空串）
- monster_detail.convert：侵入名单内怪物附 invaded 块
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monster_detail as md  # noqa: E402
from converters import voracity as vor  # noqa: E402

# _scope_index 会读取的 11 张表（3 关卡表 + 3 分组表 + 3 星启表 + 仲裁 2 表）
_SCOPE_SOURCE_FILES = (
    "ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
    "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
    "ChallengeGroupConfig.json", "ChallengeStoryGroupConfig.json",
    "ChallengeBossGroupConfig.json", "ChallengePeakGroupConfig.json",
    "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
    "ChallengeBossMazeTierce.json",
)

_TEXT: dict[str, str] = {
    "101": "镇伏「贪饕」，汇聚愿力",
    "103": "「贪饕」的侵染已遍布这个世界。",
    "201": "汇聚 <unbreak>4</unbreak> 愿力",
    "301": "被污染的怪物获得了「贪饕」的力量。",
    "401": "阿哈来点作用",
    "402": "攻击力提高<color=#f29e38ff><unbreak>#1[i]</unbreak></color>%。",
    "403": "可回复的生命上限降低<unbreak>#1[f1]%</unbreak>。",
    "501": "教程一",
    "601": "侵蚀·第一位面强化",
    "602": "第一位面中的敌人有概率被贪饕侵蚀。",
    "603": "无关词条名",
    "604": "无关词条描述",
    "605": "普通和精英敌人有概率被贪饕侵蚀。普通和精英敌人获得强化。",
    "701": "愿力进度一",
}


def ref(key: str) -> dict:
    """构造 TextMap 引用（Hash 以字符串入表，与 resolve_text 的 str() 查表一致）。"""
    return {"Hash": key}


@pytest.fixture(autouse=True)
def fake_textmap(monkeypatch):
    """mock TextMap 查询（未命中返回空串）；clean_text 保持真实实现以验证标签剥除。"""
    def fake_resolve(value, clean=True):
        if not value:
            return ""
        if isinstance(value, dict):
            return _TEXT.get(str(value.get("Hash")), "")
        return str(value)

    monkeypatch.setattr(vor, "resolve_text", fake_resolve)


class TestParseUnlockMissionId:
    def test_extracts_mission_id(self):
        assert vor._parse_unlock_mission_id("[FinishMainMission:4010121]") == 4010121

    def test_non_mission_condition_returns_none(self):
        assert vor._parse_unlock_mission_id("") is None
        assert vor._parse_unlock_mission_id("[PlayerLevel:20]") is None

    def test_accepts_condition_without_brackets(self):
        assert vor._parse_unlock_mission_id("FinishMainMission:4010121") == 4010121


class TestIntValues:
    def test_unwraps_array_value_wrapper(self):
        value = {"ArrayValue": [{"IntValue": 4}, {"IntValue": 10}, {"IntValue": 0}]}
        assert vor._int_values(value) == [4, 10, 0]

    def test_non_array_value_returns_empty(self):
        assert vor._int_values({"IntValue": 5}) == []
        assert vor._int_values(None) == []


class TestScoreValues:
    def test_reads_registered_const(self):
        rows = [
            {"ConstValueName": "Other", "Value": {"ArrayValue": [{"IntValue": 1}]}},
            {"ConstValueName": "Activity_TantaoInvasion_Score",
             "Value": {"ArrayValue": [{"IntValue": 4}, {"IntValue": 60}]}},
        ]
        assert vor._score_values(rows) == [4, 60]

    def test_missing_const_returns_empty_list(self):
        assert vor._score_values([{"ConstValueName": "Other"}]) == []


class TestProgressSteps:
    def test_sorted_by_red_point_and_null_progress_kept(self):
        rows = [
            {"RedPoint": 2, "ActivityProgress": 0.24, "ProgressDes": ref("201")},
            {"RedPoint": 1, "ProgressDes": ref("702")},
        ]
        assert vor._progress_steps(rows) == [
            {"progress": None},
            {"progress": 0.24, "desc": "汇聚 4 愿力"},
        ]


class TestBuffLevels:
    def test_falls_back_to_status_config_when_maze_buff_text_missing(self):
        rows = [{"BuffID": 3034011, "BuffLevel": 1}]
        maze_buffs = {3034011: {
            "name": "", "desc": "", "param_list": [150, 120, 300, 0, 0.15],
            "icon": "BuffIcon/Inlevel/IconActivity_StageInvasion_Support", "binding": "K",
        }}
        status_index = {"MCommon_Gluttony_BUFF_LV1": {
            "name": "阿哈来点作用", "desc": "攻击力提高#1[i]%。",
        }}
        assert vor._buff_levels(rows, maze_buffs, status_index) == [{
            "level": 1,
            "buff_id": 3034011,
            "name": "阿哈来点作用",
            "desc": "攻击力提高#1[i]%。",
            "param_list": [150, 120, 300, 0, 0.15],
            "icon": "BuffIcon/Inlevel/IconActivity_StageInvasion_Support",
            "progress_percent": None,
        }]

    def test_skips_name_and_desc_keys_when_both_sources_empty(self):
        rows = [
            {"BuffID": 3034013, "BuffLevel": 3, "ProgressPercent": 0.7},
            {"BuffLevel": 9},
        ]
        result = vor._buff_levels(rows, {}, {})
        assert result == [{"level": 3, "buff_id": 3034013, "param_list": [],
                           "progress_percent": 0.7}]
        assert "name" not in result[0] and "desc" not in result[0] and "icon" not in result[0]


class TestInvasionLevels:
    def test_joins_desc_from_stage_table_and_binding_from_maze_buff(self):
        rows = [{"InvasionID": 1, "MazeBuffID": 3034001, "InvasionDesc": ref("301")}]
        maze_buffs = {3034001: {
            "name": "", "desc": "", "param_list": [0.4, 0.1, 1, 1, 0.2],
            "icon": "BuffIcon/Inlevel/IconBuffShield",
            "binding": "ChallengePeakBattle_GluttonyAbility_LV1",
        }}
        assert vor._invasion_levels(rows, maze_buffs) == [{
            "invasion_id": 1,
            "maze_buff_id": 3034001,
            "desc": "被污染的怪物获得了「贪饕」的力量。",
            "param_list": [0.4, 0.1, 1, 1, 0.2],
            "binding": "ChallengePeakBattle_GluttonyAbility_LV1",
            "icon": "BuffIcon/Inlevel/IconBuffShield",
        }]

    def test_missing_maze_buff_keeps_entry_with_empty_params(self):
        rows = [{"InvasionID": 2, "MazeBuffID": 9999, "InvasionDesc": ref("9998")}]
        assert vor._invasion_levels(rows, {}) == [
            {"invasion_id": 2, "maze_buff_id": 9999, "param_list": []},
        ]

    def test_textmap_miss_omits_name_and_desc_instead_of_empty_string(self):
        """3034xxx 的 BuffName/BuffDesc 上游未收录 → 不许落空串占位。"""
        rows = [{"InvasionID": 1, "MazeBuffID": 3034001, "InvasionDesc": ref("9999")}]
        maze_buffs = {3034001: {"name": "", "desc": "", "param_list": [0.4],
                                "icon": "BuffIcon/Inlevel/IconBuffShield",
                                "binding": "K"}}
        entry = vor._invasion_levels(rows, maze_buffs)[0]
        assert "name" not in entry and "desc" not in entry
        assert "" not in (entry.get("name"), entry.get("desc"))


class TestResolveDetailId:
    def test_instance_id_normalized_to_template(self):
        assert vor._resolve_detail_id(202206017, {202206017: 2022060}, {2022060}) == 2022060

    def test_unregistered_template_returns_none(self):
        assert vor._resolve_detail_id(9000, {9000: 9001}, {2022060}) is None

    def test_template_keyed_instance_falls_back_to_itself(self):
        assert vor._resolve_detail_id(5013010, {}, {5013010}) == 5013010

    def test_real_instance_pairs_normalize_to_template(self):
        """实例 ID ≠ 模板 ID 的上游映射；实例 ID 自身也在图鉴键集内，不可据此判对。"""
        pairs = {
            202206017: 2022060, 202303203: 2023032,
            202206018: 2022060, 202303204: 2023032,
            800302201: 8003022, 300301401: 3003014,
            300305007: 3003050, 300302007: 3003020,
            802401106: 8024011,
        }
        known = set(pairs) | set(pairs.values())
        for instance_id, template_id in pairs.items():
            assert vor._resolve_detail_id(instance_id, pairs, known) == template_id


class TestInvasionIndex:
    @pytest.fixture(autouse=True)
    def fake_sources(self, monkeypatch):
        files = {
            "StageInvasionConfig.json": [
                {"StageID": 30509012, "InvasionID": 2, "MonsterInvasionList": [
                    {"DBLDCKODNEN": 202206017},
                    {"DBLDCKODNEN": 5013010},
                ]},
                {"StageID": 420503, "InvasionID": 2, "MonsterInvasionList": [
                    {"DBLDCKODNEN": 202206018},
                    {"DBLDCKODNEN": 9000},
                ]},
                {"StageID": 1, "InvasionID": 3, "MonsterInvasionList": [
                    {"DBLDCKODNEN": 5013010},
                ]},
            ],
            "MonsterConfig.json": [
                {"MonsterID": 202206017, "MonsterTemplateID": 2022060},
                {"MonsterID": 202206018, "MonsterTemplateID": 2022060},
            ],
            # 作用域表默认空：本类只测关卡清单本身，作用域由 TestScopeIndex 单测
            **{name: [] for name in _SCOPE_SOURCE_FILES},
        }
        monkeypatch.setattr(vor, "load_json", lambda path: files[Path(path).name])

    def test_stages_sorted_with_name_icon_and_null_detail(self):
        monsters = {
            2022060: {"name": "虚卒·掠夺者", "icon": "Monster_2022060"},
            5013010: {"name": "侵蚀者", "icon": "Monster_5013010"},
        }
        stages, _ = vor._invasion_index(monsters)
        assert [s["stage_id"] for s in stages] == [1, 420503, 30509012]
        assert stages[2]["monsters"] == [
            {"monster_id": 202206017, "detail_id": 2022060,
             "name": "虚卒·掠夺者", "icon": "Monster_2022060"},
            {"monster_id": 5013010, "detail_id": 5013010,
             "name": "侵蚀者", "icon": "Monster_5013010"},
        ]
        assert stages[1]["monsters"][1] == {"monster_id": 9000, "detail_id": None}

    def test_usage_deduped_and_sorted(self):
        monsters = {2022060: {"name": "虚卒·掠夺者", "icon": "Monster_2022060"},
                    5013010: {"name": "侵蚀者", "icon": "Monster_5013010"}}
        _, usage = vor._invasion_index(monsters)
        assert usage == {
            5013010: {"invasion_ids": [2, 3], "stages": [1, 30509012]},
            2022060: {"invasion_ids": [2], "stages": [420503, 30509012]},
        }

    def test_load_invasion_map_returns_usage_only(self):
        monsters = {5013010: {"name": "侵蚀者", "icon": "Monster_5013010"}}
        assert vor.load_invasion_map(monsters) == {
            5013010: {"invasion_ids": [2, 3], "stages": [1, 30509012]},
        }


class TestScopeIndex:
    """关卡 → 终局赛季归属（ADR 0026）：层级 / 星启附加关 / 异相仲裁三条来源。"""

    @pytest.fixture(autouse=True)
    def fake_sources(self, monkeypatch):
        files = {
            "ChallengeMazeConfig.json": [
                {"ID": 5411, "GroupID": 1035, "Floor": 11,
                 "EventIDList1": [30125111], "EventIDList2": [30125112]},
                # 星启记录 DLCKKJFMJOB 指向的常规最后一关（5512）→ 反查赛季
                {"ID": 5512, "GroupID": 1035, "Floor": 12,
                 "EventIDList1": [30125121], "EventIDList2": [30125122]},
            ],
            "ChallengeGroupConfig.json": [
                {"GroupID": 1035, "GroupName": ref("901")},
            ],
            "ChallengeMazeTierce.json": [
                {"PHFMCACHFIJ": 5513, "DLCKKJFMJOB": 5512, "HFIAAGAKFMD": [30126123]},
            ],
            "ChallengeBossMazeConfig.json": [
                {"ID": 30203, "GroupID": 3021, "Floor": 3,
                 "EventIDList1": [420533], "EventIDList2": [420534]},
                # 同一关卡被第二个已发布赛季引用 → 作用域为列表
                {"ID": 30233, "GroupID": 3023, "Floor": 4,
                 "EventIDList1": [420533], "EventIDList2": [420534]},
                # 未发布赛季：分组表无 GroupName → 作用域必须整体省略
                {"ID": 30223, "GroupID": 3022, "Floor": 3,
                 "EventIDList1": [420533], "EventIDList2": [420534]},
            ],
            "ChallengeBossGroupConfig.json": [
                {"GroupID": 3021, "GroupName": ref("902")},
                {"GroupID": 3023, "GroupName": ref("905")},
                {"GroupID": 3022},
            ],
            "ChallengePeakConfig.json": [
                {"ID": 902, "Title": ref("903"), "EventIDList": [30509012]},
            ],
            "ChallengePeakGroupConfig.json": [
                {"ID": 9, "Title": ref("904"), "PreLevelIDList": [901, 902, 903]},
            ],
        }
        _TEXT.update({
            "901": "来生泅渡", "902": "支配遗忘", "903": "骑士（二）", "904": "军团再临",
            "905": "支配遗忘·复刻",
        })
        defaults = {name: [] for name in _SCOPE_SOURCE_FILES}
        defaults.update(files)
        monkeypatch.setattr(vor, "load_json", lambda path: defaults[Path(path).name])

    def test_floor_stage_maps_to_season_and_half(self):
        scopes = vor._scope_index()
        assert scopes[30125112] == [{
            "mode": "maze", "season_id": "1035", "season_name": "来生泅渡",
            "half": "stage2", "floor": 11,
        }]
        assert scopes[30125111] == [{
            "mode": "maze", "season_id": "1035", "season_name": "来生泅渡",
            "half": "stage1", "floor": 11,
        }]
        # 未命中任何关卡表的关卡无作用域
        assert 99999999 not in scopes

    def test_tierce_stage_maps_to_same_season_as_last_floor(self):
        scopes = vor._scope_index()
        assert scopes[30126123] == [{
            "mode": "maze", "season_id": "1035", "season_name": "来生泅渡",
            "half": "tierce",
        }]

    def test_peak_stage_maps_to_period_group_with_level_title(self):
        scopes = vor._scope_index()
        assert scopes[30509012] == [{
            "mode": "peak", "season_id": "9", "season_name": "军团再临",
            "half": "level", "title": "骑士（二）",
        }]

    def test_unpublished_season_scope_omitted(self):
        """分组表无 GroupName 的未发布赛季不产出作用域（避免死链）。"""
        scopes = vor._scope_index()
        seasons = {s["season_id"] for s in scopes[420533]}
        assert seasons == {"3021", "3023"}

    def test_same_stage_can_belong_to_multiple_seasons(self):
        """同一关卡被多赛季引用时按列表返回，且按 (mode, season_id, floor, half) 排序。"""
        scopes = vor._scope_index()
        assert [s["season_id"] for s in scopes[420534]] == ["3021", "3023"]
        assert [s["half"] for s in scopes[420534]] == ["stage2", "stage2"]


class TestStatusEntries:
    def test_filters_by_modifier_keyword_and_omits_missing_text(self):
        rows = [
            {"StatusID": 66002011, "ModifierName": "MCommon_Gluttony_BUFF_LV1",
             "StatusName": ref("401"), "StatusType": "Buff", "StatusDesc": ref("402"),
             "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconActivity_StageInvasion_Support.png"},
            {"StatusID": 66002001, "ModifierName": "MCommon_Gluttony_DirtyHp",
             "StatusName": ref("9999"), "StatusType": "Debuff", "StatusDesc": ref("403"),
             "StatusIconPath": ""},
            {"StatusID": 1, "ModifierName": "Unrelated", "StatusName": ref("401")},
            {"StatusID": 5, "ModifierName": "ADV_StageInvasion_Support", "StatusType": "Buff"},
        ]
        result = vor._status_entries(rows, {})
        assert [s["status_id"] for s in result] == [5, 66002001, 66002011]
        assert result[1] == {
            "status_id": 66002001, "type": "Debuff",
            "desc": "可回复的生命上限降低#1[f1]%。",
            "param_list": [],
            "modifier": "MCommon_Gluttony_DirtyHp", "can_dispel": False,
        }
        assert "name" not in result[1] and "icon" not in result[1]
        assert result[2]["icon"] == "BuffIcon/Inlevel/IconActivity_StageInvasion_Support"
        assert result[2]["desc"] == "攻击力提高#1[i]%。"

    def test_can_dispel_is_boolean(self):
        rows = [{"StatusID": 2, "ModifierName": "X_StageInvasion", "CanDispel": True}]
        assert vor._status_entries(rows, {})[0]["can_dispel"] is True

    def test_buff_params_injected_by_level_and_empty_otherwise(self):
        """66002011-13 借同档 MazeBuff 参数；无档位/本域无源的状态显式空数组。"""
        buf_rows = [
            {"BuffID": 3034011, "BuffLevel": 1},
            {"BuffID": 3034012, "BuffLevel": 2},
            {"BuffID": 3034013, "BuffLevel": 3},
        ]
        maze_buffs = {
            3034011: {"param_list": [150, 120, 300, 0, 0.15]},
            3034012: {"param_list": [150, 120, 300, 8, 0.15]},
            3034013: {"param_list": [300, 240, 600, 12, 0.3]},
        }
        buff_params = vor._buff_params_by_level(buf_rows, maze_buffs)
        assert buff_params == {
            1: [150, 120, 300, 0, 0.15],
            2: [150, 120, 300, 8, 0.15],
            3: [300, 240, 600, 12, 0.3],
        }
        rows = [
            {"StatusID": 66002011, "ModifierName": "MCommon_Gluttony_BUFF_LV1"},
            {"StatusID": 66002012, "ModifierName": "MCommon_Gluttony_BUFF_LV2"},
            {"StatusID": 66002013, "ModifierName": "MCommon_Gluttony_BUFF_LV3"},
            {"StatusID": 66002001, "ModifierName": "MCommon_Gluttony_DirtyHp"},
            {"StatusID": 64777997, "ModifierName": "Monster_Rogue_Gluttony_DamageTakenUp"},
        ]
        result = {s["status_id"]: s["param_list"] for s in vor._status_entries(rows, buff_params)}
        assert result[66002011] == [150, 120, 300, 0, 0.15]
        assert result[66002012] == [150, 120, 300, 8, 0.15]
        assert result[66002013] == [300, 240, 600, 12, 0.3]
        assert result[66002001] == []
        assert result[64777997] == []

    def test_buff_level_parses_only_numeric_suffix(self):
        assert vor._buff_level("MCommon_Gluttony_BUFF_LV2") == 2
        assert vor._buff_level("MCommon_Gluttony_DirtyHp") is None
        assert vor._buff_level("MCommon_Gluttony_BUFF_LVX") is None


class TestTutorialEntries:
    def test_keeps_registered_ids_and_strips_image_path(self):
        rows = [
            {"ID": 1050101, "ImagePath": "SpriteOutput/TutorialPic/TutorialPage_1050101.png",
             "DescText": ref("501")},
            {"ID": 999999, "ImagePath": "SpriteOutput/TutorialPic/Other.png", "DescText": ref("501")},
        ]
        assert vor._tutorial_entries(rows) == [
            {"id": 1050101, "image": "TutorialPic/TutorialPage_1050101", "desc": "教程一"},
        ]


class TestAffixEntries:
    def test_matches_plane_keyword_and_unwraps_params(self):
        rows = [
            {"ID": 1007, "AffixName": ref("601"), "AffixDesc": ref("602"),
             "IconPath": "SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_Affix_09.png",
             "EffectParamList": [{"Value": 0.16}, {"Value": 0.16}]},
            {"ID": 1006, "AffixName": ref("603"), "AffixDesc": ref("605"),
             "IconPath": "SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_Affix_10.png",
             "EffectParamList": [{"Value": 0.24}, {"Value": 0.16}]},
            {"ID": 1001, "AffixName": ref("603"), "AffixDesc": ref("604"),
             "IconPath": "", "EffectParamList": []},
        ]
        result = vor._affix_entries(rows)
        assert result == [{
            "id": 1007,
            "name": "侵蚀·第一位面强化",
            "desc": "第一位面中的敌人有概率被贪饕侵蚀。",
            "icon": "SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_Affix_09.png",
            "params": [0.16, 0.16],
        }]
        # 位面词条图标走完整路径（消费方按完整路径取值），其余字段走去前缀口径
        assert result[0]["icon"].startswith("SpriteOutput/")
        assert result[0]["icon"].endswith(".png")


_FILES: dict[str, list] = {
    "ActivityPanel.json": [{
        "PanelID": 10190, "TabName": ref("101"), "TitleName": ref("102"),
        "IntroDesc": ref("103"), "UnlockConditions": "[FinishMainMission:4010121]",
    }],
    "ConstValueCommon.json": [{
        "ConstValueName": "Activity_TantaoInvasion_Score",
        "Value": {"ArrayValue": [{"IntValue": 4}, {"IntValue": 10}]},
    }],
    "ActivityVoracityInvasionPro.json": [
        {"RedPoint": 2, "ActivityProgress": 0.24, "ProgressDes": ref("201")},
        {"RedPoint": 1, "ProgressDes": ref("702")},
    ],
    "ActivityVoracityInvasionBuf.json": [
        {"BuffID": 3034011, "BuffLevel": 1},
        {"BuffID": 3034012, "BuffLevel": 2, "ProgressPercent": 0.4},
    ],
    "MazeBuff.json": [
        {"ID": 3034011, "BuffName": ref("9998"), "BuffDesc": ref("9997"),
         "ParamList": [{"Value": 150}, {"Value": 120}],
         "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconActivity_StageInvasion_Support.png",
         "InBattleBindingKey": "ChallengePeakBattle_GluttonyAbility_BUFF_LV1"},
        {"ID": 3034012, "BuffName": ref("401"), "BuffDesc": ref("402"),
         "ParamList": [{"Value": 200}],
         "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconActivity_StageInvasion_Support.png",
         "InBattleBindingKey": ""},
        {"ID": 3034001, "BuffName": ref("9996"), "BuffDesc": ref("9995"),
         "ParamList": [{"Value": 0.4}, {"Value": 0.1}],
         "BuffIcon": "SpriteOutput/BuffIcon/Inlevel/IconBuffShield.png",
         "InBattleBindingKey": "ChallengePeakBattle_GluttonyAbility_LV1"},
    ],
    "StatusConfig.json": [
        {"StatusID": 66002011, "ModifierName": "MCommon_Gluttony_BUFF_LV1",
         "StatusName": ref("401"), "StatusType": "Buff", "StatusDesc": ref("402"),
         "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconActivity_StageInvasion_Support.png"},
        {"StatusID": 66002001, "ModifierName": "MCommon_Gluttony_DirtyHp",
         "StatusName": ref("9994"), "StatusType": "Debuff", "StatusDesc": ref("403"),
         "StatusIconPath": "SpriteOutput/BuffIcon/Inlevel/IconMonster_W5_StageInvasion.png"},
        {"StatusID": 1, "ModifierName": "Unrelated", "StatusName": ref("401")},
    ],
    "StageInvasionBuff.json": [
        {"InvasionID": 1, "MazeBuffID": 3034001, "InvasionDesc": ref("301")},
    ],
    "StageInvasionConfig.json": [{
        "StageID": 30509012, "InvasionID": 2,
        "MonsterInvasionList": [{"DBLDCKODNEN": 202206017}, {"DBLDCKODNEN": 5013010}],
    }],
    "MonsterConfig.json": [{"MonsterID": 202206017, "MonsterTemplateID": 2022060}],
    "TutorialGuideData.json": [{
        "ID": 1050101, "ImagePath": "SpriteOutput/TutorialPic/TutorialPage_1050101.png",
        "DescText": ref("501"),
    }],
    "GridFightAffixConfig.json": [{
        "ID": 1007, "AffixName": ref("601"), "AffixDesc": ref("602"),
        "IconPath": "SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_Affix_09.png",
        "EffectParamList": [{"Value": 0.16}, {"Value": 0.16}],
    }],
}

_MONSTERS = {
    2022060: {"name": "虚卒·掠夺者", "icon": "Monster_2022060"},
    5013010: {"name": "侵蚀者", "icon": "Monster_5013010"},
}


class TestConvert:
    @pytest.fixture(autouse=True)
    def fake_sources(self, monkeypatch):
        self.saved: dict = {}
        self.files = dict(_FILES)
        # 作用域表在 TestConvert 里不参与断言，补空表即可（口径由 TestScopeIndex 覆盖）
        for name in _SCOPE_SOURCE_FILES:
            self.files.setdefault(name, [])

        def fake_load_json(path):
            return self.files[Path(path).name]

        monkeypatch.setattr(vor, "load_json", fake_load_json)
        monkeypatch.setattr(vor, "load_monsters", lambda: _MONSTERS)
        monkeypatch.setattr(
            vor, "save_json", lambda data, path: self.saved.update(data=data, path=str(path)))

    def test_top_level_structure_and_sections(self):
        vor.convert()
        result = self.saved["data"]
        assert list(result) == ["activity", "invasion", "statuses", "tutorials", "affixes"]
        assert self.saved["path"].endswith("voracity.json")

        activity = result["activity"]
        assert activity["panel_id"] == 10190
        assert activity["name"] == "镇伏「贪饕」，汇聚愿力"
        assert activity["intro"] == "「贪饕」的侵染已遍布这个世界。"
        assert activity["unlock_mission_id"] == 4010121
        assert activity["scores"] == [4, 10]
        assert activity["progress_steps"] == [
            {"progress": None},
            {"progress": 0.24, "desc": "汇聚 4 愿力"},
        ]
        assert activity["buff_levels"] == [
            {"level": 1, "buff_id": 3034011, "name": "阿哈来点作用",
             "desc": "攻击力提高#1[i]%。", "param_list": [150, 120],
             "icon": "BuffIcon/Inlevel/IconActivity_StageInvasion_Support",
             "progress_percent": None},
            {"level": 2, "buff_id": 3034012, "name": "阿哈来点作用",
             "desc": "攻击力提高#1[i]%。", "param_list": [200],
             "icon": "BuffIcon/Inlevel/IconActivity_StageInvasion_Support",
             "progress_percent": 0.4},
        ]

        assert result["invasion"]["levels"] == [{
            "invasion_id": 1, "maze_buff_id": 3034001,
            "desc": "被污染的怪物获得了「贪饕」的力量。",
            "param_list": [0.4, 0.1],
            "binding": "ChallengePeakBattle_GluttonyAbility_LV1",
            "icon": "BuffIcon/Inlevel/IconBuffShield",
        }]
        assert result["invasion"]["stages"] == [{
            "stage_id": 30509012, "invasion_id": 2, "scopes": [],
            "monsters": [
                {"monster_id": 202206017, "detail_id": 2022060,
                 "name": "虚卒·掠夺者", "icon": "Monster_2022060"},
                {"monster_id": 5013010, "detail_id": 5013010,
                 "name": "侵蚀者", "icon": "Monster_5013010"},
            ],
        }]
        assert [s["status_id"] for s in result["statuses"]] == [66002001, 66002011]
        statuses = {s["status_id"]: s for s in result["statuses"]}
        assert statuses[66002011]["param_list"] == [150, 120]
        assert statuses[66002001]["param_list"] == []
        assert result["tutorials"] == [{
            "id": 1050101, "image": "TutorialPic/TutorialPage_1050101", "desc": "教程一",
        }]
        assert result["affixes"] == [{
            "id": 1007, "name": "侵蚀·第一位面强化",
            "desc": "第一位面中的敌人有概率被贪饕侵蚀。",
            "icon": "SpriteOutput/GridFight/BattleIcon/BuffIcon/Icon_GridFight_Affix_09.png",
            "params": [0.16, 0.16],
        }]

    def test_activity_block_omitted_without_panel(self):
        self.files["ActivityPanel.json"] = [{"PanelID": 1, "TabName": ref("101")}]
        vor.convert()
        assert list(self.saved["data"]) == ["invasion", "statuses", "tutorials", "affixes"]


class TestMonsterDetailInvaded:
    def test_attaches_invaded_block_for_listed_monsters(self, monkeypatch):
        monsters = {
            2022060: {"name": "虚卒·掠夺者", "icon": "A", "figure": "A", "rank": "Minion",
                      "camp": "", "stance": 0, "weak": [], "resist": {}, "intro": "",
                      "stats": {}, "skills": [],
                      "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
                      "level_group": 1},
            5013010: {"name": "侵蚀者", "icon": "B", "figure": "B", "rank": "Elite",
                      "camp": "", "stance": 0, "weak": [], "resist": {}, "intro": "",
                      "stats": {}, "skills": [],
                      "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
                      "level_group": 1},
        }
        saved: dict = {}
        monkeypatch.setattr(md, "load_monsters", lambda: monsters)
        monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: {
            2022060: {"invasion_ids": [2], "stages": [30509012]},
        })
        monkeypatch.setattr(md, "save_json", lambda data, path: saved.__setitem__(path.name, data))
        monkeypatch.setattr(Path, "mkdir", lambda *a, **k: None)

        md.convert()

        assert saved["2022060.json"]["invaded"] == {
            "invasion_ids": [2], "stages": [30509012],
        }
        assert "invaded" not in saved["5013010.json"]

    def test_alias_page_shares_template_invaded_block(self, monkeypatch):
        """实例别名页（_tpl 指向模板）与模板页同值；模板无标记时别名页也不写该键。"""
        base = {"name": "虚卒·掠夺者", "icon": "A", "figure": "A", "rank": "Minion",
                "camp": "", "stance": 0, "weak": [], "resist": {}, "intro": "",
                "stats": {}, "skills": [],
                # 战斗数值合成链字段（ADR 0040）
                "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
                "level_group": 1}
        monsters = {
            2022060: dict(base),
            202206017: {**base, "_tpl": 2022060},
            5013010: {**base, "_tpl": 9999999},
        }
        saved: dict = {}
        monkeypatch.setattr(md, "load_monsters", lambda: monsters)
        monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: {
            2022060: {"invasion_ids": [2], "stages": [420503, 420504]},
        })
        monkeypatch.setattr(md, "save_json", lambda data, path: saved.__setitem__(path.name, data))
        monkeypatch.setattr(Path, "mkdir", lambda *a, **k: None)

        md.convert()

        assert saved["202206017.json"]["invaded"] == saved["2022060.json"]["invaded"]
        assert saved["202206017.json"]["invaded"] == {
            "invasion_ids": [2], "stages": [420503, 420504],
        }
        assert "invaded" not in saved["5013010.json"]
        assert saved["202206017.json"]["id"] == 202206017
        assert "_tpl" not in saved["202206017.json"]


class TestMonsterDetailInvadedInvariants:
    """invaded = 模板级事实的结构化不变量（期望值全部由夹具推导，不硬编码条目数）。"""

    _INVADED_VARIANTS = {
        2022060: (202206017, 202206018, 202206019),
        3003014: (300301401, 300301402),
    }
    _OUTSIDE_VARIANTS = {
        5034010: (503401001,),
        5034011: (),
        5023020: (),
        5014030: (),
        5032010: (),
    }

    @pytest.fixture
    def env(self, monkeypatch):
        base = {"name": "甲", "icon": "I", "figure": "F", "rank": "Minion",
                "camp": "", "stance": 0, "weak": [], "resist": {}, "intro": "",
                "stats": {}, "skills": [],
                # 战斗数值合成链字段（ADR 0040）：怪物详情 payload 的两段新增
                "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
                "level_group": 1}
        template_of: dict[int, int] = {}
        monsters: dict[int, dict] = {}
        for tpl in (*self._INVADED_VARIANTS, *self._OUTSIDE_VARIANTS):
            monsters[tpl] = dict(base)
            template_of[tpl] = tpl
        for tpl, variants in (*self._INVADED_VARIANTS.items(), *self._OUTSIDE_VARIANTS.items()):
            for inst in variants:
                monsters[inst] = {**base, "_tpl": tpl}
                template_of[inst] = tpl
        usage = {
            tpl: {"invasion_ids": [i + 2], "stages": [900 + i]}
            for i, tpl in enumerate(sorted(self._INVADED_VARIANTS))
        }
        saved: dict = {}
        monkeypatch.setattr(md, "load_monsters", lambda: monsters)
        monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: usage)
        monkeypatch.setattr(md, "save_json", lambda data, path: saved.__setitem__(path.name, data))
        monkeypatch.setattr(Path, "mkdir", lambda *a, **k: None)
        md.convert()
        return saved, template_of, usage

    def test_invaded_key_iff_template_in_invasion_list(self, env):
        """双向：有键 ⇔ 该文件的模板 ID 在侵入名单模板集合内。
        （曲线单点 monster-level-curve.json 是共享文件，不计入怪物文件数）"""
        saved, template_of, usage = env
        assert len(saved) - ("monster-level-curve.json" in saved) == len(template_of)
        for mid, tpl in template_of.items():
            assert ("invaded" in saved[f"{mid}.json"]) is (tpl in usage), mid

    def test_variants_of_same_template_share_invaded(self, env):
        """同一模板的全部变体页（含模板页本身）invaded 完全相等，且等于该模板的归属。"""
        saved, template_of, usage = env
        groups: dict[int, list] = {}
        for mid, tpl in template_of.items():
            groups.setdefault(tpl, []).append(saved[f"{mid}.json"].get("invaded"))
        assert any(len(values) > 1 for values in groups.values())
        for tpl, values in groups.items():
            assert all(value == values[0] for value in values), tpl
            assert values[0] == usage.get(tpl), tpl

    def test_templates_outside_invasion_list_have_no_key(self, env):
        """侵入名单外的模板（含 4.5 期既有的贪饕相关怪物）及其变体一律无 invaded 键。"""
        saved, template_of, usage = env
        outside = {tpl for tpl in self._OUTSIDE_VARIANTS if tpl not in usage}
        assert outside and not (outside & set(usage))
        for mid, tpl in template_of.items():
            if tpl in outside:
                assert "invaded" not in saved[f"{mid}.json"], mid
