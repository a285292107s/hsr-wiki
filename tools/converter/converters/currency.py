from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from enum_labels import resolve as resolve_label
from enum_labels import trailblazer_name_ref
from season_delta import apply_season_new, mark_season_new
from textmap import resolve_text
from utils import load_json, save_json

logger = logging.getLogger("converter.currency")

OUT_SUBDIR = "currency"

def _trait_cat(tid: int) -> str:
    if 1000 <= tid < 2000:
        return "faction"
    if 2000 <= tid < 3000:
        return "combat"
    return "special"

def _season_ids(role: dict) -> list[int]:
    ids = list(role.get("SeasonIDList") or [])
    if not ids and role.get("SeasonID") is not None:
        ids = [role["SeasonID"]]
    return ids

def _index_gender_override(data: list[dict]) -> dict[int, int]:
    out: dict[int, int] = {}
    for entry in data:
        rid = entry.get("RoleID")
        aid = entry.get("AvatarID")
        if rid is not None and aid is not None and rid not in out:
            out[rid] = aid
    return out

def _load_excel(name: str) -> list[dict]:
    return load_json(EXCEL_DIR / name)

def _build_index(data: list[dict], key: str = "ID") -> dict[Any, dict]:
    return {item[key]: item for item in data}

def _index_avatar_skills(data: list[dict]) -> dict[int, dict]:
    out: dict[int, dict] = {}
    for entry in data:
        sid = entry.get("SkillID")
        if sid is None:
            continue
        current = out.get(sid)
        if current is None or entry.get("Level", 0) < current.get("Level", 0):
            out[sid] = entry
    return out

def _avatar_skill_id(skill_id: int, avatar_id: int) -> int | None:
    s = str(skill_id)
    for prefix in (f"1{avatar_id}", str(avatar_id)):
        tail = s[len(prefix):]
        if s.startswith(prefix) and len(tail) == 4:
            return avatar_id * 100 + int(tail[:2])
    return None

def _fallback_skill_text(
    skill_id: int,
    name: str,
    simple_desc: str,
    base_skills: dict[int, dict] | None,
    avatar_id: int | None,
) -> tuple[str, str]:
    if not base_skills or avatar_id is None or (name and simple_desc):
        return name, simple_desc
    base_skill_id = _avatar_skill_id(skill_id, avatar_id)
    base = base_skills.get(base_skill_id) if base_skill_id is not None else None
    if base is None:
        return name, simple_desc
    return (
        name or resolve_text(base.get("SkillName", {})),
        simple_desc or resolve_text(base.get("SimpleSkillDesc", {})),
    )

def _unwrap(v: Any, default: Any = None) -> Any:
    if v is None:
        return default
    if isinstance(v, dict) and "Value" in v:
        return v["Value"]
    return v

def _flatten_stance_list(lst: list | None) -> list[int]:
    if not lst:
        return []
    out = []
    for item in lst:
        out.append(_unwrap(item, 0))
    return out

def _build_prop_names(data: list[dict]) -> dict[str, str]:
    out: dict[str, str] = {}
    for e in data:
        t = e.get("PropertyType")
        if not t:
            continue
        name = resolve_text(e.get("PropertyName", {}))
        if name:
            out[t] = name
    return out

def _build_prop_icons(data: list[dict]) -> dict[str, str]:
    out: dict[str, str] = {}
    for e in data:
        t = e.get("PropertyType")
        icon = e.get("IconPath", "")
        if t and icon:
            out[t] = icon
    return out

def _flatten_property_mods(lst: list | None, prop_names: dict[str, str] | None = None,
                            prop_icons: dict[str, str] | None = None) -> list[dict]:
    if not lst:
        return []
    out = []
    for item in lst:
        if not isinstance(item, dict):
            continue
        typ = item.get("PropertyType", "")
        val = _unwrap(item.get("Value"), 0)
        node = {
            "name": typ,
            "property_type": typ,
            "value": val,
        }
        if prop_names and typ in prop_names:
            node["prop_name"] = prop_names[typ]
        if prop_icons and typ in prop_icons:
            node["icon"] = prop_icons[typ]
        out.append(node)
    return out

