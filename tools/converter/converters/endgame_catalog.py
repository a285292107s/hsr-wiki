"""终局目录卡轻量文件（*.catalog.json）转换器。

由已生成的全量 maze*.json（OUTPUT_DIR）派生目录卡轻量条目，仅保留目录卡渲染与
筛选所需字段。全量文件不动，详情页仍消费全量；目录页 fetchData 改载这些轻量文件，
显著降低终局目录首载体积（maze.json 2.9MB 大半在 floor_details）。

说明：
- 读取的是 OUTPUT_DIR 既有全量输出（非 vendor 源、非 utils.load_json 的 vendor 缓存），
  因此不触发增量 AST 扫描对 vendor 源文件的覆盖校验；增量依赖由
  incremental.MODULE_SOURCES['endgame_catalog'] 显式声明（OUTPUT_DIR 全量文件的绝对路径）。
- 目录卡图标已弃用每季 arts.tab 页签图，统一用玩法级默认图标（前端 ENDGAME_MODES.icon），
  故轻量条目不输出 arts。
"""

import json
import logging

from config import OUTPUT_DIR
from utils import save_json

logger = logging.getLogger("converter")

# 目录卡敌方保留字段（卡图 + 悬浮提示用；剥离 intro/skills/stance/speed/tpl/wave 等重型/详情字段）
_CATALOG_MONSTER_KEEP = ("id", "name", "icon", "weak", "resist", "rank", "camp")


def _read_full(base: str) -> dict:
    """读取已生成的全量赛季文件（raw json）。

    用 json.load 而非 utils.load_json：后者按路径缓存供 vendor 源复用，且会被增量 AST
    扫描当作 vendor 源文件要求声明（本模块读的是 OUTPUT_DIR 派生输出，非 vendor 源）。
    增量依赖已由 incremental.MODULE_SOURCES['endgame_catalog'] 显式声明。
    """
    with open(OUTPUT_DIR / f"{base}.json", encoding="utf-8") as f:
        return json.load(f)


def _catalog_monster(m: dict) -> dict:
    """目录卡敌方：仅保留卡图与悬浮提示所需字段（剥离重型/详情字段）。"""
    return {k: m[k] for k in _CATALOG_MONSTER_KEEP if k in m}


def _season_catalog(entry: dict) -> dict:
    """全量赛季条目 → 目录卡轻量条目。

    剥离 floor_details / floor_damage / sub_buffs / targets / clear_score / badges /
    完整 buff 描述 / 敌方重型字段 / 星启与仲裁重字段 / arts（目录卡图标已走玩法级默认图）；
    仅保留目录卡渲染与筛选所需（模式/状态筛选读 top-level 字段）。
    """
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
    # 星启：目录卡仅需存在性（★ 徽章），剥离重型节点/技能/奖励
    if entry.get("tierce"):
        t = entry["tierce"]
        out["tierce"] = {
            "id": t.get("id"),
            "damage_types": t.get("damage_types", []),
            "countdown": t.get("countdown"),
        }
    # 异相仲裁：目录卡仅需关卡组成 kind 计数（骑士×N · 王棋）
    if entry.get("levels"):
        out["levels"] = [{"kind": l["kind"]} for l in entry["levels"] if l.get("kind")]
    return out


def convert_catalog() -> None:
    """由全量 maze*.json 派生目录卡轻量文件（*.catalog.json，同目录）。

    仅读取 OUTPUT_DIR 既有全量输出（不读 vendor 源、不重跑全量，避免全量文件漂移）；
    目录页 fetchData 改载这些轻量文件。中文不转义、紧凑输出（随 --pretty 转缩进）。
    """
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
