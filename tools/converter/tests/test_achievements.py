"""achievements 转换器纯函数契约测试。

用合成数据验证核心行为，不依赖真实源数据：
- _expand_textjoin：{TEXTJOIN#id} → DefaultItem → TextJoinItem → TextMap 展开
- _fill_params：`#n[tag]%` 与**裸** `#n` 参数占位替换（数值口径对齐前端 fmtVal、越界/空值兜底）
- _fmt_val / _js_round：`%` ×100、`i` 取整（半值向 +∞，与 JS Math.round 一致）、`f1`–`f6`
- _parse_achievement：字段映射 + show_type 空值归一
- _parse_series：系列图标文件名提取
- convert：排序（系列 Priority 升序 + 成就 Priority 降序）+ 双文件输出

数值与占位符口径的唯一参照是 `src/lib/format.ts` 的 `fmtVal`(:13-24) 与 `fmtDesc`(:66-81)：
转换器这份实现是它的**第二份实现**，两侧必须逐值一致。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from config import OUTPUT_DIR  # noqa: E402
from converters import achievements as ach  # noqa: E402

@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})

class TestLoadTextjoin:
    """TEXTJOIN 索引存的是 **TextMap 键**（不是文本）：组合要按语言各自取值。"""

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
        """字面量引用既不在文本表、xxhash 也查不到 ⇒ text_key_of 返回 None ⇒ 不建索引。

        （`{"Hash": N}` 形态的键总是可用——它是全局键空间的一部分，与某语言文本表是否收录无关。）
        """
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
        """该语言文本表里键缺失时保留占位符（避免误删信息）。"""
        out = ach._expand_textjoin("归还{TEXTJOIN#54}", self.TM, {54: "404"})
        assert out == "归还{TEXTJOIN#54}"

    def test_language_specific_text(self):
        """同一 TEXTJOIN id 在不同语言表下产出不同正文——这正是「按语言组合」的意义。"""
        out = ach._expand_textjoin("归还{TEXTJOIN#54}", {"1": "Memory Bubble"}, {54: "1"})
        assert out == "归还Memory Bubble"

class TestFillParams:
    def test_integer_and_percent(self):
        """`%` 是 ×100 指令（不是后缀）：参数是比率。

        口径来源：`src/lib/format.ts:13-24` 的 `fmtVal` —— `if (isPct) n = n * 100`。
        旧断言期望 `"60%"`（即 `#2[i]%` 传 60）编码的是**修复前**行为（`%` 直接后缀、
        不做 ×100）；按 fmtVal 口径 60 应得 `6000%`，故此处改传比率 0.6。
        """
        out = ach._fill_params("击败#1[i]名敌人，伤害提高#2[i]%", [5, 0.6])
        assert out == "击败5名敌人，伤害提高60%"

    def test_percent_multiplies_raw_value(self):
        """守卫旧口径：`#N[i]%` 传 60 得 `6000%`（证明 ×100 真的生效，而非恰好相等）。"""
        assert ach._fill_params("提高#1[i]%", [60]) == "提高6000%"

    def test_float_format(self):
        """`f1` 是定点（1 位小数）舍入；带 `%` 时同样先 ×100。

        口径来源：`src/lib/format.ts:13-24` 的 `fmtVal`。
        旧断言 `#1[f1]%` 传 12.5 期望 `"12.5%"` 编码的是**修复前**行为；按 fmtVal 口径
        12.5 ×100 = 1250，`Math.round(1250 × 10) / 10` = `1250`。小数位用例改用比率 0.125。
        """
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
    """**裸** `#N` / `#N%`（无 `[tag]`）：前端 `fmtDesc` 的第二条正则（src/lib/format.ts:78）。

    `s.replace(/#(\\d+)/g, (_, i) => rep(i, '', ''))` —— 标签传空串、`pct` 也传空串，
    故裸形式的尾部 `%` **不进 `fmtVal`**（不触发 ×100），它只是模板里的字面字符。
    """

    def test_bare_index(self):
        """H2 实测锚点：4043019「火箭传送时间超过#1秒」，ParamList=[4]。"""
        out = ach._fill_params("在《小小哈努行动》中的火箭传送时间超过#1秒", [4])
        assert out == "在《小小哈努行动》中的火箭传送时间超过4秒"

    def test_bare_multiple_refs(self):
        out = ach._fill_params("在#1分钟内与筑梦遥眼装置交互#2次以上", [2, 5])
        assert out == "在2分钟内与筑梦遥眼装置交互5次以上"

    def test_bare_percent_is_not_multiplied(self):
        """裸 `#N%` 的 `%` 是字面字符 ⇒ **不做 ×100**。

        实测 6 条此类模板的参数本就是百分数（5 / 50 / 100 / 200 / 66 / 64,68），
        再乘 100 会得到 `500%`。前端同理：`fmtDesc` 只把 `pct=''` 传进 `fmtVal`（:78）。
        """
        assert ach._fill_params("生命值低于#2%", [1, 5]) == "生命值低于5%"
        assert ach._fill_params("处于#1%~#2%之间", [64, 68]) == "处于64%~68%之间"
        assert ach._fill_params("达到#1%时施放", [200]) == "达到200%时施放"

    def test_bare_and_tagged_in_one_template(self):
        """同一模板里两种形态共存，各自口径独立（带标签的 ×100、裸的不乘）。"""
        out = ach._fill_params("我方#1名角色生命值低于#2[i]%", [1, 0.05])
        assert out == "我方1名角色生命值低于5%"

    def test_bare_follows_cjk(self):
        """前置断言**不得**用 `\\w`：它含 CJK，会把紧随汉字的占位符一并挡掉。

        成就模板里绝大多数裸 `#N` 前面就是汉字（实测 577 条模板）。
        """
        assert ach._fill_params("不超过#1%的情况下", [66]) == "不超过66%的情况下"
        assert ach._fill_params("收集#1个情绪齿轮", [3]) == "收集3个情绪齿轮"
        assert ach._fill_params("找到#1只不务正业的狸猫", [5]) == "找到5只不务正业的狸猫"

    def test_bare_after_comparison_operator(self):
        """`<=#2` / `>=#2` 的占位符仍须展开（只挡颜色码那一种 `=` 形态）。"""
        assert ach._fill_params("累计#1周结算时精力<=#2", [3, 500]) == "累计3周结算时精力<=500"
        assert ach._fill_params("累计#1周结算时精力>=#2", [3, 500]) == "累计3周结算时精力>=500"

