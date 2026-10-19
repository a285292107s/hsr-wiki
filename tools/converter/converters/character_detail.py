import logging
import re
from collections import defaultdict

from config import EXCEL_DIR, OUTPUT_DIR, RELIC_TYPE_MAP, SKILL_TYPE_MAP, PATH_NAME_FALLBACK
from enum_labels import resolve as resolve_label
from enum_labels import trailblazer_name_ref
from textmap import ensure_textmap_en, resolve_text, resolve_text_en
from utils import load_json, save_json, map_icon_path, unwrap_value

logger = logging.getLogger("converter")

_TRIGGER_TYPE_MAP = {
    "Skill01": "Normal",
    "Skill02": "BPSkill",
    "Skill03": "Ultra",
    "SkillP01": "Passive",
    "SkillMaze": "Maze",
    "Skill31": None,
    "Skill32": None,
    "Skill33": None,
    "Skill34": None,
}

def _build_skills(skill_data: list[dict], skill_ids: list[int], avatar_id: int) -> dict[str, dict]:
    by_id: dict[int, list[dict]] = defaultdict(list)
    for item in skill_data:
        sid = item.get("SkillID", 0)
        if sid in skill_ids:
            by_id[sid].append(item)

    result: dict[str, dict] = {}
    for sid, entries in by_id.items():
        entries.sort(key=lambda x: x.get("Level", 1))
        first = entries[0]

        attack_type = first.get("AttackType", "")
        if first.get("HideInUI", False) and attack_type != "Assist":
            logger.debug(f"过滤 HideInUI 子技能: {sid}")
            continue
        trigger_key = first.get("SkillTriggerKey", "")
        trigger_type = _TRIGGER_TYPE_MAP.get(trigger_key)
        if trigger_type is None and trigger_key in _TRIGGER_TYPE_MAP:
            logger.debug(f"过滤内部子技能: {sid} (TriggerKey={trigger_key})")
            continue

        name = resolve_text(first.get("SkillName", {}))
        type_desc = resolve_text(first.get("SkillTypeDesc", {}))
        desc = resolve_text(first.get("SkillDesc", {}), clean=False)
        simple_desc = resolve_text(first.get("SimpleSkillDesc", {}), clean=False)
        tag = resolve_text(first.get("SkillTag", {})) or None
        if trigger_type:
            skill_type = trigger_type
        else:
            skill_type = SKILL_TYPE_MAP.get(attack_type, attack_type)
        if skill_type == "":
            skill_type = None

        level_dict: dict[str, dict] = {}
        for e in entries:
            lv = str(e.get("Level", 1))
            level_dict[lv] = {
                "level": e.get("Level", 1),
                "param_list": [unwrap_value(p) for p in e.get("ParamList", [])],
            }

        result[str(sid)] = {
            "id": sid,
            "name": name,
            "desc": desc,
            "simple_desc": simple_desc,
            "type": skill_type,
            "type_name": type_desc,
            "tag": tag,
            "icon": _map_skill_icon(first.get("SkillIcon", ""), avatar_id),
            "sp_base": unwrap_value(first.get("SPBase", None)),
            "sp_need": unwrap_value(first.get("SPNeed", None)),
            "bp_need": unwrap_value(first.get("BPNeed", None)),
            "bp_add": unwrap_value(first.get("BPAdd", None)),
            "show_stance_list": [unwrap_value(x) for x in first.get("ShowStanceList", [])] or None,
            "stance_damage_type": first.get("StanceDamageType", None),
            "stance_damage_display": first.get("StanceDamageDisplay", None),
            "skill_need": resolve_text(first.get("SkillNeed", {})) or None,
            "max_level": first.get("MaxLevel", None),
            "rated_rank_id": first.get("RatedRankID", None) or None,
            "rated_skill_tree_id": first.get("RatedSkillTreeID", None) or None,
            "skill_combo_value_delta": first.get("SkillComboValueDelta", None),
            "extra": {},
            "level": level_dict,
        }

    return result

