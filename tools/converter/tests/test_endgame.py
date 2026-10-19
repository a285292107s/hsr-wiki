import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import endgame as eg  # noqa: E402
from converters import endgame_catalog as egc  # noqa: E402
from converters import monster_guide as mg  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    import textmap
    import converters.monster_common as mc

    class FakeTextMap(dict):
        def get(self, k, default=None):
            return f"名{k}" if isinstance(k, str) and k.isdigit() else default

        def __getitem__(self, k):
            return f"名{k}"

    monkeypatch.setattr(textmap, "_text_map", FakeTextMap())
    fake_resolve = lambda ref, clean=False: "" if not ref else f"名{ref.get('Hash', 0)}"  # noqa: E731
    monkeypatch.setattr(eg, "resolve_text", fake_resolve)
    monkeypatch.setattr(mc, "resolve_text", fake_resolve)
    return mc

class TestLoadSchedules:
    MAZE_GROUP_TABLE = "ChallengeGroupConfig.json"

    def _stub(self, monkeypatch, tables):
        monkeypatch.setattr(eg, "load_json", lambda p: tables[Path(p).name])

    def test_pointer_maps_and_global_fallback(self, monkeypatch):
        self._stub(monkeypatch, {
            "ChallengeGroupConfig.json": [
                {"GroupID": 101, "ScheduleDataID": 200101},
                {"GroupID": 1034, "ScheduleDataID": 291015},
                {"GroupID": 1035, "ScheduleDataID": 291016},
                {"GroupID": 1037, "ScheduleDataID": 299999},
                {"GroupID": 100, "ScheduleDataID": None},
            ],
            "ScheduleDataChallengeMaze.json": [
                {"ID": 200101, "BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
            ],
            "ScheduleDataGlobal.json": [
                {"ID": 291015, "BeginTime": "2026-08-17 04:00:00", "EndTime": ""},
                {"ID": 291016, "BeginTime": "", "EndTime": "2026-11-02 04:00:00"},
            ],
        })
        schedules, test = eg._load_schedules(
            self.MAZE_GROUP_TABLE,
            ("ScheduleDataChallengeMaze.json", "ScheduleDataGlobal.json"),
        )
        assert schedules == {
            "101": ("2023-09-04 04:00:00", "2023-09-18 04:00:00"),
            "1034": ("2026-08-17 04:00:00", ""),
            "1035": ("", "2026-11-02 04:00:00"),
        }
        assert test == set()

    def test_maze_table_wins_over_global(self, monkeypatch):
        self._stub(monkeypatch, {
            "ChallengeGroupConfig.json": [{"GroupID": 101, "ScheduleDataID": 200101}],
            "ScheduleDataChallengeMaze.json": [
                {"ID": 200101, "BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
            ],
            "ScheduleDataGlobal.json": [
                {"ID": 200101, "BeginTime": "1999-01-01 04:00:00", "EndTime": "1999-01-02 04:00:00"},
            ],
        })
        schedules, _ = eg._load_schedules(
            self.MAZE_GROUP_TABLE,
            ("ScheduleDataChallengeMaze.json", "ScheduleDataGlobal.json"),
        )
        assert schedules["101"] == ("2023-09-04 04:00:00", "2023-09-18 04:00:00")

    def test_placeholders_test_periods_and_cross_launch(self, monkeypatch):
        self._stub(monkeypatch, {
            "ChallengeGroupConfig.json": [
                {"GroupID": 101, "ScheduleDataID": 200101},
                {"GroupID": 102, "ScheduleDataID": 200102},
                {"GroupID": 103, "ScheduleDataID": 200103},
                {"GroupID": 104, "ScheduleDataID": 200104},
                {"GroupID": 105, "ScheduleDataID": 200105},
                {"GroupID": 117, "ScheduleDataID": 200117},
                {"GroupID": 118, "ScheduleDataID": 200118},
                {"GroupID": 119, "ScheduleDataID": 200119},
            ],
            "ScheduleDataChallengeMaze.json": [
                {"ID": 200101, "BeginTime": "2023-02-06 04:00:00", "EndTime": "2023-03-06 04:00:00"},
                {"ID": 200102, "BeginTime": "2033-02-06 04:00:00", "EndTime": "2033-02-20 04:00:00"},
                {"ID": 200103, "BeginTime": "", "EndTime": "2030-01-15 04:00:00"},
                {"ID": 200104, "BeginTime": "2023-01-09 04:00:00", "EndTime": ""},
                {"ID": 200105, "BeginTime": "2023-05-01 04:00:00", "EndTime": "not-a-date"},
                {"ID": 200117, "BeginTime": "2023-04-17 04:00:00", "EndTime": "2023-05-15 04:00:00"},
                {"ID": 200118, "BeginTime": "", "EndTime": ""},
            ],
        })
        schedules, test = eg._load_schedules(
            self.MAZE_GROUP_TABLE, ("ScheduleDataChallengeMaze.json",)
        )
        assert schedules == {"117": ("2023-04-17 04:00:00", "2023-05-15 04:00:00")}
        assert test == {101}

class TestAuxTables:
    def test_load_maze_buffs(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 3030146, "BuffName": {"Hash": 1},
             "BuffDesc": {"Hash": 3},
             "ParamList": [{"Value": 0.5}, {"Value": 1}]},
            {"ID": 3031301, "BuffName": {"Hash": 2}, "BuffDesc": {}},
            {"ID": 0},
        ])
        out = eg._load_maze_buffs()
        assert out[3030146] == {"name": "名1", "desc": "名3", "param_list": [0.5, 1], "icon": ""}
        assert out[3031301]["param_list"] == []
        assert 0 not in out

    def test_monster_out_trim(self):
        info = {
            "name": "名1", "icon": "Monster_1", "figure": "Monster_1",
            "weak": ["Ice"], "resist": {"Fire": 0.2}, "rank": "Elite",
            "camp": "名20", "intro": "名10", "stance": 240,
            "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 144},
            "skills": [{"id": 1, "name": "名30", "tag": "名31",
                         "type_desc": "技能", "desc": "描述",
                         "param_list": [3]}],
        }
        light = eg._monster_out(8013010, {8013010: info})
        assert light == {
            "id": "8013010", "name": "名1", "icon": "Monster_1",
            "weak": ["Ice"], "resist": {"Fire": 0.2},
            "rank": "Elite", "camp": "名20", "stance": 240,
            "speed": 144,
        }
        full = eg._monster_out(8013010, {8013010: info}, full=True)
        assert full["intro"] == "名10"
        assert full["skills"] == [{"name": "名30", "tag": "名31"}]
        assert "stats" not in full
        assert "figure" not in full
        assert eg._monster_out(9999, {}) == {"id": "9999"}

    def test_monster_out_tpl_alias(self):
        info = {"name": "名1", "icon": "Monster_1", "_tpl": 2004010,
                "weak": [], "resist": {}, "rank": "", "camp": "",
                "stance": 300, "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 0}}
        out = eg._monster_out(200401014, {200401014: info})
        assert out == {"id": "200401014", "tpl": "2004010", "name": "名1",
                       "icon": "Monster_1", "weak": [], "resist": {},
                       "rank": "", "camp": "", "stance": 300}
        assert "speed" not in out

    def test_monster_out_scene_modify_merged(self):
        info = {"name": "名1", "icon": "Monster_1", "weak": [], "resist": {},
                "rank": "", "camp": "", "stance": 60,
                "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 100},
                "stance_modify": 30, "speed_modify": -44}
        light = eg._monster_out(1, {1: info})
        assert light["stance"] == 90, "韧性 = 基准 60 + 修正 +30"
        assert light["speed"] == 56, "速度 = 基准 100 + 修正 -44"
        assert "stance_modify" not in light and "speed_modify" not in light, "原始键不外泄"
        full = eg._monster_out(1, {1: info}, full=True)
        assert full["stance"] == 90 and full["speed"] == 56
        no_mod = {"name": "甲", "icon": "I", "weak": [], "resist": {}, "rank": "", "camp": "",
                  "stance": 60, "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 100}}
        assert eg._monster_out(2, {2: no_mod})["stance"] == 60
        assert eg._monster_out(2, {2: no_mod})["speed"] == 100

    def test_load_targets_params_and_type(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 251, "ChallengeTargetName": {"Hash": 1},
             "ChallengeTargetParam1": 20, "ChallengeTargetType": "ROUNDS_LEFT"},
            {"ID": 252, "ChallengeTargetName": {"Hash": 2}},
            {"ID": 253, "ChallengeTargetName": {"Hash": 1},
             "ChallengeTargetType": "ROUNDS_LEFT"},
            {"ID": 0},
        ])
        out = eg._load_targets()
        assert out[251] == {"text": "名1", "param": 20, "type": "ROUNDS_LEFT"}
        assert out[252] == {"text": "名2", "param": None}
        assert out[253] == {"text": "名1", "param": 20, "type": "ROUNDS_LEFT"}
        assert 0 not in out

    def test_load_permanent_groups(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 100},
            {"GroupID": 900},
            {"GroupID": 1001, "ScheduleDataID": 201001},
        ])
        assert eg._load_permanent_groups() == {100, 900}

class TestGroupAux:
    def test_group_extra_buff_boss_two_stages(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 3020, "BuffList1": [3111008, 3111010], "BuffList2": [3111008, 3111012],
             "BuffList3": [3111082]},
        ])
        out = eg._group_extra_buff("x.json", ("BuffList1", "BuffList2"))
        assert out == {3020: [3111008, 3111010, 3111012]}

    def test_group_extra_sub_buffs_fever(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 2025, "SubMazeBuffList": [3031232, 3031233, 3031234, 3031232]},
            {"GroupID": 2001, "SubMazeBuffList": []},
            {"GroupID": 0},
        ])
        out = eg._group_extra_sub_buffs()
        assert out == {2025: [3031232, 3031233, 3031234]}
        assert 2001 not in out

    def test_group_extra_buff_groups_by_half(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 3020, "BuffList1": [1, 2, 2], "BuffList2": [3, 4, 5], "BuffList3": [6]},
            {"GroupID": 3001, "BuffList1": [], "BuffList2": [], "BuffList3": []},
            {"GroupID": 0},
        ])
        out = eg._group_extra_buff_groups("ChallengeBossGroupExtra.json")
        assert out == {3020: {"stage1": [1, 2], "stage2": [3, 4, 5], "tierce": [6]}}
        assert 3001 not in out

    def test_load_story_turns(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 20011, "TurnLimit": 5},
            {"ID": 20012, "TurnLimit": 6},
            {"ID": 20111, "TurnLimit": 4},
        ])
        assert eg._load_story_turns() == {"2001": 6, "2011": 4}