def _index_trait_layers(data: list[dict], mazebuff_index: dict[int, dict] | None = None,
                        prop_names: dict[str, str] | None = None,
                        prop_icons: dict[str, str] | None = None) -> dict[int, list[dict]]:
    if mazebuff_index is None:
        mazebuff_index = {}
    out: dict[int, list[dict]] = {}
    for entry in data:
        tid = entry.get("TraitID")
        if tid is None:
            continue
        desc = resolve_text(entry.get("PropertyDesc", {}))
        params = [_unwrap(p, 0) for p in (entry.get("PropertyParamList") or [])]
        member_props = _flatten_property_mods(entry.get("TraitMemberPropertyList"), prop_names, prop_icons)
        all_props = _flatten_property_mods(entry.get("AllMemberPropertyList"), prop_names, prop_icons)
        buff_desc = ""
        buff_params: list = []
        mb_id = entry.get("MazebuffID")
        mb = mazebuff_index.get(mb_id) if mb_id else None
        if mb:
            mb_desc = resolve_text(mb.get("BuffDesc") or mb.get("BuffSimpleDesc", {}))
            mb_params = [_unwrap(p, 0) for p in (mb.get("ParamList") or [])]
            if not desc and not member_props and not all_props:
                desc = mb_desc
                params = mb_params
            elif mb_desc and mb_desc != desc:
                buff_desc = mb_desc
                buff_params = mb_params
        node = {
            "layer": entry.get("Layer", 0),
            "quality": entry.get("Quality") or None,
            "desc": desc,
            "params": params,
            "member_props": member_props,
            "all_props": all_props,
        }
        if buff_desc:
            node["buff_desc"] = buff_desc
            node["buff_params"] = buff_params
        out.setdefault(tid, []).append(node)
    for tid in out:
        out[tid].sort(key=lambda x: x["layer"])
    return out

def _index_equipment(data: list[dict]) -> dict[int, list[dict]]:
    out: dict[int, list[dict]] = {}
    for entry in data:
        rid = entry.get("RoleID")
        if rid is None:
            continue
        out.setdefault(rid, []).append(entry)
    for rid in out:
        out[rid].sort(key=lambda x: x.get("Level", 0))
    return out

def _index_recommend(data: list[dict], items_index: dict[int, dict] | None = None) -> dict[int, dict]:
    items_index = items_index or {}

    def _equip(eid: int) -> dict:
        it = items_index.get(eid)
        if it is None:
            return {"id": eid, "name": "", "icon": ""}
        return {
            "id": eid,
            "name": resolve_text(it.get("ItemName", {})),
            "icon": it.get("IconPath", "") or "",
        }

    out: dict[int, dict] = {}
    for entry in data:
        rid = entry.get("RoleID")
        if rid is None:
            continue
        fb = str(entry.get("FrontBackType", "")).lower()
        node = out.setdefault(rid, {})
        node[fb] = {
            "first": [_equip(e) for e in (entry.get("FirstRecommendEquipList") or [])],
            "second": [_equip(e) for e in (entry.get("SecondRecommendEquipList") or [])],
        }
    return out

def _index_servant_star(data: list[dict]) -> dict[tuple[int, int], dict]:
    out: dict[tuple[int, int], dict] = {}
    for entry in data:
        rid = entry.get("ID")
        star = entry.get("Star")
        if rid is None or star is None:
            continue
        out[(rid, star)] = entry
    return out

