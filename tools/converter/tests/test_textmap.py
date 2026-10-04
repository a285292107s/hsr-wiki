"""clean_text / resolve_text 标签清洗逻辑测试。

覆盖 textmap.clean_text 的全部处理分支：
- 占位符（{NICKNAME}/{SPACE}）
- RUBY 标签
- <property> 属性名替换与相邻去重
- <color>/<unbreak> 保留文字去标签
- 未知标签移除

"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from textmap import clean_text, resolve_text_en  # noqa: E402

class TestCleanText:
    def test_nickname_placeholder(self):
        assert clean_text("{NICKNAME}的冒险") == "开拓者的冒险"

    def test_space_placeholder(self):
        assert clean_text("你好{SPACE}世界") == "你好 世界"

    def test_ruby_tags_removed(self):
        assert clean_text("{RUBY_E#文本#}{RUBY_B#注音#}正文") == "正文"

    def test_ruby_tag_only_removed_keep_rest(self):
        assert clean_text("前{RUBY_B#xyz}后") == "前后"

    def test_property_label_replaced(self):
        assert clean_text("<property type=ExtraAttackAddedRatio>") == "攻击增幅"

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


class TestResolveTextEn:
    """英文名解析：占位符留空 + 游戏内标签必须清洗（两者的顺序不能反）。"""

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
        # clean_text 会把 {NICKNAME} 换成中文「开拓者」⇒ 先清洗就会产出假英文名
        assert resolve_text_en({"Hash": 4}) == "Hero 开拓者"

    def test_missing_hash_and_non_hash(self):
        assert resolve_text_en({"Hash": 999}) == ""
        assert resolve_text_en("not-a-ref") == ""
        assert resolve_text_en(None) == ""