class TestBossGuides:
    @staticmethod
    def _guides(tags, configs, monkeypatch, phases=None, skills=None, texts=None):
        files = {
            "MonsterGuideTag.json": tags,
            "MonsterGuideConfig.json": configs,
            "MonsterGuidePhase.json": phases or [],
            "MonsterGuideSkill.json": skills or [],
            "MonsterGuideSkillText.json": texts or [],
        }
        monkeypatch.setattr(mg, "load_json", lambda p: files[Path(p).name])
        return mg.load_boss_guides()

    def test_direct_template_with_phases(self, monkeypatch):
        tags = [{"TagID": 101701, "TagName": {"Hash": 11}, "TagBriefDescription": {"Hash": 12},
                 "ParameterList": [{"Value": 0.5}, 1]}]
        configs = [
            {"MonsterID": 202401601, "TagList": [101701], "PhaseList": [10171]},
            {"MonsterID": 202401604, "TagList": [101701], "PhaseList": [10171]},
        ]
        phases = [{"PhaseID": 10171, "PhaseName": {"Hash": 21}, "PhaseDescription": {"Hash": 22},
                   "PhaseAnswer": {"Hash": 23}, "SkillList": [101711]}]
        skills = [{"SkillID": 101711, "SkillName": {"Hash": 31}, "SkillTextIDList": [1017111]}]
        texts = [{"SkillTextID": 1017111, "SkillDescription": {"Hash": 32}}]
        out = self._guides(tags, configs, monkeypatch, phases, skills, texts)
        assert out == {2024016: {
            "traits": [{"id": 101701, "name": "名11", "desc": "名12", "param_list": [0.5, 1]}],
            "phases": [{"id": 10171, "name": "名21", "desc": "名22", "answer": "名23",
                        "skills": [{"name": "名31", "desc": "名32"}]}],
        }}

    def test_phase_without_traits_kept(self, monkeypatch):
        out = self._guides([], [{"MonsterID": 302501301, "PhaseList": [30251]}], monkeypatch,
                           phases=[{"PhaseID": 30251, "PhaseName": {"Hash": 9}, "SkillList": []}])
        assert out == {3025013: {"phases": [{"id": 30251, "name": "名9", "desc": "",
                                             "answer": "", "skills": []}]}}

    def test_skill_id_alias_when_template_missing(self, monkeypatch):
        tags = [
            {"TagID": 101201, "TagName": {"Hash": 1}, "TagBriefDescription": {"Hash": 2},
             "ParameterList": [], "SkillID": 203501211},
            {"TagID": 101202, "TagName": {"Hash": 3}, "TagBriefDescription": {"Hash": 4},
             "ParameterList": []},
        ]
        out = self._guides(tags, [{"MonsterID": 203302201, "TagList": [101201, 101202],
                                   "PhaseList": [10121]}], monkeypatch,
                           phases=[{"PhaseID": 10121, "PhaseName": {"Hash": 7}, "SkillList": []}])
        assert [e["id"] for e in out[2035012]["traits"]] == [101201, 101202]
        assert out[2033022] == out[2035012]

    def test_alias_ambiguous_or_already_direct_skipped(self, monkeypatch):
        tags = [
            {"TagID": 1, "TagName": {"Hash": 1}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 203501211},
            {"TagID": 2, "TagName": {"Hash": 2}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 203501212},
            {"TagID": 3, "TagName": {"Hash": 3}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 100401410},
        ]
        out = self._guides(tags, [
            {"MonsterID": 203302201, "TagList": [1]},
            {"MonsterID": 203302301, "TagList": [2]},
            {"MonsterID": 100401401, "TagList": [3]},
        ], monkeypatch)
        assert 2035012 not in out
        assert [e["id"] for e in out[1004014]["traits"]] == [3]

    def test_guide_template_resolution(self):
        guides = {2024016: {}, 2033022: {}, 1004026: {}}
        assert eg._guide_template({"id": "202401604", "tpl": "2024016"}, guides) == 2024016
        assert eg._guide_template({"id": "2033022"}, guides) == 2033022
        assert eg._guide_template({"id": "100402604"}, guides) == 1004026

    def test_attach_boss_guides_pointers_every_floor(self):
        block = {"traits": [{"id": 101701, "name": "坚防守备"}],
                 "phases": [{"id": 10171, "name": "阶段一：丰饶大军", "skills": []}]}
        star = {"traits": [{"id": 101601, "name": "双重战场"}]}
        guides = {2024016: block, 5014014: star}
        entry = {
            "floor_details": [
                {"floor": 1, "stage1": {"monsters": [{"id": "202401601"}]}, "stage2": {"monsters": []}},
                {"floor": 4, "stage1": {"monsters": [{"id": "202401604",
                                                     "summons": [{"id": "501401404"}]}]},
                 "stage2": {"monsters": [{"id": "999901"}]}},
            ],
            "tierce": {"nodes": [{"idx": 1, "monsters": [{"id": "202401604"}]},
                                 {"idx": 3, "monsters": [{"id": "501401404"}]}]},
            "monsters": [{"id": "100402604", "tpl": "1004026"}],
        }
        eg._attach_boss_guides(entry, guides)
        assert entry["boss_guides"] == {"2024016": block, "5014014": star}
        assert entry["floor_details"][0]["stage1"]["monsters"][0]["boss_guide"] == "2024016"
        deep = entry["floor_details"][1]["stage1"]["monsters"][0]
        assert deep["boss_guide"] == "2024016"
        assert "boss_guide" not in deep["summons"][0]
        assert entry["tierce"]["nodes"][1]["monsters"][0]["boss_guide"] == "5014014"
        assert "boss_guide" not in entry["monsters"][0]

    def test_attach_boss_guides_no_hit(self):
        empty = {"floor_details": [{"floor": 1, "stage1": {"monsters": [{"id": "999901"}]}}]}
        eg._attach_boss_guides(empty, {2024016: {"traits": []}})
        assert "boss_guides" not in empty

