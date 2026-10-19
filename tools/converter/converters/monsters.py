import logging

from config import EXCEL_DIR, OUTPUT_DIR
from converters.monster_common import load_monsters
from textmap import resolve_text
from utils import load_json, map_icon_path, save_json, sort_by_id

logger = logging.getLogger("converter")


def _monster_type(rank: str) -> str:
    r = (rank or "").lower()
    if "boss" in r:
        return "BOSS"
    if "elite" in r:
        return "ELITE"
    return "MINION"


def catalog_rows(facets: dict | None = None) -> list[dict]:
    if facets is None:
        facets = load_monsters()
    rows = []
    for t in load_json(EXCEL_DIR / "MonsterTemplateConfig.json"):
        mid = t.get("MonsterTemplateID")
        name = resolve_text(t.get("MonsterName", {}))
        icon = map_icon_path(t.get("IconPath", ""))
        if not name or not icon:
            continue
        facet = facets.get(mid) or {}
        row = {
            "id": mid,
            "name": name,
            "icon": icon,
            "type": _monster_type(t.get("Rank", "")),
            "weak": list(facet.get("weak") or []),
            "camp": facet.get("camp") or "",
        }
        group = t.get("TemplateGroupID")
        if group is not None:
            row["atlas_group"] = group
        rows.append(row)
    return sort_by_id(rows)


def convert() -> None:
    result = catalog_rows()
    save_json(result, OUTPUT_DIR / "monsters.json")
    logger.info("monsters: %d entries", len(result))
