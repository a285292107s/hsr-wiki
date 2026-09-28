"""release_version 打标纯函数契约测试（不依赖真实 git / 真实源数据）。

覆盖：基线缺失（首跑留空）/ 基线同 id（幂等沿用）/ 新增 id 打标当前版本 / 旧空串保留 /
基线缺字段与异常结构 / 回填脚本的「首次出现快照版本」推导。
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from backfill_release_versions import first_seen_versions  # noqa: E402
from release_version import (  # noqa: E402
    apply_release_versions,
    load_baseline_versions,
    tag_release_versions,
)


def _write(path: Path, data: object) -> Path:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    return path


# ── tag_release_versions：差集打标 ──────────────────────────────


def test_baseline_missing_tags_all_empty() -> None:
    """无基线（首次转换）→ 全部空串，不猜版本。"""
    assert tag_release_versions([1503, 1512], None, "4.6") == {"1503": "", "1512": ""}


def test_baseline_same_ids_keeps_versions_idempotent() -> None:
    """基线已有 id → 沿用基线值；当前版本号变化也不得改标（幂等核心）。"""
    baseline = {"1001": "4.4", "1503": "4.6", "1512": "4.5"}
    assert tag_release_versions([1001, 1503, 1512], baseline, "4.7") == baseline


def test_new_id_gets_current_version() -> None:
    """当前有、基线没有的 id → 写当前版本号。"""
    baseline = {"1001": "4.4"}
    assert tag_release_versions([1001, 1503], baseline, "4.6") == {"1001": "4.4", "1503": "4.6"}


def test_old_empty_string_preserved() -> None:
    """基线里的空串（旧产物 / 早于可追溯区间）保留为空串，不得当成本版新增。"""
    baseline = {"1001": ""}
    assert tag_release_versions([1001, 1503], baseline, "4.6") == {"1001": "", "1503": "4.6"}


def test_current_version_empty_falls_back_to_blank() -> None:
    """git 不可用（版本号为空串）时新增条目同样留空，禁止写入空标记以外的猜测值。"""
    assert tag_release_versions([1503], {"1001": "4.4"}, "") == {"1503": ""}


# ── load_baseline_versions：基线读取 ────────────────────────────


def test_load_baseline_missing_file_returns_none(tmp_path: Path) -> None:
    assert load_baseline_versions(tmp_path / "characters.json") is None


def test_load_baseline_missing_field_is_empty_string(tmp_path: Path) -> None:
    """机制启用前的旧产物没有 release_version 字段 → 记空串（不是「新增」）。"""
    path = _write(
        tmp_path / "characters.json",
        [{"id": 1001, "name": "三月七"}, {"id": 1503, "release_version": "4.6"}],
    )
    assert load_baseline_versions(path) == {"1001": "", "1503": "4.6"}


def test_load_baseline_non_string_value_coerced_to_empty(tmp_path: Path) -> None:
    path = _write(
        tmp_path / "light_cones.json",
        [{"id": 23055, "release_version": None}, {"id": 23056, "release_version": 4.6}],
    )
    assert load_baseline_versions(path) == {"23055": "", "23056": ""}


def test_load_baseline_unparsable_raises(tmp_path: Path) -> None:
    """基线损坏时必须报错：静默按无基线处理会把已打标条目全部清空。"""
    broken = tmp_path / "characters.json"
    broken.write_text("[{", encoding="utf-8")
    with pytest.raises(ValueError):
        load_baseline_versions(broken)

    not_a_list = _write(tmp_path / "light_cones.json", {"id": 1})
    with pytest.raises(ValueError):
        load_baseline_versions(not_a_list)


# ── apply_release_versions：写字段并统计变化 ─────────────────────


def test_apply_release_versions_writes_field_and_counts_changes() -> None:
    entries = [{"id": 1001}, {"id": 1503, "release_version": ""}, {"id": 1512, "release_version": "4.5"}]
    versions = {"1001": "", "1503": "4.6", "1512": "4.5"}
    # 缺字段 → 补空串也算一次改动（文件内容变了）；值已相等的条目不计
    assert apply_release_versions(entries, versions) == 2
    assert [e["release_version"] for e in entries] == ["", "4.6", "4.5"]
    assert apply_release_versions(entries, versions) == 0


# ── first_seen_versions：回填脚本的推导 ─────────────────────────


def test_first_seen_versions_earliest_snapshot_is_blank() -> None:
    """最早可追溯快照里的 id 记空串（上线版本可能更早，不猜）。"""
    snapshots = [("4.4", [1001, 1002]), ("4.5", [1001, 1512]), ("4.6", [1503])]
    assert first_seen_versions(snapshots) == {"1001": "", "1002": "", "1512": "4.5", "1503": "4.6"}


def test_first_seen_versions_keeps_first_occurrence() -> None:
    """同一版本多提交只记首次出现；后出现的快照不覆盖。"""
    snapshots = [("4.4", []), ("4.5", [1512]), ("4.5", [1512, 1513]), ("4.6", [1513])]
    assert first_seen_versions(snapshots) == {"1512": "4.5", "1513": "4.5"}
