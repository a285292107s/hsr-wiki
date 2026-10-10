"""文本引用令牌与语言包（textpack.py）契约测试。

用合成 TextMap 覆盖：令牌编解码、键登记、语言包生成与回填、缺键中断、递归替换、
语言包落盘顺序稳定。**令牌格式同时被前端镜像测试钉住**
（`src/lib/__tests__/text-ref.test.ts` 读本模块源的 TOKEN_PREFIX 做跨侧比对）。
"""

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

import textpack  # noqa: E402
from textpack import (  # noqa: E402
    Interner,
    TextPackError,
    collect_tokens,
    ensure_plain_text,
    is_token,
    substitute,
    token,
    token_key,
    write_pack,
)

IDENT = lambda s, _tm: s  # noqa: E731  —— 不变换的清洗器（多数用例只关心回填语义）
CLEAN = lambda s, _tm: re.sub(r"</?unbreak>", "", s)  # noqa: E731  —— 简化版真实清洗（剥 unbreak）

CHS = {"111": "三月七", "222": "冰", "333": "战技", "444": "毁灭"}
EN = {"111": "March 7th", "222": "Ice", "333": "Skill"}


@pytest.fixture
def fake_textmaps(monkeypatch):
    """按语言返回合成 TextMap；未登记语言沿用 languages.py 的真实分支。"""
    table = {"cn": CHS, "en": EN}

    def _load(code):
        if code not in table:
            raise TextPackError(f"未登记的语言: {code!r}")
        return dict(table[code])

    monkeypatch.setattr(textpack, "load_language_textmap", _load)
    return table


class TestToken:
    def test_roundtrip(self):
        assert token("111") == "$t:111"
        assert is_token(token("111"))
        assert token_key(token("111")) == "111"

    def test_is_token_rejects_non_string_and_plain_text(self):
        assert not is_token(111)
        assert not is_token(None)
        assert not is_token({"$t": "111"})
        assert not is_token("普通文本")

    def test_empty_key_rejected(self):
        with pytest.raises(TextPackError):
            token("")

    def test_key_starting_with_prefix_rejected(self):
        with pytest.raises(TextPackError):
            token("$t:nested")

    def test_token_key_rejects_plain_text(self):
        with pytest.raises(TextPackError):
            token_key("三月七")

    def test_ensure_plain_text(self):
        assert ensure_plain_text("三月七") == "三月七"
        with pytest.raises(TextPackError):
            ensure_plain_text("$t:111", "characters.json")


class TestInterner:
    def test_dedupes_keys_but_counts_refs(self):
        it = Interner()
        assert it.intern("111") == "$t:111"
        assert it.intern("111") == "$t:111"
        assert it.intern("222") == "$t:222"
        assert it.keys == frozenset({"111", "222"})
        assert it.refs == 3
        assert len(it) == 2

    def test_merge(self):
        a, b = Interner(), Interner()
        a.intern("111")
        b.intern("222")
        b.intern("222")
        a.merge(b)
        assert a.keys == frozenset({"111", "222"})
        assert a.refs == 3


class TestBuildPack:
    def test_complete_target_language_needs_no_fallback(self, fake_textmaps):
        pack, filled = textpack.build_pack(["111", "222", "333"], "en", IDENT)
        assert filled == []
        assert pack == {"111": "March 7th", "222": "Ice", "333": "Skill"}

    def test_missing_keys_filled_from_default(self, fake_textmaps):
        """键 444 英文表没有 → 从 cn 回填，语言包必须自包含。"""
        pack, filled = textpack.build_pack(["111", "444"], "en", IDENT)
        assert filled == ["444"]
        assert pack == {"111": "March 7th", "444": "毁灭"}

    def test_blank_value_counts_as_missing(self, fake_textmaps, monkeypatch):
        monkeypatch.setitem(fake_textmaps, "en", {"111": "March 7th", "222": "   "})
        pack, filled = textpack.build_pack(["111", "222"], "en", IDENT)
        assert filled == ["222"]
        assert pack["222"] == "冰"

    def test_cleaner_applies_to_plain_key_but_not_raw_variant(self, fake_textmaps, monkeypatch):
        """变体分工：普通键出清洗后正文，`~raw` 变体键保留原文（含游戏标记）。"""
        monkeypatch.setitem(fake_textmaps, "en", {"111": "<unbreak>7</unbreak> March", "222": "<color=#F>Ice</color>"})
        pack, _ = textpack.build_pack(["111", textpack.raw_variant("222")], "en", CLEAN)
        assert pack["111"] == "7 March"
        assert pack[textpack.raw_variant("222")] == "<color=#F>Ice</color>"

    def test_default_language_missing_key_raises(self, fake_textmaps):
        with pytest.raises(TextPackError):
            textpack.build_pack(["999"], "cn", IDENT)

    def test_key_absent_everywhere_raises(self, fake_textmaps):
        with pytest.raises(TextPackError):
            textpack.build_pack(["999"], "en", IDENT)

    def test_unknown_language_raises(self, fake_textmaps):
        with pytest.raises(TextPackError):
            textpack.build_pack(["111"], "zz", IDENT)

    def test_missing_keys_helper(self, fake_textmaps):
        pack, _ = textpack.build_pack(["111"], "en", IDENT)
        assert textpack.missing_keys(pack, ["111", "333"]) == ["333"]


