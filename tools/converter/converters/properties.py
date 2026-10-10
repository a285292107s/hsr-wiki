"""属性类型映射表转换器（无独立源文件，名称取自官方文本表的词条名）。"""

import logging

from config import OUTPUT_DIR, PROPERTY_MAP
from enum_labels import resolve as resolve_label
from utils import save_json, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """生成 properties.json（枚举 → 官方词条名令牌）。

    名称来自 `enum_labels`（官方 TextMap 词条名）而不是写死中文：既让 13 种语言各自成型，也把
    「转换器自造文案」从产物里消掉。官方无独立词条的少数属性（速度百分比 / 最大战技点）回退本地
    中文映射，落成普通字符串并被残留清单点名。
    """
    result = [
        {"id": key, "name": resolve_label("property", key, name)}
        for key, name in PROPERTY_MAP.items()
    ]
    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "properties.json")
