import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monster_common as mc  # noqa: E402


def _ids_in(line: str) -> list[int]:
    tail = line.split("（ID：")[-1]
    return sorted(int(tok) for tok in re.findall(r"\d+", tail))


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
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
            "debuff_resist": [{"key": "STAT_CTRL_Frozen", "value": 0.75, "icon": "IconImmuneFrozen"}],
        }

    def test_missing_config_and_icon(self, monkeypatch):
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[3024012] == {
            "name": "名2", "icon": "Monster_3024010", "figure": "",
            "weak": [], "resist": {}, "rank": "MinionLv2",
            "camp": "", "intro": "", "skills": [],
            "stats": {},
            "stat_ratio": {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": 1,
            "elite_group": 1,
            "debuff_resist": [],
        }
        assert "stance" not in out[3024012], "缺 StanceBase ⇒ 不落键（0 是伪造值）"

    def test_missing_base_fields_omit_key_and_warn(self, monkeypatch, caplog):
        tpls = [
            {"MonsterTemplateID": 1001, "MonsterName": {"Hash": 1},
             "HPBase": {"Value": 100}, "AttackBase": {"Value": 10}, "DefenceBase": {"Value": 20}},
            {"MonsterTemplateID": 1002, "MonsterName": {"Hash": 2},
             "StanceBase": "not-a-number", "SpeedBase": {"Value": None},
             "HPBase": {"Value": 100}, "AttackBase": {}, "DefenceBase": {"Value": 20}},
            {"MonsterTemplateID": 1003, "MonsterName": {"Hash": 3},
             "StanceBase": {"Value": 0}, "HPBase": {"Value": 0}, "AttackBase": {"Value": 0},
             "DefenceBase": {"Value": 0}, "SpeedBase": {"Value": 0}},
            {"MonsterTemplateID": 1004, "MonsterName": {"Hash": 4},
             "StanceBase": {"Value": {"Value": 240}}, "HPBase": {"Value": {"Value": 1}},
             "AttackBase": {"Value": 2}, "DefenceBase": {"Value": 3}, "SpeedBase": {"Value": 4}},
        ]
        monkeypatch.setattr(mc, "load_json", lambda p: (
            tpls if str(p).endswith("MonsterTemplateConfig.json") else _fake_load(p)))

        with caplog.at_level("WARNING", logger="converter"):
            out = mc.load_monsters()

        assert "stance" not in out[1001] and "speed" not in out[1001]["stats"]
        assert out[1001]["stats"] == {"hp": 100, "atk": 10, "def": 20}, "有值的维度一个不少"
        assert "stance" not in out[1002] and "speed" not in out[1002]["stats"]
        assert "atk" not in out[1002]["stats"], "空包装 {} 与非数值同待遇"
        assert out[1002]["stats"] == {"hp": 100, "def": 20}

        assert out[1003]["stance"] == 0
        assert out[1003]["stats"] == {"hp": 0, "atk": 0, "def": 0, "speed": 0}

        assert out[1004]["stance"] == 240 and out[1004]["stats"]["hp"] == 1
        assert out[1004]["stats"] == {"hp": 1, "atk": 2, "def": 3, "speed": 4}

        warnings = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        stance_logs = [w for w in warnings if "StanceBase" in w]
        assert len(stance_logs) == 1, f"StanceBase 缺位应汇成 1 行（实际 {stance_logs}）"
        assert "1001" in stance_logs[0] and "1002" in stance_logs[0], "模板 ID 必须可定位"
        assert "1003" not in stance_logs[0] and "1004" not in stance_logs[0], "有值（含 0）的模板不进缺位名单"
        speed_logs = [w for w in warnings if "SpeedBase" in w]
        assert len(speed_logs) == 1 and "1001" in speed_logs[0] and "1002" in speed_logs[0]
        atk_logs = [w for w in warnings if "AttackBase" in w]
        assert len(atk_logs) == 1 and "1002" in atk_logs[0] and "1001" not in atk_logs[0]
        assert len(warnings) == 3, f"应为 SpeedBase / StanceBase / AttackBase 各一行（实际 {warnings}）"
        assert not any("HPBase" in w or "DefenceBase" in w for w in warnings), "有值字段不得告警"

    def test_instance_alias_and_skip(self, monkeypatch):
        monkeypatch.setattr(mc, "load_json", _fake_load)
        out = mc.load_monsters()
        assert out[9002]["weak"] == ["Quantum"]
        assert out[9002]["rank"] == "BigBoss"
        assert out[9001]["weak"] == ["Quantum"]
        assert out[9001]["name"] == "名3"
        assert 9999999 not in out

    def test_alias_carries_own_variant_ratios(self, monkeypatch):
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
        assert variant["name"] == "名1"
        assert variant["stat_ratio"] == {"hp": 0.266667, "atk": 1.5, "def": 0.5, "speed": 1.0}
        assert variant["level_group"] == 3
        assert variant["elite_group"] == 2, "精英组不继承模板的组 1（1002050 vs 100205006 的判据）"
        assert variant["debuff_resist"] == [
            {"key": "STAT_CTRL_Frozen", "value": 1, "icon": "IconImmuneFrozen"},
        ]

    def test_scene_modify_transparency(self, monkeypatch):
        tpl_cfg = {**_fake_load(Path("MonsterConfig.json"))[0],
                   "StanceModifyValue": {"Value": 30}, "SpeedModifyValue": None}
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
        cfg = {"HPModifyRatio": {"Value": {"Value": 5}},
               "AttackModifyRatio": {"Value": None},
               "DefenceModifyRatio": {"Value": -2},
               "SpeedModifyRatio": "not-a-number"}
        assert mc._stat_ratio_from_cfg(cfg) == {
            "hp": 5.0, "atk": 1.0, "def": -2.0, "speed": 1.0,
        }


class TestLoadLevelCurve:
    def test_curve_groups_and_str_keys(self, monkeypatch):
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
        assert curve["2"]["40"] == {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0}
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"HardLevelGroup": None, "Level": 1, "HPRatio": {"Value": 1}},
            {"HardLevelGroup": 1, "Level": None},
        ])
        assert mc.load_level_curve() == {}

    def test_curve_duplicate_key_keeps_first(self, monkeypatch, caplog):
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"HardLevelGroup": 1, "Level": 1, "HPRatio": {"Value": 0.8}},
            {"HardLevelGroup": 1, "Level": 1, "HPRatio": {"Value": 99}},
        ])
        curve = mc.load_level_curve()
        assert curve["1"]["1"]["hp"] == 0.8