class TestFillParamsGuards:
    """裸形式正则的防误伤：颜色码、TEXTJOIN 合并标记、`##`。"""

    def test_color_code_not_touched(self):
        """`<color=#8790abff>` 是十六进制颜色码，不是占位符（成就模板里 357 处全属此类）。"""
        out = ach._fill_params("<color=#8790abff>※恭喜！你登上了星穹列车！</color>", [7])
        assert out == "<color=#8790abff>※恭喜！你登上了星穹列车！</color>"

    def test_bare_color_code_without_tag(self):
        """颜色码后即使没有 `<color=` 前缀也不能被当占位符（`#` 后跟 6 位十六进制）。"""
        assert ach._fill_params("颜色码 #121214 结束", [3]) == "颜色码 #121214 结束"

    def test_color_code_then_real_placeholder(self):
        """同一个 `<color=…>` 段里的真占位符仍须展开。"""
        out = ach._fill_params("<color=#8790abff>※收集#1个情绪齿轮</color>", [3])
        assert out == "<color=#8790abff>※收集3个情绪齿轮</color>"

    def test_textjoin_marker_passes_through(self):
        """`{TEXTJOIN#61}` 是**上游合并标记**，须放行（不得当占位符替换）。

        实测成就模板引用 TEXTJOIN#87 / #54 共 15 处；`{TEXTJOIN#61}` 出现在其它表里，
        这里一并钉住：其前置字符是 ASCII 字母 ⇒ 被断言挡住。
        """
        assert ach._fill_params("{TEXTJOIN#61}", [9]) == "{TEXTJOIN#61}"
        assert ach._fill_params("{TEXTJOIN#87}上的迷钟#1个", [2]) == "{TEXTJOIN#87}上的迷钟2个"
        assert ach._fill_params("归还{TEXTJOIN#54}", []) == "归还{TEXTJOIN#54}"

    def test_ascii_prefixed_hash_is_expanded(self):
        """紧跟 ASCII 字母的 `#N` **是**占位符，必须展开（旧断言过严，已订正）。

        依据是上游真实译文（不是构造）：占位符会紧贴词尾字母——
        fr `Obtenir au moins 3 dés temporels#2 en un seul tour`（成就 4053225，ParamList [3,6]）、
        fr `un total de Faveur x#1`（4075011，[8]）、id `untuk mengalahkan#1 musuh`（4075103，[2]）。
        旧断言把 `A#1` / `_#1` / `9#1` 钉成「不得展开」，是拿「TEXTJOIN 形态」做近似，
        导致这 3 处可展开的占位符原样上屏（还进了可索引快照）。真正的 TEXTJOIN 形态
        由 `test_textjoin_marker_not_touched` 按 `{TEXTJOIN#N}` 精确钉住。
        """
        assert ach._fill_params("untuk mengalahkan#1 musuh", [2]) == "untuk mengalahkan2 musuh"
        assert ach._fill_params("un total de Faveur x#1", [8]) == "un total de Faveur x8"
        assert ach._fill_params("dés temporels#2 en", [3, 6]) == "dés temporels6 en"
        assert ach._fill_params("A#1 前缀", [9]) == "A9 前缀"

    def test_double_hash_not_touched(self):
        assert ach._fill_params("##1 双井号", [9]) == "##1 双井号"

