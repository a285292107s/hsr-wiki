"""敌方信息聚合（endgame 赛季敌方 / monster_detail 详情页共用）。

完整表→字段→输出映射见 docs/data/转换器字段映射.md（monster_common 段）。
源：MonsterTemplateConfig / MonsterConfig / MonsterCamp / MonsterSkillConfig。
输出 {模板ID: {name,icon,figure,weak,resist,rank,camp,intro,skills,stance,stats}}；
实例别名 MonsterID(如200401009)≠模板ID时指向同模板，使波次引用直接命中。
"""
import logging

from config import EXCEL_DIR
from textmap import resolve_text
from utils import load_json, unwrap_value

logger = logging.getLogger("converter")


def load_monsters() -> dict[int, dict]:
    """敌方信息聚合 → {ID: {name, icon, figure, weak, resist, rank, camp, intro, skills, stance, stats}}。"""
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    camps = {
        r["ID"]: resolve_text(r.get("Name", {}))
        for r in load_json(EXCEL_DIR / "MonsterCamp.json") if r.get("ID") is not None
    }
    # 技能预解析（名称缺失不入索引；desc 保留原始富文本供前端 fmtDesc 渲染）
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
        }
    # 实例别名：MonsterConfig.MonsterID（战斗波次引用实例 ID，如 200401009）→
    # 同模板信息（MonsterTemplateID 已注册时），使波次引用直接命中；
    # 附加内部字段 _tpl 记录模板 ID（供赛季输出 tpl，前端跳转怪物详情用模板 ID）
    for rec in configs:
        mid, tpl = rec.get("MonsterID"), rec.get("MonsterTemplateID")
        if mid is not None and tpl is not None and mid != tpl and tpl in out:
            out.setdefault(mid, {**out[tpl], "_tpl": tpl})
    return out
