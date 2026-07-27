"""终局内容（忘却之庭 / 虚构叙事 / 末日幻影 / 异相仲裁）转换器。

数据全部源自 vendor/TurnBasedGameData（与 CDN 同源，但走本地转换）：
- 忘却之庭：ChallengeMazeConfig（按 GroupID 分组，100+）
- 虚构叙事：ChallengeStoryMazeConfig（按 GroupID 分组，2001+）
- 末日幻影：ChallengeBossMazeConfig（按 GroupID 分组，3001+）
- 异相仲裁：ChallengePeakConfig（按 ID 分组，101+）

说明：
- 名称经 TextMap 解析（仅中文；en/ja/ko 源数据未提供，留空）。
- 源数据中不存在"赛季 → 游戏版本"的时间线表，版本分组无法从源可靠重建，
  因此本转换器不生成 *-version.json；前端对四季统一按 ID 降序展示
  （与原站 story/boss 行为一致），季节标签显示为"未知"。
- 样本的 begin/end/live_* 本就为空（赛季状态恒为"未知"）；本转换器同样留空，
  避免源中占位未来日期（如 2033）误导赛季"未开始/进行中"状态。
- param 字段前端未消费，置空数组以贴合结构。
"""

import logging
from collections import defaultdict

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json

logger = logging.getLogger("converter")


def _group_seasons(filename: str, name_field: str) -> dict:
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
        result[str(gid)] = {
            "id": str(gid),
            "zh": resolve_text(rep.get(name_field, {})),
            "en": "",
            "ja": "",
            "ko": "",
            "param": [],
            "begin": "",
            "end": "",
            "live_begin": "",
            "live_end": "",
        }
    return result


def _peak_seasons() -> dict:
    """异相仲裁：按 ID 分组（源用 Title 而非 Name）。"""
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
        }
    return result


def convert() -> None:
    # 忘却之庭
    maze = _group_seasons("ChallengeMazeConfig.json", "Name")
    save_json(maze, OUTPUT_DIR / "maze.json")

    # 虚构叙事
    story = _group_seasons("ChallengeStoryMazeConfig.json", "Name")
    save_json(story, OUTPUT_DIR / "maze_extra.json")

    # 末日幻影
    boss = _group_seasons("ChallengeBossMazeConfig.json", "Name")
    save_json(boss, OUTPUT_DIR / "maze_boss.json")

    # 异相仲裁
    peak = _peak_seasons()
    save_json(peak, OUTPUT_DIR / "maze_peak.json")
