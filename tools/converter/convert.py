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

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

sys.path.insert(0, str(Path(__file__).resolve().parent))

from textmap import clean_text, load_textmap
from utils import set_pretty, set_official_paths, set_text_tokens
import textpack
from languages import codes
from config import OUTPUT_DIR, PACK_DIR
from incremental import load_state, save_state, should_skip, update_state
from converters import paths, elements, items, properties
from converters import characters, character_detail
from converters import light_cones, light_cone_detail, relics, relic_affixes, monsters, endgame, endgame_catalog
from converters import endgame_guide
from converters import currency, currency_catalog  # noqa: E402
from converters import achievements
from converters import monster_detail
from converters import voracity
from converters import version  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("converter")

MODULES: dict[str, list] = {
    "paths": [paths.convert],
    "elements": [elements.convert],
    "properties": [properties.convert],
    "items": [items.convert],
    "characters": [characters.convert],
    "character_detail": [character_detail.convert],
    "light_cones": [light_cones.convert],
    "light_cone_detail": [light_cone_detail.convert],
    "relics": [relics.convert, relics.convert_stories],
    "relic_affixes": [relic_affixes.convert],
    "monsters": [monsters.convert],
    "monster_detail": [monster_detail.convert],
    "voracity": [voracity.convert],
    "endgame": [endgame.convert],
    "endgame_guide": [endgame_guide.convert],
    "endgame_catalog": [endgame_catalog.convert_catalog],
    "currency": [currency.convert],
    "currency_catalog": [currency_catalog.convert],
    "achievements": [achievements.convert],
    "version": [version.convert],
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
    parser.add_argument(
        "--official-icon-paths",
        action="store_true",
        help="图标路径输出官方 StarRailTextures 仓库相对路径（默认旧短路径 icon/xxx/yyy.png 格式）",
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="关闭令牌化：输出完整中文、不生成语言包（仅调试 / 与旧产物比对用，产物勿提交）",
    )
    return parser.parse_args()

def _write_language_packs() -> None:
    """写出各语言语言包，并盘点结构层残留中文（多语言化进度判据）。"""
    builder = textpack.session()
    if builder is None:
        logger.error("令牌会话未开启，跳过语言包生成")
        return

    out_dir = PACK_DIR
    lang_codes = codes()
    stats = builder.write(out_dir, lang_codes, cleaner=clean_text)
    logger.info("语言包：%d 个分组 × %d 语言 → %s", len(builder.groups), len(lang_codes), out_dir)
    for code in lang_codes:
        logger.info("  %-4s %7d 键", code, stats[code])

    residual = textpack.survey_tree(OUTPUT_DIR)
    total = sum(len(v) for v in residual.values())
    logger.warning(
        "结构层残留中文：%d 处 / %d 个文件（未令牌化；需改稳定枚举键或改走 TextMap）",
        total,
        len(residual),
    )
    for rel in sorted(residual, key=lambda r: -len(residual[r]))[:15]:
        logger.warning("  %-42s %4d 处  例：%s", rel, len(residual[rel]), residual[rel][0][1][:40])

    textpack.end()


def main() -> None:
    args = parse_args()
    start = time.time()

    if args.pretty:
        set_pretty(True)
    if args.official_icon_paths:
        set_official_paths(True)
    if not args.raw:
        # 令牌模式是默认路径（ADR 0052）：结构层写文本引用令牌 + 生成全语言语言包。
        # 语言包是「整语言产物」：分组可由多个模块写入，部分重跑会写出被截断的包，
        # 因此令牌模式下禁用增量跳过（一次全量换一份自洽的语言包）。
        if not args.force:
            logger.info("令牌模式：忽略增量跳过，本次全量重跑")
            args.force = True
        set_text_tokens(True)
        textpack.begin()

    if args.only:
        selected = [m.strip() for m in args.only.split(",") if m.strip()]
        unknown = [m for m in selected if m not in MODULES]
        if unknown:
            logger.error("未知模块: %s。可选: %s", unknown, ", ".join(MODULES.keys()))
            sys.exit(1)
    else:
        selected = list(MODULES.keys())

    logger.info("=== 转换工具启动（%d 个模块）===", len(selected))

    load_textmap()

    state = load_state()
    skipped: list[str] = []

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

    if not args.raw:
        _write_language_packs()

    elapsed = time.time() - start
    logger.info("=== 转换完成 ===")
    logger.info("总耗时: %.1fs", elapsed)
    if skipped:
        logger.info("跳过（未变更）: %s", ", ".join(skipped))
    for name, dur in stats.items():
        logger.info("  %-20s %5.1fs", name, dur)

if __name__ == "__main__":
    main()
