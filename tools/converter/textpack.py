"""文本引用令牌与语言包（[ADR 0052](../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 2）。

结构层（`public/data/*.json`）不再落最终文本，而是落**文本引用令牌** `"$t:<TextMap 键>"`：
结构单份、语言无关；各语言文本按语言单独成包，前端在解析层替换。收益实测——产物里 14.9 万
处文本只为 4.375 万个不同键，键空间远小于文本字节。

本模块只做三件事，不含任何转换逻辑、不决定分组与落盘位置：

1. `token` / `is_token` / `token_key`：令牌的编解码（前后端同构，前端镜像见
   `src/lib/i18n/text-ref.ts`，两侧格式由 `tools/converter/tests/test_textpack.py` 与
   `src/lib/__tests__/text-ref.test.ts` 各自钉住）。
2. `Interner`：转换期收集「结构层用到了哪些键」，供语言包生成。
3. `load_language_textmap` / `build_pack` / `write_pack`：按语言生成语言包，**缺键从缺省语言
   回填**，使语言包自包含（前端因此不需要第二份回退包）。
"""

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
    """文本键 → 原文变体键。"""
    return key + RAW_SUFFIX


def is_raw_variant(key: str) -> bool:
    """判断键是否为原文变体。"""
    return key.endswith(RAW_SUFFIX)


def base_key(key: str) -> str:
    """剥掉变体后缀，取回 TextMap 键。"""
    return key[: -len(RAW_SUFFIX)] if is_raw_variant(key) else key


class TextPackError(RuntimeError):
    """令牌格式或语言包生成失败（配置/数据问题，应当中断转换而不是静默降级）。"""


def token(key: str) -> str:
    """把 TextMap 键编码为文本引用令牌。"""
    if not key:
        raise TextPackError("TextMap 键为空，无法生成令牌")
    if key.startswith(TOKEN_PREFIX):
        raise TextPackError(f"TextMap 键本身以令牌前缀开头: {key!r}")
    return TOKEN_PREFIX + key


def is_token(value: Any) -> bool:
    """判断一个值是否为文本引用令牌（仅字符串形态，数字/对象一律不是）。"""
    return isinstance(value, str) and value.startswith(TOKEN_PREFIX)


def token_key(value: str) -> str:
    """从令牌取回 TextMap 键；非令牌抛错。"""
    if not is_token(value):
        raise TextPackError(f"不是文本引用令牌: {value!r}")
    return value[len(TOKEN_PREFIX):]


def ensure_plain_text(text: str, where: str = "") -> str:
    """断言文本不形如令牌——落进结构层的原文若以令牌前缀开头会与令牌混淆。"""
    if is_token(text):
        raise TextPackError(f"文本以令牌前缀开头，无法与令牌区分{(' @ ' + where) if where else ''}: {text[:80]!r}")
    return text


class TextRef(str):
    """已解析文本 + 其 TextMap 键。

    做成 `str` 子类是为了**不改动转换器里 140 处既有用法**：比较、排序、切片、f-string
    插值、`.replace()` 全部照常工作；只有序列化时（`utils.save_json` 开启令牌模式）才把
    `TextRef` 换成 `"$t:<键>"`。

    副作用即「残留中文」的判据：任何把 `TextRef` 再加工成普通 `str` 的写法（f-string 拼接、
    `str.replace`）都会丢掉键、把中文留在结构层——这正是多语言化未完成的显式信号，由
    `survey_residual_text` 盘点成清单，而不是静默通过。
    """

    __slots__ = ("key",)

    def __new__(cls, text: str, key: str) -> "TextRef":
        obj = super().__new__(cls, text)
        obj.key = key
        return obj


def group_of(rel_path: str) -> str:
    """数据文件相对路径 → 语言包分组名（前后端共用的唯一分组规则）。

    `characters/1310.json` → `characters`；`maze.catalog.json` → `maze.catalog`。
    分组存在的理由是**首屏成本**：整站单包约 7 MB，按分组切分后一个目录页只取自己那一份。
    """
    rel = rel_path.replace("\\", "/").lstrip("/")
    if "/" in rel:
        return rel.split("/", 1)[0]
    return rel[:-5] if rel.endswith(".json") else rel


class Interner:
    """转换期收集某个分组引用的 TextMap 键（键空间按分组切分）。"""

    def __init__(self) -> None:
        self._keys: set[str] = set()
        self._refs = 0

    def intern(self, key: str) -> str:
        """登记键并返回其令牌。"""
        self._keys.add(key)
        self._refs += 1
        return token(key)

    def merge(self, other: "Interner") -> None:
        """合并另一个收集器（子进程/子批次的键并入）。"""
        self._keys |= other._keys
        self._refs += other._refs

    @property
    def keys(self) -> frozenset[str]:
        """已登记的键（顺序无关，供语言包生成）。"""
        return frozenset(self._keys)

    @property
    def refs(self) -> int:
        """令牌产出次数（含重复引用），用于评估「文本引用 / 不同键」的重复比。"""
        return self._refs

    def __len__(self) -> int:
        return len(self._keys)


