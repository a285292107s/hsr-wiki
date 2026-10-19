import json
import logging
import math

from config import EXCEL_DIR, SOURCE_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value

logger = logging.getLogger("converter")

def _stat_ratio_from_cfg(cfg: dict) -> dict:
    def frac(field: str) -> float:
        v: object = cfg.get(field)
        depth = 0
        while isinstance(v, dict) and depth < 4:
            v = v.get("Value")
            depth += 1
        return float(v) if isinstance(v, (int, float)) else 1.0
    return {
        "hp": frac("HPModifyRatio"),
        "atk": frac("AttackModifyRatio"),
        "def": frac("DefenceModifyRatio"),
        "speed": frac("SpeedModifyRatio"),
    }

def load_level_curve() -> dict[str, dict[str, dict[str, float]]]:
    curve: dict[str, dict[str, dict[str, float]]] = {}
    for r in load_json(EXCEL_DIR / "HardLevelGroup.json"):
        g, lv = r.get("HardLevelGroup"), r.get("Level")
        if g is None or lv is None:
            continue
        def frac(field: str) -> float:
            v: object = r.get(field)
            depth = 0
            while isinstance(v, dict) and depth < 4:
                v = v.get("Value")
                depth += 1
            return float(v) if isinstance(v, (int, float)) else 1.0
        key = str(g)
        lv_key = str(lv)
        if lv_key in curve.get(key, {}):
            logger.warning("HardLevelGroup 曲线键重复：group=%s level=%s，保留首条", g, lv)
            continue
        curve.setdefault(key, {})[lv_key] = {
            "hp": frac("HPRatio"),
            "atk": frac("AttackRatio"),
            "def": frac("DefenceRatio"),
            "speed": frac("SpeedRatio"),
        }
    return curve


def _elite_group(cfg: dict) -> int:
    v: object = cfg.get("EliteGroup")
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return int(v) if isinstance(v, (int, float)) and v else 1


def load_elite_groups() -> dict[str, dict[str, float]]:
    out: dict[str, dict[str, float]] = {}
    for r in load_json(EXCEL_DIR / "EliteGroup.json"):
        g = r.get("EliteGroup")
        if g is None:
            continue

        def frac(field: str) -> float:
            v: object = r.get(field)
            depth = 0
            while isinstance(v, dict) and depth < 4:
                v = v.get("Value")
                depth += 1
            return float(v) if isinstance(v, (int, float)) else 1.0

        key = str(g)
        if key in out:
            logger.warning("EliteGroup 组键重复：group=%s，保留首条", g)
            continue
        out[key] = {
            "hp": frac("HPRatio"),
            "atk": frac("AttackRatio"),
            "def": frac("DefenceRatio"),
            "speed": frac("SpeedRatio"),
            "stance": frac("StanceRatio"),
        }
    return out


def stage_context(rec: dict) -> dict:
    def val(field: str):
        v = rec.get(field)
        depth = 0
        while isinstance(v, dict) and depth < 4:
            v = v.get("Value")
            depth += 1
        return v if isinstance(v, int) and not isinstance(v, bool) else None

    ctx: dict = {}
    for key, field in (("level", "Level"), ("level_group", "HardLevelGroup"),
                       ("elite_group", "EliteGroup")):
        v = val(field)
        if v is not None:
            ctx[key] = v
    return ctx


def _hp_ratio(row: dict | None) -> float:
    v = (row or {}).get("hp")
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and v > 0 else 1.0


def _js_round1(v: float) -> float:
    return math.floor(v * 10 + 0.5) / 10


def _monster_hp_raw(info: dict, level: object, stage: dict, curve: dict, elite_groups: dict) -> float | None:
    base = (info.get("stats") or {}).get("hp")
    if not isinstance(base, (int, float)) or isinstance(base, bool):
        return None
    if not isinstance(level, int) or isinstance(level, bool) or level <= 0:
        return None
    row = (curve.get(str(stage.get("level_group") or 1)) or {}).get(str(level))
    if not row:
        return None
    curve_hp = row.get("hp")
    if not isinstance(curve_hp, (int, float)) or isinstance(curve_hp, bool):
        return None
    ratio = (info.get("stat_ratio") or {}).get("hp")
    if not isinstance(ratio, (int, float)) or isinstance(ratio, bool) or ratio <= 0:
        ratio = 1.0
    out = (base * ratio
           * _hp_ratio(elite_groups.get(str(info.get("elite_group") or 1)))
           * _hp_ratio(elite_groups.get(str(stage.get("elite_group") or 1)))
           * curve_hp)
    return out if math.isfinite(out) else None


def monster_hp_at(info: dict, level: object, stage: dict, curve: dict, elite_groups: dict) -> float | None:
    out = _monster_hp_raw(info, level, stage, curve, elite_groups)
    return _js_round1(out) if out is not None else None


