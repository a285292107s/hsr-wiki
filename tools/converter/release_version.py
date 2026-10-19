from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable, Mapping, Sequence

logger = logging.getLogger("converter")

def load_baseline_versions(path: Path) -> dict[str, str] | None:
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"基线输出不可读，拒绝在无基线状态下重打版本号: {path}（{exc}）") from exc
    if not isinstance(data, list):
        raise ValueError(f"基线输出结构异常（应为列表）: {path}")

    baseline: dict[str, str] = {}
    for item in data:
        if not isinstance(item, dict) or item.get("id") is None:
            continue
        value = item.get("release_version", "")
        baseline[str(item["id"])] = value if isinstance(value, str) else ""
    return baseline

def tag_release_versions(
    current_ids: Iterable[int],
    baseline: Mapping[str, str] | None,
    current_version: str,
) -> dict[str, str]:
    ids = [str(i) for i in current_ids]
    if baseline is None:
        return dict.fromkeys(ids, "")
    return {i: baseline[i] if i in baseline else current_version for i in ids}

def apply_release_versions(entries: Sequence[dict], versions: Mapping[str, str]) -> int:
    changed = 0
    for entry in entries:
        entry_id = entry.get("id")
        if entry_id is None:
            continue
        value = versions.get(str(entry_id), "")
        if entry.get("release_version") != value:
            changed += 1
        entry["release_version"] = value
    return changed
