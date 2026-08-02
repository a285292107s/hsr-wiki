"""clean_text / resolve_text 标签清洗逻辑测试。

覆盖 textmap.clean_text 的全部处理分支：
- 占位符（{NICKNAME}/{SPACE}）
- RUBY 标签
- <property> 属性名替换与相邻去重
- <color>/<unbreak> 保留文字去标签
- 未知标签移除

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
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

    def test_color_tags_stripped_text_kept(self):
        assert clean_text("<color=#FF0000>红色文字</color>") == "红色文字"

    def test_unbreak_tags_stripped_text_kept(self):
        assert clean_text("<unbreak>不可打断</unbreak>") == "不可打断"

    def test_unknown_tags_removed(self):
        # 未知标签移除但保留文字（与 <color>/<unbreak> 行为一致）
        assert clean_text("a<i>斜体</i>b") == "a斜体b"

    def test_adjacent_properties_removed_when_shared_text_contains_label(self):
        # 后续文本已含属性名 → 标签组整体移除，避免重复
        text = "<property type=ExtraFrontPowerAddedRatio><property type=ExtraBackPowerAddedRatio>前后台强度提高"
        assert clean_text(text) == "前后台强度提高"

    def test_adjacent_properties_inserted_when_no_label_after(self):
        # 后续无属性名文本 → 标签组插入 "/" 连接属性名
        text = "<property type=ExtraFrontPowerAddedRatio><property type=ExtraBackPowerAddedRatio>提升"
        assert clean_text(text) == "前台强度/后台强度提升"

    def test_adjacent_single_property_not_grouped(self):
        # 单标签不触发相邻处理，走普通替换
        text = "<property type=ExtraHPAddedRatio>提升"
        assert clean_text(text) == "生命增幅提升"

    def test_empty_and_none(self):
        assert clean_text("") == ""
        assert clean_text(None) == ""