class TestLoadEliteGroups:
    def test_groups_str_keys_and_neutral_fallback(self, monkeypatch):
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
        monkeypatch.setattr(mc, "load_json", lambda p: [
            {"EliteGroup": 5, "HPRatio": {"Value": 1.25}},
            {"EliteGroup": 5, "HPRatio": {"Value": 99}},
            {"EliteGroup": None, "HPRatio": {"Value": 1}},
        ])
        out = mc.load_elite_groups()
        assert out["5"]["hp"] == 1.25
        assert list(out) == ["5"]


class TestStageContext:
    def test_carries_three_and_unwraps(self):
        assert mc.stage_context(
            {"Level": 68, "HardLevelGroup": 3, "EliteGroup": {"Value": {"Value": 273}}}
        ) == {"level": 68, "level_group": 3, "elite_group": 273}

    def test_missing_fields_not_emitted(self):
        assert mc.stage_context({"StageID": 1}) == {}
        assert mc.stage_context({"Level": None, "HardLevelGroup": 0}) == {"level_group": 0}, (
            "0 是上游原值（不是缺位），照落；None 才是缺位"
        )


class TestMonsterHpAt:
    CURVE = {"3": {"95": {"hp": 294.42172, "atk": 1, "def": 1, "speed": 1}}}
    ELITE = {"1": {"hp": 1.0}, "2": {"hp": 1.7}, "164": {"hp": 6.5}}

    def test_pi_of_own_and_stage_elite_groups(self):
        info = {"stats": {"hp": 102.3}, "stat_ratio": {"hp": 1}, "elite_group": 2}
        got = mc.monster_hp_at(info, 95, {"level_group": 3, "elite_group": 164}, self.CURVE, self.ELITE)
        assert got == 332818.7

    def test_stage_elite_absent_is_neutral(self):
        info = {"stats": {"hp": 102.3}, "stat_ratio": {"hp": 1}, "elite_group": 2}
        assert mc.monster_hp_at(info, 95, {"level_group": 3}, self.CURVE, self.ELITE) == 51202.9

    def test_half_rounds_up_like_js(self):
        curve = {"1": {"10": {"hp": 0.5}}}
        info = {"stats": {"hp": 0.5}, "stat_ratio": {"hp": 1}, "elite_group": 1}
        assert mc.monster_hp_at(info, 10, {"level_group": 1}, curve, self.ELITE) == 0.3

    def test_missing_piece_returns_none(self):
        ok = {"stats": {"hp": 100}, "stat_ratio": {"hp": 1}, "elite_group": 1}
        stage = {"level_group": 3}
        assert mc.monster_hp_at({"stats": {"atk": 1}}, 95, stage, self.CURVE, self.ELITE) is None
        assert mc.monster_hp_at(ok, 0, stage, self.CURVE, self.ELITE) is None
        assert mc.monster_hp_at(ok, None, stage, self.CURVE, self.ELITE) is None
        assert mc.monster_hp_at(ok, 95, {"level_group": 9}, self.CURVE, self.ELITE) is None
        assert mc.monster_hp_at(ok, 94, stage, self.CURVE, self.ELITE) is None
        no_hp = {"3": {"95": {"atk": 1}}}
        assert mc.monster_hp_at(ok, 95, stage, no_hp, self.ELITE) is None

    def test_non_positive_ratio_is_neutral(self):
        info = {"stats": {"hp": 102.3}, "stat_ratio": {"hp": 0}, "elite_group": 1}
        assert mc.monster_hp_at(info, 95, {"level_group": 3}, self.CURVE, self.ELITE) == 30119.3