class TestJsRound:
    """Python `round()` 是 banker's rounding，与前端 `Math.round` 在 .5 处逐值不同。

    实测 Node：`Math.round(0.5)=1` / `Math.round(2.5)=3` / `Math.round(-1.5)=-1`
    / `Math.round(-2.5)=-2`；而 `round(0.5)=0` / `round(2.5)=2` / `round(-1.5)=-2`。
    """

    def test_half_values_round_half_up(self):
        assert [ach._js_round(v) for v in (0.5, 1.5, 2.5, 3.5)] == [1, 2, 3, 4]

    def test_negative_half_values(self):
        assert [ach._js_round(v) for v in (-0.5, -1.5, -2.5)] == [0, -1, -2]

    def test_non_half_values(self):
        assert [ach._js_round(v) for v in (2.4, 2.6, -2.4, -2.6)] == [2, 3, -2, -3]

    def test_differs_from_builtin_round(self):
        """守卫：证明这不是 `round()` 的等价改写（否则本用例无意义）。"""
        assert round(0.5) != ach._js_round(0.5)
        assert round(2.5) != ach._js_round(2.5)

    def test_applied_through_fill_params(self):
        """半值必须经 `_fill_params` 的 `[i]` 通道生效（不是只测辅助函数）。"""
        assert ach._fill_params("#1[i]", [0.5]) == "1"
        assert ach._fill_params("#1[i]", [1.5]) == "2"
        assert ach._fill_params("#1[i]", [2.5]) == "3"
        assert ach._fill_params("#1[i]", [-1.5]) == "-1"
        assert ach._fill_params("#1[i]", [-2.5]) == "-2"
        # 0.005 ×100 = 0.5 → 半值向上
        assert ach._fill_params("#1[i]%", [0.005]) == "1%"

