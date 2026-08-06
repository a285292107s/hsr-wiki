"""character_detail 纯函数契约测试。

用合成数据验证各构建函数的核心行为，不依赖真实源数据：
- _build_skills：HideInUI/TriggerKey 过滤、等级分组、参数解包
- _build_servant_skills：忆灵技能不过滤
- _build_ranks：按 Rank 序号键控
- _build_stats：突破阶段映射
- _build_relics：按角色命中
- _normalize_tree_icon：1{avatar_id} 伪目录归一，跨 ID 引用不动
- _build_memosprite：ServantID-10000 归属 + 开拓者配对

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import character_detail as cd  # noqa: E402


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实 50MB 文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})


# ─── _build_skills ──────────────────────────────────────────────

class TestBuildSkills:
    def test_levels_grouped_and_sorted(self):
        data = [
            {"SkillID": 1, "Level": 3, "AttackType": "Normal", "ParamList": [{"Value": 3}]},
            {"SkillID": 1, "Level": 1, "AttackType": "Normal", "ParamList": [{"Value": 1}]},
        ]
        result = cd._build_skills(data, [1])
        assert list(result["1"]["level"].keys()) == ["1", "3"]
        assert result["1"]["level"]["1"]["param_list"] == [1]
        assert result["1"]["level"]["3"]["param_list"] == [3]

    def test_hideinui_filtered_except_assist(self):
        hidden = {"SkillID": 2, "Level": 1, "AttackType": "Normal", "HideInUI": True}
        assist = {"SkillID": 3, "Level": 1, "AttackType": "Assist", "HideInUI": True}
        result = cd._build_skills([hidden, assist], [2, 3])
        assert "2" not in result
        assert "3" in result

    def test_internal_trigger_keys_filtered(self):
        data = [{"SkillID": 4, "Level": 1, "AttackType": "Normal", "SkillTriggerKey": "Skill31"}]
        assert cd._build_skills(data, [4]) == {}

    def test_skill_type_from_trigger_key(self):
        data = [{"SkillID": 5, "Level": 1, "AttackType": "", "SkillTriggerKey": "Skill03"}]
        result = cd._build_skills(data, [5])
        assert result["5"]["type"] == "Ultra"

    def test_skill_type_fallback_to_attack_type(self):
        data = [{"SkillID": 6, "Level": 1, "AttackType": "BPSkill", "SkillTriggerKey": ""}]
        result = cd._build_skills(data, [6])
        assert result["6"]["type"] == "BPSkill"

    def test_sp_unwrapped(self):
        data = [{"SkillID": 7, "Level": 1, "AttackType": "Normal", "SPBase": {"Value": 30}}]
        result = cd._build_skills(data, [7])
        assert result["7"]["sp_base"] == 30

    def test_tag_resolved_from_skill_tag(self):
        # 官方 SkillTag（Hash 引用）解析为中文文本（方案 A，与货币战争模块一致）
        import textmap
        textmap._text_map["100001"] = "单攻"
        data = [{"SkillID": 8, "Level": 1, "AttackType": "Normal", "SkillTag": {"Hash": 100001}}]
        result = cd._build_skills(data, [8])
        assert result["8"]["tag"] == "单攻"

    def test_tag_none_when_skill_tag_missing(self):
        data = [{"SkillID": 9, "Level": 1, "AttackType": "Normal"}]
        result = cd._build_skills(data, [9])
        assert result["9"]["tag"] is None

    def test_unknown_trigger_no_attack_type_outputs_none(self):
        # SkillP02（天赋 2，如 140805）无 AttackType：透传 None 而非空串，
        # 前端 SKILL_ORDER.includes(null) 为 true 可独立成组显示（P10 修复契约）
        data = [{"SkillID": 140805, "Level": 1, "AttackType": "", "SkillTriggerKey": "SkillP02"}]
        result = cd._build_skills(data, [140805])
        assert result["140805"]["type"] is None

    def test_unknown_trigger_falls_back_to_attack_type(self):
        # Skill11（强化普攻，如 141508）不在映射表 → AttackType 兜底 Normal
        data = [{"SkillID": 141508, "Level": 1, "AttackType": "Normal", "SkillTriggerKey": "Skill11"}]
        result = cd._build_skills(data, [141508])
        assert result["141508"]["type"] == "Normal"

    def test_audit_fields_output(self):
        # 2026-08-03 字段审计收录：max_level/stance_damage_type/stance_damage_display/
        # skill_need/sp_need/rated_rank_id/rated_skill_tree_id（见 docs/audit/字段审计-AvatarSkillConfig.md）
        import textmap
        textmap._text_map["300001"] = "#5点【新蕊】"
        data = [{
            "SkillID": 20, "Level": 1, "AttackType": "Normal",
            "MaxLevel": 10,
            "StanceDamageType": "Fire",
            "StanceDamageDisplay": 10,
            "SkillNeed": {"Hash": 300001},
            "SPNeed": {"Value": 100},
            "RatedRankID": [101402],
            "RatedSkillTreeID": [1014103],
        }]
        result = cd._build_skills(data, [20])
        s = result["20"]
        assert s["max_level"] == 10
        assert s["stance_damage_type"] == "Fire"
        assert s["stance_damage_display"] == 10
        assert s["skill_need"] == "#5点【新蕊】"
        assert s["sp_need"] == 100
        assert s["rated_rank_id"] == [101402]
        assert s["rated_skill_tree_id"] == [1014103]

    def test_audit_fields_null_when_missing(self):
        # 源字段缺失时新字段全部输出 None（与 sp_base 等现有可选字段契约一致）
        data = [{"SkillID": 21, "Level": 1, "AttackType": "Normal"}]
        result = cd._build_skills(data, [21])
        s = result["21"]
        assert s["max_level"] is None
        assert s["stance_damage_type"] is None
        assert s["stance_damage_display"] is None
        assert s["skill_need"] is None
        assert s["sp_need"] is None
        assert s["rated_rank_id"] is None
        assert s["rated_skill_tree_id"] is None


# ─── _build_servant_skills ──────────────────────────────────────

class TestBuildServantSkills:
    def test_no_filter_and_servant_type(self):
        data = [{"SkillID": 10, "Level": 1, "AttackType": "Servant", "HideInUI": True}]
        result = cd._build_servant_skills(data, [10])
        assert "10" in result
        assert result["10"]["type"] == "Servant"

    def test_order_follows_skill_ids(self):
        data = [
            {"SkillID": 12, "Level": 1, "AttackType": "Normal"},
            {"SkillID": 11, "Level": 1, "AttackType": "Normal"},
        ]
        result = cd._build_servant_skills(data, [11, 12])
        assert list(result.keys()) == ["11", "12"]

    def test_missing_skill_skipped(self):
        assert cd._build_servant_skills([], [99]) == {}

    def test_tag_resolved_from_skill_tag(self):
        # 忆灵技能官方 SkillTag（如 1141501 → 「群攻」）
        import textmap
        textmap._text_map["200001"] = "群攻"
        data = [{"SkillID": 13, "Level": 1, "AttackType": "Servant", "SkillTag": {"Hash": 200001}}]
        result = cd._build_servant_skills(data, [13])
        assert result["13"]["tag"] == "群攻"

    def test_audit_fields_same_structure(self):
        # 忆灵技能与角色技能保持同结构（审计字段缺失输出 None，契约一致性）
        data = [{"SkillID": 14, "Level": 1, "AttackType": "Servant", "SPNeed": {"Value": 110}}]
        result = cd._build_servant_skills(data, [14])
        s = result["14"]
        assert s["sp_need"] == 110
        assert s["max_level"] is None
        assert s["stance_damage_type"] is None
        assert s["rated_rank_id"] is None


# ─── _build_ranks ───────────────────────────────────────────────

class TestBuildRanks:
    def test_keyed_by_rank_number(self):
        data = [{"RankID": 1001, "Rank": 2, "Name": "二魂", "Param": [{"Value": 5}]}]
        result = cd._build_ranks(data, [1001])
        assert "2" in result
        assert result["2"]["id"] == 1001
        assert result["2"]["param_list"] == [5]

    def test_unrelated_ranks_skipped(self):
        data = [{"RankID": 9999, "Rank": 1, "Name": ""}]
        assert cd._build_ranks(data, [1001]) == {}


# ─── _build_stats ───────────────────────────────────────────────

class TestBuildStats:
    def test_stages_ordered_by_max_level(self):
        data = [
            {"AvatarID": 1001, "MaxLevel": 80, "HPBase": {"Value": 1000}},
            {"AvatarID": 1001, "MaxLevel": 20, "HPBase": {"Value": 200}},
        ]
        result = cd._build_stats(data, 1001)
        assert list(result.keys()) == ["0", "1"]
        assert result["0"]["hp_base"] == 200
        assert result["1"]["hp_base"] == 1000

    def test_other_avatar_ignored(self):
        data = [{"AvatarID": 2001, "MaxLevel": 20, "HPBase": {"Value": 1}}]
        assert cd._build_stats(data, 1001) == {}


# ─── _build_relics ──────────────────────────────────────────────

class TestBuildRelics:
    def test_match_avatar(self):
        data = [{"AvatarID": 1001, "Set4IDList": [1, 2]}]
        result = cd._build_relics(data, 1001)
        assert result["set4_id_list"] == [1, 2]

    def test_no_match_returns_empty(self):
        assert cd._build_relics([{"AvatarID": 2001}], 1001) == {}


# ─── _normalize_tree_icon ───────────────────────────────────────

class TestNormalizeTreeIcon:
    def test_pseudo_dir_normalized(self):
        icon = "icon/skill/Avatar/11005/SkillIcon_11005_1.png"
        assert cd._normalize_tree_icon(icon, 1005) == "icon/skill/Avatar/1005/SkillIcon_1005_1.png"

    def test_other_cross_id_kept(self):
        # 开拓者偶数变体引用配对奇数 ID 的真实图标，不得归一
        icon = "icon/skill/Avatar/8001/SkillIcon_8001_1.png"
        assert cd._normalize_tree_icon(icon, 8002) == icon

    def test_empty_and_non_skill_kept(self):
        assert cd._normalize_tree_icon("", 1005) == ""
        other = "icon/path/Warrior.png"
        assert cd._normalize_tree_icon(other, 1005) == other


# ─── _build_memosprite ──────────────────────────────────────────

class TestBuildMemosprite:
    def test_owner_base_mapping(self):
        data = [{"ServantID": 11001, "ServantName": {}, "SkillIDList": []}]
        result = cd._build_memosprite(data, [], 1001)
        assert result is not None
        assert result["skills"] == {}

    def test_trailblazer_pair_ownership(self):
        # 18007 → 8007 & 8008 均可命中
        data = [{"ServantID": 18007, "ServantName": {}, "SkillIDList": []}]
        assert cd._build_memosprite(data, [], 8007) is not None
        assert cd._build_memosprite(data, [], 8008) is not None

    def test_wrong_owner_returns_none(self):
        data = [{"ServantID": 11001, "ServantName": {}, "SkillIDList": []}]
        assert cd._build_memosprite(data, [], 1002) is None


# ─── _build_skill_trees（EnhancedID 分流） ──────────────────────

class TestBuildSkillTreesEnhancedFilter:
    def test_base_only_by_default(self):
        # 同 anchor 同 level 的基础（EnhancedID 缺失）与加强（EnhancedID=1）并存时，
        # 默认只输出基础行迹（修复历史覆盖 bug：加强行迹曾顶掉基础行迹）
        data = [
            {"AvatarID": 1005, "AnchorType": "Point01", "Level": 1,
             "PointID": 1005001, "PointName": {}, "ParamList": []},
            {"AvatarID": 1005, "AnchorType": "Point01", "Level": 1,
             "PointID": 11005001, "PointName": {}, "ParamList": [], "EnhancedID": 1},
        ]
        result = cd._build_skill_trees(data, 1005)
        node = result["Point01"]["1"]
        assert node["point_id"] == 1005001

    def test_enhanced_id_isolates_enhanced_rows(self):
        data = [
            {"AvatarID": 1005, "AnchorType": "Point01", "Level": 1,
             "PointID": 1005001, "PointName": {}, "ParamList": []},
            {"AvatarID": 1005, "AnchorType": "Point01", "Level": 1,
             "PointID": 11005001, "PointName": {}, "ParamList": [], "EnhancedID": 1},
        ]
        result = cd._build_skill_trees(data, 1005, enhanced_id=1)
        node = result["Point01"]["1"]
        assert node["point_id"] == 11005001

    def test_other_avatar_ignored(self):
        data = [{"AvatarID": 1006, "AnchorType": "Point01", "Level": 1,
                 "PointID": 1006001, "PointName": {}, "ParamList": []}]
        assert cd._build_skill_trees(data, 1005) == {}


# ─── _build_enhanced（角色强化包） ───────────────────────────────

class TestBuildEnhanced:
    def _config(self):
        enhanced_config = [{
            "AvatarID": 1005, "EnhancedID": 1, "SPNeed": {"Value": 120},
            "SkillList": [1100501], "RankIDList": [1100501],
        }]
        hint_data = [{
            "AvatarID": 1005, "EnhancedID": 1, "EnhancedDescNum": 2,
            "EnhancedDesc1": {"Hash": 5001}, "EnhancedDesc2": {"Hash": 5002},
        }]
        skill_config = [{"SkillID": 1100501, "Level": 1, "AttackType": "Normal",
                         "ParamList": [], "SkillName": {}}]
        rank_config = [{"RankID": 1100501, "Rank": 1, "Name": "", "Param": []}]
        tree_config = [{"AvatarID": 1005, "AnchorType": "Point01", "Level": 1,
                        "PointID": 11005101, "PointName": {}, "ParamList": [],
                        "EnhancedID": 1}]
        return enhanced_config, hint_data, skill_config, rank_config, tree_config

    def test_bundle_shape_and_fields(self):
        import textmap
        textmap._text_map["5001"] = "战技可以使<color=#f29e38>所有攻击目标</color>的持续伤害立即额外触发1次伤害"
        textmap._text_map["5002"] = "追加攻击的可触发次数增加"
        cfg = self._config()
        result = cd._build_enhanced(*cfg, 1005)
        assert result is not None
        bundle = result["1"]
        assert "1100501" in bundle["skills"]
        assert "1" in bundle["ranks"]          # 星魂按 Rank 序号键控
        assert bundle["skill_trees"]["Point01"]["1"]["point_id"] == 11005101
        assert bundle["descs"] == [
            "战技可以使<color=#f29e38>所有攻击目标</color>的持续伤害立即额外触发1次伤害",
            "追加攻击的可触发次数增加",
        ]
        assert bundle["sp_need"] == 120
        assert bundle["skill_ids"] == [1100501]
        assert bundle["rank_ids"] == [1100501]

    def test_no_enhancement_returns_none(self):
        assert cd._build_enhanced([], [], [], [], [], 1005) is None

    def test_other_avatar_skipped(self):
        cfg = self._config()
        assert cd._build_enhanced(*cfg, 1006) is None

    def test_desc_missing_entries_skipped(self):
        import textmap
        textmap._text_map["5001"] = "有效描述"
        enhanced_config = [{
            "AvatarID": 1005, "EnhancedID": 1, "SPNeed": {"Value": 120},
            "SkillList": [], "RankIDList": [],
        }]
        hint_data = [{"AvatarID": 1005, "EnhancedID": 1, "EnhancedDescNum": 2,
                      "EnhancedDesc1": {"Hash": 5001}, "EnhancedDesc2": {"Hash": 9999}}]
        result = cd._build_enhanced(enhanced_config, hint_data, [], [], [], 1005)
        assert result["1"]["descs"] == ["有效描述"]
