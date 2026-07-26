"""角色技能转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, SKILL_TYPE_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 AvatarSkillConfig.json → character_skills.json。

    第一期只含 name/type/desc，不含等级数值表。
    同一 SkillID 多条记录（不同等级）只取第一条（Level=1）。
    """
    data = load_json(EXCEL_DIR / "AvatarSkillConfig.json")
    seen_ids = set()
    result = []

    for item in data:
        skill_id = item.get("SkillID", 0)
        # 同一 SkillID 只取第一条
        if skill_id in seen_ids:
            continue
        seen_ids.add(skill_id)

        name = resolve_text(item.get("SkillName", {}))
        tag = resolve_text(item.get("SkillTag", {}))
        type_desc = resolve_text(item.get("SkillTypeDesc", {}))
        desc = resolve_text(item.get("SkillDesc", {}))
        simple_desc = resolve_text(item.get("SimpleSkillDesc", {}))
        attack_type = item.get("AttackType", "")
        skill_type = SKILL_TYPE_MAP.get(attack_type, "")

        result.append({
            "id": skill_id,
            "name": name,
            "tag": tag,
            "type": skill_type,
            "type_name": type_desc,
            "desc": desc,
            "simple_desc": simple_desc,
            "icon": map_icon_path(item.get("SkillIcon", "")),
            "max_level": item.get("MaxLevel", 1),
        })

    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "character_skills.json")