class TestTierce:
    def test_load_tierce_mapping_and_fields(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeTierce.json"):
                return [{"PHFMCACHFIJ": 5213, "DLCKKJFMJOB": 5212,
                         "LOJCIDLKPKG": ["Imaginary", "Fire"],
                         "GNOOAGPBNLD": 45,
                         "OGEOMCGNNMP": [601, 602, 999],
                         "HFIAAGAKFMD": [30123123],
                         "JEBMBCLBIOI": [5014010, 9999999]}]
            if name.endswith("ChallengeMazeConfig.json"):
                return [{"ID": 5212, "GroupID": 1033,
                         "EventIDList1": [30123031], "EventIDList2": [30123032],
                         "ChallengeCountDown": 30, "MazeBuffID": 999,
                         "DamageType1": ["Physical"], "DamageType2": ["Fire"]},
                        {"ID": 5312, "GroupID": 1034}]
            if name.endswith("ChallengeStoryMazeTierce.json"):
                return [{"PHFMCACHFIJ": 20245, "DLCKKJFMJOB": 20244,
                         "LOJCIDLKPKG": ["Physical"], "GNOOAGPBNLD": 0,
                         "IDBJENCBJHM": 45000, "OGEOMCGNNMP": [4001],
                         "GNGENMHNLAH": 4000,
                         "EGEEJLHBALB": [{"ItemID": 122002},
                                          {"ItemID": 213, "ItemNum": 24},
                                          {"ItemID": 2, "ItemNum": 380000}]}]
            if name.endswith("ChallengeStoryMazeConfig.json"):
                return [{"ID": 20244, "GroupID": 2024}]
            if name.endswith("StageConfig.json"):
                return [
                    {"StageID": 30123123, "Level": 95,
                     "StageConfigData": [
                         {"BFLIFKBEOPJ": "_Wave", "MNDFOPKBHKP": "1"},
                         {"BFLIFKBEOPJ": "_BindingMazeBuff", "MNDFOPKBHKP": "998"},
                     ],
                     "MonsterList": [{"Monster0": 5013040, "Monster1": 5014010},
                                      {"Monster0": 5014010}]},
                    {"StageID": 30123031, "Level": 95, "MonsterList": [{"Monster0": 5014010}]},
                    {"StageID": 30123032, "Level": 95, "MonsterList": [{"Monster0": 5013040}]},
                ]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        targets = {
            601: {"text": "剩余#1[i]轮", "param": 15, "type": "ROUNDS_LEFT"},
            602: {"text": "剩余#1[i]轮", "param": 30, "type": "ROUNDS_LEFT"},
            4001: {"text": "获得#1[i]分", "param": 60000, "type": "TOTAL_SCORE"},
            4000: {"text": "获得#1[i]分", "param": 99000, "type": "TOTAL_SCORE"},
        }
        monsters = {5013040: {"name": "先锋", "icon": "Monster_5013040",
                               "weak": [], "resist": {}, "rank": "Elite"},
                    5014010: {"name": "星啸", "icon": "Monster_5014010",
                               "weak": [], "resist": {}, "rank": ""}}
        out = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json"),
             ("ChallengeStoryMazeTierce.json", "ChallengeStoryMazeConfig.json")],
            targets, monsters,
            buffs={999: {"name": "末法余烬", "desc": "霸者机制", "param_list": [0.5],
                         "icon": "BuffIcon/Inlevel/X"},
                   998: {"name": "附加关增益", "desc": "星启附加关机制", "param_list": [1],
                         "icon": "BuffIcon/Inlevel/Y"}},
        )
        assert out["1033"] == {
            "id": 5213,
            "damage_types": ["Fire", "Imaginary"],
            "countdown": 45,
            "score": None,
            "level": 95,
            "targets": [{"text": "剩余#1[i]轮", "param": 15, "type": "ROUNDS_LEFT"},
                         {"text": "剩余#1[i]轮", "param": 30, "type": "ROUNDS_LEFT"}],
            "monsters": [
                {"id": "5013040", "name": "先锋", "icon": "Monster_5013040",
                 "weak": [], "resist": {}, "rank": "Elite", "wave": 1},
                {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                 "weak": [], "resist": {}, "rank": "", "wave": 1},
                {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                 "weak": [], "resist": {}, "rank": "", "wave": 2},
            ],
            "nodes": [
                {"idx": 1, "origin": "stage1", "damage": ["Physical"], "level": 95,
                 "countdown": 30,
                 "buff": {"id": 999, "name": "末法余烬", "desc": "霸者机制",
                          "param_list": [0.5], "icon": "BuffIcon/Inlevel/X"},
                 "monsters": [{"id": "5014010", "name": "星啸",
                                             "icon": "Monster_5014010", "weak": [],
                                             "resist": {}, "rank": "", "wave": 1}]},
                {"idx": 2, "origin": "stage2", "damage": ["Fire"], "level": 95,
                 "countdown": 30,
                 "buff": {"id": 999, "name": "末法余烬", "desc": "霸者机制",
                          "param_list": [0.5], "icon": "BuffIcon/Inlevel/X"},
                 "monsters": [{"id": "5013040", "name": "先锋",
                                             "icon": "Monster_5013040", "weak": [],
                                             "resist": {}, "rank": "Elite", "wave": 1}]},
                {"idx": 3, "origin": "tierce", "damage": ["Fire", "Imaginary"],
                 "level": 95, "countdown": 45,
                 "buff": {"id": 998, "name": "附加关增益", "desc": "星启附加关机制",
                          "param_list": [1], "icon": "BuffIcon/Inlevel/Y"},
                 "monsters": [
                    {"id": "5013040", "name": "先锋", "icon": "Monster_5013040",
                     "weak": [], "resist": {}, "rank": "Elite", "wave": 1},
                    {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                     "weak": [], "resist": {}, "rank": "", "wave": 1},
                    {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                     "weak": [], "resist": {}, "rank": "", "wave": 2},
                ]},
            ],
        }
        assert out["2024"]["score"] == 45000
        assert out["2024"]["monsters"] == []
        assert out["2024"]["targets"] == [
            {"text": "获得#1[i]分", "param": 60000, "type": "TOTAL_SCORE"},
            {"text": "获得#1[i]分", "param": 99000, "type": "TOTAL_SCORE", "prism": True},
        ]
        assert out["2024"]["rewards"] == [
            {"id": 122002, "num": 0},
            {"id": 213, "num": 24},
            {"id": 2, "num": 380000},
        ]
        assert "1034" not in out
        assert out["1033"]["nodes"][0]["buff"]["id"] == 999
        assert out["1033"]["nodes"][2]["buff"]["id"] == 998

    def test_node3_buff_falls_back_to_season_buff_when_stage_silent(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeTierce.json"):
                return [{"PHFMCACHFIJ": 5213, "DLCKKJFMJOB": 5212,
                         "LOJCIDLKPKG": ["Fire"], "GNOOAGPBNLD": 45,
                         "HFIAAGAKFMD": [30123123]}]
            if name.endswith("ChallengeMazeConfig.json"):
                return [{"ID": 5212, "GroupID": 1033, "MazeBuffID": 999,
                         "EventIDList1": [30123031], "EventIDList2": [30123032]}]
            if name.endswith("StageConfig.json"):
                return [{"StageID": 30123123, "Level": 95,
                         "StageConfigData": [{"BFLIFKBEOPJ": "_Wave", "MNDFOPKBHKP": "1"}],
                         "MonsterList": [{"Monster0": 5014010}]},
                        {"StageID": 30123031, "Level": 95, "MonsterList": [{"Monster0": 5014010}]},
                        {"StageID": 30123032, "Level": 95, "MonsterList": [{"Monster0": 5014010}]}]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        monsters = {5014010: {"name": "星啸", "icon": "Monster_5014010",
                              "weak": [], "resist": {}, "rank": ""}}
        out = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json")],
            {}, monsters,
            buffs={999: {"name": "记忆紊流", "desc": "伤害提高", "param_list": [0.3]}},
        )
        assert [n["buff"]["id"] for n in out["1033"]["nodes"]] == [999, 999, 999]

    def test_prism_tier_and_reward_from_full_target_and_imcmjhammkk(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeTierce.json"):
                return [{"PHFMCACHFIJ": 5213, "DLCKKJFMJOB": 5212,
                         "LOJCIDLKPKG": ["Fire"], "GNOOAGPBNLD": 45,
                         "OGEOMCGNNMP": [601, 602, 603], "GNGENMHNLAH": 600,
                         "IMCMJHAMMKK": 101913,
                         "EGEEJLHBALB": [{"ItemID": 122001}, {"ItemID": 1, "ItemNum": 900}]}]
            if name.endswith("ChallengeMazeConfig.json"):
                return [{"ID": 5212, "GroupID": 1033, "MazeBuffID": 999}]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        targets = {
            601: {"text": "剩余#1[i]轮以上", "param": 15, "type": "ROUNDS_LEFT"},
            602: {"text": "剩余#1[i]轮以上", "param": 30, "type": "ROUNDS_LEFT"},
            603: {"text": "不损失角色", "param": 1, "type": "DEAD_AVATAR"},
            600: {"text": "获得3星，且获胜时剩余#1[i]轮以上", "param": 33, "type": "ROUNDS_LEFT"},
        }
        out = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json")],
            targets, {},
            reward_items={101913: [{"id": 1, "num": 100}, {"id": 2, "num": 20000},
                                   {"id": 262, "num": 100}]},
        )
        entry = out["1033"]
        assert [t.get("prism") for t in entry["targets"]] == [None, None, None, True]
        assert entry["targets"][-1]["param"] == 33
        assert entry["prism_reward"] == [{"id": 1, "num": 100}, {"id": 2, "num": 20000},
                                        {"id": 262, "num": 100}]
        assert entry["rewards"] == [{"id": 122001, "num": 0}, {"id": 1, "num": 900}]
        out2 = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json")], targets, {},
        )
        assert "prism_reward" not in out2["1033"]

    def test_node3_buff_absent_when_neither_source_registered(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeStoryMazeTierce.json"):
                return [{"PHFMCACHFIJ": 20245, "DLCKKJFMJOB": 20244,
                         "LOJCIDLKPKG": ["Physical"], "HFIAAGAKFMD": [30126123]}]
            if name.endswith("ChallengeStoryMazeConfig.json"):
                return [{"ID": 20244, "GroupID": 2024, "MazeBuffID": 3031220}]
            if name.endswith("StageConfig.json"):
                return [{"StageID": 30126123, "Level": 80, "MonsterList": [{"Monster0": 5014010}]}]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        monsters = {5014010: {"name": "星啸", "icon": "Monster_5014010",
                              "weak": [], "resist": {}, "rank": ""}}
        out = eg._load_tierce(
            [("ChallengeStoryMazeTierce.json", "ChallengeStoryMazeConfig.json")],
            {}, monsters, buffs={3031359: {"name": "触技", "desc": "", "param_list": []}},
        )
        assert all("buff" not in n for n in out["2024"]["nodes"])

class TestStageBindingBuff:
    def test_reads_binding_skipping_other_keys(self):
        assert eg._stage_binding_buff({"StageConfigData": [
            {"BFLIFKBEOPJ": "_Wave", "MNDFOPKBHKP": "1"},
            {"BFLIFKBEOPJ": "_BGM", "MNDFOPKBHKP": "State_X"},
            {"BFLIFKBEOPJ": "_BindingMazeBuff", "MNDFOPKBHKP": "3110017"},
        ]}) == 3110017

    def test_missing_or_unparsable_returns_none(self):
        assert eg._stage_binding_buff({}) is None
        assert eg._stage_binding_buff({"StageConfigData": []}) is None
        assert eg._stage_binding_buff({"StageConfigData": [
            {"BFLIFKBEOPJ": "_BindingMazeBuff", "MNDFOPKBHKP": ""}]}) is None
        assert eg._stage_binding_buff({"StageConfigData": [
            {"BFLIFKBEOPJ": "_BindingMazeBuff", "MNDFOPKBHKP": "abc"}]}) is None

class TestSeasonStats:
    def test_max_of_floors_stage_countdown(self):
        recs = [
            {"ID": 1, "Floor": 1, "StageNum": 2, "ChallengeCountDown": 40,
             "DamageType1": ["Fire"], "DamageType2": ["Ice"]},
            {"ID": 10, "Floor": 10, "StageNum": 3, "ChallengeCountDown": 60,
             "DamageType1": ["Fire", "Imaginary"], "DamageType2": ["Physical"]},
        ]
        result = eg._season_stats(recs)
        assert result["floors"] == 10
        assert result["stage_num"] == 3
        assert result["countdown"] == 60
        assert result["damage_types"] == ["Fire", "Ice", "Imaginary", "Physical"]

    def test_floor_damage_ordered_with_stages(self):
        recs = [
            {"ID": 2, "Floor": 2, "DamageType1": ["Wind", "Wind", "Fire"],
             "DamageType2": ["Ice", "Quantum"]},
            {"ID": 1, "Floor": 1, "DamageType1": ["Ice"], "DamageType2": []},
        ]
        result = eg._season_stats(recs)
        assert result["floor_damage"] == [
            {"floor": 1, "stage1": ["Ice"], "stage2": []},
            {"floor": 2, "stage1": ["Wind", "Fire"], "stage2": ["Ice", "Quantum"]},
        ]
        assert result["damage_types"] == ["Fire", "Ice", "Quantum", "Wind"]

class TestSeasonFloors:
    def test_full_structure_with_floor_and_buff(self):
        recs = [
            {"ID": 2, "Floor": 2, "Name": {"Hash": 1},
             "ChallengeCountDown": 40, "MazeBuffID": 3030146,
             "DamageType1": ["Fire", "Fire"], "DamageType2": ["Ice"],
             "EventIDList1": [30123011], "EventIDList2": [30123012],
             "ChallengeTargetID": [251]},
            {"ID": 1, "Floor": 1, "Name": {"Hash": 2}, "MazeBuffID": 999},
        ]
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                               "weak": ["Physical"], "resist": {}, "rank": "Elite"},
                    2002010: {"name": "怪B", "icon": "Monster_B",
                               "weak": [], "resist": {}, "rank": ""}}
        buffs = {3030146: {"name": "记忆紊流", "desc": "伤害提高", "param_list": [0.3]}}
        targets = {251: {"text": "剩余#1[i]轮以上", "param": 10}}
        stages = {30123011: {"level": 80, "waves": [[1003010, 9999999], [1003010]]},
                  30123012: {"level": 80, "waves": [[2002010]]}}
        out = eg._season_floors(recs, monsters, buffs, targets, stages)
        assert len(out) == 2
        f1, f2 = out
        assert f1 == {"floor": 1, "name": "名2", "countdown": 0,
                      "stage1": {"damage": [], "monsters": []},
                      "stage2": {"damage": [], "monsters": []}}
        assert f2["floor"] == 2
        assert f2["name"] == "名1"
        assert f2["countdown"] == 40
        assert f2["level"] == 80
        assert f2["stage1"] == {"damage": ["Fire"], "monsters": [
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": ["Physical"], "resist": {}, "rank": "Elite", "wave": 1},
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": ["Physical"], "resist": {}, "rank": "Elite", "wave": 2}]}
        assert f2["stage2"] == {"damage": ["Ice"], "monsters": [
            {"id": "2002010", "name": "怪B", "icon": "Monster_B",
             "weak": [], "resist": {}, "rank": "", "wave": 1}]}
        assert f2["buff"] == {"id": 3030146, "name": "记忆紊流",
                               "desc": "伤害提高", "param_list": [0.3]}
        assert f2["targets"] == [{"text": "剩余#1[i]轮以上", "param": 10}]

class TestRewards:
    def test_reward_items_hcoin_merges_into_star_jade(self, monkeypatch):
        rows = {
            "RewardData.json": [
                {"RewardID": 100, "Hcoin": 60, "ItemID_1": 2, "Count_1": 20000,
                 "ItemID_2": 262, "Count_2": 100, "ItemID_3": 0, "Count_3": 0},
                {"RewardID": 101, "ItemID_1": 1, "Count_1": 5},
                {"RewardID": 102},
            ],
        }
        monkeypatch.setattr(eg, "load_json", lambda p: rows[Path(p).name])
        assert eg._load_reward_items() == {
            100: [{"id": 1, "num": 60}, {"id": 2, "num": 20000}, {"id": 262, "num": 100}],
            101: [{"id": 1, "num": 5}],
        }

    def test_reward_line_sorted_and_grouped(self, monkeypatch):
        rows = {
            "ChallengeMazeRewardLine.json": [
                {"GroupID": 2, "StarCount": 6, "RewardID": 200},
                {"GroupID": 2, "StarCount": 3, "RewardID": 100},
                {"GroupID": 1, "StarCount": 3, "RewardID": 100},
            ],
        }
        monkeypatch.setattr(eg, "load_json", lambda p: rows[Path(p).name])
        assert eg._load_reward_line("ChallengeMazeRewardLine.json") == {
            2: [(3, 100), (6, 200)],
            1: [(3, 100)],
        }

    def test_star_ladder_clips_to_season_cap_and_skips_missing_rewards(self, monkeypatch):
        rows = {
            "ChallengeGroupConfig.json": [
                {"GroupID": 1, "RewardLineGroupID": 2},
                {"GroupID": 9, "RewardLineGroupID": 99},
            ],
            "ChallengeMazeRewardLine.json": [
                {"GroupID": 2, "StarCount": 3, "RewardID": 100},
                {"GroupID": 2, "StarCount": 6, "RewardID": 200},
                {"GroupID": 2, "StarCount": 9, "RewardID": 999},
            ],
            "ChallengeMazeConfig.json": [
                {"GroupID": 1, "ChallengeTargetID": [11, 12, 13]},
                {"GroupID": 1, "ChallengeTargetID": [21, 22, 23]},
            ],
        }
        monkeypatch.setattr(eg, "load_json", lambda p: rows[Path(p).name])
        items = {100: [{"id": 1, "num": 60}], 200: [{"id": 1, "num": 80}]}
        assert eg._star_reward_ladder(
            "ChallengeGroupConfig.json", "ChallengeMazeRewardLine.json",
            "ChallengeMazeConfig.json", items,
        ) == {
            1: [{"star": 3, "items": [{"id": 1, "num": 60}]},
                {"star": 6, "items": [{"id": 1, "num": 80}]}],
        }

    def test_peak_star_rewards_keep_labeled_types_only(self, monkeypatch):
        rows = {
            "ChallengePeakReward.json": [
                {"RewardGroupID": 1, "RewardType": "MOB_PASS_REWARD", "TypeValue": 1, "RewardID": 300},
                {"RewardGroupID": 1, "RewardType": "MOB_STAR_REWARD", "TypeValue": 3, "RewardID": 100},
                {"RewardGroupID": 1, "RewardType": "BOSS_STAR_REWARD", "TypeValue": 1, "RewardID": 200},
                {"RewardGroupID": 1, "RewardType": "BOSS_COLOR_TARGET_REWARD",
                 "TypeValue": None, "RewardID": 400},
                {"RewardGroupID": 1, "RewardType": "MOB_STAR_REWARD", "TypeValue": 6, "RewardID": 999},
            ],
        }
        monkeypatch.setattr(eg, "load_json", lambda p: rows[Path(p).name])
        import textmap
        import enum_labels
        monkeypatch.setattr(textmap, "_text_map", {
            enum_labels.textmap_key("ui_label", "peakStarKnight"): "骑士星数",
            enum_labels.textmap_key("ui_label", "peakStarKing"): "王棋星数",
        })
        items = {100: [{"id": 1, "num": 60}], 200: [{"id": 226001, "num": 1}],
                 300: [{"id": 263, "num": 100}]}
        assert eg._load_peak_star_rewards(items) == {
            1: [{"kind": "king", "label": "王棋星数", "star": 1,
                 "items": [{"id": 226001, "num": 1}]},
                {"kind": "knight", "label": "骑士星数", "star": 3,
                 "items": [{"id": 1, "num": 60}]}],
        }

    def test_slice_peak_star_tiers_accumulates_by_level_order(self):
        ladder = [{"kind": "knight", "label": "骑士星数", "star": s,
                   "items": [{"id": 1, "num": s}]} for s in (3, 6, 9)]
        stars_used = 0
        picked = []
        for _ in range(3):
            tier, stars_used = eg._slice_peak_star_tiers(ladder, stars_used, 3)
            picked.append([t["star"] for t in tier])
        assert picked == [[3], [6], [9]]
        tier, _ = eg._slice_peak_star_tiers(ladder, 0, 3)
        assert tier == [{"label": "骑士星数", "star": 3, "items": [{"id": 1, "num": 3}]}]

    def test_peak_seasons_slices_star_tiers_per_level_and_口径(self, monkeypatch, setup_textmap):
        import textmap
        import enum_labels
        monkeypatch.setattr(textmap, "_text_map", {
            enum_labels.textmap_key("ui_label", "peakStarKnight"): "骑士星数",
            enum_labels.textmap_key("ui_label", "peakStarKing"): "王棋星数",
        })

        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengePeakGroupConfig.json"):
                return [{"ID": 1, "Title": {"Hash": 1}, "RewardGroupID": 7,
                         "PreLevelIDList": [101, 102, 103], "BossLevelID": 104}]
            if name.endswith("ChallengePeakConfig.json"):
                return [
                    {"ID": 101, "Title": {"Hash": 10}, "DamageType": [],
                     "EventIDList": [], "NormalTargetList": [3001, 3000], "TagList": []},
                    {"ID": 102, "Title": {"Hash": 11}, "DamageType": [],
                     "EventIDList": [], "NormalTargetList": [3001], "TagList": []},
                    {"ID": 103, "Title": {"Hash": 12}, "DamageType": [],
                     "EventIDList": [], "NormalTargetList": [], "TagList": []},
                    {"ID": 104, "Title": {"Hash": 13}, "DamageType": [],
                     "EventIDList": [], "NormalTargetList": [3003, 3004], "TagList": []},
                ]
            if name.endswith("ChallengePeakBossConfig.json"):
                return [{"ID": 104, "HardTitle": {"Hash": 2}, "BuffList": [],
                         "HardTarget": 3007, "HardEventIDList": [], "HardTagList": []}]
            if name.endswith("BattleTargetConfig.json"):
                return [
                    {"ID": 3000, "Type": "ChallengeTarget", "TargetName": {"Hash": 3}},
                    {"ID": 3001, "Type": "ChallengeTarget", "TargetName": {"Hash": 4}},
                    {"ID": 3003, "Type": "ChallengeTarget", "TargetName": {"Hash": 5}},
                    {"ID": 3004, "Type": "ChallengeTarget", "TargetName": {"Hash": 7}},
                    {"ID": 3007, "Type": "ChallengeTarget", "TargetName": {"Hash": 6}},
                ]
            if name.endswith("RewardData.json"):
                return [{"RewardID": r, "ItemID_1": 263, "Count_1": r} for r in (11, 12, 13, 21, 22)]
            if name.endswith("ChallengePeakReward.json"):
                return [
                    {"RewardGroupID": 7, "RewardType": "MOB_PASS_REWARD",
                     "TypeValue": 1, "RewardID": 11},
                    {"RewardGroupID": 7, "RewardType": "MOB_STAR_REWARD",
                     "TypeValue": 1, "RewardID": 11},
                    {"RewardGroupID": 7, "RewardType": "MOB_STAR_REWARD",
                     "TypeValue": 3, "RewardID": 12},
                    {"RewardGroupID": 7, "RewardType": "MOB_STAR_REWARD",
                     "TypeValue": 5, "RewardID": 13},
                    {"RewardGroupID": 7, "RewardType": "BOSS_STAR_REWARD",
                     "TypeValue": 1, "RewardID": 21},
                    {"RewardGroupID": 7, "RewardType": "BOSS_STAR_REWARD",
                     "TypeValue": 3, "RewardID": 22},
                ]
            return []

        monkeypatch.setattr(eg, "load_json", fake_load)
        import converters.monster_common as mc
        monkeypatch.setattr(mc, "load_json", fake_load)
        entry = eg._peak_seasons()["1"]
        k1, k2, k3, king = entry["levels"]

        assert [t["star"] for t in k1["star_rewards"]] == [1]
        assert [t["star"] for t in k2["star_rewards"]] == [3]
        assert "star_rewards" not in k3, "无目标 ⇒ 吃不到任何档，不落键"
        assert {t["label"] for t in k1["star_rewards"]} == {"骑士星数"}
        assert [t["star"] for t in king["star_rewards"]] == [1]
        assert {t["label"] for t in king["star_rewards"]} == {"王棋星数"}
        assert [t["star"] for t in king["hard"]["star_rewards"]] == [3]
        for row in entry["star_rewards"]:
            assert "kind" not in row
        for lv in entry["levels"]:
            for row in (lv.get("star_rewards") or []) + (lv.get("hard", {}).get("star_rewards") or []):
                assert "kind" not in row, "口径只在转换期分派用，不进产物"

    def test_season_floors_attaches_floor_reward(self):
        recs = [
            {"ID": 1, "Floor": 1, "Name": {"Hash": 1}, "RewardID": 101201},
            {"ID": 2, "Floor": 2, "Name": {"Hash": 2}, "RewardID": 999999},
        ]
        rewards = {101201: [{"id": 2, "num": 10000}, {"id": 261, "num": 8}]}
        out = eg._season_floors(recs, {}, {}, {}, {}, rewards=rewards)
        assert out[0]["reward"] == [{"id": 2, "num": 10000}, {"id": 261, "num": 8}]
        assert "reward" not in out[1]

    def test_season_floors_slices_star_rewards_by_layer_order(self):
        recs = [
            {"ID": 1, "Floor": 1, "Name": {"Hash": 1}, "ChallengeTargetID": [11, 12, 13]},
            {"ID": 2, "Floor": 2, "Name": {"Hash": 2}, "ChallengeTargetID": [21, 22, 23]},
        ]
        ladder = [
            {"star": s, "items": [{"id": 1, "num": s}]} for s in (3, 6, 9)
        ]
        out = eg._season_floors(recs, {}, {}, {}, {}, star_rewards=ladder)
        assert [t["star"] for t in out[0]["star_rewards"]] == [3]
        assert [t["star"] for t in out[1]["star_rewards"]] == [6]
        assert [t["star"] for f in out for t in f.get("star_rewards", [])] == [3, 6]

    def test_season_floors_star_slice_handles_multi_tier_floor(self):
        recs = [{"ID": 1, "Floor": 1, "Name": {"Hash": 1}, "ChallengeTargetID": [11, 12, 13]}]
        ladder = [{"star": s, "items": [{"id": 1, "num": s}]} for s in (1, 2, 3, 4)]
        out = eg._season_floors(recs, {}, {}, {}, {}, star_rewards=ladder)
        assert [t["star"] for t in out[0]["star_rewards"]] == [1, 2, 3]

    def test_group_seasons_attaches_rewards_and_ladder(self, monkeypatch):
        recs = [{"GroupID": 1001, "ID": 2001, "Name": {"Hash": 1}, "Floor": 1,
                 "RewardID": 101201, "ChallengeTargetID": [251]}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeMazeConfig.json", "Name", {},
            rewards={101201: [{"id": 2, "num": 10000}]},
            star_rewards={1001: [{"star": 1, "items": [{"id": 1, "num": 60}]}]},
        )
        entry = out["1001"]
        assert entry["floor_details"][0]["reward"] == [{"id": 2, "num": 10000}]
        assert entry["star_rewards"] == [{"star": 1, "items": [{"id": 1, "num": 60}]}]
        assert [t["star"] for t in entry["floor_details"][0]["star_rewards"]] == [1]
        assert "star_rewards" not in eg._group_seasons(
            "ChallengeMazeConfig.json", "Name", {},
        )["1001"]

class TestSeasonExtras:
    def test_monsters_ordered_dedup(self):
        recs = [
            {"ID": 1, "EventIDList1": [30123011], "EventIDList2": [30123012]},
            {"ID": 2, "EventIDList1": [30123011]},
            {"ID": 3, "EventIDList1": [99999999]},
        ]
        stages = {30123011: {"level": 80, "waves": [[1003010], [1003010]]},
                  30123012: {"level": 80, "waves": [[2002010]]}}
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                               "weak": [], "resist": {}, "rank": ""},
                    2002010: {"name": "怪B", "icon": "Monster_B",
                               "weak": [], "resist": {}, "rank": ""}}
        out = eg._season_monsters(recs, monsters, stages)
        assert out == [
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": [], "resist": {}, "rank": ""},
            {"id": "2002010", "name": "怪B", "icon": "Monster_B",
             "weak": [], "resist": {}, "rank": ""},
        ]

