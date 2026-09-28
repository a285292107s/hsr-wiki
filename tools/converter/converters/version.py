"""游戏版本信息转换器

数据来源：vendor/TurnBasedGameData 本地副本的 git 提交信息（CI 为浅克隆，禁止写「子模块」）。
提交标题携带官方客户端版本标识（如 OSPRODWin4.4.0_D15909703_A15802547_L15874300），
是数据源中唯一权威的全局版本号（ExcelOutput / TextMap 均无集中版本表；
RelicSetConfig.ReleaseVersion 仅覆盖遗器且无子版本号）。

输出：
  - public/data/cn/version.json（git 不可用或提交标题无法解析时输出空对象）
"""
from __future__ import annotations

import logging
import re
import subprocess
from functools import lru_cache

from config import OUTPUT_DIR, SOURCE_DIR
from utils import save_json

logger = logging.getLogger("converter.version")

# 官方客户端版本标识：OSPRODWin4.4.0_D15909703_A15802547_L15874300
# 平台前缀 + 版本号 + D(数据)/A(音频)/L(语言) 构建号
_COMMIT_TITLE_PATTERN = re.compile(r"^OSPRODWin(\d+\.\d+\.\d+)_(D\d+)_(A\d+)_(L\d+)$")


def parse_commit_title(title: str) -> dict | None:
    """解析提交标题为版本对象；无法解析时返回 None。"""
    m = _COMMIT_TITLE_PATTERN.match(title.strip())
    if not m:
        return None
    game_version = m.group(1)
    return {
        "game_version": game_version,
        # 大版本标签（前端目录页/展示用）：4.4.0 → 4.4
        "version_label": game_version.rsplit(".", 1)[0],
        "client": f"OSPRODWin{game_version}",
        "build": f"{m.group(2)}_{m.group(3)}_{m.group(4)}",
    }


def _read_head_commit() -> tuple[str, str] | None:
    """读取子模块最新提交（标题, 日期）；git 不可用时返回 None。"""
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
    """读取子模块 HEAD 提交标题解析出的 version_label（如 "4.6"）；不可用时返回空串。

    供 release_version 打标（characters / light_cones）复用，禁止在别处复制一份提交标题
    解析实现；也不得改读上一轮 version.json——那是上一版数据，标出的版本会落后一版。
    """
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
