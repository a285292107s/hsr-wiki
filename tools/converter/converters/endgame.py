"""终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）转换器。

数据全部源自 vendor/TurnBasedGameData（与 CDN 同源，但走本地转换）：
- 忘却之庭：ChallengeMazeConfig（按 GroupID 分组，100+）
- 虚构叙事：ChallengeStoryMazeConfig（按 GroupID 分组，2001+）
- 末日幻影：ChallengeBossMazeConfig（按 GroupID 分组，3001+）
- 异相仲裁：ChallengePeakConfig（按 ID 分组，101+）

说明：
- 名称经 TextMap 解析（仅中文；en/ja/ko 源数据未提供，留空）。
- 排期：ScheduleDataChallengeMaze 提供赛季 BeginTime/EndTime。该表无显式外键，
  经 ID 结构推断映射：ScheduleID = 200000 + 赛季 GroupID（200101↔101 …
  201034↔1034），覆盖 maze.json 55 组中的 53 组。
  占位过滤：整段早于公测上线（2023-04-26，beta/测试占位）或起点年份 ≥2030
  （未来占位）的排期丢弃，避免误导赛季"未开始/进行中"状态。
  虚构叙事 / 末日幻影 / 异相仲裁无对应排期段，live_* 留空。
- 赛季统计：由组内全部层记录聚合（最大层数 / 阶段数 / 回合上限 / 弱点属性
  全层合并去重）；异相仲裁结构不同，仅提供弱点属性。
- param 字段前端未消费，置空数组以贴合结构。
"""

import logging
from collections import defaultdict
from datetime import datetime

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json

logger = logging.getLogger("converter")

# 公测上线时间：整段早于此时段的排期视为 beta/测试占位
_LAUNCH_TS = datetime(2023, 4, 26, 0, 0, 0)


def _load_schedules() -> dict[str, tuple[str, str]]:
    """读取赛季排期并按 GroupID 映射（ScheduleID - 200000 = GroupID）。

    过滤占位排期：整段早于公测上线（beta 占位）或起点年份 ≥2030（未来占位）。
    无排期的赛季（组 100 / 900 等）不进入结果。
    """
    data = load_json(EXCEL_DIR / "ScheduleDataChallengeMaze.json")
    out: dict[str, tuple[str, str]] = {}
    for rec in data:
        sid = rec.get("ID")
        begin = rec.get("BeginTime", "")
        end = rec.get("EndTime", "")
        if not sid or not begin or not end:
            continue
        try:
            bt = datetime.fromisoformat(begin.replace(" ", "T"))
            et = datetime.fromisoformat(end.replace(" ", "T"))
        except ValueError:
            continue
        if et < _LAUNCH_TS or bt.year >= 2030:
            continue
        out[str(sid - 200000)] = (begin, end)
    return out


def _season_stats(recs: list[dict]) -> dict:
    """聚合赛季统计：最大层数 / 阶段数 / 回合上限 / 弱点属性（全层合并去重）。"""
    floors = stage = countdown = 0
    damage: set[str] = set()
    for r in recs:
        floors = max(floors, r.get("Floor", 0) or 0)
        stage = max(stage, r.get("StageNum", 0) or 0)
        countdown = max(countdown, r.get("ChallengeCountDown", 0) or 0)
        for key in ("DamageType1", "DamageType2"):
            for d in r.get(key, []) or []:
                damage.add(d)
    return {
        "damage_types": sorted(damage),
        "floors": floors,
        "stage_num": stage,
        "countdown": countdown,
    }


def _group_seasons(filename: str, name_field: str, schedules: dict[str, tuple[str, str]]) -> dict:
    """读取挑战配置，按 GroupID 聚合为赛季条目（取首层代表记录）。"""
    data = load_json(EXCEL_DIR / filename)
    groups: dict[int, list] = defaultdict(list)
    for rec in data:
        gid = rec.get("GroupID")
        if gid is None:
            continue
        groups[gid].append(rec)

    result: dict[str, dict] = {}
    for gid, recs in groups.items():
        rep = min(recs, key=lambda r: r.get("ID", 0))
        live_begin, live_end = schedules.get(str(gid), ("", ""))
        entry = {
            "id": str(gid),
            "zh": resolve_text(rep.get(name_field, {})),
            "en": "",
            "ja": "",
            "ko": "",
            "param": [],
            "begin": "",
            "end": "",
            "live_begin": live_begin,
            "live_end": live_end,
        }
        entry.update(_season_stats(recs))
        result[str(gid)] = entry
    return result


def _peak_seasons() -> dict:
    """异相仲裁：按 ID 分组（源用 Title 而非 Name），仅弱点属性可聚合。"""
    data = load_json(EXCEL_DIR / "ChallengePeakConfig.json")
    result: dict[str, dict] = {}
    for rec in data:
        pid = rec.get("ID")
        if pid is None:
            continue
        result[str(pid)] = {
            "id": str(pid),
            "zh": resolve_text(rec.get("Title", {})),
            "en": "",
            "ja": "",
            "ko": "",
            "param": [],
            "begin": "",
            "end": "",
            "live_begin": "",
            "live_end": "",
            "damage_types": sorted(rec.get("DamageType", []) or []),
        }
    return result


def convert() -> None:
    schedules = _load_schedules()
    # 忘却之庭
    maze = _group_seasons("ChallengeMazeConfig.json", "Name", schedules)
    save_json(maze, OUTPUT_DIR / "maze.json")

    # 虚构叙事
    story = _group_seasons("ChallengeStoryMazeConfig.json", "Name", schedules)
    save_json(story, OUTPUT_DIR / "maze_extra.json")

    # 末日幻影
    boss = _group_seasons("ChallengeBossMazeConfig.json", "Name", schedules)
    save_json(boss, OUTPUT_DIR / "maze_boss.json")

    # 异相仲裁
    peak = _peak_seasons()
    save_json(peak, OUTPUT_DIR / "maze_peak.json")
