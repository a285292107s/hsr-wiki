"""TurnBasedGameData → StarRailRes 格式转换工具主入口。

用法:
    cd tools/converter
    pip install -r requirements.txt
    python convert.py
"""

import logging
import sys
import time
from pathlib import Path

# 将当前目录加入 sys.path，使子模块能正常导入
sys.path.insert(0, str(Path(__file__).resolve().parent))

from textmap import load_textmap
from converters import paths, elements, items, properties
from converters import characters, character_ranks, character_skills
from converters import light_cones, relics, relic_affixes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("converter")


def main() -> None:
    start = time.time()
    logger.info("=== TurnBasedGameData 转换工具启动 ===")

    # 1. 加载 TextMap
    load_textmap()

    # 2. 通用数据
    logger.info("--- 通用数据 ---")
    paths.convert()
    elements.convert()
    properties.convert()
    items.convert()

    # 3. 角色数据
    logger.info("--- 角色数据 ---")
    characters.convert()
    character_ranks.convert()
    character_skills.convert()

    # 4. 光锥数据
    logger.info("--- 光锥数据 ---")
    light_cones.convert()

    # 5. 遗器数据
    logger.info("--- 遗器数据 ---")
    relics.convert()
    relic_affixes.convert()

    elapsed = time.time() - start
    logger.info("=== 转换完成，耗时 %.1fs ===", elapsed)


if __name__ == "__main__":
    main()
