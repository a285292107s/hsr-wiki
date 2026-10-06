"""monster_common 共享聚合函数契约测试（endgame 赛季敌方 / monster_detail 详情页共用）。

用合成数据验证：模板表（名称/头像/全身立绘/Rank/阵营/韧性/属性）+ 配置表
（弱点/抗性/介绍/技能列表）多表合并；技能全量字段解析；缺名跳过；实例别名回退。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monster_common as mc  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件。"""
    monkeypatch.setattr(mc, "resolve_text", lambda ref, clean=False: "" if not ref else f"名{ref.get('Hash', 0)}")

def _fake_load(path):
    name = str(path)
    if name.endswith("MonsterTemplateConfig.json"):
        return [
            {"MonsterTemplateID": 8013010, "MonsterName": {"Hash": 1},
             "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_8013010.png",
             "ImagePath": "SpriteOutput/MonsterFigure/Monster_8013010.png",
             "Rank": "Elite", "MonsterCampID": 3, "StanceBase": {"Value": 240},
             "HPBase": {"Value": 1023}, "AttackBase": {"Value": 18},
             "DefenceBase": {"Value": 210}, "SpeedBase": {"Value": 100}},
            {"MonsterTemplateID": 3024012, "MonsterName": {"Hash": 2},
             "ManikinImagePath": "SpriteOutput/MonsterMiddleIcon/Monster_3024010.png",
             "Rank": "MinionLv2"},
            {"MonsterTemplateID": 9002, "MonsterName": {"Hash": 3},
             "ManikinImagePath": "", "Rank": "BigBoss"},
            {"MonsterTemplateID": 9999999, "ManikinImagePath": ""},
        ]
    if name.endswith("MonsterConfig.json"):
        return [
            {"MonsterID": 8013010, "MonsterTemplateID": 8013010,
             "StanceWeakList": ["Physical", "Ice", "Physical"],
             "DamageTypeResistance": [
                 {"DamageType": "Fire", "Value": {"Value": 0.2}},
                 {"DamageType": "Thunder", "Value": {"Value": 0.2}},
             ],
             "DebuffResist": [
                 {"Key": "STAT_CTRL_Frozen", "Value": {"Value": 0.75}},
                 {"Key": "STAT_NoIcon", "Value": {"Value": 1}},
                 {"Key": "STAT_Unknown", "Value": {"Value": 1}},
             ],
             "MonsterIntroduction": {"Hash": 10},
             "SkillList": [801301001, 999999]},
            {"MonsterID": 9001, "MonsterTemplateID": 9002,
             "StanceWeakList": ["Quantum"], "DamageTypeResistance": []},
        ]
    if name.endswith("MonsterStatusResistanceType.json"):
        return [
            {"Type": "STAT_CTRL_Frozen",
             "Icon": "SpriteOutput/UI/Avatar/Icon/IconImmuneFrozen.png"},
            {"Type": "STAT_NoIcon", "Icon": ""},
        ]
    if name.endswith("MonsterCamp.json"):
        return [{"ID": 3, "Name": {"Hash": 20}}]
    if name.endswith("MonsterSkillConfig.json"):
        return [{"SkillID": 801301001, "SkillName": {"Hash": 30},
                 "SkillTag": {"Hash": 31}, "SkillTypeDesc": {"Hash": 32},
                 "DamageType": "Quantum", "AttackType": "Normal",
                 "SkillDesc": {"Hash": 33}, "ParamList": [{"Value": 3}, {"Value": 0.5}]},
                {"SkillID": 999999, "SkillName": {}},
                {"SkillID": None}]
    return []

