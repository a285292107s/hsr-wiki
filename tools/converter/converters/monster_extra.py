import logging
import re
from typing import Any

from config import EXCEL_DIR
from textmap import clean_text, current_textmap, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, unwrap_value
from converters.items import item_name_icon
from converters.monster_common import stage_context as _stage_context

logger = logging.getLogger("converter")


def _item_index() -> dict[int, tuple[str, str]]:
    out: dict[int, tuple[str, str]] = {}
    for rec in load_json(EXCEL_DIR / "ItemConfig.json"):
        iid = rec.get("ID")
        if iid is None:
            continue
        name, icon = item_name_icon(rec)
        if name:
            out[iid] = (name, icon)
    return out


def load_drops() -> dict[int, list[dict]]:
    items = _item_index()
    by_tpl: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterDrop.json"):
        tpl = rec.get("MonsterTemplateID")
        if tpl is None:
            continue
        rows: list[dict] = []
        for d in rec.get("DisplayItemList") or []:
            iid = d.get("ItemID")
            name, icon = items.get(iid, ("", ""))
            if name:
                rows.append({"id": iid, "name": name, "icon": icon})
        if not rows:
            continue
        by_tpl.setdefault(tpl, []).append({
            "world_level": rec.get("WorldLevel"),
            "avatar_exp": rec.get("AvatarExpReward") or 0,
            "items": rows,
        })
    for rows in by_tpl.values():
        rows.sort(key=lambda r: (r["world_level"] is not None, r["world_level"] or 0))
    return by_tpl


def _load_table(name: str) -> list[dict]:
    try:
        return load_json(EXCEL_DIR / f"{name}.json")
    except FileNotFoundError:
        return []


def _activity_name_ref(ref: Any) -> Any:
    key = text_key_of(ref)
    if not key:
        return ""
    composer = lambda tm, k=key: clean_text(tm.get(k, ""), dict(tm)).strip("「」")  # noqa: E731 —— 按值绑定键
    return composed_ref(f"composed:actname:{key}", composer, composer(current_textmap()))


def _activity_panel_names() -> dict[int, str]:
    out: dict[int, str] = {}
    for rec in _load_table("ActivityPanel"):
        pid = rec.get("PanelID")
        name = _activity_name_ref(rec.get("TitleName") or {})
        if pid is not None and name:
            out[pid] = name
    return out


def _panel_name_for(module_id: object, panels: dict[int, str]) -> str:
    if not isinstance(module_id, int):
        return ""
    text = str(module_id)
    best = ""
    for pid in panels:
        key = str(pid)
        if text.startswith(key) and len(key) > len(best):
            best = key
    return panels.get(int(best), "") if best else ""


def load_activity_stage_names() -> dict[str, dict[int, dict]]:
    panels = _activity_panel_names()
    festival = {
        (p.get("UIPrefab") or "").rsplit("/", 1)[-1].replace("Panel.prefab", ""): _activity_name_ref(
            p.get("TitleName") or {}
        )
        for p in _load_table("ActivityPanel")
    }
    tv_stage = {r.get("TelevisionID"): r for r in _load_table("ActivityTelevisionStage")}
    tv_key = {r.get("EventID"): r.get("TelevisionID") for r in _load_table("ActivityTelevisionLevel")}
    summon_group = {r.get("GroupID"): r for r in _load_table("ActivitySummonGroup")}
    summon_key = {r.get("EventID"): r.get("GroupID") for r in _load_table("ActivitySummonLevel")}
    star_group = {r.get("GroupID"): r for r in _load_table("ActivityStarFightGroup")}
    star_key = {r.get("EventID"): r.get("GroupID") for r in _load_table("StarFightStageConfig")}

    def entry(name: str, activity: str = "") -> dict:
        return {"name": name, "activity": activity}

    def chain(keys: dict, rows: dict, name_field: str, event_field: str = "EventID") -> dict[int, dict]:
        out: dict[int, dict] = {}
        for event, key in keys.items():
            row = rows.get(key)
            name = resolve_text(row.get(name_field, {})) if row else ""
            if name:
                out[event] = entry(name, _panel_name_for(row.get("ActivityModuleID"), panels))
        return out

    return {
        "FightFest": {
            r.get("EventID"): entry(
                resolve_text(r.get("ChallengeName", {})), festival.get("FightFest", "")
            )
            for r in _load_table("FightFestStageInfo")
        },
        "ElationActivity": {
            r.get("EventID"): entry(resolve_text(r.get("StageName", {})))
            for r in _load_table("ElationBattleLevel")
        },
        "TelevisionActivity": chain(tv_key, tv_stage, "StageName"),
        "SummonActivity": chain(summon_key, summon_group, "StageName"),
        "BoxingClub": {
            r.get("EventID"): entry(resolve_text(r.get("Name", {})))
            for r in _load_table("BoxingClubStage")
        },
        "StarFightActivity": chain(star_key, star_group, "GroupTitle"),
    }


