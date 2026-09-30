"""season_delta 纯函数契约测试（ADR 0020）。

用合成数据验证（不依赖真实源数据）：
- 差集正确：当前有、上一代无 → true；上一代有 → false
- 旧代有、当前代无（轮换出）→ 不参与标记
- `*Old` 表缺失 / 空 / 只有一代 → 全部 false + 告警（禁止退化为全 true）
- 上一代只取 `ExistSeason` **最大**一代（更早代的存在不使条目「不新」）
- apply_season_new 的 id 字段与缺字段降级

"""

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from season_delta import (  # noqa: E402
    apply_season_new,
    generations,
    mark_season_new,
    prev_generation,
)

class TestPrevGeneration:
    def test_returns_max_generation(self):
        rows = [
            {"ExistSeason": 101, "ID": 1},
            {"ExistSeason": 103, "ID": 2},
            {"ExistSeason": 102, "ID": 3},
        ]
        assert generations(rows) == [101, 102, 103]
        assert prev_generation(rows) == 103

    def test_empty_or_none_returns_none(self):
        assert prev_generation([]) is None
        assert prev_generation(None) is None

    def test_ignores_missing_and_non_int_season(self):
        rows = [
            {"ExistSeason": 103, "ID": 1},
            {"ID": 2},
            {"ExistSeason": None, "ID": 3},
            {"ExistSeason": "101", "ID": 4},
        ]
        assert generations(rows) == [103]
        assert prev_generation(rows) == 103

    def test_custom_season_key(self):
        rows = [{"Season": 1, "ID": 1}, {"Season": 2, "ID": 2}]
        assert prev_generation(rows, key="Season") == 2

def _roster(*pairs: tuple[int, int]) -> list[dict]:
    return [{"ExistSeason": s, "AvatarID": a} for s, a in pairs]

class TestMarkSeasonNew:
    def test_current_not_in_prev_generation_is_new(self):
        rows = _roster((101, 1), (102, 1), (103, 1), (102, 2), (103, 2))
        flags = mark_season_new([1, 2, 3, 4], rows, id_key="AvatarID")
        assert flags == {1: False, 2: False, 3: True, 4: True}

    def test_generation_earlier_than_max_is_not_baseline(self):
        rows = _roster((101, 7), (103, 8))
        assert mark_season_new([7, 8], rows, id_key="AvatarID") == {7: True, 8: False}

    def test_rotated_out_id_does_not_affect_flags(self):
        rows = _roster((103, 1), (103, 9))
        assert mark_season_new([1], rows, id_key="AvatarID") == {1: False}

    def test_old_table_missing_is_all_false_with_warning(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            flags = mark_season_new([1, 2], None, id_key="AvatarID", label="缺表")
        assert flags == {1: False, 2: False}
        assert any("赛季代际差集降级" in r.message for r in caplog.records)

    def test_old_table_empty_is_all_false_with_warning(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            flags = mark_season_new([1, 2], [], id_key="AvatarID")
        assert flags == {1: False, 2: False}
        assert any("赛季代际差集降级" in r.message for r in caplog.records)

    def test_single_generation_is_all_false_with_warning(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            flags = mark_season_new([1, 2, 3], _roster((103, 1)), id_key="AvatarID")
        assert flags == {1: False, 2: False, 3: False}
        assert any("赛季代际差集降级" in r.message for r in caplog.records)

    def test_no_warning_when_two_generations_present(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            mark_season_new([1], _roster((102, 1), (103, 1)), id_key="AvatarID")
        assert [r for r in caplog.records if r.levelno >= logging.WARNING] == []

    def test_trait_table_uses_trait_id_key(self):
        rows = [
            {"ExistSeason": 102, "TraitID": 1001},
            {"ExistSeason": 103, "TraitID": 1001},
            {"ExistSeason": 103, "TraitID": 2001},
        ]
        assert mark_season_new([1001, 2001, 3006], rows, id_key="TraitID") == {
            1001: False,
            2001: False,
            3006: True,
        }

    def test_missing_id_field_rows_are_ignored(self):
        rows = [{"ExistSeason": 102}, {"ExistSeason": 103}, {"ExistSeason": 103, "ID": 5}]
        assert mark_season_new([5, 6], rows) == {5: False, 6: True}

class TestApplySeasonNew:
    def test_writes_flag_and_counts_true(self):
        entries = [{"id": 1}, {"id": 2}, {"id": 3}]
        assert apply_season_new(entries, {1: True, 2: False, 3: True}) == 2
        assert [e["is_season_new"] for e in entries] == [True, False, True]

    def test_id_field_selects_match_key(self):
        entries = [{"id": 1001, "avatar_id": 8007}, {"id": 1002, "avatar_id": 8008}]
        assert apply_season_new(entries, {8007: False, 8008: True}, id_field="avatar_id") == 1
        assert [e["is_season_new"] for e in entries] == [False, True]

    def test_unlisted_id_and_missing_field_default_false(self):
        entries = [{"id": 1}, {}]
        assert apply_season_new(entries, {}) == 0
        assert [e["is_season_new"] for e in entries] == [False, False]

    def test_overwrites_previous_flag(self):
        entries = [{"id": 1, "is_season_new": True}]
        assert apply_season_new(entries, {1: False}) == 0
        assert entries[0]["is_season_new"] is False

@pytest.mark.parametrize("ids", [[], [1]])
def test_empty_current_ids_returns_empty_mapping(ids):
    result = mark_season_new(ids, _roster((102, 1), (103, 1)), id_key="AvatarID")
    assert set(result) == set(ids)