class TestGroupSeasons:
    def test_merges_schedule_stats_and_extras(self, monkeypatch):
        recs = [
            {"GroupID": 1001, "ID": 2002, "Name": {"Hash": 1}, "Floor": 2,
             "DamageType1": ["Fire"], "EventIDList1": [30123011],
             "ChallengeTargetID": [251]},
            {"GroupID": 1001, "ID": 2001, "Name": {"Hash": 2}, "Floor": 1,
             "ChallengeCountDown": 40},
        ]
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeConfig.json"):
                return recs
            if name.endswith("StageConfig.json"):
                return [{"StageID": 30123011, "Level": 95,
                         "MonsterList": [{"Monster0": 1003010}]}]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        out = eg._group_seasons(
            "ChallengeMazeConfig.json", "Name",
            {"1001": ("2023-09-04 04:00:00", "2023-09-18 04:00:00")},
            buff_map={1001: [3030146]},
            buffs={3030146: {"name": "记忆紊流", "desc": "伤害提高 #1[i]%", "param_list": [0.3]},
                   3030147: {"name": "追加攻击", "desc": "积累 #1[i] 点战意值", "param_list": [8]}},
            monsters={1003010: {"name": "虚卒", "icon": "Monster_1003010",
                                 "weak": ["Physical"], "resist": {}, "rank": "Elite"}},
            targets={251: {"text": "剩余#1[i]轮以上", "param": 10, "type": "ROUNDS_LEFT"}},
            sub_buffs={1001: [3030147]},
        )
        entry = out["1001"]
        assert entry["zh"] == "名2"
        assert entry["live_begin"] == "2023-09-04 04:00:00"
        assert entry["live_end"] == "2023-09-18 04:00:00"
        assert entry["floors"] == 2
        assert entry["countdown"] == 40
        assert entry["damage_types"] == ["Fire"]
        assert entry["floor_damage"] == [{"floor": 2, "stage1": ["Fire"], "stage2": []}]
        assert entry["buffs"] == [{"id": 3030146, "name": "记忆紊流", "desc": "伤害提高 #1[i]%", "param_list": [0.3]}]
        assert entry["sub_buffs"] == [{"id": 3030147, "name": "追加攻击", "desc": "积累 #1[i] 点战意值", "param_list": [8]}]
        assert entry["monsters"] == [{"id": "1003010", "name": "虚卒", "icon": "Monster_1003010",
                                       "weak": ["Physical"], "resist": {}, "rank": "Elite"}]
        assert entry["final_monsters"] == [{"id": "1003010", "name": "虚卒",
                                             "icon": "Monster_1003010",
                                             "weak": ["Physical"], "resist": {},
                                             "rank": "Elite"}]
        assert entry["targets"] == [{"text": "剩余#1[i]轮以上", "param": 10, "type": "ROUNDS_LEFT"}]
        assert entry["floor_details"] == [
            {"floor": 1, "name": "名2", "countdown": 40,
             "stage1": {"damage": [], "monsters": []},
             "stage2": {"damage": [], "monsters": []}},
            {"floor": 2, "name": "名1", "countdown": 0,
             "level": 95,
             "stage1": {"damage": ["Fire"], "monsters": [
                 {"id": "1003010", "name": "虚卒", "icon": "Monster_1003010",
                  "weak": ["Physical"], "resist": {}, "rank": "Elite", "wave": 1}]},
             "stage2": {"damage": [], "monsters": []},
             "targets": [{"text": "剩余#1[i]轮以上", "param": 10, "type": "ROUNDS_LEFT"}]},
        ]

    def test_story_turn_limit_overrides_countdown(self, monkeypatch):
        recs = [{"GroupID": 2001, "ID": 20011, "Name": {"Hash": 1}, "Floor": 1}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeStoryMazeConfig.json", "Name", {},
            buff_map={2001: [3031301]},
            buffs={3031301: {"name": "增益", "desc": "", "param_list": []}},
            turns={"2001": 6},
        )
        assert out["2001"]["countdown"] == 6
        assert out["2001"]["buffs"] == [{"id": 3031301, "name": "增益", "desc": "", "param_list": []}]

    def test_no_schedule_keeps_dates_empty(self, monkeypatch):
        recs = [{"GroupID": 900, "ID": 1, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons("ChallengeMazeConfig.json", "Name", {})
        entry = out["900"]
        assert entry["live_begin"] == ""
        assert entry["live_end"] == ""
        assert entry["damage_types"] == []
        assert entry["buffs"] == []
        assert entry["monsters"] == []
        assert entry["final_monsters"] == []
        assert entry["targets"] == []

    def test_group_name_priority(self, monkeypatch):
        recs = [{"GroupID": 3020, "ID": 30201, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeBossMazeConfig.json", "Name", {},
            group_names={3020: "兵锋骑士"},
        )
        assert out["3020"]["zh"] == "兵锋骑士"

    def test_name_fallback_when_no_group_name(self, monkeypatch):
        recs = [{"GroupID": 900, "ID": 1, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons("ChallengeMazeConfig.json", "Name", {})
        assert out["900"]["zh"] == "名1"

    def test_permanent_flag(self, monkeypatch):
        recs = [
            {"GroupID": 100, "ID": 1, "Name": {"Hash": 1}},
            {"GroupID": 1001, "ID": 2, "Name": {"Hash": 2}},
        ]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeMazeConfig.json", "Name", {},
            permanent={100},
        )
        assert out["100"].get("permanent") is True
        assert "permanent" not in out["1001"]

    def test_test_period_flag(self, monkeypatch):
        recs = [
            {"GroupID": 101, "ID": 1, "Name": {"Hash": 1}},
            {"GroupID": 110, "ID": 2, "Name": {"Hash": 2}},
        ]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeMazeConfig.json", "Name", {},
            test_period={101},
        )
        assert out["101"].get("test") is True
        assert "test" not in out["110"]

class TestPeakSeasons:
    def test_battle_targets_filtered(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 3000, "Type": "ChallengeTarget", "TargetName": {"Hash": 1},
             "TargetParam": 4},
            {"ID": 3001, "Type": "Other", "TargetName": {"Hash": 2},
             "TargetParam": 9},
            {"ID": 3002, "Type": "ChallengeTarget", "TargetName": {}},
        ])
        out = eg._load_battle_targets()
        assert out == {3000: {"text": "名1", "param": 4}}

    def test_stage_monsters_by_id_only_wanted(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"StageID": 30501011, "Level": 95,
             "StageConfigData": [{"BFLIFKBEOPJ": "_BindingMazeBuff", "MNDFOPKBHKP": "3110017"}],
             "MonsterList": [{"Monster0": 3012020, "Monster1": 3013010},
                              {"Monster0": 3012020, "Monster1": 3004012}]},
            {"StageID": 999999, "Level": 10, "MonsterList": [{"Monster0": 1}]},
            {"StageID": 30501012, "Level": 0, "MonsterList": []},
        ])
        out = eg._load_stage_monsters_by_id({30501011, 30501012})
        assert out[30501011] == {"level": 95, "maze_buff": 3110017,
                                 "waves": [[3012020, 3013010], [3012020, 3004012]]}
        assert out[30501012] == {"level": 0, "waves": [], "maze_buff": None}
        assert 999999 not in out

    def test_peak_level_node_full_monsters(self, monkeypatch):
        monsters = {1003010: {"name": "名30", "icon": "Monster_1003010", "weak": ["Physical"],
                              "intro": "图鉴介绍", "skills": [{"name": "技名", "tag": "技标"}]}}
        stages = {30501011: {"level": 95, "maze_buff": None, "waves": [[1003010]]}}
        rec = {"ID": 101, "Title": {"Hash": 1}, "DamageType": ["Fire"],
               "EventIDList": [30501011], "NormalTargetList": [], "TagList": []}
        monkeypatch.setattr(eg, "resolve_text", lambda _h: "名")
        full = eg._peak_level_node(rec, stages, monsters, {}, {}, "knight", None, None, True)
        assert full["monsters"][0]["intro"] == "图鉴介绍"
        assert full["monsters"][0]["skills"] == [{"name": "技名", "tag": "技标"}]
        light = eg._peak_level_node(rec, stages, monsters, {}, {}, "knight", None, None)
        assert "intro" not in light["monsters"][0]
        assert "skills" not in light["monsters"][0]

    def test_monster_out_skill_keeps_phase_list(self):
        monsters = {403501001: {
            "name": "反造物主", "icon": "I", "skills": [
                {"name": "阶段1专有", "tag": "技标", "phase_list": [1]},
                {"name": "末阶段", "tag": "技标", "phase_list": [2, 3]},
                {"name": "无门控", "tag": "技标"},
            ]}}
        out = eg._monster_out(403501001, monsters, full=True)
        assert out["skills"] == [
            {"name": "阶段1专有", "tag": "技标", "phase_list": [1]},
            {"name": "末阶段", "tag": "技标", "phase_list": [2, 3]},
            {"name": "无门控", "tag": "技标"},
        ]

    def test_lean_monster_strips_wave_and_full_fields(self):
        m = {"id": "1", "name": "甲", "icon": "I", "wave": 2,
             "intro": "介绍", "skills": [{"name": "技"}], "rank": "Elite"}
        assert eg._lean_monster(m) == {"id": "1", "name": "甲", "icon": "I", "rank": "Elite"}

    def test_peak_seasons_full_structure(self, monkeypatch, setup_textmap):
        mc = setup_textmap
        """期 = 3 骑士 + 1 王棋（含绝境变体）；全关卡合并 damage/monsters/buffs。"""
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengePeakGroupConfig.json"):
                return [{"ID": 1, "Title": {"Hash": 1},
                         "PreLevelIDList": [101, 102, 103], "BossLevelID": 104,
                         "ThemeIconPicPath":
                         "SpriteOutput/ChallengePeak/ChallengePeakIcon_4001.png"}]
            if name.endswith("ChallengePeakConfig.json"):
                return [
                    {"ID": 101, "Title": {"Hash": 10}, "DamageType": ["Fire"],
                     "EventIDList": [30501011], "NormalTargetList": [3001, 3000],
                     "TagList": [3033001]},
                    {"ID": 102, "Title": {"Hash": 11}, "DamageType": ["Ice"],
                     "EventIDList": [30501012], "NormalTargetList": [3001],
                     "TagList": []},
                    {"ID": 103, "Title": {"Hash": 12}, "DamageType": [],
                     "EventIDList": [], "NormalTargetList": [], "TagList": []},
                    {"ID": 104, "Title": {"Hash": 13}, "DamageType": ["Quantum"],
                     "EventIDList": [30501021], "NormalTargetList": [3003],
                     "TagList": [3033003]},
                ]
            if name.endswith("ChallengePeakBossConfig.json"):
                return [{"ID": 104, "HardTitle": {"Hash": 2},
                         "BuffList": [3033006], "HardTarget": 3007,
                         "HardEventIDList": [30501022],
                         "HardTagList": [3033010]}]
            if name.endswith("BattleTargetConfig.json"):
                return [
                    {"ID": 3000, "Type": "ChallengeTarget", "TargetName": {"Hash": 3}},
                    {"ID": 3001, "Type": "ChallengeTarget", "TargetName": {"Hash": 4},
                     "TargetParam": 4},
                    {"ID": 3003, "Type": "ChallengeTarget", "TargetName": {"Hash": 5},
                     "TargetParam": 6},
                    {"ID": 3007, "Type": "ChallengeTarget", "TargetName": {"Hash": 6},
                     "TargetParam": 2},
                ]
            if name.endswith("StageConfig.json"):
                return [
                    {"StageID": 30501011, "Level": 95,
                     "MonsterList": [{"Monster0": 1003010}]},
                    {"StageID": 30501021, "Level": 100,
                     "MonsterList": [{"Monster0": 2002010}]},
                    {"StageID": 30501022, "Level": 120,
                     "MonsterList": [{"Monster0": 3003010}]},
                ]
            if name.endswith("MazeBuff.json"):
                return [
                    {"ID": 3033001, "BuffName": {"Hash": 20},
                     "BuffDesc": {"Hash": 24}, "ParamList": [{"Value": 500}]},
                    {"ID": 3033003, "BuffName": {"Hash": 21}},
                    {"ID": 3033006, "BuffName": {"Hash": 22}},
                    {"ID": 3033010, "BuffName": {"Hash": 23},
                     "BuffDesc": {"Hash": 25}, "ParamList": [{"Value": 2}]},
                ]
            if name.endswith("MonsterTemplateConfig.json"):
                return [
                    {"MonsterTemplateID": 1003010, "MonsterName": {"Hash": 30},
                     "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_1003010.png",
                     "Rank": "Elite", "MonsterCampID": 3, "StanceBase": {"Value": 240}},
                    {"MonsterTemplateID": 2002010, "MonsterName": {"Hash": 31},
                     "ManikinImagePath": "", "Rank": "MinionLv2"},
                    {"MonsterTemplateID": 3003010, "MonsterName": {"Hash": 32},
                     "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_3003010.png",
                     "Rank": "BigBoss", "MonsterCampID": 3, "StanceBase": {"Value": 720}},
                ]
            if name.endswith("MonsterConfig.json"):
                return [
                    {"MonsterID": 1003010, "MonsterTemplateID": 1003010,
                     "StanceWeakList": ["Physical"], "DamageTypeResistance": [
                         {"DamageType": "Fire", "Value": {"Value": 0.2}}],
                     "MonsterIntroduction": {"Hash": 50},
                     "SkillList": [100301001]},
                    {"MonsterID": 2002010, "MonsterTemplateID": 2002010,
                     "StanceWeakList": [], "DamageTypeResistance": []},
                    {"MonsterID": 3003010, "MonsterTemplateID": 3003010,
                     "StanceWeakList": ["Quantum"], "DamageTypeResistance": [],
                     "SkillList": [300301001]},
                ]
            if name.endswith("MonsterCamp.json"):
                return [{"ID": 3, "Name": {"Hash": 40}}]
            if name.endswith("MonsterSkillConfig.json"):
                return [
                    {"SkillID": 100301001, "SkillName": {"Hash": 41},
                     "SkillTag": {"Hash": 42}},
                    {"SkillID": 300301001, "SkillName": {"Hash": 43}, "SkillTag": {}},
                ]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        monkeypatch.setattr(mc, "load_json", fake_load)
        out = eg._peak_seasons()
        assert set(out.keys()) == {"1"}
        entry = out["1"]
        assert entry["zh"] == "名1"
        assert entry["damage_types"] == ["Fire", "Ice", "Quantum"]
        assert len(entry["levels"]) == 4
        k1, k2, k3, king = entry["levels"]
        assert k1["kind"] == "knight" and k1["name"] == "名10"
        assert k1["damage"] == ["Fire"]
        assert k1["level"] == 95
        assert k1["monsters"] == [{"id": "1003010", "name": "名30",
                                    "icon": "Monster_1003010", "weak": ["Physical"],
                                    "resist": {"Fire": 0.2}, "rank": "Elite",
                                    "camp": "名40", "stance": 240, "wave": 1}]
        assert k1["targets"] == [{"text": "名4", "param": 4},
                                  {"text": "名3", "param": None}]
        assert k1["tags"] == [{"id": 3033001, "name": "名20", "desc": "名24",
                               "param_list": [500]}]
        assert "level" not in k2 and k2["monsters"] == []
        assert k3["damage"] == [] and k3["targets"] == [] and k3["tags"] == []
        assert king["kind"] == "king" and king["name"] == "名13"
        assert king["level"] == 100
        assert king["buffs"] == [{"id": 3033006, "name": "名22",
                                   "desc": "", "param_list": [], "icon": ""}]
        hard = king["hard"]
        assert hard["name"] == "名2" and hard["level"] == 120
        assert hard["monsters"] == [{"id": "3003010", "name": "名32",
                                      "icon": "Monster_3003010", "weak": ["Quantum"],
                                      "resist": {}, "rank": "BigBoss", "camp": "名40",
                                      "stance": 720, "wave": 1}]
        assert hard["targets"] == [{"text": "名6", "param": 2}]
        assert hard["tags"] == [{"id": 3033010, "name": "名23", "desc": "名25",
                                 "param_list": [2]}]
        assert entry["monsters"] == [
            {"id": "1003010", "name": "名30", "icon": "Monster_1003010",
             "weak": ["Physical"], "resist": {"Fire": 0.2}, "rank": "Elite",
             "camp": "名40", "stance": 240},
            {"id": "2002010", "name": "名31", "icon": "",
             "weak": [], "resist": {}, "rank": "MinionLv2",
             "camp": ""},
        ]
        assert "stance" not in entry["monsters"][1], "缺 StanceBase ⇒ 不落键（0 是伪造值）"
        assert entry["final_monsters"] == [
            {"id": "2002010", "name": "名31", "icon": "",
             "weak": [], "resist": {}, "rank": "MinionLv2",
             "camp": ""},
        ]
        assert entry["buffs"] == [{"id": 3033006, "name": "名22",
                                    "desc": "", "param_list": [], "icon": ""}]
        assert entry["arts"] == {
            "tab": "SpriteOutput/ChallengePeak/ChallengePeakIcon_4001.png"}

