import hashlib
import json
import logging
import subprocess
from pathlib import Path
from typing import Any

from config import CHARACTER_CONFIG_DIR, EXCEL_DIR, SOURCE_DIR, TEXTMAP_FILE, TEXTMAP_EN_FILE, OUTPUT_DIR

logger = logging.getLogger("converter")

STATE_FILE = Path(__file__).resolve().parent / ".converter-state.json"

MODULE_SOURCES: dict[str, list[str]] = {
    "paths": ["AvatarBaseType.json"],
    "elements": ["DamageType.json"],
    "properties": [],
    "items": ["ItemConfig.json", "ItemPurpose.json", "TextJoinConfig.json", "TextJoinItem.json"],
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
        str(TEXTMAP_EN_FILE),
    ],
    "light_cones": ["EquipmentConfig.json", "EquipmentSkillConfig.json"],
    "light_cone_detail": ["EquipmentConfig.json", "EquipmentSkillConfig.json",
                          "EquipmentPromotionConfig.json", "ItemConfigEquipment.json",
                          "AvatarEquipRecommend.json", "AvatarEquipRecommendLD.json"],
    "relics": ["RelicSetConfig.json", "RelicConfig.json", "RelicSetSkillConfig.json",
                "RelicDataInfo.json"],
    "relic_affixes": ["RelicMainAffixConfig.json", "RelicSubAffixConfig.json"],
    "monsters": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                 "MonsterCamp.json", "MonsterSkillConfig.json",
                 "MonsterStatusResistanceType.json"],
    "monster_detail": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                         "MonsterCamp.json", "MonsterSkillConfig.json",
                         "StageInvasionConfig.json", "HardLevelGroup.json",
                         "MonsterStatusResistanceType.json", "MonsterStatusConfig.json",
                         "MonsterDrop.json", "ItemConfig.json", "StageConfig.json",
                         "MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json",
                         "ExtraEffectConfig.json", "ActivityPanel.json",
                         "ActivityQuestRewardData.json",
                         "MonsterGuideConfig.json", "MonsterGuideTag.json",
                         "MonsterGuidePhase.json", "MonsterGuideSkill.json",
                         "MonsterGuideSkillText.json",
                         "EliteGroup.json",
                         "ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
                         "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
                         "ChallengePeakGroupConfig.json",
                         "ActivityTelevisionStage.json", "ActivityTelevisionLevel.json",
                         "ActivitySummonGroup.json", "ActivitySummonLevel.json",
                         "ActivityStarFightGroup.json", "StarFightStageConfig.json",
                         "FightFestStageInfo.json", "ElationBattleLevel.json",
                         "BoxingClubStage.json", "MappingInfo.json",
                         "CocoonConfig.json", "FarmElementConfig.json",
                         "StrongChallengeStage.json", "SwordTrainingExam.json",
                         "ChallengeGroupConfig.json", "ChallengeStoryGroupConfig.json",
                         "ChallengeBossGroupConfig.json",
                         "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
                         "ChallengeBossMazeTierce.json"],
    "monster_extra": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                       "MonsterDrop.json", "ItemConfig.json", "StageConfig.json",
                       "MonsterAtlasExtraPhase.json", "MonsterAtlasExtraPhases.json",
                       "ExtraEffectConfig.json", "MonsterSkillConfig.json",
                       "MonsterStatusConfig.json", "ActivityPanel.json",
                       "ActivityQuestRewardData.json",
                       "ActivityTelevisionStage.json", "ActivityTelevisionLevel.json",
                       "ActivitySummonGroup.json", "ActivitySummonLevel.json",
                       "ActivityStarFightGroup.json", "StarFightStageConfig.json",
                       "FightFestStageInfo.json", "ElationBattleLevel.json",
                       "BoxingClubStage.json", "ChallengeMazeConfig.json",
                       "ChallengeStoryMazeConfig.json", "ChallengeBossMazeConfig.json",
                       "ChallengePeakConfig.json", "MappingInfo.json",
                       "CocoonConfig.json", "FarmElementConfig.json",
                       "StrongChallengeStage.json", "SwordTrainingExam.json"],
    "monster_common": ["MonsterTemplateConfig.json", "MonsterConfig.json",
                        "MonsterCamp.json", "MonsterSkillConfig.json",
                        "HardLevelGroup.json", "EliteGroup.json",
                        "MonsterStatusResistanceType.json",
                        CHARACTER_CONFIG_DIR],
    "monster_guide": ["MonsterGuideConfig.json", "MonsterGuideTag.json",
                       "MonsterGuidePhase.json", "MonsterGuideSkill.json",
                       "MonsterGuideSkillText.json"],
    "endgame": ["ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
                 "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
                 "ScheduleDataChallengeMaze.json", "ScheduleDataChallengeStory.json",
                 "ScheduleDataChallengeBoss.json", "ScheduleDataGlobal.json",
                 "MazeBuff.json",
                 "MonsterTemplateConfig.json", "ChallengeTargetConfig.json",
                 "ChallengeGroupConfig.json", "ChallengeStoryGroupExtra.json",
                 "ChallengeBossGroupExtra.json", "ChallengeStoryMazeExtra.json",
                 "ChallengeMazeGroupExtra.json",
                 "ChallengeStoryGroupConfig.json", "ChallengeBossGroupConfig.json",
                 "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
                 "ChallengeBossMazeTierce.json", "ChallengeStoryTargetConfig.json",
                 "ChallengeBossTargetConfig.json", "ChallengePeakGroupConfig.json",
                 "ChallengePeakBossConfig.json", "BattleTargetConfig.json",
                 "StageConfig.json", "MonsterConfig.json", "MonsterCamp.json",
                 "MonsterSkillConfig.json", "ChallengeBadgeConfig.json",
                 "ChallengeGeneralConfig.json",
                 "StageInfiniteGroup.json", "StageInfiniteWaveConfig.json",
                 "StageInfiniteMonsterGroup.json",
                 "ChallengeMazeRewardLine.json", "ChallengeStoryRewardLine.json",
                 "ChallengeBossRewardLine.json", "ChallengePeakReward.json",
                 "RewardData.json",
                 "StageInvasionConfig.json", "MonsterGuideConfig.json",
                 "MonsterGuideTag.json", "MonsterGuidePhase.json",
                 "MonsterGuideSkill.json", "MonsterGuideSkillText.json",
                 "MonsterStatusResistanceType.json",
                 "HardLevelGroup.json", "EliteGroup.json"],
    "endgame_guide": ["IntroData.json", "ChallengeGroupConfig.json",
                       "ChallengeStoryGroupExtra.json", "ChallengeBossGroupExtra.json",
                       "ChallengePeakBossConfig.json"],
    "endgame_catalog": [
        str(OUTPUT_DIR / "maze.json"),
        str(OUTPUT_DIR / "maze_extra.json"),
        str(OUTPUT_DIR / "maze_boss.json"),
        str(OUTPUT_DIR / "maze_peak.json"),
    ],
    "currency": [
        "GridFightRoleBasicInfo.json", "AvatarConfig.json", "AvatarConfigLD.json",
        "AvatarSkillConfig.json", "AvatarSkillConfigLD.json",
        "GridFightRolePropertyConfig.json", "GridFightTraitBasicInfo.json", "GridFightRoleStar.json",
        "GridFightFrontSkill.json", "GridFightBackBESkillConfig.json",
        "GridFightTraitMazebuff.json", "GridFightTraitLayer.json",
        "GridFightBackRoleRank.json", "GridFightBackEquipment.json",
        "GridFightItems.json", "GridFightRoleRecommendEquip.json",
        "GridFightServantStar.json", "GridFightServantSkill.json",
        "GridFightBackSkillExtraDesc.json", "GridFightGenderOverride.json",
        "GridFightRoleBasicInfoOld.json",
    ],
    "currency_catalog": ["GridFightItems.json", "GridFightEquipment.json",
                          "GridFightEquipCategoryInfo.json", "GridFightEquipTag.json",
                          "GridFightEquipRecommendRole.json",
                          "AvatarConfig.json", "AvatarConfigLD.json",
                          "GridFightRoleBasicInfo.json", "GridFightTraitBasicInfo.json",
                          "GridFightRolePropertyConfig.json",
                          "GridFightTraitLayer.json", "GridFightTraitMazebuff.json",
                          "GridFightTraitLayerOld.json",
                          "GridFightTraitRemark.json", "GridFightAugment.json",
                          "GridFightConsumables.json", "GridFightForge.json",
                          "GridFightPortalBuff.json"],
    "achievements": ["AchievementData.json", "AchievementSeries.json",
                      "TextJoinConfig.json", "TextJoinItem.json"],
    "voracity": [
        "ActivityPanel.json", "ConstValueCommon.json",
        "ActivityVoracityInvasionPro.json", "ActivityVoracityInvasionBuf.json",
        "StageInvasionBuff.json", "StageInvasionConfig.json", "MazeBuff.json",
        "StatusConfig.json", "TutorialGuideData.json", "GridFightAffixConfig.json",
        "MonsterTemplateConfig.json", "MonsterConfig.json",
        "MonsterCamp.json", "MonsterSkillConfig.json",
        "MonsterStatusResistanceType.json",
        "ChallengeMazeConfig.json", "ChallengeStoryMazeConfig.json",
        "ChallengeBossMazeConfig.json", "ChallengePeakConfig.json",
        "ChallengeGroupConfig.json", "ChallengeStoryGroupConfig.json",
        "ChallengeBossGroupConfig.json", "ChallengePeakGroupConfig.json",
        "ChallengeMazeTierce.json", "ChallengeStoryMazeTierce.json",
        "ChallengeBossMazeTierce.json",
    ],
    "version": ["git:HEAD"],
}

def _file_sig(path: Path) -> str:
    try:
        st = path.stat()
        return f"{st.st_mtime_ns}:{st.st_size}"
    except OSError:
        return "missing"

def _dir_sig(directory: Path) -> str:
    if not directory.exists():
        return "missing"
    sigs = []
    for f in sorted(directory.rglob("*.json")):
        sigs.append(f"{f.name}:{_file_sig(f)}")
    return hashlib.md5("|".join(sigs).encode()).hexdigest()

def _git_sig(spec: str) -> str:
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
    sources = MODULE_SOURCES.get(module_name, [])
    if not sources:
        return "static"

    parts = []
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
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}

def save_state(state: dict[str, str]) -> None:
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

def should_skip(module_name: str, state: dict[str, str], force: bool = False) -> bool:
    if force:
        return False
    current = _module_sig(module_name)
    if current == "static":
        return module_name in state
    return state.get(module_name) == current

def update_state(module_name: str, state: dict[str, str]) -> None:
    state[module_name] = _module_sig(module_name)
