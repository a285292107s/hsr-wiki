"""converter 核心工具函数单元测试。

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from utils import unwrap_value, map_icon_path, sort_by_id


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
