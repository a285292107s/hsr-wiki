"""贪饕侵蚀/污染体系转换器（活动与愿力 / 关卡侵蚀 / 状态词条 / 教程图文 / 位面词条）。

输出 public/data/cn/voracity.json 单文件。上游形态（代码与数据推不出）：
- StageInvasionConfig.MonsterInvasionList[].DBLDCKODNEN = 实例怪物 ID，经 MonsterConfig
  的 MonsterID → MonsterTemplateID 归一为详情 ID；归一不到即 detail_id: null。
- MazeBuff 3034xxx 的 BuffName/BuffDesc 在 TextMapCHS 未命中 → 名称/描述回退
  StatusConfig 的 MCommon_Gluttony_BUFF_LV*；两处都空即省略字段，不落空串占位。
- ConstValueCommon.Value 是 ArrayValue[].IntValue 包装（非 {Value: x}）。
- ActivityVoracityInvasionPro 首档无 ActivityProgress → progress: null。
- 状态词条的 #N 参数在 ExcelOutput 内无数值源：StatusConfig.ReadParamList 只是 MDF_* 参数名，
  实际值在 Config/Level/** 的 Modifier/Ability 配置。玩家支援三条状态按档位借 MazeBuff
  3034011–3034013 的 ParamList 补参；其余状态 param_list 为显式空数组——空数组即表示本域
  无数值源，其 #N 描述无法完整展开时消费方整段省略（不展示半截占位）。
- 教程图文按登记 ID 清单选取：上游新增教程不会自动收录，需在此登记。
- GridFightAffixConfig 无位面字段，侵蚀位面词条按 AffixDesc 文案判定（须同时含「位面」与
  「被贪饕侵蚀」——只按后者会多收随从强化词条）。
- 图标路径口径按消费方分族，不统一：affixes[].icon 与源表 IconPath 同形（完整路径，含
  SpriteOutput/ 前缀与 .png 后缀，消费方 gridFightIconUrl）；invasion.levels / activity.buff_levels
  / statuses 的 icon、tutorials[].image、stages[].monsters[].icon 为去前缀去后缀的相对路径
  （消费方 buffIconUrl / tutorialPicUrl / monsterIconUrl）。
- stages[].scopes = 该污染关卡所属的终局赛季与位置，由本模块自读四张关卡表 + 四张分组表算出
  （ADR 0026；不读 endgame 产物，避免隐式模块顺序）。关卡 ID 与赛季的对应**不在**
  StageInvasionConfig 内，必须 join EventIDList1/2（异相仲裁 EventIDList）；同一关卡可属多赛季。
"""

import logging
import re
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, resolve_text
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
# 污染关卡的作用域来源：(mode, 关卡表, 分组表, 星启表)；模式 key 与前端 ENDGAME_MODES 一致
_SCOPE_TABLES = (
    ("maze", "ChallengeMazeConfig.json", "ChallengeGroupConfig.json",
     "ChallengeMazeTierce.json"),
    ("story", "ChallengeStoryMazeConfig.json", "ChallengeStoryGroupConfig.json",
     "ChallengeStoryMazeTierce.json"),
    ("boss", "ChallengeBossMazeConfig.json", "ChallengeBossGroupConfig.json",
     "ChallengeBossMazeTierce.json"),
)


def _text(ref: Any) -> str:
    """文本引用 → 清洗后正文（剥除 color/unbreak 标签，保留 #N[i] 占位符）。"""
    return clean_text(resolve_text(ref))


def _strip_icon(path: str) -> str:
    """SpriteOutput/ 前缀与 .png 后缀剥除 → 相对路径（buffIcon / tutorialPic / monsterIcon 消费方）。

    位面词条图标不走本函数（消费方 gridFightIconUrl 要完整路径，见模块头）。
    """
    return path.removeprefix("SpriteOutput/").removesuffix(".png") if path else ""


def _parse_unlock_mission_id(conditions: str) -> int | None:
    """UnlockConditions 形如 "[FinishMainMission:4010121]" → 任务 ID；非任务条件返回 None。"""
    match = _UNLOCK_MISSION_RE.search(conditions or "")
    return int(match.group(1)) if match else None


def _int_values(value: Any) -> list[int]:
    """ConstValueCommon.Value → 数值数组（ArrayValue[].IntValue 包装）。"""
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
    """愿力分档：ConstValueCommon 中 Activity_TantaoInvasion_Score 的整数数组。"""
    for rec in rows:
        if rec.get("ConstValueName") == _SCORE_CONST_NAME:
            return _int_values(rec.get("Value"))
    logger.warning("ConstValueCommon 缺 %s，愿力分档输出空数组", _SCORE_CONST_NAME)
    return []


