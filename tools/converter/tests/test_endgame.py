"""endgame 转换器纯函数契约测试。

用合成数据验证核心行为，不依赖真实源数据：
- _load_schedules：ScheduleID-200000 → GroupID 映射；公测前/2030 未来占位过滤
- _load_maze_buffs / _load_monsters / _load_targets：辅助表解析（名称/图标 basename）
- _group_maze_buff / _group_extra_buff / _load_story_turns：组级增益 / 回合上限
- _season_stats：层数/阶段/回合取最大，弱点合并去重，逐层弱点 floor_damage
- _season_floors：逐层详情（序号/层名/上下半场属性与敌方/层级增益/目标）
- _season_monsters / _season_targets：敌方按层序收集去重、目标描述去重
- _group_seasons：名称解析 + 排期合并 + 统计 + 增益/敌方/目标/回合
- _peak_seasons：异相仲裁弱点属性

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import endgame as eg  # noqa: E402


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件；共享聚合模块（monster_common）同步 mock。"""
    import textmap
    import converters.monster_common as mc
    monkeypatch.setattr(textmap, "_text_map", {})
    # 默认 resolve_text：空引用返回 ""（与真实行为一致），否则 "名{Hash}"
    fake_resolve = lambda ref, clean=False: "" if not ref else f"名{ref.get('Hash', 0)}"  # noqa: E731
    monkeypatch.setattr(eg, "resolve_text", fake_resolve)
    monkeypatch.setattr(mc, "resolve_text", fake_resolve)
    return mc


# ─── _load_schedules ────────────────────────────────────────────

class TestLoadSchedules:
    def test_maps_and_filters(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            # 正常排期 → 组 101（200101-200000）
            {"ID": 200101, "BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
            # 公测前整段（beta 占位）→ 丢弃
            {"ID": 200102, "BeginTime": "2022-11-14 04:00:00", "EndTime": "2022-11-28 04:00:00"},
            # 起点 2030+（未来占位）→ 丢弃
            {"ID": 200108, "BeginTime": "2033-02-06 04:00:00", "EndTime": "2033-02-20 04:00:00"},
            {"ID": 201034, "BeginTime": "2030-01-01 04:00:00", "EndTime": "2030-01-15 04:00:00"},
            # 缺字段 / 非法日期 → 丢弃
            {"ID": 201001, "BeginTime": "", "EndTime": "2023-09-18 04:00:00"},
            {"ID": 201002, "BeginTime": "not-a-date", "EndTime": "2023-09-18 04:00:00"},
            {"BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
        ])
        result = eg._load_schedules("ScheduleDataChallengeMaze.json")
        # 仅 101 保留，其余全部过滤
        assert set(result.keys()) == {"101"}
        assert result["101"] == ("2023-09-04 04:00:00", "2023-09-18 04:00:00")

    def test_story_boss_mapping(self, monkeypatch):
        """虚构叙事（202001↔2001）/ 末日幻影（203001↔3001）同构映射。"""
        def fake_load(path):
            if "Story" in str(path):
                return [{"ID": 202001, "BeginTime": "2024-01-08 04:00:00",
                         "EndTime": "2024-02-19 04:00:00"}]
            return [{"ID": 203001, "BeginTime": "2024-06-17 04:00:00",
                     "EndTime": "2024-08-05 04:00:00"}]
        monkeypatch.setattr(eg, "load_json", fake_load)
        story = eg._load_schedules("ScheduleDataChallengeStory.json")
        boss = eg._load_schedules("ScheduleDataChallengeBoss.json")
        assert set(story.keys()) == {"2001"}
        assert set(boss.keys()) == {"3001"}
        assert story["2001"][0] == "2024-01-08 04:00:00"
        assert boss["3001"][1] == "2024-08-05 04:00:00"


# ─── 辅助表解析 ─────────────────────────────────────────────────

class TestAuxTables:
    def test_load_maze_buffs(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 3030146, "BuffName": {"Hash": 1},
             "BuffDesc": {"Hash": 3},
             "ParamList": [{"Value": 0.5}, {"Value": 1}]},
            {"ID": 3031301, "BuffName": {"Hash": 2}, "BuffDesc": {}},
            {"ID": 0},  # 缺名称 → 跳过
        ])
        out = eg._load_maze_buffs()
        assert out[3030146] == {"name": "名1", "desc": "名3", "param_list": [0.5, 1], "icon": ""}
        # 无 ParamList → 空数组；缺名称 → 不入表
        assert out[3031301]["param_list"] == []
        assert 0 not in out

    def test_monster_out_trim(self):
        """敌方输出裁剪：轻量模式去掉 intro/skills；full 模式 skills 仅取名称 + 标签，
        且不含详情页专属字段（stats/figure，共享聚合表带来的字段不泄漏进赛季输出）。"""
        info = {
            "name": "名1", "icon": "Monster_1", "figure": "Monster_1",
            "weak": ["Ice"], "resist": {"Fire": 0.2}, "rank": "Elite",
            "camp": "名20", "intro": "名10", "stance": 240,
            "stats": {"hp": 1, "atk": 2, "def": 3, "speed": 4},
            "skills": [{"id": 1, "name": "名30", "tag": "名31",
                         "type_desc": "技能", "desc": "描述",
                         "param_list": [3]}],
        }
        light = eg._monster_out(8013010, {8013010: info})
        assert light == {
            "id": "8013010", "name": "名1", "icon": "Monster_1",
            "weak": ["Ice"], "resist": {"Fire": 0.2},
            "rank": "Elite", "camp": "名20", "stance": 240,
        }
        full = eg._monster_out(8013010, {8013010: info}, full=True)
        assert full["intro"] == "名10"
        assert full["skills"] == [{"name": "名30", "tag": "名31"}]
        assert "stats" not in full
        assert "figure" not in full
        # 未注册 mid → 仅输出 id（调用方需自行保证 mid 已注册）
        assert eg._monster_out(9999, {}) == {"id": "9999"}

    def test_load_targets_clean(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 251, "ChallengeTargetName": {"Hash": 1},
             "ChallengeTargetParam1": 20},
            {"ID": 252, "ChallengeTargetName": {"Hash": 2}},  # 无参数 → param None
            {"ID": 253, "ChallengeTargetName": {"Hash": 1}},  # 同 Hash 缺参数 → 补全 20
            {"ID": 0},  # 无名称 → 跳过
        ])
        monkeypatch.setattr(eg, "clean_text", lambda s: f"cleaned:{s}" if s else "")
        out = eg._load_targets()
        assert out[251] == {"text": "cleaned:名1", "param": 20}
        assert out[252] == {"text": "cleaned:名2", "param": None}
        assert out[253] == {"text": "cleaned:名1", "param": 20}  # 同 Hash 补全
        assert 0 not in out

    def test_load_group_names(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 3020, "GroupName": {"Hash": 1}},
            {"GroupID": 100},  # 无名称 → 跳过
        ])
        assert eg._load_group_names("x.json") == {3020: "名1"}


