"""TextMap 加载与文本解析。"""

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
    """加载 TextMap 到内存。"""
    global _text_map
    _text_map = load_json(TEXTMAP_FILE)
    logger.info("已加载 TextMap（%s 条）", len(_text_map))

def ensure_textmap_en() -> None:
    """按需加载英文 TextMap（55.9MB，仅角色英文名等少量字段消费，不随 load_textmap 常驻）。"""
    global _text_map_en
    if not _text_map_en:
        _text_map_en = load_json(TEXTMAP_EN_FILE)
        logger.info("已加载 TextMapEN（%s 条）", len(_text_map_en))

def resolve_text_en(ref: Any) -> str:
    """从英文 TextMap 解析 Hash 引用。

    仅接受 Hash 对象（当前唯一消费方 = AvatarName）；未命中返回空串。
    源值为 `{NICKNAME}` 类占位符（开拓者，其显示名由玩家命名）时同样返回空串——
    占位符不是译名，禁止用它拼出「假英文名」。
    命中的文本仍走 `clean_text`：英文名同样带游戏内标签（银狼 LV.999 的
    `Silver Wolf LV.<unbreak>999</unbreak>`），漏清洗会让标签作为可见文本进 JSON。
    先判占位符再清洗：`clean_text` 会把 `{NICKNAME}` 替换成中文「开拓者」，
    顺序反了就会把占位符洗成一个假的英文名。
    """
    if not isinstance(ref, dict) or "Hash" not in ref:
        return ""
    text = _text_map_en.get(str(ref["Hash"]), "")
    return "" if text.startswith("{") else clean_text(text)

# 「开拓者」官方词条键（13 语言文本表均有：Trailblazer / 開拓者 / 개척자 / Первопроходец …）
TRAILBLAZER_KEY = "4036035618718239522"

# 性别变体标记 `{M#…}{F#…}`：转换器不知道玩家性别，而前端按出现顺序把两段都拼出来
# ⇒ 独占整段的变体只取第一支（否则会得到「TrailblazerTrailblazerin」）。
_GENDER_VARIANT = re.compile(r"\{([MF])#([^}]*)\}")

def _neutralize_gender(text: str) -> str:
    """独占整段的性别变体取第一支；句内变体保持原样（交给前端按现状处理）。"""
    if _GENDER_VARIANT.sub("", text).strip():
        return text
    first = _GENDER_VARIANT.search(text)
    return first.group(2) if first else text

def nickname_of(textmap: "dict[str, str] | None" = None) -> str:
    """当前语言的「开拓者」显示名；文本表缺该词条时回退中文（缺省语言行为不变）。"""
    table = _text_map if textmap is None else textmap
    return _neutralize_gender(table.get(TRAILBLAZER_KEY) or "开拓者")

