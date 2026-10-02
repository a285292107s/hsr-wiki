"""endgame 转换器纯函数契约测试。

用合成数据验证核心行为，不依赖真实源数据：
- _load_schedules：ScheduleID-200000 → GroupID 映射；公测前/2030 未来占位过滤
- _load_maze_buffs / _load_monsters / _load_targets：辅助表解析（名称/图标 basename）
- _group_maze_buff / _group_extra_buff / _group_extra_buff_groups / _load_story_turns：组级/分场次增益 / 回合上限
- _load_guide_traits / _stage_traits / _attach_boss_traits：末日幻影首领特性（模板聚合与技能 ID 反查）
- _season_stats：层数/阶段/回合取最大，弱点合并去重，逐层弱点 floor_damage
- _season_floors：逐层详情（序号/层名/上下半场属性与敌方/层级增益/目标）
- _season_monsters / _season_targets：敌方按层序收集去重、目标描述去重
- _group_seasons：名称解析 + 排期合并 + 统计 + 增益/敌方/目标/回合
- _peak_seasons：异相仲裁弱点属性

"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import endgame as eg  # noqa: E402
from converters import endgame_catalog as egc  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件；共享聚合模块（monster_common）同步 mock。"""
    import textmap
    import converters.monster_common as mc
    monkeypatch.setattr(textmap, "_text_map", {})
    fake_resolve = lambda ref, clean=False: "" if not ref else f"名{ref.get('Hash', 0)}"  # noqa: E731
    monkeypatch.setattr(eg, "resolve_text", fake_resolve)
    monkeypatch.setattr(mc, "resolve_text", fake_resolve)
    return mc