# ─── 组级增益 / 回合上限 ────────────────────────────────────────

class TestGroupAux:
    def test_group_maze_buff(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 1033, "MazeBuffID": 3030146},
            {"GroupID": 100},  # 无增益 → 跳过
        ])
        assert eg._group_maze_buff() == {1033: [3030146]}

    def test_group_extra_buff_story(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 2001, "BuffList": [3031301, 3031302, 3031301]},
            {"GroupID": 2002, "BuffList": []},
        ])
        assert eg._group_extra_buff("x.json", ("BuffList",)) == {2001: [3031301, 3031302]}

    def test_group_extra_buff_boss_two_stages(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"GroupID": 3020, "BuffList1": [3111008, 3111010], "BuffList2": [3111008, 3111012],
             "BuffList3": [3111082]},  # 第三阶段不采集
        ])
        out = eg._group_extra_buff("x.json", ("BuffList1", "BuffList2"))
        assert out == {3020: [3111008, 3111010, 3111012]}

    def test_load_story_turns(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 20011, "TurnLimit": 5},
            {"ID": 20012, "TurnLimit": 6},
            {"ID": 20111, "TurnLimit": 4},  # 另一组（2011）
        ])
        assert eg._load_story_turns() == {"2001": 6, "2011": 4}


# ─── _season_stats ──────────────────────────────────────────────