def monster_hp_phases(
    info: dict,
    level: object,
    stage: dict,
    curve: dict,
    elite_groups: dict,
    ratios: list[float] | None,
) -> list[float] | None:
    if not ratios or len(ratios) < 2:
        return None
    raw = _monster_hp_raw(info, level, stage, curve, elite_groups)
    if raw is None:
        return None
    out: list[float] = []
    for r in ratios:
        if not isinstance(r, (int, float)) or isinstance(r, bool) or r <= 0:
            return None
        out.append(_js_round1(raw * r))
    return out


_PHASE_HP_RATIOS: dict[int, list[float]] | None = None
"""`load_phase_hp_ratios` 的进程内缓存（12 MB 客户端配置只扫一遍）。"""


def _phase_ratio_expr(ratio: dict, dyn: dict, own_cfg: dict, skills: dict[int, dict]) -> float | None:
    if not ratio.get("IsDynamic"):
        v = (ratio.get("FixedValue") or {}).get("Value")
        return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
    for h in ((ratio.get("PostfixExpr") or {}).get("DynamicHashes") or []):
        info = (dyn.get(str(h)) or {}).get("ReadInfo") or {}
        if info.get("Type") != "SkillParam":
            return None
        tk, idx = info.get("TriggerKey"), info.get("Index")
        if not isinstance(idx, int):
            return None
        for sid in own_cfg.get("SkillList") or []:
            skill = skills.get(sid)
            if skill and skill.get("SkillTriggerKey") == tk:
                params = skill.get("ParamList") or []
                if idx < len(params):
                    v = params[idx].get("Value")
                    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None
                return None
        return None
    return None


def load_phase_hp_ratios() -> dict[int, list[float]]:
    global _PHASE_HP_RATIOS
    if _PHASE_HP_RATIOS is not None:
        return _PHASE_HP_RATIOS
    skills = {r["SkillID"]: r for r in load_json(EXCEL_DIR / "MonsterSkillConfig.json")}
    cfg_by_tpl: dict[int, dict] = {}
    for r in load_json(EXCEL_DIR / "MonsterConfig.json"):
        cfg_by_tpl.setdefault(r.get("MonsterTemplateID"), r)
    out: dict[int, list[float]] = {}
    unparsed: list[int] = []
    unordered: list[int] = []
    missing: list[int] = []
    for rec in load_json(EXCEL_DIR / "MonsterTemplateConfig.json"):
        tpl = rec.get("MonsterTemplateID")
        ptr = rec.get("JsonConfig") or ""
        if tpl is None or not ptr:
            continue
        path = SOURCE_DIR / ptr
        if not path.exists():
            missing.append(tpl)
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            unparsed.append(tpl)
            continue
        phases = data.get("PhaseList")
        if not phases:
            continue
        dyn = ((data.get("DynamicValues") or {}).get("Floats") or {})
        own = cfg_by_tpl.get(tpl) or {}
        ordered = sorted((p for p in phases if isinstance(p, dict)),
                         key=lambda p: p.get("PhaseNum") or 0)
        if [p.get("PhaseNum") for p in ordered] != list(range(1, len(ordered) + 1)):
            unordered.append(tpl)
            continue
        ratios: list[float] = []
        for ph in ordered:
            ratio = ph.get("PhaseMaxHPRatio")
            value = 1.0 if ratio is None else _phase_ratio_expr(ratio, dyn, own, skills)
            if value is None or value <= 0:
                unparsed.append(tpl)
                ratios = []
                break
            ratios.append(value)
        if len(ratios) >= 2:
            out[tpl] = ratios
    if missing:
        logger.warning("MonsterTemplateConfig 的 JsonConfig 指向不存在的实体配置：%d 个模板（ID：%s）",
                       len(missing), ",".join(str(i) for i in sorted(missing)))
    if unparsed:
        logger.warning("实体配置的 PhaseMaxHPRatio 无法解析，这些模板不落 phase_hp（ID：%s）",
                       ",".join(str(i) for i in sorted(set(unparsed))))
    if unordered:
        logger.warning("实体配置的 PhaseNum 不是 1..n 连续，这些模板不落 phase_hp（ID：%s）",
                       ",".join(str(i) for i in sorted(set(unordered))))
    logger.info("战斗阶段生命倍率：%d/%d 个模板跨 ≥2 阶段", len(out), len(cfg_by_tpl))
    _PHASE_HP_RATIOS = out
    return out


def load_status_resist_icons() -> dict[str, str]:
    out: dict[str, str] = {}
    for rec in load_json(EXCEL_DIR / "MonsterStatusResistanceType.json"):
        key = rec.get("Type")
        icon = rec.get("Icon") or ""
        if key and icon:
            out[key] = icon.rsplit("/", 1)[-1].removesuffix(".png")
    return out

