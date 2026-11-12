import json
import logging

from config import OUTPUT_DIR
from utils import save_json

logger = logging.getLogger("converter")

_ENDGAME_OUTPUTS = ("maze.json", "maze_extra.json", "maze_boss.json", "maze_peak.json")


def _read(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _collect_monster_ids(node, catalog_ids, found):
    if isinstance(node, list):
        for item in node:
            _collect_monster_ids(item, catalog_ids, found)
        return
    if not isinstance(node, dict):
        return
    if "id" in node and "icon" in node and "name" in node:
        for key in ("id", "tpl"):
            value = node.get(key)
            if isinstance(value, int) and value in catalog_ids:
                found.add(value)
            elif isinstance(value, str) and value.isdigit() and int(value) in catalog_ids:
                found.add(int(value))
    for value in node.values():
        _collect_monster_ids(value, catalog_ids, found)


def endgame_monster_ids() -> set[int]:
    catalog_ids = {row["id"] for row in _read(OUTPUT_DIR / "monsters.json")}
    found: set[int] = set()
    for name in _ENDGAME_OUTPUTS:
        _collect_monster_ids(_read(OUTPUT_DIR / name), catalog_ids, found)
    return found


def convert() -> None:
    rows = _read(OUTPUT_DIR / "monsters.json")
    template_ids = {row["id"] for row in rows}
    keep = endgame_monster_ids()
    dropped = template_ids - keep

    detail_dir = OUTPUT_DIR / "monsters"
    if detail_dir.exists():
        for path in detail_dir.glob("*.json"):
            stem = path.stem
            if stem.isdigit() and int(stem) in dropped:
                path.unlink()

    save_json([row for row in rows if row["id"] in keep], OUTPUT_DIR / "monsters.json")
    logger.info(
        "monster_filter: keep %d / %d templates, removed %d detail files",
        len(keep), len(rows), len(dropped),
    )
