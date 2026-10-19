import json
import logging

from config import OUTPUT_DIR
from utils import save_json

logger = logging.getLogger("converter")

_CATALOG_MONSTER_KEEP = ("id", "name", "icon", "weak", "resist", "rank", "camp")

def _read_full(base: str) -> dict:
    with open(OUTPUT_DIR / f"{base}.json", encoding="utf-8") as f:
        return json.load(f)

def _catalog_monster(m: dict) -> dict:
    return {k: m[k] for k in _CATALOG_MONSTER_KEEP if k in m}

def _season_catalog(entry: dict) -> dict:
    out: dict = {
        "id": entry["id"],
        "zh": entry.get("zh", ""),
        "live_begin": entry.get("live_begin", ""),
        "live_end": entry.get("live_end", ""),
        "buffs": [
            {k: b[k] for k in ("id", "name") if k in b} for b in entry.get("buffs") or []
        ],
        "monsters": [_catalog_monster(m) for m in entry.get("monsters") or []],
        "final_monsters": [_catalog_monster(m) for m in entry.get("final_monsters") or []],
    }
    if entry.get("permanent"):
        out["permanent"] = True
    if entry.get("test"):
        out["test"] = True
    if entry.get("tierce"):
        t = entry["tierce"]
        out["tierce"] = {
            "id": t.get("id"),
            "damage_types": t.get("damage_types", []),
            "countdown": t.get("countdown"),
        }
    if entry.get("levels"):
        out["levels"] = [{"kind": l["kind"]} for l in entry["levels"] if l.get("kind")]
    if entry.get("pollution"):
        out["pollution"] = entry["pollution"]
    return out

def convert_catalog() -> None:
    for base in ("maze", "maze_extra", "maze_boss"):
        db = _read_full(base)
        save_json(
            {str(k): _season_catalog(v) for k, v in db.items()},
            OUTPUT_DIR / f"{base}.catalog.json",
        )
    peak = _read_full("maze_peak")
    save_json(
        {str(k): _season_catalog(v) for k, v in peak.items()},
        OUTPUT_DIR / "maze_peak.catalog.json",
    )
