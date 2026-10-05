"""敌方信息聚合（endgame 赛季敌方 / monster_detail 详情页共用）。

完整表→字段→输出映射见 docs/data/转换器字段映射.md（monster_common 段）。
源：MonsterTemplateConfig / MonsterConfig / MonsterCamp / MonsterSkillConfig / HardLevelGroup。
输出 {模板ID: {name,icon,figure,weak,resist,rank,camp,intro,skills,stance,stats,
                stat_ratio,level_group}}；
实例别名 MonsterID(如200401009)≠模板ID时指向同模板，使波次引用直接命中。
战斗数值合成链（社群逆向共识 + HardLevelGroup 表结构一致，判据见 ADR 0040）：
  stat(level) = stats[基准] × stat_ratio[维度修饰比] × level_curve[level_group][level]
等级曲线不进每怪物 payload（745 行共享一份），由 monster_detail 单独落
monster-level-curve.json；模板页基准值 stats 仍是官方模板原值，供列表与对照。
"""
import logging

from config import EXCEL_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value

logger = logging.getLogger("converter")

def _stat_ratio_from_cfg(cfg: dict) -> dict:
    """MonsterConfig 的维度修饰比 → {hp,atk,def,speed}；缺位或不可解析取 1（中性）。
    个别记录的 ratio 是双层 ValueWrap（{Value:{Value:n}}），逐层解到数值为止。"""
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
    """HardLevelGroup 等级曲线 → {group: {level: {hp,atk,def,speed}}}（键 str 化以贴合 JSON）。
    战斗数值合成的第二段：与 MonsterTemplateConfig 基准、MonsterConfig 修饰比联乘；
    判据见 ADR 0040。比率缺位取中性 1，不静默归零。"""
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


def load_monsters() -> dict[int, dict]:
    """敌方信息聚合 → {ID: {name, icon, figure, weak, resist, rank, camp, intro, skills, stance, stats,
                             stat_ratio, level_group, stat_ratio}}。"""
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
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
        }
    cfg_by_id = {r.get("MonsterID"): r for r in configs}
    cfg_by_tpl = {r.get("MonsterTemplateID"): r for r in configs}
    out: dict[int, dict] = {}
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
            "stance": unwrap_value(rec.get("StanceBase", {})) or 0,
            "stats": {
                "hp": unwrap_value(rec.get("HPBase", {})) or 0,
                "atk": unwrap_value(rec.get("AttackBase", {})) or 0,
                "def": unwrap_value(rec.get("DefenceBase", {})) or 0,
                "speed": unwrap_value(rec.get("SpeedBase", {})) or 0,
            },
            # 维度修饰比与难度组：战斗合成链第二/三段（ADR 0040）。模板自身 cfg 缺位时按中性 1 / 组 1。
            "stat_ratio": _stat_ratio_from_cfg(cfg) if cfg else {"hp": 1.0, "atk": 1.0, "def": 1.0, "speed": 1.0},
            "level_group": (cfg.get("HardLevelGroup") or 1) if cfg else 1,
        }
    for rec in configs:
        mid, tpl = rec.get("MonsterID"), rec.get("MonsterTemplateID")
        if mid is not None and tpl is not None and mid != tpl and tpl in out:
            # 实例变体的修饰比/难度组用**它自己**的 config 记录：模板与变体的同三项不同值
            # （1002011 hpR=1，100201101 hpR=0.266667），沿用模板值会把变体战斗数值算错
            out.setdefault(mid, {
                **out[tpl],
                "_tpl": tpl,
                "stat_ratio": _stat_ratio_from_cfg(rec),
                "level_group": rec.get("HardLevelGroup") or 1,
            })
    return out
