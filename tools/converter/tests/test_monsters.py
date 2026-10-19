import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import monsters as mo  # noqa: E402

@pytest.fixture(autouse=True)
def fake_sources(monkeypatch):
    monkeypatch.setattr(mo, "load_json", lambda _p: [
        {"MonsterTemplateID": 1002011, "MonsterName": {"Hash": 1}, "IconPath": "a/Icon_1.png", "Rank": "MinionLv2"},
        {"MonsterTemplateID": 1002012, "MonsterName": {"Hash": 2}, "IconPath": "a/Icon_1.png", "Rank": "MinionLv2"},
        {"MonsterTemplateID": 5001010, "MonsterName": {"Hash": 3}, "IconPath": "a/Icon_9.png", "Rank": "BigBoss"},
        {"MonsterTemplateID": 9001010, "MonsterName": {}, "IconPath": "a/Icon_9.png", "Rank": "Elite"},
        {"MonsterTemplateID": 9001020, "MonsterName": {"Hash": 4}, "IconPath": "", "Rank": "Elite"},
    ])
    monkeypatch.setattr(mo, "resolve_text", lambda h: {
        1: "冰锋", 2: "冰锋", 3: "首领", 4: "无图",
    }.get((h or {}).get("Hash"), ""))
    monkeypatch.setattr(mo, "map_icon_path", lambda p: p or "")
    monkeypatch.setattr(mo, "load_monsters", lambda: {
        1002011: {"weak": ["Fire", "Thunder"], "camp": "雅利洛-Ⅵ", "figure": "Monster_1002011"},
        1002012: {"weak": ["Fire", "Quantum"], "camp": "雅利洛-Ⅵ", "figure": "Monster_1002012"},
    })
    saved: dict[str, list] = {}
    monkeypatch.setattr(mo, "save_json", lambda data, path: saved.__setitem__(path.name, data))
    return saved

class TestConvert:
    def test_fields_and_facets(self, fake_sources):
        mo.convert()
        rows = fake_sources["monsters.json"]
        assert [r["id"] for r in rows] == [1002011, 1002012, 5001010], "按 id 升序且跳过无名/无图条目"
        assert rows[0] == {
            "id": 1002011, "name": "冰锋", "icon": "a/Icon_1.png", "type": "MINION",
            "weak": ["Fire", "Thunder"], "camp": "雅利洛-Ⅵ",
        }
        assert rows[1]["weak"] == ["Fire", "Quantum"], "同族两档的弱点必须各自落盘（卡面唯一可辨差异）"

    def test_missing_facet_falls_back_to_empty(self, fake_sources):
        mo.convert()
        boss = fake_sources["monsters.json"][2]
        assert boss["type"] == "BOSS"
        assert (boss["weak"], boss["camp"]) == ([], ""), "聚合表缺登记 → 空值，不得崩、不得造值"

    def test_no_derived_identity_fields(self, fake_sources):
        mo.convert()
        a = fake_sources["monsters.json"][0]
        assert "figure" not in a
        assert set(a) == {"id", "name", "icon", "type", "weak", "camp"}

    def test_load_monsters_is_called_once(self, fake_sources, monkeypatch):
        calls = []
        monkeypatch.setattr(mo, "load_monsters", lambda: calls.append(1) or {})
        mo.convert()
        assert len(calls) == 1, "聚合表按次读取一次，不在循环内重读"
