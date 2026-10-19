import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from config import OUTPUT_DIR  # noqa: E402
from converters import achievements as ach  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})

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
        assert out == {54: "1"}

    def test_missing_default_skipped(self, monkeypatch):
        monkeypatch.setattr(ach, "load_json", lambda p: (
            [{"TextJoinID": 1}, {"DefaultItem": 10}]
            if str(p).endswith("TextJoinConfig.json")
            else []
        ))
        assert ach._load_textjoin() == {}

    def test_literal_ref_without_key_skipped(self, monkeypatch):
        monkeypatch.setattr(ach, "load_json", lambda p: (
            [{"TextJoinID": 7, "DefaultItem": 70}]
            if str(p).endswith("TextJoinConfig.json")
            else [{"TextJoinItemID": 70, "TextJoinText": "不存在的字面量键"}]
        ))
        assert ach._load_textjoin() == {}

class TestExpandTextjoin:
    TM = {"1": "记忆泡", "2": "星琼"}

    def test_expands_known_id(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#54}道具", self.TM, {54: "1"})
        assert out == "归还记忆泡道具"

    def test_keeps_unknown_id(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#999}道具", self.TM, {54: "1"})
        assert out == "归还{TEXTJOIN#999}道具"

    def test_empty_text_keeps_placeholder(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#54}", self.TM, {54: "404"})
        assert out == "归还{TEXTJOIN#54}"

    def test_language_specific_text(self):
        out = ach._expand_textjoin("归还{TEXTJOIN#54}", {"1": "Memory Bubble"}, {54: "1"})
        assert out == "归还Memory Bubble"

class TestFillParams:
    def test_integer_and_percent(self):
        out = ach._fill_params("击败#1[i]名敌人，伤害提高#2[i]%", [5, 0.6])
        assert out == "击败5名敌人，伤害提高60%"

    def test_percent_multiplies_raw_value(self):
        assert ach._fill_params("提高#1[i]%", [60]) == "提高6000%"

    def test_float_format(self):
        assert ach._fill_params("造成#1[f1]%伤害", [0.125]) == "造成12.5%伤害"
        assert ach._fill_params("造成#1[f1]伤害", [12.5]) == "造成12.5伤害"

    def test_out_of_range_kept(self):
        out = ach._fill_params("击败#1[i]名敌人", [])
        assert out == "击败#1[i]名敌人"

    def test_none_value_kept(self):
        out = ach._fill_params("击败#1[i]名敌人", [None])
        assert out == "击败#1[i]名敌人"

    def test_multiple_params(self):
        out = ach._fill_params("#1[i]场战斗中#2[i]名角色", [10, 3])
        assert out == "10场战斗中3名角色"

class TestFillParamsBareForm:
    def test_bare_index(self):
        out = ach._fill_params("在《小小哈努行动》中的火箭传送时间超过#1秒", [4])
        assert out == "在《小小哈努行动》中的火箭传送时间超过4秒"

    def test_bare_multiple_refs(self):
        out = ach._fill_params("在#1分钟内与筑梦遥眼装置交互#2次以上", [2, 5])
        assert out == "在2分钟内与筑梦遥眼装置交互5次以上"

    def test_bare_percent_is_not_multiplied(self):
        assert ach._fill_params("生命值低于#2%", [1, 5]) == "生命值低于5%"
        assert ach._fill_params("处于#1%~#2%之间", [64, 68]) == "处于64%~68%之间"
        assert ach._fill_params("达到#1%时施放", [200]) == "达到200%时施放"

    def test_bare_and_tagged_in_one_template(self):
        out = ach._fill_params("我方#1名角色生命值低于#2[i]%", [1, 0.05])
        assert out == "我方1名角色生命值低于5%"

    def test_bare_follows_cjk(self):
        assert ach._fill_params("不超过#1%的情况下", [66]) == "不超过66%的情况下"
        assert ach._fill_params("收集#1个情绪齿轮", [3]) == "收集3个情绪齿轮"
        assert ach._fill_params("找到#1只不务正业的狸猫", [5]) == "找到5只不务正业的狸猫"

    def test_bare_after_comparison_operator(self):
        assert ach._fill_params("累计#1周结算时精力<=#2", [3, 500]) == "累计3周结算时精力<=500"
        assert ach._fill_params("累计#1周结算时精力>=#2", [3, 500]) == "累计3周结算时精力>=500"

class TestFillParamsGuards:
    def test_color_code_not_touched(self):
        out = ach._fill_params("<color=#8790abff>※恭喜！你登上了星穹列车！</color>", [7])
        assert out == "<color=#8790abff>※恭喜！你登上了星穹列车！</color>"

    def test_bare_color_code_without_tag(self):
        assert ach._fill_params("颜色码 #121214 结束", [3]) == "颜色码 #121214 结束"

    def test_color_code_then_real_placeholder(self):
        out = ach._fill_params("<color=#8790abff>※收集#1个情绪齿轮</color>", [3])
        assert out == "<color=#8790abff>※收集3个情绪齿轮</color>"

    def test_textjoin_marker_passes_through(self):
        assert ach._fill_params("{TEXTJOIN#61}", [9]) == "{TEXTJOIN#61}"
        assert ach._fill_params("{TEXTJOIN#87}上的迷钟#1个", [2]) == "{TEXTJOIN#87}上的迷钟2个"
        assert ach._fill_params("归还{TEXTJOIN#54}", []) == "归还{TEXTJOIN#54}"

    def test_ascii_prefixed_hash_is_expanded(self):
        assert ach._fill_params("untuk mengalahkan#1 musuh", [2]) == "untuk mengalahkan2 musuh"
        assert ach._fill_params("un total de Faveur x#1", [8]) == "un total de Faveur x8"
        assert ach._fill_params("dés temporels#2 en", [3, 6]) == "dés temporels6 en"
        assert ach._fill_params("A#1 前缀", [9]) == "A9 前缀"

    def test_double_hash_not_touched(self):
        assert ach._fill_params("##1 双井号", [9]) == "##1 双井号"

class TestJsRound:
    def test_half_values_round_half_up(self):
        assert [ach._js_round(v) for v in (0.5, 1.5, 2.5, 3.5)] == [1, 2, 3, 4]

    def test_negative_half_values(self):
        assert [ach._js_round(v) for v in (-0.5, -1.5, -2.5)] == [0, -1, -2]

    def test_non_half_values(self):
        assert [ach._js_round(v) for v in (2.4, 2.6, -2.4, -2.6)] == [2, 3, -2, -3]

    def test_differs_from_builtin_round(self):
        assert round(0.5) != ach._js_round(0.5)
        assert round(2.5) != ach._js_round(2.5)

    def test_applied_through_fill_params(self):
        assert ach._fill_params("#1[i]", [0.5]) == "1"
        assert ach._fill_params("#1[i]", [1.5]) == "2"
        assert ach._fill_params("#1[i]", [2.5]) == "3"
        assert ach._fill_params("#1[i]", [-1.5]) == "-1"
        assert ach._fill_params("#1[i]", [-2.5]) == "-2"
        assert ach._fill_params("#1[i]%", [0.005]) == "1%"

class TestFmtValParity:
    def test_integral_float_has_no_decimal_point(self):
        assert ach._fmt_val(50.0, "", False) == "50"
        assert ach._fmt_val(200.0, "", False) == "200"

    def test_ratio_and_percent(self):
        assert ach._fmt_val(0.05, "i", True) == "5"
        assert ach._fmt_val(0.01, "i", True) == "1"
        assert ach._fmt_val(0.05, "", False) == "0.05"

    def test_unknown_tag_keeps_value_unrounded(self):
        assert ach._fmt_val(1000000, "m", False) == "1000000"

    def test_empty_tag(self):
        assert ach._fmt_val(50, "", False) == "50"

    def test_non_numeric_passthrough(self):
        assert ach._fmt_val("abc", "i", False) == "abc"

class TestDescText:
    def test_textjoin_then_params(self):
        tm = {"1": "记忆泡", "9": "归还{TEXTJOIN#54}#1[i]个"}
        assert ach._desc_text(tm, "9", [3], {54: "1"}) == "归还记忆泡3个"

    def test_bare_placeholder_end_to_end(self):
        tm = {"9": "火箭传送时间超过#1秒"}
        assert ach._desc_text(tm, "9", [4], {}) == "火箭传送时间超过4秒"

    def test_color_code_survives_combo_then_placeholder(self):
        tm = {"9": "多事\\n<color=#8790abff>※收集#1个情绪齿轮</color>"}
        assert ach._desc_text(tm, "9", [3], {}) == "多事\n※收集3个情绪齿轮"

    def test_missing_template_key_yields_empty(self):
        assert ach._desc_text({}, "404", [1], {}) == ""

    def test_unwrap_param_values(self):
        tm = {"9": "击败#1[i]名敌人"}
        out = ach._desc_text(tm, "9", [{"Value": 40}], {})
        assert out == "击败40名敌人"

    def test_unwrap_ratio_value(self):
        tm = {"9": "生命值百分比同时小于等于#1[i]%"}
        out = ach._desc_text(tm, "9", [{"Value": 0.05}], {})
        assert out == "生命值百分比同时小于等于5%"

    def test_keeps_newline_and_note(self):
        tm = {"9": "通关贝洛伯格\\n※成就完成", "8": "已含真换行\n第二行"}
        assert ach._desc_text(tm, "9", [], {}) == "通关贝洛伯格\n※成就完成"
        assert ach._desc_text(tm, "8", [], {}) == "已含真换行\n第二行"

    def test_unresolvable_placeholder_kept(self):
        assert ach._desc_text({"9": "击败#1名敌人"}, "9", [], {}) == "击败#1名敌人"

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

        series = saved[str(OUTPUT_DIR / "achievement_series.json")]
        assert [s["id"] for s in series] == [4, 1]
        assert series[0]["icon"] == "BIcon"
        assert series[0]["icon_s"] == "BIcon_s"

        achievements = saved[str(OUTPUT_DIR / "achievements.json")]
        assert [a["id"] for a in achievements] == [404, 402, 401]

    def test_unknown_series_priority_fallback(self, monkeypatch):
        def fake_load(path):
            name = str(path)
            if name.endswith("AchievementSeries.json"):
                return [{"SeriesID": 1, "SeriesTitle": {"Hash": 1}, "Priority": 500}]
            if name.endswith("AchievementData.json"):
                return [
                    {"AchievementID": 1, "SeriesID": 99, "Priority": 100, "ParamList": []},
                    {"AchievementID": 2, "SeriesID": 1, "Priority": 500, "ParamList": []},
                ]
            if name.endswith("TextJoinConfig.json"):
                return []
            return []

        monkeypatch.setattr(ach, "load_json", fake_load)
        saved = {}
        monkeypatch.setattr(ach, "save_json", lambda data, path: saved.__setitem__(str(path), data))
        ach.convert()
        achievements = saved[str(OUTPUT_DIR / "achievements.json")]
        assert len(achievements) == 2
        assert [a["id"] for a in achievements] == [2, 1]