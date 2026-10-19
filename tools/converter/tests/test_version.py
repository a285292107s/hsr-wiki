import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from converters.version import parse_commit_title  # noqa: E402

def test_parse_standard_commit_title() -> None:
    parsed = parse_commit_title("OSPRODWin4.4.0_D15909703_A15802547_L15874300")
    assert parsed == {
        "game_version": "4.4.0",
        "version_label": "4.4",
        "client": "OSPRODWin4.4.0",
        "build": "D15909703_A15802547_L15874300",
    }

def test_parse_surrounding_whitespace_stripped() -> None:
    parsed = parse_commit_title("  OSPRODWin4.4.0_D1_A2_L3  ")
    assert parsed is not None
    assert parsed["game_version"] == "4.4.0"

def test_parse_invalid_returns_none() -> None:
    assert parse_commit_title("random commit message") is None
    assert parse_commit_title("") is None
    assert parse_commit_title("OSPRODWin4.4.0") is None
    assert parse_commit_title("OSPRODWin4.4_D1_A2_L3") is None
    assert parse_commit_title("OSPRODIOS4.4.0_D1_A2_L3") is None
