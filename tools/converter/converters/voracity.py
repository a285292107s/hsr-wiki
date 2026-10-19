import logging
import re
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json, unwrap_value
from converters.monster_common import load_monsters

logger = logging.getLogger("converter")

_PANEL_ID = 10190
_SCORE_CONST_NAME = "Activity_TantaoInvasion_Score"
_TUTORIAL_IDS = (1050101, 1050201, 1050202)
_AFFIX_DESC_KEYWORDS = ("位面", "被贪饕侵蚀")
_STATUS_MODIFIER_KEYWORDS = ("Gluttony", "StageInvasion")
_BUFF_STATUS_PREFIX = "MCommon_Gluttony_BUFF_LV"
_UNLOCK_MISSION_RE = re.compile(r"FinishMainMission:(\d+)")
_SCOPE_TABLES = (
    ("maze", "ChallengeMazeConfig.json", "ChallengeGroupConfig.json",
     "ChallengeMazeTierce.json"),
    ("story", "ChallengeStoryMazeConfig.json", "ChallengeStoryGroupConfig.json",
     "ChallengeStoryMazeTierce.json"),
    ("boss", "ChallengeBossMazeConfig.json", "ChallengeBossGroupConfig.json",
     "ChallengeBossMazeTierce.json"),
)


def _text(ref: Any) -> str:
    return resolve_text(ref)


def _strip_icon(path: str) -> str:
    return path.removeprefix("SpriteOutput/").removesuffix(".png") if path else ""


def _parse_unlock_mission_id(conditions: str) -> int | None:
    match = _UNLOCK_MISSION_RE.search(conditions or "")
    return int(match.group(1)) if match else None


def _int_values(value: Any) -> list[int]:
    items = value.get("ArrayValue") if isinstance(value, dict) else None
    if not isinstance(items, list):
        return []
    out: list[int] = []
    for item in items:
        unwrapped = unwrap_value(item)
        if isinstance(unwrapped, dict):
            unwrapped = unwrapped.get("IntValue")
        if isinstance(unwrapped, (int, float)):
            out.append(unwrapped)
    return out


def _score_values(rows: list[dict]) -> list[int]:
    for rec in rows:
        if rec.get("ConstValueName") == _SCORE_CONST_NAME:
            return _int_values(rec.get("Value"))
    logger.warning("ConstValueCommon 缺 %s，愿力分档输出空数组", _SCORE_CONST_NAME)
    return []


def _progress_steps(rows: list[dict]) -> list[dict]:
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("RedPoint") or 0):
        entry: dict = {"progress": rec.get("ActivityProgress")}
        desc = _text(rec.get("ProgressDes", {}))
        if desc:
            entry["desc"] = desc
        out.append(entry)
    return out


def _status_index(rows: list[dict]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for rec in rows:
        modifier = rec.get("ModifierName") or ""
        if not modifier:
            continue
        out.setdefault(modifier, {
            "name": _text(rec.get("StatusName", {})),
            "desc": _text(rec.get("StatusDesc", {})),
        })
    return out


def _load_maze_buffs() -> dict[int, dict]:
    out: dict[int, dict] = {}
    for rec in load_json(EXCEL_DIR / "MazeBuff.json"):
        bid = rec.get("ID")
        if bid is None:
            continue
        out[bid] = {
            "name": _text(rec.get("BuffName", {})),
            "desc": _text(rec.get("BuffDesc", {})),
            "param_list": [unwrap_value(p) for p in (rec.get("ParamList") or [])],
            "icon": _strip_icon(rec.get("BuffIcon") or ""),
            "binding": rec.get("InBattleBindingKey") or "",
        }
    return out


def _buff_levels(
    rows: list[dict], maze_buffs: dict[int, dict], status_index: dict[str, dict]
) -> list[dict]:
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("BuffLevel") or 0):
        level, bid = rec.get("BuffLevel"), rec.get("BuffID")
        if level is None or bid is None:
            continue
        buff = maze_buffs.get(bid) or {}
        fallback = status_index.get(f"{_BUFF_STATUS_PREFIX}{level}") or {}
        entry: dict = {"level": level, "buff_id": bid}
        name = buff.get("name") or fallback.get("name") or ""
        desc = buff.get("desc") or fallback.get("desc") or ""
        if name:
            entry["name"] = name
        if desc:
            entry["desc"] = desc
        entry["param_list"] = buff.get("param_list", [])
        if buff.get("icon"):
            entry["icon"] = buff["icon"]
        entry["progress_percent"] = rec.get("ProgressPercent")
        out.append(entry)
    return out