def _build_servant_skills(servant_skill_data: list[dict], skill_ids: list[int], avatar_id: int) -> dict[str, dict]:
    by_id: dict[int, list[dict]] = defaultdict(list)
    for item in servant_skill_data:
        sid = item.get("SkillID", 0)
        if sid in skill_ids:
            by_id[sid].append(item)

    result: dict[str, dict] = {}
    for sid in skill_ids:
        entries = by_id.get(sid)
        if not entries:
            continue
        entries.sort(key=lambda x: x.get("Level", 1))
        first = entries[0]

        name = resolve_text(first.get("SkillName", {}))
        type_desc = resolve_text(first.get("SkillTypeDesc", {}))
        desc = resolve_text(first.get("SkillDesc", {}), clean=False)
        simple_desc = resolve_text(first.get("SimpleSkillDesc", {}), clean=False)
        skill_type = "Servant" if first.get("AttackType") == "Servant" else None
        tag = resolve_text(first.get("SkillTag", {})) or None

        level_dict: dict[str, dict] = {}
        for e in entries:
            lv = str(e.get("Level", 1))
            level_dict[lv] = {
                "level": e.get("Level", 1),
                "param_list": [unwrap_value(p) for p in e.get("ParamList", [])],
            }

        result[str(sid)] = {
            "id": sid,
            "name": name,
            "desc": desc,
            "simple_desc": simple_desc,
            "type": skill_type,
            "type_name": type_desc,
            "tag": tag,
            "icon": _map_skill_icon(first.get("SkillIcon", ""), avatar_id),
            "sp_base": unwrap_value(first.get("SPBase", None)),
            "sp_need": unwrap_value(first.get("SPNeed", None)),
            "bp_need": unwrap_value(first.get("BPNeed", None)),
            "bp_add": None,
            "show_stance_list": [unwrap_value(x) for x in first.get("ShowStanceList", [])] or None,
            "stance_damage_type": first.get("StanceDamageType", None),
            "stance_damage_display": first.get("StanceDamageDisplay", None),
            "skill_need": resolve_text(first.get("SkillNeed", {})) or None,
            "max_level": first.get("MaxLevel", None),
            "rated_rank_id": first.get("RatedRankID", None) or None,
            "rated_skill_tree_id": first.get("RatedSkillTreeID", None) or None,
            "skill_combo_value_delta": first.get("SkillComboValueDelta", None),
            "extra": {},
            "level": level_dict,
        }

    return result

def _build_memosprite(servant_config: list[dict], servant_skill_data: list[dict], avatar_id: int) -> dict | None:
    for s in servant_config:
        servant_id = s.get("ServantID", 0)
        owner_base = servant_id - 10000
        owners = {owner_base}
        if 8001 <= owner_base <= 8008:
            odd = owner_base if owner_base % 2 == 1 else owner_base - 1
            owners = {odd, odd + 1}
        if avatar_id not in owners:
            continue

        return {
            "name": resolve_text(s.get("ServantName", {})),
            "icon": s.get("ActionServantHeadIconPath", ""),
            "hp_base": s.get("HPBase", "0"),
            "hp_inherit": s.get("HPInherit", "0"),
            "hp_skill": s.get("HPSkill", None),
            "speed_base": s.get("SpeedBase", "0"),
            "speed_inherit": s.get("SpeedInherit", "0"),
            "aggro": unwrap_value(s.get("Aggro", {})),
            "skills": _build_servant_skills(servant_skill_data, s.get("SkillIDList", []), avatar_id),
        }
    return None