class TestFmtValParity:
    """数值格式化是 `fmtVal` 的第二份实现，口径须逐值一致（src/lib/format.ts:13-24）。"""

    def test_integral_float_has_no_decimal_point(self):
        """JS `String(50)` 是 `'50'`，Python `str(50.0)` 是 `'50.0'`。"""
        assert ach._fmt_val(50.0, "", False) == "50"
        assert ach._fmt_val(200.0, "", False) == "200"

    def test_ratio_and_percent(self):
        assert ach._fmt_val(0.05, "i", True) == "5"
        assert ach._fmt_val(0.01, "i", True) == "1"
        assert ach._fmt_val(0.05, "", False) == "0.05"

    def test_unknown_tag_keeps_value_unrounded(self):
        """`fmtVal` 只认 `i` 与 `f1`–`f6`；其它标签原样输出（实测数据里出现 `m`）。"""
        assert ach._fmt_val(1000000, "m", False) == "1000000"

    def test_empty_tag(self):
        assert ach._fmt_val(50, "", False) == "50"

    def test_non_numeric_passthrough(self):
        assert ach._fmt_val("abc", "i", False) == "abc"

class TestDescText:
    """组合实现是语言无关的：`tm` 决定语言，缺省语言正文与语言包共用同一份代码。"""

    def test_textjoin_then_params(self):
        tm = {"1": "记忆泡", "9": "归还{TEXTJOIN#54}#1[i]个"}
        assert ach._desc_text(tm, "9", [3], {54: "1"}) == "归还记忆泡3个"

    def test_bare_placeholder_end_to_end(self):
        """裸形式经完整组合链（clean_text → TEXTJOIN → 参数）展开。"""
        tm = {"9": "火箭传送时间超过#1秒"}
        assert ach._desc_text(tm, "9", [4], {}) == "火箭传送时间超过4秒"

    def test_color_code_survives_combo_then_placeholder(self):
        """`clean_text` 剥掉颜色标签后，同一段里的裸占位符仍被展开。"""
        tm = {"9": "多事\\n<color=#8790abff>※收集#1个情绪齿轮</color>"}
        assert ach._desc_text(tm, "9", [3], {}) == "多事\n※收集3个情绪齿轮"

    def test_missing_template_key_yields_empty(self):
        assert ach._desc_text({}, "404", [1], {}) == ""

    def test_unwrap_param_values(self):
        tm = {"9": "击败#1[i]名敌人"}
        out = ach._desc_text(tm, "9", [{"Value": 40}], {})
        assert out == "击败40名敌人"

    def test_unwrap_ratio_value(self):
        """`{'Value': 0.05}` 经 `[i]%` ⇒ `5%`（H3 实测形态：源表 5 个比率参数）。"""
        tm = {"9": "生命值百分比同时小于等于#1[i]%"}
        out = ach._desc_text(tm, "9", [{"Value": 0.05}], {})
        assert out == "生命值百分比同时小于等于5%"

    def test_keeps_newline_and_note(self):
        tm = {"9": "通关贝洛伯格\\n※成就完成", "8": "已含真换行\n第二行"}
        assert ach._desc_text(tm, "9", [], {}) == "通关贝洛伯格\n※成就完成"
        assert ach._desc_text(tm, "8", [], {}) == "已含真换行\n第二行"

    def test_unresolvable_placeholder_kept(self):
        """待裁决口径（本轮不动）：`params` 越界时**保留占位符**，而非整段省略。

        与前端 `refsResolved`（src/lib/format.ts:84-91）的「缺参即整段省略」不一致，
        属独立口径，本轮只钉住现状以免被顺手改掉。
        """
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
        """未知系列走回退优先级 999（`series_by_id.get(..., {}).get("priority", 999)`）。

        必须给**两条**成就：单元素列表的 sorted 比较 0 次，回退值根本不参与排序
        ——原先的单条版本删掉 `, 999` 默认值仍绿（实测突变）。
        """
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