"""monster_common 共享聚合函数契约测试（endgame 赛季敌方 / monster_detail 详情页共用）。

用合成数据验证：模板表（名称/头像/全身立绘/Rank/阵营/韧性/属性）+ 配置表
（弱点/抗性/介绍/技能列表）多表合并；技能全量字段解析；缺名跳过；实例别名回退。
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
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
            {"MonsterTemplateID": 9999999, "ManikinImagePath": ""},  # 无名称 → 跳过
        ]
    if name.endswith("MonsterConfig.json"):
        return [
            {"MonsterID": 8013010, "MonsterTemplateID": 8013010,
             "StanceWeakList": ["Physical", "Ice", "Physical"],
             "DamageTypeResistance": [
                 {"DamageType": "Fire", "Value": {"Value": 0.2}},
                 {"DamageType": "Thunder", "Value": {"Value": 0.2}},
             ],
             "MonsterIntroduction": {"Hash": 10},
             "SkillList": [801301001, 999999]},  # 未注册技能 → 跳过
            # MonsterID 与模板 ID 不一致（9001 实例绑定 9002 模板）→ 按 MonsterTemplateID 回退
            {"MonsterID": 9001, "MonsterTemplateID": 9002,
             "StanceWeakList": ["Quantum"], "DamageTypeResistance": []},
            # 3024012 无配置记录 → 弱点/抗性/介绍空
        ]
    if name.endswith("MonsterCamp.json"):
        return [{"ID": 3, "Name": {"Hash": 20}}]
    if name.endswith("MonsterSkillConfig.json"):
        return [{"SkillID": 801301001, "SkillName": {"Hash": 30},
                 "SkillTag": {"Hash": 31}, "SkillTypeDesc": {"Hash": 32},
                 "DamageType": "Quantum", "AttackType": "Normal",
                 "SkillDesc": {"Hash": 33}, "ParamList": [{"Value": 3}, {"Value": 0.5}]},
                {"SkillID": 999999, "SkillName": {}},  # 无名称 → 不入索引
                {"SkillID": None}]  # 无 ID → 跳过
    return []


class TestLoadMonsters:
    def test_full_fields(self, monkeypatch):
        """模板表 + 配置表 + 技能表全字段合并；弱点去重保序。"""
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[8013010] == {
            "name": "名1",
            "icon": "Monster_8013010",
            "figure": "Monster_8013010",
            "weak": ["Physical", "Ice"],  # 去重保序
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
