"""路径配置、枚举映射表、图片路径映射表。"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Callable, Optional

# 项目根目录
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# 源数据目录
SOURCE_DIR = PROJECT_ROOT / "vendor" / "TurnBasedGameData"
EXCEL_DIR = SOURCE_DIR / "ExcelOutput"
TEXTMAP_DIR = SOURCE_DIR / "TextMap"

# 输出目录
OUTPUT_DIR = PROJECT_ROOT / "public" / "data" / "cn"

# TextMap 语言文件
TEXTMAP_FILE = TEXTMAP_DIR / "TextMapCHS.json"

# 稀有度映射
RARITY_MAP = {
    "CombatPowerAvatarRarityType4": 4,
    "CombatPowerAvatarRarityType5": 5,
    "CombatPowerLightconeRarity3": 3,
    "CombatPowerLightconeRarity4": 4,
    "CombatPowerLightconeRarity5": 5,
    "CombatPowerRelicRarity2": 2,
    "CombatPowerRelicRarity3": 3,
    "CombatPowerRelicRarity4": 4,
    "CombatPowerRelicRarity5": 5,
    "SuperRare": 5,
    "VeryRare": 4,
    "Rare": 3,
    "Normal": 2,
    "NotNormal": 1,
}

# 命途英文 → 中文名（从 AvatarBaseType.json 的 BaseTypeText Hash 解析）
# 这里作为 fallback，实际优先从源数据解析
PATH_NAME_FALLBACK = {
    "Warrior": "毁灭",
    "Rogue": "巡猎",
    "Mage": "智识",
    "Shaman": "同谐",
    "Warlock": "虚无",
    "Knight": "存护",
    "Priest": "丰饶",
    "Memory": "记忆",
    "Elation": "欢愉",
}

# 属性英文 → 中文名（从 DamageType.json 的 DamageTypeName Hash 解析）
ELEMENT_NAME_FALLBACK = {
    "Physical": "物理",
    "Fire": "火",
    "Ice": "冰",
    "Thunder": "雷",
    "Wind": "风",
    "Quantum": "量子",
    "Imaginary": "虚数",
    "Stellar": "星",
}

# 技能 AttackType → 目标 type 枚举
SKILL_TYPE_MAP = {
    "MazeNormal": "Maze",
    "Maze": "Maze",
    "Normal": "Normal",
    "BPSkill": "BPSkill",
    "Ultra": "Ultra",
}

# 遗器部位映射
RELIC_TYPE_MAP = {
    "HEAD": "头部",
    "HAND": "手部",
    "BODY": "躯干",
    "FOOT": "脚部",
    "NECK": "位面球",
    "OBJECT": "连结绳",
}

# 属性类型映射（自建，源数据中无对应文件）
PROPERTY_MAP = {
    "HPDelta": "生命值",
    "HPAddedRatio": "生命值百分比",
    "AttackDelta": "攻击力",
    "AttackAddedRatio": "攻击力百分比",
    "DefenceDelta": "防御力",
    "DefenceAddedRatio": "防御力百分比",
    "SpeedDelta": "速度",
    "SpeedAddedRatio": "速度百分比",
    "CriticalChanceBase": "暴击率",
    "CriticalDamageBase": "暴击伤害",
    "HealRatioBase": "治疗量",
    "StatusProbabilityBase": "效果命中",
    "StatusResistanceBase": "效果抵抗",
    "BreakDamageAddedRatioBase": "击破特攻",
    "SPRatioBase": "能量恢复效率",
    "MaxSP": "最大战技点",
    "AllDamageReduce": "减伤",
    "PhysicalAddedRatio": "物理伤害提高",
    "FireAddedRatio": "火属性伤害提高",
    "IceAddedRatio": "冰属性伤害提高",
    "ThunderAddedRatio": "雷属性伤害提高",
    "WindAddedRatio": "风属性伤害提高",
    "QuantumAddedRatio": "量子属性伤害提高",
    "ImaginaryAddedRatio": "虚数属性伤害提高",
}

# 图片路径映射表
ICON_PATH_MAP = {
    "SpriteOutput/AvatarIcon/Avatar/": "icon/character/",
    "SpriteOutput/AvatarRoundIcon/Avatar/": "icon/character_round/",
    "SpriteOutput/AvatarMiniIcon/": "icon/character_mini/",
    "SpriteOutput/AvatarDrawCardResult/": "icon/character_drawcard/",
    "SpriteOutput/AvatarIconTeam/": "icon/character_team/",
    "SpriteOutput/AvatarCutinFigures/": "icon/character_cutin/",
    "SpriteOutput/AvatarCutinBg/": "icon/character_cutin_bg/",
    "SpriteOutput/AvatarDrawCard/": "icon/character_drawcard_front/",
    "SpriteOutput/LightConeMediumIcon/": "icon/light_cone/",
    "SpriteOutput/LightConeMaxFigures/": "icon/light_cone_figure/",
    "SpriteOutput/ItemIcon/": "icon/item/",
    "SpriteOutput/ItemFigures/": "icon/item_figure/",
    "SpriteOutput/ItemCurrency/": "icon/item_currency/",
    "SpriteOutput/SkillIcons/": "icon/skill/",
    "SpriteOutput/AvatarProfessionTattoo/Profession/": "icon/path/",
    "SpriteOutput/ProfessionIconMiddle/": "icon/path_middle/",
    "SpriteOutput/ProfessionIconSmall/": "icon/path_small/",
    "SpriteOutput/UI/Nature/IconAttribute/": "icon/element/",
    "SpriteOutput/UI/Nature/IconNatureColor/": "icon/element_color/",
    "SpriteOutput/UI/Nature/IconNatureForWeak/": "icon/element_weak/",
    "SpriteOutput/IconDamageType/": "icon/element_simple/",
    "SpriteOutput/TalkIcon/ProfessionIcon/": "icon/path_talk/",
    "SpriteOutput/LightConeFigures/DecoLightCone/": "icon/light_cone_frame/",
}


# ──────────────────────────────────────────────────────────
# 官方 StarRailTextures 仓库相对路径规则（事实源：tools/check-sr-textures.mjs）
# 键 = ICON_PATH_MAP 中对应的 SpriteOutput 前缀
# 值 = 规则函数：原始文件名（含 .png）→ 官方相对路径字符串；返回 None 表示回退旧短路径格式
# ──────────────────────────────────────────────────────────

def _stem(filename: str) -> str:
    """去掉末尾扩展名（支持 .png / .webp / .jpg 等）。"""
    return filename.rsplit(".", 1)[0] if "." in filename else filename


_PROFESSION_SPELLING = {
    "priest": "Pirest",
    "elation": "Joy",
}
"""官方仓库拼写差异（数据源：ProfessionIconMiddle 目录）。"""


_SKILL_ID_RE = re.compile(r"\d+")
"""技能图标文件名中角色 ID 提取正则（第一个出现的数字串）。"""


def _rule_strip_png(subdir: str, extra_dir: str = "") -> Callable[[str], str]:
    """通用规则：去扩展名 → 拼子目录前缀 → {subdir}[/{extra_dir}]/{stem}.png。"""
    if extra_dir:
        return lambda f: f"{subdir}/{extra_dir}/{_stem(f)}.png"
    return lambda f: f"{subdir}/{_stem(f)}.png"


def _rule_element(f: str) -> Optional[str]:
    # 输入：SpriteOutput/IconDamageType/IconDamageTypeIce.png → IconDamageTypeIce.png
    stem = _stem(f)  # IconDamageTypeIce
    damage_type = stem.removeprefix("IconDamageType")  # Ice
    if not damage_type:
        return None
    cap = damage_type[0].upper() + damage_type[1:].lower() if damage_type else damage_type
    return f"icondamagetype/IconDamageType{cap}.png"


def _rule_pathicon(f: str) -> Optional[str]:
    # 输入：SpriteOutput/ProfessionIconMiddle/IconProfessionPriestMiddle.png → IconProfessionPriestMiddle.png
    stem = _stem(f)  # IconProfessionPriestMiddle
    if not (stem.startswith("IconProfession") and stem.endswith("Middle")):
        return None
    profession = stem[len("IconProfession"):-len("Middle")]  # Priest
    if not profession:
        return None
    mapped = _PROFESSION_SPELLING.get(profession.lower(), profession)
    return f"professioniconmiddle/IconProfession{mapped}Middle.png"


def _rule_skillicons(f: str) -> Optional[str]:
    """输入：SpriteOutput/SkillIcons/Avatar/ 去掉前缀后 = {charId}/SkillIcon_{charId}_{Type|RankN}.png。
    输出：skillicons/avatar/{id}/{stem_filename}.png；若结构不符返回 None 回退 legacy。
    """
    parts = f.split("/")
    if len(parts) < 2:
        return None
    char_id = parts[0]
    if not _SKILL_ID_RE.fullmatch(char_id):
        return None
    filename_stem = _stem(parts[-1])
    if not filename_stem:
        return None
    return f"skillicons/avatar/{char_id}/{filename_stem}.png"


def _rule_itemfigures(f: str) -> str:
    # check-sr-textures.mjs: itemfigures/${f}.png → 直接 stem（数字 id / 物品 basename）
    return f"itemfigures/{_stem(f)}.png"


def _rule_relicfigures(f: str) -> str:
    """Q4 选 C：IconRelicBody 等通用部位图标也直接输出，404 交给前端 CSS 占位。"""
    return f"relicfigures/{_stem(f)}.png"


def _rule_trace(f: str) -> str:
    return f"ui/avatar/icon/{_stem(f)}.png"


# SpriteOutput 前缀 → 规则函数；未注册的前缀 map_official_icon_path 会自动回退旧短路径
OFFICIAL_ICON_RULES: dict[str, Callable[[str], Optional[str]]] = {
    # 角色头像（方 + 圆）
    "SpriteOutput/AvatarIcon/Avatar/":        _rule_strip_png("avatarshopicon", extra_dir="avatar"),
    "SpriteOutput/AvatarRoundIcon/Avatar/":   _rule_strip_png("avatarroundicon", extra_dir="avatar"),
    # 立绘抽卡正面
    "SpriteOutput/AvatarDrawCard/":           _rule_strip_png("avatardrawcard"),
    # 光锥中图标
    "SpriteOutput/LightConeMediumIcon/":      _rule_strip_png("lightconemediumicon"),
    # 物品：图标 + 大图（都走 itemfigures/item/）
    "SpriteOutput/ItemIcon/":                 _rule_itemfigures,
    "SpriteOutput/ItemFigures/":              _rule_itemfigures,
    # 技能 / 星魂（都在 SpriteOutput/SkillIcons/Avatar/{id}/ 目录下）
    "SpriteOutput/SkillIcons/Avatar/":   _rule_skillicons,
    # 命途（ProfessionIconMiddle 对应 pathicon 分类；Small/Large/Talk 未注册）
    "SpriteOutput/ProfessionIconMiddle/":     _rule_pathicon,
    # 元素：IconDamageType 前缀对应 element 分类
    "SpriteOutput/IconDamageType/":           _rule_element,
    # 行迹图标（AvatarSkillTree 不在旧 ICON_PATH_MAP 中，未来如有新增前缀可在此注册）
    # 怪物：中图标 + 大图
    "SpriteOutput/MonsterIcon/":              _rule_strip_png("monstermiddleicon"),
    "SpriteOutput/MonsterFigure/":            _rule_strip_png("monsterfigure"),
    # 遗器图标
    # "SpriteOutput/RelicIcons/":             _rule_relicfigures,
    # 行迹：AvatarSkillTree → trace
    # "SpriteOutput/AvatarSkillTree/":        _rule_trace,
    # 成就图标
    # "SpriteOutput/AchievementIcon/":        _rule_strip_png("achievement"),
}

