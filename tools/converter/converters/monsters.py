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

另落官方 `TemplateGroupID` → `atlas_group`（**缺位不落键**）：官方把「同一图鉴条目的各具名形态」
（完整 / 幻象 / 错误 / 污染，甚至剧情改名如「无望冽风的幻灭者」）登记为一组，实测 **比卡面判据更粗**
（113 个多成员官方组里 12 个连卡面图标都不同），故只作**第二个维度**（详情页「图鉴族」互链），
不参与同族变体判定。**在此文件解析、不进 `monster_common` 共享聚合表**——聚合表被 endgame /
voracity 共用，多加一个键会漏进它们的 payload（见 `docs/memory/2026-10.md` 的前向审计坑位）。
官方 `AtlasSortID`（组内形态序）**不落**：实测只有 169/472 有值、113 个多成员组里仅 2 组齐全，
拿它排序会让组内第一项跳到官方位、其余按 id，读起来是随机序。
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


def catalog_rows(facets: dict | None = None) -> list[dict]:
    """目录条目（**有名字与图标**的模板，`monsters.json` 的构建单点）。

    `facets` = `monster_common.load_monsters()` 的聚合（缺省时自取）；`monster_detail` 也用它
    划定「同卡面形态」的全集——两处必须同源，否则页面上会出现目录里看不到的同卡面同伴。
    """
    if facets is None:
        facets = load_monsters()
    rows = []
    for t in load_json(EXCEL_DIR / "MonsterTemplateConfig.json"):
        mid = t.get("MonsterTemplateID")
        name = resolve_text(t.get("MonsterName", {}))
        icon = map_icon_path(t.get("IconPath", ""))
        if not name or not icon:
            continue
        facet = facets.get(mid) or {}
        row = {
            "id": mid,
            "name": name,
            "icon": icon,
            "type": _monster_type(t.get("Rank", "")),
            "weak": list(facet.get("weak") or []),
            "camp": facet.get("camp") or "",
        }
        # 官方图鉴族号：有值才落键（前端据「键存在」决定是否出「图鉴族」互链）
        group = t.get("TemplateGroupID")
        if group is not None:
            row["atlas_group"] = group
        rows.append(row)
    return sort_by_id(rows)


def convert() -> None:
    result = catalog_rows()
    save_json(result, OUTPUT_DIR / "monsters.json")
    logger.info("monsters: %d entries", len(result))
