"""通用工具函数。"""

import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from config import ICON_PATH_MAP, OFFICIAL_ICON_RULES

logger = logging.getLogger("converter")

# 全局输出模式：True=紧凑（生产），False=缩进（调试）
COMPACT_OUTPUT = True

# 全局图标路径格式：False=旧短路径 icon/xxx（默认），True=官方 StarRailTextures 相对路径
_USE_OFFICIAL_PATHS = False


def set_pretty(enabled: bool) -> None:
    """设置输出模式（由 CLI --pretty 控制）。enabled=True 时缩进输出。"""
    global COMPACT_OUTPUT
    COMPACT_OUTPUT = not enabled


def set_official_paths(enabled: bool) -> None:
    """设置图标路径输出格式（由 CLI --official-icon-paths 控制）。"""
    global _USE_OFFICIAL_PATHS
    _USE_OFFICIAL_PATHS = enabled


# 源文件加载缓存：同一进程内多个模块重复加载同一源文件（如 AvatarConfig 被
# characters/character_detail/currency 共用）时只解析一次。源数据只读不写，
# 调用方不得原地修改返回的 dict/list。
@lru_cache(maxsize=32)
def load_json(filepath: Path) -> Any:
    """加载 JSON 文件（模块级缓存，同路径只解析一次）。"""
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, filepath: Path) -> None:
    """保存 JSON 文件，中文不转义。默认紧凑模式，--pretty 时缩进。

    先写同目录临时文件再原子替换，避免进程中断留下半截 JSON。
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)
    tmp = filepath.with_suffix(filepath.suffix + ".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        if COMPACT_OUTPUT:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, filepath)
    logger.info("已保存 %s（%s 条）", filepath, len(data) if isinstance(data, (list, dict)) else "?")


def unwrap_value(obj: Any) -> Any:
    """递归剥离 { "Value": x } 包装，返回纯值。"""
    if isinstance(obj, dict):
        # 只含 Value 键的字典 → 剥离
        if len(obj) == 1 and "Value" in obj:
            return obj["Value"]
        # 递归处理所有值
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
            break  # 前缀命中但规则返回 None（如 skillicons 抓不到 ID）→ 不再继续匹配其他前缀
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
        # 回退：官方规则不覆盖，走旧短路径
    for src_prefix, dst_prefix in ICON_PATH_MAP.items():
        if source_path.startswith(src_prefix):
            return dst_prefix + source_path[len(src_prefix):]
    # 无法映射，保留原路径并记 warning
    logger.warning("无法映射图片路径: %s", source_path)
    return source_path


def sort_by_id(data: list, key: str = "id") -> list:
    """按 id 字段升序排序。"""
    return sorted(data, key=lambda x: x.get(key, 0))
