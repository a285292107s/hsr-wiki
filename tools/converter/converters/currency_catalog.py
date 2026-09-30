"""货币战争 · 装备/环境/策略/羁绊图鉴转换器

完整表→字段→输出映射见 docs/data/转换器字段映射.md（currency_catalog 段）。
数据来自 vendor/TurnBasedGameData/ExcelOutput/；文本经 TextMap 解析为中文。
输出：public/data/cn/currency/{equipment,portals,augments,traits}.json。
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from season_delta import apply_season_new, mark_season_new
from textmap import resolve_text, clean_text
from utils import load_json, save_json
from converters.currency import _build_prop_names

logger = logging.getLogger("converter.currency_catalog")

OUT_SUBDIR = "currency"

def _load_excel(name: str) -> list[dict]:
    return load_json(EXCEL_DIR / name)

def _build_index(data: list[dict], key: str = "ID") -> dict[Any, dict]:
    return {item[key]: item for item in data}

def _unwrap(v: Any, default: Any = None) -> Any:
    if v is None:
        return default
    if isinstance(v, dict) and "Value" in v:
        return v["Value"]
    return v

def _flatten_property_mods(lst: list | None, prop_names: dict[str, str] | None = None) -> list[dict]:
    """将 [{PropertyType: ..., Value: {Value: ...}}, ...] → 标准化列表。

    prop_names 提供 PropertyType → 官方名（TextMap）时，额外输出 prop_name 字段；
    未收录的属性类型不输出，由前端映射表兜底。
    """
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

def _convert_equipment(out_dir: Path, prop_names: dict[str, str] | None = None) -> int:
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

    save_json({"items": out}, out_dir / "equipment.json")
    return len(out)

def _convert_portals(out_dir: Path) -> int:
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

    save_json({"portals": out}, out_dir / "portals.json")
    return len(out)

_GRIDFIGHTINFO_RE = re.compile(r"<gridfightinfo\s+type=(\w+)\s+id=(\d+)\s*/?>")

def _build_name_indexes() -> tuple[dict[int, str], dict[int, str]]:
    """构建物品名称索引和角色名称索引，用于解析 <gridfightinfo> 标签。

    Returns:
        (item_names, role_names): ID → 名称 映射
    """
    items_raw = _load_excel("GridFightItems.json")
    item_names: dict[int, str] = {}
    for item in items_raw:
        iid = item["ID"]
        name = resolve_text(item.get("ItemName", {}))
        if name:
            item_names[iid] = name

    role_raw = _load_excel("GridFightRoleBasicInfo.json")
    avatar_raw = _load_excel("AvatarConfig.json")
    ld_path = EXCEL_DIR / "AvatarConfigLD.json"
    if ld_path.exists():
        avatar_raw = avatar_raw + load_json(ld_path)
    avatar_names: dict[int, str] = {}
    for av in avatar_raw:
        aid = av.get("AvatarID")
        if aid:
            name = resolve_text(av.get("AvatarName", {}))
            if name:
                avatar_names[aid] = name

    role_names: dict[int, str] = {}
    for role in role_raw:
        rid = role["ID"]
        avatar_id = role.get("AvatarID", rid)
        name = avatar_names.get(avatar_id, "")
        if name:
            role_names[rid] = name

    return item_names, role_names

def _resolve_gridfightinfo(
    text: str,
    item_names: dict[int, str],
    role_names: dict[int, str],
) -> str:
    """将 <gridfightinfo type=item|role id=N> 标签替换为实际名称。"""
    def _repl(m: re.Match) -> str:
        typ, sid = m.group(1), int(m.group(2))
        if typ == "item":
            return item_names.get(sid, "")
        if typ == "role":
            return role_names.get(sid, "")
        return ""
    return _GRIDFIGHTINFO_RE.sub(_repl, text)

def _convert_augments(out_dir: Path) -> int:
    raw = _load_excel("GridFightAugment.json")
    item_names, role_names = _build_name_indexes()

    out: list[dict] = []
    for entry in raw:
        aid = entry["ID"]
        name = resolve_text(entry.get("HexName", {}))
        raw_desc = resolve_text(entry.get("HexDesc", {}), clean=False)
        raw_desc = _resolve_gridfightinfo(raw_desc, item_names, role_names)
        desc = clean_text(raw_desc)
        icon = entry.get("IconPath", "")
        mini_icon = entry.get("MiniIconPath", "")
        quality = entry.get("Quality", "")
        category_id = entry.get("CategoryID", 0)
        params = [_unwrap(p, 0) for p in (entry.get("DescParamList") or [])]
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

    save_json({"augments": out}, out_dir / "augments.json")
    return len(out)

def _convert_traits(out_dir: Path, prop_names: dict[str, str] | None = None) -> int:
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
    for entry in raw:
        tid = entry["ID"]
        name = resolve_text(entry.get("TraitName", {}))
        desc = resolve_text(entry.get("TraitBaseDesc", {}))
        simple_desc = resolve_text(entry.get("TraitBaseSimpleDesc", {}))
        icon = entry.get("IconPath", "")
        mini_icon = entry.get("MiniIconPath", "")
        activation_type = entry.get("ActivationType", "")
        base_params = [_unwrap(p, 0) for p in (entry.get("BaseDescParamList") or [])]
        season_id = entry.get("SeasonID", 0)
        sort_priority = entry.get("TraitSortPriority", 0)

        if 1000 <= tid < 2000:
            cat = "faction"
        elif 2000 <= tid < 3000:
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
    )
    logger.info("  赛季新增羁绊: %d 个", n_season_new)

    out.sort(key=lambda x: x["sort_priority"])

    save_json({"traits": out}, out_dir / "traits.json")
    return len(out)

def convert() -> None:
    logger.info("--- 货币战争图鉴数据 (currency_catalog) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    out_dir.mkdir(parents=True, exist_ok=True)

    prop_names = _build_prop_names(_load_excel("GridFightRolePropertyConfig.json"))

    n_equip = _convert_equipment(out_dir, prop_names)
    logger.info("  装备图鉴: %d 条", n_equip)

    n_portal = _convert_portals(out_dir)
    logger.info("  投资环境: %d 条", n_portal)

    n_augment = _convert_augments(out_dir)
    logger.info("  投资策略: %d 条", n_augment)

    n_trait = _convert_traits(out_dir, prop_names)
    logger.info("  羁绊图鉴: %d 条", n_trait)

    logger.info("货币战争图鉴数据完成")

if __name__ == "__main__":
    from textmap import load_textmap
    load_textmap()
    convert()
