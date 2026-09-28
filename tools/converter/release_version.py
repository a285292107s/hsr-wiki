"""release_version 打标：角色 / 光锥索引的版本增量推导（ADR 0019 决策 4/5）。

条目 `release_version` 有两个来源，同写一个字段：
  - characters.json / light_cones.json：与「上一版已提交输出」的 id 差集推导（本模块）；
  - relics.json：源数据权威 `RelicSetConfig.ReleaseVersion`（relics.py 直读，不走本模块）。

硬约束：
  - 版本号只来自 converters/version.py（子模块 HEAD 提交标题 → version_label）；
    禁止复制一份提交标题解析实现，禁止读上一轮 version.json（比当前数据落后一版）。
  - 基线 = converter 覆盖输出前读到的输出目录里已提交的上一版 JSON；基线文件不存在
    （首次转换 / 本地首跑）→ 全部空串，不猜。
  - 幂等：已打标条目跨版本沿用基线值，同一版本内重复运行不得改标成「当前版本」。
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Iterable, Mapping, Sequence

logger = logging.getLogger("converter")


def load_baseline_versions(path: Path) -> dict[str, str] | None:
    """读取上一版输出 JSON，返回 {id: release_version} 基线。

    返回 None 表示**没有基线**（文件不存在，首次转换）→ 调用方应把全部条目标为空串。
    基线里缺 release_version 字段（机制启用前的旧产物）或字段非字符串 → 记为空串，
    不得把这类条目当成「本版本新增」。
    文件存在但不可解析 / 结构不是列表时抛 ValueError：静默按无基线处理会把已打标条目
    全部清空，属于比转换失败更坏的静默降级（save_json 原子替换，正常流程不会产生半截文件）。
    """
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"基线输出不可读，拒绝在无基线状态下重打版本号: {path}（{exc}）") from exc
    if not isinstance(data, list):
        raise ValueError(f"基线输出结构异常（应为列表）: {path}")

    baseline: dict[str, str] = {}
    for item in data:
        if not isinstance(item, dict) or item.get("id") is None:
            continue
        value = item.get("release_version", "")
        # id 统一转字符串：基线来自 JSON 与 git 历史快照，两种来源的 id 数值类型需可比
        baseline[str(item["id"])] = value if isinstance(value, str) else ""
    return baseline


def tag_release_versions(
    current_ids: Iterable[int],
    baseline: Mapping[str, str] | None,
    current_version: str,
) -> dict[str, str]:
    """按基线差集给条目打版本号，返回 {id: release_version}。

    - baseline=None（无基线）→ 全部空串；
    - 基线已有该 id → 沿用基线值（空串保留空串）；
    - 当前有、基线没有的 id → current_version；current_version 为空串（git 不可用）时留空。
    """
    ids = [str(i) for i in current_ids]
    if baseline is None:
        return dict.fromkeys(ids, "")
    return {i: baseline[i] if i in baseline else current_version for i in ids}


def apply_release_versions(entries: Sequence[dict], versions: Mapping[str, str]) -> int:
    """把 {id: release_version} 原地写入条目，返回实际发生变化的条目数。

    就地覆盖 `release_version` 字段，保证字段值只来自单一时刻的差集快照；
    条目缺 id 时跳过（正常产物不会出现）。
    """
    changed = 0
    for entry in entries:
        entry_id = entry.get("id")
        if entry_id is None:
            continue
        value = versions.get(str(entry_id), "")
        if entry.get("release_version") != value:
            changed += 1
        entry["release_version"] = value
    return changed