def _invasion_levels(rows: list[dict], maze_buffs: dict[int, dict]) -> list[dict]:
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("InvasionID") or 0):
        invasion_id, bid = rec.get("InvasionID"), rec.get("MazeBuffID")
        if invasion_id is None:
            continue
        buff = maze_buffs.get(bid) or {}
        entry: dict = {"invasion_id": invasion_id}
        if bid is not None:
            entry["maze_buff_id"] = bid
        desc = _text(rec.get("InvasionDesc", {}))
        if desc:
            entry["desc"] = desc
        entry["param_list"] = buff.get("param_list", [])
        if buff.get("binding"):
            entry["binding"] = buff["binding"]
        if buff.get("icon"):
            entry["icon"] = buff["icon"]
        out.append(entry)
    return out


def _resolve_detail_id(
    instance_id: int, template_by_instance: dict[int, int], known_detail_ids: set[int]
) -> int | None:
    template_id = template_by_instance.get(instance_id)
    if template_id in known_detail_ids:
        return template_id
    if instance_id in known_detail_ids:
        return instance_id
    return None


def _scope_index() -> dict[int, list[dict]]:
    out: dict[int, list[dict]] = {}
    for mode, table, group_table, tierce_table in _SCOPE_TABLES:
        names = {
            rec.get("GroupID"): _text(rec.get("GroupName", {}))
            for rec in load_json(EXCEL_DIR / group_table)
        }
        for rec in load_json(EXCEL_DIR / table):
            gid = rec.get("GroupID")
            season_name = names.get(gid, "")
            if not season_name:
                continue
            floor = rec.get("Floor")
            title = _text(rec.get("Name", {}))
            for half, key in (("stage1", "EventIDList1"), ("stage2", "EventIDList2")):
                for stage_id in rec.get(key) or []:
                    node: dict = {
                        "mode": mode,
                        "season_id": str(gid) if gid is not None else "",
                        "season_name": season_name,
                        "half": half,
                    }
                    if floor:
                        node["floor"] = floor
                    if title:
                        node["title"] = title
                    out.setdefault(stage_id, []).append(node)
        gid_by_record = {
            rec.get("ID"): rec.get("GroupID")
            for rec in load_json(EXCEL_DIR / table)
        }
        for rec in load_json(EXCEL_DIR / tierce_table):
            gid = gid_by_record.get(rec.get("DLCKKJFMJOB"))
            season_name = names.get(gid, "")
            if not season_name:
                continue
            for stage_id in rec.get("HFIAAGAKFMD") or []:
                out.setdefault(stage_id, []).append({
                    "mode": mode,
                    "season_id": str(gid) if gid is not None else "",
                    "season_name": season_name,
                    "half": "tierce",
                })

    groups = load_json(EXCEL_DIR / "ChallengePeakGroupConfig.json")
    peak_names = {rec.get("ID"): _text(rec.get("Title", {})) for rec in groups}
    level_group: dict[int, int] = {}
    for rec in groups:
        gid = rec.get("ID")
        for lid in rec.get("PreLevelIDList") or []:
            level_group[lid] = gid
        boss_id = rec.get("BossLevelID")
        if boss_id is not None:
            level_group[boss_id] = gid
    for rec in load_json(EXCEL_DIR / "ChallengePeakConfig.json"):
        gid = level_group.get(rec.get("ID"))
        season_name = peak_names.get(gid, "")
        if not season_name:
            continue
        title = _text(rec.get("Title", {}))
        for stage_id in rec.get("EventIDList") or []:
            node: dict = {
                "mode": "peak",
                "season_id": str(gid) if gid is not None else "",
                "season_name": season_name,
                "half": "level",
            }
            if title:
                node["title"] = title
            out.setdefault(stage_id, []).append(node)

    for nodes in out.values():
        nodes.sort(key=lambda n: (n["mode"], n["season_id"], n.get("floor", 0),
                                  n.get("half", "")))
    return out


