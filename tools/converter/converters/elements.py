"""属性数据转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, ELEMENT_NAME_FALLBACK
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 DamageType.json → elements.json。"""
    data = load_json(EXCEL_DIR / "DamageType.json")
    result = []

    for item in data:
        elem_id = item.get("ID", "")
        name = resolve_text(item.get("DamageTypeName", {}))
        if not name:
            name = ELEMENT_NAME_FALLBACK.get(elem_id, elem_id)
        desc = resolve_text(item.get("DamageTypeIntro", {}))
        color = item.get("Color", "")

        result.append({
            "id": elem_id,
            "name": name,
            "desc": desc,
            "color": color,
            "icon": map_icon_path(item.get("DamageTypeIconPath", "")),
            "icon_color": map_icon_path(item.get("IconNatureColor", "")),
            "icon_weak": map_icon_path(item.get("IconNatureForWeakActive", "")),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "elements.json")