class TestLoadSchedules:
    def test_maps_and_filters(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 200101, "BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
            {"ID": 200102, "BeginTime": "2022-11-14 04:00:00", "EndTime": "2022-11-28 04:00:00"},
            {"ID": 200108, "BeginTime": "2033-02-06 04:00:00", "EndTime": "2033-02-20 04:00:00"},
            {"ID": 201034, "BeginTime": "2030-01-01 04:00:00", "EndTime": "2030-01-15 04:00:00"},
            {"ID": 201001, "BeginTime": "", "EndTime": "2023-09-18 04:00:00"},
            {"ID": 201002, "BeginTime": "not-a-date", "EndTime": "2023-09-18 04:00:00"},
            {"BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
        ])
        result = eg._load_schedules("ScheduleDataChallengeMaze.json")
        assert set(result.keys()) == {"101"}
        assert result["101"] == ("2023-09-04 04:00:00", "2023-09-18 04:00:00")

    def test_load_test_periods(self, monkeypatch):
        """测试期：EndTime 早于公测上线的 beta/CBT 组；未来占位/正式期不标。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 200101, "BeginTime": "2023-02-06 04:00:00", "EndTime": "2023-03-06 04:00:00"},
            {"ID": 200102, "BeginTime": "2022-11-14 04:00:00", "EndTime": "2022-11-28 04:00:00"},
            {"ID": 200117, "BeginTime": "2023-04-17 04:00:00", "EndTime": "2023-05-15 04:00:00"},
            {"ID": 200108, "BeginTime": "2033-02-06 04:00:00", "EndTime": "2033-02-20 04:00:00"},
            {"ID": 201001, "BeginTime": "", "EndTime": "2023-09-18 04:00:00"},
        ])
        assert eg._load_test_periods() == {101, 102}

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
        """敌方输出裁剪：轻量模式去掉 intro/skills；full 模式 skills 仅取名称 + 标签，
        且不含详情页专属字段（stats/figure，共享聚合表带来的字段不泄漏进赛季输出）；
        stats 仅提升 speed（模板 SpeedBase）；实例别名附 tpl=模板 ID。"""
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
        """实例别名（MonsterID≠MonsterTemplateID）：输出 tpl=模板 ID 供前端跳转；
        内部字段 _tpl 不外泄。"""
        info = {"name": "名1", "icon": "Monster_1", "_tpl": 2004010,
                "weak": [], "resist": {}, "rank": "", "camp": "",
                "stance": 300, "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 0}}
        out = eg._monster_out(200401014, {200401014: info})
        assert out == {"id": "200401014", "tpl": "2004010", "name": "名1",
                       "icon": "Monster_1", "weak": [], "resist": {},
                       "rank": "", "camp": "", "stance": 300}
        assert "speed" not in out

    def test_load_targets_clean(self, monkeypatch):
        """目标表：文本清洗 + 参数补全 + 类型输出（ChallengeTargetType）。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 251, "ChallengeTargetName": {"Hash": 1},
             "ChallengeTargetParam1": 20, "ChallengeTargetType": "ROUNDS_LEFT"},
            {"ID": 252, "ChallengeTargetName": {"Hash": 2}},
            {"ID": 253, "ChallengeTargetName": {"Hash": 1},
             "ChallengeTargetType": "ROUNDS_LEFT"},
            {"ID": 0},
        ])
        monkeypatch.setattr(eg, "clean_text", lambda s: f"cleaned:{s}" if s else "")
        out = eg._load_targets()
        assert out[251] == {"text": "cleaned:名1", "param": 20, "type": "ROUNDS_LEFT"}
        assert out[252] == {"text": "cleaned:名2", "param": None}
        assert out[253] == {"text": "cleaned:名1", "param": 20, "type": "ROUNDS_LEFT"}
        assert 0 not in out

    def test_load_permanent_groups(self, monkeypatch):
        """常驻关卡：ScheduleDataID 为空的长期关卡分组（无赛季轮回）。"""
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
        """战意赛季主题机制：SubMazeBuffList 去重保序；Normal 赛季（空列表）不入表。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 2025, "SubMazeBuffList": [3031232, 3031233, 3031234, 3031232]},
            {"GroupID": 2001, "SubMazeBuffList": []},
            {"GroupID": 0},
        ])
        out = eg._group_extra_sub_buffs()
        assert out == {2025: [3031232, 3031233, 3031234]}
        assert 2001 not in out

    def test_group_extra_buff_groups_by_half(self, monkeypatch):
        """分场次赛季增益：BuffList1/2/3 → stage1/stage2/tierce；组内去重保序，空场次不落键。"""
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

class TestBossTraits:
    """末日幻影「首领特性」（MonsterGuideConfig × MonsterGuideTag → 敌方模板 → 场次）。"""

    @staticmethod
    def _guide(tag_recs, config_recs, monkeypatch):
        def fake(path):
            return config_recs if str(path).endswith("MonsterGuideConfig.json") else tag_recs
        monkeypatch.setattr(eg, "load_json", fake)
        return eg._load_guide_traits()

    def test_direct_template_index(self, monkeypatch):
        """配置表 MonsterID（模板×100+实例序号）→ 模板：同模板各难度实例共用一份清单。"""
        tag = {"TagID": 101701, "TagName": {"Hash": 11}, "TagBriefDescription": {"Hash": 12},
               "ParameterList": [{"Value": 0.5}, 1]}
        out = self._guide([tag], [
            {"MonsterID": 202401601, "TagList": [101701]},
            {"MonsterID": 202401604, "TagList": [101701]},
        ], monkeypatch)
        assert out == {2024016: [{"id": 101701, "name": "名11", "desc": "名12", "param_list": [0.5, 1]}]}

    def test_skill_id_alias_when_template_missing(self, monkeypatch):
        """配置表登记的敌方 ID ≠ 战斗敌方（影将军 2035012 登记为蚀心兽 2033022）→
        Tag.SkillID // 100 反查补上，使战斗模板能命中首领特性。"""
        tags = [
            {"TagID": 101201, "TagName": {"Hash": 1}, "TagBriefDescription": {"Hash": 2},
             "ParameterList": [], "SkillID": 203501211},
            {"TagID": 101202, "TagName": {"Hash": 3}, "TagBriefDescription": {"Hash": 4},
             "ParameterList": []},
        ]
        out = self._guide(tags, [{"MonsterID": 203302201, "TagList": [101201, 101202]}], monkeypatch)
        assert [e["id"] for e in out[2035012]] == [101201, 101202]

    def test_alias_ambiguous_or_already_direct_skipped(self, monkeypatch):
        """反查键被多组 TagList 共享（技能跨首领复用）时放弃；配置表已有该模板时不用反查覆盖。"""
        tags = [
            {"TagID": 1, "TagName": {"Hash": 1}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 203501211},
            {"TagID": 2, "TagName": {"Hash": 2}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 203501212},
            {"TagID": 3, "TagName": {"Hash": 3}, "TagBriefDescription": {}, "ParameterList": [],
             "SkillID": 100401410},
        ]
        out = self._guide(tags, [
            {"MonsterID": 203302201, "TagList": [1]},
            {"MonsterID": 203302301, "TagList": [2]},
            {"MonsterID": 100401401, "TagList": [3]},
        ], monkeypatch)
        assert 2035012 not in out
        assert [e["id"] for e in out[1004014]] == [3]

    def test_stage_traits_template_dedup(self):
        """一个场次的首领特性：按敌方模板命中并按 TagID 去重保序（未登记模板跳过）。"""
        a, b = {"id": 101701, "name": "坚防守备"}, {"id": 101702, "name": "丰亨豫大"}
        guide = {2024016: [a, b], 5014014: [{"id": 101601, "name": "双重战场"}]}
        mons = [{"id": "202401601"}, {"id": "202401602"}, {"id": "100402601", "tpl": "1004026"}]
        assert eg._stage_traits(mons, guide) == [a, b]

    def test_attach_boss_traits_top_floor_and_star_node(self):
        """赛季级首领特性取末层两个场次 + 星启节点 3；无命中/无节点不落字段。"""
        a, b = {"id": 101701, "name": "坚防守备"}, {"id": 101601, "name": "双重战场"}
        guide = {2024016: [a], 5014014: [b]}
        entry = {
            "floor_details": [
                {"floor": 1, "stage1": {"monsters": [{"id": "202401601"}]}, "stage2": {"monsters": []}},
                {"floor": 4, "stage1": {"monsters": [{"id": "202401604"}]},
                 "stage2": {"monsters": [{"id": "999901"}]}},
            ],
            "tierce": {"nodes": [{"idx": 1, "monsters": [{"id": "202401604"}]},
                                 {"idx": 3, "monsters": [{"id": "501401404"}]}]},
        }
        eg._attach_boss_traits(entry, guide)
        assert entry["boss_traits"] == {"stage1": [a], "tierce": [b]}
        empty = {"floor_details": [{"floor": 1, "stage1": {"monsters": []}, "stage2": {"monsters": []}}]}
        eg._attach_boss_traits(empty, guide)
        assert "boss_traits" not in empty

