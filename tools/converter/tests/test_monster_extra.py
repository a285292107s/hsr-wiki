"""monster_extra 详情附加块契约测试（合成数据，不依赖真实源数据）。

三块各自的判据都锁一条**反直觉**的边界，这些边界都是实测撞出来的：
- 掉落：空档位行（`DisplayItemList` 为空）必须丢掉，`WorldLevel=None` 的基准档必须排在最前；
- 出没：同关多波只计一次；**召唤者出场要算作被召唤者的出场**（漏了会把冰锋这类召唤型小怪
  判成从未出场）；样本按「关卡名 + StageType」双去重（只按类型去重会得到三条同名样本）；
- 阶段：同名双表按 `(组, 阶段)` 去重取并集；族内每个成员都带同一组阶段；组号为空无阶段。
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from converters import items as it  # noqa: E402
from converters import monster_extra as mx  # noqa: E402


def _fake_sources(monkeypatch, **overrides):
    """按文件名分发 load_json（模块内所有读取都走这一个入口）。"""
    tables = {
        "ItemConfig.json": [
            {"ID": 2, "ItemName": {"Hash": 1}, "ItemIconPath": "icon/item/2.png"},
            {"ID": 112001, "ItemName": {"Hash": 2}, "ItemIconPath": "icon/item/112001.png"},
            {"ID": 999, "ItemName": {}, "ItemIconPath": "icon/item/999.png"},  # 无名称 → 不收录
        ],
        "MonsterDrop.json": [
            {"MonsterTemplateID": 1002011, "WorldLevel": 2, "AvatarExpReward": 60,
             "DisplayItemList": [{"ItemID": 2}, {"ItemID": 112001}]},
            {"MonsterTemplateID": 1002011, "WorldLevel": None, "AvatarExpReward": 36,
             "DisplayItemList": [{"ItemID": 2}]},
            # 空档位行（实测 1645 行如此）必须丢掉
            {"MonsterTemplateID": 1004010, "WorldLevel": 1, "AvatarExpReward": None, "DisplayItemList": []},
            # 未知 ItemID 与无名称物品都不落
            {"MonsterTemplateID": 1002011, "WorldLevel": 3, "AvatarExpReward": 70,
             "DisplayItemList": [{"ItemID": 424242}, {"ItemID": 999}]},
        ],
        "MonsterConfig.json": [
            {"MonsterID": 1002011, "MonsterTemplateID": 1002011, "SummonIDList": []},
            # 召唤者：冰锋由它召唤出场，波次名单里没有冰锋
            {"MonsterID": 1005010, "MonsterTemplateID": 1005010, "SummonIDList": [1002011]},
            # 活动关卡用（见下 StageID 4190010）
            {"MonsterID": 1002040, "MonsterTemplateID": 1002040, "SummonIDList": []},
        ],
        "StageConfig.json": [
            # 同一关两波都带 1002011 → 只能计一次
            {"StageID": 1, "StageType": "Mainline", "StageName": {"Hash": 11},
             "MonsterList": [{"a": 1002011}, {"b": 1002011}]},
            # 召唤者出场 → 被召唤者（1002011）也计一次
            {"StageID": 2, "StageType": "Challenge", "StageName": {"Hash": 12},
             "MonsterList": [{"a": 1005010}]},
            # 同类型同名的第三关不产生第三条样本；无名关卡不产生样本
            {"StageID": 3, "StageType": "Mainline", "StageName": {"Hash": 11},
             "MonsterList": [{"a": 1002011}]},
            {"StageID": 4, "StageType": "Trial", "StageName": {},
             "MonsterList": [{"a": 1002011}]},
            # 活动关卡：StageType 与 ActivityPanel.UIPrefab 同名（FightFest）→ 产出活动出处。
            # 用 1002040（不参与 drops/appearances 夹具断言），避免扰动既有用例。
            {"StageID": 4190010, "StageType": "FightFest", "StageName": {"Hash": 74}, "Level": 20,
             "MonsterList": [{"Monster0": 1002040}]},
        ],
        "ActivityPanel.json": [
            {"PanelID": 50018, "UIPrefab": "UI/Quest/Widget/FightFestPanel.prefab",
             "TitleName": {"Hash": 71}},
        ],
        "ActivityQuestRewardData.json": [
            # ActivityModuleID 以该面板 ID 开头 → 它的页签算这个活动的
            {"ActivityModuleID": 5001801, "QuestTabName": {"Hash": 72}},
            # 别的活动的页签不得混入
            {"ActivityModuleID": 9999999, "QuestTabName": {"Hash": 73}},
        ],
        "MonsterTemplateConfig.json": [
            {"MonsterTemplateID": 4014010, "TemplateGroupID": 4014010},
            {"MonsterTemplateID": 4014011, "TemplateGroupID": 4014010},
            {"MonsterTemplateID": 1002011, "TemplateGroupID": None},
            # 状态词条归属用：同一只怪的两种形态（去括号后缀同名 → 都归属）
            {"MonsterTemplateID": 7001, "MonsterName": {"Hash": 51},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Alpha_00_Config.json"},
            {"MonsterTemplateID": 7002, "MonsterName": {"Hash": 52},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Alpha_00_Config.json"},
            # 同一 token 下**另一个怪物**（去括号后缀仍不同名 → 该 token 的状态整条丢弃）
            {"MonsterTemplateID": 7003, "MonsterName": {"Hash": 53},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Beta_00_Config.json"},
            {"MonsterTemplateID": 7004, "MonsterName": {"Hash": 54},
             "JsonConfig": "Config/ConfigCharacter/Monster/Monster_W9_Beta_00_Config.json"},
        ],
        "MonsterStatusConfig.json": [
            # 命中唯一 token，描述无占位符 → 全字段落
            {"StatusID": 9001, "ModifierName": "MMonster_W9_Alpha_00_Skill01_DefenceDown",
             "StatusName": {"Hash": 61}, "StatusType": "Debuff",
             "StatusDesc": {"Hash": 62}, "CanDispel": True},
            # 描述带 #N[i] 占位符（数值来自动态属性）→ 不落 desc，其余照落
            {"StatusID": 9002, "ModifierName": "MMonster_W9_Alpha_00_AttackUp",
             "StatusName": {"Hash": 63}, "StatusType": "Buff",
             "StatusDesc": {"Hash": 64}, "CanDispel": False},
            # 命中的 token 跨了两个名字（贝塔/伽马）→ 整条丢弃，两边都不挂
            {"StatusID": 9004, "ModifierName": "MMonster_W9_Beta_00_Fury",
             "StatusName": {"Hash": 66}, "StatusType": "Debuff", "StatusDesc": {"Hash": 62}},
            # 无 token 命中 → 丢弃
            {"StatusID": 9003, "ModifierName": "MCommon_SuperArmor",
             "StatusName": {"Hash": 65}, "StatusType": "Other", "StatusDesc": {"Hash": 62}},
            # 渲染签名与 9001 全同（不同 StatusID）→ 去重后只留一条
            {"StatusID": 9005, "ModifierName": "MMonster_W9_Alpha_00_Skill02_DefenceDown",
             "StatusName": {"Hash": 61}, "StatusType": "Debuff",
             "StatusDesc": {"Hash": 62}, "CanDispel": True},
            # 描述带 `%宏`（运行时替换的施放者名）→ 同样不落 desc
            {"StatusID": 9006, "ModifierName": "MMonster_W9_Alpha_00_Support",
             "StatusName": {"Hash": 67}, "StatusType": "Other",
             "StatusDesc": {"Hash": 68}},
        ],
        "MonsterAtlasExtraPhase.json": [
            {"TemplateGroupID": 4014010, "PhaseID": 1,
             "StanceWeakList": ["Ice", "Thunder", "Ice"],
             "DamageTypeResistance": [{"DamageType": "Fire", "Value": {"Value": 0.2}}],
             "MonsterName": {"Hash": 21},
             # 阶段块里的 DebuffResist 刻意不取
             "DebuffResist": [{"Key": "STAT_CTRL", "Value": {"Value": 0.5}}]},
        ],
        "MonsterAtlasExtraPhases.json": [
            # 同名双表里的同一条 → 去重
            {"TemplateGroupID": 4014010, "PhaseID": 1, "StanceWeakList": ["Ice", "Thunder"]},
            {"TemplateGroupID": 4014010, "PhaseID": 2,
             "StanceWeakList": ["Physical"],
             "DamageTypeResistance": [{"DamageType": "Ice", "Value": {"Value": {"Value": 0.4}}}],
             "MonsterIntroduction": {"Hash": 22}},
        ],
        "ExtraEffectConfig.json": [
            {"ExtraEffectID": 10000027, "ExtraEffectName": {"Hash": 41},
             "ExtraEffectDesc": {"Hash": 42}, "DescParamList": [{"Value": 0.3}]},
            # 无名称的效果不收录（与物品/技能同一纪律：无文本不上屏）
            {"ExtraEffectID": 10000028, "ExtraEffectName": {}, "ExtraEffectDesc": {"Hash": 43}},
        ],
        "MonsterSkillConfig.json": [
            {"SkillID": 100203001, "ExtraEffectIDList": [10000027, 999999]},
            {"SkillID": 100203002, "ExtraEffectIDList": []},
        ],
    }
    tables.update(overrides)

    def fake_load(path):
        return tables[Path(path).name]

    monkeypatch.setattr(mx, "load_json", fake_load)
    # 物品名称经 `items.item_name_icon` 解析，而该函数在 **items 模块的命名空间**里查 resolve_text——
    # 只补 mx.resolve_text 会让物品名走真实 TextMap（实测表现为掉落实测为空），两处都要补。
    text = lambda h: {  # noqa: E731
        1: "信用点", 2: "铁卫扣饰", 11: "于枯冬之中", 12: "混沌回忆", 21: "疯王·第二阶段", 22: "阶段介绍",
        41: "额外回合", 42: "获得 #1[i] 个额外回合",
        51: "阿尔法", 52: "阿尔法（完整）", 53: "贝塔", 54: "伽马",
        61: "防御力降低", 62: "防御力降低 20%。", 63: "攻击力提高", 64: "攻击力提高#1[i]%。",
        65: "超甲", 66: "狂怒", 67: "支援", 68: "受到%CasterName支援。",
        71: "「星天演武仪典」", 72: "「梦境训练」", 73: "别的活动页签", 74: "活动关卡",
    }.get((h or {}).get("Hash"), "")
    monkeypatch.setattr(mx, "resolve_text", text)
    monkeypatch.setattr(it, "resolve_text", text)


class TestLoadDrops:
    def test_tiers_sorted_and_empty_rows_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        drops = mx.load_drops()
        assert set(drops) == {1002011}, "只有空档位的模板不产出 drops 键"
        # 基准档（None）在最前、其余升序；WorldLevel=3 那档的物品全部解析失败（未知 ID + 无名称）
        # ⇒ 该档整档不落，而不是留一个空物品列表
        assert [t["world_level"] for t in drops[1002011]] == [None, 2]

    def test_items_resolved_from_itemconfig_and_unknown_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        tiers = mx.load_drops()[1002011]
        assert tiers[0]["items"] == [{"id": 2, "name": "信用点", "icon": "icon/item/2.png"}]
        assert tiers[0]["avatar_exp"] == 36
        # 未知 ItemID 与无名称物品都被丢掉 → 第三档没有物品，整档不落
        assert [t["world_level"] for t in tiers] == [None, 2]
        assert [i["name"] for i in tiers[1]["items"]] == ["信用点", "铁卫扣饰"]


class TestLoadAppearances:
    def test_counts_stage_once_and_follows_summons(self, monkeypatch):
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        assert app[1002011]["total"] == 4, "同关两波只计一次；召唤者所在关卡也要计入被召唤者"
        assert app[1005010]["total"] == 1

    def test_samples_dedupe_by_type_and_name(self, monkeypatch):
        _fake_sources(monkeypatch)
        app = mx.load_appearances()
        samples = app[1002011]["samples"]
        # 关 1/3 同类型同名、关 4 无名 → 只剩「主线关 1」与「挑战关 2」两条
        assert samples == [
            {"id": 1, "name": "于枯冬之中"},
            {"id": 2, "name": "混沌回忆"},
        ]


class TestLoadPhases:
    def test_dedupes_twin_tables_and_assigns_to_every_member(self, monkeypatch):
        _fake_sources(monkeypatch)
        phases = mx.load_phases()
        assert set(phases) == {4014010, 4014011}, "族内每个成员都带同一组阶段；组号为空的模板没有阶段"
        assert [p["phase_id"] for p in phases[4014010]] == [1, 2], "按阶段号升序"
        p1, p2 = phases[4014010]
        assert p1["weak"] == ["Ice", "Thunder"], "弱点去重保序"
        assert p1["resist"] == {"Fire": 0.2}
        assert p1["name"] == "疯王·第二阶段"
        assert "DebuffResist" not in p1 and "debuff_resist" not in p1, "阶段块刻意不取 DebuffResist"
        assert p2["resist"] == {"Ice": 0.4}, "双层 ValueWrap 也要剥到数值"
        assert p2["intro"] == "阶段介绍"
        assert "name" not in p2


class TestLoadSkillExtraEffects:
    def test_foreign_key_join_and_skips(self, monkeypatch):
        """`ExtraEffectIDList` × `ExtraEffectConfig` 是**完整外键**（不是命名约定猜测）：
        只保留表里登记且有名者，空列表与未登记 ID 都不产出键；描述参数逐层剥 Value 包装。"""
        _fake_sources(monkeypatch)
        fx = mx.load_skill_extra_effects()
        assert set(fx) == {100203001}, "空 ExtraEffectIDList / 未登记的 ID 都不产出键"
        assert fx[100203001] == [{
            "id": 10000027, "name": "额外回合",
            "desc": "获得 #1[i] 个额外回合", "param_list": [0.3],
        }]


class TestLoadEventSources:
    """活动出处：判据是 `ActivityPanel.UIPrefab` basename ↔ `StageConfig.StageType` 的同名约定。"""

    def test_derives_name_tabs_levels(self, monkeypatch):
        _fake_sources(monkeypatch)
        ev = mx.load_event_sources()
        assert set(ev) == {1002040}, "只有活动关卡的怪物产出"
        assert ev[1002040]["name"] == "星天演武仪典", "TitleName 的「」要剥掉"
        assert ev[1002040]["tabs"] == ["梦境训练"], "只取 ActivityModuleID 属于该面板的页签"
        assert ev[1002040]["levels"] == [20]
        assert ev[1002040]["count"] == 1

    def test_panel_missing_yields_nothing(self, monkeypatch):
        _fake_sources(monkeypatch)
        inner = mx.load_json

        def fake(path):
            if Path(path).name == "ActivityPanel.json":
                raise FileNotFoundError(path)
            return inner(path)

        monkeypatch.setattr(mx, "load_json", fake)
        assert mx.load_event_sources() == {}, "表缺失就整条不产出（静默降级，不猜）"

    def test_non_event_stages_ignored(self, monkeypatch):
        _fake_sources(monkeypatch)
        # 夹具里 Mainline / Challenge / Trial 三个非活动关不得产出任何条目
        ev = mx.load_event_sources()
        assert 1002011 not in ev and 1005010 not in ev


class TestLoadStatuses:
    """状态词条的安全子集：**最长 token + 去形态后缀同名**；只有无占位符的描述才落。"""

    def test_attributes_to_same_name_forms_only(self, monkeypatch):
        _fake_sources(monkeypatch)
        st = mx.load_statuses()
        # 阿尔法 / 阿尔法（完整）同 token 同基名 → 两条都拿到
        assert set(st) == {7001, 7002}, "跨名 token（贝塔/伽马）整条丢弃，两边都不挂"
        assert [s["name"] for s in st[7001]] == ["防御力降低", "攻击力提高", "支援"], (
            "渲染签名全同的两条（9001 / 9005）只留一条，且按 StatusID 升序"
        )

    def test_desc_only_without_placeholder_and_dispenl_flag(self, monkeypatch):
        _fake_sources(monkeypatch)
        rows = {s["id"]: s for s in mx.load_statuses()[7001]}
        assert rows[9001]["desc"] == "防御力降低 20%。", "无占位符 → 描述照落"
        assert rows[9001]["dispel"] is True
        assert "desc" not in rows[9002], "带 #N[i] 占位符（数值来自动态属性）→ 不落不可渲染的描述"
        assert "desc" not in rows[9006], "带 %宏（运行时替换的施放者名）→ 同样不落描述"
        assert "dispel" not in rows[9002], "CanDispel 为假不落键"

    def test_unmatched_status_dropped(self, monkeypatch):
        _fake_sources(monkeypatch)
        ids = {s["id"] for rows in mx.load_statuses().values() for s in rows}
        assert 9003 not in ids, "无 token 命中的通用状态（MCommon_*）不归属任何怪物"
