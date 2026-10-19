import logging
import re
from typing import Any

import xxhash

from utils import load_json
from config import TEXTMAP_FILE, TEXTMAP_EN_FILE
from textpack import TextRef, raw_variant

logger = logging.getLogger("converter")

_text_map: dict[str, str] = {}
_text_map_en: dict[str, str] = {}

def load_textmap() -> None:
    global _text_map
    _text_map = load_json(TEXTMAP_FILE)
    logger.info("已加载 TextMap（%s 条）", len(_text_map))

def ensure_textmap_en() -> None:
    global _text_map_en
    if not _text_map_en:
        _text_map_en = load_json(TEXTMAP_EN_FILE)
        logger.info("已加载 TextMapEN（%s 条）", len(_text_map_en))

def resolve_text_en(ref: Any) -> str:
    if not isinstance(ref, dict) or "Hash" not in ref:
        return ""
    text = _text_map_en.get(str(ref["Hash"]), "")
    return "" if text.startswith("{") else clean_text(text)

TRAILBLAZER_KEY = "4036035618718239522"

_GENDER_VARIANT = re.compile(r"\{([MF])#([^}]*)\}")

def _neutralize_gender(text: str) -> str:
    if _GENDER_VARIANT.sub("", text).strip():
        return text
    first = _GENDER_VARIANT.search(text)
    return first.group(2) if first else text

def nickname_of(textmap: "dict[str, str] | None" = None) -> str:
    table = _text_map if textmap is None else textmap
    return _neutralize_gender(table.get(TRAILBLAZER_KEY) or "开拓者")

def clean_text(text: str, textmap: "dict[str, str] | None" = None) -> str:
    if not text:
        return ""

    text = text.replace("{NICKNAME}", nickname_of(textmap))
    text = text.replace("{SPACE}", " ")

    text = re.sub(r"\{RUBY_[EB]#(?:[^}]*)\}", "", text)

    text = _process_adjacent_properties(text, textmap)
    text = re.sub(r"<property\s+type=(\w+)[^>]*>", lambda m: _property_label(m, textmap), text)

    text = re.sub(r"<color=([^>]+)>", "", text)
    text = re.sub(r"</color>", "", text)

    text = re.sub(r"</?unbreak>", "", text)

    text = re.sub(r"<[^>]+>", "", text)

    return text

_PROPERTY_LABEL: dict[str, str] = {
    "ExtraAllDamageTypeAddedRatio": "全伤害",
    "ExtraHPAddedRatio": "生命增幅",
    "ExtraAttackAddedRatio": "攻击增幅",
    "ExtraDefenceAddedRatio": "防御增幅",
    "ExtraSpeedAddedRatio": "速度增幅",
    "ExtraBackPowerAddedRatio": "后台强度",
    "ExtraFrontPowerAddedRatio": "前台强度",
    "ExtraShieldAddedRatio": "护盾量",
    "ExtraCriticalChanceBase": "暴击率",
    "ExtraCriticalDamageBase": "暴击伤害",
    "ExtraBreakDamageAddedRatio": "击破特攻",
    "ExtraHealRatioBase": "治疗量",
    "ExtraHealRatio": "治疗量",
    "ExtraHealAddedRatio": "治疗量",
    "ExtraSPAddedRatio": "战技点",
    "ExtraSP": "战技点",
    "ExtraInitSP": "初始战技点",
    "ExtraMaxSP": "战技点上限",
    "ExtraLuckChance": "幸运触发率",
    "ExtraLuckDamage": "幸运伤害",
    "ExtraQuantumResonance": "量子共鸣",
    "ExtraEnergyRatio": "能量恢复效率",
    "ExtraStatusProbabilityBase": "效果命中",
    "ExtraStatusResistanceBase": "效果抵抗",
    "ExtraElationDamageAddedRatio": "欢愉伤害",
    "ExtraUltraDamageAddedRatio": "终结技伤害",
    "ExtraInsertDamageAddedRatio": "追加攻击伤害",
    "ExtraDOTDamageAddedRatio": "持续伤害",
    "ExtraNormalDamageAddedRatio": "普攻伤害",
    "ExtraSkillDamageAddedRatio": "战技伤害",
    "ExtraElementDamageAddedRatio": "属性伤害",
    "ExtraShieldRatioBase": "护盾量",
}