class TestVariantKeys:
    def test_raw_variant_roundtrip(self):
        assert textpack.raw_variant("111") == "111~raw"
        assert textpack.is_raw_variant("111~raw")
        assert not textpack.is_raw_variant("111")
        assert textpack.base_key("111~raw") == "111"
        assert textpack.base_key("111") == "111"


class TestSubstitute:
    def test_nested_replacement_and_original_untouched(self, fake_textmaps):
        pack, _ = textpack.build_pack(["111", "222"], "en", IDENT)
        src = {"name": "$t:111", "tags": ["$t:222", "plain"], "n": 5, "nested": {"d": "$t:111"}}
        out = substitute(src, pack)
        assert out == {
            "name": "March 7th",
            "tags": ["Ice", "plain"],
            "n": 5,
            "nested": {"d": "March 7th"},
        }
        assert src["name"] == "$t:111"  # 原结构不被改写

    def test_missing_key_raises_with_path(self, fake_textmaps):
        pack, _ = textpack.build_pack(["111"], "en", IDENT)
        with pytest.raises(TextPackError) as err:
            substitute({"a": {"b": "$t:999"}}, pack)
        assert "a.b" in str(err.value)


class TestGroupOf:
    """分组规则是前后端共用契约（首屏成本），逐例钉住。"""

    def test_dir_first_segment(self):
        assert textpack.group_of("characters/1310.json") == "characters"
        assert textpack.group_of("currency/role/1502.json") == "currency"

    def test_top_level_file_stem(self):
        assert textpack.group_of("characters.json") == "characters"
        assert textpack.group_of("maze.json") == "maze"
        assert textpack.group_of("maze.catalog.json") == "maze.catalog"

    def test_windows_separator_and_leading_slash(self):
        assert textpack.group_of("\\characters\\1310.json") == "characters"
        assert textpack.group_of("/characters/1310.json") == "characters"

    def test_non_json_name(self):
        assert textpack.group_of("assets/cw-hero.mp4") == "assets"


class TestTextRef:
    def test_str_semantics_preserved(self):
        ref = textpack.TextRef("三月七", "111")
        assert ref == "三月七"
        assert isinstance(ref, str)
        assert sorted([textpack.TextRef("乙", "2"), ref]) == ["三月七", "乙"]
        assert ref.key == "111"

    def test_composition_loses_key(self):
        """f-string 拼接会退化成普通 str——这正是「残留中文」的判据，必须显式暴露。"""
        ref = textpack.TextRef("三月七", "111")
        composed = f"开拓者·{ref}"
        assert composed == "开拓者·三月七"
        assert not isinstance(composed, textpack.TextRef)

    def test_has_residual_cjk(self):
        assert textpack.has_residual_cjk("三月七")
        assert not textpack.has_residual_cjk("March 7th")
        assert not textpack.has_residual_cjk("$t:111")

    def test_survey_residual_text_reports_paths(self):
        found = textpack.survey_residual_text({
            "name": "$t:111",
            "desc": "写死的中文",
            "list": ["also写死"],
            "n": 1,
        })
        assert found == [("desc", "写死的中文"), ("list[0]", "also写死")]

    def test_survey_tree_skips_pack_dir(self, tmp_path):
        (tmp_path / "i18n" / "cn").mkdir(parents=True)
        (tmp_path / "a.json").write_text('{"x":"中文"}', encoding="utf-8")
        (tmp_path / "i18n" / "cn" / "a.json").write_text('{"x":"中文"}', encoding="utf-8")
        report = textpack.survey_tree(tmp_path)
        assert list(report) == ["a.json"]
        assert report["a.json"] == [("x", "中文")]


