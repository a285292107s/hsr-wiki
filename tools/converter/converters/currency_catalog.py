from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from season_delta import apply_season_new, mark_season_new
from season_scope import (
    apply_season_ids,
    season_meta,
    season_membership,
    season_registrations,
    verify_season_ids,
)
from textmap import clean_text, current_textmap, resolve_text, text_key_of, text_of_key
from textpack import composed_ref
from utils import load_json, save_json
from converters.currency import _build_prop_names

logger = logging.getLogger("converter.currency_catalog")

OUT_SUBDIR = "currency"

def trait_cat_base(tid: int) -> int:
    return tid // 100 if tid >= 100000 else tid

PACKAGE_SUFFIXES = {"invite": "邀请", "stock": "概念股", "badge": "星徽"}

def link_trait_packages(
    trait_names: dict[int, str],
    portal_titles: dict[int, str],
    augment_names: dict[int, str],
) -> dict[int, dict]:
    slots: dict[int, dict] = {
        tid: {"invite": None, "stock": None, "badge": None} for tid in trait_names
    }
    for tid, name in trait_names.items():
        if not name:
            continue
        for suffix_key, suffix in PACKAGE_SUFFIXES.items():
            pool = portal_titles if suffix_key != "badge" else augment_names
            for rid, label in pool.items():
                if label == f"{name}{suffix}":
                    slots[tid][suffix_key] = rid
    return slots

def _load_excel(name: str) -> list[dict]:
    return load_json(EXCEL_DIR / name)

def _load_optional(name: str) -> list[dict]:
    path = EXCEL_DIR / name
    return load_json(path) if path.exists() else []

def _build_index(data: list[dict], key: str = "ID") -> dict[Any, dict]:
    return {item[key]: item for item in data}

def _unwrap(v: Any, default: Any = None) -> Any:
    if v is None:
        return default
    if isinstance(v, dict) and "Value" in v:
        return v["Value"]
    return v

def _flatten_property_mods(lst: list | None, prop_names: dict[str, str] | None = None) -> list[dict]:
    if not lst:
        return []
    out = []
    for item in lst:
        if not isinstance(item, dict):
            continue
        typ = item.get("PropertyType", "")
        val = _unwrap(item.get("Value"), 0)
        node = {"name": typ, "property_type": typ, "value": val}
        if prop_names and typ in prop_names:
            node["prop_name"] = prop_names[typ]
        out.append(node)
    return out

def _convert_equipment(out_dir: Path, prop_names: dict[str, str] | None = None, season: dict | None = None) -> int:
    items_raw = _load_excel("GridFightItems.json")
    equip_raw = _load_excel("GridFightEquipment.json")
    cat_raw = _load_excel("GridFightEquipCategoryInfo.json")
    tag_raw = _load_excel("GridFightEquipTag.json")
    recommend_raw = _load_excel("GridFightEquipRecommendRole.json")
    consumable_raw = _load_excel("GridFightConsumables.json")
    forge_raw = _load_excel("GridFightForge.json")

    items_index = _build_index(items_raw)
    equip_index = _build_index(equip_raw)
    cat_index = _build_index(cat_raw, "EquipCategory")
    tag_index = _build_index(tag_raw, "TagID")
    recommend_index = _build_index(recommend_raw, "EquipID")
    consumable_index = _build_index(consumable_raw)
    forge_index = _build_index(forge_raw)

    out: list[dict] = []
    skipped_unnamed: list[int] = []
    for item in items_raw:
        iid = item["ID"]
        name = resolve_text(item.get("ItemName", {}))
        if not name:
            skipped_unnamed.append(iid)
            continue
        icon = item.get("IconPath", "")
        small_icon = item.get("SmallIconPath", "")
        priority = item.get("ItemPriority", 0)

        equip = equip_index.get(iid)
        category = ""
        category_name = ""
        tags: list[dict] = []
        props: list[dict] = []
        ability_name = ""

        if equip:
            category = equip.get("EquipCategory", "")
            cat_info = cat_index.get(category)
            if cat_info:
                category_name = resolve_text(cat_info.get("CategoryName", {}))
            ability_name = equip.get("AbilityName", "") or ""
            props = _flatten_property_mods(equip.get("GeneralPropertyList"), prop_names)
            for tag_id in (equip.get("EquipmentTagList") or []):
                tag_info = tag_index.get(tag_id)
                if tag_info:
                    tags.append({
                        "id": tag_id,
                        "desc": resolve_text(tag_info.get("EquipTagDesc", {})),
                    })

        recommend = recommend_index.get(iid)
        recommend_roles = recommend.get("RecommendRoleIDList", []) if recommend else []

        consumable = consumable_index.get(iid)
        forge = forge_index.get(iid)
        if consumable:
            desc = resolve_text(consumable.get("ConsumableDesc", {}))
        elif forge:
            desc = resolve_text(forge.get("ForgeDesc", {}))
        else:
            desc = ""

        out.append({
            "id": iid,
            "name": name,
            "icon": icon,
            "small_icon": small_icon,
            "priority": priority,
            "category": category,
            "category_name": category_name,
            "ability_name": ability_name,
            "desc": desc,
            "tags": tags,
            "props": props,
            "recommend_roles": recommend_roles,
        })

    if skipped_unnamed:
        logger.warning("  装备图鉴：过滤名称解析失败条目 %s（共 %d 条）", skipped_unnamed, len(skipped_unnamed))

    out.sort(key=lambda x: (x["category"], -x["priority"], x["id"]))

    save_json({"items": out, "season": season}, out_dir / "equipment.json")
    return len(out)

