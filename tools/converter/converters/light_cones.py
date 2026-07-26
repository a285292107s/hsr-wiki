"""光锥索引转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 EquipmentConfig.json + EquipmentSkillConfig.json → light_cones.json。"""
    # 加载光锥基础配置
    equip_data = load_json(EXCEL_DIR / "EquipmentConfig.json")
    # 加载光锥技能配置（按 SkillID 索引，取 Level=1）
    skill_data = load_json(EXCEL_DIR / "EquipmentSkillConfig.json")
    skill_map = {}
    for skill in skill_data:
        sid = skill.get("SkillID", 0)
        if sid not in skill_map:
            skill_map[sid] = skill  # 取第一条（Level=1）

    result = []

    for item in equip_data:
        # 过滤未发布光锥
        if not item.get("Release", False):
            continue

        equip_id = item.get("EquipmentID", 0)
        name = resolve_text(item.get("EquipmentName", {}))
        rarity_key = item.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)

        # 关联技能数据
        skill_id = item.get("SkillID", 0)
        skill = skill_map.get(skill_id, {})
        skill_name = resolve_text(skill.get("SkillName", {}))
        skill_desc = resolve_text(skill.get("SkillDesc", {}))

        result.append({
            "id": equip_id,
            "name": name,
            "rarity": rarity,
            "path": item.get("AvatarBaseType", ""),
            "skill_id": skill_id,
            "skill_name": skill_name,
            "skill_desc": skill_desc,
            "icon": map_icon_path(item.get("ThumbnailPath", "")),
            "icon_figure": map_icon_path(item.get("ImagePath", "")),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "light_cones.json")
