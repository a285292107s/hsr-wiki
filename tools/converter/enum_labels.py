"""枚举标签的官方文本来源（[ADR 0052](../../docs/adr/0052-多语言站点架构-路径前缀与语言包.md) 决策 3）。

站点有一批「枚举 → 展示名」的映射（遗器部位、词条属性、敌方分类…）。这些名字**在官方文本表里
已经有键**，因此禁止在代码里写死中文或自造译文——按仓规「展示文本必须来自现有数据源」，这里登记
`枚举 → TextMap 键`，由 `resolve_text` 产出**文本引用令牌**，各语言正文随语言包分发。

为啥只有这三组：
- **命途 / 属性**不在此登记——`paths.json` / `elements.json` 已各自带令牌化的 `name`（同一事实不设两处）。
- **技能类型**不在此登记——`skills[].type_name` 已由上游 `SkillTriggerKey` 配置解析成令牌。

键值形态：TextMap 的键是**原始 key 名（如 `Rogue`）的 xxhash64**，与译文内容无关 ⇒ 上游译文增删改
都不会让这些常量漂移。键若写错（或官方删词条），缺省语言在生成语言包时立即 `TextPackError`
（不会静默出空文本）；`tools/converter/tests/test_enum_labels.py` 另用合成表断言登记/回退语义。

未登记的少数枚举（`SpeedAddedRatio` 速度百分比 / `MaxSP` 最大战技点 / `LittleBoss` 准首领：官方
无独立词条）由调用方回退本地中文映射 ⇒ 落成普通字符串，被 `--tokens` 残留清单点名而不是静默消失。
"""

from __future__ import annotations

from typing import Any

_ENUM_TEXTMAP: dict[str, dict[str, str]] = {
    # 遗器部位（RelicConfig.Type）：头部 / 手部 / 躯干 / 脚部 / 位面球 / 连结绳
    "relic_slot": {
        "HEAD": "7629190249921340592",
        "HAND": "3015834203880704193",
        "BODY": "17920325057811802804",
        "FOOT": "8201995079003512295",
        "NECK": "3889430330523937770",
        "OBJECT": "13059478852922951865",
    },
    # 命途（AvatarBaseType）：官方词条名。此前**未登记**，导致开拓者形态名的组合文案
    # （`trailblazer_name_ref` 的 `开拓者·<命途>` 右半段）取不到词条 ⇒ 回退本地中文映射，
    # 所有语言的形态名都带中文（实测 en 包 `Trailblazer·欢愉`）。哈希与 `paths.py` 产出的
    # `paths.json` 令牌同源（同一批官方词条，不新增第二事实源）。
    "path": {
        "Elation": "224536443460975011",
        "Knight": "4258030345548324088",
        "Mage": "6325610700042370526",
        "Memory": "119435972213994950",
        "Priest": "21284642533200943",
        "Rogue": "4367365179576232430",
        "Shaman": "232967775503330328",
        "Warlock": "10009174905191400515",
        "Warrior": "10116566940563878966",
    },
    # 词条属性（PropertyType）：官方词条名（键与 config.PROPERTY_MAP 一一对应）
    "property": {
        "HPDelta": "429906855389925135",
        "HPAddedRatio": "16800648735976022310",
        "AttackDelta": "14669713281277919926",
        "AttackAddedRatio": "3065193343111472680",
        "DefenceDelta": "14983444696716845957",
        "DefenceAddedRatio": "12182123284380739113",
        "SpeedDelta": "15986395408019492545",
        "CriticalChanceBase": "3749186578161212190",
        "CriticalDamageBase": "11713281818392369370",
        "HealRatioBase": "6870358963948712726",
        "StatusProbabilityBase": "9067200147197874531",
        "StatusResistanceBase": "13854752409155182035",
        "BreakDamageAddedRatioBase": "10757677414810090212",
        "SPRatioBase": "3035140785293426139",
        "AllDamageReduce": "14856224431351377503",
        "PhysicalAddedRatio": "382731888268485441",
        "FireAddedRatio": "8376969700914248114",
        "IceAddedRatio": "10383318377418608996",
        "ThunderAddedRatio": "1707781554104826241",
        "WindAddedRatio": "11956974902002249611",
        "QuantumAddedRatio": "5638495842724344095",
        "ImaginaryAddedRatio": "14750019722305688796",
        # 历史别名与规范键同义 ⇒ 复用同一官方词条
        "BreakDamageAddedRatio": "10757677414810090212",
        "LightningAddedRatio": "1707781554104826241",
        "EffectHitRateBase": "9067200147197874531",
        "EffectResistBase": "13854752409155182035",
        "ElationDamageAddedRatioBase": "1141235736776061857",
    },
    # 敌方分类（MonsterConfig.Rank）：普通 / 精英 / 首领（LittleBoss 官方无独立词条）
    "monster_rank": {
        "Minion": "2219583778249680479",
        "Elite": "6412835030121278044",
        "BigBoss": "13849138887970849441",
    },
    # 转换器自用的固定标签（不是枚举，但同样是玩家可见文案 ⇒ 必须取官方词条，不许写死中文）
    "ui_label": {
        "conditionTrigger": "12342656883341648355",  # 触发条件 / Trigger Criteria
        "trailblazer": "4036035618718239522",        # 开拓者 / Trailblazer
        "peakStarKnight": "16029669136933019666",    # 骑士星数 / Knight Stars
        "peakStarKing": "2029013010954309372",       # 王棋星数 / King Stars
    },
}