class TestMonsterHpPhases:
    CURVE = {"3": {"95": {"hp": 294.42172}}}
    ELITE = {"1": {"hp": 1.0}, "2": {"hp": 1.7}, "164": {"hp": 6.5}}

    INFO = {"stats": {"hp": 102.3}, "stat_ratio": {"hp": 1}, "elite_group": 2}

    def test_each_phase_is_ratio_times_the_same_base(self):
        stage = {"level_group": 3, "elite_group": 164}
        got = mc.monster_hp_phases(self.INFO, 95, stage, self.CURVE, self.ELITE, [1.0, 1.25, 1.0])
        assert got == [332818.7, 416023.4, 332818.7], "阶段 1 的值必须等于单值 hp（同基准 × 1）"
        assert mc.monster_hp_phases(self.INFO, 95, stage, self.CURVE, self.ELITE, [1.0, 1.25, 1.0])[0] == \
            mc.monster_hp_at(self.INFO, 95, stage, self.CURVE, self.ELITE)

    def test_rounding_happens_once_at_the_outermost_layer(self):
        curve = {"1": {"10": {"hp": 0.5}}}
        info = {"stats": {"hp": 0.5}, "stat_ratio": {"hp": 1}, "elite_group": 1}
        assert mc.monster_hp_phases(info, 10, {"level_group": 1}, curve, self.ELITE, [1.0, 1.5]) == [0.3, 0.4]

    def test_single_phase_and_missing_ratios_return_none(self):
        stage = {"level_group": 3, "elite_group": 164}
        for ratios in (None, [], [1.0]):
            assert mc.monster_hp_phases(self.INFO, 95, stage, self.CURVE, self.ELITE, ratios) is None

    def test_missing_chain_piece_returns_none(self):
        stage = {"level_group": 3, "elite_group": 164}
        assert mc.monster_hp_phases({"stats": {"atk": 1}}, 95, stage, self.CURVE, self.ELITE, [1, 2]) is None
        assert mc.monster_hp_phases(self.INFO, 0, stage, self.CURVE, self.ELITE, [1, 2]) is None
        assert mc.monster_hp_phases(self.INFO, 95, {"level_group": 9}, self.CURVE, self.ELITE, [1, 2]) is None
        assert mc.monster_hp_phases(self.INFO, 95, stage, self.CURVE, self.ELITE, [1, 0]) is None
        assert mc.monster_hp_phases(self.INFO, 95, stage, self.CURVE, self.ELITE, [1, None]) is None