def _build_ranks(rank_data: list[dict], rank_ids: list[int], avatar_id: int) -> dict[str, dict]:
    result: dict[str, dict] = {}
    for item in rank_data:
        rid = item.get("RankID", 0)
        if rid not in rank_ids:
            continue

        name = resolve_text(item.get("Name", ""))
        desc = resolve_text(item.get("Desc", ""), clean=False)
        rank_num = item.get("Rank", 0)

        result[str(rank_num)] = {
            "id": rid,
            "name": name,
            "desc": desc,
            "icon": _map_skill_icon(item.get("IconPath", ""), avatar_id),
            "param_list": [unwrap_value(p) for p in item.get("Param", [])],
            "extra": {},
        }

    return result

_PSEUDO_SKILL_ICON_RE = re.compile(r"^((?:SpriteOutput/SkillIcons/Avatar|icon/skill/Avatar)/)(\d+)/(.+)$")
"""技能/星魂/行迹图标路径结构：前缀 + 目录 id + 文件名。

同时接受源路径（SpriteOutput/SkillIcons/Avatar/，归一必须在 map_icon_path 之前执行）
与已映射的旧短路径（icon/skill/Avatar/，仅为兼容既有调用）。
"""

_ENHANCED_ID_OFFSET = 1_000_000
"""强化版技能 / 星魂 id = 基础 id + 该偏移（`1121201` ↔ `121201`）。

`AvatarConfigEnhanced.SkillList/RankIDList` 登记的是**强化版 id**，而 `d.ranks` 的键与
`Rank.id` 都是**基础 id**，故角标判定前必须换算回基础 id；前端 `lib/compare.ts` 的
`baseSkillId()` 是同一换算的前端镜像，两处必须同步改。实测 10 个强化角色的
`SkillList` / `RankIDList` 逐条满足该偏移。
"""

def _normalize_tree_icon(icon: str, avatar_id: int) -> str:
    if not icon:
        return icon
    m = _PSEUDO_SKILL_ICON_RE.match(icon)
    if not m:
        return icon
    prefix, other_id, filename = m.group(1), m.group(2), m.group(3)
    if other_id != f"1{avatar_id}":
        return icon
    filename = filename.replace(f"SkillIcon_{other_id}_", f"SkillIcon_{avatar_id}_", 1)
    return f"{prefix}{avatar_id}/{filename}"

def _map_skill_icon(source_path: str, avatar_id: int) -> str:
    return map_icon_path(_normalize_tree_icon(source_path, avatar_id))

def _build_skill_trees(tree_data: list[dict], avatar_id: int, enhanced_id: int | None = None) -> dict[str, dict[str, dict]]:
    by_anchor: dict[str, list[dict]] = defaultdict(list)
    for item in tree_data:
        if item.get("AvatarID") != avatar_id:
            continue
        if item.get("EnhancedID") != enhanced_id:
            continue
        anchor = item.get("AnchorType") or item.get("PointTriggerKey") or ""
        if not anchor:
            continue
        by_anchor[anchor].append(item)

    result: dict[str, dict[str, dict]] = {}
    for anchor, entries in by_anchor.items():
        entries.sort(key=lambda x: x.get("Level", 1))
        level_nodes: dict[str, dict] = {}
        for e in entries:
            lv = str(e.get("Level", 1))
            status_add_list = [
                {
                    "property_type": sa.get("PropertyType", ""),
                    "value": unwrap_value(sa.get("Value", {})),
                    "name": resolve_text(sa.get("Name", {})),
                }
                for sa in e.get("StatusAddList", [])
            ]
            level_nodes[lv] = {
                "anchor": anchor,
                "avatar_promotion_limit": e.get("AvatarPromotionLimit"),
                "avatar_level_limit": e.get("AvatarLevelLimit"),
                "default_unlock": e.get("DefaultUnlock", False),
                "icon": _map_skill_icon(e.get("IconPath", ""), avatar_id),
                "level_up_skill_id": e.get("LevelUpSkillID", []),
                "material_list": e.get("MaterialList", []),
                "max_level": e.get("MaxLevel", 1),
                "param_list": [unwrap_value(p) for p in e.get("ParamList", [])],
                "point_id": e.get("PointID", 0),
                "point_name": resolve_text(e.get("PointName", {})),
                "point_desc": resolve_text(e.get("PointDesc", {}), clean=False),
                "point_trigger_key": e.get("PointTriggerKey"),
                "point_type": e.get("PointType"),
                "pre_point": e.get("PrePoint", []),
                "status_add_list": status_add_list,
                "extra": {},
            }
        result[anchor] = level_nodes

    return result

