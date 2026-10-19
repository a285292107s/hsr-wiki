from __future__ import annotations

import logging
import re
import subprocess
from functools import lru_cache

from config import OUTPUT_DIR, SOURCE_DIR
from utils import save_json

logger = logging.getLogger("converter.version")

_COMMIT_TITLE_PATTERN = re.compile(r"^OSPRODWin(\d+\.\d+\.\d+)_(D\d+)_(A\d+)_(L\d+)$")

def parse_commit_title(title: str) -> dict | None:
    m = _COMMIT_TITLE_PATTERN.match(title.strip())
    if not m:
        return None
    game_version = m.group(1)
    return {
        "game_version": game_version,
        "version_label": game_version.rsplit(".", 1)[0],
        "client": f"OSPRODWin{game_version}",
        "build": f"{m.group(2)}_{m.group(3)}_{m.group(4)}",
    }

def _read_head_commit() -> tuple[str, str] | None:
    try:
        proc = subprocess.run(
            ["git", "-C", str(SOURCE_DIR), "log", "-1", "--format=%s%x1f%ad", "--date=short"],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        logger.warning("读取子模块 git 提交失败: %s", proc.stderr.strip()[:200])
        return None
    line = proc.stdout.strip()
    if not line:
        return None
    title, _, date = line.partition("\x1f")
    return title, date

@lru_cache(maxsize=1)
def read_source_version_label() -> str:
    head = _read_head_commit()
    if head is None:
        logger.warning("无法读取子模块 git 提交，版本号留空")
        return ""
    parsed = parse_commit_title(head[0])
    if parsed is None:
        logger.warning("提交标题无法解析为版本号: %r（版本号留空）", head[0])
        return ""
    return parsed["version_label"]

def convert() -> None:
    logger.info("--- 游戏版本信息 (version) ---")
    head = _read_head_commit()
    if head is None:
        logger.warning("无法读取子模块 git 提交，version.json 输出空对象（前端展示 — 兜底）")
        save_json({}, OUTPUT_DIR / "version.json")
        return
    title, date = head
    parsed = parse_commit_title(title)
    if parsed is None:
        logger.warning("提交标题无法解析为版本号: %r（输出空对象）", title)
        save_json({}, OUTPUT_DIR / "version.json")
        return
    out = {**parsed, "synced_at": date}
    save_json(out, OUTPUT_DIR / "version.json")
    logger.info("游戏版本 %s（%s，构建 %s，同步于 %s）",
                out["game_version"], out["client"], out["build"], out["synced_at"])

if __name__ == "__main__":
    convert()
