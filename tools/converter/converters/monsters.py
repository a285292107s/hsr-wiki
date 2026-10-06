"""Monster catalog → public/data/cn/monsters.json

从 MonsterTemplateConfig 提取唯一敌对物种（按模板去重，每个模板对应一个可视怪物），
解析中文名并保留图标路径与类型。图标经 map_icon_path 转换为官方 StarRailTextures
相对路径（monstermiddleicon/{stem}.png，--official-icon-paths 模式），
前端 monsterIconUrl 直接拼 OFFICIAL_ICON_BASE 加载。

除身份字段外还落 `weak` / `camp`：它们是目录卡的**唯一可辨差异**（632 个模板里 392 条落在
同名同图的簇内；卡片只展示名称+分类时 400/632 张卡与另一张完全无法区分）。两项直取
monster_common 的共享聚合表，本文件不复制解析逻辑。

**不落 `figure`**：同族判据是「名称 + 卡面图标（IconPath stem）」而不是立绘 —— 立绘是
per-变体的（冰锋 1002011/1002012 立绘不同、卡面图标相同），按立绘分组会把用户看到的 4 张
同图卡拆成 2+2（`src/lib/monster-family.ts` 单点声明该判据，列表页与详情页共用）。
"""
import logging

from config import EXCEL_DIR, OUTPUT_DIR
from converters.monster_common import load_monsters
from textmap import resolve_text
from utils import load_json, map_icon_path, save_json, sort_by_id

logger = logging.getLogger("converter")


def _monster_type(rank: str) -> str:
    """从 Rank 字段推导怪物类型标签（粗粒度，仅用于目录筛选/徽章）。"""
    r = (rank or "").lower()
    if "boss" in r:
        return "BOSS"
    if "elite" in r:
        return "ELITE"
    return "MINION"


def convert() -> None:
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    facets = load_monsters()
    result = []
    for t in templates:
        mid = t.get("MonsterTemplateID")
        name = resolve_text(t.get("MonsterName", {}))
        icon = map_icon_path(t.get("IconPath", ""))
        if not name or not icon:
            continue
        facet = facets.get(mid) or {}
        result.append(
            {
                "id": mid,
                "name": name,
                "icon": icon,
                "type": _monster_type(t.get("Rank", "")),
                "weak": list(facet.get("weak") or []),
                "camp": facet.get("camp") or "",
            }
        )
    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "monsters.json")
    logger.info("monsters: %d entries", len(result))
