"""TextMap 加载与文本解析。"""

import logging
import re
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


def clean_text(text: str) -> str:
    """清洗游戏内文本标签，返回纯文本。

    处理内容：
    - {NICKNAME} → 开拓者
    - {SPACE} → 空格
    - {RUBY_...} 标签 → 移除
    - <color=...>...</color> → 保留文字，去掉标签
    - <unbreak>...</unbreak> → 保留文字，去掉标签
    - 其他未知标签 → 移除
    """
    if not text:
        return ""

    # 替换占位符
    text = text.replace("{NICKNAME}", "开拓者")
    text = text.replace("{SPACE}", " ")

    # 移除 RUBY 标签
    text = re.sub(r"\{RUBY_[EB]#(?:[^}]*)\}", "", text)

    # 处理 <color=...>...</color> → 保留文字
    text = re.sub(r"<color=([^>]+)>", "", text)
    text = re.sub(r"</color>", "", text)

    # 处理 <unbreak>...</unbreak> → 保留文字
    text = re.sub(r"</?unbreak>", "", text)

    # 移除其他未知 HTML 标签（保留 <u> 标签用于下划线，如不需要可移除）
    # 这里保留纯文字，移除所有标签
    text = re.sub(r"<[^>]+>", "", text)

    return text


def resolve_text(ref: Any, clean: bool = True) -> str:
    """解析文本引用，支持 Hash 对象和字面量字符串。

    - Hash 对象: { "Hash": 6186714091647966180 } → 转字符串查 TextMap
    - 字面量字符串: "RelicDesc_1012" → 先直接查 TextMap，未命中则计算 xxhash64 再查
    - 纯字符串: 直接返回
    - None/空: 返回空字符串

    Args:
        ref: 文本引用
        clean: 是否清洗游戏内标签（默认 True）
    """
    if ref is None:
        return ""

    result = ""

    # Hash 对象
    if isinstance(ref, dict) and "Hash" in ref:
        key = str(ref["Hash"])
        result = _text_map.get(key, "")

    # 字面量字符串
    elif isinstance(ref, str):
        if not ref:
            return ""
        # 先直接查 TextMap
        if ref in _text_map:
            result = _text_map[ref]
        else:
            # 未命中，计算 xxhash64 再查
            h = xxhash.xxh64(ref).intdigest()
            key = str(h)
            if key in _text_map:
                result = _text_map[key]
            else:
                # 都未命中，返回原文
                result = ref

    else:
        result = str(ref)

    if clean:
        result = clean_text(result)

    return result


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