class TestPackBuilder:
    def test_no_keys_raises(self, tmp_path):
        with pytest.raises(TextPackError):
            textpack.PackBuilder().write(tmp_path, ["cn"], IDENT)

    def test_codes_must_include_default(self, tmp_path, fake_textmaps):
        builder = textpack.PackBuilder()
        builder.record("characters", "111")
        with pytest.raises(TextPackError):
            builder.write(tmp_path, ["en"], IDENT)

    def test_writes_grouped_packs_with_fallback(self, tmp_path, fake_textmaps):
        builder = textpack.PackBuilder()
        builder.record("characters", "111")
        builder.record("characters", "444")   # en 缺 → 回填 cn
        builder.record("maze", "333")
        stats = builder.write(tmp_path, ["cn", "en"], IDENT)

        assert builder.groups == ("characters", "maze")
        cn_body = json.loads((tmp_path / "cn" / "characters.json").read_text(encoding="utf-8"))
        en_body = json.loads((tmp_path / "en" / "characters.json").read_text(encoding="utf-8"))
        assert cn_body == {"111": "三月七", "444": "毁灭"}
        assert en_body == {"111": "March 7th", "444": "毁灭"}
        assert json.loads((tmp_path / "en" / "maze.json").read_text(encoding="utf-8")) == {"333": "Skill"}
        assert stats == {"cn": 3, "en": 3}

    def test_default_language_missing_key_raises(self, tmp_path, fake_textmaps):
        builder = textpack.PackBuilder()
        builder.record("characters", "999")
        with pytest.raises(TextPackError):
            builder.write(tmp_path, ["cn"], IDENT)

    def test_textmap_loaded_once_per_language(self, tmp_path, monkeypatch):
        """13 语言各 50–70 MB：必须每语言只加载一次，不能按分组反复加载。"""
        loads: list[str] = []

        def _load(code):
            loads.append(code)
            return {"cn": CHS, "en": EN}[code]

        monkeypatch.setattr(textpack, "load_language_textmap", _load)
        builder = textpack.PackBuilder()
        for group, key in (("a", "111"), ("b", "222"), ("c", "333")):
            builder.record(group, key)
        builder.write(tmp_path, ["cn", "en"], IDENT)
        assert loads == ["cn", "en"]


@pytest.fixture
def token_mode(tmp_path, monkeypatch):
    """开启令牌模式 + 把 OUTPUT_DIR 指向临时目录，测试结束复原全局开关。"""
    import utils

    monkeypatch.setattr(utils, "OUTPUT_DIR", tmp_path)
    builder = textpack.begin()
    utils.set_text_tokens(True)
    yield builder
    utils.set_text_tokens(False)
    textpack.end()


class TestSaveJsonTokenMode:
    def test_token_mode_off_keeps_plain_text(self, tmp_path, monkeypatch):
        import utils

        monkeypatch.setattr(utils, "OUTPUT_DIR", tmp_path)
        utils.set_text_tokens(False)
        target = tmp_path / "characters.json"
        utils.save_json({"name": textpack.TextRef("三月七", "111")}, target)
        assert json.loads(target.read_text(encoding="utf-8")) == {"name": "三月七"}

    def test_token_mode_writes_tokens_and_records_group(self, token_mode):
        import utils

        target = utils.OUTPUT_DIR / "characters" / "1001.json"
        utils.save_json(
            {"name": textpack.TextRef("三月七", "111"), "tags": [textpack.TextRef("冰", "222"), "plain"]},
            target,
        )
        assert json.loads(target.read_text(encoding="utf-8")) == {
            "name": "$t:111",
            "tags": ["$t:222", "plain"],
        }
        assert token_mode.groups == ("characters",)
        assert token_mode.keys_of("characters") == frozenset({"111", "222"})

    def test_top_level_file_uses_stem_group(self, token_mode):
        import utils

        utils.save_json({"n": textpack.TextRef("冰", "222")}, utils.OUTPUT_DIR / "maze.json")
        assert token_mode.groups == ("maze",)

    def test_passthrough_token_is_recorded(self, token_mode):
        """透传的既有令牌（catalog 从已令牌化结构层派生）也必须登记键，否则该分组没有语言包。"""
        import utils

        utils.save_json({"zh": "$t:222", "n": 1}, utils.OUTPUT_DIR / "maze.catalog.json")
        assert token_mode.groups == ("maze.catalog",)
        assert token_mode.keys_of("maze.catalog") == frozenset({"222"})

    def test_plain_text_with_cjk_is_left_verbatim(self, token_mode):
        """写死中文不报错但会被盘点出来（survey_tree），不会被误当成令牌。"""
        import utils

        target = utils.OUTPUT_DIR / "monsters.json"
        utils.save_json({"name": "写死的中文"}, target)
        assert json.loads(target.read_text(encoding="utf-8")) == {"name": "写死的中文"}
        report = textpack.survey_tree(utils.OUTPUT_DIR)
        assert report["monsters.json"] == [("name", "写死的中文")]


