"""monster_detail 详情转换器契约测试（合成数据，不依赖真实源数据）。

验证 convert()：按模板 ID 升序逐文件输出，字段结构与共享聚合表对齐。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monster_detail as md  # noqa: E402

@pytest.fixture(autouse=True)
def fake_monsters(monkeypatch):
    """mock 共享聚合表 + 侵入归属 + save_json 捕获输出（不读真实源数据）。
    战斗数值合成链字段（ADR 0040）：聚合表直供 stat_ratio / level_group。"""
    monkeypatch.setattr(md, "load_level_curve", lambda: {
        "1": {"80": {"hp": 148.01102, "atk": 30.684488, "def": 4.761905, "speed": 1.2}},
    })
    monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: {})
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
            "stance": 0, "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 100, "atk": 10, "def": 20, "speed": 90},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "skills": [],
        },
    })
    saved: dict[str, dict] = {}
    monkeypatch.setattr(md, "save_json", lambda data, path: saved.__setitem__(path.name, data))
    monkeypatch.setattr(Path, "mkdir", lambda *a, **k: None)
    return saved

class TestConvert:
    def test_output_structure(self, fake_monsters):
        """每怪物一个文件：字段完整、技能为全量、intro 为空串仍输出；曲线单点另落一份。"""
        md.convert()
        assert set(fake_monsters.keys()) == {
            "8013010.json", "1002011.json", "monster-level-curve.json",
        }
        # 曲线是独立共享单点（供 2722 份详情与目录共用），不进任何怪物 payload
        assert fake_monsters["monster-level-curve.json"] == {
            "1": {"80": {"hp": 148.01102, "atk": 30.684488, "def": 4.761905, "speed": 1.2}},
        }
        d = fake_monsters["8013010.json"]
        assert d["id"] == 8013010
        assert d["name"] == "反物质军团·践踏者"
        assert d["figure"] == "Monster_8013010"
        assert d["weak"] == ["Physical", "Wind"]
        assert d["resist"] == {"Fire": 0.2, "Quantum": 0.2}
        assert d["stats"] == {"hp": 1023, "atk": 18, "def": 210, "speed": 100}
        assert d["stat_ratio"] == {"hp": 1.2, "atk": 1.0, "def": 1.0, "speed": 1.0}
        assert d["level_group"] == 3
        assert d["skills"] == [{
            "id": 801301001, "name": "践踏", "tag": "单攻",
            "type_desc": "技能", "damage_type": "Quantum",
            "attack_type": "Normal", "desc": "造成伤害", "param_list": [3],
        }]
        assert fake_monsters["1002011.json"]["intro"] == ""
        assert fake_monsters["1002011.json"]["skills"] == []
