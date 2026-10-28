import logging
import re

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import clean_text, current_textmap, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")

_TEXTJOIN_RE = re.compile(r"\{TEXTJOIN#(\d+)\}")

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

EXCLUDED_ACTIVITY_SUBTYPES = {
    "TravelBrochurePaster",
    "PlanetFesItem",
    "ChessRogueDiceSurface",
    "DiceCombatAvatar",
    "DiceCombatDice",
    "AetherSkill",
    "AetherSpirit",
    "MuseumStuff",
    "MuseumExhibit",
    "RogueMedal",
    "ElfRestaurantItem",
    "HipplenOutfit",
    "IdleLiveItem",
    "FightFestSkill",
    "MatchThreeV2",
    "PixAirMaterial",
}

def _is_excluded(item: dict) -> bool:
    main_type = item.get("ItemMainType", "")
    sub_type = item.get("ItemSubType", "")
    if main_type in EXCLUDED_MAIN_TYPES:
        return True
    if sub_type in EXCLUDED_ACTIVITY_SUBTYPES:
        return True
    if main_type == "Usable" and sub_type in EXCLUDED_USABLE_SUBTYPES:
        return True
    return False

def item_name_icon(item: dict) -> tuple[str, str]:
    return resolve_text(item.get("ItemName", {})), map_icon_path(item.get("ItemIconPath", ""))

def _load_purpose_text(purposes: dict[int, dict], purpose_type: object) -> str:
    ref = purposes.get(purpose_type if isinstance(purpose_type, int) else 0, {}).get("PurposeText", {})
    return resolve_text(ref)

def _load_textjoin() -> dict[int, str]:
    item_key: dict[int, str] = {}
    for row in load_json(EXCEL_DIR / "TextJoinItem.json"):
        key = text_key_of(row.get("TextJoinText", {}))
        if key and "TextJoinItemID" in row:
            item_key[row["TextJoinItemID"]] = key
    out: dict[int, str] = {}
    for row in load_json(EXCEL_DIR / "TextJoinConfig.json"):
        key = item_key.get(row.get("DefaultItem"))
        if key and "TextJoinID" in row:
            out[row["TextJoinID"]] = key
    return out

def _compose_text(key: str, textjoin: dict[int, str]):
    def compose(tm) -> str:
        def _expand(match: "re.Match[str]") -> str:
            ref_key = textjoin.get(int(match.group(1)))
            return clean_text(tm.get(ref_key, ""), dict(tm)) if ref_key else match.group(0)

        return _TEXTJOIN_RE.sub(_expand, clean_text(tm.get(key, ""), dict(tm)))

    return compose

def _text_ref(ref: object, textjoin: dict[int, str]) -> str:
    key = text_key_of(ref)
    if not key or not _TEXTJOIN_RE.search(current_textmap().get(key, "")):
        return resolve_text(ref)
    compose = _compose_text(key, textjoin)
    return composed_ref(f"composed:item_text:{key}", compose, compose(current_textmap()))

def _parse_item(item: dict, purposes: dict[int, dict], textjoin: dict[int, str]) -> dict:
    item_id = item.get("ID", 0)
    rarity_key = item.get("Rarity", "")
    return {
        "id": item_id,
        "name": _text_ref(item.get("ItemName", {}), textjoin),
        "desc": _text_ref(item.get("ItemDesc", {}), textjoin),
        "bg_desc": _text_ref(item.get("ItemBGDesc", {}), textjoin),
        "main_type": item.get("ItemMainType", ""),
        "sub_type": item.get("ItemSubType", ""),
        "rarity": RARITY_MAP.get(rarity_key, 0),
        "purpose_type": item.get("PurposeType", 0),
        "purpose": _load_purpose_text(purposes, item.get("PurposeType")),
        "icon": map_icon_path(item.get("ItemIconPath", "")),
        "figure_icon": map_icon_path(item.get("ItemFigureIconPath", "")),
    }

def _load_purposes() -> dict[int, dict]:
    return {row["ID"]: row for row in load_json(EXCEL_DIR / "ItemPurpose.json") if "ID" in row}

def convert() -> None:
    data = load_json(EXCEL_DIR / "ItemConfig.json")
    purposes = _load_purposes()
    textjoin = _load_textjoin()
    result = []
    excluded = 0

    for item in data:
        if _is_excluded(item):
            excluded += 1
            continue
        result.append(_parse_item(item, purposes, textjoin))

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "items.json")
    logger.info("物品转换完成：保留 %d 条，剔除非物品 %d 条", len(result), excluded)