def _debuff_resist(cfg: dict, icons: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for rec in cfg.get("DebuffResist") or []:
        key = rec.get("Key")
        icon = icons.get(key or "")
        if not key or not icon:
            continue
        value: object = rec.get("Value")
        depth = 0
        while isinstance(value, dict) and depth < 4:
            value = value.get("Value")
            depth += 1
        out.append({"key": key, "value": value if isinstance(value, (int, float)) else 0, "icon": icon})
    return out


_BASE_STATS = (("hp", "HPBase"), ("atk", "AttackBase"), ("def", "DefenceBase"), ("speed", "SpeedBase"))
"""基准属性源字段 → 输出键（`stats` 的落键顺序即此顺序）。"""


def _base_stat(rec: dict, field: str) -> float | None:
    v: object = rec.get(field)
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return v if isinstance(v, (int, float)) else None


def _modify_value(cfg: dict, field: str) -> float | None:
    v: object = cfg.get(field)
    depth = 0
    while isinstance(v, dict) and depth < 4:
        v = v.get("Value")
        depth += 1
    return float(v) if isinstance(v, (int, float)) else None


def load_monsters() -> dict[int, dict]:
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    resist_icons = load_status_resist_icons()
    camps = {
        r["ID"]: resolve_text(r.get("Name", {}))
        for r in load_json(EXCEL_DIR / "MonsterCamp.json") if r.get("ID") is not None
    }
    skills = {}
    for r in load_json(EXCEL_DIR / "MonsterSkillConfig.json"):
        sid = r.get("SkillID")
        if sid is None:
            continue
        name = resolve_text(r.get("SkillName", {}))
        if not name:
            continue
        skills[sid] = {
            "id": sid,
            "name": name,
            "tag": resolve_text(r.get("SkillTag", {})),
            "type_desc": resolve_text(r.get("SkillTypeDesc", {})),
            "damage_type": r.get("DamageType", "") or "",
            "attack_type": r.get("AttackType", "") or "",
            "desc": resolve_text(r.get("SkillDesc", {}), clean=False),
            "param_list": [unwrap_value(p) for p in (r.get("ParamList") or [])],
            **({"phase_list": [int(p) for p in r["PhaseList"]]} if r.get("PhaseList") else {}),
        }
    cfg_by_id = {r.get("MonsterID"): r for r in configs}
    cfg_by_tpl = {r.get("MonsterTemplateID"): r for r in configs}
    out: dict[int, dict] = {}
    missing: dict[str, list[int]] = {}
    for rec in templates:
        mid = rec.get("MonsterTemplateID")
        if mid is None:
            continue
        name = resolve_text(rec.get("MonsterName", {}))
        if not name:
            continue
        icon = rec.get("ManikinImagePath", "") or ""
        figure = rec.get("ImagePath", "") or ""
        cfg = cfg_by_id.get(mid) or cfg_by_tpl.get(mid) or {}
        stance = _base_stat(rec, "StanceBase")
        stats: dict[str, float] = {}
        for key, field in _BASE_STATS:
            v = _base_stat(rec, field)
            if v is None:
                missing.setdefault(field, []).append(mid)
            else:
                stats[key] = v
        if stance is None:
            missing.setdefault("StanceBase", []).append(mid)
        out[mid] = {
            "name": name,
            "icon": icon.rsplit("/", 1)[-1].replace(".png", "") if icon else "",
            "figure": figure.rsplit("/", 1)[-1].replace(".png", "") if figure else "",
            "weak": list(dict.fromkeys(cfg.get("StanceWeakList", []) or [])),
            "resist": {
                x["DamageType"]: x["Value"]["Value"]
                for x in (cfg.get("DamageTypeResistance") or [])
            },
            "rank": rec.get("Rank", "") or "",
            "camp": camps.get(rec.get("MonsterCampID"), "") or "",
            "intro": resolve_text(cfg.get("MonsterIntroduction", {})),
            "skills": [skills[sid] for sid in (cfg.get("SkillList") or []) if sid in skills],
            **({"stance": stance} if stance is not None else {}),
            "stats": stats,
            "stat_ratio": _stat_ratio_from_cfg(cfg) if cfg else {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": (cfg.get("HardLevelGroup") or 1) if cfg else 1,
            "elite_group": _elite_group(cfg) if cfg else 1,
            "debuff_resist": _debuff_resist(cfg, resist_icons),
        }
        for key, field in (("stance_modify", "StanceModifyValue"), ("speed_modify", "SpeedModifyValue")):
            mv = _modify_value(cfg, field)
            if mv is not None:
                out[mid][key] = mv
    for rec in configs:
        mid, tpl = rec.get("MonsterID"), rec.get("MonsterTemplateID")
        if mid is not None and tpl is not None and mid != tpl and tpl in out:
            variant = {
                **out[tpl],
                "_tpl": tpl,
                "stat_ratio": _stat_ratio_from_cfg(rec),
                "level_group": rec.get("HardLevelGroup") or 1,
                "elite_group": _elite_group(rec),
                "debuff_resist": _debuff_resist(rec, resist_icons),
            }
            for key, field in (("stance_modify", "StanceModifyValue"), ("speed_modify", "SpeedModifyValue")):
                mv = _modify_value(rec, field)
                if mv is None:
                    variant.pop(key, None)
                else:
                    variant[key] = mv
            out.setdefault(mid, variant)
    for field, ids in missing.items():
        logger.warning("MonsterTemplateConfig 缺基准字段 %s：%d 个模板不落该键（ID：%s）",
                       field, len(ids), ",".join(str(i) for i in sorted(ids)))
    return out