class PackBuilder:
    """按分组收集键，并一次性产出各语言的语言包。

    单语言 TextMap 可达 50–70 MB，**每个语言只加载一次**（而非每个分组加载一次），
    缺省语言的文本表全程驻留以充当回填源。
    """

    def __init__(self) -> None:
        self._by_group: dict[str, Interner] = {}
        self._composers: dict[str, Composer] = {}

    def register_composer(self, key: str, composer: Composer) -> None:
        """登记「键 → 组合器」：该键在各语言语言包里由组合器现算，而非查 TextMap。"""
        self._composers[key] = composer

    def record(self, group: str, key: str) -> None:
        """登记「分组 group 用到了键 key」。"""
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
        """写出 `out_dir/<语言>/<分组>.json`，返回「语言 → 键总数」供日志与自检。

        `cleaner` 是把 TextMap 原文变成默认正文的清洗函数（`textmap.clean_text`）：
        普通键取清洗结果，`~raw` 变体键保留原文——否则前端会把游戏标记当正文显示。
        """
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
    """按语言回填出一个分组的语言包（缺省语言自身缺键即失败）。

    包值按来源加工：组合器键由组合器**现算**（各语言各调一次），普通键走 `cleaner`
    （清洗游戏标记），`~raw` 变体键保留原文。
    """
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
    """当前转换会话的收集器（未开启令牌模式时为 None）。"""
    return _session


def composed_ref(key: str, composer: Composer, text: str) -> TextRef:
    """登记一个**组合文案**并返回其文本引用。

    组合若发生在转换期，只能拿到当时那一种语言的文本（且切分 / 替换会把 `TextRef` 退化成普通
    字符串）⇒ 改为登记组合器：语言包生成时逐语言各调一次。返回的 `TextRef` 在令牌模式下写成
    `"$t:<key>"`，在 `--raw` 模式下写成 `text`（即调用方算好的缺省语言文本），两种模式都自洽。
    """
    if _session is not None:
        _session.register_composer(key, composer)
    return TextRef(text, key)


def begin() -> PackBuilder:
    """开启一次「结构层令牌化 + 语言包」收集会话。"""
    global _session
    _session = PackBuilder()
    return _session


def end() -> None:
    """结束收集会话。"""
    global _session
    _session = None


def record(group: str, key: str) -> None:
    """把「某分组用到了某键」登记进当前会话；未开启会话时忽略（默认转换路径零开销）。"""
    if _session is not None:
        _session.record(group, key)


_session: PackBuilder | None = None


def load_language_textmap(code: str) -> dict[str, str]:
    """加载某语言的全量 TextMap（分片按声明顺序合并）。

    单语言原始文件可达 50–70 MB，调用方负责用后即弃；13 语言切勿同时驻留。
    """
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
    """按语言生成单个语言包：`{变体键: 该语言文本}`（缺键从缺省语言回填）。

    返回 `(语言包, 被回填的键列表)`。多分组批量生成走 `PackBuilder.write`（每语言只加载一次
    TextMap），本函数服务单包调用与测试。
    """
    if by_code(code) is None:
        raise TextPackError(f"未登记的语言: {code!r}")
    textmap = load_language_textmap(code)
    fallback_tm = textmap if code == fallback_code else load_language_textmap(fallback_code)
    return _fill(list(keys), textmap, fallback_tm, code, "<单包>", cleaner)


def write_pack(path: Path, pack: Mapping[str, str]) -> None:
    """写出语言包（键排序 + 紧凑 JSON，保证增量转换下 git diff 稳定）。"""
    ordered = {key: pack[key] for key in sorted(pack)}
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(ordered, f, ensure_ascii=False, separators=(",", ":"))
    tmp.replace(path)
    logger.info("已保存语言包 %s（%d 键）", path, len(ordered))


def missing_keys(pack: Mapping[str, str], keys: Iterable[str]) -> list[str]:
    """语言包相对给定键集合的缺键（生成后自检用）。"""
    return [key for key in keys if not pack.get(key)]


def substitute(value: Any, pack: Mapping[str, str], path: str = "") -> Any:
    """递归用语言包替换令牌，返回新结构（不改原对象）。

    与前端 `resolveTextTokens` 同构：仅供转换期自检与测试使用——**站点运行期不做这件事的
    是前端那份实现**，转换器自身不消费自己的令牌。
    """
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
    """统计结构层里出现的令牌（键 → 次数），用于「结构层无残留文本」自检。"""
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
    """文本是否含中文——结构层里出现即代表这段文案尚未令牌化（多语言化未完成）。"""
    return is_token(text) is False and bool(_CJK_RE.search(text))


def survey_tree(root: Path, skip: tuple[str, ...] = ("i18n",)) -> dict[str, list[tuple[str, str]]]:
    """扫描结构层目录，返回「文件相对路径 → 残留中文清单」（跳过语言包目录）。

    这是多语言化进度的**可判定判据**：清单里的每一处都是转换器自己拼出来、语言包取不到的文案，
    必须改成稳定枚举键（由前端词典本地化）或改为从 TextMap 取值。按文件全量扫描，因此不受
    增量跳过影响（`--tokens` 结束后调用一次）。
    """
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
    """盘点结构层里「仍是普通字符串且含中文」的文本——即尚未令牌化的写死中文。

    这是多语言化进度的**可判定判据**（而非人工 eyeball）：`--tokens` 转换结束后按文件盘点，
    清单里的每一处都是「转换器自己拼出来、语言包里取不到」的文案，必须改成稳定枚举键
    （前端词典本地化）或改为从 TextMap 取值。
    """
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
