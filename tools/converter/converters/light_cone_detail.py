"""光锥详情转换器：从多张源表拼装每个光锥的完整详情数据。

输出：public/data/cn/light_cones/{id}.json
数据源：
- EquipmentConfig.json        基础配置（名称/稀有度/命途/技能ID/图标）
- EquipmentSkillConfig.json   光锥技能（名称/描述/各叠影等级参数）
- EquipmentPromotionConfig.json 晋阶属性（HP/ATK/DEF base+add / 晋阶消耗 / 等级上限）
- ItemConfigEquipment.json    物品描述（ItemDesc 简介 / ItemBGDesc 卡面故事）
"""

import logging
from collections import defaultdict

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value

logger = logging.getLogger("converter")

def convert() -> None:
    """转换光锥详情数据 → light_cones/{id}.json。"""
    equip_data = load_json(EXCEL_DIR / "EquipmentConfig.json")
    skill_data = load_json(EXCEL_DIR / "EquipmentSkillConfig.json")
    promo_data = load_json(EXCEL_DIR / "EquipmentPromotionConfig.json")
    item_data = load_json(EXCEL_DIR / "ItemConfigEquipment.json")

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
            "icon": map_icon_path(item.get("ThumbnailPath", "")),
            "icon_figure": map_icon_path(item.get("ImagePath", "")),
        }

        save_json(detail, output_dir / f"{equip_id}.json")
        count += 1

    logger.info("已保存 %d 个光锥详情到 %s", count, output_dir)
