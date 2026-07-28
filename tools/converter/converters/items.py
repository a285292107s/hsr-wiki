"""物品数据转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")

# 不属于"物品"分类、应从物品目录中剔除的主类型（整体排除）。
# - Display：遗器套装/稀有度展示占位桩，非真实物品，仅供遗器页 UI 引用。
# - Pet：宠物/呼噜乐，独立概念，不应出现在物品列表。
EXCLUDED_MAIN_TYPES = {"Display", "Pet"}

# Usable 主类型下，属于外观/个性化解锁（非消耗/收藏向物品）的子类型，剔除。
EXCLUDED_USABLE_SUBTYPES = {
    "PhoneTheme",       # 手机主题
    "PlayerOutfit",     # 列车长时装
    "ChatBubble",       # 聊天气泡
    "PersonalCard",     # 个人名片
    "HeadIconFrame",    # 头像框
    "PamSkin",          # 帕姆皮肤
    "PhoneCase",        # 手机壳
    "PlatformBoundGift",  # 平台绑定外观礼盒
}


def _is_excluded(item: dict) -> bool:
    main_type = item.get("ItemMainType", "")
    if main_type in EXCLUDED_MAIN_TYPES:
        return True
    if main_type == "Usable" and item.get("ItemSubType", "") in EXCLUDED_USABLE_SUBTYPES:
        return True
    return False


def convert() -> None:
    """转换 ItemConfig.json → items.json（剔除非物品类型）。"""
    data = load_json(EXCEL_DIR / "ItemConfig.json")
    result = []
    excluded = 0

    for item in data:
        if _is_excluded(item):
            excluded += 1
            continue

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
    logger.info("物品转换完成：保留 %d 条，剔除非物品 %d 条", len(result), excluded)