_PROPERTY_HASH: dict[str, str] = {
    "ExtraHPAddedRatio": "4490645484602736566",
    "ExtraAttackAddedRatio": "3065193343111472680",
    "ExtraDefenceAddedRatio": "12182123284380739113",
    "ExtraSpeedAddedRatio": "489684199695943761",
    "ExtraBackPowerAddedRatio": "15986672417267787374",
    "ExtraFrontPowerAddedRatio": "12487213280167660625",
    "ExtraCriticalChanceBase": "3749186578161212190",
    "ExtraCriticalDamageBase": "11713281818392369370",
    "ExtraBreakDamageAddedRatio": "10757677414810090212",
    "ExtraHealRatioBase": "6870358963948712726",
    "ExtraSPAddedRatio": "916654773126239286",
    "ExtraSP": "916654773126239286",
    "ExtraEnergyRatio": "3035140785293426139",
    "ExtraStatusProbabilityBase": "9067200147197874531",
    "ExtraStatusResistanceBase": "13854752409155182035",
    "ExtraElationDamageAddedRatio": "12323117611190858109",
    "ExtraDOTDamageAddedRatio": "1353033608022187180",
}

def _property_name(base: str, textmap: "dict[str, str] | None") -> str:
    h = _PROPERTY_HASH.get(base)
    if textmap is not None and h:
        got = textmap.get(h, "")
        if got:
            return got
    if base in _PROPERTY_LABEL and not h:
        return "{PROP:" + base + "}"
    return _PROPERTY_LABEL.get(base) or base

def _property_label(match: "re.Match[str]", textmap: "dict[str, str] | None" = None) -> str:
    t = match.group(1)
    base = re.sub(r"\d+$", "", t)
    return _property_name(base, textmap) if base in _PROPERTY_LABEL or base in _PROPERTY_HASH \
        else (_PROPERTY_LABEL.get(t) or base)

def _property_label_from_tag(tag: str, textmap: "dict[str, str] | None" = None) -> str:
    m = re.search(r"type=(\w+)", tag)
    if not m:
        return ""
    t = m.group(1)
    base = re.sub(r"\d+$", "", t)
    return _property_name(base, textmap) if base in _PROPERTY_LABEL or base in _PROPERTY_HASH \
        else (_PROPERTY_LABEL.get(t) or base)

_ADJACENT_PROP_RE = re.compile(r"(?:<property\s+type=\w+[^>]*>){2,}")

def _process_adjacent_properties(text: str, textmap: "dict[str, str] | None" = None) -> str:
    def _replace_group(m: re.Match[str]) -> str:
        group = m.group(0)
        labels = [_property_label_from_tag(t, textmap) for t in re.findall(r"<property\s+[^>]+>", group)]
        after = text[m.end():]
        after_text_match = re.match(r"([^<]*)", after)
        after_text = after_text_match.group(1) if after_text_match else ""
        shared = re.split(r"[。；，、！？\.]", after_text)[0]
        if shared and any(lbl and lbl in shared for lbl in labels):
            return ""
        return "/".join(lbl for lbl in labels if lbl)

    return _ADJACENT_PROP_RE.sub(_replace_group, text)

def text_key_of(ref: Any) -> str | None:
    if isinstance(ref, dict):
        return str(ref["Hash"]) if "Hash" in ref else None
    if isinstance(ref, str):
        if not ref:
            return None
        if ref in _text_map:
            return ref
        h = str(xxhash.xxh64(ref).intdigest())
        return h if h in _text_map else None
    return None


def text_of_key(key: str, textmap: Any = None) -> str:
    table = _text_map if textmap is None else textmap
    return table.get(key, "")


def current_textmap() -> "dict[str, str]":
    return _text_map


def resolve_text(ref: Any, clean: bool = True) -> str:
    if ref is None:
        return ""

    key = text_key_of(ref)

    if key is not None:
        result = _text_map.get(key, "")
    elif isinstance(ref, str):
        result = ref
    elif isinstance(ref, dict):
        return ""
    else:
        result = str(ref)

    if clean:
        result = clean_text(result)

    if key and result:
        return TextRef(result, key if clean else raw_variant(key))
    return result
