"""物品数据转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 ItemConfig.json → items.json。"""
    data = load_json(EXCEL_DIR / "ItemConfig.json")
    result = []

    for item in data:
        item_id = item.get("ID", 0)
        name = resolve_text(item.get("ItemName", {}))
        desc = resolve_text(item.get("ItemDesc", {}))
        bg_desc = resolve_text(item.get("ItemBGDesc", {}))
        rarity_key = item.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)

        result.append({
            "id": item_id,
            "name": name,
            "desc": desc,
            "bg_desc": bg_desc,
            "main_type": item.get("ItemMainType", ""),
            "sub_type": item.get("ItemSubType", ""),
            "rarity": rarity,
            "purpose_type": item.get("PurposeType", 0),
            "icon": map_icon_path(item.get("ItemIconPath", "")),
            "figure_icon": map_icon_path(item.get("ItemFigureIconPath", "")),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "items.json")
