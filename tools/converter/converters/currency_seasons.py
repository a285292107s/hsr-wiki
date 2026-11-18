from __future__ import annotations

import logging
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from season_scope import current_season
from textmap import resolve_text
from utils import load_json, save_json

logger = logging.getLogger("converter.currency_seasons")

OUT_SUBDIR = "currency"


def _load_excel(name: str) -> list[dict]:
    return load_json(EXCEL_DIR / name)


def _load_optional(name: str) -> list[dict]:
    path = EXCEL_DIR / name
    return load_json(path) if path.exists() else []


def _season_value(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def _season_ids(entry: dict) -> set[int]:
    ids = {_season_value(v) for v in (entry.get("SeasonIDList") or [])}
    single = _season_value(entry.get("SeasonID"))
    if single is not None:
        ids.add(single)
    ids.discard(None)
    return ids


def resolve_season_panels(
    module_rows: list[dict] | None,
    activity_config: list[dict],
    panels: list[dict],
) -> dict[int, dict]:
    module_to_activity: dict[int, int] = {}
    activity_to_panel: dict[int, int] = {}
    for row in activity_config:
        activity_id = row.get("ActivityID")
        for module_id in row.get("ActivityModuleIDList") or []:
            module_to_activity[module_id] = activity_id
        if row.get("ActivityPanelID") is not None:
            activity_to_panel[activity_id] = row["ActivityPanelID"]

    panel_by_id = {p.get("PanelID"): p for p in panels}

    resolved: dict[int, dict] = {}
    for row in module_rows or []:
        season_id = _season_value(row.get("SeasonID"))
        module_id = row.get("ActivityModuleID")
        if season_id is None or season_id in resolved or module_id is None:
            continue
        activity_id = module_to_activity.get(module_id)
        panel_id = activity_to_panel.get(activity_id) if activity_id is not None else None
        panel = panel_by_id.get(panel_id)
        if panel is None:
            continue
        resolved[season_id] = {
            "name": resolve_text(panel.get("TitleName", {})),
            "desc": resolve_text(panel.get("PanelDesc", {})),
        }
    return resolved


def attribute_chimera(chimera_rows: list[dict], role_season: dict[int, int | None]) -> dict[int, list[dict]]:
    by_season: dict[int, list[dict]] = {}
    for row in _distinct_chimera(chimera_rows):
        role_id = row.get("RoleID")
        season_id = role_season.get(role_id) if role_id is not None else None
        if season_id is None:
            continue
        by_season.setdefault(season_id, []).append(row)
    return by_season


def _distinct_chimera(rows: list[dict]) -> list[dict]:
    seen: set[int] = set()
    out: list[dict] = []
    for row in rows:
        cid = row.get("ID")
        if cid in seen:
            continue
        seen.add(cid)
        out.append(row)
    return out


def attribute_spotlight(spotlight_rows: list[dict], role_season: dict[int, int | None]) -> dict[int, int]:
    counts: dict[int, int] = {}
    seen: set[int] = set()
    for row in spotlight_rows:
        sid = row.get("ID")
        if sid in seen:
            continue
        seen.add(sid)
        seasons = {
            role_season.get(avatar_id)
            for avatar_id in (row.get("SuitableAvatarList") or [])
        }
        for season_id in seasons:
            if season_id is not None:
                counts[season_id] = counts.get(season_id, 0) + 1
    return counts


def attribute_talent(talent_rows: list[dict]) -> dict[int, int]:
    counts: dict[int, int] = {}
    for row in talent_rows:
        season_id = _season_value(row.get("SeasonID"))
        if season_id is None:
            continue
        counts[season_id] = counts.get(season_id, 0) + 1
    return counts


def build_theme_rows(
    season_id: int,
    chimera_by_season: dict[int, list[dict]],
    spotlight_counts: dict[int, int],
    talent_counts: dict[int, int],
) -> list[dict]:
    themes: list[dict] = []
    chimera = chimera_by_season.get(season_id, [])
    if chimera:
        names = [resolve_text(row.get("NameDesc", {})) for row in chimera]
        names = [name for name in names if name]
        themes.append({"key": "encounter", "count": len(chimera), "names": names})
    if spotlight_counts.get(season_id):
        themes.append({"key": "spotlight", "count": spotlight_counts[season_id], "names": []})
    if talent_counts.get(season_id):
        themes.append({"key": "talent", "count": talent_counts[season_id], "names": []})
    return themes


def build_seasons(
    module_rows: list[dict] | None,
    panel_by_season: dict[int, dict],
    chimera_by_season: dict[int, list[dict]],
    spotlight_counts: dict[int, int],
    talent_counts: dict[int, int],
) -> dict:
    sub_by_season: dict[int, list[int]] = {}
    for row in module_rows or []:
        season_id = _season_value(row.get("SeasonID"))
        sub = _season_value(row.get("SubSeasonID"))
        if season_id is None:
            continue
        bucket = sub_by_season.setdefault(season_id, [])
        if sub is not None:
            bucket.append(sub)

    seasons = []
    for season_id in sorted(sub_by_season):
        meta = panel_by_season.get(season_id, {})
        seasons.append({
            "id": season_id,
            "name": meta.get("name", ""),
            "desc": meta.get("desc", ""),
            "sub_season_ids": sorted(set(sub_by_season[season_id])),
            "themes": build_theme_rows(season_id, chimera_by_season, spotlight_counts, talent_counts),
        })

    return {"current_season": current_season(module_rows), "seasons": seasons}


def convert() -> None:
    logger.info("--- 货币战争赛季主题数据 (currency_seasons) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    out_dir.mkdir(parents=True, exist_ok=True)

    module_rows = _load_optional("GridFightSeasonModule.json")
    panel_by_season = resolve_season_panels(
        module_rows,
        _load_excel("ActivityConfig.json"),
        _load_excel("ActivityPanel.json"),
    )

    role_season: dict[int, int | None] = {}
    for row in _load_excel("GridFightRoleBasicInfo.json"):
        role_id = row.get("ID")
        season_ids = _season_ids(row)
        role_season[role_id] = min(season_ids) if season_ids else None

    chimera_by_season = attribute_chimera(_load_excel("GridFightChimeraInfo.json"), role_season)
    spotlight_counts = attribute_spotlight(_load_excel("GridFightSpotLight.json"), role_season)
    talent_counts = attribute_talent(_load_optional("GridFightSeasonTalent.json"))

    payload = build_seasons(module_rows, panel_by_season, chimera_by_season, spotlight_counts, talent_counts)

    missing = [s["id"] for s in payload["seasons"] if not s["name"]]
    if missing:
        logger.warning("赛季官方名缺失（未在活动面板登记）：%s", missing)

    save_json(payload, out_dir / "seasons.json")
    logger.info(
        "货币战争赛季主题：%d 个赛季（当前 %s）",
        len(payload["seasons"]),
        payload["current_season"],
    )


if __name__ == "__main__":
    from textmap import load_textmap

    load_textmap()
    convert()
