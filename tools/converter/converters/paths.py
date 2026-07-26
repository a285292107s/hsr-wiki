"""命途数据转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, PATH_NAME_FALLBACK
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 AvatarBaseType.json → paths.json。"""
    data = load_json(EXCEL_DIR / "AvatarBaseType.json")
    result = []

    for item in data:
        path_id = item.get("ID", "")
        name = resolve_text(item.get("BaseTypeText", {}))
        if not name:
            name = PATH_NAME_FALLBACK.get(path_id, path_id)
        desc = resolve_text(item.get("BaseTypeDesc", {}))

        result.append({
            "id": path_id,
            "name": name,
            "desc": desc,
            "icon": map_icon_path(item.get("BaseTypeIcon", "")),
            "icon_small": map_icon_path(item.get("BaseTypeIconSmall", "")),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "paths.json")
