"""TextMap 加载与文本解析。"""

import logging
from typing import Any

import xxhash

from utils import load_json
from config import TEXTMAP_FILE

logger = logging.getLogger("converter")

_text_map: dict[str, str] = {}


def load_textmap() -> None:
    """加载 TextMap 到内存。"""
    global _text_map
    _text_map = load_json(TEXTMAP_FILE)
    logger.info("已加载 TextMap（%s 条）", len(_text_map))


def resolve_text(ref: Any) -> str:
    """解析文本引用，支持 Hash 对象和字面量字符串。

    - Hash 对象: { "Hash": 6186714091647966180 } → 转字符串查 TextMap
    - 字面量字符串: "RelicDesc_1012" → 先直接查 TextMap，未命中则计算 xxhash64 再查
    - 纯字符串: 直接返回
    - None/空: 返回空字符串
    """
    if ref is None:
        return ""

    # Hash 对象
    if isinstance(ref, dict) and "Hash" in ref:
        key = str(ref["Hash"])
        return _text_map.get(key, "")

    # 字面量字符串
    if isinstance(ref, str):
        if not ref:
            return ""
        # 先直接查 TextMap
        if ref in _text_map:
            return _text_map[ref]
        # 未命中，计算 xxhash64 再查
        h = xxhash.xxh64(ref).intdigest()
        key = str(h)
        if key in _text_map:
            return _text_map[key]
        # 都未命中，返回原文
        return ref

    return str(ref)


def resolve_text_or_warn(ref: Any, context: str = "") -> str:
    """解析文本引用，未命中时记 warning。"""
    result = resolve_text(ref)
    if not result and ref:
        if isinstance(ref, dict) and "Hash" in ref:
            logger.warning("TextMap 未命中 Hash=%s %s", ref["Hash"], context)
        elif isinstance(ref, str) and ref in (
            "AvatarRankName_100101",  # 仅对字面量 key 警告
        ):
            logger.warning("TextMap 未命中 key=%s %s", ref, context)
    return result