def textmap_key(kind: str, name: str) -> str | None:
    """枚举 → TextMap 键；未登记返回 None（调用方回退到本地映射）。"""
    return _ENUM_TEXTMAP.get(kind, {}).get(name)


def enum_ref(kind: str, name: str) -> dict[str, int] | None:
    """枚举 → `resolve_text` 可解析的 Hash 引用；未登记返回 None。"""
    key = textmap_key(kind, name)
    return {"Hash": int(key)} if key else None


def resolve(kind: str, name: str, fallback: str = "") -> Any:
    """枚举 → **该枚举的官方文本引用**（TextRef，可令牌化）；未登记或官方无词条时返回 `fallback`。

    `fallback` 是调用方的本地中文映射（如 `config.PROPERTY_MAP`）：官方没有对应词条的少数枚举会落成
    普通字符串 ⇒ 被 `--tokens` 的残留清单点名，而不是静默消失。
    """
    from textmap import resolve_text

    ref = enum_ref(kind, name)
    if ref is None:
        return fallback
    got = resolve_text(ref)
    return got if got else fallback


def registered(kind: str) -> dict[str, str]:
    """某类枚举的登记表（只读副本，供测试与盘点用）。"""
    return dict(_ENUM_TEXTMAP.get(kind, {}))


def trailblazer_name_ref(base_type: str, fallback_suffix: str = "") -> Any:
    """开拓者形态名（`开拓者·<命途>`）：两段都取官方词条，**按语言各自拼**。

    形态名是组合文案：在转换期拼（`f"开拓者·{path_name}"`）就只会得到中文那一份（见
    [data-pipeline](../docs/agents/data-pipeline.md) 的组合器判据）。这里登记组合器，产物里是普通
    文本 ⇒ 前端与快照生成器零改动。两段各自取官方词条：`ui_label.trailblazer` + `path.<base_type>`；
    命途无官方词条时用 `fallback_suffix`（本地中文映射）。
    """
    from textmap import clean_text, current_textmap
    from textpack import composed_ref

    left_key = textmap_key("ui_label", "trailblazer")
    right_key = textmap_key("path", base_type)

    def compose(tm: Any, lk: str | None = left_key, rk: str | None = right_key,
                fb: str = fallback_suffix) -> str:
        left = clean_text(tm.get(lk, "")) if lk else ""
        right = clean_text(tm.get(rk, "")) if rk else fb
        return f"{left}·{right}" if right else left

    return composed_ref(f"composed:trailblazer:{base_type}", compose, compose(current_textmap()))
