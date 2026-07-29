"""货币战争 · 角色图鉴转换器（从本地子模块读取）

数据来源（全部来自 vendor/TurnBasedGameData/ExcelOutput/）：
  - AvatarConfig.json                   → 角色名（Hash → TextMap → 中文）
  - GridFightRoleBasicInfo.json         → 角色基础信息列表
  - GridFightRoleStar.json              → 各星级战力/属性修正/技能列表
  - GridFightTraitBasicInfo.json        → 羁绊信息（名、描述、图标等）
  - GridFightFrontSkill.json            → 前排技能文本
  - GridFightBackBESkillConfig.json     → 后排/BE 技能文本
  - TextMap/TextMapCHS.json             → 中文文本映射

输出（与前端现有类型兼容）：
  - public/data/cn/currency/role.json
  - public/data/cn/currency/role/<id>.json

注意：所有文本字段通过 TextMap 解析为中文。
图片（角色头像/立绘、羁绊图标）仍引用 CDN，由前端工具函数拼接。
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json

logger = logging.getLogger("converter.currency")

OUT_SUBDIR = "currency"  # 相对于 OUTPUT_DIR 的子目录


def _trait_cat(tid: int) -> str:
    """特质 ID → 分类：1000系阵营 / 2000系战斗 / 3000系特殊。"""
    if 1000 <= tid < 2000:
        return "faction"
    if 2000 <= tid < 3000:
        return "combat"
    return "special"


# ---------- 加载 ExcelOutput 源数据 ----------

def _load_excel(name: str) -> list[dict]:
    return load_json(EXCEL_DIR / name)


def _build_index(data: list[dict], key: str = "ID") -> dict[Any, dict]:
    return {item[key]: item for item in data}


def _unwrap(v: Any, default: Any = None) -> Any:
    """解包 {Value: X} → X；None 或无 Value 字段返回 default。"""
    if v is None:
        return default
    if isinstance(v, dict) and "Value" in v:
        return v["Value"]
    return v


def _flatten_stance_list(lst: list | None) -> list[int]:
    """将 [{Value: 1}, {Value: 2}, ...] → [1, 2, ...]"""
    if not lst:
        return []
    out = []
    for item in lst:
        out.append(_unwrap(item, 0))
    return out


def _flatten_property_mods(lst: list | None) -> list[dict]:
    """将 [{PropertyType: ..., Value: {Value: ...}}, ...] → 标准化列表。"""
    if not lst:
        return []
    out = []
    for item in lst:
        if not isinstance(item, dict):
            continue
        typ = item.get("PropertyType", "")
        val = _unwrap(item.get("Value"), 0)
        out.append({
            "name": typ,
            "property_type": typ,
            "value": val,
        })
    return out


# ---------- 主转换函数 ----------

def convert() -> None:
    logger.info("--- 货币战争角色数据 (currency) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    detail_dir = out_dir / "role"
    out_dir.mkdir(parents=True, exist_ok=True)
    detail_dir.mkdir(parents=True, exist_ok=True)

    # 1. 加载源数据
    role_list_raw = _load_excel("GridFightRoleBasicInfo.json")
    # 角色列表是无 AvatarName 的，需要从 AvatarConfig 补名字
    avatar_config = _load_excel("AvatarConfig.json")
    avatar_ld = _load_excel("AvatarConfigLD.json") if (EXCEL_DIR / "AvatarConfigLD.json").exists() else []
    trait_data = _build_index(_load_excel("GridFightTraitBasicInfo.json"), "ID")
    star_data = _load_excel("GridFightRoleStar.json")
    front_skills = _build_index(_load_excel("GridFightFrontSkill.json"), "SkillID")
    back_skills = _build_index(_load_excel("GridFightBackBESkillConfig.json"), "SkillID")

    # 2. 构建角色名映射 AvatarID → 中文名
    name_map: dict[int, str] = {}
    for cfg in avatar_config + avatar_ld:
        aid = cfg.get("AvatarID", 0)
        if not aid:
            continue
        name = resolve_text(cfg.get("AvatarName", {}))
        # 如果是开拓者且有命途后缀，保持原样
        path_key = cfg.get("AvatarBaseType", "")
        if name == "开拓者" and path_key:
            from config import PATH_NAME_FALLBACK
            fallback = PATH_NAME_FALLBACK.get(path_key, path_key)
            name = f"开拓者·{fallback}"
        if name:
            name_map[aid] = name

    # 3. 按角色 ID 索引星数据 (ID → list of star entries)
    star_by_role: dict[int, list[dict]] = {}
    for entry in star_data:
        rid = entry.get("ID")
        if rid is None:
            continue
        star_by_role.setdefault(rid, []).append(entry)

    # 4. 角色列表 & 详情生成
    roles_out: list[dict] = []

    for role_raw in role_list_raw:
        rid = role_raw["ID"]
        avatar_id = role_raw.get("AvatarID", rid)
        name = name_map.get(avatar_id, f"角色 {avatar_id}")

        trait_ids = [int(t) for t in (role_raw.get("TraitList") or [])]

        # 特质摘要（id + name + cat），供列表页直接展示与筛选，无需前端硬编码
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
        }

        roles_out.append(base)

        # ---------- 生成详情 ----------
        traits_out: list[dict] = []
        for tid in base["trait_list"]:
            tr = trait_data.get(tid)
            if tr is None:
                continue
            trait_name = resolve_text(tr.get("TraitName", {}))
            trait_desc = resolve_text(tr.get("TraitBaseDesc", {}))

            traits_out.append({
                "id": tid,
                "name": trait_name,
                "activation_type": tr.get("ActivationType"),
                "icon": tr.get("IconPath", ""),
                "desc": trait_desc,
            })

        # 该角色在各星级下的数据
        role_stars = star_by_role.get(rid, [])
        stars_out: dict[str, dict] = {}

        for star_entry in role_stars:
            skey = str(star_entry["Star"])

            # 技能列表
            front_skill_ids: list[int] = star_entry.get("FrontShowSkillIDList") or []
            be_skill_ids: list[int] = star_entry.get("BESkillIDList") or []
            back_show_ids: list[int] = star_entry.get("BackShowSkillIDList") or []

            front_skills_out = [_build_skill(sid, front_skills, {}) for sid in front_skill_ids]
            back_skills_out = [_build_skill(sid, back_skills, {"sp_base": None}) for sid in be_skill_ids]
            # 把 "back_show" 也加进来（与 be 去重或单独分组的逻辑看情况）
            back_show_out = [_build_skill(sid, back_skills, {"sp_base": None}) for sid in back_show_ids]
            # 合并去重
            seen_ids = {sk["id"] for sk in back_skills_out}
            for bsk in back_show_out:
                if bsk["id"] not in seen_ids:
                    back_skills_out.append(bsk)
                    seen_ids.add(bsk["id"])

            star_node = {
                "star": star_entry["Star"],
                "front_one_word_desc": resolve_text(star_entry.get("FrontOneWordDesc", {})),
                "back_one_word_desc": resolve_text(star_entry.get("BackOneWordDesc", {})),
                "front_power_base": _unwrap(star_entry.get("FrontPowerBase")),
                "back_power_base": None,
                "back_speed_rewrite": None,
                "back_speed_added_ratio": None,
                "back_energy_bar": None,
                "back_max_sp": None,
                "back_initial_sp": None,
                "back_initial_energy_bar": None,
                "luck_chance": _unwrap(star_entry.get("LuckChance")),
                "luck_damage": _unwrap(star_entry.get("LuckDamage")),
                "extra_heal_base": _unwrap(star_entry.get("ExtraHealBase")),
                "extra_shield_base": _unwrap(star_entry.get("ExtraShieldBase")),
                "stance_damage_display": None,
                "show_stance_list": _flatten_stance_list(star_entry.get("ShowStanceList")),
                "recommend": None,
                "front_show_skill": front_skills_out,
                "back_show_skill": back_skills_out,
                "servant_show_skill": [],
                "general_property_modify_list": _flatten_property_mods(
                    star_entry.get("GeneralPropertyModifyList")
                ),
            }
            stars_out[skey] = star_node

        detail = {
            "id": base["id"],
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
            "rank": [],       # 暂无来源解析
            "equipment": [],
        }

        (detail_dir / f"{rid}.json").write_text(
            json.dumps(detail, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    # 5. 写列表
    list_out = {"version": "local", "roles": roles_out}
    (out_dir / "role.json").write_text(
        json.dumps(list_out, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    logger.info("货币战争角色数据完成：%d 个角色", len(roles_out))


def _build_skill(
    sid: int,
    skill_index: dict[int, dict],
    overrides: dict[str, Any] | None = None,
) -> dict:
    """根据 SkillID 从索引中查找并构建输出格式的技能对象。"""
    sk = skill_index.get(sid)
    if sk is None:
        return {"id": sid, "name": "", "desc": "", "simple_desc": "", "tag": None,
                "type": None, "sp_base": None, "bp_need": None, "bp_add": None,
                "show_stance_list": [], "extra": {}, "level": {}}

    name = resolve_text(sk.get("SkillName", {}))
    tag = resolve_text(sk.get("SkillTag", {}))
    type_desc = resolve_text(sk.get("SkillTypeDesc", {}))
    desc = resolve_text(sk.get("SkillDesc", {}))
    simple_desc = resolve_text(sk.get("SimpleSkillDesc", {}))

    sp_base = _unwrap(sk.get("SPMultipleRatio"))
    bp_need = _unwrap(sk.get("BPNeed"))
    bp_add = _unwrap(sk.get("BPAdd"))
    stance_list = _flatten_stance_list(sk.get("ShowStanceList"))
    pl = [_unwrap(p, 0) for p in (sk.get("ParamList") or [])]

    result = {
        "id": sid,
        "name": name,
        "desc": desc,
        "simple_desc": simple_desc,
        "type": type_desc or None,
        "tag": tag or None,
        "sp_base": sp_base,
        "bp_need": bp_need,
        "bp_add": bp_add,
        "show_stance_list": stance_list,
        "skill_combo_value_delta": None,
        "extra": {},
        "level": {
            "1": {"level": 1, "param_list": pl},
        },
    }
    if overrides:
        result.update(overrides)
    return result


if __name__ == "__main__":
    convert()