def _invasion_index(monsters: dict[int, dict]) -> tuple[list[dict], dict[int, dict]]:
    rows = load_json(EXCEL_DIR / "StageInvasionConfig.json")
    scopes = _scope_index()
    template_by_instance = {
        rec.get("MonsterID"): rec.get("MonsterTemplateID")
        for rec in load_json(EXCEL_DIR / "MonsterConfig.json")
        if rec.get("MonsterID") is not None and rec.get("MonsterTemplateID") is not None
    }
    known = set(monsters)
    stages: list[dict] = []
    usage: dict[int, dict] = {}
    for rec in sorted(rows, key=lambda r: r.get("StageID") or 0):
        stage_id = rec.get("StageID")
        if stage_id is None:
            continue
        invasion_id = rec.get("InvasionID")
        entries: list[dict] = []
        seen: set[int] = set()
        for item in rec.get("MonsterInvasionList") or []:
            monster_id = item.get("DBLDCKODNEN")
            if monster_id is None:
                continue
            detail_id = _resolve_detail_id(monster_id, template_by_instance, known)
            entry: dict = {"monster_id": monster_id, "detail_id": detail_id}
            info = monsters.get(detail_id) if detail_id is not None else None
            if info:
                entry["name"] = info["name"]
                entry["icon"] = info["icon"]
            entries.append(entry)
            if detail_id is None or detail_id in seen:
                continue
            seen.add(detail_id)
            node = usage.setdefault(detail_id, {"invasion_ids": [], "stages": []})
            if invasion_id is not None and invasion_id not in node["invasion_ids"]:
                node["invasion_ids"].append(invasion_id)
            if stage_id not in node["stages"]:
                node["stages"].append(stage_id)
        stages.append({
            "stage_id": stage_id,
            "invasion_id": invasion_id,
            "scopes": scopes.get(stage_id, []),
            "monsters": entries,
        })
    for node in usage.values():
        node["invasion_ids"].sort()
        node["stages"].sort()
    return stages, usage


def load_invasion_map(monsters: dict[int, dict]) -> dict[int, dict]:
    return _invasion_index(monsters)[1]


def _buff_params_by_level(rows: list[dict], maze_buffs: dict[int, dict]) -> dict[int, list]:
    out: dict[int, list] = {}
    for rec in rows:
        level, bid = rec.get("BuffLevel"), rec.get("BuffID")
        if level is None or bid is None:
            continue
        out[level] = (maze_buffs.get(bid) or {}).get("param_list", [])
    return out


def _buff_level(modifier: str) -> int | None:
    suffix = modifier.removeprefix(_BUFF_STATUS_PREFIX)
    return int(suffix) if suffix != modifier and suffix.isdigit() else None


def _status_entries(rows: list[dict], buff_params_by_level: dict[int, list]) -> list[dict]:
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("StatusID") or 0):
        modifier = rec.get("ModifierName") or ""
        if not any(keyword in modifier for keyword in _STATUS_MODIFIER_KEYWORDS):
            continue
        entry: dict = {"status_id": rec.get("StatusID")}
        name = _text(rec.get("StatusName", {}))
        if name:
            entry["name"] = name
        status_type = rec.get("StatusType") or ""
        if status_type:
            entry["type"] = status_type
        desc = _text(rec.get("StatusDesc", {}))
        if desc:
            entry["desc"] = desc
        entry["param_list"] = buff_params_by_level.get(_buff_level(modifier), [])
        icon = _strip_icon(rec.get("StatusIconPath") or "")
        if icon:
            entry["icon"] = icon
        entry["modifier"] = modifier
        entry["can_dispel"] = bool(rec.get("CanDispel"))
        out.append(entry)
    return out


