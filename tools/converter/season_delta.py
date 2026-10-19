from __future__ import annotations

import logging
from typing import Any, Iterable, Mapping, Sequence

logger = logging.getLogger("converter")

DEFAULT_SEASON_KEY = "ExistSeason"

def generations(
    rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
) -> list[int]:
    out: set[int] = set()
    for row in rows or []:
        if not isinstance(row, Mapping):
            continue
        value = row.get(key)
        if isinstance(value, int) and not isinstance(value, bool):
            out.add(value)
    return sorted(out)

def prev_generation(
    rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
) -> int | None:
    gens = generations(rows, key)
    return gens[-1] if gens else None

def mark_season_new(
    current_ids: Iterable[Any],
    old_rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
    id_key: str = "ID",
    *,
    label: str = "名册",
) -> dict[Any, bool]:
    ids = list(current_ids)
    gens = generations(old_rows, key)
    prev = prev_generation(old_rows, key)
    if prev is None or len(gens) < 2:
        logger.warning(
            "赛季代际差集降级：[%s] 的 %s 缺失或有效代际 < 2（实测 %s），is_season_new 全部置 false",
            label,
            key,
            gens if gens else "无有效行",
        )
        return dict.fromkeys(ids, False)
    prev_ids = {
        row.get(id_key)
        for row in old_rows
        if isinstance(row, Mapping) and row.get(key) == prev and row.get(id_key) is not None
    }
    logger.info("[%s] 上一代=%d（名册 %d 个），当前代 %d 个", label, prev, len(prev_ids), len(ids))
    return {i: i not in prev_ids for i in ids}

def apply_season_new(
    entries: Sequence[dict],
    flags: Mapping[Any, bool],
    id_field: str = "id",
) -> int:
    count = 0
    for entry in entries:
        flag = bool(flags.get(entry.get(id_field), False))
        entry["is_season_new"] = flag
        if flag:
            count += 1
    return count
