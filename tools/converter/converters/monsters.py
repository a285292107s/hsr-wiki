"""Monster catalog → public/data/cn/monsters.json

从 MonsterTemplateConfig 提取唯一敌对物种（按模板去重，每个模板对应一个可视怪物），
解析中文名并保留图标路径与类型。图标经 map_icon_path 转换为官方 StarRailTextures
相对路径（monstermiddleicon/{stem}.png，--official-icon-paths 模式），
前端 monsterIconUrl 直接拼 OFFICIAL_ICON_BASE 加载。
"""
import logging

from config import EXCEL_DIR, OUTPUT_DIR
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
    result = []
    for t in templates:
        name = resolve_text(t.get("MonsterName", {}))
        icon = map_icon_path(t.get("IconPath", ""))
        if not name or not icon:
            continue
        result.append(
            {
                "id": t.get("MonsterTemplateID"),
                "name": name,
                "icon": icon,
                "type": _monster_type(t.get("Rank", "")),
            }
        )
    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "monsters.json")
    logger.info("monsters: %d entries", len(result))
