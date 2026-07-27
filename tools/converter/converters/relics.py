"""遗器套装索引转换器。"""

import logging

from config import EXCEL_DIR, OUTPUT_DIR, RARITY_MAP, RELIC_TYPE_MAP
from textmap import resolve_text
from utils import load_json, save_json, map_icon_path, unwrap_value

logger = logging.getLogger("converter")


def convert() -> None:
    """转换 RelicSetConfig.json + RelicConfig.json + RelicSetSkillConfig.json → relics.json。

    按套装 ID 聚合，只保留最高稀有度（5星）的部位列表。
    """
    # 加载套装配置
    set_data = load_json(EXCEL_DIR / "RelicSetConfig.json")
    # 加载遗器配置（单个部位+稀有度）
    relic_data = load_json(EXCEL_DIR / "RelicConfig.json")
    # 加载套装效果配置
    skill_data = load_json(EXCEL_DIR / "RelicSetSkillConfig.json")

    # 按 SetID 聚合套装效果（desc 模板 + AbilityParamList 参数值）
    set_skills: dict[int, dict[int, tuple[str, list]]] = {}  # set_id → {require_num: (desc, params)}
    for skill in skill_data:
        set_id = skill.get("SetID", 0)
        require_num = skill.get("RequireNum", 0)
        desc = resolve_text(skill.get("SkillDesc", ""))
        params = [unwrap_value(p) for p in skill.get("AbilityParamList", [])]
        if set_id not in set_skills:
            set_skills[set_id] = {}
        set_skills[set_id][require_num] = (desc, params)

    # 按 SetID 聚合部位，只保留最高稀有度（5星）
    set_pieces: dict[int, list] = {}  # set_id → [piece, ...]
    for relic in relic_data:
        set_id = relic.get("SetID", 0)
        rarity_key = relic.get("Rarity", "")
        rarity = RARITY_MAP.get(rarity_key, 0)
        # 只保留 5 星
        if rarity != 5:
            continue
        piece_type = relic.get("Type", "")
        if set_id not in set_pieces:
            set_pieces[set_id] = []
        set_pieces[set_id].append({
            "id": relic.get("ID", 0),
            "type": piece_type,
            "type_name": RELIC_TYPE_MAP.get(piece_type, piece_type),
            "rarity": rarity,
            "max_level": relic.get("MaxLevel", 0),
            "main_affix_group": relic.get("MainAffixGroup", 0),
            "sub_affix_group": relic.get("SubAffixGroup", 0),
        })

    # 构建结果
    result = {}
    for item in set_data:
        set_id = item.get("SetID", 0)
        name = resolve_text(item.get("SetName", {}))
        # 跳过未发布套装
        if not item.get("Release", False):
            continue

        descriptions: dict[int, str] = {}
        param_list: dict[str, list] = {}
        for rn, (desc, params) in set_skills.get(set_id, {}).items():
            descriptions[rn] = desc
            if params:
                param_list[str(rn)] = params
        pieces = set_pieces.get(set_id, [])
        # 按部位顺序排序
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

    # 按 id 排序输出为列表
    sorted_result = [result[k] for k in sorted(result.keys(), key=int)]
    save_json(sorted_result, OUTPUT_DIR / "relics.json")
