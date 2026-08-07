"""achievements 转换器纯函数契约测试。

用合成数据验证核心行为，不依赖真实源数据：
- _expand_textjoin：{TEXTJOIN#id} → DefaultItem → TextJoinItem → TextMap 展开
- _fill_params：#n[i] 参数占位替换（整数/百分比/越界/空值兜底）
- _parse_achievement：字段映射 + show_type 空值归一
- _parse_series：系列图标文件名提取
- convert：排序（系列 Priority 升序 + 成就 Priority 降序）+ 双文件输出

运行: cd tools/converter && python -m pytest tests/ -v
"""

import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from config import OUTPUT_DIR  # noqa: E402
from converters import achievements as ach  # noqa: E402


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})


# ─── _load_textjoin ─────────────────────────────────────────────

class TestLoadTextjoin:
    def test_default_item_resolution(self, monkeypatch):
        monkeypatch.setattr(ach, "load_json", lambda p: (
            [{"TextJoinID": 54, "DefaultItem": 540, "TextJoinItemList": [540, 541]}]
            if str(p).endswith("TextJoinConfig.json")
            else [{"TextJoinItemID": 540, "TextJoinText": {"Hash": 1}},
                  {"TextJoinItemID": 541, "TextJoinText": {"Hash": 2}},
                  {"TextJoinItemID": 999, "TextJoinText": "无引用条目"}]
        ))
        out = ach._load_textjoin()
        assert out == {54: ""}  # mock TextMap 空 → 文本为空串

    def test_missing_default_skipped(self, monkeypatch):
        monkeypatch.setattr(ach, "load_json", lambda p: (
            [{"TextJoinID": 1}, {"DefaultItem": 10}]
            if str(p).endswith("TextJoinConfig.json")
            else []
        ))
        assert ach._load_textjoin() == {}


# ─── _expand_textjoin ───────────────────────────────────────────