def _tutorial_entries(rows: list[dict]) -> list[dict]:
    by_id = {rec.get("ID"): rec for rec in rows if rec.get("ID") is not None}
    out: list[dict] = []
    for tutorial_id in _TUTORIAL_IDS:
        rec = by_id.get(tutorial_id)
        if rec is None:
            logger.warning("TutorialGuideData 缺 %s（教程条目跳过）", tutorial_id)
            continue
        entry: dict = {"id": tutorial_id}
        image = _strip_icon(rec.get("ImagePath") or "")
        if image:
            entry["image"] = image
        desc = _text(rec.get("DescText", {}))
        if desc:
            entry["desc"] = desc
        out.append(entry)
    return out


def _affix_entries(rows: list[dict]) -> list[dict]:
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("ID") or 0):
        desc = _text(rec.get("AffixDesc", {}))
        if not all(keyword in desc for keyword in _AFFIX_DESC_KEYWORDS):
            continue
        entry: dict = {"id": rec.get("ID")}
        name = _text(rec.get("AffixName", {}))
        if name:
            entry["name"] = name
        if desc:
            entry["desc"] = desc
        icon = rec.get("IconPath") or ""
        if icon:
            entry["icon"] = icon
        entry["params"] = [unwrap_value(p) for p in (rec.get("EffectParamList") or [])]
        out.append(entry)
    return out


def _activity(
    panels: list[dict],
    score_rows: list[dict],
    pro_rows: list[dict],
    buf_rows: list[dict],
    maze_buffs: dict[int, dict],
    status_index: dict[str, dict],
) -> dict | None:
    panel = next((rec for rec in panels if rec.get("PanelID") == _PANEL_ID), None)
    if panel is None:
        logger.warning("ActivityPanel 缺 PanelID %s（activity 块跳过）", _PANEL_ID)
        return None
    entry: dict = {"panel_id": _PANEL_ID}
    name = _text(panel.get("TabName", {})) or _text(panel.get("TitleName", {}))
    if name:
        entry["name"] = name
    intro = _text(panel.get("IntroDesc", {}))
    if intro:
        entry["intro"] = intro
    entry["unlock_mission_id"] = _parse_unlock_mission_id(panel.get("UnlockConditions") or "")
    entry["scores"] = _score_values(score_rows)
    entry["progress_steps"] = _progress_steps(pro_rows)
    entry["buff_levels"] = _buff_levels(buf_rows, maze_buffs, status_index)
    return entry


def convert() -> None:
    monsters = load_monsters()
    maze_buffs = _load_maze_buffs()
    status_rows = load_json(EXCEL_DIR / "StatusConfig.json")
    stages, _ = _invasion_index(monsters)
    buf_rows = load_json(EXCEL_DIR / "ActivityVoracityInvasionBuf.json")

    result: dict = {}
    activity = _activity(
        load_json(EXCEL_DIR / "ActivityPanel.json"),
        load_json(EXCEL_DIR / "ConstValueCommon.json"),
        load_json(EXCEL_DIR / "ActivityVoracityInvasionPro.json"),
        buf_rows,
        maze_buffs,
        _status_index(status_rows),
    )
    if activity is not None:
        result["activity"] = activity
    result["invasion"] = {
        "levels": _invasion_levels(
            load_json(EXCEL_DIR / "StageInvasionBuff.json"), maze_buffs),
        "stages": stages,
    }
    result["statuses"] = _status_entries(
        status_rows, _buff_params_by_level(buf_rows, maze_buffs))
    result["tutorials"] = _tutorial_entries(load_json(EXCEL_DIR / "TutorialGuideData.json"))
    result["affixes"] = _affix_entries(load_json(EXCEL_DIR / "GridFightAffixConfig.json"))
    save_json(result, OUTPUT_DIR / "voracity.json")
