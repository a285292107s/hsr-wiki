from __future__ import annotations

from typing import Any

_ENUM_TEXTMAP: dict[str, dict[str, str]] = {
    "relic_slot": {
        "HEAD": "7629190249921340592",
        "HAND": "3015834203880704193",
        "BODY": "17920325057811802804",
        "FOOT": "8201995079003512295",
        "NECK": "3889430330523937770",
        "OBJECT": "13059478852922951865",
    },
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
        "BreakDamageAddedRatio": "10757677414810090212",
        "LightningAddedRatio": "1707781554104826241",
        "EffectHitRateBase": "9067200147197874531",
        "EffectResistBase": "13854752409155182035",
        "ElationDamageAddedRatioBase": "1141235736776061857",
        "MaxSP": "3862044039590256962",
    },
    "monster_rank": {
        "Minion": "2219583778249680479",
        "Elite": "6412835030121278044",
        "BigBoss": "13849138887970849441",
    },
    "ui_label": {
        "conditionTrigger": "12342656883341648355",
        "trailblazer": "4036035618718239522",
        "peakStarKnight": "16029669136933019666",
        "peakStarKing": "2029013010954309372",
    },
}


def textmap_key(kind: str, name: str) -> str | None:
    return _ENUM_TEXTMAP.get(kind, {}).get(name)


def enum_ref(kind: str, name: str) -> dict[str, int] | None:
    key = textmap_key(kind, name)
    return {"Hash": int(key)} if key else None


def resolve(kind: str, name: str, fallback: str = "") -> Any:
    from textmap import resolve_text

    ref = enum_ref(kind, name)
    if ref is None:
        return fallback
    got = resolve_text(ref)
    return got if got else fallback


def registered(kind: str) -> dict[str, str]:
    return dict(_ENUM_TEXTMAP.get(kind, {}))


def trailblazer_name_ref(base_type: str, fallback_suffix: str = "") -> Any:
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
