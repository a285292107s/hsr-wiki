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

def test_baseline_missing_tags_all_empty() -> None:
    assert tag_release_versions([1503, 1512], None, "4.6") == {"1503": "", "1512": ""}

def test_baseline_same_ids_keeps_versions_idempotent() -> None:
    baseline = {"1001": "4.4", "1503": "4.6", "1512": "4.5"}
    assert tag_release_versions([1001, 1503, 1512], baseline, "4.7") == baseline

def test_new_id_gets_current_version() -> None:
    baseline = {"1001": "4.4"}
    assert tag_release_versions([1001, 1503], baseline, "4.6") == {"1001": "4.4", "1503": "4.6"}

def test_old_empty_string_preserved() -> None:
    baseline = {"1001": ""}
    assert tag_release_versions([1001, 1503], baseline, "4.6") == {"1001": "", "1503": "4.6"}

def test_current_version_empty_falls_back_to_blank() -> None:
    assert tag_release_versions([1503], {"1001": "4.4"}, "") == {"1503": ""}

def test_load_baseline_missing_file_returns_none(tmp_path: Path) -> None:
    assert load_baseline_versions(tmp_path / "characters.json") is None

def test_load_baseline_missing_field_is_empty_string(tmp_path: Path) -> None:
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
    broken = tmp_path / "characters.json"
    broken.write_text("[{", encoding="utf-8")
    with pytest.raises(ValueError):
        load_baseline_versions(broken)

    not_a_list = _write(tmp_path / "light_cones.json", {"id": 1})
    with pytest.raises(ValueError):
        load_baseline_versions(not_a_list)

def test_apply_release_versions_writes_field_and_counts_changes() -> None:
    entries = [{"id": 1001}, {"id": 1503, "release_version": ""}, {"id": 1512, "release_version": "4.5"}]
    versions = {"1001": "", "1503": "4.6", "1512": "4.5"}
    assert apply_release_versions(entries, versions) == 2
    assert [e["release_version"] for e in entries] == ["", "4.6", "4.5"]
    assert apply_release_versions(entries, versions) == 0

def test_first_seen_versions_earliest_snapshot_is_blank() -> None:
    snapshots = [("4.4", [1001, 1002]), ("4.5", [1001, 1512]), ("4.6", [1503])]
    assert first_seen_versions(snapshots) == {"1001": "", "1002": "", "1512": "4.5", "1503": "4.6"}

def test_first_seen_versions_keeps_first_occurrence() -> None:
    snapshots = [("4.4", []), ("4.5", [1512]), ("4.5", [1512, 1513]), ("4.6", [1513])]
    assert first_seen_versions(snapshots) == {"1512": "4.5", "1513": "4.5"}