class TestTierce:
    """星启模式（Tierce）表解析：DLCKKJFMJOB → 关卡表 GroupID 映射。"""

    def test_load_tierce_mapping_and_fields(self, monkeypatch):
        """星启：HFIAAGAKFMD → StageConfig 波次（wave 序号）；无 Stage 回退 Boss 代表。

        节点 1/2 的 buff 取层记录 `MazeBuffID`，节点 3 取附加关 StageConfig 的
        `_BindingMazeBuff`（星启表无 buff 字段）。"""
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
            {"text": "获得#1[i]分", "param": 99000, "type": "TOTAL_SCORE"},
        ]
        assert out["2024"]["rewards"] == [
            {"id": 122002, "num": 0},
            {"id": 213, "num": 24},
            {"id": 2, "num": 380000},
        ]
        assert "1034" not in out
        # 节点 3 的 buff 来自附加关自身绑定（998），不是节点 1/2 的层记录（999）
        assert out["1033"]["nodes"][0]["buff"]["id"] == 999
        assert out["1033"]["nodes"][2]["buff"]["id"] == 998

class TestStageBindingBuff:
    """StageConfig 自身绑定的关卡增益（`StageConfigData._BindingMazeBuff`）。"""

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
        """逐层弱点按层序输出，上下半场（stage1/stage2）分别保序去重。"""
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
        """常规层：Floor 字段直取；层级增益/目标/上下半场波次敌方完整输出。"""
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