def convert() -> None:
    logger.info("--- 货币战争角色数据 (currency) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    detail_dir = out_dir / "role"
    out_dir.mkdir(parents=True, exist_ok=True)
    detail_dir.mkdir(parents=True, exist_ok=True)

    role_list_raw = _load_excel("GridFightRoleBasicInfo.json")
    avatar_config = _load_excel("AvatarConfig.json")
    avatar_ld = _load_excel("AvatarConfigLD.json") if (EXCEL_DIR / "AvatarConfigLD.json").exists() else []
    avatar_skill_raw = _load_excel("AvatarSkillConfig.json")
    if (EXCEL_DIR / "AvatarSkillConfigLD.json").exists():
        avatar_skill_raw = avatar_skill_raw + _load_excel("AvatarSkillConfigLD.json")
    avatar_skill_index = _index_avatar_skills(avatar_skill_raw)
    trait_data = _build_index(_load_excel("GridFightTraitBasicInfo.json"), "ID")
    star_data = _load_excel("GridFightRoleStar.json")
    front_skills = _build_index(_load_excel("GridFightFrontSkill.json"), "SkillID")
    back_skills = _build_index(_load_excel("GridFightBackBESkillConfig.json"), "SkillID")

    gender_override = _index_gender_override(_load_excel("GridFightGenderOverride.json"))
    prop_table = _load_excel("GridFightRolePropertyConfig.json")
    prop_names = _build_prop_names(prop_table)
    prop_icons = _build_prop_icons(prop_table)
    trait_mazebuff_index = _build_index(_load_excel("GridFightTraitMazebuff.json"), "ID")
    trait_layers = _index_trait_layers(_load_excel("GridFightTraitLayer.json"), trait_mazebuff_index, prop_names, prop_icons)
    rank_index = _build_index(_load_excel("GridFightBackRoleRank.json"), "RankID")
    equip_by_role = _index_equipment(_load_excel("GridFightBackEquipment.json"))
    items_index = _build_index(_load_excel("GridFightItems.json"), "ID")
    recommend_by_role = _index_recommend(_load_excel("GridFightRoleRecommendEquip.json"), items_index)
    servant_star_index = _index_servant_star(_load_excel("GridFightServantStar.json"))
    servant_skills = _build_index(_load_excel("GridFightServantSkill.json"), "SkillID")
    skill_extra = _build_index(_load_excel("GridFightBackSkillExtraDesc.json"), "SkillID")

    role_old_path = EXCEL_DIR / "GridFightRoleBasicInfoOld.json"
    role_old = _load_excel("GridFightRoleBasicInfoOld.json") if role_old_path.exists() else []
    current_avatar_ids = [
        role_raw.get("AvatarID", role_raw["ID"]) for role_raw in role_list_raw if role_raw.get("IsInBook")
    ]
    season_new_by_avatar = mark_season_new(
        current_avatar_ids, role_old, id_key="AvatarID", label="GridFightRoleBasicInfoOld 角色名册"
    )

    name_map: dict[int, str] = {}
    for cfg in avatar_config + avatar_ld:
        aid = cfg.get("AvatarID", 0)
        if not aid:
            continue
        name = resolve_text(cfg.get("AvatarName", {}))
        path_key = cfg.get("AvatarBaseType", "")
        if name == "开拓者" and path_key:
            from config import PATH_NAME_FALLBACK
            name = trailblazer_name_ref(path_key, PATH_NAME_FALLBACK.get(path_key, path_key))
        if name:
            name_map[aid] = name

    star_by_role: dict[int, list[dict]] = {}
    for entry in star_data:
        rid = entry.get("ID")
        if rid is None:
            continue
        star_by_role.setdefault(rid, []).append(entry)

    roles_out: list[dict] = []

    for role_raw in role_list_raw:
        if not role_raw.get("IsInBook"):
            continue
        rid = role_raw["ID"]
        avatar_id = role_raw.get("AvatarID", rid)
        name = name_map.get(avatar_id, f"角色 {avatar_id}")

        trait_ids = [int(t) for t in (role_raw.get("TraitList") or [])]

        traits_summary: list[dict] = []
        for tid in trait_ids:
            tr = trait_data.get(tid)
            if tr is None:
                continue
            traits_summary.append({
                "id": tid,
                "name": resolve_text(tr.get("TraitName", {})),
                "cat": _trait_cat(tid),
            })

        base = {
            "id": rid,
            "avatar_id": avatar_id,
            "name": name,
            "rarity": role_raw.get("Rarity", 0),
            "front_back_type": role_raw.get("FrontBackType") or "Both",
            "heal_or_shield_display": role_raw.get("HealOrShieldDisplay"),
            "charge_type": list(role_raw.get("ChargeType") or []),
            "max_sp_icon": role_raw.get("MaxSPIcon", ""),
            "is_expert": bool(role_raw.get("IsExpert", False)),
            "trait_list": trait_ids,
            "traits": traits_summary,
            "equipment_id": role_raw.get("EquipmentID"),
            "special_avatar_id": role_raw.get("SpecialAvatarID"),
            "season_ids": _season_ids(role_raw),
            "female_avatar_id": gender_override.get(rid),
        }

        roles_out.append(base)

        traits_out: list[dict] = []
        for tid in base["trait_list"]:
            tr = trait_data.get(tid)
            if tr is None:
                continue
            trait_name = resolve_text(tr.get("TraitName", {}))
            trait_desc = resolve_text(tr.get("TraitBaseDesc", {}))
            trait_simple = resolve_text(tr.get("TraitBaseSimpleDesc", {}))
            base_params = [_unwrap(p, 0) for p in (tr.get("BaseDescParamList") or [])]

            traits_out.append({
                "id": tid,
                "name": trait_name,
                "activation_type": tr.get("ActivationType"),
                "icon": tr.get("IconPath", ""),
                "desc": trait_desc,
                "simple_desc": trait_simple,
                "desc_params": base_params,
                "effect_list": tr.get("TraitEffectList") or [],
                "layers": trait_layers.get(tid, []),
            })

        ranks_out: list[dict] = []
        for rank_id in (role_raw.get("BackendRankList") or []):
            rk = rank_index.get(rank_id)
            if rk is None:
                continue
            ranks_out.append({
                "rank_id": rank_id,
                "rank": rk.get("Rank", 0),
                "name": resolve_text(rk.get("Name", {})),
                "desc": resolve_text(rk.get("Desc", {})),
                "icon": rk.get("IconPath", ""),
                "owner_props": _flatten_property_mods(rk.get("OwnerGeneralPropertyList"), prop_names, prop_icons),
                "all_props": _flatten_property_mods(rk.get("AllMemberGeneralPropertyList"), prop_names, prop_icons),
                "param_list": [_unwrap(p, 0) for p in (rk.get("DescParamList") or [])],
                "modify_skill_list": rk.get("ModifySkillList") or [],
                "modify_energy_bar": _unwrap(rk.get("ModifyEnergyBar"), None),
                "rank_ability": rk.get("RankAbility") or [],
            })

        equipment_out: list[dict] = []
        equip_id = role_raw.get("EquipmentID")
        if equip_id:
            for lv_entry in equip_by_role.get(rid, []):
                equipment_out.append({
                    "equipment_id": equip_id,
                    "level": lv_entry.get("Level", 0),
                    "desc": resolve_text(lv_entry.get("BackEquipmentDesc", {})),
                    "param_list": [_unwrap(p, 0) for p in (lv_entry.get("ParamList") or [])],
                    "param_format": lv_entry.get("ParamFormat", "") or "",
                    "owner_props": _flatten_property_mods(lv_entry.get("OwnerGeneralPropertyList"), prop_names, prop_icons),
                    "all_props": _flatten_property_mods(lv_entry.get("AllMemberGeneralPropertyList"), prop_names, prop_icons),
                })

        recommend_out = recommend_by_role.get(rid)

        role_stars = star_by_role.get(rid, [])
        stars_out: dict[str, dict] = {}

        for star_entry in role_stars:
            skey = str(star_entry["Star"])

            front_skill_ids: list[int] = star_entry.get("FrontShowSkillIDList") or []
            be_skill_ids: list[int] = star_entry.get("BESkillIDList") or []
            back_show_ids: list[int] = star_entry.get("BackShowSkillIDList") or []

            front_skills_out = [
                _build_skill(sid, front_skills, {}, skill_extra, avatar_skill_index, avatar_id)
                for sid in front_skill_ids
            ]
            back_skills_out = [
                _build_skill(sid, back_skills, {}, skill_extra, avatar_skill_index, avatar_id)
                for sid in be_skill_ids
            ]
            back_show_out = [
                _build_skill(sid, back_skills, {}, skill_extra, avatar_skill_index, avatar_id)
                for sid in back_show_ids
            ]
            seen_ids = {sk["id"] for sk in back_skills_out}
            for bsk in back_show_out:
                if bsk["id"] not in seen_ids:
                    back_skills_out.append(bsk)
                    seen_ids.add(bsk["id"])

            servant_skills_out: list[dict] = []
            servant_node: dict | None = None
            sv_key = (rid, star_entry["Star"])
            sv_entry = servant_star_index.get(sv_key)
            if sv_entry:
                servant_node = {
                    "hp_base": sv_entry.get("HPBase", "0"),
                    "hp_inherit": sv_entry.get("HPInherit", "0"),
                    "hp_skill": sv_entry.get("HPSkill"),
                    "speed_base": sv_entry.get("SpeedBase", "0"),
                    "speed_inherit": sv_entry.get("SpeedInherit", "0"),
                    "speed_skill": sv_entry.get("SpeedSkill"),
                }
                for sid in (sv_entry.get("ServantShowSkiilIDList") or []):
                    servant_skills_out.append(
                        _build_skill(sid, servant_skills, {}, skill_extra, avatar_skill_index, avatar_id)
                    )

            star_node = {
                "star": star_entry["Star"],
                "front_one_word_desc": resolve_text(star_entry.get("FrontOneWordDesc", {})),
                "back_one_word_desc": resolve_text(star_entry.get("BackOneWordDesc", {})),
                "front_power_base": _unwrap(star_entry.get("FrontPowerBase")),
                "back_power_base": _unwrap(star_entry.get("BackPowerBase")),
                "back_speed_rewrite": None,
                "back_speed_added_ratio": None,
                "back_energy_bar": _unwrap(star_entry.get("BackEnergyBar")),
                "back_max_sp": _unwrap(star_entry.get("BackMaxSP")),
                "back_initial_sp": _unwrap(star_entry.get("BackInitialSP")),
                "back_initial_energy_bar": _unwrap(star_entry.get("BackInitialEnergyBar")),
                "luck_chance": _unwrap(star_entry.get("LuckChance")),
                "luck_damage": _unwrap(star_entry.get("LuckDamage")),
                "extra_heal_base": _unwrap(star_entry.get("ExtraHealBase")),
                "extra_shield_base": _unwrap(star_entry.get("ExtraShieldBase")),
                "stance_damage_display": _unwrap(star_entry.get("StanceDamageDisplay")),
                "show_stance_list": _flatten_stance_list(star_entry.get("ShowStanceList")),
                "recommend": recommend_out,
                "front_show_skill": front_skills_out,
                "back_show_skill": back_skills_out,
                "servant_show_skill": servant_skills_out,
                "servant": servant_node,
                "general_property_modify_list": _flatten_property_mods(
                    star_entry.get("GeneralPropertyModifyList"), prop_names, prop_icons
                ),
            }
            stars_out[skey] = star_node

        detail = {
            "id": base["id"],
            "avatar_id": base["avatar_id"],
            "name": base["name"],
            "rarity": base["rarity"],
            "front_back_type": base["front_back_type"],
            "heal_or_shield_display": base["heal_or_shield_display"],
            "charge_type": base["charge_type"],
            "max_sp_icon": base["max_sp_icon"],
            "is_expert": base["is_expert"],
            "trait_list": base["trait_list"],
            "traits": traits_out,
            "stars": stars_out,
            "rank": ranks_out,
            "equipment": equipment_out,
            "special_avatar_id": base["special_avatar_id"],
            "season_ids": base["season_ids"],
            "female_avatar_id": base["female_avatar_id"],
        }

        save_json(detail, detail_dir / f"{rid}.json")

    n_season_new = apply_season_new(roles_out, season_new_by_avatar, id_field="avatar_id")
    logger.info("赛季新增角色：%d 位", n_season_new)

    list_out = {"roles": roles_out}
    save_json(list_out, out_dir / "role.json")

    save_json(prop_icons, out_dir / "prop_icons.json")

    logger.info("货币战争角色数据完成：%d 个角色", len(roles_out))

def _build_skill(
    sid: int,
    skill_index: dict[int, dict],
    overrides: dict[str, Any] | None = None,
    extra_index: dict[int, dict] | None = None,
    base_skills: dict[int, dict] | None = None,
    avatar_id: int | None = None,
) -> dict:
    sk = skill_index.get(sid)
    if sk is None:
        name, simple_desc = _fallback_skill_text(sid, "", "", base_skills, avatar_id)
        return {"id": sid, "name": name, "desc": "", "simple_desc": simple_desc, "tag": None,
                "icon": "",
                "type": None, "sp_base": None, "bp_need": None, "bp_add": None,
                "show_stance_list": [], "stance_damage_type": None, "stance_damage_display": None,
                "extra": {}, "level": {}}

    name = resolve_text(sk.get("SkillName", {}))
    tag = resolve_text(sk.get("SkillTag", {}))
    type_desc = resolve_text(sk.get("SkillTypeDesc", {}))
    desc = resolve_text(sk.get("SkillDesc", {}))
    simple_desc = resolve_text(sk.get("SimpleSkillDesc", {}))
    name, simple_desc = _fallback_skill_text(sid, name, simple_desc, base_skills, avatar_id)

    sp_base = _unwrap(sk.get("SPBase"))
    sp_need = _unwrap(sk.get("SPNeed"), None)
    bp_need = _unwrap(sk.get("BPNeed"))
    bp_add = _unwrap(sk.get("BPAdd"))
    stance_list = _flatten_stance_list(sk.get("ShowStanceList"))
    stance_damage_type = sk.get("StanceDamageType") or None
    stance_damage_display = _unwrap(sk.get("StanceDamageDisplay"), None)
    pl = [_unwrap(p, 0) for p in (sk.get("ParamList") or [])]

    extra: dict[str, Any] = {}
    if extra_index:
        ex = extra_index.get(sid)
        if ex:
            ex_desc = resolve_text(ex.get("ConditionDesc", {}))
            ex_simple = resolve_text(ex.get("ConditionSimpleDesc", {}))
            if ex_desc or ex_simple:
                extra = {
                    "condition": {
                        "name": resolve_label("ui_label", "conditionTrigger", "触发条件"),
                        "desc": ex_desc or ex_simple,
                        "param": [_unwrap(p, 0) for p in (ex.get("ParamList") or [])],
                    }
                }

    result = {
        "id": sid,
        "name": name,
        "desc": desc,
        "simple_desc": simple_desc,
        "icon": sk.get("SkillIcon", "") or "",
        "type": type_desc or None,
        "tag": tag or None,
        "sp_base": sp_base,
        "sp_need": sp_need,
        "bp_need": bp_need,
        "bp_add": bp_add,
        "show_stance_list": stance_list,
        "stance_damage_type": stance_damage_type,
        "stance_damage_display": stance_damage_display,
        "skill_combo_value_delta": None,
        "extra": extra,
        "level": {
            "1": {"level": 1, "param_list": pl},
        },
    }
    if overrides:
        result.update(overrides)
    return result

if __name__ == "__main__":
    convert()
