"""converter 核心工具函数单元测试。

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from utils import unwrap_value, map_icon_path, sort_by_id, set_official_paths


# ─── unwrap_value ───────────────────────────────────────────────

class TestUnwrapValue:
    def test_simple_value(self):
        assert unwrap_value({"Value": 42}) == 42

    def test_nested_value(self):
        """只剥离一层，内层 {"Value": 7} 作为纯值返回。"""
        assert unwrap_value({"Value": {"Value": 7}}) == {"Value": 7}

    def test_float_value(self):
        assert unwrap_value({"Value": 0.15}) == 0.15

    def test_string_value(self):
        assert unwrap_value({"Value": "hello"}) == "hello"

    def test_dict_with_multiple_keys(self):
        """多键字典不剥离，递归处理值。"""
        obj = {"A": {"Value": 1}, "B": {"Value": 2}}
        assert unwrap_value(obj) == {"A": 1, "B": 2}

    def test_list_of_values(self):
        obj = [{"Value": 10}, {"Value": 20}]
        assert unwrap_value(obj) == [10, 20]

    def test_deeply_nested(self):
        obj = {"outer": [{"Value": 3}, {"inner": {"Value": 4}}]}
        assert unwrap_value(obj) == {"outer": [3, {"inner": 4}]}

    def test_primitive_passthrough(self):
        assert unwrap_value(99) == 99
        assert unwrap_value("text") == "text"
        assert unwrap_value(None) is None

    def test_empty_dict(self):
        assert unwrap_value({}) == {}

    def test_empty_list(self):
        assert unwrap_value([]) == []


# ─── map_icon_path ──────────────────────────────────────────────

class TestMapIconPath:
    def test_character_icon(self):
        src = "SpriteOutput/AvatarIcon/Avatar/1001.png"
        assert map_icon_path(src) == "icon/character/1001.png"

    def test_light_cone_icon(self):
        src = "SpriteOutput/LightConeMediumIcon/20001.png"
        assert map_icon_path(src) == "icon/light_cone/20001.png"

    def test_item_icon(self):
        src = "SpriteOutput/ItemIcon/101.png"
        assert map_icon_path(src) == "icon/item/101.png"

    def test_skill_icon(self):
        src = "SpriteOutput/SkillIcons/skill_01.png"
        assert map_icon_path(src) == "icon/skill/skill_01.png"

    def test_empty_string(self):
        assert map_icon_path("") == ""

    def test_unknown_path_returns_original(self):
        src = "Unknown/Path/icon.png"
        assert map_icon_path(src) == src

    def test_element_icon(self):
        src = "SpriteOutput/UI/Nature/IconAttribute/Fire.png"
        assert map_icon_path(src) == "icon/element/Fire.png"


# ─── sort_by_id ─────────────────────────────────────────────────

class TestSortById:
    def test_basic_sort(self):
        data = [{"id": 3}, {"id": 1}, {"id": 2}]
        assert sort_by_id(data) == [{"id": 1}, {"id": 2}, {"id": 3}]

    def test_custom_key(self):
        data = [{"rank_id": 2}, {"rank_id": 1}]
        assert sort_by_id(data, key="rank_id") == [{"rank_id": 1}, {"rank_id": 2}]

    def test_missing_key_defaults_zero(self):
        data = [{"id": 5}, {"name": "no_id"}]
        result = sort_by_id(data)
        assert result[0] == {"name": "no_id"}  # 0 < 5

    def test_empty_list(self):
        assert sort_by_id([]) == []


# ─── textmap (需要 mock) ────────────────────────────────────────

class TestResolveText:
    """resolve_text 测试：mock _text_map 避免加载 50MB TextMap。"""

    @pytest.fixture(autouse=True)
    def setup_textmap(self, monkeypatch):
        import textmap
        monkeypatch.setattr(textmap, "_text_map", {
            "12345": "测试文本",
            "RelicDesc_1012": "遗器描述",
        })

    def test_hash_object(self):
        from textmap import resolve_text
        assert resolve_text({"Hash": 12345}) == "测试文本"

    def test_hash_miss(self):
        from textmap import resolve_text
        assert resolve_text({"Hash": 99999}) == ""

    def test_literal_key(self):
        from textmap import resolve_text
        assert resolve_text("RelicDesc_1012") == "遗器描述"

    def test_literal_miss_returns_original(self):
        from textmap import resolve_text
        assert resolve_text("UnknownKey") == "UnknownKey"

    def test_none(self):
        from textmap import resolve_text
        assert resolve_text(None) == ""

    def test_empty_string(self):
        from textmap import resolve_text
        assert resolve_text("") == ""

    def test_clean_strips_color_tags(self):
        from textmap import resolve_text
        import textmap
        textmap._text_map["777"] = "<color=#FF0000>红色文字</color>"
        assert resolve_text({"Hash": 777}) == "红色文字"

    def test_clean_nickname(self):
        from textmap import resolve_text
        import textmap
        textmap._text_map["888"] = "{NICKNAME}的冒险"
        assert resolve_text({"Hash": 888}) == "开拓者的冒险"

    def test_no_clean(self):
        from textmap import resolve_text
        import textmap
        textmap._text_map["999"] = "<color=#FFF>原文</color>"
        assert resolve_text({"Hash": 999}, clean=False) == "<color=#FFF>原文</color>"


# ─── map_icon_path (官方路径模式：--official-icon-paths) ─────────

class TestMapIconPathOfficial:
    """OFFICIAL_ICON_RULES 映射：SpriteOutput 前缀 → StarRailTextures 仓库相对路径。"""

    @pytest.fixture(autouse=True)
    def toggle_official_mode(self):
        set_official_paths(True)
        yield
        set_official_paths(False)  # 恢复，避免影响 TestMapIconPath

    # ── 角色头像（avatarshopicon/avatar/{id}.png）──
    def test_avatarshopicon(self):
        src = "SpriteOutput/AvatarIcon/Avatar/1001.png"
        assert map_icon_path(src) == "avatarshopicon/avatar/1001.png"

    def test_avatarroundicon(self):
        src = "SpriteOutput/AvatarRoundIcon/Avatar/1308.png"
        assert map_icon_path(src) == "avatarroundicon/avatar/1308.png"

    # ── 立绘（avatardrawcard/{id}.png）──
    def test_avatardrawcard(self):
        src = "SpriteOutput/AvatarDrawCard/1001.png"
        assert map_icon_path(src) == "avatardrawcard/1001.png"

    # ── 光锥（lightconemediumicon/{id}.png）──
    def test_lightconemediumicon(self):
        src = "SpriteOutput/LightConeMediumIcon/23001.png"
        assert map_icon_path(src) == "lightconemediumicon/23001.png"

    # ── 物品（小图标 + 大图都走 itemfigures/{stem}.png）──
    def test_itemicon_small(self):
        src = "SpriteOutput/ItemIcon/350101.png"
        assert map_icon_path(src) == "itemfigures/350101.png"

    def test_itemfigures_large(self):
        src = "SpriteOutput/ItemFigures/350101.png"
        assert map_icon_path(src) == "itemfigures/350101.png"

    # ── 元素：源文件名带 IconDamageType 前缀，需要去掉前缀后规范化（首字母大写 + 尾部小写）──
    def test_element_fire(self):
        src = "SpriteOutput/IconDamageType/IconDamageTypeFire.png"
        assert map_icon_path(src) == "icondamagetype/IconDamageTypeFire.png"

    def test_element_ice_lowercase(self):
        """官方元素名首字母大写，尾部小写规范化。"""
        src = "SpriteOutput/IconDamageType/IconDamageTypeice.png"
        assert map_icon_path(src) == "icondamagetype/IconDamageTypeIce.png"

    # ── 命途：源文件名 IconProfession{P}Middle.png；Priest→Pirest，Elation→Joy（官方拼写错误修正）──
    def test_pathicon_priest_spelling_fix(self):
        src = "SpriteOutput/ProfessionIconMiddle/IconProfessionPriestMiddle.png"
        assert map_icon_path(src) == "professioniconmiddle/IconProfessionPirestMiddle.png"

    def test_pathicon_elation_spelling_fix(self):
        src = "SpriteOutput/ProfessionIconMiddle/IconProfessionElationMiddle.png"
        assert map_icon_path(src) == "professioniconmiddle/IconProfessionJoyMiddle.png"

    def test_pathicon_normal(self):
        """无拼写修正的命途（Warrior/Rogue 等）直接保留。"""
        src = "SpriteOutput/ProfessionIconMiddle/IconProfessionWarriorMiddle.png"
        assert map_icon_path(src) == "professioniconmiddle/IconProfessionWarriorMiddle.png"

    # ── 技能图标：真实路径 SpriteOutput/SkillIcons/Avatar/{id}/SkillIcon_{id}_{Type}.png ──
    def test_skillicons_with_id(self):
        src = "SpriteOutput/SkillIcons/Avatar/1001/SkillIcon_1001_Ultra.png"
        assert map_icon_path(src) == "skillicons/avatar/1001/SkillIcon_1001_Ultra.png"

    def test_skillicons_rank_eidolon(self):
        """星魂（Rank）图标同目录 SkillIcon_{id}_RankN.png → skillicons/avatar/{id}/ 下。"""
        src = "SpriteOutput/SkillIcons/Avatar/1001/SkillIcon_1001_Rank6.png"
        assert map_icon_path(src) == "skillicons/avatar/1001/SkillIcon_1001_Rank6.png"

    def test_skillicons_no_id_fallback_legacy(self):
        """不在 Avatar/ 子目录下的 SkillIcons 路径：OFFICIAL 规则未注册 → 走 ICON_PATH_MAP 回退。"""
        src = "SpriteOutput/SkillIcons/skill_common.png"
        assert map_icon_path(src) == "icon/skill/skill_common.png"

    # ── 怪物（中图标 + 大图）──
    def test_monstermiddleicon(self):
        src = "SpriteOutput/MonsterIcon/Monster_Avatar_01.png"
        assert map_icon_path(src) == "monstermiddleicon/Monster_Avatar_01.png"

    def test_monsterfigure(self):
        src = "SpriteOutput/MonsterFigure/Manticore.png"
        assert map_icon_path(src) == "monsterfigure/Manticore.png"

    # ── 未注册前缀：回退旧短路径（渐进兼容）──
    def test_unregistered_prefix_fallback_legacy(self):
        """SpriteOutput/AvatarMiniIcon 不在 OFFICIAL_ICON_RULES 中 → 走 ICON_PATH_MAP。"""
        src = "SpriteOutput/AvatarMiniIcon/9001.png"
        assert map_icon_path(src) == "icon/character_mini/9001.png"

    def test_element_color_fallback_legacy(self):
        """IconNatureColor 在旧 ICON_PATH_MAP 中但 OFFICIAL 未注册 → 回退。"""
        src = "SpriteOutput/UI/Nature/IconNatureColor/Fire.png"
        assert map_icon_path(src) == "icon/element_color/Fire.png"

    def test_empty_string(self):
        assert map_icon_path("") == ""

    def test_unknown_path_returns_original(self):
        src = "Unknown/Path/icon.png"
        assert map_icon_path(src) == src