class TestGroupArts:
    def test_load_group_arts_maps_all_fields(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 2001,
             "TabPicPath": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2001.png",
             "TabPicSelectPath": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2001.png",
             "ThemePicPath": "SpriteOutput/DailyMission/Banner/ChallengeThemeBanner_2001.png",
             "ThemeToastPicPath": "SpriteOutput/ChallengeTheme/ThemePic/ChallengeThemePic_2001.png",
             "ThemeIconPicPath": "SpriteOutput/ChallengeTheme/ThemeIcon/ChallengeThemeIcon_2001.png",
             "ThemePosterBgPicPath": "SpriteOutput/ChallengeTheme/ThemeBg/ChallengeThemeBg_2001.png",
             "ThemePosterTabPicPath": "SpriteOutput/Quest/TabIcon/BtnChallengeStoryAlternation_2001.png",
             "HandBookPanelBannerPath": "SpriteOutput/DailyMission/Banner/ChallengePeakPanelBanner_4002.png"},
            {"GroupID": 2002, "TabPicPath": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2002.png"},
        ])
        out = eg._load_group_arts("ChallengeStoryGroupExtra.json")
        assert out[2001] == {
            "tab": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2001.png",
            "tab_select": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2001.png",
            "theme_banner": "SpriteOutput/DailyMission/Banner/ChallengeThemeBanner_2001.png",
            "theme_toast": "SpriteOutput/ChallengeTheme/ThemePic/ChallengeThemePic_2001.png",
            "theme_icon": "SpriteOutput/ChallengeTheme/ThemeIcon/ChallengeThemeIcon_2001.png",
            "theme_bg": "SpriteOutput/ChallengeTheme/ThemeBg/ChallengeThemeBg_2001.png",
            "poster_tab": "SpriteOutput/Quest/TabIcon/BtnChallengeStoryAlternation_2001.png",
            "handbook_banner": "SpriteOutput/DailyMission/Banner/ChallengePeakPanelBanner_4002.png",
        }
        assert out[2002] == {
            "tab": "SpriteOutput/TabIcon/Abyss/ChallengeThemeTabIcon_2002.png"}

    def test_merge_arts_complements_same_group(self):
        merged = eg._merge_arts(
            {2001: {"tab": "A.png"}, 2002: {"tab": "B.png"}},
            {2001: {"theme_icon": "C.png"}},
        )
        assert merged == {
            2001: {"tab": "A.png", "theme_icon": "C.png"},
            2002: {"tab": "B.png"},
        }

    def test_maze_arts_merges_group_extra(self, monkeypatch):
        def fake_load(path):
            if "GroupExtra" in str(path):
                return [{"GroupID": 100,
                         "ThemePosterBgPicPath": "SpriteOutput/Abyss/2D_SceneBg/AbyssSenceBg_01.png"}]
            return [{"GroupID": 100, "TabPicPath": "SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png"}]
        monkeypatch.setattr(eg, "load_json", fake_load)
        merged = eg._merge_arts(
            eg._load_group_arts("ChallengeGroupConfig.json"),
            eg._load_group_arts("ChallengeMazeGroupExtra.json"),
        )
        assert merged[100] == {
            "tab": "SpriteOutput/UI/Abyss/Process/TypeIcon/AbyssSwitchW01_Off.png",
            "theme_bg": "SpriteOutput/Abyss/2D_SceneBg/AbyssSenceBg_01.png",
        }

