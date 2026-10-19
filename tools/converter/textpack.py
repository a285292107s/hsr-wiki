from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Callable, Iterable, Mapping, MutableMapping

from languages import DEFAULT_CODE, by_code

logger = logging.getLogger("converter")

Cleaner = Callable[[str, Mapping[str, str]], str]
"""TextMap 原文 → 默认正文的清洗函数（`textmap.clean_text`）。

由调用方注入而非在此 import：`textmap` 需要 `textpack.TextRef`，反过来 import 会构成循环依赖。
"""

Composer = Callable[[Mapping[str, str]], str]
"""组合器：`该语言的文本表 → 组合后的正文`。

给「模板 + 参数 / 模板包含模板」这类**必须组合**的文案用：组合若发生在转换期，就只能拿到当时
那一种语言的文本（切分 / 正则替换还会把携带键的 `TextRef` 退化成普通字符串）；把组合包装成
组合器后，语言包在**逐语言**生成时各调一次，产物里仍然是普通文本 ⇒ **前端与快照生成器零改动**。
"""

TOKEN_PREFIX = "$t:"
"""令牌前缀。游戏文本不会以此开头（占位符一律是 `{...}`），且由本模块独占产出。"""

RAW_SUFFIX = "~raw"
"""原文变体后缀（`clean=False` 取到的文本带此后缀）。

同一个 TextMap 键在产物里有两种需求：默认**清洗后**正文（剥掉 `<unbreak>` `<color>` 等游戏标记），
与**原样保留**游戏标记（技能 / 剧情描述，交由前端 `gameTagsToHtml` 渲染）。语言包用「键 + 后缀」
区分两种变体，因此包值必须按变体分别加工（`cleaner`），否则界面会把标签当正文显示。
"""


def raw_variant(key: str) -> str:
    return key + RAW_SUFFIX


def is_raw_variant(key: str) -> bool:
    return key.endswith(RAW_SUFFIX)


def base_key(key: str) -> str:
    return key[: -len(RAW_SUFFIX)] if is_raw_variant(key) else key


class TextPackError(RuntimeError):
    pass

def token(key: str) -> str:
    if not key:
        raise TextPackError("TextMap 键为空，无法生成令牌")
    if key.startswith(TOKEN_PREFIX):
        raise TextPackError(f"TextMap 键本身以令牌前缀开头: {key!r}")
    return TOKEN_PREFIX + key


def is_token(value: Any) -> bool:
    return isinstance(value, str) and value.startswith(TOKEN_PREFIX)


def token_key(value: str) -> str:
    if not is_token(value):
        raise TextPackError(f"不是文本引用令牌: {value!r}")
    return value[len(TOKEN_PREFIX):]


def ensure_plain_text(text: str, where: str = "") -> str:
    if is_token(text):
        raise TextPackError(f"文本以令牌前缀开头，无法与令牌区分{(' @ ' + where) if where else ''}: {text[:80]!r}")
    return text


class TextRef(str):
    __slots__ = ("key",)

    def __new__(cls, text: str, key: str) -> "TextRef":
        obj = super().__new__(cls, text)
        obj.key = key
        return obj


def group_of(rel_path: str) -> str:
    rel = rel_path.replace("\\", "/").lstrip("/")
    if "/" in rel:
        return rel.split("/", 1)[0]
    return rel[:-5] if rel.endswith(".json") else rel


class Interner:
    def __init__(self) -> None:
        self._keys: set[str] = set()
        self._refs = 0

    def intern(self, key: str) -> str:
        self._keys.add(key)
        self._refs += 1
        return token(key)

    def merge(self, other: "Interner") -> None:
        self._keys |= other._keys
        self._refs += other._refs

    @property
    def keys(self) -> frozenset[str]:
        return frozenset(self._keys)

    @property
    def refs(self) -> int:
        return self._refs

    def __len__(self) -> int:
        return len(self._keys)


class PackBuilder:
    def __init__(self) -> None:
        self._by_group: dict[str, Interner] = {}
        self._composers: dict[str, Composer] = {}

    def register_composer(self, key: str, composer: Composer) -> None:
        self._composers[key] = composer

    def record(self, group: str, key: str) -> None:
        interner = self._by_group.get(group)
        if interner is None:
            interner = self._by_group[group] = Interner()
        interner.intern(key)

    @property
    def groups(self) -> tuple[str, ...]:
        return tuple(sorted(self._by_group))

    def keys_of(self, group: str) -> frozenset[str]:
        return self._by_group[group].keys

    def write(self, out_dir: Path, codes: Iterable[str], cleaner: Cleaner) -> dict[str, int]:
        if not self._by_group:
            raise TextPackError("没有任何键被登记，拒绝写出空语言包")
        codes = list(codes)
        if DEFAULT_CODE not in codes:
            raise TextPackError(f"语言列表必须包含缺省语言 {DEFAULT_CODE}（回填源）")

        fallback_tm = load_language_textmap(DEFAULT_CODE)
        stats: dict[str, int] = {}
        for code in codes:
            textmap = fallback_tm if code == DEFAULT_CODE else load_language_textmap(code)
            total = 0
            for group in self.groups:
                keys = self.keys_of(group)
                pack, _filled = _fill(
                    keys, textmap, fallback_tm, code, group, cleaner, self._composers,
                )
                write_pack(out_dir / code / f"{group}.json", pack)
                total += len(pack)
            stats[code] = total
            if code != DEFAULT_CODE:
                del textmap
        return stats