def clean_text(text: str, textmap: "dict[str, str] | None" = None) -> str:
    """清洗游戏内文本标签，返回纯文本。

    `textmap` = **该文本所属语言**的文本表（缺省 = 缺省语言）：`{NICKNAME}` 这类占位符必须按
    语言取值，否则所有语言都会拿到中文名（本仓曾因此让 9 种语言包出现 568 处「开拓者」）。

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

# 属性类型 → 官方词条键（13 语言文本表均有）；**缺省语言的措辞以站内标签为准**，
# 官方表只在「非缺省语言」找不到站内措辞时使用（见 _property_name）。
# 未收录的 15 项（全伤害 / 护盾量 / 治疗量 / 初始战技点 / 战技点上限 / 幸运触发率 / 幸运伤害 /
# 量子共鸣 / 终结技伤害 / 追加攻击伤害 / 普攻伤害 / 战技伤害 / 属性伤害…）官方无对应词条 ⇒
# **发 `{PROP:<枚举键>}` 占位符**，由渲染端按 UI 词典取值（ADR 0053 方案 A，已实现）；
# `_PROPERTY_LABEL` 在这里只剩「哪些键属于自造措辞」这层信息。
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
    """属性名：有官方词条的按语言取官方文本；**自造措辞发 `{PROP:<枚举键>}` 占位符**。

    这 15 项（全伤害 / 量子共鸣 / 幸运触发率 / 护盾量 …）官方文本表里没有干净词条，
    译文只存在于 UI 词典（`prop.*`，见 ADR 0053 方案 A）⇒ 转换器不再落中文，而是落语言无关的
    占位符，由渲染端（`lib/html.ts` 与 `tools/gen-ai-endpoints.mjs`）按词典取值——否则这些中文会
    随语言包分发到 9 个非汉字语言里（实测 1395 条）。
    """
    h = _PROPERTY_HASH.get(base)
    if textmap is not None and h:
        got = textmap.get(h, "")
        if got:
            return got
    if base in _PROPERTY_LABEL and not h:
        return "{PROP:" + base + "}"
    return _PROPERTY_LABEL.get(base) or base

def _property_label(match: "re.Match[str]", textmap: "dict[str, str] | None" = None) -> str:
    """<property type=XXX> → 属性名（按语言）；未命中时回退到去后缀的 type 名。"""
    t = match.group(1)
    base = re.sub(r"\d+$", "", t)
    return _property_name(base, textmap) if base in _PROPERTY_LABEL or base in _PROPERTY_HASH \
        else (_PROPERTY_LABEL.get(t) or base)

def _property_label_from_tag(tag: str, textmap: "dict[str, str] | None" = None) -> str:
    """从完整 <property type=XXX ...> 标签提取属性名（按语言）。"""
    m = re.search(r"type=(\w+)", tag)
    if not m:
        return ""
    t = m.group(1)
    base = re.sub(r"\d+$", "", t)
    return _property_name(base, textmap) if base in _PROPERTY_LABEL or base in _PROPERTY_HASH \
        else (_PROPERTY_LABEL.get(t) or base)

_ADJACENT_PROP_RE = re.compile(r"(?:<property\s+type=\w+[^>]*>){2,}")

def _process_adjacent_properties(text: str, textmap: "dict[str, str] | None" = None) -> str:
    """处理相邻 property 标签组。

    游戏内相邻 property 标签显示为并排图标，后跟共享文本标签。
    若后续文本已包含属性名（如“前/后台强度”），则移除标签避免重复；
    若后续仅为标点，则插入属性名 + "/" 分隔。
    """
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
    """文本引用 → TextMap 键（不解析文本）；无法定位返回 None。

    与 `resolve_text` 的取值逻辑同一份实现（后者内部调用本函数）。组合器（见 textpack 的
    `composed_ref`）需要**键**而不是当时那份文本——它要按语言各自取值。
    """
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
    """按键取文本（可指定其它语言的文本表）；未命中返回空串。"""
    table = _text_map if textmap is None else textmap
    return table.get(key, "")


def current_textmap() -> "dict[str, str]":
    """当前已加载的文本表（缺省语言）。

    给「按语言组合」的组合器算一份**缺省语言**正文用（`textpack.composed_ref` 在 `--raw` 模式下
    直接写这份文本），避免组合实现里再硬编码一次缺省语言读取路径。
    """
    return _text_map


def resolve_text(ref: Any, clean: bool = True) -> str:
    """解析文本引用，支持 Hash 对象和字面量字符串。

    - Hash 对象: { "Hash": 6186714091647966180 } → 转字符串查 TextMap
    - 字面量字符串: "RelicDesc_1012" → 先直接查 TextMap，未命中则计算 xxhash64 再查
    - 纯字符串: 直接返回
    - None/空: 返回空字符串

    命中的文本返回 `TextRef`（str 子类，携带 TextMap 键）——转换器内既有用法（比较 / 排序 /
    拼接）不变，`utils.save_json` 在令牌模式下把它写成 `"$t:<键>"`，见 textpack.py。
    **未命中 TextMap 的引用返回普通 str**：那代表文案是转换器自己写死的，正是多语言化未完成的
    信号（由 `textpack.survey_residual_text` 盘点）。

    Args:
        ref: 文本引用
        clean: 是否清洗游戏内标签（默认 True）
    """
    if ref is None:
        return ""

    key = text_key_of(ref)

    if key is not None:
        result = _text_map.get(key, "")
    elif isinstance(ref, str):
        # 字面量字符串且 TextMap 未命中：原样返回（转换器自写文案，多语言化未完成的信号）
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
