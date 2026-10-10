"""语言清单（languages.json → languages.py）契约测试。

语言清单是多语言改造的单一事实源，前端镜像 `src/lib/i18n/locales.ts` 由
`tools/check-languages.mjs` 与之比对；本文件只覆盖 Python 侧的解析与收敛语义。
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from languages import (  # noqa: E402
    DEFAULT_CODE,
    DEFAULT_LANGUAGE,
    LANGUAGES,
    REGISTRY_FILE,
    by_code,
    codes,
    non_default_codes,
    resolve,
)

VENDOR_TEXTMAP = Path(__file__).resolve().parent.parent.parent.parent / "vendor" / "TurnBasedGameData" / "TextMap"

EXPECTED_CODES = ("cn", "cht", "en", "kr", "jp", "es", "ru", "th", "vi", "id", "fr", "de", "pt")


class TestRegistryShape:
    def test_all_thirteen_text_languages(self):
        """上游 AllowedTextLanguage.json 声明 13 种文本语言，清单必须全量覆盖。"""
        assert len(LANGUAGES) == 13
        assert codes() == EXPECTED_CODES

    def test_codes_unique_and_shaped(self):
        assert len(set(codes())) == len(codes())
        for code in codes():
            assert 2 <= len(code) <= 3
            assert code.islower()

    def test_exactly_one_default_and_it_is_cn(self):
        assert DEFAULT_CODE == "cn"
        assert DEFAULT_LANGUAGE.code == "cn"
        assert sum(1 for lang in LANGUAGES if lang.default) == 1

    def test_culture_matches_upstream_shape(self):
        for lang in LANGUAGES:
            head, _, tail = lang.culture.partition("-")
            assert len(head) == 2 and head.islower(), lang.culture
            assert len(tail) == 2 and tail.isupper(), lang.culture

    def test_textmap_shards_declared(self):
        for lang in LANGUAGES:
            assert lang.textmap, f"{lang.code} 未声明 TextMap 分片"
            assert all(name.startswith("TextMap") and name.endswith(".json") for name in lang.textmap)

    def test_split_shards_cover_kr_ru_th(self):
        """上游把 kr / ru / th 的主文本表切成 _0 / _1 两片，必须两片都列。"""
        for code in ("kr", "ru", "th"):
            shards = by_code(code).textmap
            assert any("_0.json" in s for s in shards), code
            assert any("_1.json" in s for s in shards), code

    def test_registry_file_is_the_source(self):
        raw = json.loads(REGISTRY_FILE.read_text(encoding="utf-8"))
        assert [item["code"] for item in raw["languages"]] == list(codes())
        assert raw["default"] == DEFAULT_CODE


class TestLookup:
    def test_by_code_known(self):
        assert by_code("jp").culture == "ja-JP"

    def test_by_code_unknown_returns_none(self):
        assert by_code("zz") is None

    def test_resolve_unknown_or_empty_falls_back_to_default(self):
        assert resolve("zz") is DEFAULT_LANGUAGE
        assert resolve("") is DEFAULT_LANGUAGE
        assert resolve(None) is DEFAULT_LANGUAGE

    def test_resolve_known_returns_itself(self):
        assert resolve("en").code == "en"

    def test_non_default_codes_excludes_default(self):
        assert DEFAULT_CODE not in non_default_codes()
        assert len(non_default_codes()) == len(LANGUAGES) - 1


class TestVendorShards:
    def test_declared_shards_exist_when_vendor_present(self):
        """vendor 不在场（未浅克隆 / CI 精简）时跳过——与 check-languages.mjs 同一取舍。"""
        if not VENDOR_TEXTMAP.exists():
            return
        for lang in LANGUAGES:
            for name in lang.textmap:
                assert (VENDOR_TEXTMAP / name).exists(), f"{lang.code} 缺少分片 {name}"
