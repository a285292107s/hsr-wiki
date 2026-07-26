"""属性类型映射表转换器（自建数据，无源文件）。"""

import logging

from config import OUTPUT_DIR, PROPERTY_MAP
from utils import save_json, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """生成 properties.json（自建映射表）。"""
    result = [
        {"id": key, "name": name}
        for key, name in PROPERTY_MAP.items()
    ]
    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "properties.json")