def _convert_portals(out_dir: Path, season: dict | None = None) -> int:
    raw = _load_excel("GridFightPortalBuff.json")

    out: list[dict] = []
    for entry in raw:
        pid = entry["ID"]
        title = resolve_text(entry.get("PortalBuffTitle", {}))
        desc = resolve_text(entry.get("PortalBuffDesc", {}))
        icon = entry.get("IconPath", "")
        in_book = entry.get("IfInBook", False)
        params = [_unwrap(p, 0) for p in (entry.get("EffectParamList") or [])]

        out.append({
            "id": pid,
            "title": title,
            "desc": desc,
            "icon": icon,
            "in_book": in_book,
            "params": params,
        })

    out.sort(key=lambda x: x["id"])

    apply_season_ids(
        out,
        season_membership(_load_optional("GridFightSeasonPortal.json"), "PortalID"),
        label="投资环境",
    )

    save_json({"portals": out, "season": season}, out_dir / "portals.json")
    return len(out)

_GRIDFIGHTINFO_RE = re.compile(r"<gridfightinfo\s+type=(\w+)\s+id=(\d+)\s*/?>")

def _build_name_indexes() -> tuple[dict[int, str], dict[int, str]]:
    items_raw = _load_excel("GridFightItems.json")
    item_keys: dict[int, str] = {}
    for item in items_raw:
        iid = item["ID"]
        key = text_key_of(item.get("ItemName", {}))
        if key:
            item_keys[iid] = key

    role_raw = _load_excel("GridFightRoleBasicInfo.json")
    avatar_raw = _load_excel("AvatarConfig.json")
    ld_path = EXCEL_DIR / "AvatarConfigLD.json"
    if ld_path.exists():
        avatar_raw = avatar_raw + load_json(ld_path)
    avatar_keys: dict[int, str] = {}
    for av in avatar_raw:
        aid = av.get("AvatarID")
        if aid:
            key = text_key_of(av.get("AvatarName", {}))
            if key:
                avatar_keys[aid] = key

    role_keys: dict[int, str] = {}
    for role in role_raw:
        rid = role["ID"]
        avatar_id = role.get("AvatarID", rid)
        key = avatar_keys.get(avatar_id)
        if key:
            role_keys[rid] = key

    return item_keys, role_keys

def _resolve_gridfightinfo(
    text: str,
    item_keys: dict[int, str],
    role_keys: dict[int, str],
    tm: Any,
) -> str:
    def _repl(m: re.Match) -> str:
        typ, sid = m.group(1), int(m.group(2))
        keys = item_keys if typ == "item" else role_keys if typ == "role" else None
        key = keys.get(sid) if keys else None
        return tm.get(key, "") if key else ""
    return _GRIDFIGHTINFO_RE.sub(_repl, text)

def _augment_desc(
    tm: Any,
    desc_key: str | None,
    item_keys: dict[int, str],
    role_keys: dict[int, str],
) -> str:
    text = tm.get(desc_key, "") if desc_key else ""
    text = _resolve_gridfightinfo(text, item_keys, role_keys, tm)
    return clean_text(text, dict(tm))