class TestModeDefaultIcons:
    def test_load_mode_default_icons_maps_three_modes(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ChallengeGroupType": "Memory",
             "TabImgPath": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png"},
            {"ChallengeGroupType": "Story",
             "TabImgPath": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png"},
            {"ChallengeGroupType": "Boss",
             "TabImgPath": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg3.png"},
            {"ChallengeGroupType": "Peak", "TabImgPath": ""},
            {"ChallengeGroupType": "Unknown"},
        ])
        out = eg._load_mode_default_icons()
        assert out == {
            "maze": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg1.png",
            "story": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg2.png",
            "boss": "SpriteOutput/UI/ChallengeBoss/ChallengeBossQuestTabImg3.png",
        }

    def test_attach_default_icon_merges_and_skips(self):
        entries = {
            "1": {"zh": "A", "arts": {"tab": "x"}},
            "2": {"zh": "B"},
        }
        eg._attach_default_icon(entries, None)
        assert "default" not in entries["1"]["arts"]
        eg._attach_default_icon(entries, "SpriteOutput/UI/ChallengeBoss/Img1.png")
        assert entries["1"]["arts"]["default"] == "SpriteOutput/UI/ChallengeBoss/Img1.png"
        assert entries["2"]["arts"] == {"default": "SpriteOutput/UI/ChallengeBoss/Img1.png"}

class TestCatalogLight:
    def test_season_catalog_strips_heavy_fields(self):
        entry = {
            "id": "2001", "zh": "游辞漫说",
            "live_begin": "2023-11-20 04:00:00", "live_end": "2023-12-11 04:00:00",
            "permanent": True, "test": True,
            "damage_types": ["Fire", "Ice", "Thunder", "Wind", "Quantum", "Physical", "Imaginary"],
            "floor_details": [{"floor": 1, "stage1": {"damage": ["Fire", "Fire"]},
                               "stage2": {"damage": ["Ice"]}}],
            "buffs": [{"id": 1, "name": "增益", "desc": "长描述", "param_list": [1], "icon": "x"}],
            "monsters": [{"id": "1", "name": "怪", "icon": "M", "weak": [], "resist": {},
                          "rank": "Elite", "camp": "c", "intro": "介绍", "skills": []}],
            "final_monsters": [{"id": "1", "name": "怪", "icon": "M", "weak": [], "resist": {},
                                "rank": "Elite", "camp": "c", "intro": "介绍", "skills": []}],
            "tierce": {"id": 9, "damage_types": ["Wind"], "countdown": 30,
                       "targets": [], "monsters": [], "nodes": []},
            "levels": [{"kind": "knight", "name": "x", "damage": [], "monsters": []},
                        {"kind": "king", "name": "y"}],
        }
        out = egc._season_catalog(entry)
        assert out["id"] == "2001" and out["zh"] == "游辞漫说"
        assert out["permanent"] is True and out["test"] is True
        assert "damage_types" not in out
        assert "floor_details" not in out
        assert out["buffs"] == [{"id": 1, "name": "增益"}]
        assert out["monsters"][0] == {"id": "1", "name": "怪", "icon": "M", "weak": [],
                                       "resist": {}, "rank": "Elite", "camp": "c"}
        assert "intro" not in out["final_monsters"][0] and "skills" not in out["final_monsters"][0]
        assert out["tierce"] == {"id": 9, "damage_types": ["Wind"], "countdown": 30}
        assert "nodes" not in out["tierce"]
        assert out["levels"] == [{"kind": "knight"}, {"kind": "king"}]

    def test_season_catalog_keeps_pollution_summary(self):
        entry = {"id": "3021", "zh": "支配遗忘", "pollution": {"count": 2, "levels": [2, 3]}}
        assert egc._season_catalog(entry)["pollution"] == {"count": 2, "levels": [2, 3]}
        assert "pollution" not in egc._season_catalog({"id": "1", "zh": "无污染"})


class TestPollution:
    def test_load_invasion_index_dedupes_monster_ids(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"StageID": 420503, "InvasionID": 2, "MonsterInvasionList": [
                {"DBLDCKODNEN": 202206017}, {"DBLDCKODNEN": 202206017},
                {"DBLDCKODNEN": 202303203},
            ]},
            {"StageID": 1, "InvasionID": 3},
            {"InvasionID": 1, "MonsterInvasionList": [{"DBLDCKODNEN": 1}]},
        ])
        assert eg._load_invasion_index() == {
            420503: {"level": 2, "monster_ids": [202206017, 202303203]},
            1: {"level": 3, "monster_ids": []},
        }

    def test_stage_invasion_only_registered_monsters(self):
        invasions = {420503: {"level": 2, "monster_ids": [202206017, 9000]}}
        monsters = {202206017: {"name": "器元士", "icon": "Monster_2022060",
                                "weak": [], "resist": {}, "rank": "MinionLv2"}}
        assert eg._stage_invasion([420503], invasions, monsters)["monsters"] == [
            {"id": "202206017", "name": "器元士", "icon": "Monster_2022060",
             "weak": [], "resist": {}, "rank": "MinionLv2"},
        ]
        assert eg._stage_invasion([999], invasions, monsters) is None

    def test_stage_invasion_keeps_level_when_no_monster_registered(self):
        invasions = {1: {"level": 3, "monster_ids": [9000]}}
        assert eg._stage_invasion([1], invasions, {}) == {"level": 3, "stage_id": 1}

    def test_season_floors_attaches_invasion_per_half(self):
        recs = [{"ID": 1, "Floor": 3, "Name": {"Hash": 1},
                 "EventIDList1": [420503], "EventIDList2": [420513]}]
        stages = {420503: {"level": 80, "waves": [[1003010]]},
                  420513: {"level": 80, "waves": [[1003010]]}}
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                              "weak": [], "resist": {}, "rank": "Elite"}}
        out = eg._season_floors(
            recs, monsters, {}, {}, stages,
            invasions={420503: {"level": 2, "monster_ids": [1003010]}})
        assert out[0]["stage1"]["invasion"] == {
            "level": 2, "stage_id": 420503,
            "monsters": [{"id": "1003010", "name": "怪A", "icon": "Monster_A",
                          "weak": [], "resist": {}, "rank": "Elite"}],
        }
        assert "invasion" not in out[0]["stage2"]
        assert "invasion" not in eg._season_floors(recs, monsters, {}, {}, stages)[0]["stage1"]

    def test_apply_pollution_dedupes_by_stage_id(self):
        entry = {
            "floor_details": [
                {"floor": 12, "stage1": {"invasion": {"level": 3, "stage_id": 30125121}},
                 "stage2": {}},
            ],
            "tierce": {"nodes": [
                {"idx": 1, "invasion": {"level": 3, "stage_id": 30125121}},
                {"idx": 2, "invasion": {"level": 2, "stage_id": 30125122}},
                {"idx": 3, "invasion": {"level": 3, "stage_id": 30126123}},
            ]},
        }
        eg._apply_pollution(entry)
        assert entry["pollution"] == {"count": 3, "levels": [2, 3]}

    def test_apply_pollution_omitted_without_nodes(self):
        entry = {"floor_details": [{"floor": 1, "stage1": {}, "stage2": {}}]}
        eg._apply_pollution(entry)
        assert "pollution" not in entry

    def test_peak_level_node_and_season_summary(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"StageID": 30509012, "InvasionID": 2,
             "MonsterInvasionList": [{"DBLDCKODNEN": 1003010}]},
        ])
        invasions = eg._load_invasion_index()
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                              "weak": [], "resist": {}, "rank": "Elite"}}
        rec = {"ID": 902, "Title": {"Hash": 1}, "DamageType": ["Fire"],
               "EventIDList": [30509012], "NormalTargetList": [], "TagList": []}
        stages = {30509012: {"level": 95, "waves": [[1003010]]}}
        node = eg._peak_level_node(rec, stages, monsters, {}, {}, "knight", invasions)
        assert node["invasion"] == {
            "level": 2, "stage_id": 30509012,
            "monsters": [{"id": "1003010", "name": "怪A", "icon": "Monster_A",
                          "weak": [], "resist": {}, "rank": "Elite"}]}
        entry = {"levels": [node]}
        eg._apply_pollution(entry)
        assert entry["pollution"] == {"count": 1, "levels": [2]}

    def test_tierce_node_carries_invasion(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeTierce.json"):
                return [{"PHFMCACHFIJ": 5513, "DLCKKJFMJOB": 5512,
                         "HFIAAGAKFMD": [30126123], "JEBMBCLBIOI": []}]
            if name.endswith("ChallengeMazeConfig.json"):
                return [{"ID": 5512, "GroupID": 1036,
                         "EventIDList1": [30126121], "EventIDList2": [30126122]}]
            if name.endswith("StageConfig.json"):
                return [{"StageID": 30126123, "Level": 92, "MonsterList": [{"Monster0": 1003010}]}]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                              "weak": [], "resist": {}, "rank": "Elite"}}
        out = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json")],
            {}, monsters,
            {30126123: {"level": 3, "monster_ids": [1003010]}},
        )
        nodes = out["1036"]["nodes"]
        assert nodes[2]["invasion"] == {
            "level": 3, "stage_id": 30126123,
            "monsters": [{"id": "1003010", "name": "怪A", "icon": "Monster_A",
                          "weak": [], "resist": {}, "rank": "Elite"}]}
        assert "invasion" not in nodes[0]
        assert "buff" not in nodes[2]
        entry = {"tierce": out["1036"]}
        eg._apply_pollution(entry)
        assert entry["pollution"] == {"count": 1, "levels": [3]}


