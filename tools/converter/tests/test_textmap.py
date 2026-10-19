import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from textmap import clean_text, resolve_text, resolve_text_en  # noqa: E402
from textpack import TextRef  # noqa: E402

class TestCleanText:
    def test_nickname_placeholder(self):
        assert clean_text("{NICKNAME}的冒险") == "开拓者的冒险"

    def test_nickname_placeholder_by_language(self):
        table = {"4036035618718239522": "Trailblazer"}
        assert clean_text("{NICKNAME}的冒险", table) == "Trailblazer的冒险"

    def test_nickname_gender_variant_takes_first_branch(self):
        table = {"4036035618718239522": "{M#Trailblazer}{F#Trailblazerin}"}
        assert clean_text("{NICKNAME} Paradox", table) == "Trailblazer Paradox"

    def test_nickname_missing_entry_falls_back_to_default_language(self):
        assert clean_text("{NICKNAME}的冒险", {}) == "开拓者的冒险"

    def test_space_placeholder(self):
        assert clean_text("你好{SPACE}世界") == "你好 世界"

    def test_ruby_tags_removed(self):
        assert clean_text("{RUBY_E#文本#}{RUBY_B#注音#}正文") == "正文"

    def test_ruby_tag_only_removed_keep_rest(self):
        assert clean_text("前{RUBY_B#xyz}后") == "前后"

    def test_property_label_replaced(self):
        assert clean_text("<property type=ExtraAttackAddedRatio>") == "攻击增幅"

    def test_property_label_by_language(self):
        table = {"12487213280167660625": "On-Field Strength"}
        assert clean_text("<property type=ExtraFrontPowerAddedRatio>", table) == "On-Field Strength"

    def test_property_without_official_entry_emits_placeholder(self):
        table = {"0": "unused"}
        assert clean_text("<property type=ExtraQuantumResonance>", table) == "{PROP:ExtraQuantumResonance}"
        assert clean_text("<property type=ExtraQuantumResonance>") == "{PROP:ExtraQuantumResonance}"
        assert clean_text("<property type=ExtraShieldAddedRatio>") == "{PROP:ExtraShieldAddedRatio}"


    def test_property_label_with_level_suffix(self):
        assert clean_text("<property type=ExtraHPAddedRatio2>") == "生命增幅"

    def test_property_unknown_type_fallback_to_basename(self):
        assert clean_text("<property type=ExtraUnknownThing3>") == "ExtraUnknownThing"

    def test_unknown_tags_removed(self):
        assert clean_text("a<i>斜体</i>b") == "a斜体b"

    def test_adjacent_properties_removed_when_shared_text_contains_label(self):
        text = "<property type=ExtraFrontPowerAddedRatio><property type=ExtraBackPowerAddedRatio>前后台强度提高"
        assert clean_text(text) == "前后台强度提高"

    def test_adjacent_properties_inserted_when_no_label_after(self):
        text = "<property type=ExtraFrontPowerAddedRatio><property type=ExtraBackPowerAddedRatio>提升"
        assert clean_text(text) == "前台强度/后台强度提升"

    def test_adjacent_single_property_not_grouped(self):
        text = "<property type=ExtraHPAddedRatio>提升"
        assert clean_text(text) == "生命增幅提升"

    def test_empty_and_none(self):
        assert clean_text("") == ""
        assert clean_text(None) == ""


class TestResolveTextCarriesKey:
    @pytest.fixture(autouse=True)
    def _textmap(self, monkeypatch):
        import textmap

        monkeypatch.setattr(textmap, "_text_map", {"111": "三月七", "222": "冰"})

    def test_hash_ref_returns_textref_with_key(self):
        r = resolve_text({"Hash": 111})
        assert isinstance(r, TextRef)
        assert r.key == "111"
        assert r == "三月七"

    def test_literal_key_hit_returns_textref(self):
        r = resolve_text("111")
        assert isinstance(r, TextRef)
        assert r.key == "111"

    def test_unknown_literal_returns_plain_str(self):
        r = resolve_text("这个键根本不存在")
        assert not isinstance(r, TextRef)
        assert r == "这个键根本不存在"

    def test_empty_and_none(self):
        assert resolve_text(None) == ""
        assert resolve_text("") == ""

    def test_missing_hash_returns_empty(self):
        assert resolve_text({"Hash": 999999}) == ""

    def test_raw_variant_key_marks_uncleaned_text(self):
        r = resolve_text({"Hash": 111}, clean=False)
        assert isinstance(r, TextRef)
        assert r.key == "111~raw"
        assert r == "三月七"

    def test_str_semantics_keep_working(self):
        r = resolve_text({"Hash": 111})
        assert r == "三月七"
        assert r != "姬子"
        assert f"开拓者·{r}" == "开拓者·三月七"
        assert not isinstance(f"开拓者·{r}", TextRef)


class TestResolveTextEn:
    @pytest.fixture(autouse=True)
    def _textmap(self, monkeypatch):
        import textmap

        monkeypatch.setattr(textmap, "_text_map_en", {
            "1": "Silver Wolf LV.<unbreak>999</unbreak>",
            "2": "March 7th",
            "3": "{NICKNAME}",
            "4": "Hero {NICKNAME}",
        })

    def test_tags_stripped_keep_text(self):
        assert resolve_text_en({"Hash": 1}) == "Silver Wolf LV.999"

    def test_plain_text_unchanged(self):
        assert resolve_text_en({"Hash": 2}) == "March 7th"

    def test_nickname_placeholder_blank(self):
        assert resolve_text_en({"Hash": 3}) == ""

    def test_placeholder_must_be_judged_before_clean(self):
        assert resolve_text_en({"Hash": 4}) == "Hero 开拓者"

    def test_missing_hash_and_non_hash(self):
        assert resolve_text_en({"Hash": 999}) == ""
        assert resolve_text_en("not-a-ref") == ""
        assert resolve_text_en(None) == ""