class TestComposer:
    """组合器：键不由 TextMap 直接供给，而是**逐语言现算**（成就简介 = 模板 + TEXTJOIN + 参数）。"""

    def test_composer_evaluated_per_language(self, tmp_path, fake_textmaps):
        builder = textpack.PackBuilder()
        key = "composed:ach:222:abcd1234"
        builder.record("achievements", key)
        builder.register_composer(key, lambda tm: f"[{tm.get('222', '')}]")
        builder.write(tmp_path, ["cn", "en"], IDENT)
        cn = json.loads((tmp_path / "cn" / "achievements.json").read_text(encoding="utf-8"))
        en = json.loads((tmp_path / "en" / "achievements.json").read_text(encoding="utf-8"))
        assert cn[key] == "[冰]"
        assert en[key] == "[Ice]"

    def test_composer_bypasses_cleaner_and_fallback(self, tmp_path, fake_textmaps):
        """组合器自带清洗与回退责任：不套 cleaner、也不走缺键回填。"""
        builder = textpack.PackBuilder()
        key = "composed:ach:333:x"
        builder.record("achievements", key)
        builder.register_composer(key, lambda _tm: "<unbreak>7</unbreak> 次")
        builder.write(tmp_path, ["cn"], lambda s: s.replace("<unbreak>", ""))
        cn = json.loads((tmp_path / "cn" / "achievements.json").read_text(encoding="utf-8"))
        assert cn[key] == "<unbreak>7</unbreak> 次"

    def test_composer_empty_output_raises(self, tmp_path, fake_textmaps):
        builder = textpack.PackBuilder()
        key = "composed:ach:333:empty"
        builder.record("achievements", key)
        builder.register_composer(key, lambda _tm: "   ")
        with pytest.raises(TextPackError):
            builder.write(tmp_path, ["cn"], IDENT)

    def test_composed_ref_registers_in_session(self, fake_textmaps):
        builder = textpack.begin()
        try:
            ref = textpack.composed_ref("composed:ach:1:sig", lambda tm: tm["111"], "三月七")
            assert isinstance(ref, textpack.TextRef)
            assert ref == "三月七"
            assert ref.key == "composed:ach:1:sig"
            assert builder._composers["composed:ach:1:sig"]({"111": "X"}) == "X"
        finally:
            textpack.end()

    def test_composed_ref_without_session_still_returns_text_ref(self):
        """`--raw` 模式（无会话）下组合器无处登记，返回值仍带键、按文本落盘。"""
        textpack.end()
        ref = textpack.composed_ref("composed:ach:1:sig", lambda _tm: "x", "纯文本")
        assert ref == "纯文本" and ref.key == "composed:ach:1:sig"


class TestCollectAndWrite:
    def test_collect_counts_tokens(self):
        sink: dict[str, int] = {}
        collect_tokens({"a": "$t:111", "b": ["$t:111", "$t:222", "plain"]}, sink)
        assert sink == {"111": 2, "222": 1}

    def test_write_pack_is_key_sorted_and_roundtrips(self, tmp_path):
        path = tmp_path / "i18n" / "en.json"
        write_pack(path, {"333": "Skill", "111": "March 7th", "222": "Ice"})
        raw = path.read_text(encoding="utf-8")
        assert raw.index('"111"') < raw.index('"222"') < raw.index('"333"')
        assert " " not in raw.split('"111"')[0]  # 紧凑输出（无缩进）
        assert json.loads(raw) == {"111": "March 7th", "222": "Ice", "333": "Skill"}
        assert not list(path.parent.glob("*.tmp"))  # 原子替换，无残留临时文件
