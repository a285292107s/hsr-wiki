from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

from config import TEXTMAP_DIR

REGISTRY_FILE = Path(__file__).resolve().parent / "languages.json"

_CODE_RE = re.compile(r"^[a-z]{2,3}$")
"""站内语言代码形态（上游 `TextLanguageKey`：cn / cht / en / jp …）。"""

_CULTURE_RE = re.compile(r"^[a-z]{2}-[A-Z]{2}$")
"""`LanguageCultureCode` 形态（zh-CN / en-US / ja-JP …）。"""


@dataclass(frozen=True)
class Language:
    code: str
    culture: str
    native: str
    textmap: tuple[str, ...]
    default: bool = False

    @property
    def textmap_paths(self) -> tuple[Path, ...]:
        return tuple(TEXTMAP_DIR / name for name in self.textmap)


def _load() -> tuple[Language, ...]:
    with open(REGISTRY_FILE, encoding="utf-8") as f:
        raw = json.load(f)

    default_code = raw.get("default", "")
    languages: list[Language] = []
    for item in raw.get("languages", []):
        code = str(item.get("code", ""))
        culture = str(item.get("culture", ""))
        native = str(item.get("native", ""))
        textmap = tuple(str(f) for f in item.get("textmap", []))
        if not _CODE_RE.match(code):
            raise ValueError(f"语言代码不合法: {code!r}（应形如 cn / cht / en）")
        if not _CULTURE_RE.match(culture):
            raise ValueError(f"语言 culture 不合法: {culture!r}（应形如 zh-CN）")
        if not native:
            raise ValueError(f"语言 {code} 缺少母语名")
        if not textmap:
            raise ValueError(f"语言 {code} 未声明任何 TextMap 分片")
        languages.append(
            Language(code, culture, native, textmap, default=(code == default_code))
        )

    if not languages:
        raise ValueError(f"语言清单为空: {REGISTRY_FILE}")
    codes = [lang.code for lang in languages]
    if len(set(codes)) != len(codes):
        raise ValueError(f"语言代码重复: {codes}")
    if codes.count(default_code) != 1:
        raise ValueError(f"default 必须是清单中恰好一次的代码，当前 default={default_code!r}")

    return tuple(languages)


LANGUAGES: tuple[Language, ...] = _load()
"""全部文本语言，顺序即站点语言选择器的展示顺序。"""

DEFAULT_CODE: str = next(lang.code for lang in LANGUAGES if lang.default)
"""缺省语言代码（URL 无前缀的那一种）。"""

DEFAULT_LANGUAGE: Language = next(lang for lang in LANGUAGES if lang.default)

_BY_CODE: dict[str, Language] = {lang.code: lang for lang in LANGUAGES}


def codes() -> tuple[str, ...]:
    return tuple(lang.code for lang in LANGUAGES)


def by_code(code: str) -> Language | None:
    return _BY_CODE.get(code)


def resolve(code: str | None) -> Language:
    if code:
        found = _BY_CODE.get(code)
        if found is not None:
            return found
    return DEFAULT_LANGUAGE


def non_default_codes() -> tuple[str, ...]:
    return tuple(lang.code for lang in LANGUAGES if not lang.default)
