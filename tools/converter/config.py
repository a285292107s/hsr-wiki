"""路径配置、枚举映射表、图片路径映射表。"""

from pathlib import Path

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
