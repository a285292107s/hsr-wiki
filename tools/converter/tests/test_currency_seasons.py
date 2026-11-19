import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from converters.currency_seasons import (  # noqa: E402
    _season_ids,
    _season_value,
    attribute_chimera,
    attribute_spotlight,
    attribute_talent,
    attribute_camps,
    build_seasons,
    build_theme_rows,
    resolve_season_panels,
)


def _modules(*pairs: tuple[int, int]) -> list[dict]:
    return [
        {"SeasonID": season, "SubSeasonID": sub, "ActivityModuleID": season * 100 + sub}
        for season, sub in pairs
    ]


def _activity(activity_id: int, module_id: int, panel_id: int | None) -> dict:
    row = {"ActivityID": activity_id, "ActivityModuleIDList": [module_id]}
    if panel_id is not None:
        row["ActivityPanelID"] = panel_id
    return row


class TestSeasonValue:
    def test_bool_and_non_int_rejected(self):
        assert _season_value(True) is None
        assert _season_value("2") is None
        assert _season_value(None) is None
        assert _season_value(2) == 2


class TestSeasonIds:
    def test_list_and_single_merged(self):
        assert _season_ids({"SeasonIDList": [1, 2], "SeasonID": 2}) == {1, 2}

    def test_single_only(self):
        assert _season_ids({"SeasonID": 3}) == {3}

    def test_empty(self):
        assert _season_ids({}) == set()


class TestResolveSeasonPanels:
    def test_maps_module_to_panel_name_and_desc(self):
        modules = [{"SeasonID": 1, "ActivityModuleID": 101}, {"SeasonID": 2, "ActivityModuleID": 201}]
        config = [_activity(11, 101, 111), _activity(21, 201, 211)]
        panels = [
            {"PanelID": 111, "TitleName": "货币战争•零和博弈", "PanelDesc": "第一季简介"},
            {"PanelID": 211, "TitleName": "货币战争•入画奇航", "PanelDesc": "第二季简介"},
        ]
        resolved = resolve_season_panels(modules, config, panels)
        assert resolved[1] == {"name": "货币战争•零和博弈", "desc": "第一季简介"}
        assert resolved[2] == {"name": "货币战争•入画奇航", "desc": "第二季简介"}

    def test_season_without_panel_registration_is_absent(self):
        modules = [{"SeasonID": 1, "ActivityModuleID": 101}, {"SeasonID": 3, "ActivityModuleID": 999}]
        config = [_activity(11, 101, 111)]
        panels = [{"PanelID": 111, "TitleName": "S1", "PanelDesc": "d"}]
        resolved = resolve_season_panels(modules, config, panels)
        assert set(resolved) == {1}

    def test_activity_without_panel_id_is_absent(self):
        modules = [{"SeasonID": 1, "ActivityModuleID": 101}]
        config = [_activity(11, 101, None)]
        assert resolve_season_panels(modules, config, []) == {}


class TestAttributeChimera:
    def test_groups_by_role_season_and_dedupes(self):
        rows = [
            {"ID": 505, "NameDesc": "蜜果羹", "RoleID": 140402},
            {"ID": 505, "NameDesc": "蜜果羹", "RoleID": 140402},
            {"ID": 402, "NameDesc": "工作狂", "RoleID": None},
        ]
        role_season = {140402: 2}
        grouped = attribute_chimera(rows, role_season)
        assert [row["ID"] for row in grouped[2]] == [505]

    def test_unattributed_chimera_dropped(self):
        rows = [{"ID": 402, "NameDesc": "工作狂", "RoleID": None}]
        assert attribute_chimera(rows, {}) == {}


