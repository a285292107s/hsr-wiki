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
    战斗数值合成链字段（ADR 0040/0049）：聚合表直供 stat_ratio / level_group / elite_group。"""
    monkeypatch.setattr(md, "load_level_curve", lambda: {
        "1": {"80": {"hp": 148.01102, "atk": 30.684488, "def": 4.761905, "speed": 1.2}},
    })
    monkeypatch.setattr(md, "load_elite_groups", lambda: {
        "1": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0, "stance": 1.0},
        "2": {"hp": 1.7, "atk": 0.8, "def": 1.0, "speed": 1.0, "stance": 1.0},
    })
    monkeypatch.setattr(md, "load_invasion_map", lambda _monsters: {})
    # 三块附加数据（monster_extra）也要挡掉：否则测试会去读真实源表（既慢又与合成数据无关）
    monkeypatch.setattr(md, "load_drops", lambda: {
        8013010: [{"world_level": None, "avatar_exp": 36, "items": [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}]}],
    })
    monkeypatch.setattr(md, "load_appearances", lambda: {
        8013010: {"total": 12, "samples": [{"id": 1, "name": "于枯冬之中"}]},
    })
    monkeypatch.setattr(md, "load_phases", lambda: {
        1002011: [{"phase_id": 1, "weak": ["Ice"], "resist": {"Fire": 0.2}}],
    })
    # 技能附带效果（同一 FK 联结）也要挡掉，否则会去读真实源表；默认空表，
    # 「有效果才落键」由 test_skill_extra_effects_attached_per_skill 自己补桩
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
            # 实例修正值：**不在转换期合成**，原值随 payload 给前端（等级滑条要实时合成）
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
            "stance": 0, "weak": [], "resist": {}, "intro": "",
            "stats": {"hp": 100, "atk": 10, "def": 20, "speed": 90},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "skills": [],
        },
        # 同卡面三人组：8013011 立绘相同、8013012 立绘不同（`_art_shared` 的两个分支都要能测到）
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
    # 目录全集（`monsters.catalog_rows`）要挡掉，否则会去读真实 MonsterTemplateConfig
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
        """每怪物一个文件：字段完整、技能为全量、intro 为空串仍输出；曲线单点另落一份。"""
        md.convert()
        assert set(fake_monsters.keys()) == {
            "8013010.json", "8013011.json", "8013012.json", "1002011.json",
            "monster-level-curve.json", "monster-elite-group.json",
        }
        # 曲线与精英组倍率都是独立共享单点（供 2722 份详情与目录共用），不进任何怪物 payload
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
        # 实例修正值原值落盘（前端在等级滑条上实时合成，见 ADR 0045）；模板无修正则不落键
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

    def test_extra_blocks_keyed_by_template(self, fake_monsters):
        """掉落/出没/阶段三块按**模板归属**写入；无数据的怪物不落键（不是空数组占位）。"""
        md.convert()
        d = fake_monsters["8013010.json"]
        assert d["drops"] == [{
            "world_level": None, "avatar_exp": 36,
            "items": [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}],
        }]
        assert d["appearances"] == {"total": 12, "samples": [{"id": 1, "name": "于枯冬之中"}]}
        assert "phases" not in d, "阶段只挂在有数据的模板上"
        assert fake_monsters["1002011.json"]["phases"] == [
            {"phase_id": 1, "weak": ["Ice"], "resist": {"Fire": 0.2}},
        ]

    def test_art_shared_prefers_same_figure_peer(self, fake_monsters):
        """同卡面图标（名字不同）→ `art_shared`：优先点名**立绘相同**的同伴；只有立绘不同的同伴时
        明说 `figure: false`（页面据此改口径——不能把「同卡面」说成「共用美术」）。"""
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
        """附带效果按技能 ID 挂在该技能条目上；无效果的技能不落键（不是空数组占位）。"""
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
