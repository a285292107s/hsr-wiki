"""version 模块纯函数契约测试（不依赖真实 git）。

覆盖：提交标题解析（官方客户端版本标识 → 版本对象）、异常输入降级。
incremental 依赖声明一致性由 test_incremental.py 的 AST 扫描统一保障
（version.py 无 load_json 静态调用，git:HEAD 声明满足 test_all_modules_declared）。
"""

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


def test_parse_older_version() -> None:
    parsed = parse_commit_title("OSPRODWin3.8.0_D10000000_A20000000_L30000000")
    assert parsed is not None
    assert parsed["game_version"] == "3.8.0"
    assert parsed["version_label"] == "3.8"
    assert parsed["client"] == "OSPRODWin3.8.0"


def test_parse_surrounding_whitespace_stripped() -> None:
    parsed = parse_commit_title("  OSPRODWin4.4.0_D1_A2_L3  ")
    assert parsed is not None
    assert parsed["game_version"] == "4.4.0"


def test_parse_invalid_returns_none() -> None:
    assert parse_commit_title("random commit message") is None
    assert parse_commit_title("") is None
    # 缺构建号
    assert parse_commit_title("OSPRODWin4.4.0") is None
    # 版本号格式不符
    assert parse_commit_title("OSPRODWin4.4_D1_A2_L3") is None
    # 其他平台前缀
    assert parse_commit_title("OSPRODIOS4.4.0_D1_A2_L3") is None
