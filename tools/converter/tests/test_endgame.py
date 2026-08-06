"""endgame 转换器纯函数契约测试。

用合成数据验证核心行为，不依赖真实源数据：
- _load_schedules：ScheduleID-200000 → GroupID 映射；公测前/2030 未来占位过滤
- _season_stats：层数/阶段/回合取最大，弱点属性全层合并去重
- _group_seasons：名称解析 + 排期合并 + 统计合并
- _peak_seasons：异相仲裁弱点属性

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import endgame as eg  # noqa: E402


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})


# ─── _load_schedules ────────────────────────────────────────────

class TestLoadSchedules:
    def test_maps_and_filters(self, monkeypatch):
        monkeypatch.setattr(eg, "load_json", lambda _p: [
            # 正常排期 → 组 101（200101-200000）
            {"ID": 200101, "BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
            # 公测前整段（beta 占位）→ 丢弃
            {"ID": 200102, "BeginTime": "2022-11-14 04:00:00", "EndTime": "2022-11-28 04:00:00"},
            # 起点 2030+（未来占位）→ 丢弃
            {"ID": 200108, "BeginTime": "2033-02-06 04:00:00", "EndTime": "2033-02-20 04:00:00"},
            {"ID": 201034, "BeginTime": "2030-01-01 04:00:00", "EndTime": "2030-01-15 04:00:00"},
            # 缺字段 / 非法日期 → 丢弃
            {"ID": 201001, "BeginTime": "", "EndTime": "2023-09-18 04:00:00"},
            {"ID": 201002, "BeginTime": "not-a-date", "EndTime": "2023-09-18 04:00:00"},
            {"BeginTime": "2023-09-04 04:00:00", "EndTime": "2023-09-18 04:00:00"},
        ])
        result = eg._load_schedules()
        # 仅 101 保留，其余全部过滤
        assert set(result.keys()) == {"101"}
        assert result["101"] == ("2023-09-04 04:00:00", "2023-09-18 04:00:00")


# ─── _season_stats ──────────────────────────────────────────────

class TestSeasonStats:
    def test_max_of_floors_stage_countdown(self):
        recs = [
            {"Floor": 1, "StageNum": 2, "ChallengeCountDown": 40,
             "DamageType1": ["Fire"], "DamageType2": ["Ice"]},
            {"Floor": 10, "StageNum": 3, "ChallengeCountDown": 60,
             "DamageType1": ["Fire", "Imaginary"], "DamageType2": ["Physical"]},
        ]
        result = eg._season_stats(recs)
        assert result["floors"] == 10
        assert result["stage_num"] == 3
        assert result["countdown"] == 60
        assert result["damage_types"] == ["Fire", "Ice", "Imaginary", "Physical"]

    def test_missing_fields_default_zero_and_empty(self):
        result = eg._season_stats([{"Floor": None}])
        assert result == {"damage_types": [], "floors": 0, "stage_num": 0, "countdown": 0}

    def test_damage_dedup_and_sorted(self):
        recs = [
            {"DamageType1": ["Wind"], "DamageType2": ["Wind", "Fire"]},
            {"DamageType1": ["Fire"], "DamageType2": ["Ice"]},
        ]
        result = eg._season_stats(recs)
        assert result["damage_types"] == ["Fire", "Ice", "Wind"]


# ─── _group_seasons ─────────────────────────────────────────────

class TestGroupSeasons:
    def test_merges_schedule_and_stats(self, monkeypatch):
        recs = [
            {"GroupID": 1001, "ID": 2002, "Name": {"Hash": 1}, "Floor": 2,
             "DamageType1": ["Fire"]},
            {"GroupID": 1001, "ID": 2001, "Name": {"Hash": 2}, "Floor": 1,
             "ChallengeCountDown": 40},
        ]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons(
            "ChallengeMazeConfig.json", "Name",
            {"1001": ("2023-09-04 04:00:00", "2023-09-18 04:00:00")},
        )
        entry = out["1001"]
        assert entry["zh"] == ""  # mock TextMap 空 → 未解析
        assert entry["live_begin"] == "2023-09-04 04:00:00"
        assert entry["live_end"] == "2023-09-18 04:00:00"
        assert entry["floors"] == 2
        assert entry["countdown"] == 40
        assert entry["damage_types"] == ["Fire"]

    def test_no_schedule_keeps_dates_empty(self, monkeypatch):
        recs = [{"GroupID": 900, "ID": 1, "Name": {"Hash": 1}}]
        monkeypatch.setattr(eg, "load_json", lambda _p: recs)
        out = eg._group_seasons("ChallengeMazeConfig.json", "Name", {})
        entry = out["900"]
        assert entry["live_begin"] == ""
        assert entry["live_end"] == ""
        assert entry["damage_types"] == []


# ─── _peak_seasons ──────────────────────────────────────────────

class TestPeakSeasons:
    def test_damage_types_from_single_list(self, monkeypatch):
        data = [
            {"ID": 101, "Title": {"Hash": 1}, "DamageType": ["Fire", "Imaginary"]},
            {"ID": 102, "Title": {"Hash": 2}, "DamageType": []},
        ]
        monkeypatch.setattr(eg, "load_json", lambda _p: data)
        out = eg._peak_seasons()
        assert out["101"]["damage_types"] == ["Fire", "Imaginary"]
        assert out["102"]["damage_types"] == []
        assert out["101"]["live_begin"] == ""