class TestPhaseHpRatios:
    @pytest.fixture(autouse=True)
    def _clear_cache(self, monkeypatch, tmp_path):
        monkeypatch.setattr(mc, "_PHASE_HP_RATIOS", None)
        self.tmp = tmp_path

    def _setup(self, monkeypatch, cfgs: dict[str, dict], templates: list[dict],
               skills: list[dict] | None = None, monster_cfg: list[dict] | None = None):
        monkeypatch.setattr(mc, "SOURCE_DIR", self.tmp)
        for rel, body in cfgs.items():
            p = self.tmp / rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(json.dumps(body), encoding="utf-8")

        def fake(path):
            name = str(path)
            if name.endswith("MonsterTemplateConfig.json"):
                return templates
            if name.endswith("MonsterSkillConfig.json"):
                return skills or []
            if name.endswith("MonsterConfig.json"):
                return monster_cfg or []
            raise AssertionError(f"未预期的表：{name}")

        monkeypatch.setattr(mc, "load_json", fake)

    def test_static_fixed_value_and_undeclared_is_neutral(self, monkeypatch):
        self._setup(monkeypatch, {
            "a_Config.json": {"PhaseList": [
                {"PhaseNum": 1},
                {"PhaseNum": 2, "PhaseMaxHPRatio": {"IsDynamic": False, "FixedValue": {"Value": 1.25}}},
            ]},
        }, [{"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"}])
        assert mc.load_phase_hp_ratios() == {1: [1.0, 1.25]}

    def test_phase_order_follows_phase_num_not_array_order(self, monkeypatch):
        self._setup(monkeypatch, {
            "a_Config.json": {"PhaseList": [
                {"PhaseNum": 3, "PhaseMaxHPRatio": {"IsDynamic": False, "FixedValue": {"Value": 3}}},
                {"PhaseNum": 1},
                {"PhaseNum": 2, "PhaseMaxHPRatio": {"IsDynamic": False, "FixedValue": {"Value": 2}}},
            ]},
        }, [{"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"}])
        assert mc.load_phase_hp_ratios() == {1: [1.0, 2.0, 3.0]}

    def test_dynamic_hash_resolves_through_skill_param(self, monkeypatch):
        self._setup(monkeypatch, {
            "a_Config.json": {
                "PhaseList": [
                    {"PhaseNum": 1},
                    {"PhaseNum": 2, "PhaseMaxHPRatio": {
                        "IsDynamic": True, "PostfixExpr": {"DynamicHashes": [960730890]}}},
                ],
                "DynamicValues": {"Floats": {"960730890": {"ReadInfo": {
                    "Type": "SkillParam", "TriggerKey": "P3_HpRatioAdded", "Index": 1}}}},
            },
        }, [{"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"}],
            skills=[{"SkillID": 7001, "SkillTriggerKey": "P3_HpRatioAdded",
                     "ParamList": [{"Value": 0.5}, {"Value": 4}]}],
            monster_cfg=[{"MonsterTemplateID": 1, "SkillList": [7001]}])
        assert mc.load_phase_hp_ratios() == {1: [1.0, 4.0]}

    def test_dynamic_without_matching_skill_skips_the_template(self, monkeypatch, caplog):
        self._setup(monkeypatch, {
            "a_Config.json": {
                "PhaseList": [{"PhaseNum": 1}, {"PhaseNum": 2, "PhaseMaxHPRatio": {
                    "IsDynamic": True, "PostfixExpr": {"DynamicHashes": [1]}}}],
                "DynamicValues": {"Floats": {"1": {"ReadInfo": {
                    "Type": "SkillParam", "TriggerKey": "Other", "Index": 0}}}},
            },
        }, [{"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"}],
            skills=[{"SkillID": 7001, "SkillTriggerKey": "P3_HpRatioAdded", "ParamList": [{"Value": 4}]}],
            monster_cfg=[{"MonsterTemplateID": 1, "SkillList": [7001]}])
        assert mc.load_phase_hp_ratios() == {}

    def test_non_skillparam_and_unresolvable_skip_the_whole_template(self, monkeypatch, caplog):
        self._setup(monkeypatch, {
            "a_Config.json": {
                "PhaseList": [{"PhaseNum": 1}, {"PhaseNum": 2, "PhaseMaxHPRatio": {
                    "IsDynamic": True, "PostfixExpr": {"DynamicHashes": [1]}}}],
                "DynamicValues": {"Floats": {"1": {"ReadInfo": {"Type": "ClientOnly", "Index": 0}}}},
            },
            "b_Config.json": {"PhaseList": [
                {"PhaseNum": 1},
                {"PhaseNum": 2, "PhaseMaxHPRatio": {"IsDynamic": True, "PostfixExpr": {"DynamicHashes": [7]}}},
            ]},
            "c_Config.json": {"PhaseList": [
                {"PhaseNum": 1},
                {"PhaseNum": 2, "PhaseMaxHPRatio": {"IsDynamic": False, "FixedValue": {"Value": 0}}},
            ]},
            "d_Config.json": {"PhaseList": [
                {"PhaseNum": 1},
                {"PhaseNum": 3, "PhaseMaxHPRatio": {"IsDynamic": False, "FixedValue": {"Value": 2}}},
            ]},
            "e_Config.json": {"PhaseList": [{"PhaseNum": 1}]},
        }, [
            {"MonsterTemplateID": t, "JsonConfig": f"{c}_Config.json"}
            for t, c in zip((1, 2, 3, 4, 5), "abcde")
        ])
        assert mc.load_phase_hp_ratios() == {}
        warnings = [r.getMessage() for r in caplog.records if r.levelname == "WARNING"]
        unparsed = [w for w in warnings if "PhaseMaxHPRatio 无法解析" in w]
        unordered = [w for w in warnings if "PhaseNum 不是 1..n 连续" in w]
        assert len(unparsed) == 1 and len(unordered) == 1, f"各汇成一行（实际 {warnings}）"
        assert _ids_in(unparsed[0]) == [1, 2, 3], "动态解析失败的三个模板，不含「有洞」与单阶段"
        assert _ids_in(unordered[0]) == [4]

    def test_missing_entity_config_warns_and_is_skipped(self, monkeypatch, caplog):
        self._setup(monkeypatch, {
            "a_Config.json": {"PhaseList": [{"PhaseNum": 1}, {"PhaseNum": 2}]},
        }, [
            {"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"},
            {"MonsterTemplateID": 2, "JsonConfig": "gone_Config.json"},
            {"MonsterTemplateID": 3},
        ])
        assert mc.load_phase_hp_ratios() == {1: [1.0, 1.0]}
        missing = [r.getMessage() for r in caplog.records if "指向不存在的实体配置" in r.getMessage()]
        assert len(missing) == 1 and "2" in missing[0] and "3" not in missing[0], "无指针不算「指向不存在」"

    def test_result_is_cached_across_calls(self, monkeypatch):
        calls: list[str] = []

        def fake(path):
            name = str(path)
            calls.append(name)
            if name.endswith("MonsterTemplateConfig.json"):
                return [{"MonsterTemplateID": 1, "JsonConfig": "a_Config.json"}]
            if name.endswith("MonsterSkillConfig.json"):
                return [{"SkillID": 1}]
            return []
        self._setup(monkeypatch, {"a_Config.json": {"PhaseList": [{"PhaseNum": 1}, {"PhaseNum": 2}]}}, [])
        monkeypatch.setattr(mc, "load_json", fake)
        first = mc.load_phase_hp_ratios()
        after_first = len(calls)
        second = mc.load_phase_hp_ratios()
        assert first == second == {1: [1.0, 1.0]}
        assert after_first == 3, f"首次应读 3 张表（实际 {after_first}）"
        assert len(calls) == after_first, "第二次调用应直接命中缓存、不再读表"