def _absorb_id_names(out: dict[int, dict], table: str, key: str, allowed: set[str],
                     stage_types: dict[int, str], name_field: str = "Name") -> None:
    for rec in _load_table(table):
        sid = rec.get(key)
        name = resolve_text(rec.get(name_field, {}))
        if name and isinstance(sid, int) and stage_types.get(sid) in allowed:
            out[sid] = {"name": name, "activity": ""}


def _absorb_list_names(out: dict[int, dict], table: str, fields: tuple[str, ...], allowed: set[str],
                       stage_types: dict[int, str], name_field: str = "Name") -> None:
    for rec in _load_table(table):
        name = resolve_text(rec.get(name_field, {}))
        if not name:
            continue
        for field in fields:
            for sid in rec.get(field) or []:
                if isinstance(sid, int) and stage_types.get(sid) in allowed:
                    out[sid] = {"name": name, "activity": ""}


def _absorb_entrance_names(out: dict[int, dict], table: str, stage_field: str,
                           mapping: dict, allowed: set[str], stage_types: dict[int, str]) -> None:
    for rec in _load_table(table):
        name = mapping.get(rec.get("MappingInfoID"))
        if not name:
            continue
        raw = rec.get(stage_field)
        for sid in raw if isinstance(raw, list) else [raw]:
            if isinstance(sid, int) and stage_types.get(sid) in allowed:
                out[sid] = {"name": name, "activity": ""}