def _augment_desc_ref(
    entry: dict,
    item_keys: dict[int, str],
    role_keys: dict[int, str],
) -> Any:
    desc_key = text_key_of(entry.get("HexDesc", {}))
    composer = lambda tm, k=desc_key: _augment_desc(tm, k, item_keys, role_keys)  # noqa: E731
    return composed_ref(
        f"composed:cwaug:{desc_key or 'lit'}",
        composer,
        _augment_desc(current_textmap(), desc_key, item_keys, role_keys),
    )


def _convert_augments(out_dir: Path, season: dict | None = None) -> int:
    raw = _load_excel("GridFightAugment.json")
    item_keys, role_keys = _build_name_indexes()

    out: list[dict] = []
    for entry in raw:
        aid = entry["ID"]
        name = resolve_text(entry.get("HexName", {}))
        desc = _augment_desc_ref(entry, item_keys, role_keys)
        icon = entry.get("IconPath", "")
        mini_icon = entry.get("MiniIconPath", "")
        quality = entry.get("Quality", "")
        category_id = entry.get("CategoryID", 0)
        params = [_unwrap(p, 0) for p in (entry.get("EffectParamList") or [])]
        chapter_limit = list(entry.get("ChapterLimitList") or [])

        out.append({
            "id": aid,
            "name": name,
            "desc": desc,
            "icon": icon,
            "mini_icon": mini_icon,
            "quality": quality,
            "category_id": category_id,
            "params": params,
            "chapter_limit": chapter_limit,
        })

    out.sort(key=lambda x: (x["category_id"], x["id"]))

    apply_season_ids(
        out,
        season_membership(_load_optional("GridFightSeasonAugment.json"), "AugmentID"),
        label="投资策略",
    )

    save_json({"augments": out, "season": season}, out_dir / "augments.json")
    return len(out)

