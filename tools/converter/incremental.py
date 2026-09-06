"""增量转换：基于源文件 mtime+size 跳过未变更模块。

状态文件存放于 tools/converter/.converter-state.json（已 gitignore）。
"""

import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from config import EXCEL_DIR, SOURCE_DIR, TEXTMAP_FILE, OUTPUT_DIR

logger = logging.getLogger("converter")

STATE_FILE = Path(__file__).resolve().parent / ".converter-state.json"

# 模块 → 依赖的源文件/目录（相对于 EXCEL_DIR 或绝对路径）
# 目录类型会递归收集所有 .json 文件的 mtime+size
# 注意：必须覆盖 converters/<module>.py 实际读取的全部源文件（含动态/可选加载），
# 否则源数据变更不会触发该模块重跑。tests/test_incremental.py 通过 AST 扫描
# 校验「代码中静态可见的 load_json 调用 ⊆ 本声明」，防止手写漂移。
MODULE_SOURCES: dict[str, list[str]] = {
    "paths": ["AvatarBaseType.json"],
    "elements": ["DamageType.json"],
    "properties": [],  # 纯静态映射，无源文件依赖
    "items": ["ItemConfig.json"],
    "characters": ["AvatarConfig.json", "AvatarConfigLD.json"],
    "character_detail": [
        "AvatarConfig.json", "AvatarConfigLD.json",
        "AvatarSkillConfig.json", "AvatarSkillConfigLD.json",
        "AvatarRankConfig.json", "AvatarRankConfigLD.json",
        "AvatarSkillTreeConfig.json", "AvatarSkillTreeConfigLD.json",
        "AvatarPromotionConfig.json", "AvatarPromotionConfigLD.json",
        "AvatarAtlas.json", "AvatarCamp.json", "StoryAtlas.json",
        "AvatarEquipRecommend.json", "AvatarEquipRecommendLD.json",
        "AvatarRelicRecommend.json", "AvatarRelicRecommendLD.json",
        "AvatarServantConfig.json", "AvatarServantSkillConfig.json",
        "TeamBuildConfig.json",
        "AvatarConfigEnhanced.json", "AvatarEnhancedHintConfig.json",
    ],
    "light_cones": ["EquipmentConfig.json", "EquipmentSkillConfig.json"],
    "light_cone_detail": ["EquipmentConfig.json", "EquipmentSkillConfig.json",
                          "EquipmentPromotionConfig.json", "ItemConfigEquipment.json"],
    "relics": ["RelicSetConfig.json", "RelicConfig.json", "RelicSetSkillConfig.json",
                "RelicDataInfo.json"],
    "relic_affixes": ["RelicMainAffixConfig.json", "RelicSubAffixConfig.json"],
    "monsters": ["MonsterTemplateConfig.json"],
    "monster_detail": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                         "MonsterCamp.json", "MonsterSkillConfig.json"],
    "monster_common": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                        "MonsterCamp.json", "MonsterSkillConfig.json"],
    "endgame": ["ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
                 "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
                 "ScheduleDataChallengeMaze.json", "ScheduleDataChallengeStory.json",
                 "ScheduleDataChallengeBoss.json", "MazeBuff.json",
                 "MonsterTemplateConfig.json", "ChallengeTargetConfig.json",
                 "ChallengeGroupConfig.json", "ChallengeStoryGroupExtra.json",
                 "ChallengeBossGroupExtra.json", "ChallengeStoryMazeExtra.json",
                 "ChallengeStoryGroupConfig.json", "ChallengeBossGroupConfig.json",
                 "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
                 "ChallengeBossMazeTierce.json", "ChallengeStoryTargetConfig.json",
                 "ChallengeBossTargetConfig.json", "ChallengePeakGroupConfig.json",
                 "ChallengePeakBossConfig.json", "BattleTargetConfig.json",
                 "StageConfig.json", "MonsterConfig.json", "MonsterCamp.json",
                 "MonsterSkillConfig.json", "ChallengeBadgeConfig.json",
                 "ChallengeBossMazeExtra.json", "ChallengeGeneralConfig.json"],
    # 目录卡轻量文件：由全量 maze*.json（OUTPUT_DIR）派生，全量文件变更即重跑
    "endgame_catalog": [
        str(OUTPUT_DIR / "maze.json"),
        str(OUTPUT_DIR / "maze_extra.json"),
        str(OUTPUT_DIR / "maze_boss.json"),
        str(OUTPUT_DIR / "maze_peak.json"),
    ],
    "currency": [
        "GridFightRoleBasicInfo.json", "AvatarConfig.json", "AvatarConfigLD.json",
        "GridFightRolePropertyConfig.json", "GridFightTraitBasicInfo.json", "GridFightRoleStar.json",
        "GridFightFrontSkill.json", "GridFightBackBESkillConfig.json",
        "GridFightTraitMazebuff.json", "GridFightTraitLayer.json",
        "GridFightBackRoleRank.json", "GridFightBackEquipment.json",
        "GridFightItems.json", "GridFightRoleRecommendEquip.json",
        "GridFightServantStar.json", "GridFightServantSkill.json",
        "GridFightBackSkillExtraDesc.json", "GridFightGenderOverride.json",
    ],
    "currency_catalog": ["GridFightItems.json", "GridFightEquipment.json",
                          "GridFightEquipCategoryInfo.json", "GridFightEquipTag.json",
                          "GridFightEquipRecommendRole.json", "AvatarConfig.json",
                          "GridFightRoleBasicInfo.json", "GridFightTraitBasicInfo.json",
                          "GridFightRolePropertyConfig.json",
                          "GridFightTraitLayer.json", "GridFightTraitMazebuff.json",
                          "GridFightTraitRemark.json", "GridFightAugment.json",
                          "GridFightConsumables.json", "GridFightForge.json",
                          "GridFightPortalBuff.json"],
    "achievements": ["AchievementData.json", "AchievementSeries.json",
                      "TextJoinConfig.json", "TextJoinItem.json"],
    "season": [],
    # 子模块 git 提交（无 ExcelOutput 文件依赖）：签名取 HEAD 提交哈希，
    # 子模块更新即触发重跑；与文件依赖共用签名拼接，见 _git_sig
    "version": ["git:HEAD"],
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


def _git_sig(spec: str) -> str:
    """git 引用签名：取子模块指定引用当前指向的提交哈希（子模块更新即变化）。"""
    ref = spec.removeprefix("git:")
    try:
        proc = subprocess.run(
            ["git", "-C", str(SOURCE_DIR), "rev-parse", ref],
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return "missing"
    if proc.returncode != 0:
        return "missing"
    return proc.stdout.strip()


def _module_sig(module_name: str) -> str:
    """计算模块当前源数据签名。"""
    sources = MODULE_SOURCES.get(module_name, [])
    if not sources:
        return "static"

    parts = []
    # TextMap 始终参与签名（文本变更影响所有模块）
    parts.append(f"TextMap:{_file_sig(TEXTMAP_FILE)}")

    for src in sources:
        if src.startswith("git:"):
            parts.append(f"{src}:{_git_sig(src)}")
            continue
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
