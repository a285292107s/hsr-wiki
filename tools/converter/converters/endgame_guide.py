import logging
import re
from collections import Counter
from typing import Any

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, save_json

logger = logging.getLogger("converter")

MODES = ("maze", "story", "boss", "peak")

INTRO_ID = {"maze": 2, "story": 115, "boss": 93, "peak": 167}

_BUFF_SYSTEM = {"maze": "记忆紊流", "story": "荒腔走板", "boss": "终焉公理", "peak": "裁决象限"}

_CHOICE = {"maze": "fixed", "story": "per_team", "boss": "per_stage", "peak": "per_king"}

_EN = {"maze": "FORGOTTEN HALL", "story": "PURE FICTION", "boss": "APOCALYPSE", "peak": "ANOMALY"}

_MARK = re.compile(r"◆\s*([^◆]+?)\s*◆")


def _sections(text: str) -> list[dict]:
    marks = list(_MARK.finditer(text))
    out: list[dict] = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        out.append({"title": m.group(1).strip(), "text": text[m.end():end].strip()})
    return out


def _section_field_ref(desc_key: str | None, mode: str, idx: int, field: str, cn_value: str, key_count: int) -> Any:
    if not desc_key:
        return cn_value

    def compose(tm: Any, k: str = desc_key, i: int = idx, f: str = field, fb: str = cn_value) -> str:
        got = _sections(clean_text(tm.get(k, ""), dict(tm)))
        return got[i][f] if i < len(got) and got[i][f] else fb

    return composed_ref(f"composed:egintro:{desc_key}:{key_count}:{idx}:{field}", compose, cn_value)


def _mode_of_lengths(lengths: list[int]) -> int:
    if not lengths:
        return 0
    counter = Counter(lengths)
    return sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def _buff_counts() -> dict[str, int]:
    groups = load_json(EXCEL_DIR / "ChallengeGroupConfig.json")
    story = load_json(EXCEL_DIR / "ChallengeStoryGroupExtra.json")
    boss = load_json(EXCEL_DIR / "ChallengeBossGroupExtra.json")
    peak = load_json(EXCEL_DIR / "ChallengePeakBossConfig.json")
    return {
        "maze": _mode_of_lengths([1 for g in groups if g.get("MazeBuffID")]),
        "story": _mode_of_lengths([len(s["BuffList"]) for s in story if s.get("BuffList")]),
        "boss": _mode_of_lengths([len(b["BuffList1"]) for b in boss if b.get("BuffList1")]),
        "peak": _mode_of_lengths([len(p["BuffList"]) for p in peak if p.get("BuffList")]),
    }


def convert() -> None:
    intro = {row.get("ID"): row for row in load_json(EXCEL_DIR / "IntroData.json")}
    counts = _buff_counts()
    modes: dict[str, dict] = {}

    for key in MODES:
        row = intro.get(INTRO_ID[key])
        if not row:
            logger.warning("endgame_guide：IntroData 缺少 ID %s（模式 %s），跳过", INTRO_ID[key], key)
            continue

        desc_ref = row.get("Desc")
        desc_key = text_key_of(desc_ref)
        sections = _sections(resolve_text(desc_ref))
        if not sections:
            logger.warning("endgame_guide：模式 %s 的正文未切出任何分节，跳过", key)
            continue
        n = len(sections)
        sections = [
            {
                "title": _section_field_ref(desc_key, key, i, "title", s["title"], n),
                "text": _section_field_ref(desc_key, key, i, "text", s["text"], n),
            }
            for i, s in enumerate(sections)
        ]

        mode: dict = {
            "key": key,
            "label": sections[0]["title"],
            "en": _EN[key],
            "intro_id": INTRO_ID[key],
            "sections": sections,
        }

        system_name = _BUFF_SYSTEM[key]
        matched = next((s["title"] for s in sections if s["title"] == system_name), None)
        if matched is not None:
            mode["system"] = {"name": matched, "count": counts[key], "choice": _CHOICE[key]}
        else:
            logger.warning(
                "endgame_guide：模式 %s 的分节里没有体系名「%s」（分节=%s），本轮不落 system",
                key, system_name, [s["title"] for s in sections],
            )

        modes[key] = mode

    save_json({"modes": modes}, OUTPUT_DIR / "endgame_guide.json")
