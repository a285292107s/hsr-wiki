"""currency 转换器纯函数契约测试。

用合成数据验证（不依赖真实源数据）：
- _build_prop_names：PropertyType → 官方名（TextMap 解析），空名跳过
- _flatten_property_mods：prop_names 注入时输出 prop_name；未收录 key 不输出

"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import currency as cur  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实 50MB 文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {
        "9774490082531591747": "初始能量",
        "14993609201079937303": "伤害增幅",
    })

class TestBuildPropNames:
    def test_resolves_property_names_from_textmap(self):
        data = [
            {"PropertyType": "ExtraInitSP", "PropertyName": {"Hash": 9774490082531591747}},
            {"PropertyType": "ExtraAllDamageTypeAddedRatio1", "PropertyName": {"Hash": 14993609201079937303}},
            {"PropertyType": "NoNameKey", "PropertyName": {"Hash": 9999999999999999999}},
            {"PropertyType": "EmptyName", "PropertyName": {"Hash": 0}},
        ]
        result = cur._build_prop_names(data)
        assert result == {
            "ExtraInitSP": "初始能量",
            "ExtraAllDamageTypeAddedRatio1": "伤害增幅",
        }

    def test_skips_entries_without_property_type(self):
        data = [{"PropertyName": {"Hash": 9774490082531591747}}, {}]
        assert cur._build_prop_names(data) == {}

class TestFlattenPropertyMods:
    def test_basic_flatten_without_prop_names(self):
        data = [{"PropertyType": "ExtraSpeedAddedRatio1", "Value": {"Value": 0.08}}]
        result = cur._flatten_property_mods(data)
        assert result == [{
            "name": "ExtraSpeedAddedRatio1",
            "property_type": "ExtraSpeedAddedRatio1",
            "value": 0.08,
        }]

    def test_prop_name_injected_when_index_has_key(self):
        data = [{"PropertyType": "ExtraInitSP", "Value": {"Value": 60}}]
        result = cur._flatten_property_mods(data, {"ExtraInitSP": "初始能量"})
        assert result[0]["prop_name"] == "初始能量"
        assert result[0]["value"] == 60

    def test_no_prop_name_for_unlisted_key(self):
        data = [{"PropertyType": "AttackAddedRatio", "Value": {"Value": 0.2}}]
        result = cur._flatten_property_mods(data, {"ExtraInitSP": "初始能量"})
        assert "prop_name" not in result[0]
        assert result[0]["property_type"] == "AttackAddedRatio"

    def test_value_unwrap_and_non_dict_skip(self):
        data = [
            {"PropertyType": "A", "Value": {"Value": 1}},
            "junk",
            {"PropertyType": "B", "Value": 2},
        ]
        result = cur._flatten_property_mods(data)
        assert [r["property_type"] for r in result] == ["A", "B"]
        assert result[1]["value"] == 2

class TestIndexGenderOverride:
    def test_maps_role_to_female_avatar(self):
        data = [
            {"RoleID": 8007, "AvatarID": 8008, "Star": 1},
            {"RoleID": 8007, "AvatarID": 8008, "Star": 2},
            {"RoleID": 8009, "AvatarID": 8010, "Star": 1},
        ]
        result = cur._index_gender_override(data)
        assert result == {8007: 8008, 8009: 8010}

    def test_first_row_wins_for_same_role(self):
        data = [
            {"RoleID": 8007, "AvatarID": 8008, "Star": 1},
            {"RoleID": 8007, "AvatarID": 9999, "Star": 2},
        ]
        result = cur._index_gender_override(data)
        assert result[8007] == 8008

    def test_missing_fields_skipped(self):
        data = [
            {"RoleID": 1001, "Star": 1},
            {"AvatarID": 8008, "Star": 2},
            {},
        ]
        assert cur._index_gender_override(data) == {}


class TestAugmentDescComposer:
    """货币词条描述走组合器（textpack.composed_ref）：模板 + 内嵌名称必须**按语言**各自组合。"""

    def test_each_entry_binds_its_own_template(self, monkeypatch):
        """闭包**按值**绑定模板键：曾因 `lambda` 捕获循环变量，全部词条解析成同一条描述。"""
        import textmap
        import textpack
        from converters import currency_catalog as cc

        monkeypatch.setattr(textmap, "_text_map", {"11": "模板甲#1[i]", "22": "模板乙#2[i]"})
        textpack.begin()
        try:
            a = cc._augment_desc_ref({"HexDesc": {"Hash": 11}}, {}, {})
            b = cc._augment_desc_ref({"HexDesc": {"Hash": 22}}, {}, {})
            assert a.key == "composed:cwaug:11"
            assert b.key == "composed:cwaug:22"
            builders = textpack.session()
            assert builders is not None
            engine = {"11": "甲#1[i]", "22": "乙#2[i]"}
            assert builders._composers[a.key](engine) == "甲#1[i]"
            assert builders._composers[b.key](engine) == "乙#2[i]"
        finally:
            textpack.end()

    def test_gridfightinfo_substituted_per_language(self):
        """`<gridfightinfo>` 内嵌名称按语言取值——同一模板在两种语言表下产出不同正文。"""
        from converters import currency_catalog as cc

        template = "获得<gridfightinfo type=item id=7/>"
        cn = cc._augment_desc({"1": "星琼×7", "2": template}, "2", {7: "1"}, {})
        en = cc._augment_desc({"1": "Stellar Jade ×7", "2": template}, "2", {7: "1"}, {})
        assert cn == "获得星琼×7"
        assert en == "获得Stellar Jade ×7"

    def test_missing_target_name_removed(self):
        from converters import currency_catalog as cc

        out = cc._augment_desc({"2": "获得<gridfightinfo type=item id=99/>"}, "2", {}, {})
        assert out == "获得"
