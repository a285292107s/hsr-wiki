from __future__ import annotations

import hashlib
import json
import logging
import math
import re
from pathlib import Path
from typing import Any, Mapping

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, current_textmap, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, save_json, unwrap_value

logger = logging.getLogger("converter")

_TEXTJOIN_RE = re.compile(r"\{TEXTJOIN#(\d+)\}")

_PARAM_RE = re.compile(
    r"#(?P<tagged>\d+)\[(?P<tag>[^\]]*)\](?P<pct>%?)|(?<!TEXTJOIN)(?<![^<>]=)(?<!#)#(?P<bare>\d+)",
)

def _load_textjoin() -> dict[int, str]:
    config = load_json(EXCEL_DIR / "TextJoinConfig.json")
    items = load_json(EXCEL_DIR / "TextJoinItem.json")
    item_key: dict[int, str] = {}
    for it in items:
        iid = it.get("TextJoinItemID")
        if iid is None:
            continue
        key = text_key_of(it.get("TextJoinText", {}))
        if key:
            item_key[iid] = key
    out: dict[int, str] = {}
    for c in config:
        tid = c.get("TextJoinID")
        default = c.get("DefaultItem")
        if tid is None or default is None:
            continue
        key = item_key.get(default)
        if key:
            out[tid] = key
    return out

def _expand_textjoin(text: str, tm: Mapping[str, str], textjoin: dict[int, str]) -> str:
    def _replace(m: "re.Match[str]") -> str:
        key = textjoin.get(int(m.group(1)))
        if not key:
            return m.group(0)
        got = tm.get(key, "")
        return clean_text(got, dict(tm)) if got else m.group(0)

    return _TEXTJOIN_RE.sub(_replace, text)

_F_RANK_RE = re.compile(r"f([1-6])")

def _js_round(n: float) -> int:
    return math.floor(n + 0.5)

def _js_num_str(n: float) -> str:
    if isinstance(n, int):
        return str(n)
    return str(int(n)) if n.is_integer() else str(n)

def _fmt_val(val: Any, tag: str, is_pct: bool) -> str:
    if isinstance(val, bool):
        val = int(val)
    if not isinstance(val, (int, float)):
        return str(val)
    n = val * 100 if is_pct else val
    if tag == "i":
        return _js_num_str(_js_round(n))
    rank = _F_RANK_RE.fullmatch(tag)
    if rank:
        f = 10 ** int(rank.group(1))
        return _js_num_str(_js_round(n * f) / f)
    return _js_num_str(n)

def _fill_params(text: str, param_list: list) -> str:
    def _replace(m: "re.Match[str]") -> str:
        if m.group("bare") is not None:
            idx = int(m.group("bare")) - 1
            tag, suffix, is_pct = "", "", False
        else:
            idx = int(m.group("tagged")) - 1
            tag = m.group("tag")
            suffix = m.group("pct")
            is_pct = suffix == "%"
        if idx < 0 or idx >= len(param_list):
            return m.group(0)
        val = param_list[idx]
        if val is None:
            return m.group(0)
        return f"{_fmt_val(val, tag, is_pct)}{suffix}"

    return _PARAM_RE.sub(_replace, text)

def _desc_text(tm: Mapping[str, str], desc_key: str | None, param_list: list, textjoin: dict[int, str]) -> str:
    text = clean_text(tm.get(desc_key, ""), dict(tm)) if desc_key else ""
    text = _expand_textjoin(text, tm, textjoin)
    text = _fill_params(text, [unwrap_value(p) for p in param_list])
    return text.replace(r"\n", "\n")

def _desc_ref(item: dict, textjoin: dict[int, str]) -> Any:
    desc_ref = item.get("AchievementDesc", {})
    desc_key = text_key_of(desc_ref)
    param_list = item.get("ParamList", []) or []
    composer = lambda tm: _desc_text(tm, desc_key, param_list, textjoin)  # noqa: E731
    cn_text = _desc_text(current_textmap(), desc_key, param_list, textjoin)
    sig = hashlib.sha1(
        json.dumps(
            [unwrap_value(p) for p in param_list], ensure_ascii=False, separators=(",", ":"),
        ).encode("utf-8"),
    ).hexdigest()[:12]
    return composed_ref(f"composed:ach:{desc_key or 'lit'}:{sig}", composer, cn_text)

def _parse_achievement(item: dict, textjoin: dict[int, str]) -> dict:
    title = resolve_text(item.get("AchievementTitle", {}))
    desc = _desc_ref(item, textjoin)
    return {
        "id": item.get("AchievementID", 0),
        "title": title,
        "desc": desc,
        "rarity": item.get("Rarity", ""),
        "series_id": item.get("SeriesID", 0),
        "priority": item.get("Priority", 0),
        "show_type": item.get("ShowType") or "",
    }

def _series_icon(icon_path: str) -> str:
    if not icon_path:
        return ""
    return Path(icon_path).stem

def _parse_series(item: dict) -> dict:
    return {
        "id": item.get("SeriesID", 0),
        "name": resolve_text(item.get("SeriesTitle", {})),
        "icon": _series_icon(item.get("MainIconPath", "")),
        "icon_s": _series_icon(item.get("IconPath", "")),
        "priority": item.get("Priority", 0),
    }

def convert() -> None:
    textjoin = _load_textjoin()

    series_data = load_json(EXCEL_DIR / "AchievementSeries.json")
    series = [_parse_series(s) for s in series_data]
    series.sort(key=lambda s: s["priority"])
    series_by_id = {s["id"]: s for s in series}
    save_json(series, OUTPUT_DIR / "achievement_series.json")

    ach_data = load_json(EXCEL_DIR / "AchievementData.json")
    achievements = [_parse_achievement(a, textjoin) for a in ach_data]
    achievements.sort(key=lambda a: (
        series_by_id.get(a["series_id"], {}).get("priority", 999),
        -a["priority"],
    ))
    save_json(achievements, OUTPUT_DIR / "achievements.json")

    logger.info("成就转换完成：%d 条成就 / %d 个系列", len(achievements), len(series))