"""角色星魂转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 AvatarRankConfig.json → character_ranks.json。

    第一期只含 name/desc/icon，不含参数展开。
    """
    data = load_json(EXCEL_DIR / "AvatarRankConfig.json")
    result = []

    for item in data:
        rank_id = item.get("RankID", 0)
        # Name/Desc 是字面量字符串，直接查 TextMap
        name = resolve_text(item.get("Name", ""))
        desc = resolve_text(item.get("Desc", ""))

        result.append({
            "id": rank_id,
            "rank": item.get("Rank", 0),
            "name": name,
            "desc": desc,
            "icon": map_icon_path(item.get("IconPath", "")),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "character_ranks.json")
