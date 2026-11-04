from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("converter")

SEASON_KEY = "SeasonID"
SUB_SEASON_KEY = "SubSeasonID"


def _season_value(value: Any) -> int | None:
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    return value


def current_season(module_rows: list[dict] | None) -> int | None:
    seasons = set()
    for row in module_rows or []:
        sid = _season_value(row.get(SEASON_KEY))
        if sid is not None:
            seasons.add(sid)
    return max(seasons) if seasons else None


def sub_seasons(module_rows: list[dict] | None, season_id: int | None = None) -> list[int]:
    sid = current_season(module_rows) if season_id is None else season_id
    if sid is None:
        return []
    subs = set()
    for row in module_rows or []:
        if _season_value(row.get(SEASON_KEY)) != sid:
            continue
        sub = _season_value(row.get(SUB_SEASON_KEY))
        if sub is not None:
            subs.add(sub)
    return sorted(subs)


def season_meta(module_rows: list[dict] | None) -> dict[str, Any]:
    sid = current_season(module_rows)
    if sid is None:
        logger.warning("赛季元数据缺失：GridFightSeasonModule 无有效 %s，产物 season.id 置 null", SEASON_KEY)
    return {"id": sid, "sub_season_ids": sub_seasons(module_rows, sid)}


def season_membership(
    rows: list[dict] | None,
    id_key: str,
    season_key: str = SEASON_KEY,
) -> dict[Any, int]:
    out: dict[Any, int] = {}
    conflicts: list[Any] = []
    for row in rows or []:
        rid = row.get(id_key)
        sid = _season_value(row.get(season_key))
        if rid is None or sid is None:
            continue
        if rid in out:
            if out[rid] != sid:
                conflicts.append(rid)
            continue
        out[rid] = sid
    if conflicts:
        logger.warning(
            "赛季归属冲突：%s 在连接表登记了多个赛季（示例 %s），保留首条",
            id_key,
            conflicts[:8],
        )
    return out


def apply_season_ids(
    entries: list[dict],
    seasons: dict[Any, int],
    id_field: str = "id",
    *,
    label: str = "条目",
) -> int:
    missing: list[Any] = []
    for entry in entries:
        sid = seasons.get(entry.get(id_field))
        entry["season_id"] = sid
        if sid is None:
            missing.append(entry.get(id_field))
    if missing:
        logger.warning(
            "赛季归属缺失：[%s] %d 条未在赛季连接表登记（示例 %s），season_id 置 null",
            label,
            len(missing),
            missing[:8],
        )
    return len(entries) - len(missing)


def season_registrations(
    rows: list[dict] | None,
    id_key: str,
    season_key: str = SEASON_KEY,
) -> dict[Any, frozenset[int]]:
    out: dict[Any, set[int]] = {}
    for row in rows or []:
        rid = row.get(id_key)
        sid = _season_value(row.get(season_key))
        if rid is None or sid is None:
            continue
        out.setdefault(rid, set()).add(sid)
    return {rid: frozenset(seasons) for rid, seasons in out.items()}


def verify_season_ids(
    entries: list[dict],
    registrations: dict[Any, frozenset[int]],
    id_field: str = "id",
    *,
    label: str = "条目",
) -> int:
    mismatched = [
        entry.get(id_field)
        for entry in entries
        if registrations.get(entry.get(id_field))
        and entry.get("season_id") not in registrations[entry.get(id_field)]
    ]
    if mismatched:
        logger.warning(
            "赛季归属不一致：[%s] %d 条的 season_id 未出现在该条目的赛季登记中（示例 %s）",
            label,
            len(mismatched),
            mismatched[:8],
        )
    return len(mismatched)
