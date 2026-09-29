"""is_season_new 打标：货币战争赛季代际差集（ADR 0020 决策 2/4）。

判据 = **当前代名册 − 上一代名册**（单向集合差集）。纯函数，供
converters/currency.py（角色）与 converters/currency_catalog.py（羁绊）复用。

硬约束：
  - 「上一代」= 同一张 `*Old` 表行集合里 `ExistSeason` 的**最大值**（当前快照 101/102/103 → 103）。
    禁止取最小值 / 首行 / 全部代际的并集：并集会把更早几代的新增也算成本代新增。
  - `*Old` 表缺失 / 为空 / 有效代际 < 2 代 → **全部 False + logger.warning**。
    禁止退化为全 True（ADR 0020 决策 4）：没有上一代就是无从判断，不等于整份名册都是新的。
  - 只在单表内按 `ExistSeason` 分组比对，**禁止跨表比代**（当前代名册的编号体系与旧代 101/102/103 不一致）。
  - 旧代有、当前代没有的 id（羁绊轮换出）只是被忽略：差集单向，不参与标记、不报错。
  - 无 IO、无状态：不读输出产物，否则「打标结果」反过来决定自身基线（幂等性无从保证）。
"""

from __future__ import annotations

import logging
from typing import Any, Iterable, Mapping, Sequence

logger = logging.getLogger("converter")

DEFAULT_SEASON_KEY = "ExistSeason"


def generations(
    rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
) -> list[int]:
    """返回表中出现过的代编号（升序去重）；字段缺失 / 非 int 的行忽略（含 bool）。"""
    out: set[int] = set()
    for row in rows or []:
        if not isinstance(row, Mapping):
            continue
        value = row.get(key)
        if isinstance(value, int) and not isinstance(value, bool):
            out.add(value)
    return sorted(out)


def prev_generation(
    rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
) -> int | None:
    """上一代 = 行集合中 `key` 字段的**最大值**；无有效行 → None。

    None 表示「没有上一代可比」——调用方（`mark_season_new`）必须按降级处理（全 false + 告警），
    禁止把它当成「上一代为 0」而让全部条目落进差集。
    """
    gens = generations(rows, key)
    return gens[-1] if gens else None


def mark_season_new(
    current_ids: Iterable[Any],
    old_rows: Sequence[Mapping[str, Any]] | None,
    key: str = DEFAULT_SEASON_KEY,
    id_key: str = "ID",
    *,
    label: str = "名册",
) -> dict[Any, bool]:
    """当前代 id 不在**上一代**集合中 → True；返回 {id: bool}。

    - `old_rows`：整张 `*Old` 表（含多代，每行以 `key` 标代）；`current_ids`：当前代名册 id。
    - 降级（表缺失 / 空 / 有效代际 < 2）→ 全部 False + logger.warning，禁止全 True。
    - `label` 只用于日志文案，方便定位是哪张表降级 / 哪次换代。
    """
    ids = list(current_ids)
    gens = generations(old_rows, key)
    prev = prev_generation(old_rows, key)
    if prev is None or len(gens) < 2:
        logger.warning(
            "赛季代际差集降级：[%s] 的 %s 缺失或有效代际 < 2（实测 %s），is_season_new 全部置 false",
            label,
            key,
            gens if gens else "无有效行",
        )
        return dict.fromkeys(ids, False)
    prev_ids = {
        row.get(id_key)
        for row in old_rows
        if isinstance(row, Mapping) and row.get(key) == prev and row.get(id_key) is not None
    }
    # 记录实际基线，换代后可直接从日志核验（ADR 0020「换代后实测一次」）
    logger.info("[%s] 上一代=%d（名册 %d 个），当前代 %d 个", label, prev, len(prev_ids), len(ids))
    return {i: i not in prev_ids for i in ids}


def apply_season_new(
    entries: Sequence[dict],
    flags: Mapping[Any, bool],
    id_field: str = "id",
) -> int:
    """把 {id: is_season_new} 原地写入条目（`id_field` 指定取哪个字段匹配），返回 true 数。

    条目缺 `id_field` 或该 id 不在 flags 里 → false（降级口径统一为「不可判断 = 不是新增」）。
    每次整体重写该字段、不沿用旧值，源表换代后旧标必须能被改掉（幂等前提）。
    """
    count = 0
    for entry in entries:
        flag = bool(flags.get(entry.get(id_field), False))
        entry["is_season_new"] = flag
        if flag:
            count += 1
    return count
