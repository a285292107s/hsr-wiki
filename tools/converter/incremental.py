"""增量转换：基于源文件 mtime+size 跳过未变更模块。

状态文件存放于 tools/converter/.converter-state.json（已 gitignore）。
"""

import hashlib
import json
import logging
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, TEXTMAP_FILE

logger = logging.getLogger("converter")

STATE_FILE = Path(__file__).resolve().parent / ".converter-state.json"

# 模块 → 依赖的源文件/目录（相对于 EXCEL_DIR 或绝对路径）
# 目录类型会递归收集所有 .json 文件的 mtime+size
MODULE_SOURCES: dict[str, list[str]] = {
    "paths": ["AvatarBaseType.json"],
    "elements": ["DamageType.json"],
    "properties": [],  # 纯静态映射，无源文件依赖
    "items": ["ItemConfig.json", "ItemConfigAvatar.json", "ItemConfigAvatarPlayerIcon.json",
              "ItemConfigAvatarRank.json", "ItemConfigBook.json", "ItemConfigEquipment.json"],
    "characters": ["AvatarConfig.json", "AvatarConfigLD.json"],
    "character_ranks": ["AvatarRankConfig.json"],
    "character_skills": ["AvatarSkillConfig.json"],
    "character_detail": ["AvatarConfig.json", "AvatarConfigLD.json", "AvatarSkillTreeConfig.json",
                         "AvatarPromotionConfig.json", "AvatarPromotionConfigLD.json"],
    "light_cones": ["EquipmentConfig.json"],
    "light_cone_detail": ["EquipmentConfig.json", "EquipmentSkillConfig.json",
                          "EquipmentPromotionConfig.json"],
    "relics": ["RelicConfig.json", "RelicSetConfig.json", "RelicDisplayConfig.json"],
    "relic_affixes": ["RelicMainAffixConfig.json", "RelicSubAffixConfig.json"],
    "monsters": ["MonsterConfig.json", "NPCMonsterConfig.json"],
    "endgame": ["RogueEndlessStageConfig.json"],
    "currency": [],  # 本地子模块数据
    "season": [],
}


def _file_sig(path: Path) -> str:
    """文件签名：mtime_ns:size（快速，无需读内容）。"""
    try:
        st = path.stat()
        return f"{st.st_mtime_ns}:{st.st_size}"
    except OSError:
        return "missing"


def _dir_sig(directory: Path) -> str:
    """目录签名：所有 .json 文件签名拼接的 md5（跨进程稳定）。"""
    if not directory.exists():
        return "missing"
    sigs = []
    for f in sorted(directory.rglob("*.json")):
        sigs.append(f"{f.name}:{_file_sig(f)}")
    return hashlib.md5("|".join(sigs).encode()).hexdigest()


def _module_sig(module_name: str) -> str:
    """计算模块当前源数据签名。"""
    sources = MODULE_SOURCES.get(module_name, [])
    if not sources:
        return "static"

    parts = []
    # TextMap 始终参与签名（文本变更影响所有模块）
    parts.append(f"TextMap:{_file_sig(TEXTMAP_FILE)}")

    for src in sources:
        p = Path(src)
        if not p.is_absolute():
            p = EXCEL_DIR / p
        if p.is_dir():
            parts.append(f"{src}:{_dir_sig(p)}")
        else:
            parts.append(f"{src}:{_file_sig(p)}")

    return "|".join(parts)


def load_state() -> dict[str, str]:
    """加载上次转换状态。"""
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_state(state: dict[str, str]) -> None:
    """保存转换状态。"""
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def should_skip(module_name: str, state: dict[str, str], force: bool = False) -> bool:
    """判断模块是否可跳过（源数据未变更）。"""
    if force:
        return False
    current = _module_sig(module_name)
    if current == "static":
        # 无源文件依赖的模块：仅在首次运行时执行
        return module_name in state
    return state.get(module_name) == current


def update_state(module_name: str, state: dict[str, str]) -> None:
    """模块转换成功后更新状态。"""
    state[module_name] = _module_sig(module_name)
