"""enum_labels 登记表契约测试（合成 TextMap，不依赖真实源数据）。

守的是三件容易静默退化的事：
1. 登记表与 `config` 的本地映射**键集一致**——漏登记会让界面显示原始枚举键（`CriticalChanceBase`）；
2. 未登记枚举**必须**走本地回退（而不是空串）；
3. `resolve` 产出的引用可令牌化（带 `.key`），否则多语言会退回单一语言。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

import enum_labels  # noqa: E402
from config import PROPERTY_MAP, RELIC_TYPE_MAP  # noqa: E402


@pytest.fixture(autouse=True)
def setup_textmap(monkeypatch):
    """mock TextMap，避免加载真实大文件。"""
    import textmap
    monkeypatch.setattr(textmap, "_text_map", {})


class TestRegistry:
    def test_enum_ref_shape(self):
        assert enum_labels.enum_ref("relic_slot", "HEAD") == {"Hash": 7629190249921340592}

    def test_unknown_kind_and_name(self):
        assert enum_labels.enum_ref("nope", "HEAD") is None
        assert enum_labels.enum_ref("relic_slot", "NOPE") is None

    def test_all_hashes_are_digits(self):
        for kind in ("relic_slot", "property", "monster_rank", "ui_label"):
            for name, key in enum_labels.registered(kind).items():
                assert key.isdigit(), f"{kind}.{name} 的键不是文本表 hash：{key}"

    def test_ui_labels_registered(self):
        """转换器自用的固定标签（如「触发条件」）必须有官方词条，不许写死中文。"""
        assert enum_labels.textmap_key("ui_label", "conditionTrigger") is not None


class TestResolve:
    def test_returns_textref_when_textmap_hits(self, monkeypatch):
        import textmap
        monkeypatch.setattr(textmap, "_text_map", {"7629190249921340592": "头部"})
        got = enum_labels.resolve("relic_slot", "HEAD", "头部本地")
        assert got == "头部"
        assert getattr(got, "key", None) == "7629190249921340592", "必须带键，否则无法令牌化"

    def test_falls_back_when_textmap_misses(self):
        assert enum_labels.resolve("relic_slot", "HEAD", "头部本地") == "头部本地"

    def test_falls_back_when_not_registered(self):
        assert enum_labels.resolve("property", "SpeedAddedRatio", "速度百分比") == "速度百分比"


class TestCoverage:
    """登记表必须覆盖本地映射的键；未覆盖的必须在下面显式列出（新增键时强制做决定）。"""

    # 官方文本表里没有独立词条的枚举（保留本地中文回退 ⇒ 落成普通字符串被残留清单点名）
    NO_OFFICIAL_TERM = {"SpeedAddedRatio", "MaxSP"}
    NO_OFFICIAL_RANK = {"LittleBoss"}

    def test_property_keys_covered(self):
        missing = [k for k in PROPERTY_MAP if enum_labels.textmap_key("property", k) is None]
        assert set(missing) == self.NO_OFFICIAL_TERM, f"未登记集合变化：{missing}"

    def test_relic_slot_keys_covered(self):
        missing = [k for k in RELIC_TYPE_MAP if enum_labels.textmap_key("relic_slot", k) is None]
        assert missing == [], f"部位名必须全部有官方词条：{missing}"

    def test_monster_rank_keys_covered(self):
        ranks = {"Minion", "Elite", "BigBoss", "LittleBoss"}
        missing = [k for k in ranks if enum_labels.textmap_key("monster_rank", k) is None]
        assert set(missing) == self.NO_OFFICIAL_RANK, f"未登记集合变化：{missing}"
