import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monster_detail as md  # noqa: E402

@pytest.fixture(autouse=True)
def fake_monsters(monkeypatch):
    monkeypatch.setattr(md, "load_level_curve", lambda: {
        "1": {"80": {"hp": 148.01102, "atk": 30.684488, "def": 4.761905, "speed": 1.2}},
    })
    monkeypatch.setattr(md, "load_elite_groups", lambda: {
        "1": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0, "stance": 1.0},
        "2": {"hp": 1.7, "atk": 0.8, "def": 1.0, "speed": 1.0, "stance": 1.0},
    })
    monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: {})
    monkeypatch.setattr(md, "load_drops", lambda: {
        8013010: [{"world_level": None, "avatar_exp": 36, "items": [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}]}],
    })
    monkeypatch.setattr(md, "load_appearances", lambda: {
        8013010: {"total": 12, "groups": [
            {"key": "endgame", "count": 12, "samples": [{"id": 1, "name": "于枯冬之中"}]},
        ]},
    })
    monkeypatch.setattr(md, "load_phases", lambda: {
        1002011: [{"phase_id": 1, "weak": ["Ice"], "resist": {"Fire": 0.2}}],
    })
    monkeypatch.setattr(md, "load_boss_guides", lambda: {})
    monkeypatch.setattr(md, "load_skill_extra_effects", lambda: {})
    monkeypatch.setattr(md, "load_monsters", lambda: {
        8013010: {
            "name": "反物质军团·践踏者", "icon": "Monster_8013010",
            "figure": "Monster_8013010", "rank": "Elite", "camp": "反物质军团",
            "stance": 300, "weak": ["Physical", "Wind"],
            "resist": {"Fire": 0.2, "Quantum": 0.2},
            "intro": "介绍文本",
            "stats": {"hp": 1023, "atk": 18, "def": 210, "speed": 100},
            "stat_ratio": {"hp": 1.2, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 3,
            "elite_group": 2,
            "stance_modify": 30, "speed_modify": -44,
            "skills": [{
                "id": 801301001, "name": "践踏", "tag": "单攻",
                "type_desc": "技能", "damage_type": "Quantum",
                "attack_type": "Normal", "desc": "造成伤害",
                "param_list": [3],
            }],
        },
        1002011: {
            "name": "虚卒·掠夺者", "icon": "Monster_1002011",
            "figure": "Monster_1002011", "rank": "MinionLv2", "camp": "",
            "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 100, "atk": 10, "def": 20, "speed": 90},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "skills": [],
        },
        1002013: {
            "name": "虚卒·掠夺者（缺基准）", "icon": "Monster_1002013",
            "figure": "Monster_1002013", "rank": "MinionLv2", "camp": "",
            "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 100, "atk": 10, "def": 20},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "skills": [],
        },
        8013011: {
            "name": "反物质军团·践踏者（完整）", "icon": "Monster_8013010",
            "figure": "Monster_8013010", "rank": "Elite", "camp": "",
            "stance": 0, "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 1, "atk": 1, "def": 1, "speed": 1},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1, "skills": [],
        },
        8013012: {
            "name": "反物质军团·践踏者（幻象）", "icon": "Monster_8013010",
            "figure": "Monster_9999999", "rank": "Elite", "camp": "",
            "stance": 0, "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 1, "atk": 1, "def": 1, "speed": 1},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1, "skills": [],
        },
    })
    monkeypatch.setattr(md, "catalog_rows", lambda _facets=None: [
        {"id": 8013010, "name": "反物质军团·践踏者", "icon": "Monster_8013010"},
        {"id": 8013011, "name": "反物质军团·践踏者（完整）", "icon": "Monster_8013010"},
        {"id": 8013012, "name": "反物质军团·践踏者（幻象）", "icon": "Monster_8013010"},
        {"id": 1002011, "name": "虚卒·掠夺者", "icon": "Monster_1002011"},
    ])
    saved: dict[str, dict] = {}
    monkeypatch.setattr(md, "save_json", lambda data, path: saved.__setitem__(path.name, data))
    monkeypatch.setattr(Path, "mkdir", lambda *a, **k: None)
    return saved

class TestConvert:
    def test_output_structure(self, fake_monsters):
        md.convert()
        assert set(fake_monsters.keys()) == {
            "8013010.json", "8013011.json", "8013012.json", "1002011.json", "1002013.json",
            "monster-level-curve.json", "monster-elite-group.json",
        }
        assert fake_monsters["monster-level-curve.json"] == {
            "1": {"80": {"hp": 148.01102, "atk": 30.684488, "def": 4.761905, "speed": 1.2}},
        }
        assert fake_monsters["monster-elite-group.json"]["2"]["hp"] == 1.7
        d = fake_monsters["8013010.json"]
        assert d["id"] == 8013010
        assert d["name"] == "反物质军团·践踏者"
        assert d["figure"] == "Monster_8013010"
        assert d["weak"] == ["Physical", "Wind"]
        assert d["resist"] == {"Fire": 0.2, "Quantum": 0.2}
        assert d["stats"] == {"hp": 1023, "atk": 18, "def": 210, "speed": 100}
        assert d["stat_ratio"] == {"hp": 1.2, "atk": 1.0, "def": 1.0, "speed": 1.0}
        assert d["level_group"] == 3
        assert d["elite_group"] == 2
        assert d["stance_modify"] == 30 and d["speed_modify"] == -44
        assert "stance_modify" not in fake_monsters["1002011.json"]
        assert "speed_modify" not in fake_monsters["1002011.json"]
        assert d["skills"] == [{
            "id": 801301001, "name": "践踏", "tag": "单攻",
            "type_desc": "技能", "damage_type": "Quantum",
            "attack_type": "Normal", "desc": "造成伤害", "param_list": [3],
        }]
        assert fake_monsters["1002011.json"]["intro"] == ""
        assert fake_monsters["1002011.json"]["skills"] == []

    def test_missing_base_keys_are_omitted_not_zero(self, fake_monsters):
        md.convert()
        d = fake_monsters["1002013.json"]
        assert "stance" not in d, "缺 StanceBase ⇒ 不落键"
        assert d["stats"] == {"hp": 100, "atk": 10, "def": 20}, "有值的维度保留，缺的不落键"
        assert "speed" not in d["stats"]
        assert fake_monsters["1002011.json"]["stats"] == {"hp": 100, "atk": 10, "def": 20, "speed": 90}

    def test_extra_blocks_keyed_by_template(self, fake_monsters):
        md.convert()
        d = fake_monsters["8013010.json"]
        assert d["drops"] == [{
            "world_level": None, "avatar_exp": 36,
            "items": [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}],
        }]
        assert d["appearances"] == {
            "total": 12,
            "groups": [{"key": "endgame", "count": 12, "samples": [{"id": 1, "name": "于枯冬之中"}]}],
        }
        assert "phases" not in d, "阶段只挂在有数据的模板上"
        assert fake_monsters["1002011.json"]["phases"] == [
            {"phase_id": 1, "weak": ["Ice"], "resist": {"Fire": 0.2}},
        ]

    def test_guide_phases_keyed_by_template(self, fake_monsters, monkeypatch):
        monkeypatch.setattr(md, "load_boss_guides", lambda: {
            8013010: {
                "traits": [{"id": 1, "name": "坚防守备"}],
                "phases": [{"id": 10011, "name": "阶段一：浮翠流丹", "desc": "机制说明",
                            "answer": "应对策略：…", "skills": [{"name": "如何削韧", "desc": "答"}]}],
            },
            1002011: {"traits": [{"id": 2, "name": "只有首领特性"}]},
        })
        md.convert()
        assert fake_monsters["8013010.json"]["guide_phases"] == [{
            "id": 10011, "name": "阶段一：浮翠流丹", "desc": "机制说明",
            "answer": "应对策略：…", "skills": [{"name": "如何削韧", "desc": "答"}],
        }]
        assert "guide_phases" not in fake_monsters["1002011.json"], "只有首领特性 → 不落键（页面上屏的只有阶段）"
        assert "traits" not in fake_monsters["8013010.json"], "首领特性不进详情 payload（只取阶段）"

    def test_art_shared_prefers_same_figure_peer(self, fake_monsters):
        md.convert()
        assert fake_monsters["8013010.json"]["art_shared"] == {
            "id": 8013011, "name": "反物质军团·践踏者（完整）", "figure": True, "forms": 3,
        }, "立绘相同的同伴优先被点名"
        assert fake_monsters["8013011.json"]["art_shared"] == {
            "id": 8013010, "name": "反物质军团·践踏者", "figure": True, "forms": 3,
        }
        assert fake_monsters["8013012.json"]["art_shared"] == {
            "id": 8013010, "name": "反物质军团·践踏者", "figure": False, "forms": 3,
        }, "没有立绘相同的同伴时退回第一个并标记 figure=false"
        assert "art_shared" not in fake_monsters["1002011.json"], "没有同卡面同伴 → 不落键"

    def test_skill_extra_effects_attached_per_skill(self, fake_monsters, monkeypatch):
        monkeypatch.setattr(md, "load_skill_extra_effects", lambda: {
            801301001: [{"id": 10000027, "name": "额外回合", "desc": "描述", "param_list": [0.3]}],
        })
        md.convert()
        d = fake_monsters["8013010.json"]
        assert d["skills"][0]["extra_effects"] == [
            {"id": 10000027, "name": "额外回合", "desc": "描述", "param_list": [0.3]},
        ]
        assert d["skills"][0]["name"] == "践踏", "不得改写技能自身字段"
        assert fake_monsters["1002011.json"]["skills"] == [], "无技能 → 不产出条目"
