"""遗器套装索引转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP, RELIC_TYPE_MAP
from enum_labels import resolve as resolve_label
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value

logger = logging.getLogger("converter")

def convert() -> None:
    """转换 RelicSetConfig.json + RelicConfig.json + RelicSetSkillConfig.json → relics.json。

    按套装 ID 聚合，只保留最高稀有度（5星）的部位列表。
    """
    set_data = load_json(EXCEL_DIR / "RelicSetConfig.json")
    relic_data = load_json(EXCEL_DIR / "RelicConfig.json")
    skill_data = load_json(EXCEL_DIR / "RelicSetSkillConfig.json")

    set_skills: dict[int, dict[int, tuple[str, list]]] = {}
    for skill in skill_data:
        set_id = skill.get("SetID", 0)
        require_num = skill.get("RequireNum", 0)
        desc = resolve_text(skill.get("SkillDesc", ""))
        params = [unwrap_value(p) for p in skill.get("AbilityParamList", [])]
        if set_id not in set_skills:
            set_skills[set_id] = {}
        set_skills[set_id][require_num] = (desc, params)

    set_pieces: dict[int, list] = {}
    for relic in relic_data:
        set_id = relic.get("SetID", 0)
        rarity_key = relic.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)
        if rarity != 5:
            continue
        piece_type = relic.get("Type", "")
        if set_id not in set_pieces:
            set_pieces[set_id] = []
        set_pieces[set_id].append({
            "id": relic.get("ID", 0),
            "type": piece_type,
            # 部位名取自官方词条（令牌化）而非写死中文：产物随语言包切语言
            "type_name": resolve_label("relic_slot", piece_type, RELIC_TYPE_MAP.get(piece_type, piece_type)),
            "rarity": rarity,
            "max_level": relic.get("MaxLevel", 0),
            "main_affix_group": relic.get("MainAffixGroup", 0),
            "sub_affix_group": relic.get("SubAffixGroup", 0),
        })

    result = {}
    for item in set_data:
        set_id = item.get("SetID", 0)
        name = resolve_text(item.get("SetName", {}))
        if not item.get("Release", False):
            continue

        descriptions: dict[int, str] = {}
        param_list: dict[str, list] = {}
        for rn, (desc, params) in set_skills.get(set_id, {}).items():
            descriptions[rn] = desc
            if params:
                param_list[str(rn)] = params
        pieces = set_pieces.get(set_id, [])
        type_order = {"HEAD": 0, "HAND": 1, "BODY": 2, "FOOT": 3, "NECK": 4, "OBJECT": 5}
        pieces.sort(key=lambda p: type_order.get(p["type"], 99))

        result[str(set_id)] = {
            "id": set_id,
            "name": name,
            "icon": map_icon_path(item.get("SetIconPath", "")),
            "icon_figure": map_icon_path(item.get("SetIconFigurePath", "")),
            "descriptions": descriptions,
            "param_list": param_list,
            "require_num": item.get("SetSkillList", []),
            "pieces": pieces,
            "release_version": item.get("ReleaseVersion", ""),
        }

    sorted_result = [result[k] for k in sorted(result.keys(), key=int)]
    save_json(sorted_result, OUTPUT_DIR / "relics.json")

def convert_stories() -> None:
    """转换 RelicDataInfo.json → relic_stories.json（遗器来历/部位故事）。

    每个部位含：name（部位名）/ desc（短描述）/ story（完整来历，保留 \\n 与 <i> 标签）。
    输出结构：{ set_id: { piece_type: { name, desc, story } } }，仅详情页按需加载。
    """
    info_data = load_json(EXCEL_DIR / "RelicDataInfo.json")

    result: dict[str, dict[str, dict]] = {}
    for item in info_data:
        set_id = item.get("SetID", 0)
        piece_type = item.get("Type", "")
        story = resolve_text(item.get("BGStoryContent", ""), clean=False)
        if not story:
            continue
        result.setdefault(str(set_id), {})[piece_type] = {
            "name": resolve_text(item.get("RelicName", "")),
            "desc": resolve_text(item.get("ItemBGDesc", ""), clean=False),
            "story": story,
        }

    sorted_result = {k: result[k] for k in sorted(result.keys(), key=int)}
    save_json(sorted_result, OUTPUT_DIR / "relic_stories.json")