def _progress_steps(rows: list[dict]) -> list[dict]:
    """愿力进度档：按 RedPoint 升序；无 ActivityProgress 的档位 progress 为 null。"""
    out: list[dict] = []
    for rec in sorted(rows, key=lambda r: r.get("RedPoint") or 0):
        entry: dict = {"progress": rec.get("ActivityProgress")}
        desc = _text(rec.get("ProgressDes", {}))
        if desc:
            entry["desc"] = desc
        out.append(entry)
    return out


def _status_index(rows: list[dict]) -> dict[str, dict]:
    """StatusConfig → {ModifierName: {name, desc}}（MazeBuff 文本未命中时的回退源）。"""
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
    """MazeBuff → {ID: {name, desc, param_list, icon, binding}}。

    与 endgame._load_maze_buffs 的差异：不丢弃名称未命中的记录——贪饕侵蚀批次的
    BuffName/BuffDesc 在上游 TextMap 缺失，名称回退由调用方完成。
    """
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
    """愿力支援档：ActivityVoracityInvasionBuf join MazeBuff，名称/描述缺失时回退同档 StatusConfig。"""
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
    """侵蚀等级：StageInvasionBuff（描述）join MazeBuff（参数 / 终局战斗绑定键 / 图标）。"""
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
    """实例怪物 ID → 详情 ID（图鉴键集内的模板 ID）；未注册返回 None。"""
    template_id = template_by_instance.get(instance_id)
    if template_id in known_detail_ids:
        return template_id
    if instance_id in known_detail_ids:
        return instance_id
    return None


def _scope_index() -> dict[int, list[dict]]:
    """污染关卡 → 所属终局赛季与位置（ADR 0026；本模块自读关卡表，不读 endgame 产物）。

    三张层级表按 EventIDList1/2 命中，位置为 (floor, half=stage1/stage2)；星启附加关
    （Tierce 的 HFIAAGAKFMD）位置为 half=tierce，赛季由 DLCKKJFMJOB 反查；异相仲裁
    按 ChallengePeakConfig.EventIDList 命中，位置为 (half=level)，赛季 = 期 GroupID
    （关卡 ID → 期 由 ChallengePeakGroupConfig 的 PreLevelIDList/BossLevelID 反查）。
    同一关卡可被多个赛季引用（如 420533 同属 3021/3022），故每关作用域为**列表**。
    赛季名缺省的未发布赛季不输出作用域（与目录页 `!info.zh → 跳过` 同判据），
    避免把站内尚不可见的赛季写成可达链接。
    """
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
    """StageInvasionConfig × 图鉴键集 → (关卡清单, {详情 ID: 侵入归属})。

    关卡清单按 StageID 升序，怪物带名称与图标（详情 ID 未命中图鉴时省略两者）；
    侵入归属的 invasion_ids / stages 升序去重，供怪物详情页标记直接消费。
    scopes 为该关卡所属的终局赛季与位置（见 _scope_index，ADR 0026）。
    """
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
    """{详情 ID: {invasion_ids, stages}}（monster_detail 的 invaded 块与专题页共用同一解析）。"""
    return _invasion_index(monsters)[1]


def _buff_params_by_level(rows: list[dict], maze_buffs: dict[int, dict]) -> dict[int, list]:
    """ActivityVoracityInvasionBuf 的档位 → MazeBuff 参数（状态词条按档位补参）。"""
    out: dict[int, list] = {}
    for rec in rows:
        level, bid = rec.get("BuffLevel"), rec.get("BuffID")
        if level is None or bid is None:
            continue
        out[level] = (maze_buffs.get(bid) or {}).get("param_list", [])
    return out


def _buff_level(modifier: str) -> int | None:
    """MCommon_Gluttony_BUFF_LV{N} → N；非该前缀或后缀非数字返回 None。"""
    suffix = modifier.removeprefix(_BUFF_STATUS_PREFIX)
    return int(suffix) if suffix != modifier and suffix.isdigit() else None


def _status_entries(rows: list[dict], buff_params_by_level: dict[int, list]) -> list[dict]:
    """状态词条：ModifierName 命中贪饕侵蚀关键字的全部记录，按 StatusID 升序。

    param_list 按档位借玩家支援 MazeBuff 参数（见模块头）；无档位或本域无源时为显式空数组。
    """
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
    """教程图文：按登记 ID 取图（去前缀/后缀）与说明。"""
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
    """位面词条：AffixDesc 文案命中「位面 + 贪饕侵蚀」的记录，按 ID 升序。

    icon 保持源表 IconPath 完整路径（消费方按完整路径取值，见模块头）。
    """
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
    """活动面板块：面板文案（TabName 优先、TitleName 回退）+ 愿力分档 / 进度 / 支援档。"""
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
    """转换贪饕侵蚀/污染数据 → public/data/cn/voracity.json。"""
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