class TestAttributeSpotlight:
    def test_counts_distinct_by_season(self):
        rows = [
            {"ID": 100000, "SuitableAvatarList": [140402, 121002]},
            {"ID": 100000, "SuitableAvatarList": [140402]},
            {"ID": 100100, "SuitableAvatarList": [130902]},
        ]
        role_season = {140402: 2, 121002: 2, 130902: 2}
        assert attribute_spotlight(rows, role_season) == {2: 2}

    def test_splits_across_seasons(self):
        rows = [{"ID": 1, "SuitableAvatarList": [10, 20]}]
        role_season = {10: 1, 20: 2}
        assert attribute_spotlight(rows, role_season) == {1: 1, 2: 1}


class TestAttributeTalent:
    def test_counts_by_season(self):
        rows = [{"SeasonID": 2}, {"SeasonID": 2}, {"SeasonID": 1}, {"SeasonID": None}]
        assert attribute_talent(rows) == {2: 2, 1: 1}


class TestAttributeCamps:
    def test_counts_and_dedupes_names_by_season(self):
        camps = [
            {"ID": 1, "CampName": "凛冬经贸联合体"},
            {"ID": 2, "CampName": "铁盾安保集团"},
            {"ID": 3, "CampName": "未知"},
        ]
        links = [
            {"CampID": 1, "SeasonID": 1},
            {"CampID": 1, "SeasonID": 2},
            {"CampID": 2, "SeasonID": 2},
            {"CampID": 2, "SeasonID": 2},
            {"CampID": 3, "SeasonID": 2},
        ]
        result = attribute_camps(camps, links)
        assert result[1] == {"count": 1, "names": ["凛冬经贸联合体"]}
        assert result[2]["count"] == 3
        assert result[2]["names"] == ["凛冬经贸联合体", "铁盾安保集团", "未知"]

    def test_empty(self):
        assert attribute_camps([], []) == {}


class TestBuildThemeRows:
    def test_orders_camp_talent_division_encounter_spotlight(self):
        chimera = {2: [{"NameDesc": "蜜果羹"}, {"NameDesc": "胶糖卷"}]}
        camp = {2: {"count": 28, "names": ["凛冬经贸联合体"]}}
        themes = build_theme_rows(2, chimera, {2: 57}, {2: 40}, camp, {2: 10})
        assert [theme["key"] for theme in themes] == ["camp", "talent", "division", "encounter", "spotlight"]
        assert themes[0] == {"key": "camp", "count": 28, "names": ["凛冬经贸联合体"]}
        assert themes[3] == {"key": "encounter", "count": 2, "names": ["蜜果羹", "胶糖卷"]}
        assert themes[4] == {"key": "spotlight", "count": 57, "names": []}

    def test_legacy_four_args_still_work(self):
        themes = build_theme_rows(2, {}, {}, {2: 40})
        assert [theme["key"] for theme in themes] == ["talent"]

    def test_season_without_themes(self):
        assert build_theme_rows(1, {}, {}, {}, {}, {}) == []


class TestBuildSeasons:
    def test_sorted_seasons_with_sub_season_ids_and_current(self):
        modules = _modules((1, 1), (1, 2), (1, 2), (2, 1))
        payload = build_seasons(modules, {}, {}, {}, {})
        assert payload["current_season"] == 2
        assert [season["id"] for season in payload["seasons"]] == [1, 2]
        assert payload["seasons"][0]["sub_season_ids"] == [1, 2]
        assert payload["seasons"][0]["name"] == ""

    def test_panel_and_theme_wired(self):
        modules = _modules((2, 1))
        panels = {2: {"name": "货币战争•入画奇航", "desc": "简介"}}
        chimera = {2: [{"NameDesc": "蜜果羹"}]}
        camp = {2: {"count": 28, "names": ["凛冬经贸联合体"]}}
        payload = build_seasons(modules, panels, chimera, {2: 57}, {2: 40}, camp, {2: 10})
        season = payload["seasons"][0]
        assert season["name"] == "货币战争•入画奇航"
        assert season["desc"] == "简介"
        assert [theme["key"] for theme in season["themes"]] == ["camp", "talent", "division", "encounter", "spotlight"]

    def test_empty_modules(self):
        assert build_seasons([], {}, {}, {}, {}) == {"current_season": None, "seasons": []}