class TestLoadMonsters:
    def test_full_fields(self, monkeypatch):
        """模板表 + 配置表 + 技能表全字段合并；弱点去重保序。
        战斗数值合成链字段（ADR 0040）：本模板自带 config 记录但无修饰比字段 → 中性 1 / 组 1。"""
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[8013010] == {
            "name": "名1",
            "icon": "Monster_8013010",
            "figure": "Monster_8013010",
            "weak": ["Physical", "Ice"],
            "resist": {"Fire": 0.2, "Thunder": 0.2},
            "rank": "Elite", "camp": "名20",
            "intro": "名10",
            "skills": [{
                "id": 801301001, "name": "名30", "tag": "名31",
                "type_desc": "名32", "damage_type": "Quantum",
                "attack_type": "Normal", "desc": "名33",
                "param_list": [3, 0.5],
            }],
            "stance": 240,
            "stats": {"hp": 1023, "atk": 18, "def": 210, "speed": 100},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "elite_group": 1,
            # 效果抵抗：只留图标表里登记的状态类别（无图标 / 未登记的 key 跳过）
            "debuff_resist": [{"key": "STAT_CTRL_Frozen", "value": 0.75, "icon": "IconImmuneFrozen"}],
        }

    def test_missing_config_and_icon(self, monkeypatch):
        """无配置记录 → 弱点/抗性/介绍空；无全身立绘 → figure 空；缺属性 → 0。"""
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[3024012] == {
            "name": "名2", "icon": "Monster_3024010", "figure": "",
            "weak": [], "resist": {}, "rank": "MinionLv2",
            "camp": "", "intro": "", "skills": [],
            "stance": 0, "stats": {"hp": 0, "atk": 0, "def": 0, "speed": 0},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "elite_group": 1,
            "debuff_resist": [],
        }

    def test_instance_alias_and_skip(self, monkeypatch):
        """实例别名：MonsterID（9001）≠ 模板 ID → 指向同模板信息（波次引用命中）；
        无名称模板不入表。"""
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[9002]["weak"] == ["Quantum"]
        assert out[9002]["rank"] == "BigBoss"
        assert out[9001]["weak"] == ["Quantum"]
        assert out[9001]["name"] == "名3"
        assert 9999999 not in out

    def test_alias_carries_own_variant_ratios(self, monkeypatch):
        """别名变体的修饰比/难度组/精英组用**它自己**的 config 记录，不沿用模板（ADR 0040 决策 3 /
        ADR 0049）：同模板不同档位正是靠这几项区分；效果抵抗同理逐实例取（双层 ValueWrap 一并解开）。"""
        extra_cfg = {
            **_fake_load(Path("MonsterConfig.json"))[0],
            "MonsterID": 801301099, "MonsterTemplateID": 8013010,
            "HPModifyRatio": {"Value": 0.266667},
            "AttackModifyRatio": {"Value": 1.5},
            "DefenceModifyRatio": {"Value": {"Value": 0.5}},
            "HardLevelGroup": 3,
            "EliteGroup": 2,
            "DebuffResist": [{"Key": "STAT_CTRL_Frozen", "Value": {"Value": {"Value": 1}}}],
        }
        monkeypatch.setattr(mc, "load_json", lambda p: (
            [extra_cfg] if str(p).endswith("MonsterConfig.json") else _fake_load(p)))
        out = mc.load_monsters()
        variant = out[801301099]
        assert variant["_tpl"] == 8013010
        assert variant["name"] == "名1"          # 名称/立绘等仍是模板家族信息
        assert variant["stat_ratio"] == {"hp": 0.266667, "atk": 1.5, "def": 0.5, "speed": 1.0}
        assert variant["level_group"] == 3
        assert variant["elite_group"] == 2, "精英组不继承模板的组 1（1002050 vs 100205006 的判据）"
        assert variant["debuff_resist"] == [
            {"key": "STAT_CTRL_Frozen", "value": 1, "icon": "IconImmuneFrozen"},
        ]

    def test_scene_modify_transparency(self, monkeypatch):
        """场景修正值（`{Stance,Speed}ModifyValue`）只作**透明度**透出：原值落盘（含负值）、
        非空才落键、**实例以自己的记录为准且不继承模板的**（否则会给该实例凭空多出一个标注）；
        绝不并入 stance / stats.speed（ADR 0040：场景系数不合成，加法位置无据可验）。"""
        tpl_cfg = {**_fake_load(Path("MonsterConfig.json"))[0],
                   "StanceModifyValue": {"Value": 30}, "SpeedModifyValue": None}
        # 实例 1：自己两条都有（双层包装）；实例 2：template 有 +30 但自己无值 → 不得继承
        inst_a = {"MonsterID": 801301099, "MonsterTemplateID": 8013010,
                  "StanceWeakList": [], "DamageTypeResistance": [],
                  "StanceModifyValue": {"Value": {"Value": -60}},
                  "SpeedModifyValue": {"Value": -44}}
        inst_b = {"MonsterID": 801301098, "MonsterTemplateID": 8013010,
                  "StanceWeakList": [], "DamageTypeResistance": []}
        monkeypatch.setattr(mc, "load_json", lambda p: (
            [tpl_cfg, inst_a, inst_b] if str(p).endswith("MonsterConfig.json") else _fake_load(p)))
        out = mc.load_monsters()

        assert out[8013010]["stance_modify"] == 30, "模板自带的修正值也要落"
        assert "speed_modify" not in out[8013010], "缺位不落键"
        assert out[8013010]["stance"] == 240, "修正值不得并入 stance"
        assert out[801301099]["stance_modify"] == -60, "实例用自己的记录（双层包装逐层解）"
        assert out[801301099]["speed_modify"] == -44
        assert "stance_modify" not in out[801301098], "实例无值时不继承模板的修正值"
        assert "speed_modify" not in out[801301098]

    def test_stat_ratio_double_wrap_and_garbage(self, monkeypatch):
        """双层 ValueWrap（{Value:{Value:n}}）逐层解；非数值按中性 1。
        数值（含负值）原样透传——语义同样是修正的透明度，不静默改写官方数值。"""
        cfg = {"HPModifyRatio": {"Value": {"Value": 5}},
               "AttackModifyRatio": {"Value": None},
               "DefenceModifyRatio": {"Value": -2},
               "SpeedModifyRatio": "not-a-number"}
        assert mc._stat_ratio_from_cfg(cfg) == {
            "hp": 5.0, "atk": 1.0, "def": -2.0, "speed": 1.0,
        }


