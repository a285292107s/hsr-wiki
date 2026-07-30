"""通用工具函数。"""

import json
import logging
from pathlib import Path
from typing import Any

from config import ICON_PATH_MAP

logger = logging.getLogger("converter")

# 全局输出模式：True=紧凑（生产），False=缩进（调试）
COMPACT_OUTPUT = True


def set_pretty(enabled: bool) -> None:
    """设置输出模式（由 CLI --pretty 控制）。enabled=True 时缩进输出。"""
    global COMPACT_OUTPUT
    COMPACT_OUTPUT = not enabled


def load_json(filepath: Path) -> Any:
    """加载 JSON 文件。"""
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, filepath: Path) -> None:
    """保存 JSON 文件，中文不转义。默认紧凑模式，--pretty 时缩进。"""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        if COMPACT_OUTPUT:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        else:
            json.dump(data, f, ensure_ascii=False, indent=2)
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


def map_icon_path(source_path: str) -> str:
    """将源数据图片路径映射为 CDN 相对路径。"""
    if not source_path:
        return ""
    for src_prefix, dst_prefix in ICON_PATH_MAP.items():
        if source_path.startswith(src_prefix):
            return dst_prefix + source_path[len(src_prefix):]
    # 无法映射，保留原路径并记 warning
    logger.warning("无法映射图片路径: %s", source_path)
    return source_path


def sort_by_id(data: list, key: str = "id") -> list:
    """按 id 字段升序排序。"""
    return sorted(data, key=lambda x: x.get(key, 0))