class TestSummons:
    def test_load_summon_index_keeps_only_summoners(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"MonsterID": 202401603, "SummonIDList": [202206017, 202303203, 202206017]},
            {"MonsterID": 202206017, "SummonIDList": []},
            {"SummonIDList": [1]},
        ])
        assert eg._load_summon_index() == {202401603: [202206017, 202303203]}

    def test_summon_out_light_shape(self):
        monsters = {
            202206017: {"name": "器元士", "icon": "Monster_2022060",
                        "weak": [], "resist": {}, "rank": "MinionLv2"},
            202303204: {"name": "仙人天女", "icon": "Monster_2023030",
                        "_tpl": 2023032, "weak": [], "resist": {}},
        }
        assert eg._summon_out(202206017, monsters) == {
            "id": "202206017", "name": "器元士", "icon": "Monster_2022060"}
        assert eg._summon_out(202303204, monsters, 2) == {
            "id": "202303204", "tpl": "2023032", "name": "仙人天女",
            "icon": "Monster_2023030", "polluted": 2}

    def test_polluted_index_is_instance_level(self):
        inv = {"level": 2, "monsters": [{"id": "202206017"}, {"id": 202303203}]}
        assert eg._polluted_index(inv) == {202206017: 2, 202303203: 2}
        assert eg._polluted_index(None) == {}
        assert eg._polluted_index({"level": 0, "monsters": [{"id": "1"}]}) == {}
        assert eg._polluted_index({"monsters": [{"id": "1"}]}) == {}

    def test_monster_summons_skips_unregistered(self):
        monsters = {
            202401603: {"name": "不老仙", "icon": "Monster_B"},
            202206017: {"name": "器元士", "icon": "Monster_2022060"},
            202303203: {"name": "仙人天女", "icon": "Monster_2023030"},
        }
        summons = {202401603: [202206017, 9000, 202303203]}
        out = eg._monster_summons(202401603, monsters, summons, {202206017: 2})
        assert [m["id"] for m in out] == ["202206017", "202303203"]
        assert [m.get("polluted") for m in out] == [2, None]
        assert eg._monster_summons(202206017, monsters, summons) == []

    def test_stage_waves_monsters_nests_by_summoner(self):
        stages = {420503: {"level": 80, "waves": [[202401603, 1003010], [202401603]]}}
        monsters = {
            202401603: {"name": "不老仙", "icon": "Monster_B"},
            1003010: {"name": "银鬃尉官", "icon": "Monster_A"},
            1002040: {"name": "银鬃近卫", "icon": "Monster_C"},
            202206017: {"name": "器元士", "icon": "Monster_2022060"},
        }
        summons = {202401603: [202206017, 1002040], 1003010: [1002040]}
        invasion = {"level": 2, "stage_id": 420503,
                    "monsters": [{"id": "202206017"}]}
        out = eg._stage_waves_monsters([420503], stages, monsters, summons=summons,
                                      invasion=invasion)
        assert [[m["id"] for m in e.get("summons", [])] for e in out] == [
            ["202206017", "1002040"], ["1002040"], ["202206017", "1002040"]]
        assert out[0]["summons"][0]["polluted"] == 2
        assert "polluted" not in out[0]["summons"][1]
        assert all("summons" not in e for e in eg._stage_waves_monsters(
            [420503], stages, monsters))

    def test_season_floors_nests_summons_per_enemy(self):
        recs = [{"ID": 1, "Floor": 3, "Name": {"Hash": 1},
                 "EventIDList1": [420503], "EventIDList2": [420513]}]
        stages = {420503: {"level": 80, "waves": [[202401603]]},
                  420513: {"level": 80, "waves": [[1003010]]}}
        monsters = {
            202401603: {"name": "首领", "icon": "Monster_B"},
            202206017: {"name": "器元士", "icon": "Monster_2022060"},
            1003010: {"name": "怪A", "icon": "Monster_A"},
        }
        out = eg._season_floors(
            recs, monsters, {}, {}, stages,
            invasions={420503: {"level": 2, "monster_ids": [202206017]}},
            summons={202401603: [202206017], 1003010: []})
        assert out[0]["stage1"]["monsters"][0]["summons"] == [
            {"id": "202206017", "name": "器元士", "icon": "Monster_2022060", "polluted": 2}]
        assert "summons" not in out[0]["stage1"]
        assert "summons" not in out[0]["stage2"]["monsters"][0]

    def test_peak_level_node_carries_summons(self):
        rec = {"ID": 902, "Title": {"Hash": 1}, "DamageType": ["Fire"],
               "EventIDList": [30509012], "NormalTargetList": [], "TagList": []}
        stages = {30509012: {"level": 95, "waves": [[5023010]]}}
        monsters = {5023010: {"name": "王棋", "icon": "Monster_K"},
                    5013010: {"name": "骑士", "icon": "Monster_C"}}
        node = eg._peak_level_node(rec, stages, monsters, {}, {}, "knight", None,
                                   {5023010: [5013010]})
        assert node["monsters"][0]["summons"] == [
            {"id": "5013010", "name": "骑士", "icon": "Monster_C"}]
        assert "summons" not in node


