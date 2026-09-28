"""角色索引转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP, PATH_NAME_FALLBACK
from converters.version import read_source_version_label
from release_version import apply_release_versions, load_baseline_versions, tag_release_versions
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 AvatarConfig.json + AvatarConfigLD.json → characters.json。"""
    # 版本上新打标（ADR 0019 决策 4/5）：基线 = 覆盖输出前读到的上一版已提交 JSON。
    # 基线已有 id 沿用其 release_version，本版新增 id 才写当前版本号，无基线全部留空。
    baseline = load_baseline_versions(OUTPUT_DIR / "characters.json")

    data = load_json(EXCEL_DIR / "AvatarConfig.json")

    ld_path = EXCEL_DIR / "AvatarConfigLD.json"
    if ld_path.exists():
        ld_data = load_json(ld_path)
        data = data + ld_data

    result = []

    for item in data:
        # 过滤未发布角色
        if not item.get("Release", False):
            continue

        avatar_id = item.get("AvatarID", 0)
        # 跳过非标准角色 ID（NPC 等，标准角色 ID 为 1xxx）
        if not (1000 <= avatar_id <= 9999):
            continue

        name = resolve_text(item.get("AvatarName", {}))
        full_name = resolve_text(item.get("AvatarFullName", {}))
        path_key = item.get("AvatarBaseType", "")
        if name == "开拓者" and path_key:
            path_name = PATH_NAME_FALLBACK.get(path_key, path_key)
            name = f"开拓者·{path_name}"
            if full_name == "开拓者":
                full_name = name
        rarity_key = item.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)
        # SPNeed 缺失时输出 null（如遐蝶 1407 无该字段），前端以 ?? 0 兑底
        sp_need = unwrap_value(item.get("SPNeed"))

        result.append({
            "id": avatar_id,
            "name": name,
            "full_name": full_name,
            "rarity": rarity,
            "path": item.get("AvatarBaseType", ""),
            "element": item.get("DamageType", ""),
            "sp_need": sp_need,
            "vo_tag": item.get("AvatarVOTag", ""),
            "icon": map_icon_path(item.get("DefaultAvatarHeadIconPath", "")),
            "icon_round": map_icon_path(item.get("AvatarSideIconPath", "")),
            "icon_mini": map_icon_path(item.get("AvatarMiniIconPath", "")),
            "icon_cutin": map_icon_path(item.get("AvatarCutinImgPath", "")),
            "rank_ids": item.get("RankIDList", []),
            "skill_ids": item.get("SkillList", []),
        })

    result = sort_by_id(result)
    versions = tag_release_versions(
        (item["id"] for item in result), baseline, read_source_version_label()
    )
    apply_release_versions(result, versions)
    save_json(result, OUTPUT_DIR / "characters.json")
