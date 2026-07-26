"""遗器词条转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR
from utils import load_json, save_json, unwrap_value, sort_by_id

logger = logging.getLogger("converter")


def convert_main() -> None:
    """转换 RelicMainAffixConfig.json → relic_main_affixes.json。"""
    data = load_json(EXCEL_DIR / "RelicMainAffixConfig.json")
    result = []

    for item in data:
        result.append({
            "group_id": item.get("GroupID", 0),
            "affix_id": item.get("AffixID", 0),
            "property": item.get("Property", ""),
            "base_value": unwrap_value(item.get("BaseValue", {})),
            "level_add": unwrap_value(item.get("LevelAdd", {})),
        })

    result = sort_by_id(result, key="group_id")
    save_json(result, OUTPUT_DIR / "relic_main_affixes.json")


def convert_sub() -> None:
    """转换 RelicSubAffixConfig.json → relic_sub_affixes.json。"""
    data = load_json(EXCEL_DIR / "RelicSubAffixConfig.json")
    result = []

    for item in data:
        result.append({
            "group_id": item.get("GroupID", 0),
            "affix_id": item.get("AffixID", 0),
            "property": item.get("Property", ""),
            "base_value": unwrap_value(item.get("BaseValue", {})),
            "step_value": unwrap_value(item.get("StepValue", {})),
            "step_num": item.get("StepNum", 0),
        })

    result = sort_by_id(result, key="group_id")
    save_json(result, OUTPUT_DIR / "relic_sub_affixes.json")


def convert() -> None:
    """转换遗器主副词条。"""
    convert_main()
    convert_sub()
