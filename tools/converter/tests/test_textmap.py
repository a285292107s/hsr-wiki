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

from textmap import clean_text  # noqa: E402

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