class TestEnemyCardHp:
    CURVE = {"3": {"95": {"hp": 294.42172}}}
    ELITE = {"1": {"hp": 1.0}, "2": {"hp": 1.7}, "164": {"hp": 6.5}}

    @staticmethod
    def _info() -> dict:
        return {"name": "甲", "icon": "I", "weak": [], "resist": {}, "rank": "Elite",
                "camp": "", "stance": 60,
                "stats": {"hp": 102.3, "atk": 1, "def": 1, "speed": 100},
                "stat_ratio": {"hp": 1}, "elite_group": 2}

    def test_single_hp_value_without_chain_inputs(self):
        out = eg._monster_out(
            1, {1: self._info()},
            hp_ctx={"level": 95, "level_group": 3, "elite_group": 164},
            curve=self.CURVE, elite_groups=self.ELITE)
        assert out["hp"] == 332818.7, "自身组 1.7 × 关卡组 6.5 叠乘（与 monster_common 字面量同值）"
        assert "stat_ratio" not in out and "elite_group" not in out and "stats" not in out

    def test_absent_context_leaves_no_hp_key(self):
        info = self._info()
        assert "hp" not in eg._monster_out(1, {1: info})
        assert "hp" not in eg._monster_out(1, {1: info}, hp_ctx={"level": 0})
        assert "hp" not in eg._monster_out(1, {1: info}, hp_ctx={"level": 95, "level_group": 9})

    def test_phase_hp_uses_the_template_ratio_table(self, monkeypatch):
        monkeypatch.setattr(eg, "_phase_ratios", lambda: {7: [1.0, 1.25, 1.0]})
        info = self._info()
        ctx = {"level": 95, "level_group": 3, "elite_group": 164}
        alias = eg._monster_out(7000007, {7000007: {**info, "_tpl": 7}}, hp_ctx=ctx,
                                curve=self.CURVE, elite_groups=self.ELITE)
        assert alias["phase_hp"] == [332818.7, 416023.4, 332818.7], "实例别名也要按模板 ID 命中比例表"
        assert alias["hp"] == alias["phase_hp"][0]
        single = eg._monster_out(9, {9: {**info, "_tpl": 9}}, hp_ctx=ctx,
                                 curve=self.CURVE, elite_groups=self.ELITE)
        assert "phase_hp" not in single and single["hp"] == 332818.7

    def test_phase_hp_absent_context(self, monkeypatch):
        monkeypatch.setattr(eg, "_phase_ratios", lambda: {1: [1.0, 1.25]})
        info = self._info()
        assert "phase_hp" not in eg._monster_out(1, {1: info})
        assert "phase_hp" not in eg._monster_out(1, {1: info}, hp_ctx={"level": 95, "level_group": 9})

    def test_stage_waves_hp_is_per_stage_row(self, monkeypatch):
        monkeypatch.setattr(eg, "_hp_tables", lambda: (self.CURVE, self.ELITE))
        stages = {
            1: {"level": 95, "level_group": 3, "elite_group": 164, "waves": [[7]]},
            2: {"level": 95, "level_group": 3, "waves": [[7]]},
        }
        out = eg._stage_waves_monsters([1, 2], stages, {7: self._info()})
        assert [e["hp"] for e in out] == [332818.7, 51202.9], (
            "缺关卡精英组 = 不参与叠乘（中性 1），不是缺数据"
        )

    def test_stage_rows_carry_group_context(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda p: [
            {"StageID": 1, "Level": 95, "HardLevelGroup": 3, "EliteGroup": 164,
             "MonsterList": [{"a": 7}]},
            {"StageID": 2, "Level": 95, "HardLevelGroup": 3, "MonsterList": [{"a": 7}]},
            {"StageID": 3, "MonsterList": [{"a": 7}]},
        ])
        stages = eg._load_stage_monsters_by_id({1, 2, 3})
        assert stages[1] == {"level": 95, "waves": [[7]], "maze_buff": None,
                             "level_group": 3, "elite_group": 164}
        assert stages[2] == {"level": 95, "waves": [[7]], "maze_buff": None, "level_group": 3}
        assert stages[3] == {"level": 0, "waves": [[7]], "maze_buff": None}


class TestInfiniteWaveMerge:
    @staticmethod
    def _patch_stage_config(monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda p: [
            {"StageID": 1, "Level": 55,
             "StageConfigData": [{"BFLIFKBEOPJ": "_StageInfiniteGroup", "MNDFOPKBHKP": "30324011"}],
             "MonsterList": [{"Monster0": 7, "Monster1": 8, "Monster2": 7},
                              {"Monster0": 9}]},
            {"StageID": 2, "Level": 55,
             "StageConfigData": [{"BFLIFKBEOPJ": "_StageInfiniteGroup", "MNDFOPKBHKP": "40401"},
                                  {"BFLIFKBEOPJ": "_Wave", "MNDFOPKBHKP": "2"}],
             "MonsterList": [{"Monster0": 7}, {"Monster0": 9}]},
            {"StageID": 3, "Level": 55, "MonsterList": [{"Monster0": 7}]},
        ])
        monkeypatch.setattr(eg, "_PLACEHOLDER_TEMPLATES", frozenset())

    def test_merge_dedupes_preview_slots_then_appends_pool_species(self, monkeypatch):
        self._patch_stage_config(monkeypatch)
        monkeypatch.setattr(eg, "_INFINITE_GROUPS",
                            {30324011: [[1, 7, 2, 8], [3, 9]]})
        stages = eg._load_stage_monsters_by_id({1, 2, 3})
        assert stages[1]["waves"] == [[7, 8, 1, 2], [9, 3]]
        assert stages[2]["waves"] == [[7], [9]]
        assert stages[3]["waves"] == [[7]]

    def test_dedupe_covers_waves_without_queue(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda p: [
            {"StageID": 1, "Level": 55,
             "StageConfigData": [{"BFLIFKBEOPJ": "_StageInfiniteGroup", "MNDFOPKBHKP": "5"}],
             "MonsterList": [{"Monster0": 7}, {"Monster0": 7, "Monster1": 7},
                              {"Monster0": 9, "Monster1": 9}]},
        ])
        monkeypatch.setattr(eg, "_PLACEHOLDER_TEMPLATES", frozenset())
        monkeypatch.setattr(eg, "_INFINITE_GROUPS", {5: [[7, 2]]})
        stages = eg._load_stage_monsters_by_id({1})
        assert stages[1]["waves"] == [[7, 2], [7], [9]]

    def test_placeholder_art_templates_dropped(self, monkeypatch, caplog):
        self._patch_stage_config(monkeypatch)
        monkeypatch.setattr(eg, "_PLACEHOLDER_TEMPLATES", frozenset({8, 5}))
        monkeypatch.setattr(eg, "_INFINITE_GROUPS", {30324011: [[5, 1, 7], [3, 9]]})
        with caplog.at_level("WARNING", logger="converter"):
            stages = eg._load_stage_monsters_by_id({1, 3})
        assert stages[1]["waves"] == [[7, 1], [9, 3]]
        assert stages[3]["waves"] == [[7]]
        assert any("占位美术模板" in r.message for r in caplog.records)

    def test_placeholder_templates_criterion(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"MonsterTemplateID": 1, "IconPath": "SpriteOutput/MosterIcon/Monster_1.png",
             "RoundIconPath": "SpriteOutput/MonsterRoundIcon/Monster_1.png",
             "ImagePath": "SpriteOutput/MonsterFigure/Monster_1.png"},
            {"MonsterTemplateID": 2, "IconPath": "SpriteOutput/BattleEventIcon/Monster_Unknown.png",
             "RoundIconPath": "SpriteOutput/BattleEventIcon/Monster_Unknown.png",
             "ImagePath": "SpriteOutput/BattleEventIcon/Monster_Unknown.png"},
            {"MonsterTemplateID": 3, "IconPath": "SpriteOutput/MosterIcon/Monster_3.png",
             "ImagePath": "SpriteOutput/BattleEventIcon/Monster_Unknown.png"},
            {"MonsterTemplateID": 4},
        ])
        monkeypatch.setattr(eg, "_PLACEHOLDER_TEMPLATES", None)
        assert eg._placeholder_templates() == frozenset({2, 3})
        assert eg._placeholder_templates() == frozenset({2, 3}), "第二次调用应命中进程内缓存"

    def test_extra_infinite_waves_not_materialized(self, monkeypatch, caplog):
        self._patch_stage_config(monkeypatch)
        monkeypatch.setattr(eg, "_INFINITE_GROUPS", {40401: [[7], [2], [5, 6]]})
        with caplog.at_level("WARNING", logger="converter"):
            stages = eg._load_stage_monsters_by_id({2})
        assert stages[2]["waves"] == [[7], [9, 2]]
        assert any("超出关卡声明的 2 波" in r.message for r in caplog.records)

    def test_stage_without_declaration_does_not_read_pool_tables(self, monkeypatch):
        called: list[str] = []

        def fake_load(p):
            called.append(Path(str(p)).name)
            return [{"StageID": 3, "Level": 55, "MonsterList": [{"Monster0": 7}]}]

        monkeypatch.setattr(eg, "load_json", fake_load)
        monkeypatch.setattr(eg, "_INFINITE_GROUPS", {1: [[99]]})
        stages = eg._load_stage_monsters_by_id({3})
        assert stages[3]["waves"] == [[7]]
        assert called == ["StageConfig.json"]

    def test_infinite_groups_takes_species_in_first_seen_order(self, monkeypatch):
        reads: list[str] = []

        def fake_load(p):
            name = Path(str(p)).name
            reads.append(name)
            if name == "StageInfiniteGroup.json":
                return [{"WaveGroupID": 5, "WaveIDList": [51, 52, 53]}]
            if name == "StageInfiniteWaveConfig.json":
                return [{"InfiniteWaveID": 51, "MonsterGroupIDList": [91, 92]},
                        {"InfiniteWaveID": 52, "MonsterGroupIDList": [93]},
                        {"InfiniteWaveID": 53, "MonsterGroupIDList": []}]
            if name == "StageInfiniteMonsterGroup.json":
                return [{"InfiniteMonsterGroupID": 91, "MonsterList": [1, 2, 1, 2]},
                        {"InfiniteMonsterGroupID": 92, "MonsterList": [3]},
                        {"InfiniteMonsterGroupID": 93, "MonsterList": []}]
            raise AssertionError(f"未预期的表：{name}")

        monkeypatch.setattr(eg, "load_json", fake_load)
        monkeypatch.setattr(eg, "_INFINITE_GROUPS", None)
        assert eg._infinite_groups() == {5: [[1, 2, 3]]}
        assert eg._infinite_groups() == {5: [[1, 2, 3]]}
        assert reads.count("StageInfiniteGroup.json") == 1, "第二次调用应命中进程内缓存"
