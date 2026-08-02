"""货币战争 · 赛季扩充说明转换器

数据来源（全部来自 vendor/TurnBasedGameData/TextMap/TextMapCHS.json）：
  - 标题 Hash → 「货币战争•零和博弈」赛季扩充说明 V4.4
  - 正文 Hash → 赛季扩充说明全文（含新角色、晋升上限、羁绊加强等）
  - 概览 Hash → ▌扩充内容概览（要点式补充说明，● 引导的条目列表）

说明：赛季扩充说明仅以 TextMap 纯文本形式存在（无对应 ExcelOutput 配置），
故直接按已知 Hash 提取。新增赛季时在 SEASON_TEXTMAP 注册「标题 Hash → 正文/概览 Hash」即可。
正文与概览经 clean_text 清洗游戏内标签（颜色/属性占位符等），保留字面 \n 换行（前端转渲染）。

输出：
  - public/data/cn/currency/season.json
"""
from __future__ import annotations

import logging

from config import OUTPUT_DIR
from textmap import resolve_text
from utils import save_json

logger = logging.getLogger("converter.currency.season")

OUT_SUBDIR = "currency"  # 相对于 OUTPUT_DIR 的子目录

# 标题 Hash → { 正文 Hash, 概览 Hash }（赛季扩充说明成组出现）
# 概览（overview）为可选：缺失时前端仅渲染正文。
# 货币战争•零和博弈 V4.4 —— 4.4 版本赛季扩充
SEASON_TEXTMAP: dict[str, dict[str, str]] = {
    "5697700181386375780": {
        "body": "15052566346490669003",
        "overview": "15871785773892858103",
    },
}


def convert() -> None:
    logger.info("--- 货币战争赛季扩充说明 (currency/season) ---")
    out_dir = OUTPUT_DIR / OUT_SUBDIR
    out_dir.mkdir(parents=True, exist_ok=True)

    seasons: list[dict] = []
    for title_hash, refs in SEASON_TEXTMAP.items():
        title = resolve_text({"Hash": int(title_hash)})
        body = resolve_text({"Hash": int(refs["body"])})

        if not body:
            logger.warning("赛季扩充说明正文未命中 TextMap: %s（跳过）", refs["body"])
            continue

        entry: dict = {
            "id": title_hash,
            "title": title,
            "body": body,
        }

        overview_hash = refs.get("overview")
        if overview_hash:
            overview = resolve_text({"Hash": int(overview_hash)})
            if overview:
                entry["overview"] = overview
            else:
                logger.warning("赛季扩充说明概览未命中 TextMap: %s（忽略概览）", overview_hash)

        seasons.append(entry)

    out = {"seasons": seasons}
    save_json(out, out_dir / "season.json")
    logger.info("货币战争赛季扩充说明完成：%d 个赛季", len(seasons))


if __name__ == "__main__":
    convert()
