import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from season_scope import (  # noqa: E402
    apply_season_ids,
    current_season,
    season_meta,
    season_membership,
    season_registrations,
    sub_seasons,
    verify_season_ids,
)

def _modules(*pairs: tuple[int, int]) -> list[dict]:
    return [{"SeasonID": s, "SubSeasonID": sub} for s, sub in pairs]

class TestCurrentSeason:
    def test_returns_max_season(self):
        rows = _modules((1, 1), (2, 1), (1, 2))
        assert current_season(rows) == 2

    def test_empty_or_none_returns_none(self):
        assert current_season([]) is None
        assert current_season(None) is None

    def test_ignores_missing_and_non_int_season(self):
        rows = [{"SeasonID": 1, "SubSeasonID": 1}, {"SubSeasonID": 2},
                {"SeasonID": None}, {"SeasonID": "2"}, {"SeasonID": True}]
        assert current_season(rows) == 1

class TestSubSeasons:
    def test_current_season_sub_seasons_sorted_and_deduped(self):
        rows = _modules((1, 3), (1, 1), (1, 3))
        assert sub_seasons(rows) == [1, 3]

    def test_only_current_season_sub_seasons_are_counted(self):
        assert sub_seasons(_modules((1, 1), (1, 2), (2, 3))) == [3]

    def test_explicit_season_id(self):
        assert sub_seasons(_modules((1, 1), (2, 1), (2, 2)), season_id=1) == [1]

    def test_unknown_season_yields_empty(self):
        assert sub_seasons(_modules((1, 1)), season_id=9) == []
        assert sub_seasons([]) == []

    def test_ignores_invalid_sub_season(self):
        rows = [{"SeasonID": 1, "SubSeasonID": 1}, {"SeasonID": 1, "SubSeasonID": "2"},
                {"SeasonID": 1, "SubSeasonID": None}, {"SeasonID": 1}]
        assert sub_seasons(rows) == [1]

class TestSeasonMeta:
    def test_meta_carries_current_season_and_sub_seasons(self):
        assert season_meta(_modules((1, 1), (1, 2), (1, 3), (1, 4))) == {
            "id": 1,
            "sub_season_ids": [1, 2, 3, 4],
        }

    def test_missing_module_warns_and_yields_null(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            meta = season_meta(None)
        assert meta == {"id": None, "sub_season_ids": []}
        assert any("赛季元数据缺失" in r.message for r in caplog.records)

class TestSeasonMembership:
    def test_maps_entity_to_season(self):
        rows = [{"AugmentID": 1, "SeasonID": 1}, {"AugmentID": 2, "SeasonID": 2}]
        assert season_membership(rows, "AugmentID") == {1: 1, 2: 2}

    def test_custom_season_key(self):
        rows = [{"TraitID": 1001, "Season": 1}]
        assert season_membership(rows, "TraitID", "Season") == {1001: 1}

    def test_missing_or_invalid_fields_are_skipped(self):
        rows = [{"AugmentID": 1, "SeasonID": 1}, {"SeasonID": 1}, {"AugmentID": 2},
                {"AugmentID": 3, "SeasonID": "1"}, {"AugmentID": 4, "SeasonID": None}]
        assert season_membership(rows, "AugmentID") == {1: 1}

    def test_conflicting_seasons_keep_first_and_warn(self, caplog):
        rows = [{"AugmentID": 1, "SeasonID": 1}, {"AugmentID": 1, "SeasonID": 2},
                {"AugmentID": 1, "SeasonID": 1}]
        with caplog.at_level(logging.WARNING, logger="converter"):
            membership = season_membership(rows, "AugmentID")
        assert membership == {1: 1}
        assert any("赛季归属冲突" in r.message for r in caplog.records)

    def test_none_rows_yields_empty(self):
        assert season_membership(None, "AugmentID") == {}

class TestApplySeasonIds:
    def test_writes_matched_season_and_null_when_missing(self):
        entries = [{"id": 1}, {"id": 2}, {"id": 3}]
        assert apply_season_ids(entries, {1: 1, 2: 2}) == 2
        assert [e["season_id"] for e in entries] == [1, 2, None]

    def test_id_field_selects_match_key(self):
        entries = [{"ID": 10, "id": 1}]
        assert apply_season_ids(entries, {10: 2}, id_field="ID") == 1
        assert entries[0]["season_id"] == 2

    def test_overwrites_previous_value(self):
        entries = [{"id": 1, "season_id": 9}]
        assert apply_season_ids(entries, {1: 2}) == 1
        assert entries[0]["season_id"] == 2

    def test_missing_entries_warn_once_with_label(self, caplog):
        entries = [{"id": 1}, {"id": 2}]
        with caplog.at_level(logging.WARNING, logger="converter"):
            apply_season_ids(entries, {}, label="投资策略")
        messages = [r.message for r in caplog.records if r.levelno >= logging.WARNING]
        assert len(messages) == 1
        assert "投资策略" in messages[0] and "2 条" in messages[0]

    def test_all_matched_emits_no_warning(self, caplog):
        with caplog.at_level(logging.WARNING, logger="converter"):
            apply_season_ids([{"id": 1}], {1: 1}, label="投资环境")
        assert [r for r in caplog.records if r.levelno >= logging.WARNING] == []

class TestSeasonRegistrations:
    def test_collects_every_season_of_an_id(self):
        rows = [{"TraitID": 1, "SeasonID": 1}, {"TraitID": 1, "SeasonID": 2},
                {"TraitID": 2, "SeasonID": 2}]
        assert season_registrations(rows, "TraitID") == {
            1: frozenset({1, 2}),
            2: frozenset({2}),
        }

    def test_missing_or_invalid_fields_are_skipped(self):
        rows = [{"TraitID": 1, "SeasonID": 1}, {"SeasonID": 1}, {"TraitID": 2},
                {"TraitID": 3, "SeasonID": "1"}]
        assert season_registrations(rows, "TraitID") == {1: frozenset({1})}

    def test_none_rows_yields_empty(self):
        assert season_registrations(None, "TraitID") == {}

class TestVerifySeasonIds:
    def test_season_outside_registrations_counts_as_mismatch(self):
        entries = [{"id": 1, "season_id": 1}, {"id": 2, "season_id": 1}]
        assert verify_season_ids(entries, {1: frozenset({1}), 2: frozenset({2})}) == 1

    def test_registered_in_several_seasons_is_not_a_mismatch(self):
        entries = [{"id": 1, "season_id": 2}]
        assert verify_season_ids(entries, {1: frozenset({1, 2})}) == 0

    def test_entity_not_in_registrations_is_ignored(self):
        entries = [{"id": 3, "season_id": 1}]
        assert verify_season_ids(entries, {1: frozenset({1})}) == 0

    def test_mismatch_warns_with_label(self, caplog):
        entries = [{"id": 1, "season_id": 1}]
        with caplog.at_level(logging.WARNING, logger="converter"):
            verify_season_ids(entries, {1: frozenset({2})}, label="羁绊")
        assert any("赛季归属不一致" in r.message and "羁绊" in r.message for r in caplog.records)
