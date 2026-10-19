import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import endgame_guide as eg  # noqa: E402


def test_sections_split_on_markers_without_line_anchors():
    text = "◆忘却之庭◆\\n正文一\\n\\n◆ 记忆紊流 ◆\\n在「忘却之庭」中有其独特的法则。\\n\\n◆轮◆\\n所有战斗都有「轮」限制。"
    sections = eg._sections(text)
    assert [s["title"] for s in sections] == ["忘却之庭", "记忆紊流", "轮"]
    assert sections[0]["text"] == "\\n正文一\\n\\n"
    assert sections[1]["text"] == "\\n在「忘却之庭」中有其独特的法则。\\n\\n"
    assert sections[2]["text"] == "\\n所有战斗都有「轮」限制。"


def test_sections_empty_when_no_marker():
    assert eg._sections("没有任何分节标记的正文") == []


def test_mode_of_lengths_uses_mode_and_breaks_ties_low():
    assert eg._mode_of_lengths([3, 3, 3, 0]) == 3
    assert eg._mode_of_lengths([1, 1, 0]) == 1
    assert eg._mode_of_lengths([3, 5]) == 3
    assert eg._mode_of_lengths([]) == 0


def test_buff_counts_reads_each_mode_own_field(monkeypatch):
    files = {
        "ChallengeGroupConfig.json": [{"GroupID": 1, "MazeBuffID": 3030104}, {"GroupID": 2, "MazeBuffID": None}],
        "ChallengeStoryGroupExtra.json": [{"BuffList": [1, 2, 3]}],
        "ChallengeBossGroupExtra.json": [{"BuffList1": [1, 2, 3], "BuffList2": [4, 5, 6]}],
        "ChallengePeakBossConfig.json": [{"ID": 104, "BuffList": [7, 8, 9]}],
    }
    monkeypatch.setattr(eg, "load_json", lambda path: files[Path(path).name])
    assert eg._buff_counts() == {"maze": 1, "story": 3, "boss": 3, "peak": 3}


def _stub_sources(monkeypatch, intro_desc: dict[int, str]):
    files = {
        "IntroData.json": [{"ID": i, "Desc": {"Hash": i}} for i in intro_desc],
        "ChallengeGroupConfig.json": [{"MazeBuffID": 1}],
        "ChallengeStoryGroupExtra.json": [{"BuffList": [1, 2, 3]}],
        "ChallengeBossGroupExtra.json": [{"BuffList1": [1, 2, 3]}],
        "ChallengePeakBossConfig.json": [{"BuffList": [1, 2, 3]}],
    }
    monkeypatch.setattr(eg, "load_json", lambda path: files[Path(path).name])
    monkeypatch.setattr(eg, "resolve_text", lambda value, clean=True: intro_desc[int(value["Hash"])])
    saved: dict = {}
    monkeypatch.setattr(eg, "save_json", lambda data, path: saved.update({"data": data, "path": path}))
    return saved


def test_convert_emits_system_only_when_name_hits_a_section(monkeypatch):
    desc = {
        2: "◆忘却之庭◆\\n玩法正文。\\n◆记忆紊流◆\\n增益正文。",
        115: "◆虚构叙事◆\\n玩法正文。",
        93: "◆末日幻影◆\\n玩法正文。\\n◆终焉公理◆\\n增益正文。",
        167: "◆异相仲裁◆\\n玩法正文。",
    }
    saved = _stub_sources(monkeypatch, desc)
    eg.convert()
    modes = saved["data"]["modes"]

    assert modes["maze"]["label"] == "忘却之庭"
    assert modes["maze"]["en"] == "FORGOTTEN HALL"
    assert modes["maze"]["intro_id"] == 2
    assert modes["maze"]["system"] == {"name": "记忆紊流", "count": 1, "choice": "fixed"}

    assert "system" not in modes["story"]
    assert "system" not in modes["peak"]

    assert modes["boss"]["system"] == {"name": "终焉公理", "count": 3, "choice": "per_stage"}


def test_convert_skips_mode_when_intro_missing(monkeypatch):
    saved = _stub_sources(monkeypatch, {2: "◆忘却之庭◆\\n玩法正文。\\n◆记忆紊流◆\\n增益正文。"})
    eg.convert()
    assert set(saved["data"]["modes"]) == {"maze"}


def test_criterion_constants_are_locked():
    assert eg.INTRO_ID == {"maze": 2, "story": 115, "boss": 93, "peak": 167}
    assert eg._BUFF_SYSTEM == {"maze": "记忆紊流", "story": "荒腔走板", "boss": "终焉公理", "peak": "裁决象限"}
    assert eg._CHOICE == {"maze": "fixed", "story": "per_team", "boss": "per_stage", "peak": "per_king"}
    assert eg._EN == {"maze": "FORGOTTEN HALL", "story": "PURE FICTION", "boss": "APOCALYPSE", "peak": "ANOMALY"}
    assert eg.MODES == ("maze", "story", "boss", "peak")


@pytest.mark.parametrize("mode", ["maze", "story", "boss", "peak"])
def test_产出契约_四模式都有对应判据(mode):
    assert mode in eg.INTRO_ID and mode in eg._BUFF_SYSTEM and mode in eg._CHOICE and mode in eg._EN