def _fill(
    keys: Iterable[str],
    textmap: Mapping[str, str],
    fallback_tm: Mapping[str, str],
    code: str,
    group: str,
    cleaner: Cleaner,
    composers: Mapping[str, Composer] | None = None,
) -> tuple[dict[str, str], list[str]]:
    pack: dict[str, str] = {}
    filled: list[str] = []
    composers = composers or {}
    for key in keys:
        composer = composers.get(key)
        if composer is not None:
            text = composer(textmap)
            if not (text and text.strip()):
                raise TextPackError(f"组合器 {key!r}（分组 {group}）在语言 {code} 下产出空文本")
            pack[key] = text
            continue
        base = base_key(key)
        text = textmap.get(base)
        if not (text and text.strip()):
            if code == DEFAULT_CODE:
                raise TextPackError(
                    f"缺省语言 {DEFAULT_CODE} 缺键 {base!r}（分组 {group}），语言包无回退来源"
                )
            back = fallback_tm.get(base)
            if not (back and back.strip()):
                raise TextPackError(
                    f"键 {base!r}（分组 {group}）在 {code} 与缺省语言 {DEFAULT_CODE} 中都不存在，无法回填"
                )
            text = back
            filled.append(key)
        pack[key] = text if is_raw_variant(key) else cleaner(text, textmap)
    if filled:
        logger.info("语言 %s 分组 %s: %d 个键从 %s 回填", code, group, len(filled), DEFAULT_CODE)
    return pack, filled


def session() -> PackBuilder | None:
    return _session


def composed_ref(key: str, composer: Composer, text: str) -> TextRef:
    if _session is not None:
        _session.register_composer(key, composer)
    return TextRef(text, key)


def begin() -> PackBuilder:
    global _session
    _session = PackBuilder()
    return _session


def end() -> None:
    global _session
    _session = None


def record(group: str, key: str) -> None:
    if _session is not None:
        _session.record(group, key)


_session: PackBuilder | None = None


def load_language_textmap(code: str) -> dict[str, str]:
    lang = by_code(code)
    if lang is None:
        raise TextPackError(f"未登记的语言: {code!r}（见 tools/converter/languages.json）")
    merged: dict[str, str] = {}
    for path in lang.textmap_paths:
        if not path.exists():
            raise TextPackError(f"缺少 TextMap 分片: {path}")
        with open(path, encoding="utf-8") as f:
            merged.update(json.load(f))
    return merged


def build_pack(
    keys: Iterable[str],
    code: str,
    cleaner: Cleaner,
    fallback_code: str = DEFAULT_CODE,
) -> tuple[dict[str, str], list[str]]:
    if by_code(code) is None:
        raise TextPackError(f"未登记的语言: {code!r}")
    textmap = load_language_textmap(code)
    fallback_tm = textmap if code == fallback_code else load_language_textmap(fallback_code)
    return _fill(list(keys), textmap, fallback_tm, code, "<单包>", cleaner)


def write_pack(path: Path, pack: Mapping[str, str]) -> None:
    ordered = {key: pack[key] for key in sorted(pack)}
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, separators=(",", ":"))
    tmp.replace(path)
    logger.info("已保存语言包 %s（%d 键）", path, len(ordered))


def missing_keys(pack: Mapping[str, str], keys: Iterable[str]) -> list[str]:
    return [key for key in keys if not pack.get(key)]


def substitute(value: Any, pack: Mapping[str, str], path: str = "") -> Any:
    if is_token(value):
        key = token_key(value)
        text = pack.get(key)
        if text is None:
            raise TextPackError(f"语言包缺键 {key}{(' @ ' + path) if path else ''}")
        return text
    if isinstance(value, dict):
        return {k: substitute(v, pack, f"{path}.{k}" if path else str(k)) for k, v in value.items()}
    if isinstance(value, list):
        return [substitute(v, pack, f"{path}[{i}]") for i, v in enumerate(value)]
    return value


def collect_tokens(value: Any, sink: MutableMapping[str, int]) -> None:
    if is_token(value):
        key = token_key(value)
        sink[key] = sink.get(key, 0) + 1
    elif isinstance(value, dict):
        for v in value.values():
            collect_tokens(v, sink)
    elif isinstance(value, list):
        for v in value:
            collect_tokens(v, sink)


_CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")


def has_residual_cjk(text: str) -> bool:
    return is_token(text) is False and bool(_CJK_RE.search(text))


def survey_tree(root: Path, skip: tuple[str, ...] = ("i18n",)) -> dict[str, list[tuple[str, str]]]:
    report: dict[str, list[tuple[str, str]]] = {}
    if not root.exists():
        return report
    for path in sorted(root.rglob("*.json")):
        rel = path.relative_to(root).as_posix()
        if rel.split("/", 1)[0] in skip:
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        found = survey_residual_text(data)
        if found:
            report[rel] = found
    return report


def survey_residual_text(value: Any, path: str = "") -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []
    if isinstance(value, str):
        if has_residual_cjk(value):
            found.append((path, value))
        return found
    if isinstance(value, dict):
        for k, v in value.items():
            found.extend(survey_residual_text(v, f"{path}.{k}" if path else str(k)))
        return found
    if isinstance(value, list):
        for i, v in enumerate(value):
            found.extend(survey_residual_text(v, f"{path}[{i}]"))
        return found
    return found
