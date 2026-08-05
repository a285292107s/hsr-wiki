"""currency 转换器纯函数契约测试。

用合成数据验证（不依赖真实源数据）：
- _build_prop_names：PropertyType → 官方名（TextMap 解析），空名跳过
- _flatten_property_mods：prop_names 注入时输出 prop_name；未收录 key 不输出

运行: cd tools/converter && python -m pytest tests/ -v
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


# ─── _build_prop_names ──────────────────────────────────────────

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


# ─── _flatten_property_mods ─────────────────────────────────────

class TestFlattenPropertyMods:
    def test_empty_input(self):
        assert cur._flatten_property_mods(None) == []
        assert cur._flatten_property_mods([]) == []

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
        # 常规模式属性体系（AttackAddedRatio 等）未收录 → 不输出 prop_name
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