class TestSeasonExtras:
    def test_monsters_ordered_dedup(self):
        """赛季敌方：各层 StageConfig 波次按层序收集去重（跨波同怪合并）。"""
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
        """赛季名取分组名（GroupName）而非首层关卡名（Name 带期数后缀）。"""
        recs = [{"GroupID": 3020, "ID": 30201, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeBossMazeConfig.json", "Name", {},
            group_names={3020: "兵锋骑士"},
        )
        assert out["3020"]["zh"] == "兵锋骑士"

    def test_name_fallback_when_no_group_name(self, monkeypatch):
        """分组名缺失 → 回退首层关卡名（如组 100 / 900 等无分组表记录）。"""
        recs = [{"GroupID": 900, "ID": 1, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons("ChallengeMazeConfig.json", "Name", {})
        assert out["900"]["zh"] == "名1"

    def test_permanent_flag(self, monkeypatch):
        """常驻关卡（permanent 命中）输出 permanent 标记，赛季组不输出。"""
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
        """测试期（test_period 命中）输出 test 标记，正式赛季不输出。"""
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
        """BattleTargetConfig：仅 Type=ChallengeTarget 采集，缺名跳过。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 3000, "Type": "ChallengeTarget", "TargetName": {"Hash": 1},
             "TargetParam": 4},
            {"ID": 3001, "Type": "Other", "TargetName": {"Hash": 2},
             "TargetParam": 9},
            {"ID": 3002, "Type": "ChallengeTarget", "TargetName": {}},
        ])
        monkeypatch.setattr(eg, "clean_text", lambda s: f"c:{s}" if s else "")
        out = eg._load_battle_targets()
        assert out == {3000: {"text": "c:名1", "param": 4}}

    def test_stage_monsters_by_id_only_wanted(self, monkeypatch):
        """StageConfig：仅提取关心的 StageID，波次结构保序保留（含波内重复）+ 关卡绑定增益。"""
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
                    {"ID": 3033001, "BuffName": {"Hash": 20}},
                    {"ID": 3033003, "BuffName": {"Hash": 21}},
                    {"ID": 3033006, "BuffName": {"Hash": 22}},
                    {"ID": 3033010, "BuffName": {"Hash": 23}},
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
        assert k1["tags"] == ["名20"]
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
        assert hard["tags"] == ["名23"]
        assert entry["monsters"] == [
            {"id": "1003010", "name": "名30", "icon": "Monster_1003010",
             "weak": ["Physical"], "resist": {"Fire": 0.2}, "rank": "Elite",
             "camp": "名40", "stance": 240},
            {"id": "2002010", "name": "名31", "icon": "",
             "weak": [], "resist": {}, "rank": "MinionLv2",
             "camp": "", "stance": 0},
        ]
        assert entry["final_monsters"] == [
            {"id": "2002010", "name": "名31", "icon": "",
             "weak": [], "resist": {}, "rank": "MinionLv2",
             "camp": "", "stance": 0},
        ]
        assert entry["buffs"] == [{"id": 3033006, "name": "名22",
                                    "desc": "", "param_list": [], "icon": ""}]
        assert entry["arts"] == {
            "tab": "SpriteOutput/ChallengePeak/ChallengePeakIcon_4001.png"}

class TestGroupArts:
    def test_load_group_arts_maps_all_fields(self, monkeypatch):
        """_load_group_arts：按 _GROUP_ART_FIELDS 映射全部图标字段，缺失字段自动跳过。"""
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
        """_merge_arts：同 GroupID 的字段互补合并，不互相覆盖。"""
        merged = eg._merge_arts(
            {2001: {"tab": "A.png"}, 2002: {"tab": "B.png"}},
            {2001: {"theme_icon": "C.png"}},
        )
        assert merged == {
            2001: {"tab": "A.png", "theme_icon": "C.png"},
            2002: {"tab": "B.png"},
        }

    def test_maze_arts_merges_group_extra(self, monkeypatch):
        """maze 转换 arts 合并分组表 + GroupExtra（与 story/boss 同构，勿漏）。"""
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
        """ChallengeGeneralConfig：Memory/Story/Boss → maze/story/boss；Peak 无记录。"""
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
        """_attach_default_icon：无默认路径跳过；有则并入各条 arts.default（缺失 arts 时新建）。"""
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
    """endgame_catalog：目录卡轻量条目派生（剥离重型字段）。"""

    def test_season_catalog_strips_heavy_fields(self):
        """轻量条目剥离 floor_details / 敌方重型字段 / 星启节点 / 完整 buff / 顶层 damage_types。"""
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
        """污染赛季的轻量条目保留 pollution 汇总（目录卡「含污染」标记的唯一判据）。"""
        entry = {"id": "3021", "zh": "支配遗忘", "pollution": {"count": 2, "levels": [2, 3]}}
        assert egc._season_catalog(entry)["pollution"] == {"count": 2, "levels": [2, 3]}
        assert "pollution" not in egc._season_catalog({"id": "1", "zh": "无污染"})


class TestPollution:
    """污染等级写入终局数据（ADR 0026）：关卡级判据 = EventIDList 命中 StageInvasionConfig。"""

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
        """被污染怪物只收录图鉴内已注册者（未注册的实例 ID 无名称/图标，跳过）。"""
        invasions = {420503: {"level": 2, "monster_ids": [202206017, 9000]}}
        monsters = {202206017: {"name": "器元士", "icon": "Monster_2022060",
                                "weak": [], "resist": {}, "rank": "MinionLv2"}}
        assert eg._stage_invasion([420503], invasions, monsters)["monsters"] == [
            {"id": "202206017", "name": "器元士", "icon": "Monster_2022060",
             "weak": [], "resist": {}, "rank": "MinionLv2"},
        ]
        # 未命中任何污染关卡 → None（字段整体省略，而非空对象）
        assert eg._stage_invasion([999], invasions, monsters) is None

    def test_stage_invasion_keeps_level_when_no_monster_registered(self):
        """污染关卡的怪物全未注册时仍保留等级（等级是关卡级事实，不依赖怪物清单）。"""
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
        # 不传 invasions（旧调用方）时不落该字段
        assert "invasion" not in eg._season_floors(recs, monsters, {}, {}, stages)[0]["stage1"]

    def test_apply_pollution_dedupes_by_stage_id(self):
        """赛季汇总按 StageID 去重：星启节点 1/2 与常规末层同关卡，不得重复计数。"""
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
        """星启附加关（节点 3）本身就是污染关卡：不覆盖则整条只存在于上游表里。"""
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
        # 未传 buffs 时节点 3 不落 buff（其来源是关卡绑定，不是层记录）
        assert "buff" not in nodes[2]
        entry = {"tierce": out["1036"]}
        eg._apply_pollution(entry)
        assert entry["pollution"] == {"count": 1, "levels": [3]}
