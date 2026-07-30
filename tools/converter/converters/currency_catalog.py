"""货币战争 · 装备/环境/策略/羁绊图鉴转换器

数据来源（vendor/TurnBasedGameData/ExcelOutput/）：
  - GridFightItems.json              → 装备名称/图标
  - GridFightEquipment.json          → 装备功能数据（分类/属性/标签）
  - GridFightEquipCategoryInfo.json  → 装备分类名称
  - GridFightEquipTag.json           → 装备标签描述
  - GridFightEquipRecommendRole.json → 装备推荐角色
  - GridFightPortalBuff.json         → 投资环境（Portal Buff）
  - GridFightAugment.json            → 投资策略（Augment）
  - GridFightTraitBasicInfo.json     → 羁绊基础信息
  - GridFightTraitLayer.json         → 羁绊层级效果
  - GridFightTraitMazebuff.json      → 羁绊层级回退描述
  - TextMap/TextMapCHS.json          → 中文文本映射

输出：
  - public/data/cn/currency/equipment.json
  - public/data/cn/currency/portals.json
  - public/data/cn/currency/augments.json
  - public/data/cn/currency/traits.json
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json

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


def _flatten_property_mods(lst: list | None) -> list[dict]:
    if not lst:
        return []
    out = []
    for item in lst:
        if not isinstance(item, dict):
            continue
        typ = item.get("PropertyType", "")
        val = _unwrap(item.get("Value"), 0)
        out.append({"name": typ, "property_type": typ, "value": val})
    return out


# ─────────────────────────────────────────────
# 装备图鉴
# ─────────────────────────────────────────────

def _convert_equipment(out_dir: Path) -> int:
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
    for item in items_raw:
        iid = item["ID"]
        name = resolve_text(item.get("ItemName", {}))
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
            props = _flatten_property_mods(equip.get("GeneralPropertyList"))
            for tag_id in (equip.get("EquipmentTagList") or []):
                tag_info = tag_index.get(tag_id)
                if tag_info:
                    tags.append({
                        "id": tag_id,
                        "desc": resolve_text(tag_info.get("EquipTagDesc", {})),
                    })

        recommend = recommend_index.get(iid)
        recommend_roles = recommend.get("RecommendRoleIDList", []) if recommend else []

        # 功能道具描述：优先 ConsumableDesc（拆装扳手等），
        # 回退 ForgeDesc（武装箱/聘用书/邀请函等 99990-99999）
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

    # 按分类 → 优先级排序
    out.sort(key=lambda x: (x["category"], -x["priority"], x["id"]))

    (out_dir / "equipment.json").write_text(
        json.dumps({"items": out}, ensure_ascii=False), encoding="utf-8"
    )
    return len(out)


# ─────────────────────────────────────────────
# 投资环境（Portal Buff）
# ─────────────────────────────────────────────

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

    (out_dir / "portals.json").write_text(
        json.dumps({"portals": out}, ensure_ascii=False), encoding="utf-8"
    )
    return len(out)


# ─────────────────────────────────────────────
# 投资策略（Augment）
# ─────────────────────────────────────────────

def _convert_augments(out_dir: Path) -> int:
    raw = _load_excel("GridFightAugment.json")

    out: list[dict] = []
    for entry in raw:
        aid = entry["ID"]
        name = resolve_text(entry.get("HexName", {}))
        desc = resolve_text(entry.get("HexDesc", {}))
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

    (out_dir / "augments.json").write_text(
        json.dumps({"augments": out}, ensure_ascii=False), encoding="utf-8"
    )
    return len(out)


# ─────────────────────────────────────────────
# 羁绊图鉴（Trait）
# ─────────────────────────────────────────────

def _convert_traits(out_dir: Path) -> int:
    raw = _load_excel("GridFightTraitBasicInfo.json")
    layer_raw = _load_excel("GridFightTraitLayer.json")
    mazebuff_raw = _load_excel("GridFightTraitMazebuff.json")
    mazebuff_index = _build_index(mazebuff_raw)

    # 构建层级索引
    layer_by_trait: dict[int, list[dict]] = {}
    for entry in layer_raw:
        tid = entry.get("TraitID")
        if tid is None:
            continue
        desc = resolve_text(entry.get("PropertyDesc", {}))
        params = [_unwrap(p, 0) for p in (entry.get("PropertyParamList") or [])]
        member_props = _flatten_property_mods(entry.get("TraitMemberPropertyList"))
        all_props = _flatten_property_mods(entry.get("AllMemberPropertyList"))
        # 回退：直接字段为空时，从 MazebuffID 关联的 buff 补全描述
        if not desc and not member_props and not all_props:
            mb_id = entry.get("MazebuffID")
            mb = mazebuff_index.get(mb_id) if mb_id else None
            if mb:
                desc = resolve_text(mb.get("BuffDesc") or mb.get("BuffSimpleDesc", {}))
                params = [_unwrap(p, 0) for p in (mb.get("ParamList") or [])]
        node = {
            "layer": entry.get("Layer", 0),
            "quality": entry.get("Quality") or None,
            "desc": desc,
            "params": params,
            "member_props": member_props,
            "all_props": all_props,
        }
        layer_by_trait.setdefault(tid, []).append(node)
    for tid in layer_by_trait:
        layer_by_trait[tid].sort(key=lambda x: x["layer"])

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

        # 分类：1000系阵营 / 2000系战斗 / 3000系特殊
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
        })

    out.sort(key=lambda x: x["sort_priority"])

    (out_dir / "traits.json").write_text(
        json.dumps({"traits": out}, ensure_ascii=False), encoding="utf-8"
    )
    return len(out)


# ─────────────────────────────────────────────
# 主入口
# ─────────────────────────────────────────────

def convert() -> None:
    logger.info("--- 货币战争图鉴数据 (currency_catalog) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    out_dir.mkdir(parents=True, exist_ok=True)

    n_equip = _convert_equipment(out_dir)
    logger.info("  装备图鉴: %d 条", n_equip)

    n_portal = _convert_portals(out_dir)
    logger.info("  投资环境: %d 条", n_portal)

    n_augment = _convert_augments(out_dir)
    logger.info("  投资策略: %d 条", n_augment)

    n_trait = _convert_traits(out_dir)
    logger.info("  羁绊图鉴: %d 条", n_trait)

    logger.info("货币战争图鉴数据完成")


if __name__ == "__main__":
    from textmap import load_textmap
    load_textmap()
    convert()
