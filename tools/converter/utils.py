"""通用工具函数。"""

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from config import ICON_PATH_MAP, OFFICIAL_ICON_RULES, OUTPUT_DIR
from textpack import TextRef, group_of, is_token, record, token, token_key

logger = logging.getLogger("converter")

COMPACT_OUTPUT = True

_USE_OFFICIAL_PATHS = False

_TEXT_TOKENS = False
"""令牌模式开关（`convert.py --tokens`）。关闭时序列化路径与多语言改造前逐字节一致。"""


def set_text_tokens(enabled: bool) -> None:
    """切换令牌模式（由 CLI 控制）。"""
    global _TEXT_TOKENS
    _TEXT_TOKENS = enabled


def text_tokens_enabled() -> bool:
    return _TEXT_TOKENS


def _pack_group(filepath: Path) -> str:
    """由输出路径推出语言包分组；路径不在 OUTPUT_DIR 内（测试等）时退回文件名。"""
    try:
        rel = filepath.resolve().relative_to(OUTPUT_DIR.resolve())
    except ValueError:
        return group_of(filepath.name)
    return group_of(rel.as_posix())


def _tokenize(obj: Any, group: str) -> Any:
    """把文本写入令牌化：`TextRef` 换成令牌，**透传的既有令牌也登记键**。

    透传场景真实存在——`endgame_catalog` 从已令牌化的 `maze*.json` 派生 catalog，
    那里拿到的是普通字符串 `"$t:…"`（不是 TextRef）。只登记 TextRef 会让这些分组没有语言包，
    前端解析时抛缺键错误；判据是「结构层里出现过的令牌 = 必须被语言包覆盖的键」，与来源无关。
    """
    if isinstance(obj, TextRef):
        record(group, obj.key)
        return token(obj.key)
    if isinstance(obj, str):
        if is_token(obj):
            record(group, token_key(obj))
        return obj
    if isinstance(obj, dict):
        return {k: _tokenize(v, group) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_tokenize(v, group) for v in obj]
    return obj

def set_pretty(enabled: bool) -> None:
    """设置输出模式（由 CLI --pretty 控制）。enabled=True 时缩进输出。"""
    global COMPACT_OUTPUT
    COMPACT_OUTPUT = not enabled

def set_official_paths(enabled: bool) -> None:
    """设置图标路径输出格式（由 CLI --official-icon-paths 控制）。"""
    global _USE_OFFICIAL_PATHS
    _USE_OFFICIAL_PATHS = enabled

@lru_cache(maxsize=32)
def load_json(filepath: Path) -> Any:
    """加载 JSON 文件（模块级缓存，同路径只解析一次）。"""
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)

def save_json(data: Any, filepath: Path) -> None:
    """保存 JSON 文件，中文不转义。默认紧凑模式，--pretty 时缩进。

    令牌模式下先把 `TextRef` 写成 `"$t:<键>"` 并登记语言包键集合（多语言改造见 ADR 0052）；
    关闭时不做任何遍历，输出与改造前逐字节一致。

    先写同目录临时文件再原子替换，避免进程中断留下半截 JSON。
    """
    payload = _tokenize(data, _pack_group(filepath)) if _TEXT_TOKENS else data
    filepath.parent.mkdir(parents=True, exist_ok=True)
    tmp = filepath.with_suffix(filepath.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        if COMPACT_OUTPUT:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(tmp, filepath)
    logger.info("已保存 %s（%s 条）", filepath, len(data) if isinstance(data, (list, dict)) else "?")

def unwrap_value(obj: Any) -> Any:
    """递归剥离 { "Value": x } 包装，返回纯值。"""
    if isinstance(obj, dict):
        if len(obj) == 1 and "Value" in obj:
            return obj["Value"]
        return {k: unwrap_value(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [unwrap_value(item) for item in obj]
    return obj

def _try_official_path(source_path: str) -> Optional[str]:
    """尝试用 OFFICIAL_ICON_RULES 映射官方相对路径。失败返回 None。"""
    if not source_path:
        return None
    for src_prefix, rule_fn in OFFICIAL_ICON_RULES.items():
        if source_path.startswith(src_prefix):
            filename = source_path[len(src_prefix):]
            result = rule_fn(filename)
            if result is not None:
                return result
            break
    return None

def map_icon_path(source_path: str) -> str:
    """将源数据图片路径映射为 CDN 相对路径。

    根据全局 _USE_OFFICIAL_PATHS 开关选择：
      - False（默认）：旧短路径 icon/character/1001.png
      - True：官方 StarRailTextures 仓库相对路径 avatarshopicon/avatar/1001.png
        （某前缀未注册/规则返回 None 时自动回退旧格式，保证兼容性）
    """
    if not source_path:
        return ""
    if _USE_OFFICIAL_PATHS:
        official = _try_official_path(source_path)
        if official is not None:
            return official
    for src_prefix, dst_prefix in ICON_PATH_MAP.items():
        if source_path.startswith(src_prefix):
            return dst_prefix + source_path[len(src_prefix):]
    logger.warning("无法映射图片路径: %s", source_path)
    return source_path

def sort_by_id(data: list, key: str = "id") -> list:
    """按 id 字段升序排序。"""
    return sorted(data, key=lambda x: x.get(key, 0))
