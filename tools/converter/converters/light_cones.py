"""光锥索引转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP
from converters.version import read_source_version_label
from release_version import apply_release_versions, load_baseline_versions, tag_release_versions
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, sort_by_id

logger = logging.getLogger("converter")

def convert() -> None:
    """转换 EquipmentConfig.json + EquipmentSkillConfig.json → light_cones.json。"""
    baseline = load_baseline_versions(OUTPUT_DIR / "light_cones.json")

    equip_data = load_json(EXCEL_DIR / "EquipmentConfig.json")
    skill_data = load_json(EXCEL_DIR / "EquipmentSkillConfig.json")
    skill_map = {}
    for skill in skill_data:
        sid = skill.get("SkillID", 0)
        if sid not in skill_map:
            skill_map[sid] = skill

    result = []

    for item in equip_data:
        if not item.get("Release", False):
            continue

        equip_id = item.get("EquipmentID", 0)
        name = resolve_text(item.get("EquipmentName", {}))
        rarity_key = item.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)

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
    versions = tag_release_versions(
        (item["id"] for item in result), baseline, read_source_version_label()
    )
    apply_release_versions(result, versions)
    save_json(result, OUTPUT_DIR / "light_cones.json")
