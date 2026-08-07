"""成就数据转换器。

数据来源：vendor/TurnBasedGameData 子模块
- AchievementData.json    ：成就主表（1869 条）
- AchievementSeries.json  ：成就系列（9 个）
- TextJoinConfig.json     ：{TEXTJOIN#id} 跨文本引用配置（TextJoinID → DefaultItem）
- TextJoinItem.json       ：跨文本条目（TextJoinItemID → TextJoinText Hash）

输出：
- public/data/cn/achievements.json        成就数组（按系列 Priority 升序 + 成就 Priority 降序）
- public/data/cn/achievement_series.json  系列数组（按 Priority 升序）

描述处理（_format_desc）：
- #n[i] 参数占位 → ParamList[n-1].Value 替换（整数；缺参数时保留原文占位符）
- {TEXTJOIN#id} → TextJoinConfig.DefaultItem → TextJoinItem.TextJoinText → TextMap
  （查不到对应配置时保留原文占位符，避免误删信息）
- \\n 换行原样保留（前端 CSS white-space: pre-line 渲染）
- ※ 结尾注释保留在 desc 中（游戏原文注释，与正文用换行分隔）

Rarity 值域：Low（铜）/ Mid（银）/ High（金），游戏内稀有度徽章。
ShowType 值域：None（常显）/ ShowAfterFinish（完成后显示）/ HiddenDesc（隐藏描述）。
"""
from __future__ import annotations

import logging
import re
from pathlib import Path

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json, unwrap_value

logger = logging.getLogger("converter")

# {TEXTJOIN#54} 跨文本引用占位符
_TEXTJOIN_RE = re.compile(r"\{TEXTJOIN#(\d+)\}")
# #1[i] 数值参数占位符（[i] 整数 / [f1] 一位小数；可带 % 后缀）
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
        # 整数占位：[i] 取整；浮点占位：[f1] 保留一位小数
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
    # 源数据中换行为字面 \n（JSON 双反斜杠转义）→ 转真实换行（前端 pre-line 渲染）
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
        # None → 常显；ShowAfterFinish → 完成后显示；HiddenDesc → 隐藏描述
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

    # ─── 系列 ───
    series_data = load_json(EXCEL_DIR / "AchievementSeries.json")
    series = [_parse_series(s) for s in series_data]
    series.sort(key=lambda s: s["priority"])
    series_by_id = {s["id"]: s for s in series}
    save_json(series, OUTPUT_DIR / "achievement_series.json")

    # ─── 成就 ───
    ach_data = load_json(EXCEL_DIR / "AchievementData.json")
    achievements = [_parse_achievement(a, textjoin) for a in ach_data]
    # 游戏内顺序：系列按 Priority 升序，系列内按成就 Priority 降序
    achievements.sort(key=lambda a: (
        series_by_id.get(a["series_id"], {}).get("priority", 999),
        -a["priority"],
    ))
    save_json(achievements, OUTPUT_DIR / "achievements.json")

    logger.info("成就转换完成：%d 条成就 / %d 个系列", len(achievements), len(series))