def load_player_stage_names(stage_types: dict[int, str]) -> dict[int, dict]:
    names: dict[int, dict] = {}
    activity = load_activity_stage_names()
    for sid, stype in stage_types.items():
        book = activity.get(stype)
        entry = (book.get(sid // 10) or book.get(sid)) if book else None
        if entry and entry["name"]:
            names[sid] = {"name": entry["name"], "activity": entry["activity"]}
    for table in ("ChallengeMazeConfig", "ChallengeStoryMazeConfig", "ChallengeBossMazeConfig"):
        _absorb_list_names(names, table, ("EventIDList1", "EventIDList2"), {"Challenge"}, stage_types)
    _absorb_list_names(names, "ChallengePeakConfig", ("EventIDList",), {"Challenge"}, stage_types)
    mapping = {
        r.get("ID"): resolve_text(r.get("Name", {}))
        for r in _load_table("MappingInfo")
    }
    _absorb_entrance_names(names, "CocoonConfig", "StageIDList", mapping, {"Cocoon"}, stage_types)
    _absorb_entrance_names(names, "FarmElementConfig", "StageID", mapping, {"FarmElement"}, stage_types)
    _absorb_id_names(names, "StrongChallengeStage", "EventID", {"StrongChallengeActivity"}, stage_types)
    _absorb_id_names(names, "SwordTrainingExam", "StageID", {"SwordTraining"}, stage_types, "EnemyName")
    return names


def load_appearances(sample_kinds: int = 3) -> dict[int, dict]:
    stages = load_json(EXCEL_DIR / "StageConfig.json")
    configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    stage_types = {r.get("StageID"): (r.get("StageType") or "") for r in stages}
    names = load_player_stage_names({k: v for k, v in stage_types.items() if k is not None})
    id2tpl: dict[int, int] = {}
    summons: dict[int, list] = {}
    for rec in configs:
        mid = rec.get("MonsterID")
        if mid is None:
            continue
        tpl = rec.get("MonsterTemplateID")
        if tpl is not None:
            id2tpl[mid] = tpl
        summons[mid] = list(rec.get("SummonIDList") or [])

    total: dict[int, int] = {}
    samples: dict[int, list[dict]] = {}
    for rec in stages:
        sid = rec.get("StageID")
        stype = rec.get("StageType") or ""
        named = names.get(sid) or {}
        name = named.get("name", "")
        tpls: set[int] = set()
        for wave in rec.get("MonsterList") or []:
            for mid in wave.values():
                if not mid:
                    continue
                tpl = id2tpl.get(mid)
                if tpl is not None:
                    tpls.add(tpl)
                for sm in summons.get(mid, []):
                    stpl = id2tpl.get(sm)
                    if stpl is not None:
                        tpls.add(stpl)
        for tpl in tpls:
            total[tpl] = total.get(tpl, 0) + 1
            book = samples.setdefault(tpl, [])
            if (
                name
                and len(book) < sample_kinds
                and all(s["type"] != stype and s["name"] != name for s in book)
            ):
                sample = {"id": sid, "name": name, "type": stype}
                if named.get("activity"):
                    sample["activity"] = named["activity"]
                sample.update(_stage_context(rec))
                book.append(sample)

    return {
        tpl: {
            "total": n,
            "samples": [
                {
                    "id": s["id"],
                    "name": s["name"],
                    **({"activity": s["activity"]} if s.get("activity") else {}),
                    **({k: s[k] for k in ("level", "level_group", "elite_group") if k in s}),
                }
                for s in samples.get(tpl, [])
            ],
        }
        for tpl, n in total.items()
    }


def load_phases() -> dict[int, list[dict]]:
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    group_of = {
        r.get("MonsterTemplateID"): r.get("TemplateGroupID")
        for r in templates if r.get("MonsterTemplateID") is not None
    }
    by_group: dict[int, list[dict]] = {}
    seen: set[tuple] = set()
    for table in ("MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json"):
        for rec in load_json(EXCEL_DIR / table):
            gid, pid = rec.get("TemplateGroupID"), rec.get("PhaseID")
            if gid is None or pid is None or (gid, pid) in seen:
                continue
            seen.add((gid, pid))
            entry = {
                "phase_id": pid,
                "weak": list(dict.fromkeys(rec.get("StanceWeakList") or [])),
                "resist": {
                    x["DamageType"]: _frac(x.get("Value"))
                    for x in (rec.get("DamageTypeResistance") or [])
                    if x.get("DamageType")
                },
            }
            name = resolve_text(rec.get("MonsterName", {}))
            intro = resolve_text(rec.get("MonsterIntroduction", {}))
            if name:
                entry["name"] = name
            if intro:
                entry["intro"] = intro
            by_group.setdefault(gid, []).append(entry)

    out: dict[int, list[dict]] = {}
    for tpl, gid in group_of.items():
        rows = by_group.get(gid)
        if rows:
            out[tpl] = sorted(rows, key=lambda r: r["phase_id"])
    return out


def load_skill_extra_effects() -> dict[int, list[dict]]:
    effects: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "ExtraEffectConfig.json"):
        eid = rec.get("ExtraEffectID")
        if eid is None:
            continue
        name = resolve_text(rec.get("ExtraEffectName", {}))
        if not name:
            continue
        effects[eid] = {
            "id": eid,
            "name": name,
            "desc": resolve_text(rec.get("ExtraEffectDesc", {})),
            "param_list": [unwrap_value(p) for p in (rec.get("DescParamList") or [])],
        }
    out: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterSkillConfig.json"):
        sid = rec.get("SkillID")
        if sid is None:
            continue
        rows = [effects[x] for x in (rec.get("ExtraEffectIDList") or []) if x in effects]
        if rows:
            out[sid] = rows
    return out


def _family_token(path: str) -> str:
    name = (path or "").rsplit("/", 1)[-1]
    for suf in (".json", ".prefab"):
        if name.endswith(suf):
            name = name[: -len(suf)]
    if name.endswith("_Config"):
        name = name[: -len("_Config")]
    for pre in ("Manikin_", "GridFight_"):
        if name.startswith(pre):
            name = name[len(pre):]
    return name


def _base_name(name: str) -> str:
    return re.sub(r"[（(][^）)]*[）)]", "", name or "").strip()


def load_statuses() -> dict[int, list[dict]]:
    templates = load_json(EXCEL_DIR / "MonsterTemplateConfig.json")
    name_of: dict[int, str] = {}
    tok2tpl: dict[str, set[int]] = {}
    for rec in templates:
        mid = rec.get("MonsterTemplateID")
        name = resolve_text(rec.get("MonsterName", {}))
        if mid is None or not name:
            continue
        name_of[mid] = name
        for field in ("JsonConfig", "PrefabPath", "ManikinConfigPath"):
            tok = _family_token(rec.get(field, ""))
            if len(tok) >= 6:
                tok2tpl.setdefault(tok, set()).add(mid)

    by_tpl: dict[int, list[dict]] = {}
    for rec in load_json(EXCEL_DIR / "MonsterStatusConfig.json"):
        mod = rec.get("ModifierName") or ""
        sid = rec.get("StatusID")
        if not mod or sid is None:
            continue
        name = resolve_text(rec.get("StatusName", {}))
        if not name:
            continue
        cands = [(len(tok), tok) for tok in tok2tpl if tok in mod]
        if not cands:
            continue
        best = max(cands)[0]
        tpls: set[int] = set()
        for ln, tok in cands:
            if ln == best:
                tpls |= tok2tpl[tok]
        if len({_base_name(name_of[m]) for m in tpls}) != 1:
            continue
        entry: dict = {"id": sid, "name": name, "type": rec.get("StatusType", "") or ""}
        if rec.get("CanDispel"):
            entry["dispel"] = True
        desc = resolve_text(rec.get("StatusDesc", {}))
        if desc and not re.search(r"#\d|%[A-Za-z]", desc):
            entry["desc"] = desc
        for m in tpls:
            by_tpl.setdefault(m, []).append(dict(entry))
    for rows in by_tpl.values():
        rows.sort(key=lambda r: r["id"])
        seen: set[tuple] = set()
        kept: list[dict] = []
        for r in rows:
            sig = (r["name"], r["type"], r.get("desc", ""), bool(r.get("dispel")))
            if sig in seen:
                continue
            seen.add(sig)
            kept.append(r)
        rows[:] = kept
    return by_tpl


def load_event_sources() -> dict[int, dict]:
    try:
        panels = load_json(EXCEL_DIR / "ActivityPanel.json")
        rewards = load_json(EXCEL_DIR / "ActivityQuestRewardData.json")
        stages = load_json(EXCEL_DIR / "StageConfig.json")
        configs = load_json(EXCEL_DIR / "MonsterConfig.json")
    except FileNotFoundError:
        return {}

    panels_by_token: dict[str, dict] = {}
    for p in panels:
        token = (p.get("UIPrefab") or "").rsplit("/", 1)[-1].replace("Panel.prefab", "")
        name = _activity_name_ref(p.get("TitleName") or {})
        if token and name:
            panels_by_token[token] = {"panel_id": p.get("PanelID"), "name": name}

    id2tpl = {c.get("MonsterID"): c.get("MonsterTemplateID") for c in configs}
    out: dict[int, dict] = {}
    for st in stages:
        panel = panels_by_token.get(st.get("StageType") or "")
        if not panel:
            continue
        ids: list[int] = []
        for wave in st.get("MonsterList") or []:
            if isinstance(wave, dict):
                ids.extend(v for k, v in wave.items() if k.startswith("Monster") and isinstance(v, int))
        levels = st.get("Level")
        for i in ids:
            tpl = id2tpl.get(i, i)
            if tpl not in out:
                out[tpl] = {"name": panel["name"], "tabs": [], "levels": [], "count": 0}
            rec = out[tpl]
            rec["count"] += 1
            if isinstance(levels, int) and levels not in rec["levels"]:
                rec["levels"].append(levels)
    for rec in out.values():
        rec["levels"].sort()
    for r in rewards:
        module = str(r.get("ActivityModuleID") or "")
        for panel in panels_by_token.values():
            if module.startswith(str(panel["panel_id"])):
                tab = _activity_name_ref(r.get("QuestTabName") or {})
                for rec in out.values():
                    if rec["name"] == panel["name"] and tab and tab not in rec["tabs"]:
                        rec["tabs"].append(tab)
    return out


def _frac(value: object) -> float:
    depth = 0
    while isinstance(value, dict) and depth < 4:
        value = value.get("Value")
        depth += 1
    return float(value) if isinstance(value, (int, float)) else 0.0
