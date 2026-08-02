"""TextMap 加载与文本解析。"""

import logging
import re
from typing import Any

import xxhash

from utils import load_json
from config import TEXTMAP_FILE

logger = logging.getLogger("converter")

_text_map: dict[str, str] = {}


def load_textmap() -> None:
    """加载 TextMap 到内存。"""
    global _text_map
    _text_map = load_json(TEXTMAP_FILE)
    logger.info("已加载 TextMap（%s 条）", len(_text_map))


def clean_text(text: str) -> str:
    """清洗游戏内文本标签，返回纯文本。

    处理内容：
    - {NICKNAME} → 开拓者
    - {SPACE} → 空格
    - {RUBY_...} 标签 → 移除
    - <property type=XXX ...> → 友好属性名（羁绊/技能效果属性，如"全伤害""生命值"）
    - <color=...>...</color> → 保留文字，去掉标签
    - <unbreak>...</unbreak> → 保留文字，去掉标签
    - 其他未知标签 → 移除
    """
    if not text:
        return ""

    # 替换占位符
    text = text.replace("{NICKNAME}", "开拓者")
    text = text.replace("{SPACE}", " ")

    # 移除 RUBY 标签
    text = re.sub(r"\{RUBY_[EB]#(?:[^}]*)\}", "", text)

    # <property type=XXX ...> → 友好属性名（自走棋羁绊/技能的效果属性引用）
    # 原标签无内容、无闭合，直接删除会导致描述残缺（如“的和提高”丢失属性名）
    # 相邻 property 标签组：检查后续文本是否已含属性名，避免重复
    text = _process_adjacent_properties(text)
    text = re.sub(r"<property\s+type=(\w+)[^>]*>", _property_label, text)

    # 处理 <color=...>...</color> → 保留文字
    text = re.sub(r"<color=([^>]+)>", "", text)
    text = re.sub(r"</color>", "", text)

    # 处理 <unbreak>...</unbreak> → 保留文字
    text = re.sub(r"</?unbreak>", "", text)

    # 移除其他未知 HTML 标签（保留 <u> 标签用于下划线，如不需要可移除）
    # 这里保留纯文字，移除所有标签
    text = re.sub(r"<[^>]+>", "", text)

    return text


# <property type=XXX> 标签的属性名映射（去“提高”后缀，用名词形式以适配“的X和Y提高”句式）
# key 为去末尾数字后缀后的属性类型（如 ExtraHPAddedRatio1 → ExtraHPAddedRatio）
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


def _property_label(match: "re.Match[str]") -> str:
    """<property type=XXX> → 友好属性名；未命中时回退到去后缀的 type 名。"""
    t = match.group(1)
    base = re.sub(r"\d+$", "", t)  # 去末尾数字后缀（层级版本号）
    return _PROPERTY_LABEL.get(base) or _PROPERTY_LABEL.get(t) or base


def _property_label_from_tag(tag: str) -> str:
    """从完整 <property type=XXX ...> 标签提取属性名。"""
    m = re.search(r"type=(\w+)", tag)
    if not m:
        return ""
    t = m.group(1)
    base = re.sub(r"\d+$", "", t)
    return _PROPERTY_LABEL.get(base) or _PROPERTY_LABEL.get(t) or base


# 匹配一组紧密相邻的 property 标签（2个或以上）
_ADJACENT_PROP_RE = re.compile(r"(?:<property\s+type=\w+[^>]*>){2,}")


def _process_adjacent_properties(text: str) -> str:
    """处理相邻 property 标签组。

    游戏内相邻 property 标签显示为并排图标，后跟共享文本标签。
    若后续文本已包含属性名（如“前/后台强度”），则移除标签避免重复；
    若后续仅为标点，则插入属性名 + "/" 分隔。
    """
    def _replace_group(m: re.Match[str]) -> str:
        group = m.group(0)
        # 提取组内所有属性名
        labels = [_property_label_from_tag(t) for t in re.findall(r"<property\s+[^>]+>", group)]
        # 查看组后文本（到下一个标签或字符串结尾）
        after = text[m.end():]
        after_text_match = re.match(r"([^<]*)", after)
        after_text = after_text_match.group(1) if after_text_match else ""
        # 取后续文本中到第一个标点前的部分作为“共享标签”
        shared = re.split(r"[。；，、！？\.]", after_text)[0]
        if shared and any(lbl and lbl in shared for lbl in labels):
            # 后续文本已含属性名，移除标签组（避免重复）
            return ""
        # 后续无属性名文本，插入 labels 以 "/" 连接
        return "/".join(lbl for lbl in labels if lbl)

    return _ADJACENT_PROP_RE.sub(_replace_group, text)



def resolve_text(ref: Any, clean: bool = True) -> str:
    """解析文本引用，支持 Hash 对象和字面量字符串。

    - Hash 对象: { "Hash": 6186714091647966180 } → 转字符串查 TextMap
    - 字面量字符串: "RelicDesc_1012" → 先直接查 TextMap，未命中则计算 xxhash64 再查
    - 纯字符串: 直接返回
    - None/空: 返回空字符串

    Args:
        ref: 文本引用
        clean: 是否清洗游戏内标签（默认 True）
    """
    if ref is None:
        return ""

    result = ""

    # 空字典 / 无 Hash 的字典：视为空引用
    if isinstance(ref, dict):
        if "Hash" in ref:
            key = str(ref["Hash"])
            result = _text_map.get(key, "")
        else:
            return ""

    # 字面量字符串
    elif isinstance(ref, str):
        if not ref:
            return ""
        # 先直接查 TextMap
        if ref in _text_map:
            result = _text_map[ref]
        else:
            # 未命中，计算 xxhash64 再查
            h = xxhash.xxh64(ref).intdigest()
            key = str(h)
            if key in _text_map:
                result = _text_map[key]
            else:
                # 都未命中，返回原文
                result = ref

    else:
        result = str(ref)

    if clean:
        result = clean_text(result)

    return result