def _build_stats(promo_data: list[dict], avatar_id: int) -> dict[str, dict]:
    entries = sorted(
        [x for x in promo_data if x.get("AvatarID") == avatar_id],
        key=lambda x: x.get("MaxLevel", 0),
    )
    result: dict[str, dict] = {}
    for i, e in enumerate(entries):
        result[str(i)] = {
            "attack_base": unwrap_value(e.get("AttackBase", {})),
            "attack_add": unwrap_value(e.get("AttackAdd", {})),
            "defence_base": unwrap_value(e.get("DefenceBase", {})),
            "defence_add": unwrap_value(e.get("DefenceAdd", {})),
            "hp_base": unwrap_value(e.get("HPBase", {})),
            "hp_add": unwrap_value(e.get("HPAdd", {})),
            "speed_base": unwrap_value(e.get("SpeedBase", {})),
            "critical_chance": unwrap_value(e.get("CriticalChance", {})),
            "critical_damage": unwrap_value(e.get("CriticalDamage", {})),
            "base_aggro": unwrap_value(e.get("BaseAggro", {})),
            "cost": e.get("PromotionCostList", []),
        }
    return result

def _build_relics(relic_data: list[dict], avatar_id: int) -> dict:
    for item in relic_data:
        if item.get("AvatarID") == avatar_id:
            return {
                "avatar_id": avatar_id,
                "set4_id_list": item.get("Set4IDList", []),
                "set2_id_list": item.get("Set2IDList", []),
                "property_list3": item.get("PropertyList3", []),
                "property_list4": item.get("PropertyList4", []),
                "property_list5": item.get("PropertyList5", []),
                "property_list6": item.get("PropertyList6", []),
                "property_list": [
                    {
                        "relic_type": p.get("RelicType", ""),
                        "relic_type_name": resolve_label(
                            "relic_slot",
                            p.get("RelicType", ""),
                            RELIC_TYPE_MAP.get(p.get("RelicType", ""), p.get("RelicType", "")),
                        ),
                        "property_type": p.get("PropertyType", ""),
                    }
                    for p in item.get("PropertyList", [])
                ],
                "sub_affix_property_list": item.get("SubAffixPropertyList", []),
                "score_rank_list": item.get("ScoreRankList", []),
            }
    return {}

def _build_teams(records: list[dict]) -> list[dict]:
    teams: list[dict] = []
    for t in records:
        member_list = [m for m in t.get("MemberList", []) if m]
        team: dict = {
            "team_id": t.get("TeamID", 0),
            "member_list": member_list,
        }
        for i in (1, 2, 3):
            backups = [b for b in t.get(f"BackupList{i}", []) if b]
            team[f"backup_list{i}"] = backups
        teams.append(team)
    return teams

def _enhanced_descs(hint_data: list[dict], avatar_id: int, enh_key: int) -> list[str]:
    for h in hint_data:
        if h.get("AvatarID") != avatar_id or h.get("EnhancedID") != enh_key:
            continue
        n = h.get("EnhancedDescNum", 0) or 0
        return [
            resolve_text(h.get(f"EnhancedDesc{i}", {}))
            for i in range(1, n + 1)
            if resolve_text(h.get(f"EnhancedDesc{i}", {}))
        ]
    return []