class TestTierce:
    """星启模式（Tierce）表解析：DLCKKJFMJOB → 关卡表 GroupID 映射。"""

    def test_load_tierce_mapping_and_fields(self, monkeypatch):
        """星启：HFIAAGAKFMD → StageConfig 波次（wave 序号）；无 Stage 回退 Boss 代表。"""
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengeMazeTierce.json"):
                return [{"PHFMCACHFIJ": 5213, "DLCKKJFMJOB": 5212,
                         "LOJCIDLKPKG": ["Imaginary", "Fire"],
                         "GNOOAGPBNLD": 45,
                         "OGEOMCGNNMP": [601, 602, 999],
                         "HFIAAGAKFMD": [30123123],
                         "JEBMBCLBIOI": [5014010, 9999999]}]  # 未注册目标/怪物 → 跳过
            if name.endswith("ChallengeMazeConfig.json"):
                return [{"ID": 5212, "GroupID": 1033,
                         "EventIDList1": [30123031], "EventIDList2": [30123032]},
                        {"ID": 5312, "GroupID": 1034}]
            if name.endswith("ChallengeStoryMazeTierce.json"):
                return [{"PHFMCACHFIJ": 20245, "DLCKKJFMJOB": 20244,
                         "LOJCIDLKPKG": ["Physical"], "GNOOAGPBNLD": 0,
                         "IDBJENCBJHM": 45000, "OGEOMCGNNMP": [4001]}]  # 无 HFIAAGAKFMD → 回退 Boss 代表
            if name.endswith("ChallengeStoryMazeConfig.json"):
                return [{"ID": 20244, "GroupID": 2024}]
            if name.endswith("StageConfig.json"):
                return [
                    {"StageID": 30123123, "Level": 95,
                     "MonsterList": [{"Monster0": 5013040, "Monster1": 5014010},
                                      {"Monster0": 5014010}]},
                    {"StageID": 30123031, "Level": 95, "MonsterList": [{"Monster0": 5014010}]},
                    {"StageID": 30123032, "Level": 95, "MonsterList": [{"Monster0": 5013040}]},
                ]
            return []
        monkeypatch.setattr(eg, "load_json", fake_load)
        targets = {
            601: {"text": "剩余#1[i]轮", "param": 15},
            602: {"text": "剩余#1[i]轮", "param": 30},
            4001: {"text": "获得#1[i]分", "param": 60000},
        }
        monsters = {5013040: {"name": "先锋", "icon": "Monster_5013040",
                               "weak": [], "resist": {}, "rank": "Elite"},
                    5014010: {"name": "星啸", "icon": "Monster_5014010",
                               "weak": [], "resist": {}, "rank": ""}}
        out = eg._load_tierce(
            [("ChallengeMazeTierce.json", "ChallengeMazeConfig.json"),
             ("ChallengeStoryMazeTierce.json", "ChallengeStoryMazeConfig.json")],
            targets, monsters,
        )
        assert out["1033"] == {
            "id": 5213,
            "damage_types": ["Fire", "Imaginary"],
            "countdown": 45,
            "score": None,
            "level": 95,  # 星启 Boss 战等级（StageConfig.Level）
            "targets": [{"text": "剩余#1[i]轮", "param": 15},
                         {"text": "剩余#1[i]轮", "param": 30}],
            # StageConfig 波次：波 1 双怪 + 波 2 Boss（wave 序号）
            "monsters": [
                {"id": "5013040", "name": "先锋", "icon": "Monster_5013040",
                 "weak": [], "resist": {}, "rank": "Elite", "wave": 1},
                {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                 "weak": [], "resist": {}, "rank": "", "wave": 1},
                {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                 "weak": [], "resist": {}, "rank": "", "wave": 2},
            ],
            # 3 节点敌方：节点 1/2 = 常规最高难度关（5212）上下半场；节点 3 = 星启附加关
            "nodes": [
                {"idx": 1, "monsters": [{"id": "5014010", "name": "星啸",
                                            "icon": "Monster_5014010", "weak": [],
                                            "resist": {}, "rank": "", "wave": 1}]},
                {"idx": 2, "monsters": [{"id": "5013040", "name": "先锋",
                                            "icon": "Monster_5013040", "weak": [],
                                            "resist": {}, "rank": "Elite", "wave": 1}]},
                {"idx": 3, "monsters": [
                    {"id": "5013040", "name": "先锋", "icon": "Monster_5013040",
                     "weak": [], "resist": {}, "rank": "Elite", "wave": 1},
                    {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                     "weak": [], "resist": {}, "rank": "", "wave": 1},
                    {"id": "5014010", "name": "星啸", "icon": "Monster_5014010",
                     "weak": [], "resist": {}, "rank": "", "wave": 2},
                ]},
            ],
        }
        # 虚构叙事：score 输出；无 Stage 配置 → 回退 Boss 代表（无波次）；组 1034 无星启 → 不入表
        assert out["2024"]["score"] == 45000
        assert out["2024"]["monsters"] == []
        assert "1034" not in out


# ─── _season_stats ──────────────────────────────────────────────

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
        # 全赛季合并属性不受影响
        assert result["damage_types"] == ["Fire", "Ice", "Quantum", "Wind"]

    def test_missing_fields_default(self):
        result = eg._season_stats([{"Floor": None}])
        assert result == {"damage_types": [], "floors": 0, "stage_num": 0,
                          "countdown": 0, "floor_damage": []}