def _convert_traits(out_dir: Path, prop_names: dict[str, str] | None = None, season: dict | None = None) -> int:
    raw = _load_excel("GridFightTraitBasicInfo.json")
    layer_raw = _load_excel("GridFightTraitLayer.json")
    mazebuff_raw = _load_excel("GridFightTraitMazebuff.json")
    remark_raw = _load_excel("GridFightTraitRemark.json")
    trait_old_path = EXCEL_DIR / "GridFightTraitLayerOld.json"
    trait_old = _load_excel("GridFightTraitLayerOld.json") if trait_old_path.exists() else []
    mazebuff_index = _build_index(mazebuff_raw)

    layer_by_trait: dict[int, list[dict]] = {}
    for entry in layer_raw:
        tid = entry.get("TraitID")
        if tid is None:
            continue
        desc = resolve_text(entry.get("PropertyDesc", {}))
        params = [_unwrap(p, 0) for p in (entry.get("PropertyParamList") or [])]
        member_props = _flatten_property_mods(entry.get("TraitMemberPropertyList"), prop_names)
        all_props = _flatten_property_mods(entry.get("AllMemberPropertyList"), prop_names)
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
        layer_by_trait.setdefault(tid, []).append(node)
    for tid in layer_by_trait:
        layer_by_trait[tid].sort(key=lambda x: x["layer"])

    remark_by_trait: dict[int, list[dict]] = {}
    for entry in remark_raw:
        tid = entry.get("ID")
        if tid is None:
            continue
        remark_desc = resolve_text(entry.get("TraitRemark", {}))
        remark_simple = resolve_text(entry.get("TraitSimpleRemark", {}))
        remark_params = [_unwrap(p, 0) for p in (entry.get("TraitRemarkParamList") or [])]
        node = {
            "desc": remark_desc,
            "simple_desc": remark_simple,
            "params": remark_params,
            "text_order": entry.get("TextOrder", 0),
        }
        remark_by_trait.setdefault(tid, []).append(node)
    for tid in remark_by_trait:
        remark_by_trait[tid].sort(key=lambda x: x.get("text_order", 0))

    out: list[dict] = []
    trait_names_by_id: dict[int, str] = {}
    for entry in raw:
        tid = entry["ID"]
        name = resolve_text(entry.get("TraitName", {}))
        trait_names_by_id[tid] = text_of_key(text_key_of(entry.get("TraitName", {})))
        desc = resolve_text(entry.get("TraitBaseDesc", {}))
        simple_desc = resolve_text(entry.get("TraitBaseSimpleDesc", {}))
        icon = entry.get("IconPath", "")
        mini_icon = entry.get("MiniIconPath", "")
        activation_type = entry.get("ActivationType", "")
        base_params = [_unwrap(p, 0) for p in (entry.get("BaseDescParamList") or [])]
        season_id = entry.get("SeasonID", 0)
        sort_priority = entry.get("TraitSortPriority", 0)

        if 1000 <= trait_cat_base(tid) < 2000:
            cat = "faction"
        elif 2000 <= trait_cat_base(tid) < 3000:
            cat = "combat"
        else:
            cat = "special"

        out.append({
            "id": tid,
            "name": name,
            "desc": desc,
            "simple_desc": simple_desc,
            "icon": icon,
            "mini_icon": mini_icon,
            "activation_type": activation_type,
            "cat": cat,
            "base_params": base_params,
            "season_id": season_id,
            "sort_priority": sort_priority,
            "layers": layer_by_trait.get(tid, []),
            "remarks": remark_by_trait.get(tid, []),
        })

    n_season_new = apply_season_new(
        out,
        mark_season_new([e["id"] for e in out], trait_old, id_key="TraitID",
                        label="GridFightTraitLayerOld 羁绊名册"),
        season_field="season_id",
        current_season=(season or {}).get("id"),
    )
    logger.info("  赛季新增羁绊: %d 个", n_season_new)

    current_sid = (season or {}).get("id")
    portal_membership = season_membership(_load_optional("GridFightSeasonPortal.json"), "PortalID")
    augment_membership = season_membership(_load_optional("GridFightSeasonAugment.json"), "AugmentID")
    season_portal_titles = {
        row["ID"]: text_of_key(text_key_of(row.get("PortalBuffTitle", {})))
        for row in _load_excel("GridFightPortalBuff.json")
        if portal_membership.get(row["ID"]) == current_sid
    }
    season_augment_names = {
        row["ID"]: text_of_key(text_key_of(row.get("HexName", {})))
        for row in _load_excel("GridFightAugment.json")
        if augment_membership.get(row["ID"]) == current_sid
    }
    packages = link_trait_packages(
        {e["id"]: trait_names_by_id.get(e["id"], "") for e in out if e["season_id"] == current_sid},
        season_portal_titles,
        season_augment_names,
    )
    for entry in out:
        entry["package"] = packages.get(entry["id"], {"invite": None, "stock": None, "badge": None})
    n_complete = sum(1 for slot in packages.values() if all(slot.values()))
    logger.info(
        "  羁绊四件套：%d 个完整 / %d 个带部分件（邀请门 %d · 概念股 %d · 星徽 %d）",
        n_complete,
        sum(1 for slot in packages.values() if any(slot.values())) - n_complete,
        sum(1 for slot in packages.values() if slot["invite"] is not None),
        sum(1 for slot in packages.values() if slot["stock"] is not None),
        sum(1 for slot in packages.values() if slot["badge"] is not None),
    )

    verify_season_ids(
        out,
        season_registrations(_load_optional("GridFightSeasonTraitShow.json"), "TraitID"),
        label="羁绊",
    )

    out.sort(key=lambda x: x["sort_priority"])

    save_json({"traits": out, "season": season, "season_new_count": n_season_new}, out_dir / "traits.json")
    return len(out)

def convert() -> None:
    logger.info("--- 货币战争图鉴数据 (currency_catalog) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    out_dir.mkdir(parents=True, exist_ok=True)

    prop_names = _build_prop_names(_load_excel("GridFightRolePropertyConfig.json"))

    season = season_meta(_load_optional("GridFightSeasonModule.json"))
    logger.info("  当前赛季：%s（子赛季 %s）", season["id"], season["sub_season_ids"])

    n_equip = _convert_equipment(out_dir, prop_names, season)
    logger.info("  装备图鉴: %d 条", n_equip)

    n_portal = _convert_portals(out_dir, season)
    logger.info("  投资环境: %d 条", n_portal)

    n_augment = _convert_augments(out_dir, season)
    logger.info("  投资策略: %d 条", n_augment)

    n_trait = _convert_traits(out_dir, prop_names, season)
    logger.info("  羁绊图鉴: %d 条", n_trait)

    logger.info("货币战争图鉴数据完成")

if __name__ == "__main__":
    from textmap import load_textmap
    load_textmap()
    convert()