def _build_enhanced(
    enhanced_config: list[dict],
    hint_data: list[dict],
    skill_config: list[dict],
    rank_config: list[dict],
    tree_config: list[dict],
    avatar_id: int,
) -> dict[str, dict] | None:
    result: dict[str, dict] = {}
    for e in enhanced_config:
        if e.get("AvatarID") != avatar_id:
            continue
        enh_key = e.get("EnhancedID", 0) or 0
        if not enh_key:
            continue
        skill_ids = e.get("SkillList", [])
        rank_ids = e.get("RankIDList", [])
        result[str(enh_key)] = {
            "skills": _build_skills(skill_config, skill_ids, avatar_id),
            "ranks": _build_ranks(rank_config, rank_ids, avatar_id),
            "skill_trees": _build_skill_trees(tree_config, avatar_id, enhanced_id=enh_key),
            "descs": _enhanced_descs(hint_data, avatar_id, enh_key),
            "sp_need": unwrap_value(e.get("SPNeed")),
            "skill_ids": [i - _ENHANCED_ID_OFFSET for i in skill_ids],
            "rank_ids": [i - _ENHANCED_ID_OFFSET for i in rank_ids],
        }
    return result or None

def convert() -> None:
    ensure_textmap_en()
    avatar_config = load_json(EXCEL_DIR / "AvatarConfig.json")
    ld_path = EXCEL_DIR / "AvatarConfigLD.json"
    if ld_path.exists():
        avatar_config = avatar_config + load_json(ld_path)

    skill_config = load_json(EXCEL_DIR / "AvatarSkillConfig.json")
    skill_config_ld_path = EXCEL_DIR / "AvatarSkillConfigLD.json"
    if skill_config_ld_path.exists():
        skill_config = skill_config + load_json(skill_config_ld_path)

    rank_config = load_json(EXCEL_DIR / "AvatarRankConfig.json")
    rank_config_ld_path = EXCEL_DIR / "AvatarRankConfigLD.json"
    if rank_config_ld_path.exists():
        rank_config = rank_config + load_json(rank_config_ld_path)

    tree_config = load_json(EXCEL_DIR / "AvatarSkillTreeConfig.json")
    tree_config_ld_path = EXCEL_DIR / "AvatarSkillTreeConfigLD.json"
    if tree_config_ld_path.exists():
        tree_config = tree_config + load_json(tree_config_ld_path)
    promo_config = load_json(EXCEL_DIR / "AvatarPromotionConfig.json")
    promo_ld_path = EXCEL_DIR / "AvatarPromotionConfigLD.json"
    if promo_ld_path.exists():
        promo_config = promo_config + load_json(promo_ld_path)

    _maybe_load = lambda name: load_json(EXCEL_DIR / name) if (EXCEL_DIR / name).exists() else []
    atlas_data = _maybe_load("AvatarAtlas.json")
    camp_data = _maybe_load("AvatarCamp.json")
    story_data = _maybe_load("StoryAtlas.json")
    equip_rec = _maybe_load("AvatarEquipRecommend.json")
    equip_rec_ld = _maybe_load("AvatarEquipRecommendLD.json")
    equip_rec = equip_rec + equip_rec_ld
    relic_rec = _maybe_load("AvatarRelicRecommend.json")
    relic_rec_ld = _maybe_load("AvatarRelicRecommendLD.json")
    relic_rec = relic_rec + relic_rec_ld
    team_build = _maybe_load("TeamBuildConfig.json")
    enhanced_config = _maybe_load("AvatarConfigEnhanced.json")
    enhanced_hint = _maybe_load("AvatarEnhancedHintConfig.json")
    servant_config = _maybe_load("AvatarServantConfig.json")
    servant_skill = _maybe_load("AvatarServantSkillConfig.json")

    atlas_by_id: dict[int, dict] = {x["AvatarID"]: x for x in atlas_data}
    camp_by_id: dict[int, str] = {}
    for c in camp_data:
        cid = c.get("ID", 0)
        name = resolve_text(c.get("Name", {}))
        if name:
            camp_by_id[cid] = name
    stories_by_avatar: dict[int, list[dict]] = defaultdict(list)
    for s in story_data:
        stories_by_avatar[s.get("AvatarID", 0)].append(s)
    equip_by_id: dict[int, list[int]] = {
        e["AvatarID"]: e.get("EquipmentList", []) for e in equip_rec
    }
    teams_by_avatar: dict[int, list[dict]] = defaultdict(list)
    for t in team_build:
        tid = t.get("AvatarID", 0)
        if tid:
            teams_by_avatar[tid].append(t)
    for tid, lst in teams_by_avatar.items():
        lst.sort(key=lambda x: x.get("TeamID", 0))

    output_dir = OUTPUT_DIR / "characters"
    output_dir.mkdir(parents=True, exist_ok=True)

    count = 0
    for item in avatar_config:
        if not item.get("Release", False):
            continue

        avatar_id = item.get("AvatarID", 0)
        if not (1000 <= avatar_id <= 9999):
            continue

        name = resolve_text(item.get("AvatarName", {}))
        if not name:
            continue
        name_en = resolve_text_en(item.get("AvatarName", {}))

        rarity = item.get("Rarity", "")
        base_type = item.get("AvatarBaseType", "")
        damage_type = item.get("DamageType", "")
        avatar_vo_tag = item.get("AvatarVOTag", "")
        sp_need = unwrap_value(item.get("SPNeed"))
        rank_ids = item.get("RankIDList", [])
        skill_ids = item.get("SkillList", [])

        if name == "开拓者" and base_type:
            name = trailblazer_name_ref(base_type, PATH_NAME_FALLBACK.get(base_type, base_type))

        stories: dict[str, str | None] = {"0": None, "1": None, "2": None, "3": None, "4": None}
        avatar_stories = sorted(stories_by_avatar.get(avatar_id, []), key=lambda x: x.get("StoryID", 0))
        for idx, s in enumerate(avatar_stories[:5]):
            stories[str(idx)] = resolve_text(s.get("Story", {}))

        atlas = atlas_by_id.get(avatar_id, {})
        camp_id = atlas.get("CampID", 0)
        chara_info = {
            "camp": camp_by_id.get(camp_id),
            "va": {
                "chinese": resolve_text(atlas.get("CV_CN", {})),
                "japanese": resolve_text(atlas.get("CV_JP", {})),
                "korean": resolve_text(atlas.get("CV_KR", {})),
                "english": resolve_text(atlas.get("CV_EN", {})),
            },
            "stories": stories,
            "voicelines": [],
        }

        skills = _build_skills(skill_config, skill_ids, avatar_id)

        ranks = _build_ranks(rank_config, rank_ids, avatar_id)

        skill_trees = _build_skill_trees(tree_config, avatar_id)

        enhanced = _build_enhanced(
            enhanced_config, enhanced_hint, skill_config, rank_config, tree_config, avatar_id,
        )

        stats = _build_stats(promo_config, avatar_id)

        relics = _build_relics(relic_rec, avatar_id)

        lightcones = equip_by_id.get(avatar_id, [])

        char_data = {
            "name": name,
            "name_en": name_en,
            "chara_info": chara_info,
            "rarity": rarity,
            "avatar_vo_tag": avatar_vo_tag,
            "sp_need": sp_need,
            "base_type": base_type,
            "damage_type": damage_type,
            "ranks": ranks,
            "skills": skills,
            "skill_trees": skill_trees,
            "enhanced": enhanced,
            "memosprite": _build_memosprite(servant_config, servant_skill, avatar_id),
            "unique": {},
            "stats": stats,
            "relics": relics,
            "lightcones": lightcones,
            "teams": _build_teams(teams_by_avatar.get(avatar_id, [])),
            "skin": {},
        }

        save_json(char_data, output_dir / f"{avatar_id}.json")
        count += 1

    logger.info("已保存 %d 个角色详情到 %s", count, output_dir)
