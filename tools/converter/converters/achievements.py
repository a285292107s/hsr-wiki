"""成就数据转换器

完整表→字段→输出映射与描述处理规则见 docs/data/转换器字段映射.md（achievements 段）。
源：AchievementData.json(1869) / AchievementSeries.json(9) / TextJoinConfig / TextJoinItem。
输出：public/data/cn/achievements.json(系列Priority升+成就Priority降) / achievement_series.json。
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json, unwrap_value

logger = logging.getLogger("converter")

_TEXTJOIN_RE = re.compile(r"\{TEXTJOIN#(\d+)\}")
_PARAM_RE = re.compile(r"#(\d+)\[([a-z0-9]+)\](%?)")

def _load_textjoin() -> dict[int, str]:
    """构建 TEXTJOIN 索引：TextJoinID → 默认形态文本（DefaultItem → TextJoinItem → TextMap）。

    仅取 DefaultItem（默认形态），TextJoinItemList 的其他形态（性别/命名等变体）省略。
    """
    config = load_json(EXCEL_DIR / "TextJoinConfig.json")
    items = load_json(EXCEL_DIR / "TextJoinItem.json")
    item_text: dict[int, str] = {}
    for it in items:
        iid = it.get("TextJoinItemID")
        if iid is None:
            continue
        item_text[iid] = resolve_text(it.get("TextJoinText", {}))
    out: dict[int, str] = {}
    for c in config:
        tid = c.get("TextJoinID")
        default = c.get("DefaultItem")
        if tid is None or default is None:
            continue
        out[tid] = item_text.get(default, "")
    return out

def _expand_textjoin(text: str, textjoin: dict[int, str]) -> str:
    """替换 {TEXTJOIN#id} 为默认形态文本；无对应配置时保留原占位符。"""

    def _replace(m: "re.Match[str]") -> str:
        text_get = textjoin.get(int(m.group(1)))
        return text_get if text_get else m.group(0)

    return _TEXTJOIN_RE.sub(_replace, text)

def _fill_params(text: str, param_list: list) -> str:
    """替换 #n[i] 参数占位符为 ParamList[n-1] 数值。

    参数缺失（列表越界 / 值为空）时保留原占位符，避免丢失信息。
    """

    def _replace(m: "re.Match[str]") -> str:
        idx = int(m.group(1)) - 1
        if idx < 0 or idx >= len(param_list):
            return m.group(0)
        val = param_list[idx]
        if val is None:
            return m.group(0)
        if m.group(2) == "i":
            display = str(int(val)) if isinstance(val, (int, float)) else str(val)
        else:
            display = str(val)
        return f"{display}{m.group(3)}"

    return _PARAM_RE.sub(_replace, text)

def _format_desc(text: str, param_list: list, textjoin: dict[int, str]) -> str:
    """描写处理流水线：TEXTJOIN 展开 → 参数替换 → 字面 \n 转真实换行。"""
    text = _expand_textjoin(text, textjoin)
    text = _fill_params(text, [unwrap_value(p) for p in param_list])
    return text.replace(r"\n", "\n")

def _parse_achievement(item: dict, textjoin: dict[int, str]) -> dict:
    """单条成就记录 → achievements.json 条目。"""
    title = resolve_text(item.get("AchievementTitle", {}))
    desc = _format_desc(
        resolve_text(item.get("AchievementDesc", {})),
        item.get("ParamList", []) or [],
        textjoin,
    )
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
    """系列图标路径 → CDN 文件名（去扩展名）。

    SpriteOutput/Achievement/CultivateAchievementIcon_s.png → CultivateAchievementIcon_s
    """
    if not icon_path:
        return ""
    return Path(icon_path).stem

def _parse_series(item: dict) -> dict:
    """单条系列记录 → achievement_series.json 条目。"""
    return {
        "id": item.get("SeriesID", 0),
        "name": resolve_text(item.get("SeriesTitle", {})),
        "icon": _series_icon(item.get("MainIconPath", "")),
        "icon_s": _series_icon(item.get("IconPath", "")),
        "priority": item.get("Priority", 0),
    }

def convert() -> None:
    """转换成就数据 → achievements.json + achievement_series.json。"""
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