class TestLoadLevelCurve:
    def test_curve_groups_and_str_keys(self, monkeypatch):
        """难度组 → 等级 → 四维曲线；键全部字符串化（JSON 无整型键）。"""
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"HardLevelGroup": 1, "Level": 1, "HPRatio": {"Value": 0.8},
             "AttackRatio": {"Value": 0.64}, "DefenceRatio": {"Value": 1},
             "SpeedRatio": {"Value": 1}},
            {"HardLevelGroup": 1, "Level": 80, "HPRatio": {"Value": 148.01102},
             "AttackRatio": {"Value": 30.684488}, "DefenceRatio": {"Value": 4.761905},
             "SpeedRatio": {"Value": 1.2}},
            {"HardLevelGroup": 2, "Level": 40, "HPRatio": {"Value": None}},
        ])
        curve = mc.load_level_curve()
        assert curve["1"]["1"] == {"hp": 0.8, "atk": 0.64, "def": 1.0, "speed": 1.0}
        assert curve["1"]["80"]["hp"] == 148.01102
        # 缺位曲线值按中性 1 组合：比率维度四项都有键
        assert curve["2"]["40"] == {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0}
        # 垃圾行（缺组/缺等级）不入表
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"HardLevelGroup": None, "Level": 1, "HPRatio": {"Value": 1}},
            {"HardLevelGroup": 1, "Level": None},
        ])
        assert mc.load_level_curve() == {}

    def test_curve_duplicate_key_keeps_first(self, monkeypatch, caplog):
        """同一 (组, 等级) 重复出现 → 保留首条并告警，不静默覆盖。"""
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"HardLevelGroup": 1, "Level": 1, "HPRatio": {"Value": 0.8}},
            {"HardLevelGroup": 1, "Level": 1, "HPRatio": {"Value": 99}},
        ])
        curve = mc.load_level_curve()
        assert curve["1"]["1"]["hp"] == 0.8


class TestLoadEliteGroups:
    def test_groups_str_keys_and_neutral_fallback(self, monkeypatch):
        """精英组 → 五维倍率；键字符串化；缺位/垃圾值按中性 1（ADR 0049）。"""
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"EliteGroup": 1, "HPRatio": {"Value": 1}, "AttackRatio": {"Value": 0.7},
             "DefenceRatio": {"Value": {"Value": 1}}},
            {"EliteGroup": 2, "HPRatio": {"Value": 1.7}, "AttackRatio": {"Value": 0.8},
             "SpeedRatio": None, "StanceRatio": {"Value": 1}},
        ])
        out = mc.load_elite_groups()
        assert out["2"] == {"hp": 1.7, "atk": 0.8, "def": 1.0, "speed": 1.0, "stance": 1.0}
        assert out["1"]["stance"] == 1.0, "未登记的维度也落键（中性 1），前端无需判键是否存在"

    def test_elite_group_duplicate_and_garbage(self, monkeypatch):
        """重复组号保留首条并告警；缺组号的垃圾行不入表。"""
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"EliteGroup": 5, "HPRatio": {"Value": 1.25}},
            {"EliteGroup": 5, "HPRatio": {"Value": 99}},
            {"EliteGroup": None, "HPRatio": {"Value": 1}},
        ])
        out = mc.load_elite_groups()
        assert out["5"]["hp"] == 1.25
        assert list(out) == ["5"]
