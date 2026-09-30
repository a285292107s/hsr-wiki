"""物品数据转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")

EXCLUDED_MAIN_TYPES = {"Display", "Pet"}

EXCLUDED_USABLE_SUBTYPES = {
    "PhoneTheme",
    "PlayerOutfit",
    "ChatBubble",
    "PersonalCard",
    "HeadIconFrame",
    "PamSkin",
    "PhoneCase",
    "PlatformBoundGift",
}

def _is_excluded(item: dict) -> bool:
    main_type = item.get("ItemMainType", "")
    if main_type in EXCLUDED_MAIN_TYPES:
        return True
    if main_type == "Usable" and item.get("ItemSubType", "") in EXCLUDED_USABLE_SUBTYPES:
        return True
    return False

def _parse_item(item: dict) -> dict:
    """单条 ItemConfig 记录 → items.json 条目。"""
    item_id = item.get("ID", 0)
    rarity_key = item.get("Rarity", "")
    return {
        "id": item_id,
        "name": resolve_text(item.get("ItemName", {})),
        "desc": resolve_text(item.get("ItemDesc", {})),
        "bg_desc": resolve_text(item.get("ItemBGDesc", {})),
        "main_type": item.get("ItemMainType", ""),
        "sub_type": item.get("ItemSubType", ""),
        "rarity": RARITY_MAP.get(rarity_key, 0),
        "purpose_type": item.get("PurposeType", 0),
        "icon": map_icon_path(item.get("ItemIconPath", "")),
        "figure_icon": map_icon_path(item.get("ItemFigureIconPath", "")),
    }

def convert() -> None:
    """转换 ItemConfig.json → items.json（剔除非物品类型）。"""
    data = load_json(EXCEL_DIR / "ItemConfig.json")
    result = []
    excluded = 0

    for item in data:
        if _is_excluded(item):
            excluded += 1
            continue
        result.append(_parse_item(item))

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "items.json")
    logger.info("物品转换完成：保留 %d 条，剔除非物品 %d 条", len(result), excluded)
