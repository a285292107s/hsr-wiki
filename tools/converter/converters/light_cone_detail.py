"""光锥详情转换器：从多张源表拼装每个光锥的完整详情数据。

输出：public/data/cn/light_cones/{id}.json
数据源：
- EquipmentConfig.json        基础配置（名称/稀有度/命途/技能ID/图标）
- EquipmentSkillConfig.json   光锥技能（名称/描述/各叠影等级参数）
- EquipmentPromotionConfig.json 晋阶属性（HP/ATK/DEF base+add / 晋阶消耗 / 等级上限）
- ItemConfigEquipment.json    物品描述（ItemDesc 简介 / ItemBGDesc 卡面故事）
- AvatarEquipRecommend.json   适配角色（官方配装推荐，反向索引；角色页「推荐光锥」的正向同表）
"""

import logging
from typing import Any
from collections import defaultdict

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value

logger = logging.getLogger("converter")


def _load_optional(name: str) -> list[Any]:
    path = EXCEL_DIR / name
    return load_json(path) if path.exists() else []


def _build_recommend_index(equip_records: list[dict]) -> dict[int, list[dict]]:
    """AvatarEquipRecommend(+LD) → 光锥 ID → 适配角色列表。

    `rank` = 该光锥在这个角色的推荐列表中的顺位（1 起，与角色页 REC. 序号同源）；
    同一 AvatarID 在 LD 表重复登记时以 LD 为准（与 character_detail 的 equip_by_id 同序）。
    列表按 (rank, id) 排序，保证产物稳定可 diff。
    """
    equip_by_avatar: dict[int, list[int]] = {}
    for e in equip_records:
        avatar_id = e.get("AvatarID", 0)
        if avatar_id:
            equip_by_avatar[avatar_id] = e.get("EquipmentList", [])

    index: dict[int, list[dict]] = defaultdict(list)
    for avatar_id, equipment_ids in equip_by_avatar.items():
        for rank, equip_id in enumerate(equipment_ids, start=1):
            index[equip_id].append({"id": avatar_id, "rank": rank})
    for entries in index.values():
        entries.sort(key=lambda x: (x["rank"], x["id"]))
    return index


def convert() -> None:
    """转换光锥详情数据 → light_cones/{id}.json。"""
    equip_data = load_json(EXCEL_DIR / "EquipmentConfig.json")
    skill_data = load_json(EXCEL_DIR / "EquipmentSkillConfig.json")
    promo_data = load_json(EXCEL_DIR / "EquipmentPromotionConfig.json")
    item_data = load_json(EXCEL_DIR / "ItemConfigEquipment.json")
    recommend_index = _build_recommend_index(
        _load_optional("AvatarEquipRecommend.json") + _load_optional("AvatarEquipRecommendLD.json")
    )

    skill_by_id: dict[int, list[dict]] = defaultdict(list)
    for s in skill_data:
        skill_by_id[s.get("SkillID", 0)].append(s)

    promo_by_id: dict[int, list[dict]] = defaultdict(list)
    for p in promo_data:
        promo_by_id[p.get("EquipmentID", 0)].append(p)

    item_by_id: dict[int, dict] = {it.get("ID", 0): it for it in item_data}

    output_dir = OUTPUT_DIR / "light_cones"
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for item in equip_data:
        if not item.get("Release", False):
            continue

        equip_id = item.get("EquipmentID", 0)
        name = resolve_text(item.get("EquipmentName", {}))
        if not name:
            continue

        rarity = RARITY_MAP.get(item.get("Rarity", ""), 0)
        path = item.get("AvatarBaseType", "")
        skill_id = item.get("SkillID", 0)
        max_promotion = item.get("MaxPromotion", 6)
        max_rank = item.get("MaxRank", 5)

        skill_entries = sorted(
            skill_by_id.get(skill_id, []),
            key=lambda x: x.get("Level", 1),
        )
        skill_name = ""
        skill_desc = ""
        skill_levels: dict[str, dict] = {}
        for e in skill_entries:
            lv = e.get("Level", 1)
            if lv == 1:
                skill_name = resolve_text(e.get("SkillName", {}))
                skill_desc = resolve_text(e.get("SkillDesc", {}), clean=False)
            skill_levels[str(lv)] = {
                "level": lv,
                "param_list": [unwrap_value(p) for p in e.get("ParamList", [])],
            }

        promo_entries = sorted(
            promo_by_id.get(equip_id, []),
            key=lambda x: x.get("Promotion", 0),
        )
        stats: dict[str, dict] = {}
        for e in promo_entries:
            phase = str(e.get("Promotion", 0))
            stats[phase] = {
                "hp_base": unwrap_value(e.get("BaseHP", {})),
                "hp_add": unwrap_value(e.get("BaseHPAdd", {})),
                "attack_base": unwrap_value(e.get("BaseAttack", {})),
                "attack_add": unwrap_value(e.get("BaseAttackAdd", {})),
                "defence_base": unwrap_value(e.get("BaseDefence", {})),
                "defence_add": unwrap_value(e.get("BaseDefenceAdd", {})),
                "max_level": e.get("MaxLevel", 80),
                "cost": e.get("PromotionCostList", []),
            }

        item_info = item_by_id.get(equip_id, {})
        desc = resolve_text(item_info.get("ItemDesc", {}))
        story = resolve_text(item_info.get("ItemBGDesc", {}), clean=False)

        detail = {
            "id": equip_id,
            "name": name,
            "rarity": rarity,
            "path": path,
            "desc": desc,
            "story": story,
            "max_promotion": max_promotion,
            "max_rank": max_rank,
            "skill": {
                "id": skill_id,
                "name": skill_name,
                "desc": skill_desc,
                "level": skill_levels,
            },
            "stats": stats,
            "recommend_chars": recommend_index.get(equip_id, []),
            "icon": map_icon_path(item.get("ThumbnailPath", "")),
            "icon_figure": map_icon_path(item.get("ImagePath", "")),
        }

        save_json(detail, output_dir / f"{equip_id}.json")
        count += 1

    logger.info("已保存 %d 个光锥详情到 %s", count, output_dir)
