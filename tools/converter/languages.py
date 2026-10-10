"""多语言站点的语言清单（转换器侧入口）。

清单本体在 `languages.json`（单一事实源，供 Python 与 Node 守卫共用）——代码取自 vendor
`ExcelOutput/AllowedTextLanguage.json` 的 `TextLanguageKey`，culture 取自同表的
`LanguageCultureCode`。前端镜像为 `src/lib/i18n/locales.ts`，两侧一致性由
`tools/check-languages.mjs` 守卫，**改语言清单必须两侧同时改**。

本模块只做「读清单 + 解析 TextMap 分片路径 + 自检」，不承载文案，也不做语言包生成。
"""

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
    """一种文本语言。`textmap` 为源侧分片文件名，按顺序合并即为该语言的全量文本表。"""

    code: str
    culture: str
    native: str
    textmap: tuple[str, ...]
    default: bool = False

    @property
    def textmap_paths(self) -> tuple[Path, ...]:
        """该语言各 TextMap 分片的绝对路径（顺序即合并顺序）。"""
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
    """全部语言代码（展示顺序）。"""
    return tuple(lang.code for lang in LANGUAGES)


def by_code(code: str) -> Language | None:
    """按代码取语言；未登记返回 None（调用方自行决定回退或缺省）。"""
    return _BY_CODE.get(code)


def resolve(code: str | None) -> Language:
    """把可能为空的语言代码收敛为已登记的 Language（未登记 / 空 → 缺省语言）。"""
    if code:
        found = _BY_CODE.get(code)
        if found is not None:
            return found
    return DEFAULT_LANGUAGE


def non_default_codes() -> tuple[str, ...]:
    """需要 URL 前缀的语言代码（缺省语言保持无前缀）。"""
    return tuple(lang.code for lang in LANGUAGES if not lang.default)
