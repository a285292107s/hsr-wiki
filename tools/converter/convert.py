"""TurnBasedGameData → 前端 JSON 转换工具主入口。

用法:
    cd tools/converter
    pip install -r requirements.txt
    python convert.py              # 全量转换（紧凑输出）
    python convert.py --pretty     # 缩进输出（调试用）
    python convert.py --only characters,relics  # 仅重跑指定模块
"""

import argparse
import logging
import sys
import time
from pathlib import Path

# Windows 控制台强制 UTF-8，避免中文日志乱码
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

# 将当前目录加入 sys.path，使子模块能正常导入
sys.path.insert(0, str(Path(__file__).resolve().parent))

from textmap import load_textmap
from utils import set_pretty
from incremental import load_state, save_state, should_skip, update_state
from converters import paths, elements, items, properties
from converters import characters, character_ranks, character_skills, character_detail
from converters import light_cones, light_cone_detail, relics, relic_affixes, monsters, endgame
from converters import currency, season, currency_catalog  # noqa: E402 – 本地数据，无需网络

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("converter")

# 模块注册表：名称 → 转换函数列表
MODULES: dict[str, list] = {
    "paths": [paths.convert],
    "elements": [elements.convert],
    "properties": [properties.convert],
    "items": [items.convert],
    "characters": [characters.convert],
    "character_ranks": [character_ranks.convert],
    "character_skills": [character_skills.convert],
    "character_detail": [character_detail.convert],
    "light_cones": [light_cones.convert],
    "light_cone_detail": [light_cone_detail.convert],
    "relics": [relics.convert, relics.convert_stories],
    "relic_affixes": [relic_affixes.convert],
    "monsters": [monsters.convert],
    "endgame": [endgame.convert],
    "currency": [currency.convert],
    "currency_catalog": [currency_catalog.convert],
    "season": [season.convert],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="TurnBasedGameData → 前端 JSON 转换工具")
    parser.add_argument(
        "--only",
        type=str,
        default="",
        help=f"仅运行指定模块（逗号分隔）。可选: {', '.join(MODULES.keys())}",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="输出缩进格式（调试用，默认紧凑）",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="强制全量重跑，忽略增量缓存",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    start = time.time()

    # 输出模式
    if args.pretty:
        set_pretty(True)

    # 确定要运行的模块
    if args.only:
        selected = [m.strip() for m in args.only.split(",") if m.strip()]
        unknown = [m for m in selected if m not in MODULES]
        if unknown:
            logger.error("未知模块: %s。可选: %s", unknown, ", ".join(MODULES.keys()))
            sys.exit(1)
    else:
        selected = list(MODULES.keys())

    logger.info("=== 转换工具启动（%d 个模块）===", len(selected))

    # 1. 加载 TextMap（始终需要）
    load_textmap()

    # 2. 增量状态
    state = load_state()
    skipped: list[str] = []

    # 3. 执行转换
    stats: dict[str, float] = {}
    for name in selected:
        if should_skip(name, state, force=args.force):
            skipped.append(name)
            continue
        t0 = time.time()
        logger.info("--- %s ---", name)
        for fn in MODULES[name]:
            fn()
        stats[name] = time.time() - t0
        update_state(name, state)

    save_state(state)

    # 4. 摘要
    elapsed = time.time() - start
    logger.info("=== 转换完成 ===")
    logger.info("总耗时: %.1fs", elapsed)
    if skipped:
        logger.info("跳过（未变更）: %s", ", ".join(skipped))
    for name, dur in stats.items():
        logger.info("  %-20s %5.1fs", name, dur)


if __name__ == "__main__":
    main()
