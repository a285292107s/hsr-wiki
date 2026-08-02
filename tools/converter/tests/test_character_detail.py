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
