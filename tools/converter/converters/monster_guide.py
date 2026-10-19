from collections import defaultdict
import hashlib
from typing import Any

from config import EXCEL_DIR
from textmap import current_textmap, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, unwrap_value


def _joined_ref(keys: list[str]) -> Any:
    if not keys:
        return ""
    composer = lambda tm, ks=tuple(keys): " ".join(  # noqa: E731 —— 按值绑定键列表
        t for t in (tm.get(k, "") for k in ks) if t
    )
    sig = hashlib.sha1("|".join(keys).encode("utf-8")).hexdigest()[:12]
    return composed_ref(f"composed:guideskill:{sig}", composer, composer(current_textmap()))


def load_guide_phases() -> dict[int, dict]:
    texts: dict[int, str] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideSkillText.json"):
        tid = rec.get("SkillTextID")
        if tid is not None:
            key = text_key_of(rec.get("SkillDescription", {}))
            if key:
                texts[tid] = key
    skills: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideSkill.json"):
        sid = rec.get("SkillID")
        if sid is None:
            continue
        keys = [texts[t] for t in (rec.get("SkillTextIDList") or []) if t in texts]
        skills[sid] = {
            "name": resolve_text(rec.get("SkillName", {})),
            "desc": _joined_ref(keys),
        }
    out: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuidePhase.json"):
        pid = rec.get("PhaseID")
        if pid is None:
            continue
        out[pid] = {
            "id": pid,
            "name": resolve_text(rec.get("PhaseName", {})),
            "desc": resolve_text(rec.get("PhaseDescription", {}), clean=False),
            "answer": resolve_text(rec.get("PhaseAnswer", {}), clean=False),
            "skills": [skills[s] for s in (rec.get("SkillList") or []) if s in skills],
        }
    return out


def load_boss_guides() -> dict[int, dict]:
    tags: dict[int, dict] = {}
    tag_skill: dict[int, int] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideTag.json"):
        tid = rec.get("TagID")
        if tid is None:
            continue
        name = resolve_text(rec.get("TagName", {}))
        desc = resolve_text(rec.get("TagBriefDescription", {}), clean=False)
        if not name and not desc:
            continue
        tags[tid] = {
            "id": tid,
            "name": name,
            "desc": desc,
            "param_list": [unwrap_value(p) for p in (rec.get("ParameterList") or [])],
        }
        if rec.get("SkillID"):
            tag_skill[tid] = rec["SkillID"]

    tpl_tag_ids: dict[int, list[int]] = {}
    tpl_phase_ids: dict[int, list[int]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterGuideConfig.json"):
        mid = rec.get("MonsterID")
        if mid is None:
            continue
        tpl = mid // 100
        ids = tpl_tag_ids.setdefault(tpl, [])
        for tid in rec.get("TagList", []) or []:
            if tid in tags and tid not in ids:
                ids.append(tid)
        phase_ids = tpl_phase_ids.setdefault(tpl, [])
        for pid in rec.get("PhaseList", []) or []:
            if pid not in phase_ids:
                phase_ids.append(pid)

    phases = load_guide_phases()
    out: dict[int, dict] = {}
    for tpl, ids in tpl_tag_ids.items():
        block: dict = {}
        if ids:
            block["traits"] = [tags[t] for t in ids]
        items = [phases[p] for p in tpl_phase_ids.get(tpl, []) if p in phases]
        if items:
            block["phases"] = items
        if block:
            out[tpl] = block

    alias: dict[int, set[int]] = defaultdict(set)
    for tpl, ids in tpl_tag_ids.items():
        for tid in ids:
            sk = tag_skill.get(tid)
            if not sk:
                continue
            alt = sk // 100
            if alt == tpl:
                continue
            alias[alt].add(tpl)
    for alt, srcs in alias.items():
        if alt in out or len(srcs) != 1:
            continue
        src = next(iter(srcs))
        if src in out:
            out[alt] = out[src]
    return out