# ─── 逐层详情 _season_floors ─────────────────────────────────

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
        # 波次：stage1 两波（波 2 含未注册怪 → 跳过）；stage2 单波
        stages = {30123011: {"level": 80, "waves": [[1003010, 9999999], [1003010]]},
                  30123012: {"level": 80, "waves": [[2002010]]}}
        out = eg._season_floors(recs, monsters, buffs, targets, stages)
        assert len(out) == 2
        f1, f2 = out
        assert f1 == {"floor": 1, "name": "名2", "countdown": 0,
                      "stage1": {"damage": [], "monsters": []},
                      "stage2": {"damage": [], "monsters": []}}  # 未注册 buff → 无 buff 键
        assert f2["floor"] == 2
        assert f2["name"] == "名1"
        assert f2["countdown"] == 40
        assert f2["level"] == 80  # 关卡等级（StageConfig.Level）
        assert f2["stage1"] == {"damage": ["Fire"], "monsters": [
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": ["Physical"], "resist": {}, "rank": "Elite", "wave": 1},
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": ["Physical"], "resist": {}, "rank": "Elite", "wave": 2}]}  # 波 1 未注册怪跳过；波 2 同怪保留
        assert f2["stage2"] == {"damage": ["Ice"], "monsters": [
            {"id": "2002010", "name": "怪B", "icon": "Monster_B",
             "weak": [], "resist": {}, "rank": "", "wave": 1}]}
        assert f2["buff"] == {"id": 3030146, "name": "记忆紊流",
                               "desc": "伤害提高", "param_list": [0.3]}
        assert f2["targets"] == [{"text": "剩余#1[i]轮以上", "param": 10}]

    def test_floor_sequence_when_field_missing(self):
        """永屹之城遗秘（组 100）：无 Floor 字段 → 按 ID 升序取序号。"""
        recs = [
            {"ID": 3, "Name": {"Hash": 1}, "DamageType1": ["Wind"]},
            {"ID": 1, "Name": {"Hash": 2}},
        ]
        out = eg._season_floors(recs, {}, {}, {}, {})
        assert [f["floor"] for f in out] == [1, 2]
        assert out[0]["name"] == "名2"  # ID 升序：1 在前
        assert out[1]["stage1"]["damage"] == ["Wind"]

    def test_stage_waves_skips_unregistered_and_keeps_wave(self):
        """波次敌方：未注册跳过；跨波同怪保留（wave 序号递增）。"""
        monsters = {1003010: {"name": "怪A", "icon": "Monster_A",
                               "weak": [], "resist": {}, "rank": ""}}
        stages = {30123011: {"level": 80, "waves": [[1003010, 9999999], [1003010]]}}
        out = eg._stage_waves_monsters([30123011], stages, monsters)
        assert out == [
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": [], "resist": {}, "rank": "", "wave": 1},
            {"id": "1003010", "name": "怪A", "icon": "Monster_A",
             "weak": [], "resist": {}, "rank": "", "wave": 2},
        ]


# ─── 赛季敌方 / 目标 ─────────────────────────────────────────────

class TestSeasonExtras:
    def test_monsters_ordered_dedup(self):
        """赛季敌方：各层 StageConfig 波次按层序收集去重（跨波同怪合并）。"""
        recs = [
            {"ID": 1, "EventIDList1": [30123011], "EventIDList2": [30123012]},
            {"ID": 2, "EventIDList1": [30123011]},  # 重复 → 跳过
            {"ID": 3, "EventIDList1": [99999999]},  # 未收录 stage → 空
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

    def test_targets_dedup(self):
        recs = [
            {"ChallengeTargetID": [251, 252]},
            {"ChallengeTargetID": [251]},  # 重复 → 跳过
            {"ChallengeTargetID": [999]},  # 未注册 → 跳过
        ]
        targets = {251: {"text": "目标1", "param": 10}, 252: {"text": "目标2", "param": None}}
        assert eg._season_targets(recs, targets) == [
            {"text": "目标1", "param": 10},
            {"text": "目标2", "param": None},
        ]


# ─── _group_seasons ─────────────────────────────────────────────

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
            buffs={3030146: {"name": "记忆紊流", "desc": "伤害提高 #1[i]%", "param_list": [0.3]}},
            monsters={1003010: {"name": "虚卒", "icon": "Monster_1003010",
                                 "weak": ["Physical"], "resist": {}, "rank": "Elite"}},
            targets={251: {"text": "剩余#1[i]轮以上", "param": 10}},
        )
        entry = out["1001"]
        assert entry["zh"] == "名2"  # 代表记录 = 最小 ID（2001 有 Name {Hash:2}）
        assert entry["live_begin"] == "2023-09-04 04:00:00"
        assert entry["live_end"] == "2023-09-18 04:00:00"
        assert entry["floors"] == 2
        assert entry["countdown"] == 40
        assert entry["damage_types"] == ["Fire"]
        assert entry["floor_damage"] == [{"floor": 2, "stage1": ["Fire"], "stage2": []}]
        assert entry["buffs"] == [{"id": 3030146, "name": "记忆紊流", "desc": "伤害提高 #1[i]%", "param_list": [0.3]}]
        assert entry["monsters"] == [{"id": "1003010", "name": "虚卒", "icon": "Monster_1003010",
                                       "weak": ["Physical"], "resist": {}, "rank": "Elite"}]
        assert entry["targets"] == [{"text": "剩余#1[i]轮以上", "param": 10}]
        # 逐层详情：按 ID 升序，层级增益/目标/波次敌方随层输出
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
             "targets": [{"text": "剩余#1[i]轮以上", "param": 10}]},
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
        assert entry["targets"] == []

    def test_group_name_priority(self, monkeypatch):
        """赛季名取分组名（GroupName）而非首层关卡名（Name 带期数后缀）。"""
        recs = [{"GroupID": 3020, "ID": 30201, "Name": {"Hash": 1}}]  # 首层名"名1"
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


# ─── 异相仲裁 peak ────────────────────────────────────────────

class TestPeakSeasons:
    def test_battle_targets_filtered(self, monkeypatch):
        """BattleTargetConfig：仅 Type=ChallengeTarget 采集，缺名跳过。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"ID": 3000, "Type": "ChallengeTarget", "TargetName": {"Hash": 1},
             "TargetParam": 4},
            {"ID": 3001, "Type": "Other", "TargetName": {"Hash": 2},
             "TargetParam": 9},  # 非挑战目标 → 跳过
            {"ID": 3002, "Type": "ChallengeTarget", "TargetName": {}},  # 缺名 → 跳过
        ])
        monkeypatch.setattr(eg, "clean_text", lambda s: f"c:{s}" if s else "")
        out = eg._load_battle_targets()
        assert out == {3000: {"text": "c:名1", "param": 4}}

    def test_stage_monsters_by_id_only_wanted(self, monkeypatch):
        """StageConfig：仅提取关心的 StageID，波次结构保序保留（含波内重复）。"""
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            {"StageID": 30501011, "Level": 95,
             "MonsterList": [{"Monster0": 3012020, "Monster1": 3013010},
                              {"Monster0": 3012020, "Monster1": 3004012}]},
            {"StageID": 999999, "Level": 10, "MonsterList": [{"Monster0": 1}]},
            {"StageID": 30501012, "Level": 0, "MonsterList": []},
        ])
        out = eg._load_stage_monsters_by_id({30501011, 30501012})
        assert out[30501011] == {"level": 95,
                                 "waves": [[3012020, 3013010], [3012020, 3004012]]}
        assert out[30501012] == {"level": 0, "waves": []}
        assert 999999 not in out

    def test_peak_seasons_full_structure(self, monkeypatch, setup_textmap):
        mc = setup_textmap
        """期 = 3 骑士 + 1 王棋（含绝境变体）；全关卡合并 damage/monsters/buffs。"""
        def fake_load(path):
            name = str(path)
            if name.endswith("ChallengePeakGroupConfig.json"):
                return [{"ID": 1, "Title": {"Hash": 1},
                         "PreLevelIDList": [101, 102, 103], "BossLevelID": 104}]
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
        # 骑士（一）：事件 → Stage → 敌人；目标 3001/3000；标签解析为 MazeBuff 名
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
        # 骑士（二）：Stage 未收录 → 无等级/敌人；骑士（三）：无事件
        assert "level" not in k2 and k2["monsters"] == []
        assert k3["damage"] == [] and k3["targets"] == [] and k3["tags"] == []
        # 王棋：增益 BuffList + 绝境变体（HardTitle/敌人/目标/标签）
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
        # 全关卡合并：敌方去重保序 / 增益仅王棋
        assert entry["monsters"] == [
            {"id": "1003010", "name": "名30", "icon": "Monster_1003010",
             "weak": ["Physical"], "resist": {"Fire": 0.2}, "rank": "Elite",
             "camp": "名40", "stance": 240},
            {"id": "2002010", "name": "名31", "icon": "",
             "weak": [], "resist": {}, "rank": "MinionLv2",
             "camp": "", "stance": 0},
        ]
        assert entry["buffs"] == [{"id": 3033006, "name": "名22",
                                    "desc": "", "param_list": [], "icon": ""}]