class TestExpandTextjoin:
    def test_expands_known_id(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#54}道具", {54: "记忆泡"})
        assert out == "归还记忆泡道具"

    def test_keeps_unknown_id(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#999}道具", {54: "记忆泡"})
        assert out == "归还{TEXTJOIN#999}道具"

    def test_empty_text_keeps_placeholder(self):
        """解析出的文本为空串时保留占位符（避免误删信息）。"""
        out = ach._expand_textjoin("归还{TEXTJOIN#54}", {54: ""})
        assert out == "归还{TEXTJOIN#54}"


# ─── _fill_params ───────────────────────────────────────────────

class TestFillParams:
    def test_integer_and_percent(self):
        out = ach._fill_params("击败#1[i]名敌人，伤害提高#2[i]%", [5, 60])
        assert out == "击败5名敌人，伤害提高60%"

    def test_float_format(self):
        out = ach._fill_params("造成#1[f1]%伤害", [12.5])
        assert out == "造成12.5%伤害"

    def test_out_of_range_kept(self):
        out = ach._fill_params("击败#1[i]名敌人", [])
        assert out == "击败#1[i]名敌人"

    def test_none_value_kept(self):
        out = ach._fill_params("击败#1[i]名敌人", [None])
        assert out == "击败#1[i]名敌人"

    def test_multiple_params(self):
        out = ach._fill_params("#1[i]场战斗中#2[i]名角色", [10, 3])
        assert out == "10场战斗中3名角色"


# ─── _format_desc ───────────────────────────────────────────────

class TestFormatDesc:
    def test_textjoin_then_params(self):
        textjoin = {54: "记忆泡"}
        out = ach._format_desc("归还{TEXTJOIN#54}#1[i]个", [3], textjoin)
        assert out == "归还记忆泡3个"

    def test_unwrap_param_values(self):
        out = ach._format_desc("击败#1[i]名敌人", [{"Value": 40}], {})
        assert out == "击败40名敌人"

    def test_keeps_newline_and_note(self):
        out = ach._format_desc("通关贝洛伯格\n※成就完成", [], {})
        assert out == "通关贝洛伯格\n※成就完成"


# ─── _parse_achievement ─────────────────────────────────────────

class TestParseAchievement:
    def test_field_mapping(self, monkeypatch):
        item = {
            "AchievementID": 4010101,
            "AchievementTitle": {"Hash": 1},
            "AchievementDesc": {"Hash": 2},
            "Rarity": "High",
            "SeriesID": 4,
            "Priority": 10000,
            "ParamList": [{"Value": 3}],
            "ShowType": "ShowAfterFinish",
        }
        out = ach._parse_achievement(item, {})
        assert out["id"] == 4010101
        assert out["rarity"] == "High"
        assert out["series_id"] == 4
        assert out["priority"] == 10000
        assert out["show_type"] == "ShowAfterFinish"

    def test_show_type_none_normalized_to_empty(self):
        out = ach._parse_achievement({"AchievementID": 1, "ShowType": None}, {})
        assert out["show_type"] == ""

    def test_missing_desc_defaults(self):
        out = ach._parse_achievement({"AchievementID": 1}, {})
        assert out["title"] == ""
        assert out["desc"] == ""


# ─── _series_icon ───────────────────────────────────────────────

class TestSeriesIcon:
    def test_stem_extraction(self):
        assert ach._series_icon("SpriteOutput/Achievement/CultivateAchievementIcon_s.png") == "CultivateAchievementIcon_s"
        assert ach._series_icon("SpriteOutput/Achievement/CultivateAchievementIcon.png") == "CultivateAchievementIcon"

    def test_empty_path(self):
        assert ach._series_icon("") == ""


# ─── convert ────────────────────────────────────────────────────

class TestConvert:
    def test_sort_and_output(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("AchievementSeries.json"):
                return [
                    {"SeriesID": 1, "SeriesTitle": {"Hash": 1}, "Priority": 9,
                     "MainIconPath": "SpriteOutput/Achievement/AIcon.png",
                     "IconPath": "SpriteOutput/Achievement/AIcon_s.png"},
                    {"SeriesID": 4, "SeriesTitle": {"Hash": 2}, "Priority": 1,
                     "MainIconPath": "SpriteOutput/Achievement/BIcon.png",
                     "IconPath": "SpriteOutput/Achievement/BIcon_s.png"},
                ]
            if name.endswith("AchievementData.json"):
                return [
                    {"AchievementID": 401, "AchievementTitle": {"Hash": 3}, "SeriesID": 1,
                     "Rarity": "Mid", "Priority": 5000, "ParamList": []},
                    {"AchievementID": 402, "AchievementTitle": {"Hash": 4}, "SeriesID": 1,
                     "Rarity": "Low", "Priority": 6000, "ParamList": []},
                    {"AchievementID": 404, "AchievementTitle": {"Hash": 5}, "SeriesID": 4,
                     "Rarity": "High", "Priority": 9000, "ParamList": []},
                ]
            if name.endswith("TextJoinConfig.json"):
                return []
            return []

        monkeypatch.setattr(ach, "load_json", fake_load)
        saved = {}
        monkeypatch.setattr(ach, "save_json", lambda data, path: saved.__setitem__(str(path), data))

        ach.convert()

        # 系列按 Priority 升序
        series = saved[str(OUTPUT_DIR / "achievement_series.json")]
        assert [s["id"] for s in series] == [4, 1]
        assert series[0]["icon"] == "BIcon"
        assert series[0]["icon_s"] == "BIcon_s"

        # 成就：系列 4 在前；系列内按 Priority 降序
        achievements = saved[str(OUTPUT_DIR / "achievements.json")]
        assert [a["id"] for a in achievements] == [404, 402, 401]

    def test_unknown_series_priority_fallback(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("AchievementSeries.json"):
                return []
            if name.endswith("AchievementData.json"):
                return [{"AchievementID": 1, "SeriesID": 99, "Priority": 100, "ParamList": []}]
            if name.endswith("TextJoinConfig.json"):
                return []
            return []

        monkeypatch.setattr(ach, "load_json", fake_load)
        saved = {}
        monkeypatch.setattr(ach, "save_json", lambda data, path: saved.__setitem__(str(path), data))
        ach.convert()
        achievements = saved[str(OUTPUT_DIR / "achievements.json")]
        assert len(achievements) == 1  # 无系列引用也不崩溃