"""终局玩法说明转换器：IntroData 规则正文 + 四张分组表的增益体系计数 → endgame_guide.json。

源表：`IntroData.json`（官方规则正文，按 `◆…◆` 分节）+ `ChallengeGroupConfig.json` /
`ChallengeStoryGroupExtra.json` / `ChallengeBossGroupExtra.json` / `ChallengePeakBossConfig.json`
（**只读**增益条数与选择语义的判据字段，不读正文）。

与方案文档（`temp/endgame-mode-pages-plan.md`）的**一处实现差异**，原因是数据事实：
IntroData 正文里的换行是**字面量** `\\n`（反斜杠 + n，两字符；全站数据同此约定，前端按字面 `\\n`
换行渲染），因此**不能**按「行首 ◆」锚定分节（`(?m)^◆` 会匹配不到任何一节）。改用不依赖行边界的
`◆…◆` 标记切分；分节口径与方案一致（首个 ◆ 节 = 玩法本体，其余按原文顺序）。

体系名（方案 D2）**不写死展示文本**：`_BUFF_SYSTEM` 只登记「哪个 IntroData / 哪一节是增益体系」这
一类判据常量，取值必须在该模式 `sections` 的标题里命中——未命中则告警且不落 `system`（宁可缺，不自造）。
`label` 由**首个分节标题**派生（同样是数据派生，不写死）；`en` 无对应数据源，取常量并由测试与前端
`ENDGAME_MODES` 对齐。

源的 peak 落点：王棋扩展表 `ChallengePeakBossConfig.json` 的 `BuffList`（方案 §2.1 写作
`ChallengePeakConfig.BuffList`，后者实际无该字段）。
"""

import logging
import re
from collections import Counter

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import resolve_text
from utils import load_json, save_json

logger = logging.getLogger("converter")

MODES = ("maze", "story", "boss", "peak")

# IntroData 映射：maze 取 2（同文副本 44 不取，测试断言二者逐字相等）；
# story 取 115（2.7 改版后的新版，含战意机制三节；71 为改版前口径，含已下线内容，不取）。
INTRO_ID = {"maze": 2, "story": 115, "boss": 93, "peak": 167}

# 体系名判据：值必须命中该模式某分节标题（取自 IntroData 官方分节，非第三方命名）。
_BUFF_SYSTEM = {"maze": "记忆紊流", "story": "荒腔走板", "boss": "终焉公理", "peak": "裁决象限"}

# 选择语义：固定 / 每支队伍选 1 / 每场战斗选 1 / 王棋挑战前选 1。展示文案在前端 `guide.ts`，
# 转换器只出枚举（口径单一、便于测试）。
_CHOICE = {"maze": "fixed", "story": "per_team", "boss": "per_stage", "peak": "per_king"}

# 与 `src/app/catalog/pages/endgame.ts` 的 ENDGAME_MODES[].en 一致（测试锁）。
_EN = {"maze": "FORGOTTEN HALL", "story": "PURE FICTION", "boss": "APOCALYPSE", "peak": "ANOMALY"}

# 分节标记：`◆忘却之庭◆` 与 `◆ 末日幻影 ◆` 两种空格形态并存，故两侧都容忍空格。
_MARK = re.compile(r"◆\s*([^◆]+?)\s*◆")


def _sections(text: str) -> list[dict]:
    """按 `◆…◆` 标记切分为有序小节（不依赖行边界，见模块头注释）。"""
    marks = list(_MARK.finditer(text))
    out: list[dict] = []
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        out.append({"title": m.group(1).strip(), "text": text[m.end():end].strip()})
    return out


def _mode_of_lengths(lengths: list[int]) -> int:
    """众数，平局时取较小值（确定性；源表行数少，无需更复杂口径）。"""
    if not lengths:
        return 0
    counter = Counter(lengths)
    return sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def _buff_counts() -> dict[str, int]:
    """四种玩法的增益条数众数（判据字段各不相同，见方案 §4.2.5）。

    只统计**非空**项：口径问的是「该玩法每期提供几条增益」。maze 的 `MazeBuffID` 是每组分单值
    （非空计 1），若把空组也算进去，55 有 / 2 无的分布虽仍是 1，但一旦出现平局就会退化成 0；
    非空口径语义更准也更稳。
    """
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
    """转换 IntroData + 分组表 → endgame_guide.json。"""
    intro = {row.get("ID"): row for row in load_json(EXCEL_DIR / "IntroData.json")}
    counts = _buff_counts()
    modes: dict[str, dict] = {}

    for key in MODES:
        row = intro.get(INTRO_ID[key])
        if not row:
            logger.warning("endgame_guide：IntroData 缺少 ID %s（模式 %s），跳过", INTRO_ID[key], key)
            continue

        sections = _sections(resolve_text(row.get("Desc")))
        if not sections:
            logger.warning("endgame_guide：模式 %s 的正文未切出任何分节，跳过", key)
            continue

        mode: dict = {
            "key": key,
            "label": sections[0]["title"],
            "en": _EN[key],
            "intro_id": INTRO_ID[key],
            "sections": sections,
        }

        system_name = _BUFF_SYSTEM[key]
        if any(s["title"] == system_name for s in sections):
            mode["system"] = {"name": system_name, "count": counts[key], "choice": _CHOICE[key]}
        else:
            logger.warning(
                "endgame_guide：模式 %s 的分节里没有体系名「%s」（分节=%s），本轮不落 system",
                key, system_name, [s["title"] for s in sections],
            )

        modes[key] = mode

    save_json({"modes": modes}, OUTPUT_DIR / "endgame_guide.json")
